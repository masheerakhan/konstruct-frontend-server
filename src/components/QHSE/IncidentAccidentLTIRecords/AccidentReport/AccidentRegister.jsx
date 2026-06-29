import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Plus, Trash2, ClipboardList, Save } from "lucide-react";
import { formatInputDate } from "../../../../utils/dateFormatter";

const TYPE_OPTIONS = ["Incident", "Accident", "Near Miss"];
const SEVERITY_OPTIONS = [
  "First Aid",
  "Medical",
  "Lost Time Injury",
  "Near Miss",
  "Report Only",
];
const ACTION_OPTIONS = [
  "Return To Work",
  "Doctor",
  "Hospital",
  "Sent Home",
  "Report Only",
];
const STATUS_OPTIONS = ["Open", "In Progress", "Complete", "Closed"];
const PROJECT_OPTIONS = [
  "Project Alpha - Mumbai",
  "Project Beta - Delhi",
  "Project Gamma - Bangalore",
  "Project Delta - Pune",
];

const todayISO = () => formatInputDate(new Date());

const emptyRow = (sr) => ({
  id: crypto.randomUUID(),
  incidentNo: sr,
  dateReported: todayISO(),
  timeReported: "",
  location: "",
  type: "",
  description: "",
  severity: "",
  actionTaken: "",
  loss: "",
  status: "Open",
  completedOn: "",
  reportBy: "",
  responsible: "",
});

const inputCls =
  "w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition";

const labelCls = "block text-sm font-medium text-foreground mb-1.5";

const SectionTitle = ({ icon: Icon = null, title, subtitle = null }) => (
  <div className="bg-blue-600 text-white px-5 py-3 rounded-t-lg flex items-center gap-2">
    {Icon && <Icon className="w-5 h-5" />}
    <div>
      <h2 className="text-base font-semibold leading-tight">{title}</h2>
      {subtitle && <p className="text-xs text-blue-100">{subtitle}</p>}
    </div>
  </div>
);

const Card = ({ children }) => (
  <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
    {children}
  </div>
);

