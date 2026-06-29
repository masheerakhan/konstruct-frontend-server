import { useState } from "react";
import toast from "react-hot-toast";
import { Plus, Trash2, FileText, AlertTriangle } from "lucide-react";
import { formatInputDate } from "../../../../utils/dateFormatter";
import FileUploadControl from "../../../FileUploadControl";
import IncidentInvestigationForm from "./IncidentInvestigationForm";

const INCIDENT_TYPES = [
  "Near - Miss", "Injury/Illness", "Property Damage", "Vehicle/Traffic",
  "Fire/Explosion", "Spill/Leak/Release", "Environmental", "Unsafe Act",
  "Unsafe Condition", "Security Breaches/Theft/Third Party", "Thread or Act of Violance", "Other"
];

const ACTUAL_SEVERITIES = [
  "No Injury", "First - Aid", "Medical Treatment (MTC/MTI)",
  "Restricted Wok( RWC)", "Loss Time Injury (LTI)", "Property Damage Only",
  "Environmental Impact", "Other"
];

const POTENTIAL_SEVERITIES = [
  "Low", "Medium", "High", "Very High / Catastrophic"
];

const NATURE_OF_INJURY = [
  "Cut", "Burn", "Sprain/Strain", "Fracture", "Bruise", "Eye Injury", "Respiratory", "Other"
];

const TREATMENTS = [
  "First - Aid", "Clinic", "Hospital", "Other"
];

const DAMAGE_TYPES = [
  "Property/Asset", "Equipment", "Vehicle", "Environmental", "Other"
];

const EVIDENCE_TYPES = [
  "Photos", "CCTV", "Permit to work", "JSA/HIRA", "Method Statement",
  "TBT/PEP Talk Records", "Maintenance Records", "Training Records", "Other"
];

// Modern UI Components
const SectionCard = ({ title, children }) => (
  <div className="rounded-xl border border-blue-100 bg-white shadow-sm overflow-hidden mb-6">
    <div className="border-b border-blue-50 bg-blue-50/30 px-5 py-3.5">
      <h3 className="font-semibold text-slate-800">{title}</h3>
    </div>
    <div className="p-5 space-y-5">
      {children}
    </div>
  </div>
);

const Field = ({ label, children, className = "" }) => (
  <div className={`flex flex-col ${className}`}>
    <label className="text-xs font-semibold text-slate-600 mb-1.5 block">{label}</label>
    {children}
  </div>
);

const CheckboxGroup = ({ options, selected, onChange, otherLabel = "Other" }) => (
  <div className="flex flex-wrap gap-x-6 gap-y-3">
    {options.map((opt) => {
      const isOther = opt === "Other";
      return (
        <label key={opt} className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
          <input
            type="checkbox"
            className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary/20 accent-primary"
            checked={selected.includes(opt)}
            onChange={(e) => {
              if (e.target.checked) onChange([...selected, opt]);
              else onChange(selected.filter((item) => item !== opt));
            }}
          />
          {isOther ? otherLabel : opt}
        </label>
      );
    })}
  </div>
);

const RadioGroup = ({ name, options, value, onChange }) => (
  <div className="flex flex-wrap gap-x-6 gap-y-3">
    {options.map(opt => (
      <label key={opt} className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
        <input 
          type="radio" 
          name={name} 
          value={opt} 
          checked={value === opt} 
          onChange={(e) => onChange(e.target.value)} 
          className="w-4 h-4 border-slate-300 text-primary focus:ring-primary/20 accent-primary" 
        /> 
        {opt}
      </label>
    ))}
  </div>
);

const inputCls = "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition placeholder:text-slate-400";
const textareaCls = "w-full rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-800 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition min-h-[100px] resize-y placeholder:text-slate-400";
const selectCls = "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition";

