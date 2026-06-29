import React, { useEffect, useMemo } from "react";
import { Lock } from "lucide-react";

import {
    HEADER_FIELD_SOURCES,
    HEADER_INPUT_TYPES,
    SYSTEM_KEY_OPTIONS,
    buildHeaderPreviewRows,
} from "./safetyHeaderFields";

const OBSERVATION_HEADER_FIELDS = [
    {
        key: "format_no",
        label: "Format No.",
        source: "TEMPLATE_FIXED",
        input_type: "text",
        default_value: "ADL-OH&S-F012",
        system_key: "",
        required: true,
        editable_by_maker: false,
        visible_in_report: true,
        visible_in_preview: true,
        validation_config: {},
        row_index: 1,
        column_index: 1,
        order_index: 1,
    },
    {
        key: "revision_no",
        label: "Revision No.",
        source: "TEMPLATE_FIXED",
        input_type: "text",
        default_value: "R01",
        system_key: "",
        required: true,
        editable_by_maker: false,
        visible_in_report: true,
        visible_in_preview: true,
        validation_config: {},
        row_index: 1,
        column_index: 2,
        order_index: 2,
    },
    {
        key: "issued_date",
        label: "Issued Date",
        source: "TEMPLATE_FIXED",
        input_type: "date",
        default_value: "2025-09-01",
        system_key: "",
        required: true,
        editable_by_maker: false,
        visible_in_report: true,
        visible_in_preview: true,
        validation_config: {},
        row_index: 2,
        column_index: 1,
        order_index: 3,
    },
    {
        key: "revision_date",
        label: "Revision Date",
        source: "TEMPLATE_FIXED",
        input_type: "date",
        default_value: "",
        system_key: "",
        required: false,
        editable_by_maker: false,
        visible_in_report: true,
        visible_in_preview: true,
        validation_config: {},
        row_index: 2,
        column_index: 2,
        order_index: 4,
    },
    {
        key: "project",
        label: "Project",
        source: "PROJECT_CONTEXT",
        input_type: "text",
        default_value: "",
        system_key: "project_name",
        required: true,
        editable_by_maker: false,
        visible_in_report: true,
        visible_in_preview: true,
        validation_config: {},
        row_index: 3,
        column_index: 1,
        order_index: 5,
    },
    {
        key: "date_of_inspection",
        label: "Date of Observation",
        source: "SYSTEM_GENERATED",
        input_type: "date",
        default_value: "",
        system_key: "inspection_date",
        required: true,
        editable_by_maker: false,
        visible_in_report: true,
        visible_in_preview: true,
        validation_config: {},
        row_index: 3,
        column_index: 2,
        order_index: 6,
    },
    {
        key: "inspection_report_no",
        label: "Report No.",
        source: "SYSTEM_GENERATED",
        input_type: "text",
        default_value: "",
        system_key: "report_no",
        required: true,
        editable_by_maker: false,
        visible_in_report: true,
        visible_in_preview: true,
        validation_config: {},
        row_index: 4,
        column_index: 2,
        order_index: 7,
    }
];

const OBSERVATION_REPORT_NUMBER_CONFIG = {
    prefix: "AN-ADL-SHOR",
    padding: 3,
};

