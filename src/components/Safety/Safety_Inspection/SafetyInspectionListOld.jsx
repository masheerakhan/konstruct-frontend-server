import { useState, useEffect } from "react";
import { Shield, Search, Plus, Download, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { showToast } from "../../../utils/toast";
import {
    listSafetyChecklists,
    getProjectsForCurrentUser,
    resolveActiveProjectId,
    downloadSafetyReport,
} from "../../../api";

const SafetyInspectionList = () => {
    const navigate = useNavigate();

    const [searchQuery, setSearchQuery] = useState("");
    const [projects, setProjects] = useState([]);
    const [projectId, setProjectId] = useState("");
    const [checklists, setChecklists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingProjects, setLoadingProjects] = useState(true);
    const [error, setError] = useState(null);

    // Load projects
    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                setLoadingProjects(true);
                const res = await getProjectsForCurrentUser();
                const raw = res?.data;
                const list = Array.isArray(raw) ? raw : raw?.results ?? [];
                if (alive) setProjects(list);
                const active = resolveActiveProjectId?.();
                if (alive && active) setProjectId(String(active));
            } catch (e) {
                if (alive) setProjects([]);
            } finally {
                if (alive) setLoadingProjects(false);
            }
        })();
        return () => { alive = false; };
    }, []);

    const fetchChecklists = async () => {
        setLoading(true);
        setError(null);
        try {
            const params = {};
            if (projectId) params.project_id = projectId;
            const res = await listSafetyChecklists(params);
            const data = res?.data;
            const list = Array.isArray(data) ? data : data?.results ?? [];
            setChecklists(list);
        } catch (err) {
            const msg =
                err?.response?.data?.detail || err?.message || "Failed to load checklists.";
            setError(msg);
            showToast(msg, "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchChecklists();
    }, [projectId]);

    const handleCreate = () => {
        navigate("/safetyInpection/create");
    };

    const handleRowClick = (cl) => {
        navigate(`/safetyInpection/${cl.id}`);
    };


    const handleDownloadReport = async (e, id) => {
        e.stopPropagation();
        try {
            const res = await downloadSafetyReport(id, { mode: "download" });
            const blob = res?.data;
            if (!blob) return;
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement("a");
            link.href = url;
            link.download = `safety-report-${id}.pdf`;
            link.click();
            window.URL.revokeObjectURL(url);
            showToast("Report downloaded", "success");
        } catch (err) {
            const msg = err?.response?.data?.detail || err?.message || "Download failed";
            showToast(msg, "error");
        }
    };

    const statusDisplay = (s) => {
        if (!s) return "—";
        const v = String(s);
        if (v === "not_started") return "Not Started";
        if (v === "in_progress") return "In Progress";
        if (v === "work_in_progress") return "Work in Progress";
        if (v === "completed") return "Completed";
        return v.replace(/_/g, " ");
    };

    const filtered = searchQuery.trim()
        ? checklists.filter(
            (c) =>
                (c.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                (c.template_title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                (c.current_assignee_name || "").toLowerCase().includes(searchQuery.toLowerCase())
        )
        : checklists;

    return (
        <div className="min-h-screen bg-content-bg p-3 sm:p-4 md:p-6">
            <div className="bg-card rounded-2xl p-4 sm:p-6 min-h-[calc(100vh-3rem)] shadow-sm">
                <div className="mb-2 flex items-center gap-2">
                    <Shield className="h-6 w-6 text-primary" />
                    <h1 className="text-xl font-semibold text-foreground">
                        Safety Inspection Checklists
                    </h1>
                </div>

                <p className="text-sm text-muted-foreground mb-6">
                    Create and manage Safety Inspection checklists
                </p>

                <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search by name, assignee..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full rounded-lg border border-border bg-background pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                        />
                    </div>

                    <select
                        value={projectId}
                        onChange={(e) => setProjectId(e.target.value)}
                        className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm sm:w-auto"
                    >
                        <option value="">All Projects</option>
                        {projects.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.name || p.label || `Project #${p.id}`}
                            </option>
                        ))}
                    </select>

                    <div className="hidden flex-1 sm:block" />

                    <button
                        onClick={handleCreate}
                        className="flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground shadow-md hover:shadow-lg hover:brightness-105 active:scale-[0.98] transition-all sm:ml-auto"
                    >
                        <Plus className="h-4 w-4" />
                        Create
                    </button>
                </div>

                <div className="w-full">
                    <div className="hidden grid-cols-5 gap-4 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-primary md:grid">
                        <span>Sr No.</span>
                        <span>Name</span>
                        <span>Current Assignee</span>
                        <span>Status</span>
                        <span>Report</span>

                    </div>

                    <div className="flex flex-col gap-3 mt-2">
                        {loading && (
                            <div className="py-12 text-center text-muted-foreground">
                                Loading…
                            </div>
                        )}
                        {!loading && error && (
                            <div className="py-8 text-center">
                                <p className="text-destructive mb-2">{error}</p>
                                <button
                                    type="button"
                                    onClick={fetchChecklists}
                                    className="text-sm text-primary hover:underline"
                                >
                                    Retry
                                </button>
                            </div>
                        )}
                        {!loading && !error && filtered.length === 0 && (
                            <div className="py-12 text-center text-muted-foreground">
                                No checklists found. Click "Create" to add one.
                            </div>
                        )}
                        {!loading && !error && filtered.length > 0 &&
                            filtered.map((cl, idx) => (
                                <div
                                    key={cl.id}
                                    onClick={() => handleRowClick(cl)}
                                    className="cursor-pointer rounded-xl bg-card px-4 py-4 text-sm text-foreground shadow-row transition-shadow hover:shadow-md md:grid md:grid-cols-5 md:gap-4 md:px-5"
                                >
                                    <span className="mb-1 text-xs text-muted-foreground md:mb-0 md:text-sm md:text-foreground">{idx + 1}</span>
                                    <span className="mb-1 font-medium md:mb-0 md:font-normal">{cl.name || cl.template_title || "—"}</span>
                                    <span className="mb-1 text-xs text-muted-foreground md:mb-0 md:text-sm md:text-foreground">
                                        {cl.current_assignee_name || "—"}
                                    </span>
                                    <span className="mb-2 inline-flex w-fit rounded-full border border-border px-2 py-0.5 text-xs md:mb-0 md:rounded-none md:border-0 md:px-0 md:py-0 md:text-sm">
                                        {statusDisplay(cl.status)}
                                    </span>
                                    <span className="flex items-center gap-3">
                                        {cl.status === "completed" ? (
                                            <>
                                                {/* View Report */}
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(`/safety/inspection-report/${cl.id}`);
                                                    }}
                                                    className="text-muted-foreground hover:text-primary transition-colors"
                                                >
                                                    <Eye size={18} />
                                                </button>

                                                {/* Download Report */}
                                                <button
                                                    type="button"
                                                    onClick={(e) => handleDownloadReport(e, cl.id)}
                                                    className="text-muted-foreground hover:text-primary transition-colors"
                                                >
                                                    <Download size={18} />
                                                </button>
                                            </>
                                        ) : (
                                            <span className="text-muted-foreground">—</span>
                                        )}
                                    </span>
                                </div>
                            ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SafetyInspectionList;