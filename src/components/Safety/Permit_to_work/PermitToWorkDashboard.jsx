  import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  History,
  AlertTriangle,
  X,
  RefreshCw,
  FileText,
  CheckCircle2,
  Clock,
  UserCircle2,
  PencilLine,
  Send,
  ThumbsUp,
  ThumbsDown,
  Inbox,
} from "lucide-react";

import {
  listPermits,
  listPermitLogs,
  resolveActiveProjectId,
  getUserGroups
} from "../../../api";
import { showToast } from "../../../utils/toast";

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const ACTION_TYPES = [
  { value: "", label: "All actions" },
  { value: "created", label: "Created" },
  { value: "submitted", label: "Submitted" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "edited", label: "Edited" },
];

const actionMeta = (action = "") => {
  const a = String(action).toLowerCase();
  if (a.includes("approve"))
    return { Icon: ThumbsUp, dot: "bg-emerald-500", tint: "text-emerald-600" };
  if (a.includes("reject"))
    return { Icon: ThumbsDown, dot: "bg-red-500", tint: "text-red-600" };
  if (a.includes("submit"))
    return { Icon: Send, dot: "bg-blue-500", tint: "text-blue-600" };
  if (a.includes("edit") || a.includes("update"))
    return { Icon: PencilLine, dot: "bg-amber-500", tint: "text-amber-600" };
  if (a.includes("create"))
    return { Icon: Plus, dot: "bg-orange-500", tint: "text-orange-600" };
  return { Icon: Clock, dot: "bg-muted-foreground", tint: "text-muted-foreground" };
};

const relativeTime = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString();
};

const formatDate = (iso) => {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString();
};

const initials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("") || "U";

/* ------------------------------------------------------------------ */
/* Modal shell                                                         */
/* ------------------------------------------------------------------ */

