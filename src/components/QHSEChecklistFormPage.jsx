// src/components/QHSEChecklistFormPage.jsx

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTheme } from "../ThemeContext";
import InspectionChecklistInstanceForm from "./QHSE/InspectionChecklists/InspectionChecklistInstanceForm";
import { fetchChecklistInstanceDetail } from "./QHSE/InspectionChecklists/inspectionChecklistApi";

const BG_OFFWHITE = "#fcfaf7";

export default function QHSEChecklistFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  
  const bgColor = theme === "dark" ? "#191922" : BG_OFFWHITE;
  
  // Try to get orgId from localStorage ACTIVE_PROJECT_ID -> matching project -> orgId
  // The form component handles missing orgId somewhat gracefully, but better to pass if we can.
  // We can pass null and let the API or the form component handle it if it just relies on the instance ID.
  const orgId = null; 

  const [mode, setMode] = useState(null);

  useEffect(() => {
    async function init() {
      if (String(id).startsWith("local_")) {
        const localDraftId = id.replace("local_", "");
        navigate(`/checklists/create?draftId=${localDraftId}`, { replace: true });
        return;
      }
      try {
        const inst = await fetchChecklistInstanceDetail(id, orgId);
        
        // Determine mode based on status
        const status = (inst.status || "").toLowerCase();
        
        if (status === "draft") {
          navigate(`/checklists/create?serverId=${id}`, { replace: true });
          return;
        }
        
        if (status === "completed" || status === "approved") {
          setMode("view");
        } else if (status === "pending_checker" || status === "pending_supervisor") {
          setMode("review");
        } else {
          setMode("fill"); // fallback to fill for in_progress, rework
        }
      } catch (err) {
        console.error(err);
        setMode("view"); // safe fallback
      }
    }
    init();
  }, [id, navigate]);

  const handleBack = () => {
    navigate(-1); // go back to wherever they came from (Dashboard or Inbox)
  };

  return (
    <div style={{ background: bgColor, minHeight: "100vh", paddingTop: "80px", paddingBottom: "40px" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 20px" }}>
        {mode ? (
          <InspectionChecklistInstanceForm
            mode={mode}
            instanceId={String(id).startsWith("local_") ? null : id}
            draftId={String(id).startsWith("local_") ? id.replace("local_", "") : null}
            orgId={orgId}
            onBack={handleBack}
            onCompleted={handleBack}
          />
        ) : (
          <div style={{ padding: 40, textAlign: "center" }}>Loading checklist...</div>
        )}
      </div>
    </div>
  );
}
