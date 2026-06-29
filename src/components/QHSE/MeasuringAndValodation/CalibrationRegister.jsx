import { useMemo, useState } from "react";
import { Check, Eye } from "lucide-react";
import FileUploadControl from "../../FileUploadControl";
import { capitalCase } from "change-case";

const frequencyOptions = [
  { value: "3", label: "3 Months" },
  { value: "6", label: "6 Months" },
  { value: "12", label: "12 Months" },
];

export function createDefaultCalibrationCertificate(overrides = {}) {
  return {
    itemDescription: "",
    frequencyMonths: "",
    makeModel: "",
    serialNo: "",
    calibrationCertificateNo: "",
    calibrationDate: "",
    nextCalibrationDate: "",
    files: [],
    ...overrides,
  };
}

function addMonthsToDate(dateValue, months) {
  if (!dateValue || !months) return "";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) return "";

  date.setMonth(date.getMonth() + Number(months));

  return date.toISOString().slice(0, 10);
}

function getFiles(value) {
  if (!value || !Array.isArray(value.files)) return [];
  return value.files.filter((file) => file instanceof File);
}

const inputClass =
  "mt-1 h-9 w-full rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

const labelClass =
  "text-[11px] font-bold uppercase tracking-wider text-gray-500";

export default function CalibrationRegister({
  value,
  onChange,
  onPreview,
  onSubmit,
  isSubmitting = false,
}) {
  const [previewOpen, setPreviewOpen] = useState(false);

  const form = useMemo(() => {
    return {
      ...createDefaultCalibrationCertificate(),
      ...(value && typeof value === "object" ? value : {}),
    };
  }, [value]);

  const patchForm = (patch) => {
    const next = {
      ...form,
      ...patch,
    };

    if (
      Object.prototype.hasOwnProperty.call(patch, "calibrationDate") ||
      Object.prototype.hasOwnProperty.call(patch, "frequencyMonths")
    ) {
      next.nextCalibrationDate = addMonthsToDate(
        next.calibrationDate,
        next.frequencyMonths,
      );
    }

    onChange?.(next);
  };

  const handlePreviewClick = () => {
    if (onPreview) {
      onPreview();
      return;
    }

    setPreviewOpen(true);
  };

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 py-4">
          <h3 className="text-sm font-semibold text-gray-900">
            {capitalCase("calibration certificate details")}
          </h3>

          <p className="mt-1 text-xs text-gray-500">
            Fill calibration certificate details and attach certificate
            document.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <label className={labelClass}>
              {capitalCase("item description")}
            </label>

            <input
              type="text"
              value={form.itemDescription}
              onChange={(e) =>
                patchForm({
                  itemDescription: e.target.value,
                })
              }
              placeholder="Enter item description"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>{capitalCase("frequency")}</label>

            <select
              value={form.frequencyMonths}
              onChange={(e) =>
                patchForm({
                  frequencyMonths: e.target.value,
                })
              }
              className={inputClass}
            >
              <option value="">Select frequency</option>

              {frequencyOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>{capitalCase("make & model")}</label>

            <input
              type="text"
              value={form.makeModel}
              onChange={(e) =>
                patchForm({
                  makeModel: e.target.value,
                })
              }
              placeholder="Enter make & model"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>{capitalCase("serial no.")}</label>

            <input
              type="text"
              value={form.serialNo}
              onChange={(e) =>
                patchForm({
                  serialNo: e.target.value,
                })
              }
              placeholder="Enter serial no."
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>
              {capitalCase("calibration certificate no.")}
            </label>

            <input
              type="text"
              value={form.calibrationCertificateNo}
              onChange={(e) =>
                patchForm({
                  calibrationCertificateNo: e.target.value,
                })
              }
              placeholder="Enter certificate no."
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>
              {capitalCase("calibration date")}
            </label>

            <input
              type="date"
              value={form.calibrationDate}
              onChange={(e) =>
                patchForm({
                  calibrationDate: e.target.value,
                })
              }
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>
              {capitalCase("next calibration date")}
            </label>

            <input
              type="date"
              value={form.nextCalibrationDate}
              onChange={(e) =>
                patchForm({
                  nextCalibrationDate: e.target.value,
                })
              }
              className={inputClass}
            />
          </div>

          <div className="md:col-span-2 xl:col-span-3">
            <label className={labelClass}>
              {capitalCase("upload calibration certificate")}
            </label>

            <div className="mt-2 rounded-lg border border-dashed border-orange-200 bg-orange-50/30 p-4">
              <FileUploadControl
                files={getFiles(form)}
                multiple
                append={false}
                align="start"
                showFileName
                compact={false}
                uploadLabel="Upload Certificate"
                addMoreLabel="Add More"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                onFilesChange={(nextFiles) =>
                  patchForm({
                    files: Array.isArray(nextFiles) ? nextFiles : [],
                  })
                }
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap justify-end gap-3">
        <button
          type="button"
          onClick={handlePreviewClick}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          <Eye className="h-4 w-4" />
          Preview
        </button>

        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Check className="h-4 w-4" />
          {isSubmitting ? "Submitting..." : "Submit"}
        </button>
      </div>

      {previewOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <h3 className="text-base font-semibold text-gray-900">
                Calibration Certificate Preview
              </h3>

              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="rounded-md px-2 py-1 text-sm text-gray-500 hover:bg-gray-100"
              >
                Close
              </button>
            </div>

            <div className="space-y-3 p-5 text-sm">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <PreviewItem
                  label="Item Description"
                  value={form.itemDescription}
                />
                <PreviewItem
                  label="Frequency"
                  value={
                    form.frequencyMonths ? `${form.frequencyMonths} Months` : ""
                  }
                />
                <PreviewItem label="Make & Model" value={form.makeModel} />
                <PreviewItem label="Serial No." value={form.serialNo} />
                <PreviewItem
                  label="Calibration Certificate No."
                  value={form.calibrationCertificateNo}
                />
                <PreviewItem
                  label="Calibration Date"
                  value={form.calibrationDate}
                />
                <PreviewItem
                  label="Next Calibration Date"
                  value={form.nextCalibrationDate}
                />
                <PreviewItem
                  label="Uploaded Files"
                  value={
                    getFiles(form).length
                      ? `${getFiles(form).length} file(s)`
                      : ""
                  }
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PreviewItem({ label, value }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
      <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
        {label}
      </div>

      <div className="mt-1 text-sm font-medium text-gray-800">
        {value || "-"}
      </div>
    </div>
  );
}
