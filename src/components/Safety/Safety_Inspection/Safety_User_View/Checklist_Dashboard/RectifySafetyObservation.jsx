import React, { useState } from "react";
import { ArrowLeft, Save, UploadCloud } from "lucide-react";
import { updateSafetyObservation } from "../../../../../api";
import { showToast } from "../../../../../utils/toast";
import SafetyImageAnnotationModal from "../../SafetyImageAnnotationModal";
import SignatureCanvas from "react-signature-canvas";

export default function RectifySafetyObservation({ detail, onBack, onSuccess }) {
    const [submitting, setSubmitting] = useState(false);
    const [closerPhotographs, setCloserPhotographs] = useState(
        detail && detail.closer_photographs ? detail.closer_photographs.map(p => ({
            id: p.id,
            url: p.image,
            name: p.image.split('/').pop(),
            size: 0,
            isExisting: true,
            comment: p.comment || "",
            checker_comment: p.checker_comment || ""
        })) : []
    );
    const [showAnnotationModal, setShowAnnotationModal] = useState(false);
    const [annotatingIndex, setAnnotatingIndex] = useState(null);

    const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
    const sigPadRef = React.useRef(null);

    if (!detail) return null;

    let hazardsArray = [];
    try {
        if (detail.hazard_categories) {
            hazardsArray = JSON.parse(detail.hazard_categories);
            if (!Array.isArray(hazardsArray)) {
                hazardsArray = [String(detail.hazard_categories)];
            }
        }
    } catch (e) {
        if (detail.hazard_categories) {
            hazardsArray = [String(detail.hazard_categories)];
        }
    }

    const HAZARDS_OPTIONS = [
        "1. Physical Hazard", "2. Biological Hazard", "3. Chemical Hazard",
        "4. Mechanical Hazard", "5. Ergonomical Hazard", "6. Environmental Hazard",
        "7. Fire/Explosion Hazard", "8. Electrical Hazard", "9. Psychological Hazard", "10. OTHER HAZARDS"
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (closerPhotographs.length === 0) {
            showToast("Please provide at least one closer photograph.", "error");
            return;
        }
        
        const missingComments = closerPhotographs.some(photo => !photo.isExisting && !photo.comment?.trim());
        if (missingComments) {
            showToast("Please provide a comment for all new closer photographs.", "error");
            return;
        }

        setIsSignatureModalOpen(true);
    };

    const confirmSubmit = async (signatureFile) => {
        setSubmitting(true);
        try {
            const payload = new FormData();
            payload.append("status", "PENDING_CHECKER");
            
            closerPhotographs.forEach(file => {
                if (!file.isExisting) {
                    payload.append("closer_photographs", file);
                    payload.append("closer_photographs_comments", file.comment || "");
                } else if (file.id) {
                    payload.append("existing_closer_photographs", file.id);
                    payload.append("existing_closer_photographs_comments", file.comment || "");
                }
            });

            if (signatureFile) {
                payload.append("maker_rectify_signature", signatureFile);
            }

            // Clear checker_remarks once the Maker re-submits so it doesn't persist
            payload.append("checker_remarks", "");

            await updateSafetyObservation(detail.id, payload);
            showToast("Observation rectified successfully!", "success");
            if (onSuccess) onSuccess();
        } catch (err) {
            showToast("Failed to submit rectification.", "error");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="mx-auto max-w-5xl pb-12">
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm transition hover:bg-slate-100"
                    >
                        <ArrowLeft className="h-5 w-5 text-slate-700" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Rectify Safety Observation #{detail.id}</h1>
                        <p className="text-sm text-slate-500">Please review questions 1-8 and fill question 9.</p>
                    </div>
                </div>
            </div>


            <div className="rounded-xl border bg-white p-6 shadow-sm">
                <form onSubmit={(e) => { e.preventDefault(); handleSubmit(e); }} className="space-y-8">
                    
                    {/* Q1 */}
                    <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 opacity-80">
                        <h3 className="font-bold text-slate-600 mb-4">1. WHAT UNSAFE ACT / CONDITION OBSERVED</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <select 
                                    className="w-full rounded-lg border-slate-300 p-2.5 text-sm bg-slate-100 cursor-not-allowed"
                                    value={detail.unsafe_act_condition_category || ""}
                                    disabled
                                >
                                    <option value="">Select Category...</option>
                                    <option value="Unsafe Act">Unsafe Act</option>
                                    <option value="Unsafe Condition">Unsafe Condition</option>
                                </select>
                            </div>
                            <div>
                                <input 
                                    type="text" 
                                    className="w-full rounded-lg border-slate-300 p-2.5 text-sm bg-slate-100 cursor-not-allowed"
                                    value={detail.unsafe_act_condition_description || ""}
                                    readOnly
                                />
                            </div>
                        </div>
                    </div>

                    {/* Q2 */}
                    <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 opacity-80">
                        <h3 className="font-bold text-slate-600 mb-4">2. LOCATION</h3>
                        <div>
                            <label className="text-xs text-slate-500 block mb-1">Combined Location</label>
                            <input 
                                type="text" 
                                className="w-full rounded-lg border-slate-300 p-2.5 text-sm bg-slate-200 cursor-not-allowed"
                                value={detail.location_combined || ""}
                                readOnly
                            />
                        </div>
                    </div>

                    {/* Q3 */}
                    <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 opacity-80">
                        <h3 className="font-bold text-slate-600 mb-4">3. PHOTOGRAPH OF UNSAFE ACT / CONDITION</h3>
                        {detail.photograph_of_unsafe_act ? (
                            <div>
                                <img src={detail.photograph_of_unsafe_act} alt="Unsafe Act" className="max-w-full h-auto rounded-lg max-h-64 object-cover border border-slate-300" />
                                {detail.photograph_of_unsafe_act_comment && (
                                    <div className="mt-3 text-sm text-slate-700 bg-white border border-slate-200 rounded-lg p-3">
                                        <strong>Comment:</strong> {detail.photograph_of_unsafe_act_comment}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <p className="text-sm text-slate-500 italic">No photograph attached</p>
                        )}
                    </div>

                    {/* Q4 */}
                    <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 opacity-80">
                        <h3 className="font-bold text-slate-600 mb-4">4. HAZARD/RISK</h3>
                        <label className="text-xs text-slate-500 block mb-2">Hazard (Checkboxes)</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                            {HAZARDS_OPTIONS.map(opt => {
                                const isChecked = hazardsArray.some(h => h === opt || h.startsWith(opt + ":"));
                                return (
                                    <label key={opt} className="flex items-center gap-2 text-sm cursor-not-allowed text-slate-500">
                                        <input 
                                            type="checkbox" 
                                            className="rounded border-slate-300 text-slate-400 focus:ring-0 cursor-not-allowed"
                                            checked={isChecked}
                                            disabled
                                        />
                                        {opt}
                                    </label>
                                );
                            })}
                        </div>
                        {hazardsArray.some(h => h.startsWith("10. OTHER HAZARDS:")) && (
                            <div className="mb-4">
                                <label className="text-xs text-slate-500 block mb-1">Other Hazard Details</label>
                                <input 
                                    type="text" 
                                    className="w-full rounded-lg border-slate-300 p-2.5 text-sm bg-slate-100 cursor-not-allowed"
                                    value={hazardsArray.find(h => h.startsWith("10. OTHER HAZARDS:"))?.replace("10. OTHER HAZARDS: ", "") || ""}
                                    readOnly
                                />
                            </div>
                        )}
                        <div>
                            <label className="text-xs text-slate-500 block mb-1">Risk</label>
                            <input 
                                type="text" 
                                className="w-full rounded-lg border-slate-300 p-2.5 text-sm bg-slate-100 cursor-not-allowed"
                                value={detail.risk || ""}
                                readOnly
                            />
                        </div>
                    </div>

                    {/* Q5 */}
                    <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 opacity-80">
                        <h3 className="font-bold text-slate-600 mb-4">5. RECOMMENDATIONS</h3>
                        <textarea 
                            className="w-full rounded-lg border-slate-300 p-3 text-sm bg-slate-100 cursor-not-allowed"
                            rows={3}
                            value={detail.recommendations || ""}
                            readOnly
                        />
                    </div>

                    {/* Q6 */}
                    <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 opacity-80">
                        <h3 className="font-bold text-slate-600 mb-4">6. NAME OF CONTRACTOR</h3>
                        <input 
                            type="text" 
                            className="w-full max-w-sm rounded-lg border-slate-300 p-2.5 text-sm bg-slate-100 cursor-not-allowed"
                            value={detail.name_of_contractor || ""}
                            readOnly
                        />
                    </div>

                    {/* Q7 */}
                    <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 opacity-80">
                        <h3 className="font-bold text-slate-600 mb-4">7. TARGET DATE</h3>
                        <input 
                            type="date" 
                            className="rounded-lg border-slate-300 p-2.5 text-sm max-w-xs bg-slate-100 cursor-not-allowed"
                            value={detail.target_date || ""}
                            readOnly
                        />
                    </div>

                    {/* Q8 */}
                    <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 opacity-80">
                        <h3 className="font-bold text-slate-600 mb-4">8. CA/PA TO BE TAKEN</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-slate-500 block mb-1">Final Combined</label>
                                <div 
                                    className="w-full rounded-lg border border-slate-300 p-3 text-sm bg-slate-200 cursor-not-allowed whitespace-pre-wrap min-h-[6rem]"
                                    dangerouslySetInnerHTML={{ __html: detail.ca_pa_combined || "" }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Maker Input (Q9) */}

                    <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-orange-500"></div>
                        <h3 className="font-bold text-orange-600 mb-4 pl-2">9. CLOSER PHOTOGRAPH</h3>
                        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-orange-200 bg-white py-12 transition-colors hover:bg-orange-50/50">
                            <UploadCloud className="mb-4 h-10 w-10 text-orange-400" />
                            <p className="mb-2 text-sm text-slate-600">
                                <label className="cursor-pointer font-semibold text-orange-600 hover:text-orange-700">
                                    <span>Click to upload</span>
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        multiple
                                        onChange={(e) => {
                                            if (e.target.files?.length > 0) {
                                                const newFiles = Array.from(e.target.files).map(f => {
                                                    f.comment = "";
                                                    return f;
                                                });
                                                setCloserPhotographs(prev => [...prev, ...newFiles]);
                                            }
                                        }}
                                    />
                                </label>{" "}
                                closer photographs
                            </p>
                            <p className="text-xs text-slate-400">PNG, JPG, JPEG</p>
                        </div>

                        <div className="mt-4 space-y-3">
                            {closerPhotographs.map((photo, idx) => (
                                <div key={idx} className="rounded-lg border border-orange-200 bg-white p-3 shadow-sm">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 shrink-0 overflow-hidden rounded bg-slate-100">
                                                {photo.isExisting ? (
                                                    <img
                                                        src={photo.url}
                                                        alt="Closer"
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : photo.type?.startsWith("image/") ? (
                                                    <img
                                                        src={URL.createObjectURL(photo)}
                                                        alt="Closer"
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                                                        IMG
                                                    </div>
                                                )}
                                            </div>
                                            <div className="min-w-0 max-w-[200px] sm:max-w-xs">
                                                <p className="truncate text-sm font-medium text-slate-700">
                                                    {photo.name}
                                                </p>
                                                {!photo.isExisting && (
                                                    <p className="text-xs text-slate-500">
                                                        {(photo.size / 1024 / 1024).toFixed(2)} MB
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {!photo.isExisting && (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setAnnotatingIndex(idx);
                                                            setShowAnnotationModal(true);
                                                        }}
                                                        className="rounded p-1.5 text-blue-500 hover:bg-blue-50"
                                                    >
                                                        Annotate
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setCloserPhotographs(prev => prev.filter((_, i) => i !== idx))}
                                                        className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-red-500"
                                                    >
                                                        Remove
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <div className="mt-2">
                                        <input
                                            type="text"
                                            placeholder="Required comment for this photograph..."
                                            className="w-full rounded-lg border-slate-300 p-2 text-sm"
                                            value={photo.comment || ""}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setCloserPhotographs(prev => {
                                                    const newArr = [...prev];
                                                    newArr[idx].comment = val;
                                                    return newArr;
                                                });
                                            }}
                                            readOnly={photo.isExisting}
                                            disabled={photo.isExisting}
                                            required={!photo.isExisting}
                                        />
                                    </div>
                                    {photo.isExisting && photo.checker_comment && (
                                        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3">
                                            <p className="text-xs font-semibold text-red-700 mb-1">Checker's Comment for this Photo:</p>
                                            <p className="text-sm text-red-600">{photo.checker_comment}</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {showAnnotationModal && annotatingIndex !== null && (
                            <SafetyImageAnnotationModal 
                                open={showAnnotationModal}
                                file={closerPhotographs[annotatingIndex]}
                                onClose={() => {
                                    setShowAnnotationModal(false);
                                    setAnnotatingIndex(null);
                                }}
                                onSave={(annotatedFile) => {
                                    setCloserPhotographs(prev => {
                                        const newArr = [...prev];
                                        newArr[annotatingIndex] = annotatedFile;
                                        return newArr;
                                    });
                                    setShowAnnotationModal(false);
                                    setAnnotatingIndex(null);
                                }}
                            />
                        )}
                    </div>

                    {(detail.checker_remarks || (detail.reject_photographs && detail.reject_photographs.length > 0) || detail.checker_reject_photo) && (
                        <div className="rounded-xl border border-red-200 bg-red-50 p-4 shadow-sm relative overflow-hidden">
                            {detail.checker_remarks && (
                                <>
                                    <h3 className="font-bold text-red-700 mb-1">General Rejection Feedback</h3>
                                    <p className="text-sm text-red-600 mb-3">{detail.checker_remarks}</p>
                                </>
                            )}
                            {detail.reject_photographs && detail.reject_photographs.length > 0 ? (
                                <div className={detail.checker_remarks ? "mt-4" : "mt-1"}>
                                    <p className="text-xs font-semibold text-red-700 mb-2">Attached Photos:</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                        {detail.reject_photographs.map((photo, idx) => (
                                            <div key={idx} className="rounded-lg border border-red-200 bg-white p-2">
                                                <img src={photo.image} alt="Rejection reason attachment" className="w-full h-auto max-h-48 object-cover rounded shadow-sm" />
                                                {photo.comment && (
                                                    <p className="text-xs text-slate-600 mt-2 italic px-1">{photo.comment}</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : detail.checker_reject_photo ? (
                                <div className={detail.checker_remarks ? "mt-2" : "mt-1"}>
                                    <p className="text-xs font-semibold text-red-700 mb-2">Attached Photo:</p>
                                    <img src={detail.checker_reject_photo} alt="Rejection reason attachment" className="max-w-xs h-auto rounded-lg border border-red-200 shadow-sm" />
                                </div>
                            ) : null}
                        </div>
                    )}


                    <div className="mt-8 flex justify-end pt-4 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={onBack}
                            disabled={submitting}
                            className="mr-3 rounded-lg border border-slate-300 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-8 py-2.5 text-sm font-bold text-white shadow-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 transition-all hover:shadow-lg"
                        >
                            <Save className="h-4 w-4" />
                            {submitting ? "Submitting..." : "Submit Rectification"}
                        </button>
                    </div>
                </form>
            </div>

            {isSignatureModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md animate-in zoom-in-95 rounded-2xl bg-white p-6 shadow-2xl">
                        <h3 className="mb-4 text-xl font-bold text-slate-800">
                            Sign to Submit Rectification
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
                                    setIsSignatureModalOpen(false);
                                }}
                                className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    if (sigPadRef.current?.isEmpty()) {
                                        showToast("Please provide your signature.", "error");
                                        return;
                                    }
                                    const sigData = sigPadRef.current.getCanvas().toDataURL("image/png");
                                    fetch(sigData)
                                        .then(res => res.blob())
                                        .then(blob => {
                                            const file = new File([blob], `maker-rectify-signature-${Date.now()}.png`, { type: "image/png" });
                                            setIsSignatureModalOpen(false);
                                            confirmSubmit(file);
                                        });
                                }}
                                className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
                                disabled={submitting}
                            >
                                {submitting ? "Submitting..." : "Submit Rectification"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
