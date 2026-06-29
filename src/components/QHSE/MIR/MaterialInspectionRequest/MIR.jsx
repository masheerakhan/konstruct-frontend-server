import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, ArrowRight, X } from "lucide-react";
import { formatInputDate } from "../../../../utils/dateFormatter";
import FileUploadControl from "../../../FileUploadControl";

const emptyMaterial = () => ({
  description: "",
  specification: "",
  quantity: "",
  unit: "",
});

const PROJECTS = [
  "Project Alpha",
  "Project Beta",
  "Project Gamma",
  "Project Delta",
];

const TRADES = [
  "Civil",
  "Mechanical",
  "PEB",
  "Architectural",
  "Electrical",
  "Infra",
  "Landscape",
  "Plumbing",
  "Others",
];

const inputClass =
  "w-full rounded-md border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

const textareaClass =
  "w-full min-h-[56px] resize-y rounded-md border border-slate-300 bg-white px-2.5 py-2 text-sm leading-snug text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

const labelClass = "mb-1.5 block text-sm font-medium text-slate-600";

const thClass =
  "border border-slate-200 bg-slate-50 px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-600";

const tdClass = "border border-slate-200 align-top p-2";

const SectionCard = ({ number, title, children }) => (
  <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
    <header className="flex items-center gap-3 border-b border-slate-200 px-5 py-3.5">
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
        {number}
      </span>
      <h2 className="text-base font-semibold text-slate-800">{title}</h2>
    </header>
    <div className="p-5">{children}</div>
  </section>
);

