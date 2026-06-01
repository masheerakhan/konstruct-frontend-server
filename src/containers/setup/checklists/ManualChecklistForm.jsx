import React, { useState, useEffect } from "react";
import { showToast } from "../../../utils/toast";
import {
  createManualChecklistTemplate,
  updateManualChecklistTemplateById,
  getManualChecklistCategories,
} from "../../../api/manualChecklistApi";
import { getAssignedProjects,getCategoriesSimpleByProject } from "../../../api/index";
import * as XLSX from "xlsx";

const createEmptyOption = () => ({
  id: null,
  name: "",
  choice: "P",
});

const createEmptyQuestion = (sequence = 1) => ({
  id: null,
  title: "",
  photo_required: false,
  sequence,
  options: [createEmptyOption()],
});

const createEmptySection = (sequence = 1) => ({
  id: null,
  title: "",
  description: "",
  sequence,
  questions: [createEmptyQuestion(1)],
});

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

const parseOptionsString = (optionsString = "") => {
  if (!optionsString || typeof optionsString !== "string") {
    return [];
  }

  return optionsString
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      const match = item.match(/^(.*)\((P|N)\)$/i);

      if (!match) {
        return {
          id: null,
          name: item,
          choice: "P",
        };
      }

      return {
        id: null,
        name: match[1].trim(),
        choice: match[2].toUpperCase(),
      };
    });
};

const buildSectionsFromBulkRows = (rows = []) => {
  const grouped = new Map();

  rows.forEach((row) => {
    const sectionTitle = String(row["Section"] || "").trim() || "General";

    const questionTitle = String(row["Question"] || "").trim();

    if (!questionTitle) return;

    if (!grouped.has(sectionTitle)) {
      grouped.set(sectionTitle, {
        id: null,
        title: sectionTitle,
        description: "",
        sequence: grouped.size + 1,
        questions: [],
      });
    }

    const section = grouped.get(sectionTitle);

const options = parseOptionsString(
  row["Options"] || "",
  row["OptionResults"] || "",
);

    section.questions.push({
      id: null,
      title: questionTitle,
      photo_required: normalizeBoolean(row["Photo Required"]),
      sequence: section.questions.length + 1,
      options: options.length > 0 ? options : [createEmptyOption()],
    });
  });

  return Array.from(grouped.values());
};

