import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { formatInputDate } from "../../../utils/dateFormatter";

const ATTENDEE_ROLES = [
  "Client",
  "PMC",
  "Civil Contractor",
  "Electrical Contractor",
  "PEB Contractor",
  "HVAC",
];

const STATUS_OPTIONS = ["Pending", "Partially closed", "Closed", "Info"];

const inputCls =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-300";

const labelCls = "mb-1 block text-sm font-medium text-slate-700";
const cardCls = "rounded-xl border border-slate-200 bg-white shadow-sm";
const sectionHeaderCls =
  "rounded-t-xl border-b border-slate-200 bg-slate-50 px-5 py-3 text-base font-semibold uppercase tracking-wide text-slate-700";
const sectionBodyCls = "p-5";
const thCls =
  "border border-slate-300 bg-slate-100 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-700";
const tdCls = "border border-slate-300 px-2 py-1 align-top";
const tableInputCls =
  "w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-300";
const addBtnCls =
  "inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50";
const iconBtnCls =
  "inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40";

const today = () => formatInputDate(new Date());

function newAgendaRow() {
  return {
    agendaPoint: "",
    discussionDecision: "",
    actionBy: "",
    targetDate: "",
    status: "Pending",
  };
}

export default function SafetyCommitteeMeetingAgenda({
  projectOptions = [],
  onSubmitSuccess,
}) {
  const [projectName, setProjectName] = useState("");
  const [location, setLocation] = useState("");
  const [venue, setVenue] = useState("");
  const [date, setDate] = useState(today());
  const [timeFrom, setTimeFrom] = useState("");
  const [timeTo, setTimeTo] = useState("");

  const [attendees, setAttendees] = useState(
    ATTENDEE_ROLES.map((role) => ({
      role,
      companyName: "",
      personName: "",
    })),
  );

  const [agendaRows, setAgendaRows] = useState([newAgendaRow()]);

  const participantCount = useMemo(() => {
    return attendees.reduce((count, row) => {
      const names = String(row.personName || "")
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean);
      return count + names.length;
    }, 0);
  }, [attendees]);

  const updateAttendee = (index, field, value) => {
    setAttendees((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    );
  };

  const addAgendaRow = () => {
    setAgendaRows((prev) => [...prev, newAgendaRow()]);
  };

  const removeAgendaRow = (index) => {
    setAgendaRows((prev) => prev.filter((_, i) => i !== index));
  };

  const updateAgendaRow = (index, field, value) => {
    setAgendaRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    );
  };

  const handleReset = () => {
    setProjectName("");
    setLocation("");
    setVenue("");
    setDate(today());
    setTimeFrom("");
    setTimeTo("");
    setAttendees(
      ATTENDEE_ROLES.map((role) => ({
        role,
        companyName: "",
        personName: "",
      })),
    );
    setAgendaRows([newAgendaRow()]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const payload = {
      meetingNo: `SCM-${Date.now().toString().slice(-6)}`,
      projectName,
      location,
      venue,
      date,
      timeFrom,
      timeTo,
      attendees,
      agendaRows,
      participantCount,
      chairedBy: "",
      status: "Open",
      dateOfClosure: "",
      remarks: "",
      createdAt: new Date().toISOString(),
    };

    console.log("Safety Committee Meeting Agenda submitted:", payload);
    toast.success("Safety Committee Meeting Agenda saved successfully");
    onSubmitSuccess?.(payload);
  };

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800 sm:text-3xl">
            Safety Committee Meeting Agenda
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Create safety committee meeting agenda with attendees, discussion
            points and action tracking.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          <section className={cardCls}>
            <div className={sectionHeaderCls}>Meeting Details</div>

            <div className={sectionBodyCls}>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className={labelCls}>Project Name</label>
                  <select
                    className={inputCls}
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                  >
                    <option value="">Select project</option>
                    {projectOptions.map((project) => (
                      <option
                        key={project.id || project.name}
                        value={
                          project.name || project.project_name || project.id
                        }
                      >
                        {project.name ||
                          project.project_name ||
                          `Project ${project.id}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelCls}>Location</label>
                  <input
                    type="text"
                    className={inputCls}
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Enter project / meeting location"
                  />
                </div>

                <div>
                  <label className={labelCls}>Venue</label>
                  <input
                    type="text"
                    className={inputCls}
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    placeholder="Enter meeting venue"
                  />
                </div>

                <div>
                  <label className={labelCls}>Date</label>
                  <input
                    type="date"
                    className={inputCls}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className={labelCls}>Time</label>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <input
                      type="time"
                      className={inputCls}
                      value={timeFrom}
                      onChange={(e) => setTimeFrom(e.target.value)}
                      placeholder="From time"
                    />
                    <input
                      type="time"
                      className={inputCls}
                      value={timeTo}
                      onChange={(e) => setTimeTo(e.target.value)}
                      placeholder="To time"
                    />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Select meeting start time and close-out time.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className={cardCls}>
            <div className={sectionHeaderCls}>Meeting Attendees</div>

            <div className={sectionBodyCls}>
              <div className="overflow-x-auto rounded-md border border-slate-300">
                <table className="w-full min-w-[850px] border-collapse text-sm">
                  <thead>
                    <tr>
                      <th className={thCls + " w-[220px]"}>Stakeholder</th>
                      <th className={thCls}>Company Name</th>
                      <th className={thCls}>Person Name</th>
                    </tr>
                  </thead>

                  <tbody>
                    {attendees.map((row, index) => (
                      <tr key={row.role}>
                        <td
                          className={
                            tdCls + " bg-slate-50 font-semibold text-slate-700"
                          }
                        >
                          {row.role}
                        </td>

                        <td className={tdCls}>
                          <input
                            type="text"
                            className={tableInputCls}
                            value={row.companyName}
                            onChange={(e) =>
                              updateAttendee(
                                index,
                                "companyName",
                                e.target.value,
                              )
                            }
                            placeholder="M/s Company name"
                          />
                        </td>

                        <td className={tdCls}>
                          <input
                            type="text"
                            className={tableInputCls}
                            value={row.personName}
                            onChange={(e) =>
                              updateAttendee(
                                index,
                                "personName",
                                e.target.value,
                              )
                            }
                            placeholder="Mr./Ms. person names"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="mt-2 text-xs text-slate-500">
                Tip: Add multiple person names separated by commas.
              </p>
            </div>
          </section>

          <section className={cardCls}>
            <div className={sectionHeaderCls}>Agenda Points</div>

            <div className={sectionBodyCls}>
              <div className="overflow-x-auto rounded-md border border-slate-300">
                <table className="w-full min-w-[1050px] border-collapse text-sm">
                  <thead>
                    <tr>
                      <th className={thCls + " w-16"}>S.No</th>
                      <th className={thCls}>Agenda Point</th>
                      <th className={thCls}>Discussion / Decision</th>
                      <th className={thCls}>Action by</th>
                      <th className={thCls}>Target Date</th>
                      <th className={thCls}>Status</th>
                      <th className={thCls + " w-20 text-center"}>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {agendaRows.map((row, index) => (
                      <tr key={index}>
                        <td className={tdCls + " text-center text-slate-600"}>
                          {index + 1}
                        </td>

                        <td className={tdCls}>
                          <input
                            type="text"
                            className={tableInputCls}
                            value={row.agendaPoint}
                            onChange={(e) =>
                              updateAgendaRow(
                                index,
                                "agendaPoint",
                                e.target.value,
                              )
                            }
                            placeholder="Agenda point"
                          />
                        </td>

                        <td className={tdCls}>
                          <textarea
                            className={`${tableInputCls} min-h-[70px] resize-y`}
                            value={row.discussionDecision}
                            onChange={(e) =>
                              updateAgendaRow(
                                index,
                                "discussionDecision",
                                e.target.value,
                              )
                            }
                            placeholder="Discussion / decision"
                          />
                        </td>

                        <td className={tdCls}>
                          <input
                            type="text"
                            className={tableInputCls}
                            value={row.actionBy}
                            onChange={(e) =>
                              updateAgendaRow(index, "actionBy", e.target.value)
                            }
                            placeholder="Responsible person"
                          />
                        </td>

                        <td className={tdCls}>
                          <input
                            type="date"
                            className={tableInputCls}
                            value={row.targetDate}
                            onChange={(e) =>
                              updateAgendaRow(
                                index,
                                "targetDate",
                                e.target.value,
                              )
                            }
                          />
                        </td>

                        <td className={tdCls}>
                          <select
                            className={tableInputCls}
                            value={row.status}
                            onChange={(e) =>
                              updateAgendaRow(index, "status", e.target.value)
                            }
                          >
                            {STATUS_OPTIONS.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td className={tdCls + " text-center"}>
                          <button
                            type="button"
                            onClick={() => removeAgendaRow(index)}
                            disabled={agendaRows.length === 1}
                            className={iconBtnCls}
                            aria-label="Delete agenda row"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-2 flex justify-start">
                <button
                  type="button"
                  onClick={addAgendaRow}
                  className={addBtnCls}
                >
                  <Plus className="h-4 w-4" />
                  Add Row
                </button>
              </div>
            </div>
          </section>

          <div className="flex justify-end gap-3 pb-4">
            <button
              type="button"
              className="rounded-md border border-slate-300 bg-white px-5 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
              onClick={handleReset}
            >
              Reset
            </button>

            <button
              type="submit"
              className="rounded-md bg-slate-800 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400"
            >
              Submit Agenda
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
