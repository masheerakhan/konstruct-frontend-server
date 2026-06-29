import { useRef, useState, useEffect } from "react";
import { Plus, RotateCcw, Save, Trash2, Upload } from "lucide-react";
import toast from "react-hot-toast";

const SOR_TYPE_OPTIONS = ["Quality", "HSE"];
const PROJECT_OPTIONS = ["Project Alpha", "Project Beta", "Project Gamma", "Project Delta"];

const SOR_DEFAULT_ROWS = [
  "Drawing / Sketch showing Highlighted Area / Location affected (A4 Full Size)",
  "Photographs / Evidence showing Nature of Defects (2 or 4 Photos in one page - A4 Size)",
  "Project Requirement",
  "General Construction Practice",
];

const CORRECTION_ATTACHMENT_OPTIONS = [
  "Approved Inspections",
  "Photographs",
  "Test Reports",
  "Other Evidence",
];

const CORRECTIVE_ATTACHMENT_OPTIONS = [
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

const inputCls =
  "w-full h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 transition";
const selectCls =
  "w-full h-10 appearance-none rounded-md border border-border bg-background px-3 pr-9 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 transition";
const textareaCls =
  "w-full min-h-[120px] resize-y rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 transition";
const labelCls = "mb-1.5 block text-xs font-medium text-foreground";
const sectionTitleCls = "text-base font-semibold text-foreground";
const helperCls = "text-xs italic text-muted-foreground";
const cardCls = "space-y-5 rounded-lg border border-border bg-card p-5 shadow-sm md:p-6";

const Caret = () => (
  <svg
    className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
    viewBox="0 0 20 20"
    fill="currentColor"
    aria-hidden="true"
  >
    <path
      fillRule="evenodd"
      d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.06l3.71-3.83a.75.75 0 1 1 1.08 1.04l-4.25 4.39a.75.75 0 0 1-1.08 0L5.21 8.27a.75.75 0 0 1 .02-1.06z"
      clipRule="evenodd"
    />
  </svg>
);

const ExternalSOR = ({
  initialType = "Quality",
  lockType = true,
  onSubmitSuccess,
}) => {
  const [eorType, setEorType] = useState(initialType || "Quality");
  const [project, setProject] = useState("");
  const [eorNo, setEorNo] = useState("");
  const [projectLocation, setProjectLocation] = useState("");
  const [dateOfIssue, setDateOfIssue] = useState(todayISO());
  const [issuedTo, setIssuedTo] = useState("");
  const [gridRoom, setGridRoom] = useState("");
  const [observationSubject, setObservationSubject] = useState("");

  const [observation, setObservation] = useState("");
  const [sorRows, setSorRows] = useState(
    SOR_DEFAULT_ROWS.map((label) => ({ id: uid(), label, file: null }))
  );

  const [correction, setCorrection] = useState("");
  const [correctiveAction, setCorrectiveAction] = useState("");
  const [correctionAttachments, setCorrectionAttachments] = useState([
    { id: uid(), type: "", file: null },
  ]);
  const [correctiveAttachments, setCorrectiveAttachments] = useState([
    { id: uid(), type: "", file: null },
  ]);

  const fileInputRefs = useRef({});

  useEffect(() => {
    setEorType(initialType || "Quality");
  }, [initialType]);

  const handleFixedFile = (rowId, setter) => (event) => {
    const file = event.target.files?.[0] || null;
    setter((rows) => rows.map((row) => (row.id === rowId ? { ...row, file } : row)));
  };

  const handleTypedFile = (rowId, setter) => (event) => {
    const file = event.target.files?.[0] || null;
    setter((rows) => rows.map((row) => (row.id === rowId ? { ...row, file } : row)));
  };

  const updateTypedType = (rowId, type, setter) => {
    setter((rows) => rows.map((row) => (row.id === rowId ? { ...row, type } : row)));
  };

  const addFixedRow = (setter) => {
    setter((rows) => [...rows, { id: uid(), label: "", file: null }]);
  };

  const removeFixedRow = (rowId, setter) => {
    setter((rows) => (rows.length > 1 ? rows.filter((row) => row.id !== rowId) : rows));
  };

  const addTypedRow = (setter) => {
    setter((rows) => [...rows, { id: uid(), type: "", file: null }]);
  };

  const removeTypedRow = (rowId, setter) => {
    setter((rows) => (rows.length > 1 ? rows.filter((row) => row.id !== rowId) : rows));
  };

  const handleReset = () => {
    setEorType(initialType || "Quality");
    setProject("");
    setEorNo("");
    setProjectLocation("");
    setDateOfIssue(todayISO());
    setIssuedTo("");
    setGridRoom("");
    setObservationSubject("");
    setObservation("");
    setSorRows(SOR_DEFAULT_ROWS.map((label) => ({ id: uid(), label, file: null })));
    setCorrection("");
    setCorrectiveAction("");
    setCorrectionAttachments([{ id: uid(), type: "", file: null }]);
    setCorrectiveAttachments([{ id: uid(), type: "", file: null }]);
    Object.values(fileInputRefs.current).forEach((element) => {
      if (element) element.value = "";
    });
    toast.success("Form reset");
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!eorType || !project || !eorNo.trim() || !observationSubject.trim()) {
      toast.error("Please fill SOR Type, Project, SOR No. and Observation Subject.");
      return;
    }

    const payload = {
      eorType,
      project,
      eorNo,
      projectLocation,
      dateOfIssue,
      issuedTo,
      gridRoom,
      observationSubject,
      observation,
      sorAttachments: sorRows.map((row) => ({
        label: row.label,
        file: row.file?.name || null,
      })),
      correction,
      correctiveAction,
      correctionAttachments: correctionAttachments.map((row) => ({
        type: row.type,
        file: row.file?.name || null,
      })),
      correctiveAttachments: correctiveAttachments.map((row) => ({
        type: row.type,
        file: row.file?.name || null,
      })),
    };

    const finalPayload = {
      id: `sor-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      status: "Open",
      createdAt: new Date().toISOString(),
      ...payload,
    };

    console.log("SOR Submitted:", finalPayload);
    toast.success("External Observation Report submitted");
    onSubmitSuccess?.(finalPayload);

  };


  const renderFileCell = (rowId, file, onChange) => (
    <div className="flex items-center gap-3">
      <label
        htmlFor={`file-${rowId}`}
        className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border border-border bg-background px-3 text-sm text-foreground transition hover:bg-content-bg"
      >
        <Upload className="h-4 w-4" />
        Choose file
      </label>
      <input
        ref={(element) => {
          fileInputRefs.current[rowId] = element;
        }}
        id={`file-${rowId}`}
        type="file"
        className="hidden"
        onChange={onChange}
      />
      <span className="max-w-[180px] truncate text-xs text-muted-foreground">
        {file?.name || "No file selected"}
      </span>
    </div>
  );

  const renderFixedAttachmentTable = (title, rows, setter, editableLabels) => (
    <div className="space-y-2">
      <div className="text-sm font-medium text-foreground">{title}</div>
      <div className="overflow-hidden rounded-md border border-border">
        <div className="grid grid-cols-12 bg-content-bg px-4 py-2.5 text-xs font-semibold text-foreground">
          <div className="col-span-1">Sr. No.</div>
          <div className="col-span-7">Attachment</div>
          <div className="col-span-3">Upload</div>
          <div className="col-span-1 text-right">Action</div>
        </div>
        {rows.map((row, index) => (
          <div
            key={row.id}
            className="grid grid-cols-12 items-center border-t border-border px-4 py-3 text-sm"
          >
            <div className="col-span-1 text-muted-foreground">{index + 1}</div>
            <div className="col-span-7 pr-4">
              {editableLabels ? (
                <input
                  className={inputCls}
                  value={row.label}
                  placeholder="Attachment description"
                  onChange={(e) =>
                    setter((currentRows) =>
                      currentRows.map((currentRow) =>
                        currentRow.id === row.id ? { ...currentRow, label: e.target.value } : currentRow
                      )
                    )
                  }
                />
              ) : (
                <span className="text-foreground">{row.label}</span>
              )}
            </div>
            <div className="col-span-3">{renderFileCell(row.id, row.file, handleFixedFile(row.id, setter))}</div>
            <div className="col-span-1 flex justify-end">
              <button
                type="button"
                onClick={() => removeFixedRow(row.id, setter)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition hover:bg-content-bg hover:text-red-600"
                aria-label="Remove row"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
        <div className="border-t border-border bg-content-bg/60 px-4 py-2.5">
          <button
            type="button"
            onClick={() => addFixedRow(setter)}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            <Plus className="h-4 w-4" /> Add row
          </button>
        </div>
      </div>
    </div>
  );

  const renderTypedAttachmentTable = (title, rows, setter, options) => (
    <div className="space-y-2">
      <div className="text-sm font-medium text-foreground">{title}</div>
      <div className="overflow-hidden rounded-md border border-border">
        <div className="grid grid-cols-12 bg-content-bg px-4 py-2.5 text-xs font-semibold text-foreground">
          <div className="col-span-1">Sr. No.</div>
          <div className="col-span-7">Attachment</div>
          <div className="col-span-3">Upload</div>
          <div className="col-span-1 text-right">Action</div>
        </div>
        {rows.map((row, index) => (
          <div
            key={row.id}
            className="grid grid-cols-12 items-center border-t border-border px-4 py-3 text-sm"
          >
            <div className="col-span-1 text-muted-foreground">{index + 1}</div>
            <div className="col-span-7 pr-4">
              <div className="relative max-w-md">
                <select
                  className={selectCls}
                  value={row.type}
                  onChange={(e) => updateTypedType(row.id, e.target.value, setter)}
                >
                  <option value="">Select attachment type</option>
                  {options.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <Caret />
              </div>
            </div>
            <div className="col-span-3">{renderFileCell(row.id, row.file, handleTypedFile(row.id, setter))}</div>
            <div className="col-span-1 flex justify-end">
              <button
                type="button"
                onClick={() => removeTypedRow(row.id, setter)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition hover:bg-content-bg hover:text-red-600"
                aria-label="Remove row"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
        <div className="border-t border-border bg-content-bg/60 px-4 py-2.5">
          <button
            type="button"
            onClick={() => addTypedRow(setter)}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            <Plus className="h-4 w-4" /> Add row
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            External Observation Report (SOR)
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Document and track external observations with project requirements and corrective actions.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          <section className={cardCls}>
            <h2 className={sectionTitleCls}>SOR Type</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className={labelCls}>SOR Type</label>
                <div className="relative">
                  <select
                    className={selectCls}
                    value={eorType}
                    onChange={(e) => setEorType(e.target.value)}
                    disabled={lockType}
                  >
                    <option value="">Select type</option>
                    {SOR_TYPE_OPTIONS.map((option) => (
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
                  <select className={selectCls} value={project} onChange={(e) => setProject(e.target.value)}>
                    <option value="">Select project</option>
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
                <label className={labelCls}>SOR No.</label>
                <input
                  className={inputCls}
                  placeholder="e.g. SOR-2025-001"
                  value={eorNo}
                  onChange={(e) => setEorNo(e.target.value)}
                />
              </div>
              <div>
                <label className={labelCls}>Project Location</label>
                <input
                  className={inputCls}
                  placeholder="Site / location"
                  value={projectLocation}
                  onChange={(e) => setProjectLocation(e.target.value)}
                />
              </div>
              <div>
                <label className={labelCls}>Date of Issue</label>
                <input
                  type="date"
                  className={inputCls}
                  value={dateOfIssue}
                  onChange={(e) => setDateOfIssue(e.target.value)}
                />
              </div>
              <div>
                <label className={labelCls}>Issued To (Company)</label>
                <input
                  className={inputCls}
                  placeholder="Company name"
                  value={issuedTo}
                  onChange={(e) => setIssuedTo(e.target.value)}
                />
              </div>
              <div>
                <label className={labelCls}>Grid / Room</label>
                <input
                  className={inputCls}
                  placeholder="e.g. Grid A4 / Room 12"
                  value={gridRoom}
                  onChange={(e) => setGridRoom(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className={labelCls}>Observation Subject</label>
              <textarea
                className={textareaCls}
                placeholder="Brief subject of the observation"
                value={observationSubject}
                onChange={(e) => setObservationSubject(e.target.value)}
              />
            </div>
          </section>

          <section className={cardCls}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className={sectionTitleCls}>Observation with Project Requirement</h2>
              <span className={helperCls}>(To be filled by issuer)</span>
            </div>
            <div>
              <label className={labelCls}>Observation</label>
              <textarea
                className={`${textareaCls} min-h-[150px]`}
                placeholder="Describe the observation against the project requirement"
                value={observation}
                onChange={(e) => setObservation(e.target.value)}
              />
            </div>
            {renderFixedAttachmentTable("SOR Attachments", sorRows, setSorRows, true)}
          </section>

          <section className={cardCls}>
            <h2 className={sectionTitleCls}>Correction &amp; Corrective Action</h2>
            <span className={helperCls}>(To be filled by Constructor)</span>

            <div className="space-y-2">
              <label className={labelCls}>
                Correction (Action taken to rectify / Repair the Non-Conformity)
              </label>
              <textarea
                className={`${textareaCls} min-h-[140px]`}
                placeholder="Describe the correction action taken"
                value={correction}
                onChange={(e) => setCorrection(e.target.value)}
              />
            </div>

            {renderTypedAttachmentTable(
              "Correction Attachments",
              correctionAttachments,
              setCorrectionAttachments,
              CORRECTION_ATTACHMENT_OPTIONS
            )}

            <div className="space-y-2 pt-2">
              <label className={labelCls}>
                Corrective Action (Action taken to avoid / Prevent recurrence of the Non-Conformity)
              </label>
              <textarea
                className={`${textareaCls} min-h-[140px]`}
                placeholder="Describe the corrective action to prevent recurrence"
                value={correctiveAction}
                onChange={(e) => setCorrectiveAction(e.target.value)}
              />
            </div>

            {renderTypedAttachmentTable(
              "Corrective Action Attachments",
              correctiveAttachments,
              setCorrectiveAttachments,
              CORRECTIVE_ATTACHMENT_OPTIONS
            )}
          </section>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground transition hover:bg-content-bg"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>
            <button
              type="submit"
              className="inline-flex h-10 items-center gap-2 rounded-md border border-primary bg-primary px-5 text-sm font-medium text-white shadow-sm transition hover:opacity-90"
            >
              <Save className="h-4 w-4" />
              Submit Report
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExternalSOR;
