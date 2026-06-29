import { useMemo } from "react";
import { ClipboardCheck, Plus, Trash2 } from "lucide-react";
import { capitalCase } from "../../Transmittal/stringCase";

function formatCell(v) {
  if (v == null || String(v).trim() === "") return "—";
  return String(v);
}

function rowKey(row, idx) {
  if (row?.entry_id != null) return `e-${row.entry_id}`;
  if (row?.template_id != null) return `t-${row.template_id}`;
  return row?.clientKey ?? `idx-${idx}`;
}

const QC_HEADERS = ["SL. NO", "DESCRIPTION", "MINIMUM No.s", "ACTUAL", "REMARKS", ""];

export default function QCAssetsRegisterTable({
  projectOptions = [],
  projectId = "",
  scope = "",
  rows = [],
  loading = false,
  saving = false,
  onProjectChange,
  onScopeChange,
  onCellChange,
  onAddRow,
  onRemoveRow,
  onSave,
}) {
  const canEdit = Boolean(projectId && scope);
  const totalRows = useMemo(() => rows.length, [rows]);

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden mb-8">
      <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-border">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-primary shrink-0" />
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-foreground">
                {capitalCase("QC assets register")}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Template rows load from the backend; use Add row for extra lines. Edit description / minimum on custom
                rows; actual and remarks on all rows.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              className="h-9 text-xs sm:text-sm rounded-md border border-border bg-background px-2 text-foreground"
              value={projectId}
              onChange={(e) => onProjectChange?.(e.target.value)}
            >
              <option value="">Select project</option>
              {projectOptions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <select
              className="h-9 text-xs sm:text-sm rounded-md border border-border bg-background px-2 text-foreground"
              value={scope}
              onChange={(e) => onScopeChange?.(e.target.value)}
            >
              {["Civil", "Structure", "MEP", "Finishing", "External works", "General"].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={!canEdit || saving}
              onClick={onSave}
              className="inline-flex items-center h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {QC_HEADERS.map((h, hi) => (
                <th
                  key={`${h || "act"}-${hi}`}
                  className={`px-4 py-3 text-left text-xs font-bold text-primary uppercase tracking-wider whitespace-nowrap ${
                    h === "REMARKS" ? "min-w-[240px] w-[26%]" : ""
                  } ${h === "" ? "w-10 p-0" : ""}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                  {loading
                    ? "Loading..."
                    : canEdit
                      ? "No rows yet. Add custom lines below or ensure templates exist for this scope."
                      : "Select project and scope to load the register."}
                </td>
              </tr>
            ) : (
              rows.map((row, idx) => {
                const isCustom = Boolean(row.is_custom) || row.template_id == null;
                return (
                  <tr
                    key={rowKey(row, idx)}
                    className="border-b border-border last:border-b-0 hover:bg-content-bg/50 transition-colors"
                  >
                    <td className="px-4 py-3 text-muted-foreground tabular-nums">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-foreground align-top">
                      {isCustom ? (
                        <input
                          type="text"
                          disabled={!canEdit}
                          value={row.description ?? ""}
                          onChange={(e) => onCellChange?.(idx, "description", e.target.value)}
                          className="w-full min-w-[10rem] h-9 text-sm rounded-md border border-border bg-background px-2"
                          placeholder={capitalCase("description")}
                        />
                      ) : (
                        formatCell(row.description)
                      )}
                    </td>
                    <td className="px-4 py-3 text-foreground align-top">
                      {isCustom ? (
                        <input
                          type="text"
                          disabled={!canEdit}
                          value={row.minimum_number ?? ""}
                          onChange={(e) => onCellChange?.(idx, "minimum_number", e.target.value)}
                          className="w-full min-w-[6rem] h-9 text-sm rounded-md border border-border bg-background px-2"
                          placeholder={capitalCase("minimum")}
                        />
                      ) : (
                        formatCell(row.minimum_number)
                      )}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <input
                        type="number"
                        min="0"
                        disabled={!canEdit}
                        value={row.actual_count ?? ""}
                        onChange={(e) => onCellChange?.(idx, "actual_count", e.target.value)}
                        className="w-24 h-9 text-sm rounded-md border border-border bg-background px-2"
                      />
                    </td>
                    <td className="px-4 py-3 align-top min-w-[240px]">
                      <textarea
                        disabled={!canEdit}
                        value={row.remark ?? ""}
                        onChange={(e) => onCellChange?.(idx, "remark", e.target.value)}
                        rows={4}
                        className="w-full min-h-[5.5rem] text-sm rounded-md border border-border bg-background px-2 py-1.5 resize-y leading-snug"
                        placeholder={capitalCase("remarks")}
                      />
                    </td>
                    <td className="px-2 py-3 align-top w-10">
                      {isCustom && canEdit ? (
                        <button
                          type="button"
                          onClick={() => onRemoveRow?.(idx)}
                          className="p-1.5 rounded-md text-red-600 hover:bg-red-50"
                          title={capitalCase("remove row")}
                          aria-label={capitalCase("remove row")}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) : null}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-3 text-xs text-muted-foreground border-t border-border flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          disabled={!canEdit || saving}
          onClick={() => onAddRow?.()}
          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-primary/40 bg-background text-primary text-sm font-medium hover:bg-primary/5 disabled:opacity-60"
        >
          <Plus className="w-4 h-4" />
          {capitalCase("add row")}
        </button>
        <span>Total rows: {totalRows}</span>
      </div>
    </div>
  );
}
