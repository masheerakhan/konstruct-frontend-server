import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../ThemeContext";
import projectImage from "../Images/Project.png";
import axios from "axios";
import {
  Allprojects,
  getProjectsByOwnership,
  getProjectUserDetails,
} from "../api";
import toast from "react-hot-toast";

// --- Helper for JWT decode ---
function decodeJWT(token) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    return null;
  }
}

const API_BASE = "https://konstruct.world";

const getRoleStorageKey = (projectId) => `ACTIVE_ROLE_${projectId}`;

const normalizeRole = (role) => {
  const value = String(role || "").trim().toUpperCase();
  if (!value) return "";
  if (value === "INITIALIZER") return "INTIALIZER";
  return value;
};

const formatRoleLabel = (role) => {
  const value = normalizeRole(role);
  if (value === "INTIALIZER") return "Intializer";
  if (value === "MAKER") return "Maker";
  if (value === "CHECKER") return "Checker";
  if (value === "SUPERVISOR") return "Supervisor";
  if (value === "MANAGER") return "Manager";
  if (value === "CLIENT") return "Client";
  if (value === "ENGINEER") return "Engineer";
  if (value === "QUALITY_ENGINEER" || value === "QUALITY ENGINEER") return "Quality Engineer";
  if (value === "PROJECT_HEAD" || value === "PROJECT HEAD") return "Project Head";
  if (value === "PROJECT_MANAGER" || value === "PROJECT MANAGER") return "Project Manager";
  return role;
};

const getUniqueRolesFromAccesses = (accesses = []) => {
  const seen = new Set();
  const roles = [];

  accesses.forEach((access) => {
    (access.roles || []).forEach((item) => {
      const roleName = normalizeRole(
        typeof item === "string" ? item : item?.role
      );
      if (roleName && !seen.has(roleName)) {
        seen.add(roleName);
        roles.push(roleName);
      }
    });
  });

  return roles;
};

