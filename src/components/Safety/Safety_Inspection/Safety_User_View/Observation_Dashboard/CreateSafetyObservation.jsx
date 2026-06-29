import React, { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  Save,
  Upload,
  X as XIcon,
  ClipboardList,
  UploadCloud,
  Camera,
} from "lucide-react";
import {
  listSafetyTemplates,
  createSafetyObservation,
  getProjectsForCurrentUser,
  listContractorNamesByOrg,
  getUsersByProject,
} from "../../../../../api";
import { showToast } from "../../../../../utils/toast";
import SafetyImageAnnotationModal from "../../SafetyImageAnnotationModal";
import SignatureCanvas from "react-signature-canvas";
import RiskMatrixModal from "./RiskMatrixModal";

const resolveMakerContext = () => {
  let profile = null;
  try {
    const raw = localStorage.getItem("USER_DATA");
    profile = raw && raw !== "undefined" ? JSON.parse(raw) : {};
  } catch {
    profile = {};
  }

  const accesses = Array.isArray(profile?.accesses) ? profile.accesses : [];
  const activeAccess =
    accesses.find((a) => a?.active && a?.project_id) ||
    accesses.find((a) => a?.project_id) ||
    null;

  const projectId = String(
    localStorage.getItem("ACTIVE_PROJECT_ID") ||
      localStorage.getItem("PROJECT_ID") ||
      activeAccess?.project_id ||
      profile?.project_id ||
      "",
  ).trim();

  const projectName = String(
    localStorage.getItem("ACTIVE_PROJECT_NAME") ||
      localStorage.getItem("PROJECT_NAME") ||
      activeAccess?.project_name ||
      activeAccess?.project?.name ||
      profile?.project_name ||
      "",
  ).trim();

  const orgId = String(
    localStorage.getItem("ORG_ID") ||
      profile?.org ||
      profile?.org_id ||
      profile?.organization_id ||
      profile?.organization?.id ||
      "",
  ).trim();

  return { projectId, projectName, orgId, profile, accesses };
};

const PhotoUploadArea = ({
  id,
  file,
  onFileChange,
  onRemove,
  label,
  onAnnotate,
}) => {
  const inputRef = useRef(null);
  const previewUrl = file ? URL.createObjectURL(file) : null;

  const handleRemove = () => {
    if (inputRef.current) inputRef.current.value = "";
    onRemove?.();
  };

  return (
    <div className="mt-3">
      <p className="mb-1.5 text-xs font-medium text-muted-foreground">
        {label}
      </p>
      {previewUrl ? (
        <div className="flex items-center gap-4">
          <div className="relative inline-block">
            <img
              src={previewUrl}
              alt="Preview"
              className="h-20 w-20 rounded-lg border border-border object-cover shadow-sm"
            />
            <button
              type="button"
              onClick={handleRemove}
              className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow transition-colors hover:bg-red-600"
            >
              <XIcon className="h-3 w-3" />
            </button>
          </div>
          {onAnnotate && (
            <button
              type="button"
              onClick={onAnnotate}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm"
            >
              Edit / Annotate
            </button>
          )}
        </div>
      ) : (
        <label
          htmlFor={`photo-upload-${id}`}
          className="flex cursor-pointer items-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:bg-muted/60"
        >
          <Upload className="h-4 w-4" />
          <span>Click to attach photo</span>
        </label>
      )}
      <input
        ref={inputRef}
        id={`photo-upload-${id}`}
        type="file"
        accept="image/*"
        onChange={(e) => onFileChange(e.target.files?.[0])}
        className="hidden"
      />
    </div>
  );
};

const HAZARDS_OPTIONS = [
  "1. Physical Hazard",
  "2. Biological Hazard",
  "3. Chemical Hazard",
  "4. Mechanical Hazard",
  "5. Ergonomical Hazard",
  "6. Environmental Hazard",
  "7. Fire/Explosion Hazard",
  "8. Electrical Hazard",
  "9. Psychological Hazard",
  "10. Other Hazards",
];

const WING_OPTIONS = ["A", "B", "C", "D", "E", "F", "G", "NTA"];
const FLOOR_OPTIONS = [
  "Basement 3",
  "Basement 2",
  "Basement 1",
  "Ground Floor",
  "1st Floor",
  "2nd Floor",
  "3rd Floor",
  "4th Floor",
  "5th Floor",
  "6th Floor",
  "7th Floor",
  "8th Floor",
  "9th Floor",
  "10th Floor",
  "11th Floor",
    "12th Floor",
    "13th Floor",
    "14th Floor",
    "15th Floor",
"16th Floor",
"17th Floor",
"18th Floor",
"19th Floor",
"20th Floor",
"21st Floor",
"22nd Floor",
  "Terrace",
];

