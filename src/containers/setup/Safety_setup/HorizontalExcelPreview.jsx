import React from "react";
import {
  CheckCircle2,
  List,
  Type,
  Table,
  LayoutTemplate,
  HelpCircle,
} from "lucide-react";

export default function HorizontalExcelPreview({ formatMode, schema, onBack }) {
  const headers = schema?.headers || [];
  const legend = schema?.legendDetected || [];
  let formatName = "Unknown";
  if (formatMode === "HORIZONTAL_TYPE_A") formatName = "Horizontal (Type A)";
  else if (formatMode === "HORIZONTAL_TYPE_B") formatName = "Grouped (Type B)";
  else if (formatMode === "MATRIX_DAILY") formatName = "Matrix (Daily 1-31)";
  else if (formatMode === "MATRIX_WEEKLY") formatName = "Matrix (Weekly W1-W5)";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3 rounded-xl bg-white border border-gray-200 px-5 py-4 shadow-sm">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          ← Upload Different File
        </button>
        {/* <div className="ml-auto flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">Click</span>
                    <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-md text-xs font-bold border border-orange-200">Next</span>
                    <span className="text-sm font-medium text-gray-700">in the footer to configure columns</span>
                </div> */}
      </div>

      <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm overflow-hidden">
        <div className="bg-emerald-50/50 px-6 py-5 border-b border-emerald-100 flex items-center gap-4">
          <div className="bg-emerald-100 p-2.5 rounded-xl">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {" "}
              Successfully Detected
            </h2>
            {/* <p className="text-sm text-gray-600 mt-1">
                            We automatically parsed your template. You don't need to manually select rows.
                        </p> */}
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
            <div className="flex items-center gap-2 text-gray-500 mb-2">
              <LayoutTemplate className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                Format
              </span>
            </div>
            <div className="text-base font-medium text-gray-900">
              {formatName}
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
            <div className="flex items-center gap-2 text-gray-500 mb-2">
              <Table className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                {formatMode.startsWith("MATRIX")
                  ? "Questions Extracted"
                  : "Columns Extracted"}
              </span>
            </div>
            <div className="text-base font-medium text-gray-900">
              {headers.length}{" "}
              {formatMode.startsWith("MATRIX") ? "Questions" : "Columns"}
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
            <div className="flex items-center gap-2 text-gray-500 mb-2">
              <List className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                Detected Legend
              </span>
            </div>
            <div className="text-base font-medium text-gray-900">
              {legend.length > 0 ? legend.join(" / ") : "None"}
              {schema?.fallbackUsed && (
                <span className="ml-2 text-xs text-orange-500 font-medium">
                  (Default)
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="px-6 pb-6">
          <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
            <List className="w-4 h-4 text-gray-400" />
            {formatMode.startsWith("MATRIX")
              ? "Preview of Extracted Questions"
              : "Preview of Extracted Columns"}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {headers.map((h, idx) => (
              <div
                key={idx}
                className="bg-white border border-gray-200 rounded-lg p-3 flex items-start gap-3 shadow-sm hover:border-orange-200 transition-colors"
              >
                <div className="bg-gray-50 text-gray-400 p-1.5 rounded-md shrink-0 mt-0.5">
                  {h.type === "multiple_choice" ? (
                    <HelpCircle className="w-4 h-4" />
                  ) : (
                    <Type className="w-4 h-4" />
                  )}
                </div>
                <div className="overflow-hidden">
                  <div
                    className="text-xs font-bold text-gray-900 truncate"
                    title={h.text}
                  >
                    {h.text}
                  </div>
                  <div className="text-[11px] text-gray-500 mt-0.5 capitalize">
                    {h.type.replace("_", " ")}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
