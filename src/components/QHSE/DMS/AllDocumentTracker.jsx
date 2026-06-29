import { useEffect, useMemo, useState } from "react";
import {
  ClipboardList,
  FileText,
  FolderOpen,
  Filter,
  Plus,
  X,
} from "lucide-react";
import { formatDisplayDate } from "../../../utils/dateFormatter";

// const SAMPLE_TRACKER_ROWS = [
//   {
//     id: "sample-tracker-1",
//     document_type: "Prerequisite",
//     description: "All Document Submission Tracker",
//     planned_submission_date: "2025-03-01",
//     pdf_submission_date: "2025-03-03",
//     draft_cleared_date: "2025-03-05",
//     joint_review_date: "2025-03-06",
//     hard_copy_submission_date: "2025-03-07",
//     status: "B",
//     released_date: "2025-03-07",
//     remarks: "-",
//   },
//   {
//     id: "sample-tracker-2",
//     document_type: "Prerequisite",
//     description: "Organization Chart",
//     planned_submission_date: "2025-03-07",
//     pdf_submission_date: "2025-03-10",
//     draft_cleared_date: "2025-03-12",
//     joint_review_date: "2025-03-13",
//     hard_copy_submission_date: "2025-03-14",
//     status: "B",
//     released_date: "2025-03-14",
//     remarks: "-",
//   },
//   {
//     id: "sample-tracker-3",
//     document_type: "Project Plan",
//     description: "Project Quality Plan",
//     planned_submission_date: "2025-03-15",
//     pdf_submission_date: "2025-03-15",
//     draft_cleared_date: "2025-03-17",
//     joint_review_date: "2025-03-17",
//     hard_copy_submission_date: "",
//     status: "B",
//     released_date: "2025-03-17",
//     remarks: "Cleared",
//   },
// ];

const STATUS_OPTIONS = [
  { value: "A", label: "A - Approved" },
  { value: "B", label: "B - Approved with comment" },
  { value: "C", label: "C - Rejected with comments" },
  { value: "D", label: "D - Rejected" },
];

const DOCUMENT_TYPE_OPTIONS = [
  "Project Quality Plan",
  "Organization Chart",
  "Material Submittal",
  "Work Method Statement",
  "Pre-Qualification Document",
  "Design Mix",
  "Test Report",
];

const CONDITIONAL_COLUMNS = [
  {
    documentType: "Material Submittal",
    key: "brand",
    label: "Brand",
    placeholder: "Enter brand",
    aliases: ["brand", "make", "manufacturer"],
  },
  {
    documentType: "Pre-Qualification Document",
    key: "agency",
    label: "Agency",
    placeholder: "Enter agency",
    aliases: ["agency", "vendor", "supplier"],
  },
  {
    documentType: "Design Mix",
    key: "grade",
    label: "Grade",
    placeholder: "Enter grade",
    aliases: ["grade", "concrete_grade", "concreteGrade"],
  },
];

function getConditionalValue(doc, column) {
  if (!doc || !column) return "";

  for (const key of column.aliases || [column.key]) {
    if (doc[key] !== null && doc[key] !== undefined && doc[key] !== "") {
      return doc[key];
    }
  }

  return "";
}

function getStatusLabel(value) {
  const code = String(value || "")
    .trim()
    .toUpperCase();
  const found = STATUS_OPTIONS.find((item) => item.value === code);
  return found?.label || code || "-";
}

function formatDate(value) {
  return formatDisplayDate(value);
}

function getDocumentTypeLabel(doc) {
  return (
    doc.document_type ||
    doc.documentType ||
    doc.type_of_document ||
    doc.typeOfDocument ||
    doc.doc_type ||
    doc.docType ||
    "Unspecified"
  );
}

function getDescription(doc) {
  return (
    doc.description ||
    doc.materialDescription ||
    doc.name ||
    "Document Submission"
  );
}

