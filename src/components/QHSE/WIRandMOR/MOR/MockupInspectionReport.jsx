import { useState } from "react";
import toast from "react-hot-toast";
import {
    Plus,
    Trash2,
    ArrowRight,
    ArrowLeft,
    Upload,
    X,
    Check,
} from "lucide-react";


const FormHeader = () => (
    <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
            <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-blue-700">
                    QHSE Register
                </p>
                <p className="text-base font-semibold text-slate-800">
                    Calibration Register
                </p>
            </div>
            <p className="hidden text-xs text-slate-500 sm:block">
                Measuring Equipments & Instruments
            </p>
        </div>
    </header>
);


const PROJECTS = [
    "Project Alpha",
    "Project Beta",
    "Project Gamma",
    "Project Delta",
];

const inputClass =
    "w-full rounded-md border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

const textareaClass =
    "w-full min-h-[80px] resize-y rounded-md border border-slate-300 bg-white px-2.5 py-2 text-sm leading-snug text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

const labelClass = "mb-1.5 block text-sm font-medium text-slate-600";

const thClass =
    "border border-slate-200 bg-slate-50 px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-600";

const tdClass = "border border-slate-200 align-top p-2";

const uid = () => Math.random().toString(36).slice(2, 10);

const emptyRow = () => ({
    description: "",
    photos: [],
});

const filesToImages = (files) => {
    if (!files) return [];

    return Array.from(files).map((file) => ({
        id: uid(),
        url: URL.createObjectURL(file),
        name: file.name,
    }));
};

const SectionCard = ({ number, title, children }) => (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <header className="flex items-center gap-3 border-b border-slate-200 px-5 py-3.5">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
                {number}
            </span>
            <h2 className="text-base font-semibold text-slate-800">{title}</h2>
        </header>
        <div className="p-5">{children}</div>
    </section>
);



// const STEPS = ["Request Details", "Stage Wise Construction", "Mockup Photos"];
const LAST_STEP = 2;

