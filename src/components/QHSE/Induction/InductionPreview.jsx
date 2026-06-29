import React, { useRef, useState, useCallback, useLayoutEffect } from "react";
import { Download, FileText, X } from "lucide-react";
import horizonLogo from "../Transmittal/assets/Horizon-logo.png";
import pmcLogo from "../Transmittal/assets/pmc-logo.png";
import contractorLogo from "../Transmittal/assets/contrctor-logo.png";
import { PdfPreview, usePdfPageCount } from "../Transmittal/PdfPreview";

const HeaderComponent = () => (
  <div className="flex border border-gray-900 bg-white mb-2" style={{ height: "80px" }}>
    <div className="w-1/3 border-r border-gray-900 flex items-center justify-center p-2">
      <img src={horizonLogo} alt="Horizon Logo" className="max-h-full object-contain" />
    </div>
    <div className="w-1/3 border-r border-gray-900 flex flex-col items-center justify-center p-2">
      <span className="text-blue-600 font-bold text-xl uppercase tracking-widest">PMC's</span>
      <span className="text-blue-600 font-bold text-xl uppercase tracking-widest">Logo</span>
      {/* <img src={pmcLogo} alt="PMC Logo" className="max-h-full object-contain" /> */}
    </div>
    <div className="w-1/3 flex flex-col items-center justify-center p-2">
      <span className="text-green-600 font-bold text-xl uppercase tracking-widest">Contractor's</span>
      <span className="text-green-600 font-bold text-xl uppercase tracking-widest">Logo</span>
      {/* <img src={contractorLogo} alt="Contractor Logo" className="max-h-full object-contain" /> */}
    </div>
  </div>
);

