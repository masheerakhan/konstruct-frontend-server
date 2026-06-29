import React, { useState, useRef, useEffect } from "react";
import { ArrowLeft, Save, UploadCloud } from "lucide-react";
import {
  updateSafetyObservation,
  getUsersByProject,
} from "../../../../../api";
import { showToast } from "../../../../../utils/toast";
import SafetyImageAnnotationModal from "../../SafetyImageAnnotationModal";
import SignatureCanvas from "react-signature-canvas";

import { Check, X as XIcon } from "lucide-react";
import RiskMatrixModal from "./RiskMatrixModal";

const PhotoUploadArea = ({
  id,
  file,
  onFileChange,
  onRemove,
  label,
  onAnnotate,
}) => {
  const inputRef = useRef(null);
  const previewUrl = file ? URL.createObjectURL(file) : null;

  const handleRemove = () => {
    if (inputRef.current) inputRef.current.value = "";
    onRemove?.();
  };

  return (
    <div className="mt-3">
      <p className="mb-1.5 text-xs font-medium text-slate-500">{label}</p>
      {previewUrl ? (
        <div className="flex items-center gap-4">
          <div className="relative inline-block">
            <img
              src={previewUrl}
              alt="Preview"
              className="h-20 w-20 rounded-lg border border-slate-200 object-cover shadow-sm"
            />
            <button
              type="button"
              onClick={handleRemove}
              className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow transition-colors hover:bg-red-600"
            >
              <XIcon className="h-3 w-3" />
            </button>
          </div>
          {onAnnotate && (
            <button
              type="button"
              onClick={onAnnotate}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm"
            >
              Edit / Annotate
            </button>
          )}
        </div>
      ) : (
        <label
          htmlFor={`photo-upload-${id}`}
          className="flex cursor-pointer items-center gap-2 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-xs text-slate-500 transition-colors hover:border-blue-400 hover:bg-blue-50"
        >
          <UploadCloud className="h-4 w-4" />
          <span>Click to attach photo</span>
        </label>
      )}
      <input
        ref={inputRef}
        id={`photo-upload-${id}`}
        type="file"
        accept="image/*"
        onChange={(e) => onFileChange(e.target.files?.[0])}
        className="hidden"
      />
    </div>
  );
};

