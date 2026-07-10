import React, { useState, useEffect } from "react";
import {
  Clock,
  CheckCircle,
  Send,
  Plus,
  ArrowLeft,
  ClipboardList,
  CircleAlert,
  ClipboardCheck,
  Upload,
  X as XIcon,
  XCircle,
} from "lucide-react";

import {
  listPermits,
  listPTWTemplates,
  createPermit,
  resolveActiveProjectId,
  resolveOrgId,
  getPTWTemplate,
  listContractorNamesByOrg,
  getUserGroups,
  permitWorkflowAction,
  submitPermit,
  getPermit,
  downloadPermitReport,
  downloadPermitRegister,
  getPermitTbtAttendance,
  savePermitTbtAttendance,
} from "../../../../api";
import { showToast } from "../../../../utils/toast";
import PermitSignatureModal from "../utils/PermitSignatureModal";
import PermitHeaderMeta from "../utils/PermitHeaderMeta";
import PermitReadonlyView from "../utils/PermitReadonlyView";
import { reservePermitNumber } from "../../../../api";

const dataUrlToFile = (input, filename = "signature.png") => {
  if (!input) return input;
  if (typeof File !== "undefined" && input instanceof File) return input;
  if (typeof Blob !== "undefined" && input instanceof Blob) {
    return new File([input], filename, { type: input.type || "image/png" });
  }
  if (typeof input !== "string" || !input.startsWith("data:")) {
    // Not a data URL and not already a File/Blob — return as-is and let the
    // backend's existing URL-fetch fallback in _decode_signature_payload handle it
    // if it turns out to be an http(s) URL instead.
    return input;
  }

  const [header, base64Data] = input.split(",");
  const mimeMatch = header.match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : "image/png";
  const binaryStr = atob(base64Data);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  return new File([bytes], filename, { type: mime });
};

