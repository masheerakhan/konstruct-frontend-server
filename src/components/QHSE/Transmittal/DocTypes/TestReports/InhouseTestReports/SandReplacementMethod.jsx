import React, { useState, useCallback } from "react";

const unitOptions = ["g", "g/cc", "g/cm3", "cc", "cm3", "%", "kg", "kg/m3", "ml", "mm"];

const defaultData = [
  { section: "calibration", description: "Vol. of calibrating container (V)", unit: "cc", samples: ["", "", ""] },
  { section: "calibration", description: "Wt. of sand (+cylinder) before pouring (W1)", unit: "g", samples: ["", "", ""] },
  { section: "calibration", description: "Wt. of sand (+cylinder) after pouring (W2)", unit: "g", samples: ["", "", ""] },
  { section: "calibration", description: "Mean wt. of sand in cone (W3)", unit: "g", samples: ["", "", ""] },
  { section: "calibration", description: "Wt. of sand filling calibrating container (Ws = W1-W2-W3)", unit: "g", samples: ["", "", ""] },
  { section: "calibration", description: "Bulk density of sand (ys = Ws/V)", unit: "g/cc", samples: ["", "", ""] },
  { section: "measurement", description: "Wt. of wet soil from hole (Ww)", unit: "g", samples: ["", "", ""] },
  { section: "measurement", description: "Wt. of sand (+cylinder) before pouring (W1)", unit: "g", samples: ["", "", ""] },
  { section: "measurement", description: "Wt. of sand (+cylinder) after pouring (W2)", unit: "g", samples: ["", "", ""] },
  { section: "measurement", description: "Weight of Sand in Hole (Wsh = W1-W4-W3)", unit: "g", samples: ["", "", ""] },
  { section: "measurement", description: "Bulk density of soil (yb = ys x Ww/Wsh)", unit: "g/cc", samples: ["", "", ""] },
  { section: "measurement", description: "Weight of wet Sample (Ww)", unit: "g", samples: ["", "", ""] },
  { section: "measurement", description: "Weight of oven Dry Sample (Wd)", unit: "g", samples: ["", "", ""] },
  { section: "measurement", description: "Water Content (W)", unit: "%", samples: ["", "", ""] },
  { section: "measurement", description: "Field Dry Density (yd = 100 x yb / (100+W))", unit: "g/cc", samples: ["", "", ""] },
  { section: "measurement", description: "Average Dry Density", unit: "g/cc", samples: ["", "", ""] },
  { section: "measurement", description: "Field Compaction", unit: "%", samples: ["", "", ""] },
];

const sectionLabels = {
  calibration: "Calibration of Sand",
  measurement: "Measurement of Soil Density",
};

const sectionColors = {
  calibration: "bg-orange-50 text-primary",
  measurement: "bg-orange-50 text-primary",
};

const sectionKeys = ["calibration", "measurement"];

let idCounter = 0;
const makeId = () => `sr-${++idCounter}`;

const headerLabelCls =
  "mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-gray-500";

const fieldInputCls =
  "h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-primary focus:ring-2 focus:ring-orange-100";

const tableInputCls =
  "h-9 w-full rounded-md border border-transparent bg-transparent px-2 text-sm text-gray-900 outline-none focus:border-primary/40 focus:bg-white focus:ring-2 focus:ring-orange-100";

const sampleInputCls =
  "h-9 w-full rounded-md border border-transparent bg-transparent px-2 text-center font-mono text-sm text-gray-900 outline-none focus:border-primary/40 focus:bg-white focus:ring-2 focus:ring-orange-100";

const unitSelectCls =
  "h-9 w-full rounded-md border border-gray-300 bg-white px-2 text-sm text-gray-900 outline-none focus:border-primary focus:ring-2 focus:ring-orange-100";

