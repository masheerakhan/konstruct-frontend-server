import React, { useState, useEffect } from "react";

const INITIAL_OBSERVATION_QUESTIONS = [
    {
        id: "obs-1",
        title: "1. WHAT UNSAFE ACT / CONDITION OBSERVED-",
        type: "dropdown_with_secondary",
        required: true,
        photo_required: false,
        description: "",
        options: ["UNSAFE ACT & CONDITION OBSERVED"],
        has_secondary: true,
        secondary_type: "short_answer",
    },
    {
        id: "obs-2",
        title: "2. LOCATION-",
        type: "location_combined",
        required: true,
        photo_required: false,
        description: "",
    },
    {
        id: "obs-3",
        title: "3. PHOTOGRAPH OF UNSAFE ACT / CONDITION-",
        type: "file_upload",
        required: true,
        photo_required: true,
        description: "",
    },
    {
        id: "obs-4",
        title: "4. HAZARD/RISK-",
        type: "hazard_risk_combined",
        required: true,
        photo_required: false,
        description: "",
        options: [
            "1. Physical Hazard",
            "2. Biological Hazard",
            "3. Chemical Hazard",
            "4. Mechanical Hazard",
            "5. Ergonomical Hazard",
            "6. Environmental Hazard",
            "7. Psychological Hazard",
            "8. Electrical Hazard",
            "9. Fire/Explosion Hazard",
        ],
        has_secondary: true,
        secondary_type: "short_answer",
    },
    {
        id: "obs-5",
        title: "5. RECOMMENDATIONS-",
        type: "paragraph",
        required: true,
        photo_required: false,
        description: "",
    },
    {
        id: "obs-6",
        title: "6. NAME OF CONTRACTOR-",
        type: "contractor_dropdown",
        required: true,
        photo_required: false,
        description: "",
    },
    {
        id: "obs-7",
        title: "7. TARGET DATE-",
        type: "date",
        required: true,
        photo_required: false,
        description: "",
    },
    {
        id: "obs-8",
        title: "8. CA/PA TO BE TAKEN-",
        type: "ca_pa_combined",
        required: true,
        photo_required: false,
        description: "",
    },
    {
        id: "obs-9",
        title: "9. CLOSER PHOTOGRAPH-",
        type: "file_upload",
        required: true,
        photo_required: true,
        description: "",
    },
];

