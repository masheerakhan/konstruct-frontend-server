/**
 * Storage utilities for Transmittal drafts and submitted documents.
 * Drafts expire after 24 hours.
 */

import {
  normalizeFullSystemChecklist,
  FULL_SYSTEM_UPLOAD_KEYS,
  createDefaultPqpAnnexRows,
  getChecklistFilesList,
  getFullSystemRowComplianceTables,
  getPqpRowFiles,
  normalizePqpAnnexRows,
  getWmsReferenceRowFiles,
  createDefaultWmsReferences,
  getWmsConstructionBlockFiles,
  createDefaultWmsConstructionSequence,
  createDefaultWmsAnnexures,
  getWmsAnnexureFiles,
} from "./approvedVendors";
import { getPqdRowFiles, createPqdChecklistRowsForType } from "./pqdChecklists";
import { getDmpRowFiles, createDefaultDmpChecklistRows } from "./dmpChecklists";

function serializeChecklistRowsWithFiles(rows, getRowFiles) {
  return (rows || []).map((r) => {
    const base = {
      id: r.id,
      slNo: r.slNo,
      document: r.document != null ? String(r.document) : "",
      kind: r.kind,
      status: r.status,
      remarks: r.remarks != null ? String(r.remarks) : "",
      remarksHint: r.remarksHint != null ? String(r.remarksHint) : "",
      isCustom: Boolean(r.isCustom),
      files: getRowFiles(r).map((f) =>
        f && f instanceof File ? { _placeholder: true, name: f.name, size: f.size } : null
      ),
    };
    if (r.customVariant === "third_party" || r.customVariant === "checklist") {
      base.customVariant = r.customVariant;
    }
    return base;
  });
}

function deserializeChecklistRowsWithFiles(serializedRows) {
  if (!Array.isArray(serializedRows)) return [];
  return serializedRows.map((r) => ({
    id: r.id,
    slNo: r.slNo,
    document: r.document,
    kind: r.kind,
    status: r.status,
    remarks: r.remarks ?? "",
    remarksHint: r.remarksHint ?? "",
    isCustom: Boolean(r.isCustom),
    customVariant:
      r.customVariant === "third_party" || r.customVariant === "checklist"
        ? r.customVariant
        : undefined,
    files: Array.isArray(r.files)
      ? r.files
          .map((x) => (x && x._placeholder ? null : x instanceof File ? x : null))
          .filter(Boolean)
      : [],
  }));
}

function serializeComplianceTable(t) {
  if (!t || typeof t !== "object") return null;
  const copy = { ...t, rows: t.rows ? [...t.rows] : [] };
  if (t.attachedFile && t.attachedFile instanceof File) {
    copy.attachedFile = { _placeholder: true, name: t.attachedFile.name, size: t.attachedFile.size };
  } else {
    copy.attachedFile = null;
  }
  return copy;
}

export const DRAFT_EXPIRY_MS = 24 * 60 * 60 * 1000;
const STORAGE_KEY = "konstruct-transmittal-folders-v1";
const PENDING_ADD_KEY = "konstruct-transmittal-pending-add";

