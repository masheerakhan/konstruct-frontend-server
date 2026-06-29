import { useEffect, useMemo, useState } from "react";
import { Send, X, Mail, Loader2, Copy, Check, Plus } from "lucide-react";
import { inviteVendors } from "../../api";

export const DEFAULT_VENDOR_INVITE_MESSAGE =
  "You are invited to join our vendor management platform. Please complete your onboarding profile.";

/**
 * Same invite flow as Vendor directory: POST /vendors/invite/, copyable onboarding links when email is off.
 */
export default function VendorInviteModal({
  open,
  onClose,
  /** `{ id, name }` or `{ id, label }` */
  projectOptions = [],
  /** Pre-select when opening (e.g. current matrix project) */
  defaultProjectId = "",
  title = "Invite vendors",
  subtitle = "Send onboarding invitations via email. Vendors complete the same profile form via the link.",
  onInvited,
}) {
  const [inviteProjectId, setInviteProjectId] = useState("");
  const [emails, setEmails] = useState([""]);
  const [message, setMessage] = useState(DEFAULT_VENDOR_INVITE_MESSAGE);
  const [inviteSubmitting, setInviteSubmitting] = useState(false);
  const [inviteError, setInviteError] = useState(null);
  const [inviteDevLinks, setInviteDevLinks] = useState([]);
  const [inviteEmailSent, setInviteEmailSent] = useState(null);
  const [copiedUrl, setCopiedUrl] = useState(null);

  const normalizedOptions = useMemo(
    () =>
      projectOptions
        .filter((p) => p?.id != null)
        .map((p) => ({
          id: String(p.id),
          label: p.label || p.name || p.project_name || `Project ${p.id}`,
        })),
    [projectOptions]
  );

  useEffect(() => {
    if (!open) return;
    setInviteError(null);
    setInviteDevLinks([]);
    setInviteEmailSent(null);
    setCopiedUrl(null);
    setEmails([""]);
    setMessage(DEFAULT_VENDOR_INVITE_MESSAGE);
    const initial = defaultProjectId ? String(defaultProjectId) : "";
    if (initial && normalizedOptions.some((o) => o.id === initial)) {
      setInviteProjectId(initial);
    } else if (normalizedOptions.length === 1) {
      setInviteProjectId(normalizedOptions[0].id);
    } else {
      setInviteProjectId("");
    }
  }, [open, defaultProjectId, normalizedOptions]);

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
        invitation_message: message.trim() || DEFAULT_VENDOR_INVITE_MESSAGE,
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
        await onInvited?.();
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
        setMessage(DEFAULT_VENDOR_INVITE_MESSAGE);
        setInviteProjectId(
          normalizedOptions.length === 1 ? normalizedOptions[0].id : defaultProjectId || ""
        );
      }
      await onInvited?.();
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

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={() => !inviteSubmitting && onClose()}
        aria-hidden
      />
      <div className="relative w-full max-w-lg mx-4 bg-card rounded-xl border border-border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 pt-6 pb-2">
          <div>
            <h2 className="text-lg font-bold text-foreground">{title}</h2>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>

          <button
            type="button"
            disabled={inviteSubmitting}
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-accent transition-colors text-muted-foreground disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 pb-6 pt-4 space-y-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Mail className="w-4 h-4 text-primary" /> Email invitations
          </div>

          <div className="rounded-lg border border-dashed border-border bg-muted/30 p-3 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-foreground">Onboarding links</span>
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
                Email delivery is disabled in this environment. Copy each link and send it to the vendor
                manually.
              </p>
            )}
            {inviteDevLinks.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                After you send invitations, full onboarding URLs appear here for copying (useful while email
                is off in development).
              </p>
            ) : (
              <ul className="space-y-3">
                {inviteDevLinks.map((row) => (
                  <li key={row.email} className="space-y-1">
                    <span className="text-xs font-medium text-muted-foreground">{row.email}</span>
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
              disabled={inviteSubmitting || normalizedOptions.length === 0}
              className="w-full h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-all"
            >
              <option value="">
                {normalizedOptions.length === 0 ? "No projects available" : "Select project"}
              </option>
              {normalizedOptions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
            {normalizedOptions.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No projects available for your account. You need project access to invite vendors.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Recipient emails</label>

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
            <label className="text-sm font-medium text-foreground">Invitation message</label>
            <textarea
              rows={4}
              value={message}
              disabled={inviteSubmitting}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-all resize-y disabled:opacity-50"
            />
          </div>

          {inviteError && <p className="text-sm text-destructive">{inviteError}</p>}

          <button
            type="button"
            onClick={handleSendInvitations}
            disabled={
              inviteSubmitting ||
              !inviteProjectId ||
              normalizedOptions.length === 0
            }
            className="w-full inline-flex items-center justify-center gap-2 h-10 rounded-lg bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {inviteSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Sending…
              </>
            ) : (
              <>
                <Send className="w-4 h-4" /> Send invitations
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