const DocumentAnnexure = ({ row, fileItem }) => {
  const isPdf = fileItem.file.type === "application/pdf" || fileItem.file.name.toLowerCase().endsWith(".pdf");
  const pdfPageCount = usePdfPageCount(isPdf ? fileItem.file : null);
  const pageCount = isPdf && pdfPageCount > 1 ? pdfPageCount : 1;

  return (
    <>
      {Array.from({ length: pageCount }, (_, i) => (
        <div key={`${fileItem.key}-${i}`} data-pdf-page className="bg-white font-serif flex flex-col shadow-lg border border-slate-200" style={{ width: "210mm", minHeight: "297mm", padding: "12mm 15mm", boxSizing: "border-box", position: "relative" }}>
          <HeaderComponent />
          <div className="mt-4 mb-2">
            <h3 className="font-bold text-lg text-gray-900">Documents for: {row.name || "Unnamed"}</h3>
            <p className="text-sm text-gray-700">Trade: {row.trade || "-"} | Emp No: {row.empNo || "-"}</p>
            <p className="text-sm font-semibold text-gray-500 capitalize mt-1">
              Document: {fileItem.key.replace(/([A-Z])/g, ' $1').trim()}
              {isPdf && pageCount > 1 ? ` (Page ${i + 1} of ${pageCount})` : ""}
            </p>
          </div>
          <div className="flex-1 flex items-center justify-center" style={{ maxHeight: "220mm", overflow: "hidden" }}>
            {isPdf ? (
              <PdfPreview file={fileItem.file} scale={1} pageNumber={i + 1} />
            ) : fileItem.file.type.startsWith("image/") ? (
              <img src={URL.createObjectURL(fileItem.file)} alt="attachment" className="max-w-full max-h-[200mm] object-contain border border-gray-200 p-1" />
            ) : (
              <div className="text-center p-8 border border-dashed border-gray-300 rounded w-full max-w-sm mx-auto">
                <FileText className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                <p className="text-sm font-medium text-gray-600 truncate">{fileItem.file.name}</p>
                <p className="text-xs text-gray-400 mt-1">Document attached</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </>
  );
};

const A4_WIDTH_PX = 794;

const InductionPreview = ({ formData, onClose, variant = "modal" }) => {
  const { details, topics, documentRows } = formData;
  const { getPageCount } = usePdfPageCount();

  const previewContainerRef = useRef(null);
  const scaleWrapperRef = useRef(null);
  const previewScaleRef = useRef(1);
  const [previewScale, setPreviewScale] = useState(1);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

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
  }, []);

  const topicsRows = [];
  for (let i = 0; i < topics.length; i += 3) {
    topicsRows.push(topics.slice(i, i + 3));
  }

  const allDocumentItems = [];
  documentRows.forEach(row => {
    const docs = row.documents || {};
    Object.keys(docs).forEach(key => {
      docs[key].forEach(file => allDocumentItems.push({ row, key, file }));
    });
  });

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    const zoomEl = scaleWrapperRef.current;
    if (zoomEl) zoomEl.style.zoom = "1";

    try {
      const { default: html2canvas } = await import("html2canvas");
      const { jsPDF } = await import("jspdf");

      const pages = document.querySelectorAll("[data-pdf-page]");
      if (!pages.length) return;

      const pdf = new jsPDF("p", "mm", "a4");

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const originalWidth = page.style.width;
        const originalMinHeight = page.style.minHeight;
        page.style.width = "794px";
        page.style.minHeight = "1123px";

        const canvas = await html2canvas(page, { 
          scale: 2, 
          useCORS: true,
          width: 794,
          height: 1123,
          windowWidth: 794,
          windowHeight: 1123,
        });
        
        page.style.width = originalWidth;
        page.style.minHeight = originalMinHeight;

        const imgData = canvas.toDataURL("image/jpeg", 1.0);
        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, 0, 210, 297);
      }

      pdf.save(`Induction_Report_${details.project?.replace(/\s+/g, '_') || 'Untitled'}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      if (zoomEl) zoomEl.style.zoom = String(previewScaleRef.current);
      setIsGeneratingPdf(false);
    }
  };

  const previewBody = (
    <div className="flex flex-col gap-8 pb-12">
      {/* Page 1: Form Summary */}
      <div data-pdf-page className="bg-white font-serif border border-gray-800" style={{ width: "210mm", minHeight: "297mm", padding: "12mm 15mm", boxSizing: "border-box" }}>
        <HeaderComponent />
        
        <div className="border border-gray-900 bg-gray-200 py-1 mb-2">
          <h2 className="text-center font-bold text-xl text-gray-900">Attendance Sheet - Site HSE Induction</h2>
        </div>

        <table className="w-full border-collapse border border-gray-900 text-sm mb-4">
              <tbody>
                <tr>
                  <td className="border border-gray-900 p-1.5 w-1/2">Project: <span className="font-semibold">{details.project || ""}</span></td>
                  <td className="border border-gray-900 p-1.5 w-1/2">Reference No: <span className="font-semibold">{details.referenceNo || ""}</span></td>
                </tr>
                <tr>
                  <td className="border border-gray-900 p-1.5">Date: <span className="font-semibold">{details.date || ""}</span></td>
                  <td className="border border-gray-900 p-1.5">Duration: <span className="font-semibold">{details.duration || ""}</span></td>
                </tr>
                <tr>
                  <td className="border border-gray-900 p-1.5">Trainer: <span className="font-semibold">{details.trainer || ""}</span></td>
                  <td className="border border-gray-900 p-1.5">Department Covered: <span className="font-semibold">{details.departmentCovered || ""}</span></td>
                </tr>
                <tr>
                  <td className="border border-gray-900 p-1.5">Venue: <span className="font-semibold">{details.venue || ""}</span></td>
                  <td className="border border-gray-900 p-1.5">Name of the Line Supervisor: <span className="font-semibold">{details.lineSupervisor || ""}</span></td>
                </tr>
              </tbody>
            </table>

            <table className="w-full border-collapse border border-gray-900 text-sm mb-4">
              <thead>
                <tr>
                  <th colSpan="3" className="border border-gray-900 p-1.5 text-center bg-gray-100 font-bold">
                    Typical Topics Covered During HSE Induction
                  </th>
                </tr>
              </thead>
              <tbody>
                {topicsRows.length > 0 ? topicsRows.map((row, idx) => (
                  <tr key={idx}>
                    <td className="border border-gray-900 p-1.5 w-1/3">{row[0] || ""}</td>
                    <td className="border border-gray-900 p-1.5 w-1/3">{row[1] || ""}</td>
                    <td className="border border-gray-900 p-1.5 w-1/3">{row[2] || ""}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="3" className="border border-gray-900 p-4 text-center text-gray-500 italic">
                      No topics selected.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <div className="border border-gray-900 p-3 mt-auto font-bold text-sm bg-white">
              Inductee Declaration: "I Acknowledge that I have received and completed the HSE Induction & Understand the Arrangements & Procedures."
            </div>
          </div>

          {/* Subsequent Pages: Uploaded Documents */}
          {allDocumentItems.map((item, idx) => (
            <DocumentAnnexure key={idx} row={item.row} fileItem={item} />
          ))}
          </div>
  );

  if (variant === "embedded") {
    return (
      <div className="flex flex-col h-full min-h-0">
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-gray-50 shrink-0">
          <span className="text-xs font-semibold text-gray-500">Live Preview</span>
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            className="h-8 text-xs gap-1.5 inline-flex items-center rounded-md border border-gray-200 bg-white px-3 py-1 hover:bg-gray-50 disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            {isGeneratingPdf ? "Generating..." : "Download PDF"}
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
        <span className="text-sm font-semibold">Live Preview</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            className="h-8 text-xs gap-1.5 inline-flex items-center rounded-md border border-gray-200 bg-white px-3 py-1 hover:bg-gray-50 disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            {isGeneratingPdf ? "Generating..." : "Download PDF"}
          </button>
          {onClose && (
            <button type="button" onClick={onClose} className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-gray-100">
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

export default InductionPreview;
