import React, { useState, useEffect, useRef } from "react";
import {
    Clock,
    CheckCircle,
    Send,
    Wrench,
    CircleAlert,
    ArrowLeft,
    Eye,
    Check,
    Upload,
    X as XIcon,
} from "lucide-react";
import SignatureCanvas from "react-signature-canvas";

import { getSafetyChecklist, listSafetyChecklists, resolveActiveProjectId, submitSafetyChecklist } from "../../../../../api";
import { showToast } from "../../../../../utils/toast";
import { fileToBase64, getCurrentUserId } from "../../../../../utils/UserUtils";

const MAKER_QUEUE_STATUSES = [
    "Pending for Maker",
    "rejected_by_checker",
    "rejected_by_supervisor",
    "created",
];

function collectActiveMakerSubs(detail) {
    const out = [];
    (detail?.items || []).forEach((item) => {
        const sub = (item.submissions || []).find((s) =>
            MAKER_QUEUE_STATUSES.includes(s.status)
        );
        if (sub) out.push(sub);
    });
    return out;
}

function isRejectReworkStatus(st) {
    return st === "rejected_by_checker" || st === "rejected_by_supervisor";
}

/** First full forward submit (no reject rework): this request clears every maker-queue submission. */
function shouldShowMakerSignatureModal(detail, submissionsForApi, isBulkSubmit) {
    const makerSubs = collectActiveMakerSubs(detail);
    if (!makerSubs.length) return false;
    if (makerSubs.some((s) => isRejectReworkStatus(s.status))) return false;

    if (isBulkSubmit) return true;

    const ids = new Set(makerSubs.map((s) => s.id));
    const touched = new Set(
        (submissionsForApi || []).map((p) => p.submission_id).filter(Boolean)
    );
    if (ids.size !== touched.size) return false;
    for (const id of ids) {
        if (!touched.has(id)) return false;
    }
    return true;
}

