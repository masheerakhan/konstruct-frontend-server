import { useState } from "react";
import { formatInputDate } from "../../../../utils/dateFormatter";
import { Plus, Trash2 } from "lucide-react";
import { NumberedTextarea } from "../../Transmittal/DocTypes/MethodStatement/WMS";

// ── Constants ────────────────────────────────────────────────────────────────

const defaultAttachments = [
  "Area of Inspection Requested, Marked in Key Plan",
  "Checklist of the Activity",
  "MEP / Interface / Area Clearance Form",
  "GFC/Shop Drawing : (Attached or Referred)",
];

const workTypes = [
  "Civil",
  "PEB",
  "Infra Structure",
  "Mechanical",
  "Electrical",
  "Plumbing",
  "Fire Fighting",
  "ELV",
  "Landscape",
];

// Approved WMS reference numbers (dummy data)
const WMS_REFERENCES = [
  "HIPPL-ABC-KLP-QUA-WMS-001",
  "HIPPL-ABC-KLP-QUA-WMS-002",
  "HIPPL-ABC-KLP-QUA-WMS-003",
  "HIPPL-ABC-MUM-QUA-WMS-001",
  "HIPPL-ABC-MUM-QUA-WMS-002",
  "HIPPL-XYZ-KLP-QUA-WMS-001",
  "HIPPL-XYZ-KLP-QUA-WMS-002",
  "HIPPL-XYZ-DLH-QUA-WMS-001",
];

// ITP dropdown options (dummy data)
const ITP_OPTIONS = [
  "Surface Preparation",
  "Concrete Pouring & Compaction",
  "Reinforcement Placement",
  "Formwork Inspection",
  "Waterproofing Application",
  "Masonry & Blockwork",
  "Plastering & Rendering",
  "Structural Steel Erection",
  "Roofing & Cladding",
  "MEP Rough-In Inspection",
  "Electrical Conduit & Wiring",
  "Plumbing Pressure Test",
  "HVAC Duct Installation",
  "Tiling & Flooring",
  "Final Finishing Inspection",
];

// ── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const addDays = (dateStr, n) => {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return formatDate(d);
};

const newItpRow = () => ({
  id: Math.random().toString(36).slice(2),
  stages: "",
  criteria: "",
  controlPoint: "Witness",
});

// ── Shared style tokens ───────────────────────────────────────────────────────

const inputClass =
  "w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20";

const selectClass =
  "w-full appearance-none rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20";

const sectionClass =
  "overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm";

const thClass =
  "border border-gray-300 bg-gray-100 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-700";

const tdClass = "border border-gray-300 px-3 py-2 align-middle";

const uploadButtonClass =
  "inline-flex items-center justify-center rounded border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sky-500";

const deleteButtonClass =
  "inline-flex h-8 w-8 items-center justify-center rounded border border-red-200 bg-red-50 text-sm font-semibold text-red-600 transition-colors hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-400";

// ── Sub-components ────────────────────────────────────────────────────────────

const SectionHeader = ({ title }) => (
  <div className="border-b border-gray-200 px-5 py-4">
    <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
  </div>
);

const Label = ({ children }) => (
  <label className="mb-1 block text-sm font-medium text-gray-700">
    {children}
  </label>
);

// ── ITP Table (reused pattern from the reference snippet) ─────────────────────

