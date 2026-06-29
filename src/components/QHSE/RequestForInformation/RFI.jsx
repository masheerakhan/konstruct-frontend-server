import { useRef, useState } from "react";
import { FileCheck2, Plus, Upload, X } from "lucide-react";
import { formatInputDate } from "../../../utils/dateFormatter";

const DISCIPLINES = [
  "Structural",
  "Architectural",
  "Infra",
  "Landscape",
  "PEB",
  "Mechanical",
  "Electrical",
  "Plumbing",
];

const PROJECTS = [
  "Project Alpha",
  "Project Beta",
  "Project Gamma",
  "Project Delta",
];

const PREDEFINED_ATTACHMENTS = [
  "Specification",
  "Contract Quality Plan",
  "IS Code / International Std.",
  "BOQ",
  "Contract HSE Plan",
  "GFC / Shop Drawing",
  "Legal Requirement",
];

const uid = () => Math.random().toString(36).slice(2, 9);

const buildInitialRows = () =>
  PREDEFINED_ATTACHMENTS.map((name) => ({
    id: uid(),
    name,
    fileName: "",
    predefined: true,
  }));

const formatDate = (date) => formatInputDate(date);

const SectionHeader = ({ title }) => (
  <div className="border-b border-border px-5 py-4">
    <h2 className="text-lg font-semibold text-foreground">{title}</h2>
  </div>
);

