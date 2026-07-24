import React, { useState } from "react";
import { ArrowLeft, ImageIcon, Ban } from "lucide-react";
import PermitHeaderMeta from "./PermitHeaderMeta";
import { showToast } from "../../../../utils/toast";
import TbtAttendanceModal from "../PermitDashboard/TbtAttendanceModal";
import { downloadPermitReport } from "../../../../api";
import { resolveMediaUrl } from "../../../../lib/utils";
import { canShowPermitReportDownload } from "./permitHelpers";

const renderFieldValue = (val) => {
  if (val === null || val === undefined || val === "") return "N/A";
  if (Array.isArray(val)) {
    return val
      .map((item) => (typeof item === "object" ? renderFieldValue(item) : String(item)))
      .join(", ");
  }
  if (typeof val === "object") {
    const parts = Object.entries(val)
      .filter(([_, v]) => v !== null && v !== undefined && v !== "")
      .map(([k, v]) => (typeof v === "object" ? `${k}: ${JSON.stringify(v)}` : String(v)));
    return parts.length > 0 ? parts.join(" - ") : "N/A";
  }
  return String(val);
};

const getQuestionImages = (permit, questionId) => {
  return (permit?.checklist_images || []).filter(
    (img) => String(img.question_id) === String(questionId),
  );
};

const getImageUrl = (img) => resolveMediaUrl(img?.file_url || img?.file || "");

const getSignatureUrl = (sig) =>
  resolveMediaUrl(sig?.signature_url || sig?.signature || "");

const getAllActionSignatures = (permit) => {
  const logs = permit?.workflow_logs || [];

  return logs.flatMap((log) =>
    (log.signatures || []).map((sig) => ({
      ...sig,
      log_action: log.action,
      log_status_from: log.status_from,
      log_status_to: log.status_to,
      log_performed_at: log.performed_at || log.created_at,
      log_actor_name: log.performed_by_name,
      log_actor_group_name: log.actor_group_name,
    })),
  );
};

const findSignatureForBox = (permit, box) => {
  const signatures = getAllActionSignatures(permit);

  return signatures.find((sig) => {
    if (box.key && sig.signature_box_key === box.key) return true;

    return (
      sig.action === box.action &&
      String(sig.actor_group_id || "") === String(box.signing_group_id || "") &&
      String(sig.log_status_from || "") === String(box.required_status || "")
    );
  });
};

