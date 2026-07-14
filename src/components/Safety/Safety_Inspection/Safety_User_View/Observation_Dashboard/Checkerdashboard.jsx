import React, { useState, useEffect, useRef, useMemo } from "react";
import { generateObservationReportPDF } from "../../../../../utils/generateObservationReportPDF";
import {
    Clock,
    Eye,
    CheckCircle,
    CalendarDays,
    ClipboardCheck,
    TriangleAlert,
    FolderOpen,
    ArrowLeft,
    ImageIcon,
    X as XIcon,
    Check,
    Upload,
    Download,
    CircleAlert,
    ClipboardList,
    UserRound,
    ShieldCheck,
    Activity,
    Signature,
    Plus
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import { getCurrentUserId } from "../../../../../utils/UserUtils";

import { approveSafetyChecklist, getSafetyChecklist, listSafetyChecklists, rejectSafetyChecklist, resolveActiveProjectId, downloadSafetyReport, downloadSafetyObservationReport, submitSafetyChecklist, listSafetyObservations, getSafetyObservationById, downloadBlob, filenameFromDisposition } from "../../../../../api";
import { showToast } from "../../../../../utils/toast";
import SignatureCanvas from "react-signature-canvas";
import SafetyChecklistHistoryModal from "../../SafetyChecklistHistoryModal";
import SafetyChecklistCreateView from "./SafetyChecklistCreateView";
import CreateSafetyObservation from "./CreateSafetyObservation";
import ReviewSafetyObservation from "./ReviewSafetyObservation";
import { autoResizeTextarea, TemplateOptionButtons } from "./Makerdashboard";

import SafetyChecklistReadonlyModal from "../../SafetyChecklistReadonlyModal";
import SafetyObservationReadonlyModal from "../../SafetyObservationReadonlyModal";

import SafetyChecklistSignOffSection from "../../SafetyChecklistSignOffSection";
import SafetyImageAnnotationModal from "../../SafetyImageAnnotationModal";


// ─── Shared inline UI helpers ────────────────────────────────
const QuestionBadge = ({ number }) => (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-500 text-xs font-bold text-white shadow-sm">
        {number}
    </span>
);


const resolveMediaUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("http://") || path.startsWith("https://")) return path;

    const base =
        window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost"
            ? "http://127.0.0.1:8001"
            : "https://konstruct.world/checklists";

    const clean = path.startsWith("/") ? path : `/${path}`;
    return `${base}${clean}`;
};


const resolveProjectIdFromUserAccess = () => {
    try {
        const raw = localStorage.getItem("USER_DATA");
        const user = raw && raw !== "undefined" ? JSON.parse(raw) : null;

        const access = Array.isArray(user?.accesses)
            ? user.accesses.find((a) => a?.active && a?.project_id)
            : null;

        return access?.project_id || "";
    } catch {
        return "";
    }
};

const resolveOrgIdFromSession = () => {
    try {
        const raw = localStorage.getItem("USER_DATA");
        const user = raw && raw !== "undefined" ? JSON.parse(raw) : null;

        return (
            user?.org ||
            user?.org_id ||
            user?.organization_id ||
            user?.orgId ||
            localStorage.getItem("org_id") ||
            localStorage.getItem("organization_id") ||
            ""
        );
    } catch {
        return (
            localStorage.getItem("org_id") ||
            localStorage.getItem("organization_id") ||
            ""
        );
    }
};

const getBlobErrorMessage = async (response, fallbackMessage) => {
    const blob = response?.data;
    const contentType = response?.headers?.["content-type"] || blob?.type || "";

    if (!contentType.includes("application/json") || typeof blob?.text !== "function") {
        return fallbackMessage;
    }

    try {
        const text = await blob.text();
        const parsed = JSON.parse(text);
        return parsed?.detail || fallbackMessage;
    } catch {
        return fallbackMessage;
    }
};

