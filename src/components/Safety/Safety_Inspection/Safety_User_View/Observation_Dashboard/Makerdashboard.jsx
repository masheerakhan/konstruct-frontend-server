import React, { useState, useEffect, useRef } from "react";
import { generateObservationReportPDF } from "../../../../../utils/generateObservationReportPDF";
import {
  ArrowLeft,
  Clock,
  ClipboardCheck,
  FolderOpen,
  Eye,
  Wrench,
  ClipboardList,
  CircleAlert,
  Plus,
  CheckCircle,
  Download,
  TriangleAlert,
  X as XIcon,
  Send,
  Upload,
  Activity,
} from "lucide-react";
import SignatureCanvas from "react-signature-canvas";

import {
  getSafetyChecklist,
  getSafetyTemplate,
  listSafetyCategories,
  listSafetyChecklists,
  listSafetyTemplates,
  resolveActiveProjectId,
  resolveOrgId,
  listContractorNamesByOrg,
  downloadSafetyReport,
  listSafetyObservations,
  getSafetyObservationById,
  getSafetyObservationPDF,
  updateSafetyObservation,
  downloadSafetyObservationReport,
  submitSafetyChecklist,
  createAndSubmitSafetyChecklist,
} from "../../../../../api";
import { showToast } from "../../../../../utils/toast";
import { getCurrentUserId } from "../../../../../utils/UserUtils";

import SafetyChecklistHistoryModal from "../../SafetyChecklistHistoryModal";
import SafetyChecklistReadonlyModal from "../../SafetyChecklistReadonlyModal";
import SafetyObservationReadonlyModal from "../../SafetyObservationReadonlyModal";

import SafetyChecklistSignOffSection from "../../SafetyChecklistSignOffSection";

import SafetyImageAnnotationModal from "../../SafetyImageAnnotationModal";
import CreateSafetyObservation from "./CreateSafetyObservation";
import RectifySafetyObservation from "./RectifySafetyObservation";

const MAKER_QUEUE_STATUSES = [
  "Pending for Maker",
  "rejected_by_checker",
  "rejected_by_supervisor",
  "created",
];

function collectActiveMakerSubs(detail) {
  const out = [];
  (detail?.items || []).forEach((item) => {
    const sub = (item.submissions || []).find((s) =>
      MAKER_QUEUE_STATUSES.includes(s.status),
    );
    if (sub) out.push(sub);
  });
  return out;
}

function isRejectReworkStatus(st) {
  return st === "rejected_by_checker" || st === "rejected_by_supervisor";
}

/** First full forward submit (no reject rework): this request clears every maker-queue submission. */
function shouldShowMakerSignatureModal(
  detail,
  submissionsForApi,
  isBulkSubmit,
) {
  const makerSubs = collectActiveMakerSubs(detail);
  if (!makerSubs.length) return false;
  if (makerSubs.some((s) => isRejectReworkStatus(s.status))) return false;

  if (isBulkSubmit) return true;

  const ids = new Set(makerSubs.map((s) => s.id));
  const touched = new Set(
    (submissionsForApi || []).map((p) => p.submission_id).filter(Boolean),
  );
  if (ids.size !== touched.size) return false;
  for (const id of ids) {
    if (!touched.has(id)) return false;
  }
  return true;
}

// ─── Shared inline UI helpers ────────────────────────────────
const QuestionBadge = ({ number }) => (
  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-xs font-bold text-white shadow-sm">
    {number}
  </span>
);

const decodeJwtPayload = (token) => {
  try {
    if (!token || typeof token !== "string") return null;

    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");

    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join(""),
    );

    return JSON.parse(json);
  } catch {
    return null;
  }
};

const getCurrentUserProfile = () => {
  let fallbackProfile = null;

  // 1. First try known user object keys
  const objectKeys = [
    "USER_DATA",
    "user",
    "currentUser",
    "userData",
    "authUser",
  ];

  for (const key of objectKeys) {
    try {
      const raw = localStorage.getItem(key);

      if (!raw || raw === "undefined" || raw === "null") continue;

      const parsed = JSON.parse(raw);

      if (parsed?.user_type) {
        return parsed;
      }

      if (!fallbackProfile && (parsed?.user_id || parsed?.id)) {
        fallbackProfile = parsed;
      }
    } catch {
      // ignore and continue
    }
  }

  // 2. Try known token keys
  const tokenKeys = [
    "ACCESS_TOKEN",
    "access",
    "access_token",
    "accessToken",
    "token",
    "authToken",
  ];

  for (const key of tokenKeys) {
    const token = localStorage.getItem(key);
    const decoded = decodeJwtPayload(token);

    if (decoded?.user_type || decoded?.user_id) {
      return fallbackProfile ? { ...fallbackProfile, ...decoded } : decoded;
    }
  }

  // 3. Last fallback: scan localStorage for any JWT that contains user_type
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    const value = localStorage.getItem(key);

    const decoded = decodeJwtPayload(value);

    if (decoded?.user_type || decoded?.user_id) {
      return fallbackProfile ? { ...fallbackProfile, ...decoded } : decoded;
    }
  }

  return fallbackProfile || {};
};

export const autoResizeTextarea = (el) => {
  if (!el) return;

  el.style.height = "auto";
  el.style.height = `${el.scrollHeight}px`;
};

const resolveMakerContext = () => {
  const profile = getCurrentUserProfile() || {};

  const accesses = Array.isArray(profile?.accesses) ? profile.accesses : [];

  const activeAccess =
    accesses.find((a) => a?.active && a?.project_id) ||
    accesses.find((a) => a?.project_id) ||
    null;

  const resolvedProjectId = String(
    resolveActiveProjectId?.() ||
      localStorage.getItem("ACTIVE_PROJECT_ID") ||
      localStorage.getItem("active_project_id") ||
      localStorage.getItem("PROJECT_ID") ||
      localStorage.getItem("project_id") ||
      activeAccess?.project_id ||
      profile?.project_id ||
      "",
  ).trim();

  const resolvedOrgId = String(
    resolveOrgId?.() ||
      localStorage.getItem("ORG_ID") ||
      localStorage.getItem("org_id") ||
      localStorage.getItem("organization_id") ||
      profile?.org ||
      profile?.org_id ||
      profile?.organization_id ||
      profile?.organization?.id ||
      "",
  ).trim();

  // Keep storage ready so existing api helpers also work.
  if (resolvedProjectId) {
    localStorage.setItem("ACTIVE_PROJECT_ID", resolvedProjectId);
    localStorage.setItem("PROJECT_ID", resolvedProjectId);
  }

  if (resolvedOrgId) {
    localStorage.setItem("ORG_ID", resolvedOrgId);
    localStorage.setItem("org_id", resolvedOrgId);
  }

  return {
    projectId: resolvedProjectId,
    orgId: resolvedOrgId,
    profile,
  };
};

export const resolveMediaUrl = (path) => {
  if (!path) return null;

  let cleanPath = path;
  if (cleanPath.startsWith("http://127.0.0.1:8001")) {
    cleanPath = cleanPath.replace("http://127.0.0.1:8001", "");
  } else if (cleanPath.startsWith("http://localhost:8001")) {
    cleanPath = cleanPath.replace("http://localhost:8001", "");
  } else if (
    cleanPath.startsWith("http://") ||
    cleanPath.startsWith("https://")
  ) {
    return cleanPath;
  }

  const base =
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname === "localhost"
      ? "http://127.0.0.1:8001"
      : "https://konstruct.world";

  if (!cleanPath.startsWith("/")) cleanPath = "/" + cleanPath;
  return `${base}${cleanPath}`;
};

