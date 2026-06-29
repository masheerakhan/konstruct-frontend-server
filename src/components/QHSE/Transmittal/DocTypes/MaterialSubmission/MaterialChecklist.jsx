import { useRef, Fragment } from "react";
import {
  checklistItems,
  checklistItem3Options,
  alternativeProposalReasons,
  approvedVendorList,
  getChecklistFilesList,
  getFullSystemRowComplianceTables,
} from "../../approvedVendors";
import ComplianceStatement from "./ComplianceStatement";
import { Upload, Plus, Trash2, FileCheck, X } from "lucide-react";
import Select from "react-select";
import { capitalCase, capitalCaseLabel } from "../../stringCase";

const makeStatusOptions = [
  { value: "approved", label: "Approved Make" },
  { value: "alternative", label: "Alternative Proposal" },
  { value: "non_tender", label: "Non Tender Item" },
];

const ALTERNATIVE_PROPOSAL_REMARK_TEXT =
  "Written Communication for reason or refusal from Approved Vendor for Justification should be attached.";

const selectSmall =
  "h-8 text-xs rounded-md max-w-[220px] w-full border border-gray-200 bg-white px-2 focus:outline-none focus:ring-2 focus:ring-primary";

export default function MaterialChecklist({
  materialType,
  materialRefNo,
  materialDescription,
  manufacturer,
  product,
  brand,
  makeStatus,
  checklistRemarks,
  checklistFiles,
  checklistAlternativeReasons,
  checklistItem3Option,
  checklistItem3SectionClass,
  onMakeStatusChange,
  onProductChange,
  onBrandChange,
  onChecklistRemarkChange,
  onAlternativeReasonChange,
  onChecklistItem3OptionChange,
  onChecklistItem3SectionClassChange,
  onFileUpload,
  onChecklistFileRemove,
  fullSystemChecklist,
  onFullSystemRowFieldChange,
  onFullSystemRowFileUpload,
  onAddFullSystemRow,
  onDeleteFullSystemRow,
  onFullSystemAddCompliance,
  onFullSystemRowComplianceChange,
}) {
  const fileInputRefs = useRef({});
  const fullSystemFileRefs = useRef({});

  const approvedRow2Remark = `${product || ""}${product && brand ? " - " : ""}${brand || ""}`.trim();

  const annexureMap = {};
  let annexureCounter = 0;

  checklistItems.forEach((item) => {
    const files = getChecklistFilesList(checklistFiles[item.slNo]);
    if (files.length === 0) return;

    annexureCounter++;
    annexureMap[item.slNo] = annexureCounter;
  });

  const fullSystemDocCols = [
    {
      key: "technicalData",
      header: "TDS Catalogue",
    },
    {
      key: "manufacturerTest",
      header: "MTC / Third Party Test Certificate",
    },
    {
      key: "complianceStatement",
      header: "Compliance Statement",
    },
  ];

  const fsAnnexKey = (rowId, key) => `${rowId}:${key}`;

  if (materialType === "full_system") {
    // Deduplicate & normalize vendor/brand names (approvedVendors.js can repeat across products).
    const allBrands = Array.from(new Set(approvedVendorList.flatMap((x) => x.vendors || [])))
      .map((b) => String(b).trim())
      .filter(Boolean)
      .sort((a, b) => String(a).localeCompare(String(b)));
    const brandOptions = allBrands.map((b) => ({ value: b, label: b }));
    const rows = fullSystemChecklist?.rows || [];

    return (
      <div className="space-y-6">
        <h2 className="text-[12px] uppercase tracking-wider font-bold text-gray-500">
          {capitalCase("full system with all accessories")}
        </h2>
        <p className="text-[11px] text-gray-500 -mt-4 sm:hidden">
          {capitalCase("scroll horizontally on small screens")}
        </p>
        <div className="rounded-sm border border-gray-200 overflow-x-auto overscroll-x-contain -mx-1 px-1 sm:mx-0 sm:px-0">
          <table className="min-w-[1320px] w-max text-sm border-collapse border border-gray-300 bg-white">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-300 text-left text-[10px] uppercase tracking-wider font-bold text-gray-600 px-2 py-2 w-10">
                  {capitalCase("sr")}
                </th>
                {/* <th className="border border-gray-300 text-left text-[10px] uppercase tracking-wider font-bold text-gray-600 px-2 py-2 min-w-[200px]">
                  {capitalCase("mas no")} ({capitalCase("auto")})
                </th>
                <th className="border border-gray-300 text-left text-[10px] uppercase tracking-wider font-bold text-gray-600 px-2 py-2 min-w-[100px]">
                  BOQ No.
                </th> */}
                <th className="border border-gray-300 text-left text-[10px] uppercase tracking-wider font-bold text-gray-600 px-2 py-2 min-w-[160px]">
                  {capitalCase("material description")}
                </th>
                <th className="border border-gray-300 text-left text-[10px] uppercase tracking-wider font-bold text-gray-600 px-2 py-2 min-w-[160px]">
                  {capitalCase("material specification")}
                </th>
                <th className="border border-gray-300 text-left text-[10px] uppercase tracking-wider font-bold text-gray-600 px-2 py-2 min-w-[140px]">
                  {capitalCase("approved make")}
                </th>
                <th className="border border-gray-300 text-left text-[10px] uppercase tracking-wider font-bold text-gray-600 px-2 py-2 min-w-[120px]">
                  {capitalCase("proposed make")}
                </th>
                {fullSystemDocCols.map((col) => (
                  <th
                    key={col.key}
                    className="border border-gray-300 text-left text-[10px] uppercase tracking-wider font-bold text-gray-600 px-2 py-2 min-w-[150px] max-w-[200px] leading-tight"
                  >
                    {col.header.includes(" / ")
                      ? col.header
                        .split(" / ")
                        .map((part) => capitalCase(part))
                        .join(" / ")
                      : capitalCase(col.header)}
                  </th>
                ))}
                <th className="border border-gray-300 text-left text-[10px] uppercase tracking-wider font-bold text-gray-600 px-2 py-2 min-w-[140px]">
                  {capitalCase("remark")}
                </th>
                <th className="border border-gray-300 text-center text-[10px] uppercase tracking-wider font-bold text-gray-600 px-2 py-2 min-w-[88px]">
                  {capitalCase("action")}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <Fragment key={row.id}>
                  <tr className="align-top">
                    <td className="border border-gray-300 px-2 py-2 text-center text-gray-600 tabular-nums">{idx + 1}</td>
                    {/* <td className="border border-gray-300 px-2 py-2 text-xs font-mono text-primary whitespace-nowrap">
                      {materialRefNo || "—"}
                    </td>
                    <td className="border border-gray-300 px-2 py-2">
                      <input
                        value={row.boq || ""}
                        onChange={(e) => onFullSystemRowFieldChange(row.id, "boq", e.target.value)}
                        className="h-8 w-full min-w-[88px] text-xs rounded-md border border-gray-200 bg-white px-2"
                        placeholder={capitalCase("boq")}
                      />
                    </td> */}
                    <td className="border border-gray-300 px-2 py-2">
                      <textarea
                        value={row.materialDescription || ""}
                        onChange={(e) => onFullSystemRowFieldChange(row.id, "materialDescription", e.target.value)}
                        className="min-h-[64px] w-full text-xs rounded-md border border-gray-200 bg-white resize-y px-2 py-1"
                        placeholder={capitalCase("material description")}
                        rows={2}
                      />
                    </td>
                    <td className="border border-gray-300 px-2 py-2">
                      <textarea
                        value={row.materialSpecification || ""}
                        onChange={(e) => onFullSystemRowFieldChange(row.id, "materialSpecification", e.target.value)}
                        className="min-h-[64px] w-full text-xs rounded-md border border-gray-200 bg-white resize-y px-2 py-1"
                        placeholder={capitalCase("material specification")}
                        rows={2}
                      />
                    </td>
                    <td className="border border-gray-300 px-2 py-2">
                      <Select
                        value={row.approvedBrand ? { value: row.approvedBrand, label: row.approvedBrand } : null}
                        onChange={(opt) => onFullSystemRowFieldChange(row.id, "approvedBrand", opt?.value || "")}
                        options={brandOptions}
                        placeholder={capitalCase("select brand")}
                        isSearchable
                        isClearable
                        menuPlacement="auto"
                        styles={{
                          container: (base) => ({ ...base, width: "100%", maxWidth: 220 }),
                          control: (base) => ({
                            ...base,
                            minHeight: 32,
                            height: 32,
                            boxShadow: "none",
                            borderColor: "#e5e7eb",
                            borderRadius: 6,
                            fontSize: 12,
                            backgroundColor: "white",
                          }),
                          valueContainer: (base) => ({ ...base, padding: "0 8px" }),
                          input: (base) => ({ ...base, margin: 0, padding: 0 }),
                          indicatorSeparator: (base) => ({ ...base, display: "none" }),
                          indicatorsContainer: (base) => ({ ...base, height: 32 }),
                          menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                          menu: (base) => ({ ...base, fontSize: 12 }),
                        }}
                        menuPortalTarget={typeof document !== "undefined" ? document.body : null}
                      />
                    </td>
                    <td className="border border-gray-300 px-2 py-2">
                      <input
                        value={row.proposedVendors || ""}
                        onChange={(e) => onFullSystemRowFieldChange(row.id, "proposedVendors", e.target.value)}
                        className="h-8 w-full text-xs rounded-md border border-gray-200 bg-white px-2"
                        placeholder="Proposed venders"
                      />
                    </td>
                    {fullSystemDocCols.map((col) => {
                      const refK = fsAnnexKey(row.id, col.key);
                      const hasFile = Boolean(row.statusFiles?.[col.key]);
                      return (
                        <td key={col.key} className="border border-gray-300 px-2 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => fullSystemFileRefs.current[refK]?.click()}
                            className={`inline-flex items-center justify-center gap-1 text-[10px] font-semibold px-2 py-1.5 rounded border w-full max-w-[160px] mx-auto transition-colors ${hasFile
                              ? "border-emerald-500/50 bg-emerald-50 text-emerald-800 hover:bg-emerald-100/80"
                              : "border-primary/30 bg-orange-50 text-primary hover:bg-orange-100/50"
                              }`}
                          >
                            {hasFile ? (
                              <>
                                <FileCheck className="w-3 h-3 shrink-0" />
                                {capitalCase("uploaded")}
                              </>
                            ) : (
                              <>
                                <Upload className="w-3 h-3 shrink-0" />
                                {capitalCase("upload")}
                              </>
                            )}
                          </button>
                          <input
                            type="file"
                            className="hidden"
                            ref={(el) => {
                              fullSystemFileRefs.current[refK] = el;
                            }}
                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) onFullSystemRowFileUpload(row.id, col.key, f);
                            }}
                          />
                        </td>
                      );
                    })}
                    <td className="border border-gray-300 px-2 py-2">
                      <textarea
                        value={row.remark || ""}
                        onChange={(e) => onFullSystemRowFieldChange(row.id, "remark", e.target.value)}
                        className="min-h-[64px] w-full text-xs rounded-md border border-gray-200 bg-white resize-y px-2 py-1"
                        placeholder={capitalCase("remark")}
                        rows={2}
                      />
                    </td>
                    <td className="border border-gray-300 px-2 py-2 text-center">
                      {rows.length > 1 ? (
                        <button
                          type="button"
                          onClick={() => onDeleteFullSystemRow(row.id)}
                          className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded border border-rose-200 bg-rose-50 text-rose-700"
                        >
                          <Trash2 className="w-3 h-3" />
                          {capitalCase("delete")}
                        </button>
                      ) : (
                        <span className="text-[10px] text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                  <tr className="bg-gray-50/80">
                    <td colSpan={11} className="border border-gray-300 px-3 py-3 align-top">
                      {getFullSystemRowComplianceTables(row).length > 0 ? (
                        <ComplianceStatement
                          tables={getFullSystemRowComplianceTables(row)}
                          onTablesChange={(next) => onFullSystemRowComplianceChange(row.id, next)}
                          onAddTable={() => onFullSystemAddCompliance(row.id)}
                          allowAddAnotherTable
                          showMainHeading={false}
                          onRemoveAll={() => onFullSystemRowComplianceChange(row.id, [])}
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => onFullSystemAddCompliance(row.id)}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-dashed border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                        >
                          <Plus className="w-4 h-4" />
                          {capitalCase("add compliance statement")}
                        </button>
                      )}
                    </td>
                  </tr>
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
        <button
          type="button"
          onClick={onAddFullSystemRow}
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
        >
          <Plus className="w-4 h-4" />
          {capitalCase("add row")}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-[12px] uppercase tracking-wider font-bold text-gray-500">
        {materialType === "single" 
          ? "Material Submission :- Single" 
          : capitalCase("material submission checklist")}
      </h2>

      <div className="border border-gray-200 rounded-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left text-[10px] uppercase tracking-wider font-bold text-gray-500 px-4 py-3 w-12">
                {capitalCase("si no")}
              </th>
              <th className="text-left text-[10px] uppercase tracking-wider font-bold text-gray-500 px-4 py-3">
                {capitalCase("document")} / {capitalCase("details required")}
              </th>
              <th className="text-left text-[10px] uppercase tracking-wider font-bold text-gray-500 px-4 py-3 w-28">
                {capitalCase("document")}
              </th>
              <th className="text-left text-[10px] uppercase tracking-wider font-bold text-gray-500 px-4 py-3 w-48">
                {capitalCase("remarks")}
              </th>
            </tr>
          </thead>
          <tbody>
            {checklistItems.map((item) => {
              const uploadedFiles = getChecklistFilesList(checklistFiles[item.slNo]);
              const rowAnnexureNo = annexureMap[item.slNo];
              const selectedProduct = approvedVendorList.find((p) => p.product === product);
              const vendors = selectedProduct?.vendors || [];

              return (
                <tr key={item.slNo} className="border-t border-gray-200 transition-colors hover:bg-gray-50/50">
                  <td className="px-4 text-gray-500 tabular-nums font-medium">{item.slNo}</td>
                  <td className="px-4 text-foreground text-xs leading-relaxed">
                    {item.slNo === 3 ? (
                      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-end gap-3">
                        <div className="flex flex-col gap-1.5 min-w-0 flex-1 max-w-[220px]">
                          <span className="text-gray-500 text-[10px]">
                            {capitalCase("select document type")}:
                          </span>
                          <select
                            className={selectSmall}
                            value={checklistItem3Option || "__none__"}
                            onChange={(e) => {
                              const v = e.target.value;
                              const next = v === "__none__" ? "" : v;
                              onChecklistItem3SectionClassChange("");
                              onChecklistItem3OptionChange(next);
                            }}
                          >
                            <option value="__none__">—</option>
                            {checklistItem3Options.map((opt) => (
                              <option key={opt} value={opt}>
                                {capitalCaseLabel(opt)}
                              </option>
                            ))}
                          </select>
                        </div>
                        {checklistItem3Option ? (
                          <div className="flex flex-col gap-1.5 min-w-[160px] sm:max-w-[240px] flex-1">
                            <label
                              htmlFor="checklist-item-3-section-class"
                              className="text-gray-500 text-[10px] font-medium"
                            >
                              Section/ Class
                            </label>
                            <input
                              id="checklist-item-3-section-class"
                              type="text"
                              className="h-8 text-xs rounded-md w-full border border-gray-200 bg-white px-2 focus:outline-none focus:ring-2 focus:ring-primary"
                              value={checklistItem3SectionClass ?? ""}
                              onChange={(e) => onChecklistItem3SectionClassChange(e.target.value)}
                              placeholder={capitalCase("section class")}
                            />
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      item.description
                    )}
                    {item.slNo === 2 && (
                      <div className="mt-3 space-y-1.5">
                        <div className="flex gap-2 flex-wrap">
                          {makeStatusOptions.map((opt) => (
                            <Fragment key={opt.value}>
                              <button
                                type="button"
                                onClick={() => {
                                  onMakeStatusChange(opt.value);
                                  if (opt.value === "approved") {
                                    onChecklistRemarkChange(
                                      item.slNo,
                                      approvedRow2Remark
                                    );
                                    onAlternativeReasonChange(item.slNo, "");
                                  } else if (opt.value === "alternative") {
                                    onProductChange("");
                                    onBrandChange("");
                                    onChecklistRemarkChange(item.slNo, "");
                                    onAlternativeReasonChange(item.slNo, "");
                                  } else {
                                    onProductChange("");
                                    onBrandChange("");
                                    onChecklistRemarkChange(item.slNo, "");
                                    onAlternativeReasonChange(item.slNo, "");
                                  }
                                }}
                                className={`text-[11px] font-medium px-3 py-2 rounded-sm border transition-colors duration-150 ${makeStatus === opt.value
                                  ? "border-primary bg-orange-50 text-primary"
                                  : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                                  }`}
                              >
                                {capitalCase(opt.label)}
                              </button>
                              {opt.value === "approved" && makeStatus === "approved" && (
                                <input
                                  type="text"
                                  placeholder="Serial No."
                                  className="h-8 text-[11px] rounded-sm w-32 border border-gray-200 bg-white px-2 focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                              )}
                            </Fragment>
                          ))}
                        </div>

                        {makeStatus === "alternative" && (
                          <div className="space-y-2 max-w-2xl">
                            <span className="text-[10px] uppercase tracking-wide font-semibold text-gray-500 block">
                              {capitalCase("reasons")}
                            </span>
                            <div className="flex flex-row items-center gap-4">
                              <select
                                className="h-8 text-xs rounded-md w-48 border border-gray-200 bg-white px-2 shrink-0"
                                value={checklistAlternativeReasons[item.slNo] || "__none__"}
                                onChange={(e) => {
                                  const v = e.target.value;
                                  onAlternativeReasonChange(item.slNo, v === "__none__" ? "" : v);
                                }}
                              >
                                <option value="__none__" disabled >Select reason</option>
                                {alternativeProposalReasons.map((r) => (
                                  <option key={r} value={r}>
                                    {r}
                                  </option>
                                ))}
                              </select>
                              <p className="text-[10px] text-blue-800 bg-blue-50 px-2 py-1.5 rounded border border-blue-200 leading-relaxed m-0">
                                {ALTERNATIVE_PROPOSAL_REMARK_TEXT}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* {makeStatus === "approved" && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-[560px]">
                            <div>
                              <span className="text-[10px] uppercase tracking-wide font-semibold text-gray-500 block mb-1">
                                {capitalCase("product")}
                              </span>
                              <select
                                className="h-8 text-xs rounded-md w-full border border-gray-200 bg-white px-2"
                                value={product || ""}
                                onChange={(e) => {
                                  const nextProduct = e.target.value;
                                  onProductChange(nextProduct);
                                  onBrandChange("");
                                  const nextRemark = `${String(nextProduct || "").trim()}`.trim();
                                  onChecklistRemarkChange(item.slNo, nextRemark);
                                }}
                              >
                                <option value="">{capitalCase("select product")}</option>
                                {approvedVendorList.map((p) => (
                                  <option key={p.srNo} value={p.product}>
                                    {p.product}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <span className="text-[10px] uppercase tracking-wide font-semibold text-gray-500 block mb-1">
                                {capitalCase("brand")} / {capitalCase("manufacturer")}
                              </span>
                              <select
                                className="h-8 text-xs rounded-md w-full border border-gray-200 bg-white px-2"
                                value={brand || ""}
                                onChange={(e) => {
                                  const nextBrand = e.target.value;
                                  onBrandChange(nextBrand);
                                  const nextRemark = `${product || ""}${product && nextBrand ? " - " : ""}${nextBrand || ""}`.trim();
                                  onChecklistRemarkChange(item.slNo, nextRemark);
                                }}
                                disabled={!product}
                              >
                                <option value="">
                                  {product ? capitalCase("select brand") : capitalCase("select product first")}
                                </option>
                                {vendors.map((v) => (
                                  <option key={v} value={v}>
                                    {v}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        )} */}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2 text-left align-top">
                    <div className="flex flex-col items-stretch gap-1.5 max-w-[220px]">
                      <>
                        {uploadedFiles.length > 0 && (
                          <ul className="text-[10px] text-left space-y-1 w-full">
                            {uploadedFiles.map((f, idx) => (
                              <li
                                key={`${item.slNo}-${f.name}-${f.size}-${idx}`}
                                className="flex items-center gap-1 justify-between rounded border border-emerald-200/60 bg-emerald-50/50 px-1.5 py-1"
                              >
                                <span className="truncate flex-1 min-w-0" title={f.name}>
                                  {f.name}
                                </span>

                                <button
                                  type="button"
                                  onClick={() => onChecklistFileRemove?.(item.slNo, idx)}
                                  className="shrink-0 p-0.5 rounded text-gray-500 hover:text-rose-600 hover:bg-rose-50"
                                  aria-label={`Remove ${f.name}`}
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}

                        <button
                          type="button"
                          onClick={() => fileInputRefs.current[item.slNo]?.click()}
                          className={`inline-flex items-center justify-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-sm border transition-colors cursor-pointer w-full ${uploadedFiles.length > 0
                              ? "border-emerald-500/40 bg-emerald-50 text-emerald-700 hover:bg-emerald-100/50"
                              : "border-primary/30 bg-orange-50 text-primary hover:bg-orange-100/50"
                            }`}
                          title={capitalCase("click to upload documents")}
                        >
                          <Upload className="w-3.5 h-3.5 shrink-0" />
                          {uploadedFiles.length > 0 ? capitalCase("add files") : capitalCase("upload")}
                        </button>

                        {rowAnnexureNo != null && uploadedFiles.length > 0 && (
                          <p className="text-[9px] text-emerald-800 font-medium text-center leading-tight">
                            Annexure #{rowAnnexureNo}
                            {uploadedFiles.length > 1
                              ? ` (${uploadedFiles.length} ${capitalCase("files")})`
                              : ""}
                          </p>
                        )}

                        <input
                          type="file"
                          ref={(el) => {
                            fileInputRefs.current[item.slNo] = el;
                          }}
                          className="hidden"
                          multiple
                          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                          onChange={(e) => {
                            const picked = e.target.files;
                            if (picked?.length) onFileUpload(item.slNo, Array.from(picked));
                            e.target.value = "";
                          }}
                        />
                      </>
                    </div>
                  </td>
                  <td className="px-4 py-2 align-top">
                    <textarea
                      value={checklistRemarks[item.slNo] || ""}
                      onChange={(e) => onChecklistRemarkChange(item.slNo, e.target.value)}
                      className="min-h-[72px] text-xs rounded-md border border-gray-200 bg-white resize-y w-full px-2 py-1"
                      placeholder={capitalCase("remarks")}
                      rows={2}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
