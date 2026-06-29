import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Trash2,
  Save,
  RotateCcw,
  Users,
  ShieldCheck,
  GraduationCap,
  AlertTriangle,
  Calendar,
  X,
} from "lucide-react";
import { formatInputDate } from "../../../utils/dateFormatter";

const uid = () => Math.random().toString(36).slice(2, 9);
const todayISO = () => formatInputDate(new Date());

const emptyRow = (date = todayISO()) => ({
  id: uid(),
  date,
  staff: 0,
  workers: 0,
  security: 0,
  workingHours: 10,
  general: 0,
  height: 0,
  hot: 0,
  excavation: 0,
  lifting: 0,
  electrical: 0,
  confined: 0,
  pressure: 0,
  tbtAttendance: 0,
  tbtHours: 0,
  inductionTrainings: 0,
  inductionAttendance: 0,
  inductionHours: 0,
  scheduledName: "",
  scheduledAttendance: 0,
  scheduledHours: 0,
  firstAid: 0,
  nearMiss: 0,
  incident: 0,
  accident: 0,
});

const num = (value) => {
  if (value === "") return 0;
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric >= 0 ? numeric : 0;
};

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const PERMIT_FIELDS = [
  "general",
  "height",
  "hot",
  "excavation",
  "lifting",
  "electrical",
  "confined",
  "pressure",
];

