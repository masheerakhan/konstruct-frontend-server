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
import MockDrillObservationReport from "./MockDrillObservationReport";
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

function formatDuration(minutes) {
  const m = Number(minutes || 0);
  if (!m) return "0 min";

  const h = Math.floor(m / 60);
  const rem = m % 60;

  if (h && rem) return `${h} hr ${rem} min`;
  if (h) return `${h} hr`;
  return `${rem} min`;
}

function normalizeMockDrillRow(row, index) {
  const timelineRows = Array.isArray(row?.timelineRows) ? row.timelineRows : [];
  const participationRows = Array.isArray(row?.participationRows)
    ? row.participationRows
    : [];
  const drawbacks = Array.isArray(row?.drawbacks) ? row.drawbacks : [];
  const improvementRows = Array.isArray(row?.improvementRows)
    ? row.improvementRows
    : [];

  const totalParticipants = participationRows.reduce((sum, item) => {
    return sum + (Number(item.participants) || 0);
  }, 0);

  const totalMissing = participationRows.reduce((sum, item) => {
    return sum + (Number(item.missingPersonnel) || 0);
  }, 0);

  return {
    id: row?.id || `mock-drill-${index}`,
    mockDrillNo: getValue(
      row,
      ["mockDrillNo", "mock_drill_no"],
      `MD-${index + 1}`,
    ),
    projectName: getValue(row, ["projectName", "project_name"], "-"),
    mockDrillDate: getValue(row, ["mockDrillDate", "mock_drill_date"], ""),
    contractor: getValue(row, ["contractor"], "-"),
    observerName: getValue(row, ["observerName", "observer_name"], "-"),
    drillType: getValue(row, ["drillType", "drill_type"], "-"),
    weatherCondition: getValue(
      row,
      ["weatherCondition", "weather_condition"],
      "-",
    ),
    totalTimeTakenMinutes: Number(row?.totalTimeTakenMinutes || 0),
    timelineCount: timelineRows.length,
    drawbackCount: drawbacks.length,
    totalParticipants,
    totalMissing,
    improvementCount: improvementRows.length,
    status: getValue(row, ["status"], "Open"),
    remarks: getValue(row, ["remarks", "remark"], "-"),
    raw: row,
  };
}

function statusClass(status) {
  const s = String(status || "").toLowerCase();

  if (s.includes("closed") || s.includes("completed")) {
    return "bg-emerald-50 text-emerald-700 ring-emerald-100";
  }

  if (s.includes("open") || s.includes("pending")) {
    return "bg-amber-50 text-amber-700 ring-amber-100";
  }

  return "bg-gray-50 text-gray-700 ring-gray-100";
}

export default function MockDrillObservationReportRegister({
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
    () => sourceRows.map((row, index) => normalizeMockDrillRow(row, index)),
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
          row.mockDrillNo,
          row.projectName,
          row.contractor,
          row.observerName,
          row.drillType,
          row.weatherCondition,
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
            Back to Mock Drill Register
          </button>
        </div>

        <MockDrillObservationReport
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
            <div className="inline-flex items-center gap-2 rounded-full bg-purple-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-purple-700 ring-1 ring-purple-100">
              <ClipboardList className="h-3.5 w-3.5" />
              Mock Drill Register
            </div>

            <h2 className="mt-3 text-xl font-semibold text-gray-900">
              Mock Drill Observation Report Register
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Track mock drill type, observer, timing, participation, drawbacks
              and improvement actions.
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
            Create Mock Drill Report
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
              placeholder="Search mock drill no, project, contractor, observer..."
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
                  Mock Drill No.
                </th>
                <th className="px-4 py-3 font-semibold text-gray-600">Date</th>
                <th className="px-4 py-3 font-semibold text-gray-600">
                  Project
                </th>
                <th className="px-4 py-3 font-semibold text-gray-600">
                  Contractor
                </th>
                <th className="px-4 py-3 font-semibold text-gray-600">
                  Drill Type
                </th>
                <th className="px-4 py-3 font-semibold text-gray-600">
                  Observer
                </th>
                <th className="px-4 py-3 font-semibold text-gray-600">
                  Total Time
                </th>
                <th className="px-4 py-3 font-semibold text-gray-600">
                  Participants
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
                    colSpan={11}
                    className="px-4 py-10 text-center text-gray-400"
                  >
                    Loading mock drill reports...
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={11}
                    className="px-4 py-10 text-center text-gray-400"
                  >
                    No mock drill reports found. Click Create Mock Drill Report
                    to add one.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row, index) => {
                  const expanded = expandedId === row.id;

                  return (
                    <Fragment key={row.id}>
                      <tr className="border-t border-gray-100 hover:bg-purple-50/30">
                        <td className="px-4 py-3 text-gray-500">{index + 1}</td>
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {row.mockDrillNo}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {formatDate(row.mockDrillDate)}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {row.projectName}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {row.contractor}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          <div
                            className="max-w-[220px] truncate"
                            title={row.drillType}
                          >
                            {row.drillType}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {row.observerName}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {formatDuration(row.totalTimeTakenMinutes)}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {row.totalParticipants}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${statusClass(
                              row.status,
                            )}`}
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
                        <tr className="border-t border-purple-100 bg-purple-50/30">
                          <td colSpan={11} className="px-5 py-4">
                            <div className="grid gap-3 text-sm md:grid-cols-4">
                              <div>
                                <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                  Weather
                                </div>
                                <div className="mt-1 text-gray-800">
                                  {row.weatherCondition}
                                </div>
                              </div>

                              <div>
                                <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                  Timeline Items
                                </div>
                                <div className="mt-1 text-gray-800">
                                  {row.timelineCount}
                                </div>
                              </div>

                              <div>
                                <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                  Drawbacks
                                </div>
                                <div className="mt-1 text-gray-800">
                                  {row.drawbackCount}
                                </div>
                              </div>

                              <div>
                                <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                  Improvement Actions
                                </div>
                                <div className="mt-1 text-gray-800">
                                  {row.improvementCount}
                                </div>
                              </div>

                              <div>
                                <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                  Missing Personnel
                                </div>
                                <div className="mt-1 text-gray-800">
                                  {row.totalMissing}
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
