import { useState, useEffect, useMemo } from "react";
import { Shield, Search, SlidersHorizontal, Plus, Eye, Trash2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { showToast } from "../../../utils/toast";
import {
    listSafetyTemplates,
    deleteSafetyTemplate,
    getProjectsForCurrentUser,
    getSafetyTemplate,
} from "../../../api";
import SafetyReportTemplate from "./SafetyReportTemplate";

// Column config: add or remove columns here; table stays consistent
const COLUMNS = [
    { id: "sr_no", label: "SR NO.", width: "minmax(4rem, 0.8fr)", dataKey: null },
    { id: "format_no", label: "FORMAT NO.", width: "minmax(7rem, 1.2fr)", dataKey: "format_no" },
    { id: "format_name", label: "FORMAT NAME", width: "minmax(12rem, 2fr)", dataKey: "title" },
    { id: "status", label: "STATUS", width: "minmax(6rem, 1fr)", dataKey: "status" },
    { id: "category", label: "CATEGORY", width: "minmax(8rem, 1.2fr)", dataKey: "category_name" },
    { id: "project", label: "PROJECT", width: "minmax(8rem, 1.2fr)", dataKey: "project_name" },
    { id: "actions", label: "ACTIONS", width: "minmax(8rem, 1.2fr)", dataKey: null },
];

const gridTemplateColumns = COLUMNS.map((c) => c.width).join(" ");

function formatStatus(status) {
    if (!status) return "—";
    const s = String(status).toUpperCase();
    if (s === "ACTIVE") return "Active";
    if (s === "DEACTIVE") return "Deactive";
    if (s === "ARCHIVED") return "Archived";
    return status;
}

function getFormatNo(reportHeaderMeta) {
    if (!reportHeaderMeta || typeof reportHeaderMeta !== "object") return null;
    return (
        reportHeaderMeta.format_no ??
        reportHeaderMeta.format_no_ ??
        reportHeaderMeta["format_no"] ??
        reportHeaderMeta.formatNumber ??
        null
    );
}

function getCellValue(template, column, index, projectMap) {
    if (column.id === "sr_no") return index + 1;
    if (column.id === "actions") return null;

    if (column.id === "format_no") {
        const meta = template.report_header_meta;
        const no = getFormatNo(meta);
        return no != null && no !== "" ? String(no) : template.template_code ?? template.id ?? "—";
    }

    if (column.id === "format_name") {
        return template.title ?? template.name ?? template.report_title ?? "—";
    }

    if (column.id === "status") {
        return formatStatus(template.status);
    }

    if (column.id === "category") {
        return template.category_name ?? template.category?.name ?? "—";
    }

    if (column.id === "project") {
        const pid = template.project_id;
        const name = projectMap?.get(pid) ?? template.project_name ?? template.project?.name;
        return name ?? (pid != null ? `Project #${pid}` : "—");
    }

    const key = column.dataKey;
    if (!key) return "—";
    const val = template[key];
    if (val == null || val === "") return "—";
    if (typeof val === "object" && val?.name) return val.name;
    return String(val);
}

function SafetyFormats() {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");
    const [templates, setTemplates] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const [viewingTemplate, setViewingTemplate] = useState(null);
    const [viewOpen, setViewOpen] = useState(false);
    const [viewLoading, setViewLoading] = useState(false);

    const projectMap = useMemo(() => {
        const m = new Map();
        (projects || []).forEach((p) => {
            const id = p.id ?? p.project_id;
            const name = p.name ?? p.project_name ?? p.project_title;
            if (id != null) m.set(Number(id), name ?? `Project #${id}`);
        });
        return m;
    }, [projects]);

    // Org ID for filtering templates: from user's projects (same as getProjectsForCurrentUser) or USER_DATA
    const orgId = useMemo(() => {
        const list = projects || [];
        if (list.length > 0) {
            const p = list[0];
            return p.organization_id ?? p.org_id ?? p.org ?? null;
        }
        try {
            const userStr = localStorage.getItem("USER_DATA");
            const user = userStr && userStr !== "undefined" ? JSON.parse(userStr) : null;
            return user?.org ?? user?.organization_id ?? null;
        } catch {
            return null;
        }
    }, [projects]);

    const fetchProjects = async () => {
        try {
            const res = await getProjectsForCurrentUser();
            const raw = res?.data ?? res;
            const list = Array.isArray(raw) ? raw : raw?.results ?? [];
            setProjects(list);
        } catch (_e) {
            setProjects([]);
        }
    };

    const fetchTemplates = async () => {
        if (orgId == null) {
            setLoading(false);
            setTemplates([]);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const res = await listSafetyTemplates({ org_id: orgId });
            const data = res?.data ?? res;
            const list = Array.isArray(data) ? data : data?.results ?? [];
            setTemplates(list);
        } catch (err) {
            const msg = err?.response?.data?.detail || err?.message || "Failed to load templates.";
            setError(msg);
            showToast(msg, "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    useEffect(() => {
        fetchTemplates();
    }, [orgId]);

    const filteredTemplates = useMemo(() => {
        if (!searchQuery.trim()) return templates;
        const q = searchQuery.trim().toLowerCase();
        return templates.filter((t) => {
            const title = (t.title ?? t.name ?? "").toString().toLowerCase();
            const formatNo = (getFormatNo(t.report_header_meta) ?? t.template_code ?? t.id ?? "").toString().toLowerCase();
            const category = (t.category_name ?? "").toString().toLowerCase();
            const projName = projectMap.get(t.project_id) ?? "";
            const status = (t.status ?? "").toString().toLowerCase();
            return (
                title.includes(q) ||
                formatNo.includes(q) ||
                category.includes(q) ||
                String(projName).toLowerCase().includes(q) ||
                status.includes(q)
            );
        });
    }, [templates, searchQuery, projectMap]);

    const handleCreate = () => {
        navigate("/safetySetup/create");
    };

    const handleView = (e, template) => {
        e?.stopPropagation?.();
        const id = template.id ?? template.pk;
        if (id == null) return;
        setViewOpen(true);
        setViewLoading(true);
        getSafetyTemplate(id)
            .then((res) => {
                const data = res?.data ?? res;
                setViewingTemplate(data);
            })
            .catch((err) => {
                const msg = err?.response?.data?.detail || err?.message || "Failed to load template.";
                showToast(msg, "error");
                setViewOpen(false);
            })
            .finally(() => setViewLoading(false));
    };

    const handleDelete = async (e, template) => {
        e?.stopPropagation?.();
        const id = template.id ?? template.pk;
        if (id == null) return;
        if (!window.confirm("Are you sure you want to delete this template?")) return;
        setDeletingId(id);
        try {
            await deleteSafetyTemplate(id);
            showToast("Template deleted successfully.", "success");
            fetchTemplates();
        } catch (err) {
            const msg = err?.response?.data?.detail || err?.message || "Failed to delete template.";
            showToast(msg, "error");
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="min-h-screen bg-content-bg p-6">
            <div className="bg-card rounded-2xl p-6 min-h-[calc(100vh-3rem)] shadow-sm">
                <div className="mb-2 flex items-center gap-2">
                    <Shield className="h-6 w-6 text-primary" />
                    <h1 className="text-xl font-semibold text-foreground">
                        Safety Inspection Checklists
                    </h1>
                </div>
                <p className="text-sm text-muted-foreground mb-6">
                    Create Safety Inspection
                </p>

                <div className="flex items-center gap-3 mb-6">
                    <div className="relative w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full rounded-lg border border-border bg-background pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                        />
                    </div>
                    <button
                        type="button"
                        className="flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent/10 hover:border-primary/40 transition-colors"
                    >
                        <SlidersHorizontal className="h-4 w-4 text-primary" />
                        Filter
                    </button>
                    <div className="flex-1" />
                    <button
                        onClick={handleCreate}
                        className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground shadow-md hover:shadow-lg hover:brightness-105 active:scale-[0.98] transition-all"
                    >
                        <Plus className="h-4 w-4" />
                        Create
                    </button>
                </div>

                <div className="w-full overflow-x-auto">
                    <div
                        className="grid gap-x-6 gap-y-0 text-xs font-semibold uppercase tracking-wider text-primary"
                        style={{ gridTemplateColumns, minWidth: "min(100%, 800px)" }}
                    >
                        {COLUMNS.map((col) => (
                            <div
                                key={col.id}
                                className="px-3 py-3.5 border-b border-border"
                            >
                                {col.label}
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-col">
                        {loading && (
                            <div className="py-12 text-center text-muted-foreground" style={{ minWidth: "min(100%, 800px)" }}>
                                Loading…
                            </div>
                        )}
                        {!loading && error && (
                            <div className="py-8 text-center" style={{ minWidth: "min(100%, 800px)" }}>
                                <p className="text-destructive mb-2">{error}</p>
                                <button
                                    type="button"
                                    onClick={fetchTemplates}
                                    className="text-sm text-primary hover:underline"
                                >
                                    Retry
                                </button>
                            </div>
                        )}
                        {!loading && !error && filteredTemplates.length === 0 && (
                            <div className="py-12 text-center text-muted-foreground" style={{ minWidth: "min(100%, 800px)" }}>
                                No formats found. Click &quot;Create&quot; to add one.
                            </div>
                        )}
                        {!loading && !error && filteredTemplates.length > 0 &&
                            filteredTemplates.map((template, index) => (
                                <div
                                    key={template.id ?? template.pk ?? index}
                                    className="grid gap-x-6 gap-y-0 px-3 py-4 text-sm text-foreground border-b border-border last:border-b-0 hover:bg-accent/5 transition-colors items-center"
                                    style={{ gridTemplateColumns, minWidth: "min(100%, 800px)" }}
                                >
                                    {COLUMNS.map((col) => {
                                        if (col.id === "actions") {
                                            return (
                                                <div key={col.id} className="flex items-center gap-3">
                                                    <button
                                                        type="button"
                                                        onClick={(e) => handleView(e, template)}
                                                        className="inline-flex items-center gap-1.5 text-primary hover:underline text-sm font-medium"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => handleDelete(e, template)}
                                                        disabled={deletingId === (template.id ?? template.pk)}
                                                        className="inline-flex items-center gap-1.5 text-destructive hover:underline text-sm font-medium disabled:opacity-50"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            );
                                        }
                                        const value = getCellValue(template, col, index, projectMap);
                                        return (
                                            <div
                                                key={col.id}
                                                className="px-0 truncate"
                                                title={typeof value === "string" ? value : undefined}
                                            >
                                                {value}
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                    </div>
                </div>
            </div>
            {viewOpen && (
                <div className="fixed inset-0 z-[70] bg-black/45">
                    <div className="h-full w-full overflow-auto pt-16 pb-4 px-3 md:px-6 lg:pl-72">
                        <div className="mx-auto w-full max-w-6xl rounded-2xl bg-white shadow-2xl border border-gray-200">
                            <div className="sticky top-0 z-10 flex justify-end border-b border-gray-100 bg-white/95 p-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setViewOpen(false);
                                        setViewingTemplate(null);
                                    }}
                                    className="rounded-full bg-gray-100 p-2 text-gray-700 hover:bg-gray-200"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                            <div className="p-3 md:p-5">
                                {viewLoading ? (
                                    <div className="rounded-xl bg-white p-8 text-center text-muted-foreground">Loading template preview...</div>
                                ) : viewingTemplate ? (
                                    <SafetyReportTemplate
                                        initialTemplateData={viewingTemplate}
                                        previewOnly
                                        selectedQuestions={[]}
                                    />
                                ) : (
                                    <div className="rounded-xl bg-white p-8 text-center text-muted-foreground">No template data available.</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default SafetyFormats;
