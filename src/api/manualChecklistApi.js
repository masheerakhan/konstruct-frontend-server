import { checklistInstance } from "./axiosInstance";

const BASE_URL = "manual-checklist-templates/";

// export const getManualChecklistTemplates = async (projectId) =>
//   checklistInstance.get(
//     `/manual-checklist-templates/?project_id=${projectId}`
//   );
export const getManualChecklistTemplates = async (params = {}) =>
  checklistInstance.get("/manual-checklist-templates/", {
    params,
    headers: {
      "Content-Type": "application/json",
    },
  });

export const getManualChecklistTemplateById = async (id) => {
  return checklistInstance.get(`${BASE_URL}${id}/`);
};

export const createManualChecklistTemplate = async (payload) => {
  return checklistInstance.post(BASE_URL, payload);
};

export const updateManualChecklistTemplateById = async (id, payload) => {
  return checklistInstance.put(`${BASE_URL}${id}/`, payload);
};

export const deleteManualChecklistTemplateById = async (id) => {
  return checklistInstance.delete(`${BASE_URL}${id}/`);
};

export const MANUAL_CHECKLIST_API = {
  TEMPLATE_LIST: "manual-checklist-templates/",
  CATEGORY_LIST: "manual-checklist-categories/",
};

export const getManualChecklistCategories = async () => {
  return checklistInstance.get(MANUAL_CHECKLIST_API.CATEGORY_LIST);
};

export const getManualChecklistTemplateList = async () =>
  checklistInstance.get("manual-checklist-template/", {
    headers: {
      "Content-Type": "application/json",
    },
  });

// =====================================================
// MANUAL CHECKLIST
// =====================================================

// CREATE CHECKLIST
export const createManualChecklist = async (payload) =>
  checklistInstance.post("manual-checklists/create/", payload, {
    headers: {
      "Content-Type": "application/json",
    },
  });

//GET MANUAL TEMPLATE CHECKLISTS LIST
export const getManualTemplateList = async (project_id) =>
  checklistInstance.get(`manual-templates/filter/?project_id=${project_id}`, {
    headers: {
      "Content-Type": "application/json",
    },
  });

// LIST CHECKLISTS
export const getManualChecklistList = async (role, filters = {}) =>
  checklistInstance.get("/manual-checklists/", {
    params: {
      role,
      ...filters,
    },
    headers: {
      "Content-Type": "application/json",
    },
  });

// CHECKLIST DETAIL
export const getManualChecklistById = async (checklistId, role) =>
  checklistInstance.get(`manual-checklists/${checklistId}/?role=${role}`, {
    headers: {
      "Content-Type": "application/json",
    },
  });

// COMPLETE CHECKLIST
export const completeManualChecklist = async (payload) =>
  checklistInstance.post("manual-checklists/complete/", payload, {
    headers: {
      "Content-Type": "application/json",
    },
  });

export const deleteManualChecklist = async (id) =>
  checklistInstance.delete(`manual-checklists/${id}/`, {
    headers: {
      "Content-Type": "application/json",
    },
  });

export const getQuestionTimeline = async (threadId) => {
  const token = localStorage.getItem("token");

  return checklistInstance.get(
    `manual-checklists/questions/${threadId}/timeline/`,
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    },
  );
};

// =====================================================
// QUESTION ROUTING
// =====================================================

// ROUTE QUESTION
export const routeManualChecklistQuestion = async (payload) =>
  checklistInstance.post("manual-checklists/questions/route/", payload, {
    headers: {
      "Content-Type": "application/json",
    },
  });

// RESPOND QUESTION
export const respondManualChecklistQuestion = async (payload) =>
  checklistInstance.post("manual-checklists/questions/respond/", payload, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

// COMPLETE QUESTION
export const completeManualChecklistQuestion = async (payload) =>
  checklistInstance.post("manual-checklists/questions/complete/", payload, {
    headers: {
      "Content-Type": "application/json",
    },
  });

// =====================================================
// DASHBOARD
// =====================================================

// MY PENDING QUESTIONS
export const getMyPendingQuestions = async () =>
  checklistInstance.get("manual-checklists/my-pending-questions/", {
    headers: {
      "Content-Type": "application/json",
    },
  });

// =====================================================
// TIMELINE
// =====================================================

// QUESTION TIMELINE
export const getManualChecklistQuestionTimeline = async (threadId) =>
  checklistInstance.get(`manual-checklists/questions/${threadId}/timeline/`, {
    headers: {
      "Content-Type": "application/json",
    },
  });

// DOWNLOAD REPORT
export const downloadManualChecklistReport = async (checklistId, role) =>
  checklistInstance.get(
    `manual-checklists/${checklistId}/report/?role=${role}`,
    {
      responseType: "blob",
    },
  );
