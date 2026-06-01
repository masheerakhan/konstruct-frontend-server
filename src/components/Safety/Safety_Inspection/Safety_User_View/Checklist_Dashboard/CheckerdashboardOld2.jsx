import React, { useState, useEffect, useRef } from "react";
import {
    Clock,
    Eye,
    CheckCircle,
    CalendarDays,
    ClipboardCheck,
    ArrowLeft,
    ImageIcon,
    X as XIcon,
    Check,
    Upload,
} from "lucide-react";

import { getCurrentUserId } from "../../../../../utils/UserUtils";
import {
  approveSafetyChecklist,
  getSafetyChecklist,
  listSafetyChecklists,
  rejectSafetyChecklist,
  resolveActiveProjectId,
} from "../../../../../api";
import { showToast } from "../../../../../utils/toast";
import SignatureCanvas from "react-signature-canvas";

// ─── Shared inline UI helpers ────────────────────────────────
const QuestionBadge = ({ number }) => (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-500 text-xs font-bold text-white shadow-sm">
        {number}
    </span>
);

const PhotoViewButton = ({ url, label = "View Photo" }) => (
    <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100 hover:border-blue-300"
    >
        <Eye className="h-3.5 w-3.5" />
        {label}
    </a>
);

const NoPhotoLabel = () => (
    <span className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-border bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground">
        <ImageIcon className="h-3.5 w-3.5" />
        No photo available
    </span>
);

