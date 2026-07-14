import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
    ArrowLeft,
    Send,
    ShieldAlert,
    AlertTriangle,
    ChevronDown,
    Loader2,
} from "lucide-react";

import { Section, Field, ReadOnlyField, NumberedTextArea } from "../../Pages/ncr/shared/FormPrimitives";
import NCRClassificationBadge from "./NCRClassificationBadge";
import NCRStatusBadge from "./NCRStatusBadge";
import AttachmentGallery from "./AttachmentGallery";
import FileUpload from "../FileUpload";
import PermitSignatureModal from "../Safety/Permit_to_work/utils/PermitSignatureModal";
import { getNCRDetail, submitMakerResponse } from "../../services/ncrService";

const getStoredUser = () => {
    try {
        const raw = localStorage.getItem("USER_DATA");

        if (raw && raw !== "undefined") {
            const data = JSON.parse(raw);

            return {
                id: Number(
                    data?.id ||
                    data?.user_id ||
                    data?.pk ||
                    localStorage.getItem("USER_ID") ||
                    localStorage.getItem("user_id")
                ),
                name:
                    data?.full_name ||
                    data?.name ||
                    [data?.first_name, data?.last_name].filter(Boolean).join(" ") ||
                    data?.username ||
                    data?.email ||
                    "Current User",
            };
        }
    } catch (e) {
        console.warn("Failed to parse USER_DATA", e);
    }

    return {
        id: Number(
            localStorage.getItem("USER_ID") ||
            localStorage.getItem("user_id")
        ),
        name: "Current User",
    };
};

const useCurrentUser = () => ({ user: getStoredUser() });

const RESPONDABLE_STATUSES = ["assigned_to_maker", "resubmission_required"];

const resolveMediaUrl = (path) => {
    if (!path) return null;

    if (path.startsWith("http://") || path.startsWith("https://")) {
        return path;
    }

    const base =
        window.location.hostname === "127.0.0.1" ||
            window.location.hostname === "localhost"
            ? "http://127.0.0.1:8001"
            : "https://konstruct.world";

    return `${base}${path.startsWith("/") ? path : `/${path}`}`;
};

