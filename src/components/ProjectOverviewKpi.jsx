// // src/components/ProjectOverviewKpi.jsx
// import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
// import { useNavigate, useParams, useLocation } from "react-router-dom";
// import axios from "axios";
// import {
//   ClipboardList,
//   Clock,
//   CheckCircle2,
//   RefreshCcw,
//   PlayCircle,
//   Activity,
//   ShieldCheck,
//   X,
//   Download,
//   ExternalLink,
//   ChevronDown,
//   Search,
//   CheckSquare,
//   Square,
// } from "lucide-react";

// import {
//   getUnitStageRoleSummary,
//   fetchTowersByProject,
//   getStageDetailsByProjectId,
//   getLevelsWithFlatsByBuilding,
//   getUnitChecklistReport,
//   exportUnitChecklistReportExcel,
//   getUnitWorkInProgressBreakdown,
// } from "../api";

// const API_BASE = "https://konstruct.world";

// const authHeaders = () => ({
//   Authorization: `Bearer ${
//     localStorage.getItem("ACCESS_TOKEN") ||
//     localStorage.getItem("TOKEN") ||
//     localStorage.getItem("token") ||
//     ""
//   }`,
// });

// /* ---------------- helpers ---------------- */
// const num = (v) => {
//   const n = Number(v);
//   return Number.isFinite(n) ? n : null;
// };

// const fmtInt = (v) => {
//   const n = num(v);
//   if (n === null) return "—";
//   return n.toLocaleString("en-IN");
// };

// const titleize = (s) =>
//   String(s || "")
//     .replace(/_/g, " ")
//     .replace(/\b\w/g, (m) => m.toUpperCase());

// const splitLabel = (label) => {
//   const k = String(label || "").toLowerCase();
//   if (k === "maker_pending") return "Maker Pending Unit";
//   return titleize(label);
// };

// const roleLabel = (code) => {
//   const c = String(code || "").toUpperCase();
//   if (c === "MAKER") return "Maker";
//   if (c === "INSPECTOR") return "Inspector";
//   if (c === "CHECKER") return "Checker";
//   if (c === "SUPERVISOR") return "Supervisor";
//   return c || "—";
// };

// const pickRows = (data) => {
//   if (!data || typeof data !== "object") return [];
//   return (
//     data.rows ||
//     data.unit_rows ||
//     data.results ||
//     data.data?.rows ||
//     data.data?.results ||
//     []
//   );
// };

// const pickMeta = (data) => {
//   if (!data || typeof data !== "object") return {};
//   return data.meta || data.data?.meta || data.result?.meta || {};
// };

// const pickColumns = (data, rowsFallback = []) => {
//   const cols = data?.columns || data?.data?.columns;
//   if (Array.isArray(cols) && cols.length) return cols;
//   const first = rowsFallback?.[0];
//   if (first && typeof first === "object") return Object.keys(first);
//   return [];
// };

// const resolveProjectId = (routeParam) => {
//   const rp = Number(routeParam);
//   if (rp) return rp;

//   try {
//     const qp = new URLSearchParams(window.location.search).get("project_id");
//     const qn = Number(qp);
//     if (qn) return qn;
//   } catch {}

//   const ls =
//     localStorage.getItem("ACTIVE_PROJECT_ID") ||
//     localStorage.getItem("PROJECT_ID") ||
//     localStorage.getItem("project_id");
//   return Number(ls) || null;
// };

// const normalizeList = (res) => {
//   const d = res?.data ?? res;
//   if (Array.isArray(d)) return d;
//   if (Array.isArray(d?.results)) return d.results;
//   if (Array.isArray(d?.data)) return d.data;
//   return [];
// };

// const uniq = (arr) => Array.from(new Set((arr || []).filter(Boolean)));
// const toCsv = (arr) => {
//   const a = uniq(arr).map(String).filter(Boolean);
//   return a.length ? a.join(",") : null;
// };

// // const getFlatIdFromRow = (row) => {
// //   if (!row || typeof row !== "object") return null;
// //   return row.flat_id ?? row.flat ?? row.unit_id ?? row.unit ?? row.id ?? row.pk ?? null;
// // };

// const getFlatIdFromRow = (row) => {
//   if (!row || typeof row !== "object") return null;

//   const direct =
//     row.flat_id ??
//     row.flatId ??
//     row.unit_id ??
//     row.unitId ??
//     row.flat_pk ??
//     row.unit_pk ??
//     row.flatID ??
//     row.unitID ??
//     row.id ??
//     row.pk;

//   if (direct) return direct;

//   // sometimes API returns nested objects
//   const nestedFlat = row.flat && typeof row.flat === "object" ? (row.flat.id ?? row.flat.pk) : null;
//   if (nestedFlat) return nestedFlat;

//   const nestedUnit = row.unit && typeof row.unit === "object" ? (row.unit.id ?? row.unit.pk) : null;
//   if (nestedUnit) return nestedUnit;

//   // last resort common keys
//   return row.flat_number_id ?? row.unit_number_id ?? null;
// };


// const getNiceCellText = (v) => {
//   if (v === null || v === undefined) return "—";
//   if (typeof v === "object") return JSON.stringify(v);
//   const s = String(v);
//   return s === "" ? "—" : s;
// };

// const HIDE_COLS = new Set(["tower_id", "unit_id", "stage_id"]);
// const PERCENT_COLS = new Set([
//   "flat_readiness",
//   "maker_percent_open",
//   "maker_percent_close",
//   "maker_flat_readiness_percent",
//   "checker_percent_open",
//   "checker_percent_close",
//   "desnag_rejected_percent",
//   "overall_percent",
// ]);

// const RED_HIGHLIGHT_COLS = new Set(["flat_readiness", "maker_flat_readiness_percent"]);
// const DAYS_COUNT_COL = "no_of_days_count";

// const fmtPercent = (v) => {
//   const n = num(v);
//   if (n === null) return "—";
//   return `${Math.round(n)}%`;
// };

// const parseDateOnlyLocal = (ymd) => {
//   const s = String(ymd || "").trim();
//   if (!s) return null;
//   if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
//   const d = new Date(`${s}T00:00:00`);
//   return Number.isNaN(d.getTime()) ? null : d;
// };

// const daysDiff = (start, end) => {
//   if (!start || !end) return null;
//   const msPerDay = 24 * 60 * 60 * 1000;
//   const diff = Math.floor((end.getTime() - start.getTime()) / msPerDay);
//   return diff < 0 ? 0 : diff;
// };

// const computeDaysCount = (row) => {
//   if (!row || typeof row !== "object") return null;

//   const backendVal = row?.[DAYS_COUNT_COL];
//   const backendNum = num(backendVal);
//   if (backendNum !== null && String(backendVal).trim() !== "") {
//     return Math.max(0, Math.floor(backendNum));
//   }

//   const s = parseDateOnlyLocal(row?.start_date);
//   if (!s) return null;

//   const e = parseDateOnlyLocal(row?.end_date);
//   const now = new Date();
//   const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
//   const end = e || today;

//   return daysDiff(s, end);
// };

// const formatCell = (colKey, value, row) => {
//   const c = String(colKey || "");
//   if (c === DAYS_COUNT_COL) {
//     const d = computeDaysCount(row);
//     return d === null ? "—" : String(d);
//   }
//   if (PERCENT_COLS.has(c)) return fmtPercent(value);
//   return getNiceCellText(value);
// };

// function useDebouncedValue(value, delay = 250) {
//   const [debounced, setDebounced] = useState(value);
//   useEffect(() => {
//     const t = setTimeout(() => setDebounced(value), delay);
//     return () => clearTimeout(t);
//   }, [value, delay]);
//   return debounced;
// }

// /* ---------------- UI components ---------------- */
// const SectionCard = ({ children, className = "" }) => (
//   <div
//     className={[
//       "rounded-2xl border bg-white shadow-sm",
//       "ring-1 ring-slate-900/5",
//       className,
//     ].join(" ")}
//   >
//     {children}
//   </div>
// );

// const SoftLabel = ({ children }) => (
//   <div className="text-[11px] font-semibold tracking-wide text-slate-500">{children}</div>
// );

// const Card = ({ title, value, Icon, onClick }) => {
//   const clickable = typeof onClick === "function";
//   const Comp = clickable ? "button" : "div";

//   return (
//     <Comp
//       type={clickable ? "button" : undefined}
//       onClick={onClick}
//       className={[
//         "min-w-[220px] rounded-2xl border bg-white px-4 py-3 text-left",
//         "flex items-center justify-between gap-3",
//         "shadow-sm ring-1 ring-slate-900/5",
//         clickable
//           ? "hover:shadow-md hover:-translate-y-[1px] transition-all cursor-pointer"
//           : "",
//       ].join(" ")}
//       aria-label={clickable ? `Open ${title}` : undefined}
//     >
//       <div className="min-w-0">
//         <div className="text-[12px] font-semibold text-slate-600 truncate">{title}</div>
//         <div className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900">
//           {value}
//         </div>
//       </div>

//       <div className="shrink-0 rounded-2xl border bg-slate-50 p-2.5 text-slate-800 ring-1 ring-slate-900/5">
//         <Icon size={18} />
//       </div>
//     </Comp>
//   );
// };

// const MiniStat = ({ label, value }) => (
//   <div className="rounded-xl border bg-gradient-to-b from-white to-slate-50 px-3 py-2 ring-1 ring-slate-900/5">
//     <div className="text-[11px] font-semibold text-slate-600">{label}</div>
//     <div className="mt-0.5 text-lg font-extrabold tracking-tight text-slate-900">
//       {value}
//     </div>
//   </div>
// );

// const ChipButton = ({ active, children, onClick, title }) => (
//   <button
//     type="button"
//     title={title}
//     onClick={onClick}
//     className={[
//       "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold",
//       "ring-1 ring-slate-900/5",
//       active
//         ? "border-slate-900 bg-slate-900 text-white shadow-sm"
//         : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
//     ].join(" ")}
//   >
//     {children}
//   </button>
// );

// const FilterLabel = ({ children }) => (
//   <div className="text-xs font-semibold text-slate-600">{children}</div>
// );

// /** ✅ Multi-select dropdown with checkboxes + Search + Select All / Unselect All */
// const MultiSelectDropdown = ({
//   label,
//   value = [],
//   options = [],
//   onChange,
//   placeholder = "Select...",
//   disabled = false,
//   compact = false,
// }) => {
//   const [open, setOpen] = useState(false);
//   const [q, setQ] = useState("");
//   const wrapRef = useRef(null);

//   const selectedSet = useMemo(() => new Set((value || []).map(String)), [value]);

//   const filtered = useMemo(() => {
//     const s = String(q || "").trim().toLowerCase();
//     if (!s) return options || [];
//     return (options || []).filter((o) => String(o?.label || "").toLowerCase().includes(s));
//   }, [q, options]);

//   const selectedCount = (value || []).length;

//   const buttonText = useMemo(() => {
//     if (!selectedCount) return placeholder;
//     if (selectedCount === 1) {
//       const one = options.find((o) => String(o.value) === String(value[0]));
//       return one?.label || "1 selected";
//     }
//     return `${selectedCount} selected`;
//   }, [selectedCount, placeholder, options, value]);

//   useEffect(() => {
//     const onDown = (e) => {
//       if (!wrapRef.current) return;
//       if (!wrapRef.current.contains(e.target)) setOpen(false);
//     };
//     document.addEventListener("mousedown", onDown);
//     return () => document.removeEventListener("mousedown", onDown);
//   }, []);

//   const toggleVal = (val) => {
//     const v = String(val);
//     const next = new Set((value || []).map(String));
//     if (next.has(v)) next.delete(v);
//     else next.add(v);
//     onChange(Array.from(next));
//   };

//   const selectAllShown = () => {
//     const next = new Set((value || []).map(String));
//     filtered.forEach((o) => next.add(String(o.value)));
//     onChange(Array.from(next));
//   };

//   const unselectAllShown = () => {
//     const toRemove = new Set(filtered.map((o) => String(o.value)));
//     const next = (value || []).map(String).filter((v) => !toRemove.has(v));
//     onChange(next);
//   };

//   const clearAll = () => onChange([]);

//   return (
//     <div ref={wrapRef} className="relative">
//       <SoftLabel>{label}</SoftLabel>

//       <button
//         type="button"
//         disabled={disabled}
//         onClick={() => !disabled && setOpen((s) => !s)}
//         className={[
//           "mt-1 w-full rounded-xl border bg-white px-3 py-2 text-left text-sm",
//           "flex items-center justify-between gap-2",
//           "shadow-sm ring-1 ring-slate-900/5",
//           disabled ? "opacity-60 cursor-not-allowed" : "hover:bg-slate-50",
//         ].join(" ")}
//       >
//         <span className={selectedCount ? "text-slate-900 font-semibold" : "text-slate-500"}>
//           {buttonText}
//         </span>
//         <ChevronDown size={16} className="text-slate-400" />
//       </button>

//       {open ? (
//         <div
//           className={[
//             "absolute z-30 mt-2 w-full rounded-2xl border bg-white shadow-xl",
//             "ring-1 ring-slate-900/10 overflow-hidden",
//             compact ? "p-2" : "p-3",
//           ].join(" ")}
//         >
//           <div className="flex items-center gap-2 rounded-xl border bg-white px-2 py-1.5 ring-1 ring-slate-900/5">
//             <Search size={14} className="text-slate-400" />
//             <input
//               value={q}
//               onChange={(e) => setQ(e.target.value)}
//               placeholder="Search..."
//               className="w-full bg-transparent text-sm outline-none"
//             />
//           </div>

//           <div className="mt-2 flex flex-wrap items-center gap-2">
//             <button
//               type="button"
//               onClick={selectAllShown}
//               className="rounded-xl border bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 ring-1 ring-slate-900/5"
//             >
//               Select all
//             </button>
//             <button
//               type="button"
//               onClick={unselectAllShown}
//               className="rounded-xl border bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 ring-1 ring-slate-900/5"
//             >
//               Unselect all
//             </button>
//             {selectedCount ? (
//               <button
//                 type="button"
//                 onClick={clearAll}
//                 className="ml-auto rounded-xl border bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 ring-1 ring-slate-900/5"
//               >
//                 Clear
//               </button>
//             ) : null}
//           </div>

