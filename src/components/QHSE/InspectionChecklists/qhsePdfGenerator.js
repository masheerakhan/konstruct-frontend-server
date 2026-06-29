/*
---
QHSE MIGRATION NOTE
File: qhsePdfGenerator.js

Purpose: Frontend PDF report generator for completed QHSE Inspection Checklists. Generates a signed PDF based on instance and template data.

Workflow:
PDF Export

Service:
QHSEMicroService (8004)

Migration Reason: Re-wired getMediaUrl resolving to accept absolute URIs from the backend instead of hardcoding the legacy ChecklistMicroService port 8001.

Related Files: inspectionChecklistApi.js
----------------------------------------
*/
// QHSE CHECKLIST MODULE
// Purpose:
// Frontend PDF report generator for completed QHSE Inspection Checklists.
// Fetches instance + template data, builds an HTML layout with logos, header info,
// instruction images/text, checkpoint answers, photos, and tri-role signatures,
// then converts to PDF using html2pdf.js.
// Screen: Triggered from QHSE Checklists Dashboard – Download PDF button.
import html2pdf from "html2pdf.js";
import {
  fetchChecklistInstanceDetail,
  fetchInspectionChecklistDetail,
} from "./inspectionChecklistApi";
import { getProjectsByOrgOwnership } from "../../../api";
import HorizonLogo from "../Transmittal/assets/Horizon-logo.png";

/**
 * Resolves the absolute media URL for localhost or production.
 */
export const getMediaUrl = (path) => {
  if (!path) return "";
  if (path.startsWith("http") || path.startsWith("blob:") || path.startsWith("data:")) return path;
  
  const base =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
      ? "http://127.0.0.1:8001"
      : `${window.location.protocol}//${window.location.host}`;
      
  return `${base}/${path.startsWith("/") ? path.slice(1) : path}`;
};

/**
 * Resolves absolute URL for frontend assets (like imported images)
 */
export const resolveFrontEndAssetUrl = (assetPath) => {
  if (!assetPath) return "";
  if (assetPath.startsWith("data:") || assetPath.startsWith("http")) return assetPath;
  return `${window.location.origin}${assetPath.startsWith("/") ? assetPath : "/" + assetPath}`;
};

/**
 * Preloads all image elements in a container to ensure they are fully loaded
 * before canvas capture.
 */
const preloadAllImages = async (container) => {
  const images = Array.from(container.getElementsByTagName("img"));
  const promises = images.map((img) => {
    return new Promise((resolve) => {
      if (img.complete) {
        resolve();
      } else {
        img.onload = () => resolve();
        img.onerror = () => {
          console.warn("Failed to preload image in PDF:", img.src);
          resolve();
        };
      }
    });
  });
  await Promise.all(promises);
};

/**
 * Generates and downloads the high-fidelity PDF from the frontend.
 */
