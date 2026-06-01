// src/pages/User/User.jsx

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { MdOutlineCancel, MdEdit, MdDelete } from "react-icons/md";
import SideBarSetup from "../../components/SideBarSetup";
import { showToast } from "../../utils/toast";
import { useTheme } from "../../ThemeContext";
import { useSidebar } from "../../components/SidebarContext";
import axios from "axios";
import {
  createUserDetails,
  allorgantioninfototalbyUser_id,
  getCategoryTreeByProject,
  getProjectsByOrganization,
  createUserAccessRole,
} from "../../api";
import { FaPlus } from "react-icons/fa";

const SIDEBAR_WIDTH = 125;

function User() {
  const { theme } = useTheme();
  const { sidebarOpen } = useSidebar();

  // THEME palette
  const ORANGE = "#ffbe63";
  const BG_OFFWHITE = "#fcfaf7";
  const bgColor = theme === "dark" ? "#191922" : BG_OFFWHITE;
  const cardColor = theme === "dark" ? "#23232c" : "#fff";
  const borderColor = ORANGE;
  const textColor = theme === "dark" ? "#fff" : "#222";
  const iconColor = ORANGE;

  const renderCount = useRef(0);
  renderCount.current += 1;

  const userData = useMemo(() => {
    try {
      const userString = localStorage.getItem("USER_DATA");
      if (userString && userString !== "undefined") {
        const parsed = JSON.parse(userString);
        if (!parsed.roles) {
          try {
            const token = localStorage.getItem("ACCESS_TOKEN");
            if (token) {
              const payload = JSON.parse(atob(token.split(".")[1]));
              parsed.roles = payload.roles || [];
            }
          } catch (error) {
            parsed.roles = [];
          }
        }
        return parsed || {};
      }
    } catch {
      return {};
    }
    return {};
  }, []);

  const isSuperAdmin = !!userData?.superadmin;
  const isStaff = !!userData?.is_staff;
  const isClient = !isSuperAdmin && !isStaff && !!userData?.is_client;
  const is_manager =
    !isSuperAdmin && !isStaff && !isClient && !!userData?.is_manager;

  const canCreateClient = isStaff || isSuperAdmin;
  const canCreateManager = isClient;
  const canCreateNormalUser = is_manager;

  const [isSubmitting, setIsSubmitting] = useState(false);

  const userId = userData?.user_id;
  const org = useMemo(() => userData.org || "", [userData.org]);
  const userRole = useMemo(() => {
    if (userData.superadmin) return "ADMIN";
    else if (userData.is_staff) return "STAFF";
    else if (userData.roles && userData.roles.length > 0)
      return userData.roles[0];
    else if (userData.is_manager) return "Manager";
    else if (userData.is_client) return "Client";
    else return "User";
  }, [userData]);
  const creationCapability = useMemo(() => {
    if (canCreateClient) return "Can create client users";
    else if (canCreateManager) return "Can create manager users";
    else if (canCreateNormalUser) return "Can create normal users with roles";
    else return "No user creation permissions";
  }, [canCreateClient, canCreateManager, canCreateNormalUser]);

    const roleFromStorage =
    localStorage.getItem("ROLE") ||
    (localStorage.getItem("USER_DATA") &&
      JSON.parse(localStorage.getItem("USER_DATA"))?.role) ||
    "";

  const isAdminRole =
    roleFromStorage?.toLowerCase() === "admin" ||
    (Array.isArray(userData.roles) &&
      (userData.roles.includes("Admin") || userData.roles.includes("ADMIN")));

  // who can see org dropdown
  const canSeeOrganization = isSuperAdmin || isAdminRole || canCreateManager ;

  // organization list + selected org for new user
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrgId, setSelectedOrgId] = useState("");


  // ========== STEP 1: BASIC USER DETAILS (ALL CREATORS) ==========
  const [showBasicDetailsModal, setShowBasicDetailsModal] = useState(false);
  const [basicUserDetails, setBasicUserDetails] = useState({
    username: "",
    first_name: "",
    last_name: "",
    email: "",
    mobile: "",
    password: "",
  });

  // ========== STEP 2: MAPPING MODAL (ONLY FOR MANAGER) ==========
  const [showMappingModal, setShowMappingModal] = useState(false);

  // Current mapping being built (left side)
  const [currentMapping, setCurrentMapping] = useState({
    roles: [], // multi-select
    project_id: "",
    purpose_id: "",
    phase_id: "",
    stage_ids: [], // multi-select
    all_cat: false,
    category: "",
    CategoryLevel1: "",
    CategoryLevel2: "",
    CategoryLevel3: "",
    CategoryLevel4: "",
    CategoryLevel5: "",
    CategoryLevel6: "",
    building_id: "",
    zone_id: "",
  });

  // Bucket of mappings (right side)
  const [mappingBucket, setMappingBucket] = useState([]);

  // Available options for dropdowns
  const [availableProjects, setAvailableProjects] = useState([]);
  const [purposes, setPurposes] = useState([]);
  const [phases, setPhases] = useState([]);
  const [stages, setStages] = useState([]);
  const [categoryTree, setCategoryTree] = useState([]);
  const [availableBuildings, setAvailableBuildings] = useState([]);
  const [availableZones, setAvailableZones] = useState([]);

  // Category tree levels
  const [availableLevel1, setAvailableLevel1] = useState([]);
  const [availableLevel2, setAvailableLevel2] = useState([]);
  const [availableLevel3, setAvailableLevel3] = useState([]);
  const [availableLevel4, setAvailableLevel4] = useState([]);
  const [availableLevel5, setAvailableLevel5] = useState([]);
  const [availableLevel6, setAvailableLevel6] = useState([]);
const role =
  localStorage.getItem("ROLE") ||
  (localStorage.getItem("USER_DATA") &&
    JSON.parse(localStorage.getItem("USER_DATA"))?.role) ||
  "";

// const isSuperAdmin = role === "Super Admin";
const isAdmin = role === "Admin";

// const canSeeOrganization = isSuperAdmin || isAdmin;   // ✅

  // Loading states
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [categoryLoading, setCategoryLoading] = useState(false);

  // ========== ROLE OPTIONS ==========
  const ROLE_OPTIONS = [
    { value: "SUPERVISOR", label: "SUPERVISOR" },
    { value: "CHECKER", label: "CHECKER" },
    { value: "MAKER", label: "MAKER" },
    { value: "SECURITY_GUARD", label: "SECURITY GUARD" },
    { value: "Intializer", label: "Intializer" },
  ];
    const MANAGER_ROLE_OPTIONS = [
    { value: "MANAGER", label: "Manager" },
    { value: "PROJECT_MANAGER", label: "Project Manager" },
    { value: "PROJECT_HEAD", label: "Project Head" },
  ];

  const [managerRole, setManagerRole] = useState(""); // NEW

  // ========== VALIDATION ==========
    const isBasicDetailsValid = useCallback(() => {
    const baseValid =
      basicUserDetails.username &&
      basicUserDetails.first_name &&
      basicUserDetails.last_name &&
      basicUserDetails.email &&
      basicUserDetails.password;

    if (!baseValid) return false;

    // When this screen is used to create a MANAGER
    // and current user can pick org → org is mandatory
    if (canCreateManager && canSeeOrganization) {
      if (!selectedOrgId) return false;

      // 🔹 Manager type dropdown bhi required hai
      if (!managerRole) return false;
    }

    return true;
  }, [
    basicUserDetails,
    canCreateManager,
    canSeeOrganization,
    selectedOrgId,
    managerRole,          // NEW dep
  ]);

  // const isBasicDetailsValid = useCallback(() => {
  //   const baseValid =
  //     basicUserDetails.username &&
  //     basicUserDetails.first_name &&
  //     basicUserDetails.last_name &&
  //     basicUserDetails.email &&
  //     basicUserDetails.password;

  //   if (!baseValid) return false;

  //   // When this screen is used to create a MANAGER
  //   // and current user can pick org → org is mandatory
  //   if (canCreateManager && canSeeOrganization && !selectedOrgId) {
  //     return false;
  //   }

  //   return true;
  // }, [
  //   basicUserDetails,
  //   canCreateManager,
  //   canSeeOrganization,
  //   selectedOrgId,
  // ]);

