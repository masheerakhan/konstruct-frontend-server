import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { mobileTokenLogin } from "../../api";

// adjust path if your API file path is different

const getSafeRedirect = (redirectUrl) => {
  if (!redirectUrl) return "/config";

  // allow only internal React routes
  if (!redirectUrl.startsWith("/")) return "/config";

  // block protocol-relative URLs like //evil.com
  if (redirectUrl.startsWith("//")) return "/config";

  return redirectUrl;
};

const MobileLogin = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const oneTimeToken = searchParams.get("token");
    const redirectTo = getSafeRedirect(searchParams.get("redirect"));

    const existingAccessToken =
      localStorage.getItem("ACCESS_TOKEN") ||
      localStorage.getItem("access") ||
      localStorage.getItem("accessToken");

    // If React WebView already logged in, just redirect.
    if (existingAccessToken) {
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

        if (response.data.access) {
          localStorage.setItem("ACCESS_TOKEN", response.data.access);
        }
        if (response.data.refresh) {
          localStorage.setItem("REFRESH_TOKEN", response.data.refresh);
        }

        // Remove token from URL history
        window.history.replaceState({}, document.title, "/mobile-login");

        navigate(redirectTo, { replace: true });
      } catch (err) {
        console.error("Mobile login failed:", err);

        setError(
          err?.response?.data?.detail ||
            err?.response?.data?.message ||
            "Mobile login failed. Please try again.",
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
