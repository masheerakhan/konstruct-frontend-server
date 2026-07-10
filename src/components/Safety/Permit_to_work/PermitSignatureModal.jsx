import React, { useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { XIcon } from "lucide-react";
import { toast } from "react-hot-toast";

const PermitSignatureModal = ({ isOpen, onClose, onSignatureSuccess, actionTitle = "Submit Action" }) => {
  const sigCanvasRef = useRef(null);
  const [signatureSubmitting, setSignatureSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!sigCanvasRef.current || sigCanvasRef.current.isEmpty()) {
      toast.error("Please provide your signature.");
      return;
    }

    const dataUrl = sigCanvasRef.current.toDataURL("image/png");
    const base64Part = dataUrl.split(",")[1] || "";

    if (!base64Part) {
      toast.error("Could not capture signature. Try again.");
      return;
    }

    setSignatureSubmitting(true);

    try {
      // Just pass the signature back to the caller instead of an API
      onSignatureSuccess(dataUrl);
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to submit signature.");
    } finally {
      setSignatureSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white p-5 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900">
            Provide Signature for {actionTitle}
          </h3>
          <button
            type="button"
            onClick={onClose}
            disabled={signatureSubmitting}
            className="rounded p-1 text-gray-500 hover:bg-gray-100 disabled:opacity-50"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>
        <p className="mb-3 text-sm text-gray-500">
          Draw your signature below and submit to complete this action.
        </p>
        <div className="rounded-lg border border-gray-200 bg-white p-2">
          <SignatureCanvas
            ref={sigCanvasRef}
            penColor="black"
            canvasProps={{
              width: 600,
              height: 200,
              className: "border border-dashed border-gray-300 rounded-lg w-full bg-gray-50",
            }}
          />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => sigCanvasRef.current?.clear()}
            disabled={signatureSubmitting}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={signatureSubmitting}
            className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-60"
          >
            {signatureSubmitting ? "Submitting..." : `Confirm ${actionTitle}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PermitSignatureModal;
