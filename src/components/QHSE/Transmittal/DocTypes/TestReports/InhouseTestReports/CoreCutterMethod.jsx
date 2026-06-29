import React, { useState, useCallback } from "react";

const defaultData = [
  { section: "A", srNo: 1, description: "Weight of the cutter, Wc, g", samples: ["", "", ""] },
  { section: "A", srNo: 2, description: "Weight of Cutter + Soil, Ws, g", samples: ["", "", ""] },
  { section: "A", srNo: 3, description: "Volume of Cutter, Vc, cm3", samples: ["", "", ""] },
  { section: "A", srNo: 4, description: "Bulk Density of Soil yb = (Ws - Wc) / Vc, g/cm3", samples: ["", "", ""] },
  { section: "B", srNo: 1, description: "Weight of Container with Lid, W1, g", samples: ["", "", ""] },
  { section: "B", srNo: 2, description: "W1 + Weight of wet Soil = W2, g", samples: ["", "", ""] },
  { section: "B", srNo: 3, description: "W1 + Weight of Oven dried soil = W3, g", samples: ["", "", ""] },
  { section: "B", srNo: 4, description: "% of Water Content, w = 100 x (W2 - W3) / (W3 - W1)", samples: ["", "", ""] },
  { section: "C", srNo: 1, description: "Dry Density of Soil, yd = 100 yb / (100 + w), g/cm3", samples: ["", "", ""] },
  { section: "C", srNo: 2, description: "Average Field Dry Density, yd', g/cm3", samples: ["", "", ""] },
  { section: "D", srNo: 1, description: "% Compaction Achieved, 100 x (yd avg / MDD)", samples: ["", "", ""] },
];

const sectionLabels = {
  A: "Bulk Density of Soil",
  B: "Water Content %",
  C: "Dry Density of Soil",
  D: "% Compaction Achieved",
};

const sectionColors = {
  A: "bg-orange-50 text-primary",
  B: "bg-orange-50 text-primary",
  C: "bg-orange-50 text-primary",
  D: "bg-orange-50 text-primary",
};

let idCounter = 0;
const makeId = () => `cc-${++idCounter}`;

const sections = ["A", "B", "C", "D"];

const headerLabelCls =
  "mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-gray-500";

const fieldInputCls =
  "h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-primary focus:ring-2 focus:ring-orange-100";

const tableInputCls =
  "h-9 w-full rounded-md border border-transparent bg-transparent px-2 text-sm text-gray-900 outline-none focus:border-primary/40 focus:bg-white focus:ring-2 focus:ring-orange-100";

const sampleInputCls =
  "h-9 w-full rounded-md border border-transparent bg-transparent px-2 text-center font-mono text-sm text-gray-900 outline-none focus:border-primary/40 focus:bg-white focus:ring-2 focus:ring-orange-100";

export default function CoreCutterMethod() {
  const [fields, setFields] = useState({
    dateOfTesting: "",
    layerNo: "",
    mddOfSoil: "",
    thicknessOfLayer: "",
    omcPercent: "",
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

  const addRow = (section) => {
    setRows((prev) => {
      const sectionRows = prev.filter((r) => r.section === section);
      const maxSr = sectionRows.length > 0 ? Math.max(...sectionRows.map((r) => r.srNo)) : 0;

      const newRow = {
        id: makeId(),
        section,
        srNo: maxSr + 1,
        description: "",
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

  const grouped = sections.map((s) => ({
    key: s,
    label: sectionLabels[s],
    rows: rows.filter((r) => r.section === s),
  }));

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-gray-300 bg-white p-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { key: "dateOfTesting", label: "Date of Testing", type: "date" },
            { key: "layerNo", label: "Layer No." },
            { key: "mddOfSoil", label: "MDD of Soil (g/cm2)" },
            { key: "thicknessOfLayer", label: "Thickness of Layer" },
            { key: "omcPercent", label: "OMC %" },
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
          <table className="w-full min-w-[900px] border-collapse text-sm">
            <thead>
              <tr className="bg-primary text-white">
                <th className="w-14 px-3 py-3 text-left text-xs font-semibold">Sr.</th>
                <th className="px-3 py-3 text-left text-xs font-semibold">Description</th>
                <th className="w-36 px-3 py-3 text-center text-xs font-semibold">Sample I</th>
                <th className="w-36 px-3 py-3 text-center text-xs font-semibold">Sample II</th>
                <th className="w-36 px-3 py-3 text-center text-xs font-semibold">Sample III</th>
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
                      <span className="mr-2">{group.key}.</span>
                      {group.label}
                    </td>
                  </tr>

                  {group.rows.map((row) => (
                    <tr key={row.id} className="border-t border-gray-100">
                      <td className="px-3 py-2 text-center font-mono text-xs text-gray-500">
                        {row.srNo}
                      </td>

                      <td className="px-3 py-2">
                        <input
                          className={tableInputCls}
                          value={row.description}
                          onChange={(e) => updateDescription(row.id, e.target.value)}
                        />
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
                {sections.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => addRow(s)}
                    className="block w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Section {s} - {sectionLabels[s]}
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
