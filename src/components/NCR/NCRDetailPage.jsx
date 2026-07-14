import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Clock, Download, Loader2, PenTool, CheckCircle2, ArrowLeft } from "lucide-react";
import { downloadNCRClosedReport, getNCRDetail, projectHeadSignNCR } from "../../services/ncrService";
import toast from "react-hot-toast";
import AttachmentGallery from "./AttachmentGallery";
import PermitSignatureModal from "../Safety/Permit_to_work/utils/PermitSignatureModal";
import NCRStatusBadge from "./NCRStatusBadge";
import NCRClassificationBadge from "./NCRClassificationBadge";
import { Section, ReadOnlyField } from "../../Pages/ncr/shared/FormPrimitives";
import {resolveMediaUrl} from "../../lib/utils";

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-GB");
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB");
}

function isMobileDevice() {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function getAccessTokenForDownload() {
  return (
    localStorage.getItem("ACCESS_TOKEN") ||
    localStorage.getItem("access") ||
    localStorage.getItem("accessToken") ||
    ""
  );
}

function getChecklistServiceBaseUrl() {
  const isLocal =
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname === "localhost";

  return isLocal
    ? "http://127.0.0.1:8001"
    : "https://konstruct.world/checklists";
}

function safePdfFileName(name = "report") {
  return (
    String(name || "report")
      .trim()
      .replace(/[^\w.-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "report"
  );
}

function sendDownloadToNative({ url, fileName, token }) {
  const payload = JSON.stringify({
    url,
    fileName,
    token,
    mimeType: "application/pdf",
  });

  if (window.flutter_inappwebview?.callHandler) {
    window.flutter_inappwebview.callHandler("downloadFile", payload);
    return true;
  }

  if (window.DownloadChannel?.postMessage) {
    window.DownloadChannel.postMessage(payload);
    return true;
  }

  return false;
}

function normalizeAttachment(att, fallbackType = "attachment") {
  const fileUrl = resolveMediaUrl(
    att?.file_url || att?.file || att?.image || att?.url || att?.attachment
  );

  if (!fileUrl) return null;

  return {
    id: att?.id || `${fallbackType}-${fileUrl}`,
    file_url: fileUrl,
    attachment_type: att?.attachment_type || att?.type || fallbackType,
  };
}

function SignaturePreview({ label, path }) {
  const url = resolveMediaUrl(path);

  if (!url) {
    return <p className="text-sm text-slate-400 italic">No signature available</p>;
  }

  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
        {label}
      </label>
      <a href={url} target="_blank" rel="noreferrer">
        <img
          src={url}
          alt={label}
          className="h-24 rounded-lg border border-slate-200 bg-white p-2 object-contain"
        />
      </a>
    </div>
  );
}

function LogsSection({ logs }) {
  if (!logs?.length) return null;

  return (
    <Section title="I. Workflow Logs" step="I">
      <div className="space-y-3">
        {logs.map((log, index) => (
          <div
            key={log?.id || `${log?.created_at || ""}-${index}`}
            className="rounded-lg border border-slate-200 p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm font-semibold text-slate-900">
                {log?.action || log?.event || log?.status || "Workflow update"}
              </div>
              <div className="text-xs text-slate-500">
                {formatDateTime(log?.created_at || log?.timestamp)}
              </div>
            </div>
            <div className="mt-2 text-sm text-slate-600 whitespace-pre-line">
              {log?.remarks || log?.comment || log?.description || "-"}
            </div>
            {(log?.actor_name || log?.user_name || log?.performed_by_name) && (
              <div className="mt-2 text-xs text-slate-500">
                By: {log?.actor_name || log?.user_name || log?.performed_by_name}
              </div>
            )}
          </div>
        ))}
      </div>
    </Section>
  );
}

export default function NCRDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ncr, setNcr] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [submittingSignature, setSubmittingSignature] = useState(false);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError(null);

    getNCRDetail(id)
      .then((res) => {
        const payload = res?.data?.data || res?.data || res;
        if (!cancelled) setNcr(payload);
      })
      .catch((err) => {
        console.error("Failed to load NCR detail", err);
        if (!cancelled) {
          setError("Failed to load this NCR.");
          toast.error("Failed to load this NCR.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const checkerAttachments = useMemo(
    () =>
      (ncr?.attachments || [])
        .filter((a) =>
          ["identification", "root_cause", "corrective_action", "preventive_action"].includes(
            a?.attachment_type
          )
        )
        .map((a) => normalizeAttachment(a, a?.attachment_type))
        .filter(Boolean),
    [ncr]
  );

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-4 md:p-8">
        <div className="flex items-center gap-3 text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading NCR details...</span>
        </div>
      </div>
    );
  }

  if (error || !ncr) {
    return (
      <div className="max-w-5xl mx-auto p-4 md:p-8 text-center py-16">
        <p className="text-slate-500">{error || "NCR not found."}</p>
        <button
          onClick={() => navigate("/NCR")}
          className="mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          Back to NCR list
        </button>
      </div>
    );
  }

  const handleDownloadReport = async () => {
    if (!ncr?.id || ncr?.status !== "closed") return;

    try {
      setDownloading(true);

      const reportUrl = `${getChecklistServiceBaseUrl()}/api/ncr/${ncr.id}/download-report/`;
      const nativeHandled = sendDownloadToNative({
        url: reportUrl,
        fileName: `${safePdfFileName(ncr.ncr_no || `ncr-${ncr.id}`)}.pdf`,
        token: getAccessTokenForDownload(),
      });

      if (nativeHandled) {
        toast.success("Downloading closed NCR report...");
        return;
      }

      const res = await downloadNCRClosedReport(ncr.id);
      
      // We need to trigger the browser download with the blob data
      // using the existing helper from api/index
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `${safePdfFileName(ncr.ncr_no || `ncr-${ncr.id}`)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => window.URL.revokeObjectURL(url), 5000);
      
      toast.success("Closed NCR report downloaded.");
    } catch (err) {
      console.error("Failed to download closed NCR report", err);
      toast.error(err?.message || "Failed to download NCR report.");
    } finally {
      setDownloading(false);
    }
  };

  const handleProjectHeadSign = async (signatureDataUrl) => {
    if (!ncr?.id) return;
    try {
      setSubmittingSignature(true);
      // Data URL needs to be converted to File object for multipart/form-data
      const res = await fetch(signatureDataUrl);
      const blob = await res.blob();
      const file = new File([blob], "project_head_signature.png", { type: "image/png" });

      const formData = new FormData();
      formData.append("signature", file);

      const resp = await projectHeadSignNCR(ncr.id, formData);
      setNcr(resp?.data || resp);
      toast.success("Successfully signed NCR.");
      setIsSignModalOpen(false);
    } catch (err) {
      console.error("Failed to sign NCR", err);
      toast.error(err?.response?.data?.detail || "Failed to sign NCR");
    } finally {
      setSubmittingSignature(false);
    }
  };

  const isProjectHeadPending = ncr?.project_head_approval?.status === "pending";

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6">
      <div>
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-slate-500 hover:text-slate-900 inline-flex items-center gap-1 mb-2"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-3xl font-display font-bold tracking-tight text-slate-900">
            {ncr.ncr_no || `NCR #${id}`}
          </h1>
          <NCRStatusBadge status={ncr.status} />
          <NCRClassificationBadge classification={ncr.classification} />
        </div>
        <p className="text-sm text-slate-500 mt-1">
          Review the full NCR record, maker responses, and verification history.
        </p>
        {ncr.status === "closed" && (
          <div className="mt-4">
            <button
              onClick={handleDownloadReport}
              disabled={downloading}
              className="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed h-10 px-5 py-2 shadow"
            >
              {downloading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Download Closed Report
            </button>
          </div>
        )}
      </div>

      {ncr.status === "maker_submitted" && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-blue-700">
                Maker response submitted. Ready for checker verification.
              </p>
              <p className="text-sm text-blue-600 mt-1">
                Review the maker submission and proceed to verification.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate(`/ncr/${id}/verify`)}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 h-10 px-5 py-2 shadow"
          >
            Verify NCR
          </button>
        </div>
      )}

      {(ncr.status === "assigned_to_maker" || ncr.status === "resubmission_required") && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
          <Clock className="w-5 h-5 text-amber-600 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-700">Waiting for maker response</p>
            <p className="text-sm text-amber-600 mt-1">
              This NCR is currently awaiting maker action for round {ncr.current_round || 1}.
            </p>
          </div>
        </div>
      )}

      {ncr.status === "closed" && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-green-700">This NCR has been closed.</p>
          <p className="text-sm text-green-600 mt-1">
            Verification is complete and the NCR is now read-only.
          </p>
        </div>
      )}

      {isProjectHeadPending && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3">
            <PenTool className="w-5 h-5 text-purple-600 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-purple-700">
                Pending Project Head Signature
              </p>
              <p className="text-sm text-purple-600 mt-1">
                This NCR requires your formal approval for the report.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsSignModalOpen(true)}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-purple-600 text-white hover:bg-purple-700 h-10 px-5 py-2 shadow"
          >
            Sign as Project Head
          </button>
        </div>
      )}

      <Section title="A. Basic Information" step="A">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ReadOnlyField label="Doc No">{ncr.doc_no}</ReadOnlyField>
          <ReadOnlyField label="NCR No">{ncr.ncr_no}</ReadOnlyField>
          <ReadOnlyField label="Project">{ncr.project_name}</ReadOnlyField>
          <ReadOnlyField label="Tower">{ncr.tower_name}</ReadOnlyField>
          <ReadOnlyField label="Location Text">{ncr.location_text}</ReadOnlyField>
          <ReadOnlyField label="Full Location">{ncr.full_location}</ReadOnlyField>
          <ReadOnlyField label="Non-Conformity Related To">
            {ncr.non_conformity_related_to}
          </ReadOnlyField>
          <ReadOnlyField label="Raised By">{ncr.raised_by_name}</ReadOnlyField>
          <ReadOnlyField label="Raised At">{formatDateTime(ncr.raised_at)}</ReadOnlyField>
          <ReadOnlyField label="Current Round">{ncr.current_round}</ReadOnlyField>
          <ReadOnlyField label="Identification of Non-Conformance" className="md:col-span-2">
            {ncr.identification_of_non_conformance}
          </ReadOnlyField>
        </div>
      </Section>

      <Section title="B. Root Cause Analysis" step="B">
        <ReadOnlyField label="Root Cause Analysis">{ncr.root_cause_analysis}</ReadOnlyField>
      </Section>

      <Section title="C. Correction / Action Required" step="C">
        <ReadOnlyField label="Correction">{ncr.correction}</ReadOnlyField>
        <ReadOnlyField label="Corrective Action">{ncr.corrective_action}</ReadOnlyField>
        <ReadOnlyField label="Preventive Action">{ncr.preventive_action}</ReadOnlyField>
      </Section>

      <Section title="D. Responsibility & Timeline" step="D">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ReadOnlyField label="Follow-up Responsibility">
            {ncr.follow_up_responsibility}
          </ReadOnlyField>
          <ReadOnlyField label="Verification Responsibility">
            {ncr.verification_responsibility}
          </ReadOnlyField>
          <ReadOnlyField label="Target Date of Compliance">
            {formatDate(ncr.target_date_of_compliance)}
          </ReadOnlyField>
          <ReadOnlyField label="Status">{ncr.status}</ReadOnlyField>
        </div>
      </Section>

      <Section title="E. Checker Attachments" step="E">
        <AttachmentGallery
          attachments={checkerAttachments}
          emptyLabel="No checker reference attachments available"
        />
      </Section>

      <Section title="F. Maker Responses" step="F">
        {(ncr?.maker_responses || []).length === 0 ? (
          <p className="text-sm text-slate-400 italic">No maker responses submitted yet.</p>
        ) : (
          <div className="space-y-4">
            {(ncr?.maker_responses || []).map((response, index) => {
              const attachments = (response?.attachments || response?.images || [])
                .map((att) => normalizeAttachment(att, "maker_response"))
                .filter(Boolean);

              return (
                <div
                  key={response?.id || `${response?.round_no || ""}-${index}`}
                  className="rounded-xl border border-slate-200 p-4 space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900">
                      Round {response?.round_no || "-"}
                    </p>
                    <p className="text-xs text-slate-500">
                      Submitted: {formatDateTime(response?.submitted_at || response?.created_at)}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ReadOnlyField label="Maker Name">
                      {response?.assignment?.maker_name || response?.maker_name}
                    </ReadOnlyField>
                    <ReadOnlyField label="Corrective Action Taken">
                      {response?.corrective_action_taken}
                    </ReadOnlyField>
                    <ReadOnlyField label="Preventive Action Taken" className="md:col-span-2">
                      {response?.preventive_action_taken}
                    </ReadOnlyField>
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                      Maker Attachments
                    </label>
                    <AttachmentGallery
                      attachments={attachments}
                      emptyLabel="No maker attachments"
                    />
                  </div>
                  <SignaturePreview
                    label="Maker Signature"
                    path={response?.maker_signature || response?.maker_signature_url}
                  />
                </div>
              );
            })}
          </div>
        )}
      </Section>

      <Section title="G. Checker Verifications" step="G">
        {(ncr?.verifications || []).length === 0 ? (
          <p className="text-sm text-slate-400 italic">No checker verifications available yet.</p>
        ) : (
          <div className="space-y-4">
            {(ncr?.verifications || []).map((verification, index) => {
              const attachments = (verification?.attachments || verification?.verification_images || [])
                .map((att) => normalizeAttachment(att, "verification"))
                .filter(Boolean);

              return (
                <div
                  key={verification?.id || `${verification?.round_no || ""}-${index}`}
                  className="rounded-xl border border-slate-200 p-4 space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900">
                      Round {verification?.round_no || "-"}
                    </p>
                    <p className="text-xs text-slate-500">
                      Verified: {formatDateTime(verification?.verified_at || verification?.created_at)}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ReadOnlyField label="Result">{verification?.result}</ReadOnlyField>
                    <ReadOnlyField label="Verified By">
                      {verification?.verified_by_name || verification?.checker_name}
                    </ReadOnlyField>
                    <ReadOnlyField
                      label="Verification Status of Remedial / Corrective / Preventive Action"
                      className="md:col-span-2"
                    >
                      {verification?.verification_status_of_remedial}
                    </ReadOnlyField>
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                      Verification Attachments
                    </label>
                    <AttachmentGallery
                      attachments={attachments}
                      emptyLabel="No verification attachments"
                    />
                  </div>
                  <SignaturePreview
                    label="Checker Signature"
                    path={verification?.checker_signature || verification?.checker_signature_url}
                  />
                </div>
              );
            })}
          </div>
        )}
      </Section>

      <LogsSection logs={ncr?.workflow_logs || ncr?.logs || []} />

      <PermitSignatureModal
        isOpen={isSignModalOpen}
        onClose={() => setIsSignModalOpen(false)}
        onSignatureSuccess={handleProjectHeadSign}
        actionTitle="NCR Approval"
      />
    </div>
  );
}
