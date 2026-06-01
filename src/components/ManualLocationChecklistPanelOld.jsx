import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getManualChecklistTemplates,
  getManualChecklistTemplateById,
  createManualChecklist,
} from "../api/manualChecklistApi";

import {
  getAssignedProjects,
  getPurposeByProjectId,
  getUsersWithRoles,
} from "../api/index";
export default function ManualLocationChecklistPanel() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [templateDetails, setTemplateDetails] = useState(null);

  const [location, setLocation] = useState("");
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [answers, setAnswers] = useState({});

  const [purposes, setPurposes] = useState([]);
  const [selectedPurpose, setSelectedPurpose] = useState("");
  const [users, setUsers] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);

  // =====================================================
  // FETCH INITIAL DATA
  // =====================================================

  useEffect(() => {
    if (selectedProject) {
      fetchTemplates();
    }
  }, [selectedProject]);
  // =====================================================
  // FETCH TEMPLATES
  // =====================================================

  const fetchTemplates = async () => {
    try {
      const res = await getManualChecklistTemplates(Number(selectedProject));

      setTemplates(res.data?.results || res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAssignedProjects();
  }, []);

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

  const fetchPurposes = async (projectId) => {
    try {
      const res = await getPurposeByProjectId(projectId);

      const data = res.data || [];

      setPurposes(data);

      // AUTO SELECT FIRST PURPOSE
      if (data.length > 0) {
        setSelectedPurpose(data[0].name.purpose.id);
      } else {
        setSelectedPurpose("");
      }
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
  // =====================================================
  // FETCH TEMPLATE DETAILS
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
  // HANDLE ANSWERS
  // =====================================================

  const handleAnswerChange = (key, value) => {
    setAnswers((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // =====================================================
  // VALIDATION
  // =====================================================

  const validateQuestions = () => {
    if (!selectedTemplate) {
      alert("Please select checklist template");
      return false;
    }

    if (!selectedProject) {
      alert("Please select project");
      return false;
    }

    if (!location) {
      alert("Please enter location");
      return false;
    }

    let atleastOneAnswered = false;

    for (const section of templateDetails?.sections || []) {
      for (const question of section.questions || []) {
        const answer = answers[question.id];

        if (answer) {
          atleastOneAnswered = true;

          if (question.photo_required && !answers[`photo_${question.id}`]) {
            alert(`Photo required for: ${question.title}`);
            return false;
          }
        }
      }
    }

    if (!atleastOneAnswered) {
      alert("Please answer at least one question");
      return false;
    }

    return true;
  };

  // =====================================================
  // CREATE CHECKLIST
  // =====================================================

  // const handleCreateChecklist = async () => {
  //   try {
  //     const isValid = validateQuestions();

  //     if (!isValid) return;

  //     const formattedAnswers = [];

  //     templateDetails?.sections?.forEach((section) => {
  //       section.questions?.forEach((question) => {
  //         formattedAnswers.push({
  //           question: question.id,
  //           answer: answers[question.id],
  //           remark: answers[`remark_${question.id}`] || "",
  //           photo: answers[`photo_${question.id}`] || null,
  //         });
  //       });
  //     });

  //     const formData = new FormData();

  //     formData.append("template", selectedTemplate);
  //     formData.append("project_id", selectedProject);
  //     formData.append("purpose_id", selectedPurpose);
  //     formData.append("location_text", location);

  //     console.log("PAYLOAD", payload);

  //     const res = await createManualChecklist(payload);

  //     console.log("CHECKLIST CREATED", res.data);

  //     alert("Checklist created successfully");

  //     // navigate(`/manual-checklists/${res.data.id}`);
  //   } catch (err) {
  //     console.error(err);
  //     alert("Failed to create checklist");
  //   }
  // };
  const handleCreateChecklist = async () => {
    try {
      const isValid = validateQuestions();

      if (!isValid) return;

      const formattedAnswers = [];

      templateDetails?.sections?.forEach((section) => {
        section.questions?.forEach((question) => {
          const answer = answers[question.id];

          // ONLY SEND ANSWERED QUESTIONS
          if (!answer) return;

          formattedAnswers.push({
            question: question.id,

            answer: answer,

            remark: answers[`remark_${question.id}`] || "",

            photo: answers[`photo_${question.id}`] || null,

            assign_to_user_id: selectedAssignment?.user_id || "",

            assign_to_role: selectedAssignment?.role || "",
          });
        });
      });

      const formData = new FormData();

      formData.append("template", selectedTemplate);

      formData.append("project_id", selectedProject);

      formData.append("purpose_id", selectedPurpose);

      formData.append("location_text", location);

      formattedAnswers.forEach((answer, index) => {
        formData.append(`answers[${index}][question]`, answer.question);

        formData.append(`answers[${index}][answer]`, answer.answer);

        formData.append(`answers[${index}][remark]`, answer.remark || "");

        if (answer.photo) {
          formData.append(`answers[${index}][photo]`, answer.photo);
        }

        if (answer.assign_to_user_id) {
          formData.append(
            `answers[${index}][assign_to_user_id]`,
            answer.assign_to_user_id,
          );
        }

        if (answer.assign_to_role) {
          formData.append(
            `answers[${index}][assign_to_role]`,
            answer.assign_to_role,
          );
        }
      });

      const res = await createManualChecklist(formData);

      console.log("CHECKLIST CREATED", res.data);

      alert("Checklist created successfully");

      navigate("/manual-checklists");
    } catch (err) {
      console.error(err);

      console.log(err?.response?.data);

      alert("Failed to create checklist");
    }
  };

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
      <div className="mx-auto max-w-6xl space-y-5">
        {/* ===================================================== */}
        {/* HEADER */}
        {/* ===================================================== */}

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

        {/* ===================================================== */}
        {/* CONFIGURATION */}
        {/* ===================================================== */}

        <div className="rounded-3xl border border-[#eadcc8] bg-[#f7efe3] p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* TEMPLATE */}
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

                  fetchPurposes(projectId);
                  fetchUsers(projectId);
                  setSelectedAssignment(null);
                  setSelectedTemplate("");
                  setTemplateDetails(null);
                  setSelectedPurpose("");
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

            <div>
              <label className="mb-2 block text-sm font-medium text-[#6b533d]">
                Assign User
              </label>

              <select
                value={
                  selectedAssignment
                    ? `${selectedAssignment.user_id}-${selectedAssignment.role}`
                    : ""
                }
                onChange={(e) => {
                  const selected = uniqueUserRoles.find(
                    (user) => `${user.user_id}-${user.role}` === e.target.value,
                  );

                  setSelectedAssignment(selected || null);
                }}
                className="w-full rounded-xl border border-[#e1d1bd] bg-[#fffaf4] px-4 py-3 text-sm outline-none"
              >
                <option value="">Select User</option>
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

            <button
              onClick={handleCreateChecklist}
              className="rounded-xl border border-[#d8c2a5] bg-[#f3e2c9] px-5 py-2 text-sm font-medium text-[#6b533d] hover:bg-[#ecd5b4] transition"
            >
              Create
            </button>
          </div>
        </div>

        {/* ===================================================== */}
        {/* QUESTIONS */}
        {/* ===================================================== */}

        {templateDetails?.sections?.length > 0 && (
          <div className="space-y-5">
            {templateDetails.sections.map((section, sectionIndex) => (
              <div
                key={section.id}
                className="rounded-3xl border border-[#eadcc8] bg-[#f7efe3] p-5"
              >
                {/* SECTION HEADER */}

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

                {/* QUESTIONS */}

                <div className="space-y-4">
                  {section.questions?.map((question, index) => (
                    <div
                      key={question.id}
                      className="rounded-2xl border border-[#eadcc8] bg-[#fffaf4] p-5"
                    >
                      {/* QUESTION HEADER */}

                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-sm font-semibold text-[#4b3b2a]">
                            {question.title}
                          </h3>
                        </div>
                      </div>

                      {/* ANSWERS */}

                      <div className="mt-5">
                        {/* OPTIONS */}

                        {question.options?.length > 0 && (
                          <div className="flex flex-wrap gap-3">
                            {question.options.map((option) => (
                              <label
                                key={option.id}
                                className={`cursor-pointer rounded-xl border px-4 py-2 text-sm font-medium transition ${
                                  answers[question.id] === option.id
                                    ? option.choice === "P"
                                      ? "border-green-300 bg-green-100 text-green-700"
                                      : "border-red-300 bg-red-100 text-red-700"
                                    : "border-[#e1d1bd] bg-[#fffaf4] text-[#6b533d]"
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={`question-${question.id}`}
                                  value={option.id}
                                  onChange={(e) =>
                                    handleAnswerChange(
                                      question.id,
                                      e.target.value,
                                    )
                                  }
                                  className="hidden"
                                />

                                {option.name}
                              </label>
                            ))}
                          </div>
                        )}

                        {/* TEXT */}

                        {question.options?.length === 0 && (
                          <textarea
                            rows={3}
                            value={answers[question.id] || ""}
                            onChange={(e) =>
                              handleAnswerChange(question.id, e.target.value)
                            }
                            placeholder="Add your answer..."
                            className="mt-4 w-full rounded-xl border border-[#e1d1bd] bg-[#fffaf4] px-4 py-3 text-sm outline-none"
                          />
                        )}

                        {/* PHOTO */}

                        {question.photo_required && (
                          <div className="mt-4">
                            <label className="mb-2 block text-sm font-medium text-[#6b533d]">
                              Upload Photo
                            </label>

                            <input
                              type="file"
                              onChange={(e) =>
                                handleAnswerChange(
                                  `photo_${question.id}`,
                                  e.target.files[0],
                                )
                              }
                              className="block w-full text-sm text-[#6b533d]"
                            />
                          </div>
                        )}

                        {/* REMARKS */}

                        <div className="mt-4">
                          <textarea
                            rows={3}
                            value={answers[`remark_${question.id}`] || ""}
                            onChange={(e) =>
                              handleAnswerChange(
                                `remark_${question.id}`,
                                e.target.value,
                              )
                            }
                            placeholder="Add remarks..."
                            className="w-full rounded-xl border border-[#e1d1bd] bg-[#fffaf4] px-4 py-3 text-sm outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
