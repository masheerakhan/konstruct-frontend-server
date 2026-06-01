import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  getManualChecklistList,
  deleteManualChecklist,
  downloadManualChecklistReport,
  getManualTemplateList,
} from "../api/manualChecklistApi";

import { getAssignedProjects, getUsersWithRoles } from "../api/index";

export default function ManualLocationChecklistView({ onOpenChecklist }) {
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);

  const [selectedProject, setSelectedProject] = useState("");

  const [projectRoles, setProjectRoles] = useState([]);

  const [selectedRole, setSelectedRole] = useState("");

  const [selectedStatus, setSelectedStatus] = useState("");

  const [templates, setTemplates] = useState([]);

  const [selectedTemplate, setSelectedTemplate] = useState("");

  const [createdChecklists, setCreatedChecklists] = useState([]);
  // =====================================================
  // FETCH PROJECTS
  // =====================================================

  useEffect(() => {
    fetchAssignedProjects();
  }, []);

 useEffect(() => {
   if (selectedProject && selectedRole) {
     fetchCreatedChecklists();
   }
 }, [selectedProject, selectedRole, selectedStatus, selectedTemplate]);

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

  // =====================================================
  // FETCH MY ROLES IN PROJECT
  // =====================================================

  const fetchMyProjectRoles = async (projectId) => {
    try {
      const res = await getUsersWithRoles(projectId);

      const userData = JSON.parse(localStorage.getItem("USER_DATA"));

      const currentUser = (res.data || []).find(
        (user) => user.user_id === userData.id,
      );

      if (currentUser) {
        setProjectRoles(currentUser.roles || []);
      } else {
        setProjectRoles([]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // =====================================================
  // FETCH CHECKLISTS
  // =====================================================

  const fetchCreatedChecklists = async () => {
    try {
      const res = await getManualChecklistList(
  selectedRole,
  {
    project_id: selectedProject,
    status: selectedStatus,
    template_id: selectedTemplate,
  }
);

      setCreatedChecklists(res.data?.results || res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTemplates = async (projectId) => {
    try {
      const res = await getManualTemplateList(Number(projectId));

      setTemplates(res.data?.results || res.data || []);
    } catch (err) {
      console.error(err);
      setTemplates([]);
    }
  };

  const handleDeleteChecklist = async (checklistId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this checklist?",
    );

    if (!confirmed) return;

    try {
      await deleteManualChecklist(checklistId);

      fetchCreatedChecklists();
    } catch (err) {
      console.error(err);

      alert("Failed to delete checklist.");
    }
  };

  const handleDownloadReport = async (checklistId) => {
    try {
      const response = await downloadManualChecklistReport(
        checklistId,
        selectedRole,
      );

      const blob = new Blob([response.data], {
        type: "application/pdf",
      });

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = url;
      link.download = `manual-checklist-${checklistId}.pdf`;

      document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Failed to download report");
    }
  };

  // =====================================================
  // FILTERED CHECKLISTS
  // =====================================================

  return (
    <div className="space-y-6 mt-5">
      {/* ===================================================== */}
      {/* HEADER */}
      {/* ===================================================== */}

      <div className="rounded-3xl border border-[#eadcc8] bg-[#f7efe3] p-6">
        <div>
          <h1 className="text-2xl font-semibold text-[#4b3b2a]">
            My Assigned Checklists
          </h1>

          <p className="mt-2 text-sm text-[#8b7765]">
            View and manage checklist workflows.
          </p>
        </div>
      </div>

      {/* ===================================================== */}
      {/* FILTERS */}
      {/* ===================================================== */}

      <div className="rounded-3xl border border-[#eadcc8] bg-[#f7efe3] p-6">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-4">
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

                setSelectedRole("");

                setSelectedStatus("");

                setSelectedTemplate("");

                fetchMyProjectRoles(projectId);

                fetchTemplates(projectId);
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

          {/* ROLE */}

          <div>
            <label className="mb-2 block text-sm font-medium text-[#6b533d]">
              Role
            </label>

            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full rounded-xl border border-[#e1d1bd] bg-[#fffaf4] px-4 py-3 text-sm outline-none"
            >
              <option value="">Select role</option>

              {projectRoles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[#6b533d]">
              Template
            </label>

            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              className="w-full rounded-xl border border-[#e1d1bd] bg-[#fffaf4] px-4 py-3 text-sm outline-none"
            >
              <option value="">All Templates</option>

              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[#6b533d]">
              Status
            </label>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full rounded-xl border border-[#e1d1bd] bg-[#fffaf4] px-4 py-3 text-sm outline-none"
            >
              <option value="">All Statuses</option>

              <option value="open">Open</option>

              <option value="in_progress">In Progress</option>

              <option value="completed">Completed</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setSelectedStatus("");
                setSelectedTemplate("");
              }}
              className="w-full rounded-xl border border-[#d8c2a5] bg-[#f3e2c9] px-5 py-3 text-sm font-medium text-[#6b533d] transition hover:bg-[#ecd5b4]"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* ===================================================== */}
      {/* CHECKLISTS */}
      {/* ===================================================== */}

      <div className="rounded-3xl border border-[#eadcc8] bg-[#f7efe3] p-6">
        <div className="mb-5">
          <h2 className="text-xl font-semibold text-[#4b3b2a]">
            Manual Checklists
          </h2>

          <p className="mt-1 text-sm text-[#8b7765]">
            Checklist workflows for selected project.
          </p>
        </div>

        {createdChecklists.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#d8c2a5] bg-[#fffaf4] p-10 text-center text-sm text-[#8b7765]">
            No checklists found.
          </div>
        ) : (
          <div className="space-y-4">
            {createdChecklists.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-[#eadcc8] bg-[#fffaf4] p-5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-[#4b3b2a]">
                      #{item.id} {item.template_name}
                    </h3>

                    <div className="flex flex-wrap gap-2 text-sm text-[#8b7765]">
                      <span>
                        Project: {item.project_name || item.project_id}
                      </span>

                      <span>•</span>

                      <span>Location: {item.location_text}</span>

                      <span>•</span>
                      <span>Status: {item.status}</span>

                      <span>•</span>

                      <span>{item.location_text}</span>
                    </div>
                  </div>

                  {/* <button
                    onClick={() =>
                      onOpenChecklist({
                        checklistId: item.id,
                        role: selectedRole,
                      })
                    }
                    className="rounded-xl border border-[#d8c2a5] bg-[#f3e2c9] px-5 py-2 text-sm font-medium text-[#6b533d] transition hover:bg-[#ecd5b4]"
                  >
                    Open Checklist
                  </button> */}
                  <div className="flex gap-3">
                    <button
                      onClick={() =>
                        onOpenChecklist({
                          checklistId: item.id,
                          role: selectedRole,
                        })
                      }
                      className="rounded-xl border border-[#d8c2a5] bg-[#f3e2c9] px-5 py-2 text-sm font-medium text-[#6b533d] transition hover:bg-[#ecd5b4]"
                    >
                      Open Checklist
                    </button>

                    <button
                      onClick={() => handleDownloadReport(item.id)}
                      className="rounded-xl border border-green-200 bg-green-100 px-5 py-2 text-sm font-medium text-green-700 transition hover:bg-green-200"
                    >
                      Download Report
                    </button>

                    {/* <button
                      onClick={() => handleDeleteChecklist(item.id)}
                      className="rounded-xl border border-red-200 bg-red-100 px-5 py-2 text-sm font-medium text-red-700 transition hover:bg-red-200"
                    >
                      Delete
                    </button> */}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
