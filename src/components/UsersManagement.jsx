import React, { useEffect, useMemo, useState, useRef } from "react";
import axiosInstance from "../api/axiosInstance";
import { useTheme } from "../ThemeContext";
import { toast } from "react-toastify";
import axios from "axios";
// import {
//   getPurposeByProjectId,
//   getCategoriesSimpleByProject,
//   getPhaseByPurposeId,
//   createUserAccessRole,
// } from "../api/index.js";
import {
  getPurposeByProjectId,
  getCategoriesSimpleByProject,
  getPhaseByPurposeId,
  createUserAccess,
  createRoleForUserAccess,
} from "../api/index.js";

// --- Helper for JWT decode ---
function decodeJWT(token) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

// Keep same spelling as backend choices
const ROLE_OPTIONS = [
  "Intializer",
  "SUPERVISOR",
  "CHECKER",
  "STAFF",
  "MAKER",
  "SECURITY_GUARD",
  "MANAGER",
  "PROJECT_MANAGER",
  "PROJECT_HEAD",
  "ENGINEER",
  "QUALITY ENGINEER",
];

function UsersManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter and search state
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [expandedRows, setExpandedRows] = useState({});

  const [phasesByPurposeCache, setPhasesByPurposeCache] = useState({});
  const [stagesByProjectCache, setStagesByProjectCache] = useState({});
  const [purposesByProjectCache, setPurposesByProjectCache] = useState({});
  const fetchedProjectsRef = useRef(new Set());

  const [isAdmin, setIsAdmin] = useState(false);
  const [adminProjects, setAdminProjects] = useState([]);
  const [adminProjectsLoading, setAdminProjectsLoading] = useState(false);
  const [buildingsByProjectCache, setBuildingsByProjectCache] = useState({});
  // const [selectedBuildingId, setSelectedBuildingId] = useState("");
    const [availableGroups, setAvailableGroups] = useState([]);
