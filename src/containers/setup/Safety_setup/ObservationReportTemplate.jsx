import React, { useState, useMemo, useEffect, useRef } from "react";
import { Shield, ShieldCheck, Pencil, X } from "lucide-react";
import { toast } from "react-hot-toast";
import { createHousekeepingTemplate } from "../../../api";
import { checklistInstance } from "../../../api/axiosInstance";
import {
  buildHeaderPreviewRows,
  buildHeaderFieldsFromLegacyMeta,
} from "./safetyHeaderFields";
const INITIAL_OBSERVATION_QUESTIONS = [
  {
    id: "obs-1",
    title: "1. WHAT UNSAFE ACT / CONDITION OBSERVED-",
    type: "dropdown_with_secondary",
    options: ["UNSAFE ACT & CONDITION OBSERVED"],
  },
  { id: "obs-2", title: "2. LOCATION-", type: "location_combined" },
  {
    id: "obs-3",
    title: "3. PHOTOGRAPH OF UNSAFE ACT / CONDITION-",
    type: "file_upload",
  },
  {
    id: "obs-4",
    title: "4. HAZARD/RISK-",
    type: "hazard_risk_combined",
    options: [
      "1. Physical Hazard",
      "2. Biological Hazard",
      "3. Chemical Hazard",
      "4. Mechanical Hazard",
      "5. Ergonomical Hazard",
      "6. Environmental Hazard",
      "7. Psychological Hazard",
      "8. Electrical Hazard",
      "9. Fire/Explosion Hazard",
    ],
  },
  { id: "obs-5", title: "5. NAME OF CONTRACTOR-", type: "contractor_dropdown" },
  { id: "obs-6", title: "6. TARGET DATE-", type: "date" },
  { id: "obs-7", title: "7. CA/PA TO BE TAKEN-", type: "ca_pa_combined" },
  { id: "obs-8", title: "8. CLOSER PHOTOGRAPH-", type: "file_upload" },
];

const renderCardUI = (q) => {
  switch (q.id) {
    case "obs-1":
      return (
        <div className="flex flex-col gap-2 w-full min-w-[130px]">
          <select
            disabled
            className="w-full rounded border border-gray-300 bg-gray-50 px-2 py-1 text-xs text-gray-500"
          >
            <option>UNSAFE ACT & CONDITION OBSERVED</option>
          </select>
          <input
            disabled
            placeholder="Short answer"
            className="w-full rounded border border-dashed border-gray-300 bg-gray-50 px-2 py-1 text-xs text-gray-500"
          />
        </div>
      );
    case "obs-2":
      return (
        <div className="flex flex-col gap-2 w-full min-w-[120px]">
          <select
            disabled
            className="w-full rounded border border-gray-300 bg-gray-50 px-2 py-1 text-xs text-gray-500"
          >
            <option>Wing: A - G</option>
          </select>
          <select
            disabled
            className="w-full rounded border border-gray-300 bg-gray-50 px-2 py-1 text-xs text-gray-500"
          >
            <option>Floor: BASEMENT - TERRACE</option>
          </select>
          <input
            disabled
            placeholder="Flat/Area"
            className="w-full rounded border border-dashed border-gray-300 bg-gray-50 px-2 py-1 text-xs text-gray-500"
          />
        </div>
      );
    case "obs-3":
    case "obs-8":
      return (
        <div className="flex w-full min-w-[100px] items-center justify-center rounded border border-dashed border-gray-300 bg-gray-50 px-2 py-4 text-[10px] text-center text-gray-500">
          Upload image
        </div>
      );
    case "obs-4":
      return (
        <div className="flex flex-col gap-2 w-full min-w-[130px]">
          <select
            disabled
            className="w-full rounded border border-gray-300 bg-gray-50 px-2 py-1 text-xs text-gray-500"
          >
            <option>Select Hazard...</option>
          </select>
          <select
            disabled
            className="w-full rounded border border-dashed border-gray-300 bg-gray-50 px-2 py-1 text-xs text-gray-500"
          >
            <option value="">Risk details</option>
            <option value="Low Risk">Low Risk</option>
            <option value="Medium Risk">Medium Risk</option>
            <option value="High Risk">High Risk</option>
          </select>
        </div>
      );
    case "obs-5":
      return (
        <select
          disabled
          className="w-full min-w-[120px] rounded border border-gray-300 bg-gray-50 px-2 py-1 text-xs text-gray-500"
        >
          <option>Select Contractor...</option>
        </select>
      );
    case "obs-6":
      return (
        <input
          disabled
          type="date"
          className="w-full min-w-[100px] rounded border border-dashed border-gray-300 bg-gray-50 px-2 py-1 text-[10px] text-gray-500"
        />
      );
    case "obs-7":
      return (
        <div className="flex flex-col gap-2 w-full min-w-[130px]">
          <input
            disabled
            placeholder="Corrective Action"
            className="w-full rounded border border-dashed border-gray-300 bg-gray-50 px-2 py-1 text-xs text-gray-500"
          />
          <input
            disabled
            placeholder="Preventive Action"
            className="w-full rounded border border-dashed border-gray-300 bg-gray-50 px-2 py-1 text-xs text-gray-500"
          />
        </div>
      );
    default:
      return null;
  }
};