export async function downloadChecklistReportPdfFrontend(instanceId, orgId = null) {
  // Robust fallback for orgId
  let resolvedOrgId = orgId;
  if (!resolvedOrgId) {
    try {
      const user =
        JSON.parse(localStorage.getItem("USER_DATA") || "null") ||
        JSON.parse(localStorage.getItem("userData") || "null");
      resolvedOrgId =
        user?.org ||
        user?.organization_id ||
        user?.org_id ||
        localStorage.getItem("ORG_ID") ||
        localStorage.getItem("ACTIVE_ORG_ID") ||
        null;
    } catch {}
  }

  // 1. Fetch checklist details
  // NOTE: Do NOT pass orgId here — the retrieve endpoint authenticates via JWT
  // and looks up by PK. Passing org_id causes a multi-tenant filter mismatch (404)
  // when the user's active org differs from the checklist's owning org.
  const instance = await fetchChecklistInstanceDetail(instanceId);
  if (!instance) {
    throw new Error("Failed to retrieve checklist instance details.");
  }

  // 2. Fetch template details
  const template = await fetchInspectionChecklistDetail(instance.safety_template_id);
  if (!template) {
    throw new Error("Failed to retrieve template details.");
  }

  // 3. Resolve project name
  let projectName = "Horizon Industrial Parks";
  if (instance.project_id) {
    try {
      const res = await getProjectsByOrgOwnership(resolvedOrgId);
      if (res && res.data) {
        const p = res.data.find((proj) => String(proj.id) === String(instance.project_id));
        if (p) {
          projectName = p.name;
        }
      }
    } catch (err) {
      console.error("Error fetching project name for PDF:", err);
    }
  }

  // 4. Resolve logo URLs
  const leftLogo = template.report_logo ? getMediaUrl(template.report_logo) : "";
  const rightLogo = template.report_logo_right ? getMediaUrl(template.report_logo_right) : "";

  // 5. Build instructional text & media HTML
  const rawInstructionText = (template.instruction_text || "").trim();
  const instructionHtml = rawInstructionText
    ? `
    <div style="margin-bottom: 15px; padding: 10px 12px; border: 1px solid #000; background-color: #ffffff; font-family: Arial, sans-serif; page-break-inside: avoid; text-align: left; box-sizing: border-box; width: 100%;">
      <div style="font-weight: bold; font-size: 11px; margin-bottom: 5px; text-transform: uppercase; color: #000;">Instructions</div>
      <div style="font-size: 11px; color: #000; line-height: 1.5; white-space: pre-wrap;">${rawInstructionText}</div>
    </div>
  `
    : "";

  const mediaUrls = template.instructional_media_urls || [];
  const mediaHtml = mediaUrls
    .map(
      (url) => `
      <img src="${getMediaUrl(url)}" style="flex: 1; max-height: 180px; min-width: 0; object-fit: cover; border: 1px solid #e2e8f0; border-radius: 4px;" />
    `
    )
    .join("");

  const mediaSection = mediaHtml
    ? `
    <div style="text-align: center; margin-bottom: 15px; padding: 10px; border: 1px solid #000; background-color: #ffffff; page-break-inside: avoid; box-sizing: border-box; width: 100%;">
      
      <div style="display: flex; flex-direction: row; justify-content: space-between; align-items: stretch; gap: 10px; width: 100%;">
        ${mediaHtml}
      </div>
    </div>
  `
    : "";

  const combinedInstructionsSection = [mediaSection, instructionHtml].filter(Boolean).join("\n");

  // 6. Build chunked checkpoints tables HTML
  const itemsList = instance.items || [];
  
  // Reduce rows per page slightly to create a safety margin at the bottom, 
  // preventing fractional height bleeding into the next page canvas slice.
  const PAGE_1_LIMIT = 9;
  const PAGE_N_LIMIT = 22;
  const chunkedTablesHtml = [];
  
  let currentChunkRows = [];
  let currentLimit = PAGE_1_LIMIT;
  
  for (let i = 0; i < itemsList.length; i++) {
    const item = itemsList[i];
    const idx = i;

    const submission = item.submissions?.[0] || {};
    const rawAns = (submission.latest_maker_answer || submission.answer || "").trim().toLowerCase();
    const isYes = rawAns === "yes" || rawAns === "safe" || rawAns === "satisfactory" || rawAns === "pass";
    const isNo = rawAns === "no" || rawAns === "unsafe" || rawAns === "unsatisfactory" || rawAns === "fail";
    const isNa = rawAns === "n/a" || rawAns === "na" || rawAns === "not applicable";

    let remarkText = submission.maker_remarks || submission.latest_maker_remarks || "";
    if (!remarkText && submission.checker_remarks && submission.checker_remarks !== instance.remarks) {
      remarkText = submission.checker_remarks;
    }
    let remarksCellContent = `<div>${remarkText || "—"}</div>`;

    const rowHtml = `
      <tr style="page-break-inside: avoid;">
        <td style="border: 1px solid #000; padding: 6px; text-align: center; vertical-align: middle; font-family: sans-serif;">${idx + 1}</td>
        <td style="border: 1px solid #000; padding: 6px; font-weight: 500; font-family: sans-serif; text-align: left; vertical-align: middle;">${item.title || item.text}</td>
        <td style="border: 1px solid #000; padding: 6px; text-align: center; vertical-align: middle; font-weight: bold; font-size: 14px; color: #000; font-family: sans-serif;">${isYes ? "✓" : ""}</td>
        <td style="border: 1px solid #000; padding: 6px; text-align: center; vertical-align: middle; font-weight: bold; font-size: 14px; color: #000; font-family: sans-serif;">${isNo ? "✓" : ""}</td>
        <td style="border: 1px solid #000; padding: 6px; text-align: center; vertical-align: middle; font-weight: bold; font-size: 12px; color: #000; font-family: sans-serif;">${isNa ? "✓" : ""}</td>
        <td style="border: 1px solid #000; padding: 6px; font-family: sans-serif; text-align: left; vertical-align: middle;">${remarksCellContent}</td>
      </tr>
    `;

    currentChunkRows.push(rowHtml);

    const remaining = itemsList.length - 1 - i;
    const shouldBreak = 
        (currentChunkRows.length >= currentLimit) || 
        (currentChunkRows.length >= currentLimit - 1 && remaining === 1);

    if (shouldBreak && remaining > 0) {
      chunkedTablesHtml.push(currentChunkRows.join(""));
      currentChunkRows = [];
      currentLimit = PAGE_N_LIMIT; // switch to page N limit
    }
  }
  
  if (currentChunkRows.length > 0) {
    chunkedTablesHtml.push(currentChunkRows.join(""));
  }

  const tablesHtml = chunkedTablesHtml.map((rows, cIdx) => {
    // Explicitly place page-break BEFORE the chunk (except first)
    const breakHtml = cIdx > 0 ? `<div class="html2pdf__page-break" style="page-break-before: always; break-before: page; margin: 0; padding: 0;"></div>` : "";
    
    const theadHtml = cIdx === 0 ? `
        <thead>
          <tr style="background-color: #FFCC00; font-weight: bold; text-align: center;">
            <th style="border: 1px solid #000; padding: 8px; text-align: center;">Sl.</th>
            <th style="border: 1px solid #000; padding: 8px; text-align: center;">Checkpoints</th>
            <th style="border: 1px solid #000; padding: 8px; text-align: center;">Yes</th>
            <th style="border: 1px solid #000; padding: 8px; text-align: center;">No</th>
            <th style="border: 1px solid #000; padding: 8px; text-align: center;">N/A</th>
            <th style="border: 1px solid #000; padding: 8px; text-align: center;">Remarks</th>
          </tr>
        </thead>
    ` : "";

    return `
      ${breakHtml}
      <table style="width: 100%; table-layout: fixed; border-collapse: collapse; border: 1px solid #000; font-size: 11px; margin-bottom: 15px; page-break-inside: auto; margin-top: 0;">
        <colgroup>
          <col style="width: 6%;">
          <col style="width: 54%;">
          <col style="width: 7%;">
          <col style="width: 7%;">
          <col style="width: 7%;">
          <col style="width: 19%;">
        </colgroup>
        ${theadHtml}
        <tbody>
          ${rows}
        </tbody>
      </table>
    `;
  }).join("");

  // 7. Resolve Signatures
  const makerSig = instance.maker_signature ? getMediaUrl(instance.maker_signature) : "";
  const checkerSig = instance.checker_signature ? getMediaUrl(instance.checker_signature) : "";
  const supervisorSig = instance.supervisor_signature ? getMediaUrl(instance.supervisor_signature) : "";

  const meta = instance.report_header_meta || instance.safety_report_meta || {};
  const location = meta.location || "N/A";
  const contractor = meta.name_of_contractor || "N/A";
  const machineNo = meta.make_model || meta.identification_no || "N/A";
  const dateOfInspection = meta.date_of_inspection || new Date(instance.created_at).toISOString().split("T")[0];
  const reportNo = instance.safety_report_no || `#${instance.id}`;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; padding: 10px; color: #000;">
      <style>
        * {
          box-sizing: border-box;
        }
        table {
          width: 100%;
          max-width: 100%;
          table-layout: fixed;
          border-collapse: collapse;
        }
        td, th {
          word-wrap: break-word;
          overflow-wrap: break-word;
          word-break: break-word;
        }
      </style>

      <!-- Logo Header Row -->
      <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; margin-bottom: 15px;">
        <tr>
          <!-- Horizon Logo on the Left -->
          <td style="width: 33.33%; text-align: left; vertical-align: middle; padding: 5px 10px;">
            <img src="${resolveFrontEndAssetUrl(HorizonLogo)}" style="max-height: 40px; max-width: 95%; object-fit: contain;" />
          </td>
          <!-- PMC's Logo in the Middle -->
          <td style="width: 33.33%; text-align: center; vertical-align: middle; padding: 5px 10px;">
            <div style="font-size: 13px; font-weight: bold; color: #0056b3; font-family: Arial, sans-serif;">PMC's Logo</div>
          </td>
          <!-- Contractor's Logo on the Right -->
          <td style="width: 33.33%; text-align: right; vertical-align: middle; padding: 5px 10px;">
            <div style="font-size: 13px; font-weight: bold; color: #2e7d32; font-family: Arial, sans-serif;">Contractor's Logo</div>
          </td>
        </tr>
      </table>

     <!-- Yellow Title Row -->
      <div style="background-color: #FFCC00; border: 1px solid #000; margin-bottom: 12px; width: 100%; box-sizing: border-box;">
        <div style="display: table; width: 100%; height: 50px;">
          <div style="display: table-cell; text-align: center; vertical-align: middle; font-weight: bold; font-size: 18px; text-transform: uppercase; font-family: Arial, sans-serif; color: #000;">
            ${template.title || instance.name || "QHSE CHECKLIST REPORT"}
          </div>
        </div>
      </div>

      <!-- Header Information Grid -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 11px;">
        <tr>
          <td style="border: 1px solid #000; padding: 6px; font-weight: bold; width: 22%; background-color: #ffffff;">Project/ Job Site:</td>
          <td style="border: 1px solid #000; padding: 6px; width: 28%; background-color: #f2f2f2;">${projectName}</td>
          <td style="border: 1px solid #000; padding: 6px; font-weight: bold; width: 22%; background-color: #ffffff;">Report No:</td>
          <td style="border: 1px solid #000; padding: 6px; width: 28%; background-color: #f2f2f2;">${reportNo}</td>
        </tr>
        <tr>
          <td style="border: 1px solid #000; padding: 6px; font-weight: bold; background-color: #ffffff;">Location:</td>
          <td style="border: 1px solid #000; padding: 6px; background-color: #f2f2f2;">${location}</td>
          <td style="border: 1px solid #000; padding: 6px; font-weight: bold; background-color: #ffffff;">Date:</td>
          <td style="border: 1px solid #000; padding: 6px; background-color: #f2f2f2;">${dateOfInspection}</td>
        </tr>
        <tr>
          <td style="border: 1px solid #000; padding: 6px; font-weight: bold; background-color: #ffffff;">Contractor:</td>
          <td style="border: 1px solid #000; padding: 6px; background-color: #f2f2f2;">${contractor}</td>
          <td style="border: 1px solid #000; padding: 6px; font-weight: bold; background-color: #ffffff;">Machine / Equipment No:</td>
          <td style="border: 1px solid #000; padding: 6px; background-color: #f2f2f2;">${machineNo}</td>
        </tr>
      </table>

      <!-- Instructional reference media (diagrams) -->
      ${combinedInstructionsSection}

      <!-- Questions checklist tables (chunked) -->
      ${tablesHtml}

      <!-- Comments / Action Required block -->
      <div style="border: 1px solid #000; padding: 10px; margin-bottom: 20px; font-size: 11px; page-break-inside: avoid;">
        <div style="font-weight: bold; margin-bottom: 5px; text-transform: uppercase;">Comments / Action Required:</div>
        <div style="min-height: 40px; white-space: pre-wrap;">${instance.remarks || ""}</div>
      </div>

      <!-- Signatures Footer block -->
      <table style="width: 100%; border-collapse: collapse; font-size: 11px; page-break-inside: avoid; margin-top: 15px;">
        <tr>
          <td style="border: 1px solid #000; padding: 10px; width: 33.33%; text-align: center; vertical-align: top; height: 120px;">
            <div style="height: 50px; display: flex; align-items: flex-end; justify-content: center; margin-bottom: 2px;">
              ${makerSig ? `<img src="${makerSig}" style="max-height: 45px; max-width: 95%; object-fit: contain;" />` : `<span style="color: #999; font-style: italic; font-size: 10px;">Digitally Signed</span>`}
            </div>
            <div style="border-top: 1px solid #000; padding-top: 6px;">
              <div style="font-weight: bold; font-size: 11px; color: #000000; font-family: Arial, sans-serif; margin-bottom: 2px;">Inspected by:</div>
              <div style="font-size: 11px; color: #333333; font-family: Arial, sans-serif;">${instance.maker_name || "—"}</div>
            </div>
          </td>
          <td style="border: 1px solid #000; padding: 10px; width: 33.33%; text-align: center; vertical-align: top; height: 120px;">
            <div style="height: 50px; display: flex; align-items: flex-end; justify-content: center; margin-bottom: 2px;">
              ${checkerSig ? `<img src="${checkerSig}" style="max-height: 45px; max-width: 95%; object-fit: contain;" />` : `<span style="color: #999; font-style: italic; font-size: 10px;">${instance.checker_name ? "Digitally Signed" : "Pending Sign-off"}</span>`}
            </div>
            <div style="border-top: 1px solid #000; padding-top: 6px;">
              <div style="font-weight: bold; font-size: 11px; color: #000000; font-family: Arial, sans-serif; margin-bottom: 2px;">Checked & Reviewed by:</div>
              <div style="font-size: 11px; color: #333333; font-family: Arial, sans-serif;">${instance.checker_name || "—"}</div>
            </div>
          </td>
          <td style="border: 1px solid #000; padding: 10px; width: 33.33%; text-align: center; vertical-align: top; height: 120px;">
            <div style="height: 50px; display: flex; align-items: flex-end; justify-content: center; margin-bottom: 2px;">
              ${supervisorSig ? `<img src="${supervisorSig}" style="max-height: 45px; max-width: 95%; object-fit: contain;" />` : `<span style="color: #999; font-style: italic; font-size: 10px;">${instance.status === "completed" || instance.status === "approved" ? "Digitally Signed" : "Pending Sign-off"}</span>`}
            </div>
            <div style="border-top: 1px solid #000; padding-top: 6px;">
              <div style="font-weight: bold; font-size: 11px; color: #000000; font-family: Arial, sans-serif; margin-bottom: 2px;">PMC/3rd Party:</div>
              <div style="font-size: 11px; color: #333333; font-family: Arial, sans-serif;">${instance.supervisor_name || "—"}</div>
            </div>
          </td>
        </tr>
      </table>
    </div>
  `;

  // Create an invisible wrapper container to hold the relative-positioned tempContainer
  const wrapper = document.createElement("div");
  wrapper.style.position = "absolute";
  wrapper.style.left = "0px";
  wrapper.style.top = "0px";
  wrapper.style.zIndex = "-9999";
  wrapper.style.width = "718px"; // Match printable area width

  // Create temporary container element to render PDF contents (must be relative for html2canvas)
  const tempContainer = document.createElement("div");
  tempContainer.style.width = "718px"; // 190mm at 96 DPI
  tempContainer.style.boxSizing = "border-box";
  tempContainer.style.padding = "0px"; // Remove padding, margin handled by jsPDF
  tempContainer.style.backgroundColor = "#ffffff";
  tempContainer.style.position = "relative";
  tempContainer.innerHTML = htmlContent;

  wrapper.appendChild(tempContainer);
  document.body.appendChild(wrapper);

  try {
    // Preload all images so they render properly in canvas
    await preloadAllImages(tempContainer);

    const opt = {
      margin: [10, 10, 10, 10],
      filename: `safety-report-${reportNo.replace("#", "")}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true, 
        logging: false,
        scrollX: 0,
        scrollY: 0,
        windowWidth: 718
      },
      pagebreak: { mode: ['css', 'legacy'] },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    };

    // Trigger PDF download
    await html2pdf().set(opt).from(tempContainer).save();
  } finally {
    // Cleanup temporary container wrapper
    document.body.removeChild(wrapper);
  }
}
