import React, { useMemo } from "react";
import { Plus, Trash2, Lock } from "lucide-react";

import {
    HEADER_FIELD_SOURCES,
    HEADER_INPUT_TYPES,
    SYSTEM_KEY_OPTIONS,
    PROTECTED_HEADER_KEYS,
    createCustomHeaderField,
    buildHeaderPreviewRows,
} from "./safetyHeaderFields";

function HousekeepingHeaderFieldsConfig({
    headerFields,
    setHeaderFields,
    reportNumberConfig,
    setReportNumberConfig,
    projectName = "",
}) {
    const updateField = (index, updates) => {
        setHeaderFields((previous) =>
            previous.map((field, fieldIndex) =>
                fieldIndex === index
                    ? { ...field, ...updates }
                    : field
            )
        );
    };

    // const handleSourceChange = (index, source) => {
    //     let systemKey = "";

    //     if (source === "SYSTEM_GENERATED") {
    //         systemKey = "created_date";
    //     }

    //     if (source === "PROJECT_CONTEXT") {
    //         systemKey = "project_name";
    //     }

    //     updateField(index, {
    //         source,
    //         system_key: systemKey,
    //         editable_by_maker: source === "MAKER_INPUT",
    //         required: false,
    //     });
    // };



    const handleSourceChange = (index, source) => {
        const currentField = headerFields[index];

        let systemKey = "";

        if (source === "SYSTEM_GENERATED") {
            /*
                Inspection Report No. always uses auto-number sequence.
                Other generated fields can choose date/generated resolver.
            */
            systemKey =
                currentField?.key === "inspection_report_no"
                    ? "report_no"
                    : "created_date";
        }

        if (source === "PROJECT_CONTEXT") {
            systemKey = "project_name";
        }

        updateField(index, {
            source,
            system_key: systemKey,
            default_value:
                source === "SYSTEM_GENERATED" || source === "PROJECT_CONTEXT"
                    ? ""
                    : currentField?.default_value || "",
            editable_by_maker: source === "MAKER_INPUT",
            required: false,
        });
    };

    const addField = () => {
        setHeaderFields((previous) => [
            ...previous,
            createCustomHeaderField(previous.length),
        ]);
    };

    const removeField = (index) => {
        setHeaderFields((previous) =>
            previous
                .filter((_, fieldIndex) => fieldIndex !== index)
                .map((field, fieldIndex) => ({
                    ...field,
                    order_index: fieldIndex + 1,
                }))
        );
    };

    const previewRows = useMemo(
        () =>
            buildHeaderPreviewRows(headerFields, {
                projectName,
                reportNumberConfig,
            }),
        [headerFields, projectName, reportNumberConfig]
    );

    return (
        <div className="space-y-6">
            <div className="rounded-2xl border border-orange-100 bg-white p-6 shadow-sm">
                <h2 className="mb-2 text-lg font-semibold text-gray-900">
                    Configure Report Header Fields
                </h2>

                <p className="mb-6 text-sm text-gray-500">
                    Define which information appears at the top of this report.
                    Protected keys cannot be removed or renamed, but their value source
                    can be configured. Auto-number fields require a prefix within the field itself.
                </p>

                {/* <div className="mb-6 rounded-xl border border-orange-100 bg-orange-50/60 p-4">
                    <h3 className="mb-3 text-sm font-semibold text-gray-900">
                        Inspection Report Number Sequence
                    </h3>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-600">
                                Prefix
                            </label>
                            <input
                                value={reportNumberConfig?.prefix || ""}
                                onChange={(event) =>
                                    setReportNumberConfig((previous) => ({
                                        ...previous,
                                        prefix: event.target.value,
                                    }))
                                }
                                placeholder="Example: ADL-NEST-AC"
                                className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-orange-500"
                            />
                            <p className="mt-1 text-xs text-gray-400">
                                Generated example:{" "}
                                {reportNumberConfig?.prefix
                                    ? `${String(reportNumberConfig.prefix).replace(/-+$/, "")}-${String(
                                        1
                                    ).padStart(Number(reportNumberConfig?.padding || 2), "0")}`
                                    : "PREFIX-01"}
                            </p>
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-medium text-gray-600">
                                Number Padding
                            </label>
                            <input
                                type="number"
                                min="1"
                                max="8"
                                value={reportNumberConfig?.padding || 2}
                                onChange={(event) =>
                                    setReportNumberConfig((previous) => ({
                                        ...previous,
                                        padding: Math.max(
                                            1,
                                            Number(event.target.value || 2)
                                        ),
                                    }))
                                }
                                className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-orange-500"
                            />
                        </div>
                    </div>
                </div> */}

                <div className="space-y-4">
                    {headerFields.map((field, index) => {
                        const isProtected = PROTECTED_HEADER_KEYS.has(field.key);

                        const isInspectionReportNumberField =
                            field.key === "inspection_report_no";

                        const isAutoNumberField =
                            field.source === "SYSTEM_GENERATED" &&
                            field.system_key === "report_no";

                        const systemOptions =
                            SYSTEM_KEY_OPTIONS[field.source] || [];

                        return (
                            <div
                                key={`${field.key}-${index}`}
                                className="rounded-xl border border-gray-100 bg-gray-50 p-4"
                            >
                                <div className="mb-4 flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-2">
                                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white">
                                            {index + 1}
                                        </span>

                                        <span className="text-sm font-semibold text-gray-800">
                                            {field.label || "Unnamed Field"}
                                        </span>

                                        {isProtected && (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-[11px] font-medium text-blue-700">
                                                <Lock className="h-3 w-3" />
                                                Protected
                                            </span>
                                        )}
                                    </div>

                                    {!isProtected && (
                                        <button
                                            type="button"
                                            onClick={() => removeField(index)}
                                            className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>

                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                    <div>
                                        <label className="mb-1 block text-xs font-medium text-gray-600">
                                            Label
                                        </label>
                                        <input
                                            value={field.label || ""}
                                            onChange={(event) =>
                                                updateField(index, {
                                                    label: event.target.value,
                                                })
                                            }
                                            className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-orange-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-xs font-medium text-gray-600">
                                            Key
                                        </label>
                                        <input
                                            value={field.key || ""}
                                            disabled={isProtected}
                                            onChange={(event) =>
                                                updateField(index, {
                                                    key: event.target.value,
                                                })
                                            }
                                            className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-orange-500 disabled:bg-gray-100 disabled:text-gray-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-xs font-medium text-gray-600">
                                            Source
                                        </label>
                                        <select
                                            value={field.source || "MAKER_INPUT"}
                                            onChange={(event) =>
                                                handleSourceChange(
                                                    index,
                                                    event.target.value
                                                )
                                            }
                                            className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-orange-500 disabled:bg-gray-100"
                                        >
                                            {HEADER_FIELD_SOURCES.map((source) => (
                                                <option
                                                    key={source.value}
                                                    value={source.value}
                                                >
                                                    {source.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-xs font-medium text-gray-600">
                                            Input Type
                                        </label>
                                        <select
                                            value={field.input_type || "text"}
                                            onChange={(event) =>
                                                updateField(index, {
                                                    input_type: event.target.value,
                                                })
                                            }
                                            className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-orange-500"
                                        >
                                            {HEADER_INPUT_TYPES.map((type) => (
                                                <option key={type.value} value={type.value}>
                                                    {type.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {["TEMPLATE_FIXED", "MAKER_INPUT"].includes(
                                        field.source
                                    ) && (
                                            <div className="lg:col-span-2">
                                                <label className="mb-1 block text-xs font-medium text-gray-600">
                                                    {field.source === "TEMPLATE_FIXED"
                                                        ? "Template Value"
                                                        : "Default Value (Optional)"}
                                                </label>
                                                <input
                                                    type={
                                                        field.input_type === "date"
                                                            ? "date"
                                                            : "text"
                                                    }
                                                    value={field.default_value || ""}
                                                    onChange={(event) =>
                                                        updateField(index, {
                                                            default_value:
                                                                event.target.value,
                                                        })
                                                    }
                                                    placeholder={
                                                        field.source === "TEMPLATE_FIXED"
                                                            ? "Enter fixed value"
                                                            : "Leave blank for Maker to enter"
                                                    }
                                                    className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-orange-500"
                                                />
                                            </div>
                                        )}

                                    {/* {systemOptions.length > 0 && (
                                        <div className="lg:col-span-2">
                                            <label className="mb-1 block text-xs font-medium text-gray-600">
                                                Resolved Value
                                            </label>
                                            <select
                                                value={field.system_key || ""}
                                                disabled={isProtected}
                                                onChange={(event) =>
                                                    updateField(index, {
                                                        system_key:
                                                            event.target.value,
                                                    })
                                                }
                                                className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-orange-500 disabled:bg-gray-100"
                                            >
                                                <option value="">Select value</option>
                                                {systemOptions.map((option) => (
                                                    <option
                                                        key={option.value}
                                                        value={option.value}
                                                    >
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )} */}


                                    {isAutoNumberField && (
                                        <div className="lg:col-span-4 rounded-xl border border-orange-100 bg-orange-50/70 p-4">
                                            <div className="mb-3">
                                                <p className="text-sm font-semibold text-gray-800">
                                                    Auto Number Configuration
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    This value will be generated automatically for every checklist created from this template.
                                                </p>
                                            </div>

                                            <div className="grid gap-4 md:grid-cols-2">
                                                <div>
                                                    <label className="mb-1 block text-xs font-medium text-gray-600">
                                                        Prefix
                                                    </label>
                                                    <input
                                                        value={reportNumberConfig?.prefix || ""}
                                                        onChange={(event) =>
                                                            setReportNumberConfig((previous) => ({
                                                                ...previous,
                                                                prefix: event.target.value,
                                                            }))
                                                        }
                                                        placeholder="Example: ADL-NEST-AC"
                                                        className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-orange-500"
                                                    />

                                                    <p className="mt-1 text-xs text-gray-400">
                                                        Generated example:{" "}
                                                        {reportNumberConfig?.prefix
                                                            ? `${String(reportNumberConfig.prefix)
                                                                .trim()
                                                                .replace(/-+$/, "")}-${String(1).padStart(
                                                                    Number(reportNumberConfig?.padding || 2),
                                                                    "0"
                                                                )}`
                                                            : "PREFIX-01"}
                                                    </p>
                                                </div>

                                                <div>
                                                    <label className="mb-1 block text-xs font-medium text-gray-600">
                                                        Number Padding
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        max="8"
                                                        value={reportNumberConfig?.padding || 2}
                                                        onChange={(event) =>
                                                            setReportNumberConfig((previous) => ({
                                                                ...previous,
                                                                padding: Math.max(
                                                                    1,
                                                                    Number(event.target.value || 2)
                                                                ),
                                                            }))
                                                        }
                                                        className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-orange-500"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {systemOptions.length > 0 &&
                                        !(
                                            isInspectionReportNumberField &&
                                            field.source === "SYSTEM_GENERATED"
                                        ) && (
                                            <div className="lg:col-span-2">
                                                <label className="mb-1 block text-xs font-medium text-gray-600">
                                                    Generated Value Type
                                                </label>

                                                <select
                                                    value={field.system_key || ""}
                                                    onChange={(event) =>
                                                        updateField(index, {
                                                            system_key: event.target.value,
                                                        })
                                                    }
                                                    className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-orange-500"
                                                >
                                                    <option value="">Select value</option>

                                                    {systemOptions.map((option) => (
                                                        <option
                                                            key={option.value}
                                                            value={option.value}
                                                        >
                                                            {option.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}



                                    <div>
                                        <label className="mb-1 block text-xs font-medium text-gray-600">
                                            Row
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={field.row_index || 1}
                                            onChange={(event) =>
                                                updateField(index, {
                                                    row_index: Math.max(
                                                        1,
                                                        Number(event.target.value || 1)
                                                    ),
                                                })
                                            }
                                            className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-orange-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-xs font-medium text-gray-600">
                                            Column
                                        </label>
                                        <select
                                            value={field.column_index || 1}
                                            onChange={(event) =>
                                                updateField(index, {
                                                    column_index: Number(
                                                        event.target.value
                                                    ),
                                                })
                                            }
                                            className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none focus:border-orange-500"
                                        >
                                            <option value={1}>Left</option>
                                            <option value={2}>Right</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="mt-4 flex flex-wrap gap-5 border-t border-gray-200 pt-4 text-sm text-gray-600">
                                    {field.source === "MAKER_INPUT" && (
                                        <>
                                            <label className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={
                                                        field.editable_by_maker === true
                                                    }
                                                    onChange={(event) =>
                                                        updateField(index, {
                                                            editable_by_maker:
                                                                event.target.checked,
                                                        })
                                                    }
                                                    className="accent-orange-500"
                                                />
                                                Editable by Maker
                                            </label>

                                            <label className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={field.required === true}
                                                    onChange={(event) =>
                                                        updateField(index, {
                                                            required:
                                                                event.target.checked,
                                                        })
                                                    }
                                                    className="accent-orange-500"
                                                />
                                                Required during inspection
                                            </label>
                                        </>
                                    )}

                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={
                                                field.visible_in_report !== false
                                            }
                                            onChange={(event) =>
                                                updateField(index, {
                                                    visible_in_report:
                                                        event.target.checked,
                                                })
                                            }
                                            className="accent-orange-500"
                                        />
                                        Show in PDF
                                    </label>

                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={
                                                field.visible_in_preview !== false
                                            }
                                            onChange={(event) =>
                                                updateField(index, {
                                                    visible_in_preview:
                                                        event.target.checked,
                                                })
                                            }
                                            className="accent-orange-500"
                                        />
                                        Show in Preview
                                    </label>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <button
                    type="button"
                    onClick={addField}
                    className="mt-5 inline-flex h-10 items-center gap-2 rounded-lg bg-orange-500 px-4 text-sm font-semibold text-white hover:bg-orange-600"
                >
                    <Plus className="h-4 w-4" />
                    Add Header Field
                </button>
            </div>

            <div className="rounded-2xl border border-orange-100 bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-sm font-semibold text-gray-900">
                    Header Preview
                </h3>

                <table className="w-full border-collapse text-sm">
                    <tbody>
                        {previewRows.map((row, rowIndex) => (
                            <tr key={rowIndex}>
                                {row.map((field) => (
                                    <td
                                        key={field.key}
                                        colSpan={row.length === 1 ? 2 : 1}
                                        className="border border-gray-200 bg-green-50/40 px-3 py-2"
                                    >
                                        <span className="font-semibold text-gray-700">
                                            {field.label}:
                                        </span>{" "}
                                        <span className="text-gray-900">
                                            {field.previewValue}
                                        </span>
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default HousekeepingHeaderFieldsConfig;