import React, { useState, useEffect } from "react";
import { getAssignedProjects, getCategoriesSimpleByProject } from "../../../api/index";

const ManualChecklistDetails = ({ palette, template, onBack, onEdit }) => {
  const [projectName, setProjectName] = useState("");
  const [categoryName, setCategoryName] = useState("");


  useEffect(() => {
    if (template) {
      fetchDetails();
    }
  }, [template]);

const fetchDetails = async () => {
  try {
    // PROJECT NAME
    const userData = JSON.parse(localStorage.getItem("USER_DATA"));

    const userId = userData?.id;

    const projectRes = await getAssignedProjects(userId);

    const project = (projectRes.data || []).find(
      (item) => Number(item.id) === Number(template.project_id),
    );

    setProjectName(project?.name || "-");

    // CATEGORY NAME
    if (template.project_id) {
      const categoryRes =
        await getCategoriesSimpleByProject(
          template.project_id
        );

      const category = (categoryRes.data || []).find(
        (item) => Number(item.id) === Number(template.category_id),
      );

      setCategoryName(category?.name || "-");
    }
  } catch (err) {
    console.error(err);
  }
};
if (!template) return null;


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
          gap: 16,
          flexWrap: "wrap",
          alignItems: "start",
          marginBottom: 24,
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: 28,
              fontWeight: 800,
              color: palette.text,
            }}
          >
            {template.name}
          </h2>

          <div
            style={{
              color: palette.textSecondary,
              marginTop: 8,
            }}
          >
            Manual checklist template details
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
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

          <button
            onClick={() => onEdit(template)}
            style={{
              ...palette.successBtn,
              borderRadius: 10,
              padding: "10px 18px",
              cursor: "pointer",
            }}
          >
            Edit Template
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div
          style={{
            border: `2px solid ${palette.border}`,
            borderRadius: 12,
            padding: 16,
            color: palette.text,
            background: palette.tableRowBg,
          }}
        >
          <div
            style={{
              fontSize: 13,
              color: palette.textSecondary,
            }}
          >
            Template Name
          </div>

          <div
            style={{
              marginTop: 6,
              fontSize: 18,
              fontWeight: 700,
            }}
          >
            {template.name}
          </div>
        </div>

        <div
          style={{
            border: `2px solid ${palette.border}`,
            borderRadius: 12,
            padding: 16,
            color: palette.text,
            background: palette.tableRowBg,
          }}
        >
          <div
            style={{
              fontSize: 13,
              color: palette.textSecondary,
            }}
          >
            Project
          </div>

          <div
            style={{
              marginTop: 6,
              fontSize: 18,
              fontWeight: 700,
            }}
          >
            {projectName || "-"}
          </div>
        </div>
        <div
          style={{
            border: `2px solid ${palette.border}`,
            borderRadius: 12,
            padding: 16,
            color: palette.text,
            background: palette.tableRowBg,
          }}
        >
          <div
            style={{
              fontSize: 13,
              color: palette.textSecondary,
            }}
          >
            Category
          </div>

          <div
            style={{
              marginTop: 6,
              fontSize: 18,
              fontWeight: 700,
            }}
          >
            {categoryName || "-"}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gap: 16 }}>
        {(template.sections || []).map((section, sectionIndex) => (
          <div
            key={section.id || sectionIndex}
            style={{
              border: `2px solid ${palette.border}`,
              borderRadius: 14,
              padding: 18,
              background: palette.tableRowBg,
            }}
          >
            <div
              style={{
                color: palette.text,
                fontWeight: 800,
                fontSize: 20,
              }}
            >
              {section.sequence || sectionIndex + 1}. {section.title}
            </div>

            {!!section.description && (
              <div
                style={{
                  marginTop: 8,
                  color: palette.textSecondary,
                  fontSize: 14,
                }}
              >
                {section.description}
              </div>
            )}

            <div
              style={{
                display: "grid",
                gap: 12,
                marginTop: 18,
              }}
            >
              {(section.questions || []).map((question, questionIndex) => (
                <div
                  key={question.id || questionIndex}
                  style={{
                    border: `1px solid ${palette.border}`,
                    borderRadius: 12,
                    padding: 16,
                    background: palette.card,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 16,
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          color: palette.text,
                          fontWeight: 700,
                          fontSize: 16,
                        }}
                      >
                        {question.sequence || questionIndex + 1}.{" "}
                        {question.title}
                      </div>

                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          flexWrap: "wrap",
                          marginTop: 10,
                        }}
                      >
                        {question.photo_required && (
                          <span
                            style={{
                              padding: "4px 10px",
                              borderRadius: 999,
                              background: "#7c3aed",
                              color: "#fff",
                              fontSize: 12,
                              fontWeight: 700,
                            }}
                          >
                            Photo Required
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {(question.options || []).length > 0 && (
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        flexWrap: "wrap",
                        marginTop: 14,
                      }}
                    >
                      {question.options.map((option, optionIndex) => (
                        <span
                          key={option.id || optionIndex}
                          style={{
                            padding: "6px 10px",
                            borderRadius: 999,
                            fontWeight: 700,
                            fontSize: 13,
                            background:
                              option.choice === "P" ? "#dcfce7" : "#fee2e2",
                            color:
                              option.choice === "P" ? "#166534" : "#991b1b",
                          }}
                        >
                          {option.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ManualChecklistDetails;
