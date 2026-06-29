import { useState } from "react";
import toast from "react-hot-toast";
import { Plus, Trash2, FileText } from "lucide-react";
import { formatInputDate } from "../../../../utils/dateFormatter";

const ACCIDENT_CATEGORIES = [
  "Slip, Trip, or Fall",
  "Equipment or Machinery related",
  "Vehicle or Transportation related",
  "Struck by Object",
  "Caught in/between Objects",
  "Electrical Incident",
];

const CONTRIBUTING_FACTORS = [
  "Unsafe Work Practices",
  "Lack of Training",
  "Equipment Failure",
  "Environmental Conditions",
  "Communication breakdown",
];

const PROJECT_OPTIONS = [
  "Horizon Industrial Park - Phase 1",
  "Horizon Industrial Park - Phase 2",
  "Horizon Logistics Hub - Bhiwandi",
  "Horizon Warehouse - Farukhnagar",
];

const SectionCard = ({ title, children }) => (
  <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
    <div className="bg-blue-600 px-4 py-2.5">
      <h2 className="text-sm font-semibold tracking-wide text-white uppercase">
        {title}
      </h2>
    </div>
    <div className="p-4 md:p-6">{children}</div>
  </div>
);

const Field = ({ label, required, children, className = "" }) => (
  <div className={`flex flex-col gap-1.5 ${className}`}>
    <label className="text-sm font-medium text-foreground">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
  </div>
);

const inputCls =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";
const textareaCls =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-y min-h-[90px]";