//   const isBasicDetailsValid = useCallback(() => {
//     return (
//       basicUserDetails.username &&
//       basicUserDetails.first_name &&
//       basicUserDetails.last_name &&
//       basicUserDetails.email &&
//       basicUserDetails.password
//     );
//   }, [basicUserDetails]);

  const isCurrentMappingValid = useCallback(() => {
    // Must have at least one role
    if (currentMapping.roles.length === 0) return false;

    // Must have project
    if (!currentMapping.project_id) return false;

    // If role is Initializer or Security Guard, only project needed
    const hasInitializer = currentMapping.roles.includes("Intializer");
    const hasSecurityGuard = currentMapping.roles.includes("SECURITY_GUARD");

    if (hasInitializer || hasSecurityGuard) {
      return true; // Project is enough
    }

    // For MAKER/CHECKER/SUPERVISOR: need purpose, phase, at least one stage
    if (!currentMapping.purpose_id) return false;
    if (!currentMapping.phase_id) return false;
    if (currentMapping.stage_ids.length === 0) return false;

    // Category: either all_cat OR at least category selected
    if (!currentMapping.all_cat && !currentMapping.category) return false;

    return true;
  }, [currentMapping]);

  // ========== FETCH PROJECTS ==========
  const fetchProjectsForManager = useCallback(async () => {
    if ((is_manager || canCreateManager) && org) {
      setProjectsLoading(true);
      try {
        const res = await getProjectsByOrganization(org);
        let projects = [];
        if (Array.isArray(res.data)) projects = res.data;
        else if (res.data && res.data.projects) projects = res.data.projects;
        setAvailableProjects(projects);
      } catch (err) {
        setAvailableProjects([]);
        showToast("Failed to fetch projects", "error");
      } finally {
        setProjectsLoading(false);
      }
    }
  }, [is_manager, canCreateManager, org]);

  // ========== FETCH PURPOSES ==========
  const fetchPurposes = async (projectId) => {
    try {
      const res = await axios.get(
        `https://konstruct.world/projects/purpose/get-purpose-details-by-project-id/${projectId}/`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("ACCESS_TOKEN")}`,
          },
        }
      );
      setPurposes(res.data || []);
    } catch (err) {
      showToast("Failed to fetch purposes", "error");
      setPurposes([]);
    }
  };

  // ========== FETCH PHASES ==========
  const fetchPhases = async (purposeId) => {
    try {
      const res = await axios.get(
        `https://konstruct.world/projects/phases/by-purpose/${purposeId}/`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("ACCESS_TOKEN")}`,
          },
        }
      );
      setPhases(res.data || []);
    } catch (err) {
      showToast("Failed to fetch phases", "error");
      setPhases([]);
    }
  };

  // ========== FETCH STAGES ==========
  const fetchStages = async (phaseId) => {
    try {
      const res = await axios.get(
        `https://konstruct.world/projects/stages/by_phase/${phaseId}/`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("ACCESS_TOKEN")}`,
          },
        }
      );
      setStages(res.data || []);
    } catch (err) {
      showToast("Failed to fetch stages", "error");
      setStages([]);
    }
  };

  // ========== FETCH CATEGORY TREE ==========
  const fetchCategoryTree = useCallback(async (projectId) => {
    if (!projectId) return;
    setCategoryLoading(true);
    try {
      const response = await getCategoryTreeByProject(projectId);
      setCategoryTree(response.data || []);
    } catch (error) {
      setCategoryTree([]);
      showToast("Failed to load categories", "error");
    } finally {
      setCategoryLoading(false);
    }
  }, []);

  // ========== RESET CATEGORY SELECTIONS ==========
  const resetCategorySelections = useCallback(() => {
    setCurrentMapping((prev) => ({
      ...prev,
      category: "",
      CategoryLevel1: "",
      CategoryLevel2: "",
      CategoryLevel3: "",
      CategoryLevel4: "",
      CategoryLevel5: "",
      CategoryLevel6: "",
    }));
    setAvailableLevel1([]);
    setAvailableLevel2([]);
    setAvailableLevel3([]);
    setAvailableLevel4([]);
    setAvailableLevel5([]);
    setAvailableLevel6([]);
  }, []);
  const fetchOrganizations = useCallback(async () => {
  try {
    if (!userId) return;

    // 🔥 SAME URL AS OLD FILE
    const res = await axios.get(
      `https://konstruct.world/organizations/user-orgnizationn-info/${userId}/`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("ACCESS_TOKEN")}`,
        },
      }
    );

    // old API shape: { organizations: [ { id, organization_name, ...}, ... ], ... }
    const orgList = res.data?.organizations || [];

    // map to simple { id, name } for your new dropdown
    const mapped = orgList.map((org) => ({
      id: org.id,
      name: org.organization_name,
    }));

    setOrganizations(mapped);
  } catch (error) {
    console.error("Error fetching organizations:", error);
    setOrganizations([]);
    showToast("Failed to fetch organizations", "error");
  }
}, [userId]);





  useEffect(() => {
  if (canSeeOrganization) {
    fetchOrganizations();
  }
}, [canSeeOrganization, fetchOrganizations]);


  // ========== HANDLERS FOR CURRENT MAPPING ==========
