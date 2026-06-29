import React, { useEffect, useMemo, useState } from "react";
import {
  Copy,
  Download,
  RefreshCw,
  Search,
  CalendarDays,
  Users,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronRight,
  Building2,
} from "lucide-react";
import { Allprojects, getProjectsByOwnership } from "../api";
// --- Small helpers ----------------------------------------------------------
function getActiveProjectId() {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const q = urlParams.get("project_id");
    if (q) return Number(q);
  } catch {}
  const ls =
    localStorage.getItem("ACTIVE_PROJECT_ID") ||
    localStorage.getItem("PROJECT_ID");
  return ls ? Number(ls) : null;
}

function getAuthToken() {
  const keys = [
    "ACCESS_TOKEN",
    "accessToken",
    "AUTH_TOKEN",
    "authToken",
    "token",
  ];
  for (const k of keys) {
    const v = localStorage.getItem(k) || sessionStorage.getItem(k);
    if (v) return v.replace(/^Bearer\s+/i, "");
  }
  return "";
}

function classNames(...xs) {
  return xs.filter(Boolean).join(" ");
}

function todayYYYYMMDD() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function formatDateTime(s) {
  if (!s) return "—";
  try {
    const d = new Date(s);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${dd}-${mm}-${yy} ${hh}:${min}`;
  } catch {
    return s;
  }
}

function useDebounce(value, delay = 500) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}
// helpers (top of file)
const NORM = (r) =>
  String(r || "")
    .trim()
    .toUpperCase();
const toTitle = (s) =>
  String(s || "")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

const ORANGE = "#ffbe63";
const BG_OFFWHITE = "#fcfaf7";

// const ROLE_OPTIONS = [
//   { key: "STAFF", label: "Staff", color: "bg-orange-50 text-orange-700 border-orange-200" },
//   { key: "CHECKER", label: "Checker", color: "bg-orange-100 text-orange-800 border-orange-300" },
//   { key: "MAKER", label: "Maker", color: "bg-amber-50 text-amber-700 border-amber-200" },
//   { key: "SUPERVISOR", label: "Supervisor", color: "bg-yellow-50 text-yellow-700 border-yellow-200" },
//   { key: "Intializer", label: "Initializer", color: "bg-orange-50 text-orange-800 border-orange-300" },
//   { key: "SECURITY_GUARD", label: "Security", color: "bg-orange-50 text-orange-600 border-orange-200" },
// ];
const ROLE_OPTIONS = [
  {
    key: "STAFF",
    label: "Staff",
    color: "bg-orange-50 text-orange-700 border-orange-200",
  },
  {
    key: "CHECKER",
    label: "Checker",
    color: "bg-orange-100 text-orange-800 border-orange-300",
  },
  {
    key: "MAKER",
    label: "Maker",
    color: "bg-amber-50 text-amber-700 border-amber-200",
  },
  {
    key: "SUPERVISOR",
    label: "Supervisor",
    color: "bg-yellow-50 text-yellow-700 border-yellow-200",
  },
  {
    key: "INITIALIZER",
    label: "Initializer",
    color: "bg-orange-50 text-orange-800 border-orange-300",
  },
  {
    key: "SECURITY_GUARD",
    label: "Security",
    color: "bg-orange-50 text-orange-600 border-orange-200",
  },
];
function RoleBadge({ role }) {
  const R = NORM(role);
  const conf = ROLE_OPTIONS.find((r) => r.key === R) || {
    color: "bg-orange-50 text-orange-700 border-orange-200",
    label: toTitle(R),
  };
  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold border ${conf.color}`}
    >
      {conf.label}
    </span>
  );
}

// function RoleBadge({ role }) {
//   const conf = ROLE_OPTIONS.find((r) => r.key === role) || {
//     color: "bg-orange-50 text-orange-700 border-orange-200",
//     label: role,
//   };
//   return (
//     <span className={classNames("px-3 py-1 rounded-full text-xs font-semibold border", conf.color)}>
//       {conf.label || role}
//     </span>
//   );
// }

