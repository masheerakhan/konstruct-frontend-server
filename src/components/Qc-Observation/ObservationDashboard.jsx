import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Plus,
    Search,
    ChevronDown,
    Clock,
    CheckCircle2,
    TriangleAlert,
    CircleDot,
    Eye,
} from "lucide-react";

const STATUS = {
    pending: {
        label: "Pending",
        fg: "#C1443A",
        bg: "#F5DCD9",
        icon: TriangleAlert,
    },
    in_progress: {
        label: "In Progress",
        fg: "#B4761F",
        bg: "#F6E6CE",
        icon: Clock,
    },
    resolved: {
        label: "Resolved",
        fg: "#3F8358",
        bg: "#DCEBE1",
        icon: CheckCircle2,
    },
    closed: {
        label: "Closed",
        fg: "#6B7280",
        bg: "#E7E5E0",
        icon: CircleDot,
    },
};

const inputCls =
    "w-full rounded-lg border px-3.5 py-2.5 text-[14px] bg-white outline-none transition-shadow focus:ring-2";

function StatusPill({ status }) {
    const tone = STATUS[status] || STATUS.pending;
    const Icon = tone.icon;

    return (
        <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
            style={{ color: tone.fg, background: tone.bg }}
        >
            <Icon size={13} strokeWidth={2.5} />
            {tone.label}
        </span>
    );
}

function Select({ value, onChange, options, placeholder }) {
    return (
        <div className="relative">
            <select
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className={`${inputCls} appearance-none pr-9 cursor-pointer`}
                style={{
                    borderColor: "#DEDAD1",
                    color: value ? "#1B2430" : "#9A968C",
                }}
            >
                <option value="">{placeholder}</option>
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>

            <ChevronDown
                size={16}
                className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: "#6B7480" }}
            />
        </div>
    );
}

function normalizeObservationItem(item) {
    const header = item.observation_header || {};

    return {
        ...item,
        displayId: `OBS-${String(item.observation || item.id).padStart(4, "0")}`,
        projectName: header.project_name || "-",
        checklistName: header.checklist_name || "-",
        categoryName: header.category_name || "-",
        towerName: header.tower_name || "-",
        floorName: header.floor_name || header.custom_location || "-",
        gapType: item.gap_type || "-",
        assigneeNames:
            item.assignments
                ?.filter((assignment) => !assignment.is_skipped)
                .map(
                    (assignment) =>
                        assignment.user_name || String(assignment.user_id)
                ) || [],
        createdDate: item.created_at
            ? new Date(item.created_at).toLocaleDateString()
            : "-",
    };
}

