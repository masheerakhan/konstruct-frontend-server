import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import {
  getProjectsForCurrentUser,
  getSessionOrgId,
  listDmsManpowerPositions,
} from "../../../../api";
import { capitalCase } from "../../Transmittal/stringCase";

const DEFAULT_SCOPE_OPTIONS = ["Civil", "Structure", "MEP", "Finishing", "External works", "General"];

/** Legend: B — From Beginning, P — Progressive, S — Shared Resource (matches DMS requirement API). */
const DEPLOYMENT_OPTIONS = [
  { value: "", label: "— Select —" },
  { value: "B", label: "B — From Beginning" },
  { value: "P", label: "P — Progressive" },
  { value: "S", label: "S — Shared Resource" },
];

function newLine() {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    positionId: "",
    minExp: "",
    numberRequired: "",
    actualDeploy: "",
    deployment: "",
    remark: "",
  };
}

/** Deduplicate by position master id; later cards win. */
function dedupeRequirements(lines) {
  const map = new Map();
  for (const row of lines) {
    const k = String(row.positionId || "").trim();
    if (!k) continue;
    map.set(k, row);
  }
  return Array.from(map.values()).map((row) => ({
    positionId: row.positionId,
    minExp: row.minExp,
    numberRequired: row.numberRequired,
    actualDeploy: row.actualDeploy,
    deployment: row.deployment,
    remark: row.remark,
  }));
}

