import { useMemo, useRef, useState, useEffect, useCallback } from "react";
import {
  Search,
  Download,
  Send,
  X,
  Plus,
  Mail,
  Loader2,
  Copy,
  Check,
} from "lucide-react";
import {
  Allprojects,
  getProjectsByOwnership,
  getProjectUserDetails,
  fetchVendorDirectory,
  inviteVendors,
} from "../../api";

const DEFAULT_INVITE_MESSAGE =
  "You are invited to join our vendor management platform. Please complete your onboarding profile.";

const STATUS_STYLES = {
  active: "text-green-600 bg-green-50",
  onboarding: "text-amber-600 bg-amber-50",
  invited: "text-blue-600 bg-blue-50",
  inactive: "text-muted-foreground bg-muted",
};

function decodeJWT(token) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

function normalizeVendorRow(raw) {
  const status = String(raw.status ?? "invited").toLowerCase();
  return {
    id:
      raw.id ??
      raw.vendor_id ??
      raw.invitation_id ??
      `${raw.email || "row"}-${raw.project_id ?? ""}`,
    name: raw.full_name ?? raw.name ?? "—",
    phone: raw.phone ?? raw.phone_number ?? "—",
    email: raw.email ?? "—",
    project: raw.project_name ?? raw.project ?? "—",
    projectId: raw.project_id ?? null,
    dept: raw.department ?? raw.dept ?? "—",
    role: raw.role ?? "—",
    status: ["active", "onboarding", "invited", "inactive"].includes(status)
      ? status
      : "invited",
  };
}

function unwrapList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

function projectLabel(p) {
  return p?.name || p?.project_name || `Project #${p?.id ?? ""}`;
}

function projectIdOf(p) {
  return p?.id ?? p?.project_id ?? null;
}