const ITPTable = ({ rows, onChange }) => {
  const patchRow = (idx, patch) => {
    const next = [...rows];
    next[idx] = { ...next[idx], ...patch };
    onChange(next);
  };

  const removeRow = (idx) => {
    onChange(rows.filter((_, i) => i !== idx));
  };

  const addRow = () => onChange([...rows, newItpRow()]);

  return (
    <div className="mt-3">
      <div className="overflow-x-auto rounded border border-gray-200">
        <table className="w-full text-left text-[11px]">
          <thead className="bg-gray-100/80 text-gray-600">
            <tr>
              <th className="w-12 border-b border-gray-200 px-2 py-1.5 text-center font-semibold">
                Sl No.
              </th>
              <th className="w-[28%] border-b border-l border-gray-200 px-2 py-1.5 font-semibold">
                Stages
              </th>
              <th className="border-b border-l border-gray-200 px-2 py-1.5 font-semibold">
                Acceptance Criteria
              </th>
              <th className="w-32 border-b border-l border-gray-200 px-2 py-1.5 font-semibold">
                Control Point
              </th>
              <th className="w-10 border-b border-l border-gray-200 px-2 py-1.5" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="p-4 text-center italic text-gray-500"
                >
                  No rows added yet. Click "+ Add Row" to begin.
                </td>
              </tr>
            ) : (
              rows.map((row, idx) => (
                <tr
                  key={row.id}
                  className="border-b border-gray-100 bg-white last:border-0"
                >
                  <td className="bg-gray-50/50 px-2 py-1.5 text-center font-medium text-gray-500">
                    {idx + 1}
                  </td>

                  <td className="border-l border-gray-100 px-1 py-1">
                    <textarea
                      className="min-h-[40px] w-full resize-y rounded border border-transparent bg-transparent px-2 py-1 text-[11px] outline-none hover:border-gray-200 focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
                      value={row.stages}
                      onChange={(e) => patchRow(idx, { stages: e.target.value })}
                      placeholder="Enter stage…"
                      rows={2}
                    />
                  </td>

                  <td className="border-l border-gray-100 px-1 py-1">
                    <NumberedTextarea
                      className="min-h-[40px] w-full resize-y rounded border border-transparent bg-transparent px-2 py-1 text-[11px] outline-none hover:border-gray-200 focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
                      value={row.criteria}
                      onChange={(value) => patchRow(idx, { criteria: value })}
                      placeholder="1. Enter acceptance criteria"
                      rows={2}
                    />
                  </td>

                  <td className="border-l border-gray-100 px-1 py-1">
                    <select
                      className="w-full rounded border border-transparent bg-transparent px-1 py-1.5 text-[11px] outline-none hover:border-gray-200 focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
                      value={row.controlPoint}
                      onChange={(e) =>
                        patchRow(idx, { controlPoint: e.target.value })
                      }
                    >
                      <option value="Hold Point">Hold Point</option>
                      <option value="Witness">Witness</option>
                      <option value="Surveillance">Surveillance</option>
                      <option value="Test">Test</option>
                      <option value="Review">Review</option>
                    </select>
                  </td>

                  <td className="border-l border-gray-100 bg-gray-50/50 px-2 py-1.5 text-center">
                    <button
                      type="button"
                      onClick={() => removeRow(idx)}
                      className="rounded p-1 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                      title="Delete row"
                      aria-label={`Delete ITP row ${idx + 1}`}
                    >
                      <Trash2 className="mx-auto h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <button
        type="button"
        onClick={addRow}
        className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-semibold text-sky-600 transition-colors hover:text-sky-800"
      >
        <Plus className="h-3.5 w-3.5" />
        Add Row
      </button>
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────

const WorkInspectionRequest = () => {
  const now = new Date();

  // ── Submission Details ──
  const [submissionDate, setSubmissionDate] = useState(formatDate(now));
  const [inspectionDate, setInspectionDate] = useState(
    addDays(formatDate(now), 1)          // default: submission date + 1 day
  );
  const [requestNo, setRequestNo] = useState("HIPPL-API-KLP-QUA-WIR-");
  const [time, setTime] = useState(
    `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
  );

  // ── Description of Work ──
  const [workType, setWorkType] = useState("");
  const [location, setLocation] = useState("");
  const [approvedWmsRefNo, setApprovedWmsRefNo] = useState("");
  const [zoneArea, setZoneArea] = useState("");
  const [element, setElement] = useState("");

  // ── ITP Details ──
  const [itpSelection, setItpSelection] = useState("");   // dropdown value
  const [showManualITP, setShowManualITP] = useState(false);
  const [manualITP, setManualITP] = useState([]);          // rows for manual table

  // ── Inspection Request / Attachments ──
  const [inspectionFor, setInspectionFor] = useState("");
  const [attachmentRows, setAttachmentRows] = useState(
    defaultAttachments.map((name) => ({ name, isDefault: true }))
  );

  // Keep inspectionDate in sync when submissionDate changes
  const handleSubmissionDateChange = (val) => {
    setSubmissionDate(val);
    // Only auto-advance inspectionDate if it hasn't been manually set ahead
    setInspectionDate(addDays(val, 1));
  };

  const addAttachmentRow = () =>
    setAttachmentRows((prev) => [...prev, { name: "", isDefault: false }]);

  const updateAttachmentRow = (idx, value) =>
    setAttachmentRows((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, name: value } : r))
    );

  const deleteAttachmentRow = (idx) =>
    setAttachmentRows((prev) => prev.filter((_, i) => i !== idx));

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <h1 className="text-center text-2xl font-bold text-gray-800">
          Work Inspection Request
        </h1>

        {/* ── Submission Details (2 × 2) ─────────────────────────────── */}
        <div className={sectionClass}>
          <SectionHeader title="Submission Details" />
          <div className="space-y-4 p-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Row 1 col 1 */}
              <div>
                <Label>Date of Submission</Label>
                <input
                  type="date"
                  value={submissionDate}
                  onChange={(e) => handleSubmissionDateChange(e.target.value)}
                  className={inputClass}
                />
              </div>

              {/* Row 1 col 2 */}
              <div>
                <Label>Date of Inspection</Label>
                <input
                  type="date"
                  value={inspectionDate}
                  onChange={(e) => setInspectionDate(e.target.value)}
                  className={inputClass}
                />
              </div>

              {/* Row 2 col 1 */}
              <div>
                <Label>Inspection Request No.</Label>
                <input
                  type="text"
                  value={requestNo}
                  onChange={(e) => setRequestNo(e.target.value)}
                  placeholder="HIPPL-API-KLP-QUA-WIR-001"
                  className={inputClass}
                />
              </div>

              {/* Row 2 col 2 */}
              <div>
                <Label>Time of Inspection</Label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Description of Work ───────────────────────────────────────── */}
        <div className={sectionClass}>
          <SectionHeader title="Description of Work" />
          <div className="space-y-4 p-5">
            <div>
              <Label>Trade</Label>
              <select
                value={workType}
                onChange={(e) => setWorkType(e.target.value)}
                className={selectClass}
              >
                <option value="">Select work type</option>
                {workTypes.map((opt) => (
                  <option key={opt} value={opt.toLowerCase().replace(/\s+/g, "-")}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label>Location / Gridlines</Label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Enter location or gridlines"
                  className={inputClass}
                />
              </div>

              {/* Approved WMS Ref. No. — now a dropdown */}
              <div>
                <Label>Approved WMS Ref. No.</Label>
                <select
                  value={approvedWmsRefNo}
                  onChange={(e) => setApprovedWmsRefNo(e.target.value)}
                  className={selectClass}
                >
                  <option value="">Select WMS reference</option>
                  {WMS_REFERENCES.map((ref) => (
                    <option key={ref} value={ref}>
                      {ref}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Zone / Area</Label>
                <input
                  type="text"
                  value={zoneArea}
                  onChange={(e) => setZoneArea(e.target.value)}
                  placeholder="Enter zone or area"
                  className={inputClass}
                />
              </div>

              <div>
                <Label>Element</Label>
                <input
                  type="text"
                  value={element}
                  onChange={(e) => setElement(e.target.value)}
                  placeholder="Enter element"
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── ITP Details ──────────────────────────────────────────────── */}
        <div className={sectionClass}>
          <SectionHeader title="ITP Details" />
          <div className="space-y-4 p-5">
            {/* Prompt + controls row */}
            <div className="flex flex-wrap items-end gap-3">
              <p className="shrink-0 text-sm font-medium text-gray-700">
                We request inspection of:
              </p>

              {/* ITP dropdown */}
              <div className="min-w-[220px] flex-1">
                <select
                  value={itpSelection}
                  onChange={(e) => setItpSelection(e.target.value)}
                  className={selectClass}
                  aria-label="Choose from ITP"
                >
                  <option value="">Choose from ITP</option>
                  {ITP_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {/* Manual Entry toggle */}
              <button
                type="button"
                onClick={() => setShowManualITP((v) => !v)}
                className={`inline-flex items-center gap-1.5 rounded border px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500/30 ${showManualITP
                  ? "border-sky-500 bg-sky-50 text-sky-700 hover:bg-sky-100"
                  : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                aria-pressed={showManualITP}
              >
                {showManualITP ? (
                  <>
                    <Trash2 className="h-3.5 w-3.5" />
                    Hide Manual Entry
                  </>
                ) : (
                  <>
                    <Plus className="h-3.5 w-3.5" />
                    Manual Entry
                  </>
                )}
              </button>
            </div>

            {/* Manual ITP table — renders when toggled */}
            {showManualITP && (
              <div className="border-t border-gray-200 pt-4">
                <ITPTable rows={manualITP} onChange={setManualITP} />
              </div>
            )}
          </div>
        </div>

        {/* ── Inspection Request ────────────────────────────────────────── */}
        <div className={sectionClass}>
          <SectionHeader title="Inspection Request" />
          <div className="space-y-4 p-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-gray-700">
                We request for inspection for
              </span>
              <input
                type="text"
                value={inspectionFor}
                onChange={(e) => setInspectionFor(e.target.value)}
                placeholder="Enter inspection details"
                className={`${inputClass} min-w-[200px] flex-1`}
              />
            </div>

            <div className="overflow-auto rounded-md border border-gray-300">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className={`${thClass} w-[60px]`}>Sr. No.</th>
                    <th className={thClass}>Attachments</th>
                    <th className={`${thClass} w-[160px]`}>Document</th>
                    <th className={`${thClass} w-[80px]`}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {attachmentRows.map((attachment, idx) => (
                    <tr key={idx}>
                      <td className={`${tdClass} font-medium text-gray-700`}>
                        {idx + 1}
                      </td>
                      <td className={tdClass}>
                        {attachment.isDefault ? (
                          <span className="text-sm text-gray-700">
                            {attachment.name}
                          </span>
                        ) : (
                          <input
                            type="text"
                            value={attachment.name}
                            onChange={(e) =>
                              updateAttachmentRow(idx, e.target.value)
                            }
                            placeholder="Enter attachment name"
                            className={`${inputClass} py-1.5`}
                          />
                        )}
                      </td>
                      <td className={tdClass}>
                        <button type="button" className={uploadButtonClass}>
                          Upload
                        </button>
                      </td>
                      <td className={tdClass}>
                        <button
                          type="button"
                          onClick={() => deleteAttachmentRow(idx)}
                          className={deleteButtonClass}
                          aria-label={`Delete attachment row ${idx + 1}`}
                        >
                          X
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              type="button"
              onClick={addAttachmentRow}
              className="inline-flex items-center justify-center rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              Other Documents
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkInspectionRequest;