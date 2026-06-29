import {
  useMemo,
  useRef,
  useState,
  useCallback,
  useLayoutEffect,
  useEffect,
} from "react";
import {
  checklistItems,
  getChecklistFilesList,
  getDescriptionLabelForDocumentType,
  getDefaultMaterialSubmittalDescription,
  getFullSystemRowComplianceTables,
  getPqpRowDocumentLabel,
  getPqpRowFiles,
  WMS_REFERENCE_TYPE_OPTIONS,
  getWmsReferenceRowFiles,
  getWmsConstructionBlockFiles,
  getWmsAnnexureFiles,
} from "./approvedVendors";
import { getPqdChecklistTypeLabel, getPqdRowFiles } from "./pqdChecklists";
import { getDmpRowFiles } from "./dmpChecklists";
import {
  capitalCase,
  capitalCaseLabel,
  safeCapitalCaseName,
} from "./stringCase";
import { PdfPreview, usePdfPageCount } from "./PdfPreview";
import { X, Download, FileText, Loader2 } from "lucide-react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import horizonLogo from "./assets/Horizon-logo.png";
import pmcLogo from "./assets/pmc-logo.png";
import contractorLogo from "./assets/contrctor-logo.png";
import { formatDisplayDateTime } from "../../../utils/dateFormatter";

const AnnexurePage = ({
  annexureNo,
  description,
  file,
  LogoHeader,
  pageNumber,
  totalPages,
  pdfPageNumber,
  pdfTotalPages,
  hideAnnexureTitle,
  annexureHeadingOverride,
}) => {
  const isPdf =
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  const isFirstPdfPage = !pdfPageNumber || pdfPageNumber === 1;
  const showTitleBlock = isFirstPdfPage && !hideAnnexureTitle;
  const headingText = annexureHeadingOverride || `ANNEXURE - ${annexureNo}`;

  return (
    <div
      data-pdf-page
      className="bg-white relative font-serif"
      style={{
        width: "210mm",
        minHeight: "297mm",
        padding: "12mm 15mm",
        boxSizing: "border-box",
      }}
    >
      <LogoHeader />

      {/* Title block — skipped when a separate DOCUMENT SEPARATOR page precedes this annexure */}
      {showTitleBlock && (
        <>
          <div className="text-center mt-4">
            <p className="text-[10px] font-semibold tracking-wider uppercase text-gray-600">
              MATERIAL APPROVAL SUBMITTAL
            </p>
            <h2 className="text-base font-bold mt-1 text-gray-900">
              {headingText}
            </h2>
            {description && (
              <div className="mt-3 mx-auto max-w-[80%] border border-gray-300 rounded p-3">
                <p className="text-[10px] text-gray-700 leading-relaxed">
                  {description}
                </p>
              </div>
            )}
          </div>
          <div className="mt-4 text-center">
            <p className="text-[9px] text-gray-500 italic">
              Supporting document attached
            </p>
            <p className="text-[9px] text-gray-400 mt-1">
              (This annexure shall be read in conjunction with approved MAS)
            </p>
          </div>
        </>
      )}

      {/* Show page indicator for multi-page PDFs on continuation pages */}
      {pdfPageNumber && pdfPageNumber > 1 && (
        <div className="text-center mt-2 mb-2">
          <p className="text-[9px] font-medium text-gray-600">
            {headingText} (continued — PDF page {pdfPageNumber} of{" "}
            {pdfTotalPages})
          </p>
        </div>
      )}

      <div
        className="mt-4 flex items-center justify-center"
        style={{
          maxHeight: isPdf && pdfPageNumber ? "220mm" : "180mm",
          overflow: "hidden",
        }}
      >
        {file.type.startsWith("image/") ? (
          <img
            src={URL.createObjectURL(file)}
            alt={`Annexure ${annexureNo}`}
            className="max-w-full max-h-[170mm] object-contain"
          />
        ) : isPdf ? (
          <PdfPreview file={file} scale={1} pageNumber={pdfPageNumber} />
        ) : (
          <div className="text-center p-8 border border-dashed border-gray-300 rounded">
            <FileText className="w-8 h-8 mx-auto text-gray-400 mb-2" />
            <p className="text-[10px] font-medium text-gray-600">{file.name}</p>
            <p className="text-[9px] text-gray-400 mt-1">
              Document attached — {(file.size / 1024).toFixed(1)} KB
            </p>
          </div>
        )}
      </div>
      <div className="absolute bottom-[8mm] left-[15mm] right-[15mm] text-center text-[9px] text-gray-400 border-t border-gray-200 pt-2">
        Page {pageNumber} of {totalPages}
      </div>
    </div>
  );
};

/** Wrapper that splits multi-page PDFs into separate annexure pages */
const MultiPageAnnexure = ({
  annexureNo,
  description,
  file,
  LogoHeader,
  startPageNumber,
  totalPages,
  hideAnnexureTitle,
  annexureHeadingOverride,
}) => {
  const isPdf =
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  const pdfPageCount = usePdfPageCount(isPdf ? file : null);
  const pageCount = isPdf && pdfPageCount > 1 ? pdfPageCount : 1;

  if (!isPdf || pageCount <= 1) {
    return (
      <AnnexurePage
        annexureNo={annexureNo}
        description={description}
        file={file}
        LogoHeader={LogoHeader}
        pageNumber={startPageNumber}
        totalPages={totalPages}
        hideAnnexureTitle={hideAnnexureTitle}
        annexureHeadingOverride={annexureHeadingOverride}
      />
    );
  }

  return (
    <>
      {Array.from({ length: pageCount }, (_, i) => (
        <AnnexurePage
          key={`annex-${annexureNo}-pdfpage-${i + 1}`}
          annexureNo={annexureNo}
          description={description}
          file={file}
          LogoHeader={LogoHeader}
          pageNumber={startPageNumber + i}
          totalPages={totalPages}
          pdfPageNumber={i + 1}
          pdfTotalPages={pageCount}
          hideAnnexureTitle={hideAnnexureTitle}
          annexureHeadingOverride={annexureHeadingOverride}
        />
      ))}
    </>
  );
};

/**
 * PQP: one annexure per register row (all files in that row share it), like full-system checklist rows.
 * `annexSeq` counts only rows that have ≥1 file, in table order.
 */
function pqpAnnexureMainTitle(annexSeq, rowIndex) {
  if (annexSeq === 1 && rowIndex === 0) return "Project Quality Plan";
  if (annexSeq === 1) return "Annexure #1";
  return `Annexure #${annexSeq - 1}`;
}

function pqpAnnexureRegisterRef(annexSeq, rowIndex) {
  if (annexSeq === 1 && rowIndex === 0) return "PQP";
  if (annexSeq === 1) return "Annexure #1";
  return `Annexure #${annexSeq - 1}`;
}

function pqpAnnexurePdfNo(annexSeq, rowIndex) {
  if (annexSeq === 1 && rowIndex === 0) return "PQP";
  if (annexSeq === 1) return 1;
  return annexSeq - 1;
}

function pqpAnnexurePdfHeading(annexSeq, rowIndex) {
  if (annexSeq === 1 && rowIndex === 0) return "PROJECT QUALITY PLAN";
  if (annexSeq === 1) return "ANNEXURE #1";
  return `ANNEXURE #${annexSeq - 1}`;
}

/** Full-page annexure separator (before attachment pages) */
const AnnexureSeparatorPage = ({
  annexureNo,
  description,
  pageNumber,
  totalPages,
  LogoHeader,
  issueDate,
  titleOverride,
}) => (
  <div
    data-pdf-page
    className="bg-white font-serif text-gray-900 flex flex-col border border-gray-800"
    style={{
      width: "210mm",
      minHeight: "297mm",
      padding: "12mm 15mm",
      boxSizing: "border-box",
      position: "relative",
    }}
  >
    <LogoHeader />
    <div className="flex-1 flex flex-col items-center justify-center text-center px-6 min-h-[200mm]">
      <p className="text-3xl font-bold tracking-[0.2em] uppercase text-blue-800 mb-8">
        DOCUMENT SEPARATOR
      </p>
      <h2 className="text-3xl font-bold text-gray-900 mb-8 leading-tight">
        {titleOverride || `Annexure – ${annexureNo}`}
      </h2>
      {description ? (
        <p className="text-sm font-bold text-gray-900 max-w-[90%] leading-relaxed whitespace-pre-line">
          {description}
        </p>
      ) : null}
    </div>
    <div className="absolute bottom-[10mm] left-[15mm] right-[15mm]">
      <div className="flex justify-between items-center text-[9px] text-gray-600 border-t border-gray-300 pt-2">
        <span className="text-left">HIPPL/QHSE/MS/FMT/003-1, Rev: 5</span>
        <span className="text-center">Issue Date: {issueDate}</span>
        <span className="text-right">File Separator</span>
      </div>
      <p className="text-center text-[9px] text-gray-400 mt-2">
        Page {pageNumber} of {totalPages}
      </p>
    </div>
  </div>
);

/** ~210mm at 96dpi — used to scale the live preview to fit the panel without horizontal scroll */
const A4_WIDTH_PX = 794;

/** Method Statement — fixed annexure slots (preview + PDF annexure sequence). */
const WMS_PREVIEW_ANNEXURE_META = [
  { key: "annexure1", seq: 1, title: "Drawing" },
  { key: "annexure2", seq: 2, title: "ITP" },
  { key: "annexure3", seq: 3, title: "Checklist" },
  { key: "annexure4", seq: 4, title: "HIRA" },
];

const WMS_PREVIEW_CONSTRUCTION_BLOCKS = [
  { key: "preInstall", title: "Pre Installation Activities" },
  { key: "during", title: "During Application / Installation" },
  { key: "post", title: "Post Application / Installation" },
];

function wmsRefTypeLabel(value) {
  const opt = WMS_REFERENCE_TYPE_OPTIONS.find((o) => o.value === value);
  return opt ? opt.label : capitalCase(value || "—");
}

/** Split bullet / line-based construction sequence text for preview lists. */
function wmsConstructionLines(text) {
  const raw = text != null ? String(text) : "";
  return raw
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*[•\-\*]\s*/, "").trim())
    .filter((line) => line.length > 0);
}

