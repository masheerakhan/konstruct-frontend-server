import { useRef, useState } from "react";
import { FileText, Paperclip, Plus, Save, Trash2, Upload, X } from "lucide-react";
import toast from "react-hot-toast";

const NC_TYPE_OPTIONS = ["Quality", "HSE"];
const PROJECT_OPTIONS = ["Project Alpha", "Project Beta", "Project Gamma", "Project Delta"];

const PROJECT_REQ_DEFAULT_ROWS = [
  "Specification",
  "Contract Quality Plan",
  "IS Code / International Std / BOCW",
  "BOQ",
  "Contract HSE Plan",
  "General Construction Practice",
  "GFC / Shop Drawing",
  "Legal Requirement",
];

const NC_ATTACHMENT_OPTIONS = [
  "Approved Inspections",
  "Photographs",
  "Test Reports",
  "Other Evidence",
];

const CORR_ATTACHMENT_OPTIONS = [
  "Training",
  "Toolbox Talks",
  "Resources",
  "Vendor",
  "HIRA",
  "Other",
];

const todayISO = () => new Date().toISOString().slice(0, 10);

let uidCounter = 1000;
const uid = () => ++uidCounter;

const getReferenceTemplate = (type) => {
  if (type === "Quality") return "HIPPL-XXX-YYY-QUA-NCR-01";
  if (type === "HSE") return "HIPPL-XXX-YYY-HSE-NCR-01";
  if (type === "Audit") return "HIPPL-XXX-YYY-AUD-NCR-01";
  if (type === "Others") return "HIPPL-XXX-YYY-OTH-NCR-01";
  return "";
};

const INITIAL_NC_ATTACHMENTS = [
  {
    id: 1,
    label: "Drawing/sketch showing Highlighted Area/Location affected. (A4 Full Size)",
    file: null,
  },
  {
    id: 2,
    label: "Photographs/Evidence showing Nature of Defects (2 or 4 Photos in one page - A4 Size)",
    file: null,
  },
];

const INITIAL_REQ_ROWS = PROJECT_REQ_DEFAULT_ROWS.map((label, index) => ({
  id: index + 1,
  label,
  file: null,
}));

