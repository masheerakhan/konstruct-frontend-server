import React, { useEffect, useMemo, useState, useRef } from "react";
import * as XLSX from "xlsx";
import {
  ArrowLeft,
  CheckCircle,
  Copy,
  FileText,
  Plus,
  Save,
  Send,
  Trash2,
} from "lucide-react";

import {
  listPermitTemplateBuilderTemplates,
  getPermitTemplateBuilderTemplate,
  createPermitTemplateBuilderTemplate,
  updatePermitTemplateBuilderTemplate,
  clonePermitTemplateBuilderTemplate,
  publishPermitTemplateBuilderTemplate,
  deletePermitTemplateBuilderTemplate,
  getUserGroups,
} from "../../../../api";
import {  resolveMediaUrl } from "../../../../lib/utils"

import { showToast } from "../../../../utils/toast";

const extractErrorMessage = (err, fallback) => {
  const data = err?.response?.data;
  if (typeof data === "string") return data;
  if (Array.isArray(data)) return data.join(" ");
  if (data?.detail) return data.detail;
  if (data?.message) return data.message;
  if (data && typeof data === "object") {
    const firstKey = Object.keys(data)[0];
    if (firstKey) {
      const val = data[firstKey];
      return Array.isArray(val)
        ? `${firstKey}: ${val.join(" ")}`
        : `${firstKey}: ${val}`;
    }
  }
  return err?.message || fallback;
};

const PPE_OPTIONS = [
  "Safety Helmet",
  "Safety Goggles / Face Shield",
  "Ear Plug / Ear Muff",
  "Dust Mask / Canister Mask",
  "Shoulder Pad",
  "Hand Gloves",
  "High Visibility Reflective Jacket",
  "Apron / Boiler Suit",
  "Safety Shoes",
  "Full Body Harness",
  "Fall Arrestor",
];

const FIELD_TYPES = [
  "text",
  "textarea",
  "number",
  "boolean",
  "date",
  "time",
  "datetime",
  "select",
  "multi_select",
];

const SIGNER_TYPES = [
  {
    value: "creator",
    label: "Permit Creator / Maker",
  },
  {
    value: "group",
    label: "User Group",
  },
];

const getSignerType = (box) =>
  box?.layout_config?.signer_type || box?.signer_type || "group";

const QUESTION_INPUT_TYPES = [
  "single_choice",
  "multi_select",
  "text",
  "textarea",
  "number",
  "date",
  "time",
  "checkbox",
];

const SOURCE_TYPES = ["maker_input", "system_generated", "template_fixed"];

const SIGNATURE_ACTIONS = [
  "submit",
  "approve",
  "forward",
  "request_closure",
  "reject",
];

const SIGNATURE_PRESETS = [
  {
    key: "issue_maker_signature",
    label: "Permit Applicant / Maker",
    section: "issue_applicant_declaration",
    signer_type: "creator",
    required_status: "draft",
    action: "submit",
  },
  {
    key: "issue_checker_signature",
    label: "Issue Checker / Safety Officer",
    section: "issue_verification",
    signer_type: "group",
    required_status: "issue_in_progress",
    action: "approve",
  },
  {
    key: "closure_maker_signature",
    label: "Closure Requested By / Maker",
    section: "closure_request",
    signer_type: "creator",
    required_status: "issued",
    action: "request_closure",
  },
  {
    key: "closure_checker_signature",
    label: "Closure Checker / Safety Officer",
    section: "closure_verification",
    signer_type: "group",
    required_status: "closure_in_progress",
    action: "approve",
  },
];

const STATUS_OPTIONS = [
  "",
  "draft",
  "issue_in_progress",
  "issued",
  "closure_in_progress",
  "closed",
];

const EMPTY_TEMPLATE = {
  code: "",
  ptw_prefix: "",
  name: "",
  status: "draft",
  description: "",
  format_no: "",
  ref_no: "",
  issued_date_text: "",
  revision_no: "",

  left_logo: null,
  right_logo: null,
  left_logo_url: "",
  right_logo_url: "",
  remove_left_logo: false,
  remove_right_logo: false,

  header_config: {
    show_project: true,
    show_ptw_no: true,
    show_format_no: true,
    show_ref_no: true,
    show_revision: true,
    show_issued_date: true,
  },
  layout_config: {},
  ppe_config: {},
  special_sections: [],
  print_config: {},
  fields: [],
  checklist_sections: [],
  checklist_questions: [],
  signature_boxes: [],
};

