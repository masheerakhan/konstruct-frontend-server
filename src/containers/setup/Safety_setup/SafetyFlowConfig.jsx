import React from "react";
import { Plus, X } from "lucide-react";

const ROLE_OPTIONS = [
    { value: "INITIALIZER", label: "Initializer" },
    { value: "MAKER", label: "Maker" },
    { value: "CHECKER", label: "Checker" },
    { value: "SUPERVISOR", label: "Supervisor" },
];

function SafetyFlowConfig({
    movementSteps,
    setMovementSteps,
    tillApprove,
    setTillApprove,
    roundCount,
    setRoundCount,
}) {
    const addMovementStep = () => {
        const nextOrder = movementSteps.length + 1;

        setMovementSteps((prev) => [
            ...prev,
            {
                order_index: nextOrder,
                role: "MAKER",
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

            <div className="flex flex-col gap-4">
                {movementSteps.map((step, idx) => (
                    <div
                        key={idx}
                        className="flex flex-wrap items-end gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4"
                    >
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

                        <button
                            type="button"
                            onClick={() => removeMovementStep(idx)}
                            className="h-10 rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600"
                        >
                            <X size={16} />
                        </button>
                    </div>
                ))}

                <button
                    type="button"
                    onClick={addMovementStep}
                    className="self-start h-10 px-4 bg-orange-500 text-white rounded-md flex items-center gap-1 text-sm font-semibold hover:bg-orange-600"
                >
                    <Plus size={16} />
                    Add Step
                </button>
            </div>
        </div>
    );
}

export default SafetyFlowConfig;