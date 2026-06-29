import React from "react";
import { Plus, X, Trash2, Copy } from "lucide-react";

export const QUESTION_TYPE_LABELS = {
    multiple_choice: "Multiple Choice",
    checkbox: "Checkboxes",
    dropdown: "Dropdown",
    short_answer: "Short Answer",
    paragraph: "Paragraph",
    date: "Date",
    file_upload: "File Upload",
    signature: "Signature",
};

export const DEFAULT_MC_OPTIONS = ["Yes", "No", "N/A"];

/**
 * Question card for creating/editing questions
 */
function QuestionCard({ question, index, onUpdate, onDuplicate, onDelete, validationErrors, onClearError }) {
    const updateField = (key, value) => {
        if (validationErrors?.[`question-card-${index}`]) onClearError(`question-card-${index}`);
        onUpdate({ ...question, [key]: value });
    };
    const isPhotoRequired = !!(question.photo_required ?? question.required);

    const addOption = () => {
        const next = [...(question.options || []), `Option ${(question.options || []).length + 1}`];
        updateField("options", next);
    };

    const removeOption = (i) => {
        updateField(
            "options",
            (question.options || []).filter((_, idx) => idx !== i)
        );
    };

    const updateOption = (i, val) => {
        const opts = [...(question.options || [])];
        opts[i] = val;
        updateField("options", opts);
    };

    const showOptions = ["multiple_choice", "checkbox", "dropdown"].includes(
        question.type
    );

    return (
        <div id={`question-card-${index}`} className={`relative rounded-2xl bg-white border shadow-sm p-6 mb-6 ${validationErrors?.[`question-card-${index}`] ? "border-red-500 ring-1 ring-red-500" : "border-orange-100"}`}>
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

                    <div className="w-full md:w-56">
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
                            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700"
                        >
                            {Object.entries(QUESTION_TYPE_LABELS).map(([key, label]) => (
                                <option key={key} value={key}>
                                    {label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <input
                    value={question.description || ""}
                    onChange={(e) => updateField("description", e.target.value)}
                    placeholder="Description (optional)"
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600"
                />

                {showOptions && (
                    <div className="space-y-2 pl-2">
                        {(question.options || []).map((opt, i) => (
                            <div key={i} className="flex items-center gap-2">
                                {question.type === "multiple_choice" && (
                                    <div className="h-4 w-4 shrink-0 rounded-full border-2 border-gray-300" />
                                )}
                                {question.type === "checkbox" && (
                                    <input
                                        type="checkbox"
                                        disabled
                                        className="h-4 w-4 shrink-0 text-orange-500"
                                    />
                                )}
                                {question.type === "dropdown" && (
                                    <span className="w-6 shrink-0 text-sm text-gray-400">
                                        {i + 1}.
                                    </span>
                                )}

                                <input
                                    value={opt}
                                    onChange={(e) => updateOption(i, e.target.value)}
                                    className="flex-1 border-0 border-b border-gray-200 bg-transparent px-1 py-1 text-sm focus:border-orange-500 focus:outline-none"
                                />

                                <button
                                    type="button"
                                    onClick={() => removeOption(i)}
                                    className="h-8 w-8 flex items-center justify-center rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={addOption}
                            className="text-sm text-orange-600 hover:text-orange-700 inline-flex items-center mt-1"
                        >
                            <Plus className="mr-1 h-4 w-4" /> Add option
                        </button>
                    </div>
                )}

                {question.type === "short_answer" && (
                    <input
                        disabled
                        placeholder="Short answer text"
                        className="mt-1 max-w-sm rounded-xl border border-dashed border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500"
                    />
                )}
                {question.type === "paragraph" && (
                    <textarea
                        disabled
                        placeholder="Long answer text"
                        className="mt-1 max-w-lg rounded-xl border border-dashed border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500"
                    />
                )}
                {question.type === "date" && (
                    <input
                        disabled
                        type="date"
                        className="mt-1 max-w-xs rounded-xl border border-dashed border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500"
                    />
                )}
                {question.type === "file_upload" && (
                    <div className="mt-1 flex max-w-xs items-center gap-2 rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-500">
                        Upload file here
                    </div>
                )}
                {question.type === "signature" && (
                    <div className="mt-1 flex h-20 max-w-sm items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-500">
                        Signature area
                    </div>
                )}

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
                                const nextVal = !isPhotoRequired;
                                // Keep both keys for backward compatibility with older payloads.
                                onUpdate({ ...question, photo_required: nextVal, required: nextVal });
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
