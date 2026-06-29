/*
---
QHSE MIGRATION NOTE
File: InspectionChecklistManager.jsx

Purpose: React container component that orchestrates Folder 22 state, switching between Checklist Library, Template Form, and Instance Flow.

Workflow:
Folder 22

Service:
QHSEMicroService (8004)

Migration Reason: Orchestrates the migration boundary, ensuring Folder 22 utilizes the new inspectionChecklistApi.js layer exclusively.

Related Files: inspectionChecklistApi.js
----------------------------------------
*/
// QHSE CHECKLIST MODULE
// Purpose:
// Top-level orchestrator for the QHSE Checklist Library tab inside a QHSE folder.
// Manages internal view state: list → create/edit template → fill/review instance.
// Handles checklist instance initialisation (creating a live inspection from a template).
// Screen: QHSE Documents page, folder view – Checklist Library tab.
import React, { useState, useCallback } from "react";
import InspectionChecklistList from "./InspectionChecklistList";
import InspectionChecklistForm from "./InspectionChecklistForm";
import InspectionChecklistRegister from "./InspectionChecklistRegister";
import InspectionChecklistInstanceForm from "./InspectionChecklistInstanceForm";
import { createChecklistInstance } from "./inspectionChecklistApi";
import { Layers, ClipboardList, CheckSquare } from "lucide-react";
import toast from "react-hot-toast";

export default function InspectionChecklistManager({ folderId, projectId, orgId }) {
  const [activeTab, setActiveTab] = useState("library"); // 'library' | 'register' | 'tasks'
  const [view, setView] = useState("list"); // 'list' | 'create' | 'edit' | 'fill' | 'review' | 'view'
  const [listKey, setListKey] = useState(0); // bump to force re-fetch
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [selectedInstance, setSelectedInstance] = useState(null);

  // Read orgId from localStorage if not passed
  const resolvedOrgId = orgId || (() => {
    try {
      const user =
        JSON.parse(localStorage.getItem("USER_DATA") || "null") ||
        JSON.parse(localStorage.getItem("userData") || "null");
      return (
        user?.org ||
        user?.organization_id ||
        user?.org_id ||
        localStorage.getItem("ORG_ID") ||
        localStorage.getItem("ACTIVE_ORG_ID") ||
        null
      );
    } catch {
      return null;
    }
  })();

  const handleCreated = useCallback(() => {
    setListKey((k) => k + 1);
    setView("list");
  }, []);

  const handleStartInspection = async (template) => {
    const loadingToast = toast.loading("Initializing inspection instance...");
    try {
      const title = `${template.title} - ${new Date().toLocaleDateString()}`;

      // Retrieve current logged-in user from localStorage to populate fallback assignments
      const user = (() => {
        try {
          return (
            JSON.parse(localStorage.getItem("USER_DATA") || "null") ||
            JSON.parse(localStorage.getItem("userData") || "null")
          );
        } catch {
          return null;
        }
      })();
      const currentUserId = user?.id || user?.user_id || null;
      const currentUserName = user?.name || user?.first_name || user?.username || "Maker";

      const movement_assignments = [
        {
          order_index: 1,
          role: "MAKER",
          user_id: currentUserId ? Number(currentUserId) : null,
          user_name: currentUserName,
        },
        {
          order_index: 2,
          role: "CHECKER",
          user_id: null,
          user_name: "Safety Officer Pool",
        },
        {
          order_index: 3,
          role: "SUPERVISOR",
          user_id: null,
          user_name: "PMC / 3rd Party Supervisor Pool",
        },
      ];

      const inst = await createChecklistInstance({
        templateId: template.id,
        projectId,
        orgId: resolvedOrgId,
        title,
        movement_assignments,
      });
      setSelectedInstance(inst);
      setView("fill");
      toast.success("Inspection checklist created!", { id: loadingToast });
    } catch (err) {
      console.error(err);
      toast.error("Failed to initialize inspection checklist.", { id: loadingToast });
    }
  };

  const handleBackToRegister = () => {
    setView("list");
    setListKey((k) => k + 1);
  };

  return (
    <div className="w-full space-y-6">
      {/* ── Tabbed UI Header ── */}
      {view === "list" && (
        <div className="flex border-b border-gray-200 bg-white rounded-t-xl px-4 pt-3 gap-6">
          <button
            onClick={() => setActiveTab("library")}
            className={`flex items-center gap-2 pb-3 text-sm font-semibold border-b-2 transition-all border-orange-500 text-orange-600 font-bold`}
          >
            <Layers className="w-4 h-4" />
            Checklist Library
          </button>
        </div>
      )}

      {/* ── Content View Router ── */}
      <div className="bg-white rounded-b-xl px-4 pt-5 pb-4">
        {view === "list" && activeTab === "library" && (
          <InspectionChecklistList
            key={listKey}
            folderId={folderId}
            projectId={projectId}
            orgId={resolvedOrgId}
            onCreateClick={() => {
              setEditingTemplate(null);
              setView("create");
            }}
            onEditClick={(template) => {
              setEditingTemplate(template);
              setView("edit");
            }}
            onStartInspection={handleStartInspection}
          />
        )}

        {/* Inspection Register & Reviews have been moved to the top-level QHSE Checklists Dashboard */}

        {(view === "create" || view === "edit") && (
          <InspectionChecklistForm
            initialData={editingTemplate}
            folderId={folderId}
            projectId={projectId}
            orgId={resolvedOrgId}
            onBack={() => setView("list")}
            onCreated={handleCreated}
          />
        )}

        {(view === "fill" || view === "review" || view === "view") && (
          <InspectionChecklistInstanceForm
            mode={view}
            templateId={selectedInstance?.safety_template_id}
            instanceId={selectedInstance?.id}
            projectId={projectId}
            orgId={resolvedOrgId}
            onBack={handleBackToRegister}
            onCompleted={handleBackToRegister}
          />
        )}
      </div>
    </div>
  );
}