const ManualChecklistForm = ({ palette, template, onBack, onSaved }) => {
  const isEdit = !!template?.id;

  const [saving, setSaving] = useState(false);

  const [categories, setCategories] = useState([]);
const [projects, setProjects] = useState([]);
const [projectsLoading, setProjectsLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: template?.name || "",
    project_id: template?.project_id || "",
    category_id: template?.category_id || template?.category || "",
    sections:
      template?.sections?.length > 0
        ? template.sections
        : [createEmptySection(1)],
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

const fetchProjects = async () => {
  setProjectsLoading(true);

  try {
    const userData = JSON.parse(localStorage.getItem("USER_DATA"));

    const userId = userData?.id;

    const response = await getAssignedProjects(userId);

    const data = response?.data || [];

    setProjects(Array.isArray(data) ? data : []);
  } catch (error) {
    setProjects([]);
  } finally {
    setProjectsLoading(false);
  }
};

const fetchCategories = async (projectId) => {
  if (!projectId) {
    setCategories([]);
    return;
  }

  setCategoriesLoading(true);

  try {
    const response = await getCategoriesSimpleByProject(projectId);

    const data = response?.data || [];

    setCategories(Array.isArray(data) ? data : []);
  } catch (error) {
    setCategories([]);
  } finally {
    setCategoriesLoading(false);
  }
};

useEffect(() => {
  fetchProjects();
}, []);

useEffect(() => {
  if (formData.project_id) {
    fetchCategories(formData.project_id);
  }
}, [formData.project_id]);

  const updateField = (key, value) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const buildPayload = () => {
    return {
      name: formData.name,
      project_id: formData.project_id,
      category_id: formData.category_id,
      sections: (formData.sections || []).map((section, sectionIndex) => ({
        id: section.id,
        title: section.title,
        description: section.description || "",
        sequence: sectionIndex + 1,
        questions: (section.questions || []).map((question, questionIndex) => ({
          id: question.id,
          title: question.title,
          photo_required: question.photo_required,
          sequence: questionIndex + 1,
          options: (question.options || []).map((option) => ({
            id: option.id,
            name: option.name,
            choice: option.choice,
          })),
        })),
      })),
    };
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
                  ? {
                      ...question,
                      [key]: value,
                    }
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
                          ? {
                              ...option,
                              [key]: value,
                            }
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

  const handleTemplateBulkUpload = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);

        const workbook = XLSX.read(data, {
          type: "array",
        });

        const sheetName = workbook.SheetNames[0];

        const worksheet = workbook.Sheets[sheetName];

        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (!Array.isArray(jsonData) || jsonData.length === 0) {
          showToast("No valid rows found.", "error");
          return;
        }

        const parsedSections = buildSectionsFromBulkRows(jsonData);

        setFormData((prev) => ({
          ...prev,
          sections: parsedSections,
        }));

        showToast("Questions imported successfully", "success");
      } catch (error) {
        showToast("Error reading Excel file", "error");
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleSubmit = async () => {
    if (!formData.name) {
      showToast("Checklist name is required", "error");
      return;
    }

  if (!formData.project_id) {
    showToast("Project is required", "error");
    return;
  }

  if (!formData.category_id) {
    showToast("Category is required", "error");
    return;
  }

    setSaving(true);

    try {
      const payload = buildPayload();

      if (isEdit) {
        await updateManualChecklistTemplateById(template.id, payload);

        showToast("Manual template updated successfully", "success");
      } else {
        await createManualChecklistTemplate(payload);

        showToast("Manual template created successfully", "success");
      }

      onSaved?.();
    } catch (error) {
      showToast("Failed to save manual checklist template", "error");
    } finally {
      setSaving(false);
    }
  };

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
            {isEdit ? "Edit Manual Template" : "Create Manual Template"}
          </h2>
        </div>

        <button
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label style={{ color: palette.text }}>Checklist Name</label>

          <input
            style={inputStyle}
            value={formData.name}
            onChange={(e) => updateField("name", e.target.value)}
            placeholder="Enter checklist name"
          />
        </div>

        <div>
          <label style={{ color: palette.text }}>Project</label>

          <select
            style={inputStyle}
            value={formData.project_id}
            onChange={(e) => {
              const projectId = e.target.value;

              updateField("project_id", projectId);
              updateField("category_id", "");
              fetchCategories(projectId);
            }}
          >
            <option value="">
              {projectsLoading ? "Loading projects..." : "Select Project"}
            </option>

            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ color: palette.text }}>Category</label>

          <select
            style={inputStyle}
            value={formData.category_id}
            onChange={(e) => updateField("category_id", e.target.value)}
          >
            <option value="">
              {categoriesLoading ? "Loading categories..." : "Select Category"}
            </option>

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
          <div
            style={{
              color: palette.text,
              fontWeight: 800,
              fontSize: 18,
            }}
          >
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
                    value={section.description || ""}
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

              <div
                style={{
                  display: "grid",
                  gap: 14,
                }}
              >
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

                    <div
                      style={{
                        marginBottom: 14,
                      }}
                    >
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

                    <div
                      style={{
                        display: "grid",
                        gap: 12,
                      }}
                    >
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

                    <div
                      style={{
                        marginTop: 14,
                      }}
                    >
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

              <div
                style={{
                  marginTop: 16,
                }}
              >
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
          justifyContent: "space-between",
          marginTop: 24,
        }}
      >
        <button
          onClick={addSection}
          style={{
            ...palette.primaryBtn,
            borderRadius: 10,
            padding: "10px 18px",
          }}
        >
          Add Section
        </button>

        <button
          onClick={handleSubmit}
          disabled={saving}
          style={{
            ...palette.successBtn,
            borderRadius: 10,
            padding: "10px 18px",
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
    </div>
  );
};

export default ManualChecklistForm;
