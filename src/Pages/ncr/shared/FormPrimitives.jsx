import React from "react";

export function Section({ title, step, children }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 bg-slate-50 border-b border-slate-200">
        <div className="w-8 h-8 rounded-md bg-blue-600 text-white font-display font-bold text-sm flex items-center justify-center">
          {step}
        </div>
        <div className="text-sm font-semibold text-slate-900 font-display">{title}</div>
      </div>
      <div className="p-6 space-y-6">{children}</div>
    </div>
  );
}

export function Field({ label, required, testId, children, className = "" }) {
  return (
    <div className={className} data-testid={testId}>
      <label className={`text-sm font-medium leading-none block mb-2 ${required ? "flex items-center gap-1" : ""}`}>
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

export function ReadOnlyField({ label, testId, children, className = "" }) {
  return (
    <div className={className} data-testid={testId}>
      <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
        {label}
      </label>
      <div className="text-sm text-slate-800 whitespace-pre-line leading-relaxed">
        {children || <span className="text-slate-400 italic">Not provided</span>}
      </div>
    </div>
  );
}

export function NumberedTextArea({ name, value, onChange, placeholder, required, rows = 3, className = "", testId }) {
  const textareaRef = React.useRef(null);

  const onValChange = (e) => {
    let val = e.target.value;
    if (val.length === 1 && value === "") val = "1. " + val;
    onChange({ target: { name, value: val } });
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const el = textareaRef.current;
      if (!el) return;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const val = el.value;
      const textBefore = val.substring(0, start);
      const textAfter = val.substring(end);
      const lines = textBefore.split("\n");
      const nextNum = lines.length + 1;
      const insertText = `\n${nextNum}. `;
      const newValue = textBefore + insertText + textAfter;
      onChange({ target: { name, value: newValue } });
      setTimeout(() => {
        if (el) el.selectionStart = el.selectionEnd = start + insertText.length;
      }, 0);
    }
  };

  return (
    <textarea
      ref={textareaRef}
      rows={rows}
      name={name}
      value={value}
      onChange={onValChange}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      className={`flex min-h-[60px] w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      required={required}
      data-testid={testId}
    />
  );
}
