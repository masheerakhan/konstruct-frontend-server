import React, { useState } from "react";
import { Save, FileText } from "lucide-react";

// Reusable Input cell for tables
const TableInput = ({ value, onChange, placeholder = "", type = "text" }) => (
  <input
    type={type}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    className="w-full bg-transparent px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white rounded transition"
  />
);

const TableTextarea = ({ value, onChange, placeholder = "" }) => (
  <textarea
    rows={1}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    onInput={(e) => {
      e.target.style.height = "auto";
      e.target.style.height = e.target.scrollHeight + "px";
    }}
    className="w-full bg-transparent px-3 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white rounded transition resize-none overflow-hidden"
  />
);

const SectionCard = ({ title, children }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6">
    <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-200">
      <h2 className="text-base font-bold text-slate-800">{title}</h2>
    </div>
    <div className="p-6">{children}</div>
  </div>
);

const calcDisposed = (waste, field) => {
  const gen = parseFloat(waste.generated[field]) || 0;
  const used = parseFloat(waste.used[field]) || 0;
  const rec = parseFloat(waste.recycled[field]) || 0;
  return (gen - (used + rec)).toFixed(2);
};

const updateWaste = (setter, category, field, value) => {
  setter((prev) => ({
    ...prev,
    [category]: { ...prev[category], [field]: value },
  }));
};

const WasteBlock = ({ title, prefix, state, setter }) => (
  <>
    <tr className="bg-slate-50 font-medium">
      <td className="px-4 py-2 border-r border-slate-200 text-center font-bold">
        {prefix}.
      </td>
      <td colSpan="6" className="px-4 py-2">
        {title}
      </td>
    </tr>
    <tr>
      <td className="px-4 py-2 border-r border-slate-200 text-center text-slate-500">
        a)
      </td>
      <td className="px-4 py-2 border-r border-slate-200">
        Total Waste Generated
      </td>
      <td className="px-4 py-2 border-r border-slate-200 text-center">
        Metric tons
      </td>
      <td className="p-0 border-r border-slate-200">
        <TableInput
          type="number"
          value={state.generated.thisMonth}
          onChange={(e) =>
            updateWaste(setter, "generated", "thisMonth", e.target.value)
          }
        />
      </td>
      <td className="p-0 border-r border-slate-200">
        <TableInput
          type="number"
          value={state.generated.lastMonth}
          onChange={(e) =>
            updateWaste(setter, "generated", "lastMonth", e.target.value)
          }
        />
      </td>
      <td className="p-0 border-r border-slate-200">
        <TableInput
          type="number"
          value={state.generated.uptoDate}
          onChange={(e) =>
            updateWaste(setter, "generated", "uptoDate", e.target.value)
          }
        />
      </td>
      <td className="p-0 align-top">
        <TableTextarea
          value={state.generated.remarks}
          onChange={(e) =>
            updateWaste(setter, "generated", "remarks", e.target.value)
          }
        />
      </td>
    </tr>
    <tr>
      <td className="px-4 py-2 border-r border-slate-200 text-center text-slate-500">
        b)
      </td>
      <td className="px-4 py-2 border-r border-slate-200">
        Total waste used - Onsite
      </td>
      <td className="px-4 py-2 border-r border-slate-200 text-center">
        Metric tons
      </td>
      <td className="p-0 border-r border-slate-200">
        <TableInput
          type="number"
          value={state.used.thisMonth}
          onChange={(e) =>
            updateWaste(setter, "used", "thisMonth", e.target.value)
          }
        />
      </td>
      <td className="p-0 border-r border-slate-200">
        <TableInput
          type="number"
          value={state.used.lastMonth}
          onChange={(e) =>
            updateWaste(setter, "used", "lastMonth", e.target.value)
          }
        />
      </td>
      <td className="p-0 border-r border-slate-200">
        <TableInput
          type="number"
          value={state.used.uptoDate}
          onChange={(e) =>
            updateWaste(setter, "used", "uptoDate", e.target.value)
          }
        />
      </td>
      <td className="p-0 align-top">
        <TableTextarea
          value={state.used.remarks}
          onChange={(e) =>
            updateWaste(setter, "used", "remarks", e.target.value)
          }
        />
      </td>
    </tr>
    <tr>
      <td className="px-4 py-2 border-r border-slate-200 text-center text-slate-500">
        c)
      </td>
      <td className="px-4 py-2 border-r border-slate-200">
        Total waste recycled/sold
      </td>
      <td className="px-4 py-2 border-r border-slate-200 text-center">
        Metric tons
      </td>
      <td className="p-0 border-r border-slate-200">
        <TableInput
          type="number"
          value={state.recycled.thisMonth}
          onChange={(e) =>
            updateWaste(setter, "recycled", "thisMonth", e.target.value)
          }
        />
      </td>
      <td className="p-0 border-r border-slate-200">
        <TableInput
          type="number"
          value={state.recycled.lastMonth}
          onChange={(e) =>
            updateWaste(setter, "recycled", "lastMonth", e.target.value)
          }
        />
      </td>
      <td className="p-0 border-r border-slate-200">
        <TableInput
          type="number"
          value={state.recycled.uptoDate}
          onChange={(e) =>
            updateWaste(setter, "recycled", "uptoDate", e.target.value)
          }
        />
      </td>
      <td className="p-0 align-top">
        <TableTextarea
          value={state.recycled.remarks}
          onChange={(e) =>
            updateWaste(setter, "recycled", "remarks", e.target.value)
          }
        />
      </td>
    </tr>
    <tr className="bg-orange-50 font-medium text-slate-800">
      <td
        colSpan="2"
        className="px-4 py-3 border-r border-slate-200 text-right"
      >
        Total waste disposed (a-(b+c))
      </td>
      <td className="px-4 py-3 border-r border-slate-200 text-center font-bold">
        Metric tons
      </td>
      <td className="px-4 py-3 border-r border-slate-200 text-center font-bold">
        {calcDisposed(state, "thisMonth")}
      </td>
      <td className="px-4 py-3 border-r border-slate-200 text-center font-bold">
        {calcDisposed(state, "lastMonth")}
      </td>
      <td className="px-4 py-3 border-r border-slate-200 text-center font-bold">
        {calcDisposed(state, "uptoDate")}
      </td>
      <td></td>
    </tr>
  </>
);

