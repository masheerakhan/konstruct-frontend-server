import React, { useState, useEffect } from "react";
import { showToast } from "../../../../utils/toast";
import {
  getPermitTBTAttendance,
  savePermitTBTAttendance,
  downloadPermitTBTAttendanceReport,
} from "../../../../api";
import { resolveMediaUrl } from "../../../../lib/utils";
import PermitSignatureModal from "../utils/PermitSignatureModal";

const DEFAULT_TBT_SHEET = {
  topic: "",
  format_no: "",
  revision_no: "",
  issued_date: "", // Will store YYYY-MM-DD
  date_of_training: "", // Will store YYYY-MM-DD
  project_name: "",
  training_conducted_by_name: "",
  training_conducted_by_sign: "",
};

// Date helpers
const parseDDMMYYYY = (dateString) => {
  if (!dateString) return "";
  const parts = dateString.split("/");
  if (parts.length === 3) {
    const day = parts[0].padStart(2, "0");
    const month = parts[1].padStart(2, "0");
    const year = parts[2];
    if (year.length === 4) return `${year}-${month}-${day}`;
  }
  return dateString;
};

const formatToDDMMYYYY = (dateString) => {
  if (!dateString) return "";
  if (dateString.includes("/")) return dateString;
  const parts = dateString.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateString;
};

const dataUrlToFile = (dataUrl, filename) => {
  if (!dataUrl || !dataUrl.startsWith("data:")) return null;
  const arr = dataUrl.split(",");
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
};

