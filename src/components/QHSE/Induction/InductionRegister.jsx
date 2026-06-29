import { useState, useEffect, useMemo } from "react";
import { Search, Filter, Eye, Download } from "lucide-react";

/* Inline Tailwind replacement for the unavailable shared FormHeader component. */
const FormHeader = () => (
  <header className="border-b border-slate-200 bg-white">
    <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-[#F48222]">
          HSE Records
        </p>
        <p className="text-base font-semibold text-slate-800">
          Site HSE Induction Register
        </p>
      </div>
      <p className="hidden text-xs text-slate-500 sm:block">
        Induction Register
      </p>
    </div>
  </header>
);

const thClass =
  "border border-slate-200 bg-slate-50 px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-600";
const tdClass = "border border-slate-200 align-top p-3 text-sm text-slate-700";

const InductionRegister = () => {
  const [rows, setRows] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterProject, setFilterProject] = useState("");

  useEffect(() => {
    const savedData = localStorage.getItem("SITE_HSE_INDUCTION_REGISTER");
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setRows(parsed);
        }
      } catch (e) {
        console.error(
          "Failed to parse induction register from localStorage",
          e,
        );
      }
    }
  }, []);

  const uniqueProjects = useMemo(() => {
    const projects = rows.map((r) => r.project).filter(Boolean);
    return [...new Set(projects)];
  }, [rows]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const searchMatch =
        (row.reportNo || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (row.providedBy || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (row.description || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      const projectMatch = filterProject ? row.project === filterProject : true;

      return searchMatch && projectMatch;
    });
  }, [rows, searchTerm, filterProject]);

  return (
    <div className="min-h-screen bg-slate-50">
      <FormHeader />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl">
            Site HSE Induction Register
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Maintain a running log of HSE inductions conducted on site.
          </p>
        </div>

        <div className="space-y-6 pb-24 sm:pb-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">
                  Induction Entries
                </h2>
                <span className="text-sm text-slate-500">
                  {filteredRows.length} total entries
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Search className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search by Report No, Trainer..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full sm:w-64 rounded-md border border-slate-300 pl-10 pr-3 py-2 text-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Filter className="h-4 w-4 text-slate-400" />
                  </div>
                  <select
                    value={filterProject}
                    onChange={(e) => setFilterProject(e.target.value)}
                    className="block w-full sm:w-48 appearance-none rounded-md border border-slate-300 pl-10 pr-8 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">All Projects</option>
                    {uniqueProjects.map((proj) => (
                      <option key={proj} value={proj}>
                        {proj}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Desktop / tablet table */}
            <div className="hidden overflow-x-auto rounded-lg border border-slate-200 lg:block">
              <table className="w-full min-w-[1100px] border-collapse">
                <thead>
                  <tr>
                    <th className={thClass + " w-12 text-center"}>Sr.</th>
                    <th className={thClass + " w-44"}>Induction Report No.</th>
                    <th className={thClass + " w-40"}>Project</th>
                    <th className={thClass + " w-32"}>Date</th>
                    <th className={thClass + " w-24"}>Time</th>
                    <th className={thClass + " min-w-[240px]"}>
                      Induction Description
                    </th>
                    <th className={thClass + " w-36"}>Location</th>
                    <th className={thClass + " min-w-[200px]"}>
                      Provided to/Agency
                    </th>
                    <th className={thClass + " w-40"}>Provided by</th>
                    <th className={thClass + " w-24 text-center"}>Attendees</th>
                    <th className={thClass + " min-w-[180px]"}>Remarks</th>
                    <th className={thClass + " w-28 text-center"}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={12}
                        className="p-8 text-center text-sm text-slate-500"
                      >
                        No induction records found.
                      </td>
                    </tr>
                  ) : (
                    filteredRows.map((row, i) => (
                      <tr
                        key={i}
                        className="even:bg-slate-50/50 hover:bg-slate-50 transition-colors"
                      >
                        <td className={tdClass + " text-center font-medium"}>
                          {i + 1}
                        </td>
                        <td className={tdClass + " font-medium text-slate-900"}>
                          {row.reportNo || "-"}
                        </td>
                        <td className={tdClass}>{row.project || "-"}</td>
                        <td className={tdClass}>{row.date || "-"}</td>
                        <td className={tdClass}>{row.time || "-"}</td>
                        <td className={tdClass}>{row.description || "-"}</td>
                        <td className={tdClass}>{row.location || "-"}</td>
                        <td className={tdClass}>{row.providedTo || "-"}</td>
                        <td className={tdClass}>{row.providedBy || "-"}</td>
                        <td className={tdClass + " text-center"}>
                          {row.attendees || "0"}
                        </td>
                        <td className={tdClass}>{row.remarks || "-"}</td>
                        <td className={tdClass + " text-center align-middle"}>
                          <div className="flex items-center justify-center gap-2">
                            <button
                              className="text-slate-500 hover:text-blue-600 transition-colors p-1.5 rounded bg-slate-50 border border-slate-200 hover:bg-blue-50 hover:border-blue-200"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              className="text-slate-500 hover:text-blue-600 transition-colors p-1.5 rounded bg-slate-50 border border-slate-200 hover:bg-blue-50 hover:border-blue-200"
                              title="Download Document"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile stacked cards */}
            <div className="space-y-4 lg:hidden">
              {filteredRows.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500 border border-slate-200 rounded-lg">
                  No induction records found.
                </div>
              ) : (
                filteredRows.map((row, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <div className="mb-3 border-b border-slate-100 pb-2">
                      <span className="text-sm font-semibold text-blue-700">
                        {row.reportNo || "Unknown Report"}
                      </span>
                      <span className="ml-2 text-xs text-slate-500">
                        Entry #{i + 1}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="col-span-2">
                        <span className="block text-xs font-medium text-slate-500">
                          Project
                        </span>
                        <span className="text-slate-800">
                          {row.project || "-"}
                        </span>
                      </div>
                      <div>
                        <span className="block text-xs font-medium text-slate-500">
                          Date
                        </span>
                        <span className="text-slate-800">
                          {row.date || "-"}
                        </span>
                      </div>
                      <div>
                        <span className="block text-xs font-medium text-slate-500">
                          Time
                        </span>
                        <span className="text-slate-800">
                          {row.time || "-"}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="block text-xs font-medium text-slate-500">
                          Description
                        </span>
                        <span className="text-slate-800">
                          {row.description || "-"}
                        </span>
                      </div>
                      <div>
                        <span className="block text-xs font-medium text-slate-500">
                          Location
                        </span>
                        <span className="text-slate-800">
                          {row.location || "-"}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="block text-xs font-medium text-slate-500">
                          Provided To
                        </span>
                        <span className="text-slate-800">
                          {row.providedTo || "-"}
                        </span>
                      </div>
                      <div>
                        <span className="block text-xs font-medium text-slate-500">
                          Trainer
                        </span>
                        <span className="text-slate-800">
                          {row.providedBy || "-"}
                        </span>
                      </div>
                      <div>
                        <span className="block text-xs font-medium text-slate-500">
                          Attendees
                        </span>
                        <span className="text-slate-800">
                          {row.attendees || "0"}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="block text-xs font-medium text-slate-500">
                          Remarks
                        </span>
                        <span className="text-slate-800">
                          {row.remarks || "-"}
                        </span>
                      </div>
                      <div className="col-span-2 pt-2 border-t border-slate-100 mt-1 flex justify-end gap-2">
                        <button className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-blue-600 transition-colors bg-slate-50 border border-slate-200 hover:bg-blue-50 hover:border-blue-200 px-3 py-1.5 rounded-md">
                          <Eye className="w-3.5 h-3.5" />
                          View
                        </button>
                        <button className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-blue-600 transition-colors bg-slate-50 border border-slate-200 hover:bg-blue-50 hover:border-blue-200 px-3 py-1.5 rounded-md">
                          <Download className="w-3.5 h-3.5" />
                          Download
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default InductionRegister;
