import { useMemo } from "react";
import { Plus, Trash2, Users } from "lucide-react";
import { capitalCase } from "../../Transmittal/stringCase";

const DEPLOYMENT_OPTIONS = [
  { value: "", label: "— Select —" },
  { value: "B", label: "B — From Beginning" },
  { value: "P", label: "P — Progressive" },
  { value: "S", label: "S — Shared Resource" },
];

/** Strip trailing .00 / .0 from plain numeric strings; keep text like ">3 years". */
function formatRegisterCell(v) {
  if (v == null || String(v).trim() === "") return "—";
  const s = String(v).trim();
  if (/^[-+]?\d+\.\d+$/.test(s)) {
    const n = Number(s);
    if (Number.isFinite(n) && Number.isInteger(n)) return String(n);
    const t = s.replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
    return t || s;
  }
  return s;
}

const HEADERS = [
  "SL. NO",
  "POSITION",
  "MINI. EXP (YRS)",
  "NOS. REQU.",
  "ACTUAL DEPLOYMENT",
  "DEPLOYMENT",
  "REMARKS",
  "",
];

function rowKey(row, idx) {
  if (row?.entry_id != null) return `e-${row.entry_id}`;
  if (row?.template_id != null) return `t-${row.template_id}`;
  return row?.clientKey ?? `idx-${idx}`;
}

export default function MinimumManpowerRegisterTable({
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
    <div className="bg-card rounded-xl border border-border shadow-sm mb-8">
      <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-border">
        <div className="flex items-center gap-2 mb-1">
          <Users className="w-5 h-5 text-primary shrink-0" />
          <h2 className="text-base sm:text-lg font-semibold text-foreground">
            Minimum Manpower Register
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Template rows are loaded from backend (global + org specific). Edit actual deployment (text), deployment
          legend (B / P / S), and remarks.
        </p>
        <p className="text-[11px] text-muted-foreground mt-2">
          Legend: B — From Beginning, P — Progressive, S — Shared Resource (applies to the Deployment column).
        </p>
      </div>

      <div className="px-4 sm:px-6 py-3 border-b border-border">
        <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:justify-between">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl w-full">
            <div>
              <label className="block text-xs font-semibold text-primary mb-1.5">{capitalCase("project")}</label>
              <select
                className="w-full h-10 text-sm rounded-lg border border-primary/40 bg-background px-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
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
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                {capitalCase("scope")}
              </label>
              <select
                className="w-full h-10 text-sm rounded-lg border border-border bg-background px-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                value={scope}
                onChange={(e) => onScopeChange?.(e.target.value)}
              >
                <option value="">Select scope</option>
                {["Civil", "Structure", "MEP", "Finishing", "External works", "General"].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
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
        <table className="w-full text-sm table-fixed">
          <thead>
            <tr className="border-b border-border">
              {HEADERS.map((h, hi) => (
                <th
                  key={`${h || "action"}-${hi}`}
                  className={`px-4 py-3 text-left text-xs font-bold text-primary uppercase tracking-wider whitespace-nowrap ${
                    h === "REMARKS" ? "min-w-[280px] w-[28%]" : ""
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
                <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
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
                  <td className="px-4 py-3 text-muted-foreground tabular-nums w-12">{idx + 1}</td>
                  <td className="px-4 py-3 font-medium text-foreground align-top">
                    {isCustom ? (
                      <input
                        type="text"
                        disabled={!canEdit}
                        value={row.position ?? ""}
                        onChange={(e) => onCellChange?.(idx, "position", e.target.value)}
                        className="w-full min-w-[7rem] h-9 text-sm rounded-md border border-border bg-background px-2"
                        placeholder={capitalCase("position")}
                      />
                    ) : (
                      row.position || "—"
                    )}
                  </td>
                  <td className="px-4 py-3 text-foreground align-top">
                    {isCustom ? (
                      <input
                        type="text"
                        disabled={!canEdit}
                        value={row.min_experience_years ?? ""}
                        onChange={(e) => onCellChange?.(idx, "min_experience_years", e.target.value)}
                        className="w-full min-w-[5rem] h-9 text-sm rounded-md border border-border bg-background px-2"
                        placeholder={capitalCase("e.g. 3")}
                      />
                    ) : (
                      formatRegisterCell(row.min_experience_years)
                    )}
                  </td>
                  <td className="px-4 py-3 text-foreground align-top">
                    {isCustom ? (
                      <input
                        type="text"
                        disabled={!canEdit}
                        value={row.required_number ?? ""}
                        onChange={(e) => onCellChange?.(idx, "required_number", e.target.value)}
                        className="w-full min-w-[5rem] h-9 text-sm rounded-md border border-border bg-background px-2"
                        placeholder={capitalCase("e.g. 2")}
                      />
                    ) : (
                      formatRegisterCell(row.required_number)
                    )}
                  </td>
                  <td className="px-4 py-3 text-foreground align-top">
                    <input
                      type="text"
                      disabled={!canEdit}
                      value={row.actual_deployment ?? ""}
                      onChange={(e) => onCellChange?.(idx, "actual_deployment", e.target.value)}
                      className="w-full min-w-[7rem] h-9 text-sm rounded-md border border-border bg-background px-2"
                      placeholder={capitalCase("e.g. 2, as per plan")}
                    />
                  </td>
                  <td className="px-4 py-3 text-foreground align-top">
                    <select
                      disabled={!canEdit}
                      value={row.deployment ?? ""}
                      onChange={(e) => onCellChange?.(idx, "deployment", e.target.value)}
                      className="w-full min-w-[10rem] max-w-[14rem] h-9 text-sm rounded-md border border-border bg-background px-2"
                    >
                      {DEPLOYMENT_OPTIONS.map((opt) => (
                        <option key={opt.value || "empty"} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-foreground align-top min-w-[280px]">
                    <textarea
                      disabled={!canEdit}
                      value={row.remark ?? ""}
                      onChange={(e) => onCellChange?.(idx, "remark", e.target.value)}
                      rows={3}
                      className="w-full min-h-[4.5rem] text-sm rounded-md border border-border bg-background px-2 py-1.5 resize-y leading-snug"
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
