import React, { useState, useEffect, useRef } from "react";
import { Settings, List, Type, CheckSquare, Trash2 } from "lucide-react";

export default function FinalPreviewHorizontal({
  schema,
  initialTitle,
  onBack,
  onSave,
  validationErrors,
  onClearError,
}) {
  const [headers, setHeaders] = useState(schema?.headers || []);
  const [formTitle, setFormTitle] = useState(initialTitle || "");

  // Safest sync mechanism: Maintain a ref to the latest headers
  const headersRef = useRef(headers);
  headersRef.current = headers;

  // Controlled sync: Debounce saves to prevent parent re-renders on every keystroke,
  // but guarantee a final flush when the component unmounts (e.g. clicking 'Next').
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onSave) onSave({ ...schema, headers }, formTitle);
    }, 400);

    return () => {
      clearTimeout(timer);
      // Flush exact latest state on unmount to prevent data loss
      if (onSave) onSave({ ...schema, headers: headersRef.current }, formTitle);
    };
  }, [headers, formTitle, schema, onSave]);

  const updateHeader = (index, field, value) => {
    if (validationErrors?.[`header-text-${index}`])
      onClearError(`header-text-${index}`);
    setHeaders((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const updateOption = (headerIndex, optIndex, value) => {
    if (validationErrors?.[`header-options-${headerIndex}`])
      onClearError(`header-options-${headerIndex}`);
    setHeaders((prev) => {
      const next = [...prev];
      const newOptions = [...(next[headerIndex].options || [])];
      newOptions[optIndex] = value;
      next[headerIndex] = { ...next[headerIndex], options: newOptions };
      return next;
    });
  };

  const addOption = (headerIndex) => {
    if (validationErrors?.[`header-options-${headerIndex}`])
      onClearError(`header-options-${headerIndex}`);
    setHeaders((prev) => {
      const next = [...prev];
      const newOptions = [...(next[headerIndex].options || []), "New Option"];
      next[headerIndex] = { ...next[headerIndex], options: newOptions };
      return next;
    });
  };

  const removeOption = (headerIndex, optIndex) => {
    setHeaders((prev) => {
      const next = [...prev];
      const newOptions = [...(next[headerIndex].options || [])];
      newOptions.splice(optIndex, 1);
      next[headerIndex] = { ...next[headerIndex], options: newOptions };
      return next;
    });
  };

  const removeHeader = (index) => {
    setHeaders((prev) => {
      const next = [...prev];
      next.splice(index, 1);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] flex flex-col">
      <header className="h-14 flex items-center justify-between px-6 border-b border-gray-200 bg-white">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center text-sm px-5 py-2.5 rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-600"
        >
          ← Back
        </button>
        {/* <div className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Horizontal Format: {schema?.type?.replace(/_/g, " ")}
                </div> */}
      </header>

      <main className="flex-1 px-4 py-8 flex justify-center">
        <div className="w-full max-w-4xl">
          <div className="rounded-2xl bg-orange-400 text-white px-6 py-4 mb-6">
            <input
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              className="text-sm font-medium bg-transparent outline-none w-full placeholder-white/70"
              placeholder="Untitled Template"
            />
          </div>

          <div className="mb-6">
            <h1 className="text-xl font-bold text-gray-900">
              Configure Horizontal Columns
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Review and adjust the inferred column types before generating the
              report template.
            </p>
          </div>

          <div className="space-y-4">
            {headers.map((header, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 relative group"
              >
                <button
                  onClick={() => removeHeader(idx)}
                  className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                  title="Remove this column"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="flex gap-6 items-start">
                  <div className="flex-1 space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Column Header Text
                      </label>
                      <input
                        id={`header-text-${idx}`}
                        value={header.text}
                        onChange={(e) =>
                          updateHeader(idx, "text", e.target.value)
                        }
                        className={`w-full bg-gray-50 border rounded-lg px-3 py-2 text-sm font-medium text-gray-900 focus:outline-none ${validationErrors?.[`header-text-${idx}`] ? "border-red-500 ring-1 ring-red-500" : "border-gray-200 focus:border-orange-500"}`}
                      />
                    </div>

                    {header.type === "multiple_choice" && (
                      <div
                        id={`header-options-${idx}`}
                        className={`bg-orange-50/50 rounded-xl p-4 border ${validationErrors?.[`header-options-${idx}`] ? "border-red-500 ring-1 ring-red-500" : "border-orange-100"}`}
                      >
                        <label className="block text-xs font-medium text-gray-700 mb-3 flex items-center gap-1.5">
                          <List className="w-3 h-3" /> Options List
                        </label>
                        <div className="space-y-2">
                          {(header.options || []).map((opt, optIdx) => (
                            <div
                              key={optIdx}
                              className="flex items-center gap-2"
                            >
                              <input
                                value={opt}
                                onChange={(e) =>
                                  updateOption(idx, optIdx, e.target.value)
                                }
                                className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-orange-500"
                              />
                              <button
                                onClick={() => removeOption(idx, optIdx)}
                                className="text-gray-400 hover:text-red-500 font-bold px-2"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                          <button
                            onClick={() => addOption(idx)}
                            className="text-sm text-orange-600 hover:text-orange-700 font-medium pt-1"
                          >
                            + Add Option
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="w-64 shrink-0">
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Column Type
                    </label>
                    <select
                      value={header.type}
                      onChange={(e) =>
                        updateHeader(idx, "type", e.target.value)
                      }
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium text-gray-900 focus:outline-none focus:border-orange-500"
                    >
                      <option value="short_answer">Short Answer (Text)</option>
                      <option value="paragraph">Paragraph (Long Text)</option>
                      <option value="multiple_choice">
                        Multiple Choice (Dropdown)
                      </option>
                      <option value="date">Date</option>
                    </select>

                    {header.type === "date" && (
                      <div className="mt-3">
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-gray-700">
                          <input
                            type="checkbox"
                            checked={header.autoFetchOneMonth || false}
                            onChange={(e) =>
                              updateHeader(
                                idx,
                                "autoFetchOneMonth",
                                e.target.checked,
                              )
                            }
                            className="rounded border-gray-300 text-orange-500 focus:ring-orange-500 w-3.5 h-3.5 cursor-pointer"
                          />
                          1 month after date of inspection
                        </label>
                      </div>
                    )}

                    {/* <div className="mt-4 flex items-center justify-between text-xs text-gray-400 bg-gray-50 px-3 py-2 rounded-lg">
                                            <span>Heuristic Confidence</span>
                                            <span className="font-medium text-gray-600">{Math.round(header.confidence * 100)}%</span>
                                        </div> */}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
