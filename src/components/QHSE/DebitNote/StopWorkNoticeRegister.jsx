import { Fragment, useMemo, useState } from "react";
import {
  AlertOctagon,
  ChevronDown,
  ChevronUp,
  Eye,
  Filter,
  Plus,
  Search,
} from "lucide-react";
import StopWorkNotice from "./StopWorkNotice";
import { formatDisplayDate } from "../../../utils/dateFormatter";

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

function normalizeStopWorkRow(row, index) {
  return {
    id: row?.id || `stop-work-${index}`,
    swnNo: getValue(
      row,
      [
        "stopWorkNotificationNo",
        "swnNo",
        "swn_no",
        "stop_work_notification_no",
      ],
      `SWN-${index + 1}`,
    ),
    type: getValue(row, ["type", "qualityHse", "quality_hse"], "HSE"),
    location: getValue(
      row,
      ["floorLocationOtherRef", "location", "floor_location_other_ref"],
      "-",
    ),
    description: getValue(row, ["description", "observation"], "-"),
    dateOfIssue: getValue(
      row,
      ["date", "dateOfIssue", "date_of_issue", "createdAt"],
      "",
    ),
    issuedTo: getValue(
      row,
      ["issuedToCompanyName", "issuedTo", "issued_to", "company_name"],
      "-",
    ),
    issuedBy: getValue(row, ["issuedBy", "issued_by"], "-"),
    status: getValue(row, ["status"], "Open"),
    dateOfClosure: getValue(row, ["dateOfClosure", "date_of_closure"], ""),
    remarks: getValue(row, ["remarks", "remark"], "-"),
    sitePlantWorkshopOffice: getValue(
      row,
      ["sitePlantWorkshopOffice", "site_plant_workshop_office"],
      "-",
    ),
    concernEngineerSupervisor: getValue(
      row,
      ["concernEngineerSupervisor", "concern_engineer_supervisor"],
      "-",
    ),
    department: getValue(row, ["department"], "-"),
    raw: row,
  };
}

function statusClass(status) {
  const s = String(status || "").toLowerCase();

  if (s.includes("close") || s.includes("closed")) {
    return "bg-emerald-50 text-emerald-700 ring-emerald-100";
  }

  if (s.includes("reject") || s.includes("cancel")) {
    return "bg-rose-50 text-rose-700 ring-rose-100";
  }

  if (s.includes("open") || s.includes("pending") || s.includes("submitted")) {
    return "bg-amber-50 text-amber-700 ring-amber-100";
  }

  return "bg-gray-50 text-gray-700 ring-gray-100";
}

