import React, { useState, Fragment } from "react";
import { ArrowLeft, Save, Plus, Trash2, FileText, CheckCircle } from "lucide-react";
import { formatInputDate } from "../../../../utils/dateFormatter";
import FileUploadControl from "../../../FileUploadControl";

// Reusable Components
const SectionCard = ({ title, children }) => (
  <div className="mb-6 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
    <div className="bg-slate-50 border-b border-slate-200 px-5 py-3">
      <h3 className="font-semibold text-slate-800">{title}</h3>
    </div>
    <div className="p-5">{children}</div>
  </div>
);

const Field = ({ label, children, required }) => (
  <div>
    <label className="block text-xs font-medium text-slate-700 mb-1.5">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
  </div>
);

const inputCls = "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition";
const selectCls = "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition";
const textareaCls = "w-full rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-800 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition min-h-[100px]";



export default function IncidentInvestigationForm({ onBack, onSubmitSuccess }) {
  const [form, setForm] = useState({
    // Section 1
    investigationRefNo: "",
    incidentReportRef: "",
    projectSiteName: "",
    clientContract: "",
    departmentArea: "",
    exactLocation: "",
    dateTimeOfIncident: "",
    dateTimeReported: "",
    dateInvestigationStarted: "",
    dateInvestigationCompleted: "",

    // Section 2
    incidentTypes: [],
    actualSeverity: "",
    potentialSeverity: "",
    clientNotified: "",
    legalAuthorityNotified: "",
    insuranceL1: false,
    insuranceL2: false,
    insuranceL3: false,
    investigationLevel: "",
    investigationReason: "",

    // Section 4
    eventSummary: "",
    workActivity: "",
    sequenceOfEvents: "",
    immediateActions: "",

    // Section 6
    natureOfInjury: [],
    bodyPartAffected: [],
    medicalTreatment: "",
    hospitalClinic: "",
    damageCost: "",
    damageDetails: "",
    envMedia: [],
    materialReleased: "",
    ppeInUse: [],
    ppeAdequate: "",
    ppeSpecify: "",
  });

  const [investigationTeam, setInvestigationTeam] = useState([
    { role: "Lead Investigator", name: "", designation: "", contact: "", signature: "" },
    { role: "HSE Representative", name: "", designation: "", contact: "", signature: "" },
    { role: "Line Supervisor", name: "", designation: "", contact: "", signature: "" },
    { role: "Technical / Maintenance", name: "", designation: "", contact: "", signature: "" },
    { role: "HR / Admin (if needed)", name: "", designation: "", contact: "", signature: "" },
  ]);

  const [personsInvolved, setPersonsInvolved] = useState([
    { type: "Injured person 1", name: "", empNo: "", designation: "", contact: "", injury: "" },
    { type: "Operator involved", name: "", empNo: "", designation: "", contact: "", injury: "" },
    { type: "Supervisor involved", name: "", empNo: "", designation: "", contact: "", injury: "" },
    { type: "Contractor / Visitor", name: "", empNo: "", designation: "", contact: "", injury: "" },
    { type: "Third party / Public", name: "", empNo: "", designation: "", contact: "", injury: "" },
  ]);

  const [worksiteConditions, setWorksiteConditions] = useState([
    { question: "Was the work planned and authorized?", answer: "", details: "" },
    { question: "Was risk assessment / JSA available for the task?", answer: "", details: "" },
    { question: "Was risk assessment communicated to workforce?", answer: "", details: "" },
    { question: "Was Permit to Work required? If yes, valid and adequate?", answer: "", details: "" },
    { question: "Was LOTO / isolation required and applied correctly?", answer: "", details: "" },
    { question: "Were SOP / method statement available and followed?", answer: "", details: "" },
    { question: "Were workers competent / trained / certified for task?", answer: "", details: "" },
    { question: "Was supervision adequate at the time of event?", answer: "", details: "" },
    { question: "Were tools / equipment fit for purpose and inspected?", answer: "", details: "" },
    { question: "Was housekeeping adequate in the area?", answer: "", details: "" },
    { question: "Were warning signs / barricades in place?", answer: "", details: "" },
    { question: "Were weather / lighting / noise / visibility factors involved?", answer: "", details: "" },
    { question: "Were emergency arrangements available and effective?", answer: "", details: "" },
    { question: "Was there any change in work scope / condition not assessed?", answer: "", details: "" },
  ]);

  const [evidenceRegister, setEvidenceRegister] = useState([
    { no: "E01", type: "", description: "", collectedBy: "", dateTime: "", attachedRef: "" }
  ]);

  const [witnesses, setWitnesses] = useState([
    { name: "", companyDept: "", roleRelation: "", contact: "", statementTakenBy: "", signatureDate: "" }
  ]);
  const [witnessGuide1, setWitnessGuide1] = useState("");
  const [witnessGuide2, setWitnessGuide2] = useState("");
  const [witnessGuide3, setWitnessGuide3] = useState("");

  const [documentReview, setDocumentReview] = useState([
    { document: "Form 01 Incident Report", reviewed: "", attached: "", reference: "" },
    { document: "Photographs / Video", reviewed: "", attached: "", reference: "" },
    { document: "Witness Statements", reviewed: "", attached: "", reference: "" },
    { document: "Risk Assessment / JSA", reviewed: "", attached: "", reference: "" },
    { document: "Method Statement / SOP", reviewed: "", attached: "", reference: "" },
    { document: "Permit to Work", reviewed: "", attached: "", reference: "" },
    { document: "LOTO / Isolation record", reviewed: "", attached: "", reference: "" },
    { document: "Training / Competency records", reviewed: "", attached: "", reference: "" },
    { document: "Tool / Equipment inspection certificates", reviewed: "", attached: "", reference: "" },
    { document: "Maintenance history / breakdown log", reviewed: "", attached: "", reference: "" },
    { document: "Medical report / first aid report", reviewed: "", attached: "", reference: "" },
    { document: "Site layout / drawing / scene sketch", reviewed: "", attached: "", reference: "" },
    { document: "Other supporting documents:", reviewed: "", attached: "", reference: "" },
  ]);

  const [coreQuestions, setCoreQuestions] = useState([
    { question: "What happened (fact only)?", answer: "", evidence: "" },
    { question: "Where exactly did it happen?", answer: "", evidence: "" },
    { question: "When did it happen (date / time) and what was the shift / work phase?", answer: "", evidence: "" },
    { question: "Who was involved / affected / supervising?", answer: "", evidence: "" },
    { question: "What task was being performed and what was the intended outcome?", answer: "", evidence: "" },
    { question: "What changed from normal conditions?", answer: "", evidence: "" },
    { question: "What failed (person / equipment / control / communication / process)?", answer: "", evidence: "" },
    { question: "Which barriers / controls were missing, failed or not followed?", answer: "", evidence: "" },
    { question: "Was there adequate hazard identification before starting work?", answer: "", evidence: "" },
    { question: "Were instructions clear and understood by all involved?", answer: "", evidence: "" },
    { question: "Were competency, authorization and supervision adequate?", answer: "", evidence: "" },
    { question: "Did equipment design, condition, maintenance or guarding contribute?", answer: "", evidence: "" },
    { question: "Did environmental / ergonomic / layout factors contribute?", answer: "", evidence: "" },
    { question: "Were time pressure, production pressure or fatigue factors present?", answer: "", evidence: "" },
    { question: "What immediate causes are identified?", answer: "", evidence: "" },
    { question: "What underlying causes are identified?", answer: "", evidence: "" },
    { question: "What root causes / management system gaps are identified?", answer: "", evidence: "" },
  ]);

  const [causeAnalysis, setCauseAnalysis] = useState({
    immediateCauses: "",
    immediateDetails: "",
    underlyingCauses: "",
    underlyingDetails: "",
    rootCauses: "",
    rootDetails: "",
    barrierExisting: false,
    barrierMissing: false,
    barrierDetails: "",
    repeatPotential: "",
    humanFactors: [],
    humanFactorsOther: "",
    conclusion: "",
  });

  const [whyAnalysis, setWhyAnalysis] = useState([
    { step: "Problem Statement (What happened?)", question: "", answer: "" },
    { step: "Why 1", question: "", answer: "" },
    { step: "Why 2", question: "", answer: "" },
    { step: "Why 3", question: "", answer: "" },
    { step: "Why 4", question: "", answer: "" },
    { step: "Why 5", question: "", answer: "" },
  ]);
  const [whyValidatedRootCause, setWhyValidatedRootCause] = useState("");

  const [ishikawaAnalysis, setIshikawaAnalysis] = useState("");

  const [capa, setCapa] = useState([
    { no: "1", typeC: false, typeP: false, description: "", causeLinked: "", owner: "", targetDate: "", status: "", closureEvidence: "" },
    { no: "2", typeC: false, typeP: false, description: "", causeLinked: "", owner: "", targetDate: "", status: "", closureEvidence: "" },
    { no: "3", typeC: false, typeP: false, description: "", causeLinked: "", owner: "", targetDate: "", status: "", closureEvidence: "" },
    { no: "4", typeC: false, typeP: false, description: "", causeLinked: "", owner: "", targetDate: "", status: "", closureEvidence: "" },
    { no: "5", typeC: false, typeP: false, description: "", causeLinked: "", owner: "", targetDate: "", status: "", closureEvidence: "" },
    { no: "6", typeC: false, typeP: false, description: "", causeLinked: "", owner: "", targetDate: "", status: "", closureEvidence: "" },
  ]);
  const [capaEffectiveness, setCapaEffectiveness] = useState({ completed: "", date: "", verifiedBy: "", reopenNo: "", remarks: "" });

  const [lessonsLearned, setLessonsLearned] = useState({
    details: "", safetyAlertReq: "", safetyAlertDetails: "", audience: "", dateWhom: "", monitoringRequired: ""
  });

  const [photoRecords, setPhotoRecords] = useState([
    { id: 1, caption: "", fileRef: "" }
  ]);

  const [completionChecklist, setCompletionChecklist] = useState([
    { item: "Scene secured and preserved (as practicable)", done: "", remarks: "" },
    { item: "Immediate controls implemented", done: "", remarks: "" },
    { item: "All affected persons identified", done: "", remarks: "" },
    { item: "Witnesses interviewed and statements recorded", done: "", remarks: "" },
    { item: "Photos / evidence collected and logged", done: "", remarks: "" },
    { item: "Documents reviewed and listed", done: "", remarks: "" },
    { item: "Timeline / chronology completed", done: "", remarks: "" },
    { item: "Cause analysis completed", done: "", remarks: "" },
    { item: "Why-Why / 5 Why completed", done: "", remarks: "" },
    { item: "CAPA actions assigned with owners and dates", done: "", remarks: "" },
    { item: "Effectiveness verification planned", done: "", remarks: "" },
    { item: "Lessons learned documented", done: "", remarks: "" },
    { item: "Scene sketch completed", done: "", remarks: "" },
    { item: "Approvals obtained", done: "", remarks: "" },
    { item: "Form 01 completed", done: "", remarks: "" },
    { item: "Register updated", done: "", remarks: "" },
  ]);

  const [sceneSketch, setSceneSketch] = useState("");

  const [finalApproval, setFinalApproval] = useState([
    { desc: "Lead Investigator Name / Sign", org: "", name: "", designation: "", sign: "", date: "", time: "" },
    { desc: "HSE Manager Review / Sign", org: "", name: "", designation: "", sign: "", date: "", time: "" },
    { desc: "Line Manager Review / Sign", org: "", name: "", designation: "", sign: "", date: "", time: "" },
    { desc: "Client Representative (if required)", org: "", name: "", designation: "", sign: "", date: "", time: "" },
  ]);
  const [closeoutDetails, setCloseoutDetails] = useState({ date: "", comments: "" });

  const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const toggleIncidentType = (type) => {
    setForm(prev => {
      const types = prev.incidentTypes.includes(type)
        ? prev.incidentTypes.filter(t => t !== type)
        : [...prev.incidentTypes, type];
      return { ...prev, incidentTypes: types };
    });
  };

  const updateTeam = (idx, key, val) => {
    const arr = [...investigationTeam];
    arr[idx][key] = val;
    setInvestigationTeam(arr);
  };

  const updatePerson = (idx, key, val) => {
    const arr = [...personsInvolved];
    arr[idx][key] = val;
    setPersonsInvolved(arr);
  };

  const addInjuredPerson = () => {
    const arr = [...personsInvolved];
    const injuredCount = arr.filter(p => p.type.startsWith("Injured person")).length;
    const insertIdx = arr.findIndex(p => !p.type.startsWith("Injured person"));
    
    const newPerson = { type: `Injured person ${injuredCount + 1}`, name: "", empNo: "", designation: "", contact: "", injury: "" };
    
    if (insertIdx !== -1) {
      arr.splice(insertIdx, 0, newPerson);
    } else {
      arr.push(newPerson);
    }
    setPersonsInvolved(arr);
  };

  const removeInjuredPerson = (targetIdx) => {
    let arr = [...personsInvolved];
    arr.splice(targetIdx, 1);
    
    let counter = 1;
    arr = arr.map(p => {
      if (p.type.startsWith("Injured person")) {
        const newType = `Injured person ${counter}`;
        counter++;
        return { ...p, type: newType };
      }
      return p;
    });
    
    setPersonsInvolved(arr);
  };

  const updateWorksite = (idx, key, val) => {
    const arr = [...worksiteConditions];
    arr[idx][key] = val;
    setWorksiteConditions(arr);
  };

  const updateEvidence = (idx, key, val) => {
    const arr = [...evidenceRegister];
    arr[idx][key] = val;
    setEvidenceRegister(arr);
  };

  const updateWitness = (idx, key, val) => {
    const arr = [...witnesses];
    arr[idx][key] = val;
    setWitnesses(arr);
  };

  const updateDocument = (idx, key, val) => {
    const arr = [...documentReview];
    arr[idx][key] = val;
    setDocumentReview(arr);
  };

  const updateCoreQ = (idx, key, val) => {
    const arr = [...coreQuestions];
    arr[idx][key] = val;
    setCoreQuestions(arr);
  };
  const updateCause = (key, val) => setCauseAnalysis(prev => ({ ...prev, [key]: val }));
  const toggleCauseArray = (field, item) => {
    setCauseAnalysis(prev => {
      const arr = prev[field] || [];
      return { ...prev, [field]: arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item] };
    });
  };
  const updateWhy = (idx, key, val) => {
    const arr = [...whyAnalysis];
    arr[idx][key] = val;
    setWhyAnalysis(arr);
  };
  const updateCapa = (idx, key, val) => {
    const arr = [...capa];
    arr[idx][key] = val;
    setCapa(arr);
  };
  const updateLessons = (key, val) => setLessonsLearned(prev => ({ ...prev, [key]: val }));
  const updatePhoto = (idx, key, val) => {
    const arr = [...photoRecords];
    arr[idx][key] = val;
    setPhotoRecords(arr);
  };
  const addPhotoRecord = () => {
    setPhotoRecords([...photoRecords, { id: Date.now(), caption: "", fileRef: "" }]);
  };
  const removePhotoRecord = (idx) => {
    const arr = [...photoRecords];
    arr.splice(idx, 1);
    setPhotoRecords(arr);
  };
  const updateChecklist = (idx, key, val) => {
    const arr = [...completionChecklist];
    arr[idx][key] = val;
    setCompletionChecklist(arr);
  };
  const updateApproval = (idx, key, val) => {
    const arr = [...finalApproval];
    arr[idx][key] = val;
    setFinalApproval(arr);
  };

  const toggleArray = (field, item) => {
    setForm(prev => {
      const arr = prev[field] || [];
      return { ...prev, [field]: arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item] };
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="bg-slate-50 border-b border-slate-200 p-5 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">ACCIDENT / INCIDENT INVESTIGATION FORM (FORM - 02)</h2>
          <p className="text-sm text-slate-500 mt-1">Detailed root cause analysis and investigation report.</p>
        </div>
        <button type="button" onClick={onBack} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
          <ArrowLeft className="w-4 h-4" />
          Back to Form 1
        </button>
      </div>
      
      <div className="p-6">
        <form className="space-y-6">
          {/* 1. Case Identification and Project Details */}
          <SectionCard title="1. Case Identification and Project Details">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              <Field label="Investigation Ref No."><input className={inputCls} value={form.investigationRefNo} onChange={e => update('investigationRefNo', e.target.value)} /></Field>
              <Field label="Incident Report Ref (Form 01)"><input className={inputCls} value={form.incidentReportRef} onChange={e => update('incidentReportRef', e.target.value)} /></Field>
              <Field label="Project / Site Name"><input className={inputCls} value={form.projectSiteName} onChange={e => update('projectSiteName', e.target.value)} /></Field>
              <Field label="Client / Contract"><input className={inputCls} value={form.clientContract} onChange={e => update('clientContract', e.target.value)} /></Field>
              <Field label="Department / Area"><input className={inputCls} value={form.departmentArea} onChange={e => update('departmentArea', e.target.value)} /></Field>
              <Field label="Exact Location"><input className={inputCls} value={form.exactLocation} onChange={e => update('exactLocation', e.target.value)} /></Field>
              <Field label="Date & Time of Incident"><input type="datetime-local" className={inputCls} value={form.dateTimeOfIncident} onChange={e => update('dateTimeOfIncident', e.target.value)} /></Field>
              <Field label="Date & Time Reported"><input type="datetime-local" className={inputCls} value={form.dateTimeReported} onChange={e => update('dateTimeReported', e.target.value)} /></Field>
              <Field label="Date Investigation Started"><input type="date" className={inputCls} value={form.dateInvestigationStarted} onChange={e => update('dateInvestigationStarted', e.target.value)} /></Field>
              <Field label="Date Investigation Completed"><input type="date" className={inputCls} value={form.dateInvestigationCompleted} onChange={e => update('dateInvestigationCompleted', e.target.value)} /></Field>
            </div>
          </SectionCard>

          {/* 2. Classification, Severity and Reportability */}
          <SectionCard title="2. Classification, Severity and Reportability">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Field label="Incident Type">
                  <select className={selectCls} value={form.incidentTypes[0] || ""} onChange={e => update('incidentTypes', [e.target.value])}>
                    <option value="">Select type</option>
                    {["Near - Miss", "Injury/Illness", "Property Damage", "Vehicle/Traffic", "Fire/Explosion", "Spill/Leak/Release", "Environmental", "Unsafe Act", "Unsafe Condition", "Security Breaches/Theft/Third Party", "Thread or Act of Violance", "Other"].map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Actual Severity / Consequence">
                  <select className={selectCls} value={form.actualSeverity} onChange={e => update('actualSeverity', e.target.value)}>
                    <option value="">Select actual severity</option>
                    {["No Injury", "First - Aid", "Medical Treatment (MTC/MTI)", "Restricted Wok( RWC)", "Loss Time Injury (LTI)", "Property Damage Only", "Environmental Impact", "Other"].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Potential Severity (Worst credible outcome)">
                  <select className={selectCls} value={form.potentialSeverity} onChange={e => update('potentialSeverity', e.target.value)}>
                    <option value="">Select potential severity</option>
                    {["Low", "Medium", "High", "Very High / Catastrophic"].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-100 pt-6">
                
                {/* Reportable to Authorities? */}
                <div className="flex flex-col h-full">
                  <div className="text-sm font-medium text-slate-700 mb-3">Reportable to Authorities?</div>
                  <div className="border border-slate-200 bg-slate-50/50 p-4 rounded-lg space-y-4 flex-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-slate-700 w-20">Client:</span>
                        <div className="flex gap-4">
                          {["Yes", "No"].map(o => (
                            <label key={o} className="inline-flex items-center gap-2 cursor-pointer">
                              <input type="radio" name="clientNotified" value={o} checked={form.clientNotified === o} onChange={e => update('clientNotified', e.target.value)} className="w-4 h-4 accent-primary" />
                              <span className="text-sm text-slate-700">{o}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-slate-700 w-32">Legal/Authority:</span>
                        <div className="flex gap-4">
                          {["Yes", "No"].map(o => (
                            <label key={o} className="inline-flex items-center gap-2 cursor-pointer">
                              <input type="radio" name="legalAuthorityNotified" value={o} checked={form.legalAuthorityNotified === o} onChange={e => update('legalAuthorityNotified', e.target.value)} className="w-4 h-4 accent-primary" />
                              <span className="text-sm text-slate-700">{o}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center pt-4">
                      <span className="text-sm font-medium text-slate-700 w-20">Insurance:</span>
                      <div className="flex gap-4">
                        {["L1", "L2", "L3"].map(level => (
                          <label key={level} className="inline-flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={form[`insurance${level}`]} onChange={e => update(`insurance${level}`, e.target.checked)} className="w-4 h-4 accent-primary" />
                            <span className="text-sm text-slate-700">{level}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Investigation Level & Reason */}
                <div className="flex flex-col h-full">
                  <div className="text-sm font-medium text-slate-700 mb-3">Investigation Level & Reason:</div>
                  <div className="border border-slate-200 bg-slate-50/50 p-4 rounded-lg flex flex-col gap-4 flex-1">
                    <div className="flex items-center gap-6">
                      {["Full Investigation Required", "Simplified Review", "Trend Only"].map(level => (
                        <label key={level} className="inline-flex items-center gap-2 cursor-pointer">
                          <input type="radio" name="investigationLevel" value={level} checked={form.investigationLevel === level} onChange={e => update('investigationLevel', e.target.value)} className="w-4 h-4 accent-primary shrink-0" />
                          <span className="text-sm text-slate-700 whitespace-nowrap">{level}</span>
                        </label>
                      ))}
                    </div>
                    <input 
                      type="text" 
                      placeholder="Reason..." 
                      className={inputCls} 
                      value={form.investigationReason} 
                      onChange={e => update('investigationReason', e.target.value)}
                    />
                  </div>
                </div>

              </div>
            </div>
          </SectionCard>

          {/* 3. Investigation Team and Authorization */}
          <SectionCard title="3. Investigation Team and Authorization">
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Designation / Department</th>
                    <th className="px-4 py-3">Contact</th>
                    <th className="px-4 py-3">Signature / Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {investigationTeam.map((member, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="px-4 py-2 font-medium text-slate-700">{member.role}</td>
                      <td className="p-2"><input className={inputCls} value={member.name} onChange={e => updateTeam(idx, 'name', e.target.value)} /></td>
                      <td className="p-2"><input className={inputCls} value={member.designation} onChange={e => updateTeam(idx, 'designation', e.target.value)} /></td>
                      <td className="p-2"><input className={inputCls} value={member.contact} onChange={e => updateTeam(idx, 'contact', e.target.value)} /></td>
                      <td className="p-2"><input type="date" className={inputCls} value={member.signature} onChange={e => updateTeam(idx, 'signature', e.target.value)} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>

          {/* 4. Event Summary, Scene Details and Chronology */}
          <SectionCard title="4. Event Summary, Scene Details and Chronology">
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 w-1/3">Field</th>
                    <th className="px-4 py-3 w-2/3">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  <tr className="hover:bg-slate-50/50">
                    <td className="px-4 py-4 font-medium text-slate-700 align-top">Brief event summary (what happened?)</td>
                    <td className="p-3">
                      <textarea 
                        className={textareaCls.replace('min-h-[100px]', 'min-h-[42px] overflow-hidden resize-none')} 
                        rows={1} 
                        value={form.eventSummary} 
                        onChange={e => {
                          e.target.style.height = 'auto';
                          e.target.style.height = e.target.scrollHeight + 'px';
                          update('eventSummary', e.target.value);
                        }} 
                      />
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="px-4 py-4 font-medium text-slate-700 align-top">Work activity at time of event</td>
                    <td className="p-3">
                      <textarea 
                        className={textareaCls.replace('min-h-[100px]', 'min-h-[42px] overflow-hidden resize-none')} 
                        rows={1} 
                        value={form.workActivity} 
                        onChange={e => {
                          e.target.style.height = 'auto';
                          e.target.style.height = e.target.scrollHeight + 'px';
                          update('workActivity', e.target.value);
                        }} 
                      />
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="px-4 py-4 font-medium text-slate-700 align-top">Exact sequence of events before, during and after incident (chronology)</td>
                    <td className="p-3">
                      <textarea 
                        className={textareaCls.replace('min-h-[100px]', 'min-h-[42px] overflow-hidden resize-none')} 
                        rows={1} 
                        value={form.sequenceOfEvents} 
                        onChange={e => {
                          e.target.style.height = 'auto';
                          e.target.style.height = e.target.scrollHeight + 'px';
                          update('sequenceOfEvents', e.target.value);
                        }} 
                      />
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="px-4 py-4 font-medium text-slate-700 align-top">Immediate actions taken to make area safe</td>
                    <td className="p-3">
                      <textarea 
                        className={textareaCls.replace('min-h-[100px]', 'min-h-[42px] overflow-hidden resize-none')} 
                        rows={1} 
                        value={form.immediateActions} 
                        onChange={e => {
                          e.target.style.height = 'auto';
                          e.target.style.height = e.target.scrollHeight + 'px';
                          update('immediateActions', e.target.value);
                        }} 
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </SectionCard>

          {/* 5. Persons Involved / Injured / Affected */}
          <SectionCard title="5. Persons Involved / Injured / Affected">
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Employee No. / Company</th>
                    <th className="px-4 py-3">Designation</th>
                    <th className="px-4 py-3">Contact</th>
                    <th className="px-4 py-3 min-w-[200px]">Injury / Impact</th>
                    <th className="px-4 py-3 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {personsInvolved.map((person, idx) => {
                    const isOperatorRow = person.type === "Operator involved";
                    return (
                      <Fragment key={idx}>
                        {isOperatorRow && (
                          <tr className="bg-slate-50/30">
                            <td colSpan={7} className="px-4 py-3 border-y border-slate-200">
                              <button
                                type="button"
                                onClick={addInjuredPerson}
                                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Add Person
                              </button>
                            </td>
                          </tr>
                        )}
                        <tr className="hover:bg-slate-50/50">
                          <td className="px-4 py-2 font-medium text-slate-700">{person.type}</td>
                          <td className="p-2"><input className={inputCls} value={person.name} onChange={e => updatePerson(idx, 'name', e.target.value)} /></td>
                          <td className="p-2"><input className={inputCls} value={person.empNo} onChange={e => updatePerson(idx, 'empNo', e.target.value)} /></td>
                          <td className="p-2"><input className={inputCls} value={person.designation} onChange={e => updatePerson(idx, 'designation', e.target.value)} /></td>
                          <td className="p-2"><input className={inputCls} value={person.contact} onChange={e => updatePerson(idx, 'contact', e.target.value)} /></td>
                          <td className="p-2"><input className={inputCls} value={person.injury} onChange={e => updatePerson(idx, 'injury', e.target.value)} /></td>
                          <td className="p-2 text-center">
                            {person.type.startsWith("Injured person") && person.type !== "Injured person 1" && (
                              <button type="button" onClick={() => removeInjuredPerson(idx)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors" title="Remove person">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </SectionCard>

          {/* 6. Injury, Damage and Environmental Impact Details */}
          <SectionCard title="6. Injury, Damage and Environmental Impact Details (complete applicable sections)">
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 w-1/4">Item / Category</th>
                    <th className="px-4 py-3 w-1/2">Selection / Details</th>
                    <th className="px-4 py-3 w-1/4">Reference / Remarks / Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  <tr className="hover:bg-slate-50/50">
                    <td className="px-4 py-4 font-medium text-slate-700 align-top bg-slate-50/30">Nature of injury:</td>
                    <td className="p-4 align-top">
                      <select className={selectCls} value={form.natureOfInjury[0] || ""} onChange={e => update('natureOfInjury', [e.target.value])}>
                        <option value="">Select nature of injury...</option>
                        {["Cut", "Laceration", "Bruise", "Fracture", "Sprain/Strain", "Burn", "Electric Shock", "Crush", "Eye Injury", "Exposure", "Not Applicable", "Other"].map(item => (
                          <option key={item} value={item}>{item}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-2 align-top">
                      <textarea 
                        className={textareaCls.replace('min-h-[100px]', 'min-h-[42px] overflow-hidden resize-none')} 
                        rows={1} 
                        placeholder="Notes..." 
                        onInput={e => {
                          e.target.style.height = 'auto';
                          e.target.style.height = e.target.scrollHeight + 'px';
                        }} 
                      />
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50/50 border-t border-slate-200">
                    <td className="px-4 py-4 font-medium text-slate-700 align-top bg-slate-50/30">Body part affected:</td>
                    <td className="p-4 align-top">
                      <select className={selectCls} value={form.bodyPartAffected[0] || ""} onChange={e => update('bodyPartAffected', [e.target.value])}>
                        <option value="">Select body part affected...</option>
                        {["Head", "Eye", "Face", "Neck", "Hand/Finger", "Arm", "Back", "Chest", "Leg/Foot", "Whole Body", "Not Applicable", "Other"].map(item => (
                          <option key={item} value={item}>{item}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-2 align-top">
                      <textarea 
                        className={textareaCls.replace('min-h-[100px]', 'min-h-[42px] overflow-hidden resize-none')} 
                        rows={1} 
                        placeholder="Notes..." 
                        onInput={e => {
                          e.target.style.height = 'auto';
                          e.target.style.height = e.target.scrollHeight + 'px';
                        }} 
                      />
                    </td>
                  </tr>

                  <tr className="border-t border-slate-200">
                    <td colSpan={3} className="p-4 bg-white">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Field label="Medical treatment provided:">
                          <input className={inputCls} value={form.medicalTreatment} onChange={e => update('medicalTreatment', e.target.value)} />
                        </Field>
                        <Field label="Hospital / Clinic / Doctor:">
                          <input className={inputCls} value={form.hospitalClinic} onChange={e => update('hospitalClinic', e.target.value)} />
                        </Field>
                        <Field label="Estimated property damage cost:">
                          <input className={inputCls} value={form.damageCost} onChange={e => update('damageCost', e.target.value)} />
                        </Field>
                        <Field label="Damaged asset / equipment details:">
                          <input className={inputCls} value={form.damageDetails} onChange={e => update('damageDetails', e.target.value)} />
                        </Field>
                        <Field label="Environmental media impacted:">
                          <select className={selectCls} value={form.envMedia[0] || ""} onChange={e => update('envMedia', [e.target.value])}>
                            <option value="">Select environmental media...</option>
                            {["Air", "Soil", "Drain", "Water", "None", "Other"].map(item => (
                              <option key={item} value={item}>{item}</option>
                            ))}
                          </select>
                        </Field>
                        <Field label="Material released / quantity:">
                          <input className={inputCls} value={form.materialReleased} onChange={e => update('materialReleased', e.target.value)} />
                        </Field>
                      </div>
                    </td>
                  </tr>

                  <tr className="border-t-2 border-primary/20">
                    <td colSpan={3} className="p-4 bg-white">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        <div className="space-y-3">
                          <Field label="PPE in use:">
                            <select className={selectCls} value={form.ppeInUse[0] || ""} onChange={e => update('ppeInUse', [e.target.value])}>
                              <option value="">Select PPE in use...</option>
                              {["Helmet", "Gloves", "Safety Shoes", "Goggles", "Harness", "Hearing Protection", "Not Applicable", "Other"].map(item => (
                                <option key={item} value={item}>{item}</option>
                              ))}
                            </select>
                          </Field>
                          <textarea 
                            className={textareaCls.replace('min-h-[100px]', 'min-h-[42px] overflow-hidden resize-none')} 
                            rows={1} 
                            placeholder="Notes..." 
                            onInput={e => {
                              e.target.style.height = 'auto';
                              e.target.style.height = e.target.scrollHeight + 'px';
                            }} 
                          />
                        </div>

                        <div className="space-y-3">
                          <Field label="PPE adequate and used correctly?:">
                            <div className="flex gap-4 items-center h-10 px-1">
                              {["Yes", "No"].map(o => (
                                <label key={o} className="flex items-center gap-2 cursor-pointer">
                                  <input type="radio" name="ppeAdequate" value={o} checked={form.ppeAdequate === o} onChange={e => update('ppeAdequate', e.target.value)} className="w-4 h-4 accent-primary" />
                                  <span className="text-sm text-slate-700">{o}</span>
                                </label>
                              ))}
                            </div>
                          </Field>
                          <textarea 
                            className={textareaCls.replace('min-h-[100px]', 'min-h-[42px] overflow-hidden resize-none')} 
                            rows={1}
                            placeholder="Specify details..."
                            value={form.ppeSpecify} 
                            onChange={e => update('ppeSpecify', e.target.value)} 
                            onInput={e => {
                              e.target.style.height = 'auto';
                              e.target.style.height = e.target.scrollHeight + 'px';
                            }} 
                          />
                        </div>

                      </div>
                    </td>
                  </tr>

                </tbody>
              </table>
            </div>
          </SectionCard>

          {/* 7. Worksite Conditions / Safety Management at Time of Event */}
          <SectionCard title="7. Worksite Conditions / Safety Management at Time of Event">
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 w-1/2">Condition / Requirement</th>
                    <th className="px-4 py-3 w-[150px]">Yes / No / N/A</th>
                    <th className="px-4 py-3">Details / Comments (mandatory if No)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {worksiteConditions.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-medium text-slate-700">{item.question}</td>
                      <td className="p-3">
                        <select className={selectCls} value={item.answer} onChange={e => updateWorksite(idx, 'answer', e.target.value)}>
                          <option value="">Select...</option>
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                          <option value="N/A">N/A</option>
                        </select>
                      </td>
                      <td className="p-2"><input className={inputCls} value={item.details} onChange={e => updateWorksite(idx, 'details', e.target.value)} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>

          {/* 8. Evidence Register */}
          <SectionCard title="8. Evidence Register (Photos, Sketches, Logs)">
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 w-16">No.</th>
                    <th className="px-4 py-3 w-48">Evidence Type</th>
                    <th className="px-4 py-3 min-w-[200px]">Description</th>
                    <th className="px-4 py-3 w-48">Collected By</th>
                    <th className="px-4 py-3 w-48">Date / Time</th>
                    <th className="px-4 py-3 w-40">Attachment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {evidenceRegister.map((ev, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="px-4 py-2 font-medium text-slate-700">{ev.no}</td>
                      <td className="p-2">
                        <select className={selectCls} value={ev.type} onChange={e => updateEvidence(idx, 'type', e.target.value)}>
                          <option value="">Select type...</option>
                          <option value="Photograph">Photograph</option>
                          <option value="Video">Video</option>
                          <option value="Sketch / Drawing">Sketch / Drawing</option>
                          <option value="Log / Record">Log / Record</option>
                          <option value="Physical Object">Physical Object</option>
                          <option value="Other">Other</option>
                        </select>
                      </td>
                      <td className="p-2"><input className={inputCls} value={ev.description} onChange={e => updateEvidence(idx, 'description', e.target.value)} /></td>
                      <td className="p-2"><input className={inputCls} value={ev.collectedBy} onChange={e => updateEvidence(idx, 'collectedBy', e.target.value)} /></td>
                      <td className="p-2"><input type="datetime-local" className={inputCls} value={ev.dateTime} onChange={e => updateEvidence(idx, 'dateTime', e.target.value)} /></td>
                      <td className="px-4 py-2">
                        <FileUploadControl files={ev.attachedRef ? [{ name: ev.attachedRef }] : []} onFilesChange={(files) => updateEvidence(idx, 'attachedRef', files.length > 0 ? files[0].name : '')} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex justify-start">
              <button type="button" onClick={() => setEvidenceRegister([...evidenceRegister, { no: `E0${evidenceRegister.length + 1}`, type: "", description: "", collectedBy: "", dateTime: "", attachedRef: "" }])} className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors">
                <Plus className="w-4 h-4" /> Add Evidence
              </button>
            </div>
          </SectionCard>

          {/* 9. Witness Details & Statements */}
          <SectionCard title="9. Witness Details & Statements">
            <div className="space-y-8">
              <div>
                <h4 className="text-sm font-medium text-slate-700 mb-3">Witness Contact Information</h4>
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3">Witness Name</th>
                        <th className="px-4 py-3">Company / Department</th>
                        <th className="px-4 py-3">Role / Relation to Event</th>
                        <th className="px-4 py-3">Contact Number</th>
                        <th className="px-4 py-3">Statement Taken By</th>
                        <th className="px-4 py-3">Signature / Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {witnesses.map((w, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="p-2"><input className={inputCls} value={w.name} onChange={e => updateWitness(idx, 'name', e.target.value)} /></td>
                          <td className="p-2"><input className={inputCls} value={w.companyDept} onChange={e => updateWitness(idx, 'companyDept', e.target.value)} /></td>
                          <td className="p-2"><input className={inputCls} value={w.roleRelation} onChange={e => updateWitness(idx, 'roleRelation', e.target.value)} /></td>
                          <td className="p-2"><input className={inputCls} value={w.contact} onChange={e => updateWitness(idx, 'contact', e.target.value)} /></td>
                          <td className="p-2"><input className={inputCls} value={w.statementTakenBy} onChange={e => updateWitness(idx, 'statementTakenBy', e.target.value)} /></td>
                          <td className="p-2"><input type="date" className={inputCls} value={w.signatureDate} onChange={e => updateWitness(idx, 'signatureDate', e.target.value)} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-3 flex justify-start">
                  <button type="button" onClick={() => setWitnesses([...witnesses, { name: "", companyDept: "", roleRelation: "", contact: "", statementTakenBy: "", signatureDate: "" }])} className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors">
                    <Plus className="w-4 h-4" /> Add Witness
                  </button>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-slate-700 mb-3">Witness Interview Summary</h4>
                <div className="space-y-4">
                  <Field label="What were you doing at the time of the event? (Location, task, equipment)">
                    <textarea 
                      className={textareaCls.replace('min-h-[100px]', 'min-h-[42px] overflow-hidden resize-none')} 
                      rows={1}
                      value={witnessGuide1} 
                      onChange={e => setWitnessGuide1(e.target.value)} 
                      onInput={e => {
                        e.target.style.height = 'auto';
                        e.target.style.height = e.target.scrollHeight + 'px';
                      }}
                    />
                  </Field>
                  <Field label="What did you see, hear, or notice before, during, and after the event?">
                    <textarea 
                      className={textareaCls.replace('min-h-[100px]', 'min-h-[42px] overflow-hidden resize-none')} 
                      rows={1}
                      value={witnessGuide2} 
                      onChange={e => setWitnessGuide2(e.target.value)} 
                      onInput={e => {
                        e.target.style.height = 'auto';
                        e.target.style.height = e.target.scrollHeight + 'px';
                      }}
                    />
                  </Field>
                  <Field label="In your opinion, what caused the event and how could it have been prevented?">
                    <textarea 
                      className={textareaCls.replace('min-h-[100px]', 'min-h-[42px] overflow-hidden resize-none')} 
                      rows={1}
                      value={witnessGuide3} 
                      onChange={e => setWitnessGuide3(e.target.value)} 
                      onInput={e => {
                        e.target.style.height = 'auto';
                        e.target.style.height = e.target.scrollHeight + 'px';
                      }}
                    />
                  </Field>
                </div>
              </div>
            </div>
          </SectionCard>

          {/* 10. Document Review Register */}
          <SectionCard title="10. Document Review Register">
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 w-1/3">Document Required</th>
                    <th className="px-4 py-3 w-40">Reviewed? (Yes/No/NA)</th>
                    <th className="px-4 py-3 w-40">Attached? (Yes/No)</th>
                    <th className="px-4 py-3 min-w-[200px]">Reference Number / Comments</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {documentReview.map((doc, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-medium text-slate-700">{doc.document}</td>
                      <td className="p-2">
                        <select className={selectCls} value={doc.reviewed} onChange={e => updateDocument(idx, 'reviewed', e.target.value)}>
                          <option value="">Select...</option>
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                          <option value="N/A">N/A</option>
                        </select>
                      </td>
                      <td className="p-2">
                        <select className={selectCls} value={doc.attached} onChange={e => updateDocument(idx, 'attached', e.target.value)}>
                          <option value="">Select...</option>
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      </td>
                      <td className="p-2"><input className={inputCls} value={doc.reference} onChange={e => updateDocument(idx, 'reference', e.target.value)} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>

          {/* 11. Core Investigation Question Bank */}
          <SectionCard title="11. Core Investigation Question Bank (all types of incidents)">
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 w-1/3">Investigation Question</th>
                    <th className="px-4 py-3 w-1/2">Answer / Findings</th>
                    <th className="px-4 py-3">Evidence Ref</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {coreQuestions.map((q, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-medium text-slate-700">{q.question}</td>
                      <td className="p-2">
                        <textarea 
                          className={textareaCls.replace('min-h-[100px]', 'min-h-[42px] overflow-hidden resize-none')} 
                          rows={1}
                          value={q.answer} 
                          onChange={e => updateCoreQ(idx, 'answer', e.target.value)} 
                          onInput={e => {
                            e.target.style.height = 'auto';
                            e.target.style.height = e.target.scrollHeight + 'px';
                          }}
                        />
                      </td>
                      <td className="p-2"><input className={inputCls} value={q.evidence} onChange={e => updateCoreQ(idx, 'evidence', e.target.value)} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>

          {/* 12. Cause Analysis and Cause Classification */}
          <SectionCard title="12. Cause Analysis and Cause Classification">
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 w-1/4">Cause Type</th>
                    <th className="px-4 py-3">Details / Tick and Explain</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  <tr className="hover:bg-slate-50/50">
                    <td className="px-4 py-4 font-bold text-slate-700 align-top">Immediate Causes:</td>
                    <td className="p-4">
                      <div className="flex flex-nowrap items-center gap-4">
                        <select className={selectCls.replace('w-full', 'w-56')} value={causeAnalysis.immediateCauses} onChange={e => updateCause('immediateCauses', e.target.value)}>
                          <option value="">Select option</option>
                          {["Unsafe Act", "Unsafe Condition", "Procedural Deviation", "Environmental Condition", "Equipment Failure"].map(item => (
                            <option key={item} value={item}>{item}</option>
                          ))}
                        </select>
                        <div className="flex flex-1 items-start gap-2">
                          <span className="text-slate-600 whitespace-nowrap mt-3">Details:</span>
                          <textarea rows={1} className={textareaCls + " min-h-[44px] overflow-hidden resize-none"} value={causeAnalysis.immediateDetails} onChange={e => updateCause('immediateDetails', e.target.value)} onInput={(e) => { e.target.style.height = "auto"; e.target.style.height = `${e.target.scrollHeight}px`; }} />
                        </div>
                      </div>
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50/50">
                    <td className="px-4 py-4 font-bold text-slate-700 align-top">Underlying Causes:</td>
                    <td className="p-4">
                      <div className="flex flex-nowrap items-center gap-4">
                        <select className={selectCls.replace('w-full', 'w-56')} value={causeAnalysis.underlyingCauses} onChange={e => updateCause('underlyingCauses', e.target.value)}>
                          <option value="">Select option</option>
                          {["Training", "Competency", "Supervision", "Communication", "Planning", "PPE's", "Maintenance"].map(item => (
                            <option key={item} value={item}>{item}</option>
                          ))}
                        </select>
                        <div className="flex flex-1 items-start gap-2">
                          <span className="text-slate-600 whitespace-nowrap mt-3">Details:</span>
                          <textarea rows={1} className={textareaCls + " min-h-[44px] overflow-hidden resize-none"} value={causeAnalysis.underlyingDetails} onChange={e => updateCause('underlyingDetails', e.target.value)} onInput={(e) => { e.target.style.height = "auto"; e.target.style.height = `${e.target.scrollHeight}px`; }} />
                        </div>
                      </div>
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50/50">
                    <td className="px-4 py-4 font-bold text-slate-700 align-top">Root Causes / System Gaps:</td>
                    <td className="p-4">
                      <div className="flex flex-nowrap items-center gap-4">
                        <select className={selectCls.replace('w-full', 'w-56')} value={causeAnalysis.rootCauses} onChange={e => updateCause('rootCauses', e.target.value)}>
                          <option value="">Select option</option>
                          {["SOP Gap", "Risk Assessment", "Change Management", "Leadership/Culture", "Resource/Staffing", "PPE's"].map(item => (
                            <option key={item} value={item}>{item}</option>
                          ))}
                        </select>
                        <div className="flex flex-1 items-start gap-2">
                          <span className="text-slate-600 whitespace-nowrap mt-3">Details:</span>
                          <textarea rows={1} className={textareaCls + " min-h-[44px] overflow-hidden resize-none"} value={causeAnalysis.rootDetails} onChange={e => updateCause('rootDetails', e.target.value)} onInput={(e) => { e.target.style.height = "auto"; e.target.style.height = `${e.target.scrollHeight}px`; }} />
                        </div>
                      </div>
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50/50">
                    <td className="px-4 py-4 font-bold text-slate-700 align-top">Barrier Analysis:</td>
                    <td className="p-4">
                      <div className="flex flex-nowrap items-center gap-4">
                        <select 
                          className={selectCls.replace('w-full', 'w-56')} 
                          value={causeAnalysis.barrierExisting ? "Existing Barrier" : causeAnalysis.barrierMissing ? "Missing" : ""} 
                          onChange={e => {
                            const val = e.target.value;
                            setCauseAnalysis(prev => ({ ...prev, barrierExisting: val === "Existing Barrier", barrierMissing: val === "Missing" }));
                          }}
                        >
                          <option value="">Select option</option>
                          <option value="Existing Barrier">Existing Barrier</option>
                          <option value="Missing">Missing</option>
                        </select>
                        <div className="flex flex-1 items-start gap-2">
                          <span className="text-slate-600 whitespace-nowrap mt-3">Details:</span>
                          <textarea rows={1} className={textareaCls + " min-h-[44px] overflow-hidden resize-none"} placeholder="Explain barrier analysis..." value={causeAnalysis.barrierDetails} onChange={e => updateCause('barrierDetails', e.target.value)} onInput={(e) => { e.target.style.height = "auto"; e.target.style.height = `${e.target.scrollHeight}px`; }} />
                        </div>
                      </div>
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50/50">
                    <td className="px-4 py-4 font-bold text-slate-700 align-top">Repeat Event Potential:</td>
                    <td className="p-4">
                      <textarea 
                        rows={1}
                        className={textareaCls + " min-h-[44px] overflow-hidden resize-none"} 
                        placeholder="Describe potential for repeat..." 
                        value={causeAnalysis.repeatPotential} 
                        onChange={e => updateCause('repeatPotential', e.target.value)} 
                        onInput={(e) => {
                          e.target.style.height = "auto";
                          e.target.style.height = `${e.target.scrollHeight}px`;
                        }}
                      />
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50/50">
                    <td className="px-4 py-4 font-bold text-slate-700 align-top">Human Factors:</td>
                    <td className="p-4">
                      <div className="flex flex-nowrap items-center gap-4">
                        <select 
                          className={selectCls.replace('w-full', 'w-56')} 
                          value={Array.isArray(causeAnalysis.humanFactors) ? causeAnalysis.humanFactors[0] || "" : causeAnalysis.humanFactors} 
                          onChange={e => updateCause('humanFactors', e.target.value)}
                        >
                          <option value="">Select option</option>
                          {["Fatigue", "Stress", "Distraction", "Complacency", "Time Pressure", "Communication Issues", "Others"].map(item => (
                            <option key={item} value={item}>{item}</option>
                          ))}
                        </select>
                        
                        {(Array.isArray(causeAnalysis.humanFactors) ? causeAnalysis.humanFactors.includes("Others") : causeAnalysis.humanFactors === "Others") && (
                          <div className="flex flex-1 items-center gap-2">
                            <span className="text-slate-600 whitespace-nowrap">Please specify:</span>
                            <input className={inputCls} value={causeAnalysis.humanFactorsOther} onChange={e => updateCause('humanFactorsOther', e.target.value)} placeholder="Specify other human factors..." />
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50/50">
                    <td className="px-4 py-4 font-bold text-slate-700 align-top">
                      Conclusion Statement <br/>
                      <span className="font-normal text-slate-500 text-xs">(Investigation conclusion summary (factual and evidence-based)):</span>
                    </td>
                    <td className="p-2">
                      <textarea className={textareaCls + " min-h-[80px] border-none shadow-none focus:ring-0"} placeholder="Write conclusion here..." value={causeAnalysis.conclusion} onChange={e => updateCause('conclusion', e.target.value)} />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </SectionCard>

          {/* 13. WHY-WHY / 5 Why Analysis */}
          <SectionCard title="13. WHY-WHY / 5 Why Analysis (MANDATORY)">
            <div className="overflow-x-auto border border-slate-200 rounded-lg mb-4">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 w-1/4">Step</th>
                    <th className="px-4 py-3 w-1/3">Question / Why</th>
                    <th className="px-4 py-3">Answer based on evidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {whyAnalysis.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-medium text-slate-700">{item.step}</td>
                      <td className="p-2"><input className={inputCls} value={item.question} onChange={e => updateWhy(idx, 'question', e.target.value)} /></td>
                      <td className="p-2"><input className={inputCls} value={item.answer} onChange={e => updateWhy(idx, 'answer', e.target.value)} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-start gap-4 mt-4">
              <span className="text-sm text-slate-600 pt-3 whitespace-nowrap">Validated root cause(s):</span>
              <textarea 
                rows={1}
                className={textareaCls + " min-h-[44px] overflow-hidden resize-none"} 
                value={whyValidatedRootCause} 
                onChange={e => setWhyValidatedRootCause(e.target.value)} 
                onInput={(e) => {
                  e.target.style.height = "auto";
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
              />
            </div>
          </SectionCard>

          {/* 14. Ishikawa / Fishbone Analysis */}
          <SectionCard title="14. Ishikawa / Fishbone Analysis (OPTIONAL)">
            <p className="text-sm text-slate-600 mb-3">Use this section when deeper analysis is required. Consider Man, Machine, Method, Material, Environment, Measurement, and Management.</p>
            <textarea 
              rows={1}
              className={textareaCls + " min-h-[44px] overflow-hidden resize-none"} 
              placeholder="Document Ishikawa analysis details here..." 
              value={ishikawaAnalysis} 
              onChange={e => setIshikawaAnalysis(e.target.value)} 
              onInput={(e) => {
                e.target.style.height = "auto";
                e.target.style.height = `${e.target.scrollHeight}px`;
              }}
            />
          </SectionCard>

          {/* 15. CAPA */}
          <SectionCard title="15. CAPA - Corrective and Preventive Action Plan (mandatory)">
            <div className="overflow-x-auto border border-slate-200 rounded-lg mb-4">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 w-12 text-center">No.</th>
                    <th className="px-4 py-3 w-24">Action Type</th>
                    <th className="px-4 py-3 min-w-[200px]">Action Description</th>
                    <th className="px-4 py-3 w-32">Cause Linked</th>
                    <th className="px-4 py-3 w-40">Owner</th>
                    <th className="px-4 py-3 w-40">Target Date</th>
                    <th className="px-4 py-3 w-32">Status</th>
                    <th className="px-4 py-3 w-40">Closure / Evidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {capa.map((action, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 text-center font-medium text-slate-700">{action.no}</td>
                      <td className="px-4 py-2">
                        <div className="flex gap-3">
                          <label className="flex items-center gap-1 cursor-pointer">
                            <input type="checkbox" className="w-4 h-4 accent-primary" checked={action.typeC} onChange={e => updateCapa(idx, 'typeC', e.target.checked)} />
                            <span className="text-xs">C</span>
                          </label>
                          <label className="flex items-center gap-1 cursor-pointer">
                            <input type="checkbox" className="w-4 h-4 accent-primary" checked={action.typeP} onChange={e => updateCapa(idx, 'typeP', e.target.checked)} />
                            <span className="text-xs">P</span>
                          </label>
                        </div>
                      </td>
                      <td className="px-4 py-2"><input className={inputCls} value={action.description} onChange={e => updateCapa(idx, 'description', e.target.value)} /></td>
                      <td className="px-4 py-2"><input className={inputCls} value={action.causeLinked} onChange={e => updateCapa(idx, 'causeLinked', e.target.value)} /></td>
                      <td className="px-4 py-2"><input className={inputCls} value={action.owner} onChange={e => updateCapa(idx, 'owner', e.target.value)} /></td>
                      <td className="px-4 py-2"><input type="date" className={inputCls} value={action.targetDate} onChange={e => updateCapa(idx, 'targetDate', e.target.value)} /></td>
                      <td className="px-4 py-2">
                        <select className={selectCls} value={action.status} onChange={e => updateCapa(idx, 'status', e.target.value)}>
                          <option value="">Select...</option>
                          <option value="Open">Open</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Closed">Closed</option>
                        </select>
                      </td>
                      <td className="px-4 py-2"><input className={inputCls} value={action.closureEvidence} onChange={e => updateCapa(idx, 'closureEvidence', e.target.value)} /></td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50 border-t-2 border-slate-200">
                    <td colSpan="3" className="px-4 py-3 font-bold text-slate-700 text-center border-r border-slate-200">Effectiveness Check Item</td>
                    <td colSpan="2" className="px-4 py-3 font-bold text-slate-700 text-center border-r border-slate-200">Response</td>
                    <td colSpan="2" className="px-4 py-3 font-bold text-slate-700 text-center border-r border-slate-200">Effectiveness check date</td>
                    <td colSpan="2" className="px-4 py-3 font-bold text-slate-700 text-center">Verified by (name / sign)</td>
                  </tr>
                  <tr>
                    <td colSpan="3" className="px-4 py-3 font-medium text-slate-700 border-r border-slate-200">Effectiveness check completed?</td>
                    <td colSpan="2" className="p-3 border-r border-slate-200">
                      <div className="flex gap-4 justify-center">
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input type="radio" name="capaComplete" value="Yes" checked={capaEffectiveness.completed === "Yes"} onChange={e => setCapaEffectiveness({...capaEffectiveness, completed: e.target.value})} className="w-4 h-4 accent-primary" />
                          <span className="text-sm">Yes</span>
                        </label>
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input type="radio" name="capaComplete" value="No" checked={capaEffectiveness.completed === "No"} onChange={e => setCapaEffectiveness({...capaEffectiveness, completed: e.target.value})} className="w-4 h-4 accent-primary" />
                          <span className="text-sm">No</span>
                        </label>
                      </div>
                    </td>
                    <td colSpan="2" className="p-2 border-r border-slate-200"><input type="date" className={inputCls} value={capaEffectiveness.date} onChange={e => setCapaEffectiveness({...capaEffectiveness, date: e.target.value})} /></td>
                    <td colSpan="2" className="p-2"><input className={inputCls} value={capaEffectiveness.verifiedBy} onChange={e => setCapaEffectiveness({...capaEffectiveness, verifiedBy: e.target.value})} /></td>
                  </tr>
                  <tr className="border-t border-slate-200">
                    <td colSpan="3" className="px-4 py-3 font-medium text-slate-700 border-r border-slate-200">If not effective, re-open action no.</td>
                    <td colSpan="2" className="p-2 border-r border-slate-200"><input className={inputCls} value={capaEffectiveness.reopenNo} onChange={e => setCapaEffectiveness({...capaEffectiveness, reopenNo: e.target.value})} /></td>
                    <td colSpan="1" className="px-4 py-3 font-bold text-slate-700 text-center bg-slate-50 border-r border-slate-200">Remarks</td>
                    <td colSpan="3" className="p-2"><textarea className={inputCls + " h-10 py-2"} value={capaEffectiveness.remarks} onChange={e => setCapaEffectiveness({...capaEffectiveness, remarks: e.target.value})} /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </SectionCard>

          {/* 16. Lessons Learned, Communication and Recurrence Prevention */}
          <SectionCard title="16. Lessons Learned, Communication and Recurrence Prevention">
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 w-1/4">Item</th>
                    <th className="px-4 py-3">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  <tr className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-medium text-slate-700 bg-slate-50/50">Key lessons learned</td>
                    <td className="p-2">
                      <textarea 
                        rows={1}
                        className={textareaCls + " min-h-[44px] overflow-hidden resize-none"} 
                        value={lessonsLearned.details} 
                        onChange={e => updateLessons('details', e.target.value)} 
                        onInput={(e) => {
                          e.target.style.height = "auto";
                          e.target.style.height = `${e.target.scrollHeight}px`;
                        }}
                      />
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-medium text-slate-700">Safety alert / toolbox talk required?</td>
                    <td className="p-3">
                      <div className="flex flex-wrap items-center gap-6">
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="safetyAlert" value="Yes" checked={lessonsLearned.safetyAlertReq === "Yes"} onChange={e => updateLessons('safetyAlertReq', e.target.value)} className="w-4 h-4 accent-primary" />
                            <span className="text-sm">Yes</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="safetyAlert" value="No" checked={lessonsLearned.safetyAlertReq === "No"} onChange={e => updateLessons('safetyAlertReq', e.target.value)} className="w-4 h-4 accent-primary" />
                            <span className="text-sm">No</span>
                          </label>
                        </div>
                        <div className="flex-1 min-w-[200px] flex items-center gap-2">
                          <span className="text-sm text-slate-600 whitespace-nowrap">Specify Details:</span>
                          <textarea 
                            rows={1}
                            className={textareaCls + " min-h-[44px] overflow-hidden resize-none"} 
                            value={lessonsLearned.safetyAlertDetails} 
                            onChange={e => updateLessons('safetyAlertDetails', e.target.value)} 
                            onInput={(e) => {
                              e.target.style.height = "auto";
                              e.target.style.height = `${e.target.scrollHeight}px`;
                            }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-medium text-slate-700">Communication audience</td>
                    <td className="p-2">
                      <textarea 
                        rows={1}
                        className={textareaCls + " min-h-[44px] overflow-hidden resize-none"} 
                        value={lessonsLearned.audience} 
                        onChange={e => updateLessons('audience', e.target.value)} 
                        onInput={(e) => {
                          e.target.style.height = "auto";
                          e.target.style.height = `${e.target.scrollHeight}px`;
                        }}
                      />
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-medium text-slate-700">Communication date and by whom</td>
                    <td className="p-2">
                      <textarea 
                        rows={1}
                        className={textareaCls + " min-h-[44px] overflow-hidden resize-none"} 
                        value={lessonsLearned.dateWhom} 
                        onChange={e => updateLessons('dateWhom', e.target.value)} 
                        onInput={(e) => {
                          e.target.style.height = "auto";
                          e.target.style.height = `${e.target.scrollHeight}px`;
                        }}
                      />
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-medium text-slate-700">Additional monitoring / audit required</td>
                    <td className="p-2">
                      <textarea 
                        rows={1}
                        className={textareaCls + " min-h-[44px] overflow-hidden resize-none"} 
                        value={lessonsLearned.monitoringRequired} 
                        onChange={e => updateLessons('monitoringRequired', e.target.value)} 
                        onInput={(e) => {
                          e.target.style.height = "auto";
                          e.target.style.height = `${e.target.scrollHeight}px`;
                        }}
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </SectionCard>

          {/* 17. Photo Record */}
          <SectionCard title="17. Photo Record (attach photos and mark references)">
            <div className="overflow-x-auto border border-slate-200 rounded-lg mb-4">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 w-16 text-center">Sl No.</th>
                    <th className="px-4 py-3 w-32">Upload</th>
                    <th className="px-4 py-3 min-w-[300px]">Description</th>
                    <th className="px-4 py-3 w-20 text-center">Delete</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {photoRecords.map((photo, idx) => (
                    <tr key={photo.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 text-center font-medium text-slate-700">{idx + 1}</td>
                      <td className="px-4 py-2">
                        <FileUploadControl files={photo.fileRef ? [{ name: photo.fileRef }] : []} onFilesChange={(files) => updatePhoto(idx, 'fileRef', files.length > 0 ? files[0].name : '')} />
                      </td>
                      <td className="px-4 py-2">
                        <textarea 
                          rows={1}
                          className={textareaCls + " min-h-[44px] overflow-hidden resize-none"} 
                          placeholder="Enter caption..." 
                          value={photo.caption} 
                          onChange={e => updatePhoto(idx, 'caption', e.target.value)} 
                          onInput={(e) => {
                            e.target.style.height = "auto";
                            e.target.style.height = `${e.target.scrollHeight}px`;
                          }}
                        />
                      </td>
                      <td className="px-4 py-2 text-center">
                        <button type="button" onClick={() => removePhotoRecord(idx)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors" title="Delete Row">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-start">
              <button type="button" onClick={addPhotoRecord} className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors">
                <Plus className="w-4 h-4" /> Add Row
              </button>
            </div>
          </SectionCard>

          {/* 18. Investigation Completion Checklist */}
          <SectionCard title="18. Investigation Completion Checklist">
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 w-1/2">Checklist Item</th>
                    <th className="px-4 py-3 text-center w-40">Done (Y / N / NA)</th>
                    <th className="px-4 py-3 min-w-[200px]">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {completionChecklist.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="px-4 py-2 font-medium text-slate-700">{item.item}</td>
                      <td className="p-2 text-center">
                        <select className={selectCls} value={item.done} onChange={e => updateChecklist(idx, 'done', e.target.value)}>
                          <option value="">Select...</option>
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                          <option value="NA">NA</option>
                        </select>
                      </td>
                      <td className="p-2"><input className={inputCls} value={item.remarks} onChange={e => updateChecklist(idx, 'remarks', e.target.value)} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>

          {/* 19. Scene Sketch */}
          <SectionCard title="19. Scene Sketch / Plan View Facility (MANDATORY for significant events)">
            <p className="text-sm text-slate-600 mb-3 font-medium">DRAW SKETCH HERE - Include positions of people, equipment, travel path, barriers, spill area, point of impact, north direction, legend, and measurements where possible.</p>
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-10 flex flex-col items-center justify-center bg-slate-50/50 hover:bg-slate-50 transition-colors min-h-[300px]">
              {sceneSketch ? (
                <div className="flex flex-col items-center gap-3">
                  <FileText className="w-12 h-12 text-primary opacity-80" />
                  <span className="text-sm font-medium text-slate-700">{sceneSketch}</span>
                  <button type="button" onClick={() => setSceneSketch("")} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 mt-2">
                    <Trash2 className="w-3 h-3" /> Remove File
                  </button>
                </div>
              ) : (
                <>
                  <FileUploadControl files={sceneSketch ? [{ name: sceneSketch }] : []} onFilesChange={(files) => setSceneSketch(files.length > 0 ? files[0].name : '')} />
                  <p className="text-sm text-slate-500 mt-4 text-center max-w-md">Upload a scanned sketch, plan view, or digital drawing of the incident scene.</p>
                </>
              )}
            </div>
          </SectionCard>

          {/* 20. Final Approval, Closure and Sign-off */}
          <SectionCard title="20. Final Approval, Closure and Sign-off">
            <div className="overflow-x-auto border border-slate-200 rounded-lg mb-4">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Descriptions</th>
                    <th className="px-4 py-3 min-w-[200px]">Organisation</th>
                    <th className="px-4 py-3 min-w-[200px]">Name</th>
                    <th className="px-4 py-3 min-w-[200px]">Designation</th>
                    <th className="px-4 py-3 min-w-[200px]">Date & Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {finalApproval.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-bold text-slate-700 bg-slate-50/50">{row.desc}</td>
                      <td className="p-2"><input className={inputCls} value={row.org} onChange={e => updateApproval(idx, 'org', e.target.value)} /></td>
                      <td className="p-2"><input className={inputCls} value={row.name} onChange={e => updateApproval(idx, 'name', e.target.value)} /></td>
                      <td className="p-2"><input className={inputCls} value={row.designation} onChange={e => updateApproval(idx, 'designation', e.target.value)} /></td>
                      <td className="p-2"><input type="datetime-local" className={inputCls} value={row.date} onChange={e => updateApproval(idx, 'date', e.target.value)} /></td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-slate-200 bg-slate-50">
                    <td colSpan="2" className="p-4 border-r border-slate-200">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-slate-700 whitespace-nowrap">Investigation Closeout Date:</span>
                        <input type="date" className={inputCls + " max-w-[200px]"} value={closeoutDetails.date} onChange={e => setCloseoutDetails({...closeoutDetails, date: e.target.value})} />
                      </div>
                    </td>
                    <td colSpan="3" className="p-4">
                      <div className="flex items-start gap-3 w-full">
                        <span className="font-bold text-slate-700 whitespace-nowrap pt-2">Final comments / Limitations / Pending items:</span>
                        <textarea 
                          rows={1}
                          className={textareaCls.replace('min-h-[100px]', '') + " flex-1 w-full overflow-hidden resize-none"} 
                          onInput={(e) => {
                            e.target.style.height = 'auto';
                            e.target.style.height = e.target.scrollHeight + 'px';
                          }}
                          value={closeoutDetails.comments} 
                          onChange={e => setCloseoutDetails({...closeoutDetails, comments: e.target.value})} 
                        />
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </SectionCard>

        </form>
      </div>
      
      {/* Actions Footer */}
      <div className="bg-slate-50 p-5 border-t border-slate-200 flex justify-end gap-3">
        <button type="button" onClick={onBack} className="px-5 py-2.5 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition">
          Cancel
        </button>
        <button type="button" className="px-6 py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:opacity-90 shadow-sm transition">
          Submit Investigation
        </button>
      </div>
    </div>
  );
}
