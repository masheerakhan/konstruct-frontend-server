import { useMemo, useState } from "react";
import {
    ClipboardList,
    Search,
    Filter,
    Plus,
    Eye,
    ChevronDown,
    ChevronUp,
} from "lucide-react";

function formatDate(value) {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString("en-GB");
}

function getValue(obj, keys, fallback = "") {
    for (const key of keys) {
        const value = obj?.[key];
        if (value !== undefined && value !== null && String(value).trim() !== "") {
            return value;
        }
    }
    return fallback;
}

function normalizeDmpDocument(doc, index) {
    const formData = doc?.form_data || doc?.formData || {};
    const dmpChecklist =
        formData?.dmp_checklist ||
        formData?.dmpChecklist ||
        doc?.dmp_checklist ||
        [];

    const checklistRows = Array.isArray(dmpChecklist)
        ? dmpChecklist.filter((row) => row.kind !== "section")
        : [];

    const thirdPartyRows = checklistRows.filter((row) =>
        String(row.sl_no || row.slNo || "").startsWith("4.")
    );

    const attachmentCount = checklistRows.reduce((total, row) => {
        const files = row.file_names || row.files || [];
        return total + (Array.isArray(files) ? files.length : 0);
    }, 0);

    return {
        id: doc?.id || `dmp-${index}`,
        refNo: getValue(
            doc,
            ["ref_no", "refNo", "reference_no", "transmittalRefNo"],
            `DMP-${index + 1}`
        ),
        name: getValue(doc, ["name"], "Design Mix"),
        projectName: getValue(doc, ["project_name", "projectName"], "-"),
        createdBy: getValue(doc, ["created_by", "createdBy"], "-"),
        createdAt: getValue(doc, ["created_at", "createdAt"], ""),
        mixGrade: getValue(
            formData,
            ["mix_grade", "mixGrade", "grade", "concrete_grade"],
            "-"
        ),
        location: getValue(
            formData,
            ["location", "structure", "element", "work_location"],
            "-"
        ),
        status: getValue(doc, ["status", "approval_status", "approvalStatus"], "Draft"),
        remarks: getValue(doc, ["remarks", "remark"], "-"),
        checklistCount: checklistRows.length,
        thirdPartyCount: thirdPartyRows.length,
        attachmentCount,
        raw: doc,
    };
}

function statusClass(status) {
    const s = String(status || "").toLowerCase();

    if (["approved", "accepted", "closed"].includes(s)) {
        return "bg-emerald-50 text-emerald-700 ring-emerald-100";
    }

    if (["rejected", "not approved"].includes(s)) {
        return "bg-rose-50 text-rose-700 ring-rose-100";
    }

    if (["submitted", "under review", "pending"].includes(s)) {
        return "bg-amber-50 text-amber-700 ring-amber-100";
    }

    return "bg-gray-50 text-gray-700 ring-gray-100";
}

