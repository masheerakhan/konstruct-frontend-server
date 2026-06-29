import { useRef } from "react";
import { Eye, FileCheck, Plus, Trash2, Upload } from "lucide-react";

function toFileArray(files) {
    if (!files) return [];
    if (files instanceof FileList) return Array.from(files);
    if (Array.isArray(files)) return files.filter(Boolean);
    return [files].filter(Boolean);
}

function isBrowserFile(file) {
    return typeof File !== "undefined" && file instanceof File;
}

function getFileName(file, index) {
    return (
        file?.name ||
        file?.file_name ||
        file?.filename ||
        file?.original_filename ||
        file?.originalFilename ||
        `File ${index + 1}`
    );
}

function getFileUrl(file) {
    return (
        file?.url ||
        file?.file_url ||
        file?.fileUrl ||
        file?.download_url ||
        file?.downloadUrl ||
        file?.open_url ||
        file?.openUrl ||
        ""
    );
}

function canDefaultView(file) {
    return isBrowserFile(file) || Boolean(getFileUrl(file));
}

export default function FileUploadControl({
    files = [],
    multiple = false,
    append = false,
    accept = ".pdf,.jpg,.jpeg,.png,.doc,.docx",
    disabled = false,

    uploadLabel = "Upload",
    addMoreLabel = "Add More",
    viewLabel = "View",
    deleteLabel = "Delete",

    align = "start", // start | end
    showFileName = true,
    compact = true,

    onFilesChange,
    onView,
    onDelete,
    className = "",
}) {
    const inputRef = useRef(null);
    const currentFiles = toFileArray(files);
    const hasFiles = currentFiles.length > 0;

    const justifyClass = align === "end" ? "items-end text-right" : "items-start text-left";

    const handlePick = (pickedFiles) => {
        const picked = Array.from(pickedFiles || []).filter((f) => f instanceof File);
        if (!picked.length) return;

        const nextFiles = multiple
            ? append
                ? [...currentFiles, ...picked]
                : picked
            : picked.slice(0, 1);

        onFilesChange?.(nextFiles);
    };

    const handleDefaultView = (file) => {
        let url = getFileUrl(file);
        let shouldRevoke = false;

        if (!url && isBrowserFile(file)) {
            url = URL.createObjectURL(file);
            shouldRevoke = true;
        }

        if (!url) return;

        window.open(url, "_blank", "noopener,noreferrer");

        if (shouldRevoke) {
            window.setTimeout(() => URL.revokeObjectURL(url), 30000);
        }
    };

    const handleView = (file, index) => {
        if (onView) {
            onView(file, index);
            return;
        }

        handleDefaultView(file);
    };

    const handleDelete = (file, index) => {
        if (onDelete) {
            onDelete(file, index);
            return;
        }

        const nextFiles = currentFiles.filter((_, i) => i !== index);
        onFilesChange?.(nextFiles);
    };

    return (
        <div className={`flex flex-col gap-1 ${justifyClass} ${className}`}>
            {!hasFiles ? (
                <button
                    type="button"
                    disabled={disabled}
                    onClick={() => inputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-sm border border-primary/30 bg-orange-50 text-primary hover:bg-orange-100/50 disabled:cursor-not-allowed disabled:opacity-50"
                    title="Click to select files"
                >
                    <Upload className="w-3.5 h-3.5 shrink-0" />
                    <span>{uploadLabel}</span>
                </button>
            ) : (
                <div className={`flex flex-wrap gap-2 ${align === "end" ? "justify-end" : "justify-start"}`}>
                    {currentFiles.map((file, index) => {
                        const fileName = getFileName(file, index);
                        const canView = onView || canDefaultView(file);

                        return (
                            <div
                                key={`${fileName}-${index}`}
                                className="inline-flex max-w-full items-center gap-1.5 rounded-sm border border-emerald-500/30 bg-emerald-50 px-2 py-1 text-[11px] text-emerald-700"
                            >
                                <FileCheck className="h-3.5 w-3.5 shrink-0" />

                                {showFileName && (
                                    <span
                                        className={`${compact ? "max-w-[120px]" : "max-w-[220px]"} truncate font-semibold`}
                                        title={fileName}
                                    >
                                        {fileName}
                                    </span>
                                )}

                                <button
                                    type="button"
                                    disabled={!canView}
                                    onClick={() => handleView(file, index)}
                                    className="inline-flex items-center gap-1 rounded-sm border border-emerald-200 bg-white px-2 py-0.5 font-semibold text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                                    title="View uploaded file"
                                >
                                    <Eye className="h-3 w-3" />
                                    {viewLabel}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => handleDelete(file, index)}
                                    className="inline-flex items-center gap-1 rounded-sm border border-red-200 bg-red-50 px-2 py-0.5 font-semibold text-red-600 hover:bg-red-100"
                                    title="Delete uploaded file"
                                >
                                    <Trash2 className="h-3 w-3" />
                                    {deleteLabel}
                                </button>
                            </div>
                        );
                    })}

                    {multiple && (
                        <button
                            type="button"
                            disabled={disabled}
                            onClick={() => inputRef.current?.click()}
                            className="inline-flex items-center gap-1.5 rounded-sm border border-orange-200 bg-orange-50 px-2 py-1 text-[11px] font-semibold text-primary hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            {addMoreLabel}
                        </button>
                    )}
                </div>
            )}

            <input
                ref={inputRef}
                type="file"
                multiple={multiple}
                accept={accept}
                disabled={disabled}
                className="hidden"
                onChange={(e) => {
                    handlePick(e.target.files);
                    e.target.value = "";
                }}
            />
        </div>
    );
}