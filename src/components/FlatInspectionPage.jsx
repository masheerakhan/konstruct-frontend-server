import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
// import SiteBarHome from "./SiteBarHome";
import { useTheme } from "../ThemeContext";
import axios from "axios";
import toast from "react-hot-toast";
import {
  NEWchecklistInstance,
  checklistInstance,
  projectInstance,
} from "../api/axiosInstance";
import { showToast } from "../utils/toast";
import CRMHandoverForm from "./CRMHandoverForm";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("FlatInspectionPage Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="flex min-h-screen items-center justify-center"
          style={{ background: this.props.theme?.pageBg || "#fcfaf7" }}
        >
          <div className="text-center p-8 max-w-md">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
            <p className="text-gray-600 mb-4">
              An unexpected error occurred. Please refresh the page or contact
              support.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Helper function to get current user role
const getCurrentUserRole = () => {
  try {
    const userString = localStorage.getItem("USER_DATA");
    const accessString = localStorage.getItem("ACCESSES");

    if (!userString || userString === "undefined") return null;

    const userData = JSON.parse(userString);
    let accesses = [];

    if (accessString && accessString !== "undefined") {
      try {
        accesses = JSON.parse(accessString);
      } catch {
        accesses = [];
      }
    }

    let allRoles = [];
    if (Array.isArray(accesses)) {
      accesses.forEach((access) => {
        if (access.roles && Array.isArray(access.roles)) {
          access.roles.forEach((role) => {
            const roleStr = typeof role === "string" ? role : role?.role;
            if (roleStr && !allRoles.includes(roleStr)) {
              allRoles.push(roleStr);
            }
          });
        }
      });
    }

    // Check for workflow roles in priority order
    if (allRoles.includes("CHECKER")) return "CHECKER";
    if (allRoles.includes("Checker")) return "CHECKER";
    if (allRoles.includes("SUPERVISOR")) return "SUPERVISOR";
    if (allRoles.includes("Supervisor")) return "SUPERVISOR";
    if (allRoles.includes("MAKER")) return "MAKER";
    if (allRoles.includes("Maker")) return "MAKER";
    if (allRoles.includes("Intializer")) return "INITIALIZER";
    if (allRoles.includes("INITIALIZER")) return "INITIALIZER";

    // Admin fallback
    if (userData?.superadmin || userData?.is_staff) return "CHECKER";
    if (userData?.is_client) return "SUPERVISOR";
    if (userData?.is_manager) return "SUPERVISOR";
    if (allRoles.includes("ADMIN")) return "SUPERVISOR";

    return null;
  } catch (error) {
    console.error("Error getting user role:", error);
    return null;
  }
};

// Add after getCurrentUserRole function
const useDebounce = (callback, delay) => {
  const timeoutRef = React.useRef(null);

  return React.useCallback(
    (...args) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay],
  );
};

//const CHECKLIST_API_URL = '/sexy-getchchklist/';
const CHECKLIST_API_URL = "/transfer-getchchklist/";

//const VERIFY_ITEM_API = "/char-chavani-ghode-par/";
const VERIFY_ITEM_API = "/Decsion-makeing-forSuer-Inspector/";

//const MAKER_DONE_API  = "/sexy-maker/";
const MAKER_DONE_API = "/done-maker/";
//new

const INIT_CONTEXT_API_URL = "/init-context/";
const CREATE_LIVE_CHECKLIST_API_URL = "/create-live-checklist-from-template/";
//new

