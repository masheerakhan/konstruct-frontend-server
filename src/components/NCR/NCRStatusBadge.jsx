import React from "react";
import { NCR_STATUSES } from "../../constants/ncrStatus";

const COLOR_MAP = {
  amber: "bg-amber-100 text-amber-800",
  orange: "bg-orange-100 text-orange-800",
  purple: "bg-purple-100 text-purple-800",
  teal: "bg-teal-100 text-teal-800",
  green: "bg-green-100 text-green-800",
  red: "bg-red-100 text-red-800",
};

export default function NCRStatusBadge({ status }) {
  const config = NCR_STATUSES.find(s => s.key === status) || { label: status, color: "gray" };
  const colorClass = COLOR_MAP[config.color] || "bg-gray-100 text-gray-800";
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
      {config.label}
    </span>
  );
}
