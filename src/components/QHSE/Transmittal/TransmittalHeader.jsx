import { useEffect, useMemo, useState } from "react";
import {
  getRootFolders,
  getFolderDetail,
  getProjectsForCurrentUser,
} from "../../../api";
import { capitalCase, safeCapitalCaseName } from "./stringCase";

/** First letter of each word, uppercased (e.g. "Horizon Industrial Park" -> "HIP"). */
export function initialsFromProjectName(name) {
  if (!name || !String(name).trim()) return "PRJ";
  return String(name)
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase())
    .join("");
}

/** e.g. "Horizon Industrial Park" + id 989 -> "HIP-989" */
export function buildProjectNoFromNameAndId(name, id) {
  const prefix = initialsFromProjectName(name);
  if (id == null || id === "") return prefix;
  return `${prefix}-${id}`;
}

const NONE_VALUE = "__none__";
// const selectCls =
//   "mt-1 w-full h-8 text-xs rounded-sm border border-gray-200 bg-white px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary";

const inputCls =
  "h-8 w-full max-w-[180px] rounded-sm border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary";

const readonlyValueCls =
  "min-w-0 max-w-[180px] break-words text-sm font-medium tabular-nums text-foreground";

const fieldRowCls =
  "flex min-w-0 flex-col gap-1 sm:flex-row sm:items-center sm:gap-2";

const labelCls =
  "shrink-0 text-[10px] font-bold uppercase tracking-wider text-gray-500 sm:w-[115px]";

