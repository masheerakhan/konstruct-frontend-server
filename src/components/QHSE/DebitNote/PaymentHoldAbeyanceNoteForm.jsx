import React, { useState } from 'react';
import { Plus, Trash2, Save } from 'lucide-react';
import FileUploadControl from "../../FileUploadControl";
import toast from "react-hot-toast";

const initialRow = {
  id: Date.now(),
  function: "",
  reference: "",
  description: "",
  unit: "",
  quantity: "",
  weightage: "",
  totalAmount: 0,
  evidence: null,
  remarks: ""
};

const functionOptions = ["Quality", "HSE", "Others"];

export default function PaymentHoldAbeyanceNoteForm({ onCancel, onSuccess, rootFolders = [] }) {
  const [rows, setRows] = useState([
    { ...initialRow, id: Date.now() },
    { ...initialRow, id: Date.now() + 1 },
    { ...initialRow, id: Date.now() + 2 }
  ]);

  const handleAddRow = () => {
    setRows([...rows, { ...initialRow, id: Date.now() }]);
  };

  const handleRemoveRow = (id) => {
    if (rows.length === 1) return;
    setRows(rows.filter((r) => r.id !== id));
  };

  const handleChange = (id, field, value) => {
    setRows(rows.map((row) => {
      if (row.id === id) {
        const updatedRow = { ...row, [field]: value };
        
        // Auto-calculate Total Amount
        if (field === "quantity" || field === "weightage") {
          const qty = parseFloat(updatedRow.quantity) || 0;
          const weight = parseFloat(updatedRow.weightage) || 0;
          updatedRow.totalAmount = (qty * weight).toFixed(2);
        }
        
        return updatedRow;
      }
      return row;
    }));
  };

  const handleAutoResize = (e) => {
    e.target.style.height = "auto";
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  const handleKeyDown = (e, rowId, field, value) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const newValue = value.substring(0, start) + '\n• ' + value.substring(end);
      handleChange(rowId, field, newValue);
      
      setTimeout(() => {
        if (e.target) {
          e.target.selectionStart = e.target.selectionEnd = start + 3;
        }
      }, 0);
    }
  };

  const handleFocus = (rowId, field, value) => {
    if (!value) {
      handleChange(rowId, field, '• ');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Basic validation
    const isValid = rows.every(r => r.function && r.description && r.quantity && r.weightage);
    if (!isValid) {
      toast.error("Please fill all required fields (Function, Description, Quantity, Weightage) in the rows.");
      return;
    }

    console.log("Submitting Payment Hold Abeyance Note Form:", rows);
    toast.success("Payment Hold Abeyance Note submitted successfully!");
    
    // Pass the top-level data up (for mock UI updates)
    if (onSuccess) {
      onSuccess({
        function: rows[0].function,
        reference: rows[0].reference,
        description: rows[0].description,
        unit: rows[0].unit,
        quantity: rows[0].quantity,
        weightage: rows[0].weightage,
        totalAmount: rows[0].totalAmount,
        evidence: rows[0].evidence ? "File attached" : "-",
        remarks: rows[0].remarks,
        status: "Pending"
      });
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="w-full">
        <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-gray-900 sm:text-2xl">
              Create Payment Hold Abeyance Note
            </h1>
            <p className="text-sm text-gray-500">
              Add details for the payment hold below.
            </p>
          </div>
          
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="w-full">
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-sm min-w-[1200px]">
                <thead>
                  <tr className="bg-gray-50/80 text-left border-b border-gray-100 whitespace-nowrap">
                    <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 w-[60px] text-center">Sl. No.</th>
                    <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 min-w-[150px]">Function</th>
                    <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 min-w-[250px]">Reference / Section / Clause</th>
                    <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 min-w-[200px]">Description of Item</th>
                    <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 w-[80px]">Unit</th>
                    <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 w-[80px]">Quantity</th>
                    <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 w-[120px]">Weightage per item Rs.</th>
                    <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 w-[120px]">Total Amount Rs.</th>
                    <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 w-[180px]">Evidence / Record</th>
                    <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 min-w-[200px]">Remarks</th>
                    <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 w-[60px] text-center"></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => (
                    <tr key={row.id} className="border-t border-gray-100 align-top hover:bg-gray-50/30">
                      <td className="px-4 py-3 text-gray-500 pt-5 text-center">{index + 1}</td>
                      
                      {/* Function Dropdown */}
                      <td className="px-4 py-3">
                        <select
                          className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                          value={row.function}
                          onChange={(e) => handleChange(row.id, "function", e.target.value)}
                        >
                          <option value="">Select</option>
                          {functionOptions.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </td>
                      
                      {/* Reference */}
                      <td className="px-4 py-3">
                        <textarea
                          rows={1}
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none overflow-hidden"
                          value={row.reference}
                          onChange={(e) => handleChange(row.id, "reference", e.target.value)}
                          onInput={handleAutoResize}
                          onKeyDown={(e) => handleKeyDown(e, row.id, "reference", row.reference)}
                          onFocus={() => handleFocus(row.id, "reference", row.reference)}
                          placeholder="• e.g. Sec 4.2"
                        />
                      </td>

                      {/* Description Dropdown (Root Folders) */}
                      <td className="px-4 py-3">
                        <select
                          className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                          value={row.description}
                          onChange={(e) => handleChange(row.id, "description", e.target.value)}
                        >
                          <option value="">Select Folder</option>
                          {rootFolders.slice(0, 28).map((folder, idx) => (
                            <option key={idx} value={folder.name}>{folder.name}</option>
                          ))}
                        </select>
                      </td>

                      {/* Unit */}
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm text-center focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                          value={row.unit}
                          onChange={(e) => handleChange(row.id, "unit", e.target.value)}
                          placeholder="Nos"
                        />
                      </td>

                      {/* Quantity */}
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm text-center focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                          value={row.quantity}
                          onChange={(e) => handleChange(row.id, "quantity", e.target.value)}
                          placeholder="0"
                        />
                      </td>

                      {/* Weightage */}
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                          value={row.weightage}
                          onChange={(e) => handleChange(row.id, "weightage", e.target.value)}
                          placeholder="0.00"
                        />
                      </td>

                      {/* Total Amount (Read Only) */}
                      <td className="px-4 py-3">
                        <div className="flex h-10 w-full items-center rounded-lg border border-gray-100 bg-gray-50 px-3 text-sm text-gray-700">
                          {row.totalAmount}
                        </div>
                      </td>

                      {/* Evidence / Record */}
                      <td className="px-4 py-3 min-w-[200px]">
                        <FileUploadControl
                           onFileSelect={(file) => handleChange(row.id, "evidence", file)}
                           selectedFile={row.evidence}
                           placeholder="Upload Evidence"
                        />
                      </td>

                      {/* Remarks */}
                      <td className="px-4 py-3">
                        <textarea
                          rows={1}
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none overflow-hidden"
                          value={row.remarks}
                          onChange={(e) => handleChange(row.id, "remarks", e.target.value)}
                          onInput={handleAutoResize}
                          onKeyDown={(e) => handleKeyDown(e, row.id, "remarks", row.remarks)}
                          onFocus={() => handleFocus(row.id, "remarks", row.remarks)}
                          placeholder="• Remarks"
                        />
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3 text-center pt-4">
                        <button
                          type="button"
                          onClick={() => handleRemoveRow(row.id)}
                          disabled={rows.length === 1}
                          className={`rounded-lg p-2 transition-colors ${
                            rows.length === 1
                              ? "text-gray-300 cursor-not-allowed"
                              : "text-red-500 hover:bg-red-50"
                          }`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
          </div>

          <div className="flex items-center justify-between pt-5">
            <button
               type="button"
               onClick={handleAddRow}
               className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm"
             >
               <Plus className="h-4 w-4 text-gray-500" />
               Add Row
             </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white hover:opacity-90"
            >
              <Save className="h-4 w-4" />
              Submit Form
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
