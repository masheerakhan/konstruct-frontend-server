import { useMemo, useState } from "react";
import {
  ClipboardList,
  Search,
  Filter,
  Eye,
  Plus,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import MIRForm from "./MIR";
import { formatDisplayDate } from "../../../../utils/dateFormatter";

const SAMPLE_MIR_ROWS = [
  {
    id: "mir-1",
    mir_no: "HIPPL-XXX-YYY-QUA-MIR-001",
    submission_date: "2024-07-26",
    inspection_date: "2024-07-26",
    delivery_date: "2024-06-04",
    material: "Reinforcement Steel",
    description: "16 mm, 12 mm",
    brand_make: "TataTiscon",
    supplier_name: "Vora & Son's",
    manufacturer: "TataTiscon",
    used_at: "Footing",
    storage_location: "Steel yard",
    invoice_dc_no: "DC. No. 188",
    mtc: "Yes",
    quantity: "31.87",
    unit: "MT",
    response_date: "2024-07-26",
    rejection_reason: "",
    status: "B",
    remarks: "MAS Approved on 17-08-2024",
  },
];

function formatDate(value) {
  return formatDisplayDate(value);
}

function getValue(row, keys, fallback = "") {
  for (const key of keys) {
    if (
      row?.[key] !== undefined &&
      row?.[key] !== null &&
      String(row[key]).trim() !== ""
    ) {
      return row[key];
    }
  }
  return fallback;
}

function normalizeMirRow(row, index) {
  const materialRows = Array.isArray(row?.materials) ? row.materials : [];
  const firstMaterial = materialRows[0] || {};

  return {
    id: row?.id || row?.uuid || `mir-${index}`,
    mirNo: getValue(
      row,
      ["mir_no", "mirNo", "mir_number", "mirNumber", "reference_no"],
      `MIR-${index + 1}`,
    ),
    submissionDate: getValue(row, [
      "submission_date",
      "submissionDate",
      "date_of_submission",
      "created_at",
    ]),
    inspectionDate: getValue(row, [
      "inspection_date",
      "inspectionDate",
      "date_of_inspection",
    ]),
    deliveryDate: getValue(row, [
      "delivery_date",
      "deliveryDate",
      "date_of_delivery",
    ]),
    material: getValue(
      row,
      ["material", "material_name", "materialName"],
      firstMaterial.material || firstMaterial.name || "-",
    ),
    description: getValue(
      row,
      ["description", "material_description", "materialDescription"],
      firstMaterial.description || "-",
    ),
    brandMake: getValue(
      row,
      ["brand_make", "brandMake", "make", "approved_make"],
      "-",
    ),
    supplierName: getValue(
      row,
      ["supplier_name", "supplierName", "supplier", "agent_name"],
      "-",
    ),
    manufacturer: getValue(
      row,
      ["manufacturer", "manufacturer_name", "manufacturerName"],
      "-",
    ),
    usedAt: getValue(row, ["used_at", "usedAt", "material_to_be_used_at"], "-"),
    storageLocation: getValue(
      row,
      ["storage_location", "storageLocation", "stored_at"],
      "-",
    ),
    invoiceDcNo: getValue(
      row,
      ["invoice_dc_no", "invoiceDcNo", "invoice_no", "delivery_note_no"],
      "-",
    ),
    mtc: getValue(row, ["mtc", "mtc_available", "mtc_yes_no"], "-"),
    quantity: getValue(row, ["quantity", "qty"], firstMaterial.quantity || ""),
    unit: getValue(row, ["unit"], firstMaterial.unit || ""),
    responseDate: getValue(row, [
      "response_date",
      "responseDate",
      "date_of_response",
    ]),
    rejectionReason: getValue(
      row,
      ["rejection_reason", "rejectionReason", "reason_for_rejection"],
      "",
    ),
    status: getValue(row, ["status", "current_status"], "Draft"),
    remarks: getValue(row, ["remarks", "remark"], "-"),
    raw: row,
  };
}

function statusClass(status) {
  const s = String(status || "").toLowerCase();

  if (["approved", "accepted", "b"].includes(s)) {
    return "bg-emerald-50 text-emerald-700 ring-emerald-100";
  }

  if (["rejected", "r"].includes(s)) {
    return "bg-rose-50 text-rose-700 ring-rose-100";
  }

  if (["pending", "draft", "submitted", "under review"].includes(s)) {
    return "bg-amber-50 text-amber-700 ring-amber-100";
  }

  return "bg-gray-50 text-gray-700 ring-gray-100";
}

export default function MIRRegister({
  rows = [],
  loading = false,
  onRefresh,
  onView,
  onFormOpenChange,
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedId, setExpandedId] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const sourceRows =
    Array.isArray(rows) && rows.length > 0 ? rows : SAMPLE_MIR_ROWS;
  const isSample = !Array.isArray(rows) || rows.length === 0;

  const normalizedRows = useMemo(
    () => sourceRows.map((row, index) => normalizeMirRow(row, index)),
    [sourceRows],
  );

  const statusOptions = useMemo(() => {
    const values = Array.from(
      new Set(
        normalizedRows
          .map((row) => String(row.status || "").trim())
          .filter(Boolean),
      ),
    );
    return ["all", ...values];
  }, [normalizedRows]);

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();

    return normalizedRows.filter((row) => {
      const matchesSearch =
        !q ||
        [
          row.mirNo,
          row.material,
          row.description,
          row.supplierName,
          row.manufacturer,
          row.invoiceDcNo,
          row.status,
          row.remarks,
        ]
          .join(" ")
          .toLowerCase()
          .includes(q);

      const matchesStatus =
        statusFilter === "all" ||
        String(row.status || "").toLowerCase() ===
          String(statusFilter).toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [normalizedRows, query, statusFilter]);

  if (showCreateForm) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => {
              setShowCreateForm(false);
              onFormOpenChange?.(false);
            }}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Back to MIR Register
          </button>
        </div>
        <MIRForm />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-700 ring-1 ring-sky-100">
              <ClipboardList className="h-3.5 w-3.5" />
              MIR Register
            </div>
            <h2 className="mt-3 text-xl font-semibold text-gray-900">
              Material Inspection Request Register
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Optimized list view for submitted MIR records. Open a row to view
              full material, reference, delivery and verification details.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setShowCreateForm(true);
              onFormOpenChange?.(true);
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Create MIR
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
          <div className="relative min-w-[280px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search MIR no, material, supplier, invoice..."
              className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 min-w-[180px] rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status === "all" ? "All status" : status}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[1250px] w-full text-sm">
            <thead>
              <tr className="bg-gray-50/80 text-left">
                <th className="px-4 py-3 font-semibold text-gray-600">Sr.</th>
                <th className="px-4 py-3 font-semibold text-gray-600">
                  MIR No.
                </th>
                <th className="px-4 py-3 font-semibold text-gray-600">
                  Submission
                </th>
                <th className="px-4 py-3 font-semibold text-gray-600">
                  Inspection
                </th>
                <th className="px-4 py-3 font-semibold text-gray-600">
                  Material / Equipment
                </th>
                <th className="px-4 py-3 font-semibold text-gray-600">
                  Qty / Unit
                </th>
                <th className="px-4 py-3 font-semibold text-gray-600">
                  Supplier / Manufacturer
                </th>
                <th className="px-4 py-3 font-semibold text-gray-600">
                  Invoice / DC
                </th>
                <th className="px-4 py-3 font-semibold text-gray-600">MTC</th>
                <th className="px-4 py-3 font-semibold text-gray-600">
                  Status
                </th>
                <th className="px-4 py-3 font-semibold text-gray-600">
                  Remarks
                </th>
                <th className="px-4 py-3 font-semibold text-gray-600 text-right">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={12}
                    className="px-4 py-10 text-center text-gray-400"
                  >
                    Loading MIR register...
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={12}
                    className="px-4 py-10 text-center text-gray-400"
                  >
                    No MIR records found.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row, index) => {
                  const expanded = expandedId === row.id;

                  return (
                    <>
                      <tr
                        key={row.id}
                        className="border-t border-gray-100 hover:bg-sky-50/30"
                      >
                        <td className="px-4 py-3 text-gray-500">{index + 1}</td>
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {row.mirNo}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {formatDate(row.submissionDate)}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {formatDate(row.inspectionDate)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">
                            {row.material}
                          </div>
                          <div
                            className="max-w-[240px] truncate text-xs text-gray-500"
                            title={row.description}
                          >
                            {row.description}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {[row.quantity, row.unit].filter(Boolean).join(" ") ||
                            "-"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-gray-800">
                            {row.supplierName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {row.manufacturer}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {row.invoiceDcNo}
                        </td>
                        <td className="px-4 py-3 text-gray-700">{row.mtc}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${statusClass(row.status)}`}
                          >
                            {row.status || "-"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div
                            className="max-w-[240px] truncate text-gray-700"
                            title={row.remarks}
                          >
                            {row.remarks || "-"}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedId(expanded ? null : row.id)
                              }
                              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                            >
                              {expanded ? (
                                <ChevronUp className="h-3.5 w-3.5" />
                              ) : (
                                <ChevronDown className="h-3.5 w-3.5" />
                              )}
                              Details
                            </button>

                            <button
                              type="button"
                              onClick={() => onView?.(row.raw)}
                              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/5"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              View
                            </button>
                          </div>
                        </td>
                      </tr>

                      {expanded && (
                        <tr
                          key={`${row.id}-details`}
                          className="border-t border-sky-100 bg-sky-50/30"
                        >
                          <td colSpan={12} className="px-5 py-4">
                            <div className="grid gap-3 text-sm md:grid-cols-3">
                              <div>
                                <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                  Delivery Date
                                </div>
                                <div className="mt-1 text-gray-800">
                                  {formatDate(row.deliveryDate)}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                  Used At
                                </div>
                                <div className="mt-1 text-gray-800">
                                  {row.usedAt}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                  Storage Location
                                </div>
                                <div className="mt-1 text-gray-800">
                                  {row.storageLocation}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                  Brand / Make
                                </div>
                                <div className="mt-1 text-gray-800">
                                  {row.brandMake}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                  Response Date
                                </div>
                                <div className="mt-1 text-gray-800">
                                  {formatDate(row.responseDate)}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                  Rejection Reason
                                </div>
                                <div className="mt-1 text-gray-800">
                                  {row.rejectionReason || "-"}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {isSample && (
          <div className="border-t border-amber-100 bg-amber-50 px-5 py-3 text-xs text-amber-700">
            Sample MIR register data is showing for layout only. Connect this
            component with listMIRs() to show real MIR records.
          </div>
        )}
      </div>
    </div>
  );
}
