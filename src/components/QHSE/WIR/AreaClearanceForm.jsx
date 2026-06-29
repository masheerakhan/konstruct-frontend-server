import { useRef, useState } from "react";
import { FileCheck2, Plus, Upload, X } from "lucide-react";

const PREDEFINED_CLEARANCES = [
  "Mechanical Clearance",
  "Electrical Clearance",
  "Plumbing Clearance",
  "ELV",
  "Landscape",
  "Civil Clearance",
];

const PREDEFINED_DOCS = ["Marked Drawing", "Coordinated Drawing"];

const PROJECT_OPTIONS = [
  { value: "project-a", label: "Project A" },
  { value: "project-b", label: "Project B" },
  { value: "project-c", label: "Project C" },
];

const uid = () => Math.random().toString(36).slice(2, 10);

const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const SectionHeader = ({ title }) => (
  <div className="border-b border-border px-5 py-4">
    <h2 className="text-lg font-semibold text-foreground">{title}</h2>
  </div>
);

const AreaClearanceForm = () => {
  const [project, setProject] = useState("");
  const [date, setDate] = useState(formatDate(new Date()));
  const [activityDescription, setActivityDescription] = useState("");
  const [clearances, setClearances] = useState(
    PREDEFINED_CLEARANCES.map((description) => ({
      id: uid(),
      description,
      response: "",
      remark: "",
      predefined: true,
    }))
  );
  const [building, setBuilding] = useState("");
  const [location, setLocation] = useState("");
  const [gridline, setGridline] = useState("");
  const [proceedWith, setProceedWith] = useState("");
  const [authorityComments, setAuthorityComments] = useState("");
  const [docs, setDocs] = useState(
    PREDEFINED_DOCS.map((description) => ({
      id: uid(),
      description,
      fileName: "",
      predefined: true,
    }))
  );
  const [comments, setComments] = useState("");

  const fileInputs = useRef({});

  const sectionClass =
    "overflow-hidden rounded-md border border-border bg-card shadow-sm";
  const inputClass =
    "w-full rounded border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30";
  const selectClass =
    "w-full appearance-none rounded border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30";
  const textareaClass =
    "w-full min-h-[128px] rounded border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30";
  const tableHeaderClass =
    "border border-border bg-gray-100 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground";
  const tableCellClass = "border border-border px-3 py-2 align-top";
  const actionButtonClass =
    "inline-flex items-center justify-center rounded border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/30";
  const iconButtonClass =
    "inline-flex h-8 w-8 items-center justify-center rounded border border-red-200 bg-red-50 text-red-600 transition-colors hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-300";

  const updateClearance = (id, field, value) => {
    setClearances((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const addClearanceRow = () => {
    setClearances((prev) => [
      ...prev,
      { id: uid(), description: "", response: "", remark: "", predefined: false },
    ]);
  };

  const removeClearanceRow = (id) => {
    setClearances((prev) => prev.filter((row) => row.id !== id));
  };

  const updateDoc = (id, field, value) => {
    setDocs((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const addDocRow = () => {
    setDocs((prev) => [
      ...prev,
      { id: uid(), description: "", fileName: "", predefined: false },
    ]);
  };

  const removeDocRow = (id) => {
    setDocs((prev) => prev.filter((row) => row.id !== id));
    delete fileInputs.current[id];
  };

  const onFileChange = (id, event) => {
    const file = event.target.files && event.target.files[0];
    if (file) {
      updateDoc(id, "fileName", file.name);
    }
  };

  return (
    <div className="min-h-screen bg-content-bg px-4 py-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Area Clearance Form
          </h1>
          <p className="text-sm text-muted-foreground">
            Submit area clearance request for handover.
          </p>
        </div>

        <div className={sectionClass}>
          <SectionHeader title="Project Information" />
          <div className="space-y-4 p-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label
                  htmlFor="project"
                  className="mb-1 block text-sm font-medium text-foreground"
                >
                  Project
                </label>
                <select
                  id="project"
                  value={project}
                  onChange={(e) => setProject(e.target.value)}
                  className={selectClass}
                >
                  <option value="">Select project</option>
                  {PROJECT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="date"
                  className="mb-1 block text-sm font-medium text-foreground"
                >
                  Date
                </label>
                <input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="activity-desc"
                className="mb-1 block text-sm font-medium text-foreground"
              >
                Description of Activity to be Handed Over / Cleared
              </label>
              <textarea
                id="activity-desc"
                value={activityDescription}
                onChange={(e) => setActivityDescription(e.target.value)}
                placeholder="Describe the activity..."
                className={textareaClass}
              />
            </div>
          </div>
        </div>

        <div className={sectionClass}>
          <SectionHeader title="Clearance Checklist" />
          <div className="space-y-4 p-5">
            <div className="overflow-auto rounded-md border border-border">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className={`${tableHeaderClass} w-[80px]`}>Sr. No.</th>
                    <th className={tableHeaderClass}>Description</th>
                    <th className={`${tableHeaderClass} w-[160px]`}>Response</th>
                    <th className={tableHeaderClass}>Remark</th>
                    <th className={`${tableHeaderClass} w-[80px]`}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {clearances.map((row, index) => (
                    <tr key={row.id}>
                      <td className={`${tableCellClass} font-medium text-foreground`}>
                        {index + 1}
                      </td>
                      <td className={tableCellClass}>
                        {row.predefined ? (
                          <span className="text-sm text-foreground">
                            {row.description}
                          </span>
                        ) : (
                          <input
                            type="text"
                            value={row.description}
                            onChange={(e) =>
                              updateClearance(row.id, "description", e.target.value)
                            }
                            placeholder="Description"
                            className={inputClass}
                          />
                        )}
                      </td>
                      <td className={tableCellClass}>
                        <select
                          value={row.response}
                          onChange={(e) =>
                            updateClearance(row.id, "response", e.target.value)
                          }
                          className={selectClass}
                        >
                          <option value="">Select</option>
                          <option value="yes">Yes</option>
                          <option value="no">No</option>
                        </select>
                      </td>
                      <td className={tableCellClass}>
                        <textarea
                          value={row.remark}
                          onChange={(e) =>
                            updateClearance(row.id, "remark", e.target.value)
                          }
                          placeholder="Remark"
                          className="min-h-[72px] w-full rounded border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                      </td>
                      <td className={tableCellClass}>
                        {!row.predefined && (
                          <button
                            type="button"
                            onClick={() => removeClearanceRow(row.id)}
                            className={iconButtonClass}
                            aria-label={`Remove clearance row ${index + 1}`}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              type="button"
              onClick={addClearanceRow}
              className={actionButtonClass}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Add
            </button>

            <div className="grid grid-cols-1 gap-4 pt-2 md:grid-cols-3">
              <div>
                <label
                  htmlFor="building"
                  className="mb-1 block text-sm font-medium text-foreground"
                >
                  Building
                </label>
                <input
                  id="building"
                  type="text"
                  value={building}
                  onChange={(e) => setBuilding(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label
                  htmlFor="location"
                  className="mb-1 block text-sm font-medium text-foreground"
                >
                  Location / Area
                </label>
                <input
                  id="location"
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label
                  htmlFor="gridline"
                  className="mb-1 block text-sm font-medium text-foreground"
                >
                  Gridline
                </label>
                <input
                  id="gridline"
                  type="text"
                  value={gridline}
                  onChange={(e) => setGridline(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        </div>

        <div className={sectionClass}>
          <SectionHeader title="To Proceed With (Activity)" />
          <div className="p-5">
            <textarea
              value={proceedWith}
              onChange={(e) => setProceedWith(e.target.value)}
              placeholder="Describe the activity to proceed with..."
              className={textareaClass}
            />
          </div>
        </div>

        <div className={sectionClass}>
          <SectionHeader title="Releasing Authority Comments" />
          <div className="p-5">
            <textarea
              value={authorityComments}
              onChange={(e) => setAuthorityComments(e.target.value)}
              placeholder="Enter releasing authority comments..."
              className={textareaClass}
            />
          </div>
        </div>

        <div className={sectionClass}>
          <SectionHeader title="Additional Documentation" />
          <div className="space-y-4 p-5">
            <div className="overflow-auto rounded-md border border-border">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className={`${tableHeaderClass} w-[80px]`}>Sr. No.</th>
                    <th className={tableHeaderClass}>Documents</th>
                    <th className={`${tableHeaderClass} w-[260px]`}>Attachment</th>
                    <th className={`${tableHeaderClass} w-[80px]`}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {docs.map((row, index) => {
                    const uploaded = Boolean(row.fileName);

                    return (
                      <tr key={row.id}>
                        <td className={`${tableCellClass} font-medium text-foreground`}>
                          {index + 1}
                        </td>
                        <td className={tableCellClass}>
                          {row.predefined ? (
                            <span className="text-sm text-foreground">
                              {row.description}
                            </span>
                          ) : (
                            <input
                              type="text"
                              value={row.description}
                              onChange={(e) =>
                                updateDoc(row.id, "description", e.target.value)
                              }
                              placeholder="Document name"
                              className={inputClass}
                            />
                          )}
                        </td>
                        <td className={tableCellClass}>
                          <input
                            ref={(element) => {
                              fileInputs.current[row.id] = element;
                            }}
                            type="file"
                            className="hidden"
                            onChange={(e) => onFileChange(row.id, e)}
                          />
                          <button
                            type="button"
                            onClick={() => fileInputs.current[row.id]?.click()}
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
                              {uploaded ? "Uploaded" : "Upload file"}
                            </span>
                          </button>
                        </td>
                        <td className={tableCellClass}>
                          {!row.predefined && (
                            <button
                              type="button"
                              onClick={() => removeDocRow(row.id)}
                              className={iconButtonClass}
                              aria-label={`Remove document row ${index + 1}`}
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

            <button
              type="button"
              onClick={addDocRow}
              className={actionButtonClass}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Add
            </button>
          </div>
        </div>

        <div className={sectionClass}>
          <SectionHeader title="Comments" />
          <div className="p-5">
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Add any additional comments..."
              className={textareaClass}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pb-8">
          <button type="button" className={actionButtonClass}>
            Cancel
          </button>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded border border-primary bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};

export default AreaClearanceForm;
