import React from "react";
import { Plus, X, Trash2, Copy } from "lucide-react";

export const QUESTION_TYPE_LABELS = {
    multiple_choice: "Multiple Choice",
    checkbox: "Checkboxes",
    dropdown: "Dropdown",
    short_answer: "Short Answer",
    paragraph: "Paragraph",
    date: "Date",
    file_upload: "File Upload / Take Picture",
    signature: "Signature",
};

export const DEFAULT_MC_OPTIONS = ["Yes", "No", "N/A"];

/**
 * Question card for creating/editing questions
 */
function QuestionCard({ question, index, onUpdate, onDuplicate, onDelete }) {
    const updateField = (key, value) => {
        onUpdate({ ...question, [key]: value });
    };
    const isPhotoRequired = !!question.photo_required;

    const addOption = (optionsKey = "options") => {
        const next = [...(question[optionsKey] || []), `Option ${(question[optionsKey] || []).length + 1}`];
        updateField(optionsKey, next);
    };

    const removeOption = (i, optionsKey = "options") => {
        updateField(
            optionsKey,
            (question[optionsKey] || []).filter((_, idx) => idx !== i)
        );
    };

    const updateOption = (i, val, optionsKey = "options") => {
        const opts = [...(question[optionsKey] || [])];
        opts[i] = val;
        updateField(optionsKey, opts);
    };

    const renderTypeConfig = (type, optionsKey, isSecondary = false) => {
        const showOpts = ["multiple_choice", "checkbox", "dropdown"].includes(type);
        const options = question[optionsKey] || [];
        const reqKey = isSecondary ? "secondary_required" : "required";
        const isReq = !!question[reqKey];
        
        return (
            <div className={`mt-4 ${isSecondary ? 'pt-4 border-t border-gray-100' : ''}`}>
                <div className="flex items-center justify-between mb-2">
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        {isSecondary ? "Secondary Field" : "Primary Field"}
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Required</span>
                        <button
                            type="button"
                            onClick={() => {
                                const nextVal = !isReq;
                                if (!isSecondary) {
                                    onUpdate({ ...question, [reqKey]: nextVal });
                                } else {
                                    updateField(reqKey, nextVal);
                                }
                            }}
                            className={`relative inline-flex h-4 w-7 items-center rounded-full transition ${isReq ? "bg-orange-500" : "bg-gray-300"}`}
                        >
                            <span className={`inline-block h-3 w-3 transform rounded-full bg-white shadow transition ${isReq ? "translate-x-3.5" : "translate-x-0.5"}`} />
                        </button>
                    </div>
                </div>
                {showOpts && (
                    <div className="space-y-2 pl-2">
                        {options.map((opt, i) => (
                            <div key={i} className="flex items-center gap-2">
                                {type === "multiple_choice" && <div className="h-4 w-4 shrink-0 rounded-full border-2 border-gray-300" />}
                                {type === "checkbox" && <input type="checkbox" disabled className="h-4 w-4 shrink-0 text-orange-500" />}
                                {type === "dropdown" && <span className="w-6 shrink-0 text-sm text-gray-400">{i + 1}.</span>}
                                
                                <input
                                    value={opt}
                                    onChange={(e) => updateOption(i, e.target.value, optionsKey)}
                                    className="flex-1 border-0 border-b border-gray-200 bg-transparent px-1 py-1 text-sm focus:border-orange-500 focus:outline-none"
                                />
                                <button type="button" onClick={() => removeOption(i, optionsKey)} className="h-8 w-8 flex items-center justify-center rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50">
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
                        <button type="button" onClick={() => addOption(optionsKey)} className="text-sm text-orange-600 hover:text-orange-700 inline-flex items-center mt-1">
                            <Plus className="mr-1 h-4 w-4" /> Add option
                        </button>
                    </div>
                )}
                {type === "short_answer" && <input disabled placeholder="Short answer text" className="mt-1 max-w-sm w-full rounded-xl border border-dashed border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500" />}
                {type === "paragraph" && <textarea disabled placeholder="Long answer text" className="mt-1 max-w-lg w-full rounded-xl border border-dashed border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500" />}
                {type === "date" && <input disabled type="date" className="mt-1 max-w-xs rounded-xl border border-dashed border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500" />}
                {type === "file_upload" && <div className="mt-1 flex max-w-xs items-center gap-2 rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-500">Upload file or take picture here</div>}
                {type === "signature" && <div className="mt-1 flex h-20 max-w-sm items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-500">Signature area</div>}
            </div>
        );
    };

    return (
        <div className="relative rounded-2xl bg-white border border-orange-100 shadow-sm p-6 mb-6">
            <div className="absolute -left-3 -top-3 flex h-7 w-7 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white shadow">
                {index + 1}
            </div>

            <div className="space-y-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start">
                    <div className="flex-1">
                        <textarea
                            value={question.text}
                            onChange={(e) => updateField("text", e.target.value)}
                            placeholder="Enter your question here..."
                            rows={2}
                            className="w-full resize-none border-0 bg-transparent text-base font-medium leading-relaxed focus:border-orange-500 focus:outline-none"
                        />
                    </div>

                    <div className="flex flex-col gap-2 w-full md:w-auto">
                        <div className="flex items-center gap-2">
                            <select
                                value={question.type}
                                onChange={(e) => {
                                    const newType = e.target.value;
                                    let opts = [];
                                    if (newType === "multiple_choice") {
                                        opts = DEFAULT_MC_OPTIONS;
                                    } else if (["checkbox", "dropdown"].includes(newType)) {
                                        const existing = question.options || [];
                                        opts = existing.length > 0 ? existing : ["Option 1"];
                                    }
                                    onUpdate({
                                        ...question,
                                        type: newType,
                                        options: opts,
                                    });
                                }}
                                className="w-full md:w-56 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700"
                            >
                                {Object.entries(QUESTION_TYPE_LABELS).map(([key, label]) => (
                                    <option key={key} value={key}>
                                        {label}
                                    </option>
                                ))}
                            </select>
                            {!question.has_secondary && (
                                <button
                                    type="button"
                                    onClick={() => updateField("has_secondary", true)}
                                    className="p-2 text-orange-500 hover:bg-orange-50 rounded-lg flex-shrink-0"
                                    title="Add secondary field"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        {question.has_secondary && (
                            <div className="flex items-center gap-2">
                                <select
                                    value={question.secondary_type || "short_answer"}
                                    onChange={(e) => {
                                        const newType = e.target.value;
                                        let opts = [];
                                        if (newType === "multiple_choice") {
                                            opts = DEFAULT_MC_OPTIONS;
                                        } else if (["checkbox", "dropdown"].includes(newType)) {
                                            const existing = question.secondary_options || [];
                                            opts = existing.length > 0 ? existing : ["Option 1"];
                                        }
                                        onUpdate({
                                            ...question,
                                            secondary_type: newType,
                                            secondary_options: opts,
                                        });
                                    }}
                                    className="w-full md:w-56 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700"
                                >
                                    {Object.entries(QUESTION_TYPE_LABELS).map(([key, label]) => (
                                        <option key={key} value={key}>
                                            {label}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    type="button"
                                    onClick={() => updateField("has_secondary", false)}
                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg flex-shrink-0"
                                    title="Remove secondary field"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <input
                    value={question.description || ""}
                    onChange={(e) => updateField("description", e.target.value)}
                    placeholder="Description (optional)"
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600"
                />

                {renderTypeConfig(question.type, "options", false)}
                {question.has_secondary && renderTypeConfig(question.secondary_type || "short_answer", "secondary_options", true)}

                <div className="mt-2 flex items-center justify-end gap-3 border-t border-gray-100 pt-3">
                    {onDuplicate && (
                        <button
                            type="button"
                            onClick={onDuplicate}
                            className="h-8 w-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                        >
                            <Copy className="h-4 w-4" />
                        </button>
                    )}
                    {onDelete && (
                        <button
                            type="button"
                            onClick={onDelete}
                            className="h-8 w-8 flex items-center justify-center rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    )}
                    <div className="mx-2 h-6 w-px bg-gray-200" />
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">Photo Required</span>
                        <button
                            type="button"
                            onClick={() => {
                                onUpdate({ ...question, photo_required: !isPhotoRequired });
                            }}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition ${isPhotoRequired ? "bg-orange-500" : "bg-gray-300"
                                }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${isPhotoRequired ? "translate-x-4" : "translate-x-1"
                                    }`}
                            />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default QuestionCard;
