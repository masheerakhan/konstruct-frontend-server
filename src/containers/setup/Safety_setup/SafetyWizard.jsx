import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { toast } from "react-hot-toast";

import {
  getProjectsForCurrentUser,
  createSafetyTemplate,
  createHousekeepingTemplate,
  getSafetyTemplate,
  updateSafetyTemplateVersion,
} from "../../../api";
import SafetyCategory from "./SafetyCategory";
import UploadAndMapping from "./UploadAndMapping";
import FinalPreview from "./FinalPreview";
import ObservationPreview from "./ObservationPreview";
import SafetyReportTemplate from "./SafetyReportTemplate";
import SafetyHeaderFieldsConfig from "./SafetyHeaderFieldsConfig";
import SafetyFlowConfig from "./SafetyFlowConfig";
import ObservationReportTemplate from "./ObservationReportTemplate";

import HousekeepingUploadAndMapping from "../Housekeeping_setup/UploadAndMapping";
import HousekeepingFinalPreview from "../Housekeeping_setup/FinalPreview";
import HousekeepingReportTemplate from "../Housekeeping_setup/HousekeepingReportTemplate";
import HousekeepingHeaderFieldsConfig from "../Housekeeping_setup/HousekeepingHeaderFieldsConfig";
import HousekeepingFlowConfig from "../Housekeeping_setup/HousekeepingFlowConfig";
import FinalPreviewHorizontal from "./FinalPreviewHorizontal";
import SafetyReportTemplateHorizontal from "./SafetyReportTemplateHorizontal";
import SafetyReportTemplateMatrix from "./SafetyReportTemplateMatrix";

import {
  createDefaultHeaderFields,
  createObservationHeaderFields,
  normaliseHeaderFields,
  validateHeaderFields,
  validateHeaderFieldsDetailed,
  buildLegacyReportHeaderMeta,
} from "./safetyHeaderFields";

const STEPS = [
  { id: "category", label: "Category" },
  { id: "upload", label: "Upload & Select Questions" },
  { id: "preview", label: "Preview" },
  // { id: "report", label: "Create Report Template" },
  { id: "fields", label: "Configure Header Fields" },
  { id: "report", label: "Create Report Template" },
  { id: "flow", label: "Flow Config" },
];

const DEFAULT_MOVEMENT_STEPS = [
  { order_index: 1, role: "MAKER" },
  { order_index: 2, role: "CHECKER" },
];

function buildTemplateCode(title) {
  return (
    String(title || "TEMPLATE")
      .toUpperCase()
      .replace(/\s+/g, "_")
      .replace(/[^A-Z0-9_]/g, "") || "TEMPLATE"
  );
}

const toDDMMYYYY = (value) => {
  const raw = String(value || "").trim();

  if (!raw) return "";

  // yyyy-mm-dd or yyyy/mm/dd -> dd-mm-yyyy
  const isoMatch = raw.match(/^(\d{4})[-/](\d{2})[-/](\d{2})$/);
  if (isoMatch) {
    const [, yyyy, mm, dd] = isoMatch;
    return `${dd}-${mm}-${yyyy}`;
  }

  // dd-mm-yyyy or dd/mm/yyyy -> dd-mm-yyyy
  const ddmmyyyyMatch = raw.match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/);
  if (ddmmyyyyMatch) {
    const [, dd, mm, yyyy] = ddmmyyyyMatch;
    return `${dd}-${mm}-${yyyy}`;
  }

  return raw;
};

const toDateInputValue = (value) => {
  const raw = String(value || "").trim();

  if (!raw) return "";

  // already yyyy-mm-dd
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return raw;
  }

  // yyyy/mm/dd -> yyyy-mm-dd
  const ymdSlashMatch = raw.match(/^(\d{4})\/(\d{2})\/(\d{2})$/);
  if (ymdSlashMatch) {
    const [, yyyy, mm, dd] = ymdSlashMatch;
    return `${yyyy}-${mm}-${dd}`;
  }

  // dd/mm/yyyy or dd-mm-yyyy -> yyyy-mm-dd
  const ddmmyyyyMatch = raw.match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/);
  if (ddmmyyyyMatch) {
    const [, dd, mm, yyyy] = ddmmyyyyMatch;
    return `${yyyy}-${mm}-${dd}`;
  }

  return raw;
};

const isTemplateDateField = (field = {}) => {
  const key = String(field.key || "").trim();

  return (
    field.input_type === "date" ||
    ["issued_date", "revision_date", "date_of_inspection"].includes(key)
  );
};