/** Strip File objects from formData for JSON serialization. Files cannot be stored in localStorage. */
export function serializeFormData(formData) {
  if (!formData) return null;
  const out = { ...formData };

  out.checklistFiles = {};
  if (formData.checklistFiles && typeof formData.checklistFiles === "object") {
    Object.keys(formData.checklistFiles).forEach((k) => {
      const f = formData.checklistFiles[k];
      if (Array.isArray(f)) {
        out.checklistFiles[k] = f.map((file) =>
          file && file instanceof File ? { _placeholder: true, name: file.name, size: file.size } : null
        );
      } else if (f && f instanceof File) {
        out.checklistFiles[k] = { _placeholder: true, name: f.name, size: f.size };
      }
    });
  }

  out.complianceTables = (formData.complianceTables || []).map((t) => {
    const copy = { ...t, rows: t.rows ? [...t.rows] : [] };
    if (t.attachedFile && t.attachedFile instanceof File) {
      copy.attachedFile = { _placeholder: true, name: t.attachedFile.name, size: t.attachedFile.size };
    } else {
      copy.attachedFile = null;
    }
    return copy;
  });

  out.pqpAnnexRows = (formData.pqpAnnexRows || []).map((r) => {
    const files = getPqpRowFiles(r);
    return {
      id: r.id,
      documentName: r.documentName != null ? String(r.documentName) : "",
      files: files.map((f) =>
        f && f instanceof File ? { _placeholder: true, name: f.name, size: f.size } : null
      ),
    };
  });

  out.pqdChecklistType = formData.pqdChecklistType != null ? String(formData.pqdChecklistType) : "";
  out.pqdChecklistRows = serializeChecklistRowsWithFiles(formData.pqdChecklistRows, getPqdRowFiles);
  out.dmpChecklistRows = serializeChecklistRowsWithFiles(formData.dmpChecklistRows, getDmpRowFiles);

  out.wmsScopeObjective =
    formData.wmsScopeObjective != null ? String(formData.wmsScopeObjective) : "";
  out.wmsReferences = (formData.wmsReferences || []).map((r) => ({
    id: r.id,
    refType: r.refType != null ? String(r.refType) : "specification",
    sectionClass: r.sectionClass != null ? String(r.sectionClass) : "",
    files: getWmsReferenceRowFiles(r).map((f) =>
      f && f instanceof File ? { _placeholder: true, name: f.name, size: f.size } : null
    ),
  }));

  const wcs = formData.wmsConstructionSequence;
  const wcsBase = createDefaultWmsConstructionSequence();
  const serBlock = (b) => ({
    text: b?.text != null ? String(b.text) : "",
    files: getWmsConstructionBlockFiles(b).map((f) =>
      f && f instanceof File ? { _placeholder: true, name: f.name, size: f.size } : null
    ),
  });
  out.wmsConstructionSequence =
    wcs && typeof wcs === "object"
      ? {
          preInstall: serBlock(wcs.preInstall ?? wcsBase.preInstall),
          during: serBlock(wcs.during ?? wcsBase.during),
          post: serBlock(wcs.post ?? wcsBase.post),
        }
      : {
          preInstall: serBlock(wcsBase.preInstall),
          during: serBlock(wcsBase.during),
          post: serBlock(wcsBase.post),
        };

  const wa = formData.wmsAnnexures;
  const waBase = createDefaultWmsAnnexures();
  const serAnnexureRow = (r) => ({
    files: getWmsAnnexureFiles(r).map((f) =>
      f && f instanceof File ? { _placeholder: true, name: f.name, size: f.size } : null
    ),
  });
  out.wmsAnnexures =
    wa && typeof wa === "object"
      ? {
          annexure1: serAnnexureRow(wa.annexure1 ?? waBase.annexure1),
          annexure2: serAnnexureRow(wa.annexure2 ?? waBase.annexure2),
          annexure3: serAnnexureRow(wa.annexure3 ?? waBase.annexure3),
          annexure4: serAnnexureRow(wa.annexure4 ?? waBase.annexure4),
        }
      : {
          annexure1: serAnnexureRow(waBase.annexure1),
          annexure2: serAnnexureRow(waBase.annexure2),
          annexure3: serAnnexureRow(waBase.annexure3),
          annexure4: serAnnexureRow(waBase.annexure4),
        };

  const rows = formData.fullSystemChecklist?.rows || [];
  out.fullSystemChecklist = {
    rows: rows.map((r) => {
      const statusOut = {};
      FULL_SYSTEM_UPLOAD_KEYS.forEach((k) => {
        const f = r.statusFiles?.[k];
        if (f && f instanceof File) {
          statusOut[k] = { _placeholder: true, name: f.name, size: f.size };
        }
      });
      const rowComplianceTables = getFullSystemRowComplianceTables(r);
      return {
        id: r.id,
        boq: r.boq,
        materialDescription: r.materialDescription,
        approvedBrand: r.approvedBrand,
        proposedVendors: r.proposedVendors,
        remark: r.remark,
        statusFiles: statusOut,
        complianceTables: rowComplianceTables
          .map((t) => serializeComplianceTable(t))
          .filter(Boolean),
      };
    }),
  };

  return out;
}