export default function TbtAttendanceModal({
  isOpen,
  onClose,
  permit, // Pass selected permit if it exists (for editing/viewing existing)
  mode = "api", // "api" | "local" (for creation flow)
  // For local mode:
  localRows = [],
  setLocalRows = null,
  localSheet = null,
  setLocalSheet = null,
  firstQuestionId = null,
  readonly = false, // If entirely readonly
}) {
  const [sheet, setSheet] = useState(localSheet || DEFAULT_TBT_SHEET);
  const [tbtRows, setTbtRows] = useState(
    localRows?.length > 0
      ? localRows
      : [
          {
            person_name: "",
            contractor_name: "",
            designation: "",
            signature: "",
          },
        ]
  );
  
  const [loadingTbt, setLoadingTbt] = useState(false);
  const [savingTbt, setSavingTbt] = useState(false);
  const [downloadingTbt, setDownloadingTbt] = useState(false);

  const [tbtSignatureModalOpen, setTbtSignatureModalOpen] = useState(false);
  const [activeTbtSignatureIndex, setActiveTbtSignatureIndex] = useState(null); // null = sheet sig, number = row sig

  const loadTBTAttendance = async () => {
    if (!permit?.id || mode === "local") return;
    
    setLoadingTbt(true);
    try {
      const res = await getPermitTBTAttendance(permit.id);
      const data = res?.data || {};
      
      const loadedSheet = data.sheet || {};
      setSheet({
        topic: loadedSheet.topic || "",
        format_no: loadedSheet.format_no || "",
        revision_no: loadedSheet.revision_no || "",
        issued_date: parseDDMMYYYY(loadedSheet.issued_date_display || loadedSheet.issued_date_text || ""),
        date_of_training: parseDDMMYYYY(loadedSheet.date_of_training_display || loadedSheet.date_of_training || ""),
        project_name: loadedSheet.project_name || "",
        training_conducted_by_name: loadedSheet.training_conducted_by_name || "",
        training_conducted_by_sign: loadedSheet.training_conducted_by_sign_url || loadedSheet.training_conducted_by_sign || "",
      });

      const rows = data.rows || [];
      if (rows.length > 0) {
        setTbtRows(
          rows.map(r => ({
            ...r,
            signature: r.signature_url || r.signature || "",
          }))
        );
      } else {
        setTbtRows([
          {
            person_name: "",
            contractor_name: "",
            designation: "",
            signature: "",
          },
        ]);
      }
    } catch (err) {
      showToast("Failed to load TBT attendance", "error");
    } finally {
      setLoadingTbt(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (mode === "api") {
        loadTBTAttendance();
      } else {
        setSheet(localSheet || DEFAULT_TBT_SHEET);
        setTbtRows(
          localRows?.length > 0
            ? localRows
            : [
                {
                  person_name: "",
                  contractor_name: "",
                  designation: "",
                  signature: "",
                },
              ]
        );
      }
    }
  }, [isOpen, permit?.id, mode]);

  const setSheetValue = (key, value) => {
    setSheet((prev) => ({ ...prev, [key]: value }));
  };

  const updateTbtRow = (index, key, value) => {
    setTbtRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [key]: value } : row))
    );
  };

  const addTbtRow = () => {
    setTbtRows((prev) => [
      ...prev,
      { person_name: "", contractor_name: "", designation: "", signature: "" },
    ]);
  };

  const removeTbtRow = (index) => {
    setTbtRows((prev) => {
      if (prev.length === 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  };

  const buildTBTPayload = () => {
    const fd = new FormData();
    
    // Append sheet data
    const sheetData = { ...sheet };
    sheetData.issued_date = formatToDDMMYYYY(sheetData.issued_date);
    sheetData.date_of_training = formatToDDMMYYYY(sheetData.date_of_training);
    
    // Remove base64 from JSON if it's new
    if (sheetData.training_conducted_by_sign && sheetData.training_conducted_by_sign.startsWith("data:")) {
      const sigFile = dataUrlToFile(sheetData.training_conducted_by_sign, `trainer_sign_${Date.now()}.png`);
      fd.append("training_conducted_by_sign", sigFile);
      delete sheetData.training_conducted_by_sign; // don't send huge base64 in json
    } else {
      // It's a URL or empty, just clear it from json so backend doesn't overwrite with string
      delete sheetData.training_conducted_by_sign; 
    }
    
    fd.append("sheet", JSON.stringify(sheetData));

    // Append rows data
    const qid = firstQuestionId || permit?.template_snapshot?.checklist_questions?.[0]?.id || null;
    
    const rowsWithoutBase64 = tbtRows
      .filter(r => r.person_name || r.contractor_name || r.designation || r.signature)
      .map((row, index) => {
        if (row.signature && row.signature.startsWith("data:")) {
          const signatureFile = dataUrlToFile(
            row.signature,
            `tbt_signature_${index + 1}_${Date.now()}.png`
          );
          fd.append(`signature_${index}`, signatureFile);
        }
        return {
          question_id: qid,
          person_name: row.person_name,
          contractor_name: row.contractor_name,
          designation: row.designation,
        };
      });

    fd.append("rows", JSON.stringify(rowsWithoutBase64));
    return fd;
  };

  const validateTBTBeforeSave = () => {
    const hasAnyData = tbtRows.some(
      (row) =>
        String(row.person_name || "").trim() ||
        String(row.contractor_name || "").trim() ||
        String(row.designation || "").trim() ||
        row.signature
    );

    if (!hasAnyData) {
      showToast("Please add at least one attendance detail", "error");
      return false;
    }
    return true;
  };

  const handleSaveTBTAttendance = async () => {
    if (!validateTBTBeforeSave()) return;

    if (mode === "local") {
      setLocalRows?.(tbtRows);
      setLocalSheet?.(sheet);
      onClose();
      showToast("TBT attendance saved locally", "success");
      return;
    }

    if (!permit?.id) return;

    setSavingTbt(true);
    try {
      const payload = buildTBTPayload();
      await savePermitTBTAttendance(permit.id, payload);
      showToast("TBT Attendance saved successfully", "success");
      onClose();
    } catch (err) {
      showToast(
        err?.response?.data?.detail || "Failed to save TBT attendance",
        "error"
      );
    } finally {
      setSavingTbt(false);
    }
  };

  const handleDownloadTBTReport = async () => {
    if (!permit?.id) return;
    setDownloadingTbt(true);
    try {
      await downloadPermitTBTAttendanceReport(permit.id);
      showToast("TBT Attendance Report downloaded successfully", "success");
    } catch (err) {
      showToast("Failed to download TBT Report", "error");
    } finally {
      setDownloadingTbt(false);
    }
  };

  const openTbtSignatureModal = (index) => {
    setActiveTbtSignatureIndex(index);
    setTbtSignatureModalOpen(true);
  };

  const handleTbtSignatureSuccess = (signatureDataUrl) => {
    if (activeTbtSignatureIndex === null) {
      setSheetValue("training_conducted_by_sign", signatureDataUrl);
    } else {
      updateTbtRow(activeTbtSignatureIndex, "signature", signatureDataUrl);
    }
    setTbtSignatureModalOpen(false);
    setActiveTbtSignatureIndex(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4 shrink-0">
          <div className="flex-1">
            <h2 className="text-lg font-bold text-slate-900">TBT Attendance</h2>
            <p className="mt-1 text-xs text-slate-500">
              {readonly ? "Read-only attendance details." : "Add attendance details for toolbox talk."}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {permit?.id && (
              <button
                type="button"
                onClick={handleDownloadTBTReport}
                disabled={downloadingTbt}
                className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 disabled:opacity-50 flex items-center gap-2"
              >
                {downloadingTbt ? "Downloading..." : "Download TBT Report"}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-100"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-auto p-6 flex-1">
          {loadingTbt ? (
            <div className="flex justify-center p-8 text-slate-500">Loading...</div>
          ) : (
            <>
              {/* Sheet Details Section */}
              <div className="mb-6 rounded-xl border bg-slate-50 p-5">
                <h3 className="mb-4 text-sm font-bold text-slate-800 border-b pb-2">
                  TBT Header Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600">
                      Topic Discussed
                    </label>
                    <input
                      type="text"
                      disabled={readonly}
                      value={sheet.topic || ""}
                      onChange={(e) => setSheetValue("topic", e.target.value)}
                      placeholder="e.g. Height Safety"
                      className="w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:border-orange-500 disabled:opacity-70"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600">
                      Format No.
                    </label>
                    <input
                      type="text"
                      disabled={readonly}
                      value={sheet.format_no || ""}
                      onChange={(e) => setSheetValue("format_no", e.target.value)}
                      className="w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:border-orange-500 disabled:opacity-70"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600">
                      Revision No.
                    </label>
                    <input
                      type="text"
                      disabled={readonly}
                      value={sheet.revision_no || ""}
                      onChange={(e) => setSheetValue("revision_no", e.target.value)}
                      className="w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:border-orange-500 disabled:opacity-70"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600">
                      Issued Date
                    </label>
                    <input
                      type="date"
                      disabled={readonly}
                      value={sheet.issued_date || ""}
                      onChange={(e) => setSheetValue("issued_date", e.target.value)}
                      className="w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:border-orange-500 disabled:opacity-70"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600">
                      Date of Training
                    </label>
                    <input
                      type="date"
                      disabled={readonly}
                      value={sheet.date_of_training || ""}
                      onChange={(e) => setSheetValue("date_of_training", e.target.value)}
                      className="w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:border-orange-500 disabled:opacity-70"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600">
                      Project
                    </label>
                    <input
                      type="text"
                      disabled={readonly}
                      value={sheet.project_name || ""}
                      onChange={(e) => setSheetValue("project_name", e.target.value)}
                      className="w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:border-orange-500 disabled:opacity-70"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600">
                      Training Conducted by (Name)
                    </label>
                    <input
                      type="text"
                      disabled={readonly}
                      value={sheet.training_conducted_by_name || ""}
                      onChange={(e) => setSheetValue("training_conducted_by_name", e.target.value)}
                      className="w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:border-orange-500 disabled:opacity-70"
                    />
                  </div>
                  <div className="col-span-1 md:col-span-2 flex items-center gap-4">
                    <div className="flex-1">
                      <label className="mb-1 block text-xs font-semibold text-slate-600">
                        Training Conducted by (Signature)
                      </label>
                      {sheet.training_conducted_by_sign ? (
                        <img
                          src={resolveMediaUrl(sheet.training_conducted_by_sign)}
                          alt="Trainer Signature"
                          className="h-12 max-w-[150px] rounded border object-contain bg-white"
                        />
                      ) : (
                        <span className="text-xs text-slate-400">No signature</span>
                      )}
                    </div>
                    {!readonly && (
                      <button
                        type="button"
                        onClick={() => openTbtSignatureModal(null)}
                        className="mt-4 rounded-lg border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-700 hover:bg-orange-100 whitespace-nowrap"
                      >
                        {sheet.training_conducted_by_sign ? "Update Training Signature" : "Add Training Signature"}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Attendance Rows Table */}
              <h3 className="mb-3 text-sm font-bold text-slate-800">Attendance List</h3>
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="w-14 border p-2 text-center">SN.</th>
                    <th className="border p-2 text-left">Name of Person</th>
                    <th className="border p-2 text-left">Name of Contractor</th>
                    <th className="border p-2 text-left">Designation</th>
                    <th className="border p-2 text-left">Signature</th>
                    {!readonly && <th className="w-24 border p-2 text-center">Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {tbtRows.map((row, index) => (
                    <tr key={index}>
                      <td className="border p-2 text-center">{index + 1}</td>
                      <td className="border p-2">
                        <input
                          type="text"
                          disabled={readonly}
                          value={row.person_name || ""}
                          onChange={(e) => updateTbtRow(index, "person_name", e.target.value)}
                          placeholder="Name of person"
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 disabled:opacity-70 disabled:bg-transparent disabled:border-transparent"
                        />
                      </td>
                      <td className="border p-2">
                        <input
                          type="text"
                          disabled={readonly}
                          value={row.contractor_name || ""}
                          onChange={(e) => updateTbtRow(index, "contractor_name", e.target.value)}
                          placeholder="Name of contractor"
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 disabled:opacity-70 disabled:bg-transparent disabled:border-transparent"
                        />
                      </td>
                      <td className="border p-2">
                        <input
                          type="text"
                          disabled={readonly}
                          value={row.designation || ""}
                          onChange={(e) => updateTbtRow(index, "designation", e.target.value)}
                          placeholder="Designation"
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 disabled:opacity-70 disabled:bg-transparent disabled:border-transparent"
                        />
                      </td>
                      <td className="border p-2">
                        <div className="flex items-center gap-3">
                          {row.signature ? (
                            <img
                              src={resolveMediaUrl(row.signature)}
                              alt="TBT Signature"
                              className="h-10 max-w-[120px] rounded border object-contain"
                            />
                          ) : (
                            <span className="text-xs text-slate-400">No signature</span>
                          )}
                          {!readonly && (
                            <button
                              type="button"
                              onClick={() => openTbtSignatureModal(index)}
                              className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-700 hover:bg-orange-100"
                            >
                              {row.signature ? "Edit Signature" : "Add Signature"}
                            </button>
                          )}
                        </div>
                      </td>
                      {!readonly && (
                        <td className="border p-2 text-center">
                          <button
                            type="button"
                            onClick={() => removeTbtRow(index)}
                            disabled={tbtRows.length === 1}
                            className="rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs font-semibold text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            Remove
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                  {readonly && tbtRows.length === 0 && (
                    <tr>
                      <td colSpan="5" className="border p-4 text-center text-slate-500">
                        No TBT attendance added.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              {!readonly && (
                <button
                  type="button"
                  onClick={addTbtRow}
                  className="mt-4 rounded-lg border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-100"
                >
                  + Add Row
                </button>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t px-6 py-4 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={savingTbt}
            className="rounded-lg border px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            {readonly ? "Close" : "Cancel"}
          </button>
          {!readonly && (
            <button
              type="button"
              onClick={handleSaveTBTAttendance}
              disabled={savingTbt || loadingTbt}
              className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
            >
              {savingTbt ? "Saving..." : "Save Attendance"}
            </button>
          )}
        </div>
      </div>

      <PermitSignatureModal
        isOpen={tbtSignatureModalOpen}
        onClose={() => {
          setTbtSignatureModalOpen(false);
          setActiveTbtSignatureIndex(null);
        }}
        onSuccess={handleTbtSignatureSuccess}
      />
    </div>
  );
}
