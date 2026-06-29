import { useEffect, useMemo, useState } from "react";
import { ClipboardList, FileText, FolderOpen, Plus, X } from "lucide-react";
import { formatDisplayDate } from "../../../../utils/dateFormatter";

function formatDate(value) {
  return formatDisplayDate(value);
}

function formatTime(value) {
  if (!value) return "-";
  return String(value);
}

function getValue(row, ...keys) {
  for (const key of keys) {
    if (row?.[key] !== null && row?.[key] !== undefined && row?.[key] !== "") {
      return row[key];
    }
  }
  return "";
}

function createEmptyMaterialInwardRow() {
  return {
    id: `material-inward-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 9)}`,
    isManual: true,

    supplier_name: "",
    delivery_challan_invoice_no: "",
    dc_invoice_date: "",
    vehicle_no: "",
    gate_no: "",
    inward_date: "",
    inward_time: "",
    outward_time: "",
    material_description: "",
    unit: "",
    accepted_quantity: "",
  };
}

export default function MaterialInwardRegister({
  folderId = "",
  folderName = "Material Inward Register",
  documents = [],
}) {
  const storageKey = `material-inward-register-${folderId || "default"}`;

  const [manualRows, setManualRows] = useState(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw || raw === "undefined" || raw === "null") return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(manualRows));
    } catch {
      // ignore localStorage error
    }
  }, [manualRows, storageKey]);

  const actualRows = Array.isArray(documents) ? documents : [];

  const rows = useMemo(() => {
    return [...actualRows, ...manualRows];
  }, [actualRows, manualRows]);

  const handleAddRow = () => {
    setManualRows((prev) => [...prev, createEmptyMaterialInwardRow()]);
  };

  const handleRowChange = (rowId, field, value) => {
    setManualRows((prev) =>
      prev.map((row) => (row.id === rowId ? { ...row, [field]: value } : row)),
    );
  };

  const handleDeleteRow = (rowId) => {
    setManualRows((prev) => prev.filter((row) => row.id !== rowId));
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-gray-200 bg-gradient-to-r from-orange-50 via-white to-amber-50 p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary shadow-sm ring-1 ring-orange-100">
              <ClipboardList className="h-3.5 w-3.5" />
              Material Inward Register
            </div>

            <h2 className="mt-3 text-xl font-semibold text-gray-900">
              {folderName}
            </h2>

            <p className="mt-1 text-sm text-gray-600">
              Track supplier, challan, vehicle, gate, inward/outward timing and
              accepted material quantity.
            </p>
          </div>

          <div className="rounded-2xl border border-orange-100 bg-white px-4 py-3 text-right shadow-sm">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              Visible Rows
            </div>
            <div className="mt-1 text-2xl font-semibold text-gray-900">
              {rows.length}
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
            <FolderOpen className="h-4 w-4 text-primary" />
            <span>Material Inward Register</span>
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
            <div className="rounded-full bg-orange-50 p-3 text-primary">
              <FileText className="h-6 w-6" />
            </div>

            <h3 className="mt-4 text-base font-semibold text-gray-900">
              No material inward rows found
            </h3>

            <p className="mt-1 max-w-md text-sm text-gray-500">
              Click Add Row to start maintaining the Material Inward Register.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[1750px] w-full text-sm">
              <thead>
                <tr className="bg-gray-50/80 text-left">
                  <th className="px-3 py-3 font-semibold text-gray-800 text-center min-w-[70px]">
                    Sl. No.
                  </th>

                  <th className="px-3 py-3 font-semibold text-gray-800 min-w-[220px]">
                    Name Of Supplier
                  </th>

                  <th className="px-3 py-3 font-semibold text-gray-800 min-w-[210px]">
                    Delivery Challan / Invoice No.
                  </th>

                  <th className="px-3 py-3 font-semibold text-gray-800 min-w-[160px]">
                    DC / Invoice Date
                  </th>

                  <th className="px-3 py-3 font-semibold text-gray-800 min-w-[150px]">
                    Vehicle No
                  </th>

                  <th className="px-3 py-3 font-semibold text-gray-800 min-w-[130px]">
                    Gate No
                  </th>

                  <th className="px-3 py-3 font-semibold text-gray-800 min-w-[150px]">
                    Inward Date
                  </th>

                  <th className="px-3 py-3 font-semibold text-gray-800 min-w-[140px]">
                    Inward Time
                  </th>

                  <th className="px-3 py-3 font-semibold text-gray-800 min-w-[140px]">
                    Outward Time
                  </th>

                  <th className="px-3 py-3 font-semibold text-gray-800 min-w-[280px]">
                    Material Description
                  </th>

                  <th className="px-3 py-3 font-semibold text-gray-800 min-w-[100px]">
                    Unit
                  </th>

                  <th className="px-3 py-3 font-semibold text-gray-800 min-w-[160px]">
                    Accepted Quantity
                  </th>

                  <th className="px-3 py-3 font-semibold text-gray-800 text-center min-w-[90px]">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {rows.map((row, index) => (
                  <tr
                    key={row.id || `material-inward-row-${index}`}
                    className="border-t border-gray-100 odd:bg-white even:bg-slate-50 hover:bg-orange-50/30"
                  >
                    <td className="px-3 py-3 text-center text-gray-700">
                      {index + 1}
                    </td>

                    <td className="px-3 py-3 text-gray-800">
                      {row.isManual ? (
                        <input
                          type="text"
                          value={row.supplier_name}
                          onChange={(e) =>
                            handleRowChange(
                              row.id,
                              "supplier_name",
                              e.target.value,
                            )
                          }
                          placeholder="Supplier name"
                          className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
                        />
                      ) : (
                        getValue(
                          row,
                          "supplier_name",
                          "supplierName",
                          "name_of_supplier",
                        ) || "-"
                      )}
                    </td>

                    <td className="px-3 py-3 text-gray-700">
                      {row.isManual ? (
                        <input
                          type="text"
                          value={row.delivery_challan_invoice_no}
                          onChange={(e) =>
                            handleRowChange(
                              row.id,
                              "delivery_challan_invoice_no",
                              e.target.value,
                            )
                          }
                          placeholder="Challan / Invoice No."
                          className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
                        />
                      ) : (
                        getValue(
                          row,
                          "delivery_challan_invoice_no",
                          "deliveryChallanInvoiceNo",
                          "challan_no",
                          "invoice_no",
                        ) || "-"
                      )}
                    </td>

                    <td className="px-3 py-3 text-gray-700">
                      {row.isManual ? (
                        <input
                          type="date"
                          value={row.dc_invoice_date}
                          onChange={(e) =>
                            handleRowChange(
                              row.id,
                              "dc_invoice_date",
                              e.target.value,
                            )
                          }
                          className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
                        />
                      ) : (
                        formatDate(
                          getValue(
                            row,
                            "dc_invoice_date",
                            "dcInvoiceDate",
                            "invoice_date",
                          ),
                        )
                      )}
                    </td>

                    <td className="px-3 py-3 text-gray-700">
                      {row.isManual ? (
                        <input
                          type="text"
                          value={row.vehicle_no}
                          onChange={(e) =>
                            handleRowChange(
                              row.id,
                              "vehicle_no",
                              e.target.value,
                            )
                          }
                          placeholder="Vehicle No"
                          className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
                        />
                      ) : (
                        getValue(row, "vehicle_no", "vehicleNo") || "-"
                      )}
                    </td>

                    <td className="px-3 py-3 text-gray-700">
                      {row.isManual ? (
                        <input
                          type="text"
                          value={row.gate_no}
                          onChange={(e) =>
                            handleRowChange(row.id, "gate_no", e.target.value)
                          }
                          placeholder="Gate No"
                          className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
                        />
                      ) : (
                        getValue(row, "gate_no", "gateNo") || "-"
                      )}
                    </td>

                    <td className="px-3 py-3 text-gray-700">
                      {row.isManual ? (
                        <input
                          type="date"
                          value={row.inward_date}
                          onChange={(e) =>
                            handleRowChange(
                              row.id,
                              "inward_date",
                              e.target.value,
                            )
                          }
                          className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
                        />
                      ) : (
                        formatDate(
                          getValue(
                            row,
                            "inward_date",
                            "inwardDate",
                            "created_at",
                            "createdAt",
                          ),
                        )
                      )}
                    </td>

                    <td className="px-3 py-3 text-gray-700">
                      {row.isManual ? (
                        <input
                          type="time"
                          value={row.inward_time}
                          onChange={(e) =>
                            handleRowChange(
                              row.id,
                              "inward_time",
                              e.target.value,
                            )
                          }
                          className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
                        />
                      ) : (
                        formatTime(getValue(row, "inward_time", "inwardTime"))
                      )}
                    </td>

                    <td className="px-3 py-3 text-gray-700">
                      {row.isManual ? (
                        <input
                          type="time"
                          value={row.outward_time}
                          onChange={(e) =>
                            handleRowChange(
                              row.id,
                              "outward_time",
                              e.target.value,
                            )
                          }
                          className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
                        />
                      ) : (
                        formatTime(getValue(row, "outward_time", "outwardTime"))
                      )}
                    </td>

                    <td className="px-3 py-3 text-gray-800">
                      {row.isManual ? (
                        <input
                          type="text"
                          value={row.material_description}
                          onChange={(e) =>
                            handleRowChange(
                              row.id,
                              "material_description",
                              e.target.value,
                            )
                          }
                          placeholder="Material description"
                          className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
                        />
                      ) : (
                        getValue(
                          row,
                          "material_description",
                          "materialDescription",
                          "description",
                        ) || "-"
                      )}
                    </td>

                    <td className="px-3 py-3 text-gray-700">
                      {row.isManual ? (
                        <input
                          type="text"
                          value={row.unit}
                          onChange={(e) =>
                            handleRowChange(row.id, "unit", e.target.value)
                          }
                          placeholder="Unit"
                          className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
                        />
                      ) : (
                        getValue(row, "unit", "uom") || "-"
                      )}
                    </td>

                    <td className="px-3 py-3 text-gray-700">
                      {row.isManual ? (
                        <input
                          type="number"
                          min="0"
                          value={row.accepted_quantity}
                          onChange={(e) =>
                            handleRowChange(
                              row.id,
                              "accepted_quantity",
                              e.target.value,
                            )
                          }
                          placeholder="0"
                          className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
                        />
                      ) : (
                        getValue(
                          row,
                          "accepted_quantity",
                          "acceptedQuantity",
                          "accepted_qty",
                          "acceptedQty",
                        ) || "-"
                      )}
                    </td>

                    <td className="px-3 py-3 text-center align-middle">
                      {row.isManual ? (
                        <button
                          type="button"
                          onClick={() => handleDeleteRow(row.id)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                          title="Delete row"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex justify-start border-t border-gray-100 bg-white px-5 py-4">
          <button
            type="button"
            onClick={handleAddRow}
            className="inline-flex items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-semibold text-primary hover:bg-orange-100"
          >
            <Plus className="h-4 w-4" />
            Add Row
          </button>
        </div>
      </div>
    </div>
  );
}
