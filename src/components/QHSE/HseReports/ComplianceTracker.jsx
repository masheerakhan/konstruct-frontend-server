import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { formatInputDate } from "../../../utils/dateFormatter";

const STATUSES = [
  "Complied",
  "Not Complied",
  "Partially Complied",
  "Not Applicable",
];

const statusTextClass = {
  Complied: "text-green-700",
  "Not Complied": "text-red-700",
  "Partially Complied": "text-amber-700",
  "Not Applicable": "text-slate-600",
};

const emptyRow = () => ({
  id: crypto.randomUUID(),
  clause: "",
  requirement: "",
  importantPoint: "",
  frequency: "",
  status: "Complied",
  compliance: "",
  reference: "",
  remarks: "",
});

const inputClass =
  "w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500";

const textareaClass =
  "w-full resize-y rounded border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500";

export function ComplianceTracker() {
  const [contractor, setContractor] = useState("");
  const [project, setProject] = useState("");
  const [assessmentDate, setAssessmentDate] = useState(() =>
    formatInputDate(new Date()),
  );
  const [month, setMonth] = useState(() => {
    const date = new Date();
    return `${date.toLocaleString("en", { month: "long" })} ${date.getFullYear()}`;
  });
  const [rows, setRows] = useState([emptyRow()]);

  const updateRow = (id, patch) =>
    setRows((previous) =>
      previous.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    );

  const addRow = () => setRows((previous) => [...previous, emptyRow()]);

  const deleteRow = (id) =>
    setRows((previous) =>
      previous.length === 1
        ? previous
        : previous.filter((row) => row.id !== id),
    );

  const averageCompliance = useMemo(() => {
    const values = rows
      .map((row) => parseFloat(row.compliance))
      .filter((value) => !Number.isNaN(value));

    if (!values.length) return 0;

    return (
      Math.round(
        (values.reduce((total, value) => total + value, 0) / values.length) *
          10,
      ) / 10
    );
  }, [rows]);

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-6">
      <div className="mx-auto max-w-[1600px]">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">
            Degree of Compliance as per HSE Manual Requirements
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Track contractor compliance status against applicable HSE
            requirements.
          </p>
        </div>

        {/* Register Information */}
        <div className="mb-5 rounded-md border border-slate-200 bg-white shadow-sm">
          <div className="rounded-t-md bg-sky-700 px-4 py-2 text-sm font-semibold text-white">
            Register Information
          </div>

          <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <label
                htmlFor="contractor"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                Name of Contractor
              </label>
              <input
                id="contractor"
                type="text"
                value={contractor}
                onChange={(event) => setContractor(event.target.value)}
                placeholder="Contractor name"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label
                htmlFor="project"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                Project
              </label>
              <input
                id="project"
                type="text"
                value={project}
                onChange={(event) => setProject(event.target.value)}
                placeholder="Project name"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label
                htmlFor="month"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                Month
              </label>
              <input
                id="month"
                type="text"
                value={month}
                onChange={(event) => setMonth(event.target.value)}
                placeholder="e.g. May 2026"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label
                htmlFor="assessmentDate"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                Assessment Date
              </label>
              <input
                id="assessmentDate"
                type="date"
                value={assessmentDate}
                onChange={(event) => setAssessmentDate(event.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>
        </div>

        {/* Compliance Entries */}
        <div className="rounded-md border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between rounded-t-md bg-sky-700 px-4 py-2 text-sm font-semibold text-white">
            <span>Compliance Entries</span>
            <button
              type="button"
              onClick={addRow}
              className="inline-flex items-center gap-1 rounded bg-white px-3 py-1 text-xs font-semibold text-sky-700 hover:bg-slate-100"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Row
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1500px] border-collapse text-sm">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th className="w-12 border border-slate-300 px-2 py-2 text-center">
                    Sr. No.
                  </th>
                  <th className="w-40 border border-slate-300 px-2 py-2 text-center">
                    Sec / Clause
                  </th>
                  <th className="min-w-[220px] border border-slate-300 px-2 py-2 text-center">
                    HSE Manual Requirements
                  </th>
                  <th className="min-w-[320px] border border-slate-300 px-2 py-2 text-center">
                    Important Point
                  </th>
                  <th className="w-36 border border-slate-300 px-2 py-2 text-center">
                    Frequency
                  </th>
                  <th className="w-48 border border-slate-300 px-2 py-2 text-center">
                    Status
                  </th>
                  <th className="w-28 border border-slate-300 px-2 py-2 text-center">
                    % Compliance
                  </th>
                  <th className="min-w-[180px] border border-slate-300 px-2 py-2 text-center">
                    Reference Document
                  </th>
                  <th className="min-w-[280px] border border-slate-300 px-2 py-2 text-center">
                    Remarks
                  </th>
                  <th className="w-14 border border-slate-300 px-2 py-2 text-center">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {rows.map((row, index) => (
                  <tr key={row.id} className="align-top hover:bg-slate-50">
                    <td className="border border-slate-300 px-2 py-3 text-center font-medium text-slate-600">
                      {index + 1}
                    </td>
                    <td className="border border-slate-300 p-1">
                      <textarea
                        rows={2}
                        placeholder="e.g. Sec-09"
                        value={row.clause}
                        onChange={(event) =>
                          updateRow(row.id, { clause: event.target.value })
                        }
                        className={textareaClass}
                      />
                    </td>
                    <td className="border border-slate-300 p-1">
                      <textarea
                        rows={2}
                        placeholder="Requirement title"
                        value={row.requirement}
                        onChange={(event) =>
                          updateRow(row.id, { requirement: event.target.value })
                        }
                        className={textareaClass}
                      />
                    </td>
                    <td className="border border-slate-300 p-1">
                      <textarea
                        rows={5}
                        placeholder="List the important points / sub-clauses..."
                        value={row.importantPoint}
                        onChange={(event) =>
                          updateRow(row.id, {
                            importantPoint: event.target.value,
                          })
                        }
                        className={textareaClass}
                      />
                    </td>
                    <td className="border border-slate-300 p-1">
                      <input
                        type="text"
                        placeholder="Daily / Weekly..."
                        value={row.frequency}
                        onChange={(event) =>
                          updateRow(row.id, { frequency: event.target.value })
                        }
                        className={inputClass}
                      />
                    </td>
                    <td className="border border-slate-300 p-1">
                      <select
                        value={row.status}
                        onChange={(event) =>
                          updateRow(row.id, { status: event.target.value })
                        }
                        className={`${inputClass} font-medium ${statusTextClass[row.status]}`}
                      >
                        {STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="border border-slate-300 p-1">
                      <div className="relative">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step={1}
                          placeholder="0"
                          value={row.compliance}
                          onChange={(event) =>
                            updateRow(row.id, {
                              compliance: event.target.value,
                            })
                          }
                          className={`${inputClass} pr-7 text-right`}
                        />
                        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-500">
                          %
                        </span>
                      </div>
                    </td>
                    <td className="border border-slate-300 p-1">
                      <textarea
                        rows={2}
                        placeholder="Reference / doc no."
                        value={row.reference}
                        onChange={(event) =>
                          updateRow(row.id, { reference: event.target.value })
                        }
                        className={textareaClass}
                      />
                    </td>
                    <td className="border border-slate-300 p-1">
                      <textarea
                        rows={4}
                        placeholder="Add observations and remarks..."
                        value={row.remarks}
                        onChange={(event) =>
                          updateRow(row.id, { remarks: event.target.value })
                        }
                        className={textareaClass}
                      />
                    </td>
                    <td className="border border-slate-300 px-1 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => deleteRow(row.id)}
                        disabled={rows.length === 1}
                        aria-label={`Delete row ${index + 1}`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>

              <tfoot>
                <tr className="bg-slate-100">
                  <td
                    colSpan={6}
                    className="border border-slate-300 px-3 py-3 text-right font-semibold text-slate-700"
                  >
                    Average Degree of Compliance
                  </td>
                  <td className="border border-slate-300 px-3 py-3 text-center font-semibold text-sky-700">
                    {averageCompliance}%
                  </td>
                  <td colSpan={3} className="border border-slate-300" />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <p className="mt-3 text-xs text-slate-500">
          Status legend: CP = Complied, NL = Not Complied, PC = Partially
          Complied, NA = Not Applicable.
        </p>
      </div>
    </div>
  );
}

export default ComplianceTracker;
