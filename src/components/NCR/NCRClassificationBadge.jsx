import React from "react";

export default function NCRClassificationBadge({ classification }) {
  const isMajor = classification === "major";
  return (
    <span
      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
        isMajor ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"
      }`}
      data-testid={`classification-badge-${classification}`}
    >
      {classification}
    </span>
  );
}
