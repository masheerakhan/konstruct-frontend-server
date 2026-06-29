import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Routes, Route, useNavigate, useSearchParams } from "react-router-dom";
import { Folder, Plus, X, FileText, ChevronRight, FolderOpen, Clock, Upload as UploadIcon, Trash2, Pencil, Search, ArrowUpDown, Download, GripVertical, Eye } from "lucide-react";
import CreateDocument from "./CreateDocument";
import MinimumManpowerRegisterTable from "../Resources/MMR/MinimumManpowerRegisterTable";
import QCAssetsRegisterTable from "../Resources/QcAssets/QCAssetsRegisterTable";
import { takePendingAdd } from "./transmittalStorage";
// import ExcelPreviewModal from "../ExcelPreviewModal";
import toast from "react-hot-toast";
import {
  getRootFolders,
  getFolderDetail,
  createFolder,
  updateFolder,
  listDmsDocuments,
  createDmsDocument,
  uploadDmsFile,
  getDmsFileOpenLink,
  deleteFolder,
  deleteDmsFile,
  listDmsDrafts,
  getProjectsForCurrentUser,
  getProjectsByOrgOwnership,
  getSessionOrgId,
  getDmsMinimumManpowerRegister,
  getDmsQcAssetsRegister,
  saveDmsMinimumManpowerRegister,
  saveDmsQcAssetsRegister,
  getDmsCommunicationMatrix,
  getDmsEscalationMatrix,
  normalizeDmsMmrDeployment,
  downloadDmsFile,
  patchDmsFileReorder,
  postDmsFilesZipDownload,
} from "../../../api";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { capitalCase, safeCapitalCaseName } from "./stringCase";
import CommunicationMatrixRegisterTable from "../OrganizationChart/CommunicationMatrixRegisterTable";
import EscalationMatrix from "../OrganizationChart/EscalationMatrix";
import MomFolderView from "../ConstructionPrograms/MomFolderView";
import BoxFileRegister from "../BoxFile/BoxFileRegister";
import MIRForm from "../MIR/MaterialInspectionRequest/MIR";
import MIRRegister from "../MIR/MaterialInspectionRequest/MIRRegister";
import MaterialInwardRegister from "../MIR/MaterialInspectionRequest/MaterialInwardRegister";
import EquipmentInspectionReport from "../MIR/MaterialInspectionRequest/EquipmentInspectionReport";
import WorkInspectionRequest from "../WIR/WorkInspectionRequest";
import WIRRegister from "../WIR/WIRRegister";
import AreaClearanceForm from "../WIR/AreaClearanceForm";
import PVE from "../PeriodicVendorEvaluation/PVE";
import RFI from "../RequestForInformation/RFI";
import ContactDirectory from "../ContactDirectory/ContactDirectory";
import InternalNCR from "../NCR/InternalNCR";
import ExternalNCRRegister from "../NCR/ExternalNCR/ExternalNCRRegister";
import ExternalSORRegister from "../SOR/ExternalSORRegister";
import DRR from "../RejectionRegisterAndRepairCost/DRR";
// import PQPRegister from "./DocTypes/ProjectPlan/PQPRegister";
// import MASRegister from "./DocTypes/MaterialSubmission/MASRegister";
// import WMSRegister from "./DocTypes/MethodStatement/WMSRegister";
// import PQDRegister from "./DocTypes/PrequalificationSubmission/PQDRegister";
// import DMPRegister from "./DocTypes/DesignMixSubmission/DMPRegister";
import DebitNoteRegister from "../DebitNote/DebitNoteRegister";
import StopWorkNoticeRegister from "../DebitNote/StopWorkNoticeRegister";
import SafetyCommitteeMeetingAgendaRegister from "../SafetyCommittee/SafetyCommitteeMeetingAgendaRegister";
import MockDrillObservationReportRegister from "../MockDrills/MockDrillObservationReportRegister";
import ConstructionChemicalsStockShelfLifeRecord from "../MTP&MTR/ShelfLifeRecord";
import AllDocumentTracker from "../DMS/AllDocumentTracker";
import DCPProposal from "../DMS/DCP";
import InHouseTestReportRegister from "../MTP&MTR/InHouseTestReportRegister";
import ThirdPartyTestReportRegister from "../MTP&MTR/ThirdPartyTestReportRegister";
import AccidentReport from "../IncidentAccidentLTIRecords/AccidentReport/AccidentReport";
import AccidentRegister from "../IncidentAccidentLTIRecords/AccidentReport/AccidentRegister";
import { InjuryReportForm } from "../IncidentAccidentLTIRecords/IncidentAccidentLTI/InjuryReportForm";
import { InjuryRegister } from "../IncidentAccidentLTIRecords/IncidentAccidentLTI/InjuryRegister";
import ToolboxTalksAttendanceSheet from "../TBT/HSE-TBTRecord/ToolboxTalksAttendanceSheet";
import TrainingAttendanceSheet from "../TBT/HSE-TBTRecord/TrainingAttendanceSheet";
import ToolboxRegister from "../TBT/HSE-TBTRecord/ToolboxRegister";

import TrainingQualityRegister from "../TBT/TrainingRecords/TrainingQualityRegister";
import TrainingHSERegister from "../TBT/TrainingRecords/TrainingHSERegister";

import Induction from "../Induction/Induction";
import InductionRegister from "../Induction/InductionRegister";

import HseActivityTracker from "../HseReports/HseActivityTracker";
import ComplianceTracker from "../HseReports/ComplianceTracker";

import HSEChecklist from "../HseReports/HSEChecklist";
import HSERequirements from "../HseReports/HSERequirements";
import HSEMonthlyReport from "../HseReports/HSEMonthlyReport";

import CalibrationRegister from "../MeasuringAndValodation/CalibrationRegister";
import { formatDisplayDate, formatInputDate, formatDisplayDateTime } from "../../../utils/dateFormatter";

// impoer HSEMonthlyReport

const RESOURCES_ROOT_NAME = "Resources";
const RESOURCES_DEFAULT_SUBFOLDERS = ["Minimum Manpower", "QC Assets"];
const CONSTRUCTION_PROGRAMS_ROOT_NAMES = ["Construction Programs", "Construction Programmes"];
const CONSTRUCTION_PROGRAMS_ROOT_ALIASES = [
  ...CONSTRUCTION_PROGRAMS_ROOT_NAMES,
  "Master Construction programs, DPR & WPR, MOM",
];
const MOM_SUBFOLDER_NAME = "MOM (Minutes of Meeting)";



function readLocalJson(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw || raw === "undefined" || raw === "null") return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function cleanStorageValue(value) {
  if (value === null || value === undefined) return "";
  const text = String(value).trim();
  if (!text || ["null", "undefined", "none"].includes(text.toLowerCase())) {
    return "";
  }
  return text;
}

function normalizeFolderCategory(value, fallback = "greenfield") {
  const v = cleanStorageValue(value).toLowerCase();

  if (["both", "greenfield", "brownfield"].includes(v)) {
    return v;
  }

  return fallback;
}

function resolveDmsOrgIdFromStorage() {
  const user = readLocalJson("USER_DATA") || readLocalJson("userData");

  return cleanStorageValue(
    user?.org ||
    user?.organization_id ||
    user?.org_id ||
    localStorage.getItem("ORG_ID") ||
    localStorage.getItem("ACTIVE_ORG_ID")
  );
}

function normalizeProjectOption(project) {
  const id = cleanStorageValue(project?.id || project?.project_id);
  if (!id) return null;

  return {
    id,
    name:
      project?.name ||
      project?.project_name ||
      project?.project?.name ||
      `Project ${id}`,
    projectCategory: normalizeFolderCategory(
      project?.project_category ||
      project?.projectCategory ||
      project?.category,
      "greenfield"
    ),
  };
}

function resolveDmsProjectIdFromStorage() {
  const user = readLocalJson("USER_DATA") || readLocalJson("userData");

  return cleanStorageValue(
    localStorage.getItem("ACTIVE_PROJECT_ID") ||
    localStorage.getItem("PROJECT_ID") ||
    localStorage.getItem("SELECTED_PROJECT_ID") ||
    user?.project_id ||
    user?.project?.id
  );
}

function resolveDmsProjectCategoryFromStorage() {
  return cleanStorageValue(
    localStorage.getItem("ACTIVE_PROJECT_CATEGORY") ||
    localStorage.getItem("PROJECT_CATEGORY")
  );
}



function newRegisterClientKey(prefix) {
  const uuid = window.crypto?.randomUUID?.();
  if (uuid) return `${prefix}-${uuid}`;
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

function mapMinimumManpowerRowFromApi(r) {
  const dep = String(r.deployment ?? "").trim().toUpperCase().slice(0, 1);
  const isCustom = Boolean(r.is_custom) || r.template_id == null;
  return {
    ...r,
    is_custom: isCustom,
    deployment: ["B", "P", "S"].includes(dep) ? dep : "",
    actual_deployment: r.actual_deployment != null ? String(r.actual_deployment) : "",
  };
}

function mapQcRowFromApi(r) {
  const isCustom = Boolean(r.is_custom) || r.template_id == null;
  return { ...r, is_custom: isCustom };
}

function emptyMmrCustomRow() {
  return {
    template_id: null,
    entry_id: null,
    is_custom: true,
    serial_no: null,
    position: "",
    min_experience_years: "",
    required_number: "",
    actual_deployment: "",
    deployment: "",
    remark: "",
    clientKey: newRegisterClientKey("mmr"),
  };
}

function emptyQcCustomRow() {
  return {
    template_id: null,
    entry_id: null,
    is_custom: true,
    serial_no: null,
    description: "",
    minimum_number: "",
    actual_count: null,
    remark: "",
    clientKey: newRegisterClientKey("qc"),
  };
}

/** Single-flight guard so React Strict Mode / parallel loads cannot create duplicate “Resources” roots. */
let resourcesFolderEnsurePromise = null;
let constructionProgramsFolderEnsurePromise = null;

async function ensureDefaultResourcesFolders(handleApiError, dmsScope = {}) {
  if (!dmsScope.org_id || !dmsScope.project_id) return;

  const activeCategory = String(dmsScope.project_category || "").toLowerCase();

  // Resources folder is Greenfield-only.
  // Brownfield project me Resources auto-create nahi hoga.
  if (activeCategory !== "greenfield") return;

  if (resourcesFolderEnsurePromise) return resourcesFolderEnsurePromise;

  resourcesFolderEnsurePromise = (async () => {
    try {
      const greenfieldScope = {
        org_id: dmsScope.org_id,
        project_id: dmsScope.project_id,
        project_category: "greenfield",
      };

      const rootsRes = await getRootFolders(greenfieldScope);
      const roots = Array.isArray(rootsRes.data) ? rootsRes.data : [];

      const byName = (list, name) =>
        list.find(
          (item) =>
            String(item?.name || "").toLowerCase() ===
            String(name).toLowerCase()
        );

      let resourcesNode = byName(roots, RESOURCES_ROOT_NAME);

      if (!resourcesNode?.id) {
        await createFolder({
          org_id: dmsScope.org_id,
          project_id: "",
          project_category: "greenfield",
          name: RESOURCES_ROOT_NAME,
          parent: null,
          sequence_no: 1,
          folder_kind: "generic",
          can_upload_files: false,
        });

        const again = await getRootFolders(greenfieldScope);
        const roots2 = Array.isArray(again.data) ? again.data : [];
        resourcesNode = byName(roots2, RESOURCES_ROOT_NAME);
      }

      const rid = resourcesNode?.id;
      if (rid == null) return;

      const detailRes = await getFolderDetail(rid, greenfieldScope);
      const detail = detailRes?.data;
      const children = Array.isArray(detail?.children) ? detail.children : [];

      const have = new Set(
        children.map((c) => String(c?.name || "").toLowerCase())
      );

      for (const [index, sub] of RESOURCES_DEFAULT_SUBFOLDERS.entries()) {
        const subKey = sub.toLowerCase();

        if (!have.has(subKey)) {
          await createFolder({
            org_id: dmsScope.org_id,
            project_id: "",
            project_category: "greenfield",
            name: sub,
            parent: rid,
            sequence_no: index + 1,
            folder_kind:
              subKey === "minimum manpower" ? "minimum_manpower" : "qc_assets",
            can_upload_files: false,
          });

          have.add(subKey);
        }
      }
    } catch (err) {
      handleApiError(err, "ensure default Resources folders");
    } finally {
      resourcesFolderEnsurePromise = null;
    }
  })();

  return resourcesFolderEnsurePromise;
}

async function ensureDefaultConstructionProgramsFolders(handleApiError, dmsScope = {}) {
  if (!dmsScope.org_id || !dmsScope.project_id) return;

  if (constructionProgramsFolderEnsurePromise) return constructionProgramsFolderEnsurePromise;

  constructionProgramsFolderEnsurePromise = (async () => {
    try {
      const rootsRes = await getRootFolders(dmsScope);
      const roots = Array.isArray(rootsRes.data) ? rootsRes.data : [];
      const byNameLoose = (list, name) =>
        list.find((item) => String(item?.name || "").toLowerCase() === String(name).toLowerCase());

      let cpNode = null;
      for (const nm of CONSTRUCTION_PROGRAMS_ROOT_NAMES) {
        cpNode = byNameLoose(roots, nm);
        if (cpNode?.id) break;
      }
      if (!cpNode?.id) return;

      const detailRes = await getFolderDetail(cpNode.id, dmsScope);
      const detail = detailRes?.data;
      const children = Array.isArray(detail?.children) ? detail.children : [];
      const have = new Set(
        children.map((c) => String(c?.name || "").toLowerCase().replace(/\s+/g, " ").trim())
      );
      const momKey = MOM_SUBFOLDER_NAME.toLowerCase();
      if (!have.has(momKey)) {
        await createFolder({
          org_id: dmsScope.org_id,
          project_id: cpNode.project_id || "",
          project_category: cpNode.project_category || "both",
          name: MOM_SUBFOLDER_NAME,
          parent: cpNode.id,
          sequence_no: 1,
          folder_kind: "generic",
          can_upload_files: false,
        });
      }
    } catch (err) {
      handleApiError(err, "ensure default Construction Programs folders");
    } finally {
      constructionProgramsFolderEnsurePromise = null;
    }
  })();

  return constructionProgramsFolderEnsurePromise;
}

function normalizeDmsFolderTitle(name) {
  return String(name || "").toLowerCase().replace(/\s+/g, " ").trim();
}

function isLikelyMomFolderName(name) {
  const n = normalizeDmsFolderTitle(name);
  const compact = n.replace(/[()\s]/g, "");
  if (compact === "momminutesofmeeting") return true;
  return n.includes("mom") && n.includes("minute");
}

function includesAnyFolderName(value, candidates) {
  const normalized = normalizeDmsFolderTitle(value);
  return candidates.some((candidate) => normalized === normalizeDmsFolderTitle(candidate));
}


function getTransmittalDocTypeByFolder(folder) {
  if (!folder) return "";

  const name = folder.name;

  if (
    includesAnyFolderName(name, [
      "Project Plans",
      "Project Plan",
      "Project Quality Plan",
      "Project Quality Plan (PQP)",
      "PQP",
    ])
  ) {
    return "Project Plans";
  }

  if (
    includesAnyFolderName(name, [
      "Material Submission",
      "Material Submittal",
      "Material Submission (MAS)",
      "Material Submittal (MAS)",
      "MAS",
    ])
  ) {
    return "Material Submittal";
  }

  if (
    includesAnyFolderName(name, [
      "Prequalification Submission",
      "Prequalification Submission (PQD)",
      "Prequalification Document Submission (PQD)",
      "Pre-Qualification",
      "Pre Qualification",
      "PQD",
    ])
  ) {
    return "Pre-Qualification";
  }

  if (
    includesAnyFolderName(name, [
      "Work Method Statement",
      "Work Method Statements",
      "Method Statement",
      "Method Statements",
      "WMS",
    ])
  ) {
    return "Method Statement";
  }

  if (
    includesAnyFolderName(name, [
      "Concrete Design Mix Submissions-Civil (DMP)",
      "Concrete Design Mix Submissions Civil (DMP)",
      "Concrete Design Mix Submissions",
      "Design Mix",
      "Design Mix Proposal",
      "Design Mix Proposal (DMP)",
      "DMP",
    ])
  ) {
    return "Design Mix";
  }

  if (
    includesAnyFolderName(name, [
      "Test Reports",
      "Test Report",
      "In-House Test Reports",
      "In House Test Reports",
      "Third Party Test Reports",
      "Third-Party Test Reports",
    ])
  ) {
    return "Test Reports";
  }

  return "";
}

function isTransmittalFolderNode(folder) {
  return Boolean(getTransmittalDocTypeByFolder(folder));
}


/**
 * Registers & Box Files: `folder_kind === box_file_register`, or name match ("Registers Box Files",
 * "Registers & Box Files", …). Name match also covers folders wrongly saved as `minimum_manpower`.
 */
function isRegistersBoxFilesFolderNode(folder) {
  if (!folder) return false;
  const kind = String(folder.folderKind || "").trim().toLowerCase();
  if (kind === "box_file_register") return true;
  const n = normalizeDmsFolderTitle(folder.name);
  const hasRegister = n.includes("register");
  const hasBox = n.includes("box");
  const hasFileWord = n.includes("file");
  return hasRegister && hasBox && hasFileWord;
}

function compareFoldersBySequenceAndName(a, b) {
  const seqA = Number.isFinite(Number(a?.effectiveSequenceNo))
    ? Number(a.effectiveSequenceNo)
    : Number.isFinite(Number(a?.sequenceNo))
      ? Number(a.sequenceNo)
      : 0;

  const seqB = Number.isFinite(Number(b?.effectiveSequenceNo))
    ? Number(b.effectiveSequenceNo)
    : Number.isFinite(Number(b?.sequenceNo))
      ? Number(b.sequenceNo)
      : 0;

  if (seqA !== seqB) return seqA - seqB;

  return String(a?.name || "").localeCompare(String(b?.name || ""), undefined, {
    sensitivity: "base",
  });
}

function hasAdminFolderEditAccess() {
  const roleRaw = localStorage.getItem("ROLE") || "";
  if (String(roleRaw).trim().toLowerCase() === "admin") return true;

  try {
    const userData = JSON.parse(localStorage.getItem("userData") || "null");
    const roles = new Set();
    if (userData?.role) roles.add(String(userData.role).trim().toLowerCase());
    if (Array.isArray(userData?.roles)) {
      userData.roles.forEach((r) => {
        const roleStr = typeof r === "string" ? r : r?.role || r?.name;
        if (roleStr) roles.add(String(roleStr).trim().toLowerCase());
      });
    }
    if (Array.isArray(userData?.accesses)) {
      userData.accesses.forEach((a) => {
        if (a?.role) roles.add(String(a.role).trim().toLowerCase());
        if (Array.isArray(a?.roles)) {
          a.roles.forEach((r) => {
            const roleStr = typeof r === "string" ? r : r?.role || r?.name;
            if (roleStr) roles.add(String(roleStr).trim().toLowerCase());
          });
        }
      });
    }
    return roles.has("admin");
  } catch {
    return false;
  }
}

function SortableFileRow({ file, index, canEditFolders, handleOpenFile, formatDisplayDateTime, formatSize, handleDeleteFile, handleDownloadFile, isSelected, onSelectToggle, isSelectionMode }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: String(file.id) });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors odd:bg-white even:bg-slate-50 relative z-0"
      onClick={() => handleOpenFile(file)}
    >
      <td className="pl-4 pr-2 py-3 text-gray-500">
        <div className="flex items-center gap-1.5">
          {isSelectionMode && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => {
                e.stopPropagation();
                onSelectToggle(file.id);
              }}
              onClick={(e) => e.stopPropagation()}
              className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary mr-1"
            />
          )}
          {canEditFolders && (
            <div
              role="button"
              tabIndex={0}
              {...attributes}
              {...listeners}
              className="cursor-grab hover:text-gray-700 active:cursor-grabbing text-gray-400 outline-none focus:outline-none flex items-center justify-center p-0.5 rounded-sm hover:bg-gray-200/50"
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical size={15} />
            </div>
          )}
          <span className="leading-none pt-[1px] pl-4">{file.sequenceNo ?? file.sequence_no ?? index + 1}</span>
        </div>
      </td>
      <td className="pl-2 pr-4 py-3">
        <div className="flex items-center gap-3">
          <FileText size={20} className="text-gray-500 shrink-0" />
          <span className="text-gray-800 truncate" title={file.name}>
            {file.name}
          </span>
        </div>
      </td>
      <td className="px-4 py-3 text-gray-500">
        <div className="flex items-center gap-1">
          <div className="w-3 shrink-0" />
          <span>{file.uploaded_by || file.created_by || "-"}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-gray-500">
        <div className="flex items-center gap-1">
          <div className="w-3 shrink-0" />
          <span>{formatDisplayDateTime(file.uploaded_at || file.created_at || file.createdAt)}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-gray-500">
        <div className="flex items-center gap-1">
          <div className="w-3 shrink-0" />
          <span>{formatSize(file.size || file.file_size)}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-gray-500">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenFile(file);
            }}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100"
            title="View file"
          >
            <Eye className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleDownloadFile(file);
            }}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100"
            title="Download file"
          >
            <Download className="h-4 w-4" />
          </button>

          {canEditFolders && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteFile(file);
              }}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
              title="Delete file"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

