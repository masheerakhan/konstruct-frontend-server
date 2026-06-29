// QHSE CHECKLIST MODULE
// Purpose:
// Multi-role checklist instance form used by Maker (fill & submit), Checker (review & approve/reject),
// and Supervisor (final approve/reject). Renders instruction text and images from the template,
// checkpoint questions with Yes/No/N/A answers, mandatory photo upload, remarks, and digital signature.
// Screen: QHSE Checklist fill form (Maker), Checker inbox view, Supervisor inbox view.
import React, { useState, useEffect, useRef } from "react";
import { 
  ArrowLeft, 
  Loader2, 
  Upload, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  User, 
  Calendar, 
  FileText,
  Check,
  X,
  AlertCircle,
  Eye,
  Edit2,
  Ban
} from "lucide-react";
import SignatureCanvas from "react-signature-canvas";
import {
  fetchInspectionChecklistDetail,
  submitChecklistInstance,
  approveChecklistInstance,
  rejectChecklistInstance,
  fetchProjectUsers,
  fetchChecklistInstanceDetail,
  fetchChecklistDraftDetail,
} from "./inspectionChecklistApi";
import toast from "react-hot-toast";
import { getProjectsByOrgOwnership, getUsersByProject } from "../../../api";
import { downloadChecklistReportPdfFrontend, getMediaUrl } from "./qhsePdfGenerator";
import { deleteLocalDraft, getLocalDraft, getLocalDraftByServerId, deleteLocalDraftByServerId } from "./draftsDb";
import useQHSEAutosave from "./useQHSEAutosave";

