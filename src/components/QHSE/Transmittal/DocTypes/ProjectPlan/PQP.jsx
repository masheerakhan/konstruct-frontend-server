import { useRef } from "react";
import { Plus, Trash2, Upload, FileCheck } from "lucide-react";
import {
  createPqpAnnexRow,
  getPqpRowFiles,
  PQP_DEFAULT_DOCUMENT_NAMES,
  PQP_MIN_ROW_COUNT,
} from "../../approvedVendors";
import { capitalCase } from "../../stringCase";

import FileUploadControl from "../../../../FileUploadControl";

export default function PQP({ pqpAnnexRows = [], onRowsChange }) {
  const rows = Array.isArray(pqpAnnexRows) && pqpAnnexRows.length > 0 ? pqpAnnexRows : [];
  // const fileInputRefs = useRef({});

  const setRows = (next) => {
    onRowsChange?.(typeof next === "function" ? next(rows) : next);
  };

  const handleFiles = (rowId, picked) => {
    const list = Array.from(picked || []).filter((f) => f instanceof File);
    setRows((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, files: list.length ? list : [] } : r))
    );
  };

  const handleDocumentName = (rowId, value) => {
    setRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, documentName: value } : r)));
  };

  const addRow = () => {
    setRows((prev) => [...prev, createPqpAnnexRow()]);
  };

  const removeRow = (rowId) => {
    setRows((prev) => {
      if (prev.length <= PQP_MIN_ROW_COUNT) return prev;
      return prev.filter((r) => r.id !== rowId);
    });
  };

  return (
    <div className="space-y-3">
      <h2 className="text-[12px] uppercase tracking-wider font-bold text-gray-500">
        {capitalCase("project quality plan")} — {capitalCase("documents")}
      </h2>
      <p className="text-[11px] text-gray-600">
        Use the upload control to select multiple files at once if needed. The button shows how many files are selected.
      </p>

      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="w-full text-xs border-collapse min-w-[520px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left font-semibold text-gray-700 px-3 py-2 min-w-[200px]">
                {capitalCase("document name")}
              </th>
              <th className="text-right font-semibold text-gray-700 px-3 py-2 pl-8 w-[200px]">
                {capitalCase("attachments")}
              </th>
              <th className="w-12 px-2 py-2" aria-hidden />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const fileList = getPqpRowFiles(row);
              const n = fileList.length;
              const canRemove = idx >= PQP_MIN_ROW_COUNT && rows.length > PQP_MIN_ROW_COUNT;
              return (
                <tr key={row.id} className="border-b border-gray-100 last:border-0">
                  <td className="px-3 py-2 align-middle">
                    {idx < PQP_MIN_ROW_COUNT ? (
                      <div className="text-xs text-gray-900 py-1.5 px-0 leading-snug">
                        {PQP_DEFAULT_DOCUMENT_NAMES[idx]}
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={row.documentName ?? ""}
                        onChange={(e) => handleDocumentName(row.id, e.target.value)}
                        className="w-full min-w-0 rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Enter Project Plan Name"
                      />
                    )}
                  </td>
                  <td className="px-3 py-2 pl-8 align-middle">
                    {/* <div className="flex flex-col items-end gap-1">
                      <button
                        type="button"
                        onClick={() => fileInputRefs.current[row.id]?.click()}
                        className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-sm border transition-colors cursor-pointer ${
                          n > 0
                            ? "border-emerald-500/40 bg-emerald-50 text-emerald-700 hover:bg-emerald-100/50"
                            : "border-primary/30 bg-orange-50 text-primary hover:bg-orange-100/50"
                        }`}
                        title={capitalCase("click to select files")}
                      >
                        {n > 0 ? (
                          <>
                            <FileCheck className="w-3.5 h-3.5 shrink-0" />
                            <span>{n === 1 ? "1 file selected" : `${n} files selected`}</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-3.5 h-3.5 shrink-0" />
                            {capitalCase("upload")}
                          </>
                        )}
                      </button>
                      <input
                        type="file"
                        multiple
                        ref={(el) => {
                          fileInputRefs.current[row.id] = el;
                        }}
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        onChange={(e) => {
                          handleFiles(row.id, e.target.files);
                          e.target.value = "";
                        }}
                      />
                    </div> */}

                    <FileUploadControl
                      files={fileList}
                      multiple
                      append={false}
                      align="end"
                      showFileName={false}
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      onFilesChange={(nextFiles) => handleFiles(row.id, nextFiles)}
                    />


                  </td>
                  <td className="px-2 py-2 align-middle text-center">
                    {canRemove ? (
                      <button
                        type="button"
                        onClick={() => removeRow(row.id)}
                        className="p-1.5 rounded-md text-gray-500 hover:text-red-600 hover:bg-red-50"
                        title={capitalCase("remove row")}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <button
        type="button"
        onClick={addRow}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
      >
        <Plus className="w-3.5 h-3.5" />
        {capitalCase("add Additional Project Plan")}
      </button>
    </div>
  );
}
