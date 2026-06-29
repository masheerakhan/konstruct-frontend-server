import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  ChevronRight,
  User,
  Phone,
  Mail,
  AlertTriangle,
} from "lucide-react";
import { formatDisplayDate } from "../../../utils/dateFormatter";

const levelColors = [
  "bg-emerald-50 text-emerald-800 border-emerald-200",
  "bg-amber-50 text-amber-900 border-amber-200",
  "bg-orange-50 text-orange-800 border-orange-200",
  "bg-red-50 text-red-800 border-red-200",
  "bg-rose-50 text-rose-900 border-rose-200",
];

const levelBadgeColors = [
  "bg-emerald-100 text-emerald-800",
  "bg-amber-100 text-amber-800",
  "bg-orange-100 text-orange-800",
  "bg-red-100 text-red-800",
  "bg-rose-100 text-rose-900",
];

/**
 * Collapsed-row label: backend sends E1 as ``Role: Full name`` and contacts as ``Name (Position)``.
 * Show only the role/position in the summary row; expanded cards still use the full ``who.name``.
 */
export function escalationSummaryRoleLabel(displayName) {
  const s = String(displayName || "").trim();
  if (!s) return "—";

  const colonIdx = s.indexOf(": ");
  if (colonIdx > 0) {
    const left = s.slice(0, colonIdx).trim();
    const right = s.slice(colonIdx + 2).trim();
    if (right) return left || s;
  }

  const open = s.lastIndexOf("(");
  const close = s.lastIndexOf(")");
  if (open !== -1 && close > open) {
    const inner = s.slice(open + 1, close).trim();
    if (inner) return inner;
  }

  return s;
}

/** Backend stores triggers like ``00:08:00`` (duration); show copy aligned with the matrix UI. */
export function formatEscalationTriggerDisplay(raw) {
  if (raw == null) return "";
  const s = String(raw).trim();
  if (!s) return "";
  const m = /^(\d{1,2}):(\d{2}):(\d{2})$/.exec(s);
  if (!m) return s;
  const h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const sec = parseInt(m[3], 10);
  if (h === 0 && min === 0 && sec === 0) return s;
  const parts = [];
  if (h > 0) parts.push(`${h} hour${h !== 1 ? "s" : ""}`);
  if (min > 0) parts.push(`${min} minute${min !== 1 ? "s" : ""}`);
  if (h === 0 && min === 0 && sec > 0)
    parts.push(`${sec} second${sec !== 1 ? "s" : ""}`);
  return `Issue not resolved within ${parts.join(", ")}`;
}

function padLevels(levels) {
  const L = Array.isArray(levels) ? [...levels] : [];
  while (L.length < 5) L.push(null);
  return L.slice(0, 5);
}

function normalizeApiRows(rows) {
  if (!Array.isArray(rows)) return [];
  return rows.map((r) => ({
    id: r.id,
    sr_no: r.sr_no,
    department: (r.department && String(r.department).trim()) || "—",
    levels: padLevels(r.levels),
  }));
}

function levelCell(level) {
  if (!level || !level.who || !String(level.who.name || "").trim()) return null;
  return {
    who: {
      name: String(level.who.name || "").trim(),
      email: String(level.who.email || "").trim(),
      phone: String(level.who.phone || "").trim(),
    },
    trigger: formatEscalationTriggerDisplay(level.trigger),
  };
}

