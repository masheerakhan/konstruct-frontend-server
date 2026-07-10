import React from "react";
import { ArrowUpRight } from "lucide-react";

const BG_MAP = {
  amber: "bg-amber-100 text-amber-600",
  orange: "bg-orange-100 text-orange-600",
  purple: "bg-purple-100 text-purple-600",
  teal: "bg-teal-100 text-teal-600",
  green: "bg-green-100 text-green-600",
  red: "bg-red-100 text-red-600",
  blue: "bg-blue-100 text-blue-600",
};

const ACTIVE_MAP = {
  amber: "border-amber-400 bg-amber-50 ring-1 ring-amber-300",
  orange: "border-orange-400 bg-orange-50 ring-1 ring-orange-300",
  purple: "border-purple-400 bg-purple-50 ring-1 ring-purple-300",
  teal: "border-teal-400 bg-teal-50 ring-1 ring-teal-300",
  green: "border-green-400 bg-green-50 ring-1 ring-green-300",
  red: "border-red-400 bg-red-50 ring-1 ring-red-300",
  blue: "border-blue-400 bg-blue-50 ring-1 ring-blue-300",
};

const TEXT_MAP = {
  amber: "text-amber-700",
  orange: "text-orange-700",
  purple: "text-purple-700",
  teal: "text-teal-700",
  green: "text-green-700",
  red: "text-red-700",
  blue: "text-blue-700",
};

export default function StatCard({ icon: Icon, label, count, colorKey = "blue", active, onClick, testId, className = "", style = {} }) {
  const iconBg = BG_MAP[colorKey] || BG_MAP.blue;
  const labelColor = TEXT_MAP[colorKey] || TEXT_MAP.blue;
  const activeClasses = ACTIVE_MAP[colorKey] || ACTIVE_MAP.blue;
  
  return (
    <button 
      onClick={onClick}
      data-testid={testId}
      className={`group relative flex flex-col justify-between w-full h-full min-h-[112px] p-4 bg-white rounded-xl border border-slate-200 text-left transition-all duration-200 ease-out cursor-pointer focus:outline-none ${active ? activeClasses : 'hover:shadow-sm opacity-90 hover:opacity-100'} ${className}`}
      style={style}
    >
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 ${iconBg}`}>
        {Icon && <Icon className="w-5 h-5" />}
      </div>
      <div className="absolute top-4 right-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">
        <ArrowUpRight className="w-4 h-4" />
      </div>
      <div>
        <div className="text-3xl font-display font-bold text-slate-900 mb-1 leading-none">{count}</div>
        <div className={`text-[11px] uppercase tracking-wider font-semibold ${labelColor}`}>{label}</div>
      </div>
    </button>
  );
}
