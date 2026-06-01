// ProjectDetailsPage.jsx — ✅ Tower checklist badge + ✅ Modal + ✅ Initialize
// ✅ YES/NO → Verify API (checker/supervisor)
// ✅ Maker Submit → done-maker API
// ✅ Role dropdown removed → role is read from localStorage
// ✅ FIXED: init-context now triggers on phase select for initializer
// ✅ FIXED: phase-aware cache updates
// ✅ FIXED: fetchMeta helper moved to component scope
// ✅ FIXED: initializer role detection unified

import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import projectImage from "../Images/Project.png";
import toast from "react-hot-toast";
import axios from "axios";
import { useTheme } from "../ThemeContext";
import { projectInstance } from "../api/axiosInstance";

const ProjectDetailsPage = () => {
  const { theme } = useTheme();

  const ORANGE = "#ffbe63";
  const BG_OFFWHITE = "#fcfaf7";
  const bgColor = theme === "dark" ? "#191922" : BG_OFFWHITE;
  const cardColor = theme === "dark" ? "#23232c" : "#fff";
  const borderColor = ORANGE;
  const textColor = theme === "dark" ? "#fff" : "#222";

  const CHECKLIST_API_URL =
    "https://konstruct.world/checklists/transfer-getchchklist/";
  const START_CHECKLIST_API_BASE =
    "https://konstruct.world/checklists/start-checklist/";
  const VERIFY_ITEM_API_URL =
    "https://konstruct.world/checklists/Decsion-makeing-forSuer-Inspector/";
  const DONE_MAKER_API_URL = "https://konstruct.world/checklists/done-maker/";
  const INIT_CONTEXT_API_URL =
    "https://konstruct.world/checklists/init-context/";
  const CREATE_LIVE_CHECKLIST_API_URL =
    "https://konstruct.world/checklists/create-live-checklist-from-template/";

  const { id: projectIdFromUrl } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [towerChecklistMeta, setTowerChecklistMeta] = useState({});
  const [towerChecklistDetails, setTowerChecklistDetails] = useState({});

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTower, setActiveTower] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");
  const [modalData, setModalData] = useState(null);

  const [startingById, setStartingById] = useState({});
  const [remarkByItemId, setRemarkByItemId] = useState({});
  const [verifyingKey, setVerifyingKey] = useState({});
  const [makerFilesByItemId, setMakerFilesByItemId] = useState({});
  const [makerSubmittingByItemId, setMakerSubmittingByItemId] = useState({});

  const [phaseList, setPhaseList] = useState([]);
  const [selectedPhaseByTower, setSelectedPhaseByTower] = useState({});
  const [projectLevelData, setProjectLevelData] = useState([]);

  const SELECTED_PROJECT_KEY = "SELECTED_PROJECT";

  const safeJsonParse = (s) => {
    try {
      return JSON.parse(s);
    } catch {
      return null;
    }
  };

  const getStoredSelectedProject = () => {
    try {
      const raw = localStorage.getItem(SELECTED_PROJECT_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  const storedProject = getStoredSelectedProject();
  const projectFromState = location.state?.project || storedProject;

  const projectId =
    projectFromState?.id || projectFromState?.project_id || projectIdFromUrl;

  const projectNameInitial =
    projectFromState?.name || projectFromState?.project_name || "";

  const projectImg =
    projectFromState?.image || projectFromState?.image_url || projectImage;

  const [projectName, setProjectName] = useState(projectNameInitial);

  const getPhaseStorageKey = (pid, towerId) =>
    `SELECTED_PHASE_${pid}_${towerId}`;

  const getSavedPhaseForTower = (pid, towerId) => {
    try {
      return localStorage.getItem(getPhaseStorageKey(pid, towerId)) || "";
    } catch {
      return "";
    }
  };

  const savePhaseForTower = (pid, towerId, phaseId) => {
    try {
      localStorage.setItem(
        getPhaseStorageKey(pid, towerId),
        String(phaseId || ""),
      );
    } catch {}
  };

  // const normalizeRole = (raw) => {
  //   const s = String(raw || "").trim();
  //   if (!s) return "";

  //   const up = s.toUpperCase();

  //   if (up === "MAKER") return "maker";
  //   if (up === "CHECKER") return "checker";
  //   if (up === "INSPECTOR") return "checker";
  //   if (up === "SUPERVISOR") return "supervisor";

  //   // support both correct and legacy typo spellings
  //   if (
  //     up === "INITIALIZER" ||
  //     up === "INITIALISER" ||
  //     up === "INTIALIZER" ||
  //     up === "INTIALISER"
  //   ) {
  //     return "initializer";
  //   }

  //   const low = s.toLowerCase();
  //   if (["maker", "checker", "supervisor", "initializer"].includes(low)) {
  //     return low;
  //   }

  //   return "";
  // };

  // const getActiveRoleFromStorage = () => {
  //   const r1 = normalizeRole(localStorage.getItem("FLOW_ROLE"));
  //   if (r1) return r1;

  //   const r2 = normalizeRole(localStorage.getItem("ROLE"));
  //   if (r2) return r2;

  //   const userData = safeJsonParse(localStorage.getItem("USER_DATA"));
  //   const r3 = normalizeRole(userData?.roles?.[0]);
  //   if (r3) return r3;

  //   const pr = safeJsonParse(localStorage.getItem("persist:root"));
  //   const userState = safeJsonParse(pr?.user);
  //   const roles =
  //     userState?.user?.roles ||
  //     userState?.roles ||
  //     userState?.user?.user?.roles ||
  //     userState?.user?.user?.roles;

  //   const r4 = normalizeRole(Array.isArray(roles) ? roles[0] : roles);
  //   if (r4) return r4;

  //   return "checker";
  // };

  // const [activeRoleId, setActiveRoleId] = useState(() =>
  //   getActiveRoleFromStorage()
  // );

  // const refreshRoleFromStorage = () => {
  //   setActiveRoleId(getActiveRoleFromStorage());
  // };

  // const isInitializerRole = () => getActiveRoleFromStorage() === "initializer";

  const getProjectRoleStorageKey = (pid) => `ACTIVE_ROLE_${pid}`;

  const normalizeRole = (raw) => {
    const s = String(raw || "").trim();
    if (!s) return "";

    const up = s.toUpperCase();

    if (up === "MAKER") return "maker";
    if (up === "CHECKER") return "checker";
    if (up === "INSPECTOR") return "checker";
    if (up === "SUPERVISOR") return "supervisor";

    if (
      up === "INITIALIZER" ||
      up === "INITIALISER" ||
      up === "INTIALIZER" ||
      up === "INTIALISER"
    ) {
      return "intializer";
    }

    const low = s.toLowerCase();
    if (["maker", "checker", "supervisor", "initializer"].includes(low)) {
      return low;
    }

    return "";
  };

  const getActiveRoleFromStorage = (pid = projectId) => {
    const projectRole = normalizeRole(
      localStorage.getItem(getProjectRoleStorageKey(pid)),
    );
    if (projectRole) return projectRole;

    const flowRole = normalizeRole(localStorage.getItem("FLOW_ROLE"));
    if (flowRole) return flowRole;

    const role = normalizeRole(localStorage.getItem("ROLE"));
    if (role) return role;

    const userData = safeJsonParse(localStorage.getItem("USER_DATA"));
    const userRole = normalizeRole(userData?.roles?.[0]);
    if (userRole) return userRole;

    const pr = safeJsonParse(localStorage.getItem("persist:root"));
    const userState = safeJsonParse(pr?.user);
    const roles =
      userState?.user?.roles ||
      userState?.roles ||
      userState?.user?.user?.roles ||
      userState?.user?.user?.roles;

    const persistedRole = normalizeRole(
      Array.isArray(roles) ? roles[0] : roles,
    );
    if (persistedRole) return persistedRole;

    return "checker";
  };

  const [activeRoleId, setActiveRoleId] = useState(() =>
    getActiveRoleFromStorage(projectId),
  );

  const refreshRoleFromStorage = (pid = projectId) => {
    setActiveRoleId(getActiveRoleFromStorage(pid));
  };

  const isInitializerRole = () =>
    getActiveRoleFromStorage(projectId) === "intializer";

  useEffect(() => {
    if (!projectId) return;
    refreshRoleFromStorage(projectId);
  }, [projectId]);
  const token = localStorage.getItem("ACCESS_TOKEN");

  const authHeaders = useMemo(() => {
    if (!token) return {};
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  }, [token]);

  const authOnlyHeaders = useMemo(() => {
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
  }, [token]);

  const purposeId =
    location.state?.purposeId ||
    localStorage.getItem("PURPOSE_ID") ||
    localStorage.getItem("purpose_id");

  const fmtDateTime = (v) => {
    if (!v) return "-";
    try {
      return new Date(v).toLocaleString("en-IN");
    } catch {
      return String(v);
    }
  };

  const getTowerPhaseCacheKey = (towerId, phaseId) =>
    `${towerId}_${phaseId || "all"}`;

  const getSelectedPhaseIdForTower = (towerId, overridePhaseId = null) =>
    overridePhaseId ??
    selectedPhaseByTower[towerId] ??
    getSavedPhaseForTower(projectId, towerId) ??
    "";

  const getActiveTowerCacheKey = (towerId, overridePhaseId = null) => {
    const phaseId = getSelectedPhaseIdForTower(towerId, overridePhaseId);
    return getTowerPhaseCacheKey(towerId, phaseId);
  };

  // const flattenChecklists = (apiData) => {
  //   const results = Array.isArray(apiData?.results) ? apiData.results : [];
  //   const flattened = [];

  //   for (const r of results) {
  //     const legacy = Array.isArray(r?.checklists) ? r.checklists : [];
  //     const available = Array.isArray(r?.available_for_me)
  //       ? r.available_for_me
  //       : [];
  //     const assigned = Array.isArray(r?.assigned_to_me) ? r.assigned_to_me : [];

  //     for (const c of [...available, ...assigned, ...legacy]) {
  //       if (c && c.id != null) flattened.push(c);
  //     }
  //   }

  //   return flattened;
  // };

  const flattenChecklists = (apiData) => {
    const results = Array.isArray(apiData?.results) ? apiData.results : [];
    const flattened = [];

    for (const r of results) {
      // Case 1: direct checklist row
      if (r && r.id != null && Array.isArray(r.items)) {
        flattened.push(r);
        continue;
      }

      // Case 2: grouped response row
      const legacy = Array.isArray(r?.checklists) ? r.checklists : [];
      const available = Array.isArray(r?.available_for_me)
        ? r.available_for_me
        : [];
      const assigned = Array.isArray(r?.assigned_to_me) ? r.assigned_to_me : [];

      for (const c of [...available, ...assigned, ...legacy]) {
        if (c && c.id != null) flattened.push(c);
      }
    }

    return flattened;
  };

  const applyChecklistUpdateIntoTransferResponse = (data, updatedChecklist) => {
    if (!data || !updatedChecklist?.id) return data;

    const next = { ...data };
    if (!Array.isArray(next.results)) return next;

    const patchArr = (arr) =>
      Array.isArray(arr)
        ? arr.map((c) =>
            c?.id === updatedChecklist.id ? { ...c, ...updatedChecklist } : c,
          )
        : arr;

    next.results = next.results.map((group) => {
      if (!group || typeof group !== "object") return group;

      return {
        ...group,
        available_for_me: patchArr(group.available_for_me),
        assigned_to_me: patchArr(group.assigned_to_me),
        checklists: patchArr(group.checklists),
      };
    });

    return next;
  };

  const applyItemUpdateIntoTransferResponse = (data, patch) => {
    if (!data || !patch?.item_id) return data;

    const next = { ...data };
    if (!Array.isArray(next.results)) return next;

    const patchItemsArr = (items) =>
      Array.isArray(items)
        ? items.map((it) =>
            it?.id === patch.item_id
              ? { ...it, status: patch.item_status }
              : it,
          )
        : items;

    const patchChecklist = (cl) => {
      if (!cl || typeof cl !== "object") return cl;

      const newCl = {
        ...cl,
        status: patch.checklist_status ?? cl.status,
      };

      if (Array.isArray(newCl.items)) {
        newCl.items = patchItemsArr(newCl.items);
      }
      return newCl;
    };

    const patchArr = (arr) =>
      Array.isArray(arr) ? arr.map(patchChecklist) : arr;

    next.results = next.results.map((group) => {
      if (!group || typeof group !== "object") return group;
      return {
        ...group,
        available_for_me: patchArr(group.available_for_me),
        assigned_to_me: patchArr(group.assigned_to_me),
        checklists: patchArr(group.checklists),
      };
    });

    return next;
  };

  const applyMakerDoneIntoTransferResponse = (data, payload) => {
    const item = payload?.item;
    if (!data || !item?.id) return data;

    const next = { ...data };
    if (!Array.isArray(next.results)) return next;

    const patchItemsArr = (items) =>
      Array.isArray(items)
        ? items.map((it) =>
            it?.id === item.id ? { ...it, status: item.status } : it,
          )
        : items;

    const patchChecklist = (cl) => {
      if (!cl || typeof cl !== "object") return cl;

      if (cl?.id === item.checklist) {
        const newCl = { ...cl };
        if (Array.isArray(newCl.items))
          newCl.items = patchItemsArr(newCl.items);
        if (payload?.checklist_status) newCl.status = payload.checklist_status;
        return newCl;
      }

      const newCl = { ...cl };
      if (Array.isArray(newCl.items)) newCl.items = patchItemsArr(newCl.items);
      if (payload?.checklist_status) newCl.status = payload.checklist_status;
      return newCl;
    };

    const patchArr = (arr) =>
      Array.isArray(arr) ? arr.map(patchChecklist) : arr;

    next.results = next.results.map((group) => {
      if (!group || typeof group !== "object") return group;
      return {
        ...group,
        available_for_me: patchArr(group.available_for_me),
        assigned_to_me: patchArr(group.assigned_to_me),
        checklists: patchArr(group.checklists),
      };
    });

    return next;
  };

  // const fetchMetaForTower = async (towerId, phaseIdArg = null) => {
  //   try {
  //     const selectedPhaseId = getSelectedPhaseIdForTower(towerId, phaseIdArg);

  //     const res = await axios.get(CHECKLIST_API_URL, {
  //       params: {
  //         project_id: projectId,
  //         tower_id: towerId,
  //         building_id: towerId,
  //         phase_id: selectedPhaseId || undefined,
  //         limit: 1,
  //         offset: 0,
  //       },
  //       headers: authHeaders,
  //     });

  //     const d = res?.data || {};
  //     const count = Number(d?.count || 0);

  //     return {
  //       loading: false,
  //       count,
  //       hasChecklist: count > 0,
  //       error: false,
  //     };
  //   } catch {
  //     return {
  //       loading: false,
  //       count: 0,
  //       hasChecklist: false,
  //       error: true,
  //     };
  //   }
  // };

  const fetchMetaForTower = async (towerId, phaseIdArg = null) => {
    try {
      const selectedPhaseId = getSelectedPhaseIdForTower(towerId, phaseIdArg);
      const activeRole = getActiveRoleFromStorage(projectId);

      const res = await axios.get(CHECKLIST_API_URL, {
        params: {
          project_id: projectId,
          phase_id: selectedPhaseId || undefined,
          tower_id: towerId,
          building_id: towerId,
          role_id: activeRole || undefined,
          limit: 1,
          offset: 0,
        },
        headers: authHeaders,
      });

      const d = res?.data || {};
      const count = Number(d?.count || 0);

      return {
        loading: false,
        count,
        hasChecklist: count > 0,
        error: false,
      };
    } catch {
      return {
        loading: false,
        count: 0,
        hasChecklist: false,
        error: true,
      };
    }
  };

  // const ensureTowerChecklistForInitializer = async (towerId, phaseId) => {
  //   if (!isInitializerRole()) return null;
  //   if (!projectId || !towerId || !token || !phaseId) return null;

  //   const initRes = await axios.get(INIT_CONTEXT_API_URL, {
  //     params: {
  //       project_id: projectId,
  //       building_id: towerId,
  //       tower_id: towerId,
  //       phase_id: phaseId || undefined,
  //     },
  //     headers: authHeaders,
  //   });

  //   const ctx = initRes?.data || {};

  //   await axios.post(
  //     CREATE_LIVE_CHECKLIST_API_URL,
  //     {
  //       project_id: ctx.project_id || projectId,
  //       purpose_id: ctx.purpose_id,
  //       phase_id: ctx.phase_id,
  //       stage_id: ctx.stage_id,
  //       category: ctx.category,
  //       building_id: ctx.building_id || towerId,
  //       tower_id: ctx.tower_id || towerId,
  //       question_target_type: ctx.question_target_type,
  //       applicable_scope: ctx.applicable_scope,
  //       level_id: ctx.level_id || null,
  //       flat_id: ctx.flat_id || null,
  //       room_id: ctx.room_id || null,
  //       zone_id: ctx.zone_id || null,
  //     },
  //     { headers: authHeaders }
  //   );

  //   return ctx;
  // };

  const ensureTowerChecklistForInitializer = async (towerId, phaseId) => {
    if (!isInitializerRole()) return null;
    if (!projectId || !towerId || !token || !phaseId) return null;

    const initRes = await axios.get(INIT_CONTEXT_API_URL, {
      params: {
        project_id: projectId,
        building_id: towerId,
        tower_id: towerId,
        phase_id: phaseId || undefined,
      },
      headers: authHeaders,
    });

    const ctx = initRes?.data || {};

    await axios.post(
      CREATE_LIVE_CHECKLIST_API_URL,
      {
        project_id: ctx.project_id || projectId,
        purpose_id: ctx.purpose_id,
        phase_id: ctx.phase_id,
        stage_id: ctx.stage_id,

        // ❌ REMOVED CATEGORY

        building_id: ctx.building_id || towerId,
        tower_id: ctx.tower_id || towerId,

        question_target_type: ctx.question_target_type,
        applicable_scope: ctx.applicable_scope,

        level_id: null,
        flat_id: null,
        room_id: null,
        zone_id: null,
      },
      { headers: authHeaders },
    );

    return ctx;
  };

  const openChecklistModal = async (towerObj) => {
    if (!towerObj?.id) return;

    if (!token) {
      toast.error("Token missing. Please login again.");
      return;
    }

    refreshRoleFromStorage();

    const selectedPhaseId = getSelectedPhaseIdForTower(towerObj.id);
    const cacheKey = getActiveTowerCacheKey(towerObj.id);

    setIsModalOpen(true);
    setActiveTower(towerObj);
    setModalError("");

    const cached = towerChecklistDetails[cacheKey];
    if (cached?.raw && !isInitializerRole()) {
      setModalData(cached.raw);
      return;
    }

    setModalLoading(true);
    const activeRole = getActiveRoleFromStorage(projectId);
    try {
      const res = await axios.get(CHECKLIST_API_URL, {
        params: {
          project_id: projectId,
          phase_id: selectedPhaseId || undefined,
          tower_id: towerObj.id,
          building_id: towerObj.id,
          role_id: activeRole || undefined,
          limit: 50,
          offset: 0,
        },
        headers: authHeaders,
      });

      const data = res?.data || {};
      const flattened = flattenChecklists(data);

      setTowerChecklistDetails((prev) => ({
        ...prev,
        [cacheKey]: {
          fetchedAt: Date.now(),
          raw: data,
          flattenedChecklists: flattened,
          stage_history: data?.stage_history || [],
        },
      }));

      setModalData(data);
    } catch (e) {
      const msg =
        e?.response?.data?.detail ||
        e?.response?.data?.error ||
        "Could not load checklist details.";
      setModalError(msg);
    } finally {
      setModalLoading(false);
    }
  };

  // const handleTowerPhaseChange = async (towerId, phaseId) => {
  //   setSelectedPhaseByTower((prev) => ({
  //     ...prev,
  //     [towerId]: phaseId,
  //   }));

  //   savePhaseForTower(projectId, towerId, phaseId);

  //   try {
  //     if (isInitializerRole() && phaseId) {
  //       console.log("INIT CONTEXT TRIGGERED FROM PHASE SELECT", {
  //         projectId,
  //         towerId,
  //         phaseId,
  //       });

  //       await ensureTowerChecklistForInitializer(towerId, phaseId);
  //     }

  //     // const meta = await fetchMetaForTower(towerId, phaseId);
  //     // setTowerChecklistMeta((prev) => ({
  //     //   ...prev,
  //     //   [towerId]: meta,
  //     // }));

  //     const cacheKey = getTowerPhaseCacheKey(towerId, phaseId);
  //     setTowerChecklistDetails((prev) => {
  //       const next = { ...prev };
  //       delete next[cacheKey];
  //       return next;
  //     });
  //   } catch (e) {
  //     console.log("init context / phase change error", e);
  //   }

  //   if (isModalOpen && activeTower?.id === towerId) {
  //     await openChecklistModal({ id: towerId, name: activeTower?.name });
  //   }
  // };
  const handleTowerPhaseChange = async (towerId, phaseId) => {
    setSelectedPhaseByTower((prev) => ({
      ...prev,
      [towerId]: phaseId,
    }));

    savePhaseForTower(projectId, towerId, phaseId);

    try {
      if (isInitializerRole() && phaseId) {
        console.log("INIT CONTEXT TRIGGERED FROM PHASE SELECT", {
          projectId,
          towerId,
          phaseId,
        });

        // ✅ STEP 1: CREATE CHECKLISTS
        await ensureTowerChecklistForInitializer(towerId, phaseId);

        // ✅ STEP 2: FORCE REFRESH META (🔥 IMPORTANT FIX)
        const meta = await fetchMetaForTower(towerId, phaseId);

        setTowerChecklistMeta((prev) => ({
          ...prev,
          [towerId]: meta,
        }));
      }

      // ✅ STEP 3: CLEAR CACHE (already correct)
      const cacheKey = getTowerPhaseCacheKey(towerId, phaseId);
      setTowerChecklistDetails((prev) => {
        const next = { ...prev };
        delete next[cacheKey];
        return next;
      });
    } catch (e) {
      console.log("init context / phase change error", e);
    }

    // ✅ STEP 4: RELOAD MODAL IF OPEN (already correct)
    if (isModalOpen && activeTower?.id === towerId) {
      await openChecklistModal({ id: towerId, name: activeTower?.name });
    }
  };

  const handleImageClick = (towerId) => {
    const phaseId =
      selectedPhaseByTower[towerId] ||
      getSavedPhaseForTower(projectId, towerId) ||
      location.state?.phaseId ||
      localStorage.getItem("PHASE_ID") ||
      localStorage.getItem("phase_id");

    navigate(`/project/${projectId}/tower/${towerId}`, {
      state: {
        projectLevelData,
        projectId,
        towerId,
        purposeId,
        phaseId,
      },
    });
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setActiveTower(null);
    setModalLoading(false);
    setModalError("");
    setModalData(null);
    setStartingById({});
    refreshRoleFromStorage();
    setRemarkByItemId({});
    setVerifyingKey({});
    setMakerFilesByItemId({});
    setMakerSubmittingByItemId({});
  };

  useEffect(() => {
    if (!projectId) {
      navigate("/");
      return;
    }

    const fetchProjectTower = async () => {
      try {
        if (!token) {
          toast.error("Token missing. Please login again.");
          return;
        }

        const response = await projectInstance.get(
          `/buildings/by_project/${projectId}/`,
          { headers: authHeaders },
        );

        if (response.status === 200 && Array.isArray(response.data)) {
          setProjectLevelData(response.data);
        } else {
          setProjectLevelData([]);
          toast.error("Invalid or empty response from server.");
        }
      } catch {
        setProjectLevelData([]);
        toast.error("Something went wrong while fetching project levels.");
      }
    };

    fetchProjectTower();
  }, [projectId, navigate, token]);

  useEffect(() => {
    if (!projectName && projectId) {
      const fetchProjectName = async () => {
        try {
          if (!token) return;

          const response = await projectInstance.get(
            `/projects/${projectId}/`,
            {
              headers: authHeaders,
            },
          );

          if (response.status === 200 && response.data?.name) {
            setProjectName(response.data.name);
          } else {
            setProjectName(`Project ${projectId}`);
          }
        } catch {
          setProjectName(`Project ${projectId}`);
        }
      };

      fetchProjectName();
    }
  }, [projectId, projectName, token, authHeaders]);

  useEffect(() => {
    if (!projectId || !token) return;

    const fetchPhases = async () => {
      try {
        const res = await projectInstance.get(
          `/phases/by-project/${projectId}/`,
          { headers: authHeaders },
        );

        const phases = Array.isArray(res.data) ? res.data : [];
        setPhaseList(phases);

        const initialSelections = {};
        projectLevelData.forEach((tower) => {
          const saved = getSavedPhaseForTower(projectId, tower.id);
          if (saved) {
            initialSelections[tower.id] = saved;
          }
        });

        setSelectedPhaseByTower((prev) => {
          const next = { ...prev, ...initialSelections };
          const same = JSON.stringify(prev) === JSON.stringify(next);
          return same ? prev : next;
        });
      } catch {
        setPhaseList([]);
      }
    };

    fetchPhases();
  }, [projectId, token, projectLevelData, authHeaders]);

  useEffect(() => {
    if (!projectId || !projectLevelData?.length || !token) return;

    let cancelled = false;

    const init = {};
    projectLevelData.forEach((t) => {
      init[t.id] = {
        loading: true,
        count: 0,
        hasChecklist: false,
        error: false,
      };
    });
    setTowerChecklistMeta(init);

    const runWithConcurrency = async (items, limit) => {
      let idx = 0;

      const runners = new Array(Math.min(limit, items.length))
        .fill(0)
        .map(async () => {
          while (idx < items.length && !cancelled) {
            const currentIndex = idx++;
            const tower = items[currentIndex];
            const meta = await fetchMetaForTower(tower.id);
            if (cancelled) return;

            setTowerChecklistMeta((prev) => ({
              ...prev,
              [tower.id]: meta,
            }));
          }
        });

      await Promise.all(runners);
    };

    runWithConcurrency(projectLevelData, 6);

    return () => {
      cancelled = true;
    };
  }, [projectId, projectLevelData, token, authHeaders, selectedPhaseByTower]);

  const startChecklist = async (checklistId) => {
    if (!checklistId) return;
    if (!token) {
      toast.error("Token missing. Please login again.");
      return;
    }

    setStartingById((prev) => ({ ...prev, [checklistId]: true }));

    try {
      const res = await axios.post(
        `${START_CHECKLIST_API_BASE}${checklistId}/`,
        {},
        { headers: authHeaders },
      );

      const payload = res?.data || {};
      const updated = payload?.checklist;

      if (!updated?.id) {
        toast.error("Initialized, but response is missing checklist data.");
        return;
      }

      toast.success("Checklist initialized ✅");

      setModalData((prev) =>
        applyChecklistUpdateIntoTransferResponse(prev, updated),
      );

      if (activeTower?.id) {
        const cacheKey = getActiveTowerCacheKey(activeTower.id);

        setTowerChecklistDetails((prev) => {
          const current = prev[cacheKey]?.raw || modalData;
          const nextRaw = applyChecklistUpdateIntoTransferResponse(
            current,
            updated,
          );

          return {
            ...prev,
            [cacheKey]: {
              fetchedAt: Date.now(),
              raw: nextRaw,
              flattenedChecklists: flattenChecklists(nextRaw),
              stage_history: nextRaw?.stage_history || [],
            },
          };
        });
      }
    } catch (e) {
      const msg =
        e?.response?.data?.detail ||
        e?.response?.data?.error ||
        e?.message ||
        "Failed to initialize checklist.";
      toast.error(String(msg));
    } finally {
      setStartingById((prev) => ({ ...prev, [checklistId]: false }));
    }
  };

  const verifyChecklistItem = async ({ checklistItemId, option, item }) => {
    if (!checklistItemId || !option?.id) return;
    if (!token) {
      toast.error("Token missing. Please login again.");
      return;
    }

    if (activeRoleId !== "checker" && activeRoleId !== "supervisor") {
      toast.error("You are not allowed to verify in this role.");
      return;
    }

    const choice = String(option?.choice || "").toUpperCase();
    if (choice !== "P" && choice !== "N") {
      toast.error("This option is not a YES/NO action.");
      return;
    }

    const key = `${checklistItemId}:${option.id}:${activeRoleId}`;
    if (verifyingKey[key]) return;

    const itemStatus = String(item?.status || "").toLowerCase();
    if (itemStatus === "completed") {
      toast.success("Already completed ✅");
      return;
    }

    setVerifyingKey((p) => ({ ...p, [key]: true }));

    try {
      const remark = (remarkByItemId[checklistItemId] || "").trim();

      const body = {
        checklist_item_id: checklistItemId,
        role: activeRoleId,
        option_id: option.id,
      };

      if (activeRoleId === "checker") body.check_remark = remark;
      else if (activeRoleId === "supervisor") body.supervisor_remarks = remark;

      const res = await axios.patch(VERIFY_ITEM_API_URL, body, {
        headers: authHeaders,
      });

      const payload = res?.data || {};

      if (choice === "P") toast.success("Approved ✅");
      else toast.success("Rejected ✅");

      setModalData((prev) =>
        applyItemUpdateIntoTransferResponse(prev, payload),
      );

      if (activeTower?.id) {
        const cacheKey = getActiveTowerCacheKey(activeTower.id);

        setTowerChecklistDetails((prev) => {
          const current = prev[cacheKey]?.raw || modalData;
          const nextRaw = applyItemUpdateIntoTransferResponse(current, payload);

          return {
            ...prev,
            [cacheKey]: {
              fetchedAt: Date.now(),
              raw: nextRaw,
              flattenedChecklists: flattenChecklists(nextRaw),
              stage_history: nextRaw?.stage_history || [],
            },
          };
        });
      }
    } catch (e) {
      const msg =
        e?.response?.data?.detail ||
        e?.response?.data?.error ||
        e?.message ||
        "Failed to verify item.";
      toast.error(String(msg));
    } finally {
      setVerifyingKey((p) => ({ ...p, [key]: false }));
    }
  };

  // const submitMakerDone = async ({ item }) => {
  //   const checklistItemId = item?.id;
  //   if (!checklistItemId) return;

  //   if (!token) {
  //     toast.error("Token missing. Please login again.");
  //     return;
  //   }

  //   if (activeRoleId !== "maker") {
  //     toast.error("Only MAKER can submit in this screen.");
  //     return;
  //   }

  //   const st = String(item?.status || "").toLowerCase();
  //   const makerAllowed =
  //     st === "pending_for_maker" ||
  //     st === "tetmpory_maker" ||
  //     st === "temporary_maker" ||
  //     st === "rejected_by_checker";

  //   if (!makerAllowed) {
  //     toast.error("This item is not pending for maker.");
  //     return;
  //   }

  //   if (makerSubmittingByItemId[checklistItemId]) return;

  //   const remark = (remarkByItemId[checklistItemId] || "").trim();
  //   const files = makerFilesByItemId[checklistItemId] || [];

  //   if (item?.photo_required && (!files || files.length === 0)) {
  //     toast.error("Photo required. Please attach at least 1 image.");
  //     return;
  //   }

  //   setMakerSubmittingByItemId((p) => ({ ...p, [checklistItemId]: true }));

  //   try {
  //     const fd = new FormData();

  //     fd.append("checklist_item_id", String(checklistItemId));
  //     fd.append("role", "maker");
  //     fd.append("role_id", "maker");
  //     if (remark) {
  //       fd.append("maker_remarks", remark);
  //       fd.append("remark", remark);
  //     }

  //     for (const f of files) {
  //       fd.append("maker_media_multi", f);
  //     }

  //     const res = await axios.post(DONE_MAKER_API_URL, fd, {
  //       headers: {
  //         ...authOnlyHeaders,
  //       },
  //     });

  //     const payload = res?.data || {};
  //     toast.success(payload?.detail || "Submitted to checker ✅");

  //     setModalData((prev) => applyMakerDoneIntoTransferResponse(prev, payload));

  //     if (activeTower?.id) {
  //       const cacheKey = getActiveTowerCacheKey(activeTower.id);

  //       setTowerChecklistDetails((prev) => {
  //         const current = prev[cacheKey]?.raw || modalData;
  //         const nextRaw = applyMakerDoneIntoTransferResponse(current, payload);

  //         return {
  //           ...prev,
  //           [cacheKey]: {
  //             fetchedAt: Date.now(),
  //             raw: nextRaw,
  //             flattenedChecklists: flattenChecklists(nextRaw),
  //             stage_history: nextRaw?.stage_history || [],
  //           },
  //         };
  //       });
  //     }

  //     setRemarkByItemId((p) => ({ ...p, [checklistItemId]: "" }));
  //     setMakerFilesByItemId((p) => ({ ...p, [checklistItemId]: [] }));
  //   } catch (e) {
  //     const msg =
  //       e?.response?.data?.detail ||
  //       e?.response?.data?.error ||
  //       e?.message ||
  //       "Failed to submit item by maker.";
  //     toast.error(String(msg));
  //   } finally {
  //     setMakerSubmittingByItemId((p) => ({ ...p, [checklistItemId]: false }));
  //   }
  // };

  const submitMakerDone = async ({ item }) => {
    const checklistItemId = item?.id;
    if (!checklistItemId) return;

    if (!token) {
      toast.error("Token missing. Please login again.");
      return;
    }

    if (activeRoleId !== "maker") {
      toast.error("Only MAKER can submit in this screen.");
      return;
    }

    const st = String(item?.status || "").toLowerCase();
    const makerAllowed =
      st === "pending_for_maker" ||
      st === "tetmpory_maker" ||
      st === "temporary_maker" ||
      st === "rejected_by_checker";

    if (!makerAllowed) {
      toast.error("This item is not pending for maker.");
      return;
    }

    if (makerSubmittingByItemId[checklistItemId]) return;

    const remark = (remarkByItemId[checklistItemId] || "").trim();
    const files = makerFilesByItemId[checklistItemId] || [];

    if (item?.photo_required && (!files || files.length === 0)) {
      toast.error("Photo required. Please attach at least 1 image.");
      return;
    }

    setMakerSubmittingByItemId((p) => ({ ...p, [checklistItemId]: true }));

    try {
      const fd = new FormData();

      fd.append("checklist_item_id", String(checklistItemId));

      // ✅ send maker role explicitly
      fd.append("role", "maker");
      fd.append("role_id", "maker");

      if (remark) {
        fd.append("maker_remarks", remark);
        fd.append("remark", remark);
      }

      for (const f of files) {
        fd.append("maker_media_multi", f);
      }

      const res = await axios.post(DONE_MAKER_API_URL, fd, {
        headers: {
          ...authOnlyHeaders,
        },
      });

      const payload = res?.data || {};
      toast.success(payload?.detail || "Submitted to checker ✅");

      setModalData((prev) => applyMakerDoneIntoTransferResponse(prev, payload));

      if (activeTower?.id) {
        const cacheKey = getActiveTowerCacheKey(activeTower.id);

        setTowerChecklistDetails((prev) => {
          const current = prev[cacheKey]?.raw || modalData;
          const nextRaw = applyMakerDoneIntoTransferResponse(current, payload);

          return {
            ...prev,
            [cacheKey]: {
              fetchedAt: Date.now(),
              raw: nextRaw,
              flattenedChecklists: flattenChecklists(nextRaw),
              stage_history: nextRaw?.stage_history || [],
            },
          };
        });
      }

      setRemarkByItemId((p) => ({ ...p, [checklistItemId]: "" }));
      setMakerFilesByItemId((p) => ({ ...p, [checklistItemId]: [] }));
    } catch (e) {
      const msg =
        e?.response?.data?.detail ||
        e?.response?.data?.error ||
        e?.message ||
        "Failed to submit item by maker.";
      toast.error(String(msg));
    } finally {
      setMakerSubmittingByItemId((p) => ({ ...p, [checklistItemId]: false }));
    }
  };

  const isYesNoOption = (op) => {
    const c = String(op?.choice || "").toUpperCase();
    return c === "P" || c === "N";
  };

  const yesNoLabel = (op) => {
    const c = String(op?.choice || "").toUpperCase();
    if (c === "P") return "YES";
    if (c === "N") return "NO";
    return op?.name || "Option";
  };

  const makerCanSubmitItem = (it) => {
    const st = String(it?.status || "").toLowerCase();
    return (
      st === "pending_for_maker" ||
      st === "tetmpory_maker" ||
      st === "temporary_maker" ||
      st === "rejected_by_checker"
    );
  };

  return (
    <div
      className="flex min-h-screen transition-colors duration-300"
      style={{ backgroundColor: bgColor }}
    >
      <div className="my-8 w-full max-w-7xl mt-8 mx-auto px-4">
        <div
          className="relative pt-8 px-8 pb-10 rounded-2xl transition-all duration-300 hover:shadow-2xl"
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
          <div
            className="absolute top-0 left-0 w-32 h-32 rounded-full opacity-10 blur-3xl"
            style={{ backgroundColor: borderColor }}
          />
          <div
            className="absolute bottom-0 right-0 w-24 h-24 rounded-full opacity-10 blur-2xl"
            style={{ backgroundColor: borderColor }}
          />

          <div className="mb-12 relative z-10">
            <div className="text-center">
              <div
                className="w-20 h-1 mx-auto mb-6 rounded-full"
                style={{ backgroundColor: borderColor }}
              />

              <h2
                className="text-5xl font-bold mb-6 tracking-tight relative inline-block"
                style={{
                  color: textColor,
                  textShadow:
                    theme === "dark"
                      ? `0 2px 8px rgba(255, 190, 99, 0.3)`
                      : `0 2px 8px rgba(0, 0, 0, 0.1)`,
                }}
              >
                {projectName || `Project ${projectId}`}
              </h2>
              <p
                className="text-lg font-medium opacity-80"
                style={{ color: textColor }}
              >
                Explore project buildings and levels
              </p>
            </div>
          </div>

          <div className="relative z-10">
            {projectLevelData && projectLevelData.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
                {projectLevelData.map((proj, index) => {
                  const meta = towerChecklistMeta?.[proj.id];
                  const showBadge = !!meta?.hasChecklist;

                  return (
                    <div
                      key={proj.id}
                      className="group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-500 hover:scale-105 hover:-translate-y-2 transform-gpu"
                      style={{
                        backgroundColor: cardColor,
                        border: `2px solid ${theme === "dark" ? "#ffffff15" : "#00000010"}`,
                        boxShadow:
                          theme === "dark"
                            ? `0 10px 30px rgba(0, 0, 0, 0.3), 0 4px 16px rgba(255, 190, 99, 0.1)`
                            : `0 10px 30px rgba(0, 0, 0, 0.1), 0 4px 16px rgba(255, 190, 99, 0.15)`,
                        animationDelay: `${index * 0.1}s`,
                      }}
                      onClick={() => handleImageClick(proj.id)}
                    >
                      <div
                        className="p-3 relative z-20"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <select
                          value={selectedPhaseByTower[proj.id] || ""}
                          onChange={(e) =>
                            handleTowerPhaseChange(proj.id, e.target.value)
                          }
                          className="w-full px-3 py-2 rounded-xl text-sm"
                          style={{
                            backgroundColor:
                              theme === "dark" ? "#ffffff10" : "#00000008",
                            color: textColor,
                            border: `1px solid ${borderColor}55`,
                            outline: "none",
                          }}
                        >
                          <option value="">Select Phases</option>
                          {phaseList.map((phase) => (
                            <option key={phase.id} value={phase.id}>
                              {phase.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="relative overflow-hidden">
                        <img
                          src={projectImg}
                          alt={`${proj.name || "Project"} Background`}
                          className="w-full h-72 object-cover transition-all duration-700 group-hover:scale-110 group-hover:brightness-110"
                        />

                        <div
                          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                          style={{
                            background: `linear-gradient(135deg, ${borderColor}20 0%, ${borderColor}40 50%, ${borderColor}20 100%)`,
                          }}
                        />

                        {meta?.loading ? (
                          <div
                            className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold"
                            style={{
                              backgroundColor:
                                theme === "dark" ? "#ffffff12" : "#00000010",
                              color: textColor,
                              border: `1px solid ${borderColor}55`,
                              backdropFilter: "blur(8px)",
                            }}
                          >
                            Loading…
                          </div>
                        ) : showBadge ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              openChecklistModal(proj);
                            }}
                            className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold"
                            title="Click to view checklist details"
                            style={{
                              backgroundColor: borderColor,
                              color: "#1b1b1b",
                              boxShadow: `0 6px 18px rgba(255, 190, 99, 0.35)`,
                            }}
                          >
                            🔔 Available Checklist{" "}
                            {meta?.count ? `(${meta.count})` : ""}
                          </button>
                        ) : meta?.error ? (
                          <div
                            className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold"
                            style={{
                              backgroundColor:
                                theme === "dark" ? "#ffffff12" : "#00000010",
                              color: textColor,
                              border: `1px solid ${borderColor}55`,
                              backdropFilter: "blur(8px)",
                            }}
                          >
                            Checklist: error
                          </div>
                        ) : null}
                      </div>

                      <div
                        className="absolute bottom-0 left-0 right-0 p-4 transition-all duration-500"
                        style={{
                          background:
                            theme === "dark"
                              ? `linear-gradient(to top, rgba(35, 35, 44, 0.95) 0%, rgba(35, 35, 44, 0.8) 70%, transparent 100%)`
                              : `linear-gradient(to top, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.8) 70%, transparent 100%)`,
                          backdropFilter: "blur(10px)",
                        }}
                      >
                        <h3
                          className="text-lg font-bold mb-1 group-hover:scale-105 transition-transform duration-300"
                          style={{ color: textColor }}
                        >
                          {proj.name}
                        </h3>
                        <div
                          className="h-1 rounded-full transition-all duration-500 group-hover:w-full"
                          style={{ backgroundColor: borderColor, width: "30%" }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-20">
                <h3
                  className="text-2xl font-bold mb-3"
                  style={{ color: textColor }}
                >
                  No Projects Available
                </h3>
                <p className="text-lg opacity-70" style={{ color: textColor }}>
                  There are currently no projects to display
                </p>
              </div>
            )}
          </div>

          {isModalOpen && (
            <div
              className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
              onClick={closeModal}
              style={{
                backgroundColor: "rgba(0,0,0,0.55)",
                backdropFilter: "blur(6px)",
              }}
            >
              <div
                className="w-full max-w-4xl rounded-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
                style={{
                  backgroundColor: cardColor,
                  border: `2px solid ${borderColor}`,
                  boxShadow:
                    theme === "dark"
                      ? `0 30px 70px rgba(0,0,0,0.6)`
                      : `0 30px 70px rgba(0,0,0,0.25)`,
                }}
              >
                <div
                  className="px-6 py-4 flex items-center justify-between flex-wrap gap-3"
                  style={{
                    borderBottom: `1px solid ${theme === "dark" ? "#ffffff18" : "#00000010"}`,
                  }}
                >
                  <div>
                    <div
                      className="text-sm opacity-80"
                      style={{ color: textColor }}
                    >
                      Tower / Building
                    </div>
                    <div
                      className="text-2xl font-extrabold"
                      style={{ color: textColor }}
                    >
                      {activeTower?.name || `Tower ${activeTower?.id || ""}`}
                    </div>
                    <div
                      className="text-sm opacity-80 mt-1"
                      style={{ color: textColor }}
                    >
                      Project: {projectName || `Project ${projectId}`}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div
                      className="px-3 py-1 rounded-full text-xs font-bold"
                      style={{
                        backgroundColor:
                          theme === "dark" ? "#ffffff10" : "#00000008",
                        color: textColor,
                        border: `1px solid ${borderColor}55`,
                      }}
                      title="Role is taken from localStorage"
                    >
                      Role: {String(activeRoleId || "").toUpperCase()}
                    </div>

                    <button
                      type="button"
                      onClick={closeModal}
                      className="px-4 py-2 rounded-xl font-bold"
                      style={{
                        backgroundColor:
                          theme === "dark" ? "#ffffff10" : "#00000008",
                        color: textColor,
                        border: `1px solid ${borderColor}55`,
                      }}
                    >
                      ✕ Close
                    </button>
                  </div>
                </div>

                <div className="px-6 py-5 max-h-[70vh] overflow-auto">
                  {modalLoading ? (
                    <div className="py-10 text-center">
                      <div
                        className="text-lg font-bold"
                        style={{ color: textColor }}
                      >
                        Loading checklist details…
                      </div>
                    </div>
                  ) : modalError ? (
                    <div
                      className="p-4 rounded-xl"
                      style={{
                        backgroundColor:
                          theme === "dark" ? "#ffffff0c" : "#00000006",
                        border: `1px solid ${borderColor}55`,
                        color: textColor,
                      }}
                    >
                      {modalError}
                    </div>
                  ) : modalData ? (
                    <>
                      {Array.isArray(modalData?.stage_history) &&
                        modalData.stage_history.length > 0 && (
                          <div
                            className="p-4 rounded-2xl mb-5"
                            style={{
                              backgroundColor:
                                theme === "dark" ? "#ffffff0c" : "#00000006",
                              border: `1px solid ${borderColor}55`,
                            }}
                          >
                            <div
                              className="text-lg font-extrabold mb-2"
                              style={{ color: textColor }}
                            >
                              Current Stage History
                            </div>
                            {modalData.stage_history.slice(0, 3).map((sh) => (
                              <div
                                key={sh.id}
                                className="rounded-xl p-3 mb-2"
                                style={{
                                  backgroundColor:
                                    theme === "dark" ? "#ffffff08" : "#ffffff",
                                  border: `1px solid ${theme === "dark" ? "#ffffff10" : "#00000010"}`,
                                }}
                              >
                                <div
                                  className="flex flex-wrap gap-3 text-sm"
                                  style={{ color: textColor }}
                                >
                                  <span>
                                    <b>ID:</b> {sh.id}
                                  </span>
                                  <span>
                                    <b>Stage:</b> {sh.stage}
                                  </span>
                                  <span>
                                    <b>Phase:</b> {sh.phase_id}
                                  </span>
                                  <span>
                                    <b>Status:</b> {sh.status}
                                  </span>
                                  <span>
                                    <b>Started:</b> {fmtDateTime(sh.started_at)}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                      <div className="flex items-center justify-between mb-3">
                        <div
                          className="text-xl font-extrabold"
                          style={{ color: textColor }}
                        >
                          Available Checklists
                        </div>
                        <div
                          className="px-3 py-1 rounded-full text-sm font-bold"
                          style={{
                            backgroundColor: borderColor,
                            color: "#1b1b1b",
                          }}
                        >
                          Total: {modalData?.count ?? 0}
                        </div>
                      </div>

                      {(() => {
                        const flattened = flattenChecklists(modalData);

                        if (!flattened.length) {
                          return (
                            <div
                              className="p-4 rounded-2xl"
                              style={{
                                backgroundColor:
                                  theme === "dark" ? "#ffffff0c" : "#00000006",
                                border: `1px solid ${borderColor}55`,
                                color: textColor,
                              }}
                            >
                              No checklists found for this tower.
                            </div>
                          );
                        }

                        return flattened.map((cl) => {
                          const statusLower = String(
                            cl?.status || "",
                          ).toLowerCase();
                          const isInitialized =
                            !!cl?.initialized_at ||
                            statusLower === "in_progress" ||
                            statusLower === "work_in_progress";

                          const isStarting = !!startingById[cl.id];

                          return (
                            <div
                              key={cl.id}
                              className="rounded-2xl p-4 mb-4"
                              style={{
                                backgroundColor:
                                  theme === "dark" ? "#ffffff0c" : "#00000006",
                                border: `1px solid ${borderColor}55`,
                              }}
                            >
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                  <div
                                    className="text-lg font-extrabold"
                                    style={{ color: textColor }}
                                  >
                                    {cl.name || `Checklist #${cl.id}`}
                                  </div>
                                  <div
                                    className="text-sm opacity-80 mt-1"
                                    style={{ color: textColor }}
                                  >
                                    <b>ID:</b> {cl.id} &nbsp; | &nbsp;
                                    <b>Status:</b> {cl.status} &nbsp; | &nbsp;
                                    <b>Created:</b> {fmtDateTime(cl.created_at)}
                                  </div>
                                  {cl.initialized_at && (
                                    <div
                                      className="text-sm opacity-80 mt-1"
                                      style={{ color: textColor }}
                                    >
                                      <b>Initialized:</b>{" "}
                                      {fmtDateTime(cl.initialized_at)}
                                    </div>
                                  )}
                                </div>

                                <div className="flex items-center gap-2">
                                  <span
                                    className="px-3 py-1 rounded-full text-xs font-bold"
                                    style={{
                                      backgroundColor:
                                        theme === "dark"
                                          ? "#ffffff10"
                                          : "#ffffff",
                                      color: textColor,
                                      border: `1px solid ${borderColor}55`,
                                    }}
                                  >
                                    Items:{" "}
                                    {Array.isArray(cl.items)
                                      ? cl.items.length
                                      : 0}
                                  </span>

                                  <button
                                    type="button"
                                    disabled={isInitialized || isStarting}
                                    onClick={() => startChecklist(cl.id)}
                                    className="px-4 py-2 rounded-xl font-extrabold text-sm transition-all"
                                    style={{
                                      backgroundColor: isInitialized
                                        ? theme === "dark"
                                          ? "#ffffff10"
                                          : "#00000010"
                                        : borderColor,
                                      color: isInitialized
                                        ? textColor
                                        : "#1b1b1b",
                                      border: `1px solid ${borderColor}55`,
                                      opacity: isInitialized ? 0.7 : 1,
                                      cursor: isInitialized
                                        ? "not-allowed"
                                        : "pointer",
                                      boxShadow: isInitialized
                                        ? "none"
                                        : `0 8px 22px rgba(255, 190, 99, 0.35)`,
                                    }}
                                    title={
                                      isInitialized
                                        ? "Already initialized"
                                        : "Initialize this checklist"
                                    }
                                  >
                                    {isStarting
                                      ? "Initializing..."
                                      : isInitialized
                                        ? "Initialized ✅"
                                        : "Start / Initialize"}
                                  </button>
                                </div>
                              </div>

                              <div className="mt-4 space-y-3">
                                {(Array.isArray(cl.items) ? cl.items : []).map(
                                  (it) => {
                                    const itStatus = String(
                                      it?.status || "",
                                    ).toLowerCase();
                                    const itemCompleted =
                                      itStatus === "completed";

                                    const makerAllowed = makerCanSubmitItem(it);
                                    const makerSubmitting =
                                      !!makerSubmittingByItemId[it.id];

                                    return (
                                      <div
                                        key={it.id}
                                        className="rounded-xl p-3"
                                        style={{
                                          backgroundColor:
                                            theme === "dark"
                                              ? "#ffffff08"
                                              : "#ffffff",
                                          border: `1px solid ${theme === "dark" ? "#ffffff10" : "#00000010"}`,
                                        }}
                                      >
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                          <div>
                                            <div
                                              className="font-bold"
                                              style={{ color: textColor }}
                                            >
                                              {it.title || `Item #${it.id}`}
                                            </div>
                                            <div
                                              className="text-sm opacity-80 mt-1"
                                              style={{ color: textColor }}
                                            >
                                              <b>Status:</b> {it.status}
                                              {it.photo_required
                                                ? " | 📷 Photo required"
                                                : ""}
                                              {it.ignore_now
                                                ? " | (ignored)"
                                                : ""}
                                            </div>

                                            <div className="mt-2">
                                              <input
                                                value={
                                                  remarkByItemId[it.id] || ""
                                                }
                                                onChange={(e) =>
                                                  setRemarkByItemId((p) => ({
                                                    ...p,
                                                    [it.id]: e.target.value,
                                                  }))
                                                }
                                                placeholder={
                                                  activeRoleId === "maker"
                                                    ? "Maker remarks…"
                                                    : activeRoleId === "checker"
                                                      ? "Checker remark (optional)…"
                                                      : activeRoleId ===
                                                          "supervisor"
                                                        ? "Supervisor remark (optional)…"
                                                        : "Optional remark…"
                                                }
                                                className="w-full px-3 py-2 rounded-xl text-sm"
                                                style={{
                                                  backgroundColor:
                                                    theme === "dark"
                                                      ? "#ffffff10"
                                                      : "#00000008",
                                                  color: textColor,
                                                  border: `1px solid ${borderColor}55`,
                                                  outline: "none",
                                                }}
                                              />
                                            </div>

                                            {activeRoleId === "maker" && (
                                              <div className="mt-2">
                                                <input
                                                  type="file"
                                                  multiple
                                                  accept="image/*"
                                                  onChange={(e) => {
                                                    const files = Array.from(
                                                      e.target.files || [],
                                                    );
                                                    setMakerFilesByItemId(
                                                      (p) => ({
                                                        ...p,
                                                        [it.id]: files,
                                                      }),
                                                    );
                                                  }}
                                                  className="w-full text-sm"
                                                  style={{ color: textColor }}
                                                />
                                                <div
                                                  className="text-xs mt-1 opacity-80"
                                                  style={{ color: textColor }}
                                                >
                                                  Selected:{" "}
                                                  {
                                                    (
                                                      makerFilesByItemId[
                                                        it.id
                                                      ] || []
                                                    ).length
                                                  }
                                                </div>
                                              </div>
                                            )}
                                          </div>

                                          <div
                                            className="px-3 py-1 rounded-full text-xs font-bold"
                                            style={{
                                              backgroundColor:
                                                theme === "dark"
                                                  ? "#ffffff10"
                                                  : "#00000008",
                                              color: textColor,
                                              border: `1px solid ${borderColor}55`,
                                            }}
                                          >
                                            Options:{" "}
                                            {Array.isArray(it.options)
                                              ? it.options.length
                                              : 0}
                                          </div>
                                        </div>

                                        <div className="mt-3">
                                          {activeRoleId === "maker" ? (
                                            <div className="flex flex-wrap gap-2 items-center">
                                              <button
                                                type="button"
                                                disabled={
                                                  !makerAllowed ||
                                                  itemCompleted ||
                                                  makerSubmitting
                                                }
                                                onClick={() =>
                                                  submitMakerDone({ item: it })
                                                }
                                                className="px-4 py-2 rounded-full text-xs font-extrabold transition-all"
                                                title={
                                                  !makerAllowed
                                                    ? "This item is not pending for maker"
                                                    : itemCompleted
                                                      ? "Already completed"
                                                      : "Submit to checker"
                                                }
                                                style={{
                                                  backgroundColor:
                                                    !makerAllowed ||
                                                    itemCompleted
                                                      ? theme === "dark"
                                                        ? "#ffffff10"
                                                        : "#00000010"
                                                      : borderColor,
                                                  color:
                                                    !makerAllowed ||
                                                    itemCompleted
                                                      ? textColor
                                                      : "#1b1b1b",
                                                  border: `1px solid ${borderColor}55`,
                                                  opacity:
                                                    !makerAllowed ||
                                                    itemCompleted
                                                      ? 0.6
                                                      : 1,
                                                  cursor:
                                                    !makerAllowed ||
                                                    itemCompleted
                                                      ? "not-allowed"
                                                      : "pointer",
                                                  boxShadow:
                                                    !makerAllowed ||
                                                    itemCompleted
                                                      ? "none"
                                                      : `0 8px 18px rgba(0,0,0,0.15)`,
                                                }}
                                              >
                                                {makerSubmitting
                                                  ? "Submitting..."
                                                  : "Submit"}
                                              </button>

                                              <span
                                                className="text-xs opacity-80"
                                                style={{ color: textColor }}
                                              >
                                                (Maker only submits rejected
                                                items)
                                              </span>
                                            </div>
                                          ) : activeRoleId === "checker" ||
                                            activeRoleId === "supervisor" ? (
                                            Array.isArray(it.options) &&
                                            it.options.length > 0 && (
                                              <div className="flex flex-wrap gap-2">
                                                {it.options.map((op) => {
                                                  const isYN =
                                                    isYesNoOption(op);
                                                  const k = `${it.id}:${op.id}:${activeRoleId}`;
                                                  const isVerifying =
                                                    !!verifyingKey[k];

                                                  return (
                                                    <button
                                                      key={op.id}
                                                      type="button"
                                                      disabled={
                                                        !isYN ||
                                                        itemCompleted ||
                                                        isVerifying
                                                      }
                                                      onClick={() =>
                                                        verifyChecklistItem({
                                                          checklistItemId:
                                                            it.id,
                                                          option: op,
                                                          item: it,
                                                        })
                                                      }
                                                      className="px-3 py-2 rounded-full text-xs font-extrabold transition-all"
                                                      title={
                                                        !isYN
                                                          ? "Only YES/NO options are clickable"
                                                          : itemCompleted
                                                            ? "Item already completed"
                                                            : "Click to submit YES/NO"
                                                      }
                                                      style={{
                                                        backgroundColor: !isYN
                                                          ? theme === "dark"
                                                            ? "#ffffff10"
                                                            : "#00000010"
                                                          : String(
                                                                op.choice || "",
                                                              ).toUpperCase() ===
                                                              "P"
                                                            ? borderColor
                                                            : "#ff6b6b",
                                                        color: !isYN
                                                          ? textColor
                                                          : "#1b1b1b",
                                                        border: `1px solid ${borderColor}55`,
                                                        opacity:
                                                          !isYN || itemCompleted
                                                            ? 0.6
                                                            : 1,
                                                        cursor:
                                                          !isYN || itemCompleted
                                                            ? "not-allowed"
                                                            : "pointer",
                                                        boxShadow:
                                                          !isYN || itemCompleted
                                                            ? "none"
                                                            : `0 8px 18px rgba(0,0,0,0.15)`,
                                                      }}
                                                    >
                                                      {isVerifying
                                                        ? "Submitting..."
                                                        : isYN
                                                          ? yesNoLabel(op)
                                                          : op.name}
                                                    </button>
                                                  );
                                                })}
                                              </div>
                                            )
                                          ) : (
                                            <div
                                              className="text-xs opacity-80"
                                              style={{ color: textColor }}
                                            >
                                              (No actions available for role:{" "}
                                              {String(
                                                activeRoleId || "",
                                              ).toUpperCase()}
                                              )
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  },
                                )}
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </>
                  ) : (
                    <div
                      className="text-center py-10 opacity-80"
                      style={{ color: textColor }}
                    >
                      No data
                    </div>
                  )}
                </div>

                <div
                  className="px-6 py-4 flex items-center justify-end gap-3"
                  style={{
                    borderTop: `1px solid ${theme === "dark" ? "#ffffff18" : "#00000010"}`,
                  }}
                >
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-5 py-2 rounded-xl font-bold"
                    style={{
                      backgroundColor:
                        theme === "dark" ? "#ffffff10" : "#00000008",
                      color: textColor,
                      border: `1px solid ${borderColor}55`,
                    }}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectDetailsPage;
