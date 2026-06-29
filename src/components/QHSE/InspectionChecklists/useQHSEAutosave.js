// QHSE CHECKLIST MODULE
// Purpose: React hook for debounced local/server autosaving and unload event flush capturing.
// Orchestrates IndexedDB wrapper and Django REST framework draft synchronizations.

import { useEffect, useRef, useState } from "react";
import { 
  saveLocalDraft, 
  enqueueSyncTask, 
  getPendingSyncTasks, 
  deleteSyncTask, 
  getLocalDraft, 
  getLocalDraftBySomeId 
} from "./draftsDb";
import { upsertChecklistDraft } from "./inspectionChecklistApi";

/**
 * Process all pending sync tasks in the queue
 */
export async function processSyncQueue(setSaveStatus, setServerId, currentDraftId) {
  if (!navigator.onLine) return;
  try {
    const tasks = await getPendingSyncTasks();
    if (tasks.length === 0) {
      if (setSaveStatus) setSaveStatus("Synced");
      return;
    }

    if (setSaveStatus) setSaveStatus("Syncing...");

    for (const task of tasks) {
      try {
        let draftRecord = null;
        if (task.userId && task.draftId) {
          draftRecord = await getLocalDraft(task.userId, task.draftId);
        }
        if (!draftRecord && (task.draftId || task.id)) {
          draftRecord = await getLocalDraftBySomeId(task.draftId || task.id);
        }

        if (!draftRecord) {
          await deleteSyncTask(task.id);
          continue;
        }

        const formData = new FormData();
        if (draftRecord.serverId) {
          formData.append("serverId", draftRecord.serverId);
        }

        const cleanAppend = (key, val) => {
          if (val !== undefined && val !== null && String(val) !== "undefined" && String(val) !== "null" && String(val).trim() !== "") {
            formData.append(key, String(val));
          }
        };

        cleanAppend("safety_template_id", draftRecord.safetyTemplateId);
        cleanAppend("project_id", draftRecord.projectId);
        cleanAppend("org_id", draftRecord.orgId);
        cleanAppend("name", draftRecord.name);
        cleanAppend("draftId", draftRecord.draftId);

        formData.append("report_meta", JSON.stringify(draftRecord.reportMeta || {}));

        const submissions = (draftRecord.answers || []).map((ans) => ({
          checklist_item_id: ans.checklist_item_id,
          answer: ans.answer,
          remarks: ans.remarks,
        }));
        formData.append("submissions", JSON.stringify(submissions));

        if (Array.isArray(draftRecord.photos)) {
          draftRecord.photos.forEach((p) => {
            if (p.file) {
              formData.append(`maker_media_${p.checklist_item_id}`, p.file);
            }
          });
        }

        const res = await upsertChecklistDraft(formData);
        if (res && res.id) {
          draftRecord.serverId = res.id;
          draftRecord.isDirty = false;
          await saveLocalDraft(draftRecord);

          if (setServerId && draftRecord.draftId === currentDraftId) {
            setServerId(res.id);
          }
          await deleteSyncTask(task.id);
        }
      } catch (err) {
        console.error("Failed to process sync task:", task, err);
        if (setSaveStatus) setSaveStatus("Error syncing");
        break; // stop processing subsequent tasks to prevent spamming
      }
    }

    // Check final status
    const remaining = await getPendingSyncTasks();
    if (remaining.length === 0) {
      if (setSaveStatus) setSaveStatus("Synced");
    } else {
      if (setSaveStatus) setSaveStatus("Sync pending");
    }
  } catch (err) {
    console.error("Error in processSyncQueue:", err);
  }
}