/** Restore formData from serialized object. File placeholders become null; user must re-upload. */
export function deserializeFormData(serialized) {
  if (!serialized) return null;
  const out = { ...serialized };

  out.checklistFiles = {};
  if (serialized.checklistFiles && typeof serialized.checklistFiles === "object") {
    Object.keys(serialized.checklistFiles).forEach((k) => {
      const v = serialized.checklistFiles[k];
      if (Array.isArray(v)) {
        out.checklistFiles[k] = v.map(() => null);
      } else if (v && v._placeholder) {
        out.checklistFiles[k] = null;
      }
    });
  }

  out.complianceTables = (serialized.complianceTables || []).map((t) => ({
    ...t,
    attachedFile: t.attachedFile && t.attachedFile._placeholder ? null : t.attachedFile,
  }));

  const rawFc = serialized.fullSystemChecklist;
  if (Array.isArray(rawFc?.rows)) {
    out.fullSystemChecklist = normalizeFullSystemChecklist({
      rows: rawFc.rows.map((r) => {
        const sf = { ...(r.statusFiles || {}) };
        Object.keys(sf).forEach((k) => {
          if (sf[k] && sf[k]._placeholder) sf[k] = null;
        });
        let tables = [];
        if (Array.isArray(r.complianceTables)) {
          tables = r.complianceTables.map((ct) =>
            ct && typeof ct === "object"
              ? {
                  ...ct,
                  attachedFile:
                    ct.attachedFile && ct.attachedFile._placeholder ? null : ct.attachedFile,
                }
              : null
          ).filter(Boolean);
        } else if (r.complianceTable && typeof r.complianceTable === "object") {
          const ct = r.complianceTable;
          tables = [
            {
              ...ct,
              attachedFile:
                ct.attachedFile && ct.attachedFile._placeholder ? null : ct.attachedFile,
            },
          ];
        }
        return { ...r, statusFiles: sf, complianceTables: tables };
      }),
    });
  } else {
    out.fullSystemChecklist = normalizeFullSystemChecklist(rawFc);
  }

  if (!Array.isArray(serialized.pqpAnnexRows) || serialized.pqpAnnexRows.length === 0) {
    out.pqpAnnexRows = createDefaultPqpAnnexRows();
  } else {
    const restored = serialized.pqpAnnexRows.map((r) => {
      const fromArray = Array.isArray(r.files)
        ? r.files.map((x) =>
            x && typeof x === "object" && x._placeholder ? null : x instanceof File ? x : null
          )
        : [];
      const realFromArray = fromArray.filter(Boolean);
      const legacyFile =
        r.file && typeof r.file === "object" && r.file._placeholder
          ? null
          : r.file instanceof File
            ? r.file
            : null;
      const files = realFromArray.length > 0 ? realFromArray : legacyFile ? [legacyFile] : [];
      return {
        id: r.id,
        documentName: r.documentName != null ? String(r.documentName) : "",
        files,
      };
    });
    out.pqpAnnexRows = normalizePqpAnnexRows(restored);
  }

  out.pqdChecklistRows = deserializeChecklistRowsWithFiles(serialized.pqdChecklistRows);
  if (
    out.pqdChecklistType &&
    String(out.pqdChecklistType).trim() &&
    (!out.pqdChecklistRows || out.pqdChecklistRows.length === 0)
  ) {
    out.pqdChecklistRows = createPqdChecklistRowsForType(out.pqdChecklistType);
  }

  out.dmpChecklistRows = deserializeChecklistRowsWithFiles(serialized.dmpChecklistRows);
  if (
    (!out.dmpChecklistRows || out.dmpChecklistRows.length === 0) &&
    out.documentType === "Design Mix"
  ) {
    out.dmpChecklistRows = createDefaultDmpChecklistRows();
  }

  out.wmsScopeObjective =
    serialized.wmsScopeObjective != null ? String(serialized.wmsScopeObjective) : "";
  if (Array.isArray(serialized.wmsReferences) && serialized.wmsReferences.length > 0) {
    out.wmsReferences = serialized.wmsReferences.map((r) => {
      const refType = ["boq", "other", "specification"].includes(r.refType)
        ? r.refType
        : "specification";
      const files = Array.isArray(r.files)
        ? r.files
            .map((x) => (x && x._placeholder ? null : x instanceof File ? x : null))
            .filter(Boolean)
        : [];
      return {
        id: r.id,
        refType,
        sectionClass: r.sectionClass != null ? String(r.sectionClass) : "",
        files,
      };
    });
  } else {
    out.wmsReferences = createDefaultWmsReferences();
  }

  const deBlock = (r) => {
    const files = Array.isArray(r?.files)
      ? r.files
          .map((x) => (x && x._placeholder ? null : x instanceof File ? x : null))
          .filter(Boolean)
      : [];
    return {
      text: r?.text != null ? String(r.text) : "",
      files,
    };
  };
  const rawWcs = serialized.wmsConstructionSequence;
  if (rawWcs && typeof rawWcs === "object") {
    out.wmsConstructionSequence = {
      preInstall: deBlock(rawWcs.preInstall),
      during: deBlock(rawWcs.during),
      post: deBlock(rawWcs.post),
    };
  } else {
    out.wmsConstructionSequence = createDefaultWmsConstructionSequence();
  }

  const deAnnexureRow = (r) => ({
    files: Array.isArray(r?.files)
      ? r.files
          .map((x) => (x && x._placeholder ? null : x instanceof File ? x : null))
          .filter(Boolean)
      : [],
  });
  const rawWa = serialized.wmsAnnexures;
  if (rawWa && typeof rawWa === "object") {
    out.wmsAnnexures = {
      annexure1: deAnnexureRow(rawWa.annexure1),
      annexure2: deAnnexureRow(rawWa.annexure2),
      annexure3: deAnnexureRow(rawWa.annexure3),
      annexure4: deAnnexureRow(rawWa.annexure4),
    };
  } else {
    out.wmsAnnexures = createDefaultWmsAnnexures();
  }

  return out;
}

