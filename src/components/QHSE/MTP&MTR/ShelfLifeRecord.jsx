import { useEffect, useMemo, useRef, useState } from "react";
import { Calendar, Plus, Save, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { formatDisplayDate } from "../../../utils/dateFormatter";

const uid = () =>
  window.crypto?.randomUUID?.() ||
  `chem-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const formatDate = (date) => formatDisplayDate(date);

const blankRow = () => ({
  id: uid(),
  itemDescription: "",
  brandManufacturer: "",
  categoryOfMaterial: "",
  shelfLifePeriod: "",
  unit: "",
  quantity: "",
  batchNumber: "",
  receivedDate: "",
  manufacturedDate: "",
  expiryDate: "",
  daysLapse: "",
  expiredValid: "",
  remarks: "",
});

const inputCls =
  "w-full rounded-md border border-transparent bg-transparent px-2 py-1.5 text-sm text-gray-900 transition-colors placeholder:text-gray-400 hover:border-gray-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30";

const tableHeaderCls =
  "bg-[#f5f7fa] text-[11px] font-semibold uppercase tracking-wide text-[#6b7280]";

function AutoTextarea({ value, onChange, placeholder }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    el.style.height = "auto";
    el.style.height = `${Math.max(36, el.scrollHeight)}px`;
  }, [value]);

  return (
    <textarea
      ref={ref}
      rows={1}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={`${inputCls} min-h-[36px] resize-none leading-snug`}
    />
  );
}

export default function ConstructionChemicalsStockShelfLifeRecord({
  projectOptions = [],
  storageKey = "construction-chemicals-stock-shelf-life",
}) {
  const safeProjects = Array.isArray(projectOptions) ? projectOptions : [];

  const defaultProject =
    safeProjects[0]?.name ||
    safeProjects[0]?.project_name ||
    safeProjects[0]?.id ||
    "";

  const [project, setProject] = useState(defaultProject);
  const [rows, setRows] = useState([blankRow()]);
  const [lastUpdated, setLastUpdated] = useState("-");

  const activeStorageKey = useMemo(() => {
    return `${storageKey}:${project || "default"}`;
  }, [storageKey, project]);

  useEffect(() => {
    if (!project && defaultProject) {
      setProject(defaultProject);
    }
  }, [defaultProject, project]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(activeStorageKey);

      if (!raw) {
        setRows([blankRow()]);
        setLastUpdated("-");
        return;
      }

      const parsed = JSON.parse(raw);

      setRows(
        Array.isArray(parsed?.rows) && parsed.rows.length
          ? parsed.rows.map((row) => ({
              ...blankRow(),
              ...row,
              id: row.id || uid(),
            }))
          : [blankRow()],
      );

      setLastUpdated(parsed?.lastUpdated || "-");
    } catch {
      setRows([blankRow()]);
      setLastUpdated("-");
    }
  }, [activeStorageKey]);

  const updateRow = (rowIndex, key, value) => {
    setRows((prev) =>
      prev.map((row, index) =>
        index === rowIndex ? { ...row, [key]: value } : row,
      ),
    );
  };

  const insertRowBelow = (rowIndex) => {
    setRows((prev) => {
      const next = [...prev];
      next.splice(rowIndex + 1, 0, blankRow());
      return next;
    });
  };

  const appendRow = () => {
    setRows((prev) => [...prev, blankRow()]);
  };

  const deleteRow = (rowIndex) => {
    setRows((prev) => {
      if (prev.length <= 1) return [blankRow()];
      return prev.filter((_, index) => index !== rowIndex);
    });
  };

  const handleSave = () => {
    const updatedOn = formatDate(new Date());

    const payload = {
      project,
      rows,
      lastUpdated: updatedOn,
    };

    localStorage.setItem(activeStorageKey, JSON.stringify(payload));
    setLastUpdated(updatedOn);

    console.log("Saved Construction Chemicals Stock & Shelf-life:", payload);
    toast.success("Construction Chemicals Stock & Shelf-life saved");
  };

  return (
    <div className="min-h-screen bg-content-bg text-gray-900">
      <div className="mx-auto max-w-[1500px] px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">
            Chemicals & Adhesive Shelf-life Details Record
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Maintain construction chemicals stock, shelf-life, batch details,
            expiry status and remarks.
          </p>
        </div>

        <div className="mb-5 flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Project
            </label>

            <select
              value={project}
              onChange={(e) => setProject(e.target.value)}
              className="h-9 min-w-[220px] rounded-md border border-gray-200 bg-white px-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {!safeProjects.length && <option value="">Select project</option>}

              {safeProjects.map((item) => {
                const value = item.name || item.project_name || item.id;

                return (
                  <option key={item.id || value} value={value}>
                    {item.name || item.project_name || `Project ${item.id}`}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Last Updated
              </span>
              <span className="text-sm font-medium tabular-nums text-gray-900">
                {lastUpdated}
              </span>
            </div>

            <button
              type="button"
              onClick={handleSave}
              className="inline-flex h-9 items-center gap-2 rounded-md border border-primary bg-primary px-4 text-sm font-medium text-white shadow-sm transition-colors hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <Save className="h-4 w-4" />
              Save
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-gray-100 bg-white px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">
                Stock & Shelf-life Register
              </h2>
              <p className="text-xs text-gray-500">
                All fields are manually editable. Sr. No. is auto generated.
              </p>
            </div>

            <button
              type="button"
              onClick={appendRow}
              className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              <Plus className="h-3.5 w-3.5" />
              Add row
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1500px] border-collapse text-sm">
              <thead className="sticky top-0 z-10 bg-[#f5f7fa]">
                <tr className="text-left">
                  <th className={`w-16 px-3 py-3 ${tableHeaderCls}`}>
                    Sr. No.
                  </th>
                  <th className={`min-w-[220px] px-3 py-3 ${tableHeaderCls}`}>
                    Item Description
                  </th>
                  <th className={`min-w-[180px] px-3 py-3 ${tableHeaderCls}`}>
                    Brand / Manufacturer
                  </th>
                  <th className={`min-w-[190px] px-3 py-3 ${tableHeaderCls}`}>
                    Category of Material
                  </th>
                  <th className={`min-w-[150px] px-3 py-3 ${tableHeaderCls}`}>
                    Shelf Life Period
                  </th>
                  <th className={`min-w-[110px] px-3 py-3 ${tableHeaderCls}`}>
                    Unit
                  </th>
                  <th className={`min-w-[130px] px-3 py-3 ${tableHeaderCls}`}>
                    Quantity
                  </th>
                  <th className={`min-w-[180px] px-3 py-3 ${tableHeaderCls}`}>
                    Batch Number
                  </th>
                  <th className={`min-w-[150px] px-3 py-3 ${tableHeaderCls}`}>
                    Received Date
                  </th>
                  <th className={`min-w-[160px] px-3 py-3 ${tableHeaderCls}`}>
                    Manufactured Date
                  </th>
                  <th className={`min-w-[150px] px-3 py-3 ${tableHeaderCls}`}>
                    Expiry Date
                  </th>
                  <th className={`min-w-[130px] px-3 py-3 ${tableHeaderCls}`}>
                    Days Lapse
                  </th>
                  <th className={`min-w-[130px] px-3 py-3 ${tableHeaderCls}`}>
                    Expired / Valid
                  </th>
                  <th className={`min-w-[220px] px-3 py-3 ${tableHeaderCls}`}>
                    Remarks
                  </th>
                  <th className={`w-24 px-3 py-3 text-right ${tableHeaderCls}`}>
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {rows.map((row, rowIndex) => (
                  <tr
                    key={row.id}
                    className="align-top transition-colors hover:bg-[#f8fafc]"
                  >
                    <td className="border-b border-gray-100 px-3 py-2 text-xs tabular-nums text-gray-500">
                      {rowIndex + 1}
                    </td>

                    <td className="border-b border-gray-100 px-1 py-1.5">
                      <AutoTextarea
                        value={row.itemDescription}
                        onChange={(value) =>
                          updateRow(rowIndex, "itemDescription", value)
                        }
                        placeholder="Item description"
                      />
                    </td>

                    <td className="border-b border-gray-100 px-1 py-1.5">
                      <input
                        value={row.brandManufacturer}
                        onChange={(e) =>
                          updateRow(
                            rowIndex,
                            "brandManufacturer",
                            e.target.value,
                          )
                        }
                        className={inputCls}
                        placeholder="Brand / manufacturer"
                      />
                    </td>

                    <td className="border-b border-gray-100 px-1 py-1.5">
                      <input
                        value={row.categoryOfMaterial}
                        onChange={(e) =>
                          updateRow(
                            rowIndex,
                            "categoryOfMaterial",
                            e.target.value,
                          )
                        }
                        className={inputCls}
                        placeholder="Category"
                      />
                    </td>

                    <td className="border-b border-gray-100 px-1 py-1.5">
                      <input
                        value={row.shelfLifePeriod}
                        onChange={(e) =>
                          updateRow(rowIndex, "shelfLifePeriod", e.target.value)
                        }
                        className={inputCls}
                        placeholder="e.g. 12 Months"
                      />
                    </td>

                    <td className="border-b border-gray-100 px-1 py-1.5">
                      <input
                        value={row.unit}
                        onChange={(e) =>
                          updateRow(rowIndex, "unit", e.target.value)
                        }
                        className={inputCls}
                        placeholder="Unit"
                      />
                    </td>

                    <td className="border-b border-gray-100 px-1 py-1.5">
                      <input
                        value={row.quantity}
                        onChange={(e) =>
                          updateRow(rowIndex, "quantity", e.target.value)
                        }
                        className={inputCls}
                        placeholder="Quantity"
                      />
                    </td>

                    <td className="border-b border-gray-100 px-1 py-1.5">
                      <AutoTextarea
                        value={row.batchNumber}
                        onChange={(value) =>
                          updateRow(rowIndex, "batchNumber", value)
                        }
                        placeholder="Batch number"
                      />
                    </td>

                    <td className="border-b border-gray-100 px-1 py-1.5">
                      <input
                        type="date"
                        value={row.receivedDate}
                        onChange={(e) =>
                          updateRow(rowIndex, "receivedDate", e.target.value)
                        }
                        className={inputCls}
                      />
                    </td>

                    <td className="border-b border-gray-100 px-1 py-1.5">
                      <input
                        type="date"
                        value={row.manufacturedDate}
                        onChange={(e) =>
                          updateRow(
                            rowIndex,
                            "manufacturedDate",
                            e.target.value,
                          )
                        }
                        className={inputCls}
                      />
                    </td>

                    <td className="border-b border-gray-100 px-1 py-1.5">
                      <input
                        type="date"
                        value={row.expiryDate}
                        onChange={(e) =>
                          updateRow(rowIndex, "expiryDate", e.target.value)
                        }
                        className={inputCls}
                      />
                    </td>

                    <td className="border-b border-gray-100 px-1 py-1.5">
                      <input
                        value={row.daysLapse}
                        onChange={(e) =>
                          updateRow(rowIndex, "daysLapse", e.target.value)
                        }
                        className={`${inputCls} tabular-nums`}
                        placeholder="Days"
                      />
                    </td>

                    <td className="border-b border-gray-100 px-1 py-1.5">
                      <select
                        value={row.expiredValid}
                        onChange={(e) =>
                          updateRow(rowIndex, "expiredValid", e.target.value)
                        }
                        className={inputCls}
                      >
                        <option value="">Select</option>
                        <option value="VALID">VALID</option>
                        <option value="EXPIRED">EXPIRED</option>
                        <option value="NEAR EXPIRY">NEAR EXPIRY</option>
                        <option value="N/A">N/A</option>
                      </select>
                    </td>

                    <td className="border-b border-gray-100 px-1 py-1.5">
                      <AutoTextarea
                        value={row.remarks}
                        onChange={(value) =>
                          updateRow(rowIndex, "remarks", value)
                        }
                        placeholder="Remarks..."
                      />
                    </td>

                    <td className="border-b border-gray-100 px-2 py-1.5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => insertRowBelow(rowIndex)}
                          title="Insert row below"
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
                        >
                          <Plus className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => deleteRow(rowIndex)}
                          title="Delete row"
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="mt-4 text-xs text-gray-500">
          Tip: use <span className="font-medium">+</span> to insert a row below
          any entry, or use
          <span className="font-medium"> Add row</span> to append a row at the
          end.
        </p>
      </div>
    </div>
  );
}