useEffect(() => {
  if (canSeeOrganization) {
    // fetchOrganizations();
  }
}, [canSeeOrganization]);

  // Roles multi-select
  const handleRoleToggle = (roleValue) => {
    setCurrentMapping((prev) => {
      const roles = prev.roles.includes(roleValue)
        ? prev.roles.filter((r) => r !== roleValue)
        : [...prev.roles, roleValue];

      // If Initializer or Security Guard selected, reset purpose/phase/stage/category
      const hasInitializer = roles.includes("Intializer");
      const hasSecurityGuard = roles.includes("SECURITY_GUARD");

      if (hasInitializer || hasSecurityGuard) {
        return {
          ...prev,
          roles,
          purpose_id: "",
          phase_id: "",
          stage_ids: [],
          all_cat: false,
          category: "",
          CategoryLevel1: "",
          CategoryLevel2: "",
          CategoryLevel3: "",
          CategoryLevel4: "",
          CategoryLevel5: "",
          CategoryLevel6: "",
        };
      }

      return { ...prev, roles };
    });
  };

  // Project change
  const handleProjectChange = (e) => {
    const projectId = e.target.value;
    setCurrentMapping((prev) => ({
      ...prev,
      project_id: projectId,
      purpose_id: "",
      phase_id: "",
      stage_ids: [],
      building_id: "",
      zone_id: "",
      all_cat: false,
      category: "",
      CategoryLevel1: "",
      CategoryLevel2: "",
      CategoryLevel3: "",
      CategoryLevel4: "",
      CategoryLevel5: "",
      CategoryLevel6: "",
    }));

    setPurposes([]);
    setPhases([]);
    setStages([]);
    setAvailableBuildings([]);
    setAvailableZones([]);
    resetCategorySelections();

    if (projectId) {
      fetchCategoryTree(projectId);
      fetchPurposes(projectId);

      // Get buildings for this project
      const selectedProjectObj = availableProjects.find(
        (project) => project.id === parseInt(projectId)
      );
      if (selectedProjectObj && selectedProjectObj.buildings) {
        setAvailableBuildings(selectedProjectObj.buildings);
      }
    }
  };

  // Purpose change
  const handlePurposeChange = (e) => {
    const purposeId = e.target.value;
    setCurrentMapping((prev) => ({
      ...prev,
      purpose_id: purposeId,
      phase_id: "",
      stage_ids: [],
    }));
    setPhases([]);
    setStages([]);
    if (purposeId) fetchPhases(purposeId);
  };

  // Phase change
  const handlePhaseChange = (e) => {
    const phaseId = e.target.value;
    setCurrentMapping((prev) => ({
      ...prev,
      phase_id: phaseId,
      stage_ids: [],
    }));
    setStages([]);
    if (phaseId) fetchStages(phaseId);
  };

  // Stages multi-select
  const handleStageChange = (e) => {
    const values = Array.from(e.target.selectedOptions, (opt) => opt.value);
    setCurrentMapping((prev) => ({
      ...prev,
      stage_ids: values,
    }));
  };

  // Category change
  const handleCategoryChange = (e) => {
    const categoryId = e.target.value;
    setCurrentMapping((prev) => ({
      ...prev,
      category: categoryId,
      CategoryLevel1: "",
      CategoryLevel2: "",
      CategoryLevel3: "",
      CategoryLevel4: "",
      CategoryLevel5: "",
      CategoryLevel6: "",
    }));
    setAvailableLevel2([]);
    setAvailableLevel3([]);
    setAvailableLevel4([]);
    setAvailableLevel5([]);
    setAvailableLevel6([]);

    if (categoryId) {
      const selectedCategoryObj = categoryTree.find(
        (cat) => cat.id === parseInt(categoryId)
      );
      if (selectedCategoryObj && selectedCategoryObj.level1) {
        setAvailableLevel1(selectedCategoryObj.level1);
      } else {
        setAvailableLevel1([]);
      }
    } else {
      setAvailableLevel1([]);
    }
  };

  // Category levels (Level1-Level6)
  const handleLevel1Change = (e) => {
    const level1Id = e.target.value;
    setCurrentMapping((prev) => ({
      ...prev,
      CategoryLevel1: level1Id,
      CategoryLevel2: "",
      CategoryLevel3: "",
      CategoryLevel4: "",
      CategoryLevel5: "",
      CategoryLevel6: "",
    }));
    setAvailableLevel3([]);
    setAvailableLevel4([]);
    setAvailableLevel5([]);
    setAvailableLevel6([]);

    if (level1Id) {
      const selectedLevel1Obj = availableLevel1.find(
        (item) => item.id === parseInt(level1Id)
      );
      if (selectedLevel1Obj && selectedLevel1Obj.level2) {
        setAvailableLevel2(selectedLevel1Obj.level2);
      } else {
        setAvailableLevel2([]);
      }
    } else {
      setAvailableLevel2([]);
    }
  };

  const handleLevel2Change = (e) => {
    const level2Id = e.target.value;
    setCurrentMapping((prev) => ({
      ...prev,
      CategoryLevel2: level2Id,
      CategoryLevel3: "",
      CategoryLevel4: "",
      CategoryLevel5: "",
      CategoryLevel6: "",
    }));
    setAvailableLevel4([]);
    setAvailableLevel5([]);
    setAvailableLevel6([]);

    if (level2Id) {
      const selectedLevel2Obj = availableLevel2.find(
        (item) => item.id === parseInt(level2Id)
      );
      if (selectedLevel2Obj && selectedLevel2Obj.level3) {
        setAvailableLevel3(selectedLevel2Obj.level3);
      } else {
        setAvailableLevel3([]);
      }
    } else {
      setAvailableLevel3([]);
    }
  };

  const handleLevel3Change = (e) => {
    const level3Id = e.target.value;
    setCurrentMapping((prev) => ({
      ...prev,
      CategoryLevel3: level3Id,
      CategoryLevel4: "",
      CategoryLevel5: "",
      CategoryLevel6: "",
    }));
    setAvailableLevel5([]);
    setAvailableLevel6([]);

    if (level3Id) {
      const selectedLevel3Obj = availableLevel3.find(
        (item) => item.id === parseInt(level3Id)
      );
      if (selectedLevel3Obj && selectedLevel3Obj.level4) {
        setAvailableLevel4(selectedLevel3Obj.level4);
      } else {
        setAvailableLevel4([]);
      }
    } else {
      setAvailableLevel4([]);
    }
  };

  const handleLevel4Change = (e) => {
    const level4Id = e.target.value;
    setCurrentMapping((prev) => ({
      ...prev,
      CategoryLevel4: level4Id,
      CategoryLevel5: "",
      CategoryLevel6: "",
    }));
    setAvailableLevel6([]);

    if (level4Id) {
      const selectedLevel4Obj = availableLevel4.find(
        (item) => item.id === parseInt(level4Id)
      );
      if (selectedLevel4Obj && selectedLevel4Obj.level5) {
        setAvailableLevel5(selectedLevel4Obj.level5);
      } else {
        setAvailableLevel5([]);
      }
    } else {
      setAvailableLevel5([]);
    }
  };

  const handleLevel5Change = (e) => {
    const level5Id = e.target.value;
    setCurrentMapping((prev) => ({
      ...prev,
      CategoryLevel5: level5Id,
      CategoryLevel6: "",
    }));

    if (level5Id) {
      const selectedLevel5Obj = availableLevel5.find(
        (item) => item.id === parseInt(level5Id)
      );
      if (selectedLevel5Obj && selectedLevel5Obj.level6) {
        setAvailableLevel6(selectedLevel5Obj.level6);
      } else {
        setAvailableLevel6([]);
      }
    } else {
      setAvailableLevel6([]);
    }
  };

  const handleLevel6Change = (e) => {
    setCurrentMapping((prev) => ({
      ...prev,
      CategoryLevel6: e.target.value,
    }));
  };

  // Building change
  const handleBuildingChange = (e) => {
    const buildingId = e.target.value;
    setCurrentMapping((prev) => ({
      ...prev,
      building_id: buildingId,
      zone_id: "",
    }));
    setAvailableZones([]);

    if (buildingId) {
      const selectedBuildingObj = availableBuildings.find(
        (building) => building.id === parseInt(buildingId)
      );
      if (selectedBuildingObj && selectedBuildingObj.zones) {
        setAvailableZones(selectedBuildingObj.zones);
      }
    }
  };

  // Zone change
  const handleZoneChange = (e) => {
    setCurrentMapping((prev) => ({
      ...prev,
      zone_id: e.target.value,
    }));
  };

  // ========== ADD MAPPING TO BUCKET (MANAGER) ==========
  const handleAddMappingToBucket = () => {
    if (!isCurrentMappingValid()) {
      showToast("Please fill all required fields for this mapping", "error");
      return;
    }

    // Get display names for bucket view
    const projectName =
      availableProjects.find(
        (p) => p.id === parseInt(currentMapping.project_id)
      )?.name || "";

    const purposeName =
      purposes.find((p) => p.id === parseInt(currentMapping.purpose_id))
        ?.purpose?.name ||
      purposes.find((p) => p.id === parseInt(currentMapping.purpose_id))?.name
        ?.purpose?.name ||
      purposes.find((p) => p.id === parseInt(currentMapping.purpose_id))
        ?.purpose_name ||
      "";

    const phaseName =
      phases.find((p) => p.id === parseInt(currentMapping.phase_id))?.name ||
      phases.find((p) => p.id === parseInt(currentMapping.phase_id))?.phase ||
      "";

    const stageNames = currentMapping.stage_ids.map((sId) => {
      const stage = stages.find((s) => s.id === parseInt(sId));
      return stage?.name || stage?.stage || "";
    });

    const categoryName = currentMapping.all_cat
      ? "All Categories"
      : categoryTree.find((c) => c.id === parseInt(currentMapping.category))
          ?.name || "";

    const level1Name =
      availableLevel1.find(
        (l) => l.id === parseInt(currentMapping.CategoryLevel1)
      )?.name || "";
    const level2Name =
      availableLevel2.find(
        (l) => l.id === parseInt(currentMapping.CategoryLevel2)
      )?.name || "";
    const level3Name =
      availableLevel3.find(
        (l) => l.id === parseInt(currentMapping.CategoryLevel3)
      )?.name || "";
    const level4Name =
      availableLevel4.find(
        (l) => l.id === parseInt(currentMapping.CategoryLevel4)
      )?.name || "";
    const level5Name =
      availableLevel5.find(
        (l) => l.id === parseInt(currentMapping.CategoryLevel5)
      )?.name || "";
    const level6Name =
      availableLevel6.find(
        (l) => l.id === parseInt(currentMapping.CategoryLevel6)
      )?.name || "";

    const buildingName =
      availableBuildings.find(
        (b) => b.id === parseInt(currentMapping.building_id)
      )?.name || "";

    const zoneName =
      availableZones.find(
        (z) => z.id === parseInt(currentMapping.zone_id)
      )?.name || "";

    const newMapping = {
      ...currentMapping,
      // Display names for UI
      displayNames: {
        project: projectName,
        purpose: purposeName,
        phase: phaseName,
        stages: stageNames,
        category: categoryName,
        level1: level1Name,
        level2: level2Name,
        level3: level3Name,
        level4: level4Name,
        level5: level5Name,
        level6: level6Name,
        building: buildingName,
        zone: zoneName,
      },
    };

    setMappingBucket((prev) => [...prev, newMapping]);

    // Reset current mapping for next entry
    setCurrentMapping({
      roles: [],
      project_id: "",
      purpose_id: "",
      phase_id: "",
      stage_ids: [],
      all_cat: false,
      category: "",
      CategoryLevel1: "",
      CategoryLevel2: "",
      CategoryLevel3: "",
      CategoryLevel4: "",
      CategoryLevel5: "",
      CategoryLevel6: "",
      building_id: "",
      zone_id: "",
    });

    // Reset dropdowns
    setPurposes([]);
    setPhases([]);
    setStages([]);
    resetCategorySelections();

    showToast("Mapping added to bucket", "success");
  };

  // ========== REMOVE MAPPING FROM BUCKET ==========
  const handleRemoveMappingFromBucket = (index) => {
    setMappingBucket((prev) => prev.filter((_, i) => i !== index));
    showToast("Mapping removed from bucket", "success");
  };

  // ========== SIMPLE FINAL SUBMIT (NON-MANAGER) ==========
  const handleSimpleFinalSubmit = async () => {
    if (isSubmitting) return;

    if (!isBasicDetailsValid()) {
      showToast("Please fill all required basic details", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      let payload;

      // Staff / Superadmin -> create client user
      if (canCreateClient) {
        payload = {
          user: {
            username: basicUserDetails.username,
            first_name: basicUserDetails.first_name,
            last_name: basicUserDetails.last_name,
            email: basicUserDetails.email,
            phone_number: basicUserDetails.mobile || "",
            password: basicUserDetails.password,
            is_client: true,
            is_manager: false,
            has_access: true,
            org: null,
            company: null,
            entity: null,
          },
          access: {
            project_id: null,
            building_id: null,
            zone_id: null,
            flat_id: null,
            active: true,
            all_cat: true,
            category: null,
            CategoryLevel1: null,
            CategoryLevel2: null,
            CategoryLevel3: null,
            CategoryLevel4: null,
            CategoryLevel5: null,
            CategoryLevel6: null,
            purpose_id: null,
            phase_id: null,
            stage_ids: [],
          },
          roles: [],
        };
      }
      // Client -> create manager user
     // Client -> create manager user
else if (canCreateManager) {
  // Prefer the org selected in dropdown, fallback to user's own org if ever needed
  const orgId = selectedOrgId || org;

  payload = {
    user: {
      username: basicUserDetails.username,
      first_name: basicUserDetails.first_name,
      last_name: basicUserDetails.last_name,
      email: basicUserDetails.email,
      phone_number: basicUserDetails.mobile || "",
      password: basicUserDetails.password,
      org: orgId ? parseInt(orgId, 10) : null,
      company: null,
      entity: null,
      is_manager: true,
      is_client: false,
      has_access: true,
      role: managerRole,
    },
    access: {
      project_id: null,
      building_id: null,
      zone_id: null,
      flat_id: null,
      active: true,
      all_cat: true,
      category: null,
      CategoryLevel1: null,
      CategoryLevel2: null,
      CategoryLevel3: null,
      CategoryLevel4: null,
      CategoryLevel5: null,
      CategoryLevel6: null,
      purpose_id: null,
      phase_id: null,
      stage_ids: [],
    },
    roles: [],
  };

      } else {
        // Fallback: if some other role hits this (unlikely)
        payload = {
          user: {
            username: basicUserDetails.username,
            first_name: basicUserDetails.first_name,
            last_name: basicUserDetails.last_name,
            email: basicUserDetails.email,
            phone_number: basicUserDetails.mobile || "",
            password: basicUserDetails.password,
            org: org ? parseInt(org) : null,
            company: null,
            entity: null,
            is_manager: false,
            is_client: false,
            has_access: true,
          },
          access: {
            project_id: null,
            building_id: null,
            zone_id: null,
            flat_id: null,
            active: true,
            all_cat: true,
            category: null,
            CategoryLevel1: null,
            CategoryLevel2: null,
            CategoryLevel3: null,
            CategoryLevel4: null,
            CategoryLevel5: null,
            CategoryLevel6: null,
            purpose_id: null,
            phase_id: null,
            stage_ids: [],
          },
          roles: [],
        };
      }
      console.log("Manager create payload:", payload);


      const response = await createUserAccessRole(payload);

      if (response.status === 201) {
        showToast("User created successfully", "success");
        resetAllForms();
      } else {
        showToast("Failed to create user", "error");
      }
    } catch (error) {
      if (error.response && error.response.data) {
        const errorData = error.response.data;
        if (errorData.user && errorData.user.username) {
          showToast("Username already exists", "error");
        } else if (errorData.user && errorData.user.email) {
          showToast("Email already exists", "error");
        } else {
          showToast("Error creating user. Please try again.", "error");
        }
      } else {
        showToast("Error creating user. Please try again.", "error");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ========== FINAL SUBMIT (MANAGER + MAPPINGS) ==========
  // ========== FINAL SUBMIT (MANAGER + MAPPINGS USING NEW API) ==========
// ========== FINAL SUBMIT (MANAGER + MAPPINGS USING NEW API) ==========
// ========== FINAL SUBMIT (MANAGER + MAPPINGS USING NEW API) ==========
const handleManagerFinalSubmit = async () => {
  if (isSubmitting) return;

  // Basic details check
  if (!isBasicDetailsValid()) {
    showToast("Please fill all required basic details", "error");
    setShowMappingModal(false);
    setShowBasicDetailsModal(true);
    return;
  }

  if (mappingBucket.length === 0) {
    showToast("Please add at least one mapping to the bucket", "error");
    return;
  }

  setIsSubmitting(true);

  try {
        // 🔹 Just gather all unique role strings exactly as in ROLE_OPTIONS
        // 1) Collect unique roles for the user in the exact format backend expects
    const rolesSet = new Set();

    mappingBucket.forEach((mapping) => {
      (mapping.roles || []).forEach((r) => {
        if (!r) return;
        let v = String(r).trim();

        // Normalise initializer spelling to backend's choice
        if (v.toLowerCase() === "initializer" || v.toLowerCase() === "intializer") {
          // v = "Intializer"; // 👈 EXACT value backend uses
          v = "Intializer"; // 👈 EXACT value backend uses
        }

        // SUPERVISOR, CHECKER, MAKER, SECURITY_GUARD already match backend choices
        rolesSet.add(v);
      });
    });

    const rolesForUser = Array.from(rolesSet);

    // Backend expects: [{ role: "Intializer" }, { role: "MAKER" }, ...]
    const rolesPayload = rolesForUser.map((role) => ({ role }));

    console.log("rolesForUser (manager flow):", rolesForUser);
    console.log("rolesPayload (manager flow):", rolesPayload);

    // 🔹 Build base access row from mappingBucket
    // This is what actually creates the initial access record in DB.
    // For Intializer / Security Guard -> project-level all_cat = true
    let baseAccess = {
      project_id: null,
      building_id: null,
      zone_id: null,
      flat_id: null,
      active: true,
      all_cat: true,
      category: null,
      CategoryLevel1: null,
      CategoryLevel2: null,
      CategoryLevel3: null,
      CategoryLevel4: null,
      CategoryLevel5: null,
      CategoryLevel6: null,
      purpose_id: null,
      phase_id: null,
      stage_ids: [],
    };

    if (mappingBucket.length > 0) {
      // Prefer a mapping that has Intializer / Security Guard role
      const initializerOrGuardMapping =
        mappingBucket.find((m) =>
          (m.roles || []).some((r) => {
            const rl = String(r).toLowerCase();
            return (
              rl === "intializer" ||
              rl === "initializer" ||
              rl === "security_guard"
            );
          })
        ) || mappingBucket[0];

      if (initializerOrGuardMapping) {
        const m = initializerOrGuardMapping;

        baseAccess.project_id = m.project_id
          ? parseInt(m.project_id, 10)
          : null;
        baseAccess.building_id = m.building_id
          ? parseInt(m.building_id, 10)
          : null;
        baseAccess.zone_id = m.zone_id ? parseInt(m.zone_id, 10) : null;

        const hasInitOrGuard = (m.roles || []).some((r) => {
          const rl = String(r).toLowerCase();
          return (
            rl === "intializer" ||
            rl === "initializer" ||
            rl === "security_guard"
          );
        });

        // For pure Initializer/Security Guard, keep all_cat = true and categories null
        // For Maker/Checker/Supervisor, copy category filters from first mapping
        if (!hasInitOrGuard && !m.all_cat) {
          baseAccess.all_cat = false;
          baseAccess.category = m.category ? parseInt(m.category, 10) : null;
          baseAccess.CategoryLevel1 = m.CategoryLevel1
            ? parseInt(m.CategoryLevel1, 10)
            : null;
          baseAccess.CategoryLevel2 = m.CategoryLevel2
            ? parseInt(m.CategoryLevel2, 10)
            : null;
          baseAccess.CategoryLevel3 = m.CategoryLevel3
            ? parseInt(m.CategoryLevel3, 10)
            : null;
          baseAccess.CategoryLevel4 = m.CategoryLevel4
            ? parseInt(m.CategoryLevel4, 10)
            : null;
          baseAccess.CategoryLevel5 = m.CategoryLevel5
            ? parseInt(m.CategoryLevel5, 10)
            : null;
          baseAccess.CategoryLevel6 = m.CategoryLevel6
            ? parseInt(m.CategoryLevel6, 10)
            : null;
        }
      }
    }

    // const rolesSet = new Set();

    // mappingBucket.forEach((mapping) => {
    //   (mapping.roles || []).forEach((r) => {
    //     const rl = r.toLowerCase();
    //     let apiRole;

    //     if (rl === "intializer" || rl === "initializer") {
    //       apiRole = "INITIALIZER";
    //     } else if (rl === "security_guard") {
    //       apiRole = "SECURITY_GUARD";
    //     } else {
    //       // Maker / Checker / Supervisor (etc) → uppercase
    //       apiRole = r.toUpperCase();
    //     }

    //     rolesSet.add(apiRole);
    //   });
    // });

    // const rolesForUser = Array.from(rolesSet);
    // 1) Pehle USER create karo (purane createUserAccessRole se, bina mapping ke)
    // const userCreatePayload = {
    //   user: {
    //     username: basicUserDetails.username,
    //     first_name: basicUserDetails.first_name,
    //     last_name: basicUserDetails.last_name,
    //     email: basicUserDetails.email,
    //     phone_number: basicUserDetails.mobile || "",
    //     password: basicUserDetails.password,
    //     org: org ? parseInt(org, 10) : null,
    //     company: null,
    //     entity: null,
    //     is_manager: false,   // manager ek normal user bana raha hai
    //     is_client: false,
    //     has_access: true,
    //   },
    //   access: {
    //     project_id: null,
    //     building_id: null,
    //     zone_id: null,
    //     flat_id: null,
    //     active: true,
    //     all_cat: true,
    //     category: null,
    //     CategoryLevel1: null,
    //     CategoryLevel2: null,
    //     CategoryLevel3: null,
    //     CategoryLevel4: null,
    //     CategoryLevel5: null,
    //     CategoryLevel6: null,
    //     purpose_id: null,
    //     phase_id: null,
    //     stage_ids: [],
    //   },
    //  roles: rolesPayload,
    // };
    // 1) Pehle USER create karo (createUserAccessRole se) – with baseAccess
    const userCreatePayload = {
      user: {
        username: basicUserDetails.username,
        first_name: basicUserDetails.first_name,
        last_name: basicUserDetails.last_name,
        email: basicUserDetails.email,
        phone_number: basicUserDetails.mobile || "",
        password: basicUserDetails.password,
        org: org ? parseInt(org, 10) : null,
        company: null,
        entity: null,
        is_manager: false,   // manager ek normal user bana raha hai
        is_client: false,
        has_access: true,
      },
      access: baseAccess,   // 🔴 THIS IS THE IMPORTANT CHANGE
      roles: rolesPayload,
    };

    console.log("Create user payload (manager flow):", userCreatePayload);
    const createResp = await createUserAccessRole(userCreatePayload);

    if (createResp.status !== 201) {
      showToast("Failed to create user", "error");
      setIsSubmitting(false);
      return;
    }

    // Naya user id nikaalo
    const createdUserObj = createResp.data?.user || createResp.data || {};
    const newUserId = createdUserObj.id || createdUserObj.user_id;

    if (!newUserId) {
      console.error("Could not find new user id in response:", createResp.data);
      showToast("User created but ID not returned. Please contact support.", "error");
      setIsSubmitting(false);
      return;
    }

    // 2) mappingBucket se stage-tree payload banao

    // 👉 Stage-tree is only for Maker/Checker/Supervisor type roles
const projectsMap = {}; // { [projectId]: { [purposeId]: { [phaseId]: [ {stage_id, roles} ] } } }
let hasInitializerOnlyMappings = false;

mappingBucket.forEach((mapping) => {
  const projectId = mapping.project_id ? parseInt(mapping.project_id, 10) : null;
  const purposeId = mapping.purpose_id ? parseInt(mapping.purpose_id, 10) : null;
  const phaseId = mapping.phase_id ? parseInt(mapping.phase_id, 10) : null;
  const stageIds = (mapping.stage_ids || []).map((id) => parseInt(id, 10));

  const rawRoles = mapping.roles || [];

  // roles that actually go into stage-tree (skip Initializer / Security Guard)
  const roles = rawRoles.filter((r) => {
    const rl = r.toLowerCase();
    return (
      rl !== "intializer" && rl !== "initializer" &&
      rl !== "security_guard"
    );
  });

  // 👇 detect mappings that are ONLY Initializer / Security Guard (project-level only)
  const isInitializerOnly =
    rawRoles.length > 0 &&
    rawRoles.every((r) => {
      const rl = r.toLowerCase();
      return (
        rl === "intializer" ||
        rl === "initializer" ||
        rl === "security_guard"
      );
    });

  if (isInitializerOnly) {
    hasInitializerOnlyMappings = true;
    // NOTE: we don't push these into projectsMap,
    // because they don't need stage-level mapping.
    return;
  }

  // For Maker/Checker/Supervisor, we still require purpose/phase/stage
  if (!projectId || !purposeId || !phaseId || stageIds.length === 0 || roles.length === 0) {
    return;
  }

  if (!projectsMap[projectId]) {
    projectsMap[projectId] = {};
  }
  if (!projectsMap[projectId][purposeId]) {
    projectsMap[projectId][purposeId] = {};
  }
  if (!projectsMap[projectId][purposeId][phaseId]) {
    projectsMap[projectId][purposeId][phaseId] = [];
  }

  stageIds.forEach((stageId) => {
    projectsMap[projectId][purposeId][phaseId].push({
      stage_id: stageId,
      roles,
    });
  });
});

const projectsArray = Object.entries(projectsMap).map(
  ([projectId, purposesObj]) => ({
    project_id: Number(projectId),
    mappings: Object.entries(purposesObj).map(
      ([purposeId, phasesObj]) => ({
        purpose_id: Number(purposeId),
        phases: Object.entries(phasesObj).map(
          ([phaseId, stagesArr]) => ({
            phase_id: Number(phaseId),
            stages: stagesArr,
          })
        ),
      })
    ),
  })
);

// 🔥 If there is NO stage mapping, but we DO have Initializer-only mappings,
// then just treat it as success and SKIP the /access-stage-tree/ call.
if (!projectsArray.length) {
  if (hasInitializerOnlyMappings) {
    showToast(
      "User created successfully with project-level Initializer access.",
      "success"
    );
    resetAllForms();
  } else {
    showToast(
      "User created, but no valid stage mappings found. Please check mappings.",
      "error"
    );
  }
  setIsSubmitting(false);
  return;
}


    const stageTreePayload = {
      user_id: newUserId,
      projects: projectsArray,
    };

    console.log("Payload for /users/access-stage-tree/:", stageTreePayload);

    const token = localStorage.getItem("ACCESS_TOKEN");

    const treeResp = await axios.post(
      "https://konstruct.world/users/access-stage-tree/",
      stageTreePayload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (treeResp.status === 201 || treeResp.status === 200) {
      showToast("User created successfully with mappings", "success");
      resetAllForms();
    } else {
      showToast("User created but mapping failed", "error");
    }
  } catch (error) {
    console.error("Error in handleManagerFinalSubmit:", error);

    if (error.response && error.response.data) {
      console.error("Error response data:", error.response.data);
      showToast("Error creating user or mappings. Please check data.", "error");
    } else {
      showToast("Error creating user or mappings. Please try again.", "error");
    }
  } finally {
    setIsSubmitting(false);
  }
};


  // ========== RESET ALL FORMS ==========
  const resetAllForms = () => {
    setBasicUserDetails({
      username: "",
      first_name: "",
      last_name: "",
      email: "",
      mobile: "",
      password: "",
    });
    setCurrentMapping({
      roles: [],
      project_id: "",
      purpose_id: "",
      phase_id: "",
      stage_ids: [],
      all_cat: false,
      category: "",
      CategoryLevel1: "",
      CategoryLevel2: "",
      CategoryLevel3: "",
      CategoryLevel4: "",
      CategoryLevel5: "",
      CategoryLevel6: "",
      building_id: "",
      zone_id: "",
    });
    setMappingBucket([]);
    setShowBasicDetailsModal(false);
    setShowMappingModal(false);
    setAvailableProjects([]);
    setPurposes([]);
    setPhases([]);
    setStages([]);
    setCategoryTree([]);
    setAvailableBuildings([]);
    setAvailableZones([]);
    resetCategorySelections();
     setSelectedOrgId("");   // optional
    setManagerRole(""); 
  };

  // ========== LOAD PROJECTS ON MAPPING MODAL OPEN ==========
  useEffect(() => {
    if (showMappingModal && availableProjects.length === 0) {
      fetchProjectsForManager();
    }
  }, [showMappingModal, availableProjects.length, fetchProjectsForManager]);

  // Check if roles need Purpose/Phase/Stage
  const needsPurposePhaseStage = useMemo(() => {
    const hasInitializer = currentMapping.roles.includes("Intializer");
    const hasSecurityGuard = currentMapping.roles.includes("SECURITY_GUARD");
    return (
      !hasInitializer &&
      !hasSecurityGuard &&
      currentMapping.roles.length > 0
    );
  }, [currentMapping.roles]);

  // =========== RESTRICTED CASE (NO CREATE PERMS) ===========
  if (!canCreateClient && !canCreateManager && !canCreateNormalUser) {
    return (
      <div className="flex min-h-screen" style={{ background: bgColor }}>
        <SideBarSetup />
        <div
          className="my-5 w-[85%] mt-5 ml-[16%] mr-[1%]"
          style={{
            marginLeft: sidebarOpen ? SIDEBAR_WIDTH : 0,
            transition: "margin-left 0.35s cubic-bezier(.6,-0.17,.22,1.08)",
          }}
        >
          <div
            className="px-6 py-5 max-w-7xl mx-auto rounded"
            style={{
              background: cardColor,
              border: `1.5px solid ${borderColor}`,
              color: textColor,
              boxShadow:
                theme === "dark"
                  ? "0 4px 24px 0 rgba(60,30,10,0.15)"
                  : "0 2px 8px 0 rgba(100,70,10,0.09)",
            }}
          >
            {/* {canSeeOrganization && formData.is_manager && (
  <div className="form-group">
    <label>Organization</label>
    <select
      name="organization_id"
      value={formData.organization_id || ""}
      onChange={handleChange}
      className="..."
    >
      <option value="">Select organization</option>
      {organizations.map(org => (
        <option key={org.id} value={org.id}>
          {org.name}
        </option>
      ))}
    </select>
  </div>
)} */}

            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold" style={{ color: textColor }}>
                  USER MANAGEMENT
                </h1>
                <p className="opacity-80 mt-2" style={{ color: textColor }}>
                  User creation and management
                </p>
                <div className="mt-3">
                  <span
                    className="inline-block px-3 py-1 rounded-full text-sm"
                    style={{
                      background: "#fca5a5",
                      color: "#b91c1c",
                      fontWeight: 600,
                    }}
                  >
                    {userRole} - No user creation permissions
                  </span>
                </div>
              </div>
            </div>
            
            <div
              className="rounded-lg p-8"
              style={{
                background: theme === "dark" ? "#23232c" : "#f6f8fd",
                color: textColor,
              }}
            >
              <div className="text-center">
                <div className="mb-6">
                  <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                    <MdOutlineCancel className="text-red-600 text-2xl" />
                  </div>
                  <h2
                    className="text-xl font-semibold mb-2"
                    style={{ color: textColor }}
                  >
                    Access Restricted
                  </h2>
                  <p className="opacity-70" style={{ color: textColor }}>
                    You do not have permissions to create users. Please contact
                    your administrator.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========== MAIN RENDER (CAN CREATE USERS) ===========
  return (
    <div className="flex min-h-screen" style={{ background: bgColor }}>
      <SideBarSetup />
      <div
        className="flex-1 flex justify-center items-start"
        style={{
          minHeight: "100vh",
          transition: "margin-left 0.35s cubic-bezier(.6,-0.17,.22,1.08)",
        }}
      >
        <div
          className="my-10 w-full max-w-5xl px-6 py-5 rounded"
          style={{
            background: cardColor,
            border: `1.5px solid ${borderColor}`,
            color: textColor,
            boxShadow:
              theme === "dark"
                ? "0 4px 24px 0 rgba(60,30,10,0.15)"
                : "0 2px 8px 0 rgba(100,70,10,0.09)",
          }}
        >
            
          {/* ===== HEADER ===== */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: textColor }}>
                USER MANAGEMENT
              </h1>
              <p className="opacity-80 mt-2" style={{ color: textColor }}>
                Create and manage users for your organization
              </p>
              <div className="mb-3">
                <span
                  className="inline-block px-3 py-1 rounded-full text-sm mr-2"
                  style={{
                    background: "#ffe9ba",
                    color: "#b45309",
                    fontWeight: 600,
                  }}
                >
                  {userRole} Access (Render #{renderCount.current})
                </span>
                <span
                  className="inline-block px-3 py-1 rounded-full text-sm"
                  style={{
                    background: "#c7d2fe",
                    color: "#1e293b",
                    fontWeight: 600,
                  }}
                >
                  {creationCapability}
                </span>
              </div>
            </div>
          </div>

          {/* ===== CREATE USER BUTTON ===== */}
          <div
            className="rounded-lg p-8"
            style={{
              background: theme === "dark" ? "#23232c" : "#f6f8fd",
              color: textColor,
            }}
          >
            <div className="text-center">
              <div className="mb-6">
                <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                  <FaPlus className="text-purple-600 text-2xl" />
                </div>
                <h2
                  className="text-xl font-semibold mb-2"
                  style={{ color: textColor }}
                >
                  Add New User
                </h2>
                <p className="opacity-70" style={{ color: textColor }}>
                  {canCreateClient &&
                    "Create a new client user with organization access"}
                  {canCreateManager &&
                    "Create a new manager user for your organization"}
                  {canCreateNormalUser &&
                    "Create a new user with specific roles and permissions"}
                </p>
              </div>
              <button
                onClick={() => setShowBasicDetailsModal(true)}
                className="px-8 py-3 rounded-lg flex items-center gap-2 mx-auto font-semibold"
                style={{
                  background: iconColor,
                  color: "#23232c",
                  fontWeight: 700,
                  boxShadow: "0 2px 8px 0 rgba(100,70,10,0.09)",
                }}
              >
                <FaPlus />
                {canCreateClient && "Create Client User"}
                {canCreateManager && "Create Manager User"}
                {canCreateNormalUser && "Create New User"}
              </button>
            </div>
          </div>

          {/* ===== STEP 1: BASIC DETAILS MODAL (ALL CREATORS) ===== */}
          {showBasicDetailsModal && (
            <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
              <div
                className="max-h-[90vh] w-full md:w-2/3 lg:w-1/2 rounded-lg shadow-2xl p-6 flex flex-col overflow-y-auto"
                style={{
                  background: cardColor,
                  border: `1.5px solid ${borderColor}`,
                  color: textColor,
                }}
              >
                <div className="flex items-center justify-between mb-6">
                  <h1
                    className="text-xl font-semibold"
                    style={{ color: textColor }}
                  >
                    Step 1: Basic User Details
                  </h1>
                  <button
                    className="hover:scale-110 transition"
                    onClick={resetAllForms}
                  >
                    <MdOutlineCancel size={24} style={{ color: textColor }} />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Username */}
                  <div className="grid grid-cols-3 gap-3 items-center">
                    <label className="text-sm font-medium text-end">
                      Username<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      className="col-span-2 w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                      style={{
                        background: cardColor,
                        border: `1px solid ${borderColor}`,
                        color: textColor,
                      }}
                      value={basicUserDetails.username}
                      placeholder="Enter Username"
                      onChange={(e) =>
                        setBasicUserDetails((prev) => ({
                          ...prev,
                          username: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                  

                  {/* First Name */}
                  <div className="grid grid-cols-3 gap-3 items-center">
                    <label className="text-sm font-medium text-end">
                      First Name<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      className="col-span-2 w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                      style={{
                        background: cardColor,
                        border: `1px solid ${borderColor}`,
                        color: textColor,
                      }}
                      value={basicUserDetails.first_name}
                      placeholder="Enter First Name"
                      onChange={(e) =>
                        setBasicUserDetails((prev) => ({
                          ...prev,
                          first_name: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>

                  {/* Last Name */}
                  <div className="grid grid-cols-3 gap-3 items-center">
                    <label className="text-sm font-medium text-end">
                      Last Name<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      className="col-span-2 w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                      style={{
                        background: cardColor,
                        border: `1px solid ${borderColor}`,
                        color: textColor,
                      }}
                      value={basicUserDetails.last_name}
                      placeholder="Enter Last Name"
                      onChange={(e) =>
                        setBasicUserDetails((prev) => ({
                          ...prev,
                          last_name: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>

                  {/* Email */}
                  <div className="grid grid-cols-3 gap-3 items-center">
                    <label className="text-sm font-medium text-end">
                      Email<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      className="col-span-2 w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                      style={{
                        background: cardColor,
                        border: `1px solid ${borderColor}`,
                        color: textColor,
                      }}
                      value={basicUserDetails.email}
                      placeholder="Enter Email Address"
                      onChange={(e) =>
                        setBasicUserDetails((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>

                  {/* Mobile */}
                  <div className="grid grid-cols-3 gap-3 items-center">
                    <label className="text-sm font-medium text-end">
                      Mobile
                    </label>
                    <input
                      type="tel"
                      className="col-span-2 w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                      style={{
                        background: cardColor,
                        border: `1px solid ${borderColor}`,
                        color: textColor,
                      }}
                      value={basicUserDetails.mobile}
                      placeholder="Enter Mobile Number"
                      onChange={(e) =>
                        setBasicUserDetails((prev) => ({
                          ...prev,
                          mobile: e.target.value,
                        }))
                      }
                    />
                  </div>

                  {/* Password */}
                  <div className="grid grid-cols-3 gap-3 items-center">
                    <label className="text-sm font-medium text-end">
                      Password<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      className="col-span-2 w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                      style={{
                        background: cardColor,
                        border: `1px solid ${borderColor}`,
                        color: textColor,
                      }}
                      value={basicUserDetails.password}
                      placeholder="Enter Password"
                      onChange={(e) =>
                        setBasicUserDetails((prev) => ({
                          ...prev,
                          password: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                                    {/* Organization (only when Admin/SuperAdmin is creating a Manager) */}
                  {canCreateManager && canSeeOrganization && (
                    <div className="grid grid-cols-3 gap-3 items-center">
                      <label className="text-sm font-medium text-end">
                        Organization<span className="text-red-500">*</span>
                      </label>
                      <select
                        className="col-span-2 w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                        style={{
                          background: cardColor,
                          border: `1px solid ${borderColor}`,
                          color: textColor,
                        }}
                        value={selectedOrgId}
                        onChange={(e) => setSelectedOrgId(e.target.value)}
                      >
                        <option value="">Select organization</option>
                        {organizations.map((org) => (
                          <option key={org.id} value={org.id}>
                            {org.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  
                  {/* 🔹 Manager Type (MANAGER / PROJECT_MANAGER / PROJECT_HEAD) */}
                  {canCreateManager && (
                    <div className="grid grid-cols-3 gap-3 items-center mt-1">
                      <label className="text-sm font-medium text-end">
                        Manager Role<span className="text-red-500">*</span>
                      </label>
                      <select
                        className="col-span-2 w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                        style={{
                          background: cardColor,
                          border: `1px solid ${borderColor}`,
                          color: textColor,
                        }}
                        value={managerRole}
                        onChange={(e) => setManagerRole(e.target.value)}
                      >
                        <option value="">Select role</option>
                        {MANAGER_ROLE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}



                  {/* Buttons */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      className="flex-1 py-2 px-4 rounded"
                      style={{
                        background: theme === "dark" ? "#23232c" : "#ececf0",
                        color: theme === "dark" ? "#fff" : "#222",
                        border: `1px solid ${borderColor}`,
                      }}
                      onClick={resetAllForms}
                    >
                      Cancel
                    </button>

                    {canCreateNormalUser ? (
                      // Manager -> go to mapping flow
                      <button
                        type="button"
                        className="flex-1 py-3 px-6 rounded font-semibold"
                        style={{
                          background: isBasicDetailsValid()
                            ? iconColor
                            : "#ccc",
                          color: "#23232c",
                          cursor: isBasicDetailsValid()
                            ? "pointer"
                            : "not-allowed",
                        }}
                        disabled={!isBasicDetailsValid()}
                        onClick={() => {
                          setShowBasicDetailsModal(false);
                          setShowMappingModal(true);
                        }}
                      >
                        Start Mapping →
                      </button>
                    ) : (
                      // Staff / Superadmin / Client -> direct create
                      <button
                        type="button"
                        className="flex-1 py-3 px-6 rounded font-semibold"
                        style={{
                          background: isBasicDetailsValid()
                            ? iconColor
                            : "#ccc",
                          color: "#23232c",
                          cursor:
                            isBasicDetailsValid() && !isSubmitting
                              ? "pointer"
                              : "not-allowed",
                        }}
                        disabled={!isBasicDetailsValid() || isSubmitting}
                        onClick={handleSimpleFinalSubmit}
                      >
                        {isSubmitting ? "Creating User..." : "Create User"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===== STEP 2: MAPPING MODAL (ONLY FOR MANAGER) ===== */}
          {canCreateNormalUser && showMappingModal && (
            <div
              className="fixed inset-0 flex items-center justify-center bg-black/40 z-50 p-4"
              style={{
                marginLeft: sidebarOpen ? `${SIDEBAR_WIDTH}px` : "0",
              }}
            >
              <div
                className="max-h-[95vh] w-full max-w-7xl rounded-lg shadow-2xl flex flex-col"
                style={{
                  background: cardColor,
                  border: `1.5px solid ${borderColor}`,
                  color: textColor,
                }}
              >
                {/* Modal Header */}
                <div
                  className="flex items-center justify-between p-6 border-b"
                  style={{ borderColor }}
                >
                  <div>
                    <h1
                      className="text-xl font-semibold"
                      style={{ color: textColor }}
                    >
                      Step 2: Configure Access Mapping
                    </h1>
                    <p className="text-sm opacity-70 mt-1">
                      User: {basicUserDetails.username} (
                      {basicUserDetails.email})
                    </p>
                  </div>
                  <button
                    className="hover:scale-110 transition"
                    onClick={resetAllForms}
                  >
                    <MdOutlineCancel size={24} style={{ color: textColor }} />
                  </button>
                </div>

                {/* Modal Body: Left (Selection) + Right (Bucket) */}
                <div className="flex-1 overflow-hidden flex gap-4 p-6">
                  {/* ===== LEFT SIDE: SELECTION PANEL ===== */}
                  <div className="flex-1 overflow-y-auto pr-4 space-y-4">
                    <h3 className="font-semibold text-lg mb-4">
                      Selection Panel
                    </h3>

                    {/* Roles (Multi-select with checkboxes) */}
                    <div className="border rounded p-4" style={{ borderColor }}>
                      <label className="block font-medium mb-2">
                        Roles<span className="text-red-500">*</span>
                      </label>
                      <div className="space-y-2">
                        {ROLE_OPTIONS.map((role) => (
                          <label
                            key={role.value}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={currentMapping.roles.includes(
                                role.value
                              )}
                              onChange={() => handleRoleToggle(role.value)}
                              className="h-4 w-4"
                            />
                            <span>{role.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Project */}
                    <div>
                      <label className="block font-medium mb-2">
                        Project<span className="text-red-500">*</span>
                      </label>
                      <select
                        className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                        style={{
                          background: cardColor,
                          border: `1px solid ${borderColor}`,
                          color: textColor,
                        }}
                        value={currentMapping.project_id}
                        onChange={handleProjectChange}
                        disabled={projectsLoading}
                      >
                        <option value="">
                          {projectsLoading
                            ? "Loading projects..."
                            : "Select Project"}
                        </option>
                        {availableProjects.map((project) => (
                          <option key={project.id} value={project.id}>
                            {project.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Purpose/Phase/Stage - Only for non-Initializer/Security roles */}
                    {needsPurposePhaseStage && (
                      <>
                        {/* Purpose */}
                        <div>
                          <label className="block font-medium mb-2">
                            Purpose<span className="text-red-500">*</span>
                          </label>
                          <select
                            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                            style={{
                              background: cardColor,
                              border: `1px solid ${borderColor}`,
                              color: textColor,
                            }}
                            value={currentMapping.purpose_id}
                            onChange={handlePurposeChange}
                          >
                            <option value="">Select Purpose</option>
                            {purposes.map((p) => {
                              const purposeName =
                                p.purpose?.name ||
                                p.name?.purpose?.name ||
                                p.name?.name ||
                                p.purpose_name ||
                                `Purpose ${p.id}`;
                              return (
                                <option key={p.id} value={p.id}>
                                  {purposeName}
                                </option>
                              );
                            })}
                          </select>
                        </div>

                        {/* Phase */}
                        <div>
                          <label className="block font-medium mb-2">
                            Phase<span className="text-red-500">*</span>
                          </label>
                          <select
                            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                            style={{
                              background: cardColor,
                              border: `1px solid ${borderColor}`,
                              color: textColor,
                            }}
                            value={currentMapping.phase_id}
                            onChange={handlePhaseChange}
                          >
                            <option value="">Select Phase</option>
                            {phases.map((ph) => (
                              <option key={ph.id} value={ph.id}>
                                {ph.name || ph.phase}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Stages (Multi-select) */}
                        <div>
                          <label className="block font-medium mb-2">
                            Stage(s)<span className="text-red-500">*</span>
                          </label>
                          <select
                            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                            style={{
                              background: cardColor,
                              border: `1px solid ${borderColor}`,
                              color: textColor,
                            }}
                            multiple
                            size={Math.min(6, stages.length || 4)}
                            value={currentMapping.stage_ids}
                            onChange={handleStageChange}
                          >
                            {stages.length === 0 && (
                              <option disabled>
                                First select Purpose & Phase
                              </option>
                            )}
                            {stages.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name || s.stage}
                              </option>
                            ))}
                          </select>
                          <p className="text-xs mt-1 opacity-70">
                            Hold <strong>Ctrl</strong> (Cmd on Mac) to select
                            multiple
                          </p>
                        </div>

                        {/* Category Tree */}
                        <div
                          className="border-t pt-4"
                          style={{ borderColor }}
                        >
                          <label className="block font-medium mb-2">
                            Category Access
                          </label>

                          {/* Select All Categories Checkbox */}
                          <div className="flex items-center gap-2 mb-3">
                            <input
                              type="checkbox"
                              className="h-4 w-4"
                              checked={currentMapping.all_cat}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setCurrentMapping((prev) => ({
                                  ...prev,
                                  all_cat: checked,
                                  category: "",
                                  CategoryLevel1: "",
                                  CategoryLevel2: "",
                                  CategoryLevel3: "",
                                  CategoryLevel4: "",
                                  CategoryLevel5: "",
                                  CategoryLevel6: "",
                                }));
                                if (checked) {
                                  resetCategorySelections();
                                }
                              }}
                            />
                            <span className="text-sm">
                              Select all categories
                            </span>
                          </div>

                          {/* Category Dropdown */}
                          {!currentMapping.all_cat && (
                            <>
                              <div className="mb-3">
                                <label className="block text-sm mb-1">
                                  Category
                                  <span className="text-red-500">*</span>
                                </label>
                                <select
                                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                                  style={{
                                    background: cardColor,
                                    border: `1px solid ${borderColor}`,
                                    color: textColor,
                                  }}
                                  value={currentMapping.category}
                                  onChange={handleCategoryChange}
                                  disabled={
                                    categoryLoading ||
                                    categoryTree.length === 0
                                  }
                                >
                                  <option value="">
                                    {categoryLoading
                                      ? "Loading categories..."
                                      : categoryTree.length === 0
                                      ? "No categories available"
                                      : "Select Category"}
                                  </option>
                                  {categoryTree.map((category) => (
                                    <option key={category.id} value={category.id}>
                                      {category.name}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {/* Sub-Category Levels */}
                              {currentMapping.category &&
                                availableLevel1.length > 0 && (
                                  <div className="mb-3">
                                    <label className="block text-sm mb-1">
                                      Sub-Category 1
                                    </label>
                                    <select
                                      className="w-full p-2 border rounded"
                                      style={{
                                        background: cardColor,
                                        border: `1px solid ${borderColor}`,
                                        color: textColor,
                                      }}
                                      value={currentMapping.CategoryLevel1}
                                      onChange={handleLevel1Change}
                                    >
                                      <option value="">Select (Optional)</option>
                                      {availableLevel1.map((item) => (
                                        <option key={item.id} value={item.id}>
                                          {item.name}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                )}

                              {currentMapping.CategoryLevel1 &&
                                availableLevel2.length > 0 && (
                                  <div className="mb-3">
                                    <label className="block text-sm mb-1">
                                      Sub-Category 2
                                    </label>
                                    <select
                                      className="w-full p-2 border rounded"
                                      style={{
                                        background: cardColor,
                                        border: `1px solid ${borderColor}`,
                                        color: textColor,
                                      }}
                                      value={currentMapping.CategoryLevel2}
                                      onChange={handleLevel2Change}
                                    >
                                      <option value="">Select (Optional)</option>
                                      {availableLevel2.map((item) => (
                                        <option key={item.id} value={item.id}>
                                          {item.name}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                )}

                              {currentMapping.CategoryLevel2 &&
                                availableLevel3.length > 0 && (
                                  <div className="mb-3">
                                    <label className="block text-sm mb-1">
                                      Sub-Category 3
                                    </label>
                                    <select
                                      className="w-full p-2 border rounded"
                                      style={{
                                        background: cardColor,
                                        border: `1px solid ${borderColor}`,
                                        color: textColor,
                                      }}
                                      value={currentMapping.CategoryLevel3}
                                      onChange={handleLevel3Change}
                                    >
                                      <option value="">Select (Optional)</option>
                                      {availableLevel3.map((item) => (
                                        <option key={item.id} value={item.id}>
                                          {item.name}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                )}

                              {currentMapping.CategoryLevel3 &&
                                availableLevel4.length > 0 && (
                                  <div className="mb-3">
                                    <label className="block text-sm mb-1">
                                      Sub-Category 4
                                    </label>
                                    <select
                                      className="w-full p-2 border rounded"
                                      style={{
                                        background: cardColor,
                                        border: `1px solid ${borderColor}`,
                                        color: textColor,
                                      }}
                                      value={currentMapping.CategoryLevel4}
                                      onChange={handleLevel4Change}
                                    >
                                      <option value="">Select (Optional)</option>
                                      {availableLevel4.map((item) => (
                                        <option key={item.id} value={item.id}>
                                          {item.name}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                )}

                              {currentMapping.CategoryLevel4 &&
                                availableLevel5.length > 0 && (
                                  <div className="mb-3">
                                    <label className="block text-sm mb-1">
                                      Sub-Category 5
                                    </label>
                                    <select
                                      className="w-full p-2 border rounded"
                                      style={{
                                        background: cardColor,
                                        border: `1px solid ${borderColor}`,
                                        color: textColor,
                                      }}
                                      value={currentMapping.CategoryLevel5}
                                      onChange={handleLevel5Change}
                                    >
                                      <option value="">Select (Optional)</option>
                                      {availableLevel5.map((item) => (
                                        <option key={item.id} value={item.id}>
                                          {item.name}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                )}

                              {currentMapping.CategoryLevel5 &&
                                availableLevel6.length > 0 && (
                                  <div className="mb-3">
                                    <label className="block text-sm mb-1">
                                      Sub-Category 6
                                    </label>
                                    <select
                                      className="w-full p-2 border rounded"
                                      style={{
                                        background: cardColor,
                                        border: `1px solid ${borderColor}`,
                                        color: textColor,
                                      }}
                                      value={currentMapping.CategoryLevel6}
                                      onChange={handleLevel6Change}
                                    >
                                      <option value="">Select (Optional)</option>
                                      {availableLevel6.map((item) => (
                                        <option key={item.id} value={item.id}>
                                          {item.name}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                )}
                            </>
                          )}
                        </div>
                      </>
                    )}

                    {/* Location: Building & Zone */}
                    {currentMapping.project_id &&
                      availableBuildings.length > 0 && (
                        <div
                          className="border-t pt-4"
                          style={{ borderColor }}
                        >
                          <label className="block font-medium mb-2">
                            Location (Optional)
                          </label>

                          <div className="mb-3">
                            <label className="block text-sm mb-1">
                              Building
                            </label>
                            <select
                              className="w-full p-2 border rounded"
                              style={{
                                background: cardColor,
                                border: `1px solid ${borderColor}`,
                                color: textColor,
                              }}
                              value={currentMapping.building_id}
                              onChange={handleBuildingChange}
                            >
                              <option value="">Select Building</option>
                              {availableBuildings.map((building) => (
                                <option key={building.id} value={building.id}>
                                  {building.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          {currentMapping.building_id &&
                            availableZones.length > 0 && (
                              <div>
                                <label className="block text-sm mb-1">
                                  Zone
                                </label>
                                <select
                                  className="w-full p-2 border rounded"
                                  style={{
                                    background: cardColor,
                                    border: `1px solid ${borderColor}`,
                                    color: textColor,
                                  }}
                                  value={currentMapping.zone_id}
                                  onChange={handleZoneChange}
                                >
                                  <option value="">Select Zone</option>
                                  {availableZones.map((zone) => (
                                    <option key={zone.id} value={zone.id}>
                                      {zone.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}
                        </div>
                      )}

                    {/* Add to Bucket Button */}
                    <button
                      type="button"
                      className="w-full py-3 rounded font-semibold mt-6"
                      style={{
                        background: isCurrentMappingValid() ? iconColor : "#ccc",
                        color: "#23232c",
                        cursor: isCurrentMappingValid()
                          ? "pointer"
                          : "not-allowed",
                      }}
                      disabled={!isCurrentMappingValid()}
                      onClick={handleAddMappingToBucket}
                    >
                      Add Mapping to Bucket
                    </button>
                  </div>

                  {/* ===== RIGHT SIDE: BUCKET VIEW ===== */}
                  <div
                    className="w-1/3 border-l pl-4 overflow-y-auto"
                    style={{ borderColor }}
                  >
                    <h3
                      className="font-semibold text-lg mb-4 sticky top-0 pb-2"
                      style={{ background: cardColor }}
                    >
                      Mapping Bucket ({mappingBucket.length})
                    </h3>

                    {mappingBucket.length === 0 ? (
                      <div className="text-center py-8 opacity-50">
                        <p>No mappings added yet</p>
                        <p className="text-sm mt-2">
                          Configure selections and click "Add to Bucket"
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {mappingBucket.map((mapping, index) => (
                          <div
                            key={index}
                            className="border rounded p-3 relative"
                            style={{
                              borderColor,
                              background:
                                theme === "dark" ? "#2a2a35" : "#f9f9fb",
                            }}
                          >
                            {/* Delete Button */}
                            <button
                              className="absolute top-2 right-2 hover:scale-110 transition"
                              onClick={() =>
                                handleRemoveMappingFromBucket(index)
                              }
                            >
                              <MdDelete
                                size={18}
                                style={{ color: "#ef4444" }}
                              />
                            </button>

                            {/* Mapping Details */}
                            <div className="text-sm space-y-1 pr-6">
                              <div>
                                <strong>Roles:</strong>{" "}
                                {mapping.roles.join(", ")}
                              </div>
                              <div>
                                <strong>Project:</strong>{" "}
                                {mapping.displayNames.project}
                              </div>
                              {mapping.displayNames.purpose && (
                                <div>
                                  <strong>Purpose:</strong>{" "}
                                  {mapping.displayNames.purpose}
                                </div>
                              )}
                              {mapping.displayNames.phase && (
                                <div>
                                  <strong>Phase:</strong>{" "}
                                  {mapping.displayNames.phase}
                                </div>
                              )}
                              {mapping.displayNames.stages.length > 0 && (
                                <div>
                                  <strong>Stages:</strong>{" "}
                                  {mapping.displayNames.stages.join(", ")}
                                </div>
                              )}
                              <div>
                                <strong>Category:</strong>{" "}
                                {mapping.all_cat ? (
                                  "All Categories"
                                ) : (
                                  [
                                    mapping.displayNames.category,
                                    mapping.displayNames.level1,
                                    mapping.displayNames.level2,
                                    mapping.displayNames.level3,
                                    mapping.displayNames.level4,
                                    mapping.displayNames.level5,
                                    mapping.displayNames.level6,
                                  ]
                                    .filter(Boolean)
                                    .join(" > ")
                                )}
                              </div>
                              {mapping.displayNames.building && (
                                <div>
                                  <strong>Building:</strong>{" "}
                                  {mapping.displayNames.building}
                                </div>
                              )}
                              {mapping.displayNames.zone && (
                                <div>
                                  <strong>Zone:</strong>{" "}
                                  {mapping.displayNames.zone}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Modal Footer */}
                <div
                  className="flex gap-3 p-6 border-t"
                  style={{ borderColor }}
                >
                  <button
                    type="button"
                    className="px-6 py-2 rounded"
                    style={{
                      background: theme === "dark" ? "#23232c" : "#ececf0",
                      color: theme === "dark" ? "#fff" : "#222",
                      border: `1px solid ${borderColor}`,
                    }}
                    onClick={() => {
                      setShowMappingModal(false);
                      setShowBasicDetailsModal(true);
                    }}
                  >
                    ← Back to Details
                  </button>
                  <button
                    type="button"
                    className="flex-1 py-3 rounded font-semibold"
                    style={{
                      background:
                        mappingBucket.length > 0 ? "#7c3aed" : "#ccc",
                      color: "#fff",
                      cursor:
                        mappingBucket.length > 0 && !isSubmitting
                          ? "pointer"
                          : "not-allowed",
                    }}
                    disabled={mappingBucket.length === 0 || isSubmitting}
                    onClick={handleManagerFinalSubmit}
                  >
                    {isSubmitting ? "Creating User..." : "Save User & Mappings"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default User;
