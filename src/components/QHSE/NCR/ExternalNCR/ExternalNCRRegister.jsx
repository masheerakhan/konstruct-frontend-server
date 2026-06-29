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
import HSE from "./HSE";
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

function normalizeEncRow(row, index) {
  return {
    id: row?.id || `enc-${index}`,
    refNo: getValue(
      row,
      ["referenceNo", "reference_no", "ncr_ref_no", "ncrRefNo"],
      `ENC-${index + 1}`,
    ),
    type: getValue(row, ["ncType", "nc_type", "type"], "HSE"),
    issuedBy: getValue(row, ["issuedBy", "issued_by"], "-"),
    dateOfIssue: getValue(
      row,
      ["dateOfIssue", "date_of_issue", "createdAt", "created_at"],
      "",
    ),
    receivedDate: getValue(
      row,
      ["ncrReceivedDate", "ncr_received_date", "receivedDate"],
      "",
    ),
    description: getValue(row, ["ncrSubject", "description", "subject"], "-"),
    nonConformity: getValue(row, ["nonConformity", "non_conformity"], "-"),
    level: getValue(row, ["level", "severity"], "-"),
    location: getValue(
      row,
      ["projectLocation", "project_location", "location"],
      "-",
    ),
    gridRoom: getValue(row, ["gridRoom", "grid_room"], "-"),
    accepted: getValue(
      row,
      ["accepted", "acceptedOrNot", "accepted_or_not"],
      "-",
    ),
    issuedTo: getValue(row, ["issuedTo", "issued_to"], "-"),
    presentIncharge: getValue(
      row,
      ["presentIncharge", "present_incharge"],
      "-",
    ),
    siteTeamResponse: getValue(
      row,
      ["siteTeamResponse", "site_team_response"],
      "-",
    ),
    dispositionSubmittedDate: getValue(
      row,
      ["dispositionSubmittedDate", "disposition_submitted_date"],
      "",
    ),
    dispositionFeedbackDate: getValue(
      row,
      ["dispositionFeedbackDate", "disposition_feedback_date"],
      "",
    ),
    dispositionStatus: getValue(
      row,
      ["dispositionStatus", "disposition_status"],
      "",
    ),
    closeoutSubmittedDate: getValue(
      row,
      ["closeoutSubmittedDate", "closeout_submitted_date"],
      "",
    ),
    closeoutFeedbackDate: getValue(
      row,
      ["closeoutFeedbackDate", "closeout_feedback_date"],
      "",
    ),
    closeoutStatus: getValue(row, ["closeoutStatus", "closeout_status"], ""),
    rootCause: getValue(row, ["rootCause", "root_cause"], "-"),
    correction: getValue(row, ["correction"], "-"),
    correctiveAction: getValue(
      row,
      ["correctiveAction", "corrective_action"],
      "-",
    ),
    remarks: getValue(row, ["remarks", "remark"], "-"),
    status: getValue(row, ["status"], "Open"),
    raw: row,
  };
}

function getOverallStatus(row) {
  const closeout = String(row.closeoutStatus || "").toLowerCase();
  const disposition = String(row.dispositionStatus || "").toLowerCase();
  const status = String(row.status || "").toLowerCase();

  if (closeout.includes("closed") || status.includes("closed")) return "Closed";
  if (disposition.includes("accepted")) return "Disposition Accepted";
  if (disposition.includes("rejected")) return "Disposition Rejected";
  if (status.includes("open")) return "Open";

  return row.status || "Open";
}

