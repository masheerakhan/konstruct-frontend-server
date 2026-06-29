import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import {
  FileText,
  ChevronLeft,
  ChevronRight,
  Check,
  ClipboardList,
} from "lucide-react";
import TransmittalHeader from "./TransmittalHeader";
import DocTypeSelector from "./DocTypeSelector";
import MaterialTypeSelector from "./DocTypes/MaterialSubmission/MaterialTypeSelector";
import ProductBrandSelector from "./ProductBrandSelector";
import MaterialChecklist from "./DocTypes/MaterialSubmission/MaterialChecklist";
import ComplianceStatement from "./DocTypes/MaterialSubmission/ComplianceStatement";
import DocumentPreview from "./DocumentPreview";
import { useIsMobile } from "./useIsMobile";
import PQP from "./DocTypes/ProjectPlan/PQP";
import PQD from "./DocTypes/PrequalificationSubmission/PQD";
import DMP from "./DocTypes/DesignMixSubmission/DMP";
import WMS from "./DocTypes/MethodStatement/WMS";
import {
  createDefaultFormData,
  createComplianceTable,
  DEFAULT_MAS_DOCUMENT_NO,
  DEFAULT_FULL_SYSTEM_MAS_DOCUMENT_NO,
  DEFAULT_PQP_DOCUMENT_NO,
  DEFAULT_PQD_DOCUMENT_NO,
  DEFAULT_DMP_DOCUMENT_NO,
  DEFAULT_WMS_DOCUMENT_NO,
  DEFAULT_TEST_REPORT_DOCUMENT_NO,
  TEST_REPORT_TYPE_OPTIONS,
  INHOUSE_TEST_REPORT_OPTIONS,
  createDefaultFullSystemChecklist,
  createDefaultPqpAnnexRows,
  createFullSystemChecklistRow,
  getChecklistFilesList,
  getFullSystemRowComplianceTables,
  getDescriptionLabelForDocumentType,
  createDefaultWmsReferences,
  createDefaultWmsConstructionSequence,
  createDefaultWmsAnnexures,
  DEFAULT_CALIBRATION_CERTIFICATE_DOCUMENT_NO,
} from "./approvedVendors";

import {
  PQD_CHECKLIST_TYPE_OPTIONS,
  createPqdChecklistRowsForType,
} from "./pqdChecklists";

import CoreCutterMethod from "./DocTypes/TestReports/InhouseTestReports/CoreCutterMethod";
import SandReplacementMethod from "./DocTypes/TestReports/InhouseTestReports/SandReplacementMethod";
import ThirdPartyReport from "./DocTypes/TestReports/ThirdPartyReport/ThirdPartyReport";

import { createDefaultDmpChecklistRows } from "./dmpChecklists";
import {
  getDraft,
  addDraft,
  removeDraft,
  hasFormContent,
  setPendingAdd,
} from "./transmittalStorage";
import { capitalCase } from "./stringCase";
import DocumentTrackerSelectModal from "./DocumentTrackerSelectModal";
import { getTrackerDescription } from "./trackerDocumentData";

import CalibrationRegister, {
  createDefaultCalibrationCertificate,
} from "../MeasuringAndValodation/CalibrationRegister";

const section = {
  initial: { opacity: 0, height: 0 },
  animate: {
    opacity: 1,
    height: "auto",
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
  },
  exit: { opacity: 0, height: 0, transition: { duration: 0.2 } },
};

