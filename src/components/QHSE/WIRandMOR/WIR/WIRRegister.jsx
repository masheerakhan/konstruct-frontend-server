import { useMemo, useState, Fragment } from "react";
import {
    ClipboardList,
    Search,
    Filter,
    Eye,
    Plus,
    ChevronDown,
    ChevronUp,
} from "lucide-react";
import WorkInspectionRequest from "./WorkInspectionRequest";
import { formatDisplayDate } from "../../../../utils/dateFormatter";

const SAMPLE_WIR_ROWS = [
    {
        id: "wir-1",
        wir_no: "HIPPL-XXX-YYY-WIR-01",
        initiator: "Sudarshan Shelke",
        submission_date: "2024-06-27",
        location_block: "A Block South side",
        gridlines: "Nalla",
        element: "Retaining wall",
        description_of_inspection: "Excavation",
        approved_wms_ref_no: "WMS-CIV-001",
        zone_area: "A Block",
        inspection_for: "Excavation inspection",
        status: "B",
        response_received_on: "2024-06-28",
        reason_for_rejection: "",
        remarks: "-",
    },
    {
        id: "wir-2",
        wir_no: "HIPPL-XXX-YYY-WIR-03",
        initiator: "Sudarshan Shelke",
        submission_date: "2024-07-08",
        location_block: "E Block",
        gridlines: "K19,K17,K15,G19,G17,G15,D17 & D15",
        element: "Footing",
        description_of_inspection: "Excavation",
        approved_wms_ref_no: "WMS-CIV-002",
        zone_area: "E Block",
        inspection_for: "Footing excavation",
        status: "C",
        response_received_on: "2024-07-10",
        reason_for_rejection: "Site Not Ready",
        remarks: "Resubmit after site readiness",
    },
];

function formatDate(value) {
    return formatDisplayDate(value);
}

function getValue(row, keys, fallback = "") {
    for (const key of keys) {
        if (
            row?.[key] !== undefined &&
            row?.[key] !== null &&
            String(row[key]).trim() !== ""
        ) {
            return row[key];
        }
    }
    return fallback;
}

function normalizeWirRow(row, index) {
    return {
        id: row?.id || row?.uuid || `wir-${index}`,
        wirNo: getValue(
            row,
            ["wir_no", "wirNo", "wir_number", "wirNumber", "request_no", "requestNo"],
            `WIR-${index + 1}`
        ),
        initiator: getValue(row, ["initiator", "created_by", "createdBy"], "-"),
        submissionDate: getValue(
            row,
            ["submission_date", "submissionDate", "date_of_submission", "date", "created_at"],
            ""
        ),
        locationBlock: getValue(
            row,
            ["location_block", "locationBlock", "location", "block"],
            "-"
        ),
        gridlines: getValue(row, ["gridlines", "grid_lines", "gridLines"], "-"),
        element: getValue(row, ["element"], "-"),
        description: getValue(
            row,
            [
                "description_of_inspection",
                "descriptionOfInspection",
                "description",
                "work_type",
                "workType",
            ],
            "-"
        ),
        approvedWmsRefNo: getValue(
            row,
            ["approved_wms_ref_no", "approvedWmsRefNo", "wms_ref_no", "wmsRefNo"],
            "-"
        ),
        zoneArea: getValue(row, ["zone_area", "zoneArea"], "-"),
        inspectionFor: getValue(
            row,
            ["inspection_for", "inspectionFor", "inspection_details"],
            "-"
        ),
        status: getValue(row, ["status", "current_status"], "Draft"),
        responseReceivedOn: getValue(
            row,
            ["response_received_on", "responseReceivedOn", "response_date", "responseDate"],
            ""
        ),
        reasonForRejection: getValue(
            row,
            ["reason_for_rejection", "reasonForRejection", "rejection_reason"],
            ""
        ),
        remarks: getValue(row, ["remarks", "remark", "resubmission_status"], "-"),
        raw: row,
    };
}

function statusClass(status) {
    const s = String(status || "").toLowerCase();

    if (["b", "approved", "accepted", "closed"].includes(s)) {
        return "bg-emerald-50 text-emerald-700 ring-emerald-100";
    }

    if (["c", "rejected", "not approved"].includes(s)) {
        return "bg-rose-50 text-rose-700 ring-rose-100";
    }

    if (["pending", "draft", "submitted", "under review"].includes(s)) {
        return "bg-amber-50 text-amber-700 ring-amber-100";
    }

    return "bg-gray-50 text-gray-700 ring-gray-100";
}

