import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { toast } from "react-hot-toast";

import { getProjectsForCurrentUser, createSafetyTemplate } from "../../../api";
import SafetyCategory from "./SafetyCategory";
import UploadAndMapping from "./UploadAndMapping";
import FinalPreview from "./FinalPreview";
import SafetyReportTemplate from "./SafetyReportTemplate";
import SafetyFlowConfig from "./SafetyFlowConfig";

const STEPS = [
    { id: "category", label: "Category" },
    { id: "upload", label: "Upload & Select Questions" },
    { id: "preview", label: "Preview" },
    { id: "report", label: "Create Report Template" },
    { id: "flow", label: "Flow Config" },
];

const DEFAULT_MOVEMENT_STEPS = [
    { order_index: 1, role: "MAKER" },
    { order_index: 2, role: "CHECKER" },
];

function buildTemplateCode(title) {
    return (
        String(title || "TEMPLATE")
            .toUpperCase()
            .replace(/\s+/g, "_")
            .replace(/[^A-Z0-9_]/g, "") || "TEMPLATE"
    );
}

function SafetyWizard() {
    const navigate = useNavigate();
    const [currentStepIndex, setCurrentStepIndex] = useState(0);

    const [categories, setCategories] = useState([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState("");
    const [projects, setProjects] = useState([]);
    const [selectedProjectId, setSelectedProjectId] = useState("");
    const [projectsLoading, setProjectsLoading] = useState(true);

    const [excelData, setExcelData] = useState(null);
    const [sheetNames, setSheetNames] = useState([]);
    const [activeSheet, setActiveSheet] = useState("");

    const [excelQuestions, setExcelQuestions] = useState([]);
    const [manualQuestions, setManualQuestions] = useState([]);
    const [finalQuestions, setFinalQuestions] = useState([]);
    const [reportTitle, setReportTitle] = useState("");

    const [movementSteps, setMovementSteps] = useState(DEFAULT_MOVEMENT_STEPS);
    const [reportDraft, setReportDraft] = useState(null);
    const [creatingTemplate, setCreatingTemplate] = useState(false);

    const [tillApprove, setTillApprove] = useState(true);
    const [roundCount, setRoundCount] = useState(1);

    const selectedProject = Array.isArray(projects)
        ? projects.find((p) => String(p.id) === String(selectedProjectId))
        : null;

    const selectedOrgId = selectedProject?.org_id;

    useEffect(() => {
        const load = async () => {
            setProjectsLoading(true);

            try {
                const res = await getProjectsForCurrentUser();
                const raw = res?.data ?? res;
                const list = Array.isArray(raw) ? raw : raw?.results ?? [];

                const mapped = list.map((p) => ({
                    id: p.id,
                    name:
                        p.name ||
                        p.project_name ||
                        p.project_title ||
                        `Project #${p.id}`,
                    org_id: p.organization_id ?? p.org_id ?? p.org,
                }));

                setProjects(mapped);

                if (mapped.length && !selectedProjectId) {
                    setSelectedProjectId(String(mapped[0].id));
                }
            } catch (e) {
                console.error(e);

                const status = e?.response?.status;
                const msg =
                    status === 404
                        ? "Projects service not available. Please ensure the backend is running."
                        : e?.response?.data?.detail ||
                        e?.message ||
                        "Failed to load projects";

                toast.error(msg);
                setProjects([]);
            } finally {
                setProjectsLoading(false);
            }
        };

        load();
    }, []);

    const currentStep = STEPS[currentStepIndex];

    const handleSheetChange = (sheetName) => {
        setActiveSheet(sheetName);
    };

    const goPrev = () => {
        if (currentStepIndex === 0) return;
        setCurrentStepIndex((i) => i - 1);
    };

    const handleCreateTemplate = async () => {
        if (!selectedOrgId || !selectedProjectId || !selectedCategoryId) {
            toast.error("Please complete Category step and select project/category.");
            return;
        }

        if (!finalQuestions.length) {
            toast.error("Please add at least one question.");
            return;
        }

        const validSteps = (movementSteps || []).filter((step) => step.role);

        if (!validSteps.length) {
            toast.error("Please configure at least one flow step.");
            return;
        }

        const titleVal =
            reportDraft?.title || reportTitle || "Untitled Template";

        const questions = (finalQuestions || []).map((q, idx) => {
            const photoRequired = !!(q.photo_required ?? q.required);

            return {
                order_index: idx + 1,
                text: typeof q.text === "string" ? q.text.trim() : "",
                description: q.description || "",
                type: q.type || "multiple_choice",
                options: Array.isArray(q.options) ? q.options : ["Yes", "No", "N/A"],
                required: !!q.required,
                photo_required: photoRequired,
            };
        });

        // const workflowConfig = validSteps.map((step, idx) => ({
        //     order_index: idx + 1,
        //     role: step.role,
        //     user_id: Number(step.user_id),
        //     user_name: step.user_name || "",
        // }));


        const workflowConfig = validSteps.map((step, idx) => ({
            order_index: idx + 1,
            role: step.role,
        }));


        const meta = reportDraft?.meta || {};

        setCreatingTemplate(true);

        try {
            const formData = new FormData();

            formData.append("org_id", Number(selectedOrgId));
            formData.append("project_id", Number(selectedProjectId));
            formData.append("category", Number(selectedCategoryId));
            formData.append("title", titleVal);
            // formData.append("template_code", buildTemplateCode(titleVal));
            const uniqueCode = `${buildTemplateCode(titleVal)}_V${Date.now()}`;

            formData.append("template_code", uniqueCode);
            formData.append("status", "ACTIVE");



            formData.append(
                "report_header_meta",
                JSON.stringify({
                    format_no: meta.formatNo || "",
                    revision_no: meta.revisionNo || "",
                    issued_date: meta.issuedDate || "",
                    revision_date: meta.revisionDate || "",
                    project: meta.project || "",
                    inspection_report_prefix: String(
                        meta.inspectionReportPrefix || meta.inspectionReportNo || ""
                    )
                        .trim()
                        .replace(/-$/, ""),

                    inspection_report_no: "",
                    date_of_inspection: meta.dateOfInspection || "",
                    name_of_contractor: meta.nameOfContractor || "",
                    make_model: meta.makeModel || "",
                    location: meta.location || "",
                    identification_no: meta.identificationNo || "",
                    name_of_operator: meta.nameOfOperator || "",
                })
            );

            formData.append(
                "report_layout",
                JSON.stringify({
                    show_remark: true,
                    repeat_config: {
                        mode: tillApprove ? "TILL_APPROVED" : "COUNT",
                        count: tillApprove ? null : Number(roundCount || 1),
                    },
                })
            );

            formData.append("flow_config", JSON.stringify(workflowConfig));

            formData.append("questions", JSON.stringify(questions));

            if (reportDraft?.leftLogoFile) {
                formData.append("report_logo", reportDraft.leftLogoFile);
            }

            if (reportDraft?.rightLogoFile) {
                formData.append("report_logo_right", reportDraft.rightLogoFile);
            }

            await createSafetyTemplate(formData);

            toast.success("Template created successfully.");
            navigate("/safetySetup");
        } catch (e) {
            console.error(e);

            const msg =
                e?.response?.data?.title?.[0] ||
                e?.response?.data?.category?.[0] ||
                e?.response?.data?.detail ||
                "Failed to create template";

            toast.error(msg);
        } finally {
            setCreatingTemplate(false);
        }
    };

    const goNext = () => {
        const isLast = currentStepIndex === STEPS.length - 1;

        if (currentStep.id === "upload") {
            setFinalQuestions([...excelQuestions, ...manualQuestions]);
        }

        if (isLast) {
            handleCreateTemplate();
            return;
        }

        setCurrentStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
    };

    const isFirstStep = currentStepIndex === 0;
    const isLastStep = currentStepIndex === STEPS.length - 1;

    const renderStepContent = () => {
        switch (currentStep.id) {
            case "category":
                return (
                    <SafetyCategory
                        categories={Array.isArray(categories) ? categories : []}
                        setCategories={setCategories}
                        selectedCategoryId={selectedCategoryId}
                        onSelectCategory={setSelectedCategoryId}
                        projects={Array.isArray(projects) ? projects : []}
                        selectedProjectId={selectedProjectId}
                        onSelectProject={setSelectedProjectId}
                        orgId={selectedOrgId}
                        projectId={selectedProjectId}
                        projectsLoading={projectsLoading}
                    />
                );

            case "upload":
                return (
                    <UploadAndMapping
                        excelData={excelData}
                        setExcelData={setExcelData}
                        sheetNames={sheetNames}
                        setSheetNames={setSheetNames}
                        activeSheet={activeSheet}
                        setActiveSheet={setActiveSheet}
                        excelQuestions={excelQuestions}
                        setExcelQuestions={setExcelQuestions}
                        manualQuestions={manualQuestions}
                        setManualQuestions={setManualQuestions}
                        onUploadComplete={() => { }}
                        onSheetChange={handleSheetChange}
                        onBack={goPrev}
                    />
                );

            case "preview":
                return (
                    <FinalPreview
                        initialQuestions={finalQuestions}
                        onBack={() => setCurrentStepIndex(1)}
                        onSave={(questions, userDetails, formTitle) => {
                            setFinalQuestions(questions);

                            if (formTitle != null && formTitle !== undefined) {
                                setReportTitle(formTitle);
                            }
                        }}
                    />
                );

            case "report":
                return (
                    <SafetyReportTemplate
                        excelData={excelData}
                        sheetName={activeSheet}
                        selectedQuestions={finalQuestions}
                        reportTitle={reportTitle}
                        orgId={selectedOrgId}
                        projectId={selectedProjectId}
                        selectedCategoryId={selectedCategoryId}
                        deferCreate
                        onReportDraftChange={setReportDraft}
                    />
                );

            case "flow":
                return (
                    <SafetyFlowConfig
                        movementSteps={movementSteps}
                        setMovementSteps={setMovementSteps}
                        tillApprove={tillApprove}
                        setTillApprove={setTillApprove}
                        roundCount={roundCount}
                        setRoundCount={setRoundCount}
                    />
                );

            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-[#f5f5f7] flex flex-col">
            <header className="border-b border-orange-100 bg-white">
                <div className="max-w-6xl mx-auto px-6 py-4">
                    <div className="flex items-center gap-4 overflow-x-auto">
                        {STEPS.map((step, index) => {
                            const isActive = index === currentStepIndex;
                            const isCompleted = index < currentStepIndex;

                            return (
                                <div key={step.id} className="flex items-center shrink-0">
                                    <button
                                        type="button"
                                        className={`flex items-center gap-2 text-xs font-medium ${isActive
                                            ? "text-orange-600"
                                            : isCompleted
                                                ? "text-green-600"
                                                : "text-gray-400"
                                            }`}
                                        onClick={() => setCurrentStepIndex(index)}
                                    >
                                        <span
                                            className={`h-6 w-6 flex items-center justify-center rounded-full text-[11px] ${isActive
                                                ? "bg-orange-500 text-white"
                                                : isCompleted
                                                    ? "bg-green-500 text-white"
                                                    : "bg-gray-200 text-gray-600"
                                                }`}
                                        >
                                            {index + 1}
                                        </span>

                                        <span>{step.label}</span>
                                    </button>

                                    {index < STEPS.length - 1 && (
                                        <div className="mx-2 h-px w-8 bg-gray-200" />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </header>

            <main className="flex-1 px-4 py-6 flex justify-center">
                <div className="w-full max-w-6xl space-y-6">
                    {renderStepContent()}

                    <div className="mt-6 flex justify-between items-center">
                        <button
                            type="button"
                            onClick={goPrev}
                            disabled={isFirstStep || creatingTemplate}
                            className={`inline-flex items-center px-4 py-2 rounded-xl border text-sm ${isFirstStep || creatingTemplate
                                ? "border-gray-200 text-gray-300 cursor-not-allowed"
                                : "border-gray-200 text-gray-700 hover:bg-gray-50"
                                }`}
                        >
                            <ArrowLeft className="mr-1 h-4 w-4" />
                            Previous
                        </button>

                        <button
                            type="button"
                            onClick={goNext}
                            disabled={creatingTemplate}
                            className="inline-flex items-center px-5 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLastStep
                                ? creatingTemplate
                                    ? "Creating..."
                                    : "Create Template"
                                : "Next"}

                            <ArrowRight className="ml-1 h-4 w-4" />
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default SafetyWizard;