function Modal({ open, onClose, title, subtitle, headerRight, children }) {
  const closeRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    closeRef.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-150 sm:items-center sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="flex h-[95vh] w-full flex-col overflow-hidden rounded-t-2xl border bg-card shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-200 sm:h-auto sm:max-h-[85vh] sm:max-w-3xl sm:rounded-2xl">
        <div className="sticky top-0 flex items-start justify-between gap-3 border-b bg-card/95 px-5 py-4 backdrop-blur">
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold text-foreground sm:text-lg">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-0.5 truncate text-xs text-muted-foreground sm:text-sm">
                {subtitle}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1">
            {headerRight}
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-orange-400"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Logs Modal                                                          */
/* ------------------------------------------------------------------ */

function LogItem({ log, isLast }) {
  const action = log.action || log.event || log.type || "updated";
  const { Icon, dot, tint } = actionMeta(action);
  const actor =
    log.actor_name || log.user_name || log.created_by_name || log.user || "System";
  const stage = (log.stage || log.current_stage || "").replaceAll("_", " ");
  const permitId = log.permit_id || log.permit || log.object_id;
  const ts = log.created_at || log.timestamp || log.created || log.date;
  const note = log.comment || log.note || log.description || log.reason;

  return (
    <li className="relative flex gap-3 pb-5">
      {!isLast && (
        <span className="absolute left-[15px] top-8 h-full w-px bg-border" aria-hidden />
      )}
      <div className="relative flex h-8 w-8 shrink-0 items-center justify-center">
        <span className={`absolute inset-0 rounded-full ${dot} opacity-15`} />
        <Icon className={`h-4 w-4 ${tint}`} />
      </div>
      <div className="min-w-0 flex-1 rounded-lg border bg-background p-3">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-sm font-semibold capitalize text-foreground">
            {action.replaceAll("_", " ")}
            {permitId ? ` PTW #${permitId}` : ""}
          </span>
          <span className="text-xs text-muted-foreground" title={formatDate(ts)}>
            • {relativeTime(ts) || formatDate(ts)}
          </span>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-foreground">
            {initials(actor)}
          </span>
          <span className="font-medium text-foreground">{actor}</span>
          {stage && (
            <>
              <span>•</span>
              <span className="capitalize">{stage}</span>
            </>
          )}
        </div>
        {note && (
          <div className="mt-2 rounded-md bg-muted/60 px-3 py-2 text-xs text-foreground">
            {note}
          </div>
        )}
      </div>
    </li>
  );
}

function LogsModal({ open, onClose, projectId, items, initialPermitId }) {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState("");
  const [permitFilter, setPermitFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listPermitLogs({ project_id: projectId || undefined });
      const data = res?.data;
      setLogs(Array.isArray(data) ? data : data?.results || []);
    } catch (err) {
      showToast(err?.response?.data?.detail || "Failed to load logs", "error");
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (open) {
      setPermitFilter(initialPermitId ? String(initialPermitId) : "");
      fetchLogs();
    }
  }, [open, initialPermitId, fetchLogs]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return logs.filter((l) => {
      const action = String(l.action || l.event || l.type || "").toLowerCase();
      const permitId = String(l.permit_id || l.permit || l.object_id || "");
      const actor = String(l.actor_name || l.user_name || l.user || "").toLowerCase();
      const note = String(l.comment || l.note || l.description || "").toLowerCase();

      if (permitFilter && permitId !== String(permitFilter)) return false;
      if (actionFilter && !action.includes(actionFilter)) return false;
      if (q && !(action.includes(q) || actor.includes(q) || note.includes(q) || permitId.includes(q)))
        return false;
      return true;
    });
  }, [logs, search, permitFilter, actionFilter]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Activity Logs"
      subtitle="Recent actions across all permits"
      headerRight={
        <button
          type="button"
          onClick={fetchLogs}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          title="Refresh"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      }
    >
      <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search action, user, note..."
            className="w-full rounded-md border bg-background py-2 pl-8 pr-3 text-sm outline-none focus:border-orange-400"
          />
        </div>
        <select
          value={permitFilter}
          onChange={(e) => setPermitFilter(e.target.value)}
          className="rounded-md border bg-background px-3 py-2 text-sm"
        >
          <option value="">All permits</option>
          {items.map((p) => (
            <option key={p.id} value={p.id}>
              PTW #{p.id}
            </option>
          ))}
        </select>
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="rounded-md border bg-background px-3 py-2 text-sm"
        >
          {ACTION_TYPES.map((a) => (
            <option key={a.value} value={a.value}>
              {a.label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
              <div className="flex-1 animate-pulse rounded-lg border bg-muted/40 p-3">
                <div className="mb-2 h-3 w-1/3 rounded bg-muted" />
                <div className="h-3 w-1/2 rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Inbox className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">No activity yet</p>
          <p className="text-xs text-muted-foreground">
            Try adjusting your filters or refresh.
          </p>
        </div>
      ) : (
        <ul className="relative">
          {filtered.map((log, i) => (
            <LogItem
              key={log.id || i}
              log={log}
              isLast={i === filtered.length - 1}
            />
          ))}
        </ul>
      )}
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Rejected Modal                                                      */
/* ------------------------------------------------------------------ */

function RejectedCard({ row, onOpen, onViewLogs }) {
  const reason =
    row.last_rejection_remarks ||
    row.rejection_reason ||
    row.reject_reason ||
    row.reason ||
    row.rejection_note ||
    row.last_comment ||
    "No reason provided.";
  const stage = (row.current_stage || "").replaceAll("_", " ");
  const rejectedBy =
    row.rejected_by_name || row.updated_by_name || row.actor_name || "—";
  const date = row.last_rejected_at || row.rejected_at || row.updated_at || row.modified_at;

  return (
    <div className="relative overflow-hidden rounded-xl border bg-background shadow-sm transition hover:shadow-md">
      <span className="absolute inset-y-0 left-0 w-1 bg-red-500" aria-hidden />
      <div className="flex flex-col gap-3 p-4 pl-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold text-foreground">PTW #{row.id}</span>
            <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
              <ThumbsDown className="h-3 w-3" />
              Rejected
            </span>
            <span className="text-xs text-muted-foreground" title={formatDate(date)}>
              {relativeTime(date) || formatDate(date)}
            </span>
          </div>
          <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            <UserCircle2 className="h-3.5 w-3.5" />
            <span>
              Rejected by <span className="font-medium text-foreground">{rejectedBy}</span>
              {stage ? (
                <>
                  {" "}at <span className="capitalize">{stage}</span>
                </>
              ) : null}
            </span>
          </div>
          <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3">
            <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-wide text-red-700">
              Reason / Description
            </p>
            <p className="text-sm text-red-900 whitespace-pre-wrap break-words">
              {reason}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 gap-2 sm:flex-col">
          <button
            type="button"
            onClick={() => onOpen(row)}
            className="flex-1 rounded-md bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-600 sm:flex-none"
          >
            Open
          </button>
          <button
            type="button"
            onClick={() => onViewLogs(row)}
            className="flex-1 inline-flex items-center justify-center gap-1 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted sm:flex-none"
          >
            <History className="h-3.5 w-3.5" /> Logs
          </button>
        </div>
      </div>
    </div>
  );
}

function RejectedModal({ open, onClose, rejectedItems, onOpenPermit, onViewLogs, onRefresh, refreshing }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rejectedItems;
    return rejectedItems.filter((r) => {
      const reason = String(
        r.last_rejection_remarks ||
        r.rejection_reason ||
        r.reject_reason ||
        r.reason ||
        ""
      ).toLowerCase();
      return String(r.id).includes(q) || reason.includes(q);
    });
  }, [rejectedItems, search]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Rejected Permits"
      subtitle={`${rejectedItems.length} rejected permit${rejectedItems.length === 1 ? "" : "s"}`}
      headerRight={
        <button
          type="button"
          onClick={onRefresh}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          title="Refresh"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
        </button>
      }
    >
      <div className="mb-4 relative">
        <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by ID or reason..."
          className="w-full rounded-md border bg-background py-2 pl-8 pr-3 text-sm outline-none focus:border-orange-400"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 text-center">
          <CheckCircle2 className="mb-3 h-12 w-12 text-emerald-500" />
          <p className="text-sm font-semibold text-foreground">
            No rejected permits 🎉
          </p>
          <p className="text-xs text-muted-foreground">
            All caught up — nothing needs attention here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((row) => (
            <RejectedCard
              key={row.id}
              row={row}
              onOpen={onOpenPermit}
              onViewLogs={onViewLogs}
            />
          ))}
        </div>
      )}
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Main Dashboard                                                      */
/* ------------------------------------------------------------------ */

