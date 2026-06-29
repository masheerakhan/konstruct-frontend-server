import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Plus,
  FileText,
  Trash2,
  Paperclip,
  Upload,
  UploadCloud,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  listDmsMinutesOfMeeting,
  createDmsMinutesOfMeeting,
  deleteDmsMinutesOfMeeting,
  uploadDmsMomAttachment,
  getProjectsForCurrentUser,
  fetchVendorDirectory,
} from "../../../api";
import { formatDisplayDateTime } from "../../../utils/dateFormatter";
import MomForm, { MOM_MEETING_TYPE_OPTIONS } from "./MomForm";

function unwrapList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

function normalizeVendorRow(raw) {
  const status = String(raw.status ?? "invited").toLowerCase();
  return {
    id:
      raw.id ??
      raw.vendor_id ??
      `${raw.email || "row"}-${raw.project_id ?? ""}`,
    name: raw.full_name ?? raw.name ?? "—",
    email: raw.email ?? "",
    dept: raw.department ?? raw.dept ?? "",
    role: raw.role ?? "",
    status: ["active", "onboarding", "invited", "inactive"].includes(status)
      ? status
      : "invited",
  };
}

function formatVendorSelectLabel(v) {
  const name = v.name && v.name !== "—" ? v.name : "—";
  const role =
    v.role && String(v.role).trim() && v.role !== "—"
      ? String(v.role).trim()
      : "";
  const dept =
    v.dept && String(v.dept).trim() && v.dept !== "—"
      ? String(v.dept).trim()
      : "";
  let s = name;
  if (role) s += ` — ${role}`;
  if (dept) s += ` · ${dept}`;
  return s;
}

function formatSavedAt(iso) {
  if (!iso) return "—";
  return formatDisplayDateTime(iso);
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return String(iso);
  }
}

