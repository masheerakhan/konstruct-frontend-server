// src/pages/DCPProposal.jsx
// or src/App.jsx

import { useState } from "react";
import { Trash2 } from "lucide-react";

const defaultForm = {
    typeOfChange: "Amendment",
    dcrRefNo: "",
    project: "Project Alpha",
    location: "",
    position: "",
    company: "",
    reviewDecision: "",
    effectiveImplementationDate: "",
};

const defaultRow = {
    docRef: "DOC-001",
    documentDescription: "",
    revisionFrom: "A",
    revisionTo: "B",
    summaryOfProposedChange: "",
    reasonForChange: "",
};

export default function DCPProposal() {
    const [form, setForm] = useState(defaultForm);
    const [rows, setRows] = useState([defaultRow]);
    const [errors, setErrors] = useState({});
    const [toast, setToast] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const showToast = (type, title, description) => {
        setToast({ type, title, description });

        setTimeout(() => {
            setToast(null);
        }, 3000);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));

        setErrors((prev) => ({
            ...prev,
            [name]: "",
        }));
    };

    const handleRowChange = (index, field, value) => {
        const updatedRows = [...rows];

        updatedRows[index] = {
            ...updatedRows[index],
            [field]: value,
        };

        setRows(updatedRows);

        setErrors((prev) => ({
            ...prev,
            rows: "",
        }));
    };

    const addRow = () => {
        setRows((prev) => [
            ...prev,
            {
                docRef: "",
                documentDescription: "",
                revisionFrom: "",
                revisionTo: "",
                summaryOfProposedChange: "",
                reasonForChange: "",
            },
        ]);
    };

    const deleteRow = (index) => {
        if (rows.length === 1) {
            showToast("error", "At least one row required", "You cannot delete the last document row.");
            return;
        }

        const updatedRows = rows.filter((_, rowIndex) => rowIndex !== index);
        setRows(updatedRows);
    };

    const validateForm = () => {
        const newErrors = {};

        if (!form.typeOfChange.trim()) {
            newErrors.typeOfChange = "Type of change is required";
        }

        if (!form.dcrRefNo.trim()) {
            newErrors.dcrRefNo = "DCR reference number is required";
        }

        if (!form.project.trim()) {
            newErrors.project = "Project is required";
        }

        const hasInvalidRow = rows.some((row) => {
            return (
                !row.docRef.trim() ||
                !row.documentDescription.trim() ||
                !row.revisionFrom.trim() ||
                !row.revisionTo.trim() ||
                !row.summaryOfProposedChange.trim() ||
                !row.reasonForChange.trim()
            );
        });

        if (hasInvalidRow) {
            newErrors.rows = "Please complete all document change row fields";
        }

        setErrors(newErrors);

        return Object.keys(newErrors).length === 0;
    };

    const resetForm = () => {
        setForm(defaultForm);
        setRows([defaultRow]);
        setErrors({});
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            showToast("error", "Please complete the required fields", "Some fields are missing or empty.");
            return;
        }

        setIsSubmitting(true);

        const payload = {
            ...form,
            proposedChanges: rows,
        };

        console.log("Final DCP Payload:", payload);

        setTimeout(() => {
            setIsSubmitting(false);

            showToast(
                "success",
                "Change proposal submitted",
                `${form.dcrRefNo} sent to QHSE Head for review.`
            );

            resetForm();
        }, 500);
    };

    return (
        <div className="min-h-screen bg-[#f7f9fc] text-slate-900">
            {toast && (
                <div
                    className={`fixed right-5 top-5 z-50 w-[330px] rounded-lg border px-4 py-3 shadow-lg ${toast.type === "success"
                        ? "border-green-200 bg-green-50 text-green-800"
                        : "border-red-200 bg-red-50 text-red-800"
                        }`}
                >
                    <p className="text-sm font-semibold">{toast.title}</p>
                    <p className="mt-1 text-xs">{toast.description}</p>
                </div>
            )}

            <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                        Document Change Proposal
                    </h1>
                    <p className="mt-1 text-sm text-slate-600">
                        Submit a request to amend, add, or delete controlled documents.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 pb-24 sm:pb-6">
                    {/* Section 1 */}
                    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="mb-4 flex items-start gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-400 text-sm font-semibold text-white">
                                1
                            </div>

                            <div>
                                <h2 className="text-lg font-semibold text-slate-900">Request Details</h2>
                                <p className="mt-1 text-sm text-slate-600">
                                    Identify the change request and the requester.
                                </p>
                            </div>
                        </div>

                        <div className="mb-5 border-t border-slate-200" />

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-900">
                                    Type of Change <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="typeOfChange"
                                    value={form.typeOfChange}
                                    onChange={handleInputChange}
                                    className="h-10 w-full rounded-md border border-slate-300 bg-slate-50 px-3 text-sm outline-none focus:border-blue-700 focus:ring-1 focus:ring-blue-700"
                                >
                                    <option value="Amendment">Amendment</option>
                                    <option value="Addition">Addition</option>
                                    <option value="Deletion">Deletion</option>
                                </select>
                                {errors.typeOfChange && (
                                    <p className="mt-1 text-xs text-red-600">{errors.typeOfChange}</p>
                                )}
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-900">
                                    DCR Reference No. <span className="text-red-500">*</span>
                                </label>
                                <input
                                    name="dcrRefNo"
                                    value={form.dcrRefNo}
                                    onChange={handleInputChange}
                                    placeholder="e.g. DCR-2025-0142"
                                    className="h-10 w-full rounded-md border border-slate-300 bg-slate-50 px-3 text-sm outline-none placeholder:text-slate-400 focus:border-blue-700 focus:ring-1 focus:ring-blue-700"
                                />
                                {errors.dcrRefNo && (
                                    <p className="mt-1 text-xs text-red-600">{errors.dcrRefNo}</p>
                                )}
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-900">
                                    Project <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="project"
                                    value={form.project}
                                    onChange={handleInputChange}
                                    className="h-10 w-full rounded-md border border-slate-300 bg-slate-50 px-3 text-sm outline-none focus:border-blue-700 focus:ring-1 focus:ring-blue-700"
                                >
                                    <option value="Project Alpha">Project Alpha</option>
                                    <option value="Project Beta">Project Beta</option>
                                    <option value="Project Gamma">Project Gamma</option>
                                </select>
                                {errors.project && (
                                    <p className="mt-1 text-xs text-red-600">{errors.project}</p>
                                )}
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-900">
                                    Location
                                </label>
                                <input
                                    name="location"
                                    value={form.location}
                                    onChange={handleInputChange}
                                    placeholder="e.g. Site A — Riyadh"
                                    className="h-10 w-full rounded-md border border-slate-300 bg-slate-50 px-3 text-sm outline-none placeholder:text-slate-400 focus:border-blue-700 focus:ring-1 focus:ring-blue-700"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-900">
                                    Position
                                </label>
                                <input
                                    name="position"
                                    value={form.position}
                                    onChange={handleInputChange}
                                    placeholder="e.g. Project Engineer"
                                    className="h-10 w-full rounded-md border border-slate-300 bg-slate-50 px-3 text-sm outline-none placeholder:text-slate-400 focus:border-blue-700 focus:ring-1 focus:ring-blue-700"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-900">
                                    Company
                                </label>
                                <input
                                    name="company"
                                    value={form.company}
                                    onChange={handleInputChange}
                                    placeholder="e.g. Acme Industrial Ltd."
                                    className="h-10 w-full rounded-md border border-slate-300 bg-slate-50 px-3 text-sm outline-none placeholder:text-slate-400 focus:border-blue-700 focus:ring-1 focus:ring-blue-700"
                                />
                            </div>
                        </div>
                    </section>

                    {/* Section 2 */}
                    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="mb-4 flex items-start gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-400 text-sm font-semibold text-white">
                                2
                            </div>

                            <div>
                                <h2 className="text-lg font-semibold text-slate-900">Proposed Changes</h2>
                                <p className="mt-1 text-sm text-slate-600">
                                    List each document affected by this change request.
                                </p>
                            </div>
                        </div>

                        <div className="mb-5 border-t border-slate-200" />

                        <div className="overflow-x-auto rounded-lg border border-slate-300">
                            <table className="min-w-[950px] w-full border-collapse text-sm">
                                <thead>
                                    <tr className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
                                        <th className="border-b border-slate-300 px-3 py-3 text-left">SL.</th>
                                        <th className="border-b border-slate-300 px-3 py-3 text-left">Doc. Ref.</th>
                                        <th className="border-b border-slate-300 px-3 py-3 text-left">
                                            Document Description
                                        </th>
                                        <th
                                            colSpan="2"
                                            className="border-b border-slate-300 px-3 py-3 text-center"
                                        >
                                            Revision
                                        </th>
                                        <th className="border-b border-slate-300 px-3 py-3 text-left">
                                            Summary of Proposed Change
                                        </th>
                                        <th className="border-b border-slate-300 px-3 py-3 text-left">
                                            Reason for Change
                                        </th>
                                        <th className="border-b border-slate-300 px-3 py-3 text-center"></th>
                                    </tr>

                                    <tr className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
                                        <th className="border-b border-slate-300 px-3 py-2"></th>
                                        <th className="border-b border-slate-300 px-3 py-2"></th>
                                        <th className="border-b border-slate-300 px-3 py-2"></th>
                                        <th className="border-b border-slate-300 px-3 py-2 text-center">From</th>
                                        <th className="border-b border-slate-300 px-3 py-2 text-center">To</th>
                                        <th className="border-b border-slate-300 px-3 py-2"></th>
                                        <th className="border-b border-slate-300 px-3 py-2"></th>
                                        <th className="border-b border-slate-300 px-3 py-2"></th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {rows.map((row, index) => (
                                        <tr key={index} className="align-top">
                                            <td className="border-b border-slate-200 px-3 py-4 text-center text-slate-700">
                                                {index + 1}
                                            </td>

                                            <td className="border-b border-slate-200 px-3 py-4">
                                                <input
                                                    value={row.docRef}
                                                    onChange={(e) =>
                                                        handleRowChange(index, "docRef", e.target.value)
                                                    }
                                                    placeholder="DOC-001"
                                                    className="h-9 w-full rounded-md border border-slate-300 bg-slate-50 px-3 text-sm outline-none focus:border-blue-700 focus:ring-1 focus:ring-blue-700"
                                                />
                                            </td>

                                            <td className="border-b border-slate-200 px-3 py-4">
                                                <textarea
                                                    value={row.documentDescription}
                                                    onChange={(e) =>
                                                        handleRowChange(
                                                            index,
                                                            "documentDescription",
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="Document title / description"
                                                    rows="2"
                                                    className="w-full resize-y rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-blue-700 focus:ring-1 focus:ring-blue-700"
                                                />
                                            </td>

                                            <td className="border-b border-slate-200 px-3 py-4">
                                                <input
                                                    value={row.revisionFrom}
                                                    onChange={(e) =>
                                                        handleRowChange(index, "revisionFrom", e.target.value)
                                                    }
                                                    placeholder="A"
                                                    className="h-9 w-16 rounded-md border border-slate-300 bg-slate-50 px-3 text-center text-sm outline-none focus:border-blue-700 focus:ring-1 focus:ring-blue-700"
                                                />
                                            </td>

                                            <td className="border-b border-slate-200 px-3 py-4">
                                                <input
                                                    value={row.revisionTo}
                                                    onChange={(e) =>
                                                        handleRowChange(index, "revisionTo", e.target.value)
                                                    }
                                                    placeholder="B"
                                                    className="h-9 w-16 rounded-md border border-slate-300 bg-slate-50 px-3 text-center text-sm outline-none focus:border-blue-700 focus:ring-1 focus:ring-blue-700"
                                                />
                                            </td>

                                            <td className="border-b border-slate-200 px-3 py-4">
                                                <textarea
                                                    value={row.summaryOfProposedChange}
                                                    onChange={(e) =>
                                                        handleRowChange(
                                                            index,
                                                            "summaryOfProposedChange",
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="What is changing?"
                                                    rows="2"
                                                    className="w-full resize-y rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-blue-700 focus:ring-1 focus:ring-blue-700"
                                                />
                                            </td>

                                            <td className="border-b border-slate-200 px-3 py-4">
                                                <textarea
                                                    value={row.reasonForChange}
                                                    onChange={(e) =>
                                                        handleRowChange(index, "reasonForChange", e.target.value)
                                                    }
                                                    placeholder="Why this change?"
                                                    rows="2"
                                                    className="w-full resize-y rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-blue-700 focus:ring-1 focus:ring-blue-700"
                                                />
                                            </td>

                                            <td className="border-b border-slate-200 px-3 py-4 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => deleteRow(index)}
                                                    className="rounded-md px-2 py-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                                                    title="Delete row"
                                                >
                                                    <Trash2 size={17} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {errors.rows && <p className="mt-2 text-xs text-red-600">{errors.rows}</p>}

                        <div className="mt-4 flex items-center justify-between">
                            <p className="text-xs text-slate-600">
                                {rows.length} {rows.length === 1 ? "item" : "items"}
                            </p>

                            <button
                                type="button"
                                onClick={addRow}
                                className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
                            >
                                <span className="text-lg leading-none">+</span>
                                Add row
                            </button>
                        </div>
                    </section>

                    {/* Section 3 */}
                    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="mb-4 flex items-start gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-400 text-sm font-semibold text-white">
                                3
                            </div>

                            <div>
                                <h2 className="text-lg font-semibold text-slate-900">QHSE Review</h2>

                                <span className="mt-2 inline-block rounded-md bg-blue-50 px-3 py-1 text-xs font-medium text-blue-800">
                                    To be filled in by QHSE Head
                                </span>
                            </div>
                        </div>

                        <div className="mb-5 border-t border-slate-200" />

                        <p className="mb-4 text-sm text-slate-600">
                            These fields are completed by the QHSE Head on the dedicated review screen.
                            Shown here for visibility only.
                        </p>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-900">
                                    Review Decision
                                </label>
                                <select
                                    name="reviewDecision"
                                    value={form.reviewDecision}
                                    disabled
                                    className="h-10 w-full cursor-not-allowed rounded-md border border-slate-300 bg-slate-50 px-3 text-sm text-slate-400 outline-none"
                                >
                                    <option value="">Select decision</option>
                                    <option value="Approved">Approved</option>
                                    <option value="Rejected">Rejected</option>
                                    <option value="Need Clarification">Need Clarification</option>
                                </select>
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-900">
                                    Effective Implementation Date
                                </label>
                                <input
                                    type="date"
                                    name="effectiveImplementationDate"
                                    value={form.effectiveImplementationDate}
                                    disabled
                                    className="h-10 w-full cursor-not-allowed rounded-md border border-slate-300 bg-slate-50 px-3 text-sm text-slate-400 outline-none"
                                />
                            </div>
                        </div>
                    </section>

                    {/* Submit Buttons */}
                    <div className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:static sm:flex sm:justify-end sm:border-0 sm:bg-transparent sm:px-0 sm:py-0">
                        <div className="mx-auto flex max-w-6xl items-center justify-end gap-2 sm:max-w-none">
                            <button
                                type="button"
                                onClick={resetForm}
                                disabled={isSubmitting}
                                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                Reset
                            </button>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="min-w-[140px] rounded-md bg-orange-400 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {isSubmitting ? "Submitting..." : "Submit Proposal"}
                            </button>
                        </div>
                    </div>
                </form>
            </main>
        </div>
    );
}