export default function ObservationDashboard({
    observations = [],
    loading = false,
    onCreate,
    onOpen,
    onRefresh,
}) {
    const [query, setQuery] = useState("");
    const [filters, setFilters] = useState({
        project: "",
        status: "",
        tower: "",
    });


    const rows = useMemo(
        () => observations.map(normalizeObservationItem),
        [observations]
    );

    const projectOptions = useMemo(() => {
        const map = new Map();

        rows.forEach((row) => {
            const projectId =
                row.observation_header?.project ?? row.projectName;
            if (projectId) {
                map.set(String(projectId), row.projectName);
            }
        });

        return Array.from(map.entries()).map(([value, label]) => ({
            value,
            label,
        }));
    }, [rows]);

    const towerOptions = useMemo(() => {
        const values = Array.from(
            new Set(
                rows
                    .map((row) => row.towerName)
                    .filter((value) => value && value !== "-")
            )
        );

        return values.map((value) => ({ value, label: value }));
    }, [rows]);

    const counts = useMemo(() => {
        return rows.reduce(
            (result, item) => {
                result.total += 1;
                result[item.status] = (result[item.status] || 0) + 1;
                return result;
            },
            {
                total: 0,
                pending: 0,
                in_progress: 0,
                resolved: 0,
                closed: 0,
            }
        );
    }, [rows]);

    const filteredRows = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();

        return rows.filter((row) => {
            if (
                filters.project &&
                String(row.observation_header?.project) !== filters.project
            ) {
                return false;
            }

            if (filters.status && row.status !== filters.status) {
                return false;
            }

            if (filters.tower && row.towerName !== filters.tower) {
                return false;
            }

            if (normalizedQuery) {
                const searchableText = [
                    row.displayId,
                    row.checklistName,
                    row.projectName,
                    row.categoryName,
                    row.gapType,
                    row.description,
                    row.towerName,
                    row.floorName,
                    row.assigneeNames.join(" "),
                ]
                    .join(" ")
                    .toLowerCase();

                if (!searchableText.includes(normalizedQuery)) {
                    return false;
                }
            }

            return true;
        });
    }, [rows, query, filters]);

    const statCard = (label, value, color = "#1B2430") => (
        <div
            className="tag-corner flex-1 min-w-[150px] px-5 py-4 bg-white border"
            style={{ borderColor: "#DEDAD1" }}
        >
            <div
                className="text-[11.5px] font-semibold uppercase tracking-wide"
                style={{ color: "#8A8F79" }}
            >
                {label}
            </div>
            <div
                className="text-3xl font-bold mt-1"
                style={{ color }}
            >
                {value}
            </div>
        </div>
    );

    return (
        <div
            className="min-h-screen p-8 font-sans"
            style={{ background: "#F6F5F1" }}
        >
            <style>{`
        .tag-corner {
          clip-path: polygon(
            0 0,
            calc(100% - 18px) 0,
            100% 18px,
            100% 100%,
            0 100%
          );
          border-radius: 4px;
        }

        input:focus,
        select:focus {
          box-shadow: 0 0 0 3px rgba(224, 122, 31, 0.18);
          border-color: #E07A1F;
        }
      `}</style>

            <div className="max-w-[1200px] mx-auto">
                <div className="flex items-start justify-between mb-6 gap-4">
                    <div>
                        <div
                            className="text-[12px] font-semibold tracking-widest uppercase"
                            style={{ color: "#E07A1F" }}
                        >
                            Site Quality Control
                        </div>

                        <h1
                            className="text-[32px] leading-tight font-bold"
                            style={{ color: "#1B2430" }}
                        >
                            Observation Dashboard
                        </h1>
                    </div>

                    <div className="flex items-center gap-2">
                        {onRefresh && (
                            <button
                                type="button"
                                onClick={onRefresh}
                                className="px-4 py-2.5 rounded-lg font-semibold text-[14px] border bg-white"
                                style={{
                                    color: "#3A4552",
                                    borderColor: "#DEDAD1",
                                }}
                            >
                                Refresh
                            </button>
                        )}

                        {onCreate && (
                            <button
                                type="button"
                                onClick={onCreate}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-[14px] text-white shadow-sm hover:opacity-90 transition-opacity"
                                style={{ background: "#E07A1F" }}
                            >
                                <Plus size={17} />
                                Raise Observation
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex gap-4 mb-7 flex-wrap">
                    {statCard("Total", counts.total)}
                    {statCard("Pending", counts.pending, "#C1443A")}
                    {statCard("In Progress", counts.in_progress, "#B4761F")}
                    {statCard("Resolved", counts.resolved, "#3F8358")}
                    {statCard("Closed", counts.closed, "#6B7280")}
                </div>

                <div
                    className="bg-white rounded-xl border p-5 mb-7"
                    style={{ borderColor: "#DEDAD1" }}
                >
                    <div className="flex items-center gap-2 mb-4">
                        <Search size={16} style={{ color: "#8A8F79" }} />
                        <input
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Search by ID, project, category, gap type, or assignee..."
                            className="flex-1 outline-none text-[14px] bg-transparent"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <Select
                            value={filters.project}
                            onChange={(value) =>
                                setFilters((current) => ({
                                    ...current,
                                    project: value,
                                }))
                            }
                            options={projectOptions}
                            placeholder="All Projects"
                        />

                        <Select
                            value={filters.tower}
                            onChange={(value) =>
                                setFilters((current) => ({
                                    ...current,
                                    tower: value,
                                }))
                            }
                            options={towerOptions}
                            placeholder="All Towers"
                        />

                        <Select
                            value={filters.status}
                            onChange={(value) =>
                                setFilters((current) => ({
                                    ...current,
                                    status: value,
                                }))
                            }
                            options={Object.entries(STATUS).map(
                                ([value, config]) => ({
                                    value,
                                    label: config.label,
                                })
                            )}
                            placeholder="All Statuses"
                        />
                    </div>
                </div>

                <div
                    className="bg-white rounded-xl border overflow-hidden"
                    style={{ borderColor: "#DEDAD1" }}
                >
                    <div className="overflow-x-auto">
                        <table className="w-full text-[13.5px]">
                            <thead>
                                <tr
                                    className="text-left"
                                    style={{
                                        background: "#F6F5F1",
                                        color: "#6B7480",
                                    }}
                                >
                                    <th className="px-5 py-3 font-semibold">ID</th>
                                    <th className="px-5 py-3 font-semibold">Project</th>
                                    <th className="px-5 py-3 font-semibold">Location</th>
                                    <th className="px-5 py-3 font-semibold">Gap Type</th>
                                    <th className="px-5 py-3 font-semibold">Status</th>
                                    <th className="px-5 py-3 font-semibold">Assignee</th>
                                    <th className="px-5 py-3 font-semibold">Created</th>
                                    <th className="px-5 py-3 font-semibold text-right">
                                        Action
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {loading && (
                                    <tr>
                                        <td
                                            colSpan={8}
                                            className="px-5 py-10 text-center"
                                            style={{ color: "#9A968C" }}
                                        >
                                            Loading observations...
                                        </td>
                                    </tr>
                                )}

                                {!loading &&
                                    filteredRows.map((row) => (
                                        <tr
                                            key={row.id}
                                            className="transition-colors hover:bg-[#FBF8F3]"
                                            style={{ borderTop: "1px solid #EFEDE7" }}
                                        >
                                            <td
                                                className="px-5 py-3 font-semibold"
                                                style={{ color: "#1B2430" }}
                                            >
                                                {row.displayId}
                                            </td>

                                            <td
                                                className="px-5 py-3"
                                                style={{ color: "#3A4552" }}
                                            >
                                                {row.projectName}
                                            </td>

                                            <td
                                                className="px-5 py-3"
                                                style={{ color: "#3A4552" }}
                                            >
                                                {row.towerName} · {row.floorName}
                                            </td>

                                            <td
                                                className="px-5 py-3"
                                                style={{ color: "#3A4552" }}
                                            >
                                                {row.gapType}
                                            </td>

                                            <td className="px-5 py-3">
                                                <StatusPill status={row.status} />
                                            </td>

                                            <td
                                                className="px-5 py-3"
                                                style={{ color: "#3A4552" }}
                                            >
                                                {row.assigneeNames.length
                                                    ? row.assigneeNames.join(", ")
                                                    : "-"}
                                            </td>

                                            <td
                                                className="px-5 py-3 text-[12.5px]"
                                                style={{ color: "#8A8F79" }}
                                            >
                                                {row.createdDate}
                                            </td>

                                            <td className="px-5 py-3 text-right">
                                                <button
                                                    type="button"
                                                    onClick={() => onOpen?.(row)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12.5px] font-semibold"
                                                    style={{
                                                        background: "#DEE6EC",
                                                        color: "#3E5C76",
                                                    }}
                                                >
                                                    <Eye size={14} />
                                                    View
                                                </button>
                                            </td>
                                        </tr>
                                    ))}

                                {!loading && filteredRows.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={8}
                                            className="px-5 py-10 text-center"
                                            style={{ color: "#9A968C" }}
                                        >
                                            No observations match the current filters.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
