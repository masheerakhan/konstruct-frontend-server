import { useState, useRef, useEffect } from "react";
import { ChevronLeft, FileText, ClipboardList, Check, Plus, Trash2, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobile } from "../Transmittal/useIsMobile";
import DocumentPreview from "../Transmittal/DocumentPreview";
import toast from "react-hot-toast";
import TransmittalHeader from "../Transmittal/TransmittalHeader";
import DocumentTrackerSelectModal from "../Transmittal/DocumentTrackerSelectModal";
import FileUploadControl from "../../FileUploadControl";
import { createDefaultFormData } from "../Transmittal/approvedVendors";

export const documentTypes = [
    "Project Plans",
    "Material Submittal",
    "Method Statement",
    "Technical Submittal",
    "Pre-Qualification",
    "Reports",
    "Manuals",
    "Sample / Catalog",
    "Calculations",
    "Audit Report",
    "Test Reports",
    "Calibration Certificate",
    "Other Certificates",
    "Organization Chart",
    "Proposals",
    "Registers",
    "Drawings",
    "Design Mix",
    "NCR",
    "RFI",
    "Legal Documents",
    "Other Documents",
];

export default function LegalDocumentForm({
    initialData = null,
    projectOptions = [],
    onSubmitSuccess,
    onBack,
    onFormOpenChange,
}) {
    useEffect(() => {
        onFormOpenChange?.(true);
        return () => onFormOpenChange?.(false);
    }, [onFormOpenChange]);

    const [formData, setFormData] = useState(() => {
        const defaultData = createDefaultFormData();
        return {
            ...defaultData,
            documentType: "Legal Documents",
            documentNo: "HIPPL/API/HLP/HSE/LGD/01",
            materialDescription: "",
            materialRemarks: "",
            documentsList: [{ id: Date.now().toString(), document: "", documentNumber: "", dateOfIssue: "", validity: "", attachment: [] }],
            ...(initialData || {}),
        };
    });

    const [isTrackerOpen, setIsTrackerOpen] = useState(false);
    const [previewOpen, setPreviewOpen] = useState(false);
    const pdfGeneratorRef = useRef(null);
    const isMobile = useIsMobile();

    const update = (patch) => setFormData((prev) => ({ ...prev, ...patch }));

    const handleSubmit = (e) => {
        e.preventDefault();
        toast.success("Legal Document Transmittal simulated save!");
        onSubmitSuccess?.(formData);
    };

    return (
        <div className="min-h-screen h-screen flex flex-col bg-white overflow-hidden">
            {/* Top Action Bar */}
            <div className="border-b border-gray-200 bg-gray-50 px-4 py-2 flex items-center justify-between gap-2 print:hidden shrink-0">
                <button
                    type="button"
                    onClick={onBack}
                    className="text-sm text-orange-500 font-medium hover:underline inline-flex items-center gap-1"
                >
                    <ChevronLeft className="w-4 h-4" />
                    Back To Documents
                </button>
                <button
                    type="button"
                    onClick={handleSubmit}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500 text-white font-medium hover:opacity-90"
                >
                    <Check className="w-4 h-4" />
                    Submit
                </button>
            </div>

            {/* Document Header */}
            <header className="border-b border-gray-200 bg-white print:hidden shrink-0 z-10 relative">
                <div className="px-4 sm:px-6 py-3 flex items-center gap-3">
                    <FileText className="w-5 h-5 text-orange-500" />
                    <h1 className="text-sm font-bold text-gray-900 tracking-tight">
                        Transmittal Of Documents
                    </h1>
                    <span className="text-[10px] font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded-lg ml-auto tabular-nums">
                        HIPPL/QAP/FM/TDC/01 • Rev 1
                    </span>
                </div>
            </header>

            <div className="flex-1 min-h-0 flex relative print:block print:h-auto">
                {/* Form - takes full width when preview closed, shrinks when open */}
                <motion.div
                    className="h-full overflow-y-auto bg-gray-50/50"
                    animate={{
                        width: isMobile
                            ? "100%"
                            : previewOpen
                                ? "55%"
                                : "100%",
                    }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                >
                    <div className="p-4 sm:p-6 lg:p-8">
                        <div className="mx-auto max-w-7xl space-y-6">
                            
                            {/* 1. Transmittal Header */}
                    <TransmittalHeader
                        formData={formData}
                        onProjectNameChange={(name, no) =>
                            update({ projectName: name, projectNo: no })
                        }
                        onLocationChange={(loc) => update({ location: loc })}
                        onBlockNoChange={(block) => update({ blockNo: block })}
                        onWorkOrderChange={(wo) => update({ workOrderNo: wo })}
                    />

                    {/* 3. Type Of Document & Description Section */}
                    <section className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                        <h2 className="mb-6 text-[12px] uppercase tracking-wider font-bold text-gray-500">
                            TYPE OF DOCUMENT
                        </h2>
                        
                        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between xl:gap-6">
                            <div className="flex flex-col md:flex-row md:items-end gap-4 min-w-0 flex-1">
                                <div className="min-w-0 flex-1 w-full md:max-w-[520px]">
                                    <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
                                        {/* Select from tracker */}
                                        <div className="shrink-0">
                                            <label className="mb-1.5 block text-[10px] uppercase tracking-wider font-bold text-gray-500 whitespace-nowrap">
                                                SELECT DOCUMENT FROM
                                            </label>
                                            <button
                                                type="button"
                                                onClick={() => setIsTrackerOpen(true)}
                                                className="inline-flex h-9 items-center gap-2 rounded-sm border border-orange-200 bg-orange-50 px-3 text-xs font-semibold text-orange-500 hover:bg-orange-100 transition-colors whitespace-nowrap"
                                            >
                                                <ClipboardList className="h-3.5 w-3.5 shrink-0" />
                                                All Document Tracker
                                            </button>
                                        </div>

                                        {/* Document type dropdown */}
                                        <div className="min-w-0 w-full lg:w-[360px]">
                                            <label className="mb-1.5 block text-[10px] uppercase tracking-wider font-bold text-gray-500 whitespace-nowrap">
                                                SELECT DOCUMENT TYPE
                                            </label>
                                            <div className="relative">
                                                <select
                                                    value={formData.documentType}
                                                    onChange={(e) => update({ documentType: e.target.value })}
                                                    className="h-9 w-full appearance-none rounded-sm border border-orange-500 bg-white px-3 py-1 pr-8 text-[13px] font-medium text-gray-900 focus:outline-none"
                                                >
                                                    <option value="" disabled>Select Document Type</option>
                                                    {documentTypes.map((type) => (
                                                        <option key={type} value={type}>
                                                            {type}
                                                        </option>
                                                    ))}
                                                </select>
                                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="shrink-0 xl:text-right w-full xl:w-auto pt-2 xl:pt-0 border-t border-gray-100 xl:border-0">
                                <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                                    DOCUMENT / LGD NO.
                                </div>
                                <div className="mt-1 inline-block bg-orange-50 text-orange-500 font-mono text-[13px] tracking-wide px-2 py-0.5 rounded-sm tabular-nums">
                                    {formData.documentNo}
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="mt-6">
                            <label className="mb-1.5 block text-[10px] uppercase tracking-wider font-bold text-gray-500 whitespace-nowrap">
                                DESCRIPTION OF SUBMITTAL DETAILS
                            </label>
                            <textarea
                                value={formData.materialDescription}
                                onChange={(e) => update({ materialDescription: e.target.value })}
                                placeholder="Enter Description For Submittal Details"
                                rows={3}
                                className="w-full min-h-[80px] resize-y rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                        </div>

                        {/* Remarks */}
                        <div className="mt-6">
                            <label className="mb-1.5 block text-[10px] uppercase tracking-wider font-bold text-gray-500 whitespace-nowrap">
                                REMARKS
                            </label>
                            <textarea
                                value={formData.materialRemarks}
                                onChange={(e) => update({ materialRemarks: e.target.value })}
                                placeholder="Enter Remarks Will Appear In Transmittal Table"
                                rows={3}
                                className="w-full min-h-[80px] resize-y rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                        </div>
                    </section>

                    {/* Dynamic Table Section */}
                    <section className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm overflow-hidden">
                        <h2 className="mb-6 text-[12px] uppercase tracking-wider font-bold text-gray-500">
                            UPLOAD DOCUMENT
                        </h2>
                        <div className="overflow-x-auto pb-4">
                            <table className="w-full text-left text-sm text-gray-600 min-w-[900px]">
                                <thead className="bg-gray-50 border-b border-gray-200 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                    <tr>
                                        <th className="px-4 py-3 w-12 text-center">Sl.No</th>
                                        <th className="px-4 py-3 min-w-[200px]">Document</th>
                                        <th className="px-4 py-3 min-w-[150px]">Document Number</th>
                                        <th className="px-4 py-3 w-40">Date of Issue</th>
                                        <th className="px-4 py-3 w-40">Validity</th>
                                        <th className="px-4 py-3 w-64">Attachment</th>
                                        <th className="px-4 py-3 w-12 text-center"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {formData.documentsList?.map((row, index) => (
                                        <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-4 py-3 text-center font-medium text-gray-500">{index + 1}</td>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="text"
                                                    value={row.document}
                                                    onChange={(e) => {
                                                        const newList = [...formData.documentsList];
                                                        newList[index].document = e.target.value;
                                                        update({ documentsList: newList });
                                                    }}
                                                    placeholder="Enter Document"
                                                    className="w-full rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="text"
                                                    value={row.documentNumber}
                                                    onChange={(e) => {
                                                        const newList = [...formData.documentsList];
                                                        newList[index].documentNumber = e.target.value;
                                                        update({ documentsList: newList });
                                                    }}
                                                    placeholder="Document No."
                                                    className="w-full rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="date"
                                                    value={row.dateOfIssue}
                                                    onChange={(e) => {
                                                        const newList = [...formData.documentsList];
                                                        newList[index].dateOfIssue = e.target.value;
                                                        update({ documentsList: newList });
                                                    }}
                                                    className="w-full rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="date"
                                                    value={row.validity}
                                                    onChange={(e) => {
                                                        const newList = [...formData.documentsList];
                                                        newList[index].validity = e.target.value;
                                                        update({ documentsList: newList });
                                                    }}
                                                    className="w-full rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <FileUploadControl
                                                    files={row.attachment}
                                                    onFilesChange={(files) => {
                                                        const newList = [...formData.documentsList];
                                                        newList[index].attachment = files;
                                                        update({ documentsList: newList });
                                                    }}
                                                    multiple={false}
                                                    uploadLabel="Upload"
                                                />
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {formData.documentsList.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const newList = formData.documentsList.filter((_, i) => i !== index);
                                                            update({ documentsList: newList });
                                                        }}
                                                        className="text-gray-400 hover:text-red-500 transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4 mx-auto" />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        
                        <div className="mt-4">
                            <button
                                type="button"
                                onClick={() => {
                                    update({
                                        documentsList: [
                                            ...formData.documentsList,
                                            { id: Date.now().toString(), document: "", documentNumber: "", dateOfIssue: "", validity: "", attachment: [] }
                                        ]
                                    });
                                }}
                                className="inline-flex items-center gap-1.5 px-4 py-2 border border-orange-200 text-orange-500 bg-white text-sm font-semibold rounded-lg hover:bg-orange-50 transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                Add Row
                            </button>
                        </div>
                            </section>

                        </div>
                    </div>
                </motion.div>

                {/* Toggle button - always visible on desktop, moves with the seam */}
                {!isMobile && (
                    <button
                        type="button"
                        onClick={() => setPreviewOpen((v) => !v)}
                        className="absolute z-30 top-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-14 rounded-l-lg bg-orange-500 text-white shadow-lg hover:opacity-90 transition-colors print:hidden"
                        style={{
                            right: previewOpen ? "45%" : 0,
                            transition: "right 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
                        }}
                        aria-label={previewOpen ? "Close preview" : "Open preview"}
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
                            <DocumentPreview formData={formData} variant="embedded" pdfGeneratorRef={pdfGeneratorRef} />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Mobile: floating button + full-screen overlay (bottom sheet style) */}
                {isMobile && (
                    <>
                        <button
                            type="button"
                            onClick={() => setPreviewOpen((v) => !v)}
                            className="fixed bottom-4 right-4 z-40 flex items-center gap-2 px-4 py-2.5 rounded-full bg-orange-500 text-white shadow-lg hover:opacity-90 transition-colors print:hidden"
                        >
                            <FileText className="w-4 h-4" />
                            <span className="text-xs font-medium">
                                {previewOpen ? "Hide Preview" : "Live Preview"}
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
                                            Live Preview
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => setPreviewOpen(false)}
                                            className="text-xs text-gray-500 hover:text-gray-900 transition-colors"
                                        >
                                            Close
                                        </button>
                                    </div>
                                    <div className="flex-1 overflow-y-auto">
                                        <DocumentPreview formData={formData} variant="embedded" pdfGeneratorRef={pdfGeneratorRef} />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </>
                )}
            </div>

            <DocumentTrackerSelectModal 
                open={isTrackerOpen}
                onClose={() => setIsTrackerOpen(false)}
                documentType={formData.documentType}
                onSelect={(doc) => {
                    update({ materialDescription: doc.description || "" });
                    toast.success("Document tracking details loaded!");
                }}
            />
        </div>
    );
}