/** Check if form has meaningful user-entered content (beyond defaults) */
export function hasFormContent(formData) {
  if (!formData) return false;
  return !!(
    formData.documentType ||
    formData.materialType ||
    formData.product ||
    formData.brand ||
    formData.areaOfApplication ||
    formData.materialDescription ||
    formData.blockNo ||
    (formData.fullSystemChecklist?.rows || []).some((r) => {
      const hasCompliance = getFullSystemRowComplianceTables(r).some(
        (ct) =>
          ct &&
          (ct.documentDescription ||
            ct.attachedFile ||
            (ct.rows || []).some(
              (x) =>
                x.technicalRequirement ||
                x.limits ||
                x.valuesPerTDS ||
                x.valuesPerMTC ||
                (x.status && x.status !== "NA") ||
                x.contractorsResponse
            ))
      );
      return (
        r.boq ||
        r.materialDescription ||
        r.approvedBrand ||
        r.proposedVendors ||
        r.remark ||
        Object.values(r.statusFiles || {}).some((f) => !!f) ||
        hasCompliance
      );
    }) ||
    (formData.complianceTables && formData.complianceTables.length > 0) ||
    (formData.checklistRemarks && Object.keys(formData.checklistRemarks).length > 0) ||
    (formData.pqpAnnexRows || []).some((r) => getPqpRowFiles(r).length > 0) ||
    Object.keys(formData.checklistFiles || {}).some(
      (k) => getChecklistFilesList(formData.checklistFiles[k]).length > 0
    ) ||
    (formData.pqdChecklistRows || []).some((r) => getPqdRowFiles(r).length > 0) ||
    !!(formData.pqdChecklistType && String(formData.pqdChecklistType).trim()) ||
    (formData.dmpChecklistRows || []).some((r) => getDmpRowFiles(r).length > 0) ||
    String(formData.wmsScopeObjective || "").trim() ||
    (formData.wmsReferences || []).some(
      (r) =>
        String(r.sectionClass || "").trim() ||
        getWmsReferenceRowFiles(r).length > 0 ||
        (r.refType && r.refType !== "specification")
    ) ||
    (() => {
      const wcs = formData.wmsConstructionSequence;
      if (!wcs || typeof wcs !== "object") return false;
      return ["preInstall", "during", "post"].some(
        (k) =>
          String(wcs[k]?.text || "").trim() || getWmsConstructionBlockFiles(wcs[k]).length > 0
      );
    })() ||
    (() => {
      const wa = formData.wmsAnnexures;
      if (!wa || typeof wa !== "object") return false;
      return ["annexure1", "annexure2", "annexure3", "annexure4"].some(
        (k) => getWmsAnnexureFiles(wa[k]).length > 0
      );
    })()
  );
}