//           <div className="mt-2 max-h-56 overflow-auto rounded-xl border">
//             {filtered.length ? (
//               filtered.map((o) => {
//                 const isOn = selectedSet.has(String(o.value));
//                 return (
//                   <button
//                     key={String(o.value)}
//                     type="button"
//                     onClick={() => toggleVal(o.value)}
//                     className={[
//                       "w-full px-3 py-2 text-left text-sm flex items-center gap-2",
//                       "border-b last:border-0",
//                       isOn ? "bg-slate-50" : "",
//                       "hover:bg-slate-50",
//                     ].join(" ")}
//                   >
//                     {isOn ? (
//                       <CheckSquare size={16} className="text-slate-900" />
//                     ) : (
//                       <Square size={16} className="text-slate-400" />
//                     )}
//                     <span className="text-slate-800 font-medium">{o.label}</span>
//                   </button>
//                 );
//               })
//             ) : (
//               <div className="px-3 py-3 text-sm text-slate-600">No options found.</div>
//             )}
//           </div>
//         </div>
//       ) : null}
//     </div>
//   );
// };

// /* ---------------- Project name resolver ---------------- */
// const safeJson = (s) => {
//   try {
//     return JSON.parse(s);
//   } catch {
//     return null;
//   }
// };

// const resolveProjectNameLocal = (projectId) => {
//   const pid = String(projectId || "");

//   // 1) direct keys
//   const direct =
//     localStorage.getItem("ACTIVE_PROJECT_NAME") ||
//     localStorage.getItem("PROJECT_NAME") ||
//     localStorage.getItem("project_name");
//   if (direct && String(direct).trim()) return String(direct).trim();

//   // 2) active object
//   const activeRaw = localStorage.getItem("active") || localStorage.getItem("ACTIVE_PROJECT");
//   const active = safeJson(activeRaw);
//   if (active && typeof active === "object") {
//     const candidates = [
//       active?.project_name,
//       active?.projectName,
//       active?.name,
//       active?.title,
//       active?.project?.name,
//       active?.project?.project_name,
//       active?.project?.title,
//     ].filter(Boolean);

//     if (candidates.length) return String(candidates[0]).trim();

//     if (active?.id && String(active.id) === pid) {
//       const nm = active?.name || active?.project_name || active?.title;
//       if (nm) return String(nm).trim();
//     }
//   }

//   // 3) stored list
//   const listRaw = localStorage.getItem("projects") || localStorage.getItem("PROJECTS");
//   const list = safeJson(listRaw);
//   if (Array.isArray(list)) {
//     const found = list.find((x) => String(x?.id ?? x?.project_id ?? x?.pk) === pid);
//     const nm = found?.name || found?.project_name || found?.title;
//     if (nm) return String(nm).trim();
//   }

//   return "";
// };

// /**
//  * ✅ New KPI Overview (top section)
//  * + Project Name at top (ProjectOverview jaisa)
//  */
// export default function ProjectOverviewKpi({ projectId: projectIdProp = null }) {
//   const params = useParams();
//   const navigate = useNavigate();
//   const location = useLocation();

//   const projectId = useMemo(() => {
//     if (projectIdProp) return Number(projectIdProp) || projectIdProp;
//     return resolveProjectId(params.projectId || params.id);
//   }, [params, projectIdProp]);

//   const [projectName, setProjectName] = useState("");

//   const [loading, setLoading] = useState(true);
//   const [err, setErr] = useState("");
//   const [counts, setCounts] = useState({});
//   const [meta, setMeta] = useState({});

//   // filters (dropdown multi)
//   const [stageIds, setStageIds] = useState([]);
//   const [buildingIds, setBuildingIds] = useState([]);
//   const [floorIds, setFloorIds] = useState([]);
//   const [unitIds, setUnitIds] = useState([]);
//   const [pendingFrom, setPendingFrom] = useState([]);

//   // dropdown options
//   const [stageOptions, setStageOptions] = useState([]);
//   const [buildingOptions, setBuildingOptions] = useState([]);
//   const [floorOptions, setFloorOptions] = useState([]);

//   // keep all units + filtered units (by floor)
//   const [unitAllOptions, setUnitAllOptions] = useState([]); // [{value,label,floorKey}]
//   const [unitOptions, setUnitOptions] = useState([]); // filtered for dropdown UI

//   /* ---------------- WIP MODAL STATES ---------------- */
//   const [wipOpen, setWipOpen] = useState(false);

//   const [wipLoading, setWipLoading] = useState(false);
//   const [wipErr, setWipErr] = useState("");
//   const [wipRows, setWipRows] = useState([]);
//   const [wipMeta, setWipMeta] = useState({});
//   const [wipCols, setWipCols] = useState([]);

//   const [wipBreakdownLoading, setWipBreakdownLoading] = useState(false);
//   const [wipBreakdownErr, setWipBreakdownErr] = useState("");
//   const [wipBreakdown, setWipBreakdown] = useState(null);

//   const [wipCtx, setWipCtx] = useState({
//     stageId: null,
//     towerId: null,
//     flatCsv: null,
//   });

//   const [wipRole, setWipRole] = useState("");
//   const debouncedWipRole = useDebouncedValue(wipRole, 250);

//   const [openingFlatId, setOpeningFlatId] = useState(null);

//   /* ---------------- anti-spam + strictmode guards ---------------- */
//   const didInitRef = useRef({ projectId: null });
//   const abortRef = useRef({
//     summary: null,
//     wipTable: null,
//     wipBreakdown: null,
//     flatPrefetch: null,
//     projectName: null,
//   });

//   const newSignal = (key) => {
//     try {
//       abortRef.current[key]?.abort?.();
//     } catch {}
//     const ac = new AbortController();
//     abortRef.current[key] = ac;
//     return ac.signal;
//   };

//   useEffect(() => {
//     return () => {
//       Object.values(abortRef.current).forEach((ac) => {
//         try {
//           ac?.abort?.();
//         } catch {}
//       });
//     };
//   }, []);

//   const stageNameById = useMemo(() => {
//     const m = new Map();
//     (stageOptions || []).forEach((o) => m.set(String(o.value), o.label));
//     return m;
//   }, [stageOptions]);

//   const towerNameById = useMemo(() => {
//     const m = new Map();
//     (buildingOptions || []).forEach((o) => m.set(String(o.value), o.label));
//     return m;
//   }, [buildingOptions]);

//   const floorNameByKey = useMemo(() => {
//     const m = new Map();
//     (floorOptions || []).forEach((o) => m.set(String(o.value), o.label));
//     return m;
//   }, [floorOptions]);

//   const unitsByFloorKeys = useMemo(() => {
//     const map = new Map(); // floorKey -> [unitIds]
//     (unitAllOptions || []).forEach((u) => {
//       const fk = String(u.floorKey || "");
//       if (!fk) return;
//       if (!map.has(fk)) map.set(fk, []);
//       map.get(fk).push(String(u.value));
//     });
//     return map;
//   }, [unitAllOptions]);

//   /* ✅ project name fetch (best-effort) */
//   const fetchProjectName = useCallback(
//     async (pid) => {
//       if (!pid) return;

//       // 1) location.state
//       const stName =
//         location?.state?.projectName ||
//         location?.state?.project_name ||
//         location?.state?.project?.name ||
//         location?.state?.project?.project_name ||
//         "";
//       if (stName && String(stName).trim()) {
//         setProjectName(String(stName).trim());
//         return;
//       }

//       // 2) localStorage
//       const local = resolveProjectNameLocal(pid);
//       if (local) {
//         setProjectName(local);
//         return;
//       }

//       // 3) API (try a few likely endpoints)
//       try {
//         const signal = newSignal("projectName");
//         const endpoints = [
//           `${API_BASE}/api/setup/projects/${pid}/`,
//           `${API_BASE}/setup/projects/${pid}/`,
//           `${API_BASE}/api/projects/${pid}/`,
//           `${API_BASE}/projects/${pid}/`,
//         ];

//         for (const url of endpoints) {
//           try {
//             const res = await axios.get(url, { headers: authHeaders(), signal });
//             const d = res?.data ?? null;

//             const name =
//               d?.name ||
//               d?.project_name ||
//               d?.title ||
//               d?.data?.name ||
//               d?.data?.project_name ||
//               d?.result?.name ||
//               d?.result?.project_name ||
//               "";

//             if (name && String(name).trim()) {
//               setProjectName(String(name).trim());
//               return;
//             }
//           } catch (e) {
//             if (e?.name === "CanceledError" || e?.code === "ERR_CANCELED") return;
//           }
//         }
//       } catch {}
//     },
//     [location]
//   );

//   const getSelectedFilters = useCallback(() => {
//     const stages = uniq(stageIds);
//     const towers = uniq(buildingIds);
//     const floors = uniq(floorIds);

//     let flats = uniq(unitIds);

//     // ✅ if floor selected but units not selected → auto include all units from selected floors
//     if (floors.length && !flats.length) {
//       const all = [];
//       floors.forEach((fk) => {
//         const list = unitsByFloorKeys.get(String(fk)) || [];
//         all.push(...list);
//       });
//       flats = uniq(all);
//     }

//     const roles = uniq(pendingFrom);
//     return { stages, towers, floors, flats, roles };
//   }, [stageIds, buildingIds, floorIds, unitIds, pendingFrom, unitsByFloorKeys]);

//   const buildPayload = useCallback(() => {
//     const { stages, towers, flats, roles } = getSelectedFilters();
//     const payload = { project_id: projectId };

//     if (stages.length) payload.stage_id = stages;
//     if (towers.length) payload.building_id = towers;

//     // ✅ main filter is unit_id (safer than sending floor_id)
//     if (flats.length) payload.unit_id = flats;

//     if (roles.length) payload.pending_from = roles;
//     return payload;
//   }, [getSelectedFilters, projectId]);

//   const buildModalReportParams = useCallback(
//     ({ include_rows = true, limit = 200 } = {}) => {
//       const stageId = wipCtx?.stageId;
//       const towerId = wipCtx?.towerId;

//       const p = { project_id: projectId, group_by: "stage" };

//       if (stageId) {
//         p.stage_id = String(stageId);
//         p.stage_ids = String(stageId);
//       }

//       if (towerId) {
//         p.tower_id = String(towerId);
//         p.building_id = String(towerId);
//       }

//       if (wipCtx?.flatCsv) {
//         p.flat_id = String(wipCtx.flatCsv);
//         p.unit_id = String(wipCtx.flatCsv);
//       }

//       if (debouncedWipRole) p.pending_from = String(debouncedWipRole);

//       if (include_rows) p.include_rows = true;
//       if (limit) p.limit = limit;

//       return p;
//     },
//     [projectId, wipCtx, debouncedWipRole]
//   );

//   const buildModalBreakdownParams = useCallback(() => {
//     const stageId = wipCtx?.stageId;
//     const towerId = wipCtx?.towerId;

//     const p = { project_id: projectId };
//     if (stageId) p.stage_id = Number(stageId);
//     if (towerId) p.tower_id = Number(towerId);
//     if (debouncedWipRole) p.pending_from = String(debouncedWipRole);
//     return p;
//   }, [projectId, wipCtx, debouncedWipRole]);

//   const fetchSummary = useCallback(async () => {
//     if (!projectId) {
//       setErr("Project not selected. (project_id missing)");
//       setLoading(false);
//       return;
//     }

//     setLoading(true);
//     setErr("");

//     try {
//       const signal = newSignal("summary");
//       const res = await getUnitStageRoleSummary(buildPayload(), { signal });
//       const data = res?.data ?? res;

//       setCounts(data?.counts || data?.data?.counts || data?.result?.counts || {});
//       setMeta(data?.meta || data?.data?.meta || data?.result?.meta || {});
//     } catch (e) {
//       if (e?.name === "CanceledError" || e?.code === "ERR_CANCELED") return;
//       const msg =
//         e?.response?.data?.detail ||
//         e?.response?.data?.message ||
//         e?.message ||
//         "Failed to load overview";
//       setErr(String(msg));
//     } finally {
//       setLoading(false);
//     }
//   }, [projectId, buildPayload]);

//   const fetchFilterOptions = useCallback(async () => {
//     if (!projectId) return;

//     try {
//       const [stagesRes, buildingsRes] = await Promise.allSettled([
//         getStageDetailsByProjectId(projectId),
//         fetchTowersByProject(projectId),
//       ]);

//       if (stagesRes.status === "fulfilled") {
//         const list = normalizeList(stagesRes.value);
//         setStageOptions(
//           list
//             .map((x) => ({
//               value: String(x.id ?? x.stage_id ?? x.pk ?? ""),
//               label: x.name ?? x.stage_name ?? x.title ?? `Stage #${x.id}`,
//             }))
//             .filter((o) => o.value)
//         );
//       } else setStageOptions([]);

//       if (buildingsRes.status === "fulfilled") {
//         const list = normalizeList(buildingsRes.value);
//         setBuildingOptions(
//           list
//             .map((x) => ({
//               value: String(x.id ?? x.building_id ?? x.pk ?? ""),
//               label:
//                 x.name ??
//                 x.building_name ??
//                 x.tower_name ??
//                 x.title ??
//                 `Building #${x.id}`,
//             }))
//             .filter((o) => o.value)
//         );
//       } else setBuildingOptions([]);
//     } catch {
//       setStageOptions([]);
//       setBuildingOptions([]);
//     }
//   }, [projectId]);

//   /** ✅ fetch floors + units (dependent on selected buildings) */
//   const fetchFloorsAndUnitsFromBuildings = useCallback(
//     async (buildingIdList) => {
//       const ids = uniq(buildingIdList).map(String);
//       if (!ids.length) {
//         setFloorOptions([]);
//         setUnitAllOptions([]);
//         setUnitOptions([]);
//         setFloorIds([]);
//         setUnitIds([]);
//         return;
//       }

//       const settled = await Promise.allSettled(ids.map((bid) => getLevelsWithFlatsByBuilding(bid)));

//       const floorMap = new Map(); // floorKey -> {value,label}
//       const unitMap = new Map(); // unitId -> {value,label,floorKey}

//       settled.forEach((r, idx) => {
//         if (r.status !== "fulfilled") return;

//         const bid = ids[idx];
//         const towerLabel = towerNameById.get(String(bid)) || `Tower #${bid}`;

//         const levels = normalizeList(r.value);
//         levels.forEach((lvl) => {
//           const floorName = lvl?.name ? String(lvl.name) : "Floor";
//           const rawLevelId = lvl?.id ?? lvl?.floor_id ?? lvl?.level_id ?? lvl?.pk ?? null;

//           const floorKey = `${bid}:${String(rawLevelId ?? floorName)}`;
//           const floorLabel = `${towerLabel} • ${floorName}`;

//           floorMap.set(floorKey, { value: floorKey, label: floorLabel });