export default function NCRMakerResponsePage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useCurrentUser();

    const [ncr, setNcr] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [correctiveAction, setCorrectiveAction] = useState("");
    const [preventiveAction, setPreventiveAction] = useState("");
    const [actionImages, setActionImages] = useState([]);
    const [signature, setSignature] = useState("");
    const [showSigModal, setShowSigModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showPrevRounds, setShowPrevRounds] = useState(false);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        getNCRDetail(id)
            .then((res) => {
                const payload = res?.data?.data || res?.data || res;
                if (!cancelled) setNcr(payload);
            })
            .catch(() => {
                if (!cancelled) setError("Failed to load this NCR.");
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [id]);

    const isActiveAssignee =
        ncr?.assignments?.some(
            (a) => a.is_active && Number(a.maker_id) === Number(user?.id)
        ) ?? false;

    const canRespond =
        ncr && isActiveAssignee && RESPONDABLE_STATUSES.includes(ncr.status);

    const sortedVerifications =
        ncr?.verifications
            ?.slice()
            .sort((a, b) => {
                const roundDiff = Number(b.round_no || 0) - Number(a.round_no || 0);

                if (roundDiff !== 0) return roundDiff;

                return (
                    new Date(b.verified_at || 0).getTime() -
                    new Date(a.verified_at || 0).getTime()
                );
            }) || [];

    const rejectedVerifications = sortedVerifications.filter(
        (verification) => verification.result === "rejected"
    );

    const latestRejectedVerification =
        rejectedVerifications.find(
            (verification) =>
                Number(verification.round_no) === Number(ncr?.current_round || 1) - 1
        ) ||
        rejectedVerifications[0] ||
        null;

    const isResubmission =
        ncr?.status === "resubmission_required" || Number(ncr?.current_round || 1) > 1;

    const previousRounds =
        ncr?.maker_responses?.filter((r) => Number(r.round_no) < Number(ncr.current_round)) ?? [];

    const identificationImages =
        ncr?.attachments?.filter((a) =>
            ["identification", "root_cause"].includes(a.attachment_type)
        ) ?? [];

    const validateAndSubmit = () => {
        if (!correctiveAction.trim() || !preventiveAction.trim()) {
            toast.error("Please fill in both corrective and preventive action taken.");
            return;
        }
        if (!signature) {
            setShowSigModal(true);
            return;
        }
        doSubmit();
    };

    const handleSignatureSuccess = (dataUrl) => {
        setSignature(dataUrl);
        setShowSigModal(false);
        doSubmit(dataUrl);
    };

    const doSubmit = async (sigOverride) => {
        setSaving(true);
        try {
            const fd = new FormData();
            fd.append("corrective_action_taken", correctiveAction);
            fd.append("preventive_action_taken", preventiveAction);
            fd.append("maker_signature", dataUrlToFile(sigOverride || signature, "signature.png"));
            actionImages.forEach((f) => {
                if (f.file) {
                    fd.append("corrective_images", f.file);
                }
            });

            const res = await submitMakerResponse(id, fd);
            const updatedNcr = res?.data?.data || res?.data || res;

            const stillWaiting = updatedNcr?.status !== "maker_submitted";

            toast.success(
                stillWaiting
                    ? "Response submitted. Waiting on other assigned makers."
                    : "Response submitted for verification."
            );
            navigate("/ncr/my-pending");
        } catch (err) {
            toast.error(err.message || "Failed to submit response.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="max-w-5xl mx-auto p-4 md:p-8">
                <div className="space-y-4 animate-pulse">
                    <div className="h-8 w-1/3 bg-slate-200 rounded" />
                    <div className="h-40 bg-white border border-slate-200 rounded-xl" />
                    <div className="h-40 bg-white border border-slate-200 rounded-xl" />
                </div>
            </div>
        );
    }

    if (error || !ncr) {
        return (
            <div className="max-w-5xl mx-auto p-4 md:p-8 text-center py-16">
                <p className="text-slate-500">{error || "NCR not found."}</p>
                <button onClick={() => navigate(-1)} className="mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium">
                    Go back
                </button>
            </div>
        );
    }

    if (!canRespond) {
        return (
            <div className="max-w-5xl mx-auto p-4 md:p-8">
                <button onClick={() => navigate(-1)} className="text-sm text-slate-500 hover:text-slate-900 inline-flex items-center gap-1 mb-6" data-testid="back-btn">
                    <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <div className="bg-white rounded-xl border border-slate-200 p-10 text-center space-y-3">
                    <ShieldAlert className="w-10 h-10 text-slate-300 mx-auto" />
                    <p className="text-slate-600 font-medium">This NCR isn't awaiting your action.</p>
                    <p className="text-sm text-slate-400">
                        Current status: <NCRStatusBadge status={ncr.status} />
                    </p>
                    <button
                        onClick={() => navigate("/ncr/my-pending")}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                        Back to Pending NCRs
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6">
            <div>
                <button onClick={() => navigate(-1)} className="text-sm text-slate-500 hover:text-slate-900 inline-flex items-center gap-1 mb-2" data-testid="back-btn">
                    <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-3xl font-display font-bold tracking-tight text-slate-900" data-testid="maker-response-title">
                        {ncr.ncr_no}
                    </h1>
                    <NCRStatusBadge status={ncr.status} />
                    <NCRClassificationBadge classification={ncr.classification} />
                </div>
                <p className="text-sm text-slate-500 mt-1">
                    Review the reported non-conformance and submit your corrective &amp; preventive action.
                </p>
            </div>

            {isResubmission && latestRejectedVerification && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3" data-testid="rejection-banner">
                    <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-semibold text-red-700">
                            This NCR was rejected - Resubmission Round {ncr.current_round}
                        </p>
                        <p className="text-xs text-red-500 mt-0.5">
                            Rejected by {latestRejectedVerification.verified_by_name || "Checker"} on{" "}
                            {latestRejectedVerification.verified_at
                                ? new Date(latestRejectedVerification.verified_at).toLocaleString("en-GB")
                                : "-"}
                        </p>
                        <p className="text-sm text-red-600 mt-2 whitespace-pre-line">
                            {latestRejectedVerification.verification_status_of_remedial}
                        </p>
                    </div>
                </div>
            )}



            {previousRounds.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <button
                        onClick={() => setShowPrevRounds((v) => !v)}
                        className="w-full flex items-center justify-between px-6 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        data-testid="toggle-previous-rounds"
                    >
                        Previous Submission{previousRounds.length > 1 ? "s" : ""}
                        <ChevronDown className={`w-4 h-4 transition-transform ${showPrevRounds ? "rotate-180" : ""}`} />
                    </button>
                    {showPrevRounds && (
                        <div className="px-6 pb-4 space-y-4 border-t border-slate-100 pt-4">
                            {previousRounds.map((r) => (
                                <div key={r.id} className="text-sm space-y-2">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                        Round {r.round_no}
                                    </p>
                                    <ReadOnlyField label="Corrective Action Taken">{r.corrective_action_taken}</ReadOnlyField>
                                    <ReadOnlyField label="Preventive Action Taken">{r.preventive_action_taken}</ReadOnlyField>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <Section title="A. Basic Information" step="A">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ReadOnlyField label="Doc No">{ncr.doc_no}</ReadOnlyField>
                    <ReadOnlyField label="NCR No">{ncr.ncr_no}</ReadOnlyField>
                    <ReadOnlyField label="Non-Conformity Related To">{ncr.non_conformity_related_to}</ReadOnlyField>
                    <ReadOnlyField label="Location">{ncr.full_location}</ReadOnlyField>
                    <ReadOnlyField label="Identification of Non-Conformance" className="md:col-span-2">
                        {ncr.identification_of_non_conformance}
                    </ReadOnlyField>
                </div>
            </Section>

            <Section title="B. Root Cause Analysis" step="B">
                <ReadOnlyField label="Root Cause Analysis">{ncr.root_cause_analysis}</ReadOnlyField>
                <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                        Reference Photos
                    </label>
                    <AttachmentGallery attachments={identificationImages} emptyLabel="No reference photos provided" />
                </div>
            </Section>

            <Section title="C. Action Required" step="C">
                <ReadOnlyField label="Correction">{ncr.correction}</ReadOnlyField>
                <ReadOnlyField label="Corrective Action">{ncr.corrective_action}</ReadOnlyField>
                <ReadOnlyField label="Preventive Action">{ncr.preventive_action}</ReadOnlyField>
            </Section>

            <Section title="D. Responsibility & Timeline" step="D">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ReadOnlyField label="Follow-up Responsibility">{ncr.follow_up_responsibility}</ReadOnlyField>
                    <ReadOnlyField label="Verification Responsibility">{ncr.verification_responsibility}</ReadOnlyField>
                    <ReadOnlyField label="Target Date of Compliance">
                        <span className={ncr.is_overdue ? "text-red-600 font-semibold" : ""}>
                            {ncr.target_date_of_compliance ? new Date(ncr.target_date_of_compliance).toLocaleDateString("en-GB") : "-"}
                            {ncr.is_overdue && " - Overdue"}
                        </span>
                    </ReadOnlyField>
                </div>
            </Section>

            {isResubmission && rejectedVerifications.length > 0 && (
                <Section title="Checker Verification / Rejection Details" step="R">
                    <div className="space-y-5">
                        {rejectedVerifications.map((verification, index) => {
                            const signatureUrl = resolveMediaUrl(verification.checker_signature);

                            return (
                                <div
                                    key={verification.id || `rejection-round-${verification.round_no || index}`}
                                    className="rounded-lg border border-red-100 bg-red-50/40 p-4 space-y-4"
                                    data-testid={`checker-verification-round-${verification.round_no}`}
                                >
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-wider text-red-500">
                                                Rejection Round {verification.round_no}
                                            </p>
                                            <p className="text-sm text-slate-500 mt-1">
                                                Verified by{" "}
                                                <span className="font-medium text-slate-700">
                                                    {verification.verified_by_name || "-"}
                                                </span>
                                                {" "}on{" "}
                                                {verification.verified_at
                                                    ? new Date(verification.verified_at).toLocaleString("en-GB")
                                                    : "-"}
                                            </p>
                                        </div>

                                        <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700 uppercase">
                                            {verification.result}
                                        </span>
                                    </div>

                                    <ReadOnlyField label="Verification status of Remedial / Corrective / Preventive action">
                                        {verification.verification_status_of_remedial}
                                    </ReadOnlyField>

                                    <div>
                                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                                            Checker Verification Attachments
                                        </label>
                                        <AttachmentGallery
                                            attachments={verification.attachments || []}
                                            emptyLabel="No verification attachments uploaded"
                                        />
                                    </div>

                                    {signatureUrl && (
                                        <div>
                                            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                                                Checker Signature
                                            </label>
                                            <a
                                                href={signatureUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-block rounded-lg border border-slate-200 bg-white p-2 hover:border-red-300"
                                            >
                                                <img
                                                    src={signatureUrl}
                                                    alt="Checker signature"
                                                    className="max-h-24 max-w-xs object-contain"
                                                />
                                            </a>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </Section>
            )}

            <Section title="E. Your Response" step="E">
                <Field label="Corrective Action Taken" required testId="maker-field-corrective-action">
                    <NumberedTextArea
                        rows={4}
                        name="corrective_action_taken"
                        value={correctiveAction}
                        onChange={(e) => setCorrectiveAction(e.target.value)}
                        placeholder="Describe the corrective action you took"
                        required
                        testId="maker-input-corrective-action"
                    />
                </Field>
                <Field label="Preventive Action Taken" required testId="maker-field-preventive-action">
                    <NumberedTextArea
                        rows={4}
                        name="preventive_action_taken"
                        value={preventiveAction}
                        onChange={(e) => setPreventiveAction(e.target.value)}
                        placeholder="Describe the preventive action you took"
                        required
                        testId="maker-input-preventive-action"
                    />
                </Field>
                <Field label="Photos / Attachments" testId="maker-field-action-images">
                    <FileUpload
                        value={actionImages}
                        onChange={setActionImages}
                        testId="maker-action-upload"
                    />
                    <p className="mt-1 text-xs text-slate-400">
                        Optional. Upload supporting photos if available.
                    </p>
                </Field>
            </Section>



            <div className="flex justify-end items-center gap-4 pt-2 pb-8">
                <button
                    type="button"
                    onClick={validateAndSubmit}
                    disabled={saving}
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-blue-600 text-white hover:bg-blue-700 h-10 px-6 py-2 shadow disabled:opacity-50 disabled:cursor-not-allowed"
                    data-testid="maker-submit-btn"
                >
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                    Submit Response
                </button>
            </div>

            <PermitSignatureModal
                isOpen={showSigModal}
                onClose={() => setShowSigModal(false)}
                onSignatureSuccess={handleSignatureSuccess}
                actionTitle="Submit NCR Response"
            />
        </div>
    );
}

function dataUrlToFile(dataUrl, filename) {
    const [meta, base64] = dataUrl.split(",");
    const mime = meta.match(/:(.*?);/)[1];
    const bstr = atob(base64);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
}