const makeSectionId = () =>
  `section_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

const parseOptionsText = (value) => {
  return String(value || "")
    .split("\n")
    .map((v) => v.trim())
    .filter(Boolean)
    .map((value) => ({ value }));
};

const optionsToText = (options) => {
  return (options || [])
    .map((opt) => (typeof opt === "object" ? opt.value : opt))
    .filter(Boolean)
    .join("\n");
};

const normalizeTemplateForEdit = (template) => ({
  code: template.code || "",
  ptw_prefix: template.ptw_prefix || "",
  name: template.name || "",
  status: template.status || "draft",
  description: template.description || "",
  format_no: template.format_no || "",
  ref_no: template.ref_no || "",
  issued_date_text: template.issued_date_text || "",
  revision_no: template.revision_no || "",

  left_logo: null,
  right_logo: null,
  left_logo_url: template.left_logo_url || template.left_logo || "",
  right_logo_url: template.right_logo_url || template.right_logo || "",
  remove_left_logo: false,
  remove_right_logo: false,

  header_config: template.header_config || EMPTY_TEMPLATE.header_config,
  layout_config: template.layout_config || {},
  ppe_config: template.ppe_config || {},
  special_sections: template.special_sections || [],
  print_config: template.print_config || {},
  fields: (template.fields || []).map((f) => ({
    key: f.field_definition?.key || "",
    label: f.field_definition?.label || "",
    field_type: f.field_definition?.field_type || "text",
    required_override: Boolean(f.required_override),
    source_type: f.source_type || "maker_input",
    sort_order: f.sort_order || 0,
    validation_rules: f.field_definition?.validation_rules || {},
    visibility_rules: f.visibility_rules || {},
    help_text: f.field_definition?.help_text || "",
  })),
  checklist_sections: (template.sections || []).map((s) => ({
    id: s.id || null,
    client_id: s.client_id || `existing_section_${s.id}`,
    title: s.title || "",
    description: s.description || "",
    sort_order: s.sort_order || 0,
    is_active: s.is_active !== false,
  })),
  checklist_questions: (template.questions || []).map((q) => ({
    key: q.key || "",
    section: q.section || q.section_id || "",
    section_client_id: q.section
      ? `existing_section_${q.section}`
      : q.section_id
        ? `existing_section_${q.section_id}`
        : "",
    question: q.question || "",
    options: q.options || [],
    photo_required: Boolean(q.photo_required),
    input_type: q.input_type || "single_choice",
    help_text: q.help_text || "",
    is_required: Boolean(q.is_required),
    requires_attachment: Boolean(q.requires_attachment),
    requires_remark: Boolean(q.requires_remark),
    sort_order: q.sort_order || 0,
    is_active: q.is_active !== false,
  })),
  signature_boxes: (template.signature_boxes || []).map((s) => {
    const layoutConfig = s.layout_config || {};
    const signerType = s.signer_type || layoutConfig.signer_type || "group";

    return {
      key: s.key || "",
      label: s.label || "",
      section: s.section || "",
      signing_group_id:
        signerType === "creator" ? "" : s.signing_group_id || "",
      signing_group_code:
        signerType === "creator" ? "" : s.signing_group_code || "",
      signing_group_name:
        signerType === "creator" ? "" : s.signing_group_name || "",
      required_status: s.required_status || "",
      action: s.action || "approve",
      requires_signature: s.requires_signature !== false,
      sort_order: s.sort_order || 0,
      layout_config: {
        ...layoutConfig,
        signer_type: signerType,
      },
    };
  }),
});

const TemplateLogoUploadBox = ({
  title,
  logoKey,
  file,
  url,
  onUpload,
  onRemove,
  getPreviewUrl,
}) => {
  const previewSource = file || url;
  const previewUrl = previewSource ? getPreviewUrl(previewSource) : "";

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-slate-800">{title}</h4>
          <p className="mt-0.5 text-xs text-slate-500">
            Upload image used in permit PDF report header.
          </p>
        </div>

        {previewSource && (
          <button
            type="button"
            onClick={() => onRemove(logoKey)}
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100"
          >
            Remove
          </button>
        )}
      </div>

      <div className="mb-3 flex h-24 items-center justify-center overflow-hidden rounded-lg border border-dashed border-slate-300 bg-white">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt={title}
            className="max-h-full max-w-full object-contain"
          />
        ) : (
          <span className="text-xs text-slate-400">No logo selected</span>
        )}
      </div>

      <input
        type="file"
        accept="image/*"
        onChange={(e) => onUpload(logoKey, e.target.files?.[0])}
        className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-orange-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-orange-700 hover:file:bg-orange-100"
      />
    </div>
  );
};

export default function PermitTemplateBuilderDashboard() {
  const [view, setView] = useState("list");
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_TEMPLATE);
  const [groups, setGroups] = useState([]);
  const fileInputRef = useRef(null);

  const isEditing = Boolean(editingId);

  const isFile = (value) => {
    return typeof File !== "undefined" && value instanceof File;
  };

  const getLogoPreviewUrl = (fileOrUrl) => {
    if (!fileOrUrl) return "";

    if (isFile(fileOrUrl)) {
      return URL.createObjectURL(fileOrUrl);
    }

    return resolveMediaUrl(fileOrUrl);
  };

  const updateLogo = (key, file) => {
    if (!file) return;

    if (!String(file.type || "").startsWith("image/")) {
      showToast("Please upload a valid image file", "error");
      return;
    }

    setForm((prev) => ({
      ...prev,
      [key]: file,
      [`${key}_url`]: "",
      [`remove_${key}`]: false,
    }));
  };

  const removeLogo = (key) => {
    setForm((prev) => ({
      ...prev,
      [key]: null,
      [`${key}_url`]: "",
      [`remove_${key}`]: true,
    }));
  };

  const handleBulkUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];

        // Use header: 1 to get array of arrays
        const rawData = XLSX.utils.sheet_to_json(ws, { header: 1 });

        if (rawData.length === 0) {
          showToast("Excel file is empty", "error");
          return;
        }

        // Check if the first row is a header row
        const firstRow = rawData[0] || [];
        const firstRowStrs = firstRow.map((c) =>
          String(c).toLowerCase().trim(),
        );
        const isHeaderRow =
          firstRowStrs.includes("question text") ||
          firstRowStrs.includes("question");

        let parsedData = [];

        if (isHeaderRow) {
          // It's a standard mapping with headers
          const dataWithHeaders = XLSX.utils.sheet_to_json(ws);
          parsedData = dataWithHeaders.map((row) => {
            return {
              key: row["Key"],
              question: row["Question Text"] || row["Question"],
              section: row["Section"],
              inputType: row["Input Type"],
              sortOrder: row["Sort Order"],
              options: row["Options"],
              required: row["Required"],
              photoRequired: row["Photo Required"],
              requiresAttachment: row["Requires Attachment"],
              requiresRemark: row["Requires Remark"],
            };
          });
        } else {
          // Treat every row as a single question string (usually the first column)
          // Avoid completely empty rows
          parsedData = rawData
            .filter((row) => row && row[0])
            .map((row) => {
              return {
                question: String(row[0]).trim(),
              };
            });
        }

        const newQuestions = parsedData.map((row, index) => {
          let sectionId = "";
          if (row.section) {
            const sec = form.checklist_sections.find(
              (s) =>
                String(s.title).trim() === String(row.section).trim() ||
                String(s.id) === String(row.section),
            );
            if (sec) sectionId = sec.id;
          }

          let optionsText = row.options ? String(row.options) : "";
          let parsedOptions = parseOptionsText(optionsText);
          if (!parsedOptions || parsedOptions.length === 0) {
            parsedOptions = [
              { value: "YES" },
              { value: "NO" },
              { value: "N/A" },
            ];
          }
          // Default to single_choice for permits if not specified
          let inputType = row.inputType || "single_choice";

          return {
            key: row.key || `q_${Date.now()}_${index}`,
            question: row.question || "Untitled Question",
            input_type: inputType,
            section: sectionId,
            sort_order:
              Number(row.sortOrder) ||
              form.checklist_questions.length + index + 1,
            options: parsedOptions,
            is_required:
              row.required !== undefined
                ? String(row.required).toLowerCase() === "y" ||
                  String(row.required).toLowerCase() === "yes" ||
                  String(row.required).toLowerCase() === "true" ||
                  row.required === true
                : false,
            photo_required:
              row.photoRequired !== undefined
                ? String(row.photoRequired).toLowerCase() === "y" ||
                  String(row.photoRequired).toLowerCase() === "yes" ||
                  String(row.photoRequired).toLowerCase() === "true" ||
                  row.photoRequired === true
                : false,
            requires_attachment:
              row.requiresAttachment !== undefined
                ? String(row.requiresAttachment).toLowerCase() === "y" ||
                  String(row.requiresAttachment).toLowerCase() === "yes" ||
                  String(row.requiresAttachment).toLowerCase() === "true" ||
                  row.requiresAttachment === true
                : false,
            requires_remark:
              row.requiresRemark !== undefined
                ? String(row.requiresRemark).toLowerCase() === "y" ||
                  String(row.requiresRemark).toLowerCase() === "yes" ||
                  String(row.requiresRemark).toLowerCase() === "true" ||
                  row.requiresRemark === true
                : false,
          };
        });

        setForm((prev) => ({
          ...prev,
          checklist_questions: [
            ...(prev.checklist_questions || []),
            ...newQuestions,
          ],
        }));
        showToast(
          `Successfully added ${newQuestions.length} questions from Excel.`,
          "success",
        );
      } catch (err) {
        console.error("Excel parse error:", err);
        showToast("Error parsing Excel file", "error");
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = null; // reset
  };

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await listPermitTemplateBuilderTemplates();
      const data = Array.isArray(res?.data)
        ? res.data
        : res?.data?.results || [];
      setTemplates(data);
    } catch (err) {
      showToast("Failed to load permit templates", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const res = await getUserGroups();
      const data = Array.isArray(res?.data)
        ? res.data
        : res?.data?.results || [];
      setGroups(data);
    } catch (err) {
      console.error("Failed to load groups", err);
    }
  };

  useEffect(() => {
    fetchTemplates();
    fetchGroups();
  }, []);

  const setValue = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateHeaderConfig = (key, value) => {
    setForm((prev) => ({
      ...prev,
      header_config: {
        ...(prev.header_config || {}),
        [key]: value,
      },
    }));
  };

  const validateBeforeSave = () => {
    if (!form.code.trim()) {
      showToast("Template code is required", "error");
      return false;
    }

    if (!form.name.trim()) {
      showToast("Template name is required", "error");
      return false;
    }

    const fieldKeys = form.fields.map((f) => f.key).filter(Boolean);
    if (new Set(fieldKeys).size !== fieldKeys.length) {
      showToast("Duplicate field keys found", "error");
      return false;
    }

    const questionKeys = form.checklist_questions
      .map((q) => q.key)
      .filter(Boolean);
    if (new Set(questionKeys).size !== questionKeys.length) {
      showToast("Duplicate checklist question keys found", "error");
      return false;
    }

    const sigKeys = form.signature_boxes.map((s) => s.key).filter(Boolean);
    if (new Set(sigKeys).size !== sigKeys.length) {
      showToast("Duplicate signature box keys found", "error");
      return false;
    }

    return true;
  };

  const validateBeforePublish = () => {
    if (!validateBeforeSave()) return false;

    if (!form.fields.length) {
      showToast("Add at least one form field before publish", "error");
      return false;
    }

    if (!form.checklist_questions.length) {
      showToast("Add checklist questions before publish", "error");
      return false;
    }

    const missingGroup = form.signature_boxes.some((s) => {
      const signerType = getSignerType(s);
      return (
        s.requires_signature && signerType === "group" && !s.signing_group_id
      );
    });

    if (missingGroup) {
      showToast(
        "All required group-based signature boxes must have signing group",
        "error",
      );
      return false;
    }

    return true;
  };

  const handleNew = () => {
    setEditingId(null);
    setForm({
      ...EMPTY_TEMPLATE,
      header_config: { ...EMPTY_TEMPLATE.header_config },
      fields: [],
      checklist_sections: [],
      checklist_questions: [],
      signature_boxes: [],
      special_sections: [],
    });
    setView("form");
  };

  const handleEdit = async (templateId) => {
    try {
      const res = await getPermitTemplateBuilderTemplate(templateId);
      let template = res.data;

      if (template.status === "published" || template.status === "archived") {
        const confirmed = window.confirm(
          "This template is already published. Published templates cannot be edited directly. Do you want to clone it as a new draft version and edit that?",
        );

        if (!confirmed) return;

        const cloneRes = await clonePermitTemplateBuilderTemplate(template.id);
        template = cloneRes.data;

        showToast(
          `Template cloned as draft version v${template.version}. You can edit this version now.`,
          "success",
        );
      }

      setEditingId(template.id);
      setForm(normalizeTemplateForEdit(template));
      setView("form");
    } catch (err) {
      showToast("Failed to load template details", "error");
    }
  };

  const appendJson = (fd, key, value) => {
    fd.append(key, JSON.stringify(value ?? null));
  };

  const buildPayloadObject = () => ({
    ...form,

    checklist_sections: (form.checklist_sections || []).map((section) => {
      const payload = {
        client_id: section.client_id || section.id,
        title: section.title || "",
        description: section.description || "",
        sort_order: section.sort_order || 0,
        is_active: section.is_active !== false,
      };

      if (
        section.id &&
        !String(section.id).startsWith("section_") &&
        Number.isInteger(Number(section.id))
      ) {
        payload.id = Number(section.id);
      }

      return payload;
    }),

    checklist_questions: (form.checklist_questions || []).map((question) => {
      const payload = {
        ...question,
        section_client_id:
          question.section_client_id ||
          (String(question.section || "").startsWith("section_")
            ? question.section
            : ""),
      };

      if (
        payload.section &&
        (String(payload.section).startsWith("section_") ||
          !Number.isInteger(Number(payload.section)))
      ) {
        delete payload.section;
      }

      return payload;
    }),

    signature_boxes: (form.signature_boxes || []).map((box) => {
      const signerType = getSignerType(box);

      return {
        ...box,
        signing_group_id:
          signerType === "creator" ? null : box.signing_group_id,
        signing_group_code:
          signerType === "creator" ? "" : box.signing_group_code,
        signing_group_name:
          signerType === "creator" ? "" : box.signing_group_name,
        layout_config: {
          ...(box.layout_config || {}),
          signer_type: signerType,
        },
      };
    }),
  });

  const buildPayload = () => {
    const payload = buildPayloadObject();

    const fd = new FormData();

    fd.append("code", payload.code || "");
    fd.append("ptw_prefix", payload.ptw_prefix || "");
    fd.append("name", payload.name || "");
    fd.append("status", payload.status || "draft");
    fd.append("description", payload.description || "");
    fd.append("format_no", payload.format_no || "");
    fd.append("ref_no", payload.ref_no || "");
    fd.append("issued_date_text", payload.issued_date_text || "");
    fd.append("revision_no", payload.revision_no || "");

    appendJson(fd, "header_config", payload.header_config || {});
    appendJson(fd, "layout_config", payload.layout_config || {});
    appendJson(fd, "ppe_config", payload.ppe_config || {});
    appendJson(fd, "special_sections", payload.special_sections || []);
    appendJson(fd, "print_config", payload.print_config || {});

    appendJson(fd, "fields", payload.fields || []);
    appendJson(fd, "checklist_sections", payload.checklist_sections || []);
    appendJson(fd, "checklist_questions", payload.checklist_questions || []);
    appendJson(fd, "signature_boxes", payload.signature_boxes || []);

    if (isFile(form.left_logo)) {
      fd.append("left_logo", form.left_logo);
    }

    if (isFile(form.right_logo)) {
      fd.append("right_logo", form.right_logo);
    }

    if (form.remove_left_logo) {
      fd.append("remove_left_logo", "true");
    }

    if (form.remove_right_logo) {
      fd.append("remove_right_logo", "true");
    }

    return fd;
  };

  const saveDraftTemplate = async () => {
    if (!validateBeforeSave()) return null;

    const payload = buildPayload();

    if (isEditing) {
      const res = await updatePermitTemplateBuilderTemplate(editingId, payload);
      return res?.data || { id: editingId };
    }

    const res = await createPermitTemplateBuilderTemplate(payload);
    const created = res?.data;

    if (created?.id) {
      setEditingId(created.id);
    }

    return created;
  };

  const handleSave = async () => {
    try {
      const saved = await saveDraftTemplate();
      if (!saved) return;

      showToast("Template saved successfully", "success");
      await fetchTemplates();
      setView("list");
    } catch (err) {
      const detail = extractErrorMessage(err, "Failed to save template");
      showToast(detail || "Failed to save template", "error");
    }
  };

  const handleClone = async (templateId) => {
    try {
      await clonePermitTemplateBuilderTemplate(templateId);
      showToast("Template cloned successfully", "success");
      fetchTemplates();
    } catch (err) {
      const detail = extractErrorMessage(err, "Failed to clone template");

      showToast(detail || "Failed to clone template", "error");
    }
  };

  const handlePublish = async (templateId) => {
    try {
      await publishPermitTemplateBuilderTemplate(templateId);

      showToast("Template published successfully", "success");

      await fetchTemplates();

      setView("list");
      setEditingId(null);
      setForm({
        ...EMPTY_TEMPLATE,
        header_config: { ...EMPTY_TEMPLATE.header_config },
        fields: [],
        checklist_sections: [],
        checklist_questions: [],
        signature_boxes: [],
        special_sections: [],
      });
    } catch (err) {
      const detail = extractErrorMessage(err, "Failed to publish template");
      showToast(detail || "Failed to publish template", "error");
    }
  };

  const handleSaveAndPublish = async () => {
    if (!validateBeforePublish()) return;

    try {
      const saved = await saveDraftTemplate();
      if (!saved?.id && !editingId) {
        showToast("Could not determine template to publish", "error");
        return;
      }

      const templateIdToPublish = saved?.id || editingId;

      await publishPermitTemplateBuilderTemplate(templateIdToPublish);

      showToast("Template saved and published successfully", "success");

      await fetchTemplates();

      setView("list");
      setEditingId(null);
      setForm({
        ...EMPTY_TEMPLATE,
        header_config: { ...EMPTY_TEMPLATE.header_config },
        fields: [],
        checklist_sections: [],
        checklist_questions: [],
        signature_boxes: [],
        special_sections: [],
      });
    } catch (err) {
      const detail = extractErrorMessage(
        err,
        "Failed to save and publish template",
      );
      showToast(detail || "Failed to save and publish template", "error");
    }
  };

  const handleDelete = async (template) => {
    if (!template?.id) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${template.name}"? This action cannot be undone.`,
    );

    if (!confirmed) return;

    try {
      await deletePermitTemplateBuilderTemplate(template.id);
      showToast("Template deleted successfully", "success");
      fetchTemplates();
    } catch (err) {
      const detail = extractErrorMessage(err, "Failed to delete template");

      showToast(detail || "Failed to delete template", "error");
    }
  };

  const addField = () => {
    setForm((prev) => ({
      ...prev,
      fields: [
        ...prev.fields,
        {
          key: "",
          label: "",
          field_type: "text",
          required_override: false,
          source_type: "maker_input",
          sort_order: prev.fields.length + 1,
          validation_rules: {},
          visibility_rules: {},
          help_text: "",
        },
      ],
    }));
  };

  const addPPEField = () => {
    const alreadyExists = form.fields.some((f) => f.key === "provided_ppes");

    if (alreadyExists) {
      showToast("Provided PPEs field already exists", "error");
      return;
    }

    setForm((prev) => ({
      ...prev,
      fields: [
        ...prev.fields,
        {
          key: "provided_ppes",
          label: "Provided PPEs",
          field_type: "multi_select",
          required_override: true,
          source_type: "maker_input",
          sort_order: prev.fields.length + 1,
          validation_rules: {
            choices: PPE_OPTIONS,
          },
          visibility_rules: {},
          help_text: "",
        },
      ],
    }));
  };

  const updateField = (index, key, value) => {
    setForm((prev) => {
      const next = [...prev.fields];
      next[index] = { ...next[index], [key]: value };
      return { ...prev, fields: next };
    });
  };

  const removeField = (index) => {
    setForm((prev) => ({
      ...prev,
      fields: prev.fields.filter((_, i) => i !== index),
    }));
  };

  const addSection = () => {
    const clientId = makeSectionId();

    setForm((prev) => ({
      ...prev,
      checklist_sections: [
        ...prev.checklist_sections,
        {
          client_id: clientId,
          id: null,
          title: "",
          description: "",
          sort_order: prev.checklist_sections.length + 1,
          is_active: true,
        },
      ],
    }));
  };

  const updateSection = (index, key, value) => {
    setForm((prev) => {
      const next = [...prev.checklist_sections];
      next[index] = { ...next[index], [key]: value };
      return { ...prev, checklist_sections: next };
    });
  };

  const removeSection = (index) => {
    const section = form.checklist_sections[index];

    setForm((prev) => ({
      ...prev,
      checklist_sections: prev.checklist_sections.filter((_, i) => i !== index),
      checklist_questions: prev.checklist_questions.map((q) =>
        String(q.section) === String(section?.id) ||
        String(q.section) === String(section?.title)
          ? { ...q, section: "" }
          : q,
      ),
    }));
  };

  const addQuestion = () => {
    setForm((prev) => ({
      ...prev,
      checklist_questions: [
        ...prev.checklist_questions,
        {
          key: "",
          section: prev.checklist_sections[0]?.id || "",
          section_client_id: prev.checklist_sections[0]?.client_id || "",
          question: "",
          options: [{ value: "YES" }, { value: "NO" }, { value: "N/A" }],
          photo_required: false,
          input_type: "single_choice",
          help_text: "",
          is_required: true,
          requires_attachment: false,
          requires_remark: false,
          sort_order: prev.checklist_questions.length + 1,
          is_active: true,
        },
      ],
    }));
  };

  const updateQuestion = (index, key, value) => {
    setForm((prev) => {
      const next = [...prev.checklist_questions];
      next[index] = { ...next[index], [key]: value };
      return { ...prev, checklist_questions: next };
    });
  };

  const removeQuestion = (index) => {
    setForm((prev) => ({
      ...prev,
      checklist_questions: prev.checklist_questions.filter(
        (_, i) => i !== index,
      ),
    }));
  };

  const addSignatureBox = () => {
    setForm((prev) => ({
      ...prev,
      signature_boxes: [
        ...prev.signature_boxes,
        {
          key: "",
          label: "",
          section: "",
          signing_group_id: "",
          signing_group_code: "",
          signing_group_name: "",
          required_status: "",
          action: "approve",
          requires_signature: true,
          sort_order: prev.signature_boxes.length + 1,
          layout_config: {
            signer_type: "group",
          },
        },
      ],
    }));
  };

  const addSignaturePreset = (preset) => {
    const alreadyExists = form.signature_boxes.some(
      (s) => s.key === preset.key,
    );

    if (alreadyExists) {
      showToast(`${preset.label} already exists`, "error");
      return;
    }

    setForm((prev) => ({
      ...prev,
      signature_boxes: [
        ...prev.signature_boxes,
        {
          key: preset.key,
          label: preset.label,
          section: preset.section,
          signing_group_id: "",
          signing_group_code: "",
          signing_group_name: "",
          required_status: preset.required_status,
          action: preset.action,
          requires_signature: true,
          sort_order: prev.signature_boxes.length + 1,
          layout_config: {
            signer_type: preset.signer_type,
          },
        },
      ],
    }));
  };

  const updateSignatureBox = (index, key, value) => {
    setForm((prev) => {
      const next = [...prev.signature_boxes];

      if (key === "signer_type") {
        next[index] = {
          ...next[index],
          signing_group_id:
            value === "creator" ? "" : next[index].signing_group_id,
          signing_group_code:
            value === "creator" ? "" : next[index].signing_group_code,
          signing_group_name:
            value === "creator" ? "" : next[index].signing_group_name,
          layout_config: {
            ...(next[index].layout_config || {}),
            signer_type: value,
          },
        };
      } else if (key === "signing_group_id") {
        const group = groups.find((g) => String(g.id) === String(value));

        next[index] = {
          ...next[index],
          signing_group_id: value ? Number(value) : "",
          signing_group_name: group?.name || "",
          signing_group_code: group?.code || "",
          layout_config: {
            ...(next[index].layout_config || {}),
            signer_type: getSignerType(next[index]),
          },
        };
      } else {
        next[index] = { ...next[index], [key]: value };
      }

      return { ...prev, signature_boxes: next };
    });
  };

  const removeSignatureBox = (index) => {
    setForm((prev) => ({
      ...prev,
      signature_boxes: prev.signature_boxes.filter((_, i) => i !== index),
    }));
  };

  const specialSectionsText = useMemo(() => {
    try {
      return JSON.stringify(form.special_sections || [], null, 2);
    } catch {
      return "[]";
    }
  }, [form.special_sections]);

  const updateSpecialSections = (value) => {
    try {
      const parsed = JSON.parse(value || "[]");
      setValue("special_sections", parsed);
    } catch {
      setValue("special_sections", value);
    }
  };

  if (view === "list") {
    return (
      <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-slate-800">
            Permit Template Builder
          </h2>
          <button
            onClick={handleNew}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors font-medium"
          >
            <Plus size={18} /> Create Template
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-500">
            Loading templates...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm">
                  <th className="py-3 px-4 font-medium">Code</th>
                  <th className="py-3 px-4 font-medium">Name</th>
                  <th className="py-3 px-4 font-medium">Format No</th>
                  <th className="py-3 px-4 font-medium">Version</th>
                  <th className="py-3 px-4 font-medium">Status</th>
                  <th className="py-3 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {templates.map((t) => (
                  <tr
                    key={t.id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="py-3 px-4 font-medium text-slate-800">
                      {t.code}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{t.name}</td>
                    <td className="py-3 px-4 text-slate-500">{t.format_no}</td>
                    <td className="py-3 px-4 text-slate-500">v{t.version}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                          t.status === "published"
                            ? "bg-emerald-100 text-emerald-700"
                            : t.status === "archived"
                              ? "bg-slate-100 text-slate-600"
                              : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {t.status?.toUpperCase() || "DRAFT"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(t.id)}
                          className="p-1.5 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded transition-colors"
                          title="Edit/View"
                        >
                          <FileText size={18} />
                        </button>
                        <button
                          onClick={() => handleClone(t.id)}
                          className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors"
                          title="Clone"
                        >
                          <Copy size={18} />
                        </button>
                        {t.status !== "published" && (
                          <button
                            onClick={() => handlePublish(t.id)}
                            className="p-1.5 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded transition-colors"
                            title="Publish"
                          >
                            <Send size={18} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(t)}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {templates.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      No templates found. Click 'Create Template' to start.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  // --- FORM VIEW UI ---
  return (
    <div className="bg-slate-50 min-h-screen pb-24">
      {/* Top Navigation */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setView("list")}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h2 className="text-xl font-semibold text-slate-800">
                {isEditing
                  ? `Edit Template: ${form.name}`
                  : "New Permit Template"}
              </h2>
              {isEditing && (
                <div className="text-sm text-slate-500 mt-1">
                  Code: {form.code}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* 0. Template Report Logos */}
        <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-medium text-slate-800 mb-4 border-b border-slate-100 pb-2">
            Report Header Logos
          </h3>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <TemplateLogoUploadBox
              title="Left Logo"
              logoKey="left_logo"
              file={form.left_logo}
              url={form.left_logo_url}
              onUpload={updateLogo}
              onRemove={removeLogo}
              getPreviewUrl={getLogoPreviewUrl}
            />

            <TemplateLogoUploadBox
              title="Right Logo"
              logoKey="right_logo"
              file={form.right_logo}
              url={form.right_logo_url}
              onUpload={updateLogo}
              onRemove={removeLogo}
              getPreviewUrl={getLogoPreviewUrl}
            />
          </div>
        </section>

        {/* 1. Basic Details */}
        <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-medium text-slate-800 mb-4 border-b border-slate-100 pb-2">
            Basic Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Template Code *
              </label>
              <input
                type="text"
                className="w-full p-2 border border-slate-300 rounded focus:ring-orange-500 focus:border-orange-500"
                value={form.code}
                onChange={(e) => setValue("code", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                PTW Prefix
              </label>
              <input
                type="text"
                placeholder="e.g. ADL-AN-PTW-HO-"
                className="w-full p-2 border border-slate-300 rounded focus:ring-orange-500 focus:border-orange-500"
                value={form.ptw_prefix}
                onChange={(e) => setValue("ptw_prefix", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Template Name *
              </label>
              <input
                type="text"
                className="w-full p-2 border border-slate-300 rounded focus:ring-orange-500 focus:border-orange-500"
                value={form.name}
                onChange={(e) => setValue("name", e.target.value)}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Description
              </label>
              <textarea
                className="w-full p-2 border border-slate-300 rounded focus:ring-orange-500 focus:border-orange-500"
                rows={2}
                value={form.description}
                onChange={(e) => setValue("description", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Format No
              </label>
              <input
                type="text"
                className="w-full p-2 border border-slate-300 rounded focus:ring-orange-500 focus:border-orange-500"
                value={form.format_no}
                onChange={(e) => setValue("format_no", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Ref No
              </label>
              <input
                type="text"
                className="w-full p-2 border border-slate-300 rounded focus:ring-orange-500 focus:border-orange-500"
                value={form.ref_no}
                onChange={(e) => setValue("ref_no", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Issued Date Text
              </label>
              <input
                type="text"
                className="w-full p-2 border border-slate-300 rounded focus:ring-orange-500 focus:border-orange-500"
                value={form.issued_date_text}
                onChange={(e) => setValue("issued_date_text", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Revision No
              </label>
              <input
                type="text"
                className="w-full p-2 border border-slate-300 rounded focus:ring-orange-500 focus:border-orange-500"
                value={form.revision_no}
                onChange={(e) => setValue("revision_no", e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* 2. Header Config */}
        <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-medium text-slate-800 mb-4 border-b border-slate-100 pb-2">
            Header Visibility Flags
          </h3>
          <div className="flex flex-wrap gap-6">
            {Object.keys(EMPTY_TEMPLATE.header_config).map((key) => (
              <label
                key={key}
                className="flex items-center gap-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  className="w-4 h-4 text-orange-500 border-slate-300 rounded focus:ring-orange-500"
                  checked={form.header_config[key]}
                  onChange={(e) => updateHeaderConfig(key, e.target.checked)}
                />
                <span className="text-sm font-medium text-slate-700">
                  {key.replace("show_", "Show ").replace("_", " ")}
                </span>
              </label>
            ))}
          </div>
        </section>

        {/* 3. User Input Fields */}
        <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
            <h3 className="text-lg font-medium text-slate-800">
              User Input Fields
            </h3>
            <div className="flex gap-2">
              <button
                onClick={addPPEField}
                className="px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-medium transition-colors"
              >
                + Add Provided PPEs
              </button>
              <button
                onClick={addField}
                className="px-3 py-1.5 text-sm bg-orange-100 hover:bg-orange-200 text-orange-700 rounded font-medium transition-colors"
              >
                + Add Field
              </button>
            </div>
          </div>
          <div className="space-y-4">
            {form.fields.map((f, i) => (
              <div
                key={i}
                className="p-4 border border-slate-200 rounded-lg bg-slate-50 relative"
              >
                <button
                  onClick={() => removeField(i)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-red-500"
                >
                  <Trash2 size={18} />
                </button>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pr-8">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">
                      Key *
                    </label>
                    <input
                      type="text"
                      className="w-full p-2 border border-slate-300 rounded text-sm"
                      value={f.key}
                      onChange={(e) => updateField(i, "key", e.target.value)}
                      disabled={f.key === "provided_ppes"}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">
                      Label *
                    </label>
                    <input
                      type="text"
                      className="w-full p-2 border border-slate-300 rounded text-sm"
                      value={f.label}
                      onChange={(e) => updateField(i, "label", e.target.value)}
                      disabled={f.key === "provided_ppes"}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">
                      Field Type
                    </label>
                    <select
                      className="w-full p-2 border border-slate-300 rounded text-sm"
                      value={f.field_type}
                      onChange={(e) =>
                        updateField(i, "field_type", e.target.value)
                      }
                      disabled={f.key === "provided_ppes"}
                    >
                      {FIELD_TYPES.map((ft) => (
                        <option key={ft} value={ft}>
                          {ft}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">
                      Source Type
                    </label>
                    <select
                      className="w-full p-2 border border-slate-300 rounded text-sm"
                      value={f.source_type}
                      onChange={(e) =>
                        updateField(i, "source_type", e.target.value)
                      }
                      disabled={f.key === "provided_ppes"}
                    >
                      {SOURCE_TYPES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">
                      Sort Order
                    </label>
                    <input
                      type="number"
                      className="w-full p-2 border border-slate-300 rounded text-sm"
                      value={f.sort_order}
                      onChange={(e) =>
                        updateField(i, "sort_order", Number(e.target.value))
                      }
                    />
                  </div>
                  <div className="flex items-center pt-5">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-orange-500 rounded"
                        checked={f.required_override}
                        onChange={(e) =>
                          updateField(i, "required_override", e.target.checked)
                        }
                        disabled={f.key === "provided_ppes"}
                      />
                      <span className="text-sm text-slate-700">Required</span>
                    </label>
                  </div>
                  {(f.field_type === "select" ||
                    f.field_type === "multi_select") && (
                    <div className="md:col-span-4">
                      <label className="block text-xs font-medium text-slate-500 mb-1">
                        Choices (One per line)
                      </label>
                      <textarea
                        className="w-full p-2 border border-slate-300 rounded text-sm"
                        rows={3}
                        value={(f.validation_rules?.choices || []).join("\n")}
                        onChange={(e) =>
                          updateField(i, "validation_rules", {
                            ...f.validation_rules,
                            choices: e.target.value.split("\n").filter(Boolean),
                          })
                        }
                        disabled={f.key === "provided_ppes"}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 4. Checklist Sections */}
        <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
            <h3 className="text-lg font-medium text-slate-800">
              Checklist Sections
            </h3>
            <button
              onClick={addSection}
              className="px-3 py-1.5 text-sm bg-orange-100 hover:bg-orange-200 text-orange-700 rounded font-medium transition-colors"
            >
              + Add Section
            </button>
          </div>
          <div className="space-y-4">
            {form.checklist_sections.map((s, i) => (
              <div
                key={i}
                className="p-4 border border-slate-200 rounded-lg flex items-start gap-4 bg-slate-50"
              >
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">
                      Title *
                    </label>
                    <input
                      type="text"
                      className="w-full p-2 border border-slate-300 rounded text-sm"
                      value={s.title}
                      onChange={(e) =>
                        updateSection(i, "title", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">
                      Description
                    </label>
                    <input
                      type="text"
                      className="w-full p-2 border border-slate-300 rounded text-sm"
                      value={s.description}
                      onChange={(e) =>
                        updateSection(i, "description", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">
                      Sort Order
                    </label>
                    <input
                      type="number"
                      className="w-full p-2 border border-slate-300 rounded text-sm"
                      value={s.sort_order}
                      onChange={(e) =>
                        updateSection(i, "sort_order", Number(e.target.value))
                      }
                    />
                  </div>
                </div>
                <button
                  onClick={() => removeSection(i)}
                  className="mt-6 text-slate-400 hover:text-red-500"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* 5. Checklist Questions */}
        <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
            <h3 className="text-lg font-medium text-slate-800">
              Checklist Questions
            </h3>
            <div className="flex gap-2">
              <input
                type="file"
                accept=".xlsx, .xls"
                ref={fileInputRef}
                onChange={handleBulkUpload}
                style={{ display: "none" }}
              />
              <button
                onClick={() =>
                  fileInputRef.current && fileInputRef.current.click()
                }
                className="px-3 py-1.5 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded font-medium transition-colors"
              >
                Bulk Upload
              </button>
              <button
                onClick={addQuestion}
                className="px-3 py-1.5 text-sm bg-orange-100 hover:bg-orange-200 text-orange-700 rounded font-medium transition-colors"
              >
                + Add Question
              </button>
            </div>
          </div>
          <div className="space-y-4">
            {form.checklist_questions.map((q, i) => (
              <div
                key={i}
                className="p-4 border border-slate-200 rounded-lg bg-slate-50 relative"
              >
                <button
                  onClick={() => removeQuestion(i)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-red-500"
                >
                  <Trash2 size={18} />
                </button>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pr-8">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">
                      Key *
                    </label>
                    <input
                      type="text"
                      className="w-full p-2 border border-slate-300 rounded text-sm"
                      value={q.key}
                      onChange={(e) => updateQuestion(i, "key", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">
                      Section
                    </label>
                    <select
                      className="w-full p-2 border border-slate-300 rounded text-sm"
                      value={q.section_client_id || ""}
                      onChange={(e) => {
                        const clientId = e.target.value;
                        const section = form.checklist_sections.find(
                          (s) => String(s.client_id) === String(clientId),
                        );

                        updateQuestion(i, "section_client_id", clientId);
                        updateQuestion(i, "section", section?.id || "");
                      }}
                    >
                      <option value="">-- No Section --</option>
                      {form.checklist_sections.map((s) => (
                        <option key={s.client_id} value={s.client_id}>
                          {s.title || "Untitled"}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">
                      Input Type
                    </label>
                    <select
                      className="w-full p-2 border border-slate-300 rounded text-sm"
                      value={q.input_type}
                      onChange={(e) =>
                        updateQuestion(i, "input_type", e.target.value)
                      }
                    >
                      {QUESTION_INPUT_TYPES.map((qt) => (
                        <option key={qt} value={qt}>
                          {qt}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">
                      Sort Order
                    </label>
                    <input
                      type="number"
                      className="w-full p-2 border border-slate-300 rounded text-sm"
                      value={q.sort_order}
                      onChange={(e) =>
                        updateQuestion(i, "sort_order", Number(e.target.value))
                      }
                    />
                  </div>
                  <div className="md:col-span-4">
                    <label className="block text-xs font-medium text-slate-500 mb-1">
                      Question Text *
                    </label>
                    <textarea
                      className="w-full p-2 border border-slate-300 rounded text-sm"
                      rows={2}
                      value={q.question}
                      onChange={(e) =>
                        updateQuestion(i, "question", e.target.value)
                      }
                    />
                  </div>

                  {(q.input_type === "single_choice" ||
                    q.input_type === "multi_select") && (
                    <div className="md:col-span-4">
                      <label className="block text-xs font-medium text-slate-500 mb-1">
                        Options (One per line)
                      </label>
                      <textarea
                        className="w-full p-2 border border-slate-300 rounded text-sm"
                        rows={3}
                        value={optionsToText(q.options)}
                        onChange={(e) =>
                          updateQuestion(
                            i,
                            "options",
                            parseOptionsText(e.target.value),
                          )
                        }
                      />
                    </div>
                  )}

                  <div className="md:col-span-4 flex flex-wrap gap-4 mt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-orange-500 rounded"
                        checked={q.is_required}
                        onChange={(e) =>
                          updateQuestion(i, "is_required", e.target.checked)
                        }
                      />
                      <span className="text-sm text-slate-700">Required</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-orange-500 rounded"
                        checked={q.photo_required}
                        onChange={(e) =>
                          updateQuestion(i, "photo_required", e.target.checked)
                        }
                      />
                      <span className="text-sm text-slate-700">
                        Photo Required
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-orange-500 rounded"
                        checked={q.requires_attachment}
                        onChange={(e) =>
                          updateQuestion(
                            i,
                            "requires_attachment",
                            e.target.checked,
                          )
                        }
                      />
                      <span className="text-sm text-slate-700">
                        Requires Attachment
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-orange-500 rounded"
                        checked={q.requires_remark}
                        onChange={(e) =>
                          updateQuestion(i, "requires_remark", e.target.checked)
                        }
                      />
                      <span className="text-sm text-slate-700">
                        Requires Remark
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 6. Signature Boxes */}
        <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
            <h3 className="text-lg font-medium text-slate-800">
              Signature Boxes
            </h3>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => addSignaturePreset(SIGNATURE_PRESETS[0])}
                className="px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-medium transition-colors"
              >
                + Issue Maker Signature
              </button>

              <button
                type="button"
                onClick={() => addSignaturePreset(SIGNATURE_PRESETS[1])}
                className="px-3 py-1.5 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded font-medium transition-colors"
              >
                + Issue Checker Signature
              </button>

              <button
                type="button"
                onClick={() => addSignaturePreset(SIGNATURE_PRESETS[2])}
                className="px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-medium transition-colors"
              >
                + Closure Maker Signature
              </button>

              <button
                type="button"
                onClick={() => addSignaturePreset(SIGNATURE_PRESETS[3])}
                className="px-3 py-1.5 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded font-medium transition-colors"
              >
                + Closure Checker Signature
              </button>

              <button
                type="button"
                onClick={addSignatureBox}
                className="px-3 py-1.5 text-sm bg-orange-100 hover:bg-orange-200 text-orange-700 rounded font-medium transition-colors"
              >
                + Custom Signature Box
              </button>
            </div>
          </div>
          <div className="space-y-4">
            {form.signature_boxes.map((sb, i) => (
              <div
                key={i}
                className="p-4 border border-slate-200 rounded-lg bg-slate-50 relative"
              >
                <button
                  onClick={() => removeSignatureBox(i)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-red-500"
                >
                  <Trash2 size={18} />
                </button>
                <div className="mb-3 flex flex-wrap items-center gap-2 pr-8">
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                    {getSignerType(sb) === "creator"
                      ? "Creator Signature"
                      : "Group Signature"}
                  </span>

                  {sb.action && (
                    <span className="rounded-full bg-orange-100 px-2 py-1 text-xs font-medium text-orange-700">
                      Action: {sb.action}
                    </span>
                  )}

                  {sb.required_status && (
                    <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
                      Status: {sb.required_status}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pr-8">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">
                      Key *
                    </label>
                    <input
                      type="text"
                      className="w-full p-2 border border-slate-300 rounded text-sm"
                      value={sb.key}
                      onChange={(e) =>
                        updateSignatureBox(i, "key", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">
                      Label *
                    </label>
                    <input
                      type="text"
                      className="w-full p-2 border border-slate-300 rounded text-sm"
                      value={sb.label}
                      onChange={(e) =>
                        updateSignatureBox(i, "label", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">
                      Section
                    </label>
                    <input
                      type="text"
                      className="w-full p-2 border border-slate-300 rounded text-sm"
                      value={sb.section}
                      onChange={(e) =>
                        updateSignatureBox(i, "section", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">
                      Sort Order
                    </label>
                    <input
                      type="number"
                      className="w-full p-2 border border-slate-300 rounded text-sm"
                      value={sb.sort_order}
                      onChange={(e) =>
                        updateSignatureBox(
                          i,
                          "sort_order",
                          Number(e.target.value),
                        )
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">
                      Action
                    </label>
                    <select
                      className="w-full p-2 border border-slate-300 rounded text-sm"
                      value={sb.action}
                      onChange={(e) =>
                        updateSignatureBox(i, "action", e.target.value)
                      }
                    >
                      {SIGNATURE_ACTIONS.map((a) => (
                        <option key={a} value={a}>
                          {a}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">
                      Required Status
                    </label>
                    <select
                      className="w-full p-2 border border-slate-300 rounded text-sm"
                      value={sb.required_status}
                      onChange={(e) =>
                        updateSignatureBox(i, "required_status", e.target.value)
                      }
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">
                      Signer Type
                    </label>
                    <select
                      className="w-full p-2 border border-slate-300 rounded text-sm"
                      value={getSignerType(sb)}
                      onChange={(e) =>
                        updateSignatureBox(i, "signer_type", e.target.value)
                      }
                    >
                      {SIGNER_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  {getSignerType(sb) === "group" ? (
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-slate-500 mb-1">
                        Signing Group
                        {sb.requires_signature && (
                          <span className="text-red-500"> *</span>
                        )}
                      </label>
                      <select
                        className="w-full p-2 border border-slate-300 rounded text-sm"
                        value={sb.signing_group_id || ""}
                        onChange={(e) =>
                          updateSignatureBox(
                            i,
                            "signing_group_id",
                            e.target.value,
                          )
                        }
                      >
                        <option value="">-- Select Group --</option>
                        {groups.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-slate-500 mb-1">
                        Signing User
                      </label>
                      <div className="rounded border border-slate-200 bg-slate-100 p-2 text-sm text-slate-600">
                        Permit creator / maker will sign this box. No group
                        required.
                      </div>
                    </div>
                  )}
                  <div className="md:col-span-4 flex items-center mt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-orange-500 rounded"
                        checked={sb.requires_signature}
                        onChange={(e) =>
                          updateSignatureBox(
                            i,
                            "requires_signature",
                            e.target.checked,
                          )
                        }
                      />
                      <span className="text-sm text-slate-700">
                        Requires Signature
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 7. Special Sections */}
        <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-medium text-slate-800 mb-4 border-b border-slate-100 pb-2">
            Special Sections JSON
          </h3>
          <textarea
            className="w-full p-4 border border-slate-300 rounded text-sm font-mono bg-slate-50"
            rows={6}
            value={specialSectionsText}
            onChange={(e) => updateSpecialSections(e.target.value)}
          />
        </section>
      </div>

      {/* Sticky Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-lg z-20">
        <div className="max-w-5xl mx-auto flex justify-end gap-4">
          <button
            onClick={() => setView("list")}
            className="px-6 py-2 border border-slate-300 text-slate-600 rounded-lg font-medium hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
          >
            <Save size={18} /> Save Draft
          </button>
          {isEditing && (
            <button
              onClick={handleSaveAndPublish}
              className="flex items-center gap-2 px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors"
            >
              <Send size={18} /> Save & Publish
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