const Index = () => {
  const navigate = useNavigate();

  const [notice, setNotice] = useState(null);

  // Section 1
  const [project, setProject] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState(() => formatInputDate(new Date()));

  // Section 2
  const [trade, setTrade] = useState("");
  const [otherTrade, setOtherTrade] = useState("");

  // Section 3
  const [materials, setMaterials] = useState([emptyMaterial()]);

  // Section 4
  const [masStatus, setMasStatus] = useState("");
  const [masRefNo, setMasRefNo] = useState("");
  const [specBoq, setSpecBoq] = useState("");

  // Section 5
  const [supplier, setSupplier] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [batchNo, setBatchNo] = useState("");

  // Section 6
  const [attachments, setAttachments] = useState([
    { label: "Invoice / DN No.", fileName: "" },
    { label: "MTC / 3rd Party", fileName: "" },
    { label: "Packing List", fileName: "" },
    { label: "Photos", fileName: "" },
    { label: "Checklist", file: null },
  ]);

  const showNotice = (type, title, message = "") => {
    setNotice({ type, title, message });
  };

  const updateMaterial = (index, field, value) => {
    setMaterials((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    );
  };

  const addMaterial = () => {
    setMaterials((prev) => [...prev, emptyMaterial()]);
  };

  const removeMaterial = (index) => {
    setMaterials((prev) =>
      prev.length === 1 ? prev : prev.filter((_, i) => i !== index),
    );
  };

  const setAttachmentFile = (index, file) => {
    setAttachments((prev) =>
      prev.map((row, i) =>
        i === index ? { ...row, file: file || null } : row,
      ),
    );
  };

  const handleProceedToChecklist = () => {
    if (!project) {
      showNotice("error", "Please select a project");
      return;
    }

    if (!trade) {
      showNotice("error", "Please select a trade");
      return;
    }

    if (trade === "Others" && !otherTrade.trim()) {
      showNotice("error", "Please specify other trade");
      return;
    }

    navigate("/mir/checklist", {
      state: {
        project,
        location,
        date,
        trade: trade === "Others" ? otherTrade.trim() : trade,
        attachments,
      },
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-700">
            QHSE Form
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl">
            Material Inspection Request
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Complete the material details below, then proceed to the inspection
            checklist.
          </p>
        </div>

        {notice && (
          <div
            role="alert"
            className={`mb-5 flex items-start justify-between gap-3 rounded-md border px-4 py-3 text-sm ${
              notice.type === "success"
                ? "border-green-200 bg-green-50 text-green-800"
                : "border-red-200 bg-red-50 text-red-800"
            }`}
          >
            <div>
              <p className="font-medium">{notice.title}</p>
              {notice.message && (
                <p className="mt-0.5 text-xs">{notice.message}</p>
              )}
            </div>

            <button
              type="button"
              onClick={() => setNotice(null)}
              className="rounded p-0.5 opacity-70 transition hover:opacity-100"
              aria-label="Close notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <form className="space-y-6">
          {/* Section 1 — Project Details */}
          <SectionCard number={1} title="Project Details">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className={labelClass}>Project</label>
                <select
                  value={project}
                  onChange={(event) => setProject(event.target.value)}
                  className={inputClass}
                >
                  <option value="">Select project</option>
                  {PROJECTS.map((projectName) => (
                    <option key={projectName} value={projectName}>
                      {projectName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  placeholder="e.g. Site A — Block B"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          </SectionCard>

          {/* Section 2 — Trade */}
          <SectionCard number={2} title="Trade">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Trade</label>
                <select
                  value={trade}
                  onChange={(event) => setTrade(event.target.value)}
                  className={inputClass}
                >
                  <option value="">Select trade</option>
                  {TRADES.map((tradeName) => (
                    <option key={tradeName} value={tradeName}>
                      {tradeName}
                    </option>
                  ))}
                </select>
              </div>

              {trade === "Others" && (
                <div>
                  <label className={labelClass}>Specify Other Trade</label>
                  <input
                    type="text"
                    value={otherTrade}
                    onChange={(event) => setOtherTrade(event.target.value)}
                    placeholder="Enter trade name"
                    className={inputClass}
                  />
                </div>
              )}
            </div>
          </SectionCard>

          {/* Section 3 — Material Details */}
          <SectionCard number={3} title="Material Details">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse">
                <thead>
                  <tr>
                    <th className={`${thClass} w-16`}>SI No.</th>
                    <th className={thClass}>Material Description</th>
                    <th className={thClass}>Specification</th>
                    <th className={`${thClass} w-28`}>Quantity</th>
                    <th className={`${thClass} w-24`}>Unit</th>
                    <th className={`${thClass} w-14`}></th>
                  </tr>
                </thead>

                <tbody>
                  {materials.map((row, index) => (
                    <tr key={index}>
                      <td
                        className={`${tdClass} text-center text-sm text-slate-600`}
                      >
                        {index + 1}
                      </td>

                      <td className={tdClass}>
                        <textarea
                          value={row.description}
                          onChange={(event) =>
                            updateMaterial(
                              index,
                              "description",
                              event.target.value,
                            )
                          }
                          placeholder="Describe material"
                          className={textareaClass}
                        />
                      </td>

                      <td className={tdClass}>
                        <textarea
                          value={row.specification}
                          onChange={(event) =>
                            updateMaterial(
                              index,
                              "specification",
                              event.target.value,
                            )
                          }
                          placeholder="Specification"
                          className={textareaClass}
                        />
                      </td>

                      <td className={tdClass}>
                        <input
                          type="text"
                          value={row.quantity}
                          onChange={(event) =>
                            updateMaterial(
                              index,
                              "quantity",
                              event.target.value,
                            )
                          }
                          placeholder="Qty"
                          className={inputClass}
                        />
                      </td>

                      <td className={tdClass}>
                        <input
                          type="text"
                          value={row.unit}
                          onChange={(event) =>
                            updateMaterial(index, "unit", event.target.value)
                          }
                          placeholder="Unit"
                          className={inputClass}
                        />
                      </td>

                      <td className={`${tdClass} text-center`}>
                        <button
                          type="button"
                          onClick={() => removeMaterial(index)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600"
                          aria-label="Remove row"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              type="button"
              onClick={addMaterial}
              className="mt-4 inline-flex items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100"
            >
              <Plus className="h-4 w-4" />
              Add Row
            </button>
          </SectionCard>

          {/* Section 4 — MAS Approval */}
          <SectionCard number={4} title="MAS Approval">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className={labelClass}>MAS Approved Status</label>
                <select
                  value={masStatus}
                  onChange={(event) => setMasStatus(event.target.value)}
                  className={inputClass}
                >
                  <option value="">Select status</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>MAS Ref. No.</label>
                <input
                  type="text"
                  value={masRefNo}
                  onChange={(event) => setMasRefNo(event.target.value)}
                  placeholder="e.g. MAS-2025-001"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Specification / BOQ</label>
                <input
                  type="text"
                  value={specBoq}
                  onChange={(event) => setSpecBoq(event.target.value)}
                  placeholder="e.g. BOQ Item 4.2"
                  className={inputClass}
                />
              </div>
            </div>
          </SectionCard>

          {/* Section 5 — Supplier & Manufacturer */}
          <SectionCard number={5} title="Supplier & Manufacturer">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Supplier</label>
                <input
                  type="text"
                  value={supplier}
                  onChange={(event) => setSupplier(event.target.value)}
                  placeholder="Supplier name"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Manufacturer</label>
                <input
                  type="text"
                  value={manufacturer}
                  onChange={(event) => setManufacturer(event.target.value)}
                  placeholder="Manufacturer name"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="mt-4">
              <label className={labelClass}>Batch No. / Heat No.</label>
              <textarea
                value={batchNo}
                onChange={(event) => setBatchNo(event.target.value)}
                placeholder="Enter batch / heat numbers"
                className={`${textareaClass} min-h-[100px]`}
              />
            </div>
          </SectionCard>

          {/* Section 6 — Attachments */}
          <SectionCard number={6} title="Attachments">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] border-collapse">
                <thead>
                  <tr>
                    <th className={`${thClass} w-16`}>SI No.</th>
                    <th className={thClass}>Attachment</th>
                    <th className={thClass}>Document</th>
                  </tr>
                </thead>

                <tbody>
                  {attachments.map((row, index) => (
                    <tr key={index}>
                      <td
                        className={`${tdClass} text-center text-sm text-slate-600`}
                      >
                        {index + 1}
                      </td>

                      <td className={`${tdClass} text-sm text-slate-700`}>
                        {row.label}
                      </td>

                      <td className={tdClass}>
                        {row.label === "Checklist" ? (
                          <button
                            type="button"
                            onClick={handleProceedToChecklist}
                            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                          >
                            Proceed to Checklist
                            <ArrowRight className="h-4 w-4" />
                          </button>
                        ) : (
                          <FileUploadControl
                            files={row.file ? [row.file] : []}
                            multiple={false}
                            append={false}
                            align="start"
                            showFileName
                            compact
                            uploadLabel="Upload"
                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                            onFilesChange={(nextFiles) =>
                              setAttachmentFile(
                                index,
                                Array.isArray(nextFiles)
                                  ? nextFiles[0] || null
                                  : nextFiles || null,
                              )
                            }
                            onDelete={() => setAttachmentFile(index, null)}
                          />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </form>
      </main>
    </div>
  );
};

export default Index;
