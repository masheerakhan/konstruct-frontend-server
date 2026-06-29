import { useEffect, useMemo, useRef, useState } from "react";
import {
  ClipboardList,
  FileText,
  FolderOpen,
  Plus,
  X,
  Upload,
  FileCheck,
} from "lucide-react";
import { formatDisplayDate } from "../../../utils/dateFormatter";

function formatDate(value) {
  return formatDisplayDate(value);
}

function getValue(row, ...keys) {
  for (const key of keys) {
    if (row?.[key] !== null && row?.[key] !== undefined && row?.[key] !== "") {
      return row[key];
    }
  }
  return "";
}

function createEmptyThirdPartyTestReportRow() {
  return {
    id: `third-party-test-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 9)}`,
    isManual: true,

    report_date: "",
    material_description: "",
    material_specification: "",
    supplier_name: "",
    challan_invoice_no: "",
    lot_heat_no: "",
    mtc_test_certificate_no: "",
    challan_qty_mt: "",
    vehicle_no: "",

    sample_sent_on: "",
    sample_tested_on: "",
    test_report_no: "",
    pass_fail: "",
    upload_file: null,
    upload_file_name: "",
    remarks: "",
  };
}

function serializeRowsForStorage(rows) {
  return rows.map((row) => {
    const { upload_file, ...rest } = row;

    return {
      ...rest,
      upload_file: null,
      upload_file_name: row.upload_file_name || upload_file?.name || "",
    };
  });
}

