import { useRef, useState } from "react";
import { Plus, FileText } from "lucide-react";
import { formatInputDate } from "../../../utils/dateFormatter";

const emptyRow = () => ({
  id: crypto.randomUUID(),
  date: "",
  day: "",
  activity1: "",
  activity2: "",
  activity3: "",
  status: "Open",
  remarks: "",
});

const today = () => formatInputDate(new Date());

const statusClass = {
  Open: "text-amber-700",
  Closed: "text-green-700",
  Holiday: "text-slate-600",
  Scheduled: "text-blue-700",
};

const inputClass =
  "w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500";

const textareaClass =
  "w-full overflow-hidden resize-none rounded border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500";

export function HseActivityTracker() {
  const [project, setProject] = useState("");
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

  return (
    <div className="min-h-screen bg-white">
      {/* Header Bar */}
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 text-orange-500">
            <FileText size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">
              HSE Monthly Activity Plan Tracker
            </h1>
            <p className="text-sm text-slate-500">
              Plan and track monthly HSE inspection and training activities.
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1400px] px-4 py-6">
        {/* Header Information */}
        <div className="mb-5 rounded-md border border-slate-200 bg-white shadow-sm">
          <div className="rounded-t-md border-b border-slate-200 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-500">
            Tracker Information
          </div>
          <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2">
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
                placeholder="e.g. November 2026"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>
        </div>

        {/* Activity Table */}
        <div className="rounded-md border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-200 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-500">
            Activity Entries
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] border-collapse text-sm">
              <thead className="bg-slate-100 text-slate-700 border-b border-slate-300">
                <tr>
                  <th
                    rowSpan="2"
                    className="w-12 border border-slate-300 px-2 py-2 text-center font-bold"
                  >
                    Sl. No.
                  </th>
                  <th
                    rowSpan="2"
                    className="w-36 border border-slate-300 px-2 py-2 text-center font-bold"
                  >
                    Date
                  </th>
                  <th
                    rowSpan="2"
                    className="w-24 border border-slate-300 px-2 py-2 text-center font-bold"
                  >
                    Days
                  </th>
                  <th
                    colSpan="3"
                    className="border border-slate-300 px-2 py-2 text-center font-bold"
                  >
                    Activities
                  </th>
                  <th
                    rowSpan="2"
                    className="min-w-[130px] border border-slate-300 px-2 py-2 text-center font-bold"
                  >
                    Status
                  </th>
                  <th
                    rowSpan="2"
                    className="min-w-[230px] border border-slate-300 px-2 py-2 text-center font-bold"
                  >
                    Remarks
                  </th>
                </tr>
                <tr>
                  <th className="min-w-[200px] border border-slate-300 px-2 py-2 text-center font-bold">
                    1st Activity
                  </th>
                  <th className="min-w-[200px] border border-slate-300 px-2 py-2 text-center font-bold">
                    2nd Activity
                  </th>
                  <th className="min-w-[200px] border border-slate-300 px-2 py-2 text-center font-bold">
                    3rd Activity
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => {
                  let dayString = row.day;
                  if (row.date) {
                    const d = new Date(row.date);
                    if (!isNaN(d.getTime())) {
                      const days = [
                        "Sun",
                        "Mon",
                        "Tue",
                        "Wed",
                        "Thu",
                        "Fri",
                        "Sat",
                      ];
                      dayString = days[d.getDay()];
                    }
                  }

                  return (
                    <tr key={row.id} className="align-top hover:bg-slate-50">
                      <td className="border border-slate-300 px-2 py-3 text-center font-medium text-slate-600">
                        {index + 1}
                      </td>

                      <td className="border border-slate-300 p-1">
                        <input
                          type="date"
                          value={row.date}
                          onChange={(event) =>
                            updateRow(row.id, { date: event.target.value })
                          }
                          className={inputClass}
                        />
                      </td>

                      <td className="border border-slate-300 p-1">
                        <div className="flex h-full min-h-[36px] items-center justify-center text-sm font-medium text-slate-700">
                          {dayString}
                        </div>
                      </td>

                      <td className="border border-slate-300 p-1">
                        <input
                          type="text"
                          value={row.activity1}
                          onChange={(event) =>
                            updateRow(row.id, { activity1: event.target.value })
                          }
                          className={inputClass}
                        />
                      </td>

                      <td className="border border-slate-300 p-1">
                        <input
                          type="text"
                          value={row.activity2}
                          onChange={(event) =>
                            updateRow(row.id, { activity2: event.target.value })
                          }
                          className={inputClass}
                        />
                      </td>

                      <td className="border border-slate-300 p-1">
                        <input
                          type="text"
                          value={row.activity3}
                          onChange={(event) =>
                            updateRow(row.id, { activity3: event.target.value })
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
                          className={`w-full appearance-none rounded border border-slate-300 bg-white py-1.5 pl-2 pr-8 text-sm font-medium focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 ${statusClass[row.status] || "text-slate-600"}`}
                          style={{
                            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                            backgroundPosition: `right 0.5rem center`,
                            backgroundRepeat: `no-repeat`,
                            backgroundSize: `1.5em 1.5em`,
                          }}
                        >
                          <option value="Open">Open</option>
                          <option value="Closed">Closed</option>
                        </select>
                      </td>

                      <td className="border border-slate-300 p-1">
                        <textarea
                          rows={1}
                          value={row.remarks}
                          onChange={(event) => {
                            event.target.style.height = "auto";
                            event.target.style.height = `${event.target.scrollHeight}px`;
                            updateRow(row.id, { remarks: event.target.value });
                          }}
                          className={textareaClass}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="p-4">
            <button
              type="button"
              onClick={addRow}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Plus className="h-4 w-4" />
              Add Row
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HseActivityTracker;
