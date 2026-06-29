import React, { useState } from "react";
import { ArrowRight } from "lucide-react";

function ExcelPreview({
    data,
    sheetNames,
    activeSheet,
    onSheetChange,
    onConvert,
    onBack,
}) {
    const [selectedRows, setSelectedRows] = useState(new Set());
    const [selectedCols, setSelectedCols] = useState(new Set());
    const [questionCol, setQuestionCol] = useState(0);
    const [questionRow, setQuestionRow] = useState(0);
    const [extractionMode, setExtractionMode] = useState("vertical");

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

    const toggleAllRows = () => {
        if (rows.length === 0) return;
        if (selectedRows.size === rows.length) {
            setSelectedRows(new Set());
        } else {
            setSelectedRows(new Set(rows.map((_, i) => i)));
        }
    };

    const toggleCol = (idx) => {
        setSelectedCols((prev) => {
            const next = new Set(prev);
            if (next.has(idx)) next.delete(idx);
            else next.add(idx);
            return next;
        });
    };

    const toggleAllCols = () => {
        if (headers.length === 0) return;
        if (selectedCols.size === headers.length) {
            setSelectedCols(new Set());
        } else {
            setSelectedCols(new Set(headers.map((_, i) => i)));
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

    // Auto-detect best row (most non-empty cells)
    const detectBestRow = () => {
        if (rows.length === 0) return 0;
        let best = 0;
        let maxCount = 0;
        rows.forEach((r, ri) => {
            const count = r ? r.filter(cell => String(cell || "").trim().length > 0).length : 0;
            if (count > maxCount) {
                maxCount = count;
                best = ri;
            }
        });
        setQuestionRow(best);
        // Also auto-select columns that are non-empty in this row
        const bestRowData = rows[best] || [];
        const newSelectedCols = new Set();
        bestRowData.forEach((cell, ci) => {
            if (String(cell || "").trim().length > 0) {
                newSelectedCols.add(ci);
            }
        });
        setSelectedCols(newSelectedCols);
    };

    const handleConvert = () => {
        onConvert(Array.from(selectedRows), questionCol, extractionMode, Array.from(selectedCols), questionRow);
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
                    value={extractionMode}
                    onChange={(e) => setExtractionMode(e.target.value)}
                    className="h-9 rounded-lg border border-orange-200 bg-orange-50 px-3 text-sm font-medium text-orange-800"
                >
                    <option value="vertical">Extract from Column</option>
                    <option value="horizontal">Extract from Row</option>
                </select>

                {extractionMode === "vertical" && (
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
                )}

                {extractionMode === "vertical" ? (
                    <button
                        type="button"
                        onClick={detectBestColumn}
                        className="inline-flex items-center px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50"
                    >
                        Auto-detect
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={detectBestRow}
                        className="inline-flex items-center px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50"
                    >
                        Auto-detect
                    </button>
                )}

                <div className="ml-auto flex items-center gap-2">
                    <span className="text-sm text-gray-500">
                        {extractionMode === "vertical" ? selectedRows.size : selectedCols.size} selected
                    </span>
                    <button
                        type="button"
                        onClick={handleConvert}
                        disabled={extractionMode === "vertical" ? selectedRows.size === 0 : selectedCols.size === 0}
                        className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium ${(extractionMode === "vertical" ? selectedRows.size === 0 : selectedCols.size === 0)
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
                                {extractionMode === "vertical" ? (
                                    <input
                                        type="checkbox"
                                        checked={
                                            rows.length > 0 && selectedRows.size === rows.length
                                        }
                                        onChange={toggleAllRows}
                                    />
                                ) : (
                                    <input
                                        type="checkbox"
                                        checked={
                                            headers.length > 0 && selectedCols.size === headers.length
                                        }
                                        onChange={toggleAllCols}
                                    />
                                )}
                            </th>
                            <th className="w-10 p-3 text-xs font-medium text-gray-500 text-center">
                                #
                            </th>
                            {headers.map((h, i) => (
                                <th
                                    key={i}
                                    className={`min-w-[120px] p-3 text-left text-xs font-semibold ${
                                        (extractionMode === "vertical" && i === questionCol) || (extractionMode === "horizontal" && selectedCols.has(i))
                                            ? "bg-orange-100 text-orange-800"
                                            : "text-gray-700"
                                        }`}
                                >
                                    <div className="flex items-center gap-2">
                                        {extractionMode === "horizontal" && (
                                            <input
                                                type="checkbox"
                                                checked={selectedCols.has(i)}
                                                onChange={() => toggleCol(i)}
                                            />
                                        )}
                                        {h || `Col ${i + 1}`}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, ri) => (
                            <tr
                                key={ri}
                                className={`border-b last:border-0 transition-colors ${
                                    (extractionMode === "vertical" && selectedRows.has(ri)) || (extractionMode === "horizontal" && questionRow === ri)
                                        ? "bg-orange-50"
                                        : "hover:bg-gray-50/60"
                                    }`}
                            >
                                <td className="p-3 text-center">
                                    {extractionMode === "vertical" ? (
                                        <input
                                            type="checkbox"
                                            checked={selectedRows.has(ri)}
                                            onChange={() => toggleRow(ri)}
                                        />
                                    ) : (
                                        <input
                                            type="radio"
                                            name="questionRow"
                                            checked={questionRow === ri}
                                            onChange={() => {
                                                setQuestionRow(ri);
                                                // Auto-select columns that are non-empty in this row
                                                const rowData = rows[ri] || [];
                                                const newSelectedCols = new Set();
                                                rowData.forEach((cell, ci) => {
                                                    if (String(cell || "").trim().length > 0) {
                                                        newSelectedCols.add(ci);
                                                    }
                                                });
                                                setSelectedCols(newSelectedCols);
                                            }}
                                        />
                                    )}
                                </td>
                                <td className="p-3 text-xs text-gray-500 text-center">
                                    {ri + 1}
                                </td>
                                {headers.map((_, ci) => (
                                    <td
                                        key={ci}
                                        className={`p-3 align-top text-xs ${
                                            (extractionMode === "vertical" && ci === questionCol) || (extractionMode === "horizontal" && selectedCols.has(ci))
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