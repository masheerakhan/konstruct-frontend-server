import RAW from "./pqdChecklists.generated.json";

/** @type {Record<string, { label: string, items: Array<{ slNo: number, text: string, remarksHint?: string }> }>} */
export const PQD_CHECKLIST_DEFINITIONS = RAW;

export const PQD_CHECKLIST_TYPE_OPTIONS = Object.entries(
  PQD_CHECKLIST_DEFINITIONS,
).map(([value, meta]) => ({
  value,
  label: meta.label,
}));

export const PQD_ROW_STATUS_OPTIONS = [
  { value: "FC", label: "Fully Complied" },
  { value: "PC", label: "Partially Complied" },
  { value: "NA", label: "Not Applicable" },
];

function newPqdRowId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `pqd-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * @param {string} typeKey
 * @returns {Array<{ id: string, slNo: number, document: string, status: string, remarks: string, remarksHint: string, files: File[] }>}
 */
export function createPqdChecklistRowsForType(typeKey) {
  const def = PQD_CHECKLIST_DEFINITIONS[typeKey];
  if (!def?.items?.length) return [];
  return def.items.map((it) => ({
    id: newPqdRowId(),
    slNo: it.slNo,
    document: it.text,
    status: "FC",
    remarks: "",
    remarksHint: it.remarksHint || "",
    files: [],
  }));
}

/** Files for a PQD checklist row (`files[]` or legacy single `file`). */
export function getPqdRowFiles(row) {
  if (!row || typeof row !== "object") return [];
  if (Array.isArray(row.files))
    return row.files.filter((f) => f instanceof File);
  if (row.file instanceof File) return [row.file];
  return [];
}

export function getPqdChecklistTypeLabel(typeKey) {
  return PQD_CHECKLIST_DEFINITIONS[typeKey]?.label || "";
}

/** User-added checklist row (document title typed in form). */
export function createPqdAdditionalRow() {
  return {
    id: newPqdRowId(),
    slNo: "—",
    document: "",
    isCustom: true,
    status: "FC",
    remarks: "",
    remarksHint: "",
    files: [],
  };
}