function PresentPill({ present }) {
  return present ? (
    <span className="inline-flex items-center gap-1.5 text-green-700 bg-green-50 border border-green-200 px-3 py-1 rounded-full text-xs font-semibold">
      <CheckCircle2 className="w-3.5 h-3.5" /> Present today
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1 rounded-full text-xs font-semibold">
      <XCircle className="w-3.5 h-3.5" /> Absent today
    </span>
  );
}

// --- Main page --------------------------------------------------------------
export default function AttendanceProjectPage() {
  const [theme] = useState("light"); // You can connect this to your theme context
  const [projectId, setProjectId] = useState(getActiveProjectId());
  const [selectedRoles, setSelectedRoles] = useState(() =>
    ROLE_OPTIONS.map((r) => r.key),
  );
  const [search, setSearch] = useState("");
  const searchDebounced = useDebounce(search, 500);
  const [date, setDate] = useState(todayYYYYMMDD());
  const [includeToday, setIncludeToday] = useState(true);
  const [uid, setUid] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  // Project info state
  const [projectInfo, setProjectInfo] = useState(null);
  const [projectsCache, setProjectsCache] = useState({});
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);

  // const API_BASE = "https://konstruct.world/users";
  // const PROJECTS_API = "https://konstruct.world/projects/projects";

  // LOCAL
  const API_BASE = "/users-api";
  const PROJECTS_API = "/projects-api/projects";

  // Theme colors
  const bgColor = theme === "dark" ? "#191922" : BG_OFFWHITE;
  const cardColor = theme === "dark" ? "#23232c" : "#fff";
  const borderColor = ORANGE;
  const textColor = theme === "dark" ? "#fff" : "#222";
  const iconColor = ORANGE;
  const setActiveProject = (idOrEmpty) => {
    const id = idOrEmpty ? Number(idOrEmpty) : null;
    setProjectId(id);
    if (id) {
      const p = projects.find((x) => Number(x.id) === id);
      if (p) setProjectInfo((prev) => ({ ...(prev || {}), ...p }));
    }
    const url = new URL(window.location.href);
    if (id) url.searchParams.set("project_id", String(id));
    else url.searchParams.delete("project_id");
    window.history.replaceState({}, "", url.toString());
    if (id) {
      localStorage.setItem("ACTIVE_PROJECT_ID", String(id));
      localStorage.setItem("PROJECT_ID", String(id));
    } else {
      localStorage.removeItem("ACTIVE_PROJECT_ID");
      localStorage.removeItem("PROJECT_ID");
    }
  };

  const queryUrl = useMemo(() => {
    if (!projectId) return "";
    const u = new URL(
      `${API_BASE}/v2/attendance/project/`,
      window.location.origin,
    );
    u.searchParams.set("project_id", String(projectId));
    // u.searchParams.set("roles", selectedRoles.join(","));
    u.searchParams.set("roles", selectedRoles.map(NORM).join(","));

    if (date) u.searchParams.set("date", date);
    if (searchDebounced) u.searchParams.set("q", searchDebounced);
    if (includeToday) u.searchParams.set("include_atten_baby", "true");
    if (uid) u.searchParams.set("uid", uid);
    u.searchParams.set("page", String(page));
    u.searchParams.set("page_size", String(pageSize));
    return u.toString();
  }, [
    API_BASE,
    projectId,
    selectedRoles,
    date,
    searchDebounced,
    includeToday,
    uid,
    page,
    pageSize,
  ]);

  // Fetch available projects from user's accesses
  async function loadProjects() {
    try {
      setLoadingProjects(true);
      const role = (localStorage.getItem("ROLE") || "").toLowerCase();
      const userStr = localStorage.getItem("USER_DATA");
      const user =
        userStr && userStr !== "undefined" ? JSON.parse(userStr) : null;

      let resp = null;
      if (role === "super admin") {
        // all projects for super admin
        resp = await Allprojects();
      } else if (role === "manager" || role === "admin") {
        // org-level projects
        const orgId =
          user?.org ||
          user?.organization_id ||
          Number(localStorage.getItem("ORGANIZATION_ID"));
        if (!orgId) {
          setProjects([]);
          return;
        }
        resp = await getProjectsByOwnership({
          organization_id: orgId,
          company_id: null,
          entity_id: null,
        });
      } else if (user) {
        // fallback: prefer org, else company, else entity
        const orgId = user?.org || user?.organization_id || null;
        const companyId = orgId ? null : user?.company_id || null;
        const entityId = orgId || companyId ? null : user?.entity_id || null;
        resp = await getProjectsByOwnership({
          organization_id: orgId,
          company_id: companyId,
          entity_id: entityId,
        });
      }

      const list = Array.isArray(resp?.data)
        ? resp.data
        : Array.isArray(resp?.data?.results)
          ? resp.data.results
          : resp?.data || [];

      setProjects(list || []);

      // auto-select only if exactly one project is available
      if (!projectId && Array.isArray(list) && list.length === 1) {
        setActiveProject(list[0].id);
      }
    } catch (e) {
      console.error("[Attendance] loadProjects failed", e);
      setProjects([]);
    } finally {
      setLoadingProjects(false);
    }
  }
  // Fetch project info
  async function fetchProjectInfo(pid) {
    if (!pid) return;
    if (projectsCache[pid]) {
      setProjectInfo(projectsCache[pid]);
      return;
    }

    try {
      const token = getAuthToken();
      const res = await fetch(`${PROJECTS_API}/${pid}/`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const json = await res.json();
        setProjectInfo(json);
        setProjectsCache((prev) => ({ ...prev, [pid]: json }));
      }
    } catch (e) {
      console.error("Failed to fetch project info:", e);
    }
  }

  async function fetchData() {
    if (!projectId) return;
    setLoading(true);
    setError("");
    try {
      const token = getAuthToken();
      const res = await fetch(queryUrl, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(`${res.status} ${res.statusText}: ${t}`);
      }
      const json = await res.json();
      setData(json);
    } catch (e) {
      setError(e?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    if (!projects.length) return;
    if (!projectId && projects.length === 1) {
      setActiveProject(projects[0].id);
      return;
    }
    // If saved/URL id is not in the new list, correct it
    if (
      projectId &&
      !projects.some((p) => Number(p.id) === Number(projectId))
    ) {
      setActiveProject(projects[0].id);
    }
  }, [projects, projectId]);
  // useEffect(() => {
  //   if (!projectId && projects.length === 1) {
  //     setActiveProject(projects[0].id);
  //   }
  // }, [projects]); // run when the list arrives

  useEffect(() => {
    loadProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (projectId) {
      fetchProjectInfo(projectId);
    }
  }, [projectId]);

  useEffect(() => {
    setPage(1);
  }, [
    projectId,
    selectedRoles.join(","),
    date,
    searchDebounced,
    includeToday,
    uid,
  ]);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryUrl]);

  // function toggleRole(role) {
  //   setSelectedRoles((prev) =>
  //     prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
  //   );
  // }

  function toggleRole(role) {
    const R = NORM(role);
    setSelectedRoles((prev) =>
      prev.includes(R) ? prev.filter((x) => x !== R) : [...prev, R],
    );
  }

  function handleProjectChange(e) {
    setActiveProject(e.target.value);
  }

  async function copyUrl() {
    if (!queryUrl) return;
    await navigator.clipboard.writeText(queryUrl);
  }

  function exportCsv() {
    if (!data) return;
    const rows = [];
    rows.push(
      [
        "project_id",
        "project_name",
        "user_id",
        "username",
        "name",
        "roles",
        "records",
        "present_days",
        "today_present",
        "today_in_first",
        "today_out_last",
      ].join(","),
    );

    for (const item of data.results || []) {
      const u = item.user || {};
      const name =
        `${u.first_name || ""} ${u.last_name || ""}`.trim() || u.username || "";
      const roles = (u.roles || []).join("|");
      const recs = item.summary?.records ?? 0;
      const pdays = item.summary?.present_days ?? 0;
      const today = item.today || {};
      const tRecs = today.records || [];
      const tIn = tRecs.length ? tRecs[0].check_in_at || "" : "";
      const tOut = tRecs.length
        ? tRecs[tRecs.length - 1].check_out_at || ""
        : "";
      rows.push(
        [
          data.project_id,
          `"${(projectInfo?.name || "").replaceAll('"', '""')}"`,
          u.id,
          u.username || "",
          `"${name.replaceAll('"', '""')}"`,
          `"${roles}"`,
          recs,
          pdays,
          today.present ? 1 : 0,
          tIn,
          tOut,
        ].join(","),
      );
    }

    const blob = new Blob([rows.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance_${projectInfo?.name || `project_${data.project_id}`}_${date || todayYYYYMMDD()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const totalUsers = data?.total_users || 0;
  const maxPage = Math.max(1, Math.ceil(totalUsers / pageSize));

  return (
    <div className="min-h-screen" style={{ background: bgColor }}>
      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div
          className="rounded-2xl p-6 mb-6 border-2 shadow-lg"
          style={{ background: cardColor, borderColor }}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-xl" style={{ background: ORANGE }}>
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1
                    className="text-2xl font-bold tracking-tight"
                    style={{ color: textColor }}
                  >
                    {projectInfo?.name ||
                      (projectId ? `Project ${projectId}` : "Select a Project")}
                  </h1>
                  <p
                    className="text-sm mt-0.5"
                    style={{ color: theme === "dark" ? "#bfa672" : "#9c670d" }}
                  >
                    {projectId
                      ? "Attendance Management • IST Timezone"
                      : "Choose a project to view attendance records"}
                  </p>
                </div>
              </div>
              {projectInfo && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {projectInfo.organization_id && (
                    <span
                      className="px-3 py-1 rounded-full text-xs font-semibold"
                      style={{
                        background: "#fff6ea",
                        color: "#9c670d",
                        border: `1px solid ${borderColor}`,
                      }}
                    >
                      Org ID: {projectInfo.organization_id}
                    </span>
                  )}
                  {projectInfo.buildings?.length > 0 && (
                    <span
                      className="px-3 py-1 rounded-full text-xs font-semibold"
                      style={{
                        background: "#fff6ea",
                        color: "#9c670d",
                        border: `1px solid ${borderColor}`,
                      }}
                    >
                      {projectInfo.buildings.length} Building(s)
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <select
                value={projectId ?? ""}
                onChange={(e) => setActiveProject(e.target.value)}
                className="rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none"
                style={{
                  background: "#fff",
                  color: "#9c670d",
                  border: `1.5px solid ${borderColor}`,
                }}
              >
                <option value="" disabled>
                  {loadingProjects
                    ? "Loading…"
                    : projects.length
                      ? "Select a project"
                      : "No projects found"}
                </option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name || `Project ${p.id}`}
                  </option>
                ))}
              </select>
              <button
                onClick={fetchData}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all hover:shadow-md"
                style={{
                  background: "#fff",
                  color: "#9c670d",
                  border: `1.5px solid ${borderColor}`,
                }}
              >
                <RefreshCw className="w-4 h-4" /> Refresh
              </button>
              <button
                onClick={exportCsv}
                disabled={!data}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all hover:shadow-md disabled:opacity-50"
                style={{
                  background: ORANGE,
                  color: "#8a4c00",
                  border: `1.5px solid ${borderColor}`,
                }}
              >
                <Download className="w-4 h-4" /> Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* Filters card */}
        <div
          className="rounded-2xl p-5 mb-6 border-2 shadow-lg"
          style={{ background: cardColor, borderColor }}
        >
          <h3
            className="text-base font-bold mb-4 flex items-center gap-2"
            style={{ color: textColor }}
          >
            <Search className="w-5 h-5" style={{ color: iconColor }} />
            Filters & Search
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Project Dropdown */}
            {/* Project Dropdown */}
            <label className="block">
              <span
                className="text-xs font-semibold mb-1.5 flex items-center gap-1.5 block"
                style={{ color: theme === "dark" ? "#bfa672" : "#9c670d" }}
              >
                Project (Manager-assigned)
              </span>
              <select
                value={projectId ?? ""}
                onChange={(e) => setActiveProject(e.target.value)}
                className="w-full rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 transition-all"
                style={{
                  border: `1.5px solid ${borderColor}`,
                  background: "#fff",
                  color: textColor,
                }}
              >
                <option value="" disabled>
                  {loadingProjects
                    ? "Loading…"
                    : projects.length
                      ? "Select a project"
                      : "No projects found"}
                </option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name || `Project ${p.id}`}
                  </option>
                ))}
              </select>
            </label>

            {/* Date */}
            <label className="block">
              <span
                className="text-xs font-semibold mb-1.5 flex items-center gap-1.5 block"
                style={{ color: theme === "dark" ? "#bfa672" : "#9c670d" }}
              >
                <CalendarDays className="w-3.5 h-3.5" /> Date (IST)
              </span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 transition-all"
                style={{
                  border: `1.5px solid ${borderColor}`,
                  background: "#fff",
                  color: textColor,
                }}
              />
            </label>

            {/* Search */}
            <label className="block">
              <span
                className="text-xs font-semibold mb-1.5 flex items-center gap-1.5 block"
                style={{ color: theme === "dark" ? "#bfa672" : "#9c670d" }}
              >
                <Search className="w-3.5 h-3.5" /> Search User
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="name / username / email / phone"
                className="w-full rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 transition-all"
                style={{
                  border: `1.5px solid ${borderColor}`,
                  background: "#fff",
                  color: textColor,
                }}
              />
            </label>

            {/* Optional UID filter */}
            <label className="block">
              <span
                className="text-xs font-semibold mb-1.5 block"
                style={{ color: theme === "dark" ? "#bfa672" : "#9c670d" }}
              >
                User ID (optional)
              </span>
              <input
                type="number"
                value={uid}
                onChange={(e) => setUid(e.target.value)}
                placeholder="e.g. 601"
                className="w-full rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 transition-all"
                style={{
                  border: `1.5px solid ${borderColor}`,
                  background: "#fff",
                  color: textColor,
                }}
              />
            </label>
          </div>

          {/* Roles & switches */}
          <div className="mt-4 pt-4 border-t" style={{ borderColor }}>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="text-xs font-semibold mr-2"
                style={{ color: theme === "dark" ? "#bfa672" : "#9c670d" }}
              >
                Filter by Roles:
              </span>
              {ROLE_OPTIONS.map(({ key, label }) => {
                const active = selectedRoles.includes(key);
                return (
                  <button
                    key={key}
                    onClick={() => toggleRole(key)}
                    className={classNames(
                      "px-4 py-2 rounded-full text-sm font-semibold transition-all",
                      active ? "shadow-md" : "opacity-60 hover:opacity-100",
                    )}
                    style={{
                      background: active ? ORANGE : "#fff",
                      color: active ? "#8a4c00" : "#9c670d",
                      border: `1.5px solid ${borderColor}`,
                    }}
                    title={key}
                  >
                    {label}
                  </button>
                );
              })}

              <label
                className="ml-auto inline-flex items-center gap-2 text-sm font-semibold select-none cursor-pointer px-3 py-2 rounded-xl"
                style={{ background: "#fff6ea", color: "#9c670d" }}
              >
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded accent-orange-500"
                  checked={includeToday}
                  onChange={(e) => setIncludeToday(e.target.checked)}
                  style={{ accentColor: ORANGE }}
                />
                Include Today's Status
              </label>
            </div>
          </div>

          {/* Pagination */}
          <div
            className="mt-4 pt-4 border-t flex flex-wrap items-center gap-4"
            style={{ borderColor }}
          >
            <span
              className="text-xs font-semibold"
              style={{ color: theme === "dark" ? "#bfa672" : "#9c670d" }}
            >
              Page Navigation:
            </span>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-50 transition-all hover:shadow-md"
              disabled={page <= 1}
              style={{
                background: "#fff",
                color: "#9c670d",
                border: `1.5px solid ${borderColor}`,
              }}
            >
              ← Prev
            </button>
            <span
              className="px-4 py-2 rounded-xl text-sm font-bold"
              style={{ background: ORANGE, color: "#8a4c00" }}
            >
              {page} / {maxPage}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(maxPage, p + 1))}
              className="px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-50 transition-all hover:shadow-md"
              disabled={page >= maxPage}
              style={{
                background: "#fff",
                color: "#9c670d",
                border: `1.5px solid ${borderColor}`,
              }}
            >
              Next →
            </button>

            <span
              className="ml-auto text-xs font-semibold"
              style={{ color: theme === "dark" ? "#bfa672" : "#9c670d" }}
            >
              Per Page:
            </span>
            <select
              className="rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2"
              style={{
                border: `1.5px solid ${borderColor}`,
                background: "#fff",
                color: textColor,
              }}
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
            >
              {[25, 50, 100, 200].map((n) => (
                <option key={n} value={n}>
                  {n} users
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Content */}
        <div>
          {!projectId && !loading && !error && (
            <div
              className="rounded-2xl p-12 border-2 shadow-lg text-center"
              style={{ background: cardColor, borderColor }}
            >
              <div
                className="inline-block p-6 rounded-full mb-4"
                style={{ background: "#fff6ea" }}
              >
                <Building2 className="w-16 h-16" style={{ color: iconColor }} />
              </div>
              <h3
                className="text-xl font-bold mb-2"
                style={{ color: textColor }}
              >
                No Project Selected
              </h3>
              <p
                className="text-sm font-medium mb-6"
                style={{ color: theme === "dark" ? "#bfa672" : "#9c670d" }}
              >
                {projects.length === 0 && !loadingProjects
                  ? "You don't have access to any projects yet."
                  : "Please select a project from the dropdown above to view attendance records."}
              </p>
              {loadingProjects && (
                <div
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl"
                  style={{ background: "#fff6ea", color: "#9c670d" }}
                >
                  <div
                    className="animate-spin rounded-full h-4 w-4 border-b-2"
                    style={{ borderColor: ORANGE }}
                  ></div>
                  Loading your assigned projects...
                </div>
              )}
            </div>
          )}

          {loading && (
            <div
              className="rounded-2xl p-8 border-2 shadow-lg text-center"
              style={{ background: cardColor, borderColor }}
            >
              <div
                className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 mb-3"
                style={{ borderColor: ORANGE }}
              ></div>
              <p
                className="text-sm font-medium"
                style={{ color: theme === "dark" ? "#bfa672" : "#9c670d" }}
              >
                Loading attendance data...
              </p>
            </div>
          )}
          {error && (
            <div
              className="rounded-2xl p-5 border-2 shadow-lg"
              style={{
                background: "#fff3e6",
                color: "#b94a00",
                borderColor: "#ff8c42",
              }}
            >
              <p className="font-semibold">⚠️ {error}</p>
            </div>
          )}

          {data && (
            <div
              className="rounded-2xl border-2 shadow-lg overflow-hidden"
              style={{ background: cardColor, borderColor }}
            >
              <div
                className="flex items-center justify-between px-5 py-4 border-b-2"
                style={{ background: "#fff6ea", borderColor }}
              >
                <div
                  className="flex items-center gap-2.5 font-bold"
                  style={{ color: textColor }}
                >
                  <Users className="w-5 h-5" style={{ color: iconColor }} />
                  Total Users:
                  <span
                    className="px-3 py-1 rounded-full text-sm"
                    style={{ background: ORANGE, color: "#8a4c00" }}
                  >
                    {data.total_users}
                  </span>
                </div>
                <div
                  className="text-xs font-semibold"
                  style={{ color: theme === "dark" ? "#bfa672" : "#9c670d" }}
                >
                  Date:{" "}
                  {data.filters?.date ||
                    `${data.filters?.start_date} → ${data.filters?.end_date}`}
                </div>
              </div>

              <div className="divide-y-2" style={{ borderColor }}>
                {(data.results || []).map((row) => (
                  <UserRow
                    key={row.user?.id}
                    row={row}
                    theme={theme}
                    bgColor={bgColor}
                    cardColor={cardColor}
                    borderColor={borderColor}
                    textColor={textColor}
                    iconColor={iconColor}
                    ORANGE={ORANGE}
                  />
                ))}
                {(data.results || []).length === 0 && (
                  <div className="p-12 text-center">
                    <div
                      className="inline-block p-4 rounded-full mb-3"
                      style={{ background: "#fff6ea" }}
                    >
                      <Users className="w-8 h-8" style={{ color: iconColor }} />
                    </div>
                    <p
                      className="text-sm font-medium"
                      style={{
                        color: theme === "dark" ? "#bfa672" : "#9c670d",
                      }}
                    >
                      No users matched your filters.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function UserRow({
  row,
  theme,
  bgColor,
  cardColor,
  borderColor,
  textColor,
  iconColor,
  ORANGE,
}) {
  const [open, setOpen] = useState(false);
  const u = row.user || {};
  const firstName = u.first_name || "";
  const lastName = u.last_name || "";
  const fullName = `${firstName} ${lastName}`.trim();
  const displayName = fullName || u.username || `User ${u.id}`;
  const roles = (u.roles || []).map(NORM);

  // const roles = u.roles || [];
  const today = row.today || { present: false, date: "", records: [] };

  const tRecs = today.records || [];
  const tIn = tRecs.length ? tRecs[0].check_in_at : null;
  const tOut = tRecs.length ? tRecs[tRecs.length - 1].check_out_at : null;

  return (
    <div className="px-5 py-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setOpen((v) => !v)}
            className="rounded-xl p-2 transition-all hover:shadow-md"
            style={{ border: `1.5px solid ${borderColor}`, background: "#fff" }}
          >
            {open ? (
              <ChevronDown className="w-4 h-4" style={{ color: iconColor }} />
            ) : (
              <ChevronRight className="w-4 h-4" style={{ color: iconColor }} />
            )}
          </button>

          {/* Avatar */}
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg"
            style={{ background: ORANGE, color: "#fff" }}
          >
            {(
              firstName?.[0] ||
              lastName?.[0] ||
              u.username?.[0] ||
              "U"
            ).toUpperCase()}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span
                className="font-bold text-base"
                style={{ color: textColor }}
              >
                {displayName}
              </span>
              {u.username && fullName && (
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{ background: "#fff6ea", color: "#9c670d" }}
                >
                  @{u.username}
                </span>
              )}
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {roles.map((r) => (
                <RoleBadge key={r} role={r} />
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 text-sm">
          <div className="hidden sm:flex items-center gap-4">
            <div
              className="px-3 py-1.5 rounded-xl"
              style={{
                background: "#fff6ea",
                border: `1px solid ${borderColor}`,
              }}
            >
              <span
                className="text-xs font-medium"
                style={{ color: "#9c670d" }}
              >
                Records:{" "}
              </span>
              <span className="font-bold" style={{ color: textColor }}>
                {row.summary?.records ?? 0}
              </span>
            </div>
            <div
              className="px-3 py-1.5 rounded-xl"
              style={{
                background: "#fff6ea",
                border: `1px solid ${borderColor}`,
              }}
            >
              <span
                className="text-xs font-medium"
                style={{ color: "#9c670d" }}
              >
                Present Days:{" "}
              </span>
              <span className="font-bold" style={{ color: textColor }}>
                {row.summary?.present_days ?? 0}
              </span>
            </div>
          </div>
          <PresentPill present={!!today.present} />
        </div>
      </div>

      {open && (
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Today card */}
          <div
            className="rounded-2xl p-4 border-2"
            style={{ background: "#fff6ea", borderColor }}
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className="font-bold flex items-center gap-2"
                style={{ color: textColor }}
              >
                <CalendarDays
                  className="w-4 h-4"
                  style={{ color: iconColor }}
                />
                Today (IST)
              </div>
              <span
                className="text-xs font-semibold px-2 py-1 rounded-full"
                style={{ background: ORANGE, color: "#8a4c00" }}
              >
                {today.date || "—"}
              </span>
            </div>
            <div className="text-sm space-y-2">
              {today.present ? (
                <div className="space-y-2">
                  <div
                    className="flex items-center justify-between px-3 py-2 rounded-lg"
                    style={{
                      background: "#fff",
                      border: `1px solid ${borderColor}`,
                    }}
                  >
                    <span
                      className="text-xs font-semibold"
                      style={{ color: "#9c670d" }}
                    >
                      Check In:
                    </span>
                    <span
                      className="font-bold text-sm"
                      style={{ color: textColor }}
                    >
                      {formatDateTime(tIn)}
                    </span>
                  </div>
                  <div
                    className="flex items-center justify-between px-3 py-2 rounded-lg"
                    style={{
                      background: "#fff",
                      border: `1px solid ${borderColor}`,
                    }}
                  >
                    <span
                      className="text-xs font-semibold"
                      style={{ color: "#9c670d" }}
                    >
                      Check Out:
                    </span>
                    <span
                      className="font-bold text-sm"
                      style={{ color: textColor }}
                    >
                      {formatDateTime(tOut)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4" style={{ color: "#9c670d" }}>
                  <XCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs font-medium">No attendance for today</p>
                </div>
              )}
            </div>

            {today.records?.length ? (
              <div className="mt-3 pt-3 border-t" style={{ borderColor }}>
                <div
                  className="text-xs font-bold mb-2"
                  style={{ color: "#9c670d" }}
                >
                  Raw Records
                </div>
                <ul className="max-h-48 overflow-auto space-y-2">
                  {today.records.map((r) => (
                    <li
                      key={r.id}
                      className="rounded-lg p-2 text-xs"
                      style={{
                        background: "#fff",
                        border: `1px solid ${borderColor}`,
                      }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className="font-bold"
                          style={{ color: textColor }}
                        >
                          #{r.id}
                        </span>
                        <span className="text-xs" style={{ color: "#9c670d" }}>
                          {formatDateTime(r.created_at)}
                        </span>
                      </div>
                      <div
                        className="grid grid-cols-2 gap-1"
                        style={{ color: textColor }}
                      >
                        <div>
                          <span className="font-semibold">IN:</span>{" "}
                          {formatDateTime(r.check_in_at)}
                        </div>
                        <div>
                          <span className="font-semibold">OUT:</span>{" "}
                          {formatDateTime(r.check_out_at)}
                        </div>
                        <div>
                          <span className="font-semibold">Lat:</span>{" "}
                          {r.lat_in ?? r.lat_out ?? "—"}
                        </div>
                        <div>
                          <span className="font-semibold">Lon:</span>{" "}
                          {r.lon_in ?? r.lon_out ?? "—"}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          {/* Main range summary */}
          <div
            className="rounded-2xl p-4 lg:col-span-2 border-2"
            style={{ background: "#fff6ea", borderColor }}
          >
            <div
              className="font-bold mb-3 flex items-center gap-2"
              style={{ color: textColor }}
            >
              <CheckCircle2 className="w-4 h-4" style={{ color: iconColor }} />
              Selected Date Range
            </div>
            {row.attendance?.length ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {row.attendance.map((r) => (
                  <div
                    key={r.id}
                    className="rounded-xl p-3 border"
                    style={{ background: "#fff", borderColor }}
                  >
                    <div
                      className="flex items-center justify-between mb-2"
                      style={{ color: textColor }}
                    >
                      <span className="font-bold">#{r.id}</span>
                      <span
                        className="text-xs font-semibold"
                        style={{ color: "#9c670d" }}
                      >
                        {formatDateTime(r.created_at)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div
                        className="px-2 py-1 rounded"
                        style={{ background: "#fff6ea" }}
                      >
                        <div
                          className="font-semibold mb-0.5"
                          style={{ color: "#9c670d" }}
                        >
                          IN
                        </div>
                        <div className="font-bold" style={{ color: textColor }}>
                          {formatDateTime(r.check_in_at)}
                        </div>
                      </div>
                      <div
                        className="px-2 py-1 rounded"
                        style={{ background: "#fff6ea" }}
                      >
                        <div
                          className="font-semibold mb-0.5"
                          style={{ color: "#9c670d" }}
                        >
                          OUT
                        </div>
                        <div className="font-bold" style={{ color: textColor }}>
                          {formatDateTime(r.check_out_at)}
                        </div>
                      </div>
                      <div
                        className="px-2 py-1 rounded"
                        style={{ background: "#fff6ea" }}
                      >
                        <div
                          className="font-semibold"
                          style={{ color: "#9c670d" }}
                        >
                          Lat: {r.lat_in ?? r.lat_out ?? "—"}
                        </div>
                      </div>
                      <div
                        className="px-2 py-1 rounded"
                        style={{ background: "#fff6ea" }}
                      >
                        <div
                          className="font-semibold"
                          style={{ color: "#9c670d" }}
                        >
                          Lon: {r.lon_in ?? r.lon_out ?? "—"}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div
                  className="inline-block p-4 rounded-full mb-2"
                  style={{ background: "#fff" }}
                >
                  <CalendarDays
                    className="w-8 h-8 opacity-50"
                    style={{ color: iconColor }}
                  />
                </div>
                <p className="text-sm font-medium" style={{ color: "#9c670d" }}>
                  No records in selected range
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
