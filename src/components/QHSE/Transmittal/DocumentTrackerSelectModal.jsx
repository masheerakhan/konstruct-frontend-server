import { useMemo, useState } from "react";
import {
  ClipboardList,
  Search,
  X,
  CheckCircle2,
  Plus,
  Trash2,
} from "lucide-react";
import {
  DUMMY_ALL_DOCUMENT_TRACKER_ROWS,
  filterTrackerRowsByDocumentType,
  getTrackerDescription,
  getTrackerDocumentType,
} from "./trackerDocumentData";

// ─── Constants ────────────────────────────────────────────────────────────────

const DOCUMENT_TYPES = [
  "Project Quality Plan",
  "Organization Chart",
  "Material Submittal",
  "Work Method Statement",
  "Pre-Qualification Document",
  "Design Mix",
  "Test Report",
];

/**
 * Maps document types that require a conditional extra column.
 * key   → document type value
 * value → column header label
 */
const CONDITIONAL_COL = {
  "Material Submittal": "Brand",
  "Pre-Qualification Document": "Agency",
  "Design Mix": "Grade",
};

let _nextId = 1;
const newRowId = () => `new-${_nextId++}`;

const makeNewRow = () => ({
  id: newRowId(),
  docType: "",
  condValue: "",
  description: "",
});

// ─── Shared input styles ──────────────────────────────────────────────────────

const inputCls =
  "w-full rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-800 " +
  "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-gray-400";

const selectCls =
  "w-full rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-800 " +
  "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary";

// ─── Component ────────────────────────────────────────────────────────────────