export default function AccidentRegister() {
  const [project, setProject] = useState("");
  const [date, setDate] = useState(todayISO());
  const [rows, setRows] = useState([emptyRow(1)]);

  const addRow = () => setRows((r) => [...r, emptyRow(r.length + 1)]);

  const removeRow = (id) =>
    setRows((r) =>
      r.filter((x) => x.id !== id).map((x, i) => ({ ...x, incidentNo: i + 1 })),
    );

  const updateRow = (id, field, value) =>
    setRows((r) => r.map((x) => (x.id === id ? { ...x, [field]: value } : x)));

  const totals = useMemo(() => {
    const t = {
      Incident: 0,
      Accident: 0,
      "Near Miss": 0,
      Complete: 0,
      Open: 0,
    };
    rows.forEach((r) => {
      if (r.type && t[r.type] !== undefined) t[r.type]++;
      if (r.status === "Complete") t.Complete++;
      else if (r.status === "Open") t.Open++;
    });
    return t;
  }, [rows]);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Accident Register Submitted:", { project, date, rows });
    toast.success("Accident Register saved successfully");
  };

  return (
    <div className="min-h-screen bg-muted/30 py-6 px-4 md:px-8">
      <div className="max-w-[1400px] mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Incident & Accident Register
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Log and track all site incidents, accidents and near misses.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Header card */}
          <Card>
            <SectionTitle
              icon={ClipboardList}
              title="Register Details"
              subtitle="General information for this register"
            />
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Project</label>
                <select
                  className={inputCls}
                  value={project}
                  onChange={(e) => setProject(e.target.value)}
                  required
                >
                  <option value="">Select project</option>
                  {PROJECT_OPTIONS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
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
            </div>
          </Card>

          {/* Register table card */}
          <Card>
            <SectionTitle
              icon={ClipboardList}
              title="Incident / Accident Log"
              subtitle="Add a row for each reported event"
            />
            <div className="p-5">
              <div className="overflow-x-auto rounded-md border border-border">
                <table className="min-w-[1600px] w-full text-sm">
                  <thead className="bg-muted/60 text-foreground">
                    <tr>
                      {[
                        "Incident #",
                        "Date Reported",
                        "Time",
                        "Location",
                        "Type",
                        "Brief Description",
                        "First Aid / Medical / LTI / Near Miss / Report Only",
                        "Return To Work / Doctor / Hospital / Sent Home / Report Only",
                        "Loss of Property / Life",
                        "Status",
                        "Completed On",
                        "Report By",
                        "Responsible Person / Supervisor",
                        "",
                      ].map((h) => (
                        <th
                          key={h}
                          className="text-left font-semibold px-3 py-2 border-b border-border whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr
                        key={row.id}
                        className="border-b border-border last:border-0 hover:bg-muted/30"
                      >
                        <td className="px-3 py-2 font-medium">
                          {row.incidentNo}
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="date"
                            className={inputCls}
                            value={row.dateReported}
                            onChange={(e) =>
                              updateRow(row.id, "dateReported", e.target.value)
                            }
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="time"
                            className={inputCls}
                            value={row.timeReported}
                            onChange={(e) =>
                              updateRow(row.id, "timeReported", e.target.value)
                            }
                          />
                        </td>
                        <td className="px-3 py-2 min-w-[140px]">
                          <input
                            type="text"
                            className={inputCls}
                            placeholder="e.g. A-Block"
                            value={row.location}
                            onChange={(e) =>
                              updateRow(row.id, "location", e.target.value)
                            }
                          />
                        </td>
                        <td className="px-3 py-2 min-w-[130px]">
                          <select
                            className={inputCls}
                            value={row.type}
                            onChange={(e) =>
                              updateRow(row.id, "type", e.target.value)
                            }
                          >
                            <option value="">Select</option>
                            {TYPE_OPTIONS.map((o) => (
                              <option key={o} value={o}>
                                {o}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2 min-w-[220px]">
                          <textarea
                            rows={2}
                            className={inputCls}
                            placeholder="Brief description"
                            value={row.description}
                            onChange={(e) =>
                              updateRow(row.id, "description", e.target.value)
                            }
                          />
                        </td>
                        <td className="px-3 py-2 min-w-[170px]">
                          <select
                            className={inputCls}
                            value={row.severity}
                            onChange={(e) =>
                              updateRow(row.id, "severity", e.target.value)
                            }
                          >
                            <option value="">Select</option>
                            {SEVERITY_OPTIONS.map((o) => (
                              <option key={o} value={o}>
                                {o}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2 min-w-[170px]">
                          <select
                            className={inputCls}
                            value={row.actionTaken}
                            onChange={(e) =>
                              updateRow(row.id, "actionTaken", e.target.value)
                            }
                          >
                            <option value="">Select</option>
                            {ACTION_OPTIONS.map((o) => (
                              <option key={o} value={o}>
                                {o}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2 min-w-[160px]">
                          <input
                            type="text"
                            className={inputCls}
                            placeholder="None / details"
                            value={row.loss}
                            onChange={(e) =>
                              updateRow(row.id, "loss", e.target.value)
                            }
                          />
                        </td>
                        <td className="px-3 py-2 min-w-[130px]">
                          <select
                            className={inputCls}
                            value={row.status}
                            onChange={(e) =>
                              updateRow(row.id, "status", e.target.value)
                            }
                          >
                            {STATUS_OPTIONS.map((o) => (
                              <option key={o} value={o}>
                                {o}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="date"
                            className={inputCls}
                            value={row.completedOn}
                            onChange={(e) =>
                              updateRow(row.id, "completedOn", e.target.value)
                            }
                          />
                        </td>
                        <td className="px-3 py-2 min-w-[140px]">
                          <input
                            type="text"
                            className={inputCls}
                            placeholder="Name"
                            value={row.reportBy}
                            onChange={(e) =>
                              updateRow(row.id, "reportBy", e.target.value)
                            }
                          />
                        </td>
                        <td className="px-3 py-2 min-w-[160px]">
                          <input
                            type="text"
                            className={inputCls}
                            placeholder="Supervisor / Incharge"
                            value={row.responsible}
                            onChange={(e) =>
                              updateRow(row.id, "responsible", e.target.value)
                            }
                          />
                        </td>
                        <td className="px-3 py-2">
                          <button
                            type="button"
                            onClick={() => removeRow(row.id)}
                            disabled={rows.length === 1}
                            className="p-1.5 rounded-md text-destructive hover:bg-destructive/10 disabled:opacity-40 disabled:cursor-not-allowed transition"
                            aria-label="Remove row"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button
                type="button"
                onClick={addRow}
                className="mt-4 inline-flex items-center gap-2 px-3 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition"
              >
                <Plus className="w-4 h-4" /> Add Row
              </button>
            </div>
          </Card>

          {/* Summary */}
          <Card>
            <SectionTitle title="Summary" />
            <div className="p-5 grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { label: "Total Entries", value: rows.length },
                { label: "Incidents", value: totals.Incident },
                { label: "Accidents", value: totals.Accident },
                { label: "Near Misses", value: totals["Near Miss"] },
                { label: "Completed", value: totals.Complete },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-md border border-border bg-muted/30 p-4 text-center"
                >
                  <div className="text-2xl font-bold text-blue-600">
                    {s.value}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <div className="flex justify-end gap-3 pb-6">
            <button
              type="reset"
              onClick={() => {
                setRows([emptyRow(1)]);
                setProject("");
                setDate(todayISO());
              }}
              className="px-4 py-2 rounded-md border border-input bg-background text-foreground text-sm font-medium hover:bg-muted transition"
            >
              Reset
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2 rounded-md bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition"
            >
              <Save className="w-4 h-4" /> Save Register
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
