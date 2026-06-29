import { Fragment, useRef, useState } from "react";
import {
  AlertCircle,
  CalendarClock,
  FileText,
  ListChecks,
  Paperclip,
  Plus,
  Save,
  Trash2,
  Users,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

export const MOM_MEETING_TYPE_OPTIONS = [
  { value: "kick_off", label: "Kick-Off" },
  { value: "weekly_progress_review", label: "Weekly Progress Review" },
  { value: "weekly_qhse", label: "Weekly QHSE" },
  { value: "safety_committee_meeting", label: "Safety Committee Meeting" },
];

const PROJECT_OPTIONS = [
  { value: "proj_alpha", label: "Project Alpha - Tower A" },
  { value: "proj_beta", label: "Project Beta - Metro Line 3" },
  { value: "proj_gamma", label: "Project Gamma - Hospital Block" },
  { value: "proj_delta", label: "Project Delta - Airport Terminal" },
];

const PARTIES = ["Client", "PMC", "Contractor"];

const uid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const initialAttendees = () =>
  PARTIES.map((party) => ({
    party,
    company: "",
    participants: [{ id: uid(), name: "", position: "" }],
  }));

const newAgendaRow = () => ({
  id: uid(),
  agenda: "",
  actionBy: "",
  targetDate: "",
});

const newAgendaSection = (title = "New Section") => ({
  id: uid(),
  title,
  rows: [newAgendaRow()],
});

const cardCls = "mb-6 overflow-hidden rounded-xl border border-border bg-card shadow-sm";
const inputCls =
  "h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30";
const selectCls = `${inputCls} appearance-none pr-9`;
const textareaCls =
  "w-full min-h-[110px] resize-y rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30";

const SectionHeader = ({ icon: Icon, title }) => (
  <div className="border-b border-border bg-content-bg px-5 py-4">
    <h2 className="flex items-center gap-3 text-lg font-semibold text-foreground">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </span>
      {title}
    </h2>
  </div>
);

const Req = () => <span className="ml-0.5 text-red-600">*</span>;

const Caret = () => (
  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
    ▾
  </span>
);

export default function MomForm({
  onCancel,
  onSave,
  vendorOptions = [],
  vendorsLoading = false,
  vendorSelectPlaceholder = "Select vendor",
}) {
  const today = new Date().toISOString().slice(0, 10);
  const fileInputRef = useRef(null);

  const [meetingType, setMeetingType] = useState("");
  const [meetingRefNo, setMeetingRefNo] = useState("");
  const [projectName, setProjectName] = useState("");
  const [location, setLocation] = useState("");
  const [venue, setVenue] = useState("");
  const [date, setDate] = useState(today);
  const [time, setTime] = useState("");
  const [attendees, setAttendees] = useState(initialAttendees());
  const [agendaSections, setAgendaSections] = useState([newAgendaSection("General")]);
  const [attachmentItems, setAttachmentItems] = useState([]);
  const [error, setError] = useState("");

  const updateCompany = (party, value) => {
    setAttendees((prev) =>
      prev.map((row) => (row.party === party ? { ...row, company: value } : row))
    );
  };

  const updateParticipant = (party, participantId, patch) => {
    setAttendees((prev) =>
      prev.map((row) =>
        row.party === party
          ? {
              ...row,
              participants: row.participants.map((participant) =>
                participant.id === participantId ? { ...participant, ...patch } : participant
              ),
            }
          : row
      )
    );
  };

  const addParticipant = (party) => {
    setAttendees((prev) =>
      prev.map((row) =>
        row.party === party
          ? {
              ...row,
              participants: [...row.participants, { id: uid(), name: "", position: "" }],
            }
          : row
      )
    );
  };

  const removeParticipant = (party, participantId) => {
    setAttendees((prev) =>
      prev.map((row) =>
        row.party === party
          ? {
              ...row,
              participants:
                row.participants.length <= 1
                  ? row.participants
                  : row.participants.filter((participant) => participant.id !== participantId),
            }
          : row
      )
    );
  };

  const updateSectionTitle = (sectionId, title) => {
    setAgendaSections((prev) =>
      prev.map((section) => (section.id === sectionId ? { ...section, title } : section))
    );
  };

  const addSection = () => {
    setAgendaSections((prev) => [...prev, newAgendaSection()]);
  };

  const removeSection = (sectionId) => {
    setAgendaSections((prev) =>
      prev.length <= 1 ? prev : prev.filter((section) => section.id !== sectionId)
    );
  };

  const addAgendaRow = (sectionId) => {
    setAgendaSections((prev) =>
      prev.map((section) =>
        section.id === sectionId
          ? { ...section, rows: [...section.rows, newAgendaRow()] }
          : section
      )
    );
  };

  const updateAgendaRow = (sectionId, rowId, patch) => {
    setAgendaSections((prev) =>
      prev.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              rows: section.rows.map((row) => (row.id === rowId ? { ...row, ...patch } : row)),
            }
          : section
      )
    );
  };

  const removeAgendaRow = (sectionId, rowId) => {
    setAgendaSections((prev) =>
      prev.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              rows: section.rows.length <= 1 ? section.rows : section.rows.filter((row) => row.id !== rowId),
            }
          : section
      )
    );
  };

  const removeAttachmentAt = (index) => {
    setAttachmentItems((prev) => prev.filter((_, currentIndex) => currentIndex !== index));
  };

  const resetAll = () => {
    if (!window.confirm("Discard all changes?")) return;
    setMeetingType("");
    setMeetingRefNo("");
    setProjectName("");
    setLocation("");
    setVenue("");
    setDate(today);
    setTime("");
    setAttendees(initialAttendees());
    setAgendaSections([newAgendaSection("General")]);
    setAttachmentItems([]);
    setError("");
  };

  const onFilesPicked = (event) => {
    const list = event.target.files;
    if (!list?.length) return;
    setAttachmentItems((prev) => [
      ...prev,
      ...Array.from(list).map((file) => ({
        id: uid(),
        file,
        name: file.name,
        size: file.size,
      })),
    ]);
    event.target.value = "";
  };

  const buildLegacyDiscussionPoints = () =>
    agendaSections.flatMap((section) =>
      section.rows.map((row) => ({
        id: row.id,
        discussion: row.agenda,
        responsibleType: "external",
        responsiblePerson: row.actionBy,
        responsibleRole: "",
        continual: false,
        targetDate: row.targetDate,
        tag: section.title,
        sectionTitle: section.title,
      }))
    );

  const buildLegacyAttendees = () =>
    attendees.flatMap((group) =>
      group.participants.map((participant) => ({
        id: participant.id,
        attendeeType: group.party.toLowerCase(),
        party: group.party,
        internalName: participant.name,
        externalName: participant.name,
        organization: group.company,
        role: participant.position,
        email: "",
      }))
    );

  const handleSave = () => {
    setError("");
    if (!meetingType) {
      setError("Type of Meeting is required.");
      return;
    }
    if (!date) {
      setError("Date of Meeting is required.");
      return;
    }

    const payload = {
      meetingType,
      meetingRefNo,
      projectName,
      location,
      venue,
      date,
      time,
      agendaSections,
      meetingDate: date,
      basicTag: "",
      discussionPoints: buildLegacyDiscussionPoints(),
      attendees: buildLegacyAttendees(),
      attendeeGroups: attendees,
    };

    console.log("MOM payload:", payload);
    toast.success("MOM saved successfully");
    const files = attachmentItems.map((item) => item.file).filter(Boolean);
    onSave?.(payload, files);
  };

  return (
    <div className="min-h-screen bg-content-bg py-8">
      <div className="mx-auto max-w-5xl px-4">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">New MOM</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground">
            Minutes of Meeting
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Capture meeting details, attendees and agenda points.
          </p>
        </div>

        {error ? (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        <section className={cardCls}>
          <SectionHeader icon={FileText} title="Meeting Details" />
          <div className="grid gap-4 p-6 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground">
                Type of Meeting<Req />
              </label>
              <div className="relative">
                <select
                  value={meetingType}
                  onChange={(e) => setMeetingType(e.target.value)}
                  className={selectCls}
                >
                  <option value="">Select type</option>
                  {MOM_MEETING_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <Caret />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground">Meeting Ref. No.</label>
              <input
                value={meetingRefNo}
                onChange={(e) => setMeetingRefNo(e.target.value)}
                placeholder="e.g. MOM-2025-001"
                className={inputCls}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground">Project Name</label>
              <div className="relative">
                <select
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className={selectCls}
                >
                  <option value="">Select project</option>
                  {PROJECT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <Caret />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground">Location</label>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Site Office, Mumbai"
                className={inputCls}
              />
            </div>
          </div>
        </section>

        <section className={cardCls}>
          <SectionHeader icon={CalendarClock} title="Schedule" />
          <div className="grid gap-4 p-6 md:grid-cols-3">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground">Venue</label>
              <input
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="e.g. Conference Room B"
                className={inputCls}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground">
                Date<Req />
              </label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground">Time</label>
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={inputCls} />
            </div>
          </div>
        </section>

        <section className={cardCls}>
          <SectionHeader icon={Users} title="Attendees" />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-content-bg">
                  <th className="w-[140px] px-4 py-3 text-left font-medium text-muted-foreground">Party</th>
                  <th className="w-[220px] px-4 py-3 text-left font-medium text-muted-foreground">Company</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Participants</th>
                  <th className="w-[260px] px-4 py-3 text-left font-medium text-muted-foreground">
                    Position / Designation
                  </th>
                </tr>
              </thead>
              <tbody>
                {attendees.map((row) => (
                  <tr key={row.party} className="align-top">
                    <td className="border-b border-border px-4 py-4 font-medium text-foreground">{row.party}</td>
                    <td className="border-b border-border px-4 py-4">
                      <input
                        value={row.company}
                        onChange={(e) => updateCompany(row.party, e.target.value)}
                        placeholder="Company name"
                        className={inputCls}
                      />
                    </td>
                    <td className="border-b border-border px-4 py-4">
                      <div className="space-y-2">
                        {row.participants.map((participant, index) => (
                          <div key={participant.id} className="flex items-center gap-2">
                            <span className="w-5 text-xs text-muted-foreground">{index + 1}.</span>
                            <input
                              value={participant.name}
                              onChange={(e) =>
                                updateParticipant(row.party, participant.id, { name: e.target.value })
                              }
                              placeholder="Participant name"
                              className={inputCls}
                            />
                            <button
                              type="button"
                              className="h-8 w-8 shrink-0 rounded-md text-muted-foreground transition hover:bg-content-bg hover:text-red-600"
                              onClick={() => removeParticipant(row.party, participant.id)}
                              disabled={row.participants.length <= 1}
                              aria-label="Remove participant"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => addParticipant(row.party)}
                          className="mt-1 inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition hover:bg-content-bg"
                        >
                          <Plus className="h-4 w-4" />
                          Add Participant
                        </button>
                      </div>
                    </td>
                    <td className="border-b border-border px-4 py-4">
                      <div className="space-y-2">
                        {row.participants.map((participant) => (
                          <div key={participant.id} className="flex items-center">
                            <input
                              value={participant.position}
                              onChange={(e) =>
                                updateParticipant(row.party, participant.id, { position: e.target.value })
                              }
                              placeholder="Position / Designation"
                              className={inputCls}
                            />
                          </div>
                        ))}
                        <div className="h-10" aria-hidden />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className={cardCls}>
          <SectionHeader icon={ListChecks} title="Agenda" />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-content-bg">
                  <th className="w-[80px] px-4 py-3 text-left font-medium text-muted-foreground">Sr. No.</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Agenda Point</th>
                  <th className="w-[200px] px-4 py-3 text-left font-medium text-muted-foreground">Action By</th>
                  <th className="w-[180px] px-4 py-3 text-left font-medium text-muted-foreground">Target Date</th>
                  <th className="w-[100px] px-4 py-3 text-left font-medium text-muted-foreground" />
                </tr>
              </thead>
              <tbody>
                {agendaSections.map((section) => (
                  <Fragment key={section.id}>
                    <tr className="bg-primary/5">
                      <td colSpan={5} className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                            Section
                          </span>
                          <input
                            value={section.title}
                            onChange={(e) => updateSectionTitle(section.id, e.target.value)}
                            placeholder="Section title (e.g. Safety, Commercial)"
                            className={`${inputCls} max-w-sm font-semibold`}
                          />
                          <div className="ml-auto flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => addAgendaRow(section.id)}
                              className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition hover:bg-content-bg"
                            >
                              <Plus className="h-4 w-4" />
                              Add Row
                            </button>
                            <button
                              type="button"
                              className="h-8 w-8 rounded-md text-muted-foreground transition hover:bg-content-bg hover:text-red-600"
                              onClick={() => removeSection(section.id)}
                              disabled={agendaSections.length <= 1}
                              aria-label="Remove section"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                    {section.rows.map((row, index) => (
                      <tr key={row.id} className="border-b border-border last:border-b-0">
                        <td className="px-4 py-3 font-medium text-foreground">{index + 1}</td>
                        <td className="px-4 py-3">
                          <input
                            value={row.agenda}
                            onChange={(e) => updateAgendaRow(section.id, row.id, { agenda: e.target.value })}
                            placeholder="Describe the agenda point"
                            className={inputCls}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            value={row.actionBy}
                            onChange={(e) => updateAgendaRow(section.id, row.id, { actionBy: e.target.value })}
                            placeholder="Responsible"
                            className={inputCls}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="date"
                            value={row.targetDate}
                            onChange={(e) => updateAgendaRow(section.id, row.id, { targetDate: e.target.value })}
                            className={inputCls}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            className="h-8 w-8 rounded-md text-muted-foreground transition hover:bg-content-bg hover:text-red-600"
                            onClick={() => removeAgendaRow(section.id, row.id)}
                            disabled={section.rows.length <= 1}
                            aria-label="Remove row"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-border p-4">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-md border border-primary bg-primary px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
              onClick={addSection}
            >
              <Plus className="h-4 w-4" />
              Add Section
            </button>
          </div>
        </section>

        <section className={cardCls}>
          <SectionHeader icon={Paperclip} title="Attachment" />
          <div className="p-6">
            <div className="rounded-lg border border-border bg-content-bg/50 p-4">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={onFilesPicked}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:bg-content-bg"
              >
                <Plus className="h-4 w-4" />
                Attach file
              </button>
              {attachmentItems.length > 0 ? (
                <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                  {attachmentItems.map((item, index) => (
                    <li
                      key={item.id}
                      className="flex items-center justify-between gap-2 rounded-md border border-border bg-background px-2 py-1.5"
                    >
                      <span className="min-w-0 truncate">
                        {item.name}
                        {item.size != null ? ` (${Math.round(item.size / 1024)} KB)` : ""}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeAttachmentAt(index)}
                        className="shrink-0 rounded p-1 text-muted-foreground transition hover:bg-red-50 hover:text-red-600"
                        aria-label={`Remove ${item.name}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
        </section>

        <div className="bottom-4 z-10 flex items-center justify-end gap-3 rounded-xl border border-border bg-background/90 p-3 shadow-lg backdrop-blur">
          <button
            type="button"
            onClick={onCancel || resetAll}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-5 py-2.5 text-sm font-medium text-foreground transition hover:bg-content-bg"
          >
            <X className="h-4 w-4" />
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-2 rounded-lg border border-primary bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          >
            <Save className="h-4 w-4" />
            Save MOM
          </button>
        </div>
      </div>
    </div>
  );
}
