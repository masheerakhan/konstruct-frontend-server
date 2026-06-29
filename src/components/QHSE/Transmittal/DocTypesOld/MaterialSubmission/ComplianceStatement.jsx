import { useRef } from "react";
import { Plus, Trash2, Upload, FileCheck, PlusCircle } from "lucide-react";
import { createComplianceRow } from "../../approvedVendors";
import { capitalCase } from "../../stringCase";

const statusOptions = [
  { value: "CP", label: "Comply", color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  { value: "PC", label: "Partially Comply", color: "text-amber-700 bg-amber-50 border-amber-200" },
  { value: "NC", label: "Not Comply", color: "text-red-700 bg-red-50 border-red-200" },
  { value: "NA", label: "Not Applicable", color: "text-gray-500 bg-gray-100 border-gray-200" },
];

export default function ComplianceStatement({
  tables,
  onTablesChange,
  onAddTable,
  allowAddAnotherTable = true,
  showMainHeading = true,
  onRemoveAll,
}) {
  const fileRefs = useRef({});

  const updateTable = (tableId, patch) => {
    onTablesChange(tables.map((t) => (t.id === tableId ? { ...t, ...patch } : t)));
  };

  const updateRow = (tableId, rowId, patch) => {
    onTablesChange(
      tables.map((t) =>
        t.id === tableId ? { ...t, rows: t.rows.map((r) => (r.id === rowId ? { ...r, ...patch } : r)) } : t
      )
    );
  };

  const addRow = (tableId) => {
    const table = tables.find((t) => t.id === tableId);
    if (!table) return;
    const nextSlNo = table.rows.length + 1;
    updateTable(tableId, { rows: [...table.rows, createComplianceRow(nextSlNo)] });
  };

  const removeRow = (tableId, rowId) => {
    const table = tables.find((t) => t.id === tableId);
    if (!table || table.rows.length <= 1) return;
    const newRows = table.rows.filter((r) => r.id !== rowId).map((r, i) => ({ ...r, slNo: i + 1 }));
    updateTable(tableId, { rows: newRows });
  };

  const removeTable = (tableId) => {
    onTablesChange(tables.filter((t) => t.id !== tableId));
  };

  return (
    <div className="space-y-6">
      {showMainHeading && (
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-[12px] uppercase tracking-wider font-bold text-gray-500">
            {capitalCase("compliance statement for technical requirements")}
          </h2>
        </div>
      )}
      {!showMainHeading && onRemoveAll && (
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={onRemoveAll}
            className="h-8 text-xs text-red-600 hover:text-red-700 inline-flex items-center gap-1 px-2 rounded border border-red-200 bg-red-50"
          >
            <Trash2 className="w-3.5 h-3.5" /> {capitalCase("remove compliance statement")}
          </button>
        </div>
      )}

      {tables.map((table, tableIndex) => (
        <div key={table.id} className="border border-gray-200 rounded-xl bg-white p-4 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-foreground">
              {capitalCase("table")} {tableIndex + 1}
            </span>
            {tables.length > 1 && (
              <button
                type="button"
                onClick={() => removeTable(table.id)}
                className="h-7 text-xs text-red-600 hover:text-red-700 inline-flex items-center gap-1 px-2 rounded"
              >
                <Trash2 className="w-3.5 h-3.5" /> {capitalCase("remove table")}
              </button>
            )}
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-wider font-bold text-gray-500 block mb-1">
              {capitalCase("material specification")}
            </label>
            <input
              value={table.documentDescription}
              onChange={(e) => updateTable(table.id, { documentDescription: e.target.value })}
              className="h-9 w-full text-xs rounded-lg border border-gray-200 bg-white px-2"
              placeholder={capitalCase("enter material specification")}
            />
          </div>

          <div className="border border-gray-200 rounded-lg overflow-x-auto">
            <table className="w-full text-xs min-w-[780px]">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left text-[10px] uppercase tracking-wider font-bold text-gray-500 px-3 py-2.5 w-10">
                    {capitalCase("sl")}
                  </th>
                  <th className="text-left text-[10px] uppercase tracking-wider font-bold text-gray-500 px-3 py-2.5 min-w-[180px]">
                    {capitalCase("technical requirements")}
                  </th>
                  <th className="text-left text-[10px] uppercase tracking-wider font-bold text-gray-500 px-3 py-2.5 w-[130px]">
                    {capitalCase("limits")} ({capitalCase("is code")})
                  </th>
                  <th className="text-left text-[10px] uppercase tracking-wider font-bold text-gray-500 px-3 py-2.5 w-[100px]">
                    {capitalCase("values")} ({capitalCase("tds")})
                  </th>
                  <th className="text-left text-[10px] uppercase tracking-wider font-bold text-gray-500 px-3 py-2.5 w-[100px]">
                    {capitalCase("values")} ({capitalCase("mtc")})
                  </th>
                  <th className="text-center text-[10px] uppercase tracking-wider font-bold text-gray-500 px-3 py-2.5 w-[140px]">
                    {capitalCase("status")}
                  </th>
                  <th className="text-left text-[10px] uppercase tracking-wider font-bold text-gray-500 px-3 py-2.5 min-w-[140px]">
                    {capitalCase("response")}
                  </th>
                  <th className="w-8"></th>
                </tr>
              </thead>
              <tbody>
                {table.rows.map((row) => (
                  <tr key={row.id} className="border-t border-gray-200 hover:bg-gray-50/50 transition-colors">
                    <td className="px-3 py-2 text-gray-500 tabular-nums align-top">{row.slNo}</td>
                    <td className="px-3 py-2 align-top">
                      <textarea
                        value={row.technicalRequirement}
                        onChange={(e) => updateRow(table.id, row.id, { technicalRequirement: e.target.value })}
                        className="min-h-[64px] w-full text-xs rounded-md border border-gray-200 bg-white resize-y px-1"
                        placeholder={
                          "Enter Property/Parameter"
                            .split("/")
                            .map(part => capitalCase(part.trim()))
                            .join("/")
                        }
                        rows={2}
                      />
                    </td>
                    <td className="px-3 py-2 align-top">
                      <input
                        value={row.limits}
                        onChange={(e) => updateRow(table.id, row.id, { limits: e.target.value })}
                        className="h-7 w-full text-xs rounded-md border border-gray-200 bg-white px-1"
                        placeholder="Limits"
                      />
                    </td>
                    <td className="px-3 py-2 align-top">
                      <input
                        value={row.valuesPerTDS}
                        onChange={(e) => updateRow(table.id, row.id, { valuesPerTDS: e.target.value })}
                        className="h-7 w-full text-xs rounded-md border border-gray-200 bg-white px-1"
                        placeholder={capitalCase("tds")}
                      />
                    </td>
                    <td className="px-3 py-2 align-top">
                      <input
                        value={row.valuesPerMTC}
                        onChange={(e) => updateRow(table.id, row.id, { valuesPerMTC: e.target.value })}
                        className="h-7 w-full text-xs rounded-md border border-gray-200 bg-white px-1"
                        placeholder={capitalCase("mtc")}
                      />
                    </td>
                    <td className="px-3 py-2 align-top">
                      <select
                        value={row.status}
                        onChange={(e) => updateRow(table.id, row.id, { status: e.target.value })}
                        className="h-7 w-full text-xs rounded-md border border-gray-200 bg-white pl-1.5 pr-5"
                      >
                        {statusOptions.map((opt) => (
                          <option key={opt.value} value={opt.value} className="text-xs">
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2 align-top">
                      <textarea
                        value={row.contractorsResponse}
                        onChange={(e) => updateRow(table.id, row.id, { contractorsResponse: e.target.value })}
                        className="min-h-[64px] w-full text-xs rounded-md border border-gray-200 bg-white resize-y px-1"
                        placeholder={capitalCase("response")}
                        rows={2}
                      />
                    </td>
                    <td className="px-1 py-2 align-top">
                      {table.rows.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeRow(table.id, row.id)}
                          className="p-1 rounded-md text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => addRow(table.id)}
              className="h-8 text-xs rounded-lg border border-gray-200 bg-white px-3 inline-flex items-center gap-1 hover:bg-gray-50"
            >
              <Plus className="w-3.5 h-3.5" /> {capitalCase("add row")}
            </button>

            {/* 
            <button
              type="button"
              onClick={() => fileRefs.current[table.id]?.click()}
              className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${table.attachedFile
                  ? "border-emerald-500/40 bg-emerald-50 text-emerald-700 hover:bg-emerald-100/50"
                  : "border-primary/30 bg-orange-50 text-primary hover:bg-orange-100/50"
                }`}
            >
              {table.attachedFile ? (
                <>
                  <FileCheck className="w-3.5 h-3.5" />
                  {table.attachedFile.name.length > 20 ? table.attachedFile.name.slice(0, 20) + "…" : table.attachedFile.name}
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  {capitalCase("attach document")}
                </>
              )}
            </button>
            <input
              type="file"
              ref={(el) => {
                fileRefs.current[table.id] = el;
              }}
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) updateTable(table.id, { attachedFile: file });
              }}
            /> 
            */}
          </div>
        </div>
      ))}

      {allowAddAnotherTable && (
        <button
          type="button"
          onClick={onAddTable}
          className="w-full h-10 text-xs rounded-xl border border-dashed border-gray-300 bg-white hover:bg-gray-50 inline-flex items-center justify-center gap-1.5"
        >
          <PlusCircle className="w-4 h-4" /> {capitalCase("add another compliance table")}
        </button>
      )}
    </div>
  );
}