function loadRaw() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    /* ignore */
  }
  return { folders: [], unfiled: [], drafts: [] };
}

function saveRaw(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    /* ignore */
  }
}

export function loadState() {
  const data = loadRaw();
  const now = Date.now();
  const validDrafts = (data.drafts || []).filter((d) => now - (d.createdAt || 0) < DRAFT_EXPIRY_MS);
  if (validDrafts.length !== (data.drafts || []).length) {
    data.drafts = validDrafts;
    saveRaw(data);
  }
  return {
    folders: Array.isArray(data.folders) ? data.folders : [],
    unfiled: Array.isArray(data.unfiled) ? data.unfiled : [],
    drafts: validDrafts,
  };
}

export function saveState(state) {
  saveRaw({
    folders: state.folders || [],
    unfiled: state.unfiled || [],
    drafts: state.drafts || [],
  });
}

export function addDraft(formData, folderId) {
  const data = loadRaw();
  const drafts = data.drafts || [];
  const serialized = serializeFormData(formData);
  if (!serialized) return null;

  const draft = {
    id: `draft-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    formData: serialized,
    folderId: folderId || null,
    createdAt: Date.now(),
  };
  drafts.push(draft);
  data.drafts = drafts;
  saveRaw(data);
  return draft.id;
}

export function getDraft(draftId) {
  const data = loadRaw();
  const draft = (data.drafts || []).find((d) => d.id === draftId);
  if (!draft) return null;
  const now = Date.now();
  if (now - (draft.createdAt || 0) >= DRAFT_EXPIRY_MS) {
    removeDraft(draftId);
    return null;
  }
  return { ...draft, formData: deserializeFormData(draft.formData) };
}

export function removeDraft(draftId) {
  const data = loadRaw();
  data.drafts = (data.drafts || []).filter((d) => d.id !== draftId);
  saveRaw(data);
}

export function setPendingAdd(payload) {
  try {
    sessionStorage.setItem(PENDING_ADD_KEY, JSON.stringify({ ...payload, _ts: Date.now() }));
  } catch (e) {
    /* ignore */
  }
}

export function takePendingAdd() {
  try {
    const raw = sessionStorage.getItem(PENDING_ADD_KEY);
    if (raw) {
      sessionStorage.removeItem(PENDING_ADD_KEY);
      return JSON.parse(raw);
    }
  } catch (e) {
    /* ignore */
  }
  return null;
}