//           const flats = Array.isArray(lvl?.flats) ? lvl.flats : [];
//           flats.forEach((f) => {
//             const id = f?.id ?? f?.flat_id ?? f?.pk;
//             if (!id) return;

//             const number =
//               f?.number ??
//               f?.flat_number ??
//               f?.unit_no ??
//               f?.unit_number ??
//               f?.name ??
//               "";

//             const typeName =
//               f?.flattype?.type_name ??
//               f?.flat_type?.type_name ??
//               f?.flat_type_name ??
//               "";

//             const labelParts = [];
//             if (number) labelParts.push(String(number));
//             if (floorName) labelParts.push(floorName);

//             const label = labelParts.join(" • ") || `Unit #${id}`;
//             const finalLabel = typeName ? `${label} (${typeName})` : label;

//             unitMap.set(String(id), { value: String(id), label: finalLabel, floorKey });
//           });
//         });
//       });

//       const floors = Array.from(floorMap.values()).sort((a, b) =>
//         String(a.label).localeCompare(String(b.label))
//       );
//       const allUnits = Array.from(unitMap.values());

//       allUnits.sort((a, b) => {
//         const na = parseInt(String(a.label).match(/\d+/)?.[0] || "0", 10);
//         const nb = parseInt(String(b.label).match(/\d+/)?.[0] || "0", 10);
//         return na - nb;
//       });

//       setFloorOptions(floors);
//       setUnitAllOptions(allUnits);

//       const allowedFloors = new Set(floors.map((f) => String(f.value)));
//       setFloorIds((prev) => (prev || []).filter((x) => allowedFloors.has(String(x))));

//       const allowedUnits = new Set(allUnits.map((u) => String(u.value)));
//       setUnitIds((prev) => (prev || []).filter((x) => allowedUnits.has(String(x))));
//     },
//     [towerNameById]
//   );

//   /** ✅ filter unit dropdown list based on selected floors (UI only) */
//   useEffect(() => {
//     const floors = new Set((floorIds || []).map(String));
//     let next = unitAllOptions || [];

//     if (floors.size) next = next.filter((u) => floors.has(String(u.floorKey)));

//     setUnitOptions(next);

//     const allowed = new Set(next.map((u) => String(u.value)));
//     setUnitIds((prev) => (prev || []).filter((x) => allowed.has(String(x))));
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [floorIds, unitAllOptions]);

//   useEffect(() => {
//     if (!projectId) return;

//     if (didInitRef.current.projectId === projectId) return;
//     didInitRef.current.projectId = projectId;

//     setStageIds([]);
//     setBuildingIds([]);
//     setFloorIds([]);
//     setUnitIds([]);
//     setPendingFrom([]);

//     setFloorOptions([]);
//     setUnitAllOptions([]);
//     setUnitOptions([]);

//     fetchFilterOptions();
//     fetchSummary();
//     fetchProjectName(projectId);
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [projectId]);

//   useEffect(() => {
//     if (!projectId) return;
//     fetchFloorsAndUnitsFromBuildings(buildingIds);
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [projectId, buildingIds]);

//   const resetFilters = () => {
//     setStageIds([]);
//     setBuildingIds([]);
//     setFloorIds([]);
//     setUnitIds([]);
//     setPendingFrom([]);
//     fetchSummary();
//   };

//   /* ---------------- WIP modal data ---------------- */
//   const fetchWipTable = useCallback(async () => {
//     if (!projectId) return;
//     if (!wipCtx?.stageId) return;

//     setWipLoading(true);
//     setWipErr("");

//     try {
//       const signal = newSignal("wipTable");
//       const params = buildModalReportParams({ include_rows: true, limit: 200 });
//       const res = await getUnitChecklistReport(params, { signal });
//       const data = res?.data ?? res;

//       const rows = pickRows(data);
//       const cols = pickColumns(data, rows);

//       setWipRows(Array.isArray(rows) ? rows : []);
//       setWipCols(Array.isArray(cols) ? cols : []);
//       setWipMeta(pickMeta(data));
//     } catch (e) {
//       if (e?.name === "CanceledError" || e?.code === "ERR_CANCELED") return;
//       const msg =
//         e?.response?.data?.detail ||
//         e?.response?.data?.message ||
//         e?.message ||
//         "Failed to load report table";
//       setWipErr(String(msg));
//     } finally {
//       setWipLoading(false);
//     }
//   }, [projectId, wipCtx, buildModalReportParams]);

//   const fetchWipBreakdown = useCallback(async () => {
//     if (!projectId) return;
//     if (!wipCtx?.stageId) return;

//     setWipBreakdownLoading(true);
//     setWipBreakdownErr("");

//     try {
//       const signal = newSignal("wipBreakdown");
//       const params = buildModalBreakdownParams();
//       const res = await getUnitWorkInProgressBreakdown(params, { signal });
//       const data = res?.data ?? res;

//       setWipBreakdown(data && typeof data === "object" ? data : null);
//     } catch (e) {
//       if (e?.name === "CanceledError" || e?.code === "ERR_CANCELED") return;
//       const msg =
//         e?.response?.data?.detail ||
//         e?.response?.data?.message ||
//         e?.message ||
//         "Failed to load breakdown";
//       setWipBreakdownErr(String(msg));
//     } finally {
//       setWipBreakdownLoading(false);
//     }
//   }, [projectId, wipCtx, buildModalBreakdownParams]);

//   const refreshWipAll = useCallback(async () => {
//     await Promise.allSettled([fetchWipTable(), fetchWipBreakdown()]);
//   }, [fetchWipTable, fetchWipBreakdown]);

//   useEffect(() => {
//     if (!wipOpen) return;
//     if (!projectId) return;
//     if (!wipCtx?.stageId) return;
//     refreshWipAll();
//   }, [
//     wipOpen,
//     projectId,
//     wipCtx?.stageId,
//     wipCtx?.towerId,
//     wipCtx?.flatCsv,
//     debouncedWipRole,
//     refreshWipAll,
//   ]);

//   const openWipModal = async () => {
//     setWipOpen(true);

//     setWipErr("");
//     setWipRows([]);
//     setWipMeta({});
//     setWipCols([]);

//     setWipBreakdownErr("");
//     setWipBreakdown(null);

//     setWipRole("");

//     const { stages, towers, flats } = getSelectedFilters();
//     if (!stages.length) {
//       setWipErr("Select at least one Stage first (stage_ids required).");
//       return;
//     }

//     const pickedStage = stages[0];
//     const pickedTower = towers?.[0] || null;
//     const flatCsv = toCsv(flats);

//     setWipCtx({ stageId: pickedStage, towerId: pickedTower, flatCsv });
//   };

//   const exportWipExcel = async () => {
//     const stageId = wipCtx?.stageId;
//     if (!stageId) {
//       setWipErr("Select at least one Stage first (stage_ids required).");
//       return;
//     }

//     try {
//       const params = buildModalReportParams({ include_rows: true, limit: 200 });
//       await exportUnitChecklistReportExcel(params);
//     } catch (e) {
//       const msg =
//         e?.response?.data?.detail ||
//         e?.response?.data?.message ||
//         e?.message ||
//         "Export failed";
//       setWipErr(String(msg));
//     }
//   };

//   const wipColumns = useMemo(() => {
//     const cols =
//       (Array.isArray(wipCols) && wipCols.length ? wipCols : null) ||
//       (wipRows?.[0] && typeof wipRows[0] === "object" ? Object.keys(wipRows[0]) : []);
//     return (cols || []).filter((c) => !HIDE_COLS.has(String(c)));
//   }, [wipCols, wipRows]);

//   const breakdownMeta = wipBreakdown?.meta || {};
//   const wipUnitCount = wipBreakdown?.work_in_progress_units?.count ?? null;
//   const byPendingFrom = wipBreakdown?.breakdown?.by_pending_from || {};
//   const makerSupervisorSplit = wipBreakdown?.breakdown?.maker_supervisor_split || {};
//   const modalAsOf = breakdownMeta?.as_of || wipMeta?.as_of || "";

//   const cards = useMemo(
//     () => [
//       { key: "total_units", title: "Total Units", value: fmtInt(counts.total_units), Icon: ClipboardList },
//       { key: "pending_yet_to_start", title: "Pending (Yet to Start)", value: fmtInt(counts.pending_yet_to_start), Icon: Clock },
//       { key: "initialised_unit_count", title: "Initialized Units", value: fmtInt(counts.initialised_unit_count), Icon: PlayCircle },
//       { key: "work_in_progress_unit", title: "Unit Work In Progress", value: fmtInt(counts.work_in_progress_unit), Icon: Activity, onClick: openWipModal },
//       { key: "yet_to_verify", title: "Yet to Verify (Questions)", value: fmtInt(counts.yet_to_verify), Icon: ShieldCheck },
//       { key: "complete", title: "Complete", value: fmtInt(counts.complete), Icon: CheckCircle2 },
//     ],
//     [counts]
//   );

//   const RoleChip = ({ code, label }) => {
//     const active = pendingFrom.includes(code);
//     return (
//       <button
//         type="button"
//         onClick={() =>
//           setPendingFrom((prev) => (active ? prev.filter((x) => x !== code) : [...prev, code]))
//         }
//         className={[
//           "rounded-full border px-3 py-1.5 text-xs font-semibold",
//           "ring-1 ring-slate-900/5",
//           active
//             ? "border-slate-900 bg-slate-900 text-white shadow-sm"
//             : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
//         ].join(" ")}
//       >
//         {label}
//       </button>
//     );
//   };

//   const stageNameByIdMemo = stageNameById;
//   const towerNameByIdMemo = towerNameById;

//   const activeFiltersText = useMemo(() => {
//     const { stages, towers, floors, flats, roles } = getSelectedFilters();

//     const sNames = stages
//       .map((id) => stageNameByIdMemo.get(String(id)) || `Stage#${id}`)
//       .slice(0, 4);

//     const tNames = towers
//       .map((id) => towerNameByIdMemo.get(String(id)) || `Tower#${id}`)
//       .slice(0, 3);

//     const fNames = floors.map((fk) => floorNameByKey.get(String(fk)) || String(fk)).slice(0, 2);

//     const parts = [];
//     if (stages.length) parts.push(`Stage: ${sNames.join(", ")}${stages.length > 4 ? "…" : ""}`);
//     if (towers.length) parts.push(`Tower: ${tNames.join(", ")}${towers.length > 3 ? "…" : ""}`);
//     if (floors.length) parts.push(`Floor: ${fNames.join(", ")}${floors.length > 2 ? "…" : ""}`);
//     if (flats.length) parts.push(`Units: ${flats.length}`);
//     if (roles.length) parts.push(`Pending From: ${roles.join(", ")}`);

//     return parts.length ? parts.join(" • ") : "";
//   }, [getSelectedFilters, stageNameByIdMemo, towerNameByIdMemo, floorNameByKey]);

//   const modalStageName = useMemo(() => {
//     const sid = wipCtx?.stageId;
//     if (!sid) return "";
//     return stageNameById.get(String(sid)) || `Stage #${sid}`;
//   }, [wipCtx, stageNameById]);

//   const modalTowerName = useMemo(() => {
//     const tid = wipCtx?.towerId;
//     if (!tid) return "";
//     return towerNameById.get(String(tid)) || `Tower #${tid}`;
//   }, [wipCtx, towerNameById]);




//   const goToFlatReport = async (row) => {
//   const flatId = getFlatIdFromRow(row);

//   console.log("➡️ goToFlatReport() flatId:", flatId, "projectId:", projectId);

//   if (!flatId) {
//     setWipErr("Flat ID not found in this row. Check API row keys in console.");
//     console.log("❌ Row keys:", Object.keys(row || {}));
//     return;
//   }

//   const flatMeta = {
//     number: row.flat_number ?? row.unit_number ?? row.number ?? row.unit_no ?? row.unit_label ?? null,
//     typeName: row.flat_type_name ?? row.unit_type_name ?? row.type_name ?? row.type ?? null,
//     levelName: row.level_name ?? row.floor_name ?? row.level ?? null,
//   };

//   const filters = {
//     stageId: wipCtx?.stageId || null,
//     buildingId: wipCtx?.towerId || null,
//   };

//   const path = `/projects/${projectId}/flat-report/${flatId}`;

//   // ✅ Navigate immediately (don’t block UX)
//   setWipOpen(false);
//   navigate(path, { state: { flatMeta, filters, from: "ProjectOverviewKpi" } });

//   // ✅ Optional: try prefetch, but never block navigation
//   try {
//     const signal = newSignal("flatPrefetch");

//     const paramsReq = { project_id: projectId, flat_id: flatId };
//     if (wipCtx?.stageId) paramsReq.stage_id = wipCtx.stageId;
//     if (wipCtx?.towerId) paramsReq.building_id = wipCtx.towerId;

//     const res = await axios.get(`${API_BASE}/checklists/stats/flat-room/`, {
//       params: paramsReq,
//       headers: authHeaders(),
//       signal,
//     });

//     console.log("✅ Prefetch flat-room success:", res?.data);

//     // If you REALLY want to pass prefetchedStats, you can store it in sessionStorage instead:
//     sessionStorage.setItem(
//       `prefetch_flatroom_${projectId}_${flatId}`,
//       JSON.stringify(res?.data ?? null)
//     );
//   } catch (e) {
//     if (e?.name === "CanceledError" || e?.code === "ERR_CANCELED") return;
//     console.log("⚠️ Prefetch failed but navigation already done:", e?.response?.data || e?.message);
//   }
// };

// //   const goToFlatReport = async (row) => {
// //     const flatId = getFlatIdFromRow(row);
// //     if (!flatId) {
// //       setWipErr("Flat ID not found in this row (cannot open flat report).");
// //       return;
// //     }

// //     if (openingFlatId === String(flatId)) return;

// //     setWipErr("");
// //     setOpeningFlatId(String(flatId));

// //     const paramsReq = { project_id: projectId, flat_id: flatId };
// //     if (wipCtx?.stageId) paramsReq.stage_id = wipCtx.stageId;
// //     if (wipCtx?.towerId) paramsReq.building_id = wipCtx.towerId;

// //     try {
// //       const signal = newSignal("flatPrefetch");

// //       const res = await axios.get(`${API_BASE}/checklists/stats/flat-room/`, {
// //         params: paramsReq,
// //         headers: authHeaders(),
// //         signal,
// //       });

// //       const prefetchedStats = res?.data ?? null;

