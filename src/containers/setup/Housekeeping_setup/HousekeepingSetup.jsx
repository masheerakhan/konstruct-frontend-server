import React, { useState, useCallback } from "react";
import { Upload, FileSpreadsheet, CheckCircle2 } from "lucide-react";
import * as XLSX from "xlsx";

function HousekeepingSetup({ onUploadComplete }) {
    const [dragActive, setDragActive] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [lastUploadedAt, setLastUploadedAt] = useState(null);

    const handleFiles = useCallback(
        (files) => {
            if (!files || !files.length) return;
            const file = files[0];

            setSelectedFile(file);
            setLastUploadedAt(new Date());

            const reader = new FileReader();

            reader.onload = (event) => {
                try {
                    const arrayBuffer = event.target?.result;
                    if (!arrayBuffer) return;

                    const workbook = XLSX.read(arrayBuffer, { type: "array" });
                    const names = workbook.SheetNames || [];
                    if (!names.length) return;

                    const firstSheet = names[0];
                    const sheet = workbook.Sheets[firstSheet];
                    const rows = XLSX.utils.sheet_to_json(sheet, {
                        header: 1,
                        defval: "",
                    });

                    if (onUploadComplete) {
                        onUploadComplete(rows, names, firstSheet, file.name);
                    }
                } catch (err) {
                    console.error("Failed to parse Excel in HousekeepingSetup:", err);
                }
            };

            reader.onerror = () => {
                console.error("FileReader error while reading Excel");
            };

            reader.readAsArrayBuffer(file);
        },
        [onUploadComplete]
    );

    const onInputChange = (e) => {
        const files = e.target.files;
        handleFiles(files);
    };

    const onDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(true);
    };

    const onDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
    };

    const onDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const onDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
            handleFiles(e.dataTransfer.files);
            e.dataTransfer.clearData();
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-orange-100 px-10 py-12 text-center">
            <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-orange-500/10 mb-4">
                <FileSpreadsheet className="h-7 w-7 text-orange-500" />
            </div>

            <h1 className="text-2xl font-semibold text-gray-900">
                Excel to Form Builder
            </h1>
            <p className="mt-1 text-sm text-gray-500">
                Upload an Excel file to convert rows into safety checklist questions.
            </p>

            <div
                className={`mt-8 rounded-2xl border-2 border-dashed px-8 py-10 transition-colors relative ${dragActive
                        ? "border-orange-400 bg-orange-50/60"
                        : "border-orange-200 bg-orange-50/30"
                    }`}
                onDragEnter={onDragEnter}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
            >
                <div className="flex flex-col items-center justify-center gap-3 pointer-events-none">
                    <div className="h-12 w-12 rounded-full bg-white shadow-sm flex items-center justify-center">
                        <Upload className="h-5 w-5 text-orange-500" />
                    </div>
                    <div className="text-sm text-gray-700">
                        <span className="font-medium text-orange-600">
                            Drop your .xlsx file here
                        </span>
                        <span className="mx-1 text-gray-400">or</span>
                        <span className="underline text-orange-600">
                            click to browse
                        </span>
                    </div>
                    <p className="text-xs text-gray-400">
                        Supported formats: .xlsx, .xls · Max size 5 MB
                    </p>
                </div>

                <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={onInputChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
            </div>

            {selectedFile && (
                <div className="mt-6 flex items-center justify-center gap-3 text-sm">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 text-green-700">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="font-medium">{selectedFile.name}</span>
                    </div>
                    {lastUploadedAt && (
                        <span className="text-xs text-gray-400">
                            uploaded at{" "}
                            {lastUploadedAt.toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                            })}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}

export default HousekeepingSetup;
