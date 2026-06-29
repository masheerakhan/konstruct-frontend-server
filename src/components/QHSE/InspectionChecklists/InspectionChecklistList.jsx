// QHSE CHECKLIST MODULE
// Purpose:
// Checklist Library table – lists all saved QHSE inspection templates for a project.
// Provides View (preview modal with instruction images/text), Edit, and Start Inspection actions.
// Admin-only Create Template button. Template preview includes instruction media and question list.
// Screen: QHSE Folder view – Checklist Library tab.
import React, { useState, useEffect, useCallback } from "react";
import * as XLSX from "xlsx";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { Search, Plus, Eye, Pencil, Loader2, FileText, Download, LayoutGrid, CheckSquare, Shield, Settings, FolderOpen, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { fetchInspectionChecklists, fetchInspectionChecklistDetail, fetchSafetyCategories } from "./inspectionChecklistApi";
import toast from "react-hot-toast";
import { getMediaUrl } from "./qhsePdfGenerator";

export default function InspectionChecklistList({ folderId, projectId, orgId, onCreateClick, onEditClick, onViewClick, onStartInspection }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [templates, setTemplates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);
  const navigate = useNavigate();

  // Role check
  const rolee = localStorage.getItem("ROLE");
  const accesses = JSON.parse(localStorage.getItem("ACCESSES") || "[]");
  const userRoles = accesses.flatMap((acc) => (Array.isArray(acc.roles) ? acc.roles : []));
  const allRoles = [...(rolee ? [rolee] : []), ...userRoles.map((r) => typeof r === "string" ? r : r?.role)];
  const isAdmin = allRoles.some((r) => 
    ["admin", "super admin", "manager", "ag-admin"].includes((r || "").toLowerCase().trim())
  );

  
  // View Modal State
  const [viewingTemplate, setViewingTemplate] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [fetchedCats, fetchedTmpls] = await Promise.all([
        fetchSafetyCategories({ orgId, projectId }),
        fetchInspectionChecklists({ orgId, projectId })
      ]);
      setCategories(fetchedCats);
      setTemplates(fetchedTmpls);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load checklists data.");
    } finally {
      setLoading(false);
    }
  }, [orgId, projectId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter templates
  const filteredTemplates = templates.filter((t) => {
    return t.title?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Helper to get option label safely
  const getOptionLabel = (opt) => {
    if (!opt) return "";
    if (typeof opt === "string") return opt;
    return opt.label || opt.name || opt.title || opt.text || "";
  };

  // Helper to fetch image as base64
  const fetchImageAsBase64 = async (url) => {
    if (!url) return null;
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Network response not ok");
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve({
            base64: reader.result.split(',')[1],
            mimeType: blob.type
          });
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (err) {
      console.warn("Failed to fetch image:", url, err);
      return null;
    }
  };

  // Helper to add image to worksheet stacked with preserved aspect ratio
  const addImageToWorksheet = async (workbook, worksheet, item, startRow, colOffset = 0.1) => {
    const imgData = await fetchImageAsBase64(item);
    if (!imgData) return 0;
    
    try {
      const imageId = workbook.addImage({
        base64: imgData.base64,
        extension: imgData.mimeType.split('/')[1] || 'png',
      });
      
      let aspect = 1.33;
      try {
        const getDimensions = () => new Promise((resolve) => {
          const img = new Image();
          img.onload = () => resolve({ w: img.width, h: img.height });
          img.onerror = () => resolve({ w: 400, h: 300 });
          img.src = `data:${imgData.mimeType};base64,${imgData.base64}`;
        });
        const dims = await getDimensions();
        if (dims.w && dims.h) {
          aspect = dims.w / dims.h;
        }
      } catch (e) {
        console.warn("Could not get image dimensions:", e);
      }
      
      const heightPx = 220;
      const widthPx = heightPx * aspect;
      
      worksheet.addImage(imageId, {
        tl: { col: colOffset, row: startRow - 1 },
        ext: { width: widthPx, height: heightPx },
        editAs: 'oneCell'
      });
      
      return 1;
    } catch (err) {
      console.error("Error adding image to worksheet:", err);
      return 0;
    }
  };

  // ─── Excel Download ─────────────────────────────────────────────────────────
  const handleDownloadExcel = async (template) => {
    setDownloadingId(template.id);
    try {
      // Fetch full template detail (includes questions array)
      let detail = template;
      if (!template.questions || template.questions.length === 0) {
        detail = await fetchInspectionChecklistDetail(template.id);
      }

      const questions = detail.questions || [];
      
      // Determine if all questions have the exact same options (homogeneous)
      const firstOpt = questions[0]?.options || [];
      const hasUniformOptions = questions.length > 0 && questions.every(q => 
        q.options && 
        q.options.length === firstOpt.length &&
        q.options.every((o, i) => getOptionLabel(o) === getOptionLabel(firstOpt[i]))
      );

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet((detail.title || "Checklist").substring(0, 31));

      // Safe merge helper to prevent RangeError/overlap crashes in ExcelJS
      const safeMerge = (sheet, r1, c1, r2, c2) => {
        if (r1 === r2 && c1 === c2) return;
        try {
          sheet.mergeCells(r1, c1, r2, c2);
        } catch (err) {
          console.warn("Merge failed:", r1, c1, r2, c2, err);
        }
      };

      // Setup columns and count
      let totalCols = 4;
      let allOptions = [];
      let cols = [];

      if (hasUniformOptions) {
        allOptions = firstOpt.map(getOptionLabel);
        totalCols = 3 + allOptions.length;
        cols.push({ key: 'sl', width: 8 });
        cols.push({ key: 'question', width: 58 });
        allOptions.forEach((opt, idx) => {
          cols.push({ key: `opt_${idx}`, width: 10 });
        });
        cols.push({ key: 'remarks', width: 22 });
      } else {
        totalCols = 4;
        cols = [
          { key: 'sl', width: 8 },
          { key: 'question', width: 58 },
          { key: 'response', width: 35 },
          { key: 'remarks', width: 22 }
        ];
      }
      worksheet.columns = cols;

      // Row 1: Header / Logos
      worksheet.addRow([]);
      worksheet.getRow(1).height = 45;
      
      const leftLogo = await fetchImageAsBase64(detail.report_logo);
      if (leftLogo) {
        const imageId = workbook.addImage({
          base64: leftLogo.base64,
          extension: leftLogo.mimeType.split('/')[1] || 'png',
        });
        worksheet.addImage(imageId, {
          tl: { col: 0.1, row: 0.1 },
          br: { col: 1.5, row: 0.9 },
          editAs: 'oneCell'
        });
      }

      // Middle text for PMC Logo if no image
      const centerColIdx = Math.floor(totalCols / 2);
      worksheet.getCell(1, centerColIdx).value = "PMC's Logo";
      worksheet.getCell(1, centerColIdx).alignment = { vertical: 'middle', horizontal: 'center' };
      worksheet.getCell(1, centerColIdx).font = { name: 'Arial', color: { argb: '999999' }, italic: true, size: 9 };
      
      const rightLogo = await fetchImageAsBase64(detail.report_logo_right);
      if (rightLogo) {
        const imageId = workbook.addImage({
          base64: rightLogo.base64,
          extension: rightLogo.mimeType.split('/')[1] || 'png',
        });
        worksheet.addImage(imageId, {
          tl: { col: totalCols - 1.5, row: 0.1 },
          br: { col: totalCols - 0.1, row: 0.9 },
          editAs: 'oneCell'
        });
      } else {
        worksheet.getCell(1, totalCols).value = "Contractor's Logo";
        worksheet.getCell(1, totalCols).alignment = { vertical: 'middle', horizontal: 'right' };
        worksheet.getCell(1, totalCols).font = { name: 'Arial', color: { argb: '999999' }, italic: true, size: 9 };
      }
      
      // Row 2: Title Row
      const titleRow = worksheet.addRow([`CHECKLIST FOR ${(detail.title || "Untitled").toUpperCase()}`]);
      titleRow.height = 30;
      safeMerge(worksheet, 2, 1, 2, totalCols);
      const cell2 = worksheet.getCell(2, 1);
      cell2.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFC000' } // Yellow
      };
      cell2.font = {
        name: 'Arial',
        bold: true,
        size: 14,
        color: { argb: '000000' }
      };
      cell2.alignment = { vertical: 'middle', horizontal: 'center' };
      cell2.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };

      // Row 3-5: Metadata
      worksheet.addRow(["Project/ Job Site:", "", "", "Report No:", "", ""]);
      safeMerge(worksheet, 3, 1, 3, 3);
      safeMerge(worksheet, 3, 4, 3, totalCols);
      
      worksheet.addRow(["Location:", "", "", "Date:", "", ""]);
      safeMerge(worksheet, 4, 1, 4, 3);
      safeMerge(worksheet, 4, 4, 4, totalCols);

      worksheet.addRow(["Contractor:", "", "", "Machine No:", "", ""]);
      safeMerge(worksheet, 5, 1, 5, 3);
      safeMerge(worksheet, 5, 4, 5, totalCols);

      const lightBorder = {
        top: { style: 'thin', color: { argb: 'CCCCCC' } },
        bottom: { style: 'thin', color: { argb: 'CCCCCC' } },
        left: { style: 'thin', color: { argb: 'CCCCCC' } },
        right: { style: 'thin', color: { argb: 'CCCCCC' } }
      };

      for (let r = 3; r <= 5; r++) {
        worksheet.getRow(r).height = 20;
        for (let c = 1; c <= totalCols; c++) {
          const cell = worksheet.getCell(r, c);
          cell.font = { name: 'Arial', size: 10 };
          cell.alignment = { vertical: 'middle' };
          cell.border = lightBorder;
        }
      }

      // Row 6+: Diagram/Instructional Media (looping all images side-by-side with aspect ratio preservation)
      let currentRow = 6;
      const mediaUrls = detail.instructional_media_urls || [];
      if (mediaUrls.length > 0) {
        for (let i = 0; i < mediaUrls.length; i += 3) {
          const chunk = mediaUrls.slice(i, i + 3);
          
          const imageRowsCount = 11;
          for (let r = 0; r < imageRowsCount; r++) {
            worksheet.addRow([]);
            worksheet.getRow(currentRow + r).height = 20;
          }

          const colOffsets = [0.1, 1.4, 2.8]; 
          for (let j = 0; j < chunk.length; j++) {
            await addImageToWorksheet(workbook, worksheet, chunk[j], currentRow, colOffsets[j]);
          }
          
          currentRow += imageRowsCount;
          worksheet.addRow([]);
          worksheet.getRow(currentRow).height = 15;
          currentRow++;
        }
      } else {
        worksheet.addRow([]);
        currentRow++;
      }

      // Table Headers (Status Yes/No/N/A or Response Options)
      const header1Row = worksheet.addRow([]);
      header1Row.height = 25;
      const h1Idx = header1Row.number;
      
      const header2Row = worksheet.addRow([]);
      header2Row.height = 20;
      const h2Idx = header2Row.number;
      
      const yellowFill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFC000' }
      };
      const headerFont = { name: 'Arial', bold: true, size: 10 };
      const centerAlign = { vertical: 'middle', horizontal: 'center' };
      const darkBorder = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };

      if (hasUniformOptions) {
        worksheet.getCell(h1Idx, 1).value = "Sl.";
        worksheet.getCell(h1Idx, 2).value = "Checkpoints";
        worksheet.getCell(h1Idx, 3).value = "Status";
        worksheet.getCell(h1Idx, 3 + allOptions.length).value = "Remarks";
        
        safeMerge(worksheet, h1Idx, 1, h2Idx, 1);
        safeMerge(worksheet, h1Idx, 2, h2Idx, 2);
        safeMerge(worksheet, h1Idx, 3, h1Idx, 3 + allOptions.length - 1);
        safeMerge(worksheet, h1Idx, 3 + allOptions.length, h2Idx, 3 + allOptions.length);
        
        allOptions.forEach((opt, idx) => {
          worksheet.getCell(h2Idx, 3 + idx).value = opt;
        });
      } else {
        worksheet.getCell(h1Idx, 1).value = "Sl.";
        worksheet.getCell(h1Idx, 2).value = "Checkpoints";
        worksheet.getCell(h1Idx, 3).value = "Response Options";
        worksheet.getCell(h1Idx, 4).value = "Remarks";
        
        safeMerge(worksheet, h1Idx, 1, h2Idx, 1);
        safeMerge(worksheet, h1Idx, 2, h2Idx, 2);
        safeMerge(worksheet, h1Idx, 3, h2Idx, 3);
        safeMerge(worksheet, h1Idx, 4, h2Idx, 4);
      }
      
      for (let r = h1Idx; r <= h2Idx; r++) {
        for (let c = 1; c <= totalCols; c++) {
          const cell = worksheet.getCell(r, c);
          cell.fill = yellowFill;
          cell.font = headerFont;
          cell.alignment = centerAlign;
          cell.border = darkBorder;
        }
      }

      // Question Rows
      questions.forEach((q, idx) => {
        const serial = q.order_index ?? idx + 1;
        const text = q.text || q.title || "";
        
        let rowValues = [];
        if (hasUniformOptions) {
          rowValues = [serial, text];
          allOptions.forEach(() => rowValues.push(""));
          rowValues.push(""); // Remarks
        } else {
          const optionsText = (q.options || []).map(opt => `[ ] ${getOptionLabel(opt)}`).join("   ");
          rowValues = [serial, text, optionsText, ""];
        }
        
        const qRow = worksheet.addRow(rowValues);
        qRow.height = 24;
        
        for (let c = 1; c <= totalCols; c++) {
          const cell = qRow.getCell(c);
          cell.font = { name: 'Arial', size: 10 };
          cell.border = darkBorder;
          if (c === 1) {
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
          } else if (c === 2) {
            cell.alignment = { vertical: 'middle', wrapText: true };
          } else if (c === 3 && !hasUniformOptions) {
            cell.alignment = { vertical: 'middle', horizontal: 'left' };
          } else {
            cell.alignment = { vertical: 'middle' };
          }
        }
      });

      // Spacers and Footer comments/sigs
      worksheet.addRow([]);
      
      const commentStart = worksheet.addRow(["Comments/Action Required:", "", "", "", "", ""]);
      const csIdx = commentStart.number;
      worksheet.addRow([]);
      worksheet.addRow([]);
      safeMerge(worksheet, csIdx, 1, csIdx + 2, totalCols);
      
      for (let r = csIdx; r <= csIdx + 2; r++) {
        worksheet.getRow(r).height = 18;
        for (let c = 1; c <= totalCols; c++) {
          const cell = worksheet.getCell(r, c);
          cell.border = darkBorder;
          if (r === csIdx && c === 1) {
            cell.font = { name: 'Arial', bold: true, size: 10 };
            cell.alignment = { vertical: 'top' };
          }
        }
      }
      
      worksheet.addRow([]); // space
      
      const sigRow = worksheet.addRow([]);
      sigRow.height = 25;
      
      if (totalCols >= 6) {
        worksheet.getCell(sigRow.number, 1).value = "Inspected by:";
        worksheet.getCell(sigRow.number, 3).value = "Checked & Reviewed by:";
        worksheet.getCell(sigRow.number, 5).value = "PMC/3rd Party:";
        
        safeMerge(worksheet, sigRow.number, 1, sigRow.number, 2);
        safeMerge(worksheet, sigRow.number, 3, sigRow.number, 4);
        safeMerge(worksheet, sigRow.number, 5, sigRow.number, totalCols);
      } else {
        worksheet.getCell(sigRow.number, 1).value = "Inspected by:";
        const midCol = Math.max(2, Math.floor(totalCols / 2));
        worksheet.getCell(sigRow.number, midCol).value = "Checked & Reviewed by:";
        worksheet.getCell(sigRow.number, totalCols).value = "PMC/3rd Party:";
      }
      
      for (let c = 1; c <= totalCols; c++) {
        const cell = sigRow.getCell(c);
        cell.font = { name: 'Arial', bold: true, size: 10 };
        cell.alignment = { vertical: 'bottom', horizontal: 'center' };
      }

      // Write buffer and download
      const excelBuf = await workbook.xlsx.writeBuffer();
      const blob = new Blob([excelBuf], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const safeName = (detail.title || "checklist")
        .replace(/[^a-zA-Z0-9\s.\-_]/g, "")
        .trim();
      saveAs(blob, `${safeName}.xlsx`);

      toast.success("Excel downloaded!");
    } catch (err) {
      console.error("Excel download error:", err);
      toast.error("Failed to generate Excel.");
    } finally {
      setDownloadingId(null);
    }
  };
  
    // ─── View Modal ─────────────────────────────────────────────────────────────
    const handleView = async (template) => {
      setViewingTemplate(template);
      if (!template.questions || template.questions.length === 0) {
        setLoadingDetails(true);
        try {
          const detail = await fetchInspectionChecklistDetail(template.id);
          setViewingTemplate(detail);
        } catch (err) {
          console.error(err);
          toast.error("Failed to load template details.");
        } finally {
          setLoadingDetails(false);
        }
      }
    };

  // ─── Render Helpers ──────────────────────────────────────────────────────────
  const getCategoryIcon = (idx) => {
    const icons = [CheckSquare, Shield, Settings, FolderOpen];
    const Icon = icons[idx % icons.length];
    return <Icon className="w-5 h-5" />;
  };

  const getCategoryColor = (idx) => {
    const colors = [
      "bg-blue-50 text-blue-600 border-blue-200",
      "bg-green-50 text-green-600 border-green-200",
      "bg-purple-50 text-purple-600 border-purple-200",
      "bg-rose-50 text-rose-600 border-rose-200",
    ];
    return colors[idx % colors.length];
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* ── Top Header & Actions ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Checklist Library</h1>
          <p className="text-sm text-gray-500 mt-1">Manage and export inspection checklist templates.</p>
        </div>
        {isAdmin && (
          <button
            onClick={onCreateClick}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Create Checklist Template
          </button>
        )}
      </div>

      {/* ── Table Toolbar ── */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-2">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search checklists by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 h-10 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 text-sm shadow-sm"
          />
        </div>
        <div className="text-sm font-medium text-gray-500">
          Showing {filteredTemplates.length} {filteredTemplates.length === 1 ? 'checklist' : 'checklists'}
        </div>
      </div>

      {/* ── Checklists Table ── */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-5 py-4 font-semibold text-gray-700 w-[55%]">CHECKLIST NAME</th>
                <th className="text-left px-5 py-4 font-semibold text-gray-700 w-[25%]">CATEGORY</th>
                <th className="text-right px-5 py-4 font-semibold text-gray-700 w-[20%]">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="3" className="px-5 py-12">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <Loader2 className="w-8 h-8 animate-spin text-orange-500 mb-3" />
                      <p>Loading checklists...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredTemplates.length > 0 ? (
                filteredTemplates.map((template) => (
                  <tr key={template.id} className="border-b border-gray-100 hover:bg-orange-50/50 transition-colors group">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 rounded-md group-hover:bg-white transition-colors">
                          <FileText className="w-4 h-4 text-gray-500 group-hover:text-orange-500" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{template.title}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                        {template.category_name || "Uncategorized"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          title="View"
                          onClick={() => handleView(template)}
                          className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          title="Edit"
                          onClick={() => onEditClick?.(template)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                /* QHSE Checklist Empty State: Simplified compact layout showing only "No data found" */
                <tr>
                  <td colSpan="3" className="px-5 py-6">
                    <div className="flex flex-col items-center justify-center text-center">
                      <h3 className="text-sm font-medium text-gray-500">
                        No data found
                      </h3>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── View Modal Overlay ── */}
      {viewingTemplate && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50/50">
              <div>
                <h2 className="text-xl font-bold text-gray-800">{viewingTemplate.title}</h2>
                <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <FolderOpen className="w-3.5 h-3.5" /> {viewingTemplate.category_name || "Uncategorized"}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setViewingTemplate(null)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
              {loadingDetails ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                  <Loader2 className="w-8 h-8 animate-spin text-orange-500 mb-3" />
                  <p>Loading checklist details...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Instructional Images & Text (QHSE Checklist only) */}
                  {(
                    (viewingTemplate.instructional_media_urls && viewingTemplate.instructional_media_urls.length > 0) ||
                    viewingTemplate.instruction_text
                  ) && (
                    <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Checklist Instructions & Reference</h4>

                      {/* Images Grid – side-by-side, responsive */}
                      {viewingTemplate.instructional_media_urls && viewingTemplate.instructional_media_urls.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: viewingTemplate.instruction_text ? "14px" : "0" }}>
                          {viewingTemplate.instructional_media_urls.map((url, i) => (
                            <img
                              key={i}
                              src={getMediaUrl(url)}
                              alt={`Instruction ${i + 1}`}
                              style={{ maxWidth: "200px", height: "130px", objectFit: "contain", border: "1px solid #e2e8f0", borderRadius: "6px", background: "#f8fafc" }}
                            />
                          ))}
                        </div>
                      )}

                      {/* Instruction Text below images */}
                      {viewingTemplate.instruction_text && (
                        <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{viewingTemplate.instruction_text}</p>
                      )}
                    </div>
                  )}

                  {/* Questions Table */}
                  <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-200 bg-gray-50/80 flex items-center justify-between">
                      <h3 className="font-semibold text-gray-800">Checkpoints</h3>
                      <span className="text-xs font-medium text-gray-500 bg-gray-200 px-2.5 py-0.5 rounded-full">
                        {viewingTemplate.questions?.length || 0} Questions
                      </span>
                    </div>
                    {viewingTemplate.questions?.length > 0 ? (
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-100 text-gray-500 text-xs uppercase bg-gray-50/50">
                            <th className="px-4 py-3 text-center font-medium w-16">No.</th>
                            <th className="px-4 py-3 text-left font-medium">Question / Checkpoint</th>
                            <th className="px-4 py-3 text-center font-medium w-24">Photo</th>
                            <th className="px-4 py-3 text-left font-medium w-48">Options</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {viewingTemplate.questions.map((q, idx) => (
                            <tr key={q.id || idx} className="hover:bg-orange-50/30 transition-colors">
                              <td className="px-4 py-3 text-center text-gray-500">{q.order_index ?? idx + 1}</td>
                              <td className="px-4 py-3 font-medium text-gray-800">{q.text}</td>
                              <td className="px-4 py-3 text-center">
                                {q.photo_required ? (
                                  <span className="inline-flex text-xs font-medium bg-red-50 text-red-600 px-2 py-0.5 rounded">Yes</span>
                                ) : (
                                  <span className="inline-flex text-xs font-medium bg-gray-50 text-gray-500 px-2 py-0.5 rounded">No</span>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex flex-wrap gap-1.5">
                                  {(q.options || []).map((opt, i) => {
                                    const label = getOptionLabel(opt);
                                    let choice = typeof opt === "object" ? opt.choice : null;
                                    
                                    // Infer for legacy string options
                                    if (!choice) {
                                       if (/no\b|non|fail/i.test(label)) choice = "N";
                                       else if (/na\b|n\/a|not applicable/i.test(label)) choice = "NA";
                                       else choice = "P";
                                    }

                                    let badgeColor = "bg-green-50 text-green-700 border-green-200";
                                    if (choice === "N") badgeColor = "bg-red-50 text-red-700 border-red-200";
                                    if (choice === "NA") badgeColor = "bg-gray-100 text-gray-600 border-gray-200";

                                    return (
                                      <span
                                        key={i}
                                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${badgeColor}`}
                                      >
                                        {label}
                                      </span>
                                    );
                                  })}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="p-8 text-center text-gray-500 text-sm">
                        No questions have been added to this checklist.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
              {/* <button
                onClick={() => handleDownloadExcel(viewingTemplate)}
                disabled={downloadingId === viewingTemplate.id}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-green-600 rounded-lg text-sm font-medium transition-all"
              >
                {downloadingId === viewingTemplate.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Export to Excel
              </button> */}
              <button
                onClick={() => setViewingTemplate(null)}
                className="px-4 py-2 bg-gray-900 hover:bg-black text-white rounded-lg text-sm font-medium transition-colors"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
