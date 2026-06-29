import { useEffect, useMemo, useState } from "react";
import { ClipboardList, FileText, FolderOpen, Plus, X } from "lucide-react";
import { formatDisplayDate } from "../../../utils/dateFormatter";
import FileUploadControl from "../../FileUploadControl";
import DocTypeSelector from "../Transmittal/DocTypeSelector";
import DocumentTrackerSelectModal from "../Transmittal/DocumentTrackerSelectModal";
import { getTrackerDescription } from "../Transmittal/trackerDocumentData";
import { capitalCase } from "../Transmittal/stringCase";

import {
  createDefaultFormData,
  DEFAULT_TEST_REPORT_DOCUMENT_NO,
  TEST_REPORT_TYPE_OPTIONS,
  INHOUSE_TEST_REPORT_OPTIONS,
  getDescriptionLabelForDocumentType,
} from "../Transmittal/approvedVendors";

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

function createEmptyInHouseTestReportRow() {
  return {
    id: `inhouse-test-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    isManual: true,

    date_of_delivery: "",
    dc_invoice_no: "",
    material_tested: "",
    material_specification: "",
    manufacturer_supplier: "",
    parameters_tested: "",
    codal_ref: "",
    test_report_no: "",
    status: "",
    remarks: "",

    upload_file: null,
    upload_file_name: "",
  };
}

function serializeRowsForStorage(rows) {
  return rows.map((row) => {
    const { upload_file, ...rest } = row;

    return {
      ...rest,

      // Browser File object cannot be stored in localStorage.
      // Only file name is retained after refresh.
      upload_file: null,
      upload_file_name: row.upload_file_name || upload_file?.name || "",
    };
  });
}

function getUploadedFileForControl(row, uploadName) {
  if (row?.upload_file) return [row.upload_file];

  if (uploadName) {
    return [
      {
        name: uploadName,
      },
    ];
  }

  return [];
}

export default function InHouseTestReportRegister({
  folderId = "",
  folderName = "In-house Test Reports Register",
  documents = [],
}) {
  const storageKey = `in-house-test-report-register-${folderId || "default"}`;
  const transmittalStorageKey = `${storageKey}-transmittal-form`;

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
  const [selectedDocumentType, setSelectedDocumentType] =
    useState("Test Reports");
  const [documentTrackerModalOpen, setDocumentTrackerModalOpen] =
    useState(false);
  const [selectedTrackerDocument, setSelectedTrackerDocument] = useState(null);

  const [transmittalForm, setTransmittalForm] = useState(() => {
    try {
      const raw = localStorage.getItem(transmittalStorageKey);

      if (raw && raw !== "undefined" && raw !== "null") {
        const parsed = JSON.parse(raw);

        return {
          ...createDefaultFormData(),
          ...parsed,
          documentType: parsed.documentType || "Test Reports",
          materialRefNo:
            parsed.materialRefNo || DEFAULT_TEST_REPORT_DOCUMENT_NO,
          testReportType: parsed.testReportType || "Inhouse Test Report",
        };
      }
    } catch {
      // ignore parse error
    }

    return {
      ...createDefaultFormData(),
      documentType: "Test Reports",
      materialRefNo: DEFAULT_TEST_REPORT_DOCUMENT_NO,
      testReportType: "Inhouse Test Report",
      inhouseTestReportType: "",
    };
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

  const updateTransmittalForm = (patch) => {
    setTransmittalForm((prev) => ({
      ...prev,
      ...patch,
    }));
  };

  const handleDocTypeSelect = (type) => {
    updateTransmittalForm({
      documentType: type,
      materialRefNo:
        type === "Test Reports" ? DEFAULT_TEST_REPORT_DOCUMENT_NO : "",
      materialDescription: "",
      materialRemarks: "",
      areaOfApplication: "",
      testReportType: type === "Test Reports" ? "Inhouse Test Report" : "",
      inhouseTestReportType: "",
    });

    setSelectedTrackerDocument(null);
  };

  const actualRows = Array.isArray(documents) ? documents : [];

  const rows = useMemo(() => {
    return [...actualRows, ...manualRows];
  }, [actualRows, manualRows]);

  const handleAddRow = () => {
    setManualRows((prev) => [...prev, createEmptyInHouseTestReportRow()]);
  };

  const handleRowChange = (rowId, field, value) => {
    setManualRows((prev) =>
      prev.map((row) => (row.id === rowId ? { ...row, [field]: value } : row)),
    );
  };

  const handleSelectTrackerDocument = (trackerRow) => {
    const description = getTrackerDescription(trackerRow);

    setSelectedTrackerDocument(trackerRow);
    setDocumentTrackerModalOpen(false);

    updateTransmittalForm({
      materialDescription: description,
      trackerDocumentId: trackerRow.id || "",
      trackerSrNo: trackerRow.sr_no || trackerRow.srNo || "",
      trackerDocumentType:
        trackerRow.document_type ||
        trackerRow.documentType ||
        transmittalForm.documentType,
    });

    // Optional: also put tracker description into first empty table row
    setManualRows((prev) => {
      if (!prev.length) {
        return [
          {
            ...createEmptyInHouseTestReportRow(),
            material_tested: description,
          },
        ];
      }

      return prev.map((row, index) =>
        index === 0
          ? {
              ...row,
              material_tested: row.material_tested || description,
            }
          : row,
      );
    });
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
              In-house Test Reports Register
            </div>

            <h2 className="mt-3 text-xl font-semibold text-gray-900">
              {folderName}
            </h2>

            <p className="mt-1 text-sm text-gray-600">
              Track in-house test report details with delivery date, tested
              material, specification, supplier, status, remarks and uploaded
              test report.
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

      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              {capitalCase("transmittal document information")}
            </h3>
            <p className="text-xs text-gray-500">
              Select tracker document and enter transmittal details before
              maintaining the test report register.
            </p>
          </div>

          <div className="rounded-lg bg-orange-50 px-3 py-2 text-right">
            <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
              {capitalCase("document")} / TR No.
            </div>
            <div className="mt-1 font-mono text-xs font-semibold text-primary">
              {transmittalForm.materialRefNo || "—"}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 xl:flex-row xl:items-end">
          {/* Select from tracker */}
          <div className="shrink-0">
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-gray-500">
              {capitalCase("select document from")}
            </label>

            <button
              type="button"
              onClick={() => setDocumentTrackerModalOpen(true)}
              disabled={!transmittalForm.documentType}
              className="inline-flex h-9 items-center gap-2 rounded-sm border border-orange-200 bg-orange-50 px-3 text-xs font-semibold text-primary hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ClipboardList className="h-3.5 w-3.5" />
              {capitalCase("All Document Tracker")}
            </button>
          </div>

          {/* Document type */}
          <div className="min-w-0 w-full xl:w-[360px]">
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-gray-500">
              {capitalCase("select document type")}
            </label>

            <DocTypeSelector
              selected={transmittalForm.documentType}
              onSelect={handleDocTypeSelect}
              showTitle={false}
            />
          </div>

          {/* Test report type */}
          <div className="min-w-0 w-full xl:w-[260px]">
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-gray-500">
              {capitalCase("test report type")}
            </label>

            <select
              value={transmittalForm.testReportType}
              onChange={(e) =>
                updateTransmittalForm({
                  testReportType: e.target.value,
                  inhouseTestReportType: "",
                })
              }
              className="h-9 w-full rounded-sm border border-gray-200 bg-white px-3 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">{capitalCase("select test report type")}</option>

              {TEST_REPORT_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Inhouse test type */}
          {transmittalForm.testReportType === "Inhouse Test Report" && (
            <div className="min-w-0 w-full xl:w-[280px]">
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-gray-500">
                {capitalCase("inhouse test type")}
              </label>

              <select
                value={transmittalForm.inhouseTestReportType}
                onChange={(e) =>
                  updateTransmittalForm({
                    inhouseTestReportType: e.target.value,
                  })
                }
                className="h-9 w-full rounded-sm border border-gray-200 bg-white px-3 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">
                  {capitalCase("select inhouse test type")}
                </option>

                {INHOUSE_TEST_REPORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {selectedTrackerDocument && (
          <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] text-emerald-700">
            {capitalCase("selected from tracker")}:{" "}
            <span className="font-semibold">
              {getTrackerDescription(selectedTrackerDocument)}
            </span>
          </div>
        )}

        <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Area of Application */}
          <div className="min-w-0">
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-gray-500">
              {capitalCase("area of application")}
            </label>

            <input
              type="text"
              value={transmittalForm.areaOfApplication}
              onChange={(e) =>
                updateTransmittalForm({ areaOfApplication: e.target.value })
              }
              placeholder="Enter area of application"
              className="h-9 w-full rounded-sm border border-gray-200 bg-white px-3 py-1 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Description */}
          <div className="min-w-0">
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-gray-500">
              {capitalCase(
                getDescriptionLabelForDocumentType(
                  transmittalForm.documentType,
                ),
              )}
            </label>

            <textarea
              value={transmittalForm.materialDescription}
              onChange={(e) =>
                updateTransmittalForm({ materialDescription: e.target.value })
              }
              placeholder="Enter description for submittal details"
              rows={2}
              className="min-h-[38px] w-full resize-y rounded-sm border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Remarks */}
          <div className="min-w-0">
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-gray-500">
              {capitalCase("remarks")}
            </label>

            <textarea
              value={transmittalForm.materialRemarks}
              onChange={(e) =>
                updateTransmittalForm({ materialRemarks: e.target.value })
              }
              placeholder="Enter remarks"
              rows={2}
              className="min-h-[38px] w-full resize-y rounded-sm border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
            <FolderOpen className="h-4 w-4 text-primary" />
            <span>In-house Test Reports Register</span>
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
            <div className="rounded-full bg-orange-50 p-3 text-primary">
              <FileText className="h-6 w-6" />
            </div>

            <h3 className="mt-4 text-base font-semibold text-gray-900">
              No in-house test report rows found
            </h3>

            <p className="mt-1 max-w-md text-sm text-gray-500">
              Click Add Row to start maintaining the In-house Test Reports
              Register.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[1900px] w-full text-sm">
              <thead>
                <tr className="bg-gray-50/80 text-left">
                  <th className="px-3 py-3 font-semibold text-gray-800 text-center min-w-[80px]">
                    SI. No.
                  </th>

                  <th className="px-3 py-3 font-semibold text-gray-800 min-w-[160px]">
                    Date of Delivery
                  </th>

                  <th className="px-3 py-3 font-semibold text-gray-800 min-w-[180px]">
                    DC/Invoice No.
                  </th>

                  <th className="px-3 py-3 font-semibold text-gray-800 min-w-[220px]">
                    Material Tested
                  </th>

                  <th className="px-3 py-3 font-semibold text-gray-800 min-w-[220px]">
                    Material Specification
                  </th>

                  <th className="px-3 py-3 font-semibold text-gray-800 min-w-[220px]">
                    Manufacturer/Supplier
                  </th>

                  <th className="px-3 py-3 font-semibold text-gray-800 min-w-[220px]">
                    Parameters Tested
                  </th>

                  <th className="px-3 py-3 font-semibold text-gray-800 min-w-[180px]">
                    Codal Ref.
                  </th>

                  <th className="px-3 py-3 font-semibold text-gray-800 min-w-[180px]">
                    Test Report No.
                  </th>

                  <th className="px-3 py-3 font-semibold text-gray-800 min-w-[140px]">
                    Status
                  </th>

                  <th className="px-3 py-3 font-semibold text-gray-800 min-w-[260px]">
                    Remarks
                  </th>

                  <th className="px-3 py-3 font-semibold text-gray-800 text-center min-w-[260px]">
                    Upload Test Report
                  </th>

                  <th className="px-3 py-3 font-semibold text-gray-800 text-center min-w-[90px]">
                    Action
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
                    "name",
                  );

                  return (
                    <tr
                      key={row.id || `in-house-test-row-${index}`}
                      className="border-t border-gray-100 odd:bg-white even:bg-slate-50 hover:bg-orange-50/30"
                    >
                      <td className="px-3 py-3 text-center text-gray-700">
                        {index + 1}
                      </td>

                      {/* Date of Delivery */}
                      <td className="px-3 py-3 text-gray-700">
                        {row.isManual ? (
                          <input
                            type="date"
                            value={row.date_of_delivery || ""}
                            onChange={(e) =>
                              handleRowChange(
                                row.id,
                                "date_of_delivery",
                                e.target.value,
                              )
                            }
                            className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
                          />
                        ) : (
                          formatDate(
                            getValue(
                              row,
                              "date_of_delivery",
                              "dateOfDelivery",
                              "delivery_date",
                              "deliveryDate",
                              "report_date",
                              "date",
                              "created_at",
                              "createdAt",
                            ),
                          )
                        )}
                      </td>

                      {/* DC/Invoice No. */}
                      <td className="px-3 py-3 text-gray-700">
                        {row.isManual ? (
                          <input
                            type="text"
                            value={row.dc_invoice_no || ""}
                            onChange={(e) =>
                              handleRowChange(
                                row.id,
                                "dc_invoice_no",
                                e.target.value,
                              )
                            }
                            placeholder="DC / Invoice No."
                            className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
                          />
                        ) : (
                          getValue(
                            row,
                            "dc_invoice_no",
                            "dcInvoiceNo",
                            "challan_invoice_no",
                            "challanInvoiceNo",
                            "invoice_no",
                            "invoiceNo",
                          ) || "-"
                        )}
                      </td>

                      {/* Material Tested */}
                      <td className="px-3 py-3 text-gray-800">
                        {row.isManual ? (
                          <input
                            type="text"
                            value={row.material_tested || ""}
                            onChange={(e) =>
                              handleRowChange(
                                row.id,
                                "material_tested",
                                e.target.value,
                              )
                            }
                            placeholder="Material tested"
                            className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
                          />
                        ) : (
                          getValue(
                            row,
                            "material_tested",
                            "materialTested",
                            "material_description",
                            "materialDescription",
                            "description",
                            "name",
                          ) || "-"
                        )}
                      </td>

                      {/* Material Specification */}
                      <td className="px-3 py-3 text-gray-700">
                        {row.isManual ? (
                          <input
                            type="text"
                            value={row.material_specification || ""}
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

                      {/* Manufacturer/Supplier */}
                      <td className="px-3 py-3 text-gray-700">
                        {row.isManual ? (
                          <input
                            type="text"
                            value={row.manufacturer_supplier || ""}
                            onChange={(e) =>
                              handleRowChange(
                                row.id,
                                "manufacturer_supplier",
                                e.target.value,
                              )
                            }
                            placeholder="Manufacturer / Supplier"
                            className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
                          />
                        ) : (
                          getValue(
                            row,
                            "manufacturer_supplier",
                            "manufacturerSupplier",
                            "supplier_name",
                            "supplierName",
                          ) || "-"
                        )}
                      </td>

                      {/* Parameters Tested */}
                      <td className="px-3 py-3 text-gray-700">
                        {row.isManual ? (
                          <input
                            type="text"
                            value={row.parameters_tested || ""}
                            onChange={(e) =>
                              handleRowChange(
                                row.id,
                                "parameters_tested",
                                e.target.value,
                              )
                            }
                            placeholder="Parameters tested"
                            className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
                          />
                        ) : (
                          getValue(
                            row,
                            "parameters_tested",
                            "parametersTested",
                          ) || "-"
                        )}
                      </td>

                      {/* Codal Ref. */}
                      <td className="px-3 py-3 text-gray-700">
                        {row.isManual ? (
                          <input
                            type="text"
                            value={row.codal_ref || ""}
                            onChange={(e) =>
                              handleRowChange(
                                row.id,
                                "codal_ref",
                                e.target.value,
                              )
                            }
                            placeholder="Codal ref."
                            className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
                          />
                        ) : (
                          getValue(row, "codal_ref", "codalRef") || "-"
                        )}
                      </td>

                      {/* Test Report No. */}
                      <td className="px-3 py-3 text-gray-700">
                        {row.isManual ? (
                          <input
                            type="text"
                            value={row.test_report_no || ""}
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

                      {/* Status */}
                      <td className="px-3 py-3 text-gray-700">
                        {row.isManual ? (
                          <select
                            value={row.status || ""}
                            onChange={(e) =>
                              handleRowChange(row.id, "status", e.target.value)
                            }
                            className="w-full rounded-md border border-gray-200 bg-white px-2 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
                          >
                            <option value="">Select</option>
                            <option value="Pass">Pass</option>
                            <option value="Fail">Fail</option>
                          </select>
                        ) : (
                          getValue(row, "status", "pass_fail", "passFail") ||
                          "-"
                        )}
                      </td>

                      {/* Remarks */}
                      <td className="px-3 py-3 text-gray-700">
                        {row.isManual ? (
                          <textarea
                            value={row.remarks || ""}
                            onChange={(e) =>
                              handleRowChange(row.id, "remarks", e.target.value)
                            }
                            placeholder="Remarks"
                            rows={2}
                            className="min-h-[38px] w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
                          />
                        ) : (
                          getValue(row, "remarks", "remark") || "-"
                        )}
                      </td>

                      {/* Upload Test Report */}
                      <td className="px-3 py-3 text-center align-middle">
                        {row.isManual ? (
                          <FileUploadControl
                            files={getUploadedFileForControl(row, uploadName)}
                            multiple={false}
                            append={false}
                            align="center"
                            showFileName
                            compact
                            uploadLabel="Upload"
                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                            onFilesChange={(nextFiles) => {
                              const file = Array.isArray(nextFiles)
                                ? nextFiles[0]
                                : nextFiles;

                              if (file) {
                                handleFileUpload(row.id, file);
                              } else {
                                handleFileRemove(row.id);
                              }
                            }}
                            onDelete={() => handleFileRemove(row.id)}
                          />
                        ) : (
                          uploadName || "-"
                        )}
                      </td>

                      {/* Action */}
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

      <DocumentTrackerSelectModal
        open={documentTrackerModalOpen}
        documentType={selectedDocumentType}
        onClose={() => setDocumentTrackerModalOpen(false)}
        onSelect={handleSelectTrackerDocument}
      />
    </div>
  );
}
