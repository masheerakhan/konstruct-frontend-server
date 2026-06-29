import { Fragment, useMemo, useState } from "react";
import {
    AlertTriangle,
    ChevronDown,
    ChevronUp,
    Eye,
    Filter,
    Plus,
    Search,
} from "lucide-react";
import IncidentReport from "./IncidentReport";
import { formatDisplayDate } from "../../../../utils/dateFormatter";

function formatDate(value) {
    return formatDisplayDate(value);
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

function normalizeIncidentRow(row, index) {
    return {
        id: row?.id || `ir-${index}`,
        reportNo: getValue(row, ["reportNo", "report_no"], `IR-2026-${String(index + 1).padStart(3, "0")}`),
        category: getValue(row, ["category", "categories"], "-"),
        incidentDate: getValue(row, ["incidentDate", "incident_date"], ""),
        location: getValue(row, ["incidentLocation", "location"], "-"),
        description: getValue(row, ["incidentDescription", "howOccurred", "description"], "-"),
        investigationRequired: getValue(row, ["investigationRequired", "investigation_required"], "-"),
        preventiveMeasures: getValue(row, ["preventiveMeasures", "preventive_measures"], "-"),
        reporterName: getValue(row, ["reporterName", "reporter_name", "reportedBy"], "-"),
        status: getValue(row, ["status"], "Open"),
        raw: row,
    };
}

function statusClass(status) {
    const s = String(status || "").toLowerCase();

    if (s.includes("closed") || s.includes("resolved")) {
        return "bg-emerald-50 text-emerald-700 ring-emerald-100";
    }

    if (s.includes("open") || s.includes("pending") || s.includes("investigating")) {
        return "bg-amber-50 text-amber-700 ring-amber-100";
    }

    return "bg-gray-50 text-gray-700 ring-gray-100";
}

export default function IncidentRegister({
    rows = [],
    loading = false,
    onView,
    onFormOpenChange,
}) {
    const [localRows, setLocalRows] = useState([]);
    const [query, setQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [expandedId, setExpandedId] = useState(null);
    const [showCreateForm, setShowCreateForm] = useState(false);

    const sourceRows = [...(rows || []), ...localRows];

    const normalizedRows = useMemo(
        () => sourceRows.map((row, index) => normalizeIncidentRow(row, index)),
        [sourceRows]
    );

    const statusOptions = useMemo(() => {
        const values = Array.from(
            new Set(normalizedRows.map((row) => row.status).filter(Boolean))
        );
        return ["all", ...values];
    }, [normalizedRows]);

    const filteredRows = useMemo(() => {
        const q = query.trim().toLowerCase();

        return normalizedRows.filter((row) => {
            const matchesSearch =
                !q ||
                [
                    row.reportNo,
                    row.category,
                    row.description,
                    row.location,
                    row.reporterName,
                    row.status,
                ]
                    .join(" ")
                    .toLowerCase()
                    .includes(q);

            const matchesStatus =
                statusFilter === "all" ||
                String(row.status || "").toLowerCase() === String(statusFilter).toLowerCase();

            return matchesSearch && matchesStatus;
        });
    }, [normalizedRows, query, statusFilter]);

    if (showCreateForm) {
        return (
            <div className="space-y-4">
                <div className="flex justify-end pr-6">
                    <button
                        type="button"
                        onClick={() => {
                            setShowCreateForm(false);
                            onFormOpenChange?.(false);
                        }}
                        className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        ← Back to Incident Register
                    </button>
                </div>

                <IncidentReport
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
                        <div className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-700 ring-1 ring-orange-100">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            INCIDENT REGISTER
                        </div>

                        <h2 className="mt-3 text-xl font-semibold text-gray-900">
                            Incident Report Register
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                            Optimized tracking view for recorded incidents, investigations, and preventive measures.
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
                        Create Incident Report
                    </button>
                </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
                    <div className="relative min-w-[280px] flex-1">
                        <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search Incident ref, description, location, reported by..."
                            className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-gray-400" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="h-10 min-w-[160px] rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
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
                    <table className="min-w-[1100px] w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50/80 text-left">
                                <th className="px-4 py-3 font-semibold text-gray-600">Sr.</th>
                                <th className="px-4 py-3 font-semibold text-gray-600">Incident Ref #</th>
                                <th className="px-4 py-3 font-semibold text-gray-600">Date of Incident</th>
                                <th className="px-4 py-3 font-semibold text-gray-600">Category</th>
                                <th className="px-4 py-3 font-semibold text-gray-600">Location</th>
                                <th className="px-4 py-3 font-semibold text-gray-600">Description</th>
                                <th className="px-4 py-3 font-semibold text-gray-600">Reported By</th>
                                <th className="px-4 py-3 font-semibold text-gray-600">Status</th>
                                <th className="px-4 py-3 font-semibold text-gray-600 text-right">Action</th>
                            </tr>
                        </thead>

                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={9} className="px-4 py-10 text-center text-gray-400">
                                        Loading Incident register...
                                    </td>
                                </tr>
                            ) : filteredRows.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-4 py-10 text-center text-gray-400">
                                        No Incident records found. Click Create Incident Report to add a new record.
                                    </td>
                                </tr>
                            ) : (
                                filteredRows.map((row, index) => {
                                    const expanded = expandedId === row.id;

                                    return (
                                        <Fragment key={row.id}>
                                            <tr className="border-t border-gray-100 hover:bg-orange-50/30">
                                                <td className="px-4 py-3 text-gray-500">{index + 1}</td>
                                                <td className="px-4 py-3 font-medium text-gray-900">{row.reportNo}</td>
                                                <td className="px-4 py-3 text-gray-700">{formatDate(row.incidentDate)}</td>
                                                <td className="px-4 py-3 text-gray-700">{row.category}</td>
                                                <td className="px-4 py-3 text-gray-700">
                                                    <div className="max-w-[150px] truncate" title={row.location}>
                                                        {row.location}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="max-w-[200px] truncate text-gray-800" title={row.description}>
                                                        {row.description}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-gray-700">{row.reporterName}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${statusClass(row.status)}`}>
                                                        {row.status}
                                                    </span>
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
                                                    <td colSpan={9} className="px-5 py-4">
                                                        <div className="grid gap-3 text-sm md:grid-cols-2">
                                                            <div>
                                                                <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                                                    Investigation Required?
                                                                </div>
                                                                <div className="mt-1 text-gray-800">
                                                                    {row.investigationRequired}
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                                                    Preventive Measures
                                                                </div>
                                                                <div className="mt-1 text-gray-800">
                                                                    {row.preventiveMeasures}
                                                                </div>
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
