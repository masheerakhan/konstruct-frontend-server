import { useMemo, useState } from "react";
import { Plus, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";
import { formatInputDate } from "../../../utils/dateFormatter";
import MockDrillObservationReportPreview from "./MockDrillObservationReportPreview";
import FileUploadControl from "../../FileUploadControl";
const DRILL_TYPES = [
  "Fire / Explosion",
  "Fall from Height",
  "Collapse of an excavation involving personnel",
  "Collapse of Building / Structural failure",
  "Vehicle accidents",
  "Medical",
  "Spills of flammable liquids",
  "Hazardous Material / Toxic Substances release",
  "Confined Space",
  "Flood",
  "Bomb threat",
  "Earthquake",
  "Cyclone Emergency",
  "Severe Weather Drill",
  "Suspended worker rescue Drill",
  "Electrocution",
  "Other",
];

const ALERT_METHODS = [
  "Alarm System",
  "Intercom",
  "Phone",
  "Voice Notification",
  "Siren",
  "Other",
];

const WEATHER_OPTIONS = [
  "Clear",
  "Cloudy",
  "Raining",
  "Rain and wind",
  "Windy",
  "Other",
];

const DRAWBACK_OPTIONS = [
  "Alarm not heard",
  "Staff and workers unsure of what to do",
  "ERT team not sure of responsibilities / response to be given",
  "Unable to open exit doors",
  "Personnel not accounted for / attendance",
  "Difficulties with evacuation of disabled personnel, customers or visitors",
  "Obstruction in Evacuation route",
  "Not sure of assembly point",
  "Lead distance of Assembly point is more",
  "Radio communication problems",
  "Network problems",
  "Noise impedes communications",
  "Long time to evacuate",
  "Personnel not serious about drill",
  "Confusion",
  "Doors or Exits are blocked",
  "Incident command problems",
  "Other",
];

const ERT_ROLES = [
  "Incident Controller",
  "Site Main Controller",
  "Fire Fighter",
  "First Aider",
  "Evacuation Marshal",
  "Security",
];

const inputCls =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500";

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

function newTimelineRow() {
  return {
    itemDescription: "",
    timeStart: "",
    timeEnd: "",
  };
}

function newPreparednessRow() {
  return {
    memberName: "",
    role: "",
    presentAbsent: "Present",
  };
}

function newParticipationRow() {
  return {
    vendorName: "",
    participants: "",
    missingPersonnel: "",
  };
}

function newWwrRow() {
  return {
    whatWentRight: "",
    whatWentWrong: "",
  };
}

function newImprovementRow() {
  return {
    areaOfImprovement: "",
    actionPlan: "",
    actionDate: "",
  };
}

function newPhotoRow() {
  return {
    description: "",
    file: null,
    fileName: "",
  };
}

function BulletTextarea({
  value = "",
  onChange,
  placeholder,
  rows = 8,
  className = "",
}) {
  const BULLET = "• ";

  const handleKeyDown = (e) => {
    if (e.key !== "Enter") return;

    e.preventDefault();

    const textarea = e.target;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    if (value === "") {
      onChange(BULLET);
      requestAnimationFrame(() => {
        textarea.selectionStart = textarea.selectionEnd = BULLET.length;
      });
      return;
    }

    const before = value.slice(0, start);
    const after = value.slice(end);
    const next = `${before}\n${BULLET}${after}`;

    onChange(next);

    requestAnimationFrame(() => {
      const pos = start + BULLET.length + 1;
      textarea.selectionStart = textarea.selectionEnd = pos;
    });
  };

  const handleChange = (e) => {
    let next = e.target.value;

    if (next === "") {
      onChange("");
      return;
    }

    if (value === "" && next.trim() !== "" && !next.startsWith(BULLET)) {
      next = BULLET + next;
    }

    onChange(next);
  };

  return (
    <textarea
      className={className}
      value={value}
      onKeyDown={handleKeyDown}
      onChange={handleChange}
      rows={rows}
      placeholder={placeholder}
    />
  );
}

function CheckboxGroup({
  options,
  selected,
  onChange,
  columns = "md:grid-cols-2",
}) {
  const toggle = (option) => {
    if (selected.includes(option)) {
      onChange(selected.filter((x) => x !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  return (
    <div className={`grid grid-cols-1 gap-2 ${columns}`}>
      {options.map((option) => (
        <label
          key={option}
          className="flex cursor-pointer items-start gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
        >
          <input
            type="checkbox"
            checked={selected.includes(option)}
            onChange={() => toggle(option)}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-slate-700 focus:ring-slate-400"
          />
          <span>{option}</span>
        </label>
      ))}
    </div>
  );
}

function timeToMinutes(value) {
  if (!value || typeof value !== "string") return null;

  const [hours, minutes] = value.split(":").map(Number);

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;

  return hours * 60 + minutes;
}

function minutesDiff(startTime, endTime) {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);

  if (start === null || end === null) return 0;

  // Same-day calculation
  if (end >= start) {
    return end - start;
  }

  // If drill crosses midnight, example: 23:50 to 00:10 = 20 min
  return 24 * 60 - start + end;
}

function formatDuration(minutes) {
  const m = Number(minutes || 0);

  if (!m) return "0 min";

  const h = Math.floor(m / 60);
  const rem = m % 60;

  if (h && rem) return `${h} hr ${rem} min`;
  if (h) return `${h} hr`;
  return `${rem} min`;
}

export default function MockDrillObservationReport({
  projectOptions = [],
  onSubmitSuccess,
}) {
  const [projectName, setProjectName] = useState("");
  const [mockDrillDate, setMockDrillDate] = useState(today());
  const [contractor, setContractor] = useState("");
  const [time, setTime] = useState("");
  const [observerName, setObserverName] = useState("");
  const [mockDrillNo, setMockDrillNo] = useState("");

  const [drillType, setDrillType] = useState("");
  const [otherDrillType, setOtherDrillType] = useState("");

  const [alertMethods, setAlertMethods] = useState([]);
  const [otherAlertMethod, setOtherAlertMethod] = useState("");

  const [weatherCondition, setWeatherCondition] = useState("");
  const [otherWeatherCondition, setOtherWeatherCondition] = useState("");

  const [timelineRows, setTimelineRows] = useState([newTimelineRow()]);
  const [drawbacks, setDrawbacks] = useState([]);
  const [otherDrawback, setOtherDrawback] = useState("");

  const [preparednessRows, setPreparednessRows] = useState(
    ERT_ROLES.map((role) => ({
      memberName: "",
      role,
      presentAbsent: "Present",
    })),
  );

  const [participationRows, setParticipationRows] = useState([
    newParticipationRow(),
  ]);
  const [recommendedMitigation, setRecommendedMitigation] = useState("");
  const [previousImplementedPoints, setPreviousImplementedPoints] =
    useState("");
  const [previousMockDrillNo, setPreviousMockDrillNo] = useState("");
  const [previousMockDrillDate, setPreviousMockDrillDate] = useState("");
  const [wwrRows, setWwrRows] = useState([newWwrRow()]);
  const [improvementRows, setImprovementRows] = useState([newImprovementRow()]);
  const [photoRows, setPhotoRows] = useState([newPhotoRow()]);
  const [showPreview, setShowPreview] = useState(false);

  const totalTimeTaken = useMemo(() => {
    return timelineRows.reduce((sum, row) => {
      return sum + minutesDiff(row.timeStart, row.timeEnd);
    }, 0);
  }, [timelineRows]);

  const updateArrayRow = (setter, index, field, value) => {
    setter((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    );
  };

  const removeArrayRow = (setter, index) => {
    setter((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleReset = () => {
    setProjectName("");
    setMockDrillDate(today());
    setContractor("");
    setTime("");
    setObserverName("");
    setMockDrillNo("");
    setDrillType("");
    setOtherDrillType("");
    setAlertMethods([]);
    setOtherAlertMethod("");
    setWeatherCondition("");
    setOtherWeatherCondition("");
    setTimelineRows([newTimelineRow()]);
    setDrawbacks([]);
    setOtherDrawback("");
    setPreparednessRows(
      ERT_ROLES.map((role) => ({
        memberName: "",
        role,
        presentAbsent: "Present",
      })),
    );
    setParticipationRows([newParticipationRow()]);
    setRecommendedMitigation("");
    setPreviousImplementedPoints("");
    setPreviousMockDrillNo("");
    setPreviousMockDrillDate("");
    setWwrRows([newWwrRow()]);
    setImprovementRows([newImprovementRow()]);
    setPhotoRows([newPhotoRow()]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const payload = {
      id: `mock-drill-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      projectName,
      mockDrillDate,
      contractor,
      time,
      observerName,
      mockDrillNo,
      drillType,
      otherDrillType: drillType === "Other" ? otherDrillType : "",
      alertMethods,
      otherAlertMethod: alertMethods.includes("Other") ? otherAlertMethod : "",
      weatherCondition,
      otherWeatherCondition:
        weatherCondition === "Other" ? otherWeatherCondition : "",
      timelineRows: timelineRows.map((row) => ({
        ...row,
        totalTimeTakenMinutes: minutesDiff(row.timeStart, row.timeEnd),
      })),
      totalTimeTakenMinutes: totalTimeTaken,
      drawbacks,
      otherDrawback: drawbacks.includes("Other") ? otherDrawback : "",
      preparednessRows,
      participationRows,
      recommendedMitigation,
      previousImplementedPoints,
      previousMockDrillNo,
      previousMockDrillDate,
      wwrRows,
      improvementRows,
      photoRows: photoRows.map((row) => ({
        description: row.description,
        fileName: row.fileName,
      })),
      status: "Open",
      remarks: "",
      createdAt: new Date().toISOString(),
    };

    console.log("Mock Drill Observation Report submitted:", payload);
    toast.success("Mock Drill Observation Report saved successfully");
    onSubmitSuccess?.(payload);
  };

  return (
    <div className="h-screen flex flex-col bg-slate-100 overflow-hidden">
      <div className="flex-1 min-h-0 flex relative overflow-hidden">
        <div
          className="flex-1 overflow-y-auto px-4 py-8"
          style={{
            flex: showPreview ? "0 0 55%" : "0 0 100%",
            transition: "flex 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          <div className="mx-auto max-w-7xl">
            <header className="mb-6">
              <h1 className="text-2xl font-bold text-slate-800 sm:text-3xl">
                Mock Drill Observation Report
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Record mock drill details, response timing, ERT readiness,
                drawbacks, photographs and action plans.
              </p>
            </header>

            <form onSubmit={handleSubmit} className="space-y-6">
              <section className={cardCls}>
                <div className={sectionHeaderCls}>General Details</div>

                <div className={sectionBodyCls}>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <label className={labelCls}>Project</label>
                      <select
                        className={inputCls}
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                      >
                        <option value="">Select project</option>
                        {projectOptions.map((project) => (
                          <option
                            key={
                              project.id || project.name || project.project_name
                            }
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
                      <label className={labelCls}>Mock Drill Date</label>
                      <input
                        type="date"
                        className={inputCls}
                        value={mockDrillDate}
                        onChange={(e) => setMockDrillDate(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className={labelCls}>Contractor</label>
                      <input
                        type="text"
                        className={inputCls}
                        value={contractor}
                        onChange={(e) => setContractor(e.target.value)}
                        placeholder="Enter contractor name"
                      />
                    </div>

                    <div>
                      <label className={labelCls}>Time</label>
                      <input
                        type="time"
                        className={inputCls}
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className={labelCls}>Name of the Observer</label>
                      <input
                        type="text"
                        className={inputCls}
                        value={observerName}
                        onChange={(e) => setObserverName(e.target.value)}
                        placeholder="Observer name"
                      />
                    </div>

                    <div>
                      <label className={labelCls}>Mock Drill No.</label>
                      <input
                        type="text"
                        className={inputCls}
                        value={mockDrillNo}
                        onChange={(e) => setMockDrillNo(e.target.value)}
                        placeholder="e.g. MD-2026-001"
                      />
                    </div>
                  </div>
                </div>
              </section>

              <section className={cardCls}>
                <div className={sectionHeaderCls}>Drill Type & Conditions</div>

                <div className={sectionBodyCls}>
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <div>
                      <label className={labelCls}>Type of Drill</label>
                      <select
                        className={inputCls}
                        value={drillType}
                        onChange={(e) => setDrillType(e.target.value)}
                      >
                        <option value="">Select drill type</option>
                        {DRILL_TYPES.map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </select>

                      {drillType === "Other" && (
                        <input
                          type="text"
                          className={`${inputCls} mt-2`}
                          value={otherDrillType}
                          onChange={(e) => setOtherDrillType(e.target.value)}
                          placeholder="Enter other drill type"
                        />
                      )}
                    </div>

                    <div>
                      <label className={labelCls}>Weather Conditions</label>
                      <select
                        className={inputCls}
                        value={weatherCondition}
                        onChange={(e) => setWeatherCondition(e.target.value)}
                      >
                        <option value="">Select weather condition</option>
                        {WEATHER_OPTIONS.map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </select>

                      {weatherCondition === "Other" && (
                        <input
                          type="text"
                          className={`${inputCls} mt-2`}
                          value={otherWeatherCondition}
                          onChange={(e) =>
                            setOtherWeatherCondition(e.target.value)
                          }
                          placeholder="Enter other weather condition"
                        />
                      )}
                    </div>

                    <div className="lg:col-span-2">
                      <label className={labelCls}>
                        Notification / Alert Method
                      </label>
                      <CheckboxGroup
                        options={ALERT_METHODS}
                        selected={alertMethods}
                        onChange={setAlertMethods}
                        columns="md:grid-cols-3"
                      />

                      {alertMethods.includes("Other") && (
                        <input
                          type="text"
                          className={`${inputCls} mt-2`}
                          value={otherAlertMethod}
                          onChange={(e) => setOtherAlertMethod(e.target.value)}
                          placeholder="Enter other alert method"
                        />
                      )}
                    </div>
                  </div>
                </div>
              </section>

              <section className={cardCls}>
                <div className={sectionHeaderCls}>Mock Drill Timeline</div>

                <div className={sectionBodyCls}>
                  <div className="overflow-x-auto rounded-md border border-slate-300">
                    <table className="w-full min-w-[850px] border-collapse text-sm">
                      <thead>
                        <tr>
                          <th className={thCls + " w-16"}>S. No.</th>
                          <th className={thCls}>Item Description</th>
                          <th className={thCls}>Time Start</th>
                          <th className={thCls}>Time End</th>
                          <th className={thCls}>Total Time Taken</th>
                          <th className={thCls + " w-20 text-center"}>
                            Action
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {timelineRows.map((row, index) => {
                          const total = minutesDiff(row.timeStart, row.timeEnd);

                          return (
                            <tr key={index}>
                              <td
                                className={
                                  tdCls + " text-center text-slate-600"
                                }
                              >
                                {index + 1}
                              </td>

                              <td className={tdCls}>
                                <input
                                  className={tableInputCls}
                                  value={row.itemDescription}
                                  onChange={(e) =>
                                    updateArrayRow(
                                      setTimelineRows,
                                      index,
                                      "itemDescription",
                                      e.target.value,
                                    )
                                  }
                                  placeholder="Enter activity / event"
                                />
                              </td>

                              <td className={tdCls}>
                                <input
                                  type="time"
                                  className={tableInputCls}
                                  value={row.timeStart}
                                  onChange={(e) =>
                                    updateArrayRow(
                                      setTimelineRows,
                                      index,
                                      "timeStart",
                                      e.target.value,
                                    )
                                  }
                                />
                              </td>

                              <td className={tdCls}>
                                <input
                                  type="time"
                                  className={tableInputCls}
                                  value={row.timeEnd}
                                  onChange={(e) =>
                                    updateArrayRow(
                                      setTimelineRows,
                                      index,
                                      "timeEnd",
                                      e.target.value,
                                    )
                                  }
                                />
                              </td>

                              <td className={tdCls}>
                                <input
                                  readOnly
                                  className={`${tableInputCls} bg-slate-50 font-semibold`}
                                  value={formatDuration(total)}
                                />
                              </td>

                              <td className={tdCls + " text-center"}>
                                <button
                                  type="button"
                                  disabled={timelineRows.length === 1}
                                  onClick={() =>
                                    removeArrayRow(setTimelineRows, index)
                                  }
                                  className={iconBtnCls}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setTimelineRows((prev) => [...prev, newTimelineRow()])
                      }
                      className={addBtnCls}
                    >
                      <Plus className="h-4 w-4" />
                      Add Row
                    </button>

                    <div className="rounded-md border border-slate-300 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-800">
                      Total Time: {formatDuration(totalTimeTaken)}
                    </div>
                  </div>

                  <div className="mt-6">
                    <label className={labelCls}>
                      Draw backs observed during the Mock-drill exercise
                    </label>

                    <CheckboxGroup
                      options={DRAWBACK_OPTIONS}
                      selected={drawbacks}
                      onChange={setDrawbacks}
                      columns="md:grid-cols-2"
                    />

                    {drawbacks.includes("Other") && (
                      <input
                        type="text"
                        className={`${inputCls} mt-2`}
                        value={otherDrawback}
                        onChange={(e) => setOtherDrawback(e.target.value)}
                        placeholder="Enter other drawback"
                      />
                    )}
                  </div>
                </div>
              </section>

              <section className={cardCls}>
                <div className={sectionHeaderCls}>
                  Comments on Overall Preparedness
                </div>

                <div className={sectionBodyCls}>
                  <div className="overflow-x-auto rounded-md border border-slate-300">
                    <table className="w-full min-w-[820px] border-collapse text-sm">
                      <thead>
                        <tr>
                          <th className={thCls + " w-16"}>S. No.</th>
                          <th className={thCls}>
                            Name of Emergency Response Team Member
                          </th>
                          <th className={thCls}>Role</th>
                          <th className={thCls}>Present / Absent</th>
                        </tr>
                      </thead>

                      <tbody>
                        {preparednessRows.map((row, index) => (
                          <tr key={index}>
                            <td
                              className={tdCls + " text-center text-slate-600"}
                            >
                              {index + 1}
                            </td>

                            <td className={tdCls}>
                              <input
                                className={tableInputCls}
                                value={row.memberName}
                                onChange={(e) =>
                                  updateArrayRow(
                                    setPreparednessRows,
                                    index,
                                    "memberName",
                                    e.target.value,
                                  )
                                }
                                placeholder="Member name"
                              />
                            </td>

                            <td className={tdCls}>
                              <input
                                className={tableInputCls}
                                value={row.role}
                                onChange={(e) =>
                                  updateArrayRow(
                                    setPreparednessRows,
                                    index,
                                    "role",
                                    e.target.value,
                                  )
                                }
                                placeholder="Role"
                              />
                            </td>

                            <td className={tdCls}>
                              <select
                                className={tableInputCls}
                                value={row.presentAbsent}
                                onChange={(e) =>
                                  updateArrayRow(
                                    setPreparednessRows,
                                    index,
                                    "presentAbsent",
                                    e.target.value,
                                  )
                                }
                              >
                                <option value="Present">Present</option>
                                <option value="Absent">Absent</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>

              <section className={cardCls}>
                <div className={sectionHeaderCls}>
                  Participation in Mock Drill
                </div>

                <div className={sectionBodyCls}>
                  <div className="overflow-x-auto rounded-md border border-slate-300">
                    <table className="w-full min-w-[850px] border-collapse text-sm">
                      <thead>
                        <tr>
                          <th className={thCls + " w-16"}>S. No.</th>
                          <th className={thCls}>Name of the Vendor</th>
                          <th className={thCls}>No. of participants</th>
                          <th className={thCls}>No. of missing personnel</th>
                          <th className={thCls + " w-20 text-center"}>
                            Action
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {participationRows.map((row, index) => (
                          <tr key={index}>
                            <td
                              className={tdCls + " text-center text-slate-600"}
                            >
                              {index + 1}
                            </td>

                            <td className={tdCls}>
                              <input
                                className={tableInputCls}
                                value={row.vendorName}
                                onChange={(e) =>
                                  updateArrayRow(
                                    setParticipationRows,
                                    index,
                                    "vendorName",
                                    e.target.value,
                                  )
                                }
                                placeholder="Vendor name"
                              />
                            </td>

                            <td className={tdCls}>
                              <input
                                type="number"
                                min="0"
                                className={tableInputCls}
                                value={row.participants}
                                onChange={(e) =>
                                  updateArrayRow(
                                    setParticipationRows,
                                    index,
                                    "participants",
                                    e.target.value,
                                  )
                                }
                                placeholder="0"
                              />
                            </td>

                            <td className={tdCls}>
                              <input
                                type="number"
                                min="0"
                                className={tableInputCls}
                                value={row.missingPersonnel}
                                onChange={(e) =>
                                  updateArrayRow(
                                    setParticipationRows,
                                    index,
                                    "missingPersonnel",
                                    e.target.value,
                                  )
                                }
                                placeholder="0"
                              />
                            </td>

                            <td className={tdCls + " text-center"}>
                              <button
                                type="button"
                                disabled={participationRows.length === 1}
                                onClick={() =>
                                  removeArrayRow(setParticipationRows, index)
                                }
                                className={iconBtnCls}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={() =>
                        setParticipationRows((prev) => [
                          ...prev,
                          newParticipationRow(),
                        ])
                      }
                      className={addBtnCls}
                    >
                      <Plus className="h-4 w-4" />
                      Add Row
                    </button>
                  </div>
                </div>
              </section>

              <section className={cardCls}>
                <div className={sectionHeaderCls}>Recommendations</div>

                <div className={sectionBodyCls}>
                  <div className="space-y-5">
                    <div>
                      <label className={labelCls}>
                        Recommended point to mitigate the drawbacks during the
                        next drill
                      </label>
                      <BulletTextarea
                        value={recommendedMitigation}
                        onChange={setRecommendedMitigation}
                        rows={7}
                        className={`${inputCls} min-h-[160px] resize-y leading-relaxed`}
                        placeholder="• Enter recommendation point 1&#10;• Enter recommendation point 2"
                      />
                    </div>

                    <div>
                      <label className={labelCls}>
                        Recommended points from the previous observer report
                        implemented during this current drill
                      </label>
                      <BulletTextarea
                        value={previousImplementedPoints}
                        onChange={setPreviousImplementedPoints}
                        rows={7}
                        className={`${inputCls} min-h-[160px] resize-y leading-relaxed`}
                        placeholder="• Enter previous implemented point 1&#10;• Enter previous implemented point 2"
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label className={labelCls}>
                          Previous Mock Drill No.
                        </label>
                        <input
                          className={inputCls}
                          value={previousMockDrillNo}
                          onChange={(e) =>
                            setPreviousMockDrillNo(e.target.value)
                          }
                          placeholder="Previous drill number"
                        />
                      </div>

                      <div>
                        <label className={labelCls}>
                          Previous Mock Drill Date
                        </label>
                        <input
                          type="date"
                          className={inputCls}
                          value={previousMockDrillDate}
                          onChange={(e) =>
                            setPreviousMockDrillDate(e.target.value)
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section className={cardCls}>
                <div className={sectionHeaderCls}>WWR and WWW</div>

                <div className={sectionBodyCls}>
                  <div className="overflow-x-auto rounded-md border border-slate-300">
                    <table className="w-full min-w-[850px] border-collapse text-sm">
                      <thead>
                        <tr>
                          <th className={thCls + " w-16"}>SI.</th>
                          <th className={thCls}>What Went Right</th>
                          <th className={thCls}>What Went Wrong</th>
                          <th className={thCls + " w-20 text-center"}>
                            Action
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {wwrRows.map((row, index) => (
                          <tr key={index}>
                            <td
                              className={tdCls + " text-center text-slate-600"}
                            >
                              {index + 1}
                            </td>

                            <td className={tdCls}>
                              <textarea
                                className={`${tableInputCls} min-h-[70px] resize-y`}
                                value={row.whatWentRight}
                                onChange={(e) =>
                                  updateArrayRow(
                                    setWwrRows,
                                    index,
                                    "whatWentRight",
                                    e.target.value,
                                  )
                                }
                              />
                            </td>

                            <td className={tdCls}>
                              <textarea
                                className={`${tableInputCls} min-h-[70px] resize-y`}
                                value={row.whatWentWrong}
                                onChange={(e) =>
                                  updateArrayRow(
                                    setWwrRows,
                                    index,
                                    "whatWentWrong",
                                    e.target.value,
                                  )
                                }
                              />
                            </td>

                            <td className={tdCls + " text-center"}>
                              <button
                                type="button"
                                disabled={wwrRows.length === 1}
                                onClick={() =>
                                  removeArrayRow(setWwrRows, index)
                                }
                                className={iconBtnCls}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={() =>
                        setWwrRows((prev) => [...prev, newWwrRow()])
                      }
                      className={addBtnCls}
                    >
                      <Plus className="h-4 w-4" />
                      Add Row
                    </button>
                  </div>
                </div>
              </section>

              <section className={cardCls}>
                <div className={sectionHeaderCls}>Areas of Improvement</div>

                <div className={sectionBodyCls}>
                  <div className="overflow-x-auto rounded-md border border-slate-300">
                    <table className="w-full min-w-[900px] border-collapse text-sm">
                      <thead>
                        <tr>
                          <th className={thCls + " w-16"}>SI.</th>
                          <th className={thCls}>Area of Improvement</th>
                          <th className={thCls}>Action Plan</th>
                          <th className={thCls}>Date</th>
                          <th className={thCls + " w-20 text-center"}>
                            Action
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {improvementRows.map((row, index) => (
                          <tr key={index}>
                            <td
                              className={tdCls + " text-center text-slate-600"}
                            >
                              {index + 1}
                            </td>

                            <td className={tdCls}>
                              <input
                                className={tableInputCls}
                                value={row.areaOfImprovement}
                                onChange={(e) =>
                                  updateArrayRow(
                                    setImprovementRows,
                                    index,
                                    "areaOfImprovement",
                                    e.target.value,
                                  )
                                }
                              />
                            </td>

                            <td className={tdCls}>
                              <textarea
                                className={`${tableInputCls} min-h-[70px] resize-y`}
                                value={row.actionPlan}
                                onChange={(e) =>
                                  updateArrayRow(
                                    setImprovementRows,
                                    index,
                                    "actionPlan",
                                    e.target.value,
                                  )
                                }
                              />
                            </td>

                            <td className={tdCls}>
                              <input
                                type="date"
                                className={tableInputCls}
                                value={row.actionDate}
                                onChange={(e) =>
                                  updateArrayRow(
                                    setImprovementRows,
                                    index,
                                    "actionDate",
                                    e.target.value,
                                  )
                                }
                              />
                            </td>

                            <td className={tdCls + " text-center"}>
                              <button
                                type="button"
                                disabled={improvementRows.length === 1}
                                onClick={() =>
                                  removeArrayRow(setImprovementRows, index)
                                }
                                className={iconBtnCls}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={() =>
                        setImprovementRows((prev) => [
                          ...prev,
                          newImprovementRow(),
                        ])
                      }
                      className={addBtnCls}
                    >
                      <Plus className="h-4 w-4" />
                      Add Row
                    </button>
                  </div>
                </div>
              </section>

              <section className={cardCls}>
                <div className={sectionHeaderCls}>Photographs</div>

                <div className={sectionBodyCls}>
                  <div className="overflow-x-auto rounded-md border border-slate-300">
                    <table className="w-full min-w-[800px] border-collapse text-sm">
                      <thead>
                        <tr>
                          <th className={thCls + " w-16"}>Sr. No.</th>
                          <th className={thCls}>Description</th>
                          <th className={thCls}>Upload</th>
                          <th className={thCls + " w-20 text-center"}>
                            Action
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {photoRows.map((row, index) => (
                          <tr key={index}>
                            <td
                              className={tdCls + " text-center text-slate-600"}
                            >
                              {index + 1}
                            </td>

                            <td className={tdCls}>
                              <input
                                className={tableInputCls}
                                value={row.description}
                                onChange={(e) =>
                                  updateArrayRow(
                                    setPhotoRows,
                                    index,
                                    "description",
                                    e.target.value,
                                  )
                                }
                                placeholder="Photo description"
                              />
                            </td>

                            <td className={tdCls}>
                              <FileUploadControl
                                files={row.file ? [row.file] : []}
                                accept=".jpg,.jpeg,.png,.pdf"
                                onFilesChange={(files) => {
                                  const file = files[0] || null;
                                  updateArrayRow(
                                    setPhotoRows,
                                    index,
                                    "file",
                                    file,
                                  );
                                  updateArrayRow(
                                    setPhotoRows,
                                    index,
                                    "fileName",
                                    file?.name || "",
                                  );
                                }}
                              />
                            </td>

                            <td className={tdCls + " text-center"}>
                              <button
                                type="button"
                                disabled={photoRows.length === 1}
                                onClick={() =>
                                  removeArrayRow(setPhotoRows, index)
                                }
                                className={iconBtnCls}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={() =>
                        setPhotoRows((prev) => [...prev, newPhotoRow()])
                      }
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
                  onClick={handleReset}
                  className="rounded-md border border-slate-300 bg-white px-5 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                >
                  Reset
                </button>

                <button
                  type="submit"
                  className="rounded-md bg-orange-500 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400"
                >
                  Submit Mock Drill Report
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Toggle button */}
        <button
          type="button"
          onClick={() => setShowPreview((v) => !v)}
          className="absolute z-30 top-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-14 rounded-l-lg bg-[#F48222] text-white shadow-lg hover:opacity-90 transition-all print:hidden"
          style={{
            right: showPreview ? "45%" : 0,
            transition: "right 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
          title={showPreview ? "Close Preview" : "Live Preview"}
        >
          {showPreview ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>

        {/* Preview panel */}
        <div
          className="h-full border-l border-slate-300 bg-white"
          style={{
            flex: showPreview ? "0 0 45%" : "0 0 0%",
            opacity: showPreview ? 1 : 0,
            overflow: "hidden",
            transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          {showPreview && (
            <MockDrillObservationReportPreview
              formData={{
                projectName,
                mockDrillDate,
                contractor,
                time,
                observerName,
                mockDrillNo,
                drillType,
                otherDrillType,
                alertMethods,
                otherAlertMethod,
                weatherCondition,
                otherWeatherCondition,
                timelineRows,
                totalTimeTakenMinutes: totalTimeTaken,
                drawbacks,
                otherDrawback,
                preparednessRows,
                participationRows,
                recommendedMitigation,
                previousImplementedPoints,
                previousMockDrillNo,
                previousMockDrillDate,
                wwrRows,
                improvementRows,
                photoRows,
              }}
              variant="embedded"
              onClose={() => setShowPreview(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
