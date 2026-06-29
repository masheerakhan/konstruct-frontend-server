import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, FileText, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import {
  listDmsMinutesOfMeeting,
  createDmsMinutesOfMeeting,
  deleteDmsMinutesOfMeeting,
  uploadDmsMomAttachment,
  getProjectsForCurrentUser,
  fetchVendorDirectory,
} from "../../../api";
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
    id: raw.id ?? raw.vendor_id ?? `${raw.email || "row"}-${raw.project_id ?? ""}`,
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
  const role = v.role && String(v.role).trim() && v.role !== "—" ? String(v.role).trim() : "";
  const dept = v.dept && String(v.dept).trim() && v.dept !== "—" ? String(v.dept).trim() : "";
  let s = name;
  if (role) s += ` — ${role}`;
  if (dept) s += ` · ${dept}`;
  return s;
}

function formatSavedAt(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return String(iso);
  }
}

function labelForMeetingType(value) {
  return MOM_MEETING_TYPE_OPTIONS.find((o) => o.value === value)?.label || value || "—";
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
        const projectsRaw = Array.isArray(projRes.data) ? projRes.data : projRes.data?.results ?? [];
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
          console.error("[MOM] attachment upload failed", name, upErr?.response?.data || upErr);
        }
      }
      if (failedNames.length > 0) {
        toast.error(
          `MOM saved, but ${failedNames.length} attachment(s) failed: ${failedNames.join(", ")}. Check console or network tab.`
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

  if (!folderId) {
    return <p className="text-sm text-gray-500">Missing folder context.</p>;
  }

  const projectBar = (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-primary">
        Project
      </label>
      <p className="mb-2 text-xs text-gray-500">
        Internal &quot;Responsible person&quot; and attendee names are loaded from active vendors for the
        selected project.
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

  if (mode === "create") {
    return (
      <div className="space-y-4">
        {projectBar}
        <div className="relative">
          {saving ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-white/70 text-sm text-gray-600">
              Saving…
            </div>
          ) : null}
          <MomForm
            key="mom-form-new"
            onCancel={() => !saving && setMode("list")}
            onSave={handleSave}
            vendorOptions={vendorOptions}
            vendorsLoading={vendorsLoading}
            vendorSelectPlaceholder={vendorSelectPlaceholder}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {projectBar}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Minutes of Meeting</h2>
          <p className="mt-0.5 text-sm text-gray-500">
            Records are stored on the server for this folder. Attachments upload after the MOM is created.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setMode("create")}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          New MOM
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : records.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-200 bg-white px-6 py-12 text-center">
          <FileText className="mx-auto mb-3 h-10 w-10 text-gray-300" aria-hidden />
          <p className="text-sm text-gray-600">No MOM submitted yet.</p>
          <p className="mt-1 text-xs text-gray-500">Use New MOM to add the first record.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/80">
                <th className="px-4 py-3 text-left font-medium text-gray-600">Type of meeting</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Meeting date</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Tag</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Attachments</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Saved</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600 w-[100px]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50/80">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {r.meeting_type_display || labelForMeetingType(r.meeting_type)}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{r.meeting_on || "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{r.basic_tag || "—"}</td>
                  <td className="px-4 py-3 text-gray-600 tabular-nums">
                    {Array.isArray(r.attachments) ? r.attachments.length : 0}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{formatSavedAt(r.created_at)}</td>
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