const PhotoViewButton = ({ url, label = "View Photo" }) => {
  const finalUrl = resolveMediaUrl(url);
  if (!finalUrl) return null;

  return (
    <a
      href={finalUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100 hover:border-blue-300"
    >
      <Eye className="h-3.5 w-3.5" />
      {label}
    </a>
  );
};

// const PhotoUploadArea = ({
//     id,
//     previewBase64,
//     onFileChange,
//     onRemove,
//     label = "Attach photo",
// }) => {
//     const inputRef = useRef(null);
//     const previewUrl = previewBase64
//         ? typeof previewBase64 === "string"
//             ? resolveMediaUrl(previewBase64)
//             : URL.createObjectURL(previewBase64)
//         : null;

//     const handleRemove = () => {
//         if (inputRef.current) {
//             inputRef.current.value = "";
//         }
//         onRemove?.();
//     };

//     return (
//         <div className="mt-3">
//             <p className="mb-1.5 text-xs font-medium text-muted-foreground">{label}</p>

//             {previewUrl ? (
//                 <div className="relative inline-block">
//                     <img
//                         src={previewUrl}
//                         alt="Preview"
//                         className="h-20 w-20 rounded-lg border border-border object-cover shadow-sm"
//                     />
//                     <button
//                         type="button"
//                         onClick={handleRemove}
//                         className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow transition-colors hover:bg-red-600"
//                         aria-label="Remove uploaded photo"
//                     >
//                         <XIcon className="h-3 w-3" />
//                     </button>
//                 </div>
//             ) : (
//                 <label
//                     htmlFor={`photo-upload-${id}`}
//                     className="flex cursor-pointer items-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:bg-muted/60"
//                 >
//                     <Upload className="h-4 w-4" />
//                     <span>Click to upload or take a photo</span>
//                 </label>
//             )}

//             <input
//                 ref={inputRef}
//                 id={`photo-upload-${id}`}
//                 type="file"
//                 accept="image/*"
//                 onChange={onFileChange}
//                 className="hidden"
//             />
//         </div>
//     );
// };

const PhotoUploadArea = ({
  id,
  previewBase64,
  onFileChange,
  onRemove,
  label = "Attach photo",
}) => {
  const inputRef = useRef(null);
  const [annotationFile, setAnnotationFile] = useState(null);
  const [annotationOpen, setAnnotationOpen] = useState(false);

  const previewUrl = previewBase64
    ? typeof previewBase64 === "string"
      ? resolveMediaUrl(previewBase64)
      : URL.createObjectURL(previewBase64)
    : null;

  const handleInputChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!String(file.type || "").startsWith("image/")) {
      showToast("Please upload a valid image file.", "error");

      if (inputRef.current) {
        inputRef.current.value = "";
      }

      return;
    }

    setAnnotationFile(file);
    setAnnotationOpen(true);
  };

  const handleAnnotatedSave = (annotatedFile) => {
    setAnnotationOpen(false);
    setAnnotationFile(null);

    /*
            Keep existing parent usage working.
            Parent code already expects e.target.files[0].
        */
    onFileChange?.({
      target: {
        files: [annotatedFile],
      },
    });

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleAnnotationClose = () => {
    setAnnotationOpen(false);
    setAnnotationFile(null);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleRemove = () => {
    if (inputRef.current) {
      inputRef.current.value = "";
    }

    setAnnotationOpen(false);
    setAnnotationFile(null);

    onRemove?.();
  };

  return (
    <div className="mt-3">
      <p className="mb-1.5 text-xs font-medium text-muted-foreground">
        {label}
      </p>

      {previewUrl ? (
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
            aria-label="Remove uploaded photo"
          >
            <XIcon className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <label
          htmlFor={`photo-upload-${id}`}
          className="flex cursor-pointer items-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:bg-muted/60"
        >
          <Upload className="h-4 w-4" />
          <span>Click to upload, mark and attach photo</span>
        </label>
      )}

      <input
        ref={inputRef}
        id={`photo-upload-${id}`}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
      />

      <SafetyImageAnnotationModal
        open={annotationOpen}
        file={annotationFile}
        onClose={handleAnnotationClose}
        onSave={handleAnnotatedSave}
      />
    </div>
  );
};

export const TemplateOptionButtons = ({ options = [], value, onChange }) => {
  const normalizedOptions =
    Array.isArray(options) && options.length ? options : ["Yes", "No", "N/A"];

  return (
    <div className="flex flex-wrap gap-2">
      {normalizedOptions.map((opt) => {
        const label =
          typeof opt === "string"
            ? opt
            : opt?.label || opt?.name || opt?.title || "";

        if (!label) return null;

        const active = value === label;
        const normalizedLabel = String(label).trim().toLowerCase();
        const toneClasses =
          normalizedLabel === "yes"
            ? {
                active: "border-green-500 bg-green-500 text-white shadow-sm",
                idle: "border-green-200 bg-green-50 text-green-700 hover:bg-green-100",
              }
            : normalizedLabel === "no"
              ? {
                  active: "border-red-500 bg-red-500 text-white shadow-sm",
                  idle: "border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
                }
              : normalizedLabel === "n/a" || normalizedLabel === "na"
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
            onClick={() => onChange(label)}
            className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${
              active ? toneClasses.active : toneClasses.idle
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
};

const RemarksBubble = ({ label, text }) => (
  <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
    <span className="font-semibold">{label}:</span> {text}
  </div>
);

// FILTER HELPERS

const ChecklistFilters = ({
  filters,
  setFilters,
  contractorOptions,
  typeOptions,
  isObservations,
  wingOptions,
  hazardOptions,
}) => {
  const updateFilter = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      fromDate: "",
      toDate: "",
      contractor: "all",
      status: "all",
      type: "all",
      wing: "all",
      hazard: "all",
      risk: "all",
    });
  };

  return (
    <div className="mb-6 rounded-xl border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-foreground">Filters</h3>

        <button
          type="button"
          onClick={clearFilters}
          className="rounded-lg border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
        >
          Clear
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            From Date
          </label>
          <input
            type="date"
            value={filters.fromDate}
            onChange={(e) => updateFilter("fromDate", e.target.value)}
            className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            To Date
          </label>
          <input
            type="date"
            value={filters.toDate}
            onChange={(e) => updateFilter("toDate", e.target.value)}
            className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Contractor
          </label>
          <select
            value={filters.contractor}
            onChange={(e) => updateFilter("contractor", e.target.value)}
            className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
          >
            <option value="all">All Contractors</option>
            {contractorOptions.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>

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
            {isObservations ? (
              <>
                <option value="open">Open</option>
                <option value="closed">Closed</option>
                <option value="rectification">Rectification</option>
                <option value="re rectification">Re Rectification</option>
              </>
            ) : (
              <>
                <option value="rejected">Rejected</option>
                <option value="approved">Approved</option>
              </>
            )}
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
            {isObservations ? (
              <>
                <option value="Unsafe Act">Unsafe Act</option>
                <option value="Unsafe Condition">Unsafe Condition</option>
              </>
            ) : (
              typeOptions.map((title) => (
                <option key={title} value={title}>
                  {title}
                </option>
              ))
            )}
          </select>
        </div>
        {isObservations && (
          <>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Wing
              </label>
              <select
                value={filters.wing}
                onChange={(e) => updateFilter("wing", e.target.value)}
                className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              >
                <option value="all">All Wings</option>
                {wingOptions?.map((wing) => (
                  <option key={wing} value={wing}>
                    {wing}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Hazard
              </label>
              <select
                value={filters.hazard}
                onChange={(e) => updateFilter("hazard", e.target.value)}
                className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              >
                <option value="all">All Hazards</option>
                {hazardOptions?.map((hazard) => (
                  <option key={hazard} value={hazard}>
                    {hazard}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Risk
          </label>
          <select
            value={filters.risk}
            onChange={(e) => updateFilter("risk", e.target.value)}
            className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
          >
            <option value="all">All Risks</option>
            <option value="Low Risk">Low Risk</option>
            <option value="Medium Risk">Medium Risk</option>
            <option value="High Risk">High Risk</option>
          </select>
        </div>
      </div>
    </div>
  );
};

const normalizeFilterValue = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const getChecklistCreatedDate = (item) =>
  item?.created_at ? String(item.created_at).slice(0, 10) : "";

const getChecklistContractor = (item) =>
  String(
    item?.contractor_name ||
      item?.name_of_contractor ||
      item?.safety_report_meta?.name_of_contractor ||
      "",
  ).trim();

const getChecklistType = (item) =>
  String(item?.template_title || item?.name || "").trim();

const isApprovedChecklist = (item) =>
  String(item?.status || "").toLowerCase() === "completed" ||
  String(item?.status || "").toLowerCase() === "approved" ||
  String(item?.review_state?.closed_reason || "").toLowerCase() === "approved";

const isRejectedChecklist = (item) =>
  String(item?.status || "").toLowerCase() === "closed_rejected" ||
  String(item?.status || "").toLowerCase() === "rejected" ||
  Number(item?.maker_rejected_points || 0) > 0;

const applyChecklistFilters = (list, filters) => {
  return list.filter((item) => {
    const createdDate = getChecklistCreatedDate(item);

    if (filters.fromDate && (!createdDate || createdDate < filters.fromDate)) {
      return false;
    }

    if (filters.toDate && (!createdDate || createdDate > filters.toDate)) {
      return false;
    }

    if (
      filters.contractor !== "all" &&
      normalizeFilterValue(getChecklistContractor(item)) !==
        normalizeFilterValue(filters.contractor)
    ) {
      return false;
    }

    if (
      filters.type !== "all" &&
      item.unsafe_act_condition_category !== filters.type
    ) {
      return false;
    }

    if (filters.wing !== "all") {
      const w = filters.wing.toLowerCase();
      if (item.wing?.toLowerCase() !== w) return false;
    }

    let hazardsArray = [];
    if (item.hazard) {
      try {
        const parsed = JSON.parse(item.hazard);
        if (Array.isArray(parsed)) hazardsArray = parsed;
        else if (typeof parsed === "string") hazardsArray = [parsed];
      } catch (e) {
        if (typeof item.hazard === "string") hazardsArray = [item.hazard];
      }
    }

    if (filters.hazard !== "all") {
      if (!hazardsArray || hazardsArray.length === 0) return false;
      // Strict match check
      const hasHazard = hazardsArray.some(
        (h) => h === filters.hazard || h.startsWith(filters.hazard + ":"),
      );
      if (!hasHazard) return false;
    }

    if (filters.risk && filters.risk !== "all") {
      if (item.risk !== filters.risk) return false;
    }

    if (filters.status !== "all") {
      if (filters.status === "open") {
        if (isApprovedChecklist(item) || isRejectedChecklist(item))
          return false;
      } else if (filters.status === "closed") {
        if (!isApprovedChecklist(item) && !isRejectedChecklist(item))
          return false;
      } else if (filters.status === "rectification") {
        if (
          item.completed_by_maker !== false ||
          item.rejected_by_checker !== true
        )
          return false;
      } else if (filters.status === "re rectification") {
        if (
          item.completed_by_maker !== true ||
          item.approved_by_checker !== false ||
          item.rejected_by_checker === true
        )
          return false;
      } else if (filters.status === "approved" && !isApprovedChecklist(item)) {
        return false;
      } else if (filters.status === "rejected" && !isRejectedChecklist(item)) {
        return false;
      }
    }

    return true;
  });
};

// const ReportHeaderInfoCard = ({ detail }) => {
//     const meta =
//         detail?.report_header_meta ||
//         detail?.safety_report_meta ||
//         detail?.report_meta ||
//         {};

//     const rows = [
//         ["Format No.", meta.format_no],
//         ["Revision No.", meta.revision_no],
//         ["Issued Date", meta.issued_date],
//         ["Revision Date", meta.revision_date],
//         ["Project", meta.project],
//         ["Inspection Report No.", meta.inspection_report_no],
//         ["Name of Contractor", meta.name_of_contractor],
//         ["Date of Inspection", meta.date_of_inspection],
//         ["Make / Model", meta.make_model],
//         ["Identification No.", meta.identification_no],
//         ["Location", meta.location],
//         ["Name of Operator", meta.name_of_operator],
//     ];

//     return (
//         <div className="mb-6 rounded-xl border bg-card p-5 shadow-sm">
//             <h2 className="mb-4 text-sm font-bold text-foreground">
//                 Checklist Details
//             </h2>

//             <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
//                 {rows.map(([label, value]) => (
//                     <div
//                         key={label}
//                         className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2"
//                     >
//                         <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
//                             {label}
//                         </p>
//                         <p className="mt-1 break-words text-sm font-semibold text-foreground">
//                             {String(value || "").trim() || "—"}
//                         </p>
//                     </div>
//                 ))}
//             </div>
//         </div>
//     );
// };

// const formatTodayDDMMYYYY = () => {
//     const now = new Date();
//     const dd = String(now.getDate()).padStart(2, "0");
//     const mm = String(now.getMonth() + 1).padStart(2, "0");
//     const yyyy = now.getFullYear();

//     return `${dd}-${mm}-${yyyy}`;
// };

// const ReadOnlyHeaderField = ({ label, value }) => (
//     <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
//         <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
//             {label}
//         </p>
//         <p className="mt-1 break-words text-sm font-semibold text-foreground">
//             {String(value || "").trim() || "—"}
//         </p>
//     </div>
// );

// const EditableHeaderInput = ({ label, value, onChange, placeholder }) => (
//     <div>
//         <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
//             {label}
//         </label>
//         <input
//             type="text"
//             value={value || ""}
//             onChange={(e) => onChange(e.target.value)}
//             className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
//             placeholder={placeholder}
//         />
//     </div>
// );

// const ReportHeaderCreateCard = ({
//     selectedTemplate,
//     reportMeta,
//     setReportMeta,
//     projectId,
//     currentUserProfile,
//     isInternalMaker,
//     contractors,
//     contractorsLoading,
// }) => {
//     const templateMeta = selectedTemplate?.report_header_meta || {};

//     const reportPrefix = String(
//         templateMeta.inspection_report_prefix ||
//         templateMeta.inspection_report_no ||
//         ""
//     )
//         .trim()
//         .replace(/-$/, "");

//     const externalContractorName =
//         currentUserProfile?.contractor_name ||
//         templateMeta.name_of_contractor ||
//         "";

//     return (
//         <div className="mb-4 rounded-xl border bg-card p-5 shadow-sm">
//             <div className="mb-4">
//                 <h3 className="text-sm font-semibold text-foreground">
//                     Inspection Details
//                 </h3>
//                 {/* <p className="mt-1 text-xs text-muted-foreground">
//                     Report header details. Only input fields are editable.
//                 </p> */}
//             </div>

//             <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
//                 <ReadOnlyHeaderField
//                     label="Format No."
//                     value={templateMeta.format_no}
//                 />

//                 <ReadOnlyHeaderField
//                     label="Revision No."
//                     value={templateMeta.revision_no || "R01"}
//                 />

//                 <ReadOnlyHeaderField
//                     label="Issued Date"
//                     value={templateMeta.issued_date}
//                 />

//                 <ReadOnlyHeaderField
//                     label="Revision Date"
//                     value={templateMeta.revision_date}
//                 />

//                 <ReadOnlyHeaderField
//                     label="Project"
//                     value={templateMeta.project || (projectId ? `Project ${projectId}` : "")}
//                 />

//                 <ReadOnlyHeaderField
//                     label="Inspection Report No."
//                     value={
//                         reportPrefix
//                             ? `${reportPrefix}-Auto`
//                             : "Auto-generated on submit"
//                     }
//                 />

//                 <ReadOnlyHeaderField
//                     label="Date of Inspection"
//                     value={formatTodayDDMMYYYY()}
//                 />

//                 {isInternalMaker ? (
//                     <div>
//                         <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
//                             Name of Contractor
//                         </label>

//                         <select
//                             value={reportMeta.name_of_contractor}
//                             onChange={(e) =>
//                                 setReportMeta((prev) => ({
//                                     ...prev,
//                                     name_of_contractor: e.target.value,
//                                 }))
//                             }
//                             disabled={contractorsLoading}
//                             className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
//                         >
//                             <option value="">
//                                 {contractorsLoading
//                                     ? "Loading contractors..."
//                                     : "Select Contractor"}
//                             </option>

//                             {contractors.map((contractor) => {
//                                 const name =
//                                     typeof contractor === "string"
//                                         ? contractor
//                                         : contractor?.name || contractor?.contractor_name || "";

//                                 if (!name) return null;

//                                 return (
//                                     <option key={name} value={name}>
//                                         {name}
//                                     </option>
//                                 );
//                             })}
//                         </select>

//                         {!contractorsLoading && contractors.length === 0 && (
//                             <p className="mt-1 text-xs text-red-500">
//                                 No contractor found in this project.
//                             </p>
//                         )}
//                     </div>
//                 ) : (
//                     <ReadOnlyHeaderField
//                         label="Name of Contractor"
//                         value={externalContractorName}
//                     />
//                 )}

//                 <EditableHeaderInput
//                     label="Make / Model"
//                     value={reportMeta.make_model}
//                     placeholder="Enter make / model"
//                     onChange={(value) =>
//                         setReportMeta((prev) => ({
//                             ...prev,
//                             make_model: value,
//                         }))
//                     }
//                 />

//                 <EditableHeaderInput
//                     label="Identification No."
//                     value={reportMeta.identification_no}
//                     placeholder="Enter identification no."
//                     onChange={(value) =>
//                         setReportMeta((prev) => ({
//                             ...prev,
//                             identification_no: value,
//                         }))
//                     }
//                 />

//                 <EditableHeaderInput
//                     label="Location"
//                     value={reportMeta.location}
//                     placeholder="Enter location"
//                     onChange={(value) =>
//                         setReportMeta((prev) => ({
//                             ...prev,
//                             location: value,
//                         }))
//                     }
//                 />

//                 <EditableHeaderInput
//                     label="Name of Operator"
//                     value={reportMeta.name_of_operator}
//                     placeholder="Enter operator name"
//                     onChange={(value) =>
//                         setReportMeta((prev) => ({
//                             ...prev,
//                             name_of_operator: value,
//                         }))
//                     }
//                 />
//             </div>

//             {isInternalMaker && (
//                 <p className="mt-3 text-xs text-gray-500">
//                     Select the Contractor Name accordingly.
//                 </p>
//             )}
//         </div>
//     );
// };

const LEGACY_HEADER_FIELDS = [
  {
    key: "format_no",
    label: "Format No.",
    source: "TEMPLATE_FIXED",
    input_type: "text",
    system_key: "",
    editable_by_maker: false,
    row_index: 1,
    column_index: 1,
    order_index: 1,
  },
  {
    key: "revision_no",
    label: "Revision No.",
    source: "TEMPLATE_FIXED",
    input_type: "text",
    system_key: "",
    editable_by_maker: false,
    row_index: 1,
    column_index: 2,
    order_index: 2,
  },
  {
    key: "issued_date",
    label: "Issued Date",
    source: "TEMPLATE_FIXED",
    input_type: "date",
    system_key: "",
    editable_by_maker: false,
    row_index: 2,
    column_index: 1,
    order_index: 3,
  },
  {
    key: "revision_date",
    label: "Revision Date",
    source: "TEMPLATE_FIXED",
    input_type: "date",
    system_key: "",
    editable_by_maker: false,
    row_index: 2,
    column_index: 2,
    order_index: 4,
  },
  {
    key: "project",
    label: "Project",
    source: "PROJECT_CONTEXT",
    input_type: "text",
    system_key: "project_name",
    editable_by_maker: false,
    row_index: 3,
    column_index: 1,
    order_index: 5,
  },
  {
    key: "inspection_report_no",
    label: "Inspection Report No.",
    source: "SYSTEM_GENERATED",
    input_type: "text",
    system_key: "report_no",
    editable_by_maker: false,
    row_index: 3,
    column_index: 2,
    order_index: 6,
  },
  {
    key: "name_of_contractor",
    label: "Name of Contractor",
    source: "MAKER_INPUT",
    input_type: "text",
    system_key: "",
    editable_by_maker: true,
    row_index: 4,
    column_index: 1,
    order_index: 7,
  },
  {
    key: "date_of_inspection",
    label: "Date of Inspection",
    source: "SYSTEM_GENERATED",
    input_type: "date",
    system_key: "inspection_date",
    editable_by_maker: false,
    row_index: 4,
    column_index: 2,
    order_index: 8,
  },
  {
    key: "make_model",
    label: "Make / Model",
    source: "MAKER_INPUT",
    input_type: "text",
    system_key: "",
    editable_by_maker: true,
    row_index: 5,
    column_index: 1,
    order_index: 9,
  },
  {
    key: "identification_no",
    label: "Identification No.",
    source: "MAKER_INPUT",
    input_type: "text",
    system_key: "",
    editable_by_maker: true,
    row_index: 5,
    column_index: 2,
    order_index: 10,
  },
  {
    key: "location",
    label: "Location",
    source: "MAKER_INPUT",
    input_type: "text",
    system_key: "",
    editable_by_maker: true,
    row_index: 6,
    column_index: 1,
    order_index: 11,
  },
  {
    key: "name_of_operator",
    label: "Name of Operator",
    source: "MAKER_INPUT",
    input_type: "text",
    system_key: "",
    editable_by_maker: true,
    row_index: 6,
    column_index: 2,
    order_index: 12,
  },
];

const formatTodayDDMMYYYY = () => {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yyyy = now.getFullYear();

  return `${dd}-${mm}-${yyyy}`;
};

const sortHeaderFields = (fields = []) =>
  [...fields].sort(
    (a, b) =>
      Number(a.row_index || 0) - Number(b.row_index || 0) ||
      Number(a.column_index || 0) - Number(b.column_index || 0) ||
      Number(a.order_index || 0) - Number(b.order_index || 0),
  );

const buildLegacyHeaderFields = (meta = {}) =>
  LEGACY_HEADER_FIELDS.map((field) => ({
    ...field,
    default_value: String(meta?.[field.key] || "").trim(),
    required: false,
    visible_in_report: true,
    visible_in_preview: true,
    validation_config: {},
  }));

const getTemplateHeaderFields = (template) => {
  const configuredFields = Array.isArray(template?.header_fields)
    ? template.header_fields
    : [];

  if (configuredFields.length > 0) {
    return sortHeaderFields(configuredFields);
  }

  return sortHeaderFields(
    buildLegacyHeaderFields(template?.report_header_meta || {}),
  );
};

const getChecklistResolvedHeaderFields = (detail) => {
  const configuredFields = Array.isArray(detail?.report_header_fields)
    ? detail.report_header_fields
    : [];

  if (configuredFields.length > 0) {
    return sortHeaderFields(configuredFields);
  }

  const meta =
    detail?.report_header_meta ||
    detail?.safety_report_meta ||
    detail?.report_meta ||
    {};

  return sortHeaderFields(
    buildLegacyHeaderFields(meta).map((field) => ({
      ...field,
      value: String(meta?.[field.key] || "").trim(),
    })),
  );
};

const isEditableMakerField = (field) =>
  field?.source === "MAKER_INPUT" && field?.editable_by_maker === true;

const isRequiredMakerField = (field) => {
  if (!isEditableMakerField(field)) {
    return false;
  }

  /*
        Business rule:
        Any Maker-input field shown on the checklist creation form is mandatory
        unless the setup explicitly marks it optional through validation_config.optional.
    */
  return field?.validation_config?.optional !== true;
};

const getExternalContractorName = (currentUserProfile = {}) =>
  String(
    currentUserProfile?.contractor_name ||
      currentUserProfile?.contractor?.name ||
      "",
  ).trim();

const buildInitialReportMeta = (template, currentUserProfile = {}) => {
  const nextMeta = {};
  const externalContractorName = getExternalContractorName(currentUserProfile);

  getTemplateHeaderFields(template)
    .filter(isEditableMakerField)
    .forEach((field) => {
      let initialValue = String(field.default_value || "").trim();

      if (field.key === "name_of_contractor" && externalContractorName) {
        initialValue = externalContractorName;
      }

      nextMeta[field.key] = initialValue;
    });

  return nextMeta;
};

const getReportNumberPreview = (template) => {
  const config = template?.report_number_config || {};
  const legacyMeta = template?.report_header_meta || {};

  const prefix = String(
    config.prefix || legacyMeta.inspection_report_prefix || "",
  )
    .trim()
    .replace(/-+$/, "");

  const padding = Math.max(1, Number(config.padding || 2));

  return prefix
    ? `${prefix}-${String(1).padStart(padding, "0")}`
    : "Auto-generated on submit";
};

const resolveTemplateFieldDisplayValue = ({
  field,
  selectedTemplate,
  projectId,
}) => {
  const defaultValue = String(field?.default_value || "").trim();

  if (field.source === "TEMPLATE_FIXED") {
    return defaultValue;
  }

  if (field.source === "PROJECT_CONTEXT") {
    if (field.system_key === "project_name") {
      return (
        defaultValue ||
        selectedTemplate?.project_name ||
        (projectId ? `Project ${projectId}` : "")
      );
    }

    return defaultValue;
  }

  if (field.source === "SYSTEM_GENERATED") {
    if (field.system_key === "report_no") {
      return getReportNumberPreview(selectedTemplate);
    }

    if (
      field.system_key === "inspection_date" ||
      field.system_key === "created_date"
    ) {
      return formatTodayDDMMYYYY();
    }

    return "Auto-generated";
  }

  return defaultValue;
};

const ReadOnlyHeaderField = ({ label, value }) => (
  <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
      {label}
    </p>

    <p className="mt-1 break-words text-sm font-semibold text-foreground">
      {String(value || "").trim() || "—"}
    </p>
  </div>
);

const EditableHeaderInput = ({ field, value, onChange }) => {
  const options = Array.isArray(field?.validation_config?.options)
    ? field.validation_config.options
    : [];

  if (field.input_type === "select") {
    return (
      <div>
        <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {field.label}
          {isRequiredMakerField(field) ? (
            <span className="ml-0.5 text-red-500">*</span>
          ) : null}
        </label>

        <select
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
        >
          <option value="">Select {field.label}</option>

          {options.map((option) => {
            const optionValue =
              typeof option === "string"
                ? option
                : option?.value || option?.label || "";

            const optionLabel =
              typeof option === "string"
                ? option
                : option?.label || option?.value || "";

            if (!optionValue) return null;

            return (
              <option key={optionValue} value={optionValue}>
                {optionLabel}
              </option>
            );
          })}
        </select>
      </div>
    );
  }

  const inputType = ["date", "number"].includes(field.input_type)
    ? field.input_type
    : "text";

  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {field.label}
        {isRequiredMakerField(field) ? (
          <span className="ml-0.5 text-red-500">*</span>
        ) : null}
      </label>

      <input
        type={inputType}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
        placeholder={`Enter ${String(field.label || "").toLowerCase()}`}
      />
    </div>
  );
};

const ReportHeaderInfoCard = ({ detail }) => {
  const resolvedFields = getChecklistResolvedHeaderFields(detail).filter(
    (field) => field.visible_in_preview !== false,
  );

  return (
    <div className="mb-6 rounded-xl border bg-card p-5 shadow-sm">
      <h2 className="mb-4 text-sm font-bold text-foreground">
        Checklist Details
      </h2>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {resolvedFields.map((field) => (
          <ReadOnlyHeaderField
            key={field.key}
            label={field.label}
            value={field.value ?? field.default_value ?? ""}
          />
        ))}
      </div>
    </div>
  );
};

export const ReportHeaderCreateCard = ({
  selectedTemplate,
  reportMeta,
  setReportMeta,
  projectId,
  currentUserProfile,
  isInternalMaker,
  contractors,
  contractorsLoading,
}) => {
  const configuredFields = getTemplateHeaderFields(selectedTemplate);
  const externalContractorName = getExternalContractorName(currentUserProfile);

  return (
    <div className="mb-4 rounded-xl border bg-card p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-foreground">
          Inspection Details
        </h3>

        <p className="mt-1 text-xs text-muted-foreground">
          Complete the inspection details below before answering the checklist
          questions. Required fields marked with * must be filled and will be
          included in the generated report.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {configuredFields.map((field) => {
          const editableByMaker = isEditableMakerField(field);

          if (!editableByMaker) {
            return (
              <ReadOnlyHeaderField
                key={field.key}
                label={field.label}
                value={resolveTemplateFieldDisplayValue({
                  field,
                  selectedTemplate,
                  projectId,
                })}
              />
            );
          }

          if (field.key === "name_of_contractor" && isInternalMaker) {
            return (
              <div key={field.key}>
                <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  {field.label}
                  {field.required ? " *" : ""}
                </label>

                <select
                  value={reportMeta[field.key] || ""}
                  onChange={(e) =>
                    setReportMeta((prev) => ({
                      ...prev,
                      [field.key]: e.target.value,
                    }))
                  }
                  disabled={contractorsLoading}
                  className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                >
                  <option value="">
                    {contractorsLoading
                      ? "Loading contractors..."
                      : "Select Contractor"}
                  </option>

                  {contractors.map((contractor) => {
                    const name =
                      typeof contractor === "string"
                        ? contractor
                        : contractor?.name || contractor?.contractor_name || "";

                    if (!name) return null;

                    return (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    );
                  })}
                </select>

                {!contractorsLoading && contractors.length === 0 && (
                  <p className="mt-1 text-xs text-red-500">
                    No contractor found in this project.
                  </p>
                )}
              </div>
            );
          }

          if (field.key === "name_of_contractor" && !isInternalMaker) {
            return (
              <ReadOnlyHeaderField
                key={field.key}
                label={field.label}
                value={
                  reportMeta[field.key] ||
                  externalContractorName ||
                  field.default_value ||
                  ""
                }
              />
            );
          }

          return (
            <EditableHeaderInput
              key={field.key}
              field={field}
              value={reportMeta[field.key] || ""}
              onChange={(value) =>
                setReportMeta((prev) => ({
                  ...prev,
                  [field.key]: value,
                }))
              }
            />
          );
        })}
      </div>

      {isInternalMaker &&
        configuredFields.some(
          (field) =>
            field.key === "name_of_contractor" && isEditableMakerField(field),
        ) && (
          <p className="mt-3 text-xs text-gray-500">
            Select the Contractor Name accordingly.
          </p>
        )}
    </div>
  );
};

// ─────────────────────────────────────────────
// MakerDashboard
// ─────────────────────────────────────────────
export default function MakerDashboard() {
  const userId = getCurrentUserId();

  const [projectId, setProjectId] = useState("");
  const [orgId, setOrgId] = useState("");
  const [templates, setTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [createAnswers, setCreateAnswers] = useState({});
  const [createRemarks, setCreateRemarks] = useState({});
  const [createMedia, setCreateMedia] = useState({});
  const [reportMeta, setReportMeta] = useState({});

  const [filters, setFilters] = useState({
    fromDate: "",
    toDate: "",
    contractor: "all",
    status: "all",
    type: "all",
    wing: "all",
    hazard: "all",
    risk: "all",
  });

  const [checklists, setChecklists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [view, setView] = useState("dashboard");
  const [activeTab, setActiveTab] = useState("Pending For Rectification"); // "dashboard" | "maker_fix"
  const [makerRemarks, setMakerRemarks] = useState({});
  const [makerMedia, setMakerMedia] = useState({});
  const [makerAnswers, setMakerAnswers] = useState({});
  const [isMakerSignatureModalOpen, setIsMakerSignatureModalOpen] =
    useState(false);
  const [pendingSubmitPayload, setPendingSubmitPayload] = useState(null);
  const [signatureSubmitting, setSignatureSubmitting] = useState(false);

  const [currentUserProfile, setCurrentUserProfile] = useState({});
  const [contractors, setContractors] = useState([]);
  const [contractorsLoading, setContractorsLoading] = useState(false);

  const [signaturePurpose, setSignaturePurpose] = useState(null);
  const [pendingCreateSubmitFormData, setPendingCreateSubmitFormData] =
    useState(null);

  const [historyChecklist, setHistoryChecklist] = useState(null);

  const [readonlyChecklist, setReadonlyChecklist] = useState(null);
  const [readonlyPendingStatusLabel, setReadonlyPendingStatusLabel] =
    useState("Pending for Review");

  const currentUserType = String(
    currentUserProfile?.user_type || "",
  ).toUpperCase();
  const isInternalMaker = currentUserType === "INTERNAL";

  const sigCanvasRef = useRef(null);

  // ── data fetching ───────────────────────────────────────────
  const fetchList = async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const isObservations = window.location.pathname.includes(
        "/safety/observations",
      );
      const params = {
        assigned_to_me: true,
        template_type: isObservations ? "OBSERVATION" : "SAFETY",
      };
      if (projectId) params.project_id = projectId;

      let res;
      if (isObservations) {
        res = await listSafetyObservations(params);
      } else {
        res = await listSafetyChecklists(params);
      }

      const data = res?.data;
      const list = Array.isArray(data) ? data : (data?.results ?? []);
      setChecklists(list);
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.message ||
        "Failed to load checklists.";
      setError(msg);
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const loadCreateTemplates = async () => {
    let effectiveProjectId = String(projectId || "").trim();
    let effectiveOrgId = String(orgId || "").trim();

    // Important: fresh login case.
    // If state is empty, resolve again from access token / USER_DATA / localStorage.
    if (!effectiveProjectId || !effectiveOrgId) {
      const ctx = resolveMakerContext();

      effectiveProjectId = ctx.projectId;
      effectiveOrgId = ctx.orgId;

      setProjectId(effectiveProjectId);
      setOrgId(effectiveOrgId);
      setCurrentUserProfile(ctx.profile);
    }

    if (!effectiveProjectId || !effectiveOrgId) {
      setTemplates([]);
      showToast(
        "Project or organization not found. Please select/open your project profile once.",
        "error",
      );
      return;
    }

    setTemplatesLoading(true);

    try {
      const isObservations = window.location.pathname.includes(
        "/safety/observations",
      );
      const catRes = await listSafetyCategories({
        org_id: effectiveOrgId,
        project_id: effectiveProjectId,
        active: true,
      });

      const catRaw = catRes?.data;
      const categories = Array.isArray(catRaw)
        ? catRaw
        : (catRaw?.results ?? []);

      const safetyCategory =
        categories.find((c) => {
          const name = String(c.name || "")
            .trim()
            .toLowerCase();
          if (isObservations) {
            return (
              name.includes("observation") || name.includes("housekeeping")
            );
          }
          return name === "safety checklist";
        }) || categories[0];

      if (!safetyCategory) {
        setTemplates([]);
        showToast("Safety Checklist category not found.", "error");
        return;
      }

      const tplRes = await listSafetyTemplates({
        org_id: effectiveOrgId,
      });

      const tplRaw = tplRes?.data;
      const list = Array.isArray(tplRaw) ? tplRaw : (tplRaw?.results ?? []);

      // Filter on frontend to avoid backend filtering bugs
      const activeTemplates = list.filter((t) => {
        const s = String(t.status || "").toUpperCase();
        if (s !== "ACTIVE") return false;

        // Filter by category type based on path
        const catName = String(
          t.category?.name || t.category_name || "",
        ).toLowerCase();
        const isObsTemplate =
          catName.includes("observation") || catName.includes("housekeeping");

        if (isObservations && !isObsTemplate) return false;
        if (!isObservations && isObsTemplate) return false;

        // Restrict based on first workflow step
        const sortedWorkflowConfig =
          t.workflow_config
            ?.slice()
            ?.sort((a, b) => a.order_index - b.order_index) || [];
        const firstWorkflowStep = sortedWorkflowConfig[0];
        const firstRole = firstWorkflowStep
          ? String(firstWorkflowStep.role).toUpperCase()
          : "";

        // For Makers, they should only initiate templates where the first role is MAKER or INITIALIZER
        if (firstRole && !["MAKER", "INITIALIZER"].includes(firstRole)) {
          return false;
        }

        return true;
      });

      setTemplates(activeTemplates);
    } catch (err) {
      setTemplates([]);
      showToast(
        err?.response?.data?.detail || "Failed to load safety checklists.",
        "error",
      );
    } finally {
      setTemplatesLoading(false);
    }
  };

  const loadContractorNames = async () => {
    if (!orgId || !projectId || !isInternalMaker) {
      setContractors([]);
      return;
    }

    setContractorsLoading(true);

    try {
      const res = await listContractorNamesByOrg(orgId, projectId);
      const raw = res?.data;

      const list = Array.isArray(raw) ? raw : (raw?.results ?? []);

      setContractors(list);
    } catch (err) {
      setContractors([]);
      showToast(
        err?.response?.data?.detail || "Failed to load contractor names.",
        "error",
      );
    } finally {
      setContractorsLoading(false);
    }
  };

  useEffect(() => {
    if (view === "create" && orgId && projectId) {
      loadCreateTemplates();
    }
  }, [view, orgId, projectId]);

  useEffect(() => {
    if (view === "create" && orgId && projectId && isInternalMaker) {
      loadContractorNames();
    }
  }, [view, orgId, projectId, isInternalMaker]);

  useEffect(() => {
    if (!selectedTemplateId) {
      setSelectedTemplate(null);
      setCreateAnswers({});
      setCreateRemarks({});
      setCreateMedia({});
      setReportMeta({});
      return;
    }

    let alive = true;

    const loadTemplateDetail = async () => {
      setTemplateLoading(true);

      try {
        const res = await getSafetyTemplate(selectedTemplateId);
        const data = res?.data || null;

        if (!alive) return;

        setSelectedTemplate(data);

        const headerMeta = data?.report_header_meta || {};

        setReportMeta(buildInitialReportMeta(data, currentUserProfile));

        const initialAnswers = {};
        const initialRemarks = {};

        (data?.questions || []).forEach((q) => {
          initialAnswers[q.id] = "";
          initialRemarks[q.id] = "";
        });

        setCreateAnswers(initialAnswers);
        setCreateRemarks(initialRemarks);
        setCreateMedia({});
      } catch (err) {
        showToast(
          err?.response?.data?.detail || "Failed to load checklist questions.",
          "error",
        );
      } finally {
        if (alive) setTemplateLoading(false);
      }
    };

    loadTemplateDetail();

    return () => {
      alive = false;
    };
  }, [selectedTemplateId]);

  useEffect(() => {
    if (!selectedTemplate || isInternalMaker) {
      return;
    }

    const contractorField = getTemplateHeaderFields(selectedTemplate).find(
      (field) =>
        field.key === "name_of_contractor" && isEditableMakerField(field),
    );

    if (!contractorField) {
      return;
    }

    const externalContractorName =
      getExternalContractorName(currentUserProfile);

    if (!externalContractorName) {
      return;
    }

    setReportMeta((previous) => ({
      ...previous,
      name_of_contractor: previous.name_of_contractor || externalContractorName,
    }));
  }, [selectedTemplate, currentUserProfile, isInternalMaker]);

  useEffect(() => {
    const ctx = resolveMakerContext();

    setProjectId(ctx.projectId);
    setOrgId(ctx.orgId);
    setCurrentUserProfile(ctx.profile);
  }, []);

  useEffect(() => {
    console.log("MAKER USER PROFILE:", currentUserProfile);
    console.log("IS INTERNAL MAKER:", isInternalMaker);
  }, [currentUserProfile, isInternalMaker]);

  useEffect(() => {
    if (view === "dashboard") {
      fetchList();
    }
  }, [userId, projectId, view]);

  const openCreateChecklist = () => {
    const ctx = resolveMakerContext();

    if (!ctx.projectId || !ctx.orgId) {
      showToast(
        "Project or organization not found. Please select/open your project profile once.",
        "error",
      );
      return;
    }

    setProjectId(ctx.projectId);
    setOrgId(ctx.orgId);
    setCurrentUserProfile(ctx.profile);

    setSelectedTemplateId("");
    setSelectedTemplate(null);
    setCreateAnswers({});
    setCreateRemarks({});
    setCreateMedia({});
    setReportMeta({});
    setContractors([]);
    setView("create");
  };

  // const backFromCreate = () => {
  //     setSelectedTemplateId("");
  //     setSelectedTemplate(null);
  //     setCreateAnswers({});
  //     setCreateRemarks({});
  //     setCreateMedia({});
  //     setReportMeta({
  //         make_model: "",
  //         identification_no: "",
  //         location: "",
  //         name_of_operator: "",
  //         name_of_contractor: "",
  //     });
  //     setView("dashboard");
  // };

  const backFromCreate = () => {
    setSelectedTemplateId("");
    setSelectedTemplate(null);
    setCreateAnswers({});
    setCreateRemarks({});
    setCreateMedia({});
    setReportMeta({});
    setView("dashboard");
  };

  const isMakerTurn = (c) =>
    (c.current_assignee_role || "").toUpperCase() === "MAKER" &&
    (!c.current_assignee_id ||
      Number(c.current_assignee_id) === Number(userId));

  const makerInWorkflow = (c) => Boolean(c?.maker_in_workflow);

  const rejectedPoints = (c) => Number(c.maker_rejected_points ?? 0);

  const isObservations = window.location.pathname.includes(
    "/safety/observations",
  );

  const statusOf = (c) => String(c.status || "").toLowerCase();

  const currentRoleOf = (c) =>
    String(c.current_assignee_role || "").toUpperCase();

  const reviewRoundCount = (c) =>
    Number(c?.review_state?.completed_review_rounds ?? 0);

  const isClosedRejected = (c) =>
    statusOf(c) === "closed_rejected" || statusOf(c) === "rejected";

  const isFinalChecklist = (c) => {
    if (isObservations) return ["approved", "rejected"].includes(statusOf(c));
    return statusOf(c) === "completed" || statusOf(c) === "closed_rejected";
  };

  const isRectificationCycle = (c) => {
    if (isObservations) return statusOf(c) === "pending_maker";
    return reviewRoundCount(c) > 0 || rejectedPoints(c) > 0;
  };

  const makerCanRectify = (c) => {
    if (isObservations) return statusOf(c) === "pending_maker";
    return makerInWorkflow(c) && isMakerTurn(c);
  };

  const filteredChecklists = applyChecklistFilters(checklists, filters);

  // Pending buckets should be affected by filters (matching Checker logic).
  const makerPendingReview = filteredChecklists.filter((c) => {
    if (isObservations) return statusOf(c) === "pending_checker";
    return (
      makerInWorkflow(c) &&
      !isFinalChecklist(c) &&
      statusOf(c) === "in_progress" &&
      currentRoleOf(c) === "CHECKER" &&
      !isRectificationCycle(c)
    );
  });

  const makerPendingRectification = filteredChecklists.filter((c) => {
    if (isObservations) return statusOf(c) === "pending_maker";
    return (
      makerInWorkflow(c) &&
      !isFinalChecklist(c) &&
      statusOf(c) === "in_progress" &&
      (isRectificationCycle(c) || isMakerTurn(c))
    );
  });

  // Completed list.
  const makerCompletedRaw = filteredChecklists.filter((c) => {
    if (isObservations) return isFinalChecklist(c);
    return makerInWorkflow(c) && isFinalChecklist(c);
  });

  // Filter options should come from RAW checklists so users can select anything available.
  const contractorOptions = Array.from(
    new Set(checklists.map(getChecklistContractor).filter(Boolean)),
  ).sort();

  const wingOptions = ["A", "B", "C", "D", "E", "F", "G", "NTA"];
  const hazardOptions = [
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

  const typeOptions = Array.from(
    new Set(checklists.map(getChecklistType).filter(Boolean)),
  ).sort();

  // Final completed list.
  const makerCompletedChecklists = makerCompletedRaw;

  // These counters are affected by filters because they belong to completed bucket.
  const makerApprovedCount =
    makerCompletedChecklists.filter(isApprovedChecklist).length;

  const makerRejectedCount =
    makerCompletedChecklists.filter(isRejectedChecklist).length;

  const safeCount = (value) => {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : 0;
  };

  const makerTotalCount =
    safeCount(makerPendingReview?.length) +
    safeCount(makerPendingRectification?.length) +
    safeCount(makerApprovedCount) +
    safeCount(makerRejectedCount);

  const totalQuestionsLabel = (c) => {
    const n = c.items_count;
    if (n == null || Number.isNaN(Number(n))) return null;
    const t = Number(n);
    return `${t} question${t === 1 ? "" : "s"}`;
  };

  const formatChecklistDateTime = (value) => {
    if (!value) return "";

    const date = new Date(value);

    return date.toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const rejectedPointsLabel = (c) => {
    const n = rejectedPoints(c);
    if (n <= 0) return null;
    return `${n} rejected point${n === 1 ? "" : "s"}`;
  };

  const MAKER_REJECTED_STATUSES = [
    "rejected_by_checker",
    "rejected_by_supervisor",
  ];

  const makerFixItems =
    detail?.items
      ?.map((item, idx) => {
        let sub = (item.submissions || [])[0];
        const isMock = !sub;

        const currentAssignment = detail?.workflow_assignments?.find(
          (a) => a.order_index === detail?.current_assignee_step_index,
        );
        const assignedQuestions = currentAssignment?.assigned_questions || [];
        const hasAssignedQuestions = assignedQuestions.length > 0;
        const isAssigned =
          !hasAssignedQuestions || assignedQuestions.includes(idx);

        if (!sub) {
          sub = {
            id: `mock-${item.id}`,
            status: "created",
            checklist_item: item.id,
          };
        }

        const editable =
          isAssigned &&
          (sub.status === "created" ||
            MAKER_REJECTED_STATUSES.includes(sub.status));

        return {
          item,
          sub,
          editable,
          isMock,
          highlighted: !isMock && MAKER_REJECTED_STATUSES.includes(sub.status),
        };
      })
      .filter(Boolean) ?? [];

  const makerEditableItems = makerFixItems.filter((row) => row.editable);

  // ── create view shared logic ────────────────────────────────
  const sortedWorkflowConfig =
    selectedTemplate?.workflow_config
      ?.slice()
      ?.sort((a, b) => a.order_index - b.order_index) || [];
  const initialCreateWorkflowStep = sortedWorkflowConfig[0];
  const isMakerFirstStep =
    initialCreateWorkflowStep &&
    ["MAKER", "INITIALIZER"].includes(
      String(initialCreateWorkflowStep.role).toUpperCase(),
    );
  const createAssignedQuestionsIndices = isMakerFirstStep
    ? initialCreateWorkflowStep?.assigned_questions || []
    : [];
  const isCreateAssigned = (idx) => {
    if (!isMakerFirstStep) return false;
    return (
      createAssignedQuestionsIndices.length === 0 ||
      createAssignedQuestionsIndices.includes(idx)
    );
  };

  // ── navigation ──────────────────────────────────────────────
  const backToDashboard = () => {
    setView("dashboard");
    setDetail(null);
    setMakerRemarks({});
    setMakerMedia({});
    setMakerAnswers({});
    setIsMakerSignatureModalOpen(false);
    setPendingSubmitPayload(null);
    if (sigCanvasRef.current) sigCanvasRef.current.clear();
  };

  // ── open fix view ───────────────────────────────────────────
  const openMakerFix = async (cl) => {
    setDetail(null);
    setDetailLoading(true);
    setMakerRemarks({});
    setMakerMedia({});
    try {
      if (isObservations) {
        const res = await getSafetyObservationById(cl.id);
        setDetail(res?.data || null);
        setView("maker_fix_observation");
      } else {
        const res = await getSafetyChecklist(cl.id);
        const data = res?.data || null;
        setDetail(data);
        const initialRemarks = {};
        const initialAnswers = {};

        (data?.items || []).forEach((entry) => {
          const sub = (entry.submissions || [])[0];
          if (!sub) return;

          initialRemarks[sub.id] = "";
          initialAnswers[sub.id] = sub.latest_maker_answer || "";
        });

        setMakerRemarks(initialRemarks);
        setMakerAnswers(initialAnswers);
        setView("maker_fix");
      }
    } catch (err) {
      showToast(
        err?.response?.data?.detail || "Failed to load details",
        "error",
      );
    } finally {
      setDetailLoading(false);
    }
  };

  // ── submit all fixes at once ────────────────────────────────
  // const handleSubmitAllFixes = async () => {
  //     if (!detail) return;
  //     const submissions = (detail.items || [])
  //         .map((item) => {
  //             const sub = (item.submissions || []).find((s) =>
  //                 MAKER_QUEUE_STATUSES.includes(s.status)
  //             );
  //             if (!sub) return null;
  //             const payload = { submission_id: sub.id, maker_remarks: makerRemarks[sub.id] ?? "" };
  //             const media = makerMedia[sub.id];
  //             if (media) payload.maker_media_base64 = media;
  //             return payload;
  //         })
  //         .filter(Boolean);
  //     const payload = submissions.length ? { submissions } : {};
  //     const isBulk = !submissions.length;
  //     if (shouldShowMakerSignatureModal(detail, submissions, isBulk)) {
  //         setPendingSubmitPayload(payload);
  //         setIsMakerSignatureModalOpen(true);
  //         return;
  //     }

  //     setSubmitting(true);
  //     try {
  //         await submitSafetyChecklist(detail.id, payload);
  //         showToast("Submitted successfully", "success");
  //         backToDashboard();
  //         fetchList();
  //     } catch (err) {
  //         showToast(err?.response?.data?.detail || "Submit failed", "error");
  //     } finally {
  //         setSubmitting(false);
  //     }
  // };

  // ── submit a single fix ─────────────────────────────────────

  const handleSubmitAllFixes = async () => {
    if (!detail) return;

    const submissions = [];
    const answers = {};
    const answersMedia = [];

    makerFixItems
      .filter(({ editable }) => editable)
      .forEach(({ sub, item, isMock }) => {
        const ansKey = isMock ? `mock-${item.id}` : sub.id;
        const answer = makerAnswers[ansKey] || makerAnswers[sub.id] || "";

        if (isMock) {
          answers[item.id] = answer;
          if (makerMedia[ansKey]) {
            answersMedia.push({ id: item.id, file: makerMedia[ansKey] });
          }
        } else {
          submissions.push({
            submission_id: sub.id,
            answer: answer,
            maker_remarks: makerRemarks[sub.id] ?? "",
          });
        }
      });

    const hasMissingAnswer =
      submissions.some((s) => !s.answer) ||
      Object.values(answers).some((a) => !a);

    if (!submissions.length && Object.keys(answers).length === 0) {
      showToast("No questions to submit.", "error");
      return;
    }

    if (hasMissingAnswer) {
      showToast("Please answer all required questions.", "error");
      return;
    }

    const payload = {};
    if (submissions.length) payload.submissions = submissions;
    if (Object.keys(answers).length) payload.answers = answers;
    if (answersMedia.length) payload.answersMedia = answersMedia;

    // IMPORTANT:
    // Re-submit must always go through maker signature modal.
    // Do not directly call submitSafetyChecklist here.
    setPendingSubmitPayload(payload);
    setSignaturePurpose("submit_fix");
    setIsMakerSignatureModalOpen(true);
  };

  // const handleSubmitSingleFix = async (submissionId) => {
  //     if (!detail) return;

  //     const submissions = [];

  //     (detail.items || []).forEach((item) => {
  //         const sub = (item.submissions || []).find((s) => s.id === submissionId);
  //         if (!sub) return;

  //         submissions.push({
  //             submission_id: sub.id,
  //             answer: makerAnswers[sub.id] || "",
  //             maker_remarks: makerRemarks[sub.id] ?? "",
  //         });
  //     });

  //     if (!submissions.length) {
  //         showToast("Could not find fix to submit.", "error");
  //         return;
  //     }

  //     if (!submissions[0]?.answer) {
  //         showToast("Please answer this question before submitting.", "error");
  //         return;
  //     }

  //     // IMPORTANT:
  //     // Single fix submit also needs maker signature.
  //     setPendingSubmitPayload({ submissions });
  //     setSignaturePurpose("submit_fix");
  //     setIsMakerSignatureModalOpen(true);
  // };

  const handleCloseMakerSignatureModal = () => {
    if (signatureSubmitting) return;

    setIsMakerSignatureModalOpen(false);
    setPendingSubmitPayload(null);
    setPendingCreateSubmitFormData(null);
    setSignaturePurpose(null);

    if (sigCanvasRef.current) sigCanvasRef.current.clear();
  };

  const handleSubmitWithMakerSignature = async () => {
    if (!detail || !pendingSubmitPayload) return;

    if (!sigCanvasRef.current || sigCanvasRef.current.isEmpty()) {
      showToast("Please provide your signature.", "error");
      return;
    }

    const dataUrl = sigCanvasRef.current.toDataURL("image/png");
    const base64Part = dataUrl.split(",")[1] || "";

    if (!base64Part) {
      showToast("Could not capture signature. Try again.", "error");
      return;
    }

    const binary = atob(base64Part);
    const bytes = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }

    const signatureFile = new File(
      [bytes],
      `maker-signature-${detail.id}-${Date.now()}.png`,
      { type: "image/png" },
    );

    const formData = new FormData();

    if (pendingSubmitPayload?.submissions?.length) {
      formData.append(
        "submissions",
        JSON.stringify(pendingSubmitPayload.submissions),
      );

      pendingSubmitPayload.submissions.forEach((sub) => {
        const file = makerMedia[sub.submission_id];

        if (file) {
          // Preferred explicit key, backend supports this.
          formData.append(`maker_media_${sub.submission_id}`, file);
        }
      });
    }

    if (pendingSubmitPayload?.answers) {
      formData.append("answers", JSON.stringify(pendingSubmitPayload.answers));
    }

    if (pendingSubmitPayload?.answersMedia) {
      pendingSubmitPayload.answersMedia.forEach(({ id, file }) => {
        formData.append(`answers_media_${id}`, file);
      });
    }

    formData.append("maker_signature", signatureFile);

    setSignatureSubmitting(true);

    try {
      await submitSafetyChecklist(detail.id, formData);

      showToast("Submitted successfully", "success");

      setIsMakerSignatureModalOpen(false);
      setPendingSubmitPayload(null);
      setSignaturePurpose(null);

      if (sigCanvasRef.current) sigCanvasRef.current.clear();

      backToDashboard();
      fetchList();
    } catch (err) {
      showToast(
        err?.response?.data?.detail || "Signature submit failed",
        "error",
      );
    } finally {
      setSignatureSubmitting(false);
    }
  };

  const handleDownloadReport = async (item) => {
    if (!item?.id) return;

    if (isObservations) {
      const reportGroup = groupedReports.find((r) => r.firstItemId === item.id);
      if (reportGroup) {
        showToast("Generating Observation Report PDF...", "success");
        try {
          const res = await downloadSafetyObservationReport({
            date: reportGroup.date,
            org_id: orgId,
            project_id: projectId,
            t: new Date().getTime(),
          });

          const blob = res?.data;
          if (!blob) {
            showToast("Report data is empty", "error");
            return;
          }
          const url = window.URL.createObjectURL(new Blob([blob]));
          const link = document.createElement("a");
          link.href = url;

          const safeName = reportGroup.reportName
            ? reportGroup.reportName.replace(/[^a-zA-Z0-9_.-]/g, "_")
            : `Observation-Report-${reportGroup.date}.pdf`;

          link.setAttribute("download", `${safeName}.pdf`);
          document.body.appendChild(link);
          link.click();
          link.parentNode.removeChild(link);
          window.URL.revokeObjectURL(url);
          return;
        } catch (err) {
          console.error("PDF Gen Error:", err);
          showToast("Failed to generate PDF", "error");
          return;
        }
      }
    }

    try {
      const res = await downloadSafetyReport(item.id, {
        org_id: orgId,
        mode: "download",
      });

      const blob = res?.data;
      if (!blob) {
        showToast("Report file not found.", "error");
        return;
      }

      const url = window.URL.createObjectURL(
        new Blob([blob], { type: "application/pdf" }),
      );
      const link = document.createElement("a");

      const safeName = String(item.name || "safety-report")
        .trim()
        .replace(/[^\w.-]+/g, "-");

      link.href = url;
      link.download = `${safeName}-${item.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
      showToast("Report downloaded", "success");
    } catch (err) {
      showToast(
        err?.response?.data?.detail || err?.message || "Download failed",
        "error",
      );
    }
  };

  const handleCreateAndSubmitChecklist = async () => {
    if (!selectedTemplate) {
      showToast("Please select checklist.", "error");
      return;
    }

    const editableHeaderFields =
      getTemplateHeaderFields(selectedTemplate).filter(isEditableMakerField);

    const cleanReportMeta = {};

    editableHeaderFields.forEach((field) => {
      let value = String(
        reportMeta[field.key] ?? field.default_value ?? "",
      ).trim();

      if (field.key === "name_of_contractor" && !isInternalMaker) {
        value = value || getExternalContractorName(currentUserProfile);
      }

      cleanReportMeta[field.key] = value;
    });

    const missingRequiredField = editableHeaderFields.find(
      (field) =>
        isRequiredMakerField(field) &&
        !String(cleanReportMeta[field.key] || "").trim(),
    );

    if (missingRequiredField) {
      showToast(`${missingRequiredField.label} is required.`, "error");
      return;
    }

    const questions = selectedTemplate?.questions || [];

    if (!questions.length) {
      showToast("Selected checklist has no questions.", "error");
      return;
    }

    const assignedQuestionsToAnswer = questions.filter((q, idx) =>
      isCreateAssigned(idx),
    );

    const unansweredIndex = assignedQuestionsToAnswer.findIndex(
      (q) => !String(createAnswers[q.id] || "").trim(),
    );

    if (unansweredIndex !== -1) {
      const unanswered = assignedQuestionsToAnswer[unansweredIndex];

      showToast(`Please answer Question: ${unanswered.text}`, "error");
      return;
    }

    const missingRequiredPhoto = assignedQuestionsToAnswer.find(
      (q) => q.photo_required && !createMedia[q.id],
    );

    if (missingRequiredPhoto) {
      showToast(`Photo is required for: ${missingRequiredPhoto.text}`, "error");
      return;
    }

    const formData = new FormData();

    formData.append("template_id", Number(selectedTemplate.id));
    formData.append("project_id", Number(projectId));
    formData.append("org_id", Number(orgId));
    formData.append("title", selectedTemplate.title || "Safety Checklist");

    // formData.append(
    //     "report_meta",
    //     JSON.stringify({
    //         make_model: reportMeta.make_model || "",
    //         identification_no: reportMeta.identification_no || "",
    //         location: reportMeta.location || "",
    //         name_of_operator: reportMeta.name_of_operator || "",

    //         name_of_contractor: reportMeta.name_of_contractor || "",
    //     })
    // );

    formData.append("report_meta", JSON.stringify(cleanReportMeta));

    formData.append(
      "answers",
      JSON.stringify(
        questions.map((q) => ({
          template_question_id: q.id,
          answer: createAnswers[q.id],
          maker_remarks: createRemarks[q.id] || "",
        })),
      ),
    );

    questions.forEach((q) => {
      const file = createMedia[q.id];
      if (file) {
        formData.append(`maker_media_${q.id}`, file);
      }
    });

    setSignaturePurpose("create");
    setPendingCreateSubmitFormData(formData);
    setIsMakerSignatureModalOpen(true);
  };

  const handleCreateSubmitWithMakerSignature = async () => {
    if (!pendingCreateSubmitFormData) return;

    if (!sigCanvasRef.current || sigCanvasRef.current.isEmpty()) {
      showToast("Please provide your signature.", "error");
      return;
    }

    const dataUrl = sigCanvasRef.current.toDataURL("image/png");
    const base64Part = dataUrl.split(",")[1] || "";

    const binary = atob(base64Part);
    const bytes = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }

    const signatureFile = new File(
      [bytes],
      `maker-create-signature-${Date.now()}.png`,
      { type: "image/png" },
    );

    pendingCreateSubmitFormData.append("maker_signature", signatureFile);

    setSignatureSubmitting(true);

    try {
      await createAndSubmitSafetyChecklist(pendingCreateSubmitFormData);

      showToast("Checklist submitted to safety officers.", "success");

      setIsMakerSignatureModalOpen(false);
      setPendingCreateSubmitFormData(null);
      setSignaturePurpose(null);

      if (sigCanvasRef.current) sigCanvasRef.current.clear();

      backFromCreate();
      fetchList();
    } catch (err) {
      showToast(
        err?.response?.data?.detail || "Failed to submit checklist.",
        "error",
      );
    } finally {
      setSignatureSubmitting(false);
    }
  };

  const handleMakerSignatureSubmit = async () => {
    if (signaturePurpose === "create") {
      await handleCreateSubmitWithMakerSignature();
    } else {
      await handleSubmitWithMakerSignature();
    }
  };

  // ── Metric Computations (Matching Checkerdashboard) ────────────

  const openObservationsCount = filteredChecklists.filter(
    (c) => !isApprovedChecklist(c) && !isRejectedChecklist(c),
  ).length;

  const checkerApprovedCount = filteredChecklists.filter((c) =>
    isApprovedChecklist(c),
  ).length;
  const checkerRejectedCount = filteredChecklists.filter((c) =>
    isRejectedChecklist(c),
  ).length;
  const checkerTotal = checklists.length;

  const unsafeActCount = filteredChecklists.filter(
    (c) => c.unsafe_act_condition_category === "Unsafe Act",
  ).length;
  const unsafeConditionCount = filteredChecklists.filter(
    (c) => c.unsafe_act_condition_category === "Unsafe Condition",
  ).length;

  const lowRiskCount = filteredChecklists.filter(
    (c) => c.risk === "Low Risk",
  ).length;
  const mediumRiskCount = filteredChecklists.filter(
    (c) => c.risk === "Medium Risk",
  ).length;
  const highRiskCount = filteredChecklists.filter(
    (c) => c.risk === "High Risk",
  ).length;

  const now = new Date();
  const overdueObservationsCount = filteredChecklists.filter((c) => {
    if (isApprovedChecklist(c) || isRejectedChecklist(c)) return false; // Open only
    if (!c.target_date) return false;
    return new Date(c.target_date) < now;
  }).length;

  const onTimeClosuresCount = filteredChecklists.filter((c) => {
    if (!isApprovedChecklist(c) && !isRejectedChecklist(c)) return false; // Closed only
    if (!c.target_date || !c.updated_at) return false;
    return new Date(c.updated_at) <= new Date(c.target_date);
  }).length;

  const reportNameByDate = React.useMemo(() => {
    const mapping = {};
    const sortedDates = Array.from(
      new Set(
        checklists
          .map((c) => {
            if (!c.created_at) return null;
            return new Date(c.created_at).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            });
          })
          .filter(Boolean),
      ),
    ).sort((a, b) => {
      const [d1, m1, y1] = a.split("/");
      const [d2, m2, y2] = b.split("/");
      return new Date(y1, m1 - 1, d1) - new Date(y2, m2 - 1, d2);
    });

    sortedDates.forEach((dateStr, index) => {
      const reportNumber = String(index + 1).padStart(2, "0");
      mapping[dateStr] = `Report AN-ADL-SHOR-${reportNumber}`;
    });
    return mapping;
  }, [checklists]);

  const getItemReportName = (item) => {
    if (!item.created_at) return "";
    const dateObj = new Date(item.created_at);
    const dateStr = dateObj.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    return reportNameByDate[dateStr] ? ` / ${reportNameByDate[dateStr]}` : "";
  };

  const groupedReports = React.useMemo(() => {
    const groups = {};
    const itemsToGroup = isObservations
      ? filteredChecklists
      : makerCompletedChecklists;
    itemsToGroup.forEach((item) => {
      if (!item.created_at) return;
      const dateObj = new Date(item.created_at);
      const dateStr = dateObj.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }); // e.g. 10/06/2026
      if (!groups[dateStr]) {
        groups[dateStr] = {
          date: dateStr,
          dateObj,
          items: [],
          firstItemId: item.id,
        };
      }
      groups[dateStr].items.push(item);
    });

    const sortedDates = Object.values(groups)
      .sort((a, b) => b.dateObj - a.dateObj)
      .map((g) => g.date);

    const reports = sortedDates.map((dateStr) => {
      return {
        date: dateStr,
        reportName: reportNameByDate[dateStr] || "Report",
        firstItemId: groups[dateStr].firstItemId,
        items: groups[dateStr].items,
      };
    });

    return reports;
  }, [
    filteredChecklists,
    makerCompletedChecklists,
    isObservations,
    reportNameByDate,
  ]);

  // ── render ───────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-muted/40 p-4 sm:p-6 md:p-10">
      <div className="mx-auto max-w-4xl">
        {!userId && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            User not found in session. Log in or ensure USER_DATA is set in
            localStorage.
          </div>
        )}

        {loading && (
          <div className="py-8 text-center text-muted-foreground">Loading…</div>
        )}

        {!loading && error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            {/* ═══ VIEW: CREATE CHECKLIST ═══ */}
            {view === "create" &&
              (window.location.pathname.includes("/safety/observations") ? (
                <CreateSafetyObservation onBack={backFromCreate} />
              ) : (
                <section>
                  <button
                    type="button"
                    onClick={backFromCreate}
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
                          Start Safety Checklist
                        </h1>
                        <p className="text-sm text-muted-foreground">
                          Choose the checklist to start the inspection.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mb-6 rounded-xl border bg-card p-5 shadow-sm">
                    <label className="mb-1.5 block text-sm font-medium text-foreground">
                      Checklists
                    </label>

                    <select
                      value={selectedTemplateId}
                      onChange={(e) => setSelectedTemplateId(e.target.value)}
                      disabled={templatesLoading}
                      className="h-11 w-full rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                    >
                      <option value="">
                        {templatesLoading
                          ? "Loading checklists..."
                          : "Select checklist"}
                      </option>

                      {templates.map((tpl) => (
                        <option key={tpl.id} value={tpl.id}>
                          {tpl.title}
                        </option>
                      ))}
                    </select>

                    {!templatesLoading && templates.length === 0 && (
                      <p className="mt-2 text-xs text-red-500">
                        No active Safety Checklist formats found for this
                        project.
                      </p>
                    )}
                  </div>

                  {templateLoading && (
                    <div className="rounded-xl border bg-card p-5 text-sm text-muted-foreground">
                      Loading questions...
                    </div>
                  )}

                  {!templateLoading && selectedTemplate && (
                    <>
                      <div className="mb-4 rounded-xl border bg-card p-5 shadow-sm">
                        <h2 className="text-base font-bold text-foreground">
                          {selectedTemplate.title}
                        </h2>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {
                            (selectedTemplate.questions || []).filter(
                              (q, idx) => isCreateAssigned(idx),
                            ).length
                          }{" "}
                          question(s)
                        </p>
                      </div>

                      <ReportHeaderCreateCard
                        selectedTemplate={selectedTemplate}
                        reportMeta={reportMeta}
                        setReportMeta={setReportMeta}
                        projectId={projectId}
                        currentUserProfile={currentUserProfile}
                        isInternalMaker={isInternalMaker}
                        contractors={contractors}
                        contractorsLoading={contractorsLoading}
                      />

                      {/* <div className="mb-4 rounded-xl border bg-card p-5 shadow-sm">
                                            <h3 className="mb-4 text-sm font-semibold text-foreground">
                                                Inspection Details
                                            </h3>

                                            {isInternalMaker && (
                                                <div className="mb-4">
                                                    <p className="mt-1 text-xs text-gray-500">
                                                        If no contractor is selected, organization name will be used in the report.
                                                    </p>
                                                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                                                        Contractor Name
                                                    </label>

                                                    <select
                                                        value={reportMeta.name_of_contractor}
                                                        onChange={(e) =>
                                                            setReportMeta((prev) => ({
                                                                ...prev,
                                                                name_of_contractor: e.target.value,
                                                            }))
                                                        }
                                                        disabled={contractorsLoading}
                                                        className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                                                    >
                                                        <option value="">
                                                            {contractorsLoading
                                                                ? "Loading contractors..."
                                                                : "Use organization name"}
                                                        </option>

                                                        {contractors.map((contractor) => {
                                                            const name =
                                                                typeof contractor === "string"
                                                                    ? contractor
                                                                    : contractor?.name || contractor?.contractor_name || "";

                                                            if (!name) return null;

                                                            return (
                                                                <option key={name} value={name}>
                                                                    {name}
                                                                </option>
                                                            );
                                                        })}
                                                    </select>

                                                    {!contractorsLoading && contractors.length === 0 && (
                                                        <p className="mt-1 text-xs text-red-500">
                                                            No contractor found in this project.
                                                        </p>
                                                    )}
                                                </div>
                                            )}

                                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                                <div>
                                                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                                                        Make / Model
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={reportMeta.make_model}
                                                        onChange={(e) =>
                                                            setReportMeta((prev) => ({
                                                                ...prev,
                                                                make_model: e.target.value,
                                                            }))
                                                        }
                                                        className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                                                        placeholder="Enter make / model"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                                                        Identification No.
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={reportMeta.identification_no}
                                                        onChange={(e) =>
                                                            setReportMeta((prev) => ({
                                                                ...prev,
                                                                identification_no: e.target.value,
                                                            }))
                                                        }
                                                        className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                                                        placeholder="Enter identification no."
                                                    />
                                                </div>

                                                <div>
                                                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                                                        Location
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={reportMeta.location}
                                                        onChange={(e) =>
                                                            setReportMeta((prev) => ({
                                                                ...prev,
                                                                location: e.target.value,
                                                            }))
                                                        }
                                                        className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                                                        placeholder="Enter location"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                                                        Name of Operator
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={reportMeta.name_of_operator}
                                                        onChange={(e) =>
                                                            setReportMeta((prev) => ({
                                                                ...prev,
                                                                name_of_operator: e.target.value,
                                                            }))
                                                        }
                                                        className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                                                        placeholder="Enter operator name"
                                                    />
                                                </div>
                                            </div>
                                        </div> */}

                      {!isMakerFirstStep && (
                        <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
                          The first step of this checklist workflow is assigned
                          to another role (e.g. Checker). Please complete the
                          Inspection Details above and click "Submit Checklist"
                          to initiate the process.
                        </div>
                      )}
                      <div className="space-y-4">
                        {(selectedTemplate.questions || []).map((q, idx) => {
                          if (!isCreateAssigned(idx)) return null;

                          return (
                            <div
                              key={q.id}
                              className="rounded-xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
                            >
                              <div className="mb-4 flex items-start gap-3">
                                <QuestionBadge number={idx + 1} />
                                <div>
                                  <p className="pt-1 text-sm font-semibold text-foreground sm:text-base">
                                    {q.text}
                                  </p>

                                  {q.description && (
                                    <p className="mt-1 text-xs text-muted-foreground">
                                      {q.description}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="space-y-3">
                                <TemplateOptionButtons
                                  options={q.options}
                                  value={createAnswers[q.id]}
                                  onChange={(value) =>
                                    setCreateAnswers((prev) => ({
                                      ...prev,
                                      [q.id]: value,
                                    }))
                                  }
                                />

                                <div>
                                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                                    Remark / Comment
                                  </label>
                                  <textarea
                                    rows={1}
                                    value={createRemarks[q.id] || ""}
                                    onChange={(e) => {
                                      setCreateRemarks((prev) => ({
                                        ...prev,
                                        [q.id]: e.target.value,
                                      }));

                                      autoResizeTextarea(e.target);
                                    }}
                                    onInput={(e) =>
                                      autoResizeTextarea(e.target)
                                    }
                                    className="min-h-[42px] w-full resize-none overflow-hidden rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    placeholder="Add comment if you want to reject this question..."
                                  />
                                </div>

                                <PhotoUploadArea
                                  id={`create-maker-${q.id}`}
                                  previewBase64={createMedia[q.id]}
                                  label={
                                    q.photo_required
                                      ? "Upload photo (required)"
                                      : "Upload photo (optional)"
                                  }
                                  onFileChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;

                                    setCreateMedia((prev) => ({
                                      ...prev,
                                      [q.id]: file,
                                    }));
                                  }}
                                  onRemove={() =>
                                    setCreateMedia((prev) => ({
                                      ...prev,
                                      [q.id]: undefined,
                                    }))
                                  }
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="mt-6">
                        <button
                          type="button"
                          onClick={handleCreateAndSubmitChecklist}
                          disabled={submitting}
                          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-200 transition-all hover:shadow-xl hover:shadow-orange-300 disabled:opacity-60"
                        >
                          <Send className="h-4 w-4" />
                          {submitting ? "Submitting..." : "Submit Checklist"}
                        </button>
                      </div>
                    </>
                  )}
                </section>
              ))}

            {/* ═══ VIEW: MAKER FIX ═══ */}
            {view === "maker_fix_observation" && detail && (
              <RectifySafetyObservation
                detail={detail}
                onBack={backToDashboard}
                onSuccess={() => {
                  fetchList();
                  backToDashboard();
                }}
              />
            )}

            {view === "maker_fix" && detail && (
              <section>
                <button
                  type="button"
                  onClick={backToDashboard}
                  className="mb-4 inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <ArrowLeft className="h-4 w-4" /> Back to Dashboard
                </button>

                <div className="mb-6 rounded-xl border bg-card p-5 shadow-sm">
                  <h1 className="text-lg font-bold text-foreground sm:text-xl">
                    {detail.name}
                  </h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {makerEditableItems.length} item(s) to fix
                  </p>
                </div>

                <ReportHeaderInfoCard detail={detail} />

                {makerEditableItems.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No items pending for you right now.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {makerFixItems.map(
                      ({ item, sub, editable, highlighted }, idx) => {
                        const hasAnswer = Boolean(
                          sub.answer ||
                          sub.latest_maker_answer ||
                          sub.latest_checker_answer,
                        );
                        const isHidden = !editable && !hasAnswer;

                        if (isHidden) return null;

                        const checkerComment =
                          sub.latest_checker_reject_remarks ||
                          sub.latest_checker_remarks ||
                          sub.checker_remarks ||
                          "";

                        const checkerPhoto =
                          sub.latest_checker_reject_photo_url ||
                          sub.latest_checker_photo_url ||
                          "";

                        return (
                          <div
                            key={item.id}
                            className={`rounded-xl border p-5 shadow-sm transition-shadow hover:shadow-md ${
                              highlighted
                                ? "border-red-300 bg-red-50"
                                : "bg-card border-border opacity-75"
                            }`}
                          >
                            {highlighted ? (
                              <span className="inline-flex rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                                Rework Required
                              </span>
                            ) : editable ? (
                              <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                                Pending Maker Input
                              </span>
                            ) : (
                              <span className="inline-flex rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                                Filled by Checker
                              </span>
                            )}

                            <div className="mb-4 flex items-start gap-3">
                              <QuestionBadge number={idx + 1} />
                              <p className="pt-1 text-sm font-semibold text-foreground sm:text-base">
                                {item.title}
                              </p>
                            </div>

                            <div className="space-y-3">
                              {sub.supervisor_remarks && (
                                <RemarksBubble
                                  label="Supervisor"
                                  text={sub.supervisor_remarks}
                                />
                              )}
                              {checkerPhoto && (
                                <PhotoViewButton
                                  url={checkerPhoto}
                                  label="View Checker Photo"
                                />
                              )}

                              {editable ? (
                                <TemplateOptionButtons
                                  options={item.options}
                                  value={makerAnswers[sub.id] || ""}
                                  onChange={(value) => {
                                    setMakerAnswers((prev) => ({
                                      ...prev,
                                      [sub.id]: value,
                                    }));
                                  }}
                                />
                              ) : (
                                <div className="flex flex-col gap-1.5">
                                  <RemarksBubble
                                    label="Submission Answer"
                                    text={
                                      sub.answer ||
                                      makerAnswers[sub.id] ||
                                      "No Answer"
                                    }
                                  />
                                </div>
                              )}

                              {checkerComment && (
                                <RemarksBubble
                                  label="Checker Comment"
                                  text={checkerComment}
                                />
                              )}

                              <div>
                                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                                  Remarks (what was fixed / checked)
                                </label>
                                <textarea
                                  disabled={!editable}
                                  className={`w-full rounded-lg border border-border bg-muted/30 p-3 text-sm ${
                                    !editable
                                      ? "cursor-not-allowed opacity-60"
                                      : ""
                                  }`}
                                  value={makerRemarks[sub.id] ?? ""}
                                  onChange={(e) => {
                                    if (!editable) return;

                                    setMakerRemarks((prev) => ({
                                      ...prev,
                                      [sub.id]: e.target.value,
                                    }));
                                  }}
                                  rows={2}
                                />
                              </div>

                              {editable && (
                                <PhotoUploadArea
                                  id={`maker-fix-${sub.id}`}
                                  previewBase64={makerMedia[sub.id]}
                                  label={
                                    item.photo_required
                                      ? "Upload rework photo (required)"
                                      : "Upload rework photo (optional)"
                                  }
                                  onFileChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;

                                    setMakerMedia((prev) => ({
                                      ...prev,
                                      [sub.id]: file,
                                    }));
                                  }}
                                  onRemove={() =>
                                    setMakerMedia((prev) => ({
                                      ...prev,
                                      [sub.id]: undefined,
                                    }))
                                  }
                                />
                              )}

                              {/* <div className="flex justify-end pt-1">
                                                            <button type="button"
                                                                onClick={() => handleSubmitSingleFix(sub.id)}
                                                                disabled={submitting}
                                                                className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-primary to-primary/90 px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-all hover:shadow-md disabled:opacity-60">
                                                                <Send className="h-3.5 w-3.5" />
                                                                Submit Fix
                                                            </button>
                                                        </div> */}
                            </div>
                          </div>
                        );
                      },
                    )}
                  </div>
                )}

                <SafetyChecklistSignOffSection
                  detail={detail}
                  className="mt-6"
                />

                {makerEditableItems.length > 0 && (
                  <div className="mt-6">
                    <button
                      type="button"
                      onClick={handleSubmitAllFixes}
                      disabled={submitting}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-200 transition-all hover:shadow-xl hover:shadow-orange-300 disabled:opacity-60"
                    >
                      <Send className="h-4 w-4" />
                      {submitting ? "Submitting…" : "Submit All Fixes"}
                    </button>
                  </div>
                )}
              </section>
            )}

            {/* ═══ VIEW: DASHBOARD ═══ */}
            {view === "dashboard" && (
              <section>
                {/* Header */}
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
                      <Wrench className="h-5 w-5 text-orange-500" />
                    </div>
                    <div>
                      <h1 className="text-xl font-bold text-foreground sm:text-2xl">
                        {window.location.pathname.includes("observations")
                          ? "Safety Observations Dashboard"
                          : "Safety Checklist Dashboard"}
                      </h1>
                      {/* <p className="text-sm text-muted-foreground">
                                                Create safety checklist and fix rejected inspection items
                                            </p> */}
                    </div>
                  </div>

                  {!isObservations && (
                    <button
                      type="button"
                      onClick={openCreateChecklist}
                      className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:shadow-md"
                    >
                      <Plus className="h-4 w-4" />
                      Start Checklist
                    </button>
                  )}
                </div>

                {/* Counter cards */}
                <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
                  {(isObservations
                    ? [
                        {
                          label: "Total Raised Observations",
                          icon: (
                            <ClipboardList className="h-3.5 w-3.5 text-purple-600" />
                          ),
                          colorCls: "text-purple-600",
                          count: makerTotalCount,
                        },
                        {
                          label: "Open Observations",
                          icon: (
                            <FolderOpen className="h-3.5 w-3.5 text-blue-500" />
                          ),
                          colorCls: "text-blue-500",
                          count: openObservationsCount,
                        },
                        {
                          label: "Closed Observations",
                          icon: (
                            <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                          ),
                          colorCls: "text-green-600",
                          count: checkerApprovedCount,
                        },
                        {
                          label: "Pending Rectification",
                          icon: (
                            <Clock className="h-3.5 w-3.5 text-yellow-500" />
                          ),
                          colorCls: "text-yellow-500",
                          count: makerPendingRectification.length,
                        },
                        {
                          label: "Pending Re-rectification",
                          icon: <Eye className="h-3.5 w-3.5 text-orange-500" />,
                          colorCls: "text-orange-500",
                          count: makerPendingReview.length,
                        },
                        {
                          label: "Unsafe Act Observations",
                          icon: (
                            <TriangleAlert className="h-3.5 w-3.5 text-red-500" />
                          ),
                          colorCls: "text-red-500",
                          count: unsafeActCount,
                        },
                        {
                          label: "Unsafe Condition Observations",
                          icon: (
                            <TriangleAlert className="h-3.5 w-3.5 text-red-500" />
                          ),
                          colorCls: "text-red-500",
                          count: unsafeConditionCount,
                        },
                        {
                          label: "Low Risk",
                          icon: (
                            <Activity className="h-3.5 w-3.5 text-green-500" />
                          ),
                          colorCls: "text-green-600",
                          count: lowRiskCount,
                        },
                        {
                          label: "Medium Risk",
                          icon: (
                            <Activity className="h-3.5 w-3.5 text-orange-400" />
                          ),
                          colorCls: "text-orange-500",
                          count: mediumRiskCount,
                        },
                        {
                          label: "High Risk",
                          icon: (
                            <Activity className="h-3.5 w-3.5 text-red-600" />
                          ),
                          colorCls: "text-red-600",
                          count: highRiskCount,
                        },
                        {
                          label: "Overdue Observations",
                          icon: <Clock className="h-3.5 w-3.5 text-red-500" />,
                          colorCls: "text-red-500",
                          count: overdueObservationsCount,
                        },
                        {
                          label: "On-Time Closures",
                          icon: (
                            <ClipboardCheck className="h-3.5 w-3.5 text-emerald-500" />
                          ),
                          colorCls: "text-emerald-600",
                          count: onTimeClosuresCount,
                        },
                      ]
                    : [
                        {
                          label: "Pending Reviews",
                          icon: (
                            <Clock className="h-3.5 w-3.5 text-yellow-500" />
                          ),
                          colorCls: "text-yellow-500",
                          count: makerPendingReview.length,
                        },
                        {
                          label: "Pending Rectifications",
                          icon: <Eye className="h-3.5 w-3.5 text-orange-500" />,
                          colorCls: "text-orange-500",
                          count: makerPendingRectification.length,
                        },
                        {
                          label: "Approved",
                          icon: (
                            <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                          ),
                          colorCls: "text-green-600",
                          count: makerApprovedCount,
                        },
                        {
                          label: "Rejected",
                          icon: (
                            <TriangleAlert className="h-3.5 w-3.5 text-red-500" />
                          ),
                          colorCls: "text-red-600",
                          count: makerRejectedCount,
                        },
                        {
                          label: "Total",
                          icon: (
                            <ClipboardList className="h-3.5 w-3.5 text-blue-600" />
                          ),
                          colorCls: "text-blue-600",
                          count: makerTotalCount,
                        },
                      ]
                  ).map(({ label, icon, colorCls, count }) => (
                    <div
                      key={label}
                      className="rounded-xl border bg-card p-4 shadow-sm"
                    >
                      <div className="mb-1 flex items-center gap-1.5">
                        {icon}
                        <span className={`text-xs font-medium ${colorCls}`}>
                          {label}
                        </span>
                      </div>
                      <p className="text-2xl font-bold text-foreground">
                        {Number.isFinite(Number(count)) ? Number(count) : 0}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Pending for Review */}
                <div className="mb-6">
                  <div className="mb-2 flex items-center gap-2">
                    {isObservations ? (
                      <Eye className="h-4 w-4 text-orange-500" />
                    ) : (
                      <Clock className="h-4 w-4 text-yellow-500" />
                    )}
                    <h2
                      className={`text-sm font-semibold sm:text-base ${isObservations ? "text-orange-500" : "text-yellow-500"}`}
                    >
                      {isObservations
                        ? "Pending for Re-rectification"
                        : "Pending for Review"}
                    </h2>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      {makerPendingReview.length}
                    </span>
                  </div>

                  <div
                    className={`rounded-xl border bg-card shadow-sm ${isObservations ? "max-h-[350px] overflow-y-auto custom-scrollbar" : ""}`}
                  >
                    {makerPendingReview.length === 0 ? (
                      <p className="p-4 text-sm text-muted-foreground">
                        No items
                      </p>
                    ) : (
                      makerPendingReview.map((item) => (
                        <div
                          key={item.id}
                          className="flex flex-col gap-2 border-b border-border/50 p-4 last:border-0 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div>
                            <p className="font-medium text-foreground">
                              {item.name || `Observation #${item.id}`}
                              {getItemReportName(item)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatChecklistDateTime(item.created_at)}
                              {totalQuestionsLabel(item)
                                ? ` · ${totalQuestionsLabel(item)}`
                                : ""}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-orange-700">
                              In Review
                            </span>

                            <button
                              type="button"
                              title="View Observation"
                              onClick={() => {
                                setReadonlyChecklist(item);
                                setReadonlyPendingStatusLabel(
                                  "Pending for Review",
                                );
                              }}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-700 transition-colors hover:bg-blue-100"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Pending for Rectification */}
                <div className="mb-6">
                  <div className="mb-2 flex items-center gap-2">
                    {isObservations ? (
                      <Clock className="h-4 w-4 text-yellow-500" />
                    ) : (
                      <Send className="h-4 w-4 text-orange-500" />
                    )}
                    <h2
                      className={`text-sm font-semibold sm:text-base ${isObservations ? "text-yellow-500" : "text-orange-500"}`}
                    >
                      Pending for Rectification
                    </h2>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      {makerPendingRectification.length}
                    </span>
                  </div>

                  <div
                    className={`rounded-xl border bg-card shadow-sm ${isObservations ? "max-h-[350px] overflow-y-auto custom-scrollbar" : ""}`}
                  >
                    {makerPendingRectification.length === 0 ? (
                      <p className="p-4 text-sm text-muted-foreground">
                        No items
                      </p>
                    ) : (
                      makerPendingRectification.map((item) => {
                        const canRectify = makerCanRectify(item);

                        return (
                          <div
                            key={item.id}
                            className="flex flex-col gap-2 border-b border-border/50 p-4 last:border-0 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div>
                              <p className="font-medium text-foreground">
                                {item.name || `Observation #${item.id}`}
                                {getItemReportName(item)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {item.created_at
                                  ? formatChecklistDateTime(item.created_at)
                                  : ""}
                                {rejectedPointsLabel(item)
                                  ? ` · ${rejectedPointsLabel(item)}`
                                  : ""}
                              </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                              <span
                                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                                  canRectify
                                    ? "bg-red-100 text-orange-500"
                                    : "bg-orange-100 text-orange-500"
                                }`}
                              >
                                {canRectify
                                  ? "Rectification Pending"
                                  : "Rectifying"}
                              </span>

                              {canRectify ? (
                                <button
                                  type="button"
                                  title="Rectify Observation"
                                  onClick={() => openMakerFix(item)}
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-orange-200 bg-orange-50 text-orange-700 transition-colors hover:bg-orange-100"
                                >
                                  <Wrench className="h-4 w-4" />
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  title="View Observation"
                                  onClick={() => {
                                    setReadonlyChecklist(item);
                                    setReadonlyPendingStatusLabel(
                                      "Pending for Rectification",
                                    );
                                  }}
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-700 transition-colors hover:bg-blue-100"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <ChecklistFilters
                  filters={filters}
                  setFilters={setFilters}
                  contractorOptions={contractorOptions}
                  typeOptions={typeOptions}
                  isObservations={isObservations}
                  wingOptions={wingOptions}
                  hazardOptions={hazardOptions}
                />

                {/* Completed / Closed Observations */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 mb-6">
                  {/* Left Side: Closed Observations */}
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-muted-foreground" />
                      <h2
                        className="text-sm font-semibold text-foreground sm:text-base"
                        style={{ color: "hsl(145, 65%, 42%)" }}
                      >
                        {isObservations
                          ? "Closed Observations"
                          : "Completed Checklists"}
                      </h2>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        {makerCompletedChecklists.length}
                      </span>
                    </div>
                    <div
                      className={`rounded-xl border bg-card shadow-sm ${isObservations ? "max-h-[350px] overflow-y-auto custom-scrollbar" : ""}`}
                    >
                      {makerCompletedChecklists.length === 0 ? (
                        <p className="p-4 text-sm text-muted-foreground">
                          No items
                        </p>
                      ) : (
                        makerCompletedChecklists.map((item) => (
                          <div
                            key={item.id}
                            className="flex flex-col gap-2 border-b border-border/50 p-4 last:border-0 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div>
                              <p className="font-medium text-foreground">
                                {item.name || `Observation #${item.id}`}
                                {getItemReportName(item)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {item.created_at
                                  ? formatChecklistDateTime(item.created_at)
                                  : ""}
                              </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                              <button
                                type="button"
                                title="View History"
                                onClick={() => {
                                  if (isObservations) {
                                    setReadonlyChecklist(item);
                                    setReadonlyPendingStatusLabel(
                                      "Closed Observation",
                                    );
                                  } else {
                                    setHistoryChecklist(item);
                                  }
                                }}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-700 transition-colors hover:bg-blue-100"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Right Side: Reports */}
                  {isObservations && (
                    <div>
                      <div className="mb-2 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                        <h2
                          className="text-sm font-semibold text-foreground sm:text-base"
                          style={{ color: "hsl(145, 65%, 42%)" }}
                        >
                          Reports
                        </h2>
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          {groupedReports.length}
                        </span>
                      </div>
                      <div
                        className={`rounded-xl border bg-card shadow-sm ${isObservations ? "max-h-[350px] overflow-y-auto custom-scrollbar" : ""}`}
                      >
                        {groupedReports.length === 0 ? (
                          <p className="p-4 text-sm text-muted-foreground">
                            No items
                          </p>
                        ) : (
                          groupedReports.map((report) => (
                            <div
                              key={`report-${report.date}`}
                              className="flex flex-col gap-2 border-b border-border/50 p-4 last:border-0 sm:flex-row sm:items-center sm:justify-between"
                            >
                              <div>
                                <p className="font-medium text-foreground">
                                  {report.reportName}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {report.date}
                                </p>
                              </div>
                              <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                                <button
                                  type="button"
                                  title="Download Report"
                                  onClick={() =>
                                    handleDownloadReport({
                                      id: report.firstItemId,
                                      name: report.reportName,
                                      date: report.date,
                                    })
                                  }
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-green-200 bg-green-50 text-green-700 transition-colors hover:bg-green-100"
                                >
                                  <Download className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}
          </>
        )}

        {isObservations ? (
          <SafetyObservationReadonlyModal
            open={!!readonlyChecklist}
            checklistId={readonlyChecklist?.id}
            onClose={() => setReadonlyChecklist(null)}
          />
        ) : (
          <SafetyChecklistReadonlyModal
            open={!!readonlyChecklist}
            checklistId={readonlyChecklist?.id}
            pendingStatusLabel={readonlyPendingStatusLabel}
            onClose={() => setReadonlyChecklist(null)}
          />
        )}

        <SafetyChecklistHistoryModal
          open={!!historyChecklist}
          checklistId={historyChecklist?.id}
          title={historyChecklist?.name}
          onClose={() => setHistoryChecklist(null)}
        />

        {isMakerSignatureModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-2xl rounded-xl bg-white p-5 shadow-xl">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-base font-semibold text-foreground">
                  Final Signature
                </h3>
                <button
                  type="button"
                  onClick={handleCloseMakerSignatureModal}
                  className="rounded p-1 text-muted-foreground hover:bg-muted"
                >
                  <XIcon className="h-4 w-4" />
                </button>
              </div>
              <p className="mb-3 text-xs text-muted-foreground">
                Draw your signature and submit to complete the checklist action.
              </p>
              <div className="rounded-lg border border-border bg-white p-2">
                <SignatureCanvas
                  ref={sigCanvasRef}
                  penColor="black"
                  canvasProps={{
                    width: 760,
                    height: 220,
                    className: "h-[220px] w-full",
                  }}
                />
              </div>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={() => sigCanvasRef.current?.clear()}
                  className="rounded-lg border px-3 py-1.5 text-xs font-medium text-foreground"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={handleMakerSignatureSubmit}
                  disabled={signatureSubmitting}
                  className="rounded-lg bg-gradient-to-r from-orange-400 to-orange-500 px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
                >
                  {signatureSubmitting
                    ? "Submitting..."
                    : signaturePurpose === "create"
                      ? "Submit Checklist"
                      : "Submit Fix"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
