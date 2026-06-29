import { Fragment, useMemo, useState } from "react";
import {
    AlertCircle,
    ChevronDown,
    ChevronUp,
    Eye,
    Filter,
    Plus,
    Search,
} from "lucide-react";
import ExternalSOR from "./ExternalSOR";

const SOR_TYPES = ["Quality", "HSE"];

function formatDate(value) {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString("en-GB");
}

function getValue(row, keys, fallback = "") {
    for (const key of keys) {
        const value = row?.[key];
        if (value !== undefined && value !== null && String(value).trim() !== "") {
            return value;
        }
    }
    return fallback;
}

function normalizeSorRow(row, index) {
    return {
        id: row?.id || `sor-${index}`,
        type: getValue(row, ["eorType", "type", "sorType", "observationType"], "Quality"),
        sorNo: getValue(row, ["eorNo", "sorNo", "eor_no", "sor_no"], `SOR-${index + 1}`),
        project: getValue(row, ["project", "projectName", "project_name"], "-"),
        dateOfIssue: getValue(row, ["dateOfIssue", "date_of_issue", "createdAt", "created_at"], ""),
        issuedTo: getValue(row, ["issuedTo", "issued_to"], "-"),
        projectLocation: getValue(row, ["projectLocation", "project_location", "location"], "-"),
        gridRoom: getValue(row, ["gridRoom", "grid_room"], "-"),
        observationSubject: getValue(row, ["observationSubject", "observation_subject", "subject"], "-"),
        observation: getValue(row, ["observation", "description"], "-"),
        correction: getValue(row, ["correction"], "-"),
        correctiveAction: getValue(row, ["correctiveAction", "corrective_action"], "-"),
        status: getValue(row, ["status"], "Open"),
        remarks: getValue(row, ["remarks", "remark"], "-"),
        raw: row,
    };
}

function statusClass(status) {
    const s = String(status || "").toLowerCase();

    if (s.includes("closed") || s.includes("accepted") || s.includes("resolved")) {
        return "bg-emerald-50 text-emerald-700 ring-emerald-100";
    }

    if (s.includes("rejected") || s.includes("not accepted")) {
        return "bg-rose-50 text-rose-700 ring-rose-100";
    }

    if (s.includes("open") || s.includes("pending") || s.includes("submitted")) {
        return "bg-amber-50 text-amber-700 ring-amber-100";
    }

    return "bg-gray-50 text-gray-700 ring-gray-100";
}

