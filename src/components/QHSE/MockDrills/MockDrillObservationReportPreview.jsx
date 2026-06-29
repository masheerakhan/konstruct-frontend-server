import React, { useRef, useState, useLayoutEffect } from "react";
import { Download, FileText, X } from "lucide-react";
import horizonLogo from "../Transmittal/assets/Horizon-logo.png";

const HeaderComponent = () => (
  <div className="flex border border-gray-900 bg-white mb-4" style={{ height: "80px" }}>
    <div className="w-1/3 border-r border-gray-900 flex items-center justify-center p-2">
      <img src={horizonLogo} alt="Horizon Logo" className="max-h-full object-contain" />
    </div>
    <div className="w-1/3 border-r border-gray-900 flex flex-col items-center justify-center p-2">
      <span className="text-blue-600 font-bold text-xl uppercase tracking-widest text-center">PMC's<br/>Logo</span>
    </div>
    <div className="w-1/3 flex flex-col items-center justify-center p-2">
      <span className="text-green-600 font-bold text-xl uppercase tracking-widest text-center">Contractor's<br/>Logo</span>
    </div>
  </div>
);

const DocumentFooter = ({ pageInfo }) => (
  <div className="mt-auto pt-4 flex justify-between items-center text-xs text-gray-500 font-sans border-t border-gray-300">
    <div>Date of issue: {new Date().toLocaleDateString('en-GB')}</div>
    <div>Rev. 00</div>
    <div>{pageInfo}</div>
  </div>
);

const A4_WIDTH_PX = 794;

const CheckboxItem = ({ label, isChecked }) => (
  <div className="flex items-start gap-2 text-xs">
    <div className={`w-3.5 h-3.5 border border-gray-900 shrink-0 mt-0.5 flex items-center justify-center ${isChecked ? 'bg-gray-800' : 'bg-white'}`}>
      {isChecked && <div className="w-2 h-2 bg-white" />}
    </div>
    <span className="leading-tight">{label}</span>
  </div>
);

