import { useRef } from "react";
import { FileCheck, Plus, Trash2, Upload } from "lucide-react";
import { capitalCase } from "../../stringCase";
import {
  PQD_CHECKLIST_DEFINITIONS,
  PQD_ROW_STATUS_OPTIONS,
  createPqdAdditionalRow,
  getPqdChecklistTypeLabel,
  getPqdRowFiles,
} from "../../pqdChecklists";

const fieldInputCls =
  "w-full h-9 text-xs rounded-md border border-gray-200 bg-white px-2 py-1 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary";

/**
 * @param {{
 *   checklistType: string,
 *   rows: Array<Record<string, unknown>>,
 *   onRowsChange?: (next: unknown[] | ((prev: unknown[]) => unknown[])) => void,
 * }} props
 */
export default function PQD({ checklistType, rows = [], onRowsChange }) {
  const fileInputRefs = useRef({});

  if (!checklistType) {
    return (
      <p className="text-[11px] text-gray-500">
        {capitalCase("select a pre qualification checklist type to load requirements")}
      </p>
    );
  }

  const def = PQD_CHECKLIST_DEFINITIONS[checklistType];
  const typeLabel = getPqdChecklistTypeLabel(checklistType);

  const setRows = (next) => {
    onRowsChange?.(next);
  };

  const patchRow = (id, patch) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const handleFiles = (rowId, picked) => {
    const list = Array.from(picked || []).filter((f) => f instanceof File);
    patchRow(rowId, { files: list.length ? list : [] });
  };

  const addAdditionalDocument = () => {
    setRows((prev) => [...prev, createPqdAdditionalRow()]);
  };

  const removeRow = (id) => {
    setRows((prev) => {
      const row = prev.find((r) => r.id === id);
      if (!row?.isCustom) return prev;
      return prev.filter((r) => r.id !== id);
    });
  };

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-[12px] uppercase tracking-wider font-bold text-gray-500">
          {capitalCase("pre qualification checklist")} — {typeLabel}
        </h2>
        <p className="text-[11px] text-gray-600 mt-1">
          {capitalCase("status")}: FC (fully complied), PC (partially complied), NA (not applicable).{" "}
          {capitalCase("attach supporting documents per row in annexure")}
        </p>
      </div>

      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="w-full text-xs border-collapse min-w-[720px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left font-semibold text-gray-700 px-2 py-2 w-10 whitespace-nowrap">
                {capitalCase("sl")}
              </th>
              <th className="text-left font-semibold text-gray-700 px-2 py-2 min-w-[220px]">
                {capitalCase("documents / details required")}
              </th>
              <th className="text-left font-semibold text-gray-700 px-2 py-2 w-24 whitespace-nowrap">
                {capitalCase("status")}
              </th>
              <th className="text-right font-semibold text-gray-700 px-2 py-2 pl-6 w-[200px] whitespace-nowrap">
                {capitalCase("annexure")}
              </th>
              <th className="text-left font-semibold text-gray-700 px-2 py-2 min-w-[140px]">
                {capitalCase("remarks / comments")}
              </th>
              <th className="w-10" aria-hidden />
            </tr>
          </thead>
          <tbody>
            {(rows || []).map((row) => {
              const fileList = getPqdRowFiles(row);
              const n = fileList.length;
              const hint = String(row.remarksHint || "").trim();
              const isCustom = Boolean(row.isCustom);
              return (
                <tr key={row.id} className="border-b border-gray-100 last:border-0 align-top">
                  <td className="px-2 py-2 text-center tabular-nums text-gray-800">{row.slNo}</td>
                  <td className="px-2 py-2 text-gray-900 leading-snug">
                    {isCustom ? (
                      <input
                        type="text"
                        className={fieldInputCls}
                        value={row.document ?? ""}
                        onChange={(e) => patchRow(row.id, { document: e.target.value })}
                        placeholder={capitalCase("document name or description")}
                      />
                    ) : (
                      <>
                        <div>{row.document || "—"}</div>
                        {hint ? (
                          <div className="mt-1 text-[10px] text-gray-600 whitespace-pre-wrap">{hint}</div>
                        ) : null}
                      </>
                    )}
                  </td>
                  <td className="px-2 py-2">
                    <select
                      className={fieldInputCls}
                      value={row.status || "NA"}
                      onChange={(e) => patchRow(row.id, { status: e.target.value })}
                    >
                      {PQD_ROW_STATUS_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-2 py-2 pl-6">
                    <div className="flex flex-col items-end gap-1">
                      <button
                        type="button"
                        onClick={() => fileInputRefs.current[row.id]?.click()}
                        className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-sm border transition-colors cursor-pointer ${
                          n > 0
                            ? "border-emerald-500/40 bg-emerald-50 text-emerald-700 hover:bg-emerald-100/50"
                            : "border-primary/30 bg-orange-50 text-primary hover:bg-orange-100/50"
                        }`}
                        title={capitalCase("click to select files")}
                      >
                        {n > 0 ? (
                          <>
                            <FileCheck className="w-3.5 h-3.5 shrink-0" />
                            <span>{n === 1 ? "1 file selected" : `${n} files selected`}</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-3.5 h-3.5 shrink-0" />
                            {capitalCase("upload")}
                          </>
                        )}
                      </button>
                      <input
                        type="file"
                        multiple
                        ref={(el) => {
                          fileInputRefs.current[row.id] = el;
                        }}
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        onChange={(e) => {
                          handleFiles(row.id, e.target.files);
                          e.target.value = "";
                        }}
                      />
                    </div>
                  </td>
                  <td className="px-2 py-2">
                    <textarea
                      className="w-full min-h-[52px] text-xs rounded-md border border-gray-200 bg-white px-2 py-1.5 text-gray-900 resize-y focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                      value={row.remarks ?? ""}
                      onChange={(e) => patchRow(row.id, { remarks: e.target.value })}
                      placeholder={capitalCase("remarks")}
                      rows={2}
                    />
                  </td>
                  <td className="px-1 py-2 align-top">
                    {isCustom ? (
                      <button
                        type="button"
                        onClick={() => removeRow(row.id)}
                        className="p-1 rounded text-red-600 hover:bg-red-50"
                        title={capitalCase("remove row")}
                        aria-label={capitalCase("remove row")}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex justify-start">
        <button
          type="button"
          onClick={addAdditionalDocument}
          className="inline-flex items-center gap-1.5 rounded-md border border-primary/35 bg-orange-50 px-3 py-1.5 text-[11px] font-semibold text-primary hover:bg-orange-100/70 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          {capitalCase("additional document")}
        </button>
      </div>

      {!def?.items?.length ? (
        <p className="text-[11px] text-amber-700">{capitalCase("no checklist definition for this type")}</p>
      ) : null}
    </div>
  );
}