const META_ROWS = [
  [
    { key: "formatNo", label: "Format No.:" },
    { key: "revisionNo", label: "Revision No.:" },
  ],
  [
    { key: "issuedDate", label: "Issued Date:" },
    { key: "revisionDate", label: "Revision Date:" },
  ],
  [
    { key: "project", label: "Project:" },
    {
      key: "inspectionReportPrefix",
      label: "Inspection Report Prefix:",
      placeholder: "ADL-NEST-AC",
      helper: "Auto: ADL-NEST-AC-01, ADL-NEST-AC-02",
    },
  ],
  [
    { key: "nameOfContractor", label: "Name of Contractor:" },
    { key: "dateOfInspection", label: "Date of Inspection:", type: "date" },
  ],
  [
    { key: "makeModel", label: "Make/Model:" },
    { key: "identificationNo", label: "Identification No.:" },
  ],
  [
    { key: "location", label: "Location:" },
    { key: "nameOfOperator", label: "Name of Operator:" },
  ],
];

function getChecklistRowsFromExcel(excelData) {
  if (!excelData || !Array.isArray(excelData) || excelData.length < 2) {
    return [];
  }
  const headers = excelData[0] || [];
  const bodyRows = excelData.slice(1);
  let questionCol = 0;
  for (let c = 0; c < headers.length; c++) {
    const h = String(headers[c] || "").toLowerCase();
    if (
      h.includes("inspection") ||
      h.includes("point") ||
      h.includes("checklist") ||
      h.includes("particular")
    ) {
      questionCol = c;
      break;
    }
  }
  return bodyRows
    .map((row) => {
      const point =
        (Array.isArray(row) ? row[questionCol] : null) != null
          ? String(row[questionCol]).trim()
          : "";
      return {
        point: point || "",
        yes: "",
        no: "",
        na: "",
        image: "",
        remark: "",
      };
    })
    .filter((r) => r.point.length > 0);
}

function getChecklistRowsFromQuestions(selectedQuestions) {
  if (
    !selectedQuestions ||
    !Array.isArray(selectedQuestions) ||
    selectedQuestions.length === 0
  ) {
    return [];
  }
  return selectedQuestions
    .map((q) => ({
      point: typeof q.text === "string" ? q.text.trim() : "",
      yes: "",
      no: "",
      na: "",
      image: "",
      remark: "",
    }))
    .filter((r) => r.point.length > 0);
}

// Auto generate Format No.
function generateFormatNo() {
  const prefix = "ADL-OH&s-C";
  const year = new Date().getFullYear();
  const random = Math.floor(100 + Math.random() * 900);
  return `${prefix}${year}-${random}`;
}

// Auto generate Revision No.
function generateRevisionNo(version = 1) {
  return `R${String(version).padStart(2, "0")}`;
}

