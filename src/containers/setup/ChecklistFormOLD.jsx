import React, { useState, useEffect } from "react";
import { MdDelete, MdAdd } from "react-icons/md";
import {
  createChecklist,
  allinfobuildingtoflat,
  getPurposeByProjectId,
  getPhaseByPurposeId,
  GetstagebyPhaseid,
  getCategoryTreeByProject,
  createChecklistQuestion,
  // createChecklistItemOption,
  createChecklistItemOPTIONSS,
  getChecklistById,
  updateChecklistById,
} from "../../api";
import { showToast } from "../../utils/toast";
import * as XLSX from "xlsx"; // Add this import

import axios from "axios";
const ChecklistForm = ({
  setShowForm,
  checklist,
  projectOptions = [],
  onChecklistCreated,
}) => {
  // Project and hierarchy
  const [projectId, setProjectId] = useState("");
  const [buildings, setBuildings] = useState([]);
  const [levels, setLevels] = useState([]);
  const [zones, setZones] = useState([]);
  const [flats, setFlats] = useState([]);
  const [selectedBuilding, setSelectedBuilding] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");
  const [selectedZone, setSelectedZone] = useState("");
  const [selectedFlat, setSelectedFlat] = useState("");

  // Purpose/Phase/Stage
  const [purposes, setPurposes] = useState([]);
  const [phases, setPhases] = useState([]);
  const [stages, setStages] = useState([]);
  const [selectedPurpose, setSelectedPurpose] = useState("");
  const [selectedPhase, setSelectedPhase] = useState("");
  const [selectedStage, setSelectedStage] = useState("");
  const [skipInitializer, setSkipInitializer] = useState(false);
  // Category tree & category levels
  const [categoryTree, setCategoryTree] = useState([]);
  const [category, setCategory] = useState("");
  const [cat1, setCat1] = useState("");
  const [cat2, setCat2] = useState("");
  const [cat3, setCat3] = useState("");
  const [cat4, setCat4] = useState("");
  const [cat5, setCat5] = useState("");
  const [cat6, setCat6] = useState("");

  // Checklist logic
  const [options, setOptions] = useState([{ value: "", submission: "P" }]);
  const [questions, setQuestions] = useState([
    { question: "", options: [], photo_required: false },
  ]);

  const [numOfQuestions, setNumOfQuestions] = useState(1);
  const isEdit = !!checklist;

  // Checklist name
  const [checklistName, setChecklistName] = useState("");

  // Flat name object
  const selectedFlatObj = flats.find(
    (f) => String(f.id) === String(selectedFlat),
  );

  // Fill fields for edit
  useEffect(() => {
    if (checklist) {
      setProjectId(checklist.project || "");
      setChecklistName(checklist.name || "");
      setCategory(checklist.category || "");
      setCat1(checklist.CategoryLevel1 || "");
      setCat2(checklist.CategoryLevel2 || "");
      setCat3(checklist.CategoryLevel3 || "");
      setCat4(checklist.CategoryLevel4 || "");
      setCat5(checklist.CategoryLevel5 || "");
      setCat6(checklist.CategoryLevel6 || "");
      setQuestions(
        checklist.questions || [
          { question: "", options: [], photo_required: false },
        ],
      );
      setSelectedBuilding(checklist.building || "");
      setSelectedLevel(checklist.level || "");
      setSelectedZone(checklist.zone || "");
      setSelectedFlat(checklist.flat || "");
      setSelectedPurpose(checklist.purpose || "");
      setSelectedPhase(checklist.phase || "");
      setSelectedStage(checklist.stage || "");
    }
  }, [checklist]);

  // Fetch category tree when project changes
  useEffect(() => {
    if (!projectId) {
      setCategoryTree([]);
      setCategory("");
      setCat1("");
      setCat2("");
      setCat3("");
      setCat4("");
      setCat5("");
      setCat6("");
      return;
    }
    getCategoryTreeByProject(projectId)
      .then((res) => setCategoryTree(res.data || []))
      .catch(() => {
        setCategoryTree([]);
        showToast("Failed to load categories", "error");
      });
  }, [projectId]);

  // On project change, fetch buildings & purposes
  useEffect(() => {
    if (!projectId) {
      setBuildings([]);
      setLevels([]);
      setZones([]);
      setFlats([]);
      setPurposes([]);
      setPhases([]);
      setStages([]);
      setSelectedBuilding("");
      setSelectedLevel("");
      setSelectedZone("");
      setSelectedFlat("");
      setSelectedPurpose("");
      setSelectedPhase("");
      setSelectedStage("");
      return;
    }
    allinfobuildingtoflat(projectId)
      .then((res) => setBuildings(res.data || []))
      .catch(() => {
        showToast("Failed to load buildings", "error");
        setBuildings([]);
      });
    getPurposeByProjectId(projectId)
      .then((res) => setPurposes(res.data || []))
      .catch(() => {
        showToast("Failed to load purposes", "error");
        setPurposes([]);
      });
    setLevels([]);
    setZones([]);
    setFlats([]);
    setPhases([]);
    setStages([]);
    setSelectedBuilding("");
    setSelectedLevel("");
    setSelectedZone("");
    setSelectedFlat("");
    setSelectedPurpose("");
    setSelectedPhase("");
    setSelectedStage("");
  }, [projectId]);

  // (async () => {
  //try {
  //    const response = await axios.get(
  //  `https://konstruct.world/projects/purpose/get-purpose-details-by-project-id/${projectId}/`,
  //{
  //    headers: {
  //        Authorization: `Bearer ${localStorage.getItem("ACCESS_TOKEN")}`,
  //  "Content-Type": "application/json",
  //  },
  //  }
  //  );
  //   setPurposes(Array.isArray(response.data) ? response.data : []);
  // } catch (error) {
  //  showToast("Failed to load purposes", "error");
  //   setPurposes([]);
  // }})();  // Add this useEffect after your existing ones
  // useEffect(() => {
  //    if (isEdit && checklist?.id) {
  //   const fetchChecklistDetails = async () => {
  //      try {
  //          const response = await getChecklistById(checklist.id);
  // const checklistData = response.data;

  // Pre-populate all fields
  //setChecklistName(checklistData.name || "");
  //  setProjectId(checklistData.project_id || "");
  //    setSelectedPurpose(checklistData.purpose_id || "");
  // setSelectedPhase(checklistData.phase_id || "");
  useEffect(() => {
    if (!projectId) {
      setPurposes([]);
      return;
    }

    const fetchPurposes = async () => {
      try {
        const response = await axios.get(
          `http://127.0.0.1:8002/api/projects/purpose/get-purpose-details-by-project-id/${projectId}/`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("ACCESS_TOKEN")}`,
              "Content-Type": "application/json",
            },
          },
        );
        setPurposes(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        showToast("Failed to load purposes", "error");
        setPurposes([]);
      }
    };

    fetchPurposes();
  }, [projectId]);

  useEffect(() => {
    if (isEdit && checklist?.id) {
      const fetchChecklistDetails = async () => {
        try {
          const response = await getChecklistById(checklist.id);
          const checklistData = response.data;

          setSelectedStage(checklistData.stage_id || "");
          setCategory(checklistData.category || "");
          setCat1(checklistData.category_level1 || "");
          setCat2(checklistData.category_level2 || "");
          setCat3(checklistData.category_level3 || "");
          setCat4(checklistData.category_level4 || "");
          setCat5(checklistData.category_level5 || "");
          setCat6(checklistData.category_level6 || "");
          setSelectedBuilding(checklistData.building_id || "");
          setSelectedZone(checklistData.zone_id || "");
          setSelectedFlat(checklistData.flat_id || "");

          // Pre-populate questions if they exist
          if (checklistData.items && checklistData.items.length > 0) {
            const formattedQuestions = checklistData.items.map((item) => ({
              question: item.title,
              options: item.options
                ? item.options.map((opt) => ({
                    value: opt.name,
                    submission: opt.choice,
                  }))
                : [],
              photo_required: item.photo_required || false,
            }));
            setQuestions(formattedQuestions);
          }
        } catch (error) {
          showToast("Failed to load checklist details", "error");
        }
      };

      fetchChecklistDetails();
    }
  }, [isEdit, checklist?.id]);
  // Levels by building
  useEffect(() => {
    if (!selectedBuilding) {
      setLevels([]);
      setZones([]);
      setFlats([]);
      setSelectedLevel("");
      setSelectedZone("");
      setSelectedFlat("");
      return;
    }
    const b = buildings.find((x) => String(x.id) === String(selectedBuilding));
    setLevels(b?.levels || []);
    setSelectedLevel("");
    setSelectedZone("");
    setSelectedFlat("");
  }, [selectedBuilding, buildings]);

  // Zones by level
  useEffect(() => {
    if (!selectedLevel) {
      setZones([]);
      setFlats([]);
      setSelectedZone("");
      setSelectedFlat("");
      return;
    }
    const l = levels.find((x) => String(x.id) === String(selectedLevel));
    setZones(l?.zones || []);
    setSelectedZone("");
    setSelectedFlat("");
  }, [selectedLevel, levels]);

  // Flats by zone
  useEffect(() => {
    if (!selectedZone) {
      setFlats([]);
      setSelectedFlat("");
      return;
    }
    const z = zones.find((x) => String(x.id) === String(selectedZone));
    setFlats(z?.flats || []);
    setSelectedFlat("");
  }, [selectedZone, zones]);

  // On purpose change, fetch phases
  useEffect(() => {
    if (!selectedPurpose) {
      setPhases([]);
      setStages([]);
      setSelectedPhase("");
      setSelectedStage("");
      return;
    }
    getPhaseByPurposeId(selectedPurpose)
      .then((res) => setPhases(res.data || []))
      .catch(() => {
        showToast("Failed to load phases", "error");
        setPhases([]);
      });
    setStages([]);
    setSelectedPhase("");
    setSelectedStage("");
  }, [selectedPurpose]);

  // On phase change, fetch stages
  useEffect(() => {
    if (!selectedPhase) {
      setStages([]);
      setSelectedStage("");
      return;
    }
    GetstagebyPhaseid(selectedPhase)
      .then((res) => setStages(res.data || []))
      .catch(() => {
        showToast("Failed to load stages");
        setStages([]);
      });
    setSelectedStage("");
  }, [selectedPhase]);

  // Add Option to a Question
  const handleQuestionOptionAdd = (qIdx) => {
    setQuestions((prev) => {
      const updated = [...prev];
      // Ensure options array exists
      if (!updated[qIdx].options) {
        updated[qIdx].options = [];
      }
      updated[qIdx].options.push({ value: "", submission: "P" });
      return updated;
    });
  };

  // Change Option Value/Submission
  const handleQuestionOptionChange = (qIdx, key, value, optIdx) => {
    setQuestions((prev) => {
      const updated = [...prev];
      // Ensure options array exists
      if (!updated[qIdx].options) {
        updated[qIdx].options = [];
      }
      // Ensure the option exists
      if (!updated[qIdx].options[optIdx]) {
        updated[qIdx].options[optIdx] = { value: "", submission: "P" };
      }
      updated[qIdx].options[optIdx][key] = value;
      return updated;
    });
  };

  // Remove Option from a Question
  const handleQuestionOptionRemove = (qIdx, optIdx) => {
    setQuestions((prev) => {
      const updated = [...prev];
      if (updated[qIdx].options && updated[qIdx].options.length > optIdx) {
        updated[qIdx].options = updated[qIdx].options.filter(
          (_, idx) => idx !== optIdx,
        );
      }
      return updated;
    });
  };

  // Improved "Add More Questions" handler
  const handleAddMoreQuestions = () => {
    const toAdd = [];
    for (let i = 0; i < numOfQuestions; i++) {
      toAdd.push({
        question: "",
        options: [], // Start with empty options array
        photo_required: false,
      });
    }
    setQuestions([...questions, ...toAdd]);
  };

  // Nested category helpers
  const getLevelOptions = (levelKey) => {
    if (levelKey === 1) {
      return categoryTree;
    }
    if (levelKey === 2 && category) {
      return (
        categoryTree.find((cat) => String(cat.id) === String(category))
          ?.level1 || []
      );
    }
    if (levelKey === 3 && cat1) {
      const catObj = categoryTree.find(
        (cat) => String(cat.id) === String(category),
      );
      return (
        catObj?.level1.find((l1) => String(l1.id) === String(cat1))?.level2 ||
        []
      );
    }
    if (levelKey === 4 && cat2) {
      const catObj = categoryTree.find(
        (cat) => String(cat.id) === String(category),
      );
      const cat1Obj = catObj?.level1.find(
        (l1) => String(l1.id) === String(cat1),
      );
      return (
        cat1Obj?.level2.find((l2) => String(l2.id) === String(cat2))?.level3 ||
        []
      );
    }
    if (levelKey === 5 && cat3) {
      const catObj = categoryTree.find(
        (cat) => String(cat.id) === String(category),
      );
      const cat1Obj = catObj?.level1.find(
        (l1) => String(l1.id) === String(cat1),
      );
      const cat2Obj = cat1Obj?.level2.find(
        (l2) => String(l2.id) === String(cat2),
      );
      return (
        cat2Obj?.level3.find((l3) => String(l3.id) === String(cat3))?.level4 ||
        []
      );
    }
    if (levelKey === 6 && cat4) {
      const catObj = categoryTree.find(
        (cat) => String(cat.id) === String(category),
      );
      const cat1Obj = catObj?.level1.find(
        (l1) => String(l1.id) === String(cat1),
      );
      const cat2Obj = cat1Obj?.level2.find(
        (l2) => String(l2.id) === String(cat2),
      );
      const cat3Obj = cat2Obj?.level3.find(
        (l3) => String(l3.id) === String(cat3),
      );
      return (
        cat3Obj?.level4.find((l4) => String(l4.id) === String(cat4))?.level5 ||
        []
      );
    }
    return [];
  };

  // On changing any category level, reset lower levels
  const handleCategoryChange = (e) => {
    setCategory(e.target.value);
    setCat1("");
    setCat2("");
    setCat3("");
    setCat4("");
    setCat5("");
    setCat6("");
  };
  const handleCat1Change = (e) => {
    setCat1(e.target.value);
    setCat2("");
    setCat3("");
    setCat4("");
    setCat5("");
    setCat6("");
  };
  const handleCat2Change = (e) => {
    setCat2(e.target.value);
    setCat3("");
    setCat4("");
    setCat5("");
    setCat6("");
  };
  const handleCat3Change = (e) => {
    setCat3(e.target.value);
    setCat4("");
    setCat5("");
    setCat6("");
  };
  const handleCat4Change = (e) => {
    setCat4(e.target.value);
    setCat5("");
    setCat6("");
  };
  const handleCat5Change = (e) => {
    setCat5(e.target.value);
    setCat6("");
  };
  const handleCat6Change = (e) => {
    setCat6(e.target.value);
  };

  const handleCreateChecklist = async () => {
    // Enhanced validation
    if (!checklistName.trim()) return showToast("Checklist name required!");
    if (!projectId || projectId === "") return showToast("Select a project");
    if (!selectedPurpose || selectedPurpose === "")
      return showToast("Select a purpose");
    if (!category || category === "") return showToast("Select a category");
    if (!questions.length) return showToast("Add at least one question");

    // for (let q of questions) {
    //   if (!q.question?.trim()) return showToast("All questions must have text");
    // }

    // Convert and validate IDs
    const parsedProjectId = parseInt(projectId);
    const parsedPurposeId = parseInt(selectedPurpose);
    const parsedCategoryId = parseInt(category);

    if (isNaN(parsedProjectId)) return showToast("Invalid project selected");
    if (isNaN(parsedPurposeId)) return showToast("Invalid purpose selected");
    if (isNaN(parsedCategoryId)) return showToast("Invalid category selected");

    console.log("Project ID:", parsedProjectId);

    const checklistPayload = {
      name: checklistName,
      project_id: parsedProjectId,
      purpose_id: parsedPurposeId,
      phase_id:
        selectedPhase && selectedPhase !== "" ? parseInt(selectedPhase) : null,
      stage_id:
        selectedStage && selectedStage !== "" ? parseInt(selectedStage) : null,
      category: parsedCategoryId,
      category_level1: cat1 && cat1 !== "" ? parseInt(cat1) : null,
      category_level2: cat2 && cat2 !== "" ? parseInt(cat2) : null,
      category_level3: cat3 && cat3 !== "" ? parseInt(cat3) : null,
      category_level4: cat4 && cat4 !== "" ? parseInt(cat4) : null,
      category_level5: cat5 && cat5 !== "" ? parseInt(cat5) : null,
      category_level6: cat6 && cat6 !== "" ? parseInt(cat6) : null,
      building_id:
        selectedBuilding && selectedBuilding !== ""
          ? parseInt(selectedBuilding)
          : null,
      zone_id:
        selectedZone && selectedZone !== "" ? parseInt(selectedZone) : null,
      flat_id:
        selectedFlat && selectedFlat !== "" ? parseInt(selectedFlat) : null,
      remarks: "",
      not_initialized: skipInitializer,
    };

    try {
      console.log("Payload being sent:", checklistPayload);

      let checklistRes;
      let checklistId;

      if (isEdit && checklist?.id) {
        // UPDATE existing checklist
        checklistRes = await updateChecklistById(
          checklist.id,
          checklistPayload,
        );
        checklistId = checklist.id;
        showToast("Checklist updated successfully!", "success");
      } else {
        // CREATE new checklist
        checklistRes = await createChecklist(checklistPayload);
        checklistId =
          checklistRes.data?.id ||
          checklistRes.data?.pk ||
          checklistRes.data?.ID;
        showToast("Checklist created successfully!", "success");
      }

      if (
        checklistRes.status === 201 ||
        checklistRes.status === 200 ||
        checklistRes.data?.id
      ) {
        // Create items and options
        for (let i = 0; i < questions.length; i++) {
          const q = questions[i];

          // 1. Create ChecklistItem (question)
          const itemRes = await createChecklistQuestion({
            checklist: checklistId,
            title: q.question,
            photo_required: q.photo_required || false,
            // sequence: i + 1,
            is_done: false,
          });

          const checklistItemId = itemRes.data?.id;

          // 2. Create options for that question (only if options exist and have values)
          if (checklistItemId && q.options?.length) {
            for (let option of q.options) {
              // Only create options that have actual values
              if (option.value && option.value.trim() !== "") {
                await createChecklistItemOPTIONSS({
                  checklist_item: checklistItemId,
                  name: option.value,
                  choice: option.submission,
                });
              }
            }
          }
        }

        // Call the callback function to show user access table
        if (
          !isEdit &&
          onChecklistCreated &&
          typeof onChecklistCreated === "function"
        ) {
          const createdChecklistData = {
            ...checklistPayload,
            id: checklistId,
            project_id: parsedProjectId,
            category_id: parsedCategoryId,
          };
          onChecklistCreated(createdChecklistData);
        }

        setShowForm(false);
      } else {
        console.error("Checklist creation failed:", checklistRes);
        showToast(
          checklistRes.data?.message || "Failed to create checklist",
          "error",
        );
      }
    } catch (error) {
      console.error("Error creating checklist:", "error");

      // More detailed error handling
      if (error.response) {
        console.error("Error response:", error.response.data);
        const errorMessage =
          error.response.data?.message ||
          error.response.data?.detail ||
          `Server error: ${error.response.status}`;
        showToast(errorMessage);
      } else {
        showToast(
          "Failed to create checklist and questions. Please try again.",
          "error",
        );
      }
    }
  };

  // Bulk upload handler
  const handleBulkUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const bulkQuestions = [];

        jsonData.forEach((row) => {
          // Expected columns: Question, Options, PhotoRequired
          // Options format: "Option1(P)|Option2(N)|Option3(P)"
          const question = row["Question"] || row["question"] || "";
          const optionsString = row["Options"] || row["options"] || "";
          const photoRequired =
            row["PhotoRequired"] || row["photo_required"] || false;

          const options = [];
          if (optionsString) {
            const optionPairs = optionsString.split("|");
            optionPairs.forEach((pair) => {
              const match = pair.match(/^(.+)\(([PN])\)$/);
              if (match) {
                options.push({
                  value: match[1].trim(),
                  submission: match[2],
                });
              }
            });
          }

          if (question.trim()) {
            bulkQuestions.push({
              question: question.trim(),
              options: options,
              photo_required:
                photoRequired === true ||
                photoRequired === "true" ||
                photoRequired === "True",
            });
          }
        });

        if (bulkQuestions.length > 0) {
          setQuestions([...questions, ...bulkQuestions]);
          showToast(
            `${bulkQuestions.length} questions uploaded successfully!`,
            "success",
          );
        } else {
          showToast("No valid questions found in the file", "error");
        }

        // Reset file input
        event.target.value = "";
      } catch (error) {
        showToast("Error reading file. Please check the format.", "error");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="p-8 bg-white rounded-lg shadow-md">
      {/* Checklist Name Input */}
      <div className="mb-2">
        <label className="block font-bold text-lg mb-1">
          Checklist Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          className="w-full p-2 border border-gray-300 rounded"
          placeholder="Enter checklist name"
          value={checklistName}
          onChange={(e) => setChecklistName(e.target.value)}
          required
        />
      </div>

      {/* Show the checklist name as heading if filled */}
      {checklistName && (
        <div className="mb-4 p-3 rounded-lg bg-gray-100 border text-xl font-semibold text-purple-800 text-center">
          {checklistName}
        </div>
      )}

      {/* Flat name display */}
      {selectedFlatObj && (
        <div className="mb-4 p-3 rounded-lg bg-blue-100 border text-lg font-semibold text-blue-800 text-center">
          Flat: {selectedFlatObj.number}
        </div>
      )}

      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-semibold">
          {isEdit ? "Edit Checklist" : "Add Checklist"}
        </h1>
        <button
          className="bg-purple-700 text-white p-2 rounded"
          onClick={() => setShowForm(false)}
        >
          Back
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Project Dropdown */}
        <div>
          <label className="block text-gray-700 mb-1">
            Project <span className="text-red-500">*</span>
          </label>
          <select
            className="w-full p-2 border border-gray-300 rounded"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
          >
            <option value="">Select Project</option>
            {projectOptions.map((proj) => (
              <option key={proj.id} value={proj.id}>
                {proj.name}
              </option>
            ))}
          </select>
        </div>
        {/* Building Dropdown */}
        {buildings.length > 0 && (
          <div>
            <label className="block text-gray-700 mb-1">Tower / Building</label>
            <select
              className="w-full p-2 border border-gray-300 rounded"
              value={selectedBuilding}
              onChange={(e) => setSelectedBuilding(e.target.value)}
            >
              <option value="">Select Building</option>
              {buildings.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        )}
        {/* Level Dropdown */}
        {levels.length > 0 && (
          <div>
            <label className="block text-gray-700 mb-1">Level</label>
            <select
              className="w-full p-2 border border-gray-300 rounded"
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
            >
              <option value="">Select Level</option>
              {levels.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
        )}
        {/* Zone Dropdown */}
        {zones.length > 0 && (
          <div>
            <label className="block text-gray-700 mb-1">Zone</label>
            <select
              className="w-full p-2 border border-gray-300 rounded"
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
            >
              <option value="">Select Zone</option>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name}
                </option>
              ))}
            </select>
          </div>
        )}
        {/* Flat Dropdown */}
        {flats.length > 0 && (
          <div>
            <label className="block text-gray-700 mb-1">Flat</label>
            <select
              className="w-full p-2 border border-gray-300 rounded"
              value={selectedFlat}
              onChange={(e) => setSelectedFlat(e.target.value)}
            >
              <option value="">Select Flat</option>
              {flats.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.number}
                </option>
              ))}
            </select>
          </div>
        )}
        {/* Purpose Dropdown */}
        {purposes.length > 0 && (
          <div>
            <label className="block text-gray-700 mb-1">
              Purpose <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full p-2 border border-gray-300 rounded"
              value={selectedPurpose}
              onChange={(e) => setSelectedPurpose(e.target.value)}
            >
              <option value="">Select Purpose</option>
              {purposes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        )}
        {/* Phase Dropdown */}
        {phases.length > 0 && (
          <div>
            <label className="block text-gray-700 mb-1">Phase</label>
            <select
              className="w-full p-2 border border-gray-300 rounded"
              value={selectedPhase}
              onChange={(e) => setSelectedPhase(e.target.value)}
            >
              <option value="">Select Phase</option>
              {phases.map((ph) => (
                <option key={ph.id} value={ph.id}>
                  {ph.name}
                </option>
              ))}
            </select>
          </div>
        )}
        {/* Stage Dropdown */}
        {stages.length > 0 && (
          <div>
            <label className="block text-gray-700 mb-1">Stage</label>
            <select
              className="w-full p-2 border border-gray-300 rounded"
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
            >
              <option value="">Select Stage</option>
              {stages.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name}
                </option>
              ))}
            </select>
          </div>
        )}
        {/* Category Level 1 */}
        <div>
          <label className="block text-gray-700 mb-1">
            Category <span className="text-red-500">*</span>
          </label>
          <select
            className="w-full p-2 border border-gray-300 rounded"
            value={category}
            onChange={handleCategoryChange}
          >
            <option value="">Select Category</option>
            {getLevelOptions(1).map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.name}
              </option>
            ))}
          </select>
        </div>
        {/* Category Level 2 */}
        {getLevelOptions(2).length > 0 && (
          <div>
            <label className="block text-gray-700 mb-1">Category Level 2</label>
            <select
              className="w-full p-2 border border-gray-300 rounded"
              value={cat1}
              onChange={handleCat1Change}
            >
              <option value="">Select Level 2</option>
              {getLevelOptions(2).map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.name}
                </option>
              ))}
            </select>
          </div>
        )}
        {/* Category Level 3 */}
        {getLevelOptions(3).length > 0 && (
          <div>
            <label className="block text-gray-700 mb-1">Category Level 3</label>
            <select
              className="w-full p-2 border border-gray-300 rounded"
              value={cat2}
              onChange={handleCat2Change}
            >
              <option value="">Select Level 3</option>
              {getLevelOptions(3).map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.name}
                </option>
              ))}
            </select>
          </div>
        )}
        {/* Category Level 4 */}
        {getLevelOptions(4).length > 0 && (
          <div>
            <label className="block text-gray-700 mb-1">Category Level 4</label>
            <select
              className="w-full p-2 border border-gray-300 rounded"
              value={cat3}
              onChange={handleCat3Change}
            >
              <option value="">Select Level 4</option>
              {getLevelOptions(4).map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.name}
                </option>
              ))}
            </select>
          </div>
        )}
        {/* Category Level 5 */}
        {getLevelOptions(5).length > 0 && (
          <div>
            <label className="block text-gray-700 mb-1">Category Level 5</label>
            <select
              className="w-full p-2 border border-gray-300 rounded"
              value={cat4}
              onChange={handleCat4Change}
            >
              <option value="">Select Level 5</option>
              {getLevelOptions(5).map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.name}
                </option>
              ))}
            </select>
          </div>
        )}
        {/* Category Level 6 */}
        {getLevelOptions(6).length > 0 && (
          <div>
            <label className="block text-gray-700 mb-1">Category Level 6</label>
            <select
              className="w-full p-2 border border-gray-300 rounded"
              value={cat5}
              onChange={handleCat5Change}
            >
              <option value="">Select Level 6</option>
              {getLevelOptions(6).map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 mb-4">
        <input
          type="checkbox"
          id="skip-initializer"
          checked={skipInitializer}
          onChange={(e) => setSkipInitializer(e.target.checked)}
          className="accent-purple-700"
        />
        <label
          htmlFor="skip-initializer"
          className="font-medium text-purple-800"
        >
          Skip Initializer (Start checklist as In Progress)
        </label>
      </div>
      {/* Question/Option Section */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Add Questions</h2>
        <div className="grid grid-cols-6 gap-4 mb-4">
          <label className="col-span-2">Add No. of Questions</label>
          <input
            type="number"
            className="w-full p-2 border border-gray-300 rounded col-span-1"
            min={1}
            value={numOfQuestions}
            onChange={(e) => setNumOfQuestions(Number(e.target.value))}
          />
          <button
            onClick={handleAddMoreQuestions}
            className="bg-purple-600 text-white p-2 rounded col-span-2"
          >
            Add More Questions
          </button>
        </div>
        <div className="grid grid-cols-6 gap-4 mb-4 items-center">
          <label className="col-span-2 font-medium">
            Bulk Upload Questions
          </label>
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleBulkUpload}
            className="col-span-2 p-2 border border-gray-300 rounded text-sm"
          />
          <button
            onClick={() => {
              const link = document.createElement("a");
              link.href =
                'data:text/plain;charset=utf-8,Question,Options,PhotoRequired\n"What is the quality?","Good(P)|Bad(N)|Average(P)",false\n"Check alignment","Aligned(P)|Not Aligned(N)",true';
              link.download = "questions_template.csv";
              link.click();
            }}
            className="bg-green-600 text-white p-2 rounded col-span-2 text-sm"
          >
            Download Template
          </button>
        </div>
        <div className="flex flex-col gap-4">
          {questions.map((q, qIdx) => (
            <div
              key={qIdx}
              className="mb-4 bg-gray-50 border border-purple-300 rounded-xl shadow flex flex-col p-4 gap-4 relative"
              style={{
                borderLeft: "6px solid #9333ea",
                minHeight: "72px",
              }}
            >
              <div className="flex items-center gap-4">
                <span
                  className="text-purple-700 font-bold text-xl flex-shrink-0"
                  style={{
                    width: 36,
                    height: 36,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#ede9fe",
                    borderRadius: "50%",
                    marginRight: 12,
                    border: "2px solid #c4b5fd",
                  }}
                >
                  {qIdx + 1}
                </span>
                <input
                  type="text"
                  placeholder={`Enter your question ${qIdx + 1}`}
                  className="flex-1 p-2 border border-gray-300 rounded text-lg font-medium bg-white focus:border-purple-500"
                  value={q.question}
                  onChange={(e) =>
                    setQuestions((prev) => {
                      const updated = [...prev];
                      updated[qIdx] = {
                        ...updated[qIdx],
                        question: e.target.value,
                      };
                      return updated;
                    })
                  }
                />
                {/* Photo Required Toggle */}
                <label className="flex items-center gap-2 ml-2 text-purple-800 font-medium">
                  <input
                    type="checkbox"
                    checked={!!q.photo_required}
                    onChange={(e) =>
                      setQuestions((prev) => {
                        const updated = [...prev];
                        updated[qIdx] = {
                          ...updated[qIdx],
                          photo_required: e.target.checked,
                        };
                        return updated;
                      })
                    }
                    className="accent-purple-600 w-5 h-5"
                  />
                  Photo Required
                </label>
                <button
                  className="text-red-600 hover:bg-red-100 rounded p-2 transition"
                  onClick={() => {
                    if (questions.length === 1) {
                      showToast("At least one question is required", "error");
                      return;
                    }
                    setQuestions(questions.filter((_, idx) => idx !== qIdx));
                  }}
                  title="Remove"
                >
                  <MdDelete size={22} />
                </button>
              </div>
              {/* Options */}
              <div className="flex flex-wrap items-center gap-2 pl-10">
                {(q.options || []).map((option, optIdx) => (
                  <div
                    key={optIdx}
                    className="flex items-center justify-between gap-2 border border-gray-300 rounded-md p-2"
                  >
                    <input
                      type="text"
                      placeholder="Add Option"
                      className="w-full outline-none border-none"
                      value={option.value || ""}
                      onChange={(e) =>
                        handleQuestionOptionChange(
                          qIdx,
                          "value",
                          e.target.value,
                          optIdx,
                        )
                      }
                    />
                    <select
                      value={option.submission || "P"}
                      onChange={(e) =>
                        handleQuestionOptionChange(
                          qIdx,
                          "submission",
                          e.target.value,
                          optIdx,
                        )
                      }
                      style={{
                        backgroundColor:
                          option.submission === "P" ? "Green" : "Red",
                        color: "white",
                        borderRadius: "8px",
                      }}
                    >
                      <option value="P">P</option>
                      <option value="N">N</option>
                    </select>
                    <button
                      className="text-red-600"
                      onClick={() => handleQuestionOptionRemove(qIdx, optIdx)}
                      title="Remove Option"
                    >
                      <MdDelete />
                    </button>
                  </div>
                ))}
                <button
                  className="bg-purple-600 text-white p-2 rounded"
                  onClick={() => handleQuestionOptionAdd(qIdx)}
                  type="button"
                >
                  <MdAdd />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex gap-4 mt-6">
        <button
          className="bg-purple-700 text-white p-3 rounded"
          onClick={handleCreateChecklist}
        >
          {isEdit ? "Update Checklist" : "Create Checklist"}
        </button>
      </div>
    </div>
  );
};

export default ChecklistForm;
