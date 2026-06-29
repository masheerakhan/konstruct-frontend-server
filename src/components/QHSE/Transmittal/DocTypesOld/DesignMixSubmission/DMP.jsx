import { useEffect, useRef, useState } from "react";
import { FileCheck, Plus, Trash2, Upload } from "lucide-react";
import { capitalCase } from "../../stringCase";
import { DMP_THIRD_PARTY_SECTION_TITLE, getDmpRowFiles, insertDmpCustomRow } from "../../dmpChecklists";

const fieldInputCls =
  "w-full h-9 text-xs rounded-md border border-gray-200 bg-white px-2 py-1 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary";

/**
 * Design Mix Submission index checklist (from DMP index sheet).
 *
 * @param {{
 *   rows: Array<Record<string, unknown>>,
 *   onRowsChange?: (next: unknown[] | ((prev: unknown[]) => unknown[])) => void,
 * }} props
 */
export default function DMP({ rows = [], onRowsChange }) {
  const fileInputRefs = useRef({});
  const addMenuRef = useRef(null);
  const [addMenuOpen, setAddMenuOpen] = useState(false);

  const setRows = (next) => {
    onRowsChange?.(next);
  };

  useEffect(() => {
    if (!addMenuOpen) return;
    const onPointerDown = (e) => {
      const el = addMenuRef.current;
      if (el && !el.contains(e.target)) setAddMenuOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [addMenuOpen]);

  const addRowVariant = (variant) => {
    setRows((prev) => insertDmpCustomRow(prev, variant));
    setAddMenuOpen(false);
  };

  const removeRow = (id) => {
    setRows((prev) => (prev || []).filter((r) => !(r.id === id && r.isCustom)));
  };

  const patchRow = (id, patch) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const handleFiles = (rowId, picked) => {
    const list = Array.from(picked || []).filter((f) => f instanceof File);
    patchRow(rowId, { files: list.length ? list : [] });
  };

  return (
    <div className="space-y-3">
      <h2 className="text-[12px] uppercase tracking-wider font-bold text-gray-500">
        {capitalCase("design mix submission index checklist")}
      </h2>
      <p className="text-[11px] text-gray-600">
        {capitalCase("attach supporting documents per row in annexure")}
      </p>

      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="w-full text-xs border-collapse min-w-[720px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left font-semibold text-gray-700 px-2 py-2 w-12 whitespace-nowrap">
                {capitalCase("sl")}
              </th>
              <th className="text-left font-semibold text-gray-700 px-2 py-2 min-w-[220px]">
                {capitalCase("document / details required")}
              </th>
              <th className="text-right font-semibold text-gray-700 px-2 py-2 pl-6 w-[200px] whitespace-nowrap">
                {capitalCase("annexure")}
              </th>
              <th className="text-left font-semibold text-gray-700 px-2 py-2 min-w-[140px]">
                {capitalCase("remarks")}
              </th>
              <th className="w-10 p-0" aria-hidden />
            </tr>
          </thead>
          <tbody>
            {(rows || []).map((row) => {
              if (row.kind === "section") {
                return (
                  <tr key={row.id} className="bg-gray-100 border-b border-gray-200">
                    <td colSpan={5} className="px-2 py-2 font-bold text-gray-800 uppercase tracking-wide text-[11px]">
                      {row.document || "—"}
                    </td>
                  </tr>
                );
              }

              const fileList = getDmpRowFiles(row);
              const n = fileList.length;
              const isCustom = Boolean(row.isCustom);

              return (
                <tr key={row.id} className="border-b border-gray-100 last:border-0 align-top">
                  <td className="px-2 py-2 text-center tabular-nums text-gray-800 whitespace-nowrap">
                    {row.slNo || "—"}
                  </td>
                  <td className="px-2 py-2 text-gray-900 leading-snug align-top">
                    {isCustom ? (
                      <input
                        type="text"
                        className={fieldInputCls}
                        value={row.document ?? ""}
                        onChange={(e) => patchRow(row.id, { document: e.target.value })}
                        placeholder={capitalCase("document / details required")}
                      />
                    ) : (
                      <span className="whitespace-pre-wrap">{row.document || "—"}</span>
                    )}
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
                  <td className="px-1 py-2 align-top w-10">
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
        <div className="relative inline-flex" ref={addMenuRef}>
          <button
            type="button"
            onClick={() => setAddMenuOpen((o) => !o)}
            className="inline-flex items-center gap-1.5 rounded-md border border-primary/35 bg-orange-50 px-3 py-1.5 text-[11px] font-semibold text-primary hover:bg-orange-100/70 transition-colors"
            aria-expanded={addMenuOpen}
            aria-haspopup="true"
          >
            <Plus className="w-3.5 h-3.5" />
            {capitalCase("add row")}
          </button>
          {addMenuOpen ? (
            <div
              role="menu"
              className="absolute bottom-full left-0 z-20 mb-1 min-w-[220px] rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
            >
              <button
                type="button"
                role="menuitem"
                className="flex w-full px-3 py-2 text-left text-[11px] font-medium text-gray-800 hover:bg-gray-50"
                onClick={() => addRowVariant("checklist")}
              >
                {capitalCase("checklist point")}
              </button>
              <button
                type="button"
                role="menuitem"
                className="flex w-full px-3 py-2 text-left text-[11px] font-medium text-gray-800 hover:bg-gray-50"
                onClick={() => addRowVariant("third_party")}
              >
                {DMP_THIRD_PARTY_SECTION_TITLE}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