const MockDrillObservationReportPreview = ({ formData, onClose, variant = "modal" }) => {
  const {
    projectName, mockDrillDate, contractor, time, observerName, mockDrillNo,
    drillType, otherDrillType, alertMethods, otherAlertMethod,
    weatherCondition, otherWeatherCondition, timelineRows, totalTimeTakenMinutes,
    drawbacks, otherDrawback, preparednessRows, participationRows,
    recommendedMitigation, previousImplementedPoints, previousMockDrillNo, previousMockDrillDate,
    wwrRows, improvementRows, photoRows
  } = formData;

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

      pdf.save(`MockDrill_Report_${projectName?.replace(/\s+/g, '_') || 'Untitled'}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      if (zoomEl) zoomEl.style.zoom = String(previewScaleRef.current);
      setIsGeneratingPdf(false);
    }
  };

  const formatDuration = (m) => {
    if (!m) return "0 min";
    const h = Math.floor(m / 60);
    const rem = m % 60;
    if (h && rem) return `${h} hr ${rem} min`;
    if (h) return `${h} hr`;
    return `${rem} min`;
  };

  const previewBody = (
    <div className="flex flex-col gap-8 pb-12 font-serif text-gray-900">
      
      {/* PAGE 1 */}
      <div data-pdf-page className="bg-white flex flex-col shadow-lg border border-slate-200" style={{ width: "210mm", minHeight: "297mm", padding: "12mm 15mm", boxSizing: "border-box" }}>
        <HeaderComponent />
        
        <h1 className="text-center font-bold text-xl uppercase mb-4 tracking-wider underline">
          Mock Drill Observation Report
        </h1>

        {/* General Details */}
        <table className="w-full border-collapse border border-gray-900 text-sm mb-6">
          <tbody>
            <tr>
              <td className="border border-gray-900 p-2 font-bold w-1/4">Project Name:</td>
              <td className="border border-gray-900 p-2 w-1/4">{projectName || "-"}</td>
              <td className="border border-gray-900 p-2 font-bold w-1/4">Mock Drill Date:</td>
              <td className="border border-gray-900 p-2 w-1/4">{mockDrillDate || "-"}</td>
            </tr>
            <tr>
              <td className="border border-gray-900 p-2 font-bold">Contractor:</td>
              <td className="border border-gray-900 p-2">{contractor || "-"}</td>
              <td className="border border-gray-900 p-2 font-bold">Time:</td>
              <td className="border border-gray-900 p-2">{time || "-"}</td>
            </tr>
            <tr>
              <td className="border border-gray-900 p-2 font-bold">Name of the Observer:</td>
              <td className="border border-gray-900 p-2">{observerName || "-"}</td>
              <td className="border border-gray-900 p-2 font-bold">Mock Drill No.:</td>
              <td className="border border-gray-900 p-2 text-red-600 font-bold">{mockDrillNo || "-"}</td>
            </tr>
          </tbody>
        </table>

        {/* Checklists */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Type of Drill */}
          <div className="border border-gray-900 p-3">
            <h3 className="font-bold mb-2 text-sm">Type of Drill:</h3>
            <div className="grid grid-cols-2 gap-y-1 gap-x-2">
              {[
                "Fire / Explosion", "Fall from Height", "Collapse of an excavation involving personnel",
                "Collapse of Building / Structural failure", "Vehicle accidents", "Medical",
                "Spills of flammable liquids", "Hazardous Material / Toxic Substances release",
                "Confined Space", "Flood", "Bomb threat", "Earthquake", "Cyclone Emergency",
                "Severe Weather Drill", "Suspended worker rescue Drill", "Electrocution", "Other"
              ].map(opt => (
                <CheckboxItem key={opt} label={opt === "Other" && drillType === "Other" ? `Other: ${otherDrillType}` : opt} isChecked={drillType === opt} />
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {/* Notification */}
            <div className="border border-gray-900 p-3 flex-1">
              <h3 className="font-bold mb-2 text-sm">Notification / Alert Method:</h3>
              <div className="grid grid-cols-2 gap-y-1 gap-x-2">
                {["Alarm System", "Intercom", "Phone", "Voice Notification", "Siren", "Other"].map(opt => (
                  <CheckboxItem key={opt} label={opt === "Other" && alertMethods.includes("Other") ? `Other: ${otherAlertMethod}` : opt} isChecked={alertMethods.includes(opt)} />
                ))}
              </div>
            </div>

            {/* Weather */}
            <div className="border border-gray-900 p-3 flex-1">
              <h3 className="font-bold mb-2 text-sm">Weather Conditions:</h3>
              <div className="grid grid-cols-2 gap-y-1 gap-x-2">
                {["Clear", "Cloudy", "Raining", "Rain and wind", "Windy", "Other"].map(opt => (
                  <CheckboxItem key={opt} label={opt === "Other" && weatherCondition === "Other" ? `Other: ${otherWeatherCondition}` : opt} isChecked={weatherCondition === opt} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Timeline Table */}
        <table className="w-full border-collapse border border-gray-900 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-900 p-2 w-12 text-center">Sl. No.</th>
              <th className="border border-gray-900 p-2 text-left">Item Description</th>
              <th className="border border-gray-900 p-2 w-24 text-center">Time Start</th>
              <th className="border border-gray-900 p-2 w-24 text-center">Time End</th>
              <th className="border border-gray-900 p-2 w-32 text-center">Total Time Taken</th>
            </tr>
          </thead>
          <tbody>
            {timelineRows.map((row, idx) => (
              <tr key={idx}>
                <td className="border border-gray-900 p-2 text-center">{idx + 1}</td>
                <td className="border border-gray-900 p-2">{row.itemDescription || "-"}</td>
                <td className="border border-gray-900 p-2 text-center">{row.timeStart || "-"}</td>
                <td className="border border-gray-900 p-2 text-center">{row.timeEnd || "-"}</td>
                <td className="border border-gray-900 p-2 text-center font-bold">
                   {formatDuration(row.totalTimeTakenMinutes)}
                </td>
              </tr>
            ))}
            {/* Total Row */}
            <tr>
              <td colSpan={4} className="border border-gray-900 p-2 text-right font-bold">Total Time Taken:</td>
              <td className="border border-gray-900 p-2 text-center font-bold text-red-600">
                {formatDuration(totalTimeTakenMinutes)}
              </td>
            </tr>
          </tbody>
        </table>

        <DocumentFooter pageInfo="Page 1 of 4" />
      </div>

      {/* PAGE 2 */}
      <div data-pdf-page className="bg-white flex flex-col shadow-lg border border-slate-200" style={{ width: "210mm", minHeight: "297mm", padding: "12mm 15mm", boxSizing: "border-box" }}>
        <HeaderComponent />
        
        <div className="border border-gray-900 p-3 mb-6">
          <h3 className="font-bold mb-3 text-sm">Draw backs observed during the Mock-drill exercise</h3>
          <div className="grid grid-cols-2 gap-y-2 gap-x-4">
             {[
                "Alarm not heard",
                "Staff and workers unsure of what to do",
                "ERT team not sure of responsibilities / response to be given",
                "Unable to open exit doors",
                "Personnel not accounted for / attendance",
                "Difficulties with evacuation of disabled personnel, customers or visitors",
                "Obstruction in Evacuation route",
                "Not sure of assembly point",
                "Lead distance of Assembly point is more",
                "Radio communication problems",
                "Network problems",
                "Noise impedes communications",
                "Long time to evacuate",
                "Personnel not serious about drill",
                "Confusion",
                "Doors or Exits are blocked",
                "Incident command problems",
                "Other"
             ].map(opt => (
               <CheckboxItem key={opt} label={opt === "Other" && drawbacks.includes("Other") ? `Other: ${otherDrawback}` : opt} isChecked={drawbacks.includes(opt)} />
             ))}
          </div>
        </div>

        <div className="mb-6">
          <h3 className="font-bold mb-1 text-sm bg-gray-200 p-2 border border-gray-900 border-b-0">Comments on overall preparedness :</h3>
          <div className="border border-gray-900 p-3 min-h-[100px] whitespace-pre-wrap text-sm">
            {/* Display comments or empty state. Assuming Remarks or something goes here, falling back to a message if none */}
             No additional comments provided.
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* ERT Table */}
          <table className="w-full border-collapse border border-gray-900 text-xs">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-900 p-2 w-8 text-center">S. No.</th>
                <th className="border border-gray-900 p-2 text-left">Name of Emergency Response Team Member</th>
                <th className="border border-gray-900 p-2 text-left">Role</th>
                <th className="border border-gray-900 p-2 text-center w-16">Present / Absent</th>
              </tr>
            </thead>
            <tbody>
              {preparednessRows.map((row, idx) => (
                <tr key={idx}>
                  <td className="border border-gray-900 p-1 text-center">{idx + 1}</td>
                  <td className="border border-gray-900 p-1">{row.memberName || "-"}</td>
                  <td className="border border-gray-900 p-1">{row.role || "-"}</td>
                  <td className="border border-gray-900 p-1 text-center font-bold">{row.presentAbsent || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Vendor Table */}
          <table className="w-full border-collapse border border-gray-900 text-xs">
            <thead>
              <tr className="bg-gray-100 text-center">
                <th colSpan={4} className="border border-gray-900 p-2 font-bold uppercase tracking-wide">
                  Participation in Mock Drill
                </th>
              </tr>
              <tr className="bg-gray-100">
                <th className="border border-gray-900 p-2 w-8 text-center">S. No.</th>
                <th className="border border-gray-900 p-2 text-left">Name of Vendor</th>
                <th className="border border-gray-900 p-2 text-center w-16">No. of participants</th>
                <th className="border border-gray-900 p-2 text-center w-16">No. of missing personnel</th>
              </tr>
            </thead>
            <tbody>
              {participationRows.map((row, idx) => (
                <tr key={idx}>
                  <td className="border border-gray-900 p-1 text-center">{idx + 1}</td>
                  <td className="border border-gray-900 p-1">{row.vendorName || "-"}</td>
                  <td className="border border-gray-900 p-1 text-center">{row.participants || "-"}</td>
                  <td className="border border-gray-900 p-1 text-center">{row.missingPersonnel || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <DocumentFooter pageInfo="Page 2 of 4" />
      </div>

      {/* PAGE 3 */}
      <div data-pdf-page className="bg-white flex flex-col shadow-lg border border-slate-200" style={{ width: "210mm", minHeight: "297mm", padding: "12mm 15mm", boxSizing: "border-box" }}>
        <HeaderComponent />
        
        <div className="mb-4">
          <h3 className="font-bold mb-1 text-sm bg-gray-200 p-2 border border-gray-900 border-b-0">Recommended point to mitigate the drawbacks during next drill</h3>
          <div className="border border-gray-900 p-3 min-h-[80px] whitespace-pre-wrap text-sm">
            {recommendedMitigation || "N/A"}
          </div>
        </div>

        <div className="mb-4 flex gap-4">
           <div className="flex-1">
             <h3 className="font-bold mb-1 text-sm bg-gray-200 p-2 border border-gray-900 border-b-0">Recommended points from previous observer report implemented</h3>
             <div className="border border-gray-900 p-3 min-h-[80px] whitespace-pre-wrap text-sm">
               {previousImplementedPoints || "N/A"}
             </div>
           </div>
           <div className="w-1/3 flex flex-col gap-2">
              <div className="border border-gray-900 p-2 flex text-sm">
                 <span className="font-bold w-32">Previous Mock Drill No:</span>
                 <span>{previousMockDrillNo || "-"}</span>
              </div>
              <div className="border border-gray-900 p-2 flex text-sm">
                 <span className="font-bold w-32">Previous Mock Drill Date:</span>
                 <span>{previousMockDrillDate || "-"}</span>
              </div>
           </div>
        </div>

        {/* WWR vs WWW Table */}
        <table className="w-full border-collapse border border-gray-900 text-sm mb-6">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-900 p-2 w-1/2 text-left">What went Right (WWR)</th>
              <th className="border border-gray-900 p-2 w-1/2 text-left">What went Wrong (WWW)</th>
            </tr>
          </thead>
          <tbody>
            {wwrRows.map((row, idx) => (
              <tr key={idx}>
                <td className="border border-gray-900 p-2 whitespace-pre-wrap">{row.whatWentRight || "-"}</td>
                <td className="border border-gray-900 p-2 whitespace-pre-wrap">{row.whatWentWrong || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Action Plan Table */}
        <table className="w-full border-collapse border border-gray-900 text-sm">
          <thead>
            <tr>
               <th colSpan={3} className="bg-gray-200 border border-gray-900 p-2 text-left font-bold">Action Plan for area of improvement during Mock Drill:</th>
            </tr>
            <tr className="bg-gray-100">
              <th className="border border-gray-900 p-2 w-12 text-center">Sl. No.</th>
              <th className="border border-gray-900 p-2 text-left">Area of improvement</th>
              <th className="border border-gray-900 p-2 text-left w-1/3">Action Plan with Date</th>
            </tr>
          </thead>
          <tbody>
            {improvementRows.map((row, idx) => (
              <tr key={idx}>
                <td className="border border-gray-900 p-2 text-center">{idx + 1}</td>
                <td className="border border-gray-900 p-2 whitespace-pre-wrap">{row.areaOfImprovement || "-"}</td>
                <td className="border border-gray-900 p-2 whitespace-pre-wrap">{row.actionPlan ? `${row.actionPlan} \nDate: ${row.actionDate || '-'}` : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <DocumentFooter pageInfo="Page 3 of 4" />
      </div>

      {/* PAGE 4 - Photos */}
      <div data-pdf-page className="bg-white flex flex-col shadow-lg border border-slate-200" style={{ width: "210mm", minHeight: "297mm", padding: "12mm 15mm", boxSizing: "border-box" }}>
        <HeaderComponent />
        
        <h3 className="font-bold text-center underline uppercase mb-6 text-lg">Photographs of the Mock Drill</h3>
        
        <div className="grid grid-cols-2 gap-6 mb-8 flex-1 content-start">
           {photoRows.map((photo, idx) => (
              <div key={idx} className="border border-gray-900 p-2 flex flex-col items-center">
                 {photo.file ? (
                    <img src={URL.createObjectURL(photo.file)} alt="Drill Photo" className="w-full h-48 object-contain bg-gray-50 mb-2" />
                 ) : (
                    <div className="w-full h-48 bg-gray-100 flex items-center justify-center text-gray-400 mb-2">No Photo Provided</div>
                 )}
                 <p className="text-sm font-semibold text-center italic mt-2 min-h-[40px] whitespace-pre-wrap">
                    {photo.description || "-"}
                 </p>
              </div>
           ))}
        </div>

        {/* Signatures */}
        <div className="flex justify-between mt-auto pt-8 px-4">
           <div className="flex flex-col items-center w-1/3 border-t border-gray-900 pt-2">
              <span className="font-bold text-sm">Report Prepared by</span>
              <span className="text-xs text-gray-500">(Name & Signature)</span>
           </div>
           <div className="flex flex-col items-center w-1/3 border-t border-gray-900 pt-2">
              <span className="font-bold text-sm">Report Reviewed by</span>
              <span className="text-xs text-gray-500">(Name & Signature)</span>
           </div>
        </div>

        <DocumentFooter pageInfo="Page 4 of 4" />
      </div>

    </div>
  );

  if (variant === "embedded") {
    return (
      <div className="flex flex-col h-full min-h-0 bg-gray-200">
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-300 bg-white shadow-sm shrink-0">
          <span className="text-sm font-semibold text-gray-700">Live Preview</span>
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            className="h-8 text-xs gap-1.5 inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1 hover:bg-gray-50 disabled:opacity-50 text-slate-700 font-medium shadow-sm transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            {isGeneratingPdf ? "Generating..." : "Download PDF"}
          </button>
        </div>
        <div
          ref={previewContainerRef}
          className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 sm:p-8 flex justify-center"
        >
          <div
            ref={scaleWrapperRef}
            className="inline-block origin-top shadow-[0_0_20px_rgba(0,0,0,0.1)] rounded-sm"
            style={{ zoom: previewScale }}
          >
            {previewBody}
          </div>
        </div>
      </div>
    );
  }

  // Fallback for modal variant
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex flex-col min-h-0 backdrop-blur-sm">
      {/* ... similar to InductionPreview ... */}
    </div>
  );
};

export default MockDrillObservationReportPreview;
