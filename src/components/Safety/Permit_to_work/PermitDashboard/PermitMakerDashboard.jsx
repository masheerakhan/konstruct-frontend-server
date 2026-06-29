import React, { useState, useEffect } from "react";
import {
  Clock,
  CheckCircle,
  Send,
  Plus,
  ArrowLeft,
  ClipboardList,
  CircleAlert,
} from "lucide-react";

import {
  listPermits,
  listPTWTemplates,
  createPermit,
  resolveActiveProjectId,
  resolveOrgId,
  getPTWTemplate,
  listContractorNamesByOrg,
  getUserGroups,
  permitWorkflowAction,
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
            <option value="draft">Draft</option>
            <option value="issue_in_progress">Pending Issue</option>
            <option value="closure_in_progress">Pending Closure</option>
            <option value="issued">Issued</option>
            <option value="closed">Closed</option>
            <option value="rejected">Rejected</option>
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

export default function PermitMakerDashboard() {
  const [projectId, setProjectId] = useState("");
  const [permits, setPermits] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("dashboard"); // "dashboard" | "create"
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [templateDetails, setTemplateDetails] = useState(null);
  const [formData, setFormData] = useState({});
  const [checklistResponse, setChecklistResponse] = useState({});
  const [filters, setFilters] = useState({ status: "all", type: "all" });

  // Custom field states
  const getUserData = () => {
    try {
      const token = localStorage.getItem("ACCESS_TOKEN");
      if (token) {
        return JSON.parse(atob(token.split(".")[1]));
      }
    } catch (e) {}
    try {
      const str = localStorage.getItem("USER_DATA");
      if (str) return JSON.parse(str);
    } catch (e) {}
    return {};
  };
  const userData = getUserData();
  const autoContractorName =
    userData.contractor_name || userData.company_name || "";
  const autoApplicantName = userData.username || userData.name || "";
  const [locationParts, setLocationParts] = useState({
    wing: "",
    floor: "",
    flat: "",
  });

  const [userGroups, setUserGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState("");

  // Closure modal state
  const [closureModalOpen, setClosureModalOpen] = useState(false);
  const [selectedPermitForClosure, setSelectedPermitForClosure] =
    useState(null);
  const [closureRemarks, setClosureRemarks] = useState("");
  const [closureGroupId, setClosureGroupId] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const pid =
        resolveActiveProjectId?.() || localStorage.getItem("ACTIVE_PROJECT_ID");
      setProjectId(pid);

      const [permitsRes, templatesRes] = await Promise.all([
        listPermits({ project_id: pid, created_by_me: true }),
        listPTWTemplates(),
      ]);

      setPermits(
        Array.isArray(permitsRes?.data)
          ? permitsRes.data
          : permitsRes?.data?.results || [],
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

  useEffect(() => {
    if (view === "create" && selectedTemplate) {
      const fetchTemplate = async () => {
        try {
          const res = await getPTWTemplate(selectedTemplate);
          setTemplateDetails(res?.data);

          const initialData = {};
          res?.data?.fields_config?.forEach((fc) => {
            const fd = fc.field_definition;
            if (fd) {
              const k = fd.key;
              const k_lower = k.toLowerCase();
              const l_lower = (fd.label || "").toLowerCase();
              if (
                k_lower === "contractor_name" ||
                k_lower.includes("contractor")
              ) {
                initialData[k] = autoContractorName;
              } else if (
                k_lower === "permit_applicant" ||
                k_lower === "applicant_name" ||
                k_lower.includes("applicant") ||
                l_lower.includes("applicant")
              ) {
                initialData[k] = autoApplicantName;
              }
            }
          });

          setFormData({
            ...initialData,
            contractor_name: autoContractorName,
            permit_applicant: autoApplicantName,
          });
          setChecklistResponse({});
          setLocationParts({ wing: "", floor: "", flat: "" });
          setSelectedGroupId("");
        } catch (err) {
          showToast("Failed to load template details", "error");
          setTemplateDetails(null);
        }
      };
      fetchTemplate();
    } else {
      const initialData = {};
      templateDetails?.fields_config?.forEach((fc) => {
        const fd = fc.field_definition;
        if (fd) {
          const k = fd.key;
          const k_lower = k.toLowerCase();
          const l_lower = (fd.label || "").toLowerCase();
          if (k_lower === "contractor_name" || k_lower.includes("contractor")) {
            initialData[k] = autoContractorName;
          } else if (
            k_lower === "permit_applicant" ||
            k_lower === "applicant_name" ||
            k_lower.includes("applicant") ||
            l_lower.includes("applicant")
          ) {
            initialData[k] = autoApplicantName;
          }
        }
      });
      setTemplateDetails(null);
      setFormData({
        ...initialData,
        contractor_name: autoContractorName,
        permit_applicant: autoApplicantName,
      });
      setChecklistResponse({});
      setLocationParts({ wing: "", floor: "", flat: "" });
      setSelectedGroupId("");
    }
  }, [selectedTemplate, view]);

  // Sync location
  useEffect(() => {
    if (locationParts.wing || locationParts.floor || locationParts.flat) {
      const locString = `Wing ${locationParts.wing || "N/A"} - Floor ${locationParts.floor || "N/A"} - Area/Flat ${locationParts.flat || "N/A"}`;
      setFormData((prev) => ({ ...prev, location: locString }));
    } else {
      setFormData((prev) => ({ ...prev, location: "" }));
    }
  }, [locationParts]);

  const handleRequestClosure = async () => {
    if (!closureGroupId) return showToast("Select a checker group", "error");
    try {
      await permitWorkflowAction(
        selectedPermitForClosure.id,
        "request_closure",
        {
          next_assignee: closureGroupId,
          remarks: closureRemarks,
        },
      );
      showToast("Closure requested successfully", "success");
      setClosureModalOpen(false);
      setSelectedPermitForClosure(null);
      setClosureRemarks("");
      setClosureGroupId("");
      fetchData();
    } catch (err) {
      showToast(
        err?.response?.data?.detail || "Failed to request closure",
        "error",
      );
    }
  };

  const handleCreateDraft = async () => {
    if (!selectedTemplate) return showToast("Select a template", "error");
    try {
      const formattedChecklist = Object.values(checklistResponse);
      const defaultFlowId =
        templateDetails?.flow_options?.[0]?.approval_flow?.id;

      const payload = {
        template_id: selectedTemplate,
        project_id: projectId,
        organization_id: resolveOrgId?.() || localStorage.getItem("ORG_ID"),
        submit_now: true,
        form_data: formData,
        checklist_response: formattedChecklist,
        selected_flow_id: defaultFlowId || undefined,
        assigned_group_id: selectedGroupId || undefined,
      };
      await createPermit(payload);
      showToast("Permit raised successfully", "success");
      setView("dashboard");
      fetchData();
    } catch (err) {
      showToast(err?.response?.data?.detail || "Creation failed", "error");
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
                      ` · Waiting on: ${userGroups.find((g) => g.id === item.current_assigned_group_id)?.name || `Group ${item.current_assigned_group_id}`}`}
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
                    className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                  >
                    View
                  </button>
                  {item.current_status === "issued" && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPermitForClosure(item);
                        setClosureModalOpen(true);
                      }}
                      className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-700 hover:bg-orange-100"
                    >
                      Request Closure
                    </button>
                  )}
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
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Permit To Work (Maker)
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Create and manage your work permits.
              </p>
            </div>
            <button
              onClick={() => setView("create")}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-orange-700"
            >
              <Plus className="h-4 w-4" />
              Raise Permit
            </button>
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

          {/* Closure Modal */}
          {closureModalOpen && selectedPermitForClosure && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                <h3 className="mb-4 text-lg font-bold text-slate-800">
                  Request Closure
                </h3>
                <p className="mb-4 text-sm text-slate-600">
                  You are about to request closure for{" "}
                  {selectedPermitForClosure.template_name ||
                    `Permit #${selectedPermitForClosure.id}`}
                  . Please select the checker group to forward this request to.
                </p>

                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Forward To (User Group){" "}
                  <span className="text-red-500">*</span>
                </label>
                <select
                  className="mb-4 w-full rounded-lg border p-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  value={closureGroupId}
                  onChange={(e) => setClosureGroupId(e.target.value)}
                >
                  <option value="">-- Select Checker Group --</option>
                  {userGroups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>

                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Remarks (Optional)
                </label>
                <textarea
                  className="mb-6 w-full rounded-lg border p-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  rows={3}
                  value={closureRemarks}
                  onChange={(e) => setClosureRemarks(e.target.value)}
                  placeholder="Any comments regarding the closure..."
                ></textarea>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setClosureModalOpen(false);
                      setSelectedPermitForClosure(null);
                      setClosureRemarks("");
                      setClosureGroupId("");
                    }}
                    className="rounded-lg border px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleRequestClosure}
                    disabled={!closureGroupId}
                    className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-50"
                  >
                    Submit Request
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {view === "create" && (
        <div className="mx-auto max-w-5xl">
          <button
            onClick={() => setView("dashboard")}
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </button>

          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h2 className="mb-6 text-lg font-bold text-slate-900">
              Raise New Permit
            </h2>
            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Select Template
              </label>
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="h-11 w-full rounded-lg border bg-white px-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              >
                <option value="">-- Select Template --</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            {templateDetails && (
              <div className="mt-6 border-t pt-6">
                <h3 className="mb-4 text-md font-semibold text-slate-800">
                  Permit Details
                </h3>

                {/* Render Fields */}
                <div className="grid gap-4 sm:grid-cols-2">
                  {templateDetails.fields_config?.map((fieldConfig) => {
                    const fieldDef = fieldConfig.field_definition;
                    const required =
                      fieldConfig.required_override || fieldDef.is_required;
                    return (
                      <div
                        key={fieldDef.key}
                        className={
                          ["textarea", "multiselect", "multi_select"].includes(
                            fieldDef.field_type,
                          )
                            ? "sm:col-span-2"
                            : ""
                        }
                      >
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                          {fieldDef.label}{" "}
                          {required && <span className="text-red-500">*</span>}
                        </label>
                        {fieldDef.key === "contractor_name" ? (
                          <div className="flex flex-col gap-1">
                            <input
                              type="text"
                              disabled
                              className="w-full rounded-lg border bg-slate-50 p-3 text-sm text-slate-500 outline-none cursor-not-allowed"
                              value={formData.contractor_name || ""}
                            />
                            <p className="text-xs text-slate-400">
                              Auto-filled from your profile
                            </p>
                          </div>
                        ) : fieldDef.key === "permit_applicant" ? (
                          <div className="flex flex-col gap-1">
                            <input
                              type="text"
                              disabled
                              className="w-full rounded-lg border bg-slate-50 p-3 text-sm text-slate-500 outline-none cursor-not-allowed"
                              value={formData.permit_applicant || ""}
                            />
                            <p className="text-xs text-slate-400">
                              Auto-filled from your profile
                            </p>
                          </div>
                        ) : fieldDef.key === "location" ? (
                          <div className="flex gap-2">
                            <select
                              className="flex-1 rounded-lg border p-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                              value={locationParts.wing}
                              onChange={(e) =>
                                setLocationParts({
                                  ...locationParts,
                                  wing: e.target.value,
                                })
                              }
                            >
                              <option value="">Wing</option>
                              {["A", "B", "C", "D", "E", "F", "G"].map((w) => (
                                <option key={w} value={w}>
                                  {w}
                                </option>
                              ))}
                            </select>
                            <input
                              type="text"
                              placeholder="Floor"
                              className="flex-1 rounded-lg border p-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                              value={locationParts.floor}
                              onChange={(e) =>
                                setLocationParts({
                                  ...locationParts,
                                  floor: e.target.value,
                                })
                              }
                            />
                            <input
                              type="text"
                              placeholder="Area/Flat"
                              className="flex-1 rounded-lg border p-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                              value={locationParts.flat}
                              onChange={(e) =>
                                setLocationParts({
                                  ...locationParts,
                                  flat: e.target.value,
                                })
                              }
                            />
                          </div>
                        ) : fieldDef.field_type === "textarea" ? (
                          <textarea
                            className="w-full rounded-lg border p-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                            rows={3}
                            value={formData[fieldDef.key] || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                [fieldDef.key]: e.target.value,
                              })
                            }
                          />
                        ) : fieldDef.field_type === "multiselect" ||
                          fieldDef.field_type === "multi_select" ? (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
                            {(
                              fieldDef.validation_rules?.options ||
                              fieldDef.options ||
                              []
                            )?.map((opt) => (
                              <label
                                key={opt}
                                className="flex items-center gap-3 text-sm cursor-pointer rounded-xl border bg-slate-50/50 p-3 hover:bg-orange-50 hover:border-orange-200 transition-colors"
                              >
                                <input
                                  type="checkbox"
                                  checked={(
                                    formData[fieldDef.key] || []
                                  ).includes(opt)}
                                  onChange={(e) => {
                                    const curr = formData[fieldDef.key] || [];
                                    if (e.target.checked)
                                      setFormData({
                                        ...formData,
                                        [fieldDef.key]: [...curr, opt],
                                      });
                                    else
                                      setFormData({
                                        ...formData,
                                        [fieldDef.key]: curr.filter(
                                          (x) => x !== opt,
                                        ),
                                      });
                                  }}
                                  className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-600 accent-orange-600"
                                />
                                <span className="font-medium text-slate-700">
                                  {opt}
                                </span>
                              </label>
                            ))}
                          </div>
                        ) : (
                          <input
                            type={
                              fieldDef.field_type === "number"
                                ? "number"
                                : "text"
                            }
                            className={`rounded-lg border p-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 ${fieldDef.field_type === "number" ? "w-full sm:w-48" : "w-full"}`}
                            value={formData[fieldDef.key] || ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFormData({
                                ...formData,
                                [fieldDef.key]:
                                  fieldDef.field_type === "number" && val !== ""
                                    ? Number(val)
                                    : val,
                              });
                            }}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Render Checklist Questions */}
                {templateDetails.checklist_template?.questions?.length > 0 && (
                  <div className="mt-8">
                    <h3 className="mb-4 text-md font-semibold text-slate-800">
                      Checklist Points
                    </h3>
                    <div className="space-y-4">
                      {templateDetails.checklist_template.questions.map(
                        (q, idx) => (
                          <div
                            key={q.id}
                            className="rounded-lg border bg-slate-50 p-4"
                          >
                            <p className="text-sm font-medium text-slate-800 mb-3">
                              {idx + 1}. {q.question}
                            </p>
                            <div className="flex flex-wrap gap-4">
                              {(q.options && q.options.length > 0
                                ? q.options.map((o) => o.value)
                                : ["Yes", "No", "N/A"]
                              ).map((opt) => (
                                <label
                                  key={opt}
                                  className="flex items-center gap-2 text-sm cursor-pointer bg-white border px-4 py-2 rounded-lg hover:bg-orange-50"
                                >
                                  <input
                                    type="radio"
                                    name={`question_${q.id}`}
                                    checked={
                                      checklistResponse[q.id]?.answer === opt
                                    }
                                    onChange={() =>
                                      setChecklistResponse({
                                        ...checklistResponse,
                                        [q.id]: {
                                          question_id: q.id,
                                          answer: opt,
                                          remarks: "",
                                        },
                                      })
                                    }
                                    className="accent-orange-600 w-4 h-4"
                                  />
                                  {opt}
                                </label>
                              ))}
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}

                {/* Forward To / Approval Group */}
                <div className="mt-8 border-t pt-6">
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Forward To (User Group)
                  </label>
                  <select
                    value={selectedGroupId}
                    onChange={(e) => setSelectedGroupId(e.target.value)}
                    className="h-11 w-full max-w-sm rounded-lg border bg-white px-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  >
                    <option value="">-- Select User Group --</option>
                    {userGroups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 border-t pt-6 mt-6">
              <button
                onClick={() => setView("dashboard")}
                className="rounded-lg border px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Back
              </button>
              {templateDetails && (
                <button
                  onClick={handleCreateDraft}
                  className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700"
                >
                  Raise Permit
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
