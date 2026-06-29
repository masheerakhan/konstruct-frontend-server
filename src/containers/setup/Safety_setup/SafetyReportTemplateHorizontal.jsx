import React, { useState, useMemo, useEffect, useRef } from "react";
import { Table, Shield, ShieldCheck, Pencil, X } from "lucide-react";
import {
  buildHeaderPreviewRows,
  buildHeaderFieldsFromLegacyMeta,
} from "./safetyHeaderFields";

export default function SafetyReportTemplateHorizontal({
  schema,
  reportTitle: reportTitleProp,
  projectName = "",
  headerFields = [],
  reportNumberConfig = { prefix: "", padding: 2 },
  meta = {},
  leftLogoFile: initialLeftLogoFile = null,
  rightLogoFile: initialRightLogoFile = null,
  initialTemplateData = null,
  previewOnly = false,
  onReportDraftChange,
  instructionImageFile: initialInstructionImageFile = null,
}) {
  const headers = schema?.headers || [];

  const [isEditMode, setIsEditMode] = useState(false);
  const [title, setTitle] = useState("");
  const [leftLogoFile, setLeftLogoFile] = useState(initialLeftLogoFile);
  const [leftLogoPreview, setLeftLogoPreview] = useState(null);
  const [rightLogoFile, setRightLogoFile] = useState(initialRightLogoFile);
  const [rightLogoPreview, setRightLogoPreview] = useState(null);
  const [instructionImageFile, setInstructionImageFile] = useState(
    initialInstructionImageFile,
  );
  const [instructionImagePreview, setInstructionImagePreview] = useState(null);

  const logoInputRef = useRef(null);
  const rightLogoInputRef = useRef(null);
  const instructionImageInputRef = useRef(null);

  useEffect(() => {
    if (!onReportDraftChange) return;
    onReportDraftChange({
      title: title || reportTitleProp || "",
      leftLogoFile,
      rightLogoFile,
      instructionImageFile,
      meta,
    });
  }, [
    title,
    reportTitleProp,
    leftLogoFile,
    rightLogoFile,
    instructionImageFile,
    meta,
    onReportDraftChange,
  ]);

  useEffect(() => {
    if (reportTitleProp != null && reportTitleProp !== "") {
      setTitle(reportTitleProp);
    }
  }, [reportTitleProp]);

  useEffect(() => {
    if (!initialTemplateData || !previewOnly) return;
    setTitle(initialTemplateData.title || initialTemplateData.name || "");

    const BASE_URL = "http://localhost:8001/";

    const buildMediaUrl = (path) => {
      if (!path) return null;
      if (path.startsWith("http")) return path;
      return `${BASE_URL}${path}`;
    };

    setLeftLogoPreview(
      buildMediaUrl(
        initialTemplateData.report_logo_url ||
          initialTemplateData.report_logo ||
          initialTemplateData.logo_url,
      ),
    );

    setRightLogoPreview(
      buildMediaUrl(
        initialTemplateData.report_logo_right_url ||
          initialTemplateData.report_logo_right,
      ),
    );

    setInstructionImagePreview(
      buildMediaUrl(
        initialTemplateData.instruction_image_url ||
          initialTemplateData.instruction_image,
      ),
    );
  }, [initialTemplateData, previewOnly]);

  const handleLeftLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/^image\/(png|jpeg|jpg)$/i.test(file.type)) return;

    setLeftLogoFile(file);
    setLeftLogoPreview(URL.createObjectURL(file));
    e.target.value = "";
  };

  const handleRightLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/^image\/(png|jpeg|jpg)$/i.test(file.type)) return;

    setRightLogoFile(file);
    setRightLogoPreview(URL.createObjectURL(file));
    e.target.value = "";
  };

  const handleInstructionImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/^image\/(png|jpeg|jpg)$/i.test(file.type)) return;

    setInstructionImageFile(file);
    setInstructionImagePreview(URL.createObjectURL(file));
    e.target.value = "";
  };

  const effectiveHeaderFields = useMemo(() => {
    if (Array.isArray(headerFields) && headerFields.length > 0) {
      return headerFields;
    }
    if (
      Array.isArray(initialTemplateData?.header_fields) &&
      initialTemplateData.header_fields.length > 0
    ) {
      return initialTemplateData.header_fields;
    }
    return buildHeaderFieldsFromLegacyMeta(
      initialTemplateData?.report_header_meta || meta || {},
    );
  }, [headerFields, initialTemplateData, meta]);

  const effectiveReportNumberConfig =
    initialTemplateData?.report_number_config || reportNumberConfig;

  const dynamicHeaderRows = useMemo(
    () =>
      buildHeaderPreviewRows(effectiveHeaderFields, {
        projectName,
        reportNumberConfig: effectiveReportNumberConfig,
      }),
    [effectiveHeaderFields, projectName, effectiveReportNumberConfig],
  );

  const leftLogoUrl = useMemo(() => {
    if (leftLogoPreview) return leftLogoPreview;
    if (leftLogoFile) return URL.createObjectURL(leftLogoFile);
    return (
      initialTemplateData?.report_logo_url ||
      initialTemplateData?.report_logo ||
      initialTemplateData?.logo_url
    );
  }, [leftLogoPreview, leftLogoFile, initialTemplateData]);

  const rightLogoUrl = useMemo(() => {
    if (rightLogoPreview) return rightLogoPreview;
    if (rightLogoFile) return URL.createObjectURL(rightLogoFile);
    return (
      initialTemplateData?.report_logo_right_url ||
      initialTemplateData?.report_logo_right
    );
  }, [rightLogoPreview, rightLogoFile, initialTemplateData]);

  const instructionImageUrl = useMemo(() => {
    if (instructionImagePreview) return instructionImagePreview;
    if (instructionImageFile) return URL.createObjectURL(instructionImageFile);
    return (
      initialTemplateData?.instruction_image_url ||
      initialTemplateData?.instruction_image
    );
  }, [instructionImagePreview, instructionImageFile, initialTemplateData]);

  const emptyChar = "—";
  const description = initialTemplateData?.description || "";
  const checkedBy = initialTemplateData?.checked_by || "";
  const verifiedBy = initialTemplateData?.verified_by || "";

  const displayTitle = title || reportTitleProp || "Inspection";

  const renderCellPreview = (header) => {
    if (header.type === "multiple_choice") {
      return (
        <div className="flex flex-wrap gap-1.5 mt-1">
          {(header.options || []).map((opt, i) => (
            <span
              key={i}
              className="px-2 py-1 bg-white border border-gray-200 shadow-sm rounded-md text-xs font-medium text-gray-600"
            >
              {opt}
            </span>
          ))}
        </div>
      );
    }
    if (header.type === "paragraph") {
      return (
        <div className="h-16 w-full bg-white border border-dashed border-gray-300 rounded-lg text-[11px] text-gray-400 p-2">
          Enter details...
        </div>
      );
    }
    if (header.type === "date") {
      return (
        <div className="h-9 w-full bg-white border border-dashed border-gray-300 rounded-lg px-3 flex items-center justify-between text-[11px] text-gray-400">
          <span>
            {header.autoFetchOneMonth ? "Auto-fetched Date" : "Select Date..."}
          </span>
          <span className="text-gray-300">📅</span>
        </div>
      );
    }
    return (
      <div className="h-9 w-full bg-white border border-dashed border-gray-300 rounded-lg px-3 flex items-center text-[11px] text-gray-400">
        Text input...
      </div>
    );
  };

  return (
    <div
      className={`bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden ${previewOnly ? "bg-transparent p-0" : ""}`}
    >
      <div className={`bg-[#fcfcfc] ${previewOnly ? "p-0" : "p-6"}`}>
        {/* Edit button - top right */}
        <div className="flex justify-end mb-2">
          {!previewOnly &&
            (!isEditMode ? (
              <button
                type="button"
                onClick={() => setIsEditMode(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-orange-200 bg-white px-3 py-1.5 text-sm font-medium text-orange-600 shadow-sm hover:bg-orange-50"
              >
                <Pencil className="h-4 w-4" />
                Edit
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditMode(false)}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
              >
                <X className="h-4 w-4" />
                Done
              </button>
            ))}
        </div>

        {/* --- HEADER PREVIEW --- */}
        <table className="w-full text-sm border-collapse mb-6 table-fixed bg-white">
          <tbody>
            <tr>
              <td className="align-top border border-gray-300 p-0 w-[28%] min-w-[180px]">
                <input
                  ref={logoInputRef}
                  id="report-logo-upload"
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  onChange={handleLeftLogoChange}
                  className="hidden"
                />
                {isEditMode ? (
                  <label
                    htmlFor="report-logo-upload"
                    className="flex flex-col items-center justify-center min-h-[160px] w-full cursor-pointer border-0 border-transparent bg-orange-50/50 hover:bg-orange-100/80 transition p-4 box-border"
                  >
                    {leftLogoUrl ? (
                      <>
                        <img
                          src={leftLogoUrl}
                          alt="Logo"
                          className="max-h-[185px] w-full object-contain"
                        />
                        <span className="text-xs text-orange-600 mt-2">
                          Click to change logo (PNG/JPG)
                        </span>
                      </>
                    ) : (
                      <>
                        <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-dashed border-orange-300 bg-white text-orange-500">
                          <Shield className="h-14 w-14" />
                        </div>
                        <span className="text-xs text-orange-600 mt-2">
                          Click to upload logo (PNG/JPG)
                        </span>
                      </>
                    )}
                  </label>
                ) : (
                  <div className="flex flex-col items-center justify-center min-h-[160px] p-4">
                    {leftLogoUrl ? (
                      <img
                        src={leftLogoUrl}
                        alt="Logo"
                        className="max-h-[185px] w-full object-contain"
                      />
                    ) : (
                      <div className="flex h-24 w-24 items-center justify-center rounded-full border border-orange-200 bg-orange-50/80">
                        <Shield className="h-14 w-14 text-orange-500" />
                      </div>
                    )}
                  </div>
                )}
              </td>
              <td className="align-top border border-gray-300 p-0">
                <table className="w-full text-sm border-collapse">
                  <tbody>
                    {dynamicHeaderRows.map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {row.map((field) => (
                          <td
                            key={field.key}
                            colSpan={row.length === 1 ? 2 : 1}
                            className="border border-gray-300 px-2 py-1.5 font-semibold text-gray-500"
                          >
                            {field.label}:{" "}
                            <span className="font-normal text-gray-900">
                              {field.previewValue || emptyChar}
                            </span>
                          </td>
                        ))}
                      </tr>
                    ))}
                    {dynamicHeaderRows.length === 0 && (
                      <tr>
                        <td
                          colSpan={2}
                          className="border border-gray-300 px-2 py-1.5 font-semibold text-gray-500"
                        >
                          Report Information:{" "}
                          <span className="font-normal text-gray-900">
                            {emptyChar}
                          </span>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </td>
              <td className="align-top border border-gray-300 p-0 w-[28%] min-w-[180px]">
                <input
                  ref={rightLogoInputRef}
                  id="report-right-logo-upload"
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  onChange={handleRightLogoChange}
                  className="hidden"
                />
                {isEditMode ? (
                  <label
                    htmlFor="report-right-logo-upload"
                    className="flex flex-col items-center justify-center min-h-[160px] w-full cursor-pointer border-0 border-transparent bg-orange-50/50 hover:bg-orange-100/80 transition p-4 box-border"
                  >
                    {rightLogoUrl ? (
                      <>
                        <img
                          src={rightLogoUrl}
                          alt="Right Logo"
                          className="max-h-[185px] w-full object-contain"
                        />
                        <span className="text-xs text-orange-600 mt-2">
                          Click to change right logo (PNG/JPG)
                        </span>
                      </>
                    ) : (
                      <>
                        <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-dashed border-orange-300 bg-white text-orange-500">
                          <ShieldCheck className="h-14 w-14" />
                        </div>
                        <span className="text-xs text-orange-600 mt-2">
                          Click to upload right logo (PNG/JPG)
                        </span>
                      </>
                    )}
                  </label>
                ) : (
                  <div className="flex flex-col items-center justify-center min-h-[160px] p-4">
                    {rightLogoUrl ? (
                      <img
                        src={rightLogoUrl}
                        alt="Right Logo"
                        className="max-h-[185px] w-full object-contain"
                      />
                    ) : (
                      <div className="flex h-24 w-24 items-center justify-center rounded-full border border-orange-200 bg-orange-50/80">
                        <ShieldCheck className="h-14 w-14 text-orange-500" />
                      </div>
                    )}
                  </div>
                )}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Title bar - light orange background, darker orange left accent */}
        <div className="flex items-center mb-6 border-l-4 border-orange-500 bg-orange-100/90 px-4 py-2.5">
          {isEditMode ? (
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="flex-1 text-lg font-bold tracking-widest uppercase text-gray-900 bg-transparent border-none outline-none placeholder-gray-500"
              placeholder="Report title"
            />
          ) : (
            <h1 className="text-lg font-bold tracking-widest uppercase text-gray-900">
              {displayTitle}
            </h1>
          )}
        </div>

        {/* --- INSTRUCTION IMAGE --- */}
        <div className="mb-6">
          <input
            ref={instructionImageInputRef}
            id="instruction-image-upload"
            type="file"
            accept="image/png,image/jpeg,image/jpg"
            onChange={handleInstructionImageChange}
            className="hidden"
          />
          {isEditMode ? (
            <label
              htmlFor="instruction-image-upload"
              className="flex flex-col items-center justify-center min-h-[120px] w-full cursor-pointer border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 transition p-4 box-border rounded-lg"
            >
              {instructionImageUrl ? (
                <>
                  <img
                    src={instructionImageUrl}
                    alt="Instruction Image"
                    className="max-h-[300px] w-full object-contain"
                  />
                  <span className="text-xs text-gray-500 mt-2">
                    Click to change instruction image (PNG/JPG)
                  </span>
                </>
              ) : (
                <>
                  <span className="text-sm font-medium text-gray-500">
                    Upload Instruction Image (Optional)
                  </span>
                  <span className="text-xs text-gray-400 mt-1">
                    PNG, JPG up to 5MB
                  </span>
                </>
              )}
            </label>
          ) : (
            instructionImageUrl && (
              <div className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg bg-gray-50 mb-6">
                <img
                  src={instructionImageUrl}
                  alt="Instruction Image"
                  className="max-h-[300px] w-full object-contain"
                />
              </div>
            )
          )}
        </div>

        {/* --- HORIZONTAL MATRIX TABLE --- */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-x-auto overflow-y-hidden mb-8">
          <table className="w-full text-left border-collapse min-w-max">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-r border-gray-200 w-14 text-center bg-gray-100">
                  Row
                </th>
                {headers.map((h, i) => (
                  <th
                    key={i}
                    className="p-4 text-[13px] font-semibold text-gray-700 border-r border-gray-200 last:border-r-0 max-w-[250px] align-bottom"
                  >
                    <div className="line-clamp-2" title={h.text}>
                      {h.text}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3].map((rowNum) => (
                <tr
                  key={rowNum}
                  className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50/50 transition-colors"
                >
                  <td className="p-4 text-sm text-gray-400 border-r border-gray-200 text-center font-bold bg-gray-50/30">
                    {rowNum}
                  </td>
                  {headers.map((h, i) => (
                    <td
                      key={i}
                      className="p-4 border-r border-gray-100 last:border-r-0 align-top min-w-[150px]"
                    >
                      {renderCellPreview(h)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* --- FOOTER PREVIEW --- */}
        <div className="bg-white">
          <div className="mb-8">
            <p className="font-bold text-gray-900 text-sm mb-1">Description:</p>
            <div className="border-b border-gray-200 w-12 mt-1" />
            <p className="min-h-[24px] mt-2 whitespace-pre-wrap text-sm text-gray-700">
              {description || emptyChar}
            </p>
          </div>

          <div className="flex justify-between items-stretch pt-12 pb-2 border-t-2 border-gray-200 mt-10">
            <div className="flex flex-col min-w-[200px]">
              <div
                className="border-b-2 border-gray-800 h-10 mb-2"
                aria-hidden
              />
              <p className="font-bold text-sm text-gray-900">
                Checked By:{" "}
                <span className="font-normal">{checkedBy || emptyChar}</span>
              </p>
            </div>
            <div className="flex flex-col min-w-[200px] items-end text-right">
              <div
                className="border-b-2 border-gray-800 h-10 mb-2 w-full max-w-[200px]"
                aria-hidden
              />
              <p className="font-bold text-sm text-gray-900">
                Verified By:{" "}
                <span className="font-normal">{verifiedBy || emptyChar}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