function formatFileSize(size) {
  if (size === undefined || size === null) return "";
  if (size < 1024) return `${size} B`;
  if (size < 1048576) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1048576).toFixed(1)} MB`;
}

function labelForMeetingType(value) {
  return (
    MOM_MEETING_TYPE_OPTIONS.find((o) => o.value === value)?.label ||
    value ||
    "—"
  );
}

// Type → short code (mirrors backend MEETING_TYPE_CODES)
const MEETING_TYPE_CODES = {
  kick_off: "KO",
  weekly_progress_review: "WPR",
  weekly_quality_meeting: "WQ",
  site_coordination_meeting: "SCM",
  weekly_qhse: "QHSE",
  safety_committee_meeting: "SCM",
};

/**
 * Returns the stored reference if available; otherwise builds a
 * deterministic fallback: HIPPL-ABC-XXX-YYY-MOM({CODE})-{serial}
 * where serial = position of this record among records of the same type.
 */
function getDisplayReference(record, allRecords) {
  if (record.reference) return record.reference;
  const typeCode = MEETING_TYPE_CODES[record.meeting_type] || "MOM";
  const sameType = allRecords.filter(
    (r) => r.meeting_type === record.meeting_type,
  );
  const serial = sameType.findIndex((r) => r.id === record.id) + 1;
  return `HIPPL-ABC-XXX-YYY-MOM(${typeCode})-${String(serial).padStart(3, "0")}`;
}

/**
 * MOM folder: list and create Minutes of Meeting via DMS API (`/dms/minutes-of-meeting/`).
 * Vendor roster for internal fields comes from `GET /vendors/directory/?project_id=` (active vendors only).
 */
export default function MomFolderView({ folderId }) {
  const [mode, setMode] = useState("list");
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [projectOptions, setProjectOptions] = useState([]);
  const [projectId, setProjectId] = useState("");
  const [vendorOptions, setVendorOptions] = useState([]);
  const [vendorsLoading, setVendorsLoading] = useState(false);

  // Quick upload states
  const [quickMeetingType, setQuickMeetingType] = useState("");
  const [quickFiles, setQuickFiles] = useState([]);
  const [quickSaving, setQuickSaving] = useState(false);

  const vendorSelectPlaceholder = useMemo(() => {
    if (vendorsLoading) return "Loading vendors…";
    if (!projectId) return "Select a project above first";
    if (!vendorOptions.length) return "No active vendors for this project";
    return "Select vendor";
  }, [vendorsLoading, projectId, vendorOptions.length]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const projRes = await getProjectsForCurrentUser();
        const projectsRaw = Array.isArray(projRes.data)
          ? projRes.data
          : (projRes.data?.results ?? []);
        const opts = projectsRaw
          .filter((p) => p?.id != null)
          .map((p) => ({
            id: String(p.id),
            name: p.name || p.project_name || `Project ${p.id}`,
          }));
        if (!cancelled) {
          setProjectOptions(opts);
          setProjectId((prev) => prev || (opts[0]?.id ?? ""));
        }
      } catch {
        if (!cancelled) {
          setProjectOptions([]);
          toast.error("Could not load projects for vendor directory.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!projectId) {
      setVendorOptions([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setVendorsLoading(true);
      try {
        const res = await fetchVendorDirectory({ project_id: projectId });
        const list = unwrapList(res?.data);
        const rows = list
          .map(normalizeVendorRow)
          .filter((v) => v.status === "active");
        const opts = rows.map((v) => ({
          value: String(v.id),
          label: formatVendorSelectLabel(v),
        }));
        if (!cancelled) setVendorOptions(opts);
      } catch {
        if (!cancelled) {
          setVendorOptions([]);
          toast.error("Could not load vendors for this project.");
        }
      } finally {
        if (!cancelled) setVendorsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const refresh = useCallback(async () => {
    if (!folderId) {
      setRecords([]);
      return;
    }
    setLoading(true);
    try {
      const res = await listDmsMinutesOfMeeting({ folder: folderId });
      const body = res?.data;
      const rows = Array.isArray(body?.results)
        ? body.results
        : Array.isArray(body)
          ? body
          : [];
      setRecords(rows);
    } catch {
      setRecords([]);
      toast.error("Could not load MOM records.");
    } finally {
      setLoading(false);
    }
  }, [folderId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleSave = async (payload, files = []) => {
    if (!folderId) return;
    setSaving(true);
    try {
      const body = {
        folder: folderId,
        meeting_type: payload.meetingType,
        meeting_on: payload.meetingDate,
        basic_tag: payload.basicTag || "",
        discussion_points: payload.discussionPoints || [],
        attendees: payload.attendees || [],
      };
      const res = await createDmsMinutesOfMeeting(body);
      const id = res?.data?.id;
      if (!id) {
        throw new Error("Missing MOM id in response");
      }
      const momId = String(id);
      const failedNames = [];
      for (const file of files) {
        try {
          await uploadDmsMomAttachment(momId, file);
        } catch (upErr) {
          const name = file?.name || "attachment";
          failedNames.push(name);
          console.error(
            "[MOM] attachment upload failed",
            name,
            upErr?.response?.data || upErr,
          );
        }
      }
      if (failedNames.length > 0) {
        toast.error(
          `MOM saved, but ${failedNames.length} attachment(s) failed: ${failedNames.join(", ")}. Check console or network tab.`,
        );
      } else {
        toast.success(files.length ? "MOM and attachments saved" : "MOM saved");
      }
      setMode("list");
      await refresh();
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        (typeof err?.response?.data === "object"
          ? Object.values(err.response.data).flat().filter(Boolean).join(" ")
          : null) ||
        err?.message ||
        "Save failed";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this MOM and its attachments?")) return;
    try {
      await deleteDmsMinutesOfMeeting(id);
      toast.success("Deleted");
      await refresh();
    } catch {
      toast.error("Delete failed");
    }
  };

  const handleQuickSubmit = async (e) => {
    e.preventDefault();
    if (!quickMeetingType) {
      toast.error("Type of Meeting is a mandatory field.");
      return;
    }
    if (!quickFiles[0] || !quickFiles[1]) {
      toast.error("Please upload both Attach MOM and Attendance files.");
      return;
    }
    const filesToUpload = [quickFiles[0], quickFiles[1]];
    setQuickSaving(true);
    try {
      const todayIso = new Date().toISOString().slice(0, 10);
      const body = {
        folder: folderId,
        meeting_type: quickMeetingType,
        meeting_on: todayIso,
        basic_tag: "",
        discussion_points: [],
        attendees: [],
      };
      const res = await createDmsMinutesOfMeeting(body);
      const momId = res?.data?.id;
      if (!momId) {
        throw new Error("Missing MOM id in response");
      }
      const failedNames = [];
      for (const file of filesToUpload) {
        try {
          await uploadDmsMomAttachment(String(momId), file);
        } catch (upErr) {
          failedNames.push(file.name || "attachment");
        }
      }
      if (failedNames.length > 0) {
        toast.error(
          `MOM saved, but some attachments failed: ${failedNames.join(", ")}`,
        );
      } else {
        toast.success("MOM document uploaded successfully!");
      }
      setQuickMeetingType("");
      setQuickFiles([]);
      await refresh();
    } catch (err) {
      toast.error(err?.message || "Failed to save MOM document");
    } finally {
      setQuickSaving(false);
    }
  };

  if (!folderId) {
    return <p className="text-sm text-gray-500">Missing folder context.</p>;
  }

  const projectBar = (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-primary">
        Project
      </label>
      <p className="mb-2 text-xs text-gray-500">
        Internal &quot;Responsible person&quot; and attendee names are loaded
        from active vendors for the selected project.
      </p>
      <select
        className="w-full max-w-md rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        value={projectId}
        onChange={(e) => setProjectId(e.target.value)}
      >
        <option value="">Select project</option>
        {projectOptions.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
    </div>
  );

  const hasBothFiles = !!quickFiles[0] && !!quickFiles[1];

  const quickUploadForm = (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm space-y-4 relative">
      {quickSaving && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-white/70 text-sm font-medium text-gray-600">
          Saving & uploading document…
        </div>
      )}
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-primary">
          Create new MOM
        </label>
        <p className="mb-2 text-xs text-gray-500">
          Select the type of meeting and upload related documents.
        </p>
      </div>
      <form onSubmit={handleQuickSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {/* Column 1: Type of Meeting */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Type of Meeting <span className="text-primary font-bold">*</span>
            </label>
            <div className="relative border border-gray-200 rounded-xl p-4 bg-gray-50/30 hover:border-primary/30 transition-all duration-300 h-[105px] flex items-center shadow-sm">
              <select
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm"
                value={quickMeetingType}
                onChange={(e) => {
                  const val = e.target.value;
                  setQuickMeetingType(val);
                  if (!val) {
                    setQuickFiles([]);
                  }
                }}
              >
                <option value="">Select type</option>
                {MOM_MEETING_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Column 2: Attach MOM */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Attach MOM <span className="text-primary font-bold">*</span>
              </label>
              <span className="text-[10px] text-gray-400 font-semibold italic">
                (Required)
              </span>
            </div>
            <div
              className={`relative border border-dashed rounded-xl p-3 flex flex-col items-center justify-center text-center transition-all duration-300 h-[105px] shadow-sm ${
                quickFiles[0]
                  ? "border-emerald-300 bg-emerald-50/20 hover:bg-emerald-50/40"
                  : "border-gray-300 bg-gray-50/30 hover:border-primary/50 hover:bg-gray-50/60"
              }`}
            >
              <input
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,image/*,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    setQuickFiles((prev) => {
                      const next = [...prev];
                      next[0] = file;
                      return next;
                    });
                  }
                }}
              />
              {quickFiles[0] ? (
                <div className="flex flex-col items-center space-y-1.5 w-full">
                  <div className="rounded-full bg-emerald-100 p-1 text-emerald-600 shadow-sm">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="w-full px-1.5">
                    <p
                      className="text-[11px] font-semibold text-gray-800 truncate"
                      title={quickFiles[0].name}
                    >
                      {quickFiles[0].name}
                    </p>
                    <p className="text-[9px] text-emerald-600 font-medium">
                      {formatFileSize(quickFiles[0].size)} · Ready
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setQuickFiles((prev) => {
                        const next = [...prev];
                        next[0] = null;
                        return next;
                      });
                    }}
                    className="inline-flex items-center gap-1 text-[9px] font-bold text-red-500 hover:text-red-700 bg-white hover:bg-red-50 border border-red-200 rounded px-2 py-0.5 shadow-sm transition-all z-20"
                  >
                    <Trash2 className="h-2.5 w-2.5" />
                    Remove
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center space-y-1">
                  <div className="rounded-full bg-white p-1.5 text-gray-400 border border-gray-100 shadow-sm">
                    <UploadCloud className="h-5 w-5 animate-pulse" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-700">
                      Attach MOM
                    </p>
                    <p className="text-[9px] text-gray-400 mt-0.5">
                      All document types (Max 10MB)
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Column 3: Attendance */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Attendance <span className="text-primary font-bold">*</span>
              </label>
              <span className="text-[10px] text-gray-400 font-semibold italic">
                (Required)
              </span>
            </div>
            <div
              className={`relative border border-dashed rounded-xl p-3 flex flex-col items-center justify-center text-center transition-all duration-300 h-[105px] shadow-sm ${
                quickFiles[1]
                  ? "border-emerald-300 bg-emerald-50/20 hover:bg-emerald-50/40"
                  : "border-gray-300 bg-gray-50/30 hover:border-primary/50 hover:bg-gray-50/60"
              }`}
            >
              <input
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,image/*,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    setQuickFiles((prev) => {
                      const next = [...prev];
                      next[1] = file;
                      return next;
                    });
                  }
                }}
              />
              {quickFiles[1] ? (
                <div className="flex flex-col items-center space-y-1.5 w-full">
                  <div className="rounded-full bg-emerald-100 p-1 text-emerald-600 shadow-sm">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="w-full px-1.5">
                    <p
                      className="text-[11px] font-semibold text-gray-800 truncate"
                      title={quickFiles[1].name}
                    >
                      {quickFiles[1].name}
                    </p>
                    <p className="text-[9px] text-emerald-600 font-medium">
                      {formatFileSize(quickFiles[1].size)} · Ready
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setQuickFiles((prev) => {
                        const next = [...prev];
                        next[1] = null;
                        return next;
                      });
                    }}
                    className="inline-flex items-center gap-1 text-[9px] font-bold text-red-500 hover:text-red-700 bg-white hover:bg-red-50 border border-red-200 rounded px-2 py-0.5 shadow-sm transition-all z-20"
                  >
                    <Trash2 className="h-2.5 w-2.5" />
                    Remove
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center space-y-1">
                  <div className="rounded-full bg-white p-1.5 text-gray-400 border border-gray-100 shadow-sm">
                    <UploadCloud className="h-5 w-5 animate-pulse" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-700">
                      Attendance
                    </p>
                    <p className="text-[9px] text-gray-400 mt-0.5">
                      All document types (Max 10MB)
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-center pt-4 border-t border-gray-100">
          <button
            type="submit"
            disabled={quickSaving || !hasBothFiles || !quickMeetingType}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none disabled:active:scale-100 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <Upload className="h-4 w-4" />
            Submit
          </button>
        </div>
      </form>
    </div>
  );

  return (
    <div className="space-y-6">
      {projectBar}

      <hr className="border-gray-200" />

      {quickUploadForm}

      <hr className="border-gray-200" />

      <div>
        <h2 className="text-lg font-semibold text-gray-900">
          Minutes of Meeting
        </h2>
        <p className="mt-0.5 text-sm text-gray-500">
          Records are stored on the server for this folder.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : records.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-200 bg-white px-6 py-12 text-center">
          <FileText
            className="mx-auto mb-3 h-10 w-10 text-gray-300"
            aria-hidden
          />
          <p className="text-sm text-gray-600">No MOM submitted yet.</p>
          <p className="mt-1 text-xs text-gray-500">
            Use the upload form above to add the first record.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/80">
                <th className="px-4 py-3 text-left font-medium text-gray-600">
                  Type of Meeting
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">
                  Reference
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">
                  Date & Time
                </th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50/80"
                >
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {r.meeting_type_display ||
                      labelForMeetingType(r.meeting_type)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-block rounded-md bg-primary/8 px-2 py-0.5 text-xs font-mono font-semibold text-primary tracking-wide">
                      {getDisplayReference(r, records)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {formatSavedAt(r.created_at)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleDelete(r.id)}
                      className="inline-flex items-center gap-1 rounded-md p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600"
                      aria-label="Delete MOM"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
