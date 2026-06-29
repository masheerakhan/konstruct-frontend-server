/*
---
QHSE MIGRATION NOTE
File: InspectionChecklistForm.jsx

Purpose: React component for creating and editing QHSE inspection checklist templates.

Workflow:
Folder 22 / Template Creation

Service:
QHSEMicroService (8004)

Migration Reason: Updated to import local category management functions from inspectionChecklistApi.js to ensure all template creation operations hit the new isolated microservice.

Related Files: inspectionChecklistApi.js
----------------------------------------
*/
// QHSE CHECKLIST MODULE
// Purpose:
// Template creation and edit form for QHSE Inspection Checklists.
// Supports Excel import, instruction text, instruction image upload, question builder,
// Yes/No/N/A option mapping, photo-required flags, workflow role config, and logo upload.
// Screen: QHSE Checklist Library – Create/Edit Template view.
import React, { useState, useEffect, useRef } from "react";
import * as XLSX from "xlsx";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { ArrowLeft, Upload, Plus, Trash2, Image as ImageIcon, Loader2, CheckCircle2, FileSpreadsheet, ArrowRight, Download } from "lucide-react";
import { 
  createInspectionChecklist, 
  fetchSafetyCategories, 
  updateInspectionChecklist, 
  fetchInspectionChecklistDetail,
  createSafetyCategory,
  deleteSafetyCategory
} from "./inspectionChecklistApi";
import toast from "react-hot-toast";
import useFormValidationUX from "./useFormValidationUX";

const getOptionLabel = (opt) => {
  if (!opt) return "";
  if (typeof opt === "string") return opt;
  return opt.label || opt.name || opt.title || opt.text || "";
};

const getOptionChoice = (opt) => {
  if (!opt) return "P";
  if (typeof opt === "string") {
    return opt.toLowerCase() === "no" ? "N" : "P";
  }
  return opt.choice === "N" ? "N" : "P";
};

