/*
---
QHSE MIGRATION NOTE
File: inspectionChecklistApi.js

Purpose: Centralised API layer for all QHSE Inspection Checklist HTTP calls. Covers: template CRUD, checklist instance lifecycle (create/submit/approve/reject), PDF report download, and reviewer list fetching.

Workflow:
Folder 22 / Template Creation / Checklist Creation / Maker Review / Checker Review / Supervisor Approval / PDF Export / Dashboard

Service:
QHSEMicroService (8004)

Migration Reason: Extracted and repointed to use qhseInstance (port 8004) to isolate QHSE module from legacy ChecklistMicroService. All category operations were also localized here.

Related Files: axiosInstance.js, InspectionChecklistManager.jsx, QHSEChecklistCreatePage.jsx
----------------------------------------
*/
import axiosInstance, { qhseInstance as checklistInstance } from "../../../api/axiosInstance";

const BASE = "safety/templates/";
const INSTANCE_BASE = "safety/checklists/";

// QHSE:
// Loads checklist templates from QHSEMicroService (8004).
// Triggered when Folder 22 Checklist Library opens.
/**
 * Fetch all QHSE Inspection Checklist templates for a given project.
 */
export async function fetchInspectionChecklists({ orgId, projectId }) {
  const params = { is_latest: "true", module: "qhse" };
  if (orgId) params.org_id = orgId;
  if (projectId) params.project_id = projectId;

  const res = await checklistInstance.get(BASE, { params });
  return res.data?.results ?? res.data ?? [];
}

/**
 * Fetch a single template with its full question list.
 */
export async function fetchInspectionChecklistDetail(id) {
  const res = await checklistInstance.get(`${BASE}${id}/`);
  return res.data;
}

/**
 * Create a new QHSE Inspection Checklist template.
 * Sends multipart/form-data to support image upload.
 */
export async function createInspectionChecklist(formData) {
  if (formData instanceof FormData) {
    formData.append("module", "qhse");
  } else {
    formData.module = "qhse";
  }
  const res = await checklistInstance.post(BASE, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

/**
 * Update an existing QHSE Inspection Checklist template.
 */
export async function updateInspectionChecklist(id, formData) {
  if (formData instanceof FormData) {
    formData.append("module", "qhse");
  } else {
    formData.module = "qhse";
  }
  const res = await checklistInstance.put(`${BASE}${id}/`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

/**
 * Delete a checklist template by id.
 */
export async function deleteInspectionChecklist(id) {
  await checklistInstance.delete(`${BASE}${id}/`);
}

/**
 * Fetch all QHSE safety categories to populate the Category dropdown.
 */
export async function fetchSafetyCategories({ orgId, projectId } = {}) {
  const params = {};
  if (orgId) params.org_id = orgId;
  if (projectId) params.project_id = projectId;

  const res = await checklistInstance.get("safety/categories/", { params });
  return res.data?.results ?? res.data ?? [];
}

export async function createSafetyCategory(payload) {
  const res = await checklistInstance.post("safety/categories/", payload, {
    headers: { "Content-Type": "application/json" },
  });
  return res;
}

export async function deleteSafetyCategory(id) {
  const res = await checklistInstance.delete(`safety/categories/${id}/`);
  return res;
}

/* ──────────────── Checklist Instance Workflow APIs ──────────────── */

/**
 * Fetch safety checklist instances.
 */
export async function fetchChecklistInstances({ orgId, projectId, assignedToMe, status }) {
  const params = {};
  if (orgId) params.org_id = orgId;
  if (projectId) params.project_id = projectId;
  if (assignedToMe) params.assigned_to_me = "true";
  if (status) params.status = status;

  const res = await checklistInstance.get(INSTANCE_BASE, { params });
  return res.data?.results ?? res.data ?? [];
}

/**
 * Fetch single checklist instance details.
 */
export async function fetchChecklistInstanceDetail(id, orgId) {
  const params = {};
  if (orgId) params.org_id = orgId;
  const res = await checklistInstance.get(`${INSTANCE_BASE}${id}/`, { params });
  return res.data;
}

/**
 * Initialize a new checklist instance from a template (returns instance object).
 */
export async function createChecklistInstance({ templateId, projectId, orgId, title, movement_assignments }) {
  const body = {
    template_id: templateId,
    project_id: projectId,
    org_id: orgId,
    title: title || "",
  };
  if (movement_assignments) {
    body.movement_assignments = movement_assignments;
  }
  const res = await checklistInstance.post(INSTANCE_BASE, body);
  return res.data;
}

/**
 * Submit answers, photos, and signature for a checklist instance (Maker step).
 */
export async function submitChecklistInstance(id, formData) {
  const res = await checklistInstance.post(`${INSTANCE_BASE}${id}/submit/`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

/**
 * Approve a checklist instance (Supervisor / Checker step).
 */
export async function approveChecklistInstance(id, formData) {
  const res = await checklistInstance.post(`${INSTANCE_BASE}${id}/approve/`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

/**
 * Reject a checklist instance (Supervisor / Checker step).
 */
export async function rejectChecklistInstance(id, formData) {
  const res = await checklistInstance.post(`${INSTANCE_BASE}${id}/reject/`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

/**
 * Fetch project/organization users to populate the review assignee dropdown.
 */
export async function fetchProjectUsers() {
  const res = await axiosInstance.get("users-by-creator/");
  return res.data?.results ?? res.data ?? [];
}

/**
 * Download the safety checklist PDF report.
 */
export async function downloadChecklistReportPdf(id) {
  const res = await checklistInstance.get(`${INSTANCE_BASE}${id}/report/`, {
    responseType: "blob",
  });
  return res.data;
}

/**
 * Upsert a checklist draft on the server.
 */
export async function upsertChecklistDraft(formData) {
  const res = await checklistInstance.post(`${INSTANCE_BASE}draft_upsert/`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

/**
 * Fetch all drafts created by the current user.
 */
export async function fetchChecklistDrafts() {
  const res = await checklistInstance.get(`${INSTANCE_BASE}drafts/`);
  return res.data?.results ?? res.data ?? [];
}

/**
 * Fetch a single draft detail by ID.
 */
export async function fetchChecklistDraftDetail(id) {
  const res = await checklistInstance.get(`${INSTANCE_BASE}${id}/draft_detail/`);
  return res.data;
}

/**
 * Delete (discard) a draft on the server.
 */
export async function deleteChecklistDraft(id) {
  const res = await checklistInstance.delete(`${INSTANCE_BASE}${id}/draft_delete/`);
  return res.data;
}