export default function useQHSEAutosave({
  userId,
  draftId,
  serverId,
  setServerId,
  templateId,
  projectId,
  orgId,
  metadata,
  answers,
  enabled = true,
}) {
  const [saveStatus, setSaveStatus] = useState("Synced");
  const isDirtyRef = useRef(false);
  const stateRef = useRef({ serverId, metadata, answers });

  // Synchronize reference with latest state
  useEffect(() => {
    if (!enabled) return;
    stateRef.current = { serverId, metadata, answers };
    isDirtyRef.current = true;
  }, [serverId, metadata, answers, enabled]);

  // Persists draft data locally to IndexedDB
  const saveToLocal = async () => {
    if (!enabled || !userId || !draftId) return;
    const { serverId: currentServerId, metadata: currentMeta, answers: currentAnswers } = stateRef.current;

    let existing = null;
    try {
      existing = await getLocalDraft(userId, draftId);
    } catch (e) {
      console.warn("Error reading existing local draft:", e);
    }

    // Preserve safetyTemplateId, projectId, and orgId, and fall back to localStorage resolutions
    const fallbackTemplateId = templateId || existing?.safetyTemplateId;

    const fallbackProjectId = projectId || existing?.projectId || (() => {
      try {
        const pid = localStorage.getItem("ACTIVE_PROJECT_ID");
        if (pid) return pid;
        const accRaw = localStorage.getItem("ACCESSES");
        if (accRaw) {
          const accs = JSON.parse(accRaw);
          if (Array.isArray(accs) && accs.length > 0) return String(accs[0].project_id);
        }
        return null;
      } catch { return null; }
    })();

    const fallbackOrgId = orgId || existing?.orgId || (() => {
      try {
        const user =
          JSON.parse(localStorage.getItem("USER_DATA") || "null") ||
          JSON.parse(localStorage.getItem("userData") || "null");
        return (
          user?.org || user?.organization_id || user?.org_id ||
          localStorage.getItem("ORG_ID") || localStorage.getItem("ACTIVE_ORG_ID") || null
        );
      } catch { return null; }
    })();

    const cleanAnswers = Object.entries(currentAnswers).map(([itemId, val]) => ({
      checklist_item_id: isNaN(Number(itemId)) ? itemId : Number(itemId),
      answer: val.answer,
      remarks: val.remarks,
    }));

    const photos = Object.entries(currentAnswers)
      .filter(([_, val]) => val.photo)
      .map(([itemId, val]) => ({
        checklist_item_id: isNaN(Number(itemId)) ? itemId : Number(itemId),
        file: val.photo,
        fileName: val.photo.name,
      }));

    const draftRecord = {
      id: `${userId}_${draftId}`,
      userId,
      draftId,
      serverId: currentServerId || existing?.serverId || null,
      safetyTemplateId: fallbackTemplateId,
      projectId: fallbackProjectId,
      orgId: fallbackOrgId,
      name: currentMeta.name || existing?.name || "Draft Checklist",
      buildingId: currentMeta.buildingId || existing?.buildingId,
      zoneId: currentMeta.zoneId || existing?.zoneId,
      roomId: currentMeta.roomId || existing?.roomId,
      flatId: currentMeta.flatId || existing?.flatId,
      reportMeta: {
        location: currentMeta.location,
        name_of_contractor: currentMeta.contractor,
        make_model: currentMeta.machineNo,
        date_of_inspection: currentMeta.date,
      },
      answers: cleanAnswers,
      photos,
      updatedAt: Date.now(),
      isDirty: true,
    };

    try {
      await saveLocalDraft(draftRecord);
      await enqueueSyncTask(userId, draftId);
      setSaveStatus("Saved locally");
      
      if (navigator.onLine) {
        await processSyncQueue(setSaveStatus, setServerId, draftId);
      } else {
        setSaveStatus("Sync pending");
      }
    } catch (err) {
      console.error("IndexedDB save failed:", err);
    }
  };

  // Syncs local IndexedDB state with server database
  const syncToServer = async () => {
    if (!enabled || !navigator.onLine) return;
    await processSyncQueue(setSaveStatus, setServerId, draftId);
  };

  // Local Save debounced timer (1 second)
  useEffect(() => {
    if (!enabled) return;
    const timer = setTimeout(() => {
      if (isDirtyRef.current) {
        saveToLocal();
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [metadata, answers, enabled]);

  // Mount effect: check queue status and trigger sync
  useEffect(() => {
    if (!enabled) return;
    const checkQueue = async () => {
      const tasks = await getPendingSyncTasks();
      if (tasks.length > 0) {
        setSaveStatus("Sync pending");
      } else {
        setSaveStatus("Synced");
      }
    };
    checkQueue();
    processSyncQueue(setSaveStatus, setServerId, draftId);
  }, [enabled, draftId]);

  // Online event effect
  useEffect(() => {
    if (!enabled) return;
    const handleOnline = () => {
      processSyncQueue(setSaveStatus, setServerId, draftId);
    };
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("online", handleOnline);
    };
  }, [enabled, draftId]);

  // Server Sync debounced timer (10 seconds interval when dirty)
  useEffect(() => {
    if (!enabled) return;
    const interval = setInterval(() => {
      if (isDirtyRef.current) {
        saveToLocal().then(() => {
          isDirtyRef.current = false;
        });
      } else {
        processSyncQueue(setSaveStatus, setServerId, draftId);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [enabled, draftId]);

  // Unload event capturing (Visibility change and beforeunload)
  useEffect(() => {
    if (!enabled) return;
    const flushData = () => {
      if (!isDirtyRef.current) return;
      saveToLocal();

      // Attempt exit-flush background request if browser allows
      const { serverId: currentServerId, metadata: currentMeta, answers: currentAnswers } = stateRef.current;
      const formData = new FormData();
      if (currentServerId) {
        formData.append("serverId", currentServerId);
      }
      formData.append("safety_template_id", templateId);
      formData.append("project_id", projectId);
      formData.append("org_id", orgId);
      formData.append("name", currentMeta.name || "Draft Checklist");
      
      const reportMeta = {
        location: currentMeta.location,
        name_of_contractor: currentMeta.contractor,
        make_model: currentMeta.machineNo,
        date_of_inspection: currentMeta.date,
      };
      formData.append("report_meta", JSON.stringify(reportMeta));

      const submissions = Object.entries(currentAnswers).map(([itemId, val]) => ({
        checklist_item_id: parseInt(itemId),
        answer: val.answer,
        remarks: val.remarks,
      }));
      formData.append("submissions", JSON.stringify(submissions));

      const token = localStorage.getItem("ACCESS_TOKEN") || localStorage.getItem("token");
      const headers = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      fetch(`/api/safety/checklists/draft_upsert/`, {
        method: "POST",
        body: formData,
        headers,
        keepalive: true,
      }).catch((err) => console.warn("Exit flush failed:", err));
    };

    const handleBeforeUnload = () => {
      flushData();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        flushData();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [templateId, projectId, orgId, enabled]);

  return { saveStatus, forceSync: syncToServer };
}