function DocumentManager() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const folderId = searchParams.get("folder");
  const processedPendingRef = useRef(false);

  const [rootFolders, setRootFolders] = useState([]);
  const [folderMap, setFolderMap] = useState({});
  const [currentFolderDetail, setCurrentFolderDetail] = useState(null);
  const [folderProjectCategory, setFolderProjectCategory] = useState("both"); //For Fields
  const [unfiled, setUnfiled] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingFolderId, setEditingFolderId] = useState(null);
  const [folderName, setFolderName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const [selectedFiles, setSelectedFiles] = useState(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const handleSelectToggle = (fileId) => {
    setSelectedFiles(prev => {
      const next = new Set(prev);
      if (next.has(fileId)) {
        next.delete(fileId);
      } else {
        next.add(fileId);
      }
      return next;
    });
  };

  const handleSelectAll = (fileIds) => {
    if (selectedFiles.size === fileIds.length && fileIds.length > 0) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(fileIds));
    }
  };

  const handleBulkDownload = async () => {
    if (!isSelectionMode) {
      setIsSelectionMode(true);
      return;
    }
    if (selectedFiles.size === 0) return;
    try {
      const loadingToast = toast.loading("Preparing zip file...");
      const response = await postDmsFilesZipDownload(Array.from(selectedFiles));

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'konstruct_documents.zip');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Download started successfully", { id: loadingToast });
      setSelectedFiles(new Set());
      setIsSelectionMode(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to download selected files");
    }
  };

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const SortHeader = ({ label, sortKey, className = "" }) => (
    <th
      className={`text-left px-4 py-3 font-medium text-gray-600 cursor-pointer hover:bg-gray-100/50 transition-colors ${className}`}
      onClick={() => handleSort(sortKey)}
    >
      <div className="flex items-center gap-1 whitespace-nowrap">
        <ArrowUpDown className={`w-3 h-3 shrink-0 ${sortConfig.key === sortKey ? 'text-primary' : 'text-gray-400'}`} />
        {label}
      </div>
    </th>
  );

  const applySort = (items, type) => {
    if (!sortConfig.key) return items;
    return [...items].sort((a, b) => {
      let aVal, bVal;
      switch (sortConfig.key) {
        case 'name':
          if (type === 'doc') {
            aVal = (a.refNo || a.name || "").toLowerCase();
            bVal = (b.refNo || b.name || "").toLowerCase();
          } else {
            aVal = (a.name || "").toLowerCase();
            bVal = (b.name || "").toLowerCase();
          }
          break;
        case 'createdBy':
          if (type === 'doc') {
            aVal = (a.created_by || "").toLowerCase();
            bVal = (b.created_by || "").toLowerCase();
          } else if (type === 'file') {
            aVal = (a.uploaded_by || a.created_by || "").toLowerCase();
            bVal = (b.uploaded_by || b.created_by || "").toLowerCase();
          } else {
            aVal = (a.createdBy || "").toLowerCase();
            bVal = (b.createdBy || "").toLowerCase();
          }
          break;
        case 'date':
          if (type === 'doc') {
            aVal = new Date(a.created_at || a.createdAt || 0).getTime();
            bVal = new Date(b.created_at || b.createdAt || 0).getTime();
          } else if (type === 'file') {
            aVal = new Date(a.uploaded_at || a.created_at || a.createdAt || 0).getTime();
            bVal = new Date(b.uploaded_at || b.created_at || b.createdAt || 0).getTime();
          } else {
            aVal = new Date(a.created_at || a.createdAt || 0).getTime();
            bVal = new Date(b.created_at || b.createdAt || 0).getTime();
          }
          break;
        case 'size':
          if (type === 'doc') {
            aVal = Number(a.size || a.file_size || 0);
            bVal = Number(b.size || b.file_size || 0);
          } else if (type === 'file') {
            aVal = Number(a.size || a.file_size || 0);
            bVal = Number(b.size || b.file_size || 0);
          } else {
            aVal = Number(a.size || 0);
            bVal = Number(b.size || 0);
          }
          break;
        case 'sequenceNo':
          if (type === 'folder') {
            aVal = Number(a.effectiveSequenceNo ?? a.sequenceNo ?? 0);
            bVal = Number(b.effectiveSequenceNo ?? b.sequenceNo ?? 0);
          } else {
            aVal = 0;
            bVal = 0;
          }
          break;
        default:
          return 0;
      }
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const [folderSequenceNo, setFolderSequenceNo] = useState(0);
  const [folderKind, setFolderKind] = useState("generic");
  const [folderUploadEnabled, setFolderUploadEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [specialFolderTab, setSpecialFolderTab] = useState("created");
  const [specialChildFormOpen, setSpecialChildFormOpen] = useState(false);

  const [folderGreenfieldSequenceNo, setFolderGreenfieldSequenceNo] = useState(0);
  const [folderBrownfieldSequenceNo, setFolderBrownfieldSequenceNo] = useState(0);

  const dmsOrgId = useMemo(() => resolveDmsOrgIdFromStorage(), []);

  const [dmsProjects, setDmsProjects] = useState([]);
  const [activeDmsProjectId, setActiveDmsProjectId] = useState(
    cleanStorageValue(localStorage.getItem("ACTIVE_PROJECT_ID"))
  );
  const [activeDmsProjectCategory, setActiveDmsProjectCategory] = useState(
    cleanStorageValue(localStorage.getItem("ACTIVE_PROJECT_CATEGORY")) || "greenfield"
  );

  const dmsScope = useMemo(() => {
    const scope = {};

    if (dmsOrgId) scope.org_id = String(dmsOrgId);
    if (activeDmsProjectId) scope.project_id = String(activeDmsProjectId);
    if (activeDmsProjectCategory) {
      scope.project_category = String(activeDmsProjectCategory).toLowerCase();
    }

    return scope;
  }, [dmsOrgId, activeDmsProjectId, activeDmsProjectCategory]);

  const [manpowerProjectId, setManpowerProjectId] = useState("");
  const [manpowerScope, setManpowerScope] = useState("Civil");
  const [manpowerRows, setManpowerRows] = useState([]);
  const [manpowerLoading, setManpowerLoading] = useState(false);
  const [manpowerSaving, setManpowerSaving] = useState(false);
  const [projectOptions, setProjectOptions] = useState([]);
  const [qcProjectId, setQcProjectId] = useState("");
  const [qcScope, setQcScope] = useState("Civil");
  const [qcRows, setQcRows] = useState([]);
  const [qcLoading, setQcLoading] = useState(false);
  const [qcSaving, setQcSaving] = useState(false);
  const [cmProjectId, setCmProjectId] = useState("");
  const [cmRows, setCmRows] = useState([]);
  const [cmLoading, setCmLoading] = useState(false);
  const [escalationRows, setEscalationRows] = useState([]);
  const [escalationLoading, setEscalationLoading] = useState(false);
  const [escalationProjectName, setEscalationProjectName] = useState("");

  // const [excelPreview, setExcelPreview] = useState({
  //   open: false,
  //   fileName: "",
  //   fileUrl: "",
  // });

  useEffect(() => {
    setSpecialFolderTab("created");
    setSpecialChildFormOpen(false);
  }, [folderId]);

  useEffect(() => {
    if (!showModal) {
      setEditingFolderId(null);
      setFolderName("");
      setFolderSequenceNo(0);
      setFolderGreenfieldSequenceNo(0);
      setFolderBrownfieldSequenceNo(0);
      setFolderKind("generic");
      setFolderProjectCategory(activeDmsProjectCategory || "greenfield");
      setFolderUploadEnabled(false);
    }
  }, [showModal, activeDmsProjectCategory]);

  const handleApiError = useCallback((err, action, options = {}) => {
    const status = err?.response?.status;
    const data = err?.response?.data;

    let msg = "";

    if (status === 404) {
      if (data?.detail) {
        msg = data.detail;
      } else {
        msg = `DMS API route not found (404) while trying to ${action}. Please verify backend route /api/dms/... is available.`;
      }
    } else if (typeof data === "string") {
      msg = data;
    } else if (data?.detail) {
      msg = data.detail;
    } else if (data && typeof data === "object") {
      msg = Object.entries(data)
        .map(([key, value]) => {
          const text = Array.isArray(value)
            ? value.join(", ")
            : typeof value === "object" && value !== null
              ? JSON.stringify(value)
              : String(value);

          return `${key}: ${text}`;
        })
        .join(" | ");
    } else {
      msg = err?.message || `Failed to ${action}.`;
    }

    setApiError(msg);

    if (options.toast) {
      toast.error(msg);
    }

    console.error(`[DMS] ${action} failed`, err);

    return msg;
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadDmsProjects() {
      try {
        setApiError("");

        if (!dmsOrgId) {
          setDmsProjects([]);
          setApiError("Organization not found for current user.");
          return;
        }

        const role = String(localStorage.getItem("ROLE") || "").trim().toLowerCase();

        let res;

        // Admin/org-admin: show all projects of current organization
        if (role === "admin" || role === "org admin" || role === "organization admin") {
          res = await getProjectsByOrgOwnership(dmsOrgId);
        } else {
          res = await getProjectsForCurrentUser();
        }

        const rawProjects = Array.isArray(res?.data)
          ? res.data
          : res?.data?.results || res?.data?.projects || [];

        const options = rawProjects
          .map(normalizeProjectOption)
          .filter(Boolean);

        if (cancelled) return;

        setDmsProjects(options);

        const storedProjectId = cleanStorageValue(localStorage.getItem("ACTIVE_PROJECT_ID"));
        const storedProject = options.find((p) => String(p.id) === String(storedProjectId));

        // If stored project is valid, keep it
        if (storedProject) {
          setActiveDmsProjectId(storedProject.id);
          setActiveDmsProjectCategory(storedProject.projectCategory || "greenfield");
          localStorage.setItem("ACTIVE_PROJECT_ID", String(storedProject.id));
          localStorage.setItem(
            "ACTIVE_PROJECT_CATEGORY",
            String(storedProject.projectCategory || "greenfield")
          );
          return;
        }

        // Auto-select first project so admin does not get stuck on blank project
        if (options.length > 0) {
          const first = options[0];
          setActiveDmsProjectId(first.id);
          setActiveDmsProjectCategory(first.projectCategory || "greenfield");
          localStorage.setItem("ACTIVE_PROJECT_ID", String(first.id));
          localStorage.setItem(
            "ACTIVE_PROJECT_CATEGORY",
            String(first.projectCategory || "greenfield")
          );
        } else {
          setActiveDmsProjectId("");
          setActiveDmsProjectCategory("greenfield");
          localStorage.removeItem("ACTIVE_PROJECT_ID");
          localStorage.removeItem("ACTIVE_PROJECT_CATEGORY");
        }
      } catch (err) {
        if (!cancelled) {
          setDmsProjects([]);
          handleApiError(err, "load projects for DMS");
        }
      }
    }

    loadDmsProjects();

    return () => {
      cancelled = true;
    };
  }, [dmsOrgId, handleApiError]);

  useEffect(() => {
    const pending = takePendingAdd();
    if (!pending || processedPendingRef.current) return;
    processedPendingRef.current = true;
    const { refNo, projectName, folderId: fid } = pending;
    createDmsDocument({
      org_id: dmsScope.org_id,
      project_id: dmsScope.project_id,
      name: refNo || "Transmittal Document",
      ref_no: refNo || `TMT-${Date.now()}`,
      project_name: projectName || "",
      folder: fid || null,
    }).catch((err) => {
      handleApiError(err, "create pending transmittal");
    }).finally(() => {
      // refresh after draft submit handoff
      loadRootData();
      if (folderId) loadFolderDetailData(folderId);
    });
  }, [folderId, handleApiError, dmsScope]);

  const normalizeFolderNode = useCallback(
    (node) => ({
      id: node.id,
      orgId:
        node.org_id != null ? String(node.org_id) : node.orgId ?? "",
      projectId:
        node.project_id != null ? String(node.project_id) : node.projectId ?? "",
      name: node.name,
      parentId: node.parent ?? null,
      sequenceNo:
        node.sequence_no != null && Number.isFinite(Number(node.sequence_no))
          ? Number(node.sequence_no)
          : node.sequenceNo != null && Number.isFinite(Number(node.sequenceNo))
            ? Number(node.sequenceNo)
            : 0,

      greenfieldSequenceNo:
        node.greenfield_sequence_no != null && Number.isFinite(Number(node.greenfield_sequence_no))
          ? Number(node.greenfield_sequence_no)
          : null,

      brownfieldSequenceNo:
        node.brownfield_sequence_no != null && Number.isFinite(Number(node.brownfield_sequence_no))
          ? Number(node.brownfield_sequence_no)
          : null,

      effectiveSequenceNo:
        node.effective_sequence_no != null && Number.isFinite(Number(node.effective_sequence_no))
          ? Number(node.effective_sequence_no)
          : node.sequence_no != null && Number.isFinite(Number(node.sequence_no))
            ? Number(node.sequence_no)
            : 0,

      folderKind: node.folder_kind != null ? String(node.folder_kind) : node.folderKind ?? "",
      projectCategory:
        node.project_category != null
          ? String(node.project_category)
          : node.projectCategory ?? "both",
      canUploadFiles: Boolean(node.can_upload_files),
      createdBy:
        node.created_by != null ? String(node.created_by) : node.createdBy != null ? String(node.createdBy) : "",
      size:
        node.size != null && Number.isFinite(Number(node.size))
          ? Number(node.size)
          : 0,
      documents: Array.isArray(node.documents) ? node.documents : [],
      files: Array.isArray(node.files) ? node.files : [],
      children: Array.isArray(node.children) ? node.children : [],
      createdAt: node.created_at || node.createdAt,
    }),
    []
  );

  const hydrateFolderMapFromTree = useCallback(
    (nodes, prev = {}) => {
      const next = { ...prev };
      const walk = (node) => {
        const n = normalizeFolderNode(node);
        next[String(n.id)] = n;
        (n.children || []).forEach(walk);
      };
      (nodes || []).forEach(walk);
      return next;
    },
    [normalizeFolderNode]
  );

  const loadRootData = useCallback(async () => {
    setLoading(true);
    try {
      if (!dmsScope.org_id) {
        setRootFolders([]);
        setFolderMap({});
        setUnfiled([]);
        setDrafts([]);
        setApiError("Organization not found for current user.");
        return;
      }

      if (!dmsScope.project_id) {
        setRootFolders([]);
        setFolderMap({});
        setUnfiled([]);
        setDrafts([]);
        setApiError("");
        return;
      }

      await ensureDefaultResourcesFolders(handleApiError, dmsScope);
      await ensureDefaultConstructionProgramsFolders(handleApiError, dmsScope);

      const [rootsRes, docsRes, draftsRes] = await Promise.all([
        getRootFolders(dmsScope),
        listDmsDocuments(dmsScope),
        listDmsDrafts(dmsScope),
      ]);
      const roots = Array.isArray(rootsRes.data) ? rootsRes.data : [];
      setRootFolders(roots.map(normalizeFolderNode));
      setFolderMap((prev) => hydrateFolderMapFromTree(roots, prev));

      const docs = Array.isArray(docsRes.data) ? docsRes.data : [];
      setUnfiled(
        docs
          .filter((d) => !d.folder)
          .map((d) => ({
            id: d.id,
            refNo: d.ref_no || "—",
            projectName: d.project_name || "",
            name: d.name || d.ref_no || "Document",
            createdAt: d.created_at,
          }))
      );
      setDrafts(Array.isArray(draftsRes.data) ? draftsRes.data : []);
    } catch (err) {
      handleApiError(err, "load DMS root data");
    } finally {
      setLoading(false);
    }
  }, [handleApiError, hydrateFolderMapFromTree, normalizeFolderNode, dmsScope]);

  const loadFolderDetailData = useCallback(
    async (fid) => {
      if (!fid) {
        setCurrentFolderDetail(null);
        return;
      }
      try {
        setApiError("");
        const res = await getFolderDetail(fid, dmsScope);
        const detail = normalizeFolderNode(res.data);
        setCurrentFolderDetail(detail);
        setFolderMap((prev) => hydrateFolderMapFromTree([res.data], prev));
      } catch (err) {
        handleApiError(err, "load folder detail");
      }
    },
    [handleApiError, hydrateFolderMapFromTree, normalizeFolderNode, dmsScope]
  );

  useEffect(() => {
    loadRootData();
  }, [loadRootData]);

  useEffect(() => {
    loadFolderDetailData(folderId);
  }, [folderId, loadFolderDetailData]);

  // Clear search/filter and sorting when navigating between folders
  useEffect(() => {
    setSearchQuery("");
    setSortConfig({ key: null, direction: 'asc' });
  }, [folderId]);

  const currentFolder = useMemo(
    () => (folderId ? folderMap[String(folderId)] || currentFolderDetail : null),
    [folderId, folderMap, currentFolderDetail]
  );

  const isRootView = !folderId;

  const canEditFolders = useMemo(() => hasAdminFolderEditAccess(), []);

  const validDrafts = useMemo(() => drafts || [], [drafts]);

  const refreshData = useCallback(async () => {
    await loadRootData();
    if (folderId) await loadFolderDetailData(folderId);
  }, [folderId, loadFolderDetailData, loadRootData]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    // Optimistically update both folderMap and currentFolderDetail
    let updatedFilesList = [];

    setFolderMap((prevMap) => {
      const newMap = { ...prevMap };
      const current = newMap[String(folderId)];
      if (!current || !current.files) return prevMap;

      const oldIndex = current.files.findIndex((f) => String(f.id) === String(active.id));
      const newIndex = current.files.findIndex((f) => String(f.id) === String(over.id));
      if (oldIndex < 0 || newIndex < 0) return prevMap;

      const newFiles = arrayMove(current.files, oldIndex, newIndex);
      updatedFilesList = newFiles.map((file, idx) => ({
        ...file,
        sequenceNo: idx + 1,
        sequence_no: idx + 1
      }));

      newMap[String(folderId)] = { ...current, files: updatedFilesList };
      return newMap;
    });

    setCurrentFolderDetail((prevDetail) => {
      if (!prevDetail || !prevDetail.files) return prevDetail;
      return { ...prevDetail, files: updatedFilesList.length ? updatedFilesList : prevDetail.files };
    });

    if (updatedFilesList.length > 0) {
      patchDmsFileReorder(folderId, updatedFilesList.map(f => ({ id: f.id, sequence_no: f.sequenceNo })))
        .then(() => toast.success("Files reordered successfully"))
        .catch((err) => {
          console.error(err);
          toast.error("Failed to reorder files");
          refreshData(); // Revert on failure
        });
    }
  };

  const openCreateFolderModal = useCallback(() => {
    if (!activeDmsProjectId) {
      toast.error("Please select project first.");
      return;
    }

    setEditingFolderId(null);
    setFolderName("");
    setFolderSequenceNo(0);
    setFolderGreenfieldSequenceNo(0);
    setFolderBrownfieldSequenceNo(0);
    setFolderKind("generic");
    setFolderProjectCategory(activeDmsProjectCategory || "greenfield");
    setFolderUploadEnabled(false);
    setShowModal(true);
  }, [activeDmsProjectId, activeDmsProjectCategory]);

  const openEditFolderModal = useCallback((folder) => {
    if (!folder) return;
    setEditingFolderId(folder.id);
    setFolderName(String(folder.name || ""));
    setFolderSequenceNo(
      Number.isFinite(Number(folder.sequenceNo)) ? Math.max(0, Number(folder.sequenceNo)) : 0
    );
    setFolderKind(String(folder.folderKind || "generic"));
    setFolderProjectCategory(
      normalizeFolderCategory(folder.projectCategory, "both")
    );

    setFolderGreenfieldSequenceNo(
      folder.greenfieldSequenceNo ?? folder.sequenceNo ?? 0
    );

    setFolderBrownfieldSequenceNo(
      folder.brownfieldSequenceNo ?? folder.sequenceNo ?? 0
    );

    setFolderUploadEnabled(Boolean(folder.canUploadFiles));
    setShowModal(true);
  }, []);


  const handleDeleteFolder = async (folder) => {
    if (!folder?.id) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${folder.name}" folder?`
    );

    if (!confirmed) return;

    try {
      setApiError("");

      await deleteFolder(folder.id);

      toast.success("Folder deleted successfully");

      await refreshData();
    } catch (err) {
      handleApiError(err, "delete folder", { toast: true });
    }
  };


  const handleDeleteFile = async (file) => {
    if (!file?.id) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${file.name}" file?`
    );

    if (!confirmed) return;

    try {
      setApiError("");

      await deleteDmsFile(file.id);

      toast.success("File deleted successfully");

      await refreshData();
    } catch (err) {
      handleApiError(err, "delete file", { toast: true });
    }
  };


  const handleDownloadFile = async (file) => {
    if (!file?.id) return;
    const toastId = toast.loading(`Downloading ${file.name}...`);
    try {
      const response = await downloadDmsFile(file.id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", file.name);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Download complete", { id: toastId });
    } catch (err) {
      toast.dismiss(toastId);
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          err.response.data = JSON.parse(text);
        } catch (e) {
          // Ignore parsing error, handleApiError will fall back
        }
      }
      handleApiError(err, "download file", { toast: true });
    }
  };

  const handleSubmitFolder = async () => {
    if (!folderName.trim()) return;
    try {
      setApiError("");
      if (!dmsScope.org_id || !dmsScope.project_id) {
        toast.error("Please select an active project before creating a DMS folder.");
        return;
      }

      const baseSequenceNo =
        folderProjectCategory === "brownfield"
          ? Number(folderBrownfieldSequenceNo || folderSequenceNo || 0)
          : Number(folderGreenfieldSequenceNo || folderSequenceNo || 0);


      const folderPayload = {
        name: folderName.trim(),
        sequence_no: baseSequenceNo,
        greenfield_sequence_no:
          folderProjectCategory === "greenfield" || folderProjectCategory === "both"
            ? Number(folderGreenfieldSequenceNo || 0)
            : null,
        brownfield_sequence_no:
          folderProjectCategory === "brownfield" || folderProjectCategory === "both"
            ? Number(folderBrownfieldSequenceNo || 0)
            : null,
        folder_kind: folderKind,
        can_upload_files: folderUploadEnabled,
        project_category: folderProjectCategory,
      };

      if (editingFolderId) {
        await updateFolder(editingFolderId, folderPayload);
        toast.success("Folder updated successfully");
      } else {
        await createFolder({
          ...folderPayload,
          org_id: dmsScope.org_id,

          // New architecture:
          // blank project_id means reusable organization-level folder.
          project_id: currentFolder?.projectId || "",

          parent: currentFolder ? currentFolder.id : null,
        });
      }
      setFolderName("");
      setFolderSequenceNo(0);
      setFolderUploadEnabled(false);
      setShowModal(false);
      await refreshData();
    } catch (err) {
      handleApiError(
        err,
        editingFolderId ? "update folder" : "create folder",
        { toast: true }
      );
    }
  };

  // const openFolder = (id) => {
  //   const targetFolder = folderMap[String(id)];
  //   if (targetFolder && String(targetFolder.name || "").toLowerCase() === "project plans" && targetFolder.parentId == null) {
  //     navigate(`/documents/create?folder=${id}&docType=Project+Plans`);
  //     return;
  //   }
  //   setSearchParams({ folder: String(id) });
  // };

  const openFolder = (folderOrId) => {
    const folder =
      typeof folderOrId === "object" && folderOrId !== null
        ? folderOrId
        : folderMap[String(folderOrId)];

    const targetId = folder?.id ?? folderOrId;

    if (!targetId) return;

    const transmittalDocType = getTransmittalDocTypeByFolder(folder);

    if (transmittalDocType) {
      navigate(
        createDocumentPath(
          null,
          targetId,
          transmittalDocType,
          getCurrentDocumentsPath()
        )
      );
      return;
    }

    setSearchParams({ folder: String(targetId) });
  };

  const goRoot = () => {
    setSearchParams({});
  };

  const childFolders = useMemo(
    () =>
      (currentFolder?.children || [])
        .map((c) => normalizeFolderNode(c))
        .sort(compareFoldersBySequenceAndName),
    [currentFolder, normalizeFolderNode]
  );

  const isInResourcesTree = (folder) => {
    if (!folder) return false;
    const map = new Map(Object.values(folderMap).map((f) => [String(f.id), f]));
    let cur = folder;
    while (cur) {
      if (String(cur.name).toLowerCase() === String(RESOURCES_ROOT_NAME).toLowerCase()) return true;
      cur = cur.parentId != null ? map.get(String(cur.parentId)) : null;
    }
    return false;
  };

  const { specialResourcesLeaf, resourceLeafKind } = useMemo(() => {
    if (!currentFolder) {
      return { specialResourcesLeaf: false, resourceLeafKind: null };
    }
    const normalized = String(currentFolder.name || "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();
    const compact = normalized.replace(/\s/g, "");
    let kind = null;
    if (normalized === "minimum manpower" || compact === "minimummanpower") {
      kind = "mm";
    } else if (
      normalized === "qc assets" ||
      normalized === "qc asset" ||
      compact === "qcassets"
    ) {
      kind = "qc";
    }
    if (kind == null) {
      return { specialResourcesLeaf: false, resourceLeafKind: null };
    }
    const map = new Map(Object.values(folderMap).map((f) => [String(f.id), f]));
    const parent =
      currentFolder.parentId != null ? map.get(String(currentFolder.parentId)) : null;
    const underResources =
      parent && String(parent.name || "").toLowerCase() === RESOURCES_ROOT_NAME.toLowerCase();
    return {
      specialResourcesLeaf: Boolean(underResources),
      resourceLeafKind: underResources ? kind : null,
    };
  }, [currentFolder, folderMap]);

  const isMinimumManpowerFolder = specialResourcesLeaf && resourceLeafKind === "mm";

  const isQcAssetsFolder = specialResourcesLeaf && resourceLeafKind === "qc";
  const isEscalationMatrixFolder = useMemo(() => {
    if (!currentFolder) return false;
    const byKind = String(currentFolder.folderKind || "").trim().toLowerCase();
    if (byKind === "escalation_matrix") return true;
    const normalized = String(currentFolder.name || "").toLowerCase().replace(/\s+/g, " ").trim();
    return normalized === "escalation matrix";
  }, [currentFolder]);

  const isCommunicationMatrixFolder = useMemo(() => {
    if (!currentFolder || isEscalationMatrixFolder) return false;
    const byKind = String(currentFolder.folderKind || "").trim().toLowerCase();
    const normalized = String(currentFolder.name || "").toLowerCase().replace(/\s+/g, " ").trim();
    if (byKind === "communication_matrix") return true;
    return normalized === "communication matrix" || normalized === "vendor onboarding process";
  }, [currentFolder, isEscalationMatrixFolder]);

  const isMomMinutesFolder = useMemo(() => {
    if (!currentFolder || !isLikelyMomFolderName(currentFolder.name)) return false;
    const map = new Map(Object.values(folderMap).map((f) => [String(f.id), f]));
    let cur = currentFolder;
    while (cur?.parentId != null) {
      cur = map.get(String(cur.parentId));
      if (!cur) break;
      const pn = normalizeDmsFolderTitle(cur.name);
      if (
        CONSTRUCTION_PROGRAMS_ROOT_ALIASES.some(
          (x) => normalizeDmsFolderTitle(x) === pn
        )
      ) {
        return true;
      }
    }
    return false;
  }, [currentFolder, folderMap]);

  const isRegistersBoxFilesFolder = useMemo(
    () => isRegistersBoxFilesFolderNode(currentFolder),
    [currentFolder]
  );

  // MIR FOLDER VERIFICATION

  const isMirFolder = useMemo(() => {
    if (!currentFolder) return false;

    const curName = normalizeDmsFolderTitle(currentFolder.name);

    // Child folder should be MIR
    const isMirChild =
      curName === "mir" ||
      curName === "material inspection request" ||
      curName === "material inspection request (mir)";

    if (!isMirChild) return false;

    const map = new Map(Object.values(folderMap).map((f) => [String(f.id), f]));
    const parent =
      currentFolder.parentId != null ? map.get(String(currentFolder.parentId)) : null;

    if (!parent) return false;

    const parentName = normalizeDmsFolderTitle(parent.name);

    // Support old + new parent folder names
    return (
      parentName.includes("material inspection request") ||
      parentName.includes("material inspection (mir)") ||
      parentName.includes("material inspection")
    );
  }, [currentFolder, folderMap]);


  const isMaterialInwardRegisterFolder = useMemo(() => {
    if (!currentFolder) return false;

    const curName = normalizeDmsFolderTitle(currentFolder.name);

    if (curName !== "material inward register") return false;

    const map = new Map(Object.values(folderMap).map((f) => [String(f.id), f]));
    const parent =
      currentFolder.parentId != null ? map.get(String(currentFolder.parentId)) : null;

    if (!parent) return false;

    const parentName = normalizeDmsFolderTitle(parent.name);

    return (
      parentName.includes("material inspection") ||
      parentName.includes("mir")
    );
  }, [currentFolder, folderMap]);

  const isInHouseTestReportRegisterFolder = useMemo(() => {
    if (!currentFolder) return false;

    const curName = normalizeDmsFolderTitle(currentFolder.name);
    const compactName = curName.replace(/[-_\s]/g, "");

    return (
      curName === "in-house test reports register" ||
      curName === "in-house test report register" ||
      curName === "in house test reports register" ||
      curName === "in house test report register" ||
      compactName === "inhousetestreportsregister" ||
      compactName === "inhousetestreportregister" ||
      (
        compactName.includes("inhouse") &&
        compactName.includes("test") &&
        compactName.includes("report") &&
        compactName.includes("register")
      )
    );
  }, [currentFolder]);


  const isThirdPartyTestReportRegisterFolder = useMemo(() => {
    if (!currentFolder) return false;

    const curName = normalizeDmsFolderTitle(currentFolder.name);
    const compactName = curName.replace(/[-_\s]/g, "");

    return (
      curName === "third party test reports register" ||
      curName === "third party test report register" ||
      compactName === "thirdpartytestreportsregister" ||
      compactName === "thirdpartytestreportregister" ||
      (
        compactName.includes("thirdparty") &&
        compactName.includes("test") &&
        compactName.includes("report") &&
        compactName.includes("register")
      )
    );
  }, [currentFolder]);


  const isEquipmentInspectionReportFolder = useMemo(() => {
    if (!currentFolder) return false;
    const curName = normalizeDmsFolderTitle(currentFolder.name);
    return curName === "plant and equipment inspection report";
  }, [currentFolder]);

  function isWirContainerName(name) {
    const n = normalizeDmsFolderTitle(name);
    const compact = n.replace(/[()\s&-]/g, "");

    return (
      n === "wir" ||
      n === "work inspection" ||
      n === "work inspection (wir)" ||
      n === "work inspection request" ||
      n === "work inspection request (wir)" ||
      compact === "workinspectionwir" ||
      compact === "workinspectionrequestwir" ||
      n.includes("work inspection")
    );
  }


  // WIR FOLDER VERIFICATION

  const isWirWorkInspectionRequestFolder = useMemo(() => {
    if (!currentFolder) return false;

    const curName = normalizeDmsFolderTitle(currentFolder.name);
    const compactCurName = curName.replace(/[()\s&-]/g, "");

    const isWirLeaf =
      curName === "wir" ||
      curName === "work inspection request" ||
      curName === "work inspection request (wir)" ||
      compactCurName === "workinspectionrequestwir";

    if (!isWirLeaf) return false;

    const map = new Map(Object.values(folderMap).map((f) => [String(f.id), f]));
    const parent =
      currentFolder.parentId != null ? map.get(String(currentFolder.parentId)) : null;

    if (!parent) return false;

    return isWirContainerName(parent.name);
  }, [currentFolder, folderMap]);



  const isWirAreaClearanceFormFolder = useMemo(() => {
    if (!currentFolder) return false;

    const curName = normalizeDmsFolderTitle(currentFolder.name);

    if (
      curName !== "area clearance form" &&
      curName !== "mep interface area clearance form"
    ) {
      return false;
    }

    const map = new Map(Object.values(folderMap).map((f) => [String(f.id), f]));
    const parent =
      currentFolder.parentId != null ? map.get(String(currentFolder.parentId)) : null;

    if (!parent) return false;

    return isWirContainerName(parent.name);
  }, [currentFolder, folderMap]);


  const isPeriodicVendorEvaluationFolder = useMemo(() => {
    if (!currentFolder) return false;
    const curName = normalizeDmsFolderTitle(currentFolder.name);
    return curName === "periodic vendor evaluation";
  }, [currentFolder]);



  // const isProjectPlanRegisterFolder = useMemo(() => {
  //   if (!currentFolder) return false;
  //   return includesAnyFolderName(currentFolder.name, ["Project Plans", "Project Plan"]);
  // }, [currentFolder]);

  // const isMaterialSubmissionRegisterFolder = useMemo(() => {
  //   if (!currentFolder) return false;
  //   return includesAnyFolderName(currentFolder.name, [
  //     // "Material Submission (MAS)",
  //     "Material Submission",
  //   ]);
  // }, [currentFolder]);

  // const isPqdRegisterFolder = useMemo(() => {
  //   if (!currentFolder) return false;
  //   return includesAnyFolderName(currentFolder.name, [
  //     "Prequalification Submission",
  //     "Prequalification Submission (PQD)",
  //     "Prequalification Document Submission (PQD)",
  //     "PQD",
  //   ]);
  // }, [currentFolder]);

  // const isWmsRegisterFolder = useMemo(() => {
  //   if (!currentFolder) return false;
  //   return includesAnyFolderName(currentFolder.name, [
  //     "Work Method Statement",
  //     "Work Method Statements",
  //     // "Work Method Statements (WMS,ITP Checklist & HIRA)",
  //   ]);
  // }, [currentFolder]);


  // const isDmpRegisterFolder = useMemo(() => {
  //   if (!currentFolder) return false;

  //   return includesAnyFolderName(currentFolder.name, [
  //     "Concrete Design Mix Submissions-Civil (DMP)",
  //     "Concrete Design Mix Submissions Civil (DMP)",
  //     "Concrete Design Mix Submissions",
  //     "Design Mix",
  //     "Design Mix Proposal",
  //     "Design Mix Proposal (DMP)",
  //     "DMP",
  //   ]);
  // }, [currentFolder]);


  const currentTransmittalDocType = useMemo(() => {
    return getTransmittalDocTypeByFolder(currentFolder);
  }, [currentFolder]);

  const isProjectPlanRegisterFolder = currentTransmittalDocType === "Project Plans";
  const isMaterialSubmissionRegisterFolder = currentTransmittalDocType === "Material Submittal";
  const isPqdRegisterFolder = currentTransmittalDocType === "Pre-Qualification";
  const isWmsRegisterFolder = currentTransmittalDocType === "Method Statement";
  const isDmpRegisterFolder = currentTransmittalDocType === "Design Mix";

  const isAllDocumentTrackerFolder = useMemo(() => {
    if (!currentFolder) return false;
    return includesAnyFolderName(currentFolder.name, [
      "All Document Tracker - Civil Works",
    ]);
  }, [currentFolder]);

  const isDocumentChangeProposalFolder = useMemo(() => {
    if (!currentFolder) return false;

    return includesAnyFolderName(currentFolder.name, [
      "Document Change Proposal (DCP)",
      "Document Change Proposal",
      "DCP",
    ]);
  }, [currentFolder]);

  const isRequestForInformationFolder = useMemo(() => {
    if (!currentFolder) return false;
    return includesAnyFolderName(currentFolder.name, [
      "Request for Information",
      "Request for Information (RFI)",
    ]);
  }, [currentFolder]);

  const isContactDirectoryFolder = useMemo(() => {
    if (!currentFolder) return false;
    return includesAnyFolderName(currentFolder.name, [
      "Contact Directory",
      "Contact Details of All Vendors, Agencies->Project Directory",
      "Contact Details of All Vendors, Agencies~Project Directory",
    ]);
  }, [currentFolder]);

  const isInternalNcrFolder = useMemo(() => {
    if (!currentFolder) return false;
    return includesAnyFolderName(currentFolder.name, [
      "Internal NCR",
      "Internal NCR Mechanism of Contractor (INC)",
      "Internal Mechanism of Contractor (INC)",
    ]);
  }, [currentFolder]);

  const isExternalNcrFolder = useMemo(() => {
    if (!currentFolder) return false;
    return includesAnyFolderName(currentFolder.name, [
      "External NCR",
      "External NCR Mechanism (NCR)",
    ]);
  }, [currentFolder]);

  const isExternalObservationMechanismFolder = useMemo(() => {
    if (!currentFolder) return false;
    return includesAnyFolderName(currentFolder.name, [
      "External Observation Mechanism",
      "External Observations Mechanism (SOR)",
    ]);
  }, [currentFolder]);

  const isDebitNoteFolder = useMemo(() => {
    if (!currentFolder) return false;

    const curName = normalizeDmsFolderTitle(currentFolder.name);

    // Only child folder "Debit Note" should render Debit Note Register.
    if (curName !== "debit note") return false;

    const map = new Map(Object.values(folderMap).map((f) => [String(f.id), f]));
    const parent =
      currentFolder.parentId != null ? map.get(String(currentFolder.parentId)) : null;

    if (!parent) return false;

    const parentName = normalizeDmsFolderTitle(parent.name);

    return (
      parentName.includes("debit note") &&
      parentName.includes("payment hold") &&
      parentName.includes("stop work")
    );
  }, [currentFolder, folderMap]);



  const isStopWorkNoticeFolder = useMemo(() => {
    if (!currentFolder) return false;

    const curName = normalizeDmsFolderTitle(currentFolder.name);

    if (
      curName !== "stop work notice" &&
      curName !== "stop work notification" &&
      curName !== "stop work"
    ) {
      return false;
    }

    const map = new Map(Object.values(folderMap).map((f) => [String(f.id), f]));
    const parent =
      currentFolder.parentId != null ? map.get(String(currentFolder.parentId)) : null;

    if (!parent) return false;

    const parentName = normalizeDmsFolderTitle(parent.name);

    return (
      parentName.includes("debit note") &&
      parentName.includes("payment hold") &&
      parentName.includes("stop work")
    );
  }, [currentFolder, folderMap]);


  const isSafetyCommitteeMeetingAgendaFolder = useMemo(() => {
    if (!currentFolder) return false;

    const curName = normalizeDmsFolderTitle(currentFolder.name);

    if (
      curName !== "safety committee meeting agenda" &&
      curName !== "safety committee agenda" &&
      curName !== "meeting agenda"
    ) {
      return false;
    }

    const map = new Map(Object.values(folderMap).map((f) => [String(f.id), f]));
    const parent =
      currentFolder.parentId != null ? map.get(String(currentFolder.parentId)) : null;

    if (!parent) return false;

    const parentName = normalizeDmsFolderTitle(parent.name);

    return parentName.includes("safety committee meeting");
  }, [currentFolder, folderMap]);


  const isMockDrillObservationReportFolder = useMemo(() => {
    if (!currentFolder) return false;

    const curName = normalizeDmsFolderTitle(currentFolder.name);

    if (
      curName !== "mock drill observation report" &&
      curName !== "mock drills observation report" &&
      curName !== "mock drill report"
    ) {
      return false;
    }

    const map = new Map(Object.values(folderMap).map((f) => [String(f.id), f]));
    const parent =
      currentFolder.parentId != null ? map.get(String(currentFolder.parentId)) : null;

    if (!parent) return false;

    const parentName = normalizeDmsFolderTitle(parent.name);

    return parentName.includes("mock drill");
  }, [currentFolder, folderMap]);

  const isAccidentReportFolder = useMemo(() => {
    if (!currentFolder) return false;

    return includesAnyFolderName(currentFolder.name, [
      "Accident Report",
      "Accident Reports",
    ]);
  }, [currentFolder]);

  const isAccidentRegisterFolder = useMemo(() => {
    if (!currentFolder) return false;

    return includesAnyFolderName(currentFolder.name, [
      "Accident Register",
      "Accident Registers",
      "Incident & Accident Register",
      "Incident and Accident Register",
    ]);
  }, [currentFolder]);

  const isInjuryReportFolder = useMemo(() => {
    if (!currentFolder) return false;

    return includesAnyFolderName(currentFolder.name, [
      "Record of Injuries, illness & LTI",
      "Record of Injuries illness LTI",
      "Record of Injuries, Illness and LTI",
      "Injury Report",
      "Injury Report Form",
    ]);
  }, [currentFolder]);

  const isInjuryRegisterFolder = useMemo(() => {
    if (!currentFolder) return false;

    return includesAnyFolderName(currentFolder.name, [
      "Injuries, illness & LTI - Register",
      "Injuries illness LTI Register",
      "Injuries, Illness and LTI Register",
      "Injury Register",
      "LTI Register",
    ]);
  }, [currentFolder]);

  const isToolboxTalksAttendanceSheetFolder = useMemo(() => {
    if (!currentFolder) return false;

    return includesAnyFolderName(currentFolder.name, [
      "Toolbox Talks Attendance Sheet",
      "Toolbox Talk Attendance Sheet",
      "Toolbox Talks Record & Attendance Sheet",
      "TBT Attendance Sheet",
    ]);
  }, [currentFolder]);

  const isTrainingAttendanceSheetFolder = useMemo(() => {
    if (!currentFolder) return false;

    return includesAnyFolderName(currentFolder.name, [
      "Training Attendance Sheet",
      "Training Attendance",
      "Training Record & Attendance Sheet",
    ]);
  }, [currentFolder]);


  const isTrainingQualityRegisterFolder = useMemo(() => {
    if (!currentFolder) return false;

    return includesAnyFolderName(currentFolder.name, [
      "Training Record Register - Quality",
      "training record register - quality",
    ]);
  }, [currentFolder]);

  const isTrainingHSERegisterFolder = useMemo(() => {
    if (!currentFolder) return false;

    return includesAnyFolderName(currentFolder.name, [
      "Training Record Register - HSE",
      "training record register - hse",
      // "Training Records - HSE",
      // "training records - hse"
    ]);
  }, [currentFolder]);

  const isInductionAttendanceFolder = useMemo(() => {
    if (!currentFolder) return false;

    return includesAnyFolderName(currentFolder.name, [
      "Attendance Form- Site Induction (HSE)",
      "attendance form- site induction (hse)"
    ]);
  }, [currentFolder]);

  const isToolboxRegisterFolder = useMemo(() => {
    if (!currentFolder) return false;

    return includesAnyFolderName(currentFolder.name, [
      "Toolbox Talks (HSE) Register",
      "Toolbox Talk (HSE) Register",
      "Toolbox Talks HSE Register",
      "Toolbox Talk HSE Register",
      "TBT Register",
    ]);
  }, [currentFolder]);


  const isSiteHSEInductionRegisterFolder = useMemo(() => {
    if (!currentFolder) return false;

    return includesAnyFolderName(currentFolder.name, [
      "Site HSE Induction Register",
      "site hse induction register",
    ]);
  }, [currentFolder]);

  const isMonthlyActivityPlan = useMemo(() => {
    if (!currentFolder) return false;

    return includesAnyFolderName(currentFolder.name, [
      "hse monthly activity plan tracker",
      "HSE Monthly Activity Plan Tracker",
    ]);
  }, [currentFolder]);


  const isComplianceTracker = useMemo(() => {
    if (!currentFolder) return false;

    return includesAnyFolderName(currentFolder.name, [
      "Degree of Compliance for HSE requirements",
      "degree of compliance for hse requirements",
    ])
  }, [currentFolder])


  const isHseChecklist = useMemo(() => {
    if (!currentFolder) return false;

    return includesAnyFolderName(currentFolder.name, [
      "Project HSE Score Checklist",
      "project hse score checklist",
    ]);
  }, [currentFolder]);


  const isHseRequirement = useMemo(() => {
    if (!currentFolder) return false;

    return includesAnyFolderName(currentFolder.name, [
      "HSE requirements",
      "hse requirements",
    ]);
  }, [currentFolder]);


  const isHseMonthlyReport = useMemo(() => {
    if (!currentFolder) return false;

    return includesAnyFolderName(currentFolder.name, [
      "Daily HSE Report",
      "daily hse report",
    ])
  })


  const isCalibrationRegister = useMemo(() => {
    if (!currentFolder) return false;

    return includesAnyFolderName(currentFolder.name, [
      "Calibration Register",
      "calibration register",
    ])
  })


  const isConstructionChemicalsStockShelfLifeFolder = useMemo(() => {
    if (!currentFolder) return false;

    const curName = normalizeDmsFolderTitle(currentFolder.name);

    if (
      curName !== "construction chemicals stock & shelf-life" &&
      curName !== "construction chemicals stock and shelf-life" &&
      curName !== "construction chemicals stock shelf-life" &&
      curName !== "chemicals & adhesive shelf-life details record"
    ) {
      return false;
    }

    const map = new Map(Object.values(folderMap).map((f) => [String(f.id), f]));
    const parent =
      currentFolder.parentId != null ? map.get(String(currentFolder.parentId)) : null;

    if (!parent) return false;

    const parentName = normalizeDmsFolderTitle(parent.name);

    return (
      parentName.includes("material test plan") ||
      parentName.includes("mtp") ||
      parentName.includes("mtr")
    );
  }, [currentFolder, folderMap]);


  const isDefectRepairingRequestFolder = useMemo(() => {
    if (!currentFolder) return false;
    const curName = normalizeDmsFolderTitle(currentFolder.name);
    return curName === "defect repairing request";
  }, [currentFolder]);


  const isSpecialCreatedFolder =
    isMinimumManpowerFolder ||
    isQcAssetsFolder ||
    isCommunicationMatrixFolder ||
    isEscalationMatrixFolder ||
    isMomMinutesFolder ||
    isRegistersBoxFilesFolder ||
    isMirFolder ||
    isMaterialInwardRegisterFolder ||
    isEquipmentInspectionReportFolder ||
    isWirWorkInspectionRequestFolder ||
    isWirAreaClearanceFormFolder ||
    isPeriodicVendorEvaluationFolder ||
    // isProjectPlanRegisterFolder ||
    // isMaterialSubmissionRegisterFolder ||
    // isPqdRegisterFolder ||
    // isWmsRegisterFolder ||
    // isDmpRegisterFolder ||
    isDocumentChangeProposalFolder ||
    isAllDocumentTrackerFolder ||
    isRequestForInformationFolder ||
    isContactDirectoryFolder ||
    isInternalNcrFolder ||
    isExternalNcrFolder ||
    isExternalObservationMechanismFolder ||
    isDebitNoteFolder ||
    isStopWorkNoticeFolder ||
    isSafetyCommitteeMeetingAgendaFolder ||
    isMockDrillObservationReportFolder ||
    isAccidentReportFolder ||
    isAccidentRegisterFolder ||
    isInjuryReportFolder ||
    isInjuryRegisterFolder ||
    isToolboxTalksAttendanceSheetFolder ||
    isTrainingAttendanceSheetFolder ||
    isToolboxRegisterFolder ||
    isTrainingQualityRegisterFolder ||
    isTrainingHSERegisterFolder ||
    isInductionAttendanceFolder ||
    isSiteHSEInductionRegisterFolder ||
    isMonthlyActivityPlan ||
    isComplianceTracker ||
    isHseChecklist ||
    isHseRequirement ||
    isHseMonthlyReport ||
    isCalibrationRegister ||
    isConstructionChemicalsStockShelfLifeFolder ||
    isInHouseTestReportRegisterFolder ||
    isThirdPartyTestReportRegisterFolder ||
    isDefectRepairingRequestFolder;


  useEffect(() => {
    if (
      !isMinimumManpowerFolder &&
      !isQcAssetsFolder &&
      !isCommunicationMatrixFolder &&
      !isEscalationMatrixFolder
    )
      return;
    let cancelled = false;
    (async () => {
      try {
        const projRes = await getProjectsForCurrentUser();
        const projectsRaw = Array.isArray(projRes.data) ? projRes.data : projRes.data?.results ?? [];
        const opts = projectsRaw
          .filter((p) => p?.id != null)
          .map((p) => ({ id: String(p.id), name: p.name || p.project_name || `Project ${p.id}` }));
        if (!cancelled) {
          setProjectOptions(opts);
          if (opts.length) {
            setManpowerProjectId((prev) => prev || opts[0].id);
            setQcProjectId((prev) => prev || opts[0].id);
            setCmProjectId((prev) => prev || opts[0].id);
          }
        }
      } catch (err) {
        if (!cancelled) handleApiError(err, "load projects for resource registers");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    isMinimumManpowerFolder,
    isQcAssetsFolder,
    isCommunicationMatrixFolder,
    isEscalationMatrixFolder,
    handleApiError,
  ]);

  useEffect(() => {
    if (!isMinimumManpowerFolder) return;
    const org = getSessionOrgId();
    if (!org || !manpowerProjectId || !manpowerScope) {
      setManpowerRows([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setManpowerLoading(true);
      try {
        const res = await getDmsMinimumManpowerRegister({
          org_id: org,
          project_id: manpowerProjectId,
          scope: manpowerScope,
        });
        if (!cancelled) {
          const raw = Array.isArray(res?.data?.minimum_manpower) ? res.data.minimum_manpower : [];
          setManpowerRows(raw.map(mapMinimumManpowerRowFromApi));
        }
      } catch (err) {
        if (!cancelled) {
          setManpowerRows([]);
          handleApiError(err, "load manpower template rows");
        }
      } finally {
        if (!cancelled) setManpowerLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isMinimumManpowerFolder, manpowerProjectId, manpowerScope, handleApiError]);

  useEffect(() => {
    if (!isQcAssetsFolder || !currentFolder?.id) {
      setQcRows([]);
      return;
    }
    const org = getSessionOrgId();
    if (!org) {
      setQcRows([]);
      return;
    }
    if (!qcProjectId || !qcScope) {
      setQcRows([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setQcLoading(true);
      try {
        const res = await getDmsQcAssetsRegister({
          org_id: org,
          project_id: qcProjectId,
          scope: qcScope,
        });
        if (!cancelled) {
          const raw = Array.isArray(res?.data?.qc_assets) ? res.data.qc_assets : [];
          setQcRows(raw.map(mapQcRowFromApi));
        }
      } catch (err) {
        if (!cancelled) {
          handleApiError(err, "load QC assets template rows");
          setQcRows([]);
        }
      } finally {
        if (!cancelled) setQcLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isQcAssetsFolder, currentFolder?.id, qcProjectId, qcScope, handleApiError]);

  useEffect(() => {
    if (!isCommunicationMatrixFolder) {
      setCmRows([]);
      return;
    }
    if (!cmProjectId) {
      setCmRows([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setCmLoading(true);
      try {
        const res = await getDmsCommunicationMatrix({ project_id: String(cmProjectId) });
        const rows = Array.isArray(res?.data?.rows) ? res.data.rows : [];
        if (!cancelled) setCmRows(rows);
      } catch (err) {
        if (!cancelled) {
          handleApiError(err, "load communication matrix");
          setCmRows([]);
        }
      } finally {
        if (!cancelled) setCmLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isCommunicationMatrixFolder, cmProjectId, handleApiError]);

  useEffect(() => {
    if (!isEscalationMatrixFolder) {
      setEscalationRows([]);
      setEscalationProjectName("");
      return;
    }
    if (!cmProjectId) {
      setEscalationRows([]);
      setEscalationProjectName("");
      return;
    }
    let cancelled = false;
    (async () => {
      setEscalationLoading(true);
      setEscalationRows([]);
      try {
        const res = await getDmsEscalationMatrix({ project_id: String(cmProjectId) });
        const rows = Array.isArray(res?.data?.rows) ? res.data.rows : [];
        const pname = res?.data?.project_name != null ? String(res.data.project_name) : "";
        if (!cancelled) {
          setEscalationRows(rows);
          setEscalationProjectName(pname);
        }
      } catch (err) {
        if (!cancelled) {
          handleApiError(err, "load escalation matrix");
          setEscalationRows([]);
          setEscalationProjectName("");
        }
      } finally {
        if (!cancelled) setEscalationLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isEscalationMatrixFolder, cmProjectId, handleApiError]);

  /** Hide duplicate root tiles with the same name (e.g. double “Resources” from race). */
  const dedupedRootFolders = useMemo(() => {
    const seen = new Set();
    return [...rootFolders]
      .sort(compareFoldersBySequenceAndName)
      .filter((f) => {
        const k = String(f.name || "").trim().toLowerCase();
        if (!k || seen.has(k)) return false;
        seen.add(k);
        return true;
      });
  }, [rootFolders]);

  const handleUploadToFolder = async (targetFolderId, fileList) => {
    const files = Array.from(fileList || []);

    if (!dmsScope.org_id || !dmsScope.project_id) {
      toast.error("Please select project first.");
      return;
    }

    if (!targetFolderId || files.length === 0) return;

    try {
      setApiError("");

      for (const file of files) {
        const form = new FormData();
        form.append("org_id", dmsScope.org_id);
        form.append("project_id", dmsScope.project_id);
        form.append("name", file.name);
        form.append("folder", targetFolderId);
        form.append("file", file);

        await uploadDmsFile(form);
      }

      await refreshData();

      toast.success(
        files.length === 1
          ? "File uploaded successfully"
          : `${files.length} files uploaded successfully`
      );
    } catch (err) {
      handleApiError(err, "upload file");
      toast.error("File upload failed");
    }
  };

  const uploadInputRef = useRef(null);


  // const getFileExtension = (nameOrUrl = "") => {
  //   const clean = String(nameOrUrl).split("?")[0].split("#")[0];
  //   const parts = clean.split(".");
  //   return parts.length > 1 ? parts.pop().toLowerCase() : "";
  // };

  // const isExcelFile = (fileMeta, fileUrl = "") => {
  //   const ext = getFileExtension(fileMeta?.name || fileMeta?.original_filename || fileUrl);

  //   return ["xls", "xlsx", "xlsm", "xlsb", "csv"].includes(ext);
  // };


  const handleOpenFile = async (_folderId, fileMeta) => {
    try {
      setApiError("");

      if (!fileMeta?.id) {
        toast.error("File id not found.");
        return;
      }

      const res = await getDmsFileOpenLink(fileMeta.id, dmsScope);
      const data = res?.data || {};

      if (data.open_type === "conversion_pending") {
        toast("Spreadsheet is being prepared. Please try again shortly.", {
          icon: "⏳",
        });
        return;
      }

      if (data.open_type === "conversion_failed") {
        const message =
          data.message ||
          "Spreadsheet conversion failed. Please contact admin.";

        toast.error(message);

        if (
          data.fallback_url &&
          window.confirm(
            "Google Sheet conversion failed. Do you want to open the original uploaded file instead?"
          )
        ) {
          window.open(data.fallback_url, "_blank", "noopener,noreferrer");
        }

        return;
      }

      const url = data.url;

      if (!url) {
        toast.error("File URL not found.");
        return;
      }

      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      handleApiError(err, "open file");
      toast.error("Unable to open file.");
    }
  };

  // const getPreferredFolderDocType = useCallback((folder) => {
  //   if (!folder) return "";
  //   if (isProjectPlanRegisterFolder) return "Project Plans";
  //   if (isMaterialSubmissionRegisterFolder) return "Material Submittal";
  //   if (isPqdRegisterFolder) return "Pre-Qualification";
  //   if (isWmsRegisterFolder) return "Method Statement";
  //   if (isDmpRegisterFolder) return "Design Mix";
  //   return "";
  // }, [
  //   isMaterialSubmissionRegisterFolder,
  //   isPqdRegisterFolder,
  //   isProjectPlanRegisterFolder,
  //   isWmsRegisterFolder,
  //   isDmpRegisterFolder,
  // ]);handlePrimaryCreateAction

  const getPreferredFolderDocType = useCallback((folder) => {
    return getTransmittalDocTypeByFolder(folder);
  }, []);

  // const createDocumentPath = (draftId, targetFolderId, docType) => {
  //   const base = "/documents/create";
  //   const params = new URLSearchParams();
  //   if (targetFolderId) params.set("folder", targetFolderId);
  //   if (draftId) params.set("id", draftId);
  //   if (docType) params.set("docType", docType);
  //   return params.toString() ? `${base}?${params}` : base;
  // };


  const createDocumentPath = (draftId, targetFolderId, docType, returnTo) => {
    const base = "/documents/create";
    const params = new URLSearchParams();

    if (targetFolderId) params.set("folder", targetFolderId);
    if (draftId) params.set("id", draftId);
    if (docType) params.set("docType", docType);
    if (returnTo) params.set("returnTo", returnTo);

    return params.toString() ? `${base}?${params.toString()}` : base;
  };


  const getCurrentDocumentsPath = () => {
    const params = searchParams.toString();
    return params ? `/documents?${params}` : "/documents";
  };


  // const handleCreateDocument = () => {
  //   navigate(
  //     createDocumentPath(
  //       null,
  //       folderId || undefined,
  //       getPreferredFolderDocType(currentFolder)
  //     )
  //   );
  // };


  const handleCreateDocument = () => {
    navigate(
      createDocumentPath(
        null,
        folderId || undefined,
        getPreferredFolderDocType(currentFolder),
        getCurrentDocumentsPath()
      )
    );
  };



  const handlePrimaryCreateAction = () => {
    if (specialResourcesLeaf && currentFolder) {
      const n = String(currentFolder.name).toLowerCase();
      if (n === "minimum manpower" || n === "qc assets" || n === "qc asset") return;
      return;
    }

    // const transmittalDocType = getTransmittalDocTypeByFolder(currentFolder);

    // if (transmittalDocType) {
    //   navigate(createDocumentPath(null, currentFolder.id, transmittalDocType));
    //   return;
    // }

    const transmittalDocType = getTransmittalDocTypeByFolder(currentFolder);

    if (transmittalDocType) {
      navigate(
        createDocumentPath(
          null,
          currentFolder.id,
          transmittalDocType,
          getCurrentDocumentsPath()
        )
      );
      return;
    }

    if (
      isCommunicationMatrixFolder ||
      isEscalationMatrixFolder ||
      isMomMinutesFolder ||
      isRegistersBoxFilesFolder ||
      isMirFolder ||
      isMaterialInwardRegisterFolder ||
      isEquipmentInspectionReportFolder ||
      isWirWorkInspectionRequestFolder ||
      isWirAreaClearanceFormFolder ||
      isPeriodicVendorEvaluationFolder ||
      isRequestForInformationFolder ||
      isContactDirectoryFolder ||
      isInternalNcrFolder ||
      isExternalNcrFolder ||
      isExternalObservationMechanismFolder ||
      isDebitNoteFolder ||
      isStopWorkNoticeFolder ||
      isSafetyCommitteeMeetingAgendaFolder ||
      isMockDrillObservationReportFolder ||
      isAccidentReportFolder ||
      isAccidentRegisterFolder ||
      isInjuryReportFolder ||
      isInjuryRegisterFolder ||
      isToolboxTalksAttendanceSheetFolder ||
      isTrainingAttendanceSheetFolder ||
      isToolboxRegisterFolder ||
      isTrainingQualityRegisterFolder ||
      isTrainingHSERegisterFolder ||
      isSiteHSEInductionRegisterFolder ||
      isConstructionChemicalsStockShelfLifeFolder ||
      isInHouseTestReportRegisterFolder ||
      isThirdPartyTestReportRegisterFolder ||
      isDefectRepairingRequestFolder
    )
      return;
    handleCreateDocument();
  };

  // const handleResumeDraft = (draft) => {
  //   navigate(createDocumentPath(draft.id, draft.folder || undefined));
  // };


  const handleResumeDraft = (draft) => {
    navigate(
      createDocumentPath(
        draft.id,
        draft.folder || undefined,
        "",
        getCurrentDocumentsPath()
      )
    );
  };


  const formatDraftTime = (ts) => {
    const d = new Date(ts);
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const breadcrumbChain = useMemo(() => {
    if (!currentFolder) return [];
    const map = new Map(Object.values(folderMap).map((f) => [String(f.id), f]));
    const chain = [];
    let cur = currentFolder;
    while (cur) {
      chain.unshift(cur);
      cur = cur.parentId != null ? map.get(String(cur.parentId)) : null;
    }
    return chain;
  }, [currentFolder, folderMap]);

  const goUp = () => {
    if (currentFolder?.parentId) {
      setSearchParams({ folder: String(currentFolder.parentId) });
    } else {
      setSearchParams({});
    }
  };

  const handleOpenSubfolder = async (folderName) => {
    if (!currentFolder) return;

    const existing = childFolders.find(
      (f) => normalizeDmsFolderTitle(f.name) === normalizeDmsFolderTitle(folderName)
    );
    if (existing) {
      openFolder(existing.id);
      return;
    }

    if (!dmsScope.org_id) return;

    try {
      const folderProjectCategory = String(currentFolder.projectCategory || activeDmsProjectCategory || "greenfield").toLowerCase();
      const maxSeq = childFolders.reduce((max, f) => {
        return Math.max(max, Number(f.sequenceNo || f.greenfieldSequenceNo || f.brownfieldSequenceNo || 0));
      }, 0);
      const nextSeq = childFolders.length > 0 ? maxSeq + 1 : 0;

      const payload = {
        name: folderName,
        sequence_no: nextSeq,
        greenfield_sequence_no:
          folderProjectCategory === "greenfield" || folderProjectCategory === "both"
            ? nextSeq
            : null,
        brownfield_sequence_no:
          folderProjectCategory === "brownfield" || folderProjectCategory === "both"
            ? nextSeq
            : null,
        org_id: dmsScope.org_id,
        project_id: currentFolder?.projectId || "",
        parent: currentFolder.id,
        folder_kind: "generic",
        can_upload_files: true,
        project_category: folderProjectCategory,
      };
      const res = await createFolder(payload);
      await refreshData();
      if (res?.data?.id) {
        openFolder(res.data.id);
      } else if (res?.id) {
        openFolder(res.id);
      }
    } catch (err) {
      handleApiError(err, `create ${folderName} folder`, { toast: true });
    }
  };

  const formatSize = (bytes) => {
    const numeric = Number(bytes);
    if (!Number.isFinite(numeric) || numeric <= 0) return "-";
    if (numeric < 1024) return `${numeric} B`;
    if (numeric < 1048576) return `${(numeric / 1024).toFixed(1)} KB`;
    return `${(numeric / 1048576).toFixed(1)} MB`;
  };

  const displayFolderName = (value) => {
    if (value == null) return "";
    return String(value);
  };

  const isCreateTransmittalDisabled =
    isRegistersBoxFilesFolder ||
    isMirFolder ||
    isMaterialInwardRegisterFolder ||
    isEquipmentInspectionReportFolder ||
    isWirWorkInspectionRequestFolder ||
    isWirAreaClearanceFormFolder ||
    isPeriodicVendorEvaluationFolder ||
    isDocumentChangeProposalFolder ||
    isAllDocumentTrackerFolder ||
    isRequestForInformationFolder ||
    isContactDirectoryFolder ||
    isInternalNcrFolder ||
    isExternalNcrFolder ||
    isExternalObservationMechanismFolder ||
    isToolboxRegisterFolder ||
    isTrainingQualityRegisterFolder ||
    isTrainingHSERegisterFolder ||
    isInductionAttendanceFolder ||
    isSiteHSEInductionRegisterFolder ||
    isMonthlyActivityPlan ||
    isComplianceTracker ||
    isHseChecklist ||
    isHseRequirement ||
    isHseMonthlyReport ||
    isCalibrationRegister ||
    isInHouseTestReportRegisterFolder ||
    isThirdPartyTestReportRegisterFolder ||
    isDefectRepairingRequestFolder;

  const showHeaderCreateTransmittalButton =
    !currentFolder || !isSpecialCreatedFolder;


  return (
    <div className="p-6">
      <div className="flex justify-between items-start mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">QHSE</h1>

          {isRootView && (
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <label className="text-sm font-medium text-gray-700">
                Project:
              </label>

              <select
                value={activeDmsProjectId || ""}
                onChange={(e) => {
                  const projectId = e.target.value;
                  const selected = dmsProjects.find((p) => String(p.id) === String(projectId));

                  setActiveDmsProjectId(projectId);
                  setActiveDmsProjectCategory(selected?.projectCategory || "greenfield");

                  if (projectId) {
                    localStorage.setItem("ACTIVE_PROJECT_ID", String(projectId));
                    localStorage.setItem(
                      "ACTIVE_PROJECT_CATEGORY",
                      String(selected?.projectCategory || "greenfield")
                    );
                  } else {
                    localStorage.removeItem("ACTIVE_PROJECT_ID");
                    localStorage.removeItem("ACTIVE_PROJECT_CATEGORY");
                  }

                  setSearchParams({});
                }}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm min-w-[260px] bg-white"
              >
                <option value="">Select Project</option>
                {dmsProjects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name} — {String(project.projectCategory || "greenfield")}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center gap-1 mt-2 text-sm text-gray-600 flex-wrap">
            <button type="button" onClick={goRoot} className="hover:text-primary">
              {capitalCase("documents")}
            </button>
            {breadcrumbChain.map((folder, idx) => {
              const isLast = idx === breadcrumbChain.length - 1;
              return (
                <span key={folder.id} className="flex items-center gap-1">
                  <ChevronRight className="w-4 h-4 shrink-0" />
                  {isLast ? (
                    <span className="font-medium text-gray-900">{displayFolderName(folder.name)}</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => openFolder(folder)}
                      className="hover:text-primary"
                    >
                      {displayFolderName(folder.name)}
                    </button>
                  )}
                </span>
              );
            })}
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={openCreateFolderModal}
            disabled={!activeDmsProjectId}
            className="flex items-center gap-2 border border-gray-300 bg-white px-4 py-2 rounded-lg hover:bg-gray-50 text-gray-800 disabled:opacity-50 disabled:pointer-events-none"
          >
            <Folder className="w-4 h-4" />
            <span>{capitalCase("new folder")}</span>
          </button>
          {(!breadcrumbChain.some((f) => ["format", "samples", "library"].includes(normalizeDmsFolderTitle(f.name).toLowerCase()))) && (currentFolder?.parentId || isSpecialCreatedFolder) && (
            <>
              <button
                type="button"
                onClick={() => handleOpenSubfolder("Format")}
                className="flex items-center gap-2 border border-gray-300 bg-white text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50"
              >
                <span>{capitalCase("format")}</span>
              </button>
              <button
                type="button"
                onClick={() => handleOpenSubfolder("Samples")}
                className="flex items-center gap-2 border border-gray-300 bg-white text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50"
              >
                <span>{capitalCase("samples")}</span>
              </button>
              <button
                type="button"
                onClick={() => handleOpenSubfolder("Library")}
                className="flex items-center gap-2 border border-gray-300 bg-white text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50"
              >
                <span>{capitalCase("library")}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {currentFolder ? (
        <div>
          <button type="button" onClick={goUp} className="text-sm text-primary mb-4">
            ← {capitalCase("back")}
          </button>

          {isSpecialCreatedFolder && !specialChildFormOpen && (
            <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
              <button
                type="button"
                onClick={handlePrimaryCreateAction}
                disabled={isCreateTransmittalDisabled}
                className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:pointer-events-none"
              >
                <Plus size={18} />
                <span>{capitalCase("create transmittal")}</span>
              </button>

              {/* <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
                <button
                  type="button"
                  onClick={() => {
                    setSpecialFolderTab("created");
                    setSpecialChildFormOpen(false);
                  }}
                  className={`px-4 py-2 text-sm rounded-md ${specialFolderTab === "created"
                    ? "bg-primary text-white"
                    : "text-gray-700 hover:bg-gray-50"
                    }`}
                >
                  Created
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSpecialFolderTab("documents");
                    setSpecialChildFormOpen(false);
                  }}
                  className={`px-4 py-2 text-sm rounded-md ${specialFolderTab === "documents"
                    ? "bg-primary text-white"
                    : "text-gray-700 hover:bg-gray-50"
                    }`}
                >
                  Documents
                </button>
              </div> */}
            </div>
          )}


          {(!isSpecialCreatedFolder || specialFolderTab === "created") && (
            <>
              {isMinimumManpowerFolder && (
                <MinimumManpowerRegisterTable
                  projectOptions={projectOptions}
                  projectId={manpowerProjectId}
                  scope={manpowerScope}
                  rows={manpowerRows}
                  loading={manpowerLoading}
                  saving={manpowerSaving}
                  onProjectChange={setManpowerProjectId}
                  onScopeChange={setManpowerScope}
                  onAddRow={() => setManpowerRows((prev) => [...prev, emptyMmrCustomRow()])}
                  onRemoveRow={(index) =>
                    setManpowerRows((prev) => prev.filter((_, i) => i !== index))
                  }
                  onCellChange={(index, field, value) => {
                    setManpowerRows((prev) =>
                      prev.map((r, i) => {
                        if (i !== index) return r;
                        if (field === "deployment") {
                          const v = String(value || "").toUpperCase().slice(0, 1);
                          return { ...r, deployment: ["B", "P", "S"].includes(v) ? v : "" };
                        }
                        if (field === "actual_deployment") {
                          return { ...r, actual_deployment: String(value ?? "").slice(0, 255) };
                        }
                        if (field === "position") {
                          return { ...r, position: String(value ?? "").slice(0, 500) };
                        }
                        if (field === "min_experience_years") {
                          return { ...r, min_experience_years: String(value ?? "").slice(0, 128) };
                        }
                        if (field === "required_number") {
                          return { ...r, required_number: String(value ?? "").slice(0, 128) };
                        }
                        return { ...r, [field]: value };
                      })
                    );
                  }}
                  onSave={async () => {
                    const org = getSessionOrgId();
                    if (!org || !manpowerProjectId || !manpowerScope) return;
                    setManpowerSaving(true);
                    try {
                      const res = await saveDmsMinimumManpowerRegister({
                        org_id: String(org),
                        project_id: String(manpowerProjectId),
                        scope: manpowerScope,
                        minimum_manpower: manpowerRows.map((r) => {
                          const isCustom = Boolean(r.is_custom) || r.template_id == null;
                          if (isCustom) {
                            return {
                              template_id: null,
                              is_custom: true,
                              entry_id: r.entry_id ?? null,
                              position: String(r.position ?? ""),
                              min_experience_years: String(r.min_experience_years ?? ""),
                              required_number: String(r.required_number ?? ""),
                              actual_deployment: String(r.actual_deployment ?? "").slice(0, 255),
                              deployment: normalizeDmsMmrDeployment(r.deployment),
                              remark: String(r.remark || ""),
                            };
                          }
                          return {
                            template_id: r.template_id,
                            is_custom: false,
                            actual_deployment: String(r.actual_deployment ?? "").slice(0, 255),
                            deployment: normalizeDmsMmrDeployment(r.deployment),
                            remark: String(r.remark || ""),
                          };
                        }),
                      });
                      const raw = Array.isArray(res?.data?.minimum_manpower) ? res.data.minimum_manpower : [];
                      setManpowerRows(raw.map(mapMinimumManpowerRowFromApi));
                      toast.success("Minimum manpower saved");
                    } catch (err) {
                      handleApiError(err, "save minimum manpower");
                      toast.error("Save failed");
                    } finally {
                      setManpowerSaving(false);
                    }
                  }}
                />
              )}

              {isQcAssetsFolder && (
                <QCAssetsRegisterTable
                  projectOptions={projectOptions}
                  projectId={qcProjectId}
                  scope={qcScope}
                  rows={qcRows}
                  loading={qcLoading}
                  saving={qcSaving}
                  onProjectChange={setQcProjectId}
                  onScopeChange={setQcScope}
                  onAddRow={() => setQcRows((prev) => [...prev, emptyQcCustomRow()])}
                  onRemoveRow={(index) => setQcRows((prev) => prev.filter((_, i) => i !== index))}
                  onCellChange={(index, field, value) => {
                    setQcRows((prev) =>
                      prev.map((r, i) => {
                        if (i !== index) return r;
                        if (field === "actual_count") {
                          return {
                            ...r,
                            actual_count: value === "" ? null : Math.max(0, Number(value)),
                          };
                        }
                        if (field === "description") {
                          return { ...r, description: String(value ?? "").slice(0, 255) };
                        }
                        if (field === "minimum_number") {
                          return { ...r, minimum_number: String(value ?? "").slice(0, 128) };
                        }
                        return { ...r, [field]: value };
                      })
                    );
                  }}
                  onSave={async () => {
                    const org = getSessionOrgId();
                    if (!org || !qcProjectId || !qcScope) return;
                    setQcSaving(true);
                    try {
                      const res = await saveDmsQcAssetsRegister({
                        org_id: String(org),
                        project_id: String(qcProjectId),
                        scope: qcScope,
                        qc_assets: qcRows.map((r) => {
                          const isCustom = Boolean(r.is_custom) || r.template_id == null;
                          const ac =
                            r.actual_count === "" || r.actual_count == null ? null : Number(r.actual_count);
                          if (isCustom) {
                            return {
                              template_id: null,
                              is_custom: true,
                              entry_id: r.entry_id ?? null,
                              description: String(r.description ?? ""),
                              minimum_number: String(r.minimum_number ?? ""),
                              actual_count: ac,
                              remark: String(r.remark || ""),
                            };
                          }
                          return {
                            template_id: r.template_id,
                            is_custom: false,
                            actual_count: ac,
                            remark: String(r.remark || ""),
                          };
                        }),
                      });
                      const raw = Array.isArray(res?.data?.qc_assets) ? res.data.qc_assets : [];
                      setQcRows(raw.map(mapQcRowFromApi));
                      toast.success("QC assets saved");
                    } catch (err) {
                      handleApiError(err, "save QC assets");
                      toast.error("Save failed");
                    } finally {
                      setQcSaving(false);
                    }
                  }}
                />
              )}

              {isCommunicationMatrixFolder && (
                <CommunicationMatrixRegisterTable
                  title={currentFolder?.name || "Vendor Onboarding Process"}
                  projectOptions={projectOptions}
                  projectId={cmProjectId}
                  rows={cmRows}
                  loading={cmLoading}
                  onProjectChange={setCmProjectId}
                  onInviteSuccess={async () => {
                    if (!cmProjectId) return;
                    setCmLoading(true);
                    try {
                      const res = await getDmsCommunicationMatrix({
                        project_id: String(cmProjectId),
                      });
                      setCmRows(Array.isArray(res?.data?.rows) ? res.data.rows : []);
                    } catch (err) {
                      handleApiError(err, "load communication matrix");
                      setCmRows([]);
                    } finally {
                      setCmLoading(false);
                    }
                  }}
                />
              )}

              {isEscalationMatrixFolder && (
                <EscalationMatrix
                  projectOptions={projectOptions}
                  projectId={cmProjectId}
                  projectName={escalationProjectName}
                  rows={escalationRows}
                  loading={escalationLoading}
                  onProjectChange={setCmProjectId}
                />
              )}

              {isMomMinutesFolder && <MomFolderView folderId={currentFolder.id} />}

              {isRegistersBoxFilesFolder && <BoxFileRegister folderId={currentFolder.id} />}

              {/* {isMirFolder && <MIRForm />} */}

              {isMirFolder && (
                <MIRRegister
                  onFormOpenChange={setSpecialChildFormOpen}
                />
              )}

              {isMaterialInwardRegisterFolder && (
                <MaterialInwardRegister
                  folderId={currentFolder.id}
                  folderName={currentFolder.name}
                  documents={currentFolder.documents || []}
                />
              )}

              {isEquipmentInspectionReportFolder && <EquipmentInspectionReport />}

              {/* {isWirWorkInspectionRequestFolder && <WorkInspectionRequest />} */}

              {isWirWorkInspectionRequestFolder && (
                <WIRRegister
                  onFormOpenChange={setSpecialChildFormOpen}
                />
              )}

              {isWirAreaClearanceFormFolder && <AreaClearanceForm />}

              {isPeriodicVendorEvaluationFolder && <PVE />}

              {/* {isProjectPlanRegisterFolder && (
                <PQPRegister
                  folderName={currentFolder.name}
                  documents={currentFolder.documents || []}
                />
              )}

              {isMaterialSubmissionRegisterFolder && (
                <MASRegister
                  folderName={currentFolder.name}
                  documents={currentFolder.documents || []}
                />
              )}

              {isPqdRegisterFolder && (
                <PQDRegister
                  folderName={currentFolder.name}
                  documents={currentFolder.documents || []}
                />
              )}

              {isWmsRegisterFolder && (
                <WMSRegister
                  folderName={currentFolder.name}
                  documents={currentFolder.documents || []}
                />
              )}

              {isDmpRegisterFolder && (
                <DMPRegister
                  folderName={currentFolder.name}
                  documents={currentFolder.documents || []}
                  onCreate={handleCreateDocument}
                />
              )} */}

              {isAllDocumentTrackerFolder && (
                <AllDocumentTracker
                  folderName={currentFolder.name}
                  documents={currentFolder.documents || []}
                />
              )}

              {isDocumentChangeProposalFolder && <DCPProposal />}

              {isRequestForInformationFolder && <RFI />}

              {isContactDirectoryFolder && <ContactDirectory />}

              {isInternalNcrFolder && <InternalNCR />}

              {isExternalNcrFolder && (
                <ExternalNCRRegister
                  onFormOpenChange={setSpecialChildFormOpen}
                />
              )}

              {isExternalObservationMechanismFolder && (
                <ExternalSORRegister
                  onFormOpenChange={setSpecialChildFormOpen}
                />
              )}

              {isDebitNoteFolder && (
                <DebitNoteRegister
                  onFormOpenChange={setSpecialChildFormOpen}
                />
              )}

              {isStopWorkNoticeFolder && (
                <StopWorkNoticeRegister
                  onFormOpenChange={setSpecialChildFormOpen}
                />
              )}

              {isSafetyCommitteeMeetingAgendaFolder && (
                <SafetyCommitteeMeetingAgendaRegister
                  projectOptions={dmsProjects}
                  onFormOpenChange={setSpecialChildFormOpen}
                />
              )}

              {isMockDrillObservationReportFolder && (
                <MockDrillObservationReportRegister
                  projectOptions={dmsProjects}
                  onFormOpenChange={setSpecialChildFormOpen}
                />
              )}

              {isAccidentReportFolder && (
                <AccidentReport
                  folderId={currentFolder.id}
                  folderName={currentFolder.name}
                />
              )}

              {isAccidentRegisterFolder && (
                <AccidentRegister
                  folderId={currentFolder.id}
                  folderName={currentFolder.name}
                  documents={currentFolder.documents || []}
                />
              )}

              {isInjuryReportFolder && (
                <InjuryReportForm
                  folderId={currentFolder.id}
                  folderName={currentFolder.name}
                />
              )}

              {isInjuryRegisterFolder && (
                <InjuryRegister
                  folderId={currentFolder.id}
                  folderName={currentFolder.name}
                  documents={currentFolder.documents || []}
                />
              )}

              {isToolboxTalksAttendanceSheetFolder && (
                <ToolboxTalksAttendanceSheet
                  folderId={currentFolder.id}
                  folderName={currentFolder.name}
                />
              )}

              {isTrainingAttendanceSheetFolder && (
                <TrainingAttendanceSheet
                  folderId={currentFolder.id}
                  folderName={currentFolder.name}
                />
              )}

              {isTrainingQualityRegisterFolder && (
                <TrainingQualityRegister />
              )}

              {isTrainingHSERegisterFolder && (
                <TrainingHSERegister />
              )}

              {isToolboxRegisterFolder && (
                <ToolboxRegister
                  folderId={currentFolder.id}
                  folderName={currentFolder.name}
                  documents={currentFolder.documents || []}
                />
              )}


              {isInductionAttendanceFolder && (
                <Induction
                  folderId={currentFolder.id}
                  folderName={currentFolder.name}
                  documents={currentFolder.documents || []}
                />
              )}

              {isSiteHSEInductionRegisterFolder && (
                <InductionRegister
                  folderId={currentFolder.id}
                  folderName={currentFolder.name}
                  documents={currentFolder.documents || []}
                />
              )}


              {isMonthlyActivityPlan && (
                <HseActivityTracker
                  folderId={currentFolder.id}
                  folderName={currentFolder.name}
                  documents={currentFolder.documents || []}
                />
              )}

              {isComplianceTracker && (
                <ComplianceTracker
                  folderId={currentFolder.id}
                  folderName={currentFolder.name}
                  documents={currentFolder.documents || []}
                />
              )}

              {isHseChecklist && (
                <HSEChecklist
                  folderId={currentFolder.id}
                  folderName={currentFolder.name}
                  documents={currentFolder.documents || []}
                />
              )}

              {isHseRequirement && (
                <HSERequirements
                  folderId={currentFolder.id}
                  folderName={currentFolder.name}
                  documents={currentFolder.documents || []}
                />
              )}

              {isHseMonthlyReport && (
                <HSEMonthlyReport
                  folderId={currentFolder.id}
                  folderName={currentFolder.name}
                  documents={currentFolder.documents || []}
                />
              )}

              {isCalibrationRegister && (
                <CalibrationRegister
                  folderId={currentFolder.id}
                  folderName={currentFolder.name}
                  documents={currentFolder.documents || []}
                />
              )}

              {isConstructionChemicalsStockShelfLifeFolder && (
                <ConstructionChemicalsStockShelfLifeRecord
                  projectOptions={dmsProjects}
                  storageKey={`construction-chemicals-stock-shelf-life-${currentFolder.id}`}
                />
              )}

              {isInHouseTestReportRegisterFolder && (
                <InHouseTestReportRegister
                  folderId={currentFolder.id}
                  folderName={currentFolder.name}
                  documents={currentFolder.documents || []}
                />
              )}


              {isThirdPartyTestReportRegisterFolder && (
                <ThirdPartyTestReportRegister
                  folderId={currentFolder.id}
                  folderName={currentFolder.name}
                  documents={currentFolder.documents || []}
                />
              )}

              {isDefectRepairingRequestFolder && <DRR />}
            </>
          )}

          {/* Subfolders + files/documents as list view */}
          {(() => {

            // if (
            //   isMinimumManpowerFolder ||
            //   isQcAssetsFolder ||
            //   isCommunicationMatrixFolder ||
            //   isEscalationMatrixFolder ||
            //   isMomMinutesFolder ||
            //   isRegistersBoxFilesFolder ||
            //   isMirFolder ||
            //   isEquipmentInspectionReportFolder ||
            //   isWirWorkInspectionRequestFolder ||
            //   isWirAreaClearanceFormFolder ||
            //   isPeriodicVendorEvaluationFolder ||
            //   isProjectPlanRegisterFolder ||
            //   isMaterialSubmissionRegisterFolder ||
            //   isPqdRegisterFolder ||
            //   isWmsRegisterFolder ||
            //   isDocumentChangeProposalFolder ||
            //   isAllDocumentTrackerFolder ||
            //   isRequestForInformationFolder ||
            //   isContactDirectoryFolder ||
            //   isInternalNcrFolder ||
            //   isExternalNcrFolder ||
            //   isExternalObservationMechanismFolder ||
            //   isDefectRepairingRequestFolder
            // ) {
            //   return null;
            // }

            if (isSpecialCreatedFolder && specialFolderTab === "created") {
              return null;
            }

            // const folders = childFolders;
            // const docs = currentFolder.documents || [];
            // const files = currentFolder.files || [];
            // const showUpload = Boolean(currentFolder?.canUploadFiles);

            const lowerQuery = searchQuery.toLowerCase();

            const hiddenFolderNames = ["format", "samples", "library"];
            const allFolders = (
              isSpecialCreatedFolder && specialFolderTab === "documents"
                ? []
                : childFolders
            ).filter((f) => !hiddenFolderNames.includes(normalizeDmsFolderTitle(f.name).toLowerCase()));

            const allDocs = currentFolder.documents || [];
            const allFiles = currentFolder.files || [];

            const folders = applySort(allFolders.filter(f => (f.name || "").toLowerCase().includes(lowerQuery)), 'folder');
            const docs = applySort(allDocs.filter(d => (d.refNo || "").toLowerCase().includes(lowerQuery) || (d.name || "").toLowerCase().includes(lowerQuery)), 'doc');
            const files = applySort(allFiles.filter(f => (f.name || "").toLowerCase().includes(lowerQuery)), 'file');

            const showUpload =
              Boolean(currentFolder?.canUploadFiles) ||
              (isSpecialCreatedFolder && specialFolderTab === "documents");

            const hasItems = folders.length > 0 || docs.length > 0 || files.length > 0;

            if (!hasItems && !showUpload && !isInResourcesTree(currentFolder)) {
              return (
                <p className="text-sm text-gray-500">
                  No items in this folder yet. {capitalCase("use create transmittal to add a document")}.
                </p>
              );
            }

            return (
              <div className="flex flex-col gap-4">
                <div className="relative w-full md:w-1/3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search folders, documents, and files..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                  />
                </div>
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  {(showUpload || files.length > 0) && (
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                      <div>
                        {showUpload && (
                          <>
                            <input
                              ref={uploadInputRef}
                              type="file"
                              multiple
                              accept={
                                isSpecialCreatedFolder && specialFolderTab === "documents"
                                  ? ".pdf,.xls,.xlsx,.csv,.docx"
                                  : undefined
                              }
                              className="hidden"
                              onChange={(e) => {
                                const inputFiles = e.target.files;
                                if (inputFiles && inputFiles.length > 0) {
                                  handleUploadToFolder(currentFolder.id, inputFiles);
                                }
                                if (uploadInputRef.current) uploadInputRef.current.value = "";
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => uploadInputRef.current && uploadInputRef.current.click()}
                              className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 border border-dashed border-gray-300 px-3 py-2 rounded-md hover:bg-gray-50"
                            >
                              <UploadIcon className="w-4 h-4" />
                              <span>{capitalCase("upload file")}</span>
                            </button>
                          </>
                        )}
                      </div>
                      {files.length > 0 && (
                        <div className="flex items-center gap-2">
                          {isSelectionMode && (
                            <button
                              type="button"
                              onClick={() => {
                                setIsSelectionMode(false);
                                setSelectedFiles(new Set());
                              }}
                              className="text-sm px-4 py-2 rounded-md transition-colors text-gray-600 bg-gray-100 hover:bg-gray-200"
                            >
                              Cancel
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={handleBulkDownload}
                            disabled={isSelectionMode && selectedFiles.size === 0}
                            className={`flex items-center gap-2 text-sm px-4 py-2 rounded-md transition-colors ${isSelectionMode && selectedFiles.size === 0
                              ? "text-gray-400 bg-gray-100 cursor-not-allowed"
                              : "text-white bg-primary hover:bg-primary/90"
                              }`}
                          >
                            <Download className="w-4 h-4" />
                            <span>
                              {!isSelectionMode
                                ? "Download"
                                : selectedFiles.size > 0
                                  ? `Download (${selectedFiles.size})`
                                  : "Download"}
                            </span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  <table className="w-full text-sm ">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50/80">
                        <th className="text-left pl-4 pr-2 py-3 font-medium text-gray-600 w-[7%]">
                          <div className="flex items-center gap-1.5">
                            {files.length > 0 && isSelectionMode && (
                              <input
                                type="checkbox"
                                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary mr-1"
                                checked={files.length > 0 && selectedFiles.size === files.length}
                                onChange={() => handleSelectAll(files.map(f => f.id))}
                              />
                            )}
                            {files.length > 0 && canEditFolders && <div className="w-[19px] shrink-0" />}
                            <div onClick={() => handleSort("sequenceNo")} className="cursor-pointer hover:bg-gray-100/50 flex items-center gap-1 whitespace-nowrap">
                              <ArrowUpDown className={`w-3 h-3 shrink-0 ${sortConfig.key === "sequenceNo" ? 'text-primary' : 'text-gray-400'}`} />
                              Sr. No.
                            </div>
                          </div>
                        </th>
                        <SortHeader label="Name" sortKey="name" className="pl-2 pr-4 w-[32%]" />
                        <SortHeader label="Created By" sortKey="createdBy" className="w-[18%]" />
                        <SortHeader label="Date" sortKey="date" className="w-[16%]" />
                        <SortHeader label="Size" sortKey="size" className="w-[14%]" />
                        <th className="text-left px-4 py-3 font-medium text-gray-600 w-[12%]">Action</th>
                      </tr>
                    </thead>
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                      <tbody>
                        {folders.map((folder, index) => (
                          <tr
                            key={`folder-${folder.id}`}
                            className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors odd:bg-white even:bg-slate-50"
                            onClick={() => openFolder(folder)}
                          >
                            <td className="pl-4 pr-2 py-3 text-gray-500">
                              <div className="flex items-center gap-1.5">
                                {files.length > 0 && isSelectionMode && <div className="w-[20px] shrink-0" />}
                                {files.length > 0 && canEditFolders && <div className="w-[19px] shrink-0" />}
                                <span className="leading-none pt-[1px] pl-4">{folder.effectiveSequenceNo ?? folder.sequenceNo ?? index + 1}</span>
                              </div>
                            </td>
                            <td className="pl-2 pr-4 py-3">
                              <div className="flex items-center gap-3">
                                <FolderOpen size={20} className="text-yellow-500 shrink-0" />
                                <span className="font-medium text-gray-800 truncate" title={displayFolderName(folder.name)}>
                                  {displayFolderName(folder.name)}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-gray-500">
                              <div className="flex items-center gap-1">
                                <div className="w-3 shrink-0" />
                                <span>{folder.createdBy || "-"}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-gray-500">
                              <div className="flex items-center gap-1">
                                <div className="w-3 shrink-0" />
                                <span>{formatDisplayDateTime(folder.created_at || folder.createdAt)}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-gray-500">
                              <div className="flex items-center gap-1">
                                <div className="w-3 shrink-0" />
                                <span>{formatSize(folder.size)}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-gray-500">
                              <div className="flex items-center gap-2">
                                {canEditFolders && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openEditFolderModal(folder);
                                      }}
                                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-orange-200 bg-orange-50 text-primary hover:bg-orange-100"
                                      title="Edit folder"
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </button>

                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteFolder(folder);
                                      }}
                                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                                      title="Delete folder"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                        {docs.map((doc) => (
                          <tr
                            key={`doc-${doc.id}`}
                            className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                          >
                            <td className="pl-4 pr-2 py-3 text-gray-500">
                              <div className="flex items-center gap-1.5">
                                {files.length > 0 && isSelectionMode && <div className="w-[20px] shrink-0" />}
                                {files.length > 0 && canEditFolders && <div className="w-[19px] shrink-0" />}
                                <span className="leading-none pt-[1px] pl-4">-</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <FileText size={20} className="text-primary shrink-0" />
                                <span className="text-gray-800 truncate" title={doc.refNo || doc.name}>
                                  {doc.refNo || doc.name || capitalCase("document")}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-gray-500">
                              <div className="flex items-center gap-1">
                                <div className="w-3 shrink-0" />
                                <span>{doc.created_by || "-"}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-gray-500">
                              <div className="flex items-center gap-1">
                                <div className="w-3 shrink-0" />
                                <span>{formatDisplayDateTime(doc.created_at || doc.createdAt)}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-gray-500">
                              <div className="flex items-center gap-1">
                                <div className="w-3 shrink-0" />
                                <span>{formatSize(doc.size || doc.file_size)}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-gray-500">-</td>
                            { }
                          </tr>
                        ))}
                        <SortableContext items={files.map(f => String(f.id))} strategy={verticalListSortingStrategy}>
                          {files.map((file, index) => (
                            <SortableFileRow
                              key={`file-${file.id}`}
                              file={file}
                              index={index}
                              canEditFolders={canEditFolders}
                              handleOpenFile={() => handleOpenFile(currentFolder.id, file)}
                              formatDisplayDateTime={formatDisplayDateTime}
                              formatSize={formatSize}
                              handleDeleteFile={handleDeleteFile}
                              handleDownloadFile={handleDownloadFile}
                              isSelected={selectedFiles.has(file.id)}
                              onSelectToggle={handleSelectToggle}
                              isSelectionMode={isSelectionMode}
                            />
                          ))}
                        </SortableContext>
                        {folders.length === 0 && docs.length === 0 && files.length === 0 && (
                          <tr>
                            <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                              No items in this folder.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </DndContext>
                  </table>
                </div>
              </div>
            );
          })()}
        </div>
      ) : (
        <>
          {validDrafts.length > 0 && (
            <div className="mb-8">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">
                In progress (resume within 24h)
              </h2>
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50/80">
                      <th className="text-left px-4 py-3 font-medium text-gray-600 w-[45%]">Name</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600 w-[20%]">Status</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600 w-[20%]">Date</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600 w-[15%]">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {validDrafts.map((draft) => (
                      <tr
                        key={draft.id}
                        className="border-b border-gray-100 hover:bg-orange-50/50 cursor-pointer transition-colors"
                        onClick={() => handleResumeDraft(draft)}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Clock size={20} className="text-orange-500 shrink-0" />
                            <span className="font-mono text-gray-800 truncate">
                              {draft.formData?.transmittalRefNo || capitalCase("draft")}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                            Draft
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500">{formatDraftTime(draft.created_at)}</td>
                        <td className="px-4 py-3 text-primary text-xs">Click to resume</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {unfiled.length > 0 && (
            <div className="mb-8">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">
                {capitalCase("unfiled transmittals")}
              </h2>
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50/80">
                      <th className="text-left px-4 py-3 font-medium text-gray-600 w-[35%]">Name</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600 w-[30%]">Project</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600 w-[20%]">Date</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600 w-[15%]">Size</th>
                    </tr>
                  </thead>
                  <tbody>
                    {unfiled.map((doc) => (
                      <tr key={doc.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <FileText size={20} className="text-gray-500 shrink-0" />
                            <span className="font-mono text-gray-800 truncate">{doc.refNo}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600 truncate">{safeCapitalCaseName(doc.projectName)}</td>
                        <td className="px-4 py-3 text-gray-500">{formatDisplayDateTime(doc.createdAt)}</td>
                        <td className="px-4 py-3 text-gray-500">-</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Root view when no folder selected */}
          {!currentFolder && (
            <div className="flex flex-col gap-4 mt-6">
              <div className="relative w-full md:w-1/3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search folders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                />
              </div>
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-gray-700">{capitalCase("folders")}</h2>
                </div>
                {(() => {
                  const lowerQuery = searchQuery.toLowerCase();
                  const filteredRoots = applySort(dedupedRootFolders.filter(f => (f.name || "").toLowerCase().includes(lowerQuery)), 'folder');
                  if (filteredRoots.length === 0) {
                    return (
                      <div className="px-4 py-8 text-center text-gray-500">
                        No folders match your search.
                      </div>
                    );
                  }
                  return (
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50/50 text-gray-500 font-medium">
                        <tr>
                          <SortHeader label="Sr. No." sortKey="sequenceNo" className="w-20" />
                          <SortHeader label="Name" sortKey="name" />
                          <SortHeader label="Created By" sortKey="createdBy" className="w-48" />
                          <SortHeader label="Date" sortKey="date" className="w-40" />
                          <SortHeader label="Size" sortKey="size" className="w-32" />
                          {canEditFolders && (
                            <th className="px-4 py-3 text-left w-24">Action</th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {filteredRoots.map((folder, index) => (
                          <tr
                            key={folder.id}
                            className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors odd:bg-white even:bg-slate-50"
                            onClick={() => openFolder(folder)}
                          >
                            <td className="pl-4 pr-2 py-3 text-gray-500">
                              <span className="pl-4 block">{folder.effectiveSequenceNo ?? folder.sequenceNo ?? index + 1}</span>
                            </td>
                            <td className="pl-2 pr-4 py-3">
                              <div className="flex items-center gap-3">
                                <FolderOpen size={20} className="text-yellow-500 shrink-0" />
                                <span className="font-medium text-gray-800 truncate" title={displayFolderName(folder.name)}>
                                  {displayFolderName(folder.name)}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-gray-500">
                              <div className="flex items-center gap-1">
                                <div className="w-3 shrink-0" />
                                <span>{folder.createdBy || "-"}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-gray-500">
                              <div className="flex items-center gap-1">
                                <div className="w-3 shrink-0" />
                                <span>{formatDisplayDateTime(folder.created_at || folder.createdAt)}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-gray-500">
                              <div className="flex items-center gap-1">
                                <div className="w-3 shrink-0" />
                                <span>{formatSize(folder.size)}</span>
                              </div>
                            </td>
                            {canEditFolders && (
                              <td className="px-4 py-3 text-gray-500">
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openEditFolderModal(folder);
                                    }}
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-orange-200 bg-orange-50 text-primary hover:bg-orange-100"
                                    title="Edit folder"
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteFolder(folder);
                                    }}
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                                    title="Delete folder"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  );
                })()}
              </div>
            </div>
          )}
        </>
      )}

      {loading && (
        <p className="mt-4 text-xs text-gray-500">{`${capitalCase("loading")}...`}</p>
      )}
      {apiError && <p className="mt-2 text-xs text-rose-600">{apiError}</p>}

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmitFolder();
            }}
            className="bg-white rounded-xl shadow-lg w-[350px] p-6 relative"
          >
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-black"
            >
              <X size={20} />
            </button>
            <h2 className="text-lg font-semibold mb-4">
              {capitalCase(editingFolderId ? "edit folder" : "create new folder")}
            </h2>
            <input
              type="text"
              placeholder={capitalCase("enter folder name")}
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              className="w-full border border-gray-200 px-3 py-2 rounded mb-4 focus:outline-none focus:ring-2 focus:ring-primary"
            />


            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Project Category
            </label>

            <select
              value={folderProjectCategory}
              onChange={(e) => setFolderProjectCategory(e.target.value)}
              className="w-full border border-gray-200 px-3 py-2 rounded mb-4 focus:outline-none focus:ring-2 focus:ring-primary bg-white text-sm"
            >
              <option value="both">Both</option>
              <option value="greenfield">Greenfield</option>
              <option value="brownfield">Brownfield</option>
            </select>


            {(folderProjectCategory === "greenfield" || folderProjectCategory === "both") && (
              <>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Greenfield Sequence No.
                </label>
                <input
                  type="number"
                  min="0"
                  value={folderGreenfieldSequenceNo}
                  onChange={(e) => {
                    const next = e.target.value;
                    setFolderGreenfieldSequenceNo(
                      next === "" ? 0 : Math.max(0, Number(next))
                    );
                  }}
                  className="w-full border border-gray-200 px-3 py-2 rounded mb-4 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </>
            )}

            {(folderProjectCategory === "brownfield" || folderProjectCategory === "both") && (
              <>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Brownfield Sequence No.
                </label>
                <input
                  type="number"
                  min="0"
                  value={folderBrownfieldSequenceNo}
                  onChange={(e) => {
                    const next = e.target.value;
                    setFolderBrownfieldSequenceNo(
                      next === "" ? 0 : Math.max(0, Number(next))
                    );
                  }}
                  className="w-full border border-gray-200 px-3 py-2 rounded mb-4 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </>
            )}

            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              {capitalCase("folder behavior")}
            </label>
            <select
              value={folderKind}
              onChange={(e) => setFolderKind(e.target.value)}
              className="w-full border border-gray-200 px-3 py-2 rounded mb-4 focus:outline-none focus:ring-2 focus:ring-primary bg-white text-sm"
            >
              <option value="generic">Generic</option>
              <option value="communication_matrix">Communication Matrix</option>
              <option value="escalation_matrix">Escalation Matrix</option>
              <option value="minimum_manpower">Minimum Manpower</option>
              <option value="qc_assets">QC Assets</option>
              <option value="box_file_register">Registers &amp; box files</option>
            </select>


            <label className="mb-4 flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={folderUploadEnabled}
                onChange={(e) => setFolderUploadEnabled(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span>{capitalCase("enable upload button for this folder")}</span>
            </label>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded bg-primary text-white hover:opacity-90"
              >
                {editingFolderId ? "Save" : "Create"}
              </button>
            </div>
          </form>
        </div>
      )
      }

      {/* <ExcelPreviewModal
        open={excelPreview.open}
        fileName={excelPreview.fileName}
        fileUrl={excelPreview.fileUrl}
        onClose={() =>
          setExcelPreview({
            open: false,
            fileName: "",
            fileUrl: "",
          })
        }
      /> */}
    </div >
  );
}

export default function Documents() {
  return (
    <Routes>
      <Route index element={<DocumentManager />} />
      <Route path="create" element={<CreateDocument />} />
    </Routes>
  );
}
