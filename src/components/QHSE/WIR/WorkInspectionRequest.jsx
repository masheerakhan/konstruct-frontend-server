import { useState } from "react";

const defaultAttachments = [
  "Area of Inspection Requested",
  "Marked in Key Plan",
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

const formatDate = (date) => date.toISOString().split("T")[0];

const SectionHeader = ({ title }) => (
  <div className="border-b border-gray-200 px-5 py-4">
    <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
  </div>
);

const WorkInspectionRequest = () => {
  const now = new Date();
  const [date, setDate] = useState(formatDate(now));
  const [time, setTime] = useState(
    `${String(now.getHours()).padStart(2, "0")}:${String(
      now.getMinutes()
    ).padStart(2, "0")}`
  );
  const [requestNo, setRequestNo] = useState("HIPPL-API-KLP-QUA-WIR-");
  const [workType, setWorkType] = useState("");
  const [location, setLocation] = useState("");
  const [approvedWmsRefNo, setApprovedWmsRefNo] = useState("");
  const [zoneArea, setZoneArea] = useState("");
  const [element, setElement] = useState("");
  const [inspectionFor, setInspectionFor] = useState("");
  const [attachmentRows, setAttachmentRows] = useState(
    defaultAttachments.map((attachment) => ({
      name: attachment,
      isDefault: true,
    }))
  );

  const inputClass =
    "w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500";
  const selectClass =
    "w-full appearance-none rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500";
  const sectionClass =
    "overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm";
  const thClass =
    "border border-gray-300 bg-gray-100 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-700";
  const tdClass = "border border-gray-300 px-3 py-2 align-middle";
  const buttonClass =
    "inline-flex items-center justify-center rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sky-500";
  const uploadButtonClass =
    "inline-flex items-center justify-center rounded border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sky-500";
  const deleteButtonClass =
    "inline-flex h-8 w-8 items-center justify-center rounded border border-red-200 bg-red-50 text-sm font-semibold text-red-600 transition-colors hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-400";

  const addRow = () => {
    setAttachmentRows((prev) => [
      ...prev,
      { name: "", isDefault: false },
    ]);
  };

  const updateAttachmentRow = (index, value) => {
    setAttachmentRows((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        name: value,
      };
      return updated;
    });
  };

  const deleteAttachmentRow = (index) => {
    setAttachmentRows((prev) => prev.filter((_, rowIndex) => rowIndex !== index));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="mx-auto max-w-4xl space-y-6">
        <h1 className="text-center text-2xl font-bold text-gray-800">
          Work Inspection Request
        </h1>

        <div className={sectionClass}>
          <SectionHeader title="Submission Details" />
          <div className="space-y-4 p-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Date of Submission
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Inspection Request No.
                </label>
                <input
                  type="text"
                  value={requestNo}
                  onChange={(e) => setRequestNo(e.target.value)}
                  placeholder="HIPPL-API-KLP-QUA-WIR-001"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Time of Inspection
                </label>
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

        <div className={sectionClass}>
          <SectionHeader title="Description of Work" />
          <div className="space-y-4 p-5">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Description of Work to be Inspected
              </label>
              <select
                value={workType}
                onChange={(e) => setWorkType(e.target.value)}
                className={selectClass}
              >
                <option value="">Select work type</option>
                {workTypes.map((option) => (
                  <option key={option} value={option.toLowerCase().replace(/\s+/g, "-")}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Location / Gridlines
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Enter location or gridlines"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Approved WMS Ref. No.
                </label>
                <input
                  type="text"
                  value={approvedWmsRefNo}
                  onChange={(e) => setApprovedWmsRefNo(e.target.value)}
                  placeholder="Enter WMS reference number"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Zone / Area
                </label>
                <input
                  type="text"
                  value={zoneArea}
                  onChange={(e) => setZoneArea(e.target.value)}
                  placeholder="Enter zone or area"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Element
                </label>
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
                  {attachmentRows.map((attachment, index) => (
                    <tr key={index}>
                      <td className={`${tdClass} font-medium text-gray-700`}>
                        {index + 1}
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
                              updateAttachmentRow(index, e.target.value)
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
                          onClick={() => deleteAttachmentRow(index)}
                          className={deleteButtonClass}
                          aria-label={`Delete attachment row ${index + 1}`}
                        >
                          X
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button type="button" onClick={addRow} className={buttonClass}>
              Additional Document
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkInspectionRequest;