const [selectedBuildingIds, setSelectedBuildingIds] = useState([]);

  const { theme } = useTheme(); 

  const palette =
    theme === "dark"
      ? {
          card: "bg-slate-800 border-slate-700 text-slate-100",
          border: "border-slate-700",
          text: "text-slate-100",
          subtext: "text-slate-300",
          shadow: "shadow-xl",
          input:
            "bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-400",
        }
      : {
          card: "bg-white border-gray-200 text-gray-900",
          border: "border-gray-200",
          text: "text-gray-900",
          subtext: "text-gray-600",
          shadow: "shadow",
          input:
            "bg-white border-gray-300 text-gray-900 placeholder:text-gray-400",
        };

  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  // Edit Modal state
  const [editOpen, setEditOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editErr, setEditErr] = useState("");
  const [editForm, setEditForm] = useState({
    user_type: "INTERNAL",
    contractor_name: "",
    username: "",
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    new_password: "",
    confirm_password: "",
  });

  // Access/Roles Modal state
  const [accessOpen, setAccessOpen] = useState(false);
  const [accessUser, setAccessUser] = useState(null);
  const [selectedAccessId, setSelectedAccessId] = useState(null);

  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedAccessIds, setSelectedAccessIds] = useState([]);

  // Selection state
  const [selectedPurposeId, setSelectedPurposeId] = useState("");
  const [selectedPhaseId, setSelectedPhaseId] = useState("");
  const [selectedStageIds, setSelectedStageIds] = useState([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const [selectedRole, setSelectedRole] = useState("");

  const [accessActiveDraft, setAccessActiveDraft] = useState(true);
  const [accessSaving, setAccessSaving] = useState(false);
  const [accessErr, setAccessErr] = useState("");
  const [deleteAccessLoadingId, setDeleteAccessLoadingId] = useState(null);
  const [userToggleSaving, setUserToggleSaving] = useState(false);

  const [projectNameCache, setProjectNameCache] = useState({});
  const [stageNameCache, setStageNameCache] = useState({});
  const [categories, setCategories] = useState([]);
  const [safetyOfficerDraft, setSafetyOfficerDraft] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.get("/users-by-creator/");
      const nextUsers = Array.isArray(res.data) ? res.data : [];
      setUsers(nextUsers);
      return nextUsers;
    } catch (err) {
      setError("Failed to load users");
      setUsers([]);
      return [];
    } finally {
      setLoading(false);
    }
  };

   const fetchGroups = async () => {
     try {
       const res = await axiosInstance.get("/user-groups/");
       const data = res.data?.results ? res.data.results : res.data;
       setAvailableGroups(data || []);
     } catch (err) {
       console.error("Failed to load user groups", err);
     }
   };

  useEffect(() => {
    fetchUsers();
    fetchGroups();
  }, []);

  const storedUserData = useMemo(() => {
    try {
      const raw = localStorage.getItem("USER_DATA");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  // useEffect(() => {
  //   let userData = storedUserData;
  //   try {
  //     const s = localStorage.getItem("USER_DATA");
  //     if (s) userData = JSON.parse(s);
  //   } catch {}

  //   if (!userData) {
  //     const token =
  //       localStorage.getItem("ACCESS_TOKEN") ||
  //       localStorage.getItem("TOKEN") ||
  //       localStorage.getItem("token");
  //     if (token) userData = decodeJWT(token);
  //   }

  //   const rolee =
  //     localStorage.getItem("ROLE") ||
  //     userData?.role ||
  //     userData?.roles?.[0] ||
  //     "";

  //   const isSA =
  //     (typeof rolee === "string" &&
  //       rolee.toLowerCase().includes("super admin")) ||
  //     userData?.superadmin === true ||
  //     userData?.is_superadmin === true ||
  //     userData?.is_staff === true;

  //   setIsSuperAdmin(!!isSA);
  // }, [storedUserData]);

  useEffect(() => {
    let userData = storedUserData;

    try {
      const s = localStorage.getItem("USER_DATA");
      if (s) userData = JSON.parse(s);
    } catch {}

    if (!userData) {
      const token =
        localStorage.getItem("ACCESS_TOKEN") ||
        localStorage.getItem("TOKEN") ||
        localStorage.getItem("token");

      if (token) userData = decodeJWT(token);
    }

    const rolee =
      localStorage.getItem("ROLE") ||
      userData?.role ||
      userData?.roles?.[0] ||
      "";

    const roleText = String(rolee || "").toLowerCase();

    const superAdminFlag =
      roleText.includes("super admin") ||
      userData?.superadmin === true ||
      userData?.is_superadmin === true;

    const adminFlag =
      roleText === "admin" ||
      roleText.includes("admin") ||
      userData?.is_staff === true;

    setIsSuperAdmin(!!superAdminFlag);
    setIsAdmin(!!adminFlag);
  }, [storedUserData]);

  const showAccessRoles = !isSuperAdmin;

  const allowedAccesses = useMemo(() => {
    return Array.isArray(storedUserData?.accesses)
      ? storedUserData.accesses
      : [];
  }, [storedUserData]);

  const allowedProjects = useMemo(() => {
    const seen = new Set();

    return allowedAccesses
      .filter((a) => a?.project_id)
      .filter((a) => {
        const key = String(a.project_id);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map((a) => ({
        id: a.project_id,
        name:
          a.project_name ||
          projectNameCache[a.project_id] ||
          `Project ${a.project_id}`,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [allowedAccesses, projectNameCache]);

  const accessProjectOptions = useMemo(() => {
    return isAdmin ? adminProjects : allowedProjects;
  }, [isAdmin, adminProjects, allowedProjects]);

  const accessProjectIdsSet = useMemo(
    () => new Set(accessProjectOptions.map((p) => String(p.id))),
    [accessProjectOptions],
  );
  const fetchAdminProjects = async () => {
    setAdminProjectsLoading(true);

    try {
      const res = await axios.get(
        "https://konstruct.world/projects/user-stage-role/get-projects-by-user/",
        {
          headers: {
            Authorization: `Bearer ${
              localStorage.getItem("ACCESS_TOKEN") || ""
            }`,
          },
        },
      );

      const list = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.results)
          ? res.data.results
          : [];

      const normalized = list
        .map((item) => ({
          id: item?.id || item?.project_id,
          name:
            item?.name ||
            item?.project_name ||
            `Project ${item?.id || item?.project_id}`,
        }))
        .filter((item) => item.id);

      setAdminProjects(normalized);

      setProjectNameCache((prev) => {
        const next = { ...prev };
        normalized.forEach((p) => {
          next[p.id] = p.name;
        });
        return next;
      });
    } catch (err) {
      console.error("Failed to fetch admin projects", err);
      setAdminProjects([]);
    } finally {
      setAdminProjectsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchAdminProjects();
    } else {
      setAdminProjects([]);
    }
  }, [isAdmin]);

  const fetchProjectName = async (id) => {
    if (!id || projectNameCache[id]) return;
    try {
      const res = await axios.get(
        `https://konstruct.world/projects/projects/${id}/`,
        {
          headers: {
            Authorization: `Bearer ${
              localStorage.getItem("ACCESS_TOKEN") || ""
            }`,
          },
        },
      );
      const name = res.data?.name || `Project ${id}`;
      setProjectNameCache((prev) => ({ ...prev, [id]: name }));
    } catch {
      setProjectNameCache((prev) => ({ ...prev, [id]: `Project ${id}` }));
    }
  };

  const getProjectNameById = (id) =>
    projectNameCache[id] ? projectNameCache[id] : `Project ${id}`;

  useEffect(() => {
    if (!users?.length) return;

    const ids = new Set();

    users.forEach((u) =>
      u.accesses?.forEach((a) => {
        if (a?.project_id && !projectNameCache[a.project_id]) {
          ids.add(a.project_id);
        }
      }),
    );

    allowedAccesses.forEach((a) => {
      if (a?.project_id && !projectNameCache[a.project_id]) {
        ids.add(a.project_id);
      }
    });

    ids.forEach((id) => fetchProjectName(id));
  }, [users, allowedAccesses, projectNameCache]);

  const projectFilterOptions = useMemo(() => {
    return isAdmin ? adminProjects : allowedProjects;
  }, [isAdmin, adminProjects, allowedProjects]);

  const fetchPurposePhaseStageByProject = async (projectId, force = false) => {
    if (!projectId) return;

    const key = String(projectId);

    if (!force && fetchedProjectsRef.current.has(key)) return;
    fetchedProjectsRef.current.add(key);

    const headers = {
      Authorization: `Bearer ${localStorage.getItem("ACCESS_TOKEN") || ""}`,
    };

    try {
      const purposeRes = await getPurposeByProjectId(projectId);
      const stageRes = await axios.get(
        `https://konstruct.world/projects/get-stage-details-by-project-id/${projectId}/`,
        { headers },
      );

      const purposeList = Array.isArray(purposeRes.data) ? purposeRes.data : [];
      const stageList = Array.isArray(stageRes.data) ? stageRes.data : [];

      setPurposesByProjectCache((prev) => ({
        ...prev,
        [key]: purposeList,
      }));

      setStagesByProjectCache((prev) => ({
        ...prev,
        [key]: stageList,
      }));

      setStageNameCache((prev) => {
        const next = { ...prev };
        stageList.forEach((s) => {
          if (s?.id) {
            next[String(s.id)] = s?.name || s?.stage_name || `Stage ${s.id}`;
          }
        });
        return next;
      });
    } catch {
      setPurposesByProjectCache((prev) => ({
        ...prev,
        [key]: prev[key] || [],
      }));

      setStagesByProjectCache((prev) => ({
        ...prev,
        [key]: prev[key] || [],
      }));
    }
  };

const fetchBuildingsByProject = async (projectId, force = false) => {
  if (!projectId) return;

  const key = String(projectId);

  if (!force && buildingsByProjectCache[key]) return;

  try {
    const res = await axios.get(
      `https://konstruct.world/projects/buildings/?project_id=${projectId}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("ACCESS_TOKEN") || ""}`,
        },
      },
    );

    const list = Array.isArray(res.data)
      ? res.data
      : Array.isArray(res.data?.results)
        ? res.data.results
        : [];

    setBuildingsByProjectCache((prev) => ({
      ...prev,
      [key]: list,
    }));
  } catch (err) {
    console.error("Failed to fetch buildings", err);
    setBuildingsByProjectCache((prev) => ({
      ...prev,
      [key]: prev[key] || [],
    }));
  }
};

  const fetchPhasesByPurpose = async (purposeId, force = false) => {
    if (!purposeId) return;

    const key = String(purposeId);

    if (!force && phasesByPurposeCache[key]) return;

    try {
      const res = await getPhaseByPurposeId(purposeId);
      const list = Array.isArray(res.data) ? res.data : [];

      setPhasesByPurposeCache((prev) => ({
        ...prev,
        [key]: list,
      }));
    } catch {
      setPhasesByPurposeCache((prev) => ({
        ...prev,
        [key]: prev[key] || [],
      }));
    }
  };

  const organizationId = useMemo(() => {
    return storedUserData?.org || "";
  }, [storedUserData]);

  const fetchCategories = async () => {
    if (!organizationId) return;

    try {
      const res = await getCategoriesSimpleByProject();
      const list = Array.isArray(res.data) ? res.data : [];
      setCategories(list);
    } catch {
      setCategories([]);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // const accessOptions = useMemo(() => {
  //   return (accessUser?.accesses || [])
  //     .filter((a) => allowedProjectIdsSet.has(String(a.project_id)))
  //     .sort((a, b) => {
  //       const projectA = String(
  //         a.project_name || getProjectNameById(a.project_id),
  //       );
  //       const projectB = String(
  //         b.project_name || getProjectNameById(b.project_id),
  //       );
  //       if (projectA !== projectB) return projectA.localeCompare(projectB);

  //       const purposeA = Number(a.purpose_id || 0);
  //       const purposeB = Number(b.purpose_id || 0);
  //       if (purposeA !== purposeB) return purposeA - purposeB;

  //       const phaseA = Number(a.phase_id || 0);
  //       const phaseB = Number(b.phase_id || 0);
  //       if (phaseA !== phaseB) return phaseA - phaseB;

  //       const stageA = Number(a.stage_id || 0);
  //       const stageB = Number(b.stage_id || 0);
  //       return stageA - stageB;
  //     });
  // }, [accessUser, allowedProjectIdsSet, projectNameCache]);

  const accessOptions = useMemo(() => {
    return (accessUser?.accesses || [])
      .filter((a) => {
        if (isAdmin) return true;
        return accessProjectIdsSet.has(String(a.project_id));
      })
      .sort((a, b) => {
        const projectA = String(
          a.project_name || getProjectNameById(a.project_id),
        );
        const projectB = String(
          b.project_name || getProjectNameById(b.project_id),
        );
        if (projectA !== projectB) return projectA.localeCompare(projectB);

        const purposeA = Number(a.purpose_id || 0);
        const purposeB = Number(b.purpose_id || 0);
        if (purposeA !== purposeB) return purposeA - purposeB;

        const phaseA = Number(a.phase_id || 0);
        const phaseB = Number(b.phase_id || 0);
        if (phaseA !== phaseB) return phaseA - phaseB;

        const stageA = Number(a.stage_id || 0);
        const stageB = Number(b.stage_id || 0);
        return stageA - stageB;
      });
  }, [accessUser, isAdmin, accessProjectIdsSet, projectNameCache]);

  const getPurposeLabel = (access) => {
    if (!access) return "-";

    if (typeof access.purpose_name === "string") return access.purpose_name;
    if (typeof access.name === "string") return access.name;
    if (access?.name?.purpose?.name) return access.name.purpose.name;
    if (access?.purpose?.name) return access.purpose.name;
    if (access?.purpose_label) return access.purpose_label;

    if (access.purpose_id || access.purpose_id === 0) {
      return `Purpose ${access.purpose_id}`;
    }

    return "-";
  };

  const fmtStage = (a) => {
    const id = a?.stage_id;
    if (id === null || id === undefined || id === "") return "Stage: -";

    const key = String(id);
    const name = stageNameCache[key];
    return name ? `Stage: ${name}` : `Stage: #${id}`;
  };

  const getScopeLabel = (access) => {
    const scopeParts = [];
    if (access?.building_id) scopeParts.push(`B:${access.building_id}`);
    if (access?.level_id) scopeParts.push(`L:${access.level_id}`);
    if (access?.zone_id) scopeParts.push(`Z:${access.zone_id}`);
    if (access?.flat_id) scopeParts.push(`F:${access.flat_id}`);
    return scopeParts.length ? scopeParts.join(" | ") : "Project-level";
  };

  const getAccessLabel = (access) => {
    const projectName =
      access.project_name || getProjectNameById(access.project_id);
    const purposeText = getPurposeLabel(access);
    const stageText = fmtStage(access);
    const scopeText = getScopeLabel(access);
    return `${projectName} — ${purposeText} — ${stageText} — ${scopeText}`;
  };

  const buildingOptions = useMemo(() => {
    if (!selectedProjectId) return [];

    const list = buildingsByProjectCache[String(selectedProjectId)] || [];

    return list
      .map((b) => ({
        id: b.id,
        name: b.name || b.building_name || b.title || `Building ${b.id}`,
      }))
      .sort((a, b) => String(a.name).localeCompare(String(b.name)));
  }, [selectedProjectId, buildingsByProjectCache]);

  const purposeOptions = useMemo(() => {
    if (!selectedProjectId) return [];

    const list = purposesByProjectCache[String(selectedProjectId)] || [];

    return list
      .map((p) => ({
        id: p?.id,
        name:
          p?.name?.purpose?.name ||
          p?.name?.name ||
          p?.purpose_name ||
          `Purpose ${p?.id}`,
      }))
      .sort((a, b) => String(a.name).localeCompare(String(b.name)));
  }, [selectedProjectId, purposesByProjectCache]);

  const phaseOptions = useMemo(() => {
    if (!selectedPurposeId) return [];

    const list = phasesByPurposeCache[String(selectedPurposeId)] || [];

    return list
      .map((p) => ({
        id: p.id,
        purpose_id: p.purpose || p.purpose_id || selectedPurposeId,
        name: p.name || p.phase_name || `Phase ${p.id}`,
      }))
      .sort((a, b) => String(a.name).localeCompare(String(b.name)));
  }, [selectedPurposeId, phasesByPurposeCache]);

  // const stageOptions = useMemo(() => {
  //   if (!selectedProjectId) return [];

  //   const list = stagesByProjectCache[String(selectedProjectId)] || [];

  //   const filtered = selectedPhaseId
  //     ? list.filter(
  //         (s) =>
  //           String(s?.phase_id || s?.phase || s?.phase_details?.id || "") ===
  //           String(selectedPhaseId),
  //       )
  //     : list;

  //   return filtered
  //     .map((s) => ({
  //       id: s.id,
  //       phase_id: s?.phase_id || s?.phase || s?.phase_details?.id || null,
  //       name: s.name || s.stage_name || `Stage ${s.id}`,
  //     }))
  //     .sort((a, b) => String(a.name).localeCompare(String(b.name)));
  // }, [selectedProjectId, selectedPhaseId, stagesByProjectCache]);
  const stageOptions = useMemo(() => {
    if (!selectedProjectId || !selectedPhaseId) return [];

    const list = stagesByProjectCache[String(selectedProjectId)] || [];

    return list
      .filter(
        (s) =>
          String(s?.phase_id || s?.phase || s?.phase_details?.id || "") ===
          String(selectedPhaseId),
      )
      .map((s) => ({
        id: s.id,
        phase_id: s?.phase_id || s?.phase || s?.phase_details?.id || null,
        name: s.name || s.stage_name || `Stage ${s.id}`,
      }))
      .sort((a, b) => String(a.name).localeCompare(String(b.name)));
  }, [selectedProjectId, selectedPhaseId, stagesByProjectCache]);

  const allStagesSelected =
    stageOptions.length > 0 &&
    stageOptions.every((item) => selectedStageIds.includes(String(item.id)));

  const categoryOptions = useMemo(() => {
    if (!selectedProjectId) return [];

    return categories
      .filter((c) => String(c.project) === String(selectedProjectId))
      .map((c) => ({
        id: c.id,
        name: c.name || `Category ${c.id}`,
      }))
      .sort((a, b) => String(a.name).localeCompare(String(b.name)));
  }, [categories, selectedProjectId]);

  const areAllCategoriesSelected = (selectedIds, options) => {
    if (!options.length) return false;
    const optionIds = options.map((o) => String(o.id));
    return optionIds.every((id) => selectedIds.includes(id));
  };

  const allCategoriesSelected = areAllCategoriesSelected(
    selectedCategoryIds,
    categoryOptions,
  );

  const selectedAccess = useMemo(() => {
    if (!accessUser?.accesses?.length || !selectedAccessId) return null;
    return (
      accessUser.accesses.find(
        (a) => String(a.id) === String(selectedAccessId),
      ) || null
    );
  }, [accessUser, selectedAccessId]);

  // const toggleRoleDraft = (role) => {
  //   setRolesDraft((prev) => {
  //     const s = new Set(prev);
  //     if (s.has(role)) s.delete(role);
  //     else s.add(role);
  //     return Array.from(s);
  //   });
  // };

  const getUniqueRoles = () => {
    const roles = new Set();
    users.forEach((user) => {
      user.accesses?.forEach((access) => {
        access.roles?.forEach((role) => {
          if (role?.role) roles.add(role.role);
        });
      });
    });
    return Array.from(roles);
  };

  const filteredUsers = users.filter((user) => {
    const term = (searchTerm || "").toLowerCase();

    const matchesSearch =
      (user.username || "").toLowerCase().includes(term) ||
      (user.email || "").toLowerCase().includes(term) ||
      String(user.id || "").includes(term) ||
      user.accesses?.some((a) =>
        (projectNameCache[a.project_id] || "").toLowerCase().includes(term),
      );

    const matchesRole =
      roleFilter === "all" ||
      user.accesses?.some((access) =>
        access.roles?.some((role) => role.role === roleFilter),
      );

    const matchesProject =
      projectFilter === "all" ||
      user.accesses?.some(
        (access) => String(access.project_id) === String(projectFilter),
      );

    return matchesSearch && matchesRole && matchesProject;
  });

  const getRoleColor = (role) => {
    switch ((role || "").toLowerCase()) {
      case "maker":
        return theme === "dark"
          ? "bg-green-900 text-green-300"
          : "bg-green-100 text-green-700";
      case "checker":
        return theme === "dark"
          ? "bg-orange-900 text-orange-300"
          : "bg-orange-100 text-orange-700";
      case "supervisor":
        return theme === "dark"
          ? "bg-purple-900 text-purple-300"
          : "bg-purple-100 text-purple-700";
      case "admin":
        return theme === "dark"
          ? "bg-red-900 text-red-300"
          : "bg-red-100 text-red-700";
      case "intializer":
      case "initializer":
        return theme === "dark"
          ? "bg-blue-900 text-blue-300"
          : "bg-blue-100 text-blue-700";
      default:
        return theme === "dark"
          ? "bg-slate-700 text-slate-200"
          : "bg-gray-100 text-gray-700";
    }
  };

  const toggleRowExpansion = (userId) => {
    setExpandedRows((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  const toggleSelectAll = (options, selectedValues, setter) => {
    const optionIds = options.map((item) => String(item.id));
    const allSelected =
      optionIds.length > 0 &&
      optionIds.every((id) => selectedValues.includes(String(id)));

    if (allSelected) {
      setter([]);
    } else {
      setter(optionIds);
    }
  };

  const toggleMultiValue = (value, setter) => {
    setter((prev) => {
      const set = new Set(prev.map(String));
      const key = String(value);
      if (set.has(key)) {
        return prev.filter((x) => String(x) !== key);
      }
      return [...prev, key];
    });
  };

  // const handleProjectChange = async (projectId) => {
  //   setSelectedProjectId(projectId);
  //   setSelectedAccessId(null);
  //   setSelectedAccessIds([]);
  //   setSelectedPurposeId("");
  //   setSelectedPhaseId("");
  //   setSelectedStageIds([]);
  //   setSelectedCategoryIds([]);
  //   setSelectedRole("");

  //   if (projectId) {
  //     await fetchPurposePhaseStageByProject(projectId, true);
  //   }
  // };
const handleProjectChange = async (projectId) => {
  setSelectedProjectId(projectId);
  setSelectedAccessId(null);
  setSelectedAccessIds([]);
  setSelectedBuildingIds([]);
  setSelectedPurposeId("");
  setSelectedPhaseId("");
  setSelectedStageIds([]);
  setSelectedCategoryIds([]);
  setSelectedRole("");

  if (projectId) {
    await Promise.all([
      fetchPurposePhaseStageByProject(projectId, true),
      fetchBuildingsByProject(projectId, true),
    ]);
  }
};

const handleBuildingToggle = (buildingId) => {
  setSelectedBuildingIds((prev) => {
    const key = String(buildingId);
    const exists = prev.includes(key);

    if (exists) {
      return prev.filter((id) => String(id) !== key);
    }
    return [...prev, key];
  });
};

const allBuildingsSelected =
  buildingOptions.length > 0 &&
  buildingOptions.every((item) =>
    selectedBuildingIds.includes(String(item.id)),
  );

const toggleSelectAllBuildings = () => {
  if (allBuildingsSelected) {
    setSelectedBuildingIds([]);
  } else {
    setSelectedBuildingIds(buildingOptions.map((b) => String(b.id)));
  }
};

  const handlePurposeChange = async (purposeId) => {
    setSelectedPurposeId(String(purposeId || ""));
    setSelectedPhaseId("");
    setSelectedStageIds([]);

    if (purposeId) {
      await fetchPhasesByPurpose(purposeId, true);
    }
  };

  const handlePhaseChange = (phaseId) => {
    setSelectedPhaseId(String(phaseId || ""));
    setSelectedStageIds([]);
  };

  const handleStageToggle = (stageId) => {
    toggleMultiValue(stageId, setSelectedStageIds);
  };

  const handleCategoryToggle = (categoryId) => {
    setSelectedCategoryIds((prev) => {
      const key = String(categoryId);
      const exists = prev.includes(key);

      if (exists) {
        return prev.filter((id) => String(id) !== key);
      }
      return [...prev, key];
    });
  };

  const toggleSelectAllCategories = () => {
    const allSelected = areAllCategoriesSelected(
      selectedCategoryIds,
      categoryOptions,
    );

    if (allSelected) {
      setSelectedCategoryIds([]);
    } else {
      setSelectedCategoryIds(categoryOptions.map((c) => String(c.id)));
    }
  };

  const handleEditUser = (userId) => {
    const u = users.find((x) => x.id === userId);
    if (!u) return;

      const currentGroupIds = (u.groups || []).map((g) => g.id);

    setEditErr("");
    setEditUser(u);
    setSafetyOfficerDraft(!!(u.is_safetyOfficer ?? u.is_safetyOfficer));
    setEditForm({
      user_type: u.user_type || "INTERNAL",
      contractor_name: u.contractor_name || "",
      username: u.username || "",
      first_name: u.first_name || "",
      last_name: u.last_name || "",
      email: u.email || "",
      phone_number: u.phone_number || "",
      new_password: "",
      confirm_password: "",
      group_ids: currentGroupIds,
    });
    setEditOpen(true);
  };

  const closeEdit = () => {
    setEditOpen(false);
    setEditUser(null);
    setEditErr("");
    setEditSaving(false);
    setEditForm({
      user_type: "INTERNAL",
      contractor_name: "",
      username: "",
      first_name: "",
      last_name: "",
      email: "",
      phone_number: "",
      new_password: "",
      confirm_password: "",
      group_ids: [],
    });
  };

  const saveEdit = async () => {
    if (!editUser?.id) return;

    setEditErr("");

    const uname = (editForm.username || "").trim();
    if (!uname) {
      setEditErr("Username is required.");
      return;
    }

    const np = (editForm.new_password || "").trim();
    const cp = (editForm.confirm_password || "").trim();

    if (np || cp) {
      if (np.length < 6) {
        setEditErr("New password must be at least 6 characters.");
        return;
      }
      if (np !== cp) {
        setEditErr("New password and confirm password do not match.");
        return;
      }
    }

    const userPayload = {
      user_type: editForm.user_type || "INTERNAL",

      contractor_name:
        editForm.user_type === "EXTERNAL"
          ? (editForm.contractor_name || "").trim()
          : "",

      is_safetyOfficer: !!safetyOfficerDraft,
      username: uname,
      first_name: (editForm.first_name || "").trim(),
      last_name: (editForm.last_name || "").trim(),
      email: (editForm.email || "").trim(),
      phone_number: (editForm.phone_number || "").trim(),
      group_ids: editForm.group_ids || [],

      ...(np ? { password: np } : {}),
    };

    setEditSaving(true);
    try {
      await axiosInstance.patch(`/users/access-full-patch/${editUser.id}/`, {
        user: userPayload,
      });

      await fetchUsers();
      closeEdit();
      window.alert("User updated successfully.");
    } catch (e) {
      const msg =
        e?.response?.data?.detail ||
        (typeof e?.response?.data === "object"
          ? JSON.stringify(e.response.data)
          : "") ||
        "Failed to update user.";
      setEditErr(msg);
    } finally {
      setEditSaving(false);
    }
  };

    const handleEditUserTypeChange = (e) => {
      const nextType = e.target.value;

      setEditForm((prev) => ({
        ...prev,
        user_type: nextType,
        contractor_name: nextType === "EXTERNAL" ? prev.contractor_name : "",
      }));
    };

  const toggleUserHasAccess = async (user) => {
    if (!user?.id || userToggleSaving) return;

    // const next = !Boolean(user.has_access);
    const next = !Boolean(user.is_active);
    const ok = window.confirm(
      `${next ? "Enable" : "Disable"} this user?\n\nUsername: ${user.username}`,
    );
    if (!ok) return;

    setUserToggleSaving(true);

    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, is_active: next } : u)),
    );

    try {
      await axiosInstance.patch(`/users/${user.id}/`, { is_active: next });
      const latestUsers = await fetchUsers();

      if (accessUser?.id === user.id) {
        const refreshed = latestUsers.find((u) => u.id === user.id);
        if (refreshed) setAccessUser(refreshed);
      }
    } catch (e) {
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, is_active: !next } : u)),
      );
      const msg =
        e?.response?.data?.detail ||
        (typeof e?.response?.data === "object"
          ? JSON.stringify(e.response.data)
          : "") ||
        "Failed to update user status.";
      window.alert(msg);
    } finally {
      setUserToggleSaving(false);
    }
  };

  const openAccessModal = (userId) => {
    const u = users.find((x) => x.id === userId);
    if (!u) return;

    setAccessErr("");
    setAccessSaving(false);
    setAccessUser(u);
    setSelectedAccessId(null);
    setSelectedAccessIds([]);
    setSelectedProjectId("");
    setSelectedBuildingIds([]);
    setSelectedPurposeId("");
    setSelectedPhaseId("");
    setSelectedStageIds([]);
    setSelectedCategoryIds([]);
    setSelectedRole("");
    setAccessActiveDraft(true);
    setAccessOpen(true);
  };

  const closeAccessModal = () => {
    setAccessOpen(false);
    setAccessUser(null);
    setSelectedAccessId(null);
    setSelectedAccessIds([]);
    setSelectedProjectId("");
    setSelectedBuildingIds([]);
    setSelectedPurposeId("");
    setSelectedPhaseId("");
    setSelectedStageIds([]);
    setSelectedCategoryIds([]);
    setSelectedRole("");
    setAccessActiveDraft(true);
    setAccessSaving(false);
    setAccessErr("");
  };

  // const populateFromAccess = async (access) => {
  //   if (!access) return;

  //   const projectId = access.project_id ? String(access.project_id) : "";
  //   const purposeId = access.purpose_id ? String(access.purpose_id) : "";
  //   const phaseId = access.phase_id ? String(access.phase_id) : "";
  //   const stageId = access.stage_id ? String(access.stage_id) : "";

  //   setSelectedAccessId(String(access.id));
  //   setSelectedAccessIds([String(access.id)]);
  //   setSelectedProjectId(projectId);

  //   if (projectId) {
  //     await fetchPurposePhaseStageByProject(projectId, true);
  //   }

  //   if (purposeId) {
  //     await fetchPhasesByPurpose(purposeId, true);
  //   }

  //   setSelectedPurposeId(purposeId || "");
  //   setSelectedPhaseId(phaseId || "");
  //   setSelectedStageIds(stageId ? [stageId] : []);

  //   if (access.all_cat === true) {
  //     const projectCategories =
  //       categories
  //         .filter((c) => String(c.project) === String(projectId))
  //         .map((c) => String(c.id)) || [];
  //     setSelectedCategoryIds(projectCategories);
  //   } else {
  //     setSelectedCategoryIds(
  //       access.category || access.category === 0
  //         ? [String(access.category)]
  //         : [],
  //     );
  //   }

  //   const firstRole =
  //     Array.from(
  //       new Set((access.roles || []).map((r) => r?.role).filter(Boolean)),
  //     )[0] || "";
  //   setSelectedRole(firstRole);
  //   setAccessActiveDraft(Boolean(access.active));
  //   setAccessErr("");
  // };
const populateFromAccess = async (access) => {
  if (!access) return;

  const projectId = access.project_id ? String(access.project_id) : "";
  const buildingId = access.building_id ? String(access.building_id) : "";
  const purposeId = access.purpose_id ? String(access.purpose_id) : "";
  const phaseId = access.phase_id ? String(access.phase_id) : "";
  const stageId = access.stage_id ? String(access.stage_id) : "";

  setSelectedAccessId(String(access.id));
  setSelectedAccessIds([String(access.id)]);
  setSelectedProjectId(projectId);

  if (projectId) {
    await Promise.all([
      fetchPurposePhaseStageByProject(projectId, true),
      fetchBuildingsByProject(projectId, true),
    ]);
  }

  if (purposeId) {
    await fetchPhasesByPurpose(purposeId, true);
  }

  setSelectedBuildingIds(buildingId ? [buildingId] : []);
  setSelectedPurposeId(purposeId || "");
  setSelectedPhaseId(phaseId || "");
  setSelectedStageIds(stageId ? [stageId] : []);

  if (access.all_cat === true) {
    const projectCategories =
      categories
        .filter((c) => String(c.project) === String(projectId))
        .map((c) => String(c.id)) || [];
    setSelectedCategoryIds(projectCategories);
  } else {
    setSelectedCategoryIds(
      access.category || access.category === 0 ? [String(access.category)] : [],
    );
  }

  const firstRole =
    Array.from(
      new Set((access.roles || []).map((r) => r?.role).filter(Boolean)),
    )[0] || "";

  setSelectedRole(firstRole);
  setAccessActiveDraft(Boolean(access.active));
  setAccessErr("");
};

  useEffect(() => {
    if (!selectedAccess) return;

    const roles = (selectedAccess.roles || [])
      .map((r) => r?.role)
      .filter(Boolean);

    setSelectedRole(roles[0] || "");
    setAccessActiveDraft(Boolean(selectedAccess.active));
  }, [selectedAccess]);

  const isSameScope = (a, b) =>
    String(a.project_id || "") === String(b.project_id || "") &&
    String(a.building_id || "") === String(b.building_id || "") &&
    String(a.level_id || "") === String(b.level_id || "") &&
    String(a.flat_id || "") === String(b.flat_id || "") &&
    String(a.purpose_id || "") === String(b.purpose_id || "") &&
    String(a.phase_id || "") === String(b.phase_id || "") &&
    String(a.stage_id || "") === String(b.stage_id || "") &&
    String(a.category || "") === String(b.category || "") &&
    Boolean(a.all_cat) === Boolean(b.all_cat);

  const hasRoleOnAccess = (access, role) =>
    (access?.roles || []).some(
      (r) =>
        String(r?.role || "").toUpperCase() ===
        String(role || "").toUpperCase(),
    );

  // const buildAccessPayloads = ({
  //   userId,
  //   projectId,
  //   buildingId,
  //   levelId,
  //   flatId,
  //   selectedPurposeId = null,
  //   selectedPhaseId = null,
  //   selectedStages = [],
  //   selectedCategories = [],
  //   selectedRole = "",
  //   allCategoriesSelected = false,
  // }) => {
  //   const payloads = [];

  //   const stagesLocal = selectedStages.length ? selectedStages : [null];
  //   const categoriesLocal =
  //     allCategoriesSelected || !selectedCategories.length
  //       ? [null]
  //       : selectedCategories;

  //   if (!selectedRole) return payloads;

  //   for (const stage of stagesLocal) {
  //     for (const category of categoriesLocal) {
  //       payloads.push({
  //         user_id: userId,
  //         role: selectedRole,
  //         project_id: projectId,
  //         building_id: buildingId || null,
  //         level_id: levelId || null,
  //         flat_id: flatId || null,
  //         purpose_id: selectedPurposeId ? Number(selectedPurposeId) : null,
  //         phase_id: selectedPhaseId ? Number(selectedPhaseId) : null,
  //         stage_id: stage?.id ? Number(stage.id) : null,
  //         category: allCategoriesSelected
  //           ? null
  //           : category?.id
  //             ? Number(category.id)
  //             : null,
  //         all_cat: allCategoriesSelected,
  //       });
  //     }
  //   }

  //   return payloads;
  // };
const buildAccessPayloads = ({
  userId,
  projectId,
  buildingIds = [],
  levelId,
  flatId,
  role,
  selectedPurposeId = null,
  selectedPhaseId = null,
  selectedStageObjects = [],
  selectedCategoryObjects = [],
  isAllCategoriesSelectedNow = false,
  accessActiveDraft = true,
}) => {
  const buildingValues = buildingIds.length
    ? buildingIds.map((id) => Number(id))
    : [null];

  const stageValues = selectedStageObjects.length
    ? selectedStageObjects
    : [{ id: null }];

  const categoryValues = isAllCategoriesSelectedNow
    ? [{ id: null, all_cat: true }]
    : selectedCategoryObjects.length
      ? selectedCategoryObjects.map((c) => ({ id: c.id, all_cat: false }))
      : [{ id: null, all_cat: false }];

  const payloads = [];

  buildingValues.forEach((buildingId) => {
    stageValues.forEach((stage) => {
      categoryValues.forEach((category) => {
        payloads.push({
          user: userId,
          role: role,
          // project_id: Number(projectId),
          project_id: projectId ? Number(projectId) : null,
          building_id: buildingId,
          level_id: levelId ? Number(levelId) : null,
          flat_id: flatId ? Number(flatId) : null,
          purpose_id: selectedPurposeId ? Number(selectedPurposeId) : null,
          phase_id: selectedPhaseId ? Number(selectedPhaseId) : null,
          stage_id: stage?.id ? Number(stage.id) : null,
          active: Boolean(accessActiveDraft),
          all_cat: Boolean(category.all_cat),
          category: category.id ? Number(category.id) : null,
          CategoryLevel1: null,
          CategoryLevel2: null,
          CategoryLevel3: null,
          CategoryLevel4: null,
          CategoryLevel5: null,
          CategoryLevel6: null,
        });
      });
    });
  });

  return payloads;
};

  const getCurrentScopeDefaults = () => {
    if (!selectedAccess) {
      return {
        building_id: null,
        level_id: null,
        flat_id: null,
        zone_id: null,
      };
    }

    return {
      building_id: selectedAccess.building_id || null,
      level_id: selectedAccess.level_id || null,
      flat_id: selectedAccess.flat_id || null,
      zone_id: selectedAccess.zone_id || null,
    };
  };

  // const canSaveAccess = Boolean(selectedProjectId && selectedRole);

  const isProjectOptional = ["PROJECT_HEAD", "PROJECT_MANAGER"].includes(
    selectedRole?.toUpperCase(),
  );

  const canSaveAccess = Boolean(
    selectedRole && (selectedProjectId || isProjectOptional),
  );
  // const saveAccessAndRoles = async () => {
  //   if (!accessUser?.id) return;

  //   if (!selectedProjectId) {
  //     setAccessErr("Select project first.");
  //     return;
  //   }

  //   if (!selectedRole) {
  //     setAccessErr("Select role.");
  //     return;
  //   }

  //   setAccessErr("");
  //   setAccessSaving(true);

  //   try {
  //     const scopeDefaults = getCurrentScopeDefaults();

  //     const selectedStageObjects = stageOptions.filter((s) =>
  //       selectedStageIds.includes(String(s.id)),
  //     );

  //     const selectedCategoryObjects = categoryOptions.filter((c) =>
  //       selectedCategoryIds.includes(String(c.id)),
  //     );

  //     const isAllCategoriesSelectedNow = areAllCategoriesSelected(
  //       selectedCategoryIds,
  //       categoryOptions,
  //     );

  //     const payloads = buildAccessPayloads({
  //       userId: accessUser.id,
  //       projectId: Number(selectedProjectId),
  //       buildingId: scopeDefaults.building_id,
  //       levelId: scopeDefaults.level_id,
  //       flatId: scopeDefaults.flat_id,
  //       selectedPurposeId: selectedPurposeId || null,
  //       selectedPhaseId: selectedPhaseId || null,
  //       selectedStages: selectedStageObjects,
  //       selectedCategories: selectedCategoryObjects,
  //       selectedRole,
  //       allCategoriesSelected: isAllCategoriesSelectedNow,
  //     });

  //     if (payloads.length === 0) {
  //       payloads.push({
  //         user_id: accessUser.id,
  //         role: selectedRole,
  //         project_id: Number(selectedProjectId),
  //         building_id: scopeDefaults.building_id,
  //         level_id: scopeDefaults.level_id,
  //         flat_id: scopeDefaults.flat_id,
  //         purpose_id: selectedPurposeId ? Number(selectedPurposeId) : null,
  //         phase_id: selectedPhaseId ? Number(selectedPhaseId) : null,
  //         stage_id: null,
  //         category: null,
  //         all_cat: isAllCategoriesSelectedNow,
  //       });
  //     }

  //     const existingAccesses = Array.isArray(accessUser?.accesses)
  //       ? accessUser.accesses
  //       : [];

  //     const createdOrUpdatedIds = [];

  //     for (const item of payloads) {
  //       const scopeProbe = {
  //         project_id: item.project_id,
  //         building_id: item.building_id,
  //         level_id: item.level_id,
  //         flat_id: item.flat_id,
  //         purpose_id: item.purpose_id,
  //         phase_id: item.phase_id,
  //         stage_id: item.stage_id,
  //         category: item.category,
  //         all_cat: item.all_cat,
  //       };

  //       const sameScopeAccesses = existingAccesses.filter((a) =>
  //         isSameScope(a, scopeProbe),
  //       );

  //       const exactAccessWithRole = sameScopeAccesses.find((a) =>
  //         hasRoleOnAccess(a, item.role),
  //       );

  //       if (exactAccessWithRole) {
  //         const patchPayload = {
  //           access: {
  //             project_id: item.project_id,
  //             building_id: item.building_id,
  //             level_id: item.level_id,
  //             flat_id: item.flat_id,
  //             purpose_id: item.purpose_id,
  //             phase_id: item.phase_id,
  //             stage_id: item.stage_id,
  //             category: item.category,
  //             all_cat: item.all_cat,
  //             active: accessActiveDraft,
  //           },
  //           roles: [{ role: item.role }],
  //         };

  //         const saveRes = await axiosInstance.patch(
  //           `/users/access-full-patch/${accessUser.id}/`,
  //           patchPayload,
  //         );

  //         const savedAccessId = saveRes?.data?.access?.id
  //           ? String(saveRes.data.access.id)
  //           : String(exactAccessWithRole.id);

  //         createdOrUpdatedIds.push(savedAccessId);
  //         continue;
  //       }

  //       const createPayload = {
  //         user: {
  //           id: accessUser.id,
  //         },
  //         access: {
  //           project_id: item.project_id,
  //           building_id: item.building_id,
  //           zone_id: scopeDefaults.zone_id || null,
  //           flat_id: item.flat_id,
  //           level_id: item.level_id,
  //           purpose_id: item.purpose_id,
  //           phase_id: item.phase_id,
  //           stage_id: item.stage_id,
  //           active: accessActiveDraft,
  //           all_cat: item.all_cat,
  //           category: item.category,
  //           CategoryLevel1: null,
  //           CategoryLevel2: null,
  //           CategoryLevel3: null,
  //           CategoryLevel4: null,
  //           CategoryLevel5: null,
  //           CategoryLevel6: null,
  //         },
  //         roles: [{ role: item.role }],
  //       };

  //       const createRes = await createUserAccessRole(createPayload);
  //       const createdAccessId = createRes?.data?.access?.id
  //         ? String(createRes.data.access.id)
  //         : createRes?.data?.id
  //           ? String(createRes.data.id)
  //           : null;

  //       if (createdAccessId) {
  //         createdOrUpdatedIds.push(createdAccessId);
  //       }
  //     }

  //     const latestUsers = await fetchUsers();
  //     const refreshed = latestUsers.find((u) => u.id === accessUser.id);

  //     if (refreshed) {
  //       setAccessUser(refreshed);

  //       if (createdOrUpdatedIds.length === 1) {
  //         const refreshedAccess =
  //           refreshed.accesses?.find(
  //             (a) => String(a.id) === String(createdOrUpdatedIds[0]),
  //           ) || null;

  //         if (refreshedAccess) {
  //           await populateFromAccess(refreshedAccess);
  //         }
  //       } else {
  //         setSelectedAccessId(null);
  //         setSelectedAccessIds(createdOrUpdatedIds);
  //       }
  //     }

  //     window.alert("Access & role updated successfully.");
  //   } catch (e) {
  //     const msg =
  //       e?.response?.data?.detail ||
  //       (typeof e?.response?.data === "object"
  //         ? JSON.stringify(e.response.data)
  //         : "") ||
  //       "Failed to update access/role.";
  //     setAccessErr(msg);
  //   } finally {
  //     setAccessSaving(false);
  //   }
  // };

  const saveAccessAndRoles = async () => {
    if (!accessUser?.id) return;

    // if (!selectedProjectId) {
    //   setAccessErr("Select project first.");
    //   return;
    // }
    const isProjectOptional = ["PROJECT_HEAD", "PROJECT_MANAGER"].includes(
      selectedRole?.toUpperCase(),
    );

    if (!selectedProjectId && !isProjectOptional) {
      toast.error("Please select project");
      return;
    }

    if (!selectedRole) {
      setAccessErr("Select role.");
      return;
    }

    setAccessErr("");
    setAccessSaving(true);

    try {
      const scopeDefaults = getCurrentScopeDefaults();

      const selectedStageObjects = stageOptions.filter((s) =>
        selectedStageIds.includes(String(s.id)),
      );

      const selectedCategoryObjects = categoryOptions.filter((c) =>
        selectedCategoryIds.includes(String(c.id)),
      );

      const isAllCategoriesSelectedNow = areAllCategoriesSelected(
        selectedCategoryIds,
        categoryOptions,
      );

      // const payloads = buildAccessPayloads({
      //   userId: accessUser.id,
      //   projectId: Number(selectedProjectId),
      //   // buildingId: scopeDefaults.building_id,
      //   buildingId: selectedBuildingId ? Number(selectedBuildingId) : null,
      //   levelId: scopeDefaults.level_id,
      //   flatId: scopeDefaults.flat_id,
      //   selectedPurposeId: selectedPurposeId || null,
      //   selectedPhaseId: selectedPhaseId || null,
      //   selectedStages: selectedStageObjects,
      //   selectedCategories: selectedCategoryObjects,
      //   selectedRole,
      //   allCategoriesSelected: isAllCategoriesSelectedNow,
      // });
      const payloads = buildAccessPayloads({
        userId: accessUser.id,
        role: selectedRole,
        // projectId: selectedProjectId,
        projectId: isProjectOptional
          ? selectedProjectId || null
          : selectedProjectId,
        buildingIds: selectedBuildingIds,
        levelId: scopeDefaults.level_id || null,
        flatId: scopeDefaults.flat_id || null,
        selectedPurposeId,
        selectedPhaseId,
        selectedStageObjects,
        selectedCategoryObjects,
        isAllCategoriesSelectedNow,
        accessActiveDraft,
      });

      if (payloads.length === 0) {
        payloads.push({
          user_id: accessUser.id,
          role: selectedRole,
          project_id: Number(selectedProjectId),
          building_id: scopeDefaults.building_id,
          level_id: scopeDefaults.level_id,
          flat_id: scopeDefaults.flat_id,
          purpose_id: selectedPurposeId ? Number(selectedPurposeId) : null,
          phase_id: selectedPhaseId ? Number(selectedPhaseId) : null,
          stage_id: null,
          category: null,
          all_cat: isAllCategoriesSelectedNow,
        });
      }

      const existingAccesses = Array.isArray(accessUser?.accesses)
        ? accessUser.accesses
        : [];

      const createdOrUpdatedIds = [];

      for (const item of payloads) {
        const scopeProbe = {
          project_id: item.project_id,
          building_id: item.building_id,
          level_id: item.level_id,
          flat_id: item.flat_id,
          purpose_id: item.purpose_id,
          phase_id: item.phase_id,
          stage_id: item.stage_id,
          category: item.category,
          all_cat: item.all_cat,
          role: item.role,
        };

        const sameScopeAccesses = existingAccesses.filter((a) =>
          isSameScope(a, scopeProbe),
        );

        const exactAccessWithRole = sameScopeAccesses.find((a) =>
          hasRoleOnAccess(a, item.role),
        );

        // SAME ROLE EXISTS -> UPDATE EXISTING ACCESS
        if (exactAccessWithRole) {
          const patchPayload = {
            access: {
              project_id: item.project_id,
              building_id: item.building_id,
              level_id: item.level_id,
              flat_id: item.flat_id,
              purpose_id: item.purpose_id,
              phase_id: item.phase_id,
              stage_id: item.stage_id,
              category: item.category,
              all_cat: item.all_cat,
              active: accessActiveDraft,
            },
            roles: [{ role: item.role }],
          };

          const saveRes = await axiosInstance.patch(
            `/users/access-full-patch/${accessUser.id}/`,
            patchPayload,
          );

          const savedAccessId = saveRes?.data?.access?.id
            ? String(saveRes.data.access.id)
            : String(exactAccessWithRole.id);

          createdOrUpdatedIds.push(savedAccessId);
          continue;
        }

        // SAME ROLE DOES NOT EXIST -> CREATE NEW ACCESS
        const accessPayload = {
          user: accessUser.id,
          project_id: item.project_id,
          building_id: item.building_id,
          zone_id: scopeDefaults.zone_id || null,
          flat_id: item.flat_id,
          level_id: item.level_id,
          purpose_id: item.purpose_id,
          phase_id: item.phase_id,
          stage_id: item.stage_id,
          active: accessActiveDraft,
          all_cat: item.all_cat,
          category: item.category,
          CategoryLevel1: null,
          CategoryLevel2: null,
          CategoryLevel3: null,
          CategoryLevel4: null,
          CategoryLevel5: null,
          CategoryLevel6: null,
        };

        const createAccessRes = await createUserAccess(accessPayload);

        const createdAccessId = createAccessRes?.data?.id
          ? String(createAccessRes.data.id)
          : null;

        if (!createdAccessId) {
          throw new Error("Access created but no access id returned.");
        }

        // ASSIGN ROLE TO NEW ACCESS
        const rolePayload = {
          user_access_id: Number(createdAccessId),
          role: item.role,
        };

        await createRoleForUserAccess(rolePayload);

        createdOrUpdatedIds.push(createdAccessId);
      }

      const latestUsers = await fetchUsers();
      const refreshed = latestUsers.find((u) => u.id === accessUser.id);

      if (refreshed) {
        setAccessUser(refreshed);

        if (createdOrUpdatedIds.length === 1) {
          const refreshedAccess =
            refreshed.accesses?.find(
              (a) => String(a.id) === String(createdOrUpdatedIds[0]),
            ) || null;

          if (refreshedAccess) {
            await populateFromAccess(refreshedAccess);
          }
        } else {
          setSelectedAccessId(null);
          setSelectedAccessIds(createdOrUpdatedIds);
        }
      }

      window.alert("Access & role updated successfully.");
    } catch (e) {
      const msg =
        e?.response?.data?.detail ||
        (typeof e?.response?.data === "object"
          ? JSON.stringify(e.response.data)
          : "") ||
        e?.message ||
        "Failed to update access/role.";
      setAccessErr(msg);
    } finally {
      setAccessSaving(false);
    }
  };

  const handleDeleteAccess = async (accessId) => {
    if (!accessUser?.id || !accessId) return;

    const ok = window.confirm(
      "Are you sure you want to delete this access? This will also delete its roles.",
    );
    if (!ok) return;

    setAccessErr("");
    setDeleteAccessLoadingId(String(accessId));

    try {
      await axiosInstance.delete(`/accesses/${accessId}/`);

      const latestUsers = await fetchUsers();
      const refreshed = latestUsers.find((u) => u.id === accessUser.id);

      if (refreshed) {
        setAccessUser(refreshed);
      }

      if (String(selectedAccessId || "") === String(accessId)) {
        setSelectedAccessId(null);
        setSelectedAccessIds([]);
        setSelectedProjectId("");
        setSelectedPurposeId("");
        setSelectedPhaseId("");
        setSelectedStageIds([]);
        setSelectedCategoryIds([]);
        setSelectedRole("");
        setAccessActiveDraft(true);
      }

      window.alert("Access deleted successfully.");
    } catch (e) {
      const msg =
        e?.response?.data?.detail ||
        (typeof e?.response?.data === "object"
          ? JSON.stringify(e.response.data)
          : "") ||
        "Failed to delete access.";
      setAccessErr(msg);
    } finally {
      setDeleteAccessLoadingId(null);
    }
  };

  const handleDeleteUser = (userId) => {
    const u = users.find((x) => x.id === userId);
    if (!u) return;
    toggleUserHasAccess(u);
  };

  const handleManageAccess = (userId) => {
    openAccessModal(userId);
  };

  return (
    <>
      <main className="w-full min-h-[calc(100vh-64px)] p-6 bg-transparent">
        <h2 className={`text-2xl font-bold mb-6 ${palette.text}`}>
          Users Management
        </h2>

        <div
          className={`rounded-lg ${palette.card} ${palette.shadow} p-4 mb-6 ${palette.border} border`}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              className={`text-center p-3 rounded-lg ${
                theme === "dark" ? "bg-blue-900" : "bg-blue-50"
              }`}
            >
              <div className="text-2xl font-bold text-blue-600">
                {users.length}
              </div>
              <div className={`text-sm ${palette.subtext}`}>
                Total Users Created
              </div>
            </div>

            <div
              className={`text-center p-3 rounded-lg ${
                theme === "dark" ? "bg-green-900" : "bg-green-50"
              }`}
            >
              <div className="text-2xl font-bold text-green-600">
                {users.filter((u) => u.accesses?.length > 0).length}
              </div>
              <div className={`text-sm ${palette.subtext}`}>
                Users with Access
              </div>
            </div>

            <div
              className={`text-center p-3 rounded-lg ${
                theme === "dark" ? "bg-purple-900" : "bg-purple-50"
              }`}
            >
              <div className="text-2xl font-bold text-purple-600">
                {allowedProjects.length}
              </div>
              <div className={`text-sm ${palette.subtext}`}>
                Projects Assigned
              </div>
            </div>
          </div>
        </div>

        <div
          className={`rounded-lg ${palette.card} ${palette.shadow} p-6 mb-6 ${palette.border} border`}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label
                className={`block text-sm font-medium mb-2 ${palette.text}`}
              >
                Search Users
              </label>
              <input
                type="text"
                placeholder="Search by username, email, or ID..."
                className={`w-full px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${palette.input} ${palette.border} border`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div>
              <label
                className={`block text-sm font-medium mb-2 ${palette.text}`}
              >
                Filter by Role
              </label>
              <select
                className={`w-full px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${palette.input} ${palette.border} border`}
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="all">All Roles</option>
                {getUniqueRoles().map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                className={`block text-sm font-medium mb-2 ${palette.text}`}
              >
                Filter by Project
              </label>
              <select
                className={`w-full px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${palette.input} ${palette.border} border`}
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
              >
                <option value="all">All Projects</option>
                {/* {allowedProjects.map((p) => (
                  <option key={p.id} value={String(p.id)}>
                    {p.name}
                  </option>
                ))} */}
                {projectFilterOptions.map((p) => (
                  <option key={p.id} value={String(p.id)}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div
          className={`rounded-lg ${palette.card} ${palette.shadow} overflow-hidden ${palette.border} border`}
        >
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3" />
              <span className={palette.subtext}>Loading users...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-500 mb-4">{error}</p>
              <button
                onClick={fetchUsers}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
              >
                Try Again
              </button>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <p className={palette.subtext}>
                {users.length === 0
                  ? "No users created yet."
                  : "No users match the current filters."}
              </p>
            </div>
          ) : (
            <>
              <div className="hidden lg:block overflow-x-auto">
                <table
                  className={`min-w-full divide-y ${palette.border} border`}
                >
                  <thead
                    className={theme === "dark" ? "bg-slate-900" : "bg-gray-50"}
                  >
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        User Details
                      </th>
                      {showAccessRoles && (
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                          Access & Projects
                        </th>
                      )}
                      {showAccessRoles && (
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                          Roles
                        </th>
                      )}
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody
                    className={theme === "dark" ? "bg-slate-800" : "bg-white"}
                  >
                    {filteredUsers.map((user) => (
                      <tr
                        key={user.id}
                        className={
                          theme === "dark"
                            ? "hover:bg-slate-700"
                            : "hover:bg-gray-50"
                        }
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                                {(user.username || "?").charAt(0).toUpperCase()}
                              </div>
                            </div>
                            <div className="ml-4">
                              <div
                                className={`text-sm font-medium ${palette.text}`}
                              >
                                {user.username}
                              </div>
                              {user.email && (
                                <div className="text-sm text-gray-500">
                                  {user.email}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {showAccessRoles && (
                          <td className="px-6 py-4">
                            {user.accesses && user.accesses.length > 0 ? (
                              <div className="space-y-1">
                                {user.accesses
                                  .slice(0, 2)
                                  .map((access, index) => (
                                    <div key={index} className="text-sm">
                                      <span className="font-medium text-gray-900">
                                        {access.project_name ||
                                          getProjectNameById(access.project_id)}
                                      </span>
                                      <div className="text-xs text-gray-500">
                                        Purpose: {getPurposeLabel(access)} |{" "}
                                        {fmtStage(access)} |{" "}
                                        {getScopeLabel(access)}
                                      </div>
                                    </div>
                                  ))}
                                {user.accesses.length > 2 && (
                                  <div className="text-xs text-blue-600">
                                    +{user.accesses.length - 2} more
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-sm text-gray-500">
                                No access assigned
                              </span>
                            )}
                          </td>
                        )}

                        {showAccessRoles && (
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1">
                              {user.accesses && user.accesses.length > 0 ? (
                                (() => {
                                  const allRoles = new Set();
                                  user.accesses.forEach((access) => {
                                    access.roles?.forEach((role) => {
                                      if (role?.role) allRoles.add(role.role);
                                    });
                                  });

                                  return Array.from(allRoles)
                                    .slice(0, 4)
                                    .map((role) => (
                                      <span
                                        key={role}
                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(
                                          role,
                                        )}`}
                                      >
                                        {role}
                                      </span>
                                    ));
                                })()
                              ) : (
                                <span className="text-sm text-gray-500">
                                  No roles
                                </span>
                              )}
                            </div>
                          </td>
                        )}

                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              user.has_access
                                ? theme === "dark"
                                  ? "bg-green-900 text-green-300"
                                  : "bg-green-100 text-green-800"
                                : theme === "dark"
                                  ? "bg-red-900 text-red-300"
                                  : "bg-red-100 text-red-800"
                            }`}
                          >
                            {user.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleEditUser(user.id)}
                              className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded text-xs"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleManageAccess(user.id)}
                              className="text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 px-2 py-1 rounded text-xs"
                            >
                              Access
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-2 py-1 rounded text-xs"
                            >
                              {user.has_access ? "Disable" : "Enable"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="lg:hidden">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className={`border-b ${palette.border} p-4`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold mr-3">
                          {(user.username || "?").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className={`font-medium ${palette.text}`}>
                            {user.username}
                          </div>
                          {user.email && (
                            <div className="text-sm text-gray-500">
                              {user.email}
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => toggleRowExpansion(user.id)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {expandedRows[user.id] ? "▲" : "▼"}
                      </button>
                    </div>

                    {!isSuperAdmin && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {user.accesses && user.accesses.length > 0 ? (
                          (() => {
                            const allRoles = new Set();
                            user.accesses.forEach((access) => {
                              access.roles?.forEach((role) => {
                                if (role?.role) allRoles.add(role.role);
                              });
                            });
                            return Array.from(allRoles)
                              .slice(0, 3)
                              .map((role) => (
                                <span
                                  key={role}
                                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(
                                    role,
                                  )}`}
                                >
                                  {role}
                                </span>
                              ));
                          })()
                        ) : (
                          <span className="text-sm text-gray-500">
                            No roles
                          </span>
                        )}
                      </div>
                    )}

                    {expandedRows[user.id] && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="mb-2">
                          <span className="text-sm font-medium">Status: </span>
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              user.has_access
                                ? theme === "dark"
                                  ? "bg-green-900 text-green-300"
                                  : "bg-green-100 text-green-800"
                                : theme === "dark"
                                  ? "bg-red-900 text-red-300"
                                  : "bg-red-100 text-red-800"
                            }`}
                          >
                            {user.has_access ? "Active" : "Inactive"}
                          </span>
                        </div>

                        {!isSuperAdmin &&
                          user.accesses &&
                          user.accesses.length > 0 && (
                            <div className="mb-3">
                              <div className="text-sm font-medium mb-1">
                                Project Access:
                              </div>
                              {user.accesses.map((access, index) => (
                                <div
                                  key={index}
                                  className="text-sm text-gray-600 ml-2"
                                >
                                  • {getAccessLabel(access)}
                                </div>
                              ))}
                            </div>
                          )}

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditUser(user.id)}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleManageAccess(user.id)}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm"
                          >
                            Manage Access
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm"
                          >
                            {user.has_access ? "Disable" : "Enable"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {!loading && !error && (
          <div className={`mt-4 text-sm ${palette.subtext} text-center`}>
            Showing {filteredUsers.length} of {users.length} users
          </div>
        )}
      </main>

      {editOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div
            className={`w-full max-w-2xl rounded-2xl ${palette.card} ${palette.shadow} border ${palette.border}`}
          >
            <div className="p-6 border-b border-gray-200">
              <h3 className={`text-xl font-semibold ${palette.text}`}>
                Edit User
              </h3>
            </div>

            <div className="p-6 space-y-4">
              {editErr && (
                <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">
                  {editErr}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${palette.text}`}
                  >
                    Username
                  </label>
                  <input
                    className={`w-full px-3 py-2 rounded-lg ${palette.input} ${palette.border} border`}
                    value={editForm.username}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        username: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${palette.text}`}
                  >
                    Email
                  </label>
                  <input
                    className={`w-full px-3 py-2 rounded-lg ${palette.input} ${palette.border} border`}
                    value={editForm.email}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${palette.text}`}
                  >
                    First Name
                  </label>
                  <input
                    className={`w-full px-3 py-2 rounded-lg ${palette.input} ${palette.border} border`}
                    value={editForm.first_name}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        first_name: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${palette.text}`}
                  >
                    Last Name
                  </label>
                  <input
                    className={`w-full px-3 py-2 rounded-lg ${palette.input} ${palette.border} border`}
                    value={editForm.last_name}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        last_name: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${palette.text}`}
                  >
                    Phone Number
                  </label>
                  <input
                    className={`w-full px-3 py-2 rounded-lg ${palette.input} ${palette.border} border`}
                    value={editForm.phone_number}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        phone_number: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${palette.text}`}
                  >
                    User Type *
                  </label>
                  <select
                    className={`w-full px-3 py-2 rounded-lg ${palette.input} ${palette.border} border`}
                    value={editForm.user_type}
                    onChange={handleEditUserTypeChange}
                  >
                    <option value="INTERNAL">Internal</option>
                    <option value="EXTERNAL">External</option>
                  </select>
                </div>
                {editForm.user_type === "EXTERNAL" && (
                  <div>
                    <label
                      className={`block text-sm font-medium mb-1 ${palette.text}`}
                    >
                      Name of Contractor *
                    </label>
                    <input
                      className={`w-full px-3 py-2 rounded-lg ${palette.input} ${palette.border} border`}
                      value={editForm.contractor_name}
                      onChange={(e) =>
                        setEditForm((p) => ({
                          ...p,
                          contractor_name: e.target.value,
                        }))
                      }
                      placeholder="Enter Contractor Name"
                    />
                  </div>
                )}
                <div
                  className={`mb-4 p-3 rounded-lg ${
                    theme === "dark" ? "bg-slate-900" : "bg-gray-50"
                  } ${palette.border} border`}
                >
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={safetyOfficerDraft}
                      onChange={(e) => setSafetyOfficerDraft(e.target.checked)}
                    />
                    <div>
                      <div className={`text-sm font-semibold ${palette.text}`}>
                        Is Safety Officer
                      </div>
                      <div className={`text-xs ${palette.subtext}`}>
                        Enable this if the user belongs to safety
                        workflow/users.
                      </div>
                    </div>
                  </label>
                </div>
                <div className="md:col-span-2">
                <label className={`block text-sm font-medium mb-1 ${palette.text}`}>
                  User Groups
                </label>
                <div
                  className={`grid grid-cols-2 md:grid-cols-3 gap-2 p-3 rounded-lg ${
                    theme === "dark" ? "bg-slate-900" : "bg-gray-50"
                  } ${palette.border} border`}
                >
                  {availableGroups.length > 0 ? (
                    availableGroups.map((g) => (
                      <label
                        key={g.id}
                        className={`flex items-center gap-2 text-sm rounded-md px-2 py-1 ${
                          theme === "dark"
                            ? "hover:bg-slate-800"
                            : "hover:bg-white"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={editForm.group_ids?.includes(g.id)}
                          onChange={(e) => {
                            const checked = e.target.checked;

                            setEditForm((prev) => {
                              const currentGroups = prev.group_ids || [];

                              if (checked) {
                                return {
                                  ...prev,
                                  group_ids: [...currentGroups, g.id],
                                };
                              }

                              return {
                                ...prev,
                                group_ids: currentGroups.filter(
                                  (id) => id !== g.id,
                                ),
                              };
                            });
                          }}
                        />

                        <span className={palette.text}>{g.name || g.code}</span>
                      </label>
                    ))
                  ) : (
                    <div className={`text-sm ${palette.subtext} col-span-full`}>
                      No user groups available.
                    </div>
                  )}
                </div>
                </div>
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${palette.text}`}
                  >
                    New Password
                  </label>
                  <input
                    type="password"
                    className={`w-full px-3 py-2 rounded-lg ${palette.input} ${palette.border} border`}
                    value={editForm.new_password}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        new_password: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${palette.text}`}
                  >
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    className={`w-full px-3 py-2 rounded-lg ${palette.input} ${palette.border} border`}
                    value={editForm.confirm_password}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        confirm_password: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={closeEdit}
                className="px-4 py-2 rounded-lg border border-gray-300"
                disabled={editSaving}
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
                disabled={editSaving}
              >
                {editSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {accessOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-auto">
          <div
            className={`w-full max-w-7xl rounded-2xl ${palette.card} ${palette.shadow} border ${palette.border}`}
          >
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className={`text-xl font-semibold ${palette.text}`}>
                  Manage Access
                </h3>
                <div className={`text-sm mt-1 ${palette.subtext}`}>
                  User:{" "}
                  <span className="font-medium">{accessUser?.username}</span>
                </div>
              </div>
              <button
                onClick={closeAccessModal}
                className="px-3 py-2 rounded-lg border border-gray-300"
              >
                Close
              </button>
            </div>

            <div className="p-6">
              {accessErr && (
                <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 mb-4">
                  {accessErr}
                </div>
              )}

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 space-y-6">
                  <div
                    className={`rounded-xl border ${palette.border} p-4 ${theme === "dark" ? "bg-slate-900" : "bg-gray-50"}`}
                  >
                    <h4 className={`font-semibold mb-4 ${palette.text}`}>
                      Create / Update Access
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label
                          className={`block text-sm font-medium mb-2 ${palette.text}`}
                        >
                          Project
                        </label>
                        <select
                          className={`w-full px-3 py-2 rounded-lg ${palette.input} ${palette.border} border`}
                          value={selectedProjectId}
                          onChange={(e) => handleProjectChange(e.target.value)}
                        >
                          <option value="">Select Project</option>
                          {/* {allowedProjects.map((p) => (
                            <option key={p.id} value={String(p.id)}>
                              {p.name}
                            </option>
                          ))} */}

                          {projectFilterOptions.map((p) => (
                            <option key={p.id} value={String(p.id)}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label
                          className={`block text-sm font-medium mb-2 ${palette.text}`}
                        >
                          Active
                        </label>
                        <select
                          className={`w-full px-3 py-2 rounded-lg ${palette.input} ${palette.border} border`}
                          value={String(accessActiveDraft)}
                          onChange={(e) =>
                            setAccessActiveDraft(e.target.value === "true")
                          }
                        >
                          <option value="true">Yes</option>
                          <option value="false">No</option>
                        </select>
                      </div>
                    </div>

                    {/* <div className="mt-5">
                      <label
                        className={`block text-sm font-medium mb-1 ${palette.text}`}
                      >
                        Building
                      </label>
                      <select
                        value={selectedBuildingId}
                        onChange={(e) => setSelectedBuildingId(e.target.value)}
                        disabled={!selectedProjectId}
                        className={`w-full rounded-lg border px-3 py-2 ${palette.input}`}
                      >
                        <option value="">Select Building</option>
                        {buildingOptions.map((building) => (
                          <option key={building.id} value={building.id}>
                            {building.name}
                          </option>
                        ))}
                      </select>
                    </div> */}
                    <div className="mt-5">
                      <label
                        className={`block text-sm font-medium mb-1 ${palette.text}`}
                      >
                        Building
                      </label>
                      <select
                        value={selectedBuildingIds[0]}
                        onChange={(e) =>
                          setSelectedBuildingIds([e.target.value])
                        }
                        disabled={!selectedProjectId}
                        className={`w-full rounded-lg border px-3 py-2 ${palette.input}`}
                      >
                        <option value="">Select Building</option>
                        {buildingOptions.map((building) => (
                          <option key={building.id} value={building.id}>
                            {building.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {selectedProjectId && (
                      <>
                        <div className="mt-5">
                          <label
                            className={`block text-sm font-medium mb-2 ${palette.text}`}
                          >
                            Purpose
                          </label>
                          <select
                            className={`w-full px-3 py-2 rounded-lg ${palette.input} ${palette.border} border`}
                            value={selectedPurposeId}
                            onChange={(e) =>
                              handlePurposeChange(e.target.value)
                            }
                          >
                            <option value="">Select Purpose</option>
                            {purposeOptions.map((item) => (
                              <option key={item.id} value={String(item.id)}>
                                {item.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="mt-5">
                          <label
                            className={`block text-sm font-medium mb-2 ${palette.text}`}
                          >
                            Phase
                          </label>
                          <select
                            className={`w-full px-3 py-2 rounded-lg ${palette.input} ${palette.border} border`}
                            value={selectedPhaseId}
                            onChange={(e) => handlePhaseChange(e.target.value)}
                            disabled={!selectedPurposeId}
                          >
                            <option value="">Select Phase</option>
                            {phaseOptions.map((item) => (
                              <option key={item.id} value={String(item.id)}>
                                {item.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        {/* 
                        <div className="mt-5">
                          <div className="flex items-center justify-between mb-2">
                            <label
                              className={`block text-sm font-medium ${palette.text}`}
                            >
                              Stage (Multiple)
                            </label>
                            <button
                              type="button"
                              onClick={() =>
                                toggleSelectAll(
                                  stageOptions,
                                  selectedStageIds,
                                  setSelectedStageIds,
                                )
                              }
                              className="text-xs px-3 py-1 rounded border border-gray-300 hover:bg-gray-100"
                              disabled={stageOptions.length === 0}
                            >
                              {allStagesSelected ? "Clear All" : "Select All"}
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {stageOptions.length === 0 ? (
                              <div className={`text-sm ${palette.subtext}`}>
                                Select phase first or no stages found.
                              </div>
                            ) : (
                              stageOptions.map((item) => {
                                const checked = selectedStageIds.includes(
                                  String(item.id),
                                );
                                return (
                                  <label
                                    key={item.id}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${palette.border}`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={() =>
                                        handleStageToggle(item.id)
                                      }
                                    />
                                    <span className={palette.text}>
                                      {item.name}
                                    </span>
                                  </label>
                                );
                              })
                            )}
                          </div>
                        </div> */}
                        {selectedPhaseId && (
                          <div className="mt-5">
                            <div className="flex items-center justify-between mb-2">
                              <label
                                className={`block text-sm font-medium ${palette.text}`}
                              >
                                Stage (Multiple)
                              </label>
                              <button
                                type="button"
                                onClick={() =>
                                  toggleSelectAll(
                                    stageOptions,
                                    selectedStageIds,
                                    setSelectedStageIds,
                                  )
                                }
                                className="text-xs px-3 py-1 rounded border border-gray-300 hover:bg-gray-100"
                                disabled={stageOptions.length === 0}
                              >
                                {allStagesSelected ? "Clear All" : "Select All"}
                              </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {stageOptions.length === 0 ? (
                                <div className={`text-sm ${palette.subtext}`}>
                                  No stages found.
                                </div>
                              ) : (
                                stageOptions.map((item) => {
                                  const checked = selectedStageIds.includes(
                                    String(item.id),
                                  );
                                  return (
                                    <label
                                      key={item.id}
                                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${palette.border}`}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() =>
                                          handleStageToggle(item.id)
                                        }
                                      />
                                      <span className={palette.text}>
                                        {item.name}
                                      </span>
                                    </label>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        )}

                        <div className="mt-5">
                          <div className="flex items-center justify-between mb-2">
                            <label
                              className={`block text-sm font-medium ${palette.text}`}
                            >
                              Category (Multiple)
                            </label>
                            <button
                              type="button"
                              onClick={toggleSelectAllCategories}
                              className="text-xs px-3 py-1 rounded border border-gray-300 hover:bg-gray-100"
                              disabled={categoryOptions.length === 0}
                            >
                              {allCategoriesSelected
                                ? "Clear All"
                                : "Select All"}
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {categoryOptions.length === 0 ? (
                              <div className={`text-sm ${palette.subtext}`}>
                                No categories found.
                              </div>
                            ) : (
                              categoryOptions.map((item) => {
                                const checked = selectedCategoryIds.includes(
                                  String(item.id),
                                );
                                return (
                                  <label
                                    key={item.id}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${palette.border}`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={() =>
                                        handleCategoryToggle(item.id)
                                      }
                                    />
                                    <span className={palette.text}>
                                      {item.name}
                                    </span>
                                  </label>
                                );
                              })
                            )}
                          </div>
                        </div>
                      </>
                    )}

                    <div className="mt-5">
                      <label
                        className={`block text-sm font-medium mb-2 ${palette.text}`}
                      >
                        Role
                      </label>
                      <select
                        className={`w-full px-3 py-2 rounded-lg ${palette.input} ${palette.border} border`}
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value)}
                      >
                        <option value="">Select Role</option>
                        {ROLE_OPTIONS.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="mt-6 flex items-center justify-between gap-3 flex-wrap">
                      <div className={`text-sm ${palette.subtext}`}>
                        Same role updates matching access. Different role
                        creates a new access.
                      </div>
                      <button
                        type="button"
                        onClick={saveAccessAndRoles}
                        disabled={!canSaveAccess || accessSaving}
                        className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
                      >
                        {accessSaving ? "Saving..." : "Save Access"}
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <div
                    className={`rounded-xl border ${palette.border} p-4 ${theme === "dark" ? "bg-slate-900" : "bg-gray-50"}`}
                  >
                    <h4 className={`font-semibold mb-4 ${palette.text}`}>
                      Existing Access Rows
                    </h4>

                    {accessOptions.length === 0 ? (
                      <div className={`text-sm ${palette.subtext}`}>
                        No access rows found for this user under the logged-in
                        user's allowed projects.
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
                        {accessOptions.map((access) => {
                          const isSelected =
                            String(selectedAccessId || "") ===
                            String(access.id);

                          // return (
                          // <button
                          //   key={access.id}
                          //   type="button"
                          //   onClick={() => populateFromAccess(access)}
                          //   className={`w-full text-left rounded-xl border p-3 transition ${
                          //     isSelected
                          //       ? theme === "dark"
                          //         ? "border-blue-500 bg-slate-800"
                          //         : "border-blue-500 bg-blue-50"
                          //       : theme === "dark"
                          //         ? "border-slate-700 bg-slate-800 hover:bg-slate-700"
                          //         : "border-gray-200 bg-white hover:bg-gray-50"
                          //   }`}
                          // >
                          //   <div className="flex items-start justify-between gap-3">
                          //     <div>
                          //       <div
                          //         className={`font-semibold ${palette.text}`}
                          //       >
                          //         {access.project_name ||
                          //           getProjectNameById(access.project_id)}
                          //       </div>
                          //       <div
                          //         className={`text-xs mt-1 ${palette.subtext}`}
                          //       >
                          //         Purpose: {getPurposeLabel(access)}
                          //       </div>
                          //       <div
                          //         className={`text-xs mt-1 ${palette.subtext}`}
                          //       >
                          //         {fmtStage(access)}
                          //       </div>
                          //       <div
                          //         className={`text-xs mt-1 ${palette.subtext}`}
                          //       >
                          //         Scope: {getScopeLabel(access)}
                          //       </div>
                          //       <div
                          //         className={`text-xs mt-1 ${palette.subtext}`}
                          //       >
                          //         Active: {access.active ? "Yes" : "No"}
                          //       </div>
                          //     </div>

                          //     <div className="flex flex-wrap gap-1 justify-end max-w-[45%]">
                          //       {(access.roles || []).length > 0 ? (
                          //         access.roles.map((roleObj, idx) => (
                          //           <span
                          //             key={`${access.id}-${roleObj?.role || idx}`}
                          //             className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${getRoleColor(
                          //               roleObj?.role,
                          //             )}`}
                          //           >
                          //             {roleObj?.role}
                          //           </span>
                          //         ))
                          //       ) : (
                          //         <span className="text-xs text-gray-500">
                          //           No roles
                          //         </span>
                          //       )}
                          //     </div>
                          //   </div>
                          // </button>
                          return (
                            <div
                              key={access.id}
                              className={`rounded-xl border p-3 transition ${
                                isSelected
                                  ? theme === "dark"
                                    ? "border-blue-500 bg-slate-800"
                                    : "border-blue-500 bg-blue-50"
                                  : theme === "dark"
                                    ? "border-slate-700 bg-slate-800"
                                    : "border-gray-200 bg-white"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <button
                                  type="button"
                                  onClick={() => populateFromAccess(access)}
                                  className="flex-1 text-left"
                                >
                                  <div>
                                    <div
                                      className={`font-semibold ${palette.text}`}
                                    >
                                      {access.project_name ||
                                        getProjectNameById(access.project_id)}
                                    </div>
                                    <div
                                      className={`text-xs mt-1 ${palette.subtext}`}
                                    >
                                      Purpose: {getPurposeLabel(access)}
                                    </div>
                                    <div
                                      className={`text-xs mt-1 ${palette.subtext}`}
                                    >
                                      {fmtStage(access)}
                                    </div>
                                    <div
                                      className={`text-xs mt-1 ${palette.subtext}`}
                                    >
                                      Scope: {getScopeLabel(access)}
                                    </div>
                                    <div
                                      className={`text-xs mt-1 ${palette.subtext}`}
                                    >
                                      Active: {access.active ? "Yes" : "No"}
                                    </div>
                                  </div>
                                </button>

                                <div className="flex flex-col items-end gap-2 max-w-[45%]">
                                  <div className="flex flex-wrap gap-1 justify-end">
                                    {(access.roles || []).length > 0 ? (
                                      access.roles.map((roleObj, idx) => (
                                        <span
                                          key={`${access.id}-${roleObj?.role || idx}`}
                                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${getRoleColor(roleObj?.role)}`}
                                        >
                                          {roleObj?.role}
                                        </span>
                                      ))
                                    ) : (
                                      <span className="text-xs text-gray-500">
                                        No roles
                                      </span>
                                    )}
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleDeleteAccess(access.id)
                                    }
                                    disabled={
                                      deleteAccessLoadingId ===
                                      String(access.id)
                                    }
                                    className="px-3 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs disabled:opacity-50"
                                  >
                                    {deleteAccessLoadingId === String(access.id)
                                      ? "Deleting..."
                                      : "Delete Access"}
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default UsersManagement;
