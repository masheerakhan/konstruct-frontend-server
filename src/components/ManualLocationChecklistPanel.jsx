import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getManualChecklistTemplates,
  getManualChecklistTemplateById,
  getManualTemplateList,
  createManualChecklist,
  getManualChecklistList,
} from "../api/manualChecklistApi";

import {
  getAssignedProjects,
  getPurposeByProjectId,
  getUsersWithRoles,
  getProjectPhases,
  getProjectStages,
  fetchTowerListByProject,
  getLevelsByTowerId,
} from "../api/index";

import ManualLocationChecklistView from "./ManualChecklistLocationDetail";
import ManualChecklistLocationExecutionView from "./ManualChecklistLocationExecutionView";

export default function ManualLocationChecklistPanel() {
  const [activeView, setActiveView] = useState("assigned");

  const navigate = useNavigate();

  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [templateDetails, setTemplateDetails] = useState(null);

  const [location, setLocation] = useState("");

  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState("");
 const[selectedProjectName, setSelectedProjectName] = useState("");
  const [answers, setAnswers] = useState({});

  const [purposes, setPurposes] = useState([]);
  const [selectedPurpose, setSelectedPurpose] = useState("");

  const [users, setUsers] = useState([]);
  const [selectedUsersNames, setSelectedUsersNames] = useState([]);

  const [selectedAssignments, setSelectedAssignments] = useState([]);

  const [createdChecklists, setCreatedChecklists] = useState([]);

  const [selectedChecklistId, setSelectedChecklistId] = useState(null);

  const [executionRole, setExecutionRole] = useState("");

  const [selectedCreatorRole, setSelectedCreatorRole] = useState("");

  // =====================================================
  // LOCATION HIERARCHY
  // =====================================================

  const [phases, setPhases] = useState([]);
  const [selectedPhaseName, setSelectedPhaseName] = useState("");
  const [stages, setStages] = useState([]);
  const [selectedStageName, setSelectedStageName] = useState("");
  const [towers, setTowers] = useState([]);
  const [selectedTowerName, setSelectedTowerName] = useState("");
  const [floors, setFloors] = useState([]);
  const [selectedFloorName, setSelectedFloorName] = useState("");

  const [selectedPhase, setSelectedPhase] = useState("");
  const [selectedStage, setSelectedStage] = useState("");
  const [selectedTower, setSelectedTower] = useState("");
  const [selectedFloor, setSelectedFloor] = useState("");

  // =====================================================
  // USER ACCESS
  // =====================================================

  const userData = JSON.parse(localStorage.getItem("USER_DATA"));

  const projectAccesses = (userData?.accesses || []).filter(
    (access) => Number(access.project_id) === Number(selectedProject),
  );

  const availableProjectRoles = [
    ...new Set(projectAccesses.flatMap((access) => access.roles || [])),
  ];

  // =====================================================
  // INITIAL FETCH
  // =====================================================

  useEffect(() => {
    fetchAssignedProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchTemplates(selectedProject);
    } else {
      setTemplates([]);
    }
  }, [selectedProject]);

  // =====================================================
  // FETCH FUNCTIONS
  // =====================================================

  const fetchTemplates = async (projectId) => {
    try {
      if (!projectId) {
        setTemplates([]);
        return;
      }

      // const res = await getManualChecklistTemplates({
      //   project_id: Number(projectId),
      // });
      const res = await getManualTemplateList(Number(projectId));
      setTemplates(res.data?.results || res.data || []);
    } catch (err) {
      console.error(err);

      setTemplates([]);
    }
  };

  const fetchAssignedProjects = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem("USER_DATA"));

      const userId = userData?.id;

      const res = await getAssignedProjects(userId);

      setProjects(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUsers = async (projectId) => {
    try {
      const res = await getUsersWithRoles(projectId);

      setUsers(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPhases = async (projectId) => {
    try {
      const res = await getProjectPhases(projectId);

      setPhases(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStages = async (phaseId) => {
    try {
      const res = await getProjectStages(phaseId);

      setStages(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTowers = async (projectId) => {
    try {
      const res = await fetchTowerListByProject(projectId);

      setTowers(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchFloors = async (towerId) => {
    try {
      const res = await getLevelsByTowerId(towerId);

      setFloors(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCreatedChecklists = async () => {
    try {
      const res = await getManualChecklistList();

      setCreatedChecklists(res.data?.results || res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCreatedChecklists();
  }, []);

  // =====================================================
  // TEMPLATE DETAILS
  // =====================================================

  const handleTemplateChange = async (templateId) => {
    setSelectedTemplate(templateId);

    try {
      const res = await getManualChecklistTemplateById(templateId);

      setTemplateDetails(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // =====================================================
  // ANSWERS
  // =====================================================

  const handleAnswerChange = (key, value) => {
    setAnswers((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // =====================================================
  // CREATE CHECKLIST
  // =====================================================

const handleCreateChecklist = async () => {
  try {
    if (!selectedTemplate) {
      alert("Please select checklist template");
      return;
    }

    if (!selectedProject) {
      alert("Please select project");
      return;
    }

    if (!selectedCreatorRole) {
      alert("Please select your role");
      return;
    }

    if (!selectedPhase) {
      alert("Please select phase");
      return;
    }

    if (!selectedStage) {
      alert("Please select stage");
      return;
    }

    if (!selectedTower) {
      alert("Please select tower");
      return;
    }

    if (!location) {
      alert("Please enter location");
      return;
    }

    if (selectedAssignments.length === 0) {
      alert("Please assign at least one user");
      return;
    }

    // =====================================================
    // DOWNLOAD REPORT FOR CHECKER/MAKER
    // =====================================================

    const handleDownloadReport = (checklistId, role) => {
      window.open(
        `https://konstruct.world/checklists/manual-checklists/${checklistId}/report/?role=${role}`,
        "_blank",
      );
    };

    // =====================================================
    // FIND SELECTED OBJECTS
    // =====================================================

    const selectedProjectData = projects.find(
      (item) => String(item.id) === String(selectedProject),
    );

    const selectedPhaseData = phases.find(
      (item) => String(item.phase_id) === String(selectedPhase),
    );

    const selectedStageData = stages.find(
      (item) => String(item.stage_id) === String(selectedStage),
    );

    const selectedTowerData = towers.find(
      (item) => String(item.building_id) === String(selectedTower),
    );

    const selectedFloorData = floors.find(
      (item) => String(item.id) === String(selectedFloor),
    );

    // =====================================================
    // FORM DATA
    // =====================================================

    const formData = new FormData();

    formData.append("template", selectedTemplate);

    // =====================================================
    // PROJECT
    // =====================================================

    formData.append("project_id", selectedProject);

    if (selectedProjectData?.name) {
      formData.append("project_name", selectedProjectData.name);
    }

    // =====================================================
    // PHASE
    // =====================================================

    if (selectedPhase) {
      formData.append("phase_id", selectedPhase);
    }

    if (selectedPhaseData?.phase_name) {
      formData.append("phase_name", selectedPhaseData.phase_name);
    }

    // =====================================================
    // STAGE
    // =====================================================

    if (selectedStage) {
      formData.append("stage_id", selectedStage);
    }

    if (selectedStageData?.stage_name) {
      formData.append("stage_name", selectedStageData.stage_name);
    }

    // =====================================================
    // TOWER
    // =====================================================

    if (selectedTower) {
      formData.append("tower_id", selectedTower);
    }

    if (selectedTowerData?.building_name) {
      formData.append("tower_name", selectedTowerData.building_name);
    }

    // =====================================================
    // FLOOR
    // =====================================================

    if (selectedFloor) {
      formData.append("floor_id", selectedFloor);
    }

    if (selectedFloorData?.name) {
      formData.append("floor_name", selectedFloorData.name);
    }

    // =====================================================
    // OTHER DATA
    // =====================================================

    formData.append("location_text", location);

    formData.append("role", selectedCreatorRole);

    formData.append(
      "created_by_name",
      `${userData?.first_name || ""} ${userData?.last_name || ""} || ${userData?.username || ""}`,
    );

    // =====================================================
    // ANSWERS + ASSIGNMENTS
    // =====================================================

    const formattedAnswers = [];

    templateDetails?.sections?.forEach((section) => {
      section.questions?.forEach((question) => {
        formattedAnswers.push({
          question: question.id,

          assigned_to: selectedAssignments.map((assignment) => ({
            user_id: assignment.user_id,

            name: `${assignment.first_name} ${assignment.last_name}`,

            role: assignment.role,
          })),
        });
      });
    });

    formData.append("answers", JSON.stringify(formattedAnswers));

    // =====================================================
    // API CALL
    // =====================================================

    const res = await createManualChecklist(formData);

    console.log("CHECKLIST CREATE RESPONSE", res.data);

    alert("Checklist created successfully");

    fetchCreatedChecklists();

    // =====================================================
    // RESET FORM
    // =====================================================

    setSelectedTemplate("");

    setTemplateDetails(null);

    setSelectedAssignments([]);

    setLocation("");
  } catch (err) {
    console.error(err);

    console.log(err?.response?.data);

    alert("Failed to create checklist");
  }
};

  // =====================================================
  // UNIQUE USERS + ROLES
  // =====================================================

  const uniqueUserRoles = Array.from(
    new Map(
      users.flatMap((user) =>
        user.roles.map((role) => [
          `${user.user_id}-${role}`,
          {
            ...user,
            role,
          },
        ]),
      ),
    ).values(),
  );

  return (
    <div className="min-h-screen bg-[#f8f4ee] p-4 md:p-6">
      <div className="flex flex-wrap gap-4">
        <button
          onClick={() => setActiveView("create")}
          className={`rounded-xl px-5 py-3 text-sm font-medium transition ${
            activeView === "create"
              ? "bg-[#4b3b2a] text-white"
              : "border border-[#d8c2a5] bg-[#f3e2c9] text-[#6b533d]"
          }`}
        >
          Create Checklist
        </button>

        <button
          onClick={() => setActiveView("assigned")}
          className={`rounded-xl px-5 py-3 text-sm font-medium transition ${
            activeView === "assigned"
              ? "bg-[#4b3b2a] text-white"
              : "border border-[#d8c2a5] bg-[#f3e2c9] text-[#6b533d]"
          }`}
        >
          My Assigned Checklists
        </button>
      </div>

      {activeView === "create" && (
        <div className="mx-auto mt-5 max-w-6xl space-y-5">
          {/* HEADER */}

          <div className="rounded-3xl border border-[#eadcc8] bg-[#f7efe3] p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-[#4b3b2a]">
                  Create Manual Location Checklist
                </h1>

                <p className="mt-2 text-sm text-[#8b7765]">
                  Fill checklist and create workflow.
                </p>
              </div>
            </div>
          </div>

          {/* CONFIGURATION */}

          <div className="rounded-3xl border border-[#eadcc8] bg-[#f7efe3] p-6">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {/* PROJECT */}

              <div>
                <label className="mb-2 block text-sm font-medium text-[#6b533d]">
                  Project
                </label>

                <select
                  value={selectedProject}
                  onChange={(e) => {
                    const projectId = e.target.value;

                    setSelectedProject(projectId);

                    fetchTemplates(projectId);

                    fetchUsers(projectId);

                    fetchPhases(projectId);

                    setSelectedAssignments([]);

                    setSelectedTemplate("");
                    setTemplates([]);
                    setTemplateDetails(null);

                    setSelectedPhase("");

                    setSelectedStage("");

                    setSelectedTower("");

                    setSelectedFloor("");

                    setStages([]);

                    setTowers([]);

                    setFloors([]);
                  }}
                  className="w-full rounded-xl border border-[#e1d1bd] bg-[#fffaf4] px-4 py-3 text-sm outline-none"
                >
                  <option value="">Select project</option>

                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* PHASE */}

              <div>
                <label className="mb-2 block text-sm font-medium text-[#6b533d]">
                  Phase
                </label>

                <select
                  value={selectedPhase}
                  onChange={(e) => {
                    const value = e.target.value;

                    setSelectedPhase(value);

                    setSelectedStage("");

                    setSelectedTower("");

                    setSelectedFloor("");

                    setTowers([]);

                    setFloors([]);

                    fetchStages(value);
                  }}
                  className="w-full rounded-xl border border-[#e1d1bd] bg-[#fffaf4] px-4 py-3 text-sm outline-none"
                >
                  <option value="">Select Phase</option>

                  {phases.map((phase) => (
                    <option key={phase.phase_id} value={phase.phase_id}>
                      {phase.phase_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* STAGE */}

              <div>
                <label className="mb-2 block text-sm font-medium text-[#6b533d]">
                  Stage
                </label>

                <select
                  value={selectedStage}
                  onChange={(e) => {
                    const value = e.target.value;

                    setSelectedStage(value);

                    setSelectedTower("");

                    setSelectedFloor("");

                    setFloors([]);

                    fetchTowers(selectedProject);
                  }}
                  className="w-full rounded-xl border border-[#e1d1bd] bg-[#fffaf4] px-4 py-3 text-sm outline-none"
                >
                  <option value="">Select Stage</option>

                  {stages.map((stage) => (
                    <option key={stage.stage_id} value={stage.stage_id}>
                      {stage.stage_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* TOWER */}

              <div>
                <label className="mb-2 block text-sm font-medium text-[#6b533d]">
                  Tower
                </label>

                <select
                  value={selectedTower}
                  onChange={(e) => {
                    const value = e.target.value;

                    setSelectedTower(value);

                    setSelectedFloor("");

                    fetchFloors(value);
                  }}
                  className="w-full rounded-xl border border-[#e1d1bd] bg-[#fffaf4] px-4 py-3 text-sm outline-none"
                >
                  <option value="">Select Tower</option>

                  {towers.map((tower) => (
                    <option key={tower.building_id} value={tower.building_id}>
                      {tower.building_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* FLOOR */}

              <div>
                <label className="mb-2 block text-sm font-medium text-[#6b533d]">
                  Floor
                </label>

                <select
                  value={selectedFloor}
                  onChange={(e) => setSelectedFloor(e.target.value)}
                  className="w-full rounded-xl border border-[#e1d1bd] bg-[#fffaf4] px-4 py-3 text-sm outline-none"
                >
                  <option value="">Select Floor</option>

                  {floors.map((floor) => (
                    <option key={floor.id} value={floor.id}>
                      {floor.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* ROLE */}

              <div>
                <label className="mb-2 block text-sm font-medium text-[#6b533d]">
                  Your Role
                </label>

                <select
                  value={selectedCreatorRole}
                  onChange={(e) => setSelectedCreatorRole(e.target.value)}
                  className="w-full rounded-xl border border-[#e1d1bd] bg-[#fffaf4] px-4 py-3 text-sm outline-none"
                >
                  <option value="">Select role</option>

                  {availableProjectRoles.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>

              {/* TEMPLATE */}

              <div>
                <label className="mb-2 block text-sm font-medium text-[#6b533d]">
                  Manual Checklist Template
                </label>

                <select
                  value={selectedTemplate}
                  onChange={(e) => handleTemplateChange(e.target.value)}
                  className="w-full rounded-xl border border-[#e1d1bd] bg-[#fffaf4] px-4 py-3 text-sm outline-none"
                >
                  <option value="">Select checklist template</option>

                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* LOCATION */}

              <div>
                <label className="mb-2 block text-sm font-medium text-[#6b533d]">
                  Location
                </label>

                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Enter location"
                  className="w-full rounded-xl border border-[#e1d1bd] bg-[#fffaf4] px-4 py-3 text-sm outline-none"
                />
              </div>

              {/* MULTIPLE USER ASSIGN */}

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-[#6b533d]">
                  Assign Users
                </label>

                <select
                  multiple
                  value={selectedAssignments.map(
                    (item) => `${item.user_id}-${item.role}`,
                  )}
                  onChange={(e) => {
                    const values = Array.from(
                      e.target.selectedOptions,
                      (option) => option.value,
                    );

                    const selectedUsers = uniqueUserRoles.filter((user) =>
                      values.includes(`${user.user_id}-${user.role}`),
                    );

                    setSelectedAssignments(selectedUsers);
                  }}
                  className="min-h-[160px] w-full rounded-xl border border-[#e1d1bd] bg-[#fffaf4] px-4 py-3 text-sm outline-none"
                >
                  {uniqueUserRoles.map((user) => (
                    <option
                      key={`${user.user_id}-${user.role}`}
                      value={`${user.user_id}-${user.role}`}
                    >
                      {user.first_name} {user.last_name} ({user.role})
                    </option>
                  ))}
                </select>
              </div>

              {/* CREATE BUTTON */}

              <button
                onClick={handleCreateChecklist}
                className="rounded-xl border border-[#d8c2a5] bg-[#f3e2c9] px-5 py-3 text-sm font-medium text-[#6b533d] transition hover:bg-[#ecd5b4]"
              >
                Create
              </button>
            </div>
          </div>

          {/* QUESTIONS */}

          {templateDetails?.sections?.length > 0 && (
            <div className="space-y-5">
              {templateDetails.sections.map((section, sectionIndex) => (
                <div
                  key={section.id}
                  className="rounded-3xl border border-[#eadcc8] bg-[#f7efe3] p-5"
                >
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-[#4b3b2a]">
                        {section.title}
                      </h2>

                      <p className="mt-1 text-xs text-[#8b7765]">
                        Items: {section.questions?.length || 0}
                      </p>
                    </div>

                    <button className="rounded-lg border border-[#d8c2a5] bg-[#f3e2c9] px-4 py-2 text-xs font-medium text-[#6b533d]">
                      Collapse
                    </button>
                  </div>

                  <div className="space-y-4">
                    {section.questions?.map((question) => (
                      <div
                        key={question.id}
                        className="rounded-2xl border border-[#eadcc8] bg-[#fffaf4] p-5"
                      >
                        <div>
                          <h3 className="text-sm font-semibold text-[#4b3b2a]">
                            {question.title}
                          </h3>
                        </div>

                        {question.options?.length > 0 && (
                          <div className="mt-4 flex flex-wrap gap-3">
                            {question.options.map((option) => (
                              <div
                                key={option.id}
                                className="rounded-xl border border-[#e1d1bd] bg-[#f8f4ee] px-4 py-2 text-sm text-[#6b533d]"
                              >
                                {option.name}
                              </div>
                            ))}
                          </div>
                        )}

                        {question.options?.length === 0 && (
                          <div className="mt-4 rounded-xl border border-dashed border-[#d8c2a5] bg-[#faf6f0] px-4 py-3 text-sm text-[#8b7765]">
                            Text answer field
                          </div>
                        )}

                        {question.photo_required && (
                          <div className="mt-4 inline-flex rounded-lg bg-[#fff3cd] px-3 py-2 text-xs font-medium text-[#856404]">
                            Photo Required
                          </div>
                        )}

                        <div className="mt-4 rounded-xl border border-dashed border-[#d8c2a5] bg-[#faf6f0] px-4 py-3 text-sm text-[#8b7765]">
                          Remarks field
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeView === "assigned" && (
        <ManualLocationChecklistView
          onOpenChecklist={(data) => {
            setSelectedChecklistId(data.checklistId);

            setExecutionRole(data.role);

            setActiveView("execution");
          }}
        />
      )}

      {activeView === "execution" && (
        <ManualChecklistLocationExecutionView
          checklistId={selectedChecklistId}
          role={executionRole}
          onBack={() => {
            setSelectedChecklistId(null);

            setActiveView("assigned");
          }}
        />
      )}
    </div>
  );
}