const MOR = () => {


    const defaultAttachmentRows = [
        {
            id: uid(),
            documentName: "Photos for Reference (Multiple Attachment)",
            isDefault: true,
            files: [],
        },
        {
            id: uid(),
            documentName: "TDS",
            isDefault: true,
            files: [],
        },
        {
            id: uid(),
            documentName: "Brief Method Statement",
            isDefault: true,
            files: [],
        },
        {
            id: uid(),
            documentName: "Testing",
            isDefault: true,
            files: [],
        },
    ];

    const filesToDocuments = (files) => {
        if (!files) return [];

        return Array.from(files).map((file) => ({
            id: uid(),
            name: file.name,
        }));
    };

    const updateAttachmentName = (id, documentName) => {
        setAttachments((prev) =>
            prev.map((row) =>
                row.id === id ? { ...row, documentName } : row
            )
        );
    };

    const addAttachmentFiles = (id, files) => {
        setAttachments((prev) =>
            prev.map((row) =>
                row.id === id
                    ? {
                        ...row,
                        files: [...row.files, ...filesToDocuments(files)],
                    }
                    : row
            )
        );
    };

    const removeAttachmentFile = (rowId, fileId) => {
        setAttachments((prev) =>
            prev.map((row) =>
                row.id === rowId
                    ? {
                        ...row,
                        files: row.files.filter((file) => file.id !== fileId),
                    }
                    : row
            )
        );
    };

    const addOtherDocumentRow = () => {
        setAttachments((prev) => [...prev, emptyAttachmentRow()]);
    };

    const removeAttachmentRow = (id) => {
        setAttachments((prev) => prev.filter((row) => row.id !== id));
    };

    const [step, setStep] = useState(0);

    // Stage 1 — request details
    const [project, setProject] = useState("");
    const [location, setLocation] = useState("");
    const [morRef, setMorRef] = useState("");
    const [submissionDate, setSubmissionDate] = useState(() =>
        new Date().toISOString().slice(0, 10)
    );
    const [submittedBy, setSubmittedBy] = useState("");
    const [inspectionDate, setInspectionDate] = useState(() =>
        new Date().toISOString().slice(0, 10)
    );
    const [boqItem, setBoqItem] = useState("");
    const [requestDetail, setRequestDetail] = useState("");
    const [attachments, setAttachments] = useState(defaultAttachmentRows);
    // Stage 2 — stage wise construction details
    const [rows, setRows] = useState([emptyRow()]);

    // Stage 3 — mockup photos
    const [mockups, setMockups] = useState([]);

    const updateRow = (index, field, value) => {
        setRows((prev) =>
            prev.map((row, rowIndex) =>
                rowIndex === index ? { ...row, [field]: value } : row
            )
        );
    };

    const addRowPhotos = (index, files) => {
        setRows((prev) =>
            prev.map((row, rowIndex) =>
                rowIndex === index
                    ? {
                        ...row,
                        photos: [...row.photos, ...filesToImages(files)],
                    }
                    : row
            )
        );
    };

    const removeRowPhoto = (index, photoId) => {
        setRows((prev) =>
            prev.map((row, rowIndex) =>
                rowIndex === index
                    ? {
                        ...row,
                        photos: row.photos.filter((photo) => photo.id !== photoId),
                    }
                    : row
            )
        );
    };

    const addRow = () => {
        setRows((prev) => [...prev, emptyRow()]);
    };

    const removeRow = (index) => {
        setRows((prev) =>
            prev.length === 1 ? prev : prev.filter((_, rowIndex) => rowIndex !== index)
        );
    };

    const addMockups = (files) => {
        setMockups((prev) => [
            ...prev,
            ...filesToImages(files).map((image) => ({
                ...image,
                description: "",
            })),
        ]);
    };

    const updateMockup = (id, description) => {
        setMockups((prev) =>
            prev.map((mockup) =>
                mockup.id === id ? { ...mockup, description } : mockup
            )
        );
    };

    const removeMockup = (id) => {
        setMockups((prev) => prev.filter((mockup) => mockup.id !== id));
    };

    const next = () => {
        if (step === 0 && !project) {
            toast.error("Please select a project");
            return;
        }

        setStep((currentStep) => Math.min(currentStep + 1, LAST_STEP));
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const back = () => {
        setStep((currentStep) => Math.max(currentStep - 1, 0));
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleSubmit = () => {
        toast.success("Mock-up Inspection Report submitted", {
            description: "All stages recorded successfully.",
        });
    };


    const emptyAttachmentRow = () => ({
        id: uid(),
        documentName: "",
        isDefault: false,
        files: [],
    });



    return (
        <div className="min-h-screen bg-slate-50">
            <FormHeader />

            <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold tracking-tight text-slate-800">
                        Mock-up Inspection Report
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Complete each stage and proceed using the navigation buttons.
                    </p>
                </div>

                {/* Stepper */}
                {/* <div className="mb-8 flex items-center">
                    {STEPS.map((label, index) => (
                        <div
                            key={label}
                            className="flex flex-1 items-center last:flex-none"
                        >
                            <div className="flex items-center gap-2.5">
                                <span
                                    className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors ${index < step
                                        ? "bg-green-600 text-white"
                                        : index === step
                                            ? "bg-blue-600 text-white"
                                            : "bg-slate-200 text-slate-500"
                                        }`}
                                >
                                    {index < step ? <Check className="h-4 w-4" /> : index + 1}
                                </span>

                                <span
                                    className={`hidden text-sm font-medium sm:block ${index === step ? "text-slate-800" : "text-slate-500"
                                        }`}
                                >
                                    {label}
                                </span>
                            </div>

                            {index < STEPS.length - 1 && (
                                <div
                                    className={`mx-3 h-0.5 flex-1 rounded ${index < step ? "bg-green-600" : "bg-slate-200"
                                        }`}
                                />
                            )}
                        </div>
                    ))}
                </div> */}

                {/* Stage 1 */}
                {step === 0 && (
                    <div className="space-y-6">
                        <SectionCard number={1} title="Mock-up Inspection Request">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className={labelClass}>Project Name</label>
                                    <select
                                        value={project}
                                        onChange={(event) => setProject(event.target.value)}
                                        className={inputClass}
                                    >
                                        <option value="">Select project</option>
                                        {PROJECTS.map((projectName) => (
                                            <option key={projectName} value={projectName}>
                                                {projectName}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className={labelClass}>Location</label>
                                    <input
                                        type="text"
                                        value={location}
                                        onChange={(event) => setLocation(event.target.value)}
                                        placeholder="e.g. Site A — Block B"
                                        className={inputClass}
                                    />
                                </div>

                                <div>
                                    <label className={labelClass}>MOR Reference No.</label>
                                    <input
                                        type="text"
                                        value={morRef}
                                        onChange={(event) => setMorRef(event.target.value)}
                                        placeholder="e.g. MOR-2025-001"
                                        className={inputClass}
                                    />
                                </div>

                                <div>
                                    <label className={labelClass}>Submission Date</label>
                                    <input
                                        type="date"
                                        value={submissionDate}
                                        onChange={(event) => setSubmissionDate(event.target.value)}
                                        className={inputClass}
                                    />
                                </div>

                                <div>
                                    <label className={labelClass}>Submitted By</label>
                                    <input
                                        type="text"
                                        value={submittedBy}
                                        onChange={(event) => setSubmittedBy(event.target.value)}
                                        placeholder="Name"
                                        className={inputClass}
                                    />
                                </div>

                                <div>
                                    <label className={labelClass}>Date of Inspection</label>
                                    <input
                                        type="date"
                                        value={inspectionDate}
                                        onChange={(event) => setInspectionDate(event.target.value)}
                                        className={inputClass}
                                    />
                                </div>

                                <div className="sm:col-span-2">
                                    <label className={labelClass}>BOQ Item</label>
                                    <input
                                        type="text"
                                        value={boqItem}
                                        onChange={(event) => setBoqItem(event.target.value)}
                                        placeholder="BOQ item reference"
                                        className={inputClass}
                                    />
                                </div>

                                <div className="sm:col-span-2">
                                    <label className={labelClass}>
                                        We request approval of the following mock up / sample
                                    </label>
                                    <textarea
                                        value={requestDetail}
                                        onChange={(event) => setRequestDetail(event.target.value)}
                                        placeholder="Manual entry"
                                        className={`${textareaClass} min-h-[140px]`}
                                    />
                                </div>
                            </div>
                        </SectionCard>

                        <SectionCard number={2} title="Attachments">
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[720px] border-collapse">
                                    <thead>
                                        <tr>
                                            <th className={`${thClass} w-16`}>Sr. No.</th>
                                            <th className={thClass}>Document Name</th>
                                            <th className={`${thClass} w-72`}>Attachment</th>
                                            <th className={`${thClass} w-16`}></th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {attachments.map((row, index) => (
                                            <tr key={row.id}>
                                                <td className={`${tdClass} text-center text-sm text-slate-600`}>
                                                    {index + 1}
                                                </td>

                                                <td className={tdClass}>
                                                    {row.isDefault ? (
                                                        <span className="text-sm font-medium text-slate-700">
                                                            {row.documentName}
                                                        </span>
                                                    ) : (
                                                        <input
                                                            type="text"
                                                            value={row.documentName}
                                                            onChange={(event) =>
                                                                updateAttachmentName(row.id, event.target.value)
                                                            }
                                                            placeholder="Enter other document name"
                                                            className={inputClass}
                                                        />
                                                    )}
                                                </td>

                                                <td className={tdClass}>
                                                    <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50">
                                                        <Upload className="h-4 w-4" />
                                                        Upload
                                                        <input
                                                            type="file"
                                                            multiple
                                                            className="hidden"
                                                            accept={
                                                                row.documentName ===
                                                                    "Photos for Reference (Multiple Attachment)"
                                                                    ? "image/*"
                                                                    : undefined
                                                            }
                                                            onChange={(event) =>
                                                                addAttachmentFiles(row.id, event.target.files)
                                                            }
                                                        />
                                                    </label>

                                                    {row.files.length > 0 && (
                                                        <div className="mt-2 space-y-1">
                                                            {row.files.map((file) => (
                                                                <div
                                                                    key={file.id}
                                                                    className="flex items-center justify-between gap-2 rounded bg-slate-50 px-2 py-1 text-xs text-slate-500"
                                                                >
                                                                    <span className="truncate">{file.name}</span>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            removeAttachmentFile(row.id, file.id)
                                                                        }
                                                                        className="text-red-500 hover:text-red-700"
                                                                        aria-label="Remove file"
                                                                    >
                                                                        <X className="h-3.5 w-3.5" />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </td>

                                                <td className={`${tdClass} text-center`}>
                                                    {!row.isDefault && (
                                                        <button
                                                            type="button"
                                                            onClick={() => removeAttachmentRow(row.id)}
                                                            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600"
                                                            aria-label="Remove document row"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <button
                                type="button"
                                onClick={addOtherDocumentRow}
                                className="mt-4 inline-flex items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100"
                            >
                                <Plus className="h-4 w-4" />
                                Other Documents
                            </button>
                        </SectionCard>
                    </div>
                )}

                {/* Stage 2 */}
                {step === 1 && (
                    <SectionCard number={2} title="Stage Wise Construction Details">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[720px] border-collapse">
                                <thead>
                                    <tr>
                                        <th className={`${thClass} w-16`}>Sr. No.</th>
                                        <th className={`${thClass} w-72`}>Description</th>
                                        <th className={thClass}>Reference Photos</th>
                                        <th className={`${thClass} w-14`}></th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {rows.map((row, index) => (
                                        <tr key={index}>
                                            <td
                                                className={`${tdClass} text-center text-sm text-slate-600`}
                                            >
                                                {index + 1}
                                            </td>

                                            <td className={tdClass}>
                                                <textarea
                                                    value={row.description}
                                                    onChange={(event) =>
                                                        updateRow(index, "description", event.target.value)
                                                    }
                                                    placeholder="Describe construction stage"
                                                    className={textareaClass}
                                                />
                                            </td>

                                            <td className={tdClass}>
                                                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                                                    {row.photos.map((photo) => (
                                                        <div
                                                            key={photo.id}
                                                            className="group relative aspect-square overflow-hidden rounded-md border border-slate-200"
                                                        >
                                                            <img
                                                                src={photo.url}
                                                                alt={photo.name}
                                                                className="h-full w-full object-cover"
                                                            />

                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    removeRowPhoto(index, photo.id)
                                                                }
                                                                className="absolute right-1 top-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white opacity-0 transition-opacity hover:bg-red-600 group-hover:opacity-100"
                                                                aria-label="Remove photo"
                                                            >
                                                                <X className="h-3 w-3" />
                                                            </button>
                                                        </div>
                                                    ))}

                                                    <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed border-slate-300 bg-slate-50 text-slate-400 transition-colors hover:border-blue-400 hover:text-blue-500">
                                                        <Upload className="h-5 w-5" />
                                                        <span className="text-[10px] font-medium">
                                                            Upload
                                                        </span>
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            multiple
                                                            className="hidden"
                                                            onChange={(event) =>
                                                                addRowPhotos(index, event.target.files)
                                                            }
                                                        />
                                                    </label>
                                                </div>
                                            </td>

                                            <td className={`${tdClass} text-center`}>
                                                <button
                                                    type="button"
                                                    onClick={() => removeRow(index)}
                                                    className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600"
                                                    aria-label="Remove row"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <button
                            type="button"
                            onClick={addRow}
                            className="mt-4 inline-flex items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100"
                        >
                            <Plus className="h-4 w-4" />
                            Add Row
                        </button>
                    </SectionCard>
                )}

                {/* Stage 3 */}
                {step === 2 && (
                    <SectionCard number={3} title="Mockup Photos">
                        <label className="mb-5 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-slate-500 transition-colors hover:border-blue-400 hover:bg-blue-50/50">
                            <Upload className="h-7 w-7" />
                            <span className="text-sm font-medium text-slate-600">
                                Click to upload mockup photos
                            </span>
                            <span className="text-xs text-slate-400">
                                You can select multiple images
                            </span>
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                className="hidden"
                                onChange={(event) => addMockups(event.target.files)}
                            />
                        </label>

                        {mockups.length === 0 ? (
                            <p className="rounded-md bg-slate-50 px-4 py-6 text-center text-sm text-slate-400">
                                No mockup photos uploaded yet.
                            </p>
                        ) : (
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {mockups.map((mockup) => (
                                    <div
                                        key={mockup.id}
                                        className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
                                    >
                                        <div className="group relative aspect-video overflow-hidden bg-slate-100">
                                            <img
                                                src={mockup.url}
                                                alt={mockup.name}
                                                className="h-full w-full object-cover"
                                            />

                                            <button
                                                type="button"
                                                onClick={() => removeMockup(mockup.id)}
                                                className="absolute right-2 top-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white opacity-0 transition-opacity hover:bg-red-600 group-hover:opacity-100"
                                                aria-label="Remove image"
                                            >
                                                <X className="h-3.5 w-3.5" />
                                            </button>
                                        </div>

                                        <div className="p-3">
                                            <textarea
                                                value={mockup.description}
                                                onChange={(event) =>
                                                    updateMockup(mockup.id, event.target.value)
                                                }
                                                placeholder="Description for this photo"
                                                className={`${textareaClass} min-h-[60px]`}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </SectionCard>
                )}

                {/* Navigation */}
                <div className="mt-6 flex items-center justify-between pb-10">
                    <button
                        type="button"
                        onClick={back}
                        disabled={step === 0}
                        className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </button>

                    {step < LAST_STEP ? (
                        <button
                            type="button"
                            onClick={next}
                            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                        >
                            Next
                            <ArrowRight className="h-4 w-4" />
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={handleSubmit}
                            className="inline-flex items-center gap-2 rounded-md bg-green-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-700"
                        >
                            <Check className="h-4 w-4" />
                            Submit Inspection
                        </button>
                    )}
                </div>
            </main>
        </div>
    );
};

export default MOR;