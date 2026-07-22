import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { mobileTokenLogin } from "../../api";

const getSafeRedirect = (redirectUrl) => {
  if (!redirectUrl) return "/config";

  // allow only internal React routes
  if (!redirectUrl.startsWith("/")) return "/config";

  // block protocol-relative URLs like //evil.com
  if (redirectUrl.startsWith("//")) return "/config";

  return redirectUrl;
};

const decodeJwtPayload = (token) => {
  try {
    if (!token || typeof token !== "string") return null;

    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");

    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((char) => `%${`00${char.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join("")
    );

    return JSON.parse(json);
  } catch {
    return null;
  }
};

const getFirstProjectId = (userData) => {
  const accesses = Array.isArray(userData?.accesses) ? userData.accesses : [];

  const activeAccess =
    accesses.find((item) => item?.active && item?.project_id) ||
    accesses.find((item) => item?.project_id);

  return activeAccess?.project_id || "";
};

const getFirstRole = (userData) => {
  const roles = Array.isArray(userData?.roles) ? userData.roles : [];
  return roles[0] || "";
};

const getStoredUserData = () => {
  try {
    const raw = localStorage.getItem("USER_DATA");

    if (!raw || raw === "undefined" || raw === "null") {
      return null;
    }

    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const persistMobileLoginSession = ({ access, refresh, userData }) => {
  if (!access) return false;

  const decodedUserData = decodeJwtPayload(access) || {};
  const finalUserData = {
    ...decodedUserData,
    ...(userData || {}),
  };

  // Token keys used across your existing app
  localStorage.setItem("ACCESS_TOKEN", access);
  localStorage.setItem("access", access);
  localStorage.setItem("access_token", access);
  localStorage.setItem("accessToken", access);
  localStorage.setItem("token", access);

  if (refresh) {
    localStorage.setItem("REFRESH_TOKEN", refresh);
    localStorage.setItem("refresh", refresh);
    localStorage.setItem("refresh_token", refresh);
    localStorage.setItem("refreshToken", refresh);
  }

  // User keys used by Safety pages
  localStorage.setItem("USER_DATA", JSON.stringify(finalUserData));
  localStorage.setItem("user", JSON.stringify(finalUserData));
  localStorage.setItem("currentUser", JSON.stringify(finalUserData));
  localStorage.setItem("userData", JSON.stringify(finalUserData));

  const userId =
    finalUserData?.user_id ||
    finalUserData?.id ||
    "";

  if (userId) {
    localStorage.setItem("USER_ID", String(userId));
    localStorage.setItem("user_id", String(userId));
  }

  const orgId =
    finalUserData?.org ||
    finalUserData?.org_id ||
    finalUserData?.organization_id ||
    "";

  if (orgId) {
    localStorage.setItem("ORG_ID", String(orgId));
    localStorage.setItem("org_id", String(orgId));
    localStorage.setItem("organization_id", String(orgId));
  }

  const projectId =
    getFirstProjectId(finalUserData) ||
    finalUserData?.project_id ||
    "";

  if (projectId) {
    localStorage.setItem("ACTIVE_PROJECT_ID", String(projectId));
    localStorage.setItem("PROJECT_ID", String(projectId));
    localStorage.setItem("project_id", String(projectId));
    localStorage.setItem("active_project_id", String(projectId));
  }

  const role = getFirstRole(finalUserData);

  if (role) {
    localStorage.setItem("ROLE", String(role));
    localStorage.setItem("FLOW_ROLE", String(role));
  }

  return true;
};

const hasUsableSession = () => {
  const access =
    localStorage.getItem("ACCESS_TOKEN") ||
    localStorage.getItem("access") ||
    localStorage.getItem("access_token") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("token");

  const userData = getStoredUserData();

  return Boolean(access && (userData?.user_id || userData?.id));
};

const MobileLogin = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const oneTimeToken = searchParams.get("token");
    const redirectTo = getSafeRedirect(searchParams.get("redirect"));

    // Important:
    // Do not redirect only because token exists.
    // Safety pages need USER_DATA also.
    if (hasUsableSession()) {
      window.history.replaceState({}, document.title, "/mobile-login");
      navigate(redirectTo, { replace: true });
      return;
    }

    if (!oneTimeToken) {
      setError("Mobile login token is missing.");
      setLoading(false);
      return;
    }

    const doMobileLogin = async () => {
      try {
        const response = await mobileTokenLogin(oneTimeToken);
        const data = response?.data || {};

        if (!data.access) {
          setError("Mobile login failed. Access token missing.");
          setLoading(false);
          return;
        }

        const saved = persistMobileLoginSession({
          access: data.access,
          refresh: data.refresh,
          userData: data.user_data || data.user || data.profile || null,
        });

        if (!saved) {
          setError("Mobile login failed. Could not save session.");
          setLoading(false);
          return;
        }

        // Remove one-time token from URL history
        window.history.replaceState({}, document.title, "/mobile-login");

        // Small delay ensures localStorage is written before route mounts
        setTimeout(() => {
          navigate(redirectTo, { replace: true });
        }, 100);
      } catch (err) {
        console.error("Mobile login failed:", err);

        setError(
          err?.response?.data?.detail ||
          err?.response?.data?.message ||
          err?.response?.data?.token?.[0] ||
          "Mobile login failed. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    doMobileLogin();
  }, [searchParams, navigate]);

  if (loading) {
    return (
      <div style={styles.wrapper}>
        <div style={styles.card}>
          <h3 style={styles.title}>Logging you in...</h3>
          <p style={styles.text}>Please wait while we open your workspace.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.wrapper}>
        <div style={styles.card}>
          <h3 style={styles.title}>Login Failed</h3>
          <p style={styles.error}>{error}</p>
        </div>
      </div>
    );
  }

  return null;
};

const styles = {
  wrapper: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    background: "#fcfaf7",
  },
  card: {
    width: "100%",
    maxWidth: 420,
    padding: 24,
    borderRadius: 12,
    background: "#ffffff",
    boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
    textAlign: "center",
  },
  title: {
    margin: "0 0 8px",
    fontSize: 22,
    fontWeight: 700,
  },
  text: {
    margin: 0,
    fontSize: 14,
    color: "#555",
  },
  error: {
    margin: 0,
    fontSize: 14,
    color: "#c62828",
  },
};

export default MobileLogin;