export default function DocumentTrackerSelectModal({
  open,
  documentType,
  rows = DUMMY_ALL_DOCUMENT_TRACKER_ROWS,
  onClose,
  onSelect,
}) {
  const [searchText, setSearchText] = useState("");
  const [newRows, setNewRows] = useState([]); // user-added rows

  // ── Derive the active conditional column label across all new rows ──────
  // Only ONE conditional column can be active at a time — the first one found.
  // If different rows have different types, each row only shows its own field
  // but the header reflects the "dominant" active type.
  const activeCondLabel = useMemo(() => {
    for (const r of newRows) {
      if (CONDITIONAL_COL[r.docType]) return CONDITIONAL_COL[r.docType];
    }
    return null;
  }, [newRows]);

  // ── Filter existing (read-only) rows ────────────────────────────────────
  const filteredRows = useMemo(() => {
    const byType = filterTrackerRowsByDocumentType(rows, documentType);
    const q = searchText.trim().toLowerCase();
    if (!q) return byType;
    return byType.filter((row) => {
      const type = String(getTrackerDocumentType(row)).toLowerCase();
      const description = String(getTrackerDescription(row)).toLowerCase();
      return type.includes(q) || description.includes(q);
    });
  }, [rows, documentType, searchText]);

  // ── New-row helpers ──────────────────────────────────────────────────────
  const addRow = () => setNewRows((prev) => [...prev, makeNewRow()]);

  const removeRow = (id) =>
    setNewRows((prev) => prev.filter((r) => r.id !== id));

  const patchRow = (id, patch) =>
    setNewRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    );

  const handleTypeChange = (id, docType) => {
    // Reset condValue when type changes so stale data doesn't persist
    patchRow(id, { docType, condValue: "" });
  };

  // ── Whether to show the conditional column at all ─────────────────────
  const showCondCol = activeCondLabel !== null;

  // ── Total column count (for colSpan on empty state) ──────────────────
  const totalCols = showCondCol ? 5 : 4;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 px-4">
      <div className="flex w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-primary">
              <ClipboardList className="h-3.5 w-3.5" />
              Select Document
            </div>
            <h2 className="mt-2 text-lg font-semibold text-gray-900">
              All Document Tracker List
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              Showing tracker documents for:{" "}
              <span className="font-semibold text-gray-700">
                {documentType || "Selected document type"}
              </span>
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ── Search bar ─────────────────────────────────────────── */}
        <div className="border-b border-gray-100 px-5 py-3">
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search description..."
              className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        {/* ── Table ──────────────────────────────────────────────── */}
        <div className="max-h-[420px] overflow-auto">
          <table className="w-full min-w-[700px] text-sm">
            <thead className="sticky top-0 z-10 bg-gray-50 text-left">
              <tr>
                <th className="w-16 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-600">
                  Sr. No.
                </th>
                <th className="w-52 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">
                  Document Type
                </th>

                {/* Conditional column header — only mounts when needed */}
                {showCondCol && (
                  <th className="w-36 bg-blue-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-blue-700">
                    {activeCondLabel}
                  </th>
                )}

                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">
                  Description of Submission
                </th>
                <th className="w-36 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-600">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {/* ── Existing read-only rows ─────────────────── */}
              {filteredRows.map((row, index) => (
                <tr
                  key={row.id || `${getTrackerDescription(row)}-${index}`}
                  className="border-t border-gray-100 hover:bg-orange-50/40"
                >
                  <td className="px-4 py-3 text-center text-gray-500">
                    {row.sr_no || row.srNo || index + 1}
                  </td>
                  <td className="px-4 py-3 text-gray-800">
                    {getTrackerDocumentType(row)}
                  </td>

                  {/* Conditional column cell — empty for read-only rows */}
                  {showCondCol && (
                    <td className="px-4 py-3 text-gray-400">—</td>
                  )}

                  <td className="px-4 py-3 text-gray-800">
                    {getTrackerDescription(row)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => onSelect?.(row)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Select
                    </button>
                  </td>
                </tr>
              ))}

              {/* ── User-added editable rows ────────────────── */}
              {newRows.map((row, index) => {
                const rowCondLabel = CONDITIONAL_COL[row.docType] ?? null;
                const srNo = filteredRows.length + index + 1;

                return (
                  <tr
                    key={row.id}
                    className="border-t border-gray-100 bg-orange-50/30 hover:bg-orange-50/60"
                  >
                    <td className="px-4 py-2.5 text-center text-gray-500">
                      {srNo}
                    </td>

                    {/* Document type dropdown */}
                    <td className="px-3 py-2.5">
                      <select
                        value={row.docType}
                        onChange={(e) =>
                          handleTypeChange(row.id, e.target.value)
                        }
                        className={selectCls}
                        aria-label="Document type"
                      >
                        <option value="">— Select type —</option>
                        {DOCUMENT_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Conditional column cell */}
                    {showCondCol && (
                      <td className="px-3 py-2.5">
                        {rowCondLabel ? (
                          <input
                            type="text"
                            value={row.condValue}
                            onChange={(e) =>
                              patchRow(row.id, {
                                condValue: e.target.value,
                              })
                            }
                            placeholder={`${rowCondLabel}…`}
                            className={inputCls + " bg-blue-50/60"}
                            aria-label={rowCondLabel}
                          />
                        ) : (
                          // This row's type has no conditional col → show dash
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                    )}

                    {/* Description */}
                    <td className="px-3 py-2.5">
                      <input
                        type="text"
                        value={row.description}
                        onChange={(e) =>
                          patchRow(row.id, {
                            description: e.target.value,
                          })
                        }
                        placeholder="Description of submission…"
                        className={inputCls}
                        aria-label="Description of submission"
                      />
                    </td>

                    {/* Select + Remove */}
                    <td className="px-3 py-2.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            onSelect?.({
                              ...row,
                              // normalise so consumers can use the same
                              // getTrackerDocumentType / getTrackerDescription helpers
                              document_type: row.docType,
                              description: row.description,
                              [CONDITIONAL_COL[row.docType]?.toLowerCase() ??
                              "_cond"]: row.condValue,
                            })
                          }
                          className="inline-flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1.5 text-xs font-semibold text-white hover:opacity-90"
                          aria-label="Select row"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Select
                        </button>
                        <button
                          type="button"
                          onClick={() => removeRow(row.id)}
                          className="inline-flex items-center justify-center rounded-md p-1.5 text-red-500 hover:bg-red-50"
                          aria-label="Remove row"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {/* ── Empty state ─────────────────────────────── */}
              {filteredRows.length === 0 && newRows.length === 0 && (
                <tr>
                  <td colSpan={totalCols} className="px-4 py-14 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="rounded-full bg-orange-50 p-3 text-primary">
                        <ClipboardList className="h-6 w-6" />
                      </div>
                      <p className="text-sm font-semibold text-gray-900">
                        No documents found
                      </p>
                      <p className="text-xs text-gray-500">
                        No tracker rows are available for this document type.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ── Footer ─────────────────────────────────────────────── */}
        <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-5 py-3">
          {/* Add row button */}
          <button
            type="button"
            onClick={addRow}
            className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-orange-50 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-orange-100/70 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Row
          </button>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
