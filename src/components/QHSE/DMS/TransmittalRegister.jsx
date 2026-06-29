import { useMemo, useState, useRef, useEffect } from "react";
import { Search, Filter } from "lucide-react";

import { transmittalRows } from "../../../utils/transmittal_data";

const FormHeader = () => (
    <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-4 py-4 sm:px-6">
            <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-blue-700">
                    QHSE Register
                </p>
                <p className="text-base font-semibold text-slate-800">
                    Transmittal Register
                </p>
            </div>
            <p className="hidden text-xs text-slate-500 sm:block">
                Document Transmittals
            </p>
        </div>
    </header>
);

const thClass =
    "border border-slate-200 bg-slate-100 px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 whitespace-nowrap";

const tdClass =
    "border border-slate-200 px-3 py-2 text-sm text-slate-700 align-top";

const statusColor = (status) => {
    const value = String(status || "").trim().toLowerCase();

    switch (value) {
        case "approved":
            return "bg-green-100 text-green-700";
        case "reject":
        case "rejected":
            return "bg-red-100 text-red-700";
        case "e":
            return "bg-slate-200 text-slate-700";
        default:
            return "bg-slate-100 text-slate-600";
    }
};

const TransmittalRegister = () => {
    const [query, setQuery] = useState("");
    const [selectedType, setSelectedType] = useState("");

    const [filterOpen, setFilterOpen] = useState(false);
    const [pendingTypes, setPendingTypes] = useState(new Set()); // empty = all selected
    const [activeTypes, setActiveTypes] = useState(new Set());   // empty = all selected
    const [typeSearch, setTypeSearch] = useState("");
    const filterRef = useRef(null);

    useEffect(() => {
        if (!filterOpen) return;
        const handler = (e) => {
            if (filterRef.current && !filterRef.current.contains(e.target)) {
                setFilterOpen(false);
            }
        };
        document.addEventListener("pointerdown", handler, true);
        return () => document.removeEventListener("pointerdown", handler, true);
    }, [filterOpen]);

    const documentTypes = useMemo(() => {
        return Array.from(
            new Set(
                transmittalRows
                    .map((row) => row.type)
                    .filter((type) => String(type || "").trim())
            )
        ).sort((a, b) => a.localeCompare(b));
    }, []);
    const filtered = useMemo(() => {
        const searchText = query.trim().toLowerCase();

        return transmittalRows.filter((row) => {
            const matchesType = activeTypes.size === 0 || activeTypes.has(row.type);

            const matchesSearch =
                !searchText ||
                [
                    row.transmittal,
                    row.type,
                    row.docNumber,
                    row.description,
                    row.submittedFor,
                    row.status,
                    row.remark,
                ]
                    .join(" ")
                    .toLowerCase()
                    .includes(searchText);

            return matchesType && matchesSearch;
        });
    }, [query, activeTypes]);

    const clearFilters = () => {
        setQuery("");
        setSelectedType("");
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <FormHeader />

            <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 sm:py-10">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl">
                            Transmittal Register
                        </h1>
                        <p className="mt-1.5 text-sm text-slate-500">
                            Read-only log of document transmittals. {filtered.length} of{" "}
                            {transmittalRows.length} records.
                        </p>
                        {(query || selectedType) && (
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="mt-2 text-xs font-medium text-blue-600 hover:underline"
                            >
                                Clear filters
                            </button>
                        )}
                    </div>

                    <div className="relative w-full sm:w-72">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Search transmittals..."
                            className="w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                    <table className="w-full min-w-[1300px] border-collapse">
                        <thead>
                            <tr>
                                <th className={thClass + " w-14 text-center"}>Sr. No</th>
                                <th className={thClass}>Transmittal Number</th>

                                <th className={thClass} style={{ position: "relative" }} ref={filterRef}>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setPendingTypes(new Set(activeTypes));
                                            setTypeSearch("");
                                            setFilterOpen((o) => !o);
                                        }}
                                        className={`inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide
      ${activeTypes.size > 0 ? "text-blue-600" : "text-slate-600"}`}
                                    >
                                        Type of Document
                                        <Filter className="w-3 h-3" />
                                        {activeTypes.size > 0 && (
                                            <span className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] text-white">
                                                {activeTypes.size}
                                            </span>
                                        )}
                                    </button>

                                    {filterOpen && (
                                        <div className="absolute left-0 top-full z-30 mt-0.5 w-56 rounded-xl border border-slate-200 bg-white shadow-lg">
                                            {/* Search */}
                                            <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2">
                                                <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                                                <input
                                                    autoFocus
                                                    value={typeSearch}
                                                    onChange={(e) => setTypeSearch(e.target.value)}
                                                    placeholder="Search types…"
                                                    className="w-full bg-transparent text-xs text-slate-800 outline-none placeholder:text-slate-400"
                                                />
                                            </div>

                                            {/* List */}
                                            <div className="max-h-48 overflow-y-auto py-1">
                                                {/* Select all */}
                                                {(() => {
                                                    const visible = documentTypes.filter((t) =>
                                                        t.toLowerCase().includes(typeSearch.toLowerCase())
                                                    );
                                                    const allOn = visible.every((t) => pendingTypes.has(t));
                                                    return (
                                                        <>
                                                            <label className="flex cursor-pointer items-center gap-2 border-b border-slate-100 px-3 py-1.5 text-[11px] font-medium text-slate-500 hover:bg-slate-50">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={allOn}
                                                                    onChange={() => {
                                                                        const next = new Set(pendingTypes);
                                                                        allOn ? visible.forEach((t) => next.delete(t)) : visible.forEach((t) => next.add(t));
                                                                        setPendingTypes(next);
                                                                    }}
                                                                    className="accent-blue-600"
                                                                />
                                                                Select all
                                                            </label>
                                                            {visible.map((type) => (
                                                                <label key={type} className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={pendingTypes.has(type)}
                                                                        onChange={() => {
                                                                            const next = new Set(pendingTypes);
                                                                            next.has(type) ? next.delete(type) : next.add(type);
                                                                            setPendingTypes(next);
                                                                        }}
                                                                        className="accent-blue-600"
                                                                    />
                                                                    {type}
                                                                </label>
                                                            ))}
                                                        </>
                                                    );
                                                })()}
                                            </div>

                                            {/* Footer */}
                                            <div className="flex gap-2 border-t border-slate-100 p-2">
                                                <button
                                                    type="button"
                                                    onClick={() => { setActiveTypes(new Set()); setPendingTypes(new Set()); setFilterOpen(false); }}
                                                    className="flex-1 rounded-md border border-slate-200 py-1.5 text-[11px] font-medium text-slate-600 hover:bg-slate-50"
                                                >
                                                    Clear
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => { setActiveTypes(new Set(pendingTypes)); setFilterOpen(false); }}
                                                    className="flex-1 rounded-md bg-blue-600 py-1.5 text-[11px] font-medium text-white hover:bg-blue-700"
                                                >
                                                    Apply
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </th>

                                <th className={thClass}>Document Number</th>
                                <th className={thClass + " min-w-[260px]"}>Description</th>
                                <th className={thClass + " text-center"}>Total No. of Doc.</th>
                                <th className={thClass}>Submission Date</th>
                                <th className={thClass}>Acknowledgement Date</th>
                                <th className={thClass}>Submitted For</th>
                                <th className={thClass}>Feedback Date</th>
                                <th className={thClass + " text-center"}>Status</th>
                                <th className={thClass + " min-w-[140px]"}>Remark</th>
                            </tr>
                        </thead>

                        <tbody>
                            {filtered.map((row, index) => (
                                <tr
                                    key={`${row.sr}-${index}`}
                                    className="even:bg-slate-50/60 hover:bg-blue-50/40"
                                >
                                    <td
                                        className={
                                            tdClass + " text-center font-medium text-slate-600"
                                        }
                                    >
                                        {row.sr}
                                    </td>

                                    <td
                                        className={
                                            tdClass + " whitespace-nowrap font-medium text-slate-800"
                                        }
                                    >
                                        {row.transmittal}
                                    </td>

                                    <td className={tdClass}>{row.type}</td>

                                    <td className={tdClass + " whitespace-nowrap"}>
                                        {row.docNumber}
                                    </td>

                                    <td className={tdClass}>{row.description}</td>

                                    <td className={tdClass + " text-center"}>
                                        {row.totalDocs}
                                    </td>

                                    <td className={tdClass + " whitespace-nowrap"}>
                                        {row.submissionDate}
                                    </td>

                                    <td className={tdClass + " whitespace-nowrap"}>
                                        {row.ackDate}
                                    </td>

                                    <td className={tdClass + " whitespace-nowrap"}>
                                        {row.submittedFor}
                                    </td>

                                    <td className={tdClass + " whitespace-nowrap"}>
                                        {row.feedbackDate}
                                    </td>

                                    <td className={tdClass + " text-center"}>
                                        {row.status ? (
                                            <span
                                                className={
                                                    "inline-flex h-6 min-w-[24px] items-center justify-center rounded px-2 text-xs font-semibold " +
                                                    statusColor(row.status)
                                                }
                                            >
                                                {row.status}
                                            </span>
                                        ) : (
                                            "—"
                                        )}
                                    </td>

                                    <td className={tdClass}>{row.remark || "—"}</td>
                                </tr>
                            ))}

                            {filtered.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={12}
                                        className="px-4 py-10 text-center text-sm text-slate-500"
                                    >
                                        No records match your search.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    );
};

export default TransmittalRegister;