import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import {
    Plus,
    Trash2,
    FileText,
    ShieldCheck,
    ChevronDown,
    Eye,
    Download,
    Loader2,
    X,
    Printer,
    ExternalLink,
    FileDown,
    Upload,
} from "lucide-react";
import toast from "react-hot-toast";
import { getProjectsForCurrentUser, getDmsBoxFileRegister, saveDmsBoxFileRegister } from "../../../api/index";
import { capitalCase } from "../Transmittal/stringCase";

function newRowId() {
    return typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `row-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** One blank row: File No and first volume default to 1 (sequencing may reassign file no). */
function makeEmptyRow() {
    return {
        id: newRowId(),
        fileName: "",
        fileNo: "1",
        volumes: [{ volume: "1" }],
        remarks: "",
        attachments: [],
    };
}

function renumberFileNos(rows) {
    return rows.map((r, i) => ({ ...r, fileNo: String(i + 1) }));
}

/** Per-row volume labels 1…n (each row counts from 1 again). */
function renumberVolumesForRow(row) {
    const vols = row.volumes?.length ? row.volumes : [{ volume: "1" }];
    return {
        ...row,
        volumes: vols.map((v, j) => ({ ...v, volume: String(j + 1) })),
    };
}

/** Apply sequential file numbers and per-row volume numbering (used after load/save/reset). */
function applyRowSequencing(rows) {
    if (!Array.isArray(rows) || rows.length === 0) {
        return [makeEmptyRow()];
    }
    return renumberFileNos(rows.map((r) => renumberVolumesForRow(r)));
}

function fromApiRow(r) {
    const vols = Array.isArray(r.volumes) && r.volumes.length > 0
        ? r.volumes.map((v) => ({
            volume: typeof v === "string" ? v : String(v?.volume ?? ""),
        }))
        : [{ volume: "" }];
    return {
        id: r.id || newRowId(),
        fileName: String(r.file_name ?? ""),
        fileNo: String(r.file_no ?? ""),
        remarks: String(r.remarks ?? ""),
        volumes: vols,
        attachments: Array.isArray(r.attachments) ? r.attachments : [],
    };
}

function toApiRow(r, idx) {
    return {
        id: r.id,
        sort_order: idx,
        file_name: r.fileName ?? "",
        file_no: r.fileNo ?? "",
        remarks: r.remarks ?? "",
        volumes: (r.volumes || []).map((v) => v.volume ?? ""),
    };
}

function primaryAttachment(row) {
    const list = row.attachments || [];
    return list.length > 0 ? list[0] : null;
}

function escapeHtml(s) {
    return String(s ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

/** Embed data URL in HTML img src (safe in double-quoted attributes). */
function escapeDataUrlForHtmlAttr(url) {
    return String(url || "")
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;");
}

const LABEL_MAX_LOGO_BYTES = 3 * 1024 * 1024;

function readImageFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
        if (!file?.type?.startsWith("image/")) {
            reject(new Error("not-image"));
            return;
        }
        if (file.size > LABEL_MAX_LOGO_BYTES) {
            reject(new Error("too-large"));
            return;
        }
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("read-failed"));
        reader.readAsDataURL(file);
    });
}

function LabelLogoSlot({
    variant,
    imageSrc,
    onPickFile,
    onClear,
    emptyHint,
}) {
    const inputRef = useRef(null);
    const isBottom = variant === "bottom";

    return (
        <div
            className={`relative flex min-h-[112px] flex-col items-center justify-center border-b border-muted-foreground/30 px-2 py-2 ${
                isBottom ? "bg-[hsl(210,90%,55%)] border-t border-muted-foreground/30" : "bg-muted/20"
            }`}
        >
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onPickFile(f);
                    e.target.value = "";
                }}
            />
            {imageSrc ? (
                <>
                    <img
                        src={imageSrc}
                        alt=""
                        className={`max-h-[120px] w-full max-w-[95%] object-contain ${isBottom ? "drop-shadow-sm" : ""}`}
                    />
                    <div className="absolute right-1 top-1 flex gap-0.5">
                        <button
                            type="button"
                            onClick={() => inputRef.current?.click()}
                            className={`rounded p-1 text-[10px] font-medium ${
                                isBottom
                                    ? "bg-white/20 text-white hover:bg-white/30"
                                    : "bg-background/90 text-foreground shadow-sm hover:bg-background"
                            }`}
                        >
                            {capitalCase("change")}
                        </button>
                        <button
                            type="button"
                            onClick={(ev) => {
                                ev.stopPropagation();
                                onClear();
                            }}
                            className={`rounded p-1 ${
                                isBottom
                                    ? "bg-white/20 text-white hover:bg-white/30"
                                    : "bg-destructive/10 text-destructive hover:bg-destructive/20"
                            }`}
                            aria-label={capitalCase("remove logo")}
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </>
            ) : (
                <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className={`flex flex-col items-center justify-center gap-1 rounded-md border border-dashed px-3 py-3 text-center transition-colors ${
                        isBottom
                            ? "border-white/50 text-white hover:bg-white/10"
                            : "border-muted-foreground/40 text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                    }`}
                >
                    <Upload className={`h-5 w-5 ${isBottom ? "text-white" : ""}`} />
                    <span className={`text-[10px] font-semibold leading-tight ${isBottom ? "text-white" : ""}`}>
                        {emptyHint}
                    </span>
                </button>
            )}
        </div>
    );
}

