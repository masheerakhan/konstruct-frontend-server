import React, { useState, useEffect } from "react";
import {
  Clock,
  CheckCircle,
  Send,
  ArrowLeft,
  ClipboardList,
  ShieldCheck,
  CircleAlert,
} from "lucide-react";

import {
  listPermits,
  listPTWTemplates,
  permitWorkflowAction,
  resolveActiveProjectId,
  getUserGroups,
  getPermit,
} from "../../../../api";
import { showToast } from "../../../../utils/toast";

const PermitFilters = ({ filters, setFilters, templates }) => {
  const updateFilter = (key, value) =>
    setFilters((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="mb-6 rounded-xl border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-foreground">Filters</h3>
        <button
          type="button"
          onClick={() => setFilters({ status: "all", type: "all" })}
          className="rounded-lg border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
        >
          Clear
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Status
          </label>
          <select
            value={filters.status}
            onChange={(e) => updateFilter("status", e.target.value)}
            className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
          >
            <option value="all">All</option>
            <option value="issue_in_progress">Pending Issue</option>
            <option value="closure_in_progress">Pending Closure</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Type
          </label>
          <select
            value={filters.type}
            onChange={(e) => updateFilter("type", e.target.value)}
            className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
          >
            <option value="all">All Types</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default function PermitCheckerDashboard() {
  const [projectId, setProjectId] = useState("");
  const [permits, setPermits] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("dashboard"); // "dashboard" | "review"
  const [selectedPermit, setSelectedPermit] = useState(null);
  const [filters, setFilters] = useState({ status: "all", type: "all" });
  const [remarks, setRemarks] = useState("");
  const [userGroups, setUserGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const pid =
        resolveActiveProjectId?.() || localStorage.getItem("ACTIVE_PROJECT_ID");
      setProjectId(pid);

      const [permitsRes, templatesRes] = await Promise.all([
        listPermits({ project_id: pid, assigned_to_me: true }),
        listPTWTemplates(),
      ]);

      const data = Array.isArray(permitsRes?.data)
        ? permitsRes.data
        : permitsRes?.data?.results || [];
      // Filter out Drafts locally for checkers, typically we only want what they can see
      setPermits(data);
      setTemplates(
        Array.isArray(templatesRes?.data)
          ? templatesRes.data
          : templatesRes?.data?.results || [],
      );
    } catch (err) {
      showToast("Failed to load permits", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await getUserGroups();
        const data = Array.isArray(res?.data)
          ? res.data
          : res?.data?.results || [];
        setUserGroups(data);
      } catch (err) {
        console.error("Failed to load user groups", err);
      }
    };
    fetchGroups();
  }, []);

  const [checklistRemarks, setChecklistRemarks] = useState({});

  useEffect(() => {
    if (selectedPermit?.checklist_response) {
      const initialRemarks = {};
      selectedPermit.checklist_response.forEach((item) => {
        if (item.remarks) initialRemarks[item.question_id] = item.remarks;
      });
      setChecklistRemarks(initialRemarks);
    } else {
      setChecklistRemarks({});
    }
  }, [selectedPermit]);

  const handleAction = async (actionType) => {
    if (!selectedPermit) return;
    try {
      const payload = {
        action: actionType,
        remarks: remarks,
        signature_data: "data:image/png;base64,mocksignature", // placeholder
      };
      if (actionType === "approve" && selectedGroupId) {
        payload.next_group_id = selectedGroupId;
      }

      // Inject updated checklist responses with remarks
      if (selectedPermit?.checklist_response) {
        payload.checklist_response = selectedPermit.checklist_response.map(
          (item) => ({
            ...item,
            remarks: checklistRemarks[item.question_id] || item.remarks || "",
          }),
        );
      }

      await permitWorkflowAction(selectedPermit.id, payload);
      showToast(`Permit successfully ${actionType}ed`, "success");
      setView("dashboard");
      setRemarks("");
      setSelectedGroupId("");
      setChecklistRemarks({});
      fetchData();
    } catch (err) {
      showToast(err?.response?.data?.detail || "Action failed", "error");
    }
  };

  const filteredPermits = permits.filter((p) => {
    if (filters.status !== "all" && p.current_status !== filters.status)
      return false;
    if (
      filters.type !== "all" &&
      String(p.template_id) !== String(filters.type)
    )
      return false;
    return true;
  });

  const pendingApproval = filteredPermits.filter(
    (p) => p.current_status === "issue_in_progress",
  );
  const pendingClosure = filteredPermits.filter(
    (p) => p.current_status === "closure_in_progress",
  );
  const completedPermits = filteredPermits.filter((p) =>
    ["issued", "closed"].includes(p.current_status),
  );
  const rejectedPermits = filteredPermits.filter(
    (p) => p.current_status === "rejected",
  );

  const handleReviewClick = async (item) => {
    try {
      const res = await getPermit(item.id, {
        project_id: item.project_id,
        assigned_to_me: "true",
      });
      setSelectedPermit(res.data);
      setView("review");
    } catch (err) {
      showToast("Failed to load permit details", "error");
    }
  };

  const renderPermitBucket = (title, items, icon, colorClass, badgeClass) => {
    return (
      <div className="mb-6">
        <div className="mb-2 flex items-center gap-2">
          {icon}
          <h2 className={`text-sm font-semibold sm:text-base ${colorClass}`}>
            {title}
          </h2>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {items.length}
          </span>
        </div>

        <div className="rounded-xl border bg-card shadow-sm">
          {items.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">No items</p>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-2 border-b border-border/50 p-4 last:border-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-foreground">
                    {item.template_name || `Permit #${item.id}`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(item.created_at).toLocaleDateString()}
                    {item.current_assigned_group_id &&
                      ` · Assigned to: Group ${item.current_assigned_group_id}`}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${badgeClass}`}
                  >
                    {item.current_status}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleReviewClick(item)}
                    className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-700 hover:bg-orange-100"
                  >
                    Review
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 pb-20 md:p-6 lg:p-8">
      {view === "dashboard" && (
        <div className="mx-auto max-w-6xl">
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Permit To Work (Reviewer)
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Review and approve permits assigned to your group.
            </p>
          </div>

          <PermitFilters
            filters={filters}
            setFilters={setFilters}
            templates={templates}
          />

          {loading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Loading...
            </div>
          ) : (
            <>
              {/* Counter cards */}
              <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5 sm:gap-4">
                {[
                  {
                    label: "Pending for Approval",
                    icon: <Clock className="h-3.5 w-3.5 text-yellow-500" />,
                    colorCls: "text-yellow-500",
                    count: pendingApproval.length,
                  },
                  {
                    label: "Pending for Closer",
                    icon: <Send className="h-3.5 w-3.5 text-orange-500" />,
                    colorCls: "text-orange-500",
                    count: pendingClosure.length,
                  },
                  {
                    label: "Approved",
                    icon: (
                      <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                    ),
                    colorCls: "text-green-600",
                    count: completedPermits.length,
                  },
                  {
                    label: "Rejected",
                    icon: <CircleAlert className="h-3.5 w-3.5 text-red-500" />,
                    colorCls: "text-red-600",
                    count: rejectedPermits.length,
                  },
                  {
                    label: "Total",
                    icon: (
                      <ClipboardList className="h-3.5 w-3.5 text-blue-600" />
                    ),
                    colorCls: "text-blue-600",
                    count: filteredPermits.length,
                  },
                ].map(({ label, icon, colorCls, count }) => (
                  <div
                    key={label}
                    className="rounded-xl border bg-card p-4 shadow-sm"
                  >
                    <div className="mb-1 flex items-center gap-1.5">
                      {icon}
                      <span className={`text-xs font-medium ${colorCls}`}>
                        {label}
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-foreground">
                      {Number.isFinite(Number(count)) ? Number(count) : 0}
                    </p>
                  </div>
                ))}
              </div>

              {/* Bucket Lists */}
              {renderPermitBucket(
                "Pending for Approval",
                pendingApproval,
                <Clock className="h-4 w-4 text-yellow-500" />,
                "text-yellow-500",
                "bg-yellow-100 text-yellow-800",
              )}

              {renderPermitBucket(
                "Pending for Closer",
                pendingClosure,
                <Send className="h-4 w-4 text-orange-500" />,
                "text-orange-500",
                "bg-orange-100 text-orange-800",
              )}

              {renderPermitBucket(
                "Completed Permit",
                completedPermits,
                <CheckCircle className="h-4 w-4 text-green-600" />,
                "text-green-600",
                "bg-green-100 text-green-800",
              )}
            </>
          )}
        </div>
      )}

      {view === "review" && selectedPermit && (
        <div className="mx-auto max-w-4xl">
          <button
            onClick={() => {
              setView("dashboard");
              setSelectedPermit(null);
            }}
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Queue
          </button>

          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-bold text-slate-900">
              {selectedPermit.template_snapshot?.template_name ||
                selectedPermit.template_name ||
                `Permit #${selectedPermit.id}`}
            </h2>

            <div className="mb-6 flex flex-col gap-2 rounded-lg bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-700">
                  Current Status:{" "}
                  <span className="text-orange-600">
                    {selectedPermit.current_status}
                  </span>
                </p>
                <p className="text-sm text-slate-600">
                  Pending Group:{" "}
                  <span className="font-medium text-slate-800">
                    {userGroups.find(
                      (g) => g.id === selectedPermit.current_assigned_group_id,
                    )?.name ||
                      `Group ${selectedPermit.current_assigned_group_id}`}
                  </span>
                </p>
              </div>
              <div className="text-right text-xs text-slate-500">
                <p>
                  Submitted:{" "}
                  {new Date(
                    selectedPermit.submitted_at || selectedPermit.created_at,
                  ).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Form Data */}
            {selectedPermit?.template_snapshot?.field_definitions?.length >
              0 && (
              <div className="mb-6 border-b pb-6">
                <h3 className="mb-4 text-lg font-semibold text-slate-800">
                  Form Details
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {selectedPermit.template_snapshot.field_definitions.map(
                    (field) => {
                      const value = selectedPermit.form_data?.[field.key];
                      return (
                        <div
                          key={field.key}
                          className="rounded-lg bg-slate-50 p-3 border border-slate-100"
                        >
                          <p className="text-xs font-medium text-slate-500">
                            {field.label}
                          </p>
                          <p className="mt-1 text-sm text-slate-900 font-medium">
                            {Array.isArray(value)
                              ? value.join(", ")
                              : value || "N/A"}
                          </p>
                        </div>
                      );
                    },
                  )}
                </div>
              </div>
            )}

            {/* Checklist */}
            {selectedPermit?.template_snapshot?.checklist_questions?.length >
              0 && (
              <div className="mb-6 border-b pb-6">
                <h3 className="mb-4 text-lg font-semibold text-slate-800">
                  Checklist & Review
                </h3>
                <div className="flex flex-col gap-4">
                  {selectedPermit.template_snapshot.checklist_questions.map(
                    (q) => {
                      const response = selectedPermit.checklist_response?.find(
                        (r) => String(r.question_id) === String(q.id),
                      );
                      const answer = response?.answer || "No answer";
                      return (
                        <div
                          key={q.id}
                          className="rounded-lg border bg-white p-4 shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <p className="text-sm font-medium text-slate-800 flex-1">
                              {q.question}
                            </p>
                            <span
                              className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${answer === "Yes" ? "bg-green-100 text-green-700" : answer === "No" ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-700"}`}
                            >
                              {answer}
                            </span>
                          </div>
                          <div className="mt-3">
                            <input
                              type="text"
                              value={checklistRemarks[q.id] || ""}
                              onChange={(e) =>
                                setChecklistRemarks((prev) => ({
                                  ...prev,
                                  [q.id]: e.target.value,
                                }))
                              }
                              placeholder="Add remark/objection for this item (Optional)..."
                              className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:bg-white focus:ring-1 focus:ring-orange-500 transition-colors"
                            />
                          </div>
                        </div>
                      );
                    },
                  )}
                </div>
              </div>
            )}

            <div className="mb-6">
              <h3 className="mb-4 text-lg font-semibold text-slate-800">
                Final Decision
              </h3>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Overall Remarks
              </label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Enter general remarks..."
                className="w-full rounded-lg border bg-white p-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-shadow"
                rows={3}
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t pt-6 bg-slate-50/50 -mx-6 -mb-6 p-6 rounded-b-xl">
              <button
                onClick={() => handleAction("reject")}
                className="rounded-lg border border-red-200 bg-red-50 px-6 py-2.5 text-sm font-bold text-red-700 hover:bg-red-100 transition-colors"
              >
                Reject to Maker
              </button>

              <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto">
                <select
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                  className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                >
                  <option value="">-- Final Approval --</option>
                  {userGroups.map((group) => (
                    <option key={group.id} value={group.id}>
                      Forward to {group.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => handleAction("approve")}
                  className="rounded-lg bg-green-600 px-8 py-2.5 text-sm font-bold text-white hover:bg-green-700 transition-colors shadow-sm hover:shadow"
                >
                  Approve
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