export default function DMPRegister({
    folderName = "Concrete Design Mix Submissions-Civil (DMP)",
    documents = [],
    loading = false,
    onCreate,
    onView,
}) {
    const [query, setQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [expandedId, setExpandedId] = useState(null);

    const rows = useMemo(
        () => (documents || []).map((doc, index) => normalizeDmpDocument(doc, index)),
        [documents]
    );

    const statusOptions = useMemo(() => {
        const values = Array.from(
            new Set(rows.map((row) => String(row.status || "").trim()).filter(Boolean))
        );
        return ["all", ...values];
    }, [rows]);

    const filteredRows = useMemo(() => {
        const q = query.trim().toLowerCase();

        return rows.filter((row) => {
            const searchText = [
                row.refNo,
                row.name,
                row.projectName,
                row.mixGrade,
                row.location,
                row.status,
                row.remarks,
            ]
                .join(" ")
                .toLowerCase();

            const matchesSearch = !q || searchText.includes(q);

            const matchesStatus =
                statusFilter === "all" ||
                String(row.status || "").toLowerCase() ===
                String(statusFilter).toLowerCase();

            return matchesSearch && matchesStatus;
        });
    }, [rows, query, statusFilter]);

    return (
        <div className="space-y-5">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <div className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-700 ring-1 ring-sky-100">
                            <ClipboardList className="h-3.5 w-3.5" />
                            DMP Register
                        </div>

                        <h2 className="mt-3 text-xl font-semibold text-gray-900">
                            Design Mix Proposal Register
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                            {folderName}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onCreate}
                        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                    >
                        <Plus className="h-4 w-4" />
                        Create DMP
                    </button>
                </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
                    <div className="relative min-w-[50px] flex-1">
                        <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search DMP ref, project, mix grade, location..."
                            className="h-10 w-80 rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
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
                    <table className="min-w-[1100px] w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50/80 text-left">
                                <th className="px-4 py-3 font-semibold text-gray-600">Sr.</th>
                                <th className="px-4 py-3 font-semibold text-gray-600">DMP Ref No.</th>
                                <th className="px-4 py-3 font-semibold text-gray-600">Project</th>
                                <th className="px-4 py-3 font-semibold text-gray-600">Submission Date</th>
                                <th className="px-4 py-3 font-semibold text-gray-600">Mix Grade</th>
                                <th className="px-4 py-3 font-semibold text-gray-600">Location / Element</th>
                                <th className="px-4 py-3 font-semibold text-gray-600">Checklist</th>
                                <th className="px-4 py-3 font-semibold text-gray-600">Attachments</th>
                                <th className="px-4 py-3 font-semibold text-gray-600">Status</th>
                                <th className="px-4 py-3 font-semibold text-gray-600 text-right">Action</th>
                            </tr>
                        </thead>

                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={10} className="px-4 py-10 text-center text-gray-400">
                                        Loading DMP register...
                                    </td>
                                </tr>
                            ) : filteredRows.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="px-4 py-10 text-center text-gray-400">
                                        No DMP records found.
                                    </td>
                                </tr>
                            ) : (
                                filteredRows.map((row, index) => {
                                    const expanded = expandedId === row.id;

                                    return (
                                        <>
                                            <tr key={row.id} className="border-t border-gray-100 hover:bg-sky-50/30">
                                                <td className="px-4 py-3 text-gray-500">{index + 1}</td>

                                                <td className="px-4 py-3 font-medium text-gray-900">
                                                    {row.refNo}
                                                </td>

                                                <td className="px-4 py-3 text-gray-700">
                                                    {row.projectName}
                                                </td>

                                                <td className="px-4 py-3 text-gray-700">
                                                    {formatDate(row.createdAt)}
                                                </td>

                                                <td className="px-4 py-3 text-gray-700">
                                                    {row.mixGrade}
                                                </td>

                                                <td className="px-4 py-3 text-gray-700">
                                                    <div className="max-w-[220px] truncate" title={row.location}>
                                                        {row.location}
                                                    </div>
                                                </td>

                                                <td className="px-4 py-3 text-gray-700">
                                                    {row.checklistCount || 0} items
                                                </td>

                                                <td className="px-4 py-3 text-gray-700">
                                                    {row.attachmentCount || 0} file(s)
                                                </td>

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
                                                <tr key={`${row.id}-details`} className="border-t border-sky-100 bg-sky-50/30">
                                                    <td colSpan={10} className="px-5 py-4">
                                                        <div className="grid gap-3 text-sm md:grid-cols-4">
                                                            <div>
                                                                <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                                                    Checklist Items
                                                                </div>
                                                                <div className="mt-1 text-gray-800">
                                                                    {row.checklistCount || 0}
                                                                </div>
                                                            </div>

                                                            <div>
                                                                <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                                                    Third Party Reports
                                                                </div>
                                                                <div className="mt-1 text-gray-800">
                                                                    {row.thirdPartyCount || 0}
                                                                </div>
                                                            </div>

                                                            <div>
                                                                <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                                                    Attachments
                                                                </div>
                                                                <div className="mt-1 text-gray-800">
                                                                    {row.attachmentCount || 0}
                                                                </div>
                                                            </div>

                                                            <div>
                                                                <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                                                    Remarks
                                                                </div>
                                                                <div className="mt-1 text-gray-800">
                                                                    {row.remarks || "-"}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </>
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