export default function PermitToWorkDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [projectId, setProjectId] = useState("");
  const [searchText, setSearchText] = useState("");

  const [logsOpen, setLogsOpen] = useState(false);
  const [rejectedOpen, setRejectedOpen] = useState(false);
  const [logsPermitId, setLogsPermitId] = useState("");

  useEffect(() => {
    setProjectId(String(resolveActiveProjectId?.() || ""));
  }, []);

  const fetchPermits = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listPermits({ project_id: projectId || undefined });
      const data = res?.data;
      setItems(Array.isArray(data) ? data : data?.results || []);
    } catch (err) {
      showToast(err?.response?.data?.detail || "Failed to load permits", "error");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchPermits();
  }, [fetchPermits]);

  const filteredItems = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    if (!q) return items;
    return items.filter((row) => {
      const name = `ptw #${row.id}`.toLowerCase();
      const status = `${row.current_status || ""}`.toLowerCase();
      const stage = `${row.current_assignee_name || row.current_stage || "-"}`.toLowerCase();
      return name.includes(q) || status.includes(q) || stage.includes(q);
    });
  }, [items, searchText]);

  const rejectedItems = useMemo(
    () => items.filter((r) => String(r.current_status).toLowerCase() === "rejected"),
    [items]
  );

  const openLogsForPermit = (row) => {
    setLogsPermitId(row.id);
    setRejectedOpen(false);
    setLogsOpen(true);
  };

  return (
    <div className="min-h-screen bg-muted/40 p-4 sm:p-6 md:p-8">
      <div className="mx-auto max-w-7xl rounded-2xl border bg-card p-4 shadow-sm sm:p-6">
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-lg font-semibold text-foreground">
              Permit To Work Checklists
            </h1>
            <p className="text-sm text-muted-foreground">
              Create and manage Permit To Work checklists
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setLogsPermitId("");
                setLogsOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
            >
              <History className="h-4 w-4" />
              Logs
            </button>
            <button
              type="button"
              onClick={() => setRejectedOpen(true)}
              className="relative inline-flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
            >
              <AlertTriangle className="h-4 w-4" />
              Rejected PTWs
              {rejectedItems.length > 0 && (
                <span className="ml-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-600 px-1.5 text-[10px] font-bold text-white">
                  {rejectedItems.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate("/safety/permit-to-work/create")}
              className="inline-flex items-center gap-2 rounded-md bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
            >
              <Plus className="h-4 w-4" />
              Create
            </button>
          </div>
        </div>

        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search by name, assignee..."
              className="w-full rounded-md border bg-background py-2 pl-8 pr-3 text-sm outline-none focus:border-orange-400"
            />
          </div>
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm sm:w-48"
          >
            <option value={projectId || ""}>
              {projectId ? `Project ${projectId}` : "All projects"}
            </option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b text-left text-xs font-semibold uppercase tracking-wide text-orange-600">
                <th className="px-3 py-3">SR NO.</th>
                <th className="px-3 py-3">Name</th>
                <th className="px-3 py-3">Current Assignee</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Report</th>
                <th className="px-3 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-sm text-muted-foreground">
                    Loading permits...
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-sm text-muted-foreground">
                    <FileText className="mx-auto mb-2 h-8 w-8 opacity-50" />
                    No permits found.
                  </td>
                </tr>
              ) : (
                filteredItems.map((row, idx) => (
                  <tr key={row.id} className="border-b text-sm">
                    <td className="px-3 py-3 text-muted-foreground">{idx + 1}</td>
                    <td className="px-3 py-3 font-medium text-foreground">PTW #{row.id}</td>
                    <td className="px-3 py-3 text-foreground">
                      <div className="font-medium">
                        {row.current_assignee_name || "-"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {row.current_assignee_role || row.current_stage
                          ? `${row.current_assignee_role || ""}${row.current_stage ? ` • ${row.current_stage.replaceAll("_", " ")}` : ""
                          }`
                          : ""}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className="rounded-full border px-2 py-0.5 text-xs capitalize">
                        {(row.current_status || "-").replaceAll("_", " ")}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-muted-foreground">
                      {row.current_status === "approved" ? "Available" : "-"}
                    </td>
                    <td className="px-3 py-3">
                      <button
                        type="button"
                        onClick={() =>
                          navigate(`/safety/permit-to-work/create?permitId=${row.id}`)
                        }
                        className="rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted"
                      >
                        Open
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <LogsModal
        open={logsOpen}
        onClose={() => setLogsOpen(false)}
        projectId={projectId}
        items={items}
        initialPermitId={logsPermitId}
      />

      <RejectedModal
        open={rejectedOpen}
        onClose={() => setRejectedOpen(false)}
        rejectedItems={rejectedItems}
        onOpenPermit={(row) =>
          navigate(`/safety/permit-to-work/create?permitId=${row.id}`)
        }
        onViewLogs={openLogsForPermit}
        onRefresh={fetchPermits}
        refreshing={loading}
      />
    </div>
  );
}
