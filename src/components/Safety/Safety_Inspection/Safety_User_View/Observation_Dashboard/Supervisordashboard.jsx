import React, { useState, useEffect } from "react";
import {
  Clock,
  Eye,
  CheckCircle,
  CheckCircle2,
  CalendarDays,
  ClipboardList,
  ArrowLeft,
  ImageIcon,
  Check,
  X as XIcon,
  Upload,
} from "lucide-react";

import {
  listSafetyChecklists,
  getSafetyChecklist,
  approveSafetyChecklist,
  resolveActiveProjectId,
} from "../../../../../api";

import { showToast } from "../../../../../utils/toast";
import {
  fileToBase64,
  getCurrentUserId,
} from "../../../../../utils/UserUtils";

// ─── Shared inline UI helpers ────────────────────────────────
const QuestionBadge = ({ number }) => (
  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-500 text-xs font-bold text-white shadow-sm">
    {number}
  </span>
);

const resolveMediaUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;

  const base =
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname === "localhost"
      ? "http://127.0.0.1:8001"
      : "https://konstruct.world/checklists";

  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${base}${clean}`;
};

const PhotoViewButton = ({ url, label = "View Photo" }) => {
  const finalUrl = resolveMediaUrl(url);
  if (!finalUrl) return null;

  return (
    <a
      href={finalUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100 hover:border-blue-300"
    >
      <Eye className="h-3.5 w-3.5" />
      {label}
    </a>
  );
};

const NoPhotoLabel = () => (
  <span className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-border bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground">
    <ImageIcon className="h-3.5 w-3.5" />
    No photo available
  </span>
);

const PhotoUploadArea = ({
  id,
  previewBase64,
  onFileChange,
  label = "Attach photo",
}) => (
  <div className="mt-3">
    <p className="mb-1.5 text-xs font-medium text-muted-foreground">{label}</p>
    {previewBase64 ? (
      <div className="relative inline-block">
        <img
          src={previewBase64}
          alt="Preview"
          className="h-20 w-20 rounded-lg border border-border object-cover shadow-sm"
        />
        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-white shadow">
          <Check className="h-3 w-3" />
        </span>
      </div>
    ) : (
      <label
        htmlFor={`photo-upload-${id}`}
        className="flex cursor-pointer items-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:bg-muted/60"
      >
        <Upload className="h-4 w-4" />
        <span>Click to upload or take a photo</span>
      </label>
    )}
    <input
      id={`photo-upload-${id}`}
      type="file"
      accept="image/*"
      onChange={onFileChange}
      className="hidden"
    />
  </div>
);

const YesNoButtons = ({ value, onChange }) => (
  <div className="flex flex-wrap gap-2 sm:flex-nowrap">
    {[
      {
        opt: "yes",
        label: "Yes",
        icon: <Check className="h-3.5 w-3.5" />,
        active:
          "border-green-500 bg-green-500 text-white shadow-green-200 shadow-md",
        idle: "border-green-200 bg-green-50 text-green-700 hover:bg-green-100",
      },
      {
        opt: "no",
        label: "No",
        icon: <XIcon className="h-3.5 w-3.5" />,
        active: "border-red-500 bg-red-500 text-white shadow-red-200 shadow-md",
        idle: "border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
      },
    ].map(({ opt, label, icon, active, idle }) => (
      <button
        key={opt}
        type="button"
        onClick={() => onChange(opt)}
        className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border-2 px-4 py-2.5 text-sm font-semibold transition-all ${value === opt ? active : idle}`}
      >
        {icon} {label}
      </button>
    ))}
  </div>
);

