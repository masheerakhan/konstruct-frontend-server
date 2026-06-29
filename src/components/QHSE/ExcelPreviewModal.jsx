import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { Download, X } from "lucide-react";
import toast from "react-hot-toast";
import { createPortal } from "react-dom";

function isBlankRow(row) {
    return !row || row.every((cell) => String(cell ?? "").trim() === "");
}

export default function ExcelPreviewModal({ open, fileName, fileUrl, onClose }) {
    const [loading, setLoading] = useState(false);
    const [workbookData, setWorkbookData] = useState(null);
    const [activeSheet, setActiveSheet] = useState("");

    useEffect(() => {
        if (!open || !fileUrl) return;

        let cancelled = false;

        async function loadExcel() {
            setLoading(true);
            setWorkbookData(null);
            setActiveSheet("");

            try {
                const response = await fetch(fileUrl);

                if (!response.ok) {
                    throw new Error("Unable to load Excel file.");
                }

                const arrayBuffer = await response.arrayBuffer();

                const workbook = XLSX.read(arrayBuffer, {
                    type: "array",
                    cellDates: true,
                    cellNF: false,
                    cellStyles: false,
                });

                const sheets = workbook.SheetNames.map((sheetName) => {
                    const worksheet = workbook.Sheets[sheetName];

                    const rows = XLSX.utils.sheet_to_json(worksheet, {
                        header: 1,
                        defval: "",
                        raw: false,
                    });

                    return {
                        name: sheetName,
                        rows: rows.filter((row) => !isBlankRow(row)),
                    };
                });

                if (cancelled) return;

                setWorkbookData({ sheets });
                setActiveSheet(sheets[0]?.name || "");
            } catch (error) {
                console.error("Excel preview failed", error);
                toast.error("Unable to preview Excel file. Please download it.");
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        loadExcel();

        return () => {
            cancelled = true;
        };
    }, [open, fileUrl]);

    const currentSheet = useMemo(() => {
        return workbookData?.sheets?.find((sheet) => sheet.name === activeSheet);
    }, [workbookData, activeSheet]);

    if (!open) return null;

    const rows = currentSheet?.rows || [];
    const maxColumns = Math.max(0, ...rows.map((row) => row.length));

    return createPortal(
        <div className="fixed inset-0 z-[99999] bg-black/60 p-4">
            <div className="mx-auto flex h-full max-w-7xl flex-col overflow-hidden rounded-xl bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                    <div>
                        <h2 className="text-base font-semibold text-gray-900">
                            Excel Preview
                        </h2>
                        <p className="text-xs text-gray-500">{fileName || "Excel file"}</p>
                    </div>

                    <div className="flex items-center gap-2">
                        {fileUrl && (
                            <a
                                href={fileUrl}
                                download
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                            >
                                <Download className="h-4 w-4" />
                                Download Original
                            </a>
                        )}

                        <button
                            type="button"
                            onClick={onClose}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {workbookData?.sheets?.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto border-b border-gray-200 px-4 py-2">
                        {workbookData.sheets.map((sheet) => (
                            <button
                                key={sheet.name}
                                type="button"
                                onClick={() => setActiveSheet(sheet.name)}
                                className={`whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium ${activeSheet === sheet.name
                                    ? "bg-primary text-white"
                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                    }`}
                            >
                                {sheet.name}
                            </button>
                        ))}
                    </div>
                )}

                <div className="flex-1 overflow-auto">
                    {loading ? (
                        <div className="flex h-full items-center justify-center text-sm text-gray-500">
                            Loading Excel preview...
                        </div>
                    ) : !rows.length ? (
                        <div className="flex h-full items-center justify-center text-sm text-gray-500">
                            No preview data found in this Excel file.
                        </div>
                    ) : (
                        <table className="min-w-full border-collapse text-xs">
                            <thead>
                                <tr>
                                    <th className="sticky left-0 top-0 z-20 border border-gray-200 bg-gray-100 px-2 py-2 text-left font-semibold text-gray-600">
                                        #
                                    </th>

                                    {Array.from({ length: maxColumns }).map((_, colIndex) => (
                                        <th
                                            key={colIndex}
                                            className="sticky top-0 z-10 min-w-[140px] border border-gray-200 bg-gray-100 px-2 py-2 text-left font-semibold text-gray-600"
                                        >
                                            {XLSX.utils.encode_col(colIndex)}
                                        </th>
                                    ))}
                                </tr>
                            </thead>

                            <tbody>
                                {rows.map((row, rowIndex) => (
                                    <tr key={rowIndex} className="hover:bg-gray-50">
                                        <td className="sticky left-0 z-10 border border-gray-200 bg-gray-50 px-2 py-2 text-gray-500">
                                            {rowIndex + 1}
                                        </td>

                                        {Array.from({ length: maxColumns }).map((_, colIndex) => (
                                            <td
                                                key={colIndex}
                                                className="max-w-[260px] border border-gray-200 px-2 py-2 text-gray-700"
                                                title={String(row[colIndex] ?? "")}
                                            >
                                                <div className="max-w-[260px] truncate">
                                                    {String(row[colIndex] ?? "")}
                                                </div>
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                <div className="border-t border-gray-200 bg-gray-50 px-4 py-2 text-xs text-gray-500">
                    Preview is for reading only. Use Download Original for the actual Excel file.
                </div>
            </div>
        </div>,
        document.body
    );
}