// //       const flatMeta = {
// //         number:
// //           row.flat_number ??
// //           row.unit_number ??
// //           row.number ??
// //           row.unit_no ??
// //           row.unit_label ??
// //           null,
// //         typeName:
// //           row.flat_type_name ??
// //           row.unit_type_name ??
// //           row.type_name ??
// //           row.type ??
// //           null,
// //         levelName: row.level_name ?? row.floor_name ?? row.level ?? null,
// //       };

// //       const filters = { stageId: wipCtx?.stageId || null, buildingId: wipCtx?.towerId || null };
// //       const path = `/projects/${projectId}/flat-report/${flatId}`;

// //       setWipOpen(false);
// //       navigate(path, { state: { prefetchedStats, flatMeta, filters } });
// //     } catch (e) {
// //       if (e?.name === "CanceledError" || e?.code === "ERR_CANCELED") return;

// //       const msg =
// //         e?.response?.data?.detail ||
// //         e?.response?.data?.message ||
// //         e?.message ||
// //         "Failed to open flat report (prefetch failed).";
// //       setWipErr(String(msg));
// //     } finally {
// //       setOpeningFlatId(null);
// //     }
// //   };

//   const toggleModalRole = (roleCode) => {
//     const code = String(roleCode || "").toUpperCase();
//     setWipRole((prev) => (prev === code ? "" : code));
//   };

//   const asOfText = meta?.as_of || meta?.asOf || meta?.date || "";

//   return (
//     <div className="bg-slate-50">
//       <div className="mx-auto max-w-[1400px] px-4 md:px-6 pt-5 md:pt-7 pb-2 space-y-4">
//         {/* Header */}
//         <SectionCard className="p-4 md:p-5">
//           <div className="flex flex-wrap items-start justify-between gap-3">
//             <div className="min-w-0">
//               <div className="flex items-center gap-2">
//                 <button
//                   type="button"
//                   onClick={() => navigate("/config")}
//                   className="h-10 w-10 rounded-xl border bg-white text-slate-800 shadow-sm ring-1 ring-slate-900/5 hover:bg-slate-50"
//                   aria-label="Back"
//                   title="Back"
//                 >
//                   ←
//                 </button>

//                 <div className="min-w-0">
//                   <div className="text-lg md:text-xl font-extrabold tracking-tight text-slate-900 truncate">
//                     {projectName ? projectName : projectId ? `Project #${projectId}` : "Project"}
//                   </div>
//                   <div className="mt-0.5 text-xs font-semibold text-slate-500">
//                     <span className="inline-flex items-center gap-2">
//                       <span className="truncate">{activeFiltersText}</span>
                      
//                     </span>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             <button
//               type="button"
//               onClick={fetchSummary}
//               className="inline-flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-900/5 hover:bg-slate-50"
//             >
//               <RefreshCcw size={16} />
//               Refresh
//             </button>
//           </div>
//         </SectionCard>

//         {/* Filters */}
//         <SectionCard className="p-4 md:p-5">
//           <div className="flex flex-wrap items-center justify-between gap-2">
//             <div>
//               <div className="text-sm font-extrabold text-slate-900">Filters</div>
//               <div className="text-xs font-semibold text-slate-500 mt-0.5">
//                 Choose scope and click <span className="font-black text-slate-700">Apply</span>
//               </div>
//             </div>

//             <div className="flex items-center gap-2">
//               <button
//                 type="button"
//                 onClick={resetFilters}
//                 className="rounded-xl border bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 ring-1 ring-slate-900/5"
//               >
//                 Reset
//               </button>
//               <button
//                 type="button"
//                 onClick={fetchSummary}
//                 className="rounded-xl border border-slate-900 bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:opacity-90 shadow-sm"
//               >
//                 Apply
//               </button>
//             </div>
//           </div>

//           <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
//             <MultiSelectDropdown
//               label="Stages"
//               value={stageIds}
//               options={stageOptions}
//               onChange={setStageIds}
//               placeholder="Select stages"
//             />

//             <MultiSelectDropdown
//               label="Buildings / Towers"
//               value={buildingIds}
//               options={buildingOptions}
//               onChange={(vals) => {
//                 setBuildingIds(vals);
//                 setFloorIds([]);
//                 setUnitIds([]);
//               }}
//               placeholder="Select towers"
//             />

//             <MultiSelectDropdown
//               label="Floors"
//               value={floorIds}
//               options={floorOptions}
//               onChange={(vals) => {
//                 setFloorIds(vals);
//                 setUnitIds([]);
//               }}
//               placeholder={buildingIds.length ? "Select floors" : "Select tower first"}
//               disabled={!buildingIds.length}
//             />

//             <MultiSelectDropdown
//               label="Units"
//               value={unitIds}
//               options={unitOptions}
//               onChange={setUnitIds}
//               placeholder={
//                 !buildingIds.length
//                   ? "Select tower first"
//                   : floorIds.length
//                   ? "Select units (filtered by floor)"
//                   : "Select units"
//               }
//               disabled={!buildingIds.length}
//             />
//           </div>

//           <div className="mt-4">
//             <FilterLabel>Pending From (optional)</FilterLabel>
//             <div className="mt-2 flex flex-wrap gap-2">
//               <RoleChip code="MAKER" label="Maker" />
//               <RoleChip code="INSPECTOR" label="Inspector" />
//               <RoleChip code="CHECKER" label="Checker" />
//               <RoleChip code="SUPERVISOR" label="Supervisor" />
//             </div>
//           </div>
//         </SectionCard>

//         {err ? (
//           <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700 ring-1 ring-red-900/5">
//             {err}
//           </div>
//         ) : null}

//         {/* KPI header */}
//         <div className="flex items-center justify-between">
//           <div className="text-sm font-extrabold text-slate-900">KPIs</div>
//           <div className="text-xs font-semibold text-slate-500">Scroll horizontally if needed</div>
//         </div>

//         {/* KPI cards */}
//         <div className="rounded-2xl border bg-white p-3 shadow-sm ring-1 ring-slate-900/5">
//           <div className="flex gap-3 overflow-x-auto pb-2 pr-2">
//             {loading
//               ? Array.from({ length: 6 }).map((_, i) => (
//                   <div
//                     key={i}
//                     className="min-w-[220px] h-[82px] animate-pulse rounded-2xl border bg-white px-4 py-3 ring-1 ring-slate-900/5"
//                   >
//                     <div className="h-3 w-28 rounded bg-slate-100" />
//                     <div className="mt-3 h-6 w-16 rounded bg-slate-100" />
//                   </div>
//                 ))
//               : cards.map((c) => (
//                   <Card key={c.key} title={c.title} value={c.value} Icon={c.Icon} onClick={c.onClick} />
//                 ))}
//           </div>

         
//         </div>

//         {/* ---------------- WIP MODAL ---------------- */}
//         {wipOpen ? (
//           <div className="fixed inset-0 z-50 overflow-y-auto bg-black/45" onMouseDown={() => setWipOpen(false)}>
//             <div className="min-h-full px-4 pb-10 pt-20 md:pt-24">
//               <div
//                 className="mx-auto w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-slate-900/10"
//                 onMouseDown={(e) => e.stopPropagation()}
//               >
//                 <div className="sticky top-0 z-10 border-b bg-white/95 backdrop-blur p-4">
//                   <div className="flex items-start justify-between gap-3">
//                     <div className="min-w-0">
//                       <div className="text-base font-extrabold text-slate-900">
//                         Work In Progress Breakdown
//                       </div>
//                       <div className="mt-1 text-xs font-semibold text-slate-500">
//                         {modalStageName ? <span>Stage: {modalStageName}</span> : null}
//                         {modalTowerName ? <span> • Tower: {modalTowerName}</span> : null}
//                         {wipRole ? <span> • Role: {roleLabel(wipRole)}</span> : null}
//                         {modalAsOf ? <span> • As of: {modalAsOf}</span> : null}
//                       </div>
//                     </div>

//                     <div className="flex items-center gap-2">
//                       <button
//                         type="button"
//                         onClick={refreshWipAll}
//                         className="inline-flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 ring-1 ring-slate-900/5"
//                       >
//                         <RefreshCcw size={14} />
//                         Refresh
//                       </button>

//                       <button
//                         type="button"
//                         onClick={exportWipExcel}
//                         className="inline-flex items-center gap-2 rounded-xl border border-slate-900 bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:opacity-90 shadow-sm"
//                       >
//                         <Download size={14} />
//                         Export Excel
//                       </button>

//                       <button
//                         type="button"
//                         onClick={() => setWipOpen(false)}
//                         className="rounded-xl border bg-white p-2 text-slate-700 hover:bg-slate-50 ring-1 ring-slate-900/5"
//                         aria-label="Close"
//                         title="Close"
//                       >
//                         <X size={16} />
//                       </button>
//                     </div>
//                   </div>
//                 </div>

//                 <div className="p-4">
//                   {wipBreakdownErr ? (
//                     <div className="mb-3 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700 ring-1 ring-red-900/5">
//                       {wipBreakdownErr}
//                     </div>
//                   ) : null}

//                   {wipErr ? (
//                     <div className="mb-3 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700 ring-1 ring-red-900/5">
//                       {wipErr}
//                     </div>
//                   ) : null}

//                   <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
//                     <div className="text-xs font-extrabold text-slate-700">Summary</div>

//                     <div className="flex flex-wrap items-center gap-2">
//                       <ChipButton active={!wipRole} onClick={() => setWipRole("")} title="Show all roles">
//                         All Roles
//                       </ChipButton>

//                       {Object.keys(byPendingFrom || {}).map((k) => (
//                         <ChipButton
//                           key={k}
//                           active={String(wipRole).toUpperCase() === String(k).toUpperCase()}
//                           onClick={() => toggleModalRole(k)}
//                           title="Filter table + breakdown by this role"
//                         >
//                           {roleLabel(k)} • {fmtInt(byPendingFrom[k])}
//                         </ChipButton>
//                       ))}
//                     </div>
//                   </div>

//                   {wipBreakdownLoading ? (
//                     <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
//                       {Array.from({ length: 4 }).map((_, i) => (
//                         <div key={i} className="h-[56px] animate-pulse rounded-xl border bg-white px-3 py-2 ring-1 ring-slate-900/5">
//                           <div className="h-3 w-20 rounded bg-slate-100" />
//                           <div className="mt-2 h-5 w-12 rounded bg-slate-100" />
//                         </div>
//                       ))}
//                     </div>
//                   ) : (
//                     <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
//                       <MiniStat label="WIP Units" value={fmtInt(wipUnitCount)} />
//                       <MiniStat label="Role Filter" value={wipRole ? roleLabel(wipRole) : "—"} />

//                       {makerSupervisorSplit &&
//                       typeof makerSupervisorSplit === "object" &&
//                       Object.keys(makerSupervisorSplit).length ? (
//                         <div className="mt-3 rounded-2xl border bg-slate-50 p-3 sm:col-span-4 ring-1 ring-slate-900/5">
//                           <div className="mb-2 text-xs font-extrabold text-slate-700">
//                             Maker / Supervisor Split
//                           </div>

//                           <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
//                             {[
//                               ["maker_pending", "units_with_maker_pending"],
//                               ["supervisor_pending", "units_with_supervisor_pending"],
//                             ].map(([label, key]) => (
//                               <MiniStat
//                                 key={key}
//                                 label={splitLabel(label)}
//                                 value={fmtInt(makerSupervisorSplit?.[key])}
//                               />
//                             ))}
//                           </div>
//                         </div>
//                       ) : null}
//                     </div>
//                   )}

//                   <div className="mt-4 rounded-3xl border overflow-hidden ring-1 ring-slate-900/5">
//                     <div className="flex items-center justify-between gap-2 border-b px-4 py-3 bg-white">
//                       <div className="text-sm font-extrabold text-slate-900">
//                         Excel Table Preview
//                       </div>
//                       <div className="text-[11px] font-semibold text-slate-500">
//                         Click a row to open Flat Report
//                       </div>
//                     </div>

//                     {wipLoading ? (
//                       <div className="p-4 text-sm font-semibold text-slate-600">Loading...</div>
//                     ) : !wipRows?.length ? (
//                       <div className="p-4 text-sm font-semibold text-slate-600">No rows returned.</div>
//                     ) : (
//                       <div className="max-h-[56vh] overflow-auto">
//                         <table className="min-w-max w-full text-sm">
//                           <thead className="sticky top-0 bg-white">
//                             <tr className="border-b">
//                               <th className="whitespace-nowrap px-4 py-2 text-left text-[11px] font-extrabold text-slate-600">
//                                 Open
//                               </th>

//                               {wipColumns.map((k) => {
//                                 const colKey = String(k);
//                                 const isRed = RED_HIGHLIGHT_COLS.has(colKey);
//                                 return (
//                                   <th
//                                     key={colKey}
//                                     className={[
//                                       "whitespace-nowrap px-4 py-2 text-left text-[11px] font-extrabold",
//                                       isRed ? "bg-red-50 text-red-700" : "text-slate-600",
//                                     ].join(" ")}
//                                   >
//                                     {colKey.replace(/_/g, " ")}
//                                   </th>
//                                 );
//                               })}
//                             </tr>
//                           </thead>

//                           <tbody>
//                             {wipRows.map((row, idx) => {
//                               const flatId = getFlatIdFromRow(row);
//                               const clickable = Boolean(flatId);

//                               return (
//                                 <tr
//                                   key={idx}
//                                   className={[
//                                     "border-b last:border-0",
//                                     idx % 2 === 0 ? "bg-white" : "bg-slate-50/30",
//                                     clickable ? "cursor-pointer hover:bg-slate-50" : "",
//                                   ].join(" ")}
//                                   onClick={() => {
//                                     if (clickable) goToFlatReport(row);
//                                   }}
//                                 >
//                                   <td className="whitespace-nowrap px-4 py-2 text-slate-700">
//                                     {clickable ? (
//                                       <span className="inline-flex items-center gap-1 text-xs font-bold">
//                                         {openingFlatId === String(flatId) ? (
//                                           "Opening..."
//                                         ) : (
//                                           <>
//                                             <ExternalLink size={14} />
//                                             Open
//                                           </>
//                                         )}
//                                       </span>
//                                     ) : (
//                                       <span className="text-xs text-slate-400">—</span>
//                                     )}
//                                   </td>

//                                   {wipColumns.map((k) => {
//                                     const colKey = String(k);
//                                     const v = row?.[colKey];
//                                     const txt = formatCell(colKey, v, row);
//                                     const isRed = RED_HIGHLIGHT_COLS.has(colKey);

