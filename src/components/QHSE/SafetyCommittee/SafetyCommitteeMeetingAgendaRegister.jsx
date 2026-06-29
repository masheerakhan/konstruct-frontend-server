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
import SafetyCommitteeMeetingAgenda from "./SafetyCommitteeMeetingAgenda";
import { formatDisplayDate } from "../../../utils/dateFormatter";

function formatDate(value) {
  return formatDisplayDate(value);
}

function formatTime(value) {
  if (!value) return "-";
  return String(value).slice(0, 5);
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

function normalizeSafetyMeetingRow(row, index) {
  const attendees = Array.isArray(row?.attendees) ? row.attendees : [];
  const agendaRows = Array.isArray(row?.agendaRows) ? row.agendaRows : [];

  const presentText = attendees
    .filter((x) => String(x.companyName || x.personName || "").trim())
    .map((x) => `${x.role}: ${x.companyName || "-"} / ${x.personName || "-"}`)
    .join(" | ");

  return {
    id: row?.id || `safety-meeting-${index}`,
    slNo: index + 1,
    date: getValue(row, ["date", "meetingDate", "createdAt"], ""),
    meetingNo: getValue(row, ["meetingNo", "meeting_no"], `SCM-${index + 1}`),
    chairedBy: getValue(row, ["chairedBy", "chaired_by"], "-"),
    presentText: presentText || "-",
    participantCount: Number(row?.participantCount || 0),
    startTime: getValue(row, ["timeFrom", "startTime", "start_time"], ""),
    closeOutTime: getValue(
      row,
      ["timeTo", "closeOutTime", "close_out_time"],
      "",
    ),
    projectName: getValue(row, ["projectName", "project_name"], "-"),
    location: getValue(row, ["location"], "-"),
    venue: getValue(row, ["venue"], "-"),
    agendaCount: agendaRows.length,
    pendingCount: agendaRows.filter((x) =>
      String(x.status || "")
        .toLowerCase()
        .includes("pending"),
    ).length,
    status: getValue(row, ["status"], "Open"),
    remarks: getValue(row, ["remarks", "remark"], "-"),
    raw: row,
  };
}

function statusClass(status) {
  const s = String(status || "").toLowerCase();

  if (s.includes("closed")) {
    return "bg-emerald-50 text-emerald-700 ring-emerald-100";
  }

  if (s.includes("open") || s.includes("pending")) {
    return "bg-amber-50 text-amber-700 ring-amber-100";
  }

  return "bg-gray-50 text-gray-700 ring-gray-100";
}

export default function SafetyCommitteeMeetingAgendaRegister({
  rows = [],
  loading = false,
  projectOptions = [],
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
    () => sourceRows.map((row, index) => normalizeSafetyMeetingRow(row, index)),
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
          row.meetingNo,
          row.projectName,
          row.location,
          row.venue,
          row.chairedBy,
          row.presentText,
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
            Back to Safety Meeting Register
          </button>
        </div>

        <SafetyCommitteeMeetingAgenda
          projectOptions={projectOptions}
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
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700 ring-1 ring-emerald-100">
              <ClipboardList className="h-3.5 w-3.5" />
              Safety Committee Register
            </div>

            <h2 className="mt-3 text-xl font-semibold text-gray-900">
              Safety Committee Meeting Register
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Track safety committee meeting date, meeting number, attendees,
              participants and meeting timings.
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
            Create Meeting Agenda
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
              placeholder="Search meeting no, project, location, attendees..."
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
                <th className="px-4 py-3 font-semibold text-gray-600">
                  Sl.No.
                </th>
                <th className="px-4 py-3 font-semibold text-gray-600">Date</th>
                <th className="px-4 py-3 font-semibold text-gray-600">
                  Meeting No
                </th>
                <th className="px-4 py-3 font-semibold text-gray-600">
                  Chaired By
                </th>
                <th className="px-4 py-3 font-semibold text-gray-600">
                  Client, PMC & Contractors Present
                </th>
                <th className="px-4 py-3 font-semibold text-gray-600">
                  No. of Participants
                </th>
                <th className="px-4 py-3 font-semibold text-gray-600">
                  Start Time
                </th>
                <th className="px-4 py-3 font-semibold text-gray-600">
                  Close Out Time
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
                    Loading safety committee meetings...
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    className="px-4 py-10 text-center text-gray-400"
                  >
                    No safety committee meetings found. Click Create Meeting
                    Agenda to add one.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row, index) => {
                  const expanded = expandedId === row.id;

                  return (
                    <Fragment key={row.id}>
                      <tr className="border-t border-gray-100 hover:bg-emerald-50/30">
                        <td className="px-4 py-3 text-gray-500">{index + 1}</td>
                        <td className="px-4 py-3 text-gray-700">
                          {formatDate(row.date)}
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {row.meetingNo}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {row.chairedBy}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          <div
                            className="max-w-[320px] truncate"
                            title={row.presentText}
                          >
                            {row.presentText}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {row.participantCount || "-"}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {formatTime(row.startTime)}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {formatTime(row.closeOutTime)}
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
                        <tr className="border-t border-emerald-100 bg-emerald-50/30">
                          <td colSpan={10} className="px-5 py-4">
                            <div className="grid gap-3 text-sm md:grid-cols-4">
                              <div>
                                <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                  Project
                                </div>
                                <div className="mt-1 text-gray-800">
                                  {row.projectName}
                                </div>
                              </div>

                              <div>
                                <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                  Location
                                </div>
                                <div className="mt-1 text-gray-800">
                                  {row.location}
                                </div>
                              </div>

                              <div>
                                <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                  Venue
                                </div>
                                <div className="mt-1 text-gray-800">
                                  {row.venue}
                                </div>
                              </div>

                              <div>
                                <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                  Agenda Summary
                                </div>
                                <div className="mt-1 text-gray-800">
                                  {row.agendaCount} agenda point(s),{" "}
                                  {row.pendingCount} pending
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