export default function TransmittalHeader({
  formData,
  onProjectNameChange,
  onBlockNoChange,
  onWorkOrderChange,
  blockNoOptions,
  onLocationChange,
}) {
  const [workOrderOptions, setWorkOrderOptions] = useState([]);
  const [loadingWorkOrders, setLoadingWorkOrders] = useState(false);
  const [apiProjects, setApiProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);

  useEffect(() => {
    const hasExactLocation =
      formData?.location && formData.location !== "Location unavailable";

    if (hasExactLocation) return;
    if (!("geolocation" in navigator)) return;

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
          );

          const data = await res.json();
          const addr = data.address || {};

          const locationStr = [
            addr.road ||
              addr.pedestrian ||
              addr.footway ||
              addr.residential ||
              "",
            addr.suburb ||
              addr.neighbourhood ||
              addr.village ||
              addr.town ||
              "",
            addr.city || addr.state_district || "",
            addr.state || "",
          ]
            .filter(Boolean)
            .join(", ");

          onLocationChange?.(
            locationStr || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
          );
        } catch {
          onLocationChange?.(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        }
      },
      () => {
        onLocationChange?.("Location unavailable");
      },
    );
  }, [formData?.location, onLocationChange]);

  const normalizedProjects = useMemo(
    () =>
      (apiProjects || [])
        .filter((p) => p?.id != null && p.id !== "")
        .map((p) => {
          const name = p.name || p.project_name || "";
          const id = p.id;
          return {
            id: String(id),
            name,
            projectNo: buildProjectNoFromNameAndId(name, id),
            raw: p,
          };
        }),
    [apiProjects],
  );

  /** Current selection id for dropdown (syncs with form when possible). */
  const projectSelectValue = useMemo(() => {
    if (!normalizedProjects.length) return NONE_VALUE;
    const byName = normalizedProjects.find(
      (p) => p.name === formData.projectName,
    );
    if (byName) return byName.id;
    const byNo = normalizedProjects.find(
      (p) => p.projectNo === formData.projectNo,
    );
    if (byNo) return byNo.id;
    return NONE_VALUE;
  }, [normalizedProjects, formData.projectName, formData.projectNo]);

  const handleProjectSelect = (val) => {
    if (val === NONE_VALUE) {
      onProjectNameChange?.("", "");
      return;
    }
    const project = normalizedProjects.find((p) => p.id === val);
    if (project) onProjectNameChange?.(project.name, project.projectNo);
  };

  useEffect(() => {
    let active = true;
    (async () => {
      setLoadingProjects(true);
      try {
        const res = await getProjectsForCurrentUser();
        const raw = res?.data;
        const list = Array.isArray(raw) ? raw : (raw?.results ?? []);
        if (active) setApiProjects(list);
      } catch {
        if (active) setApiProjects([]);
      } finally {
        if (active) setLoadingProjects(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    const stripExt = (filename = "") =>
      filename.replace(/\.[^/.]+$/, "").trim();
    const findByName = (nodes, name) =>
      (nodes || []).find(
        (n) =>
          String(n?.name || "").toLowerCase() === String(name).toLowerCase(),
      );

    const loadWorkOrders = async () => {
      setLoadingWorkOrders(true);
      try {
        const rootsRes = await getRootFolders();
        const roots = Array.isArray(rootsRes.data) ? rootsRes.data : [];
        const references = findByName(roots, "References");
        if (!references?.id) {
          if (active) setWorkOrderOptions([]);
          return;
        }

        const referencesRes = await getFolderDetail(references.id);
        const refChildren = referencesRes?.data?.children || [];
        const workOrderFolder = findByName(refChildren, "Work Order");
        if (!workOrderFolder?.id) {
          if (active) setWorkOrderOptions([]);
          return;
        }

        const workOrderRes = await getFolderDetail(workOrderFolder.id);
        const files = Array.isArray(workOrderRes?.data?.files)
          ? workOrderRes.data.files
          : [];

        const names = Array.from(
          new Set(files.map((f) => stripExt(f?.name || "")).filter(Boolean)),
        ).sort((a, b) => a.localeCompare(b));

        if (active) setWorkOrderOptions(names);
      } catch (err) {
        if (active) setWorkOrderOptions([]);
      } finally {
        if (active) setLoadingWorkOrders(false);
      }
    };

    loadWorkOrders();
    return () => {
      active = false;
    };
  }, []);

  const workOrderSelectValue = useMemo(
    () => formData.workOrderNo || NONE_VALUE,
    [formData.workOrderNo],
  );
  const workOrderSelectOptions = useMemo(() => {
    const base = workOrderOptions || [];
    if (formData.workOrderNo && !base.includes(formData.workOrderNo)) {
      return [formData.workOrderNo, ...base];
    }
    return base;
  }, [workOrderOptions, formData.workOrderNo]);

  return (
    <div className="space-y-4">
      {/* Top fields outside the header box */}
      <div className="grid grid-cols-1 gap-2 xl:grid-cols-3">
        {/* Project Name */}
        <div className="min-w-0 rounded-sm border border-gray-200 bg-white p-4 shadow-sm">
          <div className={fieldRowCls}>
            <span className={labelCls}>{capitalCase("project name")}:</span>

            {onProjectNameChange ? (
              <select
                className={inputCls}
                value={projectSelectValue}
                onChange={(e) => handleProjectSelect(e.target.value)}
                disabled={loadingProjects}
              >
                <option value={NONE_VALUE}>
                  {loadingProjects
                    ? `${capitalCase("loading projects")}...`
                    : capitalCase("select project")}
                </option>

                {normalizedProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {safeCapitalCaseName(p.name) || `Project #${p.id}`}
                  </option>
                ))}
              </select>
            ) : (
              <span className={readonlyValueCls}>
                {formData.projectName || "-"}
              </span>
            )}
          </div>
        </div>

        {/* Location */}
        <div className="min-w-0 rounded-sm border border-gray-200 bg-white p-4 shadow-sm">
          <div className={fieldRowCls}>
            <span className={labelCls}>{capitalCase("location")}:</span>

            <input
              type="text"
              value={formData.location || ""}
              readOnly={Boolean(
                formData.location &&
                formData.location !== "Location unavailable",
              )}
              placeholder="Fetching current location..."
              className={`${inputCls} bg-gray-50`}
            />
          </div>
        </div>

        {/* Date */}
        <div className="min-w-0 rounded-sm border border-gray-200 bg-white p-4 shadow-sm">
          <div className={fieldRowCls}>
            <span className={labelCls}>{capitalCase("date")}:</span>

            <span className={readonlyValueCls}>{formData.date || "-"}</span>
          </div>
        </div>
      </div>

      {/* Header box fields */}
      <div className="rounded-sm border border-gray-200 bg-gray-50 p-5 sm:p-6">
        <h2 className="mb-4 text-[12px] font-bold uppercase tracking-wider text-gray-500">
          {capitalCase("transmittal information")}
        </h2>

        <div className="grid grid-cols-1 gap-x-4 gap-y-4 md:grid-cols-2 2xl:grid-cols-3">
          {/* Transmittal Ref No */}
          <div className={fieldRowCls}>
            <span className={labelCls}>
              {capitalCase("transmittal ref no")}:
            </span>

            <span className={readonlyValueCls}>
              {formData.transmittalRefNo || "-"}
            </span>
          </div>

          {/* Project No */}
          <div className={fieldRowCls}>
            <span className={labelCls}>{capitalCase("project no")}:</span>

            <span className={readonlyValueCls}>
              {formData.projectNo || "-"}
            </span>
          </div>

          {/* Block / Area Name */}
          <div className={fieldRowCls}>
            <span className={labelCls}>
              {capitalCase("block")} / {capitalCase("area name")}:
            </span>

            {onBlockNoChange ? (
              <input
                type="text"
                className={inputCls}
                value={formData.blockNo || ""}
                onChange={(e) => onBlockNoChange(e.target.value)}
                placeholder="Enter block / area name"
              />
            ) : (
              <span className={readonlyValueCls}>
                {safeCapitalCaseName(formData.blockNo) || "—"}
              </span>
            )}
          </div>

          {/* Work Order */}
          <div className={fieldRowCls}>
            <span className={labelCls}>{capitalCase("work order")}:</span>

            {onWorkOrderChange ? (
              <select
                className={inputCls}
                value={workOrderSelectValue}
                onChange={(e) =>
                  onWorkOrderChange(
                    e.target.value === NONE_VALUE ? "" : e.target.value,
                  )
                }
                disabled={loadingWorkOrders}
              >
                <option value={NONE_VALUE}>
                  {loadingWorkOrders
                    ? `${capitalCase("loading work orders")}...`
                    : capitalCase("select work order")}
                </option>

                {workOrderSelectOptions.map((wo) => (
                  <option key={wo} value={wo}>
                    {safeCapitalCaseName(wo)}
                  </option>
                ))}
              </select>
            ) : (
              <span className={readonlyValueCls}>
                {formData.workOrderNo || "—"}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
