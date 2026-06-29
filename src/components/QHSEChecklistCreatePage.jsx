/*
---
QHSE MIGRATION NOTE
File: QHSEChecklistCreatePage.jsx

Purpose: React component acting as the main Maker UI for filling out and submitting an Inspection Checklist Instance.

Workflow:
Checklist Creation / Maker Review

Service:
QHSEMicroService (8004)

Migration Reason: Modified to use the new inspectionChecklistApi.js and qhseInstance ensuring checklist payload correctly targets the 8004 isolated port.

Related Files: inspectionChecklistApi.js, InspectionChecklistManager.jsx
----------------------------------------
*/
// src/components/QHSEChecklistCreatePage.jsx
// PURPOSE: Full-page checklist creation for the Maker role.
// When Maker clicks "+ Create Checklist" on the dashboard, this page loads.
// Step 1: Pick a template from ALL available templates (no project filter).
// Step 2: Full checklist form appears inline with all questions from that template.

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  fetchInspectionChecklists,
  fetchInspectionChecklistDetail,
  fetchChecklistInstanceDetail,
  createChecklistInstance,
  submitChecklistInstance,
} from "./QHSE/InspectionChecklists/inspectionChecklistApi";
import { getUsersByProject } from "../api";
import { useTheme } from "../ThemeContext";
import SignatureCanvas from "react-signature-canvas";
import { getMediaUrl } from "./QHSE/InspectionChecklists/qhsePdfGenerator";
import { deleteLocalDraft } from "./QHSE/InspectionChecklists/draftsDb";
import useQHSEAutosave from "./QHSE/InspectionChecklists/useQHSEAutosave";
import useFormValidationUX from "./QHSE/InspectionChecklists/useFormValidationUX";

const ORANGE = "#ffbe63";
const BG_OFFWHITE = "#fcfaf7";

