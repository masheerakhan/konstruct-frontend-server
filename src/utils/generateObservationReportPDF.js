import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { listSafetyTemplates } from "../api";


// Helper to convert image URL to base64
const getBase64ImageFromUrl = async (imageUrl) => {
  if (!imageUrl) return null;
  // If it's already a data URL
  if (imageUrl.startsWith("data:image")) return imageUrl;

  try {
    const res = await fetch(imageUrl, { mode: "cors" });
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Failed to convert image to base64", error);
    return null;
  }
};

export const generateObservationReportPDF = async (items, reportDateStr, explicitReportName) => {
  // 1. Fetch Template to get logos and headers
  let template = null;
  try {
    const res = await listSafetyTemplates({ template_type: "OBSERVATION", status: "ACTIVE" });
    const data = res?.data;
    const list = Array.isArray(data) ? data : data?.results || [];
    if (list.length > 0) {
      template = list[0];
    }
  } catch (e) {
    console.error("Failed to fetch observation template", e);
  }

  const BASE_URL = "/checklists-api/";
  const buildMediaUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    return `${BASE_URL}${path}`;
  };

  const meta = template?.report_header_meta || {};
  const leftLogoUrl = buildMediaUrl(template?.report_logo_url || template?.report_logo || template?.logo_url);
  const rightLogoUrl = buildMediaUrl(template?.report_logo_right_url || template?.report_logo_right);

  const leftLogoBase64 = await getBase64ImageFromUrl(leftLogoUrl);
  const rightLogoBase64 = await getBase64ImageFromUrl(rightLogoUrl);

  // Initialize jsPDF in Portrait mode
  const doc = new jsPDF("l", "pt", "a4");

  const pageWidth = doc.internal.pageSize.getWidth();

  // Unified Table with Header and Data
  const peachFill = [251, 228, 213];
  const headerGreenFill = [218, 238, 227]; // Excel light green
  const whiteFill = [255, 255, 255];
  
  // Project Name fetch from local storage or meta (fallback logic)
  let storedProjectName = localStorage.getItem("PROJECT_NAME") || "";
  if (storedProjectName === "Selected project") storedProjectName = "";
  const projectName = meta.project || storedProjectName || "";

  // Report No logic
  let reportTitleText = "AN-ADL-SHOR-" + (items[0]?.id || "01");
  if (explicitReportName) {
      if (explicitReportName.startsWith("Report ")) {
          reportTitleText = explicitReportName.substring(7);
      } else {
          reportTitleText = explicitReportName;
      }
  } else if (items[0]?.report_no) {
      reportTitleText = items[0].report_no;
  } else if (meta.report_no) {
      reportTitleText = meta.report_no;
  }

  // Format issued date
  let formattedIssuedDate = "1st September 2025";
  if (meta.issued_date) {
      try {
          const d = new Date(meta.issued_date);
          const day = d.getDate();
          const suffix = (day === 1 || day === 21 || day === 31) ? "st" : (day === 2 || day === 22) ? "nd" : (day === 3 || day === 23) ? "rd" : "th";
          const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
          const month = monthNames[d.getMonth()];
          const year = d.getFullYear().toString().slice(-2);
          formattedIssuedDate = `${day}${suffix} ${month} ${year}`;
      } catch(e) {
          formattedIssuedDate = meta.issued_date;
      }
  } else {
      formattedIssuedDate = "1st September 25";
  }

  const head = [
    // Header Row 1
    [
      { content: '', colSpan: 3, rowSpan: 2, styles: { fillColor: whiteFill, halign: 'center', valign: 'middle' } }, // ARKADE
      { content: `<b>Format No.:</b> ${meta.format_no || 'ADL-OH&S-F012'}`, colSpan: 3, styles: { fillColor: peachFill, halign: 'left' } },
      { content: `<b>Revision No.:</b> ${meta.revision_no || 'R01'}`, colSpan: 3, styles: { fillColor: peachFill, halign: 'left' } },
      { content: '', colSpan: 1, rowSpan: 4, styles: { fillColor: whiteFill, halign: 'center', valign: 'middle' } }  // SAFETY FIRST
    ],
    // Header Row 2
    [
      { content: `<b>Issued Date:</b> ${formattedIssuedDate}`, colSpan: 3, styles: { fillColor: peachFill, halign: 'left' } },
      { content: `<b>Revision Date:</b>`, colSpan: 3, styles: { fillColor: peachFill, halign: 'left' } }
    ],
    // Header Row 3
    [
      { content: `<b>SAFETY & HOUSEKEEPING OBSERVATION REPORT</b>`, colSpan: 3, rowSpan: 2, styles: { fillColor: peachFill, halign: 'center', valign: 'middle' } },
      { content: `<b>Project:</b> ${projectName}`, colSpan: 3, rowSpan: 2, styles: { fillColor: peachFill, halign: 'left', valign: 'middle' } },
      { content: `<b>Date of Observation:</b> ${reportDateStr}`, colSpan: 3, styles: { fillColor: peachFill, halign: 'left', valign: 'middle' } }
    ],
    // Header Row 4
    [
      { content: `<b>Report No.:</b> ${reportTitleText}`, colSpan: 3, styles: { fillColor: peachFill, halign: 'left', valign: 'middle' } } // Fixed colSpan from 3 to 3, total 3+3+3+1 = 10 columns
    ],
    // Gapper Row to separate Header table from Data table
    [
      { content: '', colSpan: 10, styles: { fillColor: whiteFill, minCellHeight: 8, lineWidth: 0 } }
    ],
    // Data Columns Row
    [
      { content: "SN", styles: { fillColor: headerGreenFill, textColor: [0, 112, 192], fontStyle: 'bold', halign: 'center' } },
      { content: "WHAT UNSAFE ACT / CONDITION\nOBSERVED", styles: { fillColor: headerGreenFill, textColor: [0, 112, 192], fontStyle: 'bold', halign: 'center' } },
      { content: "LOCATION", styles: { fillColor: headerGreenFill, textColor: [0, 112, 192], fontStyle: 'bold', halign: 'center' } },
      { content: "PHOTOGRAPH OF UNSAFE ACT / CONDITION", styles: { fillColor: headerGreenFill, textColor: [0, 112, 192], fontStyle: 'bold', halign: 'center' } },
      { content: "HAZARD/RISK", styles: { fillColor: headerGreenFill, textColor: [0, 112, 192], fontStyle: 'bold', halign: 'center' } },
      { content: "RECOMMENDATIONS", styles: { fillColor: headerGreenFill, textColor: [0, 112, 192], fontStyle: 'bold', halign: 'center' } },
      { content: "CONTRACTOR", styles: { fillColor: headerGreenFill, textColor: [0, 112, 192], fontStyle: 'bold', halign: 'center' } },
      { content: "TARGET\nDATE", styles: { fillColor: headerGreenFill, textColor: [0, 112, 192], fontStyle: 'bold', halign: 'center' } },
      { content: "CA/PA TO BE\nTAKEN", styles: { fillColor: headerGreenFill, textColor: [0, 112, 192], fontStyle: 'bold', halign: 'center' } },
      { content: "CLOSER\nPHOTOGRAPH", styles: { fillColor: headerGreenFill, textColor: [0, 112, 192], fontStyle: 'bold', halign: 'center' } }
    ]
  ];

  const cellImages = [];
  const body = [];
  
  const sortedItems = [...items].reverse();
  for (let i = 0; i < sortedItems.length; i++) {
    const item = sortedItems[i];
    
    let closerPhotosAndComments = [];
    
    const subs = item.submissions || [];
    const activeSub = subs.length > 0 ? subs[subs.length - 1] : null;

    // 1. First priority: Checker's explicit final approval selections
    if (activeSub && (activeSub.final_approved_image_url || activeSub.final_approved_comments)) {
        closerPhotosAndComments.push({
             url: activeSub.final_approved_image_url || activeSub.latest_maker_photo_url || activeSub.photo_url,
             comment: activeSub.final_approved_comments || activeSub.checker_remarks || ""
        });
    // 2. Second priority: Final selected image via is_final_image on closer_photographs
    } else if (item.closer_photographs && Array.isArray(item.closer_photographs) && item.closer_photographs.some(p => p.is_final_image)) {
        item.closer_photographs.filter(p => p.is_final_image).forEach(p => {
             const url = p.image || p.photoUrl || p.url;
             const c = p.checker_comment || p.comment || p.comments || "";
             if (url || c) {
                 closerPhotosAndComments.push({ url, comment: c });
             }
        });
    // 3. Third priority: Final selected image via is_final_image on reject_photographs
    } else if (item.reject_photographs && Array.isArray(item.reject_photographs) && item.reject_photographs.some(p => p.is_final_image)) {
        item.reject_photographs.filter(p => p.is_final_image).forEach(p => {
             const url = p.image || p.photoUrl || p.url;
             const c = p.comment || p.comments || "";
             if (url || c) {
                 closerPhotosAndComments.push({ url, comment: c });
             }
        });
    // 4. Fourth priority: Maker's direct uploads (array fallback)
    } else if (item.closer_photographs && Array.isArray(item.closer_photographs) && item.closer_photographs.length > 0) {
        item.closer_photographs.forEach(p => {
             const url = p.image || p.photoUrl || p.url;
             const c = p.checker_comment || p.comment || p.comments;
             if (url || c) {
                 closerPhotosAndComments.push({ url, comment: c });
             }
        });
    // 5. Fifth priority: Maker's direct uploads (legacy single string)
    } else if (item.closer_photograph) {
        closerPhotosAndComments.push({
             url: item.closer_photograph,
             comment: item.closer_photograph_comments || item.closer_photograph_comment || item.closer_comment
        });
    // 4. Fallback: Catch-all for latest submission properties
    } else if (activeSub) {
        closerPhotosAndComments.push({
             url: activeSub.latest_maker_photo_url || activeSub.photo_url || activeSub.latest_checker_reject_photo_url,
             comment: activeSub.checker_remarks || activeSub.latest_checker_reject_remarks || activeSub.latest_maker_remarks || activeSub.maker_remarks
        });
    }

    // Clean up parsed array comments if any
    closerPhotosAndComments = closerPhotosAndComments.map(pc => {
        let c = pc.comment || "";
        try {
            if (c && typeof c === 'string' && c.startsWith('[')) {
                const parsed = JSON.parse(c);
                if (Array.isArray(parsed)) c = parsed.join("\n");
            }
        } catch(e) {}
        return { url: pc.url, comment: c };
    });

    const closerBase64s = [];
    for (const pc of closerPhotosAndComments) {
        const b64 = pc.url ? await getBase64ImageFromUrl(buildMediaUrl(pc.url)) : null;
        closerBase64s.push({ base64: b64, comment: pc.comment || "" });
    }

    const obsPhotoUrl = item.photograph_of_unsafe_act;
    const obsPhotoBase64 = obsPhotoUrl ? await getBase64ImageFromUrl(buildMediaUrl(obsPhotoUrl)) : null;


    let unsafeActStr = `<b>${(item.unsafe_act_condition_category || "").toUpperCase()}</b>\n${item.unsafe_act_condition_description || ""}`;
    
    // Hazards/Risk logic
    let hazardStr = "";
    try {
        const hazardCats = typeof item.hazard_categories === "string" ? JSON.parse(item.hazard_categories) : item.hazard_categories;
        const cleanHazards = (hazardCats || []).map(h => h.replace(/^\d+\.\s*/, ''));
        if (cleanHazards.length > 0) {
            hazardStr += `<b>Hazards:</b>\n${cleanHazards.join('\n')}`;
        }
    } catch(e) {
        const cleanHazards = (item.hazard_categories || "").replace(/^\d+\.\s*/, '');
        if (cleanHazards) {
            hazardStr += `<b>Hazards:</b>\n${cleanHazards}`;
        }
    }
    if (item.risk) {
        if (hazardStr) hazardStr += "\n\n";
        hazardStr += `<b>Risk:</b>\n${item.risk}`;
    }

    const rowIndex = i; // body index
    if (obsPhotoBase64) {
      cellImages.push({ row: rowIndex, col: 3, base64: obsPhotoBase64 });
    }
    if (closerBase64s.length > 0) {
      cellImages.push({ row: rowIndex, col: 9, items: closerBase64s });
    }

    // Parse recommendations
    let recStr = item.recommendations || "";
    try {
      const recs = JSON.parse(recStr);
      if (Array.isArray(recs)) recStr = recs.join("\n");
    } catch(e) {}

    // Parse ca_pa
    let capaStr = item.ca_pa_combined || "";
    try {
      if (item.corrective_action) {
         capaStr = `<b>Corrective Action:</b>\n${item.corrective_action}`;
      }
      if (item.preventive_action) {
         if (capaStr) capaStr += `\n\n`;
         capaStr += `<b>Preventive Action:</b>\n${item.preventive_action}`;
      }
    } catch(e) {}

    if (!capaStr && item.ca_pa_combined) capaStr = item.ca_pa_combined;
    // Replace raw HTML from the DB and trim
    capaStr = capaStr.replace(/<br\s*\/?>/gi, '\n').replace(/<\/?b>/gi, '').trim();
    // We manually re-insert paragraph tags if we need to
    if (capaStr.toLowerCase().includes("corrective action:")) {
        capaStr = capaStr.replace(/Corrective Action:/i, '<b>Corrective Action:</b>');
    }
    if (capaStr.toLowerCase().includes("preventive action:")) {
        capaStr = capaStr.replace(/Preventive Action:/i, '<b>Preventive Action:</b>');
    }

    body.push([
      (i + 1).toString(),
      unsafeActStr,
      item.location_combined || "",
      { content: "", styles: { minCellHeight: 60 } },
      hazardStr,
      recStr,
      item.name_of_contractor || "",
      item.target_date || "",
      capaStr,
      { 
         content: closerBase64s.map(obj => {
            let chunk = "";
            if (obj.base64) chunk += "\n\n\n\n\n\n\n";
            if (obj.comment) chunk += obj.comment + "\n\n";
            else if (obj.base64) chunk += "\n\n";
            return chunk;
         }).join(""),
         styles: { minCellHeight: 60 }
      }
    ]);
  }

  autoTable(doc, {
    startY: 20,
    showHead: 'firstPage',
    rowPageBreak: 'avoid',
    head: head,
    body: body,
    theme: 'grid',
    styles: {
      fontSize: 6,
      cellPadding: 3,
      valign: 'middle',
      halign: 'left',
      overflow: 'linebreak',
      textColor: [0, 0, 0],
      lineColor: [0, 0, 0],
      lineWidth: 0.5,
    },
    columnStyles: {
      0: { cellWidth: 22, halign: 'center' }, // SN
      1: { cellWidth: 95, halign: 'center' }, // WHAT UNSAFE ACT
      2: { cellWidth: 75 }, // LOCATION
      3: { cellWidth: 80, minCellHeight: 60 }, // PHOTOGRAPH
      4: { cellWidth: 80 }, // HAZARD/RISK
      5: { cellWidth: 80 }, // RECOMMENDATIONS
      6: { cellWidth: 75 }, // CONTRACTOR
      7: { cellWidth: 60 }, // TARGET DATE
      8: { cellWidth: 110, halign: 'left' }, // CA/PA
      9: { cellWidth: 80, minCellHeight: 60 }, // CLOSER PHOTOGRAPH
    },
    willDrawCell: function (data) {
      let rawText = data.cell.raw;
      if (rawText && typeof rawText === 'object' && rawText.content) {
          rawText = rawText.content;
      }
      if (typeof rawText === 'string' && rawText.includes('<b>')) {
          data.cell.text = [];
      }
      if (data.section === 'body' && data.column.index === 9) {
          data.cell.text = []; // Manually draw everything in didDrawCell
      }
    },
    didDrawCell: function (data) {
      let rawText = data.cell.raw;
      if (rawText && typeof rawText === 'object' && rawText.content) {
          rawText = rawText.content;
      }

      // Handle custom rich text drawing
      if (typeof rawText === 'string' && rawText.includes('<b>')) {
          doc.setTextColor(0, 0, 0);
          
          let y = data.cell.y + (data.cell.styles.cellPadding.top || data.cell.styles.cellPadding || 3) + data.cell.styles.fontSize;
          let x = data.cell.x + (data.cell.styles.cellPadding.left || data.cell.styles.cellPadding || 3);
          
          // Use autoTable's calculated starting position for headers if available
          if (data.section === 'head') {
              if (data.cell.textPos && data.cell.textPos.y) {
                  y = data.cell.textPos.y;
                  x = data.cell.textPos.x;
              } else if (data.cell.getTextPos) {
                  const pos = data.cell.getTextPos();
                  if (pos) { y = pos.y; x = pos.x; }
              }
          }

          let scaleFactor = doc.internal.scaleFactor || 1;
          const ptToMm = 25.4 / 72;
          let lineHeight = doc.getLineHeight ? doc.getLineHeight() : (data.cell.styles.fontSize * 1.15 * ptToMm);
          
          // If it's a body cell, we handle wrapping
          if (data.section === 'body') {
              const maxWidth = data.cell.width - ((data.cell.styles.cellPadding.left || 3) * 2);
              const paragraphs = rawText.split('\n');
              
              // 1. Calculate total text block height to center it
              let totalTextHeight = 0;
              doc.setFontSize(data.cell.styles.fontSize);
              paragraphs.forEach(p => {
                  let pText = p.replace(/<\/?b>/g, '');
                  const wrapped = doc.splitTextToSize(pText, maxWidth);
                  totalTextHeight += wrapped.length * lineHeight;
              });
              
              // 2. Adjust Y to middle
              y = data.cell.y + (data.cell.height - totalTextHeight) / 2 + (data.cell.styles.fontSize * ptToMm);

              paragraphs.forEach(p => {
                  let isBold = false;
                  let pText = p;
                  if (pText.includes('<b>')) {
                      isBold = true;
                      pText = pText.replace(/<\/?b>/g, '');
                  }
                  doc.setFontSize(data.cell.styles.fontSize);
                  doc.setFont("helvetica", isBold ? "bold" : "normal");
                  
                  const wrapped = doc.splitTextToSize(pText, maxWidth);
                  wrapped.forEach(wLine => {
                      doc.text(wLine, x, y);
                      y += lineHeight;
                  });
              });
          } else {
              // Head cell: Inline bold (no wrapping needed)
              doc.setFontSize(data.cell.styles.fontSize);
              const lines = rawText.split('\n');
              let isCenter = data.cell.styles.halign === 'center';

              lines.forEach((line) => {
                  let currentX = x;
                  const parts = line.split(/(<b>.*?<\/b>)/g);
                  
                  if (isCenter) {
                     let totalWidth = 0;
                     parts.forEach(p => {
                        let str = p.replace(/<\/?b>/g, '');
                        if (p.startsWith('<b>')) doc.setFont("helvetica", "bold");
                        else doc.setFont("helvetica", "normal");
                        totalWidth += doc.getTextWidth(str);
                     });
                     currentX = data.cell.x + (data.cell.width - totalWidth) / 2;
                  }

                  parts.forEach(part => {
                      if (part.startsWith('<b>') && part.endsWith('</b>')) {
                          doc.setFont("helvetica", "bold");
                          const str = part.replace(/<\/?b>/g, '');
                          doc.text(str, currentX, y);
                          currentX += doc.getTextWidth(str);
                      } else if (part) {
                          doc.setFont("helvetica", "normal");
                          doc.text(part, currentX, y);
                          currentX += doc.getTextWidth(part);
                      }
                  });
                  y += lineHeight;
              });
          }
      }

      if (data.section === 'head' && data.row.index === 4) {
          doc.setDrawColor(0, 0, 0);
          doc.setLineWidth(0.5);
          doc.line(data.cell.x, data.cell.y, data.cell.x, data.cell.y + data.cell.height);
          doc.line(data.cell.x + data.cell.width, data.cell.y, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
      }

      if (data.section === 'head') {
        // Draw Left Logo (ARKADE)
        if (data.row.index === 0 && data.column.index === 0 && leftLogoBase64) {
          const maxWidth = 110;
          const maxHeight = 24;
          let imgWidth = maxWidth;
          let imgHeight = maxWidth * 0.3; // Approx ratio for Arkade logo
          if (imgHeight > maxHeight) {
             imgHeight = maxHeight;
             imgWidth = maxHeight / 0.3;
          }
          
          const x = data.cell.x + (data.cell.width - imgWidth) / 2;
          const y = data.cell.y + (data.cell.height - imgHeight) / 2;
          doc.addImage(leftLogoBase64, 'PNG', x, y, imgWidth, imgHeight, undefined, 'FAST');
        }
        // Draw Right Logo (SAFETY FIRST)
        if (data.row.index === 0 && data.column.index === 9 && rightLogoBase64) {
          const maxWidth = 45;
          const maxHeight = 45;
          let imgWidth = maxWidth;
          let imgHeight = maxWidth * 1.0; // Approx square
          if (imgHeight > maxHeight) {
             imgHeight = maxHeight;
             imgWidth = maxHeight / 1.0;
          }

          const x = data.cell.x + (data.cell.width - imgWidth) / 2;
          const y = data.cell.y + (data.cell.height - imgHeight) / 2;
          doc.addImage(rightLogoBase64, 'PNG', x, y, imgWidth, imgHeight, undefined, 'FAST');
        }
      } else if (data.section === 'body') {
        const rowIdx = data.row.index;
        const colIdx = data.column.index;
        
        const cellImage = cellImages.find(ci => ci.row === rowIdx && ci.col === colIdx);
        if (colIdx === 3 && cellImage && cellImage.base64) {
          const dim = 48;
          const x = data.cell.x + (data.cell.width - dim) / 2;
          const y = data.cell.y + (data.cell.height - dim) / 2; // Center Vertically
          doc.addImage(cellImage.base64, 'JPEG', x, y, dim, dim, undefined, 'FAST');
        }
        if (colIdx === 9 && cellImage && cellImage.items && cellImage.items.length > 0) {
          const dim = 48;
          const imgX = data.cell.x + (data.cell.width - dim) / 2;
          const textX = data.cell.x + (data.cell.styles.cellPadding.left || 3);
          const maxWidth = data.cell.width - ((data.cell.styles.cellPadding.left || 3) * 2);
          
          doc.setFontSize(data.cell.styles.fontSize);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(0, 0, 0);
          const ptToMm = 25.4 / 72;
          let lineHeight = doc.getLineHeight ? doc.getLineHeight() : (data.cell.styles.fontSize * 1.15 * ptToMm);

          // Calculate total content height
          let totalContentHeight = 0;
          cellImage.items.forEach(itemObj => {
              if (itemObj.base64) totalContentHeight += dim + 2;
              if (itemObj.comment) {
                  const wrapped = doc.splitTextToSize(itemObj.comment, maxWidth);
                  totalContentHeight += wrapped.length * lineHeight + lineHeight;
              } else if (itemObj.base64) {
                  totalContentHeight += lineHeight;
              }
          });

          // Calculate starting Y for middle alignment
          let currentY = data.cell.y + (data.cell.height - totalContentHeight) / 2;
          if (currentY < data.cell.y) currentY = data.cell.y + 2; // Failsafe

          cellImage.items.forEach(itemObj => {
              if (itemObj.base64) {
                  doc.addImage(itemObj.base64, 'JPEG', imgX, currentY, dim, dim, undefined, 'FAST');
                  currentY += dim + 2;
              }
              if (itemObj.comment) {
                  const wrapped = doc.splitTextToSize(itemObj.comment, maxWidth);
                  wrapped.forEach(wLine => {
                      currentY += lineHeight;
                      doc.text(wLine, textX, currentY);
                  });
                  currentY += lineHeight;
              } else if (itemObj.base64) {
                  currentY += lineHeight;
              }
          });
        }
      }
    }
  });

  const safeName = explicitReportName 
      ? explicitReportName.replace(/[^a-zA-Z0-9_.-]/g, '_') 
      : `Safety_Observation_Report_${reportDateStr.replace(/[^a-z0-9]/gi, '_').toLowerCase()}`;
  doc.save(`${safeName}.pdf`);
};
