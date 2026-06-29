import { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";

const blankRow = (idx) => ({
  recordNo: `HIPPL-XXX-YYY-HSE-TBT-${String(idx).padStart(3, "0")}`,
  topic: "",
  trade: "",
  dateConducted: "",
  toAgency: "",
  participants: "",
  location: "",
  conductedBy: "",
  remarks: "",
});

const AutoTextarea = ({
  value,
  onChange,
  placeholder,
}) => {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  }, [value]);
  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={1}
      className="w-full px-2 py-1 border border-slate-300 rounded text-sm resize-none overflow-hidden focus:outline-none focus:ring-1 focus:ring-sky-500 bg-white"
    />
  );
};

const ToolboxRegister = () => {
  const [project, setProject] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [rows, setRows] = useState([blankRow(1)]);

  const update = (i, key, val) => {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, [key]: val } : r)));
  };

  const addRow = () => setRows((prev) => [...prev, blankRow(prev.length + 1)]);
  const removeRow = (i) =>
    setRows((prev) => (prev.length === 1 ? prev : prev.filter((_, idx) => idx !== i)));

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-4">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Toolbox Talks (HSE) Register</h1>
            <p className="text-sm text-slate-500 mt-1">Log and track all toolbox talk sessions</p>
          </div>
          {/* <div className="flex gap-3 text-sm">
            <Link to="/" className="text-sky-700 hover:underline">← MIR</Link>
            <Link to="/toolbox-talk" className="text-sky-700 hover:underline">Attendance Sheet</Link>
          </div> */}
        </div>

        {/* Header info */}
        <div className="bg-white rounded-md shadow-sm border border-slate-200 mb-5">
          <div className="bg-sky-700 text-white px-4 py-2 font-semibold text-sm rounded-t-md">
            Register Information
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Project</label>
              <input
                type="text"
                value={project}
                onChange={(e) => setProject(e.target.value)}
                placeholder="Enter project name"
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>
        </div>

        {/* Register Table */}
        <div className="bg-white rounded-md shadow-sm border border-slate-200">
          <div className="bg-sky-700 text-white px-4 py-2 font-semibold text-sm rounded-t-md flex items-center justify-between">
            <span>Toolbox Talk Entries</span>
            <button
              type="button"
              onClick={addRow}
              className="bg-white text-sky-700 px-3 py-1 rounded text-xs font-semibold hover:bg-slate-100"
            >
              + Add Row
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm min-w-[1300px]">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th className="border border-slate-300 px-2 py-2 w-12">Sl. No</th>
                  <th className="border border-slate-300 px-2 py-2 w-48">Record No.</th>
                  <th className="border border-slate-300 px-2 py-2 w-48">Brief Topic Description</th>
                  <th className="border border-slate-300 px-2 py-2 w-40">Trade</th>
                  <th className="border border-slate-300 px-2 py-2 w-36">Date Conducted</th>
                  <th className="border border-slate-300 px-2 py-2 w-56">To / Agency / Subcontractor</th>
                  <th className="border border-slate-300 px-2 py-2 w-20">No. of Participants</th>
                  <th className="border border-slate-300 px-2 py-2 w-36">Location</th>
                  <th className="border border-slate-300 px-2 py-2 w-40">Conducted by (Trainer)</th>
                  <th className="border border-slate-300 px-2 py-2 w-56">Remarks</th>
                  <th className="border border-slate-300 px-2 py-2 w-16">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="align-top hover:bg-slate-50">
                    <td className="border border-slate-300 px-2 py-2 text-center font-medium">{i + 1}</td>
                    <td className="border border-slate-300 px-1 py-1">
                      <input
                        type="text"
                        value={r.recordNo}
                        onChange={(e) => update(i, "recordNo", e.target.value)}
                        className="w-full px-2 py-1 border border-slate-300 rounded text-sm bg-slate-50 focus:outline-none focus:ring-1 focus:ring-sky-500"
                      />
                    </td>
                    <td className="border border-slate-300 px-1 py-1">
                      <AutoTextarea
                        // type="text"
                        value={r.topic}
                        onChange={(v) => update(i, "topic", v)}
                        placeholder="e.g. Electrical Safety"
                        // className="w-full px-2 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
                      />
                    </td>
                    <td className="border border-slate-300 px-1 py-1">
                      <AutoTextarea
                        // type="text"
                        value={r.trade}
                        onChange={(v) => update(i, "trade", v)}
                        placeholder="Carpenter, Fitter..."
                        // className="w-full px-2 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
                      />
                    </td>
                    <td className="border border-slate-300 px-1 py-1">
                      <input
                        type="date"
                        value={r.dateConducted}
                        onChange={(e) => update(i, "dateConducted", e.target.value)}
                        className="w-full px-2 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
                      />
                    </td>
                    <td className="border border-slate-300 px-1 py-1">
                      <AutoTextarea
                        value={r.toAgency}
                        onChange={(v) => update(i, "toAgency", v)}
                        placeholder="Names / Agencies / Subcontractors"
                      />
                    </td>
                    <td className="border border-slate-300 px-1 py-1">
                      <input
                        type="number"
                        min={0}
                        value={r.participants}
                        onChange={(e) => update(i, "participants", e.target.value)}
                        className="w-full px-2 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
                      />
                    </td>
                    <td className="border border-slate-300 px-1 py-1">
                      <AutoTextarea
                        // type="text"
                        value={r.location}
                        onChange={(v) => update(i, "location", v)}
                        placeholder="Site / Safety Park"
                        // className="w-full px-2 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
                      />
                    </td>
                    <td className="border border-slate-300 px-1 py-1">
                      <input
                        type="text"
                        value={r.conductedBy}
                        onChange={(e) => update(i, "conductedBy", e.target.value)}
                        placeholder="Trainer name"
                        className="w-full px-2 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
                      />
                    </td>
                    <td className="border border-slate-300 px-1 py-1">
                      <AutoTextarea
                        value={r.remarks}
                        onChange={(v) => update(i, "remarks", v)}
                        placeholder="Remarks"
                      />
                    </td>
                    <td className="border border-slate-300 px-1 py-1 text-center">
                      <button
                        type="button"
                        onClick={() => removeRow(i)}
                        disabled={rows.length === 1}
                        className="text-red-600 hover:text-red-800 text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-5">
          <button
            type="button"
            onClick={() => setRows([blankRow(1)])}
            className="px-5 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={() => alert("Toolbox Talks Register saved!")}
            className="px-5 py-2 bg-sky-700 text-white rounded-md text-sm font-medium hover:bg-sky-800"
          >
            Save Register
          </button>
        </div>
      </div>
    </div>
  );
};

export default ToolboxRegister;
