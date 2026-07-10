import React, { useState } from "react";
import { Plus } from "lucide-react";
import SafetySetup from "./SafetySetup";
import ExcelPreview from "./ExcelPreview";
import QuestionCard, { DEFAULT_MC_OPTIONS } from "./QuestionCard";
import { detectChecklistFormat } from "./formatDetector";
import { parseHorizontalExcel } from "./parseHorizontalExcel";
import { parseMatrixExcel } from "./parseMatrixExcel";
import HorizontalExcelPreview from "./HorizontalExcelPreview";

/**
 * Merged step: Excel upload + Select fields & questions + Manual question creation
 * - Excel path: upload → select fields → convert → questions in edit mode (hide Create question)
 * - Manual path: Create question → hide upload, show question cards
 */
function UploadAndMapping({
  excelData,
  setExcelData,
  sheetNames,
  setSheetNames,
  activeSheet,
  setActiveSheet,
  excelQuestions,
  setExcelQuestions,
  manualQuestions,
  setManualQuestions,
  onUploadComplete,
  onSheetChange,
  onBack,
  // M3.6 Props from SafetyWizard
  formatMode,
  setFormatMode,
  horizontalSchema,
  setHorizontalSchema,
  parserError,
  setParserError,
  onUnconvertedRowsChange,
  validationErrors,
  onClearError,
  isEditMode = false,
}) {
  const hasChosenExcel = !!excelData;
  const hasChosenManual = manualQuestions.length > 0;
  const hasConvertedFromExcel = excelQuestions.length > 0;

  const handleUploadComplete = (
    rows,
    sheetNamesFromUpload,
    activeSheetName,
    fileName,
  ) => {
    // M3B: Run format detector and parser
    try {
      const format = detectChecklistFormat(rows);
      setFormatMode(format.type);

      if (
        format.type === "HORIZONTAL_TYPE_A" ||
        format.type === "HORIZONTAL_TYPE_B"
      ) {
        const parsed = parseHorizontalExcel(rows);
        if (parsed.success) {
          setHorizontalSchema(parsed);
          setParserError(null);
        } else {
          setHorizontalSchema(null);
          setParserError(parsed.reason);
        }
      } else if (
        format.type === "MATRIX_DAILY" ||
        format.type === "MATRIX_WEEKLY"
      ) {
        const parsed = parseMatrixExcel(rows, format.type);
        if (parsed.success) {
          setHorizontalSchema(parsed);
          setParserError(null);
        } else {
          setHorizontalSchema(null);
          setParserError(parsed.reason);
        }
      } else {
        setHorizontalSchema(null);
        setParserError("Not a supported format");
      }
    } catch (err) {
      console.error("Detector/Parser Error:", err);
      setFormatMode("UNSUPPORTED");
      setParserError(err.message);
    }

    // Existing execution must continue uninterrupted per M3B rules

    setExcelData(rows);
    setSheetNames(sheetNamesFromUpload);
    setActiveSheet(activeSheetName || sheetNamesFromUpload[0] || "");
    if (onUploadComplete)
      onUploadComplete(rows, sheetNamesFromUpload, activeSheetName, fileName);
  };

  const handleConvert = (selectedRows, questionCol) => {
    if (!excelData) return;
    const rows = excelData.slice(1);
    const questions = selectedRows
      .map((ri) => rows[ri]?.[questionCol] || "")
      .map((text) => String(text).trim())
      .filter((text) => text.length > 0)
      .map((text, idx) => ({
        id: `q-excel-${idx + 1}-${Date.now()}`,
        text,
        type: "multiple_choice",
        description: "",
        options: DEFAULT_MC_OPTIONS,
        required: false,
        photo_required: false,
      }));
    setExcelQuestions(questions);
  };

  const handleCreateQuestion = () => {
    setManualQuestions((prev) => [
      ...prev,
      {
        id: `q-manual-${Date.now()}`,
        text: "",
        type: "multiple_choice",
        description: "",
        options: DEFAULT_MC_OPTIONS,
        required: false,
        photo_required: false,
      },
    ]);
  };

  const updateManualQuestionAt = (index, updated) => {
    setManualQuestions((prev) => {
      const next = [...prev];
      next[index] = updated;
      return next;
    });
  };

  const duplicateManualQuestionAt = (index) => {
    setManualQuestions((prev) => {
      const target = prev[index];
      const clone = {
        ...target,
        id: `${target.id || index}-copy-${Date.now()}`,
      };
      const next = [...prev];
      next.splice(index + 1, 0, clone);
      return next;
    });
  };

  const deleteManualQuestionAt = (index) => {
    setManualQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const updateExcelQuestionAt = (index, updated) => {
    setExcelQuestions((prev) => {
      const next = [...prev];
      next[index] = updated;
      return next;
    });
  };

  const duplicateExcelQuestionAt = (index) => {
    setExcelQuestions((prev) => {
      const target = prev[index];
      const clone = {
        ...target,
        id: `${target.id || index}-copy-${Date.now()}`,
      };
      const next = [...prev];
      next.splice(index + 1, 0, clone);
      return next;
    });
  };

  const deleteExcelQuestionAt = (index) => {
    setExcelQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleBackToExcelTable = () => {
    setExcelQuestions([]);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-orange-100 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-orange-100 bg-white">
        <h2 className="text-lg font-semibold text-gray-900">
          {hasConvertedFromExcel
            ? "Edit converted questions"
            : excelData
              ? "Select Fields & Questions"
              : "Upload Excel"}
        </h2>
        {!hasChosenExcel && (
          <button
            type="button"
            onClick={handleCreateQuestion}
            className="inline-flex items-center px-4 py-2 rounded-xl bg-orange-500 text-white text-sm font-medium hover:bg-orange-600"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create question
          </button>
        )}
      </div>

      <div className="p-6 space-y-6">
        {/* Upload box: only when user hasn't started manual creation */}
        {!hasChosenManual && !hasConvertedFromExcel && (
          <>
            {isEditMode &&
            (formatMode === "HORIZONTAL_TYPE_A" ||
              formatMode === "HORIZONTAL_TYPE_B" ||
              formatMode === "MATRIX_DAILY" ||
              formatMode === "MATRIX_WEEKLY") &&
            horizontalSchema?.headers?.length ? (
              <HorizontalExcelPreview
                formatMode={formatMode}
                schema={horizontalSchema}
                onBack={() => {
                  setFormatMode("UNSUPPORTED");
                  setHorizontalSchema(null);
                }}
              />
            ) : !excelData ? (
              <SafetySetup onUploadComplete={handleUploadComplete} />
            ) : formatMode === "HORIZONTAL_TYPE_A" ||
              formatMode === "HORIZONTAL_TYPE_B" ||
              formatMode === "MATRIX_DAILY" ||
              formatMode === "MATRIX_WEEKLY" ? (
              <HorizontalExcelPreview
                formatMode={formatMode}
                schema={horizontalSchema}
                onBack={() => {
                  setExcelData(null);
                  setSheetNames([]);
                  setActiveSheet("");
                  setExcelQuestions([]);
                  setFormatMode("UNSUPPORTED");
                  setHorizontalSchema(null);
                }}
              />
            ) : (
              <ExcelPreview
                data={excelData}
                sheetNames={sheetNames}
                activeSheet={activeSheet}
                onSheetChange={onSheetChange}
                onConvert={handleConvert}
                onUnconvertedRowsChange={onUnconvertedRowsChange}
                validationErrors={validationErrors}
                onClearError={onClearError}
                onBack={() => {
                  setExcelData(null);
                  setSheetNames([]);
                  setActiveSheet("");
                  setExcelQuestions([]);
                }}
              />
            )}
          </>
        )}

        {/* Excel-converted questions in edit mode (same layout as manual) */}
        {hasConvertedFromExcel && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handleBackToExcelTable}
                className="text-sm text-orange-600 hover:text-orange-700"
              >
                ← Back to Excel table
              </button>
            </div>
            {excelQuestions.map((q, idx) => (
              <QuestionCard
                key={q.id}
                question={q}
                index={idx}
                onUpdate={(updated) => updateExcelQuestionAt(idx, updated)}
                onDuplicate={() => duplicateExcelQuestionAt(idx)}
                onDelete={() => deleteExcelQuestionAt(idx)}
              />
            ))}
          </div>
        )}

        {/* Manual questions */}
        {hasChosenManual && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-4">
              Your questions
            </h3>
            {manualQuestions.map((q, idx) => (
              <QuestionCard
                key={q.id}
                question={q}
                index={idx}
                onUpdate={(updated) => updateManualQuestionAt(idx, updated)}
                onDuplicate={() => duplicateManualQuestionAt(idx)}
                onDelete={() => deleteManualQuestionAt(idx)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default UploadAndMapping;