export default function WIRRegister({
    rows = [],
    loading = false,
    onView,
    onFormOpenChange,

}) {
    const [query, setQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [expandedId, setExpandedId] = useState(null);
    const [showCreateForm, setShowCreateForm] = useState(false);

    const sourceRows = Array.isArray(rows) && rows.length > 0 ? rows : SAMPLE_WIR_ROWS;
    const isSample = !Array.isArray(rows) || rows.length === 0;

    const normalizedRows = useMemo(
        () => sourceRows.map((row, index) => normalizeWirRow(row, index)),
        [sourceRows]
    );

    const statusOptions = useMemo(() => {
        const values = Array.from(
            new Set(
                normalizedRows
                    .map((row) => String(row.status || "").trim())
                    .filter(Boolean)
            )
        );

        return ["all", ...values];
    }, [normalizedRows]);

    const filteredRows = useMemo(() => {
        const q = query.trim().toLowerCase();

        return normalizedRows.filter((row) => {
            const matchesSearch =
                !q ||
                [
                    row.wirNo,
                    row.initiator,
                    row.locationBlock,
                    row.gridlines,
                    row.element,
                    row.description,
                    row.approvedWmsRefNo,
                    row.zoneArea,
                    row.status,
                    row.remarks,
                ]
                    .join(" ")
                    .toLowerCase()
                    .includes(q);

            const matchesStatus =
                statusFilter === "all" ||
                String(row.status || "").toLowerCase() ===
                String(statusFilter).toLowerCase();

            return matchesSearch && matchesStatus;
        });
    }, [normalizedRows, query, statusFilter]);

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
                        Back to WIR Register
                    </button>
                </div>

                <WorkInspectionRequest />
            </div>
        );
    }

    return (
        <div className="space-y-5">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <div className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-700 ring-1 ring-sky-100">
                            <ClipboardList className="h-3.5 w-3.5" />
                            WIR Register
                        </div>

                        <h2 className="mt-3 text-xl font-semibold text-gray-900">
                            Work Inspection Request Register
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                            Optimized list view for work inspection requests. Open details for gridlines, WMS reference, response and rejection information.
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
                        Create WIR
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
                            placeholder="Search WIR no, initiator, location, element..."
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
                    <table className="min-w-[1250px] w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50/80 text-left">
                                <th className="px-4 py-3 font-semibold text-gray-600">Sr.</th>
                                <th className="px-4 py-3 font-semibold text-gray-600">WIR No.</th>
                                <th className="px-4 py-3 font-semibold text-gray-600">Initiator</th>
                                <th className="px-4 py-3 font-semibold text-gray-600">Submission</th>
                                <th className="px-4 py-3 font-semibold text-gray-600">Location / Block</th>
                                <th className="px-4 py-3 font-semibold text-gray-600">Gridlines</th>
                                <th className="px-4 py-3 font-semibold text-gray-600">Element</th>
                                <th className="px-4 py-3 font-semibold text-gray-600">Inspection</th>
                                <th className="px-4 py-3 font-semibold text-gray-600">Status</th>
                                <th className="px-4 py-3 font-semibold text-gray-600">Response</th>
                                <th className="px-4 py-3 font-semibold text-gray-600">Remarks</th>
                                <th className="px-4 py-3 font-semibold text-gray-600 text-right">Action</th>
                            </tr>
                        </thead>

                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={12} className="px-4 py-10 text-center text-gray-400">
                                        Loading WIR register...
                                    </td>
                                </tr>
                            ) : filteredRows.length === 0 ? (
                                <tr>
                                    <td colSpan={12} className="px-4 py-10 text-center text-gray-400">
                                        No WIR records found.
                                    </td>
                                </tr>
                            ) : (
                                filteredRows.map((row, index) => {
                                    const expanded = expandedId === row.id;

                                    return (
                                        <Fragment key={row.id}>
                                            <tr className="border-t border-gray-100 hover:bg-sky-50/30">
                                                <td className="px-4 py-3 text-gray-500">{index + 1}</td>
                                                <td className="px-4 py-3 font-medium text-gray-900">{row.wirNo}</td>
                                                <td className="px-4 py-3 text-gray-700">{row.initiator}</td>
                                                <td className="px-4 py-3 text-gray-700">
                                                    {formatDate(row.submissionDate)}
                                                </td>
                                                <td className="px-4 py-3 text-gray-700">{row.locationBlock}</td>
                                                <td className="px-4 py-3 text-gray-700">
                                                    <div className="max-w-[220px] truncate" title={row.gridlines}>
                                                        {row.gridlines}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-gray-700">{row.element}</td>
                                                <td className="px-4 py-3">
                                                    <div className="max-w-[240px] truncate text-gray-800" title={row.description}>
                                                        {row.description}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${statusClass(row.status)}`}>
                                                        {row.status || "-"}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-gray-700">
                                                    {formatDate(row.responseReceivedOn)}
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
                                                <tr className="border-t border-sky-100 bg-sky-50/30">
                                                    <td colSpan={12} className="px-5 py-4">
                                                        <div className="grid gap-3 text-sm md:grid-cols-3">
                                                            <div>
                                                                <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                                                    Approved WMS Ref. No.
                                                                </div>
                                                                <div className="mt-1 text-gray-800">
                                                                    {row.approvedWmsRefNo}
                                                                </div>
                                                            </div>

                                                            <div>
                                                                <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                                                    Zone / Area
                                                                </div>
                                                                <div className="mt-1 text-gray-800">
                                                                    {row.zoneArea}
                                                                </div>
                                                            </div>

                                                            <div>
                                                                <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                                                    Inspection For
                                                                </div>
                                                                <div className="mt-1 text-gray-800">
                                                                    {row.inspectionFor}
                                                                </div>
                                                            </div>

                                                            <div>
                                                                <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                                                    Reason for Rejection
                                                                </div>
                                                                <div className="mt-1 text-gray-800">
                                                                    {row.reasonForRejection || "-"}
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

                {isSample && (
                    <div className="border-t border-amber-100 bg-amber-50 px-5 py-3 text-xs text-amber-700">
                        Sample WIR register data is showing for layout only. Connect this component with listWIRs() to show real WIR records.
                    </div>
                )}
            </div>
        </div>
    );
}