function BoxFileLabel({ data, companyLogoSrc, pmcLogoSrc, onCompanyLogoFile, onPmcLogoFile, onClearCompanyLogo, onClearPmcLogo }) {
    const dept = data.department === "HSE" ? "HSE" : "QUALITY";
    return (
        <div
            className="w-[320px] max-w-full border-2 border-muted-foreground/40 bg-background flex flex-col text-center font-sans shadow-sm"
            style={{ minHeight: 520 }}
        >
            <LabelLogoSlot
                variant="top"
                imageSrc={companyLogoSrc}
                onPickFile={onCompanyLogoFile}
                onClear={onClearCompanyLogo}
                emptyHint={capitalCase("upload company logo")}
            />
            <div className="bg-[hsl(270,80%,45%)] text-white font-bold text-sm py-2.5 border-b border-muted-foreground/30 tracking-wide">
                {data.company || "COMPANY"}
            </div>
            <div className="bg-[hsl(210,90%,55%)] text-white font-bold text-sm py-2.5 border-b border-muted-foreground/30">
                {data.projectName || "PROJECT NAME"}
            </div>
            <div className="flex min-h-[140px] flex-1 flex-col items-center justify-center gap-3 py-5 px-3">
                <div className="text-xs font-semibold text-foreground leading-tight">{data.fileName || "FILE NAME"}</div>
                <div className="border-2 border-destructive rounded-full px-4 py-1">
                    <span className="text-destructive font-bold text-xs tracking-wide">{dept}</span>
                </div>
            </div>
            <div className="text-[10px] text-muted-foreground border-t border-muted-foreground/30 py-1.5">
                {data.department || "Department Name"}
            </div>
            <div className="grid grid-cols-2 border-t border-muted-foreground/30">
                <div className="border-r border-muted-foreground/30 py-2">
                    <div className="text-[9px] text-muted-foreground font-semibold uppercase">File No</div>
                    <div className="text-sm font-bold text-foreground">{data.fileNo || "—"}</div>
                </div>
                <div className="py-2">
                    <div className="text-[9px] text-muted-foreground font-semibold uppercase">Volume</div>
                    <div className="text-sm font-bold text-foreground">{data.volume || "—"}</div>
                </div>
            </div>
            <LabelLogoSlot
                variant="bottom"
                imageSrc={pmcLogoSrc}
                onPickFile={onPmcLogoFile}
                onClear={onClearPmcLogo}
                emptyHint={capitalCase("upload pmc logo")}
            />
        </div>
    );
}

