import { Fragment, useMemo, useState } from "react";
import {
  ClipboardList,
  ChevronDown,
  ChevronUp,
  Eye,
  Filter,
  Plus,
  Search,
} from "lucide-react";
import DebitNote from "./DebitNote";
import { formatDisplayDate } from "../../../utils/dateFormatter";

function formatDate(value) {
  return formatDisplayDate(value);
}

function formatINR(value) {
  const n = Number(value || 0);
  return n.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });
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

function normalizeDebitNoteRow(row, index) {
  const penalties = Array.isArray(row?.penalties) ? row.penalties : [];
  const attachments = Array.isArray(row?.attachments) ? row.attachments : [];

  return {
    id: row?.id || `debit-note-${index}`,
    refNo: getValue(
      row,
      ["refNo", "ref_no", "reference_no"],
      `DN-${index + 1}`,
    ),
    project: getValue(row, ["project", "projectName", "project_name"], "-"),
    location: getValue(row, ["location"], "-"),
    date: getValue(row, ["date", "createdAt", "created_at"], ""),
    deptInCharge: getValue(row, ["deptInCharge", "dept_incharge"], "-"),
    noticeIssuedTo: getValue(row, ["noticeIssuedTo", "notice_issued_to"], "-"),
    siteInCharge: getValue(row, ["siteInCharge", "site_incharge"], "-"),
    areaOfNonCompliance: getValue(
      row,
      ["areaOfNonCompliance", "area_of_non_compliance"],
      "-",
    ),
    pastViolation: getValue(row, ["pastViolation", "past_violation"], "-"),
    pastViolationNo: getValue(
      row,
      ["pastViolationNo", "past_violation_no"],
      "-",
    ),
    description: getValue(row, ["description"], "-"),
    penaltyCount: penalties.length,
    attachmentCount: attachments.length,
    totalPenalty: Number(row?.totalPenalty || 0),
    status: getValue(row, ["status"], "Open"),
    raw: row,
  };
}

function statusClass(status) {
  const s = String(status || "").toLowerCase();

  if (s.includes("closed") || s.includes("approved") || s.includes("paid")) {
    return "bg-emerald-50 text-emerald-700 ring-emerald-100";
  }

  if (s.includes("rejected") || s.includes("cancelled")) {
    return "bg-rose-50 text-rose-700 ring-rose-100";
  }

  if (s.includes("open") || s.includes("pending") || s.includes("submitted")) {
    return "bg-amber-50 text-amber-700 ring-amber-100";
  }

  return "bg-gray-50 text-gray-700 ring-gray-100";
}

export default function DebitNoteRegister({
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
    () => sourceRows.map((row, index) => normalizeDebitNoteRow(row, index)),
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
          row.refNo,
          row.project,
          row.location,
          row.deptInCharge,
          row.noticeIssuedTo,
          row.siteInCharge,
          row.areaOfNonCompliance,
          row.description,
          row.status,
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
            Back to Debit Note Register
          </button>
        </div>

        <DebitNote
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
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-700 ring-1 ring-amber-100">
              <ClipboardList className="h-3.5 w-3.5" />
              Debit Note Register
            </div>

            <h2 className="mt-3 text-xl font-semibold text-gray-900">
              Debit Note Register
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Track penalty notices, non-compliance location, issued-to details
              and total penalty amount.
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
            Create Debit Note
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
              placeholder="Search ref no, project, location, issued to..."
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
                <th className="px-4 py-3 font-semibold text-gray-600">
                  Ref No.
                </th>
                <th className="px-4 py-3 font-semibold text-gray-600">Date</th>
                <th className="px-4 py-3 font-semibold text-gray-600">
                  Project
                </th>
                <th className="px-4 py-3 font-semibold text-gray-600">
                  Location
                </th>
                <th className="px-4 py-3 font-semibold text-gray-600">
                  Issued To
                </th>
                <th className="px-4 py-3 font-semibold text-gray-600">Area</th>
                <th className="px-4 py-3 font-semibold text-gray-600">
                  Penalty
                </th>
                <th className="px-4 py-3 font-semibold text-gray-600">
                  Status
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
                    colSpan={10}
                    className="px-4 py-10 text-center text-gray-400"
                  >
                    Loading Debit Note register...
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    className="px-4 py-10 text-center text-gray-400"
                  >
                    No Debit Note records found. Click Create Debit Note to add
                    a new record.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row, index) => {
                  const expanded = expandedId === row.id;

                  return (
                    <Fragment key={row.id}>
                      <tr className="border-t border-gray-100 hover:bg-amber-50/30">
                        <td className="px-4 py-3 text-gray-500">{index + 1}</td>
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {row.refNo}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {formatDate(row.date)}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {row.project}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {row.location}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {row.noticeIssuedTo}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          <div
                            className="max-w-[220px] truncate"
                            title={row.areaOfNonCompliance}
                          >
                            {row.areaOfNonCompliance}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900">
                          ₹ {formatINR(row.totalPenalty)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${statusClass(row.status)}`}
                          >
                            {row.status || "-"}
                          </span>
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
                        <tr className="border-t border-amber-100 bg-amber-50/30">
                          <td colSpan={10} className="px-5 py-4">
                            <div className="grid gap-3 text-sm md:grid-cols-4">
                              <div>
                                <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                  Department In-charge
                                </div>
                                <div className="mt-1 text-gray-800">
                                  {row.deptInCharge}
                                </div>
                              </div>

                              <div>
                                <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                  Site In-charge
                                </div>
                                <div className="mt-1 text-gray-800">
                                  {row.siteInCharge}
                                </div>
                              </div>

                              <div>
                                <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                  Past Violation
                                </div>
                                <div className="mt-1 text-gray-800">
                                  {row.pastViolation}{" "}
                                  {row.pastViolationNo !== "-"
                                    ? `(${row.pastViolationNo})`
                                    : ""}
                                </div>
                              </div>

                              <div>
                                <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                  Attachments / Penalty Rows
                                </div>
                                <div className="mt-1 text-gray-800">
                                  {row.attachmentCount} attachment(s),{" "}
                                  {row.penaltyCount} penalty row(s)
                                </div>
                              </div>

                              <div className="md:col-span-4">
                                <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                  Description
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