//                                     return (
//                                       <td
//                                         key={colKey}
//                                         className={[
//                                           "whitespace-nowrap px-4 py-2",
//                                           isRed
//                                             ? "bg-red-50 font-extrabold text-red-700"
//                                             : "text-slate-800 font-medium",
//                                         ].join(" ")}
//                                         title={txt}
//                                       >
//                                         {txt}
//                                       </td>
//                                     );
//                                   })}
//                                 </tr>
//                               );
//                             })}
//                           </tbody>
//                         </table>
//                       </div>
//                     )}
//                   </div>

//                   {modalAsOf ? (
//                     <div className="mt-3 text-[11px] font-semibold text-slate-500">
//                       As of: {modalAsOf}
//                     </div>
//                   ) : null}
//                 </div>
//               </div>

//               <div className="h-6" />
//             </div>
//           </div>
//         ) : null}
//       </div>
//     </div>
//   );
// }



// src/components/ProjectOverviewKpi.jsx
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import axios from "axios";
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  RefreshCcw,
  PlayCircle,
  Activity,
  ShieldCheck,
  X,
  Download,
  ExternalLink,
  ChevronDown,
  Search,
  CheckSquare,
  Square,
} from "lucide-react";

import {
  getUnitStageRoleSummary,
  fetchTowersByProject,
  getStageDetailsByProjectId,
  getLevelsWithFlatsByBuilding,
  getUnitChecklistReport,
  exportUnitChecklistReportExcel,
  getUnitWorkInProgressBreakdown,
} from "../api";

const API_BASE = "https://konstruct.world";

const authHeaders = () => ({
  Authorization: `Bearer ${
    localStorage.getItem("ACCESS_TOKEN") ||
    localStorage.getItem("TOKEN") ||
    localStorage.getItem("token") ||
    ""
  }`,
});

/* ---------------- helpers ---------------- */
const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const fmtInt = (v) => {
  const n = num(v);
  if (n === null) return "—";
  return n.toLocaleString("en-IN");
};

const titleize = (s) =>
  String(s || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());

const splitLabel = (label) => {
  const k = String(label || "").toLowerCase();
  if (k === "maker_pending") return "Maker Pending Unit";
  return titleize(label);
};

// const roleLabel = (code) => {
//   const c = String(code || "").toUpperCase();
//   if (c === "MAKER") return "Maker";
//   if (c === "INSPECTOR") return "Inspector";
//   if (c === "CHECKER") return "Checker";
//   if (c === "SUPERVISOR") return "Supervisor";
//   return c || "—";
// };
const roleLabel = (code) => {
  const c = normRoleCode(code);
  if (c === "MAKER") return "Maker";
  if (c === "INSPECTOR") return "Inspector";
  if (c === "CHECKER") return "Checker";
  if (c === "SUPERVISOR") return "Supervisor";
  return c || "—";
};

const normRoleCode = (v) => String(v ?? "").trim().toUpperCase();


const pickRows = (data) => {
  if (!data || typeof data !== "object") return [];
  return (
    data.rows ||
    data.unit_rows ||
    data.results ||
    data.data?.rows ||
    data.data?.results ||
    []
  );
};

const pickMeta = (data) => {
  if (!data || typeof data !== "object") return {};
  return data.meta || data.data?.meta || data.result?.meta || {};
};

const pickColumns = (data, rowsFallback = []) => {
  const cols = data?.columns || data?.data?.columns;
  if (Array.isArray(cols) && cols.length) return cols;
  const first = rowsFallback?.[0];
  if (first && typeof first === "object") return Object.keys(first);
  return [];
};

const resolveProjectId = (routeParam) => {
  const rp = Number(routeParam);
  if (rp) return rp;

  try {
    const qp = new URLSearchParams(window.location.search).get("project_id");
    const qn = Number(qp);
    if (qn) return qn;
  } catch {}

  const ls =
    localStorage.getItem("ACTIVE_PROJECT_ID") ||
    localStorage.getItem("PROJECT_ID") ||
    localStorage.getItem("project_id");
  return Number(ls) || null;
};
// ✅ normalize keys: "Unit Id" -> "unitid", "unit_id" -> "unitid"
const normKey = (k) => String(k || "").toLowerCase().replace(/[^a-z0-9]/g, "");

// ✅ fetch value by possible keys (supports space keys)
const pickByKeys = (row, keys = []) => {
  if (!row || typeof row !== "object") return null;

  // direct exact match first
  for (const k of keys) {
    if (k in row && row[k] !== null && row[k] !== undefined && String(row[k]).trim() !== "") {
      return row[k];
    }
  }

  // normalized lookup (space/underscore/case-insensitive)
  const map = new Map(Object.keys(row).map((k) => [normKey(k), k]));
  for (const want of keys) {
    const real = map.get(normKey(want));
    if (real && row[real] !== null && row[real] !== undefined && String(row[real]).trim() !== "") {
      return row[real];
    }
  }

  return null;
};

const normalizeList = (res) => {
  const d = res?.data ?? res;
  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.results)) return d.results;
  if (Array.isArray(d?.data)) return d.data;
  return [];
};

const uniq = (arr) => Array.from(new Set((arr || []).filter(Boolean)));
const toCsv = (arr) => {
  const a = uniq(arr).map(String).filter(Boolean);
  return a.length ? a.join(",") : null;
};
const getFlatIdFromRow = (row) => {
  if (!row || typeof row !== "object") return null;

  // ✅ THIS IS THE MAIN FIX (your API sends "Unit Id")
  const direct = pickByKeys(row, [
    "Unit Id",
    "unit_id",
    "flat_id",
    "UnitID",
    "Flat Id",
    "id",
    "pk",
  ]);

  if (direct) return direct;

  // nested fallbacks (unchanged)
  const nestedFlat =
    row.flat && typeof row.flat === "object" ? (row.flat.id ?? row.flat.pk) : null;
  if (nestedFlat) return nestedFlat;

  const nestedUnit =
    row.unit && typeof row.unit === "object" ? (row.unit.id ?? row.unit.pk) : null;
  if (nestedUnit) return nestedUnit;

  return null;
};


// const getFlatIdFromRow = (row) => {
//   if (!row || typeof row !== "object") return null;

//   // some APIs may return id directly
//   const direct =
//     row.flat_id ??
//     row.flatId ??
//     row.unit_id ??
//     row.unitId ??
//     row.flat_pk ??
//     row.unit_pk ??
//     row.id ??
//     row.pk;

//   if (direct) return direct;

//   // nested
//   const nestedFlat =
//     row.flat && typeof row.flat === "object" ? (row.flat.id ?? row.flat.pk) : null;
//   if (nestedFlat) return nestedFlat;

//   const nestedUnit =
//     row.unit && typeof row.unit === "object" ? (row.unit.id ?? row.unit.pk) : null;
//   if (nestedUnit) return nestedUnit;

//   return null;
// };

// ✅ IMPORTANT: number extractor (WIP table often has only number)
const stripNumber = (v) => String(v ?? "").trim();

const getFlatNumberFromRow = (row) => {
  if (!row || typeof row !== "object") return "";

  const candidate = pickByKeys(row, [
    "Unit No",
    "flat_number",
    "unit_number",
    "number",
    "unit_no",
    "flat_no",
    "unit_label",
    "flat_label",
  ]);

  return stripNumber(candidate || "");
};

const getRowTowerId = (row) => {
  if (!row || typeof row !== "object") return "";
  return stripNumber(
    row.tower_id ??
      row.building_id ??
      row.towerId ??
      row.buildingId ??
      ""
  );
};

const getNiceCellText = (v) => {
  if (v === null || v === undefined) return "—";
  if (typeof v === "object") return JSON.stringify(v);
  const s = String(v);
  return s === "" ? "—" : s;
};

const HIDE_COLS = new Set([
  "tower_id",
  "unit_id",
  "stage_id",

  // ✅ UI-only hide
  "Snag Completed",
]);
const PERCENT_COLS = new Set([
  "flat_readiness",
  "maker_percent_open",
  "maker_percent_close",
  "maker_flat_readiness_percent",
  "checker_percent_open",
  "checker_percent_close",
  "desnag_rejected_percent",
  "overall_percent",
]);

const RED_HIGHLIGHT_COLS = new Set(["flat_readiness", "maker_flat_readiness_percent"]);
const DAYS_COUNT_COL = "no_of_days_count";

const fmtPercent = (v) => {
  const n = num(v);
  if (n === null) return "—";
  return `${Math.round(n)}%`;
};

