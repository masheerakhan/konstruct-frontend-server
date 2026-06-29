import React, { useRef, useState } from "react";
import {
  UploadCloud,
  X,
  Trash2,
  Plus,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import toast from "react-hot-toast";
import FileUploadControl from "../../FileUploadControl";
import InductionPreview from "./InductionPreview";

const INDUCTION_DOCUMENTS = [
  { key: "attendanceSheet", label: "Attendance Sheet" },
  { key: "photo", label: "Photo" },
  { key: "medicalTestRecord", label: "Medical Test Record" },
  { key: "generalMedicalTest", label: "General Medical Test" },
  { key: "tradeSpecificMedicalTest", label: "Trade Specific Medical Test" },
  {
    key: "tradeSpecificSkillCertificate",
    label: "Trade Specific Skill Certificate",
  },
  { key: "idCardAadhar", label: "Id Card (Only Aadhar Card)" },
  { key: "employeeIdCard", label: "Employee ID Card" },
];

/* Inline Tailwind replacements for unavailable shared UI components. */
const Button = ({ type = "button", className = "", children, ...props }) => (
  <button
    type={type}
    className={`inline-flex h-10 items-center justify-center rounded-md bg-[#F48222] px-5 text-sm font-medium text-white transition hover:bg-[#d96a11] focus:outline-none focus:ring-2 focus:ring-[#F48222] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    {...props}
  >
    {children}
  </button>
);

const Input = ({ className = "", ...props }) => (
  <input
    className={`h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#F48222] focus:ring-2 focus:ring-[#F48222]/20 ${className}`}
    {...props}
  />
);

const Label = ({ className = "", children, ...props }) => (
  <label
    className={`text-sm font-medium text-slate-700 ${className}`}
    {...props}
  >
    {children}
  </label>
);

const Checkbox = ({ checked, onCheckedChange, className = "", ...props }) => (
  <input
    type="checkbox"
    checked={checked}
    onChange={(event) => onCheckedChange(event.target.checked)}
    className={`h-4 w-4 shrink-0 rounded border-slate-300 accent-[#F48222] ${className}`}
    {...props}
  />
);

const FormHeader = () => (
  <header className="border-b border-slate-200 bg-white">
    <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-[#F48222]">
          HSE Records
        </p>
        <p className="text-base font-semibold text-slate-800">
          Site HSE Induction
        </p>
      </div>
      <p className="hidden text-xs text-slate-500 sm:block">Attendance Sheet</p>
    </div>
  </header>
);

const SectionCard = ({ step, title, description, children }) => (
  <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
    <div className="border-b border-slate-200 bg-[#F48222] px-4 py-3 text-white sm:px-5">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-[#F48222]">
          {step}
        </span>
        <div>
          <h2 className="text-base font-semibold">{title}</h2>
          <p className="mt-0.5 text-xs text-orange-100">{description}</p>
        </div>
      </div>
    </div>
    <div className="p-4 sm:p-5">{children}</div>
  </section>
);

const DETAIL_FIELDS = [
  { id: "project", label: "Project", placeholder: "e.g. Project Alpha" },
  {
    id: "referenceNo",
    label: "Induction Reference No.",
    placeholder: "e.g. HSE-IND-0142",
  },
  { id: "date", label: "Date", type: "date" },
  { id: "duration", label: "Duration", placeholder: "e.g. 2 hours" },
  { id: "trainer", label: "Trainer", placeholder: "Full name" },
  {
    id: "departmentCovered",
    label: "Department Covered",
    placeholder: "e.g. Civil Works",
  },
  { id: "venue", label: "Venue", placeholder: "e.g. Site Office — Room 2" },
  {
    id: "lineSupervisor",
    label: "Name of the Line Supervisor",
    placeholder: "Full name",
  },
];

const TOPICS = [
  "HSE Policy",
  "General Housekeeping",
  "Use of Personal Protective Equipment (PPEs)",
  "Use and Inspection of Tool and Tackles",
  "HIRA",
  "General Site Safety Rules & Regulations",
  "Safe Access",
  "Emergency Response",
  "Fire Safety & fire fighting training",
  "Emergency Contact Numbers",
  "First Aid",
  "Safe Erection procedure of column & beam",
  "Fault/Complaint Reporting Procedure",
  "Hot Work",
  "Electrical Safety",
  "Site Welfare Facility",
  "Work At Height",
  "Excavation Safety",
  "Permit System",
  "Cold Work",
  "Safety Committee",
  "Working on Scaffolds",
  "No smoking policy",
  "Environmental Issues",
  "Hazard identification",
  "Manual material handling",
  "Working with Hazardous Chemicals",
  "Safety Violation & fine",
  "Vehicle Safety",
  "Incident, Accident Prevention & Reporting",
];

const Induction = () => {
  const [details, setDetails] = useState({});
  const [topics, setTopics] = useState([]);
  const [notice, setNotice] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const inputRef = useRef(null);

  const [documentRows, setDocumentRows] = useState([
    { id: 1, name: "", trade: "", empNo: "", isExpanded: false, documents: {} },
  ]);

  const addDocumentRow = () => {
    setDocumentRows((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: "",
        trade: "",
        empNo: "",
        isExpanded: false,
        documents: {},
      },
    ]);
  };

  const updateDocumentRow = (id, field, value) => {
    setDocumentRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row)),
    );
  };

  const removeDocumentRow = (id) => {
    setDocumentRows((prev) => prev.filter((row) => row.id !== id));
  };

  const showNotice = (type, title, description = "") => {
    setNotice({ type, title, description });
  };

  const updateDetail = (id, value) =>
    setDetails((d) => ({ ...d, [id]: value }));

  const toggleTopic = (topic, checked) =>
    setTopics((t) => (checked ? [...t, topic] : t.filter((x) => x !== topic)));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!details.project || !details.date) {
      toast.error("Project and Date are required.");
      showNotice(
        "error",
        "Please complete the required fields",
        "Project and Date are required.",
      );
      return;
    }

    if (documentRows.length === 0) {
      toast.error(
        "Please add at least one person to the upload documents section.",
      );
      return;
    }

    for (const [idx, row] of documentRows.entries()) {
      if (!row.name || !row.trade || !row.empNo) {
        toast.error(
          `Please fill in Name, Trade, and Emp No for SR No. ${idx + 1}.`,
        );
        return;
      }
      for (const doc of INDUCTION_DOCUMENTS) {
        if (!row.documents?.[doc.key] || row.documents[doc.key].length === 0) {
          toast.error(
            `Missing mandatory document: ${doc.label} for ${row.name || `SR No. ${idx + 1}`}.`,
          );
          updateDocumentRow(row.id, "isExpanded", true);
          return;
        }
      }
    }

    toast.success("Induction record submitted successfully!");
    showNotice(
      "success",
      "Induction record submitted",
      `${topics.length} topic(s) covered, ${documentRows.length} induction record(s) processed.`,
    );

    // Dynamic Integration: Save to localStorage for the Induction Register
    const newEntry = {
      project: details.project || "Unknown Project",
      reportNo:
        details.referenceNo || `IND-${Math.floor(Math.random() * 10000)}`,
      date: details.date,
      time: details.duration || "",
      description: topics.length > 0 ? topics.join(", ") : "No topics selected",
      location: details.venue || "",
      providedTo: details.departmentCovered || "Various",
      providedBy: details.trainer || "HSE Officer",
      attendees: documentRows.length.toString(),
      remarks: "Automatically synced from Induction Form",
    };

    const existingData = localStorage.getItem("SITE_HSE_INDUCTION_REGISTER");
    const parsedData = existingData ? JSON.parse(existingData) : [];

    // Add new entry and save to localStorage
    const updatedData = [...parsedData, newEntry];
    localStorage.setItem(
      "SITE_HSE_INDUCTION_REGISTER",
      JSON.stringify(updatedData),
    );

    // Optional: Reset form fields here if desired, but not strictly required
  };

  return (
    <div className="h-screen flex flex-col bg-slate-100 overflow-hidden">
      <style>{`
        .induction-file-upload {
          min-width: 0 !important;
        }
        .induction-file-upload > div {
          min-width: 0 !important;
        }
        .induction-file-upload div.inline-flex {
          display: flex !important;
          width: 100% !important;
          min-width: 0 !important;
        }
        .induction-file-upload span.truncate {
          flex: 1 1 0% !important;
          min-width: 0 !important;
        }
        .induction-file-upload button {
          flex-shrink: 0 !important;
        }
      `}</style>
      <FormHeader />

      <div className="flex-1 min-h-0 flex relative overflow-hidden">
        {/* Form area */}
        <div
          className="flex-1 bg-slate-50 h-full overflow-y-auto"
          style={{
            flex: showPreview ? "0 0 55%" : "0 0 100%",
            transition: "flex 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          <main className="mx-auto w-full px-4 py-6 sm:px-6 sm:py-10">
            <div className="mb-6 sm:mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-800">
                Attendance Sheet — Site HSE Induction
              </h1>
              <p className="mt-1.5 text-sm text-slate-500">
                Record induction details, topics covered, and attach the signed
                attendance sheet.
              </p>
            </div>

            {notice && (
              <div
                role="alert"
                className={`mb-6 flex items-start justify-between gap-3 rounded-md border px-4 py-3 text-sm ${
                  notice.type === "success"
                    ? "border-green-200 bg-green-50 text-green-800"
                    : "border-red-200 bg-red-50 text-red-800"
                }`}
              >
                <div>
                  <p className="font-medium">{notice.title}</p>
                  {notice.description && (
                    <p className="mt-0.5 text-xs">{notice.description}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setNotice(null)}
                  className="rounded p-0.5 opacity-70 hover:opacity-100"
                  aria-label="Dismiss notification"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6 pb-24 sm:pb-6">
              <SectionCard
                step={1}
                title="Induction Details"
                description="Provide the session and trainer information."
              >
                <div className="grid grid-cols-1 gap-x-5 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
                  {DETAIL_FIELDS.map((f) => (
                    <div key={f.id}>
                      <Label htmlFor={f.id} className="mb-1.5 block">
                        {f.label}
                        {(f.id === "project" || f.id === "date") && (
                          <span className="text-red-600"> *</span>
                        )}
                      </Label>
                      <Input
                        id={f.id}
                        type={"type" in f ? f.type : "text"}
                        placeholder={
                          "placeholder" in f ? f.placeholder : undefined
                        }
                        value={details[f.id] ?? ""}
                        onChange={(e) => updateDetail(f.id, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </SectionCard>

              <SectionCard
                step={2}
                title="Typical Topics Covered During HSE Induction"
                description="Select all topics that were covered during this induction."
              >
                <div
                  className="mb-4 flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50 p-3 cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={(e) => {
                    if (
                      e.target.tagName !== "INPUT" &&
                      e.target.tagName !== "LABEL"
                    ) {
                      const willBeChecked = topics.length !== TOPICS.length;
                      setTopics(willBeChecked ? [...TOPICS] : []);
                    }
                  }}
                >
                  <Checkbox
                    checked={
                      topics.length === TOPICS.length && TOPICS.length > 0
                    }
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setTopics([...TOPICS]);
                      } else {
                        setTopics([]);
                      }
                    }}
                    id="select-all-topics"
                  />
                  <Label
                    htmlFor="select-all-topics"
                    className="font-semibold text-slate-800 cursor-pointer"
                  >
                    Select All Topics
                  </Label>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {TOPICS.map((topic) => {
                    const checked = topics.includes(topic);
                    return (
                      <label
                        key={topic}
                        className="flex items-start gap-3 rounded-md border border-slate-200 p-3 cursor-pointer transition-colors hover:bg-slate-50 has-[:checked]:border-sky-700 has-[:checked]:bg-sky-50"
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(v) =>
                            toggleTopic(topic, v === true)
                          }
                          className="mt-0.5"
                        />
                        <span className="text-sm leading-snug text-slate-800">
                          {topic}
                        </span>
                      </label>
                    );
                  })}
                </div>
                <p className="mt-4 text-xs text-slate-500">
                  {topics.length} topic{topics.length === 1 ? "" : "s"} selected
                </p>
              </SectionCard>

              <SectionCard
                step={3}
                title="Upload Documents"
                description="Add individuals and attach their required induction documents."
              >
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="w-full text-left text-sm text-slate-700">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="px-4 py-3 font-semibold w-16 text-center border-b border-slate-200">
                          SR
                        </th>
                        <th className="px-4 py-3 font-semibold border-b border-slate-200 min-w-[200px]">
                          Name
                        </th>
                        <th className="px-4 py-3 font-semibold border-b border-slate-200 min-w-[150px]">
                          Trade
                        </th>
                        <th className="px-4 py-3 font-semibold border-b border-slate-200 min-w-[200px]">
                          Emp No/ Resident Card No
                        </th>
                        <th className="px-4 py-3 font-semibold w-16 text-center border-b border-slate-200">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {documentRows.map((row, idx) => (
                        <React.Fragment key={row.id}>
                          <tr>
                            <td className="px-4 py-4 align-top text-center font-medium text-slate-500">
                              {idx + 1}
                            </td>
                            <td className="px-4 py-4 align-top">
                              <Input
                                placeholder="Full Name"
                                value={row.name}
                                onChange={(e) =>
                                  updateDocumentRow(
                                    row.id,
                                    "name",
                                    e.target.value,
                                  )
                                }
                              />
                              <div className="mt-3">
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateDocumentRow(
                                      row.id,
                                      "isExpanded",
                                      !row.isExpanded,
                                    )
                                  }
                                  className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition-colors hover:bg-slate-50"
                                >
                                  <Plus
                                    className={`h-3.5 w-3.5 transition-transform ${row.isExpanded ? "rotate-45" : ""}`}
                                  />
                                  {row.isExpanded
                                    ? "Hide Documents"
                                    : "Upload Documents"}
                                </button>
                              </div>
                            </td>
                            <td className="px-4 py-4 align-top">
                              <Input
                                placeholder="Trade"
                                value={row.trade}
                                onChange={(e) =>
                                  updateDocumentRow(
                                    row.id,
                                    "trade",
                                    e.target.value,
                                  )
                                }
                              />
                            </td>
                            <td className="px-4 py-4 align-top">
                              <Input
                                placeholder="Emp / Resident Card No"
                                value={row.empNo}
                                onChange={(e) =>
                                  updateDocumentRow(
                                    row.id,
                                    "empNo",
                                    e.target.value,
                                  )
                                }
                              />
                            </td>
                            <td className="px-4 py-4 align-top text-center">
                              <button
                                type="button"
                                onClick={() => removeDocumentRow(row.id)}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                          {row.isExpanded && (
                            <tr className="bg-slate-50/50">
                              <td
                                colSpan={5}
                                className="px-4 py-4 border-b border-slate-200"
                              >
                                <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
                                  <h4 className="mb-4 text-sm font-semibold text-slate-800">
                                    Required Documents for{" "}
                                    {row.name || `SR No. ${idx + 1}`}
                                  </h4>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
                                    {INDUCTION_DOCUMENTS.map((doc) => (
                                      <div
                                        key={doc.key}
                                        className="min-w-0 rounded-md border border-slate-100 bg-slate-50 p-3"
                                      >
                                        <p className="mb-2 text-xs font-medium text-slate-700">
                                          {doc.label}{" "}
                                          <span className="text-red-500">
                                            *
                                          </span>
                                        </p>
                                        <FileUploadControl
                                          files={row.documents?.[doc.key] || []}
                                          multiple={false}
                                          onFilesChange={(files) => {
                                            updateDocumentRow(
                                              row.id,
                                              "documents",
                                              {
                                                ...row.documents,
                                                [doc.key]: files,
                                              },
                                            );
                                          }}
                                          className="induction-file-upload min-w-0"
                                        />
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                      {documentRows.length === 0 && (
                        <tr>
                          <td
                            colSpan={5}
                            className="p-8 text-center text-sm text-slate-500"
                          >
                            No induction records added yet. Click "Add Row"
                            below.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4">
                  <button
                    type="button"
                    onClick={addDocumentRow}
                    className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition-colors hover:bg-slate-50"
                  >
                    <Plus className="h-4 w-4" />
                    Add Row
                  </button>
                </div>
              </SectionCard>

              <div className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:static sm:inset-auto sm:flex sm:justify-end sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-none">
                <div className="mx-auto flex max-w-6xl items-center justify-end gap-2 sm:max-w-none">
                  <Button type="submit" className="min-w-[140px]">
                    Submit Record
                  </Button>
                </div>
              </div>
            </form>
          </main>
        </div>

        {/* Toggle button */}
        <button
          type="button"
          onClick={() => setShowPreview((v) => !v)}
          className="absolute z-30 top-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-14 rounded-l-lg bg-[#F48222] text-white shadow-lg hover:opacity-90 transition-all print:hidden"
          style={{
            right: showPreview ? "45%" : 0,
            transition: "right 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
          title={showPreview ? "Close Preview" : "Live Preview"}
        >
          {showPreview ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>

        {/* Preview panel */}
        <div
          className="h-full border-l border-gray-200 bg-white"
          style={{
            flex: showPreview ? "0 0 45%" : "0 0 0%",
            opacity: showPreview ? 1 : 0,
            overflow: "hidden",
            transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          {showPreview && (
            <InductionPreview
              formData={{ details, topics, documentRows }}
              variant="embedded"
              onClose={() => setShowPreview(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Induction;
