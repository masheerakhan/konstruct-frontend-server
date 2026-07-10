import React, { useState, useEffect } from "react";
import {
  Clock,
  CheckCircle,
  Send,
  ArrowLeft,
  ClipboardList,
  ShieldCheck,
  CircleAlert,
  ClipboardCheck,
  ImageIcon,
  XCircle,
} from "lucide-react";

import {
  listPermits,
  listPTWTemplates,
  permitWorkflowAction,
  resolveActiveProjectId,
  getUserGroups,
  getPermit,
  getPermitTbtAttendance,
  downloadPermitRegister,
} from "../../../../api";
import {resolveMediaUrl} from "../../../../lib/utils"
import { showToast } from "../../../../utils/toast";
import PermitSignatureModal from "../utils/PermitSignatureModal";
import PermitHeaderMeta from "../utils/PermitHeaderMeta";
import PermitReadonlyView from "../utils/PermitReadonlyView";

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
            <option value="issued">Issued</option>
            <option value="closed">Closed</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
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

const getQuestionImages = (permit, questionId) => {
  return (permit?.checklist_images || []).filter(
    (img) => String(img.question_id) === String(questionId),
  );
};

const getImageUrl = (img) => {
  return resolveMediaUrl(img?.file_url || img?.file || "");
};

export default function PermitCheckerDashboard() {
  const [projectId, setProjectId] = useState("");
  const [permits, setPermits] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("dashboard"); // "dashboard" | "review" | "view"
  const [selectedPermit, setSelectedPermit] = useState(null);
  const [filters, setFilters] = useState({ status: "all", type: "all" });
  const [remarks, setRemarks] = useState("");
  const [userGroups, setUserGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState("");

  const [signatureModalOpen, setSignatureModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [tbtViewModalOpen, setTbtViewModalOpen] = useState(false);
  const [tbtViewRows, setTbtViewRows] = useState([]);

  const [reviewFormData, setReviewFormData] = useState({});

  const handleDownloadRegister = async () => {
    try {
      const pid =
        resolveActiveProjectId?.() ||
        localStorage.getItem("ACTIVE_PROJECT_ID") ||
        projectId;
      await downloadPermitRegister(pid);
      showToast("Register downloaded successfully", "success");
    } catch (err) {
      showToast(err?.message || "Failed to download register", "error");
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const pid =
        resolveActiveProjectId?.() || localStorage.getItem("ACTIVE_PROJECT_ID");
      setProjectId(pid);

      const [
        assignedPermitsRes,
        actedIssuedRes,
        actedClosedRes,
        actedRejectedRes,
        actedCancelledRes,
        templatesRes,
      ] = await Promise.all([
        listPermits({
          project_id: pid,
          assigned_to_me: true,
        }),
        listPermits({
          project_id: pid,
          acted_by_me: true,
          current_status: "issued",
        }),
        listPermits({
          project_id: pid,
          acted_by_me: true,
          current_status: "closed",
        }),
        listPermits({
          project_id: pid,
          acted_by_me: true,
          current_status: "rejected",
        }),
        listPermits({
          project_id: pid,
          acted_by_me: true,
          current_status: "cancelled",
        }),
        listPTWTemplates(),
      ]);

      const assignedPermits = Array.isArray(assignedPermitsRes?.data)
        ? assignedPermitsRes.data
        : assignedPermitsRes?.data?.results || [];

      const actedIssuedPermits = Array.isArray(actedIssuedRes?.data)
        ? actedIssuedRes.data
        : actedIssuedRes?.data?.results || [];

      const actedClosedPermits = Array.isArray(actedClosedRes?.data)
        ? actedClosedRes.data
        : actedClosedRes?.data?.results || [];

      const actedRejectedPermits = Array.isArray(actedRejectedRes?.data)
        ? actedRejectedRes.data
        : actedRejectedRes?.data?.results || [];

      const actedCancelledPermits = Array.isArray(actedCancelledRes?.data)
        ? actedCancelledRes.data
        : actedCancelledRes?.data?.results || [];

      const mergedPermits = [
        ...assignedPermits,
        ...actedIssuedPermits,
        ...actedClosedPermits,
        ...actedRejectedPermits,
        ...actedCancelledPermits,
      ];

      const uniquePermits = Array.from(
        new Map(mergedPermits.map((permit) => [permit.id, permit])).values(),
      );

      setPermits(uniquePermits);
      setTemplates(
        Array.isArray(templatesRes?.data)
          ? templatesRes.data
          : templatesRes?.data?.results || [],
      );

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

    setReviewFormData(selectedPermit?.form_data || {});
  }, [selectedPermit]);

  const handleAction = async (actionType, signatureData = null) => {
    if (!selectedPermit) return;
    try {
      const payload = {
        action: actionType,
        remarks: remarks,
        signature: signatureData,
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

      payload.form_data = reviewFormData;

      await permitWorkflowAction(selectedPermit.id, payload);
      showToast(`Permit successfully ${actionType}ed`, "success");
      setView("dashboard");
      setRemarks("");
      setSelectedGroupId("");
      setChecklistRemarks({});
      fetchData();
    } catch (err) {
      const data = err?.response?.data;
      const detail =
        data?.detail || data?.signature || data?.message || err?.message;

      if (
        typeof detail === "string" &&
        detail.toLowerCase().includes("signature")
      ) {
        setPendingAction(() => (sig) => handleAction(actionType, sig));
        setSignatureModalOpen(true);
      } else {
        showToast(detail || "Action failed", "error");
      }
    }
  };

  const getStatus = (p) =>
    p.workflow_summary?.current_status ?? p.current_status;

  const filteredPermits = permits.filter((p) => {
    if (filters.status !== "all" && getStatus(p) !== filters.status)
      return false;
    if (
      filters.type !== "all" &&
      String(p.template_id) !== String(filters.type)
    )
      return false;
    return true;
  });

  const pendingApproval = filteredPermits.filter(
    (p) => getStatus(p) === "issue_in_progress",
  );
  const pendingClosure = filteredPermits.filter(
    (p) => getStatus(p) === "closure_in_progress",
  );
  const issuedPermits = filteredPermits.filter(
    (p) => getStatus(p) === "issued",
  );
  const closedPermits = filteredPermits.filter(
    (p) => getStatus(p) === "closed",
  );
  const rejectedPermits = filteredPermits.filter(
    (p) => getStatus(p) === "rejected",
  );
  const cancelledPermits = filteredPermits.filter(
    (p) => getStatus(p) === "cancelled",
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

  const handleViewPermit = async (item) => {
    try {
      const res = await getPermit(item.id);
      setSelectedPermit(res.data);
      setView("view");
    } catch (err) {
      showToast("Failed to load permit details", "error");
    }
  };

  const openTbtViewModal = async () => {
    if (!selectedPermit?.id) {
      showToast("Permit not found", "error");
      return;
    }

    try {
      const res = await getPermitTbtAttendance(selectedPermit.id);
      const rows = Array.isArray(res?.data)
        ? res.data
        : res?.data?.results || [];

      setTbtViewRows(rows);
      setTbtViewModalOpen(true);
    } catch (err) {
      showToast("Failed to load TBT attendance", "error");
    }
  };

  const renderPermitBucket = (title, items, icon, colorClass, badgeClass) => {
    return (
      <div className="flex flex-col">
        <div className="mb-2 flex items-center gap-2">
          {icon}
          <h2
            className="text-sm font-semibold text-foreground sm:text-base"
            style={{ color: colorClass }}
          >
            {title}
          </h2>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {items.length}
          </span>
        </div>

        <div className="h-[480px] overflow-y-auto rounded-xl border bg-card shadow-sm">
          {items.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-muted-foreground">No items</p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-3 border-b border-border/50 p-4 last:border-0 sm:flex-row sm:items-center sm:justify-between"
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

                <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${badgeClass}`}
                  >
                    {getStatus(item)}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      ["issued", "closed", "rejected"].includes(getStatus(item))
                        ? handleViewPermit(item)
                        : handleReviewClick(item)
                    }
                    className={
                      ["issued", "closed", "rejected"].includes(getStatus(item))
                        ? "rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-100"
                        : "rounded-lg bg-gradient-to-r from-orange-400 to-orange-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:shadow-md"
                    }
                  >
                    {["issued", "closed", "rejected"].includes(getStatus(item))
                      ? "View"
                      : "Review"}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  const getCurrentPermitGroup = () => {
    const groupId =
      selectedPermit?.workflow_summary?.current_group_id ??
      selectedPermit?.current_assigned_group_id;

    const groupCode =
      selectedPermit?.workflow_summary?.current_group_code ??
      selectedPermit?.current_assigned_group_code ??
      "";

    const groupNameFromPermit =
      selectedPermit?.workflow_summary?.current_group_name ??
      selectedPermit?.current_assigned_group_name ??
      "";

    const groupFromList = userGroups.find(
      (g) => String(g.id) === String(groupId),
    );

    return {
      id: groupId,
      code: groupCode || groupFromList?.code || "",
      name: groupNameFromPermit || groupFromList?.name || "",
    };
  };

  const canCurrentCheckerEditColumn = (col) => {
    if (!col?.editable) return false;

    const editableBy = col.editable_by || [];
    if (!editableBy.includes("checker")) return false;

    const currentGroup = getCurrentPermitGroup();

    // Prefer group id match
    if (col.checker_group_id) {
      return String(currentGroup.id) === String(col.checker_group_id);
    }

    // Fallback to group code
    if (col.checker_group_code) {
      return (
        String(currentGroup.code || "")
          .trim()
          .toLowerCase() ===
        String(col.checker_group_code || "")
          .trim()
          .toLowerCase()
      );
    }

    // Fallback to group name
    if (col.checker_group_name) {
      return (
        String(currentGroup.name || "")
          .trim()
          .toLowerCase() ===
        String(col.checker_group_name || "")
          .trim()
          .toLowerCase()
      );
    }

    // If no group restriction is configured, allow checker edit.
    return true;
  };

  return (
    <div className="min-h-screen bg-muted/40 p-4 sm:p-6 md:p-10">
      {view === "dashboard" && (
        <div className="mx-auto max-w-4xl">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
                <ClipboardCheck className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground sm:text-2xl">
                  Permit To Work (Reviewer)
                </h1>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDownloadRegister}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-700 transition-all hover:bg-orange-100"
              >
                <ClipboardList className="h-4 w-4" />
                Download Register
              </button>
            </div>
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
              <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 sm:gap-4">
                {[
                  {
                    label: "Pending for Approval",
                    icon: <Clock className="h-3.5 w-3.5" />,
                    colorCls: "hsl(45, 93%, 47%)",
                    count: pendingApproval.length,
                  },
                  {
                    label: "Pending for Closer",
                    icon: <Send className="h-3.5 w-3.5" />,
                    colorCls: "hsl(24.6, 95%, 53.1%)",
                    count: pendingClosure.length,
                  },
                  {
                    label: "Issued",
                    icon: <CheckCircle className="h-3.5 w-3.5" />,
                    colorCls: "hsl(145, 65%, 42%)",
                    count: issuedPermits.length,
                  },
                  {
                    label: "Closed",
                    icon: <CheckCircle className="h-3.5 w-3.5" />,
                    colorCls: "hsl(200, 70%, 45%)",
                    count: closedPermits.length,
                  },
                  {
                    label: "Rejected",
                    icon: <CircleAlert className="h-3.5 w-3.5" />,
                    colorCls: "hsl(0, 75%, 55%)",
                    count: rejectedPermits.length,
                  },
                  {
                    label: "Cancelled",
                    icon: <XCircle className="h-3.5 w-3.5" />,
                    colorCls: "hsl(220, 9%, 46%)",
                    count: cancelledPermits.length,
                  },
                  {
                    label: "Total",
                    icon: <ClipboardList className="h-3.5 w-3.5" />,
                    colorCls: "hsl(263, 83%, 53%)",
                    count: filteredPermits.length,
                  },
                ].map(({ label, icon, colorCls, count }) => (
                  <div
                    key={label}
                    className="rounded-xl border bg-card p-4 shadow-sm"
                  >
                    <div
                      className="mb-1 flex items-center gap-1.5"
                      style={{ color: colorCls }}
                    >
                      {icon}
                      <span className="text-xs font-medium">{label}</span>
                    </div>
                    <p className="text-2xl font-bold text-foreground">
                      {Number.isFinite(Number(count)) ? Number(count) : 0}
                    </p>
                  </div>
                ))}
              </div>

              {/* Bucket Lists */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {renderPermitBucket(
                  "Pending for Approval",
                  pendingApproval,
                  <Clock className="h-4 w-4 text-muted-foreground" />,
                  "hsl(45, 93%, 47%)",
                  "bg-yellow-100 text-yellow-800",
                )}

                {renderPermitBucket(
                  "Pending for Closer",
                  pendingClosure,
                  <Send className="h-4 w-4 text-muted-foreground" />,
                  "hsl(24.6, 95%, 53.1%)",
                  "bg-orange-100 text-orange-800",
                )}

                {renderPermitBucket(
                  "Issued Permits",
                  issuedPermits,
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />,
                  "hsl(145, 65%, 42%)",
                  "bg-green-100 text-green-800",
                )}

                {renderPermitBucket(
                  "Closed Permits",
                  closedPermits,
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />,
                  "hsl(200, 70%, 45%)",
                  "bg-blue-100 text-blue-800",
                )}

                {renderPermitBucket(
                  "Rejected Permits",
                  rejectedPermits,
                  <CircleAlert className="h-4 w-4 text-muted-foreground" />,
                  "hsl(0, 75%, 55%)",
                  "bg-red-100 text-red-800",
                )}

                {renderPermitBucket(
                  "Cancelled Permits",
                  cancelledPermits,
                  <XCircle className="h-4 w-4 text-muted-foreground" />,
                  "hsl(220, 9%, 46%)",
                  "bg-slate-100 text-slate-700",
                )}
              </div>
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
            className="mb-4 inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </button>

          <div className="mb-6 rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
                <ClipboardCheck className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground sm:text-xl">
                  {selectedPermit.template_snapshot?.template_name ||
                    selectedPermit.template_name ||
                    `Permit #${selectedPermit.id}`}
                </h1>
              </div>
            </div>
          </div>

          <PermitHeaderMeta
            headerConfig={selectedPermit.template_snapshot?.header_config}
            formatNo={selectedPermit.template_snapshot?.format_no}
            refNo={selectedPermit.template_snapshot?.ref_no}
            issuedDateText={selectedPermit.template_snapshot?.issued_date_text}
            revisionNo={selectedPermit.template_snapshot?.revision_no}
            projectId={selectedPermit.project_id}
            permitId={selectedPermit.id}
          />

          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <div className="mb-6 flex flex-col gap-2 rounded-lg bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-700">
                  Current Status:{" "}
                  <span className="text-orange-600">
                    {selectedPermit.workflow_summary?.current_status ??
                      selectedPermit.current_status}
                  </span>
                </p>
                <p className="text-sm text-slate-600">
                  Pending Group:{" "}
                  <span className="font-medium text-slate-800">
                    {selectedPermit.workflow_summary?.current_group_name ??
                      userGroups.find(
                        (g) =>
                          g.id === selectedPermit.current_assigned_group_id,
                      )?.name ??
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

            {/* Special Sections */}
            {selectedPermit?.template_snapshot?.special_sections?.length >
              0 && (
              <div className="mb-6 border-b pb-6">
                {selectedPermit.template_snapshot.special_sections.map(
                  (section) => (
                    <div key={section.key} className="mb-6 last:mb-0">
                      <h3 className="mb-4 text-lg font-semibold text-slate-800">
                        {section.title}
                      </h3>

                      {section.type === "row_table" ? (
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse border border-slate-300 text-sm">
                            <thead>
                              <tr className="bg-slate-100">
                                <th className="border border-slate-300 p-2 text-left w-12">
                                  S.No
                                </th>
                                {section.columns?.map((col) => (
                                  <th
                                    key={col.key}
                                    className="border border-slate-300 p-2 text-left"
                                  >
                                    {col.label}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {section.rows?.map((row, idx) => (
                                <tr key={row.key}>
                                  <td className="border border-slate-300 p-2">
                                    {idx + 1}
                                  </td>
                                  {section.columns?.map((col) => {
                                    const checkerCanEdit =
                                      canCurrentCheckerEditColumn(col);

                                    const currentValue =
                                      reviewFormData?.[section.key]?.rows?.[
                                        row.key
                                      ]?.[col.key] ??
                                      row[col.key] ??
                                      "";

                                    if (checkerCanEdit) {
                                      return (
                                        <td
                                          key={col.key}
                                          className="border border-slate-300 p-1"
                                        >
                                          <input
                                            type={
                                              col.field_type === "number"
                                                ? "number"
                                                : "text"
                                            }
                                            className="w-full rounded border border-slate-300 p-2 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                                            value={currentValue}
                                            onChange={(e) => {
                                              const val = e.target.value;

                                              setReviewFormData((prev) => ({
                                                ...prev,
                                                [section.key]: {
                                                  ...(prev[section.key] || {}),
                                                  rows: {
                                                    ...(prev[section.key]
                                                      ?.rows || {}),
                                                    [row.key]: {
                                                      ...(prev[section.key]
                                                        ?.rows?.[row.key] ||
                                                        {}),
                                                      [col.key]: val,
                                                    },
                                                  },
                                                },
                                              }));
                                            }}
                                          />
                                        </td>
                                      );
                                    }

                                    return (
                                      <td
                                        key={col.key}
                                        className="border border-slate-300 p-2 text-slate-800"
                                      >
                                        {currentValue || "-"}
                                      </td>
                                    );
                                  })}
                                </tr>
                              ))}
                            </tbody>
                          </table>

                          {section.footer_fields?.length > 0 && (
                            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {section.footer_fields.map((f) => {
                                const val =
                                  selectedPermit.form_data?.[section.key]?.[
                                    f.key
                                  ] ?? "";
                                return (
                                  <div
                                    key={f.key}
                                    className="rounded-lg bg-slate-50 p-3 border border-slate-100"
                                  >
                                    <p className="text-xs font-medium text-slate-500">
                                      {f.label}
                                    </p>
                                    <p className="mt-1 text-sm text-slate-900 font-medium">
                                      {val || "N/A"}
                                    </p>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ) : section.type === "table" ? (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          {section.fields?.map((f) => {
                            const val =
                              selectedPermit.form_data?.[section.key]?.[
                                f.key
                              ] ?? "";
                            return (
                              <div
                                key={f.key}
                                className="rounded-lg bg-slate-50 p-3 border border-slate-100"
                              >
                                <p className="text-xs font-medium text-slate-500">
                                  {f.label}
                                </p>
                                <p className="mt-1 text-sm text-slate-900 font-medium">
                                  {val || "N/A"}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500">
                          Unsupported special section type: {section.type}
                        </p>
                      )}
                    </div>
                  ),
                )}
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
                    (q, idx) => {
                      const response = selectedPermit.checklist_response?.find(
                        (r) => String(r.question_id) === String(q.id),
                      );
                      const answer = response?.answer || "No answer";
                      const images = getQuestionImages(selectedPermit, q.id);
                      return (
                        <div
                          key={q.id}
                          className="rounded-xl border bg-card p-5 shadow-sm mb-4"
                        >
                          <div className="mb-4 flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-xs font-bold text-white shadow-sm">
                                {idx + 1}
                              </span>

                              <div className="mt-1 flex-1">
                                <p className="text-[15px] font-semibold text-slate-800">
                                  {q.question}
                                </p>
                              </div>
                            </div>

                            <div className="flex shrink-0 items-center gap-2">
                              {idx === 0 && (
                                <button
                                  type="button"
                                  onClick={openTbtViewModal}
                                  className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-100"
                                >
                                  TBT Attendance
                                </button>
                              )}

                              <span
                                className={`rounded-full px-3 py-1 text-xs font-bold ${answer === "Yes" ? "bg-green-100 text-green-700" : answer === "No" ? "bg-red-100 text-red-700" : answer === "N/A" || answer === "NA" ? "bg-yellow-100 text-yellow-700" : "bg-slate-100 text-slate-700"}`}
                              >
                                {answer}
                              </span>
                            </div>
                          </div>
                          <div className="ml-11">
                            {images.length > 0 && (
                              <div className="mt-4">
                                <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-slate-500">
                                  <ImageIcon className="h-3.5 w-3.5" />
                                  Uploaded Images
                                </p>
                                <div className="flex flex-wrap gap-3">
                                  {images.map((img) => {
                                    const url = getImageUrl(img);
                                    if (!url) return null;

                                    return (
                                      <a
                                        key={img.id}
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block h-20 w-20 overflow-hidden rounded-lg border bg-white shadow-sm transition hover:shadow-md"
                                        title="Open image"
                                      >
                                        <img
                                          src={url}
                                          alt="Permit checklist"
                                          className="h-full w-full object-cover"
                                        />
                                      </a>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                            <div className="mt-2">
                              <label className="mb-1.5 block text-xs font-medium text-slate-500">
                                Checker Remark
                              </label>
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
                                className="w-full rounded-lg border border-slate-300 bg-slate-50 p-2.5 text-sm outline-none focus:border-orange-500 focus:bg-white focus:ring-1 focus:ring-orange-500 transition-colors"
                              />
                            </div>
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

            <div className="mt-8 flex flex-col justify-end gap-3 border-t border-border/50 pt-6 sm:flex-row">
              {selectedPermit.workflow_permissions?.can_reject && (
                <button
                  onClick={() => handleAction("reject")}
                  className="flex w-full items-center justify-center rounded-xl bg-red-500 px-4 py-3 text-sm font-bold text-white transition-all hover:bg-red-600 sm:w-auto"
                >
                  Reject to Maker
                </button>
              )}

              <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                <select
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                  className="h-[46px] w-full rounded-xl border border-border bg-background px-4 text-sm font-medium text-foreground outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 sm:w-auto"
                >
                  <option value="">-- Final Approval --</option>
                  {userGroups.map((group) => (
                    <option key={group.id} value={group.id}>
                      Forward to {group.name}
                    </option>
                  ))}
                </select>
                {selectedPermit.workflow_permissions?.can_approve && (
                  <button
                    onClick={() => handleAction("approve")}
                    className="flex w-full items-center justify-center rounded-xl bg-green-600 px-6 py-3 text-sm font-bold text-white transition-all hover:bg-green-700 sm:w-auto"
                  >
                    Approve
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {view === "view" && selectedPermit && (
        <PermitReadonlyView
          permit={selectedPermit}
          userType="checker"
          titlePrefix="View Permit"
          onBack={() => {
            setView("dashboard");
            setSelectedPermit(null);
          }}
        />
      )}

      {tbtViewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  TBT Attendance
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Read-only attendance details submitted by maker.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setTbtViewModalOpen(false)}
                className="rounded-lg px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="max-h-[65vh] overflow-auto p-6">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="w-14 border p-2 text-center">SN.</th>
                    <th className="border p-2 text-left">Name of Person</th>
                    <th className="border p-2 text-left">Name of Contractor</th>
                    <th className="border p-2 text-left">Designation</th>
                    <th className="border p-2 text-left">Signature</th>
                  </tr>
                </thead>

                <tbody>
                  {tbtViewRows.length > 0 ? (
                    tbtViewRows.map((row, index) => (
                      <tr key={row.id || index}>
                        <td className="border p-2 text-center">
                          {row.sn || index + 1}
                        </td>
                        <td className="border p-2">{row.person_name || "-"}</td>
                        <td className="border p-2">
                          {row.contractor_name || "-"}
                        </td>
                        <td className="border p-2">{row.designation || "-"}</td>
                        <td className="border p-2">
                          {row.signature_url || row.signature ? (
                            <img
                              src={resolveMediaUrl(
                                row.signature_url || row.signature,
                              )}
                              alt="TBT Signature"
                              className="h-10 max-w-[120px] rounded border object-contain"
                            />
                          ) : (
                            "-"
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="5"
                        className="border p-4 text-center text-slate-500"
                      >
                        No TBT attendance added.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end border-t px-6 py-4">
              <button
                type="button"
                onClick={() => setTbtViewModalOpen(false)}
                className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Signature Modal */}
      <PermitSignatureModal
        isOpen={signatureModalOpen}
        onClose={() => {
          setSignatureModalOpen(false);
          setPendingAction(null);
        }}
        onSignatureSuccess={(sigData) => {
          setSignatureModalOpen(false);
          if (pendingAction) pendingAction(sigData);
        }}
      />
    </div>
  );
}
