import { useEffect, useState } from "react";
import LegacyChecklistWrapper from "./LegacyChecklistWrapper";
import TemplateChecklistList from "./TemplateChecklistList";
import TemplateChecklistForm from "./TemplateChecklistForm";
import TemplateChecklistDetails from "./TemplateChecklistDetails";
import TemplateInitializeModal from "./TemplateInitializeModal";
import ManualChecklistList from "./ManualChecklistList";
import ManualChecklistForm from "./ManualChecklistForm";
import ManualChecklistDetails from "./ManualChecklistDetails";
import {
  getManualChecklistTemplates,
  deleteManualChecklistTemplateById,
} from "../../../api/manualChecklistApi";
import {
  getProjectsByOwnership,
  getProjectUserDetails,
  Allprojects,
  getPurposeByProjectId,
  getPhaseByPurposeId,
  GetstagebyPhaseid,
  getCategoryTreeByProject,
  fetchNestedProjectData,
} from "../../../api";
import {
  deleteChecklistTemplateById,
  getChecklistTemplates,
  getRoomsByProject,
} from "../../../api/checklistTemplateApi";
import { showToast } from "../../../utils/toast";
import { useTheme } from "../../../ThemeContext";
import { useSidebar } from "../../../components/SidebarContext";

const ORANGE = "#ffbe63";
const BG_OFFWHITE = "#fcfaf7";
const SIDEBAR_WIDTH = 0;

export const getPalette = (theme) => ({
  bg: theme === "dark" ? "#191922" : BG_OFFWHITE,
  card: theme === "dark" ? "#23232c" : "#fff",
  border: ORANGE,
  text: theme === "dark" ? "#fff" : "#222",
  textSecondary: theme === "dark" ? "#ffbe63b3" : "#b54b13b3",
  badge: ORANGE,
  badgeText: theme === "dark" ? "#23232c" : "#fff",
  shadow:
    theme === "dark"
      ? "0 4px 24px 0 rgba(255, 190, 99, 0.18)"
      : "0 4px 24px 0 rgba(255,190,99,0.12)",
  primaryBtn: {
    background: ORANGE,
    color: "#23232c",
    border: `2px solid ${ORANGE}`,
    fontWeight: 600,
  },
  secondaryBtn: {
    background: "#fff",
    color: "#b54b13",
    border: `2px solid ${ORANGE}`,
    fontWeight: 600,
  },
  dangerBtn: {
    background: "#ef4444",
    color: "#fff",
    border: `2px solid #ef4444`,
    fontWeight: 600,
  },
  successBtn: {
    background: "#10b981",
    color: "#fff",
    border: `2px solid #10b981`,
    fontWeight: 600,
  },
  infoBtn: {
    background: "#2563eb",
    color: "#fff",
    border: `2px solid #2563eb`,
    fontWeight: 600,
  },
  tableHeadBg: theme === "dark" ? "#191919" : "#fff7ea",
  tableHeadText: theme === "dark" ? "#ffbe63" : "#b54b13",
  tableRowBg: theme === "dark" ? "#23232c" : "#fff",
  icon: ORANGE,
  tableNoDataBg: theme === "dark" ? "#23232c" : "#fff7ea",
});

const toArray = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

const normalizePurposes = (raw) => {
  return toArray(raw).map((item) => ({
    id: item?.id,
    name:
      item?.name?.purpose?.name ||
      item?.name?.name ||
      item?.purpose?.name ||
      item?.purpose ||
      `Purpose ${item?.id}`,
  }));
};

const normalizePhases = (raw) => {
  return toArray(raw).map((item) => ({
    id: item?.id,
    name:
      item?.name ||
      item?.phase_name ||
      item?.phase ||
      item?.title ||
      `Phase ${item?.id}`,
  }));
};

const normalizeStages = (raw) => {
  return toArray(raw).map((item) => ({
    id: item?.id,
    name:
      item?.name ||
      item?.stage_name ||
      item?.stage ||
      item?.title ||
      `Stage ${item?.id}`,
  }));
};

const normalizeCategories = (raw) => {
  return toArray(raw).map((item) => ({
    id: item?.id,
    name:
      item?.name ||
      item?.category_name ||
      item?.title ||
      `Category ${item?.id}`,
  }));
};

