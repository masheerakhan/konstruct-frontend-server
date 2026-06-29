import { useRef, useState } from "react";
import { FileText, Paperclip, Save, Upload, X } from "lucide-react";
import toast from "react-hot-toast";
import { formatInputDate } from "../../../utils/dateFormatter";

const TYPE_OPTIONS = ["HSE", "Quality", "Others"];
const CONCERN_OPTIONS = [
  "Material",
  "Workmanship",
  "Legal requirement",
  "PPE",
  "Others",
];

const todayISO = () => formatInputDate(new Date());

const INITIAL_ATTACHMENTS = [
  {
    id: 1,
    label:
      "Drawing/sketch showing Highlighted Area/Location affected. (A4 Full Size)",
    file: null,
  },
  {
    id: 2,
    label:
      "Photographs/Evidence showing Nature of Defects (2 or 4 Photos in one page - A4 Size)",
    file: null,
  },
];

const InternalNCR = () => {
  const [date, setDate] = useState(todayISO());
  const [ncrNo, setNcrNo] = useState("");
  const [type, setType] = useState("");
  const [concern, setConcern] = useState("");
  const [responsible, setResponsible] = useState("");
  const [requirement, setRequirement] = useState("");
  const [nonConformance, setNonConformance] = useState("");
  const [attachments, setAttachments] = useState(INITIAL_ATTACHMENTS);
  const [cause, setCause] = useState("");
  const [containment, setContainment] = useState("");
  const [corrective, setCorrective] = useState("");

  const fileInputs = useRef({});

  const labelCls = "mb-1.5 block text-sm font-medium text-foreground";
  const inputCls =
    "h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 transition";
  const selectCls = `${inputCls} appearance-none pr-9`;
  const textareaCls =
    "w-full min-h-[120px] resize-y rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 transition";
  const sectionWrap =
    "overflow-hidden rounded-xl border border-border bg-card shadow-sm";
  const sectionHeader =
    "flex items-center gap-2 border-b border-border bg-content-bg px-5 py-3";
  const sectionBody = "p-5 sm:p-6";

  const renderSectionHeader = (number, title) => (
    <div className={sectionHeader}>
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">
        {number}
      </span>
      <h2 className="text-sm font-semibold tracking-tight text-foreground sm:text-base">
        {title}
      </h2>
    </div>
  );

  const handleFileChange = (id, event) => {
    const file = event.target.files?.[0] || null;
    setAttachments((prev) =>
      prev.map((attachment) =>
        attachment.id === id ? { ...attachment, file } : attachment,
      ),
    );
  };

  const clearFile = (id) => {
    setAttachments((prev) =>
      prev.map((attachment) =>
        attachment.id === id ? { ...attachment, file: null } : attachment,
      ),
    );
    const input = fileInputs.current[id];
    if (input) input.value = "";
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const payload = {
      date,
      ncrNo,
      type,
      concern,
      responsible,
      requirement,
      nonConformance,
      attachments: attachments.map((attachment) => ({
        id: attachment.id,
        label: attachment.label,
        fileName: attachment.file?.name || null,
      })),
      cause,
      containment,
      corrective,
    };
    console.log("Internal NCR Submitted:", payload);
    toast.success("Internal NCR saved successfully");
  };

  const handleReset = () => {
    setDate(todayISO());
    setNcrNo("");
    setType("");
    setConcern("");
    setResponsible("");
    setRequirement("");
    setNonConformance("");
    setAttachments((prev) =>
      prev.map((attachment) => ({ ...attachment, file: null })),
    );
    setCause("");
    setContainment("");
    setCorrective("");
    Object.values(fileInputs.current).forEach((input) => {
      if (input) input.value = "";
    });
    toast("Form reset");
  };

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
                Internal Non-Conformance Report
              </h1>
              <p className="text-sm text-muted-foreground">
                Raise and document an internal NCR for HSE, Quality or other
                concerns.
              </p>
            </div>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          <section className={sectionWrap}>
            {renderSectionHeader(1, "NCR Details")}
            <div className={sectionBody}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className={labelCls}>Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className={inputCls}
                    required
                  />
                </div>
                <div>
                  <label className={labelCls}>Internal NCR No.</label>
                  <input
                    type="text"
                    value={ncrNo}
                    onChange={(e) => setNcrNo(e.target.value)}
                    placeholder="e.g. NCR-2025-001"
                    className={inputCls}
                    required
                  />
                </div>
                <div>
                  <label className={labelCls}>Type</label>
                  <div className="relative">
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      className={selectCls}
                      required
                    >
                      <option value="" disabled>
                        Select type
                      </option>
                      {TYPE_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      ▾
                    </span>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Concern related to</label>
                  <div className="relative">
                    <select
                      value={concern}
                      onChange={(e) => setConcern(e.target.value)}
                      className={selectCls}
                      required
                    >
                      <option value="" disabled>
                        Select concern
                      </option>
                      {CONCERN_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      ▾
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5">
                <label className={labelCls}>
                  Responsible for taking action
                </label>
                <textarea
                  value={responsible}
                  onChange={(e) => setResponsible(e.target.value)}
                  placeholder="Name(s), designation, department, contact details..."
                  className={textareaCls}
                />
              </div>
            </div>
          </section>

          <section className={sectionWrap}>
            {renderSectionHeader(2, "Nature of Complaint / Concern")}
            <div className={`${sectionBody} space-y-5`}>
              <div>
                <label className={labelCls}>Requirement</label>
                <textarea
                  value={requirement}
                  onChange={(e) => setRequirement(e.target.value)}
                  placeholder="Describe the specification, standard, or contractual requirement..."
                  className={textareaCls}
                />
              </div>
              <div>
                <label className={labelCls}>Non-conformance</label>
                <textarea
                  value={nonConformance}
                  onChange={(e) => setNonConformance(e.target.value)}
                  placeholder="Describe the deviation observed against the requirement..."
                  className={textareaCls}
                />
              </div>

              <div>
                <label className={labelCls}>Attachments</label>
                <div className="overflow-hidden rounded-lg border border-border">
                  <table className="w-full text-sm">
                    <thead className="bg-content-bg text-foreground">
                      <tr className="text-left">
                        <th className="w-16 px-4 py-2.5 font-medium">
                          Sr. No.
                        </th>
                        <th className="px-4 py-2.5 font-medium">Attachment</th>
                        <th className="w-64 px-4 py-2.5 font-medium">Upload</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attachments.map((row, index) => (
                        <tr
                          key={row.id}
                          className={`border-t border-border ${
                            index % 2 === 1
                              ? "bg-content-bg/50"
                              : "bg-background"
                          }`}
                        >
                          <td className="px-4 py-3 align-top text-muted-foreground">
                            {row.id}
                          </td>
                          <td className="px-4 py-3 align-top text-foreground">
                            {row.label}
                          </td>
                          <td className="px-4 py-3 align-top">
                            <div className="flex flex-wrap items-center gap-2">
                              <input
                                ref={(element) => {
                                  fileInputs.current[row.id] = element;
                                }}
                                type="file"
                                onChange={(e) => handleFileChange(row.id, e)}
                                className="hidden"
                                id={`file-${row.id}`}
                                accept="image/*,application/pdf"
                              />
                              <label
                                htmlFor={`file-${row.id}`}
                                className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-md border border-border bg-background px-3 text-xs font-medium transition hover:bg-content-bg"
                              >
                                <Upload className="h-3.5 w-3.5" />
                                Choose file
                              </label>
                              {row.file ? (
                                <span className="inline-flex max-w-[140px] items-center gap-1 text-xs text-muted-foreground">
                                  <Paperclip className="h-3 w-3 shrink-0" />
                                  <span className="truncate">
                                    {row.file.name}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => clearFile(row.id)}
                                    className="text-muted-foreground transition hover:text-red-600"
                                    aria-label="Remove file"
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                </span>
                              ) : (
                                <span className="text-xs text-muted-foreground">
                                  No file selected
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>

          <section className={sectionWrap}>
            {renderSectionHeader(3, "Cause for NC / Concern")}
            <div className={sectionBody}>
              <textarea
                value={cause}
                onChange={(e) => setCause(e.target.value)}
                placeholder="Root cause analysis (5 Why / Fishbone summary, etc.)..."
                className={textareaCls}
              />
            </div>
          </section>

          <section className={sectionWrap}>
            {renderSectionHeader(4, "Containment Action")}
            <div className={sectionBody}>
              <textarea
                value={containment}
                onChange={(e) => setContainment(e.target.value)}
                placeholder="Immediate action taken to contain the non-conformance..."
                className={textareaCls}
              />
            </div>
          </section>

          <section className={sectionWrap}>
            {renderSectionHeader(5, "Corrective / Preventive Action")}
            <div className={sectionBody}>
              <textarea
                value={corrective}
                onChange={(e) => setCorrective(e.target.value)}
                placeholder="Long-term corrective and preventive actions, owners and target dates..."
                className={textareaCls}
              />
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

export default InternalNCR;
