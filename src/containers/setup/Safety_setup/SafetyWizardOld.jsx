// frontendservice/kounstruct-frontend/src/containers/setup/Safety_setup/SafetyWizard.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { toast } from "react-hot-toast";

import { getProjectsForCurrentUser } from "../../../api";
import SafetyCategory from "./SafetyCategory";
import UploadAndMapping from "./UploadAndMapping";
import FinalPreview from "./FinalPreview";
import SafetyReportTemplate from "./SafetyReportTemplate";

const STEPS = [
    { id: "category", label: "Category" },
    { id: "upload", label: "Upload & Select Questions" },
    { id: "preview", label: "Preview" },
    { id: "report", label: "Create Report Template" },
];

function SafetyWizard() {
    console.log("SafetyWizard render hit");
    const navigate = useNavigate();
    const [currentStepIndex, setCurrentStepIndex] = useState(0);

    // Category state
    const [categories, setCategories] = useState([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState("");
    const [projects, setProjects] = useState([]);
    const [selectedProjectId, setSelectedProjectId] = useState("");
    const [projectsLoading, setProjectsLoading] = useState(true);

    // Excel / mapping state
    const [excelData, setExcelData] = useState(null);
    const [sheetNames, setSheetNames] = useState([]);
    const [activeSheet, setActiveSheet] = useState("");

    // Questions: excel-converted + manual, merged into finalQuestions for preview/report
    const [excelQuestions, setExcelQuestions] = useState([]);
    const [manualQuestions, setManualQuestions] = useState([]);
    const [finalQuestions, setFinalQuestions] = useState([]);
    const [reportTitle, setReportTitle] = useState("");

    useEffect(() => {
        console.log("sdfghfgdf")
        const load = async () => {
            setProjectsLoading(true);
            try {
                const res = await getProjectsForCurrentUser();
                console.log("projects api raw response:", res);
                // const raw = res?.data?.projects ?? res;
                // const list = Array.isArray(raw) ? raw : (raw?.results?.projects ?? []);
                const payload = res?.data ?? res ?? {};
                console.log("projects payload:", payload);
                const list = Array.isArray(payload)
                  ? payload
                  : Array.isArray(payload.projects)
                    ? payload.projects
                    : Array.isArray(payload?.results?.projects)
                      ? payload.results.projects
                      : [];
                      console.log("projects list:", list);
                const mapped = list.map((p) => ({
                    id: p.id,
                    name: p.name || p.project_name || p.project_title || `Project #${p.id}`,
                    org_id: p.organization_id ?? p.org_id ?? p.org,
                }));
                console.log("mapped projects:", mapped);
                setProjects(mapped);
                if (mapped.length && !selectedProjectId) setSelectedProjectId(String(mapped[0].id));
            } catch (e) {
                console.error(e);
                const status = e?.response?.status;
                const msg = status === 404
                    ? "Projects service not available. Please ensure the backend is running."
                    : e?.response?.data?.detail || e?.message || "Failed to load projects";
                toast.error(msg);
                setProjects([]); // Allow wizard to continue with empty projects
            } finally {
                setProjectsLoading(false);
            }
        };
        load();
    }, []);

    const currentStep = STEPS[currentStepIndex];

    const goPrev = () => {
        if (currentStepIndex === 0) return;
        setCurrentStepIndex((i) => i - 1);
    };

    const goNext = () => {
        const isLast = currentStepIndex === STEPS.length - 1;
        if (isLast) return;
        // When leaving upload step, merge excel + manual questions into finalQuestions
        if (currentStep.id === "upload") {
            setFinalQuestions([...excelQuestions, ...manualQuestions]);
        }
        setCurrentStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
    };

    const isFirstStep = currentStepIndex === 0;
    const isLastStep = currentStepIndex === STEPS.length - 1;

    const showNextButton = true;

    const handleSheetChange = (sheetName) => {
        setActiveSheet(sheetName);
    };

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
                        orgId={Array.isArray(projects) ? projects.find((p) => String(p.id) === String(selectedProjectId))?.org_id : undefined}
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
                        onUploadComplete={() => {}}
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
                            if (formTitle != null && formTitle !== undefined) setReportTitle(formTitle);
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
                        orgId={Array.isArray(projects) ? projects.find((p) => String(p.id) === String(selectedProjectId))?.org_id : undefined}
                        projectId={selectedProjectId}
                        selectedCategoryId={selectedCategoryId}
                        onTemplateCreated={() => {
                            toast.success("Template created successfully.");
                            navigate("/safetySetup");
                        }}
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
                    <div className="flex items-center gap-4">
                        {STEPS.map((step, index) => {
                            const isActive = index === currentStepIndex;
                            const isCompleted = index < currentStepIndex;
                            return (
                                <div key={step.id} className="flex items-center">
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
                            disabled={isFirstStep}
                            className={`inline-flex items-center px-4 py-2 rounded-xl border text-sm ${isFirstStep
                                ? "border-gray-200 text-gray-300 cursor-not-allowed"
                                : "border-gray-200 text-gray-700 hover:bg-gray-50"
                                }`}
                        >
                            <ArrowLeft className="mr-1 h-4 w-4" />
                            Previous
                        </button>

                        {showNextButton && (
                            <button
                                type="button"
                                onClick={goNext}
                                className="inline-flex items-center px-5 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600"
                            >
                                {isLastStep ? "Submit" : "Next"}
                                <ArrowRight className="ml-1 h-4 w-4" />
                            </button>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

export default SafetyWizard;