export default function ThirdPartyTestReportRegister({
  folderId = "",
  folderName = "Third Party Test Reports Register",
  documents = [],
}) {
  const storageKey = `third-party-test-report-register-${folderId || "default"}`;
  const fileInputRefs = useRef({});

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
      localStorage.setItem(
        storageKey,
        JSON.stringify(serializeRowsForStorage(manualRows)),
      );
    } catch {
      // ignore localStorage error
    }
  }, [manualRows, storageKey]);

  const actualRows = Array.isArray(documents) ? documents : [];

  const rows = useMemo(() => {
    return [...actualRows, ...manualRows];
  }, [actualRows, manualRows]);

  const handleAddRow = () => {
    setManualRows((prev) => [...prev, createEmptyThirdPartyTestReportRow()]);
  };

  const handleRowChange = (rowId, field, value) => {
    setManualRows((prev) =>
      prev.map((row) => (row.id === rowId ? { ...row, [field]: value } : row)),
    );
  };

  const handleFileUpload = (rowId, file) => {
    if (!file) return;

    setManualRows((prev) =>
      prev.map((row) =>
        row.id === rowId
          ? {
              ...row,
              upload_file: file,
              upload_file_name: file.name,
            }
          : row,
      ),
    );
  };

  const handleFileRemove = (rowId) => {
    setManualRows((prev) =>
      prev.map((row) =>
        row.id === rowId
          ? {
              ...row,
              upload_file: null,
              upload_file_name: "",
            }
          : row,
      ),
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
              Third Party Test Reports Register
            </div>

            <h2 className="mt-3 text-xl font-semibold text-gray-900">
              {folderName}
            </h2>

            <p className="mt-1 text-sm text-gray-600">
              Track third party test reports with supplier, challan, lot/heat,
              MTC certificate, vehicle and test report details.
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
            <span>Third Party Test Reports Register</span>
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
            <div className="rounded-full bg-orange-50 p-3 text-primary">
              <FileText className="h-6 w-6" />
            </div>

            <h3 className="mt-4 text-base font-semibold text-gray-900">
              No third party test report rows found
            </h3>

            <p className="mt-1 max-w-md text-sm text-gray-500">
              Click Add Row to start maintaining the Third Party Test Reports
              Register.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[2300px] w-full text-sm">
              <thead>
                <tr className="bg-gray-50/80 text-left">
                  <th
                    rowSpan={2}
                    className="px-3 py-3 font-semibold text-gray-800 text-center min-w-[80px]"
                  >
                    SR. NO.
                  </th>

                  <th
                    rowSpan={2}
                    className="px-3 py-3 font-semibold text-gray-800 min-w-[150px]"
                  >
                    DATE
                  </th>

                  <th
                    rowSpan={2}
                    className="px-3 py-3 font-semibold text-gray-800 min-w-[230px]"
                  >
                    Material Description
                  </th>

                  <th
                    rowSpan={2}
                    className="px-3 py-3 font-semibold text-gray-800 min-w-[220px]"
                  >
                    Material Specification
                  </th>

                  <th
                    rowSpan={2}
                    className="px-3 py-3 font-semibold text-gray-800 min-w-[190px]"
                  >
                    Supplier Name
                  </th>

                  <th
                    rowSpan={2}
                    className="px-3 py-3 font-semibold text-gray-800 min-w-[220px]"
                  >
                    Challan no. / Invoice No.
                  </th>

                  <th
                    rowSpan={2}
                    className="px-3 py-3 font-semibold text-gray-800 min-w-[170px]"
                  >
                    Lot / Heat No.
                  </th>

                  <th
                    rowSpan={2}
                    className="px-3 py-3 font-semibold text-gray-800 min-w-[210px]"
                  >
                    MTC Test certificate no.
                  </th>

                  <th
                    rowSpan={2}
                    className="px-3 py-3 font-semibold text-gray-800 min-w-[160px]"
                  >
                    Challan Qty (MT)
                  </th>

                  <th
                    rowSpan={2}
                    className="px-3 py-3 font-semibold text-gray-800 min-w-[160px]"
                  >
                    Vehicle no.
                  </th>

                  <th
                    colSpan={6}
                    className="border-l border-gray-200 px-3 py-3 text-center font-semibold text-gray-800"
                  >
                    3 Party Tests
                  </th>

                  <th
                    rowSpan={2}
                    className="px-3 py-3 font-semibold text-gray-800 text-center min-w-[90px]"
                  >
                    Action
                  </th>
                </tr>

                <tr className="bg-gray-50/80 text-left border-t border-gray-200">
                  <th className="border-l border-gray-200 px-3 py-3 font-semibold text-gray-800 min-w-[160px]">
                    Sample Sent on
                  </th>

                  <th className="px-3 py-3 font-semibold text-gray-800 min-w-[160px]">
                    Sample Tested on
                  </th>

                  <th className="px-3 py-3 font-semibold text-gray-800 min-w-[170px]">
                    Test Report No.
                  </th>

                  <th className="px-3 py-3 font-semibold text-gray-800 min-w-[130px]">
                    Pass / Fail
                  </th>

                  <th className="px-3 py-3 font-semibold text-gray-800 text-center min-w-[180px]">
                    Upload
                  </th>

                  <th className="px-3 py-3 font-semibold text-gray-800 min-w-[220px]">
                    Remarks
                  </th>
                </tr>
              </thead>

              <tbody>
                {rows.map((row, index) => {
                  const uploadName = getValue(
                    row,
                    "upload_file_name",
                    "uploadFileName",
                    "file_name",
                    "fileName",
                  );

                  return (
                    <tr
                      key={row.id || `third-party-test-row-${index}`}
                      className="border-t border-gray-100 odd:bg-white even:bg-slate-50 hover:bg-orange-50/30"
                    >
                      <td className="px-3 py-3 text-center text-gray-700">
                        {index + 1}
                      </td>

                      <td className="px-3 py-3 text-gray-700">
                        {row.isManual ? (
                          <input
                            type="date"
                            value={row.report_date}
                            onChange={(e) =>
                              handleRowChange(
                                row.id,
                                "report_date",
                                e.target.value,
                              )
                            }
                            className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
                          />
                        ) : (
                          formatDate(
                            getValue(
                              row,
                              "report_date",
                              "date",
                              "created_at",
                              "createdAt",
                            ),
                          )
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
                            "name",
                          ) || "-"
                        )}
                      </td>

                      <td className="px-3 py-3 text-gray-700">
                        {row.isManual ? (
                          <input
                            type="text"
                            value={row.material_specification}
                            onChange={(e) =>
                              handleRowChange(
                                row.id,
                                "material_specification",
                                e.target.value,
                              )
                            }
                            placeholder="Material specification"
                            className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
                          />
                        ) : (
                          getValue(
                            row,
                            "material_specification",
                            "materialSpecification",
                          ) || "-"
                        )}
                      </td>

                      <td className="px-3 py-3 text-gray-700">
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
                          getValue(row, "supplier_name", "supplierName") || "-"
                        )}
                      </td>

                      <td className="px-3 py-3 text-gray-700">
                        {row.isManual ? (
                          <input
                            type="text"
                            value={row.challan_invoice_no}
                            onChange={(e) =>
                              handleRowChange(
                                row.id,
                                "challan_invoice_no",
                                e.target.value,
                              )
                            }
                            placeholder="Challan / Invoice No."
                            className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
                          />
                        ) : (
                          getValue(
                            row,
                            "challan_invoice_no",
                            "challanInvoiceNo",
                            "invoice_no",
                            "invoiceNo",
                          ) || "-"
                        )}
                      </td>

                      <td className="px-3 py-3 text-gray-700">
                        {row.isManual ? (
                          <input
                            type="text"
                            value={row.lot_heat_no}
                            onChange={(e) =>
                              handleRowChange(
                                row.id,
                                "lot_heat_no",
                                e.target.value,
                              )
                            }
                            placeholder="Lot / Heat No."
                            className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
                          />
                        ) : (
                          getValue(row, "lot_heat_no", "lotHeatNo") || "-"
                        )}
                      </td>

                      <td className="px-3 py-3 text-gray-700">
                        {row.isManual ? (
                          <input
                            type="text"
                            value={row.mtc_test_certificate_no}
                            onChange={(e) =>
                              handleRowChange(
                                row.id,
                                "mtc_test_certificate_no",
                                e.target.value,
                              )
                            }
                            placeholder="MTC certificate no."
                            className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
                          />
                        ) : (
                          getValue(
                            row,
                            "mtc_test_certificate_no",
                            "mtcTestCertificateNo",
                          ) || "-"
                        )}
                      </td>

                      <td className="px-3 py-3 text-gray-700">
                        {row.isManual ? (
                          <input
                            type="number"
                            min="0"
                            step="0.001"
                            value={row.challan_qty_mt}
                            onChange={(e) =>
                              handleRowChange(
                                row.id,
                                "challan_qty_mt",
                                e.target.value,
                              )
                            }
                            placeholder="0"
                            className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
                          />
                        ) : (
                          getValue(row, "challan_qty_mt", "challanQtyMt") || "-"
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
                            placeholder="Vehicle no."
                            className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
                          />
                        ) : (
                          getValue(row, "vehicle_no", "vehicleNo") || "-"
                        )}
                      </td>

                      <td className="border-l border-gray-200 px-3 py-3 text-gray-700">
                        {row.isManual ? (
                          <input
                            type="date"
                            value={row.sample_sent_on}
                            onChange={(e) =>
                              handleRowChange(
                                row.id,
                                "sample_sent_on",
                                e.target.value,
                              )
                            }
                            className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
                          />
                        ) : (
                          formatDate(
                            getValue(row, "sample_sent_on", "sampleSentOn"),
                          )
                        )}
                      </td>

                      <td className="px-3 py-3 text-gray-700">
                        {row.isManual ? (
                          <input
                            type="date"
                            value={row.sample_tested_on}
                            onChange={(e) =>
                              handleRowChange(
                                row.id,
                                "sample_tested_on",
                                e.target.value,
                              )
                            }
                            className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
                          />
                        ) : (
                          formatDate(
                            getValue(row, "sample_tested_on", "sampleTestedOn"),
                          )
                        )}
                      </td>

                      <td className="px-3 py-3 text-gray-700">
                        {row.isManual ? (
                          <input
                            type="text"
                            value={row.test_report_no}
                            onChange={(e) =>
                              handleRowChange(
                                row.id,
                                "test_report_no",
                                e.target.value,
                              )
                            }
                            placeholder="Test report no."
                            className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
                          />
                        ) : (
                          getValue(row, "test_report_no", "testReportNo") || "-"
                        )}
                      </td>

                      <td className="px-3 py-3 text-gray-700">
                        {row.isManual ? (
                          <select
                            value={row.pass_fail}
                            onChange={(e) =>
                              handleRowChange(
                                row.id,
                                "pass_fail",
                                e.target.value,
                              )
                            }
                            className="w-full rounded-md border border-gray-200 bg-white px-2 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
                          >
                            <option value="">Select</option>
                            <option value="Pass">Pass</option>
                            <option value="Fail">Fail</option>
                          </select>
                        ) : (
                          getValue(row, "pass_fail", "passFail") || "-"
                        )}
                      </td>

                      <td className="px-3 py-3 text-center align-middle">
                        {row.isManual ? (
                          <div className="flex flex-col items-center gap-1.5">
                            {uploadName ? (
                              <div className="flex w-full max-w-[160px] items-center justify-between gap-1 rounded border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] text-emerald-700">
                                <span className="truncate" title={uploadName}>
                                  {uploadName}
                                </span>

                                <button
                                  type="button"
                                  onClick={() => handleFileRemove(row.id)}
                                  className="rounded p-0.5 text-gray-500 hover:bg-rose-50 hover:text-rose-600"
                                  title="Remove file"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ) : null}

                            <button
                              type="button"
                              onClick={() =>
                                fileInputRefs.current[row.id]?.click()
                              }
                              className={`inline-flex w-full max-w-[160px] items-center justify-center gap-1 rounded-md border px-2 py-1.5 text-[11px] font-semibold ${
                                uploadName
                                  ? "border-emerald-500/40 bg-emerald-50 text-emerald-700 hover:bg-emerald-100/50"
                                  : "border-primary/30 bg-orange-50 text-primary hover:bg-orange-100/50"
                              }`}
                            >
                              {uploadName ? (
                                <>
                                  <FileCheck className="h-3.5 w-3.5" />
                                  Add File
                                </>
                              ) : (
                                <>
                                  <Upload className="h-3.5 w-3.5" />
                                  Upload
                                </>
                              )}
                            </button>

                            <input
                              type="file"
                              className="hidden"
                              ref={(el) => {
                                fileInputRefs.current[row.id] = el;
                              }}
                              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleFileUpload(row.id, file);
                                e.target.value = "";
                              }}
                            />
                          </div>
                        ) : (
                          uploadName || "-"
                        )}
                      </td>

                      <td className="px-3 py-3 text-gray-700">
                        {row.isManual ? (
                          <input
                            type="text"
                            value={row.remarks}
                            onChange={(e) =>
                              handleRowChange(row.id, "remarks", e.target.value)
                            }
                            placeholder="Remarks"
                            className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
                          />
                        ) : (
                          getValue(row, "remarks", "remark") || "-"
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
                  );
                })}
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