export default function ExternalSORRegister({
    rows = [],
    loading = false,
    onView,
    onFormOpenChange,
}) {
    const [activeType, setActiveType] = useState("Quality");
    const [localRows, setLocalRows] = useState([]);
    const [query, setQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [expandedId, setExpandedId] = useState(null);
    const [showCreateForm, setShowCreateForm] = useState(false);

    const sourceRows = [...(rows || []), ...localRows];

    const normalizedRows = useMemo(
        () => sourceRows.map((row, index) => normalizeSorRow(row, index)),
        [sourceRows]
    );

    const typeRows = useMemo(
        () =>
            normalizedRows.filter(
                (row) =>
                    String(row.type || "").toLowerCase() ===
                    String(activeType || "").toLowerCase()
            ),
        [normalizedRows, activeType]
    );

    const statusOptions = useMemo(() => {
        const values = Array.from(
            new Set(typeRows.map((row) => String(row.status || "").trim()).filter(Boolean))
        );

        return ["all", ...values];
    }, [typeRows]);

    const filteredRows = useMemo(() => {
        const q = query.trim().toLowerCase();

        return typeRows.filter((row) => {
            const matchesSearch =
                !q ||
                [
                    row.sorNo,
                    row.project,
                    row.issuedTo,
                    row.projectLocation,
                    row.gridRoom,
                    row.observationSubject,
                    row.observation,
                    row.status,
                    row.remarks,
                ]
                    .join(" ")
                    .toLowerCase()
                    .includes(q);

            const matchesStatus =
                statusFilter === "all" ||
                String(row.status || "").toLowerCase() === String(statusFilter).toLowerCase();

            return matchesSearch && matchesStatus;
        });
    }, [typeRows, query, statusFilter]);

    if (showCreateForm) {
        return (
            <div className="space-y-4">
                <div className="flex justify-end">
                    <button
                        type="button"
                        onClick={() => {
                            setShowCreateForm(false);
                            onFormOpenChange?.(false);
                        }}
                        className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        Back to SOR Register
                    </button>
                </div>

                <ExternalSOR
                    initialType={activeType}
                    lockType
                    onSubmitSuccess={(payload) => {
                        setLocalRows((prev) => [payload, ...prev]);
                        setShowCreateForm(false);
                        onFormOpenChange?.(false);
                    }}
                />
            </div>
        );
    }

    return (
        <div className="space-y-5">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <div className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary ring-1 ring-orange-100">
                            <AlertCircle className="h-3.5 w-3.5" />
                            SOR Register
                        </div>

                        <h2 className="mt-3 text-xl font-semibold text-gray-900">
                            External Observation Report Register
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                            Track Quality and HSE external observations, responses, correction and corrective actions.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => {
                            setShowCreateForm(true);
                            onFormOpenChange?.(true);
                        }}
                        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                    >
                        <Plus className="h-4 w-4" />
                        Create {activeType} SOR
                    </button>
                </div>
            </div>

            <div className="flex justify-end">
                <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
                    {SOR_TYPES.map((type) => (
                        <button
                            key={type}
                            type="button"
                            onClick={() => {
                                setActiveType(type);
                                setStatusFilter("all");
                                setQuery("");
                                setExpandedId(null);
                            }}
                            className={`px-4 py-2 text-sm rounded-md ${activeType === type
                                    ? "bg-primary text-white"
                                    : "text-gray-700 hover:bg-gray-50"
                                }`}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
                    <div className="relative min-w-[280px] flex-1">
                        <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder={`Search ${activeType} SOR no, subject, location, issued to...`}
                            className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-gray-400" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="h-10 min-w-[180px] rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        >
                            {statusOptions.map((status) => (
                                <option key={status} value={status}>
                                    {status === "all" ? "All status" : status}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-[1200px] w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50/80 text-left">
                                <th className="px-4 py-3 font-semibold text-gray-600">Sr.</th>
                                <th className="px-4 py-3 font-semibold text-gray-600">SOR No.</th>
                                <th className="px-4 py-3 font-semibold text-gray-600">Type</th>
                                <th className="px-4 py-3 font-semibold text-gray-600">Issue Date</th>
                                <th className="px-4 py-3 font-semibold text-gray-600">Observation Subject</th>
                                <th className="px-4 py-3 font-semibold text-gray-600">Location</th>
                                <th className="px-4 py-3 font-semibold text-gray-600">Issued To</th>
                                <th className="px-4 py-3 font-semibold text-gray-600">Project</th>
                                <th className="px-4 py-3 font-semibold text-gray-600">Status</th>
                                <th className="px-4 py-3 font-semibold text-gray-600">Remarks</th>
                                <th className="px-4 py-3 font-semibold text-gray-600 text-right">Action</th>
                            </tr>
                        </thead>

                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={11} className="px-4 py-10 text-center text-gray-400">
                                        Loading SOR register...
                                    </td>
                                </tr>
                            ) : filteredRows.length === 0 ? (
                                <tr>
                                    <td colSpan={11} className="px-4 py-10 text-center text-gray-400">
                                        No {activeType} SOR records found. Click Create {activeType} SOR to add a new record.
                                    </td>
                                </tr>
                            ) : (
                                filteredRows.map((row, index) => {
                                    const expanded = expandedId === row.id;

                                    return (
                                        <Fragment key={row.id}>
                                            <tr className="border-t border-gray-100 hover:bg-orange-50/30">
                                                <td className="px-4 py-3 text-gray-500">{index + 1}</td>

                                                <td className="px-4 py-3 font-medium text-gray-900">
                                                    {row.sorNo}
                                                </td>

                                                <td className="px-4 py-3 text-gray-700">{row.type}</td>

                                                <td className="px-4 py-3 text-gray-700">
                                                    {formatDate(row.dateOfIssue)}
                                                </td>

                                                <td className="px-4 py-3">
                                                    <div
                                                        className="max-w-[260px] truncate text-gray-800"
                                                        title={row.observationSubject}
                                                    >
                                                        {row.observationSubject}
                                                    </div>
                                                    <div
                                                        className="max-w-[260px] truncate text-xs text-gray-500"
                                                        title={row.observation}
                                                    >
                                                        {row.observation}
                                                    </div>
                                                </td>

                                                <td className="px-4 py-3 text-gray-700">
                                                    <div className="max-w-[180px] truncate" title={row.projectLocation}>
                                                        {row.projectLocation}
                                                    </div>
                                                    <div className="text-xs text-gray-500">{row.gridRoom}</div>
                                                </td>

                                                <td className="px-4 py-3 text-gray-700">{row.issuedTo}</td>

                                                <td className="px-4 py-3 text-gray-700">{row.project}</td>

                                                <td className="px-4 py-3">
                                                    <span
                                                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${statusClass(
                                                            row.status
                                                        )}`}
                                                    >
                                                        {row.status || "-"}
                                                    </span>
                                                </td>

                                                <td className="px-4 py-3">
                                                    <div className="max-w-[220px] truncate text-gray-700" title={row.remarks}>
                                                        {row.remarks || "-"}
                                                    </div>
                                                </td>

                                                <td className="px-4 py-3">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => setExpandedId(expanded ? null : row.id)}
                                                            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                                                        >
                                                            {expanded ? (
                                                                <ChevronUp className="h-3.5 w-3.5" />
                                                            ) : (
                                                                <ChevronDown className="h-3.5 w-3.5" />
                                                            )}
                                                            Details
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() => onView?.(row.raw)}
                                                            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/5"
                                                        >
                                                            <Eye className="h-3.5 w-3.5" />
                                                            View
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>

                                            {expanded && (
                                                <tr className="border-t border-orange-100 bg-orange-50/30">
                                                    <td colSpan={11} className="px-5 py-4">
                                                        <div className="grid gap-3 text-sm md:grid-cols-4">
                                                            <div>
                                                                <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                                                    Grid / Room
                                                                </div>
                                                                <div className="mt-1 text-gray-800">{row.gridRoom}</div>
                                                            </div>

                                                            <div>
                                                                <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                                                    Project Location
                                                                </div>
                                                                <div className="mt-1 text-gray-800">{row.projectLocation}</div>
                                                            </div>

                                                            <div className="md:col-span-2">
                                                                <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                                                    Observation
                                                                </div>
                                                                <div className="mt-1 text-gray-800">{row.observation}</div>
                                                            </div>

                                                            <div className="md:col-span-2">
                                                                <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                                                    Correction
                                                                </div>
                                                                <div className="mt-1 text-gray-800">{row.correction}</div>
                                                            </div>

                                                            <div className="md:col-span-2">
                                                                <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                                                    Corrective Action
                                                                </div>
                                                                <div className="mt-1 text-gray-800">{row.correctiveAction}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </Fragment>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}