function statusClass(status) {
  const s = String(status || "").toLowerCase();

  if (s.includes("closed") || s.includes("accepted")) {
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

export default function ExternalNCRRegister({
  rows = [],
  loading = false,
  onView,
  onFormOpenChange,
}) {
  const [localRows, setLocalRows] = useState([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [expandedId, setExpandedId] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const sourceRows = [...(rows || []), ...localRows];

  const normalizedRows = useMemo(
    () => sourceRows.map((row, index) => normalizeEncRow(row, index)),
    [sourceRows],
  );

  const statusOptions = useMemo(() => {
    const values = Array.from(
      new Set(
        normalizedRows.map((row) => getOverallStatus(row)).filter(Boolean),
      ),
    );

    return ["all", ...values];
  }, [normalizedRows]);

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();

    return normalizedRows.filter((row) => {
      const overallStatus = getOverallStatus(row);

      const matchesSearch =
        !q ||
        [
          row.refNo,
          row.type,
          row.description,
          row.nonConformity,
          row.location,
          row.gridRoom,
          row.issuedTo,
          row.presentIncharge,
          overallStatus,
          row.remarks,
        ]
          .join(" ")
          .toLowerCase()
          .includes(q);

      const matchesStatus =
        statusFilter === "all" ||
        String(overallStatus || "").toLowerCase() ===
          String(statusFilter).toLowerCase();

      const matchesType =
        typeFilter === "all" ||
        String(row.type || "").toLowerCase() ===
          String(typeFilter).toLowerCase();

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [normalizedRows, query, statusFilter, typeFilter]);

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
            Back to ENC Register
          </button>
        </div>

        <HSE
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
            <div className="inline-flex items-center gap-2 rounded-full bg-rose-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-rose-700 ring-1 ring-rose-100">
              <AlertTriangle className="h-3.5 w-3.5" />
              ENC Register
            </div>

            <h2 className="mt-3 text-xl font-semibold text-gray-900">
              External Non-Conformance Report Register
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Optimized tracking view for issued ENC records, responses,
              disposition and closeout.
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
            Create ENC
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
              placeholder="Search ENC ref, description, location, issued to..."
              className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-10 min-w-[140px] rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">All types</option>
              <option value="Quality">Quality</option>
              <option value="HSE">HSE</option>
            </select>
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
          <table className="min-w-[1250px] w-full text-sm">
            <thead>
              <tr className="bg-gray-50/80 text-left">
                <th className="px-4 py-3 font-semibold text-gray-600">Sr.</th>
                <th className="px-4 py-3 font-semibold text-gray-600">
                  ENC Ref #
                </th>
                <th className="px-4 py-3 font-semibold text-gray-600">Type</th>
                <th className="px-4 py-3 font-semibold text-gray-600">
                  Issued Date
                </th>
                <th className="px-4 py-3 font-semibold text-gray-600">
                  Description
                </th>
                <th className="px-4 py-3 font-semibold text-gray-600">Level</th>
                <th className="px-4 py-3 font-semibold text-gray-600">
                  Location
                </th>
                <th className="px-4 py-3 font-semibold text-gray-600">
                  Issued To
                </th>
                <th className="px-4 py-3 font-semibold text-gray-600">
                  Present Incharge
                </th>
                <th className="px-4 py-3 font-semibold text-gray-600">
                  Status
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
                    Loading ENC register...
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={12}
                    className="px-4 py-10 text-center text-gray-400"
                  >
                    No ENC records found. Click Create ENC to add a new record.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row, index) => {
                  const expanded = expandedId === row.id;
                  const overallStatus = getOverallStatus(row);

                  return (
                    <Fragment key={row.id}>
                      <tr className="border-t border-gray-100 hover:bg-rose-50/30">
                        <td className="px-4 py-3 text-gray-500">{index + 1}</td>

                        <td className="px-4 py-3 font-medium text-gray-900">
                          {row.refNo}
                        </td>

                        <td className="px-4 py-3 text-gray-700">{row.type}</td>

                        <td className="px-4 py-3 text-gray-700">
                          {formatDate(row.dateOfIssue)}
                        </td>

                        <td className="px-4 py-3">
                          <div
                            className="max-w-[260px] truncate text-gray-800"
                            title={row.description}
                          >
                            {row.description}
                          </div>
                          <div
                            className="max-w-[260px] truncate text-xs text-gray-500"
                            title={row.nonConformity}
                          >
                            {row.nonConformity}
                          </div>
                        </td>

                        <td className="px-4 py-3 text-gray-700">{row.level}</td>

                        <td className="px-4 py-3 text-gray-700">
                          <div
                            className="max-w-[180px] truncate"
                            title={row.location}
                          >
                            {row.location}
                          </div>
                        </td>

                        <td className="px-4 py-3 text-gray-700">
                          {row.issuedTo}
                        </td>

                        <td className="px-4 py-3 text-gray-700">
                          {row.presentIncharge}
                        </td>

                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${statusClass(overallStatus)}`}
                          >
                            {overallStatus}
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          <div
                            className="max-w-[220px] truncate text-gray-700"
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
                        <tr className="border-t border-rose-100 bg-rose-50/30">
                          <td colSpan={12} className="px-5 py-4">
                            <div className="grid gap-3 text-sm md:grid-cols-4">
                              <div>
                                <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                  NCR Received Date
                                </div>
                                <div className="mt-1 text-gray-800">
                                  {formatDate(row.receivedDate)}
                                </div>
                              </div>

                              <div>
                                <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                  Accepted / Not Accepted
                                </div>
                                <div className="mt-1 text-gray-800">
                                  {row.accepted}
                                </div>
                              </div>

                              <div>
                                <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                  Site Team Response
                                </div>
                                <div className="mt-1 text-gray-800">
                                  {row.siteTeamResponse}
                                </div>
                              </div>

                              <div>
                                <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                  Grid / Room
                                </div>
                                <div className="mt-1 text-gray-800">
                                  {row.gridRoom}
                                </div>
                              </div>

                              <div>
                                <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                  Disposition Submitted
                                </div>
                                <div className="mt-1 text-gray-800">
                                  {formatDate(row.dispositionSubmittedDate)}
                                </div>
                              </div>

                              <div>
                                <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                  Disposition Feedback
                                </div>
                                <div className="mt-1 text-gray-800">
                                  {formatDate(row.dispositionFeedbackDate)}
                                </div>
                              </div>

                              <div>
                                <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                  Closeout Submitted
                                </div>
                                <div className="mt-1 text-gray-800">
                                  {formatDate(row.closeoutSubmittedDate)}
                                </div>
                              </div>

                              <div>
                                <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                  Closeout Feedback
                                </div>
                                <div className="mt-1 text-gray-800">
                                  {formatDate(row.closeoutFeedbackDate)}
                                </div>
                              </div>

                              <div className="md:col-span-2">
                                <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                  Root Cause
                                </div>
                                <div className="mt-1 text-gray-800">
                                  {row.rootCause}
                                </div>
                              </div>

                              <div className="md:col-span-2">
                                <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                  Correction / Corrective Action
                                </div>
                                <div className="mt-1 text-gray-800">
                                  {row.correction}
                                  <br />
                                  {row.correctiveAction}
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
