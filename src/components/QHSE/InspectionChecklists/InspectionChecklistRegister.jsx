// QHSE CHECKLIST MODULE
// Purpose:
// Inspection Register table view listing all checklist instances for a project.
// Displays status badges (In Progress / Pending Review / Completed / Rework),
// current assignee, PDF download button, and Fill/Review action routing.
// Screen: QHSE Checklists Dashboard – Inspection Register tab.
import React, { useState, useEffect, useCallback } from "react";
import { Search, Loader2, Eye, Pencil, CheckSquare, FileText, Download, User, Calendar, RefreshCw } from "lucide-react";
import { fetchChecklistInstances } from "./inspectionChecklistApi";
import toast from "react-hot-toast";

export default function InspectionChecklistRegister({ projectId, orgId, onFillClick, onReviewClick, onViewClick, activeTab }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [instances, setInstances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  // Read current user ID safely
  const currentUserId = (() => {
    try {
      const user =
        JSON.parse(localStorage.getItem("USER_DATA") || "null") ||
        JSON.parse(localStorage.getItem("userData") || "null");
      return user?.id || user?.user_id || null;
    } catch {
      return null;
    }
  })();

  const loadInstances = useCallback(async () => {
    setLoading(true);
    try {
      const assignedToMe = activeTab === "tasks";
      const list = await fetchChecklistInstances({
        orgId,
        projectId,
        assignedToMe,
      });
      setInstances(list);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load inspection records.");
    } finally {
      setLoading(false);
    }
  }, [orgId, projectId, activeTab]);

  useEffect(() => {
    loadInstances();
  }, [loadInstances]);

  const filteredInstances = instances.filter((inst) => {
    const matchesSearch = inst.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inst.template_title?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (statusFilter === "all") return matchesSearch;
    if (statusFilter === "pending_checker") {
      return matchesSearch && (inst.status === "pending_checker" || inst.status === "pending_supervisor");
    }
    return matchesSearch && inst.status === statusFilter;
  });

  const getStatusBadge = (status) => {
    const norm = String(status || "").toLowerCase();
    switch (norm) {
      case "completed":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 border border-green-200">Completed</span>;
      case "in_progress":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 border border-blue-200">In Progress</span>;
      case "rework":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 border border-amber-200">Rework</span>;
      case "pending_checker":
      case "pending checker":
      case "pending_supervisor":
      case "pending supervisor":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800 border border-orange-200">Pending Review</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 border border-gray-200">{status || "Unknown"}</span>;
    }
  };

  const handleDownloadReport = (instId) => {
    const base = window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost"
      ? "http://127.0.0.1:8001"
      : "https://konstruct.world/checklists";
    const reportUrl = `${base}/api/safety/checklists/${instId}/report/`;
    window.open(reportUrl, "_blank");
  };

  const totalCount = instances.length;
  const pendingCount = instances.filter((i) => i.status === "pending_checker" || i.status === "pending_supervisor").length;
  const completedCount = instances.filter((i) => i.status === "completed" || i.status === "approved").length;
  const reworkCount = instances.filter((i) => i.status === "rework").length;

  return (
    <div className="space-y-6">
      {/* ── Page Header Card ── */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-700 ring-1 ring-orange-100">
              <ClipboardList className="h-3.5 w-3.5" />
              Inspection Register
            </div>
            <h2 className="mt-3 text-xl font-semibold text-gray-900 font-display">
              Safety Inspection Checklist Register
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Manage, review, and track the end-to-end lifecycle of safety checklist audits. Fill inspection checkpoints, verify violations, and capture digital signatures.
            </p>
          </div>
        </div>
      </div>

      {/* ── Statistics Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md group">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-500" />
          <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Total Inspections</span>
          <p className="text-3xl font-extrabold text-gray-900 group-hover:scale-105 transition-transform duration-200 origin-left">{totalCount}</p>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md group">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-orange-500" />
          <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Pending Review</span>
          <p className="text-3xl font-extrabold text-gray-900 group-hover:scale-105 transition-transform duration-200 origin-left">{pendingCount}</p>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md group">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-500" />
          <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Completed</span>
          <p className="text-3xl font-extrabold text-gray-900 group-hover:scale-105 transition-transform duration-200 origin-left">{completedCount}</p>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md group">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-rose-500" />
          <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Rework / Rejected</span>
          <p className="text-3xl font-extrabold text-gray-900 group-hover:scale-105 transition-transform duration-200 origin-left">{reworkCount}</p>
        </div>
      </div>

      {/* ── Filters Section ── */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
          <div className="relative min-w-[280px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search inspection title, template name..."
              className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm text-gray-700 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all"
            />
          </div>

          <div className="flex items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 min-w-[180px] rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all"
            >
              <option value="all">All Statuses</option>
              <option value="in_progress">In Progress</option>
              <option value="pending_checker">Pending Review</option>
              <option value="rework">Rework</option>
              <option value="completed">Completed</option>
            </select>
            
            <button
              onClick={loadInstances}
              className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 transition-colors text-sm font-semibold shadow-sm"
              title="Refresh Register"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Grid/Table ── */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm table-fixed">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-gray-700 font-semibold">
                <th className="text-left px-5 py-4 w-[40%]">INSPECTION NAME / TEMPLATE</th>
                <th className="text-left px-5 py-4 w-[15%]">STATUS</th>
                <th className="text-left px-5 py-4 w-[20%]">CURRENT ASSIGNEE</th>
                <th className="text-left px-5 py-4 w-[13%]">CREATED AT</th>
                <th className="text-right px-5 py-4 w-[12%]">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-5 py-12">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <Loader2 className="w-8 h-8 animate-spin text-orange-500 mb-3" />
                      <p>Loading register entries...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredInstances.length > 0 ? (
                filteredInstances.map((inst) => {
                  const isCreator = inst.created_by_id === currentUserId;
                  const isAssignee = inst.current_assignee_id === currentUserId;
                  const canAct = isAssignee || (isCreator && (inst.status === "in_progress" || inst.status === "rework"));

                  return (
                    <tr key={inst.id} className="border-b border-gray-100 hover:bg-orange-50/30 transition-colors group">
                      <td className="px-5 py-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-orange-50 rounded-md group-hover:bg-white border border-orange-100 transition-colors">
                            <ClipboardList className="w-4 h-4 text-orange-500" />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">{inst.name}</div>
                            <div className="text-xs text-gray-500 mt-0.5">Template: {inst.template_title || "N/A"}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        {getStatusBadge(inst.status)}
                      </td>
                      <td className="px-5 py-4 text-gray-700">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-gray-400" />
                          <span className="truncate max-w-[150px]" title={inst.current_assignee_name || "Unassigned"}>
                            {inst.current_assignee_name || "Unassigned"}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-gray-500 text-xs">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          <span>{inst.created_at ? new Date(inst.created_at).toLocaleDateString() : "—"}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {canAct ? (
                            <button
                              title={inst.status === "pending_checker" || inst.status === "pending_supervisor" ? "Review & Sign" : "Fill & Submit"}
                              onClick={() => {
                                if (inst.status === "pending_checker" || inst.status === "pending_supervisor") {
                                  onReviewClick?.(inst);
                                } else {
                                  onFillClick?.(inst);
                                }
                              }}
                              className="p-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              title="View Audit"
                              onClick={() => onViewClick?.(inst)}
                              className="p-1.5 border border-gray-300 hover:bg-gray-50 text-gray-600 rounded-lg transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            title="Download PDF"
                            onClick={() => handleDownloadReport(inst.id)}
                            className="p-1.5 border border-gray-300 hover:bg-gray-50 hover:text-red-600 rounded-lg transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" className="px-5 py-8 text-center text-gray-500">
                    No inspection records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ClipboardList(props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M12 11h4" />
      <path d="M12 16h4" />
      <path d="M8 11h.01" />
      <path d="M8 16h.01" />
    </svg>
  );
}
