export const HEADER_FIELD_SOURCES = [
  { value: "TEMPLATE_FIXED", label: "Fixed in Template" },
  { value: "MAKER_INPUT", label: "Filled by Maker" },
  { value: "SYSTEM_GENERATED", label: "System Generated" },
  { value: "PROJECT_CONTEXT", label: "Project Context" },
];

export const HEADER_INPUT_TYPES = [
  { value: "text", label: "Text" },
  { value: "date", label: "Date" },
  { value: "number", label: "Number" },
  { value: "select", label: "Select" },
];

export const SYSTEM_KEY_OPTIONS = {
  SYSTEM_GENERATED: [
    { value: "report_no", label: "Auto Number with Prefix" },
    { value: "inspection_date", label: "Inspection Date" },
    { value: "created_date", label: "Checklist Created Date" },
  ],
  PROJECT_CONTEXT: [{ value: "project_name", label: "Project Name" }],
};

export const PROTECTED_HEADER_KEYS = new Set([
  "project",
  "inspection_report_no",
  "date_of_inspection",
]);

export function toHeaderFieldKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function createField({
  key,
  label,
  source,
  inputType = "text",
  defaultValue = "",
  systemKey = "",
  required = false,
  editableByMaker = false,
  rowIndex,
  columnIndex,
  orderIndex,
}) {
  return {
    key,
    label,
    source,
    input_type: inputType,
    default_value: defaultValue,
    system_key: systemKey,
    required,
    editable_by_maker: editableByMaker,
    visible_in_report: true,
    visible_in_preview: true,
    validation_config: {},
    row_index: rowIndex,
    column_index: columnIndex,
    order_index: orderIndex,
  };
}

export function createDefaultHeaderFields() {
  return [
    createField({
      key: "format_no",
      label: "Format No.",
      source: "TEMPLATE_FIXED",
      required: true,
      rowIndex: 1,
      columnIndex: 1,
      orderIndex: 1,
    }),
    createField({
      key: "revision_no",
      label: "Revision No.",
      source: "TEMPLATE_FIXED",
      defaultValue: "R01",
      rowIndex: 1,
      columnIndex: 2,
      orderIndex: 2,
    }),
    createField({
      key: "issued_date",
      label: "Issued Date",
      source: "TEMPLATE_FIXED",
      inputType: "date",
      rowIndex: 2,
      columnIndex: 1,
      orderIndex: 3,
    }),
    createField({
      key: "revision_date",
      label: "Revision Date",
      source: "TEMPLATE_FIXED",
      inputType: "date",
      rowIndex: 2,
      columnIndex: 2,
      orderIndex: 4,
    }),
    createField({
      key: "project",
      label: "Project",
      source: "PROJECT_CONTEXT",
      systemKey: "project_name",
      rowIndex: 3,
      columnIndex: 1,
      orderIndex: 5,
    }),
    createField({
      key: "inspection_report_no",
      label: "Inspection Report No.",
      source: "SYSTEM_GENERATED",
      systemKey: "report_no",
      rowIndex: 3,
      columnIndex: 2,
      orderIndex: 6,
    }),
    createField({
      key: "name_of_contractor",
      label: "Name of Contractor",
      source: "MAKER_INPUT",
      editableByMaker: true,
      rowIndex: 4,
      columnIndex: 1,
      orderIndex: 7,
    }),
    createField({
      key: "date_of_inspection",
      label: "Date of Inspection",
      source: "SYSTEM_GENERATED",
      inputType: "date",
      systemKey: "inspection_date",
      rowIndex: 4,
      columnIndex: 2,
      orderIndex: 8,
    }),
    createField({
      key: "make_model",
      label: "Make/Model",
      source: "MAKER_INPUT",
      editableByMaker: true,
      rowIndex: 5,
      columnIndex: 1,
      orderIndex: 9,
    }),
    createField({
      key: "identification_no",
      label: "Identification No.",
      source: "MAKER_INPUT",
      editableByMaker: true,
      rowIndex: 5,
      columnIndex: 2,
      orderIndex: 10,
    }),
    createField({
      key: "location",
      label: "Location",
      source: "MAKER_INPUT",
      editableByMaker: true,
      rowIndex: 6,
      columnIndex: 1,
      orderIndex: 11,
    }),
    createField({
      key: "name_of_operator",
      label: "Name of Operator",
      source: "MAKER_INPUT",
      editableByMaker: true,
      rowIndex: 6,
      columnIndex: 2,
      orderIndex: 12,
    }),
  ];
}

