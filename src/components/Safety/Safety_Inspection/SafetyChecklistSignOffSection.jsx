import React, { useState } from "react";
import {
    X,
    Eye,
    UserRound,
    ShieldCheck,
    Signature,
} from "lucide-react";

const resolveMediaUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("http://") || path.startsWith("https://")) return path;

    const base =
        window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost"
            ? "http://127.0.0.1:8001"
            : "https://konstruct.world/checklists";

    const clean = path.startsWith("/") ? path : `/${path}`;
    return `${base}${clean}`;
};;

const getLatestNameFromSubmissions = (detail, keys = []) => {
    for (const item of detail?.items || []) {
        for (const sub of item?.submissions || []) {
            for (const key of keys) {
                const value = String(sub?.[key] || "").trim();

                if (value) {
                    return value;
                }
            }
        }
    }

    return "";
};

const getLatestCheckerIdFromSubmissions = (detail) => {
    for (const item of detail?.items || []) {
        for (const sub of item?.submissions || []) {
            if (sub?.checker_id) {
                return `User ${sub.checker_id}`;
            }
        }
    }

    return "";
};

const getLatestNameFromAttempts = (attempts, role) => {
    for (let i = (attempts || []).length - 1; i >= 0; i -= 1) {
        const questions = attempts[i]?.questions || [];

        for (const row of questions) {
            const source = role === "maker" ? row?.maker : row?.checker;
            const name = String(source?.actor_name || "").trim();

            if (name) {
                return name;
            }
        }
    }

    return "";
};

const getLatestSignatureFromAttempts = (attempts, role) => {
    for (let i = (attempts || []).length - 1; i >= 0; i -= 1) {
        const questions = attempts[i]?.questions || [];

        for (const row of questions) {
            const source = role === "maker" ? row?.maker : row?.checker;

            const signature =
                source?.signature_url ||
                source?.signature ||
                source?.signature_file ||
                "";

            if (signature) {
                return signature;
            }
        }
    }

    return "";
};

const getSignOffUsers = (detail, attempts = []) => {
    const makerName =
        detail?.maker_name ||
        detail?.created_by_name ||
        detail?.created_by ||
        getLatestNameFromSubmissions(detail, [
            "latest_maker_name",
            "maker_name",
            "created_by_name",
        ]) ||
        getLatestNameFromAttempts(attempts, "maker") ||
        "Maker";

    const checkerName =
        detail?.checker_name ||
        detail?.verified_by_name ||
        detail?.approved_by_name ||
        getLatestNameFromSubmissions(detail, [
            "latest_checker_name",
            "checker_name",
            "approved_by_name",
        ]) ||
        getLatestNameFromAttempts(attempts, "checker") ||
        getLatestCheckerIdFromSubmissions(detail) ||
        "Checker";

    const makerSignature =
        detail?.maker_signature ||
        detail?.maker_signature_url ||
        getLatestSignatureFromAttempts(attempts, "maker") ||
        "";

    const checkerSignature =
        detail?.checker_signature ||
        detail?.checker_signature_url ||
        getLatestSignatureFromAttempts(attempts, "checker") ||
        "";

    return {
        maker: {
            role: "maker",
            label: "Checked by",
            name: makerName,
            designation: "Maker",
            signature: makerSignature,
        },
        checker: {
            role: "checker",
            label: "Verified by",
            name: checkerName,
            designation: "Checker",
            signature: checkerSignature,
        },
    };
};

const SignatureViewModal = ({ open, user, onClose }) => {
    if (!open || !user) return null;

    const signatureUrl = resolveMediaUrl(user.signature);

    return (
        <div className="fixed inset-0 z-[260] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-white shadow-2xl">
                <div className="flex items-start justify-between border-b border-border px-5 py-4">
                    <div>
                        <h3 className="text-base font-bold text-foreground">
                            {user.label}
                        </h3>

                        <p className="mt-1 text-sm text-muted-foreground">
                            {user.name}{" "}
                            <span className="font-medium">
                                ({user.designation})
                            </span>
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg border border-border p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="p-5">
                    {signatureUrl ? (
                        <div className="rounded-xl border border-border bg-muted/20 p-4">
                            <img
                                src={signatureUrl}
                                alt={`${user.designation} signature`}
                                className="mx-auto max-h-72 w-full object-contain"
                            />
                        </div>
                    ) : (
                        <div className="flex min-h-[180px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 text-center">
                            <Signature className="mb-2 h-8 w-8 text-muted-foreground" />

                            <p className="text-sm font-semibold text-foreground">
                                No signature available
                            </p>

                            <p className="mt-1 text-xs text-muted-foreground">
                                Latest signature was not found for this user.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const SignOffRow = ({ user, onView }) => {
    const hasSignature = Boolean(String(user?.signature || "").trim());

    return (
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-muted/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
                <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${user.role === "maker"
                            ? "bg-orange-100 text-orange-600"
                            : "bg-blue-100 text-blue-600"
                        }`}
                >
                    {user.role === "maker" ? (
                        <UserRound className="h-5 w-5" />
                    ) : (
                        <ShieldCheck className="h-5 w-5" />
                    )}
                </div>

                <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {user.label}
                    </p>

                    <p className="text-sm font-bold text-foreground">
                        {user.name}{" "}
                        {/* <span className="font-medium text-muted-foreground">
                            ({user.designation})
                        </span> */}
                    </p>
                </div>
            </div>

            <button
                type="button"
                onClick={() => onView(user)}
                disabled={!hasSignature}
                className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition ${hasSignature
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

function SafetyChecklistSignOffSection({
    detail,
    attempts = [],
    title = "Sign Off",
    description = "Latest checklist signatures captured from Maker and Checker.",
    className = "",
}) {
    const [signatureUser, setSignatureUser] = useState(null);

    if (!detail) return null;

    const users = getSignOffUsers(detail, attempts);

    return (
        <>
            <div className={`rounded-xl border bg-card p-5 shadow-sm ${className}`}>
                <div className="mb-4">
                    <h2 className="text-sm font-bold text-foreground">
                        {title}
                    </h2>

                    {description ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                            {description}
                        </p>
                    ) : null}
                </div>

                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                    <SignOffRow
                        user={users.maker}
                        onView={setSignatureUser}
                    />

                    <SignOffRow
                        user={users.checker}
                        onView={setSignatureUser}
                    />
                </div>
            </div>

            <SignatureViewModal
                open={!!signatureUser}
                user={signatureUser}
                onClose={() => setSignatureUser(null)}
            />
        </>
    );
}

export default SafetyChecklistSignOffSection;