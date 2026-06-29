import { useState } from "react";
import { capitalCase } from "change-case";
import { ClipboardList, Send } from "lucide-react";
import VendorInviteModal from "../../Vendor/VendorInviteModal";
// import { capitalCase } from "../../Transmittal/stringCase";

export default function CommunicationMatrixRegisterTable({
  projectOptions = [],
  projectId = "",
  rows = [],
  loading = false,
  onProjectChange,
  /** Called after invite API succeeds (refresh matrix rows from parent) */
  onInviteSuccess,
}) {
  const [inviteOpen, setInviteOpen] = useState(false);

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden mb-8">
      <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-border">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ClipboardList className="w-5 h-5 text-primary shrink-0" />
              <h2 className="text-base sm:text-lg font-semibold text-foreground">
                Vendor Onboarding Process
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Derived from active vendors and their communication contacts.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setInviteOpen(true)}
            disabled={!projectOptions.length}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-md border border-border bg-card text-sm font-medium text-foreground hover:bg-accent transition-colors disabled:opacity-50 shrink-0 self-start sm:self-center"
          >
            <Send className="w-4 h-4" /> Invite
          </button>
        </div>
      </div>

      <div className="px-4 sm:px-6 py-3 border-b border-border">
        <div className="max-w-sm">
          <label className="block text-xs font-semibold text-primary mb-1.5">
            {capitalCase("project")}
          </label>
          <select
            className="w-full h-10 text-sm rounded-lg border border-primary/40 bg-background px-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            value={projectId}
            onChange={(e) => onProjectChange?.(e.target.value)}
          >
            <option value="">Select Project</option>
            {projectOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {["SR. NO", "PROJECT ACTIVITIES", "TO", "CARBON COPY (CC)"].map(
                (h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-bold text-primary uppercase tracking-wider whitespace-nowrap"
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  Loading communication matrix...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  No active vendors/contacts found for this project.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.sr_no}
                  className="border-b border-border last:border-b-0 hover:bg-content-bg/50 transition-colors align-top"
                >
                  <td className="px-4 py-3 text-muted-foreground tabular-nums">
                    {row.sr_no}
                  </td>
                  <td className="px-4 py-3 text-foreground">
                    {row.project_activity || "—"}
                  </td>
                  <td className="px-4 py-3 text-foreground">
                    <div className="leading-relaxed">
                      <div className="font-medium">{row?.to?.name || "—"}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-foreground">
                    {Array.isArray(row.cc) && row.cc.length > 0 ? (
                      <div className="space-y-2">
                        {row.cc.map((c, idx) => (
                          <div
                            key={`${row.sr_no}-${idx}`}
                            className="leading-relaxed"
                          >
                            <div className="font-medium">{c.name || "—"}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <VendorInviteModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        projectOptions={projectOptions}
        defaultProjectId={projectId}
        title="Invite vendors"
        subtitle="Send onboarding invitations via email. Vendors complete the same profile form via the link."
        onInvited={onInviteSuccess}
      />
    </div>
  );
}