const normalizeHeaderFieldsForPayload = (fields = []) => {
  return (fields || []).map((field) => {
    if (!isTemplateDateField(field)) return field;

    return {
      ...field,
      default_value: toDDMMYYYY(field.default_value),
    };
  });
};

const normalizeHeaderFieldsForEditor = (fields = []) => {
  return (fields || []).map((field) => {
    if (!isTemplateDateField(field)) return field;

    return {
      ...field,
      default_value: toDateInputValue(field.default_value),
    };
  });
};

function SafetyWizard() {
  const navigate = useNavigate();
  const location = useLocation();

  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [projectsLoading, setProjectsLoading] = useState(true);

  const [excelData, setExcelData] = useState(null);
  const [sheetNames, setSheetNames] = useState([]);
  const [activeSheet, setActiveSheet] = useState("");

  const [excelQuestions, setExcelQuestions] = useState([]);
  const [manualQuestions, setManualQuestions] = useState([]);
  const [finalQuestions, setFinalQuestions] = useState([]);
  const [reportTitle, setReportTitle] = useState("");
  const [excelFileName, setExcelFileName] = useState("");

  const [movementSteps, setMovementSteps] = useState(DEFAULT_MOVEMENT_STEPS);
  const [reportDraft, setReportDraft] = useState(null);
  const [creatingTemplate, setCreatingTemplate] = useState(false);

  // M3.6: Lifted states for Horizontal parsing
  const [formatMode, setFormatMode] = useState(null);
  const [horizontalSchema, setHorizontalSchema] = useState(null);
  const [parserError, setParserError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  const [isEditMode, setIsEditMode] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState(null);
  const [editLoading, setEditLoading] = useState(false);

  const [headerFields, setHeaderFields] = useState(() =>
    createDefaultHeaderFields(),
  );

  const [reportNumberConfig, setReportNumberConfig] = useState({
    prefix: "",
    padding: 2,
  });

  const [tillApprove, setTillApprove] = useState(true);
  const [roundCount, setRoundCount] = useState(1);

  const selectedProject = Array.isArray(projects)
    ? projects.find((p) => String(p.id) === String(selectedProjectId))
    : null;

  const selectedOrgId = selectedProject?.org_id;

  const selectedCategory = Array.isArray(categories)
    ? categories.find((c) => String(c.id) === String(selectedCategoryId))
    : null;
  const isObservationFlow =
    selectedCategory?.name?.toLowerCase() ===
    "safety & housekeeping observation";

  const activeSteps = isObservationFlow
    ? STEPS.filter((s) => s.id !== "upload").map((s) => {
        if (s.id === "fields") return { ...s, label: "Header Fields" };
        if (s.id === "report") return { ...s, label: "Report Template" };
        return s;
      })
    : STEPS;

  useEffect(() => {
    if (isObservationFlow) {
      setHeaderFields(createObservationHeaderFields());
      setReportNumberConfig({ prefix: "AN-ADL-SHOR", padding: 2 });
    } else {
      setHeaderFields(createDefaultHeaderFields());
      setReportNumberConfig({ prefix: "", padding: 2 });
    }
  }, [isObservationFlow]);

  // Project Loading
  useEffect(() => {
    const load = async () => {
      setProjectsLoading(true);

      try {
        const res = await getProjectsForCurrentUser();
        const raw = res?.data ?? res;
        const list = Array.isArray(raw) ? raw : (raw?.results ?? []);

        const mapped = list.map((p) => ({
          id: p.id,
          name:
            p.name || p.project_name || p.project_title || `Project #${p.id}`,
          org_id: p.organization_id ?? p.org_id ?? p.org,
        }));

        setProjects(mapped);

        if (mapped.length && !selectedProjectId) {
          setSelectedProjectId(String(mapped[0].id));
        }
      } catch (e) {
        console.error(e);

        const status = e?.response?.status;
        const msg =
          status === 404
            ? "Projects service not available. Please ensure the backend is running."
            : e?.response?.data?.detail ||
              e?.message ||
              "Failed to load projects";

        toast.error(msg);
        setProjects([]);
      } finally {
        setProjectsLoading(false);
      }
    };

    load();
  }, []);

  // Template Edit
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const templateId = params.get("editTemplateId");

    if (!templateId) return;

    const loadTemplateForEdit = async () => {
      setEditLoading(true);

      try {
        const res = await getSafetyTemplate(templateId);
        const template = res?.data ?? res;

        setIsEditMode(true);
        setEditingTemplateId(template.id);

        setSelectedCategoryId(
          String(template.category || template.category_id || ""),
        );
        setSelectedProjectId(String(template.project_id || ""));
        setReportTitle(template.title || template.name || "");

        const cleanQuestions = buildQuestionsFromTemplate(template);
        const layout = template.report_layout || {};
        const isHorizontal =
          layout.is_horizontal === true ||
          String(layout.table_style || "").toLowerCase() === "horizontal";

        const isMatrix =
          layout.is_matrix === true ||
          String(layout.matrix_type || "").startsWith("MATRIX");

        if (isHorizontal || isMatrix) {
          const mode =
            layout.horizontal_format ||
            layout.matrix_type ||
            "HORIZONTAL_TYPE_A";

          setFormatMode(mode);

          setHorizontalSchema({
            success: true,
            type: mode,
            headers: cleanQuestions.map((q) => ({
              text: q.text,
              type: q.type,
              options: q.options || [],
              required: q.required || false,
              photo_required: q.photo_required || false,
              reference_image_url: q.reference_image_url || null,
            })),
            matrixColumns: layout.matrix_columns || 0,
          });

          setExcelQuestions([]);
          setManualQuestions([]);
          setFinalQuestions([]);
        } else {
          setFormatMode(null);
          setHorizontalSchema(null);
          setExcelQuestions([]);
          setManualQuestions(cleanQuestions);
          setFinalQuestions(cleanQuestions);
        }

        setHeaderFields(
          Array.isArray(template.header_fields) && template.header_fields.length
            ? normalizeHeaderFieldsForEditor(template.header_fields)
            : createDefaultHeaderFields(),
        );

        setReportNumberConfig({
          prefix:
            template.report_number_config?.prefix ||
            template.report_header_meta?.inspection_report_prefix ||
            "",
          padding: Number(template.report_number_config?.padding || 2),
        });

        const { tillApproveValue, roundCountValue } =
          getRepeatConfigFromTemplate(template);

        setTillApprove(tillApproveValue);
        setRoundCount(roundCountValue);

        const workflow =
          template.flow_config ||
          template.workflow_assignments ||
          template.movement_steps ||
          [];

        if (Array.isArray(workflow) && workflow.length) {
          setMovementSteps(
            workflow.map((step, index) => ({
              order_index: step.order_index || index + 1,
              role: step.role || "MAKER",
              assigned_questions: step.assigned_questions || [],
            })),
          );
        } else {
          setMovementSteps(DEFAULT_MOVEMENT_STEPS);
        }

        setReportDraft({
          title: template.title || template.name || "",
          meta: template.report_header_meta || {},
          leftLogoFile: null,
          rightLogoFile: null,
          instructionImageFile: null,
          leftLogoUrl: template.report_logo || template.report_logo_url || null,
          rightLogoUrl:
            template.report_logo_right ||
            template.report_logo_right_url ||
            null,
          instructionImageUrl:
            template.instruction_image ||
            template.instruction_image_url ||
            null,
          instructionText: template.instruction_text || "",
        });

        setCurrentStepIndex(0);
      } catch (err) {
        console.error(err);
        toast.error(
          err?.response?.data?.detail ||
            err?.message ||
            "Failed to load template for edit.",
        );
      } finally {
        setEditLoading(false);
      }
    };

    loadTemplateForEdit();
  }, [location.search]);

  const currentStep = activeSteps[currentStepIndex];

  const handleSheetChange = (sheetName) => {
    setActiveSheet(sheetName);
  };

  const goPrev = () => {
    if (currentStepIndex === 0) return;
    setCurrentStepIndex((i) => i - 1);
  };

  const normalizeTemplateOptions = (options) => {
    if (Array.isArray(options)) {
      return options
        .map((opt) => {
          if (opt == null) return "";
          if (typeof opt === "object") {
            return opt.label || opt.name || opt.value || "";
          }
          return String(opt);
        })
        .filter(Boolean);
    }

    if (typeof options === "string" && options.trim()) {
      try {
        const parsed = JSON.parse(options);
        if (Array.isArray(parsed)) {
          return parsed.map(String).filter(Boolean);
        }
      } catch {
        return [options];
      }
    }

    return [];
  };

  const buildQuestionsFromTemplate = (template) => {
    return (template?.questions || []).map((q, index) => ({
      id: q.id || `edit-q-${index + 1}`,
      text: q.text || q.title || "",
      description: q.description || "",
      type: q.type || q.input_type || "multiple_choice",
      options: normalizeTemplateOptions(q.options),
      required: Boolean(q.required),
      photo_required: Boolean(q.photo_required),
      has_secondary: Boolean(q.has_secondary),
      secondary_type: q.secondary_type || "short_answer",
      secondary_options: normalizeTemplateOptions(q.secondary_options),
      order_index: q.order_index || index + 1,
      reference_image_url: q.reference_image_url || q.reference_image || null,
    }));
  };

  const getRepeatConfigFromTemplate = (template) => {
    const layout = template?.report_layout || {};
    const repeatConfig = layout.repeat_config || {};

    const mode = repeatConfig.mode || "TILL_APPROVED";
    const count = repeatConfig.count || 1;

    return {
      tillApproveValue: mode === "TILL_APPROVED",
      roundCountValue: Number(count || 1),
    };
  };

  const handleCreateTemplate = async () => {
    if (!selectedOrgId || !selectedProjectId || !selectedCategoryId) {
      toast.error("Please complete Category step and select project/category.");
      return;
    }

    const isHorizontal =
      formatMode === "HORIZONTAL_TYPE_A" || formatMode === "HORIZONTAL_TYPE_B";
    const isMatrix =
      formatMode === "MATRIX_DAILY" || formatMode === "MATRIX_WEEKLY";
    const useExtractedSchema = isHorizontal || isMatrix;

    if (!useExtractedSchema && !finalQuestions.length) {
      toast.error("Please add at least one question.");
      return;
    }

    if (useExtractedSchema && !(horizontalSchema?.headers || []).length) {
      toast.error("Please add at least one column/question.");
      return;
    }

    const validSteps = (movementSteps || []).filter((step) => step.role);

    if (!validSteps.length) {
      toast.error("Please configure at least one flow step.");
      return;
    }

    const headerValidationError = validateHeaderFields(
      headerFields,
      reportNumberConfig,
    );

    if (headerValidationError) {
      toast.error(headerValidationError);
      setCurrentStepIndex(
        activeSteps.findIndex((step) => step.id === "fields"),
      );
      return;
    }

    const cleanHeaderFields = normalizeHeaderFieldsForPayload(
      normaliseHeaderFields(headerFields),
    );

    const titleVal = reportDraft?.title || reportTitle || "Untitled Template";

    let questions = [];

    if (useExtractedSchema) {
      questions = (horizontalSchema?.headers || []).map((h, idx) => {
        const type = h.type || "short_answer";
        const opts =
          type === "multiple_choice"
            ? Array.isArray(h.options)
              ? h.options
              : []
            : type === "date" && h.autoFetchOneMonth
              ? ["autoFetchOneMonth"]
              : [];
        return {
          order_index: idx + 1,
          text: typeof h.text === "string" ? h.text.trim() : "",
          description: "",
          type: type,
          options: opts,
          required: false,
          photo_required: false,
          referenceImageFile: h.referenceImageFile,
        };
      });
    } else {
      questions = (finalQuestions || []).map((q, idx) => {
        const photoRequired = !!(q.photo_required ?? q.required);

        let safeType = q.type || "multiple_choice";
        // Map custom observation types to valid backend choices
        if (
          [
            "dropdown_with_secondary",
            "hazard_risk_combined",
            "contractor_dropdown",
          ].includes(safeType)
        ) {
          safeType = "multiple_choice";
        } else if (["location_combined", "ca_pa_combined"].includes(safeType)) {
          safeType = "paragraph";
        }

        return {
          order_index: idx + 1,
          text: typeof q.text === "string" ? q.text.trim() : "",
          description: q.description || "",
          type: safeType,
          options: Array.isArray(q.options) ? q.options : ["Yes", "No", "N/A"],
          required: !!q.required,
          photo_required: photoRequired,
          has_secondary: !!q.has_secondary,
          secondary_type: q.secondary_type || "short_answer",
          secondary_options: Array.isArray(q.secondary_options)
            ? q.secondary_options
            : [],
        };
      });
    }

    // const workflowConfig = validSteps.map((step, idx) => ({
    //     order_index: idx + 1,
    //     role: step.role,
    //     user_id: Number(step.user_id),
    //     user_name: step.user_name || "",
    // }));

    const workflowConfig = validSteps.map((step, idx) => {
      const assigned =
        step.assigned_questions || finalQuestions.map((_, i) => i);
      return {
        order_index: idx + 1,
        role: step.role,
        assigned_questions: assigned,
      };
    });

    // const meta = reportDraft?.meta || {};

    setCreatingTemplate(true);

    try {
      const formData = new FormData();

      formData.append("org_id", Number(selectedOrgId));
      formData.append("project_id", Number(selectedProjectId));
      formData.append("category", Number(selectedCategoryId));
      formData.append("title", titleVal);
      formData.append("template_code", buildTemplateCode(titleVal));
      formData.append("status", "ACTIVE");

      formData.append("header_fields", JSON.stringify(cleanHeaderFields));

      formData.append(
        "report_number_config",
        JSON.stringify({
          prefix: String(reportNumberConfig.prefix || "")
            .trim()
            .replace(/-+$/, ""),
          padding: Number(reportNumberConfig.padding || 2),
        }),
      );

      /*
                Keep report_header_meta temporarily for backward compatibility
                with old backend/list screens while frontend migration is ongoing.
                New dynamic rendering should use header_fields.
            */
      const legacyMeta = buildLegacyReportHeaderMeta(
        cleanHeaderFields,
        reportNumberConfig,
      );
      if (reportDraft?.description)
        legacyMeta.description = reportDraft.description;
      if (reportDraft?.checkedBy) legacyMeta.checked_by = reportDraft.checkedBy;
      if (reportDraft?.verifiedBy)
        legacyMeta.verified_by = reportDraft.verifiedBy;

      formData.append("report_header_meta", JSON.stringify(legacyMeta));

      const reportLayoutObj = {
        show_remark: true,
        repeat_config: {
          mode: tillApprove ? "TILL_APPROVED" : "COUNT",
          count: tillApprove ? null : Number(roundCount || 1),
        },
      };

      if (isHorizontal) {
        reportLayoutObj.is_horizontal = true;
        reportLayoutObj.horizontal_format = formatMode;
      } else if (isMatrix) {
        reportLayoutObj.is_matrix = true;
        reportLayoutObj.matrix_type = formatMode;
        reportLayoutObj.matrix_columns = horizontalSchema?.matrixColumns || 0;
      }

      formData.append("report_layout", JSON.stringify(reportLayoutObj));

      formData.append("flow_config", JSON.stringify(workflowConfig));

      const cleanQuestions = questions.map((q, index) => {
        const { referenceImageFile, ...rest } = q;
        if (referenceImageFile) {
          formData.append(`question_image_${index}`, referenceImageFile);
        }
        return rest;
      });

      formData.append("questions", JSON.stringify(cleanQuestions));

      if (reportDraft?.leftLogoFile) {
        formData.append("report_logo", reportDraft.leftLogoFile);
      }

      if (reportDraft?.rightLogoFile) {
        formData.append("report_logo_right", reportDraft.rightLogoFile);
      }

      if (reportDraft?.instructionImageFile) {
        formData.append("instruction_image", reportDraft.instructionImageFile);
      }

      formData.append("instruction_text", reportDraft?.instructionText || "");

      if (isEditMode && editingTemplateId) {
        formData.append(
          "template_type",
          isObservationFlow ? "OBSERVATION" : "SAFETY",
        );

        await updateSafetyTemplateVersion(editingTemplateId, formData);

        toast.success("Template updated successfully. New version created.");
      } else if (isObservationFlow) {
        formData.append("template_type", "OBSERVATION");
        await createHousekeepingTemplate(formData);

        toast.success("Template created successfully.");
      } else {
        formData.append("template_type", "SAFETY");
        await createSafetyTemplate(formData);

        toast.success("Template created successfully.");
      }

      navigate("/safetySetup");
    } catch (e) {
      console.error(e);

      let msg = isEditMode
        ? "Failed to update template"
        : "Failed to create template";
      if (e?.response?.data) {
        if (typeof e.response.data === "string") {
          msg = e.response.data;
        } else {
          const data = e.response.data;
          msg =
            data.title?.[0] ||
            data.category?.[0] ||
            data.detail ||
            JSON.stringify(data);
        }
      }
      toast.error(msg);
    } finally {
      setCreatingTemplate(false);
    }
  };

  const [unconvertedRowsCount, setUnconvertedRowsCount] = useState(0);

  const validateStep = (stepId, silent = false) => {
    const error = (id, msg) => {
      if (!silent) {
        toast.error(msg);
        setValidationErrors((prev) => ({ ...prev, [id]: true }));
        setTimeout(() => {
          const el = document.getElementById(id);
          if (el) {
            el.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
            setTimeout(() => {
              el.focus({ preventScroll: true });
            }, 500);
          }
        }, 100);

        if (id === "btn-convert-questions") {
          setTimeout(() => {
            setValidationErrors((prev) => ({ ...prev, [id]: false }));
          }, 3000);
        }
      }
      return false;
    };

    switch (stepId) {
      case "category":
        if (!selectedProjectId)
          return error("project-select", "Please select a Project.");
        if (!selectedCategoryId)
          return error("category-select", "Please select a Category.");
        return true;

      case "upload":
        const isHoriz =
          formatMode === "HORIZONTAL_TYPE_A" ||
          formatMode === "HORIZONTAL_TYPE_B" ||
          formatMode === "MATRIX_DAILY" ||
          formatMode === "MATRIX_WEEKLY";
        if (isHoriz && !(horizontalSchema?.headers || []).length)
          return (
            !silent && toast.error("Please upload a valid template."),
            false
          );

        // M6.8.3 Validation: Block Next if rows are selected but not converted
        if (!isHoriz && excelData && unconvertedRowsCount > 0) {
          return error(
            "btn-convert-questions",
            "You have selected rows but have not converted them yet. Click 'Convert to Questions' before continuing.",
          );
        }

        if (!isHoriz && !(excelQuestions.length || manualQuestions.length))
          return (
            !silent && toast.error("Please add at least one question."),
            false
          );
        return true;

      case "preview":
        const isH =
          formatMode === "HORIZONTAL_TYPE_A" ||
          formatMode === "HORIZONTAL_TYPE_B" ||
          formatMode === "MATRIX_DAILY" ||
          formatMode === "MATRIX_WEEKLY";
        if (isH) {
          const headers = horizontalSchema?.headers || [];
          for (let i = 0; i < headers.length; i++) {
            if (!String(headers[i].text || "").trim())
              return error(
                `header-text-${i}`,
                "Column headers cannot be empty.",
              );
            if (
              headers[i].type === "multiple_choice" &&
              (!headers[i].options ||
                headers[i].options.filter((o) => String(o).trim()).length < 2)
            ) {
              return error(
                `header-options-${i}`,
                "Multiple choice columns must have at least two valid options.",
              );
            }
          }
        } else {
          const qList = finalQuestions || [];
          for (let i = 0; i < qList.length; i++) {
            if (!String(qList[i].text || "").trim())
              return error(
                `question-card-${i}`,
                "Questions cannot have empty text.",
              );
          }
        }
        return true;

      case "fields":
        const headerErr = validateHeaderFieldsDetailed(
          headerFields,
          reportNumberConfig,
        );
        if (headerErr) {
          if (headerErr.fieldId) {
            return error(headerErr.fieldId, headerErr.error);
          } else {
            return (!silent && toast.error(headerErr.error), false);
          }
        }
        return true;

      case "flow":
        if (!(movementSteps || []).filter((step) => step.role).length)
          return (
            !silent && toast.error("Please configure at least one flow step."),
            false
          );
        return true;

      default:
        return true;
    }
  };

  const goNext = () => {
    if (!validateStep(currentStep.id, false)) return;

    const isLast = currentStepIndex === activeSteps.length - 1;

    if (currentStep.id === "upload") {
      setFinalQuestions([...excelQuestions, ...manualQuestions]);
    }

    if (isLast) {
      handleCreateTemplate();
      return;
    }

    setCurrentStepIndex((i) => Math.min(i + 1, activeSteps.length - 1));
  };

  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === activeSteps.length - 1;
  const isCurrentStepValid = validateStep(currentStep.id, true);
  const isWizardValid = activeSteps.every((s) => validateStep(s.id, true));

  const handleClearError = (id) =>
    setValidationErrors((prev) => ({ ...prev, [id]: false }));

  const renderStepContent = () => {
    switch (currentStep.id) {
      case "category":
        return (
          <SafetyCategory
            categories={Array.isArray(categories) ? categories : []}
            setCategories={setCategories}
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={setSelectedCategoryId}
            projects={Array.isArray(projects) ? projects : []}
            selectedProjectId={selectedProjectId}
            onSelectProject={setSelectedProjectId}
            orgId={selectedOrgId}
            projectId={selectedProjectId}
            projectsLoading={projectsLoading}
            validationErrors={validationErrors}
            onClearError={handleClearError}
          />
        );

      case "upload":
        const handleUploadComplete = (
          rows,
          sheetNamesFromUpload,
          activeSheetName,
          fileName,
        ) => {
          let cleanName = activeSheetName || "Uploaded Form";
          if (fileName) {
            cleanName = fileName.replace(/\.[^/.]+$/, "");
          }
          setExcelFileName(cleanName);
          setReportTitle(cleanName);
        };

        if (isObservationFlow) {
          return (
            <HousekeepingUploadAndMapping
              excelData={excelData}
              setExcelData={setExcelData}
              sheetNames={sheetNames}
              setSheetNames={setSheetNames}
              activeSheet={activeSheet}
              setActiveSheet={setActiveSheet}
              excelQuestions={excelQuestions}
              setExcelQuestions={setExcelQuestions}
              manualQuestions={manualQuestions}
              setManualQuestions={setManualQuestions}
              onUploadComplete={handleUploadComplete}
              onSheetChange={handleSheetChange}
              onBack={goPrev}
            />
          );
        }
        return (
          <UploadAndMapping
            excelData={excelData}
            setExcelData={setExcelData}
            sheetNames={sheetNames}
            setSheetNames={setSheetNames}
            activeSheet={activeSheet}
            setActiveSheet={setActiveSheet}
            excelQuestions={excelQuestions}
            setExcelQuestions={setExcelQuestions}
            manualQuestions={manualQuestions}
            setManualQuestions={setManualQuestions}
            onUploadComplete={handleUploadComplete}
            onSheetChange={handleSheetChange}
            onBack={goPrev}
            onUnconvertedRowsChange={setUnconvertedRowsCount}
            validationErrors={validationErrors}
            onClearError={handleClearError}
            formatMode={formatMode}
            setFormatMode={setFormatMode}
            horizontalSchema={horizontalSchema}
            setHorizontalSchema={setHorizontalSchema}
            parserError={parserError}
            setParserError={setParserError}
            isEditMode={isEditMode}
          />
        );

      case "preview":
        if (isObservationFlow) {
          return (
            <ObservationPreview
              onBack={goPrev}
              onSave={(questions, userDetails, formTitle) => {
                setFinalQuestions(questions);
                if (formTitle != null && formTitle !== undefined) {
                  setReportTitle(formTitle);
                }
              }}
            />
          );
        }

        if (
          formatMode === "HORIZONTAL_TYPE_A" ||
          formatMode === "HORIZONTAL_TYPE_B" ||
          formatMode === "MATRIX_DAILY" ||
          formatMode === "MATRIX_WEEKLY"
        ) {
          return (
            <FinalPreviewHorizontal
              schema={horizontalSchema}
              initialTitle={reportTitle}
              onBack={() => setCurrentStepIndex(1)}
              onSave={(updatedSchema, formTitle) => {
                setHorizontalSchema(updatedSchema);
                if (formTitle != null && formTitle !== undefined) {
                  setReportTitle(formTitle);
                }
              }}
              validationErrors={validationErrors}
              onClearError={handleClearError}
            />
          );
        }
        return (
          <FinalPreview
            initialQuestions={finalQuestions}
            onBack={goPrev}
            onSave={(questions, userDetails, formTitle) => {
              setFinalQuestions(questions);

              if (formTitle != null && formTitle !== undefined) {
                setReportTitle(formTitle);
              }
            }}
            validationErrors={validationErrors}
            onClearError={handleClearError}
          />
        );

      case "report":
        if (isObservationFlow) {
          return (
            <ObservationReportTemplate
              excelData={excelData}
              sheetName={activeSheet}
              selectedQuestions={finalQuestions}
              reportTitle={reportTitle}
              orgId={selectedOrgId}
              projectId={selectedProjectId}
              selectedCategoryId={selectedCategoryId}
              projectName={selectedProject?.name || ""}
              headerFields={headerFields}
              reportNumberConfig={reportNumberConfig}
              deferCreate
              onReportDraftChange={setReportDraft}
              draftData={reportDraft}
              isObservationFlow={true}
            />
          );
        }

        if (
          formatMode === "HORIZONTAL_TYPE_A" ||
          formatMode === "HORIZONTAL_TYPE_B"
        ) {
          return (
            <SafetyReportTemplateHorizontal
              schema={horizontalSchema}
              reportTitle={
                reportDraft?.title || reportTitle || "Untitled Template"
              }
              projectName={selectedProject?.name || ""}
              headerFields={headerFields}
              reportNumberConfig={reportNumberConfig}
              meta={reportDraft?.meta || {}}
              leftLogoFile={reportDraft?.leftLogoFile}
              rightLogoFile={reportDraft?.rightLogoFile}
              instructionImageFile={reportDraft?.instructionImageFile}
              instructionText={reportDraft?.instructionText || ""}
              previewOnly={false}
              onReportDraftChange={setReportDraft}
            />
          );
        }

        if (formatMode === "MATRIX_DAILY" || formatMode === "MATRIX_WEEKLY") {
          return (
            <SafetyReportTemplateMatrix
              schema={horizontalSchema}
              onSchemaChange={setHorizontalSchema}
              reportTitle={
                reportDraft?.title || reportTitle || "Untitled Template"
              }
              projectName={selectedProject?.name || ""}
              headerFields={headerFields}
              reportNumberConfig={reportNumberConfig}
              meta={reportDraft?.meta || {}}
              leftLogoFile={reportDraft?.leftLogoFile}
              rightLogoFile={reportDraft?.rightLogoFile}
              instructionImageFile={reportDraft?.instructionImageFile}
              instructionText={reportDraft?.instructionText || ""}
              previewOnly={false}
              onReportDraftChange={setReportDraft}
            />
          );
        }

        return (
          <SafetyReportTemplate
            excelData={excelData}
            sheetName={activeSheet}
            selectedQuestions={finalQuestions}
            reportTitle={reportTitle}
            orgId={selectedOrgId}
            projectId={selectedProjectId}
            selectedCategoryId={selectedCategoryId}
            projectName={selectedProject?.name || ""}
            headerFields={headerFields}
            reportNumberConfig={reportNumberConfig}
            deferCreate
            onReportDraftChange={setReportDraft}
            instructionText={reportDraft?.instructionText || ""}
          />
        );

      case "flow":
        if (isObservationFlow) {
          return (
            <HousekeepingFlowConfig
              movementSteps={movementSteps}
              setMovementSteps={setMovementSteps}
              tillApprove={tillApprove}
              setTillApprove={setTillApprove}
              roundCount={roundCount}
              setRoundCount={setRoundCount}
              finalQuestions={finalQuestions}
              isObservationFlow={true}
            />
          );
        }
        return (
          <SafetyFlowConfig
            movementSteps={movementSteps}
            setMovementSteps={setMovementSteps}
            tillApprove={tillApprove}
            setTillApprove={setTillApprove}
            roundCount={roundCount}
            setRoundCount={setRoundCount}
            finalQuestions={finalQuestions}
          />
        );

      case "fields":
        return (
          <SafetyHeaderFieldsConfig
            headerFields={headerFields}
            setHeaderFields={setHeaderFields}
            reportNumberConfig={reportNumberConfig}
            setReportNumberConfig={setReportNumberConfig}
            projectName={selectedProject?.name || ""}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] flex flex-col">
      <header className="border-b border-orange-100 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-center gap-4 overflow-x-auto">
            {activeSteps.map((step, index) => {
              const isActive = index === currentStepIndex;
              const isCompleted = index < currentStepIndex;

              return (
                <div key={step.id} className="flex items-center shrink-0">
                  <button
                    type="button"
                    className={`flex items-center gap-2 text-xs font-medium ${
                      isActive
                        ? "text-orange-600"
                        : isCompleted
                          ? "text-green-600"
                          : "text-gray-400"
                    }`}
                    onClick={() => setCurrentStepIndex(index)}
                  >
                    <span
                      className={`h-6 w-6 flex items-center justify-center rounded-full text-[11px] ${
                        isActive
                          ? "bg-orange-500 text-white"
                          : isCompleted
                            ? "bg-green-500 text-white"
                            : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {index + 1}
                    </span>

                    <span>{step.label}</span>
                  </button>

                  {index < activeSteps.length - 1 && (
                    <div className="mx-2 h-px w-8 bg-gray-200" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-6 flex justify-center">
        <div className="w-full max-w-6xl space-y-6">
          {isEditMode && (
            <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800">
              <b>Edit Mode:</b> Updating this template will create a new
              version. Existing submitted checklists will remain linked to the
              old version.
            </div>
          )}
          {renderStepContent()}

          <div className="mt-6 flex justify-between items-center">
            <button
              type="button"
              onClick={goPrev}
              disabled={isFirstStep || creatingTemplate}
              className={`inline-flex items-center px-4 py-2 rounded-xl border text-sm ${
                isFirstStep || creatingTemplate
                  ? "border-gray-200 text-gray-300 cursor-not-allowed"
                  : "border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Previous
            </button>

            <button
              type="button"
              onClick={(e) => {
                if (isLastStep && !isWizardValid) {
                  e.preventDefault();
                  const firstInvalidIndex = STEPS.findIndex(
                    (s) => !validateStep(s.id, true),
                  );
                  if (firstInvalidIndex !== -1) {
                    setCurrentStepIndex(firstInvalidIndex);
                    setTimeout(
                      () => validateStep(STEPS[firstInvalidIndex].id, false),
                      100,
                    );
                  }
                  return;
                }
                if (!isLastStep && !isCurrentStepValid) {
                  e.preventDefault();
                  validateStep(currentStep.id, false);
                  return;
                }
                goNext();
              }}
              className={`inline-flex items-center px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                creatingTemplate
                  ? "bg-orange-300 text-white cursor-wait"
                  : (isLastStep ? isWizardValid : isCurrentStepValid)
                    ? "bg-orange-500 text-white hover:bg-orange-600"
                    : "bg-orange-300 text-white cursor-not-allowed opacity-70"
              }`}
            >
              {isLastStep
                ? creatingTemplate
                  ? isEditMode
                    ? "Updating..."
                    : "Creating..."
                  : isEditMode
                    ? "Update Template"
                    : "Create Template"
                : "Next"}
              <ArrowRight className="ml-1 h-4 w-4" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default SafetyWizard;
