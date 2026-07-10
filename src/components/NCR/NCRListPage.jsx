import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, ClipboardList, Inbox, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

import { NCR_STATUSES } from "../../constants/ncrStatus";
import { getNCRSummary, getNCRList } from "../../services/ncrService";
import StatCard from "./StatCard";
import NCRStatusBadge from "./NCRStatusBadge";

const STATUS_BORDER_MAP = {
  amber: "border-l-amber-400",
  orange: "border-l-orange-400",
  purple: "border-l-purple-400",
  teal: "border-l-teal-400",
  green: "border-l-green-400",
  red: "border-l-red-400",
  blue: "border-l-blue-400",
};

export default function NCRListPage() {
  const navigate = useNavigate();
  const [activeStatus, setActiveStatus] = useState("all");
  const [summary, setSummary] = useState(null);
  const [listData, setListData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch summary
  useEffect(() => {
    getNCRSummary()
      .then(setSummary)
      .catch((err) => toast.error("Failed to load NCR summary"));
  }, []);

  // Fetch list when activeStatus changes
  useEffect(() => {
    setLoading(true);
    getNCRList({ status: activeStatus, page: 1, pageSize: 50 })
      .then((res) => {
        setListData(res.data);
      })
      .catch((err) => toast.error("Failed to load NCR list"))
      .finally(() => setLoading(false));
  }, [activeStatus]);

  const toggleStatus = (statusKey) => {
    if (activeStatus === statusKey) {
      setActiveStatus("all");
    } else {
      setActiveStatus(statusKey);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1">Quality Management</div>
          <h1 className="text-3xl font-display font-bold tracking-tight text-slate-900" data-testid="ncr-list-title">Non-Conformity Reports</h1>
          <p className="text-sm text-slate-500 mt-1">Manage and track all NCRs across projects.</p>
        </div>
        <button
          onClick={() => navigate("/ncr/create")}
          data-testid="new-ncr-btn"
          className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white transition-colors bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="w-4 h-4 mr-1.5" /> New NCR
        </button>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-stretch auto-rows-fr">
        {loading && !summary ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-full min-h-[112px] bg-white rounded-xl border border-slate-200 p-4 animate-pulse">
              <div className="w-10 h-10 rounded-lg bg-slate-200 mb-4"></div>
              <div className="w-1/2 h-6 bg-slate-200 rounded mb-2"></div>
              <div className="w-1/3 h-3 bg-slate-200 rounded"></div>
            </div>
          ))
        ) : (
          <>
            <StatCard
              icon={ClipboardList}
              label="Total NCR"
              count={summary ? summary.total : "-"}
              colorKey="blue"
              active={activeStatus === "all"}
              onClick={() => setActiveStatus("all")}
              testId="stat-card-all"
            />
            {NCR_STATUSES.map((s, i) => (
              <StatCard
                key={s.key}
                icon={s.icon}
                label={s.label}
                count={summary ? (summary[s.key] || 0) : "-"}
                colorKey={s.color}
                active={activeStatus === s.key}
                onClick={() => toggleStatus(s.key)}
                testId={`stat-card-${s.key}`}
                className="animate-in fade-in slide-in-from-bottom-2"
                style={{ animationDelay: `${(i + 1) * 50}ms`, animationFillMode: "both" }}
              />
            ))}
          </>
        )}
      </div>

      {/* List Section */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm transition-opacity duration-150" style={{ opacity: loading ? 0.6 : 1 }}>
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h2 className="text-sm font-bold font-display text-slate-900">
            {activeStatus === "all" ? "All Records" : NCR_STATUSES.find(s => s.key === activeStatus)?.label}
          </h2>
          <div className="text-xs text-slate-500 font-medium">{listData.length} entries found</div>
        </div>

        {loading && listData.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-slate-400 space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
            <p className="text-sm">Loading records...</p>
          </div>
        ) : listData.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-slate-500 space-y-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
              <Inbox className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-sm">No NCRs found for this status.</p>
            {activeStatus !== "all" && (
              <button onClick={() => setActiveStatus("all")} className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                View all NCRs
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-white z-10">
                  <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 bg-white">
                    <th className="px-4 md:px-6 py-3 font-semibold">NCR No</th>
                    <th className="px-4 md:px-6 py-3 font-semibold">Related To</th>
                    <th className="px-4 md:px-6 py-3 font-semibold">Class</th>
                    <th className="px-4 md:px-6 py-3 font-semibold">Target Date</th>
                    <th className="px-4 md:px-6 py-3 font-semibold">Status</th>
                    <th className="px-4 md:px-6 py-3 font-semibold">Created Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {listData.map((row) => {
                    const statusColor = NCR_STATUSES.find(s => s.key === row.status)?.color;
                    const borderClass = STATUS_BORDER_MAP[statusColor] || 'border-l-transparent';
                    return (
                      <tr
                        key={row.id}
                        onClick={() => navigate(`/ncr/${row.id}`)}
                        className={`hover:bg-slate-50 cursor-pointer transition-colors duration-150 border-l-4 ${borderClass}`}
                        data-testid={`ncr-row-${row.ncr_no}`}
                      >
                        <td className="px-4 md:px-6 py-3.5 font-mono font-medium text-slate-900">{row.ncr_no}</td>
                        <td className="px-4 md:px-6 py-3.5 text-slate-600">{row.related_to}</td>
                        <td className="px-4 md:px-6 py-3.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${row.classification === 'major' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                            {row.classification}
                          </span>
                        </td>
                        <td className="px-4 md:px-6 py-3.5 text-slate-600">{new Date(row.target_date).toLocaleDateString()}</td>
                        <td className="px-4 md:px-6 py-3.5"><NCRStatusBadge status={row.status} /></td>
                        <td className="px-4 md:px-6 py-3.5 text-slate-500">{new Date(row.created_at).toLocaleDateString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {/* Mobile Stacked Card View */}
            <div className="sm:hidden flex flex-col divide-y divide-slate-100">
              {listData.map((row) => {
                const statusColor = NCR_STATUSES.find(s => s.key === row.status)?.color;
                const borderClass = STATUS_BORDER_MAP[statusColor] || 'border-l-transparent';
                return (
                  <div 
                    key={row.id} 
                    onClick={() => navigate(`/ncr/${row.id}`)}
                    className={`p-4 cursor-pointer hover:bg-slate-50 bg-white border-l-4 ${borderClass} transition-colors duration-150`}
                    data-testid={`ncr-mobile-card-${row.ncr_no}`}
                  >
                    <div className="flex justify-between items-start mb-2 gap-2">
                      <span className="font-mono font-bold text-slate-900">{row.ncr_no}</span>
                      <NCRStatusBadge status={row.status} />
                    </div>
                    <div className="text-sm text-slate-700 font-medium mb-1">{row.related_to}</div>
                    <div className="flex justify-between items-center text-xs text-slate-500">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${row.classification === 'major' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                        {row.classification}
                      </span>
                      <span>Target: {new Date(row.target_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