function ProjectSelect({ value, options, onChange, disabled }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const selected =
    options.find((o) => String(o.id) === String(value)) ?? options[0];

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!options.length) {
    return (
      <div className="relative mt-1">
        <div className="flex h-10 w-[220px] items-center rounded-md border border-dashed border-border bg-muted/20 px-3 text-sm text-muted-foreground">
          {disabled ? "Loading projects…" : "No projects available"}
        </div>
      </div>
    );
  }

  const label = selected?.name || `Project ${value}`;

  return (
    <div className="relative mt-1" ref={ref}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        className="flex h-10 w-[220px] items-center justify-between gap-2 rounded-md border border-border bg-background px-3 text-left text-sm text-foreground shadow-sm transition-colors hover:bg-muted/40 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/50 disabled:opacity-60"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate">{label}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <ul
          className="absolute right-0 z-50 mt-1 max-h-60 w-[220px] overflow-auto rounded-md border border-border bg-card py-1 shadow-md"
          role="listbox"
        >
          {options.map((opt) => (
            <li
              key={opt.id}
              role="option"
              aria-selected={String(opt.id) === String(value)}
            >
              <button
                type="button"
                className={`w-full px-3 py-2 text-left text-sm transition-colors hover:bg-muted/60 ${
                  String(opt.id) === String(value)
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-foreground"
                }`}
                onClick={() => {
                  onChange(String(opt.id));
                  setOpen(false);
                }}
              >
                {opt.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function EscalationMatrix({
  projectOptions = [],
  projectId = "",
  projectName = "",
  rows = [],
  loading = false,
  onProjectChange,
}) {
  const [expandedRow, setExpandedRow] = useState(null);

  const tableRows = useMemo(() => normalizeApiRows(rows), [rows]);

  const selectedLabel = useMemo(() => {
    const fromOpts = projectOptions.find(
      (p) => String(p.id) === String(projectId),
    );
    if (fromOpts?.name) return fromOpts.name;
    if (projectName) return projectName;
    return projectId || "—";
  }, [projectOptions, projectId, projectName]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card px-6 py-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Escalation Matrix
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Escalation path from onboarded vendors (E1 = primary contact,
              E2–E5 = communication contacts).
            </p>
          </div>
          <div className="shrink-0">
            <label className="text-xs font-semibold uppercase tracking-wider text-primary">
              Project
            </label>
            <ProjectSelect
              value={projectId}
              options={projectOptions}
              onChange={onProjectChange ?? (() => {})}
              disabled={loading && !projectOptions.length}
            />
          </div>
        </div>
      </header>

      <div className="p-6">
        <div className="mb-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <span>
            <strong className="text-foreground">Trade:</strong> —
          </span>
          <span>
            <strong className="text-foreground">Contractor:</strong> —
          </span>
          <span>
            <strong className="text-foreground">Location:</strong> —
          </span>
          <span>
            <strong className="text-foreground">Project:</strong>{" "}
            <span className="text-foreground">{selectedLabel}</span>
          </span>
          <span>
            <strong className="text-foreground">Date:</strong>{" "}
            {formatDisplayDate(new Date())}
          </span>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs font-medium text-muted-foreground">
            Levels:
          </span>
          {[1, 2, 3, 4, 5].map((level, i) => (
            <span
              key={level}
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${levelBadgeColors[i]}`}
            >
              L{level}
            </span>
          ))}
          <span className="ml-1 flex items-center gap-1 text-xs text-muted-foreground sm:ml-2">
            <AlertTriangle className="h-3 w-3 shrink-0" />
            Severity increases left to right
          </span>
        </div>

        <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
          <div className="grid grid-cols-[48px_minmax(140px,180px)_repeat(5,minmax(0,1fr))] border-b border-orange-200/80 bg-gradient-to-b from-orange-50 to-orange-100/90">
            <div className="px-3 py-3 text-xs font-bold uppercase tracking-wider text-primary">
              Sr.
            </div>
            <div className="px-3 py-3 text-xs font-bold uppercase tracking-wider text-primary">
              Department
            </div>
            {[1, 2, 3, 4, 5].map((level) => (
              <div
                key={level}
                className="px-2 py-3 text-center text-xs font-bold uppercase tracking-wider text-primary sm:px-4"
              >
                Escalation {level}
              </div>
            ))}
          </div>

          {loading && (
            <div className="px-4 py-10 text-center text-sm text-muted-foreground">
              Loading escalation matrix…
            </div>
          )}

          {!loading && tableRows.length === 0 && (
            <div className="px-4 py-10 text-center text-sm text-muted-foreground">
              No active vendors with escalation data for this project.
            </div>
          )}

          {!loading &&
            tableRows.map((row) => {
              const isExpanded = expandedRow === row.id;
              const levels = row.levels.map(levelCell);

              return (
                <div
                  key={row.id}
                  className="border-b border-border last:border-b-0"
                >
                  <div
                    role="button"
                    tabIndex={0}
                    className="grid grid-cols-[48px_minmax(140px,180px)_repeat(5,minmax(0,1fr))] cursor-pointer transition-colors hover:bg-muted/40"
                    onClick={() => setExpandedRow(isExpanded ? null : row.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setExpandedRow(isExpanded ? null : row.id);
                      }
                    }}
                  >
                    <div className="px-3 py-4 text-sm font-medium text-muted-foreground tabular-nums">
                      {row.sr_no}
                    </div>
                    <div className="flex items-center gap-2 px-3 py-4">
                      <motion.span
                        animate={{ rotate: isExpanded ? 90 : 0 }}
                        transition={{ duration: 0.22, ease: "easeOut" }}
                        className="flex shrink-0"
                      >
                        <ChevronRight
                          className={`h-4 w-4 ${
                            isExpanded
                              ? "text-primary"
                              : "text-muted-foreground"
                          }`}
                        />
                      </motion.span>
                      <span className="text-sm font-semibold text-foreground">
                        {row.department}
                      </span>
                    </div>
                    {levels.map((level, i) => (
                      <div key={i} className="px-2 py-4 text-center sm:px-4">
                        {level ? (
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {escalationSummaryRoleLabel(level.who.name)}
                            </p>
                            <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                              {level.trigger || "—"}
                            </p>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            —
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        key={`expanded-${row.id}`}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{
                          height: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
                          opacity: { duration: 0.2, ease: "easeOut" },
                        }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-border bg-muted/20 px-4 py-4 sm:px-6">
                          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                            {levels.map((level, i) =>
                              level ? (
                                <motion.div
                                  key={i}
                                  initial={{ y: -8, opacity: 0 }}
                                  animate={{ y: 0, opacity: 1 }}
                                  exit={{ y: -6, opacity: 0 }}
                                  transition={{
                                    duration: 0.2,
                                    delay: i * 0.03,
                                    ease: "easeOut",
                                  }}
                                  className={`rounded-lg border p-4 ${levelColors[i]}`}
                                >
                                  <span
                                    className={`mb-3 inline-flex items-center rounded-full border-0 px-2.5 py-0.5 text-xs font-semibold ${levelBadgeColors[i]}`}
                                  >
                                    Level {i + 1}
                                  </span>
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                      <User className="h-3.5 w-3.5 shrink-0 opacity-80" />
                                      <span className="text-sm font-semibold">
                                        {level.who.name}
                                      </span>
                                    </div>
                                    {level.who.email && (
                                      <div className="flex items-start gap-2">
                                        <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-70" />
                                        <span className="break-all text-xs">
                                          {level.who.email}
                                        </span>
                                      </div>
                                    )}
                                    {level.who.phone && (
                                      <div className="flex items-center gap-2">
                                        <Phone className="h-3.5 w-3.5 shrink-0 opacity-70" />
                                        <span className="text-xs tabular-nums">
                                          {level.who.phone}
                                        </span>
                                      </div>
                                    )}
                                    <div className="mt-2 border-t border-current/15 pt-2">
                                      <p className="text-xs font-semibold text-primary">
                                        Trigger:
                                      </p>
                                      <p className="mt-0.5 text-xs leading-relaxed opacity-90">
                                        {level.trigger || "—"}
                                      </p>
                                    </div>
                                  </div>
                                </motion.div>
                              ) : (
                                <motion.div
                                  key={i}
                                  initial={{ y: -8, opacity: 0 }}
                                  animate={{ y: 0, opacity: 1 }}
                                  exit={{ y: -6, opacity: 0 }}
                                  transition={{
                                    duration: 0.2,
                                    delay: i * 0.03,
                                    ease: "easeOut",
                                  }}
                                  className="flex min-h-[120px] items-center justify-center rounded-lg border border-dashed border-border bg-muted/10 p-4"
                                >
                                  <span className="text-xs text-muted-foreground">
                                    Not configured
                                  </span>
                                </motion.div>
                              ),
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
