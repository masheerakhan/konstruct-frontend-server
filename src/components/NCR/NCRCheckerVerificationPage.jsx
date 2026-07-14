import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { getNCRDetail, checkerVerifyNCR } from "../../services/ncrService";
import PermitSignatureModal from "../Safety/Permit_to_work/utils/PermitSignatureModal";
import FileUpload from "../FileUpload";
import AttachmentGallery from "./AttachmentGallery";
import NCRStatusBadge from "./NCRStatusBadge";
import NCRClassificationBadge from "./NCRClassificationBadge";
import { Section, Field, ReadOnlyField, NumberedTextArea } from "../../Pages/ncr/shared/FormPrimitives";

function resolveMediaUrl(path) {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;

  const base =
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname === "localhost"
      ? "http://127.0.0.1:8001"
      : "https://konstruct.world";

  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
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

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-GB");
}

function dataUrlToFile(dataUrl, filename) {
  const [meta, base64] = dataUrl.split(",");
  const mime = meta.match(/:(.*?);/)?.[1] || "image/png";
  const bstr = atob(base64);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  return new File([u8arr], filename, { type: mime });
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

export default function NCRCheckerVerificationPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ncr, setNcr] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [verificationText, setVerificationText] = useState("");
  const [verificationImages, setVerificationImages] = useState([]);
  const [showSigModal, setShowSigModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pendingResult, setPendingResult] = useState("");

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
        if (!cancelled) setError("Failed to load this NCR.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const canVerify = ncr?.status === "maker_submitted";

  const currentRoundResponses = useMemo(
    () =>
      (ncr?.maker_responses || []).filter(
        (r) => Number(r?.round_no) === Number(ncr?.current_round)
      ),
    [ncr]
  );

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

  const handleVerifyClick = (result) => {
    if (!verificationText.trim()) {
      toast.error("Please enter verification status of remedial / corrective / preventive action.");
      return;
    }

    setPendingResult(result);
    setShowSigModal(true);
  };

  const handleSignatureSuccess = async (dataUrl) => {
    await submitVerification(pendingResult, dataUrl);
  };

  const submitVerification = async (result, signatureDataUrl) => {
    if (!result) {
      toast.error("Please select Accept or Reject.");
      return;
    }

    if (!signatureDataUrl) {
      toast.error("Signature is required.");
      return;
    }

    setSaving(true);

    try {
      const fd = new FormData();

      fd.append("result", result);
      fd.append("verification_status_of_remedial", verificationText);
      fd.append(
        "checker_signature",
        dataUrlToFile(signatureDataUrl, "checker_verification_signature.png")
      );

      verificationImages.forEach((item) => {
        if (item?.file) {
          fd.append("verification_images", item.file);
        }
      });

      const res = await checkerVerifyNCR(id, fd);
      const updatedNcr = res?.data?.data || res?.data || res;

      toast.success(
        result === "closed"
          ? "NCR accepted and closed successfully."
          : "NCR rejected and sent back to maker."
      );

      setShowSigModal(false);

      if (result === "closed") {
        navigate(`/ncr/${updatedNcr?.id || id}`);
      } else {
        navigate("/NCR");
      }
    } catch (err) {
      console.error("Failed to verify NCR", err);
      toast.error(
        err?.response?.data?.detail ||
          err?.response?.data?.non_field_errors?.[0] ||
          "Failed to submit verification."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-4 md:p-8">
        <div className="flex items-center gap-3 text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading NCR for verification...</span>
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

  if (!canVerify) {
    return (
      <div className="max-w-5xl mx-auto p-4 md:p-8">
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-slate-500 hover:text-slate-900 inline-flex items-center gap-1 mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center space-y-3">
          <AlertTriangle className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-slate-600 font-medium">
            This NCR is not awaiting checker verification.
          </p>
          <p className="text-sm text-slate-400">
            Current status: <NCRStatusBadge status={ncr.status} />
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => navigate(`/ncr/${id}`)}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              View NCR detail
            </button>
            <button
              onClick={() => navigate("/NCR")}
              className="text-slate-500 hover:text-slate-700 text-sm font-medium"
            >
              Back to NCR list
            </button>
          </div>
        </div>
      </div>
    );
  }

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
          Review the maker submission and complete checker verification.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
        <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-blue-700">
            Maker response submitted. Please review and verify.
          </p>
          <p className="text-sm text-blue-600 mt-1">
            Signature is mandatory. Verification photos are optional.
          </p>
        </div>
      </div>

      <Section title="A. Original NCR Details" step="A">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ReadOnlyField label="Doc No">{ncr.doc_no}</ReadOnlyField>
          <ReadOnlyField label="NCR No">{ncr.ncr_no}</ReadOnlyField>
          <ReadOnlyField label="Project">{ncr.project_name}</ReadOnlyField>
          <ReadOnlyField label="Tower">{ncr.tower_name}</ReadOnlyField>
          <ReadOnlyField label="Location">{ncr.full_location || ncr.location_text}</ReadOnlyField>
          <ReadOnlyField label="Non-Conformity Related To">
            {ncr.non_conformity_related_to}
          </ReadOnlyField>
          <ReadOnlyField label="Raised By">{ncr.raised_by_name}</ReadOnlyField>
          <ReadOnlyField label="Raised At">{formatDateTime(ncr.raised_at)}</ReadOnlyField>
          <ReadOnlyField label="Identification of Non-Conformance" className="md:col-span-2">
            {ncr.identification_of_non_conformance}
          </ReadOnlyField>
        </div>
      </Section>

      <Section title="B. Root Cause / Correction / Action Required" step="B">
        <ReadOnlyField label="Root Cause Analysis">{ncr.root_cause_analysis}</ReadOnlyField>
        <ReadOnlyField label="Correction">{ncr.correction}</ReadOnlyField>
        <ReadOnlyField label="Corrective Action">{ncr.corrective_action}</ReadOnlyField>
        <ReadOnlyField label="Preventive Action">{ncr.preventive_action}</ReadOnlyField>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
            Checker Reference Attachments
          </label>
          <AttachmentGallery
            attachments={checkerAttachments}
            emptyLabel="No checker reference attachments available"
          />
        </div>
      </Section>

      <Section title="C. Maker Submitted Response" step="C">
        {currentRoundResponses.length === 0 ? (
          <p className="text-sm text-slate-400 italic">No maker responses found for the current round.</p>
        ) : (
          <div className="space-y-4">
            {currentRoundResponses.map((response, index) => {
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
                      Round {response?.round_no || ncr.current_round || "-"}
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

      <Section title="D. Checker Verification" step="D">
        <Field
          label="Verification status of Remedial / Corrective / Preventive action"
          required
          testId="checker-field-verification-text"
        >
          <NumberedTextArea
            rows={5}
            name="verification_status_of_remedial"
            value={verificationText}
            onChange={(e) => setVerificationText(e.target.value)}
            placeholder="Enter your verification review"
            required
            testId="checker-input-verification-text"
          />
        </Field>
        <Field label="Verification Photos / Attachments" testId="checker-field-verification-images">
          <FileUpload
            value={verificationImages}
            onChange={setVerificationImages}
            testId="checker-verification-upload"
          />
          <p className="mt-1 text-xs text-slate-400">
            Optional. Upload supporting verification photos if available.
          </p>
        </Field>
        <div className="flex flex-wrap justify-end items-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => handleVerifyClick("rejected")}
            disabled={saving}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 h-10 px-5 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving && pendingResult === "rejected" ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <XCircle className="w-4 h-4 mr-2" />
            )}
            Reject NCR
          </button>
          <button
            type="button"
            onClick={() => handleVerifyClick("closed")}
            disabled={saving}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 h-10 px-5 py-2 shadow disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving && pendingResult === "closed" ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4 mr-2" />
            )}
            Accept & Close NCR
          </button>
        </div>
      </Section>

      <PermitSignatureModal
        isOpen={showSigModal}
        onClose={() => {
          if (!saving) setShowSigModal(false);
        }}
        onSignatureSuccess={handleSignatureSuccess}
        actionTitle={pendingResult === "closed" ? "Accept & Close NCR" : "Reject NCR"}
      />
    </div>
  );
}
