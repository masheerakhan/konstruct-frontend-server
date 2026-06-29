/**
 * QC Assets — “Add QC Assets” modal (matches simple register UX).
 *
 * Fields: Project + multiple lines with Asset description (textarea), Minimum No., Actual, Remark.
 * No scope in UI; API uses fixed `QC_ASSETS_REGISTER_SCOPE` on the server (see `src/api/index.js`).
 *
 * Submit: parent calls `createDmsQcAssetRequirementsFromDescriptions(org, { projectId, requirements })`.
 */
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { getProjectsForCurrentUser } from "../../../../api";
import { capitalCase } from "../../Transmittal/stringCase";

function newLine() {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    description: "",
    minimumNo: "",
    actual: "",
    remark: "",
  };
}

function dedupeByDescription(lines) {
  const map = new Map();
  for (const row of lines) {
    const k = String(row.description || "").trim().toLowerCase();
    if (!k) continue;
    map.set(k, row);
  }
  return Array.from(map.values()).map((row) => ({
    description: row.description,
    minimumNo: row.minimumNo,
    actual: row.actual,
    remark: row.remark,
  }));
}

export default function QCAssetsForm({ open, onClose, onSubmit }) {
  const formId = useId();
  const scrollBodyRef = useRef(null);
  const [projectId, setProjectId] = useState("");
  const [lines, setLines] = useState(() => [newLine()]);
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);

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
      setLines([newLine()]);
    }
  }, [open]);

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
    const cardId = `qc-asset-card-${line.id}`;
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
            el.querySelector("textarea, input")?.focus({ preventScroll: true });
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
    const assets = lines
      .filter((l) => String(l.description || "").trim())
      .map(({ description, minimumNo, actual, remark }) => ({
        description: String(description).trim(),
        minimumNo: String(minimumNo ?? "").trim(),
        actual: String(actual ?? "").trim(),
        remark: String(remark ?? "").trim(),
      }));

    if (!assets.length) {
      window.alert("Add at least one asset with a description.");
      return;
    }

    for (const a of assets) {
      const min = parseFloat(a.minimumNo);
      const act = parseFloat(a.actual);
      if (!Number.isNaN(min) && !Number.isNaN(act) && act > min) {
        window.alert(
          `"${a.description.slice(0, 80)}${a.description.length > 80 ? "…" : ""}": Actual (${a.actual}) cannot be greater than Minimum No. (${a.minimumNo}).`
        );
        return;
      }
    }

    const deduped = dedupeByDescription(
      assets.map((a) => ({
        id: a.description,
        description: a.description,
        minimumNo: a.minimumNo,
        actual: a.actual,
        remark: a.remark,
      }))
    );
    const requirements = deduped.map((r) => ({
      description: r.description,
      minimumNo: r.minimumNo,
      actual: r.actual,
      remark: r.remark,
    }));

    if (requirements.length < assets.length) {
      window.alert("Duplicate asset descriptions were merged into one row each.");
    }

    try {
      const result = await Promise.resolve(
        onSubmit?.({
          projectId,
          projectName: selectedProjectName,
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-foreground/40 p-0 sm:p-4">
      <div className="bg-card rounded-t-2xl sm:rounded-xl shadow-2xl w-full sm:max-w-2xl max-h-[92dvh] flex flex-col border border-border overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <h2 id={`${formId}-title`} className="text-lg font-semibold text-foreground">
            Add QC Assets
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div ref={scrollBodyRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
            <div>
              <label
                htmlFor={`${formId}-project`}
                className="block text-xs font-semibold text-muted-foreground mb-1.5"
              >
                Project
              </label>
              <select
                id={`${formId}-project`}
                className={fieldInputCls}
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                disabled={loadingProjects}
              >
                <option value="">{loadingProjects ? "Loading…" : "Select project"}</option>
                {projectOptions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-foreground mb-1">QC Asset Entries</h3>
              <p className="text-xs text-muted-foreground mb-3">
                Add asset descriptions with minimum and actual quantities. Actual cannot exceed minimum.
              </p>

              <div className="space-y-3">
                {lines.map((row, index) => {
                  const minVal = parseFloat(row.minimumNo);
                  const actVal = parseFloat(row.actual);
                  const hasError =
                    !Number.isNaN(minVal) && !Number.isNaN(actVal) && actVal > minVal;

                  return (
                    <div
                      id={`qc-asset-card-${row.id}`}
                      key={row.id}
                      className="rounded-xl border border-border bg-card p-4 space-y-3 scroll-mt-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                          Asset #{index + 1}
                        </span>
                        {lines.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeLine(row.id)}
                            className="inline-flex items-center gap-1 text-xs text-destructive hover:text-destructive/80"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Remove
                          </button>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor={`${formId}-description-${row.id}`}
                          className="block text-xs font-semibold text-muted-foreground mb-1.5"
                        >
                          Asset description
                        </label>
                        <textarea
                          id={`${formId}-description-${row.id}`}
                          className="w-full min-h-[72px] text-sm rounded-lg border border-border bg-background px-3 py-2 resize-y text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                          value={row.description}
                          onChange={(e) => updateLine(row.id, "description", e.target.value)}
                          placeholder="e.g. Compression Testing Machine"
                          rows={3}
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label
                            htmlFor={`${formId}-minimum-${row.id}`}
                            className="block text-xs font-semibold text-muted-foreground mb-1.5"
                          >
                            Minimum No.
                          </label>
                          <input
                            id={`${formId}-minimum-${row.id}`}
                            type="number"
                            min="0"
                            className={fieldInputCls}
                            value={row.minimumNo}
                            onChange={(e) => updateLine(row.id, "minimumNo", e.target.value)}
                            placeholder="e.g. 3"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor={`${formId}-actual-${row.id}`}
                            className="block text-xs font-semibold text-muted-foreground mb-1.5"
                          >
                            Actual
                          </label>
                          <input
                            id={`${formId}-actual-${row.id}`}
                            type="number"
                            min="0"
                            className={`w-full h-10 text-sm rounded-lg border bg-background px-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-all ${
                              hasError
                                ? "border-destructive focus:ring-destructive/30 focus:border-destructive"
                                : "border-border focus:ring-primary/30 focus:border-primary"
                            }`}
                            value={row.actual}
                            onChange={(e) => updateLine(row.id, "actual", e.target.value)}
                            placeholder="e.g. 2"
                          />
                          {hasError && (
                            <p className="text-xs text-destructive mt-1">Actual cannot exceed Minimum No.</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor={`${formId}-remark-${row.id}`}
                          className="block text-xs font-semibold text-muted-foreground mb-1.5"
                        >
                          Remark
                        </label>
                        <textarea
                          id={`${formId}-remark-${row.id}`}
                          className="w-full min-h-[68px] text-sm rounded-lg border border-border bg-background px-3 py-2 resize-y text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                          value={row.remark}
                          onChange={(e) => updateLine(row.id, "remark", e.target.value)}
                          placeholder="Remarks"
                          rows={2}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between px-5 py-3 border-t border-border shrink-0">
            <button
              type="button"
              onClick={addLine}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-primary/40 bg-transparent text-sm font-medium text-primary hover:bg-accent transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center justify-center h-9 px-3 rounded-md border border-border bg-background text-sm font-medium text-foreground hover:bg-accent transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center justify-center h-9 px-4 rounded-md bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                {capitalCase("save")}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