export function createObservationHeaderFields() {
  return [
    createField({
      key: "format_no",
      label: "Format No.",
      source: "TEMPLATE_FIXED",
      defaultValue: "ADL-OH&S-F012",
      required: true,
      rowIndex: 1,
      columnIndex: 1,
      orderIndex: 1,
    }),
    createField({
      key: "revision_no",
      label: "Revision No.",
      source: "TEMPLATE_FIXED",
      defaultValue: "R01",
      required: true,
      rowIndex: 1,
      columnIndex: 2,
      orderIndex: 2,
    }),
    createField({
      key: "issued_date",
      label: "Issued Date",
      source: "TEMPLATE_FIXED",
      inputType: "date",
      defaultValue: "2025-09-01",
      required: true,
      rowIndex: 2,
      columnIndex: 1,
      orderIndex: 3,
    }),
    createField({
      key: "revision_date",
      label: "Revision Date",
      source: "TEMPLATE_FIXED",
      inputType: "date",
      defaultValue: "",
      required: false,
      rowIndex: 2,
      columnIndex: 2,
      orderIndex: 4,
    }),
    createField({
      key: "project",
      label: "Project",
      source: "PROJECT_CONTEXT",
      systemKey: "project_name",
      rowIndex: 3,
      columnIndex: 1,
      orderIndex: 5,
    }),
    createField({
      key: "date_of_inspection",
      label: "Date of Observation",
      source: "SYSTEM_GENERATED",
      inputType: "date",
      systemKey: "inspection_date",
      rowIndex: 3,
      columnIndex: 2,
      orderIndex: 6,
    }),
    createField({
      key: "inspection_report_no",
      label: "Report No.",
      source: "SYSTEM_GENERATED",
      systemKey: "report_no",
      rowIndex: 4,
      columnIndex: 2,
      orderIndex: 7,
    }),
  ];
}

export function createCustomHeaderField(existingCount) {
  const position = Number(existingCount || 0) + 1;

  return createField({
    key: `custom_field_${position}`,
    label: "New Field",
    source: "MAKER_INPUT",
    editableByMaker: true,
    rowIndex: Math.ceil(position / 2),
    columnIndex: position % 2 === 0 ? 2 : 1,
    orderIndex: position,
  });
}

// export function normaliseHeaderFields(fields) {
//     return (Array.isArray(fields) ? fields : []).map((field, index) => ({
//         key: toHeaderFieldKey(field.key || field.label),
//         label: String(field.label || "").trim(),
//         source: field.source || "MAKER_INPUT",
//         input_type: field.input_type || "text",
//         default_value: String(field.default_value || "").trim(),
//         system_key: String(field.system_key || "").trim(),
//         required: Boolean(field.required),
//         editable_by_maker:
//             field.source === "MAKER_INPUT"
//                 ? Boolean(field.editable_by_maker)
//                 : false,
//         visible_in_report: field.visible_in_report !== false,
//         visible_in_preview: field.visible_in_preview !== false,
//         validation_config: field.validation_config || {},
//         row_index: Number(field.row_index || Math.ceil((index + 1) / 2)),
//         column_index: Number(field.column_index || ((index + 1) % 2 === 0 ? 2 : 1)),
//         order_index: index + 1,
//     }));
// }

export function normaliseHeaderFields(fields) {
  return (Array.isArray(fields) ? fields : []).map((field, index) => {
    const key = toHeaderFieldKey(field.key || field.label);
    const source = field.source || "MAKER_INPUT";

    let systemKey = String(field.system_key || "").trim();

    /*
            Inspection Report No. automatically uses backend report number sequence
            whenever its source is SYSTEM_GENERATED.
        */
    if (key === "inspection_report_no" && source === "SYSTEM_GENERATED") {
      systemKey = "report_no";
    }

    /*
            Fixed and Maker fields must never carry an old generated resolver key.
            This prevents prefix validation from running after changing source.
        */
    if (source === "TEMPLATE_FIXED" || source === "MAKER_INPUT") {
      systemKey = "";
    }

    return {
      key,
      label: String(field.label || "").trim(),
      source,
      input_type: field.input_type || "text",
      default_value: String(field.default_value || "").trim(),
      system_key: systemKey,
      required: Boolean(field.required),
      editable_by_maker:
        source === "MAKER_INPUT" ? Boolean(field.editable_by_maker) : false,
      visible_in_report: field.visible_in_report !== false,
      visible_in_preview: field.visible_in_preview !== false,
      validation_config: field.validation_config || {},
      row_index: Number(field.row_index || Math.ceil((index + 1) / 2)),
      column_index: Number(
        field.column_index || ((index + 1) % 2 === 0 ? 2 : 1),
      ),
      order_index: index + 1,
    };
  });
}