function createEmptyTrackerRow(documentTypeFilter = "all") {
  return {
    id: `manual-tracker-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    isManual: true,

    document_type: documentTypeFilter !== "all" ? documentTypeFilter : "",

    // Conditional fields
    brand: "",
    agency: "",
    grade: "",

    description: "",
    planned_submission_date: "",
    pdf_submission_date: "",
    draft_cleared_date: "",
    joint_review_date: "",
    status: "",
    released_date: "",
    remarks: "",
  };
}

export default function AllDocumentTracker({
  folderName = "All Document Tracker - Civil Works",
  documents = [],
}) {
  const [manualRows, setManualRows] = useState([]);
  const [documentTypeFilter, setDocumentTypeFilter] = useState("all");

  const actualRows = Array.isArray(documents) ? documents : [];
  // const baseRows = actualRows.length > 0 ? actualRows : SAMPLE_TRACKER_ROWS;
  const sourceRows = useMemo(() => {
    return [...actualRows, ...manualRows];
  }, [actualRows, manualRows]);
  const isUsingSampleRows = actualRows.length === 0;

  const handleAddRow = () => {
    setManualRows((prev) => [
      ...prev,
      createEmptyTrackerRow(documentTypeFilter),
    ]);
  };

  const handleManualRowChange = (rowId, field, value) => {
    setManualRows((prev) =>
      prev.map((row) => (row.id === rowId ? { ...row, [field]: value } : row)),
    );
  };

  const handleManualDocumentTypeChange = (rowId, value) => {
    setManualRows((prev) =>
      prev.map((row) =>
        row.id === rowId
          ? {
              ...row,
              document_type: value,

              // Clear old conditional values when document type changes
              brand: "",
              agency: "",
              grade: "",
            }
          : row,
      ),
    );

    // Main fix:
    // If user is inside a filter and changes row document type,
    // switch filter to the newly selected document type so row/table does not disappear.
    setDocumentTypeFilter((prevFilter) => {
      if (prevFilter === "all") return prevFilter;
      return value || "all";
    });
  };

  const handleDeleteManualRow = (rowId) => {
    setManualRows((prev) => prev.filter((row) => row.id !== rowId));
  };

  const documentTypeOptions = useMemo(() => {
    const existingTypes = Array.from(
      new Set(
        sourceRows
          .map((doc) => String(getDocumentTypeLabel(doc)).trim())
          .filter(Boolean),
      ),
    );

    const orderedExistingTypes = DOCUMENT_TYPE_OPTIONS.filter((type) =>
      existingTypes.includes(type),
    );

    const legacyExistingTypes = existingTypes.filter(
      (type) => !DOCUMENT_TYPE_OPTIONS.includes(type) && type !== "Unspecified",
    );

    return ["all", ...orderedExistingTypes, ...legacyExistingTypes];
  }, [sourceRows]);

  const rows = useMemo(() => {
    if (documentTypeFilter === "all") return sourceRows;
    return sourceRows.filter(
      (doc) => String(getDocumentTypeLabel(doc)).trim() === documentTypeFilter,
    );
  }, [documentTypeFilter, sourceRows]);

  const visibleConditionalColumns = useMemo(() => {
    return CONDITIONAL_COLUMNS.filter((column) =>
      rows.some(
        (doc) =>
          String(getDocumentTypeLabel(doc)).trim() === column.documentType,
      ),
    );
  }, [rows]);

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-gray-200 bg-gradient-to-r from-orange-50 via-white to-amber-50 p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary shadow-sm ring-1 ring-orange-100">
              <ClipboardList className="h-3.5 w-3.5" />
              All Document Tracker
            </div>
            <h2 className="mt-3 text-xl font-semibold text-gray-900">
              {folderName}
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Track civil works document submissions and review milestones in
              one place.
            </p>
          </div>
          <div className="rounded-2xl border border-orange-100 bg-white px-4 py-3 text-right shadow-sm">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              Visible Rows
            </div>
            <div className="mt-1 text-2xl font-semibold text-gray-900">
              {rows.length}
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
            <FolderOpen className="h-4 w-4 text-primary" />
            <span>Document Submission Tracker</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <Filter className="h-3.5 w-3.5" />
              <span>Document Type</span>
            </label>
            <select
              value={documentTypeFilter}
              onChange={(e) => setDocumentTypeFilter(e.target.value)}
              className="h-9 min-w-[220px] rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {documentTypeOptions.map((option) => (
                <option key={option} value={option}>
                  {option === "all" ? "All document types" : option}
                </option>
              ))}
            </select>
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
            <div className="rounded-full bg-orange-50 p-3 text-primary">
              <FileText className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-gray-900">
              No tracker rows found
            </h3>
            <p className="mt-1 max-w-md text-sm text-gray-500">
              Try another document type filter or add documents to this folder
              to populate the tracker.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[2200px] w-full text-sm">
              <thead>
                <tr className="bg-gray-50/80 text-left ">
                  <th className="px-4 py-3 font-semibold text-gray-800">
                    Sl. No.
                  </th>
                  <th className="px-4 py-3 font-semibold text-gray-800">
                    Document Type
                  </th>
                  {visibleConditionalColumns.map((column) => (
                    <th
                      key={column.key}
                      className="px-4 py-3 font-semibold text-gray-800 min-w-[180px]"
                    >
                      {column.label}
                    </th>
                  ))}

                  <th className="px-4 py-3 font-semibold text-gray-800 min-w-[260px]">
                    Description of Submission
                  </th>
                  <th className="px-4 py-3 font-semibold text-gray-800">
                    Planned Submission Date
                  </th>
                  <th className="px-4 py-3 font-semibold text-gray-800">
                    Submission Date
                  </th>
                  <th className="px-4 py-3 font-semibold text-gray-800">
                    Approved by PMC
                  </th>
                  <th className="px-4 py-3 font-semibold text-gray-800">
                    Approved by HIP
                  </th>
                  {/* <th className="px-4 py-3 font-semibold text-gray-800">Hard Copy Submission</th> */}
                  <th className="px-4 py-3 font-semibold text-gray-800 text-center min-w-[240px]">
                    Status
                  </th>
                  <th className="px-4 py-3 font-semibold text-gray-800">
                    Status released (Date)
                  </th>
                  <th className="px-4 py-3 font-semibold text-gray-800 text-center min-w-[90px]">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((doc, index) => (
                  <tr
                    key={doc.id || `${getDescription(doc)}-${index}`}
                    className="border-t border-gray-100 hover:bg-orange-50/30 odd:bg-white even:bg-slate-50"
                  >
                    <td className="px-4 py-3 text-gray-700 text-center">
                      {index + 1}
                    </td>

                    <td className="px-4 py-3 text-gray-800">
                      {doc.isManual ? (
                        <select
                          value={doc.document_type}
                          onChange={(e) =>
                            handleManualDocumentTypeChange(
                              doc.id,
                              e.target.value,
                            )
                          }
                          className="w-full min-w-[220px] rounded-md border border-gray-200 bg-white px-2 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
                        >
                          <option value="">Select Document Type</option>

                          {DOCUMENT_TYPE_OPTIONS.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                      ) : (
                        getDocumentTypeLabel(doc)
                      )}
                    </td>

                    {visibleConditionalColumns.map((column) => {
                      const rowDocType = String(
                        getDocumentTypeLabel(doc),
                      ).trim();
                      const shouldShowInputForRow =
                        rowDocType === column.documentType;

                      return (
                        <td
                          key={column.key}
                          className="px-4 py-3 text-gray-800"
                        >
                          {shouldShowInputForRow ? (
                            doc.isManual ? (
                              <input
                                type="text"
                                value={doc[column.key] || ""}
                                onChange={(e) =>
                                  handleManualRowChange(
                                    doc.id,
                                    column.key,
                                    e.target.value,
                                  )
                                }
                                placeholder={column.placeholder}
                                className="w-full min-w-[160px] rounded-md border border-gray-200 px-2 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
                              />
                            ) : (
                              getConditionalValue(doc, column) || "-"
                            )
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                      );
                    })}

                    <td className="px-4 py-3 text-gray-800">
                      {doc.isManual ? (
                        <input
                          type="text"
                          value={doc.description}
                          onChange={(e) =>
                            handleManualRowChange(
                              doc.id,
                              "description",
                              e.target.value,
                            )
                          }
                          placeholder="Description"
                          className="w-full min-w-[240px] rounded-md border border-gray-200 px-2 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
                        />
                      ) : (
                        getDescription(doc)
                      )}
                    </td>

                    <td className="px-4 py-3 text-gray-700">
                      {doc.isManual ? (
                        <input
                          type="date"
                          value={doc.planned_submission_date}
                          onChange={(e) =>
                            handleManualRowChange(
                              doc.id,
                              "planned_submission_date",
                              e.target.value,
                            )
                          }
                          className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
                        />
                      ) : (
                        formatDate(
                          doc.planned_submission_date ||
                            doc.plannedSubmissionDate,
                        )
                      )}
                    </td>

                    <td className="px-4 py-3 text-gray-700">
                      {doc.isManual ? (
                        <input
                          type="date"
                          value={doc.pdf_submission_date}
                          onChange={(e) =>
                            handleManualRowChange(
                              doc.id,
                              "pdf_submission_date",
                              e.target.value,
                            )
                          }
                          className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
                        />
                      ) : (
                        formatDate(
                          doc.pdf_submission_date ||
                            doc.pdfSubmissionDate ||
                            doc.created_at,
                        )
                      )}
                    </td>

                    <td className="px-4 py-3 text-gray-700">
                      {doc.isManual ? (
                        <input
                          type="date"
                          value={doc.draft_cleared_date}
                          onChange={(e) =>
                            handleManualRowChange(
                              doc.id,
                              "draft_cleared_date",
                              e.target.value,
                            )
                          }
                          className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
                        />
                      ) : (
                        formatDate(
                          doc.draft_cleared_date || doc.draftClearedDate,
                        )
                      )}
                    </td>

                    <td className="px-4 py-3 text-gray-700">
                      {doc.isManual ? (
                        <input
                          type="date"
                          value={doc.joint_review_date}
                          onChange={(e) =>
                            handleManualRowChange(
                              doc.id,
                              "joint_review_date",
                              e.target.value,
                            )
                          }
                          className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
                        />
                      ) : (
                        formatDate(doc.joint_review_date || doc.jointReviewDate)
                      )}
                    </td>

                    <td className="px-4 py-3 text-center align-middle text-gray-700">
                      {doc.isManual ? (
                        <select
                          value={doc.status}
                          onChange={(e) =>
                            handleManualRowChange(
                              doc.id,
                              "status",
                              e.target.value,
                            )
                          }
                          className="mx-auto block h-9 w-[220px] rounded-md border border-gray-200 bg-white px-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
                        >
                          <option value="">Select Status</option>
                          {STATUS_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="inline-flex min-w-[32px] justify-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-gray-700">
                          {getStatusLabel(doc.status)}
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-gray-700">
                      {doc.isManual ? (
                        <input
                          type="date"
                          value={doc.released_date}
                          onChange={(e) =>
                            handleManualRowChange(
                              doc.id,
                              "released_date",
                              e.target.value,
                            )
                          }
                          className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
                        />
                      ) : (
                        formatDate(doc.released_date || doc.releasedDate)
                      )}
                    </td>

                    <td className="px-4 py-3 text-center align-middle">
                      {doc.isManual ? (
                        <button
                          type="button"
                          onClick={() => handleDeleteManualRow(doc.id)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                          title="Delete row"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex justify-start border-t border-gray-100 bg-white px-5 py-4">
          <button
            type="button"
            onClick={handleAddRow}
            className="inline-flex items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-semibold text-primary hover:bg-orange-100"
          >
            <Plus className="h-4 w-4" />
            Add Row
          </button>
        </div>

        {isUsingSampleRows && (
          <div className="border-t border-amber-100 bg-amber-50 px-5 py-3 text-xs text-amber-700">
            Sample preview data is showing for layout only. Real documents in
            this folder will replace these rows automatically.
          </div>
        )}
      </div>
    </div>
  );
}