export default function QHSEChecklistCreatePage() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const sigCanvasRef = useRef(null);

  const locationRef = useRef(null);
  const contractorRef = useRef(null);
  const machineNoRef = useRef(null);
  const reviewerRef = useRef(null);
  const signatureRef = useRef(null);
  const questionRefs = useRef({});

  const [hasSignature, setHasSignature] = useState(false);

  // Resolve current user from localStorage
  const currentUser = (() => {
    try {
      return (
        JSON.parse(localStorage.getItem("USER_DATA") || "null") ||
        JSON.parse(localStorage.getItem("userData") || "null")
      );
    } catch { return null; }
  })();

  const generateUUID = () => {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  const [draftId, setDraftId] = useState(() => {
    const query = new URLSearchParams(window.location.search);
    return query.get("draftId") || generateUUID();
  });
  const [serverId, setServerId] = useState(() => {
    const query = new URLSearchParams(window.location.search);
    const sId = query.get("serverId");
    return sId && sId !== "null" && sId !== "undefined" ? sId : null;
  });

  // Template selection
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");

  // Full form state (once template is selected)
  const [template, setTemplate] = useState(null);
  const [loadingForm, setLoadingForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Answers: { [questionId]: { answer, remarks, photo, previewUrl } }
  const [answers, setAnswers] = useState({});

  // Header meta
  const [location, setLocation] = useState("");
  const [contractor, setContractor] = useState("");
  const [machineNo, setMachineNo] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  // Reviewer assignment
  const [users, setUsers] = useState([]);
  const [selectedReviewerId, setSelectedReviewerId] = useState("");

  const contractorOptions = ["L&T", "Horizon Construction", "Sterling & Wilson", "PMC Engineering", "Tata Projects"];

  const bgColor = theme === "dark" ? "#191922" : BG_OFFWHITE;

  // Resolve orgId from localStorage
  const resolvedOrgId = (() => {
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

  // Resolve projectId from localStorage
  const resolvedProjectId = (() => {
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

  const autosave = useQHSEAutosave({
    userId: currentUser?.id,
    draftId,
    serverId,
    setServerId,
    templateId: selectedTemplateId,
    projectId: resolvedProjectId,
    orgId: resolvedOrgId,
    metadata: {
      name: `${template?.title || "Draft Checklist"} - ${date}`,
      location,
      contractor,
      machineNo,
      date,
    },
    answers,
    enabled: !!selectedTemplateId && !loadingForm && !submitting,
  });

  const getUserRoles = (u) => {
    if (Array.isArray(u.roles)) {
      return u.roles.map(r => r.toUpperCase());
    }
    if (typeof u.role === 'string') {
      return [u.role.toUpperCase()];
    }
    if (Array.isArray(u.accesses)) {
      const roles = [];
      u.accesses.forEach(acc => {
        if (Array.isArray(acc.roles)) {
          acc.roles.forEach(r => {
            if (r.role) roles.push(r.role.toUpperCase());
          });
        }
      });
      return roles;
    }
    return [];
  };

  const validationFields = [
    { key: "location", label: "Location", isValid: !!location.trim(), ref: locationRef },
    { key: "contractor", label: "Contractor", isValid: !!contractor, ref: contractorRef },
    { key: "machineNo", label: "Machine / Identification No.", isValid: !!machineNo.trim(), ref: machineNoRef },
    ...(template?.questions || []).map((q, idx) => ({
      key: `question_${q.id}`,
      label: `Question ${idx + 1}`,
      isValid: !!answers[q.id]?.answer && (!q.photo_required || !!answers[q.id]?.photo || !!answers[q.id]?.previewUrl),
      ref: { current: questionRefs.current[q.id] }
    })),
    { key: "reviewer", label: "Checker", isValid: !!selectedReviewerId, ref: reviewerRef },
    { key: "signature", label: "Maker Signature", isValid: hasSignature, ref: signatureRef }
  ];

  const { isFormComplete, handleBlockedSubmit } = useFormValidationUX(validationFields);

  const checkersFiltered = users.filter(u => getUserRoles(u).includes("CHECKER"));
  const checkersList = checkersFiltered.length > 0 ? checkersFiltered : users;

  // ─── Step 1: Load ALL templates (no project filter) ───
  useEffect(() => {
    async function load() {
      setLoadingTemplates(true);
      try {
        // Fetch templates WITHOUT project_id so ALL templates appear
        const res = await fetchInspectionChecklists({ orgId: resolvedOrgId });
        setTemplates(res);

        // Fetch project-specific users for the checker dropdown
        if (resolvedProjectId) {
          try {
            const usersRes = await getUsersByProject(resolvedProjectId);
            const usersList = usersRes?.data?.results ?? usersRes?.data ?? [];
            setUsers(Array.isArray(usersList) ? usersList : []);
          } catch (ue) {
            console.error("Failed to load project users", ue);
            setUsers([]);
          }
        }
      } catch (err) {
        console.error("Failed to load templates", err);
        toast.error("Failed to load templates");
      } finally {
        setLoadingTemplates(false);
      }
    }
    load();
  }, [resolvedOrgId]);

  // ─── Step 1b: Resume draft logic if draftId/serverId is in URL ───
  useEffect(() => {
    async function resumeDraft() {
      const query = new URLSearchParams(window.location.search);
      const paramDraftId = query.get("draftId");
      const paramServerId = query.get("serverId");
      
      if (!paramDraftId && !paramServerId) return;
      
      setLoadingForm(true);
      try {
        let draftData = null;
        const userId = currentUser?.id || currentUser?.user_id;
        
        if (paramServerId && paramServerId !== "null" && paramServerId !== "undefined") {
          try {
            draftData = await fetchChecklistInstanceDetail(paramServerId, resolvedOrgId);
          } catch (err) {
            console.warn("Failed to fetch draft from server, trying local IndexedDB", err);
          }
          if (!draftData && userId) {
            const { getLocalDraftByServerId } = await import("./QHSE/InspectionChecklists/draftsDb");
            draftData = await getLocalDraftByServerId(userId, paramServerId);
          }
        }
        
        if (!draftData && paramDraftId && paramDraftId !== "null" && paramDraftId !== "undefined" && userId) {
          const { getLocalDraft } = await import("./QHSE/InspectionChecklists/draftsDb");
          draftData = await getLocalDraft(userId, paramDraftId);
        }
        
        if (!draftData) {
          toast.error("Could not load draft details");
          setLoadingForm(false);
          return;
        }

        const tempId = draftData.safety_template_id || draftData.safetyTemplateId;
        if (!tempId) {
          toast.error("Draft does not specify a template");
          setLoadingForm(false);
          return;
        }
        
        setSelectedTemplateId(tempId);
        
        // Fetch template details
        const tmpl = await fetchInspectionChecklistDetail(tempId);
        setTemplate(tmpl);
        
        // Map header metadata
        const meta = draftData.report_header_meta || draftData.safety_report_meta || draftData.reportMeta || {};
        setLocation(meta.location || "");
        setContractor(meta.name_of_contractor || meta.contractor || "");
        setMachineNo(meta.make_model || meta.identification_no || meta.machineNo || "");
        if (meta.date_of_inspection || meta.date) {
          setDate(meta.date_of_inspection || meta.date);
        }
        
        // Map answers
        const initialAnswers = {};
        const questionsList = tmpl.questions || [];
        
        // Initialize template questions first
        questionsList.forEach((q) => {
          initialAnswers[q.id] = { answer: null, remarks: "", photo: null, previewUrl: "" };
        });
        
        // Overlay draft answers
        const draftAnswersList = draftData.answers || [];
        const draftItemsList = draftData.items || [];
        
        if (draftAnswersList.length > 0) {
          draftAnswersList.forEach((ans) => {
            const qId = ans.checklist_item_id || ans.submission_id;
            if (qId) {
              const photoData = draftData.photos?.find(p => p.checklist_item_id === qId);
              initialAnswers[qId] = {
                answer: ans.answer || null,
                remarks: ans.remarks || ans.maker_remarks || "",
                photo: photoData?.file || null,
                previewUrl: photoData?.previewUrl || (photoData?.file ? URL.createObjectURL(photoData.file) : (ans.maker_media || ans.photo_url || "")),
              };
            }
          });
        } else if (draftItemsList.length > 0) {
          draftItemsList.forEach((item, index) => {
            const q = questionsList[index] || questionsList.find(q => q.text === item.title) || { id: item.id };
            const lastSub = (item.submissions || [])[0] || {};
            initialAnswers[q.id] = {
              answer: lastSub.latest_maker_answer || lastSub.answer || null,
              remarks: lastSub.maker_remarks || lastSub.latest_maker_remarks || lastSub.remarks || "",
              photo: null,
              previewUrl: lastSub.maker_media || lastSub.latest_maker_photo_url || lastSub.photo_url || "",
            };
          });
        }
        
        setAnswers(initialAnswers);
      } catch (err) {
        console.error("Failed to resume draft:", err);
        toast.error("Failed to resume draft");
      } finally {
        setLoadingForm(false);
      }
    }
    resumeDraft();
  }, [resolvedOrgId]);

  // ─── Step 2: When template is selected, load its full question detail ───
  const handleTemplateChange = useCallback(async (templateId) => {
    setSelectedTemplateId(templateId);
    if (!templateId) {
      setTemplate(null);
      setAnswers({});
      return;
    }

    setLoadingForm(true);
    try {
      const detail = await fetchInspectionChecklistDetail(templateId);
      setTemplate(detail);

      // Initialize empty answers for each question
      const initial = {};
      (detail.questions || []).forEach((q) => {
        initial[q.id] = { answer: null, remarks: "", photo: null, previewUrl: "" };
      });
      setAnswers(initial);
    } catch (err) {
      console.error("Failed to load template detail", err);
      toast.error("Failed to load template questions");
    } finally {
      setLoadingForm(false);
    }
  }, []);

  // ─── Answer Handlers ───
  const handleOptionChange = (qId, value) => {
    setAnswers((prev) => ({ ...prev, [qId]: { ...prev[qId], answer: value } }));
  };
  const handleRemarkChange = (qId, text) => {
    setAnswers((prev) => ({ ...prev, [qId]: { ...prev[qId], remarks: text } }));
  };
  const handlePhotoUpload = (qId, file) => {
    if (!file || !file.type.startsWith("image/")) { toast.error("Please select a valid image."); return; }
    setAnswers((prev) => ({ ...prev, [qId]: { ...prev[qId], photo: file, previewUrl: URL.createObjectURL(file) } }));
  };
  const handleRemovePhoto = (qId) => {
    setAnswers((prev) => {
      const copy = { ...prev };
      if (copy[qId]?.previewUrl?.startsWith("blob:")) URL.revokeObjectURL(copy[qId].previewUrl);
      copy[qId] = { ...copy[qId], photo: null, previewUrl: "" };
      return copy;
    });
  };
  const clearSignature = () => {
    if (sigCanvasRef.current) {
      sigCanvasRef.current.clear();
      setHasSignature(false);
    }
  };

  // ─── Submit: Create instance + submit answers in one flow ───
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedTemplateId) return toast.error("Please select a template.");
    if (!location.trim()) return toast.error("Location is required.");
    if (!contractor) return toast.error("Contractor is required.");
    if (!machineNo.trim()) return toast.error("Machine / Identification No. is required.");
    if (!selectedReviewerId) return toast.error("Please select a Checker to review this checklist.");

    // Signature validation
    if (!sigCanvasRef.current || sigCanvasRef.current.isEmpty()) {
      return toast.error("Maker digital signature is required.");
    }

    const questions = template?.questions || [];
    for (const q of questions) {
      const a = answers[q.id] || {};
      if (!a.answer) {
        const qOpts = (q.options && q.options.length)
          ? q.options.map(opt => typeof opt === 'string' ? opt : (opt.label || opt.name || opt.text || ''))
          : ["Yes", "No", "N/A"];
        return toast.error(`Please select an option (${qOpts.join("/")}) for: "${q.text || q.title}"`);
      }
      if (q.photo_required && !a.photo && !a.previewUrl) return toast.error(`Photo required for: "${q.text || q.title}"`);
    }

    setSubmitting(true);
    try {
      const currentUserId = currentUser?.id || currentUser?.user_id || null;
      const currentUserName = currentUser?.name || currentUser?.first_name || currentUser?.username || "Maker";

      // 1. Create or resolve the checklist instance
      let instId = serverId;
      if (!instId) {
        const inst = await createChecklistInstance({
          templateId: selectedTemplateId,
          projectId: resolvedProjectId,
          orgId: resolvedOrgId,
          title: `${template?.title || "Checklist"} - ${date}`,
          movement_assignments: [
            { order_index: 1, role: "MAKER", user_id: currentUserId ? Number(currentUserId) : null, user_name: currentUserName },
            { order_index: 2, role: "CHECKER", user_id: null, user_name: "Safety Officer Pool" },
            { order_index: 3, role: "SUPERVISOR", user_id: null, user_name: "PMC / 3rd Party Supervisor Pool" },
          ],
        });
        instId = inst.id;
      }

      // 2. Fetch the instance details to get real item IDs & submission IDs
      const freshInst = await fetchChecklistInstanceDetail(instId, resolvedOrgId);
      const instanceItems = freshInst?.items || [];

      // 3. Build the submission payload with correct IDs
      //    Map answers from template questions → instance items by matching order index
      const sigBlob = await new Promise((resolve) => {
        sigCanvasRef.current.getCanvas().toBlob((blob) => resolve(blob), "image/png");
      });
      const sigFile = new File([sigBlob], "signature.png", { type: "image/png" });

      const formData = new FormData();
      formData.append("template_id", selectedTemplateId);
      formData.append("project_id", resolvedProjectId);
      formData.append("org_id", resolvedOrgId);
      formData.append("title", `${template?.title || "Checklist"} - ${date}`);
      formData.append("maker_signature", sigFile);
      formData.append("report_meta", JSON.stringify({
        location, name_of_contractor: contractor, make_model: machineNo, date_of_inspection: date,
      }));

      // Build submissions list using instance item IDs (not template question IDs)
      const submissionsList = [];
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const a = answers[q.id] || {};
        // Match by index order: template questions[i] → instanceItems[i]
        const item = instanceItems[i];
        const lastSub = item ? ((item.submissions || [])[0] || {}) : {};
        const subId = lastSub.id || item?.id;

        submissionsList.push({
          submission_id: subId,
          answer: a.answer,
          maker_remarks: a.remarks || "",
        });

        // Attach photos keyed by submission ID
        if (a.photo && subId) {
          formData.append(`maker_media_${subId}`, a.photo);
        }
      }
      formData.append("submissions", JSON.stringify(submissionsList));
      formData.append("next_reviewer_id", selectedReviewerId);

      await submitChecklistInstance(instId, formData);
      try {
        if (currentUser?.id) {
          if (draftId) await deleteLocalDraft(currentUser.id, draftId);
          if (serverId) {
            const { deleteLocalDraftByServerId } = await import("./QHSE/InspectionChecklists/draftsDb");
            await deleteLocalDraftByServerId(currentUser.id, serverId);
          }
        }
      } catch (de) {
        console.error("Failed to delete draft after submit:", de);
      }
      toast.success("Checklist submitted to Checker successfully!");
      navigate("/checklists");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderAutosavePill = () => {
    if (!selectedTemplateId || loadingForm || submitting) return null;
    const status = autosave.saveStatus;
    
    let bg = "#f3f4f6";
    let text = "#374151";
    let label = "Saved locally";
    
    if (status.includes("Error")) {
      bg = "#fee2e2";
      text = "#991b1b";
      label = status;
    } else if (status.includes("Syncing")) {
      bg = "#e0f2fe";
      text = "#0369a1";
      label = "Syncing...";
    } else if (status.includes("Synced")) {
      bg = "#d1fae5";
      text = "#065f46";
      label = "Synced";
    } else if (status.includes("pending")) {
      bg = "#fef9c3";
      text = "#854d0e";
      label = "Sync pending";
    } else if (status.includes("Saved")) {
      bg = "#f3f4f6";
      text = "#374151";
      label = "Saved locally";
    }
    
    return (
      <div style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "6px 12px",
        borderRadius: "20px",
        fontSize: "12px",
        fontWeight: "600",
        background: bg,
        color: text,
        border: `1px solid ${text}25`
      }}>
        <span style={{
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          background: text === "#374151" ? "#9ca3af" : text
        }} />
        Draft: {label}
      </div>
    );
  };

  // ─── RENDER ───
  const queryParams = new URLSearchParams(window.location.search);
  const isResumingDraft = !!(queryParams.get("draftId") || queryParams.get("serverId"));

  return (
    <div style={{ background: bgColor, minHeight: "100vh", paddingTop: "80px", paddingBottom: "100px", fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "0 20px" }}>

        {/* Back + Title */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginBottom: "24px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button onClick={() => navigate("/checklists")} style={{ padding: "8px", borderRadius: "50%", background: "#f1f5f9", border: "none", cursor: "pointer" }}>
              ← 
            </button>
            <div>
              <h1 style={{ fontSize: "24px", fontWeight: "700", color: "#1e293b", margin: 0 }}>Create New Checklist</h1>
              <p style={{ fontSize: "13px", color: "#64748b", margin: 0, marginTop: "2px" }}>Select a template, fill in the checkpoints, and submit.</p>
            </div>
          </div>
          {renderAutosavePill()}
        </div>

        {/* ─── Template Selector ─── */}
        <div style={{ background: "white", padding: "20px 24px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", marginBottom: "20px" }}>
          <label style={S.label}>Select Checklist Template <span style={{ color: "#ef4444" }}>*</span></label>
          {loadingTemplates ? (
            <p style={{ color: "#64748b", fontSize: "14px" }}>Loading templates...</p>
          ) : templates.length === 0 ? (
            <p style={{ color: "#991b1b", fontSize: "14px", background: "#fee2e2", padding: "12px", borderRadius: "8px" }}>
              No templates found. Ask your Admin to create one first.
            </p>
          ) : (
            <select value={selectedTemplateId} onChange={(e) => handleTemplateChange(e.target.value)} style={S.select} disabled={isResumingDraft}>
              <option value="">-- Choose a template --</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>{t.title} {t.category_name ? `(${t.category_name})` : ""}</option>
              ))}
            </select>
          )}
        </div>

        {/* ─── Loading state after template selection ─── */}
        {loadingForm && (
          <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>Loading checklist questions...</div>
        )}

        {/* ─── Full Form (appears once template is selected) ─── */}
        {template && !loadingForm && (
          <form onSubmit={(e) => {
            e.preventDefault();
            if (!isFormComplete) {
              handleBlockedSubmit();
              return;
            }
            handleSubmit(e);
          }}>

            {/* Header Info */}
            <div style={{ background: "white", padding: "24px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", marginBottom: "20px" }}>
              <h3 style={S.sectionTitle}>📋 Header Information</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div ref={locationRef} style={{ transition: "all 0.3s ease" }}>
                  <label style={S.label}>Location <span style={{ color: "#ef4444" }}>*</span></label>
                  <input type="text" placeholder="e.g. Block A, 2nd Floor" value={location} onChange={(e) => setLocation(e.target.value)} style={S.input} />
                </div>
                <div ref={contractorRef} style={{ transition: "all 0.3s ease" }}>
                  <label style={S.label}>Contractor <span style={{ color: "#ef4444" }}>*</span></label>
                  <select value={contractor} onChange={(e) => setContractor(e.target.value)} style={S.select}>
                    <option value="">Select Contractor</option>
                    {contractorOptions.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div ref={machineNoRef} style={{ transition: "all 0.3s ease" }}>
                  <label style={S.label}>Machine / Identification No. <span style={{ color: "#ef4444" }}>*</span></label>
                  <input type="text" placeholder="e.g. CRN-005" value={machineNo} onChange={(e) => setMachineNo(e.target.value)} style={S.input} />
                </div>
                <div>
                  <label style={S.label}>Date</label>
                  <input type="date" value={date} readOnly style={{ ...S.input, background: "#f8fafc", cursor: "not-allowed", color: "#64748b", border: "1px solid #e2e8f0" }} />
                </div>
              </div>
            </div>

            {/* Instruction Images & Text (from template) */}
            {((template.instructional_media_urls && template.instructional_media_urls.length > 0) || template.instruction_text) && (
              <div style={{ background: "white", padding: "24px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", marginBottom: "20px" }}>
                <h3 style={S.sectionTitle}>📖 Checklist Instructions & Reference</h3>

                {/* Images Grid – side-by-side */}
                {template.instructional_media_urls && template.instructional_media_urls.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginBottom: template.instruction_text ? "16px" : "0" }}>
                    {template.instructional_media_urls.map((url, i) => {
                      return (
                        <img key={i} src={getMediaUrl(url)} alt={`Instruction ${i + 1}`} style={{ maxWidth: "220px", height: "140px", objectFit: "contain", border: "1px solid #e2e8f0", borderRadius: "8px", background: "#f8fafc" }} />
                      );
                    })}
                  </div>
                )}

                {/* Instruction Text */}
                {template.instruction_text && (
                  <p style={{ fontSize: "13px", color: "#374151", lineHeight: "1.6", whiteSpace: "pre-wrap", margin: 0 }}>{template.instruction_text}</p>
                )}
              </div>
            )}

            {/* Checkpoints */}
            <div style={{ background: "white", padding: "24px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", marginBottom: "20px" }}>
              <h3 style={S.sectionTitle}>✅ Checkpoints</h3>
              {(template.questions || []).map((q, idx) => {
                const a = answers[q.id] || {};
                return (
                  <div 
                    ref={(el) => { questionRefs.current[q.id] = el; }} 
                    key={q.id} 
                    style={{ 
                      padding: "16px", 
                      marginBottom: "12px", 
                      border: a.answer ? "1px solid #e2e8f0" : "1px solid #fed7aa", 
                      borderRadius: "10px", 
                      background: a.answer ? "#fff" : "#fffbeb",
                      transition: "all 0.3s ease" 
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", flexWrap: "wrap" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "28px", height: "28px", borderRadius: "8px", background: "#fff7ed", color: "#ea580c", fontWeight: "700", fontSize: "13px", border: "1px solid #fed7aa" }}>{idx + 1}</span>
                          <span style={{ fontWeight: "600", color: "#1e293b", fontSize: "14px" }}>{q.text || q.title}</span>
                        </div>
                        {q.description && <p style={{ fontSize: "12px", color: "#64748b", marginTop: "4px", marginLeft: "38px" }}>{q.description}</p>}
                      </div>
                      <div style={{ display: "flex", gap: "6px" }}>
                        {(q.options && q.options.length
                          ? q.options.map(opt => typeof opt === 'string' ? opt : (opt.label || opt.name || opt.text || ''))
                          : ["Yes", "No", "N/A"]
                        ).map((opt) => {
                          const isSelected = a.answer === opt;
                          const cleanOpt = opt.toLowerCase();
                          let activeStyle = { background: "#6b7280", color: "#fff", borderColor: "#6b7280" };
                          if (cleanOpt === "yes" || cleanOpt === "safe" || cleanOpt === "satisfactory" || cleanOpt === "pass") {
                            activeStyle = { background: "#16a34a", color: "#fff", borderColor: "#16a34a" };
                          } else if (cleanOpt === "no" || cleanOpt === "unsafe" || cleanOpt === "unsatisfactory" || cleanOpt === "fail" || cleanOpt.includes("not")) {
                            activeStyle = { background: "#dc2626", color: "#fff", borderColor: "#dc2626" };
                          }
                          return (
                            <button key={opt} type="button" onClick={() => handleOptionChange(q.id, opt)} style={{
                              padding: "6px 14px", borderRadius: "6px", fontSize: "12px", fontWeight: "700", border: "1px solid",
                              cursor: "pointer", transition: "all 0.15s",
                              ...(isSelected ? activeStyle : { background: "#fff", color: "#374151", borderColor: "#d1d5db" })
                            }}>{opt}</button>
                          );
                        })}
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "12px", borderTop: "1px solid #f1f5f9", paddingTop: "12px" }}>
                      <div>
                        <label style={{ fontSize: "11px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase" }}>Remarks</label>
                        <input type="text" placeholder="Enter remark..." value={a.remarks || ""} onChange={(e) => handleRemarkChange(q.id, e.target.value)} style={{ ...S.input, fontSize: "13px", padding: "8px 10px" }} />
                      </div>
                      <div>
                        <label style={{ fontSize: "11px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase" }}>Photo {q.photo_required ? "*" : ""}</label>
                        {a.previewUrl ? (
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <img src={a.previewUrl} alt="" style={{ width: "40px", height: "40px", objectFit: "cover", borderRadius: "6px", border: "1px solid #e2e8f0" }} />
                            <button type="button" onClick={() => handleRemovePhoto(q.id)} style={{ fontSize: "11px", color: "#dc2626", background: "#fee2e2", border: "none", padding: "4px 8px", borderRadius: "4px", cursor: "pointer", fontWeight: "600" }}>Remove</button>
                          </div>
                        ) : (
                          <label style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 12px", border: "1px dashed #cbd5e1", borderRadius: "6px", cursor: "pointer", fontSize: "12px", color: "#64748b", fontWeight: "600" }}>
                            📷 Attach
                            <input type="file" accept="image/*" hidden onChange={(e) => handlePhotoUpload(q.id, e.target.files[0])} />
                          </label>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Reviewer + Signature */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
              <div ref={reviewerRef} style={{ background: "white", padding: "24px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", transition: "all 0.3s ease" }}>
                <h3 style={S.sectionTitle}>👤 Forward to Checker</h3>
                <select value={selectedReviewerId} onChange={(e) => setSelectedReviewerId(e.target.value)} style={S.select}>
                  <option value="">Select Checker</option>
                  {checkersList.map((u) => {
                    const displayName = [u.first_name, u.last_name].filter(Boolean).join(" ") || u.username || u.name || u.email || `User ${u.id}`;
                    return <option key={u.id} value={u.id}>{displayName}</option>;
                  })}
                </select>
                <p style={{ fontSize: "11px", color: "#94a3b8", marginTop: "8px" }}>This person will review and sign off on your inspection.</p>
              </div>
              <div ref={signatureRef} style={{ background: "white", padding: "24px", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", transition: "all 0.3s ease" }}>
                <h3 style={S.sectionTitle}>✍️ Maker Signature</h3>
                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", overflow: "hidden" }}>
                  <SignatureCanvas 
                    ref={sigCanvasRef} 
                    onEnd={() => setHasSignature(true)}
                    canvasProps={{ className: "w-full", style: { width: "100%", height: "120px", cursor: "crosshair" } }} 
                  />
                </div>
                <button type="button" onClick={clearSignature} style={{ marginTop: "8px", fontSize: "12px", color: "#64748b", background: "#f1f5f9", border: "1px solid #e2e8f0", padding: "4px 12px", borderRadius: "6px", cursor: "pointer", fontWeight: "600" }}>Clear</button>
              </div>
            </div>

            {/* Submit Bar */}
            <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "white", borderTop: "1px solid #e2e8f0", padding: "12px 24px", display: "flex", justifyContent: "flex-end", gap: "12px", zIndex: 40, boxShadow: "0 -2px 8px rgba(0,0,0,0.05)" }}>
              <button type="button" onClick={() => navigate("/checklists")} style={{ padding: "10px 20px", background: "transparent", color: "#64748b", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "14px", fontWeight: "600", cursor: "pointer" }}>Cancel</button>
              <button 
                type="submit" 
                onClick={(e) => {
                  if (submitting) {
                    e.preventDefault();
                    return;
                  }
                  if (!isFormComplete) {
                    e.preventDefault();
                    handleBlockedSubmit();
                    return;
                  }
                }}
                aria-disabled={!isFormComplete || submitting ? "true" : "false"}
                style={{ 
                  padding: "10px 24px", 
                  background: `linear-gradient(135deg, ${ORANGE} 0%, #ff9f1c 100%)`, 
                  color: "black", 
                  border: "none", 
                  borderRadius: "8px", 
                  fontSize: "14px", 
                  fontWeight: "700", 
                  cursor: submitting ? "wait" : (!isFormComplete ? "not-allowed" : "pointer"), 
                  opacity: submitting || !isFormComplete ? 0.5 : 1,
                  transition: "all 0.2s ease"
                }}
              >
                {submitting ? "Submitting..." : "Submit to Checker"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ─── Shared inline styles ───
const S = {
  label: { display: "block", fontSize: "12px", fontWeight: "700", color: "#475569", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" },
  select: { width: "100%", padding: "10px 14px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "14px", color: "#1e293b", background: "#fff", outline: "none", boxSizing: "border-box" },
  input: { width: "100%", padding: "10px 14px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "14px", color: "#1e293b", background: "#fff", outline: "none", boxSizing: "border-box" },
  sectionTitle: { fontSize: "14px", fontWeight: "700", color: "#1e293b", margin: "0 0 16px 0", paddingBottom: "10px", borderBottom: "1px solid #f1f5f9" },
};
