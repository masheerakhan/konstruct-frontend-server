import { Package, Layers } from "lucide-react";
import { capitalCase } from "../../stringCase";

export default function MaterialTypeSelector({ selected, onSelect, showTitle = true }) {
  const options = [
    {
      value: "single",
      label: "Single Material",
      desc: "Individual product submission",
      icon: <Package className="w-5 h-5" />,
    },
    {
      value: "full_system",
      label: "Full System with All Accessories",
      desc: "Complete system / assembly",
      icon: <Layers className="w-5 h-5" />,
    },
  ];

  return (
    <div>
      {showTitle && (
        <h2 className="text-[10px] uppercase tracking-wider font-bold text-gray-500 mb-4">
          {capitalCase("material submittal type")}
        </h2>
      )}
      <div className="grid grid-cols-2 gap-4">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onSelect(opt.value)}
            className={`flex items-start gap-3 p-4 rounded-sm border transition-colors duration-150 text-left ${
              selected === opt.value
                ? "border-primary bg-orange-50"
                : "border-gray-200 bg-white hover:border-gray-300"
            }`}
          >
            <div className={`mt-0.5 ${selected === opt.value ? "text-primary" : "text-gray-500"}`}>{opt.icon}</div>
            <div>
              <div className={`text-sm font-semibold ${selected === opt.value ? "text-primary" : "text-foreground"}`}>
                {capitalCase(opt.label)}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                {capitalCase(opt.desc.split(" / ")[0])}
                {opt.desc.includes(" / ") ? ` / ${capitalCase(opt.desc.split(" / ").slice(1).join(" / "))}` : ""}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
