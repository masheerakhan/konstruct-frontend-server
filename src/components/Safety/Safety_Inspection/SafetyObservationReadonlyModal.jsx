import React, { useEffect, useState } from "react";
import {
  X,
  AlertTriangle,
  Image as ImageIcon,
  CheckCircle2,
} from "lucide-react";
import {
  getSafetyObservationById,
  getUserDetailsById,
  GEtbyProjectID,
} from "../../../api";
import { resolveMediaUrl } from "./Safety_User_View/Observation_Dashboard/Makerdashboard";
// import { ThreadEntry } from "./SafetyChecklistHistoryModal";
import { ThreadEntry } from "./SafetyChecklistHistoryModal";
import { SignatureViewModal } from "./SafetyChecklistReadonlyModal";
import { UserRound, Eye, Signature } from "lucide-react";
import RiskMatrixModal from "./Safety_User_View/Observation_Dashboard/RiskMatrixModal";

const ObservationSignOffRow = ({ user, onView }) => {
  const hasSignature = Boolean(String(user?.signature || "").trim());

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-muted/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <UserRound className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {user.label}
          </p>
          <p className="text-sm font-bold text-foreground">
            {user.name}
            {user.designation && (
              <span className="ml-1.5 text-[11px] font-medium text-muted-foreground">
                ({user.designation})
              </span>
            )}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => onView(user)}
        disabled={!hasSignature}
        className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition ${
          hasSignature
            ? "border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
            : "cursor-not-allowed border border-border bg-muted text-muted-foreground"
        }`}
      >
        <Eye className="h-3.5 w-3.5" />
        View
      </button>
    </div>
  );
};

const ObservationSignOffSection = ({ detail, onViewSignature }) => {
  const users = [
    {
      role: "creator",
      label: "1. Raised By (ADL)",
      name: "ADL Checker",
      designation: "",
      signature: detail?.creator_signature || "",
    },
    {
      role: "maker",
      label: "2. Rectified By (Maker)",
      name: detail?.maker_name || "Maker",
      designation: detail?.maker_designation || "",
      signature:
        detail?.maker_rectify_signature || detail?.maker_signature || "",
    },
    {
      role: "checker",
      label: "3. Reviewed By (Checker)",
      name: detail?.checker_name || "Checker",
      designation: detail?.checker_designation || "",
      signature: detail?.checker_signature || "",
    },
    {
      role: "final_checker",
      label: "4. Final Approved By (ADL)",
      name: detail?.final_checker_name || "Final Checker",
      designation: detail?.final_checker_designation || "",
      signature: detail?.final_checker_signature || "",
    },
  ];

  let rejectionHistory = [];
  try {
    rejectionHistory = Array.isArray(detail?.rejection_history)
      ? detail.rejection_history
      : JSON.parse(detail?.rejection_history || "[]");
  } catch (e) {
    rejectionHistory = [];
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm mt-6 mb-6">
      <div className="mb-4">
        <h3 className="text-sm font-bold text-foreground">
          Workflow & Sign Off
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Signatures for the 4 stages of approval.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {users.map((u, i) => (
          <ObservationSignOffRow key={i} user={u} onView={onViewSignature} />
        ))}
      </div>

      {rejectionHistory.length > 0 && (
        <div className="mt-6 border-t pt-4">
          <h4 className="text-sm font-bold text-red-600 mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Rejection History ({rejectionHistory.length})
          </h4>
          <div className="space-y-3">
            {rejectionHistory.map((rej, i) => (
              <div
                key={i}
                className="bg-red-50 p-3 rounded-xl border border-red-100"
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-red-700">
                    Stage: {rej.stage.replace("_", " ")}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {formatDateTime(rej.timestamp)}
                  </span>
                </div>
                <p className="text-sm text-slate-700">
                  <span className="font-semibold">Reason:</span> {rej.remarks}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const formatDateTime = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  const datePart = date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const timePart = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  return `${datePart} · ${timePart}`;
};

const ReadonlyInfoValue = ({ label, value }) => (
  <div className="rounded-xl border border-border bg-muted/30 px-3 py-2">
    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
      {label}
    </p>
    <p className="mt-1 break-words text-sm font-semibold text-foreground">
      {String(value ?? "").trim() || "—"}
    </p>
  </div>
);

const ObservationInfoCard = ({ detail }) => {
  if (!detail) return null;

  const meta = detail.report_header_meta || {};

  const fields = [
    { label: "Format No.", value: meta.format_no || "ADL-OH&S-F012" },
    { label: "Revision No.", value: meta.revision_no || "R01" },
    { label: "Issued Date", value: "1st September 2025" },
    { label: "Revision Date", value: meta.revision_date || "—" },
    { label: "Project", value: detail.project_name || "—" },
    {
      label: "Date of Observation",
      value: detail.created_at
        ? new Date(detail.created_at).toLocaleDateString("en-GB")
        : "—",
    },
    {
      label: "Report No.",
      value: detail.id ? `AN-ADL-SHOR-${detail.id}` : "—",
    },
  ];

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm mb-6">
      <div className="mb-4">
        <h3 className="text-sm font-bold text-foreground">
          Observation Information
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          SAFETY & HOUSEKEEPING OBSERVATION REPORT
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {fields.map((field, idx) => (
          <ReadonlyInfoValue
            key={idx}
            label={field.label}
            value={field.value}
          />
        ))}
      </div>
    </div>
  );
};

const ObservationCard = ({ idx, title, children, status }) => (
  <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-xs font-bold text-white shadow-sm">
          {idx}
        </span>
        <h3 className="text-sm font-semibold leading-relaxed text-foreground sm:text-base">
          {title}
        </h3>
      </div>
      {status && (
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${status === "completed" || status === "approved" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}
        >
          {status.toUpperCase()}
        </span>
      )}
    </div>
    <div className="pl-11">{children}</div>
  </div>
);

export default function SafetyObservationReadonlyModal({
  open,
  onClose,
  checklistId,
}) {
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState(null);
  const [signatureUser, setSignatureUser] = useState(null);
  const [showRiskMatrix, setShowRiskMatrix] = useState(false);

  useEffect(() => {
    if (!open || !checklistId) {
      setDetail(null);
      return;
    }
    let mounted = true;
    const loadChecklist = async () => {
      try {
        setLoading(true);
        const res = await getSafetyObservationById(checklistId);
        const fetchedDetail = res?.data || null;

        if (fetchedDetail) {
          try {
            if (fetchedDetail.maker_id && !fetchedDetail.maker_name) {
              const mRes = await getUserDetailsById(fetchedDetail.maker_id);
              if (mRes?.data) {
                fetchedDetail.maker_name =
                  mRes.data.user_name || mRes.data.username || "Maker";
                fetchedDetail.maker_designation =
                  mRes.data.designation || mRes.data.role || "";
              }
            }
          } catch (e) {
            console.error("Error fetching maker details", e);
          }

          try {
            if (fetchedDetail.checker_id && !fetchedDetail.checker_name) {
              const cRes = await getUserDetailsById(fetchedDetail.checker_id);
              if (cRes?.data) {
                fetchedDetail.checker_name =
                  cRes.data.user_name || cRes.data.username || "Checker";
                fetchedDetail.checker_designation =
                  cRes.data.designation || cRes.data.role || "";
              }
            }
          } catch (e) {
            console.error("Error fetching checker details", e);
          }

          try {
            if (
              fetchedDetail.final_checker_id &&
              !fetchedDetail.final_checker_name
            ) {
              const fRes = await getUserDetailsById(
                fetchedDetail.final_checker_id,
              );
              if (fRes?.data) {
                fetchedDetail.final_checker_name =
                  fRes.data.user_name || fRes.data.username || "Final Checker";
                fetchedDetail.final_checker_designation =
                  fRes.data.designation || fRes.data.role || "";
              }
            }
          } catch (e) {
            console.error("Error fetching final checker details", e);
          }

          try {
            if (
              fetchedDetail.project_id &&
              (!fetchedDetail.project_name ||
                fetchedDetail.project_name === "—")
            ) {
              const pRes = await GEtbyProjectID(fetchedDetail.project_id);
              if (pRes?.data) {
                fetchedDetail.project_name =
                  pRes.data.project_name || pRes.data.name || "";
              }
            }
          } catch (e) {
            console.error("Error fetching project details", e);
          }
        }

        if (mounted) setDetail(fetchedDetail);
      } catch (err) {
        console.error("Failed to load observation detail", err);
        if (mounted) setDetail(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadChecklist();
    return () => {
      mounted = false;
    };
  }, [open, checklistId]);

  if (!open) return null;

  const renderHazards = (hazardStr) => {
    try {
      const arr =
        typeof hazardStr === "string" ? JSON.parse(hazardStr) : hazardStr;
      if (Array.isArray(arr)) {
        return (
          <div className="flex flex-wrap gap-2">
            {arr.map((h) => (
              <span
                key={h}
                className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700"
              >
                {h}
              </span>
            ))}
          </div>
        );
      }
    } catch (e) {
      return <p className="text-sm text-foreground">{hazardStr}</p>;
    }
    return <p className="text-sm text-foreground">{hazardStr}</p>;
  };

  return (
    <div className="fixed inset-0 z-[201] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="flex h-[95vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-border bg-background shadow-2xl">
        {/* HEADER */}
        <div className="flex items-start justify-between border-b border-border px-6 py-5 bg-white">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                Read Only View
              </span>
              {detail?.status && (
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${detail.status === "APPROVED" || detail.status === "CLOSED" ? "bg-green-100 text-green-700" : detail.status === "REJECTED" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}
                >
                  {detail.status.includes("PENDING")
                    ? "Pending"
                    : detail.status === "CLOSED" || detail.status === "APPROVED"
                      ? "Approved"
                      : detail.status.charAt(0).toUpperCase() +
                        detail.status.slice(1).toLowerCase()}
                </span>
              )}
              {(() => {
                let rCount = detail?.rejection_count || 0;
                if (!rCount) {
                  const r1 = detail?.reject_photographs?.length || 0;
                  const r2 = (detail?.closer_photographs || []).filter(
                    (p) => p.checker_comment && p.checker_comment.trim(),
                  ).length;
                  rCount = r1 + r2;
                }
                return rCount > 0 ? (
                  <span className="inline-flex rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
                    Rejected: {rCount} times
                  </span>
                ) : null;
              })()}
            </div>
            <h2 className="text-xl font-bold text-foreground">
              Safety Observation Preview
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Viewing observation details in read-only mode
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl border border-border bg-background p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          {loading ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Loading observation...
            </div>
          ) : detail ? (
            <div className="space-y-6">
              <ObservationInfoCard detail={detail} />
              {/* Q1: Unsafe Act / Condition */}
              <ObservationCard
                idx={1}
                title="What Unsafe Act / Condition Observed"
              >
                <div className="rounded-xl border border-border bg-muted/20 p-3 mb-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                    Category
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    {detail.unsafe_act_condition_category || "—"}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-muted/20 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                    Description
                  </p>
                  <p className="text-sm text-foreground">
                    {detail.unsafe_act_condition_description || "—"}
                  </p>
                </div>
              </ObservationCard>
              {/* Q2: Location */}
              <ObservationCard idx={2} title="Location">
                <div className="rounded-xl border border-border bg-muted/20 p-3 text-sm text-foreground">
                  {detail.location_combined || "—"}
                </div>
              </ObservationCard>
              {/* Q3: Photograph of Unsafe Act */}
              <ObservationCard
                idx={3}
                title="Photograph of Unsafe Act / Condition"
              >
                {detail.photograph_of_unsafe_act ? (
                  <div className="mt-2">
                    <img
                      src={resolveMediaUrl(detail.photograph_of_unsafe_act)}
                      alt="Unsafe Act"
                      className="h-64 w-full md:w-2/3 rounded-xl border border-border object-contain bg-slate-50"
                    />
                    {detail.photograph_of_unsafe_act_comment && (
                      <div className="mt-3 rounded-xl border border-border bg-muted/30 p-3 text-sm text-foreground">
                        <span className="font-semibold">Comment:</span>{" "}
                        {detail.photograph_of_unsafe_act_comment}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm italic text-muted-foreground">
                    No photograph provided
                  </p>
                )}
              </ObservationCard>
              {/* Q4: Hazard / Risk */}
              <ObservationCard idx={4} title="Hazard/Risk">
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Hazards
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowRiskMatrix(true)}
                      className="text-xs font-bold bg-orange-50 text-orange-600 hover:bg-orange-100 border border-orange-200 px-3 py-1.5 rounded-lg shadow-sm transition-colors"
                    >
                      View Risk Matrix
                    </button>
                  </div>
                  {renderHazards(detail.hazard_categories)}
                </div>
                {detail.risk && (
                  <div
                    className={`rounded-xl border p-3 ${
                      detail.risk === "Low Risk"
                        ? "border-green-200 bg-green-50 text-green-800"
                        : detail.risk === "Medium Risk"
                          ? "border-yellow-200 bg-yellow-50 text-yellow-800"
                          : detail.risk === "High Risk"
                            ? "border-red-200 bg-red-50 text-red-800"
                            : "border-border bg-muted/20 text-foreground"
                    }`}
                  >
                    <p
                      className={`text-xs font-semibold uppercase tracking-wide mb-1 ${
                        detail.risk === "Low Risk"
                          ? "text-green-600"
                          : detail.risk === "Medium Risk"
                            ? "text-yellow-600"
                            : detail.risk === "High Risk"
                              ? "text-red-600"
                              : "text-muted-foreground"
                      }`}
                    >
                      Risk Details
                    </p>
                    <p className="text-sm font-medium">{detail.risk}</p>
                  </div>
                )}
              </ObservationCard>
              {/* Q5: Name of Contractor */}
              <ObservationCard idx={5} title="Name of Contractor">
                <div className="rounded-xl border border-border bg-muted/20 p-3 text-sm text-foreground">
                  {detail.name_of_contractor || detail.contractor_name || "—"}
                </div>
              </ObservationCard>
              {/* Q6: Target Date */}
              <ObservationCard idx={6} title="Target Date">
                <div
                  className={`rounded-xl border p-3 text-sm font-medium ${
                    detail.risk === "Low Risk"
                      ? "border-green-200 bg-green-50 text-green-800"
                      : detail.risk === "Medium Risk"
                        ? "border-yellow-200 bg-yellow-50 text-yellow-800"
                        : detail.risk === "High Risk"
                          ? "border-red-200 bg-red-50 text-red-800"
                          : "border-border bg-muted/20 text-foreground"
                  }`}
                >
                  {detail.target_date
                    ? formatDateTime(detail.target_date)
                    : "—"}
                </div>
              </ObservationCard>
              {/* Q7: CA/PA To Be Taken */}
              <ObservationCard idx={7} title="CA/PA To Be Taken">
                {detail.ca_pa_combined ? (
                  <div className="rounded-xl border border-border bg-muted/20 p-3 text-sm text-foreground">
                    <div
                      dangerouslySetInnerHTML={{
                        __html: detail.ca_pa_combined,
                      }}
                      className="whitespace-pre-wrap"
                    />
                  </div>
                ) : (
                  <p className="text-sm italic text-amber-600 font-medium bg-amber-50 px-3 py-2 rounded-lg border border-amber-200 inline-block">
                    Pending rectification
                  </p>
                )}
              </ObservationCard>
              {/* Q8: Closer Photograph (Conversation UI) */}
              {(() => {
                const buildObservationThread = () => {
                  const thread = [];

                  // Maker closer photographs
                  const closer = detail.closer_photographs || [];
                  if (closer.length > 0) {
                    closer.forEach((p, index) => {
                      const baseTime = p.uploaded_at
                        ? new Date(p.uploaded_at).getTime()
                        : 0;
                      const makerTime = baseTime + index * 10;

                      thread.push({
                        role: "maker",
                        attemptNo: 0, // will be assigned below
                        actorName: detail.maker_name || "Maker",
                        action: "SUBMITTED",
                        answer: "",
                        comment: p.comment || "",
                        photoUrl: p.image || "",
                        isFinalImage: p.is_final_image === true,
                        signatureUrl:
                          detail.maker_rectify_signature ||
                          detail.maker_signature ||
                          "",
                        date: new Date(makerTime).toISOString(),
                      });

                      // If Checker left an individual comment on THIS photo, push a Checker bubble right after it!
                      if (p.checker_comment && p.checker_comment.trim()) {
                        thread.push({
                          role: "checker",
                          attemptNo: 0,
                          actorName: detail.checker_name || "Checker",
                          action: "REJECTED", // A comment usually implies rejection/feedback
                          answer: "",
                          comment: p.checker_comment,
                          photoUrl: p.image || "",
                          photoLabel: "View Commented Photo",
                          signatureUrl: detail.checker_signature || "",
                          date: new Date(makerTime + 1).toISOString(), // Exactly 1ms after Maker so it interleaves correctly
                        });
                      }
                    });
                  } else if (detail.closer_photograph) {
                    thread.push({
                      role: "maker",
                      attemptNo: 0,
                      actorName: detail.maker_name || "Maker",
                      action: "SUBMITTED",
                      answer: "",
                      comment: "Submitted for rectification",
                      photoUrl: detail.closer_photograph,
                      signatureUrl:
                        detail.maker_rectify_signature ||
                        detail.maker_signature ||
                        "",
                      date: detail.updated_at,
                    });
                  }

                  // Checker reject photographs
                  const rejects = detail.reject_photographs || [];
                  if (rejects.length > 0) {
                    rejects.forEach((p, index) => {
                      thread.push({
                        role: "checker",
                        attemptNo: 0,
                        actorName: detail.checker_name || "Checker",
                        action: "REJECTED",
                        answer: "",
                        comment: p.comment || "Rejected with photo",
                        photoUrl: p.image || "",
                        isFinalImage: p.is_final_image === true,
                        signatureUrl: detail.checker_signature || "",
                        date: p.uploaded_at || "",
                      });
                    });
                  }

                  // Sort thread by date (if date exists)
                  thread.sort(
                    (a, b) => new Date(a.date || 0) - new Date(b.date || 0),
                  );

                  // Fix attempt numbers: group entries by role and approximate time (within 1 min)
                  let currentMakerAttempt = 0;
                  let currentCheckerAttempt = 0;
                  let lastMakerDate = 0;
                  let lastCheckerDate = 0;

                  thread.forEach((entry) => {
                    const entryTime = new Date(entry.date || 0).getTime();
                    if (entry.role === "maker") {
                      if (
                        entryTime - lastMakerDate > 60000 ||
                        currentMakerAttempt === 0
                      ) {
                        // > 1 min difference = new attempt
                        currentMakerAttempt++;
                      }
                      entry.attemptNo = currentMakerAttempt;
                      entry.action =
                        entry.attemptNo === 1
                          ? "SUBMITTED"
                          : "REWORK_SUBMITTED";
                      lastMakerDate = entryTime;
                    } else {
                      if (
                        entryTime - lastCheckerDate > 60000 ||
                        currentCheckerAttempt === 0
                      ) {
                        currentCheckerAttempt++;
                      }
                      entry.attemptNo = currentCheckerAttempt;
                      lastCheckerDate = entryTime;
                    }
                  });

                  // If approved, we MUST show an Approved bubble from Checker
                  if (
                    detail.status === "APPROVED" ||
                    detail.status === "CLOSED"
                  ) {
                    thread.push({
                      role: "checker",
                      attemptNo:
                        currentCheckerAttempt > 0
                          ? currentCheckerAttempt + 1
                          : 1, // Final round
                      actorName: detail.checker_name || "Checker",
                      action: "APPROVED",
                      answer: "",
                      comment:
                        detail.checker_remarks || "Observation Approved.",
                      photoUrl: "",
                      signatureUrl: detail.checker_signature || "",
                      date: detail.updated_at,
                    });
                  }
                  // If rejected, we must show a rejection bubble for the main checker_remarks
                  else if (
                    (detail.status === "REJECTED" ||
                      detail.status === "PENDING_MAKER") &&
                    detail.checker_remarks
                  ) {
                    thread.push({
                      role: "checker",
                      attemptNo:
                        currentCheckerAttempt > 0
                          ? currentCheckerAttempt + 1
                          : 1, // Final round
                      actorName: detail.checker_name || "Checker",
                      action: "REJECTED",
                      answer: "",
                      comment: detail.checker_remarks,
                      photoUrl: detail.checker_reject_photo || "",
                      signatureUrl: detail.checker_signature || "",
                      date: detail.updated_at,
                    });
                  }

                  return thread;
                };

                const thread = buildObservationThread();

                return (
                  <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm mt-6">
                    <div className="flex w-full items-start gap-3 px-5 py-4 text-left border-b border-border/50 bg-muted/10">
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-xs font-bold text-white shadow-sm">
                        8
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold leading-snug text-foreground sm:text-base">
                          Closer Photograph
                        </p>
                      </div>
                    </div>
                    <div className="p-5">
                      {thread.length === 0 ? (
                        <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-amber-300 bg-amber-50 text-sm font-medium text-amber-700">
                          Pending rectification
                        </div>
                      ) : (
                        <div className="space-y-5">
                          {thread.map((entry, i) => (
                            <ThreadEntry
                              key={`${entry.role}-${i}`}
                              entry={entry}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
              {/* Checker remarks are now fully integrated into the conversation thread above */}{" "}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              No observation data found.
            </div>
          )}

          {detail && (
            <ObservationSignOffSection
              detail={detail}
              onViewSignature={setSignatureUser}
            />
          )}
        </div>
      </div>

      <SignatureViewModal
        open={!!signatureUser}
        user={signatureUser}
        onClose={() => setSignatureUser(null)}
      />
      <RiskMatrixModal
        open={showRiskMatrix}
        onClose={() => setShowRiskMatrix(false)}
      />
    </div>
  );
}
