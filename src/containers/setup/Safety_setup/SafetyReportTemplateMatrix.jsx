import React, { useState, useMemo, useEffect, useRef } from "react";
import { Table, Shield, ShieldCheck, Pencil, X } from "lucide-react";
import {
  buildHeaderPreviewRows,
  buildHeaderFieldsFromLegacyMeta,
} from "./safetyHeaderFields";
import { NEWchecklistInstance as checklistInstance } from "../../../api/axiosInstance";

export default function SafetyReportTemplateMatrix({
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
  onSchemaChange,
  instructionImageFile: initialInstructionImageFile = null,
  instructionText: initialInstructionText = "",
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

  const [instructionText, setInstructionText] = useState(
    initialInstructionText || initialTemplateData?.instruction_text || "",
  );

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
      instructionText,
      meta,
    });
  }, [
    title,
    reportTitleProp,
    leftLogoFile,
    rightLogoFile,
    instructionImageFile,
    instructionText,
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

    const BASE_URL = checklistInstance.defaults.baseURL.replace(
      /\/api\/?$/,
      "",
    );

    const buildMediaUrl = (path) => {
      if (!path) return null;
      if (path.startsWith("http")) return path;
      if (path.startsWith("/")) return `${BASE_URL}${path}`;
      return `${BASE_URL}/${path}`;
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

    setInstructionText(initialTemplateData.instruction_text || "");
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

  const instructionLines = useMemo(
    () =>
      String(instructionText || "")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
    [instructionText],
  );

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

        {/* --- INSTRUCTION IMAGE / TEXT --- */}
        <div className="mb-6">
          <input
            ref={instructionImageInputRef}
            id="matrix-instruction-image-upload"
            type="file"
            accept="image/png,image/jpeg,image/jpg"
            onChange={handleInstructionImageChange}
            className="hidden"
          />

          {isEditMode && (
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <label
                htmlFor="matrix-instruction-image-upload"
                className="flex min-h-[120px] w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-4 transition hover:bg-gray-100"
              >
                {instructionImageUrl ? (
                  <>
                    <img
                      src={instructionImageUrl}
                      alt="Instruction Image"
                      className="max-h-[300px] w-full object-contain"
                    />
                    <span className="mt-2 text-xs text-gray-500">
                      Click to change instruction image PNG/JPG
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-sm font-medium text-gray-500">
                      Upload Instruction Image Optional
                    </span>
                    <span className="mt-1 text-xs text-gray-400">
                      Use image OR instruction text below
                    </span>
                  </>
                )}
              </label>

              <div className="mt-4">
                <label className="mb-2 block text-sm font-semibold text-gray-800">
                  Instruction Text
                </label>

                <textarea
                  value={instructionText}
                  onChange={(e) => setInstructionText(e.target.value)}
                  rows={4}
                  placeholder={`Illumination Level in Lux.\nMin Lux requirement must be referred to IS standards\nActions : Required or not required.`}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange-500"
                />
              </div>
            </div>
          )}

          {!isEditMode && instructionImageUrl ? (
            <div className="mb-6 flex flex-col items-center justify-center rounded-lg border border-gray-200 bg-gray-50 p-4">
              <img
                src={instructionImageUrl}
                alt="Instruction Image"
                className="max-h-[300px] w-full object-contain"
              />
            </div>
          ) : !isEditMode && instructionLines.length > 0 ? (
            <table className="mb-6 w-full border-collapse text-sm">
              <tbody>
                {instructionLines.map((line, index) => (
                  <tr key={index}>
                    {index === 0 && (
                      <td
                        rowSpan={instructionLines.length}
                        className="w-28 border border-gray-300 px-3 py-2 text-center font-semibold"
                      >
                        Instructions
                      </td>
                    )}
                    <td className="border border-gray-300 px-3 py-2 font-semibold">
                      {line}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
        </div>

        {/* --- HORIZONTAL MATRIX TABLE --- */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-x-auto overflow-y-hidden mb-8">
          <table className="w-full text-left border-collapse min-w-max">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-r border-gray-200 w-14 text-center bg-gray-100">
                  SN
                </th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-r border-gray-200 min-w-[200px] bg-gray-100">
                  Points to be Checked
                </th>
                {Array.from({ length: schema?.matrixColumns || 5 }).map(
                  (_, i) => (
                    <th
                      key={i}
                      className="p-4 text-[13px] font-semibold text-gray-700 border-r border-gray-200 last:border-r-0 align-bottom text-center"
                    >
                      W{i + 1}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {headers.map((h, i) => (
                <tr
                  key={i}
                  className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50/50 transition-colors"
                >
                  <td className="p-4 text-sm text-gray-400 border-r border-gray-200 text-center font-bold bg-gray-50/30">
                    {i + 1}
                  </td>
                  <td className="p-4 text-sm text-gray-700 border-r border-gray-200 font-medium">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        {h.text}
                        {h.description && (
                          <div className="text-xs text-gray-500 mt-1 font-normal">
                            {h.description}
                          </div>
                        )}
                      </div>
                      {!previewOnly && onSchemaChange && (
                        <div className="flex items-center flex-col gap-1">
                          {h.referenceImageFile && (
                            <div className="relative">
                              <img
                                src={URL.createObjectURL(h.referenceImageFile)}
                                alt="Reference"
                                className="h-10 w-10 object-cover rounded shadow-sm border border-gray-200"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const newHeaders = [...schema.headers];
                                  newHeaders[i] = {
                                    ...newHeaders[i],
                                    referenceImageFile: null,
                                  };
                                  onSchemaChange({
                                    ...schema,
                                    headers: newHeaders,
                                  });
                                }}
                                className="absolute -top-2 -right-2 bg-white rounded-full text-red-500 shadow-sm border border-gray-100 p-0.5 hover:bg-red-50"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          )}
                          <label
                            className="cursor-pointer text-gray-400 hover:text-orange-600 transition-colors p-1"
                            title="Upload Reference Image"
                          >
                            <input
                              type="file"
                              className="hidden"
                              accept="image/png,image/jpeg,image/jpg"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  const newHeaders = [...schema.headers];
                                  newHeaders[i] = {
                                    ...newHeaders[i],
                                    referenceImageFile: e.target.files[0],
                                  };
                                  onSchemaChange({
                                    ...schema,
                                    headers: newHeaders,
                                  });
                                }
                                e.target.value = "";
                              }}
                            />
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <rect
                                width="18"
                                height="18"
                                x="3"
                                y="3"
                                rx="2"
                                ry="2"
                              />
                              <circle cx="9" cy="9" r="2" />
                              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                            </svg>
                          </label>
                        </div>
                      )}
                    </div>
                  </td>
                  {Array.from({ length: schema?.matrixColumns || 5 }).map(
                    (_, colIdx) => (
                      <td
                        key={colIdx}
                        className="p-4 border-r border-gray-100 last:border-r-0 align-middle text-center min-w-[60px]"
                      >
                        <div className="w-5 h-5 rounded border border-gray-300 mx-auto bg-gray-50"></div>
                      </td>
                    ),
                  )}
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
