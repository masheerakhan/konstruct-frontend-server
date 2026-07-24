import axiosInstance from "./axiosInstance";
import {
  projectInstance,
  checklistInstance,
  NEWchecklistInstance,
} from "./axiosInstance";
import { organnizationInstance } from "./axiosInstance";
import axios from "axios";

const __isLoggingOut = () => localStorage.getItem("__LOGGING_OUT__") === "1";
const __hasAccess = () => !!localStorage.getItem("ACCESS_TOKEN");

// helper: get root domain from axiosInstance baseURL safely
const __getApiRoot = () => {
  try {
    const rawBase = axiosInstance?.defaults?.baseURL || "";
    // rawBase could be: "https://konstruct.world/api" OR "/api" OR "https://konstruct.world/users"
    const u = new URL(rawBase, window.location.origin);

    // remove trailing "/api" or "/users" if present
    u.pathname = u.pathname.replace(/\/(api|users)\/?$/, "/");
    const root = (u.origin + u.pathname).replace(/\/$/, "");
    return root || window.location.origin;
  } catch (e) {
    return window.location.origin;
  }
};

// helper: try multiple URLs (useful when env/baseURL differs)
const __postMultipartWithFallback = async (
  instance,
  urlList,
  formData,
  config = {},
) => {
  let lastErr = null;

  for (const url of urlList) {
    try {
      // NOTE: Do NOT force Content-Type; let browser/axios set multipart boundary
      return await instance.post(url, formData, config);
    } catch (err) {
      lastErr = err;
      const status = err?.response?.status;

      // only fallback on 404 (route not found). Other errors should stop.
      if (status && status !== 404) throw err;

      // if no response (network error), also stop
      if (!err?.response) throw err;
    }
  }

  throw lastErr;
};

const __getBlobWithFallback = async (instance, urlList, config = {}) => {
  let lastErr = null;

  for (const url of urlList) {
    try {
      return await instance.get(url, config);
    } catch (err) {
      lastErr = err;
      const status = err?.response?.status;

      // only fallback on 404
      if (status && status !== 404) throw err;

      // no response = network error
      if (!err?.response) throw err;
    }
  }

  throw lastErr;
};

// ===== FORMS: JSON request fallback helper (handles /users/forms OR /forms OR /api/forms) =====
const __formsUrlCandidates = (path) => {
  const root = __getApiRoot(); // e.g. https://konstruct.world
  const p = String(path || "");
  const p2 = p.startsWith("/") ? p : `/${p}`;

  // candidates (order matters)
  return [
    `${root}/users/forms${p2}`,
    `${root}/forms${p2}`,
    `${root}/api/forms${p2}`,
    `/users/forms${p2}`,
    `/forms${p2}`,
    `/api/forms${p2}`,
  ];
};

const __jsonWithFallback = async (
  instance,
  { method = "get", urlList = [], params, data, config = {} },
) => {
  let lastErr = null;

  for (const url of urlList) {
    try {
      return await instance.request({
        url,
        method,
        params,
        data,
        ...config,
        headers: {
          ...(config.headers || {}),
          Accept: "application/json",
        },
      });
    } catch (err) {
      lastErr = err;
      const status = err?.response?.status;

      // fallback only on 404
      if (status && status !== 404) throw err;
      if (!err?.response) throw err;
    }
  }

  throw lastErr;
};

// export function downloadBlob(blob, filename = "file.pdf") {
//   const url = window.URL.createObjectURL(blob);
//   const a = document.createElement("a");
//   a.href = url;
//   a.download = filename;
//   document.body.appendChild(a);
//   a.click();
//   a.remove();
//   window.URL.revokeObjectURL(url);
// }
export function downloadBlob(blob, filename = "file.pdf") {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();

  // ✅ revoke after a bit (safer)
  setTimeout(() => window.URL.revokeObjectURL(url), 5000);
}

export function filenameFromDisposition(disposition) {
  if (!disposition) return null;
  // attachment; filename="WIR_123.pdf"
  const m =
    /filename\*=UTF-8''([^;]+)|filename="([^"]+)"|filename=([^;]+)/i.exec(
      disposition,
    );
  const name =
    m && (m[1] || m[2] || m[3]) ? decodeURIComponent(m[1] || m[2] || m[3]) : "";
  return (name || "").trim() || null;
}

export const login = async (data) =>
  axiosInstance.post("/token/", data, {
    headers: {
      "Content-Type": "application/json",
    },
  });

export const mobileTokenLogin = async (token) =>
  axiosInstance.post(
    "/auth/mobile-token-login/",
    {
      token,
    },
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
  );



export const deleteChecklistById = async (checklistId) =>
  NEWchecklistInstance.delete(`/checklists/${checklistId}/`, {
    headers: {
      "Content-Type": "application/json",
    },
  });

export const createUser = async (data) =>
  axiosInstance.post("/user/create-user/", data, {
    headers: {
      "Content-Type": "application/json",
    },
  });

// api.js

export const createRoom = async (data) =>
  projectInstance.post("/rooms/", data, {
    headers: {
      "Content-Type": "application/json",
    },
  });

export const getRoomsByProject = async (projectId) =>
  projectInstance.get(`/rooms/by_project/?project_id=${projectId}`, {
    headers: {
      "Content-Type": "application/json",
    },
  });

export const createOrganization = async (data) =>
  organnizationInstance.post("/organizations/", data, {
    headers: {
      "Content-Type": "application/json",
    },
  });

export const getOrganizationById = (orgId) => {
  return organnizationInstance.get(`/organizations/${orgId}/`);
};

export const assignOrganizationToUser = async (user_id, organization_id) =>
  organnizationInstance.post(
    "/assign-user-org/",
    { user_id, organization_id },
    {
      headers: { "Content-Type": "application/json" },
    },
  );

export const createCompany = async (data) =>
  organnizationInstance.post("/companies/", data, {
    headers: {
      "Content-Type": "application/json",
    },
  });