function ObservationHeaderFieldsConfig({
    headerFields,
    setHeaderFields,
    reportNumberConfig,
    setReportNumberConfig,
    projectName = "",
}) {
    // Force the exact static fields for observation templates so that when user clicks next, it saves this payload
    useEffect(() => {
        setHeaderFields(OBSERVATION_HEADER_FIELDS);
        setReportNumberConfig(OBSERVATION_REPORT_NUMBER_CONFIG);
    }, [setHeaderFields, setReportNumberConfig]);

    const previewRows = useMemo(
        () =>
            buildHeaderPreviewRows(OBSERVATION_HEADER_FIELDS, {
                projectName,
                reportNumberConfig: OBSERVATION_REPORT_NUMBER_CONFIG,
            }),
        [projectName]
    );

    return (
        <div className="space-y-6">
            <div className="rounded-2xl border border-orange-100 bg-white p-6 shadow-sm">
                <h2 className="mb-2 text-lg font-semibold text-gray-900">
                    Header Fields
                </h2>

                <p className="mb-6 text-sm text-gray-500">
                    These fields are fixed for the Safety & Housekeeping Observation category and cannot be modified.
                </p>

                <div className="space-y-4">
                    {OBSERVATION_HEADER_FIELDS.map((field, index) => {
                        const isProtected = ["project", "inspection_report_no", "date_of_inspection"].includes(field.key);
                        const isInspectionReportNumberField = field.key === "inspection_report_no";
                        const isAutoNumberField = field.source === "SYSTEM_GENERATED" && field.system_key === "report_no";
                        const systemOptions = SYSTEM_KEY_OPTIONS[field.source] || [];

                        return (
                            <div
                                key={`${field.key}-${index}`}
                                className="rounded-xl border border-gray-100 bg-gray-50 p-4 opacity-90"
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
                                </div>

                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 pointer-events-none">
                                    <div>
                                        <label className="mb-1 block text-xs font-medium text-gray-600">
                                            Label
                                        </label>
                                        <input
                                            value={field.label || ""}
                                            disabled
                                            className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-500 cursor-not-allowed"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-xs font-medium text-gray-600">
                                            Key
                                        </label>
                                        <input
                                            value={field.key || ""}
                                            disabled
                                            className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-500 cursor-not-allowed"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-xs font-medium text-gray-600">
                                            Source
                                        </label>
                                        <select
                                            value={field.source || "MAKER_INPUT"}
                                            disabled
                                            className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-500 cursor-not-allowed"
                                        >
                                            {HEADER_FIELD_SOURCES.map((source) => (
                                                <option key={source.value} value={source.value}>
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
                                            disabled
                                            className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-500 cursor-not-allowed"
                                        >
                                            {HEADER_INPUT_TYPES.map((type) => (
                                                <option key={type.value} value={type.value}>
                                                    {type.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {["TEMPLATE_FIXED", "MAKER_INPUT"].includes(field.source) && (
                                        <div className="lg:col-span-2">
                                            <label className="mb-1 block text-xs font-medium text-gray-600">
                                                {field.source === "TEMPLATE_FIXED" ? "Template Value" : "Default Value (Optional)"}
                                            </label>
                                            <input
                                                type={field.input_type === "date" ? "date" : "text"}
                                                value={field.default_value || ""}
                                                disabled
                                                className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-500 cursor-not-allowed"
                                            />
                                        </div>
                                    )}

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
                                                    <label className="mb-1 block text-xs font-medium text-gray-600">Prefix</label>
                                                    <input
                                                        value={OBSERVATION_REPORT_NUMBER_CONFIG.prefix}
                                                        disabled
                                                        className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-500 cursor-not-allowed"
                                                    />
                                                    <p className="mt-1 text-xs text-gray-400">
                                                        Generated example: AN-ADL-SHOR-001
                                                    </p>
                                                </div>

                                                <div>
                                                    <label className="mb-1 block text-xs font-medium text-gray-600">Number Padding</label>
                                                    <input
                                                        type="number"
                                                        value={OBSERVATION_REPORT_NUMBER_CONFIG.padding}
                                                        disabled
                                                        className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-500 cursor-not-allowed"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {systemOptions.length > 0 && !(isInspectionReportNumberField && field.source === "SYSTEM_GENERATED") && (
                                        <div className="lg:col-span-2">
                                            <label className="mb-1 block text-xs font-medium text-gray-600">Generated Value Type</label>
                                            <select
                                                value={field.system_key || ""}
                                                disabled
                                                className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-500 cursor-not-allowed"
                                            >
                                                {systemOptions.map((option) => (
                                                    <option key={option.value} value={option.value}>
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    <div>
                                        <label className="mb-1 block text-xs font-medium text-gray-600">Row</label>
                                        <input
                                            type="number"
                                            value={field.row_index || 1}
                                            disabled
                                            className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-500 cursor-not-allowed"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-xs font-medium text-gray-600">Column</label>
                                        <select
                                            value={field.column_index || 1}
                                            disabled
                                            className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-500 cursor-not-allowed"
                                        >
                                            <option value={1}>Left</option>
                                            <option value={2}>Right</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="mt-4 flex flex-wrap gap-5 border-t border-gray-200 pt-4 text-sm text-gray-600 pointer-events-none">
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={field.visible_in_report !== false}
                                            disabled
                                            className="accent-orange-500"
                                        />
                                        Show in PDF
                                    </label>

                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={field.visible_in_preview !== false}
                                            disabled
                                            className="accent-orange-500"
                                        />
                                        Show in Preview
                                    </label>
                                </div>
                            </div>
                        );
                    })}
                </div>
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

export default ObservationHeaderFieldsConfig;