export default function IncidentReport({ onSubmitSuccess }) {
  const [showForm2, setShowForm2] = useState(false);
  const today = formatInputDate(new Date());

  const [form, setForm] = useState({
    projectSite: "", contractorName: "", reportedBy: "", empId: "",
    reportNo: "", dateReported: "", companyDept: "", contactNo: "",
    incidentType: "", incidentTypeOther: "", actualSeverity: "", actualSeverityOther: "",
    potentialSeverity: "", clientReportable: "", legalReportable: "", insuranceReportable: "",
    investigationRequired: "", investigationRefNo: "",
    incidentDate: today, incidentTime: "", exactLocation: "", activityAtTime: "",
    weatherLighting: "", supervisorIncharge: "",
    briefDescription: "", immediateActions: "",
    natureOfInjury: "", natureOfInjuryOther: "", bodyPartAffected: "",
    treatment: "", treatmentOther: "", ppeWorn: "", ppeWornSpecify: "",
    typeOfDamage: "", typeOfDamageOther: "", descriptionOfDamage: "",
    estimatedCost: "", spillDetails: "",
  });

  const [people, setPeople] = useState([{ name: "", empId: "", company: "", designation: "", injury: "", contact: "" }]);
  const [witnesses, setWitnesses] = useState([{ name: "", company: "", contact: "", statementTaken: "" }]);
  const [evidence, setEvidence] = useState([{ type: "", attachment: null, remark: "" }]);
  const [signOffs, setSignOffs] = useState([
    { role: "Reported By", org: "", name: "", designation: "", sign: "", date: "" },
    { role: "Supervisor / Line Manager", org: "", name: "", designation: "", sign: "", date: "" },
    { role: "HSE Representative", org: "", name: "", designation: "", sign: "", date: "" },
    { role: "Project Manager / Client", org: "", name: "", designation: "", sign: "", date: "" },
  ]);

  const update = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const updatePerson = (i, k, v) => setPeople(p => p.map((r, idx) => idx === i ? { ...r, [k]: v } : r));
  const updateWitness = (i, k, v) => setWitnesses(p => p.map((r, idx) => idx === i ? { ...r, [k]: v } : r));
  const updateEvidence = (i, k, v) => setEvidence(p => p.map((r, idx) => idx === i ? { ...r, [k]: v } : r));
  const updateSignOff = (i, k, v) => setSignOffs(p => p.map((r, idx) => idx === i ? { ...r, [k]: v } : r));

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { ...form, people, witnesses, evidence, signOffs, status: "Submitted" };
    console.log("Incident Report payload:", payload);
    toast.success("Incident Report submitted successfully!");
    if (onSubmitSuccess) onSubmitSuccess(payload);
  };

  if (showForm2) {
    return <IncidentInvestigationForm onBack={() => setShowForm2(false)} />;
  }

  return (
    <div className="max-w-[1200px] mx-auto py-2 pb-12">
      {/* Header */}
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              Incident Report
            </h1>
            <p className="text-sm text-muted-foreground">
              Form 01 - Record details of near-misses, injuries, property damage, or environmental impacts.
            </p>
          </div>
        </div>
      </header>

      <form onSubmit={handleSubmit}>
        
        {/* 1. Report Identification */}
        <SectionCard title="1. Report Identification">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <Field label="Project / Job Site"><input className={inputCls} placeholder="Select project" value={form.projectSite} onChange={e => update('projectSite', e.target.value)} /></Field>
            <Field label="Contractor Name"><input className={inputCls} placeholder="Contractor company name" value={form.contractorName} onChange={e => update('contractorName', e.target.value)} /></Field>
            <Field label="Incident Report No."><input className={inputCls} placeholder="e.g. IR-2026-001" value={form.reportNo} onChange={e => update('reportNo', e.target.value)} /></Field>
            <Field label="Date & Time Reported"><input className={inputCls} type="datetime-local" value={form.dateReported} onChange={e => update('dateReported', e.target.value)} /></Field>
            
            <Field label="Reported By (Name)"><input className={inputCls} placeholder="Full name" value={form.reportedBy} onChange={e => update('reportedBy', e.target.value)} /></Field>
            <Field label="Emp. ID"><input className={inputCls} placeholder="Employee ID" value={form.empId} onChange={e => update('empId', e.target.value)} /></Field>
            <Field label="Company / Department"><input className={inputCls} placeholder="Company or dept." value={form.companyDept} onChange={e => update('companyDept', e.target.value)} /></Field>
            <Field label="Contact No."><input className={inputCls} placeholder="Phone number" value={form.contactNo} onChange={e => update('contactNo', e.target.value)} /></Field>
          </div>
        </SectionCard>

        {/* 2. Incident Classification */}
        <SectionCard title="2. Incident Classification">
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 border-b border-slate-100 pb-4">
              <Field label="Incident Type">
                <select className={selectCls} value={form.incidentType} onChange={e => update('incidentType', e.target.value)}>
                  <option value="">Select type</option>
                  {INCIDENT_TYPES.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
                {form.incidentType === "Other" && <input className={`mt-2 ${inputCls}`} placeholder="Specify other type..." value={form.incidentTypeOther} onChange={e => update('incidentTypeOther', e.target.value)} />}
              </Field>

              <Field label="Actual Severity / Consequence">
                <select className={selectCls} value={form.actualSeverity} onChange={e => update('actualSeverity', e.target.value)}>
                  <option value="">Select actual severity</option>
                  {ACTUAL_SEVERITIES.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
                {form.actualSeverity === "Other" && <input className={`mt-2 ${inputCls}`} placeholder="Specify other consequence..." value={form.actualSeverityOther} onChange={e => update('actualSeverityOther', e.target.value)} />}
              </Field>

              <Field label="Potential Severity (Worst credible outcome)">
                <select className={selectCls} value={form.potentialSeverity} onChange={e => update('potentialSeverity', e.target.value)}>
                  <option value="">Select potential severity</option>
                  {POTENTIAL_SEVERITIES.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            <Field label="Reportable to Authorities?" className="h-full">
              <div className="h-full flex flex-wrap gap-6 bg-slate-50/50 p-3 rounded-lg border border-slate-100 items-start content-start">
                <div className="flex items-center gap-3"><span className="text-sm font-medium text-slate-700 w-16">Client:</span><RadioGroup name="clientRep" options={["Yes", "No"]} value={form.clientReportable} onChange={v => update('clientReportable', v)} /></div>
                <div className="flex items-center gap-3"><span className="text-sm font-medium text-slate-700 w-32">Legal/Authority:</span><RadioGroup name="legalRep" options={["Yes", "No"]} value={form.legalReportable} onChange={v => update('legalReportable', v)} /></div>
                <div className="flex items-center gap-3"><span className="text-sm font-medium text-slate-700 w-20">Insurance:</span><RadioGroup name="insRep" options={["Yes", "No"]} value={form.insuranceReportable} onChange={v => update('insuranceReportable', v)} /></div>
              </div>
            </Field>

            <Field label="Investigation Required (Form 02)?" className="h-full">
              <div className="h-full flex flex-col gap-3 bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                <RadioGroup name="invReq" options={["Yes", "No"]} value={form.investigationRequired} onChange={v => update('investigationRequired', v)} />
                {form.investigationRequired === "Yes" && (
                  <input className={inputCls} placeholder="Investigation Ref No." value={form.investigationRefNo} onChange={e => update('investigationRefNo', e.target.value)} />
                )}
              </div>
            </Field>
          </div>
          </div>
        </SectionCard>

        {/* 3. Incident Details */}
        <SectionCard title="3. Incident Details">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <Field label="Date of Incident"><input type="date" className={inputCls} value={form.incidentDate} onChange={e => update('incidentDate', e.target.value)} /></Field>
            <Field label="Time of Incident"><input type="time" className={inputCls} value={form.incidentTime} onChange={e => update('incidentTime', e.target.value)} /></Field>
            <Field label="Exact Location / Area"><input className={inputCls} placeholder="e.g. Grid A4 / Room 201" value={form.exactLocation} onChange={e => update('exactLocation', e.target.value)} /></Field>
            <Field label="Activity at Time of Incident"><input className={inputCls} placeholder="e.g. Welding, Excavation" value={form.activityAtTime} onChange={e => update('activityAtTime', e.target.value)} /></Field>
            <Field label="Weather / Lighting (if applicable)"><input className={inputCls} placeholder="e.g. Raining, Poor lighting" value={form.weatherLighting} onChange={e => update('weatherLighting', e.target.value)} /></Field>
            <Field label="Supervisor / In-charge at Area"><input className={inputCls} placeholder="Supervisor name" value={form.supervisorIncharge} onChange={e => update('supervisorIncharge', e.target.value)} /></Field>
          </div>
        </SectionCard>

        {/* 4. Description & Immediate Actions */}
        <SectionCard title="4. Description & Immediate Actions">
          <div className="space-y-5">
            <Field label="Brief Description (What happened? Include sequence of events)">
              <textarea className={textareaCls} placeholder="Provide a detailed narrative of the incident..." value={form.briefDescription} onChange={e => update('briefDescription', e.target.value)}></textarea>
            </Field>
            <Field label="Immediate Actions Taken by whom & time (to make the area safe now)">
              <textarea className={textareaCls} placeholder="Describe the immediate response..." value={form.immediateActions} onChange={e => update('immediateActions', e.target.value)}></textarea>
            </Field>
          </div>
        </SectionCard>

        {/* 5. People Involved */}
        <SectionCard title="5. People Involved (if any)">
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Emp/ID</th>
                  <th className="px-4 py-3">Company</th>
                  <th className="px-4 py-3">Designation</th>
                  <th className="px-4 py-3">Injury? (Y/N)</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3 w-12 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {people.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50/50">
                    <td className="p-2"><input className={inputCls} placeholder="Name" value={row.name} onChange={e => updatePerson(i, 'name', e.target.value)} /></td>
                    <td className="p-2"><input className={inputCls} placeholder="ID" value={row.empId} onChange={e => updatePerson(i, 'empId', e.target.value)} /></td>
                    <td className="p-2"><input className={inputCls} placeholder="Company" value={row.company} onChange={e => updatePerson(i, 'company', e.target.value)} /></td>
                    <td className="p-2"><input className={inputCls} placeholder="Role" value={row.designation} onChange={e => updatePerson(i, 'designation', e.target.value)} /></td>
                    <td className="p-2">
                      <select className={selectCls} value={row.injury} onChange={e => updatePerson(i, 'injury', e.target.value)}>
                        <option value="">-</option><option value="Y">Yes</option><option value="N">No</option>
                      </select>
                    </td>
                    <td className="p-2"><input className={inputCls} placeholder="Contact" value={row.contact} onChange={e => updatePerson(i, 'contact', e.target.value)} /></td>
                    <td className="p-2 text-center">
                      <button type="button" onClick={() => setPeople(p => p.length > 1 ? p.filter((_, idx) => idx !== i) : p)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition"><Trash2 className="w-4 h-4"/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-start">
             <button type="button" onClick={() => setPeople(p => [...p, { name: "", empId: "", company: "", designation: "", injury: "", contact: "" }])} className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition">
               <Plus className="w-4 h-4"/> Add Person
             </button>
          </div>
        </SectionCard>

        {/* 6. Injury / Illness Details */}
        <SectionCard title="6. Injury / Illness Details (if applicable)">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Field label="Nature of Injury/Illness">
              <select className={selectCls} value={form.natureOfInjury} onChange={e => update('natureOfInjury', e.target.value)}>
                <option value="">Select injury nature</option>
                {NATURE_OF_INJURY.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
              {form.natureOfInjury === "Other" && <input className={`mt-3 ${inputCls}`} placeholder="Specify other injury..." value={form.natureOfInjuryOther} onChange={e => update('natureOfInjuryOther', e.target.value)} />}
            </Field>

            <Field label="Treatment Provided">
              <select className={selectCls} value={form.treatment} onChange={e => update('treatment', e.target.value)}>
                <option value="">Select treatment</option>
                {TREATMENTS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
              {form.treatment === "Other" && <input className={`mt-3 ${inputCls}`} placeholder="Specify other treatment..." value={form.treatmentOther} onChange={e => update('treatmentOther', e.target.value)} />}
            </Field>

            <Field label="Body Part Affected"><input className={inputCls} placeholder="e.g. Left Arm, Head" value={form.bodyPartAffected} onChange={e => update('bodyPartAffected', e.target.value)} /></Field>

            <Field label="PPE Worn?">
              <div className="flex items-center gap-4">
                <RadioGroup name="ppe" options={["Yes", "No", "Not Applicable"]} value={form.ppeWorn} onChange={v => update('ppeWorn', v)} />
              </div>
              {form.ppeWorn === "Yes" && <input className={`mt-3 ${inputCls}`} placeholder="Specify PPE worn..." value={form.ppeWornSpecify} onChange={e => update('ppeWornSpecify', e.target.value)} />}
            </Field>
          </div>
        </SectionCard>

        {/* 7. Property / Vehicle / Environmental Impact */}
        <SectionCard title="7. Property / Vehicle / Environmental Impact (if applicable)">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Field label="Type of Damage/Impact">
              <select className={selectCls} value={form.typeOfDamage} onChange={e => update('typeOfDamage', e.target.value)}>
                <option value="">Select damage type</option>
                {DAMAGE_TYPES.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
              {form.typeOfDamage === "Other" && <input className={`mt-3 ${inputCls}`} placeholder="Specify other damage..." value={form.typeOfDamageOther} onChange={e => update('typeOfDamageOther', e.target.value)} />}
            </Field>
            <Field label="Description of Damage/Impact"><input className={inputCls} placeholder="Describe the damage..." value={form.descriptionOfDamage} onChange={e => update('descriptionOfDamage', e.target.value)} /></Field>
            
            <Field label="Estimated Cost (if known)"><input className={inputCls} placeholder="e.g. $5,000" value={form.estimatedCost} onChange={e => update('estimatedCost', e.target.value)} /></Field>
            <Field label="Spill / Release details (material & quantity)"><input className={inputCls} placeholder="e.g. 50L of Hydraulic Oil" value={form.spillDetails} onChange={e => update('spillDetails', e.target.value)} /></Field>
          </div>
        </SectionCard>

        {/* 8. Witnesses */}
        <SectionCard title="8. Witnesses">
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Witness Name</th>
                  <th className="px-4 py-3">Company</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Statement Taken (Y/N)</th>
                  <th className="px-4 py-3 w-12 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {witnesses.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50/50">
                    <td className="p-2"><input className={inputCls} placeholder="Name" value={row.name} onChange={e => updateWitness(i, 'name', e.target.value)} /></td>
                    <td className="p-2"><input className={inputCls} placeholder="Company" value={row.company} onChange={e => updateWitness(i, 'company', e.target.value)} /></td>
                    <td className="p-2"><input className={inputCls} placeholder="Contact" value={row.contact} onChange={e => updateWitness(i, 'contact', e.target.value)} /></td>
                    <td className="p-2">
                      <select className={selectCls} value={row.statementTaken} onChange={e => updateWitness(i, 'statementTaken', e.target.value)}>
                        <option value="">-</option><option value="Y">Yes</option><option value="N">No</option>
                      </select>
                    </td>
                    <td className="p-2 text-center">
                      <button type="button" onClick={() => setWitnesses(p => p.length > 1 ? p.filter((_, idx) => idx !== i) : p)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition"><Trash2 className="w-4 h-4"/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-start">
             <button type="button" onClick={() => setWitnesses(p => [...p, { name: "", company: "", contact: "", statementTaken: "" }])} className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition">
               <Plus className="w-4 h-4"/> Add Witness
             </button>
          </div>
        </SectionCard>

        {/* 9. Attachments / Evidence */}
        <SectionCard title="9. Attachments / Evidence">
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 w-16 text-center whitespace-nowrap">Sl No.</th>
                  <th className="px-4 py-3 w-64">Evidence attached</th>
                  <th className="px-4 py-3 w-40">Attachment</th>
                  <th className="px-4 py-3">Remark</th>
                  <th className="px-4 py-3 w-16 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {evidence.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50/50">
                    <td className="px-4 py-2 text-center font-medium text-slate-500 align-middle">{i + 1}</td>
                    <td className="px-4 py-2 align-middle">
                      <select className={selectCls} value={row.type} onChange={e => updateEvidence(i, 'type', e.target.value)}>
                        <option value="">Select evidence</option>
                        {EVIDENCE_TYPES.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-2 align-middle">
                      <div className="flex h-10 items-center">
                        <FileUploadControl 
                          files={row.attachment ? [row.attachment] : []}
                          onFilesChange={files => updateEvidence(i, 'attachment', files.length > 0 ? files[0] : null)}
                          uploadLabel="Upload File"
                          compact={true}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-2 align-middle"><input className={inputCls} placeholder="Enter remarks" value={row.remark} onChange={e => updateEvidence(i, 'remark', e.target.value)} /></td>
                    <td className="px-4 py-2 text-center align-middle">
                      <button type="button" onClick={() => setEvidence(p => p.length > 1 ? p.filter((_, idx) => idx !== i) : p)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition"><Trash2 className="w-4 h-4"/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-start">
             <button type="button" onClick={() => setEvidence(p => [...p, { type: "", attachment: null, remark: "" }])} className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition">
               <Plus className="w-4 h-4"/> Add Evidence
             </button>
          </div>
        </SectionCard>

        {/* 10. Reporting & Sign-off */}
        <SectionCard title="10. Reporting & Sign-off">
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 w-1/5">Role</th>
                  <th className="px-4 py-3">Organisation</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Designation</th>
                  <th className="px-4 py-3">Sign</th>
                  <th className="px-4 py-3">Date & Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {signOffs.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50/50">
                    <td className="px-4 py-2 font-medium text-slate-700 bg-slate-50/50 border-r border-slate-100">{row.role}</td>
                    <td className="p-2"><input className={inputCls} placeholder="Organisation" value={row.org} onChange={e => updateSignOff(i, 'org', e.target.value)} /></td>
                    <td className="p-2"><input className={inputCls} placeholder="Name" value={row.name} onChange={e => updateSignOff(i, 'name', e.target.value)} /></td>
                    <td className="p-2"><input className={inputCls} placeholder="Designation" value={row.designation} onChange={e => updateSignOff(i, 'designation', e.target.value)} /></td>
                    <td className="p-2"><input className={inputCls} placeholder="Type name to sign" value={row.sign} onChange={e => updateSignOff(i, 'sign', e.target.value)} /></td>
                    <td className="p-2"><input className={inputCls} type="datetime-local" value={row.date} onChange={e => updateSignOff(i, 'date', e.target.value)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
        
        {/* Actions */}
        <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-slate-200">
          <button type="reset" onClick={() => window.location.reload()} className="px-5 py-2.5 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition">
            Cancel
          </button>
          {form.investigationRequired === "Yes" && (
            <button type="button" onClick={() => setShowForm2(true)} className="px-5 py-2.5 rounded-lg border border-primary bg-orange-50 text-sm font-medium text-primary hover:bg-orange-100 transition">
              Go to Form 2
            </button>
          )}
          <button type="submit" className="px-6 py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:opacity-90 shadow-sm transition">
            Submit Incident Report
          </button>
        </div>

      </form>
    </div>
  );
}