export default function HSEMonthlyReport() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [site, setSite] = useState("Panvel Warehousing Pvt Ltd");
  const [company, setCompany] = useState("SCON Projects Pvt Ltd");
  const [rows, setRows] = useState([emptyRow()]);
  const [notice, setNotice] = useState(null);

  const showNotice = (type, message) => {
    setNotice({ type, message });
  };

  const addRow = () => {
    const nextDate = new Date(year, month, Math.min(rows.length + 1, 28));
    setRows((previous) => [...previous, emptyRow(formatInputDate(nextDate))]);
  };

  const removeRow = (id) => {
    setRows((previous) =>
      previous.length > 1 ? previous.filter((row) => row.id !== id) : previous,
    );
  };

  const update = (id, key, value) => {
    setRows((previous) =>
      previous.map((row) => (row.id === id ? { ...row, [key]: value } : row)),
    );
  };

  const calc = useMemo(() => {
    let cumulativeSafeHours = 0;
    let cumulativeTbtHours = 0;
    let cumulativeInductionHours = 0;
    let cumulativeScheduledHours = 0;

    return rows.map((row) => {
      const totalManpower = row.staff + row.workers + row.security;
      const safeManHours = totalManpower * row.workingHours;
      cumulativeSafeHours += safeManHours;

      const totalPermits =
        row.general +
        row.height +
        row.hot +
        row.excavation +
        row.lifting +
        row.electrical +
        row.confined +
        row.pressure;

      // Correct formula: training man-hours = attendance × training duration.
      const tbtTotalHours = row.tbtAttendance * row.tbtHours;
      const inductionTotalHours = row.inductionAttendance * row.inductionHours;
      const scheduledTotalHours = row.scheduledAttendance * row.scheduledHours;
      const trainingHoursPerDay =
        tbtTotalHours + inductionTotalHours + scheduledTotalHours;

      cumulativeTbtHours += tbtTotalHours;
      cumulativeInductionHours += inductionTotalHours;
      cumulativeScheduledHours += scheduledTotalHours;

      const totalIncidents =
        row.firstAid + row.nearMiss + row.incident + row.accident;

      return {
        totalManpower,
        safeManHours,
        cumulativeSafeHours,
        totalPermits,
        tbtTotalHours,
        inductionTotalHours,
        scheduledTotalHours,
        cumulativeTbtHours,
        cumulativeInductionHours,
        cumulativeScheduledHours,
        trainingHoursPerDay,
        totalIncidents,
      };
    });
  }, [rows]);

  const totals = useMemo(() => {
    const total = {
      manpower: 0,
      safeHours: 0,
      permits: 0,
      tbtAttendance: 0,
      tbtTotalHours: 0,
      inductionTrainings: 0,
      inductionAttendance: 0,
      inductionTotalHours: 0,
      scheduledAttendance: 0,
      scheduledTotalHours: 0,
      trainingHours: 0,
      firstAid: 0,
      nearMiss: 0,
      incident: 0,
      accident: 0,
    };

    rows.forEach((row, index) => {
      const rowCalc = calc[index];

      total.manpower += rowCalc.totalManpower;
      total.safeHours += rowCalc.safeManHours;
      total.permits += rowCalc.totalPermits;
      total.tbtAttendance += row.tbtAttendance;
      total.tbtTotalHours += rowCalc.tbtTotalHours;
      total.inductionTrainings += row.inductionTrainings;
      total.inductionAttendance += row.inductionAttendance;
      total.inductionTotalHours += rowCalc.inductionTotalHours;
      total.scheduledAttendance += row.scheduledAttendance;
      total.scheduledTotalHours += rowCalc.scheduledTotalHours;
      total.trainingHours += rowCalc.trainingHoursPerDay;
      total.firstAid += row.firstAid;
      total.nearMiss += row.nearMiss;
      total.incident += row.incident;
      total.accident += row.accident;
    });

    return total;
  }, [rows, calc]);

  const handleSubmit = () => {
    const payload = {
      month: MONTHS[month],
      year,
      site,
      company,
      rows: rows.map((row, index) => ({ ...row, ...calc[index] })),
      totals,
    };

    console.log("HSE Monthly Report submitted:", payload);
    showNotice(
      "success",
      `Monthly HSE Report submitted: ${MONTHS[month]} ${year} — ${rows.length} ${
        rows.length === 1 ? "entry" : "entries"
      } logged.`,
    );
  };

  const handleReset = () => {
    setRows([emptyRow()]);
    showNotice("info", "Form reset");
  };

  const years = Array.from(
    { length: 7 },
    (_, index) => now.getFullYear() - 3 + index,
  );

  const sectionHeader = (icon, title, span, color) => (
    <th
      colSpan={span}
      className={`border-r border-white/20 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white ${color}`}
    >
      <div className="flex items-center justify-center gap-2">
        {icon}
        {title}
      </div>
    </th>
  );

  const inputClass =
    "w-20 rounded border border-slate-200 bg-white px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
  const inputSmallClass =
    "w-16 rounded border border-slate-200 bg-white px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
  const calculatedClass =
    "rounded bg-slate-100 px-2 py-1 text-center text-sm font-semibold text-slate-700";
  const tableHeaderClass =
    "whitespace-nowrap border-b border-slate-200 bg-slate-50 px-3 py-2 text-left text-xs font-medium text-slate-600";

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="sticky top-0 z-20 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 px-6 py-4">
          <div>
            <Link to="/" className="text-xs text-blue-600 hover:underline">
              ← Back
            </Link>
            <h1 className="mt-1 text-xl font-bold text-slate-900">
              Monthly HSE Report Tracker
            </h1>
            <p className="text-sm text-slate-500">
              Track daily HSE metrics across the month.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Save className="h-4 w-4" />
              Submit
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1600px] space-y-6 px-6 py-6">
        {notice && (
          <div
            role="alert"
            className={`flex items-center justify-between gap-3 rounded-md border px-4 py-3 text-sm ${
              notice.type === "success"
                ? "border-green-200 bg-green-50 text-green-800"
                : "border-slate-200 bg-white text-slate-700"
            }`}
          >
            <span>{notice.message}</span>
            <button
              type="button"
              onClick={() => setNotice(null)}
              className="opacity-70 hover:opacity-100"
              aria-label="Dismiss notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Month
              </label>
              <div className="relative">
                <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                <select
                  value={month}
                  onChange={(event) => setMonth(Number(event.target.value))}
                  className="w-full rounded-md border border-slate-200 bg-white py-2 pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {MONTHS.map((monthName, index) => (
                    <option key={monthName} value={index}>
                      {monthName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Year
              </label>
              <select
                value={year}
                onChange={(event) => setYear(Number(event.target.value))}
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {years.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Site
              </label>
              <input
                value={site}
                onChange={(event) => setSite(event.target.value)}
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Company Name
              </label>
              <input
                value={company}
                onChange={(event) => setCompany(event.target.value)}
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
          {[
            {
              label: "Total Manpower",
              value: totals.manpower,
              color: "border-blue-100 bg-blue-50 text-blue-700",
            },
            {
              label: "Safe Man Hours",
              value: totals.safeHours.toLocaleString(),
              color: "border-emerald-100 bg-emerald-50 text-emerald-700",
            },
            {
              label: "Permits Issued",
              value: totals.permits,
              color: "border-violet-100 bg-violet-50 text-violet-700",
            },
            {
              label: "Training Hours",
              value: totals.trainingHours.toFixed(2),
              color: "border-amber-100 bg-amber-50 text-amber-700",
            },
            {
              label: "Near Misses",
              value: totals.nearMiss,
              color: "border-orange-100 bg-orange-50 text-orange-700",
            },
            {
              label: "Incidents + Accidents",
              value: totals.incident + totals.accident,
              color: "border-rose-100 bg-rose-50 text-rose-700",
            },
          ].map((card) => (
            <div
              key={card.label}
              className={`rounded-lg border p-3 ${card.color}`}
            >
              <div className="text-xs font-medium opacity-80">{card.label}</div>
              <div className="mt-1 text-xl font-bold">{card.value}</div>
            </div>
          ))}
        </div>

        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
            <div>
              <h2 className="font-semibold text-slate-900">
                Daily Entries — {MONTHS[month]} {year}
              </h2>
              <p className="text-xs text-slate-500">
                {rows.length} {rows.length === 1 ? "entry" : "entries"}
              </p>
            </div>
            <button
              type="button"
              onClick={addRow}
              className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Add Row
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[2450px] border-collapse">
              <thead>
                <tr>
                  <th className="border-r border-white/20 bg-slate-700 px-3 py-2 text-xs font-semibold uppercase text-white">
                    Date
                  </th>
                  {sectionHeader(
                    <Users className="h-3.5 w-3.5" />,
                    "Manpower Statistics",
                    7,
                    "bg-blue-600",
                  )}
                  {sectionHeader(
                    <ShieldCheck className="h-3.5 w-3.5" />,
                    "Permit Details",
                    9,
                    "bg-violet-600",
                  )}
                  {sectionHeader(
                    <GraduationCap className="h-3.5 w-3.5" />,
                    "Training Hours",
                    12,
                    "bg-amber-600",
                  )}
                  {sectionHeader(
                    <AlertTriangle className="h-3.5 w-3.5" />,
                    "Incident Statistics",
                    5,
                    "bg-rose-600",
                  )}
                  <th className="bg-slate-700 px-3 py-2 text-xs font-semibold uppercase text-white">
                    Actions
                  </th>
                </tr>

                <tr>
                  <th className={tableHeaderClass}></th>
                  <th className={tableHeaderClass}>Staff</th>
                  <th className={tableHeaderClass}>Workers</th>
                  <th className={tableHeaderClass}>Security</th>
                  <th className={tableHeaderClass}>Total Manpower</th>
                  <th className={tableHeaderClass}>Working Hours</th>
                  <th className={tableHeaderClass}>Safe Man Hours</th>
                  <th className={tableHeaderClass}>Cumulative Safe Hours</th>
                  <th className={tableHeaderClass}>General</th>
                  <th className={tableHeaderClass}>Height</th>
                  <th className={tableHeaderClass}>Hot</th>
                  <th className={tableHeaderClass}>Excavation</th>
                  <th className={tableHeaderClass}>Lifting</th>
                  <th className={tableHeaderClass}>Electrical</th>
                  <th className={tableHeaderClass}>Confined Space</th>
                  <th className={tableHeaderClass}>Pressure Testing</th>
                  <th className={tableHeaderClass}>Total Permits</th>
                  <th className={tableHeaderClass}>TBT Attendance</th>
                  <th className={tableHeaderClass}>TBT Hours</th>
                  <th className={tableHeaderClass}>TBT Total Hrs</th>
                  <th className={tableHeaderClass}>Induction Trainings</th>
                  <th className={tableHeaderClass}>Induction Attendance</th>
                  <th className={tableHeaderClass}>Induction Hours</th>
                  <th className={tableHeaderClass}>Induction Total</th>
                  <th className={tableHeaderClass}>Scheduled Training</th>
                  <th className={tableHeaderClass}>Sched. Attendance</th>
                  <th className={tableHeaderClass}>Sched. Hours</th>
                  <th className={tableHeaderClass}>Sched. Total</th>
                  <th className={tableHeaderClass}>Train Hrs/Day</th>
                  <th className={tableHeaderClass}>First Aid</th>
                  <th className={tableHeaderClass}>Near Miss</th>
                  <th className={tableHeaderClass}>Incident</th>
                  <th className={tableHeaderClass}>Accident</th>
                  <th className={tableHeaderClass}>Total</th>
                  <th className={tableHeaderClass}></th>
                </tr>
              </thead>

              <tbody>
                {rows.map((row, index) => {
                  const rowCalc = calc[index];

                  return (
                    <tr
                      key={row.id}
                      className="border-b border-slate-100 hover:bg-slate-50/60"
                    >
                      <td className="bg-slate-50/40 px-3 py-2">
                        <input
                          type="date"
                          value={row.date}
                          onChange={(event) =>
                            update(row.id, "date", event.target.value)
                          }
                          className="rounded border border-slate-200 bg-white px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </td>

                      <td className="px-2">
                        <input
                          type="number"
                          min={0}
                          value={row.staff}
                          onChange={(event) =>
                            update(row.id, "staff", num(event.target.value))
                          }
                          className={inputSmallClass}
                        />
                      </td>
                      <td className="px-2">
                        <input
                          type="number"
                          min={0}
                          value={row.workers}
                          onChange={(event) =>
                            update(row.id, "workers", num(event.target.value))
                          }
                          className={inputSmallClass}
                        />
                      </td>
                      <td className="px-2">
                        <input
                          type="number"
                          min={0}
                          value={row.security}
                          onChange={(event) =>
                            update(row.id, "security", num(event.target.value))
                          }
                          className={inputSmallClass}
                        />
                      </td>
                      <td className="px-2">
                        <div className={calculatedClass}>
                          {rowCalc.totalManpower}
                        </div>
                      </td>
                      <td className="px-2">
                        <input
                          type="number"
                          min={0}
                          value={row.workingHours}
                          onChange={(event) =>
                            update(
                              row.id,
                              "workingHours",
                              num(event.target.value),
                            )
                          }
                          className={inputSmallClass}
                        />
                      </td>
                      <td className="px-2">
                        <div className={calculatedClass}>
                          {rowCalc.safeManHours}
                        </div>
                      </td>
                      <td className="px-2">
                        <div className={calculatedClass}>
                          {rowCalc.cumulativeSafeHours}
                        </div>
                      </td>

                      {PERMIT_FIELDS.map((field) => (
                        <td key={field} className="px-2">
                          <input
                            type="number"
                            min={0}
                            value={row[field]}
                            onChange={(event) =>
                              update(row.id, field, num(event.target.value))
                            }
                            className={inputSmallClass}
                          />
                        </td>
                      ))}
                      <td className="px-2">
                        <div className={calculatedClass}>
                          {rowCalc.totalPermits}
                        </div>
                      </td>

                      <td className="px-2">
                        <input
                          type="number"
                          min={0}
                          value={row.tbtAttendance}
                          onChange={(event) =>
                            update(
                              row.id,
                              "tbtAttendance",
                              num(event.target.value),
                            )
                          }
                          className={inputSmallClass}
                        />
                      </td>
                      <td className="px-2">
                        <input
                          type="number"
                          step="0.01"
                          min={0}
                          value={row.tbtHours}
                          onChange={(event) =>
                            update(row.id, "tbtHours", num(event.target.value))
                          }
                          className={inputSmallClass}
                        />
                      </td>
                      <td className="px-2">
                        <div className={calculatedClass}>
                          {rowCalc.tbtTotalHours.toFixed(2)}
                        </div>
                      </td>

                      <td className="px-2">
                        <input
                          type="number"
                          min={0}
                          value={row.inductionTrainings}
                          onChange={(event) =>
                            update(
                              row.id,
                              "inductionTrainings",
                              num(event.target.value),
                            )
                          }
                          className={inputSmallClass}
                        />
                      </td>
                      <td className="px-2">
                        <input
                          type="number"
                          min={0}
                          value={row.inductionAttendance}
                          onChange={(event) =>
                            update(
                              row.id,
                              "inductionAttendance",
                              num(event.target.value),
                            )
                          }
                          className={inputSmallClass}
                        />
                      </td>
                      <td className="px-2">
                        <input
                          type="number"
                          step="0.01"
                          min={0}
                          value={row.inductionHours}
                          onChange={(event) =>
                            update(
                              row.id,
                              "inductionHours",
                              num(event.target.value),
                            )
                          }
                          className={inputSmallClass}
                        />
                      </td>
                      <td className="px-2">
                        <div className={calculatedClass}>
                          {rowCalc.inductionTotalHours.toFixed(2)}
                        </div>
                      </td>

                      <td className="px-2">
                        <input
                          value={row.scheduledName}
                          onChange={(event) =>
                            update(row.id, "scheduledName", event.target.value)
                          }
                          placeholder="—"
                          className="w-44 rounded border border-slate-200 bg-white px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-2">
                        <input
                          type="number"
                          min={0}
                          value={row.scheduledAttendance}
                          onChange={(event) =>
                            update(
                              row.id,
                              "scheduledAttendance",
                              num(event.target.value),
                            )
                          }
                          className={inputSmallClass}
                        />
                      </td>
                      <td className="px-2">
                        <input
                          type="number"
                          step="0.01"
                          min={0}
                          value={row.scheduledHours}
                          onChange={(event) =>
                            update(
                              row.id,
                              "scheduledHours",
                              num(event.target.value),
                            )
                          }
                          className={inputSmallClass}
                        />
                      </td>
                      <td className="px-2">
                        <div className={calculatedClass}>
                          {rowCalc.scheduledTotalHours.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-2">
                        <div className={calculatedClass}>
                          {rowCalc.trainingHoursPerDay.toFixed(2)}
                        </div>
                      </td>

                      <td className="px-2">
                        <input
                          type="number"
                          min={0}
                          value={row.firstAid}
                          onChange={(event) =>
                            update(row.id, "firstAid", num(event.target.value))
                          }
                          className={inputSmallClass}
                        />
                      </td>
                      <td className="px-2">
                        <input
                          type="number"
                          min={0}
                          value={row.nearMiss}
                          onChange={(event) =>
                            update(row.id, "nearMiss", num(event.target.value))
                          }
                          className={inputSmallClass}
                        />
                      </td>
                      <td className="px-2">
                        <input
                          type="number"
                          min={0}
                          value={row.incident}
                          onChange={(event) =>
                            update(row.id, "incident", num(event.target.value))
                          }
                          className={inputSmallClass}
                        />
                      </td>
                      <td className="px-2">
                        <input
                          type="number"
                          min={0}
                          value={row.accident}
                          onChange={(event) =>
                            update(row.id, "accident", num(event.target.value))
                          }
                          className={inputSmallClass}
                        />
                      </td>
                      <td className="px-2">
                        <div
                          className={`${calculatedClass} ${
                            rowCalc.totalIncidents > 0
                              ? "!bg-rose-100 !text-rose-700"
                              : ""
                          }`}
                        >
                          {rowCalc.totalIncidents}
                        </div>
                      </td>
                      <td className="px-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeRow(row.id)}
                          disabled={rows.length === 1}
                          className="rounded p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-30"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              <tfoot>
                <tr className="bg-slate-100 text-sm font-semibold text-slate-800">
                  <td className="px-3 py-2">Total</td>
                  <td colSpan={3} className="px-3 py-2 text-right">
                    Manpower:
                  </td>
                  <td className="px-3 py-2">{totals.manpower}</td>
                  <td className="px-3 py-2"></td>
                  <td className="px-3 py-2">{totals.safeHours}</td>
                  <td className="px-3 py-2">—</td>

                  <td colSpan={8} className="px-3 py-2"></td>
                  <td className="px-3 py-2">{totals.permits}</td>

                  <td className="px-3 py-2">{totals.tbtAttendance}</td>
                  <td className="px-3 py-2"></td>
                  <td className="px-3 py-2">
                    {totals.tbtTotalHours.toFixed(2)}
                  </td>

                  <td className="px-3 py-2">{totals.inductionTrainings}</td>
                  <td className="px-3 py-2">{totals.inductionAttendance}</td>
                  <td className="px-3 py-2"></td>
                  <td className="px-3 py-2">
                    {totals.inductionTotalHours.toFixed(2)}
                  </td>

                  <td className="px-3 py-2"></td>
                  <td className="px-3 py-2">{totals.scheduledAttendance}</td>
                  <td className="px-3 py-2"></td>
                  <td className="px-3 py-2">
                    {totals.scheduledTotalHours.toFixed(2)}
                  </td>
                  <td className="px-3 py-2">
                    {totals.trainingHours.toFixed(2)}
                  </td>

                  <td className="px-3 py-2">{totals.firstAid}</td>
                  <td className="px-3 py-2">{totals.nearMiss}</td>
                  <td className="px-3 py-2">{totals.incident}</td>
                  <td className="px-3 py-2">{totals.accident}</td>
                  <td className="px-3 py-2">
                    {totals.firstAid +
                      totals.nearMiss +
                      totals.incident +
                      totals.accident}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <p className="pb-4 text-center text-xs text-slate-500">
          Tip: Calculated cells update automatically. Safe man hours use
          manpower × working hours. Training totals use attendance × hours.
        </p>
      </div>
    </div>
  );
}