export default function InspectionChecklistForm({ folderId, projectId, orgId, onBack, onCreated, initialData }) {
  const [categories, setCategories] = useState([]);
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [instructionText, setInstructionText] = useState("");
  const [existingMediaUrls, setExistingMediaUrls] = useState([]);
  const [mediaFiles, setMediaFiles] = useState([]);
  const [mediaPreviews, setMediaPreviews] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const titleRef = useRef(null);
  const categoryRef = useRef(null);
  const questionRefs = useRef({});
  const optionRefs = useRef({});

  const [questions, setQuestions] = useState([
    // Added comment: default options structured with 'choice' property ('P' = Pass, 'N' = Fail) for dynamic UI rendering & backend reporting
    { id: Date.now(), text: "", photoRequired: false, options: [{ label: "Yes", choice: "P" }, { label: "No", choice: "N" }, { label: "N/A", choice: "P" }] },
  ]);

  const [excelFileName, setExcelFileName] = useState(null);
  
  // Custom Category Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [errors, setErrors] = useState({});

  const imageInputRef = useRef(null);
  const excelInputRef = useRef(null);

  useEffect(() => {
    fetchSafetyCategories({ orgId, projectId })
      .then(setCategories)
      .catch(() => toast.error("Could not load categories"));
  }, [orgId, projectId]);

  const validationFields = [
    { key: "title", label: "Checklist Name", isValid: !!title.trim(), ref: titleRef },
    { key: "category", label: "Category", isValid: !!categoryId, ref: categoryRef },
    ...questions.map((q, idx) => ({
      key: `question_${q.id}`,
      label: `Question ${idx + 1} Text`,
      isValid: !!q.text.trim(),
      ref: { current: questionRefs.current[q.id] }
    })),
    ...questions.flatMap((q, qIdx) => 
      q.options.map((opt, optIdx) => ({
        key: `question_${q.id}_option_${optIdx}`,
        label: `Question ${qIdx + 1} Option ${optIdx + 1}`,
        isValid: !!getOptionLabel(opt).trim(),
        ref: { current: optionRefs.current[`${q.id}_${optIdx}`] }
      }))
    )
  ];

  const { isFormComplete, handleBlockedSubmit } = useFormValidationUX(validationFields);

  // Handle Edit Mode Data Initialization
  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || "");
      setCategoryId(initialData.category || "");
      
      // Fetch full details to get the deep fields (instruction text, media urls, and questions)
      fetchInspectionChecklistDetail(initialData.id)
        .then(detail => {
          if (detail.instruction_text) {
            setInstructionText(detail.instruction_text);
          }
          if (detail.instructional_media_urls && Array.isArray(detail.instructional_media_urls)) {
            setExistingMediaUrls(detail.instructional_media_urls);
          } else if (detail.instructional_media) {
            setExistingMediaUrls([detail.instructional_media]);
          }

          if (detail.questions && detail.questions.length > 0) {
            setQuestions(detail.questions.map(q => ({
              id: q.id || Date.now() + Math.random(),
              text: q.text || "",
              options: (q.options || ["Yes", "No", "N/A"]).map(opt => 
                typeof opt === "string" 
                  ? { label: opt, choice: opt.toLowerCase() === "no" ? "N" : "P" } 
                  : { label: opt.label || opt.name || opt.title || opt.text || "", choice: opt.choice || "P" }
              ),
              photoRequired: !!q.photo_required,
            })));
          }
        })
        .catch(err => {
          console.error("Failed to load template details:", err);
          // Fallback to initialData if detail fetch fails
          setInstructionText(initialData.instruction_text || "");
          if (initialData.instructional_media_urls && Array.isArray(initialData.instructional_media_urls)) {
            setExistingMediaUrls(initialData.instructional_media_urls);
          } else if (initialData.instructional_media) {
            setExistingMediaUrls([initialData.instructional_media]);
          }
          if (initialData.questions && initialData.questions.length > 0) {
            setQuestions(initialData.questions.map(q => ({
              id: q.id || Date.now() + Math.random(),
              text: q.text || "",
              options: (q.options || ["Yes", "No", "N/A"]).map(opt => 
                typeof opt === "string" 
                  ? { label: opt, choice: opt.toLowerCase() === "no" ? "N" : "P" } 
                  : { label: opt.label || opt.name || opt.title || opt.text || "", choice: opt.choice || "P" }
              ),
              photoRequired: !!q.photo_required,
            })));
          }
        });
    }
  }, [initialData]);

  // ─── Excel Auto-Parse ─────────────────────────────────────────────────────────
  const handleExcelUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setExcelFileName(file.name);

    // Added comment: Local helper to parse raw option string and extract explicit choice suffixes like (P) or (N)
    const parseOptionStr = (str) => {
      let label = String(str || "").trim();
      let choice = "P"; // default to pass
      if (label.endsWith("(P)") || label.endsWith("(p)")) {
        label = label.substring(0, label.length - 3).trim();
        choice = "P";
      } else if (label.endsWith("(N)") || label.endsWith("(n)")) {
        label = label.substring(0, label.length - 3).trim();
        choice = "N";
      } else if (label.toLowerCase() === "no") {
        choice = "N";
      }
      return { label, choice };
    };

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const workbook = XLSX.read(evt.target.result, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });

        if (rows.length < 2) {
          return toast.error("Excel file is empty or missing data rows.");
        }

        const extractedQuestions = [];

        // 1. Scan rows to find the main header row containing "Checkpoint" or "Question"
        let headerRowIndex = -1;
        let qCol = -1;
        let rCol = -1;

        for (let r = 0; r < Math.min(rows.length, 30); r++) {
          const row = rows[r] || [];
          const qIdx = row.findIndex((cell) => {
            const val = String(cell || "").trim().toLowerCase();
            return val === "checkpoints" || val === "checkpoint" || val === "question" || val === "questions";
          });
          if (qIdx !== -1) {
            headerRowIndex = r;
            qCol = qIdx;

            // Find "Remarks" column in the same row or the next row
            rCol = row.findIndex((cell) => String(cell || "").trim().toLowerCase() === "remarks");
            if (rCol === -1 && rows[r + 1]) {
              rCol = rows[r + 1].findIndex((cell) => String(cell || "").trim().toLowerCase() === "remarks");
            }
            break;
          }
        }

        // 2. Determine import mode
        if (headerRowIndex !== -1 && qCol !== -1) {
          const headers = rows[headerRowIndex] || [];
          const headerLower = headers.map(h => String(h || "").trim().toLowerCase());
          const optCol = headerLower.findIndex(h => h.includes("options"));
          const photoCol = headerLower.findIndex(h => h.includes("photorequired") || h.includes("photo required"));

          if (optCol !== -1) {
            // A. Structured Import (has explicit 'options' column)
            const dataRows = rows.slice(headerRowIndex + 1);
            dataRows.forEach((row, ri) => {
              const text = String(row[qCol] ?? "").trim();
              if (text && !text.toLowerCase().includes("comments/action") && !text.toLowerCase().includes("inspected by")) {
                let rawOptions = ["Yes", "No", "N/A"];
                if (row[optCol]) {
                  rawOptions = String(row[optCol]).split("|").map(s => s.trim()).filter(Boolean);
                }
                let photoRequired = false;
                if (photoCol !== -1 && row[photoCol]) {
                  const val = String(row[photoCol]).trim().toLowerCase();
                  photoRequired = val === "true" || val === "yes" || val === "1";
                }
                extractedQuestions.push({
                  id: Date.now() + ri,
                  text,
                  photoRequired,
                  options: rawOptions.map(parseOptionStr),
                });
              }
            });
          } else if (rCol !== -1 && rCol > qCol + 1) {
            // B. Column-based options Import (options are subheaders between checkpoints and remarks)
            // Extract the option names from column qCol + 1 to rCol - 1
            const parsedOptions = [];
            for (let c = qCol + 1; c < rCol; c++) {
              let optVal = String(rows[headerRowIndex]?.[c] || "").trim();
              const subHeaderVal = String(rows[headerRowIndex + 1]?.[c] || "").trim();
              // If top cell is "status" or empty, use the subheader cell value
              if (!optVal || optVal.toLowerCase() === "status") {
                optVal = subHeaderVal;
              }
              if (optVal) {
                parsedOptions.push(optVal);
              } else if (subHeaderVal) {
                parsedOptions.push(subHeaderVal);
              }
            }

            const rawOptions = parsedOptions.length > 0 ? parsedOptions : ["Yes", "No", "N/A"];

            // Determine if there is a subheader row that we need to skip
            let actualStartRow = headerRowIndex + 1;
            const testCell = String(rows[headerRowIndex + 1]?.[qCol] || "").trim().toLowerCase();
            if (!testCell || testCell === "checkpoints" || testCell === "checkpoint" || testCell === "question") {
              actualStartRow = headerRowIndex + 2;
            }

            const dataRows = rows.slice(actualStartRow);
            dataRows.forEach((row, ri) => {
              const text = String(row[qCol] ?? "").trim();
              // Stop parsing if we hit comments or signatures
              if (text.toLowerCase().includes("comments/action") || text.toLowerCase().includes("inspected by")) {
                return;
              }
              if (text && text.length > 3) {
                extractedQuestions.push({
                  id: Date.now() + ri,
                  text,
                  photoRequired: false,
                  options: rawOptions.map(parseOptionStr),
                });
              }
            });
          } else {
            // C. Fallback structured but simple
            const dataRows = rows.slice(headerRowIndex + 1);
            dataRows.forEach((row, ri) => {
              const text = String(row[qCol] ?? "").trim();
              if (text && !text.toLowerCase().includes("comments/action") && !text.toLowerCase().includes("inspected by")) {
                extractedQuestions.push({
                  id: Date.now() + ri,
                  text,
                  photoRequired: false,
                  options: ["Yes", "No", "N/A"].map(parseOptionStr),
                });
              }
            });
          }
        } else {
          // Unstructured Fallback
          const headers = rows[0] || [];
          const dataRows = rows.slice(1);
          let bestCol = 0, bestAvg = 0;
          headers.forEach((_, ci) => {
            const avg = dataRows.reduce((s, r) => s + String(r[ci] ?? "").length, 0) / (dataRows.length || 1);
            if (avg > bestAvg) { bestAvg = avg; bestCol = ci; }
          });

          dataRows.forEach((row, ri) => {
            const text = String(row[bestCol] ?? "").trim();
            if (text.length > 10) {
              let isQuestion = false;
              for (let c = 0; c < Math.min(3, row.length); c++) {
                const cell = String(row[c] ?? "").trim();
                if (/^\d+$/.test(cell) && Number(cell) <= 100 && Number(cell) >= 1) {
                  isQuestion = true;
                  break;
                }
              }
              if (!isQuestion && text.length > 15 && !text.toUpperCase().includes("PROJECT") && !text.toUpperCase().includes("DATE")) {
                isQuestion = true;
              }
              if (isQuestion) {
                extractedQuestions.push({
                  id: Date.now() + ri,
                  text,
                  photoRequired: false,
                  options: ["Yes", "No", "N/A"].map(parseOptionStr),
                });
              }
            }
          });
        }

        if (extractedQuestions.length > 0) {
          setQuestions(extractedQuestions);
          toast.success(`Successfully auto-parsed ${extractedQuestions.length} questions from Excel!`);
        } else {
          toast.error("Could not find any clear questions in the Excel file. Please enter manually.");
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to parse Excel file.");
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  };

  // ─── Image Upload ─────────────────────────────────────────────────────────────
  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setMediaFiles(prev => [...prev, ...files]);
    setMediaPreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
    e.target.value = "";
  };



  // ─── Question Management ──────────────────────────────────────────────────────
  const handleAddQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      { id: Date.now(), text: "", photoRequired: false, options: [{ label: "Yes", choice: "P" }, { label: "No", choice: "N" }, { label: "N/A", choice: "P" }] },
    ]);
  };

  const handleRemoveQuestion = (id) => {
    if (questions.length > 1) setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const handleQuestionChange = (id, field, value) => {
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, [field]: value } : q)));
  };

  const handleAddOption = (questionId) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === questionId ? { ...q, options: [...q.options, { label: "Option", choice: "P" }] } : q))
    );
  };

  const handleOptionChange = (questionId, index, value) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== questionId) return q;
        const opts = [...q.options];
        const existingOpt = opts[index];
        if (typeof existingOpt === "string") {
          opts[index] = { label: value, choice: value.toLowerCase() === "no" ? "N" : "P" };
        } else {
          opts[index] = { ...existingOpt, label: value };
        }
        return { ...q, options: opts };
      })
    );
  };

  // Added comment: toggleChoice updates option's choice value between P (Pass) and N (Fail)
  const toggleChoice = (questionId, index) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== questionId) return q;
        const opts = [...q.options];
        const existingOpt = opts[index];
        const currentChoice = getOptionChoice(existingOpt);
        const nextChoice = currentChoice === "P" ? "N" : "P";
        if (typeof existingOpt === "string") {
          opts[index] = { label: existingOpt, choice: nextChoice };
        } else {
          opts[index] = { ...existingOpt, choice: nextChoice };
        }
        return { ...q, options: opts };
      })
    );
  };

  const handleRemoveOption = (questionId, index) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== questionId) return q;
        const opts = [...q.options];
        opts.splice(index, 1);
        return { ...q, options: opts };
      })
    );
  };

  // ─── Category Creation ────────────────────────────────────────────────────────
  const handleCreateCategory = async (e) => {
    e?.preventDefault();
    const name = newCategoryName.trim();
    if (!name) return toast.error("Category name cannot be empty.");
    
    try {
      const payload = {
        name,
        org_id: orgId || 1,
        project_id: projectId || 1,
        active: true,
      };
      const res = await createSafetyCategory(payload);
      const newCat = res.data || res;
      setCategories((prev) => [...prev, newCat]);
      setCategoryId(newCat.id);
      setIsCategoryModalOpen(false);
      setNewCategoryName("");
      toast.success("Category created!");
    } catch (err) {
      console.error("Create Category Error:", err);
      
      const responseData = err.response?.data || {};
      const isUniqueError = 
        responseData.non_field_errors?.some(msg => msg.toLowerCase().includes("unique")) ||
        JSON.stringify(responseData).toLowerCase().includes("unique") ||
        JSON.stringify(responseData).toLowerCase().includes("already exists");
        
      if (err.response?.status === 400 && isUniqueError) {
        try {
          const list = await fetchSafetyCategories({ orgId, projectId });
          setCategories(list);
          const existing = list.find(c => c.name.toLowerCase() === name.toLowerCase());
          if (existing) {
            setCategoryId(existing.id);
            setIsCategoryModalOpen(false);
            setNewCategoryName("");
            toast.success(`Category "${existing.name}" already exists. Selected existing category.`);
            return;
          }
        } catch (fetchErr) {
          console.error("Failed to re-fetch categories:", fetchErr);
        }
        toast.error("Category name must be unique.");
      } else {
        const serverMsg = responseData.non_field_errors?.[0] || 
                          responseData.name?.[0] || 
                          responseData.detail || 
                          responseData.message || 
                          "Failed to create category.";
        toast.error(typeof serverMsg === "string" ? serverMsg : "Failed to create category.");
      }
    }
  };

  const handleDeleteCategory = async () => {
    if (!categoryId) return;
    const categoryToDelete = categories.find(c => String(c.id) === String(categoryId));
    if (!categoryToDelete) return;
    
    if (!window.confirm(`Are you sure you want to delete the category "${categoryToDelete.name}"?`)) {
      return;
    }
    
    try {
      await deleteSafetyCategory(categoryId);
      toast.success(`Category "${categoryToDelete.name}" deleted successfully.`);
      setCategories(prev => prev.filter(c => String(c.id) !== String(categoryId)));
      setCategoryId("");
    } catch (err) {
      console.error("Delete Category Error:", err);
      toast.error("Failed to delete category.");
    }
  };

  // Helper to fetch/read image or local file as base64
  const fetchImageOrFileAsBase64 = async (item) => {
    if (!item) return null;
    if (item instanceof File) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve({
            base64: reader.result.split(',')[1],
            mimeType: item.type
          });
        };
        reader.onerror = reject;
        reader.readAsDataURL(item);
      });
    }
    // Remote URL
    try {
      const response = await fetch(item);
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
      console.warn("Failed to fetch image:", item, err);
      return null;
    }
  };
  const addImageToWorksheet = async (workbook, worksheet, item, startRow, colOffset = 0.1) => {
    const fetchFn = fetchImageOrFileAsBase64;
    const imgData = await fetchFn(item);
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


  // ─── Download Preview Excel ─────────────────────────────────────────────────
  const handleDownloadPreviewExcel = async () => {
    if (questions.every((q) => !q.text.trim())) {
      return toast.error("Add at least one question before downloading.");
    }

    const catName = categories.find((c) => String(c.id) === String(categoryId))?.name || "—";
    const dateStr = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

    // Determine if all questions have the exact same options (homogeneous)
    const activeQuestions = questions.filter((q) => q.text.trim());
    const firstOpt = activeQuestions[0]?.options || [];
    const hasUniformOptions = activeQuestions.length > 0 && activeQuestions.every(q => 
      q.options && 
      q.options.length === firstOpt.length &&
      q.options.every((o, i) => getOptionLabel(o) === getOptionLabel(firstOpt[i]))
    );

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet((title || "Checklist").substring(0, 31));

    // Safe merge helper to prevent RangeError/overlap crashes in ExcelJS
    const safeMerge = (sheet, r1, c1, r2, c2) => {
      if (r1 === r2 && c1 === c2) return;
      try {
        sheet.mergeCells(r1, c1, r2, c2);
      } catch (err) {
        console.warn("Merge failed:", r1, c1, r2, c2, err);
      }
    };

    // Setup columns
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

    // Fetch logo from initialData if available, otherwise fallback to text
    const leftLogoUrl = initialData?.report_logo;
    const leftLogo = leftLogoUrl ? await fetchImageOrFileAsBase64(leftLogoUrl) : null;
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
    } else {
      worksheet.getCell(1, 1).value = "Horizon Industrial Parks";
      worksheet.getCell(1, 1).alignment = { vertical: 'middle', horizontal: 'left' };
      worksheet.getCell(1, 1).font = { name: 'Arial', bold: true, size: 10, color: { argb: '006633' } };
    }

    const centerColIdx = Math.floor(totalCols / 2);
    worksheet.getCell(1, centerColIdx).value = "PMC's Logo";
    worksheet.getCell(1, centerColIdx).alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getCell(1, centerColIdx).font = { name: 'Arial', color: { argb: '999999' }, italic: true, size: 9 };

    const rightLogoUrl = initialData?.report_logo_right;
    const rightLogo = rightLogoUrl ? await fetchImageOrFileAsBase64(rightLogoUrl) : null;
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
    const titleRow = worksheet.addRow([`CHECKLIST FOR ${(title || "Untitled").toUpperCase()}`]);
    titleRow.height = 30;
    safeMerge(worksheet, 2, 1, 2, totalCols);
    const cell2 = worksheet.getCell(2, 1);
    cell2.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFC000' }
    };
    cell2.font = { name: 'Arial', bold: true, size: 14, color: { argb: '000000' } };
    cell2.alignment = { vertical: 'middle', horizontal: 'center' };
    cell2.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };

    // Rows 3-5: Metadata
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

    // Row 6+: Diagram/Instructional Media (combining existingMediaUrls and mediaFiles side-by-side)
    let currentRow = 6;
    const mediaItems = [...existingMediaUrls, ...mediaFiles];
    if (mediaItems.length > 0) {
      // Chunk media items into groups of 3
      for (let i = 0; i < mediaItems.length; i += 3) {
        const chunk = mediaItems.slice(i, i + 3);
        
        // Add 11 rows for this chunk
        const imageRowsCount = 11;
        for (let r = 0; r < imageRowsCount; r++) {
          worksheet.addRow([]);
          worksheet.getRow(currentRow + r).height = 20;
        }

        // Add images for this chunk side by side
        // Using approximate column offsets: Col A (0.1), Col C (2.5), Col E/F (4.5) depending on actual widths
        // Since Col A is width 8, Col B is 58, Col C is 35...
        // 0.1 starts at the left edge.
        // 1.4 starts roughly half way through col B (which is very wide)
        // 2.2 starts near the end of col B / beginning of col C
        const colOffsets = [0.1, 1.4, 2.8]; 
        for (let j = 0; j < chunk.length; j++) {
           await addImageToWorksheet(workbook, worksheet, chunk[j], currentRow, colOffsets[j]);
        }
        
        currentRow += imageRowsCount;
        
        // Spacer row
        worksheet.addRow([]);
        worksheet.getRow(currentRow).height = 15;
        currentRow++;
      }
    } else {
      worksheet.addRow([]);
      currentRow++;
    }

    // Table Headers
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
    activeQuestions.forEach((q, idx) => {
      const serial = idx + 1;
      const text = q.text.trim();
      
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

    const buf = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const safeName = (title || "checklist").replace(/[^a-zA-Z0-9\s.\-_]/g, "").trim();
    saveAs(blob, `${safeName}_preview.xlsx`);
    toast.success("Preview Excel downloaded!");
  };

  // ─── Download Upload Template ───────────────────────────────────────────────
  const handleDownloadImportTemplate = () => {
    const headers = [["Question", "Options", "PhotoRequired"]];
    const sampleRows = [
      ["What is the quality?", "Good(P) | Bad(N) | Average(P)", "FALSE"],
      ["Check alignment", "Aligned(P) | Not Aligned(N)", "TRUE"],
      ["Is safety harness worn?", "Yes(P) | No(N)", "TRUE"]
    ];
    const aoa = [...headers, ...sampleRows];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws["!cols"] = [{ width: 35 }, { width: 35 }, { width: 15 }];
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    saveAs(blob, "checklist_bulk_upload_template.xlsx");
    toast.success("Bulk Upload Template downloaded!");
  };

  // ─── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const validationErrors = {};
    if (!title.trim()) {
      validationErrors.title = "Checklist name is required.";
    }
    if (!categoryId) {
      validationErrors.category = "Please select a category.";
    }
    
    questions.forEach((q, idx) => {
      if (!q.text.trim()) {
        validationErrors[`question-${q.id}-text`] = `Question ${idx + 1} text is required.`;
      }
      if (!q.options || q.options.length === 0) {
        validationErrors[`question-${q.id}-options`] = `Question ${idx + 1} must have at least one option.`;
      } else {
        q.options.forEach((opt, optIdx) => {
          const label = getOptionLabel(opt);
          if (!label.trim()) {
            validationErrors[`question-${q.id}-option-${optIdx}`] = "Option text cannot be empty.";
          }
        });
      }
    });

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error("Please fill in all required fields.");
      
      const firstErrorKey = Object.keys(validationErrors)[0];
      let scrollId = "";
      if (firstErrorKey === "title") {
        scrollId = "title-input";
      } else if (firstErrorKey === "category") {
        scrollId = "category-select";
      } else if (firstErrorKey.startsWith("question-") && firstErrorKey.endsWith("-text")) {
        const qId = firstErrorKey.split("-")[1];
        scrollId = `question-input-${qId}`;
      } else if (firstErrorKey.startsWith("question-") && firstErrorKey.includes("-option-")) {
        const parts = firstErrorKey.split("-");
        const qId = parts[1];
        const optIdx = parts[3];
        scrollId = `question-${qId}-option-input-${optIdx}`;
      } else if (firstErrorKey.startsWith("question-") && firstErrorKey.endsWith("-options")) {
        const qId = firstErrorKey.split("-")[1];
        scrollId = `question-options-${qId}`;
      }

      if (scrollId) {
        setTimeout(() => {
          const el = document.getElementById(scrollId);
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
            el.focus();
          }
        }, 100);
      }
      return;
    }

    setErrors({});

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("title", title.trim());
      
      // Ensure template_code is completely unique by appending a timestamp to avoid DB UniqueConstraint errors.
      const baseCode = title.trim().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
      formData.append("template_code", `${baseCode}_${Date.now()}`);
      
      formData.append("category", categoryId);
      formData.append("org_id", orgId || "1");
      formData.append("project_id", projectId || "1");
      formData.append("instruction_text", instructionText);
      formData.append(
        "questions",
        // Added comment: serialize each option as an object with label and choice ('P' or 'N') keys to preserve custom Pass/Fail mapping in the backend
        JSON.stringify(
          questions.map((q, i) => ({
            order_index: i + 1,
            text: q.text,
            type: "multiple_choice",
            options: q.options.map(opt => ({
              label: getOptionLabel(opt),
              choice: getOptionChoice(opt)
            })),
            required: false,
            photo_required: q.photoRequired,
          }))
        )
      );
      formData.append("header_fields", JSON.stringify([]));
      formData.append("flow_config", JSON.stringify([]));
      mediaFiles.forEach(file => formData.append("instructional_media", file));
      formData.append("kept_media_urls", JSON.stringify(existingMediaUrls));

      if (initialData) {
        await updateInspectionChecklist(initialData.id, formData);
        toast.success("Template updated — changes apply to new checklists only. Existing checklists are not affected.");
      } else {
        await createInspectionChecklist(formData);
        toast.success("Checklist template created successfully!");
      }
      
      onCreated?.();
      onBack();
    } catch (err) {
      console.error("API Error Response:", err?.response?.data);
      const errMsg = err?.response?.data 
        ? JSON.stringify(err.response.data) 
        : `Failed to ${initialData ? "update" : "create"} checklist.`;
      toast.error(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleInstructionKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      
      const textarea = e.target;
      const { selectionStart, selectionEnd, value } = textarea;

      const beforeCursor = value.substring(0, selectionStart);
      const afterCursor = value.substring(selectionEnd);
      
      const currentLineStart = beforeCursor.lastIndexOf('\n') + 1;
      const currentLine = beforeCursor.substring(currentLineStart);
      
      let newText = value;
      let newCursorPos = selectionStart;

      const bulletRegex = /^(\s*)•\s*/;
      const numberRegex = /^(\s*)(\d+)\.\s*/;

      if (bulletRegex.test(currentLine)) {
        const match = currentLine.match(bulletRegex);
        const indent = match[1];
        
        if (currentLine.trim() === '•') {
          // Empty bullet line, remove bullet and add newline
          newText = beforeCursor.substring(0, currentLineStart) + '\n' + afterCursor;
          newCursorPos = currentLineStart + 1;
        } else {
          // Add another bullet
          const insertText = '\n' + indent + '• ';
          newText = beforeCursor + insertText + afterCursor;
          newCursorPos = selectionStart + insertText.length;
        }
      } else if (numberRegex.test(currentLine)) {
        const match = currentLine.match(numberRegex);
        const indent = match[1];
        const num = parseInt(match[2], 10);
        
        if (currentLine.trim() === `${num}.`) {
          // Empty number line, remove number and add newline
          newText = beforeCursor.substring(0, currentLineStart) + '\n' + afterCursor;
          newCursorPos = currentLineStart + 1;
        } else {
          // Add next number
          const insertText = '\n' + indent + (num + 1) + '. ';
          newText = beforeCursor + insertText + afterCursor;
          newCursorPos = selectionStart + insertText.length;
        }
      } else {
        if (currentLine.trim().length > 0) {
          const textBeforeLine = beforeCursor.substring(0, currentLineStart);
          const lineContent = beforeCursor.substring(currentLineStart);
          
          newText = textBeforeLine + '• ' + lineContent + '\n• ' + afterCursor;
          newCursorPos = selectionStart + 5; 
        } else {
          // Empty line, just start a bullet
          const insertText = '• ';
          newText = beforeCursor + insertText + afterCursor;
          newCursorPos = selectionStart + insertText.length;
        }
      }
      
      setInstructionText(newText);
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = newCursorPos;
      }, 0);
    }
  };

  // ─── Main Form ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6 w-full pb-10">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <h1 className="text-xl font-bold text-gray-800">
          {initialData ? "Edit Inspection Checklist" : "Create Inspection Checklist"}
        </h1>
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      </div>

      {/* QHSE Checklist Form Header & Controls: Basic Info + Bulk Upload.
          The grid layout uses `items-start` to ensure inputs align properly with the upload button
          even if validation warnings or conditional helper text are displayed beneath them. */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
        <div ref={titleRef} className="transition-all duration-300">
          <label className="block text-sm font-medium text-gray-700 mb-1">Checklist Name *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (errors.title) setErrors(prev => ({ ...prev, title: null }));
            }}
            id="title-input"
            placeholder="e.g. Daily Safety Inspection"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 text-sm ${
              errors.title
                ? "border-red-500 focus:ring-red-500 focus:border-red-500 ring-1 ring-red-500"
                : "border-gray-300 focus:ring-orange-500 focus:border-orange-500"
            }`}
          />
          {errors.title && (
            <p className="text-xs text-red-500 mt-1 font-semibold">{errors.title}</p>
          )}
        </div>
        <div ref={categoryRef} className="transition-all duration-300">
          <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
          <div className="flex flex-col gap-1 w-full">
            <div className="flex items-center gap-2 w-full">
              <select
                id="category-select"
                value={categoryId}
                onChange={(e) => {
                  if (e.target.value === "CREATE_NEW") {
                    setIsCategoryModalOpen(true);
                  } else {
                    setCategoryId(e.target.value);
                    if (errors.category) setErrors(prev => ({ ...prev, category: null }));
                  }
                }}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 bg-white text-sm ${
                  errors.category
                    ? "border-red-500 focus:ring-red-500 focus:border-red-500 ring-1 ring-red-500"
                    : "border-gray-300 focus:ring-orange-500 focus:border-orange-500"
                }`}
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
                <option value="CREATE_NEW" className="font-semibold text-orange-600">
                  + Add New Category
                </option>
              </select>
              {categoryId && (
                <button
                  type="button"
                  onClick={handleDeleteCategory}
                  className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md border border-gray-200 transition-colors shadow-sm bg-white"
                  title="Delete selected category"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            {errors.category && (
              <p className="text-xs text-red-500 mt-1 font-semibold">{errors.category}</p>
            )}
          </div>
        </div>
        <div>
          {/* &nbsp; Label matches height of input labels for vertical alignment */}
          <label className="block text-sm font-medium text-gray-700 mb-1">&nbsp;</label>
          <input
            type="file"
            ref={excelInputRef}
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={handleExcelUpload}
          />
          {/* Styled Orange Upload Button: Custom colors/border matching ref image */}
          <button
            type="button"
            onClick={() => excelInputRef.current?.click()}
            className="w-full py-2 flex items-center justify-center gap-2 px-4 bg-orange-50 border border-orange-200 rounded-md hover:bg-orange-100/50 hover:border-orange-300 text-sm font-semibold text-orange-600 transition-colors shadow-sm"
          >
            <Upload className="w-4 h-4 text-orange-500" />
            {excelFileName ? (
              <span className="truncate text-green-600 flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3 h-3" /> {excelFileName}
              </span>
            ) : (
              "Upload"
            )}
          </button>
          {excelFileName && (
            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
              <FileSpreadsheet className="w-3 h-3" /> {questions.length} questions loaded
            </p>
          )}
        </div>
      </div>

      {/* QHSE Checklist Instructions & Media:
          Renders the instruction text area on top, and the media row below. */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm flex flex-col gap-4">
        <div>
          <h2 className="text-base font-bold text-gray-900 mb-1">Checklist Instructions</h2>
        </div>



        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-800">Instructional Media</h3>
              <p className="text-[10px] font-medium text-gray-400 mt-0.5">
                ALLOWED: JPG, PNG, WEBP (MAX 5MB EACH)
              </p>
            </div>
            <div>
              <input
                type="file"
                ref={imageInputRef}
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleImageSelect}
              />
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:text-gray-900 hover:border-gray-400 transition-colors shadow-sm"
              >
                <ImageIcon className="w-3.5 h-3.5 text-gray-500" />
                Add Image
              </button>
            </div>
          </div>

          <div className="flex flex-row flex-wrap gap-3 items-center">
            {/* Existing Media URLs */}
            {existingMediaUrls.map((url, i) => {
              const src = url.startsWith("http") 
                ? url 
                : (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" 
                    ? `http://127.0.0.1:8001${url.startsWith("/") ? url : "/" + url}` 
                    : `${window.location.protocol}//${window.location.host}${url.startsWith("/") ? url : "/" + url}`);
              return (
                <div key={`existing-${i}`} className="relative w-20 h-20 border border-gray-200 rounded-lg overflow-hidden shadow-sm group">
                  <img src={src} alt={`existing-${i}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      setExistingMediaUrls(prev => prev.filter((_, idx) => idx !== i));
                    }}
                    className="absolute top-1 right-1 bg-white/80 rounded-full p-1 text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors shadow-sm"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}

            {/* New Media Previews */}
            {mediaPreviews.map((preview, i) => (
              <div key={`new-${i}`} className="relative w-20 h-20 border border-gray-200 rounded-lg overflow-hidden shadow-sm group">
                <img src={preview} alt={`preview-${i}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => {
                    setMediaFiles(prev => prev.filter((_, idx) => idx !== i));
                    setMediaPreviews(prev => prev.filter((_, idx) => idx !== i));
                  }}
                  className="absolute top-1 right-1 bg-white/80 rounded-full p-1 text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors shadow-sm"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            {/* Dashed New Tile */}
            {/* <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              className="flex flex-col items-center justify-center w-20 h-20 border-2 border-dashed border-gray-200 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors bg-white shrink-0"
            >
              <Plus className="w-5 h-5 mb-1 text-gray-400" />
              <span className="text-[11px] font-medium text-gray-500">New</span>
            </button> */}
          </div>
        </div>

        <div className="w-full">
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Instruction Text</label>
          <textarea
            value={instructionText}
            onChange={(e) => setInstructionText(e.target.value)}
            onKeyDown={handleInstructionKeyDown}
            placeholder="Provide clear step-by-step instructions for the field workers completing this checklist..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 text-sm min-h-[100px] resize-y"
          />
        </div>

      </div>

      {/* Questions Builder */}
      <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-bold text-gray-800">Questions Builder</h2>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
            {questions.length} question{questions.length !== 1 ? "s" : ""}
          </span>
        </div>




        {questions.map((q, index) => (
          <div 
            ref={el => { questionRefs.current[q.id] = el; }}
            key={q.id} 
            id={`question-${q.id}`} 
            className="mb-6 pb-6 border-b border-gray-100 last:border-0 last:mb-0 last:pb-0 transition-all duration-300"
          >
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Question {index + 1}</label>
                <input
                  type="text"
                  id={`question-input-${q.id}`}
                  value={q.text}
                  onChange={(e) => {
                    handleQuestionChange(q.id, "text", e.target.value);
                    if (errors[`question-${q.id}-text`]) {
                      setErrors(prev => ({ ...prev, [`question-${q.id}-text`]: null }));
                    }
                  }}
                  placeholder="Enter question text here..."
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 text-sm ${
                    errors[`question-${q.id}-text`]
                      ? "border-red-500 focus:ring-red-500 focus:border-red-500 ring-1 ring-red-500"
                      : "border-gray-300 focus:ring-orange-500 focus:border-orange-500"
                  }`}
                />
                {errors[`question-${q.id}-text`] && (
                  <p className="text-xs text-red-500 mt-1 font-semibold">{errors[`question-${q.id}-text`]}</p>
                )}
              </div>
              {questions.length > 1 && (
                <button
                  onClick={() => handleRemoveQuestion(q.id)}
                  className="mt-6 text-red-500 hover:text-red-700 text-xs font-medium flex items-center gap-1 shrink-0"
                >
                  <Trash2 className="w-3 h-3" /> Remove
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 mb-3">
              <input
                type="checkbox"
                id={`photo-${q.id}`}
                checked={q.photoRequired}
                onChange={(e) => handleQuestionChange(q.id, "photoRequired", e.target.checked)}
                className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
              />
              <label htmlFor={`photo-${q.id}`} className="text-sm text-gray-600 cursor-pointer">
                Photo attachment required mandatory or not
              </label>
            </div>
            <div className="bg-gray-50 rounded-md p-3 border border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 border-b border-gray-200 pb-2">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Response Options</label>
                
                {/* Added comment: Quick preset buttons so users can instantly apply standard checklists */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] text-gray-400 font-medium">Quick Presets:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setQuestions(prev => prev.map(quest => quest.id === q.id ? {
                        ...quest,
                        options: [
                          { label: "Yes", choice: "P" },
                          { label: "No", choice: "N" },
                          { label: "N/A", choice: "P" }
                        ]
                      } : quest));
                      toast.success("Applied Yes / No / N/A preset");
                    }}
                    className="text-[10px] text-orange-600 bg-white border border-gray-200 hover:border-orange-300 px-2 py-0.5 rounded shadow-sm transition-all"
                  >
                    Yes / No / N/A
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setQuestions(prev => prev.map(quest => quest.id === q.id ? {
                        ...quest,
                        options: [
                          { label: "Compliant", choice: "P" },
                          { label: "Non-Compliant", choice: "N" },
                          { label: "N/A", choice: "P" }
                        ]
                      } : quest));
                      toast.success("Applied Compliant / Non-Compliant preset");
                    }}
                    className="text-[10px] text-orange-600 bg-white border border-gray-200 hover:border-orange-300 px-2 py-0.5 rounded shadow-sm transition-all"
                  >
                    Compliant / Non-Compliant
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setQuestions(prev => prev.map(quest => quest.id === q.id ? {
                        ...quest,
                        options: [
                          { label: "Safe", choice: "P" },
                          { label: "Unsafe", choice: "N" }
                        ]
                      } : quest));
                      toast.success("Applied Safe / Unsafe preset");
                    }}
                    className="text-[10px] text-orange-600 bg-white border border-gray-200 hover:border-orange-300 px-2 py-0.5 rounded shadow-sm transition-all"
                  >
                    Safe / Unsafe
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2" id={`question-options-${q.id}`}>
                {q.options.map((opt, i) => (
                  <div 
                    ref={el => { optionRefs.current[`${q.id}_${i}`] = el; }}
                    key={i} 
                    className="flex flex-col gap-0.5 transition-all duration-300"
                  >
                    <div
                      className={`flex items-center bg-white border rounded-md pl-2 pr-1.5 py-1 shadow-sm gap-2 ${
                        errors[`question-${q.id}-option-${i}`]
                          ? "border-red-500 ring-1 ring-red-500"
                          : "border-gray-200"
                      }`}
                    >
                      <input
                        type="text"
                        id={`question-${q.id}-option-input-${i}`}
                        value={getOptionLabel(opt)}
                        onChange={(e) => {
                          handleOptionChange(q.id, i, e.target.value);
                          if (errors[`question-${q.id}-option-${i}`]) {
                            setErrors(prev => ({ ...prev, [`question-${q.id}-option-${i}`]: null }));
                          }
                        }}
                        className="text-sm text-gray-700 bg-transparent outline-none w-20 border-0 focus:ring-0 focus:outline-none"
                      />
                      {/* Added comment: Dropdown select choice element (Pass/Fail) to make it clear and configurable */}
                      <select
                        value={getOptionChoice(opt)}
                        onChange={(e) => {
                          const nextChoice = e.target.value;
                          setQuestions((prev) =>
                            prev.map((quest) => {
                              if (quest.id !== q.id) return quest;
                              const opts = [...quest.options];
                              const existingOpt = opts[i];
                              if (typeof existingOpt === "string") {
                                opts[i] = { label: existingOpt, choice: nextChoice };
                              } else {
                                opts[i] = { ...existingOpt, choice: nextChoice };
                              }
                              return { ...quest, options: opts };
                            })
                          );
                        }}
                        className={`text-[10px] font-bold border rounded px-1.5 py-0.5 focus:outline-none cursor-pointer transition-colors ${
                          getOptionChoice(opt) === "P"
                            ? "bg-green-50 text-green-600 border-green-200"
                            : "bg-red-50 text-red-600 border-red-200"
                        }`}
                      >
                        <option value="P" className="bg-white text-green-600">Pass</option>
                        <option value="N" className="bg-white text-red-600">Fail</option>
                      </select>
                      {q.options.length > 1 && (
                        <button onClick={() => handleRemoveOption(q.id, i)} className="text-gray-400 hover:text-red-500 p-1">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    {errors[`question-${q.id}-option-${i}`] && (
                      <span className="text-[10px] text-red-500 font-semibold pl-1">
                        {errors[`question-${q.id}-option-${i}`]}
                      </span>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => handleAddOption(q.id)}
                  className="flex items-center gap-1 text-xs text-orange-600 hover:text-orange-700 px-3 py-1.5 font-medium border border-dashed border-orange-300 rounded-md bg-orange-50/50"
                >
                  <Plus className="w-3 h-3" /> Add Option
                </button>
              </div>
            </div>
          </div>
        ))}

        <button
          onClick={handleAddQuestion}
          className="w-full py-2.5 border border-dashed border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:text-orange-600 hover:border-orange-300 hover:bg-orange-50 transition-colors flex items-center justify-center gap-2 mt-4"
        >
          <Plus className="w-4 h-4" /> Add Question
        </button>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 mt-2">
        <button
          onClick={onBack}
          disabled={submitting}
          className="px-5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 shadow-sm transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        {/* <button
          onClick={handleDownloadPreviewExcel}
          disabled={submitting}
          className="px-5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 shadow-sm transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          <Download className="w-4 h-4" /> Download Excel
        </button> */}
        <button
          onClick={(e) => {
            if (submitting) return;
            if (!isFormComplete) {
              handleBlockedSubmit();
              return;
            }
            handleSubmit(e);
          }}
          aria-disabled={!isFormComplete || submitting ? "true" : "false"}
          style={{
            cursor: submitting ? "wait" : (!isFormComplete ? "not-allowed" : "pointer"),
            opacity: submitting || !isFormComplete ? 0.5 : 1,
            transition: "all 0.2s ease"
          }}
          className="px-6 py-2 text-sm font-medium text-white bg-green-500 border border-transparent rounded-md hover:bg-green-600 shadow-sm flex items-center gap-2"
        >
          {submitting ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> {initialData ? "Updating..." : "Creating..."}</>
          ) : (
            <><CheckCircle2 className="w-4 h-4" /> {initialData ? "Save Changes" : "Create Template"}</>
          )}
        </button>
      </div>

      {/* ── Custom Category Creation Modal ── */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-bold text-gray-800">Create New Category</h3>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateCategory} className="p-5 flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  autoFocus
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="e.g. Daily Safety Inspection"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 text-sm"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newCategoryName.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