const HSE = ({ onSubmitSuccess }) => {
  const [ncType, setNcType] = useState("");
  const [project, setProject] = useState("");
  const [referenceNo, setReferenceNo] = useState("");
  const [projectLocation, setProjectLocation] = useState("");
  const [dateOfIssue, setDateOfIssue] = useState(todayISO());
  const [issuedTo, setIssuedTo] = useState("");
  const [gridRoom, setGridRoom] = useState("");
  const [ncrSubject, setNcrSubject] = useState("");

  const [nonConformity, setNonConformity] = useState("");
  const [ncAttachments, setNcAttachments] = useState(INITIAL_NC_ATTACHMENTS);

  const [projectRequirements, setProjectRequirements] = useState("");
  const [reqRows, setReqRows] = useState(INITIAL_REQ_ROWS);

  const [suggestedAction, setSuggestedAction] = useState("");

  const [rootCause, setRootCause] = useState("");
  const [correction, setCorrection] = useState("");
  const [correctionAttachments, setCorrectionAttachments] = useState([
    { id: uid(), type: "", file: null },
  ]);
  const [correctiveAction, setCorrectiveAction] = useState("");
  const [correctiveAttachments, setCorrectiveAttachments] = useState([
    { id: uid(), type: "", file: null },
  ]);

  const fileInputs = useRef({});

  const labelCls = "mb-1.5 block text-sm font-medium text-foreground";
  const inputCls =
    "h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 transition";
  const selectCls = `${inputCls} appearance-none pr-9`;
  const textareaCls =
    "w-full min-h-[120px] resize-y rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 transition";
  const sectionWrap = "overflow-hidden rounded-xl border border-border bg-card shadow-sm";
  const sectionHeader = "border-b border-border px-5 py-3";
  const sectionBody = "p-5 sm:p-6";

  const renderSectionHeader = (title, helper) => (
    <div className={sectionHeader}>
      <h2 className="text-sm font-semibold tracking-tight text-foreground sm:text-base">
        {title}
      </h2>
      {helper && <p className="mt-0.5 text-xs italic text-muted-foreground">{helper}</p>}
    </div>
  );

  const Caret = () => (
    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
      ▾
    </span>
  );

  const handleNcTypeChange = (value) => {
    setNcType(value);
    setReferenceNo(getReferenceTemplate(value));
  };

  const handleSimpleFileChange = (setter, id, event) => {
    const file = event.target.files?.[0] || null;
    setter((prev) => prev.map((attachment) => (attachment.id === id ? { ...attachment, file } : attachment)));
  };

  const clearSimpleFile = (setter, key, id) => {
    setter((prev) => prev.map((attachment) => (attachment.id === id ? { ...attachment, file: null } : attachment)));
    const input = fileInputs.current[key];
    if (input) input.value = "";
  };

  const updateTypedRow = (setter, id, patch) => {
    setter((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };

  const addTypedRow = (setter) => {
    setter((prev) => [...prev, { id: uid(), type: "", file: null }]);
  };

  const removeTypedRow = (setter, id) => {
    setter((prev) => (prev.length > 1 ? prev.filter((row) => row.id !== id) : prev));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const payload = {
      ncType,
      project,
      referenceNo,
      projectLocation,
      dateOfIssue,
      issuedTo,
      gridRoom,
      ncrSubject,
      nonConformity,
      ncAttachments: ncAttachments.map((attachment) => ({
        id: attachment.id,
        label: attachment.label,
        fileName: attachment.file?.name || null,
      })),
      projectRequirements,
      reqRows: reqRows.map((attachment) => ({
        id: attachment.id,
        label: attachment.label,
        fileName: attachment.file?.name || null,
      })),
      suggestedAction,
      rootCause,
      correction,
      correctionAttachments: correctionAttachments.map((attachment) => ({
        id: attachment.id,
        type: attachment.type,
        fileName: attachment.file?.name || null,
      })),
      correctiveAction,
      correctiveAttachments: correctiveAttachments.map((attachment) => ({
        id: attachment.id,
        type: attachment.type,
        fileName: attachment.file?.name || null,
      })),
    };

    // Payload
    const finalPayload = {
      id: `enc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      status: "Open",
      dispositionStatus: "",
      closeoutStatus: "",
      createdAt: new Date().toISOString(),
      ...payload,
    };

    console.log("External NCR Submitted:", finalPayload);
    toast.success("External NCR saved successfully");
    onSubmitSuccess?.(finalPayload);
    
  };

  const handleReset = () => {
    setNcType("");
    setProject("");
    setReferenceNo("");
    setProjectLocation("");
    setDateOfIssue(todayISO());
    setIssuedTo("");
    setGridRoom("");
    setNcrSubject("");
    setNonConformity("");
    setNcAttachments((prev) => prev.map((attachment) => ({ ...attachment, file: null })));
    setProjectRequirements("");
    setReqRows((prev) => prev.map((attachment) => ({ ...attachment, file: null })));
    setSuggestedAction("");
    setRootCause("");
    setCorrection("");
    setCorrectionAttachments([{ id: uid(), type: "", file: null }]);
    setCorrectiveAction("");
    setCorrectiveAttachments([{ id: uid(), type: "", file: null }]);
    Object.values(fileInputs.current).forEach((input) => {
      if (input) input.value = "";
    });
    toast("Form reset");
  };

  const renderFixedAttachmentTable = (rows, setter, keyPrefix, showAddRow) => (
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="bg-content-bg text-foreground">
          <tr className="text-left">
            <th className="w-16 px-4 py-2.5 font-medium">Sr. No.</th>
            <th className="px-4 py-2.5 font-medium">Attachment</th>
            <th className="w-72 px-4 py-2.5 font-medium">Upload</th>
            {showAddRow && <th className="w-12 px-4 py-2.5 font-medium"></th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const inputKey = `${keyPrefix}-${row.id}`;

            return (
              <tr
                key={row.id}
                className={`border-t border-border ${index % 2 === 1 ? "bg-content-bg/50" : "bg-background"}`}
              >
                <td className="px-4 py-3 align-top text-muted-foreground">{index + 1}</td>
                <td className="px-4 py-3 align-top text-foreground">
                  {showAddRow ? (
                    <input
                      type="text"
                      value={row.label}
                      onChange={(e) =>
                        setter((prev) =>
                          prev.map((attachment) =>
                            attachment.id === row.id ? { ...attachment, label: e.target.value } : attachment
                          )
                        )
                      }
                      className={inputCls}
                    />
                  ) : (
                    row.label
                  )}
                </td>
                <td className="px-4 py-3 align-top">
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      ref={(element) => {
                        fileInputs.current[inputKey] = element;
                      }}
                      type="file"
                      onChange={(e) => handleSimpleFileChange(setter, row.id, e)}
                      className="hidden"
                      id={inputKey}
                      accept="image/*,application/pdf"
                    />
                    <label
                      htmlFor={inputKey}
                      className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-md border border-border bg-background px-3 text-xs font-medium transition hover:bg-content-bg"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      Choose file
                    </label>
                    {row.file ? (
                      <span className="inline-flex max-w-[160px] items-center gap-1 text-xs text-muted-foreground">
                        <Paperclip className="h-3 w-3 shrink-0" />
                        <span className="truncate">{row.file.name}</span>
                        <button
                          type="button"
                          onClick={() => clearSimpleFile(setter, inputKey, row.id)}
                          className="text-muted-foreground transition hover:text-red-600"
                          aria-label="Remove file"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">No file selected</span>
                    )}
                  </div>
                </td>
                {showAddRow && (
                  <td className="px-4 py-3 align-top">
                    {rows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setter((prev) => prev.filter((attachment) => attachment.id !== row.id))}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition hover:bg-red-50 hover:text-red-600"
                        aria-label="Remove row"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
      {showAddRow && (
        <div className="border-t border-border bg-content-bg/70 px-4 py-2">
          <button
            type="button"
            onClick={() =>
              setter((prev) => [...prev, { id: (prev.at(-1)?.id || 0) + 1, label: "", file: null }])
            }
            className="inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-medium text-primary transition hover:bg-primary/10"
          >
            <Plus className="h-3.5 w-3.5" />
            Add row
          </button>
        </div>
      )}
    </div>
  );

  const renderTypedAttachmentTable = (rows, setter, options, keyPrefix) => (
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="bg-content-bg text-foreground">
          <tr className="text-left">
            <th className="w-16 px-4 py-2.5 font-medium">Sr. No.</th>
            <th className="px-4 py-2.5 font-medium">Attachment</th>
            <th className="w-72 px-4 py-2.5 font-medium">Upload</th>
            <th className="w-12 px-4 py-2.5 font-medium"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const inputKey = `${keyPrefix}-${row.id}`;

            return (
              <tr
                key={row.id}
                className={`border-t border-border ${index % 2 === 1 ? "bg-content-bg/50" : "bg-background"}`}
              >
                <td className="px-4 py-3 align-top text-muted-foreground">{index + 1}</td>
                <td className="px-4 py-3 align-top">
                  <div className="relative">
                    <select
                      value={row.type}
                      onChange={(e) => updateTypedRow(setter, row.id, { type: e.target.value })}
                      className={selectCls}
                    >
                      <option value="" disabled>
                        Select attachment type
                      </option>
                      {options.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    <Caret />
                  </div>
                </td>
                <td className="px-4 py-3 align-top">
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      ref={(element) => {
                        fileInputs.current[inputKey] = element;
                      }}
                      type="file"
                      onChange={(e) => updateTypedRow(setter, row.id, { file: e.target.files?.[0] || null })}
                      className="hidden"
                      id={inputKey}
                      accept="image/*,application/pdf"
                    />
                    <label
                      htmlFor={inputKey}
                      className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-md border border-border bg-background px-3 text-xs font-medium transition hover:bg-content-bg"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      Choose file
                    </label>
                    {row.file ? (
                      <span className="inline-flex max-w-[160px] items-center gap-1 text-xs text-muted-foreground">
                        <Paperclip className="h-3 w-3 shrink-0" />
                        <span className="truncate">{row.file.name}</span>
                        <button
                          type="button"
                          onClick={() => {
                            updateTypedRow(setter, row.id, { file: null });
                            const input = fileInputs.current[inputKey];
                            if (input) input.value = "";
                          }}
                          className="text-muted-foreground transition hover:text-red-600"
                          aria-label="Remove file"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">No file selected</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 align-top">
                  {rows.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTypedRow(setter, row.id)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition hover:bg-red-50 hover:text-red-600"
                      aria-label="Remove row"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="border-t border-border bg-content-bg/70 px-4 py-2">
        <button
          type="button"
          onClick={() => addTypedRow(setter)}
          className="inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-medium text-primary transition hover:bg-primary/10"
        >
          <Plus className="h-3.5 w-3.5" />
          Add row
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-content-bg">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                External Non-Conformance Report
              </h1>
              <p className="text-sm text-muted-foreground">
                Issue and track an external NCR across Quality, HSE and Audit categories.
              </p>
            </div>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          <section className={sectionWrap}>
            {renderSectionHeader("Non-Conformance Type")}
            <div className={sectionBody}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label className={labelCls}>Type</label>
                  <div className="relative">
                    <select
                      value={ncType}
                      onChange={(e) => handleNcTypeChange(e.target.value)}
                      className={selectCls}
                      required
                    >
                      <option value="" disabled>
                        Select type
                      </option>
                      {NC_TYPE_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    <Caret />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Project</label>
                  <div className="relative">
                    <select
                      value={project}
                      onChange={(e) => setProject(e.target.value)}
                      className={selectCls}
                      required
                    >
                      <option value="" disabled>
                        Select project
                      </option>
                      {PROJECT_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    <Caret />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Reference No.</label>
                  <input
                    type="text"
                    value={referenceNo}
                    onChange={(e) => setReferenceNo(e.target.value)}
                    placeholder="Select type to generate reference"
                    className={inputCls}
                    required
                  />
                </div>
                <div>
                  <label className={labelCls}>Project Location</label>
                  <input
                    type="text"
                    value={projectLocation}
                    onChange={(e) => setProjectLocation(e.target.value)}
                    placeholder="Site / city / address"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Date of Issue</label>
                  <input
                    type="date"
                    value={dateOfIssue}
                    onChange={(e) => setDateOfIssue(e.target.value)}
                    className={inputCls}
                    required
                  />
                </div>
                <div>
                  <label className={labelCls}>Issued To (Company)</label>
                  <input
                    type="text"
                    value={issuedTo}
                    onChange={(e) => setIssuedTo(e.target.value)}
                    placeholder="Contractor / vendor company name"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Grid / Room</label>
                  <input
                    type="text"
                    value={gridRoom}
                    onChange={(e) => setGridRoom(e.target.value)}
                    placeholder="e.g. Grid A4 / Room 201"
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="mt-5">
                <label className={labelCls}>NCR Subject</label>
                <textarea
                  value={ncrSubject}
                  onChange={(e) => setNcrSubject(e.target.value)}
                  placeholder="Brief subject describing the non-conformance..."
                  className={textareaCls}
                />
              </div>
            </div>
          </section>

          <section className={sectionWrap}>
            {renderSectionHeader("Non-Conformity", "(To be filled by issuer)")}
            <div className={`${sectionBody} space-y-5`}>
              <div>
                <label className={labelCls}>Non-Conformity</label>
                <textarea
                  value={nonConformity}
                  onChange={(e) => setNonConformity(e.target.value)}
                  placeholder="Describe the observed non-conformity in detail..."
                  className={textareaCls}
                />
              </div>
              <div>
                <label className={labelCls}>Attachments</label>
                {renderFixedAttachmentTable(ncAttachments, setNcAttachments, "nc")}
              </div>
            </div>
          </section>

          <section className={sectionWrap}>
            {renderSectionHeader("Project Requirements")}
            <div className={`${sectionBody} space-y-5`}>
              <div>
                <label className={labelCls}>Project Requirements</label>
                <textarea
                  value={projectRequirements}
                  onChange={(e) => setProjectRequirements(e.target.value)}
                  placeholder="Describe the applicable project requirements..."
                  className={textareaCls}
                />
              </div>
              <div>
                <label className={labelCls}>Reference Documents</label>
                {renderFixedAttachmentTable(reqRows, setReqRows, "req", true)}
              </div>
            </div>
          </section>

          <section className={sectionWrap}>
            {renderSectionHeader("Suggested Remedial Action")}
            <div className={sectionBody}>
              <textarea
                value={suggestedAction}
                onChange={(e) => setSuggestedAction(e.target.value)}
                placeholder="Suggested remedial action to address the non-conformity..."
                className={textareaCls}
              />
            </div>
          </section>

          <section className={sectionWrap}>
            {renderSectionHeader("Root Cause & Actions", "(To be filled by Constructor)")}
            <div className={`${sectionBody} space-y-6`}>
              <div>
                <label className={labelCls}>Root Cause</label>
                <textarea
                  value={rootCause}
                  onChange={(e) => setRootCause(e.target.value)}
                  placeholder="Identify the underlying root cause(s)..."
                  className={textareaCls}
                />
              </div>

              <div>
                <label className={labelCls}>
                  Correction{" "}
                  <span className="font-normal text-muted-foreground">
                    (Action taken to rectify / repair the Non-Conformity)
                  </span>
                </label>
                <textarea
                  value={correction}
                  onChange={(e) => setCorrection(e.target.value)}
                  placeholder="Describe the correction actions taken..."
                  className={textareaCls}
                />
                <div className="mt-3">
                  <label className={labelCls}>Correction Attachments</label>
                  {renderTypedAttachmentTable(
                    correctionAttachments,
                    setCorrectionAttachments,
                    NC_ATTACHMENT_OPTIONS,
                    "corn"
                  )}
                </div>
              </div>

              <div>
                <label className={labelCls}>
                  Corrective Action{" "}
                  <span className="font-normal text-muted-foreground">
                    (Action taken to avoid / prevent recurrence of the Non-Conformity)
                  </span>
                </label>
                <textarea
                  value={correctiveAction}
                  onChange={(e) => setCorrectiveAction(e.target.value)}
                  placeholder="Describe the corrective and preventive actions..."
                  className={textareaCls}
                />
                <div className="mt-3">
                  <label className={labelCls}>Corrective Action Attachments</label>
                  {renderTypedAttachmentTable(
                    correctiveAttachments,
                    setCorrectiveAttachments,
                    CORR_ATTACHMENT_OPTIONS,
                    "corv"
                  )}
                </div>
              </div>
            </div>
          </section>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-end">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-medium transition hover:bg-content-bg"
            >
              Reset
            </button>
            <button
              type="submit"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-primary bg-primary px-5 text-sm font-medium text-white shadow-sm transition hover:opacity-90"
            >
              <Save className="h-4 w-4" />
              Submit NCR
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HSE;