const PermitFilters = ({ filters, setFilters, templates }) => {
  const updateFilter = (key, value) =>
    setFilters((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="mb-6 rounded-xl border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-foreground">Filters</h3>
        <button
          type="button"
          onClick={() => setFilters({ status: "all", type: "all" })}
          className="rounded-lg border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
        >
          Clear
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Status
          </label>
          <select
            value={filters.status}
            onChange={(e) => updateFilter("status", e.target.value)}
            className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
          >
            <option value="all">All</option>
            <option value="draft">Draft</option>
            <option value="issue_in_progress">Pending Issue</option>
            <option value="closure_in_progress">Pending Closure</option>
            <option value="issued">Issued</option>
            <option value="closed">Closed</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Type
          </label>
          <select
            value={filters.type}
            onChange={(e) => updateFilter("type", e.target.value)}
            className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
          >
            <option value="all">All Types</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

const MultiImageUploadArea = ({
  questionId,
  files = [],
  onChange,
  onRemove,
  label = "Upload permit checklist images",
}) => {
  const inputId = `ptw-question-images-${questionId}`;

  return (
    <div className="mt-4">
      <p className="mb-2 text-xs font-medium text-slate-500">{label}</p>

      <label
        htmlFor={inputId}
        className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-xs text-slate-500 transition-colors hover:border-orange-300 hover:bg-orange-50"
      >
        <Upload className="h-4 w-4" />
        <span>Click to upload multiple images</span>
      </label>

      <input
        id={inputId}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          onChange?.(questionId, e.target.files);
          e.target.value = "";
        }}
      />

      {files.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-3">
          {files.map((file, index) => {
            const previewUrl = URL.createObjectURL(file);

            return (
              <div
                key={`${file.name}-${file.lastModified}-${index}`}
                className="relative h-20 w-20 overflow-hidden rounded-lg border bg-white shadow-sm"
              >
                <img
                  src={previewUrl}
                  alt={`Permit checklist upload ${index + 1}`}
                  className="h-full w-full object-cover"
                  onLoad={() => URL.revokeObjectURL(previewUrl)}
                />

                <button
                  type="button"
                  onClick={() => onRemove?.(questionId, index)}
                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow hover:bg-red-600"
                  title="Remove image"
                >
                  <XIcon className="h-3 w-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default function PermitMakerDashboard() {
  const [projectId, setProjectId] = useState("");
  const [permits, setPermits] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("dashboard"); // "dashboard" | "create" | "closure_review" | "view"
  const [selectedPermit, setSelectedPermit] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [templateDetails, setTemplateDetails] = useState(null);
  const [formData, setFormData] = useState({});
  const [checklistResponse, setChecklistResponse] = useState({});
  const [checklistImages, setChecklistImages] = useState({});
  const [filters, setFilters] = useState({ status: "all", type: "all" });

  const [reservedPtwNo, setReservedPtwNo] = useState("");
  const [ptwReservationId, setPtwReservationId] = useState(null);

  // Custom field states
  const getUserData = () => {
    try {
      const token = localStorage.getItem("ACCESS_TOKEN");
      if (token) {
        return JSON.parse(atob(token.split(".")[1]));
      }
    } catch (e) {}
    try {
      const str = localStorage.getItem("USER_DATA");
      if (str) return JSON.parse(str);
    } catch (e) {}
    return {};
  };
  const userData = getUserData();
  const autoContractorName =
    userData.contractor_name || userData.company_name || "";
  const autoApplicantName = userData.username || userData.name || "";
  const [locationParts, setLocationParts] = useState({
    wing: "",
    floor: "",
    flat: "",
  });

  const [userGroups, setUserGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState("");

  // Closure modal state
  const [closureModalOpen, setClosureModalOpen] = useState(false);
  const [selectedPermitForClosure, setSelectedPermitForClosure] =
    useState(null);
  const [closureRemarks, setClosureRemarks] = useState("");
  const [closureGroupId, setClosureGroupId] = useState("");

  const [signatureModalOpen, setSignatureModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [tbtModalOpen, setTbtModalOpen] = useState(false);
  const [tbtRows, setTbtRows] = useState([
    {
      person_name: "",
      contractor_name: "",
      designation: "",
      signature: "",
    },
  ]);

  const [tbtSignatureModalOpen, setTbtSignatureModalOpen] = useState(false);
  const [activeTbtSignatureIndex, setActiveTbtSignatureIndex] = useState(null);
  // const [activeTbtSignatureValue, setActiveTbtSignatureValue] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const pid =
        resolveActiveProjectId?.() || localStorage.getItem("ACTIVE_PROJECT_ID");
      setProjectId(pid);

      const [permitsRes, templatesRes] = await Promise.all([
        listPermits({ project_id: pid, created_by_me: true }),
        listPTWTemplates(),
      ]);

      setPermits(
        Array.isArray(permitsRes?.data)
          ? permitsRes.data
          : permitsRes?.data?.results || [],
      );
      setTemplates(
        Array.isArray(templatesRes?.data)
          ? templatesRes.data
          : templatesRes?.data?.results || [],
      );
    } catch (err) {
      showToast("Failed to load permits", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await getUserGroups();
        const data = Array.isArray(res?.data)
          ? res.data
          : res?.data?.results || [];
        setUserGroups(data);
      } catch (err) {
        console.error("Failed to load user groups", err);
      }
    };
    fetchGroups();
  }, []);

  useEffect(() => {
    if (view === "create" && selectedTemplate) {
      const fetchTemplate = async () => {
        try {
          const res = await getPTWTemplate(selectedTemplate);
          setTemplateDetails(res?.data);
          const pid =
            resolveActiveProjectId?.() ||
            localStorage.getItem("ACTIVE_PROJECT_ID");

          const orgId =
            resolveOrgId?.() || localStorage.getItem("ORG_ID") || "";

          const reservationRes = await reservePermitNumber({
            template_id: selectedTemplate,
            project_id: pid || projectId || "",
            organization_id: orgId,
          });

          setReservedPtwNo(reservationRes?.data?.ptw_no || "");
          setPtwReservationId(reservationRes?.data?.reservation_id || null);

          const initialData = {};
          res?.data?.fields_config?.forEach((fc) => {
            const fd = fc.field_definition;
            if (fd) {
              const k = fd.key;
              const k_lower = k.toLowerCase();
              const l_lower = (fd.label || "").toLowerCase();
              if (
                k_lower === "contractor_name" ||
                k_lower.includes("contractor")
              ) {
                initialData[k] = autoContractorName;
              } else if (
                k_lower === "permit_applicant" ||
                k_lower === "applicant_name" ||
                k_lower.includes("applicant") ||
                l_lower.includes("applicant")
              ) {
                initialData[k] = autoApplicantName;
              }
            }
          });

          setFormData({
            ...initialData,
            contractor_name: autoContractorName,
            permit_applicant: autoApplicantName,
          });
          setChecklistResponse({});
          setChecklistImages({});
          setLocationParts({ wing: "", floor: "", flat: "" });
          setSelectedGroupId("");
        } catch (err) {
          showToast("Failed to load template details", "error");
          setTemplateDetails(null);
        }
      };
      fetchTemplate();
    } else {
      const initialData = {};
      templateDetails?.fields_config?.forEach((fc) => {
        const fd = fc.field_definition;
        if (fd) {
          const k = fd.key;
          const k_lower = k.toLowerCase();
          const l_lower = (fd.label || "").toLowerCase();
          if (k_lower === "contractor_name" || k_lower.includes("contractor")) {
            initialData[k] = autoContractorName;
          } else if (
            k_lower === "permit_applicant" ||
            k_lower === "applicant_name" ||
            k_lower.includes("applicant") ||
            l_lower.includes("applicant")
          ) {
            initialData[k] = autoApplicantName;
          }
        }
      });
      setTemplateDetails(null);
      setFormData({
        ...initialData,
        contractor_name: autoContractorName,
        permit_applicant: autoApplicantName,
      });
      setChecklistResponse({});
      setChecklistImages({});
      setLocationParts({ wing: "", floor: "", flat: "" });
      setSelectedGroupId("");
    }
  }, [selectedTemplate, view]);

  // const getFirstChecklistQuestion = () => {
  //   return templateDetails?.checklist_template?.questions?.[0] || null;
  // };

  // const openTbtModal = () => {
  //   const firstQuestion = getFirstChecklistQuestion();

  //   if (!firstQuestion) {
  //     showToast("First checklist question not found", "error");
  //     return;
  //   }

  //   setTbtModalOpen(true);
  // };

  // const updateTbtRow = (index, key, value) => {
  //   setTbtRows((prev) =>
  //     prev.map((row, i) =>
  //       i === index
  //         ? {
  //           ...row,
  //           [key]: value,
  //         }
  //         : row
  //     )
  //   );
  // };

  // const addTbtRow = () => {
  //   setTbtRows((prev) => [
  //     ...prev,
  //     {
  //       person_name: "",
  //       contractor_name: "",
  //       designation: "",
  //       signature: "",
  //     },
  //   ]);
  // };

  // const removeTbtRow = (index) => {
  //   setTbtRows((prev) => {
  //     if (prev.length === 1) return prev;
  //     return prev.filter((_, i) => i !== index);
  //   });
  // };

  const openTbtSignatureModal = (index) => {
    setActiveTbtSignatureIndex(index);
    setTbtSignatureModalOpen(true);
  };

  const handleTbtSignatureSuccess = (signatureDataUrl) => {
    if (activeTbtSignatureIndex === null) return;

    updateTbtRow(activeTbtSignatureIndex, "signature", signatureDataUrl);

    setTbtSignatureModalOpen(false);
    setActiveTbtSignatureIndex(null);
  };

  const getCleanedTbtRows = () => {
    const firstQuestionId =
      templateDetails?.checklist_template?.questions?.[0]?.id || null;

    return tbtRows
      .map((row) => ({
        question_id: firstQuestionId,
        person_name: String(row.person_name || "").trim(),
        contractor_name: String(row.contractor_name || "").trim(),
        designation: String(row.designation || "").trim(),
        signature: row.signature || "",
      }))
      .filter(
        (row) =>
          row.person_name ||
          row.contractor_name ||
          row.designation ||
          row.signature,
      );
  };

  // Sync location
  useEffect(() => {
    if (locationParts.wing || locationParts.floor || locationParts.flat) {
      setFormData((prev) => ({ ...prev, location: { ...locationParts } }));
    } else {
      setFormData((prev) => ({ ...prev, location: {} }));
    }
  }, [locationParts]);

  const handleRequestClosure = async (signatureData = null) => {
    if (!closureGroupId) return showToast("Select a checker group", "error");
    try {
      await permitWorkflowAction(selectedPermitForClosure.id, {
        action: "request_closure",
        next_group_id: closureGroupId,
        remarks: closureRemarks,
        signature: signatureData,
      });
      showToast("Closure requested successfully", "success");
      setView("dashboard");
      setSelectedPermit(null);
      setSelectedPermitForClosure(null);
      setClosureRemarks("");
      setClosureGroupId("");
      fetchData();
    } catch (err) {
      const data = err?.response?.data;
      const detail =
        data?.detail || data?.signature || data?.message || err?.message;

      if (
        typeof detail === "string" &&
        detail.toLowerCase().includes("signature")
      ) {
        setPendingAction(() => (sig) => handleRequestClosure(sig));
        setSignatureModalOpen(true);
      } else {
        showToast(detail || "Failed to request closure", "error");
      }
    }
  };

  const handleResubmit = async (permit, signatureData = null) => {
    try {
      const payload = signatureData ? { signature: signatureData } : {};
      await submitPermit(permit.id, payload);
      showToast("Permit resubmitted successfully", "success");
      fetchData();
    } catch (err) {
      const detail =
        err?.response?.data?.detail || err?.response?.data?.signature;
      if (
        typeof detail === "string" &&
        (detail.includes("Signature") || detail.includes("signature"))
      ) {
        setPendingAction(() => (sig) => handleResubmit(permit, sig));
        setSignatureModalOpen(true);
      } else {
        showToast(detail || "Resubmit failed", "error");
      }
    }
  };

  const handleChecklistImagesChange = (questionId, files) => {
    const imageFiles = Array.from(files || []).filter((file) =>
      String(file?.type || "").startsWith("image/"),
    );

    if (!imageFiles.length) {
      showToast("Please upload valid image files only.", "error");
      return;
    }

    setChecklistImages((prev) => ({
      ...prev,
      [questionId]: [...(prev[questionId] || []), ...imageFiles],
    }));
  };

  const removeChecklistImage = (questionId, index) => {
    setChecklistImages((prev) => {
      const current = prev[questionId] || [];
      const next = current.filter((_, i) => i !== index);

      return {
        ...prev,
        [questionId]: next,
      };
    });
  };

  const getFirstChecklistQuestion = () => {
    return templateDetails?.checklist_template?.questions?.[0] || null;
  };

  const openTbtModal = () => {
    const firstQuestion = getFirstChecklistQuestion();

    if (!firstQuestion) {
      showToast("First checklist question not found", "error");
      return;
    }

    setTbtModalOpen(true);
  };

  const updateTbtRow = (index, key, value) => {
    setTbtRows((prev) =>
      prev.map((row, i) =>
        i === index
          ? {
              ...row,
              [key]: value,
            }
          : row,
      ),
    );
  };

  const addTbtRow = () => {
    setTbtRows((prev) => [
      ...prev,
      {
        person_name: "",
        contractor_name: "",
        designation: "",
        signature: "",
      },
    ]);
  };

  const removeTbtRow = (index) => {
    setTbtRows((prev) => {
      if (prev.length === 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  };

  const saveTbtAttendance = () => {
    const firstQuestion = getFirstChecklistQuestion();

    if (!firstQuestion) {
      showToast("First checklist question not found", "error");
      return;
    }

    const hasAnyData = tbtRows.some(
      (row) =>
        String(row.person_name || "").trim() ||
        String(row.contractor_name || "").trim() ||
        String(row.designation || "").trim() ||
        row.signature,
    );

    if (!hasAnyData) {
      showToast("Please add at least one attendance detail", "error");
      return;
    }

    setTbtModalOpen(false);
    showToast("TBT attendance saved locally", "success");
  };

  const extractNumbers = (text) => {
    const matches = String(text || "").match(/\d+(\.\d+)?/g);
    return matches ? matches.map(Number) : [];
  };

  const validateReadingAgainstLimit = (reading, permissibleLimit) => {
    if (reading === "" || reading === null || reading === undefined) {
      return true;
    }

    const readingNumber = Number(String(reading).replace(/[^\d.]/g, ""));
    if (Number.isNaN(readingNumber)) return true;

    const nums = extractNumbers(permissibleLimit);

    if (!nums.length) return true;

    // Example: Oxygen 19.5 – 21%
    if (nums.length >= 2) {
      return readingNumber >= nums[0] && readingNumber <= nums[1];
    }

    // Example: 50ppm Max, 1200ppm Max, 10ppm Max, 1% LEL
    return readingNumber <= nums[0];
  };

  const validateSpecialSectionsBeforeSubmit = () => {
    const sections = templateDetails?.special_sections || [];

    for (const section of sections) {
      if (section.type !== "row_table") continue;

      for (const row of section.rows || []) {
        if (row.skip_reading_validation) continue;

        for (const col of section.columns || []) {
          if (col.validation?.type !== "compare_with_permissible_limit")
            continue;

          const readingValue =
            formData?.[section.key]?.rows?.[row.key]?.[col.key];

          const limitKey = col.validation.permissible_field;
          const permissibleLimit =
            formData?.[section.key]?.rows?.[row.key]?.[limitKey] ??
            row?.[limitKey] ??
            "";

          const isValid = validateReadingAgainstLimit(
            readingValue,
            permissibleLimit,
          );

          if (!isValid) {
            return {
              valid: false,
              message: `${row.gas || row.key}: Reading should be within permissible limit (${permissibleLimit}).`,
            };
          }
        }
      }
    }

    return { valid: true };
  };

  const handleCreateDraft = async (signatureData = null) => {
    if (!selectedTemplate) {
      return showToast("Select a template", "error");
    }
    if (!selectedGroupId) {
      return showToast("Select a user group to forward this permit", "error");
    }

    try {
      const missingFields = (templateDetails.fields_config || []).filter(
        (fc) => {
          const fd = fc.field_definition;
          const required =
            fc.required_override ?? fd?.required_default ?? false;
          const value = formData?.[fd?.key];

          return (
            required &&
            (value === undefined ||
              value === null ||
              value === "" ||
              (Array.isArray(value) && value.length === 0))
          );
        },
      );

      if (missingFields.length) {
        return showToast(
          `Please fill required field: ${missingFields[0].field_definition.label}`,
          "error",
        );
      }

      const missingChecklist = (
        templateDetails.checklist_template?.questions || []
      ).filter((q) => q.is_required && !checklistResponse[q.id]?.answer);

      if (missingChecklist.length) {
        return showToast(
          `Please answer checklist item: ${missingChecklist[0].question}`,
          "error",
        );
      }

      const specialValidation = validateSpecialSectionsBeforeSubmit();

      if (!specialValidation.valid) {
        return showToast(specialValidation.message, "error");
      }

      const formattedChecklist = Object.values(checklistResponse);
      const fd = new FormData();

      fd.append("template_id", String(selectedTemplate));
      fd.append("project_id", String(projectId || ""));
      fd.append(
        "organization_id",
        String(resolveOrgId?.() || localStorage.getItem("ORG_ID") || ""),
      );
      fd.append("submit_now", "true");
      fd.append("assigned_group_id", String(selectedGroupId));
      fd.append("form_data", JSON.stringify(formData || {}));
      fd.append("checklist_response", JSON.stringify(formattedChecklist || []));
      fd.append("ptw_no", reservedPtwNo || "");
      if (ptwReservationId) {
        fd.append("ptw_number_reservation_id", String(ptwReservationId));
      }
// console.log("Found signature data:", signatureData);
      if (signatureData) {
        // console.log("Appending signature data to form data");
        // console.log(dataUrlToFile(signatureData, `maker_signature_${Date.now()}.png`));
        fd.append(
          "maker_signature",
          dataUrlToFile(signatureData, `maker_signature_${Date.now()}.png`),
        );
      }

      Object.entries(checklistImages || {}).forEach(([questionId, files]) => {
        (files || []).forEach((file) => {
          fd.append(`checklist_images_${questionId}`, file);
        });
      });

      const createRes = await createPermit(fd);

      const createdPermit =
        createRes?.data?.data || createRes?.data || createRes;

      const createdPermitId = createdPermit?.id;

      if (createdPermitId) {
        const cleanedTbtRows = getCleanedTbtRows();

        if (cleanedTbtRows.length > 0) {
          const tbtFormData = new FormData();

          const rowsWithoutBase64 = cleanedTbtRows.map((row, index) => {
            if (row.signature) {
              const signatureFile = dataUrlToFile(
                row.signature,
                `tbt_signature_${index + 1}_${Date.now()}.png`,
              );

              tbtFormData.append(`signature_${index}`, signatureFile);
            }

            return {
              question_id: row.question_id,
              person_name: row.person_name,
              contractor_name: row.contractor_name,
              designation: row.designation,
            };
          });

          tbtFormData.append("rows", JSON.stringify(rowsWithoutBase64));

          await savePermitTbtAttendance(createdPermitId, tbtFormData);
        }
      }

      showToast("Permit raised successfully", "success");
      setView("dashboard");
      setChecklistImages({});
      setChecklistResponse({});
      setTbtRows([
        {
          person_name: "",
          contractor_name: "",
          designation: "",
          signature: "",
        },
      ]);
      fetchData();
    } catch (err) {
      const detail =
        err?.response?.data?.detail ||
        err?.response?.data?.signature ||
        err?.response?.data?.message ||
        err?.message;

      if (
        typeof detail === "string" &&
        detail.toLowerCase().includes("signature")
      ) {
        setPendingAction(() => (sig) => handleCreateDraft(sig));
        setSignatureModalOpen(true);
      } else {
        showToast(detail || "Creation failed", "error");
      }
    }
  };

  const handleOpenClosureReview = async (permit) => {
    try {
      const res = await getPermit(permit.id);
      setSelectedPermit(res.data);
      setSelectedPermitForClosure(res.data);
      setClosureRemarks("");
      setClosureGroupId("");
      setView("closure_review");
    } catch (err) {
      showToast("Failed to load permit details", "error");
    }
  };

  const handleViewPermit = async (permit) => {
    try {
      const res = await getPermit(permit.id);
      setSelectedPermit(res.data);
      setView("view");
    } catch (err) {
      showToast("Failed to load permit details", "error");
    }
  };

  // Download handler
  const handleDownloadReport = async (permit) => {
    try {
      await downloadPermitReport(permit.id);
      showToast("Report downloaded successfully", "success");
    } catch (err) {
      showToast(err?.message || "Failed to download report", "error");
    }
  };

  const handleDownloadRegister = async () => {
    try {
      const pid =
        resolveActiveProjectId?.() ||
        localStorage.getItem("ACTIVE_PROJECT_ID") ||
        projectId;
      await downloadPermitRegister(pid);
      showToast("Register downloaded successfully", "success");
    } catch (err) {
      showToast(err?.message || "Failed to download register", "error");
    }
  };

  const getStatus = (p) =>
    p.workflow_summary?.current_status ?? p.current_status;

  const filteredPermits = permits.filter((p) => {
    if (filters.status !== "all" && getStatus(p) !== filters.status)
      return false;
    if (
      filters.type !== "all" &&
      String(p.template_id) !== String(filters.type)
    )
      return false;
    return true;
  });

  const pendingApproval = filteredPermits.filter(
    (p) => getStatus(p) === "issue_in_progress",
  );
  const pendingClosure = filteredPermits.filter(
    (p) => getStatus(p) === "closure_in_progress",
  );
  const issuedPermits = filteredPermits.filter(
    (p) => getStatus(p) === "issued",
  );
  const closedPermits = filteredPermits.filter(
    (p) => getStatus(p) === "closed",
  );
  const rejectedPermits = filteredPermits.filter(
    (p) => getStatus(p) === "rejected",
  );
  const cancelledPermits = filteredPermits.filter(
    (p) => getStatus(p) === "cancelled",
  );

  const renderPermitBucket = (title, items, icon, colorClass, badgeClass) => {
    return (
      <div className="flex flex-col">
        <div className="mb-2 flex items-center gap-2">
          {icon}
          <h2
            className="text-sm font-semibold text-foreground sm:text-base"
            style={{ color: colorClass }}
          >
            {title}
          </h2>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {items.length}
          </span>
        </div>

        <div className="h-[480px] overflow-y-auto rounded-xl border bg-card shadow-sm">
          {items.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-muted-foreground">No items</p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-3 border-b border-border/50 p-4 last:border-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-foreground">
                    {item.template_name || `Permit #${item.id}`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(item.created_at).toLocaleDateString()}
                    {item.current_assigned_group_id &&
                      ` · Waiting on: ${userGroups.find((g) => g.id === item.current_assigned_group_id)?.name || `Group ${item.current_assigned_group_id}`}`}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${badgeClass}`}
                  >
                    {getStatus(item)}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleViewPermit(item)}
                    className="inline-flex items-center justify-center rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-100"
                  >
                    View
                  </button>
                  {getStatus(item) === "closed" && (
                    <button
                      type="button"
                      onClick={() => handleDownloadReport(item)}
                      className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-green-700"
                    >
                      Download Report
                    </button>
                  )}
                  {getStatus(item) === "rejected" && (
                    <button
                      type="button"
                      onClick={() => handleResubmit(item)}
                      className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:shadow-md"
                    >
                      Resubmit
                    </button>
                  )}
                  {item.workflow_permissions?.can_request_closure && (
                    <button
                      type="button"
                      onClick={() => handleOpenClosureReview(item)}
                      className="rounded-lg bg-gradient-to-r from-orange-400 to-orange-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:shadow-md"
                    >
                      Request Closure
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-muted/40 p-4 sm:p-6 md:p-10">
      {view === "dashboard" && (
        <div className="mx-auto max-w-4xl">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
                <ClipboardCheck className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground sm:text-2xl">
                  Permit To Work (Maker)
                </h1>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDownloadRegister}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-700 transition-all hover:bg-orange-100"
              >
                <ClipboardList className="h-4 w-4" />
                Download Register
              </button>
              <button
                onClick={() => setView("create")}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-400 to-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md"
              >
                <Plus className="h-4 w-4" />
                Raise Permit
              </button>
            </div>
          </div>

          <PermitFilters
            filters={filters}
            setFilters={setFilters}
            templates={templates}
          />

          {loading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Loading...
            </div>
          ) : (
            <>
              {/* Counter cards */}
              <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 sm:gap-4">
                {[
                  {
                    label: "Pending for Approval",
                    icon: <Clock className="h-3.5 w-3.5" />,
                    colorCls: "hsl(45, 93%, 47%)",
                    count: pendingApproval.length,
                  },
                  {
                    label: "Pending for Closer",
                    icon: <Send className="h-3.5 w-3.5" />,
                    colorCls: "hsl(24.6, 95%, 53.1%)",
                    count: pendingClosure.length,
                  },
                  {
                    label: "Issued",
                    icon: <CheckCircle className="h-3.5 w-3.5" />,
                    colorCls: "hsl(145, 65%, 42%)",
                    count: issuedPermits.length,
                  },
                  {
                    label: "Closed",
                    icon: <CheckCircle className="h-3.5 w-3.5" />,
                    colorCls: "hsl(200, 70%, 45%)",
                    count: closedPermits.length,
                  },
                  {
                    label: "Rejected",
                    icon: <CircleAlert className="h-3.5 w-3.5" />,
                    colorCls: "hsl(0, 75%, 55%)",
                    count: rejectedPermits.length,
                  },
                  {
                    label: "Cancelled",
                    icon: <XCircle className="h-3.5 w-3.5" />,
                    colorCls: "hsl(220, 9%, 46%)",
                    count: cancelledPermits.length,
                  },
                  {
                    label: "Total",
                    icon: <ClipboardList className="h-3.5 w-3.5" />,
                    colorCls: "hsl(263, 83%, 53%)",
                    count: filteredPermits.length,
                  },
                ].map(({ label, icon, colorCls, count }) => (
                  <div
                    key={label}
                    className="rounded-xl border bg-card p-4 shadow-sm"
                  >
                    <div
                      className="mb-1 flex items-center gap-1.5"
                      style={{ color: colorCls }}
                    >
                      {icon}
                      <span className="text-xs font-medium">{label}</span>
                    </div>
                    <p className="text-2xl font-bold text-foreground">
                      {Number.isFinite(Number(count)) ? Number(count) : 0}
                    </p>
                  </div>
                ))}
              </div>

              {/* Bucket Lists */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {renderPermitBucket(
                  "Pending for Approval",
                  pendingApproval,
                  <Clock className="h-4 w-4 text-muted-foreground" />,
                  "hsl(45, 93%, 47%)",
                  "bg-yellow-100 text-yellow-800",
                )}

                {renderPermitBucket(
                  "Pending for Closer",
                  pendingClosure,
                  <Send className="h-4 w-4 text-muted-foreground" />,
                  "hsl(24.6, 95%, 53.1%)",
                  "bg-orange-100 text-orange-800",
                )}

                {renderPermitBucket(
                  "Issued Permits",
                  issuedPermits,
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />,
                  "hsl(145, 65%, 42%)",
                  "bg-green-100 text-green-800",
                )}

                {renderPermitBucket(
                  "Closed Permits",
                  closedPermits,
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />,
                  "hsl(200, 70%, 45%)",
                  "bg-blue-100 text-blue-800",
                )}

                {renderPermitBucket(
                  "Rejected Permits",
                  rejectedPermits,
                  <CircleAlert className="h-4 w-4 text-muted-foreground" />,
                  "hsl(0, 75%, 55%)",
                  "bg-red-100 text-red-800",
                )}

                {renderPermitBucket(
                  "Cancelled Permits",
                  cancelledPermits,
                  <XCircle className="h-4 w-4 text-muted-foreground" />,
                  "hsl(220, 9%, 46%)",
                  "bg-slate-100 text-slate-700",
                )}
              </div>
            </>
          )}
        </div>
      )}

      {view === "create" && (
        <div className="mx-auto max-w-4xl">
          <button
            onClick={() => setView("dashboard")}
            className="mb-4 inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </button>

          <div className="mb-6 rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
                <ClipboardList className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground sm:text-xl">
                  Raise New Permit
                </h1>
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Select Template
              </label>
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="h-11 w-full rounded-lg border bg-white px-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              >
                <option value="">-- Select Template --</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            {templateDetails && (
              <div className="mt-6 border-t pt-6">
                <h3 className="mb-4 text-md font-semibold text-slate-800">
                  Permit Details
                </h3>

                <PermitHeaderMeta
                  headerConfig={templateDetails.header_config}
                  formatNo={templateDetails.format_no}
                  refNo={templateDetails.ref_no}
                  issuedDateText={templateDetails.issued_date_text}
                  revisionNo={templateDetails.revision_no}
                  projectId={projectId}
                  permitId={null}
                  ptwNo={reservedPtwNo}
                />

                {/* Render Fields */}
                <div className="grid gap-4 sm:grid-cols-2">
                  {templateDetails.fields_config?.map((fieldConfig) => {
                    const fieldDef = fieldConfig.field_definition;
                    const required =
                      fieldConfig.required_override ??
                      fieldDef.required_default ??
                      false;
                    return (
                      <div
                        key={fieldDef.key}
                        className={
                          ["textarea", "multiselect", "multi_select"].includes(
                            fieldDef.field_type,
                          )
                            ? "sm:col-span-2"
                            : ""
                        }
                      >
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                          {fieldDef.label}{" "}
                          {required && <span className="text-red-500">*</span>}
                        </label>
                        {fieldDef.key === "contractor_name" ? (
                          <div className="flex flex-col gap-1">
                            <input
                              type="text"
                              disabled
                              className="w-full rounded-lg border bg-slate-50 p-3 text-sm text-slate-500 outline-none cursor-not-allowed"
                              value={formData.contractor_name || ""}
                            />
                            <p className="text-xs text-slate-400">
                              Auto-filled from your profile
                            </p>
                          </div>
                        ) : fieldDef.key === "permit_applicant" ? (
                          <div className="flex flex-col gap-1">
                            <input
                              type="text"
                              disabled
                              className="w-full rounded-lg border bg-slate-50 p-3 text-sm text-slate-500 outline-none cursor-not-allowed"
                              value={formData.permit_applicant || ""}
                            />
                            <p className="text-xs text-slate-400">
                              Auto-filled from your profile
                            </p>
                          </div>
                        ) : fieldDef.key === "location" ? (
                          <div className="flex gap-2">
                            <select
                              className="min-w-0 flex-1 rounded-lg border p-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                              value={locationParts.wing}
                              onChange={(e) =>
                                setLocationParts({
                                  ...locationParts,
                                  wing: e.target.value,
                                })
                              }
                            >
                              <option value="">Wing</option>
                              {["A", "B", "C", "D", "E", "F", "G", "NTA"].map(
                                (w) => (
                                  <option key={w} value={w}>
                                    {w}
                                  </option>
                                ),
                              )}
                            </select>
                            <input
                              type="text"
                              placeholder="Floor"
                              className="min-w-0 flex-1 rounded-lg border p-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                              value={locationParts.floor}
                              onChange={(e) =>
                                setLocationParts({
                                  ...locationParts,
                                  floor: e.target.value,
                                })
                              }
                            />
                            <input
                              type="text"
                              placeholder="Area/Flat"
                              className="min-w-0 flex-1 rounded-lg border p-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                              value={locationParts.flat}
                              onChange={(e) =>
                                setLocationParts({
                                  ...locationParts,
                                  flat: e.target.value,
                                })
                              }
                            />
                          </div>
                        ) : fieldDef.field_type === "textarea" ? (
                          <textarea
                            className="w-full rounded-lg border p-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                            rows={3}
                            value={formData[fieldDef.key] || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                [fieldDef.key]: e.target.value,
                              })
                            }
                          />
                        ) : fieldDef.field_type === "multiselect" ||
                          fieldDef.field_type === "multi_select" ? (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
                            {(
                              fieldDef.validation_rules?.choices ||
                              fieldDef.validation_rules?.options ||
                              fieldDef.options ||
                              []
                            )?.map((opt) => (
                              <label
                                key={opt}
                                className="flex items-center gap-3 text-sm cursor-pointer rounded-xl border bg-slate-50/50 p-3 hover:bg-orange-50 hover:border-orange-200 transition-colors"
                              >
                                <input
                                  type="checkbox"
                                  checked={(
                                    formData[fieldDef.key] || []
                                  ).includes(opt)}
                                  onChange={(e) => {
                                    const curr = formData[fieldDef.key] || [];
                                    if (e.target.checked)
                                      setFormData({
                                        ...formData,
                                        [fieldDef.key]: [...curr, opt],
                                      });
                                    else
                                      setFormData({
                                        ...formData,
                                        [fieldDef.key]: curr.filter(
                                          (x) => x !== opt,
                                        ),
                                      });
                                  }}
                                  className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-600 accent-orange-600"
                                />
                                <span className="font-medium text-slate-700">
                                  {opt}
                                </span>
                              </label>
                            ))}
                          </div>
                        ) : (
                          <input
                            type={
                              fieldDef.field_type === "number"
                                ? "number"
                                : "text"
                            }
                            className={`rounded-lg border p-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 ${fieldDef.field_type === "number" ? "w-full sm:w-48" : "w-full"}`}
                            value={formData[fieldDef.key] || ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFormData({
                                ...formData,
                                [fieldDef.key]:
                                  fieldDef.field_type === "number" && val !== ""
                                    ? Number(val)
                                    : val,
                              });
                            }}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Render Checklist Questions */}
                {templateDetails.checklist_template?.questions?.length > 0 && (
                  <div className="mt-8">
                    <h3 className="mb-4 text-md font-semibold text-slate-800">
                      Checklist Points
                    </h3>
                    <div className="space-y-4">
                      {templateDetails.checklist_template.questions.map(
                        (q, idx) => {
                          const options =
                            q.options && q.options.length > 0
                              ? q.options.map((o) => o.value)
                              : ["Yes", "No", "N/A"];
                          const currentAnswer = checklistResponse[q.id]?.answer;
                          const currentRemarks =
                            checklistResponse[q.id]?.remarks || "";

                          return (
                            <div
                              key={q.id}
                              className="rounded-xl border bg-card p-5 shadow-sm transition-all hover:shadow-md mb-4"
                            >
                              <div className="mb-4 flex items-start justify-between gap-3">
                                <div className="flex items-start gap-3">
                                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-xs font-bold text-white shadow-sm">
                                    {idx + 1}
                                  </span>

                                  <div className="mt-1 flex-1">
                                    <p className="text-[15px] font-semibold text-slate-800">
                                      {q.question}
                                    </p>
                                  </div>
                                </div>

                                {idx === 0 && (
                                  <button
                                    type="button"
                                    onClick={openTbtModal}
                                    className="shrink-0 rounded-lg border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-700 transition-colors hover:bg-orange-100"
                                  >
                                    TBT Attendance
                                  </button>
                                )}
                              </div>
                              <div className="ml-11">
                                <div className="flex flex-wrap gap-2 mb-4">
                                  {options.map((opt) => {
                                    const label = opt;
                                    const active = currentAnswer === label;
                                    const normalizedLabel = String(label)
                                      .trim()
                                      .toLowerCase();
                                    const toneClasses =
                                      normalizedLabel === "yes"
                                        ? {
                                            active:
                                              "border-green-500 bg-green-500 text-white shadow-sm",
                                            idle: "border-green-200 bg-green-50 text-green-700 hover:bg-green-100",
                                          }
                                        : normalizedLabel === "no"
                                          ? {
                                              active:
                                                "border-red-500 bg-red-500 text-white shadow-sm",
                                              idle: "border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
                                            }
                                          : normalizedLabel === "n/a" ||
                                              normalizedLabel === "na"
                                            ? {
                                                active:
                                                  "border-yellow-500 bg-yellow-500 text-white shadow-sm",
                                                idle: "border-yellow-200 bg-yellow-50 text-yellow-700 hover:bg-yellow-100",
                                              }
                                            : {
                                                active:
                                                  "border-orange-500 bg-orange-500 text-white shadow-sm",
                                                idle: "border-gray-200 bg-white text-gray-700 hover:bg-orange-50",
                                              };

                                    return (
                                      <button
                                        key={label}
                                        type="button"
                                        onClick={() =>
                                          setChecklistResponse((prev) => ({
                                            ...prev,
                                            [q.id]: {
                                              ...(prev[q.id] || {}),
                                              question_id: q.id,
                                              answer: label,
                                              remarks:
                                                prev[q.id]?.remarks ||
                                                currentRemarks ||
                                                "",
                                            },
                                          }))
                                        }
                                        className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${
                                          active
                                            ? toneClasses.active
                                            : toneClasses.idle
                                        }`}
                                      >
                                        {label}
                                      </button>
                                    );
                                  })}
                                </div>

                                <div className="mt-4">
                                  <label className="mb-1.5 block text-xs font-medium text-slate-500">
                                    Remark / Comment
                                  </label>
                                  <input
                                    type="text"
                                    placeholder="Add comment "
                                    className="w-full rounded-lg border border-slate-300 p-2.5 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                                    value={currentRemarks}
                                    onChange={(e) =>
                                      setChecklistResponse((prev) => ({
                                        ...prev,
                                        [q.id]: {
                                          ...(prev[q.id] || {}),
                                          question_id: q.id,
                                          answer:
                                            prev[q.id]?.answer ||
                                            currentAnswer ||
                                            "",
                                          remarks: e.target.value,
                                        },
                                      }))
                                    }
                                  />
                                </div>

                                <MultiImageUploadArea
                                  questionId={q.id}
                                  files={checklistImages[q.id] || []}
                                  label="Upload permit checklist images"
                                  onChange={handleChecklistImagesChange}
                                  onRemove={removeChecklistImage}
                                />
                              </div>
                            </div>
                          );
                        },
                      )}
                    </div>
                  </div>
                )}

                {templateDetails?.special_sections?.length > 0 && (
                  <div className="mt-8 border-t pt-6">
                    {templateDetails.special_sections.map((section) => (
                      <div key={section.key} className="mb-6">
                        <h3 className="mb-4 text-md font-semibold text-slate-800">
                          {section.title}
                        </h3>

                        {section.type === "row_table" ? (
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse border border-slate-300 text-sm">
                              <thead>
                                <tr className="bg-slate-100">
                                  <th className="border border-slate-300 p-2 text-left w-12">
                                    S.No
                                  </th>
                                  {section.columns?.map((col) => (
                                    <th
                                      key={col.key}
                                      className="border border-slate-300 p-2 text-left"
                                    >
                                      {col.label}
                                    </th>
                                  ))}
                                </tr>
                              </thead>

                              <tbody>
                                {section.rows?.map((row, idx) => (
                                  <tr key={row.key}>
                                    <td className="border border-slate-300 p-2">
                                      {idx + 1}
                                    </td>

                                    {section.columns?.map((col) => {
                                      const editableBy = col.editable_by || [
                                        "maker",
                                      ];

                                      const rowAllowed =
                                        !Array.isArray(col.editable_row_keys) ||
                                        col.editable_row_keys.length === 0 ||
                                        col.editable_row_keys.includes(row.key);

                                      const makerCanEdit =
                                        col.editable &&
                                        editableBy.includes("maker") &&
                                        rowAllowed;

                                      if (!makerCanEdit) {
                                        const currentValue =
                                          formData[section.key]?.rows?.[
                                            row.key
                                          ]?.[col.key] ??
                                          row[col.key] ??
                                          "";

                                        return (
                                          <td
                                            key={col.key}
                                            className="border border-slate-300 p-2 text-slate-600"
                                          >
                                            {currentValue || "-"}
                                          </td>
                                        );
                                      }

                                      const currentValue =
                                        formData[section.key]?.rows?.[
                                          row.key
                                        ]?.[col.key] ?? "";

                                      return (
                                        <td
                                          key={col.key}
                                          className="border border-slate-300 p-1"
                                        >
                                          <input
                                            type={
                                              col.field_type === "number"
                                                ? "number"
                                                : "text"
                                            }
                                            className="w-full rounded border-0 p-1.5 text-sm outline-none focus:ring-2 focus:ring-orange-200"
                                            value={currentValue}
                                            onChange={(e) => {
                                              const val = e.target.value;

                                              setFormData((prev) => ({
                                                ...prev,
                                                [section.key]: {
                                                  ...(prev[section.key] || {}),
                                                  rows: {
                                                    ...(prev[section.key]
                                                      ?.rows || {}),
                                                    [row.key]: {
                                                      ...(prev[section.key]
                                                        ?.rows?.[row.key] ||
                                                        {}),
                                                      [col.key]:
                                                        col.field_type ===
                                                          "number" && val !== ""
                                                          ? Number(val)
                                                          : val,
                                                    },
                                                  },
                                                },
                                              }));
                                            }}
                                          />
                                        </td>
                                      );
                                    })}
                                  </tr>
                                ))}
                              </tbody>
                            </table>

                            {section.footer_fields?.length > 0 && (
                              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {section.footer_fields.map((f) => (
                                  <div key={f.key}>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">
                                      {f.label}
                                    </label>

                                    <input
                                      type={
                                        f.field_type === "number"
                                          ? "number"
                                          : "text"
                                      }
                                      className="w-full rounded-lg border p-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                                      value={
                                        formData[section.key]?.[f.key] ?? ""
                                      }
                                      onChange={(e) => {
                                        const val = e.target.value;

                                        setFormData((prev) => ({
                                          ...prev,
                                          [section.key]: {
                                            ...(prev[section.key] || {}),
                                            [f.key]:
                                              f.field_type === "number" &&
                                              val !== ""
                                                ? Number(val)
                                                : val,
                                          },
                                        }));
                                      }}
                                    />
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : section.type === "table" ? (
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {section.fields?.map((f) => (
                              <div key={f.key}>
                                <label className="mb-2 block text-sm font-medium text-slate-700">
                                  {f.label}
                                </label>

                                <input
                                  type={
                                    f.field_type === "number"
                                      ? "number"
                                      : "text"
                                  }
                                  className="w-full rounded-lg border p-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                                  value={formData[section.key]?.[f.key] ?? ""}
                                  onChange={(e) => {
                                    const val = e.target.value;

                                    setFormData((prev) => ({
                                      ...prev,
                                      [section.key]: {
                                        ...(prev[section.key] || {}),
                                        [f.key]:
                                          f.field_type === "number" &&
                                          val !== ""
                                            ? Number(val)
                                            : val,
                                      },
                                    }));
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                        ) : section.type === "conditional_group" ? (
                          <div className="rounded-lg border border-slate-300 bg-white">
                            <div className="grid grid-cols-1 md:grid-cols-[260px_1fr]">
                              <div className="border-b border-slate-300 p-3 md:border-b-0 md:border-r">
                                <p className="text-sm font-semibold text-slate-800">
                                  {section.left_label || section.title}
                                </p>
                              </div>

                              <div className="p-3">
                                <div className="mb-3 flex flex-wrap items-center gap-6">
                                  <p className="text-sm font-semibold text-slate-800">
                                    {section.condition_field?.label || "Select"}
                                  </p>

                                  {(section.condition_field?.options || []).map(
                                    (opt) => {
                                      const currentValue =
                                        formData[section.key]?.[
                                          section.condition_field.key
                                        ] || "";

                                      return (
                                        <label
                                          key={opt.value}
                                          className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-800"
                                        >
                                          <span>{opt.label}</span>

                                          <input
                                            type="radio"
                                            name={`${section.key}_${section.condition_field.key}`}
                                            value={opt.value}
                                            checked={currentValue === opt.value}
                                            onChange={(e) => {
                                              const value = e.target.value;

                                              setFormData((prev) => ({
                                                ...prev,
                                                [section.key]: {
                                                  ...(prev[section.key] || {}),
                                                  [section.condition_field.key]:
                                                    value,
                                                },
                                              }));
                                            }}
                                            className="h-4 w-4 accent-orange-600"
                                          />
                                        </label>
                                      );
                                    },
                                  )}
                                </div>

                                {formData[section.key]?.[
                                  section.show_when?.field
                                ] === section.show_when?.value && (
                                  <div className="border-t border-slate-200 pt-3">
                                    {section.conditional_title && (
                                      <p className="mb-3 text-sm font-bold text-slate-900">
                                        {section.conditional_title}
                                      </p>
                                    )}

                                    <div className="space-y-4">
                                      {(section.fields || []).map((field) => {
                                        const currentValue =
                                          formData[section.key]?.[field.key];

                                        const shouldHide =
                                          field.show_when &&
                                          field.show_when.operator ===
                                            "contains" &&
                                          !(
                                            Array.isArray(
                                              formData[section.key]?.[
                                                field.show_when.field
                                              ],
                                            ) &&
                                            formData[section.key]?.[
                                              field.show_when.field
                                            ]?.includes(field.show_when.value)
                                          );

                                        if (shouldHide) return null;

                                        if (
                                          field.field_type === "multi_select"
                                        ) {
                                          const selectedValues = Array.isArray(
                                            currentValue,
                                          )
                                            ? currentValue
                                            : [];

                                          return (
                                            <div key={field.key}>
                                              <label className="mb-2 block text-sm font-semibold text-slate-800">
                                                {field.label}
                                                {field.required && (
                                                  <span className="text-red-500">
                                                    {" "}
                                                    *
                                                  </span>
                                                )}
                                              </label>

                                              <div className="flex flex-wrap gap-3">
                                                {(field.options || []).map(
                                                  (option) => (
                                                    <label
                                                      key={option}
                                                      className="flex cursor-pointer items-center gap-2 rounded-lg border bg-slate-50 px-3 py-2 text-sm text-slate-700 hover:bg-orange-50"
                                                    >
                                                      <input
                                                        type="checkbox"
                                                        checked={selectedValues.includes(
                                                          option,
                                                        )}
                                                        onChange={(e) => {
                                                          const nextValues = e
                                                            .target.checked
                                                            ? [
                                                                ...selectedValues,
                                                                option,
                                                              ]
                                                            : selectedValues.filter(
                                                                (x) =>
                                                                  x !== option,
                                                              );

                                                          setFormData(
                                                            (prev) => ({
                                                              ...prev,
                                                              [section.key]: {
                                                                ...(prev[
                                                                  section.key
                                                                ] || {}),
                                                                [field.key]:
                                                                  nextValues,
                                                              },
                                                            }),
                                                          );
                                                        }}
                                                        className="h-4 w-4 accent-orange-600"
                                                      />

                                                      <span>{option}</span>
                                                    </label>
                                                  ),
                                                )}
                                              </div>
                                            </div>
                                          );
                                        }

                                        return (
                                          <div key={field.key}>
                                            <label className="mb-2 block text-sm font-semibold text-slate-800">
                                              {field.label}
                                              {field.required && (
                                                <span className="text-red-500">
                                                  {" "}
                                                  *
                                                </span>
                                              )}
                                            </label>

                                            <input
                                              type={
                                                field.field_type === "number"
                                                  ? "number"
                                                  : "text"
                                              }
                                              className="w-full rounded-lg border border-slate-300 p-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                                              value={currentValue ?? ""}
                                              onChange={(e) => {
                                                const val = e.target.value;

                                                setFormData((prev) => ({
                                                  ...prev,
                                                  [section.key]: {
                                                    ...(prev[section.key] ||
                                                      {}),
                                                    [field.key]:
                                                      field.field_type ===
                                                        "number" && val !== ""
                                                        ? Number(val)
                                                        : val,
                                                  },
                                                }));
                                              }}
                                            />
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-slate-500">
                            Unsupported special section type: {section.type}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Forward To / Approval Group */}
                <div className="mt-8 border-t pt-6">
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Forward To (User Group)
                  </label>
                  <select
                    value={selectedGroupId}
                    onChange={(e) => setSelectedGroupId(e.target.value)}
                    className="h-11 w-full max-w-sm rounded-lg border bg-white px-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  >
                    <option value="">-- Select User Group --</option>
                    {userGroups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 border-t pt-6 mt-6">
              <button
                onClick={() => setView("dashboard")}
                className="rounded-lg border px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Back
              </button>
              {templateDetails && (
                <button
                  onClick={() => handleCreateDraft()}
                  className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700"
                >
                  Raise Permit
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {view === "closure_review" && selectedPermit && (
        <div className="mx-auto max-w-4xl">
          <button
            onClick={() => {
              setView("dashboard");
              setSelectedPermit(null);
              setSelectedPermitForClosure(null);
            }}
            className="mb-4 inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </button>

          <div className="mb-6 rounded-xl border bg-card p-5 shadow-sm">
            <h1 className="text-lg font-bold text-foreground sm:text-xl">
              Request Closure -{" "}
              {selectedPermit.template_snapshot?.template_name ||
                selectedPermit.template_name ||
                `Permit #${selectedPermit.id}`}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Review issued permit details before requesting closure.
            </p>
          </div>

          <PermitHeaderMeta
            headerConfig={selectedPermit.template_snapshot?.header_config}
            formatNo={selectedPermit.template_snapshot?.format_no}
            refNo={selectedPermit.template_snapshot?.ref_no}
            issuedDateText={selectedPermit.template_snapshot?.issued_date_text}
            revisionNo={selectedPermit.template_snapshot?.revision_no}
            projectId={selectedPermit.project_id}
            permitId={selectedPermit.id}
            ptwNo={selectedPermit.ptw_no}
          />

          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <div className="mb-6 rounded-lg bg-green-50 p-4">
              <p className="text-sm font-semibold text-green-700">
                Current Status: {selectedPermit.current_status}
              </p>
            </div>

            {selectedPermit?.template_snapshot?.field_definitions?.length >
              0 && (
              <div className="mb-6 border-b pb-6">
                <h3 className="mb-4 text-lg font-semibold text-slate-800">
                  Permit Details
                </h3>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {selectedPermit.template_snapshot.field_definitions.map(
                    (field) => {
                      const value = selectedPermit.form_data?.[field.key];

                      return (
                        <div
                          key={field.key}
                          className="rounded-lg border bg-slate-50 p-3"
                        >
                          <p className="text-xs font-medium text-slate-500">
                            {field.label}
                          </p>
                          <p className="mt-1 text-sm font-medium text-slate-900">
                            {Array.isArray(value)
                              ? value.join(", ")
                              : value || "N/A"}
                          </p>
                        </div>
                      );
                    },
                  )}
                </div>
              </div>
            )}

            {selectedPermit?.template_snapshot?.checklist_questions?.length >
              0 && (
              <div className="mb-6 border-b pb-6">
                <h3 className="mb-4 text-lg font-semibold text-slate-800">
                  Checklist Answers
                </h3>

                <div className="space-y-4">
                  {selectedPermit.template_snapshot.checklist_questions.map(
                    (q, index) => {
                      const response = selectedPermit.checklist_response?.find(
                        (r) => String(r.question_id) === String(q.id),
                      );

                      return (
                        <div
                          key={q.id}
                          className="rounded-xl border bg-card p-5 shadow-sm"
                        >
                          <div className="mb-3 flex items-start gap-3">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white">
                              {index + 1}
                            </span>

                            <div className="flex-1">
                              <p className="text-sm font-semibold text-slate-800">
                                {q.question}
                              </p>
                              <p className="mt-2 text-sm text-slate-600">
                                Answer:{" "}
                                <span className="font-semibold text-slate-900">
                                  {response?.answer || "No answer"}
                                </span>
                              </p>

                              {response?.remarks && (
                                <p className="mt-1 text-sm text-slate-600">
                                  Remark: {response.remarks}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    },
                  )}
                </div>
              </div>
            )}

            <div className="mb-6">
              <h3 className="mb-4 text-lg font-semibold text-slate-800">
                Closure Request
              </h3>

              <label className="mb-2 block text-sm font-medium text-slate-700">
                Forward To Checker Group <span className="text-red-500">*</span>
              </label>

              <select
                className="mb-4 h-11 w-full max-w-sm rounded-lg border bg-white px-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                value={closureGroupId}
                onChange={(e) => setClosureGroupId(e.target.value)}
              >
                <option value="">-- Select Checker Group --</option>
                {userGroups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>

              <label className="mb-2 block text-sm font-medium text-slate-700">
                Closure Remarks
              </label>

              <textarea
                className="w-full rounded-lg border p-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                rows={3}
                value={closureRemarks}
                onChange={(e) => setClosureRemarks(e.target.value)}
                placeholder="Enter closure request remarks..."
              />
            </div>

            <div className="flex justify-end gap-3 border-t pt-6">
              <button
                type="button"
                onClick={() => setView("dashboard")}
                className="rounded-lg border px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => handleRequestClosure()}
                disabled={!closureGroupId}
                className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
              >
                Submit Closure Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Model */}
      {view === "view" && selectedPermit && (
        <PermitReadonlyView
          permit={selectedPermit}
          userType="maker"
          titlePrefix="View Permit"
          onBack={() => {
            setView("dashboard");
            setSelectedPermit(null);
          }}
        />
      )}

      {tbtModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  TBT Attendance
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Add attendance details for toolbox talk.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setTbtModalOpen(false)}
                className="rounded-lg px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="max-h-[65vh] overflow-auto p-6">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="w-14 border p-2 text-center">SN.</th>
                    <th className="border p-2 text-left">Name of Person</th>
                    <th className="border p-2 text-left">Name of Contractor</th>
                    <th className="border p-2 text-left">Designation</th>
                    <th className="border p-2 text-left">Signature</th>
                    <th className="w-24 border p-2 text-center">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {tbtRows.map((row, index) => (
                    <tr key={index}>
                      <td className="border p-2 text-center">{index + 1}</td>

                      <td className="border p-2">
                        <input
                          type="text"
                          value={row.person_name || ""}
                          onChange={(e) =>
                            updateTbtRow(index, "person_name", e.target.value)
                          }
                          placeholder="Name of person"
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                        />
                      </td>

                      <td className="border p-2">
                        <input
                          type="text"
                          value={row.contractor_name || ""}
                          onChange={(e) =>
                            updateTbtRow(
                              index,
                              "contractor_name",
                              e.target.value,
                            )
                          }
                          placeholder="Name of contractor"
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                        />
                      </td>

                      <td className="border p-2">
                        <input
                          type="text"
                          value={row.designation || ""}
                          onChange={(e) =>
                            updateTbtRow(index, "designation", e.target.value)
                          }
                          placeholder="Designation"
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                        />
                      </td>

                      <td className="border p-2">
                        <div className="flex items-center gap-3">
                          {row.signature ? (
                            <img
                              src={row.signature}
                              alt="TBT Signature"
                              className="h-10 max-w-[120px] rounded border object-contain"
                            />
                          ) : (
                            <span className="text-xs text-slate-400">
                              No signature
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => openTbtSignatureModal(index)}
                            className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-700 hover:bg-orange-100"
                          >
                            {row.signature ? "Edit Signature" : "Add Signature"}
                          </button>
                        </div>
                      </td>

                      <td className="border p-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeTbtRow(index)}
                          disabled={tbtRows.length === 1}
                          className="rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs font-semibold text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <button
                type="button"
                onClick={addTbtRow}
                className="mt-4 rounded-lg border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-100"
              >
                + Add Row
              </button>
            </div>

            <div className="flex justify-end gap-3 border-t px-6 py-4">
              <button
                type="button"
                onClick={() => setTbtModalOpen(false)}
                className="rounded-lg border px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={saveTbtAttendance}
                className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700"
              >
                Save Attendance
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TBT attendance signature modal */}
      <PermitSignatureModal
        isOpen={tbtSignatureModalOpen}
        onClose={() => {
          setTbtSignatureModalOpen(false);
          setActiveTbtSignatureIndex(null);
        }}
        onSignatureSuccess={handleTbtSignatureSuccess}
        actionTitle="TBT Attendance"
      />

      {/* Signature Modal */}
      <PermitSignatureModal
        isOpen={signatureModalOpen}
        onClose={() => {
          setSignatureModalOpen(false);
          setPendingAction(null);
        }}
        onSignatureSuccess={(sigData) => {
          setSignatureModalOpen(false);
          if (pendingAction) pendingAction(sigData);
        }}
      />
    </div>
  );
}
