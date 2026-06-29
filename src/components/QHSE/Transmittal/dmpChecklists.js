import RAW from "./dmpChecklists.generated.json";

function newDmpRowId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `dmp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * @returns {Array<{ id: string, slNo: string, document: string, kind: 'row'|'section', remarks: string, files: File[] }>}
 */
export function createDefaultDmpChecklistRows() {
  return (RAW.rows || []).map((r) => ({
    id: newDmpRowId(),
    slNo: r.slNo != null ? String(r.slNo) : "",
    document: String(r.document || ""),
    kind: r.kind === "section" ? "section" : "row",
    remarks: "",
    files: [],
    isCustom: false,
  }));
}

/** Section title row in generated DMP checklist (match JSON source). */
export const DMP_THIRD_PARTY_SECTION_TITLE = "Third Part Test Reports";

/** @typedef {'checklist' | 'third_party'} DmpCustomVariant */

/** User-added Design Mix checklist row (free-text document / details required). */
export function createDmpCustomRow(overrides = {}) {
  return {
    id: newDmpRowId(),
    slNo: "",
    document: "",
    kind: "row",
    remarks: "",
    files: [],
    isCustom: true,
    customVariant: "checklist",
    ...overrides,
  };
}

export function findThirdPartySectionIndex(rows) {
  const list = rows || [];
  const target = DMP_THIRD_PARTY_SECTION_TITLE.toLowerCase();
  return list.findIndex(
    (r) => r.kind === "section" && String(r.document || "").trim().toLowerCase() === target
  );
}

/** Max plain integer Sr. (1,2,3,…) among checklist rows before the Third Party section. */
export function computeNextChecklistSlNo(rows) {
  const list = rows || [];
  const tp = findThirdPartySectionIndex(list);
  const slice = tp >= 0 ? list.slice(0, tp) : list;
  let max = 0;
  slice.forEach((r) => {
    if (r.kind !== "row") return;
    const s = String(r.slNo ?? "").trim();
    if (/^\d+$/.test(s)) max = Math.max(max, parseInt(s, 10));
  });
  return String(max + 1);
}

function bumpThirdPartyStyleSlNo(prev) {
  const s = String(prev || "").trim();
  if (!s) return "4.1";
  const parts = s.split(".");
  const last = parseInt(parts[parts.length - 1], 10);
  if (!Number.isFinite(last)) return `${s}.1`;
  parts[parts.length - 1] = String(last + 1);
  return parts.join(".");
}

/** Next Sr. in Third Part Test Reports block (4.x / 4.x.y …), from current rows. */
export function computeNextThirdPartySlNo(rows) {
  const list = rows || [];
  const tp = findThirdPartySectionIndex(list);
  if (tp < 0) return "4.1";
  let lastSl = "";
  for (let j = tp + 1; j < list.length; j++) {
    const r = list[j];
    if (r.kind === "section") break;
    if (r.kind === "row") {
      const cand = String(r.slNo ?? "").trim();
      if (cand) lastSl = cand;
    }
  }
  if (!lastSl) return "4.1";
  return bumpThirdPartyStyleSlNo(lastSl);
}

/**
 * @param {unknown[]} rows
 * @param {DmpCustomVariant} variant
 * @returns {unknown[]}
 */
export function insertDmpCustomRow(rows, variant) {
  const list = [...(rows || [])];
  const tpIdx = findThirdPartySectionIndex(list);

  if (variant === "checklist") {
    const slNo = computeNextChecklistSlNo(list);
    const insertAt = tpIdx >= 0 ? tpIdx : list.length;
    const row = createDmpCustomRow({ customVariant: "checklist", slNo });
    list.splice(insertAt, 0, row);
    return list;
  }

  const slNo = computeNextThirdPartySlNo(list);
  const row = createDmpCustomRow({ customVariant: "third_party", slNo });
  if (tpIdx < 0) {
    list.push(row);
    return list;
  }
  let insertAt = tpIdx + 1;
  for (let j = tpIdx + 1; j < list.length; j++) {
    if (list[j].kind === "section") break;
    insertAt = j + 1;
  }
  list.splice(insertAt, 0, row);
  return list;
}

/** Files for a DMP checklist row (`files[]` or legacy single `file`). */
export function getDmpRowFiles(row) {
  if (!row || typeof row !== "object") return [];
  if (row.kind === "section") return [];
  if (Array.isArray(row.files)) return row.files.filter((f) => f instanceof File);
  if (row.file instanceof File) return [row.file];
  return [];
}