export const createProject = async (data) =>
  projectInstance.post("/projects/", data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

export const GEtbyProjectID = async (id) =>
  projectInstance.get(`/projects/${id}`, {
    // ✅ Use the id parameter
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

export const allorgantioninfototalbyUser_id = async (id) =>
  organnizationInstance.get(`user-orgnizationn-info/${id}/`, {
    headers: {
      "Content-Type": "application/json",
    },
  });

export const getUserDetailsById = async (id) =>
  axiosInstance.get(`users/${id}`, {
    headers: {
      "Content-Type": "application/json",
    },
  });

export const Allprojects = async () =>
  projectInstance.get(`/projects/`, {
    headers: {
      "Content-Type": "application/json",
    },
  });

export const createEntity = async (data) =>
  organnizationInstance.post(`/entities/`, data, {
    headers: {
      "Content-Type": "application/json",
    },
  });

export const getOrganizationDetailsById = async (id) =>
  organnizationInstance.get(`/organizations/by-user/${id}/`, {
    headers: {
      "Content-Type": "application/json",
    },
  });

export const getOrganization = async () =>
  organnizationInstance.get(`/organization-list/`, {
    headers: {
      "Content-Type": "application/json",
    },
  });

export const getCompanyDetailsById = async (id) =>
  organnizationInstance.get(
    `/company/get-company-details-by-organization-id/?organization_id=${id}`,
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

//NOT IN USE
// export const getProjectDetailsById = async (id) => {
//   console.log(id, "id project");
//   return projectInstance.get(`/project/get-project-details-by-company-id/`, {
//     headers: {
//       "Content-Type": "application/json",
//     },
//   });
// };

export const getProjectDetailsById = async (id) =>
  projectInstance.get(`/projects/${id}/`, {
    headers: {
      "Content-Type": "application/json",
    },
  });

export const getPRojectbyYourPErmission = async () =>
  projectInstance.get("projects/by_user_scope/", {
    headers: {
      "Content-Type": "application/json",
    },
  });

export const getProjectDetails = async () =>
  projectInstance.get("/project/get-project-details/", {
    headers: {
      "Content-Type": "application/json",
    },
  });

export const createPurpose = async (data) =>
  projectInstance.post("purposes/", data, {
    headers: {
      "Content-Type": "application/json",
    },
  });

export const getPurposeByProjectId = async (id) =>
  projectInstance.get(`purpose/get-purpose-details-by-project-id/${id}/`, {
    headers: {
      "Content-Type": "application/json",
    },
  });

export const getMyChecklists = async () =>
  NEWchecklistInstance.get("checklists/my-checklists/", {
    headers: {
      "Content-Type": "application/json",
    },
  });

export const createPhase = async (data) =>
  projectInstance.post("phase/create-phases/", data, {
    headers: {
      "Content-Type": "application/json",
    },
  });

export const getPhaseDetailsByProjectId = async (id) =>
  projectInstance.get(`phases/by-project/${id}`, {
    headers: {
      "Content-Type": "application/json",
    },
  });

export const getProjectPhases = async (projectid) =>
  projectInstance.get(`phases/list/${projectid}/`, {
    headers: {
      "Content-Type": "application/json",
    },
  });

export const createStage = async (data) =>
  projectInstance.post("stages/", data, {
    headers: {
      "Content-Type": "application/json",
    },
  });

export const GetstagebyPhaseid = async (id) =>
  projectInstance.get(`stages/by_phase/${id}/`, {
    headers: {
      "Content-Type": "application/json",
    },
  });

export const getProjectStages = async (phase_id) =>
  projectInstance.get(`stages/list/by_phase/${phase_id}/`, {
    headers: {
      "Content-Type": "application/json",
    },
  });

export const deleteStage = async (id) =>
  projectInstance.delete(`stages/${id}/`, {
    headers: {
      "Content-Type": "application/json",
    },
  });

export const getStageDetailsByProjectId = async (id) =>
  projectInstance.get(`get-stage-details-by-project-id/${id}/`, {
    headers: {
      "Content-Type": "application/json",
    },
  });

export const createTower = async (data) =>
  projectInstance.post("/buildings/", data, {
    headers: {
      "Content-Type": "application/json",
      //   "Access-Control-Allow-Origin": "*",
    },
  });

export const fetchTowersByProject = async (id) =>
  projectInstance.get(`/buildings/by_project/${id}/`, {
    headers: {
      "Content-Type": "application/json",
      //   "Access-Control-Allow-Origin": "*",
    },
  });

export const fetchTowerListByProject = async (id) =>
  projectInstance.get(`/buildings/list/by_project/${id}/`, {
    headers: {
      "Content-Type": "application/json",
      //   "Access-Control-Allow-Origin": "*",
    },
  });

export const DeleteTowerByid = async (id) =>
  projectInstance.delete(`/buildings/${id}/`, {
    headers: {
      "Content-Type": "application/json",
      //   "Access-Control-Allow-Origin": "*",
    },
  });

export const getBuildingnlevel = async (id) =>
  projectInstance.get(`buildings/with-levels/by_project/${id}/`, {
    headers: {
      "Content-Type": "application/json",
      //   "Access-Control-Allow-Origin": "*",
    },
  });

export const updateTower = async (towerId, data) =>
  projectInstance.patch(`/buildings/${towerId}/`, data, {
    headers: {
      "Content-Type": "application/json",
    },
  });

// export const getTowerDetailsByProjectId = async (id) =>
//   axiosInstance.get(`/tower/get-tower-details-by-id/?project_id=${id}`, {
//     headers: {
//       "Content-Type": "application/json",
//     },
//   });

export const createLevel = async (data) =>
  projectInstance.post("/levels/", data, {
    headers: {
      "Content-Type": "application/json",
    },
  });

export const getLevelsByTowerId = async (id) =>
  projectInstance.get(`/levels/by_building/${id}/`, {
    headers: {
      "Content-Type": "application/json",
    },
  });

export const getLevelsWithFlatsByBuilding = async (id) =>
  projectInstance.get(`/levels-with-flats/${id}/`, {
    headers: {
      "Content-Type": "application/json",
    },
  });
export const getBuildingsById = async (id) =>
  projectInstance.get(`/levels-with-flats/${id}/`, {
    headers: {
      "Content-Type": "application/json",
    },
  });

export const updateLevel = async ({ id, name, building }) =>
  projectInstance.put(
    `/levels/${id}/`,
    { name, building },
    {
      headers: { "Content-Type": "application/json" },
    },
  );

export const deleteLevel = async (id) =>
  projectInstance.delete(`/levels/${id}/`, {
    headers: {
      "Content-Type": "application/json",
    },
  });

export const NestedZonenSubzone = async (data) => {
  projectInstance.post("buildings/with-levels-zones/bulk-create/", data, {
    headers: {
      "Content-Type": "application/json",
    },
  });
};

export const zonewithbluidlingwithlevel = async (id) =>
  projectInstance.get(`/buildings/with-levels-and-zones/by_project/${id}/`, {
    headers: {
      "Content-Type": "application/json",
    },
  });

// export const createRoom = async (data) =>
//   axiosInstance.post("/room/create-room/", data, {
//     headers: {
//       "Content-Type": "application/json",
//     },
//   });

export const getRooms = async (id) =>
  axiosInstance.get(`/room/get-room-details-by-company-id/?company_id=${id}`, {
    headers: {
      "Content-Type": "application/json",
    },
  });

export const createFlatType = async (data) =>
  projectInstance.post("/flattypes/", data, {
    headers: {
      "Content-Type": "application/json",
    },
  });

export const getFlatTypes = async (id, token) =>
  projectInstance.get(`/flattypes/by_project/${id}/`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

export const updateFlatType = async (data) => {
  console.log(data, "DATA FLAT TYPE");
  return projectInstance.put(
    "/flat-type/update-room-type-by-flat-type/",
    data,
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
  );
};

export const createUnit = async (data) =>
  projectInstance.post("/flats/", data, {
    headers: {
      "Content-Type": "application/json",
    },
  });

export const getUnits = async (id) =>
  projectInstance.get(`flats/by_project/${id}`, {
    headers: {
      "Content-Type": "application/json",
    },
  });

export const allinfobuildingtoflat = async (id) =>
  projectInstance.get(`projects/${id}/buildings-details/`, {
    headers: {
      "Content-Type": "application/json",
    },
  });

export const updateUnit = async (data) =>
  projectInstance.put("/flats/", data, {
    headers: {
      "Content-Type": "application/json",
    },
  });

export const createTransferRule = async (data) =>
  projectInstance.post("/transfer-rules/", data, {
    headers: {
      "Content-Type": "application/json",
    },
  });

export const getTransferRules = async (id) => {
  return projectInstance.get(`/transfer-rules/?project_id=${id}`, {
    headers: {
      "Content-Type": "application/json",
    },
  });
};

export const createChecklistCategory = async (data) =>
  checklistInstance.post("/category/create-category/", data, {
    headers: {
      "Content-Type": "application/json",
    },
  });

export const getChecklistCategories = async (id) =>
  checklistInstance.get(
    `/category/get-category-details-by-organization-id/?organization_id=${id}`,
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

export const getchecklistbyProject = async (id) =>
  checklistInstance.get(`checklists/?project=${id}`, {
    headers: {
      "Content-Type": "application/json",
    },
  });

export const getTowerOverview = async (id, params = {}) =>
  checklistInstance.get(`tower-overview/${id}/`, {
    params,
    headers: {
      "Content-Type": "application/json",
    },
  });

export const getTowerOverviewPDF = async (id, params = {}) =>
  checklistInstance.get(`/tower-overview-pdf/${id}/`, {
    params,
    responseType: "blob",
    headers: {
      Accept: "application/pdf",
    },
  });

export const createChecklistSubCategory = async (data) =>
  axiosInstance.post("/sub-category/create-sub-category/", data, {
    headers: {
      "Content-Type": "application/json",
    },
  });

export const getChecklistSubCategories = async (id) =>
  axiosInstance.get(
    `/sub-category/get-sub-category-details-by-organization-id/?organization_id=${id}`,
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

export const getCategoriesSimpleByProject = async (projectId) =>
  projectInstance.get(`/categories-simple/?project_id=${projectId}`, {
    headers: { "Content-Type": "application/json" },
  });

export const createCategorySimple = async (data) =>
  projectInstance.post(`/categories-simple/`, data, {
    headers: { "Content-Type": "application/json" },
  });

export const createChecklist = async (data) =>
  NEWchecklistInstance.post("/checklists/", data, {
    headers: {
      "Content-Type": "application/json",
    },
  });

export const viewChecklist = async (checklistId) =>
  NEWchecklistInstance.get(`/checklist-items/${checklistId}/`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("access")}`,
    },
  });

export const createChecklistItemOPTIONSS = async (data) =>
  NEWchecklistInstance.post("/options/", data, {
    headers: {
      "Content-Type": "application/json",
    },
  });

export const createChecklistQuestion = async (data) =>
  NEWchecklistInstance.post("/items/", data, {
    headers: {
      "Content-Type": "application/json",
    },
  });

export const getChecklistDetails = async (id) =>
  axiosInstance.get(
    `/checklist-quest/get-checklist-details-by-organization-id/?organization_id=${id}`,
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

export const createChecklistMapping = async (data) =>
  axiosInstance.post(
    "/checklist-quest/mapping-data-with-category-checklist/",
    data,
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
  );
export const getChecklistMappingDetails = async (id) =>
  axiosInstance.get(`/checklist-quest/get-mapping-data/?project_id=${id}`, {
    headers: {
      "Content-Type": "application/json",
    },
  });

export const getUsersWithRoles = async (projectId) => {
  return axiosInstance.get(`user-list/list/?project_id=${projectId}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("access")}`,
    },
  });
};

export const createUserDetails = async (data) =>
  axiosInstance.post("/users/", data, {
    headers: {
      "Content-Type": "application/json",
    },
  });

export const updateChecklist = async (data) =>
  axiosInstance.put(
    "/checklist-quest/update-checklist-quest-by-checklist-id/",
    data,
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

export const getUsersByOrganizationId = async (id) =>
  organnizationInstance.get(`/user-orgnizationn-info/${id}`, {
    headers: {
      "Content-Type": "application/json",
    },
  });

export const updateUserDetails = async (data) =>
  axiosInstance.put("/user/update-user-details/", data, {
    headers: {
      "Content-Type": "application/json",
    },
  });

// export const getAllProjectDetails = async () =>
//   axiosInstance.get("/project/get-project-details/", {
//     headers: {
//       "Content-Type": "application/json",
//       //   "Access-Control-Allow-Origin": "*",
//     },
//   });

export const getProjectLevelDetails = async (id) =>
  projectInstance.get(`/buildings/by_project/${id}`, {
    headers: {
      "Content-Type": "application/json",
    },
  });

export const getFloorDetails = async (id) =>
  projectInstance.get(`/levels/by_building/${id}`, {
    headers: {
      "Content-Type": "application/json",
    },
  });

export const getFloorTypeDetails = async (id, projectId) =>
  axiosInstance.get(
    `/room/get-rooms-checklist-by-flat-type/?unit_id=${id}&project_id=${projectId}`,
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

export const getSubCategoryChecklist = async (id) =>
  axiosInstance.get(
    `/sub-category/get-checklist-sub-category-by-category/?category_id=${id}`,
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

export const getRoomsWiseChecklist = async (checkListId, roomId) =>
  axiosInstance.get(
    `/room-map/get-rooms-wise-checklist/?checklist_id=${checkListId}&room_id=${roomId}`,
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

export const getstageDetails = async (projectId) =>
  axiosInstance.get(
    `/stage/get-stage-details-by-project-id/?project_id=${projectId}`,
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

// export const getProjectUserDetails = async  =>
//   projectInstance.get(
//     // `/user-stage-role/get-projects-by-user/?user_id=${userId}`,
//     `/user-stage-role/get-projects-by-user/`,
//     {
//       headers: {
//         "Content-Type": "application/json",
//         "Authorization": `Bearer ${localStorage.getItem('ACCESS_TOKEN')}`,

//       },
//     }
//   );

export const getProjectUserDetails = async () =>
  projectInstance.get("/user-stage-role/get-projects-by-user/", {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("ACCESS_TOKEN") || localStorage.getItem("access")
        }`,
    },
  });

export const editStage = async (data) =>
  axiosInstance.put("/stage/update-stage-details/", data, {
    headers: {
      "Content-Type": "application/json",
    },
  });

export const getProjectsByOwnership = async ({
  entity_id,
  company_id,
  organization_id,
}) => {
  let query = "";
  if (entity_id) query = `entity_id=${entity_id}`;
  else if (company_id) query = `company_id=${company_id}`;
  else if (organization_id) query = `organization_id=${organization_id}`;
  if (!__hasAccess() || __isLoggingOut()) return { data: [] };
  return projectInstance.get(`/projects/by_ownership/?${query}`, {
    headers: {
      "Content-Type": "application/json",
    },
  });
};

export const getProjectsByOrganization = async (organizationId) =>
  projectInstance.get(`/projects/by_organization/${organizationId}/`, {
    headers: {
      "Content-Type": "application/json",
    },
  });

export const getCategoryTreeByProject = async (projectId) =>
  projectInstance.get(`/category-tree-by-project/?project=${projectId}`, {
    headers: {
      "Content-Type": "application/json",
    },
  });

// Create user with role at one go
export const createUserAccessRole = async (payload) =>
  axiosInstance.post(`/user-access-role/`, payload, {
    headers: {
      "Content-Type": "application/json",
    },
  });

// For existing user access creation
export const createUserAccess = async (payload) =>
  axiosInstance.post("/accesses/", payload, {
    headers: {
      "Content-Type": "application/json",
    },
  });

// For existing user role access creation
export const createRoleForUserAccess = async (payload) =>
  axiosInstance.post("/roles/", payload, {
    headers: {
      "Content-Type": "application/json",
    },
  });

export const getProjectAccesses = async (userId, projectId) => {
  const token =
    localStorage.getItem("ACCESS_TOKEN") ||
    localStorage.getItem("TOKEN") ||
    localStorage.getItem("token");

  return axiosInstance.get(
    `/accesses/?user_id=${userId}&project_id=${projectId}`,
    {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      "Content-Type": "application/json",
    },
  );
};

export const getPhaseByPurposeId = async (purposeId) =>
  projectInstance.get(`phases/by-purpose/${purposeId}/`, {
    headers: { "Content-Type": "application/json" },
  });

export const getStageByPhaseId = async (phaseId) =>
  projectInstance.get(`stages/by_phase/${phaseId}/`, {
    headers: { "Content-Type": "application/json" },
  });

// FETCH ASSIGNED PROJECTS

export const getAssignedProjects = async (userId) => {
  return axiosInstance.get(`/accesses/assigned-projects/?user_id=${userId}`);
};
export const getAccessibleChecklists = async (projectId, userId) =>
  checklistInstance.get(
    `/accessible-checklists/?project_id=${projectId}&user_id=${userId}`,
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

// ================= USERS BY ROLE =================
export const getUsersByRoles = async (roles) =>
  projectInstance.post(
    "users/by-roles/",
    {
      roles,
    },
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

export const assignChecklistToUser = async (checklistId) =>
  checklistInstance.post(
    "/create-checklistitemsubmissions-assign/",
    {
      checklist_id: checklistId,
    },
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

// Get hierarchical verifications for checker
export const getMyHierarchicalVerifications = async () =>
  checklistInstance.get("/my-hierarchical-verifications/", {
    headers: {
      "Content-Type": "application/json",
    },
  });

// export const verifyChecklistItemSubmission = async (formData) =>
//   checklistInstance.patch("/verify-checklist-item-submission/", formData, {
//     headers: { "Content-Type": "multipart/form-data" },
//   });
export const verifyChecklistItemSubmission = async (formData) => {
  try {
    const flowRole = localStorage.getItem("FLOW_ROLE");
    if (flowRole && formData && typeof formData.append === "function") {
      const alreadyHasRole =
        typeof formData.has === "function" ? formData.has("role") : false;
      if (!alreadyHasRole) {
        formData.append("role", flowRole); // backend does .lower() so "CHECKER" is fine
      }
    }
  } catch (e) {
    console.warn("Could not attach FLOW_ROLE to formData", e);
  }

  return checklistInstance.patch(
    "/verify-checklist-item-submission/",
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    },
  );
};

// by prathamesh

// Get project category user access
export const getProjectCategoryUserAccess = async (projectId, categoryId) => {
  console.log("Fetching user access data...", { projectId, categoryId });

  try {
    const response = await axiosInstance.get("project-category-user-access/", {
      params: {
        project_id: projectId,
        category_id: categoryId,
      },
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log("User access data fetched:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching user access:", error);
    throw error;
  }
};

export const sendNotificationToUsers = async (data) => {
  console.log("Sending notification to users...", data);

  try {
    const response = await axiosInstance.post("/send-notification/", data, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log("Notification sent successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error sending notification:", error);
    throw error;
  }
};

// Add this function to your index.js API file

export const patchChecklistRoles = async (checklistId, rolesData) => {
  console.log("Patching checklist roles...", { checklistId, rolesData });

  try {
    const response = await checklistInstance.patch(
      `/${checklistId}/patch-roles/`,
      {
        roles_json: rolesData,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    console.log("Checklist roles updated successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error updating checklist roles:", error);
    throw error;
  }
};

// ORGANIZATION PATCH & DELETE
export const updateOrganization = async (id, data) =>
  organnizationInstance.patch(`/organizations/${id}/`, data, {
    headers: { "Content-Type": "application/json" },
  });

export const deleteOrganization = async (id) =>
  organnizationInstance.delete(`/organizations/${id}/`, {
    headers: { "Content-Type": "application/json" },
  });

// COMPANY PATCH & DELETE
export const updateCompany = async (id, data) =>
  organnizationInstance.patch(`/companies/${id}/`, data, {
    headers: { "Content-Type": "application/json" },
  });

export const deleteCompany = async (id) =>
  organnizationInstance.delete(`/companies/${id}/`, {
    headers: { "Content-Type": "application/json" },
  });

// ENTITY PATCH & DELETE
export const updateEntity = async (id, data) =>
  organnizationInstance.patch(`/entities/${id}/`, data, {
    headers: { "Content-Type": "application/json" },
  });

export const deleteEntity = async (id) =>
  organnizationInstance.delete(`/entities/${id}/`, {
    headers: { "Content-Type": "application/json" },
  });

export const editPurpose = (purposeId, payload) => {
  return projectInstance.patch(`/purposes/${purposeId}/`, payload, {
    headers: { "Content-Type": "application/json" },
  });
};

export const deletePurpose = (purposeId) => {
  return projectInstance.delete(`/purposes/${purposeId}/`, {
    headers: { "Content-Type": "application/json" },
  });
};

export const editPhase = (phaseId, payload) => {
  return projectInstance.patch(`/phases/${phaseId}/`, payload, {
    headers: { "Content-Type": "application/json" },
  });
};

export const deletePhase = (phaseId) => {
  return projectInstance.delete(`/phases/${phaseId}/`, {
    headers: { "Content-Type": "application/json" },
  });
};

export const patchStage = (id, payload) => {
  return projectInstance.patch(`/stages/${id}/`, payload, {
    headers: { "Content-Type": "application/json" },
  });
};

// Get user dashboard analytics
export const getUserDashboard = async () => {
  const token = localStorage.getItem("ACCESS_TOKEN");
  console.log(
    "Making API call to /user-dashboard/ with token:",
    token ? "Present" : "Missing",
  );

  try {
    const response = await axiosInstance.get("/user-dashboard/", {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("API Response Status:", response.status);
    console.log("API Response Data:", response.data);
    return response;
  } catch (error) {
    console.error("API Error:", error.response?.status, error.response?.data);
    throw error;
  }
};

// Get specific role analytics (optional - for detailed view)
export const getChecklistRoleAnalytics = async (userId, projectId, role) =>
  axiosInstance.get("/checklist-role-analytics/", {
    params: { user_id: userId, project_id: projectId, role },
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("ACCESS_TOKEN")}`,
    },
  });

export const getChecklistById = async (checklistId) =>
  NEWchecklistInstance.get(`/checklists/${checklistId}/`, {
    headers: {
      "Content-Type": "application/json",
    },
  });

// Update existing checklist using PATCH
export const updateChecklistById = async (checklistId, payload) =>
  NEWchecklistInstance.patch(`/checklists/${checklistId}/`, payload, {
    headers: {
      "Content-Type": "application/json",
    },
  });

export const createProjectSchedules = async (payload) =>
  projectInstance.post(`/v2/scheduling/`, payload, {
    headers: { "Content-Type": "application/json" },
  });

export const getProjectsForCurrentUser = async () => {
  const roleRaw = localStorage.getItem("ROLE") || "";
  const role = roleRaw.toLowerCase();
  const userStr = localStorage.getItem("USER_DATA");
  const user = userStr && userStr !== "undefined" ? JSON.parse(userStr) : null;

  if (!user) return { data: [] };
  if (!__hasAccess() || __isLoggingOut()) return { data: [] };

  // 1) SUPER ADMIN – see all projects
  if (role === "super admin") return Allprojects();

  // 2) ADMIN – stage-role based projects
  if (role === "admin") return getProjectUserDetails(); // /user-stage-role/get-projects-by-user/

  // 3) MANAGER + all other roles – ownership based
  const entity_id = user.entity_id || null;
  const company_id = user.company_id || null;
  const organization_id = user.org || user.organization_id || null;

  if (!entity_id && !company_id && !organization_id) return { data: [] };

  return getProjectsByOwnership({ entity_id, company_id, organization_id });
};

// api.js
export const getProjectsByOrgOwnership = async (organizationId) =>
  projectInstance.get(`/projects/by_ownership/`, {
    params: { organization_id: organizationId }, // -> https://konstruct.world/projects/projects/by_ownership/?organization_id=141
    headers: { "Content-Type": "application/json" },
  });

export const getSchedulingSetup = (project_id) =>
  projectInstance.get("/v2/scheduling/setup/", {
    params: { project_id }, // -> ?project_id=36
  });

/* ========= GUARD: STAFF & ATTENDANCE (v2) ========= */

// 1) GET /v2/staff/?project_id=36[&q=raj]
export const getStaffByProject = (projectId, q = "") =>
  axiosInstance.get("/v2/staff/", {
    params: { project_id: projectId, q }, // if your API expects `search`, swap to { project_id, search: q }
    headers: { "Content-Type": "application/json" },
  });

// 2) POST /v2/staffs/onboard/  (multipart)
// api.js
export const onboardStaff = ({
  project_id,
  username, // NEW
  first_name,
  last_name = "",
  phone_number,
  adharcard_nummber = "", // keep backend’s exact field name
  photo, // File/Blob
}) => {
  const fd = new FormData();
  fd.append("project_id", String(project_id));
  if (username && username.trim()) fd.append("username", username.trim()); // NEW
  fd.append("first_name", first_name.trim());
  if (last_name) fd.append("last_name", last_name.trim());
  fd.append("phone_number", phone_number.trim());
  if (adharcard_nummber) fd.append("adharcard_nummber", adharcard_nummber);

  if (photo) {
    // include a filename so Django/DRF saves with an extension
    const filename = typeof photo.name === "string" ? photo.name : "photo.jpg";
    fd.append("photo", photo, filename);
  }

  // Let Axios set the correct multipart boundary automatically
  return axiosInstance.post("/v2/staffs/onboard/", fd);
};

// 3) POST /v2/attendance/mark/  (multipart)
export const markAttendance = ({
  user_id,
  project_id,
  photo, // File/Blob
  lat = null,
  lon = null,
  force_action = null, // "IN" | "OUT" | null
}) => {
  const fd = new FormData();
  fd.append("user_id", user_id);
  fd.append("project_id", project_id);
  fd.append("photo", photo);
  if (lat != null && lon != null) {
    fd.append("lat", lat);
    fd.append("lon", lon);
  }
  if (force_action) fd.append("force_action", force_action);
  return axiosInstance.post("/v2/attendance/mark/", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

// 4) GET /v2/attendance/?user_id=&project_id=&date=YYYY-MM-DD
// or use start_date & end_date
export const listAttendanceByUser = ({
  user_id,
  project_id,
  date,
  start_date,
  end_date,
}) =>
  axiosInstance.get("/v2/attendance/", {
    params: { user_id, project_id, date, start_date, end_date },
    headers: { "Content-Type": "application/json" },
  });

export const getSnagStats = (project_id, extraParams = {}) =>
  NEWchecklistInstance.get("/stats/snags/", {
    params: { project_id, ...extraParams },
  });

// Helper so Header and Analytics page resolve project consistently
export const resolveActiveProjectId = () => {
  try {
    const qp = new URLSearchParams(window.location.search).get("project_id");
    if (qp) return Number(qp);
  } catch { }
  const ls =
    localStorage.getItem("ACTIVE_PROJECT_ID") ||
    localStorage.getItem("PROJECT_ID");
  return Number(ls) || null;
};

// export const resolveOrgId = () => {
//   try {
//     const raw = localStorage.getItem("USER_DATA");
//     if (!raw || raw === "undefined") return null;
//     const data = JSON.parse(raw);
//     return data?.org ?? data?.organization_id ?? data?.org_id ?? null;
//   } catch {
//     return null;
//   }
// };
const __getUserDataFromStorage = () => {
  try {
    const raw = localStorage.getItem("USER_DATA");
    if (!raw || raw === "undefined") return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const resolveOrgId = () => {
  const data = __getUserDataFromStorage();
  return data?.org ?? data?.organization_id ?? data?.org_id ?? null;
};

// ==== FACE TEMPLATE (image enroll) ====
// POST /v2/face/enroll/  (multipart/form-data)
// Use replace=true to overwrite existing templates; omit/false to append.
export const enrollFaceTemplate = ({ user_id, photo, replace = false }) => {
  const fd = new FormData();
  fd.append("user_id", String(user_id));
  if (photo) {
    const filename = typeof photo?.name === "string" ? photo.name : "face.jpg";
    fd.append("photo", photo, filename);
  }
  if (replace) fd.append("replace", "true"); // backend treats presence as true

  // Let Axios set multipart boundary automatically
  return axiosInstance.post("/v2/face/enroll/", fd);
};

// --- USER ACCESS (roles per project) ---
export const getUserAccessForProject = (userId, projectId) =>
  axiosInstance.get("/user-access/", {
    params: { user_id: userId, project_id: projectId },
    headers: {
      "Content-Type": "application/json",
    },
  });

export const getStagesByPhase = (phaseId) => {
  return projectInstance.get(`/stages/by_phase/${phaseId}/`);
};

export const getQuestionHotspots = (projectId, params = {}) =>
  NEWchecklistInstance.get("stats/questions/", {
    params: { project_id: projectId, ...params },
  });

export const fetchNestedProjectData = async (projectId) => {
  try {
    console.log("🏗️ Fetching nested project data for projectId:", projectId);

    const response = await projectInstance.get(
      `projects/${projectId}/nested/`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("ACCESS_TOKEN")}`,
          "Content-Type": "application/json",
        },
      },
    );

    console.log("🏗️ Nested API Response:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching nested project data:", error);
    throw error;
  }
};

export function setActiveProjectId(projectId) {
  if (!projectId) return;
  localStorage.setItem("ACTIVE_PROJECT_ID", String(projectId));
}

// NEW: manager projects by ownership
export function getManagerOwnedProjects(organizationId) {
  return axiosInstance.get("/projects/projects/by_ownership/", {
    params: { organization_id: organizationId },
  });
}

// ==== MIR (Material Inspection Request) ====

// 1) Create MIR (DRAFT) – same jaisa tumne Postman me kiya
export const createMIR = async (data) =>
  axiosInstance.post("/mir/", data, {
    headers: {
      "Content-Type": "application/json",
    },
  });

// 2) List MIRs (filters: project_id, only_assigned etc.)
export const listMIRs = async (params = {}) =>
  axiosInstance.get("/mir/", {
    params,
    headers: {
      "Content-Type": "application/json",
    },
  });

// 3) Get single MIR by id
export const getMIRById = async (id) =>
  axiosInstance.get(`/mir/${id}/`, {
    headers: {
      "Content-Type": "application/json",
    },
  });

// 4) Update MIR (PATCH – partial update)
export const updateMIR = async (id, data) =>
  axiosInstance.patch(`/mir/${id}/`, data, {
    headers: {
      "Content-Type": "application/json",
    },
  });

export const getProjectUsersForMir = async (projectId) =>
  axiosInstance.get("/user-access-role/", {
    params: { project_id: projectId },
    headers: { "Content-Type": "application/json" },
  });

// ---- MIR workflow: forward / accept / reject ----

// Forward MIR to another user
// payload = { to_user_id, comment }
export const forwardMIR = async (id, payload) =>
  axiosInstance.post(`/mir/${id}/forward/`, payload, {
    headers: {
      "Content-Type": "application/json",
    },
  });

// Accept MIR (current_assignee hi kar sakta hai)
// payload optional = { comment }
export const acceptMIR = async (id, payload = {}) =>
  axiosInstance.post(`/mir/${id}/accept/`, payload, {
    headers: {
      "Content-Type": "application/json",
    },
  });

// Reject MIR (current_assignee hi kar sakta hai)
// payload = { comment }
export const rejectMIR = async (id, payload = {}) =>
  axiosInstance.post(`/mir/${id}/reject/`, payload, {
    headers: {
      "Content-Type": "application/json",
    },
  });

export const getMIRDetail = (id) =>
  axiosInstance.get(`/mir/${id}/`, {
    headers: { "Content-Type": "application/json" },
  });

// 👇 MIR ke liye: current creator ke saare users
export const getUsersByCreator = async () =>
  axiosInstance.get("/users-by-creator/", {
    headers: {
      "Content-Type": "application/json",
    },
  });

// ---- MIR digital signatures ----
// NOTE: formData = new FormData()
// formData.append("signature", file)
// formData.append("name", optionalName)
// formData.append("sign_date", "2025-12-01T10:15:00+05:30") // optional

export const signStoreMIR = async (id, formData) =>
  axiosInstance.post(`/mir/${id}/sign_store/`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

export const signQcMIR = async (id, formData) =>
  axiosInstance.post(`/mir/${id}/sign_qc/`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

export const signProjectInchargeMIR = async (id, formData) =>
  axiosInstance.post(`/mir/${id}/sign_project_incharge/`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

// MIR complete history / timeline
// GET /mir-actions/?mir_id=1
export const getMIRActions = async (mirId) =>
  axiosInstance.get("/mir-actions/", {
    params: { mir_id: mirId },
    headers: {
      "Content-Type": "application/json",
    },
  });

// MIR ke liye: project ke users laane ka simple API
export const getUsersByProject = (projectId) =>
  axiosInstance.get("/by-project/", {
    params: { project_id: projectId },
    headers: {
      "Content-Type": "application/json",
    },
  });

// NEW FUNCTION TO GET USER BY IRGNIZAATION
export const getUsersByOrganization = (organizationId) =>
  axiosInstance.get("/by-organization/", {
    params: { organization_id: organizationId },
    headers: {
      "Content-Type": "application/json",
    },
  });

export const getMyAssignedMIRs = (params = {}) =>
  axiosInstance.get("/mir/", {
    params: {
      only_assigned: 1,
      ...params, // future me pagination, project filter, etc.
    },
  });

export const uploadMIRMaterialImages = (mirId, formData) =>
  axiosInstance.post(`/mir/${mirId}/material-images/`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
// ---- MIR SIGNATURE APIs ----
// POST /mir/{id}/sign_store/
export const signMIRStore = (mirId, { name, sign_date, file }) => {
  const fd = new FormData();
  if (file) fd.append("signature", file); // 👈 file required
  if (name) fd.append("name", name); // optional
  if (sign_date) fd.append("sign_date", sign_date); // "YYYY-MM-DD" bhi chalega

  return axiosInstance.post(`/mir/${mirId}/sign_store/`, fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

// POST /mir/{id}/sign_qc/
export const signMIRQc = (mirId, { name, sign_date, file }) => {
  const fd = new FormData();
  if (file) fd.append("signature", file);
  if (name) fd.append("name", name);
  if (sign_date) fd.append("sign_date", sign_date);

  return axiosInstance.post(`/mir/${mirId}/sign_qc/`, fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

// POST /mir/{id}/sign_project_incharge/
export const signMIRProjectIncharge = (mirId, { name, sign_date, file }) => {
  const fd = new FormData();
  if (file) fd.append("signature", file);
  if (name) fd.append("name", name);
  if (sign_date) fd.append("sign_date", sign_date);

  return axiosInstance.post(`/mir/${mirId}/sign_project_incharge/`, fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const uploadMIRAttachments = (mirId, formData) =>
  axiosInstance.post(`/mir/${mirId}/attachments/`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

// Logo upload
export function uploadMIRLogo(mirId, formData) {
  return axiosInstance.post(`/mir/${mirId}/logo/`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
}

// api.js

export function createMIRFull(formData) {
  // POST /mir/full-create/
  return axiosInstance.post("/mir/full-create/", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
}

// ✅ MIR PDF export (server generated) with route fallbacks
// ✅ MIR PDF export (server generated) with route fallbacks
export const exportMIRPdf = async (mirId, includeAttachments = true) => {
  const token =
    localStorage.getItem("ACCESS_TOKEN") ||
    localStorage.getItem("access") ||
    localStorage.getItem("accessToken") ||
    "";

  const root = __getApiRoot();
  const qs = `?include_attachments=${includeAttachments ? 1 : 0}`;

  const baseUrls = [
    `${root}/users/mir/${mirId}/export-pdf/`,
    `${root}/api/mir/${mirId}/export-pdf/`,
    `/mir/${mirId}/export-pdf/`,
    `${root}/users/mir/${mirId}/export_pdf/`,
    `${root}/api/mir/${mirId}/export_pdf/`,
    `/mir/${mirId}/export_pdf/`,
  ];

  // ✅ append query to each
  const urls = baseUrls.map((u) => `${u}${qs}`);

  const res = await __getBlobWithFallback(axiosInstance, urls, {
    responseType: "blob",
    headers: token
      ? { Authorization: `Bearer ${token}`, Accept: "application/pdf" }
      : { Accept: "application/pdf" },
  });

  const contentType = res.headers?.["content-type"] || "";
  if (contentType.includes("application/json")) {
    const text = await res.data.text();
    let msg = "MIR PDF export failed";
    try {
      const j = JSON.parse(text);
      msg = j?.detail || j?.message || msg;
    } catch { }
    throw new Error(msg);
  }

  const dispo = res.headers?.["content-disposition"];
  const filename = filenameFromDisposition(dispo) || `MIR_${mirId}.pdf`;

  downloadBlob(res.data, filename);
  return true;
};

// ==== FORMS ENGINE (Dynamic Forms) ====

export const listFormTemplates = () =>
  axiosInstance.get("/forms/templates/", {
    headers: {
      "Content-Type": "application/json",
    },
  });

export const createFormTemplate = (payload) =>
  axiosInstance.post("/forms/templates/", payload, {
    headers: {
      "Content-Type": "application/json",
    },
  });

export const updateFormTemplate = (id, payload) =>
  axiosInstance.patch(`/forms/templates/${id}/`, payload, {
    headers: {
      "Content-Type": "application/json",
    },
  });

export const createFormTemplateVersion = (payload) =>
  axiosInstance.post("/forms/template-versions/", payload, {
    headers: {
      "Content-Type": "application/json",
    },
  });

// NEW: Excel → schema preview
export const previewFormExcel = (file) => {
  const fd = new FormData();
  fd.append("file", file);
  return axiosInstance.post("/forms/excel/preview/", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

// ---- Form Packs (bundles) ----

export const listFormPacks = () =>
  axiosInstance.get("/forms/packs/", {
    headers: { "Content-Type": "application/json" },
  });

export const createFormPack = (payload) =>
  axiosInstance.post("/forms/packs/", payload, {
    headers: { "Content-Type": "application/json" },
  });

export const updateFormPack = (id, payload) =>
  axiosInstance.patch(`/forms/packs/${id}/`, payload, {
    headers: { "Content-Type": "application/json" },
  });

export const deleteFormPack = (id) =>
  axiosInstance.delete(`/forms/packs/${id}/`, {
    headers: { "Content-Type": "application/json" },
  });

export const createFormPackItem = (payload) =>
  axiosInstance.post("/forms/pack-items/", payload, {
    headers: { "Content-Type": "application/json" },
  });

export const deleteFormPackItem = (id) =>
  axiosInstance.delete(`/forms/pack-items/${id}/`, {
    headers: { "Content-Type": "application/json" },
  });

// Apply packs → project
export const applyFormPacksToProject = (payload) =>
  axiosInstance.post("/forms/packs/apply-to-project/", payload, {
    headers: { "Content-Type": "application/json" },
  });

// Project ke liye assigned forms
// export const getAssignedFormsForProject = (projectId, usageType) =>
//   axiosInstance.get("/forms/assigned/", {
//     params: {
//       project_id: projectId,
//       ...(usageType ? { usage_type: usageType } : {}),
//     },
//     headers: { "Content-Type": "application/json" },
//   });

// ✅ replace old version with this:
// Project ke liye assigned forms
// extraParams me usage_type, assignment_id, etc sab bhej sakte ho
export const getAssignedFormsForProject = (projectId, extraParams = {}) =>
  axiosInstance.get("/forms/assigned/", {
    params: {
      project_id: projectId,
      ...extraParams,
    },
    headers: { "Content-Type": "application/json" },
  });

export const createFormResponse = (payload) =>
  axiosInstance.post("/forms/responses/", payload, {
    headers: { "Content-Type": "application/json" },
  });

// GET /users/forms/responses/:id/
export const getFormResponse = (id) =>
  axiosInstance.get(`/forms/responses/${id}/`);

// POST /users/forms/responses/:id/forward/
export const forwardFormResponse = (id, payload) =>
  axiosInstance.post(`/forms/responses/${id}/forward/`, payload);

// GET /users/forms/responses/
export const listMyFormResponses = (params = {}) =>
  axiosInstance.get("/forms/responses/", {
    params,
    headers: { "Content-Type": "application/json" },
  });

// api.js

export async function getFormTask(taskId) {
  const { data } = await axiosInstance.get(`/forms/tasks/${taskId}/`);
  return data;
}

export async function saveFormTask(taskId, payload) {
  // expects { data: {...} }
  const { data } = await axiosInstance.patch(
    `/forms/tasks/${taskId}/`,
    payload,
  );
  return data;
}

export async function forwardFormTask(taskId, payload) {
  // expects { to_user_id: 123 }
  const { data } = await axiosInstance.post(
    `/forms/tasks/${taskId}/forward/`,
    payload,
  );
  return data;
}

// GET /users/forms/tasks/
export const listFormTasks = (params = {}) =>
  axiosInstance.get("/forms/tasks/", { params });

// PATCH /users/forms/responses/:id/
export const updateFormResponse = (id, payload) =>
  axiosInstance.patch(`/forms/responses/${id}/`, payload, {
    headers: { "Content-Type": "application/json" },
  });

//wir
// ==== WIR (Work Inspection Request) ====

// Create WIR (basic JSON create)
export const createWIR = async (data) =>
  axiosInstance.post("/wir/", data, {
    headers: { "Content-Type": "application/json" },
  });

// List WIRs
export const listWIRs = async (params = {}) =>
  axiosInstance.get("/wir/", {
    params,
    headers: { "Content-Type": "application/json" },
  });

// Get WIR by id
export const getWIRById = async (id) =>
  axiosInstance.get(`/wir/${id}/`, {
    headers: { "Content-Type": "application/json" },
  });

// Update WIR
export const updateWIR = async (id, data) =>
  axiosInstance.patch(`/wir/${id}/`, data, {
    headers: { "Content-Type": "application/json" },
  });

// Forward / Accept / Reject (same pattern as MIR)
export const forwardWIR = async (id, payload) =>
  axiosInstance.post(`/wir/${id}/forward/`, payload, {
    headers: { "Content-Type": "application/json" },
  });

export const acceptWIR = async (id, payload = {}) =>
  axiosInstance.post(`/wir/${id}/accept/`, payload, {
    headers: { "Content-Type": "application/json" },
  });

export const rejectWIR = async (id, payload = {}) =>
  axiosInstance.post(`/wir/${id}/reject/`, payload, {
    headers: { "Content-Type": "application/json" },
  });

// Two signatures only
// export const signWIRContractor = (wirId, { name, sign_date, file }) => {
//   const fd = new FormData();
//   if (file) fd.append("signature", file);
//   if (name) fd.append("name", name);
//   if (sign_date) fd.append("sign_date", sign_date);

//   return axiosInstance.post(`/wir/${wirId}/sign_contractor/`, fd, {
//     headers: { "Content-Type": "multipart/form-data" },
//   });
// };
export const signWIRContractor = (wirId, { name, sign_date, file }) => {
  const fd = new FormData();

  // backend commonly expects "signature"
  if (file) {
    const filename =
      typeof file?.name === "string" ? file.name : "signature.png";
    fd.append("signature", file, filename);

    // (safe fallback) some backends may expect "file"
    // will not break if ignored
    fd.append("file", file, filename);
  }

  if (name) fd.append("name", name);
  if (sign_date) fd.append("sign_date", sign_date);

  const root = __getApiRoot();

  // ✅ try absolute routes first (bypass axios baseURL /api)
  const urls = [
    `${root}/users/wir/${wirId}/sign-contractor/`,
    `${root}/api/wir/${wirId}/sign-contractor/`, // just in case
    `/wir/${wirId}/sign-contractor/`, // if axios baseURL already /users
  ];

  return __postMultipartWithFallback(axiosInstance, urls, fd);
};

export const signWIRInspector = (wirId, { name, sign_date, file }) => {
  const fd = new FormData();

  if (file) {
    const filename =
      typeof file?.name === "string" ? file.name : "signature.png";
    fd.append("signature", file, filename);
    fd.append("file", file, filename); // fallback
  }

  if (name) fd.append("name", name);
  if (sign_date) fd.append("sign_date", sign_date);

  const root = __getApiRoot();

  const urls = [
    `${root}/users/wir/${wirId}/sign-inspector/`,
    `${root}/api/wir/${wirId}/sign-inspector/`,
    `/wir/${wirId}/sign-inspector/`,
  ];

  return __postMultipartWithFallback(axiosInstance, urls, fd);
};

// export const signWIRInspector = (wirId, { name, sign_date, file }) => {
//   const fd = new FormData();
//   if (file) fd.append("signature", file);
//   if (name) fd.append("name", name);
//   if (sign_date) fd.append("sign_date", sign_date);

//   return axiosInstance.post(`/wir/${wirId}/sign_inspector/`, fd, {
//     headers: { "Content-Type": "multipart/form-data" },
//   });
// };

// Full create (data JSON + files)
export function createWIRFull(formData) {
  return axiosInstance.post("/wir/full-create/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}

// ==== WIR (Work Inspection Request) ====

// List my assigned WIRs (same pattern as MIR)
export const getMyAssignedWIRs = (params = {}) =>
  axiosInstance.get("/wir/", {
    params: { only_assigned: 1, ...params },
  });

// ==== WIR ====

export const uploadWIRAttachments = (id, formData) =>
  axiosInstance.post(`/wir/${id}/attachments/`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const signWIRStore = (id, { name, sign_date, file }) => {
  const fd = new FormData();
  if (name) fd.append("name", name);
  if (sign_date) fd.append("sign_date", sign_date);
  fd.append("file", file);
  return axiosInstance.post(`/wir/${id}/sign-store/`, fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const signWIRQc = (id, { name, sign_date, file }) => {
  const fd = new FormData();
  if (name) fd.append("name", name);
  if (sign_date) fd.append("sign_date", sign_date);
  fd.append("file", file);
  return axiosInstance.post(`/wir/${id}/sign-qc/`, fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const signWIRProjectIncharge = (id, { name, sign_date, file }) => {
  const fd = new FormData();
  if (name) fd.append("name", name);
  if (sign_date) fd.append("sign_date", sign_date);
  fd.append("file", file);
  return axiosInstance.post(`/wir/${id}/sign-project-incharge/`, fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

// ✅ One endpoint, 3 fields supported: client_logo / pmc_logo / contractor_logo
export const uploadWIRLogos = (id, formData) =>
  axiosInstance.post(`/wir/${id}/logos/`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const exportWIRPdf = async (wirId, includeAttachments = true) => {
  const res = await axiosInstance.get(`/wir/${wirId}/export-pdf/`, {
    params: { include_attachments: includeAttachments ? 1 : 0 },
    responseType: "blob",
  });

  // agar backend error JSON bhej de blob me
  const contentType = res.headers?.["content-type"] || "";
  if (contentType.includes("application/json")) {
    const text = await res.data.text();
    let msg = "Export failed";
    try {
      msg = JSON.parse(text)?.detail || msg;
    } catch { }
    throw new Error(msg);
  }

  const dispo = res.headers?.["content-disposition"];
  const filename = filenameFromDisposition(dispo) || `WIR_${wirId}.pdf`;
  downloadBlob(res.data, filename);

  return true;
};

// ✅ DASHBOARD: Unit Stage Role Summary (Top counters)

const __pickToken = () =>
  localStorage.getItem("ACCESS_TOKEN") ||
  localStorage.getItem("access") ||
  localStorage.getItem("accessToken") ||
  "";

const __clean = (v) => {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  if (!s || ["null", "none", "undefined"].includes(s.toLowerCase()))
    return null;
  return v;
};

const __toCsv = (v) => {
  if (v === null || v === undefined) return null;
  if (Array.isArray(v)) {
    const arr = v
      .map((x) => __clean(x))
      .filter((x) => x !== null && x !== undefined)
      .map((x) => String(x).trim())
      .filter(Boolean);
    return arr.length ? arr.join(",") : null;
  }
  return __clean(v);
};

const __buildSummaryParams = (p = {}) => {
  // supports: project_id(s), stage_id(s), building_id(s)/tower_id(s), unit_id(s)/flat_id(s), pending_from
  const params = {};

  // mandatory
  const project = __toCsv(p.project_id ?? p.project_ids);
  if (!project) throw new Error("project_id is required");
  params.project_id = project;

  const stage = __toCsv(p.stage_id ?? p.stage_ids);
  if (stage) params.stage_id = stage;

  const building = __toCsv(
    p.building_id ?? p.building_ids ?? p.tower_id ?? p.tower_ids,
  );
  if (building) params.building_id = building;

  const unit = __toCsv(p.unit_id ?? p.unit_ids ?? p.flat_id ?? p.flat_ids);
  if (unit) params.unit_id = unit;

  const pendingFrom = __toCsv(
    p.pending_from ?? p.pending_from_roles ?? p.role ?? p.roles,
  );
  if (pendingFrom) params.pending_from = pendingFrom;

  // passthrough flags
  if (p.debug != null) params.debug = p.debug;
  if (p.export != null) params.export = p.export;

  return params;
};

// ✅ JSON fetch
export const getUnitStageRoleSummary = async (payload = {}) => {
  const token = __pickToken();
  const params = __buildSummaryParams(payload);

  return NEWchecklistInstance.get("/api/dashboard/unit-stage-role-summary/", {
    params,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
};

// ✅ Excel export download (direct)
export const exportUnitStageRoleSummaryExcel = async (
  payload = {},
  filename = "unit_stage_role_summary.xlsx",
) => {
  const token = __pickToken();
  const params = { ...__buildSummaryParams(payload), export: true };

  const res = await NEWchecklistInstance.get(
    "/api/dashboard/unit-stage-role-summary/",
    {
      params,
      responseType: "blob",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    },
  );

  // try filename from header
  const dispo = res.headers?.["content-disposition"];
  const name =
    filenameFromDisposition(dispo) ||
    `unit_stage_role_summary_${new Date().toISOString().slice(0, 10)}.xlsx`;

  downloadBlob(res.data, name);
  return true;
};

// ✅ WIP Breakdown (counts + optional rows)
export const getUnitWorkInProgressBreakdown = (params = {}) =>
  NEWchecklistInstance.get("/api/unit-work-in-progress-breakdown/", { params });

// ✅ WIP Breakdown Excel export
export const exportUnitWorkInProgressBreakdownExcel = async (
  params = {},
  filename = "unit_work_in_progress_breakdown.xlsx",
) => {
  const res = await NEWchecklistInstance.get(
    "/api/unit-work-in-progress-breakdown/",
    {
      params: { ...params, export: true }, // ✅ keep include_rows/limit from params
      responseType: "blob",
    },
  );

  const dispo = res.headers?.["content-disposition"];
  const name =
    filenameFromDisposition(dispo) ||
    `unit_wip_breakdown_${new Date().toISOString().slice(0, 10)}.xlsx`;

  downloadBlob(res.data, name);
  return true;
};

// ✅ Unit Checklist Report (JSON)
export const getUnitChecklistReport = (params = {}) =>
  NEWchecklistInstance.get("/unit-checklist-report/", { params });

// ✅ Unit Checklist Report Excel export (server generated)
export const exportUnitChecklistReportExcel = async (params = {}) => {
  const token =
    localStorage.getItem("ACCESS_TOKEN") ||
    localStorage.getItem("access") ||
    localStorage.getItem("accessToken") ||
    "";

  const res = await NEWchecklistInstance.get("/unit-checklist-report/", {
    params: { ...params, export: true },
    responseType: "blob",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  // ✅ If backend returns JSON error inside blob
  const contentType = res.headers?.["content-type"] || "";
  if (contentType.includes("application/json")) {
    const text = await res.data.text();
    let msg = "Export failed";
    try {
      const j = JSON.parse(text);
      msg = j?.detail || j?.message || msg;
    } catch { }
    throw new Error(msg);
  }

  const dispo = res.headers?.["content-disposition"];
  const name =
    filenameFromDisposition(dispo) ||
    `unit_checklist_report_${new Date().toISOString().slice(0, 10)}.xlsx`;

  downloadBlob(res.data, name);
  return true;
};

export const exportFormResponsePdf = async (
  responseId,
  { mode = "grid" } = {},
) => {
  const token =
    localStorage.getItem("ACCESS_TOKEN") ||
    localStorage.getItem("TOKEN") ||
    localStorage.getItem("token") ||
    "";

  const root = __getApiRoot();

  // ✅ try multiple possible routes (because your axios baseURL can be /users or /api)
  const urls = [
    `${root}/users/forms/responses/${responseId}/export-pdf/`,
    `${root}/api/forms/responses/${responseId}/export-pdf/`,
    `/forms/responses/${responseId}/export-pdf/`,
  ];

  const res = await __getBlobWithFallback(axiosInstance, urls, {
    params: { mode },
    responseType: "blob",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  // ✅ If backend returns JSON error inside blob
  const contentType = res.headers?.["content-type"] || "";
  if (contentType.includes("application/json")) {
    const text = await res.data.text();
    let msg = "PDF export failed";
    try {
      msg = JSON.parse(text)?.detail || JSON.parse(text)?.message || msg;
    } catch { }
    throw new Error(msg);
  }

  const dispo = res.headers?.["content-disposition"];
  const filename =
    filenameFromDisposition(dispo) || `response_${responseId}.pdf`;

  downloadBlob(res.data, filename);
  return true;
};

const API_BASE = "https://konstruct.world/checklists";
// const API_BASE = "http://localhost:8001/api";

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("ACCESS_TOKEN") ||
    localStorage.getItem("TOKEN") ||
    localStorage.getItem("token") ||
    ""
    }`,
});

// ✅ SCHEDULING (Checklist service)
// POST https://konstruct.world/checklists/api/scheduling/schedules/create/
export const createChecklistSchedule = (payload) =>
  NEWchecklistInstance.post("/scheduling/schedules/create/", payload, {
    headers: { "Content-Type": "application/json" },
  });

export const myProjectSchedules = (projectId) => {
  return axios.get(`${API_BASE}/scheduling/my/`, {
    params: { project_id: projectId },
    headers: authHeaders(),
  });
};

// (optional) NEW List API: /api/scheduling/list/?project_id=118
export const listProjectSchedules = (projectId) => {
  return axios.get(`${API_BASE}/scheduling/list/`, {
    params: { project_id: projectId },
    headers: authHeaders(),
  });
};

/* ===================== SAFETY (Sessions + Quiz) ===================== */

// ✅ LIST sessions
// GET https://konstruct.world/users/safety/sessions/?project_id=126&mode=SELF_PACED&status=PUBLISHED
export const listSafetySessions = (params = {}) =>
  axiosInstance.get("safety/sessions/", {
    params,
    headers: { "Content-Type": "application/json" },
  });

// ✅ GET single session (detail: includes assets/photos + counts)
export const getSafetySessionById = (sessionId) =>
  axiosInstance.get(`safety/sessions/${sessionId}/`, {
    headers: { "Content-Type": "application/json" },
  });

// ✅ CREATE session (manager)
// body: { mode,title,description,location,scheduled_at,due_at,acknowledgement_text, project_ids:[...], assignee_user_ids:[...] }
export const createSafetySession = (payload) =>
  axiosInstance.post("safety/sessions/", payload, {
    headers: { "Content-Type": "application/json" },
  });

// ✅ UPDATE session (manager)
export const updateSafetySession = (sessionId, payload) =>
  axiosInstance.patch(`safety/sessions/${sessionId}/`, payload, {
    headers: { "Content-Type": "application/json" },
  });

// ✅ DELETE session (manager)
export const deleteSafetySession = (sessionId) =>
  axiosInstance.delete(`safety/sessions/${sessionId}/`, {
    headers: { "Content-Type": "application/json" },
  });

// ✅ PUBLISH (manager)  POST /publish/
export const publishSafetySession = (sessionId) =>
  axiosInstance.post(`safety/sessions/${sessionId}/publish/`, null, {
    headers: { "Content-Type": "application/json" },
  });

// ✅ ARCHIVE (manager)  POST /archive/
export const archiveSafetySession = (sessionId) =>
  axiosInstance.post(`safety/sessions/${sessionId}/archive/`, null, {
    headers: { "Content-Type": "application/json" },
  });

// ✅ ASSIGN users (manager)
// body: { user_ids: [1,2,3] }
export const assignSafetySessionUsers = (sessionId, user_ids = []) =>
  axiosInstance.post(
    `safety/sessions/${sessionId}/assign/`,
    { user_ids },
    { headers: { "Content-Type": "application/json" } },
  );

// ✅ UPLOAD ASSET (manager) multipart
// asset_type: VIDEO | PPT | PDF | OTHER
export const uploadSafetySessionAsset = (
  sessionId,
  { asset_type, title = "", file },
) => {
  const fd = new FormData();
  fd.append("asset_type", asset_type);
  if (title) fd.append("title", title);
  if (file) {
    const filename = typeof file?.name === "string" ? file.name : "asset";
    fd.append("file", file, filename);
  }
  // ⚠️ don't set Content-Type; axios/browser sets boundary
  return axiosInstance.post(`safety/sessions/${sessionId}/assets/`, fd);
};

// ✅ UPLOAD PHOTO (manager, IN_PERSON only) multipart
export const uploadSafetySessionPhoto = (
  sessionId,
  { image, caption = "" },
) => {
  const fd = new FormData();
  if (image) {
    const filename = typeof image?.name === "string" ? image.name : "photo.jpg";
    fd.append("image", image, filename);
  }
  if (caption) fd.append("caption", caption);
  return axiosInstance.post(`safety/sessions/${sessionId}/photos/`, fd);
};

// ✅ UPDATE ATTENDANCE (manager, IN_PERSON only)
// body: { items: [{ user_id, status, note? }, ...] }
export const updateSafetySessionAttendance = (sessionId, items = []) =>
  axiosInstance.patch(
    `safety/sessions/${sessionId}/attendance/`,
    { items },
    { headers: { "Content-Type": "application/json" } },
  );

// ✅ REPORT (manager)
export const getSafetySessionReport = (sessionId) =>
  axiosInstance.get(`safety/sessions/${sessionId}/report/`, {
    headers: { "Content-Type": "application/json" },
  });

// ---------------- USER ACTIONS ----------------

// ✅ MARK VIEWED / COMPLETED (user + manager if can view/manage)
// body optional: { complete:true/false, acknowledged:true/false, acknowledgement_text:"..." }
export const markSafetySessionViewed = (sessionId, payload = {}) =>
  axiosInstance.post(`safety/sessions/${sessionId}/mark_viewed/`, payload, {
    headers: { "Content-Type": "application/json" },
  });

// ---------------- QUIZ (USER) ----------------

// ✅ GET quiz (public - no correct answers)
export const getSafetySessionQuiz = (sessionId) =>
  axiosInstance.get(`safety/sessions/${sessionId}/quiz/`, {
    headers: { "Content-Type": "application/json" },
  });

// ✅ START quiz attempt -> returns submission
export const startSafetyQuizAttempt = (sessionId) =>
  axiosInstance.post(`safety/sessions/${sessionId}/quiz_start/`, null, {
    headers: { "Content-Type": "application/json" },
  });

// ✅ SUBMIT answers (submission endpoint)
// body: { answers: [{question_id, selected_option_ids:[...]}, ...] }
export const submitSafetyQuiz = (submissionId, payload) =>
  axiosInstance.post(
    `safety/quiz-submissions/${submissionId}/submit/`,
    payload,
    {
      headers: { "Content-Type": "application/json" },
    },
  );

// ---------------- QUIZ (MANAGER) ----------------

// ✅ QUIZ SETUP (create/update)
export const setupSafetyQuiz = (sessionId, payload = {}) =>
  axiosInstance.post(`safety/sessions/${sessionId}/quiz_setup/`, payload, {
    headers: { "Content-Type": "application/json" },
  });

// ✅ ADD QUESTION
export const addSafetyQuizQuestion = (sessionId, payload) =>
  axiosInstance.post(
    `safety/sessions/${sessionId}/quiz_add_question/`,
    payload,
    {
      headers: { "Content-Type": "application/json" },
    },
  );

// ✅ ADD OPTION (payload must include question_id)
export const addSafetyQuizOption = (sessionId, payload) =>
  axiosInstance.post(`safety/sessions/${sessionId}/quiz_add_option/`, payload, {
    headers: { "Content-Type": "application/json" },
  });

// ✅ ADMIN QUIZ VIEW (includes is_correct)
export const getSafetyQuizAdmin = (sessionId) =>
  axiosInstance.get(`safety/sessions/${sessionId}/quiz_admin/`, {
    headers: { "Content-Type": "application/json" },
  });

// (optional) read submission detail
export const getSafetyQuizSubmissionById = (submissionId) =>
  axiosInstance.get(`safety/quiz-submissions/${submissionId}/`, {
    headers: { "Content-Type": "application/json" },
  });

export const bulkUploadSafetyQuizQuestions = (sessionId, payload) => {
  return axiosInstance.post(
    `/safety/sessions/${sessionId}/quiz_bulk_upload/`,
    payload,
  );
};

// ✅ IN_PERSON leader roster
export const getSafetySessionInPersonRoster = (sessionId) =>
  axiosInstance.get(`/safety/sessions/${sessionId}/in_person_roster/`);

// ✅ Leader marks attendance
export const leaderMarkSafetySessionAttendance = (sessionId, items) =>
  axiosInstance.patch(`/safety/sessions/${sessionId}/leader_attendance/`, {
    items,
  });

// ✅ Leader submit report (locks leader edits)
export const leaderSubmitSafetySessionReport = (sessionId) =>
  axiosInstance.post(`/safety/sessions/${sessionId}/leader_submit_report/`);

export const leaderUploadSafetySessionPhoto = (sessionId, formData) =>
  axiosInstance.post(`/safety/sessions/${sessionId}/leader_photos/`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const leaderUpdateSafetySessionTopics = (sessionId, topics_discussed) =>
  axiosInstance.patch(`/safety/sessions/${sessionId}/leader_topics/`, {
    topics_discussed,
  });

export const getMiniDashboardForProject = (projectId) => {
  // Checklist service endpoint (same domain)
  return NEWchecklistInstance.get(
    `/stats/mini-dashboard/?project_id=${projectId}`,
  );
};

export const getProjectStageInfo = (stageId) => {
  // Project service endpoint
  return projectInstance.get(`/stages/${stageId}/info/`);
};

/* ===================== SAFETY OBSERVATION  ===================== */

// LIST safety observations (for SafetyObservationList)
export const listSafetyObservations = (params = {}) =>
  checklistInstance.get("safety/observations/", {
    params,
    headers: { "Content-Type": "application/json" },
  });

// GET single safety observation (for detail page)
export const getSafetyObservationById = (id) =>
  checklistInstance.get(`safety/observations/${id}/`, {
    headers: { "Content-Type": "application/json" },
  });

/* ===================== FORMS: BASKETS + MANAGER DECISION ===================== */

// ---- Manager decision (assignment visibility mode)
// POST /forms/manager/decide/
export const managerDecideFormAssignments = (payload) =>
  __jsonWithFallback(axiosInstance, {
    method: "post",
    urlList: __formsUrlCandidates("/manager/decide/"),
    data: payload,
  });

// ---- Baskets (CRUD) ----
// GET /forms/baskets/?project_id=&stage_id=
export const listFormBaskets = (params = {}) =>
  __jsonWithFallback(axiosInstance, {
    method: "get",
    urlList: __formsUrlCandidates("/baskets/"),
    params,
  });

// POST /forms/baskets/
export const createFormBasket = (payload) =>
  __jsonWithFallback(axiosInstance, {
    method: "post",
    urlList: __formsUrlCandidates("/baskets/"),
    data: payload,
  });

// GET /forms/baskets/:id/
export const getFormBasketById = (basketId) =>
  __jsonWithFallback(axiosInstance, {
    method: "get",
    urlList: __formsUrlCandidates(`/baskets/${basketId}/`),
  });

// PATCH /forms/baskets/:id/
export const updateFormBasket = (basketId, payload) =>
  __jsonWithFallback(axiosInstance, {
    method: "patch",
    urlList: __formsUrlCandidates(`/baskets/${basketId}/`),
    data: payload,
  });

// DELETE /forms/baskets/:id/
export const deleteFormBasket = (basketId) =>
  __jsonWithFallback(axiosInstance, {
    method: "delete",
    urlList: __formsUrlCandidates(`/baskets/${basketId}/`),
  });

// ---- Basket availability for user ----
// GET /forms/baskets/available/?project_id=4
export const getAvailableFormBaskets = (projectId, extraParams = {}) =>
  __jsonWithFallback(axiosInstance, {
    method: "get",
    urlList: __formsUrlCandidates("/baskets/available/"),
    params: { project_id: projectId, ...extraParams },
  });

// ---- Basket items (assignments inside basket) ----
// GET /forms/baskets/:id/items/
export const listFormBasketItems = (basketId) =>
  __jsonWithFallback(axiosInstance, {
    method: "get",
    urlList: __formsUrlCandidates(`/baskets/${basketId}/set-items/`),
  });

// POST /forms/baskets/:id/items/   payload example: { assignment_ids:[1,2,3] }
export const addFormBasketItems = (basketId, payload) =>
  __jsonWithFallback(axiosInstance, {
    method: "post",
    urlList: __formsUrlCandidates(`/baskets/${basketId}/set-items/`),
    data: payload,
  });

// ---- Basket targets (users/groups mapped to basket) ----
// GET /forms/baskets/:id/targets/
export const getFormBasketTargets = (basketId) =>
  __jsonWithFallback(axiosInstance, {
    method: "get",
    urlList: __formsUrlCandidates(`/baskets/${basketId}/set-targets/`),
  });

// POST /forms/baskets/:id/flow/   payload: { nodes:[...], edges:[...] }
export const saveFormBasketFlow = (basketId, payload) =>
  __jsonWithFallback(axiosInstance, {
    method: "post",
    urlList: __formsUrlCandidates(`/baskets/${basketId}/set-flow/`),
    data: payload,
  });

// ---- Start response from basket (auto planned flow) ----
// POST /forms/baskets/:id/start/
// export const startFormFromBasket = (basketId, payload) =>
//   __jsonWithFallback(axiosInstance, {
//     method: "post",
//     urlList: __formsUrlCandidates(`/baskets/${basketId}/start/`),
//     data: payload,
//   });

/* ===== FIXED endpoints as per your backend ===== */

// GET /forms/baskets/:id/  (single source of truth for items/targets/flow)
export const getFormBasketDetail = (basketId) =>
  __jsonWithFallback(axiosInstance, {
    method: "get",
    urlList: __formsUrlCandidates(`/baskets/${basketId}/`),
  });

// POST /forms/baskets/:id/set-items/   { assignment_ids:[...], mark_decision_basket:true }
export const setFormBasketItems = (basketId, payload) =>
  __jsonWithFallback(axiosInstance, {
    method: "post",
    urlList: __formsUrlCandidates(`/baskets/${basketId}/set-items/`),
    data: payload,
  });

// POST /forms/baskets/:id/set-targets/   { targets:[{target_kind:"USER",user_id:..},{target_kind:"ROLE",role_code:"CHECKER"}] }
export const setFormBasketTargetsV2 = (basketId, payload) =>
  __jsonWithFallback(axiosInstance, {
    method: "post",
    urlList: __formsUrlCandidates(`/baskets/${basketId}/set-targets/`),
    data: payload,
  });

// POST /forms/baskets/:id/set-flow/   { flow_mode:"PLANNED", planned_steps:[[userId],[userId2]] }
export const setFormBasketFlowV2 = (basketId, payload) =>
  __jsonWithFallback(axiosInstance, {
    method: "post",
    urlList: __formsUrlCandidates(`/baskets/${basketId}/set-flow/`),
    data: payload,
  });

// POST /forms/baskets/:id/start-form/
export const startFormFromBasket = (basketId, payload) =>
  __jsonWithFallback(axiosInstance, {
    method: "post",
    urlList: __formsUrlCandidates(`/baskets/${basketId}/start-form/`),
    data: payload,
  });

// ################################ SAFETY API USAGE ########################################

// ---- Safety Setup (categories + templates) ----
export const listSafetyCategories = (params = {}) =>
  NEWchecklistInstance.get("/safety/categories/", {
    params: {
      org_id: params.org_id,
      project_id: params.project_id,
      active: params.active,
      template_type: params.template_type,
    },
    headers: { "Content-Type": "application/json" },
  });

export const createSafetyCategory = (payload) =>
  NEWchecklistInstance.post("/safety/categories/", payload, {
    headers: { "Content-Type": "application/json" },
  });

export const listSafetyTemplates = (params = {}) =>
  NEWchecklistInstance.get("/safety/templates/", {
    params: {
      org_id: params.org_id,
      project_id: params.project_id,
      category: params.category,
      status: params.status,
      is_latest: params.is_latest,
      module: "safety",
      template_type: params.template_type,
    },
    headers: { "Content-Type": "application/json" },
  });

export const getSafetyTemplate = (id) =>
  NEWchecklistInstance.get(`/safety/templates/${id}/`, {
    headers: { "Content-Type": "application/json" },
  });

export const createSafetyTemplate = (payload) =>
  NEWchecklistInstance.post("/safety/templates/", payload, {
    headers:
      payload instanceof FormData
        ? undefined
        : { "Content-Type": "application/json" },
  });

export const deleteSafetyTemplate = (id) =>
  NEWchecklistInstance.delete(`/safety/templates/${id}/`, {
    headers: { "Content-Type": "application/json" },
  });

// --- Housekeeping Aliases (temporarily pointing to Safety backend) ---
export const listHousekeepingCategories = listSafetyCategories;
export const createHousekeepingCategory = createSafetyCategory;
export const listHousekeepingTemplates = listSafetyTemplates;
export const getHousekeepingTemplate = getSafetyTemplate;
export const createHousekeepingTemplate = createSafetyTemplate;
export const deleteHousekeepingTemplate = deleteSafetyTemplate;

// ---- Safety Checklist Instances (Manager creates from template) ----
export const listSafetyChecklists = (params = {}) =>
  NEWchecklistInstance.get("/safety/checklists/", {
    params: {
      project_id: params.project_id,
      org_id: params.org_id ?? resolveOrgId(),
      assigned_to_me: params.assigned_to_me,
      status: params.status,
      template_type: params.template_type,
    },
    headers: { "Content-Type": "application/json" },
  });

// Start/initialize a safety checklist (status not_started → in_progress)
export const startSafetyChecklist = (id, params = {}) =>
  NEWchecklistInstance.post(
    `/safety/checklists/${id}/initialize/`,
    {},
    {
      params: {
        org_id: params.org_id ?? resolveOrgId(),
      },
      headers: { "Content-Type": "application/json" },
    },
  );

export const getSafetyChecklist = (id, params = {}) =>
  NEWchecklistInstance.get(`/safety/checklists/${id}/`, {
    params: {
      org_id: params.org_id ?? resolveOrgId(),
    },
    headers: { "Content-Type": "application/json" },
  });

export const createSafetyChecklist = (payload) =>
  NEWchecklistInstance.post("/safety/checklists/", payload, {
    headers: { "Content-Type": "application/json" },
  });

export const submitSafetyChecklist = (id, payload = {}) =>
  NEWchecklistInstance.post(`/safety/checklists/${id}/submit/`, payload, {
    params: {
      org_id: resolveOrgId(),
    },
    headers:
      payload instanceof FormData
        ? undefined
        : { "Content-Type": "application/json" },
  });

export const approveSafetyChecklist = (id, payload = {}) =>
  NEWchecklistInstance.post(`/safety/checklists/${id}/approve/`, payload, {
    params: {
      org_id: resolveOrgId(),
    },
    headers:
      payload instanceof FormData
        ? undefined
        : { "Content-Type": "application/json" },
  });

export const rejectSafetyChecklist = (id, payload = {}) =>
  NEWchecklistInstance.post(`/safety/checklists/${id}/reject/`, payload, {
    params: {
      org_id: resolveOrgId(),
    },
    headers:
      payload instanceof FormData
        ? undefined
        : { "Content-Type": "application/json" },
  });

export const downloadSafetyReport = (id, params = {}) =>
  NEWchecklistInstance.get(`/safety/checklists/${id}/report/`, {
    params: {
      org_id: params.org_id ?? resolveOrgId(),
      mode: params.mode || "download",
    },
    responseType: "blob",
  });

export const getSafetyReportMeta = (id) =>
  NEWchecklistInstance.get(`/safety/checklists/${id}/report-meta/`, {
    params: { org_id: resolveOrgId() },
  });

export const updateSafetyReportMeta = (id, payload) =>
  NEWchecklistInstance.patch(`/safety/checklists/${id}/report-meta/`, payload, {
    params: { org_id: resolveOrgId() },
    headers: { "Content-Type": "application/json" },
  });

export const getSafetyChecklistHistory = (id, params = {}) =>
  NEWchecklistInstance.get(`/safety/checklists/${id}/history/`, {
    params: {
      org_id: params.org_id ?? resolveOrgId(),
    },
    headers: { "Content-Type": "application/json" },
  });

export const createAndSubmitSafetyChecklist = (payload) =>
  NEWchecklistInstance.post("/safety/checklists/create-and-submit/", payload, {
    params: {
      org_id: resolveOrgId(),
    },
    headers:
      payload instanceof FormData
        ? undefined
        : { "Content-Type": "application/json" },
  });

export const listContractorNamesByOrg = (orgId, projectId) =>
  axiosInstance.get("/contractors/", {
    params: {
      org_id: orgId,
      project_id: projectId,
    },
    headers: { "Content-Type": "application/json" },
  });



export const updateSafetyTemplateVersion = (templateId, payload) => {
  return NEWchecklistInstance.patch(
    `/safety/templates/${templateId}/edit-version/`,
    payload,
    {
      headers:
        payload instanceof FormData
          ? { "Content-Type": "multipart/form-data" }
          : {},
    },
  );
};

//###################################################################################################

const resolveMediaUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;

  const base =
    window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost"
      ? "http://127.0.0.1:8001"
      : "https://konstruct.world/checklists";

  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${base}${clean}`;
};;

/* ===================== SAFETY OBSERVATION  ===================== */

export const createSafetyObservation = (data) =>
  checklistInstance.post("safety/observations/", data, {
    // Let browser set Content-Type for FormData
    headers: { "Content-Type": "multipart/form-data" },
  });

export const updateSafetyObservation = (id, data) =>
  checklistInstance.patch(`safety/observations/${id}/`, data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

export const downloadSafetyObservationReport = (params = {}) =>
  checklistInstance.get("safety/observations/report/", {
    params,
    responseType: "blob",
  });

// QHSE

export const getDmsBoxFileRegister = (params = {}) =>
  axiosInstance.get("/dms/box-file-register/", {
    params,
    headers: { "Content-Type": "application/json" },
  });

export const saveDmsBoxFileRegister = (payload) =>
  axiosInstance.put("/dms/box-file-register/", payload, {
    headers: { "Content-Type": "application/json" },
  });

/** POST multipart `file` to a persisted row UUID. */
export const uploadDmsBoxFileRowAttachment = (rowId, file) => {
  const formData = new FormData();
  formData.append("file", file);
  return axiosInstance.post(
    `/dms/box-file-register/rows/${rowId}/attachments/`,
    formData,
    {
      headers: { Accept: "application/json" },
    },
  );
};

export const getDmsCommunicationMatrix = (params = {}) =>
  axiosInstance.get("/dms/communication-matrix/", {
    params,
    headers: { "Content-Type": "application/json" },
  });

export const getDmsEscalationMatrix = (params = {}) =>
  axiosInstance.get("/dms/escalation-matrix/", {
    params,
    headers: { "Content-Type": "application/json" },
  });

/**
 * Construction Programs — Minutes of Meeting (folder-scoped).
 * GET returns `{ count, results }` when listing; `folder` query param (UUID) is required.
 */
export const listDmsMinutesOfMeeting = (params = {}) =>
  axiosInstance.get("/dms/minutes-of-meeting/", {
    params,
    headers: { "Content-Type": "application/json" },
  });

export const createDmsMinutesOfMeeting = (data) =>
  axiosInstance.post("/dms/minutes-of-meeting/", data, {
    headers: { "Content-Type": "application/json" },
  });

export const deleteDmsMinutesOfMeeting = (id) =>
  axiosInstance.delete(`/dms/minutes-of-meeting/${id}/`, {
    headers: { "Content-Type": "application/json" },
  });

export const uploadDmsMomAttachment = (minutesId, file) => {
  const formData = new FormData();
  formData.append("file", file);
  return axiosInstance.post(
    `/dms/minutes-of-meeting/${minutesId}/attachments/`,
    formData,
    {
      headers: { Accept: "application/json" },
    },
  );
};

// =============================================================================
// DMS — QC ASSETS (NEW)
// -----------------------------------------------------------------------------
// Backend routes: GET/POST /dms/qc-assets/masters/, GET/POST/PATCH/DELETE /dms/qc-assets/requirements/
// Consumers:
//   - QcAssetsCreateForm.jsx     → getProjectsForCurrentUser; submit uses bulk create (createDmsQcAssetRequirementsFromDescriptions)
//   - QCAssetsRegisterTable.jsx  → updateDmsQcAssetRequirement, deleteDmsQcAssetRequirement (+ refresh via parent)
//   - Documents.jsx              → listDmsQcAssetRequirements (filter scope = QC_ASSETS_REGISTER_SCOPE), batch create below
// =============================================================================

/**
 * Fixed scope stored for every QC register row (UI does not collect scope).
 * Backend still requires `scope` on QCAssetRequirement; we always use this value.
 */
export const QC_ASSETS_REGISTER_SCOPE = "General";

/** Master catalog (instruments/equipment). Query: org_id, project_id, category, is_active, search */
export const listDmsQcAssetMasters = (params = {}) =>
  axiosInstance.get("/dms/qc-assets/masters/", {
    params,
    headers: { "Content-Type": "application/json" },
  });

/** Project / org requirement lines. Query: org_id, project_id, scope, status, ordering */
export const listDmsQcAssetRequirements = (params = {}) =>
  axiosInstance.get("/dms/qc-assets/requirements/", {
    params,
    headers: { "Content-Type": "application/json" },
  });

/** Single requirement (detail / edit prefetch). */
export const getDmsQcAssetRequirement = (id) =>
  axiosInstance.get(`/dms/qc-assets/requirements/${id}/`, {
    headers: { "Content-Type": "application/json" },
  });

/** Create one requirement row. */
export const createDmsQcAssetRequirement = (data) =>
  axiosInstance.post("/dms/qc-assets/requirements/", data, {
    headers: { "Content-Type": "application/json" },
  });

/** Partial update (quantities, remarks, status, etc.). */
export const updateDmsQcAssetRequirement = (id, data) =>
  axiosInstance.patch(`/dms/qc-assets/requirements/${id}/`, data, {
    headers: { "Content-Type": "application/json" },
  });

/** Soft-delete on server (same pattern as manpower). */
export const deleteDmsQcAssetRequirement = (id) =>
  axiosInstance.delete(`/dms/qc-assets/requirements/${id}/`, {
    headers: { "Content-Type": "application/json" },
  });

/** Create one project-scoped master row (admin / catalog tooling). */
export const createDmsQcAssetMaster = (data) =>
  axiosInstance.post("/dms/qc-assets/masters/", data, {
    headers: { "Content-Type": "application/json" },
  });

/** Bulk-create QC requirements; server resolves/creates project-scoped masters per line. */
export const bulkCreateDmsQcAssetRequirements = (body) =>
  axiosInstance.post("/dms/qc-assets/requirements/bulk-create/", body, {
    headers: { "Content-Type": "application/json" },
  });

/**
 * Batch-create QC requirement rows from the simplified form (project + lines with free-text description).
 * Each line: { description, minimumNo?, actual?, remark? }. Scope is fixed to QC_ASSETS_REGISTER_SCOPE.
 * Server get-or-creates `QCAssetMaster` per description and inserts requirements in one transaction.
 *
 * @param {string} orgId
 * @param {{ projectId: string, requirements: Array<{ description: string, minimumNo?: string, actual?: string, remark?: string }> }} payload
 * @returns {Promise<{ ok: boolean, count: number }>}
 */
export const createDmsQcAssetRequirementsFromDescriptions = async (
  orgId,
  payload,
) => {
  const lines = (payload.requirements || [])
    .map((r) => ({
      description: String(r.description || "").trim(),
      minimum_no: String(r.minimumNo ?? "").trim(),
      actual: String(r.actual ?? "").trim(),
      remark: String(r.remark ?? "").trim(),
    }))
    .filter((line) => line.description);
  if (!lines.length) {
    return { ok: true, count: 0 };
  }
  const res = await bulkCreateDmsQcAssetRequirements({
    org_id: String(orgId),
    project_id: String(payload.projectId),
    scope: QC_ASSETS_REGISTER_SCOPE,
    lines,
  });
  const created = res.data?.created;
  return {
    ok: true,
    count: typeof created === "number" ? created : lines.length,
  };
};

// POST /forms/baskets/:id/targets/  payload: { user_ids:[...], group_ids:[...] }
export const setFormBasketTargets = (basketId, payload) =>
  __jsonWithFallback(axiosInstance, {
    method: "post",
    urlList: __formsUrlCandidates(`/baskets/${basketId}/set-targets/`),
    data: payload,
  });

// ---- Basket flow (tree) ----
// GET /forms/baskets/:id/flow/
export const getFormBasketFlow = (basketId) =>
  __jsonWithFallback(axiosInstance, {
    method: "get",
    urlList: __formsUrlCandidates(`/baskets/${basketId}/set-flow/`),
  });

// Vendor

/**
 * Vendor directory & onboarding (user_service).
 * GET /vendors/directory/?project_id=&search=
 * POST /vendors/invite/  { project_id, emails[], invitation_message }
 * GET /vendors/invitations/verify/<token>/  (public)
 * POST /vendors/invitations/complete/<token>/  (public)
 */
export const fetchVendorDirectory = async (params = {}) =>
  axiosInstance.get(`/vendors/directory/`, {
    params,
    headers: {
      "Content-Type": "application/json",
    },
  });

export const inviteVendors = async (payload) =>
  axiosInstance.post(`/vendors/invite/`, payload, {
    headers: {
      "Content-Type": "application/json",
    },
  });

export const verifyVendorInvitation = async (token) =>
  axiosInstance.get(
    `/vendors/invitations/verify/${encodeURIComponent(token)}/`,
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

export const completeVendorOnboarding = async (token, payload) =>
  axiosInstance.post(
    `/vendors/invitations/complete/${encodeURIComponent(token)}/`,
    payload,
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

export const getRootFolders = async (params = {}) =>
  withNormalizedDmsFolders(
    axiosInstance.get("/dms/folders/", {
      params,
      headers: { "Content-Type": "application/json" },
    }),
    { many: true },
  );

export const getFolderDetail = async (folderId, params = {}) =>
  withNormalizedDmsFolders(
    axiosInstance.get(`/dms/folders/${folderId}/`, {
      params,
      headers: { "Content-Type": "application/json" },
    }),
  );

export const createFolder = async (data) =>
  withNormalizedDmsFolders(
    axiosInstance.post("/dms/folders/", data, {
      headers: { "Content-Type": "application/json" },
    }),
  );

export const updateFolder = async (folderId, data) =>
  withNormalizedDmsFolders(
    axiosInstance.patch(`/dms/folders/${folderId}/`, data, {
      headers: { "Content-Type": "application/json" },
    }),
  );

export const deleteFolder = async (folderId) =>
  axiosInstance.delete(`/dms/folders/${folderId}/`, {
    headers: { "Content-Type": "application/json" },
  });

export const postDmsFilesZipDownload = async (fileIds) =>
  axiosInstance.post(
    `/dms/files/download_zip/`,
    { file_ids: fileIds },
    {
      headers: { "Content-Type": "application/json" },
      responseType: "blob",
    },
  );

// Files
export const uploadDmsFile = async (formData) =>
  axiosInstance.post("/dms/files/upload/", formData, {
    // don't set multipart boundary manually
    headers: { Accept: "application/json" },
  });

export const getDmsFile = async (fileId, params = {}) =>
  axiosInstance.get(`/dms/files/${fileId}/`, {
    params,
    headers: { "Content-Type": "application/json" },
  });

// export const getDmsFileOpenLink = async (fileId, params = {}) =>
//   axiosInstance.get(`/dms/files/${fileId}/open/`, {
//     params,
//     headers: { "Content-Type": "application/json" },
//   });

// DRIVE FILE UPLOAD
export const getDmsFileOpenLink = async (fileId, params = {}) =>
  axiosInstance.get(`/dms/files/${fileId}/open/`, {
    params,
    headers: { "Content-Type": "application/json" },
  });

export const downloadDmsFile = async (fileId) =>
  axiosInstance.get(`/dms/files/${fileId}/download/`, {
    responseType: "blob",
  });

export const deleteDmsFile = async (fileId) =>
  axiosInstance.delete(`/dms/files/${fileId}/`, {
    headers: { "Content-Type": "application/json" },
  });

export const patchDmsFileReorder = async (folderId, items) =>
  axiosInstance.patch(
    `/dms/folders/${folderId}/reorder_files/`,
    { items },
    { headers: { "Content-Type": "application/json" } },
  );

export const createDmsDocument = async (data) =>
  axiosInstance.post("/dms/documents/", data, {
    headers: { "Content-Type": "application/json" },
  });

export const deleteDmsDocument = async (docId) =>
  axiosInstance.delete(`/dms/documents/${docId}/`, {
    headers: { "Content-Type": "application/json" },
  });

// Documents (transmittals)
export const listDmsDocuments = async (params = {}) =>
  axiosInstance.get("/dms/documents/", {
    params,
    headers: { "Content-Type": "application/json" },
  });

// Drafts
export const listDmsDrafts = async (params = {}) =>
  axiosInstance.get("/dms/drafts/", {
    params,
    headers: { "Content-Type": "application/json" },
  });

export const createDmsDraft = async (data) =>
  axiosInstance.post("/dms/drafts/", data, {
    headers: { "Content-Type": "application/json" },
  });

export const deleteDmsDraft = async (draftId) =>
  axiosInstance.delete(`/dms/drafts/${draftId}/`, {
    headers: { "Content-Type": "application/json" },
  });

// ---- DMS: session / tenancy helper (manpower + QC assets) ----
/** Org id from JWT (user service); required for DMS manpower & QC asset tenancy. */
export const getSessionOrgId = () => {
  try {
    const token =
      localStorage.getItem("ACCESS_TOKEN") ||
      localStorage.getItem("access") ||
      localStorage.getItem("accessToken") ||
      "";
    if (!token || token.split(".").length < 2) return null;
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (payload.org != null && payload.org !== "") return String(payload.org);
  } catch {
    /* ignore */
  }
  return null;
};

// ---- DMS: minimum manpower register ----
export const listDmsManpowerPositions = (params = {}) =>
  axiosInstance.get("/dms/manpower/positions/", {
    params,
    headers: { "Content-Type": "application/json" },
  });

export const listDmsManpowerRequirements = (params = {}) =>
  axiosInstance.get("/dms/manpower/requirements/", {
    params,
    headers: { "Content-Type": "application/json" },
  });

export const createDmsManpowerRequirement = (data) =>
  axiosInstance.post("/dms/manpower/requirements/", data, {
    headers: { "Content-Type": "application/json" },
  });

export const updateDmsManpowerRequirement = (id, data) =>
  axiosInstance.patch(`/dms/manpower/requirements/${id}/`, data, {
    headers: { "Content-Type": "application/json" },
  });

export const normalizeDmsList = (data) =>
  Array.isArray(data) ? data : (data?.results ?? []);

const __sliceField = (v, max = 128) => String(v ?? "").slice(0, max);

/** Normalize minimum manpower "actual deploy" for API: B | P | S or empty. */
export function normalizeDmsManpowerActualDeploy(raw) {
  const c = String(raw ?? "")
    .trim()
    .toUpperCase()
    .slice(0, 1);
  if (c === "B" || c === "P" || c === "S") return c;
  return "";
}

/** MMR register line: deployment legend B | P | S or empty. */
export function normalizeDmsMmrDeployment(raw) {
  return normalizeDmsManpowerActualDeploy(raw);
}

/**
 * Create new requirement rows only (POST). Callers should check for duplicate positions first.
 * Backend: min_experience / number_required as text; actual_deploy as B | P | S (deployment legend).
 * Free-text "actual deployment" detail is appended to remark when present.
 */
export const createDmsManpowerRequirementsForScope = async (orgId, payload) => {
  const { projectId, scope, requirements } = payload;
  const oid = String(orgId);
  const pid = String(projectId);
  let count = 0;
  for (const line of requirements || []) {
    const posId = String(line.positionId || "").trim();
    if (!posId) continue;
    const deployLegend =
      normalizeDmsManpowerActualDeploy(line.deployment) ||
      normalizeDmsManpowerActualDeploy(line.actualDeploy);
    const rawActual = String(line.actualDeploy ?? "").trim();
    const isSameAsLegend =
      rawActual.length === 1 &&
      ["B", "P", "S"].includes(rawActual.toUpperCase()) &&
      rawActual.toUpperCase() === deployLegend;
    const actualDetail = isSameAsLegend ? "" : rawActual;
    const baseRemark = String(line.remark || "").trim();
    const extra = actualDetail
      ? `\nActual deployment${deployLegend ? " (detail)" : ""}: ${actualDetail.slice(0, 2000)}`
      : "";
    const remark = (baseRemark + extra).trim().slice(0, 5000);
    const body = {
      org_id: oid,
      project_id: pid,
      position: Number(posId),
      scope,
      min_experience: __sliceField(line.minExp),
      number_required: __sliceField(line.numberRequired),
      actual_deploy: deployLegend,
      remark,
      status: "open",
      approval_status: "not_applicable",
    };
    await createDmsManpowerRequirement(body);
    count += 1;
  }
  return { ok: true, count };
};

/** @deprecated Use createDmsManpowerRequirementsForScope (POST-only; no PATCH). */
export const upsertDmsManpowerRequirementsForScope =
  createDmsManpowerRequirementsForScope;

// ---- DMS: resource register (master-template + transactional entry) ----
/** Combined MMR + QC (legacy); prefer split endpoints below. */
export const getDmsResourceRegister = (params = {}) =>
  axiosInstance.get("/dms/resource-register/", {
    params,
    headers: { "Content-Type": "application/json" },
  });

export const saveDmsResourceRegister = (payload) =>
  axiosInstance.post("/dms/resource-register/", payload, {
    headers: { "Content-Type": "application/json" },
  });

export const getDmsMinimumManpowerRegister = (params = {}) =>
  axiosInstance.get("/dms/resource-register/minimum-manpower/", {
    params,
    headers: { "Content-Type": "application/json" },
  });

export const saveDmsMinimumManpowerRegister = (payload) =>
  axiosInstance.post("/dms/resource-register/minimum-manpower/", payload, {
    headers: { "Content-Type": "application/json" },
  });

export const getDmsQcAssetsRegister = (params = {}) =>
  axiosInstance.get("/dms/resource-register/qc-assets/", {
    params,
    headers: { "Content-Type": "application/json" },
  });

export const saveDmsQcAssetsRegister = (payload) =>
  axiosInstance.post("/dms/resource-register/qc-assets/", payload, {
    headers: { "Content-Type": "application/json" },
  });

// ************************************************** DMS **************************************************
// Base path: axiosInstance `/dms/...` (user service). Sub-sections below: core folders/files, manpower, QC assets.
const normalizeDmsFolderOwnerNames = (node) => {
  if (!node || typeof node !== "object") return node;
  const next = { ...node };
  if (next.created_by != null) {
    next.created_by = String(next.created_by);
  }
  if (Array.isArray(next.children)) {
    next.children = next.children.map(normalizeDmsFolderOwnerNames);
  }
  return next;
};

const withNormalizedDmsFolders = async (
  requestPromise,
  { many = false } = {},
) => {
  const response = await requestPromise;
  if (many && Array.isArray(response?.data)) {
    response.data = response.data.map(normalizeDmsFolderOwnerNames);
  } else if (!many && response?.data && typeof response.data === "object") {
    response.data = normalizeDmsFolderOwnerNames(response.data);
  }
  return response;
};


// Templates
export const listPTWTemplates = (params = {}) =>
  NEWchecklistInstance.get("/templates/", {
    params: {
      code: params.code,
    },
    headers: { "Content-Type": "application/json" },
  });

export const getPTWTemplate = (id) =>
  NEWchecklistInstance.get(`/templates/${id}/`, {
    headers: { "Content-Type": "application/json" },
  });

// Approval flows
export const listPTWApprovalFlows = () =>
  NEWchecklistInstance.get("/approval-flows/", {
    headers: { "Content-Type": "application/json" },
  });

// Permits
export const listPermits = (params = {}) =>
  NEWchecklistInstance.get("/permits/", {
    params: {
      template_id: params.template_id,
      selected_flow_id: params.selected_flow_id,
      current_status: params.current_status,
      current_stage: params.current_stage,
      project_id: params.project_id,
      organization_id: params.organization_id,
      created_by_id: params.created_by_id,
      created_by_me: params.created_by_me,
      assigned_to_me: params.assigned_to_me,
    },
    headers: { "Content-Type": "application/json" },
  });

const unwrapPermit = (res) => {
  if (res.data && res.data.permit) {
    res.data = res.data.permit;
  }
  return res;
};

export const getPermit = (id, params = {}) =>
  NEWchecklistInstance.get(`/permits/${id}/`, {
    headers: { "Content-Type": "application/json" },
    params,
  }).then(unwrapPermit);

export const createPermit = (payload) =>
  NEWchecklistInstance.post("/permits/", payload, {
    headers: { "Content-Type": "multipart/form-data" },
  }).then(unwrapPermit);

export const updatePermit = (id, payload) =>
  NEWchecklistInstance.patch(`/permits/${id}/`, payload, {
    headers: { "Content-Type": "application/json" },
  }).then(unwrapPermit);

//permit TBT Attendance 
export const getPermitTbtAttendance = (permitId) =>
  NEWchecklistInstance.get(`/permits/${permitId}/tbt-attendance/`);

export const savePermitTbtAttendance = (permitId, formData) =>
  NEWchecklistInstance.post(
    `/permits/${permitId}/tbt-attendance/`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

export const submitPermit = (id) =>
  NEWchecklistInstance.post(
    `/permits/${id}/submit/`,
    {},
    {
      headers: { "Content-Type": "multipart/form-data" },
    },
  ).then(unwrapPermit);

export const permitWorkflowAction = (id, payload) =>
  NEWchecklistInstance.post(`/permits/${id}/action/`, payload, {
    headers: { "Content-Type": "application/json" },
  }).then(unwrapPermit);

export const getPermitWorkflowLogs = (id) =>
  NEWchecklistInstance.get(`/permits/${id}/workflow-logs/`, {
    headers: { "Content-Type": "application/json" },
  });

export const listPermitLogs = async (params = {}) => {
  const permitsRes = await listPermits(params);
  const permits = Array.isArray(permitsRes?.data)
    ? permitsRes.data
    : permitsRes?.data?.results || [];

  const logResponses = await Promise.all(
    permits.map(async (permit) => {
      try {
        const res = await getPermitWorkflowLogs(permit.id);
        const logs = Array.isArray(res?.data) ? res.data : res?.data?.results || [];
        return logs.map((log) => ({
          ...log,
          permit_id: log?.permit_id ?? permit.id,
          current_stage: log?.current_stage ?? permit.current_stage ?? "",
          current_status: log?.current_status ?? permit.current_status ?? "",
        }));
      } catch {
        return [];
      }
    })
  );

  return {
    data: logResponses.flat().sort((a, b) => {
      const aTime = new Date(
        a?.performed_at || a?.created_at || a?.timestamp || 0
      ).getTime();
      const bTime = new Date(
        b?.performed_at || b?.created_at || b?.timestamp || 0
      ).getTime();
      return bTime - aTime;
    }),
  };
};

export const reservePermitNumber = (payload) =>
  NEWchecklistInstance.post("/permits/reserve-number/", payload, {
    headers: { "Content-Type": "application/json" },
  });

export const getUserGroups = () => axiosInstance.get("/user-groups/");

export const listPermitTemplateBuilderTemplates = (params = {}) =>
  NEWchecklistInstance.get("/template-builder/", { params });

export const getPermitTemplateBuilderTemplate = (id) =>
  NEWchecklistInstance.get(`/template-builder/${id}/`);

export const createPermitTemplateBuilderTemplate = (payload) =>
  NEWchecklistInstance.post("/template-builder/", payload, {
    headers:
      payload instanceof FormData
        ? { "Content-Type": "multipart/form-data" }
        : undefined,
  });

export const updatePermitTemplateBuilderTemplate = (id, payload) =>
  NEWchecklistInstance.patch(`/template-builder/${id}/`, payload, {
    headers:
      payload instanceof FormData
        ? { "Content-Type": "multipart/form-data" }
        : undefined,
  });


export const deletePermitTemplateBuilderTemplate = (id) =>
  NEWchecklistInstance.delete(`/template-builder/${id}/`);


export const clonePermitTemplateBuilderTemplate = (id) =>
  NEWchecklistInstance.post(`/template-builder/${id}/clone/`);

export const publishPermitTemplateBuilderTemplate = (id) =>
  NEWchecklistInstance.post(`/template-builder/${id}/publish/`);



export const getPTWRegisterBranding = (params = {}) =>
  NEWchecklistInstance.get("/ptw-document-branding/permit-register/", {
    params: {
      project_id: params.project_id || undefined,
      organization_id: params.organization_id || undefined,
    },
  });

export const savePTWRegisterBranding = (payload, params = {}) =>
  NEWchecklistInstance.post("/ptw-document-branding/permit-register/", payload, {
    params: {
      project_id: params.project_id || undefined,
      organization_id: params.organization_id || undefined,
    },
    headers:
      payload instanceof FormData
        ? { "Content-Type": "multipart/form-data" }
        : undefined,
  });

export const updatePTWRegisterBranding = (payload, params = {}) =>
  NEWchecklistInstance.patch("/ptw-document-branding/permit-register/", payload, {
    params: {
      project_id: params.project_id || undefined,
      organization_id: params.organization_id || undefined,
    },
    headers:
      payload instanceof FormData
        ? { "Content-Type": "multipart/form-data" }
        : undefined,
  });



//########################################################################################### 

// =======================================
// Permit to Work 
// =======================================
export const resolveCurrentUserDisplayName = () => {
  const data = __getUserDataFromStorage();
  if (!data) return "";

  const fullName = [data?.first_name, data?.last_name]
    .filter((part) => String(part || "").trim())
    .join(" ")
    .trim();

  return (
    fullName ||
    String(
      data?.full_name ||
      data?.name ||
      data?.username ||
      data?.email ||
      ""
    ).trim()
  );
};


export const resolveCurrentUserId = () => {
  const data = __getUserDataFromStorage();
  return Number(
    data?.id ||
    data?.user_id ||
    data?.pk ||
    localStorage.getItem("USER_ID") ||
    localStorage.getItem("user_id")
  ) || null;
};

// Permit download api
export const downloadPermitReport = async (permitId) => {
  const res = await NEWchecklistInstance.get(`/permits/${permitId}/report/`, {
    responseType: "blob",
  });

  const contentType = res.headers?.["content-type"] || "";

  if (contentType.includes("application/json")) {
    const text = await res.data.text();
    let msg = "Permit report download failed";

    try {
      const json = JSON.parse(text);
      msg = json?.detail || json?.message || msg;
    } catch { }

    throw new Error(msg);
  }

  const disposition = res.headers?.["content-disposition"];
  const filename =
    filenameFromDisposition(disposition) || `permit_${permitId}_report.pdf`;

  downloadBlob(res.data, filename);
  return true;
};

// Permit register download api
export const downloadPermitRegister = async (projectId) => {
  const res = await NEWchecklistInstance.get(`/permits/download-register/`, {
    params: { project_id: projectId },
    responseType: "blob",
  });

  const contentType = res.headers?.["content-type"] || "";

  if (contentType.includes("application/json")) {
    const text = await res.data.text();
    let msg = "Permit register download failed";

    try {
      const json = JSON.parse(text);
      msg = json?.detail || json?.message || msg;
    } catch { }

    throw new Error(msg);
  }

  const disposition = res.headers?.["content-disposition"];
  const filename =
    filenameFromDisposition(disposition) || `permit_register_project_${projectId}.pdf`;

  downloadBlob(res.data, filename);
  return true;
};

export const getPermitTBTAttendance = (permitId) =>
  NEWchecklistInstance.get(`/permits/${permitId}/tbt-attendance/`);

export const savePermitTBTAttendance = (permitId, payload) =>
  NEWchecklistInstance.post(`/permits/${permitId}/tbt-attendance/`, payload, {
    headers:
      payload instanceof FormData
        ? { "Content-Type": "multipart/form-data" }
        : undefined,
  });

export const downloadPermitTBTAttendanceReport = async (permitId) => {
  const res = await NEWchecklistInstance.get(
    `/permits/${permitId}/tbt-attendance-report/`,
    {
      responseType: "blob",
    }
  );

  const contentType = res.headers?.["content-type"] || "";

  if (contentType.includes("application/json")) {
    const text = await res.data.text();
    let msg = "TBT attendance report download failed";

    try {
      const json = JSON.parse(text);
      msg = json?.detail || json?.message || msg;
    } catch {}

    throw new Error(msg);
  }

  const disposition = res.headers?.["content-disposition"];
  const filename =
    filenameFromDisposition?.(disposition) ||
    `tbt_attendance_permit_${permitId}.pdf`;

  downloadBlob(res.data, filename);
  return true;
};


export const getProjectMakersForNCR = async (projectId) =>
  axiosInstance.get("/by-project/", {
    params: {
      project_id: projectId,
    },
    headers: {
      "Content-Type": "application/json",
    },
  });


// --- NCR API Calls ---
export const getNCRSummary = (params) => NEWchecklistInstance.get('/ncr/dashboard-summary/', { params });
export const getNCRList = (params) => NEWchecklistInstance.get('/ncr/', { params });
export const getNCRDetail = (id) => NEWchecklistInstance.get(`/ncr/${id}/`);
export const submitMakerResponse = (id, formData) => NEWchecklistInstance.post(`/ncr/${id}/maker-submit/`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const getMyPending = (params) => NEWchecklistInstance.get('/ncr/my-pending/', { params });
export const createNCR = (formData) => NEWchecklistInstance.post('/ncr/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const checkerVerifyNCR = (id, formData) => NEWchecklistInstance.post(`/ncr/${id}/checker-verify/`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const getNCRLogs = (id) => NEWchecklistInstance.get(`/ncr/${id}/logs/`);
export const getNCRReportData = (id) => NEWchecklistInstance.get(`/ncr/${id}/report-data/`);
export const getProjectHeadPendingNCRs = (params) => NEWchecklistInstance.get('/ncr/project-head-pending/', { params });
export const projectHeadSignNCR = (id, formData) => NEWchecklistInstance.post(`/ncr/${id}/project-head-sign/`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const downloadNCRClosedReport = async (id) => {
  const res = await NEWchecklistInstance.get(`/ncr/${id}/download-report/`, {
    responseType: "blob",
  });
  return res;
};