function downloadLabelHtml(data, logos = {}) {
    const companyLogo = logos.companyLogo || "";
    const pmcLogo = logos.pmcLogo || "";
    const safe = {
        company: escapeHtml(data.company),
        projectName: escapeHtml(data.projectName),
        fileName: escapeHtml(data.fileName),
        department: escapeHtml(data.department),
        fileNo: escapeHtml(data.fileNo),
        volume: escapeHtml(data.volume),
    };
    const badge = data.department === "HSE" ? "HSE" : "QUALITY";
    const topBlock = companyLogo
        ? `<div class="logo-slot logo-slot-top"><img src="${escapeDataUrlForHtmlAttr(companyLogo)}" alt="" /></div>`
        : `<div class="logo-slot logo-slot-top logo-placeholder">Company logo — add image in app preview</div>`;
    const bottomBlock = pmcLogo
        ? `<div class="logo-slot logo-slot-bottom"><img src="${escapeDataUrlForHtmlAttr(pmcLogo)}" alt="" /></div>`
        : `<div class="logo-slot logo-slot-bottom logo-placeholder">PMC logo — add image in app preview</div>`;
    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Box File Label</title>
<style>
  body{margin:0;padding:20px;font-family:Arial,sans-serif}
  .label{width:320px;border:2px solid #999;text-align:center;margin:auto;display:flex;flex-direction:column;min-height:520px;background:#fff}
  .logo-slot{min-height:112px;display:flex;align-items:center;justify-content:center;box-sizing:border-box;border-bottom:1px solid #ccc}
  .logo-slot-top{background:#f5f5f5}
  .logo-slot-bottom{background:#2979ff;border-top:1px solid #ccc;border-bottom:none}
  .logo-slot img{max-height:120px;max-width:95%;object-fit:contain;display:block;margin:0 auto}
  .logo-placeholder{font-size:10px;color:#888;padding:12px}
  .logo-slot-bottom.logo-placeholder{color:rgba(255,255,255,0.9)}
  .company{background:#7b2d8e;color:#fff;font-weight:bold;font-size:14px;padding:10px;border-bottom:1px solid #ccc}
  .project{background:#2979ff;color:#fff;font-weight:bold;font-size:14px;padding:10px;border-bottom:1px solid #ccc}
  .file-section{flex:1;min-height:140px;padding:24px 12px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px}
  .file-name{font-size:11px;font-weight:600}
  .badge{border:2px solid #e53935;border-radius:20px;padding:4px 16px;font-size:11px;color:#e53935;font-weight:bold}
  .dept{font-size:10px;color:#888;padding:8px;border-top:1px solid #ccc}
  .bottom-row{display:grid;grid-template-columns:1fr 1fr;border-top:1px solid #ccc}
  .bottom-cell{padding:10px 6px;text-align:center}
  .bottom-cell+.bottom-cell{border-left:1px solid #ccc}
  .bottom-label{font-size:9px;color:#888;font-weight:600;text-transform:uppercase}
  .bottom-value{font-size:14px;font-weight:bold}
</style></head><body>
<div class="label">
  ${topBlock}
  <div class="company">${safe.company}</div>
  <div class="project">${safe.projectName}</div>
  <div class="file-section">
    <div class="file-name">${safe.fileName}</div>
    <div class="badge">${badge}</div>
  </div>
  <div class="dept">${safe.department}</div>
  <div class="bottom-row">
    <div class="bottom-cell"><div class="bottom-label">File No</div><div class="bottom-value">${safe.fileNo}</div></div>
    <div class="bottom-cell"><div class="bottom-label">Volume</div><div class="bottom-value">${safe.volume}</div></div>
  </div>
  ${bottomBlock}
</div>
</body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const baseName = (data.fileName || "Label").replace(/[/\\?%*:|"<>]/g, "-").slice(0, 80);
    a.download = `Label_${baseName}_Vol${data.volume || "1"}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Box file master list: server-backed when folder + project are set.
 */
export default function BoxFileRegister({ folderId }) {
    const [activeTab, setActiveTab] = useState("quality");
    const [selectedProject, setSelectedProject] = useState("");
    const [projectOptions, setProjectOptions] = useState([]);
    const [qualityRows, setQualityRows] = useState(() => [makeEmptyRow()]);
    const [hseRows, setHseRows] = useState(() => [makeEmptyRow()]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [labelModal, setLabelModal] = useState({ open: false, data: null });
    const [volumePicker, setVolumePicker] = useState({
        open: false,
        row: null,
        action: "view",
    });
    const [labelCompanyLogo, setLabelCompanyLogo] = useState(null);
    const [labelPmcLogo, setLabelPmcLogo] = useState(null);
    const labelRef = useRef(null);

    const labelLogosPayload = useMemo(
        () => ({ companyLogo: labelCompanyLogo, pmcLogo: labelPmcLogo }),
        [labelCompanyLogo, labelPmcLogo]
    );

    const handleLabelCompanyLogoFile = useCallback(async (file) => {
        try {
            const url = await readImageFileAsDataUrl(file);
            setLabelCompanyLogo(url);
        } catch (e) {
            if (e?.message === "not-image") {
                toast.error(capitalCase("please choose an image file"));
            } else if (e?.message === "too-large") {
                toast.error(capitalCase("image must be 3 mb or smaller"));
            } else {
                toast.error(capitalCase("could not read image"));
            }
        }
    }, []);

    const handleLabelPmcLogoFile = useCallback(async (file) => {
        try {
            const url = await readImageFileAsDataUrl(file);
            setLabelPmcLogo(url);
        } catch (e) {
            if (e?.message === "not-image") {
                toast.error(capitalCase("please choose an image file"));
            } else if (e?.message === "too-large") {
                toast.error(capitalCase("image must be 3 mb or smaller"));
            } else {
                toast.error(capitalCase("could not read image"));
            }
        }
    }, []);

    const selectedProjectName = useMemo(
        () => projectOptions.find((p) => p.id === selectedProject)?.name ?? "",
        [projectOptions, selectedProject]
    );

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const projRes = await getProjectsForCurrentUser();
                const projectsRaw = Array.isArray(projRes.data) ? projRes.data : projRes.data?.results ?? [];
                const opts = projectsRaw
                    .filter((p) => p?.id != null)
                    .map((p) => ({
                        id: String(p.id),
                        name: p.name || p.project_name || `Project ${p.id}`,
                    }));
                if (!cancelled) {
                    setProjectOptions(opts);
                    setSelectedProject((prev) => prev || opts[0]?.id || "");
                }
            } catch {
                if (!cancelled) setProjectOptions([]);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (!folderId || !selectedProject) {
            setQualityRows([makeEmptyRow()]);
            setHseRows([makeEmptyRow()]);
            return;
        }
        let cancelled = false;
        (async () => {
            setLoading(true);
            try {
                const res = await getDmsBoxFileRegister({
                    folder: folderId,
                    project_id: selectedProject,
                });
                const q = res?.data?.quality_rows;
                const h = res?.data?.hse_rows;
                if (cancelled) return;
                setQualityRows(
                    Array.isArray(q) && q.length > 0 ? applyRowSequencing(q.map(fromApiRow)) : [makeEmptyRow()]
                );
                setHseRows(
                    Array.isArray(h) && h.length > 0 ? applyRowSequencing(h.map(fromApiRow)) : [makeEmptyRow()]
                );
            } catch {
                if (!cancelled) {
                    setQualityRows([makeEmptyRow()]);
                    setHseRows([makeEmptyRow()]);
                    toast.error(capitalCase("could not load box file register"));
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [folderId, selectedProject]);

    const rows = activeTab === "quality" ? qualityRows : hseRows;
    const setRows = activeTab === "quality" ? setQualityRows : setHseRows;

    const handleSave = async () => {
        if (!folderId || !selectedProject) {
            toast.error(capitalCase("select a project first"));
            return;
        }
        setSaving(true);
        try {
            const res = await saveDmsBoxFileRegister({
                folder: folderId,
                project_id: selectedProject,
                quality_rows: qualityRows.map(toApiRow),
                hse_rows: hseRows.map(toApiRow),
            });
            const q = res?.data?.quality_rows;
            const h = res?.data?.hse_rows;
            if (Array.isArray(q) && q.length > 0) setQualityRows(applyRowSequencing(q.map(fromApiRow)));
            else setQualityRows([makeEmptyRow()]);
            if (Array.isArray(h) && h.length > 0) setHseRows(applyRowSequencing(h.map(fromApiRow)));
            else setHseRows([makeEmptyRow()]);
            toast.success(capitalCase("saved"));
        } catch (err) {
            const msg =
                err?.response?.data?.detail ||
                (typeof err?.response?.data === "object"
                    ? Object.values(err.response.data).flat().filter(Boolean).join(" ")
                    : null) ||
                err?.message ||
                "Save failed";
            toast.error(msg);
        } finally {
            setSaving(false);
        }
    };

    const updateRow = useCallback(
        (id, field, value) => {
            setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
        },
        [setRows]
    );

    const updateVolume = useCallback(
        (rowId, volIdx, value) => {
            setRows((prev) =>
                prev.map((r) =>
                    r.id === rowId
                        ? {
                            ...r,
                            volumes: r.volumes.map((v, i) => (i === volIdx ? { volume: value } : v)),
                        }
                        : r
                )
            );
        },
        [setRows]
    );

    const addVolume = useCallback(
        (rowId) => {
            setRows((prev) =>
                prev.map((r) =>
                    r.id === rowId
                        ? {
                            ...r,
                            volumes: [...r.volumes, { volume: String(r.volumes.length + 1) }],
                        }
                        : r
                )
            );
        },
        [setRows]
    );

    const removeVolume = useCallback(
        (rowId, volIdx) => {
            setRows((prev) =>
                prev.map((r) => {
                    if (r.id !== rowId || r.volumes.length <= 1) return r;
                    const next = r.volumes.filter((_, i) => i !== volIdx);
                    return renumberVolumesForRow({ ...r, volumes: next });
                })
            );
        },
        [setRows]
    );

    const addRow = useCallback(() => {
        setRows((prev) => renumberFileNos([...prev, makeEmptyRow()]));
    }, [setRows]);

    const deleteRow = useCallback(
        (id) => {
            setRows((prev) => {
                if (prev.length <= 1) return prev;
                return renumberFileNos(prev.filter((r) => r.id !== id));
            });
        },
        [setRows]
    );

    const handleViewAttachment = (row) => {
        const att = primaryAttachment(row);
        const url = att?.file_url;
        if (!url) {
            toast(capitalCase("no attachment on this row yet"));
            return;
        }
        window.open(url, "_blank", "noopener,noreferrer");
    };

    const handleDownloadAttachment = (row) => {
        const att = primaryAttachment(row);
        const url = att?.file_url;
        if (!url) {
            toast(capitalCase("no attachment on this row yet"));
            return;
        }
        const name = att.original_filename || "attachment";
        const a = document.createElement("a");
        a.href = url;
        a.download = name;
        a.rel = "noopener noreferrer";
        a.target = "_blank";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const buildLabelData = useCallback(
        (row, volumeValue) => ({
            company: "COMPANY",
            projectName: selectedProjectName || capitalCase("project name"),
            fileName: row.fileName,
            department: activeTab === "quality" ? "Quality" : "HSE",
            fileNo: row.fileNo,
            volume: volumeValue,
        }),
        [activeTab, selectedProjectName]
    );

    const handleLabelAction = useCallback(
        (row, action) => {
            if (row.volumes.length > 1) {
                setVolumePicker({ open: true, row, action });
            } else {
                const vol = row.volumes[0]?.volume || "1";
                const data = buildLabelData(row, vol);
                if (action === "view") {
                    setLabelModal({ open: true, data });
                } else {
                    downloadLabelHtml(data, labelLogosPayload);
                }
            }
        },
        [buildLabelData, labelLogosPayload]
    );

    const handleVolumeSelect = useCallback(
        (vol) => {
            if (!volumePicker.row) return;
            const { row, action } = volumePicker;
            const data = buildLabelData(row, vol.volume);
            setVolumePicker({ open: false, row: null, action: "view" });
            if (action === "view") {
                setLabelModal({ open: true, data });
            } else {
                downloadLabelHtml(data, labelLogosPayload);
            }
        },
        [volumePicker, buildLabelData, labelLogosPayload]
    );

    const handlePrintLabel = useCallback(() => {
        if (!labelRef.current) return;
        const printWindow = window.open("", "_blank");
        if (!printWindow) return;
        printWindow.document.write(
            `<!DOCTYPE html><html><head><style>
      body{margin:0;padding:20px;font-family:Arial,sans-serif}
      .label{width:320px;border:2px solid #999;margin:auto}
      img{max-height:120px;max-width:95%;object-fit:contain}
      @media print{body{padding:0}}
    </style></head><body>${labelRef.current.innerHTML}</body></html>`
        );
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
    }, []);

    const tabLabel = activeTab === "quality" ? "Quality" : "HSE";

    return (
        <div className="bg-card rounded-xl border border-border shadow-sm mb-8 relative">
            {saving ? (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-card/70 text-sm text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin mr-2" aria-hidden />
                    {capitalCase("saving")}…
                </div>
            ) : null}
            <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-border">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center shrink-0">
                            <FileText className="h-5 w-5 text-primary-foreground" />
                        </div>
                        <div>
                            <h2 className="text-base sm:text-lg font-semibold text-foreground">Box File Master List</h2>
                            <p className="text-xs sm:text-sm text-muted-foreground">
                                Rows are saved per project. Use Save after editing.
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                        <label className="text-xs font-semibold uppercase tracking-wide text-primary shrink-0">
                            {capitalCase("project")}
                        </label>
                        <div className="relative min-w-[200px]">
                            <select
                                value={selectedProject}
                                onChange={(e) => setSelectedProject(e.target.value)}
                                disabled={loading}
                                className="h-9 w-full rounded-md border border-input bg-card pl-3 pr-8 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring appearance-none cursor-pointer disabled:opacity-50"
                            >
                                <option value="">{capitalCase("select project")}</option>
                                {projectOptions.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.name}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                        </div>
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={saving || loading || !folderId || !selectedProject}
                            className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50"
                        >
                            {capitalCase("save")}
                        </button>
                    </div>
                </div>
            </div>

            <div className="px-4 sm:px-6 pt-4">
                <p className="text-xs text-muted-foreground mb-3">
                    {capitalCase("register")}: choose Quality or HSE — each has its own rows.
                </p>
                <div className="flex gap-1 mb-4">
                    {[
                        { key: "quality", label: "Quality register", Icon: FileText },
                        { key: "hse", label: "HSE register", Icon: ShieldCheck },
                    ].map(({ key, label, Icon }) => (
                        <button
                            key={key}
                            type="button"
                            onClick={() => setActiveTab(key)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-sm font-semibold transition-colors ${activeTab === key
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-secondary text-secondary-foreground hover:bg-table-row-hover"
                                }`}
                        >
                            <Icon className="h-4 w-4 shrink-0" />
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="px-4 sm:px-6 pb-6">
                {loading ? (
                    <p className="text-sm text-muted-foreground py-8 text-center">
                        <Loader2 className="h-5 w-5 inline-block animate-spin mr-2 align-middle" aria-hidden />
                        {capitalCase("loading")}…
                    </p>
                ) : (
                    <div className="rounded-lg border border-border overflow-hidden bg-card">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b-2 border-primary">
                                        <th className="px-3 py-3 text-left font-semibold text-primary w-16">S.No</th>
                                        <th className="px-3 py-3 text-left font-semibold text-primary min-w-[250px]">
                                            Name of File
                                        </th>
                                        <th className="px-3 py-3 text-left font-semibold text-primary w-24">File No</th>
                                        <th className="px-3 py-3 text-left font-semibold text-primary min-w-[160px]">Volume</th>
                                        <th className="px-3 py-3 text-left font-semibold text-primary min-w-[200px]">Remarks</th>
                                        <th className="px-3 py-3 text-center font-semibold text-primary min-w-[140px]">
                                            Action
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((row, rowIdx) => (
                                        <tr
                                            key={row.id}
                                            className={`border-t border-border transition-colors hover:bg-table-row-hover ${rowIdx % 2 === 0 ? "bg-card" : "bg-table-row-even"
                                                }`}
                                        >
                                            <td className="px-3 py-2 align-top">
                                                <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-primary/10 text-primary font-semibold text-xs">
                                                    {rowIdx + 1}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2 align-top">
                                                <input
                                                    type="text"
                                                    value={row.fileName}
                                                    onChange={(e) => updateRow(row.id, "fileName", e.target.value)}
                                                    className="w-full h-9 rounded-md border border-input bg-background px-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                                    placeholder={capitalCase("name of file")}
                                                />
                                            </td>
                                            <td className="px-3 py-2 align-top">
                                                <input
                                                    type="text"
                                                    value={row.fileNo}
                                                    onChange={(e) => updateRow(row.id, "fileNo", e.target.value)}
                                                    className="w-full h-9 rounded-md border border-input bg-background px-2.5 text-sm text-foreground text-center focus:outline-none focus:ring-2 focus:ring-ring"
                                                    placeholder="—"
                                                />
                                            </td>
                                            <td className="px-3 py-2 align-top">
                                                <div className="space-y-1.5">
                                                    {row.volumes.map((vol, vIdx) => (
                                                        <div key={vIdx} className="flex items-center gap-1.5">
                                                            <input
                                                                type="text"
                                                                value={vol.volume}
                                                                onChange={(e) => updateVolume(row.id, vIdx, e.target.value)}
                                                                className="w-16 h-8 rounded border border-input bg-background px-2 text-sm text-foreground text-center focus:outline-none focus:ring-2 focus:ring-ring"
                                                                placeholder="—"
                                                            />
                                                            {row.volumes.length > 1 ? (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeVolume(row.id, vIdx)}
                                                                    className="h-6 w-6 rounded flex items-center justify-center text-destructive hover:bg-destructive/10 transition-colors"
                                                                    title="Remove volume"
                                                                >
                                                                    <Trash2 className="h-3 w-3" />
                                                                </button>
                                                            ) : null}
                                                        </div>
                                                    ))}
                                                    <button
                                                        type="button"
                                                        onClick={() => addVolume(row.id)}
                                                        className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                                                    >
                                                        <Plus className="h-3 w-3" /> Add Vol
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-3 py-2 align-top">
                                                <textarea
                                                    value={row.remarks}
                                                    onChange={(e) => updateRow(row.id, "remarks", e.target.value)}
                                                    placeholder={capitalCase("remarks")}
                                                    rows={3}
                                                    className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y min-h-[60px]"
                                                />
                                            </td>
                                            <td className="px-2 py-2 align-top">
                                                <div className="flex flex-col items-center gap-1.5">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleLabelAction(row, "view")}
                                                            className="h-8 w-8 rounded-md flex items-center justify-center text-primary border border-primary/30 hover:bg-primary/10 transition-colors"
                                                            title={capitalCase("view label")}
                                                            aria-label={capitalCase("view label")}
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleLabelAction(row, "download")}
                                                            className="h-8 w-8 rounded-md flex items-center justify-center text-primary border border-primary/30 hover:bg-primary/10 transition-colors"
                                                            title={capitalCase("download label")}
                                                            aria-label={capitalCase("download label")}
                                                        >
                                                            <Download className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                    {/* <div className="flex items-center justify-center gap-1">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleViewAttachment(row)}
                                                            className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground border border-border hover:bg-muted/50 transition-colors"
                                                            title={capitalCase("view attachment")}
                                                            aria-label={capitalCase("view attachment")}
                                                        >
                                                            <ExternalLink className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDownloadAttachment(row)}
                                                            className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground border border-border hover:bg-muted/50 transition-colors"
                                                            title={capitalCase("download attachment")}
                                                            aria-label={capitalCase("download attachment")}
                                                        >
                                                            <FileDown className="h-4 w-4" />
                                                        </button>
                                                    </div> */}
                                                    <button
                                                        type="button"
                                                        onClick={() => deleteRow(row.id)}
                                                        disabled={rows.length <= 1}
                                                        className="h-8 w-8 rounded-md flex items-center justify-center text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-40 disabled:pointer-events-none"
                                                        title={rows.length <= 1 ? "At least one row required" : "Delete row"}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="border-t border-border px-4 py-3 bg-muted/50">
                            <button
                                type="button"
                                onClick={addRow}
                                disabled={!selectedProject}
                                className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                            >
                                <Plus className="h-4 w-4" /> {capitalCase("add new entry")}
                            </button>
                        </div>
                    </div>
                )}

                <p className="text-xs text-muted-foreground mt-3">
                    {tabLabel} · {rows.length} {rows.length === 1 ? "row" : "rows"} ·{" "}
                    {capitalCase("label")}: view or download HTML; multiple volumes open a picker.{" "}
                    {capitalCase("attachment")}: first file when present.
                </p>
            </div>

            {volumePicker.open && volumePicker.row ? (
                <div
                    role="presentation"
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-foreground/40"
                    onClick={() => setVolumePicker({ open: false, row: null, action: "view" })}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        className="bg-card rounded-xl shadow-xl border border-border p-6 min-w-[300px] max-w-sm"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base font-semibold text-foreground">{capitalCase("select volume")}</h3>
                            <button
                                type="button"
                                onClick={() => setVolumePicker({ open: false, row: null, action: "view" })}
                                className="text-muted-foreground hover:text-foreground"
                                aria-label={capitalCase("close")}
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                            {capitalCase("choose which volume label to")}{" "}
                            {volumePicker.action === "view" ? capitalCase("view") : capitalCase("download")}{" "}
                            {capitalCase("for")}{" "}
                            <span className="font-medium text-foreground">{volumePicker.row.fileName}</span>
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                            {volumePicker.row.volumes.map((vol, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => handleVolumeSelect(vol)}
                                    className="px-4 py-3 rounded-lg border border-primary/30 text-sm font-semibold text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                                >
                                    Vol {vol.volume || idx + 1}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            ) : null}

            {labelModal.open && labelModal.data ? (
                <div
                    role="presentation"
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-foreground/40"
                    onClick={() => setLabelModal({ open: false, data: null })}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        className="bg-card rounded-xl shadow-xl border border-border p-6 max-w-[min(100vw-2rem,400px)] w-full"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base font-semibold text-foreground">{capitalCase("box file label")}</h3>
                            <button
                                type="button"
                                onClick={() => setLabelModal({ open: false, data: null })}
                                className="text-muted-foreground hover:text-foreground"
                                aria-label={capitalCase("close")}
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div ref={labelRef} className="flex justify-center mb-4 overflow-x-auto">
                            <BoxFileLabel
                                data={labelModal.data}
                                companyLogoSrc={labelCompanyLogo}
                                pmcLogoSrc={labelPmcLogo}
                                onCompanyLogoFile={handleLabelCompanyLogoFile}
                                onPmcLogoFile={handleLabelPmcLogoFile}
                                onClearCompanyLogo={() => setLabelCompanyLogo(null)}
                                onClearPmcLogo={() => setLabelPmcLogo(null)}
                            />
                        </div>
                        <div className="flex items-center justify-center gap-3 flex-wrap">
                            <button
                                type="button"
                                onClick={handlePrintLabel}
                                className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                            >
                                <Printer className="h-4 w-4" /> {capitalCase("print")}
                            </button>
                            <button
                                type="button"
                                onClick={() => downloadLabelHtml(labelModal.data, labelLogosPayload)}
                                className="flex items-center gap-2 px-4 py-2 rounded-md border border-primary text-primary text-sm font-medium hover:bg-primary/10 transition-colors"
                            >
                                <Download className="h-4 w-4" /> {capitalCase("download")}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}