// ─── Shared inline UI helpers ────────────────────────────────
const QuestionBadge = ({ number }) => (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-xs font-bold text-white shadow-sm">
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



// const PhotoUploadArea = ({ id, previewBase64, onFileChange, label = "Attach photo" }) => (
//     <div className="mt-3">
//         <p className="mb-1.5 text-xs font-medium text-muted-foreground">{label}</p>
//         {previewBase64 ? (
//             <div className="relative inline-block">
//                 <img src={previewUrl} alt="Preview" className="h-20 w-20 rounded-lg border border-border object-cover shadow-sm" />
//                 <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-white shadow">
//                     <Check className="h-3 w-3" />
//                 </span>
//             </div>
//         ) : (
//             <label
//                 htmlFor={`photo-upload-${id}`}
//                 className="flex cursor-pointer items-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:bg-muted/60"
//             >
//                 <Upload className="h-4 w-4" />
//                 <span>Click to upload or take a photo</span>
//             </label>
//         )}
//         <input
//             id={`photo-upload-${id}`}
//             type="file"
//             accept="image/*"
//             onChange={onFileChange}
//             className="hidden"
//         />
//     </div>
// );



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


const RemarksBubble = ({ label, text }) => (
    <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
        <span className="font-semibold">{label}:</span> {text}
    </div>
);

// ─────────────────────────────────────────────
// MakerDashboard
// ─────────────────────────────────────────────
export default function MakerDashboard() {
    const userId = getCurrentUserId();

    const [projectId, setProjectId] = useState("");
    const [checklists, setChecklists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [detail, setDetail] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [view, setView] = useState("dashboard"); // "dashboard" | "maker_fix"
    const [makerRemarks, setMakerRemarks] = useState({});
    const [makerMedia, setMakerMedia] = useState({});
    const [isMakerSignatureModalOpen, setIsMakerSignatureModalOpen] = useState(false);
    const [pendingSubmitPayload, setPendingSubmitPayload] = useState(null);
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
            setChecklists(Array.isArray(data) ? data : data?.results ?? []);
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
    const isMakerTurn = (c) =>
        (c.current_assignee_role || "").toUpperCase() === "MAKER" &&
        Number(c.current_assignee_id) === Number(userId);

    const makerInWorkflow = (c) => !!c.maker_in_workflow;

    const rejectedPoints = (c) => Number(c.maker_rejected_points ?? 0);

    /** Checklists completed where this user is the Maker in workflow (from API filter). */
    const makerCompletedChecklists = checklists.filter(
        (c) => (c.status || "").toLowerCase() === "completed" && makerInWorkflow(c)
    );

    /** Maker is current assignee and checklist not completed. */
    const makerActive = checklists.filter(
        (c) => (c.status || "").toLowerCase() !== "completed" && isMakerTurn(c)
    );

    /** Rejected by supervisor/checker: at least one submission in reject state. */
    const makerRejected = makerActive.filter((c) => rejectedPoints(c) > 0);

    /** First-time / forward assignment: maker’s turn, no rejected points. */
    const makerAssigned = makerActive.filter((c) => rejectedPoints(c) === 0);

    const totalQuestionsLabel = (c) => {
        const n = c.items_count;
        if (n == null || Number.isNaN(Number(n))) return null;
        const t = Number(n);
        return `${t} question${t === 1 ? "" : "s"}`;
    };

    const rejectedPointsLabel = (c) => {
        const n = rejectedPoints(c);
        if (n <= 0) return null;
        return `${n} rejected point${n === 1 ? "" : "s"}`;
    };

    const makerEditableItems =
        detail?.items
            ?.map((item) => {
                const sub = (item.submissions || []).find((s) =>
                    MAKER_QUEUE_STATUSES.includes(s.status)
                );
                return sub ? { item, sub } : null;
            })
            .filter(Boolean) ?? [];

    // ── navigation ──────────────────────────────────────────────
    const backToDashboard = () => {
        setView("dashboard");
        setDetail(null);
        setMakerRemarks({});
        setMakerMedia({});
        setIsMakerSignatureModalOpen(false);
        setPendingSubmitPayload(null);
        if (sigCanvasRef.current) sigCanvasRef.current.clear();
    };

    // ── open fix view ───────────────────────────────────────────
    const openMakerFix = async (cl) => {
        setDetail(null);
        setDetailLoading(true);
        setMakerRemarks({});
        setMakerMedia({});
        try {
            const res = await getSafetyChecklist(cl.id);
            const data = res?.data || null;
            setDetail(data);
            const initialRemarks = {};
            (data?.items || []).forEach((entry) => {
                const match = (entry.submissions || []).find((s) =>
                    MAKER_QUEUE_STATUSES.includes(s.status)
                );
                if (match) initialRemarks[match.id] = "";
            });
            setMakerRemarks(initialRemarks);
            setView("maker_fix");
        } catch (err) {
            showToast(err?.response?.data?.detail || "Failed to load checklist", "error");
        } finally {
            setDetailLoading(false);
        }
    };

    // ── submit all fixes at once ────────────────────────────────
    // const handleSubmitAllFixes = async () => {
    //     if (!detail) return;
    //     const submissions = (detail.items || [])
    //         .map((item) => {
    //             const sub = (item.submissions || []).find((s) =>
    //                 MAKER_QUEUE_STATUSES.includes(s.status)
    //             );
    //             if (!sub) return null;
    //             const payload = { submission_id: sub.id, maker_remarks: makerRemarks[sub.id] ?? "" };
    //             const media = makerMedia[sub.id];
    //             if (media) payload.maker_media_base64 = media;
    //             return payload;
    //         })
    //         .filter(Boolean);
    //     const payload = submissions.length ? { submissions } : {};
    //     const isBulk = !submissions.length;
    //     if (shouldShowMakerSignatureModal(detail, submissions, isBulk)) {
    //         setPendingSubmitPayload(payload);
    //         setIsMakerSignatureModalOpen(true);
    //         return;
    //     }

    //     setSubmitting(true);
    //     try {
    //         await submitSafetyChecklist(detail.id, payload);
    //         showToast("Submitted successfully", "success");
    //         backToDashboard();
    //         fetchList();
    //     } catch (err) {
    //         showToast(err?.response?.data?.detail || "Submit failed", "error");
    //     } finally {
    //         setSubmitting(false);
    //     }
    // };




    // ── submit a single fix ─────────────────────────────────────

    const handleSubmitAllFixes = async () => {
        if (!detail) return;

        const submissions = (detail.items || [])
            .map((item) => {
                const sub = (item.submissions || []).find((s) =>
                    MAKER_QUEUE_STATUSES.includes(s.status)
                );
                if (!sub) return null;

                return {
                    submission_id: sub.id,
                    maker_remarks: makerRemarks[sub.id] ?? "",
                };
            })
            .filter(Boolean);

        const isBulk = !submissions.length;

        if (shouldShowMakerSignatureModal(detail, submissions, isBulk)) {
            setPendingSubmitPayload({ submissions });
            setIsMakerSignatureModalOpen(true);
            return;
        }

        // ✅ Build FormData
        const formData = new FormData();
        formData.append("submissions", JSON.stringify(submissions));

        // ✅ Attach files
        submissions.forEach((sub) => {
            const file = makerMedia[sub.submission_id];
            if (file) {
                formData.append("maker_media", file);
            }
        });

        setSubmitting(true);
        try {
            await submitSafetyChecklist(detail.id, formData);
            showToast("Submitted successfully", "success");
            backToDashboard();
            fetchList();
        } catch (err) {
            showToast(err?.response?.data?.detail || "Submit failed", "error");
        } finally {
            setSubmitting(false);
        }
    };


    // const handleSubmitSingleFix = async (submissionId) => {
    //     if (!detail) return;
    //     const submissions = [];
    //     (detail.items || []).forEach((item) => {
    //         const sub = (item.submissions || []).find((s) => s.id === submissionId);
    //         if (!sub) return;
    //         const payload = { submission_id: sub.id, maker_remarks: makerRemarks[sub.id] ?? "" };
    //         const media = makerMedia[sub.id];
    //         if (media) payload.maker_media_base64 = media;
    //         submissions.push(payload);
    //     });
    //     if (!submissions.length) { showToast("Could not find fix to submit.", "error"); return; }

    //     if (shouldShowMakerSignatureModal(detail, submissions, false)) {
    //         setPendingSubmitPayload({ submissions });
    //         setIsMakerSignatureModalOpen(true);
    //         return;
    //     }

    //     setSubmitting(true);
    //     try {
    //         await submitSafetyChecklist(detail.id, { submissions });
    //         showToast("Fix submitted.", "success");

    //         const res = await getSafetyChecklist(detail.id);
    //         const data = res?.data || null;
    //         setDetail(data);

    //         const nextRemarks = {};
    //         (data?.items || []).forEach((entry) => {
    //             const match = (entry.submissions || []).find((s) =>
    //                 MAKER_QUEUE_STATUSES.includes(s.status)
    //             );
    //             if (match) nextRemarks[match.id] = makerRemarks[match.id] ?? "";
    //         });
    //         setMakerRemarks(nextRemarks);
    //         setMakerMedia((prev) => { const c = { ...prev }; delete c[submissionId]; return c; });
    //         fetchList();
    //     } catch (err) {
    //         showToast(err?.response?.data?.detail || "Submit fix failed", "error");
    //     } finally {
    //         setSubmitting(false);
    //     }
    // };



    const handleSubmitSingleFix = async (submissionId) => {
        if (!detail) return;

        const submissions = [];

        (detail.items || []).forEach((item) => {
            const sub = (item.submissions || []).find((s) => s.id === submissionId);
            if (!sub) return;

            submissions.push({
                submission_id: sub.id,
                maker_remarks: makerRemarks[sub.id] ?? "",
            });
        });

        if (!submissions.length) {
            showToast("Could not find fix to submit.", "error");
            return;
        }

        if (shouldShowMakerSignatureModal(detail, submissions, false)) {
            setPendingSubmitPayload({ submissions });
            setIsMakerSignatureModalOpen(true);
            return;
        }

        // ✅ Build FormData
        const formData = new FormData();
        formData.append("submissions", JSON.stringify(submissions));

        // ✅ Attach file (if exists)
        const file = makerMedia[submissionId];
        if (file) {
            formData.append("maker_media", file);
        }

        setSubmitting(true);
        try {
            await submitSafetyChecklist(detail.id, formData);
            showToast("Fix submitted.", "success");

            const res = await getSafetyChecklist(detail.id);
            const data = res?.data || null;
            setDetail(data);

            const nextRemarks = {};
            (data?.items || []).forEach((entry) => {
                const match = (entry.submissions || []).find((s) =>
                    MAKER_QUEUE_STATUSES.includes(s.status)
                );
                if (match) nextRemarks[match.id] = makerRemarks[match.id] ?? "";
            });

            setMakerRemarks(nextRemarks);

            // ✅ remove uploaded file after submit
            setMakerMedia((prev) => {
                const copy = { ...prev };
                delete copy[submissionId];
                return copy;
            });

            fetchList();
        } catch (err) {
            showToast(err?.response?.data?.detail || "Submit fix failed", "error");
        } finally {
            setSubmitting(false);
        }
    };


    const handleCloseMakerSignatureModal = () => {
        if (signatureSubmitting) return;
        setIsMakerSignatureModalOpen(false);
        setPendingSubmitPayload(null);
        if (sigCanvasRef.current) sigCanvasRef.current.clear();
    };

    const handleSubmitWithMakerSignature = async () => {
        if (!detail || !pendingSubmitPayload) return;
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
            `maker-signature-${detail.id}.png`,
            { type: "image/png" }
        );
        const formData = new FormData();
        // 1. Append submissions JSON
        formData.append(
            "submissions",
            JSON.stringify(pendingSubmitPayload?.submissions || [])
        );

        // 2. Append files separately
        (pendingSubmitPayload?.submissions || []).forEach((sub) => {
            const file = makerMedia[sub.submission_id];
            if (file) {
                formData.append("maker_media", file);
            }
        });
        formData.append("maker_signature", signatureFile);
        setSignatureSubmitting(true);
        try {
            await submitSafetyChecklist(detail.id, formData);
            showToast("Submitted successfully", "success");
            setIsMakerSignatureModalOpen(false);
            setPendingSubmitPayload(null);
            if (sigCanvasRef.current) sigCanvasRef.current.clear();
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
                        {/* ═══ VIEW: MAKER FIX ═══ */}
                        {view === "maker_fix" && detail && (
                            <section>
                                <button type="button" onClick={backToDashboard}
                                    className="mb-4 inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                                    <ArrowLeft className="h-4 w-4" /> Back to Dashboard
                                </button>

                                <div className="mb-6 rounded-xl border bg-card p-5 shadow-sm">
                                    <h1 className="text-lg font-bold text-foreground sm:text-xl">{detail.name}</h1>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        {makerEditableItems.length} item(s) to fix
                                    </p>
                                </div>

                                {makerEditableItems.length === 0 ? (
                                    <p className="py-8 text-center text-sm text-muted-foreground">No items pending for you right now.</p>
                                ) : (
                                    <div className="space-y-4">
                                        {makerEditableItems.map(({ item, sub }, idx) => (
                                            <div key={item.id} className="rounded-xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
                                                <div className="mb-4 flex items-start gap-3">
                                                    <QuestionBadge number={idx + 1} />
                                                    <p className="pt-1 text-sm font-semibold text-foreground sm:text-base">{item.title}</p>
                                                </div>

                                                <div className="space-y-3">
                                                    {sub.supervisor_remarks && (
                                                        <RemarksBubble label="Supervisor" text={sub.supervisor_remarks} />
                                                    )}
                                                    {sub.checker_remarks && (
                                                        <RemarksBubble label="Checker" text={sub.checker_remarks} />
                                                    )}

                                                    {sub.has_photo && sub.photo_url && (
                                                        <PhotoViewButton url={sub.photo_url} label="View Review Photo" />
                                                    )}

                                                    <div>
                                                        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                                                            Remarks (what was fixed / checked)
                                                        </label>
                                                        <textarea
                                                            className="w-full rounded-lg border border-border bg-muted/30 p-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                                            placeholder="Describe what was fixed or checked…"
                                                            value={makerRemarks[sub.id] ?? ""}
                                                            onChange={(e) =>
                                                                setMakerRemarks((prev) => ({ ...prev, [sub.id]: e.target.value }))
                                                            }
                                                            rows={2}
                                                        />
                                                    </div>

                                                    <PhotoUploadArea
                                                        id={`maker-fix-${sub.id}`}
                                                        previewBase64={makerMedia[sub.id]}
                                                        label={
                                                            item.photo_required
                                                                ? "Upload photo (required)"
                                                                : "Upload photo (optional)"
                                                        }
                                                        onFileChange={async (e) => {
                                                            const file = e.target.files?.[0];
                                                            if (!file) return;
                                                            try {
                                                                // const base64 = await fileToBase64(file);
                                                                // setMakerMedia((prev) => ({ ...prev, [sub.id]: base64 }));
                                                                setMakerMedia((prev) => ({ ...prev, [sub.id]: file }));
                                                            } catch {
                                                                showToast("Failed to read image file", "error");
                                                            }
                                                        }}
                                                    />

                                                    <div className="flex justify-end pt-1">
                                                        <button type="button"
                                                            onClick={() => handleSubmitSingleFix(sub.id)}
                                                            disabled={submitting}
                                                            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-primary to-primary/90 px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-all hover:shadow-md disabled:opacity-60">
                                                            <Send className="h-3.5 w-3.5" />
                                                            Submit Fix
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {makerEditableItems.length > 0 && (
                                    <div className="mt-6">
                                        <button type="button" onClick={handleSubmitAllFixes} disabled={submitting}
                                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-200 transition-all hover:shadow-xl hover:shadow-orange-300 disabled:opacity-60">
                                            <Send className="h-4 w-4" />
                                            {submitting ? "Submitting…" : "Submit All Fixes"}
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
                                        <Wrench className="h-5 w-5 text-orange-500" />
                                    </div>
                                    <div>
                                        <h1 className="text-xl font-bold text-foreground sm:text-2xl">Maker Dashboard</h1>
                                        <p className="text-sm text-muted-foreground">Fix failed inspection items</p>
                                    </div>
                                </div>

                                {/* Counter cards */}
                                <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
                                    {[
                                        { label: "Assigned", icon: <Clock className="h-3.5 w-3.5 text-orange-500" />, colorCls: "text-orange-600", count: makerAssigned.length },
                                        { label: "Rejected", icon: <CircleAlert className="h-3.5 w-3.5 text-red-500" />, colorCls: "text-red-600", count: makerRejected.length },
                                        { label: "Completed", icon: <CheckCircle className="h-3.5 w-3.5 text-green-600" />, colorCls: "text-green-600", count: makerCompletedChecklists.length },
                                    ].map(({ label, icon, colorCls, count }) => (
                                        <div key={label} className="rounded-xl border bg-card p-4 shadow-sm">
                                            <div className="mb-1 flex items-center gap-1.5">
                                                {icon}
                                                <span className={`text-xs font-medium ${colorCls}`}>{label}</span>
                                            </div>
                                            <p className="text-2xl font-bold text-foreground">{count}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Pending Fix Requests */}
                                <div className="mb-6">
                                    <div className="mb-2 flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-muted-foreground" />
                                        <h2 className="text-sm font-semibold text-foreground sm:text-base">Assigned Checklists</h2>
                                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{makerAssigned.length}</span>
                                    </div>
                                    <div className="rounded-xl border bg-card shadow-sm">
                                        {makerAssigned.length === 0 ? (
                                            <p className="p-4 text-sm text-muted-foreground">No items</p>
                                        ) : (
                                            makerAssigned.map((item) => (
                                                <div key={item.id} className="flex flex-col gap-2 border-b border-border/50 p-4 last:border-0 sm:flex-row sm:items-center sm:justify-between">
                                                    <div>
                                                        <p className="font-medium text-foreground">{item.name}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {item.created_at ? new Date(item.created_at).toLocaleDateString() : ""}
                                                            {totalQuestionsLabel(item) ? ` · ${totalQuestionsLabel(item)}` : ""}
                                                        </p>
                                                    </div>
                                                    <button type="button" onClick={() => openMakerFix(item)}
                                                        className="rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:shadow-md">
                                                        Start Now
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* Rejected (supervisor / checker) */}
                                <div className="mb-6">
                                    <div className="mb-2 flex items-center gap-2">
                                        <Send className="h-4 w-4 text-muted-foreground" />
                                        <h2 className="text-sm font-semibold text-foreground sm:text-base">Rejected Checklists</h2>
                                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{makerRejected.length}</span>
                                    </div>
                                    <div className="rounded-xl border bg-card shadow-sm">
                                        {makerRejected.length === 0 ? (
                                            <p className="p-4 text-sm text-muted-foreground">No items</p>
                                        ) : (
                                            makerRejected.map((item) => (
                                                <div key={item.id} className="flex flex-col gap-2 border-b border-border/50 p-4 last:border-0 sm:flex-row sm:items-center sm:justify-between">
                                                    <div>
                                                        <p className="font-medium text-foreground">{item.name}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {item.created_at ? new Date(item.created_at).toLocaleDateString() : ""}
                                                            {rejectedPointsLabel(item) ? ` · ${rejectedPointsLabel(item)}` : ""}
                                                        </p>
                                                    </div>
                                                    <button type="button" onClick={() => openMakerFix(item)}
                                                        className="rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:shadow-md">
                                                        Fix now
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* Completed */}
                                <div className="mb-6">
                                    <div className="mb-2 flex items-center gap-2">
                                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                                        <h2 className="text-sm font-semibold text-foreground sm:text-base">Completed Checklists</h2>
                                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{makerCompletedChecklists.length}</span>
                                    </div>
                                    <div className="rounded-xl border bg-card shadow-sm">
                                        {makerCompletedChecklists.length === 0 ? (
                                            <p className="p-4 text-sm text-muted-foreground">No items</p>
                                        ) : (
                                            makerCompletedChecklists.map((item) => (
                                                <div key={item.id} className="flex flex-col gap-2 border-b border-border/50 p-4 last:border-0 sm:flex-row sm:items-center sm:justify-between">
                                                    <div>
                                                        <p className="font-medium text-foreground">{item.name}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {item.created_at ? new Date(item.created_at).toLocaleDateString() : ""}
                                                            {totalQuestionsLabel(item) ? ` · ${totalQuestionsLabel(item)}` : ""}
                                                        </p>
                                                    </div>
                                                    <span className="rounded-full border border-green-200 bg-green-50 px-3 py-0.5 text-xs font-medium text-green-600">
                                                        Completed
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
                {isMakerSignatureModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                        <div className="w-full max-w-2xl rounded-xl bg-white p-5 shadow-xl">
                            <div className="mb-3 flex items-center justify-between">
                                <h3 className="text-base font-semibold text-foreground">
                                    Your signature
                                </h3>
                                <button
                                    type="button"
                                    onClick={handleCloseMakerSignatureModal}
                                    className="rounded p-1 text-muted-foreground hover:bg-muted"
                                >
                                    <XIcon className="h-4 w-4" />
                                </button>
                            </div>
                            <p className="mb-3 text-xs text-muted-foreground">
                                Sign to confirm your first full submission of this checklist.
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
                                    onClick={handleSubmitWithMakerSignature}
                                    disabled={signatureSubmitting}
                                    className="rounded-lg bg-gradient-to-r from-orange-400 to-orange-500 px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
                                >
                                    {signatureSubmitting ? "Submitting..." : "Submit signature"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}