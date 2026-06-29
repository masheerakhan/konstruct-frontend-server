import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { CheckCircle, Plus, X, Loader2, ChevronDown } from "lucide-react";
import {
  verifyVendorInvitation,
  completeVendorOnboarding,
} from "../../../api";

const DEPARTMENTS = [
  "Execution",
  "Safety",
  "Quality",
  "Billing",
  "Planning",
  "Admin",
  "Store",
  "HR",
];

const ROLES = [
  "Project Manager",
  "Safety Officer",
  "QA/QC Engineer",
  "Billing Engineer",
  "Site Engineer",
  "Planning Engineer",
  "Admin Officer",
  "Store Keeper",
];

const ESCALATION_TRIGGERS = [
  "00:01:00",
  "00:02:00",
  "00:04:00",
  "00:08:00",
  "00:12:00",
  "01:00:00",
  "02:00:00",
  "03:00:00",
  "07:00:00",
];

/** CC rows only (E2–E5). E1 is always the invited person in Personal Details. */
const MAX_CC_CONTACTS = 4;

function getFirstAvailableEscalationLevel(contacts, excludeIdx = -1) {
  const used = new Set(
    contacts
      .map((c, i) => (i === excludeIdx ? null : c.escalation_level))
      .filter(Boolean)
  );
  for (const lvl of ["E2", "E3", "E4", "E5"]) {
    if (!used.has(lvl)) return lvl;
  }
  return "E2";
}

function getEscalationLevelOptionsForRow(contacts, idx) {
  const current = contacts[idx]?.escalation_level || "E2";
  const usedByOthers = new Set(
    contacts
      .map((c, i) => (i !== idx ? c.escalation_level : null))
      .filter(Boolean)
  );
  return ["E2", "E3", "E4", "E5"].filter(
    (l) => l === current || !usedByOthers.has(l)
  );
}

