import { capitalCase } from "./stringCase";

const labelCls = "text-xs font-semibold text-gray-500 uppercase tracking-wide";
const inputCls =
  "mt-1 w-full rounded-sm border border-gray-200 bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary";
const textareaCls =
  "mt-1 min-h-[80px] w-full rounded-md border border-gray-200 bg-white resize-y px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary";

export default function ProductBrandSelector({
  materialRefNo,
  areaOfApplication,
  specReference,
  materialDescription,
  materialRemarks,
  onAreaChange,
  onSpecChange,
  onMaterialDescriptionChange,
  onMaterialRemarksChange,
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-[12px] uppercase tracking-wider font-bold text-gray-500 mb-4">
        {capitalCase("submittal details")}
      </h2>

      <div>
        <div className="mb-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
              {capitalCase("document")}/{capitalCase("mas no")}:
            </span>
            <span className="bg-orange-50 text-primary font-mono text-xs px-2 py-0.5 rounded-sm">
              {materialRefNo || "—"}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>{capitalCase("area of application")}</label>
          <input
            className={inputCls}
            value={areaOfApplication}
            onChange={(e) => onAreaChange(e.target.value)}
            placeholder="e.g., Block E, F and Associated Infra Works"
          />
        </div>
        <div>
          <label className={labelCls}>
            {capitalCase("specification")} / {capitalCase("is code reference")}
          </label>
          <input
            className={inputCls}
            value={specReference}
            onChange={(e) => onSpecChange(e.target.value)}
            placeholder="e.g., IS 1786:2008"
          />
        </div>
      </div>

      <div>
        <label className={labelCls}>{capitalCase("description of material submission")}</label>
        <textarea
          className={textareaCls}
          value={materialDescription}
          onChange={(e) => onMaterialDescriptionChange(e.target.value)}
          placeholder="Enter decription for submittal details"
          rows={3}
        />
      </div>

      <div>
        <label className={labelCls}>{capitalCase("remarks")}</label>
        <textarea
          className={textareaCls}
          value={materialRemarks}
          onChange={(e) => onMaterialRemarksChange(e.target.value)}
          placeholder="Enter remarks (will appear in transmittal table)"
          rows={3}
        />
      </div>
    </div>
  );
}