const DocumentPreview = ({
  formData,
  onClose,
  variant = "modal",
  pdfGeneratorRef,
}) => {
  const previewScrollRef = useRef(null);
  const previewContainerRef = useRef(null);
  const scaleWrapperRef = useRef(null);
  const previewScaleRef = useRef(1);
  const isEmbedded = variant === "embedded";
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  /** Uniform scale so the preview fits the visible area (no horizontal scroll; vertical only when needed) */
  const [previewScale, setPreviewScale] = useState(1);

  const userStr =
    typeof localStorage !== "undefined"
      ? localStorage.getItem("USER_DATA")
      : null;
  let loggedInUserName = "—";
  try {
    const user =
      userStr && userStr !== "undefined" ? JSON.parse(userStr) : null;
    loggedInUserName =
      user?.username ||
      user?.user_name ||
      user?.first_name ||
      user?.firstName ||
      user?.name ||
      user?.full_name ||
      user?.email ||
      "—";
  } catch {
    loggedInUserName = "—";
  }
  const nowDateTime = formatDisplayDateTime(new Date());

  const generatePdfBlob = useCallback(async () => {
    const scrollContainer = previewScrollRef.current;
    const zoomEl = scaleWrapperRef.current;
    if (!scrollContainer) return null;

    if (zoomEl) zoomEl.style.zoom = "1";

    try {
      const pages = scrollContainer.querySelectorAll("[data-pdf-page]");
      if (pages.length === 0) return null;

      // Force A4 in mm (210 x 297). Some viewers can misinterpret string formats.
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [210, 297],
      });
      const pdfWidth = 210;
      const pdfHeight = 297;

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const originalWidth = page.style.width;
        const originalMinHeight = page.style.minHeight;
        page.style.width = "794px";
        page.style.minHeight = "1123px";

        const canvas = await html2canvas(page, {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
          logging: false,
          width: 794,
          height: 1123,
          windowWidth: 794,
          windowHeight: 1123,
          onclone: (clonedDoc, clonedPage) => {
            const root = clonedPage || clonedDoc?.body;
            if (!root) return;
            root.querySelectorAll("table tr").forEach((tr) => {
              tr.style.setProperty("vertical-align", "middle", "important");
            });
            root.querySelectorAll("table th, table td").forEach((cell) => {
              cell.style.setProperty("vertical-align", "middle", "important");
            });
            root
              .querySelectorAll("table td > div, table th > div")
              .forEach((div) => {
                div.style.setProperty("justify-content", "center", "important");
                div.style.setProperty("align-items", "center", "important");
              });
          },
        });

        page.style.width = originalWidth;
        page.style.minHeight = originalMinHeight;

        const imgData = canvas.toDataURL("image/jpeg", 0.95);
        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);
      }

      if (zoomEl) zoomEl.style.zoom = String(previewScaleRef.current);
      return pdf.output("blob");
    } catch (err) {
      console.error("PDF generation failed:", err);
      if (zoomEl) zoomEl.style.zoom = String(previewScaleRef.current);
      return null;
    }
  }, []);

  useEffect(() => {
    if (pdfGeneratorRef) {
      pdfGeneratorRef.current = generatePdfBlob;
      return () => {
        pdfGeneratorRef.current = null;
      };
    }
  }, [pdfGeneratorRef, generatePdfBlob]);

  const handleDownload = useCallback(async () => {
    setIsGeneratingPdf(true);
    try {
      const blob = await generatePdfBlob();
      if (blob) {
        const fileName = formData.transmittalRefNo
          ? `Transmittal_${formData.transmittalRefNo.replace(/[/\\]/g, "_")}.pdf`
          : "Transmittal_Document.pdf";
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        window.print();
      }
    } catch (err) {
      console.error("PDF download failed:", err);
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  }, [formData.transmittalRefNo, generatePdfBlob]);

  const HORIZON_LOGO_SRC = horizonLogo;
  const PMC = pmcLogo;
  const CONTRACTOR_LOGO = contractorLogo;

  const makeStatusLabel =
    formData.makeStatus === "approved"
      ? capitalCase("approved make")
      : formData.makeStatus === "alternative"
        ? capitalCase("alternative proposal")
        : formData.makeStatus === "non_tender"
          ? capitalCase("non tender item")
          : "—";

  const fullSystemStatusDefs = [
    { key: "technicalData", label: "Technical data sheet / Product catalogue" },
    { key: "manufacturerTest", label: "Manufacturer test certificate" },
  ];

  const fullSystemAnnexureKey = (rowId, key) => `${rowId}:${key}`;

  const isProjectPlans = formData.documentType === "Project Plans";
  const isPreQualification = formData.documentType === "Pre-Qualification";
  const isDesignMix = formData.documentType === "Design Mix";
  const isMethodStatement = formData.documentType === "Method Statement";
  const isLegalDocument = formData.documentType === "Legal Documents";

  /** WMS annexure groups for separator + attachment pages (fixed slots 1–4). */
  const wmsAnnexureRenderGroups = useMemo(() => {
    if (!isMethodStatement) return [];
    return WMS_PREVIEW_ANNEXURE_META.map((meta) => {
      const annex = formData.wmsAnnexures?.[meta.key];
      const files = getWmsAnnexureFiles(annex);
      return {
        ...meta,
        label: `Annexure ${meta.seq} — ${meta.title}`,
        files: files.map((file, fi) => ({
          file,
          fileKey: `${meta.key}:${fi}`,
        })),
        manualITP: annex?.manualITP || [],
        showManualITP: annex?.showManualITP || false,
        manualHIRA: annex?.manualHIRA || [],
        showManualHIRA: annex?.showManualHIRA || false,
      };
    }).filter(
      (g) =>
        g.files.length > 0 ||
        (g.key === "annexure2" && g.manualITP.length > 0 && g.showManualITP) ||
        (g.key === "annexure4" && g.manualHIRA.length > 0 && g.showManualHIRA),
    );
  }, [isMethodStatement, formData.wmsAnnexures]);

  /** WMS post page-2 PDF blocks: reference uploads, construction-sequence uploads, then fixed Annexure 1–4. */
  const wmsAllAttachmentPageBlocks = useMemo(() => {
    if (!isMethodStatement) return 0;
    let n = 0;
    (formData.wmsReferences || []).forEach((row) => {
      const files = getWmsReferenceRowFiles(row);
      if (files.length === 0) return;
      n += 1 + files.length;
    });
    WMS_PREVIEW_CONSTRUCTION_BLOCKS.forEach(({ key }) => {
      const files = getWmsConstructionBlockFiles(
        formData.wmsConstructionSequence?.[key],
      );
      if (files.length === 0) return;
      n += 1 + files.length;
    });
    WMS_PREVIEW_ANNEXURE_META.forEach(({ key }) => {
      const annex = formData.wmsAnnexures?.[key];
      const files = getWmsAnnexureFiles(annex);
      const manualITP = annex?.manualITP || [];
      const showManual = annex?.showManualITP || false;
      const manualHIRA = annex?.manualHIRA || [];
      const showManualHIRA = annex?.showManualHIRA || false;

      const hasManualITP =
        key === "annexure2" && showManual && manualITP.length > 0;
      const hasManualHIRA =
        key === "annexure4" && showManualHIRA && manualHIRA.length > 0;

      let manualPages = 0;
      if (hasManualITP) manualPages = 1;
      if (hasManualHIRA) manualPages = 2;

      if (files.length === 0 && manualPages === 0) return;
      n += 1 + files.length + manualPages;
    });
    return n;
  }, [
    isMethodStatement,
    formData.wmsReferences,
    formData.wmsConstructionSequence,
    formData.wmsAnnexures,
  ]);

  /** PQP: grouped by register row — one separator + N file pages per row (shared annexure no.). */
  const pqpAnnexureGroups = useMemo(() => {
    if (!isProjectPlans) return [];
    const groups = [];
    let annexSeq = 0;
    (formData.pqpAnnexRows || []).forEach((row, rowIdx) => {
      const files = getPqpRowFiles(row);
      if (files.length === 0) return;
      annexSeq += 1;
      const documentLabel = getPqpRowDocumentLabel(row, rowIdx);
      groups.push({
        rowId: row.id,
        rowIndex: rowIdx,
        annexSeq,
        documentLabel,
        files: files.map((file, fi) => ({ file, fileKey: `${row.id}:${fi}` })),
      });
    });
    return groups;
  }, [isProjectPlans, formData.pqpAnnexRows]);

  /** Per-row annexure label for the document register (one ref per row with files). */
  const pqpRowAnnexMeta = useMemo(() => {
    if (!isProjectPlans) return {};
    const map = {};
    let annexSeq = 0;
    (formData.pqpAnnexRows || []).forEach((row, rowIdx) => {
      if (getPqpRowFiles(row).length === 0) return;
      annexSeq += 1;
      map[row.id] = { annexSeq, rowIndex: rowIdx };
    });
    return map;
  }, [isProjectPlans, formData.pqpAnnexRows]);

  /** Page budget: one separator + one block per file per row-with-files (same heuristic as before). */
  const pqpAnnexurePageBlocks = useMemo(() => {
    if (!isProjectPlans) return 0;
    let n = 0;
    (formData.pqpAnnexRows || []).forEach((row) => {
      const files = getPqpRowFiles(row);
      if (files.length === 0) return;
      n += 1 + files.length;
    });
    return n;
  }, [isProjectPlans, formData.pqpAnnexRows]);

  /** PQD: one annexure group per checklist row with uploads (separator + file pages). */
  const pqdAnnexureGroups = useMemo(() => {
    if (!isPreQualification) return [];
    const groups = [];
    let annexSeq = 0;
    (formData.pqdChecklistRows || []).forEach((row) => {
      const files = getPqdRowFiles(row);
      if (files.length === 0) return;
      annexSeq += 1;
      const docShort = String(row.document || "").trim();
      const slPart = row.isCustom ? "Additional" : `Sr. ${row.slNo}`;
      const documentLabel = `${slPart}${docShort ? ` — ${docShort.slice(0, 140)}${docShort.length > 140 ? "…" : ""}` : ""}`;
      groups.push({
        rowId: row.id,
        annexSeq,
        documentLabel,
        files: files.map((file, fi) => ({ file, fileKey: `${row.id}:${fi}` })),
      });
    });
    return groups;
  }, [isPreQualification, formData.pqdChecklistRows]);

  const pqdRowAnnexMeta = useMemo(() => {
    if (!isPreQualification) return {};
    const map = {};
    let annexSeq = 0;
    (formData.pqdChecklistRows || []).forEach((row) => {
      if (getPqdRowFiles(row).length === 0) return;
      annexSeq += 1;
      map[row.id] = { annexSeq };
    });
    return map;
  }, [isPreQualification, formData.pqdChecklistRows]);

  const pqdAnnexurePageBlocks = useMemo(() => {
    if (!isPreQualification) return 0;
    let n = 0;
    (formData.pqdChecklistRows || []).forEach((row) => {
      const files = getPqdRowFiles(row);
      if (files.length === 0) return;
      n += 1 + files.length;
    });
    return n;
  }, [isPreQualification, formData.pqdChecklistRows]);

  /** DMP: one annexure group per checklist row with uploads (separator + file pages). */
  const dmpAnnexureGroups = useMemo(() => {
    if (!isDesignMix) return [];
    const groups = [];
    let annexSeq = 0;
    (formData.dmpChecklistRows || []).forEach((row) => {
      const files = getDmpRowFiles(row);
      if (files.length === 0) return;
      annexSeq += 1;
      const docShort = String(row.document || "").trim();
      const sl = String(row.slNo || "").trim();
      const documentLabel = `${sl ? `Sr. ${sl}` : "Item"}${docShort ? ` — ${docShort.slice(0, 140)}${docShort.length > 140 ? "…" : ""}` : ""}`;
      groups.push({
        rowId: row.id,
        annexSeq,
        documentLabel,
        files: files.map((file, fi) => ({ file, fileKey: `${row.id}:${fi}` })),
      });
    });
    return groups;
  }, [isDesignMix, formData.dmpChecklistRows]);

  const dmpRowAnnexMeta = useMemo(() => {
    if (!isDesignMix) return {};
    const map = {};
    let annexSeq = 0;
    (formData.dmpChecklistRows || []).forEach((row) => {
      if (getDmpRowFiles(row).length === 0) return;
      annexSeq += 1;
      map[row.id] = { annexSeq };
    });
    return map;
  }, [isDesignMix, formData.dmpChecklistRows]);

  const dmpAnnexurePageBlocks = useMemo(() => {
    if (!isDesignMix) return 0;
    let n = 0;
    (formData.dmpChecklistRows || []).forEach((row) => {
      const files = getDmpRowFiles(row);
      if (files.length === 0) return;
      n += 1 + files.length;
    });
    return n;
  }, [isDesignMix, formData.dmpChecklistRows]);

  const annexureMap = useMemo(() => {
    if (
      isProjectPlans ||
      isPreQualification ||
      isDesignMix ||
      isMethodStatement
    )
      return {};
    const map = {};
    let counter = 0;
    if (formData.materialType === "full_system") {
      (formData.fullSystemChecklist?.rows || []).forEach((row) => {
        const hasAnyStatusAttachment = fullSystemStatusDefs.some(
          (s) => row.statusFiles?.[s.key],
        );
        const rowComplianceTables = getFullSystemRowComplianceTables(row);
        const hasComplianceAttachment = rowComplianceTables.some(
          (t) => t.attachedFile,
        );
        const hasDirectComplianceFile =
          !!row.statusFiles?.["complianceStatement"];

        // One annexure number per row, shared across all attachment types in that row.
        if (
          hasAnyStatusAttachment ||
          hasComplianceAttachment ||
          hasDirectComplianceFile
        ) {
          counter += 1;
        } else {
          return;
        }

        fullSystemStatusDefs.forEach((s) => {
          if (row.statusFiles?.[s.key]) {
            map[fullSystemAnnexureKey(row.id, s.key)] = counter;
          }
        });
        if (row.statusFiles?.["complianceStatement"]) {
          map[fullSystemAnnexureKey(row.id, "complianceStatement")] = counter;
        }

        rowComplianceTables.forEach((table) => {
          if (table.attachedFile) {
            map[fullSystemAnnexureKey(row.id, `complianceFile:${table.id}`)] =
              counter;
          }
        });
      });
      return map;
    }
    checklistItems.forEach((item) => {
      if (item.slNo === 5) return;
      const files = getChecklistFilesList(formData.checklistFiles[item.slNo]);
      if (files.length === 0) return;
      counter++;
      map[item.slNo] = counter;
    });
    return map;
  }, [
    formData.checklistFiles,
    formData.fullSystemChecklist?.rows,
    formData.materialType,
    isProjectPlans,
    isPreQualification,
    isDesignMix,
    isMethodStatement,
  ]);

  const annexureFiles = useMemo(() => {
    const files = [];
    if (
      isProjectPlans ||
      isPreQualification ||
      isDesignMix ||
      isMethodStatement
    )
      return files;
    if (formData.materialType === "full_system") {
      (formData.fullSystemChecklist?.rows || []).forEach((row) => {
        const rowFiles = [];
        const rowAnnexuresSet = new Set();
        fullSystemStatusDefs.forEach((s) => {
          const file = row.statusFiles?.[s.key];
          const ak = fullSystemAnnexureKey(row.id, s.key);
          const annexureNo = annexureMap[ak];
          if (annexureNo && file) {
            rowFiles.push({
              annexureNo,
              key: s.key,
              fileKey: ak,
              description: s.label,
              file,
            });
            rowAnnexuresSet.add(annexureNo);
          }
        });

        const compKey = fullSystemAnnexureKey(row.id, "complianceStatement");
        const compNo = annexureMap[compKey];
        if (compNo && row.statusFiles?.["complianceStatement"]) {
          rowFiles.push({
            annexureNo: compNo,
            key: "complianceStatement",
            fileKey: compKey,
            description: "Compliance Statement",
            file: row.statusFiles["complianceStatement"],
          });
          rowAnnexuresSet.add(compNo);
        }
        getFullSystemRowComplianceTables(row).forEach((table) => {
          const compFile = table.attachedFile;
          if (!compFile) return;
          const cak = fullSystemAnnexureKey(
            row.id,
            `complianceFile:${table.id}`,
          );
          const cNo = annexureMap[cak];
          if (cNo) {
            rowFiles.push({
              annexureNo: cNo,
              key: "complianceFile",
              fileKey: cak,
              description:
                table.documentDescription ||
                "Compliance statement (supporting document)",
              file: compFile,
            });
            rowAnnexuresSet.add(cNo);
          }
        });
        if (rowFiles.length > 0) {
          files.push({
            rowId: row.id,
            rowIndex:
              (formData.fullSystemChecklist?.rows || []).findIndex(
                (r) => r.id === row.id,
              ) + 1,
            annexureNos: Array.from(rowAnnexuresSet).sort((a, b) => a - b),
            files: rowFiles.sort((a, b) => a.annexureNo - b.annexureNo),
          });
        }
      });
      return files;
    }
    checklistItems.forEach((item) => {
      const annexureNo = annexureMap[item.slNo];
      const fileList = getChecklistFilesList(
        formData.checklistFiles[item.slNo],
      );
      if (annexureNo == null || !fileList.length) return;
      files.push({ slNo: item.slNo, annexureNo, files: fileList });
    });
    return files;
  }, [
    annexureMap,
    formData.checklistFiles,
    formData.fullSystemChecklist?.rows,
    formData.materialType,
    isProjectPlans,
    isPreQualification,
    isDesignMix,
    isMethodStatement,
  ]);

  const complianceAnnexures = useMemo(() => {
    if (
      isProjectPlans ||
      isPreQualification ||
      isDesignMix ||
      isMethodStatement
    )
      return [];
    // For `full_system`, compliance attached file is already included in `annexureFiles`
    // (grouped per row). Rendering it again here would create extra annexure separators.
    if (formData.materialType === "full_system") return [];

    const vals = Object.values(annexureMap).flatMap((v) =>
      Array.isArray(v) ? v : v != null && typeof v === "number" ? [v] : [],
    );
    const lastAnnexure = vals.length > 0 ? Math.max(...vals) : 0;
    return formData.complianceTables
      .filter((t) => t.attachedFile)
      .map((t, i) => ({
        annexureNo: lastAnnexure + i + 1,
        table: t,
        file: t.attachedFile,
      }));
  }, [
    annexureMap,
    formData.complianceTables,
    formData.fullSystemChecklist?.rows,
    formData.materialType,
    isProjectPlans,
    isPreQualification,
    isDesignMix,
    isMethodStatement,
  ]);

  const docIssueDate = formData.date;

  const fullSystemAttachedFilesCount = useMemo(() => {
    if (formData.materialType !== "full_system") return 0;
    let count = 0;
    (formData.fullSystemChecklist?.rows || []).forEach((row) => {
      fullSystemStatusDefs.forEach((s) => {
        if (row.statusFiles?.[s.key]) count += 1;
      });
      getFullSystemRowComplianceTables(row).forEach((t) => {
        if (t.attachedFile) count += 1;
      });
    });
    return count;
  }, [formData.fullSystemChecklist?.rows, formData.materialType]);

  const complianceHtmlPageCount = useMemo(() => {
    if (
      isProjectPlans ||
      isPreQualification ||
      isDesignMix ||
      isMethodStatement
    )
      return 0;
    if (formData.materialType === "full_system") {
      return (formData.fullSystemChecklist?.rows || []).reduce(
        (acc, r) => acc + getFullSystemRowComplianceTables(r).length,
        0,
      );
    }
    return (formData.complianceTables || []).length;
  }, [
    formData.complianceTables,
    formData.fullSystemChecklist?.rows,
    formData.materialType,
    isProjectPlans,
    isPreQualification,
    isDesignMix,
    isMethodStatement,
  ]);

  const totalPages = useMemo(() => {
    if (isProjectPlans) {
      return 2 + pqpAnnexurePageBlocks;
    }
    if (isPreQualification) {
      return 2 + pqdAnnexurePageBlocks;
    }
    if (isDesignMix) {
      return 2 + dmpAnnexurePageBlocks;
    }
    if (isMethodStatement) {
      /* Transmittal + WMS scope/refs + one page per construction block + annex index page + attachment blocks */
      return (
        2 +
        wmsAllAttachmentPageBlocks +
        WMS_PREVIEW_CONSTRUCTION_BLOCKS.length +
        1
      );
    }
    let count = 2;
    if (formData.materialType === "full_system") {
      count += annexureFiles.length + fullSystemAttachedFilesCount;
    } else {
      count += annexureFiles.reduce(
        (acc, g) => acc + 1 + g.files.length * 2,
        0,
      );
    }
    count += complianceAnnexures.length * 2;
    count += complianceHtmlPageCount;
    return count;
  }, [
    annexureFiles.length,
    complianceAnnexures.length,
    complianceHtmlPageCount,
    formData.materialType,
    fullSystemAttachedFilesCount,
    isProjectPlans,
    isPreQualification,
    isDesignMix,
    isMethodStatement,
    pqpAnnexurePageBlocks,
    pqdAnnexurePageBlocks,
    dmpAnnexurePageBlocks,
    wmsAllAttachmentPageBlocks,
  ]);

  /** Scale live preview so ~794px A4 width fits the panel (no horizontal scroll). PDF export resets zoom to 1 while capturing. */
  useLayoutEffect(() => {
    const container = previewContainerRef.current;
    if (!container) return;

    const update = () => {
      const cw = container.clientWidth;
      const pad = 32;
      const next = Math.min(1, Math.max(0.18, (cw - pad) / A4_WIDTH_PX));
      setPreviewScale(next);
      previewScaleRef.current = next;
    };

    const ro = new ResizeObserver(() => requestAnimationFrame(update));
    ro.observe(container);
    requestAnimationFrame(update);
    return () => ro.disconnect();
  }, [variant]);

  const pageStyle = {
    width: "210mm",
    minHeight: "297mm",
    padding: "12mm 15mm",
    boxSizing: "border-box",
    position: "relative",
  };

  const PageFooter = ({ pageNo, rev, date }) => (
    <div className="absolute bottom-[8mm] left-[15mm] right-[15mm] flex items-center justify-between text-[9px] text-gray-500 border-t border-gray-200 pt-1.5">
      <span>Document No: HIPPUQAP/FM/TDC/{pageNo}</span>
      <span>Rev: {rev}</span>
      <span>Date: {date}</span>
      <span>
        Page {pageNo} of {totalPages}
      </span>
    </div>
  );

  const LogoHeader = () => (
    <table className="w-full border-collapse border border-gray-800 mb-3 table-fixed">
      <tbody>
        <tr>
          <td className="border-r border-gray-800 text-center align-middle p-0 h-12">
            <img
              src={HORIZON_LOGO_SRC}
              alt="Horizon Industrial Parks"
              className="h-full w-full object-contain"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          </td>
          <td className="border-r border-gray-800 text-center align-middle p-0 h-12">
            <img
              src={PMC}
              alt="PMC"
              className="h-full w-full object-contain"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          </td>
          <td className="text-center align-middle p-0 h-12">
            <img
              src={CONTRACTOR_LOGO}
              alt="Contractor"
              className="h-full w-full object-contain"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          </td>
        </tr>
      </tbody>
    </table>
  );

  /** Annexure separators + file pages, then compliance HTML tables last (checklist item 5). */
  const renderPostChecklistPages = () => {
    const nodes = [];
    let p = 2;
    const tp = totalPages;

    if (isLegalDocument) {
      (formData.documentsList || []).forEach((row, idx) => {
        const files = row.attachment || [];
        if (files.length === 0) return;
        const documentLabel = row.document || `Document ${idx + 1}`;
        p += 1;
        nodes.push(
          <AnnexureSeparatorPage
            key={`legal-sep-${row.id || idx}`}
            annexureNo={idx + 1}
            titleOverride={`ANNEXURE – ${idx + 1}`}
            description={documentLabel}
            pageNumber={p}
            totalPages={tp}
            LogoHeader={LogoHeader}
            issueDate={docIssueDate}
          />,
        );
        files.forEach((file, fi) => {
          const contentStart = p + 1;
          p = contentStart;
          const multiDesc =
            files.length > 1
              ? `${documentLabel} — Attachment ${fi + 1}`
              : documentLabel;
          nodes.push(
            <MultiPageAnnexure
              key={`legal-file-${row.id || idx}-${fi}`}
              annexureNo={idx + 1}
              annexureHeadingOverride={`ANNEXURE ${idx + 1}`}
              description={multiDesc}
              file={file}
              LogoHeader={LogoHeader}
              startPageNumber={contentStart}
              totalPages={tp}
              hideAnnexureTitle
            />,
          );
        });
      });
      return nodes;
    }

    if (isMethodStatement) {
      (formData.wmsReferences || []).forEach((row, idx) => {
        const files = getWmsReferenceRowFiles(row);
        if (files.length === 0) return;
        const typeLabel = wmsRefTypeLabel(row.refType);
        const sec = String(row.sectionClass ?? "").trim();
        const descBase = `Reference ${idx + 1} — ${typeLabel}${sec ? ` — ${sec}` : ""}`;
        p += 1;
        nodes.push(
          <AnnexureSeparatorPage
            key={`wms-ref-sep-${row.id}`}
            annexureNo=""
            titleOverride={`REFERENCE ATTACHMENT — ${idx + 1}`}
            description={descBase}
            pageNumber={p}
            totalPages={tp}
            LogoHeader={LogoHeader}
            issueDate={docIssueDate}
          />,
        );
        files.forEach((file, fi) => {
          const contentStart = p + 1;
          p = contentStart;
          const multiDesc =
            files.length > 1
              ? `${descBase} — ${file.name || `${capitalCase("attachment")} ${fi + 1}`}`
              : descBase;
          nodes.push(
            <MultiPageAnnexure
              key={`wms-ref-file-${row.id}-${fi}`}
              annexureNo={idx + 1}
              annexureHeadingOverride={`REFERENCE ${idx + 1}`}
              description={multiDesc}
              file={file}
              LogoHeader={LogoHeader}
              startPageNumber={contentStart}
              totalPages={tp}
              hideAnnexureTitle
            />,
          );
        });
      });

      WMS_PREVIEW_CONSTRUCTION_BLOCKS.forEach(({ key, title }) => {
        const block = formData.wmsConstructionSequence?.[key];
        const lines = wmsConstructionLines(block?.text ?? "");
        p += 1;
        nodes.push(
          <div
            key={`wms-cs-narrative-${key}`}
            data-pdf-page
            className="bg-white font-serif text-gray-900"
            style={pageStyle}
          >
            <LogoHeader />
            <h1 className="text-sm font-bold text-center tracking-wider uppercase mt-2 mb-3">
              METHOD STATEMENT
            </h1>
            <h2 className="text-sm font-bold text-center tracking-wide text-gray-900 mt-1 mb-2">
              Construction Sequence
            </h2>
            <div className="text-[9px]">
              <h3 className="text-[10px] font-bold text-gray-800 mb-1">
                {title}
              </h3>
              <ul className="list-disc pl-4 text-[9px] text-gray-900 space-y-0.5">
                {lines.length > 0 ? (
                  lines.map((line, i) => <li key={i}>{line}</li>)
                ) : (
                  <li className="list-none text-gray-500 pl-0">—</li>
                )}
              </ul>
              <p className="text-[8px] text-gray-600 mt-3 leading-snug">
                {getWmsConstructionBlockFiles(block).length > 0
                  ? "Supporting file(s) for this activity follow on the next page(s)."
                  : "No files attached for this activity."}
              </p>
            </div>
            <PageFooter pageNo={p} rev="0" date={docIssueDate} />
          </div>,
        );

        const files = getWmsConstructionBlockFiles(block);
        if (files.length === 0) return;
        p += 1;
        nodes.push(
          <AnnexureSeparatorPage
            key={`wms-cs-sep-${key}`}
            annexureNo=""
            titleOverride={`CONSTRUCTION SEQUENCE — ${title.toUpperCase()}`}
            description={title}
            pageNumber={p}
            totalPages={tp}
            LogoHeader={LogoHeader}
            issueDate={docIssueDate}
          />,
        );
        files.forEach((file, fi) => {
          const contentStart = p + 1;
          p = contentStart;
          const multiDesc =
            files.length > 1
              ? `${title} — ${file.name || `${capitalCase("attachment")} ${fi + 1}`}`
              : title;
          nodes.push(
            <MultiPageAnnexure
              key={`wms-cs-file-${key}-${fi}`}
              annexureNo={key}
              annexureHeadingOverride={title}
              description={multiDesc}
              file={file}
              LogoHeader={LogoHeader}
              startPageNumber={contentStart}
              totalPages={tp}
              hideAnnexureTitle
            />,
          );
        });
      });

      p += 1;
      nodes.push(
        <div
          key="wms-annex-index"
          data-pdf-page
          className="bg-white font-serif text-gray-900"
          style={pageStyle}
        >
          <LogoHeader />
          <h1 className="text-sm font-bold text-center tracking-wider uppercase mt-2 mb-3">
            METHOD STATEMENT
          </h1>
          <div>
            <h2 className="text-sm font-bold text-center tracking-wide text-gray-900 mt-2 mb-2">
              Annexure
            </h2>
            <table className="w-full text-[8px] border-collapse border border-gray-400">
              <thead>
                <tr className="bg-gray-100">
                  <th
                    className="border border-gray-400 px-1 py-1 text-center w-8"
                    style={{ verticalAlign: "middle" }}
                  >
                    Sr.
                  </th>
                  <th
                    className="border border-gray-400 px-1 py-1 text-left"
                    style={{ verticalAlign: "middle" }}
                  >
                    Annexure
                  </th>
                  <th
                    className="border border-gray-400 px-1 py-1 text-left"
                    style={{ verticalAlign: "middle" }}
                  >
                    Description
                  </th>
                  <th
                    className="border border-gray-400 px-1 py-1 text-center w-24"
                    style={{ verticalAlign: "middle" }}
                  >
                    File name(s)
                  </th>
                </tr>
              </thead>
              <tbody>
                {WMS_PREVIEW_ANNEXURE_META.map((row) => {
                  const afiles = getWmsAnnexureFiles(
                    formData.wmsAnnexures?.[row.key],
                  );
                  const annexCell =
                    afiles.length > 0 ? `Annexure #${row.seq}` : "—";
                  const fileCell =
                    afiles.length > 0
                      ? afiles.map((f) => f.name).join(", ")
                      : "—";
                  return (
                    <tr key={row.key}>
                      <td
                        className="border border-gray-400 px-1 py-1 text-center"
                        style={{ verticalAlign: "middle" }}
                      >
                        {row.seq}
                      </td>
                      <td
                        className="border border-gray-400 px-1 py-1 text-center font-semibold"
                        style={{ verticalAlign: "middle" }}
                      >
                        {annexCell}
                      </td>
                      <td
                        className="border border-gray-400 px-1 py-1"
                        style={{ verticalAlign: "middle" }}
                      >
                        Annexure {row.seq} — {row.title}
                      </td>
                      <td
                        className="border border-gray-400 px-1 py-1 break-all text-[7px]"
                        style={{ verticalAlign: "middle" }}
                      >
                        {fileCell}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="text-[8px] text-gray-600 mt-2 italic leading-snug">
              Annexure PDFs / files follow on the next pages (Annexure 1–4).
            </p>
          </div>
          <PageFooter pageNo={p} rev="0" date={docIssueDate} />
        </div>,
      );

      wmsAnnexureRenderGroups.forEach((group) => {
        p += 1;
        nodes.push(
          <AnnexureSeparatorPage
            key={`wms-sep-${group.key}`}
            annexureNo={group.seq}
            titleOverride={`ANNEXURE – ${group.seq}`}
            description={group.label}
            pageNumber={p}
            totalPages={tp}
            LogoHeader={LogoHeader}
            issueDate={docIssueDate}
          />,
        );

        if (
          group.key === "annexure2" &&
          group.showManualITP &&
          group.manualITP.length > 0
        ) {
          p += 1;
          nodes.push(
            <div
              key="wms-manual-itp"
              data-pdf-page
              className="bg-white font-sans text-gray-900 flex flex-col border border-gray-800"
              style={{
                width: "210mm",
                minHeight: "297mm",
                padding: "12mm 15mm",
                boxSizing: "border-box",
                position: "relative",
              }}
            >
              <LogoHeader />
              <div className="flex-1 mt-6">
                <h3 className="text-xs font-bold uppercase mb-4 text-center">
                  Inspection & Test Plan (ITP)
                </h3>
                <table className="w-full text-left text-[9px] border-collapse border border-gray-400">
                  <thead className="bg-gray-100/80">
                    <tr>
                      <th className="border border-gray-400 px-2 py-1.5 w-12 text-center font-bold">
                        Sl No.
                      </th>
                      <th className="border border-gray-400 px-2 py-1.5 w-[25%] font-bold">
                        Stages
                      </th>
                      <th className="border border-gray-400 px-2 py-1.5 w-[45%] font-bold">
                        Acceptance Criteria
                      </th>
                      <th className="border border-gray-400 px-2 py-1.5 w-32 font-bold">
                        Control Point
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.manualITP.map((row, idx) => (
                      <tr key={row.id}>
                        <td className="border border-gray-400 px-2 py-1.5 text-center font-medium text-gray-700">
                          {idx + 1}
                        </td>
                        <td className="border border-gray-400 px-2 py-1.5 whitespace-pre-wrap text-gray-800">
                          {row.stages}
                        </td>
                        <td className="border border-gray-400 px-2 py-1.5 whitespace-pre-wrap text-gray-800">
                          {row.criteria}
                        </td>
                        <td className="border border-gray-400 px-2 py-1.5 text-gray-800">
                          {row.controlPoint}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <PageFooter pageNo={p} rev="0" date={docIssueDate} />
            </div>,
          );
        }

        if (
          group.key === "annexure4" &&
          group.showManualHIRA &&
          group.manualHIRA.length > 0
        ) {
          p += 1;
          nodes.push(
            <div
              key="wms-manual-hira"
              data-pdf-page
              className="bg-white font-sans text-gray-900 flex flex-col border border-gray-800"
              style={{
                width: "210mm",
                minHeight: "297mm",
                padding: "12mm 15mm",
                boxSizing: "border-box",
                position: "relative",
              }}
            >
              <LogoHeader />
              <div className="flex-1 mt-6">
                <h3 className="text-xs font-bold uppercase mb-4 text-center">
                  Hazard Identification & Risk Assessment (HIRA)
                </h3>
                <table className="w-full text-left text-[8px] border-collapse border border-gray-400">
                  <thead className="bg-gray-100/80">
                    <tr>
                      <th
                        rowSpan={2}
                        className="border border-gray-400 px-1 py-1 w-8 text-center font-bold"
                      >
                        Sl No.
                      </th>
                      <th
                        rowSpan={2}
                        className="border border-gray-400 px-1 py-1 w-[12%] font-bold"
                      >
                        Sub Activity
                      </th>
                      <th
                        rowSpan={2}
                        className="border border-gray-400 px-1 py-1 w-[15%] font-bold"
                      >
                        Hazards
                      </th>
                      <th
                        rowSpan={2}
                        className="border border-gray-400 px-1 py-1 w-[15%] font-bold"
                      >
                        Risk
                      </th>
                      <th
                        colSpan={3}
                        className="border border-gray-400 px-1 py-1 text-center font-bold"
                      >
                        Initial Risk
                      </th>
                      <th
                        rowSpan={2}
                        className="border border-gray-400 px-1 py-1 w-[20%] font-bold"
                      >
                        Control Measures
                      </th>
                      <th
                        colSpan={3}
                        className="border border-gray-400 px-1 py-1 text-center font-bold"
                      >
                        Final Risk
                      </th>
                      <th
                        rowSpan={2}
                        className="border border-gray-400 px-1 py-1 w-16 font-bold"
                      >
                        Responsible
                      </th>
                    </tr>
                    <tr>
                      <th className="border border-gray-400 px-1 py-1 w-6 text-center">
                        S
                      </th>
                      <th className="border border-gray-400 px-1 py-1 w-6 text-center">
                        L
                      </th>
                      <th className="border border-gray-400 px-1 py-1 w-6 text-center">
                        R
                      </th>
                      <th className="border border-gray-400 px-1 py-1 w-6 text-center">
                        S
                      </th>
                      <th className="border border-gray-400 px-1 py-1 w-6 text-center">
                        L
                      </th>
                      <th className="border border-gray-400 px-1 py-1 w-6 text-center">
                        R
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.manualHIRA.map((row, idx) => {
                      const initialS = Number(row.initialSeverity) || 0;
                      const initialL = Number(row.initialLikelihood) || 0;
                      const initialR = initialS * initialL;
                      const finalL = Number(row.finalLikelihood) || 0;
                      const finalR = initialS * finalL;

                      return (
                        <tr key={row.id}>
                          <td className="border border-gray-400 px-1 py-1 text-center font-medium text-gray-700">
                            {idx + 1}
                          </td>
                          <td className="border border-gray-400 px-1 py-1 whitespace-pre-wrap text-gray-800">
                            {row.subActivity}
                          </td>
                          <td className="border border-gray-400 px-1 py-1 whitespace-pre-wrap text-gray-800">
                            {row.hazards}
                          </td>
                          <td className="border border-gray-400 px-1 py-1 whitespace-pre-wrap text-gray-800">
                            {row.risk}
                          </td>
                          <td className="border border-gray-400 px-1 py-1 text-center">
                            {row.initialSeverity}
                          </td>
                          <td className="border border-gray-400 px-1 py-1 text-center">
                            {row.initialLikelihood}
                          </td>
                          <td className="border border-gray-400 px-1 py-1 text-center font-bold">
                            {initialR || ""}
                          </td>
                          <td className="border border-gray-400 px-1 py-1 whitespace-pre-wrap text-gray-800">
                            {row.controlMeasures}
                          </td>
                          <td className="border border-gray-400 px-1 py-1 text-center text-gray-500">
                            {initialS || ""}
                          </td>
                          <td className="border border-gray-400 px-1 py-1 text-center">
                            {row.finalLikelihood}
                          </td>
                          <td className="border border-gray-400 px-1 py-1 text-center font-bold">
                            {finalR || ""}
                          </td>
                          <td className="border border-gray-400 px-1 py-1 whitespace-pre-wrap text-gray-800">
                            {row.responsible}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <PageFooter pageNo={p} rev="0" date={docIssueDate} />
            </div>,
          );

          // Render the HIRA Guidance Tables right after the HIRA table
          p += 1;
          nodes.push(
            <div
              key="wms-manual-hira-guidance"
              data-pdf-page
              className="bg-white font-sans text-gray-900 flex flex-col border border-gray-800"
              style={{
                width: "210mm",
                minHeight: "297mm",
                padding: "12mm 15mm",
                boxSizing: "border-box",
                position: "relative",
              }}
            >
              <LogoHeader />
              <div className="flex-1 mt-6 text-[8px] space-y-4">
                {/* TABLE 1: LIKELIHOOD */}
                <div className="border border-gray-400">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr>
                        <th
                          colSpan={3}
                          className="bg-gray-100/80 border-b border-gray-400 py-1.5 px-2 font-bold uppercase text-center"
                        >
                          DETERMINING RISK LIKELIHOOD – GUIDANCE CRITERIA
                        </th>
                      </tr>
                      <tr className="bg-gray-50 border-b border-gray-400 text-center">
                        <th className="border-r border-gray-400 py-1 px-2 font-semibold w-[20%]">
                          Likelihood
                        </th>
                        <th className="border-r border-gray-400 py-1 px-2 font-semibold w-[15%]">
                          Weightage
                        </th>
                        <th className="py-1 px-2 font-semibold text-left">
                          Criteria
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-gray-400">
                        <td className="border-r border-gray-400 py-1 px-2 font-semibold text-center">
                          Unlikely
                        </td>
                        <td className="border-r border-gray-400 font-bold text-center">
                          1
                        </td>
                        <td className="py-1 px-2">
                          It is un heard in the industry
                        </td>
                      </tr>
                      <tr className="border-b border-gray-400">
                        <td className="border-r border-gray-400 py-1 px-2 font-semibold text-center">
                          Likely
                        </td>
                        <td className="border-r border-gray-400 font-bold text-center">
                          2
                        </td>
                        <td className="py-1 px-2">
                          It has rarely occurred in other construction companies
                        </td>
                      </tr>
                      <tr className="border-b border-gray-400">
                        <td className="border-r border-gray-400 py-1 px-2 font-semibold text-center">
                          Highly Unlikely
                        </td>
                        <td className="border-r border-gray-400 font-bold text-center">
                          3
                        </td>
                        <td className="py-1 px-2">
                          It has occurred in other construction company
                        </td>
                      </tr>
                      <tr className="border-b border-gray-400">
                        <td className="border-r border-gray-400 py-1 px-2 font-semibold text-center">
                          Very Likely
                        </td>
                        <td className="border-r border-gray-400 font-bold text-center">
                          4
                        </td>
                        <td className="py-1 px-2">
                          It has occurred in other project sites of the company
                        </td>
                      </tr>
                      <tr>
                        <td className="border-r border-gray-400 py-1 px-2 font-semibold text-center">
                          Certain
                        </td>
                        <td className="border-r border-gray-400 font-bold text-center">
                          5
                        </td>
                        <td className="py-1 px-2">
                          It has occurred several times at the site location in
                          a year
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* TABLE 2: SEVERITY */}
                <div className="border border-gray-400">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr>
                        <th
                          colSpan={4}
                          className="bg-gray-100/80 border-b border-gray-400 py-1.5 px-2 font-bold uppercase text-center"
                        >
                          DETERMINING RISK SEVERITY LEVEL - GUIDANCE CRITERIA
                        </th>
                      </tr>
                      <tr>
                        <th
                          colSpan={4}
                          className="bg-gray-100/80 border-b border-gray-400 py-1.5 px-2 font-bold text-center"
                        >
                          Severity Descriptions
                          <br />
                          <span className="font-normal text-[7px]">
                            (The highest category shall always be used)
                          </span>
                        </th>
                      </tr>
                      <tr className="bg-gray-50 border-b border-gray-400 text-center">
                        <th
                          rowSpan={2}
                          className="border-r border-gray-400 py-1 px-2 font-semibold w-[10%] align-middle"
                        >
                          Value
                        </th>
                        <th
                          colSpan={2}
                          className="border-r border-gray-400 py-1 px-2 font-semibold w-1/2"
                        >
                          Result of Hazard to Personal
                        </th>
                        <th
                          rowSpan={2}
                          className="py-1 px-2 font-semibold w-[40%] align-middle"
                        >
                          Severity of the Environmental Impact
                        </th>
                      </tr>
                      <tr className="bg-gray-50 border-b border-gray-400 text-center">
                        <th className="border-r border-gray-400 py-1 px-2 font-semibold">
                          Safety
                        </th>
                        <th className="border-r border-gray-400 py-1 px-2 font-semibold">
                          Health
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-gray-400">
                        <td className="border-r border-gray-400 py-1 px-2 font-bold text-center">
                          5
                        </td>
                        <td className="border-r border-gray-400 py-1 px-2">
                          Single or Multiple Fatality
                        </td>
                        <td className="border-r border-gray-400 py-1 px-2">
                          Terminal Illness
                        </td>
                        <td className="py-1 px-2">Massive effect</td>
                      </tr>
                      <tr className="border-b border-gray-400">
                        <td className="border-r border-gray-400 py-1 px-2 font-bold text-center">
                          4
                        </td>
                        <td className="border-r border-gray-400 py-1 px-2">
                          Serious injury requiring hospitalization
                        </td>
                        <td className="border-r border-gray-400 py-1 px-2">
                          Unemployed due to illness
                        </td>
                        <td className="py-1 px-2">Major effect</td>
                      </tr>
                      <tr className="border-b border-gray-400">
                        <td className="border-r border-gray-400 py-1 px-2 font-bold text-center">
                          3
                        </td>
                        <td className="border-r border-gray-400 py-1 px-2">
                          Lost Time injury
                        </td>
                        <td className="border-r border-gray-400 py-1 px-2">
                          Intense health effect
                        </td>
                        <td className="py-1 px-2">Localized effect</td>
                      </tr>
                      <tr className="border-b border-gray-400">
                        <td className="border-r border-gray-400 py-1 px-2 font-bold text-center">
                          2
                        </td>
                        <td className="border-r border-gray-400 py-1 px-2">
                          Injury requiring Medical treatment but no Lost Time
                        </td>
                        <td className="border-r border-gray-400 py-1 px-2">
                          Minor health effect
                        </td>
                        <td className="py-1 px-2">Minor effect</td>
                      </tr>
                      <tr>
                        <td className="border-r border-gray-400 py-1 px-2 font-bold text-center">
                          1
                        </td>
                        <td className="border-r border-gray-400 py-1 px-2">
                          First Treatment only
                        </td>
                        <td className="border-r border-gray-400 py-1 px-2">
                          Slight health effect
                        </td>
                        <td className="py-1 px-2">Slight effect</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* TABLE 3: MATRIX */}
                <div className="border border-gray-400">
                  <table className="w-full border-collapse text-center whitespace-nowrap">
                    <thead>
                      <tr>
                        <th
                          colSpan={6}
                          className="bg-gray-100/80 border-b border-gray-400 py-1.5 font-bold uppercase"
                        >
                          A.5 RISK PRIORITIZATION INDICATORS
                        </th>
                      </tr>
                      <tr className="bg-gray-50 border-b border-gray-400">
                        <th className="border-r border-gray-400 py-1.5 px-2 font-semibold">
                          Severity / Likelihood
                        </th>
                        <th className="border-r border-gray-400 py-1.5 px-2 font-semibold">
                          Insignificant (1)
                        </th>
                        <th className="border-r border-gray-400 py-1.5 px-2 font-semibold">
                          Slightly Harmful (2)
                        </th>
                        <th className="border-r border-gray-400 py-1.5 px-2 font-semibold">
                          Harmful (3)
                        </th>
                        <th className="border-r border-gray-400 py-1.5 px-2 font-semibold">
                          Very Harmful (4)
                        </th>
                        <th className="py-1.5 px-2 font-semibold">
                          Extremely Harmful (5)
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-gray-400">
                        <td className="border-r border-gray-400 py-1.5 px-2 font-medium text-left bg-white">
                          Highly Unlikely (1)
                        </td>
                        <td className="border-r border-gray-400 py-1.5 px-2 bg-[#92D050] text-gray-900 font-medium">
                          TRIVIAL (1)
                        </td>
                        <td className="border-r border-gray-400 py-1.5 px-2 bg-[#92D050] text-gray-900 font-medium">
                          TRIVIAL (2)
                        </td>
                        <td className="border-r border-gray-400 py-1.5 px-2 bg-[#92D050] text-gray-900 font-medium">
                          TOLERABLE (3)
                        </td>
                        <td className="border-r border-gray-400 py-1.5 px-2 bg-[#92D050] text-gray-900 font-medium">
                          TOLERABLE (4)
                        </td>
                        <td className="py-1.5 px-2 bg-[#92D050] text-gray-900 font-medium">
                          MODERATE (5)
                        </td>
                      </tr>
                      <tr className="border-b border-gray-400">
                        <td className="border-r border-gray-400 py-1.5 px-2 font-medium text-left bg-white">
                          UNLIKELY (2)
                        </td>
                        <td className="border-r border-gray-400 py-1.5 px-2 bg-[#92D050] text-gray-900 font-medium">
                          TRIVIAL (2)
                        </td>
                        <td className="border-r border-gray-400 py-1.5 px-2 bg-[#92D050] text-gray-900 font-medium">
                          TOLERABLE (4)
                        </td>
                        <td className="border-r border-gray-400 py-1.5 px-2 bg-[#92D050] text-gray-900 font-medium">
                          MODERATE (6)
                        </td>
                        <td className="border-r border-gray-400 py-1.5 px-2 bg-[#92D050] text-gray-900 font-medium">
                          MODERATE (8)
                        </td>
                        <td className="py-1.5 px-2 bg-[#FFFF00] text-gray-900 font-medium">
                          SUBSTANTIAL (10)
                        </td>
                      </tr>
                      <tr className="border-b border-gray-400">
                        <td className="border-r border-gray-400 py-1.5 px-2 font-medium text-left bg-white">
                          LIKELY (3)
                        </td>
                        <td className="border-r border-gray-400 py-1.5 px-2 bg-[#92D050] text-gray-900 font-medium">
                          TOLERABLE (3)
                        </td>
                        <td className="border-r border-gray-400 py-1.5 px-2 bg-[#92D050] text-gray-900 font-medium">
                          MODERATE (6)
                        </td>
                        <td className="border-r border-gray-400 py-1.5 px-2 bg-[#92D050] text-gray-900 font-medium">
                          MODERATE (9)
                        </td>
                        <td className="border-r border-gray-400 py-1.5 px-2 bg-[#FFFF00] text-gray-900 font-medium">
                          SUBSTANTIAL (12)
                        </td>
                        <td className="py-1.5 px-2 bg-[#FFFF00] text-gray-900 font-medium">
                          SUBSTANTIAL (15)
                        </td>
                      </tr>
                      <tr className="border-b border-gray-400">
                        <td className="border-r border-gray-400 py-1.5 px-2 font-medium text-left bg-white">
                          VERY LIKELY (4)
                        </td>
                        <td className="border-r border-gray-400 py-1.5 px-2 bg-[#92D050] text-gray-900 font-medium">
                          TOLERABLE (4)
                        </td>
                        <td className="border-r border-gray-400 py-1.5 px-2 bg-[#92D050] text-gray-900 font-medium">
                          MODERATE (8)
                        </td>
                        <td className="border-r border-gray-400 py-1.5 px-2 bg-[#FFFF00] text-gray-900 font-medium">
                          SUBSTANTIAL (12)
                        </td>
                        <td className="border-r border-gray-400 py-1.5 px-2 bg-[#FFFF00] text-gray-900 font-medium">
                          SUBSTANTIAL (16)
                        </td>
                        <td className="py-1.5 px-2 bg-[#FF0000] text-white font-medium">
                          INTOLERABLE (20)
                        </td>
                      </tr>
                      <tr>
                        <td className="border-r border-gray-400 py-1.5 px-2 font-medium text-left bg-white">
                          CERTAIN (5)
                        </td>
                        <td className="border-r border-gray-400 py-1.5 px-2 bg-[#92D050] text-gray-900 font-medium">
                          MODERATE (5)
                        </td>
                        <td className="border-r border-gray-400 py-1.5 px-2 bg-[#FFFF00] text-gray-900 font-medium">
                          SUBSTANTIAL (10)
                        </td>
                        <td className="border-r border-gray-400 py-1.5 px-2 bg-[#FFFF00] text-gray-900 font-medium">
                          SUBSTANTIAL (15)
                        </td>
                        <td className="border-r border-gray-400 py-1.5 px-2 bg-[#FF0000] text-white font-medium">
                          INTOLERABLE (20)
                        </td>
                        <td className="py-1.5 px-2 bg-[#FF0000] text-white font-medium">
                          INTOLERABLE (25)
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* TABLE 4: DEFINITION */}
                <div className="border border-gray-400">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr>
                        <th
                          colSpan={3}
                          className="bg-gray-100/80 border-b border-gray-400 py-1.5 px-2 font-bold uppercase text-center"
                        >
                          DEFINITION OF LEVEL OF WORKS
                        </th>
                      </tr>
                      <tr className="bg-gray-50 border-b border-gray-400 text-center">
                        <th className="border-r border-gray-400 py-1 px-2 font-semibold w-1/4">
                          RISK LEVEL
                        </th>
                        <th className="border-r border-gray-400 py-1 px-2 font-semibold">
                          ACTION AND TIME SCALE
                        </th>
                        <th className="py-1 px-2 font-semibold w-1/4">
                          CATEGORY
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-gray-400">
                        <td className="border-r border-gray-400 py-1 px-2 font-medium text-center">
                          TRIVIAL
                        </td>
                        <td
                          rowSpan={3}
                          className="border-r border-gray-400 py-1 px-4 align-middle leading-relaxed"
                        >
                          Continue with the current activity. Monitoring is
                          required to ensure that the controls are effectively
                          maintained.
                        </td>
                        <td
                          rowSpan={3}
                          className="py-1 px-4 align-middle text-center"
                        >
                          Acceptable
                          <br />
                          <span className="text-gray-500">(Low Risk)</span>
                        </td>
                      </tr>
                      <tr className="border-b border-gray-400">
                        <td className="border-r border-gray-400 py-1 px-2 font-medium text-center">
                          TOLERABLE
                        </td>
                      </tr>
                      <tr className="border-b border-gray-400">
                        <td className="border-r border-gray-400 py-1 px-2 font-medium text-center">
                          MODERATE
                        </td>
                      </tr>
                      <tr className="border-b border-gray-400">
                        <td className="border-r border-gray-400 py-1 px-2 font-medium text-center">
                          SUBSTANTIAL
                        </td>
                        <td className="border-r border-gray-400 py-1.5 px-4 leading-relaxed">
                          Urgent action is required including engineering /
                          operational controls / administrative controls / PPE /
                          Signages / Training / Behavioral Monitoring.
                        </td>
                        <td className="py-1.5 px-4 text-center">
                          Not Acceptable
                          <br />
                          <span className="text-gray-500">(Medium Risk)</span>
                        </td>
                      </tr>
                      <tr>
                        <td className="border-r border-gray-400 py-1 px-2 font-medium text-center">
                          INTOLERABLE
                        </td>
                        <td className="border-r border-gray-400 py-1.5 px-4 leading-relaxed">
                          Immediate action should be taken. Work should not be
                          started or continued until the impact / risk has been
                          reduced.
                        </td>
                        <td className="py-1.5 px-4 text-center">
                          Not Acceptable
                          <br />
                          <span className="text-gray-500">(High Risk)</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <PageFooter pageNo={p} rev="0" date={docIssueDate} />
            </div>,
          );
        }

        group.files.forEach(({ file, fileKey }) => {
          const contentStart = p + 1;
          p = contentStart;
          nodes.push(
            <MultiPageAnnexure
              key={`wms-file-${fileKey}`}
              annexureNo={group.seq}
              annexureHeadingOverride={`ANNEXURE #${group.seq}`}
              description={group.label}
              file={file}
              LogoHeader={LogoHeader}
              startPageNumber={contentStart}
              totalPages={tp}
              hideAnnexureTitle
            />,
          );
        });
      });
      return nodes;
    }

    if (isProjectPlans) {
      pqpAnnexureGroups.forEach((group) => {
        const { rowId, rowIndex, annexSeq, documentLabel, files } = group;
        const sepTitle = pqpAnnexureMainTitle(annexSeq, rowIndex);
        p += 1;
        nodes.push(
          <AnnexureSeparatorPage
            key={`pqp-sep-${rowId}`}
            titleOverride={sepTitle}
            annexureNo=""
            description={documentLabel}
            pageNumber={p}
            totalPages={tp}
            LogoHeader={LogoHeader}
            issueDate={docIssueDate}
          />,
        );
        files.forEach(({ file, fileKey }) => {
          const contentStart = p + 1;
          p = contentStart;
          nodes.push(
            <MultiPageAnnexure
              key={`pqp-file-${fileKey}`}
              annexureNo={pqpAnnexurePdfNo(annexSeq, rowIndex)}
              annexureHeadingOverride={pqpAnnexurePdfHeading(
                annexSeq,
                rowIndex,
              )}
              description={documentLabel}
              file={file}
              LogoHeader={LogoHeader}
              startPageNumber={contentStart}
              totalPages={tp}
              hideAnnexureTitle
            />,
          );
        });
      });
      return nodes;
    }

    if (isPreQualification) {
      pqdAnnexureGroups.forEach((group) => {
        const { rowId, annexSeq, documentLabel, files } = group;
        p += 1;
        nodes.push(
          <AnnexureSeparatorPage
            key={`pqd-sep-${rowId}`}
            annexureNo={annexSeq}
            titleOverride={`ANNEXURE – ${annexSeq}`}
            description={documentLabel}
            pageNumber={p}
            totalPages={tp}
            LogoHeader={LogoHeader}
            issueDate={docIssueDate}
          />,
        );
        files.forEach(({ file, fileKey }) => {
          const contentStart = p + 1;
          p = contentStart;
          nodes.push(
            <MultiPageAnnexure
              key={`pqd-file-${fileKey}`}
              annexureNo={annexSeq}
              annexureHeadingOverride={`ANNEXURE #${annexSeq}`}
              description={documentLabel}
              file={file}
              LogoHeader={LogoHeader}
              startPageNumber={contentStart}
              totalPages={tp}
              hideAnnexureTitle
            />,
          );
        });
      });
      return nodes;
    }

    if (isDesignMix) {
      dmpAnnexureGroups.forEach((group) => {
        const { rowId, annexSeq, documentLabel, files } = group;
        p += 1;
        nodes.push(
          <AnnexureSeparatorPage
            key={`dmp-sep-${rowId}`}
            annexureNo={annexSeq}
            titleOverride={`ANNEXURE – ${annexSeq}`}
            description={documentLabel}
            pageNumber={p}
            totalPages={tp}
            LogoHeader={LogoHeader}
            issueDate={docIssueDate}
          />,
        );
        files.forEach(({ file, fileKey }) => {
          const contentStart = p + 1;
          p = contentStart;
          nodes.push(
            <MultiPageAnnexure
              key={`dmp-file-${fileKey}`}
              annexureNo={annexSeq}
              annexureHeadingOverride={`ANNEXURE #${annexSeq}`}
              description={documentLabel}
              file={file}
              LogoHeader={LogoHeader}
              startPageNumber={contentStart}
              totalPages={tp}
              hideAnnexureTitle
            />,
          );
        });
      });
      return nodes;
    }

    annexureFiles.forEach((entry) => {
      if (formData.materialType === "full_system") {
        const rowLabel = `Row ${entry.rowIndex || "—"} attachments`;
        const annexureLabel = (entry.annexureNos || []).join(", ");
        p += 1;
        nodes.push(
          <AnnexureSeparatorPage
            key={`sep-full-row-${entry.rowId}`}
            annexureNo={annexureLabel}
            description={rowLabel}
            pageNumber={p}
            totalPages={tp}
            LogoHeader={LogoHeader}
            issueDate={docIssueDate}
          />,
        );

        (entry.files || []).forEach((f) => {
          const contentStart = p + 1;
          p = contentStart;
          nodes.push(
            <MultiPageAnnexure
              key={`full-row-${entry.rowId}-${f.fileKey}`}
              annexureNo={f.annexureNo}
              description={f.description}
              file={f.file}
              LogoHeader={LogoHeader}
              startPageNumber={contentStart}
              totalPages={tp}
              hideAnnexureTitle
            />,
          );
        });
        return;
      }

      const { annexureNo, slNo, files: rowFiles } = entry;
      const checklistItem = checklistItems.find((i) => i.slNo === slNo);
      const annexureDesc = checklistItem?.description || "—";
      const sepKey = String(slNo);
      p += 1;
      nodes.push(
        <AnnexureSeparatorPage
          key={`sep-check-${sepKey}`}
          annexureNo={annexureNo}
          description={annexureDesc}
          pageNumber={p}
          totalPages={tp}
          LogoHeader={LogoHeader}
          issueDate={docIssueDate}
        />,
      );
      (rowFiles || []).forEach((file, idx) => {
        const contentStart = p + 1;
        p = contentStart;
        const multiDesc =
          rowFiles.length > 1
            ? `${annexureDesc} — ${file.name || `${capitalCase("attachment")} ${idx + 1}`}`
            : annexureDesc;
        nodes.push(
          <MultiPageAnnexure
            key={`checklist-annex-${sepKey}-${idx}`}
            annexureNo={annexureNo}
            description={multiDesc}
            file={file}
            LogoHeader={LogoHeader}
            startPageNumber={contentStart}
            totalPages={tp}
            hideAnnexureTitle
          />,
        );
      });
    });

    complianceAnnexures.forEach(({ annexureNo, table, file, rowId }) => {
      const compKey = rowId != null ? `${table.id}-${rowId}` : table.id;
      p += 1;
      nodes.push(
        <AnnexureSeparatorPage
          key={`sep-comp-${compKey}`}
          annexureNo={annexureNo}
          description="COMPLIANCE STATEMENT FOR TECHNICAL REQUIREMENTS"
          pageNumber={p}
          totalPages={tp}
          LogoHeader={LogoHeader}
          issueDate={docIssueDate}
        />,
      );
      const contentStart = p + 1;
      p = contentStart;
      nodes.push(
        <MultiPageAnnexure
          key={`compliance-annex-${compKey}`}
          annexureNo={annexureNo}
          description={table.documentDescription}
          file={file}
          LogoHeader={LogoHeader}
          startPageNumber={contentStart}
          totalPages={tp}
          hideAnnexureTitle
        />,
      );
    });

    const complianceHtmlBlocks =
      formData.materialType === "full_system"
        ? (formData.fullSystemChecklist?.rows || []).flatMap((r) =>
            getFullSystemRowComplianceTables(r).map((table) => ({
              table,
              manufacturerLabel: r.approvedBrand || "—",
              rowIndex:
                (formData.fullSystemChecklist?.rows || []).findIndex(
                  (x) => x.id === r.id,
                ) + 1,
              blockKey: `${table.id}-${r.id}`,
            })),
          )
        : (formData.complianceTables || []).map((t) => ({
            table: t,
            manufacturerLabel: formData.brand || "—",
            rowIndex: null,
            blockKey: t.id,
          }));

    complianceHtmlBlocks.forEach(
      ({ table, manufacturerLabel, rowIndex, blockKey }) => {
        p += 1;
        const pageNo = p;
        nodes.push(
          <div
            key={`compliance-html-${blockKey}`}
            data-pdf-page
            className="bg-white font-serif text-gray-900"
            style={pageStyle}
          >
            <LogoHeader />

            <h1 className="text-sm font-bold text-center tracking-wider uppercase mt-2 mb-3">
              COMPLIANCE STATEMENT FOR TECHNICAL REQUIREMENTS
            </h1>

            <div className="space-y-1 text-[9px] mb-3">
              <p>
                <span className="font-semibold">Material Specification:</span>{" "}
                {table.documentDescription || "—"}
              </p>
              <p>
                <span className="font-semibold">Manufacturer / Supplier:</span>{" "}
                {manufacturerLabel}
              </p>
              {rowIndex != null && (
                <p>
                  <span className="font-semibold">
                    Full material checklist row:
                  </span>{" "}
                  {rowIndex}
                </p>
              )}
            </div>

            <table className="w-full text-[9px] border-collapse border border-gray-400 mb-3">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-400 px-1 py-1 text-center w-6">
                    Sl.
                  </th>
                  <th className="border border-gray-400 px-1 py-1 text-left">
                    Technical Requirements
                  </th>
                  <th className="border border-gray-400 px-1 py-1 text-left">
                    Limits (IS Code)
                  </th>
                  <th className="border border-gray-400 px-1 py-1 text-left">
                    TDS
                  </th>
                  <th className="border border-gray-400 px-1 py-1 text-left">
                    MTC
                  </th>
                  <th className="border border-gray-400 px-1 py-1 text-center w-10">
                    Status
                  </th>
                  <th className="border border-gray-400 px-1 py-1 text-left">
                    Response
                  </th>
                </tr>
              </thead>
              <tbody>
                {table.rows.map((row) => (
                  <tr key={row.id}>
                    <td
                      className="border border-gray-400 px-1 py-1 text-center leading-tight"
                      style={{ verticalAlign: "middle" }}
                    >
                      {row.slNo}
                    </td>
                    <td
                      className="border border-gray-400 px-1 py-1 leading-tight"
                      style={{ verticalAlign: "middle" }}
                    >
                      {row.technicalRequirement || "—"}
                    </td>
                    <td
                      className="border border-gray-400 px-1 py-1 leading-tight"
                      style={{ verticalAlign: "middle" }}
                    >
                      {row.limits || "—"}
                    </td>
                    <td
                      className="border border-gray-400 px-1 py-1 leading-tight"
                      style={{ verticalAlign: "middle" }}
                    >
                      {row.valuesPerTDS || "—"}
                    </td>
                    <td
                      className="border border-gray-400 px-1 py-1 leading-tight"
                      style={{ verticalAlign: "middle" }}
                    >
                      {row.valuesPerMTC || "—"}
                    </td>
                    <td
                      className="border border-gray-400 px-1 py-1 text-center font-semibold leading-tight"
                      style={{ verticalAlign: "middle" }}
                    >
                      {row.status}
                    </td>
                    <td
                      className="border border-gray-400 px-1 py-1 leading-tight"
                      style={{ verticalAlign: "middle" }}
                    >
                      {row.contractorsResponse || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-[9px]">
              <span>
                <span className="font-bold">CP:</span> Comply
              </span>
              <span>
                <span className="font-bold">PC:</span> Partially Comply
              </span>
              <span>
                <span className="font-bold">NC:</span> Not Comply
              </span>
              <span>
                <span className="font-bold">NA:</span> Not Applicable
              </span>
            </div>

            <PageFooter pageNo={pageNo} rev="0" date={docIssueDate} />
          </div>,
        );
      },
    );

    return nodes;
  };

  const previewBody = (
    <div ref={previewScrollRef} className="space-y-4 pb-8">
      {/* ===== PAGE 1: TRANSMITTAL OF DOCUMENTS ===== */}
      <div
        data-pdf-page
        className="bg-white font-serif text-gray-900"
        style={pageStyle}
      >
        <LogoHeader />

        <h1 className="text-sm font-bold text-center tracking-wider uppercase mt-2 mb-3">
          TRANSMITTAL OF DOCUMENTS
        </h1>

        {/* Header info grid (matches TransmittalHeader layout) */}
        <div className="w-full text-[9px] border border-gray-400 mb-3">
          {/* Row 1: Transmittal Ref. No + Date */}
          <table className="w-full border-collapse">
            <tbody>
              <tr>
                <td
                  className="border border-gray-400 px-2 py-1.5 font-semibold bg-gray-50 w-[30%]"
                  style={{ verticalAlign: "middle" }}
                >
                  Transmittal Ref. No:
                </td>
                <td
                  className="border border-gray-400 px-2 py-1.5 w-[20%]"
                  style={{ verticalAlign: "middle" }}
                >
                  {formData.transmittalRefNo}
                </td>
                <td
                  className="border border-gray-400 px-2 py-1.5 font-semibold bg-gray-50 w-[15%]"
                  style={{ verticalAlign: "middle" }}
                >
                  Date:
                </td>
                <td
                  className="border border-gray-400 px-2 py-1.5 w-[35%]"
                  style={{ verticalAlign: "middle" }}
                >
                  {formData.date}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Row 2: Project Name + Block Name */}
          {/* <table className="w-full border-collapse">
            <tbody>
              <tr>
                <td className="border border-gray-400 px-2 py-1.5 w-1/2">
                  <div className="font-semibold">Project Name:</div>
                  <div>{formData.projectName || "—"}</div>
                </td>
                <td className="border border-gray-400 px-2 py-1.5 w-1/2">
                  <div className="font-semibold">Block Name:</div>
                  <div>{formData.blockNo || "—"}</div>
                </td>
              </tr>
            </tbody>
          </table> */}

          <table className="w-full border-collapse">
            <tbody>
              <tr>
                <td
                  className="border border-gray-400 px-2 py-1.5 font-semibold bg-gray-50 w-[30%]"
                  style={{ verticalAlign: "middle" }}
                >
                  Project Name:
                </td>
                <td
                  className="border border-gray-400 px-2 py-1.5 w-[20%]"
                  style={{ verticalAlign: "middle" }}
                >
                  {safeCapitalCaseName(formData.projectName) || "—"}
                </td>
                <td
                  className="border border-gray-400 px-2 py-1.5 font-semibold bg-gray-50 w-[15%]"
                  style={{ verticalAlign: "middle" }}
                >
                  Block Name:
                </td>
                <td
                  className="border border-gray-400 px-2 py-1.5 w-[35%]"
                  style={{ verticalAlign: "middle" }}
                >
                  {safeCapitalCaseName(formData.blockNo) || "—"}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Row 3: Location + Project No + Work Order # */}
          {/*   <table className="w-full border-collapse">
          <tbody>
              <tr>
                <td className="border border-gray-400 px-2 py-1.5 w-1/3">
                  <div className="font-semibold">Location:</div>
                  <div>{formData.location || "—"}</div>
                </td>
                <td className="border border-gray-400 px-2 py-1.5 w-1/3">
                  <div className="font-semibold">Project No:</div>
                  <div>{formData.projectNo || "—"}</div>
                </td>
                <td className="border border-gray-400 px-2 py-1.5 w-1/3">
                  <div className="font-semibold">Work Order #:</div>
                  <div>{formData.workOrderNo || "—"}</div>
                </td>
              </tr>
            </tbody>
          </table> */}
          <table className="w-full border-collapse">
            <tbody>
              <tr>
                <td
                  className="border border-gray-400 px-2 py-1.5 font-semibold bg-gray-50 w-[16.67% ]"
                  style={{ verticalAlign: "middle" }}
                >
                  Location:
                </td>
                <td
                  className="border border-gray-400 px-2 py-1.5 w-[16.67%]"
                  style={{ verticalAlign: "middle" }}
                >
                  {formData.location || "—"}
                </td>
                <td
                  className="border border-gray-400 px-2 py-1.5 font-semibold bg-gray-50 w-[16.67%]"
                  style={{ verticalAlign: "middle" }}
                >
                  Project No:
                </td>
                <td
                  className="border border-gray-400 px-2 py-1.5 w-[16.67%]"
                  style={{ verticalAlign: "middle" }}
                >
                  {formData.projectNo || "—"}
                </td>
                <td
                  className="border border-gray-400 px-2 py-1.5 font-semibold bg-gray-50 w-[16.67%]"
                  style={{ verticalAlign: "middle" }}
                >
                  Work Order #:
                </td>
                <td
                  className="border border-gray-400 px-2 py-1.5 w-[16.67%]"
                  style={{ verticalAlign: "middle" }}
                >
                  {formData.workOrderNo || "—"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Type of Document */}
        <div className="mb-3">
          <p className="text-[10px] text-gray-900">
            <span className="font-bold">Type of document :</span>{" "}
            <span className="font-semibold">
              {formData.documentType
                ? capitalCaseLabel(formData.documentType)
                : "—"}
            </span>
          </p>
        </div>

        {/* Submittal Details */}
        <div className="mb-3">
          <h2 className="text-[10px] font-bold mb-1">1. SUBMITTAL DETAILS</h2>

          <table className="w-full text-[9px] border-collapse border border-gray-400">
            <thead>
              <tr className="bg-gray-100">
                <th
                  className="border border-gray-400 px-1.5 py-1 text-left w-8"
                  style={{ verticalAlign: "middle" }}
                >
                  Sr.
                </th>
                <th
                  className="border border-gray-400 px-1.5 py-1 text-left"
                  style={{ verticalAlign: "middle" }}
                >
                  Document No.
                </th>
                <th
                  className="border border-gray-400 px-1.5 py-1 text-left w-10"
                  style={{ verticalAlign: "middle" }}
                >
                  Rev.
                </th>
                <th
                  className="border border-gray-400 px-1.5 py-1 text-left w-12"
                  style={{ verticalAlign: "middle" }}
                >
                  Copies
                </th>
                <th
                  className="border border-gray-400 px-1.5 py-1 text-left"
                  style={{ verticalAlign: "middle" }}
                >
                  {getDescriptionLabelForDocumentType(formData.documentType)}
                </th>
                <th
                  className="border border-gray-400 px-1.5 py-1 text-left w-24"
                  style={{ verticalAlign: "middle" }}
                >
                  Remarks
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td
                  className="border border-gray-400 px-1.5 py-1 text-center"
                  style={{ verticalAlign: "middle" }}
                >
                  1
                </td>
                <td
                  className="border border-gray-400 px-1.5 py-1"
                  style={{ verticalAlign: "middle" }}
                >
                  {formData.materialRefNo || "—"}
                </td>
                <td
                  className="border border-gray-400 px-1.5 py-1 text-center"
                  style={{ verticalAlign: "middle" }}
                >
                  0
                </td>
                <td
                  className="border border-gray-400 px-1.5 py-1 text-center"
                  style={{ verticalAlign: "middle" }}
                >
                  1
                </td>
                <td
                  className="border border-gray-400 px-1.5 py-1"
                  style={{ verticalAlign: "middle" }}
                >
                  {isProjectPlans
                    ? formData.materialDescription?.trim() ||
                      "Project Quality Plan"
                    : isPreQualification
                      ? formData.materialDescription?.trim() ||
                        "Pre Qualification"
                      : isDesignMix
                        ? formData.materialDescription?.trim() ||
                          "Design Mix Submission"
                        : isMethodStatement
                          ? formData.materialDescription?.trim() ||
                            "Method Statement"
                          : formData.materialDescription?.trim()
                            ? formData.materialDescription.trim()
                            : getDefaultMaterialSubmittalDescription(
                                formData.product,
                                formData.brand,
                              ) || "—"}
                </td>
                <td
                  className="border border-gray-400 px-1.5 py-1"
                  style={{ verticalAlign: "middle" }}
                >
                  {formData.materialRemarks || ""}
                </td>
              </tr>
            </tbody>
          </table>
          <p className="text-[9px] mb-1">
            Area of Application:{" "}
            <span className="font-medium">
              {formData.areaOfApplication || "—"}
            </span>
          </p>
        </div>

        {/* Transmitted For */}
        {/* <div className="mb-3">
          <div className="flex items-center gap-3">
            <p className="text-[9px] font-bold whitespace-nowrap">These are transmitted for:</p>
            <div className="flex gap-4 text-[9px]">
              {["Information", "Approval"].map((opt) => (
                <div key={opt} className="flex items-center gap-1">
                  <span className="w-3 h-3 border border-gray-400 flex items-center justify-center text-[9px] font-bold flex-shrink-0">
                    {formData.transmittedFor === opt ? "✓" : ""}
                  </span>
                  <span>{opt}</span>
                </div>
              ))}
            </div>
          </div>
        </div> */}

        {/* Signatures */}
        <div className="grid grid-cols-2 gap-4 mb-3 text-[9px]">
          <div className="border border-gray-400 p-2 space-y-3">
            <p className="font-bold">
              Submitted By:{" "}
              <span className="font-normal">{loggedInUserName}</span>
            </p>
            <p>Date: {nowDateTime}</p>
          </div>
          <div className="border border-gray-400 p-2 space-y-3">
            <p className="font-bold">Received By:</p>
            <p>Signature: _______________</p>
            <p>Date: _______________</p>
          </div>
        </div>

        {/* Consultant Comments */}
        <div className="mb-2">
          <h2 className="text-[10px] font-bold mb-1">
            2. THE CONSULTANT / ENGINEER COMMENTS:
          </h2>
          <div className="border border-gray-400 p-2 min-h-[15mm]"></div>
        </div>

        {/* Status Legend */}
        <div className="mb-2">
          <p className="text-[9px] font-bold mb-1">Code Legend:</p>
          <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-[9px]">
            {[
              { code: "A", label: "Approved" },
              { code: "B", label: "Approved as noted" },
              { code: "C", label: "Resubmit For Approval" },
              { code: "D", label: "Rejected" },
              { code: "E", label: "Noted & Accepted" },
            ].map((s) => (
              <span key={s.code} className="inline-flex items-center gap-1">
                {/* Checkbox intentionally left unchecked (backend will tick later) */}
                <span className="inline-block w-[10px] h-[10px] border border-gray-500 rounded-sm bg-white" />
                <span>{capitalCase(s.label)}</span>
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-[9px]">
          <div className="border border-gray-400 p-2 space-y-3">
            <p className="font-bold">
              Status released By:{" "}
              <span className="font-normal">{loggedInUserName}</span>
            </p>
            <p>Date: {nowDateTime}</p>
          </div>
        </div>

        <PageFooter pageNo={1} rev="0" date={docIssueDate} />
      </div>

      {/* ===== PAGE 2: MATERIAL CHECKLIST OR PQP DOCUMENT REGISTER ===== */}
      <div
        data-pdf-page
        className="bg-white font-serif text-gray-900"
        style={pageStyle}
      >
        <LogoHeader />

        {isProjectPlans ? (
          <>
            <h1 className="text-sm font-bold text-center tracking-wider uppercase mt-2 mb-3">
              PROJECT QUALITY PLAN — DOCUMENT REGISTER
            </h1>
            <table className="w-full text-[9px] border-collapse border border-gray-400 mb-3">
              <thead>
                <tr className="bg-gray-100">
                  <th
                    className="border border-gray-400 px-1.5 py-1 text-center w-8"
                    style={{ verticalAlign: "middle" }}
                  >
                    Sr.
                  </th>
                  <th
                    className="border border-gray-400 px-1.5 py-1 text-left"
                    style={{ verticalAlign: "middle" }}
                  >
                    Document name
                  </th>
                  <th
                    className="border border-gray-400 px-1.5 py-1 text-center w-28"
                    style={{ verticalAlign: "middle" }}
                  >
                    Annexure reference
                  </th>
                </tr>
              </thead>
              <tbody>
                {(formData.pqpAnnexRows || []).map((row, idx) => {
                  const meta = pqpRowAnnexMeta[row.id];
                  const annexRef = meta
                    ? pqpAnnexureRegisterRef(meta.annexSeq, meta.rowIndex)
                    : "—";
                  return (
                    <tr key={row.id}>
                      <td
                        className="border border-gray-400 px-1.5 py-1.5 text-center"
                        style={{ verticalAlign: "middle" }}
                      >
                        {idx + 1}
                      </td>
                      <td
                        className="border border-gray-400 px-1.5 py-1.5"
                        style={{ verticalAlign: "middle" }}
                      >
                        {getPqpRowDocumentLabel(row, idx)}
                      </td>
                      <td
                        className="border border-gray-400 px-1.5 py-1.5 text-center font-semibold"
                        style={{ verticalAlign: "middle" }}
                      >
                        {annexRef}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </>
        ) : isPreQualification ? (
          <>
            <h1 className="text-sm font-bold text-center tracking-wider uppercase mt-2 mb-3">
              PRE-QUALIFICATION CHECKLIST
            </h1>
            <p className="text-[9px] text-center font-semibold text-gray-800 mb-1">
              {getPqdChecklistTypeLabel(formData.pqdChecklistType) || "—"}
            </p>
            <p className="text-[8px] text-center text-gray-600 mb-3 leading-snug">
              PQD ref: {formData.materialRefNo || "—"} · FC: Fully complied ·
              PC: Partially complied · NA: Not applicable
            </p>
            <table className="w-full text-[8px] border-collapse border border-gray-400 mb-3">
              <thead>
                <tr className="bg-gray-100">
                  <th
                    className="border border-gray-400 px-1 py-1 text-center w-6"
                    style={{ verticalAlign: "middle" }}
                  >
                    Sr.
                  </th>
                  <th
                    className="border border-gray-400 px-1 py-1 text-left"
                    style={{ verticalAlign: "middle" }}
                  >
                    Documents / details required
                  </th>
                  <th
                    className="border border-gray-400 px-1 py-1 text-center w-10"
                    style={{ verticalAlign: "middle" }}
                  >
                    Status
                  </th>
                  <th
                    className="border border-gray-400 px-1 py-1 text-center w-16"
                    style={{ verticalAlign: "middle" }}
                  >
                    Annexure
                  </th>
                  <th
                    className="border border-gray-400 px-1 py-1 text-left w-[22%]"
                    style={{ verticalAlign: "middle" }}
                  >
                    Remarks / comments
                  </th>
                </tr>
              </thead>
              <tbody>
                {(formData.pqdChecklistRows || []).length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="border border-gray-400 px-2 py-3 text-center text-gray-500"
                    >
                      Select a Pre-Qualification checklist type on page 1 to
                      load rows.
                    </td>
                  </tr>
                ) : (
                  (formData.pqdChecklistRows || []).map((row) => {
                    const meta = pqdRowAnnexMeta[row.id];
                    const annexCell = meta
                      ? `Annexure #${meta.annexSeq}`
                      : "NA";
                    const hint = String(row.remarksHint || "").trim();
                    const isCustom = Boolean(row.isCustom);
                    return (
                      <tr key={row.id}>
                        <td
                          className="border border-gray-400 px-1 py-1 text-center tabular-nums"
                          style={{ verticalAlign: "middle" }}
                        >
                          {isCustom ? "—" : row.slNo}
                        </td>
                        <td
                          className="border border-gray-400 px-1 py-1 leading-tight"
                          style={{ verticalAlign: "middle" }}
                        >
                          {row.document || "—"}
                          {!isCustom && hint ? (
                            <div className="mt-0.5 text-[7px] text-gray-700 whitespace-pre-wrap">
                              {hint}
                            </div>
                          ) : null}
                        </td>
                        <td
                          className="border border-gray-400 px-1 py-1 text-center font-semibold"
                          style={{ verticalAlign: "middle" }}
                        >
                          {row.status || "NA"}
                        </td>
                        <td
                          className="border border-gray-400 px-1 py-1 text-center font-semibold"
                          style={{ verticalAlign: "middle" }}
                        >
                          {annexCell}
                        </td>
                        <td
                          className="border border-gray-400 px-1 py-1 leading-tight"
                          style={{ verticalAlign: "middle" }}
                        >
                          {row.remarks || "—"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </>
        ) : isDesignMix ? (
          <>
            <h1 className="text-sm font-bold text-center tracking-wider uppercase mt-2 mb-3">
              DESIGN MIX SUBMISSION — INDEX CHECKLIST
            </h1>
            <p className="text-[8px] text-center text-gray-600 mb-3 leading-snug">
              DMP ref: {formData.materialRefNo || "—"}
            </p>
            <table className="w-full text-[8px] border-collapse border border-gray-400 mb-3">
              <thead>
                <tr className="bg-gray-100">
                  <th
                    className="border border-gray-400 px-1 py-1 text-center w-8"
                    style={{ verticalAlign: "middle" }}
                  >
                    Sr.
                  </th>
                  <th
                    className="border border-gray-400 px-1 py-1 text-left"
                    style={{ verticalAlign: "middle" }}
                  >
                    Document / details required
                  </th>
                  <th
                    className="border border-gray-400 px-1 py-1 text-center w-16"
                    style={{ verticalAlign: "middle" }}
                  >
                    Annexure
                  </th>
                  <th
                    className="border border-gray-400 px-1 py-1 text-left w-[26%]"
                    style={{ verticalAlign: "middle" }}
                  >
                    Remarks
                  </th>
                </tr>
              </thead>
              <tbody>
                {(formData.dmpChecklistRows || []).map((row) => {
                  if (row.kind === "section") {
                    return (
                      <tr key={row.id} className="bg-gray-100">
                        <td
                          colSpan={4}
                          className="border border-gray-400 px-1.5 py-1 font-bold uppercase"
                          style={{ verticalAlign: "middle" }}
                        >
                          {row.document || "—"}
                        </td>
                      </tr>
                    );
                  }
                  const meta = dmpRowAnnexMeta[row.id];
                  const annexCell = meta ? `Annexure #${meta.annexSeq}` : "—";
                  return (
                    <tr key={row.id}>
                      <td
                        className="border border-gray-400 px-1 py-1 text-center tabular-nums whitespace-nowrap"
                        style={{ verticalAlign: "middle" }}
                      >
                        {row.slNo || "—"}
                      </td>
                      <td
                        className="border border-gray-400 px-1 py-1 leading-tight whitespace-pre-wrap"
                        style={{ verticalAlign: "middle" }}
                      >
                        {row.document || "—"}
                      </td>
                      <td
                        className="border border-gray-400 px-1 py-1 text-center font-semibold"
                        style={{ verticalAlign: "middle" }}
                      >
                        {annexCell}
                      </td>
                      <td
                        className="border border-gray-400 px-1 py-1 leading-tight"
                        style={{ verticalAlign: "middle" }}
                      >
                        {row.remarks || "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </>
        ) : isMethodStatement ? (
          <>
            <h1 className="text-sm font-bold text-center tracking-wider uppercase mt-2 mb-3">
              METHOD STATEMENT
            </h1>

            <div className="text-[9px] space-y-3 mb-3 leading-relaxed">
              <div>
                <h2 className="text-[10px] font-bold uppercase tracking-wide text-gray-800 mb-1 border-b border-gray-200 pb-1">
                  Scope and Objective
                </h2>
                <p className="text-[9px] text-gray-900 whitespace-pre-wrap">
                  {String(formData.wmsScopeObjective ?? "").trim() || "—"}
                </p>
              </div>

              <div>
                <h2 className="text-[10px] font-bold uppercase tracking-wide text-gray-800 mb-1 border-b border-gray-200 pb-1">
                  References
                </h2>
                <table className="w-full text-[8px] border-collapse border border-gray-400">
                  <thead>
                    <tr className="bg-gray-100">
                      <th
                        className="border border-gray-400 px-1 py-1 text-center w-8"
                        style={{ verticalAlign: "middle" }}
                      >
                        Sr.
                      </th>
                      <th
                        className="border border-gray-400 px-1 py-1 text-left w-24"
                        style={{ verticalAlign: "middle" }}
                      >
                        Type
                      </th>
                      <th
                        className="border border-gray-400 px-1 py-1 text-left"
                        style={{ verticalAlign: "middle" }}
                      >
                        Section / Class
                      </th>
                      <th
                        className="border border-gray-400 px-1 py-1 text-left"
                        style={{ verticalAlign: "middle" }}
                      >
                        Attachment (file name)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {(formData.wmsReferences || []).length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="border border-gray-400 px-2 py-2 text-center text-gray-500"
                        >
                          —
                        </td>
                      </tr>
                    ) : (
                      (formData.wmsReferences || []).map((row, idx) => {
                        const refFiles = getWmsReferenceRowFiles(row);
                        const names =
                          refFiles.length > 0
                            ? refFiles.map((f) => f.name).join(", ")
                            : "—";
                        return (
                          <tr key={row.id || idx}>
                            <td
                              className="border border-gray-400 px-1 py-1 text-center"
                              style={{ verticalAlign: "middle" }}
                            >
                              {idx + 1}
                            </td>
                            <td
                              className="border border-gray-400 px-1 py-1 font-semibold"
                              style={{ verticalAlign: "middle" }}
                            >
                              {wmsRefTypeLabel(row.refType)}
                            </td>
                            <td
                              className="border border-gray-400 px-1 py-1"
                              style={{ verticalAlign: "middle" }}
                            >
                              {String(row.sectionClass ?? "").trim() || "—"}
                            </td>
                            <td
                              className="border border-gray-400 px-1 py-1 break-all"
                              style={{ verticalAlign: "middle" }}
                            >
                              {names}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
                <p className="text-[8px] text-gray-600 mt-1 leading-snug">
                  Where files are attached above, the &quot;REFERENCE
                  ATTACHMENT&quot; pages follow next in the same order.
                  Construction sequence and annexure index appear on later
                  pages, each followed by their attachments.
                </p>
              </div>
            </div>
          </>
        ) : isLegalDocument ? (
          <>
            <h1 className="text-sm font-bold text-center tracking-wider uppercase mt-2 mb-3">
              LEGAL DOCUMENT REGISTER
            </h1>

            <table className="w-full text-[9px] border-collapse border border-gray-400 mb-3">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-400 px-1.5 py-1 text-center w-8">
                    Sl.No
                  </th>
                  <th className="border border-gray-400 px-1.5 py-1 text-left min-w-[200px]">
                    Document
                  </th>
                  <th className="border border-gray-400 px-1.5 py-1 text-left w-32">
                    Document Number
                  </th>
                  <th className="border border-gray-400 px-1.5 py-1 text-center w-24">
                    Date of Issue
                  </th>
                  <th className="border border-gray-400 px-1.5 py-1 text-center w-24">
                    Validity
                  </th>
                </tr>
              </thead>
              <tbody>
                {(formData.documentsList || []).map((row, idx) => (
                  <tr key={row.id || idx}>
                    <td
                      className="border border-gray-400 px-1.5 py-1.5 text-center leading-tight"
                      style={{ verticalAlign: "middle" }}
                    >
                      {idx + 1}
                    </td>
                    <td
                      className="border border-gray-400 px-1.5 py-1.5 leading-tight"
                      style={{ verticalAlign: "middle" }}
                    >
                      {row.document || "—"}
                    </td>
                    <td
                      className="border border-gray-400 px-1.5 py-1.5 leading-tight"
                      style={{ verticalAlign: "middle" }}
                    >
                      {row.documentNumber || "—"}
                    </td>
                    <td
                      className="border border-gray-400 px-1.5 py-1.5 text-center leading-tight"
                      style={{ verticalAlign: "middle" }}
                    >
                      {row.dateOfIssue || "—"}
                    </td>
                    <td
                      className="border border-gray-400 px-1.5 py-1.5 text-center leading-tight"
                      style={{ verticalAlign: "middle" }}
                    >
                      {row.validity || "—"}
                    </td>
                  </tr>
                ))}
                {(!formData.documentsList ||
                  formData.documentsList.length === 0) && (
                  <tr>
                    <td
                      colSpan={5}
                      className="border border-gray-400 px-1.5 py-2 text-center text-gray-500"
                    >
                      No documents added yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </>
        ) : (
          <>
            <h1 className="text-sm font-bold text-center tracking-wider uppercase mt-2 mb-3">
              {formData.materialType === "full_system"
                ? "FULL MATERIAL CHECKLIST"
                : "MATERIAL SUBMISSION CHECKLIST"}
            </h1>

            {formData.materialType !== "full_system" && (
              <div className="space-y-1.5 text-[9px] mb-3">
                <div className="flex gap-2">
                  <span className="font-semibold min-w-[180px]">
                    Material Submission Reference No:
                  </span>
                  <span>{formData.materialRefNo}</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-semibold min-w-[180px]">Rev:</span>
                  <span>0</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-semibold min-w-[180px]">
                    Material Description:
                  </span>
                  <span>{formData.product}</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-semibold min-w-[180px]">Type:</span>
                  <span>
                    {formData.materialType === "single"
                      ? "Single Material"
                      : formData.materialType === "full_system"
                        ? "Full System with All Accessories"
                        : "—"}
                  </span>
                </div>
                <div className="flex gap-2">
                  <span className="font-semibold min-w-[180px]">
                    Manufacturer & Supplier:
                  </span>
                  <span>{formData.brand}</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-semibold min-w-[180px]">
                    Area of Application:
                  </span>
                  <span>{formData.areaOfApplication}</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-semibold min-w-[180px]">
                    Specification / IS Code Reference:
                  </span>
                  <span>{formData.specReference || "—"}</span>
                </div>
              </div>
            )}

            {formData.materialType === "full_system" ? (
              <div
                className="mb-3 flex items-center justify-center"
                style={{
                  position: "relative",
                  height: "180mm",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    transform: "rotate(-90deg) scale(0.85)",
                    transformOrigin: "center center",
                    width: "260mm",
                  }}
                >
                  <table className="w-full text-[9px] border-collapse border border-gray-400">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-400 px-1.5 py-1 text-center w-6">
                          Sr.
                        </th>
                        {/* <th className="border border-gray-400 px-1.5 py-1 text-left whitespace-nowrap">MAS no.</th>
                    <th className="border border-gray-400 px-1.5 py-1 text-left">BOQ</th> */}
                        <th className="border border-gray-400 px-1.5 py-1 text-left min-w-[72px]">
                          Material description
                        </th>
                        <th className="border border-gray-400 px-1.5 py-1 text-left min-w-[72px]">
                          Material specification
                        </th>
                        <th className="border border-gray-400 px-1.5 py-1 text-left">
                          Approved make
                        </th>
                        <th className="border border-gray-400 px-1.5 py-1 text-left">
                          Proposed make
                        </th>
                        <th className="border border-gray-400 px-1.5 py-1 text-center leading-tight max-w-[56px]">
                          TDS / Catalogue
                        </th>
                        <th className="border border-gray-400 px-1.5 py-1 text-center leading-tight max-w-[56px]">
                          Mfr. test
                        </th>
                        <th className="border border-gray-400 px-1.5 py-1 text-center leading-tight max-w-[56px]">
                          Compliance stmt.
                        </th>
                        <th className="border border-gray-400 px-1.5 py-1 text-center">
                          Annexure Index
                        </th>
                        <th className="border border-gray-400 px-1.5 py-1 text-left">
                          Remark
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {(formData.fullSystemChecklist?.rows || []).map(
                        (row, idx) => (
                          <tr key={row.id}>
                            <td
                              className="border border-gray-400 px-1.5 py-1.5 text-center"
                              style={{ verticalAlign: "middle" }}
                            >
                              {idx + 1}
                            </td>
                            {/* <td className="border border-gray-400 px-1.5 py-1.5 whitespace-nowrap" style={{ verticalAlign: "middle" }}>
                        {formData.materialRefNo || "—"}
                      </td>
                      <td className="border border-gray-400 px-1.5 py-1.5" style={{ verticalAlign: "middle" }}>
                        {row.boq || "—"}
                      </td> */}
                            <td
                              className="border border-gray-400 px-1.5 py-1.5"
                              style={{ verticalAlign: "middle" }}
                            >
                              {row.materialDescription || "—"}
                            </td>
                            <td
                              className="border border-gray-400 px-1.5 py-1.5"
                              style={{ verticalAlign: "middle" }}
                            >
                              {row.materialSpecification || "—"}
                            </td>
                            <td
                              className="border border-gray-400 px-1.5 py-1.5"
                              style={{ verticalAlign: "middle" }}
                            >
                              {row.approvedBrand || "—"}
                            </td>
                            <td
                              className="border border-gray-400 px-1.5 py-1.5"
                              style={{ verticalAlign: "middle" }}
                            >
                              {row.proposedVendors || "—"}
                            </td>
                            {fullSystemStatusDefs.map((s) => (
                              <td
                                key={s.key}
                                className="border border-gray-400 px-1 py-1.5 text-center font-semibold"
                                style={{ verticalAlign: "middle" }}
                              >
                                {row.statusFiles?.[s.key] ? "Available" : "N/A"}
                              </td>
                            ))}
                            <td
                              className="border border-gray-400 px-1 py-1.5 text-center font-semibold"
                              style={{ verticalAlign: "middle" }}
                            >
                              {row.statusFiles?.["complianceStatement"] ||
                              getFullSystemRowComplianceTables(row).length > 0
                                ? "Available"
                                : "N/A"}
                            </td>
                            <td
                              className="border border-gray-400 px-1 py-1.5 text-center font-semibold"
                              style={{ verticalAlign: "middle" }}
                            >
                              {(() => {
                                const nums = [
                                  ...fullSystemStatusDefs.map(
                                    (s) =>
                                      annexureMap[
                                        fullSystemAnnexureKey(row.id, s.key)
                                      ],
                                  ),
                                  annexureMap[
                                    fullSystemAnnexureKey(
                                      row.id,
                                      "complianceStatement",
                                    )
                                  ],
                                  ...getFullSystemRowComplianceTables(row)
                                    .filter((t) => t.attachedFile)
                                    .map(
                                      (t) =>
                                        annexureMap[
                                          fullSystemAnnexureKey(
                                            row.id,
                                            `complianceFile:${t.id}`,
                                          )
                                        ],
                                    ),
                                ].filter(Boolean);
                                const uniqueNums = Array.from(
                                  new Set(nums),
                                ).sort((a, b) => a - b);
                                return uniqueNums.length
                                  ? uniqueNums
                                      .map((n) => `Annexure #${n}`)
                                      .join(", ")
                                  : "N/A";
                              })()}
                            </td>
                            <td
                              className="border border-gray-400 px-1.5 py-1.5"
                              style={{ verticalAlign: "middle" }}
                            >
                              {row.remark || "—"}
                            </td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <table className="w-full text-[9px] border-collapse border border-gray-400 mb-3">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-400 px-1.5 py-1 text-center w-8">
                      Sl.
                    </th>
                    <th className="border border-gray-400 px-1.5 py-1 text-left">
                      Document / Details Required
                    </th>
                    <th className="border border-gray-400 px-1.5 py-1 text-center w-20">
                      Annexure
                    </th>
                    <th className="border border-gray-400 px-1.5 py-1 text-left w-[25%]">
                      Remarks
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {checklistItems.map((item) => {
                    const fileList = getChecklistFilesList(
                      formData.checklistFiles[item.slNo],
                    );
                    const hasFile = fileList.length > 0;
                    const rowAnnexureNo = annexureMap[item.slNo];
                    const isRow5NoUpload = item.slNo === 5;
                    const docCellText = isRow5NoUpload
                      ? "—"
                      : hasFile && rowAnnexureNo != null
                        ? `Annexure #${rowAnnexureNo}`
                        : "NA";
                    const isAlternativeForRow2 =
                      item.slNo === 2 && formData.makeStatus === "alternative";
                    const altReason =
                      formData.checklistAlternativeReasons?.[item.slNo];

                    const remarksContent = isAlternativeForRow2 ? (
                      <div className="text-[9px] space-y-0.5">
                        <p>
                          Written Communication for reason or refusal from
                          Approved Vendor for Justification should be attached.
                        </p>
                        {altReason ? (
                          <p className="mt-1 font-semibold">{altReason}</p>
                        ) : null}
                      </div>
                    ) : (
                      formData.checklistRemarks[item.slNo] || item.remarks
                    );

                    return (
                      <tr key={item.slNo} className="border-b border-gray-400">
                        <td
                          className="border border-gray-400 px-1.5 py-1.5 text-center leading-tight"
                          style={{ verticalAlign: "middle" }}
                        >
                          {item.slNo}
                        </td>
                        <td
                          className="border border-gray-400 px-1.5 py-1.5 leading-tight"
                          style={{ verticalAlign: "middle" }}
                        >
                          {item.slNo === 3 ? (
                            <div>
                              <span>
                                {formData.checklistItem3Option ||
                                  item.description}
                              </span>
                              {formData.checklistItem3SectionClass ? (
                                <div className="mt-1 text-[8px] text-gray-700">
                                  <span className="font-semibold">
                                    Section/ Class:{" "}
                                  </span>
                                  {formData.checklistItem3SectionClass}
                                </div>
                              ) : null}
                            </div>
                          ) : (
                            item.description
                          )}
                          {item.slNo === 2 && (
                            <div className="mt-1 text-[9px] font-medium text-gray-600 leading-tight">
                              Status:{" "}
                              <span className="font-semibold">
                                {makeStatusLabel}
                              </span>
                            </div>
                          )}
                        </td>
                        <td
                          className="border border-gray-400 px-1.5 py-1.5 text-center font-semibold leading-tight"
                          style={{ verticalAlign: "middle" }}
                        >
                          {docCellText}
                        </td>
                        <td
                          className="border border-gray-400 px-1.5 py-1.5 leading-tight"
                          style={{ verticalAlign: "middle" }}
                        >
                          {remarksContent}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {/* Legend */}
            <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-[9px] mt-2">
              <span>
                <span className="font-bold">CP:</span> Comply
              </span>
              <span>
                <span className="font-bold">PC:</span> Partially Comply
              </span>
              <span>
                <span className="font-bold">NC:</span> Not Comply
              </span>
              <span>
                <span className="font-bold">NA:</span> Not Applicable
              </span>
            </div>
          </>
        )}

        <PageFooter pageNo={2} rev="0" date={docIssueDate} />
      </div>

      {/* Annexure separators + attachments, then compliance statement tables (last) */}
      {renderPostChecklistPages()}
    </div>
  );

  if (isEmbedded) {
    return (
      <div className="flex flex-col h-full min-h-0">
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-gray-50 sticky top-0 z-10 shrink-0">
          <span className="text-xs font-semibold text-gray-500">
            Live Preview
          </span>
          <button
            type="button"
            onClick={handleDownload}
            disabled={isGeneratingPdf}
            className="h-7 text-xs gap-1.5 inline-flex items-center rounded-md border border-gray-200 bg-white px-3 py-1 hover:bg-gray-50 disabled:opacity-50"
          >
            {isGeneratingPdf ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                {capitalCase("generating")}…
              </>
            ) : (
              <>
                <Download className="w-3 h-3" />
                {capitalCase("download pdf")}
              </>
            )}
          </button>
        </div>
        <div
          ref={previewContainerRef}
          className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden bg-gray-200 p-4 flex justify-center"
        >
          <div
            ref={scaleWrapperRef}
            className="inline-block origin-top"
            style={{ zoom: previewScale }}
          >
            {previewBody}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex flex-col min-h-0">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200 shrink-0">
        <span className="text-sm font-semibold">
          {capitalCase("document preview")}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownload}
            disabled={isGeneratingPdf}
            className="h-8 text-xs gap-1.5 inline-flex items-center rounded-md border border-gray-200 bg-white px-3 py-1 hover:bg-gray-50 disabled:opacity-50"
          >
            {isGeneratingPdf ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                {capitalCase("generating")}…
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                {capitalCase("download pdf")}
              </>
            )}
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-gray-100"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      <div
        ref={previewContainerRef}
        className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden bg-gray-200 p-4 flex justify-center"
      >
        <div
          ref={scaleWrapperRef}
          className="inline-block origin-top"
          style={{ zoom: previewScale }}
        >
          {previewBody}
        </div>
      </div>
    </div>
  );
};

export default DocumentPreview;