export default function StopWorkNoticeRegister({
  rows = [],
  loading = false,
  onView,
  onFormOpenChange,
}) {
  const [localRows, setLocalRows] = useState([]);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedId, setExpandedId] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const sourceRows = [...(rows || []), ...localRows];

  const normalizedRows = useMemo(
    () => sourceRows.map((row, index) => normalizeStopWorkRow(row, index)),
    [sourceRows],
  );

  const statusOptions = useMemo(() => {
    const values = Array.from(
      new Set(
        normalizedRows
          .map((row) => String(row.status || "").trim())
          .filter(Boolean),
      ),
    );
    return ["all", ...values];
  }, [normalizedRows]);

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();

    return normalizedRows.filter((row) => {
      const matchesSearch =
        !q ||
        [
          row.swnNo,
          row.type,
          row.location,
          row.description,
          row.issuedTo,
          row.issuedBy,
          row.status,
          row.remarks,
          row.department,
          row.concernEngineerSupervisor,
        ]
          .join(" ")
          .toLowerCase()
          .includes(q);

      const matchesType =
        typeFilter === "all" ||
        String(row.type || "").toLowerCase() ===
          String(typeFilter).toLowerCase();

      const matchesStatus =
        statusFilter === "all" ||
        String(row.status || "").toLowerCase() ===
          String(statusFilter).toLowerCase();

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [normalizedRows, query, typeFilter, statusFilter]);

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
            Back to Stop Work Register
          </button>
        </div>

        <StopWorkNotice
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
            <div className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-red-700 ring-1 ring-red-100">
              <AlertOctagon className="h-3.5 w-3.5" />
              Stop Work Register
            </div>

            <h2 className="mt-3 text-xl font-semibold text-gray-900">
              Stop Work Notice Register
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Track stop work notices by type, location, issued-to details,
              status and closure date.
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
            Create Stop Work Notice
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
              placeholder="Search SWN no, location, issued to, description..."
              className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-10 min-w-[150px] rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">All types</option>
              <option value="HSE">HSE</option>
              <option value="Quality">Quality</option>
              <option value="Others">Others</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 min-w-[170px] rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
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
          <table className="min-w-[1300px] w-full text-sm">
            <thead>
              <tr className="bg-gray-50/80 text-left">
                <th className="px-4 py-3 font-semibold text-gray-600">Sr.</th>
                <th className="px-4 py-3 font-semibold text-gray-600">
                  SWN No.
                </th>
                <th className="px-4 py-3 font-semibold text-gray-600">
                  Quality / HSE
                </th>
                <th className="px-4 py-3 font-semibold text-gray-600">
                  Location
                </th>
                <th className="px-4 py-3 font-semibold text-gray-600">
                  Description
                </th>
                <th className="px-4 py-3 font-semibold text-gray-600">
                  Date of Issue
                </th>
                <th className="px-4 py-3 font-semibold text-gray-600">
                  Issued To
                </th>
                <th className="px-4 py-3 font-semibold text-gray-600">
                  Issued By
                </th>
                <th className="px-4 py-3 font-semibold text-gray-600">
                  Status
                </th>
                <th className="px-4 py-3 font-semibold text-gray-600">
                  Date of Closure
                </th>
                <th className="px-4 py-3 font-semibold text-gray-600">
                  Remarks
                </th>
                <th className="px-4 py-3 font-semibold text-gray-600 text-right">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={12}
                    className="px-4 py-10 text-center text-gray-400"
                  >
                    Loading Stop Work Notice register...
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={12}
                    className="px-4 py-10 text-center text-gray-400"
                  >
                    No Stop Work Notice records found. Click Create Stop Work
                    Notice to add a new record.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row, index) => {
                  const expanded = expandedId === row.id;

                  return (
                    <Fragment key={row.id}>
                      <tr className="border-t border-gray-100 hover:bg-red-50/30">
                        <td className="px-4 py-3 text-gray-500">{index + 1}</td>
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {row.swnNo}
                        </td>
                        <td className="px-4 py-3 text-gray-700">{row.type}</td>
                        <td className="px-4 py-3 text-gray-700">
                          <div
                            className="max-w-[180px] truncate"
                            title={row.location}
                          >
                            {row.location}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          <div
                            className="max-w-[260px] truncate"
                            title={row.description}
                          >
                            {row.description}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {formatDate(row.dateOfIssue)}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          <div
                            className="max-w-[180px] truncate"
                            title={row.issuedTo}
                          >
                            {row.issuedTo}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {row.issuedBy}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${statusClass(row.status)}`}
                          >
                            {row.status || "-"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {formatDate(row.dateOfClosure)}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          <div
                            className="max-w-[220px] truncate"
                            title={row.remarks}
                          >
                            {row.remarks || "-"}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedId(expanded ? null : row.id)
                              }
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
                        <tr className="border-t border-red-100 bg-red-50/30">
                          <td colSpan={12} className="px-5 py-4">
                            <div className="grid gap-3 text-sm md:grid-cols-4">
                              <div>
                                <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                  Site / Plant / Workshop / Office
                                </div>
                                <div className="mt-1 text-gray-800">
                                  {row.sitePlantWorkshopOffice}
                                </div>
                              </div>

                              <div>
                                <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                  Concern Engineer / Supervisor
                                </div>
                                <div className="mt-1 text-gray-800">
                                  {row.concernEngineerSupervisor}
                                </div>
                              </div>

                              <div>
                                <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                  Department
                                </div>
                                <div className="mt-1 text-gray-800">
                                  {row.department}
                                </div>
                              </div>

                              <div>
                                <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                  Status / Closure
                                </div>
                                <div className="mt-1 text-gray-800">
                                  {row.status} / {formatDate(row.dateOfClosure)}
                                </div>
                              </div>

                              <div className="md:col-span-4">
                                <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                  Full Description
                                </div>
                                <div className="mt-1 text-gray-800">
                                  {row.description}
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