export default function VendorOnboarding() {
  const { token } = useParams();  

  const [verifyLoading, setVerifyLoading] = useState(true);
  const [verifyResult, setVerifyResult] = useState(null);

  const [department, setDepartment] = useState("");
  const [role, setRole] = useState("");
  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [escalationTrigger, setEscalationTrigger] = useState("");
  const [contacts, setContacts] = useState([]);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [success, setSuccess] = useState(false);

  const runVerify = useCallback(async () => {
    if (!token) {
      setVerifyResult({ valid: false, reason: "missing_token" });
      setVerifyLoading(false);
      return;
    }
    setVerifyLoading(true);
    try {
      const res = await verifyVendorInvitation(token);
      setVerifyResult(res.data);
    } catch {
      setVerifyResult({ valid: false, reason: "network" });
    } finally {
      setVerifyLoading(false);
    }
  }, [token]);

  useEffect(() => {
    runVerify();
  }, [runVerify]);

  useEffect(() => {
    if (verifyResult?.valid && verifyResult.email) {
      setEmail(String(verifyResult.email));
    }
  }, [verifyResult]);

  const updateContact = (idx, field, value) => {
    setContacts((prev) =>
      prev.map((c, i) => (i === idx ? { ...c, [field]: value } : c))
    );
  };

  const addContact = () => {
    setContacts((prev) => {
      if (prev.length >= MAX_CC_CONTACTS) return prev;
      const level = getFirstAvailableEscalationLevel(prev);
      return [
        ...prev,
        {
          name: "",
          position: "",
          email: "",
          phone: "",
          escalation_level: level,
          escalation_trigger: "",
        },
      ];
    });
  };

  const removeContact = (idx) => {
    setContacts((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    setSubmitError(null);

    if (!verifyResult?.valid) {
      setSubmitError("This invitation link is not valid.");
      return;
    }

    if (!department || !role) {
      setSubmitError("Please select department and role.");
      return;
    }

    if (!fullName.trim() || !mobile.trim() || !email.trim()) {
      setSubmitError("Please fill all personal details.");
      return;
    }

    if (!escalationTrigger) {
      setSubmitError("Please select an escalation trigger.");
      return;
    }

    if (contacts.length > 0) {
      const invalidContact = contacts.find(
        (c) =>
          !c.name.trim() ||
          !c.position.trim() ||
          !c.email.trim() ||
          !c.phone.trim()
      );

      if (invalidContact) {
        setSubmitError(
          "Please fill all fields for each CC communication contact."
        );
        return;
      }

      const badLevel = contacts.some(
        (c) => !/^E[2-5]$/i.test((c.escalation_level || "").trim())
      );
      if (badLevel) {
        setSubmitError(
          "Each CC must use escalation levels E2–E5 only (E1 is you, the invited contact)."
        );
        return;
      }

      const levels = contacts.map((c) =>
        String(c.escalation_level || "").trim().toUpperCase()
      );
      if (new Set(levels).size !== levels.length) {
        setSubmitError(
          "Each escalation level (E2–E5) may only be used once."
        );
        return;
      }

      const missingContactTrigger = contacts.some((c) => !c.escalation_trigger);
      if (missingContactTrigger) {
        setSubmitError(
          "Please select an escalation trigger for each CC contact."
        );
        return;
      }
    }

    setSubmitting(true);
    try {
      await completeVendorOnboarding(token, {
        department,
        role,
        full_name: fullName.trim(),
        mobile: mobile.trim(),
        email: email.trim(),
        escalation_trigger: escalationTrigger,
        contacts:
          contacts.length > 0
            ? contacts.map((c) => ({
                name: c.name.trim(),
                position: c.position.trim(),
                escalation_level: String(c.escalation_level || "")
                  .trim()
                  .toUpperCase(),
                escalation_trigger: c.escalation_trigger,
                email: c.email.trim(),
                phone: c.phone.trim(),
              }))
            : [],
      });
      setSuccess(true);
    } catch (e) {
      const msg =
        e?.response?.data?.detail ||
        e?.response?.data?.message ||
        e?.message ||
        "Submission failed. Please try again.";
      setSubmitError(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setSubmitting(false);
    }
  };

  const selectClass =
    "w-full h-10 rounded-lg border border-border bg-background pr-10 pl-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all appearance-none";

  const inputClass =
    "w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all";

  const labelClass = "block text-sm font-medium text-foreground mb-1.5";
  const renderSelectChevron = () => (
    <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
  );

  if (verifyLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span className="text-sm">Checking your invitation…</span>
      </div>
    );
  }

  if (!verifyResult?.valid) {
    const reason =
      verifyResult?.reason === "already_accepted"
        ? "This invitation has already been used."
        : verifyResult?.reason === "expired"
          ? "This invitation has expired."
          : verifyResult?.reason === "revoked"
            ? "This invitation is no longer valid."
            : "This invitation link is invalid or could not be verified.";

    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-md w-full rounded-xl border border-border bg-card p-6 text-center">
          <h1 className="text-lg font-semibold text-foreground mb-2">
            Unable to continue
          </h1>
          <p className="text-sm text-muted-foreground">{reason}</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-md w-full rounded-xl border border-border bg-card p-6 text-center space-y-3">
          <CheckCircle className="w-12 h-12 text-green-600 mx-auto" />
          <h1 className="text-lg font-semibold text-foreground">
            Vendor onboarded successfully
          </h1>
          <p className="text-sm text-muted-foreground">
            Thank you. Your details have been submitted.
          </p>
        </div>
      </div>
    );
  }

  const formDisabled = submitting;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5 sm:py-8 pb-24 sm:pb-8">
        <div className="mb-8">
          <h1 className="text-xl font-bold text-foreground">Vendor Onboarding</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Register a new vendor into the system
            {verifyResult.project_name ? (
              <span className="block mt-1 text-foreground/80">
                Project: {verifyResult.project_name}
              </span>
            ) : null}
          </p>
        </div>

        {submitError && (
          <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive px-4 py-3 text-sm">
            {submitError}
          </div>
        )}

        <div className="space-y-6">
          <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
            <h2 className="text-base font-semibold text-foreground mb-5">
              Project Details
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Department</label>
                <div className="relative">
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    disabled={formDisabled}
                    className={selectClass}
                  >
                    <option value="">Select</option>
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                  {renderSelectChevron()}
                </div>
              </div>

              <div>
                <label className={labelClass}>Position</label>
                <div className="relative">
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    disabled={formDisabled}
                    className={selectClass}
                  >
                    <option value="">Select role</option>
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                  {renderSelectChevron()}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
            <h2 className="text-base font-semibold text-foreground mb-5">
              Personal Details
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Full Name</label>
                <input
                  type="text"
                  placeholder="Enter full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={formDisabled}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Mobile Number</label>
                <input
                  type="tel"
                  placeholder="+91 XXXXX XXXXX"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  disabled={formDisabled}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Email Address</label>
                <input
                  type="email"
                  placeholder="vendor@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={formDisabled}
                  readOnly={!!verifyResult?.email}
                  className={`${inputClass} ${verifyResult?.email ? "opacity-90" : ""}`}
                />
              </div>

              <div>
                <label className={labelClass}>Escalation Trigger</label>
                <div className="relative">
                  <select
                    value={escalationTrigger}
                    onChange={(e) => setEscalationTrigger(e.target.value)}
                    disabled={formDisabled}
                    className={selectClass}
                  >
                    <option value="">Select DD/HH/MM</option>
                    {ESCALATION_TRIGGERS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  {renderSelectChevron()}
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">
                  You are the invited contact — escalation level{" "}
                  <span className="font-medium text-foreground">E1</span> in
                  the matrix; this is your trigger point.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-foreground">
                Communication Rules
              </h2>

              <button
                type="button"
                onClick={addContact}
                disabled={formDisabled || contacts.length >= MAX_CC_CONTACTS}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
              >
                <Plus className="w-4 h-4" /> Add Person
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Optional CC contacts (up to {MAX_CC_CONTACTS}): escalation levels{" "}
              <span className="font-medium text-foreground">E2–E5</span> only.
              Level E1 is always you (personal details above).
            </p>

            {contacts.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 border border-dashed border-border rounded-lg px-4 text-center">
                No CC contacts yet. Use &quot;Add Person&quot; to add up to{" "}
                {MAX_CC_CONTACTS}.
              </p>
            ) : null}

            <div className="space-y-4">
              {contacts.map((contact, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-border bg-background p-4 relative"
                >
                  <button
                    type="button"
                    onClick={() => removeContact(idx)}
                    disabled={formDisabled}
                    className="absolute top-3 right-3 p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <p className="text-xs font-medium text-muted-foreground mb-3 pr-8">
                    CC contact {idx + 1} — escalation{" "}
                    <span className="text-foreground">
                      {contact.escalation_level}
                    </span>
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div>
                      <label className={labelClass}>Name</label>
                      <input
                        type="text"
                        placeholder="Full name"
                        value={contact.name}
                        onChange={(e) =>
                          updateContact(idx, "name", e.target.value)
                        }
                        disabled={formDisabled}
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Position</label>
                      <div className="relative">
                        <select
                          value={contact.position}
                          onChange={(e) =>
                            updateContact(idx, "position", e.target.value)
                          }
                          disabled={formDisabled}
                          className={selectClass}
                        >
                          <option value="">Select position</option>
                          {ROLES.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                        {renderSelectChevron()}
                      </div>
                    </div>

                    <div>
                      <label className={labelClass}>Email</label>
                      <input
                        type="email"
                        placeholder="email@company.com"
                        value={contact.email}
                        onChange={(e) =>
                          updateContact(idx, "email", e.target.value)
                        }
                        disabled={formDisabled}
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Phone</label>
                      <input
                        type="tel"
                        placeholder="+91 XXXXX XXXXX"
                        value={contact.phone}
                        onChange={(e) =>
                          updateContact(idx, "phone", e.target.value)
                        }
                        disabled={formDisabled}
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                    <div>
                      <label className={labelClass}>Escalation level</label>
                      <div className="relative">
                        <select
                          value={contact.escalation_level}
                          onChange={(e) =>
                            updateContact(
                              idx,
                              "escalation_level",
                              e.target.value
                            )
                          }
                          disabled={formDisabled}
                          className={selectClass}
                        >
                          {getEscalationLevelOptionsForRow(
                            contacts,
                            idx
                          ).map((lvl) => (
                            <option key={lvl} value={lvl}>
                              {lvl}
                            </option>
                          ))}
                        </select>
                        {renderSelectChevron()}
                      </div>
                    </div>

                    <div>
                      <label className={labelClass}>
                        Escalation trigger point
                      </label>
                      <div className="relative">
                        <select
                          value={contact.escalation_trigger}
                          onChange={(e) =>
                            updateContact(
                              idx,
                              "escalation_trigger",
                              e.target.value
                            )
                          }
                          disabled={formDisabled}
                          className={selectClass}
                        >
                          <option value="">Select DD/HH/MM</option>
                          {ESCALATION_TRIGGERS.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                        {renderSelectChevron()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="fixed sm:static bottom-0 left-0 right-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85 border-t border-border sm:border-0 px-4 sm:px-0 py-3 sm:py-0">
          <div className="max-w-4xl mx-auto flex justify-end">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={formDisabled}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-11 px-6 rounded-lg bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Submitting…
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Submit & Onboard Vendor
              </>
            )}
          </button>
          </div>
        </div>
      </div>
    </div>
  );
}