// export function validateHeaderFields(fields, reportNumberConfig) {
//     const cleanedFields = normaliseHeaderFields(fields);

//     if (!cleanedFields.length) {
//         return "Please configure at least one report header field.";
//     }

//     const keys = cleanedFields.map((field) => field.key);

//     const duplicateKey = keys.find(
//         (key, index) => key && keys.indexOf(key) !== index
//     );

//     if (duplicateKey) {
//         return `Duplicate report field key found: ${duplicateKey}`;
//     }

//     for (const field of cleanedFields) {
//         if (!field.key) {
//             return "Every report field must have a valid key.";
//         }

//         if (!field.label) {
//             return `Label is required for field "${field.key}".`;
//         }

//         if (
//             ["SYSTEM_GENERATED", "PROJECT_CONTEXT"].includes(field.source) &&
//             !field.system_key
//         ) {
//             return `Select the value source for "${field.label}".`;
//         }

//         if (
//             field.source === "TEMPLATE_FIXED" &&
//             field.required &&
//             !field.default_value
//         ) {
//             return `Enter a value for required fixed field "${field.label}".`;
//         }
//     }

//     const reportNoField = cleanedFields.find(
//         (field) => field.system_key === "report_no"
//     );

//     if (reportNoField && !String(reportNumberConfig?.prefix || "").trim()) {
//         return "Inspection Report Prefix is required because Inspection Report No. is enabled.";
//     }

//     return "";
// }

export function validateHeaderFields(fields, reportNumberConfig) {
  const cleanedFields = normaliseHeaderFields(fields);

  if (!cleanedFields.length) {
    return "Please configure at least one report header field.";
  }

  const keys = cleanedFields.map((field) => field.key);

  const duplicateKey = keys.find(
    (key, index) => key && keys.indexOf(key) !== index,
  );

  if (duplicateKey) {
    return `Duplicate report field key found: ${duplicateKey}`;
  }

  for (const field of cleanedFields) {
    if (!field.key) {
      return "Every report field must have a valid key.";
    }

    if (!field.label) {
      return `Label is required for field "${field.key}".`;
    }

    if (
      ["SYSTEM_GENERATED", "PROJECT_CONTEXT"].includes(field.source) &&
      !field.system_key
    ) {
      return `Select the generated value type for "${field.label}".`;
    }

    if (
      field.source === "TEMPLATE_FIXED" &&
      field.required &&
      !field.default_value
    ) {
      return `Enter a value for required fixed field "${field.label}".`;
    }
  }

  const autoNumberFields = cleanedFields.filter(
    (field) =>
      field.source === "SYSTEM_GENERATED" && field.system_key === "report_no",
  );

  if (autoNumberFields.length > 1) {
    return "Only one auto-generated number field can be configured in a template.";
  }

  if (
    autoNumberFields.length === 1 &&
    !String(reportNumberConfig?.prefix || "").trim()
  ) {
    return `Prefix is required for auto-generated field "${autoNumberFields[0].label}".`;
  }

  return "";
}

export function validateHeaderFieldsDetailed(fields, reportNumberConfig) {
  const cleanedFields = normaliseHeaderFields(fields);

  if (!cleanedFields.length) {
    return {
      error: "Please configure at least one report header field.",
      fieldId: null,
    };
  }

  const keys = cleanedFields.map((field) => field.key);

  const duplicateKey = keys.find(
    (key, index) => key && keys.indexOf(key) !== index,
  );

  if (duplicateKey) {
    const dupIdx = keys.lastIndexOf(duplicateKey);
    return {
      error: `Duplicate report field key found: ${duplicateKey}`,
      fieldId: `header-key-${dupIdx}`,
    };
  }

  for (let i = 0; i < cleanedFields.length; i++) {
    const field = cleanedFields[i];
    if (!field.key) {
      return {
        error: "Every report field must have a valid key.",
        fieldId: `header-key-${i}`,
      };
    }

    if (!field.label) {
      return {
        error: `Label is required for field "${field.key}".`,
        fieldId: `header-label-${i}`,
      };
    }

    if (
      ["SYSTEM_GENERATED", "PROJECT_CONTEXT"].includes(field.source) &&
      !field.system_key
    ) {
      return {
        error: `Select the generated value type for "${field.label}".`,
        fieldId: `header-system-key-${i}`,
      };
    }

    if (
      field.source === "TEMPLATE_FIXED" &&
      field.required &&
      !field.default_value
    ) {
      return {
        error: `Enter a value for required fixed field "${field.label}".`,
        fieldId: `header-default-value-${i}`,
      };
    }
  }

  const autoNumberFields = cleanedFields.filter(
    (field) =>
      field.source === "SYSTEM_GENERATED" && field.system_key === "report_no",
  );

  if (autoNumberFields.length > 1) {
    return {
      error:
        "Only one auto-generated number field can be configured in a template.",
      fieldId: null,
    };
  }

  if (
    autoNumberFields.length === 1 &&
    !String(reportNumberConfig?.prefix || "").trim()
  ) {
    return {
      error: `Prefix is required for auto-generated field "${autoNumberFields[0].label}".`,
      fieldId: "header-prefix-input",
    };
  }

  return null;
}