export default function MinimumManpowerRequirementForm({ open, onClose, onSubmit }) {
  const formId = useId();
  const scrollBodyRef = useRef(null);
  const [projectId, setProjectId] = useState("");
  const [scope, setScope] = useState("");
  const [lines, setLines] = useState(() => [newLine()]);
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [positions, setPositions] = useState([]);
  const [loadingPositions, setLoadingPositions] = useState(false);
  const [positionsError, setPositionsError] = useState("");

  const orgId = useMemo(() => getSessionOrgId(), [open]);

  useEffect(() => {
    if (!open) return;
    let active = true;
    (async () => {
      setLoadingProjects(true);
      try {
        const res = await getProjectsForCurrentUser();
        const raw = res?.data;
        const list = Array.isArray(raw) ? raw : raw?.results ?? [];
        if (active) setProjects(list);
      } catch {
        if (active) setProjects([]);
      } finally {
        if (active) setLoadingProjects(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      setProjectId("");
      setScope("");
      setLines([newLine()]);
    }
  }, [open]);

  useEffect(() => {
    if (!open || !projectId) {
      setPositions([]);
      setPositionsError("");
      return;
    }
    let active = true;
    (async () => {
      setLoadingPositions(true);
      setPositionsError("");
      try {
        const params = { project_id: projectId, is_active: true };
        if (orgId) params.org_id = orgId;
        const res = await listDmsManpowerPositions(params);
        const raw = Array.isArray(res?.data) ? res.data : res?.data?.results ?? [];
        const list = raw.filter((p) => p?.id != null && p.is_active !== false);
        list.sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
        if (active) setPositions(list);
      } catch {
        if (active) {
          setPositions([]);
          setPositionsError(
            "Could not load positions from the server. Run: python manage.py seed_position_catalog"
          );
        }
      } finally {
        if (active) setLoadingPositions(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [open, orgId, projectId]);

  const positionOptions = useMemo(() => positions, [positions]);

  const projectOptions = useMemo(
    () =>
      (projects || [])
        .filter((p) => p?.id != null && p.id !== "")
        .map((p) => ({
          id: String(p.id),
          name: p.name || p.project_name || `Project ${p.id}`,
        })),
    [projects]
  );

  const selectedProjectName = useMemo(() => {
    const p = projectOptions.find((x) => x.id === projectId);
    return p?.name || "";
  }, [projectId, projectOptions]);

  const updateLine = useCallback((id, field, value) => {
    setLines((prev) => prev.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
  }, []);

  const addLine = useCallback(() => {
    const line = newLine();
    setLines((prev) => [...prev, line]);
    const cardId = `mm-pos-card-${line.id}`;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const el = document.getElementById(cardId);
        const shell = scrollBodyRef.current;
        if (el && shell) {
          const shellRect = shell.getBoundingClientRect();
          const elRect = el.getBoundingClientRect();
          const nextTop = shell.scrollTop + (elRect.top - shellRect.top) - 12;
          shell.scrollTo({ top: Math.max(0, nextTop), behavior: "smooth" });
          try {
            el.querySelector("select, input, textarea")?.focus({ preventScroll: true });
          } catch {
            /* ignore */
          }
        }
      });
    });
  }, []);

  const removeLine = useCallback((id) => {
    setLines((prev) => (prev.length <= 1 ? prev : prev.filter((row) => row.id !== id)));
  }, []);

  const fieldInputCls =
    "w-full h-10 text-sm rounded-lg border border-border bg-background px-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!projectId) {
      window.alert("Please select a project.");
      return;
    }
    if (!scope) {
      window.alert("Please select a scope.");
      return;
    }
    const deduped = dedupeRequirements(lines);
    const requirements = deduped.map((r) => ({
      ...r,
      positionLabel:
        positionOptions.find((p) => String(p.id) === String(r.positionId))?.name || "",
    }));
    const rowsWithPosition = lines.filter((l) => String(l.positionId || "").trim()).length;
    if (requirements.length === 0) {
      window.alert("Add at least one row and choose a position from the list.");
      return;
    }
    if (requirements.length < rowsWithPosition) {
      window.alert("Duplicate positions were merged into one row per role for this project and scope.");
    }
    try {
      const result = await Promise.resolve(
        onSubmit?.({
          projectId,
          projectName: selectedProjectName,
          scope,
          requirements,
        })
      );
      if (result === false) return;
    } catch {
      return;
    }
    onClose?.();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-foreground/40">
      <div
        className="bg-card rounded-t-2xl sm:rounded-xl shadow-2xl w-full sm:max-w-2xl max-h-[92dvh] flex flex-col border border-border overflow-hidden"
        role="dialog"
        aria-labelledby={`${formId}-title`}
        aria-modal="true"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <h2 id={`${formId}-title`} className="text-lg font-semibold text-foreground">
            Minimum Manpower Requirement
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-content-bg hover:text-foreground"
            aria-label={capitalCase("close")}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div ref={scrollBodyRef} className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-5 scroll-smooth">
            {!orgId && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                No organization on your login token: you can pick system-wide positions, but saving requirements to the
                server still needs org on your user profile.
              </p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5" htmlFor={`${formId}-project`}>
                  Project
                </label>
                <select
                  id={`${formId}-project`}
                  className={fieldInputCls}
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  disabled={loadingProjects}
                >
                  <option value="">{loadingProjects ? "Loading…" : "Select Project"}</option>
                  {projectOptions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5" htmlFor={`${formId}-scope`}>
                  Scope
                </label>
                <select
                  id={`${formId}-scope`}
                  className={fieldInputCls}
                  value={scope}
                  onChange={(e) => setScope(e.target.value)}
                >
                  <option value="">Select Scope</option>
                  {DEFAULT_SCOPE_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-foreground mb-1">Manpower Requirements</h3>
              <p className="text-xs text-muted-foreground mb-3">
                Each position can appear once per project and scope. Duplicates in this form are merged when you save.
              </p>

              <div className="space-y-3">
                {lines.map((row, index) => (
                  <div
                    id={`mm-pos-card-${row.id}`}
                    key={row.id}
                    className="rounded-xl border border-border bg-card p-4 space-y-3 scroll-mt-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                        Position #{index + 1}
                      </span>
                      {lines.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeLine(row.id)}
                          className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Remove
                        </button>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Position</label>
                      <select
                        className={fieldInputCls}
                        value={row.positionId}
                        onChange={(e) => updateLine(row.id, "positionId", e.target.value)}
                        disabled={!projectId || loadingPositions}
                      >
                        <option value="">
                          {!projectId
                            ? "Select a project first"
                            : loadingPositions
                              ? "Loading positions…"
                              : "Select position"}
                        </option>
                        {positionOptions.map((pos) => (
                          <option key={pos.id} value={String(pos.id)}>
                            {pos.name}
                            {pos.code ? ` (${pos.code})` : ""}
                          </option>
                        ))}
                      </select>
                      {positionsError && (
                        <p className="text-xs text-amber-700 mt-1">{positionsError}</p>
                      )}
                      {!loadingPositions &&
                        projectId &&
                        positions.length === 0 &&
                        !positionsError && (
                          <p className="text-xs text-muted-foreground mt-1">
                            No active positions returned. Seed the catalog (manage.py seed_position_catalog) or add
                            rows in Django Admin → Position masters.
                          </p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { key: "minExp", label: "Min. exp.", placeholder: "e.g. 5 years" },
                        { key: "numberRequired", label: "Number required", placeholder: "e.g. 2" },
                      ].map((field) => (
                        <div key={field.key}>
                          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                            {field.label}
                          </label>
                          <input
                            type="text"
                            className={fieldInputCls}
                            value={row[field.key]}
                            onChange={(e) => updateLine(row.id, field.key, e.target.value)}
                            placeholder={field.placeholder}
                          />
                        </div>
                      ))}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                        Actual deployment
                      </label>
                      <input
                        type="text"
                        className={fieldInputCls}
                        value={row.actualDeploy}
                        onChange={(e) => updateLine(row.id, "actualDeploy", e.target.value)}
                        placeholder="e.g. 2 persons, rotating shifts"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                        Deployment
                      </label>
                      <select
                        className={fieldInputCls}
                        value={row.deployment}
                        onChange={(e) => updateLine(row.id, "deployment", e.target.value)}
                      >
                        {DEPLOYMENT_OPTIONS.map((opt) => (
                          <option key={opt.value || "empty"} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        B — From Beginning · P — Progressive · S — Shared Resource
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Remark</label>
                      <textarea
                        className="w-full min-h-[68px] text-sm rounded-lg border border-border bg-background px-3 py-2 resize-y text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                        value={row.remark}
                        onChange={(e) => updateLine(row.id, "remark", e.target.value)}
                        placeholder="Remarks"
                        rows={2}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between px-5 py-3 border-t border-border shrink-0 gap-2">
            <button
              type="button"
              onClick={addLine}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-primary/40 bg-background text-sm font-medium text-primary hover:bg-primary/10 transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" /> Add
            </button>
            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="h-9 px-4 rounded-lg border border-border bg-background text-sm font-medium text-foreground hover:bg-content-bg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Save
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