export default function ReviewSafetyObservation({ detail, onBack, onSuccess }) {
  const [submitting, setSubmitting] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectPhotos, setRejectPhotos] = useState([]);
  const [actionType, setActionType] = useState(null); // 'approve' or 'reject'
  const [photoComments, setPhotoComments] = useState({}); // ID -> comment string
  const [showAnnotationModal, setShowAnnotationModal] = useState(false);
  const [annotatingIndex, setAnnotatingIndex] = useState(null);

  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [signatureAction, setSignatureAction] = useState(null);
  const [showRiskMatrix, setShowRiskMatrix] = useState(false);

  // Final Image Selection Modal State
  const [showFinalImageModal, setShowFinalImageModal] = useState(false);
  const [availableFinalImages, setAvailableFinalImages] = useState([]);
  const [selectedFinalImage, setSelectedFinalImage] = useState(null);
  const [selectedFinalComments, setSelectedFinalComments] = useState([]);
  const [pendingApprovalPayload, setPendingApprovalPayload] = useState(null);
  const sigPadRef = React.useRef(null);

  // Final Checker Selection State
  const [checkers, setCheckers] = useState([]);
  const [selectedFinalChecker, setSelectedFinalChecker] = useState("");
  const [loadingCheckers, setLoadingCheckers] = useState(false);
  const [currentUserProfile, setCurrentUserProfile] = useState(null);

  const isCurrentUserInternal =
    currentUserProfile?.user_type === "INTERNAL" ||
    (currentUserProfile?.user_type !== "EXTERNAL" &&
      !(currentUserProfile?.contractor_name || currentUserProfile?.company));

  useEffect(() => {
    try {
      const raw = localStorage.getItem("USER_DATA");
      const profile = raw && raw !== "undefined" ? JSON.parse(raw) : {};
      setCurrentUserProfile(profile);
    } catch {}

    if (detail?.project_id && detail?.status === "PENDING_CHECKER") {
      fetchCheckers(detail.project_id);
    }
  }, [detail?.project_id, detail?.status]);

  useEffect(() => {
    if (!loadingCheckers && checkers.length > 0 && detail?.final_checker_id) {
      setSelectedFinalChecker(detail.final_checker_id);
    }
  }, [loadingCheckers, checkers, detail]);

  const fetchCheckers = async (pId) => {
    setLoadingCheckers(true);
    try {
      const res = await getUsersByProject(pId);
      const users = Array.isArray(res?.data) ? res.data : [];
      const filteredCheckers = users.filter(
        (u) =>
          (u.roles && u.roles.includes("CHECKER")) ||
          (u.role && u.role.toUpperCase() === "CHECKER"),
      );
      const enrichedCheckers = filteredCheckers.map((u) => ({
        ...u,
        isInternal:
          u.user_type === "INTERNAL" ||
          (u.user_type !== "EXTERNAL" && !(u.contractor_name || u.company)),
      }));
      setCheckers(enrichedCheckers);
    } catch (err) {
      showToast("Failed to fetch checkers", "error");
    } finally {
      setLoadingCheckers(false);
    }
  };

  const closerPhotographs = detail?.closer_photographs || [];

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
    "1. Physical Hazard",
    "2. Biological Hazard",
    "3. Chemical Hazard",
    "4. Mechanical Hazard",
    "5. Ergonomical Hazard",
    "6. Environmental Hazard",
    "7. Fire/Explosion Hazard",
    "8. Electrical Hazard",
    "9. Psychological Hazard",
    "10. Other Hazards",
  ];

  const handleApprove = () => {
    const allImages = [
      ...(detail.closer_photographs || []).map((p) => ({
        ...p,
        type: "closer",
      })),
      ...(detail.reject_photographs || []).map((p) => ({
        ...p,
        type: "reject",
      })),
    ];

    if (allImages.length > 0) {
      setAvailableFinalImages(allImages);
      setSelectedFinalImage(null);
      setSelectedFinalComments([]);
      setShowFinalImageModal(true);
    } else {
      setSignatureAction("approve");
      setIsSignatureModalOpen(true);
    }
  };

  const handleReject = () => {
    if (!rejectReason.trim()) {
      showToast("Please provide a reason for rejection.", "error");
      return;
    }
    setSignatureAction("reject");
    setIsSignatureModalOpen(true);
  };

  const confirmFinalImageSelection = () => {
    if (!selectedFinalImage && selectedFinalComments.length === 0) return;
    setShowFinalImageModal(false);
    // Image selected, now show signature modal
    setSignatureAction("approve");
    setIsSignatureModalOpen(true);
  };

  const confirmSubmit = async (signatureFile) => {
    setSubmitting(true);
    try {
      const payload = new FormData();

      if (signatureAction === "approve") {
        if (selectedFinalChecker && detail?.status === "PENDING_CHECKER") {
          payload.append("status", "PENDING_FINAL_CHECKER");
          payload.append("final_checker_id", selectedFinalChecker);
        } else {
          payload.append("status", "APPROVED");
        }
        if (selectedFinalImage) {
          payload.append("final_image_id", selectedFinalImage.id);
          payload.append("final_image_type", selectedFinalImage.type);
        }
        if (selectedFinalComments.length > 0) {
          payload.append(
            "final_approved_comments",
            JSON.stringify(selectedFinalComments),
          );
        }
      } else if (signatureAction === "reject") {
        let currentHistory = [];
        try {
          currentHistory = Array.isArray(detail.rejection_history)
            ? detail.rejection_history
            : JSON.parse(detail.rejection_history || "[]");
        } catch (e) {
          currentHistory = [];
        }

        if (detail?.status === "PENDING_FINAL_CHECKER") {
          payload.append("status", "PENDING_CHECKER");
          payload.append("final_checker_remarks", rejectReason);
          currentHistory.push({
            stage: "FINAL_CHECKER",
            remarks: rejectReason,
            timestamp: new Date().toISOString(),
          });
        } else {
          payload.append("status", "PENDING_MAKER");
          payload.append("checker_remarks", rejectReason);
          currentHistory.push({
            stage: "CONTRACT_CHECKER",
            remarks: rejectReason,
            timestamp: new Date().toISOString(),
          });
        }

        payload.append("rejection_history", JSON.stringify(currentHistory));

        rejectPhotos.forEach((file) => {
          payload.append("reject_photographs", file);
          payload.append("reject_photographs_comments", file.comment || "");
        });
        if (Object.keys(photoComments).length > 0) {
          payload.append(
            "checker_photo_comments",
            JSON.stringify(photoComments),
          );
        }
      }

      if (signatureFile) {
        if (detail?.status === "PENDING_FINAL_CHECKER") {
          payload.append("final_checker_signature", signatureFile);
        } else {
          payload.append("checker_signature", signatureFile);
        }
      }

      await updateSafetyObservation(detail.id, payload);
      if (signatureAction === "approve") {
        showToast("Observation approved successfully!", "success");
      } else {
        showToast("Observation rejected and sent back to Maker!", "success");
      }
      if (onSuccess) onSuccess();
    } catch (err) {
      showToast(`Failed to ${signatureAction} observation.`, "error");
    } finally {
      setSubmitting(false);
      setSignatureAction(null);
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
            <h1 className="text-2xl font-bold text-slate-900">
              Review Safety Observation #{detail.id}
            </h1>
            <p className="text-sm text-slate-500">
              Please review the rectification submitted by the Maker.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="space-y-8">
          {/* Q1 */}
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 opacity-80">
            <h3 className="font-bold text-slate-600 mb-4">
              1. WHAT UNSAFE ACT / CONDITION OBSERVED
            </h3>
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
            <h3 className="font-bold text-slate-600 mb-4">
              3. PHOTOGRAPH OF UNSAFE ACT / CONDITION
            </h3>
            {detail.photograph_of_unsafe_act ? (
              <div>
                <img
                  src={detail.photograph_of_unsafe_act}
                  alt="Unsafe Act"
                  className="max-w-full h-auto rounded-lg max-h-64 object-cover border border-slate-300"
                />
                {detail.photograph_of_unsafe_act_comment && (
                  <div className="mt-3 text-sm text-slate-700 bg-white border border-slate-200 rounded-lg p-3">
                    <strong>Comment:</strong>{" "}
                    {detail.photograph_of_unsafe_act_comment}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-500 italic">
                No photograph attached
              </p>
            )}
          </div>

          {/* Q4 */}
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 opacity-80">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-600">4. HAZARD/RISK</h3>
              <button
                type="button"
                onClick={() => setShowRiskMatrix(true)}
                className="text-xs font-bold bg-orange-50 text-orange-600 hover:bg-orange-100 border border-orange-200 px-3 py-1.5 rounded-lg shadow-sm transition-colors"
              >
                View Risk Matrix
              </button>
            </div>
            <label className="text-xs text-slate-500 block mb-2">
              Hazard (Checkboxes)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-4">
              {HAZARDS_OPTIONS.map((opt) => {
                const isChecked = hazardsArray.some(
                  (h) => h === opt || h.startsWith(opt + ":"),
                );
                return (
                  <label
                    key={opt}
                    className="flex items-center gap-2 text-sm cursor-not-allowed text-slate-500"
                  >
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
            {hazardsArray.some((h) => h.startsWith("10. Other Hazards:")) && (
              <div className="mb-4">
                <label className="text-xs text-slate-500 block mb-1">
                  Other Hazard Details
                </label>
                <input
                  type="text"
                  className="w-full rounded-lg border-slate-300 p-2.5 text-sm bg-slate-100 cursor-not-allowed"
                  value={
                    hazardsArray
                      .find((h) => h.startsWith("10. Other Hazards:"))
                      ?.replace("10. Other Hazards: ", "") || ""
                  }
                  readOnly
                />
              </div>
            )}
            <div>
              <label className="text-xs text-slate-500 block mb-1">Risk</label>
              <input
                type="text"
                className={`w-full rounded-lg border p-2.5 text-sm cursor-not-allowed ${
                  detail.risk === "Low Risk"
                    ? "border-green-500 bg-green-50 text-green-700"
                    : detail.risk === "Medium Risk"
                      ? "border-yellow-500 bg-yellow-50 text-yellow-700"
                      : detail.risk === "High Risk"
                        ? "border-red-500 bg-red-50 text-red-700"
                        : "border-slate-300 bg-slate-100 text-slate-700"
                }`}
                value={detail.risk || ""}
                readOnly
              />
            </div>
          </div>

          {/* Q5 */}
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 opacity-80">
            <h3 className="font-bold text-slate-600 mb-4">
              5. NAME OF CONTRACTOR
            </h3>
            <input
              type="text"
              className="w-full max-w-sm rounded-lg border-slate-300 p-2.5 text-sm bg-slate-100 cursor-not-allowed"
              value={detail.name_of_contractor || ""}
              readOnly
            />
          </div>

          {/* Q6 */}
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 opacity-80">
            <h3 className="font-bold text-slate-600 mb-4">6. TARGET DATE</h3>
            <div className="flex flex-wrap items-center gap-4">
              <div>
                <label className="text-xs font-medium text-slate-500 block mb-1">
                  Date
                </label>
                <input
                  type="date"
                  className={`rounded-lg border p-2.5 text-sm w-[160px] cursor-not-allowed ${
                    detail.risk === "Low Risk"
                      ? "border-green-500 bg-green-50 text-green-700"
                      : detail.risk === "Medium Risk"
                        ? "border-yellow-500 bg-yellow-50 text-yellow-700"
                        : detail.risk === "High Risk"
                          ? "border-red-500 bg-red-50 text-red-700"
                          : "border-slate-300 bg-slate-100 text-slate-700"
                  }`}
                  value={(detail.target_date || "").split("T")[0] || ""}
                  readOnly
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 block mb-1">
                  Time (hh:mm)
                </label>
                <input
                  type="time"
                  className={`rounded-lg border p-2.5 text-sm w-[130px] cursor-not-allowed ${
                    detail.risk === "Low Risk"
                      ? "border-green-500 bg-green-50 text-green-700"
                      : detail.risk === "Medium Risk"
                        ? "border-yellow-500 bg-yellow-50 text-yellow-700"
                        : detail.risk === "High Risk"
                          ? "border-red-500 bg-red-50 text-red-700"
                          : "border-slate-300 bg-slate-100 text-slate-700"
                  }`}
                  value={(
                    (detail.target_date || "").split("T")[1] || ""
                  ).substring(0, 5)}
                  readOnly
                />
              </div>
            </div>
          </div>

          {/* Q7 */}
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 opacity-80">
            <h3 className="font-bold text-slate-600 mb-4">
              7. CA/PA TO BE TAKEN
            </h3>
            <div className="space-y-4">
              <div>
                <div
                  className="w-full rounded-lg border border-slate-300 p-3 text-sm bg-slate-200 cursor-not-allowed whitespace-pre-wrap min-h-[6rem]"
                  dangerouslySetInnerHTML={{
                    __html: detail.ca_pa_combined || "",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Maker Input (Q8) */}
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-orange-500"></div>
            <h3 className="font-bold text-slate-600 mb-4">
              8. CLOSER PHOTOGRAPH
            </h3>

            {closerPhotographs.length === 0 ? (
              <p className="text-sm text-slate-500 italic">
                No closer photograph attached.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {closerPhotographs.map((photo, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded bg-slate-100">
                          <img
                            src={photo.image}
                            alt="Closer"
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="min-w-0 max-w-[200px] sm:max-w-xs">
                          <p className="truncate text-sm font-medium text-slate-700">
                            {photo.image.split("/").pop()}
                          </p>
                        </div>
                      </div>
                    </div>
                    {photo.comment && (
                      <div className="mt-2 text-sm text-slate-600 bg-slate-50 border border-slate-100 rounded-lg p-2.5">
                        <strong>Comment:</strong> {photo.comment}
                      </div>
                    )}
                    {actionType === "reject" && (
                      <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3">
                        <label className="text-xs font-semibold text-red-700 block mb-1">
                          Checker Comment for this Photo (Optional)
                        </label>
                        <input
                          type="text"
                          className="w-full rounded-md border-red-300 text-sm p-2 focus:border-red-500 focus:ring-red-500"
                          placeholder="e.g. This is blurry, or doesn't show the fix..."
                          value={photoComments[photo.id] || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setPhotoComments((prev) => ({
                              ...prev,
                              [photo.id]: val,
                            }));
                          }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-8 pt-4 border-t border-slate-100">
            {actionType === "reject" ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 mb-4">
                <h4 className="font-semibold text-red-700 mb-2">
                  Provide Reason for Rejection
                </h4>
                <textarea
                  className="w-full rounded-lg border-red-300 p-3 text-sm focus:border-red-500 focus:ring-red-500"
                  rows={3}
                  placeholder="Explain why this rectification is rejected..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />

                <div className="mt-4 border-t border-red-100 pt-4">
                  <h4 className="font-semibold text-red-700 mb-2">
                    Attach Photos (Optional)
                  </h4>
                  <label className="flex flex-col items-center justify-center w-full rounded-xl border-2 border-dashed border-red-200 bg-white py-6 transition-colors hover:bg-red-50/50 cursor-pointer">
                    <UploadCloud className="mb-2 h-8 w-8 text-red-400" />
                    <p className="mb-1 text-sm text-slate-600">
                      <span className="font-semibold text-red-600 hover:text-red-700">
                        Click to upload
                      </span>{" "}
                      photos
                    </p>
                    <p className="text-xs text-slate-400">PNG, JPG, JPEG</p>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      multiple
                      onChange={(e) => {
                        if (e.target.files?.length > 0) {
                          const newFiles = Array.from(e.target.files).map(
                            (f) => {
                              f.comment = "";
                              return f;
                            },
                          );
                          setRejectPhotos((prev) => [...prev, ...newFiles]);
                        }
                        e.target.value = null; // reset to allow selecting the same files again
                      }}
                    />
                  </label>
                  {rejectPhotos.length > 0 && (
                    <div className="mt-4 space-y-3">
                      {rejectPhotos.map((photo, idx) => (
                        <div
                          key={idx}
                          className="rounded-lg border border-red-200 bg-white p-3 shadow-sm flex flex-col gap-2"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <img
                                src={URL.createObjectURL(photo)}
                                alt="Reject"
                                className="h-10 w-10 object-cover rounded border border-slate-200"
                              />
                              <span className="text-sm font-medium text-slate-700 truncate max-w-[150px]">
                                {photo.name}
                              </span>
                            </div>
                            <div className="flex items-center">
                              <button
                                type="button"
                                onClick={() => {
                                  setAnnotatingIndex(idx);
                                  setShowAnnotationModal(true);
                                }}
                                className="text-blue-500 hover:text-blue-700 text-sm font-semibold mr-4"
                              >
                                Annotate
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setRejectPhotos((prev) =>
                                    prev.filter((_, i) => i !== idx),
                                  )
                                }
                                className="text-red-500 hover:text-red-700 text-sm font-semibold"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                          <input
                            type="text"
                            className="w-full rounded-md border-slate-300 text-sm p-2"
                            placeholder="Optional comment..."
                            value={photo.comment}
                            onChange={(e) => {
                              const val = e.target.value;
                              setRejectPhotos((prev) => {
                                const newArr = [...prev];
                                newArr[idx].comment = val;
                                return newArr;
                              });
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {showAnnotationModal && annotatingIndex !== null && (
                  <SafetyImageAnnotationModal
                    open={showAnnotationModal}
                    file={rejectPhotos[annotatingIndex]}
                    onClose={() => {
                      setShowAnnotationModal(false);
                      setAnnotatingIndex(null);
                    }}
                    onSave={(annotatedFile) => {
                      setRejectPhotos((prev) => {
                        const newArr = [...prev];
                        newArr[annotatingIndex] = annotatedFile;
                        return newArr;
                      });
                      setShowAnnotationModal(false);
                      setAnnotatingIndex(null);
                    }}
                  />
                )}

                <div className="mt-4 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setActionType(null);
                      setRejectReason("");
                      setRejectPhotos([]);
                    }}
                    className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-red-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleReject}
                    disabled={submitting}
                    className="rounded-lg bg-red-600 px-6 py-2 text-sm font-bold text-white shadow-sm hover:bg-red-700 disabled:opacity-50"
                  >
                    {submitting ? "Rejecting..." : "Confirm Rejection"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-6">
                {detail?.status === "PENDING_CHECKER" && (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm mb-6">
                    {!isCurrentUserInternal ? (
                      <>
                        <h3 className="font-bold text-slate-700 mb-2">
                          Final Checker Assigned
                        </h3>
                        <p className="text-xs text-slate-500 mb-3">
                          This observation will be routed to the ADL Checker for
                          final approval.
                        </p>
                        <div className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700 font-medium">
                          {selectedFinalChecker
                            ? (() => {
                                const c = checkers.find(
                                  (x) =>
                                    String(x.id) ===
                                    String(selectedFinalChecker),
                                );
                                return c
                                  ? c.display_name || c.username
                                  : "Assigning...";
                              })()
                            : "Assigning..."}
                        </div>
                      </>
                    ) : (
                      <>
                        <h3 className="font-bold text-green-700 mb-2">
                          Final Approval Stage
                        </h3>
                        <p className="text-xs text-green-600 mb-1">
                          You are the Final Checker for this observation.
                        </p>
                        <p className="text-xs text-green-600">
                          Approving this will complete the observation workflow.
                        </p>
                      </>
                    )}
                  </div>
                )}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setActionType("reject")}
                    disabled={submitting}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-3.5 text-sm font-bold text-white disabled:opacity-60 hover:bg-red-600 transition-colors"
                  >
                    <XIcon className="h-5 w-5" />
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={handleApprove}
                    disabled={submitting}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3.5 text-sm font-bold text-white disabled:opacity-60 hover:bg-green-700 transition-colors"
                  >
                    <Check className="h-5 w-5" />
                    {submitting ? "Approving..." : "Approve"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {isSignatureModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md animate-in zoom-in-95 rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="mb-4 text-xl font-bold text-slate-800">
              Sign to {signatureAction === "approve" ? "Approve" : "Reject"}{" "}
              Observation
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
                  const sigData = sigPadRef.current
                    .getCanvas()
                    .toDataURL("image/png");
                  fetch(sigData)
                    .then((res) => res.blob())
                    .then((blob) => {
                      const file = new File(
                        [blob],
                        `checker-signature-${Date.now()}.png`,
                        { type: "image/png" },
                      );
                      setIsSignatureModalOpen(false);
                      confirmSubmit(file);
                    });
                }}
                className={`rounded-xl px-4 py-2 text-sm font-semibold text-white ${signatureAction === "approve" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}`}
                disabled={submitting}
              >
                {submitting
                  ? "Submitting..."
                  : signatureAction === "approve"
                    ? "Approve"
                    : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}

      <RiskMatrixModal
        open={showRiskMatrix}
        onClose={() => setShowRiskMatrix(false)}
      />

      {showFinalImageModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="flex w-full max-w-2xl animate-in zoom-in-95 flex-col overflow-hidden rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-800">
                Select Final Image
              </h3>
              <button
                onClick={() => setShowFinalImageModal(false)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <XIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="mb-6 max-h-[50vh] overflow-y-auto pr-2">
              <p className="text-sm text-slate-500 mb-6">
                Please select the final image and/or comment that best
                represents the resolved state of this observation. You must
                select at least one image or comment.
              </p>

              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                {availableFinalImages.map((img) => (
                  <div
                    key={`${img.type}-${img.id}`}
                    className="flex flex-col gap-2"
                  >
                    <div
                      onClick={() => setSelectedFinalImage(img)}
                      className={`group relative cursor-pointer overflow-hidden rounded-xl border-2 transition-all duration-200 ${
                        selectedFinalImage?.id === img.id &&
                        selectedFinalImage?.type === img.type
                          ? "border-green-500 shadow-md ring-2 ring-green-500/30 ring-offset-1"
                          : "border-slate-200 hover:border-green-300"
                      }`}
                    >
                      <div className="aspect-square bg-slate-50">
                        <img
                          src={
                            typeof img.image === "string" &&
                            img.image.startsWith("http")
                              ? img.image
                              : `/users-api${img.image}`
                          }
                          alt="Observation Photo"
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                      <div className="absolute top-2 left-2 flex gap-1">
                        {selectedFinalImage?.id === img.id &&
                          selectedFinalImage?.type === img.type && (
                            <span className="flex h-6 w-6 animate-in zoom-in items-center justify-center rounded-full bg-green-500 text-white shadow-sm">
                              <Check className="h-4 w-4 stroke-[3]" />
                            </span>
                          )}
                      </div>
                      <div className="absolute bottom-0 w-full bg-slate-900/70 px-3 py-2 backdrop-blur-sm">
                        <span className="text-xs font-semibold text-white/95">
                          {img.type === "reject"
                            ? "Rejected Photo"
                            : "Maker Photo"}
                        </span>
                      </div>
                    </div>
                    {img.comment && (
                      <label
                        className={`flex items-start gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${selectedFinalComments.includes(img.comment) ? "border-orange-400 bg-orange-50 hover:bg-orange-100/80" : "border-slate-200 bg-slate-50 hover:bg-slate-100"}`}
                      >
                        <input
                          type="checkbox"
                          className="mt-1 h-4 w-4 rounded border-slate-300 accent-orange-600 text-orange-600 focus:ring-orange-500 cursor-pointer"
                          checked={selectedFinalComments.includes(img.comment)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedFinalComments((prev) => [
                                ...prev,
                                img.comment,
                              ]);
                            } else {
                              setSelectedFinalComments((prev) =>
                                prev.filter((c) => c !== img.comment),
                              );
                            }
                          }}
                        />
                        <span
                          className="text-xs text-slate-700 line-clamp-3"
                          title={img.comment}
                        >
                          {img.comment}
                        </span>
                      </label>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => setShowFinalImageModal(false)}
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={confirmFinalImageSelection}
                disabled={
                  !selectedFinalImage && selectedFinalComments.length === 0
                }
                className="flex items-center gap-2 rounded-xl bg-green-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-green-700 disabled:opacity-50"
              >
                <Check className="h-4 w-4 stroke-[3]" />
                Confirm Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {showAnnotationModal &&
        annotatingIndex !== null &&
        rejectPhotos[annotatingIndex] && (
          <SafetyImageAnnotationModal
            file={rejectPhotos[annotatingIndex]}
            onSave={(annotatedFile) => {
              const newFiles = [...rejectPhotos];
              annotatedFile.comment =
                rejectPhotos[annotatingIndex].comment || "";
              newFiles[annotatingIndex] = annotatedFile;
              setRejectPhotos(newFiles);
              setShowAnnotationModal(false);
            }}
            onClose={() => setShowAnnotationModal(false)}
          />
        )}
    </div>
  );
}