const extractBuildings = (nested) => {
  if (!nested) return [];
  return (
    nested?.buildings ||
    nested?.towers ||
    nested?.blocks ||
    nested?.data?.buildings ||
    nested?.data?.towers ||
    []
  );
};

const extractFloors = (building) => {
  if (!building) return [];
  return building?.floors || building?.levels || building?.stories || [];
};

const extractUnits = (floor) => {
  if (!floor) return [];
  return floor?.units || floor?.flats || floor?.apartments || [];
};

const ChecklistManager = () => {
  const { theme } = useTheme();
  const palette = getPalette(theme);
  const { sidebarOpen } = useSidebar();

  const [userData, setUserData] = useState(null);
  const [projects, setProjects] = useState([]);
  const [purposes, setPurposes] = useState([]);
  const [phases, setPhases] = useState([]);
  const [stages, setStages] = useState([]);
  const [categories, setCategories] = useState([]);

  const [buildings, setBuildings] = useState([]);
  const [floors, setFloors] = useState([]);
  const [units, setUnits] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [projectNested, setProjectNested] = useState(null);

  const [context, setContext] = useState({
    project_id: "",
    purpose_id: "",
    phase_id: "",
    stage_id: "",
    category: "",
  });

  const [activeTab, setActiveTab] = useState("templates");
  const [pageState, setPageState] = useState("list");

  const [templates, setTemplates] = useState([]);
const [manualTemplates, setManualTemplates] = useState([]);
const [manualTemplatesLoading, setManualTemplatesLoading] = useState(false);

const [selectedManualTemplate, setSelectedManualTemplate] = useState(null);

  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const [selectedLegacyChecklist, setSelectedLegacyChecklist] = useState(null);
  const [showLegacyForm, setShowLegacyForm] = useState(false);
  const [showLegacyDetail, setShowLegacyDetail] = useState(false);

  const [initializeOpen, setInitializeOpen] = useState(false);
  const [initializeTemplate, setInitializeTemplate] = useState(null);

  const contentMarginLeft = sidebarOpen ? SIDEBAR_WIDTH : 0;

  useEffect(() => {
    const role = localStorage.getItem("ROLE");
    const userString = localStorage.getItem("USER_DATA");
    const parsedUserData =
      userString && userString !== "undefined" ? JSON.parse(userString) : null;

    setUserData(parsedUserData);

    if (!parsedUserData) {
      setProjects([]);
      return;
    }

    const fetchProjects = async () => {
      try {
        let response = null;

        if (role === "Super Admin") {
          response = await Allprojects();
        } else if (role === "Admin") {
          response = await getProjectUserDetails();
        } else {
          const entity_id = parsedUserData.entity_id || null;
          const company_id = parsedUserData.company_id || null;
          const organization_id =
            parsedUserData.org || parsedUserData.organization_id || null;

          if (!entity_id && !company_id && !organization_id) {
            setProjects([]);
            return;
          }

          response = await getProjectsByOwnership({
            entity_id,
            company_id,
            organization_id,
          });
        }

        if (response?.status === 200) {
          setProjects(response.data.projects || []);
        } else {
          setProjects([]);
          showToast("Failed to fetch projects.", "error");
        }
      } catch (error) {
        setProjects([]);
        showToast("Failed to fetch projects.", "error");
      }
    };

    fetchProjects();
  }, []);

  useEffect(() => {
    if (!context.project_id) {
      setPurposes([]);
      setPhases([]);
      setStages([]);
      setCategories([]);
      setBuildings([]);
      setFloors([]);
      setUnits([]);
      setRooms([]);
      setProjectNested(null);
      return;
    }

    const loadProjectDependencies = async () => {
      try {
        const [purposeRes, categoryRes, roomRes, nestedRes] = await Promise.all(
          [
            getPurposeByProjectId(context.project_id),
            getCategoryTreeByProject(context.project_id),
            getRoomsByProject(context.project_id),
            fetchNestedProjectData(context.project_id),
          ],
        );

        setPurposes(normalizePurposes(purposeRes?.data));
        setCategories(normalizeCategories(categoryRes?.data));
        setPhases([]);
        setStages([]);

        const roomData = roomRes?.data?.results || roomRes?.data || [];
        setRooms(Array.isArray(roomData) ? roomData : []);

        const nestedData = nestedRes || {};
        setProjectNested(nestedData);

        const buildingList = extractBuildings(nestedData);
        setBuildings(Array.isArray(buildingList) ? buildingList : []);
        setFloors([]);
        setUnits([]);
      } catch (error) {
        setPurposes([]);
        setPhases([]);
        setStages([]);
        setCategories([]);
        setBuildings([]);
        setFloors([]);
        setUnits([]);
        setRooms([]);
        setProjectNested(null);
      }
    };

    loadProjectDependencies();
  }, [context.project_id]);

  useEffect(() => {
    if (!context.purpose_id) {
      setPhases([]);
      setStages([]);
      return;
    }

    const loadPhases = async () => {
      try {
        const response = await getPhaseByPurposeId(context.purpose_id);
        setPhases(normalizePhases(response?.data));
        setStages([]);
      } catch (error) {
        setPhases([]);
        setStages([]);
      }
    };

    loadPhases();
  }, [context.purpose_id]);

  useEffect(() => {
    if (!context.phase_id) {
      setStages([]);
      return;
    }

    const loadStages = async () => {
      try {
        const response = await GetstagebyPhaseid(context.phase_id);
        setStages(normalizeStages(response?.data));
      } catch (error) {
        setStages([]);
      }
    };

    loadStages();
  }, [context.phase_id]);

  useEffect(() => {
    if (!selectedTemplate || !context.project_id || !projectNested) {
      setFloors([]);
      setUnits([]);
      return;
    }

    const selectedBuildingIds = Array.isArray(
      selectedTemplate.selected_building_ids,
    )
      ? selectedTemplate.selected_building_ids.map(String)
      : [];

    const selectedFloorIds = Array.isArray(selectedTemplate.selected_floor_ids)
      ? selectedTemplate.selected_floor_ids.map(String)
      : [];

    const derivedBuildings = extractBuildings(projectNested);
    const validBuildings = derivedBuildings.filter((building) =>
      selectedBuildingIds.includes(String(building.id)),
    );

    const derivedFloors = [];
    validBuildings.forEach((building) => {
      derivedFloors.push(...extractFloors(building));
    });

    const uniqueFloors = Array.from(
      new Map(derivedFloors.map((item) => [String(item.id), item])).values(),
    );
    setFloors(uniqueFloors);

    const validFloors = uniqueFloors.filter((floor) =>
      selectedFloorIds.includes(String(floor.id)),
    );

    const derivedUnits = [];
    validFloors.forEach((floor) => {
      derivedUnits.push(...extractUnits(floor));
    });

    const uniqueUnits = Array.from(
      new Map(derivedUnits.map((item) => [String(item.id), item])).values(),
    );
    setUnits(uniqueUnits);
  }, [selectedTemplate, context.project_id, projectNested]);

  const fetchTemplates = async () => {
    if (!context.project_id) {
      setTemplates([]);
      return;
    }

    setTemplatesLoading(true);
    try {
      const params = {
        project_id: context.project_id,
        is_active: true,
      };

      if (context.purpose_id) params.purpose_id = context.purpose_id;
      if (context.phase_id) params.phase_id = context.phase_id;
      if (context.stage_id) params.stage_id = context.stage_id;
      if (context.category) params.category = context.category;

      const response = await getChecklistTemplates(params);
      const data = response?.data?.results || response?.data || [];
      setTemplates(Array.isArray(data) ? data : []);
    } catch (error) {
      setTemplates([]);
    } finally {
      setTemplatesLoading(false);
    }
  };

const fetchManualTemplates = async () => {
  if (!context.project_id) {
    setManualTemplates([]);
    return;
  }

  setManualTemplatesLoading(true);

  try {
    const params = {
      project_id: context.project_id,
    };

    if (context.phase_id) {
      params.phase_id = context.phase_id;
    }

    if (context.stage_id) {
      params.stage_id = context.stage_id;
    }

    const response = await getManualChecklistTemplates(params);

    const data = response?.data?.results || response?.data || [];

    setManualTemplates(Array.isArray(data) ? data : []);
  } catch (error) {
    setManualTemplates([]);
  } finally {
    setManualTemplatesLoading(false);
  }
};
  
  useEffect(() => {
    fetchTemplates();
  }, [
    context.project_id,
    context.purpose_id,
    context.phase_id,
    context.stage_id,
    context.category,
  ]);

useEffect(() => {
  if (activeTab === "manual") {
    fetchManualTemplates();
  }
}, [
  activeTab,
  context.project_id
]);
  
  const handleContextChange = (key, value) => {
    setContext((prev) => ({
      ...prev,
      [key]: value,
      ...(key === "project_id"
        ? { purpose_id: "", phase_id: "", stage_id: "", category: "" }
        : {}),
      ...(key === "purpose_id" ? { phase_id: "", stage_id: "" } : {}),
      ...(key === "phase_id" ? { stage_id: "" } : {}),
    }));

    setPageState("list");
    setSelectedTemplate(null);
    setShowLegacyForm(false);
    setShowLegacyDetail(false);
  };

  const handleDeleteTemplate = async (template) => {
    const confirmed = window.confirm(`Delete template "${template.name}"?`);
    if (!confirmed) return;

    try {
      await deleteChecklistTemplateById(template.id);
      showToast("Checklist template deleted successfully.", "success");
      fetchTemplates();
    } catch (error) {
      showToast("Failed to delete checklist template.", "error");
    }
  };

  const handleDeleteManualTemplate = async (template) => {
    const confirmed = window.confirm(`Delete template "${template.name}"?`);

    if (!confirmed) return;

    try {
      await deleteManualChecklistTemplateById(template.id);

      showToast("Manual template deleted successfully.", "success");

      fetchManualTemplates();
    } catch (error) {
      showToast("Failed to delete manual template.", "error");
    }
  };

  if (!userData) {
    return (
      <div
        className="flex items-center justify-center min-h-screen"
        style={{ background: palette.bg }}
      >
        <div className="flex items-center space-x-4">
          <div
            className="animate-spin rounded-full h-8 w-8"
            style={{ borderBottom: `2px solid ${palette.border}` }}
          />
          <span className="text-lg font-medium" style={{ color: palette.text }}>
            Loading...
          </span>
        </div>
      </div>
    );
  }

  if (pageState === "form" && activeTab === "templates") {
    return (
      <div
        style={{
          background: palette.bg,
          minHeight: "100vh",
          marginLeft: contentMarginLeft,
          transition: "margin-left 0.35s cubic-bezier(.6,-0.17,.22,1.08)",
          padding: 16,
        }}
      >
        <div className="max-w-7xl mx-auto">
          <TemplateChecklistForm
            palette={palette}
            template={selectedTemplate}
            context={context}
            projectOptions={projects}
            onBack={() => {
              setPageState("list");
              setSelectedTemplate(null);
            }}
            onSaved={() => {
              setPageState("list");
              setSelectedTemplate(null);
              setActiveTab("templates");
              fetchTemplates();
            }}
          />
        </div>
      </div>
    );
  }

  if (pageState === "detail" && activeTab === "templates") {
    return (
      <div
        style={{
          background: palette.bg,
          minHeight: "100vh",
          marginLeft: contentMarginLeft,
          transition: "margin-left 0.35s cubic-bezier(.6,-0.17,.22,1.08)",
          padding: 16,
        }}
      >
        <div className="max-w-7xl mx-auto">
          <TemplateChecklistDetails
            palette={palette}
            template={selectedTemplate}
            projectOptions={projects}
            purposeOptions={purposes}
            phaseOptions={phases}
            stageOptions={stages}
            categoryOptions={categories}
            buildingOptions={buildings}
            floorOptions={floors}
            unitOptions={units}
            roomOptions={rooms}
            onBack={() => {
              setPageState("list");
              setSelectedTemplate(null);
            }}
            onEdit={(template) => {
              setSelectedTemplate(template);
              setPageState("form");
            }}
            onInitialize={(template) => {
              setInitializeTemplate(template);
              setInitializeOpen(true);
            }}
          />

          <TemplateInitializeModal
            palette={palette}
            template={initializeTemplate}
            isOpen={initializeOpen}
            onClose={() => {
              setInitializeOpen(false);
              setInitializeTemplate(null);
            }}
            onInitialized={() => {}}
          />
        </div>
      </div>
    );
  }

  if (pageState === "form" && activeTab === "manual") {
    return (
      <div
        style={{
          background: palette.bg,
          minHeight: "100vh",
          marginLeft: contentMarginLeft,
          transition: "margin-left 0.35s cubic-bezier(.6,-0.17,.22,1.08)",
          padding: 16,
        }}
      >
        <div className="max-w-7xl mx-auto">
          <ManualChecklistForm
            palette={palette}
            template={selectedManualTemplate}
            context={context}
            onBack={() => {
              setPageState("list");
              setSelectedManualTemplate(null);
            }}
            onSaved={() => {
              setPageState("list");
              setSelectedManualTemplate(null);
            }}
          />
        </div>
      </div>
    );
  }

  if (pageState === "detail" && activeTab === "manual") {
    return (
      <div
        style={{
          background: palette.bg,
          minHeight: "100vh",
          marginLeft: contentMarginLeft,
          transition: "margin-left 0.35s cubic-bezier(.6,-0.17,.22,1.08)",
          padding: 16,
        }}
      >
        <div className="max-w-7xl mx-auto">
          <ManualChecklistDetails
            palette={palette}
            template={selectedManualTemplate}
            onBack={() => {
              setPageState("list");
              setSelectedManualTemplate(null);
            }}
            onEdit={(template) => {
              setSelectedManualTemplate(template);
              setPageState("form");
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        background: palette.bg,
        minHeight: "100vh",
        marginLeft: contentMarginLeft,
        transition: "margin-left 0.35s cubic-bezier(.6,-0.17,.22,1.08)",
        padding: 16,
      }}
    >
      <div
        className="max-w-7xl mx-auto p-4 lg:p-8 rounded-2xl"
        style={{
          background: palette.card,
          border: `2px solid ${palette.border}`,
          boxShadow: palette.shadow,
        }}
      >
        <div className="mb-8 flex items-center">
          <div
            className="p-3 rounded-xl flex items-center justify-center"
            style={{ background: palette.badge, color: palette.badgeText }}
          >
            <svg
              width="28"
              height="28"
              fill="none"
              stroke={palette.icon}
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              viewBox="0 0 24 24"
            >
              <rect width="24" height="24" rx="6" fill={palette.badge} />
              <path d="M9 5H7a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 1 2 2h2a2 2 0 0 1 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>
          <div className="ml-4">
            <h1 className="text-3xl font-bold" style={{ color: palette.text }}>
              Checklist Management
            </h1>
            <p
              className="text-lg mt-1"
              style={{ color: palette.textSecondary }}
            >
              Template and legacy checklist flows in one place
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div>
            <label
              style={{ display: "block", marginBottom: 8, color: palette.text }}
            >
              Project
            </label>
            <select
              value={context.project_id}
              onChange={(e) =>
                handleContextChange("project_id", e.target.value)
              }
              style={{
                width: "100%",
                padding: 14,
                borderRadius: 12,
                background: palette.card,
                color: palette.text,
                border: `2px solid ${palette.border}`,
              }}
            >
              <option value="">Select Project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              style={{ display: "block", marginBottom: 8, color: palette.text }}
            >
              Purpose
            </label>
            <select
              value={context.purpose_id}
              onChange={(e) =>
                handleContextChange("purpose_id", e.target.value)
              }
              style={{
                width: "100%",
                padding: 14,
                borderRadius: 12,
                background: palette.card,
                color: palette.text,
                border: `2px solid ${palette.border}`,
              }}
            >
              <option value="">Select Purpose</option>
              {purposes.map((purpose) => (
                <option key={purpose.id} value={purpose.id}>
                  {purpose.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              style={{ display: "block", marginBottom: 8, color: palette.text }}
            >
              Phase
            </label>
            <select
              value={context.phase_id}
              onChange={(e) => handleContextChange("phase_id", e.target.value)}
              style={{
                width: "100%",
                padding: 14,
                borderRadius: 12,
                background: palette.card,
                color: palette.text,
                border: `2px solid ${palette.border}`,
              }}
            >
              <option value="">Select Phase</option>
              {phases.map((phase) => (
                <option key={phase.id} value={phase.id}>
                  {phase.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              style={{ display: "block", marginBottom: 8, color: palette.text }}
            >
              Stage
            </label>
            <select
              value={context.stage_id}
              onChange={(e) => handleContextChange("stage_id", e.target.value)}
              style={{
                width: "100%",
                padding: 14,
                borderRadius: 12,
                background: palette.card,
                color: palette.text,
                border: `2px solid ${palette.border}`,
              }}
            >
              <option value="">Select Stage</option>
              {stages.map((stage) => (
                <option key={stage.id} value={stage.id}>
                  {stage.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              style={{ display: "block", marginBottom: 8, color: palette.text }}
            >
              Category
            </label>
            <select
              value={context.category}
              onChange={(e) => handleContextChange("category", e.target.value)}
              style={{
                width: "100%",
                padding: 14,
                borderRadius: 12,
                background: palette.card,
                color: palette.text,
                border: `2px solid ${palette.border}`,
              }}
            >
              <option value="">Select Category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 12,
            marginBottom: 20,
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={() => {
              setActiveTab("templates");
              setPageState("list");
            }}
            style={{
              ...(activeTab === "templates"
                ? palette.primaryBtn
                : palette.secondaryBtn),
              borderRadius: 12,
              padding: "12px 18px",
              cursor: "pointer",
            }}
          >
            Templates
          </button>

          <button
            onClick={() => {
              setActiveTab("manual");
              setPageState("list");
            }}
            style={{
              ...(activeTab === "manual"
                ? palette.primaryBtn
                : palette.secondaryBtn),
              borderRadius: 12,
              padding: "12px 18px",
              cursor: "pointer",
            }}
          >
            Manual Templates
          </button>

          <button
            onClick={() => {
              setActiveTab("legacy");
              setPageState("list");
            }}
            style={{
              ...(activeTab === "legacy"
                ? palette.primaryBtn
                : palette.secondaryBtn),
              borderRadius: 12,
              padding: "12px 18px",
              cursor: "pointer",
            }}
          >
            Legacy Checklists
          </button>
        </div>

        {activeTab === "templates" ? (
          <>
            <TemplateChecklistList
              palette={palette}
              templates={templates}
              loading={templatesLoading}
              onCreate={() => {
                setSelectedTemplate(null);
                setPageState("form");
              }}
              onEdit={(template) => {
                setSelectedTemplate(template);
                setPageState("form");
              }}
              onView={(template) => {
                setSelectedTemplate(template);
                setPageState("detail");
              }}
              onInitialize={(template) => {
                setInitializeTemplate(template);
                setInitializeOpen(true);
              }}
              onDelete={handleDeleteTemplate}
            />

            <TemplateInitializeModal
              palette={palette}
              template={initializeTemplate}
              isOpen={initializeOpen}
              onClose={() => {
                setInitializeOpen(false);
                setInitializeTemplate(null);
              }}
              onInitialized={() => {}}
            />
          </>
        ) : activeTab === "manual" ? (
          <ManualChecklistList
            palette={palette}
            templates={manualTemplates}
            loading={manualTemplatesLoading}
            onCreate={() => {
              setSelectedManualTemplate(null);
              setPageState("form");
            }}
            onEdit={(template) => {
              setSelectedManualTemplate(template);
              setPageState("form");
            }}
            onView={(template) => {
              setSelectedManualTemplate(template);
              setPageState("detail");
            }}
            onDelete={handleDeleteManualTemplate}
          />
        ) : (
          <LegacyChecklistWrapper
            palette={palette}
            context={context}
            selectedChecklist={selectedLegacyChecklist}
            setSelectedChecklist={setSelectedLegacyChecklist}
            showForm={showLegacyForm}
            setShowForm={setShowLegacyForm}
            detailForm={showLegacyDetail}
            setDetailForm={setShowLegacyDetail}
            projects={projects}
            onChecklistCreated={() => {}}
          />
        )}
      </div>
    </div>
  );
};

export default ChecklistManager;
