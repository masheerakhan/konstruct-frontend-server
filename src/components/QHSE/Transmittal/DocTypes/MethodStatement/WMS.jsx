import { useRef, useState } from "react";
import { FileCheck, Plus, Trash2, Upload, HelpCircle, X } from "lucide-react";
import { capitalCase } from "../../stringCase";
import {
  WMS_REFERENCE_TYPE_OPTIONS,
  createWmsReferenceRow,
  getWmsReferenceRowFiles,
  createDefaultWmsConstructionSequence,
  getWmsConstructionBlockFiles,
  createDefaultWmsAnnexures,
  getWmsAnnexureFiles,
} from "../../approvedVendors";

const selectCls =
  "h-9 min-w-[140px] text-xs rounded-md border border-gray-200 bg-white px-2 py-1 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary";
const inputCls =
  "h-9 w-full text-xs rounded-md border border-gray-200 bg-white px-2 py-1 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary";

const cardCls = "rounded-xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm space-y-3";

const CONSTRUCTION_BLOCKS = [
  { key: "preInstall", label: "Pre Installation Activities" },
  { key: "during", label: "During Application / Installation" },
  { key: "post", label: "Post Application / Installation" },
];

const WMS_ANNEXURE_ROWS = [
  {
    key: "annexure1",
    label: "Annexure 1 - Drawing",
    hint: "User upload PDF or image",
    accept: ".pdf,.jpg,.jpeg,.png",
  },
  {
    key: "annexure2",
    label: "Annexure 2 - ITP",
    hint: "User upload Excel",
    accept: ".xlsx,.xls,.csv",
  },
  {
    key: "annexure3",
    label: "Annexure 3 - Checklist",
    hint: "User upload Excel file",
    accept: ".xlsx,.xls,.csv",
  },
  {
    key: "annexure4",
    label: "Annexure 4 - HIRA",
    hint: "User upload Excel file",
    accept: ".xlsx,.xls,.csv",
  },
];


// 🔹 Reusable File List Component
function FileListView({ files, onRemove }) {
  if (!files || files.length === 0) return null;
  return (
    <ul className="mt-2 space-y-1.5 w-full">
      {files.map((file, idx) => (
        <li key={idx} className="flex items-center justify-between gap-2 rounded bg-white px-2.5 py-1.5 border border-gray-200 shadow-sm">
          <a
            href={URL.createObjectURL(file)}
            target="_blank"
            rel="noreferrer"
            className="text-[11.5px] font-medium text-primary hover:underline truncate min-w-0"
            title={file.name}
          >
            {file.name}
          </a>
          <button
            type="button"
            onClick={() => onRemove(idx)}
            className="text-gray-400 hover:text-red-500 transition-colors shrink-0"
            title="Delete file"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </li>
      ))}
    </ul>
  );
}

// 🔹 Bullet Textarea Component
export function BulletTextarea({
  value = "",
  onChange,
  placeholder,
  rows = 8,
  className = "",
}) {
  const BULLET = "• ";

  const handleKeyDown = (e) => {
    const textarea = e.target;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    // Enter => add next bullet
    if (e.key === "Enter") {
      e.preventDefault();

      // if empty, start first bullet
      if (value === "") {
        onChange(BULLET);
        requestAnimationFrame(() => {
          textarea.selectionStart = textarea.selectionEnd = BULLET.length;
        });
        return;
      }

      const before = value.slice(0, start);
      const after = value.slice(end);

      const newValue = `${before}\n${BULLET}${after}`;
      onChange(newValue);

      requestAnimationFrame(() => {
        const pos = start + 3;
        textarea.selectionStart = textarea.selectionEnd = pos;
      });
    }
  };

  const handleChange = (e) => {
    let newValue = e.target.value;

    // allow fully empty
    if (newValue === "") {
      onChange("");
      return;
    }

    // when user starts typing in empty field, prepend first bullet
    if (value === "" && newValue.trim() !== "" && !newValue.startsWith(BULLET)) {
      newValue = BULLET + newValue;
    }

    onChange(newValue);
  };

  return (
    <textarea
      className={className}
      value={value}
      onKeyDown={handleKeyDown}
      onChange={handleChange}
      rows={rows}
      placeholder={placeholder}
    />
  );
}

// 🔹 Numbered Textarea Component
export function NumberedTextarea({
  value = "",
  onChange,
  placeholder,
  rows = 3,
  className = "",
}) {
  const getNextNumber = (text, cursorPos) => {
    const lines = text.slice(0, cursorPos).split('\n');
    let lastNumber = 0;
    for (let i = lines.length - 1; i >= 0; i--) {
      const match = lines[i].match(/^\s*(\d+)\./);
      if (match) {
        lastNumber = parseInt(match[1], 10);
        break;
      }
    }
    return lastNumber + 1;
  };

  const handleKeyDown = (e) => {
    const textarea = e.target;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    if (e.key === "Enter") {
      e.preventDefault();

      if (value === "") {
        onChange("1. ");
        requestAnimationFrame(() => {
          textarea.selectionStart = textarea.selectionEnd = 3;
        });
        return;
      }

      const before = value.slice(0, start);
      const after = value.slice(end);
      const nextNum = getNextNumber(value, start);
      const insert = `${nextNum}. `;

      const newValue = `${before}\n${insert}${after}`;
      onChange(newValue);

      requestAnimationFrame(() => {
        const pos = start + 1 + insert.length;
        textarea.selectionStart = textarea.selectionEnd = pos;
      });
    }
  };

  const handleChange = (e) => {
    let newValue = e.target.value;

    if (newValue === "") {
      onChange("");
      return;
    }

    if (value === "" && newValue.trim() !== "" && !/^\s*\d+\./.test(newValue)) {
      newValue = "1. " + newValue;
    }

    onChange(newValue);
  };

  return (
    <textarea
      className={className}
      value={value}
      onKeyDown={handleKeyDown}
      onChange={handleChange}
      rows={rows}
      placeholder={placeholder}
    />
  );
}

