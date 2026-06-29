// src/services/axiosInstance.js (or wherever you keep it)
import axios from "axios";

/* ---------------- LOGOUT guard ---------------- */
let isLoggingOut = false;

export const setLoggingOut = (v) => {
  isLoggingOut = !!v;
  if (isLoggingOut) localStorage.setItem("__LOGGING_OUT__", "1");
  else localStorage.removeItem("__LOGGING_OUT__");
};

const loggingOutFlag = () =>
  isLoggingOut || localStorage.getItem("__LOGGING_OUT__") === "1";

/* ---------------- BASE URLS ---------------- */
const API = {
  users: "https://konstruct.world/users/",
  projects: "https://konstruct.world/projects/",
  organizations: "https://konstruct.world/organizations/",
  checklists: "https://konstruct.world/checklists/",
  qhse: "https://konstruct.world/qhse/",
};

/* ---------------- TOKEN helpers ---------------- */
const getAccessToken = () =>
  localStorage.getItem("ACCESS_TOKEN") ||
  localStorage.getItem("access") ||
  localStorage.getItem("accessToken") ||
  "";

const getRefreshToken = () =>
  localStorage.getItem("REFRESH_TOKEN") ||
  localStorage.getItem("refresh") ||
  localStorage.getItem("refreshToken") ||
  "";

const setTokens = (access, refresh) => {
  if (access) localStorage.setItem("ACCESS_TOKEN", access);
  if (refresh) localStorage.setItem("REFRESH_TOKEN", refresh);
};

const clearTokens = () => {
  localStorage.removeItem("ACCESS_TOKEN");
  localStorage.removeItem("REFRESH_TOKEN");
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
};

const makeCanceledError = (message) => {
  const err = new Error(message || "Request canceled");
  err.code = "ERR_CANCELED";
  err.__CANCEL__ = true;
  return err;
};

export const qhseInstance = axios.create({
  baseURL: API.qhse,
  timeout: 45000,
});
/* ---------------- refresh single-flight (IMPORTANT) ---------------- */
let refreshPromise = null;

const refreshToken = async () => {
  const refresh = getRefreshToken();
  if (!refresh) return null;

  try {
    const { data } = await axios.post(
      `${API.users}token/refresh/`,
      { refresh },
      { headers: { "Content-Type": "application/json" } }
    );

    const newAccess = data?.access || null;
    const newRefresh = data?.refresh || null;

    if (newAccess) setTokens(newAccess, newRefresh || refresh);
    return newAccess;
  } catch (e) {
    clearTokens();
    return null;
  }
};

const getFreshAccessToken = async () => {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const t = await refreshToken();
      return t;
    })().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
};

/* ---------------- axios instances ---------------- */
const axiosInstance = axios.create({
  baseURL: API.users,
  timeout: 45000,
});

export const projectInstance = axios.create({
  baseURL: API.projects,
  timeout: 45000,
});

export const organnizationInstance = axios.create({
  baseURL: API.organizations,
  timeout: 45000,
});

export const checklistInstance = axios.create({
  baseURL: API.checklists,
  timeout: 45000,
});

export const NEWchecklistInstance = axios.create({
  baseURL: API.checklists,
  timeout: 45000,
});

/* ---------------- attach interceptors ONLY ONCE ---------------- */
const attachTokenInterceptor = (instance) => {
  // ✅ THIS stops Vite HMR / multiple imports from stacking interceptors
  if (instance.__KONSTRUCT_INTERCEPTORS_ATTACHED__) return;
  instance.__KONSTRUCT_INTERCEPTORS_ATTACHED__ = true;

  // request
  instance.interceptors.request.use(
    (config) => {
      if (loggingOutFlag()) {
        return Promise.reject(makeCanceledError("Request aborted: logging out"));
      }

      const token = getAccessToken();
      config.headers = config.headers || {};
      config.headers.Accept = "application/json";

      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    },
    (error) => Promise.reject(error)
  );

  // response
  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      // ✅ do not hang forever (your old code did new Promise(()=>{}))
      if (
        error?.code === "ERR_CANCELED" ||
        error?.__CANCEL__ ||
        axios.isCancel?.(error)
      ) {
        return Promise.reject(error);
      }

      const status = error?.response?.status;
      const originalRequest = error?.config || {};
      const url = String(originalRequest?.url || "");

      const isRefreshCall =
        url.includes("token/refresh") || url.includes("/token/refresh/");

      // ✅ 401 -> try refresh ONCE only
      if (
        status === 401 &&
        !originalRequest.__retried &&
        !isRefreshCall &&
        !loggingOutFlag()
      ) {
        originalRequest.__retried = true;

        const newAccess = await getFreshAccessToken();
        if (newAccess) {
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${newAccess}`;
          return instance(originalRequest);
        }
      }

      // still 401 -> clear tokens
      if (status === 401 && !isRefreshCall) {
        clearTokens();
      }

      return Promise.reject(error);
    }
  );
};

attachTokenInterceptor(axiosInstance);
attachTokenInterceptor(projectInstance);
attachTokenInterceptor(organnizationInstance);
attachTokenInterceptor(checklistInstance);
attachTokenInterceptor(NEWchecklistInstance);
attachTokenInterceptor(qhseInstance);

export default axiosInstance;
