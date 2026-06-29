import { documentTypes } from "./approvedVendors";
import { capitalCase, capitalCaseLabel } from "./stringCase";

export default function DocTypeSelector({
  selected,
  onSelect,
  showTitle = true,
}) {
  return (
    <div className="w-full">
      {showTitle && (
        <h2 className="text-[10px] uppercase tracking-wider font-bold text-gray-500 mb-4">
          {capitalCase("type of document")}
        </h2>
      )}
      <div className="w-full">
        <select
          value={selected}
          onChange={(e) => onSelect(e.target.value)}
          className="w-full h-9 text-xs rounded-sm border border-gray-200 bg-white px-3 py-1 focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">{capitalCase("select document type")}</option>
          {documentTypes.map((type) => (
            <option key={type} value={type}>
              {capitalCaseLabel(type)}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