const parseDateOnlyLocal = (ymd) => {
  const s = String(ymd || "").trim();
  if (!s) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const d = new Date(`${s}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
};

const daysDiff = (start, end) => {
  if (!start || !end) return null;
  const msPerDay = 24 * 60 * 60 * 1000;
  const diff = Math.floor((end.getTime() - start.getTime()) / msPerDay);
  return diff < 0 ? 0 : diff;
};

const computeDaysCount = (row) => {
  if (!row || typeof row !== "object") return null;

  const backendVal = row?.[DAYS_COUNT_COL];
  const backendNum = num(backendVal);
  if (backendNum !== null && String(backendVal).trim() !== "") {
    return Math.max(0, Math.floor(backendNum));
  }

  const s = parseDateOnlyLocal(row?.start_date);
  if (!s) return null;

  const e = parseDateOnlyLocal(row?.end_date);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = e || today;

  return daysDiff(s, end);
};

const formatCell = (colKey, value, row) => {
  const c = String(colKey || "");
  if (c === DAYS_COUNT_COL) {
    const d = computeDaysCount(row);
    return d === null ? "—" : String(d);
  }
  if (PERCENT_COLS.has(c)) return fmtPercent(value);
  return getNiceCellText(value);
};

function useDebouncedValue(value, delay = 250) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/* ---------------- UI components ---------------- */
const SectionCard = ({ children, className = "" }) => (
  <div
    className={[
      "rounded-2xl border bg-white shadow-sm",
      "ring-1 ring-slate-900/5",
      className,
    ].join(" ")}
  >
    {children}
  </div>
);

const SoftLabel = ({ children }) => (
  <div className="text-[11px] font-semibold tracking-wide text-slate-500">{children}</div>
);

const Card = ({ title, value, Icon, onClick }) => {
  const clickable = typeof onClick === "function";
  const Comp = clickable ? "button" : "div";

  return (
    <Comp
      type={clickable ? "button" : undefined}
      onClick={onClick}
      className={[
        "min-w-[220px] rounded-2xl border bg-white px-4 py-3 text-left",
        "flex items-center justify-between gap-3",
        "shadow-sm ring-1 ring-slate-900/5",
        clickable ? "hover:shadow-md hover:-translate-y-[1px] transition-all cursor-pointer" : "",
      ].join(" ")}
      aria-label={clickable ? `Open ${title}` : undefined}
    >
      <div className="min-w-0">
        <div className="text-[12px] font-semibold text-slate-600 truncate">{title}</div>
        <div className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900">{value}</div>
      </div>

      <div className="shrink-0 rounded-2xl border bg-slate-50 p-2.5 text-slate-800 ring-1 ring-slate-900/5">
        <Icon size={18} />
      </div>
    </Comp>
  );
};

const MiniStat = ({ label, value }) => (
  <div className="rounded-xl border bg-gradient-to-b from-white to-slate-50 px-3 py-2 ring-1 ring-slate-900/5">
    <div className="text-[11px] font-semibold text-slate-600">{label}</div>
    <div className="mt-0.5 text-lg font-extrabold tracking-tight text-slate-900">{value}</div>
  </div>
);

const ChipButton = ({ active, children, onClick, title }) => (
  <button
    type="button"
    title={title}
    onClick={onClick}
    className={[
      "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold",
      "ring-1 ring-slate-900/5",
      active
        ? "border-slate-900 bg-slate-900 text-white shadow-sm"
        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
    ].join(" ")}
  >
    {children}
  </button>
);

const FilterLabel = ({ children }) => (
  <div className="text-xs font-semibold text-slate-600">{children}</div>
);

/** ✅ Multi-select dropdown with checkboxes + Search + Select All / Unselect All */
const MultiSelectDropdown = ({
  label,
  value = [],
  options = [],
  onChange,
  placeholder = "Select...",
  disabled = false,
  compact = false,
}) => {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const wrapRef = useRef(null);

  const selectedSet = useMemo(() => new Set((value || []).map(String)), [value]);

  const filtered = useMemo(() => {
    const s = String(q || "").trim().toLowerCase();
    if (!s) return options || [];
    return (options || []).filter((o) => String(o?.label || "").toLowerCase().includes(s));
  }, [q, options]);

  const selectedCount = (value || []).length;

    const buttonText = useMemo(() => {
    if (!selectedCount) return placeholder;

    // ✅ NEW: show All selected
    if (options?.length && selectedCount === options.length) return "All selected";

    if (selectedCount === 1) {
      const one = options.find((o) => String(o.value) === String(value[0]));
      return one?.label || "1 selected";
    }
    return `${selectedCount} selected`;
  }, [selectedCount, placeholder, options, value]);


  useEffect(() => {
    const onDown = (e) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const toggleVal = (val) => {
    const v = String(val);
    const next = new Set((value || []).map(String));
    if (next.has(v)) next.delete(v);
    else next.add(v);
    onChange(Array.from(next));
  };

  const selectAllShown = () => {
    const next = new Set((value || []).map(String));
    filtered.forEach((o) => next.add(String(o.value)));
    onChange(Array.from(next));
  };

  const unselectAllShown = () => {
    const toRemove = new Set(filtered.map((o) => String(o.value)));
    const next = (value || []).map(String).filter((v) => !toRemove.has(v));
    onChange(next);
  };

  const clearAll = () => onChange([]);

  return (
    <div ref={wrapRef} className="relative">
      <SoftLabel>{label}</SoftLabel>

      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((s) => !s)}
        className={[
          "mt-1 w-full rounded-xl border bg-white px-3 py-2 text-left text-sm",
          "flex items-center justify-between gap-2",
          "shadow-sm ring-1 ring-slate-900/5",
          disabled ? "opacity-60 cursor-not-allowed" : "hover:bg-slate-50",
        ].join(" ")}
      >
        <span className={selectedCount ? "text-slate-900 font-semibold" : "text-slate-500"}>
          {buttonText}
        </span>
        <ChevronDown size={16} className="text-slate-400" />
      </button>

      {open ? (
        <div
          className={[
            "absolute z-30 mt-2 w-full rounded-2xl border bg-white shadow-xl",
            "ring-1 ring-slate-900/10 overflow-hidden",
            compact ? "p-2" : "p-3",
          ].join(" ")}
        >
          <div className="flex items-center gap-2 rounded-xl border bg-white px-2 py-1.5 ring-1 ring-slate-900/5">
            <Search size={14} className="text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search..."
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={selectAllShown}
              className="rounded-xl border bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 ring-1 ring-slate-900/5"
            >
              Select all
            </button>
            <button
              type="button"
              onClick={unselectAllShown}
              className="rounded-xl border bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 ring-1 ring-slate-900/5"
            >
              Unselect all
            </button>
            {selectedCount ? (
              <button
                type="button"
                onClick={clearAll}
                className="ml-auto rounded-xl border bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 ring-1 ring-slate-900/5"
              >
                Clear
              </button>
            ) : null}
          </div>

          <div className="mt-2 max-h-56 overflow-auto rounded-xl border">
            {filtered.length ? (
              filtered.map((o) => {
                const isOn = selectedSet.has(String(o.value));
                return (
                  <button
                    key={String(o.value)}
                    type="button"
                    onClick={() => toggleVal(o.value)}
                    className={[
                      "w-full px-3 py-2 text-left text-sm flex items-center gap-2",
                      "border-b last:border-0",
                      isOn ? "bg-slate-50" : "",
                      "hover:bg-slate-50",
                    ].join(" ")}
                  >
                    {isOn ? (
                      <CheckSquare size={16} className="text-slate-900" />
                    ) : (
                      <Square size={16} className="text-slate-400" />
                    )}
                    <span className="text-slate-800 font-medium">{o.label}</span>
                  </button>
                );
              })
            ) : (
              <div className="px-3 py-3 text-sm text-slate-600">No options found.</div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};

/* ---------------- Project name resolver ---------------- */
const safeJson = (s) => {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
};

const resolveProjectNameLocal = (projectId) => {
  const pid = String(projectId || "");

  const direct =
    localStorage.getItem("ACTIVE_PROJECT_NAME") ||
    localStorage.getItem("PROJECT_NAME") ||
    localStorage.getItem("project_name");
  if (direct && String(direct).trim()) return String(direct).trim();

  const activeRaw = localStorage.getItem("active") || localStorage.getItem("ACTIVE_PROJECT");
  const active = safeJson(activeRaw);
  if (active && typeof active === "object") {
    const candidates = [
      active?.project_name,
      active?.projectName,
      active?.name,
      active?.title,
      active?.project?.name,
      active?.project?.project_name,
      active?.project?.title,
    ].filter(Boolean);

    if (candidates.length) return String(candidates[0]).trim();

    if (active?.id && String(active.id) === pid) {
      const nm = active?.name || active?.project_name || active?.title;
      if (nm) return String(nm).trim();
    }
  }

  const listRaw = localStorage.getItem("projects") || localStorage.getItem("PROJECTS");
  const list = safeJson(listRaw);
  if (Array.isArray(list)) {
    const found = list.find((x) => String(x?.id ?? x?.project_id ?? x?.pk) === pid);
    const nm = found?.name || found?.project_name || found?.title;
    if (nm) return String(nm).trim();
  }

  return "";
};

/**
 * ✅ New KPI Overview (top section)
 */
export default function ProjectOverviewKpi({ projectId: projectIdProp = null }) {
  const params = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const projectId = useMemo(() => {
    if (projectIdProp) return Number(projectIdProp) || projectIdProp;
    return resolveProjectId(params.projectId || params.id);
  }, [params, projectIdProp]);

  const [projectName, setProjectName] = useState("");

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [counts, setCounts] = useState({});
  const [meta, setMeta] = useState({});

  // filters (dropdown multi)
  const [stageIds, setStageIds] = useState([]);
  const [buildingIds, setBuildingIds] = useState([]);
  const [floorIds, setFloorIds] = useState([]);
  const [unitIds, setUnitIds] = useState([]);
  const [pendingFrom, setPendingFrom] = useState([]);

  // dropdown options
  const [stageOptions, setStageOptions] = useState([]);
  const [buildingOptions, setBuildingOptions] = useState([]);
  const [floorOptions, setFloorOptions] = useState([]);

  // keep all units + filtered units (by floor)
  const [unitAllOptions, setUnitAllOptions] = useState([]); // [{value,label,floorKey,number,buildingId}]
  const [unitOptions, setUnitOptions] = useState([]);

  /* ---------------- WIP MODAL STATES ---------------- */
  const [wipOpen, setWipOpen] = useState(false);

  const [wipLoading, setWipLoading] = useState(false);
  const [wipErr, setWipErr] = useState("");
  const [wipRows, setWipRows] = useState([]);
  const [wipMeta, setWipMeta] = useState({});
  const [wipCols, setWipCols] = useState([]);

  const [wipBreakdownLoading, setWipBreakdownLoading] = useState(false);
  const [wipBreakdownErr, setWipBreakdownErr] = useState("");
  const [wipBreakdown, setWipBreakdown] = useState(null);

  const [wipCtx, setWipCtx] = useState({
    stageId: null,
    towerId: null,
    flatCsv: null,
  });

  const [wipRole, setWipRole] = useState("");
//   const debouncedWipRole = useDebouncedValue(wipRole, 250);
const debouncedWipRole = useDebouncedValue(wipRole, 0);


  const [openingFlatId, setOpeningFlatId] = useState(null);

  /* ---------------- anti-spam + strictmode guards ---------------- */
  const didInitRef = useRef({ projectId: null });
  const abortRef = useRef({
    summary: null,
    wipTable: null,
    wipBreakdown: null,
    flatPrefetch: null,
    projectName: null,
  });

    // ✅ auto-select guards
  const autoPreselectRef = useRef({ projectId: null, stages: false, towers: false });
  const userTouchedRef = useRef({ stages: false, towers: false });


  const newSignal = (key) => {
    try {
      abortRef.current[key]?.abort?.();
    } catch {}
    const ac = new AbortController();
    abortRef.current[key] = ac;
    return ac.signal;
  };

  useEffect(() => {
    return () => {
      Object.values(abortRef.current).forEach((ac) => {
        try {
          ac?.abort?.();
        } catch {}
      });
    };
  }, []);

  const stageNameById = useMemo(() => {
    const m = new Map();
    (stageOptions || []).forEach((o) => m.set(String(o.value), o.label));
    return m;
  }, [stageOptions]);
    // ✅ Auto-select ALL stages once options load (only first time, only if user didn't touch)
  useEffect(() => {
    if (!projectId) return;
    if (!stageOptions?.length) return;

    if (userTouchedRef.current.stages) return;
    if (autoPreselectRef.current.projectId !== projectId) {
      autoPreselectRef.current = { projectId, stages: false, towers: false };
    }
    if (autoPreselectRef.current.stages) return;
    if ((stageIds || []).length) return;

    autoPreselectRef.current.stages = true;
    setStageIds(stageOptions.map((o) => String(o.value)));
  }, [projectId, stageOptions, stageIds]);


    // ✅ Auto-select ALL towers once options load (only first time, only if user didn't touch)
  useEffect(() => {
    if (!projectId) return;
    if (!buildingOptions?.length) return;

    if (userTouchedRef.current.towers) return;
    if (autoPreselectRef.current.projectId !== projectId) {
      autoPreselectRef.current = { projectId, stages: false, towers: false };
    }
    if (autoPreselectRef.current.towers) return;
    if ((buildingIds || []).length) return;

    autoPreselectRef.current.towers = true;

    const all = buildingOptions.map((o) => String(o.value));
    setBuildingIds(all);

    // ✅ dependent filters reset
    setFloorIds([]);
    setUnitIds([]);
  }, [projectId, buildingOptions, buildingIds]);





  const towerNameById = useMemo(() => {
    const m = new Map();
    (buildingOptions || []).forEach((o) => m.set(String(o.value), o.label));
    return m;
  }, [buildingOptions]);

  const floorNameByKey = useMemo(() => {
    const m = new Map();
    (floorOptions || []).forEach((o) => m.set(String(o.value), o.label));
    return m;
  }, [floorOptions]);

  // ✅ floorKey -> [unitIds]
  const unitsByFloorKeys = useMemo(() => {
    const map = new Map();
    (unitAllOptions || []).forEach((u) => {
      const fk = String(u.floorKey || "");
      if (!fk) return;
      if (!map.has(fk)) map.set(fk, []);
      map.get(fk).push(String(u.value));
    });
    return map;
  }, [unitAllOptions]);

  // ✅ IMPORTANT: towerId -> (flatNumber -> flatId)
  const flatIdByTowerAndNumber = useMemo(() => {
    const outer = new Map(); // towerId -> Map(number -> id)
    (unitAllOptions || []).forEach((u) => {
      const tid = String(u.buildingId || "").trim();
      const no = String(u.number || "").trim();
      const id = String(u.value || "").trim();
      if (!tid || !no || !id) return;

      if (!outer.has(tid)) outer.set(tid, new Map());
      outer.get(tid).set(no, id);
    });
    return outer;
  }, [unitAllOptions]);

  // ✅ fallback global number -> id (first seen)
  const flatIdByNumberGlobal = useMemo(() => {
    const m = new Map();
    (unitAllOptions || []).forEach((u) => {
      const no = String(u.number || "").trim();
      const id = String(u.value || "").trim();
      if (!no || !id) return;
      if (!m.has(no)) m.set(no, id);
    });
    return m;
  }, [unitAllOptions]);

  // ✅ FINAL resolver used by WIP table clicks
  const resolveFlatIdFromRow = useCallback(
    (row) => {
      // 1) if row already has id
      const direct = getFlatIdFromRow(row);
      if (direct) return String(direct);

      // 2) try number mapping
      const no = getFlatNumberFromRow(row);
      if (!no) return null;

      // 2a) if row has tower/building id
      const rowTid = getRowTowerId(row);
      if (rowTid && flatIdByTowerAndNumber.has(rowTid)) {
        const id = flatIdByTowerAndNumber.get(rowTid).get(no);
        if (id) return String(id);
      }

      // 2b) if user selected exactly 1 tower
      if ((buildingIds || []).length === 1) {
        const onlyTid = String(buildingIds[0]);
        const id = flatIdByTowerAndNumber.get(onlyTid)?.get(no);
        if (id) return String(id);
      }

      // 2c) global fallback
      return flatIdByNumberGlobal.get(no) || null;
    },
    [flatIdByTowerAndNumber, flatIdByNumberGlobal, buildingIds]
  );

  /* ✅ project name fetch (best-effort) */
  const fetchProjectName = useCallback(
    async (pid) => {
      if (!pid) return;

      const stName =
        location?.state?.projectName ||
        location?.state?.project_name ||
        location?.state?.project?.name ||
        location?.state?.project?.project_name ||
        "";
      if (stName && String(stName).trim()) {
        setProjectName(String(stName).trim());
        return;
      }

      const local = resolveProjectNameLocal(pid);
      if (local) {
        setProjectName(local);
        return;
      }

      try {
        const signal = newSignal("projectName");
        const endpoints = [
          `${API_BASE}/api/setup/projects/${pid}/`,
          `${API_BASE}/setup/projects/${pid}/`,
          `${API_BASE}/api/projects/${pid}/`,
          `${API_BASE}/projects/${pid}/`,
        ];

        for (const url of endpoints) {
          try {
            const res = await axios.get(url, { headers: authHeaders(), signal });
            const d = res?.data ?? null;

            const name =
              d?.name ||
              d?.project_name ||
              d?.title ||
              d?.data?.name ||
              d?.data?.project_name ||
              d?.result?.name ||
              d?.result?.project_name ||
              "";

            if (name && String(name).trim()) {
              setProjectName(String(name).trim());
              return;
            }
          } catch (e) {
            if (e?.name === "CanceledError" || e?.code === "ERR_CANCELED") return;
          }
        }
      } catch {}
    },
    [location]
  );

  const getSelectedFilters = useCallback(() => {
    const stages = uniq(stageIds);
    const towers = uniq(buildingIds);
    const floors = uniq(floorIds);

    let flats = uniq(unitIds);

    // ✅ if floor selected but units not selected → auto include all units from selected floors
    if (floors.length && !flats.length) {
      const all = [];
      floors.forEach((fk) => {
        const list = unitsByFloorKeys.get(String(fk)) || [];
        all.push(...list);
      });
      flats = uniq(all);
    }

    const roles = uniq(pendingFrom);
    return { stages, towers, floors, flats, roles };
  }, [stageIds, buildingIds, floorIds, unitIds, pendingFrom, unitsByFloorKeys]);

  const buildPayload = useCallback(() => {
    const { stages, towers, flats, roles } = getSelectedFilters();
    const payload = { project_id: projectId };

    if (stages.length) payload.stage_id = stages;
    if (towers.length) payload.building_id = towers;

    // ✅ main filter is unit_id
    if (flats.length) payload.unit_id = flats;

    if (roles.length) payload.pending_from = roles;
    return payload;
  }, [getSelectedFilters, projectId]);

  const buildModalReportParams = useCallback(
    ({ include_rows = true, limit = 200 } = {}) => {
      const stageId = wipCtx?.stageId;
      const towerId = wipCtx?.towerId;

      const p = { project_id: projectId, group_by: "stage" };

      if (stageId) {
        p.stage_id = String(stageId);
        p.stage_ids = String(stageId);
      }

      if (towerId) {
        p.tower_id = String(towerId);
        p.building_id = String(towerId);
      }

      if (wipCtx?.flatCsv) {
        p.flat_id = String(wipCtx.flatCsv);
        p.unit_id = String(wipCtx.flatCsv);
      }

    //   if (debouncedWipRole) p.pending_from = String(debouncedWipRole);
    const role = normRoleCode(debouncedWipRole);
if (role) p.pending_from = role;


      if (include_rows) p.include_rows = true;
      if (limit) p.limit = limit;

      return p;
    },
    [projectId, wipCtx, debouncedWipRole]
  );

  const buildModalBreakdownParams = useCallback(() => {
    const stageId = wipCtx?.stageId;
    const towerId = wipCtx?.towerId;

    const p = { project_id: projectId };
    if (stageId) p.stage_id = Number(stageId);
    if (towerId) p.tower_id = Number(towerId);
const role = normRoleCode(debouncedWipRole);
if (role) p.pending_from = role;
    return p;
  }, [projectId, wipCtx, debouncedWipRole]);

  const fetchSummary = useCallback(async () => {
    if (!projectId) {
      setErr("Project not selected. (project_id missing)");
      setLoading(false);
      return;
    }

    setLoading(true);
    setErr("");

    try {
      const signal = newSignal("summary");
      const res = await getUnitStageRoleSummary(buildPayload(), { signal });
      const data = res?.data ?? res;

      setCounts(data?.counts || data?.data?.counts || data?.result?.counts || {});
      setMeta(data?.meta || data?.data?.meta || data?.result?.meta || {});
    } catch (e) {
      if (e?.name === "CanceledError" || e?.code === "ERR_CANCELED") return;
      const msg =
        e?.response?.data?.detail ||
        e?.response?.data?.message ||
        e?.message ||
        "Failed to load overview";
      setErr(String(msg));
    } finally {
      setLoading(false);
    }
  }, [projectId, buildPayload]);

  const fetchFilterOptions = useCallback(async () => {
    if (!projectId) return;

    try {
      const [stagesRes, buildingsRes] = await Promise.allSettled([
        getStageDetailsByProjectId(projectId),
        fetchTowersByProject(projectId),
      ]);

      if (stagesRes.status === "fulfilled") {
        const list = normalizeList(stagesRes.value);
        setStageOptions(
          list
            .map((x) => ({
              value: String(x.id ?? x.stage_id ?? x.pk ?? ""),
              label: x.name ?? x.stage_name ?? x.title ?? `Stage #${x.id}`,
            }))
            .filter((o) => o.value)
        );
      } else setStageOptions([]);

      if (buildingsRes.status === "fulfilled") {
        const list = normalizeList(buildingsRes.value);
        // setBuildingOptions(
        //   list
        //     .map((x) => ({
        //       value: String(x.id ?? x.building_id ?? x.pk ?? ""),
        //       label:
        //         x.name ??
        //         x.building_name ??
        //         x.tower_name ??
        //         x.title ??
        //         `Building #${x.id}`,
        //     }))
        //     .filter((o) => o.value)
        // );

        const towerOpts = list
          .map((x) => ({
            value: String(x.id ?? x.building_id ?? x.pk ?? ""),
            label:
              x.name ??
              x.building_name ??
              x.tower_name ??
              x.title ??
              `Building #${x.id}`,
          }))
          .filter((o) => o.value);
        
        setBuildingOptions(towerOpts);
        
        // AUTO SELECT FIRST TOWER
        if (towerOpts.length > 0) {
          setBuildingIds([towerOpts[0].value]);
        }

      } else setBuildingOptions([]);
    } catch {
      setStageOptions([]);
      setBuildingOptions([]);
    }
  }, [projectId]);

  /** ✅ fetch floors + units (dependent on selected buildings) */
  const fetchFloorsAndUnitsFromBuildings = useCallback(
    async (buildingIdList) => {
      const ids = uniq(buildingIdList).map(String);
      if (!ids.length) {
        setFloorOptions([]);
        setUnitAllOptions([]);
        setUnitOptions([]);
        setFloorIds([]);
        setUnitIds([]);
        return;
      }

      const settled = await Promise.allSettled(ids.map((bid) => getLevelsWithFlatsByBuilding(bid)));

      const floorMap = new Map(); // floorKey -> {value,label}
      const unitMap = new Map(); // unitId -> {value,label,floorKey,number,buildingId}

      settled.forEach((r, idx) => {
        if (r.status !== "fulfilled") return;

        const bid = ids[idx];
        const towerLabel = towerNameById.get(String(bid)) || `Tower #${bid}`;

        const levels = normalizeList(r.value);
        levels.forEach((lvl) => {
          const floorName = lvl?.name ? String(lvl.name) : "Floor";
          const rawLevelId = lvl?.id ?? lvl?.floor_id ?? lvl?.level_id ?? lvl?.pk ?? null;

          const floorKey = `${bid}:${String(rawLevelId ?? floorName)}`;
          const floorLabel = `${towerLabel} • ${floorName}`;

          floorMap.set(floorKey, { value: floorKey, label: floorLabel });

          const flats = Array.isArray(lvl?.flats) ? lvl.flats : [];
          flats.forEach((f) => {
            const id = f?.id ?? f?.flat_id ?? f?.pk;
            if (!id) return;

            // ✅ IMPORTANT: this is exactly your API: flats[].number + flats[].id
            const number =
              f?.number ??
              f?.flat_number ??
              f?.unit_no ??
              f?.unit_number ??
              f?.name ??
              "";

            const typeName =
              f?.flattype?.type_name ??
              f?.flat_type?.type_name ??
              f?.flat_type_name ??
              "";

            const labelParts = [];
            if (number) labelParts.push(String(number));
            if (floorName) labelParts.push(floorName);

            const label = labelParts.join(" • ") || `Unit #${id}`;
            const finalLabel = typeName ? `${label} (${typeName})` : label;

            unitMap.set(String(id), {
              value: String(id),
              label: finalLabel,
              floorKey,
              number: String(number || "").trim(),   // ✅ store number
              buildingId: String(bid),               // ✅ store tower/building id
            });
          });
        });
      });

      const floors = Array.from(floorMap.values()).sort((a, b) =>
        String(a.label).localeCompare(String(b.label))
      );
      const allUnits = Array.from(unitMap.values());

      allUnits.sort((a, b) => {
        const na = parseInt(String(a.label).match(/\d+/)?.[0] || "0", 10);
        const nb = parseInt(String(b.label).match(/\d+/)?.[0] || "0", 10);
        return na - nb;
      });

      setFloorOptions(floors);
      setUnitAllOptions(allUnits);

      const allowedFloors = new Set(floors.map((f) => String(f.value)));
      setFloorIds((prev) => (prev || []).filter((x) => allowedFloors.has(String(x))));

      const allowedUnits = new Set(allUnits.map((u) => String(u.value)));
      setUnitIds((prev) => (prev || []).filter((x) => allowedUnits.has(String(x))));
    },
    [towerNameById]
  );

  /** ✅ filter unit dropdown list based on selected floors (UI only) */
  useEffect(() => {
    const floors = new Set((floorIds || []).map(String));
    let next = unitAllOptions || [];

    if (floors.size) next = next.filter((u) => floors.has(String(u.floorKey)));

    setUnitOptions(next);

    const allowed = new Set(next.map((u) => String(u.value)));
    setUnitIds((prev) => (prev || []).filter((x) => allowed.has(String(x))));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [floorIds, unitAllOptions]);

  useEffect(() => {
    if (!projectId) return;

    if (didInitRef.current.projectId === projectId) return;
    didInitRef.current.projectId = projectId;
    autoPreselectRef.current = { projectId, stages: false, towers: false };
    userTouchedRef.current = { stages: false, towers: false };


    setStageIds([]);
    setBuildingIds([]);
    setFloorIds([]);
    setUnitIds([]);
    setPendingFrom([]);

    setFloorOptions([]);
    setUnitAllOptions([]);
    setUnitOptions([]);

    fetchFilterOptions();
    fetchSummary();
    fetchProjectName(projectId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  useEffect(() => {
    if (!projectId) return;
    fetchFloorsAndUnitsFromBuildings(buildingIds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, buildingIds]);

  const resetFilters = () => {
    setStageIds([]);
    setBuildingIds([]);
    setFloorIds([]);
    setUnitIds([]);
    setPendingFrom([]);
    fetchSummary();
  };

  /* ---------------- WIP modal data ---------------- */
  const fetchWipTable = useCallback(async () => {
    if (!projectId) return;
    if (!wipCtx?.stageId) return;

    setWipLoading(true);
    setWipErr("");

    try {
      const signal = newSignal("wipTable");
      const params = buildModalReportParams({ include_rows: true, limit: 200 });
      const res = await getUnitChecklistReport(params, { signal });
      const data = res?.data ?? res;

      const rows = pickRows(data);
      const cols = pickColumns(data, rows);

      setWipRows(Array.isArray(rows) ? rows : []);
      setWipCols(Array.isArray(cols) ? cols : []);
      setWipMeta(pickMeta(data));
    } catch (e) {
      if (e?.name === "CanceledError" || e?.code === "ERR_CANCELED") return;
      const msg =
        e?.response?.data?.detail ||
        e?.response?.data?.message ||
        e?.message ||
        "Failed to load report table";
      setWipErr(String(msg));
    } finally {
      setWipLoading(false);
    }
  }, [projectId, wipCtx, buildModalReportParams]);

  const fetchWipBreakdown = useCallback(async () => {
    if (!projectId) return;
    if (!wipCtx?.stageId) return;

    setWipBreakdownLoading(true);
    setWipBreakdownErr("");

    try {
      const signal = newSignal("wipBreakdown");
      const params = buildModalBreakdownParams();
      const res = await getUnitWorkInProgressBreakdown(params, { signal });
      const data = res?.data ?? res;

      setWipBreakdown(data && typeof data === "object" ? data : null);
    } catch (e) {
      if (e?.name === "CanceledError" || e?.code === "ERR_CANCELED") return;
      const msg =
        e?.response?.data?.detail ||
        e?.response?.data?.message ||
        e?.message ||
        "Failed to load breakdown";
      setWipBreakdownErr(String(msg));
    } finally {
      setWipBreakdownLoading(false);
    }
  }, [projectId, wipCtx, buildModalBreakdownParams]);

  const refreshWipAll = useCallback(async () => {
    await Promise.allSettled([fetchWipTable(), fetchWipBreakdown()]);
  }, [fetchWipTable, fetchWipBreakdown]);

  useEffect(() => {
    if (!wipOpen) return;
    if (!projectId) return;
    if (!wipCtx?.stageId) return;
    refreshWipAll();
  }, [
    wipOpen,
    projectId,
    wipCtx?.stageId,
    wipCtx?.towerId,
    wipCtx?.flatCsv,
    debouncedWipRole,
    refreshWipAll,
  ]);

  const openWipModal = async () => {
    setWipOpen(true);

    setWipErr("");
    setWipRows([]);
    setWipMeta({});
    setWipCols([]);

    setWipBreakdownErr("");
    setWipBreakdown(null);

    setWipRole("");

    const { stages, towers, flats } = getSelectedFilters();
    if (!stages.length) {
      setWipErr("Select at least one Stage first (stage_ids required).");
      return;
    }

    const pickedStage = stages[0];
    const pickedTower = towers?.[0] || null;
    const flatCsv = toCsv(flats);

    setWipCtx({ stageId: pickedStage, towerId: pickedTower, flatCsv });
  };

  const exportWipExcel = async () => {
    const stageId = wipCtx?.stageId;
    if (!stageId) {
      setWipErr("Select at least one Stage first (stage_ids required).");
      return;
    }

    try {
      const params = buildModalReportParams({ include_rows: true, limit: 200 });
      await exportUnitChecklistReportExcel(params);
    } catch (e) {
      const msg =
        e?.response?.data?.detail ||
        e?.response?.data?.message ||
        e?.message ||
        "Export failed";
      setWipErr(String(msg));
    }
  };

  const wipColumns = useMemo(() => {
    const cols =
      (Array.isArray(wipCols) && wipCols.length ? wipCols : null) ||
      (wipRows?.[0] && typeof wipRows[0] === "object" ? Object.keys(wipRows[0]) : []);
    return (cols || []).filter((c) => !HIDE_COLS.has(String(c)));
  }, [wipCols, wipRows]);

  const breakdownMeta = wipBreakdown?.meta || {};
  const wipUnitCount = wipBreakdown?.work_in_progress_units?.count ?? null;
  const byPendingFrom = wipBreakdown?.breakdown?.by_pending_from || {};
  const modalRoleChips = useMemo(() => {
  const m = new Map(); // code -> count (sum duplicates)
  Object.entries(byPendingFrom || {}).forEach(([k, v]) => {
    const code = normRoleCode(k);
    if (!code) return;
    const n = Number(v);
    m.set(code, (m.get(code) || 0) + (Number.isFinite(n) ? n : 0));
  });
  return Array.from(m.entries()).map(([code, count]) => ({ code, count }));
}, [byPendingFrom]);

  const makerSupervisorSplit = wipBreakdown?.breakdown?.maker_supervisor_split || {};
  const modalAsOf = breakdownMeta?.as_of || wipMeta?.as_of || "";

  const cards = useMemo(
    () => [
      { key: "total_units", title: "Total Units", value: fmtInt(counts.total_units), Icon: ClipboardList },
      { key: "pending_yet_to_start", title: "Pending (Yet to Start)", value: fmtInt(counts.pending_yet_to_start), Icon: Clock },
      { key: "initialised_unit_count", title: "Initialized Units", value: fmtInt(counts.initialised_unit_count), Icon: PlayCircle },
      { key: "work_in_progress_unit", title: "Unit Work In Progress", value: fmtInt(counts.work_in_progress_unit), Icon: Activity, onClick: openWipModal },
      { key: "yet_to_verify", title: "Yet to Verify (Questions)", value: fmtInt(counts.yet_to_verify), Icon: ShieldCheck },
      { key: "complete", title: "Complete", value: fmtInt(counts.complete), Icon: CheckCircle2 },
    ],
    [counts]
  );

  const RoleChip = ({ code, label }) => {
    const active = pendingFrom.includes(code);
    return (
      <button
        type="button"
        onClick={() =>
          setPendingFrom((prev) => (active ? prev.filter((x) => x !== code) : [...prev, code]))
        }
        className={[
          "rounded-full border px-3 py-1.5 text-xs font-semibold",
          "ring-1 ring-slate-900/5",
          active
            ? "border-slate-900 bg-slate-900 text-white shadow-sm"
            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
        ].join(" ")}
      >
        {label}
      </button>
    );
  };

  const activeFiltersText = useMemo(() => {
    const { stages, towers, floors, flats, roles } = getSelectedFilters();

    const sNames = stages
      .map((id) => stageNameById.get(String(id)) || `Stage#${id}`)
      .slice(0, 4);

    const tNames = towers
      .map((id) => towerNameById.get(String(id)) || `Tower#${id}`)
      .slice(0, 3);

    const fNames = floors.map((fk) => floorNameByKey.get(String(fk)) || String(fk)).slice(0, 2);

    const parts = [];
    if (stages.length) parts.push(`Stage: ${sNames.join(", ")}${stages.length > 4 ? "…" : ""}`);
    if (towers.length) parts.push(`Tower: ${tNames.join(", ")}${towers.length > 3 ? "…" : ""}`);
    if (floors.length) parts.push(`Floor: ${fNames.join(", ")}${floors.length > 2 ? "…" : ""}`);
    if (flats.length) parts.push(`Units: ${flats.length}`);
    if (roles.length) parts.push(`Pending From: ${roles.join(", ")}`);

    return parts.length ? parts.join(" • ") : "";
  }, [getSelectedFilters, stageNameById, towerNameById, floorNameByKey]);

  const modalStageName = useMemo(() => {
    const sid = wipCtx?.stageId;
    if (!sid) return "";
    return stageNameById.get(String(sid)) || `Stage #${sid}`;
  }, [wipCtx, stageNameById]);

  const modalTowerName = useMemo(() => {
    const tid = wipCtx?.towerId;
    if (!tid) return "";
    return towerNameById.get(String(tid)) || `Tower #${tid}`;
  }, [wipCtx, towerNameById]);

  // ✅ navigate should NEVER be blocked by prefetch
  const goToFlatReport = async (row, flatIdOverride = null) => {
    const flatId = String(flatIdOverride || resolveFlatIdFromRow(row) || "");

    console.log("➡️ goToFlatReport() flatId:", flatId, "row:", row);

    if (!flatId) {
      const no = getFlatNumberFromRow(row);
      setWipErr(`Flat ID not found. Row has number: ${no || "—"}. Check row keys in console.`);
      console.log("❌ Row keys:", Object.keys(row || {}));
      return;
    }

    const flatMeta = {
      number: row.flat_number ?? row.unit_number ?? row.number ?? row.unit_no ?? row.unit_label ?? null,
      typeName: row.flat_type_name ?? row.unit_type_name ?? row.type_name ?? row.type ?? null,
      levelName: row.level_name ?? row.floor_name ?? row.level ?? null,
    };

    const filters = {
      stageId: wipCtx?.stageId || null,
      buildingId: wipCtx?.towerId || null,
    };

    const path = `/projects/${projectId}/flat-report/${flatId}`;

    // ✅ Navigate immediately
    setWipOpen(false);
    navigate(path, { state: { flatMeta, filters, from: "ProjectOverviewKpi" } });

    // ✅ Optional prefetch (won't block navigation)
    try {
      const signal = newSignal("flatPrefetch");

      const paramsReq = { project_id: projectId, flat_id: flatId };
      if (wipCtx?.stageId) paramsReq.stage_id = wipCtx.stageId;
      if (wipCtx?.towerId) paramsReq.building_id = wipCtx.towerId;

      const res = await axios.get(`${API_BASE}/checklists/stats/flat-room/`, {
        params: paramsReq,
        headers: authHeaders(),
        signal,
      });

      console.log("✅ Prefetch flat-room success:", res?.data);

      sessionStorage.setItem(
        `prefetch_flatroom_${projectId}_${flatId}`,
        JSON.stringify(res?.data ?? null)
      );
    } catch (e) {
      if (e?.name === "CanceledError" || e?.code === "ERR_CANCELED") return;
      console.log("⚠️ Prefetch failed (navigation already done):", e?.response?.data || e?.message);
    }
  };
const toggleModalRole = (roleCode) => {
  const code = normRoleCode(roleCode);
  setWipRole((prev) => (normRoleCode(prev) === code ? "" : code));
};

//   const toggleModalRole = (roleCode) => {
//     const code = String(roleCode || "").toUpperCase();
//     setWipRole((prev) => (prev === code ? "" : code));
//   };

  const asOfText = meta?.as_of || meta?.asOf || meta?.date || "";

  return (
    <div className="bg-slate-50">
      <div className="mx-auto max-w-[1400px] px-4 md:px-6 pt-5 md:pt-7 pb-2 space-y-4">
        {/* Header */}
        <SectionCard className="p-4 md:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => navigate("/config")}
                  className="h-10 w-10 rounded-xl border bg-white text-slate-800 shadow-sm ring-1 ring-slate-900/5 hover:bg-slate-50"
                  aria-label="Back"
                  title="Back"
                >
                  ←
                </button>

                <div className="min-w-0">
                  <div className="text-lg md:text-xl font-extrabold tracking-tight text-slate-900 truncate">
                    {projectName ? projectName : projectId ? `Project #${projectId}` : "Project"}
                  </div>
                  <div className="mt-0.5 text-xs font-semibold text-slate-500">
                    <span className="inline-flex items-center gap-2">
                      <span className="truncate">{activeFiltersText}</span>
                      {asOfText ? <span>• As of: {asOfText}</span> : null}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={fetchSummary}
              className="inline-flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-900/5 hover:bg-slate-50"
            >
              <RefreshCcw size={16} />
              Refresh
            </button>
          </div>
        </SectionCard>

        {/* Filters */}
        <SectionCard className="p-4 md:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-sm font-extrabold text-slate-900">Filters</div>
              <div className="text-xs font-semibold text-slate-500 mt-0.5">
                Choose scope and click <span className="font-black text-slate-700">Apply</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={resetFilters}
                className="rounded-xl border bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 ring-1 ring-slate-900/5"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={fetchSummary}
                className="rounded-xl border border-slate-900 bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:opacity-90 shadow-sm"
              >
                Apply
              </button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
            <MultiSelectDropdown
              label="Stages"
              value={stageIds}
              options={stageOptions}
onChange={(vals) => {
  userTouchedRef.current.stages = true;
  setStageIds(vals);
}}
              placeholder="Select stages"
            />

            <MultiSelectDropdown
              label="Buildings / Towers"
              value={buildingIds}
              options={buildingOptions}
              onChange={(vals) => {
  userTouchedRef.current.towers = true;
  setBuildingIds(vals);
  setFloorIds([]);
  setUnitIds([]);
}}

              placeholder="Select towers"
            />

            <MultiSelectDropdown
              label="Floors"
              value={floorIds}
              options={floorOptions}
              onChange={(vals) => {
                setFloorIds(vals);
                setUnitIds([]);
              }}
              placeholder={buildingIds.length ? "Select floors" : "Select tower first"}
              disabled={!buildingIds.length}
            />

            <MultiSelectDropdown
              label="Units"
              value={unitIds}
              options={unitOptions}
              onChange={setUnitIds}
              placeholder={
                !buildingIds.length
                  ? "Select tower first"
                  : floorIds.length
                  ? "Select units (filtered by floor)"
                  : "Select units"
              }
              disabled={!buildingIds.length}
            />
          </div>

         
        </SectionCard>

        {err ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700 ring-1 ring-red-900/5">
            {err}
          </div>
        ) : null}

        {/* KPI header */}
        <div className="flex items-center justify-between">
          <div className="text-sm font-extrabold text-slate-900">KPIs</div>
          <div className="text-xs font-semibold text-slate-500">Scroll horizontally if needed</div>
        </div>

        {/* KPI cards */}
        <div className="rounded-2xl border bg-white p-3 shadow-sm ring-1 ring-slate-900/5">
          <div className="flex gap-3 overflow-x-auto pb-2 pr-2">
            {loading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="min-w-[220px] h-[82px] animate-pulse rounded-2xl border bg-white px-4 py-3 ring-1 ring-slate-900/5"
                  >
                    <div className="h-3 w-28 rounded bg-slate-100" />
                    <div className="mt-3 h-6 w-16 rounded bg-slate-100" />
                  </div>
                ))
              : cards.map((c) => (
                  <Card
                    key={c.key}
                    title={c.title}
                    value={c.value}
                    Icon={c.Icon}
                    onClick={c.onClick}
                  />
                ))}
          </div>
        </div>

        {/* ---------------- WIP MODAL ---------------- */}
        {/* ---------------- WIP MODAL (OPAQUE / NO TRANSPARENCY) ---------------- */}
{wipOpen ? (
  <div
    className="fixed inset-0 z-[9999] bg-white"
    role="dialog"
    aria-modal="true"
  >
    {/* keep space for your top navbar (64px) */}
    <div className="h-full pt-[64px]">
      {/* click on empty white area closes (not inside panel) */}
      <div
        className="h-full overflow-y-auto p-3 md:p-4"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) setWipOpen(false);
        }}
      >
        <div className="mx-auto w-full max-w-[1400px] min-h-full">
          <div className="min-h-full rounded-3xl bg-white shadow-2xl ring-1 ring-slate-900/10 overflow-hidden">
            {/* Sticky Header */}
            <div className="sticky top-0 z-20 border-b bg-white p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-base font-extrabold text-slate-900">
                    Work In Progress Breakdown
                  </div>
                  <div className="mt-1 text-xs font-semibold text-slate-500">
                    {modalStageName ? <span>Stage: {modalStageName}</span> : null}
                    {modalTowerName ? <span> • Tower: {modalTowerName}</span> : null}
                    {wipRole ? <span> • Role: {roleLabel(wipRole)}</span> : null}
                    {modalAsOf ? <span> • As of: {modalAsOf}</span> : null}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={refreshWipAll}
                    className="inline-flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 ring-1 ring-slate-900/5"
                  >
                    <RefreshCcw size={14} />
                    Refresh
                  </button>

                  <button
                    type="button"
                    onClick={exportWipExcel}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-900 bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:opacity-90 shadow-sm"
                  >
                    <Download size={14} />
                    Export Excel
                  </button>

                  <button
                    type="button"
                    onClick={() => setWipOpen(false)}
                    className="rounded-xl border bg-white p-2 text-slate-700 hover:bg-slate-50 ring-1 ring-slate-900/5"
                    aria-label="Close"
                    title="Close"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="bg-white p-3">
              {wipBreakdownErr ? (
                <div className="mb-3 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700 ring-1 ring-red-900/5">
                  {wipBreakdownErr}
                </div>
              ) : null}

              {wipErr ? (
                <div className="mb-3 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700 ring-1 ring-red-900/5">
                  {wipErr}
                </div>
              ) : null}

              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs font-extrabold text-slate-700">Summary</div>

                <div className="flex flex-wrap items-center gap-2">
                  <ChipButton
                    active={!wipRole}
                    onClick={() => setWipRole("")}
                    title="Show all roles"
                  >
                    All Roles
                  </ChipButton>

                  {modalRoleChips.map(({ code, count }) => (
                    <ChipButton
                      key={code}
                      active={normRoleCode(wipRole) === code}
                      onClick={() => toggleModalRole(code)}
                      title="Filter table + breakdown by this role"
                    >
                      {roleLabel(code)} • {fmtInt(count)}
                    </ChipButton>
                  ))}
                </div>
              </div>

              {wipBreakdownLoading ? (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-[56px] animate-pulse rounded-xl border bg-white px-3 py-2 ring-1 ring-slate-900/5"
                    >
                      <div className="h-3 w-20 rounded bg-slate-100" />
                      <div className="mt-2 h-5 w-12 rounded bg-slate-100" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <MiniStat label="WIP Units" value={fmtInt(wipUnitCount)} />
                  <MiniStat label="Role Filter" value={wipRole ? roleLabel(wipRole) : "—"} />

                  {makerSupervisorSplit &&
                  typeof makerSupervisorSplit === "object" &&
                  Object.keys(makerSupervisorSplit).length ? (
                    <div className="mt-3 rounded-2xl border bg-slate-50 p-3 sm:col-span-4 ring-1 ring-slate-900/5">
                      <div className="mb-2 text-xs font-extrabold text-slate-700">
                        Maker / Supervisor Split
                      </div>

                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {[
                          ["maker_pending", "units_with_maker_pending"],
                          ["supervisor_pending", "units_with_supervisor_pending"],
                        ].map(([label, key]) => (
                          <MiniStat
                            key={key}
                            label={splitLabel(label)}
                            value={fmtInt(makerSupervisorSplit?.[key])}
                          />
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              )}

              <div className="mt-4 rounded-3xl border overflow-hidden ring-1 ring-slate-900/5 bg-white">
                <div className="flex items-center justify-between gap-2 border-b px-4 py-3 bg-white">
                  <div className="text-sm font-extrabold text-slate-900">Excel Table Preview</div>
                  <div className="text-[11px] font-semibold text-slate-500">
                    Click a row to open Flat Report
                  </div>
                </div>

                {wipLoading ? (
                  <div className="p-4 text-sm font-semibold text-slate-600">Loading...</div>
                ) : !wipRows?.length ? (
                  <div className="p-4 text-sm font-semibold text-slate-600">No rows returned.</div>
                ) : (
                  <div className="max-h-[calc(100dvh-260px)] overflow-auto bg-white">
                    <table className="min-w-max w-full text-sm bg-white">
                      <thead className="sticky top-0 bg-white">
                        <tr className="border-b bg-white">
                          <th className="whitespace-nowrap px-4 py-2 text-left text-[11px] font-extrabold text-slate-600">
                            Open
                          </th>

                          {wipColumns.map((k) => {
                            const colKey = String(k);
                            const isRed = RED_HIGHLIGHT_COLS.has(colKey);
                            return (
                              <th
                                key={colKey}
                                className={[
                                  "whitespace-nowrap px-4 py-2 text-left text-[11px] font-extrabold",
                                  isRed ? "bg-red-50 text-red-700" : "bg-white text-slate-600",
                                ].join(" ")}
                              >
                                {colKey.replace(/_/g, " ")}
                              </th>
                            );
                          })}
                        </tr>
                      </thead>

                      <tbody className="bg-white">
                        {wipRows.map((row, idx) => {
                          const resolvedFlatId = resolveFlatIdFromRow(row);
                          const clickable = Boolean(resolvedFlatId);

                          return (
                            <tr
                              key={idx}
                              className={[
                                "border-b last:border-0",
                                idx % 2 === 0 ? "bg-white" : "bg-slate-50",
                                clickable ? "cursor-pointer hover:bg-slate-50" : "",
                              ].join(" ")}
                              onClick={() => {
                                if (clickable) goToFlatReport(row, resolvedFlatId);
                              }}
                            >
                              <td className="whitespace-nowrap px-4 py-2 text-slate-700 bg-white">
                                {clickable ? (
                                  <span className="inline-flex items-center gap-1 text-xs font-bold">
                                    <ExternalLink size={14} />
                                    Open
                                  </span>
                                ) : (
                                  <span className="text-xs text-slate-400">—</span>
                                )}
                              </td>

                              {wipColumns.map((k) => {
                                const colKey = String(k);
                                const v = row?.[colKey];
                                const txt = formatCell(colKey, v, row);
                                const isRed = RED_HIGHLIGHT_COLS.has(colKey);

                                return (
                                  <td
                                    key={colKey}
                                    className={[
                                      "whitespace-nowrap px-4 py-2",
                                      isRed
                                        ? "bg-red-50 font-extrabold text-red-700"
                                        : "bg-white text-slate-800 font-medium",
                                    ].join(" ")}
                                    title={txt}
                                  >
                                    {txt}
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {modalAsOf ? (
                <div className="mt-3 text-[11px] font-semibold text-slate-500">
                  As of: {modalAsOf}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
) : null}

      </div>
    </div>
  );
}
