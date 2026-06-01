import React, { useEffect, useMemo, useState } from "react";
import {
  createChecklistTemplate,
  getChecklistTemplateById,
  getRoomsByProject,
  updateChecklistTemplateById,
} from "../../../api/checklistTemplateApi";
import {
  buildTemplatePayload,
  createEmptyOption,
  createEmptyQuestion,
  createEmptySection,
  mapTemplateResponseToForm,
  normalizeId,
  validateTemplatePayload,
} from "./checklistFlowUtils";
import {
  fetchNestedProjectData,
  getPurposeByProjectId,
  getPhaseByPurposeId,
  GetstagebyPhaseid,
  getCategoryTreeByProject,
} from "../../../api";
import { showToast } from "../../../utils/toast";
import * as XLSX from "xlsx";

const getPurposeValue = (item) => String(item?.id || "");

const getPurposeLabel = (item) => {
  if (typeof item?.name?.purpose?.name === "string") {
    return item.name.purpose.name;
  }
  if (typeof item?.name === "string") {
    return item.name;
  }
  return "Unnamed Purpose";
};

const getCategoryLabel = (item) =>
  item?.name ||
  item?.category_name ||
  item?.title ||
  `Category ${item?.id ?? ""}`;

const getRoomLabel = (room) =>
  room?.rooms || room?.name || room?.room_name || `Room ${room?.id ?? ""}`;

const getNodeName = (node, fallback = "Unnamed") =>
  node?.name ||
  node?.tower_name ||
  node?.building_name ||
  node?.floor_name ||
  node?.unit_name ||
  node?.label ||
  node?.number ||
  fallback;

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