const QuestionBadge = ({ number }) => (
  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-xs font-bold text-white shadow-sm">
    {number}
  </span>
);

export default function CreateSafetyObservation({ onBack }) {
  const [orgId, setOrgId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [projectName, setProjectName] = useState("");
  const [contractors, setContractors] = useState([]);
  const [templateId, setTemplateId] = useState(null);
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [makers, setMakers] = useState([]);
  const [allProjectUsers, setAllProjectUsers] = useState([]);
  const [loadingMakers, setLoadingMakers] = useState(false);
  const [selectedMakers, setSelectedMakers] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [makerSearch, setMakerSearch] = useState("");
  const dropdownRef = useRef(null);
  const [currentUserProfile, setCurrentUserProfile] = useState(null);

  const isCurrentUserInternal =
    currentUserProfile?.user_type === "INTERNAL" ||
    (currentUserProfile?.user_type !== "EXTERNAL" &&
      !(currentUserProfile?.contractor_name || currentUserProfile?.company));

  // Form Fields
  const [formData, setFormData] = useState({
    unsafe_act_condition_category: "",
    unsafe_act_condition_description: "",
    location_wing: "",
    location_floor: "",
    location_flat_area: "",
    location_combined: "",
    hazard_categories: [], // Array of checked options
    risk: "",
    name_of_contractor: "",
    _contractor_selection: "",
    target_date: "",
    corrective_action: "",
    preventive_action: "",
    ca_pa_combined: "",
  });

  const [photographOfUnsafeAct, setPhotographOfUnsafeAct] = useState(null);
  const [photographOfUnsafeActComment, setPhotographOfUnsafeActComment] =
    useState("");
  const [showAnnotationModal, setShowAnnotationModal] = useState(false);
  const [otherHazardText, setOtherHazardText] = useState("");

  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [showRiskMatrix, setShowRiskMatrix] = useState(false);
  const sigPadRef = useRef(null);

  useEffect(() => {
    const ctx = resolveMakerContext();
    setOrgId(ctx.orgId);
    setProjectId(ctx.projectId);
    setProjectName(ctx.projectName);
    setCurrentUserProfile(ctx.profile);
  }, []);

  useEffect(() => {
    if (
      !loadingMakers &&
      makers.length > 0 &&
      currentUserProfile &&
      !isCurrentUserInternal
    ) {
      const myCompany =
        currentUserProfile.contractor_name || currentUserProfile.company;
      if (myCompany) {
        const myMakers = makers.filter(
          (m) =>
            !m.isInternal &&
            (m.contractor_name === myCompany || m.company === myCompany),
        );
        if (myMakers.length > 0 && selectedMakers.length === 0) {
          setSelectedMakers([myMakers[0].id]);
        }
      }
    }
  }, [loadingMakers, makers, currentUserProfile, isCurrentUserInternal]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const parts = [
      formData.location_wing,
      formData.location_floor,
      formData.location_flat_area,
    ].filter(Boolean);
    const combined = parts.join(", ");
    if (formData.location_combined !== combined) {
      setFormData((prev) => ({ ...prev, location_combined: combined }));
    }
  }, [
    formData.location_wing,
    formData.location_floor,
    formData.location_flat_area,
  ]);

  const fetchMakers = async (pId) => {
    if (!pId) return;
    setLoadingMakers(true);
    try {
      const res = await getUsersByProject(pId);
      const users = Array.isArray(res?.data) ? res.data : [];
      setAllProjectUsers(users);
      const filteredMakers = users.filter((u) => {
        const isMaker =
          (u.roles && u.roles.includes("MAKER")) ||
          (u.role && u.role.toUpperCase() === "MAKER");
        const isChecker =
          (u.roles && u.roles.includes("CHECKER")) ||
          (u.role && u.role.toUpperCase() === "CHECKER");
        return isMaker && !isChecker;
      });
      const enrichedMakers = filteredMakers.map((u) => ({
        ...u,
        isInternal:
          u.user_type === "INTERNAL" ||
          (u.user_type !== "EXTERNAL" && !(u.contractor_name || u.company)),
      }));
      setMakers(enrichedMakers);
    } catch (err) {
      console.error("Failed to fetch makers", err);
      showToast("Failed to fetch makers", "error");
    } finally {
      setLoadingMakers(false);
    }
  };

  useEffect(() => {
    fetchObservationTemplate();
    if (orgId && projectId) {
      fetchContractors(orgId, projectId);
      fetchMakers(projectId);
    }
  }, [orgId, projectId]);

  const fetchContractors = async (oId, pId) => {
    try {
      const res = await listContractorNamesByOrg(oId, pId);
      setContractors(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch contractors", err);
    }
  };

  useEffect(() => {
    const parts = [];
    if (formData.corrective_action)
      parts.push(`<b>Corrective Action:</b>\n${formData.corrective_action}`);
    if (formData.preventive_action)
      parts.push(`<b>Preventive Action:</b>\n${formData.preventive_action}`);
    const combined = parts.join("\n\n");
    if (formData.ca_pa_combined !== combined) {
      setFormData((prev) => ({ ...prev, ca_pa_combined: combined }));
    }
  }, [formData.corrective_action, formData.preventive_action]);

  const fetchObservationTemplate = async () => {
    setLoadingTemplate(true);
    setTemplateId(null);
    try {
      const res = await listSafetyTemplates({
        template_type: "OBSERVATION",
        status: "ACTIVE",
      });
      const data = res?.data;
      const list = Array.isArray(data) ? data : data?.results || [];
      if (list.length > 0) {
        setTemplateId(list[0].id);
      } else {
        showToast(
          "No active observation template found for this project.",
          "error",
        );
      }
    } catch (err) {
      showToast("Failed to fetch observation template.", "error");
    } finally {
      setLoadingTemplate(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleHazardToggle = (hazard) => {
    setFormData((prev) => {
      const current = [...prev.hazard_categories];
      if (current.includes(hazard)) {
        return {
          ...prev,
          hazard_categories: current.filter((h) => h !== hazard),
        };
      } else {
        return { ...prev, hazard_categories: [...current, hazard] };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!templateId) {
      showToast("No active observation template. Cannot submit.", "error");
      return;
    }

    if (formData.hazard_categories.length === 0) {
      showToast("Please select at least one Hazard/Risk category.", "error");
      return;
    }

    if (!photographOfUnsafeAct) {
      showToast("Please provide a photograph of the unsafe act.", "error");
      return;
    }

    // Validate Maker Assignment
    if (selectedMakers.length === 0) {
      showToast(
        "Please assign at least one Maker for this observation.",
        "error",
      );
      return;
    }

    const datePart = (formData.target_date || "").split("T")[0];
    const timePart = (formData.target_date || "").split("T")[1];
    if (!datePart || !timePart) {
      showToast(
        "Please provide both date and time for the Target Date.",
        "error",
      );
      return;
    }

    const selectedDate = new Date(formData.target_date);
    const currentDate = new Date();
    if (selectedDate <= currentDate) {
      showToast("Target date and time must be in the future.", "error");
      return;
    }

    setIsSignatureModalOpen(true);
  };

  const confirmSubmit = async (signatureFile) => {
    setSubmitting(true);
    try {
      const payload = new FormData();
      payload.append("template", templateId);
      payload.append("org_id", orgId);
      payload.append("project_id", projectId);
      if (projectName) payload.append("project_name", projectName);
      payload.append("status", "PENDING_MAKER");

      Object.keys(formData).forEach((key) => {
        if (key === "corrective_action" || key === "preventive_action") {
          return; // Skip these, only send combined
        }
        if (key === "hazard_categories") {
          const mappedHazards = formData[key].map((h) =>
            h === "10. Other Hazards"
              ? `10. Other Hazards: ${otherHazardText}`
              : h,
          );
          payload.append(key, JSON.stringify(mappedHazards));
        } else {
          payload.append(key, formData[key] || "");
        }
      });

      if (photographOfUnsafeAct) {
        payload.append("photograph_of_unsafe_act", photographOfUnsafeAct);
        if (photographOfUnsafeActComment) {
          payload.append(
            "photograph_of_unsafe_act_comment",
            photographOfUnsafeActComment,
          );
        }
      }

      if (signatureFile) {
        payload.append("creator_signature", signatureFile);
      }

      // Append maker_ids
      const makerIds = selectedMakers;

      payload.append("maker_ids", JSON.stringify(makerIds));
      makerIds.forEach((id) => {
        payload.append("maker_ids", id);
      });

      let checkerId = null;
      let finalCheckerId = null;

      if (selectedMakers.length > 0 && allProjectUsers.length > 0) {
        const firstMakerId = selectedMakers[0];
        const firstMaker = makers.find((m) => m.id === firstMakerId);

        if (firstMaker && !firstMaker.isInternal) {
          const makerCompany = firstMaker.contractor_name || firstMaker.company;

          const contractorCheckers = allProjectUsers.filter(
            (u) =>
              ((u.roles && u.roles.includes("CHECKER")) ||
                (u.role && u.role.toUpperCase() === "CHECKER")) &&
              (u.user_type === "EXTERNAL" || u.contractor_name || u.company) &&
              (u.contractor_name === makerCompany ||
                u.company === makerCompany),
          );

          if (contractorCheckers.length > 0) {
            checkerId = contractorCheckers[0].id;
            if (isCurrentUserInternal) {
              finalCheckerId =
                currentUserProfile.id || currentUserProfile.user_id;
            } else {
              const internalCheckers = allProjectUsers.filter(
                (u) =>
                  ((u.roles && u.roles.includes("CHECKER")) ||
                    (u.role && u.role.toUpperCase() === "CHECKER")) &&
                  (u.user_type === "INTERNAL" ||
                    (!u.contractor_name && !u.company)),
              );
              if (internalCheckers.length > 0) {
                finalCheckerId = internalCheckers[0].id;
              }
            }
          }
        }
      }

      if (checkerId) {
        payload.append("checker_id", checkerId);
      }
      if (finalCheckerId) {
        payload.append("final_checker_id", finalCheckerId);
      }

      await createSafetyObservation(payload);
      showToast("Safety Observation created successfully!", "success");
      onBack();
    } catch (err) {
      let msg = "Submission failed";
      if (err?.response?.data) {
        if (typeof err.response.data === "object") {
          msg = JSON.stringify(err.response.data);
        } else {
          msg = String(err.response.data);
        }
      } else if (err?.message) {
        msg = err.message;
      }
      showToast(msg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl p-6 bg-slate-50 min-h-screen">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm transition hover:bg-slate-100"
          >
            <ArrowLeft className="h-5 w-5 text-slate-700" />
          </button>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100">
              <ClipboardList className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 sm:text-xl">
                Safety & Housekeeping Observation Report
              </h1>
              <p className="text-sm text-slate-500">
                Fill the form below to submit your observation.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
            <div className="mb-4 flex items-start gap-3">
              <QuestionBadge number={1} />
              <div>
                <p className="pt-1 text-sm font-semibold text-slate-800 sm:text-base">
                  WHAT UNSAFE ACT / CONDITION OBSERVED{" "}
                  <span className="text-red-500">*</span>
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <select
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-sm"
                  value={formData.unsafe_act_condition_category}
                  onChange={(e) =>
                    handleChange(
                      "unsafe_act_condition_category",
                      e.target.value,
                    )
                  }
                  required
                >
                  <option value="">Select Category...</option>
                  <option value="Unsafe Act">Unsafe Act</option>
                  <option value="Unsafe Condition">Unsafe Condition</option>
                </select>
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Short answer text"
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-sm"
                  value={formData.unsafe_act_condition_description}
                  onChange={(e) =>
                    handleChange(
                      "unsafe_act_condition_description",
                      e.target.value,
                    )
                  }
                  required
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
            <div className="mb-4 flex items-start gap-3">
              <QuestionBadge number={2} />
              <div>
                <p className="pt-1 text-sm font-semibold text-slate-800 sm:text-base">
                  LOCATION <span className="text-red-500">*</span>
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="text-xs text-slate-500 block mb-1">
                  Wing
                </label>
                <select
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-sm"
                  value={formData.location_wing}
                  onChange={(e) =>
                    handleChange("location_wing", e.target.value)
                  }
                  required
                >
                  <option value="">Select Wing...</option>
                  {WING_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">
                  Floor
                </label>
                <select
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-sm"
                  value={formData.location_floor}
                  onChange={(e) =>
                    handleChange("location_floor", e.target.value)
                  }
                  required
                >
                  <option value="">Select Floor...</option>
                  {FLOOR_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">
                  Flat/Area
                </label>
                <input
                  type="text"
                  placeholder="Text input"
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-sm"
                  value={formData.location_flat_area}
                  onChange={(e) =>
                    handleChange("location_flat_area", e.target.value)
                  }
                  required
                />
              </div>
            </div>
            <div className="hidden">
              <label className="text-xs text-slate-500 block mb-1">
                Combined Location
              </label>
              <input
                type="text"
                placeholder="Combined textbox"
                className="w-full rounded-lg border border-slate-300 p-2.5 text-sm bg-slate-100"
                value={formData.location_combined}
                onChange={(e) =>
                  handleChange("location_combined", e.target.value)
                }
                required
                readOnly
              />
            </div>
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
            <div className="mb-4 flex items-start gap-3">
              <QuestionBadge number={3} />
              <div>
                <p className="pt-1 text-sm font-semibold text-slate-800 sm:text-base">
                  PHOTOGRAPH OF UNSAFE ACT / CONDITION{" "}
                  <span className="text-red-500">*</span>
                </p>
              </div>
            </div>
            {!photographOfUnsafeAct ? (
              <label className="flex flex-col items-center justify-center w-full rounded-xl border-2 border-dashed border-orange-200 bg-white py-12 transition-colors hover:bg-orange-50/50 cursor-pointer">
                <UploadCloud className="mb-4 h-10 w-10 text-orange-400" />
                <p className="mb-2 text-sm text-slate-600">
                  <span className="font-semibold text-orange-600 hover:text-orange-700">
                    Click to upload
                  </span>{" "}
                  photo
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files?.length > 0) {
                        setPhotographOfUnsafeAct(e.target.files[0]);
                      }
                      e.target.value = null;
                    }}
                  />
                </p>
                <p className="text-xs text-slate-400">PNG, JPG, JPEG</p>
              </label>
            ) : (
              <div className="mt-4 rounded-lg border border-orange-200 bg-white p-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded bg-slate-100">
                      <img
                        src={URL.createObjectURL(photographOfUnsafeAct)}
                        alt="Observation"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 max-w-[200px] sm:max-w-xs">
                      <p className="truncate text-sm font-medium text-slate-700">
                        {photographOfUnsafeAct.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {(photographOfUnsafeAct.size / 1024 / 1024).toFixed(2)}{" "}
                        MB
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAnnotationModal(true)}
                      className="rounded p-1.5 text-blue-500 hover:bg-blue-50"
                    >
                      Annotate
                    </button>
                    <button
                      type="button"
                      onClick={() => setPhotographOfUnsafeAct(null)}
                      className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-red-500"
                    >
                      Remove
                    </button>
                  </div>
                </div>
                <div className="mt-2">
                  <input
                    type="text"
                    className="w-full rounded-lg border-slate-300 p-2 text-sm"
                    placeholder="Add any comments about this photo..."
                    value={photographOfUnsafeActComment}
                    onChange={(e) =>
                      setPhotographOfUnsafeActComment(e.target.value)
                    }
                  />
                </div>
              </div>
            )}
            <SafetyImageAnnotationModal
              open={showAnnotationModal}
              file={photographOfUnsafeAct}
              onClose={() => setShowAnnotationModal(false)}
              onSave={(annotatedFile) => {
                setPhotographOfUnsafeAct(annotatedFile);
                setShowAnnotationModal(false);
              }}
            />
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
            <div className="mb-4 flex items-start gap-3">
              <QuestionBadge number={4} />
              <div className="flex-1 flex items-center justify-between">
                <p className="pt-1 text-sm font-semibold text-slate-800 sm:text-base">
                  HAZARD/RISK <span className="text-red-500">*</span>
                </p>
                <button
                  type="button"
                  onClick={() => setShowRiskMatrix(true)}
                  className="text-xs font-bold bg-orange-50 text-orange-600 hover:bg-orange-100 border border-orange-200 px-3 py-1.5 rounded-lg shadow-sm transition-colors"
                >
                  View Risk Matrix
                </button>
              </div>
            </div>
            <label className="text-xs text-slate-500 block mb-2">
              Hazard (Checkboxes)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-4">
              {HAZARDS_OPTIONS.map((opt) => (
                <label key={opt} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="rounded border border-slate-300 text-orange-600 focus:ring-orange-500"
                    checked={formData.hazard_categories.includes(opt)}
                    onChange={() => handleHazardToggle(opt)}
                  />
                  {opt}
                </label>
              ))}
            </div>
            {formData.hazard_categories.includes("10. Other Hazards") && (
              <div className="mb-4">
                <label className="text-xs text-slate-500 block mb-1">
                  Please specify Other Hazards{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter other hazard details..."
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-sm"
                  value={otherHazardText}
                  onChange={(e) => setOtherHazardText(e.target.value)}
                  required
                />
              </div>
            )}
            <div>
              <label className="text-xs text-slate-500 block mb-1">Risk</label>
              <select
                className={`w-full rounded-lg border p-2.5 text-sm focus:ring-2 focus:ring-offset-1 focus:outline-none ${
                  formData.risk === "Low Risk"
                    ? "border-green-500 bg-green-50 text-green-700 focus:ring-green-500"
                    : formData.risk === "Medium Risk"
                      ? "border-yellow-500 bg-yellow-50 text-yellow-700 focus:ring-yellow-500"
                      : formData.risk === "High Risk"
                        ? "border-red-500 bg-red-50 text-red-700 focus:ring-red-500"
                        : "border-slate-300 focus:ring-orange-500 bg-white text-slate-700"
                }`}
                value={formData.risk}
                onChange={(e) => {
                  const val = e.target.value;
                  handleChange("risk", val);
                  if (val === "Medium Risk" || val === "High Risk") {
                    const now = new Date();
                    if (val === "Medium Risk") {
                      now.setHours(now.getHours() + 24);
                    } else if (val === "High Risk") {
                      now.setHours(now.getHours() + 4);
                    }
                    const pad = (num) => num.toString().padStart(2, "0");
                    const newDate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
                    handleChange("target_date", newDate);
                  } else if (val === "Low Risk" || val === "") {
                    handleChange("target_date", "");
                  }
                }}
                required
              >
                <option value="">Select Risk Level...</option>
                <option value="Low Risk">Low Risk</option>
                <option value="Medium Risk">Medium Risk</option>
                <option value="High Risk">High Risk</option>
              </select>
            </div>
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
            <div className="mb-4 flex items-start gap-3">
              <QuestionBadge number={5} />
              <div>
                <p className="pt-1 text-sm font-semibold text-slate-800 sm:text-base">
                  NAME OF CONTRACTOR <span className="text-red-500">*</span>
                </p>
              </div>
            </div>
            <select
              className="w-full max-w-sm rounded-lg border border-slate-300 p-2.5 text-sm"
              value={formData._contractor_selection || ""}
              onChange={(e) => {
                const val = e.target.value;
                handleChange("_contractor_selection", val);
                if (val !== "Others (Please specify)") {
                  handleChange("name_of_contractor", val);
                } else {
                  handleChange("name_of_contractor", "");
                }
              }}
              required={
                formData._contractor_selection !== "Others (Please specify)"
              }
            >
              <option value="">Select Contractor...</option>
              {contractors.map((c, idx) => {
                const val = c.name || c.contractor_name || c;
                return (
                  <option key={idx} value={val}>
                    {val}
                  </option>
                );
              })}
              <option value="Others (Please specify)">
                Others (Please specify)
              </option>
            </select>
            {formData._contractor_selection === "Others (Please specify)" && (
              <input
                type="text"
                placeholder="Manually enter contractor name..."
                className="w-full max-w-sm rounded-lg border border-slate-300 p-2.5 text-sm mt-3 block"
                value={formData.name_of_contractor}
                onChange={(e) =>
                  handleChange("name_of_contractor", e.target.value)
                }
                required
              />
            )}
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
            <div className="mb-4 flex items-start gap-3">
              <QuestionBadge number={6} />
              <div>
                <p className="pt-1 text-sm font-semibold text-slate-800 sm:text-base">
                  TARGET DATE <span className="text-red-500">*</span>
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <div>
                <label className="text-xs font-medium text-slate-500 block mb-1">
                  Date
                </label>
                <input
                  type="date"
                  className={`rounded-lg border p-2.5 text-sm w-[160px] focus:ring-2 focus:ring-offset-1 focus:outline-none ${
                    formData.risk === "Low Risk"
                      ? "border-green-500 bg-green-50 text-green-700 focus:ring-green-500"
                      : formData.risk === "Medium Risk"
                        ? "border-yellow-500 bg-yellow-50 text-yellow-700 focus:ring-yellow-500"
                        : formData.risk === "High Risk"
                          ? "border-red-500 bg-red-50 text-red-700 focus:ring-red-500"
                          : "border-slate-300 focus:ring-orange-500 bg-white text-slate-700"
                  }`}
                  value={(formData.target_date || "").split("T")[0] || ""}
                  onChange={(e) => {
                    const newDate = e.target.value;
                    const timePart =
                      (formData.target_date || "").split("T")[1] || "";
                    handleChange(
                      "target_date",
                      newDate ? `${newDate}T${timePart}` : "",
                    );
                  }}
                  required
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 block mb-1">
                  Time (hh:mm)
                </label>
                <input
                  type="time"
                  className={`rounded-lg border p-2.5 text-sm w-[130px] focus:ring-2 focus:ring-offset-1 focus:outline-none ${
                    formData.risk === "Low Risk"
                      ? "border-green-500 bg-green-50 text-green-700 focus:ring-green-500"
                      : formData.risk === "Medium Risk"
                        ? "border-yellow-500 bg-yellow-50 text-yellow-700 focus:ring-yellow-500"
                        : formData.risk === "High Risk"
                          ? "border-red-500 bg-red-50 text-red-700 focus:ring-red-500"
                          : "border-slate-300 focus:ring-orange-500 bg-white text-slate-700"
                  }`}
                  value={(formData.target_date || "").split("T")[1] || ""}
                  onChange={(e) => {
                    const newTime = e.target.value;
                    const datePart =
                      (formData.target_date || "").split("T")[0] ||
                      new Date().toISOString().split("T")[0];
                    handleChange("target_date", `${datePart}T${newTime}`);
                  }}
                  required
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
            <div className="mb-4 flex items-start gap-3">
              <QuestionBadge number={7} />
              <div>
                <p className="pt-1 text-sm font-semibold text-slate-800 sm:text-base">
                  CA/PA TO BE TAKEN <span className="text-red-500">*</span>
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-500 block mb-1">
                  Corrective Action
                </label>
                <input
                  type="text"
                  placeholder="Enter CA..."
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-sm"
                  value={formData.corrective_action}
                  onChange={(e) =>
                    handleChange("corrective_action", e.target.value)
                  }
                  required
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">
                  Preventive Action
                </label>
                <input
                  type="text"
                  placeholder="Enter PA..."
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-sm"
                  value={formData.preventive_action}
                  onChange={(e) =>
                    handleChange("preventive_action", e.target.value)
                  }
                  required
                />
              </div>
              <div className="hidden">
                <label className="text-xs text-slate-500 block mb-1">
                  Final Combined
                </label>
                <div
                  className="w-full rounded-lg border border-slate-300 p-3 text-sm bg-slate-100 whitespace-pre-wrap min-h-[5rem]"
                  dangerouslySetInnerHTML={{
                    __html:
                      formData.ca_pa_combined ||
                      "<span class='text-slate-400'>Final textbox will show these two inputs along with these two texts</span>",
                  }}
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
            <div className="mb-4 flex items-start gap-3">
              <QuestionBadge number={9} />
              <div>
                <p className="pt-1 text-sm font-semibold text-slate-800 sm:text-base">
                  ASSIGN TO MAKER(S)
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {isCurrentUserInternal ? (
                <div className="relative w-full max-w-md" ref={dropdownRef}>
                  <label className="text-xs text-slate-500 block mb-1">
                    Select Makers <span className="text-red-500">*</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-full flex items-center justify-between rounded-lg border border-slate-300 bg-white p-2.5 text-sm text-left shadow-sm hover:border-slate-400 focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer"
                  >
                    <span className="truncate text-slate-700 font-medium">
                      {selectedMakers.length === 0
                        ? "Select makers..."
                        : selectedMakers.length === makers.length &&
                            makers.length > 0
                          ? `All Makers (${makers.length} selected)`
                          : `${selectedMakers.length} Maker(s) Selected (${selectedMakers
                              .map((id) => {
                                const m = makers.find((x) => x.id === id);
                                return m ? m.display_name || m.username : "";
                              })
                              .filter(Boolean)
                              .join(", ")})`}
                    </span>
                    <svg
                      className={`h-4 w-4 text-slate-400 shrink-0 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute z-30 mt-1 left-0 right-0 rounded-lg border border-slate-200 bg-white shadow-xl max-h-72 flex flex-col overflow-hidden">
                      <div className="p-2 border-b border-slate-100 shrink-0 bg-slate-50/50">
                        <input
                          type="text"
                          placeholder="Search makers by name or email..."
                          className="w-full rounded-md border border-slate-300 p-2 text-xs focus:border-orange-500 focus:ring-orange-500 focus:outline-none"
                          value={makerSearch}
                          onChange={(e) => setMakerSearch(e.target.value)}
                        />
                        <div className="mt-2 flex items-center justify-between px-1">
                          <button
                            type="button"
                            onClick={() => {
                              if (selectedMakers.length === makers.length) {
                                setSelectedMakers([]);
                              } else {
                                setSelectedMakers(makers.map((m) => m.id));
                              }
                            }}
                            className="text-xs font-semibold text-orange-600 hover:text-orange-700 cursor-pointer"
                          >
                            {selectedMakers.length === makers.length
                              ? "Deselect All"
                              : "Select All"}
                          </button>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {selectedMakers.length} of {makers.length} selected
                          </span>
                        </div>
                      </div>

                      <div className="overflow-y-auto p-1.5 space-y-0.5 flex-1 min-h-[100px]">
                        {loadingMakers ? (
                          <p className="text-xs text-slate-500 p-2">
                            Loading makers...
                          </p>
                        ) : makers.length === 0 ? (
                          <p className="text-xs text-red-500 p-2 font-medium">
                            No makers found in this project.
                          </p>
                        ) : (
                          (() => {
                            const searchStr = makerSearch.toLowerCase();
                            const searchedMakers = makers.filter(
                              (m) =>
                                (m.display_name || "")
                                  .toLowerCase()
                                  .includes(searchStr) ||
                                (m.username || "")
                                  .toLowerCase()
                                  .includes(searchStr) ||
                                (m.email || "")
                                  .toLowerCase()
                                  .includes(searchStr),
                            );
                            const internalMakers = searchedMakers.filter(
                              (m) => m.isInternal,
                            );
                            const externalMakers = searchedMakers.filter(
                              (m) => !m.isInternal,
                            );

                            const renderMaker = (maker) => {
                              const isChecked = selectedMakers.includes(
                                maker.id,
                              );
                              return (
                                <div
                                  key={maker.id}
                                  onClick={() => {
                                    setSelectedMakers((prev) =>
                                      isChecked
                                        ? prev.filter((id) => id !== maker.id)
                                        : [...prev, maker.id],
                                    );
                                  }}
                                  className={`w-full flex items-center gap-3 rounded px-2.5 py-1.5 text-left text-xs transition-colors hover:bg-slate-50 cursor-pointer ${
                                    isChecked ? "bg-orange-50/30" : ""
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    className="rounded border border-slate-300 text-orange-600 focus:ring-orange-500 pointer-events-none"
                                    checked={isChecked}
                                    onChange={() => {}}
                                  />
                                  <div className="min-w-0 flex-1">
                                    <p className="font-semibold text-slate-700 truncate">
                                      {maker.display_name || maker.username}
                                    </p>
                                    <p className="text-slate-400 truncate text-[10px]">
                                      {maker.email}{" "}
                                      {maker.contractor_name
                                        ? `(${maker.contractor_name})`
                                        : ""}
                                    </p>
                                  </div>
                                </div>
                              );
                            };

                            return (
                              <>
                                {internalMakers.length > 0 && (
                                  <div className="mb-2">
                                    <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 sticky top-0 z-10 border-y border-slate-100">
                                      Internal
                                    </div>
                                    <div className="pt-1">
                                      {internalMakers.map(renderMaker)}
                                    </div>
                                  </div>
                                )}
                                {externalMakers.length > 0 && (
                                  <div className="mb-2">
                                    <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 sticky top-0 z-10 border-y border-slate-100">
                                      External
                                    </div>
                                    <div className="pt-1">
                                      {externalMakers.map(renderMaker)}
                                    </div>
                                  </div>
                                )}
                                {searchedMakers.length === 0 && (
                                  <p className="text-xs text-slate-500 p-2 italic">
                                    No matching makers found.
                                  </p>
                                )}
                              </>
                            );
                          })()
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full max-w-md">
                  <label className="text-xs text-slate-500 block mb-1">
                    Assigned Maker
                  </label>
                  <div className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-sm text-slate-700 font-medium">
                    {selectedMakers.length > 0
                      ? selectedMakers
                          .map((id) => {
                            const m = makers.find((x) => x.id === id);
                            return m ? m.display_name || m.username : "";
                          })
                          .filter(Boolean)
                          .join(", ")
                      : "Assigning..."}
                  </div>
                  <p className="mt-1 text-[10px] text-slate-400">
                    Auto-assigned to a maker in your company.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              type="button"
              onClick={onBack}
              disabled={submitting}
              className="mr-3 rounded-lg border border-slate-300 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {submitting ? "Submitting..." : "Submit Observation"}
            </button>
          </div>
        </form>
      </div>

      {isSignatureModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md animate-in zoom-in-95 rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="mb-4 text-xl font-bold text-slate-800">
              Sign to Submit Observation
            </h3>
            <div className="mb-6 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50">
              <SignatureCanvas
                ref={sigPadRef}
                penColor="black"
                canvasProps={{ className: "w-full h-48 rounded-xl" }}
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  sigPadRef.current?.clear();
                  setIsSignatureModalOpen(false);
                }}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (sigPadRef.current?.isEmpty()) {
                    showToast("Please provide your signature.", "error");
                    return;
                  }
                  const sigData = sigPadRef.current
                    .getCanvas()
                    .toDataURL("image/png");
                  fetch(sigData)
                    .then((res) => res.blob())
                    .then((blob) => {
                      const file = new File(
                        [blob],
                        `creator-signature-${Date.now()}.png`,
                        { type: "image/png" },
                      );
                      setIsSignatureModalOpen(false);
                      confirmSubmit(file);
                    });
                }}
                className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
                disabled={submitting}
              >
                {submitting ? "Submitting..." : "Submit Observation"}
              </button>
            </div>
          </div>
        </div>
      )}
      <RiskMatrixModal
        open={showRiskMatrix}
        onClose={() => setShowRiskMatrix(false)}
      />
    </div>
  );
}