const PhotoViewButton = ({ url, label = "View Photo" }) => {
    const finalUrl = resolveMediaUrl(url);
    if (!finalUrl) return null;

    return (
        <a
            href={finalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100 hover:border-blue-300"
        >
            <Eye className="h-3.5 w-3.5" />
            {label}
        </a>
    );
};

const NoPhotoLabel = () => (
    <span className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-border bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground">
        <ImageIcon className="h-3.5 w-3.5" />
        No photo available
    </span>
);

// const PhotoUploadArea = ({
//     id,
//     previewBase64,
//     onFileChange,
//     onRemove,
//     label = "Attach photo",
// }) => {
//     const inputRef = useRef(null);
//     const previewUrl = previewBase64
//         ? typeof previewBase64 === "string"
//             ? resolveMediaUrl(previewBase64)
//             : URL.createObjectURL(previewBase64)
//         : null;

//     const handleRemove = () => {
//         if (inputRef.current) {
//             inputRef.current.value = "";
//         }
//         onRemove?.();
//     };

//     return (
//         <div className="mt-3">
//             <p className="mb-1.5 text-xs font-medium text-muted-foreground">{label}</p>
//             {previewUrl ? (
//                 <div className="relative inline-block">
//                     <img
//                         src={previewUrl}
//                         alt="Preview"
//                         className="h-20 w-20 rounded-lg border border-border object-cover shadow-sm"
//                     />
//                     <button
//                         type="button"
//                         onClick={handleRemove}
//                         className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow transition-colors hover:bg-red-600"
//                         aria-label="Remove uploaded photo"
//                     >
//                         <XIcon className="h-3 w-3" />
//                     </button>
//                 </div>
//             ) : (
//                 <label
//                     htmlFor={`photo-upload-${id}`}
//                     className="flex cursor-pointer items-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:bg-muted/60"
//                 >
//                     <Upload className="h-4 w-4" />
//                     <span>Click to upload or take a photo</span>
//                 </label>
//             )}
//             <input
//                 ref={inputRef}
//                 id={`photo-upload-${id}`}
//                 type="file"
//                 accept="image/*"
//                 onChange={onFileChange}
//                 className="hidden"
//             />
//         </div>
//     );
// };




const PhotoUploadArea = ({
    id,
    previewBase64,
    onFileChange,
    onRemove,
    label = "Attach photo",
}) => {
    const inputRef = useRef(null);
    const [annotationFile, setAnnotationFile] = useState(null);
    const [annotationOpen, setAnnotationOpen] = useState(false);

    const previewUrl = previewBase64
        ? typeof previewBase64 === "string"
            ? resolveMediaUrl(previewBase64)
            : URL.createObjectURL(previewBase64)
        : null;

    const handleInputChange = (event) => {
        const file = event.target.files?.[0];

        if (!file) return;

        if (!String(file.type || "").startsWith("image/")) {
            showToast("Please upload a valid image file.", "error");

            if (inputRef.current) {
                inputRef.current.value = "";
            }

            return;
        }

        setAnnotationFile(file);
        setAnnotationOpen(true);
    };

    const handleAnnotatedSave = (annotatedFile) => {
        setAnnotationOpen(false);
        setAnnotationFile(null);

        /*
            Keep existing parent usage working.
            Parent code already expects e.target.files[0].
        */
        onFileChange?.({
            target: {
                files: [annotatedFile],
            },
        });

        if (inputRef.current) {
            inputRef.current.value = "";
        }
    };

    const handleAnnotationClose = () => {
        setAnnotationOpen(false);
        setAnnotationFile(null);

        if (inputRef.current) {
            inputRef.current.value = "";
        }
    };

    const handleRemove = () => {
        if (inputRef.current) {
            inputRef.current.value = "";
        }

        setAnnotationOpen(false);
        setAnnotationFile(null);

        onRemove?.();
    };

    return (
        <div className="mt-3">
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                {label}
            </p>

            {previewUrl ? (
                <div className="relative inline-block">
                    <img
                        src={previewUrl}
                        alt="Preview"
                        className="h-20 w-20 rounded-lg border border-border object-cover shadow-sm"
                    />

                    <button
                        type="button"
                        onClick={handleRemove}
                        className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow transition-colors hover:bg-red-600"
                        aria-label="Remove uploaded photo"
                    >
                        <XIcon className="h-3 w-3" />
                    </button>
                </div>
            ) : (
                <label
                    htmlFor={`photo-upload-${id}`}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:bg-muted/60"
                >
                    <Upload className="h-4 w-4" />
                    <span>Click to upload, mark and attach photo</span>
                </label>
            )}

            <input
                ref={inputRef}
                id={`photo-upload-${id}`}
                type="file"
                accept="image/*"
                onChange={handleInputChange}
                className="hidden"
            />

            <SafetyImageAnnotationModal
                open={annotationOpen}
                file={annotationFile}
                onClose={handleAnnotationClose}
                onSave={handleAnnotatedSave}
            />
        </div>
    );
};


const YesNoButtons = ({ value, onChange }) => (
    <div className="flex gap-2">
        {[
            { opt: "yes", label: "Yes", icon: <Check className="h-3.5 w-3.5" />, active: "border-green-500 bg-green-500 text-white shadow-green-200 shadow-md", idle: "border-green-200 bg-green-50 text-green-700 hover:bg-green-100" },
            { opt: "no", label: "No", icon: <XIcon className="h-3.5 w-3.5" />, active: "border-red-500 bg-red-500 text-white shadow-red-200 shadow-md", idle: "border-red-200 bg-red-50 text-red-700 hover:bg-red-100" },
        ].map(({ opt, label, icon, active, idle }) => (
            <button
                key={opt}
                type="button"
                onClick={() => onChange(opt)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border-2 px-4 py-2.5 text-sm font-semibold transition-all ${value === opt ? active : idle}`}
            >
                {icon} {label}
            </button>
        ))}
    </div>
);

const YesNoNaButtons = ({ value, onChange }) => (
    <div className="flex gap-2">
        {[
            { opt: "yes", label: "Yes", icon: <Check className="h-3.5 w-3.5" />, active: "border-green-500 bg-green-500 text-white shadow-green-200 shadow-md", idle: "border-green-200 bg-green-50 text-green-700 hover:bg-green-100" },
            { opt: "no", label: "No", icon: <XIcon className="h-3.5 w-3.5" />, active: "border-red-500 bg-red-500 text-white shadow-red-200 shadow-md", idle: "border-red-200 bg-red-50 text-red-700 hover:bg-red-100" },
            { opt: "na", label: "N/A", icon: null, active: "border-yellow-500 bg-yellow-500 text-white shadow-yellow-200 shadow-md", idle: "border-yellow-200 bg-yellow-50 text-yellow-700 hover:bg-yellow-100" },
        ].map(({ opt, label, icon, active, idle }) => (
            <button
                key={opt}
                type="button"
                onClick={() => onChange(opt)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border-2 px-3 py-2.5 text-sm font-semibold transition-all ${value === opt ? active : idle}`}
            >
                {icon} {label}
            </button>
        ))}
    </div>
);

const RemarksBubble = ({ label, text }) => (
    <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
        <span className="font-semibold">{label}:</span> {text}
    </div>
);

const ReadOnlyOptionButtons = ({ options = [], value }) => {
    const normalizedOptions =
        Array.isArray(options) && options.length ? options : ["Yes", "No", "N/A"];

    return (
        <div className="flex flex-wrap gap-2">
            {normalizedOptions.map((opt) => {
                const label =
                    typeof opt === "string"
                        ? opt
                        : opt?.label || opt?.name || opt?.title || "";

                if (!label) return null;

                const active =
                    String(value || "").trim().toLowerCase() ===
                    String(label || "").trim().toLowerCase();
                const normalizedLabel = String(label).trim().toLowerCase();
                const activeClasses =
                    normalizedLabel === "yes"
                        ? "border-green-500 bg-green-500 text-white shadow-sm"
                        : normalizedLabel === "no"
                            ? "border-red-500 bg-red-500 text-white shadow-sm"
                            : normalizedLabel === "n/a" || normalizedLabel === "na"
                                ? "border-yellow-500 bg-yellow-500 text-white shadow-sm"
                                : "border-orange-500 bg-orange-500 text-white shadow-sm";

                return (
                    <span
                        key={label}
                        className={`rounded-lg border px-4 py-2 text-sm font-semibold ${active
                            ? activeClasses
                            : "border-gray-200 bg-gray-50 text-gray-400"
                            }`}
                    >
                        {label}
                    </span>
                );
            })}
        </div>
    );
};



const isResubmittedForReview = (sub) =>
    Boolean(
        sub?.is_resubmitted_after_rejection ||
        sub?.latest_checker_reject_remarks ||
        sub?.latest_checker_reject_photo_url
    );


const getResubmittedMakerName = (sub) =>
    String(
        sub?.latest_maker_name ||
        sub?.maker_name ||
        sub?.maker_user_name ||
        "Maker"
    ).trim();



const getPrimarySubmissionForCheckerView = (item) => {
    const submissions = item?.submissions || [];
    return submissions[0] || null;
};

const isCheckerActionableSubmission = (sub) =>
    String(sub?.status || "").toLowerCase() === "pending_checker";


// Filter Component 

const ChecklistFilters = ({
    filters,
    setFilters,
    contractorOptions,
    typeOptions,
    isObservations,
    wingOptions,
    hazardOptions,
}) => {
    const updateFilter = (key, value) => {
        setFilters((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    const clearFilters = () => {
        setFilters({
            fromDate: "",
            toDate: "",
            contractor: "all",
            status: "all",
            type: "all",
            wing: "all",
            hazard: "all",
            risk: "all",
        });
    };

    return (
        <div className="mb-6 rounded-xl border bg-card p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-foreground">
                    Filters
                </h3>

                <button
                    type="button"
                    onClick={clearFilters}
                    className="rounded-lg border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
                >
                    Clear
                </button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                        From Date
                    </label>
                    <input
                        type="date"
                        value={filters.fromDate}
                        onChange={(e) => updateFilter("fromDate", e.target.value)}
                        className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                    />
                </div>

                <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                        To Date
                    </label>
                    <input
                        type="date"
                        value={filters.toDate}
                        onChange={(e) => updateFilter("toDate", e.target.value)}
                        className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                    />
                </div>

                <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                        Contractor
                    </label>
                    <select
                        value={filters.contractor}
                        onChange={(e) => updateFilter("contractor", e.target.value)}
                        className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                    >
                        <option value="all">All Contractors</option>
                        {contractorOptions.map((name) => (
                            <option key={name} value={name}>
                                {name}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                        Status
                    </label>
                    <select
                        value={filters.status}
                        onChange={(e) => updateFilter("status", e.target.value)}
                        className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                    >
                        <option value="all">All</option>
                        {isObservations ? (
                            <>
                                <option value="open">Open</option>
                                <option value="closed">Closed</option>
                                <option value="rectification">Rectification</option>
                                <option value="re rectification">Re Rectification</option>
                            </>
                        ) : (
                            <>
                                <option value="rejected">Rejected</option>
                                <option value="approved">Approved</option>
                            </>
                        )}
                    </select>
                </div>

                <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                        Type
                    </label>
                    <select
                        value={filters.type}
                        onChange={(e) => updateFilter("type", e.target.value)}
                        className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                    >
                        <option value="all">All Types</option>
                        {isObservations ? (
                            <>
                                <option value="Unsafe Act">Unsafe Act</option>
                                <option value="Unsafe Condition">Unsafe Condition</option>
                            </>
                        ) : (
                            typeOptions.map((title) => (
                                <option key={title} value={title}>
                                    {title}
                                </option>
                            ))
                        )}
                    </select>
                </div>
                {isObservations && (
                    <>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-muted-foreground">
                                Wing
                            </label>
                            <select
                                value={filters.wing}
                                onChange={(e) => updateFilter("wing", e.target.value)}
                                className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                            >
                                <option value="all">All Wings</option>
                                {wingOptions?.map((wing) => (
                                    <option key={wing} value={wing}>
                                        {wing}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="mb-1 block text-xs font-medium text-muted-foreground">
                                Hazard
                            </label>
                            <select
                                value={filters.hazard}
                                onChange={(e) => updateFilter("hazard", e.target.value)}
                                className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                            >
                                <option value="all">All Hazards</option>
                                {hazardOptions?.map((hazard) => (
                                    <option key={hazard} value={hazard}>
                                        {hazard}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </>
                )}
                <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                        Risk
                    </label>
                    <select
                        value={filters.risk}
                        onChange={(e) => updateFilter("risk", e.target.value)}
                        className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                    >
                        <option value="all">All Risks</option>
                        <option value="Low Risk">Low Risk</option>
                        <option value="Medium Risk">Medium Risk</option>
                        <option value="High Risk">High Risk</option>
                    </select>
                </div>
            </div>
        </div>
    );
};

const normalizeFilterValue = (value) =>
    String(value || "").trim().toLowerCase();

const getChecklistCreatedDate = (item) =>
    item?.created_at ? String(item.created_at).slice(0, 10) : "";

const getChecklistContractor = (item) =>
    String(
        item?.contractor_name ||
        item?.name_of_contractor ||
        item?.safety_report_meta?.name_of_contractor ||
        ""
    ).trim();

const getChecklistType = (item) =>
    String(item?.template_title || item?.name || "").trim();

const isApprovedChecklist = (item) =>
    String(item?.status || "").toLowerCase() === "completed" ||
    String(item?.review_state?.closed_reason || "").toLowerCase() === "approved";

const isRejectedChecklist = (item) =>
    String(item?.status || "").toLowerCase() === "closed_rejected" ||
    Number(item?.maker_rejected_points || 0) > 0;

const applyChecklistFilters = (list, filters) => {
    const isObservations = window.location.pathname.includes('/safety/observations');
    return (list || []).filter((item) => {
        const createdDate = getChecklistCreatedDate(item);

        if (filters.fromDate && (!createdDate || createdDate < filters.fromDate)) {
            return false;
        }

        if (filters.toDate && (!createdDate || createdDate > filters.toDate)) {
            return false;
        }

        if (
            filters.contractor !== "all" &&
            normalizeFilterValue(getChecklistContractor(item)) !==
            normalizeFilterValue(filters.contractor)
        ) {
            return false;
        }

        if (isObservations) {
            if (filters.type !== "all" && item.unsafe_act_condition_category !== filters.type) {
                return false;
            }
            if (filters.wing !== "all") {
                const w = filters.wing.toLowerCase();
                const locWing = String(item.location_wing || "").toLowerCase();
                const locComb = String(item.location_combined || item.location || "").toLowerCase();

                const hasWing = locWing === w ||
                    locWing === `wing ${w}` ||
                    locComb.includes(`wing ${w}`) ||
                    locComb.startsWith(`${w},`) ||
                    locComb === w ||
                    locComb.includes(` ${w},`);

                if (!hasWing) {
                    return false;
                }
            }
            if (filters.hazard !== "all") {
                let hazardsArray = [];
                try {
                    if (item.hazard_categories) {
                        hazardsArray = typeof item.hazard_categories === "string"
                            ? JSON.parse(item.hazard_categories)
                            : item.hazard_categories;
                        if (!Array.isArray(hazardsArray)) hazardsArray = [String(item.hazard_categories)];
                    }
                } catch (e) {
                    hazardsArray = [String(item.hazard_categories)];
                }
                if (!hazardsArray || hazardsArray.length === 0) return false;
                const hasHazard = hazardsArray.some(h => h === filters.hazard || h.startsWith(filters.hazard + ":"));
                if (!hasHazard) return false;
            }

            if (filters.risk && filters.risk !== "all") {
                if (item.risk !== filters.risk) return false;
            }

            if (filters.status !== "all") {
                const status = String(item.status || "").toLowerCase();
                if (filters.status === "open") {
                    if (status === "approved" || status === "rejected" || status === "closed_rejected" || status === "completed") return false;
                } else if (filters.status === "closed") {
                    if (status !== "approved" && status !== "rejected" && status !== "closed_rejected" && status !== "completed") return false;
                } else if (filters.status === "rectification") {
                    if (status !== "pending_maker") return false;
                } else if (filters.status === "re rectification") {
                    if (status !== "pending_checker") return false;
                }
            }
        } else {
            if (
                filters.type !== "all" &&
                normalizeFilterValue(getChecklistType(item)) !==
                normalizeFilterValue(filters.type)
            ) {
                return false;
            }

            if (filters.status === "approved" && !isApprovedChecklist(item)) {
                return false;
            }

            if (filters.status === "rejected" && !isRejectedChecklist(item)) {
                return false;
            }
        }

        return true;
    });
};


const LEGACY_REPORT_HEADER_FIELDS = [
    { key: "format_no", label: "Format No.", order_index: 1 },
    { key: "revision_no", label: "Revision No.", order_index: 2 },
    { key: "issued_date", label: "Issued Date", order_index: 3 },
    { key: "revision_date", label: "Revision Date", order_index: 4 },
    { key: "project", label: "Project", order_index: 5 },
    { key: "inspection_report_no", label: "Inspection Report No.", order_index: 6 },
    { key: "name_of_contractor", label: "Name of Contractor", order_index: 7 },
    { key: "date_of_inspection", label: "Date of Inspection", order_index: 8 },
    { key: "make_model", label: "Make / Model", order_index: 9 },
    { key: "identification_no", label: "Identification No.", order_index: 10 },
    { key: "location", label: "Location", order_index: 11 },
    { key: "name_of_operator", label: "Name of Operator", order_index: 12 },
];

const sortResolvedHeaderFields = (fields = []) =>
    [...fields].sort(
        (a, b) =>
            Number(a.row_index || 0) - Number(b.row_index || 0) ||
            Number(a.column_index || 0) - Number(b.column_index || 0) ||
            Number(a.order_index || 0) - Number(b.order_index || 0)
    );

const getResolvedHeaderFieldsForChecker = (detail) => {
    /*
        New dynamic checklist response:
        Values are already resolved by backend from:
        - fixed template fields
        - maker inputs
        - project/system generated values
    */
    const dynamicFields = Array.isArray(detail?.report_header_fields)
        ? detail.report_header_fields
        : [];

    if (dynamicFields.length > 0) {
        return sortResolvedHeaderFields(
            dynamicFields.filter(
                (field) => field.visible_in_preview !== false
            )
        );
    }

    /*
        Backward compatibility:
        Old checklists created before dynamic header fields still render
        using report_header_meta / safety_report_meta.
    */
    const legacyMeta =
        detail?.report_header_meta ||
        detail?.safety_report_meta ||
        detail?.report_meta ||
        {};

    return LEGACY_REPORT_HEADER_FIELDS.map((field) => ({
        ...field,
        value: legacyMeta[field.key] || "",
        visible_in_preview: true,
    }));
};

const ReadOnlyHeaderValue = ({ label, value }) => (
    <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {label}
        </p>

        <p className="mt-1 break-words text-sm font-semibold text-foreground">
            {String(value || "").trim() || "—"}
        </p>
    </div>
);

const ReportHeaderInfoCard = ({ detail }) => {
    const fields = getResolvedHeaderFieldsForChecker(detail);

    if (!fields.length) {
        return null;
    }

    return (
        <div className="mb-6 rounded-xl border bg-card p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-bold text-foreground">
                Checklist Details
            </h2>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {fields.map((field) => (
                    <ReadOnlyHeaderValue
                        key={field.key}
                        label={field.label}
                        value={
                            field.value ??
                            field.default_value ??
                            ""
                        }
                    />
                ))}
            </div>
        </div>
    );
};





// ─────────────────────────────────────────────
// CheckerDashboard
// ─────────────────────────────────────────────
export default function CheckerDashboard() {
    const userId = getCurrentUserId();
    const navigate = useNavigate();

    const [projectId, setProjectId] = useState("");
    const [checklists, setChecklists] = useState([]);
    const [checkerBucketByChecklist, setCheckerBucketByChecklist] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [detail, setDetail] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [view, setView] = useState("dashboard"); // "dashboard" | "inspection" | "verification"
    const [checkerAnswers, setCheckerAnswers] = useState({});
    const [checkerRemarks, setCheckerRemarks] = useState({});
    const [checkerMedia, setCheckerMedia] = useState({});
    const [isSubmitSignatureModalOpen, setIsSubmitSignatureModalOpen] = useState(false);
    const [pendingSubmitPayload, setPendingSubmitPayload] = useState(null);
    const [checkerComments, setCheckerComments] = useState({});
    const [reviewerMedia, setReviewerMedia] = useState({});
    const [inspectionRemarks, setInspectionRemarks] = useState({});
    const [verificationRemarks, setVerificationRemarks] = useState({});
    const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
    const [pendingApprovePayload, setPendingApprovePayload] = useState(null);
    const [signatureSubmitting, setSignatureSubmitting] = useState(false);

    const [pendingRejectPayload, setPendingRejectPayload] = useState(null);
    const [signaturePurpose, setSignaturePurpose] = useState(null);

    const [historyChecklist, setHistoryChecklist] = useState(null);
    const [readonlyChecklist, setReadonlyChecklist] = useState(null);
    const [readonlyPendingStatusLabel, setReadonlyPendingStatusLabel] = useState("Pending for Review");

    const [filters, setFilters] = useState({
        fromDate: "",
        toDate: "",
        contractor: "all",
        status: "all",
        type: "all",
        wing: "all",
        hazard: "all",
        risk: "all",
    });

    const sigCanvasRef = useRef(null);
    const sigPadRef = useRef(null);

    // ── data fetching ───────────────────────────────────────────
    const fetchList = async () => {
        if (!userId) return;
        setLoading(true);
        setError(null);
        try {
            const isObservations = window.location.pathname.includes('/safety/observations');
            const params = { template_type: isObservations ? "OBSERVATION" : "SAFETY" };
            if (!isObservations) {
                params.assigned_to_me = true;
            }
            if (projectId) params.project_id = projectId;
            if (isObservations) {
                const orgId = resolveOrgIdFromSession();
                if (orgId) params.org_id = orgId;
            }

            let res;
            if (isObservations) {
                // Safety Observations don't use assigned_to_me or template_type in the same way, but it's safe to pass.
                // We fetch from the specific observations endpoint.
                res = await listSafetyObservations(params);
            } else {
                res = await listSafetyChecklists(params);
            }

            const data = res?.data;
            const list = Array.isArray(data) ? data : data?.results ?? [];
            setChecklists(list);


            setCheckerBucketByChecklist({});

        } catch (err) {
            const msg = err?.response?.data?.detail || err?.message || "Failed to load checklists.";
            setError(msg);
            showToast(msg, "error");
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        const activeProjectId =
            resolveActiveProjectId?.() || resolveProjectIdFromUserAccess();

        setProjectId(String(activeProjectId || ""));
    }, []);


    useEffect(() => {
        if (view === "dashboard") {
            fetchList();
        }
    }, [userId, projectId, view]);

    // ── derived lists ───────────────────────────────────────────
    const isObservations = window.location.pathname.includes('/safety/observations');

    const statusOf = (c) => String(c.status || "").toLowerCase();

    const currentRoleOf = (c) =>
        String(c.current_assignee_role || "").toUpperCase();

    const rejectedPoints = (c) => Number(c.maker_rejected_points ?? 0);

    const reviewRoundCount = (c) =>
        Number(c?.review_state?.completed_review_rounds ?? 0);

    const isClosedRejected = (c) => statusOf(c) === "closed_rejected" || statusOf(c) === "rejected";

    const isFinalChecklist = (c) => {
        if (isObservations) return ["approved", "rejected"].includes(statusOf(c));
        return statusOf(c) === "completed" || statusOf(c) === "closed_rejected";
    };

    const isApprovedChecklist = (c) => {
        if (isObservations) return statusOf(c) === "approved";
        return statusOf(c) === "completed";
    };

    const isRejectedChecklist = (c) => {
        if (isObservations) return statusOf(c) === "rejected";
        return statusOf(c) === "closed_rejected";
    };

    const isRectificationCycle = (c) => {
        if (isObservations) return statusOf(c) === "pending_maker";
        return reviewRoundCount(c) > 0 || rejectedPoints(c) > 0;
    };

    const checkerCanReview = (c) => {
        if (isObservations) return statusOf(c) === "pending_checker";
        return statusOf(c) === "in_progress" && currentRoleOf(c) === "CHECKER";
    };


    // Apply filters to ALL dashboards as requested
    const filteredChecklists = applyChecklistFilters(checklists, filters);

    const checkerAssigned = filteredChecklists.filter(
        (c) => {
            if (isObservations) {
                const isPendingChecker = statusOf(c) === "pending_checker";
                const isPendingFinal = statusOf(c) === "pending_final_checker";

                if (isPendingChecker) {
                    return !c.checker_id || String(c.checker_id) === String(userId);
                } else if (isPendingFinal) {
                    return !c.final_checker_id || String(c.final_checker_id) === String(userId);
                }
                return false;
            }
            return checkerCanReview(c) && !isRectificationCycle(c);
        }
    );

    const checkerPending = filteredChecklists.filter(
        (c) => {
            if (isObservations) return statusOf(c) === "pending_maker";
            return statusOf(c) === "in_progress" &&
                isRectificationCycle(c) &&
                ["MAKER", "CHECKER"].includes(currentRoleOf(c));
        }
    );

    // Filter options should come from RAW checklists so users can select anything available
    const contractorOptions = Array.from(
        new Set(checklists.map(getChecklistContractor).filter(Boolean))
    ).sort();

    const typeOptions = Array.from(
        new Set(checklists.map(getChecklistType).filter(Boolean))
    ).sort();

    const wingOptions = ["A", "B", "C", "D", "E", "F", "G", "NTA"];

    const hazardOptions = [
        "1. Physical Hazard", "2. Biological Hazard", "3. Chemical Hazard",
        "4. Mechanical Hazard", "5. Ergonomical Hazard", "6. Environmental Hazard",
        "7. Fire/Explosion Hazard", "8. Electrical Hazard", "9. Psychological Hazard", "10. Other Hazards"
    ];

    const checkerCompleted = filteredChecklists.filter((c) => isFinalChecklist(c));

    // Approved/Rejected counters are also filtered.
    const checkerApprovedCount = checkerCompleted.filter(isApprovedChecklist).length;

    const checkerRejectedCount = checkerCompleted.filter(isRejectedChecklist).length;

    // Total should not be filtered if you want total dashboard tracking.
    // If you want total completed-filtered tracking, use checkerCompleted.length.
    const checkerTotal = checklists.length;

    const openObservationsCount = filteredChecklists.filter(c => !isApprovedChecklist(c) && !isRejectedChecklist(c)).length;
    const unsafeActCount = filteredChecklists.filter(c => c.unsafe_act_condition_category === "Unsafe Act").length;
    const unsafeConditionCount = filteredChecklists.filter(c => c.unsafe_act_condition_category === "Unsafe Condition").length;

    const lowRiskCount = filteredChecklists.filter(c => c.risk === "Low Risk").length;
    const mediumRiskCount = filteredChecklists.filter(c => c.risk === "Medium Risk").length;
    const highRiskCount = filteredChecklists.filter(c => c.risk === "High Risk").length;

    const now = new Date();
    const overdueObservationsCount = filteredChecklists.filter(c => {
        if (isApprovedChecklist(c) || isRejectedChecklist(c)) return false; // Open only
        if (!c.target_date) return false;
        return new Date(c.target_date) < now;
    }).length;

    const onTimeClosuresCount = filteredChecklists.filter(c => {
        if (!isApprovedChecklist(c) && !isRejectedChecklist(c)) return false; // Closed only
        if (!c.target_date || !c.updated_at) return false;
        return new Date(c.updated_at) <= new Date(c.target_date);
    }).length;

    const reportNameByDate = useMemo(() => {
        const dateSet = new Set();
        checklists.forEach(item => {
            if (!item.created_at) return;
            const dateObj = new Date(item.created_at);
            const dateStr = dateObj.toLocaleDateString("en-GB", { day: '2-digit', month: '2-digit', year: 'numeric' });
            dateSet.add(dateStr);
        });
        const sortedDates = Array.from(dateSet).sort((a, b) => {
            const [d1, m1, y1] = a.split('/');
            const [d2, m2, y2] = b.split('/');
            return new Date(`${y1}-${m1}-${d1}`) - new Date(`${y2}-${m2}-${d2}`);
        });
        const mapping = {};
        sortedDates.forEach((dateStr, index) => {
            const reportNumber = String(index + 1).padStart(2, '0');
            mapping[dateStr] = `Report AN-ADL-SHOR-${reportNumber}`;
        });
        return mapping;
    }, [checklists]);

    const getItemReportName = (item) => {
        if (!item.created_at) return "";
        const dateObj = new Date(item.created_at);
        const dateStr = dateObj.toLocaleDateString("en-GB", { day: '2-digit', month: '2-digit', year: 'numeric' });
        return reportNameByDate[dateStr] ? ` / ${reportNameByDate[dateStr]}` : "";
    };

    const groupedReports = useMemo(() => {
        const groups = {};
        const itemsToGroup = isObservations ? filteredChecklists : checkerCompleted;
        itemsToGroup.forEach(item => {
            if (!item.created_at) return;
            const dateObj = new Date(item.created_at);
            const dateStr = dateObj.toLocaleDateString("en-GB", { day: '2-digit', month: '2-digit', year: 'numeric' }); // e.g. 10/06/2026
            if (!groups[dateStr]) {
                groups[dateStr] = { date: dateStr, dateObj, items: [], firstItemId: item.id };
            }
            groups[dateStr].items.push(item);
        });

        const sortedDates = Object.keys(groups).sort((a, b) => {
            return groups[a].dateObj - groups[b].dateObj;
        });

        const reports = sortedDates.map((dateStr) => {
            return {
                ...groups[dateStr],
                reportName: reportNameByDate[dateStr] || "Report Unknown"
            };
        }).reverse();

        return reports;
    }, [filteredChecklists, checkerCompleted, isObservations, reportNameByDate]);


    const checkerReviewItems =
        detail?.items
            ?.map((item) => {
                const sub = getPrimarySubmissionForCheckerView(item);

                return sub ? { item, sub } : null;
            })
            .filter(Boolean) ?? [];


    const pendingCheckerItems = checkerReviewItems;

    // ── navigation ──────────────────────────────────────────────
    const backToDashboard = () => {
        setView("dashboard");
        setDetail(null);
        // setInspectionAnswers({});
        // setVerificationAnswers({});
        setReviewerMedia({});
        setInspectionRemarks({});
        setVerificationRemarks({});
        setIsSignatureModalOpen(false);
        setPendingApprovePayload(null);
    };

    // ── open helpers ────────────────────────────────────────────
    const openAssignedInspection = async (cl) => {
        setDetail(null);
        setDetailLoading(true);
        // setInspectionAnswers({});
        setReviewerMedia({});
        setInspectionRemarks({});
        try {
            const res = await getSafetyChecklist(cl.id);
            const data = res?.data || null;
            setDetail(data);
            const initial = {};
            (data?.items || []).forEach((item) => {
                const sub = (item.submissions || []).find(
                    (s) => s.status === "pending_checker"
                );
                if (sub) initial[sub.id] = null;
            });
            // setInspectionAnswers(initial);
            setView("inspection");
        } catch (err) {
            showToast(err?.response?.data?.detail || "Failed to load checklist", "error");
        } finally {
            setDetailLoading(false);
        }
    };

    const openCheckerObservation = async (item) => {
        setDetail(null);
        setDetailLoading(true);
        try {
            const res = await getSafetyObservationById(item.id);
            setDetail(res?.data || null);
            setView("review_observation");
        } catch (err) {
            showToast(err?.response?.data?.detail || "Failed to load observation", "error");
        } finally {
            setDetailLoading(false);
        }
    };

    const openPendingVerification = async (cl) => {
        setDetail(null);
        setDetailLoading(true);
        // setVerificationAnswers({});
        setReviewerMedia({});
        setVerificationRemarks({});
        try {
            const res = await getSafetyChecklist(cl.id);
            const data = res?.data || null;
            setDetail(data);
            const initial = {};
            (data?.items || []).forEach((entry) => {
                const match = (entry.submissions || []).find((s) => s.status === "pending_checker");
                if (match && (match.maker_remarks || match.has_photo || (match.images || []).length)) {
                    initial[match.id] = "yes";
                }
            });
            // setVerificationAnswers(initial);
            setView("verification");
        } catch (err) {
            showToast(err?.response?.data?.detail || "Failed to load checklist", "error");
        } finally {
            setDetailLoading(false);
        }
    };

    // ── action handlers ─────────────────────────────────────────


    const formatChecklistDateTime = (value) => {
        if (!value) return "";

        const date = new Date(value);

        return date.toLocaleString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        });
    };


    const getPendingCheckerRows = () => checkerReviewItems;


    const handleSubmitChecklist = async () => {
        if (!detail) return;
        const submissions = [];
        let hasMissingAnswer = false;

        const currentStep = detail.current_assignee_step_index;
        const currentWA = detail.workflow_assignments?.find(wa => wa.order_index === currentStep);
        const assignedQuestions = currentWA?.assigned_questions || [];

        checkerReviewItems.forEach(({ item, sub }, idx) => {
            const isAssignedHere = assignedQuestions.length === 0 || assignedQuestions.includes(idx);
            const needsFilling = isAssignedHere && !sub.maker_id;

            if (needsFilling) {
                const answer = checkerAnswers[sub.id] || "";
                if (!answer) {
                    hasMissingAnswer = true;
                }
                submissions.push({
                    submission_id: sub.id,
                    answer: answer,
                    maker_remarks: checkerRemarks[sub.id] || "",
                });
            }
        });

        if (submissions.length === 0) {
            showToast("No questions to submit.", "error");
            return;
        }

        if (hasMissingAnswer) {
            showToast("Please answer all required questions.", "error");
            return;
        }

        setPendingSubmitPayload({ submissions });
        setIsSubmitSignatureModalOpen(true);
    };

    const confirmSubmitChecklist = async (signatureFile) => {
        if (!pendingSubmitPayload) return;
        setSubmitting(true);
        try {
            const formData = new FormData();
            formData.append("submissions", JSON.stringify(pendingSubmitPayload.submissions));

            pendingSubmitPayload.submissions.forEach((sub) => {
                const file = checkerMedia[sub.submission_id];
                if (file) {
                    formData.append(`checker_media_${sub.submission_id}`, file);
                }
            });

            if (signatureFile) {
                formData.append("maker_signature", signatureFile);
            }

            await submitSafetyChecklist(detail.id, formData);
            showToast("Questions submitted successfully", "success");
            setIsSubmitSignatureModalOpen(false);
            setPendingSubmitPayload(null);
            fetchList();
            setView("dashboard");
        } catch (error) {
            showToast("Failed to submit questions", "error");
        } finally {
            setSubmitting(false);
        }
    };

    const handleApproveChecklist = async () => {
        if (!detail) return;

        const rows = getPendingCheckerRows();

        if (!rows.length) {
            showToast("No pending questions found.", "error");
            return;
        }

        const formData = new FormData();

        formData.append(
            "submissions",
            JSON.stringify(
                rows.map(({ sub }) => ({
                    submission_id: sub.id,
                }))
            )
        );

        setPendingApprovePayload({ formData });
        setSignaturePurpose("approve");
        setIsSignatureModalOpen(true);
    };

    const handleCloseSignatureModal = () => {
        if (signatureSubmitting) return;
        setIsSignatureModalOpen(false);
        setPendingApprovePayload(null);
        if (sigCanvasRef.current) sigCanvasRef.current.clear();
    };

    const handleSubmitWithSignature = async () => {
        if (!detail) return;

        if (signaturePurpose === "approve" && !pendingApprovePayload) return;
        if (signaturePurpose === "reject" && !pendingRejectPayload) return;

        if (!sigCanvasRef.current || sigCanvasRef.current.isEmpty()) {
            showToast("Please provide your signature.", "error");
            return;
        }

        const dataUrl = sigCanvasRef.current.toDataURL("image/png");
        const base64Part = dataUrl.split(",")[1] || "";

        if (!base64Part) {
            showToast("Could not capture signature. Try again.", "error");
            return;
        }

        const binary = atob(base64Part);
        const bytes = new Uint8Array(binary.length);

        for (let i = 0; i < binary.length; i += 1) {
            bytes[i] = binary.charCodeAt(i);
        }

        const signatureFile = new File(
            [bytes],
            `checker-signature-${detail.id}-${Date.now()}.png`,
            { type: "image/png" }
        );

        setSignatureSubmitting(true);

        try {
            if (signaturePurpose === "reject") {
                const formData = pendingRejectPayload || new FormData();

                formData.append("checker_signature", signatureFile);

                await rejectSafetyChecklist(detail.id, formData);

                showToast("Checklist rejected and sent back to Maker.", "success");
            } else {
                const formData = pendingApprovePayload?.formData || new FormData();

                if (!formData.has("submissions")) {
                    formData.append(
                        "submissions",
                        JSON.stringify(pendingApprovePayload?.submissions || [])
                    );
                }

                formData.append("checker_signature", signatureFile);

                await approveSafetyChecklist(detail.id, formData);

                showToast("Checklist approved successfully.", "success");
            }

            setPendingRejectPayload(null);
            setPendingApprovePayload(null);
            setSignaturePurpose(null);

            handleCloseSignatureModal();
            backToDashboard();
            fetchList();
        } catch (err) {
            showToast(
                err?.response?.data?.detail ||
                (signaturePurpose === "reject"
                    ? "Reject checklist failed."
                    : "Signature submit failed"),
                "error"
            );
        } finally {
            setSignatureSubmitting(false);
        }
    };

    // For Mobile Responsive 
    const isMobileDevice = () => {
        if (typeof navigator === "undefined") return false;

        return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    };

    const getAccessTokenForMobileDownload = () =>
        localStorage.getItem("ACCESS_TOKEN") ||
        localStorage.getItem("access") ||
        localStorage.getItem("accessToken") ||
        "";

    const getChecklistServiceBaseUrl = () => {
        const isLocal =
            window.location.hostname === "127.0.0.1" ||
            window.location.hostname === "localhost";

        return isLocal
            ? "http://127.0.0.1:8001"
            : "https://konstruct.world/checklists";
    };

    const safePdfFileName = (name = "report") => {
        return String(name || "report")
            .trim()
            .replace(/[^\w.-]+/g, "-")
            .replace(/-+/g, "-")
            .replace(/^-|-$/g, "") || "report";
    };

    const sendDownloadToFlutter = ({ url, fileName, token }) => {
        const payload = JSON.stringify({
            url,
            fileName,
            token,
            mimeType: "application/pdf",
        });

        // flutter_inappwebview handler
        if (window.flutter_inappwebview?.callHandler) {
            window.flutter_inappwebview.callHandler("downloadFile", payload);
            return true;
        }

        // webview_flutter JavaScriptChannel
        if (window.DownloadChannel?.postMessage) {
            window.DownloadChannel.postMessage(payload);
            return true;
        }

        return false;
    };

    // Old handleDownloadReport
    // const handleDownloadReport = async (item) => {
    //     if (!item?.id) return;

    //     if (isObservations && !item.skipGroupCheck) {
    //         const reportGroup = groupedReports.find(r => r.firstItemId === item.id);
    //         if (reportGroup) {
    //             showToast("Generating Observation Report PDF...", "success");
    //             try {
    //                 let orgId = null;
    //                 const userDataStr = localStorage.getItem("USER_DATA");
    //                 if (userDataStr) {
    //                     try {
    //                         orgId = JSON.parse(userDataStr).orgId;
    //                     } catch (e) { }
    //                 }
    //                 const projectId = resolveActiveProjectId?.() || resolveProjectIdFromUserAccess();
    //                 const res = await downloadSafetyObservationReport({
    //                     date: reportGroup.date,
    //                     org_id: orgId,
    //                     project_id: projectId,
    //                     t: new Date().getTime()
    //                 });

    //                 const blob = res?.data;
    //                 if (!blob) {
    //                     showToast("Report data is empty", "error");
    //                     return;
    //                 }
    //                 const url = window.URL.createObjectURL(new Blob([blob]));
    //                 const link = document.createElement("a");
    //                 link.href = url;

    //                 const safeName = reportGroup.reportName
    //                     ? reportGroup.reportName.replace(/[^a-zA-Z0-9_.-]/g, '_')
    //                     : `Observation-Report-${reportGroup.date}.pdf`;

    //                 link.setAttribute("download", `${safeName}.pdf`);
    //                 document.body.appendChild(link);
    //                 link.click();
    //                 link.parentNode.removeChild(link);
    //                 window.URL.revokeObjectURL(url);
    //                 return;
    //             } catch (err) {
    //                 console.error("PDF Gen Error:", err);
    //                 showToast("Failed to generate PDF", "error");
    //                 return;
    //             }
    //         }
    //     }

    //     try {
    //         const res = await downloadSafetyReport(item.id, {
    //             mode: "download",
    //         });

    //         const blob = res?.data;
    //         if (!blob) {
    //             showToast("Report file not found.", "error");
    //             return;
    //         }

    //         const url = window.URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
    //         const link = document.createElement("a");

    //         const safeName = String(item.name || "safety-report")
    //             .trim()
    //             .replace(/[^\w.-]+/g, "-");

    //         link.href = url;
    //         link.download = `${safeName}-${item.id}.pdf`;
    //         document.body.appendChild(link);
    //         link.click();
    //         link.remove();

    //         window.URL.revokeObjectURL(url);
    //         showToast("Report downloaded", "success");
    //     } catch (err) {
    //         showToast(
    //             err?.response?.data?.detail || err?.message || "Download failed",
    //             "error"
    //         );
    //     }
    // };


    const handleDownloadReport = async (item) => {
        if (!item?.id) return;

        const mobile = isMobileDevice();
        const token = getAccessTokenForMobileDownload();
        const checklistBaseUrl = getChecklistServiceBaseUrl();

        /*
            MOBILE WEBVIEW FLOW:
            Do not use blob + a.download.
            Send real API URL to Flutter and let Flutter download using native code.
        */
        if (mobile) {
            try {
                if (isObservations && !item.skipGroupCheck) {
                    const reportGroup = groupedReports.find(
                        (r) => r.firstItemId === item.id
                    );

                    if (reportGroup) {
                        const firstItem = reportGroup.items?.[0] || {};
                        const orgId = firstItem.org_id || resolveOrgIdFromSession() || null;
                        const groupedIds = (reportGroup.items || [])
                            .map((entry) => entry?.id)
                            .filter(Boolean);

                        const activeProjectId =
                            firstItem.project_id ||
                            resolveActiveProjectId?.() ||
                            resolveProjectIdFromUserAccess();

                        try {
                            const res = await downloadSafetyObservationReport({
                                date: reportGroup.date,
                                org_id: orgId,
                                project_id: activeProjectId,
                                ids: groupedIds.join(","),
                                t: new Date().getTime(),
                            });

                            const blob = res?.data;
                            const contentType = res?.headers?.["content-type"] || blob?.type || "";

                            if (!blob || blob.size === 0 || contentType.includes("application/json")) {
                                const message = await getBlobErrorMessage(res, "Failed to generate PDF");
                                showToast(message, "error");
                                return;
                            }

                            const disposition = res?.headers?.["content-disposition"];
                            const fallbackName = `${safePdfFileName(
                                reportGroup.reportName || `Observation-Report-${reportGroup.date}`
                            )}.pdf`;

                            downloadBlob(
                                new Blob([blob], { type: "application/pdf" }),
                                filenameFromDisposition(disposition) || fallbackName
                            );

                            showToast("Downloading report...", "success");
                            return;
                        } catch (err) {
                            showToast(
                                err?.response?.data?.detail || "Failed to generate PDF",
                                "error"
                            );
                            return;
                        }
                    }
                }

                /*
                    Normal safety checklist report mobile URL.
                    This URL should match downloadSafetyReport(item.id, { mode: "download" }).
                */
                const query = new URLSearchParams({
                    mode: "download",
                });

                const reportUrl = `${checklistBaseUrl}/safety/checklists/${item.id}/report/?${query.toString()}`;

                const fileName = `${safePdfFileName(item.name || "safety-report")}-${item.id}.pdf`;

                const sentToFlutter = sendDownloadToFlutter({
                    url: reportUrl,
                    fileName,
                    token,
                });

                if (sentToFlutter) {
                    showToast("Downloading report...", "success");
                    return;
                }

                window.open(reportUrl, "_blank");
                return;
            } catch (err) {
                console.error("Mobile download error:", err);
                showToast("Mobile download failed", "error");
                return;
            }
        }

        /*
            DESKTOP / NORMAL WEB FLOW:
            Keep your existing blob download structure.
        */
        if (isObservations && !item.skipGroupCheck) {
            const reportGroup = groupedReports.find((r) => r.firstItemId === item.id);

            if (reportGroup) {
                showToast("Generating Observation Report PDF...", "success");

                try {
                    const firstItem = reportGroup.items?.[0] || {};
                    const orgId = firstItem.org_id || resolveOrgIdFromSession() || null;

                    const activeProjectId =
                        firstItem.project_id ||
                        resolveActiveProjectId?.() ||
                        resolveProjectIdFromUserAccess();

                    const groupedIds = (reportGroup.items || [])
                        .map((entry) => entry?.id)
                        .filter(Boolean);

                    const res = await downloadSafetyObservationReport({
                        date: reportGroup.date,
                        org_id: orgId,
                        project_id: activeProjectId,
                        ids: groupedIds.join(","),
                        t: new Date().getTime(),
                    });

                    const blob = res?.data;

                    if (!blob) {
                        showToast("Report data is empty", "error");
                        return;
                    }
                    const contentType = res?.headers?.["content-type"] || blob?.type || "";
                    if (contentType.includes("application/json")) {
                        const message = await getBlobErrorMessage(res, "Failed to generate PDF");
                        showToast(message, "error");
                        return;
                    }

                    const disposition = res?.headers?.["content-disposition"];
                    const fallbackName = reportGroup.reportName
                        ? `${reportGroup.reportName.replace(/[^a-zA-Z0-9_.-]/g, "_")}.pdf`
                        : `Observation-Report-${reportGroup.date}.pdf`;

                    downloadBlob(
                        new Blob([blob], { type: "application/pdf" }),
                        filenameFromDisposition(disposition) || fallbackName
                    );
                    return;
                } catch (err) {
                    console.error("PDF Gen Error:", err);
                    showToast("Failed to generate PDF", "error");
                    return;
                }
            }
        }

        try {
            const res = await downloadSafetyReport(item.id, {
                mode: "download",
            });

            const blob = res?.data;

            if (!blob) {
                showToast("Report file not found.", "error");
                return;
            }

            const url = window.URL.createObjectURL(
                new Blob([blob], { type: "application/pdf" })
            );

            const link = document.createElement("a");

            const safeName = safePdfFileName(item.name || "safety-report");

            link.href = url;
            link.download = `${safeName}-${item.id}.pdf`;

            document.body.appendChild(link);
            link.click();
            link.remove();

            window.URL.revokeObjectURL(url);

            showToast("Report downloaded", "success");
        } catch (err) {
            showToast(
                err?.response?.data?.detail || err?.message || "Download failed",
                "error"
            );
        }
    };

    const handleRejectChecklist = async () => {
        if (!detail) return;

        const rows = getPendingCheckerRows();

        const rejectedRows = rows.filter(({ sub }) => {
            const comment = String(checkerComments[sub.id] || "").trim();
            const file = reviewerMedia[sub.id];

            return comment || file;
        });

        if (!rejectedRows.length) {
            showToast(
                "Add comment or photo on at least one question before rejecting.",
                "error"
            );
            return;
        }

        const formData = new FormData();

        const submissionIds = rejectedRows.map(({ sub }) => sub.id);

        formData.append("submission_ids", JSON.stringify(submissionIds));

        formData.append(
            "rejections",
            JSON.stringify(
                rejectedRows.map(({ sub }) => ({
                    submission_id: sub.id,
                    checker_remarks: checkerComments[sub.id] || "",
                }))
            )
        );

        rejectedRows.forEach(({ sub }) => {
            const file = reviewerMedia[sub.id];

            if (file) {
                formData.append(`reviewer_media_${sub.id}`, file);
            }
        });

        setSubmitting(true);

        try {

            setPendingRejectPayload(formData);
            setSignaturePurpose("reject");
            setIsSignatureModalOpen(true);
            return;

            showToast("Checklist rejected and sent back to Maker.", "success");

            backToDashboard();
            fetchList();
        } catch (err) {
            showToast(
                err?.response?.data?.detail || "Reject checklist failed.",
                "error"
            );
        } finally {
            setSubmitting(false);
        }
    };

    // ── render ───────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-muted/40 p-4 sm:p-6 md:p-10">
            <div className="mx-auto max-w-4xl">

                {!userId && (
                    <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                        User not found in session. Log in or ensure USER_DATA is set in localStorage.
                    </div>
                )}

                {loading && <div className="py-8 text-center text-muted-foreground">Loading…</div>}

                {!loading && error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>
                )}

                {!loading && !error && (
                    <>
                        {/* ═══ VIEW: INSPECTION ═══ */}
                        {view === "inspection" && detail && (
                            <section>
                                <button type="button" onClick={backToDashboard}
                                    className="mb-4 inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                                    <ArrowLeft className="h-4 w-4" /> Back to Dashboard
                                </button>

                                <div className="mb-6 rounded-xl border bg-card p-5 shadow-sm">
                                    <h1 className="text-lg font-bold text-foreground sm:text-xl">{detail.name}</h1>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        {(detail.items || []).length} questions
                                    </p>
                                </div>

                                <ReportHeaderInfoCard detail={detail} />

                                <div className="space-y-4">
                                    {checkerReviewItems.map(({ item, sub }, idx) => {
                                        const isResubmitted = isResubmittedForReview(sub);

                                        const currentStep = detail.current_assignee_step_index;
                                        const currentWA = detail.workflow_assignments?.find(wa => wa.order_index === currentStep);
                                        const assignedQuestions = currentWA?.assigned_questions || [];
                                        const isAssignedHere = assignedQuestions.length === 0 || assignedQuestions.includes(idx);
                                        const hasAnswer = Boolean(sub.answer || sub.latest_maker_answer || sub.latest_checker_answer);
                                        const needsFilling = isAssignedHere && (!hasAnswer || sub.status === "created");
                                        const isHidden = !isAssignedHere && !hasAnswer;

                                        if (isHidden) return null;

                                        const makerComment =
                                            sub.latest_maker_remarks ||
                                            sub.maker_remarks ||
                                            "";

                                        const makerPhoto =
                                            sub.latest_maker_photo_url ||
                                            sub.photo_url ||
                                            "";

                                        return (
                                            <div
                                                key={item.id}
                                                className={`rounded-xl border p-5 shadow-sm transition-shadow hover:shadow-md ${isResubmitted
                                                    ? "border-yellow-400 bg-yellow-50"
                                                    : "border-border bg-card"
                                                    }`}
                                            >
                                                {isResubmitted && (
                                                    <span className="mb-3 inline-flex rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-800">
                                                        Re-submitted by {getResubmittedMakerName(sub)}
                                                    </span>
                                                )}

                                                <div className="mb-4 flex items-start gap-3">
                                                    <QuestionBadge number={idx + 1} />
                                                    <p className="pt-1 text-sm font-semibold text-foreground sm:text-base">{item.title}</p>
                                                </div>

                                                <div className="space-y-3">
                                                    {needsFilling ? (
                                                        <>
                                                            <TemplateOptionButtons
                                                                options={item.options}
                                                                value={checkerAnswers[sub.id]}
                                                                onChange={(value) => setCheckerAnswers(prev => ({ ...prev, [sub.id]: value }))}
                                                            />
                                                            <div>
                                                                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Remark / Comment</label>
                                                                <textarea
                                                                    rows={1}
                                                                    value={checkerRemarks[sub.id] || ""}
                                                                    onChange={(e) => {
                                                                        setCheckerRemarks(prev => ({ ...prev, [sub.id]: e.target.value }));
                                                                        autoResizeTextarea(e.target);
                                                                    }}
                                                                    onInput={(e) => autoResizeTextarea(e.target)}
                                                                    className="min-h-[42px] w-full resize-none overflow-hidden rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                                                    placeholder="Add a remark..."
                                                                />
                                                            </div>
                                                            <PhotoUploadArea
                                                                id={`checker-media-${sub.id}`}
                                                                previewBase64={checkerMedia[sub.id]}
                                                                label={item.photo_required ? "Upload photo (Required)" : "Upload photo (Optional)"}
                                                                onFileChange={(e) => {
                                                                    const file = e.target.files?.[0];
                                                                    if (file) setCheckerMedia(prev => ({ ...prev, [sub.id]: file }));
                                                                }}
                                                                onRemove={() => setCheckerMedia(prev => ({ ...prev, [sub.id]: undefined }))}
                                                            />
                                                        </>
                                                    ) : (
                                                        <>
                                                            <div>
                                                                <ReadOnlyOptionButtons
                                                                    options={item.options}
                                                                    value={sub.latest_maker_answer}
                                                                />
                                                            </div>

                                                            {makerComment && (
                                                                <RemarksBubble
                                                                    label="Maker Comment"
                                                                    text={makerComment}
                                                                />
                                                            )}

                                                            <div className="pt-1">
                                                                {makerPhoto ? (
                                                                    <PhotoViewButton
                                                                        url={makerPhoto}
                                                                        label="View Maker Photo"
                                                                    />
                                                                ) : (
                                                                    <NoPhotoLabel />
                                                                )}
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <SafetyChecklistSignOffSection
                                    detail={detail}
                                    className="mt-6"
                                />


                                {checkerReviewItems.some(({ sub }, idx) => {
                                    const currentStep = detail.current_assignee_step_index;
                                    const currentWA = detail.workflow_assignments?.find(wa => wa.order_index === currentStep);
                                    const assignedQuestions = currentWA?.assigned_questions || [];
                                    const isAssignedHere = assignedQuestions.length === 0 || assignedQuestions.includes(idx);
                                    const hasAnswer = Boolean(sub.answer || sub.latest_maker_answer || sub.latest_checker_answer);
                                    return isAssignedHere && (!hasAnswer || sub.status === "created");
                                }) ? (
                                    <div className="mt-6 grid grid-cols-1 gap-3">
                                        <button
                                            type="button"
                                            onClick={handleSubmitChecklist}
                                            disabled={submitting}
                                            className="flex w-full items-center justify-center rounded-xl bg-orange-500 px-4 py-3.5 text-sm font-bold text-white disabled:opacity-60"
                                        >
                                            {submitting ? "Submitting..." : "Submit Checklist"}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        <button
                                            type="button"
                                            onClick={handleRejectChecklist}
                                            disabled={submitting}
                                            className="flex w-full items-center justify-center rounded-xl bg-red-500 px-4 py-3.5 text-sm font-bold text-white disabled:opacity-60"
                                        >
                                            {submitting ? "Submitting..." : "Reject Checklist"}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={handleApproveChecklist}
                                            disabled={submitting}
                                            className="flex w-full items-center justify-center rounded-xl bg-green-600 px-4 py-3.5 text-sm font-bold text-white disabled:opacity-60"
                                        >
                                            {submitting ? "Submitting..." : "Approve Checklist"}
                                        </button>
                                    </div>
                                )}
                            </section>
                        )}

                        {/* ═══ VIEW: VERIFICATION ═══ */}
                        {view === "verification" && detail && (
                            <section>
                                <button type="button" onClick={backToDashboard}
                                    className="mb-4 inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                                    <ArrowLeft className="h-4 w-4" /> Back to Dashboard
                                </button>

                                <div className="mb-6 flex items-center justify-between rounded-xl border bg-card p-5 shadow-sm">
                                    <div>
                                        <p className="text-base font-bold text-foreground sm:text-lg">{detail.name}</p>
                                        <p className="text-sm text-muted-foreground">{checkerReviewItems.length} item(s) to verify</p>
                                    </div>
                                    <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-600">
                                        Fix Submitted
                                    </span>
                                </div>

                                <ReportHeaderInfoCard detail={detail} />

                                <div className="space-y-4">
                                    {checkerReviewItems.length === 0 ? (
                                        <p className="py-8 text-center text-sm text-muted-foreground">
                                            No items found for verification.
                                        </p>
                                    ) : (
                                        checkerReviewItems.map(({ item, sub }, idx) => {
                                            const isResubmitted = isResubmittedForReview(sub);

                                            const makerComment =
                                                sub.latest_maker_remarks ||
                                                sub.maker_remarks ||
                                                "";

                                            const makerPhoto =
                                                sub.latest_maker_photo_url ||
                                                sub.photo_url ||
                                                "";

                                            return (
                                                <div
                                                    key={sub.id}
                                                    className={`rounded-xl border p-5 shadow-sm transition-shadow hover:shadow-md ${isResubmitted
                                                        ? "border-yellow-400 bg-yellow-50"
                                                        : "border-border bg-card"
                                                        }`}
                                                >
                                                    {isResubmitted && (
                                                        <span className="mb-3 inline-flex rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-800">
                                                            Re-submitted by {getResubmittedMakerName(sub)}
                                                        </span>
                                                    )}

                                                    <div className="mb-4 flex items-start gap-3">
                                                        <QuestionBadge number={idx + 1} />
                                                        <p className="pt-1 text-sm font-semibold text-foreground sm:text-base">{item.title}</p>
                                                    </div>

                                                    <div className="space-y-3">
                                                        <div>
                                                            {/* <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                                                                Maker Answer
                                                            </p> */}

                                                            <ReadOnlyOptionButtons
                                                                options={item.options}
                                                                value={sub.latest_maker_answer}
                                                            />
                                                        </div>

                                                        {sub.latest_checker_reject_remarks && (
                                                            <RemarksBubble
                                                                label="Previous Checker Objection"
                                                                text={sub.latest_checker_reject_remarks}
                                                            />
                                                        )}

                                                        {makerComment && (
                                                            <RemarksBubble
                                                                label="Maker Comment"
                                                                text={makerComment}
                                                            />
                                                        )}

                                                        {sub.supervisor_remarks && (
                                                            <RemarksBubble
                                                                label="Supervisor"
                                                                text={sub.supervisor_remarks}
                                                            />
                                                        )}

                                                        {sub.latest_checker_reject_photo_url && (
                                                            <PhotoViewButton
                                                                url={sub.latest_checker_reject_photo_url}
                                                                label="View Previous Checker Photo"
                                                            />
                                                        )}

                                                        <div className="pt-1">
                                                            {makerPhoto ? (
                                                                <PhotoViewButton
                                                                    url={makerPhoto}
                                                                    label="View Maker Photo"
                                                                />
                                                            ) : (
                                                                <NoPhotoLabel />
                                                            )}
                                                        </div>

                                                        <div>
                                                            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                                                                Checker Comment / Objection
                                                            </label>

                                                            <textarea
                                                                rows={1}
                                                                value={checkerComments[sub.id] || ""}
                                                                onChange={(e) => {
                                                                    setCheckerComments((prev) => ({
                                                                        ...prev,
                                                                        [sub.id]: e.target.value,
                                                                    }));

                                                                    autoResizeTextarea(e.target);
                                                                }}
                                                                onInput={(e) => autoResizeTextarea(e.target)}
                                                                className="min-h-[42px] w-full resize-none overflow-hidden rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                                                placeholder="Add comment if you want to reject this question..."
                                                            />
                                                        </div>

                                                        <PhotoUploadArea
                                                            id={`checker-objection-${sub.id}`}
                                                            previewBase64={reviewerMedia[sub.id]}
                                                            label="Upload objection photo (optional)"
                                                            onFileChange={(e) => {
                                                                const file = e.target.files?.[0];
                                                                if (!file) return;

                                                                setReviewerMedia((prev) => ({
                                                                    ...prev,
                                                                    [sub.id]: file,
                                                                }));
                                                            }}
                                                            onRemove={() =>
                                                                setReviewerMedia((prev) => ({
                                                                    ...prev,
                                                                    [sub.id]: undefined,
                                                                }))
                                                            }
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>

                                <SafetyChecklistSignOffSection
                                    detail={detail}
                                    className="mt-6"
                                />

                                {pendingCheckerItems.length > 0 && (
                                    <div className="mt-6">
                                        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                            <button
                                                type="button"
                                                onClick={handleRejectChecklist}
                                                disabled={submitting}
                                                className="flex w-full items-center justify-center rounded-xl bg-red-500 px-4 py-3.5 text-sm font-bold text-white disabled:opacity-60"
                                            >
                                                {submitting ? "Submitting..." : "Reject Checklist"}
                                            </button>

                                            <button
                                                type="button"
                                                onClick={handleApproveChecklist}
                                                disabled={submitting}
                                                className="flex w-full items-center justify-center rounded-xl bg-green-600 px-4 py-3.5 text-sm font-bold text-white disabled:opacity-60"
                                            >
                                                {submitting ? "Submitting..." : "Approve Checklist"}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </section>
                        )}

                        {/* ═══ VIEW: CREATE ═══ */}
                        {view === "create" && (
                            window.location.pathname.includes('/safety/observations') ? (
                                <CreateSafetyObservation onBack={() => setView("dashboard")} />
                            ) : (
                                <SafetyChecklistCreateView
                                    onBack={() => setView("dashboard")}
                                    allowedFirstRoles={["CHECKER", "INITIALIZER"]}
                                />
                            )
                        )}

                        {/* ═══ VIEW: REVIEW OBSERVATION ═══ */}
                        {view === "review_observation" && detail && (
                            <ReviewSafetyObservation
                                detail={detail}
                                onBack={() => setView("dashboard")}
                                onSuccess={() => {
                                    setView("dashboard");
                                    fetchList();
                                }}
                            />
                        )}

                        {/* ═══ VIEW: DASHBOARD ═══ */}
                        {view === "dashboard" && (
                            <div className="mx-auto max-w-7xl">
                                <section>
                                    {/* Header */}
                                    <div className="mb-6 flex flex-wrap items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
                                            <ClipboardCheck className="h-5 w-5 text-orange-500" />
                                        </div>
                                        <div>
                                            <h1 className="text-xl font-bold text-foreground sm:text-2xl">
                                                {window.location.pathname.includes("observations") ? "Safety Observations Dashboard" : "Safety Checklist Dashboard"}
                                            </h1>
                                            {/* <p className="text-sm text-muted-foreground">Manage your inspections</p> */}
                                        </div>
                                        {window.location.pathname.includes("observations") && (
                                            <button
                                                type="button"
                                                onClick={() => setView("create")}
                                                className="ml-auto inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:shadow-md"
                                            >
                                                <Plus className="h-4 w-4" />
                                                Raise Observation
                                            </button>
                                        )}
                                    </div>

                                    {/* Counter cards */}
                                    <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
                                        {(isObservations ? [
                                            {
                                                key: "total",
                                                label: "Total Raised Observations",
                                                icon: <ClipboardList className="h-3.5 w-3.5 text-purple-500" />,
                                                color: "hsl(263, 83%, 53%)",
                                                count: checkerTotal,
                                            },
                                            {
                                                key: "open observations",
                                                label: "Open Observations",
                                                icon: <FolderOpen className="h-3.5 w-3.5 text-blue-500" />,
                                                color: "hsl(210, 100%, 50%)",
                                                count: openObservationsCount,
                                            },
                                            {
                                                key: "closed observations",
                                                label: "Closed Observations",
                                                icon: <CheckCircle className="h-3.5 w-3.5 text-green-500" />,
                                                color: "hsl(145, 65%, 42%)",
                                                count: checkerApprovedCount,
                                            },
                                            {
                                                key: "pending for rectification",
                                                label: "Pending for Rectification",
                                                icon: <Clock className="h-3.5 w-3.5 text-yellow-500" />,
                                                color: "hsl(45, 93%, 47%)",
                                                count: checkerPending.length,
                                            },
                                            {
                                                key: "pending for re-rectification",
                                                label: "Pending for Re-Rectification",
                                                icon: <Eye className="h-3.5 w-3.5 text-orange-500" />,
                                                color: "hsl(24.6, 95%, 53.1%)",
                                                count: checkerAssigned.length,
                                            },
                                            {
                                                key: "unsafe act",
                                                label: "Unsafe Act Observations",
                                                icon: <TriangleAlert className="h-3.5 w-3.5 text-red-500" />,
                                                color: "hsl(0, 75%, 55%)",
                                                count: unsafeActCount,
                                            },
                                            {
                                                key: "unsafe condition",
                                                label: "Unsafe Condition Observations",
                                                icon: <TriangleAlert className="h-3.5 w-3.5 text-red-500" />,
                                                color: "hsl(0, 75%, 55%)",
                                                count: unsafeConditionCount,
                                            },
                                            {
                                                key: "low risk",
                                                label: "Low Risk",
                                                icon: <Activity className="h-3.5 w-3.5 text-green-500" />,
                                                color: "hsl(145, 65%, 42%)",
                                                count: lowRiskCount,
                                            },
                                            {
                                                key: "medium risk",
                                                label: "Medium Risk",
                                                icon: <Activity className="h-3.5 w-3.5 text-orange-400" />,
                                                color: "hsl(24.6, 95%, 53.1%)",
                                                count: mediumRiskCount,
                                            },
                                            {
                                                key: "high risk",
                                                label: "High Risk",
                                                icon: <Activity className="h-3.5 w-3.5 text-red-600" />,
                                                color: "hsl(0, 75%, 55%)",
                                                count: highRiskCount,
                                            },
                                            {
                                                key: "overdue observations",
                                                label: "Overdue Observations",
                                                icon: <Clock className="h-3.5 w-3.5 text-red-500" />,
                                                color: "hsl(0, 75%, 55%)",
                                                count: overdueObservationsCount,
                                            },
                                            {
                                                key: "on-time closures",
                                                label: "On-Time Closures",
                                                icon: <ClipboardCheck className="h-3.5 w-3.5 text-emerald-500" />,
                                                color: "hsl(145, 65%, 42%)",
                                                count: onTimeClosuresCount,
                                            }
                                        ] : [
                                            {
                                                key: "pending for review",
                                                label: "Pending Review",
                                                icon: <Clock className="h-3.5 w-3.5 text-yellow-500" />,
                                                color: "hsl(45, 93%, 47%)",
                                                count: checkerAssigned.length,
                                            },
                                            {
                                                key: "pending for rectification",
                                                label: "Pending Rectification",
                                                icon: <Eye className="h-3.5 w-3.5 text-orange-500" />,
                                                color: "hsl(24.6, 95%, 53.1%)",
                                                count: checkerPending.length,
                                            },
                                            {
                                                key: "approved",
                                                label: "Approved",
                                                icon: <CheckCircle className="h-3.5 w-3.5" />,
                                                color: "hsl(145, 65%, 42%)",
                                                count: checkerApprovedCount,
                                            },
                                            {
                                                key: "rejected",
                                                label: "Rejected",
                                                icon: <TriangleAlert className="h-3.5 w-3.5 text-red-500" />,
                                                color: "hsl(0, 75%, 55%)",
                                                count: checkerRejectedCount,
                                            },
                                            {
                                                key: "total",
                                                label: "Total",
                                                icon: <ClipboardList className="h-3.5 w-3.5" />,
                                                color: "hsl(263, 83%, 53%)",
                                                count: checkerTotal,
                                            },
                                        ]).map(({ key, label, icon, color, count }) => (
                                            <div key={key} className="rounded-xl border bg-card p-4 shadow-sm">
                                                <div className="mb-1 flex items-center gap-1.5" style={{ color }}>
                                                    {icon}
                                                    <span className="text-xs font-medium">{label}</span>
                                                </div>
                                                <p className="text-2xl font-bold text-foreground">{count}</p>
                                            </div>
                                        ))}
                                    </div>





                                    {/* Pending Verification */}
                                    <div className="mb-6">
                                        <div className="mb-2 flex items-center gap-2">
                                            <Clock className="h-4 w-4 text-yellow-500" />
                                            <h2 className="text-sm font-semibold sm:text-base text-yellow-600">{isObservations ? "Pending for Rectification" : "Pending for Rectification"}</h2>
                                            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{checkerPending.length}</span>
                                        </div>
                                        <div className="rounded-xl border bg-card shadow-sm">
                                            {checkerPending.length === 0 ? (
                                                <p className="p-4 text-sm text-muted-foreground">No items</p>
                                            ) : (
                                                checkerPending.map((item) => {
                                                    const canReview = checkerCanReview(item);

                                                    return (
                                                        <div
                                                            key={item.id}
                                                            className="flex flex-col gap-2 border-b border-border/50 p-4 last:border-0 sm:flex-row sm:items-center sm:justify-between"
                                                        >
                                                            <div>
                                                                <p className="font-medium text-foreground">{item.name || `Observation #${item.id}`}{getItemReportName(item)}</p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    {item.created_at ? formatChecklistDateTime(item.created_at) : ""}
                                                                </p>
                                                            </div>

                                                            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                                                                <span
                                                                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-yellow-100 text-yellow-600`}
                                                                >
                                                                    {canReview ? (isObservations ? "Pending Rectification" : "Pending Rectification") : "Rectifying"}
                                                                </span>

                                                                {canReview ? (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => openPendingVerification(item)}
                                                                        className="rounded-lg border bg-card bg-gradient-to-r from-orange-400 to-orange-500 px-3 py-1.5 text-xs text-white font-medium text-foreground transition-colors hover:shadow-md"
                                                                    >
                                                                        Review Rectifications
                                                                    </button>
                                                                ) : (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setReadonlyChecklist(item);
                                                                            setReadonlyPendingStatusLabel("Pending for Rectification");
                                                                        }}
                                                                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-700 transition-colors hover:bg-blue-100" title="View"
                                                                    >
                                                                        <Eye className="h-4 w-4" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>

                                    {/* Assigned Inspections */}
                                    <div className="mb-6">
                                        <div className="mb-2 flex items-center gap-2">
                                            <Eye className="h-4 w-4 text-orange-500" />
                                            <h2 className="text-sm font-semibold sm:text-base text-orange-600">{isObservations ? "Pending for Re-Rectification" : "Pending for Review"}</h2>
                                            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{checkerAssigned.length}</span>
                                        </div>
                                        <div className="rounded-xl border bg-card shadow-sm">
                                            {checkerAssigned.length === 0 ? (
                                                <p className="p-4 text-sm text-muted-foreground">No items</p>
                                            ) : (
                                                checkerAssigned.map((item) => (
                                                    <div key={item.id} className="flex flex-col gap-2 border-b border-border/50 p-4 last:border-0 sm:flex-row sm:items-center sm:justify-between">
                                                        <div>
                                                            <p className="font-medium text-foreground">{item.name || `Observation #${item.id}`}{getItemReportName(item)}</p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {item.created_at ? formatChecklistDateTime(item.created_at) : ""}
                                                            </p>
                                                        </div>
                                                        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                                                            <span
                                                                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-orange-100 text-orange-600`}
                                                            >
                                                                {isObservations ? "Pending for Re-Rectification" : "Pending for Review"}
                                                            </span>
                                                            <button type="button" onClick={() => isObservations ? openCheckerObservation(item) : openAssignedInspection(item)}
                                                                className="rounded-lg bg-gradient-to-r from-orange-400 to-orange-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:shadow-md">
                                                                Review {isObservations ? "Observation" : "Checklist"}
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>



                                    <ChecklistFilters
                                        filters={filters}
                                        setFilters={setFilters}
                                        contractorOptions={contractorOptions}
                                        typeOptions={typeOptions}
                                        isObservations={isObservations}
                                        wingOptions={wingOptions}
                                        hazardOptions={hazardOptions}
                                    />


                                    {/* Completed / Closed Observations */}
                                    {isObservations ? (
                                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 mb-6">
                                            {/* Left Side: Closed Observations */}
                                            <div>
                                                <div className="mb-2 flex items-center gap-2">
                                                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                                                    <h2 className="text-sm font-semibold text-foreground sm:text-base" style={{ color: "hsl(145, 65%, 42%)" }}>Closed Observations</h2>
                                                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{checkerCompleted.length}</span>
                                                </div>
                                                <div className="rounded-xl border bg-card shadow-sm overflow-y-auto max-h-[350px] custom-scrollbar">
                                                    {checkerCompleted.length === 0 ? (
                                                        <p className="p-4 text-sm text-muted-foreground">No items</p>
                                                    ) : (
                                                        checkerCompleted.map((item) => (
                                                            <div key={item.id} className="flex flex-col gap-2 border-b border-border/50 p-4 last:border-0 sm:flex-row sm:items-center sm:justify-between">
                                                                <div>
                                                                    <p className="font-medium text-foreground">{item.name || `Observation #${item.id}`}{getItemReportName(item)}</p>
                                                                    <p className="text-xs text-muted-foreground">
                                                                        {item.created_at ? formatChecklistDateTime(item.created_at) : ""}
                                                                    </p>
                                                                </div>
                                                                <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                                                                    <button
                                                                        type="button"
                                                                        title="View History"
                                                                        onClick={() => {
                                                                            setReadonlyChecklist(item);
                                                                            setReadonlyPendingStatusLabel("Closed Observation");
                                                                        }}
                                                                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-700 transition-colors hover:bg-blue-100"
                                                                    >
                                                                        <Eye className="h-4 w-4" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </div>

                                            {/* Right Side: Reports */}
                                            <div>
                                                <div className="mb-2 flex items-center gap-2">
                                                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                                                    <h2 className="text-sm font-semibold text-foreground sm:text-base" style={{ color: "hsl(145, 65%, 42%)" }}>Reports</h2>
                                                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{groupedReports.length}</span>
                                                </div>
                                                <div className="rounded-xl border bg-card shadow-sm overflow-y-auto max-h-[350px] custom-scrollbar">
                                                    {groupedReports.length === 0 ? (
                                                        <p className="p-4 text-sm text-muted-foreground">No items</p>
                                                    ) : (
                                                        groupedReports.map((report) => (
                                                            <div key={`report-${report.date}`} className="flex flex-col gap-2 border-b border-border/50 p-4 last:border-0 sm:flex-row sm:items-center sm:justify-between">
                                                                <div>
                                                                    <p className="font-medium text-foreground">{report.reportName}</p>
                                                                    <p className="text-xs text-muted-foreground">
                                                                        {report.date}
                                                                    </p>
                                                                </div>
                                                                <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                                                                    <button
                                                                        type="button"
                                                                        title="Download Report"
                                                                        onClick={() => handleDownloadReport({ id: report.firstItemId, name: report.reportName, date: report.date })}
                                                                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-green-200 bg-green-50 text-green-700 transition-colors hover:bg-green-100"
                                                                    >
                                                                        <Download className="h-4 w-4" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="mb-6">
                                            <div className="mb-2 flex items-center gap-2">
                                                <CheckCircle className="h-4 w-4 text-muted-foreground" />
                                                <h2 className="text-sm font-semibold text-foreground sm:text-base">Completed Checklists</h2>
                                                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{checkerCompleted.length}</span>
                                            </div>
                                            <div className="rounded-xl border bg-card shadow-sm">
                                                {checkerCompleted.length === 0 ? (
                                                    <p className="p-4 text-sm text-muted-foreground">No items</p>
                                                ) : (
                                                    checkerCompleted.map((item) => (
                                                        <div key={item.id} className="flex flex-col gap-2 border-b border-border/50 p-4 last:border-0 sm:flex-row sm:items-center sm:justify-between">
                                                            <div>
                                                                <p className="font-medium text-foreground">{item.name}</p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    {item.created_at ? formatChecklistDateTime(item.created_at) : ""}
                                                                </p>
                                                            </div>

                                                            <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                                                                <span
                                                                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${isClosedRejected(item)
                                                                        ? "bg-red-100 text-red-700"
                                                                        : "bg-green-100 text-green-700"
                                                                        }`}
                                                                >
                                                                    {isClosedRejected(item) ? "Rejected" : "Approved"}
                                                                </span>

                                                                <button
                                                                    type="button"
                                                                    title="View History"
                                                                    onClick={() => setHistoryChecklist(item)}
                                                                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-700 transition-colors hover:bg-blue-100"
                                                                >
                                                                    <Eye className="h-4 w-4" />
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    title="Download Report"
                                                                    onClick={() => handleDownloadReport({ id: item.id, date: item.created_at ? new Date(item.created_at).toLocaleDateString("en-GB", { day: '2-digit', month: '2-digit', year: 'numeric' }) : "" })}
                                                                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-green-200 bg-green-50 text-green-700 transition-colors hover:bg-green-100"
                                                                >
                                                                    <Download className="h-4 w-4" />
                                                                </button>
                                                            </div>

                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </section>
                            </div>
                        )}
                    </>
                )}

                {isObservations ? (
                    <SafetyObservationReadonlyModal
                        open={!!readonlyChecklist}
                        checklistId={readonlyChecklist?.id}
                        onClose={() => setReadonlyChecklist(null)}
                    />
                ) : (
                    <SafetyChecklistReadonlyModal
                        open={!!readonlyChecklist}
                        checklistId={readonlyChecklist?.id}
                        pendingStatusLabel={readonlyPendingStatusLabel}
                        onClose={() => setReadonlyChecklist(null)}
                    />
                )}

                <SafetyChecklistHistoryModal
                    open={!!historyChecklist}
                    checklistId={historyChecklist?.id}
                    title={historyChecklist?.name}
                    onClose={() => setHistoryChecklist(null)}
                />


                {isSubmitSignatureModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                        <div className="w-full max-w-md animate-in zoom-in-95 rounded-2xl bg-white p-6 shadow-2xl">
                            <h3 className="mb-4 text-xl font-bold text-slate-800">
                                Sign to Submit
                            </h3>
                            <div className="mb-6 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50">
                                <SignatureCanvas
                                    ref={sigPadRef}
                                    penColor="black"
                                    canvasProps={{ className: "w-full h-48 rounded-xl" }}
                                />
                            </div>
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        sigPadRef.current?.clear();
                                        setIsSubmitSignatureModalOpen(false);
                                    }}
                                    className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (sigPadRef.current?.isEmpty()) {
                                            showToast("Please provide a signature", "error");
                                            return;
                                        }
                                        const sigData = sigPadRef.current.getCanvas().toDataURL("image/png");
                                        fetch(sigData)
                                            .then(res => res.blob())
                                            .then(blob => {
                                                const file = new File([blob], "signature.png", { type: "image/png" });
                                                confirmSubmitChecklist(file);
                                            });
                                    }}
                                    className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
                                    disabled={submitting}
                                >
                                    {submitting ? "Submitting..." : "Submit"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {isSignatureModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                        <div className="w-full max-w-2xl rounded-xl bg-white p-5 shadow-xl">
                            <div className="mb-3 flex items-center justify-between">
                                <h3 className="text-base font-semibold text-foreground">
                                    Final Signature
                                </h3>
                                <button
                                    type="button"
                                    onClick={handleCloseSignatureModal}
                                    className="rounded p-1 text-muted-foreground hover:bg-muted"
                                >
                                    <XIcon className="h-4 w-4" />
                                </button>
                            </div>
                            <p className="mb-3 text-xs text-muted-foreground">
                                Draw your signature and submit to complete checklist.
                            </p>
                            <div className="rounded-lg border border-border bg-white p-2">
                                <SignatureCanvas
                                    ref={sigCanvasRef}
                                    penColor="black"
                                    canvasProps={{
                                        width: 760,
                                        height: 220,
                                        className: "w-full h-[220px]",
                                    }}
                                />
                            </div>
                            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <button
                                    type="button"
                                    onClick={() => sigCanvasRef.current?.clear()}
                                    className="rounded-lg border px-3 py-1.5 text-xs font-medium text-foreground"
                                >
                                    Clear
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSubmitWithSignature}
                                    disabled={signatureSubmitting}
                                    className="rounded-lg bg-gradient-to-r from-orange-400 to-orange-500 px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
                                >
                                    {signatureSubmitting ? "Submitting..." : "Submit Signature"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

