import { useMemo, useRef, useState } from "react";
import {
  ClipboardList,
  Save,
  RotateCcw,
  Paperclip,
  XCircle,
  Search,
  Download,
} from "lucide-react";
import { formatInputDate } from "../../../utils/dateFormatter";

const DOCUMENT_TYPES = [
  "1. Plans, Procedures & Risk Submittals",
  "2. HSE Management & Governance",
  "3. Legal, Statutory, Insurance & Certificates",
  "4. Competency, Authorization & Medical",
  "5. Training, Communication & Displays",
  "6. Emergency, Medical & First Aid",
  "7. PPE Management",
  "8. Welfare, Hygiene & Site Facilities",
  "9. Work Controls & High-Risk Activities",
  "10. Plant, Equipment, Tools & Electrical",
  "11. Environment, Housekeeping & Waste",
  "12. Storage Yards & Hazardous Materials",
];

const PROJECTS = [
  "Project Alpha - Mumbai",
  "Project Beta - Bengaluru",
  "Project Gamma - Pune",
  "Project Delta - Hyderabad",
];

const today = () => formatInputDate(new Date());

export default function HSERequirements() {
  const [project, setProject] = useState("");
  const [pmc, setPmc] = useState("");
  const [preparedBy, setPreparedBy] = useState("");
  const [reviewDate, setReviewDate] = useState(today());
  const [search, setSearch] = useState("");

  const [docCompliance, setDocCompliance] = useState({
    documentType: "",
    checkingNo: "",
    requirementDeliverable: "",
    evaluationCriteria: "",
    requiredEvidence: "",
    requirementLevel: "",
    frequency: "",
    timeOfSubmission: "",
    evaluation: "",
    score: "",
    checkingEvidenceNo: "",
    responsiblePerson: "",
    remarks: "",
    targetClosureDate: "",
  });
  const [notice, setNotice] = useState(null);

  const showNotice = (type, message) => {
    setNotice({ type, message });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!project || !pmc || !preparedBy) {
      showNotice("error", "Please fill out all General Information fields");
      return;
    }
    const payload = {
      project,
      pmc,
      preparedBy,
      reviewDate,
      docCompliance,
    };
    console.log("HSE Requirements submission:", payload);
    showNotice("success", "HSE Requirements saved successfully");
  };

  const handleReset = () => {
    setDocCompliance({
      documentType: "",
      checkingNo: "",
      requirementDeliverable: "",
      evaluationCriteria: "",
      requiredEvidence: "",
      requirementLevel: "",
      frequency: "",
      timeOfSubmission: "",
      evaluation: "",
      score: "",
      checkingEvidenceNo: "",
      responsiblePerson: "",
      remarks: "",
      targetClosureDate: "",
    });
    setProject("");
    setPmc("");
    setPreparedBy("");
    setReviewDate(today());
    setSearch("");
    showNotice("info", "Form reset");
  };

  const matches = (text, sectionTitle) => {
    if (!search.trim()) return true;
    const query = search.toLowerCase();
    return (
      text.toLowerCase().includes(query) ||
      sectionTitle.toLowerCase().includes(query)
    );
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header Bar */}
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 text-orange-500">
            <ClipboardList size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">
              HSE Requirements & Deliverables
            </h1>
            <p className="text-sm text-slate-500">
              Track and manage Health, Safety & Environment compliance items
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {notice && (
          <div
            role="alert"
            className={`flex items-center justify-between gap-3 rounded-md border px-4 py-3 text-sm ${
              notice.type === "success"
                ? "border-green-200 bg-green-50 text-green-800"
                : notice.type === "error"
                  ? "border-red-200 bg-red-50 text-red-800"
                  : "border-slate-200 bg-white text-slate-700"
            }`}
          >
            <span>{notice.message}</span>
            <button
              type="button"
              onClick={() => setNotice(null)}
              className="text-current opacity-70 hover:opacity-100"
              aria-label="Dismiss notification"
            >
              <XCircle className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* General info */}
        <div className="bg-white rounded-md shadow-sm border border-slate-200 mb-5 overflow-hidden">
          <div className="border-b border-slate-200 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-500">
            General Information
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-5">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Project *
              </label>
              <select
                value={project}
                onChange={(e) => setProject(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select project</option>
                {PROJECTS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                PMC
              </label>
              <input
                value={pmc}
                onChange={(e) => setPmc(e.target.value)}
                placeholder="PMC name"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Prepared By
              </label>
              <input
                value={preparedBy}
                onChange={(e) => setPreparedBy(e.target.value)}
                placeholder="Name"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Review Date
              </label>
              <input
                type="date"
                value={reviewDate}
                onChange={(e) => setReviewDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Documentation & Compliance Section */}
        <div className="bg-white rounded-md shadow-sm border border-slate-200 mb-5 overflow-hidden">
          <div className="border-b border-slate-200 bg-orange-50 px-4 py-3">
            <div className="text-sm font-semibold text-orange-500">
              Documentation & Compliance
            </div>
          </div>

          <div className="p-5 flex flex-col gap-5">
            {/* First Row: 3 columns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Sub-section: Type of Document */}
              <div className="col-span-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Type of Document
                </label>
                <select
                  value={docCompliance.documentType}
                  onChange={(e) =>
                    setDocCompliance({
                      ...docCompliance,
                      documentType: e.target.value,
                    })
                  }
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                >
                  <option value="" disabled>
                    Select document type...
                  </option>
                  {DOCUMENT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sub-section: Checking No. */}
              <div className="col-span-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Checking No.
                </label>
                <input
                  type="text"
                  value={docCompliance.checkingNo}
                  onChange={(e) =>
                    setDocCompliance({
                      ...docCompliance,
                      checkingNo: e.target.value,
                    })
                  }
                  placeholder="Enter checking number..."
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              {/* Sub-section: Requirement / Deliverable */}
              <div className="col-span-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Requirement / Deliverable
                </label>
                <input
                  type="text"
                  value={docCompliance.requirementDeliverable}
                  onChange={(e) =>
                    setDocCompliance({
                      ...docCompliance,
                      requirementDeliverable: e.target.value,
                    })
                  }
                  placeholder="Enter requirement..."
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>
            </div>

            {/* Second Row: 2 columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Sub-section: Evaluation Criteria */}
              <div className="col-span-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Evaluation Criteria
                </label>
                <textarea
                  rows={1}
                  value={docCompliance.evaluationCriteria}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const start = e.target.selectionStart;
                      const val = docCompliance.evaluationCriteria;
                      const newVal =
                        val.slice(0, start) +
                        "\n• " +
                        val.slice(e.target.selectionEnd);
                      setDocCompliance({
                        ...docCompliance,
                        evaluationCriteria: newVal,
                      });
                      setTimeout(() => {
                        e.target.selectionStart = e.target.selectionEnd =
                          start + 3;
                        e.target.style.height = "auto";
                        e.target.style.height = `${e.target.scrollHeight}px`;
                      }, 0);
                    }
                  }}
                  onChange={(e) => {
                    let newVal = e.target.value;
                    if (
                      docCompliance.evaluationCriteria === "" &&
                      newVal.length > 0
                    ) {
                      newVal = "• " + newVal;
                    } else if (newVal === "•" || newVal === "• ") {
                      newVal = "";
                    }

                    setDocCompliance({
                      ...docCompliance,
                      evaluationCriteria: newVal,
                    });
                    e.target.style.height = "auto";
                    e.target.style.height = `${e.target.scrollHeight}px`;
                  }}
                  placeholder="Enter evaluation criteria points..."
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 resize-none overflow-hidden leading-relaxed"
                />
              </div>

              {/* Sub-section: Required Evidence / Record */}
              <div className="col-span-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Required Evidence / Record
                </label>
                <textarea
                  rows={1}
                  value={docCompliance.requiredEvidence}
                  onChange={(e) => {
                    setDocCompliance({
                      ...docCompliance,
                      requiredEvidence: e.target.value,
                    });
                    e.target.style.height = "auto";
                    e.target.style.height = `${e.target.scrollHeight}px`;
                  }}
                  placeholder="Enter required evidence..."
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 resize-none overflow-hidden leading-relaxed"
                />
              </div>
            </div>

            {/* Third Row: 3 columns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Sub-section: Requirement Level */}
              <div className="col-span-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Requirement Level
                </label>
                <input
                  type="text"
                  value={docCompliance.requirementLevel}
                  onChange={(e) =>
                    setDocCompliance({
                      ...docCompliance,
                      requirementLevel: e.target.value,
                    })
                  }
                  placeholder="Enter requirement level..."
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              {/* Sub-section: Frequency */}
              <div className="col-span-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Frequency
                </label>
                <input
                  type="text"
                  value={docCompliance.frequency}
                  onChange={(e) =>
                    setDocCompliance({
                      ...docCompliance,
                      frequency: e.target.value,
                    })
                  }
                  placeholder="Enter frequency..."
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              {/* Sub-section: Time of Submission / Checking */}
              <div className="col-span-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Time of Submission / Checking
                </label>
                <input
                  type="text"
                  value={docCompliance.timeOfSubmission}
                  onChange={(e) =>
                    setDocCompliance({
                      ...docCompliance,
                      timeOfSubmission: e.target.value,
                    })
                  }
                  placeholder="Enter time of submission..."
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>
            </div>

            {/* Fourth Row: 3 columns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Sub-section: Evaluation */}
              <div className="col-span-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Evaluation
                </label>
                <select
                  value={docCompliance.evaluation}
                  onChange={(e) => {
                    const val = e.target.value;
                    let newScore = "";
                    if (val === "Compliance") newScore = "1";
                    else if (val === "Partial Compliance") newScore = "0.5";
                    else if (val === "Non Compliance") newScore = "0";

                    setDocCompliance({
                      ...docCompliance,
                      evaluation: val,
                      score: newScore,
                    });
                  }}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                >
                  <option value="" disabled>
                    Select evaluation...
                  </option>
                  <option value="Compliance">Compliance</option>
                  <option value="Partial Compliance">Partial Compliance</option>
                  <option value="Non Compliance">Non Compliance</option>
                </select>
              </div>

              {/* Sub-section: Score */}
              <div className="col-span-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Score
                </label>
                <input
                  type="text"
                  value={docCompliance.score}
                  readOnly
                  placeholder="Auto-calculated..."
                  className="w-full rounded-md border border-slate-300 bg-slate-50 text-slate-500 px-3 py-2 text-sm focus:outline-none cursor-not-allowed"
                />
              </div>

              {/* Sub-section: Checking / Evidence No. */}
              <div className="col-span-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Checking / Evidence No.
                </label>
                <input
                  type="text"
                  value={docCompliance.checkingEvidenceNo}
                  onChange={(e) =>
                    setDocCompliance({
                      ...docCompliance,
                      checkingEvidenceNo: e.target.value,
                    })
                  }
                  placeholder="Enter checking/evidence number..."
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>
            </div>

            {/* Fifth Row: 3 columns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Sub-section: Responsible Person */}
              <div className="col-span-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Responsible Person
                </label>
                <input
                  type="text"
                  value={docCompliance.responsiblePerson}
                  onChange={(e) =>
                    setDocCompliance({
                      ...docCompliance,
                      responsiblePerson: e.target.value,
                    })
                  }
                  placeholder="Enter responsible person..."
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              {/* Sub-section: Remarks / Action Required */}
              <div className="col-span-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Remarks / Action Required
                </label>
                <textarea
                  rows={1}
                  value={docCompliance.remarks}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const start = e.target.selectionStart;
                      const val = docCompliance.remarks;
                      const newVal =
                        val.slice(0, start) +
                        "\n• " +
                        val.slice(e.target.selectionEnd);
                      setDocCompliance({ ...docCompliance, remarks: newVal });
                      setTimeout(() => {
                        e.target.selectionStart = e.target.selectionEnd =
                          start + 3;
                        e.target.style.height = "auto";
                        e.target.style.height = `${e.target.scrollHeight}px`;
                      }, 0);
                    }
                  }}
                  onChange={(e) => {
                    let newVal = e.target.value;
                    if (docCompliance.remarks === "" && newVal.length > 0) {
                      newVal = "• " + newVal;
                    } else if (newVal === "•" || newVal === "• ") {
                      newVal = "";
                    }
                    setDocCompliance({ ...docCompliance, remarks: newVal });
                    e.target.style.height = "auto";
                    e.target.style.height = `${e.target.scrollHeight}px`;
                  }}
                  placeholder="Enter remarks..."
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 resize-none overflow-hidden leading-relaxed"
                />
              </div>

              {/* Sub-section: Target Closure Date */}
              <div className="col-span-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Target Closure Date
                </label>
                <input
                  type="date"
                  value={docCompliance.targetClosureDate}
                  onChange={(e) =>
                    setDocCompliance({
                      ...docCompliance,
                      targetClosureDate: e.target.value,
                    })
                  }
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 text-slate-700"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pb-8">
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 px-5 py-2.5 text-sm font-medium text-slate-700"
          >
            <RotateCcw className="h-4 w-4" /> Reset
          </button>
          <button
            onClick={handleSubmit}
            className="inline-flex items-center gap-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 text-sm font-semibold shadow"
          >
            <Download className="h-4 w-4" /> Save Tracker
          </button>
        </div>
      </div>
    </div>
  );
}