const YesNoNaButtons = ({ value, onChange }) => (
  <div className="flex flex-wrap gap-2 sm:flex-nowrap">
    {[
      {
        opt: "yes",
        label: "Yes",
        icon: <Check className="h-3.5 w-3.5" />,
        active:
          "border-green-500 bg-green-500 text-white shadow-green-200 shadow-md",
        idle: "border-green-200 bg-green-50 text-green-700 hover:bg-green-100",
      },
      {
        opt: "no",
        label: "No",
        icon: <XIcon className="h-3.5 w-3.5" />,
        active: "border-red-500 bg-red-500 text-white shadow-red-200 shadow-md",
        idle: "border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
      },
      {
        opt: "na",
        label: "N/A",
        icon: null,
        active:
          "border-slate-500 bg-slate-500 text-white shadow-slate-200 shadow-md",
        idle: "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100",
      },
    ].map(({ opt, label, icon, active, idle }) => (
      <button
        key={opt}
        type="button"
        onClick={() => onChange(opt)}
        className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border-2 px-4 py-2.5 text-sm font-semibold transition-all ${value === opt ? active : idle}`}
      >
        {icon} {label}
      </button>
    ))}
  </div>
);

export default function SupervisorDashboard() {
  const userId = getCurrentUserId();
  const isObservations = window.location.pathname.includes(
    "/safety/observations",
  );

  const [projectId, setProjectId] = useState("");
  const [checklists, setChecklists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [view, setView] = useState("dashboard"); // dashboard | inspection
  const [inspectionAnswers, setInspectionAnswers] = useState({});
  const [inspectorMedia, setInspectorMedia] = useState({});
  const [inspectionRemarks, setInspectionRemarks] = useState({});

  const fetchList = async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const params = {
        assigned_to_me: true,
        template_type: isObservations ? "OBSERVATION" : "SAFETY",
      };
      if (projectId) params.project_id = projectId;
      const res = await listSafetyChecklists(params);
      const data = res?.data;
      setChecklists(Array.isArray(data) ? data : (data?.results ?? []));
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.message ||
        "Failed to load checklists.";
      setError(msg);
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setProjectId(String(resolveActiveProjectId?.() || ""));
  }, []);

  useEffect(() => {
    if (view === "dashboard") {
      fetchList();
    }
  }, [userId, projectId, view]);

  const asSupervisor = checklists.filter(
    (c) => (c.current_assignee_role || "").toUpperCase() === "SUPERVISOR",
  );
  const supervisorAssigned = asSupervisor.filter(
    (c) => c.status === "in_progress",
  );
  const supervisorPending = supervisorAssigned;
  const supervisorCompleted = asSupervisor.filter(
    (c) => c.status === "completed",
  );

  const backToDashboard = () => {
    setView("dashboard");
    setDetail(null);
    setInspectionAnswers({});
    setInspectorMedia({});
    setInspectionRemarks({});
  };

  const openSupervisorInspection = async (cl) => {
    setDetail(null);
    setDetailLoading(true);
    setInspectionAnswers({});
    setInspectorMedia({});
    setInspectionRemarks({});
    try {
      const res = await getSafetyChecklist(cl.id);
      const data = res?.data || null;
      setDetail(data);
      const initial = {};
      (data?.items || []).forEach((item) => {
        const sub = (item.submissions || []).find(
          (s) => s.status === "pending_supervisor",
        );
        if (sub) initial[sub.id] = null;
      });
      setInspectionAnswers(initial);
      setView("inspection");
    } catch (err) {
      showToast(
        err?.response?.data?.detail || "Failed to load checklist",
        "error",
      );
    } finally {
      setDetailLoading(false);
    }
  };

  const handleInspectionAnswer = (submissionId, value) =>
    setInspectionAnswers((prev) => ({
      ...prev,
      [submissionId]: value,
    }));

  const handleInspectionSubmit = async () => {
    if (!detail) return;
    const inspectionRows =
      (detail.items || [])
        .map((item) => {
          const sub = (item.submissions || []).find(
            (s) => s && s.status === "pending_supervisor",
          );
          return sub ? { item, sub } : null;
        })
        .filter(Boolean) || [];
    const allSubs = inspectionRows.map(({ sub }) => sub);

    if (allSubs.length === 0) {
      showToast("No items to review", "error");
      return;
    }
    const missingRequiredPhoto = inspectionRows.find(
      ({ item, sub }) =>
        item.photo_required && !(inspectorMedia[sub.id] || sub.has_photo),
    );
    if (missingRequiredPhoto) {
      showToast(
        `Photo is required for "${missingRequiredPhoto.item.title}".`,
        "error",
      );
      return;
    }
    const naSubs = allSubs.filter((s) => inspectionAnswers[s.id] === "na");
    const missingNaRemark = naSubs.find(
      (s) => !(inspectionRemarks[s.id] || "").trim(),
    );
    if (missingNaRemark) {
      showToast("Please add remark for all N/A answers.", "error");
      return;
    }

    setSubmitting(true);
    try {
      const submissions = allSubs.map((sub) => {
        const answer = inspectionAnswers[sub.id] || "yes";
        const row = { submission_id: sub.id, answer };
        const b64 = inspectorMedia[sub.id];
        if (b64) row.inspector_media_base64 = b64;
        if (answer === "na") {
          row.supervisor_remarks = (inspectionRemarks[sub.id] || "").trim();
        }
        return row;
      });
      await approveSafetyChecklist(detail.id, { submissions });
      const hasRejection = submissions.some((s) => s.answer === "no");
      showToast(
        hasRejection
          ? "Rejected items sent back to Maker."
          : "Sent to Checker for final approval.",
        "success",
      );
      backToDashboard();
      fetchList();
    } catch (err) {
      showToast(err?.response?.data?.detail || "Submit failed", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/40 p-4 sm:p-6 md:p-10">
      <div className="mx-auto max-w-4xl">
        {!userId && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            User not found in session.
          </div>
        )}

        {loading && (
          <div className="py-8 text-center text-muted-foreground">Loading…</div>
        )}

        {!loading && error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            {/* ═══ INSPECTION VIEW ═══ */}
            {view === "inspection" && detail && (
              <section>
                <button
                  type="button"
                  onClick={backToDashboard}
                  className="mb-4 inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Dashboard
                </button>

                <div className="mb-6 rounded-xl border bg-card p-5 shadow-sm">
                  <h1 className="text-lg font-bold text-foreground sm:text-xl">
                    {detail.name}
                  </h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {(detail.items || []).length} questions • Select Yes or No
                    for each item
                  </p>
                </div>

                <div className="space-y-4">
                  {(detail.items || []).map((item, idx) => {
                    const sub = (item.submissions || []).find(
                      (s) => s.status === "pending_supervisor",
                    );
                    if (!sub) return null;
                    const val = inspectionAnswers[sub.id];

                    return (
                      <div
                        key={item.id}
                        className="rounded-xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
                      >
                        <div className="mb-4 flex items-start gap-3">
                          <QuestionBadge number={idx + 1} />
                          <p className="pt-1 text-sm font-semibold text-foreground sm:text-base">
                            {item.title}
                          </p>
                        </div>

                        <div className="space-y-3">
                          <YesNoNaButtons
                            value={val}
                            onChange={(v) => handleInspectionAnswer(sub.id, v)}
                          />
                          {val === "na" && (
                            <div>
                              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                                Remark (required for N/A)
                              </label>
                              <textarea
                                rows={2}
                                value={inspectionRemarks[sub.id] || ""}
                                onChange={(e) =>
                                  setInspectionRemarks((prev) => ({
                                    ...prev,
                                    [sub.id]: e.target.value,
                                  }))
                                }
                                className="w-full rounded-lg border border-border bg-muted/30 p-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                placeholder="Write supervisor remark for N/A"
                              />
                            </div>
                          )}

                          <div className="pt-1">
                            {sub.has_photo && sub.photo_url ? (
                              <PhotoViewButton
                                url={sub.photo_url}
                                label="View Maker Photo"
                              />
                            ) : (
                              <NoPhotoLabel />
                            )}
                          </div>

                          <PhotoUploadArea
                            id={`sup-insp-${sub.id}`}
                            previewBase64={inspectorMedia[sub.id]}
                            label={
                              item.photo_required
                                ? "Attach supervisor photo (required)"
                                : "Attach supervisor photo (optional)"
                            }
                            onFileChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              try {
                                const base64 = await fileToBase64(file);
                                setInspectorMedia((prev) => ({
                                  ...prev,
                                  [sub.id]: base64,
                                }));
                              } catch {
                                showToast("Failed to read image file", "error");
                              }
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6">
                  <button
                    type="button"
                    onClick={handleInspectionSubmit}
                    disabled={submitting}
                    className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-orange-400 to-orange-500 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-200 transition-all hover:shadow-xl hover:shadow-orange-300 disabled:opacity-60"
                  >
                    {submitting ? "Submitting…" : "Submit Review"}
                  </button>
                </div>
              </section>
            )}

            {/* ═══ DASHBOARD VIEW ═══ */}
            {view === "dashboard" && (
              <section>
                <div className="mb-6 flex flex-wrap items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
                    <ClipboardList className="h-5 w-5 text-orange-500" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-foreground sm:text-2xl">
                      Supervisor Dashboard
                    </h1>
                    <p className="text-sm text-muted-foreground">
                      Review and forward inspections
                    </p>
                  </div>
                </div>

                {/* Counters */}
                <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    {
                      label: "Assigned",
                      icon: <Clock className="h-3.5 w-3.5" />,
                      color: "hsl(35, 90%, 50%)",
                      count: supervisorAssigned.length,
                    },
                    {
                      label: "Pending",
                      icon: <Eye className="h-3.5 w-3.5" />,
                      color: "hsl(280, 70%, 50%)",
                      count: supervisorPending.length,
                    },
                    {
                      label: "Completed",
                      icon: <CheckCircle className="h-3.5 w-3.5" />,
                      color: "hsl(145, 65%, 42%)",
                      count: supervisorCompleted.length,
                    },
                    {
                      label: "Total",
                      icon: <CalendarDays className="h-3.5 w-3.5" />,
                      color: "hsl(220, 70%, 50%)",
                      count: asSupervisor.length,
                    },
                  ].map(({ label, icon, color, count }) => (
                    <div
                      key={label}
                      className="rounded-xl border bg-card p-4 shadow-sm"
                    >
                      <div
                        className="mb-1 flex items-center gap-1.5"
                        style={{ color }}
                      >
                        {icon}
                        <span className="text-xs font-medium">{label}</span>
                      </div>
                      <p className="text-2xl font-bold text-foreground">
                        {count}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Assigned inspections */}
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <h2 className="text-sm font-semibold text-foreground sm:text-base">
                      Assigned Inspections
                    </h2>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      {supervisorAssigned.length}
                    </span>
                  </div>

                  <div
                    className={`rounded-xl border bg-card shadow-sm ${isObservations ? "max-h-[350px] overflow-y-auto custom-scrollbar" : ""}`}
                  >
                    {supervisorAssigned.length === 0 ? (
                      <p className="p-4 text-sm text-muted-foreground">
                        No items
                      </p>
                    ) : (
                      supervisorAssigned.map((item) => (
                        <div
                          key={item.id}
                          className="flex flex-col gap-3 border-b border-border/50 p-4 last:border-0 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div>
                            <p className="font-medium text-foreground">
                              {item.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {item.created_at
                                ? new Date(item.created_at).toLocaleDateString()
                                : ""}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => openSupervisorInspection(item)}
                            className="rounded-lg bg-gradient-to-r from-orange-400 to-orange-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:shadow-md"
                          >
                            Start Review
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
