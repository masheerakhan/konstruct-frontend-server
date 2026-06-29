import React, { useState, useRef, useEffect } from "react";
import { Plus, X, ChevronDown, CheckSquare, Square, Lock } from "lucide-react";

const ROLE_OPTIONS = [
    { value: "INITIALIZER", label: "Initializer" },
    { value: "MAKER", label: "Maker" },
    { value: "CHECKER", label: "Checker" },
    { value: "SUPERVISOR", label: "Supervisor" },
];

function HousekeepingFlowConfig({
    movementSteps,
    setMovementSteps,
    tillApprove,
    setTillApprove,
    roundCount,
    setRoundCount,
    finalQuestions = [],
    isObservationFlow = false,
}) {
    const [openDropdownIdx, setOpenDropdownIdx] = useState(null);

    useEffect(() => {
        if (isObservationFlow) {
            setTillApprove((prev) => (prev !== true ? true : prev));
            setMovementSteps((prev) => {
                // To avoid infinite loop, only update if length is different or role differs
                if (prev.length === 3 && prev[0].role === "CHECKER" && prev[1].role === "MAKER") {
                    return prev;
                }
                return [
                    { order_index: 1, role: "CHECKER", assigned_questions: [0, 1, 2, 3, 4, 5, 6, 7] },
                    { order_index: 2, role: "MAKER", assigned_questions: [8] },
                    { order_index: 3, role: "CHECKER", assigned_questions: finalQuestions.map((_, i) => i) }
                ];
            });
        }
    }, [isObservationFlow, setMovementSteps, setTillApprove, finalQuestions.length]);

    const addMovementStep = () => {
        const nextOrder = movementSteps.length + 1;

        setMovementSteps((prev) => [
            ...prev,
            {
                order_index: nextOrder,
                role: "MAKER",
                assigned_questions: finalQuestions.map((_, i) => i),
            },
        ]);
    };

    const updateMovementStep = (idx, field, value) => {
        setMovementSteps((prev) =>
            prev.map((step, i) =>
                i === idx
                    ? {
                        ...step,
                        [field]: value,
                    }
                    : step
            )
        );
    };

    const toggleQuestion = (stepIdx, qIdx) => {
        setMovementSteps(prev => {
            const newSteps = [...prev];
            const step = { ...newSteps[stepIdx] };
            const currentAssigned = step.assigned_questions || finalQuestions.map((_, i) => i);
            
            let nextAssigned;
            if (currentAssigned.includes(qIdx)) {
                nextAssigned = currentAssigned.filter(id => id !== qIdx);
            } else {
                nextAssigned = [...currentAssigned, qIdx].sort((a, b) => a - b);
            }
            step.assigned_questions = nextAssigned;
            newSteps[stepIdx] = step;
            return newSteps;
        });
    };

    const toggleAllQuestions = (stepIdx, selectAll) => {
        setMovementSteps(prev => {
            const newSteps = [...prev];
            const step = { ...newSteps[stepIdx] };
            step.assigned_questions = selectAll ? finalQuestions.map((_, i) => i) : [];
            newSteps[stepIdx] = step;
            return newSteps;
        });
    };

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.question-dropdown-container')) {
                setOpenDropdownIdx(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const removeMovementStep = (idx) => {
        setMovementSteps((prev) => {
            const next = prev.filter((_, i) => i !== idx);

            return next.map((step, i) => ({
                ...step,
                order_index: i + 1,
            }));
        });
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Flow Config
            </h2>

            <p className="text-sm text-gray-500 mb-5">
                Define the default role movement flow for this safety template. Maker
                will be the checklist creator and Checker will be resolved from project
                safety officers.
            </p>

            <div className="mb-5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-blue-800">
                <p className="font-semibold mb-1">Assignment rule:</p>
                <p>
                    Maker = user who creates checklist. Checker = users in project where{" "}
                    <b>is_safetyOfficer = true</b>.
                </p>
            </div>

            {isObservationFlow ? (
                <div className="mb-5 rounded-xl border border-orange-100 bg-orange-50/50 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-semibold text-orange-800">
                        <CheckSquare size={18} className="text-orange-500" />
                        Approval Loop: Till Approve
                    </div>
                    <div className="text-xs bg-orange-100 text-orange-700 px-2.5 py-1 rounded-md font-semibold flex items-center gap-1 shadow-sm border border-orange-200">
                        <Lock size={12} />
                        Locked for Observation
                    </div>
                </div>
            ) : (
                <div className="mb-5 rounded-xl border border-gray-100 bg-gray-50 p-4">
                    <h3 className="mb-3 text-sm font-semibold text-gray-800">
                        Approval Loop
                    </h3>

                    <label className="mb-3 flex items-center gap-2 text-sm text-gray-700">
                        <input
                            type="checkbox"
                            checked={tillApprove}
                            onChange={(e) => setTillApprove(e.target.checked)}
                            className="h-4 w-4 accent-orange-500"
                        />
                        Till Approve
                    </label>

                    {!tillApprove && (
                        <div className="max-w-xs">
                            <label className="mb-1 block text-xs text-gray-600">
                                Round No.
                            </label>
                            <input
                                type="number"
                                min="1"
                                value={roundCount}
                                onChange={(e) => {
                                    const value = Number(e.target.value || 1);
                                    setRoundCount(value < 1 ? 1 : value);
                                }}
                                className="h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm"
                                placeholder="Enter round count"
                            />
                        </div>
                    )}
                </div>
            )}

            <div className="flex flex-col gap-4">
                {movementSteps.map((step, idx) => (
                    <div
                        key={idx}
                        className={`flex flex-wrap items-end gap-4 rounded-xl border p-4 ${
                            isObservationFlow ? "border-orange-100 bg-orange-50/20" : "border-gray-100 bg-gray-50"
                        }`}
                    >
                        {isObservationFlow ? (
                            <>
                                <div className="flex flex-col gap-1 flex-1 min-w-[150px]">
                                    <label className="text-xs text-gray-500 font-medium">
                                        Step {idx + 1} – Role
                                    </label>
                                    <div className="h-10 w-full rounded-md border border-orange-200 bg-white px-3 flex items-center text-sm font-semibold text-orange-800 shadow-sm">
                                        {ROLE_OPTIONS.find((r) => r.value === step.role)?.label || step.role}
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
                                    <label className="text-xs text-gray-500 font-medium">
                                        Assigned Questions
                                    </label>
                                    <div className="h-10 w-full rounded-md border border-orange-200 bg-white px-3 flex items-center text-sm font-semibold text-orange-800 shadow-sm">
                                        {(step.assigned_questions || finalQuestions.map((_, i) => i)).length === finalQuestions.length
                                            ? "All Questions Selected"
                                            : `${(step.assigned_questions || finalQuestions.map((_, i) => i)).length} Selected`}
                                    </div>
                                </div>
                                <div className="h-10 flex items-center px-2">
                                    <Lock size={16} className="text-orange-300" />
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="flex flex-col">
                                    <label className="text-xs mb-1 text-gray-600">
                                        Step {idx + 1} – Role
                                    </label>

                                    <select
                                        value={step.role}
                                        onChange={(e) =>
                                            updateMovementStep(idx, "role", e.target.value)
                                        }
                                        className="h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm sm:min-w-[180px]"
                                    >
                                        {ROLE_OPTIONS.map((r) => (
                                            <option key={r.value} value={r.value}>
                                                {r.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex flex-col relative question-dropdown-container">
                                    <label className="text-xs mb-1 text-gray-600">
                                        Assigned Questions
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => setOpenDropdownIdx(openDropdownIdx === idx ? null : idx)}
                                        className="h-10 w-full flex items-center justify-between rounded-md border border-gray-200 bg-white px-3 text-sm sm:min-w-[220px] text-left"
                                    >
                                        <span className="truncate mr-2">
                                            {(step.assigned_questions || finalQuestions.map((_, i) => i)).length === finalQuestions.length
                                                ? "All Questions Selected"
                                                : `${(step.assigned_questions || finalQuestions.map((_, i) => i)).length} Selected`}
                                        </span>
                                        <ChevronDown size={16} className="text-gray-400 shrink-0" />
                                    </button>

                                    {openDropdownIdx === idx && (
                                        <div className="absolute top-16 left-0 z-10 mt-1 w-72 rounded-md border border-gray-200 bg-white shadow-lg py-1 max-h-60 overflow-y-auto">
                                            <div className="px-3 py-2 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-20">
                                                <button
                                                    type="button"
                                                    onClick={() => toggleAllQuestions(idx, true)}
                                                    className="text-xs text-orange-600 hover:text-orange-700 font-medium"
                                                >
                                                    Select All
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => toggleAllQuestions(idx, false)}
                                                    className="text-xs text-gray-500 hover:text-gray-700 font-medium"
                                                >
                                                    Clear
                                                </button>
                                            </div>
                                            <div className="py-1">
                                                {finalQuestions.map((q, qIdx) => {
                                                    const isSelected = (step.assigned_questions || finalQuestions.map((_, i) => i)).includes(qIdx);
                                                    return (
                                                        <button
                                                            key={qIdx}
                                                            type="button"
                                                            onClick={() => toggleQuestion(idx, qIdx)}
                                                            className="w-full flex items-start gap-2 px-3 py-2 text-left hover:bg-gray-50"
                                                        >
                                                            <div className="mt-0.5 shrink-0 text-orange-500">
                                                                {isSelected ? <CheckSquare size={16} /> : <Square size={16} className="text-gray-300" />}
                                                            </div>
                                                            <span className="text-sm text-gray-700 leading-tight">
                                                                Q{qIdx + 1}: {q.text || "Untitled Question"}
                                                            </span>
                                                        </button>
                                                    );
                                                })}
                                                {finalQuestions.length === 0 && (
                                                    <div className="px-3 py-4 text-center text-sm text-gray-500">
                                                        No questions added yet
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <button
                                    type="button"
                                    onClick={() => removeMovementStep(idx)}
                                    className="h-10 rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600"
                                >
                                    <X size={16} />
                                </button>
                            </>
                        )}
                    </div>
                ))}

                {!isObservationFlow && (
                    <button
                        type="button"
                        onClick={addMovementStep}
                        className="self-start h-10 px-4 bg-orange-500 text-white rounded-md flex items-center gap-1 text-sm font-semibold hover:bg-orange-600"
                    >
                        <Plus size={16} />
                        Add Step
                    </button>
                )}
            </div>
        </div>
    );
}

export default HousekeepingFlowConfig;