/**
 * @param {{
 *   scopeObjective: string,
 *   onScopeObjectiveChange: (v: string) => void,
 *   references: Array<{ id: string, refType: string, sectionClass: string, files?: File[] }>,
 *   onReferencesChange?: (next: unknown[] | ((prev: unknown[]) => unknown[])) => void,
 *   constructionSequence?: { preInstall: { text: string, files?: File[] }, during: {...}, post: {...} },
 *   onConstructionSequenceChange?: (next: unknown | ((prev: unknown) => unknown)) => void,
 *   annexures?: { annexure1: { files?: File[] }, annexure2: {...}, annexure3: {...}, annexure4: {...} },
 *   onAnnexuresChange?: (next: unknown | ((prev: unknown) => unknown)) => void,
 * }} props
 */
export default function WMS({
  scopeObjective = "",
  onScopeObjectiveChange,
  references = [],
  onReferencesChange,
  constructionSequence,
  onConstructionSequenceChange,
  annexures,
  onAnnexuresChange,
}) {
  const [showHIRAGuidance, setShowHIRAGuidance] = useState(false);
  const fileInputRefs = useRef({});
  const constructionFileRefs = useRef({});
  const annexureFileRefs = useRef({});

  const setRefs = (next) => {
    onReferencesChange?.(next);
  };

  const patchRef = (id, patch) => {
    setRefs((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const handleFiles = (id, picked) => {
    const list = Array.from(picked || []).filter((f) => f instanceof File);
    patchRef(id, { files: list.length ? list : [] });
  };

  const addCard = () => {
    setRefs((prev) => [...prev, createWmsReferenceRow()]);
  };

  const removeCard = (id) => {
    setRefs((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((r) => r.id !== id);
    });
  };

  const list = Array.isArray(references) ? references : [];

  const seqDefault = createDefaultWmsConstructionSequence();
  const cs = constructionSequence && typeof constructionSequence === "object" ? constructionSequence : {};
  const seq = {
    preInstall: { ...seqDefault.preInstall, ...(cs.preInstall || {}) },
    during: { ...seqDefault.during, ...(cs.during || {}) },
    post: { ...seqDefault.post, ...(cs.post || {}) },
  };

  const patchConstructionBlock = (blockKey, patch) => {
    onConstructionSequenceChange?.((prev) => {
      const p = prev && typeof prev === "object" ? prev : createDefaultWmsConstructionSequence();
      return {
        ...p,
        [blockKey]: { ...(p[blockKey] || seqDefault[blockKey]), ...patch },
      };
    });
  };

  const handleConstructionFiles = (blockKey, picked) => {
    const list = Array.from(picked || []).filter((f) => f instanceof File);
    patchConstructionBlock(blockKey, { files: list.length ? list : [] });
  };

  const annexDefault = createDefaultWmsAnnexures();
  const wa = annexures && typeof annexures === "object" ? annexures : {};
  const annexureState = {
    annexure1: { ...annexDefault.annexure1, ...(wa.annexure1 || {}) },
    annexure2: { ...annexDefault.annexure2, ...(wa.annexure2 || {}) },
    annexure3: { ...annexDefault.annexure3, ...(wa.annexure3 || {}) },
    annexure4: { ...annexDefault.annexure4, ...(wa.annexure4 || {}) },
  };

  const patchAnnexure = (annexKey, patch) => {
    onAnnexuresChange?.((prev) => {
      const p = prev && typeof prev === "object" ? prev : createDefaultWmsAnnexures();
      return {
        ...p,
        [annexKey]: { ...(p[annexKey] || annexDefault[annexKey]), ...patch },
      };
    });
  };

  const handleAnnexureFiles = (annexKey, picked) => {
    const list = Array.from(picked || []).filter((f) => f instanceof File);
    patchAnnexure(annexKey, { files: list.length ? list : [] });
  };

  return (
    <div>
      <div className="space-y-8">
        <section>
        <h3 className="text-[11px] uppercase tracking-wider font-bold text-gray-500 pb-2">
          1. {capitalCase("scope and objective")}
        </h3>
        <label className="sr-only" htmlFor="wms-scope-objective">
          {capitalCase("scope and objective")}
        </label>
        <textarea
          id="wms-scope-objective"
          className="min-h-[140px] w-full rounded-lg border border-gray-200 bg-white resize-y px-3 py-2 text-sm text-gray-900 leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          value={scopeObjective}
          onChange={(e) => onScopeObjectiveChange?.(e.target.value)}
          placeholder={capitalCase("describe the scope and objectives of this method statement")}
          rows={6}
        />
        </section>

        <section>
        <h3 className="text-[11px] uppercase tracking-wider font-bold text-gray-500 pb-2">
          2. {capitalCase("references")}
        </h3>

        <div className="flex flex-wrap items-center gap-2 mt-2 mb-4">
          <button
            type="button"
            onClick={addCard}
            className="inline-flex items-center gap-1.5 rounded-md border border-primary/35 bg-orange-50 px-3 py-1.5 text-[11px] font-semibold text-primary hover:bg-orange-100/70 transition-colors"
          >
            <Plus className="w-3.5 h-3.5 shrink-0" />
            {capitalCase("add reference")}
          </button>
          <span className="text-[10px] text-gray-500">
            {capitalCase("add one card per specification, BOQ, or other reference")}
          </span>
        </div>

        <ul className="space-y-3 list-none p-0 m-0">
          {list.map((row, index) => {
            const files = getWmsReferenceRowFiles(row);
            const n = files.length;
            return (
              <li key={row.id}>
                <div className="rounded-lg border border-gray-200 bg-gray-50/80 p-4 shadow-sm">
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
                      {capitalCase("reference")} {index + 1}
                    </span>
                    {list.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => removeCard(row.id)}
                        className="inline-flex items-center gap-1 rounded px-2 py-1 text-[10px] font-medium text-red-600 hover:bg-red-50"
                        title={capitalCase("remove this reference")}
                      >
                        <Trash2 className="w-3 h-3" />
                        {capitalCase("remove")}
                      </button>
                    ) : null}
                  </div>

                  <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:flex-wrap">
                    <div className="shrink-0 w-full lg:w-[160px]">
                      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                        {capitalCase("type")}
                      </label>
                      <select
                        className={selectCls + " w-full"}
                        value={row.refType || "boq"}
                        onChange={(e) => patchRef(row.id, { refType: e.target.value })}
                      >
                        {WMS_REFERENCE_TYPE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="w-full sm:max-w-[220px] lg:max-w-[240px] shrink-0">
                      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                        {capitalCase("section")} / {capitalCase("class")}
                      </label>
                      <input
                        type="text"
                        className={inputCls}
                        value={row.sectionClass ?? ""}
                        onChange={(e) => patchRef(row.id, { sectionClass: e.target.value })}
                        placeholder={capitalCase("e.g. Vol. II, Sec. 3.2")}
                      />
                    </div>

                    <div className="flex min-w-0 flex-1 justify-start lg:justify-end lg:ml-auto">
                      <div className="flex flex-col items-stretch gap-1 sm:items-end sm:w-auto">
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 lg:text-right">
                          {capitalCase("attachment")}
                        </span>
                        <button
                          type="button"
                          onClick={() => fileInputRefs.current[row.id]?.click()}
                          className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap text-[11px] font-semibold px-3 py-2 rounded-md border transition-colors border-primary/30 bg-white text-primary hover:bg-orange-50"
                        >
                          <Upload className="w-3.5 h-3.5 shrink-0" />
                          {capitalCase("upload")}
                        </button>
                        <FileListView 
                          files={files} 
                          onRemove={(idx) => {
                            const newFiles = [...files];
                            newFiles.splice(idx, 1);
                            patchRef(row.id, { files: newFiles });
                          }}
                        />
                        <input
                          ref={(el) => {
                            fileInputRefs.current[row.id] = el;
                          }}
                          type="file"
                          multiple
                          className="hidden"
                          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xlsx,.xls"
                          onChange={(e) => {
                            handleFiles(row.id, e.target.files);
                            e.target.value = "";
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        </section>

        <section>
        <h3 className="text-[11px] uppercase tracking-wider font-bold text-gray-500 pb-2">
          3. {capitalCase("construction sequence")}
        </h3>

        <div className="space-y-5">
          {CONSTRUCTION_BLOCKS.map(({ key, label }) => {
            const block = seq[key];
            const cfiles = getWmsConstructionBlockFiles(block);
            const cn = cfiles.length;
            const inputId = `wms-construction-${key}`;
            return (
              <div key={key} className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <label
                    htmlFor={inputId}
                    className="text-[11px] font-semibold text-gray-700 min-w-0 pr-2 leading-snug"
                  >
                    {label}
                  </label>
                  <button
                    type="button"
                    onClick={() => constructionFileRefs.current[key]?.click()}
                    className="inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap text-[11px] font-semibold px-3 py-1.5 rounded-md border transition-colors border-primary/30 bg-orange-50 text-primary hover:bg-orange-100/70"
                  >
                    <Upload className="w-3.5 h-3.5 shrink-0" />
                    {capitalCase("upload")}
                  </button>
                </div>
                <FileListView 
                  files={cfiles} 
                  onRemove={(idx) => {
                    const newFiles = [...cfiles];
                    newFiles.splice(idx, 1);
                    patchConstructionBlock(key, { files: newFiles });
                  }} 
                />
                <input
                  ref={(el) => {
                    constructionFileRefs.current[key] = el;
                  }}
                  type="file"
                  multiple
                  className="hidden"
                  aria-hidden
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xlsx,.xls"
                  onChange={(e) => {
                    handleConstructionFiles(key, e.target.files);
                    e.target.value = "";
                  }}
                />
                <BulletTextarea
                  value={block.text ?? ""}
                  onChange={(v) => patchConstructionBlock(key, { text: v })}
                  rows={8}
                  className="min-h-[160px] w-full rounded-lg border border-gray-200 bg-white resize-y px-3 py-2 text-sm text-gray-900 leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  placeholder={`• Enter Point 1\n• Enter Point 2\n• Enter Point 3`}
                />
              </div>
            );
          })}
        </div>
        </section>

        <section>
        <h3 className="text-[11px] uppercase tracking-wider font-bold text-gray-500 pb-2">
          4. {capitalCase("annexure")}
        </h3>

        <div className="space-y-3">
          {WMS_ANNEXURE_ROWS.map((row) => {
            const files = getWmsAnnexureFiles(annexureState[row.key]);
            const n = files.length;
            const isITP = row.key === "annexure2";
            const manualITP = annexureState[row.key]?.manualITP || [];
            const showManual = annexureState[row.key]?.showManualITP || false;

            const isHIRA = row.key === "annexure4";
            const manualHIRA = annexureState[row.key]?.manualHIRA || [];
            const showManualHIRA = annexureState[row.key]?.showManualHIRA || false;

            return (
              <div key={row.key} className="rounded-md border border-gray-200 bg-gray-50/70 px-3 py-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-semibold text-gray-700">{row.label}</div>
                    <div className="text-[10px] text-gray-500">{row.hint}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isHIRA && (
                      <button
                        type="button"
                        onClick={() => setShowHIRAGuidance(true)}
                        className={`inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap text-[11px] font-semibold px-3 py-1.5 rounded-md border transition-colors border-primary/35 bg-orange-50 text-primary hover:bg-orange-100/70`}
                      >
                        <HelpCircle className="w-3.5 h-3.5 shrink-0" />
                        Guidance
                      </button>
                    )}
                    {(isITP || isHIRA) && (
                      <button
                        type="button"
                        onClick={() => {
                          if (isITP) {
                            const isShowing = !showManual;
                            const updates = { showManualITP: isShowing };
                            if (isShowing && manualITP.length === 0) {
                              updates.manualITP = [{ id: Math.random().toString(36).slice(2), stages: "", criteria: "", controlPoint: "Witness" }];
                            }
                            patchAnnexure(row.key, updates);
                          } else if (isHIRA) {
                            const isShowing = !showManualHIRA;
                            const updates = { showManualHIRA: isShowing };
                            if (isShowing && manualHIRA.length === 0) {
                              updates.manualHIRA = [{
                                id: Math.random().toString(36).slice(2),
                                subActivity: "",
                                hazards: "",
                                risk: "",
                                initialSeverity: 1,
                                initialLikelihood: 1,
                                controlMeasures: "",
                                finalLikelihood: 1
                              }];
                            }
                            patchAnnexure(row.key, updates);
                          }
                        }}
                        className={`inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap text-[11px] font-semibold px-3 py-1.5 rounded-md border transition-colors ${
                          (isITP ? showManual : showManualHIRA) 
                          ? "border-emerald-500/40 bg-emerald-50 text-emerald-700 hover:bg-emerald-100/60"
                          : "border-primary/30 bg-white text-primary hover:bg-orange-50"
                        }`}
                      >
                        Manual Entry
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => annexureFileRefs.current[row.key]?.click()}
                      className="inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap text-[11px] font-semibold px-3 py-1.5 rounded-md border transition-colors border-primary/30 bg-white text-primary hover:bg-orange-50"
                    >
                      <Upload className="w-3.5 h-3.5 shrink-0" />
                      {capitalCase("upload")}
                    </button>
                  </div>
                </div>
                <FileListView 
                  files={files} 
                  onRemove={(idx) => {
                    const newFiles = [...files];
                    newFiles.splice(idx, 1);
                    patchAnnexure(row.key, { files: newFiles });
                  }} 
                />

                {isITP && showManual && (
                  <div className="mt-4 border-t border-gray-200 pt-3">
                    <div className="overflow-x-auto rounded border border-gray-200">
                      <table className="w-full text-left text-[11px]">
                        <thead className="bg-gray-100/80 text-gray-600">
                          <tr>
                            <th className="px-2 py-1.5 font-semibold w-12 text-center border-b border-gray-200">Sl No.</th>
                            <th className="px-2 py-1.5 font-semibold w-[25%] border-b border-gray-200 border-l">Stages</th>
                            <th className="px-2 py-1.5 font-semibold w-[45%] border-b border-gray-200 border-l">Acceptance Criteria</th>
                            <th className="px-2 py-1.5 font-semibold w-32 border-b border-gray-200 border-l">Control Point</th>
                            <th className="px-2 py-1.5 font-semibold w-10 text-center border-b border-gray-200 border-l"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {manualITP.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="p-4 text-center text-gray-500 italic">No rows added yet. Click "+ Add Row" to begin.</td>
                            </tr>
                          ) : (
                            manualITP.map((itpRow, idx) => (
                              <tr key={itpRow.id} className="border-b border-gray-100 last:border-0 bg-white">
                                <td className="px-2 py-1.5 text-center font-medium text-gray-500 bg-gray-50/50">{idx + 1}</td>
                                <td className="px-1 py-1 border-l border-gray-100">
                                  <textarea
                                    className="w-full resize-y rounded border border-transparent hover:border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary px-2 py-1 outline-none text-[11px] min-h-[40px] bg-transparent"
                                    value={itpRow.stages || ""}
                                    onChange={(e) => {
                                      const arr = [...manualITP];
                                      arr[idx] = { ...arr[idx], stages: e.target.value };
                                      patchAnnexure(row.key, { manualITP: arr });
                                    }}
                                    placeholder="Enter stage..."
                                  />
                                </td>
                                <td className="px-1 py-1 border-l border-gray-100">
                                  <NumberedTextarea
                                    className="w-full resize-y rounded border border-transparent hover:border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary px-2 py-1 outline-none text-[11px] min-h-[40px] bg-transparent"
                                    value={itpRow.criteria || ""}
                                    onChange={(newValue) => {
                                      const arr = [...manualITP];
                                      arr[idx] = { ...arr[idx], criteria: newValue };
                                      patchAnnexure(row.key, { manualITP: arr });
                                    }}
                                    placeholder="1.&#10;2.&#10;3."
                                  />
                                </td>
                                <td className="px-1 py-1 border-l border-gray-100">
                                  <select
                                    className="w-full rounded border border-transparent hover:border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary px-1 py-1.5 outline-none text-[11px] bg-transparent"
                                    value={itpRow.controlPoint || "Witness"}
                                    onChange={(e) => {
                                      const arr = [...manualITP];
                                      arr[idx] = { ...arr[idx], controlPoint: e.target.value };
                                      patchAnnexure(row.key, { manualITP: arr });
                                    }}
                                  >
                                    <option value="Hold Point">Hold Point</option>
                                    <option value="Witness">Witness</option>
                                    <option value="Surveillance">Surveillance</option>
                                    <option value="Test">Test</option>
                                    <option value="Review">Review</option>
                                  </select>
                                </td>
                                <td className="px-2 py-1.5 text-center border-l border-gray-100 bg-gray-50/50">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const arr = [...manualITP];
                                      arr.splice(idx, 1);
                                      patchAnnexure(row.key, { manualITP: arr });
                                    }}
                                    className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded hover:bg-red-50"
                                    title="Delete row"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 mx-auto" />
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        patchAnnexure(row.key, { 
                          manualITP: [
                            ...manualITP, 
                            { id: Math.random().toString(36).slice(2), stages: "", criteria: "", controlPoint: "Witness" }
                          ]
                        });
                      }}
                      className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-semibold text-primary hover:text-orange-600 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Row
                    </button>
                  </div>
                )}

                {isHIRA && showManualHIRA && (
                  <div className="mt-4 border-t border-gray-200 pt-3">
                    <div className="overflow-x-auto rounded border border-gray-200">
                      <table className="w-full text-left text-[11px] min-w-[1200px]">
                        <thead className="bg-gray-100/80 text-gray-600">
                          <tr>
                            <th rowSpan={2} className="px-2 py-1.5 font-semibold w-12 text-center border-b border-gray-200">Sl No.</th>
                            <th rowSpan={2} className="px-2 py-1.5 font-semibold w-[15%] border-b border-gray-200 border-l">Sub-Activity Name</th>
                            <th rowSpan={2} className="px-2 py-1.5 font-semibold w-[20%] border-b border-gray-200 border-l">Hazards</th>
                            <th rowSpan={2} className="px-2 py-1.5 font-semibold w-[15%] border-b border-gray-200 border-l">Risk</th>
                            <th colSpan={3} className="px-2 py-1.5 font-semibold text-center border-b border-gray-200 border-l">Initial Risk Score</th>
                            <th rowSpan={2} className="px-2 py-1.5 font-semibold w-[15%] border-b border-gray-200 border-l">Control Measures</th>
                            <th colSpan={3} className="px-2 py-1.5 font-semibold text-center border-b border-gray-200 border-l">Final Risk Score</th>
                            <th rowSpan={2} className="px-2 py-1.5 font-semibold w-10 text-center border-b border-gray-200 border-l"></th>
                          </tr>
                          <tr>
                            <th className="px-1 py-1 font-semibold text-center border-b border-gray-200 border-l w-12" title="Severity">S</th>
                            <th className="px-1 py-1 font-semibold text-center border-b border-gray-200 border-l w-12" title="Likelihood">L</th>
                            <th className="px-1 py-1 font-semibold text-center border-b border-gray-200 border-l w-12" title="Risk Score">R</th>
                            <th className="px-1 py-1 font-semibold text-center border-b border-gray-200 border-l w-12" title="Severity">S</th>
                            <th className="px-1 py-1 font-semibold text-center border-b border-gray-200 border-l w-12" title="Likelihood">L</th>
                            <th className="px-1 py-1 font-semibold text-center border-b border-gray-200 border-l w-12" title="Risk Score">R</th>
                          </tr>
                        </thead>
                        <tbody>
                          {manualHIRA.length === 0 ? (
                            <tr>
                              <td colSpan={12} className="p-4 text-center text-gray-500 italic">No rows added yet. Click "+ Add Row" to begin.</td>
                            </tr>
                          ) : (
                            manualHIRA.map((hiraRow, idx) => {
                              const initialS = Number(hiraRow.initialSeverity) || 0;
                              const initialL = Number(hiraRow.initialLikelihood) || 0;
                              const initialR = initialS * initialL;
                              
                              const finalL = Number(hiraRow.finalLikelihood) || 0;
                              const finalR = initialS * finalL;
                              
                              return (
                                <tr key={hiraRow.id} className="border-b border-gray-100 last:border-0 bg-white align-top">
                                  <td className="px-2 py-1.5 text-center font-medium text-gray-500 bg-gray-50/50">{idx + 1}</td>
                                  <td className="px-1 py-1 border-l border-gray-100">
                                    <textarea
                                      className="w-full resize-y rounded border border-transparent hover:border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary px-2 py-1 outline-none text-[11px] min-h-[60px] bg-transparent"
                                      value={hiraRow.subActivity || ""}
                                      onChange={(e) => {
                                        const arr = [...manualHIRA];
                                        arr[idx] = { ...arr[idx], subActivity: e.target.value };
                                        patchAnnexure(row.key, { manualHIRA: arr });
                                      }}
                                      placeholder="Activity name..."
                                    />
                                  </td>
                                  <td className="px-1 py-1 border-l border-gray-100">
                                    <BulletTextarea
                                      className="w-full resize-y rounded border border-transparent hover:border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary px-2 py-1 outline-none text-[11px] min-h-[60px] bg-transparent"
                                      value={hiraRow.hazards || ""}
                                      onChange={(v) => {
                                        const arr = [...manualHIRA];
                                        arr[idx] = { ...arr[idx], hazards: v };
                                        patchAnnexure(row.key, { manualHIRA: arr });
                                      }}
                                      placeholder="• Hazard 1"
                                    />
                                  </td>
                                  <td className="px-1 py-1 border-l border-gray-100">
                                    <BulletTextarea
                                      className="w-full resize-y rounded border border-transparent hover:border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary px-2 py-1 outline-none text-[11px] min-h-[60px] bg-transparent"
                                      value={hiraRow.risk || ""}
                                      onChange={(v) => {
                                        const arr = [...manualHIRA];
                                        arr[idx] = { ...arr[idx], risk: v };
                                        patchAnnexure(row.key, { manualHIRA: arr });
                                      }}
                                      placeholder="• Risk 1"
                                    />
                                  </td>
                                  <td className="px-1 py-1 border-l border-gray-100">
                                    <input
                                      type="number"
                                      min="1" max="5"
                                      className="w-full text-center rounded border border-transparent hover:border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary px-1 py-1 outline-none text-[11px] bg-transparent no-spinners"
                                      value={hiraRow.initialSeverity || ""}
                                      onChange={(e) => {
                                        const arr = [...manualHIRA];
                                        arr[idx] = { ...arr[idx], initialSeverity: e.target.value };
                                        patchAnnexure(row.key, { manualHIRA: arr });
                                      }}
                                    />
                                  </td>
                                  <td className="px-1 py-1 border-l border-gray-100">
                                    <input
                                      type="number"
                                      min="1" max="5"
                                      className="w-full text-center rounded border border-transparent hover:border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary px-1 py-1 outline-none text-[11px] bg-transparent no-spinners"
                                      value={hiraRow.initialLikelihood || ""}
                                      onChange={(e) => {
                                        const arr = [...manualHIRA];
                                        arr[idx] = { ...arr[idx], initialLikelihood: e.target.value };
                                        patchAnnexure(row.key, { manualHIRA: arr });
                                      }}
                                    />
                                  </td>
                                  <td className="px-1 py-1 border-l border-gray-100 bg-gray-50/50">
                                    <input
                                      type="number"
                                      disabled
                                      className="w-full text-center rounded border border-transparent px-1 py-1 outline-none text-[11px] bg-transparent font-bold text-gray-700"
                                      value={initialR || ""}
                                    />
                                  </td>
                                  <td className="px-1 py-1 border-l border-gray-100">
                                    <BulletTextarea
                                      className="w-full resize-y rounded border border-transparent hover:border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary px-2 py-1 outline-none text-[11px] min-h-[60px] bg-transparent"
                                      value={hiraRow.controlMeasures || ""}
                                      onChange={(v) => {
                                        const arr = [...manualHIRA];
                                        arr[idx] = { ...arr[idx], controlMeasures: v };
                                        patchAnnexure(row.key, { manualHIRA: arr });
                                      }}
                                      placeholder="• Measure 1"
                                    />
                                  </td>
                                  <td className="px-1 py-1 border-l border-gray-100 bg-gray-50/50">
                                    <input
                                      type="number"
                                      disabled
                                      className="w-full text-center rounded border border-transparent px-1 py-1 outline-none text-[11px] bg-transparent text-gray-500"
                                      value={initialS || ""}
                                    />
                                  </td>
                                  <td className="px-1 py-1 border-l border-gray-100">
                                    <input
                                      type="number"
                                      min="1" max="5"
                                      className="w-full text-center rounded border border-transparent hover:border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary px-1 py-1 outline-none text-[11px] bg-transparent no-spinners"
                                      value={hiraRow.finalLikelihood || ""}
                                      onChange={(e) => {
                                        const arr = [...manualHIRA];
                                        arr[idx] = { ...arr[idx], finalLikelihood: e.target.value };
                                        patchAnnexure(row.key, { manualHIRA: arr });
                                      }}
                                    />
                                  </td>
                                  <td className="px-1 py-1 border-l border-gray-100 bg-gray-50/50">
                                    <input
                                      type="number"
                                      disabled
                                      className="w-full text-center rounded border border-transparent px-1 py-1 outline-none text-[11px] bg-transparent font-bold text-gray-700"
                                      value={finalR || ""}
                                    />
                                  </td>
                                  <td className="px-2 py-1.5 text-center border-l border-gray-100 bg-gray-50/50 align-middle">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const arr = [...manualHIRA];
                                        arr.splice(idx, 1);
                                        patchAnnexure(row.key, { manualHIRA: arr });
                                      }}
                                      className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded hover:bg-red-50"
                                      title="Delete row"
                                    >
                                      <Trash2 className="w-3.5 h-3.5 mx-auto" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        patchAnnexure(row.key, { 
                          manualHIRA: [
                            ...manualHIRA, 
                            { id: Math.random().toString(36).slice(2), subActivity: "", hazards: "", risk: "", initialSeverity: 1, initialLikelihood: 1, controlMeasures: "", finalLikelihood: 1 }
                          ]
                        });
                      }}
                      className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-semibold text-primary hover:text-orange-600 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Row
                    </button>
                  </div>
                )}

                <input
                  ref={(el) => {
                    annexureFileRefs.current[row.key] = el;
                  }}
                  type="file"
                  multiple
                  className="hidden"
                  aria-hidden
                  accept={row.accept}
                  onChange={(e) => {
                    handleAnnexureFiles(row.key, e.target.files);
                    e.target.value = "";
                  }}
                />
              </div>
            );
          })}
        </div>
        </section>
      </div>
      {showHIRAGuidance && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden relative">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 shrink-0">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2 text-base">
                <HelpCircle className="w-5 h-5 text-sky-600" />
                HIRA Manual Entry Guidance
              </h3>
              <button onClick={() => setShowHIRAGuidance(false)} className="p-1.5 hover:bg-gray-200 rounded-md transition-colors text-gray-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto text-[13px] text-gray-800 space-y-8">
              
              {/* TABLE 1: LIKELIHOOD */}
              <div className="shadow-sm rounded-lg overflow-hidden border border-gray-300">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr>
                      <th colSpan={3} className="bg-[#EBEBE3] border-b border-gray-300 py-2 px-4 font-bold uppercase text-center">DETERMINING RISK LIKELIHOOD – GUIDANCE CRITERIA</th>
                    </tr>
                    <tr className="bg-[#f5f5ef] border-b border-gray-300 text-center">
                      <th className="border-r border-gray-300 py-2 px-4 font-semibold w-1/4">Likelihood</th>
                      <th className="border-r border-gray-300 py-2 px-4 font-semibold w-[15%]">Weightage</th>
                      <th className="py-2 px-4 font-semibold text-left">Criteria</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-300">
                    <tr className="hover:bg-gray-50"><td className="border-r border-gray-300 py-2 px-4 font-semibold text-center">Unlikely</td><td className="border-r border-gray-300 font-bold text-center">1</td><td className="py-2 px-4">It is un heard in the industry</td></tr>
                    <tr className="hover:bg-gray-50"><td className="border-r border-gray-300 py-2 px-4 font-semibold text-center">Likely</td><td className="border-r border-gray-300 font-bold text-center">2</td><td className="py-2 px-4">It has rarely occurred in other construction companies</td></tr>
                    <tr className="hover:bg-gray-50"><td className="border-r border-gray-300 py-2 px-4 font-semibold text-center">Highly Unlikely</td><td className="border-r border-gray-300 font-bold text-center">3</td><td className="py-2 px-4">It has occurred in other construction company</td></tr>
                    <tr className="hover:bg-gray-50"><td className="border-r border-gray-300 py-2 px-4 font-semibold text-center">Very Likely</td><td className="border-r border-gray-300 font-bold text-center">4</td><td className="py-2 px-4">It has occurred in other project sites of the company</td></tr>
                    <tr className="hover:bg-gray-50"><td className="border-r border-gray-300 py-2 px-4 font-semibold text-center">Certain</td><td className="border-r border-gray-300 font-bold text-center">5</td><td className="py-2 px-4">It has occurred several times at the site location in a year</td></tr>
                  </tbody>
                </table>
              </div>

              {/* TABLE 2: SEVERITY */}
              <div className="shadow-sm rounded-lg overflow-hidden border border-gray-300">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr>
                      <th colSpan={4} className="bg-[#EBEBE3] border-b border-gray-300 py-2 px-4 font-bold uppercase text-center">
                        DETERMINING RISK SEVERITY LEVEL - GUIDANCE CRITERIA
                      </th>
                    </tr>
                    <tr>
                      <th colSpan={4} className="bg-[#EBEBE3] border-b border-gray-300 py-2 px-4 font-bold text-center">
                        Severity Descriptions<br/>
                        <span className="font-normal text-[12px]">(The highest category shall always be used)</span>
                      </th>
                    </tr>
                    <tr className="bg-[#f5f5ef] border-b border-gray-300 text-center">
                      <th rowSpan={2} className="border-r border-gray-300 py-2 px-4 font-semibold w-[10%] align-middle">Value</th>
                      <th colSpan={2} className="border-r border-gray-300 py-2 px-4 font-semibold w-1/2">Result of Hazard to Personal</th>
                      <th rowSpan={2} className="py-2 px-4 font-semibold w-[40%] align-middle">Severity of the Environmental Impact</th>
                    </tr>
                    <tr className="bg-[#f5f5ef] border-b border-gray-300 text-center">
                      <th className="border-r border-t border-gray-300 py-2 px-4 font-semibold">Safety</th>
                      <th className="border-r border-t border-gray-300 py-2 px-4 font-semibold">Health</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-300">
                    <tr className="hover:bg-gray-50"><td className="border-r border-gray-300 py-2 px-4 font-bold text-center">5</td><td className="border-r border-gray-300 py-2 px-4">Single or Multiple Fatality</td><td className="border-r border-gray-300 py-2 px-4">Terminal Illness</td><td className="py-2 px-4">Massive effect</td></tr>
                    <tr className="hover:bg-gray-50"><td className="border-r border-gray-300 py-2 px-4 font-bold text-center">4</td><td className="border-r border-gray-300 py-2 px-4">Serious injury requiring hospitalization</td><td className="border-r border-gray-300 py-2 px-4">Unemployed due to illness</td><td className="py-2 px-4">Major effect</td></tr>
                    <tr className="hover:bg-gray-50"><td className="border-r border-gray-300 py-2 px-4 font-bold text-center">3</td><td className="border-r border-gray-300 py-2 px-4">Lost Time injury</td><td className="border-r border-gray-300 py-2 px-4">Intense health effect</td><td className="py-2 px-4">Localized effect</td></tr>
                    <tr className="hover:bg-gray-50"><td className="border-r border-gray-300 py-2 px-4 font-bold text-center">2</td><td className="border-r border-gray-300 py-2 px-4">Injury requiring Medical treatment but no Lost Time</td><td className="border-r border-gray-300 py-2 px-4">Minor health effect</td><td className="py-2 px-4">Minor effect</td></tr>
                    <tr className="hover:bg-gray-50"><td className="border-r border-gray-300 py-2 px-4 font-bold text-center">1</td><td className="border-r border-gray-300 py-2 px-4">First Treatment only</td><td className="border-r border-gray-300 py-2 px-4">Slight health effect</td><td className="py-2 px-4">Slight effect</td></tr>
                  </tbody>
                </table>
              </div>

              {/* TABLE 3: MATRIX */}
              <div className="overflow-x-auto pb-2 shadow-sm rounded-lg border border-gray-300">
                <table className="w-full border-collapse text-center whitespace-nowrap">
                  <thead>
                    <tr>
                      <th colSpan={6} className="bg-[#EBEBE3] border-b border-gray-300 py-2 font-bold uppercase">
                        A.5 RISK PRIORITIZATION INDICATORS
                      </th>
                    </tr>
                    <tr className="bg-[#f5f5ef] border-b border-gray-300">
                      <th className="border-r border-gray-300 py-3 px-4 font-semibold">Severity / Likelihood</th>
                      <th className="border-r border-gray-300 py-3 px-4 font-semibold">Insignificant (1)</th>
                      <th className="border-r border-gray-300 py-3 px-4 font-semibold">Slightly Harmful (2)</th>
                      <th className="border-r border-gray-300 py-3 px-4 font-semibold">Harmful (3)</th>
                      <th className="border-r border-gray-300 py-3 px-4 font-semibold">Very Harmful (4)</th>
                      <th className="py-3 px-4 font-semibold">Extremely Harmful (5)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-300">
                    <tr className="hover:bg-gray-50/50">
                      <td className="border-r border-gray-300 py-3 px-4 font-medium text-left bg-white">Highly Unlikely (1)</td>
                      <td className="border-r border-gray-300 py-3 px-4 bg-[#92D050] text-gray-900 font-medium">TRIVIAL (1)</td>
                      <td className="border-r border-gray-300 py-3 px-4 bg-[#92D050] text-gray-900 font-medium">TRIVIAL (2)</td>
                      <td className="border-r border-gray-300 py-3 px-4 bg-[#92D050] text-gray-900 font-medium">TOLERABLE (3)</td>
                      <td className="border-r border-gray-300 py-3 px-4 bg-[#92D050] text-gray-900 font-medium">TOLERABLE (4)</td>
                      <td className="py-3 px-4 bg-[#92D050] text-gray-900 font-medium">MODERATE (5)</td>
                    </tr>
                    <tr className="hover:bg-gray-50/50">
                      <td className="border-r border-gray-300 py-3 px-4 font-medium text-left bg-white">UNLIKELY (2)</td>
                      <td className="border-r border-gray-300 py-3 px-4 bg-[#92D050] text-gray-900 font-medium">TRIVIAL (2)</td>
                      <td className="border-r border-gray-300 py-3 px-4 bg-[#92D050] text-gray-900 font-medium">TOLERABLE (4)</td>
                      <td className="border-r border-gray-300 py-3 px-4 bg-[#92D050] text-gray-900 font-medium">MODERATE (6)</td>
                      <td className="border-r border-gray-300 py-3 px-4 bg-[#92D050] text-gray-900 font-medium">MODERATE (8)</td>
                      <td className="py-3 px-4 bg-[#FFFF00] text-gray-900 font-medium">SUBSTANTIAL (10)</td>
                    </tr>
                    <tr className="hover:bg-gray-50/50">
                      <td className="border-r border-gray-300 py-3 px-4 font-medium text-left bg-white">LIKELY (3)</td>
                      <td className="border-r border-gray-300 py-3 px-4 bg-[#92D050] text-gray-900 font-medium">TOLERABLE (3)</td>
                      <td className="border-r border-gray-300 py-3 px-4 bg-[#92D050] text-gray-900 font-medium">MODERATE (6)</td>
                      <td className="border-r border-gray-300 py-3 px-4 bg-[#92D050] text-gray-900 font-medium">MODERATE (9)</td>
                      <td className="border-r border-gray-300 py-3 px-4 bg-[#FFFF00] text-gray-900 font-medium">SUBSTANTIAL (12)</td>
                      <td className="py-3 px-4 bg-[#FFFF00] text-gray-900 font-medium">SUBSTANTIAL (15)</td>
                    </tr>
                    <tr className="hover:bg-gray-50/50">
                      <td className="border-r border-gray-300 py-3 px-4 font-medium text-left bg-white">VERY LIKELY (4)</td>
                      <td className="border-r border-gray-300 py-3 px-4 bg-[#92D050] text-gray-900 font-medium">TOLERABLE (4)</td>
                      <td className="border-r border-gray-300 py-3 px-4 bg-[#92D050] text-gray-900 font-medium">MODERATE (8)</td>
                      <td className="border-r border-gray-300 py-3 px-4 bg-[#FFFF00] text-gray-900 font-medium">SUBSTANTIAL (12)</td>
                      <td className="border-r border-gray-300 py-3 px-4 bg-[#FFFF00] text-gray-900 font-medium">SUBSTANTIAL (16)</td>
                      <td className="py-3 px-4 bg-[#FF0000] text-white font-medium">INTOLERABLE (20)</td>
                    </tr>
                    <tr className="hover:bg-gray-50/50">
                      <td className="border-r border-gray-300 py-3 px-4 font-medium text-left bg-white">CERTAIN (5)</td>
                      <td className="border-r border-gray-300 py-3 px-4 bg-[#92D050] text-gray-900 font-medium">MODERATE (5)</td>
                      <td className="border-r border-gray-300 py-3 px-4 bg-[#FFFF00] text-gray-900 font-medium">SUBSTANTIAL (10)</td>
                      <td className="border-r border-gray-300 py-3 px-4 bg-[#FFFF00] text-gray-900 font-medium">SUBSTANTIAL (15)</td>
                      <td className="border-r border-gray-300 py-3 px-4 bg-[#FF0000] text-white font-medium">INTOLERABLE (20)</td>
                      <td className="py-3 px-4 bg-[#FF0000] text-white font-medium">INTOLERABLE (25)</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* TABLE 4: DEFINITION */}
              <div className="shadow-sm rounded-lg overflow-hidden border border-gray-300">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr>
                      <th colSpan={3} className="bg-[#EBEBE3] border-b border-gray-300 py-2 px-4 font-bold uppercase text-center">
                        DEFINITION OF LEVEL OF WORKS
                      </th>
                    </tr>
                    <tr className="bg-[#f5f5ef] border-b border-gray-300 text-center">
                      <th className="border-r border-gray-300 py-2 px-4 font-semibold w-1/4">RISK LEVEL</th>
                      <th className="border-r border-gray-300 py-2 px-4 font-semibold">ACTION AND TIME SCALE</th>
                      <th className="py-2 px-4 font-semibold w-1/4">CATEGORY</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-300">
                    <tr className="hover:bg-gray-50">
                      <td className="border-r border-gray-300 py-2 px-4 font-medium text-center">TRIVIAL</td>
                      <td rowSpan={3} className="border-r border-gray-300 py-2 px-6 align-middle leading-relaxed">Continue with the current activity. Monitoring is required to ensure that the controls are effectively maintained.</td>
                      <td rowSpan={3} className="py-2 px-6 align-middle text-center">Acceptable<br/><span className="text-gray-500">(Low Risk)</span></td>
                    </tr>
                    <tr className="hover:bg-gray-50"><td className="border-r border-gray-300 py-2 px-4 font-medium text-center">TOLERABLE</td></tr>
                    <tr className="hover:bg-gray-50"><td className="border-r border-gray-300 py-2 px-4 font-medium text-center">MODERATE</td></tr>
                    <tr className="hover:bg-gray-50">
                      <td className="border-r border-gray-300 py-2 px-4 font-medium text-center">SUBSTANTIAL</td>
                      <td className="border-r border-gray-300 py-3 px-6 leading-relaxed">Urgent action is required including engineering / operational controls / administrative controls / PPE / Signages / Training / Behavioral Monitoring.</td>
                      <td className="py-3 px-6 text-center">Not Acceptable<br/><span className="text-gray-500">(Medium Risk)</span></td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="border-r border-gray-300 py-2 px-4 font-medium text-center">INTOLERABLE</td>
                      <td className="border-r border-gray-300 py-3 px-6 leading-relaxed">Immediate action should be taken. Work should not be started or continued until the impact / risk has been reduced.</td>
                      <td className="py-3 px-6 text-center">Not Acceptable<br/><span className="text-gray-500">(High Risk)</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>

            </div>
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end shrink-0">
              <button 
                onClick={() => setShowHIRAGuidance(false)}
                className="px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-orange-600 transition-colors shadow-sm"
              >
                Close Guidance
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