export default function InspectionChecklistInstanceForm({
  mode = "create", // 'create' | 'fill' | 'review' | 'view' | 'draft'
  templateId,
  instanceId,
  projectId,
  orgId,
  onBack,
  onCompleted,
  draftId: propDraftId,
}) {
  const generateUUID = () => {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  const [draftId, setDraftId] = useState(mode === "draft" ? (propDraftId || "") : generateUUID());
  const [serverId, setServerId] = useState(mode === "draft" ? instanceId : null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [template, setTemplate] = useState(null);
  const [instance, setInstance] = useState(null);
  
  // Header Meta States
  const [location, setLocation] = useState("");
  const [contractor, setContractor] = useState("");
  const [projectName, setProjectName] = useState("");
  const [machineNo, setMachineNo] = useState("");
  const [reportNo, setReportNo] = useState("Auto-generated");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  // Checkpoints State
  const [answers, setAnswers] = useState({}); // { [questionId]: { answer: 'Yes'|'No'|'N/A'|null, remarks: '', photo: File|null, previewUrl: '' } }
  const [hasSignature, setHasSignature] = useState(false);
  
  // Reviewer and Signatures
  const sigCanvasRef = useRef(null);
  const [users, setUsers] = useState([]);
  const [selectedReviewerId, setSelectedReviewerId] = useState("");

  // Rejection Workflow State
  const [showRejectionInput, setShowRejectionInput] = useState(false);
  const [rejectionRemarks, setRejectionRemarks] = useState("");

  const currentUser = (() => {
    try {
      return (
        JSON.parse(localStorage.getItem("USER_DATA") || "null") ||
        JSON.parse(localStorage.getItem("userData") || "null")
      );
    } catch {
      return null;
    }
  })();

  const autosave = useQHSEAutosave({
    userId: currentUser?.id,
    draftId,
    serverId,
    setServerId,
    templateId: templateId || template?.id || instance?.safety_template_id,
    projectId,
    orgId,
    metadata: {
      name: `${template?.title || "Draft Checklist"} - ${date}`,
      location,
      contractor,
      machineNo,
      date,
    },
    answers,
    enabled: mode === "create" || mode === "draft",
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

  const checkersFiltered = users.filter(u => getUserRoles(u).includes("CHECKER"));
  const checkers = checkersFiltered.length > 0 ? checkersFiltered : users;

  const supervisorsFiltered = users.filter(u => getUserRoles(u).includes("SUPERVISOR"));
  const supervisors = supervisorsFiltered.length > 0 ? supervisorsFiltered : users;

  const contractorOptions = ["L&T", "Horizon Construction", "Sterling & Wilson", "PMC Engineering", "Tata Projects"];

  useEffect(() => {
    async function loadForm() {
      setLoading(true);
      try {
        let resolvedProjectId = projectId;

        if (mode === "create") {
          const detail = await fetchInspectionChecklistDetail(templateId);
          setTemplate(detail);
          
          // Initialize empty answers
          const initial = {};
          (detail.questions || []).forEach((q) => {
            initial[q.id] = {
              answer: null,
              remarks: "",
              photo: null,
              previewUrl: "",
            };
          });
          setAnswers(initial);
        } else if (mode === "draft") {
          let draftData = null;
          try {
            if (navigator.onLine && instanceId) {
              draftData = await fetchChecklistDraftDetail(instanceId);
            }
          } catch (err) {
            console.warn("Could not fetch draft from server, trying local IndexedDB", err);
          }

          if (!draftData && instanceId) {
            draftData = await getLocalDraftByServerId(currentUser?.id, instanceId);
          }

          if (!draftData && propDraftId) {
            draftData = await getLocalDraft(currentUser?.id, propDraftId);
          }

          if (draftData) {
            setServerId(draftData.id || draftData.serverId || null);
            if (draftData.draftId) {
              setDraftId(draftData.draftId);
            }
            
            const tempId = draftData.safety_template_id || draftData.safetyTemplateId || templateId;
            if (tempId) {
              const detail = await fetchInspectionChecklistDetail(tempId);
              setTemplate(detail);
              
              const initial = {};
              (detail.questions || []).forEach((q) => {
                let draftAns = null;
                if (Array.isArray(draftData.answers)) {
                  draftAns = draftData.answers.find(a => a.checklist_item_id === q.id || a.submission_id === q.id);
                } else if (draftData.items) {
                  const item = draftData.items.find(it => it.safety_question_id === q.id || it.id === q.id);
                  if (item) {
                    const lastSub = (item.submissions || [])[0] || {};
                    draftAns = {
                      answer: lastSub.latest_maker_answer || lastSub.answer || null,
                      remarks: lastSub.maker_remarks || lastSub.latest_maker_remarks || lastSub.remarks || "",
                      previewUrl: lastSub.maker_media || lastSub.latest_maker_photo_url || lastSub.photo_url || "",
                    };
                  }
                }
                
                initial[q.id] = {
                  answer: draftAns?.answer || null,
                  remarks: draftAns?.remarks || draftAns?.maker_remarks || "",
                  photo: null,
                  previewUrl: draftAns?.previewUrl || draftAns?.photo_url || "",
                };
              });
              setAnswers(initial);
            }

            const meta = draftData.report_header_meta || draftData.safety_report_meta || draftData.reportMeta || {};
            setLocation(meta.location || "");
            setContractor(meta.name_of_contractor || meta.contractor || "");
            setMachineNo(meta.make_model || meta.identification_no || meta.machineNo || "");
            setDate(meta.date_of_inspection || meta.date || new Date().toISOString().split("T")[0]);
            setReportNo(draftData.name || "Draft Report");
          }
        } else {
          // View / Review / Fill modes
          const inst = await fetchChecklistInstanceDetail(instanceId, orgId);
          setInstance(inst);
          if (inst.project_id) {
            resolvedProjectId = inst.project_id;
          }
          
          const meta = inst.report_header_meta || inst.safety_report_meta || {};
          setLocation(meta.location || "");
          setContractor(meta.name_of_contractor || "");
          setMachineNo(meta.make_model || meta.identification_no || "");
          setDate(meta.date_of_inspection || new Date().toISOString().split("T")[0]);
          setReportNo(inst.name || "Checklist Report");

          // Load existing answers
          const initial = {};
          (inst.items || []).forEach((item) => {
            const lastSub = (item.submissions || [])[0] || {};
            initial[item.id] = {
              answer: lastSub.latest_maker_answer || lastSub.answer || null,
              remarks: lastSub.maker_remarks || lastSub.latest_maker_remarks || "",
              photo: null,
              previewUrl: lastSub.maker_media || lastSub.latest_maker_photo_url || lastSub.photo_url || "",
            };
          });
           setAnswers(initial);

          // Also fetch the parent template to get instruction_text & instructional_media_urls
          if (inst.safety_template_id) {
            try {
              const tmpl = await fetchInspectionChecklistDetail(inst.safety_template_id);
              setTemplate(tmpl);
            } catch (tmplErr) {
              console.warn("Could not fetch template for instructions:", tmplErr);
            }
          }
        }

        let pName = "";
        if (resolvedProjectId) {
          try {
            const res = await getProjectsByOrgOwnership(orgId);
            if (res && res.data) {
              const p = res.data.find((proj) => String(proj.id) === String(resolvedProjectId));
              if (p) {
                pName = p.name;
              }
            }
          } catch (err) {
            console.error("Error fetching project name:", err);
          }
        }
        setProjectName(pName);

        // Fetch project-specific users for the Checker select dropdown
        let projectUsers = [];
        if (resolvedProjectId) {
          try {
            const usersRes = await getUsersByProject(resolvedProjectId);
            projectUsers = usersRes?.data?.results ?? usersRes?.data ?? [];
          } catch (err) {
            console.error("Error fetching project-specific users:", err);
            projectUsers = await fetchProjectUsers();
          }
        } else {
          projectUsers = await fetchProjectUsers();
        }
        setUsers(Array.isArray(projectUsers) ? projectUsers : []);

      } catch (err) {
        console.error(err);
        toast.error("Failed to load inspection details.");
      } finally {
        setLoading(false);
      }
    }

    loadForm();
  }, [mode, templateId, instanceId, orgId, projectId]);

  // Answer state modifiers
  const handleOptionChange = (questionId, value) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        answer: value,
      },
    }));
  };

  const handleRemarkChange = (questionId, text) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        remarks: text,
      },
    }));
  };

  const handlePhotoUpload = (questionId, file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file.");
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        photo: file,
        previewUrl,
      },
    }));
  };

  const handleRemovePhoto = (questionId) => {
    setAnswers((prev) => {
      const copy = { ...prev };
      if (copy[questionId].previewUrl && copy[questionId].previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(copy[questionId].previewUrl);
      }
      copy[questionId].photo = null;
      copy[questionId].previewUrl = "";
      return copy;
    });
  };

  const clearSignature = () => {
    if (sigCanvasRef.current) {
      sigCanvasRef.current.clear();
      setHasSignature(false);
    }
  };

  const getSignatureFile = async () => {
    if (!sigCanvasRef.current || sigCanvasRef.current.isEmpty()) {
      return null;
    }
    return new Promise((resolve) => {
      sigCanvasRef.current.getCanvas().toBlob((blob) => {
        if (!blob) {
          resolve(null);
          return;
        }
        const file = new File([blob], "signature.png", { type: "image/png" });
        resolve(file);
      }, "image/png");
    });
  };

  // Submit Handler (Maker Workflow)
  const scrollToAndHighlight = (elementId) => {
    const el = document.getElementById(elementId);
    if (!el) return;
    
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("highlight-error");
    
    const clearHighlight = () => {
      el.classList.remove("highlight-error");
      el.removeEventListener("input", clearHighlight);
      el.removeEventListener("focus", clearHighlight);
      el.removeEventListener("click", clearHighlight);
    };
    
    el.addEventListener("input", clearHighlight);
    el.addEventListener("focus", clearHighlight);
    el.addEventListener("click", clearHighlight);
    
    setTimeout(clearHighlight, 4000);
  };

  // Submit Handler (Maker Workflow)
  const handleSubmitMaker = async (e) => {
    if (e) e.preventDefault();
    
    const missing = [];
    let firstElementId = "";

    if (!location.trim()) {
      missing.push("Location");
      firstElementId = firstElementId || "location-input";
    }
    if (!contractor) {
      missing.push("Contractor");
      firstElementId = firstElementId || "contractor-select";
    }
    if (!machineNo.trim()) {
      missing.push("Machine / Identification No.");
      firstElementId = firstElementId || "machine-no-input";
    }

    const questionsList = mode === "create" ? (template?.questions || []) : (instance?.items || []);
    
    // Checkpoint validations
    for (let idx = 0; idx < questionsList.length; idx++) {
      const q = questionsList[idx];
      const qId = q.id;
      const ansState = answers[qId] || {};
      
      if (!ansState.answer) {
        missing.push(`Question ${idx + 1}`);
        firstElementId = firstElementId || `checkpoint-card-${qId}`;
      } else if (q.photo_required && !ansState.photo && !ansState.previewUrl) {
        missing.push(`Question ${idx + 1} Photo`);
        firstElementId = firstElementId || `checkpoint-card-${qId}`;
      }
    }

    if (!selectedReviewerId) {
      missing.push("Reviewer");
      firstElementId = firstElementId || "reviewer-select";
    }
    
    // Digital signature canvas validation
    const sigFile = await getSignatureFile();
    if (!sigFile) {
      missing.push("Maker Signature");
      firstElementId = firstElementId || "signature-pad-container";
    }

    if (missing.length > 0) {
      toast.error(`Please complete: ${missing.join(", ")}`);
      if (firstElementId) {
        scrollToAndHighlight(firstElementId);
        const el = document.getElementById(firstElementId);
        if (el && (el.tagName === "INPUT" || el.tagName === "SELECT" || el.tagName === "TEXTAREA")) {
          el.focus();
        }
      }
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("template_id", templateId || instance?.safety_template_id || "");
      formData.append("project_id", projectId || instance?.project_id || "");
      formData.append("org_id", orgId || instance?.org_id || "");
      formData.append("title", `${template?.title || instance?.name} - ${date}`);
      formData.append("maker_signature", sigFile);
      
      const reportMeta = {
        location,
        name_of_contractor: contractor,
        make_model: machineNo,
        date_of_inspection: date,
      };
      formData.append("report_meta", JSON.stringify(reportMeta));
      
      const submissionsList = [];
      for (const q of questionsList) {
        const qId = q.id;
        const ansState = answers[qId] || {};
        const lastSub = (q.submissions || [])[0] || {};
        const subId = lastSub.id;
        
        submissionsList.push({
          submission_id: subId,
          answer: ansState.answer,
          maker_remarks: ansState.remarks || "",
        });

        if (ansState.photo) {
          formData.append(`maker_media_${subId}`, ansState.photo);
        }
      }
      
      formData.append("submissions", JSON.stringify(submissionsList));
      formData.append("next_reviewer_id", selectedReviewerId);

      await submitChecklistInstance(serverId || instanceId || 0, formData);
      if (currentUser?.id) {
        if (draftId) await deleteLocalDraft(currentUser.id, draftId);
        if (serverId) await deleteLocalDraftByServerId(currentUser.id, serverId);
      }
      toast.success("Checklist submitted to checker successfully!");
      onCompleted?.();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Approve Handler (Checker/Supervisor Workflow)
  const handleApproveChecker = async () => {
    const isSupervisor = instance?.current_assignee_role === "SUPERVISOR";
    const missing = [];
    let firstElementId = "";

    if (!isSupervisor && !selectedReviewerId) {
      missing.push("Forward to Supervisor");
      firstElementId = firstElementId || "reviewer-select";
    }

    const sigFile = await getSignatureFile();
    if (!sigFile) {
      missing.push("Approver Signature");
      firstElementId = firstElementId || "signature-pad-container";
    }

    if (missing.length > 0) {
      toast.error(`Please complete: ${missing.join(", ")}`);
      if (firstElementId) {
        scrollToAndHighlight(firstElementId);
        const el = document.getElementById(firstElementId);
        if (el && (el.tagName === "INPUT" || el.tagName === "SELECT" || el.tagName === "TEXTAREA")) {
          el.focus();
        }
      }
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      
      // COMMENT: Appending supervisor_signature instead of checker_signature for Supervisor role
      if (isSupervisor) {
        formData.append("supervisor_signature", sigFile);
      } else {
        formData.append("checker_signature", sigFile);
        formData.append("next_reviewer_id", selectedReviewerId);
      }
      
      const submissions = (instance.items || []).map((item) => {
        const lastSub = (item.submissions || [])[0] || {};
        return {
          submission_id: lastSub.id,
          answer: answers[item.id]?.answer || lastSub.latest_maker_answer || lastSub.answer || "Yes",
          remarks: answers[item.id]?.remarks || lastSub.maker_remarks || lastSub.latest_maker_remarks || "",
        };
      });

      formData.append("submissions", JSON.stringify(submissions));

      await approveChecklistInstance(instanceId, formData);
      
      // COMMENT: Render distinct feedback message depending on the role
      if (isSupervisor) {
        toast.success("Inspection checklist approved and closed by Supervisor!");
      } else {
        toast.success("Inspection checklist approved and verified!");
      }
      onCompleted?.();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Failed to approve inspection. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Reject Handler (Checker Workflow)
  const handleRejectChecker = async () => {
    const missing = [];
    let firstElementId = "";

    if (!rejectionRemarks.trim()) {
      missing.push("Rejection Remarks");
      firstElementId = firstElementId || "rejection-remarks-input";
    }

    if (missing.length > 0) {
      toast.error(`Please complete: ${missing.join(", ")}`);
      if (firstElementId) {
        scrollToAndHighlight(firstElementId);
        const el = document.getElementById(firstElementId);
        if (el && (el.tagName === "INPUT" || el.tagName === "SELECT" || el.tagName === "TEXTAREA")) {
          el.focus();
        }
      }
      return;
    }

    setSubmitting(true);
    try {
      const rejections = (instance.items || []).map((item) => {
        const lastSub = (item.submissions || [])[0] || {};
        return {
          submission_id: lastSub.id,
          remarks: "",
        };
      });

      const formData = new FormData();
      formData.append("rejections", JSON.stringify(rejections));
      formData.append("remarks", rejectionRemarks);

      await rejectChecklistInstance(instanceId, formData);
      toast.success("Inspection checklist rejected and sent back to Maker.");
      onCompleted?.();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Failed to reject inspection. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500 bg-white rounded-xl border border-gray-200 shadow-sm mt-4">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500 mb-3" />
        <p className="text-sm font-medium">Loading checklist form...</p>
      </div>
    );
  }

  const title = template?.title || instance?.name || "Inspection Checklist";
  const questions = mode === "create" ? (template?.questions || []) : (instance?.items || []);
  const isViewOnly = mode === "view";
  const isReviewMode = mode === "review";

  const handleDownloadPDF = async () => {
    const loadingToast = toast.loading("Generating PDF report...");
    try {
      let resolvedOrgId = null;
      try {
        const user =
          JSON.parse(localStorage.getItem("USER_DATA") || "null") ||
          JSON.parse(localStorage.getItem("userData") || "null");
        resolvedOrgId =
          user?.org ||
          user?.organization_id ||
          user?.org_id ||
          localStorage.getItem("ORG_ID") ||
          localStorage.getItem("ACTIVE_ORG_ID") ||
          null;
      } catch {}

      await downloadChecklistReportPdfFrontend(instance.id, resolvedOrgId);
      toast.success("PDF report downloaded successfully!", { id: loadingToast });
    } catch (err) {
      console.error("Failed to download PDF", err);
      toast.error("Failed to generate PDF report.", { id: loadingToast });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24 relative">
      <style>{`
        @keyframes error-shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .highlight-error {
          border-color: #ef4444 !important;
          box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.2) !important;
          animation: error-shake 0.3s ease-in-out;
        }
      `}</style>
      {/* ── HEADER NAVIGATION BAR ── */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
              title="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{title}</h2>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-0.5 text-xs text-gray-500">
                <span className="font-semibold text-orange-600">{projectName || "Horizon Industrial Parks"}</span>
                <span className="text-gray-300">•</span>
                <span>QHSE Checklist Module</span>
              </div>
            </div>
          </div>
          
          {/* Draft Autosave Status Indicator */}
          {(mode === "create" || mode === "draft") && (
            <div className="shrink-0 flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shadow-sm ${
                autosave.saveStatus.includes("Error") ? "bg-red-100 text-red-800 border border-red-200" :
                autosave.saveStatus.includes("Syncing") ? "bg-blue-100 text-blue-800 border border-blue-200 animate-pulse" :
                autosave.saveStatus.includes("Synced") ? "bg-green-100 text-green-800 border border-green-200" :
                "bg-amber-100 text-amber-800 border border-amber-200"
              }`}>
                <span className={`w-2 h-2 rounded-full ${
                  autosave.saveStatus.includes("Error") ? "bg-red-500" :
                  autosave.saveStatus.includes("Syncing") ? "bg-blue-500" :
                  autosave.saveStatus.includes("Synced") ? "bg-green-500" :
                  "bg-amber-500"
                }`} />
                Draft: {autosave.saveStatus}
              </span>
            </div>
          )}

          {/* Status Indicator for Review/View modes */}
          {instance && (
            <div className="shrink-0">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shadow-sm ${
                // COMMENT: Supported both 'completed' and 'approved' status values for green styling
                instance.status === "completed" || instance.status === "approved" ? "bg-green-100 text-green-800 border border-green-200" :
                instance.status === "rejected" || instance.status === "rework" ? "bg-red-100 text-red-800 border border-red-200" :
                "bg-amber-100 text-amber-800 border border-amber-200"
              }`}>
                <span className={`w-2 h-2 rounded-full ${
                  instance.status === "completed" || instance.status === "approved" ? "bg-green-500" :
                  instance.status === "rejected" || instance.status === "rework" ? "bg-red-500" : "bg-amber-500"
                }`} />
                Status: {instance.status ? instance.status.replace("_", " ").toUpperCase() : "PENDING"}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── CORE FORM BODY CONTENT ── */}
      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {mode === "view" ? (
          <FinalView
            projectName={projectName}
            location={location}
            contractor={contractor}
            machineNo={machineNo}
            reportNo={reportNo}
            date={date}
            questions={questions}
            answers={answers}
            instance={instance}
            template={template}
            handleDownloadPDF={handleDownloadPDF}
          />
        ) : mode === "review" ? (
          <CheckerView
            projectName={projectName}
            location={location}
            contractor={contractor}
            machineNo={machineNo}
            reportNo={reportNo}
            date={date}
            questions={questions}
            answers={answers}
            instance={instance}
            template={template}
            sigCanvasRef={sigCanvasRef}
            clearSignature={clearSignature}
            showRejectionInput={showRejectionInput}
            setShowRejectionInput={setShowRejectionInput}
            rejectionRemarks={rejectionRemarks}
            setRejectionRemarks={setRejectionRemarks}
            handleApprove={handleApproveChecker}
            handleReject={handleRejectChecker}
            submitting={submitting}
            handleDownloadPDF={handleDownloadPDF}
            supervisors={supervisors}
            selectedReviewerId={selectedReviewerId}
            setSelectedReviewerId={setSelectedReviewerId}
            hasSignature={hasSignature}
            setHasSignature={setHasSignature}
          />
        ) : (
          <MakerView
            projectName={projectName}
            location={location}
            setLocation={setLocation}
            contractor={contractor}
            setContractor={setContractor}
            contractorOptions={contractorOptions}
            machineNo={machineNo}
            setMachineNo={setMachineNo}
            reportNo={reportNo}
            date={date}
            setDate={setDate}
            questions={questions}
            answers={answers}
            template={template}
            users={users}
            checkers={checkers}
            selectedReviewerId={selectedReviewerId}
            setSelectedReviewerId={setSelectedReviewerId}
            sigCanvasRef={sigCanvasRef}
            clearSignature={clearSignature}
            handleOptionChange={handleOptionChange}
            handleRemarkChange={handleRemarkChange}
            handlePhotoUpload={handlePhotoUpload}
            handleRemovePhoto={handleRemovePhoto}
            handleSubmit={handleSubmitMaker}
            submitting={submitting}
            hasSignature={hasSignature}
            setHasSignature={setHasSignature}
          />
        )}
      </div>
    </div>
  );
}

// ─── STEP 1: MAKER VIEW COMPONENT (EDITABLE FORM) ───
function MakerView({
  projectName,
  location,
  setLocation,
  contractor,
  setContractor,
  contractorOptions,
  machineNo,
  setMachineNo,
  reportNo,
  date,
  setDate,
  questions,
  answers,
  template = null,
  users,
  checkers = [],
  selectedReviewerId,
  setSelectedReviewerId,
  sigCanvasRef,
  clearSignature,
  handleOptionChange,
  handleRemarkChange,
  handlePhotoUpload,
  handleRemovePhoto,
  handleSubmit,
  submitting,
  hasSignature,
  setHasSignature,
}) {
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header Info Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide border-b pb-3 mb-4 flex items-center gap-2">
          <FileText className="w-4 h-4 text-orange-500" /> Header Information
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">Project/ Job Site</label>
            <input
              type="text"
              readOnly
              value={projectName || "Horizon Industrial Parks"}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">Location <span className="text-red-500">*</span></label>
            <input
              type="text"
              required
              id="location-input"
              placeholder="e.g. Block A, 2nd Floor"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-gray-300 text-gray-900 placeholder-gray-400 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">Contractor <span className="text-red-500">*</span></label>
            <select
              required
              id="contractor-select"
              value={contractor}
              onChange={(e) => setContractor(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-gray-300 text-gray-900 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-sm"
            >
              <option value="">Select Contractor</option>
              {contractorOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">Machine / Identification No. <span className="text-red-500">*</span></label>
            <input
              type="text"
              required
              id="machine-no-input"
              placeholder="e.g. CRN-005"
              value={machineNo}
              onChange={(e) => setMachineNo(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-gray-300 text-gray-900 placeholder-gray-400 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">Report No.</label>
            <input
              type="text"
              readOnly
              value={reportNo}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 text-gray-500 rounded-lg text-sm font-medium focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">Date</label>
            <input
              type="date"
              readOnly
              value={date}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 text-gray-500 rounded-lg text-sm font-medium focus:outline-none cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* Instruction Images & Text from Template (QHSE Checklist only) */}
      {template && ((template.instructional_media_urls && template.instructional_media_urls.length > 0) || template.instruction_text) && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide border-b pb-3 mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4 text-orange-500" /> Checklist Instructions & Reference
          </h3>

          {/* Images Grid – side-by-side */}
          {template.instructional_media_urls && template.instructional_media_urls.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "16px", marginBottom: template.instruction_text ? "16px" : "0", width: "100%" }}>
              {template.instructional_media_urls.map((url, i) => {
                const src = url.startsWith("http") ? url : (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" ? `http://127.0.0.1:8001${url.startsWith("/") ? url : "/" + url}` : `${window.location.protocol}//${window.location.host}${url.startsWith("/") ? url : "/" + url}`);
                return (
                  <img key={i} src={src} alt={`Instruction ${i + 1}`} style={{ height: "240px", width: "auto", maxWidth: "100%", objectFit: "contain", border: "1px solid #e2e8f0", borderRadius: "8px", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }} />
                );
              })}
            </div>
          )}

          {/* Instruction Text */}
          {template.instruction_text && (
            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{template.instruction_text}</p>
          )}
        </div>
      )}

      {/* Checkpoints Card Listing */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide border-b pb-3 mb-2 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-orange-500" /> SL. Checkpoints & Statuses
        </h3>
        
        {questions.map((q, idx) => {
          const qId = q.id;
          const state = answers[qId] || { answer: null, remarks: "", previewUrl: "" };
          return (
            <div 
              key={qId} 
              id={`checkpoint-card-${qId}`}
              className={`bg-white border rounded-xl p-5 shadow-sm hover:shadow-md transition-all space-y-4 ${
                state.answer ? 'border-gray-200' : 'border-orange-200 bg-orange-50/5'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                {/* Number & Checkpoint Title */}
                <div className="flex items-start gap-3 flex-1">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-orange-50 text-orange-600 font-bold shrink-0 text-sm border border-orange-100">
                    {idx + 1}
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-semibold text-gray-900 text-sm md:text-base">{q.text || q.title}</h4>
                    {(q.description || q.instructions) && (
                      <p className="text-xs text-gray-500 whitespace-pre-wrap leading-relaxed">{q.description || q.instructions}</p>
                    )}
                  </div>
                </div>

                {/* Yes/No/N/A Active Option Selectors */}
                <div className="shrink-0">
                  <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Select Status *</span>
                  <div className="flex items-center gap-1.5">
                    {(q.options && q.options.length
                      ? q.options.map(opt => typeof opt === 'string' ? opt : (opt.label || opt.name || opt.text || ''))
                      : ["Yes", "No", "N/A"]
                    ).map((opt) => {
                      const cleanOpt = opt.toLowerCase();
                      const isActive = state.answer === opt;
                      let activeClass = "bg-gray-600 border-gray-600 text-white";
                      if (cleanOpt === "yes" || cleanOpt === "safe" || cleanOpt === "satisfactory" || cleanOpt === "pass") {
                        activeClass = "bg-green-600 border-green-600 text-white";
                      } else if (cleanOpt === "no" || cleanOpt === "unsafe" || cleanOpt === "unsatisfactory" || cleanOpt === "fail" || cleanOpt.includes("not")) {
                        activeClass = "bg-red-600 border-red-600 text-white";
                      }
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => handleOptionChange(qId, opt)}
                          className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all shadow-sm ${
                            isActive ? activeClass : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Remarks Uploader and Preview Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-gray-100">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Maker Remarks</label>
                  <input
                    type="text"
                    placeholder="Enter remark or observation notes..."
                    value={state.remarks || ""}
                    onChange={(e) => handleRemarkChange(qId, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 text-gray-900 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Attachment</label>
                  {state.previewUrl ? (
                    <div className="flex items-center gap-3">
                      <img
                        src={getMediaUrl(state.previewUrl)}
                        alt="attachment preview"
                        className="h-12 w-12 object-cover rounded-lg border border-gray-300 shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(qId)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 rounded-lg text-xs font-semibold transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove Photo
                      </button>
                    </div>
                  ) : (
                    <label className="inline-flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 hover:border-orange-500 hover:bg-orange-50/35 rounded-lg cursor-pointer text-xs font-bold text-gray-500 hover:text-orange-600 transition-all min-h-[38px]">
                      <Upload className="w-4 h-4 text-gray-400" />
                      <span>{q.photo_required ? "Attach Mandatory Photo *" : "Attach Photo"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handlePhotoUpload(qId, e.target.files[0])}
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Reviewer Assignment & Signature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide border-b pb-3 mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-orange-500" /> Forward Checklist to Reviewer
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">Select Checker / Supervisor <span className="text-red-500">*</span></label>
                <select
                  required
                  id="reviewer-select"
                  value={selectedReviewerId}
                  onChange={(e) => setSelectedReviewerId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-300 text-gray-900 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-sm"
                >
                  <option value="">Select Checker</option>
                  {checkers.map((u) => {
                    const displayName = [u.first_name, u.last_name].filter(Boolean).join(" ") || u.username || u.name || u.email || `User ${u.id}`;
                    return (
                      <option key={u.id} value={u.id}>
                        {displayName}
                      </option>
                    );
                  })}
                </select>
              </div>
              
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800 flex items-start gap-2.5 leading-relaxed">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p>Submitting this inspection sheet freezes editing privileges. The record is routed to the Checker for official sign-off or conditional rejection feedback.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Signature Pad */}
        <div id="signature-pad-container" className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide border-b pb-3 mb-4 flex items-center gap-2">
            <Edit2 className="w-4 h-4 text-orange-500" /> Maker Signature Sign-Off
          </h3>
          <div className="space-y-3">
            <div className="bg-gray-50 border border-gray-300 rounded-xl overflow-hidden shadow-inner">
              <SignatureCanvas
                ref={sigCanvasRef}
                onEnd={() => setHasSignature(true)}
                canvasProps={{ 
                  className: "w-full h-36 bg-gray-50",
                  style: { cursor: "crosshair" }
                }}
              />
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={clearSignature}
                className="px-3.5 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-semibold transition-colors shadow-sm"
              >
                Clear Signature
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Actions Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end gap-3 z-40 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        {(() => {
          const checkFormIncomplete = () => {
            if (!location || !location.trim()) return true;
            if (!contractor) return true;
            if (!machineNo || !machineNo.trim()) return true;
            if (!selectedReviewerId) return true;
            
            // Check questions
            for (const q of questions) {
              const ansState = answers[q.id] || {};
              if (!ansState.answer) return true;
              if (q.photo_required && !ansState.photo && !ansState.previewUrl) return true;
            }
            
            // Check signature
            if (!hasSignature) return true;
            
            return false;
          };
          const isIncomplete = checkFormIncomplete();

          return (
            <>
              <button
                type="button"
                onClick={() => window.history.back()}
                className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm ${
                  submitting
                    ? "bg-gray-400 text-white cursor-not-allowed opacity-50"
                    : isIncomplete
                    ? "bg-red-500 hover:bg-red-600 text-white cursor-not-allowed"
                    : "bg-orange-500 hover:bg-orange-600 text-white"
                }`}
                style={{ cursor: isIncomplete ? "not-allowed" : "pointer" }}
                title={isIncomplete ? "Form incomplete: Please fill in all required fields" : "Submit Checklist"}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting to Checker...</span>
                  </>
                ) : isIncomplete ? (
                  <>
                    <Ban className="w-4.5 h-4.5" />
                    <span>Submit Blocked (Incomplete)</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4.5 h-4.5" />
                    <span>Submit to Checker</span>
                  </>
                )}
              </button>
            </>
          );
        })()}
      </div>
    </form>
  );
}

// ─── STEP 2: CHECKER VIEW COMPONENT (REVIEW & SIGN) ───
function CheckerView({
  projectName,
  location,
  contractor,
  machineNo,
  reportNo,
  date,
  questions,
  answers,
  instance,
  sigCanvasRef,
  clearSignature,
  showRejectionInput,
  setShowRejectionInput,
  rejectionRemarks,
  setRejectionRemarks,
  handleApprove,
  handleReject,
  submitting,
  handleDownloadPDF,
  supervisors = [],
  template = null,
  selectedReviewerId,
  setSelectedReviewerId,
  hasSignature,
  setHasSignature,
}) {
  const isSupervisor = instance?.current_assignee_role === "SUPERVISOR";

  const isApproveIncomplete = () => {
    if (!isSupervisor && !selectedReviewerId) return true;
    if (!hasSignature) return true;
    return false;
  };
  const isApproveBlocked = isApproveIncomplete();

  return (
    <div className="space-y-6">
      {/* Read-Only Metadata Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide border-b pb-3 mb-4 flex items-center gap-2">
          <FileText className="w-4 h-4 text-orange-500" /> Header Information (Read-Only)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          <div>
            <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Project/ Job Site</span>
            <p className="text-sm font-semibold text-gray-800">{projectName || "Horizon Industrial Parks"}</p>
          </div>
          <div>
            <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Location</span>
            <p className="text-sm font-semibold text-gray-800">{location || "N/A"}</p>
          </div>
          <div>
            <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Contractor</span>
            <p className="text-sm font-semibold text-gray-800">{contractor || "N/A"}</p>
          </div>
          <div>
            <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Machine / Identification No.</span>
            <p className="text-sm font-semibold text-gray-800">{machineNo || "N/A"}</p>
          </div>
          <div>
            <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Report No.</span>
            <p className="text-sm font-semibold text-gray-800">{reportNo || "N/A"}</p>
          </div>
          <div>
            <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Date</span>
            <p className="text-sm font-semibold text-gray-800">{date || "N/A"}</p>
          </div>
        </div>
      </div>

      {/* Instruction Images & Text from Template (QHSE Checklist only) */}
      {template && ((template.instructional_media_urls && template.instructional_media_urls.length > 0) || template.instruction_text) && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide border-b pb-3 mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4 text-orange-500" /> Checklist Instructions & Reference
          </h3>

          {/* Images Grid – side-by-side */}
          {template.instructional_media_urls && template.instructional_media_urls.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "16px", marginBottom: template.instruction_text ? "16px" : "0", width: "100%" }}>
              {template.instructional_media_urls.map((url, i) => {
                const src = url.startsWith("http") ? url : (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" ? `http://127.0.0.1:8001${url.startsWith("/") ? url : "/" + url}` : `${window.location.protocol}//${window.location.host}${url.startsWith("/") ? url : "/" + url}`);
                return (
                  <img key={i} src={src} alt={`Instruction ${i + 1}`} style={{ height: "240px", width: "auto", maxWidth: "100%", objectFit: "contain", border: "1px solid #e2e8f0", borderRadius: "8px", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }} />
                );
              })}
            </div>
          )}

          {/* Instruction Text */}
          {template.instruction_text && (
            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{template.instruction_text}</p>
          )}
        </div>
      )}

      {/* Checklist Checkpoint Read-Only Cards */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide border-b pb-3 mb-2 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-orange-500" /> Submitted Answers Review
        </h3>

        {questions.map((q, idx) => {
          const qId = q.id;
          const state = answers[qId] || { answer: null, remarks: "", previewUrl: "" };
          return (
            <div key={qId} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                {/* Checkpoint text */}
                <div className="flex items-start gap-3 flex-1">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-50 text-gray-600 font-bold shrink-0 text-sm border border-gray-200">
                    {idx + 1}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm md:text-base">{q.text || q.title}</h4>
                    {(q.description || q.instructions) && (
                      <p className="text-xs text-gray-500 whitespace-pre-wrap mt-1">{q.description || q.instructions}</p>
                    )}
                  </div>
                </div>

                {/* Read-Only Status Badges */}
                <div className="shrink-0">
                  <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Submitted Status</span>
                  {(() => {
                    const cleanAns = (state.answer || "").toLowerCase();
                    let badgeClass = "bg-gray-50 border-gray-200 text-gray-600";
                    if (cleanAns === "yes" || cleanAns === "safe" || cleanAns === "satisfactory" || cleanAns === "pass") {
                      badgeClass = "bg-green-50 border-green-200 text-green-700";
                    } else if (cleanAns === "no" || cleanAns === "unsafe" || cleanAns === "unsatisfactory" || cleanAns === "fail" || cleanAns.includes("not")) {
                      badgeClass = "bg-red-50 border-red-200 text-red-700";
                    } else if (!state.answer) {
                      badgeClass = "bg-amber-50 border-amber-200 text-amber-700";
                    }
                    return (
                      <span className={`inline-flex px-3.5 py-1.5 rounded-lg text-xs font-bold border ${badgeClass}`}>
                        {state.answer || "Unanswered"}
                      </span>
                    );
                  })()}
                </div>
              </div>

              {/* Maker Remarks & Photos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-gray-100 text-xs text-gray-600">
                <div>
                  <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Maker Remarks</span>
                  <p className="text-sm text-gray-800 bg-gray-50 p-2.5 rounded-lg border border-gray-100 min-h-[38px]">
                    {state.remarks || <span className="text-gray-400 italic">No remarks provided.</span>}
                  </p>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Uploaded Photo</span>
                  {state.previewUrl ? (
                    <div className="mt-1">
                      <img
                        src={getMediaUrl(state.previewUrl)}
                        alt="checkpoint attachment"
                        className="h-16 w-16 object-cover rounded-lg border border-gray-300 shadow-sm"
                      />
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 italic p-2 bg-gray-50 border border-gray-100 rounded-lg min-h-[38px] flex items-center">
                      No photo attached.
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Digital Sign-off Canvas / Signatures */}
      <div className={`grid grid-cols-1 ${isSupervisor ? "md:grid-cols-3" : "md:grid-cols-2"} gap-6`}>
        {/* Maker Sign-off Metadata */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide border-b pb-3 mb-4">Maker Information</h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex justify-between border-b pb-2">
                <span className="font-semibold text-gray-500">Submitted By:</span>
                <span className="font-medium text-gray-900">{instance?.creator_name || "Inspector/Maker"}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-semibold text-gray-500">Checker Assigned:</span>
                <span className="font-medium text-gray-900">{instance?.assigned_checker_name || "Safety Officer/Checker"}</span>
              </div>
            </div>
          </div>
          {instance?.maker_signature && (
            <div className="mt-4 pt-4 border-t border-gray-100 text-center">
              <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Maker Digital Signature</span>
              <img src={getMediaUrl(instance.maker_signature)} alt="Maker Signature" className="h-16 object-contain mx-auto border border-gray-100 rounded bg-gray-50" />
            </div>
          )}
        </div>

        {/* Checker Sign-off Metadata (Only visible in Supervisor review) */}
        {isSupervisor && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide border-b pb-3 mb-4">Checker Information</h3>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex justify-between border-b pb-2">
                  <span className="font-semibold text-gray-500">Checked/Reviewed By:</span>
                  <span className="font-medium text-gray-900">{instance?.assigned_checker_name || "Safety Officer/Checker"}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="font-semibold text-gray-500">Status:</span>
                  <span className="font-medium text-green-600">VERIFIED & CHECKED</span>
                </div>
              </div>
            </div>
            {instance?.checker_signature && (
              <div className="mt-4 pt-4 border-t border-gray-100 text-center">
                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Checker Digital Signature</span>
                <img src={getMediaUrl(instance.checker_signature)} alt="Checker Signature" className="h-16 object-contain mx-auto border border-gray-100 rounded bg-gray-50" />
              </div>
            )}
          </div>
        )}

        {/* Sign-off Canvas (Checker or Supervisor depending on role) */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide border-b pb-3 mb-4 flex items-center gap-2">
            <Edit2 className="w-4 h-4 text-orange-500" /> {isSupervisor ? "Supervisor" : "Checker"} Digital Signature Sign-Off
          </h3>
          {showRejectionInput ? (
            <div className="h-44 flex items-center justify-center bg-gray-50 text-gray-400 italic rounded-xl border border-dashed text-xs px-4 text-center">
              Signature signature input is disabled during rejection flow.
            </div>
          ) : (
            <div className="space-y-3">
              {!isSupervisor && (
                <div className="mb-4">
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">
                    Forward To Supervisor <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    id="reviewer-select"
                    value={selectedReviewerId}
                    onChange={(e) => setSelectedReviewerId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-300 text-gray-900 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-sm"
                  >
                    <option value="">Select Supervisor</option>
                    {supervisors.map((u) => {
                      const displayName = [u.first_name, u.last_name].filter(Boolean).join(" ") || u.username || u.name || u.email || `User ${u.id}`;
                      return (
                        <option key={u.id} value={u.id}>
                          {displayName}
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              <div id="signature-pad-container" className="bg-gray-50 border border-gray-300 rounded-xl overflow-hidden shadow-inner">
                <SignatureCanvas
                  ref={sigCanvasRef}
                  onEnd={() => setHasSignature(true)}
                  canvasProps={{ 
                    className: "w-full h-36 bg-gray-50",
                    style: { cursor: "crosshair" }
                  }}
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={clearSignature}
                  className="px-3.5 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-semibold transition-colors"
                >
                  Clear Signature
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CONDITIONAL REJECTION COMMENTS BOX */}
      {showRejectionInput && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 shadow-sm space-y-3 animate-fade-in">
          <div className="flex items-center gap-2 text-red-800 font-bold text-sm">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span>Conditional Rejection Remarks</span>
          </div>
          <p className="text-xs text-red-700 leading-relaxed">
            Please enter a detailed description of the safety violation or missing details. This remark will be sent directly to the Maker for rectification.
          </p>
          <textarea
            required
            id="rejection-remarks-input"
            rows={3}
            value={rejectionRemarks}
            onChange={(e) => setRejectionRemarks(e.target.value)}
            placeholder="Type reason for rejection here... *"
            className="w-full px-3.5 py-2.5 border border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200 rounded-lg text-sm bg-white text-gray-900 transition-all focus:outline-none"
          />
        </div>
      )}

      {/* Sticky Bottom Actions Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end gap-3 z-40 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        {showRejectionInput ? (
          <>
            <button
              type="button"
              onClick={() => {
                setShowRejectionInput(false);
                setRejectionRemarks("");
              }}
              className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-semibold transition-colors"
            >
              Cancel Rejection
            </button>
            <button
              type="button"
              onClick={handleReject}
              disabled={submitting}
              className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm ${
                submitting
                  ? "bg-gray-400 text-white cursor-not-allowed opacity-50"
                  : !rejectionRemarks.trim()
                  ? "bg-red-500 hover:bg-red-600 text-white cursor-not-allowed"
                  : "bg-red-600 hover:bg-red-700 text-white"
              }`}
              style={{ cursor: !rejectionRemarks.trim() ? "not-allowed" : "pointer" }}
              title={!rejectionRemarks.trim() ? "Please enter reason for rejection" : "Submit Rejection"}
            >
              {submitting ? "Rejecting..." : "Submit Rejection"}
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => window.history.back()}
              className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-semibold transition-colors"
            >
              Back
            </button>
            {instance?.id && (
              <button
                type="button"
                onClick={handleDownloadPDF}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm flex items-center gap-2"
              >
                📥 Download PDF
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowRejectionInput(true)}
              className="px-5 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-100 rounded-lg text-sm font-semibold transition-colors"
            >
              Reject & Rework
            </button>
            <button
              type="button"
              onClick={handleApprove}
              disabled={submitting}
              className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm ${
                submitting
                  ? "bg-gray-400 text-white cursor-not-allowed opacity-50"
                  : isApproveBlocked
                  ? "bg-red-500 hover:bg-red-600 text-white cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700 text-white"
              }`}
              style={{ cursor: isApproveBlocked ? "not-allowed" : "pointer" }}
              title={isApproveBlocked ? "Form incomplete: Please fill in all required fields" : "Approve & Sign"}
            >
              {submitting ? "Approving..." : "Approve & Sign"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── STEP 3: FINAL VIEWER COMPONENT (PMC / 3RD PARTY VIEW) ───
function FinalView({
  projectName,
  location,
  contractor,
  machineNo,
  reportNo,
  date,
  questions,
  answers,
  instance,
  template = null,
  handleDownloadPDF,
}) {
  return (
    <div className="space-y-6">
      {/* Summary Status Banner */}
      <div className={`p-5 rounded-xl border flex items-center justify-between shadow-sm ${
        // COMMENT: Added support for completed and approved states in FinalView styling
        instance?.status === "completed" || instance?.status === "approved" ? "bg-green-50 border-green-200 text-green-800" :
        instance?.status === "rejected" || instance?.status === "rework" ? "bg-red-50 border-red-200 text-red-800" :
        "bg-amber-50 border-amber-200 text-amber-800"
      }`}>
        <div className="flex items-center gap-3">
          {instance?.status === "completed" || instance?.status === "approved" ? (
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          ) : instance?.status === "rejected" || instance?.status === "rework" ? (
            <X className="w-8 h-8 text-red-600" />
          ) : (
            <AlertCircle className="w-8 h-8 text-amber-600" />
          )}
          <div>
            <h4 className="font-bold text-base md:text-lg">
              {instance?.status === "completed" || instance?.status === "approved" ? "Inspection Approved & Completed" :
               instance?.status === "rejected" || instance?.status === "rework" ? "Inspection Rejected - Needs Rework" :
               "Inspection Under Checker/Supervisor Review"}
            </h4>
            <p className="text-xs opacity-90 mt-0.5">
              This audit record is locked digitally. No edits or reviews are allowed at this step.
            </p>
          </div>
        </div>
      </div>

      {/* Read-Only Metadata Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide border-b pb-3 mb-4 flex items-center gap-2">
          <FileText className="w-4 h-4 text-orange-500" /> Header Information
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          <div>
            <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Project/ Job Site</span>
            <p className="text-sm font-semibold text-gray-800">{projectName || "Horizon Industrial Parks"}</p>
          </div>
          <div>
            <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Location</span>
            <p className="text-sm font-semibold text-gray-800">{location || "N/A"}</p>
          </div>
          <div>
            <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Contractor</span>
            <p className="text-sm font-semibold text-gray-800">{contractor || "N/A"}</p>
          </div>
          <div>
            <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Machine / Identification No.</span>
            <p className="text-sm font-semibold text-gray-800">{machineNo || "N/A"}</p>
          </div>
          <div>
            <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Report No.</span>
            <p className="text-sm font-semibold text-gray-800">{reportNo || "N/A"}</p>
          </div>
          <div>
            <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Date of Audit</span>
            <p className="text-sm font-semibold text-gray-800">{date || "N/A"}</p>
          </div>
        </div>
      </div>

      {/* Instruction Images & Text from Template (QHSE Checklist only) */}
      {template && ((template.instructional_media_urls && template.instructional_media_urls.length > 0) || template.instruction_text) && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide border-b pb-3 mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4 text-orange-500" /> Checklist Instructions & Reference
          </h3>

          {/* Images Grid – side-by-side */}
          {template.instructional_media_urls && template.instructional_media_urls.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "16px", marginBottom: template.instruction_text ? "16px" : "0", width: "100%" }}>
              {template.instructional_media_urls.map((url, i) => {
                const src = url.startsWith("http") ? url : (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" ? `http://127.0.0.1:8001${url.startsWith("/") ? url : "/" + url}` : `${window.location.protocol}//${window.location.host}${url.startsWith("/") ? url : "/" + url}`);
                return (
                  <img key={i} src={src} alt={`Instruction ${i + 1}`} style={{ height: "240px", width: "auto", maxWidth: "100%", objectFit: "contain", border: "1px solid #e2e8f0", borderRadius: "8px", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }} />
                );
              })}
            </div>
          )}

          {/* Instruction Text */}
          {template.instruction_text && (
            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{template.instruction_text}</p>
          )}
        </div>
      )}

      {/* Checklist Checkpoint Read-Only Cards */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide border-b pb-3 mb-2 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-orange-500" /> Audit Log & Checkpoints
        </h3>

        {questions.map((q, idx) => {
          const qId = q.id;
          const state = answers[qId] || { answer: null, remarks: "", previewUrl: "" };
          return (
            <div key={qId} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-50 text-gray-600 font-bold shrink-0 text-sm border border-gray-200">
                    {idx + 1}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm md:text-base">{q.text || q.title}</h4>
                    {(q.description || q.instructions) && (
                      <p className="text-xs text-gray-500 whitespace-pre-wrap mt-1 leading-relaxed">{q.description || q.instructions}</p>
                    )}
                  </div>
                </div>

                <div className="shrink-0">
                  <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Audit Status</span>
                  {(() => {
                    const cleanAns = (state.answer || "").toLowerCase();
                    let badgeClass = "bg-gray-50 border-gray-200 text-gray-600";
                    if (cleanAns === "yes" || cleanAns === "safe" || cleanAns === "satisfactory" || cleanAns === "pass") {
                      badgeClass = "bg-green-50 border-green-200 text-green-700";
                    } else if (cleanAns === "no" || cleanAns === "unsafe" || cleanAns === "unsatisfactory" || cleanAns === "fail" || cleanAns.includes("not")) {
                      badgeClass = "bg-red-50 border-red-200 text-red-700";
                    } else if (!state.answer) {
                      badgeClass = "bg-amber-50 border-amber-200 text-amber-700";
                    }
                    return (
                      <span className={`inline-flex px-3.5 py-1.5 rounded-lg text-xs font-bold border ${badgeClass}`}>
                        {state.answer || "Unanswered"}
                      </span>
                    );
                  })()}
                </div>
              </div>

              {/* Maker Remarks & Photos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-gray-100 text-xs text-gray-600">
                <div>
                  <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Maker Remarks</span>
                  <p className="text-sm text-gray-800 bg-gray-50 p-2.5 rounded-lg border border-gray-100 min-h-[38px]">
                    {state.remarks || <span className="text-gray-400 italic">No remarks provided.</span>}
                  </p>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Uploaded Photo</span>
                  {state.previewUrl ? (
                    <div className="mt-1">
                      <img
                        src={getMediaUrl(state.previewUrl)}
                        alt="checkpoint attachment"
                        className="h-16 w-16 object-cover rounded-lg border border-gray-300 shadow-sm"
                      />
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 italic p-2 bg-gray-50 border border-gray-100 rounded-lg min-h-[38px] flex items-center">
                      No photo attached.
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Digital Signature Audit Cards */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide border-b pb-3 mb-4 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-600" /> Digital Signatures & Log
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border border-gray-150 rounded-xl p-5 bg-gray-50/50 flex flex-col justify-between min-h-[140px]">
            <div>
              <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Maker / Inspector</span>
              <p className="text-sm font-semibold text-gray-800">{instance?.creator_name || "Maker User"}</p>
            </div>
            {instance?.maker_signature ? (
              <div className="mt-4 text-center">
                <img src={getMediaUrl(instance.maker_signature)} alt="Maker Signature" className="h-16 object-contain mx-auto border border-gray-200 rounded bg-white p-1" />
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic mt-4">Maker Signature logged digitally.</p>
            )}
          </div>

          <div className="border border-gray-150 rounded-xl p-5 bg-gray-50/50 flex flex-col justify-between min-h-[140px]">
            <div>
              <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Checker / Reviewer</span>
              <p className="text-sm font-semibold text-gray-800">{instance?.assigned_checker_name || "Checker User"}</p>
            </div>
            {instance?.checker_signature ? (
              <div className="mt-4 text-center">
                <img src={getMediaUrl(instance.checker_signature)} alt="Checker Signature" className="h-16 object-contain mx-auto border border-gray-200 rounded bg-white p-1" />
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic mt-4">Checker Signature logged digitally.</p>
            )}
          </div>

          <div className="border border-gray-150 rounded-xl p-5 bg-gray-50/50 flex flex-col justify-between min-h-[140px]">
            <div>
              <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Supervisor (PMC / 3rd Party)</span>
              <p className="text-sm font-semibold text-gray-800">{instance?.supervisor_name || "Supervisor User"}</p>
            </div>
            {instance?.supervisor_signature ? (
              <div className="mt-4 text-center">
                <img src={getMediaUrl(instance.supervisor_signature)} alt="Supervisor Signature" className="h-16 object-contain mx-auto border border-gray-200 rounded bg-white p-1" />
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic mt-4">Supervisor Signature logged digitally.</p>
            )}
          </div>
        </div>
      </div>

      {/* Sticky Bottom Back Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end gap-3 z-40 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        {instance?.id && (
          <button
            type="button"
            onClick={handleDownloadPDF}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm flex items-center gap-2"
          >
            📥 Download PDF
          </button>
        )}
        <button
          type="button"
          onClick={() => window.history.back()}
          className="px-6 py-2.5 bg-gray-800 hover:bg-gray-900 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
        >
          Close Reviewer View
        </button>
      </div>
    </div>
  );
}