export default function HSEChecklist() {
  const [meta, setMeta] = useState({
    projectName: "",
    location: "",
    client: "",
    contractor: "",
    pmc: "",
    reportNo: "",
    month: "",
    date: "",
    preparedBy: "",
    reviewedBy: "",
  });

  const updateMeta = (key, val) => setMeta((prev) => ({ ...prev, [key]: val }));

  // --- A. Fuel Consumption ---
  const [fuel, setFuel] = useState([
    {
      id: 1,
      source: "Diesel (HIP vehicle, DG sets, Plant & Machinery equipments)",
      unit: "Liter",
      thisMonth: "",
      lastMonth: "",
      uptoDate: "",
      remarks: "",
    },
    {
      id: 2,
      source: "Petrol (HIP vehicle)",
      unit: "Liter",
      thisMonth: "",
      lastMonth: "",
      uptoDate: "",
      remarks: "",
    },
    {
      id: 3,
      source: "CNG",
      unit: "Kg",
      thisMonth: "",
      lastMonth: "",
      uptoDate: "",
      remarks: "",
    },
    {
      id: 4,
      source: "LPG",
      unit: "Kg",
      thisMonth: "",
      lastMonth: "",
      uptoDate: "",
      remarks: "",
    },
    {
      id: 5,
      source: "Diesel (PMC DG Sets, Plant & Machinery equipments)",
      unit: "Liter",
      thisMonth: "",
      lastMonth: "",
      uptoDate: "",
      remarks: "",
    },
  ]);

  const updateArrayItem = (setter, index, field, value) => {
    setter((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  // --- B. Electricity Consumption ---
  const [electricity, setElectricity] = useState([
    {
      id: 1,
      source: "Electricity",
      unit: "kWh",
      thisMonth: "",
      lastMonth: "",
      uptoDate: "",
      remarks: "",
    },
  ]);

  // --- C. Water Consumption ---
  const [water, setWater] = useState([
    {
      id: 1,
      source: "Surface Water",
      unit: "KL",
      thisMonth: "",
      lastMonth: "",
      uptoDate: "",
      remarks: "",
    },
    {
      id: 2,
      source: "Ground water",
      unit: "KL",
      thisMonth: "",
      lastMonth: "",
      uptoDate: "",
      remarks: "",
    },
    {
      id: 3,
      source: "Sea water",
      unit: "KL",
      thisMonth: "",
      lastMonth: "",
      uptoDate: "",
      remarks: "",
    },
    {
      id: 4,
      source: "Third-party water (Municipal Corporation)",
      unit: "KL",
      thisMonth: "",
      lastMonth: "",
      uptoDate: "",
      remarks: "",
    },
    {
      id: 5,
      source: "Recycled water",
      unit: "KL",
      thisMonth: "",
      lastMonth: "",
      uptoDate: "",
      remarks: "",
    },
  ]);
  const [curingCompound, setCuringCompound] = useState({
    id: 7,
    source: "Curing compound",
    unit: "Liters",
    thisMonth: "",
    lastMonth: "",
    uptoDate: "",
    remarks: "",
  });

  const calcTotalWater = (field) => {
    return water.reduce((sum, item) => sum + (parseFloat(item[field]) || 0), 0);
  };

  // --- D. Waste Data ---
  const initialWasteState = {
    generated: { thisMonth: "", lastMonth: "", uptoDate: "", remarks: "" },
    used: { thisMonth: "", lastMonth: "", uptoDate: "", remarks: "" },
    recycled: { thisMonth: "", lastMonth: "", uptoDate: "", remarks: "" },
  };
  const [plasticWaste, setPlasticWaste] = useState({ ...initialWasteState });
  const [cndWaste, setCndWaste] = useState({ ...initialWasteState });
  const [batteryWaste, setBatteryWaste] = useState({ ...initialWasteState });
  const [hazardousWaste, setHazardousWaste] = useState({
    ...initialWasteState,
  });
  const [nonHazardousWaste, setNonHazardousWaste] = useState({
    ...initialWasteState,
  });

  const [wasteRecovery, setWasteRecovery] = useState([
    {
      id: "i",
      category: "Recycled",
      thisMonth: "",
      lastMonth: "",
      uptoDate: "",
      remarks: "",
    },
    {
      id: "ii",
      category: "Re-used",
      thisMonth: "",
      lastMonth: "",
      uptoDate: "",
      remarks: "",
    },
    {
      id: "iii",
      category: "Other recovery operations",
      thisMonth: "",
      lastMonth: "",
      uptoDate: "",
      remarks: "",
    },
  ]);
  const [wasteDisposal, setWasteDisposal] = useState([
    {
      id: "i",
      category: "Incineration",
      thisMonth: "",
      lastMonth: "",
      uptoDate: "",
      remarks: "",
    },
    {
      id: "ii",
      category: "Landfilling",
      thisMonth: "",
      lastMonth: "",
      uptoDate: "",
      remarks: "",
    },
    {
      id: "iii",
      category: "Other disposal operations",
      thisMonth: "",
      lastMonth: "",
      uptoDate: "",
      remarks: "",
    },
  ]);

  const calcTotalRecovery = (field) =>
    wasteRecovery.reduce(
      (sum, item) => sum + (parseFloat(item[field]) || 0),
      0,
    );
  const calcTotalDisposal = (field) =>
    wasteDisposal.reduce(
      (sum, item) => sum + (parseFloat(item[field]) || 0),
      0,
    );

  // --- E. Air Pollutant ---
  const [ambientAir, setAmbientAir] = useState([
    {
      id: 1,
      pollutant: "PM 2.5",
      unit: "mg/Nm3",
      thisMonth: "",
      lastMonth: "",
      uptoDate: "",
      remarks: "",
    },
    {
      id: 2,
      pollutant: "PM 10",
      unit: "mg/Nm3",
      thisMonth: "",
      lastMonth: "",
      uptoDate: "",
      remarks: "",
    },
    {
      id: 3,
      pollutant: "NOx",
      unit: "mg/Nm3",
      thisMonth: "",
      lastMonth: "",
      uptoDate: "",
      remarks: "",
    },
    {
      id: 4,
      pollutant: "SOx",
      unit: "mg/Nm3",
      thisMonth: "",
      lastMonth: "",
      uptoDate: "",
      remarks: "",
    },
  ]);
  const [dgStack, setDgStack] = useState([
    {
      id: 1,
      pollutant: "PM 2.5",
      unit: "mg/Nm3",
      thisMonth: "",
      lastMonth: "",
      uptoDate: "",
      remarks: "",
    },
    {
      id: 2,
      pollutant: "PM 10",
      unit: "mg/Nm3",
      thisMonth: "",
      lastMonth: "",
      uptoDate: "",
      remarks: "",
    },
    {
      id: 3,
      pollutant: "NOx",
      unit: "mg/Nm3",
      thisMonth: "",
      lastMonth: "",
      uptoDate: "",
      remarks: "",
    },
    {
      id: 4,
      pollutant: "SOx",
      unit: "mg/Nm3",
      thisMonth: "",
      lastMonth: "",
      uptoDate: "",
      remarks: "",
    },
  ]);

  // --- F. Green Materials ---
  const greenMaterialsList = [
    "Flyash",
    "Raw Fly Ash",
    "AAC Block",
    "GGBS",
    "Portland Slag Cement",
    "C& D waste Block",
    "Flyash Brick",
    "Reuse of Waste Concrete",
    "Any Old & Used Structure",
    "Recycled Steel",
    "Scrap Steel Structure",
    "Scrap Light Steel",
    "Scrap Iron Dust",
    "Scrap MS strip",
    "Stone Dust",
    "Micro Silica",
    "Granular Sub base",
    "Pond Ash",
    "Micro Fine cement",
    "Silica Fume",
    "Please specify any recycled material used",
  ];
  const [greenMaterials, setGreenMaterials] = useState(
    greenMaterialsList.map((desc, idx) => ({
      id: idx + 1,
      desc,
      unit: "",
      thisMonth: "",
      lastMonth: "",
      uptoDate: "",
      remarks: "",
    })),
  );

  const inputCls =
    "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition";

  const renderStandardTable = (
    data,
    setter,
    columns = [
      "Sr. No",
      "Source/Activity",
      "Unit",
      "This Month",
      "Last Month",
      "Upto Date",
      "Remarks",
    ],
  ) => (
    <div className="overflow-x-auto border border-slate-200 rounded-lg">
      <table className="w-full text-left text-sm whitespace-nowrap">
        <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
          <tr>
            {columns.map((col, idx) => (
              <th
                key={idx}
                className={`px-4 py-3 border-r border-slate-200 last:border-0 ${idx === 0 ? "w-16 text-center" : ""}`}
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {data.map((item, idx) => (
            <tr
              key={item.id || item.pollutant || item.desc}
              className="hover:bg-slate-50/50 transition-colors"
            >
              <td className="px-4 py-2 border-r border-slate-200 text-center text-slate-500">
                {item.id}
              </td>
              <td className="px-4 py-2 border-r border-slate-200 font-medium text-slate-700 min-w-[250px] whitespace-normal">
                {item.source || item.pollutant || item.desc || item.category}
              </td>
              <td className="border-r border-slate-200">
                {item.desc ? (
                  <TableInput
                    value={item.unit}
                    onChange={(e) =>
                      updateArrayItem(setter, idx, "unit", e.target.value)
                    }
                  />
                ) : (
                  <div className="px-4 py-2 text-center text-slate-600">
                    {item.unit}
                  </div>
                )}
              </td>
              <td className="p-0 border-r border-slate-200 min-w-[120px]">
                <TableInput
                  type="number"
                  value={item.thisMonth}
                  onChange={(e) =>
                    updateArrayItem(setter, idx, "thisMonth", e.target.value)
                  }
                />
              </td>
              <td className="p-0 border-r border-slate-200 min-w-[120px]">
                <TableInput
                  type="number"
                  value={item.lastMonth}
                  onChange={(e) =>
                    updateArrayItem(setter, idx, "lastMonth", e.target.value)
                  }
                />
              </td>
              <td className="p-0 border-r border-slate-200 min-w-[120px]">
                <TableInput
                  type="number"
                  value={item.uptoDate}
                  onChange={(e) =>
                    updateArrayItem(setter, idx, "uptoDate", e.target.value)
                  }
                />
              </td>
              <td className="p-0 min-w-[200px] align-top">
                <TableTextarea
                  value={item.remarks}
                  onChange={(e) =>
                    updateArrayItem(setter, idx, "remarks", e.target.value)
                  }
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Header Bar */}
      <div className="sticky top-0 z-20 bg-white border-b border-slate-200 shadow-sm px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
            <FileText size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">
              Environmental Data Report
            </h1>
            <p className="text-sm text-slate-500">
              Record details of environmental metrics and consumption.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <form className="space-y-6">
          {/* 1. Report Identification */}
          <SectionCard title="Project Details">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="col-span-1 md:col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Project Name
                </label>
                <input
                  type="text"
                  className={inputCls}
                  placeholder="Select project"
                  value={meta.projectName}
                  onChange={(e) => updateMeta("projectName", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Report No.
                </label>
                <input
                  type="text"
                  className={inputCls}
                  placeholder="e.g. EDR-2026-001"
                  value={meta.reportNo}
                  onChange={(e) => updateMeta("reportNo", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Month
                </label>
                <input
                  type="month"
                  className={inputCls}
                  value={meta.month}
                  onChange={(e) => updateMeta("month", e.target.value)}
                />
              </div>

              <div className="col-span-1 md:col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Location
                </label>
                <input
                  type="text"
                  className={inputCls}
                  placeholder="Site location"
                  value={meta.location}
                  onChange={(e) => updateMeta("location", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Client
                </label>
                <input
                  type="text"
                  className={inputCls}
                  placeholder="Client name"
                  value={meta.client}
                  onChange={(e) => updateMeta("client", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Date
                </label>
                <input
                  type="date"
                  className={inputCls}
                  value={meta.date}
                  onChange={(e) => updateMeta("date", e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Contractor
                </label>
                <input
                  type="text"
                  className={inputCls}
                  placeholder="Contractor name"
                  value={meta.contractor}
                  onChange={(e) => updateMeta("contractor", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  PMC / 3rd Party
                </label>
                <input
                  type="text"
                  className={inputCls}
                  placeholder="PMC name"
                  value={meta.pmc}
                  onChange={(e) => updateMeta("pmc", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Prepared By
                </label>
                <input
                  type="text"
                  className={inputCls}
                  placeholder="Prepared by"
                  value={meta.preparedBy}
                  onChange={(e) => updateMeta("preparedBy", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Reviewed By
                </label>
                <input
                  type="text"
                  className={inputCls}
                  placeholder="Reviewed by"
                  value={meta.reviewedBy}
                  onChange={(e) => updateMeta("reviewedBy", e.target.value)}
                />
              </div>
            </div>
          </SectionCard>

          {/* 2. Fuel Consumption */}
          <SectionCard title="A. Fuel Consumption">
            {renderStandardTable(fuel, setFuel)}
          </SectionCard>

          {/* 3. Electricity Consumption */}
          <SectionCard title="B. Electricity Consumption">
            {renderStandardTable(electricity, setElectricity)}
          </SectionCard>

          {/* 4. Water Consumption */}
          <SectionCard title="C. Water Consumption">
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 border-r border-slate-200 w-16 text-center">
                      Sr. No
                    </th>
                    <th className="px-4 py-3 border-r border-slate-200">
                      Type of Source
                    </th>
                    <th className="px-4 py-3 border-r border-slate-200 text-center">
                      Units
                    </th>
                    <th className="px-4 py-3 border-r border-slate-200">
                      This Month
                    </th>
                    <th className="px-4 py-3 border-r border-slate-200">
                      Last Month
                    </th>
                    <th className="px-4 py-3 border-r border-slate-200">
                      Upto Date
                    </th>
                    <th className="px-4 py-3">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {water.map((item, idx) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-4 py-2 border-r border-slate-200 text-center text-slate-500">
                        {item.id}
                      </td>
                      <td className="px-4 py-2 border-r border-slate-200 font-medium text-slate-700 min-w-[250px] whitespace-normal">
                        {item.source}
                      </td>
                      <td className="px-4 py-2 border-r border-slate-200 text-center text-slate-600">
                        {item.unit}
                      </td>
                      <td className="p-0 border-r border-slate-200 min-w-[120px]">
                        <TableInput
                          type="number"
                          value={item.thisMonth}
                          onChange={(e) =>
                            updateArrayItem(
                              setWater,
                              idx,
                              "thisMonth",
                              e.target.value,
                            )
                          }
                        />
                      </td>
                      <td className="p-0 border-r border-slate-200 min-w-[120px]">
                        <TableInput
                          type="number"
                          value={item.lastMonth}
                          onChange={(e) =>
                            updateArrayItem(
                              setWater,
                              idx,
                              "lastMonth",
                              e.target.value,
                            )
                          }
                        />
                      </td>
                      <td className="p-0 border-r border-slate-200 min-w-[120px]">
                        <TableInput
                          type="number"
                          value={item.uptoDate}
                          onChange={(e) =>
                            updateArrayItem(
                              setWater,
                              idx,
                              "uptoDate",
                              e.target.value,
                            )
                          }
                        />
                      </td>
                      <td className="p-0 min-w-[200px] align-top">
                        <TableTextarea
                          value={item.remarks}
                          onChange={(e) =>
                            updateArrayItem(
                              setWater,
                              idx,
                              "remarks",
                              e.target.value,
                            )
                          }
                        />
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-orange-50 font-medium text-slate-800">
                    <td className="px-4 py-3 border-r border-slate-200 text-center text-slate-500">
                      6
                    </td>
                    <td className="px-4 py-3 border-r border-slate-200 font-bold">
                      Total consumption
                    </td>
                    <td className="px-4 py-3 border-r border-slate-200 text-center font-bold">
                      KL
                    </td>
                    <td className="px-4 py-3 border-r border-slate-200 text-center font-bold">
                      {calcTotalWater("thisMonth")}
                    </td>
                    <td className="px-4 py-3 border-r border-slate-200 text-center font-bold">
                      {calcTotalWater("lastMonth")}
                    </td>
                    <td className="px-4 py-3 border-r border-slate-200 text-center font-bold">
                      {calcTotalWater("uptoDate")}
                    </td>
                    <td></td>
                  </tr>
                  <tr className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-2 border-r border-slate-200 text-center text-slate-500">
                      {curingCompound.id}
                    </td>
                    <td className="px-4 py-2 border-r border-slate-200 font-medium text-slate-700 min-w-[250px] whitespace-normal">
                      {curingCompound.source}
                    </td>
                    <td className="px-4 py-2 border-r border-slate-200 text-center text-slate-600">
                      {curingCompound.unit}
                    </td>
                    <td className="p-0 border-r border-slate-200 min-w-[120px]">
                      <TableInput
                        type="number"
                        value={curingCompound.thisMonth}
                        onChange={(e) =>
                          setCuringCompound({
                            ...curingCompound,
                            thisMonth: e.target.value,
                          })
                        }
                      />
                    </td>
                    <td className="p-0 border-r border-slate-200 min-w-[120px]">
                      <TableInput
                        type="number"
                        value={curingCompound.lastMonth}
                        onChange={(e) =>
                          setCuringCompound({
                            ...curingCompound,
                            lastMonth: e.target.value,
                          })
                        }
                      />
                    </td>
                    <td className="p-0 border-r border-slate-200 min-w-[120px]">
                      <TableInput
                        type="number"
                        value={curingCompound.uptoDate}
                        onChange={(e) =>
                          setCuringCompound({
                            ...curingCompound,
                            uptoDate: e.target.value,
                          })
                        }
                      />
                    </td>
                    <td className="p-0 min-w-[200px] align-top">
                      <TableTextarea
                        value={curingCompound.remarks}
                        onChange={(e) =>
                          setCuringCompound({
                            ...curingCompound,
                            remarks: e.target.value,
                          })
                        }
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </SectionCard>

          {/* 5. Waste Data */}
          <SectionCard title="D. Waste Data">
            <div className="overflow-x-auto border border-slate-200 rounded-lg mb-6">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 border-r border-slate-200 w-16 text-center">
                      Sr. No
                    </th>
                    <th className="px-4 py-3 border-r border-slate-200 min-w-[250px]">
                      Description
                    </th>
                    <th className="px-4 py-3 border-r border-slate-200 text-center">
                      Units
                    </th>
                    <th className="px-4 py-3 border-r border-slate-200 w-32 text-center">
                      This Month
                    </th>
                    <th className="px-4 py-3 border-r border-slate-200 w-32 text-center">
                      Last Month
                    </th>
                    <th className="px-4 py-3 border-r border-slate-200 w-32 text-center">
                      Upto Date
                    </th>
                    <th className="px-4 py-3 min-w-[200px]">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <WasteBlock
                    title="Plastic Waste Data"
                    prefix="A"
                    state={plasticWaste}
                    setter={setPlasticWaste}
                  />
                  <WasteBlock
                    title="Construction and Demolition Data"
                    prefix="B"
                    state={cndWaste}
                    setter={setCndWaste}
                  />
                  <WasteBlock
                    title="Battery Waste Data"
                    prefix="C"
                    state={batteryWaste}
                    setter={setBatteryWaste}
                  />
                  <WasteBlock
                    title="Hazardous Waste Data"
                    prefix="D"
                    state={hazardousWaste}
                    setter={setHazardousWaste}
                  />
                  <WasteBlock
                    title="Non-Hazardous Waste Data (Dry waste)"
                    prefix="E"
                    state={nonHazardousWaste}
                    setter={setNonHazardousWaste}
                  />
                </tbody>

                <thead className="bg-slate-50 text-slate-600 font-medium border-y border-slate-200">
                  <tr className="bg-slate-50 font-medium text-slate-800 border-b border-slate-200">
                    <th className="px-4 py-2 border-r border-slate-200 text-center font-bold">
                      F.
                    </th>
                    <th colSpan="6" className="px-4 py-2">
                      For Each category of waste generated, total waste
                      recovered through recycling, re-using or other recovery
                      operation
                    </th>
                  </tr>
                  <tr>
                    <th className="px-4 py-3 border-r border-slate-200 w-16 text-center">
                      #
                    </th>
                    <th className="px-4 py-3 border-r border-slate-200 min-w-[250px]">
                      Category of waste
                    </th>
                    <th className="px-4 py-3 border-r border-slate-200 text-center w-32">
                      Unit
                    </th>
                    <th className="px-4 py-3 border-r border-slate-200 w-32">
                      This Month
                    </th>
                    <th className="px-4 py-3 border-r border-slate-200 w-32">
                      Last Month
                    </th>
                    <th className="px-4 py-3 border-r border-slate-200 w-32">
                      Upto Date
                    </th>
                    <th className="px-4 py-3 min-w-[200px]">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {wasteRecovery.map((item, idx) => (
                    <tr key={item.id}>
                      <td className="px-4 py-2 border-r border-slate-200 text-center text-slate-500">
                        ({item.id})
                      </td>
                      <td className="px-4 py-2 border-r border-slate-200 text-slate-700">
                        {item.category}
                      </td>
                      <td className="px-4 py-2 border-r border-slate-200 text-center text-slate-600">
                        Metric tons
                      </td>
                      <td className="p-0 border-r border-slate-200">
                        <TableInput
                          type="number"
                          value={item.thisMonth}
                          onChange={(e) =>
                            updateArrayItem(
                              setWasteRecovery,
                              idx,
                              "thisMonth",
                              e.target.value,
                            )
                          }
                        />
                      </td>
                      <td className="p-0 border-r border-slate-200">
                        <TableInput
                          type="number"
                          value={item.lastMonth}
                          onChange={(e) =>
                            updateArrayItem(
                              setWasteRecovery,
                              idx,
                              "lastMonth",
                              e.target.value,
                            )
                          }
                        />
                      </td>
                      <td className="p-0 border-r border-slate-200">
                        <TableInput
                          type="number"
                          value={item.uptoDate}
                          onChange={(e) =>
                            updateArrayItem(
                              setWasteRecovery,
                              idx,
                              "uptoDate",
                              e.target.value,
                            )
                          }
                        />
                      </td>
                      <td className="p-0 align-top">
                        <TableTextarea
                          value={item.remarks}
                          onChange={(e) =>
                            updateArrayItem(
                              setWasteRecovery,
                              idx,
                              "remarks",
                              e.target.value,
                            )
                          }
                        />
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-orange-50 font-bold text-slate-800">
                    <td
                      colSpan="2"
                      className="px-4 py-3 border-r border-slate-200 text-center"
                    >
                      Total
                    </td>
                    <td className="px-4 py-3 border-r border-slate-200 text-center">
                      Metric tons
                    </td>
                    <td className="px-4 py-3 border-r border-slate-200 text-center">
                      {calcTotalRecovery("thisMonth")}
                    </td>
                    <td className="px-4 py-3 border-r border-slate-200 text-center">
                      {calcTotalRecovery("lastMonth")}
                    </td>
                    <td className="px-4 py-3 border-r border-slate-200 text-center">
                      {calcTotalRecovery("uptoDate")}
                    </td>
                    <td></td>
                  </tr>
                </tbody>

                <thead className="bg-slate-50 text-slate-600 font-medium border-y border-slate-200">
                  <tr className="bg-slate-50 font-medium text-slate-800 border-b border-slate-200">
                    <th className="px-4 py-2 border-r border-slate-200 text-center font-bold">
                      G.
                    </th>
                    <th colSpan="6" className="px-4 py-2">
                      For each category of waste generated, total waste disposed
                      by nature of disposal method
                    </th>
                  </tr>
                  <tr>
                    <th className="px-4 py-3 border-r border-slate-200 w-16 text-center">
                      #
                    </th>
                    <th className="px-4 py-3 border-r border-slate-200 min-w-[250px]">
                      Category of waste
                    </th>
                    <th className="px-4 py-3 border-r border-slate-200 text-center w-32">
                      Unit
                    </th>
                    <th className="px-4 py-3 border-r border-slate-200 w-32">
                      This Month
                    </th>
                    <th className="px-4 py-3 border-r border-slate-200 w-32">
                      Last Month
                    </th>
                    <th className="px-4 py-3 border-r border-slate-200 w-32">
                      Upto Date
                    </th>
                    <th className="px-4 py-3 min-w-[200px]">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {wasteDisposal.map((item, idx) => (
                    <tr key={item.id}>
                      <td className="px-4 py-2 border-r border-slate-200 text-center text-slate-500">
                        ({item.id})
                      </td>
                      <td className="px-4 py-2 border-r border-slate-200 text-slate-700">
                        {item.category}
                      </td>
                      <td className="px-4 py-2 border-r border-slate-200 text-center text-slate-600">
                        Metric tons
                      </td>
                      <td className="p-0 border-r border-slate-200">
                        <TableInput
                          type="number"
                          value={item.thisMonth}
                          onChange={(e) =>
                            updateArrayItem(
                              setWasteDisposal,
                              idx,
                              "thisMonth",
                              e.target.value,
                            )
                          }
                        />
                      </td>
                      <td className="p-0 border-r border-slate-200">
                        <TableInput
                          type="number"
                          value={item.lastMonth}
                          onChange={(e) =>
                            updateArrayItem(
                              setWasteDisposal,
                              idx,
                              "lastMonth",
                              e.target.value,
                            )
                          }
                        />
                      </td>
                      <td className="p-0 border-r border-slate-200">
                        <TableInput
                          type="number"
                          value={item.uptoDate}
                          onChange={(e) =>
                            updateArrayItem(
                              setWasteDisposal,
                              idx,
                              "uptoDate",
                              e.target.value,
                            )
                          }
                        />
                      </td>
                      <td className="p-0 align-top">
                        <TableTextarea
                          value={item.remarks}
                          onChange={(e) =>
                            updateArrayItem(
                              setWasteDisposal,
                              idx,
                              "remarks",
                              e.target.value,
                            )
                          }
                        />
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-orange-50 font-bold text-slate-800">
                    <td
                      colSpan="2"
                      className="px-4 py-3 border-r border-slate-200 text-center"
                    >
                      Total
                    </td>
                    <td className="px-4 py-3 border-r border-slate-200 text-center">
                      Metric tons
                    </td>
                    <td className="px-4 py-3 border-r border-slate-200 text-center">
                      {calcTotalDisposal("thisMonth")}
                    </td>
                    <td className="px-4 py-3 border-r border-slate-200 text-center">
                      {calcTotalDisposal("lastMonth")}
                    </td>
                    <td className="px-4 py-3 border-r border-slate-200 text-center">
                      {calcTotalDisposal("uptoDate")}
                    </td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </SectionCard>

          {/* 6. Air Pollutant */}
          <SectionCard title="E. Air Pollutant">
            <div className="mb-2 font-bold text-slate-700 text-sm pl-2">
              A. Ambient Air Monitoring
            </div>
            <div className="mb-6">
              {renderStandardTable(ambientAir, setAmbientAir, [
                "Sr. No",
                "Pollutant Content",
                "Units",
                "This Month",
                "Last Month",
                "Upto Date",
                "Remarks",
              ])}
            </div>
            <div className="mb-2 font-bold text-slate-700 text-sm pl-2">
              B. DG Stack monitoring
            </div>
            <div>
              {renderStandardTable(dgStack, setDgStack, [
                "Sr. No",
                "Pollutant Content",
                "Units",
                "This Month",
                "Last Month",
                "Upto Date",
                "Remarks",
              ])}
            </div>
          </SectionCard>

          {/* 7. Green Materials */}
          <SectionCard title="F. Green Materials Consumption Details">
            {renderStandardTable(greenMaterials, setGreenMaterials, [
              "Sr. No",
              "Description",
              "Units",
              "This Month",
              "Last Month",
              "Upto Date",
              "Remarks",
            ])}
          </SectionCard>
        </form>
      </div>

      {/* Actions Footer */}
      <div className="bg-white border-t border-slate-200 p-4 flex justify-end gap-3 mt-4">
        <button
          type="button"
          className="px-5 py-2.5 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
        >
          Cancel
        </button>
        <button
          type="button"
          className="px-6 py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:opacity-90 shadow-sm transition"
        >
          Save Environmental Report
        </button>
      </div>
    </div>
  );
}