export default function AccidentReport() {
  const today = formatInputDate(new Date());

  const [form, setForm] = useState({
    reportNo: "",
    contractor: "",
    project: "",
    location: "",
    accidentDate: today,
    accidentTime: "",
    accidentLocation: "",
    accidentDescription: "",
    witnesses: "",
    categories: [],
    categoryOther: "",
    howOccurred: "",
    immediateActions: "",
    factors: [],
    factorOther: "",
    investigationRequired: "no",
    investigationBy: "",
    investigationDetails: "",
    preventiveMeasures: "",
    additionalComments: "",
    reporterName: "",
    reporterTitle: "",
    reporterContact: "",
  });

  const [persons, setPersons] = useState([
    { name: "", jobTitle: "", injuries: "" },
  ]);

  const update = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const toggleArr = (key, value) =>
    setForm((p) => ({
      ...p,
      [key]: p[key].includes(value)
        ? p[key].filter((v) => v !== value)
        : [...p[key], value],
    }));

  const addPerson = () =>
    setPersons((p) => [...p, { name: "", jobTitle: "", injuries: "" }]);
  const removePerson = (i) =>
    setPersons((p) => (p.length > 1 ? p.filter((_, idx) => idx !== i) : p));
  const updatePerson = (i, k, v) =>
    setPersons((p) =>
      p.map((row, idx) => (idx === i ? { ...row, [k]: v } : row)),
    );

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { ...form, persons };
    console.log("Accident Report submitted:", payload);
    toast.success("Accident Report submitted successfully");
  };

  return (
    <div className="min-h-screen bg-muted/30 py-6 px-3 md:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-600 text-white">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground">
              Accident Report Form
            </h1>
            <p className="text-xs text-muted-foreground">
              HIPPL/QHSE/IMS/FMT/135, Rev:5
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Section 1: General Info */}
          <SectionCard title="General Information">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Field label="Accident Report No." required>
                <input
                  className={inputCls}
                  value={form.reportNo}
                  onChange={(e) => update("reportNo", e.target.value)}
                  placeholder="e.g. AR-2026-001"
                />
              </Field>
              <Field label="Contractor" required>
                <input
                  className={inputCls}
                  value={form.contractor}
                  onChange={(e) => update("contractor", e.target.value)}
                  placeholder="Contractor name"
                />
              </Field>
              <Field label="Project" required>
                <select
                  className={inputCls}
                  value={form.project}
                  onChange={(e) => update("project", e.target.value)}
                >
                  <option value="">Select project</option>
                  {PROJECT_OPTIONS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Location" className="md:col-span-2 lg:col-span-3">
                <input
                  className={inputCls}
                  value={form.location}
                  onChange={(e) => update("location", e.target.value)}
                  placeholder="Site / city"
                />
              </Field>
            </div>
          </SectionCard>

          {/* Section 2: Accident Details */}
          <SectionCard title="Accident Details">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Date of Accident" required>
                <input
                  type="date"
                  className={inputCls}
                  value={form.accidentDate}
                  onChange={(e) => update("accidentDate", e.target.value)}
                />
              </Field>
              <Field label="Time of Accident" required>
                <input
                  type="time"
                  className={inputCls}
                  value={form.accidentTime}
                  onChange={(e) => update("accidentTime", e.target.value)}
                />
              </Field>
              <Field label="Location of the Accident" className="md:col-span-2">
                <input
                  className={inputCls}
                  value={form.accidentLocation}
                  onChange={(e) => update("accidentLocation", e.target.value)}
                  placeholder="Exact area / building / zone"
                />
              </Field>
              <Field label="Describe the Accident" className="md:col-span-2">
                <textarea
                  className={textareaCls}
                  value={form.accidentDescription}
                  onChange={(e) =>
                    update("accidentDescription", e.target.value)
                  }
                  placeholder="Brief description"
                />
              </Field>
              <Field
                label="Details of the witnesses (if any)"
                className="md:col-span-2"
              >
                <textarea
                  className={textareaCls}
                  value={form.witnesses}
                  onChange={(e) => update("witnesses", e.target.value)}
                  placeholder="Names, contact, role"
                />
              </Field>
            </div>
          </SectionCard>

          {/* Section 3: Persons Involved */}
          <SectionCard title="Person(s) Involved">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-muted/60">
                    <th className="border border-border px-2 py-2 text-left w-12">
                      #
                    </th>
                    <th className="border border-border px-2 py-2 text-left">
                      Name
                    </th>
                    <th className="border border-border px-2 py-2 text-left">
                      Job Title
                    </th>
                    <th className="border border-border px-2 py-2 text-left">
                      Nature & Extent of Injuries
                    </th>
                    <th className="border border-border px-2 py-2 w-16">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {persons.map((row, i) => (
                    <tr key={i}>
                      <td className="border border-border px-2 py-1 text-center">
                        {i + 1}
                      </td>
                      <td className="border border-border px-1 py-1">
                        <input
                          className={inputCls}
                          value={row.name}
                          onChange={(e) =>
                            updatePerson(i, "name", e.target.value)
                          }
                        />
                      </td>
                      <td className="border border-border px-1 py-1">
                        <input
                          className={inputCls}
                          value={row.jobTitle}
                          onChange={(e) =>
                            updatePerson(i, "jobTitle", e.target.value)
                          }
                        />
                      </td>
                      <td className="border border-border px-1 py-1">
                        <input
                          className={inputCls}
                          value={row.injuries}
                          onChange={(e) =>
                            updatePerson(i, "injuries", e.target.value)
                          }
                        />
                      </td>
                      <td className="border border-border px-1 py-1 text-center">
                        <button
                          type="button"
                          onClick={() => removePerson(i)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-red-600 hover:bg-red-50"
                          aria-label="Remove"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              type="button"
              onClick={addPerson}
              className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" /> Add Person
            </button>
          </SectionCard>

          {/* Section 4: Accident Category */}
          <SectionCard title="Accident Category">
            <p className="text-sm text-muted-foreground mb-3">
              Select the appropriate category for the accident:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {ACCIDENT_CATEGORIES.map((c) => (
                <label
                  key={c}
                  className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm cursor-pointer hover:bg-muted/50"
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-blue-600"
                    checked={form.categories.includes(c)}
                    onChange={() => toggleArr("categories", c)}
                  />
                  {c}
                </label>
              ))}
            </div>
            <div className="mt-3">
              <Field label="Other (specify)">
                <input
                  className={inputCls}
                  value={form.categoryOther}
                  onChange={(e) => update("categoryOther", e.target.value)}
                  placeholder="Other category..."
                />
              </Field>
            </div>
          </SectionCard>

          {/* Section 5: Accident Description */}
          <SectionCard title="Accident Description">
            <Field label="Provide a detailed description of how the accident occurred">
              <textarea
                className={textareaCls + " min-h-[120px]"}
                value={form.howOccurred}
                onChange={(e) => update("howOccurred", e.target.value)}
                placeholder="Detailed narrative..."
              />
            </Field>
          </SectionCard>

          {/* Section 6: Immediate Actions */}
          <SectionCard title="Immediate Actions Taken">
            <Field label="Describe the immediate actions taken to address the accident and provide assistance">
              <textarea
                className={textareaCls}
                value={form.immediateActions}
                onChange={(e) => update("immediateActions", e.target.value)}
              />
            </Field>
          </SectionCard>

          {/* Section 7: Contributing Factors */}
          <SectionCard title="Contributing Factors">
            <p className="text-sm text-muted-foreground mb-3">
              Were there any contributing factors to the accident? If yes,
              select the relevant factors:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {CONTRIBUTING_FACTORS.map((c) => (
                <label
                  key={c}
                  className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm cursor-pointer hover:bg-muted/50"
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-blue-600"
                    checked={form.factors.includes(c)}
                    onChange={() => toggleArr("factors", c)}
                  />
                  {c}
                </label>
              ))}
            </div>
            <div className="mt-3">
              <Field label="Other (specify)">
                <input
                  className={inputCls}
                  value={form.factorOther}
                  onChange={(e) => update("factorOther", e.target.value)}
                  placeholder="Other factor..."
                />
              </Field>
            </div>
          </SectionCard>

          {/* Section 8: Investigation */}
          <SectionCard title="Investigation">
            <div className="grid grid-cols-1 gap-4">
              <Field label="Will further investigation be conducted?">
                <div className="flex gap-4">
                  {["yes", "no"].map((v) => (
                    <label key={v} className="flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name="investigationRequired"
                        className="h-4 w-4 accent-blue-600"
                        checked={form.investigationRequired === v}
                        onChange={() => update("investigationRequired", v)}
                      />
                      {v.toUpperCase()}
                    </label>
                  ))}
                </div>
              </Field>
              {form.investigationRequired === "yes" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Person(s) responsible for the investigation">
                    <input
                      className={inputCls}
                      value={form.investigationBy}
                      onChange={(e) =>
                        update("investigationBy", e.target.value)
                      }
                    />
                  </Field>
                  <Field label="Additional details / instructions">
                    <input
                      className={inputCls}
                      value={form.investigationDetails}
                      onChange={(e) =>
                        update("investigationDetails", e.target.value)
                      }
                    />
                  </Field>
                </div>
              )}
            </div>
          </SectionCard>

          {/* Section 9: Preventive Measures */}
          <SectionCard title="Preventive Measures">
            <Field label="What preventive measures can be implemented to avoid similar accidents in the future?">
              <textarea
                className={textareaCls}
                value={form.preventiveMeasures}
                onChange={(e) => update("preventiveMeasures", e.target.value)}
              />
            </Field>
          </SectionCard>

          {/* Section 10: Additional Comments */}
          <SectionCard title="Additional Comments">
            <Field label="Is there any additional information or comments you would like to include?">
              <textarea
                className={textareaCls}
                value={form.additionalComments}
                onChange={(e) => update("additionalComments", e.target.value)}
              />
            </Field>
          </SectionCard>

          {/* Section 11: Report By */}
          <SectionCard title="Report By">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Name" required>
                <input
                  className={inputCls}
                  value={form.reporterName}
                  onChange={(e) => update("reporterName", e.target.value)}
                />
              </Field>
              <Field label="Job Title / Role" required>
                <input
                  className={inputCls}
                  value={form.reporterTitle}
                  onChange={(e) => update("reporterTitle", e.target.value)}
                />
              </Field>
              <Field label="Contact Details" required>
                <input
                  className={inputCls}
                  value={form.reporterContact}
                  onChange={(e) => update("reporterContact", e.target.value)}
                  placeholder="Phone / Email"
                />
              </Field>
            </div>
          </SectionCard>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
            <button
              type="reset"
              onClick={() => window.location.reload()}
              className="h-10 px-5 rounded-md border border-border bg-background text-sm font-medium hover:bg-muted"
            >
              Reset
            </button>
            <button
              type="submit"
              className="h-10 px-6 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
            >
              Submit Report
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
