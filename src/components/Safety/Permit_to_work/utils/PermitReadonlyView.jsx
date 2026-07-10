import React, { useState } from "react";
import { ArrowLeft, ImageIcon, Ban } from "lucide-react";
import PermitHeaderMeta from "./PermitHeaderMeta";
import { getPermitTbtAttendance } from "../../../../api";
import { resolveMediaUrl } from "../../../../lib/utils";
import { showToast } from "../../../../utils/toast";

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
  const [tbtViewRows, setTbtViewRows] = useState([]);

  const openTbtViewModal = async () => {
    if (!permit?.id) {
      showToast("Permit not found", "error");
      return;
    }

    try {
      const res = await getPermitTbtAttendance(permit.id);
      const rows = Array.isArray(res?.data)
        ? res.data
        : res?.data?.results || [];

      setTbtViewRows(rows);
      setTbtViewModalOpen(true);
    } catch (err) {
      showToast("Failed to load TBT attendance", "error");
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

      <div className="mb-6 rounded-xl border bg-card p-5 shadow-sm">
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
                      {Array.isArray(value)
                        ? value.join(", ")
                        : typeof value === "object" && value !== null
                          ? Object.values(value).filter(Boolean).join(" - ") ||
                            "N/A"
                          : value || "N/A"}
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
                        Signed by{" "}
                        {signature.actor_name ||
                          signature.log_actor_name ||
                          "Unknown"}{" "}
                        {signature.log_performed_at
                          ? `on ${new Date(
                              signature.log_performed_at,
                            ).toLocaleString()}`
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

      {tbtViewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  TBT Attendance
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Read-only attendance details submitted by maker.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setTbtViewModalOpen(false)}
                className="rounded-lg px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="max-h-[65vh] overflow-auto p-6">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="w-14 border p-2 text-center">SN.</th>
                    <th className="border p-2 text-left">Name of Person</th>
                    <th className="border p-2 text-left">Name of Contractor</th>
                    <th className="border p-2 text-left">Designation</th>
                    <th className="border p-2 text-left">Signature</th>
                  </tr>
                </thead>
                <tbody>
                  {tbtViewRows.length > 0 ? (
                    tbtViewRows.map((row, index) => (
                      <tr key={row.id || index}>
                        <td className="border p-2 text-center">
                          {row.sn || index + 1}
                        </td>
                        <td className="border p-2">{row.person_name || "-"}</td>
                        <td className="border p-2">
                          {row.contractor_name || "-"}
                        </td>
                        <td className="border p-2">{row.designation || "-"}</td>
                        <td className="border p-2">
                          {row.signature_url || row.signature ? (
                            <img
                              src={resolveMediaUrl(
                                row.signature_url || row.signature,
                              )}
                              alt="TBT Signature"
                              className="h-10 max-w-[120px] rounded border object-contain"
                            />
                          ) : (
                            "-"
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="5"
                        className="border p-4 text-center text-slate-500"
                      >
                        No TBT attendance added.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end border-t px-6 py-4">
              <button
                type="button"
                onClick={() => setTbtViewModalOpen(false)}
                className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