function ObservationReportTemplate({
  excelData,
  sheetName,
  selectedQuestions,
  reportTitle: reportTitleProp,
  orgId,
  projectId,
  selectedCategoryId,
  projectName = "",
  headerFields = [],
  reportNumberConfig = { prefix: "", padding: 2 },
  onTemplateCreated,
  initialTemplateData = null,
  previewOnly = false,
  deferCreate = false,
  onReportDraftChange,
}) {
  const [createLoading, setCreateLoading] = useState(false);

  const rowsFromQuestions = useMemo(
    () => getChecklistRowsFromQuestions(selectedQuestions),
    [selectedQuestions],
  );
  const rowsFromExcel = useMemo(
    () => getChecklistRowsFromExcel(excelData),
    [excelData],
  );
  const initialChecklistRows = useMemo(
    () => (rowsFromQuestions.length > 0 ? rowsFromQuestions : rowsFromExcel),
    [rowsFromQuestions, rowsFromExcel],
  );

  const [isEditMode, setIsEditMode] = useState(false);
  const [leftLogoFile, setLeftLogoFile] = useState(null);
  const [leftLogoPreview, setLeftLogoPreview] = useState(null);
  const [rightLogoFile, setRightLogoFile] = useState(null);
  const [rightLogoPreview, setRightLogoPreview] = useState(null);

  const logoInputRef = useRef(null);
  const rightLogoInputRef = useRef(null);

  const [meta, setMeta] = useState({
    formatNo: "",
    issuedDate: "",
    project: "",
    revisionNo: "",
    revisionDate: "",
    inspectionReportNo: "",
    inspectionReportPrefix: "",
    dateOfInspection: "",
    nameOfContractor: "",
    makeModel: "",
    location: "",
    identificationNo: "",
    nameOfOperator: "",
  });

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

  const [title, setTitle] = useState("");
  const [approvedBy, setApprovedBy] = useState("");
  const [checker, setChecker] = useState("");
  const [maker, setMaker] = useState("");
  const [checklistRows, setChecklistRows] = useState(initialChecklistRows);
  const [description, setDescription] = useState("");
  const [checkedBy, setCheckedBy] = useState("");
  const [verifiedBy, setVerifiedBy] = useState("");

  // useEffect(() => {
  //   if (!onReportDraftChange) return;

  //   onReportDraftChange({
  //     title: title || reportTitleProp || "",
  //     meta,
  //     leftLogoFile,
  //     rightLogoFile,
  //   });
  // }, [
  //   title,
  //   reportTitleProp,
  //   meta,
  //   leftLogoFile,
  //   rightLogoFile,
  //   onReportDraftChange,
  // ]);

  useEffect(() => {
    if (!onReportDraftChange) return;

    onReportDraftChange({
      title: title || reportTitleProp || "",
      leftLogoFile,
      rightLogoFile,
    });
  }, [
    title,
    reportTitleProp,
    leftLogoFile,
    rightLogoFile,
    onReportDraftChange,
  ]);

  useEffect(() => {
    if (reportTitleProp != null && reportTitleProp !== "") {
      setTitle(reportTitleProp);
    }
  }, [reportTitleProp]);

  useEffect(() => {
    if (!initialTemplateData || !previewOnly) return;
    const hdr = initialTemplateData.report_header_meta || {};
    setMeta((prev) => ({
      ...prev,
      formatNo: hdr.format_no || "",
      issuedDate: hdr.issued_date || "",
      project: hdr.project || "",
      revisionNo: hdr.revision_no || "",
      revisionDate: hdr.revision_date || "",
      inspectionReportNo: hdr.inspection_report_no || "",
      inspectionReportPrefix:
        hdr.inspection_report_prefix || hdr.inspection_report_no || "",
      dateOfInspection: hdr.date_of_inspection || "",
      nameOfContractor: hdr.name_of_contractor || "",
      makeModel: hdr.make_model || "",
      location: hdr.location || "",
      identificationNo: hdr.identification_no || "",
      nameOfOperator: hdr.name_of_operator || "",
    }));
    setTitle(initialTemplateData.title || initialTemplateData.name || "");

    const BASE_URL = checklistInstance.defaults.baseURL.replace(
      /\/api\/?$/,
      "",
    );

    const buildMediaUrl = (path) => {
      if (!path) return null;

      if (path.startsWith("http")) {
        return path;
      }

      if (path.startsWith("/")) {
        return `${BASE_URL}${path}`;
      }

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

    const qs = Array.isArray(initialTemplateData.questions)
      ? initialTemplateData.questions
      : [];
    setChecklistRows(
      qs.map((q) => ({
        point: (q.text || "").trim(),
        yes: "",
        no: "",
        na: "",
        image: "",
        remark: "",
      })),
    );
  }, [initialTemplateData, previewOnly]);

  useEffect(() => {
    setChecklistRows((prev) => {
      if (prev.length === 0 && initialChecklistRows.length > 0)
        return initialChecklistRows;
      return prev;
    });
  }, [initialChecklistRows]);

  // USEFFECT TO AUTO GENERATE FORMAT NO. AND REBISION NO.
  useEffect(() => {
    setMeta((prev) => ({
      ...prev,
      formatNo: prev.formatNo || generateFormatNo(),
      revisionNo: prev.revisionNo || generateRevisionNo(),
    }));
  }, []);

  const setMetaField = (key, value) => {
    setMeta((prev) => ({ ...prev, [key]: value }));
  };

  const setChecklistRow = (index, field, value) => {
    setChecklistRows((prev) => {
      const next = [...prev];
      if (!next[index])
        next[index] = {
          point: "",
          yes: "",
          no: "",
          na: "",
          image: "",
          remark: "",
        };
      next[index][field] = value;
      return next;
    });
  };

  const addChecklistRow = () => {
    setChecklistRows((prev) => [
      ...prev,
      { point: "", yes: "", no: "", na: "", image: "", remark: "" },
    ]);
  };

  // const handleCreateTemplate = async () => {
  //   if (!orgId || !projectId || !selectedCategoryId) {
  //     toast.error("Please complete Category step and select a project and category.");
  //     return;
  //   }
  //   const titleVal = title || reportTitleProp || "Untitled Template";
  //   const templateCode = titleVal
  //     .toUpperCase()
  //     .replace(/\s+/g, "_")
  //     .replace(/[^A-Z0-9_]/g, "") || "TEMPLATE";

  //   const questions = (selectedQuestions || []).map((q, idx) => {
  //     const photoRequired = !!(q.photo_required ?? q.required);
  //     return {
  //       order_index: idx + 1,
  //       text: typeof q.text === "string" ? q.text.trim() : "",
  //       description: q.description || "",
  //       type: q.type || "multiple_choice",
  //       options: Array.isArray(q.options) ? q.options : ["Yes", "No"],
  //       required: !!q.required,
  //       photo_required: photoRequired,
  //     };
  //   });

  //   setCreateLoading(true);
  //   try {
  //     const payload = {
  //       org_id: Number(orgId),
  //       project_id: Number(projectId),
  //       category: Number(selectedCategoryId),
  //       title: titleVal,
  //       template_code: templateCode,
  //       status: "ACTIVE",
  //       report_header_meta: {
  //         format_no: meta.formatNo || "",
  //         revision_no: meta.revisionNo || "",
  //         issued_date: meta.issuedDate || "",
  //         revision_date: meta.revisionDate || "",
  //         project: meta.project || "",
  //         inspection_report_no: meta.inspectionReportNo || "",
  //         date_of_inspection: meta.dateOfInspection || "",
  //         name_of_contractor: meta.nameOfContractor || "",
  //         make_model: meta.makeModel || "",
  //         location: meta.location || "",
  //         identification_no: meta.identificationNo || "",
  //         name_of_operator: meta.nameOfOperator || "",
  //       },
  //       // Backend uses this to decide which columns to render in the final PDF.
  //       report_layout: { show_remark: true },
  //       questions,
  //     };
  //     if (logoDataUrl && logoDataUrl.startsWith("data:")) {
  //       payload.report_logo_base64 = logoDataUrl;
  //     }
  //     await createSafetyTemplate(payload);
  //     if (onTemplateCreated) onTemplateCreated();
  //   } catch (e) {
  //     console.error(e);
  //     const msg = e?.response?.data?.title?.[0]
  //       || e?.response?.data?.category?.[0]
  //       || e?.response?.data?.detail
  //       || "Failed to create template";
  //     toast.error(msg);
  //   } finally {
  //     setCreateLoading(false);
  //   }
  // };

  const handleCreateTemplate = async () => {
    if (!orgId || !projectId || !selectedCategoryId) {
      toast.error(
        "Please complete Category step and select a project and category.",
      );
      return;
    }

    const titleVal = title || reportTitleProp || "Untitled Template";
    const templateCode =
      titleVal
        .toUpperCase()
        .replace(/\s+/g, "_")
        .replace(/[^A-Z0-9_]/g, "") || "TEMPLATE";

    const questions = (selectedQuestions || []).map((q, idx) => {
      const photoRequired = !!(q.photo_required ?? q.required);
      return {
        order_index: idx + 1,
        text: typeof q.text === "string" ? q.text.trim() : "",
        description: q.description || "",
        type: q.type || "multiple_choice",
        options: Array.isArray(q.options) ? q.options : ["Yes", "No"],
        required: !!q.required,
        photo_required: photoRequired,
      };
    });

    setCreateLoading(true);
    try {
      const formData = new FormData();

      formData.append("org_id", Number(orgId));
      formData.append("project_id", Number(projectId));
      formData.append("category", Number(selectedCategoryId));
      formData.append("title", titleVal);
      formData.append("template_code", templateCode);
      formData.append("status", "ACTIVE");

      formData.append(
        "report_header_meta",
        JSON.stringify({
          format_no: meta.formatNo || "",
          revision_no: meta.revisionNo || "",
          issued_date: meta.issuedDate || "",
          revision_date: meta.revisionDate || "",
          project: meta.project || "",
          inspection_report_prefix: String(
            meta.inspectionReportPrefix || meta.inspectionReportNo || "",
          )
            .trim()
            .replace(/-$/, ""),

          inspection_report_no: "",
          date_of_inspection: meta.dateOfInspection || "",
          name_of_contractor: meta.nameOfContractor || "",
          make_model: meta.makeModel || "",
          location: meta.location || "",
          identification_no: meta.identificationNo || "",
          name_of_operator: meta.nameOfOperator || "",
        }),
      );

      formData.append("report_layout", JSON.stringify({ show_remark: true }));

      const cleanQuestions = questions.map((q, index) => {
        const { referenceImageFile, ...rest } = q;
        if (referenceImageFile) {
          formData.append(`question_image_${index}`, referenceImageFile);
        }
        return rest;
      });
      formData.append("questions", JSON.stringify(cleanQuestions));

      if (leftLogoFile) {
        formData.append("report_logo", leftLogoFile);
      }

      if (rightLogoFile) {
        formData.append("report_logo_right", rightLogoFile);
      }

      await createHousekeepingTemplate(formData);

      if (onTemplateCreated) onTemplateCreated();
    } catch (e) {
      console.error(e);
      const msg =
        e?.response?.data?.title?.[0] ||
        e?.response?.data?.category?.[0] ||
        e?.response?.data?.detail ||
        "Failed to create template";
      toast.error(msg);
    } finally {
      setCreateLoading(false);
    }
  };

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

  const displayTitle = title || reportTitleProp;
  const displayRows =
    checklistRows.length > 0
      ? checklistRows
      : [{ point: "", yes: "", no: "", na: "", image: "", remark: "" }];
  const emptyChar = "—";

  return (
    <div
      className={`${previewOnly ? "bg-transparent p-0" : "min-h-screen bg-[#f5f5f7] flex items-center justify-center p-4"}`}
    >
      <div className="w-full max-w-[1100px] bg-white rounded-lg shadow-lg border border-gray-200 p-8">
        {/* Edit button - top right */}
        <div className="flex justify-end -mt-2 -mr-2 mb-2">
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
          {!previewOnly && !deferCreate && (
            <button
              type="button"
              onClick={handleCreateTemplate}
              disabled={
                createLoading || !orgId || !projectId || !selectedCategoryId
              }
              className="ml-3 inline-flex items-center gap-2 rounded-lg border border-orange-500 bg-orange-500 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createLoading ? "Creating..." : "Create template"}
            </button>
          )}
        </div>

        {/* Header: table with 3 cells - Logo area | Meta table | Safety icon */}
        <table className="w-full text-sm border-collapse mb-1 table-fixed">
          <tbody>
            <tr>
              {/* Left cell: entire logo area; in edit mode whole cell is upload box */}
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
                    {leftLogoPreview ? (
                      <>
                        <img
                          src={leftLogoPreview}
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
                    {leftLogoPreview ? (
                      <img
                        src={leftLogoPreview}
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

              {/* Center cell: meta grid as nested table with borders */}
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

              {/* Right cell: Safety FIRST */}
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
                    {rightLogoPreview ? (
                      <>
                        <img
                          src={rightLogoPreview}
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
                    {rightLogoPreview ? (
                      <img
                        src={rightLogoPreview}
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
        <div className="flex items-center my-4 border-l-4 border-orange-500 bg-orange-100/90 px-4 py-2.5">
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

        {/* Approved / Checker / Maker - on white, right-aligned */}
        {/* <div className="flex justify-end gap-8 text-sm font-semibold text-gray-500 mb-2 pr-2">
          <span>
            Approved By:{" "}
            {isEditMode ? (
              <input
                value={approvedBy}
                onChange={(e) => setApprovedBy(e.target.value)}
                className="font-normal text-gray-900 min-w-[80px] border-0 border-b border-gray-300 bg-transparent px-0 py-0.5 outline-none focus:border-orange-500"
                placeholder={emptyChar}
              />
            ) : (
              <span className="font-normal text-gray-900">{approvedBy || emptyChar}</span>
            )}
          </span>
          <span>
            Checker:{" "}
            {isEditMode ? (
              <input
                value={checker}
                onChange={(e) => setChecker(e.target.value)}
                className="font-normal text-gray-900 min-w-[80px] border-0 border-b border-gray-300 bg-transparent px-0 py-0.5 outline-none focus:border-orange-500"
                placeholder={emptyChar}
              />
            ) : (
              <span className="font-normal text-gray-900">{checker || emptyChar}</span>
            )}
          </span>
          <span>
            Maker:{" "}
            {isEditMode ? (
              <input
                value={maker}
                onChange={(e) => setMaker(e.target.value)}
                className="font-normal text-gray-900 min-w-[80px] border-0 border-b border-gray-300 bg-transparent px-0 py-0.5 outline-none focus:border-orange-500"
                placeholder={emptyChar}
              />
            ) : (
              <span className="font-normal text-gray-900">{maker || emptyChar}</span>
            )}
          </span>
        </div> */}

        {/* Observation Horizontal Table */}
        <div className="w-full overflow-x-auto mb-6">
          <table className="w-full text-[10px] border-collapse border border-gray-400 min-w-[1200px]">
            <thead>
              <tr className="bg-[#bce6d0] text-center font-bold text-[#0b5134]">
                <th className="border border-gray-400 p-2 align-middle w-8">
                  SN
                </th>
                {INITIAL_OBSERVATION_QUESTIONS.map((q) => (
                  <th
                    key={q.id}
                    className="border border-gray-400 p-2 align-middle uppercase"
                  >
                    {q.title.replace(/^\d+\.\s*/, "").replace(/-$/, "")}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3].map((rowIdx) => (
                <tr key={rowIdx}>
                  <td className="border border-gray-400 p-2 text-center align-top font-semibold text-gray-700">
                    {rowIdx}
                  </td>
                  {INITIAL_OBSERVATION_QUESTIONS.map((q) => (
                    <td
                      key={q.id}
                      className="border border-gray-400 p-2 align-top bg-white"
                    >
                      {renderCardUI(q)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Description - bold label + underline like reference */}
        <div className="mb-8">
          <p className="font-bold text-gray-900 text-sm mb-1">Description:</p>
          {isEditMode ? (
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full mt-1 border border-gray-200 rounded px-3 py-2 text-sm text-gray-900 outline-none focus:border-orange-500"
              placeholder="Additional notes..."
            />
          ) : (
            <>
              <div className="border-b border-gray-200 w-12 mt-1" />
              <p className="min-h-[24px] mt-2 whitespace-pre-wrap text-sm text-gray-700">
                {description || emptyChar}
              </p>
            </>
          )}
        </div>

        {/* Signature footer - proper space for Checked By and Verified By */}
        <div className="flex justify-between items-stretch pt-12 pb-2 border-t-2 border-gray-200 mt-10">
          <div className="flex flex-col min-w-[200px]">
            <div className="border-b-2 border-gray-800 h-10 mb-2" aria-hidden />
            <p className="font-bold text-sm text-gray-900">
              Checked By:{" "}
              {isEditMode ? (
                <input
                  value={checkedBy}
                  onChange={(e) => setCheckedBy(e.target.value)}
                  className="font-normal border-0 border-b border-gray-300 bg-transparent p-0 outline-none focus:border-orange-500 min-w-[160px] mt-1"
                  placeholder={emptyChar}
                />
              ) : (
                <span className="font-normal">{checkedBy || emptyChar}</span>
              )}
            </p>
          </div>
          <div className="flex flex-col min-w-[200px] items-end text-right">
            <div
              className="border-b-2 border-gray-800 h-10 mb-2 w-full max-w-[200px]"
              aria-hidden
            />
            <p className="font-bold text-sm text-gray-900">
              Verified By:{" "}
              {isEditMode ? (
                <input
                  value={verifiedBy}
                  onChange={(e) => setVerifiedBy(e.target.value)}
                  className="font-normal border-0 border-b border-gray-300 bg-transparent p-0 outline-none focus:border-orange-500 min-w-[160px] text-right mt-1"
                  placeholder={emptyChar}
                />
              ) : (
                <span className="font-normal">{verifiedBy || emptyChar}</span>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ObservationReportTemplate;