const PhotoUploadArea = ({ id, previewBase64, onFileChange, label = "Attach photo" }) => {
    const previewUrl = previewBase64
        ? typeof previewBase64 === "string"
            ? previewBase64
            : URL.createObjectURL(previewBase64)
        : null;

    return (
        <div className="mt-3">
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">{label}</p>
            {previewUrl ? (
                <div className="relative inline-block">
                    <img
                        src={previewUrl}
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
};

const YesNoButtons = ({ value, onChange }) => (
    <div className="flex gap-2">
        {[
            { opt: "yes", label: "Yes", icon: <Check className="h-3.5 w-3.5" />, active: "border-green-500 bg-green-500 text-white shadow-green-200 shadow-md", idle: "border-green-200 bg-green-50 text-green-700 hover:bg-green-100" },
            { opt: "no", label: "No", icon: <XIcon className="h-3.5 w-3.5" />, active: "border-red-500 bg-red-500 text-white shadow-red-200 shadow-md", idle: "border-red-200 bg-red-50 text-red-700 hover:bg-red-100" },
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
    <div className="flex gap-2">
        {[
            { opt: "yes", label: "Yes", icon: <Check className="h-3.5 w-3.5" />, active: "border-green-500 bg-green-500 text-white shadow-green-200 shadow-md", idle: "border-green-200 bg-green-50 text-green-700 hover:bg-green-100" },
            { opt: "no", label: "No", icon: <XIcon className="h-3.5 w-3.5" />, active: "border-red-500 bg-red-500 text-white shadow-red-200 shadow-md", idle: "border-red-200 bg-red-50 text-red-700 hover:bg-red-100" },
            { opt: "na", label: "N/A", icon: null, active: "border-slate-500 bg-slate-500 text-white shadow-slate-200 shadow-md", idle: "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100" },
        ].map(({ opt, label, icon, active, idle }) => (
            <button
                key={opt}
                type="button"
                onClick={() => onChange(opt)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border-2 px-3 py-2.5 text-sm font-semibold transition-all ${value === opt ? active : idle}`}
            >
                {icon} {label}
            </button>
        ))}
    </div>
);

const RemarksBubble = ({ label, text }) => (
    <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
        <span className="font-semibold">{label}:</span> {text}
    </div>
);

// ─────────────────────────────────────────────
// CheckerDashboard
// ─────────────────────────────────────────────
export default function CheckerDashboard() {
    const userId = getCurrentUserId();

    const [projectId, setProjectId] = useState("");
    const [checklists, setChecklists] = useState([]);
    const [checkerBucketByChecklist, setCheckerBucketByChecklist] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [detail, setDetail] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [view, setView] = useState("dashboard"); // "dashboard" | "inspection" | "verification"
    const [inspectionAnswers, setInspectionAnswers] = useState({});
    const [verificationAnswers, setVerificationAnswers] = useState({});
    const [reviewerMedia, setReviewerMedia] = useState({});
    const [inspectionRemarks, setInspectionRemarks] = useState({});
    const [verificationRemarks, setVerificationRemarks] = useState({});
    const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
    const [pendingApprovePayload, setPendingApprovePayload] = useState(null);
    const [signatureSubmitting, setSignatureSubmitting] = useState(false);
    const sigCanvasRef = useRef(null);

    // ── data fetching ───────────────────────────────────────────
    const fetchList = async () => {
        if (!userId) return;
        setLoading(true);
        setError(null);
        try {
            const params = { assigned_to_me: true };
            if (projectId) params.project_id = projectId;
            const res = await listSafetyChecklists(params);
            const data = res?.data;
            const list = Array.isArray(data) ? data : data?.results ?? [];
            setChecklists(list);

            const checkerInProgress = list.filter(
                (c) =>
                    (c.current_assignee_role || "").toUpperCase() === "CHECKER" &&
                    c.status === "in_progress"
            );
            if (!checkerInProgress.length) {
                setCheckerBucketByChecklist({});
                return;
            }

            const details = await Promise.all(
                checkerInProgress.map(async (c) => {
                    try {
                        const dRes = await getSafetyChecklist(c.id);
                        const detailData = dRes?.data || null;
                        const allSubs =
                            (detailData?.items || [])
                                .flatMap((item) => item.submissions || [])
                                .filter(Boolean) || [];
                        const hasReworkPending = allSubs.some(
                            (s) => s.status === "pending_checker" && s.checker_id != null
                        );
                        return [c.id, hasReworkPending ? "pending" : "assigned"];
                    } catch {
                        return [c.id, "assigned"];
                    }
                })
            );
            setCheckerBucketByChecklist(Object.fromEntries(details));
        } catch (err) {
            const msg = err?.response?.data?.detail || err?.message || "Failed to load checklists.";
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
        fetchList();
    }, [userId, projectId]);

    // ── derived lists ───────────────────────────────────────────
    const asChecker = checklists.filter((c) => (c.current_assignee_role || "").toUpperCase() === "CHECKER");
    const checkerAssigned = asChecker.filter(
        (c) => c.status === "in_progress" && checkerBucketByChecklist[c.id] !== "pending"
    );
    const checkerPending = asChecker.filter(
        (c) => c.status === "in_progress" && checkerBucketByChecklist[c.id] === "pending"
    );
    const checkerCompleted = asChecker.filter((c) => c.status === "completed");

    const pendingCheckerItems =
        detail?.items?.flatMap((item) => {
            const subs = item.submissions || [];
            return subs
                .filter((s) => s.status === "pending_checker" && s.checker_id != null)
                .map((sub) => ({ item, sub }));
        }) ?? [];

    // ── navigation ──────────────────────────────────────────────
    const backToDashboard = () => {
        setView("dashboard");
        setDetail(null);
        setInspectionAnswers({});
        setVerificationAnswers({});
        setReviewerMedia({});
        setInspectionRemarks({});
        setVerificationRemarks({});
        setIsSignatureModalOpen(false);
        setPendingApprovePayload(null);
    };

    // ── open helpers ────────────────────────────────────────────
    const openAssignedInspection = async (cl) => {
        setDetail(null);
        setDetailLoading(true);
        setInspectionAnswers({});
        setReviewerMedia({});
        setInspectionRemarks({});
        try {
            const res = await getSafetyChecklist(cl.id);
            const data = res?.data || null;
            setDetail(data);
            const initial = {};
            (data?.items || []).forEach((item) => {
                const sub = (item.submissions || []).find(
                    (s) => s.status === "pending_checker" && s.checker_id == null
                );
                if (sub) initial[sub.id] = null;
            });
            setInspectionAnswers(initial);
            setView("inspection");
        } catch (err) {
            showToast(err?.response?.data?.detail || "Failed to load checklist", "error");
        } finally {
            setDetailLoading(false);
        }
    };

    const openPendingVerification = async (cl) => {
        setDetail(null);
        setDetailLoading(true);
        setVerificationAnswers({});
        setReviewerMedia({});
        setVerificationRemarks({});
        try {
            const res = await getSafetyChecklist(cl.id);
            const data = res?.data || null;
            setDetail(data);
            const initial = {};
            (data?.items || []).forEach((entry) => {
                const match = (entry.submissions || []).find((s) => s.status === "pending_checker");
                if (match && (match.maker_remarks || match.has_photo || (match.images || []).length)) {
                    initial[match.id] = "yes";
                }
            });
            setVerificationAnswers(initial);
            setView("verification");
        } catch (err) {
            showToast(err?.response?.data?.detail || "Failed to load checklist", "error");
        } finally {
            setDetailLoading(false);
        }
    };

    // ── action handlers ─────────────────────────────────────────
    const handleInspectionAnswer = (submissionId, value) =>
        setInspectionAnswers((prev) => ({ ...prev, [submissionId]: value }));

    const handleInspectionSubmit = async () => {
        if (!detail) return;
        const inspectionRows = (detail.items || [])
            .map((item) => {
                const sub = (item.submissions || []).find(
                    (s) => s && s.status === "pending_checker" && s.checker_id == null
                );
                return sub ? { item, sub } : null;
            })
            .filter(Boolean);
        const allSubs = inspectionRows.map(({ sub }) => sub);
        if (allSubs.length === 0) { showToast("No items to inspect", "error"); return; }
        const missingRequiredPhoto = inspectionRows.find(
            ({ item, sub }) => item.photo_required && !(reviewerMedia[sub.id] || sub.has_photo)
        );
        if (missingRequiredPhoto) {
            showToast(`Photo is required for "${missingRequiredPhoto.item.title}".`, "error");
            return;
        }
        const naSubs = allSubs.filter((s) => inspectionAnswers[s.id] === "na");
        const missingNaRemark = naSubs.find((s) => !(inspectionRemarks[s.id] || "").trim());
        if (missingNaRemark) {
            showToast("Please add remark for all N/A answers.", "error");
            return;
        }

        const failIds = allSubs.filter((s) => inspectionAnswers[s.id] === "no").map((s) => s.id);
        setSubmitting(true);
        try {
            if (failIds.length > 0) {
                const rejections = failIds.map((submissionId) => ({
                    submission_id: submissionId,
                    checker_remarks: inspectionRemarks[submissionId] || "",
                }));

                const formData = new FormData();
                formData.append("submission_ids", JSON.stringify(failIds));
                formData.append("rejections", JSON.stringify(rejections));

                rejections.forEach((rej) => {
                    const file = reviewerMedia[rej.submission_id];
                    if (file) {
                        formData.append("reviewer_media", file);
                    }
                });

                await rejectSafetyChecklist(detail.id, formData);
                showToast("Inspection submitted. Fix requests sent to Maker.", "success");

            } else {
                const submissions = allSubs.map((sub) => {
                    const row = {
                        submission_id: sub.id,
                        answer: inspectionAnswers[sub.id] || "yes",
                    };

                    if ((inspectionAnswers[sub.id] || "yes") === "na") {
                        row.checker_remarks = (inspectionRemarks[sub.id] || "").trim();
                    }

                    return row;
                });
                setPendingApprovePayload({ submissions });
                setIsSignatureModalOpen(true);
                return;
            }
            backToDashboard();
            fetchList();
        } catch (err) {
            showToast(err?.response?.data?.detail || "Submit inspection failed", "error");
        } finally {
            setSubmitting(false);
        }
    };

    const handleVerificationAnswer = (submissionId, value) =>
        setVerificationAnswers((prev) => ({ ...prev, [submissionId]: value }));

    const handleVerificationSubmit = async () => {
        if (!detail) return;
        const verificationRows = pendingCheckerItems || [];
        const subs = verificationRows.map(({ sub }) => sub);
        if (subs.length === 0) { showToast("No items pending verification", "error"); return; }
        const missingRequiredPhoto = verificationRows.find(
            ({ item, sub }) => item.photo_required && !(reviewerMedia[sub.id] || sub.has_photo)
        );
        if (missingRequiredPhoto) {
            showToast(`Photo is required for "${missingRequiredPhoto.item.title}".`, "error");
            return;
        }
        const naSubs = subs.filter((s) => verificationAnswers[s.id] === "na");
        const missingNaRemark = naSubs.find((s) => !(verificationRemarks[s.id] || "").trim());
        if (missingNaRemark) {
            showToast("Please add remark for all N/A answers.", "error");
            return;
        }

        const rejectIds = subs.filter((s) => verificationAnswers[s.id] === "no").map((s) => s.id);
        setSubmitting(true);
        try {
            if (rejectIds.length > 0) {
                const rejections = rejectIds.map((submissionId) => ({
                    submission_id: submissionId,
                    checker_remarks: verificationRemarks[submissionId] || "",
                }));

                const formData = new FormData();
                formData.append("submission_ids", JSON.stringify(rejectIds));
                formData.append("rejections", JSON.stringify(rejections));

                rejections.forEach((rej) => {
                    const file = reviewerMedia[rej.submission_id];
                    if (file) {
                        formData.append("reviewer_media", file);
                    }
                });

                await rejectSafetyChecklist(detail.id, formData);
                showToast("Rejected fixes sent back to Maker.", "success");
            } else {
                const submissions = subs.map((sub) => {
                    const row = {
                        submission_id: sub.id,
                        answer: verificationAnswers[sub.id] || "yes",
                    };

                    if ((verificationAnswers[sub.id] || "yes") === "na") {
                        row.checker_remarks = (verificationRemarks[sub.id] || "").trim();
                    }

                    return row;
                });

                setPendingApprovePayload({ submissions });
                setIsSignatureModalOpen(true);
                return;
            }
            backToDashboard();
            fetchList();
        } catch (err) {
            showToast(err?.response?.data?.detail || "Verification submit failed", "error");
        } finally {
            setSubmitting(false);
        }
    };

    const handleCloseSignatureModal = () => {
        if (signatureSubmitting) return;
        setIsSignatureModalOpen(false);
        setPendingApprovePayload(null);
        if (sigCanvasRef.current) sigCanvasRef.current.clear();
    };

    const handleSubmitWithSignature = async () => {
        if (!detail || !pendingApprovePayload) return;
        if (!sigCanvasRef.current || sigCanvasRef.current.isEmpty()) {
            showToast("Please provide your signature.", "error");
            return;
        }
        const dataUrl = sigCanvasRef.current.toDataURL("image/png");
        const base64Part = dataUrl.split(",")[1] || "";
        if (!base64Part) {
            showToast("Could not capture signature. Try again.", "error");
            return;
        }
        const binary = atob(base64Part);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
        const signatureFile = new File(
            [bytes],
            `checker-signature-${detail.id}.png`,
            { type: "image/png" }
        );
        const formData = new FormData();
        formData.append("submissions", JSON.stringify(pendingApprovePayload.submissions || []));
        (pendingApprovePayload.submissions || []).forEach((sub) => {
            const file = reviewerMedia[sub.submission_id];
            if (file) {
                formData.append("reviewer_media", file);
            }
        });
        formData.append("checker_signature", signatureFile);
        setSignatureSubmitting(true);
        try {
            await approveSafetyChecklist(detail.id, formData);
            showToast("Verification approved successfully.", "success");
            handleCloseSignatureModal();
            backToDashboard();
            fetchList();
        } catch (err) {
            showToast(err?.response?.data?.detail || "Signature submit failed", "error");
        } finally {
            setSignatureSubmitting(false);
        }
    };

    // ── render ───────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-muted/40 p-4 sm:p-6 md:p-10">
            <div className="mx-auto max-w-4xl">

                {!userId && (
                    <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                        User not found in session. Log in or ensure USER_DATA is set in localStorage.
                    </div>
                )}

                {loading && <div className="py-8 text-center text-muted-foreground">Loading…</div>}

                {!loading && error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>
                )}

                {!loading && !error && (
                    <>
                        {/* ═══ VIEW: INSPECTION ═══ */}
                        {view === "inspection" && detail && (
                            <section>
                                <button type="button" onClick={backToDashboard}
                                    className="mb-4 inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                                    <ArrowLeft className="h-4 w-4" /> Back to Dashboard
                                </button>

                                <div className="mb-6 rounded-xl border bg-card p-5 shadow-sm">
                                    <h1 className="text-lg font-bold text-foreground sm:text-xl">{detail.name}</h1>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        {(detail.items || []).length} questions • Select Yes or No for each item
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    {(detail.items || []).map((item, idx) => {
                                        const sub = (item.submissions || []).find(
                                            (s) => s && s.status === "pending_checker" && s.checker_id == null
                                        );
                                        if (!sub) return null;
                                        const val = inspectionAnswers[sub.id];
                                        return (
                                            <div key={item.id} className="rounded-xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
                                                <div className="mb-4 flex items-start gap-3">
                                                    <QuestionBadge number={idx + 1} />
                                                    <p className="pt-1 text-sm font-semibold text-foreground sm:text-base">{item.title}</p>
                                                </div>

                                                <div className="space-y-3">
                                                    <YesNoNaButtons value={val} onChange={(v) => handleInspectionAnswer(sub.id, v)} />
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
                                                                placeholder="Write checker remark for N/A"
                                                            />
                                                        </div>
                                                    )}

                                                    <div className="pt-1">
                                                        {sub.has_photo && sub.photo_url ? (
                                                            <PhotoViewButton url={sub.photo_url} label="View Maker Photo" />
                                                        ) : (
                                                            <NoPhotoLabel />
                                                        )}
                                                    </div>

                                                    <PhotoUploadArea
                                                        id={`checker-insp-${sub.id}`}
                                                        previewBase64={reviewerMedia[sub.id]}
                                                        label={item.photo_required ? "Attach photo with your decision (required)" : "Attach photo with your decision (optional)"}
                                                        onFileChange={async (e) => {
                                                            const file = e.target.files?.[0];
                                                            if (!file) return;
                                                            try {
                                                                setReviewerMedia((prev) => ({ ...prev, [sub.id]: file }));
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
                                    <button type="button" onClick={handleInspectionSubmit} disabled={submitting}
                                        className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-orange-400 to-orange-500 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-200 transition-all hover:shadow-xl hover:shadow-orange-300 disabled:opacity-60">
                                        {submitting ? "Submitting…" : "Submit Inspection"}
                                    </button>
                                </div>
                            </section>
                        )}

                        {/* ═══ VIEW: VERIFICATION ═══ */}
                        {view === "verification" && detail && (
                            <section>
                                <button type="button" onClick={backToDashboard}
                                    className="mb-4 inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                                    <ArrowLeft className="h-4 w-4" /> Back to Dashboard
                                </button>

                                <div className="mb-6 flex items-center justify-between rounded-xl border bg-card p-5 shadow-sm">
                                    <div>
                                        <p className="text-base font-bold text-foreground sm:text-lg">{detail.name}</p>
                                        <p className="text-sm text-muted-foreground">{pendingCheckerItems.length} item(s) to verify</p>
                                    </div>
                                    <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-600">
                                        Fix Submitted
                                    </span>
                                </div>

                                <div className="space-y-4">
                                    {pendingCheckerItems.length === 0 ? (
                                        <p className="py-8 text-center text-sm text-muted-foreground">No items pending verification.</p>
                                    ) : (
                                        pendingCheckerItems.map(({ item, sub }, idx) => {
                                            const val = verificationAnswers[sub.id] || "yes";
                                            return (
                                                <div key={sub.id} className="rounded-xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
                                                    <div className="mb-4 flex items-start gap-3">
                                                        <QuestionBadge number={idx + 1} />
                                                        <p className="pt-1 text-sm font-semibold text-foreground sm:text-base">{item.title}</p>
                                                    </div>

                                                    <div className="space-y-3">
                                                        {sub.maker_remarks && (
                                                            <RemarksBubble label="Fix Applied" text={sub.maker_remarks} />
                                                        )}
                                                        {sub.supervisor_remarks && (
                                                            <RemarksBubble label="Supervisor" text={sub.supervisor_remarks} />
                                                        )}
                                                        {sub.checker_remarks && (
                                                            <RemarksBubble label="Checker" text={sub.checker_remarks} />
                                                        )}

                                                        <div>
                                                            {sub.has_photo && sub.photo_url ? (
                                                                <PhotoViewButton url={sub.photo_url} label="View Current Photo" />
                                                            ) : (
                                                                <NoPhotoLabel />
                                                            )}
                                                        </div>

                                                        <PhotoUploadArea
                                                            id={`checker-ver-${sub.id}`}
                                                            previewBase64={reviewerMedia[sub.id]}
                                                            label={item.photo_required ? "Attach photo with verification (required)" : "Attach photo with verification (optional)"}
                                                            onFileChange={async (e) => {
                                                                const file = e.target.files?.[0];
                                                                if (!file) return;
                                                                try {
                                                                    // const base64 = await fileToBase64(file);
                                                                    // setReviewerMedia((prev) => ({ ...prev, [sub.id]: base64 }));
                                                                    setReviewerMedia((prev) => ({ ...prev, [sub.id]: file }));
                                                                } catch {
                                                                    showToast("Failed to read image file", "error");
                                                                }
                                                            }}
                                                        />

                                                        <YesNoNaButtons value={val} onChange={(v) => handleVerificationAnswer(sub.id, v)} />
                                                        {val === "na" && (
                                                            <div>
                                                                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                                                                    Remark (required for N/A)
                                                                </label>
                                                                <textarea
                                                                    rows={2}
                                                                    value={verificationRemarks[sub.id] || ""}
                                                                    onChange={(e) =>
                                                                        setVerificationRemarks((prev) => ({
                                                                            ...prev,
                                                                            [sub.id]: e.target.value,
                                                                        }))
                                                                    }
                                                                    className="w-full rounded-lg border border-border bg-muted/30 p-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                                                    placeholder="Write checker remark for N/A"
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>

                                {pendingCheckerItems.length > 0 && (
                                    <div className="mt-6">
                                        <button type="button" onClick={handleVerificationSubmit} disabled={submitting}
                                            className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-orange-400 to-orange-500 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-200 transition-all hover:shadow-xl hover:shadow-orange-300 disabled:opacity-60">
                                            {submitting ? "Submitting…" : "Submit Verification"}
                                        </button>
                                    </div>
                                )}
                            </section>
                        )}

                        {/* ═══ VIEW: DASHBOARD ═══ */}
                        {view === "dashboard" && (
                            <section>
                                {/* Header */}
                                <div className="mb-6 flex flex-wrap items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
                                        <ClipboardCheck className="h-5 w-5 text-orange-500" />
                                    </div>
                                    <div>
                                        <h1 className="text-xl font-bold text-foreground sm:text-2xl">Checker Dashboard</h1>
                                        <p className="text-sm text-muted-foreground">Manage your inspections</p>
                                    </div>
                                </div>

                                {/* Counter cards */}
                                <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
                                    {[
                                        { key: "assigned", label: "Assigned", icon: <Clock className="h-3.5 w-3.5" />, color: "hsl(35, 90%, 50%)", count: checkerAssigned.length },
                                        { key: "pending", label: "Pending", icon: <Eye className="h-3.5 w-3.5" />, color: "hsl(280, 70%, 50%)", count: checkerPending.length },
                                        { key: "completed", label: "Completed", icon: <CheckCircle className="h-3.5 w-3.5" />, color: "hsl(145, 65%, 42%)", count: checkerCompleted.length },
                                        { key: "total", label: "Total", icon: <CalendarDays className="h-3.5 w-3.5" />, color: "hsl(220, 70%, 50%)", count: asChecker.length },
                                    ].map(({ key, label, icon, color, count }) => (
                                        <div key={key} className="rounded-xl border bg-card p-4 shadow-sm">
                                            <div className="mb-1 flex items-center gap-1.5" style={{ color }}>
                                                {icon}
                                                <span className="text-xs font-medium">{label}</span>
                                            </div>
                                            <p className="text-2xl font-bold text-foreground">{count}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Assigned Inspections */}
                                <div className="mb-6">
                                    <div className="mb-2 flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-muted-foreground" />
                                        <h2 className="text-sm font-semibold text-foreground sm:text-base">Assigned Inspections</h2>
                                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{checkerAssigned.length}</span>
                                    </div>
                                    <div className="rounded-xl border bg-card shadow-sm">
                                        {checkerAssigned.length === 0 ? (
                                            <p className="p-4 text-sm text-muted-foreground">No items</p>
                                        ) : (
                                            checkerAssigned.map((item) => (
                                                <div key={item.id} className="flex flex-col gap-3 border-b border-border/50 p-4 last:border-0 sm:flex-row sm:items-center sm:justify-between">
                                                    <div>
                                                        <p className="font-medium text-foreground">{item.name}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {item.created_at ? new Date(item.created_at).toLocaleDateString() : ""}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="inline-flex items-center rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-500">
                                                            assigned
                                                        </span>
                                                        <button type="button" onClick={() => openAssignedInspection(item)}
                                                            className="rounded-lg bg-gradient-to-r from-orange-400 to-orange-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:shadow-md">
                                                            Start Inspection
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* Pending Verification */}
                                <div className="mb-6">
                                    <div className="mb-2 flex items-center gap-2">
                                        <Eye className="h-4 w-4 text-muted-foreground" />
                                        <h2 className="text-sm font-semibold text-foreground sm:text-base">Pending Verification</h2>
                                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{checkerPending.length}</span>
                                    </div>
                                    <div className="rounded-xl border bg-card shadow-sm">
                                        {checkerPending.length === 0 ? (
                                            <p className="p-4 text-sm text-muted-foreground">No items</p>
                                        ) : (
                                            checkerPending.map((item) => (
                                                <div key={item.id} className="flex flex-col gap-2 border-b border-border/50 p-4 last:border-0 sm:flex-row sm:items-center sm:justify-between">
                                                    <div>
                                                        <p className="font-medium text-foreground">{item.name}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {item.created_at ? new Date(item.created_at).toLocaleDateString() : ""}
                                                        </p>
                                                    </div>
                                                    <button type="button" onClick={() => openPendingVerification(item)}
                                                        className="rounded-lg border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted">
                                                        Review Fixes
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* Completed Inspections */}
                                <div className="mb-6">
                                    <div className="mb-2 flex items-center gap-2">
                                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                                        <h2 className="text-sm font-semibold text-foreground sm:text-base">Completed Inspections</h2>
                                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{checkerCompleted.length}</span>
                                    </div>
                                    <div className="rounded-xl border bg-card shadow-sm">
                                        {checkerCompleted.length === 0 ? (
                                            <p className="p-4 text-sm text-muted-foreground">No items</p>
                                        ) : (
                                            checkerCompleted.map((item) => (
                                                <div key={item.id} className="flex flex-col gap-2 border-b border-border/50 p-4 last:border-0 sm:flex-row sm:items-center sm:justify-between">
                                                    <div>
                                                        <p className="font-medium text-foreground">{item.name}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {item.created_at ? new Date(item.created_at).toLocaleDateString() : ""}
                                                        </p>
                                                    </div>
                                                    <span className="rounded-full border border-green-200 bg-green-50 px-3 py-0.5 text-xs font-medium text-green-600">
                                                        approved
                                                    </span>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </section>
                        )}
                    </>
                )}
                {isSignatureModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                        <div className="w-full max-w-2xl rounded-xl bg-white p-5 shadow-xl">
                            <div className="mb-3 flex items-center justify-between">
                                <h3 className="text-base font-semibold text-foreground">
                                    Final Signature
                                </h3>
                                <button
                                    type="button"
                                    onClick={handleCloseSignatureModal}
                                    className="rounded p-1 text-muted-foreground hover:bg-muted"
                                >
                                    <XIcon className="h-4 w-4" />
                                </button>
                            </div>
                            <p className="mb-3 text-xs text-muted-foreground">
                                Draw your signature and submit to complete checklist.
                            </p>
                            <div className="rounded-lg border border-border bg-white p-2">
                                <SignatureCanvas
                                    ref={sigCanvasRef}
                                    penColor="black"
                                    canvasProps={{
                                        width: 760,
                                        height: 220,
                                        className: "w-full h-[220px]",
                                    }}
                                />
                            </div>
                            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <button
                                    type="button"
                                    onClick={() => sigCanvasRef.current?.clear()}
                                    className="rounded-lg border px-3 py-1.5 text-xs font-medium text-foreground"
                                >
                                    Clear
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSubmitWithSignature}
                                    disabled={signatureSubmitting}
                                    className="rounded-lg bg-gradient-to-r from-orange-400 to-orange-500 px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
                                >
                                    {signatureSubmitting ? "Submitting..." : "Submit Signature"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}