const Configuration = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nameCache, setNameCache] = useState({});
  const [projectRoles, setProjectRoles] = useState({});
  const [rolesLoading, setRolesLoading] = useState({});

  // THEME palette
  const ORANGE = "#ffbe63";
  const GREEN = "#16a34a";
  const GREEN_DARK = "#15803d";
  const BG_OFFWHITE = "#fcfaf7";
  const bgColor = theme === "dark" ? "#191922" : BG_OFFWHITE;
  const cardColor = theme === "dark" ? "#23232c" : "#fff";
  const borderColor = ORANGE;
  const textColor = theme === "dark" ? "#fff" : "#222";

  const authHeaders = () => {
    const token =
      localStorage.getItem("ACCESS_TOKEN") ||
      localStorage.getItem("TOKEN") ||
      localStorage.getItem("token") ||
      "";

    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const getCurrentUserData = () => {
    try {
      const userDataStr = localStorage.getItem("USER_DATA");
      if (userDataStr) {
        return JSON.parse(userDataStr);
      }

      const token =
        localStorage.getItem("ACCESS_TOKEN") ||
        localStorage.getItem("TOKEN") ||
        localStorage.getItem("token");

      if (token) {
        return decodeJWT(token);
      }
    } catch (error) {
      console.error("Failed to parse current user data", error);
    }
    return null;
  };

  const currentUser = useMemo(() => getCurrentUserData(), []);
  const currentUserId = currentUser?.id || currentUser?.user_id || currentUser?.user;

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);

      let userData = null;
      try {
        const userDataStr = localStorage.getItem("USER_DATA");
        if (userDataStr) {
          userData = JSON.parse(userDataStr);
        } else {
          const token =
            localStorage.getItem("ACCESS_TOKEN") ||
            localStorage.getItem("TOKEN") ||
            localStorage.getItem("token");
          if (token) userData = decodeJWT(token);
        }
      } catch {}

      const rolee =
        localStorage.getItem("ROLE") ||
        userData?.role ||
        userData?.roles?.[0] ||
        "";

      const isManager = userData?.is_manager;

      try {
        let response = null;

        if (rolee === "Super Admin" || rolee === "SUPERADMIN") {
          response = await Allprojects();
        } else if (rolee === "Admin") {
          response = await getProjectUserDetails();
        } else if (isManager) {
          if (userData?.entity_id) {
            response = await getProjectsByOwnership({
              entity_id: userData.entity_id,
            });
          } else if (userData?.company_id) {
            response = await getProjectsByOwnership({
              company_id: userData.company_id,
            });
          } else if (userData?.org || userData?.organization_id) {
            const orgId = userData.org || userData.organization_id;
            response = await getProjectsByOwnership({
              organization_id: orgId,
            });
          } else {
            toast.error(
              "No entity, company, or organization found for this manager."
            );
            setProjects([]);
            setLoading(false);
            return;
          }
        }

        if (response && response.status === 200) {
          const rows = Array.isArray(response.data)
            ? response.data
            : response.data.results || [];

          setProjects(rows);
        } else if (response) {
          toast.error(response.data?.message || "Failed to fetch projects.");
          setProjects([]);
        } else {
          const token =
            localStorage.getItem("ACCESS_TOKEN") ||
            localStorage.getItem("TOKEN") ||
            localStorage.getItem("token");

          if (token) {
            const data = decodeJWT(token);
            if (data && Array.isArray(data.accesses)) {
              const uniqueProjects = [];
              const seenIds = new Set();

              data.accesses.forEach((access) => {
                if (access.project_id && !seenIds.has(access.project_id)) {
                  uniqueProjects.push({
                    id: access.project_id,
                    name: access.project_name,
                    project_name: access.project_name,
                    image: access.project_image || null,
                  });
                  seenIds.add(access.project_id);
                }
              });

              setProjects(uniqueProjects);
            } else {
              setProjects([]);
            }
          } else {
            setProjects([]);
          }
        }
      } catch (error) {
        toast.error(error?.response?.data?.message || "Error fetching projects.");
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const fetchProjectRoles = async (projectId) => {
    if (!currentUserId || !projectId) return;

    setRolesLoading((prev) => ({ ...prev, [projectId]: true }));

    try {
      const res = await axios.get(
        `${API_BASE}/users/accesses/?user_id=${currentUserId}&project_id=${projectId}`,
        {
          headers: authHeaders(),
        }
      );

      const accesses = Array.isArray(res.data) ? res.data : [];
      const uniqueRoles = getUniqueRolesFromAccesses(accesses);

      const savedRole = normalizeRole(
        localStorage.getItem(getRoleStorageKey(projectId))
      );

      const activeRole = uniqueRoles.includes(savedRole)
        ? savedRole
        : uniqueRoles[0] || "";

      if (activeRole) {
        localStorage.setItem(getRoleStorageKey(projectId), activeRole);
      } else {
        localStorage.removeItem(getRoleStorageKey(projectId));
      }

      setProjectRoles((prev) => ({
        ...prev,
        [projectId]: {
          accesses,
          roles: uniqueRoles,
          activeRole,
        },
      }));
    } catch (error) {
      console.error(`Failed to fetch roles for project ${projectId}`, error);

      setProjectRoles((prev) => ({
        ...prev,
        [projectId]: {
          accesses: [],
          roles: [],
          activeRole: "",
        },
      }));
    } finally {
      setRolesLoading((prev) => ({ ...prev, [projectId]: false }));
    }
  };

  useEffect(() => {
    if (!projects.length || !currentUserId) return;

    projects.forEach((project) => {
      fetchProjectRoles(project.id);
    });
  }, [projects, currentUserId]);

  // Fallback: fetch project name by id if missing
  const getProjectName = (project) => {
    if (project?.name) return project.name;
    if (project?.project_name) return project.project_name;
    if (nameCache[project.id]) return nameCache[project.id];

    if (!nameCache[project.id]) {
      axios
        .get(`${API_BASE}/projects/projects/${project.id}/`, {
          headers: authHeaders(),
        })
        .then((res) => {
          if (res.data?.name) {
            setNameCache((prev) => ({
              ...prev,
              [project.id]: res.data.name,
            }));
          } else {
            setNameCache((prev) => ({
              ...prev,
              [project.id]: `Project ${project.id}`,
            }));
          }
        })
        .catch(() => {
          setNameCache((prev) => ({
            ...prev,
            [project.id]: `Project ${project.id}`,
          }));
        });
    }

    return `Project ${project.id}`;
  };

  const handleRoleActivate = (e, projectId, role) => {
    e.stopPropagation();

    const normalizedRole = normalizeRole(role);
    if (!normalizedRole) return;

    localStorage.setItem(getRoleStorageKey(projectId), normalizedRole);

    setProjectRoles((prev) => ({
      ...prev,
      [projectId]: {
        ...(prev[projectId] || {}),
        activeRole: normalizedRole,
        roles: prev[projectId]?.roles || [],
        accesses: prev[projectId]?.accesses || [],
      },
    }));

    toast.success(`${formatRoleLabel(normalizedRole)} role activated`);
  };

  // const handleProjectClick = (project) => {
  //   const activeRole =
  //     normalizeRole(projectRoles[project.id]?.activeRole) ||
  //     normalizeRole(localStorage.getItem(getRoleStorageKey(project.id))) ||
  //     "";

  //   if (activeRole) {
  //     localStorage.setItem("FLOW_ROLE", activeRole);
  //     localStorage.setItem(getRoleStorageKey(project.id), activeRole);
  //   }

  //   localStorage.setItem("ACTIVE_PROJECT_ID", String(project.id));

  //   navigate(`/project/${project.id}`, {
  //     state: {
  //       project,
  //       activeRole,
  //     },
  //   });
  // };
  const handleProjectClick = (project) => {
  const activeRole =
    normalizeRole(projectRoles[project.id]?.activeRole) ||
    normalizeRole(localStorage.getItem(getRoleStorageKey(project.id))) ||
    "";

  if (activeRole) {
    localStorage.setItem("FLOW_ROLE", activeRole);
    localStorage.setItem(getRoleStorageKey(project.id), activeRole);
  }

  localStorage.setItem("ACTIVE_PROJECT_ID", String(project.id));

  const normalized = String(activeRole || "").toUpperCase();

  const isProjectHeadOrManager =
    normalized === "PROJECT_HEAD" ||
    normalized === "PROJECT HEAD" ||
    normalized === "PROJECT_MANAGER" ||
    normalized === "PROJECT MANAGER";

  if (isProjectHeadOrManager) {
    navigate(`/overview/project/${project.id}`, {
      state: {
        project,
        activeRole,
      },
    });
    return;
  }

  navigate(`/project/${project.id}`, {
    state: {
      project,
      activeRole,
    },
  });
};

  return (
    <div
      className="flex min-h-screen transition-colors duration-300"
      style={{ backgroundColor: bgColor }}
    >
      <div className="my-8 mx-auto max-w-7xl pt-8 px-6 pb-10 w-full">
        <div
          className="relative rounded-3xl transition-all duration-300 hover:shadow-2xl"
          style={{
            backgroundColor: cardColor,
            border: `2px solid ${borderColor}`,
            boxShadow:
              theme === "dark"
                ? `0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 8px 32px rgba(255, 190, 99, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)`
                : `0 25px 50px -12px rgba(0, 0, 0, 0.1), 0 8px 32px rgba(255, 190, 99, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.8)`,
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
          }}
        >
          {/* Decorative Background Elements */}
          <div
            className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-10 blur-3xl"
            style={{ backgroundColor: borderColor }}
          />
          <div
            className="absolute bottom-0 left-0 w-32 h-32 rounded-full opacity-10 blur-2xl"
            style={{ backgroundColor: borderColor }}
          />

          {/* Header Section */}
          <div className="relative z-10 text-center mb-12 pt-4">
            <div
              className="w-24 h-1 mx-auto mb-8 rounded-full"
              style={{ backgroundColor: borderColor }}
            />
            <h2
              className="text-5xl font-bold mb-4 tracking-tight relative inline-block"
              style={{
                color: textColor,
                textShadow:
                  theme === "dark"
                    ? `0 2px 8px rgba(255, 190, 99, 0.3)`
                    : `0 2px 8px rgba(0, 0, 0, 0.1)`,
              }}
            >
              Projects
            </h2>
            <p
              className="text-lg font-medium opacity-80"
              style={{ color: textColor }}
            >
              Manage and explore your project portfolio
            </p>
          </div>

          {/* Content Section */}
          <div className="relative z-10 px-4">
            {loading ? (
              <div className="flex flex-col justify-center items-center py-20">
                <div className="relative mb-6">
                  <div
                    className="w-16 h-16 rounded-full border-4 border-opacity-20 animate-spin"
                    style={{
                      borderColor: borderColor,
                      borderTopColor: borderColor,
                    }}
                  />
                  <div
                    className="absolute top-2 left-2 w-12 h-12 rounded-full border-4 border-transparent animate-pulse"
                    style={{
                      borderTopColor: borderColor,
                      animationDuration: "1.5s",
                    }}
                  />
                </div>
                <p
                  className="text-xl font-semibold animate-pulse"
                  style={{ color: textColor }}
                >
                  Loading projects...
                </p>
              </div>
            ) : projects.length === 0 ? (
              <div className="text-center py-20">
                <div
                  className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center"
                  style={{
                    backgroundColor:
                      theme === "dark" ? "#ffffff10" : "#00000005",
                    border: `2px dashed ${borderColor}60`,
                  }}
                >
                  <svg
                    width="40"
                    height="40"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={borderColor}
                    strokeWidth="1.5"
                  >
                    <path d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                </div>
                <h3
                  className="text-2xl font-bold mb-3"
                  style={{ color: textColor }}
                >
                  No Projects Available
                </h3>
                <p className="text-lg opacity-70" style={{ color: textColor }}>
                  No projects have been assigned to your account yet
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8 pb-4">
                {projects.map((project, index) => {
                  const roles = projectRoles[project.id]?.roles || [];
                  const activeRole = projectRoles[project.id]?.activeRole || "";
                  const badgeLoading = !!rolesLoading[project.id];

                  return (
                    <div
                      key={project.id}
                      className="group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-500 hover:scale-105 hover:-translate-y-3 transform-gpu"
                      style={{
                        backgroundColor: cardColor,
                        border: `2px solid ${
                          theme === "dark" ? "#ffffff15" : "#00000010"
                        }`,
                        boxShadow:
                          theme === "dark"
                            ? `0 10px 30px rgba(0, 0, 0, 0.3), 0 4px 16px rgba(255, 190, 99, 0.1)`
                            : `0 10px 30px rgba(0, 0, 0, 0.1), 0 4px 16px rgba(255, 190, 99, 0.15)`,
                        animationDelay: `${index * 0.1}s`,
                        width: "100%",
                        maxWidth: "280px",
                        margin: "0 auto",
                      }}
                      onClick={() => handleProjectClick(project)}
                    >
                      {/* Role Badges */}
                      <div className="absolute top-3 left-3 z-20 flex gap-2 flex-wrap max-w-[calc(100%-24px)]">
                        {badgeLoading ? (
                          <span
                            className="px-3 py-1 rounded-full text-xs font-bold shadow-lg"
                            style={{
                              backgroundColor: borderColor,
                              color: theme === "dark" ? "#1a1a1a" : "#ffffff",
                              boxShadow: `0 2px 8px rgba(255, 190, 99, 0.4)`,
                              opacity: 0.8,
                            }}
                          >
                            Loading...
                          </span>
                        ) : roles.length > 0 ? (
                          roles.map((role) => {
                            const isActive = normalizeRole(activeRole) === normalizeRole(role);

                            return (
                              <button
                                key={role}
                                type="button"
                                onClick={(e) =>
                                  handleRoleActivate(e, project.id, role)
                                }
                                className="px-3 py-1 rounded-full text-xs font-bold shadow-lg transition-all duration-300 group-hover:scale-105"
                                style={{
                                  backgroundColor: isActive ? GREEN : borderColor,
                                  color: "#ffffff",
                                  boxShadow: isActive
                                    ? "0 2px 10px rgba(22, 163, 74, 0.45)"
                                    : `0 2px 8px rgba(255, 190, 99, 0.4)`,
                                  border: isActive
                                    ? `2px solid ${GREEN_DARK}`
                                    : "2px solid transparent",
                                }}
                              >
                                {formatRoleLabel(role)}
                              </button>
                            );
                          })
                        ) : null}
                      </div>

                      {/* Image */}
                      <div className="relative overflow-hidden">
                        <img
                          src={project.image || projectImage}
                          alt={getProjectName(project)}
                          className="w-full h-80 object-cover transition-transform duration-700 group-hover:scale-110"
                          onError={(e) => {
                            e.target.src = projectImage;
                          }}
                        />

                        <div
                          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                          style={{
                            background:
                              theme === "dark"
                                ? "linear-gradient(to top, rgba(0,0,0,0.6), rgba(0,0,0,0.1))"
                                : "linear-gradient(to top, rgba(0,0,0,0.35), rgba(0,0,0,0.05))",
                          }}
                        />
                      </div>

                      {/* Project Name */}
                      <div
                        className="absolute bottom-0 left-0 right-0 p-4 z-10"
                        style={{
                          background:
                            theme === "dark"
                              ? "linear-gradient(to top, rgba(0,0,0,0.85), rgba(0,0,0,0.2), transparent)"
                              : "linear-gradient(to top, rgba(0,0,0,0.65), rgba(0,0,0,0.15), transparent)",
                        }}
                      >
                        <div className="flex items-end justify-between gap-2">
                          <div>
                            <h3 className="text-white text-lg font-bold leading-tight">
                              {getProjectName(project)}
                            </h3>
                            {activeRole ? (
                              <p className="text-white text-xs opacity-90 mt-1">
                                Active Role: {formatRoleLabel(activeRole)}
                              </p>
                            ) : null}
                          </div>

                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:translate-x-1"
                            style={{
                              backgroundColor:
                                theme === "dark"
                                  ? "rgba(255,255,255,0.15)"
                                  : "rgba(255,255,255,0.2)",
                              backdropFilter: "blur(10px)",
                              WebkitBackdropFilter: "blur(10px)",
                            }}
                          >
                            <svg
                              width="18"
                              height="18"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="#fff"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M5 12h14" />
                              <path d="m12 5 7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      </div>

                      {/* Decorative border glow */}
                      <div
                        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                        style={{
                          boxShadow: `inset 0 0 0 2px ${borderColor}40, 0 0 30px ${borderColor}20`,
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Configuration;