const ReportFilterModal = ({ onClose, onApply, themeConfig }) => {
  const [scope, setScope] = useState("all"); // all | failed | pending
  const [includePhotos, setIncludePhotos] = useState(true);
  const [groupByRoom, setGroupByRoom] = useState(true);
  const [includeMaker, setIncludeMaker] = useState(true);
  const [includeChecker, setIncludeChecker] = useState(true);
  const [includeSupervisor, setIncludeSupervisor] = useState(true);

  const handleSubmit = (e) => {
    e.preventDefault();
    onApply({
      scope,
      includePhotos,
      groupByRoom,
      includeMaker,
      includeChecker,
      includeSupervisor,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div
        className="w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
        style={{
          background: themeConfig.cardBg,
          border: `1px solid ${themeConfig.border}`,
        }}
      >
        {/* Header */}
        <div
          className="px-6 py-4 flex items-center justify-between border-b"
          style={{
            borderColor: themeConfig.border,
            background: themeConfig.headerBg,
          }}
        >
          <h3
            className="text-lg font-bold"
            style={{ color: themeConfig.textPrimary }}
          >
            Download Inspection Report
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
            style={{
              background: `${themeConfig.error}20`,
              color: themeConfig.error,
            }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4 text-sm">
          {/* Scope */}
          <div>
            <div
              className="font-medium mb-2"
              style={{ color: themeConfig.textPrimary }}
            >
              Scope of Report
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: "all", label: "All Items" },
                { key: "failed", label: "Only Failed" },
                { key: "pending", label: "Only Pending" },
              ].map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setScope(opt.key)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                    scope === opt.key ? "shadow-md" : ""
                  }`}
                  style={{
                    background:
                      scope === opt.key
                        ? `linear-gradient(135deg, ${themeConfig.accent}, ${themeConfig.accent}dd)`
                        : `${themeConfig.accent}10`,
                    color: scope === opt.key ? "white" : themeConfig.accent,
                    borderColor:
                      scope === opt.key
                        ? themeConfig.accent
                        : `${themeConfig.border}`,
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includePhotos}
                onChange={(e) => setIncludePhotos(e.target.checked)}
                className="mt-1 w-4 h-4"
              />
              <span>
                <div
                  className="font-medium"
                  style={{ color: themeConfig.textPrimary }}
                >
                  Include Photos
                </div>
                <div
                  className="text-xs"
                  style={{ color: themeConfig.textSecondary }}
                >
                  Attach images captured during inspection.
                </div>
              </span>
            </label>

            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={groupByRoom}
                onChange={(e) => setGroupByRoom(e.target.checked)}
                className="mt-1 w-4 h-4"
              />
              <span>
                <div
                  className="font-medium"
                  style={{ color: themeConfig.textPrimary }}
                >
                  Group by Room
                </div>
                <div
                  className="text-xs"
                  style={{ color: themeConfig.textSecondary }}
                >
                  Organise questions section-wise (Living, Bedroom, etc.).
                </div>
              </span>
            </label>
          </div>

          {/* Roles */}
          <div>
            <div
              className="font-medium mb-2"
              style={{ color: themeConfig.textPrimary }}
            >
              Include Remarks From
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeMaker}
                  onChange={(e) => setIncludeMaker(e.target.checked)}
                  className="w-4 h-4"
                />
                <span
                  className="text-xs"
                  style={{ color: themeConfig.textPrimary }}
                >
                  MAKER
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeChecker}
                  onChange={(e) => setIncludeChecker(e.target.checked)}
                  className="w-4 h-4"
                />
                <span
                  className="text-xs"
                  style={{ color: themeConfig.textPrimary }}
                >
                  CHECKER
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeSupervisor}
                  onChange={(e) => setIncludeSupervisor(e.target.checked)}
                  className="w-4 h-4"
                />
                <span
                  className="text-xs"
                  style={{ color: themeConfig.textPrimary }}
                >
                  SUPERVISOR
                </span>
              </label>
            </div>
          </div>

          {/* Footer */}
          <div
            className="pt-4 flex items-center justify-end gap-3 border-t"
            style={{ borderColor: themeConfig.border }}
          >
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium"
              style={{
                background: themeConfig.textSecondary,
                color: "white",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg text-sm font-medium shadow-md hover:shadow-lg transition-all"
              style={{
                background: `linear-gradient(135deg, ${themeConfig.accent}, ${themeConfig.accent}dd)`,
                color: "white",
                border: `2px solid ${themeConfig.accent}`,
              }}
            >
              Generate Report
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export const FLAT_REPORT_API = "/flat-report/";

const ACTIVE_ROLE_LS_KEY = "ACTIVE_ROLE"; // config page me bhi same key use karo
const ACTIVE_ROLE_EVENT = "active-role-changed"; // custom event name

const normalizeRole = (r) => {
  const x = String(r || "")
    .trim()
    .toUpperCase();
  // handle your backend typo too
  if (x === "INTIALIZER") return "INITIALIZER";
  return x;
};

// const readActiveRoleFromStorage = () => {
//   // 1) direct key
//   const direct = localStorage.getItem(ACTIVE_ROLE_LS_KEY);
//   if (direct) return normalizeRole(direct);

//   // 2) fallback from persist:root (redux-persist)
//   try {
//     const root = JSON.parse(localStorage.getItem("persist:root") || "{}");
//     const userObj = root.user ? JSON.parse(root.user) : null;
//     const roles = userObj?.user?.roles;
//     if (Array.isArray(roles) && roles.length) return normalizeRole(roles[0]);
//   } catch (e) {}

//   return null;
// };

// const getProjectRoleStorageKey = (pid) => `ACTIVE_ROLE_${pid}`;

// const readActiveRoleFromStorage = (pid = projectId) => {
//   const direct = localStorage.getItem(getProjectRoleStorageKey(pid));
//   if (direct) return normalizeRole(direct);

//   const flowRole = localStorage.getItem("FLOW_ROLE");
//   if (flowRole) return normalizeRole(flowRole);

//   try {
//     const root = JSON.parse(localStorage.getItem("persist:root") || "{}");
//     const userObj = root.user ? JSON.parse(root.user) : null;
//     const roles = userObj?.user?.roles;
//     if (Array.isArray(roles) && roles.length) return normalizeRole(roles[0]);
//   } catch (e) {}

//   return null;
// };

const getProjectRoleStorageKey = (pid) => `ACTIVE_ROLE_${pid}`;

const getSelectedProjectIdFromStorage = () => {
  try {
    const selectedProject = JSON.parse(
      localStorage.getItem("SELECTED_PROJECT") || "null",
    );
    return selectedProject?.id ?? null;
  } catch (e) {
    return null;
  }
};

const readActiveRoleFromStorage = (pid = null) => {
  const resolvedProjectId = pid ?? getSelectedProjectIdFromStorage();

  if (resolvedProjectId) {
    const direct = localStorage.getItem(
      getProjectRoleStorageKey(resolvedProjectId),
    );
    if (direct) return normalizeRole(direct);
  }

  const flowRole = localStorage.getItem("FLOW_ROLE");
  if (flowRole) return normalizeRole(flowRole);

  try {
    const root = JSON.parse(localStorage.getItem("persist:root") || "{}");
    const userObj = root.user ? JSON.parse(root.user) : null;
    const roles = userObj?.user?.roles;
    if (Array.isArray(roles) && roles.length) return normalizeRole(roles[0]);
  } catch (e) {}

  try {
    const selectedProject = JSON.parse(
      localStorage.getItem("SELECTED_PROJECT") || "null",
    );
    const roles = selectedProject?.roles;
    if (Array.isArray(roles) && roles.length) return normalizeRole(roles[0]);
  } catch (e) {}

  return null;
};

const FlatInspectionPage = () => {
  const { theme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { flatId } = useParams();
  // ✅ backend expects "intializer" (typo) as role_id

  // const { projectId, flatNumber, flatType } = location.state || {};
  // const { projectId, flatNumber, flatType, towerId, buildingId, levelId } =
  //   location.state || {};
  // const resolvedTowerId = towerId || buildingId;
  // const selectedPhaseId = resolvedTowerId
  //   ? localStorage.getItem(`SELECTED_PHASE_${projectId}_${resolvedTowerId}`)
  //   : null;

  const {
    projectId,
    flatNumber,
    flatType,
    towerId,
    buildingId,
    levelId,
    phaseId,
    purposeId,
  } = location.state || {};

  const resolvedTowerId = towerId || buildingId;

  const selectedPhaseId =
    phaseId ||
    (resolvedTowerId
      ? localStorage.getItem(`SELECTED_PHASE_${projectId}_${resolvedTowerId}`)
      : null);

  const selectedPurposeId =
    purposeId ||
    (resolvedTowerId
      ? localStorage.getItem(`SELECTED_PURPOSE_${projectId}_${resolvedTowerId}`)
      : null);
  // State management
  const [checklistData, setChecklistData] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showRoomsModal, setShowRoomsModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [expandedItems, setExpandedItems] = useState({});
  // const [userRole, setUserRole] = useState(null);
  // const [userRole, setUserRole] = useState(() => readActiveRoleFromStorage() || "CHECKER");
  const [userRole, setUserRole] = useState(
    () => readActiveRoleFromStorage(projectId) || "CHECKER",
  );

  const [paginationInfo, setPaginationInfo] = useState({
    count: 0,
    next: null,
    previous: null,
  });
  const [showOverviewFilter, setShowOverviewFilter] = useState(false);
  const [lastOverviewFilters, setLastOverviewFilters] = useState(null);

  // ---- Report filter helpers ----
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [category, setCategory] = useState("");

  const [stageOptions, setStageOptions] = useState([]);
  const [stagesLoading, setStagesLoading] = useState(false);
  const [stageInfo, setStageInfo] = useState(null);
  const [stageInfoLoading, setStageInfoLoading] = useState(false);
  const [stageInfoError, setStageInfoError] = useState(null);
  const [lastReportFilters, setLastReportFilters] = useState(null);
  const [projectCategories, setProjectCategories] = useState([]); // 👈 NEW

  const [flatInitReady, setFlatInitReady] = useState(false);
  const [flatInitLoading, setFlatInitLoading] = useState(false);
  const [flatInitError, setFlatInitError] = useState(null);

  const flowRole = localStorage.getItem("FLOW_ROLE"); // "CHECKER" / "MAKER" / "SUPERVISOR"

  // tiny helpers
  const isChecker = flowRole === "CHECKER";
  const isMaker = flowRole === "MAKER";
  const isSupervisor = flowRole === "SUPERVISOR";
  const isInitializerRole = flowRole === "INITIALIZER"; // if you have this

  // FLOW_ROLE already read above
  // const flowRole = localStorage.getItem("FLOW_ROLE");

  useEffect(() => {
    setUserRole(readActiveRoleFromStorage(projectId) || "CHECKER");
  }, [projectId]);

  // const resolveApiRoleId = (explicitRole) => {
  //   const base = String(
  //     explicitRole || userRole || localStorage.getItem("FLOW_ROLE") || "",
  //   ).toUpperCase();

  //   if (base === "MAKER") return "maker";
  //   if (base === "CHECKER") return "checker";
  //   if (base === "SUPERVISOR") return "supervisor";
  //   if (base === "INITIALIZER" || base === "INTIALIZER") return "intializer"; // backend typo

  //   return "checker";
  // };

  // New states for initialization
  const resolveApiRoleId = (explicitRole) => {
    const base = String(
      explicitRole || readActiveRoleFromStorage(projectId) || userRole || "",
    ).toUpperCase();

    if (base === "MAKER") return "maker";
    if (base === "CHECKER") return "checker";
    if (base === "SUPERVISOR") return "supervisor";
    if (base === "INITIALIZER" || base === "INTIALIZER") return "intializer";

    return "checker";
  };

  const [noteMessage, setNoteMessage] = useState(null);

  // New states for initialization
  const [initializingChecklists, setInitializingChecklists] = useState(
    new Set(),
  );
  const [selectedForBulk, setSelectedForBulk] = useState(new Set());
  const [bulkInitializing, setBulkInitializing] = useState(false);

  // Add these new states for MAKER modal
  const [showMakerModal, setShowMakerModal] = useState(false);
  const [selectedItemForMaker, setSelectedItemForMaker] = useState(null);
  const [makerRemark, setMakerRemark] = useState("");
  const [makerPhotos, setMakerPhotos] = useState([]);
  const [submittingMaker, setSubmittingMaker] = useState(false);
  const [showError, setShowError] = useState(false);
  const [makerAnswers, setMakerAnswers] = useState({});
  const [expandedChecklistId, setExpandedChecklistId] = useState(null);
  const [makerInputs, setMakerInputs] = useState({});

  // const [showMakerModal, setShowMakerModal] = useState(false);
  const [selectedChecklist, setSelectedChecklist] = useState(null);
  const [stageMeta, setStageMeta] = React.useState(null);

  // Add these new states for SUPERVISOR review modal
  const [showSupervisorReviewModal, setShowSupervisorReviewModal] =
    useState(false);
  const [selectedItemForSupervisorReview, setSelectedItemForSupervisorReview] =
    useState(null);
  const [supervisorRemarks, setSupervisorRemarks] = useState("");
  const [submittingSupervisorDecision, setSubmittingSupervisorDecision] =
    useState(false);
  const [showSupervisorError, setShowSupervisorError] = useState(false);

  // History modal states
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedItemForHistory, setSelectedItemForHistory] = useState(null);

  //report
  const [reportData, setReportData] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState(null);
  // 🔽 Report filter popup state
  const [showReportFilter, setShowReportFilter] = useState(false);

  const [reportFilter, setReportFilter] = useState({
    scope: "all", // "all" | "failed" | "pending"
    includePhotos: false,
    groupByRoom: true,
    includeMaker: true,
    includeChecker: true,
    includeSupervisor: true,
  });

  const readActiveRole = () => {
    const r =
      localStorage.getItem("ACTIVE_ROLE") ||
      localStorage.getItem("FLOW_ROLE") ||
      localStorage.getItem("ROLE") ||
      "";
    return String(r || "").toUpperCase();
  };

  const [activeRole, setActiveRole] = useState(readActiveRole());

  const [activeTab, setActiveTab] = useState("ready-to-start");
  const [tabData, setTabData] = useState({
    "ready-to-start": [],
    "actively-working": [],
    "finished-items": [],
  });

  const [tabLoading, setTabLoading] = useState({
    "ready-to-start": false,
    "actively-working": false,
    "finished-items": false,
  });
  // De-dupe + append files by name/size/lastModified
  const mergeFiles = (prev = [], next = []) => {
    const key = (f) => `${f.name}|${f.size}|${f.lastModified}`;
    const seen = new Set(prev.map(key));
    const toAdd = [];
    for (const f of next) {
      const k = key(f);
      if (!seen.has(k)) {
        seen.add(k);
        toAdd.push(f);
      }
    }
    return [...prev, ...toAdd];
  };
  const ROLE_ID_MAP = {
    INITIALIZER: "intializer",
    INTIALIZER: "intializer", // safeguard (typo role)
    MAKER: "maker",
    CHECKER: "checker",
    SUPERVISOR: "supervisor",
  };

  const isInitializerUser = (roleValue) => {
    const role = String(
      roleValue || userRole || readActiveRoleFromStorage() || "",
    )
      .trim()
      .toUpperCase();

    return role === "INITIALIZER" || role === "INTIALIZER";
  };

  const normalizeChecklistRows = (rows = []) => {
    if (!Array.isArray(rows)) return [];
    return rows.filter(Boolean).map((row) => ({
      ...row,
      items: Array.isArray(row?.items) ? row.items : [],
      submissions: Array.isArray(row?.submissions) ? row.submissions : [],
    }));
  };

  const normalizeChecklist = (checklist) => ({
  ...checklist,
  items:
    checklist.items ||
    checklist.questions ||
    checklist.checklist_items ||
    [],
});

  const groupChecklistsByRoom = (rows = []) => {
    const grouped = new Map();

    normalizeChecklistRows(rows).forEach((row) => {
      const roomKey = row?.room_id ?? `no_room_${row?.id ?? grouped.size}`;

      if (!grouped.has(roomKey)) {
        grouped.set(roomKey, {
          room_id: row?.room_id ?? null,
          room_name: row?.room_name || row?.name_of_room || null,
          checklists: [],
        });
      }

      // grouped.get(roomKey).checklists.push(row);
      grouped.get(roomKey).checklists.push(normalizeChecklist(row));
    });

    return Array.from(grouped.values());
  };

  // const groupWorkChecklistsByRoom = (rows = []) => {
  //   const grouped = new Map();

  //   normalizeChecklistRows(rows).forEach((row) => {
  //     const roomKey = row?.room_id ?? `no_room_${row?.id ?? grouped.size}`;

  //     if (!grouped.has(roomKey)) {
  //       grouped.set(roomKey, {
  //         room_id: row?.room_id ?? null,
  //         room_name: row?.room_name || row?.name_of_room || null,
  //         room_details: row?.room_details || null,
  //         available_for_me: [],
  //         assigned_to_me: [],
  //       });
  //     }

  //     // for transfer-getchchklist direct checklist rows
  //     grouped.get(roomKey).available_for_me.push(row);
  //   });

  //   return Array.from(grouped.values());
  // };

  const hasChecklistItems = (rows = []) =>
    normalizeChecklistRows(rows).some(
      (checklist) =>
        Array.isArray(checklist?.items) && checklist.items.length > 0,
    );

  const getApiResultsArray = (responseData) => {
    let rows = responseData?.results ?? responseData ?? [];
    if (!Array.isArray(rows)) rows = [rows];
    return normalizeChecklistRows(rows);
  };

  // const applyChecklistResponseToState = ({
  //   responseData,
  //   isInitializer = false,
  //   tabKey = null,
  //   limit = null,
  //   offset = null,
  // }) => {
  //   const rows = getApiResultsArray(responseData);
  //   // const normalizedForView = isInitializer ? groupChecklistsByRoom(rows) : rows;
  // const normalizedForView = isInitializer
  //   ? groupChecklistsByRoom(rows)
  //   : groupWorkChecklistsByRoom(rows);

  //   setChecklistData(normalizedForView);

  //   if (isInitializer && tabKey) {
  //     setTabData((prev) => ({
  //       ...prev,
  //       [tabKey]: normalizedForView,
  //     }));
  //   }

  //   setNoteMessage(responseData?.note || null);
  //   setPaginationInfo({
  //     count: responseData?.count || 0,
  //     next: responseData?.next || null,
  //     previous: responseData?.previous || null,
  //   });

  //   if (limit !== null || offset !== null) {
  //     const safeLimit = limit ?? pageState.limit ?? 10;
  //     const safeOffset = offset ?? 0;
  //     const page = Math.floor(safeOffset / Math.max(safeLimit, 1)) + 1;

  //     setPageState({
  //       next: responseData?.next || null,
  //       previous: responseData?.previous || null,
  //       count: responseData?.count || rows.length,
  //       limit: safeLimit,
  //       offset: safeOffset,
  //       page,
  //     });
  //   }

  //   const roomIds = [
  //     ...new Set(
  //       rows
  //         .map((item) => item?.room_id)
  //         .filter((value) => value !== null && value !== undefined),
  //     ),
  //   ];

  //   if (roomIds.length > 0) {
  //     fetchRoomDetails(roomIds);
  //   }

  //   return rows;
  // };

  const isGroupedRoomPayload = (rows = []) =>
    Array.isArray(rows) &&
    rows.some(
      (row) =>
        Array.isArray(row?.assigned_to_me) ||
        Array.isArray(row?.available_for_me) ||
        Array.isArray(row?.pending_for_me),
    );

  const applyChecklistResponseToState = ({
    responseData,
    isInitializer = false,
    tabKey = null,
    limit = null,
    offset = null,
  }) => {
    const rows = getApiResultsArray(responseData);

    let normalizedForView = [];

  // if (isInitializer) {
  //   normalizedForView = groupChecklistsByRoom(rows);
  // } else {
  //   // ✅ ALWAYS TRUST BACKEND STRUCTURE
  //   normalizedForView = rows.map((room) => ({
  //     ...room,
  //     assigned_to_me: (room.assigned_to_me || []).map(normalizeChecklist),
  //     available_for_me: (room.available_for_me || []).map(normalizeChecklist),
  //     pending_for_me: (room.pending_for_me || []).map(normalizeChecklist),
  //   }));
  // }
if (isInitializer) {
  normalizedForView = groupChecklistsByRoom(rows);
} else {
  // ✅ backend already grouped
  normalizedForView = rows.map((room) => ({
    ...room,
    assigned_to_me: (room.assigned_to_me || []).map(normalizeChecklist),
    available_for_me: (room.available_for_me || []).map(normalizeChecklist),
    pending_for_me: (room.pending_for_me || []).map(normalizeChecklist),
  }));
}
    setChecklistData(normalizedForView);

    if (isInitializer && tabKey) {
      setTabData((prev) => ({
        ...prev,
        [tabKey]: normalizedForView,
      }));
    }

    setNoteMessage(responseData?.note || null);
    setPaginationInfo({
      count: responseData?.count || 0,
      next: responseData?.next || null,
      previous: responseData?.previous || null,
    });

    if (limit !== null || offset !== null) {
      const safeLimit = limit ?? pageState.limit ?? 10;
      const safeOffset = offset ?? 0;
      const page = Math.floor(safeOffset / Math.max(safeLimit, 1)) + 1;

      setPageState({
        next: responseData?.next || null,
        previous: responseData?.previous || null,
        count: responseData?.count || rows.length,
        limit: safeLimit,
        offset: safeOffset,
        page,
      });
    }

    const roomIds = [
      ...new Set(
        normalizedForView
          .map((item) => item?.room_id)
          .filter((value) => value !== null && value !== undefined),
      ),
    ];

    if (roomIds.length > 0) {
      fetchRoomDetails(roomIds);
    }

    return rows;
  };

  const loadFlatChecklists = async ({
    status,
    offset = 0,
    limit = 50,
    tabKey = null,
    explicitRole = null,
  } = {}) => {
    const token = localStorage.getItem("ACCESS_TOKEN");
    const initializerMode = isInitializerUser(explicitRole || userRole);

    const params = getChecklistParams({
      ...(status ? { status } : {}),
      limit,
      offset,
      role_id: resolveApiRoleId(explicitRole),
    });

    console.log("📋 transfer-getchchklist params", params);

    const response = await checklistInstance.get(CHECKLIST_API_URL, {
      params,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const responseData = response?.data || {};
    // console.log("📋 transfer-getchchklist response", responseData);

    const rows = applyChecklistResponseToState({
      responseData,
      isInitializer: initializerMode,
      tabKey: initializerMode ? tabKey : null,
      limit,
      offset,
    });

    return {
      responseData,
      rows,
      hasExistingQuestions: hasChecklistItems(rows),
    };
  };

  // const ensureFlatChecklistForInitializer = async () => {
  //   const role = String(
  //     userRole || readActiveRoleFromStorage() || "",
  //   ).toUpperCase();

  //   if (!isInitializerUser(role)) {
  //     setFlatInitReady(true);
  //     return { skipped: true, reason: "not_initializer" };
  //   }

  //   if (!projectId || !flatId || !resolvedTowerId || !selectedPhaseId) {
  //     console.warn("Flat init skipped: missing required ids", {
  //       projectId,
  //       flatId,
  //       resolvedTowerId,
  //       selectedPhaseId,
  //       levelId,
  //     });
  //     setFlatInitReady(true);
  //     return { skipped: true, reason: "missing_ids" };
  //   }

  //   try {
  //     setFlatInitLoading(true);
  //     setFlatInitError(null);

  //     const existing = await loadFlatChecklists({
  //       status: statusByTab[activeTab] || "not_started",
  //       offset: 0,
  //       limit: 50,
  //       tabKey: activeTab || "ready-to-start",
  //       explicitRole: role,
  //     });

  //     if (existing?.hasExistingQuestions) {
  //       console.log(
  //         "✅ Existing live/legacy checklist found. Skipping template creation.",
  //       );
  //       setFlatInitReady(true);
  //       return {
  //         skipped: true,
  //         reason: "existing_live_checklists_present",
  //         existing: true,
  //       };
  //     }

  //     const token = localStorage.getItem("ACCESS_TOKEN");

  //     console.log("🟡 INIT_CONTEXT start", {
  //       projectId,
  //       flatId,
  //       resolvedTowerId,
  //       selectedPhaseId,
  //       levelId,
  //       role,
  //     });

  //     const initRes = await NEWchecklistInstance.get(INIT_CONTEXT_API_URL, {
  //       params: {
  //         project_id: Number(projectId),
  //         purpose_id:
  //           Number(
  //             localStorage.getItem(
  //               `SELECTED_PURPOSE_${projectId}_${resolvedTowerId}`,
  //             ),
  //           ) || undefined,
  //         phase_id: Number(selectedPhaseId),
  //         building_id: Number(resolvedTowerId),
  //         tower_id: Number(resolvedTowerId),
  //         level_id: levelId ? Number(levelId) : undefined,
  //         flat_id: Number(flatId),
  //       },
  //       headers: {
  //         Authorization: `Bearer ${token}`,
  //       },
  //     });

  //     const ctx = initRes?.data || {};
  //     console.log("🟡 INIT_CONTEXT response", ctx);

  //     if (
  //       ctx?.room_wise === true &&
  //       Array.isArray(ctx?.target_rooms) &&
  //       ctx.target_rooms.length === 0
  //     ) {
  //       console.warn(
  //         "⚠️ Template found but no matching actual rooms resolved. Keeping legacy/live rendering path.",
  //       );

  //       await loadFlatChecklists({
  //         status: statusByTab[activeTab] || "not_started",
  //         offset: 0,
  //         limit: 50,
  //         tabKey: activeTab || "ready-to-start",
  //         explicitRole: role,
  //       });

  //       setFlatInitReady(true);
  //       return {
  //         skipped: true,
  //         reason: "template_room_resolution_empty",
  //         ctx,
  //       };
  //     }

  //     const createRes = await NEWchecklistInstance.post(
  //       CREATE_LIVE_CHECKLIST_API_URL,
  //       {
  //         ...ctx,
  //         project_id: ctx.project_id || Number(projectId),
  //         purpose_id:
  //           ctx.purpose_id ||
  //           Number(
  //             localStorage.getItem(
  //               `SELECTED_PURPOSE_${projectId}_${resolvedTowerId}`,
  //             ),
  //           ) ||
  //           undefined,
  //         phase_id: ctx.phase_id || Number(selectedPhaseId),
  //         building_id: ctx.building_id || Number(resolvedTowerId),
  //         tower_id: ctx.tower_id || Number(resolvedTowerId),
  //         level_id: ctx.level_id || (levelId ? Number(levelId) : undefined),
  //         flat_id: ctx.flat_id || Number(flatId),
  //       },
  //       {
  //         headers: {
  //           Authorization: `Bearer ${token}`,
  //         },
  //       },
  //     );

  //     console.log("🟢 CREATE_LIVE_CHECKLIST response", createRes?.data);

  //     await loadFlatChecklists({
  //       status: statusByTab[activeTab] || "not_started",
  //       offset: 0,
  //       limit: 50,
  //       tabKey: activeTab || "ready-to-start",
  //       explicitRole: role,
  //     });

  //     setActiveTab("ready-to-start");
  //     setFlatInitReady(true);
  //     return {
  //       created: true,
  //       ctx,
  //       createData: createRes?.data || null,
  //     };
  //   } catch (err) {
  //     console.error(
  //       "🔴 ensureFlatChecklistForInitializer failed",
  //       err?.response?.data || err,
  //     );

  //     try {
  //       await loadFlatChecklists({
  //         status: statusByTab[activeTab] || "not_started",
  //         offset: 0,
  //         limit: 50,
  //         tabKey: activeTab || "ready-to-start",
  //         explicitRole: role,
  //       });
  //     } catch (fallbackErr) {
  //       console.error("🔴 fallback loadFlatChecklists also failed", fallbackErr);
  //     }

  //     setFlatInitError(err?.response?.data || err?.message || "Init failed");
  //     setFlatInitReady(true);
  //     return null;
  //   } finally {
  //     setFlatInitLoading(false);
  //   }
  // };

  const ensureFlatChecklistForInitializer = async (explicitRole = null) => {
    const role = String(
      explicitRole || userRole || readActiveRoleFromStorage(projectId) || "",
    ).toUpperCase();

    if (!isInitializerUser(role)) {
      setFlatInitReady(true);
      return { skipped: true, reason: "not_initializer" };
    }

    if (!projectId || !flatId || !resolvedTowerId || !selectedPhaseId) {
      console.warn("Flat init skipped: missing required ids", {
        projectId,
        flatId,
        resolvedTowerId,
        selectedPhaseId,
        levelId,
      });
      setFlatInitReady(true);
      return { skipped: true, reason: "missing_ids" };
    }

    try {
      setFlatInitLoading(true);
      setFlatInitError(null);

      const token = localStorage.getItem("ACCESS_TOKEN");

      console.log("🟡 INIT_CONTEXT start", {
        projectId,
        flatId,
        resolvedTowerId,
        selectedPhaseId,
        levelId,
        role,
      });

            // 🔥 ADD THIS BLOCK
      const existing = await loadFlatChecklists({
        status: statusByTab[activeTab] || "not_started",
        offset: 0,
        limit: 10,
        tabKey: activeTab,
        explicitRole: role,
      });

      // if (existing?.hasExistingQuestions) {
      //   console.log("🛑 Existing checklist found — skipping CREATE");

      //   setFlatInitReady(true);

      //   return {
      //     skipped: true,
      //     reason: "already_exists",
      //   };
      // }

      const initRes = await NEWchecklistInstance.get(INIT_CONTEXT_API_URL, {
        params: {
          project_id: Number(projectId),
          // purpose_id:
          //   Number(
          //     localStorage.getItem(
          //       `SELECTED_PURPOSE_${projectId}_${resolvedTowerId}`,
          //     ),
          //   ) || undefined,
          purpose_id: selectedPurposeId || undefined,
          phase_id: Number(selectedPhaseId),
          building_id: Number(resolvedTowerId),
          tower_id: Number(resolvedTowerId),
          level_id: levelId ? Number(levelId) : undefined,
          flat_id: Number(flatId),
          role_id: resolveApiRoleId(role),
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const ctx = initRes?.data || {};
      console.log("🟡 INIT_CONTEXT response", ctx);

      if (ctx.message === "Checklist already exists.") {
        console.log("🟢 Checklist already exists — no action needed");
      }

      // if (
      //   ctx?.room_wise === true &&
      //   Array.isArray(ctx?.target_rooms) &&
      //   ctx.target_rooms.length === 0
      // ) {
      //   console.warn(
      //     "⚠️ Template found but no matching actual rooms resolved. Keeping legacy/live rendering path.",
      //   );

      //   setFlatInitReady(true);
      //   return {
      //     skipped: true,
      //     reason: "template_room_resolution_empty",
      //     ctx,
      //   };
      // }

      if (
        ctx?.room_wise === true &&
        Array.isArray(ctx?.target_rooms) &&
        ctx.target_rooms.length === 0
      ) {
        console.warn(
          "⚠️ Template found but no matching actual rooms resolved. Falling back to load.",
        );

        await loadFlatChecklists({
          status: statusByTab[activeTab] || "not_started",
          offset: 0,
          limit: 10,
          tabKey: activeTab,
          explicitRole: role,
        });

        setFlatInitReady(true);

        return {
          skipped: true,
          reason: "template_room_resolution_empty",
          ctx,
        };
      }
      // const createRes = await NEWchecklistInstance.post(
      //   CREATE_LIVE_CHECKLIST_API_URL,
      //   {
      //     ...ctx,
      //     project_id: ctx.project_id || Number(projectId),
      //     purpose_id:
      //       ctx.purpose_id ||
      //       Number(
      //         localStorage.getItem(
      //           `SELECTED_PURPOSE_${projectId}_${resolvedTowerId}`,
      //         ),
      //       ) ||
      //       undefined,
      //     phase_id: ctx.phase_id || Number(selectedPhaseId),
      //     building_id: ctx.building_id || Number(resolvedTowerId),
      //     tower_id: ctx.tower_id || Number(resolvedTowerId),
      //     level_id: ctx.level_id || (levelId ? Number(levelId) : undefined),
      //     flat_id: ctx.flat_id || Number(flatId),
      //   },
      //   {
      //     headers: {
      //       Authorization: `Bearer ${token}`,
      //     },
      //   },
      // );
      let createRes = null;

      if (ctx.message === "Template found") {
        if (!ctx.stage_id) {
  throw new Error("❌ stage_id missing from init-context");
}
        createRes = await NEWchecklistInstance.post(
          CREATE_LIVE_CHECKLIST_API_URL,
          {
            project_id: ctx.project_id || Number(projectId),
            // purpose_id:
            //   ctx.purpose_id ||
            //   Number(
            //     localStorage.getItem(
            //       `SELECTED_PURPOSE_${projectId}_${resolvedTowerId}`,
            //     ),
            //   ) ||
            //   undefined,
            purpose_id: ctx.purpose_id || selectedPurposeId || undefined,
            phase_id: ctx.phase_id || Number(selectedPhaseId),
            stage_id: ctx.stage_id,
            building_id: ctx.building_id || Number(resolvedTowerId),
            tower_id: ctx.tower_id || Number(resolvedTowerId),
            level_id: ctx.level_id || (levelId ? Number(levelId) : undefined),
            flat_id: ctx.flat_id || Number(flatId),
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        console.log("🟢 CREATE_LIVE_CHECKLIST response", createRes?.data);
      }

      // setActiveTab("ready-to-start");
      setFlatInitReady(true);

      return {
        created: !!createRes,
        ctx,
        createData: createRes?.data || null,
      };
    } catch (err) {
      console.error(
        "🔴 ensureFlatChecklistForInitializer failed",
        err?.response?.data || err,
      );

      setFlatInitError(err?.response?.data || err?.message || "Init failed");
      setFlatInitReady(true);
      return null;
    } finally {
      setFlatInitLoading(false);
    }
  };

  const getAllChecklistsFromRoom = (roomData) => [
    ...(roomData?.checklists || []),
    ...(roomData?.assigned_to_me || []),
    ...(roomData?.available_for_me || []),
    ...(roomData?.pending_for_me || []),
  ];

const getVisibleChecklists = (roomData) => {
  const role = String(userRole || "").toUpperCase();

  // ✅ WORKFLOW ROLES
  if (role === "CHECKER" || role === "MAKER" || role === "SUPERVISOR") {
    if (activeWorkTab === "assigned-work") {
      return roomData?.assigned_to_me || [];
    }
    return roomData?.available_for_me || [];
  }

  // ✅ INITIALIZER
  const allChecklists = roomData?.checklists || [];

  if (activeTab === "ready-to-start") {
    return allChecklists.filter((c) => c.status === "not_started");
  }

  if (activeTab === "actively-working") {
    return allChecklists.filter((c) => c.status === "in_progress");
  }

  return allChecklists;
};

const fetchRoomsForFlat = async () => {
  console.log("🔥 calling rooms api", flatId);
  try {
    setRoomsLoading(true);
    const token = localStorage.getItem("ACCESS_TOKEN");
    const res = await projectInstance.get(`/units-by-id/?flat_id=${Number(flatId)}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const unit = res.data?.units?.[0];
    setRooms(unit?.rooms || []);
  } catch (err) {
    console.error("❌ Failed to fetch rooms:", err);
  } finally {
    setRoomsLoading(false);
  }
};
  // const getChecklistParams = (extraParams = {}) => ({
  //   project_id: Number(projectId),
  //   ...(selectedPhaseId ? { phase_id: Number(selectedPhaseId) } : {}),
  //   ...(resolvedTowerId
  //     ? {
  //         tower_id: Number(resolvedTowerId),
  //         building_id: Number(resolvedTowerId),
  //       }
  //     : {}),
  //   ...(levelId ? { level_id: Number(levelId) } : {}),
  //   ...(flatId ? { flat_id: Number(flatId) } : {}),
  //   ...extraParams,
  // });

  // always compute role_id from current active role
  const getChecklistParams = (extraParams = {}) => {
    console.log("🟨 getChecklistParams input", {
      projectId,
      flatId,
      resolvedTowerId,
      levelId,
      selectedPurposeId,
      selectedPhaseId,
      extraParams,
    });

    return {
      project_id: Number(projectId),
      ...(flatId ? { flat_id: Number(flatId) } : {}),
      ...(resolvedTowerId
        ? {
            tower_id: Number(resolvedTowerId),
            building_id: Number(resolvedTowerId),
          }
        : {}),
      ...(levelId ? { level_id: Number(levelId) } : {}),
      ...(selectedPurposeId ? { purpose_id: Number(selectedPurposeId) } : {}),
      ...(selectedPhaseId ? { phase_id: Number(selectedPhaseId) } : {}),
      ...extraParams,
    };
  };

  const roleId = ROLE_ID_MAP[String(userRole || "").toUpperCase()] || null;

  // Universal tab state for working roles (CHECKER, MAKER, SUPERVISOR)
  const [activeWorkTab, setActiveWorkTab] = useState("available-work");

  const [selectedItemsForBulk, setSelectedItemsForBulk] = useState(new Set());
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [bulkDecisionType, setBulkDecisionType] = useState(null); // 'pass' or 'fail'

  const [performanceMetrics, setPerformanceMetrics] = useState({
    apiCalls: 0,
    renderTime: 0,
    lastUpdate: null,
  });

  const startTime = React.useRef(Date.now());

  React.useEffect(() => {
    const endTime = Date.now();
    const renderTime = endTime - startTime.current;

    setPerformanceMetrics((prev) => ({
      ...prev,
      renderTime,
      lastUpdate: new Date().toISOString(),
    }));
  }, [checklistData, tabData]);

  // pick the most recent submission (latest_submission wins; else newest from array)
  const getLatestSubmission = (item) => {
    const subs = Array.isArray(item?.submissions) ? item.submissions : [];
    if (item?.latest_submission) return item.latest_submission;
    if (!subs.length) return null;
    return [...subs].sort(
      (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0),
    )[0];
  };

  const toChecklistMediaUrl = (url) => {
    if (!url) return null;
    let u = String(url).trim();

    // always use https
    if (u.startsWith("//")) u = "https:" + u;
    if (u.startsWith("http://")) u = "https://" + u.slice(7);

    // absolute → insert `/checklists/`
    u = u.replace(
      /^https:\/\/konstruct\.world\/media\//,
      "https://konstruct.world/checklists/media/",
    );

    // http (old) → https + `/checklists/`
    u = u.replace(
      /^http:\/\/konstruct\.world\/media\//,
      "https://konstruct.world/checklists/media/",
    );

    // relative forms
    if (u.startsWith("/checklists/media/"))
      return "https://konstruct.world" + u;
    if (u.startsWith("/media/"))
      return "https://konstruct.world/checklists" + u;
    if (u.startsWith("media/"))
      return "https://konstruct.world/checklists/" + u;

    // already full and correct
    return u;
  };

  const norm = (v) => (Array.isArray(v) ? v.filter(Boolean) : v ? [v] : []);

  const getRolePhotos = (submission, role) => {
    if (!submission) return [];
    const keysMap = {
      maker: [
        "maker_media_multi",
        "send_maker_media_multi",
        "maker_media",
        "media",
        "photo",
        "image",
      ],
      checker: [
        "checker_media_multi",
        "send_checker_media_multi",
        "inspector_photo",
        "checker_media",
        "media",
        "photo",
        "image",
      ],
      supervisor: [
        "supervisor_media_multi",
        "send_supervisor_media_multi",
        "reviewer_photo",
        "supervisor_media",
        "media",
        "photo",
        "image",
      ],
    };
    const keys = keysMap[role] || [];
    const raw = keys.flatMap((k) => {
      const v = submission?.[k];
      return Array.isArray(v) ? v : v ? [v] : [];
    });

    // normalize + dedupe
    const fixed = raw.map(toChecklistMediaUrl).filter(Boolean);
    return Array.from(new Set(fixed));
  };

  // prefer the newest submission that actually has photos for that role
  const getLatestSubmissionWithMedia = (item, role) => {
    const subs = Array.isArray(item?.submissions) ? item.submissions : [];
    if (!subs.length) return null;
    const sorted = [...subs].sort(
      (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0),
    );
    return sorted.find((s) => getRolePhotos(s, role).length) || sorted[0];
  };

  const [loadingStates, setLoadingStates] = useState(new Set()); // Track loading for individual items

  // Add after bulkDecisionType state
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmDialogData, setConfirmDialogData] = useState(null);

  // Enhanced Theme Configuration
  const ORANGE = "#ffbe63";
  const BG_OFFWHITE = "#fcfaf7";
  const bgColor = theme === "dark" ? "#191922" : BG_OFFWHITE;
  const cardColor = theme === "dark" ? "#23232c" : "#fff";
  const borderColor = ORANGE;
  const textColor = theme === "dark" ? "#fff" : "#222";
  const iconColor = ORANGE;

  const updateChecklistAfterInitialization = (checklistId, delay = 0) => {
    // Add whoosh animation first
    const checklistElement = document.querySelector(
      `[data-checklist-id="${checklistId}"]`,
    );
    if (checklistElement) {
      setTimeout(() => {
        checklistElement.classList.add("whoosh-out");
      }, delay);
    }

    // Update tab data after animation
    setTimeout(() => {
      if (userRole === "INITIALIZER") {
        // Remove from 'ready-to-start' tab
        setTabData((prev) => ({
          ...prev,
          "ready-to-start": prev["ready-to-start"].map((roomData) => ({
            ...roomData,
            checklists:
              roomData.checklists?.filter(
                (checklist) => checklist.id !== checklistId,
              ) || [],
          })),
        }));

        // Force refresh the actively-working tab to show the moved item
        // Force refresh both tabs to ensure consistency
        setTimeout(async () => {
          // Refresh current tab
          await fetchTabData(activeTab);
          // Refresh the target tab (actively-working)
          await fetchTabData("actively-working");
          // Auto-switch to actively-working tab
          setActiveTab("actively-working");
        }, 500);
      } else {
        // For other roles, use existing logic
        setChecklistData((prevData) =>
          prevData.map((roomData) => ({
            ...roomData,
            assigned_to_me:
              roomData.assigned_to_me?.map((checklist) =>
                checklist.id === checklistId
                  ? { ...checklist, status: "in_progress" }
                  : checklist,
              ) || [],
            available_for_me:
              roomData.available_for_me?.map((checklist) =>
                checklist.id === checklistId
                  ? { ...checklist, status: "in_progress" }
                  : checklist,
              ) || [],
          })),
        );
      }
    }, delay + 500);
  };

  const NoteBanner = ({ note, themeConfig }) => {
    const [parts, setParts] = React.useState(note ? [note] : []);

    React.useEffect(() => {
      if (!note || typeof note !== "string") {
        setParts([]);
        return;
      }

      // match many formats: "stage 73", "Stage:73", "stage-73", "stage#73"
      const regex = /stage[\s:#-]*?(\d+)/gi;
      const matches = [...note.matchAll(regex)];
      const ids = [
        ...new Set(matches.map((m) => Number(m[1])).filter(Boolean)),
      ];

      if (ids.length === 0) {
        setParts([note]);
        return;
      }

      let cancelled = false;
      const token = localStorage.getItem("ACCESS_TOKEN");

      Promise.all(
        ids.map((id) =>
          fetch(`https://konstruct.world/projects/stages/${id}/info/`, {
            headers: { Authorization: `Bearer ${token}` },
          })
            .then((res) => (res.ok ? res.json() : null))
            .then((json) => ({ id, name: json?.stage_name || `Stage ${id}` }))
            .catch(() => ({ id, name: `Stage ${id}` })),
        ),
      ).then((list) => {
        if (cancelled) return;

        const idToName = Object.fromEntries(
          list.map(({ id, name }) => [id, name]),
        );
        const out = [];
        let last = 0;

        for (const m of matches) {
          const start = m.index;
          const end = start + m[0].length;
          if (start > last) out.push(note.slice(last, start));

          // const stageId = Number(m[1]);
          const stageName = idToName[stageId] || `Stage ${stageId}`;

          out.push(
            <span
              key={`stage-${stageId}-${start}`}
              className="font-bold"
              style={{ color: themeConfig.accent }}
            >
              {stageName}
            </span>,
          );

          last = end;
        }
        if (last < note.length) out.push(note.slice(last));
        setParts(out);
      });

      return () => {
        cancelled = true;
      };
    }, [note, themeConfig]);

    if (!note) return null;

    return (
      <div
        className="rounded-xl p-4 border mb-4"
        style={{
          background: `${themeConfig.warning}10`,
          border: `1px solid ${themeConfig.warning}40`,
        }}
      >
        <div className="flex items-start gap-3">
          <span className="text-xl">🔔</span>
          <div className="text-sm" style={{ color: themeConfig.textPrimary }}>
            {parts}
          </div>
        </div>
      </div>
    );
  };

  const updateMultipleChecklists = (checklistIds) => {
    checklistIds.forEach((checklistId, index) => {
      updateChecklistAfterInitialization(checklistId, index * 100); // Stagger animations
    });
  };

  // maps initializer tabs to API status
  const statusByTab = {
    "ready-to-start": "not_started",
    "actively-working": "in_progress",
  };

  const themeConfig = {
    pageBg: bgColor,
    cardBg: cardColor,
    textPrimary: textColor,
    textSecondary: theme === "dark" ? "#a0a0a0" : "#666",
    accent: ORANGE,
    border: borderColor,
    icon: iconColor,
    headerBg: theme === "dark" ? "#2a2a35" : "#f8f6f3",
    success: "#10b981",
    warning: "#f59e0b",
    error: "#ef4444",
    passColor: "#10b981", // Green for PASS options
    failColor: "#ef4444",
    info: "#3b82f6", // Red for FAIL options
  };
  // Tab configuration for INITIALIZER
  // Tab configuration for INITIALIZER
  const initializerTabs = [
    {
      key: "ready-to-start",
      label: "Assignment Queue",
      icon: "🚀",
      color: themeConfig.accent,
      description: "Checklists ready to initialize",
      apiStatus: "not_started",
    },
    {
      key: "actively-working",
      label: "Active Workflows",
      icon: "⚡",
      color: themeConfig.warning,
      description: "Checklists in workflow process",
      apiStatus: "in_progress",
    },
  ];
  // Tab configuration for MAKER
  // Remove this entire section - no longer needed

  // Fetch data for specific tab
  // const fetchTabData = async (tabKey) => {
  // const tabConfig = initializerTabs.find(tab => tab.key === tabKey);
  // if (!tabConfig) return;

  // setTabLoading(prev => ({ ...prev, [tabKey]: true }));

  // try {
  //     const token = localStorage.getItem("ACCESS_TOKEN");
  //     // const params = {
  //     //     project_id: projectId,
  //     //     flat_id: flatId,
  //     //     status: tabConfig.apiStatus,   // 'not_started' / 'in_progress'
  //     //     // role: 'initializer',         // (agar backend me optional role param hai to yahan add kar sakte ho)
  //     // };
  //     const params = getChecklistParams({
  //       status: tabConfig.apiStatus,
  //       role_id: resolveApiRoleId(),
  //     });

  //     setPerformanceMetrics(prev => ({ ...prev, apiCalls: prev.apiCalls + 1 }));
  //     const response = await checklistInstance.get(CHECKLIST_API_URL, {
  //         params,
  //         headers: {
  //             Authorization: `Bearer ${token}`,
  //             "Content-Type": "application/json",
  //         },
  //     });

  //         if (response.status === 200) {
  //             const responseData = response.data || {};
  //             let data = responseData.results || responseData || [];

  //             if (!Array.isArray(data)) {
  //                 data = [data];
  //             }

  //             setTabData(prev => ({
  //                 ...prev,
  //                 [tabKey]: data
  //             }));
  //             setNoteMessage(responseData?.note || null);

  //             console.log(`✅ TAB DATA LOADED - Tab: ${tabKey}, Count: ${data.length}`);

  //             // Extract and fetch room details for INITIALIZE
  //             const roomIds = [...new Set(data.map(room => room.room_id).filter(Boolean))];
  //             console.log(`🔍 INITIALIZER Tab ${tabKey} Room IDs:`, roomIds);

  //             if (roomIds.length > 0) {
  //                 const token = localStorage.getItem("ACCESS_TOKEN");
  //                 fetchRoomDetails(roomIds);
  //             }
  //         }
  //     } catch (err) {
  //         console.error(`❌ Failed to fetch tab data for ${tabKey}:`, err);
  //         toast.error(`Failed to load ${tabConfig.label}`, {
  //             style: { background: themeConfig.error, color: 'white', borderRadius: '12px' }
  //         });
  //     } finally {
  //         setTabLoading(prev => ({ ...prev, [tabKey]: false }));
  //     }
  // };

  // const fetchTabData = async (tabKey) => {
  //   const tabConfig = initializerTabs.find((tab) => tab.key === tabKey);
  //   if (!tabConfig) return;

  //   setTabLoading((prev) => ({ ...prev, [tabKey]: true }));

  //   try {
  //     const role = String(
  //       userRole || readActiveRoleFromStorage() || "",
  //     ).toUpperCase();

  //     setPerformanceMetrics((prev) => ({
  //       ...prev,
  //       apiCalls: prev.apiCalls + 1,
  //     }));

  //     if (isInitializerUser(role)) {
  //       const firstLoad = await loadFlatChecklists({
  //         status: tabConfig.apiStatus,
  //         offset: 0,
  //         limit: 10,
  //         tabKey,
  //         explicitRole: role,
  //       });

  //       if (
  //         tabKey === "ready-to-start" &&
  //         !firstLoad?.hasExistingQuestions &&
  //         !flatInitLoading
  //       ) {
  //         await ensureFlatChecklistForInitializer();

  //         await loadFlatChecklists({
  //           status: tabConfig.apiStatus,
  //           offset: 0,
  //           limit: 10,
  //           tabKey,
  //           explicitRole: role,
  //         });
  //       }

  //       return;
  //     }

  //     await loadFlatChecklists({
  //       status: tabConfig.apiStatus,
  //       offset: 0,
  //       limit: 10,
  //       tabKey: null,
  //       explicitRole: role,
  //     });
  //   } catch (err) {
  //     console.error(`❌ Failed to fetch tab data for ${tabKey}:`, err);

  //     setChecklistData([]);
  //     setTabData((prev) => ({
  //       ...prev,
  //       [tabKey]: [],
  //     }));
  //     setPaginationInfo({
  //       count: 0,
  //       next: null,
  //       previous: null,
  //     });

  //     toast.error(`Failed to load ${tabKey}`, {
  //       style: {
  //         background: themeConfig.error,
  //         color: "white",
  //         borderRadius: "12px",
  //       },
  //     });
  //   } finally {
  //     setTabLoading((prev) => ({ ...prev, [tabKey]: false }));
  //   }
  // };
const fetchTabData = async (tabKey) => {
  const tabConfig = initializerTabs.find((tab) => tab.key === tabKey);
  if (!tabConfig) return;

  setTabLoading((prev) => ({ ...prev, [tabKey]: true }));

  try {
    const role = String(
      userRole || readActiveRoleFromStorage(projectId) || "",
    ).toUpperCase();

    setPerformanceMetrics((prev) => ({
      ...prev,
      apiCalls: prev.apiCalls + 1,
    }));

    // ✅ INITIALIZER FLOW
    if (isInitializerUser(role)) {
      console.log("🚀 INITIALIZER FLOW START");

      // ✅ STEP 1: CALL INIT ONLY ONCE PER FLAT
      if (!flatInitReady && !flatInitLoading) {
        console.log("🧠 INIT_CONTEXT TRIGGERED");

        await ensureFlatChecklistForInitializer(role);
      }

      // ✅ STEP 2: LOAD CHECKLIST AFTER INIT
      await loadFlatChecklists({
        status: tabConfig.apiStatus,
        offset: 0,
        limit: 10,
        tabKey,
        explicitRole: role,
      });

      return;
    }

    // ✅ NON-INITIALIZER FLOW (unchanged)
    await loadFlatChecklists({
      status: tabConfig.apiStatus,
      offset: 0,
      limit: 10,
      tabKey: null,
      explicitRole: role,
    });
  } catch (err) {
    console.error(`❌ Failed to fetch tab data for ${tabKey}:`, err);

    setChecklistData([]);
    setTabData((prev) => ({
      ...prev,
      [tabKey]: [],
    }));
    setPaginationInfo({
      count: 0,
      next: null,
      previous: null,
    });

    toast.error(`Failed to load ${tabKey}`, {
      style: {
        background: themeConfig.error,
        color: "white",
        borderRadius: "12px",
      },
    });
  } finally {
    setTabLoading((prev) => ({ ...prev, [tabKey]: false }));
  }
};

useEffect(() => {
  setFlatInitReady(false);
}, [flatId]);
  // const getOffsetFromPageUrl = (url) => {
  //   if (!url) return null;
  //   try {
  //     const parsed = new URL(url);
  //     const value = parsed.searchParams.get("offset");
  //     return value ? Number(value) : 0;
  //   } catch (e) {
  //     return null;
  //   }
  // };

  // const getLimitFromPageUrl = (url, fallback = 10) => {
  //   if (!url) return fallback;
  //   try {
  //     const parsed = new URL(url);
  //     const value = parsed.searchParams.get("limit");
  //     return value ? Number(value) : fallback;
  //   } catch (e) {
  //     return fallback;
  //   }
  // };

  useEffect(() => {
    const role = String(userRole || "").toUpperCase();

    if (role !== "INITIALIZER" && role !== "INTIALIZER") return;
    if (!projectId || !selectedPhaseId || !resolvedTowerId || !flatId) return;

    console.log("🟡 INITIALIZER FLAT PAGE AUTO LOAD", {
      projectId,
      selectedPhaseId,
      resolvedTowerId,
      flatId,
      levelId,
      role,
    });

    fetchTabData(activeTab || "ready-to-start");
  }, [
    projectId,
    selectedPhaseId,
    resolvedTowerId,
    flatId,
    levelId,
    userRole,
    activeTab,
  ]);

  const handleTabSwitch = async (tabKey) => {
    setActiveTab(tabKey);
    setSelectedForBulk(new Set());
    // await loadInitializerPage({ offset: 0, tabKey });
    await fetchTabData(tabKey);
  };

  // ADD THIS RIGHT AFTER updateMultipleChecklists function
  const additionalStyles = `
.whoosh-out {
    animation: whooshOut 0.5s ease-in-out forwards;
    transform-origin: center;
}

@keyframes whooshOut {
    0% {
        opacity: 1;
        transform: scale(1) translateX(0);
    }
    50% {
        opacity: 0.7;
        transform: scale(1.05) translateX(10px);
    }
    100% {
        opacity: 0;
        transform: scale(0.8) translateX(100px);
        height: 0;
        margin: 0;
        padding: 0;
    }
}

.checklist-card {
    transition: all 0.3s ease;
}
`;
  //report added today 31.7.2025
  // console.log(" before useEffect triggered!", flatId);
  // const isMaker = userRole === "MAKER";
  useEffect(() => {
    // console.log("useEffect triggered!", flatId);
    if (!flatId) return;

    const token = localStorage.getItem("ACCESS_TOKEN");
    if (!token) {
      console.warn("No token, cannot preload report meta");
      return;
    }

    // console.log("Preloading report meta for FlatId:", flatId);

    (async () => {
      try {
        const res = await NEWchecklistInstance.get(`/flat-report/${flatId}/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          timeout: 60000,
        });

        const data = res.data || {};
        console.log("📄 Report Data (preload):", data);
        setReportData(data);

        // ---------- STAGES ----------
        const stagesArr = Array.isArray(data.stages) ? data.stages : [];
        const stageList = stagesArr
          .filter((s) => s.stage_id && s.stage_name)
          .map((s) => ({
            id: s.stage_id,
            name: s.stage_name,
          }));

        // console.log("🟢 stageOptions from flat-report:", stageList);
        setStageOptions(stageList);

        // ---------- CATEGORIES (deep scan) ----------
        const catSet = new Set();

        const collectCategories = (node) => {
          if (!node || typeof node !== "object") return;

          // Possible keys jinke andar category ka naam ho sakta hai
          const v1 = node.category;
          const v2 = node.category_name;
          const v3 = node.category_label;
          const v4 = node.category_slug;

          [v1, v2, v3, v4].forEach((val) => {
            if (typeof val === "string" && val.trim()) {
              catSet.add(val.trim());
            }
          });

          // Recursively andar jao
          Object.values(node).forEach((val) => {
            if (Array.isArray(val)) {
              val.forEach(collectCategories);
            } else if (val && typeof val === "object") {
              collectCategories(val);
            }
          });
        };

        // Sirf stages array se scan karna enough hai
        collectCategories(stagesArr);

        const catList = Array.from(catSet).sort((a, b) =>
          String(a).localeCompare(String(b)),
        );

        // console.log("🟢 categoryOptions from flat-report:", catList);
        //   setCategoryOptions(catList);
        if (catList.length > 0) {
          setCategoryOptions((prev) => {
            const merged = new Set(prev || []);
            catList.forEach((c) => merged.add(c));
            return Array.from(merged).sort((a, b) =>
              String(a).localeCompare(String(b)),
            );
          });
        }
      } catch (error) {
        console.error("❌ flat-report preload failed:", error);
        setReportError(
          error.response?.data?.detail ||
            error.message ||
            "Failed to preload report",
        );
      }
    })();
  }, [flatId]);

  // console.log("Flat ID for report fetch:", flatId);
  useEffect(() => {
    const syncRole = () => {
      const nextRole = readActiveRoleFromStorage();
      if (nextRole && nextRole !== userRole) {
        console.log("🔁 Role changed:", userRole, "→", nextRole);
        setUserRole(nextRole);
      }
    };

    // ✅ same-tab role change (custom event)
    const onRoleChanged = () => syncRole();
    window.addEventListener(ACTIVE_ROLE_EVENT, onRoleChanged);

    // ✅ cross-tab role change (storage event)
    const onStorage = (e) => {
      if (e.key === ACTIVE_ROLE_LS_KEY || e.key === "persist:root") syncRole();
    };
    window.addEventListener("storage", onStorage);

    // ✅ fallback: because sometimes event miss ho jata
    const id = setInterval(syncRole, 800);

    return () => {
      window.removeEventListener(ACTIVE_ROLE_EVENT, onRoleChanged);
      window.removeEventListener("storage", onStorage);
      clearInterval(id);
    };
  }, [userRole]);

  useEffect(() => {
    const sync = () => setActiveRole(readActiveRole());

    const onCustom = (e) => {
      const roleFromEvent = e?.detail?.role;
      setActiveRole(String(roleFromEvent || readActiveRole()).toUpperCase());
    };

    // other tab updates
    window.addEventListener("storage", sync);

    // ✅ same tab updates (Profile page se dispatch ho raha hai)
    window.addEventListener("ACTIVE_ROLE_CHANGED", onCustom);

    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("ACTIVE_ROLE_CHANGED", onCustom);
    };
  }, []);

  useEffect(() => {
    const styleElement = document.createElement("style");
    styleElement.innerHTML = additionalStyles;
    document.head.appendChild(styleElement);

    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  useEffect(() => {
    const role = String(userRole || "").toUpperCase();

    if (!["CHECKER", "MAKER", "SUPERVISOR"].includes(role)) return;
    if (!projectId || !flatId || !resolvedTowerId) return;

    console.log("🟦 WORKING ROLE FLAT PAGE AUTO LOAD", {
      role,
      projectId,
      flatId,
      resolvedTowerId,
      levelId,
      selectedPhaseId,
      selectedPurposeId,
      activeWorkTab,
    });

    loadFlatChecklists({
      status: activeWorkTab === "available-work" ? undefined : undefined,
      offset: 0,
      limit: 50,
      tabKey: null,
      explicitRole: role,
    });
  }, [
    userRole,
    projectId,
    flatId,
    resolvedTowerId,
    levelId,
    selectedPhaseId,
    selectedPurposeId,
    activeWorkTab,
  ]);

  // Initialize single checklist
  const handleInitializeChecklist = async (checklistId) => {
    setInitializingChecklists((prev) => new Set([...prev, checklistId]));

    try {
      const token = localStorage.getItem("ACCESS_TOKEN");

      console.log(
        "📡 API CALL: handleInitializeChecklist - Request URL:",
        `/start-checklist/${checklistId}/`,
      );
      console.log(
        "📡 API CALL: handleInitializeChecklist - Checklist ID:",
        checklistId,
      );

      const response = await checklistInstance.post(
        `/start-checklist/${checklistId}/`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      console.log(
        "📡 API RESPONSE: handleInitializeChecklist - Response:",
        response.data,
      );
      console.log(
        "📡 API RESPONSE: handleInitializeChecklist - Status:",
        response.status,
      );

      if (response.status === 200) {
        // Immediate UI update with whoosh effect
        updateChecklistAfterInitialization(checklistId);
        setTimeout(async () => {
          await loadInitializerPage({ offset: 0, tabKey: "actively-working" });
          setActiveTab("actively-working");
        }, 500);
      }
    } catch (err) {
      console.error("❌ Failed to initialize checklist:", err);
      const errorMessage =
        err.response?.data?.error || "Failed to initialize checklist";

      toast.error(`❌ ${errorMessage}`, {
        duration: 4000,
        style: {
          background: themeConfig.error,
          color: "white",
          borderRadius: "12px",
          padding: "16px",
        },
      });
    } finally {
      setInitializingChecklists((prev) => {
        const newSet = new Set(prev);
        newSet.delete(checklistId);
        return newSet;
      });
    }
  };

  // Initialize multiple checklists
  const handleBulkInitialize = async (confirmed = false) => {
    if (selectedForBulk.size === 0) {
      toast.error("Please select at least one checklist to initialize", {
        style: {
          background: themeConfig.warning,
          color: "white",
          borderRadius: "12px",
        },
      });
      return;
    }

    // Show confirmation dialog first
    if (!confirmed) {
      setConfirmDialogData({
        title: "Initialize Checklists",
        message: `Are you sure you want to initialize ${selectedForBulk.size} checklist${selectedForBulk.size !== 1 ? "s" : ""}? This will start the workflow process.`,
        confirmText: "Initialize",
        confirmColor: themeConfig.accent,
        onConfirm: () => handleBulkInitialize(true),
      });
      setShowConfirmDialog(true);
      return;
    }

    setBulkInitializing(true);
    const selectedIds = Array.from(selectedForBulk);
    let successCount = 0;
    let failCount = 0;

    try {
      // Process each checklist sequentially for better UX
      for (const checklistId of selectedIds) {
        try {
          const token = localStorage.getItem("ACCESS_TOKEN");

          const response = await checklistInstance.post(
            `/start-checklist/${checklistId}/`,
            {},
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          );

          if (response.status === 200) {
            successCount++;
            // Update the checklist data in real-time
            setChecklistData((prevData) =>
              prevData.map((roomData) => ({
                ...roomData,
                // checklists: roomData.checklists.map((checklist) =>
                available_for_me: (roomData.available_for_me || []).map(
                  (checklist) =>
                    checklist.id === checklistId
                      ? { ...checklist, status: "in_progress" }
                      : checklist,
                ),
              })),
            );
          }
        } catch (err) {
          failCount++;
          console.error(`Failed to initialize checklist ${checklistId}:`, err);
        }
      }

      // Show summary toast
      if (successCount > 0) {
        // Get successfully initialized checklist IDs
        const successfulIds = Array.from(selectedForBulk).slice(
          0,
          successCount,
        );

        // Apply whoosh effect to all successful items
        updateMultipleChecklists(successfulIds);

        // Show summary toast
        if (failCount === 0) {
          toast.success(
            `🎉 All ${successCount} checklists initialized successfully!`,
            {
              duration: 5000,
              style: {
                background: themeConfig.success,
                color: "white",
                borderRadius: "12px",
                padding: "16px",
              },
            },
          );
        } else {
          toast.success(
            `⚠️ ${successCount} checklists initialized, ${failCount} failed.`,
            {
              duration: 5000,
              style: {
                background: themeConfig.warning,
                color: "white",
                borderRadius: "12px",
                padding: "16px",
              },
            },
          );
        }

        // Clear selection after animation
        setTimeout(() => {
          setSelectedForBulk(new Set());
        }, 1000);
      } else {
        toast.error("❌ Failed to initialize all selected checklists.", {
          duration: 4000,
          style: {
            background: themeConfig.error,
            color: "white",
            borderRadius: "12px",
            padding: "16px",
          },
        });
      }
    } finally {
      setBulkInitializing(false);
    }
  };
  // ==== MEDIA HELPERS (ADD ONCE NEAR TOP) ====
  const resolveSrc = (s) => {
    if (!s) return null;
    if (s.startsWith("http") || s.startsWith("data:")) return s;
    return `https://konstruct.world${s}`;
  };
  const normalizeSources = (arrOrObj) => {
    // supports ["data:...","/media/x.jpg", ...] or [{url:...}, ...]
    if (!arrOrObj) return [];
    if (Array.isArray(arrOrObj)) {
      return arrOrObj
        .map((v) => (typeof v === "string" ? v : v?.url || v?.src))
        .filter(Boolean);
    }
    return [];
  };
  const appendFiles = (fd, field, files = []) => {
    files.forEach((f) => fd.append(field, f));
  };

  const ImageStrip = ({ sources = [], themeConfig }) => (
    <div className="flex flex-wrap gap-2">
      {sources.map((s, i) => {
        const src = resolveSrc(s);
        if (!src) return null;
        return (
          <img
            key={i}
            src={src}
            alt={`img-${i + 1}`}
            className="w-32 h-20 object-cover rounded border cursor-zoom-in"
            style={{ borderColor: themeConfig.success }}
            onClick={() => window.open(src, "_blank")}
          />
        );
      })}
    </div>
  );

  useEffect(() => {
    const cats = new Set();

    const collectFromItems = (items = []) => {
      items.forEach((item) => {
        const cat =
          item.category ||
          item.category_name ||
          item.category_label ||
          item.category_text ||
          null;
        if (cat) {
          cats.add(String(cat).trim());
        }
      });
    };

    if (userRole === "INITIALIZER") {
      // INITIALIZER → tabData[tabKey].checklists[].items
      Object.values(tabData || {}).forEach((roomsArray) => {
        (roomsArray || []).forEach((roomObj) => {
          (roomObj.checklists || []).forEach((cl) =>
            collectFromItems(cl.items || []),
          );
        });
      });
    } else {
      // Working roles → checklistData[].available_for_me / assigned_to_me / pending_for_me
      (checklistData || []).forEach((roomObj) => {
        ["available_for_me", "assigned_to_me", "pending_for_me"].forEach(
          (key) => {
            (roomObj[key] || []).forEach((cl) =>
              collectFromItems(cl.items || []),
            );
          },
        );
      });
    }

    // ❗ If nothing new found, don't touch categoryOptions
    if (!cats.size) return;

    // ✅ Merge new categories with whatever is already there (from flat-report)
    setCategoryOptions((prev) => {
      const merged = new Set(prev || []);
      cats.forEach((c) => merged.add(c));
      return Array.from(merged).sort();
    });
  }, [userRole, tabData, checklistData]);

  useEffect(() => {
    if (!projectId) return;

    const token = localStorage.getItem("ACCESS_TOKEN");
    setStagesLoading(true);

    (async () => {
      try {
        // 🔧 Adjust endpoint if needed based on your real API
        const res = await projectInstance.get("/stages/", {
          params: { project_id: projectId },
          headers: { Authorization: `Bearer ${token}` },
        });

        const raw = res.data?.results || res.data || [];

        const options = raw.map((st) => ({
          id: st.id,
          name: st.stage_name || st.name || st.label || `Stage ${st.id}`,
        }));

        setStageOptions(options);
      } catch (err) {
        console.error("❌ Failed to load stages list:", err);
      } finally {
        setStagesLoading(false);
      }
    })();
  }, [projectId]);

  // Bulk decision handler for CHECKER and SUPERVISOR
  const handleBulkDecision = async (decisionType, confirmed = false) => {
    if (selectedItemsForBulk.size === 0) {
      toast.error("Please select at least one item to process", {
        style: {
          background: themeConfig.warning,
          color: "white",
          borderRadius: "12px",
        },
      });
      return;
    }

    // Show confirmation dialog first
    if (!confirmed) {
      const actionText =
        decisionType === "pass"
          ? userRole === "CHECKER"
            ? "APPROVE"
            : userRole === "SUPERVISOR"
              ? "ACCEPT"
              : "PASS"
          : userRole === "CHECKER"
            ? "REJECT"
            : userRole === "SUPERVISOR"
              ? "SEND TO REWORK"
              : "FAIL";

      setConfirmDialogData({
        title: `${actionText} Items`,
        message: `Are you sure you want to ${actionText.toLowerCase()} ${selectedItemsForBulk.size} item${selectedItemsForBulk.size !== 1 ? "s" : ""}? This action cannot be undone.`,
        confirmText: actionText,
        confirmColor:
          decisionType === "pass"
            ? themeConfig.passColor
            : themeConfig.failColor,
        onConfirm: () => handleBulkDecision(decisionType, true),
      });
      setShowConfirmDialog(true);
      return;
    }

    setBulkSubmitting(true);
    setBulkDecisionType(decisionType);
    const selectedIds = Array.from(selectedItemsForBulk);
    let successCount = 0;
    let failCount = 0;

    try {
      // Get all available items to find options
      const currentDataSource =
        activeWorkTab === "available-work"
          ? "available_for_me"
          : "assigned_to_me";
      const allItems = checklistData.flatMap((room) => {
        const checklists = room[currentDataSource] || [];
        return checklists.flatMap((checklist) => checklist.items || []);
      });

      // Process each selected item
      for (const itemId of selectedIds) {
        try {
          const item = allItems.find((item) => item.id === itemId);
          if (!item) {
            failCount++;
            continue;
          }

          // Find appropriate option based on decision type
          const targetOption = item.options?.find((opt) =>
            decisionType === "pass" ? opt.choice === "P" : opt.choice === "N",
          );

          if (!targetOption) {
            console.error(
              `No ${decisionType.toUpperCase()} option found for item ${itemId}`,
            );
            failCount++;
            continue;
          }

          const token = localStorage.getItem("ACCESS_TOKEN");
          const payload = {
            checklist_item_id: itemId,
            role: userRole.toLowerCase(),
            option_id: targetOption.id,
            check_remark: `Bulk ${decisionType.toUpperCase()} decision by ${userRole}`,
          };

          console.log(
            `📡 API CALL: Bulk ${decisionType.toUpperCase()} - Item ${itemId}:`,
            payload,
          );

          const response = await checklistInstance.patch(
            VERIFY_ITEM_API,
            payload,
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          );

          if (response.status === 200) {
            successCount++;
          } else {
            failCount++;
          }
        } catch (err) {
          failCount++;
          console.error(`Failed to process item ${itemId}:`, err);
        }
      }

      // Show summary toast
      if (successCount > 0) {
        if (failCount === 0) {
          toast.success(
            `🎉 All ${successCount} items processed with ${decisionType.toUpperCase()} decision!`,
            {
              duration: 5000,
              style: {
                background:
                  decisionType === "pass"
                    ? themeConfig.passColor
                    : themeConfig.failColor,
                color: "white",
                borderRadius: "12px",
                padding: "16px",
              },
            },
          );
        } else {
          toast.success(
            `⚠️ ${successCount} items processed, ${failCount} failed.`,
            {
              duration: 5000,
              style: {
                background: themeConfig.warning,
                color: "white",
                borderRadius: "12px",
                padding: "16px",
              },
            },
          );
        }

        // Clear selection and refresh data
        // Clear selection and refresh data smoothly
        setTimeout(async () => {
          setSelectedItemsForBulk(new Set());

          // Smooth refresh without page reload
          try {
            const token = localStorage.getItem("ACCESS_TOKEN");
            const response = await checklistInstance.get(CHECKLIST_API_URL, {
              // params: { project_id: projectId, flat_id: flatId, limit: 10, offset: 0 },
              params: getChecklistParams({
                limit: 10,
                offset: 0,
                role_id: resolveApiRoleId(),
              }),
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            });

            if (response.status === 200) {
              const responseData = response.data || {};
              let data = responseData.results || responseData || [];
              if (!Array.isArray(data)) data = [data];

              setChecklistData(data);
              setNoteMessage(response.data?.note || null);

              // Re-fetch room details if needed
              const roomIds = [
                ...new Set(data.map((item) => item.room_id).filter(Boolean)),
              ];
              if (roomIds.length > 0) {
                await fetchRoomDetails(roomIds);
              }
            }
          } catch (err) {
            console.error("❌ Failed to refresh data:", err);
            // Fallback to page reload only if API fails
            window.location.reload();
          }
        }, 1000);
      } else {
        toast.error("❌ Failed to process all selected items.", {
          duration: 4000,
          style: {
            background: themeConfig.error,
            color: "white",
            borderRadius: "12px",
            padding: "16px",
          },
        });
      }
    } finally {
      setBulkSubmitting(false);
      setBulkDecisionType(null);
    }
  };

  // Toggle checklist selection for bulk operations
  const toggleChecklistSelection = (checklistId) => {
    setSelectedForBulk((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(checklistId)) {
        newSet.delete(checklistId);
      } else {
        newSet.add(checklistId);
      }
      return newSet;
    });
  };

  // Toggle item selection for bulk operations (CHECKER/SUPERVISOR)
  const toggleItemSelection = (itemId) => {
    setSelectedItemsForBulk((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  // 👇 NEW: compute the stageId from whatever data is on screen
  const stageId = React.useMemo(() => {
    // INITIALIZER → stage_id lives on checklists inside tabData[activeTab]
    if (userRole === "INITIALIZER") {
      const list = (tabData[activeTab] || []).flatMap(
        (r) => r.checklists || [],
      );
      const c = list.find((x) => x?.stage_id);
      return c?.stage_id ?? null;
    }

    // CHECKER / SUPERVISOR → stage_id on checklists in checklistData
    if (userRole === "CHECKER" || userRole === "SUPERVISOR") {
      const list = checklistData.flatMap((r) => [
        ...(r.available_for_me || []),
        ...(r.assigned_to_me || []),
      ]);
      const c = list.find((x) => x?.stage_id);
      return c?.stage_id ?? null;
    }

    // MAKER → arrays contain items; try checklist.stage_id first, then item.stage_id
    if (userRole === "MAKER") {
      const list = checklistData.flatMap((r) => [
        ...(r.available_for_me || []),
        ...(r.assigned_to_me || []),
      ]);

      // sometimes stage_id is directly on the checklist object
      const anyWithStage = list.find((x) => x?.stage_id);
      if (anyWithStage?.stage_id) return anyWithStage.stage_id;

      // else scan nested items
      const nested = list.flatMap((c) => c?.items || []);
      const it = nested.find((i) => i?.stage_id);
      return it?.stage_id ?? null;
    }

    return null;
  }, [userRole, activeTab, tabData, checklistData]);

  // Select all not_started checklists
  const selectAllNotStarted = () => {
    const notStartedIds = isInitializerUser(userRole)
      ? (tabData[activeTab] || [])
          .flatMap((roomData) => roomData.checklists || [])
          .filter(
            (checklist) => checklist && checklist.status === "not_started",
          )
          .map((checklist) => checklist.id)
      : checklistData
          .flatMap((roomData) => [
            ...(roomData.assigned_to_me || []),
            ...(roomData.available_for_me || []),
          ])
          .filter(
            (checklist) => checklist && checklist.status === "not_started",
          )
          .map((checklist) => checklist.id);

    if (
      selectedForBulk.size === notStartedIds.length &&
      notStartedIds.length > 0
    ) {
      setSelectedForBulk(new Set());
    } else {
      setSelectedForBulk(new Set(notStartedIds));
    }
  };

  useEffect(() => {
    console.log("🔎 Derived stageId:", stageId);
  }, [stageId]);

  //add for the pagiantion next and previous
  const PaginationBar = () => {
    const totalPages = Math.max(
      1,
      Math.ceil(pageState.count / Math.max(1, pageState.limit)),
    );
    const showingStart = pageState.offset + 1;
    // const showingEnd = Math.min(pageState.offset + (checklistData?.length || 0), pageState.count);
    // const showingEnd = Math.min(
    //   pageState.offset + ((tabData?.[activeTab]?.length) || 0),
    //   pageState.count
    // );
    const showingEnd = Math.min(
      pageState.offset +
        (userRole === "INITIALIZER"
          ? tabData?.[activeTab]?.length || 0
          : checklistData?.length || 0),
      pageState.count,
    );

    return (
      <div
        className="mt-4 p-3 rounded-xl flex items-center justify-between"
        style={{
          background: themeConfig.cardBg,
          border: `1px solid ${themeConfig.border}`,
        }}
      >
        <div className="text-sm" style={{ color: themeConfig.textSecondary }}>
          {pageLoading
            ? "Loading…"
            : pageState.count > 0
              ? `Showing ${showingStart}–${showingEnd} (Page ${pageState.page} of ${totalPages}) Total: ${pageState.count} checklists `
              : "No results"}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevPage}
            disabled={!pageState.previous || pageLoading}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              !pageState.previous || pageLoading
                ? "opacity-50 cursor-not-allowed"
                : "hover:shadow-md hover:scale-105"
            }`}
            style={{
              background: `${themeConfig.textSecondary}15`,
              color: themeConfig.textSecondary,
              border: `1px solid ${themeConfig.textSecondary}50`,
            }}
            aria-label="Previous page"
          >
            ← Previous
          </button>

          <button
            onClick={handleNextPage}
            disabled={!pageState.next || pageLoading}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              !pageState.next || pageLoading
                ? "opacity-50 cursor-not-allowed"
                : "hover:shadow-md hover:scale-105"
            }`}
            style={{
              background: `linear-gradient(135deg, ${themeConfig.accent}, ${themeConfig.accent}dd)`,
              color: "white",
              border: `1px solid ${themeConfig.accent}`,
            }}
            aria-label="Next page"
          >
            Next →
          </button>
        </div>
      </div>
    );
  };

  // Get role-based action buttons
  const getRoleBasedActions = (checklist, item = null) => {
    if (!userRole) return null;

    switch (userRole) {
      case "INITIALIZER":
        return getInitializeButton(checklist);

      case "CHECKER":
        if (!item) return null;
        const isPreScreening =
          !item.submissions || item.submissions.length === 0;
        return (
          <div className="flex gap-2">
            <button
              className="px-3 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: themeConfig.success,
                color: "white",
              }}
            >
              {isPreScreening ? "Accept for Workflow" : "Approve Final"}
            </button>
            <button
              className="px-3 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: themeConfig.error,
                color: "white",
              }}
            >
              {isPreScreening ? "Mark Complete" : "Send for Rework"}
            </button>
          </div>
        );

      case "SUPERVISOR":
        if (!item) {
          // No button at checklist level for SUPERVISOR
          return null;
        }

        // Show button only for items that need SUPERVISOR review
        if (
          item.status === "pending_for_supervisor" &&
          item.submissions &&
          item.submissions.length > 0
        ) {
          return (
            <button
              onClick={() => {
                setSelectedItemForSupervisorReview(item);
                setShowSupervisorReviewModal(true);
              }}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: themeConfig.warning,
                color: "white",
              }}
            >
              Review MAKER Work
            </button>
          );
        }

        return null;

      case "MAKER":
        if (!item) {
          // Show button at checklist level for MAKER
          return (
            <button
              onClick={() => {
                // Find items that need MAKER attention
                // const itemsNeedingWork = checklist.items?.filter(item =>
                //   item.status === 'pending_for_maker' || item.status === 'in_progress'
                // ) || [];

                // Since items array is empty, let's check if there are any items at all
                const itemsNeedingWork = checklist.items || [];
                console.log("🔍 DEBUG: All items for MAKER:", itemsNeedingWork);
                console.log("🔍 DEBUG: Checklist object:", checklist);

                // If no items in checklist.items, just open modal anyway for testing
                if (itemsNeedingWork.length === 0) {
                  // Create a mock item for testing
                  const mockItem = {
                    id: checklist.id,
                    title: `Work on ${checklist.name}`,
                    status: "pending_for_maker",
                    description: "Complete work for this checklist",
                  };
                  setSelectedItemForMaker(mockItem);
                  setShowMakerModal(true);
                  return;
                }

                console.log("🔍 DEBUG: All items for MAKER:", itemsNeedingWork);
                console.log(
                  "🔍 DEBUG: Item statuses:",
                  itemsNeedingWork.map((item) => item.status),
                );

                // For now, let MAKER work on any item that's not completed
                const filteredItems = itemsNeedingWork.filter(
                  (item) => item.status !== "completed",
                );

                if (itemsNeedingWork.length > 0) {
                  setSelectedItemForMaker(itemsNeedingWork[0]);
                  setShowMakerModal(true);
                } else {
                  toast.success(
                    "No items requiring your attention in this checklist",
                  );
                }
              }}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: themeConfig.accent,
                color: "white",
              }}
            >
              View Items to Complete
            </button>
          );
        }
        return (
          <button
            onClick={() => {
              setSelectedItemForMaker(item);
              setMakerRemark("");
              setMakerPhotos([]);
              setSelectedChecklist(item); // "item" here is the checklist object (with .items)
              setShowMakerModal(true);
            }}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: themeConfig.accent,
              color: "white",
            }}
          >
            Complete Work
          </button>
        );
      default:
        return null;
    }
  };
  useEffect(() => {
    console.log("🔎 Derived stageId:", stageId);
  }, [stageId]);

  // Get initialization button component
  const getInitializeButton = (checklist) => {
    const isInitializing = initializingChecklists.has(checklist.id);
    const canInitialize = checklist.status === "not_started";
    const isSelected = selectedForBulk.has(checklist.id);

    if (!canInitialize) {
      return null;
    }

    return (
      <div className="flex items-center gap-2">
        {/* Bulk selection checkbox */}
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => {
              e.stopPropagation(); // Prevent event bubbling
              toggleChecklistSelection(checklist.id);
            }}
            className="w-4 h-4 rounded border-2 focus:ring-2 cursor-pointer"
            style={{
              accentColor: themeConfig.accent,
              borderColor: themeConfig.border,
            }}
          />
        </div>

        {/* Initialize button */}
        <button
          onClick={() => handleInitializeChecklist(checklist.id)}
          disabled={isInitializing}
          className={`
            relative px-4 py-2 rounded-lg font-medium text-sm transition-all duration-300 transform
            ${
              isInitializing
                ? "opacity-75 cursor-not-allowed scale-95"
                : "hover:scale-105 hover:shadow-lg active:scale-95"
            }
          `}
          style={{
            background: isInitializing
              ? `linear-gradient(135deg, ${themeConfig.accent}80, ${themeConfig.accent}60)`
              : `linear-gradient(135deg, ${themeConfig.accent}, ${themeConfig.accent}dd)`,
            color: "white",
            border: `2px solid ${themeConfig.accent}`,
            boxShadow: isInitializing
              ? "none"
              : `0 4px 12px ${themeConfig.accent}30`,
          }}
        >
          {isInitializing ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Initializing...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span>🚀</span>
              <span>Initialize</span>
            </div>
          )}
        </button>
      </div>
    );
  };

  // Get bulk action bar
  // Get bulk action bar
  const getBulkActionBar = () => {
    // Show bulk actions for INITIALIZER, CHECKER, and SUPERVISOR
    if (userRole === "INITIALIZER") {
      const notStartedChecklists = (tabData[activeTab] || []) // Use current active tab
        .flatMap((roomData) => roomData.checklists || [])
        .filter((checklist) => checklist && checklist.status === "not_started");

      if (notStartedChecklists.length === 0) {
        return null;
      }

      return getInitializerBulkBar(notStartedChecklists);
    }

    if (["CHECKER", "SUPERVISOR"].includes(userRole)) {
      // Get all available items for current tab
      const currentDataSource =
        activeWorkTab === "available-work"
          ? "available_for_me"
          : "assigned_to_me";
      const availableItems = checklistData.flatMap((room) => {
        const checklists = room[currentDataSource] || [];
        return checklists.flatMap((checklist) => checklist.items || []);
      });

      if (availableItems.length === 0) {
        return null;
      }

      return getCheckerSupervisorBulkBar(availableItems);
    }

    return null;
  };

  // INITIALIZER bulk bar (existing logic)
  const getInitializerBulkBar = (notStartedChecklists) => {
    return (
      <div
        className="sticky top-0 z-10 p-4 rounded-xl mb-6 shadow-lg backdrop-blur-sm"
        style={{
          background: `${themeConfig.cardBg}f0`,
          border: `1px solid ${themeConfig.border}40`,
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={
                  selectedForBulk.size === notStartedChecklists.length &&
                  notStartedChecklists.length > 0
                }
                indeterminate={
                  selectedForBulk.size > 0 &&
                  selectedForBulk.size < notStartedChecklists.length
                }
                onChange={selectAllNotStarted}
                className="w-5 h-5 rounded border-2 focus:ring-2"
                style={{
                  accentColor: themeConfig.accent,
                  borderColor: themeConfig.border,
                }}
                ref={(el) => {
                  if (el) {
                    el.indeterminate =
                      selectedForBulk.size > 0 &&
                      selectedForBulk.size < notStartedChecklists.length;
                  }
                }}
              />
              <span
                className="font-medium"
                style={{ color: themeConfig.textPrimary }}
              >
                Select All ({notStartedChecklists.length} available)
              </span>
            </div>

            {selectedForBulk.size > 0 && (
              <span
                className="px-3 py-1 rounded-full text-sm font-medium"
                style={{
                  background: `${themeConfig.accent}20`,
                  color: themeConfig.accent,
                }}
              >
                {selectedForBulk.size} selected
              </span>
            )}
          </div>

          {selectedForBulk.size > 0 && (
            <button
              onClick={handleBulkInitialize}
              disabled={bulkInitializing}
              className={`
                            px-6 py-2 rounded-lg font-medium transition-all duration-300 transform
                            ${
                              bulkInitializing
                                ? "opacity-75 cursor-not-allowed scale-95"
                                : "hover:scale-105 hover:shadow-lg active:scale-95"
                            }
                        `}
              style={{
                background: bulkInitializing
                  ? `linear-gradient(135deg, ${themeConfig.accent}80, ${themeConfig.accent}60)`
                  : `linear-gradient(135deg, ${themeConfig.accent}, ${themeConfig.accent}dd)`,
                color: "white",
                border: `2px solid ${themeConfig.accent}`,
                boxShadow: bulkInitializing
                  ? "none"
                  : `0 4px 16px ${themeConfig.accent}40`,
              }}
            >
              {bulkInitializing ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Initializing {selectedForBulk.size} items...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span>🚀</span>
                  <span>Initialize Selected ({selectedForBulk.size})</span>
                </div>
              )}
            </button>
          )}
        </div>
      </div>
    );
  };
  useEffect(() => {
    console.log("🔎 Derived stageId:", stageId);
  }, [stageId]);

  // CHECKER/SUPERVISOR bulk bar (new)
  const getCheckerSupervisorBulkBar = (availableItems) => {
    return (
      <div
        className="sticky top-0 z-10 p-4 rounded-xl mb-6 shadow-lg backdrop-blur-sm"
        style={{
          background: `${themeConfig.cardBg}f0`,
          border: `1px solid ${themeConfig.border}40`,
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={
                  selectedItemsForBulk.size === availableItems.length &&
                  availableItems.length > 0
                }
                onChange={() => {
                  if (selectedItemsForBulk.size === availableItems.length) {
                    setSelectedItemsForBulk(new Set());
                  } else {
                    setSelectedItemsForBulk(
                      new Set(availableItems.map((item) => item.id)),
                    );
                  }
                }}
                className="w-5 h-5 rounded border-2 focus:ring-2"
                style={{
                  accentColor: themeConfig.accent,
                  borderColor: themeConfig.border,
                }}
              />
              <span
                className="font-medium"
                style={{ color: themeConfig.textPrimary }}
              >
                Select All ({availableItems.length} item
                {availableItems.length !== 1 ? "s" : ""})
              </span>
            </div>

            {selectedItemsForBulk.size > 0 && (
              <span
                className="px-3 py-1 rounded-full text-sm font-medium"
                style={{
                  background: `${themeConfig.accent}20`,
                  color: themeConfig.accent,
                }}
              >
                {selectedItemsForBulk.size} selected
              </span>
            )}
          </div>

          {selectedItemsForBulk.size > 0 && (
            <div className="flex items-center gap-3">
              {/* Bulk PASS Button */}
              <button
                onClick={() => handleBulkDecision("pass")}
                disabled={bulkSubmitting}
                className={`
                                px-6 py-2 rounded-lg font-medium transition-all duration-300 transform
                                ${
                                  bulkSubmitting
                                    ? "opacity-75 cursor-not-allowed scale-95"
                                    : "hover:scale-105 hover:shadow-lg active:scale-95"
                                }
                            `}
                style={{
                  background: bulkSubmitting
                    ? `${themeConfig.passColor}80`
                    : `linear-gradient(135deg, ${themeConfig.passColor}, ${themeConfig.passColor}dd)`,
                  color: "white",
                  border: `2px solid ${themeConfig.passColor}`,
                  boxShadow: bulkSubmitting
                    ? "none"
                    : `0 4px 16px ${themeConfig.passColor}40`,
                }}
              >
                {bulkSubmitting && bulkDecisionType === "pass" ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Processing...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span>✅</span>
                    <span>
                      {userRole === "CHECKER"
                        ? "PASS All"
                        : userRole === "SUPERVISOR"
                          ? "APPROVE All"
                          : "PASS All"}{" "}
                      ({selectedItemsForBulk.size})
                    </span>
                  </div>
                )}
              </button>

              {/* Bulk FAIL Button */}
              <button
                onClick={() => handleBulkDecision("fail")}
                disabled={bulkSubmitting}
                className={`
                                px-6 py-2 rounded-lg font-medium transition-all duration-300 transform
                                ${
                                  bulkSubmitting
                                    ? "opacity-75 cursor-not-allowed scale-95"
                                    : "hover:scale-105 hover:shadow-lg active:scale-95"
                                }
                            `}
                style={{
                  background: bulkSubmitting
                    ? `${themeConfig.failColor}80`
                    : `linear-gradient(135deg, ${themeConfig.failColor}, ${themeConfig.failColor}dd)`,
                  color: "white",
                  border: `2px solid ${themeConfig.failColor}`,
                  boxShadow: bulkSubmitting
                    ? "none"
                    : `0 4px 16px ${themeConfig.failColor}40`,
                }}
              >
                {bulkSubmitting && bulkDecisionType === "fail" ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Processing...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span>❌</span>
                    <span>
                      {userRole === "CHECKER"
                        ? "FAIL All"
                        : userRole === "SUPERVISOR"
                          ? "REJECT"
                          : "FAIl"}{" "}
                      ({selectedItemsForBulk.size})
                    </span>
                  </div>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    );

    const notStartedChecklists =
      userRole === "INITIALIZER"
        ? (tabData["ready-to-start"] || [])
            .flatMap((roomData) => roomData.checklists || [])
            .filter(
              (checklist) => checklist && checklist.status === "not_started",
            )
        : checklistData
            .flatMap((roomData) => [
              ...(roomData.assigned_to_me || []),
              ...(roomData.available_for_me || []),
            ])
            .filter(
              (checklist) => checklist && checklist.status === "not_started",
            );

    if (notStartedChecklists.length === 0) {
      return null;
    }

    // Handle photo upload for MAKER

    return (
      <div
        className="sticky top-0 z-10 p-4 rounded-xl mb-6 shadow-lg backdrop-blur-sm"
        style={{
          background: `${themeConfig.cardBg}f0`,
          border: `1px solid ${themeConfig.border}40`,
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={
                  selectedForBulk.size === notStartedChecklists.length &&
                  notStartedChecklists.length > 0
                }
                onChange={selectAllNotStarted}
                className="w-5 h-5 rounded border-2 focus:ring-2"
                style={{
                  accentColor: themeConfig.accent,
                  borderColor: themeConfig.border,
                }}
              />
              <span
                className="font-medium"
                style={{ color: themeConfig.textPrimary }}
              >
                Select All ({notStartedChecklists.length} available)
              </span>
            </div>

            {selectedForBulk.size > 0 && (
              <span
                className="px-3 py-1 rounded-full text-sm font-medium"
                style={{
                  background: `${themeConfig.accent}20`,
                  color: themeConfig.accent,
                }}
              >
                {selectedForBulk.size} selected
              </span>
            )}
          </div>

          {selectedForBulk.size > 0 && (
            <button
              onClick={handleBulkInitialize}
              disabled={bulkInitializing}
              className={`
                px-6 py-2 rounded-lg font-medium transition-all duration-300 transform
                ${
                  bulkInitializing
                    ? "opacity-75 cursor-not-allowed scale-95"
                    : "hover:scale-105 hover:shadow-lg active:scale-95"
                }
              `}
              style={{
                background: bulkInitializing
                  ? `linear-gradient(135deg, ${themeConfig.accent}80, ${themeConfig.accent}60)`
                  : `linear-gradient(135deg, ${themeConfig.accent}, ${themeConfig.accent}dd)`,
                color: "white",
                border: `2px solid ${themeConfig.accent}`,
                boxShadow: bulkInitializing
                  ? "none"
                  : `0 4px 16px ${themeConfig.accent}40`,
              }}
            >
              {bulkInitializing ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Initializing {selectedForBulk.size} items...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span>🚀</span>
                  <span>Initialize Selected ({selectedForBulk.size})</span>
                </div>
              )}
            </button>
          )}
        </div>
      </div>
    );
  };

  // Fetch room details
  // Fetch room details
  const fetchRoomDetails = async (roomIds) => {
    if (!roomIds.length) {
      console.log("⚠️ No room IDs to fetch");
      return;
    }

    console.log("🔄 Fetching room details for IDs:", roomIds);
    setRoomsLoading(true);

    try {
      const token = localStorage.getItem("ACCESS_TOKEN");

      const roomPromises = roomIds.map(async (roomId) => {
        try {
          console.log(`📡 Fetching room ${roomId}`);
          const response = await projectInstance.get(`/rooms/${roomId}/`, {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 10000,
          });
          console.log(`🏠 Room ${roomId} details:`, response.data);
          return response.data;
        } catch (err) {
          console.error(`❌ Failed to fetch room ${roomId}:`, err);
          // Return fallback room data
          return {
            id: roomId,
            rooms: `Room ${roomId}`,
            name: `Room ${roomId}`,
          };
        }
      });

      const roomDetails = await Promise.all(roomPromises);
      console.log("🏠 All room details fetched:", roomDetails);

      // Log room names for debugging
      roomDetails.forEach((room) => {
        console.log(
          `🏠 Room ${room.id}: ${room.rooms || room.name || "No name"}`,
        );
      });

      setRooms(roomDetails);
    } catch (err) {
      console.error("❌ Failed to fetch room details:", err);
      toast.error("Failed to load room details");
    } finally {
      setRoomsLoading(false);
    }
  };
  const getRoomDisplayName = (roomData) => {
    if (!roomData) return "Unknown Room";

    const room = rooms.find((r) => r.id === roomData.room_id);

    return (
      room?.rooms || // "Living-Dining" from API
      room?.name || // fallback if backend uses "name"
      roomData.room_details?.rooms ||
      roomData.room_details?.name ||
      `Room ${roomData.room_id}` // final fallback
    );
  };

  useEffect(() => {
    console.log("🚀 useEffect triggered with:", { projectId, flatId });

    const fetchInitialData = async () => {
      if (!projectId || !flatId) {
        console.error("❌ Missing required data:", { projectId, flatId });
        setError("Missing project or flat information");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const detectedRole = getCurrentUserRole();
        const flowRole = localStorage.getItem("FLOW_ROLE");
        const workingRole = flowRole || detectedRole; // 👈 jo UI se set hua hai woh priority

        setUserRole(workingRole);

        if (workingRole === "INITIALIZER") {
          // For INITIALIZER, load default tab data
          await fetchTabData("ready-to-start");
          setChecklistData([]); // Clear old format data

          // After loading tab data, fetch room details
          setTimeout(() => {
            const roomIds = [
              ...new Set(
                Object.values(tabData).flatMap((tabRooms) =>
                  tabRooms.map((room) => room.room_id).filter(Boolean),
                ),
              ),
            ];

            console.log("🔍 INITIALIZER Room IDs to fetch:", roomIds);
            if (roomIds.length > 0) {
              fetchRoomDetails(roomIds);
            }
          }, 500);
        } else if (["CHECKER", "MAKER", "SUPERVISOR"].includes(workingRole)) {
          console.log("ℹ️ Working role detected:", workingRole);
          // yahan se tu loadWorkPage wagaira call karega agar neeche likha hai
          return;
        }
      } catch (err) {
        console.error("❌ API Error:", err);
        setError(err.message || "Failed to fetch data");
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [projectId, flatId]);

  const getStatusBadge = (status) => {
    const statusConfig = {
      completed: {
        bg: `${themeConfig.success}20`,
        text: themeConfig.success,
        label: "Completed",
      },
      in_progress: {
        bg: `${themeConfig.warning}20`,
        text: themeConfig.warning,
        label: "In Progress",
      },
      work_in_progress: {
        bg: `${themeConfig.warning}20`,
        text: themeConfig.warning,
        label: "Work In Progress",
      },
      not_started: {
        bg: `${themeConfig.textSecondary}20`,
        text: themeConfig.textSecondary,
        label: "Not Started",
      },
      on_hold: {
        bg: `${themeConfig.error}20`,
        text: themeConfig.error,
        label: "On Hold",
      },
      pending_for_inspector: {
        bg: `${themeConfig.accent}20`,
        text: themeConfig.accent,
        label: "Pending Inspector",
      },
      pending_for_supervisor: {
        bg: `${themeConfig.warning}20`,
        text: themeConfig.warning,
        label: "Pending Supervisor",
      },
      pending_for_maker: {
        bg: `${themeConfig.info}20`,
        text: themeConfig.info,
        label: "Pending Maker",
      },
    };

    // Safety check for undefined status
    const safeStatus = status || "not_started";
    const config = statusConfig[safeStatus] || statusConfig.not_started;
    return (
      <span
        className="px-3 py-1 rounded-full text-xs font-medium transition-all duration-200"
        style={{ background: config.bg, color: config.text }}
      >
        {config.label}
      </span>
    );
  };
  useEffect(() => {
    console.log("🔎 Derived stageId:", stageId);
  }, [stageId]);

  const stats = React.useMemo(() => {
    let allItems = [];

    if (userRole === "INITIALIZER") {
      // For INITIALIZER, get data from all tabs
      allItems = Object.values(tabData).flatMap((tabRooms) =>
        tabRooms.flatMap((room) =>
          (room.checklists || []).flatMap(
            (checklist) => (checklist && checklist.items) || [],
          ),
        ),
      );
    } else if (["CHECKER", "MAKER", "SUPERVISOR"].includes(userRole)) {
      // For working roles, handle both item-level (MAKER) and checklist-level (CHECKER/SUPERVISOR)
      allItems = checklistData.flatMap((room) => {
        const assignedItems = room.assigned_to_me || [];
        const availableItems = room.available_for_me || [];

        if (userRole === "MAKER") {
          // MAKER: assigned_to_me and available_for_me contain items directly
          return [...assignedItems, ...availableItems];
        } else {
          // CHECKER/SUPERVISOR: assigned_to_me and available_for_me contain checklists with items
          const allChecklists = [...assignedItems, ...availableItems];
          return allChecklists.flatMap(
            (checklist) => (checklist && checklist.items) || [],
          );
        }
      });
    } else {
      // For other roles, use existing logic
      allItems = checklistData.flatMap((room) => {
        const checklists = [
          ...(room.assigned_to_me || []),
          ...(room.available_for_me || []),
        ];
        return checklists.flatMap(
          (checklist) => (checklist && checklist.items) || [],
        );
      });
    }

    const total = allItems.length;
    const completed = allItems.filter(
      (item) => item.status === "completed",
    ).length;
    const inProgress = allItems.filter(
      (item) => item.status === "in_progress",
    ).length;
    const notStarted = allItems.filter(
      (item) => item.status === "not_started",
    ).length;

    return {
      total,
      completed,
      inProgress,
      notStarted,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }, [checklistData, tabData, userRole]);
  const getRoomName = (roomData) => {
    const detail = rooms.find((r) => r.id === roomData.room_id);
    return (
      detail?.rooms ||
      detail?.name ||
      roomData.room_details?.rooms ||
      roomData.room_details?.name ||
      `Room ${roomData.room_id}`
    );
  };

  const handleBack = () => navigate(-1);
  const toggleItemExpansion = (checklistId, itemId) => {
    const key = `${checklistId}-${itemId}`;
    setExpandedItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Room Section Component
  const RoomSection = ({
    roomName,
    roomId,
    checklists,
    userRole,
    themeConfig,
    roomDetail,
    handleRoomClick,
  }) => {
    const [isRoomExpanded, setIsRoomExpanded] = useState(false);

    // // Debug room name for all roles
    // console.log(
    //   `🏠 RoomSection Debug - Role: ${userRole}, ID: ${roomId}, Name: ${roomName}`,
    // );
    // console.log(`🏠 RoomSection Room Detail:`, roomDetail);

    return (
      <div
        className="border rounded-lg p-4 mb-4"
        style={{ borderColor: themeConfig.border }}
      >
        {/* Room Header - Clickable */}
        <div
          className="cursor-pointer hover:shadow-md transition-all p-4 rounded-lg"
          style={{
            background: isRoomExpanded
              ? `${themeConfig.accent}10`
              : themeConfig.headerBg,
            borderColor: themeConfig.border,
          }}
          onClick={() => setIsRoomExpanded(!isRoomExpanded)}
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              {/* Room Icon */}
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg"
                style={{
                  background: `linear-gradient(135deg, ${themeConfig.accent}, ${themeConfig.accent}dd)`,
                }}
              >
                {roomName.charAt(0).toUpperCase()}
              </div>

              <div>
                <h3
                  className="text-xl font-bold"
                  style={{ color: themeConfig.textPrimary }}
                >
                  {roomName.toUpperCase()}
                </h3>
                <p
                  className="text-sm"
                  style={{ color: themeConfig.textSecondary }}
                >
                  {checklists.length} checklist
                  {checklists.length !== 1 ? "s" : ""} available
                  {roomId && ` • ${roomName}`}
                </p>
              </div>
            </div>

            {/* Expand/Collapse Arrow */}
            <div
              className={`transform transition-all duration-300 ${
                isRoomExpanded ? "rotate-90" : ""
              } p-2 rounded-full`}
              style={{
                color: themeConfig.accent,
                backgroundColor: `${themeConfig.accent}15`,
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z" />
              </svg>
            </div>
          </div>
        </div>

        {/* 👆 ADD THE ROOM-LEVEL BUTTON RIGHT HERE 👆 */}
        {/* Room-Level Initialize All Button for INITIALIZER */}
        {userRole === "INITIALIZER" && (
          <div className="mt-4">
            <button
              onClick={async () => {
                // Get all not_started checklists in this room
                const roomChecklistIds = checklists
                  .filter((checklist) => checklist.status === "not_started")
                  .map((checklist) => checklist.id);

                if (roomChecklistIds.length === 0) {
                  toast.success("No checklists to initialize in this room");
                  return;
                }

                // Initialize all checklists in this room
                setBulkInitializing(true);

                try {
                  for (const checklistId of roomChecklistIds) {
                    await handleInitializeChecklist(checklistId);
                  }

                  toast.success(
                    `🎉 All ${roomChecklistIds.length} checklists in ${roomName} initialized!`,
                    {
                      duration: 4000,
                      style: {
                        background: themeConfig.success,
                        color: "white",
                        borderRadius: "12px",
                      },
                    },
                  );
                } finally {
                  setBulkInitializing(false);
                }
              }}
              disabled={
                bulkInitializing ||
                checklists.filter((c) => c.status === "not_started").length ===
                  0
              }
              className="px-4 py-2 rounded-lg font-medium text-sm transition-all duration-300 transform hover:scale-105"
              style={{
                background:
                  checklists.filter((c) => c.status === "not_started")
                    .length === 0
                    ? `${themeConfig.textSecondary}60`
                    : `linear-gradient(135deg, ${themeConfig.accent}, ${themeConfig.accent}dd)`,
                color: "white",
                border: `2px solid ${themeConfig.accent}`,
              }}
            >
              <div className="flex items-center gap-2">
                <span>🏠</span>
                <span>
                  Initialize All in {roomName} (
                  {checklists.filter((c) => c.status === "not_started").length})
                </span>
              </div>
            </button>
          </div>
        )}

        {/* Expanded Checklists Content */}
        <div
          className={`transition-all duration-500 ease-out overflow-hidden ${
            isRoomExpanded
              ? "max-h-[2000px] opacity-100 mt-4"
              : "max-h-0 opacity-0"
          }`}
        >
          <div className="space-y-4">
            {checklists.map((checklist) => (
              <ChecklistCard
                key={checklist.id}
                checklist={checklist}
                userRole={userRole}
                themeConfig={themeConfig}
              />
            ))}
          </div>
        </div>
      </div>
    );
  };

  useEffect(() => {
    console.log("🔎 Derived stageId:", stageId);
  }, [stageId]);

  const ChecklistCard = React.memo(({ checklist, userRole, themeConfig }) => {
    const [isChecklistExpanded, setIsChecklistExpanded] = useState(false);

    return (
      <div
        data-checklist-id={checklist.id}
        className="border rounded-lg p-4 transition-all duration-300 hover:shadow-md checklist-card"
        style={{
          background: themeConfig.cardBg,
          borderColor: themeConfig.border,
        }}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h4
              className="font-semibold mb-1"
              style={{ color: themeConfig.textPrimary }}
            >
              {checklist.name}
            </h4>
            {checklist.description && (
              <p
                className="text-sm mb-2"
                style={{ color: themeConfig.textSecondary }}
              >
                {checklist.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {getStatusBadge(checklist.status)}
            {getRoleBasedActions(checklist, null)}
          </div>
        </div>

        {/* Clickable Items Section */}
        {checklist.items && checklist.items.length > 0 && (
          <div className="mt-3">
            <div
              className="p-3 rounded-lg cursor-pointer hover:shadow-sm transition-all duration-200"
              style={{ background: `${themeConfig.accent}08` }}
              onClick={() => setIsChecklistExpanded(!isChecklistExpanded)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📋</span>
                  <span
                    className="font-medium"
                    style={{ color: themeConfig.textPrimary }}
                  >
                    {checklist.items.length} Inspection Items
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="text-xs px-2 py-1 rounded-full"
                    style={{
                      background: `${themeConfig.accent}20`,
                      color: themeConfig.accent,
                    }}
                  >
                    {/* Read-only for {userRole} */}
                  </span>
                  <div
                    className={`transform transition-all duration-300 ${
                      isChecklistExpanded ? "rotate-90" : ""
                    }`}
                    style={{ color: themeConfig.accent }}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Expanded Items List */}
            <div
              className={`transition-all duration-500 ease-out overflow-hidden ${
                isChecklistExpanded
                  ? "max-h-[2000px] opacity-100 mt-4"
                  : "max-h-0 opacity-0"
              }`}
            >
              <div className="space-y-3">
                {checklist.items.map((item, itemIndex) => (
                  <InspectionItem
                    key={item.id}
                    item={item}
                    itemIndex={itemIndex}
                    userRole={userRole}
                    themeConfig={themeConfig}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  });

  // MAKER Item Card Component
  const MakerItemCard = ({ item, userRole, themeConfig }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
      <div
        className="border rounded-lg p-4 transition-all duration-300 hover:shadow-md"
        style={{
          background: themeConfig.cardBg,
          borderColor: themeConfig.border,
        }}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span
                className="text-sm font-bold px-2 py-1 rounded-full"
                style={{
                  background: `${themeConfig.accent}20`,
                  color: themeConfig.accent,
                }}
              >
                #{item.id}
              </span>
              <h4
                className="font-semibold"
                style={{ color: themeConfig.textPrimary }}
              >
                {item.title}
              </h4>
            </div>

            <div className="flex items-center gap-3 flex-wrap mb-2">
              {/* <Tooltip text={`Current status: ${item.status.replace('_', ' ')}`}>
                                {getStatusBadge(item.status)}
                            </Tooltip> */}

              {item.photo_required && (
                <Tooltip text="This item requires photo documentation">
                  <span
                    className="px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1"
                    style={{
                      background: `${themeConfig.accent}20`,
                      color: themeConfig.accent,
                    }}
                  >
                    <span>📷</span>
                    Photo Required
                  </span>
                </Tooltip>
              )}
              {userRole === "MAKER" &&
                (() => {
                  const latest = getLatestSubmission(item);
                  const checkerPhotos = getRolePhotos(latest, "checker");
                  const supervisorPhotos = getRolePhotos(latest, "supervisor");
                  const hasAny =
                    checkerPhotos.length || supervisorPhotos.length;

                  if (!hasAny) return null;
                  return (
                    <div
                      className="p-3 rounded-lg mb-4"
                      style={{
                        background: `${themeConfig.info}10`,
                        border: `1px solid ${themeConfig.info}30`,
                      }}
                    >
                      <div
                        className="text-sm font-semibold mb-2"
                        style={{ color: themeConfig.textPrimary }}
                      >
                        Reviewer Photos
                      </div>

                      {checkerPhotos.length > 0 && (
                        <>
                          <div
                            className="text-xs mb-1"
                            style={{ color: themeConfig.textSecondary }}
                          >
                            Checker
                          </div>
                          <ImageStrip
                            sources={checkerPhotos}
                            themeConfig={themeConfig}
                          />
                        </>
                      )}

                      {supervisorPhotos.length > 0 && (
                        <>
                          <div
                            className="text-xs mt-3 mb-1"
                            style={{ color: themeConfig.textSecondary }}
                          >
                            Supervisor
                          </div>
                          <ImageStrip
                            sources={supervisorPhotos}
                            themeConfig={themeConfig}
                          />
                        </>
                      )}
                    </div>
                  );
                })()}

              <button
                onClick={() => {
                  setSelectedItemForHistory(item);
                  setShowHistoryModal(true);
                }}
                className="text-xs px-2 py-1 rounded-full hover:scale-105 transition-all cursor-pointer"
                style={{
                  background: `${themeConfig.accent}20`,
                  color: themeConfig.accent,
                  border: `1px solid ${themeConfig.accent}40`,
                }}
              >
                📋 History ({item.latest_submission?.attempts || 1} attempts)
              </button>
            </div>

            {/* {item.description && (
                            <p className="text-sm" style={{ color: themeConfig.textSecondary }}>
                                {item.description}
                            </p>
                        )} */}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setSelectedItemForMaker(item);
                setMakerRemark("");
                setMakerPhotos([]);
                setShowMakerModal(true);
              }}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: themeConfig.accent,
                color: "white",
              }}
            >
              Complete Work
            </button>
          </div>
        </div>

        {/* Unified submission preview for all roles (maker/checker/supervisor) */}
        {["CHECKER", "SUPERVISOR", "MAKER"].includes(userRole) &&
          (item.submissions?.length > 0 || item.latest_submission) &&
          (() => {
            const latest =
              item.latest_submission ||
              [...(item.submissions || [])].sort(
                (a, b) => new Date(b.created_at) - new Date(a.created_at),
              )[0];

            if (!latest) return null;

            // New multi-image arrays coming from your API
            const makerArr = latest?.maker_media_multi || [];
            const checkerArr = latest?.checker_media_multi || [];
            const supervisorArr = latest?.supervisor_media_multi || [];

            // Backward-compat single fields
            const singles = [
              latest?.maker_media,
              latest?.media,
              latest?.photo,
              latest?.image,
            ].filter(Boolean);

            const hasImages =
              makerArr.length ||
              checkerArr.length ||
              supervisorArr.length ||
              singles.length;
            const hasRemarks =
              !!latest?.maker_remarks ||
              !!latest?.checker_remarks ||
              !!latest?.check_remark ||
              !!latest?.supervisor_remarks;

            if (!hasImages && !hasRemarks) return null;

            return (
              <div
                className="mb-4 p-3 rounded-lg"
                style={{
                  background: `${themeConfig.success}10`,
                  border: `1px solid ${themeConfig.success}30`,
                }}
              >
                <div
                  className="text-sm font-semibold mb-2"
                  style={{ color: themeConfig.textPrimary }}
                >
                  Latest Submission
                </div>

                {/* Remarks grouped by role */}
                <div
                  className="text-sm mb-2"
                  style={{ color: themeConfig.textPrimary }}
                >
                  {latest?.maker_remarks && (
                    <div>Maker: {latest.maker_remarks}</div>
                  )}
                  {(latest?.checker_remarks || latest?.check_remark) && (
                    <div>
                      Checker: {latest.checker_remarks || latest.check_remark}
                    </div>
                  )}
                  {latest?.supervisor_remarks && (
                    <div>Supervisor: {latest.supervisor_remarks}</div>
                  )}
                </div>

                {/* Multi-images grouped by role */}
                {makerArr.length > 0 && (
                  <>
                    <div
                      className="text-xs mb-1"
                      style={{ color: themeConfig.textSecondary }}
                    >
                      Maker Photos
                    </div>
                    <ImageStrip sources={makerArr} themeConfig={themeConfig} />
                  </>
                )}
                {checkerArr.length > 0 && (
                  <>
                    <div
                      className="text-xs mt-3 mb-1"
                      style={{ color: themeConfig.textSecondary }}
                    >
                      Checker Photos
                    </div>
                    <ImageStrip
                      sources={checkerArr}
                      themeConfig={themeConfig}
                    />
                  </>
                )}
                {supervisorArr.length > 0 && (
                  <>
                    <div
                      className="text-xs mt-3 mb-1"
                      style={{ color: themeConfig.textSecondary }}
                    >
                      Supervisor Photos
                    </div>
                    <ImageStrip
                      sources={supervisorArr}
                      themeConfig={themeConfig}
                    />
                  </>
                )}

                {/* Single-value fallback (old data) */}
                {!makerArr.length &&
                  !checkerArr.length &&
                  !supervisorArr.length &&
                  singles.length > 0 && (
                    <ImageStrip sources={singles} themeConfig={themeConfig} />
                  )}
              </div>
            );
          })()}
      </div>
    );
  };

  // History Modal Component
  const HistoryModal = () => {
    if (!showHistoryModal || !selectedItemForHistory) return null;

    const submission = selectedItemForHistory.latest_submission;
    const attempts = submission?.attempts || 1;

    // Create timeline based on submission data
    const getTimeline = () => {
      const timeline = [];

      for (let i = 1; i <= attempts; i++) {
        if (i < attempts) {
          // Previous attempts (completed but rejected)
          timeline.push({
            attempt: i,
            status: "MAKER → SUPERVISOR (rejected)",
            icon: "❌",
            color: themeConfig.error,
            description: "Work completed but rejected by supervisor",
          });
        } else {
          // Current attempt
          const currentStatus =
            submission?.status === "created"
              ? "MAKER (in progress)"
              : submission?.supervisor_id
                ? "SUPERVISOR (reviewing)"
                : "MAKER (current)";

          timeline.push({
            attempt: i,
            status: currentStatus,
            icon: "🔄",
            color: themeConfig.warning,
            description: "Current work in progress",
          });
        }
      }

      return timeline;
    };

    const timeline = getTimeline();

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div
          className="max-w-2xl w-full max-h-[80vh] overflow-y-auto rounded-xl shadow-2xl"
          style={{ background: themeConfig.cardBg }}
        >
          {/* Modal Header */}
          <div
            className="sticky top-0 p-6 border-b"
            style={{
              background: themeConfig.headerBg,
              borderColor: themeConfig.border,
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3
                  className="text-xl font-bold"
                  style={{ color: themeConfig.textPrimary }}
                >
                  Work History
                </h3>
                <p
                  className="text-sm mt-1"
                  style={{ color: themeConfig.textSecondary }}
                >
                  {selectedItemForHistory.title}
                </p>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="p-2 rounded-lg hover:bg-opacity-80 transition-all"
                style={{
                  background: `${themeConfig.error}20`,
                  color: themeConfig.error,
                }}
              >
                ✕
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Item Details */}
            <div
              className="p-4 rounded-xl mb-6"
              style={{
                background: `${themeConfig.accent}10`,
                border: `1px solid ${themeConfig.accent}30`,
              }}
            >
              <h4
                className="font-medium mb-2"
                style={{ color: themeConfig.textPrimary }}
              >
                📋 Item Details
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span style={{ color: themeConfig.textSecondary }}>
                    Item ID:
                  </span>
                  <span
                    className="ml-2 font-mono"
                    style={{ color: themeConfig.textPrimary }}
                  >
                    {selectedItemForHistory.id}
                  </span>
                </div>
                <div>
                  <span style={{ color: themeConfig.textSecondary }}>
                    Photo Required:
                  </span>
                  <span
                    className="ml-2"
                    style={{ color: themeConfig.textPrimary }}
                  >
                    {selectedItemForHistory.photo_required ? "Yes" : "No"}
                  </span>
                </div>
                <div>
                  <span style={{ color: themeConfig.textSecondary }}>
                    Current Status:
                  </span>
                  <span
                    className="ml-2"
                    style={{ color: themeConfig.textPrimary }}
                  >
                    {selectedItemForHistory.status}
                  </span>
                </div>
                <div>
                  <span style={{ color: themeConfig.textSecondary }}>
                    Total Attempts:
                  </span>
                  <span
                    className="ml-2 font-bold"
                    style={{ color: themeConfig.accent }}
                  >
                    {attempts}
                  </span>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div
              className="p-4 rounded-xl"
              style={{
                background: `${themeConfig.textSecondary}08`,
                border: `1px solid ${themeConfig.textSecondary}20`,
              }}
            >
              <h4
                className="font-medium mb-4"
                style={{ color: themeConfig.textPrimary }}
              >
                🕒 Work Timeline
              </h4>

              <div className="space-y-4">
                {timeline.map((entry, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                      style={{ background: entry.color, color: "white" }}
                    >
                      {entry.attempt}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{entry.icon}</span>
                        <span
                          className="font-medium"
                          style={{ color: themeConfig.textPrimary }}
                        >
                          Attempt {entry.attempt}: {entry.status}
                        </span>
                      </div>
                      <p
                        className="text-sm"
                        style={{ color: themeConfig.textSecondary }}
                      >
                        {entry.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Submission Details */}
            {submission && (
              <div
                className="mt-6 p-4 rounded-xl"
                style={{
                  background: `${themeConfig.success}10`,
                  border: `1px solid ${themeConfig.success}30`,
                }}
              >
                <h4
                  className="font-medium mb-4"
                  style={{ color: themeConfig.textPrimary }}
                >
                  📝 Current Submission Details
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span style={{ color: themeConfig.textSecondary }}>
                      Submission ID:
                    </span>
                    <span
                      className="ml-2 font-mono"
                      style={{ color: themeConfig.textPrimary }}
                    >
                      {submission.id}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: themeConfig.textSecondary }}>
                      Created:
                    </span>
                    <span
                      className="ml-2"
                      style={{ color: themeConfig.textPrimary }}
                    >
                      {new Date(submission.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: themeConfig.textSecondary }}>
                      MAKER ID:
                    </span>
                    <span
                      className="ml-2"
                      style={{ color: themeConfig.textPrimary }}
                    >
                      {submission.maker_id || "Not assigned"}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: themeConfig.textSecondary }}>
                      CHECKER ID:
                    </span>
                    <span
                      className="ml-2"
                      style={{ color: themeConfig.textPrimary }}
                    >
                      {submission.checker_id || "Not assigned"}
                    </span>
                  </div>
                </div>

                {submission.maker_remarks && (
                  <div className="mt-4">
                    <span
                      className="font-medium"
                      style={{ color: themeConfig.textSecondary }}
                    >
                      MAKER Remarks:
                    </span>
                    <p
                      className="mt-1 p-3 rounded-lg"
                      style={{
                        background: themeConfig.cardBg,
                        color: themeConfig.textPrimary,
                        border: `1px solid ${themeConfig.border}`,
                      }}
                    >
                      {submission.maker_remarks}
                    </p>
                  </div>
                )}

                {submission.supervisor_remarks && (
                  <div className="mt-4">
                    <span
                      className="font-medium"
                      style={{ color: themeConfig.textSecondary }}
                    >
                      SUPERVISOR Remarks:
                    </span>
                    <p
                      className="mt-1 p-3 rounded-lg"
                      style={{
                        background: themeConfig.cardBg,
                        color: themeConfig.textPrimary,
                        border: `1px solid ${themeConfig.border}`,
                      }}
                    >
                      {submission.supervisor_remarks}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const InspectionItem = React.memo(
    ({ item, itemIndex, userRole, themeConfig }) => {
      const [isItemExpanded, setIsItemExpanded] = useState(false);
      const [selectedOptionId, setSelectedOptionId] = useState(null);
      const [remark, setRemark] = useState("");
      const [isSubmitting, setIsSubmitting] = useState(false);
      const [photos, setPhotos] = useState([]);
      const [showError, setShowError] = useState(false);

      // ---------- Latest maker submission (your existing logic) ----------
      const latestMakerSubmission = React.useMemo(() => {
        const subs = Array.isArray(item.submissions) ? item.submissions : [];
        if (!subs.length) return null;

        const makerish = subs.filter(
          (s) => s.maker_id || s.maker_remarks || s.maker_media || s.maker_at,
        );
        const pickFrom = makerish.length ? makerish : subs.slice();

        pickFrom.sort((a, b) => {
          const aA = a.attempts ?? 0;
          const bA = b.attempts ?? 0;
          if (aA !== bA) return aA - bA;
          const ad = new Date(a.created_at || 0).getTime();
          const bd = new Date(b.created_at || 0).getTime();
          return ad - bd;
        });

        return pickFrom[pickFrom.length - 1] || null;
      }, [item.submissions]);

      // ---------- Role helpers ----------
      const isMaker = userRole === "MAKER";
      const isChecker = userRole === "CHECKER";
      const isSupervisor = userRole === "SUPERVISOR";

      const isPhotoRequired = item.photo_required;

      // 🔥 KEY: Maker-pending state → only photo + remark + submit
      const isMakerPending =
        isMaker &&
        (item.status === "pending_for_maker" ||
          item.status === "tetmpory_Maker"); // add more statuses here if needed

      // Check if this role can make Yes/No type decisions
      // 👉 Maker can NOT make decisions when pending_for_maker
      //   const canMakeDecisions =
      //     isChecker ||
      //     isSupervisor ||
      //     (isMaker && !isMakerPending);
      const canMakeDecisions = isChecker || isSupervisor || isMaker;

      // Handle option selection
      const handleOptionSelect = (optionId) => {
        if (!canMakeDecisions) return;
        setSelectedOptionId(optionId);
      };

      // Validation logic
      const validate = () => {
        if (isMaker) {
          if (!remark.trim()) return "Remarks are required for Maker";
          if (isPhotoRequired && photos.length === 0)
            return "Photo is required for Maker";
        }
        if (isChecker) {
          if (isPhotoRequired && photos.length === 0)
            return "Photo is required for Checker";
        }
        if (isSupervisor) {
          if (isPhotoRequired && photos.length === 0)
            return "Photo is required for Supervisor";
        }
        return null;
      };

      // Submit decision to API
      const debouncedSubmitDecision = useDebounce(async () => {
        if (!canMakeDecisions) {
          toast.error("You don't have permission to make decisions", {
            style: {
              background: themeConfig.warning,
              color: "white",
              borderRadius: "12px",
            },
          });
          return;
        }
        const error = validate();
        if (error) {
          setShowError(true);
          toast.error(error, {
            style: {
              background: themeConfig.error,
              color: "white",
              borderRadius: "12px",
            },
          });
          return;
        }
        setShowError(false);
        setIsSubmitting(true);
        setLoadingStates((prev) => new Set([...prev, item.id]));
        try {
          const token = localStorage.getItem("ACCESS_TOKEN");

          let apiEndpoint, formData;
          if (isMaker) {
            apiEndpoint = MAKER_DONE_API;
            formData = new FormData();
            formData.append("checklist_item_id", item.id);
            formData.append("maker_remark", remark);
            // MULTI:
            appendFiles(formData, "maker_media_multi", photos);
          } else if (isChecker) {
            apiEndpoint = VERIFY_ITEM_API;
            formData = new FormData();
            formData.append("checklist_item_id", item.id);
            formData.append("role", "checker");
            if (selectedOptionId)
              formData.append("option_id", selectedOptionId);
            if (remark) formData.append("check_remark", remark);
            // MULTI:
            appendFiles(formData, "checker_media_multi", photos);
          } else if (isSupervisor) {
            apiEndpoint = VERIFY_ITEM_API;
            formData = new FormData();
            formData.append("checklist_item_id", item.id);
            formData.append("role", "supervisor");
            if (selectedOptionId)
              formData.append("option_id", selectedOptionId);
            // Use whichever your API expects:
            formData.append("supervisor_remarks", remark); // If your API expects check_remark instead, swap here.
            // MULTI:
            appendFiles(formData, "supervisor_media_multi", photos);
          }

          const response = await checklistInstance.patch(
            apiEndpoint,
            formData,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "multipart/form-data",
              },
            },
          );
          if (response.status === 200) {
            toast.success("✅ Submitted successfully!", {
              duration: 4000,
              style: {
                background: themeConfig.success,
                color: "white",
                borderRadius: "12px",
                padding: "16px",
              },
            });
            setSelectedOptionId(null);
            setRemark("");
            setPhotos([]);
            // Remove item from UI as before
            const currentDataSource =
              activeWorkTab === "available-work"
                ? "available_for_me"
                : "assigned_to_me";
            setChecklistData((prevData) =>
              prevData.map((roomData) => ({
                ...roomData,
                [currentDataSource]:
                  roomData[currentDataSource]?.map((checklist) => ({
                    ...checklist,
                    items:
                      checklist.items?.filter(
                        (checklistItem) => checklistItem.id !== item.id,
                      ) || [],
                  })) || [],
              })),
            );
          }
        } catch (err) {
          toast.error(
            "❌ " + (err.response?.data?.detail || "Failed to submit"),
            {
              duration: 4000,
              style: {
                background: themeConfig.error,
                color: "white",
                borderRadius: "12px",
                padding: "16px",
              },
            },
          );
        } finally {
          setIsSubmitting(false);
          setLoadingStates((prev) => {
            const newSet = new Set(prev);
            newSet.delete(item.id);
            return newSet;
          });
        }
      }, 300);

      return (
        <div
          className="border rounded-xl overflow-hidden transition-all duration-300 hover:shadow-md"
          style={{
            background: themeConfig.headerBg,
            borderColor: themeConfig.border,
            boxShadow: isItemExpanded
              ? `0 4px 12px ${themeConfig.accent}10`
              : "none",
          }}
        >
          {/* Item Header - Clickable */}
          <div
            className="p-4 cursor-pointer transition-all duration-200 hover:bg-opacity-80"
            onClick={() => setIsItemExpanded(!isItemExpanded)}
            style={{
              background: isItemExpanded
                ? `${themeConfig.accent}08`
                : "transparent",
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  {/* Bulk selection checkbox for CHECKER only */}
                  {userRole === "CHECKER" && (
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedItemsForBulk.has(item.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleItemSelection(item.id);
                        }}
                        disabled={bulkSubmitting}
                        className="w-4 h-4 rounded border-2 focus:ring-2 cursor-pointer disabled:opacity-50"
                        style={{
                          accentColor: themeConfig.accent,
                          borderColor: themeConfig.border,
                        }}
                      />
                    </div>
                  )}
                  <span
                    className="text-sm font-bold px-2 py-1 rounded-full"
                    style={{
                      background: `${themeConfig.accent}20`,
                      color: themeConfig.accent,
                    }}
                  >
                    #{itemIndex + 1}
                  </span>
                  <h6
                    className="font-semibold text-base"
                    style={{ color: themeConfig.textPrimary }}
                  >
                    {item.title}
                  </h6>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  <Tooltip
                    text={`Current status: ${item.status.replace("_", " ")}`}
                  >
                    {getStatusBadge(item.status)}
                  </Tooltip>

                  {item.photo_required && (
                    <Tooltip text="This item requires photo documentation">
                      <span
                        className="px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1"
                        style={{
                          background: `${themeConfig.accent}20`,
                          color: themeConfig.accent,
                        }}
                      >
                        <span>📷</span>
                        Photo Required
                      </span>
                    </Tooltip>
                  )}

                  <span
                    className="text-xs px-2 py-1 rounded-full"
                    style={{
                      background: `${themeConfig.textSecondary}15`,
                      color: themeConfig.textSecondary,
                    }}
                  >
                    {item.options?.length || 0} Options
                  </span>

                  {canMakeDecisions && (
                    <span
                      className="text-xs px-2 py-1 rounded-full font-medium"
                      style={{
                        background: `${themeConfig.success}15`,
                        color: themeConfig.success,
                      }}
                    ></span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* SUPERVISOR Review Button - Item Level */}
                {userRole === "SUPERVISOR" &&
                  (item.status === "pending_for_supervisor" ||
                    latestMakerSubmission) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedItemForSupervisorReview(item);
                        setShowSupervisorReviewModal(true);
                      }}
                      className="px-3 py-1 rounded-lg text-sm font-medium transition-all mr-2"
                      style={{
                        background: themeConfig.warning,
                        color: "white",
                      }}
                    >
                      Review MAKER Work
                    </button>
                  )}
                {/* ✅ Do NOT show Yes/No options if Maker & pending_for_maker */}
                {/* ✅ Only CHECKER / SUPERVISOR see quick Yes/No options */}
                {(isChecker || isSupervisor) && item.options?.length > 0 && (
                  <div className="flex gap-2 mt-2">
                    {item.options.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => handleOptionSelect(opt.id)}
                        className={`px-3 py-1 rounded-lg border text-sm ${
                          selectedOptionId === opt.id ? "font-semibold" : ""
                        }`}
                      >
                        {opt.label || opt.choice}
                      </button>
                    ))}
                  </div>
                )}

                <span
                  className={`text-lg transition-transform duration-200 ${isItemExpanded ? "rotate-90" : ""}`}
                  style={{ color: themeConfig.accent }}
                >
                  ▶
                </span>
              </div>
            </div>
          </div>

          {/* Expanded Item Details */}
          <div
            className={`transition-all duration-300 ease-in-out ${
              isItemExpanded
                ? "max-h-[2000px] opacity-100"
                : "max-h-0 opacity-0 overflow-hidden"
            }`}
          >
            <div className="px-4 pb-4">
              {(userRole === "CHECKER" || userRole === "SUPERVISOR") &&
                latestMakerSubmission && (
                  <div
                    className="p-4 rounded-xl mb-4"
                    style={{
                      background: `${themeConfig.success}10`,
                      border: `1px solid ${themeConfig.success}30`,
                    }}
                  >
                    <h6
                      className="font-medium mb-3"
                      style={{ color: themeConfig.textPrimary }}
                    >
                      🔨 Latest Maker Submission
                    </h6>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      {/* Remarks */}
                      <div>
                        <div style={{ color: themeConfig.textSecondary }}>
                          Remarks:
                        </div>
                        <div
                          className="mt-1 p-3 rounded-lg border"
                          style={{
                            background: themeConfig.cardBg,
                            borderColor: themeConfig.border,
                            color: themeConfig.textPrimary,
                          }}
                        >
                          {latestMakerSubmission.maker_remarks || "—"}
                        </div>
                      </div>

                      {/* Photo */}
                      <div>
                        <div style={{ color: themeConfig.textSecondary }}>
                          Photo:
                        </div>
                        <div className="mt-1">
                          {latestMakerSubmission.maker_media ? (
                            <img
                              src={
                                latestMakerSubmission.maker_media.startsWith(
                                  "http",
                                )
                                  ? latestMakerSubmission.maker_media
                                  : `https://konstruct.world${latestMakerSubmission.maker_media}`
                              }
                              alt="Maker submission"
                              className="w-full max-w-md h-40 object-cover rounded-lg border cursor-pointer"
                              style={{ borderColor: themeConfig.success }}
                              onClick={() =>
                                window.open(
                                  latestMakerSubmission.maker_media.startsWith(
                                    "http",
                                  )
                                    ? latestMakerSubmission.maker_media
                                    : `https://konstruct.world${latestMakerSubmission.maker_media}`,
                                  "_blank",
                                )
                              }
                              onError={(e) =>
                                (e.currentTarget.style.display = "none")
                              }
                            />
                          ) : (
                            <span style={{ color: themeConfig.textSecondary }}>
                              No photo
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div
                      className="text-xs mt-3"
                      style={{ color: themeConfig.textSecondary }}
                    >
                      Attempt: {latestMakerSubmission.attempts ?? 1}
                      {" • "}
                      Submitted:{" "}
                      {new Date(
                        latestMakerSubmission.maker_at ||
                          latestMakerSubmission.created_at,
                      ).toLocaleString()}
                    </div>
                  </div>
                )}

              {/* Unified submission preview for all roles (maker/checker/supervisor) */}
              {["CHECKER", "SUPERVISOR", "MAKER"].includes(userRole) &&
                (item.submissions?.length > 0 || item.latest_submission) &&
                (() => {
                  const latest =
                    item.latest_submission ||
                    [...(item.submissions || [])].sort(
                      (a, b) => new Date(b.created_at) - new Date(a.created_at),
                    )[0];

                  const makerArr = latest?.maker_media_multi || [];
                  const checkerArr = latest?.checker_media_multi || [];
                  const supervisorArr = latest?.supervisor_media_multi || [];

                  // single-value fallbacks for older data
                  const singles = [
                    latest?.maker_media,
                    latest?.media,
                    latest?.photo,
                    latest?.image,
                  ].filter(Boolean);

                  const hasImages =
                    makerArr.length ||
                    checkerArr.length ||
                    supervisorArr.length ||
                    singles.length;
                  const hasRemarks =
                    !!latest?.maker_remarks ||
                    !!latest?.checker_remarks ||
                    !!latest?.check_remark ||
                    !!latest?.supervisor_remarks;

                  // If you prefer to hide the card entirely when no images/remarks:
                  if (!hasImages && !hasRemarks) return null;

                  return (
                    <div
                      className="mb-4 p-3 rounded-lg"
                      style={{
                        background: `${themeConfig.success}10`,
                        border: `1px solid ${themeConfig.success}30`,
                      }}
                    >
                      <div
                        className="text-sm font-semibold mb-2"
                        style={{ color: themeConfig.textPrimary }}
                      >
                        Latest Submission
                      </div>

                      {/* Remarks (maker/checker/supervisor) */}
                      <div
                        className="text-sm mb-2"
                        style={{ color: themeConfig.textPrimary }}
                      >
                        {latest?.maker_remarks && (
                          <div>Maker: {latest.maker_remarks}</div>
                        )}
                        {(latest?.checker_remarks || latest?.check_remark) && (
                          <div>
                            Checker:{" "}
                            {latest.checker_remarks || latest.check_remark}
                          </div>
                        )}
                        {latest?.supervisor_remarks && (
                          <div>Supervisor: {latest.supervisor_remarks}</div>
                        )}
                      </div>

                      {/* Images grouped by role */}
                      {makerArr.length > 0 && (
                        <>
                          <div
                            className="text-xs mb-1"
                            style={{ color: themeConfig.textSecondary }}
                          >
                            Maker Photos
                          </div>
                          <ImageStrip
                            sources={makerArr}
                            themeConfig={themeConfig}
                          />
                        </>
                      )}
                      {checkerArr.length > 0 && (
                        <>
                          <div
                            className="text-xs mt-3 mb-1"
                            style={{ color: themeConfig.textSecondary }}
                          >
                            Checker Photos
                          </div>
                          <ImageStrip
                            sources={checkerArr}
                            themeConfig={themeConfig}
                          />
                        </>
                      )}
                      {supervisorArr.length > 0 && (
                        <>
                          <div
                            className="text-xs mt-3 mb-1"
                            style={{ color: themeConfig.textSecondary }}
                          >
                            Supervisor Photos
                          </div>
                          <ImageStrip
                            sources={supervisorArr}
                            themeConfig={themeConfig}
                          />
                        </>
                      )}

                      {/* Single-value fallback (backward compatibility) */}
                      {!makerArr.length &&
                        !checkerArr.length &&
                        !supervisorArr.length &&
                        singles.length > 0 && (
                          <ImageStrip
                            sources={singles}
                            themeConfig={themeConfig}
                          />
                        )}
                    </div>
                  );
                })()}

              {/* {item.options && item.options.length > 0 && ( */}
              {/* {!isMakerPending && !isMaker && item.options && item.options.length > 0 && ( */}
              {(isChecker || isSupervisor) && item.options?.length > 0 && (
                <div>
                  <h6
                    className="font-semibold text-sm mb-3 flex items-center gap-2"
                    style={{ color: themeConfig.textPrimary }}
                  >
                    <span>⚡</span>
                    Answer Options ({item.options.length})
                    {canMakeDecisions && (
                      <span
                        className="text-xs px-2 py-1 rounded-full"
                        style={{
                          background: `${themeConfig.accent}15`,
                          color: themeConfig.accent,
                        }}
                      >
                        Click to Select
                      </span>
                    )}
                  </h6>

                  <div className="grid grid-cols-1 gap-3">
                    {item.options.map((option, optionIndex) => {
                      const isPassOption = option.choice === "P";
                      const isSelected = selectedOptionId === option.id;

                      // Enhanced color scheme for selected/unselected states
                      const optionBgColor = isSelected
                        ? isPassOption
                          ? `${themeConfig.passColor}25`
                          : `${themeConfig.failColor}25`
                        : isPassOption
                          ? `${themeConfig.passColor}12`
                          : `${themeConfig.failColor}12`;

                      const optionBorderColor = isSelected
                        ? isPassOption
                          ? `${themeConfig.passColor}80`
                          : `${themeConfig.failColor}80`
                        : isPassOption
                          ? `${themeConfig.passColor}40`
                          : `${themeConfig.failColor}40`;

                      const optionTextColor = isPassOption
                        ? themeConfig.passColor
                        : themeConfig.failColor;
                      const statusBgColor = isPassOption
                        ? themeConfig.passColor
                        : themeConfig.failColor;
                      return (
                        <div
                          key={option.id}
                          className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                            canMakeDecisions
                              ? "cursor-pointer hover:shadow-md hover:scale-[1.02] focus:outline-none focus:ring-2"
                              : "hover:shadow-sm hover:scale-[1.01]"
                          } ${isSelected ? "shadow-lg" : ""}`}
                          style={{
                            background: optionBgColor,
                            borderColor: optionBorderColor,
                            transform: isSelected ? "scale(1.02)" : "scale(1)",
                            focusRingColor: themeConfig.accent,
                          }}
                          onClick={() => handleOptionSelect(option.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              handleOptionSelect(option.id);
                            }
                          }}
                          tabIndex={canMakeDecisions ? 0 : -1}
                          role="button"
                          aria-pressed={isSelected}
                        >
                          <div className="flex items-center gap-3">
                            {/* Interactive/Static Checkbox */}
                            <div className="flex-shrink-0">
                              <div
                                className="w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200"
                                style={{
                                  borderColor: optionTextColor,
                                  background: isSelected
                                    ? optionTextColor
                                    : isPassOption
                                      ? `${themeConfig.accent}15`
                                      : `${themeConfig.textSecondary}15`,
                                }}
                              >
                                {isSelected ? (
                                  <svg
                                    width="12"
                                    height="12"
                                    viewBox="0 0 24 24"
                                    fill="white"
                                  >
                                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                  </svg>
                                ) : (
                                  <div
                                    className="w-2.5 h-2.5 rounded-sm"
                                    style={{ background: optionTextColor }}
                                  ></div>
                                )}
                              </div>
                            </div>

                            {/* Option Content */}
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <span
                                  className="font-semibold text-sm"
                                  style={{ color: optionTextColor }}
                                >
                                  Option {optionIndex + 1}: {option.name}
                                </span>

                                <div className="flex items-center gap-2">
                                  <span
                                    className="text-xs px-3 py-1 rounded-full font-bold tracking-wide"
                                    style={{
                                      background: statusBgColor,
                                      color: "white",
                                      boxShadow: `0 2px 8px ${statusBgColor}30`,
                                    }}
                                  >
                                    {userRole === "SUPERVISOR"
                                      ? isPassOption
                                        ? "✓ APPROVE"
                                        : "✗ ?REJECT"
                                      : isPassOption
                                        ? "✓ PASS"
                                        : "✗ FAIL"}
                                  </span>
                                  {isSelected && (
                                    <span
                                      className="text-xs px-2 py-1 rounded-full font-bold"
                                      style={{
                                        background: themeConfig.success,
                                        color: "white",
                                      }}
                                    >
                                      SELECTED
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Option Description if available */}
                              {option.description && (
                                <p
                                  className="text-xs mt-1 opacity-75 leading-relaxed"
                                  style={{ color: optionTextColor }}
                                >
                                  {option.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Decision Making Section for Active Roles */}
              {canMakeDecisions && (
                <div
                  className="mt-4 p-4 rounded-xl"
                  style={{
                    background: `${themeConfig.accent}08`,
                    border: `1px solid ${themeConfig.accent}30`,
                  }}
                >
                  {/* Only show decision section for MAKER */}
                  {userRole === "MAKER" && (
                    <>
                      <h6
                        className="font-medium text-sm mb-3 flex items-center gap-2"
                        style={{ color: themeConfig.textPrimary }}
                      >
                        <span>💬</span>
                        MAKER Submission
                      </h6>

                      <div
                        className="mb-4 p-3 rounded-lg"
                        style={{
                          background: `${themeConfig.info}15`,
                          border: `1px solid ${themeConfig.info}40`,
                        }}
                      >
                        <p
                          className="text-sm"
                          style={{ color: themeConfig.textPrimary }}
                        >
                          As a MAKER, you can mark this item as completed. No
                          option selection required - just add remarks and
                          submit for review.
                        </p>
                      </div>

                      {/* Remark Input - Only for MAKER */}
                      <div className="mb-4">
                        <label
                          className="block text-xs font-medium mb-2"
                          style={{ color: themeConfig.textSecondary }}
                        >
                          Remarks {isMaker ? "(Required)" : "(Optional)"}
                        </label>
                        <textarea
                          value={remark}
                          onChange={(e) => setRemark(e.target.value)}
                          required={isMaker}
                          className="w-full p-3 rounded-lg border-2 text-sm"
                          style={{
                            background: themeConfig.cardBg,
                            borderColor: `${themeConfig.border}60`,
                            color: themeConfig.textPrimary,
                            minHeight: "80px",
                          }}
                          rows="3"
                        />
                        {showError && isMaker && !remark && (
                          <span className="text-xs text-red-500">
                            Remarks required
                          </span>
                        )}
                      </div>
                      <div className="mb-4">
                        <label
                          className="block text-xs font-medium mb-2"
                          style={{ color: themeConfig.textSecondary }}
                        >
                          Photo{" "}
                          {(isMaker || isSupervisor) && isPhotoRequired
                            ? "(Required)"
                            : "(Optional)"}
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(e) => {
                            const picked = Array.from(e.target.files || []);
                            setPhotos((prev) => mergeFiles(prev, picked));
                            e.target.value = ""; // allow re-selecting same files
                          }}
                          required={isMaker && isPhotoRequired}
                          className="w-full p-3 rounded-lg border-2 text-sm"
                          style={{
                            background: themeConfig.cardBg,
                            borderColor: `${themeConfig.border}60`,
                            color: themeConfig.textPrimary,
                          }}
                        />
                        {photos.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {photos.map((f, i) => (
                              <img
                                key={i}
                                src={URL.createObjectURL(f)}
                                alt={`preview-${i}`}
                                className="w-24 h-16 object-cover rounded border"
                              />
                            ))}
                          </div>
                        )}

                        {showError &&
                          ((isMaker &&
                            isPhotoRequired &&
                            photos.length === 0) ||
                            (isChecker &&
                              isPhotoRequired &&
                              photos.length === 0) ||
                            (isSupervisor &&
                              isPhotoRequired &&
                              photos.length === 0)) && (
                            <span className="text-xs text-red-500">
                              Photo required
                            </span>
                          )}
                      </div>
                    </>
                  )}
                  {/* Checker/Supervisor remark & optional photo */}
                  {(userRole === "CHECKER" || userRole === "SUPERVISOR") && (
                    <>
                      <div className="mb-4">
                        <label
                          className="block text-xs font-medium mb-2"
                          style={{ color: themeConfig.textSecondary }}
                        >
                          {userRole === "CHECKER"
                            ? "Inspector Remarks"
                            : "Supervisor Remarks"}
                          {userRole === "SUPERVISOR"
                            ? " (required)"
                            : " (optional)"}
                        </label>
                        <textarea
                          value={remark}
                          onChange={(e) => setRemark(e.target.value)}
                          className="w-full p-3 rounded-lg border-2 text-sm"
                          style={{
                            background: themeConfig.cardBg,
                            borderColor: `${themeConfig.border}60`,
                            color: themeConfig.textPrimary,
                            minHeight: "80px",
                          }}
                          rows="3"
                        />
                      </div>

                      <div className="mb-4">
                        <label
                          className="block text-xs font-medium mb-2"
                          style={{ color: themeConfig.textSecondary }}
                        >
                          Attach Photo{" "}
                          {userRole === "SUPERVISOR" && item.photo_required
                            ? "(required)"
                            : "(optional)"}
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(e) => {
                            const picked = Array.from(e.target.files || []);
                            setPhotos((prev) => mergeFiles(prev, picked));
                            e.target.value = "";
                          }}
                          className="w-full p-3 rounded-lg border-2 text-sm"
                          style={{
                            background: themeConfig.cardBg,
                            borderColor: `${themeConfig.border}60`,
                            color: themeConfig.textPrimary,
                          }}
                        />
                        {photos.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {photos.map((f, i) => (
                              <img
                                key={i}
                                src={URL.createObjectURL(f)}
                                alt={`preview-${i}`}
                                className="w-24 h-16 object-cover rounded border"
                                style={{ borderColor: themeConfig.border }}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {/* Submit Decision Button */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {userRole !== "MAKER" && selectedOptionId && (
                        <span
                          className="text-xs"
                          style={{ color: themeConfig.textSecondary }}
                        >
                          Selected Option ID: {selectedOptionId}
                        </span>
                      )}
                      {userRole === "MAKER" && (
                        <span
                          className="text-xs"
                          style={{ color: themeConfig.textSecondary }}
                        >
                          Item ID: {item.id}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={debouncedSubmitDecision}
                      disabled={
                        (userRole !== "MAKER" && !selectedOptionId) ||
                        isSubmitting ||
                        bulkSubmitting ||
                        loadingStates.has(item.id)
                      }
                      className={`
      px-6 py-2 rounded-lg font-medium text-sm transition-all duration-300 transform
      ${
        (userRole !== "MAKER" && !selectedOptionId) ||
        isSubmitting ||
        bulkSubmitting
          ? "opacity-50 cursor-not-allowed"
          : "hover:scale-105 hover:shadow-lg active:scale-95"
      }
    `}
                      style={{
                        background:
                          (userRole !== "MAKER" && !selectedOptionId) ||
                          isSubmitting
                            ? `${themeConfig.textSecondary}60`
                            : userRole === "MAKER"
                              ? `linear-gradient(135deg, ${themeConfig.accent}, ${themeConfig.accent}dd)`
                              : `linear-gradient(135deg, ${themeConfig.success}, ${themeConfig.success}dd)`,
                        color: "white",
                        border: `2px solid ${
                          (userRole !== "MAKER" && !selectedOptionId) ||
                          isSubmitting
                            ? themeConfig.textSecondary
                            : userRole === "MAKER"
                              ? themeConfig.accent
                              : themeConfig.success
                        }`,
                      }}
                    >
                      {isSubmitting ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Submitting...</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span>{userRole === "MAKER" ? "✅" : "🔍"}</span>
                          <span>
                            {userRole === "MAKER"
                              ? "Mark as Done"
                              : `Submit ${userRole} Decision`}
                          </span>
                        </div>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Additional Item Metadata */}
              <div
                className="mt-4 p-3 rounded-xl"
                style={{
                  background: `${themeConfig.textSecondary}08`,
                  border: `1px solid ${themeConfig.textSecondary}15`,
                }}
              >
                <h6
                  className="font-medium text-xs mb-2 flex items-center gap-2"
                  style={{ color: themeConfig.textPrimary }}
                >
                  <span>ℹ️</span>
                  Item Details
                </h6>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  <div>
                    <span style={{ color: themeConfig.textSecondary }}>
                      Item ID:
                    </span>
                    <span
                      className="ml-1 font-mono"
                      style={{ color: themeConfig.textPrimary }}
                    >
                      {item.id}
                    </span>
                  </div>

                  <div>
                    <span style={{ color: themeConfig.textSecondary }}>
                      Status:
                    </span>
                    <span
                      className="ml-1 font-medium"
                      style={{ color: themeConfig.textPrimary }}
                    >
                      {item.status.replace("_", " ")}
                    </span>
                  </div>

                  <div>
                    <span style={{ color: themeConfig.textSecondary }}>
                      Photo:
                    </span>
                    <span
                      className="ml-1"
                      style={{
                        color: item.photo_required
                          ? themeConfig.accent
                          : themeConfig.textSecondary,
                      }}
                    >
                      {item.photo_required ? "Required" : "Optional"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    },
  );

  // Handle photo upload for MAKER
  const handleMakerSubmit = async () => {
    setShowError(false);

    // ======== 1. VALIDATE =========
    if (!makerRemark.trim()) {
      setShowError(true);
      showToast("Remarks are required for Maker", "error");
      return;
    }
    if (selectedItemForMaker.photo_required && makerPhotos.length === 0) {
      setShowError(true);
      showToast("Photo is required for this item", "error");
      return;
    }
    // ======== 2. SUBMIT LOGIC (unchanged) ========
    if (!selectedItemForMaker) return;

    setSubmittingMaker(true);

    try {
      const token = localStorage.getItem("ACCESS_TOKEN");
      const formData = new FormData();
      formData.append("checklist_item_id", selectedItemForMaker.id);
      formData.append("maker_remark", makerRemark);

      // if (makerPhotos.length > 0) {
      //   formData.append("maker_media", makerPhotos[0].file);
      // }
      if (makerPhotos.length > 0) {
        appendFiles(
          formData,
          "maker_media_multi",
          makerPhotos.map((p) => p.file),
        );
      }

      const response = await checklistInstance.post(MAKER_DONE_API, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.status === 200) {
        toast.success("✅ Work completed and submitted for review!", {
          duration: 4000,
          style: {
            background: themeConfig.success,
            color: "white",
            borderRadius: "12px",
            padding: "16px",
          },
        });

        // Remove item from current tab immediately
        const submittedItemId = selectedItemForMaker.id;
        const currentDataSource =
          activeWorkTab === "available-work"
            ? "available_for_me"
            : "assigned_to_me";

        setChecklistData((prev) =>
          prev.map((roomData) => ({
            ...roomData,
            [currentDataSource]:
              roomData[currentDataSource]?.filter(
                (item) => item.id !== submittedItemId,
              ) || [],
          })),
        );

        // Close modal and reset
        setShowMakerModal(false);
        setSelectedItemForMaker(null);
        setMakerRemark("");
        setMakerPhotos([]);
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.detail || "Failed to submit work";
      showToast(`❌ ${errorMessage}`, "error");
    } finally {
      setSubmittingMaker(false);
    }
  };

  const handleRemarkChange = (itemId, value) => {
    setMakerInputs((inputs) => ({
      ...inputs,
      [itemId]: { ...(inputs[itemId] || {}), remark: value },
    }));
  };

  const handlePhotosChange = (itemId, newFiles) => {
    setMakerInputs((prev) => {
      const current = prev[itemId]?.photos || [];
      return {
        ...prev,
        [itemId]: {
          ...prev[itemId],
          photos: mergeFiles(current, newFiles),
        },
      };
    });
  };

  const handleSubmitItem = async (item) => {
    const input = makerInputs[item.id] || {};
    if (!input.remark || !input.remark.trim()) {
      toast.error("Remark is required.");
      return;
    }
    const hasPhotos = Array.isArray(input.photos) && input.photos.length > 0;
    if (item.photo_required && !hasPhotos) {
      toast.error("Photo is required for this question.");
      return;
    }

    setMakerInputs((inputs) => ({
      ...inputs,
      [item.id]: { ...(inputs[item.id] || {}), submitting: true },
    }));

    try {
      const token = localStorage.getItem("ACCESS_TOKEN");
      const formData = new FormData();
      formData.append("checklist_item_id", item.id);
      formData.append("maker_remark", input.remark);
      if (hasPhotos) {
        appendFiles(formData, "maker_media_multi", input.photos); // 🔥 MULTI
      }

      await checklistInstance.post(MAKER_DONE_API, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Submitted!");
      setMakerInputs((inputs) => ({
        ...inputs,
        [item.id]: { ...inputs[item.id], submitting: false, done: true },
      }));
    } catch (err) {
      toast.error(
        "Failed to submit: " + (err.response?.data?.detail || "Error"),
      );
      setMakerInputs((inputs) => ({
        ...inputs,
        [item.id]: { ...inputs[item.id], submitting: false },
      }));
    }
  };

  const handleRoomClick = (room) => {
    setSelectedRoom(room);
    setShowRoomsModal(true);
  };

  const handleMakerChecklistSubmit = async () => {
    // Basic validation: remarks required, photo required if item.photo_required
    for (let item of selectedChecklist.items) {
      const answer = makerAnswers[item.id] || {};
      if (!answer.remark || !answer.remark.trim()) {
        alert(`Please enter remarks for: ${item.title || item.description}`);
        return;
      }
      if (item.photo_required && !answer.photo) {
        alert(`Please upload a photo for: ${item.title || item.description}`);
        return;
      }
    }

    // For each item, send API call, or build formData and send once per checklist (up to you)
    for (let item of selectedChecklist.items) {
      const answer = makerAnswers[item.id];
      const formData = new FormData();
      formData.append("checklist_item_id", item.id);
      formData.append("maker_remark", answer.remark);
      if (item.photo_required || (answer.photos && answer.photos.length)) {
        appendFiles(formData, "maker_media_multi", answer.photos || []); // 🔥 MULTI
      }
      // ...send POST to your endpoint
      // await checklistInstance.post('/mark-as-done-maker/', formData, ...);
    }
    // Success message
    setShowMakerModal(false);
    setMakerAnswers({});
    // Refresh data if needed
  };

  // Tab Navigation Component for INITIALIZER
  const TabNavigation = () => {
    if (userRole !== "INITIALIZER") return null;

    return (
      <div className="mb-6">
        <div
          className="flex gap-2 p-2 rounded-xl"
          style={{ background: `${themeConfig.accent}10` }}
        >
          {initializerTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabSwitch(tab.key)}
              className={`
                            flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-lg 
                            font-medium transition-all duration-300 transform hover:scale-105
                            ${activeTab === tab.key ? "shadow-lg" : "hover:shadow-md"}
                        `}
              style={{
                background:
                  activeTab === tab.key
                    ? `linear-gradient(135deg, ${tab.color}, ${tab.color}dd)`
                    : `${tab.color}15`,
                color: activeTab === tab.key ? "white" : tab.color,
                border: `2px solid ${activeTab === tab.key ? tab.color : "transparent"}`,
              }}
            >
              <span className="text-xl">{tab.icon}</span>
              <div className="text-left">
                <div className="font-bold">{tab.label}</div>
                <div className="text-xs opacity-80">{tab.description}</div>
                {activeTab === tab.key && selectedForBulk.size > 0 && (
                  <div className="text-xs mt-1">
                    {selectedForBulk.size} selected
                  </div>
                )}
              </div>
              {tabLoading[tab.key] && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              )}
              <div
                className="px-2 py-1 rounded-full text-xs font-bold"
                style={{
                  background:
                    activeTab === tab.key
                      ? "rgba(255,255,255,0.2)"
                      : `${tab.color}30`,
                  color: activeTab === tab.key ? "white" : tab.color,
                }}
              >
                {tabData[tab.key]?.reduce(
                  (count, room) => count + (room.checklists?.length || 0),
                  0,
                ) || 0}
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  // Universal Tab Navigation for Working Roles (CHECKER, MAKER, SUPERVISOR)
  // Universal Tab Navigation for Working Roles (CHECKER, MAKER, SUPERVISOR)
  const WorkingRoleTabNavigation = () => {
    if (!["CHECKER", "MAKER", "SUPERVISOR"].includes(userRole)) return null;

    // Role-specific tab configurations
    const getTabsForRole = (role) => {
      switch (role) {
        case "CHECKER":
          return [
            {
              key: "available-work",
              label: "Pre-Screening Queue",
              icon: "",
              color: themeConfig.accent,
              description: "Items pending initial inspection",
              dataSource: "available_for_me",
            },
            {
              key: "my-assignments",
              label: "Final Review Queue",
              icon: "",
              color: themeConfig.warning,
              description: "Items for final approval/rejection",
              dataSource: "assigned_to_me",
            },
          ];
        case "MAKER":
          return [
            {
              key: "available-work",
              label: "New Work Assign",
              icon: "🔨",
              color: themeConfig.accent,
              description: "Fresh items requiring work",
              dataSource: "available_for_me",
            },
            {
              key: "my-assignments",
              label: "Rework Queue",
              icon: "🔄",
              color: themeConfig.warning,
              description: "Rejected items to fix",
              dataSource: "assigned_to_me",
            },
          ];
        case "SUPERVISOR":
          return [
            {
              key: "available-work",
              label: "Review Submissions",
              icon: "",
              color: themeConfig.accent,
              description: "MAKER work to review",
              dataSource: "available_for_me",
            },
            {
              key: "my-assignments",
              label: "Rework Queue",
              icon: "",
              color: themeConfig.warning,
              description: "Previously reviewed items",
              dataSource: "assigned_to_me",
            },
          ];
        default:
          return [];
      }
    };

    const universalTabs = getTabsForRole(userRole);

    return (
      <div className="mb-6">
        <div
          className="flex gap-2 p-2 rounded-xl"
          style={{ background: `${themeConfig.accent}10` }}
        >
          {universalTabs.map((tab) => {
            const itemCount =
              checklistData.reduce(
                (count, room) => count + (room[tab.dataSource]?.length || 0),
                0,
              ) || 0;

            return (
              <button
                key={tab.key}
                onClick={() => setActiveWorkTab(tab.key)}
                className={`
                                flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-lg 
                                font-medium transition-all duration-300 transform hover:scale-105
                                ${activeWorkTab === tab.key ? "shadow-lg" : "hover:shadow-md"}
                            `}
                style={{
                  background:
                    activeWorkTab === tab.key
                      ? `linear-gradient(135deg, ${tab.color}, ${tab.color}dd)`
                      : `${tab.color}15`,
                  color: activeWorkTab === tab.key ? "white" : tab.color,
                  border: `2px solid ${activeWorkTab === tab.key ? tab.color : "transparent"}`,
                }}
              >
                <span className="text-xl">{tab.icon}</span>
                <div className="text-left">
                  <div className="font-bold">{tab.label}</div>
                  <div className="text-xs opacity-80">{tab.description}</div>
                </div>
                <div
                  className="px-2 py-1 rounded-full text-xs font-bold"
                  style={{
                    background:
                      activeWorkTab === tab.key
                        ? "rgba(255,255,255,0.2)"
                        : `${tab.color}30`,
                    color: activeWorkTab === tab.key ? "white" : tab.color,
                  }}
                >
                  {itemCount}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };
  const handleMakerPhotoUpload = (event) => {
    const files = Array.from(event.target.files);
    const newPhotos = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      name: file.name,
    }));
    setMakerPhotos(newPhotos); // Replace with all selected photos
  };

  const removeMakerPhoto = (index) => {
    setMakerPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  // 🚩 PAGINATION — state + helpers
  const [pageState, setPageState] = useState({
    next: null,
    previous: null,
    count: 0,
    limit: 10,
    offset: 0,
    page: 1,
  });
  const [pageLoading, setPageLoading] = useState(false);

  const parsePageFromUrl = (url, fallbackLimit = 10) => {
    try {
      const u = new URL(url);
      const limit = Number(u.searchParams.get("limit")) || fallbackLimit;
      const offset = Number(u.searchParams.get("offset")) || 0;
      return { limit, offset, page: Math.floor(offset / limit) + 1 };
    } catch {
      return { limit: fallbackLimit, offset: 0, page: 1 };
    }
  };

  useEffect(() => {
    if (!projectId) {
      console.warn("⛔ No projectId passed to fetchCategories");
      return;
    }

    const fetchCategories = async () => {
      try {
        const token = localStorage.getItem("ACCESS_TOKEN");

        const res = await projectInstance.get("/categories-simple/", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          // ❓ If your backend expects project_id as query param, keep this.
          // If not, you can remove this params block.
          params: {
            project_id: projectId,
          },
        });

        console.log("🟢 RAW categories response:", res.data);
        console.log("📌 projectId in FE:", projectId);

        const all = Array.isArray(res.data) ? res.data : res.data.results || [];

        console.log("🟢 All categories:", all);

        // 🔹 Try to match both `project` and `project_id` keys
        const forThisProject = all.filter(
          (cat) =>
            String(cat.project) === String(projectId) ||
            String(cat.project_id) === String(projectId),
        );

        console.log("🟡 Filtered categories for this project:", forThisProject);

        const names = forThisProject
          .map((c) => c.name)
          .filter(Boolean)
          .sort((a, b) => String(a).localeCompare(String(b)));

        console.log("✅ Final category names:", names);

        setCategoryOptions(names);
      } catch (err) {
        console.error("❌ Failed to load project categories:", err);
      }
    };

    fetchCategories();
  }, [projectId]);

  const applyPageResponse = (data, opts = {}) => {
    const {
      target = isInitializerUser(userRole) ? "initializer" : "work",
      tabKey = activeTab,
      limit,
      offset,
    } = opts;

    const rows = getApiResultsArray(data);

    console.log(
      "applyPageResponse from",
      target,
      "tab:",
      tabKey,
      "count:",
      data?.count,
      "results.length:",
      rows.length,
    );

    if (target === "initializer") {
      const grouped = groupChecklistsByRoom(rows);
      setChecklistData(grouped);
      setTabData((prev) => ({ ...prev, [tabKey]: grouped }));
    } else if (target === "work") {
      if (!Array.isArray(rows) || rows.length === 0) {
        console.log(
          "applyPageResponse: empty work results → keeping previous checklistData",
        );
      } else {
        setChecklistData(rows);
      }
    }

    setNoteMessage(data?.note || null);
    setStageMeta(data?.stagehistory_meta ?? null);

    const safeLimit = limit ?? pageState.limit ?? 10;
    const safeOffset = offset ?? 0;
    const page = Math.floor(safeOffset / Math.max(safeLimit, 1)) + 1;

    setPageState({
      next: data?.next || null,
      previous: data?.previous || null,
      count: data?.count || 0,
      limit: safeLimit,
      offset: safeOffset,
      page,
    });
  };

  // Load a page for INITIALIZER (tab-aware)
  const loadInitializerPage = async ({
    limit = pageState.limit || 10,
    offset = 0,
    tabKey = activeTab,
  } = {}) => {
    if (!projectId || !flatId) return;
    setPageLoading(true);
    try {
      const token = localStorage.getItem("ACCESS_TOKEN");
      const params = {
        project_id: projectId,
        phase_id: Number(selectedPhaseId),
        flat_id: Number(flatId),
        tower_id: Number(resolvedTowerId),
        building_id: Number(resolvedTowerId),
        level_id: levelId ? Number(levelId) : undefined,
        // flat_id: flatId,
        ...(selectedPurposeId ? { purpose_id: Number(selectedPurposeId) } : {}),
        ...(selectedPhaseId ? { phase_id: Number(selectedPhaseId) } : {}),
        status: statusByTab[tabKey],
        limit,
        offset,
        ...(roleId ? { role_id: roleId } : {}), // ✅ ADD THIS
      };

      console.log("⬆️ loadInitializerPage params:", params);

      console.log("⬆️ loadInitializerPage params:", params);

      const res = await checklistInstance.get(CHECKLIST_API_URL, {
        params,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      applyPageResponse(res.data, {
        target: "initializer",
        tabKey,
        limit,
        offset,
      });
      setNoteMessage((prev) => prev ?? res.data?.note ?? null);

      const roomIds = [
        ...new Set(
          (res.data.results || []).map((r) => r.room_id).filter(Boolean),
        ),
      ];
      if (roomIds.length) await fetchRoomDetails(roomIds);
    } finally {
      setPageLoading(false);
    }
  };

  // const loadWorkPage = async ({ offset = 0, limit } = {}) => {
  //   if (!projectId || !flatId) return;

  //   // ❗ INITIALIZER ke liye yeh endpoint allowed hi nahi hai
  //   const apiRole = resolveApiRoleId(); // maker / checker / supervisor / initializer
  //   if (apiRole === "initializer") {
  //     console.warn("loadWorkPage called for INITIALIZER – skipping transfer-getchchklist");
  //     return;
  //   }

  //   const token = localStorage.getItem("ACCESS_TOKEN");

  //   const params = {
  //     project_id: projectId,
  //     flat_id: flatId,
  //     limit: limit || pageState.limit || 10,
  //     offset,
  // ...(roleId ? { role_id: roleId } : {}),  };

  //   console.log("🔭 loadWorkPage → params:", params);

  //   //const res = await checklistInstance.get("/sexy-getchchklist/", {
  //   const res = await checklistInstance.get("/transfer-getchchklist/", {

  //     params,
  //     headers: { Authorization: `Bearer ${token}` },
  //   });

  //   const data = res.data || {};
  //   const results = data.results || data || [];

  //   // setChecklistData(Array.isArray(results) ? results : [results]);
  // const rows = Array.isArray(results) ? results : [results];
  // setChecklistData(groupWorkChecklistsByRoom(rows));

  //   setPageState(prev => ({
  //     ...prev,
  //     count: data.count ?? results.length,
  //     next: data.next ?? null,
  //     previous: data.previous ?? null,
  //     offset,
  //     limit: params.limit,
  //     page: Math.floor(offset / (params.limit || 1)) + 1,
  //   }));
  // };
  const loadWorkPage = async ({ offset = 0, limit } = {}) => {
    if (!projectId || !flatId) return;

    const apiRole = resolveApiRoleId();
    if (apiRole === "initializer") {
      console.warn(
        "loadWorkPage called for INITIALIZER – skipping transfer-getchchklist",
      );
      return;
    }

    const token = localStorage.getItem("ACCESS_TOKEN");

    const params = {
      project_id: Number(projectId),
      flat_id: Number(flatId),
      ...(resolvedTowerId
        ? {
            tower_id: Number(resolvedTowerId),
            building_id: Number(resolvedTowerId),
          }
        : {}),
      ...(levelId ? { level_id: Number(levelId) } : {}),
      ...(selectedPurposeId ? { purpose_id: Number(selectedPurposeId) } : {}),
      ...(selectedPhaseId ? { phase_id: Number(selectedPhaseId) } : {}),
      limit: limit || pageState.limit || 10,
      offset,
      ...(apiRole ? { role_id: apiRole } : {}),
    };

    console.log("🔭 loadWorkPage → params:", params);

    const res = await checklistInstance.get("/transfer-getchchklist/", {
      params,
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = res.data || {};
    const results = data.results || data || [];
    const rows = Array.isArray(results) ? results : [results];

    // setChecklistData(groupWorkChecklistsByRoom(rows));
setChecklistData(rows);
    setPageState((prev) => ({
      ...prev,
      count: data.count ?? rows.length,
      next: data.next ?? null,
      previous: data.previous ?? null,
      offset,
      limit: params.limit,
      page: Math.floor(offset / (params.limit || 1)) + 1,
    }));
  };

  useEffect(() => {
    const role = String(userRole || "").toUpperCase();

    if (!isInitializerUser(role)) return;
    if (!projectId || !selectedPhaseId || !resolvedTowerId || !flatId) return;

    console.log("🟡 INITIALIZER FLAT PAGE AUTO LOAD", {
      projectId,
      selectedPhaseId,
      resolvedTowerId,
      flatId,
      levelId,
      role,
      activeTab,
    });

    fetchTabData(activeTab || "ready-to-start");
  }, [
    projectId,
    selectedPhaseId,
    resolvedTowerId,
    flatId,
    levelId,
    userRole,
    activeTab,
  ]);

  useEffect(() => {
    if (!userRole || !projectId || !flatId) return;

    console.log("🚀 useEffect(fetch) with:", { userRole, projectId, flatId });

    setPageState((ps) => ({ ...ps, offset: 0, page: 1 }));

    if (isInitializerUser(userRole)) {
      fetchTabData(activeTab || "ready-to-start");
    } else if (["CHECKER", "MAKER", "SUPERVISOR"].includes(userRole)) {
      loadWorkPage({ limit: pageState.limit || 10, offset: 0 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    userRole,
    activeTab,
    projectId,
    flatId,
    selectedPhaseId,
    resolvedTowerId,
    levelId,
  ]);

  const fetchByUrl = async (url) => {
    if (!url) return;
    let finalUrl = url;
    try {
      const u = new URL(url, window.location.origin);
      if (roleId && !u.searchParams.has("role_id")) {
        u.searchParams.set("role_id", roleId);
      }
      finalUrl = u.toString();
    } catch {}
    setPageLoading(true);
    try {
      const token = localStorage.getItem("ACCESS_TOKEN");
      const res = await checklistInstance.get(finalUrl, {
        timeout: 40000,

        headers: { Authorization: `Bearer ${token}` },
      });

      // read limit/offset from the URL we were given
      let limit = pageState.limit || 10,
        offset = 0;
      try {
        const u = new URL(url);
        limit = Number(u.searchParams.get("limit")) || limit;
        offset = Number(u.searchParams.get("offset")) || 0;
      } catch {}

      const target = userRole === "INITIALIZER" ? "initializer" : "work";
      const tabKey = userRole === "INITIALIZER" ? activeTab : undefined;

      applyPageResponse(res.data, { target, tabKey, limit, offset });
      setNoteMessage((prev) => prev ?? res.data?.note ?? null);

      const roomIds = [
        ...new Set(
          (res.data.results || []).map((r) => r.room_id).filter(Boolean),
        ),
      ];
      if (roomIds.length) await fetchRoomDetails(roomIds);
    } finally {
      setPageLoading(false);
    }
  };

  const getOffsetFromPageUrl = (url) => {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    const value = parsed.searchParams.get("offset");
    return value ? Number(value) : 0;
  } catch {
    return null;
  }
};

const getLimitFromPageUrl = (url, fallback = 10) => {
  if (!url) return fallback;
  try {
    const parsed = new URL(url);
    const value = parsed.searchParams.get("limit");
    return value ? Number(value) : fallback;
  } catch {
    return fallback;
  }
};

const handleNextPage = async () => {
  if (!pageState?.next || pageLoading) return;

  setPageLoading(true);
  try {
    const nextOffset = getOffsetFromPageUrl(pageState.next);
    const nextLimit = getLimitFromPageUrl(pageState.next, pageState.limit || 10);

    if (nextOffset === null) return;

    if (isInitializerUser(userRole)) {
      await loadFlatChecklists({
        status: statusByTab[activeTab] || "not_started",
        offset: nextOffset,
        limit: nextLimit,
        tabKey: activeTab,
        explicitRole: userRole,
      });
    } else {
      await loadFlatChecklists({
        offset: nextOffset,
        limit: nextLimit,
        explicitRole: userRole,
      });
    }
  } finally {
    setPageLoading(false);
  }
};

const handlePrevPage = async () => {
  if (!pageState?.previous || pageLoading) return;

  setPageLoading(true);
  try {
    const prevOffset = getOffsetFromPageUrl(pageState.previous);
    const prevLimit = getLimitFromPageUrl(pageState.previous, pageState.limit || 10);

    if (prevOffset === null) return;

    if (isInitializerUser(userRole)) {
      await loadFlatChecklists({
        status: statusByTab[activeTab] || "not_started",
        offset: prevOffset,
        limit: prevLimit,
        tabKey: activeTab,
        explicitRole: userRole,
      });
    } else {
      await loadFlatChecklists({
        offset: prevOffset,
        limit: prevLimit,
        explicitRole: userRole,
      });
    }
  } finally {
    setPageLoading(false);
  }
};

  // const handlePrevPage = () => {
  //   if (pageState.previous && !pageLoading) fetchByUrl(pageState.previous);
  // };
  // const handleNextPage = () => {
  //   if (pageState.next && !pageLoading) fetchByUrl(pageState.next);
  // };

//   const handleNextPage = async () => {
//   if (!paginationInfo?.next) return;

//   const nextOffset = getOffsetFromPageUrl(paginationInfo.next);
//   const nextLimit = getLimitFromPageUrl(paginationInfo.next, 10);

//   if (nextOffset === null) return;

//   if (isInitializerUser(userRole)) {
//     await loadFlatChecklists({
//       status: statusByTab[activeTab] || "not_started",
//       offset: nextOffset,
//       limit: nextLimit,
//       tabKey: activeTab,
//       explicitRole: userRole,
//     });
//   } else {
//     await loadFlatChecklists({
//       offset: nextOffset,
//       limit: nextLimit,
//       explicitRole: userRole,
//     });
//   }
// };

// const handlePreviousPage = async () => {
//   if (!paginationInfo?.previous) return;

//   const prevOffset = getOffsetFromPageUrl(paginationInfo.previous);
//   const prevLimit = getLimitFromPageUrl(paginationInfo.previous, 10);

//   if (prevOffset === null) return;

//   if (isInitializerUser(userRole)) {
//     await loadFlatChecklists({
//       status: statusByTab[activeTab] || "not_started",
//       offset: prevOffset,
//       limit: prevLimit,
//       tabKey: activeTab,
//       explicitRole: userRole,
//     });
//   } else {
//     await loadFlatChecklists({
//       offset: prevOffset,
//       limit: prevLimit,
//       explicitRole: userRole,
//     });
//   }
// };

  const handleGenerateReport = async (filters) => {
    setReportLoading(true);
    setReportError(null);
    setLastReportFilters(filters || null);

    try {
      const token = localStorage.getItem("ACCESS_TOKEN");

      const params = {};

      // Date range
      if (filters.fromDate) params.from_date = filters.fromDate;
      if (filters.toDate) params.to_date = filters.toDate;

      // Only send when ON → backend treats as “only with photos”
      if (filters.includePhotos) {
        params.with_photos = "true";
      }

      if (filters.category) {
        params.category = filters.category;
      }

      if (filters.decisionRole) {
        params.decision_role = filters.decisionRole.toLowerCase();
      }

      if (filters.outcome) {
        params.outcome = filters.outcome.toLowerCase();
      }

      if (filters.stageId) {
        params.stage_id = filters.stageId;
      }

      console.log("📤 Report params:", params);

      const res = await NEWchecklistInstance.get(`/flat-report/${flatId}/`, {
        params,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 60000,
      });

      const data = res.data || {};
      setReportData(data);

      // If API also returns stage/category meta, your existing effect
      // will pick it up and rebuild stageOptions/categoryOptions.

      if (data.pdf_url) {
        const url = data.pdf_url.startsWith("http")
          ? data.pdf_url
          : `https://konstruct.world${data.pdf_url}`;
        window.open(url, "_blank");
      } else {
        toast.error("Report generated but no PDF URL was returned.");
      }
    } catch (err) {
      console.error("❌ Report generation failed:", err);
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.error ||
        err.message ||
        "Failed to generate report.";
      setReportError(msg);
      toast.error(`❌ ${msg}`);
    } finally {
      setReportLoading(false);
      setShowReportFilter(false);
    }
  };

  const buildReportQuery = (filters = {}) => {
    const params = new URLSearchParams();

    if (filters.fromDate) params.set("from_date", filters.fromDate);
    if (filters.toDate) params.set("to_date", filters.toDate);

    if (filters.includePhotos) params.set("with_photos", "true");
    if (filters.category) params.set("category", filters.category);
    if (filters.decisionRole) params.set("decision_role", filters.decisionRole);
    if (filters.outcome) params.set("outcome", filters.outcome);
    if (filters.stageId) params.set("stage_id", String(filters.stageId));

    return params.toString();
  };
  const CHECKLIST_BASE = "https://konstruct.world/checklists";

  async function handleDownloadOverview(flatId, filters = {}, setLoading) {
    if (!flatId) return;

    try {
      setLoading(true);
      const token = localStorage.getItem("ACCESS_TOKEN");

      const qs = buildReportQuery(filters);
      const url = `${CHECKLIST_BASE}/flat-overview/${flatId}/${
        qs ? `?${qs}` : ""
      }`;

      const res = await NEWchecklistInstance.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 60000,
      });

      const data = res.data || {};

      if (data.pdf_url) {
        const pdfUrl = data.pdf_url.startsWith("http")
          ? data.pdf_url
          : `https://konstruct.world${data.pdf_url}`;
        window.open(pdfUrl, "_blank");
      } else {
        toast.error("Overview generated but no PDF URL was returned.");
      }
    } catch (err) {
      console.error("Overview download error:", err);
      toast.error("An error occurred while generating the flat overview.");
    } finally {
      setLoading(false);
    }
  }

  const [overviewLoading, setOverviewLoading] = useState(false);

  const onOverviewClick = () => {
    // if you want “quick overview” with last filters, you can call directly:
    // handleDownloadOverview(flatId, lastReportFilters || {}, setOverviewLoading);

    // but right now you are opening a filter popup – keep that:
    setShowOverviewFilter(true);
  };

  const loadFirstPage = async () => {
    setPageLoading(true);
    try {
      const token = localStorage.getItem("ACCESS_TOKEN");
      const params = new URLSearchParams({
        flat_id: String(flatId),
        project_id: String(projectId),
        status: "not_started",
        limit: "10",
        offset: "0",
        ...(roleId ? { role_id: roleId } : {}), // ✅ ADD THIS
      }).toString();

      //const url = `https://konstruct.world/checklists/sexy-getchchklist/?${params}`;
      const url = `https://konstruct.world/checklists/transfer-getchchklist/?${params}`;

      const res = await checklistInstance.get(url, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 40000,
      });
      applyPageResponse(res.data);
    } catch (e) {
      toast.error("Failed to load checklists", {
        style: {
          background: themeConfig.error,
          color: "white",
          borderRadius: "12px",
        },
      });
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    if (!stageId) {
      setStageInfo(null);
      setNoteMessage(null);
      return;
    }

    setStageInfoLoading(true);
    setStageInfoError(null);

    (async () => {
      try {
        const token = localStorage.getItem("ACCESS_TOKEN");
        const res = await projectInstance.get(`/stages/${stageId}/info/`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = res.data;
        setStageInfo(data);

        const stageNote =
          data?.note ??
          data?.stage_note ??
          data?.stage?.note ??
          data?.info?.note ??
          null;

        setNoteMessage(stageNote);
        console.log("✅ Stage info loaded:", { stageId, stageNote });
      } catch (err) {
        console.error("❌ Stage info fetch failed:", err);
        setStageInfoError(err.message || "Failed to fetch stage info");
        setNoteMessage(null);
      } finally {
        setStageInfoLoading(false);
      }
    })();
  }, [stageId]);

  useEffect(() => {
    if (!userRole || !projectId) return;

    const stageMap = new Map(); // stage_id -> stage_name
    const categoriesSet = new Set();

    const collectFromItems = (items = []) => {
      items.forEach((item) => {
        // Category from item
        const cat =
          item.category ||
          item.category_name ||
          item.category_label ||
          item.category_slug;

        if (cat) categoriesSet.add(cat);

        // Optional: stage on item
        const sId = item.stage_id || item.stage?.id;
        const sName = item.stage_name || item.stage?.name;
        if (sId && sName) {
          stageMap.set(sId, sName);
        }
      });
    };

    const collectFromChecklists = (checklists = []) => {
      checklists.forEach((chk) => {
        // Stage on checklist
        const sId = chk.stage_id || chk.stage?.id;
        const sName = chk.stage_name || chk.stage?.name;
        if (sId && sName) {
          stageMap.set(sId, sName);
        }

        // Category on checklist
        const cat =
          chk.category ||
          chk.category_name ||
          chk.category_label ||
          chk.category_slug;

        if (cat) categoriesSet.add(cat);

        // Items ke andar bhi check
        collectFromItems(chk.items || []);
      });
    };

    // -------- INITIALIZER (tabData se) --------
    if (userRole === "INITIALIZER") {
      const currentTabData = tabData[activeTab] || [];
      currentTabData.forEach((room) => {
        collectFromChecklists(room.checklists || []);
      });
    }

    // -------- WORKING ROLES (CHECKER / MAKER / SUPERVISOR) --------
    if (["CHECKER", "MAKER", "SUPERVISOR"].includes(userRole)) {
      const currentDataSource =
        activeWorkTab === "available-work"
          ? "available_for_me"
          : "assigned_to_me";

      (checklistData || []).forEach((room) => {
        collectFromChecklists(room[currentDataSource] || []);
      });
    }

    // -------- Extra: stageInfo se bhi ek entry daal do --------
    if (stageInfo?.stage_id && stageInfo?.stage_name) {
      stageMap.set(stageInfo.stage_id, stageInfo.stage_name);
    } else if (stageInfo?.stage?.id && stageInfo?.stage?.name) {
      stageMap.set(stageInfo.stage.id, stageInfo.stage.name);
    }

    // Final unique arrays (sorted)
    const newStageOptions = Array.from(stageMap.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => String(a.name).localeCompare(String(b.name)));

    const newCategoryOptions = Array.from(categoriesSet).sort((a, b) =>
      String(a).localeCompare(String(b)),
    );

    // console.log("🔎 stageOptions built:", newStageOptions);
    // console.log("🔎 categoryOptions built:", newCategoryOptions);

    setStageOptions(newStageOptions);
    if (newCategoryOptions.length) {
      setCategoryOptions(newCategoryOptions);
    }
  }, [
    userRole,
    projectId,
    activeTab,
    activeWorkTab,
    tabData,
    checklistData,
    stageInfo,
  ]);

  
useEffect(() => {
  if (!flatId) return;

  fetchRoomsForFlat();
}, [flatId]);

  if (loading) {
    return (
      <div
        className="flex min-h-screen"
        style={{ background: themeConfig.pageBg }}
      >
        {/* <SiteBarHome /> */}
        <div className="p-8 flex items-center justify-center">
          <div className="text-center">
            <div
              className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4"
              style={{ borderColor: themeConfig.accent }}
            ></div>
            <p className="text-lg" style={{ color: themeConfig.textPrimary }}>
              Loading inspection data...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="flex min-h-screen"
        style={{ background: themeConfig.pageBg }}
      >
        {/* <SiteBarHome /> */}
        <div className="p-8 flex items-center justify-center">
          <div
            className="border rounded-lg p-8 text-center max-w-md"
            style={{
              background: themeConfig.cardBg,
              borderColor: themeConfig.border,
            }}
          >
            <div className="text-4xl mb-4" style={{ color: themeConfig.error }}>
              ⚠️
            </div>
            <h3
              className="text-lg font-semibold mb-2"
              style={{ color: themeConfig.textPrimary }}
            >
              Error Loading Data
            </h3>
            <p style={{ color: themeConfig.textSecondary }}>{error}</p>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 rounded-lg transition-colors text-sm"
                style={{
                  background: themeConfig.accent,
                  color: "white",
                  border: `1px solid ${themeConfig.accent}`,
                }}
              >
                Retry
              </button>
              <button
                onClick={handleBack}
                className="px-4 py-2 rounded-lg transition-colors text-sm"
                style={{
                  background: themeConfig.textSecondary,
                  color: "white",
                  border: `1px solid ${themeConfig.textSecondary}`,
                }}
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  // Get display name for current tab based on role
  const getTabDisplayName = () => {
    if (userRole === "CHECKER") {
      return activeWorkTab === "available-work"
        ? "Pre-Screening"
        : "Final Review";
    } else if (userRole === "MAKER") {
      return activeWorkTab === "available-work" ? "New Work" : "Rework";
    } else if (userRole === "SUPERVISOR") {
      return activeWorkTab === "available-work"
        ? "Review Submissions"
        : "Re-Review";
    } else if (userRole === "INITIALIZER") {
      return activeTab === "ready-to-start"
        ? "Assignment Queue"
        : "Active Workflows";
    }
    return activeWorkTab === "available-work"
      ? "Available Work"
      : "My Assignments";
  };

  // Confirmation Dialog Component
  const ConfirmationDialog = () => {
    if (!showConfirmDialog || !confirmDialogData) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div
          className="max-w-md w-full rounded-xl shadow-2xl"
          style={{ background: themeConfig.cardBg }}
        >
          <div className="p-6">
            <h3
              className="text-lg font-bold mb-3"
              style={{ color: themeConfig.textPrimary }}
            >
              {confirmDialogData.title}
            </h3>
            <p
              className="text-sm mb-6"
              style={{ color: themeConfig.textSecondary }}
            >
              {confirmDialogData.message}
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="px-4 py-2 rounded-lg font-medium text-sm transition-all"
                style={{
                  background: themeConfig.textSecondary,
                  color: "white",
                }}
              >
                Cancel
              </button>

              <button
                onClick={() => {
                  setShowConfirmDialog(false);
                  confirmDialogData.onConfirm();
                }}
                className="px-4 py-2 rounded-lg font-medium text-sm transition-all transform hover:scale-105"
                style={{
                  background: confirmDialogData.confirmColor,
                  color: "white",
                  border: `2px solid ${confirmDialogData.confirmColor}`,
                }}
              >
                {confirmDialogData.confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };
  const ReportFilterModal = ({
    onClose,
    onApply,
    themeConfig,
    currentStage,
    categoryOptions = [],
    stageOptions = [],
    defaultStageId = null,
  }) => {
    // backend-aligned filters
    const [decisionRole, setDecisionRole] = useState(""); // maker / supervisor / checker
    const [outcome, setOutcome] = useState("all"); // pass / fail / rework / pending / all
    const [category, setCategory] = useState(""); // category string
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [includePhotos, setIncludePhotos] = useState(true); // with_photos
    const [stageId, setStageId] = useState(
      defaultStageId ? String(defaultStageId) : "",
    );

    const handleSubmit = (e) => {
      e.preventDefault();
      onApply({
        // map to our local naming; handleGenerateReport will convert to backend names
        fromDate: fromDate || null,
        toDate: toDate || null,
        includePhotos,
        category: category || null,
        decisionRole: decisionRole || null,
        outcome: outcome === "all" ? null : outcome,
        stageId: stageId ? Number(stageId) : null,
      });
    };
    console.log("🔍 In filter UI, categoryOptions =", categoryOptions);

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div
          className="w-full max-w-lg rounded-2xl shadow-2xl"
          style={{
            background: themeConfig.cardBg,
            border: `1px solid ${themeConfig.border}`,
          }}
        >
          <form onSubmit={handleSubmit}>
            {/* Header */}
            <div
              className="px-6 py-4 border-b flex items-center justify-between"
              style={{ borderColor: themeConfig.border }}
            >
              <div>
                <h3
                  className="text-lg font-bold"
                  style={{ color: themeConfig.textPrimary }}
                >
                  Download Inspection Report
                </h3>
                <p
                  className="text-xs mt-1"
                  style={{ color: themeConfig.textSecondary }}
                >
                  Choose filters – report will be generated exactly as per these
                  selections.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-opacity-80 transition-all"
                style={{
                  background: `${themeConfig.error}20`,
                  color: themeConfig.error,
                }}
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-4 space-y-4">
              {/* Stage info + stage filter */}
              <div className="grid grid-cols-1 gap-3">
                {/* Current stage pill */}
                {currentStage && (
                  <div>
                    <label
                      className="block text-xs font-medium mb-1"
                      style={{ color: themeConfig.textSecondary }}
                    >
                      Current Stage
                    </label>
                    <div
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold"
                      style={{
                        background: `${themeConfig.accent}20`,
                        color: themeConfig.accent,
                        border: `1px solid ${themeConfig.accent}`,
                      }}
                    >
                      {currentStage}
                    </div>
                  </div>
                )}

                {/* Stage filter dropdown */}
                <div>
                  <label
                    className="block text-xs font-medium mb-1"
                    style={{ color: themeConfig.textSecondary }}
                  >
                    Filter by Stage (optional)
                  </label>
                  <select
                    value={stageId}
                    onChange={(e) => setStageId(e.target.value)}
                  >
                    <option value="">All Stages</option>
                    {stageOptions.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Decision Role */}
              <div>
                <label
                  className="block text-xs font-medium mb-1"
                  style={{ color: themeConfig.textSecondary }}
                >
                  Decision Role
                </label>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { key: "", label: "Any Role" },
                    { key: "maker", label: "Maker" },
                    { key: "supervisor", label: "Supervisor" },
                    { key: "checker", label: "Checker" },
                  ].map((opt) => (
                    <button
                      key={opt.key || "any"}
                      type="button"
                      onClick={() => setDecisionRole(opt.key)}
                      className="px-3 py-1 rounded-full text-xs font-medium border transition-all"
                      style={{
                        background:
                          decisionRole === opt.key
                            ? themeConfig.accent
                            : themeConfig.cardBg,
                        color:
                          decisionRole === opt.key
                            ? "white"
                            : themeConfig.textPrimary,
                        borderColor:
                          decisionRole === opt.key
                            ? themeConfig.accent
                            : themeConfig.border,
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Outcome filter */}
              <div>
                <label
                  className="block text-xs font-medium mb-1"
                  style={{ color: themeConfig.textSecondary }}
                >
                  Outcome
                </label>
                <select
                  value={outcome}
                  onChange={(e) => setOutcome(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm border"
                  style={{
                    background: themeConfig.cardBg,
                    color: themeConfig.textPrimary,
                    borderColor: themeConfig.border,
                  }}
                >
                  <option value="all">All</option>
                  <option value="pass">Pass / Completed</option>
                  <option value="fail">Fail / Rejected</option>
                  <option value="rework">Rework / WIP</option>
                  <option value="pending">Pending</option>
                </select>
              </div>

              {/* Category filter */}
              <div>
                <label
                  className="block text-xs font-medium mb-1"
                  style={{ color: themeConfig.textSecondary }}
                >
                  Category
                </label>
                {categoryOptions && categoryOptions.length > 0 ? (
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="rf-select"
                  >
                    <option value="">All Categories</option>
                    {categoryOptions.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="e.g. Electrical, Plumbing, Finishing"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm border"
                    style={{
                      background: themeConfig.cardBg,
                      color: themeConfig.textPrimary,
                      borderColor: themeConfig.border,
                    }}
                  />
                )}
              </div>

              {/* Date range */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    className="block text-xs font-medium mb-1"
                    style={{ color: themeConfig.textSecondary }}
                  >
                    From Date
                  </label>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm border"
                    style={{
                      background: themeConfig.cardBg,
                      color: themeConfig.textPrimary,
                      borderColor: themeConfig.border,
                    }}
                  />
                </div>
                <div>
                  <label
                    className="block text-xs font-medium mb-1"
                    style={{ color: themeConfig.textSecondary }}
                  >
                    To Date
                  </label>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm border"
                    style={{
                      background: themeConfig.cardBg,
                      color: themeConfig.textPrimary,
                      borderColor: themeConfig.border,
                    }}
                  />
                </div>
              </div>

              {/* Include photos */}
              <div className="flex items-center justify-between">
                <div>
                  <div
                    className="text-xs font-medium mb-1"
                    style={{ color: themeConfig.textSecondary }}
                  >
                    Include Photos in Report
                  </div>
                  <p
                    className="text-xs"
                    style={{ color: themeConfig.textSecondary }}
                  >
                    When enabled, only submissions with photos will be included
                    (Maker / Checker / Supervisor).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIncludePhotos((v) => !v)}
                  className="relative inline-flex items-center h-6 rounded-full w-11 transition-colors"
                  style={{
                    background: includePhotos
                      ? themeConfig.accent
                      : themeConfig.border,
                  }}
                >
                  <span
                    className="inline-block w-5 h-5 transform bg-white rounded-full shadow transition-transform"
                    style={{
                      transform: includePhotos
                        ? "translateX(20px)"
                        : "translateX(2px)",
                    }}
                  />
                </button>
              </div>
            </div>

            {/* Footer */}
            <div
              className="px-6 py-4 border-t flex items-center justify-end gap-3"
              style={{ borderColor: themeConfig.border }}
            >
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-sm font-medium"
                style={{
                  background: themeConfig.textSecondary,
                  color: "white",
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
                style={{
                  background: `linear-gradient(135deg, ${themeConfig.accent}, ${themeConfig.accent}dd)`,
                  color: "white",
                  border: `2px solid ${themeConfig.accent}`,
                }}
              >
                <span>📄</span>
                <span>Generate Report</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };
  const OverviewFilterModal = ({
    onClose,
    onApply,
    themeConfig,
    categoryOptions = [],
    stageOptions = [],
    defaultStageId = null,
  }) => {
    const [stageId, setStageId] = useState(
      defaultStageId ? String(defaultStageId) : "",
    );
    const [category, setCategory] = useState("");

    const handleSubmit = (e) => {
      e.preventDefault();
      onApply({
        stageId: stageId ? Number(stageId) : null, // 👈 matches buildReportQuery
        category: category || null,
      });
    };
    console.log("Modal categoryOptions:", categoryOptions);
    console.log("🔍 In filter UI, categoryOptions =", categoryOptions);

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div
          className="w-full max-w-md rounded-2xl shadow-2xl"
          style={{
            background: themeConfig.cardBg,
            border: `1px solid ${themeConfig.border}`,
          }}
        >
          <form onSubmit={handleSubmit}>
            {/* Header */}
            <div
              className="px-6 py-4 border-b flex items-center justify-between"
              style={{ borderColor: themeConfig.border }}
            >
              <h3
                className="text-lg font-bold"
                style={{ color: themeConfig.textPrimary }}
              >
                Flat Overview Filters
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-opacity-80 transition-all"
                style={{
                  background: `${themeConfig.error}20`,
                  color: themeConfig.error,
                }}
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-4 space-y-4">
              {/* Stage */}
              <div>
                <label
                  className="block text-xs font-medium mb-1"
                  style={{ color: themeConfig.textSecondary }}
                >
                  Stage (optional)
                </label>
                <select
                  value={stageId}
                  onChange={(e) => setStageId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm border"
                  style={{
                    background: themeConfig.cardBg,
                    color: themeConfig.textPrimary,
                    borderColor: themeConfig.border,
                  }}
                >
                  <option value="">All Stages</option>
                  {stageOptions.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category */}
              <div>
                <label
                  className="block text-xs font-medium mb-1"
                  style={{ color: themeConfig.textSecondary }}
                >
                  Category (optional)
                </label>
                {categoryOptions.length > 0 ? (
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm border"
                    style={{
                      background: themeConfig.cardBg,
                      color: themeConfig.textPrimary,
                      borderColor: themeConfig.border,
                    }}
                  >
                    <option value="">All Categories</option>
                    {categoryOptions.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="e.g. Electrical, Plumbing"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm border"
                    style={{
                      background: themeConfig.cardBg,
                      color: themeConfig.textPrimary,
                      borderColor: themeConfig.border,
                    }}
                  />
                )}
              </div>
            </div>

            {/* Footer */}
            <div
              className="px-6 py-4 border-t flex items-center justify-end gap-3"
              style={{ borderColor: themeConfig.border }}
            >
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-sm font-medium"
                style={{
                  background: themeConfig.textSecondary,
                  color: "white",
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
                style={{
                  background: `linear-gradient(135deg, ${themeConfig.accent}, ${themeConfig.accent}dd)`,
                  color: "white",
                  border: `2px solid ${themeConfig.accent}`,
                }}
              >
                <span>📄</span>
                <span>Download Overview</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Add before return statement
  const getTabProgress = () => {
    if (userRole === "INITIALIZER") {
      const currentTabData = tabData[activeTab] || [];
      const totalItems = currentTabData.reduce(
        (count, room) => count + (room.checklists?.length || 0),
        0,
      );
      const selectedCount = selectedForBulk.size;
      return { total: totalItems, selected: selectedCount };
    } else if (["CHECKER", "MAKER", "SUPERVISOR"].includes(userRole)) {
      const currentDataSource =
        activeWorkTab === "available-work"
          ? "available_for_me"
          : "assigned_to_me";
      const totalItems = checklistData.reduce((count, room) => {
        if (userRole === "MAKER") {
          return count + (room[currentDataSource]?.length || 0);
        } else {
          return (
            count +
            (room[currentDataSource]?.reduce(
              (itemCount, checklist) =>
                itemCount + (checklist.items?.length || 0),
              0,
            ) || 0)
          );
        }
      }, 0);
      const selectedCount = selectedItemsForBulk.size;
      return { total: totalItems, selected: selectedCount };
    }
    return { total: 0, selected: 0 };
  };

  // Add before return statement
  const Tooltip = ({ children, text, position = "top" }) => {
    const [showTooltip, setShowTooltip] = useState(false);

    return (
      <div
        className="relative inline-block"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {children}
        {showTooltip && (
          <div
            className={`absolute z-50 px-3 py-2 text-sm rounded-lg shadow-lg ${
              position === "top" ? "bottom-full mb-2" : "top-full mt-2"
            } left-1/2 transform -translate-x-1/2 whitespace-nowrap`}
            style={{
              background: themeConfig.textPrimary,
              color: themeConfig.cardBg,
            }}
          >
            {text}
            <div
              className={`absolute left-1/2 transform -translate-x-1/2 ${
                position === "top" ? "top-full" : "bottom-full"
              }`}
              style={{
                borderLeft: "5px solid transparent",
                borderRight: "5px solid transparent",
                borderTop:
                  position === "top"
                    ? `5px solid ${themeConfig.textPrimary}`
                    : "none",
                borderBottom:
                  position === "bottom"
                    ? `5px solid ${themeConfig.textPrimary}`
                    : "none",
              }}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className="flex min-h-screen"
      style={{ background: themeConfig.pageBg }}
    >
      {/* <SiteBarHome /> */}
      <main className="flex-1 py-6 px-6 w-full min-w-0">
        {/* Header Section */}
        <div
          className="border rounded-2xl p-8 mb-6 shadow-xl"
          style={{
            background: theme === "dark" ? "#23232c" : "#fff",
            borderColor: "#ffbe63",
          }}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1
                className="text-3xl font-bold mb-3"
                style={{ color: "#ffbe63" }}
              >
                Unit {flatNumber} - Type: {flatType || "N/A"}
              </h1>
              {/* Stage/Phase/Purpose/Project Info */}
              {stageInfoLoading && (
                <div
                  className="mt-2 text-sm animate-pulse"
                  style={{ color: "#ffbe63" }}
                >
                  Loading stage info...
                </div>
              )}
              {stageInfoError && (
                <div
                  className="mt-2 text-sm text-red-500 px-3 py-1 rounded-lg border border-red-200"
                  style={{
                    background: theme === "dark" ? "#191922" : "#fcfaf7",
                  }}
                >
                  {stageInfoError}
                </div>
              )}
              {stageInfo && (
                <div className="mt-4 space-y-3">
                  <div className="flex flex-wrap gap-3 text-sm">
                    <div
                      className="flex items-center gap-3 rounded-xl px-4 py-3 border shadow-sm"
                      style={{
                        background: theme === "dark" ? "#191922" : "#fcfaf7",
                        borderColor: "#ffbe63",
                      }}
                    >
                      <span
                        className="font-medium"
                        style={{ color: "#ffbe63" }}
                      >
                        Purpose:
                      </span>
                      <span
                        className="px-3 py-1 rounded-lg font-semibold"
                        style={{
                          background: "rgba(255, 190, 99, 0.2)",
                          color: "#ffbe63",
                        }}
                      >
                        {stageInfo.purpose_name}
                      </span>
                    </div>
                    <div
                      className="flex items-center gap-3 rounded-xl px-4 py-3 border shadow-sm"
                      style={{
                        background: theme === "dark" ? "#191922" : "#fcfaf7",
                        borderColor: "#ffbe63",
                      }}
                    >
                      <span
                        className="font-medium"
                        style={{ color: "#ffbe63" }}
                      >
                        Phase:
                      </span>
                      <span
                        className="px-3 py-1 rounded-lg font-semibold"
                        style={{
                          background: "rgba(255, 190, 99, 0.3)",
                          color: "#ffbe63",
                        }}
                      >
                        {stageInfo.phase_name}
                      </span>
                    </div>
                    <div
                      className="flex items-center gap-3 rounded-xl px-4 py-3 border shadow-sm"
                      style={{
                        background: theme === "dark" ? "#191922" : "#fcfaf7",
                        borderColor: "#ffbe63",
                      }}
                    >
                      <span
                        className="font-medium"
                        style={{ color: "#ffbe63" }}
                      >
                        Stage:
                      </span>
                      <span
                        className="px-3 py-1 rounded-lg font-semibold"
                        style={{
                          background: "rgba(255, 190, 99, 0.4)",
                          color: "#ffbe63",
                        }}
                      >
                        {stageInfo.stage_name}
                      </span>
                    </div>
                  </div>
                  <div
                    className="flex items-center gap-3 rounded-xl px-4 py-3 border shadow-sm inline-flex"
                    style={{
                      background: theme === "dark" ? "#191922" : "#fcfaf7",
                      borderColor: "#ffbe63",
                    }}
                  >
                    <span className="font-medium" style={{ color: "#ffbe63" }}>
                      Project:
                    </span>
                    <span
                      className="px-3 py-1 rounded-lg text-white font-semibold"
                      style={{
                        background: "#ffbe63",
                      }}
                    >
                      {stageInfo.project_name}
                    </span>
                  </div>
                </div>
              )}
              {stageInfo && (
                <CRMHandoverForm
                  stageInfo={stageInfo}
                  themeConfig={themeConfig}
                  checklistInstance={checklistInstance}
                  onSuccess={({ effectiveDate }) => {
                    // Optional: update UI without full reload
                    setStageInfo((prev) => ({
                      ...prev,
                      stagehistory_meta: {
                        ...(prev?.stagehistory_meta || {}),
                        crm: {
                          ...(prev?.stagehistory_meta?.crm || {}),
                          done: true,
                          date: effectiveDate,
                        },
                      },
                    }));
                    toast.success(`CRM handover recorded for ${effectiveDate}`);
                  }}
                />
              )}
              <div className="flex items-center gap-4 text-sm mt-2">
                <span
                  style={{ color: theme === "dark" ? "#fff" : "#222" }}
                ></span>
                <span
                  style={{ color: theme === "dark" ? "#fff" : "#222" }}
                ></span>
                {/* <span style={{ color: theme === "dark" ? "#fff" : "#222" }}>Project ID: {projectId}</span> */}
              </div>
            </div>
            <div className="flex gap-3">
              {rooms.length > 0 && (
                <button
                  onClick={() => setShowRoomsModal(true)}
                  disabled={roomsLoading}
                  className="px-6 py-3 rounded-xl transition-all text-sm font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  style={{
                    background: "#ffbe63",
                    color: "white",
                    border: `2px solid #ffbe63`,
                  }}
                >
                  {roomsLoading ? "Loading..." : "View Rooms"}
                </button>
              )}

              {/* ---- REPORT BUTTON ---- */}
              {!isMaker && (
                <button
                  onClick={() => setShowReportFilter(true)}
                  disabled={reportLoading}
                  className={`
      px-6 py-3 rounded-xl font-medium transition-all shadow-lg text-sm
      ${reportLoading ? "opacity-60 cursor-not-allowed" : "hover:shadow-xl transform hover:-translate-y-0.5"}
    `}
                  style={{
                    background: "#ffbe63",
                    color: "white",
                    border: `2px solid #ffbe63`,
                  }}
                >
                  {reportLoading ? "Generating..." : "📄 Download Report"}
                </button>
              )}
              <div className="report-modal-footer">
                <button
                  type="button"
                  className="btn btn-outline-primary"
                  style={{
                    marginLeft: "8px",
                    borderColor: "#19376D",
                    color: "#19376D",
                  }}
                  onClick={() => setShowOverviewFilter(true)} // 👈 open popup
                  disabled={overviewLoading}
                >
                  {overviewLoading ? "Generating..." : "Flat Overview"}
                </button>
              </div>

              <button
                onClick={handleBack}
                className="px-6 py-3 rounded-xl transition-all text-sm font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                style={{
                  background: "rgba(255, 190, 99, 0.1)",
                  color: "#ffbe63",
                  border: `2px solid #ffbe63`,
                }}
              >
                ← Back
              </button>
            </div>
          </div>
        </div>
        {noteMessage && (
          <NoteBanner note={noteMessage} themeConfig={themeConfig} />
        )}

        {/* Tab Navigation for INITIALIZER */}
        <TabNavigation />

        <WorkingRoleTabNavigation />

        {/* Bulk Action Bar - moved after tabs */}
        {getBulkActionBar()}

        {/* Room-wise Checklists Section */}
        <div
          className="border rounded-xl p-6 shadow-lg"
          style={{
            background: themeConfig.cardBg,
            borderColor: themeConfig.border,
          }}
        >
          <h2
            className="text-xl font-semibold mb-4"
            style={{ color: themeConfig.textPrimary }}
          >
            Room Inspection Checklists
          </h2>
          <PaginationBar />
          <CRMHandoverForm
            meta={stageMeta}
            themeConfig={themeConfig}
            checklistInstance={checklistInstance}
            onSuccess={() => {
              // hide the form locally after success
              setStageMeta((m) =>
                m ? { ...m, crm: { ...(m.crm || {}), done: true } } : m,
              );
            }}
          />

          {userRole === "INITIALIZER" ? (
            // INITIALIZER Tab-based rendering
            tabData[activeTab]?.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">
                  {initializerTabs.find((tab) => tab.key === activeTab)?.icon}
                </div>
                <h3
                  className="text-lg font-semibold mb-2"
                  style={{ color: themeConfig.textPrimary }}
                >
                  No{" "}
                  {initializerTabs.find((tab) => tab.key === activeTab)?.label}
                </h3>
                <p style={{ color: themeConfig.textSecondary }}>
                  {
                    initializerTabs.find((tab) => tab.key === activeTab)
                      ?.description
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {tabData[activeTab]?.map((roomData, index) => {
                  const roomDetail = rooms.find(
                    (r) => r.id === roomData.room_id,
                  );
                  // const roomKey = roomData.room_id || index;
                  // const firstChecklist = roomData.checklists?.[0];

                  // const allChecklists = roomData.checklists || [];
                  // const allChecklists = getAllChecklistsFromRoom(roomData);
                  const allChecklists = roomData.checklists || [];
                  // const firstChecklist = getAllChecklistsFromRoom(roomData)[0];
                  const firstChecklist = (roomData.checklists || [])[0];
                  const roomKey = roomData.room_id || index;
                  const roomName = getRoomDisplayName(roomData);

                  console.log(
                    `🏠 INITIALIZER Room Debug - ID: ${roomData.room_id}, Name: ${roomName}`,
                  );
                  console.log(`🏠 INITIALIZER Room Detail:`, roomDetail);
                  console.log(
                    `🏠 INITIALIZER First Checklist Room Details:`,
                    firstChecklist?.room_details,
                  );

                  return (
                    <RoomSection
                      key={roomKey}
                      roomName={roomName}
                      roomId={roomData.room_id}
                      checklists={allChecklists}
                      userRole={userRole}
                      themeConfig={themeConfig}
                      roomDetail={roomDetail}
                      handleRoomClick={handleRoomClick}
                    />
                  );
                })}
              </div>
            )
          ) : ["CHECKER", "MAKER", "SUPERVISOR"].includes(userRole) ? (
            checklistData.length === 0 ? (
              noteMessage ? (
                // 🔔 show note instead of the default empty-state block
                <NoteBanner note={noteMessage} themeConfig={themeConfig} />
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">
                    {userRole === "CHECKER"
                      ? "🔍"
                      : userRole === "MAKER"
                        ? "🔨"
                        : "👀"}
                  </div>
                  <h3
                    className="text-lg font-semibold mb-2"
                    style={{ color: themeConfig.textPrimary }}
                  >
                    {userRole === "CHECKER" &&
                      activeWorkTab === "available-work" &&
                      "No Items for Pre-Screening"}
                    {userRole === "CHECKER" &&
                      activeWorkTab === "my-assignments" &&
                      "No Items for Final Review"}
                    {userRole === "MAKER" &&
                      activeWorkTab === "available-work" &&
                      "No New Work Orders"}
                    {userRole === "MAKER" &&
                      activeWorkTab === "my-assignments" &&
                      "No Rework Items"}
                    {userRole === "SUPERVISOR" &&
                      activeWorkTab === "available-work" &&
                      "No Submissions to Review"}
                    {userRole === "SUPERVISOR" &&
                      activeWorkTab === "my-assignments" &&
                      "No Items for Re-Review"}
                  </h3>
                  <p style={{ color: themeConfig.textSecondary }}>
                    {userRole === "CHECKER" &&
                      activeWorkTab === "available-work" &&
                      "New items will appear here after INITIALIZER assigns them"}
                    {userRole === "CHECKER" &&
                      activeWorkTab === "my-assignments" &&
                      "Items will appear here after SUPERVISOR approves MAKER work"}
                    {userRole === "MAKER" &&
                      activeWorkTab === "available-work" &&
                      "New work will appear here when CHECKER marks items as requiring work"}
                    {userRole === "MAKER" &&
                      activeWorkTab === "my-assignments" &&
                      "Rejected items will appear here for rework"}
                    {userRole === "SUPERVISOR" &&
                      activeWorkTab === "available-work" &&
                      "MAKER submissions will appear here for your review"}
                    {userRole === "SUPERVISOR" &&
                      activeWorkTab === "my-assignments" &&
                      "Previously reviewed items will appear here"}
                  </p>
                </div>
              )
            ) : (
              <div className="space-y-6">
                {checklistData.map((roomData, index) => {
                  const roomDetail = rooms.find(
                    (r) => r.id === roomData.room_id,
                  );
                  // const roomKey = roomData.room_id || index;

                  // Priority order for room name
                  // const roomName =
                  //   roomDetail?.rooms || // From fetched room details
                  //   roomData.room_details?.rooms || // From API response
                  //   roomDetail?.name || // Alternative field name
                  //   roomData.room_details?.name || // Alternative field name
                  //   `Room ${roomData.room_id}` || // Fallback with ID
                  //   "Unknown Room"; // Final fallback
                  const roomKey = roomData.room_id || index;
                  const roomName = getRoomDisplayName(roomData);

                  // Get items based on active tab
                  const currentTabDataSource =
                    activeWorkTab === "available-work"
                      ? "available_for_me"
                      : "assigned_to_me";
                  // let roomItems = roomData[currentTabDataSource] || [];
                  let roomItems = [];

                  if (isInitializerUser(userRole)) {
                    roomItems = roomData.checklists || [];
                  } else {
                    const currentTabDataSource =
                      activeWorkTab === "available-work"
                        ? "available_for_me"
                        : "assigned_to_me";

                   if (userRole === "MAKER") {
  // ✅ MAKER always uses available
  roomItems = roomData.available_for_me || [];

} else if (userRole === "CHECKER") {
  // ✅ CHECKER FIX (IMPORTANT)

  if (activeWorkTab === "available-work") {
    // fallback to assigned if available is empty
    roomItems =
      roomData.available_for_me?.length > 0
        ? roomData.available_for_me
        : roomData.assigned_to_me || [];
  } else {
    roomItems =
      roomData.assigned_to_me?.length > 0
        ? roomData.assigned_to_me
        : roomData.available_for_me || [];
  }

} else {
  // other roles
  roomItems = roomData[currentTabDataSource] || [];
}}

                  // 🔧 FIX: SUPERVISOR Deduplication Logic
                  // 🔧 ENHANCED FIX: SUPERVISOR Deduplication Logic at Checklist Level
                  // 🔧 AGGRESSIVE FIX: SUPERVISOR Tab Deduplication
                  if (userRole === "SUPERVISOR") {
                    const assignedChecklists = roomData.assigned_to_me || [];
                    const availableChecklists = roomData.available_for_me || [];

                    if (activeWorkTab === "available-work") {
                      // Show items ONLY from available_for_me that are NOT in assigned_to_me
                      const assignedIds = new Set(
                        assignedChecklists.map((c) => c.id),
                      );
                      roomItems = availableChecklists.filter(
                        (checklist) => !assignedIds.has(checklist.id),
                      );

                      // If still no separation, force it by using only even IDs for available, odd for assigned
                      if (
                        roomItems.length === 0 &&
                        availableChecklists.length > 0
                      ) {
                        roomItems = availableChecklists.filter(
                          (_, index) => index % 2 === 0,
                        );
                      }
                    } else {
                      // Show items ONLY from assigned_to_me
                      roomItems = assignedChecklists;

                      // Force separation if needed
                      if (
                        roomItems.length === 0 &&
                        assignedChecklists.length > 0
                      ) {
                        roomItems = assignedChecklists.filter(
                          (_, index) => index % 2 === 1,
                        );
                      }
                    }

                    console.log(
                      `🔧 SUPERVISOR ${roomData.room_id} - Tab: ${activeWorkTab}, Items: ${roomItems.length}`,
                    );
                  }

                  // Skip room if no items for current tab
                  if (roomItems.length === 0) return null;

                  return (
                    <div
                      key={roomKey}
                      className="border rounded-lg p-4 mb-4"
                      style={{ borderColor: themeConfig.border }}
                    >
                      {/* Room Header */}
                      {/* Room Header with Room-Level Actions */}
                      <div className="flex items-center justify-between mb-4">
                        {/* Left side - Room info */}
                        <div className="flex items-center gap-3">
                          <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg"
                            style={{
                              background: `linear-gradient(135deg, ${themeConfig.accent}, ${themeConfig.accent}dd)`,
                            }}
                          >
                            {roomName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3
                              className="text-xl font-bold"
                              style={{ color: themeConfig.textPrimary }}
                            >
                              {roomName.toUpperCase()}
                            </h3>
                            <p
                              className="text-sm"
                              style={{ color: themeConfig.textSecondary }}
                            >
                              {roomItems.length} item
                              {roomItems.length !== 1 ? "s" : ""} •{" "}
                              {getTabDisplayName()} • {getRoomName(roomData)}
                            </p>
                          </div>
                        </div>

                        {/* Right side - Room-Level Actions for CHECKER and SUPERVISOR */}
                        {["CHECKER", "SUPERVISOR"].includes(userRole) && (
                          <div className="flex items-center gap-3">
                            {/* Room Select All Button */}
                            <button
                              onClick={() => {
                                const roomItemIds = roomItems.flatMap(
                                  (checklist) =>
                                    checklist.items?.map((item) => item.id) ||
                                    [],
                                );

                                const roomItemsSelected = roomItemIds.filter(
                                  (id) => selectedItemsForBulk.has(id),
                                );
                                const allRoomItemsSelected =
                                  roomItemIds.length > 0 &&
                                  roomItemsSelected.length ===
                                    roomItemIds.length;

                                if (allRoomItemsSelected) {
                                  // Unselect only items from this room
                                  setSelectedItemsForBulk((prev) => {
                                    const newSet = new Set(prev);
                                    roomItemIds.forEach((id) =>
                                      newSet.delete(id),
                                    );
                                    return newSet;
                                  });
                                } else {
                                  // Select only items from this room (add to existing selection)
                                  setSelectedItemsForBulk((prev) => {
                                    const newSet = new Set(prev);
                                    roomItemIds.forEach((id) => newSet.add(id));
                                    return newSet;
                                  });
                                }
                              }}
                              className="flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-all duration-300 transform hover:scale-105"
                              style={{
                                background: `${themeConfig.accent}15`,
                                color: themeConfig.accent,
                                border: `2px solid ${themeConfig.accent}30`,
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={(() => {
                                  const currentDataSource =
                                    activeWorkTab === "available-work"
                                      ? "available_for_me"
                                      : "assigned_to_me";
                                  const roomItemIds = roomItems.flatMap(
                                    (checklist) =>
                                      checklist.items?.map((item) => item.id) ||
                                      [],
                                  );
                                  return (
                                    roomItemIds.length > 0 &&
                                    roomItemIds.every((id) =>
                                      selectedItemsForBulk.has(id),
                                    )
                                  );
                                })()}
                                readOnly
                                className="w-4 h-4 rounded border-2"
                                style={{
                                  accentColor: themeConfig.accent,
                                  borderColor: themeConfig.border,
                                }}
                              />
                              <span>
                                Select All in {roomName} (
                                {
                                  roomItems.flatMap(
                                    (checklist) => checklist.items || [],
                                  ).length
                                }
                                )
                              </span>
                            </button>

                            {/* Room-Level Action Buttons */}
                            {(() => {
                              const currentDataSource =
                                activeWorkTab === "available-work"
                                  ? "available_for_me"
                                  : "assigned_to_me";
                              const roomItemIds = roomItems.flatMap(
                                (checklist) =>
                                  checklist.items?.map((item) => item.id) || [],
                              );
                              const selectedInRoom = roomItemIds.filter((id) =>
                                selectedItemsForBulk.has(id),
                              );

                              return (
                                selectedInRoom.length > 0 && (
                                  <>
                                    {/* PASS/APPROVE Button */}
                                    <button
                                      onClick={() => handleBulkDecision("pass")}
                                      disabled={bulkSubmitting}
                                      className="px-4 py-2 rounded-lg font-medium text-sm transition-all duration-300 transform hover:scale-105"
                                      style={{
                                        background: `linear-gradient(135deg, ${themeConfig.passColor}, ${themeConfig.passColor}dd)`,
                                        color: "white",
                                        border: `2px solid ${themeConfig.passColor}`,
                                      }}
                                    >
                                      <div className="flex items-center gap-2">
                                        <span>✅</span>
                                        <span>
                                          {userRole === "CHECKER"
                                            ? "PASS"
                                            : "APPROVE"}{" "}
                                          {roomName} ({selectedInRoom.length})
                                        </span>
                                      </div>
                                    </button>

                                    {/* FAIL/REOPEN Button */}
                                    <button
                                      onClick={() => handleBulkDecision("fail")}
                                      disabled={bulkSubmitting}
                                      className="px-4 py-2 rounded-lg font-medium text-sm transition-all duration-300 transform hover:scale-105"
                                      style={{
                                        background: `linear-gradient(135deg, ${themeConfig.failColor}, ${themeConfig.failColor}dd)`,
                                        color: "white",
                                        border: `2px solid ${themeConfig.failColor}`,
                                      }}
                                    >
                                      <div className="flex items-center gap-2">
                                        <span>❌</span>
                                        <span>
                                          {userRole === "CHECKER"
                                            ? "FAIL"
                                            : "REJECT"}{" "}
                                          {roomName} ({selectedInRoom.length})
                                        </span>
                                      </div>
                                    </button>
                                  </>
                                )
                              );
                            })()}
                          </div>
                        )}
                      </div>
                      {/* Items List */}
                      {/* Items List */}
                      <div className="space-y-4">
                        {userRole === "MAKER" ? (
                          // 🔧 MAKER: your per-question UI (collapsible by checklist)
                          <div>
                            {roomItems.map((checklist) => (
                              <div
                                key={checklist.id}
                                className="mb-6 border rounded-2xl shadow"
                                style={{
                                  background: cardColor,
                                  borderColor: borderColor,
                                }}
                              >
                                {/* Checklist Card Header */}
                                <div
                                  className="cursor-pointer flex items-center justify-between px-4 py-3"
                                  onClick={() =>
                                    setExpandedChecklistId(
                                      expandedChecklistId === checklist.id
                                        ? null
                                        : checklist.id,
                                    )
                                  }
                                >
                                  <span
                                    className="font-bold text-lg flex items-center gap-2"
                                    style={{ color: iconColor }}
                                  >
                                    <svg
                                      width="20"
                                      height="20"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                    >
                                      <rect
                                        x="4"
                                        y="4"
                                        width="16"
                                        height="16"
                                        rx="4"
                                        fill={iconColor}
                                        opacity="0.18"
                                      />
                                      <rect
                                        x="7"
                                        y="7"
                                        width="10"
                                        height="10"
                                        rx="2"
                                        stroke={iconColor}
                                        strokeWidth="2"
                                      />
                                    </svg>
                                    {checklist.name}
                                  </span>
                                  <span
                                    style={{
                                      color: iconColor,
                                      fontWeight: 600,
                                    }}
                                  >
                                    {expandedChecklistId === checklist.id
                                      ? "▲"
                                      : "▼"}
                                  </span>
                                </div>

                                {/* Expand section: Questions */}
                                {/* {expandedChecklistId === checklist.id && ( */}
                                {true && (
                                  <div className="mt-2 px-4 pb-4">
                                    {checklist.items &&
                                    checklist.items.length > 0 ? (
                                      checklist.items.map((item, idx) => (
                                        <div
                                          key={item.id}
                                          className="mb-6 p-4 rounded-xl border bg-opacity-60"
                                          style={{
                                            background: bgColor,
                                            borderColor: borderColor,
                                            boxShadow:
                                              "0 2px 8px 0 rgba(255,190,99,0.07)",
                                          }}
                                        >
                                          <div
                                            className="font-semibold mb-1 text-base flex items-center gap-2"
                                            style={{ color: iconColor }}
                                          >
                                            Q{idx + 1}:
                                            <span style={{ color: textColor }}>
                                              {item.title || item.description}
                                            </span>
                                          </div>
                                          <div
                                            className="text-xs mb-3"
                                            style={{
                                              color: textColor,
                                              opacity: 0.7,
                                            }}
                                          >
                                            {item.description}
                                          </div>
                                          <div className="mb-3">
                                            <span
                                              className={`inline-block px-3 py-1 rounded-xl text-xs font-semibold ${
                                                item.photo_required
                                                  ? "bg-orange-100 text-orange-700"
                                                  : "bg-gray-100 text-gray-500"
                                              }`}
                                              style={{
                                                background: item.photo_required
                                                  ? ORANGE + "33"
                                                  : "#e5e7eb",
                                                color: item.photo_required
                                                  ? ORANGE
                                                  : "#888",
                                                border: `1px solid ${item.photo_required ? ORANGE : "#e5e7eb"}`,
                                              }}
                                            >
                                              {item.photo_required
                                                ? "Photo Required"
                                                : "Photo Optional"}
                                            </span>
                                          </div>
                                          {/* Latest review remark (Supervisor/Checker) */}
                                          {(() => {
                                            // prefer latest_submission if present; otherwise pick most recent from submissions[]
                                            const latest =
                                              item?.latest_submission ||
                                              (Array.isArray(
                                                item?.submissions,
                                              ) && item.submissions.length
                                                ? [...item.submissions].sort(
                                                    (a, b) =>
                                                      new Date(
                                                        b.created_at ||
                                                          b.updated_at ||
                                                          0,
                                                      ) -
                                                      new Date(
                                                        a.created_at ||
                                                          a.updated_at ||
                                                          0,
                                                      ),
                                                  )[0]
                                                : null);

                                            if (!latest) return null;

                                            // try multiple possible keys your API might use
                                            const feedback =
                                              (typeof latest.supervisor_remarks ===
                                                "string" &&
                                                latest.supervisor_remarks.trim()) ||
                                              (typeof latest.checker_remarks ===
                                                "string" &&
                                                latest.checker_remarks.trim()) ||
                                              (typeof latest.check_remark ===
                                                "string" &&
                                                latest.check_remark.trim()) ||
                                              (typeof latest.reviewer_remarks ===
                                                "string" &&
                                                latest.reviewer_remarks.trim()) ||
                                              (typeof latest.remarks ===
                                                "string" &&
                                                latest.remarks.trim()) ||
                                              "";

                                            if (!feedback) return null;

                                            const who =
                                              latest.supervisor_remarks
                                                ? "Supervisor"
                                                : latest.checker_remarks
                                                  ? "Checker"
                                                  : latest.check_remark
                                                    ? "Reviewer"
                                                    : "Review";

                                            return (
                                              <div
                                                className="mb-3 p-3 rounded-lg border"
                                                style={{
                                                  background: ORANGE + "22", // soft orange tint
                                                  borderColor: ORANGE,
                                                  color: textColor,
                                                }}
                                              >
                                                <div
                                                  className="text-xs font-semibold mb-1"
                                                  style={{ color: ORANGE }}
                                                >
                                                  {who} Remark
                                                </div>
                                                <div className="text-sm leading-relaxed">
                                                  {feedback}
                                                </div>
                                              </div>
                                            );
                                          })()}
                                          {console.log("Maker item debug", {
                                            id: item.id,
                                            latest_submission:
                                              item.latest_submission,
                                            submissions: item.submissions,
                                          })}

                                          {userRole === "MAKER" &&
                                            (() => {
                                              const sub =
                                                getLatestSubmissionWithMedia(
                                                  item,
                                                  "checker",
                                                );
                                              const checkerPhotos =
                                                getRolePhotos(sub, "checker");
                                              if (!checkerPhotos.length)
                                                return null;
                                              return (
                                                <div
                                                  className="p-3 rounded-lg mb-4"
                                                  style={{
                                                    background: `${themeConfig.info}10`,
                                                    border: `1px solid ${themeConfig.info}30`,
                                                  }}
                                                >
                                                  <div
                                                    className="text-sm font-semibold mb-2"
                                                    style={{
                                                      color:
                                                        themeConfig.textPrimary,
                                                    }}
                                                  >
                                                    Checker Photos
                                                  </div>
                                                  <ImageStrip
                                                    sources={checkerPhotos}
                                                    themeConfig={themeConfig}
                                                  />
                                                  {sub?.checker_remarks && (
                                                    <div
                                                      className="text-xs mt-2"
                                                      style={{
                                                        color:
                                                          themeConfig.textSecondary,
                                                      }}
                                                    >
                                                      Remark:{" "}
                                                      {sub.checker_remarks}
                                                    </div>
                                                  )}
                                                </div>
                                              );
                                            })()}

                                          {/* Remark Input */}
                                          <textarea
                                            className="w-full p-3 rounded-lg border mb-2 text-sm focus:ring-2 focus:ring-orange-300"
                                            placeholder="Enter your remarks..."
                                            value={
                                              makerInputs[item.id]?.remark || ""
                                            }
                                            onChange={(e) =>
                                              handleRemarkChange(
                                                item.id,
                                                e.target.value,
                                              )
                                            }
                                            disabled={
                                              makerInputs[item.id]?.done
                                            }
                                            style={{
                                              background: cardColor,
                                              color: textColor,
                                              borderColor: borderColor,
                                              outline: "none",
                                            }}
                                          />

                                          {/* Photo Input */}
                                          <input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            onChange={(e) =>
                                              handlePhotosChange(
                                                item.id,
                                                Array.from(e.target.files),
                                              )
                                            }
                                            disabled={
                                              makerInputs[item.id]?.done
                                            }
                                            className="mb-2"
                                            style={{
                                              background: cardColor,
                                              color: textColor,
                                              borderColor: borderColor,
                                            }}
                                          />

                                          {/* Preview */}
                                          {makerInputs[item.id]?.photos
                                            ?.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mt-2">
                                              {makerInputs[item.id].photos.map(
                                                (f, idx) => (
                                                  <img
                                                    key={idx}
                                                    src={URL.createObjectURL(f)}
                                                    alt={`Preview ${idx + 1}`}
                                                    className="w-32 h-20 object-cover rounded border mt-2"
                                                    style={{
                                                      borderColor: ORANGE,
                                                    }}
                                                  />
                                                ),
                                              )}
                                            </div>
                                          )}
                                          {/* Submit Button */}
                                          <button
                                            className="mt-4 px-6 py-2 bg-orange-400 rounded-lg text-white font-bold shadow hover:scale-105 transition-all disabled:opacity-60"
                                            disabled={
                                              makerInputs[item.id]
                                                ?.submitting ||
                                              makerInputs[item.id]?.done
                                            }
                                            onClick={() =>
                                              handleSubmitItem(item)
                                            }
                                            style={{
                                              background: ORANGE,
                                              border: `2px solid ${ORANGE}`,
                                            }}
                                          >
                                            {makerInputs[item.id]?.submitting
                                              ? "Submitting..."
                                              : makerInputs[item.id]?.done
                                                ? "Submitted"
                                                : "Submit"}
                                          </button>
                                        </div>
                                      ))
                                    ) : (
                                      <div className="text-gray-400">
                                        No questions in this checklist.
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          // ✅ CHECKER & SUPERVISOR: each checklist with its questions via InspectionItem
                          <div>
                            {roomItems.map((checklist) => (
                              <div
                                key={checklist.id}
                                className="mb-6 border rounded-2xl shadow"
                                style={{
                                  background: cardColor,
                                  borderColor: borderColor,
                                }}
                              >
                                <div className="px-4 py-3 flex items-center justify-between">
                                  <span
                                    className="font-bold text-lg"
                                    style={{ color: iconColor }}
                                  >
                                    {checklist.name}
                                  </span>
                                  <span
                                    className="text-sm"
                                    style={{
                                      color: themeConfig.textSecondary,
                                    }}
                                  >
                                    {checklist.items?.length || 0} question
                                    {checklist.items?.length === 1 ? "" : "s"}
                                  </span>
                                </div>

                                <div className="mt-2 px-4 pb-4 space-y-4">
                                  {checklist.items &&
                                  checklist.items.length > 0 ? (
                                    checklist.items.map((item, idx) => (
                                      <InspectionItem
                                        key={item.id}
                                        item={item}
                                        itemIndex={idx}
                                        userRole={userRole}
                                        themeConfig={themeConfig}
                                      />
                                    ))
                                  ) : (
                                    <div className="text-gray-400">
                                      No questions in this checklist.
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : // Fallback for other roles
          checklistData.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📋</div>
              <h3
                className="text-lg font-semibold mb-2"
                style={{ color: themeConfig.textPrimary }}
              >
                No Checklists Found
              </h3>
              <p style={{ color: themeConfig.textSecondary }}>
                No inspection checklists are available for this unit.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {checklistData.map((roomData, index) => {
                const roomDetail = rooms.find((r) => r.id === roomData.room_id);
                let allChecklists = [];
                let roomKey = roomData.room_id || index;
                let roomName = "Unknown Room";

                allChecklists = [
                  ...(roomData.assigned_to_me || []),
                  ...(roomData.available_for_me || []),
                  ...(roomData.pending_for_me || []),
                ];
                roomName =
                  roomDetail?.rooms || `Room ${roomData.room_id}` || "MASTER";

                return (
                  <RoomSection
                    key={roomKey}
                    roomName={roomName}
                    roomId={roomData.room_id}
                    checklists={allChecklists}
                    userRole={userRole}
                    themeConfig={themeConfig}
                    roomDetail={roomDetail}
                    handleRoomClick={handleRoomClick}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {/* <div className="mt-6 text-center">
                    <p className="text-sm" style={{ color: themeConfig.textSecondary }}>
                        Last updated: {new Date().toLocaleString()}
                    </p>
                </div> */}
      </main>
      {/* MAKER Work Modal */}
      {showMakerModal && selectedChecklist && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="max-w-2xl w-full bg-white p-6 rounded-xl shadow-xl">
            <h2 className="text-lg font-bold mb-4">
              Checklist #{selectedChecklist.id}
            </h2>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              {selectedChecklist.items && selectedChecklist.items.length > 0 ? (
                selectedChecklist.items.map((item, idx) => (
                  <div
                    key={item.id}
                    className="p-4 border rounded-xl mb-2 bg-gray-50"
                  >
                    <div className="font-semibold mb-3 text-lg">
                      Q{idx + 1}: {item.title || item.description}
                    </div>
                    <textarea
                      placeholder="Enter your remarks..."
                      className="w-full p-2 rounded border mb-2"
                      value={makerAnswers[item.id]?.remark || ""}
                      onChange={(e) =>
                        setMakerAnswers((ans) => ({
                          ...ans,
                          [item.id]: {
                            ...ans[item.id],
                            remark: e.target.value,
                          },
                        }))
                      }
                    />
                    {item.photo_required && (
                      <>
                        <input
                          type="file"
                          accept="image/*"
                          className="mb-2"
                          onChange={(e) =>
                            setMakerAnswers((ans) => ({
                              ...ans,
                              [item.id]: {
                                ...ans[item.id],
                                photos: [
                                  ...(ans[item.id]?.photos || []),
                                  ...Array.from(e.target.files),
                                ],
                              },
                            }))
                          }
                        />
                        {makerAnswers[item.id]?.photos?.map((f, i) => (
                          // <img
                          //   src={URL.createObjectURL(makerAnswers[item.id].photo)}
                          //   alt="preview"
                          //   className="w-32 rounded"
                          // />
                          <img
                            key={i}
                            src={URL.createObjectURL(f)}
                            alt="preview"
                            className="w-32 rounded inline-block mr-2"
                          />
                        ))}
                      </>
                    )}
                  </div>
                ))
              ) : (
                <div>No questions found for this checklist.</div>
              )}
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowMakerModal(false)}
                className="px-4 py-2 rounded bg-gray-400 text-white mr-2"
              >
                Cancel
              </button>
              <button
                onClick={handleMakerChecklistSubmit}
                className="px-4 py-2 rounded bg-green-600 text-white"
              >
                Submit All
              </button>
            </div>
          </div>
        </div>
      )}

      {showMakerModal && selectedItemForMaker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div
            className="max-w-4xl w-full max-h-[90vh] mx-4 overflow-y-auto rounded-xl shadow-2xl"
            style={{ background: themeConfig.cardBg }}
          >
            {/* Modal Header */}
            <div
              className="sticky top-0 p-6 border-b"
              style={{
                background: themeConfig.headerBg,
                borderColor: themeConfig.border,
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3
                    className="text-xl font-bold"
                    style={{ color: themeConfig.textPrimary }}
                  >
                    Complete Work Item
                  </h3>
                  <p
                    className="text-sm mt-1"
                    style={{ color: themeConfig.textSecondary }}
                  >
                    {selectedItemForMaker.title}
                  </p>
                </div>
                <button
                  onClick={() => setShowMakerModal(false)}
                  className="p-2 rounded-lg hover:bg-opacity-80 transition-all"
                  style={{
                    background: `${themeConfig.error}20`,
                    color: themeConfig.error,
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
            {/* Reviewer Photos visible to MAKER */}
            {(() => {
              const latest = getLatestSubmission(selectedItemForMaker);
              const checkerPhotos = getRolePhotos(latest, "checker");
              const supervisorPhotos = getRolePhotos(latest, "supervisor");
              const hasAny = checkerPhotos.length || supervisorPhotos.length;
              if (!hasAny) return null;

              return (
                <div
                  className="p-4 rounded-xl"
                  style={{
                    background: `${themeConfig.info}10`,
                    border: `1px solid ${themeConfig.info}30`,
                  }}
                >
                  <h4
                    className="font-medium mb-3"
                    style={{ color: themeConfig.textPrimary }}
                  >
                    📷 Reviewer Photos
                  </h4>

                  {checkerPhotos.length > 0 && (
                    <>
                      <div
                        className="text-xs mb-1"
                        style={{ color: themeConfig.textSecondary }}
                      >
                        Checker
                      </div>
                      <ImageStrip
                        sources={checkerPhotos}
                        themeConfig={themeConfig}
                      />
                    </>
                  )}

                  {supervisorPhotos.length > 0 && (
                    <>
                      <div
                        className="text-xs mt-3 mb-1"
                        style={{ color: themeConfig.textSecondary }}
                      >
                        Supervisor
                      </div>
                      <ImageStrip
                        sources={supervisorPhotos}
                        themeConfig={themeConfig}
                      />
                    </>
                  )}
                </div>
              );
            })()}

            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              {/* Previous Remarks */}
              {/* Simplified Previous Feedback */}
              {selectedItemForMaker.submissions &&
                selectedItemForMaker.submissions.length > 0 && (
                  <div
                    className="p-3 rounded-lg mb-4"
                    style={{
                      background: `${themeConfig.warning}15`,
                      border: `1px solid ${themeConfig.warning}40`,
                    }}
                  >
                    <h5
                      className="text-sm font-medium mb-2"
                      style={{ color: themeConfig.textPrimary }}
                    >
                      📝 Latest Feedback
                    </h5>
                    {(() => {
                      const latestFeedback = selectedItemForMaker.submissions
                        .filter(
                          (sub) =>
                            sub.supervisor_remarks || sub.checker_remarks,
                        )
                        .sort(
                          (a, b) =>
                            new Date(b.created_at) - new Date(a.created_at),
                        )[0];

                      if (latestFeedback) {
                        return (
                          <p
                            className="text-sm"
                            style={{ color: themeConfig.textPrimary }}
                          >
                            {latestFeedback.supervisor_remarks ||
                              latestFeedback.checker_remarks}
                          </p>
                        );
                      }
                      return (
                        <p
                          className="text-xs"
                          style={{ color: themeConfig.textSecondary }}
                        >
                          No feedback yet
                        </p>
                      );
                    })()}
                  </div>
                )}
              {userRole === "MAKER" &&
                selectedItemForMaker &&
                (() => {
                  const sub = getLatestSubmissionWithMedia(
                    selectedItemForMaker,
                    "checker",
                  );
                  const checkerPhotos = getRolePhotos(sub, "checker");
                  if (!checkerPhotos.length) return null;
                  return (
                    <div
                      className="p-4 rounded-xl"
                      style={{
                        background: `${themeConfig.info}10`,
                        border: `1px solid ${themeConfig.info}30`,
                      }}
                    >
                      <h4
                        className="font-medium mb-2"
                        style={{ color: themeConfig.textPrimary }}
                      >
                        📷 Checker Photos
                      </h4>
                      <ImageStrip
                        sources={checkerPhotos}
                        themeConfig={themeConfig}
                      />
                      {sub?.checker_remarks && (
                        <div
                          className="text-xs mt-2"
                          style={{ color: themeConfig.textSecondary }}
                        >
                          Remark: {sub.checker_remarks}
                        </div>
                      )}
                    </div>
                  );
                })()}

              {/* MAKER's Work Section */}
              <div
                className="p-4 rounded-xl"
                style={{
                  background: `${themeConfig.success}10`,
                  border: `1px solid ${themeConfig.success}30`,
                }}
              >
                <h4
                  className="font-medium mb-4"
                  style={{ color: themeConfig.textPrimary }}
                >
                  🔧 Your Work Completion
                </h4>

                {/* MAKER Remark */}
                <div className="mb-4">
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: themeConfig.textPrimary }}
                  >
                    Work Completion Remarks
                  </label>
                  <textarea
                    value={makerRemark}
                    onChange={(e) => setMakerRemark(e.target.value)}
                    placeholder="Describe the work completed, any issues faced, or additional notes..."
                    className="w-full p-3 rounded-lg border-2 text-sm"
                    style={{
                      background: themeConfig.cardBg,
                      borderColor: `${themeConfig.border}60`,
                      color: themeConfig.textPrimary,
                      minHeight: "100px",
                    }}
                    rows="4"
                  />
                </div>

                {/* Photo Upload */}
                <div className="mb-4">
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: themeConfig.textPrimary }}
                  >
                    Upload Work Photos
                  </label>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleMakerPhotoUpload}
                    className="w-full p-3 rounded-lg border-2 text-sm"
                    style={{
                      background: themeConfig.cardBg,
                      borderColor: `${themeConfig.border}60`,
                      color: themeConfig.textPrimary,
                    }}
                  />
                </div>

                {/* Photo Previews */}
                {makerPhotos.length > 0 && (
                  <div className="mb-4">
                    <h5
                      className="text-sm font-medium mb-2"
                      style={{ color: themeConfig.textPrimary }}
                    >
                      Photo Preview
                    </h5>
                    <div className="max-w-sm">
                      {" "}
                      {makerPhotos.map((photo, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={photo.preview}
                            alt={`Upload preview ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                          <button
                            onClick={() => removeMakerPhoto(index)}
                            className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs opacity-0 group-hover:opacity-100 transition-all"
                            style={{ background: themeConfig.error }}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              {/* Submit Button - Role-based Actions */}
              <div
                className="flex items-center justify-end gap-3 pt-4 border-t"
                style={{ borderColor: themeConfig.border }}
              >
                <button
                  onClick={() => setShowMakerModal(false)}
                  className="px-6 py-2 rounded-lg font-medium text-sm transition-all"
                  style={{
                    background: themeConfig.textSecondary,
                    color: "white",
                  }}
                >
                  Cancel
                </button>

                {/* SUPERVISOR Actions */}
                {/* SUPERVISOR Actions */}
                {userRole === "SUPERVISOR" && (
                  <>
                    <button
                      onClick={async () => {
                        // Validation: remarks compulsory for supervisor
                        if (!supervisorRemarks.trim()) {
                          showToast(
                            "Remarks are required for Supervisor",
                            "error",
                          );
                          return;
                        }
                        setSubmittingSupervisorDecision(true);
                        try {
                          const token = localStorage.getItem("ACCESS_TOKEN");
                          const failOption =
                            selectedItemForSupervisorReview.options?.find(
                              (opt) => opt.choice === "N",
                            );

                          if (!failOption) {
                            showToast(
                              "No FAIL option found for rejection",
                              "error",
                            );
                            return;
                          }

                          const payload = {
                            checklist_item_id:
                              selectedItemForSupervisorReview.id,
                            role: "supervisor",
                            option_id: failOption.id,
                            check_remark: supervisorRemarks,
                          };

                          const response = await checklistInstance.patch(
                            VERIFY_ITEM_API,
                            payload,
                            {
                              headers: { Authorization: `Bearer ${token}` },
                            },
                          );

                          if (response.status === 200) {
                            showToast(
                              "✅ Work rejected and sent back to MAKER!",
                              "success",
                            );
                            setShowSupervisorReviewModal(false);
                            setSupervisorRemarks("");
                            window.location.reload();
                          }
                        } catch (err) {
                          showToast(
                            `❌ ${err.response?.data?.detail || "Failed to reject work"}`,
                            "error",
                          );
                        } finally {
                          setSubmittingSupervisorDecision(false);
                        }
                      }}
                      disabled={submittingSupervisorDecision}
                      className="px-6 py-3 rounded-lg font-medium text-sm transition-all duration-300 transform hover:scale-105"
                      style={{
                        background: `linear-gradient(135deg, ${themeConfig.error}, ${themeConfig.error}dd)`,
                        color: "white",
                        border: `2px solid ${themeConfig.error}`,
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span>❌</span>
                        <span>Reject & Return to MAKER</span>
                      </div>
                    </button>

                    <button
                      onClick={async () => {
                        // Validation: remarks compulsory for supervisor
                        if (!supervisorRemarks.trim()) {
                          showToast(
                            "Remarks are required for Supervisor",
                            "error",
                          );
                          return;
                        }
                        setSubmittingSupervisorDecision(true);
                        try {
                          const token = localStorage.getItem("ACCESS_TOKEN");
                          const passOption =
                            selectedItemForSupervisorReview.options?.find(
                              (opt) => opt.choice === "P",
                            );

                          if (!passOption) {
                            showToast(
                              "No PASS option found for approval",
                              "error",
                            );
                            return;
                          }

                          const payload = {
                            checklist_item_id:
                              selectedItemForSupervisorReview.id,
                            role: "supervisor",
                            option_id: passOption.id,
                            check_remark: supervisorRemarks,
                          };

                          const response = await checklistInstance.patch(
                            VERIFY_ITEM_API,
                            payload,
                            {
                              headers: { Authorization: `Bearer ${token}` },
                            },
                          );

                          if (response.status === 200) {
                            showToast(
                              "✅ Work approved and sent to CHECKER!",
                              "success",
                            );
                            setShowSupervisorReviewModal(false);
                            setSupervisorRemarks("");
                            window.location.reload();
                          }
                        } catch (err) {
                          showToast(
                            `❌ ${err.response?.data?.detail || "Failed to approve work"}`,
                            "error",
                          );
                        } finally {
                          setSubmittingSupervisorDecision(false);
                        }
                      }}
                      disabled={submittingSupervisorDecision}
                      className="px-6 py-3 rounded-lg font-medium text-sm transition-all duration-300 transform hover:scale-105"
                      style={{
                        background: `linear-gradient(135deg, ${themeConfig.success}, ${themeConfig.success}dd)`,
                        color: "white",
                        border: `2px solid ${themeConfig.success}`,
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span>✅</span>
                        <span>Approve to CHECKER</span>
                      </div>
                    </button>
                  </>
                )}

                {/* MAKER Actions */}
                {userRole === "MAKER" && (
                  <button
                    onClick={handleMakerSubmit}
                    disabled={submittingMaker}
                    className={`
        px-6 py-3 rounded-lg font-medium text-sm transition-all duration-300 transform
        ${
          submittingMaker
            ? "opacity-75 cursor-not-allowed scale-95"
            : "hover:scale-105 hover:shadow-lg active:scale-95"
        }
      `}
                    style={{
                      background: submittingMaker
                        ? `${themeConfig.success}80`
                        : `linear-gradient(135deg, ${themeConfig.success}, ${themeConfig.success}dd)`,
                      color: "white",
                      border: `2px solid ${themeConfig.success}`,
                    }}
                  >
                    {submittingMaker ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Submitting Work...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span>✅</span>
                        <span>Submit Completed Work</span>
                      </div>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* SUPERVISOR Review Modal */}
      {showSupervisorReviewModal && selectedItemForSupervisorReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div
            className="max-w-2xl w-full max-h-[80vh] mx-4 overflow-y-auto rounded-xl shadow-2xl"
            style={{ background: themeConfig.cardBg }}
          >
            {/* Modal Header */}
            <div
              className="sticky top-0 p-6 border-b"
              style={{
                background: themeConfig.headerBg,
                borderColor: themeConfig.border,
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3
                    className="text-xl font-bold"
                    style={{ color: themeConfig.textPrimary }}
                  >
                    Review MAKER Work
                  </h3>
                  <p
                    className="text-sm mt-1"
                    style={{ color: themeConfig.textSecondary }}
                  >
                    {selectedItemForSupervisorReview.title}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowSupervisorReviewModal(false);
                    setSelectedItemForSupervisorReview(null);
                    setSupervisorRemarks("");
                  }}
                  className="p-2 rounded-lg hover:bg-opacity-80 transition-all"
                  style={{
                    background: `${themeConfig.error}20`,
                    color: themeConfig.error,
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              {/* MAKER's Submitted Work */}
              <div
                className="p-4 rounded-xl"
                style={{
                  background: `${themeConfig.success}10`,
                  border: `1px solid ${themeConfig.success}30`,
                }}
              >
                <h4
                  className="font-medium mb-4"
                  style={{ color: themeConfig.textPrimary }}
                >
                  🔨 MAKER's Submitted Work
                </h4>

                {selectedItemForSupervisorReview.submissions &&
                selectedItemForSupervisorReview.submissions.length > 0 ? (
                  (() => {
                    // Get the latest submission
                    const latestSubmission =
                      selectedItemForSupervisorReview.submissions.sort(
                        (a, b) =>
                          new Date(b.created_at) - new Date(a.created_at),
                      )[0];

                    return (
                      <div>
                        {/* MAKER's Remarks */}
                        <div className="mb-4">
                          <label
                            className="block text-sm font-medium mb-2"
                            style={{ color: themeConfig.textPrimary }}
                          >
                            MAKER's Work Notes:
                          </label>
                          <div
                            className="p-3 rounded-lg border-2"
                            style={{
                              background: themeConfig.cardBg,
                              borderColor: `${themeConfig.border}60`,
                              color: themeConfig.textPrimary,
                              minHeight: "80px",
                            }}
                          >
                            {latestSubmission.maker_remarks ||
                              "No remarks provided by MAKER"}
                          </div>
                        </div>

                        {/* MAKER's Photos */}
                        {/* MAKER's Work Photos - Enhanced Display */}
                        <div className="mb-4">
                          <label
                            className="block text-sm font-medium mb-2"
                            style={{ color: themeConfig.textPrimary }}
                          >
                            📷 MAKER's Work Photos:
                          </label>
                          {(() => {
                            // Try multiple possible photo fields
                            const photoUrl =
                              latestSubmission.maker_media ||
                              latestSubmission.media ||
                              latestSubmission.photo ||
                              latestSubmission.image;

                            // console.log("🔍 SUPERVISOR Photo Debug:", {
                            //   maker_media: latestSubmission.maker_media,
                            //   submission: latestSubmission,
                            //   photoUrl: photoUrl,
                            // });

                            if (photoUrl) {
                              return (
                                <div className="max-w-md">
                                  <div className="relative group">
                                    <img
                                      src={
                                        photoUrl.startsWith("http")
                                          ? photoUrl
                                          : `https://konstruct.world${photoUrl}`
                                      }
                                      alt="MAKER's work photo"
                                      className="w-full h-48 object-cover rounded-lg border-2 cursor-pointer hover:scale-105 transition-transform"
                                      style={{
                                        borderColor: themeConfig.success,
                                      }}
                                      onClick={() =>
                                        window.open(
                                          photoUrl.startsWith("http")
                                            ? photoUrl
                                            : `https://konstruct.world${photoUrl}`,
                                          "_blank",
                                        )
                                      }
                                      onError={(e) => {
                                        console.error(
                                          "❌ Photo load error:",
                                          e,
                                        );
                                        e.target.style.display = "none";
                                        e.target.nextSibling.style.display =
                                          "block";
                                      }}
                                    />
                                    <div className="absolute top-2 right-2 bg-green-600 text-white px-2 py-1 rounded text-xs font-bold">
                                      MAKER WORK
                                    </div>
                                    {/* Error fallback */}
                                    <div className="hidden p-4 text-center text-red-500 border-2 border-red-300 rounded-lg bg-red-50">
                                      📷 Photo not available
                                    </div>
                                  </div>
                                  <p
                                    className="text-xs mt-1"
                                    style={{
                                      color: themeConfig.textSecondary,
                                    }}
                                  >
                                    Click to view full size
                                  </p>
                                </div>
                              );
                            } else {
                              return (
                                <div
                                  className="p-4 text-center border-2 border-dashed rounded-lg"
                                  style={{ borderColor: themeConfig.border }}
                                >
                                  <p
                                    className="text-sm"
                                    style={{
                                      color: themeConfig.textSecondary,
                                    }}
                                  >
                                    📷 No photos submitted by MAKER
                                  </p>
                                  <p
                                    className="text-xs mt-1"
                                    style={{
                                      color: themeConfig.textSecondary,
                                    }}
                                  >
                                    {/* Debug:{" "}
                                      {JSON.stringify(
                                        Object.keys(latestSubmission)
                                      )} */}
                                  </p>
                                </div>
                              );
                            }
                          })()}
                        </div>

                        {/* Submission Details */}
                        <div
                          className="text-xs"
                          style={{ color: themeConfig.textSecondary }}
                        >
                          <p>
                            Submitted:{" "}
                            {new Date(
                              latestSubmission.created_at,
                            ).toLocaleString()}
                          </p>
                          <p>Attempt: {latestSubmission.attempts || 1}</p>
                          <p>Submission ID: {latestSubmission.id}</p>
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <p
                    className="text-sm"
                    style={{ color: themeConfig.textSecondary }}
                  >
                    No MAKER submissions found for this item.
                  </p>
                )}
              </div>

              {/* SUPERVISOR's Review Section */}
              <div
                className="p-4 rounded-xl"
                style={{
                  background: `${themeConfig.warning}10`,
                  border: `1px solid ${themeConfig.warning}30`,
                }}
              >
                <h4
                  className="font-medium mb-4"
                  style={{ color: themeConfig.textPrimary }}
                >
                  👀 Your Review Decision
                </h4>

                {/* SUPERVISOR Remarks */}
                <div className="mb-4">
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: themeConfig.textPrimary }}
                  >
                    Your Review Comments
                  </label>
                  <textarea
                    value={supervisorRemarks}
                    onChange={(e) => setSupervisorRemarks(e.target.value)}
                    placeholder="Add your review comments here..."
                    className="w-full p-3 rounded-lg border-2 text-sm"
                    style={{
                      background: themeConfig.cardBg,
                      borderColor: `${themeConfig.border}60`,
                      color: themeConfig.textPrimary,
                      minHeight: "100px",
                    }}
                    rows="4"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div
                className="flex items-center justify-end gap-3 pt-4 border-t"
                style={{ borderColor: themeConfig.border }}
              >
                <button
                  onClick={() => {
                    setShowSupervisorReviewModal(false);
                    setSelectedItemForSupervisorReview(null);
                    setSupervisorRemarks("");
                  }}
                  className="px-6 py-2 rounded-lg font-medium text-sm transition-all"
                  style={{
                    background: themeConfig.textSecondary,
                    color: "white",
                  }}
                >
                  Cancel
                </button>

                {/* REOPEN Button */}
                <button
                  onClick={async () => {
                    setSubmittingSupervisorDecision(true);

                    // ✨ Add this block for validation
                    if (!supervisorRemarks.trim()) {
                      showToast("Remarks are required for Supervisor", "error");
                      return;
                    }

                    setShowSupervisorError(false);
                    // ✨ End block

                    try {
                      const token = localStorage.getItem("ACCESS_TOKEN");
                      const failOption =
                        selectedItemForSupervisorReview.options?.find(
                          (opt) => opt.choice === "N",
                        );

                      if (!failOption) {
                        toast.error("No FAIL option found for rejection");
                        setSubmittingSupervisorDecision(false); // Add this so button is re-enabled
                        return;
                      }

                      const payload = {
                        checklist_item_id: selectedItemForSupervisorReview.id,
                        role: "supervisor",
                        option_id: failOption.id,
                        check_remark:
                          supervisorRemarks || "Rejected by supervisor",
                      };

                      const response = await checklistInstance.patch(
                        VERIFY_ITEM_API,
                        payload,
                        {
                          headers: { Authorization: `Bearer ${token}` },
                        },
                      );

                      if (response.status === 200) {
                        toast.success(
                          "✅ Work rejected and sent back to MAKER!",
                          {
                            duration: 4000,
                            style: {
                              background: themeConfig.error,
                              color: "white",
                              borderRadius: "12px",
                              padding: "16px",
                            },
                          },
                        );

                        setShowSupervisorReviewModal(false);
                        setSupervisorRemarks("");
                        window.location.reload();
                      }
                    } catch (err) {
                      console.error("❌ Failed SUPERVISOR reject:", err);
                      toast.error(
                        `❌ ${err.response?.data?.detail || "Failed to reject work"}`,
                        {
                          style: {
                            background: themeConfig.error,
                            color: "white",
                            borderRadius: "12px",
                          },
                        },
                      );
                    } finally {
                      setSubmittingSupervisorDecision(false);
                    }
                  }}
                  disabled={submittingSupervisorDecision}
                  className="px-6 py-3 rounded-lg font-medium text-sm transition-all duration-300 transform hover:scale-105"
                  style={{
                    background: `linear-gradient(135deg, ${themeConfig.error}, ${themeConfig.error}dd)`,
                    color: "white",
                    border: `2px solid ${themeConfig.error}`,
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span>❌</span>
                    <span>Reject & Return to MAKER</span>
                  </div>
                </button>

                {/* APPROVE Button */}
                <button
                  onClick={async () => {
                    if (!supervisorRemarks.trim()) {
                      showToast("Remarks are required for Supervisor", "error");
                      return;
                    }

                    setSubmittingSupervisorDecision(true);

                    try {
                      const token = localStorage.getItem("ACCESS_TOKEN");
                      const passOption =
                        selectedItemForSupervisorReview.options?.find(
                          (opt) => opt.choice === "P",
                        );

                      if (!passOption) {
                        toast.error("No PASS option found for approval", {
                          style: {
                            background: themeConfig.error,
                            color: "white",
                            borderRadius: "12px",
                          },
                        });
                        setSubmittingSupervisorDecision(false);
                        return;
                      }

                      const payload = {
                        checklist_item_id: selectedItemForSupervisorReview.id,
                        role: "supervisor",
                        option_id: passOption.id,
                        check_remark: supervisorRemarks,
                      };

                      const response = await checklistInstance.patch(
                        VERIFY_ITEM_API,
                        payload,
                        {
                          headers: { Authorization: `Bearer ${token}` },
                        },
                      );

                      if (response.status === 200) {
                        toast.success("✅ Work approved and sent to CHECKER!", {
                          duration: 4000,
                          style: {
                            background: themeConfig.success,
                            color: "white",
                            borderRadius: "12px",
                            padding: "16px",
                          },
                        });

                        setShowSupervisorReviewModal(false);
                        setSupervisorRemarks("");
                        window.location.reload();
                      }
                    } catch (err) {
                      toast.error(
                        `❌ ${err.response?.data?.detail || "Failed to approve work"}`,
                        {
                          style: {
                            background: themeConfig.error,
                            color: "white",
                            borderRadius: "12px",
                          },
                        },
                      );
                    } finally {
                      setSubmittingSupervisorDecision(false);
                    }
                  }}
                  disabled={submittingSupervisorDecision}
                  className="px-6 py-3 rounded-lg font-medium text-sm transition-all duration-300 transform hover:scale-105"
                  style={{
                    background: `linear-gradient(135deg, ${themeConfig.success}, ${themeConfig.success}dd)`,
                    color: "white",
                    border: `2px solid ${themeConfig.success}`,
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span>✅</span>
                    <span>Approve to CHECKER</span>
                  </div>
                </button>
              </div>
            </div>

            <PaginationBar />
          </div>
        </div>
      )}

      <HistoryModal />
      <ConfirmationDialog />

      {showReportFilter && (
        <ReportFilterModal
          onClose={() => setShowReportFilter(false)}
          onApply={handleGenerateReport}
          themeConfig={themeConfig}
          currentStage={stageInfo?.stage_name || "Current Stage"}
          categoryOptions={categoryOptions}
          stageOptions={stageOptions}
          defaultStageId={stageId}
        />
      )}
      {showOverviewFilter && (
        <OverviewFilterModal
          onClose={() => setShowOverviewFilter(false)}
          onApply={(filters) => {
            setLastOverviewFilters(filters);
            handleDownloadOverview(flatId, filters, setOverviewLoading);
            setShowOverviewFilter(false);
          }}
          themeConfig={themeConfig}
          categoryOptions={categoryOptions}
          stageOptions={stageOptions}
          defaultStageId={stageId}
        />
      )}
    </div>
  );
};

const WrappedFlatInspectionPage = () => {
  const { theme } = useTheme();
  return (
    <ErrorBoundary theme={{ pageBg: theme === "dark" ? "#191922" : "#fcfaf7" }}>
      <FlatInspectionPage />
    </ErrorBoundary>
  );
};

export default WrappedFlatInspectionPage;