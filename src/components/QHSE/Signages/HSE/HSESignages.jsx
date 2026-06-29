import { Fragment, useState } from "react";
import { AlertCircle, Eye, Plus, Search } from "lucide-react";
import HSEForm from "./HSEForm";

export default function HSESignages({
    rows = [],
    loading = false,
    onView,
    onFormOpenChange,
}) {
    const [query, setQuery] = useState("");
    const [showCreateForm, setShowCreateForm] = useState(false);

    // Placeholder data to show the layout, since no API connection yet
    const filteredRows = rows.length > 0 ? rows : [];

    if (showCreateForm) {
        return (
            <HSEForm
                onCancel={() => {
                    setShowCreateForm(false);
                    onFormOpenChange?.(false);
                }}
                onSuccess={(data) => {
                    // Update the local mocked rows for visual testing
                    if (!rows.includes(data)) {
                        rows.unshift(data);
                    }
                    setShowCreateForm(false);
                    onFormOpenChange?.(false);
                }}
            />
        );
    }

    return (
        <div className="space-y-5">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <div className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary ring-1 ring-orange-100">
                            <AlertCircle className="h-3.5 w-3.5" />
                            HSE Signages Register
                        </div>

                        <h2 className="mt-3 text-xl font-semibold text-gray-900">
                            HSE Signages Register
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                            Track and manage HSE Signages across the project.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => {
                            setShowCreateForm(true);
                            onFormOpenChange?.(true);
                        }}
                        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                    >
                        <Plus className="h-4 w-4" />
                        Create Signage
                    </button>
                </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
                    <div className="relative min-w-[280px] flex-1">
                        <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search HSE Signages..."
                            className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[800px]">
                        <thead>
                            <tr className="bg-gray-50/80 text-left border-b border-gray-100">
                                <th className="px-4 py-3 font-semibold text-gray-600">Sr.</th>
                                <th className="px-4 py-3 font-semibold text-gray-600">KEY PLAN</th>
                                <th className="px-4 py-3 font-semibold text-gray-600">Created By</th>
                                <th className="px-4 py-3 font-semibold text-gray-600">Uploaded files</th>
                                <th className="px-4 py-3 font-semibold text-gray-600">Date of Submission</th>
                                <th className="px-4 py-3 font-semibold text-gray-600">Project</th>
                                <th className="px-4 py-3 font-semibold text-gray-600 text-right">Action</th>
                            </tr>
                        </thead>

                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-10 text-center text-gray-400">
                                        Loading HSE Signages...
                                    </td>
                                </tr>
                            ) : filteredRows.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-10 text-center text-gray-400">
                                        No HSE Signages records found. Click Create Signage to add a new record.
                                    </td>
                                </tr>
                            ) : (
                                filteredRows.map((row, index) => (
                                    <tr key={index} className="border-t border-gray-100 hover:bg-emerald-50/30">
                                        <td className="px-4 py-3 text-gray-500">{index + 1}</td>
                                        <td className="px-4 py-3 text-gray-700">{row.keyPlan || "-"}</td>
                                        <td className="px-4 py-3 text-gray-700">{row.createdBy || "-"}</td>
                                        <td className="px-4 py-3 text-gray-700">{row.uploadedFilesCount || "0"}</td>
                                        <td className="px-4 py-3 text-gray-700">{row.dateOfSubmission || "-"}</td>
                                        <td className="px-4 py-3 text-gray-700">{row.projectName || "-"}</td>
                                        <td className="px-4 py-3 text-right">
                                            <button
                                                type="button"
                                                onClick={() => onView?.(row)}
                                                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/5"
                                            >
                                                <Eye className="h-3.5 w-3.5" />
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