export default function ObservationPreview({ onBack, onSave }) {
    const [questions, setQuestions] = useState(INITIAL_OBSERVATION_QUESTIONS);
    const [formTitle] = useState("SAFETY & HOUSEKEEPING OBSERVATION REPORT");

    const updateQuestion = (index, updates) => {
        setQuestions((prev) => {
            const next = [...prev];
            next[index] = { ...next[index], ...updates };
            return next;
        });
    };

    useEffect(() => {
        // Map to standard output expected by backend
        const out = questions.map(q => ({
            ...q,
            text: q.title
        }));
        if (onSave) onSave(out, {}, formTitle);
    }, [questions, formTitle]);

    const renderCardUI = (q) => {
        switch (q.id) {
            case "obs-1":
                return (
                    <div className="space-y-3">
                        <select disabled className="w-full max-w-sm rounded-xl border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500">
                            <option>UNSAFE ACT & CONDITION OBSERVED</option>
                        </select>
                        <input disabled placeholder="Short answer text" className="w-full max-w-sm rounded-xl border border-dashed border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500" />
                    </div>
                );
            case "obs-2":
                return (
                    <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-3 max-w-xl">
                            <div>
                                <label className="text-xs text-gray-500 mb-1 block">Wing</label>
                                <select disabled className="w-full rounded-xl border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500">
                                    <option>A - G</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 mb-1 block">Floor</label>
                                <select disabled className="w-full rounded-xl border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500">
                                    <option>BASEMENT 2 - TERRACE</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 mb-1 block">Flat/Area</label>
                                <input disabled placeholder="Text input" className="w-full rounded-xl border border-dashed border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500" />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 mb-1 block">Combined Location</label>
                            <input disabled placeholder="Combined textbox" className="w-full max-w-xl rounded-xl border border-dashed border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500" />
                        </div>
                    </div>
                );
            case "obs-3":
            case "obs-9":
                return (
                    <div className="flex max-w-xs items-center gap-2 rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-500">
                        Upload file here or take a picture
                    </div>
                );
            case "obs-4":
                return (
                    <div className="space-y-5">
                        <div>
                            <label className="text-sm font-medium text-gray-500 mb-3 block">Hazard (Checkboxes)</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-6">
                                {q.options.map(opt => (
                                    <div key={opt} className="flex items-center gap-3">
                                        <input type="checkbox" disabled className="h-4 w-4 shrink-0 rounded border-gray-300 text-orange-500 focus:ring-orange-500 cursor-not-allowed" />
                                        <span className="text-sm text-gray-700">{opt}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="pt-2">
                            <label className="text-sm font-medium text-gray-500 mb-2 block">Risk</label>
                            <input disabled placeholder="Textbox for risk" className="w-full max-w-md rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-500 cursor-not-allowed" />
                        </div>
                    </div>
                );
            case "obs-5":
                return (
                    <textarea disabled placeholder="Recommendations (textbox answer)" className="w-full max-w-lg rounded-xl border border-dashed border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500" rows={3} />
                );
            case "obs-6":
                return (
                    <select disabled className="w-full max-w-sm rounded-xl border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500">
                        <option>Select Contractor...</option>
                    </select>
                );
            case "obs-7":
                return (
                    <input disabled type="date" className="max-w-xs rounded-xl border border-dashed border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500" />
                );
            case "obs-8":
                return (
                    <div className="space-y-3 max-w-xl">
                        <div>
                            <label className="text-xs text-gray-500 mb-1 block">Corrective Action</label>
                            <input disabled placeholder="User input as textbox" className="w-full rounded-xl border border-dashed border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500" />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 mb-1 block">Preventive Action</label>
                            <input disabled placeholder="User input as textbox" className="w-full rounded-xl border border-dashed border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500" />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 mb-1 block">Final Combined</label>
                            <textarea disabled placeholder="Final textbox will show these two inputs along with these two texts" className="w-full rounded-xl border border-dashed border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500" rows={3} />
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-[#f5f5f7] flex flex-col">
            <header className="h-14 flex items-center justify-between px-6">
                <button
                    type="button"
                    onClick={onBack}
                    className="inline-flex items-center text-sm px-5 py-2.5 rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-600"
                >
                    ← Back
                </button>
            </header>

            <main className="flex-1 px-4 pb-10 flex justify-center">
                <div className="w-full max-w-4xl">
                    <div className="rounded-2xl bg-orange-400 text-white px-6 py-4 mb-6 text-center font-bold text-lg">
                        {formTitle}
                    </div>

                    {questions.map((q, idx) => (
                        <div key={q.id} className="relative rounded-2xl bg-white border border-orange-100 shadow-sm p-6 mb-6">
                            <div className="absolute -left-3 -top-3 flex h-7 w-7 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white shadow">
                                {idx + 1}
                            </div>

                            <div className="space-y-4">
                                <p className="text-base font-medium text-gray-900 pr-4">
                                    {q.title}
                                </p>

                                {/* Render Mock UI */}
                                <div className="py-2 pl-2">
                                    {renderCardUI(q)}
                                </div>

                                {/* Config Controls */}
                                <div className="mt-6 border-t border-gray-50 pt-5 space-y-5">
                                    <div>
                                        <label className="text-sm font-semibold text-gray-600 mb-2 block">Description (Optional)</label>
                                        <input 
                                            type="text" 
                                            value={q.description} 
                                            onChange={(e) => updateQuestion(idx, { description: e.target.value })}
                                            placeholder="Enter additional details or instructions..."
                                            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400"
                                        />
                                    </div>

                                    <div className="flex items-center gap-8">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-gray-700">Required</span>
                                            <button
                                                type="button"
                                                disabled
                                                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors opacity-70 cursor-not-allowed ${q.required ? "bg-orange-500" : "bg-gray-300"}`}
                                            >
                                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${q.required ? "translate-x-4" : "translate-x-1"}`} />
                                            </button>
                                        </div>

                                        {(q.id === "obs-3" || q.id === "obs-9") && (
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-gray-700">Photo Required</span>
                                                <button
                                                    type="button"
                                                    disabled
                                                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors opacity-70 cursor-not-allowed ${q.photo_required ? "bg-orange-500" : "bg-gray-300"}`}
                                                >
                                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${q.photo_required ? "translate-x-4" : "translate-x-1"}`} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}
