import React, { useState, useEffect } from "react";
import { ArrowRight } from "lucide-react";

function ExcelPreview({
  data,
  sheetNames,
  activeSheet,
  onSheetChange,
  onConvert,
  onBack,
  onUnconvertedRowsChange,
  validationErrors,
  onClearError,
}) {
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [questionCol, setQuestionCol] = useState(0);

  // Notify Wizard of selection changes
  useEffect(() => {
    if (onUnconvertedRowsChange) {
      onUnconvertedRowsChange(selectedRows.size);
    }
    return () => {
      if (onUnconvertedRowsChange) {
        onUnconvertedRowsChange(0);
      }
    };
  }, [selectedRows, onUnconvertedRowsChange]);

  const headers = Array.isArray(data) && data.length > 0 ? data[0] : [];
  const rows = Array.isArray(data) && data.length > 1 ? data.slice(1) : [];

  const toggleRow = (idx) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const toggleAll = () => {
    if (rows.length === 0) return;
    if (selectedRows.size === rows.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(rows.map((_, i) => i)));
    }
  };

  // Auto-detect best column (longest average text length)
  const detectBestColumn = () => {
    if (rows.length === 0) return 0;
    let best = 0;
    let bestAvg = 0;
    headers.forEach((_, ci) => {
      const avg =
        rows.reduce((sum, r) => sum + ((r && r[ci] && r[ci].length) || 0), 0) /
        rows.length;
      if (avg > bestAvg) {
        bestAvg = avg;
        best = ci;
      }
    });
    setQuestionCol(best);
  };

  const handleConvert = () => {
    if (validationErrors?.["btn-convert-questions"])
      onClearError("btn-convert-questions");
    onConvert(Array.from(selectedRows), questionCol);
    setSelectedRows(new Set());
  };

  return (
    <div className="space-y-4">
      {/* Controls bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg bg-white border border-orange-100 px-4 py-3 shadow-sm">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50"
        >
          ← Back
        </button>

        {Array.isArray(sheetNames) && sheetNames.length > 1 && (
          <select
            value={activeSheet}
            onChange={(e) => onSheetChange(e.target.value)}
            className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700"
          >
            {sheetNames.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        )}

        <select
          value={String(questionCol)}
          onChange={(e) => setQuestionCol(Number(e.target.value))}
          className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700"
        >
          {headers.map((h, i) => (
            <option key={i} value={String(i)}>
              {h || `Column ${i + 1}`}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={detectBestColumn}
          className="inline-flex items-center px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50"
        >
          Auto-detect
        </button>

        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm text-gray-500">
            {selectedRows.size} selected
          </span>
          <button
            id="btn-convert-questions"
            type="button"
            onClick={handleConvert}
            disabled={selectedRows.size === 0}
            className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              validationErrors?.["btn-convert-questions"]
                ? "ring-2 ring-orange-500 ring-offset-2 animate-pulse bg-orange-500 text-white"
                : selectedRows.size === 0
                  ? "bg-orange-300 text-white cursor-not-allowed opacity-70"
                  : "bg-orange-500 text-white hover:bg-orange-600"
            }`}
          >
            Convert to Questions
            <ArrowRight className="ml-1 h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-auto rounded-lg bg-white border border-orange-100 shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-orange-50/60">
              <th className="w-10 p-3 text-center">
                <input
                  type="checkbox"
                  checked={rows.length > 0 && selectedRows.size === rows.length}
                  onChange={toggleAll}
                />
              </th>
              <th className="w-10 p-3 text-xs font-medium text-gray-500 text-center">
                #
              </th>
              {headers.map((h, i) => (
                <th
                  key={i}
                  className={`min-w-[120px] p-3 text-left text-xs font-semibold ${
                    i === questionCol
                      ? "bg-orange-100 text-orange-800"
                      : "text-gray-700"
                  }`}
                >
                  {h || `Col ${i + 1}`}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr
                key={ri}
                className={`border-b last:border-0 transition-colors ${
                  selectedRows.has(ri) ? "bg-orange-50" : "hover:bg-gray-50/60"
                }`}
              >
                <td className="p-3 text-center">
                  <input
                    type="checkbox"
                    checked={selectedRows.has(ri)}
                    onChange={() => toggleRow(ri)}
                  />
                </td>
                <td className="p-3 text-xs text-gray-500 text-center">
                  {ri + 1}
                </td>
                {headers.map((_, ci) => (
                  <td
                    key={ci}
                    className={`p-3 align-top text-xs ${
                      ci === questionCol
                        ? "bg-orange-50 font-medium text-gray-900"
                        : "text-gray-700"
                    }`}
                  >
                    {row && row[ci] ? row[ci] : ""}
                  </td>
                ))}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={2 + headers.length}
                  className="p-6 text-center text-sm text-gray-400"
                >
                  No data found in this sheet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ExcelPreview;