export default function RFI() {
  const [discipline, setDiscipline] = useState("");
  const [project, setProject] = useState("");
  const [referenceNo, setReferenceNo] = useState("");
  const [specReference, setSpecReference] = useState("");
  const [drawingRef, setDrawingRef] = useState("");
  const [projectLocation, setProjectLocation] = useState("");
  const [date, setDate] = useState(formatDate(new Date()));
  const [rfiSubject, setRfiSubject] = useState("");
  const [description, setDescription] = useState("");
  const [engineerResponse, setEngineerResponse] = useState("");
  const [requesterRows, setRequesterRows] = useState(buildInitialRows);
  const [responseRows, setResponseRows] = useState(buildInitialRows);

  const requesterFileInputs = useRef({});
  const responseFileInputs = useRef({});

  const sectionClass =
    "overflow-hidden rounded-md border border-border bg-card shadow-sm";
  const inputClass =
    "w-full rounded border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30";
  const textareaClass =
    "w-full rounded border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30";
  const tableHeaderClass =
    "border border-border bg-gray-100 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground";
  const tableCellClass = "border border-border px-3 py-2 align-middle";
  const actionButtonClass =
    "inline-flex items-center justify-center rounded border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/30";
  const iconButtonClass =
    "inline-flex h-8 w-8 items-center justify-center rounded border border-red-200 bg-red-50 text-red-600 transition-colors hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-300";

  const handleFile = (setter, id, file) => {
    if (!file) return;
    setter((rows) =>
      rows.map((row) =>
        row.id === id ? { ...row, fileName: file.name } : row,
      ),
    );
  };

  const addRow = (setter) => {
    setter((rows) => [
      ...rows,
      { id: uid(), name: "", fileName: "", predefined: false },
    ]);
  };

  const removeRow = (setter, fileInputRef, id) => {
    setter((rows) => rows.filter((row) => row.id !== id));
    delete fileInputRef.current[id];
  };

  const updateName = (setter, id, name) => {
    setter((rows) =>
      rows.map((row) => (row.id === id ? { ...row, name } : row)),
    );
  };

  const handleReset = () => {
    setDiscipline("");
    setProject("");
    setReferenceNo("");
    setSpecReference("");
    setDrawingRef("");
    setProjectLocation("");
    setDate(formatDate(new Date()));
    setRfiSubject("");
    setDescription("");
    setEngineerResponse("");
    setRequesterRows(buildInitialRows());
    setResponseRows(buildInitialRows());
    requesterFileInputs.current = {};
    responseFileInputs.current = {};
  };

  const renderAttachmentTable = (rows, setter, fileInputRef, idPrefix) => (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className={`${tableHeaderClass} w-[80px]`}>Sr. No.</th>
              <th className={tableHeaderClass}>Attachment</th>
              <th className={`${tableHeaderClass} w-[260px]`}>Document</th>
              <th className={`${tableHeaderClass} w-[80px]`}>Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const uploaded = Boolean(row.fileName);

              return (
                <tr key={row.id}>
                  <td
                    className={`${tableCellClass} font-medium text-foreground`}
                  >
                    {index + 1}
                  </td>
                  <td className={tableCellClass}>
                    {row.predefined ? (
                      <span className="text-sm text-foreground">
                        {row.name}
                      </span>
                    ) : (
                      <input
                        type="text"
                        placeholder="Attachment name"
                        value={row.name}
                        onChange={(e) =>
                          updateName(setter, row.id, e.target.value)
                        }
                        className={inputClass}
                      />
                    )}
                  </td>
                  <td className={tableCellClass}>
                    <input
                      ref={(element) => {
                        fileInputRef.current[row.id] = element;
                      }}
                      id={`${idPrefix}-${row.id}`}
                      type="file"
                      className="hidden"
                      onChange={(e) =>
                        handleFile(setter, row.id, e.target.files?.[0])
                      }
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current[row.id]?.click()}
                      className={`inline-flex w-full items-center justify-start rounded border px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 ${
                        uploaded
                          ? "border-primary bg-primary text-white hover:opacity-90 focus:ring-primary/30"
                          : "border-border bg-background text-foreground hover:bg-gray-50 focus:ring-primary/30"
                      }`}
                    >
                      {uploaded ? (
                        <FileCheck2 className="mr-2 h-4 w-4 shrink-0" />
                      ) : (
                        <Upload className="mr-2 h-4 w-4 shrink-0" />
                      )}
                      <span className="truncate">
                        {row.fileName || "Upload"}
                      </span>
                    </button>
                  </td>
                  <td className={tableCellClass}>
                    {!row.predefined && (
                      <button
                        type="button"
                        onClick={() => removeRow(setter, fileInputRef, row.id)}
                        className={iconButtonClass}
                        aria-label={`Remove attachment row ${index + 1}`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div>
        <button
          type="button"
          onClick={() => addRow(setter)}
          className={actionButtonClass}
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Additional Attachment
        </button>
      </div>
    </div>
  );

  return (
    <main className="min-h-screen bg-content-bg px-4 py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Request for Information
          </h1>
          <p className="text-sm text-muted-foreground">
            Submit a formal request for information related to project
            execution.
          </p>
        </header>

        <div className={sectionClass}>
          <SectionHeader title="RFI Details" />
          <div className="space-y-4 p-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  Discipline
                </label>
                <select
                  value={discipline}
                  onChange={(e) => setDiscipline(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Select discipline</option>
                  {DISCIPLINES.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  Project
                </label>
                <select
                  value={project}
                  onChange={(e) => setProject(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Select project</option>
                  {PROJECTS.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  Reference No.
                </label>
                <input
                  type="text"
                  placeholder="e.g. RFI-001"
                  value={referenceNo}
                  onChange={(e) => setReferenceNo(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  Specification Reference
                </label>
                <input
                  type="text"
                  placeholder="Specification ref."
                  value={specReference}
                  onChange={(e) => setSpecReference(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  Drawing Ref.
                </label>
                <input
                  type="text"
                  placeholder="Drawing reference"
                  value={drawingRef}
                  onChange={(e) => setDrawingRef(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  Project Location
                </label>
                <input
                  type="text"
                  placeholder="Location"
                  value={projectLocation}
                  onChange={(e) => setProjectLocation(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                RFI Subject
              </label>
              <textarea
                placeholder="Subject of this RFI..."
                rows={4}
                value={rfiSubject}
                onChange={(e) => setRfiSubject(e.target.value)}
                className={`${textareaClass} min-h-[112px]`}
              />
            </div>
          </div>
        </div>

        <div className={sectionClass}>
          <SectionHeader title="Description of Request" />
          <div className="p-5">
            <textarea
              placeholder="Describe the request in detail..."
              rows={6}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`${textareaClass} min-h-[160px]`}
            />
          </div>
        </div>

        <div className={sectionClass}>
          <SectionHeader title="Attachments" />
          <div className="p-5">
            {renderAttachmentTable(
              requesterRows,
              setRequesterRows,
              requesterFileInputs,
              "req",
            )}
          </div>
        </div>

        <div className={sectionClass}>
          <SectionHeader title="To Be Filled by Client's Representative / PMC" />
          <div className="space-y-6 p-5">
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                Engineer's Response
              </label>
              <textarea
                placeholder="Engineer's response..."
                rows={6}
                value={engineerResponse}
                onChange={(e) => setEngineerResponse(e.target.value)}
                className={`${textareaClass} min-h-[160px]`}
              />
            </div>

            {renderAttachmentTable(
              responseRows,
              setResponseRows,
              responseFileInputs,
              "resp",
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={handleReset}
            className={actionButtonClass}
          >
            Reset
          </button>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded border border-primary bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            Submit RFI
          </button>
        </div>
      </div>
    </main>
  );
}