export default function Vendors() {
  const [vendors, setVendors] = useState([]);
  const [vendorsLoading, setVendorsLoading] = useState(true);
  const [vendorsError, setVendorsError] = useState(null);

  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteProjectId, setInviteProjectId] = useState("");
  const [emails, setEmails] = useState([""]);
  const [message, setMessage] = useState(DEFAULT_INVITE_MESSAGE);
  const [inviteSubmitting, setInviteSubmitting] = useState(false);
  const [inviteError, setInviteError] = useState(null);
  /** { email, onboarding_url }[] from last successful invite batch */
  const [inviteDevLinks, setInviteDevLinks] = useState([]);
  const [inviteEmailSent, setInviteEmailSent] = useState(null);
  const [copiedUrl, setCopiedUrl] = useState(null);

  const downloadRef = useRef(null);
  const [downloadOpen, setDownloadOpen] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setSearchDebounced(search), 400);
    return () => clearTimeout(id);
  }, [search]);

  const loadVendors = useCallback(async () => {
    setVendorsLoading(true);
    setVendorsError(null);
    try {
      const params = {};
      if (projectFilter) params.project_id = projectFilter;
      if (searchDebounced.trim()) params.search = searchDebounced.trim();
      const res = await fetchVendorDirectory(params);
      const list = unwrapList(res?.data);
      setVendors(list.map(normalizeVendorRow));
    } catch (e) {
      const status = e?.response?.status;
      const msg =
        e?.response?.data?.detail ||
        e?.response?.data?.message ||
        e?.message ||
        "Failed to load vendors.";
      setVendors([]);
      setVendorsError(
        status === 404
          ? "Vendor API is not available yet (404). Implement GET /vendors/directory/ on the user service."
          : msg
      );
    } finally {
      setVendorsLoading(false);
    }
  }, [projectFilter, searchDebounced]);

  const loadProjects = useCallback(async () => {
    setProjectsLoading(true);
    let userData = null;
    try {
      const userDataStr = localStorage.getItem("USER_DATA");
      if (userDataStr) {
        try {
          userData = JSON.parse(userDataStr);
        } catch {
          userData = null;
        }
      } else {
        const token =
          localStorage.getItem("ACCESS_TOKEN") ||
          localStorage.getItem("TOKEN") ||
          localStorage.getItem("token");
        if (token) {
          const data = decodeJWT(token);
          if (data) userData = data;
        }
      }

      const roleRaw =
        localStorage.getItem("ROLE") ||
        userData?.role ||
        userData?.roles?.[0] ||
        "";
      const role = String(roleRaw).trim().toLowerCase();
      const isManager = userData?.is_manager;

      let response = null;
      if (role === "super admin") {
        response = await Allprojects();
      } else if (role === "admin") {
        response = await getProjectUserDetails();
      } else if (isManager) {
        if (userData.entity_id) {
          response = await getProjectsByOwnership({
            entity_id: userData.entity_id,
          });
        } else if (userData.company_id) {
          response = await getProjectsByOwnership({
            company_id: userData.company_id,
          });
        } else if (userData.org || userData.organization_id) {
          const orgId = userData.org || userData.organization_id;
          response = await getProjectsByOwnership({ organization_id: orgId });
        }
      }

      let list = [];
      if (response && response.status === 200) {
        list = Array.isArray(response.data)
          ? response.data
          : response.data?.results || [];
      } else if (!response) {
        const token =
          localStorage.getItem("ACCESS_TOKEN") ||
          localStorage.getItem("TOKEN") ||
          localStorage.getItem("token");
        if (token) {
          const data = decodeJWT(token);
          if (data && Array.isArray(data.accesses)) {
            const seen = new Set();
            data.accesses.forEach((access) => {
              if (access.project_id && !seen.has(access.project_id)) {
                seen.add(access.project_id);
                list.push({
                  id: access.project_id,
                  project_name: access.project_name,
                  name: access.project_name,
                });
              }
            });
          }
        }
      }

      setProjects(list || []);
    } catch (err) {
      console.error("[Vendor] loadProjects", err);
      setProjects([]);
    } finally {
      setProjectsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVendors();
  }, [loadVendors]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const projectOptions = useMemo(() => {
    const map = new Map();
    projects.forEach((p) => {
      const id = projectIdOf(p);
      if (id == null) return;
      if (!map.has(id)) map.set(id, { id, label: projectLabel(p) });
    });
    return Array.from(map.values()).sort((a, b) =>
      a.label.localeCompare(b.label)
    );
  }, [projects]);

  const filterProjectOptions = useMemo(() => {
    const fromApi = new Map();
    vendors.forEach((v) => {
      if (v.projectId != null && v.project && v.project !== "—") {
        fromApi.set(String(v.projectId), {
          id: v.projectId,
          label: v.project,
        });
      }
    });
    projectOptions.forEach((p) => {
      if (!fromApi.has(String(p.id))) fromApi.set(String(p.id), p);
    });
    return Array.from(fromApi.values()).sort((a, b) =>
      a.label.localeCompare(b.label)
    );
  }, [vendors, projectOptions]);

  useEffect(() => {
    const handler = (e) => {
      if (downloadRef.current && !downloadRef.current.contains(e.target)) {
        setDownloadOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const openInviteModal = () => {
    setInviteError(null);
    setInviteDevLinks([]);
    setInviteEmailSent(null);
    setCopiedUrl(null);
    setInviteOpen(true);
    if (!inviteProjectId && projectOptions.length === 1) {
      setInviteProjectId(String(projectOptions[0].id));
    }
  };

  const copyInviteUrl = async (url) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      setTimeout(() => setCopiedUrl((u) => (u === url ? null : u)), 2000);
    } catch {
      setInviteError("Could not copy to clipboard.");
    }
  };

  const copyAllInviteUrls = async () => {
    const text = inviteDevLinks.map((r) => r.onboarding_url).join("\n");
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedUrl("__ALL__");
      setTimeout(() => setCopiedUrl((u) => (u === "__ALL__" ? null : u)), 2000);
    } catch {
      setInviteError("Could not copy to clipboard.");
    }
  };

  const handleSendInvitations = async () => {
    setInviteError(null);
    const validEmails = emails.map((e) => e.trim()).filter(Boolean);
    if (!validEmails.length) {
      setInviteError("Please add at least one email.");
      return;
    }
    if (!inviteProjectId) {
      setInviteError("Please select a project for this invitation.");
      return;
    }

    const project_id = Number(inviteProjectId);
    if (Number.isNaN(project_id)) {
      setInviteError("Invalid project selection.");
      return;
    }

    setInviteSubmitting(true);
    try {
      const res = await inviteVendors({
        project_id,
        emails: validEmails,
        invitation_message: message.trim() || DEFAULT_INVITE_MESSAGE,
      });
      const errs = res.data?.errors || [];
      const sent = res.data?.invitations || [];
      setInviteEmailSent(
        typeof res.data?.email_sent === "boolean" ? res.data.email_sent : true
      );

      if (errs.length > 0 && sent.length === 0) {
        setInviteError(
          errs.map((x) => `${x.email}: ${x.error}`).join("; ") || "Invite failed."
        );
        setInviteDevLinks([]);
        await loadVendors();
        return;
      }
      if (errs.length > 0) {
        setInviteError(
          `Some invitations failed: ${errs.map((x) => `${x.email}: ${x.error}`).join("; ")}`
        );
      } else {
        setInviteError(null);
      }
      if (sent.length > 0) {
        setInviteDevLinks(
          sent
            .filter((s) => s.onboarding_url)
            .map((s) => ({ email: s.email, onboarding_url: s.onboarding_url }))
        );
        setEmails([""]);
        setMessage(DEFAULT_INVITE_MESSAGE);
        setInviteProjectId(
          projectOptions.length === 1 ? String(projectOptions[0].id) : ""
        );
      }
      await loadVendors();
    } catch (e) {
      const status = e?.response?.status;
      const msg =
        e?.response?.data?.detail ||
        e?.response?.data?.message ||
        (typeof e?.response?.data === "string" ? e.response.data : null) ||
        e?.message ||
        "Failed to send invitations.";
      setInviteError(
        status === 404
          ? "Invite API not available yet (404). Implement POST /vendors/invite/ on the user service."
          : msg
      );
    } finally {
      setInviteSubmitting(false);
    }
  };

  const exportCsv = () => {
    const headers = [
      "Name",
      "Phone",
      "Email",
      "Project",
      "Department",
      "Role",
      "Status",
    ];
    const rows = vendors.map((v) => [
      v.name,
      v.phone,
      v.email,
      v.project,
      v.dept,
      v.role,
      v.status,
    ]);
    const esc = (cell) => {
      const s = String(cell ?? "");
      if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };
    const csv = [headers.join(","), ...rows.map((r) => r.map(esc).join(","))].join(
      "\n"
    );
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vendors-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setDownloadOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-card border-b border-border px-4 sm:px-6 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-foreground">Vendor Directory</h1>
          <p className="text-xs text-muted-foreground">
            Master database of all registered vendors
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openInviteModal}
            disabled={projectsLoading && !projectOptions.length}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-md border border-border bg-card text-sm font-medium text-foreground hover:bg-accent transition-colors disabled:opacity-50"
          >
            <Send className="w-4 h-4" /> Invite
          </button>

          <div ref={downloadRef} className="relative">
            <button
              type="button"
              onClick={() => setDownloadOpen((p) => !p)}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-md border border-border bg-card text-sm font-medium text-foreground hover:bg-accent transition-colors"
            >
              <Download className="w-4 h-4" /> Export
            </button>

            {downloadOpen && (
              <div className="absolute right-0 mt-1 w-40 rounded-lg border border-border bg-card shadow-lg z-50 py-1">
                <button
                  type="button"
                  onClick={exportCsv}
                  className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                >
                  CSV (Excel)
                </button>
                <button
                  type="button"
                  disabled
                  className="w-full text-left px-4 py-2 text-sm text-muted-foreground cursor-not-allowed"
                >
                  PDF (soon)
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {vendorsError && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100 px-4 py-3 text-sm">
            {vendorsError}
          </div>
        )}

        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-4 border-b border-border">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search vendors..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 h-9 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-all"
              />
            </div>

            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-all min-w-[10rem]"
            >
              <option value="">All Projects</option>
              {filterProjectOptions.map((p) => (
                <option key={p.id} value={String(p.id)}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {vendorsLoading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Loading vendors…</span>
            </div>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                        Name
                      </th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                        Email
                      </th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                        Project
                      </th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                        Dept
                      </th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                        Role
                      </th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {vendors.map((v) => (
                      <tr
                        key={v.id}
                        className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="font-medium text-foreground">{v.name}</div>
                          {/* <div className="text-xs text-muted-foreground">{v.phone}</div>  */} 
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{v.email}</td>
                        <td className="px-4 py-3 text-foreground">{v.project}</td>
                        <td className="px-4 py-3 text-foreground">{v.dept}</td>
                        <td className="px-4 py-3 text-foreground">{v.role}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                              STATUS_STYLES[v.status] || ""
                            }`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            {v.status}
                          </span>
                        </td>
                      </tr>
                    ))}

                    {vendors.length === 0 && (
                      <tr>
                        <td
                          colSpan={6}
                          className="text-center py-8 text-muted-foreground"
                        >
                          {!searchDebounced.trim() && !projectFilter
                            ? "No vendors yet. Invite vendors to see them here."
                            : "No vendors match your filters."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden divide-y divide-border">
                {vendors.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    {!searchDebounced.trim() && !projectFilter
                      ? "No vendors yet. Invite vendors to see them here."
                      : "No vendors match your filters."}
                  </div>
                )}

                {vendors.map((v) => (
                  <div key={v.id} className="p-4 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-foreground">{v.name}</div>
                        <div className="text-xs text-muted-foreground">{v.phone}</div>
                      </div>

                      <span
                        className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                          STATUS_STYLES[v.status] || ""
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {v.status}
                      </span>
                    </div>

                    <div className="text-xs text-muted-foreground">{v.email}</div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                      <span>
                        <span className="text-muted-foreground">Project:</span>{" "}
                        {v.project}
                      </span>
                      <span>
                        <span className="text-muted-foreground">Dept:</span> {v.dept}
                      </span>
                      <span>
                        <span className="text-muted-foreground">Role:</span> {v.role}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      {inviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => !inviteSubmitting && setInviteOpen(false)}
          />
          <div className="relative w-full max-w-lg mx-4 bg-card rounded-xl border border-border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 pt-6 pb-2">
              <div>
                <h2 className="text-lg font-bold text-foreground">Invite Vendors</h2>
                <p className="text-xs text-muted-foreground">
                  Send onboarding invitations via email
                </p>
              </div>

              <button
                type="button"
                disabled={inviteSubmitting}
                onClick={() => setInviteOpen(false)}
                className="p-1.5 rounded-md hover:bg-accent transition-colors text-muted-foreground disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 pb-6 pt-4 space-y-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Mail className="w-4 h-4 text-primary" /> Email Invitations
              </div>

              <div className="rounded-lg border border-dashed border-border bg-muted/30 p-3 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-foreground">
                    Onboarding links
                  </span>
                  {inviteDevLinks.length > 1 && (
                    <button
                      type="button"
                      onClick={copyAllInviteUrls}
                      disabled={inviteSubmitting}
                      className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80"
                    >
                      {copiedUrl === "__ALL__" ? (
                        <Check className="w-3.5 h-3.5 text-green-600" />
                      ) : null}
                      Copy all URLs
                    </button>
                  )}
                </div>
                {inviteEmailSent === false && (
                  <p className="text-xs text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/50 rounded-md px-2 py-1.5">
                    Email delivery is disabled in this environment. Copy each
                    link and send it to the vendor manually.
                  </p>
                )}
                {inviteDevLinks.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    After you send invitations, full onboarding URLs appear here
                    for copying (useful while email is off in development).
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {inviteDevLinks.map((row) => (
                      <li key={row.email} className="space-y-1">
                        <span className="text-xs font-medium text-muted-foreground">
                          {row.email}
                        </span>
                        <div className="flex gap-2">
                          <input
                            readOnly
                            value={row.onboarding_url}
                            className="flex-1 min-w-0 h-9 rounded-md border border-border bg-background px-2 text-xs text-foreground font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => copyInviteUrl(row.onboarding_url)}
                            disabled={inviteSubmitting}
                            className="inline-flex items-center gap-1 shrink-0 h-9 px-3 rounded-md border border-border bg-card text-xs font-medium hover:bg-accent"
                          >
                            {copiedUrl === row.onboarding_url ? (
                              <Check className="w-3.5 h-3.5 text-green-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                            Copy
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Project <span className="text-destructive">*</span>
                </label>
                <select
                  value={inviteProjectId}
                  onChange={(e) => setInviteProjectId(e.target.value)}
                  disabled={projectsLoading || inviteSubmitting}
                  className="w-full h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-all"
                >
                  <option value="">
                    {projectsLoading ? "Loading projects…" : "Select project"}
                  </option>
                  {projectOptions.map((p) => (
                    <option key={p.id} value={String(p.id)}>
                      {p.label}
                    </option>
                  ))}
                </select>
                {!projectsLoading && projectOptions.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    No projects available for your account. You need project access to
                    invite vendors.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Recipient Emails
                </label>

                {emails.map((email, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      type="email"
                      placeholder="vendor@company.com"
                      value={email}
                      disabled={inviteSubmitting}
                      onChange={(e) => {
                        const copy = [...emails];
                        copy[i] = e.target.value;
                        setEmails(copy);
                      }}
                      className="flex-1 h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-all disabled:opacity-50"
                    />

                    {emails.length > 1 && (
                      <button
                        type="button"
                        disabled={inviteSubmitting}
                        onClick={() => setEmails(emails.filter((_, j) => j !== i))}
                        className="p-2 rounded-md hover:bg-destructive/10 text-destructive transition-colors disabled:opacity-50"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  disabled={inviteSubmitting}
                  onClick={() => setEmails([...emails, ""])}
                  className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" /> Add another
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Invitation Message
                </label>
                <textarea
                  rows={4}
                  value={message}
                  disabled={inviteSubmitting}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-all resize-y disabled:opacity-50"
                />
              </div>

              {inviteError && (
                <p className="text-sm text-destructive">{inviteError}</p>
              )}

              <button
                type="button"
                onClick={handleSendInvitations}
                disabled={
                  inviteSubmitting ||
                  !inviteProjectId ||
                  projectsLoading ||
                  projectOptions.length === 0
                }
                className="w-full inline-flex items-center justify-center gap-2 h-10 rounded-lg bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {inviteSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Sending…
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" /> Send Invitations
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
