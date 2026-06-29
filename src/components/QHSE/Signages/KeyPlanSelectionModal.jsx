import { useMemo, useState } from "react";
import { ClipboardList, Search, X, CheckCircle2 } from "lucide-react";

// Mock data representing files from "References > Key Plans & All Blocks Plans"
const DUMMY_KEY_PLANS = [
    { id: 1, type: "Key Plans & All Blocks Plans", name: "Block A - Ground Floor Plan", url: "/02. A-BLock-1.png" },
    { id: 2, type: "Key Plans & All Blocks Plans", name: "Block B - Layout Overview.jpg", url: "https://via.placeholder.com/800x600.png?text=Block+B+-+Layout" },
    { id: 3, type: "Key Plans & All Blocks Plans", name: "Master Site Plan.jpg", url: "https://via.placeholder.com/800x600.png?text=Master+Site+Plan" },
];

export default function KeyPlanSelectionModal({ open, onClose, onSelect }) {
    const [searchText, setSearchText] = useState("");

    const filteredRows = useMemo(() => {
        const q = searchText.trim().toLowerCase();
        if (!q) return DUMMY_KEY_PLANS;
        return DUMMY_KEY_PLANS.filter((row) => row.name.toLowerCase().includes(q));
    }, [searchText]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl">
                <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4">
                    <div>
                        <div className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-primary">
                            <ClipboardList className="h-3.5 w-3.5" />
                            Select Key Plan
                        </div>
                        <h2 className="mt-2 text-lg font-semibold text-gray-900">
                            Key Plans & All Blocks Plans
                        </h2>
                        <p className="mt-1 text-xs text-gray-500">
                            Select a floor plan from the References folder to annotate.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="border-b border-gray-100 px-5 py-3">
                    <div className="relative max-w-md">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            placeholder="Search document name..."
                            className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                    </div>
                </div>

                <div className="max-h-[460px] overflow-auto">
                    {filteredRows.length === 0 ? (
                        <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
                            <div className="rounded-full bg-orange-50 p-3 text-primary">
                                <ClipboardList className="h-6 w-6" />
                            </div>
                            <h3 className="mt-3 text-sm font-semibold text-gray-900">
                                No documents found
                            </h3>
                        </div>
                    ) : (
                        <table className="w-full min-w-[720px] text-sm">
                            <thead className="sticky top-0 bg-gray-50 text-left">
                                <tr>
                                    <th className="w-20 px-4 py-3 font-semibold text-gray-700">Sr. No.</th>
                                    <th className="w-56 px-4 py-3 font-semibold text-gray-700">Document Type</th>
                                    <th className="px-4 py-3 font-semibold text-gray-700">Description of Submission</th>
                                    <th className="w-28 px-4 py-3 text-center font-semibold text-gray-700">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRows.map((row, index) => (
                                    <tr key={row.id} className="border-t border-gray-100 hover:bg-orange-50/40">
                                        <td className="px-4 py-3 text-center text-gray-700">{index + 1}</td>
                                        <td className="px-4 py-3 text-gray-800">{row.type}</td>
                                        <td className="px-4 py-3 text-gray-800">{row.name}</td>
                                        <td className="px-4 py-3 text-center">
                                            <button
                                                type="button"
                                                onClick={() => onSelect?.(row)}
                                                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
                                            >
                                                <CheckCircle2 className="h-3.5 w-3.5" />
                                                Select
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                <div className="flex justify-end border-t border-gray-100 bg-gray-50 px-5 py-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
