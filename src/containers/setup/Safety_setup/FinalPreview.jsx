import React, { useState, useEffect } from "react";
import { Pencil } from "lucide-react";
import QuestionCard, { DEFAULT_MC_OPTIONS } from "./QuestionCard";

/**
 * QuestionPreviewCard - read-only card matching create layout
 * Shows: question text, options, Photo Required checkbox only
 * No edit controls (no type dropdown, add option, delete, duplicate, etc.)
 */
function QuestionPreviewCard({ question, index, validationErrors }) {
  const showOptions = ["multiple_choice", "checkbox", "dropdown"].includes(
    question.type,
  );

  return (
    <div
      id={`question-card-${index}`}
      className={`relative rounded-2xl bg-white border shadow-sm p-6 mb-6 ${validationErrors?.[`question-card-${index}`] ? "border-red-500 ring-1 ring-red-500" : "border-orange-100"}`}
    >
      <div className="absolute -left-3 -top-3 flex h-7 w-7 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white shadow">
        {index + 1}
      </div>

      <div className="space-y-4">
        <p className="text-base font-medium text-gray-900 pr-4">
          {question.text || "(No question text)"}
        </p>

        {/* Options - same visual as create mode, read-only */}
        {showOptions && (question.options || []).length > 0 && (
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
                <span className="text-sm text-gray-700">{opt}</span>
              </div>
            ))}
          </div>
        )}

        {question.type === "short_answer" && (
          <input
            disabled
            placeholder="Short answer text"
            className="max-w-sm rounded-xl border border-dashed border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500"
          />
        )}
        {question.type === "paragraph" && (
          <textarea
            disabled
            placeholder="Long answer text"
            className="max-w-lg rounded-xl border border-dashed border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500"
          />
        )}
        {question.type === "date" && (
          <input
            disabled
            type="date"
            className="max-w-xs rounded-xl border border-dashed border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500"
          />
        )}
        {question.type === "file_upload" && (
          <div className="flex max-w-xs items-center gap-2 rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-500">
            Upload file here
          </div>
        )}
        {question.type === "signature" && (
          <div className="flex h-20 max-w-sm items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-500">
            Signature area
          </div>
        )}

        {/* Photo Required - read-only display */}
        <div className="mt-2 flex items-center gap-2 border-t border-gray-100 pt-3">
          <span className="text-sm text-gray-500">Photo Required</span>
          {/*
                      Support both `photo_required` (new) and `required` (legacy) to keep older saved flows working.
                    */}
          <div
            className={`relative inline-flex h-5 w-9 items-center rounded-full ${
              ((question.photo_required ?? question.required) ? true : false)
                ? "bg-orange-500"
                : "bg-gray-300"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow ${
                ((question.photo_required ?? question.required) ? true : false)
                  ? "translate-x-4"
                  : "translate-x-1"
              }`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * FinalPreview – Preview step: view questions in same layout as create, read-only
 * One Edit button top-right toggles edit mode for all questions
 */
function FinalPreview({
  initialQuestions = [],
  onBack,
  onSave,
  validationErrors,
  onClearError,
}) {
  const [questions, setQuestions] = useState(
    initialQuestions.map((q, idx) => ({
      id: q.id || `q-${idx + 1}`,
      text: q.text || "",
      type: q.type || "multiple_choice",
      description: q.description || "",
      options: q.options || DEFAULT_MC_OPTIONS,
      photo_required: !!(q.photo_required ?? q.required),
      required: !!(q.photo_required ?? q.required), // legacy fallback
    })),
  );

  const [formTitle, setFormTitle] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);

  const updateQuestionAt = (index, updated) => {
    setQuestions((prev) => {
      const next = [...prev];
      next[index] = updated;
      return next;
    });
  };

  const duplicateQuestionAt = (index) => {
    setQuestions((prev) => {
      const target = prev[index];
      const clone = {
        ...target,
        id: `${target.id || index + 1}-copy-${Date.now()}`,
      };
      const next = [...prev];
      next.splice(index + 1, 0, clone);
      return next;
    });
  };

  const deleteQuestionAt = (index) => {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    if (onSave) onSave(questions, {}, formTitle);
  }, [questions, formTitle]);

  return (
    <div className="min-h-screen bg-[#f5f5f7] flex flex-col">
      <header className="h-14 flex items-center justify-between px-6">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center text-sm px-5 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600"
        >
          ← Back
        </button>
        {!isEditMode && questions.length > 0 && (
          <button
            type="button"
            onClick={() => setIsEditMode(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-orange-200 text-orange-600 text-sm font-medium hover:bg-orange-50"
          >
            <Pencil className="h-4 w-4" />
            Edit
          </button>
        )}
      </header>

      <main className="flex-1 px-4 pb-10 flex justify-center">
        <div className="w-full max-w-4xl">
          <div className="rounded-2xl bg-orange-400 text-white px-6 py-4 mb-6">
            <input
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              className="text-sm font-medium bg-transparent outline-none w-full placeholder-white/70"
              placeholder="Untitled Form"
            />
          </div>

          {isEditMode ? (
            <>
              {questions.map((q, idx) => (
                <QuestionCard
                  key={q.id || idx}
                  question={q}
                  index={idx}
                  onUpdate={(updated) => updateQuestionAt(idx, updated)}
                  onDuplicate={() => duplicateQuestionAt(idx)}
                  onDelete={() => deleteQuestionAt(idx)}
                  validationErrors={validationErrors}
                  onClearError={onClearError}
                />
              ))}
              <div className="flex justify-end mt-4">
                <button
                  type="button"
                  onClick={() => setIsEditMode(false)}
                  className="px-5 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-medium hover:bg-orange-600"
                >
                  Done editing
                </button>
              </div>
            </>
          ) : (
            questions.map((q, idx) => (
              <QuestionPreviewCard
                key={q.id || idx}
                question={q}
                index={idx}
                validationErrors={validationErrors}
              />
            ))
          )}

          {questions.length === 0 && (
            <div className="rounded-2xl bg-white border border-orange-100 p-12 text-center text-gray-500">
              No questions yet. Go back to add questions from Excel or create
              them manually.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default FinalPreview;