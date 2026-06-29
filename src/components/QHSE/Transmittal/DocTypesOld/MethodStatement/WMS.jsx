import { useRef } from "react";
import { FileCheck, Plus, Trash2, Upload } from "lucide-react";
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
    <div className="space-y-6">
      <section className={cardCls}>
        <h3 className="text-[11px] uppercase tracking-wider font-bold text-gray-500 border-b border-gray-100 pb-2">
          {capitalCase("scope and objective")}
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

      <section className={cardCls}>
        <h3 className="text-[11px] uppercase tracking-wider font-bold text-gray-500 border-b border-gray-100 pb-2">
          {capitalCase("references")}
        </h3>

        <div className="flex flex-wrap items-center gap-2">
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
                        value={row.refType || "specification"}
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
                          className={`inline-flex items-center justify-center gap-1.5 whitespace-nowrap text-[11px] font-semibold px-3 py-2 rounded-md border transition-colors ${n > 0
                            ? "border-emerald-500/40 bg-emerald-50 text-emerald-700 hover:bg-emerald-100/60"
                            : "border-primary/30 bg-white text-primary hover:bg-orange-50"
                            }`}
                        >
                          {n > 0 ? (
                            <>
                              <FileCheck className="w-3.5 h-3.5 shrink-0" />
                              {n === 1 ? "1 file" : `${n} files`}
                            </>
                          ) : (
                            <>
                              <Upload className="w-3.5 h-3.5 shrink-0" />
                              {capitalCase("upload")}
                            </>
                          )}
                        </button>
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

      <section className={cardCls}>
        <h3 className="text-[11px] uppercase tracking-wider font-bold text-gray-500 border-b border-gray-100 pb-2">
          {capitalCase("construction sequence")}
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
                    className={`inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap text-[11px] font-semibold px-3 py-1.5 rounded-md border transition-colors ${cn > 0
                      ? "border-emerald-500/40 bg-emerald-50 text-emerald-700 hover:bg-emerald-100/60"
                      : "border-primary/30 bg-orange-50 text-primary hover:bg-orange-100/70"
                      }`}
                  >
                    {cn > 0 ? (
                      <>
                        <FileCheck className="w-3.5 h-3.5 shrink-0" />
                        {cn === 1 ? "1 file" : `${cn} files`}
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5 shrink-0" />
                        {capitalCase("upload")}
                      </>
                    )}
                  </button>
                </div>
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
                  placeholder={`• Enter ${label.toLowerCase()} point 1\n• Enter point 2\n• Enter point 3`}
                />
              </div>
            );
          })}
        </div>
      </section>

      <section className={cardCls}>
        <h3 className="text-[11px] uppercase tracking-wider font-bold text-gray-500 border-b border-gray-100 pb-2">
          {capitalCase("annexure")}
        </h3>

        <div className="space-y-3">
          {WMS_ANNEXURE_ROWS.map((row) => {
            const files = getWmsAnnexureFiles(annexureState[row.key]);
            const n = files.length;
            return (
              <div key={row.key} className="rounded-md border border-gray-200 bg-gray-50/70 px-3 py-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[11px] font-semibold text-gray-700">{row.label}</div>
                    <div className="text-[10px] text-gray-500">{row.hint}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => annexureFileRefs.current[row.key]?.click()}
                    className={`inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap text-[11px] font-semibold px-3 py-1.5 rounded-md border transition-colors ${
                      n > 0
                        ? "border-emerald-500/40 bg-emerald-50 text-emerald-700 hover:bg-emerald-100/60"
                        : "border-primary/30 bg-white text-primary hover:bg-orange-50"
                    }`}
                  >
                    {n > 0 ? (
                      <>
                        <FileCheck className="w-3.5 h-3.5 shrink-0" />
                        {n === 1 ? "1 file" : `${n} files`}
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5 shrink-0" />
                        {capitalCase("upload")}
                      </>
                    )}
                  </button>
                </div>
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
  );
}