export default function PermitReadonlyView({
  permit,
  userType = "maker", // "maker" | "checker"
  onBack,
  titlePrefix = "View Permit",
}) {
  const signatureBoxes = permit?.template_snapshot?.signature_boxes || [];

  const [tbtViewModalOpen, setTbtViewModalOpen] = useState(false);
  const [downloadingReport, setDownloadingReport] = useState(false);

  const openTbtViewModal = () => {
    if (!permit?.id) {
      showToast("Permit not found", "error");
      return;
    }
    setTbtViewModalOpen(true);
  };

  const handleDownloadReport = async () => {
    if (!permit?.id) return;
    setDownloadingReport(true);
    try {
      await downloadPermitReport(permit.id);
      showToast("Report downloaded successfully", "success");
    } catch (err) {
      const message =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        "Failed to download report";
      showToast(message, "error");
    } finally {
      setDownloadingReport(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <button
        onClick={onBack}
        className="mb-4 inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </button>

      <div className="mb-6 rounded-xl border bg-card p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-foreground sm:text-xl">
            {titlePrefix} -{" "}
            {permit.template_snapshot?.template_name ||
              permit.template_name ||
              `Permit #${permit.id}`}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Current Status:{" "}
            <span className="font-semibold text-orange-600">
              {permit.workflow_summary?.current_status || permit.current_status}
            </span>
          </p>
        </div>
        
        {canShowPermitReportDownload(permit) && (
          <button
            type="button"
            onClick={handleDownloadReport}
            disabled={downloadingReport}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 disabled:opacity-50"
          >
            {downloadingReport ? "Downloading..." : "Download Permit Report"}
          </button>
        )}
      </div>

      <PermitHeaderMeta
        headerConfig={permit.template_snapshot?.header_config}
        formatNo={permit.template_snapshot?.format_no}
        refNo={permit.template_snapshot?.ref_no}
        issuedDateText={permit.template_snapshot?.issued_date_text}
        revisionNo={permit.template_snapshot?.revision_no}
        projectId={permit.project_id}
        permitId={permit.id}
      />

      <div className="rounded-xl border bg-white p-6 shadow-sm">
        {permit?.template_snapshot?.field_definitions?.length > 0 && (
          <div className="mb-6 border-b pb-6">
            <h3 className="mb-4 text-lg font-semibold text-slate-800">
              Permit Details
            </h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {permit.template_snapshot.field_definitions.map((field) => {
                const value = permit.form_data?.[field.key];

                return (
                  <div
                    key={field.key}
                    className="rounded-lg border bg-slate-50 p-3"
                  >
                    <p className="text-xs font-medium text-slate-500">
                      {field.label}
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-900">
                      {renderFieldValue(value)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {permit?.template_snapshot?.special_sections?.length > 0 && (
          <div className="mb-6 border-b pb-6">
            {permit.template_snapshot.special_sections.map((section) => (
              <div key={section.key} className="mb-6 last:mb-0">
                <h3 className="mb-4 text-lg font-semibold text-slate-800">
                  {section.title}
                </h3>

                {section.type === "row_table" ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-slate-300 text-sm">
                      <thead>
                        <tr className="bg-slate-100">
                          <th className="w-12 border border-slate-300 p-2 text-left">
                            S.No
                          </th>
                          {section.columns?.map((col) => (
                            <th
                              key={col.key}
                              className="border border-slate-300 p-2 text-left"
                            >
                              {col.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {section.rows?.map((row, idx) => (
                          <tr key={row.key}>
                            <td className="border border-slate-300 p-2">
                              {idx + 1}
                            </td>
                            {section.columns?.map((col) => {
                              const val =
                                permit.form_data?.[section.key]?.rows?.[
                                  row.key
                                ]?.[col.key] ??
                                row[col.key] ??
                                "";

                              return (
                                <td
                                  key={col.key}
                                  className="border border-slate-300 p-2 text-slate-800"
                                >
                                  {val || "-"}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : section.type === "table" ? (
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    {section.fields?.map((f) => {
                      const val =
                        permit.form_data?.[section.key]?.[f.key] ?? "";
                      return (
                        <div
                          key={f.key}
                          className="rounded-lg border bg-slate-50 p-3"
                        >
                          <p className="text-xs font-medium text-slate-500">
                            {f.label}
                          </p>
                          <p className="mt-1 text-sm font-medium text-slate-900">
                            {val || "N/A"}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}

        {permit?.template_snapshot?.checklist_questions?.length > 0 && (
          <div className="mb-6 border-b pb-6">
            <h3 className="mb-4 text-lg font-semibold text-slate-800">
              Checklist Answers
            </h3>

            <div className="space-y-4">
              {permit.template_snapshot.checklist_questions.map((q, index) => {
                const response = permit.checklist_response?.find(
                  (r) => String(r.question_id) === String(q.id),
                );
                const images = getQuestionImages(permit, q.id);
                const answer = response?.answer || "No answer";

                return (
                  <div
                    key={q.id}
                    className="rounded-xl border bg-card p-5 shadow-sm"
                  >
                    <div className="mb-3 flex items-start gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white">
                        {index + 1}
                      </span>

                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm font-semibold text-slate-800">
                            {q.question}
                          </p>
                          {index === 0 && (
                            <button
                              type="button"
                              onClick={openTbtViewModal}
                              className="shrink-0 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-100"
                            >
                              TBT Attendance
                            </button>
                          )}
                        </div>

                        <p className="mt-2 text-sm text-slate-600">
                          Answer:{" "}
                          <span className="font-semibold text-slate-900">
                            {answer}
                          </span>
                        </p>

                        {response?.remarks && (
                          <p className="mt-1 text-sm text-slate-600">
                            Remark: {response.remarks}
                          </p>
                        )}

                        {images.length > 0 && (
                          <div className="mt-4">
                            <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-slate-500">
                              <ImageIcon className="h-3.5 w-3.5" />
                              Uploaded Images
                            </p>

                            <div className="flex flex-wrap gap-3">
                              {images.map((img) => {
                                const url = getImageUrl(img);
                                if (!url) return null;

                                return (
                                  <a
                                    key={img.id}
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block h-20 w-20 overflow-hidden rounded-lg border bg-white shadow-sm"
                                  >
                                    <img
                                      src={url}
                                      alt="Permit checklist"
                                      className="h-full w-full object-cover"
                                    />
                                  </a>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div>
          <h3 className="mb-4 text-lg font-semibold text-slate-800">
            Signatures
          </h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {signatureBoxes.map((box) => {
              const signature = findSignatureForBox(permit, box);
              const signatureUrl = signature ? getSignatureUrl(signature) : "";
              const signerType =
                box?.layout_config?.signer_type || box?.signer_type || "group";

              const actorDisplayName =
                signature?.actor_name ||
                signature?.log_actor_name ||
                (signerType === "creator"
                  ? permit?.form_data?.permit_applicant || permit?.created_by_name
                  : box.signing_group_name) ||
                "Unknown";

              const signedTimestamp =
                signature?.log_performed_at || signature?.created_at;

              return (
                <div
                  key={box.key}
                  className={`rounded-xl border p-4 ${
                    signature
                      ? "bg-white"
                      : "cursor-not-allowed bg-slate-100 opacity-70"
                  }`}
                  title={!signature ? "Signature not provided yet" : ""}
                >
                  <div className="mb-3">
                    <p className="text-sm font-semibold text-slate-800">
                      {box.label}
                    </p>
                    <p className="text-xs text-slate-500">
                      {signerType === "creator"
                        ? "Permit Creator / Maker"
                        : box.signing_group_name || "User Group"}
                    </p>
                  </div>

                  {signature && signatureUrl ? (
                    <>
                      <div className="flex h-28 items-center justify-center rounded-lg border bg-slate-50 p-2">
                        <img
                          src={signatureUrl}
                          alt={box.label}
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>

                      <p className="mt-2 text-xs text-slate-500">
                        Signed by {actorDisplayName}{" "}
                        {signedTimestamp
                          ? `on ${new Date(signedTimestamp).toLocaleString()}`
                          : ""}
                      </p>
                    </>
                  ) : (
                    <div className="flex h-28 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-slate-400">
                      <div className="text-center">
                        <Ban className="mx-auto mb-1 h-5 w-5" />
                        <p className="text-xs font-medium">Signature Pending</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {signatureBoxes.length === 0 && (
              <p className="text-sm text-slate-500">
                No signature boxes configured.
              </p>
            )}
          </div>
        </div>
      </div>

      <TbtAttendanceModal
        isOpen={tbtViewModalOpen}
        onClose={() => setTbtViewModalOpen(false)}
        permit={permit}
        mode="api"
        readonly={false}
      />
    </div>
  );
}
