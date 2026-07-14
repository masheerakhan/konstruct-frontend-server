import {
  getNCRSummary as apiGetNCRSummary,
  getNCRList as apiGetNCRList,
  getNCRDetail as apiGetNCRDetail,
  submitMakerResponse as apiSubmitMakerResponse,
  getMyPending as apiGetMyPending,
  createNCR as apiCreateNCR,
  checkerVerifyNCR as apiCheckerVerifyNCR,
  downloadNCRClosedReport as apiDownloadNCRClosedReport,
  getProjectHeadPendingNCRs as apiGetProjectHeadPendingNCRs,
  projectHeadSignNCR as apiProjectHeadSignNCR,
} from "../api";

export const getNCRSummary = async (params) => {
  const res = await apiGetNCRSummary(params);
  return res.data;
};

export const getNCRList = async ({
  status = "all",
  page = 1,
  pageSize = 15,
}) => {
  const params = { page, page_size: pageSize };
  if (status !== "all") {
    if (status === "draft") params.status = "draft";
    else if (status === "assigned_to_maker")
      params.status = "assigned_to_maker";
    else if (status === "maker_submitted") params.status = "maker_submitted";
    else if (status === "resubmission_required")
      params.status = "resubmission_required";
    else if (status === "closed") params.status = "closed";
  }

  const res = await apiGetNCRList(params);
  const isArray = Array.isArray(res.data);
  return {
    data: isArray ? res.data : res.data.results || [],
    total: isArray ? res.data.length : res.data.count || 0,
    page,
    pageSize,
  };
};

export const getNCRDetail = async (id) => {
  const res = await apiGetNCRDetail(id);
  return res.data;
};

export const submitMakerResponse = async (id, formData) => {
  const res = await apiSubmitMakerResponse(id, formData);
  return res.data;
};

export const getMyPending = async ({
  role = "maker",
  page = 1,
  pageSize = 15,
}) => {
  const res = await apiGetMyPending({ role, page, page_size: pageSize });
  const isArray = Array.isArray(res.data);
  return {
    data: isArray ? res.data : res.data.results || [],
    total: isArray ? res.data.length : res.data.count || 0,
    page,
    pageSize,
  };
};

export const createNCR = async (formData) => {
  const res = await apiCreateNCR(formData);
  return res.data;
};

export const checkerVerifyNCR = async (id, formData) => {
  const res = await apiCheckerVerifyNCR(id, formData);
  return res.data;
};

export const downloadNCRClosedReport = async (id) => {
  return apiDownloadNCRClosedReport(id);
};

export const getProjectHeadPendingNCRs = async (params) => {
  const res = await apiGetProjectHeadPendingNCRs(params);
  const isArray = Array.isArray(res.data);
  return {
    data: isArray ? res.data : res.data.results || [],
    total: isArray ? res.data.length : res.data.count || 0,
    page: params.page || 1,
    pageSize: params.page_size || 15,
  };
};

export const projectHeadSignNCR = async (id, formData) => {
  const res = await apiProjectHeadSignNCR(id, formData);
  return res.data;
};