export default function SandReplacementMethod() {
  const [fields, setFields] = useState({
    maxDryDensity: "",
    omcPercent: "",
    dateOfTesting: "",
    layerNo: "",
    thicknessOfLayer: "",
    bulkDensityOfSand: "",
  });

  const [rows, setRows] = useState(defaultData.map((d) => ({ ...d, id: makeId() })));
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const updateField = (key, value) => setFields((f) => ({ ...f, [key]: value }));

  const updateSample = useCallback((id, sampleIdx, value) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const samples = [...r.samples];
        samples[sampleIdx] = value;
        return { ...r, samples };
      })
    );
  }, []);

  const updateDescription = useCallback((id, value) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, description: value } : r)));
  }, []);

  const updateUnit = useCallback((id, value) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, unit: value } : r)));
  }, []);

  const addRow = (section) => {
    setRows((prev) => {
      const newRow = {
        id: makeId(),
        section,
        description: "",
        unit: "g",
        samples: ["", "", ""],
      };

      let lastIdx = -1;
      for (let i = prev.length - 1; i >= 0; i -= 1) {
        if (prev[i].section === section) {
          lastIdx = i;
          break;
        }
      }

      const result = [...prev];
      result.splice(lastIdx + 1, 0, newRow);
      return result;
    });

    setDropdownOpen(false);
  };

  const deleteRow = (id) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const grouped = sectionKeys.map((s) => ({
    key: s,
    label: sectionLabels[s],
    rows: rows.filter((r) => r.section === s),
  }));

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-gray-300 bg-white p-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { key: "maxDryDensity", label: "Max. Dry Density" },
            { key: "omcPercent", label: "OMC %" },
            { key: "dateOfTesting", label: "Date of Testing", type: "date" },
            { key: "layerNo", label: "Layer No." },
            { key: "thicknessOfLayer", label: "Thickness of Layer" },
            { key: "bulkDensityOfSand", label: "Bulk Density of Sand" },
          ].map((f) => (
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
          <table className="w-full min-w-[980px] border-collapse text-sm">
            <thead>
              <tr className="bg-primary text-white">
                <th className="px-3 py-3 text-left text-xs font-semibold">Description</th>
                <th className="w-28 px-3 py-3 text-center text-xs font-semibold">Unit</th>
                <th className="w-36 px-3 py-3 text-center text-xs font-semibold">Sample 1</th>
                <th className="w-36 px-3 py-3 text-center text-xs font-semibold">Sample 2</th>
                <th className="w-36 px-3 py-3 text-center text-xs font-semibold">Sample 3</th>
                <th className="w-12 px-3 py-3" />
              </tr>
            </thead>
            <tbody>
              {grouped.map((group) => (
                <React.Fragment key={group.key}>
                  <tr>
                    <td
                      colSpan={6}
                      className={`border-t border-gray-200 px-3 py-2 text-xs font-bold uppercase tracking-wide ${sectionColors[group.key]}`}
                    >
                      {group.label}
                    </td>
                  </tr>

                  {group.rows.map((row) => (
                    <tr key={row.id} className="border-t border-gray-100">
                      <td className="px-3 py-2">
                        <input
                          className={tableInputCls}
                          value={row.description}
                          onChange={(e) => updateDescription(row.id, e.target.value)}
                        />
                      </td>

                      <td className="px-2 py-2">
                        <select
                          value={row.unit}
                          onChange={(e) => updateUnit(row.id, e.target.value)}
                          className={unitSelectCls}
                        >
                          {unitOptions.map((u) => (
                            <option key={u} value={u}>
                              {u}
                            </option>
                          ))}
                        </select>
                      </td>

                      {row.samples.map((s, i) => (
                        <td key={i} className="px-2 py-2">
                          <input
                            className={sampleInputCls}
                            value={s}
                            onChange={(e) => updateSample(row.id, i, e.target.value)}
                            placeholder="-"
                          />
                        </td>
                      ))}

                      <td className="px-2 py-2 text-center">
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
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        <div className="relative border-t border-gray-200 bg-gray-50 px-3 py-3">
          <button
            type="button"
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="inline-flex items-center gap-1.5 rounded-md border border-primary/25 bg-white px-3 py-1.5 text-sm font-medium text-primary hover:bg-orange-50"
          >
            + Add Test Point
          </button>

          {dropdownOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
              <div className="absolute bottom-full left-3 z-20 mb-2 min-w-[220px] rounded-md border border-gray-200 bg-white py-1 shadow-lg">
                {sectionKeys.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => addRow(s)}
                    className="block w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                  >
                    {sectionLabels[s]}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