const RoomSelectionModal = ({
  isOpen,
  onClose,
  palette,
  roomTypes,
  selectedRooms,
  onToggleRoom,
  onSelectAll,
  onClearAll,
}) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 20,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 760,
          maxHeight: "85vh",
          overflowY: "auto",
          background: palette.card,
          border: `2px solid ${palette.border}`,
          borderRadius: 16,
          padding: 24,
          boxShadow: palette.shadow,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            marginBottom: 18,
            flexWrap: "wrap",
          }}
        >
          <h3
            style={{
              margin: 0,
              color: palette.text,
              fontSize: 22,
              fontWeight: 800,
            }}
          >
            Select Room Types
          </h3>

          <button
            type="button"
            onClick={onClose}
            style={{
              ...palette.secondaryBtn,
              borderRadius: 10,
              padding: "8px 14px",
              cursor: "pointer",
            }}
          >
            Close
          </button>
        </div>

        <div
          style={{
            display: "flex",
            gap: 12,
            marginBottom: 18,
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            onClick={onSelectAll}
            style={{
              ...palette.primaryBtn,
              borderRadius: 10,
              padding: "8px 14px",
              cursor: "pointer",
            }}
          >
            Select All
          </button>

          <button
            type="button"
            onClick={onClearAll}
            style={{
              ...palette.secondaryBtn,
              borderRadius: 10,
              padding: "8px 14px",
              cursor: "pointer",
            }}
          >
            Clear All
          </button>
        </div>

        <div style={{ display: "grid", gap: 12 }}>
          {roomTypes.length === 0 ? (
            <div
              style={{
                color: palette.textSecondary,
                border: `1px solid ${palette.border}`,
                borderRadius: 12,
                padding: 16,
              }}
            >
              No room types available for the selected project.
            </div>
          ) : (
            roomTypes.map((room) => {
              const checked = selectedRooms.includes(String(room.id));

              return (
                <label
                  key={room.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: 12,
                    borderRadius: 12,
                    border: `1px solid ${palette.border}`,
                    color: palette.text,
                    background: palette.tableRowBg,
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) =>
                      onToggleRoom(String(room.id), e.target.checked)
                    }
                  />
                  <span>{getRoomLabel(room)}</span>
                </label>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

const MultiSelectModal = ({
  isOpen,
  onClose,
  palette,
  title,
  options,
  selectedValues,
  onToggle,
  onSelectAll,
  onClearAll,
  getLabel,
}) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 20,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 760,
          maxHeight: "85vh",
          overflowY: "auto",
          background: palette.card,
          border: `2px solid ${palette.border}`,
          borderRadius: 16,
          padding: 24,
          boxShadow: palette.shadow,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            marginBottom: 18,
            flexWrap: "wrap",
          }}
        >
          <h3
            style={{
              margin: 0,
              color: palette.text,
              fontSize: 22,
              fontWeight: 800,
            }}
          >
            {title}
          </h3>

          <button
            type="button"
            onClick={onClose}
            style={{
              ...palette.secondaryBtn,
              borderRadius: 10,
              padding: "8px 14px",
              cursor: "pointer",
            }}
          >
            Close
          </button>
        </div>

        <div
          style={{
            display: "flex",
            gap: 12,
            marginBottom: 18,
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            onClick={onSelectAll}
            style={{
              ...palette.primaryBtn,
              borderRadius: 10,
              padding: "8px 14px",
              cursor: "pointer",
            }}
          >
            Select All
          </button>

          <button
            type="button"
            onClick={onClearAll}
            style={{
              ...palette.secondaryBtn,
              borderRadius: 10,
              padding: "8px 14px",
              cursor: "pointer",
            }}
          >
            Clear All
          </button>
        </div>

        <div style={{ display: "grid", gap: 12 }}>
          {options.length === 0 ? (
            <div
              style={{
                color: palette.textSecondary,
                border: `1px solid ${palette.border}`,
                borderRadius: 12,
                padding: 16,
              }}
            >
              No options available.
            </div>
          ) : (
            options.map((item) => {
              const checked = selectedValues.includes(String(item.id));

              return (
                <label
                  key={item.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: 12,
                    borderRadius: 12,
                    border: `1px solid ${palette.border}`,
                    color: palette.text,
                    background: palette.tableRowBg,
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) =>
                      onToggle(String(item.id), e.target.checked)
                    }
                  />
                  <span>{getLabel(item)}</span>
                </label>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

const SelectedPills = ({
  palette,
  items,
  getLabel,
  onRemove,
  emptyText = "Nothing selected.",
}) => {
  if (!items?.length) {
    return <div style={{ color: palette.textSecondary }}>{emptyText}</div>;
  }

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
      {items.map((item) => (
        <div
          key={item.id}
          style={{
            border: `1px solid ${palette.border}`,
            borderRadius: 999,
            padding: "8px 14px",
            color: palette.text,
            background: palette.tableRowBg,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span>{getLabel(item)}</span>
          <button
            type="button"
            onClick={() => onRemove(String(item.id))}
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
              color: palette.text,
              fontWeight: 700,
            }}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};

const TemplateChecklistForm = ({
  palette,
  template,
  context,
  projectOptions = [],
  onBack,
  onSaved,
}) => {
  const isEdit = !!template?.id;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [purposes, setPurposes] = useState([]);
  const [phases, setPhases] = useState([]);
  const [stages, setStages] = useState([]);
  const [categories, setCategories] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);

  const [projectNested, setProjectNested] = useState(null);
  const [buildings, setBuildings] = useState([]);
  const [floors, setFloors] = useState([]);
  const [units, setUnits] = useState([]);

  const [selectedBuildingIds, setSelectedBuildingIds] = useState([]);
  const [selectedFloorIds, setSelectedFloorIds] = useState([]);
  const [selectedUnitIds, setSelectedUnitIds] = useState([]);

  const [showRoomsModal, setShowRoomsModal] = useState(false);
  const [showTowerModal, setShowTowerModal] = useState(false);
  const [showFloorModal, setShowFloorModal] = useState(false);
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [selectedRooms, setSelectedRooms] = useState([]);
  const [originalTemplate, setOriginalTemplate] = useState(null);

const [formData, setFormData] = useState({
  name: "",
  project_id: context?.project_id || "",
  purpose_id: context?.purpose_id || "",
  phase_id: context?.phase_id || "",
  stage_id: context?.stage_id || "",
  category: context?.category || "",
  category_level1: "",
  category_level2: "",
  category_level3: "",
  category_level4: "",
  category_level5: "",
  category_level6: "",
  applicable_scope: "",
  question_target_type: "",
  room_types: [],
  sections: [createEmptySection(1)],
});

  const inputStyle = {
    width: "100%",
    padding: "14px",
    borderRadius: 12,
    background: palette.card,
    color: palette.text,
    border: `2px solid ${palette.border}`,
    fontWeight: 500,
  };

  const normalizeBoolean = (value) => {
    return (
      value === true ||
      value === "true" ||
      value === "True" ||
      value === "TRUE" ||
      value === 1 ||
      value === "1" ||
      value === "yes" ||
      value === "Yes" ||
      value === "YES"
    );
  };

  const normalizeStringIds = (values) => {
    if (!Array.isArray(values)) return [];
    return values
      .map((value) => String(value))
      .filter(
        (value) => value !== "" && value !== "null" && value !== "undefined",
      );
  };

  const mapRoomIdsForSelection = (rooms = []) => {
    if (!Array.isArray(rooms)) return [];
    return rooms
      .map((room) => {
        if (typeof room === "object" && room !== null) {
          return String(room.room_type_id ?? room.room_id ?? room.id ?? "");
        }
        return String(room);
      })
      .filter((value) => value && value !== "null" && value !== "undefined");
  };

  const parseOptionsString = (optionsString = "") => {
    if (!optionsString || typeof optionsString !== "string") return [];

    return optionsString
      .split("|")
      .map((pair) => pair.trim())
      .filter(Boolean)
      .map((pair) => {
        const match = pair.match(/^(.+)\(([PN])\)$/i);
        if (!match) return null;

        return {
          name: match[1].trim(),
          choice: match[2].toUpperCase(),
        };
      })
      .filter(Boolean);
  };

  const buildSectionsFromBulkRows = (rows = []) => {
    const grouped = new Map();
    let runningQuestionSequence = 1;

    rows.forEach((row, rowIndex) => {
      const sectionTitleRaw =
        row["Section"] ||
        row["section"] ||
        row["Section Title"] ||
        row["section_title"] ||
        "";

      const sectionDescription =
        row["Section Description"] || row["section_description"] || "";

      const questionTitle =
        row["Question"] ||
        row["question"] ||
        row["Question Title"] ||
        row["question_title"] ||
        "";

      const questionDescription =
        row["Question Description"] || row["question_description"] || "";

      const optionsString = row["Options"] || row["options"] || "";
      const photoRequired =
        row["PhotoRequired"] ||
        row["photo_required"] ||
        row["Photo Required"] ||
        false;

      const sectionTitle = String(sectionTitleRaw || "").trim() || "General";

      if (!String(questionTitle || "").trim()) return;

      if (!grouped.has(sectionTitle)) {
        grouped.set(sectionTitle, {
          id: `bulk-section-${grouped.size + 1}-${Date.now()}`,
          title: sectionTitle,
          description: String(sectionDescription || "").trim(),
          sequence: grouped.size + 1,
          questions: [],
        });
      }

      const section = grouped.get(sectionTitle);

      section.questions.push({
        id: undefined,
        title: String(questionTitle).trim(),
        description: String(questionDescription || "").trim(),
        sequence: section.questions.length + 1 || runningQuestionSequence,
        photo_required: normalizeBoolean(photoRequired),
        options:
          parseOptionsString(optionsString).length > 0
            ? parseOptionsString(optionsString)
            : [createEmptyOption()],
      });

      runningQuestionSequence += 1;
    });

    return Array.from(grouped.values()).map((section, sectionIndex) => ({
      ...section,
      sequence: sectionIndex + 1,
      questions: section.questions.map((question, questionIndex) => ({
        ...question,
        sequence: questionIndex + 1,
        options:
          question.options?.length > 0
            ? question.options
            : [createEmptyOption()],
      })),
    }));
  };

  const handleTemplateBulkUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (!Array.isArray(jsonData) || jsonData.length === 0) {
          showToast("No valid rows found in the uploaded file.", "error");
          event.target.value = "";
          return;
        }

        const parsedSections = buildSectionsFromBulkRows(jsonData);

        if (!parsedSections.length) {
          showToast("No valid questions found in the file.", "error");
          event.target.value = "";
          return;
        }

        setFormData((prev) => ({
          ...prev,
          sections: parsedSections,
        }));

        const totalQuestions = parsedSections.reduce(
          (sum, section) => sum + (section.questions?.length || 0),
          0,
        );

        showToast(
          `${totalQuestions} questions imported successfully across ${parsedSections.length} section(s).`,
          "success",
        );

        event.target.value = "";
      } catch (error) {
        showToast(
          "Error reading file. Please check the Excel/CSV format.",
          "error",
        );
        event.target.value = "";
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const updateField = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const resetNestedSelections = () => {
    setSelectedBuildingIds([]);
    setSelectedFloorIds([]);
    setSelectedUnitIds([]);
    setFloors([]);
    setUnits([]);
  };

  const selectedRoomObjects = useMemo(
    () =>
      selectedRooms
        .map((roomId) =>
          roomTypes.find((room) => String(room.id) === String(roomId)),
        )
        .filter(Boolean),
    [selectedRooms, roomTypes],
  );

  const selectedBuildingObjects = useMemo(
    () =>
      selectedBuildingIds
        .map((buildingId) =>
          buildings.find(
            (building) => String(building.id) === String(buildingId),
          ),
        )
        .filter(Boolean),
    [selectedBuildingIds, buildings],
  );

  const selectedFloorObjects = useMemo(
    () =>
      selectedFloorIds
        .map((floorId) =>
          floors.find((floor) => String(floor.id) === String(floorId)),
        )
        .filter(Boolean),
    [selectedFloorIds, floors],
  );

  const selectedUnitObjects = useMemo(
    () =>
      selectedUnitIds
        .map((unitId) =>
          units.find((unit) => String(unit.id) === String(unitId)),
        )
        .filter(Boolean),
    [selectedUnitIds, units],
  );

  useEffect(() => {
    updateField("room_types", mapRoomIdsForSelection(selectedRooms));
  }, [selectedRooms]);

  const fetchProjectDependencies = async (projectId, preserve = {}) => {
    if (!projectId) {
      setPurposes([]);
      setPhases([]);
      setStages([]);
      setCategories([]);
      setRoomTypes([]);
      setProjectNested(null);
      setBuildings([]);
      resetNestedSelections();
      setSelectedRooms([]);
      return;
    }

    try {
      const [purposeRes, categoryRes, roomRes, nestedRes] = await Promise.all([
        getPurposeByProjectId(projectId),
        getCategoryTreeByProject(projectId),
        getRoomsByProject(projectId),
        fetchNestedProjectData(projectId),
      ]);

      const purposeData = purposeRes?.data || [];
      const categoryData = categoryRes?.data || [];
      const roomData = roomRes?.data?.results || roomRes?.data || [];
      const nestedData = nestedRes || {};

      setPurposes(Array.isArray(purposeData) ? purposeData : []);
      setCategories(Array.isArray(categoryData) ? categoryData : []);
      setRoomTypes(Array.isArray(roomData) ? roomData : []);
      setProjectNested(nestedData);

      const buildingList = extractBuildings(nestedData);
      const normalizedBuildings = Array.isArray(buildingList)
        ? buildingList
        : [];
      setBuildings(normalizedBuildings);

      resetNestedSelections();

      if (preserve.purpose_id) {
        const phaseRes = await getPhaseByPurposeId(preserve.purpose_id);
        const phaseData = phaseRes?.data || [];
        setPhases(Array.isArray(phaseData) ? phaseData : []);
      } else {
        setPhases([]);
      }

      if (preserve.phase_id) {
        const stageRes = await GetstagebyPhaseid(preserve.phase_id);
        const stageData = stageRes?.data || [];
        setStages(Array.isArray(stageData) ? stageData : []);
      } else {
        setStages([]);
      }

      const normalizedRoomIds = mapRoomIdsForSelection(
        preserve.room_types || [],
      );
      setSelectedRooms(normalizedRoomIds);

      const preservedBuildingIds = normalizeStringIds(
        preserve.selected_building_ids ||
          (preserve.building_id ? [preserve.building_id] : []),
      );

      if (!preservedBuildingIds.length) {
        setSelectedBuildingIds([]);
        setFloors([]);
        setSelectedFloorIds([]);
        setUnits([]);
        setSelectedUnitIds([]);
        return;
      }

      const validBuildingIds = preservedBuildingIds.filter((buildingId) =>
        normalizedBuildings.some(
          (building) => String(building.id) === String(buildingId),
        ),
      );
      setSelectedBuildingIds(validBuildingIds);

      const derivedFloors = [];
      validBuildingIds.forEach((buildingId) => {
        const building = normalizedBuildings.find(
          (item) => String(item.id) === String(buildingId),
        );
        if (building) {
          derivedFloors.push(...extractFloors(building));
        }
      });

      const uniqueFloors = Array.from(
        new Map(derivedFloors.map((item) => [String(item.id), item])).values(),
      );
      setFloors(uniqueFloors);

      const preservedFloorIds = normalizeStringIds(
        preserve.selected_floor_ids ||
          (preserve.floor_id ? [preserve.floor_id] : []),
      );

      const validFloorIds = preservedFloorIds.filter((floorId) =>
        uniqueFloors.some((floor) => String(floor.id) === String(floorId)),
      );
      setSelectedFloorIds(validFloorIds);

      const derivedUnits = [];
      validFloorIds.forEach((floorId) => {
        const floor = uniqueFloors.find(
          (item) => String(item.id) === String(floorId),
        );
        if (floor) {
          derivedUnits.push(...extractUnits(floor));
        }
      });

      const uniqueUnits = Array.from(
        new Map(derivedUnits.map((item) => [String(item.id), item])).values(),
      );
      setUnits(uniqueUnits);

      const preservedUnitIds = normalizeStringIds(
        preserve.selected_unit_ids || [],
      );
      const validUnitIds = preservedUnitIds.filter((unitId) =>
        uniqueUnits.some((unit) => String(unit.id) === String(unitId)),
      );
      setSelectedUnitIds(validUnitIds);
    } catch (error) {
      setPurposes([]);
      setPhases([]);
      setStages([]);
      setCategories([]);
      setRoomTypes([]);
      setProjectNested(null);
      setBuildings([]);
      resetNestedSelections();
      setSelectedRooms([]);
    }
  };

  useEffect(() => {
    if (isEdit) return;
    if (context?.project_id) {
      fetchProjectDependencies(context.project_id, context);
    }
  }, [isEdit, context?.project_id]);

  useEffect(() => {
    if (!isEdit || !template?.id) return;

    const fetchTemplate = async () => {
      setLoading(true);
      try {
        const response = await getChecklistTemplateById(template.id);
        setOriginalTemplate(response.data); // ✅ ADD THIS
        const mapped = mapTemplateResponseToForm(response.data);

        setFormData((prev) => ({
          ...prev,
          ...mapped,
        }));

        setSelectedRooms(mapRoomIdsForSelection(mapped.room_types || []));
        await fetchProjectDependencies(mapped.project_id, mapped);
      } catch (error) {
        showToast("Failed to load checklist template details.", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchTemplate();
  }, [isEdit, template?.id]);

const handleProjectChange = async (projectId) => {
  setFormData((prev) => ({
    ...prev,
    project_id: projectId,
    purpose_id: "",
    phase_id: "",
    stage_id: "",
    category: "",
    room_types: [],
  }));

  setSelectedRooms([]);
  await fetchProjectDependencies(projectId);
};

  const handlePurposeChange = async (purposeId) => {
    setFormData((prev) => ({
      ...prev,
      purpose_id: purposeId,
      phase_id: "",
      stage_id: "",
    }));
    setStages([]);

    try {
      const response = await getPhaseByPurposeId(purposeId);
      const data = response?.data || [];
      setPhases(Array.isArray(data) ? data : []);
    } catch (error) {
      setPhases([]);
    }
  };

  const handlePhaseChange = async (phaseId) => {
    setFormData((prev) => ({
      ...prev,
      phase_id: phaseId,
      stage_id: "",
    }));

    try {
      const response = await GetstagebyPhaseid(phaseId);
      const data = response?.data || [];
      setStages(Array.isArray(data) ? data : []);
    } catch (error) {
      setStages([]);
    }
  };

  const handleCategoryChange = (categoryId) => {
    updateField("category", categoryId);
    resetNestedSelections();
  };

  const handleToggleRoom = (roomId, shouldSelect) => {
    const normalizedRoomId = String(roomId);

    if (shouldSelect) {
      setSelectedRooms((prev) =>
        prev.includes(normalizedRoomId) ? prev : [...prev, normalizedRoomId],
      );
      return;
    }

    setSelectedRooms((prev) => prev.filter((id) => id !== normalizedRoomId));
  };

  const handleSelectAllRooms = () => {
    setSelectedRooms(roomTypes.map((room) => String(room.id)));
  };

  const handleClearAllRooms = () => {
    setSelectedRooms([]);
  };

  const recomputeFloorsAndUnits = (
    buildingIds,
    floorIds = [],
    unitIds = [],
  ) => {
    const derivedFloors = [];

    buildingIds.forEach((buildingId) => {
      const building = buildings.find(
        (item) => String(item.id) === String(buildingId),
      );
      if (building) {
        derivedFloors.push(...extractFloors(building));
      }
    });

    const uniqueFloors = Array.from(
      new Map(derivedFloors.map((item) => [String(item.id), item])).values(),
    );
    setFloors(uniqueFloors);

    const validFloorIds = floorIds.filter((floorId) =>
      uniqueFloors.some((floor) => String(floor.id) === String(floorId)),
    );
    setSelectedFloorIds(validFloorIds);

    const derivedUnits = [];
    validFloorIds.forEach((floorId) => {
      const floor = uniqueFloors.find(
        (item) => String(item.id) === String(floorId),
      );
      if (floor) {
        derivedUnits.push(...extractUnits(floor));
      }
    });

    const uniqueUnits = Array.from(
      new Map(derivedUnits.map((item) => [String(item.id), item])).values(),
    );
    setUnits(uniqueUnits);

    const validUnitIds = unitIds.filter((unitId) =>
      uniqueUnits.some((unit) => String(unit.id) === String(unitId)),
    );
    setSelectedUnitIds(validUnitIds);
  };

  const handleToggleBuilding = (buildingId, shouldSelect) => {
    const normalizedId = String(buildingId);

    let nextSelectedBuildings = [];
    if (shouldSelect) {
      nextSelectedBuildings = selectedBuildingIds.includes(normalizedId)
        ? selectedBuildingIds
        : [...selectedBuildingIds, normalizedId];
    } else {
      nextSelectedBuildings = selectedBuildingIds.filter(
        (id) => id !== normalizedId,
      );
    }

    setSelectedBuildingIds(nextSelectedBuildings);
    recomputeFloorsAndUnits(
      nextSelectedBuildings,
      selectedFloorIds,
      selectedUnitIds,
    );
  };

  const handleSelectAllBuildings = () => {
    const allIds = buildings.map((item) => String(item.id));
    setSelectedBuildingIds(allIds);
    recomputeFloorsAndUnits(allIds, selectedFloorIds, selectedUnitIds);
  };

  const handleClearAllBuildings = () => {
    setSelectedBuildingIds([]);
    setSelectedFloorIds([]);
    setSelectedUnitIds([]);
    setFloors([]);
    setUnits([]);
  };

  const handleToggleFloor = (floorId, shouldSelect) => {
    const normalizedId = String(floorId);

    let nextSelectedFloors = [];
    if (shouldSelect) {
      nextSelectedFloors = selectedFloorIds.includes(normalizedId)
        ? selectedFloorIds
        : [...selectedFloorIds, normalizedId];
    } else {
      nextSelectedFloors = selectedFloorIds.filter((id) => id !== normalizedId);
    }

    setSelectedFloorIds(nextSelectedFloors);

    const derivedUnits = [];
    nextSelectedFloors.forEach((selectedFloorId) => {
      const floor = floors.find(
        (item) => String(item.id) === String(selectedFloorId),
      );
      if (floor) {
        derivedUnits.push(...extractUnits(floor));
      }
    });

    const uniqueUnits = Array.from(
      new Map(derivedUnits.map((item) => [String(item.id), item])).values(),
    );
    setUnits(uniqueUnits);

    const validUnitIds = selectedUnitIds.filter((unitId) =>
      uniqueUnits.some((unit) => String(unit.id) === String(unitId)),
    );
    setSelectedUnitIds(validUnitIds);
  };

  const handleSelectAllFloors = () => {
    const allIds = floors.map((item) => String(item.id));
    setSelectedFloorIds(allIds);

    const derivedUnits = [];
    floors.forEach((floor) => {
      derivedUnits.push(...extractUnits(floor));
    });

    const uniqueUnits = Array.from(
      new Map(derivedUnits.map((item) => [String(item.id), item])).values(),
    );
    setUnits(uniqueUnits);

    const validUnitIds = selectedUnitIds.filter((unitId) =>
      uniqueUnits.some((unit) => String(unit.id) === String(unitId)),
    );
    setSelectedUnitIds(validUnitIds);
  };

  const handleClearAllFloors = () => {
    setSelectedFloorIds([]);
    setSelectedUnitIds([]);
    setUnits([]);
  };

  const handleToggleUnit = (unitId, shouldSelect) => {
    const normalizedId = String(unitId);

    if (shouldSelect) {
      setSelectedUnitIds((prev) =>
        prev.includes(normalizedId) ? prev : [...prev, normalizedId],
      );
      return;
    }

    setSelectedUnitIds((prev) => prev.filter((id) => id !== normalizedId));
  };

  const handleSelectAllUnits = () => {
    setSelectedUnitIds(units.map((item) => String(item.id)));
  };

  const handleClearAllUnits = () => {
    setSelectedUnitIds([]);
  };

  const addSection = () => {
    setFormData((prev) => ({
      ...prev,
      sections: [
        ...prev.sections,
        createEmptySection(prev.sections.length + 1),
      ],
    }));
  };

  const removeSection = (sectionIndex) => {
    setFormData((prev) => ({
      ...prev,
      sections: prev.sections.filter((_, index) => index !== sectionIndex),
    }));
  };

  const updateSection = (sectionIndex, key, value) => {
    setFormData((prev) => ({
      ...prev,
      sections: prev.sections.map((section, index) =>
        index === sectionIndex ? { ...section, [key]: value } : section,
      ),
    }));
  };

  const addQuestion = (sectionIndex) => {
    setFormData((prev) => ({
      ...prev,
      sections: prev.sections.map((section, index) =>
        index === sectionIndex
          ? {
              ...section,
              questions: [
                ...section.questions,
                createEmptyQuestion(section.questions.length + 1),
              ],
            }
          : section,
      ),
    }));
  };

  const removeQuestion = (sectionIndex, questionIndex) => {
    setFormData((prev) => ({
      ...prev,
      sections: prev.sections.map((section, index) =>
        index === sectionIndex
          ? {
              ...section,
              questions: section.questions.filter(
                (_, qIndex) => qIndex !== questionIndex,
              ),
            }
          : section,
      ),
    }));
  };

  const updateQuestion = (sectionIndex, questionIndex, key, value) => {
    setFormData((prev) => ({
      ...prev,
      sections: prev.sections.map((section, index) =>
        index === sectionIndex
          ? {
              ...section,
              questions: section.questions.map((question, qIndex) =>
                qIndex === questionIndex
                  ? { ...question, [key]: value }
                  : question,
              ),
            }
          : section,
      ),
    }));
  };

  const addOption = (sectionIndex, questionIndex) => {
    setFormData((prev) => ({
      ...prev,
      sections: prev.sections.map((section, index) =>
        index === sectionIndex
          ? {
              ...section,
              questions: section.questions.map((question, qIndex) =>
                qIndex === questionIndex
                  ? {
                      ...question,
                      options: [...question.options, createEmptyOption()],
                    }
                  : question,
              ),
            }
          : section,
      ),
    }));
  };

  const removeOption = (sectionIndex, questionIndex, optionIndex) => {
    setFormData((prev) => ({
      ...prev,
      sections: prev.sections.map((section, index) =>
        index === sectionIndex
          ? {
              ...section,
              questions: section.questions.map((question, qIndex) =>
                qIndex === questionIndex
                  ? {
                      ...question,
                      options: question.options.filter(
                        (_, oIndex) => oIndex !== optionIndex,
                      ),
                    }
                  : question,
              ),
            }
          : section,
      ),
    }));
  };

  const updateOption = (
    sectionIndex,
    questionIndex,
    optionIndex,
    key,
    value,
  ) => {
    setFormData((prev) => ({
      ...prev,
      sections: prev.sections.map((section, index) =>
        index === sectionIndex
          ? {
              ...section,
              questions: section.questions.map((question, qIndex) =>
                qIndex === questionIndex
                  ? {
                      ...question,
                      options: question.options.map((option, oIndex) =>
                        oIndex === optionIndex
                          ? { ...option, [key]: value }
                          : option,
                      ),
                    }
                  : question,
              ),
            }
          : section,
      ),
    }));
  };

  const getAllQuestionIds = (sections = []) => {
  return sections.flatMap(section =>
    (section.questions || [])
      .map(q => q.id)
      .filter(id => Number.isInteger(id))
  );
};

  const handleSubmit = async () => {
if (isEdit && template?.sections) {
  const originalIds = getAllQuestionIds(template.sections);
  const currentIds = getAllQuestionIds(formData.sections);

  const deletedIds = originalIds.filter(id => !currentIds.includes(id));

  if (deletedIds.length > 0) {
    const confirmDelete = window.confirm(
      `${deletedIds.length} question(s) have been removed.\n\n` +
      `This will NOT delete existing checklist data, but may cause mismatch.\n\n` +
      `Do you want to continue?`
    );

    if (!confirmDelete) {
      return;
    }
  }
}

    const cleanSections = formData.sections.map(section => ({
  ...section,
  id: typeof section.id === "number" ? section.id : undefined,
  questions: section.questions.map(q => ({
    ...q,
    id: Number.isInteger(q.id)? q.id : undefined,
  }))
}));
    const payload = {
      ...buildTemplatePayload({
        ...formData,
        sections: cleanSections,
        room_types: selectedRooms.map((id) => ({
          room_type_id: Number(id),
        })),
      }),
      selected_building_ids: selectedBuildingIds
        .map((id) => Number(id))
        .filter(Boolean),
      selected_floor_ids: selectedFloorIds
        .map((id) => Number(id))
        .filter(Boolean),
      selected_unit_ids: selectedUnitIds
        .map((id) => Number(id))
        .filter(Boolean),
      building_id: normalizeId(selectedBuildingIds?.[0] || ""),
      floor_id: normalizeId(selectedFloorIds?.[0] || ""),
    };   
    const validationMessage = validateTemplatePayload(payload);

    if (validationMessage) {
      showToast(validationMessage, "error");
      return;
    }

    setSaving(true);
    try {
      if (isEdit) {
        await updateChecklistTemplateById(template.id, payload);
        showToast("Checklist template updated successfully.", "success");
      } else {
        await createChecklistTemplate(payload);
        showToast("Checklist template created successfully.", "success");
      }
      onSaved?.();
    } catch (error) {
      const message =
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        "Failed to save checklist template.";
      showToast(message, "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: 280,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: palette.text,
        }}
      >
        Loading template...
      </div>
    );
  }

  return (
    <div
      style={{
        borderRadius: 16,
        border: `2px solid ${palette.border}`,
        boxShadow: palette.shadow,
        background: palette.card,
        padding: 24,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap",
          marginBottom: 24,
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              color: palette.text,
              fontSize: 28,
              fontWeight: 800,
            }}
          >
            {isEdit ? "Edit Template" : "Create Template"}
          </h2>
          <div style={{ color: palette.textSecondary, marginTop: 8 }}>
            Configure template details, scope, rooms, towers, floors, units, and
            questions.
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={onBack}
            style={{
              ...palette.secondaryBtn,
              borderRadius: 10,
              padding: "10px 18px",
              cursor: "pointer",
            }}
          >
            Back
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div>
          <label
            style={{ display: "block", marginBottom: 8, color: palette.text }}
          >
            Template Name
          </label>
          <input
            style={inputStyle}
            value={formData.name}
            onChange={(e) => updateField("name", e.target.value)}
            placeholder="Enter template name"
          />
        </div>

        <div>
          <label
            style={{ display: "block", marginBottom: 8, color: palette.text }}
          >
            Project
          </label>
          <select
            style={inputStyle}
            value={formData.project_id}
            onChange={(e) => handleProjectChange(e.target.value)}
          >
            <option value="">Select Project</option>
            {projectOptions.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name || `Project ${project.id}`}
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
            style={inputStyle}
            value={formData.purpose_id}
            onChange={(e) => handlePurposeChange(e.target.value)}
          >
            <option value="">Select Purpose</option>
            {purposes.map((purpose) => (
              <option
                key={getPurposeValue(purpose)}
                value={getPurposeValue(purpose)}
              >
                {getPurposeLabel(purpose)}
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
            style={inputStyle}
            value={formData.phase_id}
            onChange={(e) => handlePhaseChange(e.target.value)}
          >
            <option value="">Select Phase</option>
            {phases.map((phase) => (
              <option key={phase.id} value={phase.id}>
                {phase.name || phase.phase || `Phase ${phase.id}`}
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
            style={inputStyle}
            value={formData.stage_id}
            onChange={(e) => updateField("stage_id", e.target.value)}
          >
            <option value="">Select Stage</option>
            {stages.map((stage) => (
              <option key={stage.id} value={stage.id}>
                {stage.name || stage.stage || `Stage ${stage.id}`}
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
            style={inputStyle}
            value={formData.category}
            onChange={(e) => handleCategoryChange(e.target.value)}
          >
            <option value="">Select Category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {getCategoryLabel(category)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label
            style={{ display: "block", marginBottom: 8, color: palette.text }}
          >
            Applicable Scope
          </label>
          <select
            style={inputStyle}
            value={formData.applicable_scope}
            onChange={(e) => updateField("applicable_scope", e.target.value)}
          >
            <option value="">Select Scope</option>
            <option value="tower">Tower</option>
            <option value="floor">Floor</option>
            <option value="unit">Unit</option>
            <option value="question">Question</option>
          </select>
        </div>

        <div>
          <label
            style={{ display: "block", marginBottom: 8, color: palette.text }}
          >
            Question Target Type
          </label>
          <select
            style={inputStyle}
            value={formData.question_target_type}
            onChange={(e) =>
              updateField("question_target_type", e.target.value)
            }
          >
            <option value="">Select Target Type</option>
            <option value="tower">Tower</option>
            <option value="floor">Floor</option>
            <option value="all_units">All Units</option>
            <option value="selected_units">Selected Units</option>
          </select>
        </div>
      </div>

      <div
        style={{
          border: `2px solid ${palette.border}`,
          borderRadius: 14,
          padding: 18,
          background: palette.tableRowBg,
          marginBottom: 24,
        }}
      >
        <div
          style={{
            color: palette.text,
            fontWeight: 800,
            fontSize: 18,
            marginBottom: 16,
          }}
        >
          Selection Mapping
        </div>

        <div style={{ display: "grid", gap: 18 }}>
          <div>
            <div
              style={{
                display: "flex",
                gap: 10,
                alignItems: "center",
                marginBottom: 10,
                flexWrap: "wrap",
              }}
            >
              <div style={{ color: palette.text, fontWeight: 700 }}>
                Room Types
              </div>
              <button
                type="button"
                onClick={() => setShowRoomsModal(true)}
                style={{
                  ...palette.infoBtn,
                  borderRadius: 10,
                  padding: "8px 14px",
                  cursor: "pointer",
                }}
              >
                Select Rooms
              </button>
            </div>
            <SelectedPills
              palette={palette}
              items={selectedRoomObjects}
              getLabel={(item) => getRoomLabel(item)}
              onRemove={(id) =>
                setSelectedRooms((prev) =>
                  prev.filter((roomId) => roomId !== id),
                )
              }
              emptyText="No room types selected."
            />
          </div>

          <div>
            <div
              style={{
                display: "flex",
                gap: 10,
                alignItems: "center",
                marginBottom: 10,
                flexWrap: "wrap",
              }}
            >
              <div style={{ color: palette.text, fontWeight: 700 }}>
                Towers / Buildings
              </div>
              <button
                type="button"
                onClick={() => setShowTowerModal(true)}
                style={{
                  ...palette.infoBtn,
                  borderRadius: 10,
                  padding: "8px 14px",
                  cursor: "pointer",
                }}
              >
                Select Towers
              </button>
            </div>
            <SelectedPills
              palette={palette}
              items={selectedBuildingObjects}
              getLabel={(item) => getNodeName(item, `Building ${item.id}`)}
              onRemove={(id) => handleToggleBuilding(id, false)}
              emptyText="No towers/buildings selected."
            />
          </div>

          <div>
            <div
              style={{
                display: "flex",
                gap: 10,
                alignItems: "center",
                marginBottom: 10,
                flexWrap: "wrap",
              }}
            >
              <div style={{ color: palette.text, fontWeight: 700 }}>Floors</div>
              <button
                type="button"
                onClick={() => setShowFloorModal(true)}
                style={{
                  ...palette.infoBtn,
                  borderRadius: 10,
                  padding: "8px 14px",
                  cursor: "pointer",
                }}
              >
                Select Floors
              </button>
            </div>
            <SelectedPills
              palette={palette}
              items={selectedFloorObjects}
              getLabel={(item) => getNodeName(item, `Floor ${item.id}`)}
              onRemove={(id) => handleToggleFloor(id, false)}
              emptyText="No floors selected."
            />
          </div>

          <div>
            <div
              style={{
                display: "flex",
                gap: 10,
                alignItems: "center",
                marginBottom: 10,
                flexWrap: "wrap",
              }}
            >
              <div style={{ color: palette.text, fontWeight: 700 }}>Units</div>
              <button
                type="button"
                onClick={() => setShowUnitModal(true)}
                style={{
                  ...palette.infoBtn,
                  borderRadius: 10,
                  padding: "8px 14px",
                  cursor: "pointer",
                }}
              >
                Select Units
              </button>
            </div>
            <SelectedPills
              palette={palette}
              items={selectedUnitObjects}
              getLabel={(item) => getNodeName(item, `Unit ${item.id}`)}
              onRemove={(id) => handleToggleUnit(id, false)}
              emptyText="No units selected."
            />
          </div>
        </div>
      </div>

      <div
        style={{
          border: `2px solid ${palette.border}`,
          borderRadius: 14,
          padding: 18,
          background: palette.tableRowBg,
          marginBottom: 24,
        }}
      >
        <div
          style={{
            color: palette.text,
            fontWeight: 800,
            fontSize: 18,
            marginBottom: 16,
          }}
        >
          Bulk Upload Questions
        </div>

        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleTemplateBulkUpload}
          style={inputStyle}
        />
      </div>

      <div
        style={{
          border: `2px solid ${palette.border}`,
          borderRadius: 14,
          padding: 18,
          background: palette.tableRowBg,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 16,
          }}
        >
          <div style={{ color: palette.text, fontWeight: 800, fontSize: 18 }}>
            Sections & Questions
          </div>

          <button
            type="button"
            onClick={addSection}
            style={{
              ...palette.primaryBtn,
              borderRadius: 10,
              padding: "10px 18px",
              cursor: "pointer",
            }}
          >
            Add Section
          </button>
        </div>

        <div style={{ display: "grid", gap: 18 }}>
          {(formData.sections || []).map((section, sectionIndex) => (
            <div
              key={section.id || sectionIndex}
              style={{
                border: `1px solid ${palette.border}`,
                borderRadius: 14,
                padding: 16,
                background: palette.card,
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  gap: 12,
                  alignItems: "start",
                  marginBottom: 14,
                }}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    style={inputStyle}
                    value={section.title}
                    onChange={(e) =>
                      updateSection(sectionIndex, "title", e.target.value)
                    }
                    placeholder="Section title"
                  />
                  <input
                    style={inputStyle}
                    value={section.description}
                    onChange={(e) =>
                      updateSection(sectionIndex, "description", e.target.value)
                    }
                    placeholder="Section description"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => removeSection(sectionIndex)}
                  style={{
                    ...palette.dangerBtn,
                    borderRadius: 10,
                    padding: "10px 16px",
                    cursor: "pointer",
                  }}
                >
                  Remove Section
                </button>
              </div>

              <div style={{ display: "grid", gap: 14 }}>
                {(section.questions || []).map((question, questionIndex) => (
                  <div
                    key={question.id || questionIndex}
                    style={{
                      border: `1px solid ${palette.border}`,
                      borderRadius: 12,
                      padding: 14,
                      background: palette.tableRowBg,
                    }}
                  >
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr auto",
                        gap: 12,
                        marginBottom: 14,
                        alignItems: "start",
                      }}
                    >
                      <div className="grid grid-cols-1 gap-4">
                        <input
                          style={inputStyle}
                          value={question.title}
                          onChange={(e) =>
                            updateQuestion(
                              sectionIndex,
                              questionIndex,
                              "title",
                              e.target.value,
                            )
                          }
                          placeholder="Question title"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          removeQuestion(sectionIndex, questionIndex)
                        }
                        style={{
                          ...palette.dangerBtn,
                          borderRadius: 10,
                          padding: "10px 16px",
                          cursor: "pointer",
                        }}
                      >
                        Remove Question
                      </button>
                    </div>

                    <div style={{ marginBottom: 14 }}>
                      <label
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 8,
                          color: palette.text,
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={!!question.photo_required}
                          onChange={(e) =>
                            updateQuestion(
                              sectionIndex,
                              questionIndex,
                              "photo_required",
                              e.target.checked,
                            )
                          }
                        />
                        Photo Required
                      </label>
                    </div>

                    <div style={{ display: "grid", gap: 12 }}>
                      {question.options.map((option, optionIndex) => (
                        <div
                          key={option.id || optionIndex}
                          className="grid grid-cols-1 md:grid-cols-3 gap-4"
                        >
                          <input
                            style={inputStyle}
                            value={option.name}
                            onChange={(e) =>
                              updateOption(
                                sectionIndex,
                                questionIndex,
                                optionIndex,
                                "name",
                                e.target.value,
                              )
                            }
                            placeholder="Option name"
                          />
                          <select
                            style={inputStyle}
                            value={option.choice}
                            onChange={(e) =>
                              updateOption(
                                sectionIndex,
                                questionIndex,
                                optionIndex,
                                "choice",
                                e.target.value,
                              )
                            }
                          >
                            <option value="P">Positive</option>
                            <option value="N">Negative</option>
                          </select>
                          <button
                            type="button"
                            onClick={() =>
                              removeOption(
                                sectionIndex,
                                questionIndex,
                                optionIndex,
                              )
                            }
                            style={{
                              ...palette.dangerBtn,
                              borderRadius: 10,
                              padding: "10px 16px",
                              cursor: "pointer",
                            }}
                          >
                            Remove Option
                          </button>
                        </div>
                      ))}
                    </div>

                    <div style={{ marginTop: 14 }}>
                      <button
                        type="button"
                        onClick={() => addOption(sectionIndex, questionIndex)}
                        style={{
                          ...palette.infoBtn,
                          borderRadius: 10,
                          padding: "10px 16px",
                          cursor: "pointer",
                        }}
                      >
                        Add Option
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 16 }}>
                <button
                  type="button"
                  onClick={() => addQuestion(sectionIndex)}
                  style={{
                    ...palette.successBtn,
                    borderRadius: 10,
                    padding: "10px 18px",
                    cursor: "pointer",
                  }}
                >
                  Add Question
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "end",
          gap: 12,
          marginTop: 20,
        }}
      >
        <button
          type="button"
          onClick={onBack}
          style={{
            ...palette.secondaryBtn,
            borderRadius: 10,
            padding: "10px 18px",
            cursor: "pointer",
          }}
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving}
          style={{
            ...palette.primaryBtn,
            borderRadius: 10,
            padding: "10px 18px",
            cursor: saving ? "not-allowed" : "pointer",
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving
            ? "Saving..."
            : isEdit
              ? "Update Template"
              : "Create Template"}
        </button>
      </div>

      <RoomSelectionModal
        isOpen={showRoomsModal}
        onClose={() => setShowRoomsModal(false)}
        palette={palette}
        roomTypes={roomTypes}
        selectedRooms={selectedRooms}
        onToggleRoom={handleToggleRoom}
        onSelectAll={handleSelectAllRooms}
        onClearAll={handleClearAllRooms}
      />

      <MultiSelectModal
        isOpen={showTowerModal}
        onClose={() => setShowTowerModal(false)}
        palette={palette}
        title="Select Tower / Building"
        options={buildings}
        selectedValues={selectedBuildingIds}
        onToggle={handleToggleBuilding}
        onSelectAll={handleSelectAllBuildings}
        onClearAll={handleClearAllBuildings}
        getLabel={(item) => getNodeName(item, `Building ${item.id}`)}
      />

      <MultiSelectModal
        isOpen={showFloorModal}
        onClose={() => setShowFloorModal(false)}
        palette={palette}
        title="Select Floor"
        options={floors}
        selectedValues={selectedFloorIds}
        onToggle={handleToggleFloor}
        onSelectAll={handleSelectAllFloors}
        onClearAll={handleClearAllFloors}
        getLabel={(item) => getNodeName(item, `Floor ${item.id}`)}
      />

      <MultiSelectModal
        isOpen={showUnitModal}
        onClose={() => setShowUnitModal(false)}
        palette={palette}
        title="Select Unit"
        options={units}
        selectedValues={selectedUnitIds}
        onToggle={handleToggleUnit}
        onSelectAll={handleSelectAllUnits}
        onClearAll={handleClearAllUnits}
        getLabel={(item) => getNodeName(item, `Unit ${item.id}`)}
      />
    </div>
  );
};

export default TemplateChecklistForm;