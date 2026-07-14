import React from "react";

export default function ReadOnlyField({ label, testId, value, children, className = "" }) {
    return (
        <div className={className} data-testid={testId}>
            <label className="text-sm font-medium leading-none text-slate-500 block mb-1">
                {label}
            </label>
            <div className="text-slate-900 text-sm font-medium whitespace-pre-line">
                {children || value || "—"}
            </div>
        </div>
    );
}