export default function CreateDocument() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const folderId = searchParams.get("folder");
  const draftId = searchParams.get("id");
  const preferredDocType = searchParams.get("docType");
  const pdfGeneratorRef = useRef(null);

  const rawReturnTo = searchParams.get("returnTo");

  const returnTo =
    rawReturnTo && rawReturnTo.startsWith("/documents")
      ? rawReturnTo
      : "/documents";

  const [formData, setFormData] = useState(() => {
    if (draftId) {
      const draft = getDraft(draftId);
      if (draft?.formData) return draft.formData;
    }
    return createDefaultFormData();
  });
  const [previewOpen, setPreviewOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isMobile = useIsMobile();

  const [documentTrackerModalOpen, setDocumentTrackerModalOpen] =
    useState(false);
  const [selectedTrackerDocument, setSelectedTrackerDocument] = useState(null);

  // const getCurrentDocumentType = () => {
  //   return (
  //     formData?.typeOfDocument ||
  //     formData?.document_type ||
  //     formData?.docType ||
  //     selectedDocumentType ||
  //     selectedDocType ||
  //     documentType ||
  //     ""
  //   );
  // };

  const getCurrentDocumentType = useCallback(() => {
    return formData?.documentType || preferredDocType || "";
  }, [formData?.documentType, preferredDocType]);

  // const handleSelectTrackerDocument = (trackerRow) => {
  //   const description = getTrackerDescription(trackerRow);

  //   setSelectedTrackerDocument(trackerRow);

  //   setFormData((prev) => ({
  //     ...prev,

  //     // Keep document type unchanged, because it is already selected from folder/dropdown.
  //     typeOfDocument: prev.typeOfDocument || getCurrentDocumentType(),

  //     // Use whichever field your CreateDocument currently renders.
  //     description,
  //     descriptionOfSubmission: description,
  //     materialDescription: description,
  //     documentDescription: description,
  //     submissionDescription: description,

  //     // Optional metadata for future backend usage.
  //     trackerDocumentId: trackerRow.id || "",
  //     trackerSrNo: trackerRow.sr_no || trackerRow.srNo || "",
  //   }));

  //   setDocumentTrackerModalOpen(false);
  // };

  const handleSelectTrackerDocument = useCallback(
    (trackerRow) => {
      const description = getTrackerDescription(trackerRow);

      setSelectedTrackerDocument(trackerRow);

      setFormData((prev) => ({
        ...prev,

        // This is the field your existing textareas are using.
        materialDescription: description,

        // Keep these for future backend/API mapping.
        trackerDocumentId: trackerRow.id || "",
        trackerSrNo: trackerRow.sr_no || trackerRow.srNo || "",
        trackerDocumentType:
          trackerRow.document_type ||
          trackerRow.documentType ||
          getCurrentDocumentType(),
      }));

      setDocumentTrackerModalOpen(false);
    },
    [getCurrentDocumentType],
  );

  const renderDocTypeSelectorWithTracker = (
    className = "min-w-0 flex-1 w-full max-w-[760px]",
  ) => {
    const currentDocumentType = getCurrentDocumentType();

    return (
      <div className={className}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          {/* Select from tracker */}
          <div className="shrink-0">
            <label className="mb-1.5 block text-[10px] uppercase tracking-wider font-bold text-gray-500 whitespace-nowrap">
              {capitalCase("select document from")}
            </label>

            <button
              type="button"
              onClick={() => setDocumentTrackerModalOpen(true)}
              disabled={!currentDocumentType}
              className="inline-flex h-9 items-center gap-2 rounded-sm border border-orange-200 bg-orange-50 px-3 text-xs font-semibold text-primary hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ClipboardList className="h-3.5 w-3.5" />
              {capitalCase("All Document Tracker")}
            </button>
          </div>

          {/* Document type dropdown */}
          <div className="min-w-0 w-full lg:w-[360px]">
            <label className="mb-1.5 block text-[10px] uppercase tracking-wider font-bold text-gray-500 whitespace-nowrap">
              {capitalCase("select document type")}
            </label>

            <DocTypeSelector
              selected={formData.documentType}
              onSelect={handleDocTypeSelect}
              showTitle={false}
            />
          </div>
        </div>

        {selectedTrackerDocument && (
          <div className="mt-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] text-emerald-700">
            {capitalCase("selected from tracker")}:{" "}
            <span className="font-semibold">
              {getTrackerDescription(selectedTrackerDocument)}
            </span>
          </div>
        )}
      </div>
    );
  };

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=14`,
            );
            const data = await res.json();
            const addr = data.address || {};
            const locationStr = [
              addr.suburb ||
                addr.neighbourhood ||
                addr.village ||
                addr.town ||
                "",
              addr.city || addr.state_district || "",
              addr.state || "",
            ]
              .filter(Boolean)
              .join(", ");
            setFormData((prev) => ({
              ...prev,
              location:
                locationStr ||
                `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
            }));
          } catch {
            setFormData((prev) => ({
              ...prev,
              location: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
            }));
          }
        },
        () => {
          setFormData((prev) => ({
            ...prev,
            location: "Location unavailable",
          }));
        },
      );
    }
  }, []);

  const update = useCallback(
    (patch) => setFormData((prev) => ({ ...prev, ...patch })),
    [],
  );

  const handleDocTypeSelect = (type) => {
    if (type === "Project Plans") {
      update({
        documentType: type,
        materialType: "",
        makeStatus: "",
        product: "",
        brand: "",
        materialRefNo: DEFAULT_PQP_DOCUMENT_NO,
        materialDescription: "",
        materialRemarks: "",
        areaOfApplication: "",
        specReference: "",
        checklistItem3Option: "Project Specification",
        checklistItem3SectionClass: "",
        pqpAnnexRows: createDefaultPqpAnnexRows(),
        pqdChecklistType: "",
        pqdChecklistRows: [],
        dmpChecklistRows: [],
        wmsScopeObjective: "",
        wmsReferences: createDefaultWmsReferences(),
        wmsConstructionSequence: createDefaultWmsConstructionSequence(),
        wmsAnnexures: createDefaultWmsAnnexures(),
      });
      return;
    }
    if (type === "Pre-Qualification") {
      update({
        documentType: type,
        materialType: "",
        makeStatus: "",
        product: "",
        brand: "",
        materialRefNo: DEFAULT_PQD_DOCUMENT_NO,
        materialDescription: "",
        materialRemarks: "",
        areaOfApplication: "",
        specReference: "",
        checklistItem3Option: "Project Specification",
        checklistItem3SectionClass: "",
        pqdChecklistType: "",
        pqdChecklistRows: [],
        dmpChecklistRows: [],
        wmsScopeObjective: "",
        wmsReferences: createDefaultWmsReferences(),
        wmsConstructionSequence: createDefaultWmsConstructionSequence(),
        wmsAnnexures: createDefaultWmsAnnexures(),
      });
      return;
    }
    if (type === "Design Mix") {
      update({
        documentType: type,
        materialType: "",
        makeStatus: "",
        product: "",
        brand: "",
        materialRefNo: DEFAULT_DMP_DOCUMENT_NO,
        materialDescription: "",
        materialRemarks: "",
        areaOfApplication: "",
        specReference: "",
        checklistItem3Option: "Project Specification",
        checklistItem3SectionClass: "",
        pqdChecklistType: "",
        pqdChecklistRows: [],
        dmpChecklistRows: createDefaultDmpChecklistRows(),
        wmsScopeObjective: "",
        wmsReferences: createDefaultWmsReferences(),
        wmsConstructionSequence: createDefaultWmsConstructionSequence(),
        wmsAnnexures: createDefaultWmsAnnexures(),
      });
      return;
    }
    if (type === "Method Statement") {
      update({
        documentType: type,
        materialType: "",
        makeStatus: "",
        product: "",
        brand: "",
        materialRefNo: DEFAULT_WMS_DOCUMENT_NO,
        materialDescription: "",
        materialRemarks: "",
        areaOfApplication: "",
        specReference: "",
        checklistItem3Option: "Project Specification",
        checklistItem3SectionClass: "",
        pqdChecklistType: "",
        pqdChecklistRows: [],
        dmpChecklistRows: [],
        wmsScopeObjective: "",
        wmsReferences: createDefaultWmsReferences(),
        wmsConstructionSequence: createDefaultWmsConstructionSequence(),
        wmsAnnexures: createDefaultWmsAnnexures(),
      });
      return;
    }
    if (type === "Test Reports") {
      update({
        documentType: type,
        materialType: "",
        makeStatus: "",
        product: "",
        brand: "",
        materialRefNo: DEFAULT_TEST_REPORT_DOCUMENT_NO,
        materialDescription: "",
        materialRemarks: "",
        areaOfApplication: "",
        specReference: "",
        checklistItem3Option: "Project Specification",
        checklistItem3SectionClass: "",
        pqdChecklistType: "",
        pqdChecklistRows: [],
        dmpChecklistRows: [],
        wmsScopeObjective: "",
        wmsReferences: createDefaultWmsReferences(),
        wmsConstructionSequence: createDefaultWmsConstructionSequence(),
        wmsAnnexures: createDefaultWmsAnnexures(),
        testReportType: "",
        inhouseTestReportType: "",
      });
      return;
    }
    if (type === "Calibration Certificate") {
      update({
        documentType: type,
        materialType: "",
        makeStatus: "",
        product: "",
        brand: "",
        materialRefNo: DEFAULT_CALIBRATION_CERTIFICATE_DOCUMENT_NO,
        materialDescription: "",
        materialRemarks: "",
        areaOfApplication: "",
        specReference: "",
        checklistItem3Option: "Project Specification",
        checklistItem3SectionClass: "",
        pqdChecklistType: "",
        pqdChecklistRows: [],
        dmpChecklistRows: [],
        wmsScopeObjective: "",
        wmsReferences: createDefaultWmsReferences(),
        wmsConstructionSequence: createDefaultWmsConstructionSequence(),
        wmsAnnexures: createDefaultWmsAnnexures(),
        testReportType: "",
        inhouseTestReportType: "",
        calibrationCertificate: createDefaultCalibrationCertificate(),
      });
      return;
    }
    update({
      documentType: type,
      materialType: "",
      makeStatus: "",
      product: "",
      brand: "",
      materialRefNo: "",
      materialDescription: "",
      checklistItem3Option: "Project Specification",
      pqdChecklistType: "",
      pqdChecklistRows: [],
      dmpChecklistRows: [],
      wmsScopeObjective: "",
      wmsReferences: createDefaultWmsReferences(),
      wmsConstructionSequence: createDefaultWmsConstructionSequence(),
      wmsAnnexures: createDefaultWmsAnnexures(),
      testReportType: "",
      inhouseTestReportType: "",
    });
  };

  useEffect(() => {
    if (draftId || !preferredDocType) return;
    const allowedDocTypes = new Set([
      "Project Plans",
      "Material Submittal",
      "Pre-Qualification",
      "Design Mix",
      "Method Statement",
      "Test Reports",
      "Calibration Certificate",
    ]);
    if (!allowedDocTypes.has(preferredDocType)) return;
    if (formData.documentType === preferredDocType) return;
    handleDocTypeSelect(preferredDocType);
  }, [draftId, formData.documentType, preferredDocType]);

  const handleMaterialTypeSelect = (type) => {
    if (type === "full_system") {
      update({
        materialType: type,
        materialRefNo: DEFAULT_FULL_SYSTEM_MAS_DOCUMENT_NO,
        fullSystemChecklist: createDefaultFullSystemChecklist(),
        complianceTables: [],
      });
    } else {
      update({ materialType: type, materialRefNo: DEFAULT_MAS_DOCUMENT_NO });
    }
  };

  const handleProductChange = (product) => {
    update({ product, brand: "", materialRefNo: DEFAULT_MAS_DOCUMENT_NO });
  };

  const handleChecklistRemarkChange = (slNo, remark) => {
    setFormData((prev) => ({
      ...prev,
      checklistRemarks: { ...prev.checklistRemarks, [slNo]: remark },
    }));
  };

  const handleAlternativeReasonChange = (slNo, reason) => {
    setFormData((prev) => ({
      ...prev,
      checklistAlternativeReasons: {
        ...prev.checklistAlternativeReasons,
        [slNo]: reason,
      },
    }));
  };

  const handleFileUpload = (slNo, newFiles) => {
    const add = Array.from(newFiles || []).filter((f) => f instanceof File);
    if (!add.length) return;
    setFormData((prev) => {
      const prevList = getChecklistFilesList(prev.checklistFiles[slNo]);
      return {
        ...prev,
        checklistFiles: {
          ...prev.checklistFiles,
          [slNo]: [...prevList, ...add],
        },
      };
    });
  };

  const handleChecklistFileRemove = (slNo, index) => {
    setFormData((prev) => {
      const prevList = getChecklistFilesList(prev.checklistFiles[slNo]);
      const nextList = prevList.filter((_, i) => i !== index);
      const nextFiles = { ...prev.checklistFiles };
      if (nextList.length === 0) delete nextFiles[slNo];
      else nextFiles[slNo] = nextList;
      return { ...prev, checklistFiles: nextFiles };
    });
  };

  const handleFullSystemRowFieldChange = (rowId, field, value) => {
    setFormData((prev) => {
      const fc = prev.fullSystemChecklist || { rows: [] };
      const rows = (fc.rows || []).map((r) =>
        r.id === rowId ? { ...r, [field]: value } : r,
      );
      return { ...prev, fullSystemChecklist: { ...fc, rows } };
    });
  };

  const handleFullSystemRowFileUpload = (rowId, key, file) => {
    setFormData((prev) => {
      const fc = prev.fullSystemChecklist || { rows: [] };
      const rows = (fc.rows || []).map((r) =>
        r.id === rowId
          ? {
              ...r,
              statusFiles: { ...(r.statusFiles || {}), [key]: file },
            }
          : r,
      );
      return { ...prev, fullSystemChecklist: { ...fc, rows } };
    });
  };

  const handleAddFullSystemRow = () => {
    setFormData((prev) => {
      const fc = prev.fullSystemChecklist || { rows: [] };
      return {
        ...prev,
        fullSystemChecklist: {
          ...fc,
          rows: [...(fc.rows || []), createFullSystemChecklistRow()],
        },
      };
    });
  };

  const handleDeleteFullSystemRow = (rowId) => {
    setFormData((prev) => {
      const fc = prev.fullSystemChecklist || { rows: [] };
      const rows = (fc.rows || []).filter((r) => r.id !== rowId);
      return {
        ...prev,
        fullSystemChecklist: {
          ...fc,
          rows: rows.length ? rows : fc.rows || [],
        },
      };
    });
  };

  const handleFullSystemAddCompliance = (rowId) => {
    setFormData((prev) => {
      const fc = prev.fullSystemChecklist || { rows: [] };
      const rows = (fc.rows || []).map((r) =>
        r.id === rowId
          ? {
              ...r,
              complianceTables: [
                ...getFullSystemRowComplianceTables(r),
                createComplianceTable(),
              ],
            }
          : r,
      );
      return { ...prev, fullSystemChecklist: { ...fc, rows } };
    });
  };

  const handleFullSystemRowComplianceChange = (rowId, nextTables) => {
    setFormData((prev) => {
      const fc = prev.fullSystemChecklist || { rows: [] };
      const rows = (fc.rows || []).map((r) =>
        r.id === rowId ? { ...r, complianceTables: nextTables } : r,
      );
      return { ...prev, fullSystemChecklist: { ...fc, rows } };
    });
  };

  const handleComplianceTablesChange = useCallback(
    (complianceTables) =>
      setFormData((prev) => ({ ...prev, complianceTables })),
    [],
  );

  const handleAddComplianceTable = useCallback(
    () =>
      setFormData((prev) => ({
        ...prev,
        complianceTables: [...prev.complianceTables, createComplianceTable()],
      })),
    [],
  );

  // const handleBack = () => {
  //   if (hasFormContent(formData)) {
  //     if (draftId) removeDraft(draftId);
  //     addDraft(formData, folderId || null);
  //   }
  //   navigate(folderId ? `/documents?folder=${encodeURIComponent(folderId)}` : "/documents");
  // };

  const handleBack = () => {
    if (hasFormContent(formData)) {
      if (draftId) removeDraft(draftId);

      // Draft still belongs to the actual transmittal folder.
      addDraft(formData, folderId || null);
    }

    // But UI should return to source page, not transmittal folder page.
    navigate(returnTo);
  };

  const handleSubmit = async () => {
    if (
      formData.makeStatus === "alternative" &&
      !formData.checklistAlternativeReasons?.[2]
    ) {
      toast.error("Please select a reason for the Alternative Proposal.");
      return;
    }

    if (!pdfGeneratorRef.current) return;
    setIsSubmitting(true);
    try {
      const blob = await pdfGeneratorRef.current();
      if (!blob) {
        setIsSubmitting(false);
        return;
      }
      const docId = `doc-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const fileName = formData.transmittalRefNo
        ? `Transmittal_${formData.transmittalRefNo.replace(/[/\\]/g, "_")}.pdf`
        : "Transmittal_Document.pdf";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);

      setPendingAdd({
        refNo: formData.transmittalRefNo,
        projectName: formData.projectName,
        folderId: folderId || null,
        docId,
      });
      if (draftId) removeDraft(draftId);
      navigate(returnTo);
    } catch (err) {
      console.error("Submit failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitButton = (
    <button
      type="button"
      onClick={handleSubmit}
      disabled={isSubmitting}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isSubmitting ? (
        <span className="animate-pulse">{capitalCase("submitting")}...</span>
      ) : (
        <>
          <Check className="w-4 h-4" />
          {capitalCase("submit")}
        </>
      )}
    </button>
  );

  const formContent = (
    <div className="space-y-6 min-w-0 print:hidden p-4 sm:p-6 overflow-y-auto h-full">
      <TransmittalHeader
        formData={formData}
        onProjectNameChange={(projectName, projectNo) =>
          update({ projectName, projectNo })
        }
        onBlockNoChange={(blockNo) => update({ blockNo })}
        onWorkOrderChange={(workOrderNo) => update({ workOrderNo })}
        onLocationChange={(location) => update({ location })}
      />

      <section className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <h2 className="text-[12px] uppercase tracking-wider font-bold text-gray-500 mb-4">
          {formData.documentType === "Project Plans" ||
          formData.documentType === "Pre-Qualification" ||
          formData.documentType === "Design Mix" ||
          formData.documentType === "Method Statement" ||
          formData.documentType === "Test Reports" ||
          formData.documentType === "Calibration Certificate"
            ? capitalCase("type of document")
            : `${capitalCase("type of document")} / ${capitalCase("material submittal type")}`}
        </h2>
        {formData.documentType === "Project Plans" ? (
          <div className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              {renderDocTypeSelectorWithTracker("min-w-0 flex-1 max-w-[520px]")}
              <div className="shrink-0 sm:text-right">
                <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                  {capitalCase("document")} / PQP No.
                </div>
                <div className="mt-1 inline-block bg-orange-50 text-primary font-mono text-xs px-2 py-0.5 rounded-sm tabular-nums">
                  {formData.materialRefNo || "—"}
                </div>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {capitalCase(
                  getDescriptionLabelForDocumentType(formData.documentType),
                )}
              </label>
              <textarea
                className="mt-1 min-h-[80px] w-full rounded-md border border-gray-200 bg-white resize-y px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                value={formData.materialDescription}
                onChange={(e) =>
                  update({ materialDescription: e.target.value })
                }
                placeholder={capitalCase(
                  "enter description for submittal details",
                )}
                rows={3}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {capitalCase("remarks")}
              </label>
              <textarea
                className="mt-1 min-h-[80px] w-full rounded-md border border-gray-200 bg-white resize-y px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                value={formData.materialRemarks}
                onChange={(e) => update({ materialRemarks: e.target.value })}
                placeholder={capitalCase(
                  "enter remarks (will appear in transmittal table)",
                )}
                rows={3}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {formData.documentType === "Pre-Qualification" ? (
              <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between xl:gap-6">
                <div className="flex flex-col md:flex-row md:items-end gap-4 min-w-0 flex-1">
                  {renderDocTypeSelectorWithTracker(
                    "min-w-0 flex-1 w-full md:max-w-[520px]",
                  )}
                  <div className="min-w-0 flex-1 w-full md:max-w-[300px]">
                    <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-500 mb-1.5">
                      {capitalCase("pre qualification checklist")}
                    </label>
                    <select
                      value={formData.pqdChecklistType}
                      onChange={(e) => {
                        const v = e.target.value;
                        update({
                          pqdChecklistType: v,
                          pqdChecklistRows: v
                            ? createPqdChecklistRowsForType(v)
                            : [],
                        });
                      }}
                      className="w-full h-9 text-xs rounded-sm border border-gray-200 bg-white px-3 py-1 focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">
                        {capitalCase("select checklist type")}
                      </option>
                      {PQD_CHECKLIST_TYPE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="shrink-0 xl:text-right w-full xl:w-auto pt-2 xl:pt-0 border-t border-gray-100 xl:border-0">
                  <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                    {capitalCase("document")} / PQD No.
                  </div>
                  <div className="mt-1 inline-block bg-orange-50 text-primary font-mono text-xs px-2 py-0.5 rounded-sm tabular-nums">
                    {formData.materialRefNo || "—"}
                  </div>
                </div>
              </div>
            ) : formData.documentType === "Design Mix" ? (
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                {renderDocTypeSelectorWithTracker(
                  "min-w-0 flex-1 max-w-[520px]",
                )}
                <div className="shrink-0 sm:text-right">
                  <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                    {capitalCase("document")} / DMP No.
                  </div>
                  <div className="mt-1 inline-block bg-orange-50 text-primary font-mono text-xs px-2 py-0.5 rounded-sm tabular-nums">
                    {formData.materialRefNo || "—"}
                  </div>
                </div>
              </div>
            ) : formData.documentType === "Method Statement" ? (
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                {renderDocTypeSelectorWithTracker(
                  "min-w-0 flex-1 max-w-[520px]",
                )}
                <div className="shrink-0 sm:text-right">
                  <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                    {capitalCase("document")} / WMS No.
                  </div>
                  <div className="mt-1 inline-block bg-orange-50 text-primary font-mono text-xs px-2 py-0.5 rounded-sm tabular-nums">
                    {formData.materialRefNo || "—"}
                  </div>
                </div>
              </div>
            ) : formData.documentType === "Calibration Certificate" ? (
              <div className="space-y-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  {renderDocTypeSelectorWithTracker(
                    "min-w-0 flex-1 max-w-[760px]",
                  )}

                  <div className="shrink-0 sm:text-right">
                    <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                      {capitalCase("document")} / CC No.
                    </div>

                    <div className="mt-1 inline-block bg-orange-50 text-primary font-mono text-xs px-2 py-0.5 rounded-sm tabular-nums">
                      {formData.materialRefNo || "—"}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {capitalCase(
                      getDescriptionLabelForDocumentType(formData.documentType),
                    )}
                  </label>

                  <textarea
                    className="mt-1 min-h-[80px] w-full rounded-md border border-gray-200 bg-white resize-y px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    value={formData.materialDescription}
                    onChange={(e) =>
                      update({ materialDescription: e.target.value })
                    }
                    placeholder={capitalCase(
                      "enter description of calibration certificate",
                    )}
                    rows={3}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {capitalCase("remarks")}
                  </label>

                  <textarea
                    className="mt-1 min-h-[80px] w-full rounded-md border border-gray-200 bg-white resize-y px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    value={formData.materialRemarks}
                    onChange={(e) =>
                      update({ materialRemarks: e.target.value })
                    }
                    placeholder={capitalCase("enter remarks")}
                    rows={3}
                  />
                </div>
              </div>
            ) : formData.documentType === "Test Reports" ? (
              <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between xl:gap-6">
                <div className="flex flex-col md:flex-row md:items-end gap-4 min-w-0 flex-1">
                  {renderDocTypeSelectorWithTracker(
                    "min-w-0 flex-1 w-full md:max-w-[520px]",
                  )}

                  <div className="min-w-0 flex-1 w-full md:max-w-[260px]">
                    <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-500 mb-1.5">
                      {capitalCase("test report type")}
                    </label>
                    <select
                      value={formData.testReportType}
                      onChange={(e) =>
                        update({
                          testReportType: e.target.value,
                          inhouseTestReportType: "",
                        })
                      }
                      className="w-full h-9 text-xs rounded-sm border border-gray-200 bg-white px-3 py-1 focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">
                        {capitalCase("select test report type")}
                      </option>
                      {TEST_REPORT_TYPE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {formData.testReportType === "Inhouse Test Report" && (
                    <div className="min-w-0 flex-1 w-full md:max-w-[280px]">
                      <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-500 mb-1.5">
                        {capitalCase("inhouse test type")}
                      </label>
                      <select
                        value={formData.inhouseTestReportType}
                        onChange={(e) =>
                          update({ inhouseTestReportType: e.target.value })
                        }
                        className="w-full h-9 text-xs rounded-sm border border-gray-200 bg-white px-3 py-1 focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="">
                          {capitalCase("select inhouse test type")}
                        </option>
                        {INHOUSE_TEST_REPORT_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="shrink-0 xl:text-right w-full xl:w-auto pt-2 xl:pt-0 border-t border-gray-100 xl:border-0">
                  <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                    {capitalCase("document")} / TR No.
                  </div>
                  <div className="mt-1 inline-block bg-orange-50 text-primary font-mono text-xs px-2 py-0.5 rounded-sm tabular-nums">
                    {formData.materialRefNo || "—"}
                  </div>
                </div>
              </div>
            ) : (
              <div>
                {" "}
                {renderDocTypeSelectorWithTracker("w-full max-w-[520px]")}{" "}
              </div>
            )}
            <AnimatePresence mode="wait">
              {formData.documentType === "Material Submittal" && (
                <motion.div
                  key="material-type"
                  variants={section}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="overflow-hidden"
                >
                  <MaterialTypeSelector
                    selected={formData.materialType}
                    onSelect={handleMaterialTypeSelect}
                    showTitle={false}
                  />
                </motion.div>
              )}
              {formData.documentType === "Pre-Qualification" && (
                <motion.div
                  key="pre-qualification"
                  variants={section}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="space-y-4"
                >
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {capitalCase(
                        getDescriptionLabelForDocumentType(
                          formData.documentType,
                        ),
                      )}
                    </label>
                    <textarea
                      className="mt-1 min-h-[80px] w-full rounded-md border border-gray-200 bg-white resize-y px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      value={formData.materialDescription}
                      onChange={(e) =>
                        update({ materialDescription: e.target.value })
                      }
                      placeholder={capitalCase(
                        "enter description for submittal details",
                      )}
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {capitalCase("remarks")}
                    </label>
                    <textarea
                      className="mt-1 min-h-[80px] w-full rounded-md border border-gray-200 bg-white resize-y px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      value={formData.materialRemarks}
                      onChange={(e) =>
                        update({ materialRemarks: e.target.value })
                      }
                      placeholder={capitalCase(
                        "enter remarks (will appear in transmittal table)",
                      )}
                      rows={3}
                    />
                  </div>
                  <PQD
                    checklistType={formData.pqdChecklistType}
                    rows={formData.pqdChecklistRows}
                    onRowsChange={(next) => {
                      setFormData((prev) => ({
                        ...prev,
                        pqdChecklistRows:
                          typeof next === "function"
                            ? next(prev.pqdChecklistRows || [])
                            : next,
                      }));
                    }}
                  />
                </motion.div>
              )}
              {formData.documentType === "Design Mix" && (
                <motion.div
                  key="design-mix"
                  variants={section}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="space-y-4"
                >
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {capitalCase(
                        getDescriptionLabelForDocumentType(
                          formData.documentType,
                        ),
                      )}
                    </label>
                    <textarea
                      className="mt-1 min-h-[80px] w-full rounded-md border border-gray-200 bg-white resize-y px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      value={formData.materialDescription}
                      onChange={(e) =>
                        update({ materialDescription: e.target.value })
                      }
                      placeholder={capitalCase(
                        "enter description for submittal details",
                      )}
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {capitalCase("remarks")}
                    </label>
                    <textarea
                      className="mt-1 min-h-[80px] w-full rounded-md border border-gray-200 bg-white resize-y px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      value={formData.materialRemarks}
                      onChange={(e) =>
                        update({ materialRemarks: e.target.value })
                      }
                      placeholder={capitalCase(
                        "enter remarks (will appear in transmittal table)",
                      )}
                      rows={3}
                    />
                  </div>
                  <DMP
                    rows={formData.dmpChecklistRows}
                    onRowsChange={(next) => {
                      setFormData((prev) => ({
                        ...prev,
                        dmpChecklistRows:
                          typeof next === "function"
                            ? next(prev.dmpChecklistRows || [])
                            : next,
                      }));
                    }}
                  />
                </motion.div>
              )}
              {formData.documentType === "Method Statement" && (
                <motion.div
                  key="method-statement"
                  variants={section}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="space-y-4"
                >
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {capitalCase(
                        getDescriptionLabelForDocumentType(
                          formData.documentType,
                        ),
                      )}
                    </label>
                    <textarea
                      className="mt-1 min-h-[80px] w-full rounded-md border border-gray-200 bg-white resize-y px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      value={formData.materialDescription}
                      onChange={(e) =>
                        update({ materialDescription: e.target.value })
                      }
                      placeholder={capitalCase(
                        "enter description for submittal details",
                      )}
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {capitalCase("remarks")}
                    </label>
                    <textarea
                      className="mt-1 min-h-[80px] w-full rounded-md border border-gray-200 bg-white resize-y px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      value={formData.materialRemarks}
                      onChange={(e) =>
                        update({ materialRemarks: e.target.value })
                      }
                      placeholder={capitalCase(
                        "enter remarks (will appear in transmittal table)",
                      )}
                      rows={3}
                    />
                  </div>
                  <WMS
                    scopeObjective={formData.wmsScopeObjective ?? ""}
                    onScopeObjectiveChange={(v) =>
                      update({ wmsScopeObjective: v })
                    }
                    references={formData.wmsReferences}
                    onReferencesChange={(next) => {
                      setFormData((prev) => ({
                        ...prev,
                        wmsReferences:
                          typeof next === "function"
                            ? next(prev.wmsReferences || [])
                            : next,
                      }));
                    }}
                    constructionSequence={
                      formData.wmsConstructionSequence ??
                      createDefaultWmsConstructionSequence()
                    }
                    onConstructionSequenceChange={(next) => {
                      setFormData((prev) => ({
                        ...prev,
                        wmsConstructionSequence:
                          typeof next === "function"
                            ? next(
                                prev.wmsConstructionSequence ??
                                  createDefaultWmsConstructionSequence(),
                              )
                            : next,
                      }));
                    }}
                    annexures={
                      formData.wmsAnnexures ?? createDefaultWmsAnnexures()
                    }
                    onAnnexuresChange={(next) => {
                      setFormData((prev) => ({
                        ...prev,
                        wmsAnnexures:
                          typeof next === "function"
                            ? next(
                                prev.wmsAnnexures ??
                                  createDefaultWmsAnnexures(),
                              )
                            : next,
                      }));
                    }}
                  />
                </motion.div>
              )}
              {formData.documentType === "Test Reports" && (
                <motion.div
                  key="test-reports"
                  variants={section}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="space-y-4"
                >
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {capitalCase(
                        getDescriptionLabelForDocumentType(
                          formData.documentType,
                        ),
                      )}
                    </label>
                    <textarea
                      className="mt-1 min-h-[80px] w-full rounded-md border border-gray-200 bg-white resize-y px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      value={formData.materialDescription}
                      onChange={(e) =>
                        update({ materialDescription: e.target.value })
                      }
                      placeholder={capitalCase(
                        "enter description for submittal details",
                      )}
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {capitalCase("remarks")}
                    </label>
                    <textarea
                      className="mt-1 min-h-[80px] w-full rounded-md border border-gray-200 bg-white resize-y px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      value={formData.materialRemarks}
                      onChange={(e) =>
                        update({ materialRemarks: e.target.value })
                      }
                      placeholder={capitalCase("enter remarks")}
                      rows={3}
                    />
                  </div>

                  {formData.testReportType === "Inhouse Test Report" &&
                    formData.inhouseTestReportType === "Core Cutter Method" && (
                      <CoreCutterMethod />
                    )}

                  {formData.testReportType === "Inhouse Test Report" &&
                    formData.inhouseTestReportType ===
                      "Sand Replacement Method" && <SandReplacementMethod />}

                  {formData.testReportType === "Third Party Test Report" && (
                    <ThirdPartyReport />
                  )}
                </motion.div>
              )}

              {formData.documentType === "Calibration Certificate" && (
                <motion.div
                  key="calibration-certificate"
                  variants={section}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="space-y-4"
                >
                  <CalibrationRegister
                    value={
                      formData.calibrationCertificate ||
                      createDefaultCalibrationCertificate()
                    }
                    onChange={(nextValue) =>
                      update({
                        calibrationCertificate: nextValue,
                      })
                    }
                    onPreview={() => setPreviewOpen(true)}
                    onSubmit={handleSubmit}
                    isSubmitting={isSubmitting}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </section>

      <AnimatePresence mode="wait">
        {formData.documentType === "Material Submittal" &&
          formData.materialType && (
            <motion.section
              key="product-brand"
              variants={section}
              initial="initial"
              animate="animate"
              exit="exit"
              className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm overflow-hidden"
            >
              <ProductBrandSelector
                materialRefNo={formData.materialRefNo}
                areaOfApplication={formData.areaOfApplication}
                specReference={formData.specReference}
                materialDescription={formData.materialDescription}
                materialRemarks={formData.materialRemarks}
                onAreaChange={(areaOfApplication) =>
                  update({ areaOfApplication })
                }
                onSpecChange={(specReference) => update({ specReference })}
                onMaterialDescriptionChange={(materialDescription) =>
                  update({ materialDescription })
                }
                onMaterialRemarksChange={(materialRemarks) =>
                  update({ materialRemarks })
                }
              />
            </motion.section>
          )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {formData.documentType === "Project Plans" && (
          <motion.div
            key="pqp-flow"
            variants={section}
            initial="initial"
            animate="animate"
            exit="exit"
            className="space-y-6 overflow-hidden"
          >
            <motion.section
              layout
              className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm overflow-hidden"
            >
              <PQP
                pqpAnnexRows={formData.pqpAnnexRows}
                onRowsChange={(rows) => update({ pqpAnnexRows: rows })}
              />
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {formData.documentType === "Material Submittal" &&
          formData.materialType && (
            <motion.section
              key="checklist"
              variants={section}
              initial="initial"
              animate="animate"
              exit="exit"
              className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm overflow-x-auto overflow-y-visible"
            >
              <MaterialChecklist
                materialType={formData.materialType}
                materialRefNo={formData.materialRefNo}
                materialDescription={formData.product}
                manufacturer={formData.brand}
                product={formData.product}
                brand={formData.brand}
                makeStatus={formData.makeStatus}
                checklistRemarks={formData.checklistRemarks}
                checklistFiles={formData.checklistFiles}
                checklistAlternativeReasons={
                  formData.checklistAlternativeReasons
                }
                checklistItem3Option={formData.checklistItem3Option}
                checklistItem3SectionClass={
                  formData.checklistItem3SectionClass ?? ""
                }
                fullSystemChecklist={formData.fullSystemChecklist}
                onMakeStatusChange={(makeStatus) => update({ makeStatus })}
                onProductChange={handleProductChange}
                onBrandChange={(brand) => update({ brand })}
                onChecklistRemarkChange={handleChecklistRemarkChange}
                onAlternativeReasonChange={handleAlternativeReasonChange}
                onChecklistItem3OptionChange={(checklistItem3Option) =>
                  update({ checklistItem3Option })
                }
                onChecklistItem3SectionClassChange={(
                  checklistItem3SectionClass,
                ) => update({ checklistItem3SectionClass })}
                onFileUpload={handleFileUpload}
                onChecklistFileRemove={handleChecklistFileRemove}
                onFullSystemRowFieldChange={handleFullSystemRowFieldChange}
                onFullSystemRowFileUpload={handleFullSystemRowFileUpload}
                onAddFullSystemRow={handleAddFullSystemRow}
                onDeleteFullSystemRow={handleDeleteFullSystemRow}
                onFullSystemAddCompliance={handleFullSystemAddCompliance}
                onFullSystemRowComplianceChange={
                  handleFullSystemRowComplianceChange
                }
              />
            </motion.section>
          )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {formData.documentType === "Material Submittal" &&
          formData.materialType &&
          formData.materialType !== "full_system" &&
          formData.makeStatus &&
          (formData.makeStatus !== "approved" ||
            (formData.product && formData.brand)) && (
            <motion.section
              key="compliance"
              variants={section}
              initial="initial"
              animate="animate"
              exit="exit"
              className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm overflow-hidden"
            >
              <ComplianceStatement
                tables={formData.complianceTables}
                onTablesChange={handleComplianceTablesChange}
                onAddTable={handleAddComplianceTable}
              />
            </motion.section>
          )}
      </AnimatePresence>

      <p className="text-[11px] text-gray-500 pb-4">
        Click the arrow button on the right to toggle the live document preview.
      </p>

      {formData.documentType !== "Calibration Certificate" && (
        <div className="flex justify-end border-t border-gray-200 pt-4">
          {submitButton}
        </div>
      )}
    </div>
  );

  const previewContent = (
    <div className="h-full flex flex-col print:static print:block print:h-auto">
      <DocumentPreview
        formData={formData}
        variant="embedded"
        pdfGeneratorRef={pdfGeneratorRef}
      />
    </div>
  );

  return (
    <div className="min-h-screen h-screen flex flex-col bg-white">
      <div className="border-b border-gray-200 bg-gray-50 px-4 py-2 flex items-center justify-between gap-2 print:hidden shrink-0">
        <button
          type="button"
          onClick={handleBack}
          className="text-sm text-primary font-medium hover:underline inline-flex items-center gap-1"
        >
          <ChevronLeft className="w-4 h-4" />
          {capitalCase("back to documents")}
        </button>
      </div>
      <header className="border-b border-gray-200 bg-white print:hidden shrink-0">
        <div className="px-4 sm:px-6 py-3 flex items-center gap-3">
          <FileText className="w-5 h-5 text-primary" />
          <h1 className="text-sm font-bold text-gray-900 tracking-tight">
            {capitalCase("transmittal of documents")}
          </h1>
          <span className="text-[10px] font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded-lg ml-auto tabular-nums">
            HIPPL/QAP/FM/TDC/01 • Rev 1
          </span>
        </div>
      </header>

      <div className="flex-1 min-h-0 flex relative print:block print:h-auto">
        {/* Form - takes full width when preview closed, shrinks when open */}
        <motion.div
          className="h-full overflow-y-auto"
          animate={{
            width: isMobile ? "100%" : previewOpen ? "55%" : "100%",
          }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          {formContent}
        </motion.div>

        {/* Toggle button - always visible on desktop, moves with the seam */}
        {!isMobile && (
          <button
            type="button"
            onClick={() => setPreviewOpen((v) => !v)}
            className="absolute z-30 top-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-14 rounded-l-lg bg-primary text-white shadow-lg hover:opacity-90 transition-colors print:hidden"
            style={{
              right: previewOpen ? "45%" : 0,
              transition: "right 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
            aria-label={
              previewOpen
                ? capitalCase("close preview")
                : capitalCase("open preview")
            }
          >
            {previewOpen ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        )}

        {/* Preview panel - slides in/out from the right (desktop) */}
        <AnimatePresence>
          {!isMobile && previewOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "45%", opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="h-full border-l border-gray-200 overflow-hidden bg-white"
            >
              {previewContent}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile: floating button + full-screen overlay (bottom sheet style) */}
        {isMobile && (
          <>
            <button
              type="button"
              onClick={() => setPreviewOpen((v) => !v)}
              className="fixed bottom-4 right-4 z-40 flex items-center gap-2 px-4 py-2.5 rounded-full bg-primary text-white shadow-lg hover:opacity-90 transition-colors print:hidden"
            >
              <FileText className="w-4 h-4" />
              <span className="text-xs font-medium">
                {previewOpen
                  ? capitalCase("hide preview")
                  : capitalCase("preview")}
              </span>
            </button>
            <AnimatePresence>
              {previewOpen && (
                <motion.div
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="fixed inset-0 z-30 bg-white flex flex-col"
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50 shrink-0">
                    <span className="text-sm font-semibold text-gray-900">
                      {capitalCase("live preview")}
                    </span>
                    <button
                      type="button"
                      onClick={() => setPreviewOpen(false)}
                      className="text-xs text-gray-500 hover:text-gray-900 transition-colors"
                    >
                      {capitalCase("close")}
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto">{previewContent}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>

      <DocumentTrackerSelectModal
        open={documentTrackerModalOpen}
        documentType={getCurrentDocumentType()}
        onClose={() => setDocumentTrackerModalOpen(false)}
        onSelect={handleSelectTrackerDocument}
      />
    </div>
  );
}
