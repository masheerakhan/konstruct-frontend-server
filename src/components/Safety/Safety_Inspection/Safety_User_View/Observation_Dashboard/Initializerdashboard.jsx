import React, { useState, useEffect } from "react";
import {
    Eye,
    CheckCircle2,
    ClipboardList,
    FileSignature,
    ArrowLeft,
    ListChecks,
} from "lucide-react";
import {
    listSafetyChecklists,
    getSafetyChecklist,
    startSafetyChecklist,
    resolveActiveProjectId,
    resolveOrgId,
} from "../../../../../api";
import { showToast } from "../../../../../utils/toast";
import { getCurrentUserId } from "../../../../../utils/UserUtils";

// ─── Shared inline UI helpers ────────────────────────────────
const QuestionBadge = ({ number }) => (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-500 text-xs font-bold text-white shadow-sm">
        {number}
    </span>
);

// ─────────────────────────────────────────────
// InitializerDashboard
// ─────────────────────────────────────────────
export default function InitializerDashboard() {
    const userId = getCurrentUserId();
    const isObservations = window.location.pathname.includes('/safety/observations');
    const [projectId, setProjectId] = useState("");
    const [orgId, setOrgId] = useState("");
    const [checklists, setChecklists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [detail, setDetail] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [initializing, setInitializing] = useState(false);
    const [view, setView] = useState("dashboard"); // "dashboard" | "preview"

    useEffect(() => {
        setProjectId(String(resolveActiveProjectId?.() || ""));
        setOrgId(String(resolveOrgId?.() || ""));
    }, []);

    const fetchList = async () => {
        if (!userId) return;
        setLoading(true);
        setError(null);
        try {
            const params = {
                assigned_to_me: true,
                template_type: isObservations ? "OBSERVATION" : "SAFETY"
            };
            if (projectId) params.project_id = projectId;
            if (orgId) params.org_id = orgId;
            const res = await listSafetyChecklists(params);
            const data = res?.data;
            const list = Array.isArray(data) ? data : data?.results ?? [];
            setChecklists(list);
        } catch (err) {
            const msg = err?.response?.data?.detail || err?.message || "Failed to load checklists.";
            setError(msg);
            showToast(msg, "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (view === "dashboard") {
            fetchList();
        }
    }, [userId, projectId, orgId, view]);

    const pending = checklists.filter((c) => c.status === "not_started");
    const initialized = checklists.filter((c) => c.status === "in_progress");
    const completed = checklists.filter((c) => c.status === "completed");

    const data = {
        counters: { pending: pending.length, initialized: initialized.length, completed: completed.length },
        tasks: { pending, initialized, completed },
    };

    const openPreview = async (cl) => {
        setDetail(null);
        setDetailLoading(true);
        try {
            const res = await getSafetyChecklist(cl.id);
            setDetail(res?.data || null);
            setView("preview");
        } catch (err) {
            showToast(err?.response?.data?.detail || "Failed to load checklist", "error");
        } finally {
            setDetailLoading(false);
        }
    };

    const handleInitialize = async () => {
        if (!detail) return;
        setInitializing(true);
        try {
            await startSafetyChecklist(detail.id);
            showToast("Checklist initialized successfully.", "success");
            setView("dashboard");
            setDetail(null);
            fetchList();
        } catch (err) {
            showToast(err?.response?.data?.detail || "Failed to initialize", "error");
        } finally {
            setInitializing(false);
        }
    };

    const backToDashboard = () => {
        setView("dashboard");
        setDetail(null);
    };

    const COUNTER_META = {
        pending: { color: "text-orange-500", icon: <Eye className="h-4 w-4" /> },
        initialized: { color: "text-blue-600", icon: <FileSignature className="h-4 w-4" /> },
        completed: { color: "text-green-600", icon: <CheckCircle2 className="h-4 w-4" /> },
    };

    const SECTIONS = [
        {
            key: "pending",
            label: "Pending Verification",
            icon: <Eye className="h-4 w-4 text-muted-foreground" />,
        },
        {
            key: "initialized",
            label: "Initialized",
            icon: <FileSignature className="h-4 w-4 text-muted-foreground" />,
        },
        {
            key: "completed",
            label: "Completed",
            icon: <CheckCircle2 className="h-4 w-4 text-muted-foreground" />,
        },
    ];

    if (view === "preview" && detail) {
        return (
            <div className="min-h-screen bg-muted/40 p-4 sm:p-6 md:p-10">
                <div className="mx-auto max-w-4xl">
                    <button type="button" onClick={backToDashboard}
                        className="mb-4 inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
                    </button>

                    <div className="mb-6 rounded-xl border bg-card p-5 shadow-sm">
                        <h1 className="text-lg font-bold text-foreground sm:text-xl">{detail.name}</h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {(detail.items || []).length} questions
                        </p>
                    </div>

                    {detailLoading ? (
                        <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p>
                    ) : (
                        <>
                            <div className="space-y-3">
                                {(detail.items || []).map((item, idx) => (
                                    <div key={item.id} className="flex items-start gap-3 rounded-xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
                                        <QuestionBadge number={idx + 1} />
                                        <div className="pt-1">
                                            <p className="text-sm font-semibold text-foreground sm:text-base">{item.title}</p>
                                            {item.description && (
                                                <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {detail.status === "not_started" && (
                                <div className="mt-6">
                                    <button
                                        type="button"
                                        onClick={handleInitialize}
                                        disabled={initializing}
                                        className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-200 transition-all hover:shadow-xl hover:shadow-orange-300 disabled:opacity-60"
                                    >
                                        <ListChecks className="mr-2 h-4 w-4" />
                                        {initializing ? "Initializing…" : "Initialize Checklist"}
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-muted/40 p-4 sm:p-6 md:p-10">
            <div className="mx-auto max-w-4xl">

                {/* ── Header ─────────────────────────────────── */}
                <div className="mb-6 flex flex-wrap items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
                        <ClipboardList className="h-5 w-5 text-orange-500" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-foreground sm:text-2xl">
                            Initializer Dashboard
                        </h1>
                        <p className="text-sm text-muted-foreground">Manage your initializations</p>
                    </div>
                </div>

                {/* ── Counter cards ───────────────────────────── */}
                <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {Object.keys(COUNTER_META).map((key) => {
                        const { color, icon } = COUNTER_META[key];
                        return (
                            <div key={key} className="flex-1 min-w-0 rounded-xl border border-border bg-card p-5 shadow-sm">
                                <div className="mb-2 flex items-center gap-1.5">
                                    <span className={color}>{icon}</span>
                                    <span className={`text-sm font-medium capitalize ${color}`}>{key}</span>
                                </div>
                                <p className="text-3xl font-bold text-foreground tabular-nums">
                                    {data.counters[key]}
                                </p>
                            </div>
                        );
                    })}
                </div>

                {/* ── Task sections ───────────────────────────── */}
                {SECTIONS.map(({ key, label, icon }) => {
                    const tasks = data.tasks[key] || [];
                    const count = data.counters[key];
                    return (
                        <div key={key} className="mb-6">
                            <div className="mb-3 flex items-center gap-2">
                                {icon}
                                <h2 className="text-base font-semibold text-foreground">{label}</h2>
                                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                                    {count}
                                </span>
                            </div>
                            <div className="rounded-xl border border-border bg-card shadow-sm">
                                {tasks.length > 0 ? (
                                    tasks.map((task) => (
                                        <div
                                            key={task.id}
                                            className="cursor-pointer border-b border-border p-4 transition-colors last:border-b-0 hover:bg-muted/50"
                                            onClick={() => openPreview(task)}
                                        >
                                            <p className="text-sm font-medium text-foreground">{task.name}</p>
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                ID: {task.id} • {task.created_at ? new Date(task.created_at).toLocaleDateString() : ""}
                                            </p>
                                            {task.status === "not_started" && (
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); openPreview(task); }}
                                                    className="mt-2 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:shadow-md"
                                                >
                                                    View & Initialize
                                                </button>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-4">
                                        <p className="text-sm text-muted-foreground">No items</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}

            </div>
        </div>
    );
}
