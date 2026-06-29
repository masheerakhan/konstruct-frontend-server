import React, { useState, useCallback } from "react";

let idCounter = 0;
const makeId = () => `plt-${++idCounter}`;

const headerLabelCls =
  "mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-gray-500";

const fieldInputCls =
  "h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-primary focus:ring-2 focus:ring-orange-100";

const tableInputCls =
  "h-9 w-full rounded-md border border-transparent bg-transparent px-2 text-center font-mono text-sm text-gray-900 outline-none focus:border-primary/40 focus:bg-white focus:ring-2 focus:ring-orange-100";

const tablePickerCls =
  "h-9 w-full rounded-md border border-transparent bg-transparent px-2 text-center text-sm text-gray-900 outline-none focus:border-primary/40 focus:bg-white focus:ring-2 focus:ring-orange-100";

export default function ThirdPartyReport() {
  const [fields, setFields] = useState({
    date: "",
    pileNo: "",
    type: "",
    lengthOfPile: "",
    location: "",
    dateOfBoring: "",
    dateOfCasting: "",
    reportNo: "",
    commencementOfTest: "",
    completionOfTest: "",
    numberOfDialGauges: "",
    leastCountOfDialGauge: "",
    testType: "Vertical Load",
  });

  const [rows, setRows] = useState([
    {
      id: makeId(),
      date: "",
      time: "",
      loadIncrement: "",
      totalLoad: "",
      dg1Main: "",
      dg1Outer: "",
      dg2Main: "",
      dg2Outer: "",
      avgSettlement: "",
      rebound: "",
    },
    {
      id: makeId(),
      date: "",
      time: "",
      loadIncrement: "",
      totalLoad: "",
      dg1Main: "",
      dg1Outer: "",
      dg2Main: "",
      dg2Outer: "",
      avgSettlement: "",
      rebound: "",
    },
    {
      id: makeId(),
      date: "",
      time: "",
      loadIncrement: "",
      totalLoad: "",
      dg1Main: "",
      dg1Outer: "",
      dg2Main: "",
      dg2Outer: "",
      avgSettlement: "",
      rebound: "",
    },
  ]);

  const updateField = (key, value) => setFields((f) => ({ ...f, [key]: value }));

  const updateCell = useCallback((id, key, value) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [key]: value } : r)));
  }, []);

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      {
        id: makeId(),
        date: "",
        time: "",
        loadIncrement: "",
        totalLoad: "",
        dg1Main: "",
        dg1Outer: "",
        dg2Main: "",
        dg2Outer: "",
        avgSettlement: "",
        rebound: "",
      },
    ]);
  };

  const deleteRow = (id) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const topFields = [
    { key: "pileNo", label: "Pile No." },
    { key: "type", label: "Type" },
    { key: "lengthOfPile", label: "Length of Pile" },
    { key: "location", label: "Location" },
    { key: "dateOfBoring", label: "Date of Boring", type: "date" },
    { key: "dateOfCasting", label: "Date of Casting", type: "date" },
    { key: "date", label: "Date", type: "date" },
    { key: "reportNo", label: "Report No." },
    { key: "commencementOfTest", label: "Commencement of Test" },
    { key: "completionOfTest", label: "Completion of Test" },
    { key: "numberOfDialGauges", label: "No. of Dial Gauges Used" },
    { key: "leastCountOfDialGauge", label: "Least Count of Dial Gauge" },
    { key: "testType", label: "Test Type" },
  ];

  const valueColumns = [
    "loadIncrement",
    "totalLoad",
    "dg1Main",
    "dg1Outer",
    "dg2Main",
    "dg2Outer",
    "avgSettlement",
    "rebound",
  ];

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-gray-300 bg-white p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {topFields.map((f) => (
            <div key={f.key}>
              <label className={headerLabelCls}>{f.label}</label>
              <input
                type={f.type || "text"}
                className={fieldInputCls}
                value={fields[f.key]}
                onChange={(e) => updateField(f.key, e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-300 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1420px] border-collapse text-sm">
            <thead>
              <tr className="bg-primary text-white">
                <th rowSpan={2} className="w-14 px-3 py-3 text-center text-xs font-semibold">Sr.</th>
                <th rowSpan={2} className="w-28 px-3 py-3 text-center text-xs font-semibold">Date</th>
                <th rowSpan={2} className="w-24 px-3 py-3 text-center text-xs font-semibold">Time</th>
                <th rowSpan={2} className="w-32 px-3 py-3 text-center text-xs font-semibold">
                  <div>Load Increment</div>
                  <div className="text-[11px] font-normal text-white/80">(Tonnes)</div>
                </th>
                <th rowSpan={2} className="w-32 px-3 py-3 text-center text-xs font-semibold">
                  <div>Total Load</div>
                  <div className="text-[11px] font-normal text-white/80">(Tonnes)</div>
                </th>
                <th colSpan={2} className="px-3 py-3 text-center text-xs font-semibold">
                  Dial Gauge - 1 Readings
                </th>
                <th colSpan={2} className="px-3 py-3 text-center text-xs font-semibold">
                  Dial Gauge - 2 Readings
                </th>
                <th rowSpan={2} className="w-36 px-3 py-3 text-center text-xs font-semibold">
                  <div>Avg. Settlement /</div>
                  <div>Deflection</div>
                  <div className="text-[11px] font-normal text-white/80">(mm)</div>
                </th>
                <th rowSpan={2} className="w-28 px-3 py-3 text-center text-xs font-semibold">
                  <div>Rebound</div>
                  <div className="text-[11px] font-normal text-white/80">(mm)</div>
                </th>
                <th rowSpan={2} className="w-12 px-3 py-3" />
              </tr>
              <tr className="bg-primary text-white/95">
                <th className="w-28 px-3 py-2 text-center text-[11px] font-semibold">Main Scale</th>
                <th className="w-28 px-3 py-2 text-center text-[11px] font-semibold">Outer Scale</th>
                <th className="w-28 px-3 py-2 text-center text-[11px] font-semibold">Main Scale</th>
                <th className="w-28 px-3 py-2 text-center text-[11px] font-semibold">Outer Scale</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((row, idx) => (
                <tr key={row.id} className={idx % 2 === 0 ? "bg-white" : "bg-orange-50/30"}>
                  <td className="border-t border-gray-100 px-3 py-2 text-center font-mono text-xs text-gray-500">
                    {idx + 1}
                  </td>

                  <td className="border-t border-gray-100 px-2 py-2">
                    <input
                      type="date"
                      className={tablePickerCls}
                      value={row.date}
                      onChange={(e) => updateCell(row.id, "date", e.target.value)}
                    />
                  </td>

                  <td className="border-t border-gray-100 px-2 py-2">
                    <input
                      type="time"
                      className={tablePickerCls}
                      value={row.time}
                      onChange={(e) => updateCell(row.id, "time", e.target.value)}
                    />
                  </td>

                  {valueColumns.map((colKey) => (
                    <td key={colKey} className="border-t border-gray-100 px-2 py-2">
                      <input
                        className={tableInputCls}
                        value={row[colKey]}
                        onChange={(e) => updateCell(row.id, colKey, e.target.value)}
                        placeholder="-"
                      />
                    </td>
                  ))}

                  <td className="border-t border-gray-100 px-2 py-2 text-center">
                    <button
                      type="button"
                      onClick={() => deleteRow(row.id)}
                      className="text-lg leading-none text-gray-400 transition-colors hover:text-red-500"
                      title="Delete row"
                    >
                      x
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t border-gray-200 bg-gray-50 px-3 py-3">
          <button
            type="button"
            onClick={addRow}
            className="inline-flex items-center gap-1.5 rounded-md border border-primary/25 bg-white px-3 py-1.5 text-sm font-medium text-primary hover:bg-orange-50"
          >
            + Add Row
          </button>
        </div>
      </div>
    </div>
  );
}
