import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import FileUpload from "../FileUpload";
import SignaturePadInput from "../SignaturePadInput";
import { ArrowLeft, Save, Send, ShieldAlert, X } from "lucide-react";

export default function NCRCreatePage() {
    const navigate = useNavigate();

    // Mock user and data
    const user = { name: "Current User" };
    const makers = [
        { id: "1", name: "Alice Maker", designation: "Site Engineer" },
        { id: "2", name: "Bob Maker", designation: "Site Engineer" }
    ];
    const projects = [
        { id: "p1", name: "Project Alpha" },
        { id: "p2", name: "Project Beta" }
    ];

    const [attachments, setAttachments] = useState([]);
    const [signature, setSignature] = useState("");
    const [showSigModal, setShowSigModal] = useState(false);
    const [modalSignature, setModalSignature] = useState("");
    const [saving, setSaving] = useState(false);

    const [values, setValues] = useState({
        doc_no: `ADL/QA/NCR/IMF/08`,
        date: new Date().toISOString().slice(0, 10),
        related_to: "",
        classification: "major",
        identification: "",
        tower_id: "",
        project_id: "",
        root_cause: "",
        correction: "",
        corrective_action: "",
        preventive_action: "",
        follow_up_responsibility: "",
        verification_responsibility: "",
        assigned_to: "",
        target_date: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setValues((prev) => ({ ...prev, [name]: value }));
    };



    const submitNCR = async (draft) => {
        if (!draft && !signature) {
            setShowSigModal(true);
            return;
        }

        // Basic manual validation matching standard HTML required attributes
        if (!draft) {
            const requiredFields = [
                'date', 'related_to', 'identification', 'tower_id',
                'root_cause', 'correction', 'corrective_action',
                'follow_up_responsibility', 'verification_responsibility',
                'assigned_to', 'target_date'
            ];
            const missing = requiredFields.filter(f => !values[f] || values[f].trim() === "");
            if (missing.length > 0) {
                toast.error("Please fill in all required fields.");
                return;
            }
        }

        setSaving(true);
        try {
            // Mock API Submission
            await new Promise((resolve) => setTimeout(resolve, 1000));
            const payload = {
                ...values,
                attachments,
                signature: signature || null,
                save_as_draft: !!draft,
            };
            console.log("Submitting:", payload);

            toast.success(draft ? "Draft saved" : "NCR submitted for approval");
            navigate(`/ncr/mock-id-123`);
        } catch (e) {
            toast.error("An error occurred");
        } finally {
            setSaving(false);
        }
    };

    const onSaveDraft = () => submitNCR(true);

    const onSubmitForm = (e) => {
        e.preventDefault(); // Prevent standard form submission
        if (!signature) {
            setShowSigModal(true);
            return;
        }
        submitNCR(false);
    };

    const confirmSignature = async () => {
        if (!modalSignature) return toast.error("Please provide a signature");
        setSignature(modalSignature);
        setShowSigModal(false);
        setTimeout(() => {
            submitNCR(false);
        }, 50);
    };

    return (
        <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-8">
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                    <button onClick={() => navigate(-1)} className="text-sm text-slate-500 hover:text-slate-900 inline-flex items-center gap-1 mb-2" data-testid="back-btn">
                        <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                    <h1 className="text-3xl font-display font-bold tracking-tight text-slate-900" data-testid="ncr-create-title">Create Non-Conformity Report</h1>
                    <p className="text-sm text-slate-500 mt-1">Complete all sections and submit for Project Head approval</p>
                </div>

            </div>

            <form id="ncr-form" className="space-y-6" onSubmit={onSubmitForm}>
                {/* Section A */}
                <Section title="A. Basic Information" step="A">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Field label="Doc No" testId="field-doc-no">
                            <input type="text" disabled name="doc_no" value={values.doc_no} onChange={handleChange} className="flex h-9 w-full rounded-md border border-slate-200 bg-slate-100 px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50 text-slate-500" data-testid="input-doc-no" />
                        </Field>
                        <Field label="Date" required testId="field-date">
                            <input type="date" name="date" value={values.date} onChange={handleChange} className="flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50" required data-testid="input-date" />
                        </Field>
                        <Field label="NCR No" testId="field-ncr-no">
                            <input type="text" disabled value="Auto-generated on submit" className="flex h-9 w-full rounded-md border border-slate-200 bg-slate-100 px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50 text-slate-500" data-testid="input-ncr-no" />
                        </Field>
                        <Field label="Non-Conformity Related To" required testId="field-related-to">
                            <input type="text" name="related_to" value={values.related_to} onChange={handleChange} placeholder="e.g. Concrete Work, Safety, Material Inspection" className="flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50" required data-testid="input-related-to" />
                        </Field>
                        <Field label="Classification" required testId="field-classification">
                            <div className="flex gap-6 pt-2">
                                <label className="flex items-center gap-2 cursor-pointer group" data-testid="radio-major">
                                    <input type="radio" name="classification" value="major" checked={values.classification === "major"} onChange={handleChange} className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500" />
                                    <span className="text-red-600 font-medium">Major</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer group" data-testid="radio-minor">
                                    <input type="radio" name="classification" value="minor" checked={values.classification === "minor"} onChange={handleChange} className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500" />
                                    <span className="text-green-600 font-medium">Minor</span>
                                </label>
                            </div>
                        </Field>
                        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Field label="Project" testId="field-project">
                                <select name="project_id" value={values.project_id} onChange={handleChange} className="flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50" data-testid="select-project">
                                    <option value="">Select project</option>
                                    {(projects || []).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </Field>
                            <Field label="Tower" required testId="field-tower">
                                <select name="tower_id" value={values.tower_id} onChange={handleChange} className="flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50" required data-testid="select-tower">
                                    <option value="">Select tower</option>
                                    <option value="t1">Tower A</option>
                                    <option value="t2">Tower B</option>
                                    <option value="t3">Tower C</option>
                                </select>
                            </Field>
                        </div>
                        <Field label="Identification of Non-Conformance" required testId="field-identification" className="md:col-span-2">
                            <textarea rows={3} name="identification" value={values.identification} onChange={handleChange} placeholder="Describe the non-conformance in detail" className="flex min-h-[60px] w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50" required data-testid="input-identification" />
                        </Field>
                    </div>
                </Section>

                {/* Section B */}
                <Section title="B. Root Cause Analysis" step="B">
                    <Field label="Root Cause Analysis" required testId="field-root-cause">
                        <NumberedTextArea rows={4} name="root_cause" value={values.root_cause} onChange={handleChange} placeholder="Explain the root cause" required testId="input-root-cause" />
                    </Field>
                    <div className="mt-6">
                        <Field label="Attachments (Photos / PDF)" testId="field-attachments">
                            <FileUpload value={attachments} onChange={setAttachments} testId="attach-upload" />
                        </Field>
                    </div>
                </Section>

                {/* Section C */}
                <Section title="C. Correction Details" step="C">
                    <div className="grid grid-cols-1 gap-6">
                        <Field label="Correction" required testId="field-correction">
                            <textarea rows={3} name="correction" value={values.correction} onChange={handleChange} placeholder="Immediate correction taken" className="flex min-h-[60px] w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50" required data-testid="input-correction" />
                        </Field>
                        <Field label="Corrective Action" required testId="field-corrective-action">
                            <NumberedTextArea rows={3} name="corrective_action" value={values.corrective_action} onChange={handleChange} required testId="input-corrective-action" />
                        </Field>
                        <Field label="Preventive Action" testId="field-preventive-action">
                            <NumberedTextArea rows={3} name="preventive_action" value={values.preventive_action} onChange={handleChange} testId="input-preventive-action" />
                        </Field>
                    </div>
                </Section>

                {/* Section D */}
                <Section title="D. Responsibility & Assignment" step="D">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Field label="Follow-up Responsibility" required testId="field-followup">
                            <input type="text" name="follow_up_responsibility" value={values.follow_up_responsibility} onChange={handleChange} placeholder="e.g. Site Engineer" className="flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50" required data-testid="input-followup" />
                        </Field>
                        <Field label="Verification Responsibility" required testId="field-verification">
                            <input type="text" name="verification_responsibility" value={values.verification_responsibility} onChange={handleChange} placeholder="e.g. QA/QC Engineer" className="flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50" required data-testid="input-verification" />
                        </Field>
                        <Field label="Assign to (Maker)" required testId="field-assignee">
                            <select name="assigned_to" value={values.assigned_to} onChange={handleChange} className="flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50" required data-testid="select-assignee">
                                <option value="">Select Site Engineer</option>
                                {(makers || []).map((u) => <option key={u.id} value={u.id}>{u.name} — {u.designation || "Site Engineer"}</option>)}
                            </select>
                        </Field>
                        <Field label="Target Date of Compliance" required testId="field-target-date">
                            <input type="date" name="target_date" value={values.target_date} onChange={handleChange} min={new Date().toISOString().slice(0, 10)} className="flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50" required data-testid="input-target-date" />
                        </Field>
                    </div>
                </Section>

                {/* Section E */}
                {/* <Section title="E. Submission" step="E">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Field label="Submitted By" testId="field-submitted-by">
                            <input type="text" disabled value={user?.name || ""} className="flex h-9 w-full rounded-md border border-slate-200 bg-slate-100 px-3 py-1 text-sm shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 text-slate-500" />
                        </Field>
                        <Field label="Submitted Date" testId="field-submitted-date">
                            <input type="text" disabled value={new Date().toLocaleString("en-GB")} className="flex h-9 w-full rounded-md border border-slate-200 bg-slate-100 px-3 py-1 text-sm shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 text-slate-500" />
                        </Field>
                        <div className="md:col-span-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-1 mb-2">
                                Digital Signature <span className="text-red-500">*</span>
                            </label>
                            <SignaturePadInput value={signature} onChange={setSignature} testId="creator-signature" />
                        </div>
                    </div>
                </Section> */}
                <div className="flex justify-end items-center gap-4 pt-4 border-t border-slate-200">
                    <button
                        type="button"
                        onClick={onSaveDraft}
                        disabled={saving}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-slate-200 bg-white hover:bg-slate-100 hover:text-slate-900 h-10 px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        data-testid="save-draft-btn"
                    >
                        <Save className="w-4 h-4 mr-2" /> Save Draft
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-blue-600 text-white hover:bg-blue-700 h-10 px-6 py-2 shadow disabled:opacity-50 disabled:cursor-not-allowed"
                        data-testid="submit-ncr-btn"
                    >
                        <Send className="w-4 h-4 mr-2" /> Submit
                    </button>
                </div>
            </form>

            {/* Tailwind native modal for digital signature */}
            {showSigModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
                        onClick={() => setShowSigModal(false)}
                    />
                    {/* Dialog Content */}
                    <div
                        className="relative z-50 w-full max-w-lg bg-white rounded-lg shadow-lg border border-slate-200 flex flex-col mx-4"
                        data-testid="sig-modal"
                    >
                        <div className="flex flex-col space-y-1.5 p-6 pb-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold leading-none tracking-tight flex items-center gap-2">
                                    <ShieldAlert className="w-5 h-5 text-blue-600" />
                                    Digital signature required
                                </h2>
                                <button
                                    onClick={() => setShowSigModal(false)}
                                    className="rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:pointer-events-none"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <p className="text-sm text-slate-500 pt-2">
                                Please sign below to confirm submission of this NCR.
                            </p>
                        </div>
                        <div className="p-6 pt-0">
                            <SignaturePadInput value={modalSignature} onChange={setModalSignature} testId="modal-signature" />
                        </div>
                        <div className="flex items-center justify-end gap-2 p-6 pt-0">
                            <button
                                type="button"
                                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-slate-200 bg-white hover:bg-slate-100 hover:text-slate-900 h-9 px-4 py-2"
                                onClick={() => setShowSigModal(false)}
                                data-testid="sig-cancel"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-blue-600 text-white hover:bg-blue-700 h-9 px-4 py-2 shadow"
                                onClick={confirmSignature}
                                data-testid="sig-confirm"
                            >
                                Confirm &amp; Submit
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function Section({ title, step, children }) {
    return (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 bg-slate-50 border-b border-slate-200">
                <div className="w-8 h-8 rounded-md bg-blue-600 text-white font-display font-bold text-sm flex items-center justify-center">{step}</div>
                <div className="text-sm font-semibold text-slate-900 font-display">{title}</div>
            </div>
            <div className="p-6">{children}</div>
        </div>
    );
}

function Field({ label, required, testId, children, className = "" }) {
    return (
        <div className={className} data-testid={testId}>
            <label className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 block mb-2 ${required ? "flex items-center gap-1" : ""}`}>
                {label}
                {required && <span className="text-red-500">*</span>}
            </label>
            {children}
        </div>
    );
}

function NumberedTextArea({ name, value, onChange, placeholder, required, rows = 3, className = "", testId }) {
    const textareaRef = React.useRef(null);

    const onValChange = (e) => {
        let val = e.target.value;
        if (val.length === 1 && value === "") {
            val = "1. " + val;
        }
        onChange({ target: { name, value: val } });
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const el = textareaRef.current;
            if (!el) return;
            const start = el.selectionStart;
            const end = el.selectionEnd;
            const val = el.value;

            const textBefore = val.substring(0, start);
            const textAfter = val.substring(end);

            const lines = textBefore.split('\n');
            const nextNum = lines.length + 1;
            const insertText = `\n${nextNum}. `;

            const newValue = textBefore + insertText + textAfter;

            onChange({ target: { name, value: newValue } });

            setTimeout(() => {
                if (el) {
                    el.selectionStart = el.selectionEnd = start + insertText.length;
                }
            }, 0);
        }
    };

    return (
        <textarea
            ref={textareaRef}
            rows={rows}
            name={name}
            value={value}
            onChange={onValChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={`flex min-h-[60px] w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
            required={required}
            data-testid={testId}
        />
    );
}

