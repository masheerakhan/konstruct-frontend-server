import { useEffect } from "react";
import toast from "react-hot-toast";

/**
 * Universal hook for QHSE Checklist form validation UX.
 * @param {Array} fields - List of descriptors: { key, label, isValid: boolean, ref }
 */
export default function useFormValidationUX(fields) {
  useEffect(() => {
    const styleId = "qhse-form-validation-ux-style";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.innerHTML = `
        @keyframes qhseErrorFade {
          0% { 
            border-color: #ef4444; 
            box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.4); 
            background-color: #fef2f2; 
          }
          100% { 
            border-color: transparent; 
            box-shadow: none; 
            background-color: transparent; 
          }
        }
        .qhse-field-highlight-error {
          animation: qhseErrorFade 2s ease-out;
          border: 2px solid #ef4444 !important;
          border-radius: 8px;
          transition: all 0.3s ease;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  const invalidFields = fields.filter((f) => !f.isValid);
  const isFormComplete = invalidFields.length === 0;
  const missingLabels = invalidFields.map((f) => f.label);

  const handleBlockedSubmit = () => {
    if (isFormComplete) return;

    const displayLabels = missingLabels.slice(0, 3);
    let msg = `Please complete: ${displayLabels.join(", ")}`;
    if (missingLabels.length > 3) {
      msg += ` and ${missingLabels.length - 3} more`;
    }

    toast.error(msg, { id: "qhse-validation-toast" });

    const firstInvalid = invalidFields[0];
    if (firstInvalid && firstInvalid.ref && firstInvalid.ref.current) {
      const el = firstInvalid.ref.current;
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("qhse-field-highlight-error");
      setTimeout(() => {
        el.classList.remove("qhse-field-highlight-error");
      }, 2000);
    }
  };

  return {
    isFormComplete,
    missingLabels,
    handleBlockedSubmit,
  };
}