// export function buildLegacyReportHeaderMeta(fields, reportNumberConfig) {
//     const meta = {};

//     normaliseHeaderFields(fields).forEach((field) => {
//         meta[field.key] = field.default_value || "";
//     });

//     meta.inspection_report_prefix = String(
//         reportNumberConfig?.prefix || ""
//     )
//         .trim()
//         .replace(/-+$/, "");

//     meta.inspection_report_no = "";

//     return meta;
// }

export function buildLegacyReportHeaderMeta(fields, reportNumberConfig) {
  const cleanedFields = normaliseHeaderFields(fields);
  const meta = {};

  cleanedFields.forEach((field) => {
    meta[field.key] = field.default_value || "";
  });

  const autoNumberEnabled = cleanedFields.some(
    (field) =>
      field.source === "SYSTEM_GENERATED" && field.system_key === "report_no",
  );

  meta.inspection_report_prefix = autoNumberEnabled
    ? String(reportNumberConfig?.prefix || "")
        .trim()
        .replace(/-+$/, "")
    : "";

  meta.inspection_report_no = "";

  return meta;
}

export function buildHeaderPreviewRows(
  fields,
  { projectName = "", reportNumberConfig = {} } = {},
) {
  const cleanedFields = normaliseHeaderFields(fields).filter(
    (field) => field.visible_in_preview !== false,
  );

  const prefix = String(reportNumberConfig?.prefix || "")
    .trim()
    .replace(/-+$/, "");

  const padding = Math.max(1, Number(reportNumberConfig?.padding || 2));

  function formatPreviewDate(dateStr) {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = d.getDate();
    let suffix = "th";
    if (day % 10 === 1 && day !== 11) suffix = "st";
    else if (day % 10 === 2 && day !== 12) suffix = "nd";
    else if (day % 10 === 3 && day !== 13) suffix = "rd";
    const month = d.toLocaleString("en-GB", { month: "long" });
    const year = String(d.getFullYear()).slice(-2);
    return `${day}${suffix} ${month} ${year}`;
  }

  const withPreviewValue = cleanedFields.map((field) => {
    let previewValue = field.default_value || "—";

    if (field.input_type === "date" && field.default_value) {
      previewValue = formatPreviewDate(field.default_value);
    }

    if (field.source === "MAKER_INPUT") {
      previewValue = field.default_value || "Filled during inspection";
    }

    if (field.source === "PROJECT_CONTEXT") {
      previewValue =
        field.system_key === "project_name"
          ? projectName || "Selected project"
          : "Project value";
    }

    if (field.source === "SYSTEM_GENERATED") {
      if (field.system_key === "report_no") {
        previewValue = prefix
          ? `${prefix}-${String(1).padStart(padding, "0")}`
          : "Auto generated";
      } else if (field.system_key === "inspection_date") {
        previewValue = "Inspection date";
      } else {
        previewValue = "Auto generated";
      }
    }

    return {
      ...field,
      previewValue,
    };
  });

  const rowsMap = new Map();

  withPreviewValue.forEach((field) => {
    const rowIndex = Number(field.row_index || 1);

    if (!rowsMap.has(rowIndex)) {
      rowsMap.set(rowIndex, []);
    }

    rowsMap.get(rowIndex).push(field);
  });

  return Array.from(rowsMap.keys())
    .sort((a, b) => a - b)
    .map((rowIndex) =>
      rowsMap
        .get(rowIndex)
        .sort(
          (a, b) =>
            Number(a.column_index || 1) - Number(b.column_index || 1) ||
            Number(a.order_index || 0) - Number(b.order_index || 0),
        ),
    );
}

export function buildHeaderFieldsFromLegacyMeta(meta = {}) {
  return createDefaultHeaderFields().map((field) => ({
    ...field,
    default_value: String(meta?.[field.key] || "").trim(),
  }));
}
