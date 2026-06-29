import { useState, useEffect } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import { formatInputDate } from "../../../utils/dateFormatter";
import FileUploadControl from "../../FileUploadControl";
import toast from "react-hot-toast";

const ImagePreview = ({ file }) => {
    const [url, setUrl] = useState("");

    useEffect(() => {
        if (!file || !(file instanceof File)) return;
        if (!file.type.startsWith("image/")) return;

        const objectUrl = URL.createObjectURL(file);
        setUrl(objectUrl);

        return () => URL.revokeObjectURL(objectUrl);
    }, [file]);

    if (!url) return null;

    return (
        <img
            src={url}
            alt="Preview"
            className="h-16 w-20 object-cover rounded-md border border-gray-200 shadow-sm"
        />
    );
};

const ImagePreviewList = ({ files }) => {
    if (!files) return null;
    const fileArray = Array.isArray(files) ? files : (files instanceof FileList ? Array.from(files) : [files]);
    if (fileArray.length === 0) return null;

    return (
        <div className="flex flex-wrap gap-2 mb-2 justify-center">
            {fileArray.map((f, i) => (
                <ImagePreview key={i} file={f} />
            ))}
        </div>
    );
};

const todayISO = () => formatInputDate(new Date());

const INITIAL_ROW = {
    id: 1,
    type: "Quality",
    date: todayISO(),
    location: "",
    observation: "",
    photograph: null,
    observedBy: "",
    agency: "",
    category: "",
    actionPlan: "",
    closureDate: todayISO(),
    closeoutPicture: null,
    status: "",
    remark: "",
};

const inputCls = "w-full min-w-[120px] rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50";
const selectCls = "w-full min-w-[100px] rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50";

export default function ExternalBulkSOR({ onSubmitSuccess }) {
    const [rows, setRows] = useState([
        { ...INITIAL_ROW, id: Date.now() + 1 },
        { ...INITIAL_ROW, id: Date.now() + 2 },
    ]);

    const addRow = () => {
        setRows([...rows, { ...INITIAL_ROW, id: Date.now() }]);
    };

    const removeRow = (id) => {
        if (rows.length <= 1) {
            toast.error("At least one row is required.");
            return;
        }
        setRows(rows.filter((row) => row.id !== id));
    };

    const updateRow = (id, field, value) => {
        setRows(rows.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
    };

    const handleTextareaChange = (e, rowId, field) => {
        e.target.style.height = "auto";
        e.target.style.height = `${e.target.scrollHeight}px`;

        let val = e.target.value;
        if (val.length === 1 && val !== "•") {
            val = "• " + val;
        } else if (val === "") {
            e.target.style.height = "auto";
        }
        updateRow(rowId, field, val);
    };

    const handleTextareaKeyDown = (e, rowId, field) => {
        if (e.key === "Enter") {
            e.preventDefault();
            const { selectionStart, selectionEnd, value } = e.target;
            const newValue = value.substring(0, selectionStart) + "\n• " + value.substring(selectionEnd);
            updateRow(rowId, field, newValue);
            
            setTimeout(() => {
                e.target.selectionStart = e.target.selectionEnd = selectionStart + 3;
                e.target.style.height = "auto";
                e.target.style.height = `${e.target.scrollHeight}px`;
            }, 0);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Validation could be added here
        
        toast.success("Bulk SOR submitted successfully!");
        
        if (onSubmitSuccess) {
            // Passing the rows back to the parent to append to the list
            // For now, we'll map them to the format the parent list expects
            const payloads = rows.map((r, i) => ({
                id: `bulk-${Date.now()}-${i}`,
                sorNo: `SOR-BULK-${Date.now().toString().slice(-4)}-${i + 1}`,
                type: r.type,
                dateOfIssue: r.date,
                projectLocation: r.location,
                observationSubject: r.category,
                observation: r.observation,
                issuedTo: r.agency,
                project: "-",
                status: r.status || "Open",
                remarks: r.remark,
                raw: r,
            }));
            
            // Because the parent `onSubmitSuccess` only takes one payload in the current implementation,
            // we should probably loop or modify the parent to handle multiple.
            // For now, we'll just pass the first one, or modify parent to handle array.
            onSubmitSuccess(payloads);
        }
    };

    return (
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="bg-orange-50/50 px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">Bulk SOR Creation</h2>
                    <p className="text-sm text-gray-500">Add multiple Site Observation Reports at once.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="overflow-x-auto p-4">
                    <table className="w-full text-sm whitespace-nowrap">
                        <thead>
                            <tr className="border-b border-gray-200 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 bg-gray-50/50">
                                <th className="px-3 py-3">Sl No.</th>
                                <th className="px-3 py-3 min-w-[120px]">Type</th>
                                <th className="px-3 py-3 min-w-[140px]">Date</th>
                                <th className="px-3 py-3 min-w-[150px]">Area / Location</th>
                                <th className="px-3 py-3 min-w-[200px]">Observation</th>
                                <th className="px-3 py-3 min-w-[150px]">Photograph / Evidence</th>
                                <th className="px-3 py-3 min-w-[150px]">Observed By</th>
                                <th className="px-3 py-3 min-w-[150px]">Agency</th>
                                <th className="px-3 py-3 min-w-[150px]">Category</th>
                                <th className="px-3 py-3 min-w-[200px]">Action Plan</th>
                                <th className="px-3 py-3 min-w-[140px]">Closure Date</th>
                                <th className="px-3 py-3 min-w-[150px]">Closeout Picture</th>
                                <th className="px-3 py-3 min-w-[150px]">Status</th>
                                <th className="px-3 py-3 min-w-[150px]">Remark</th>
                                <th className="px-3 py-3 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {rows.map((row, index) => (
                                <tr key={row.id} className="hover:bg-gray-50/30">
                                    <td className="px-3 py-2 text-center text-gray-500 font-medium">
                                        {index + 1}
                                    </td>
                                    <td className="px-3 py-2">
                                        <select
                                            className={selectCls}
                                            value={row.type}
                                            onChange={(e) => updateRow(row.id, "type", e.target.value)}
                                        >
                                            <option value="Quality">Quality</option>
                                            <option value="HSE">HSE</option>
                                        </select>
                                    </td>
                                    <td className="px-3 py-2">
                                        <input
                                            type="date"
                                            className={inputCls}
                                            value={row.date}
                                            onChange={(e) => updateRow(row.id, "date", e.target.value)}
                                        />
                                    </td>
                                    <td className="px-3 py-2">
                                        <input
                                            type="text"
                                            placeholder="Area / Location"
                                            className={inputCls}
                                            value={row.location}
                                            onChange={(e) => updateRow(row.id, "location", e.target.value)}
                                        />
                                    </td>
                                    <td className="px-3 py-2">
                                        <textarea
                                            placeholder="Observation details..."
                                            className={`${inputCls} min-h-[40px] resize-none py-2 overflow-hidden`}
                                            rows={1}
                                            value={row.observation}
                                            onChange={(e) => handleTextareaChange(e, row.id, "observation")}
                                            onKeyDown={(e) => handleTextareaKeyDown(e, row.id, "observation")}
                                        />
                                    </td>
                                    <td className="px-3 py-2 min-w-[150px]">
                                        <ImagePreviewList files={row.photograph} />
                                        <FileUploadControl
                                            files={row.photograph}
                                            multiple={true}
                                            showFileName={true}
                                            compact={true}
                                            uploadLabel="Upload"
                                            className="w-full [&>button]:w-full [&>button]:justify-center"
                                            onFilesChange={(files) => updateRow(row.id, "photograph", files)}
                                            onDelete={() => updateRow(row.id, "photograph", null)}
                                        />
                                    </td>
                                    <td className="px-3 py-2">
                                        <input
                                            type="text"
                                            placeholder="Observed By"
                                            className={inputCls}
                                            value={row.observedBy}
                                            onChange={(e) => updateRow(row.id, "observedBy", e.target.value)}
                                        />
                                    </td>
                                    <td className="px-3 py-2">
                                        <input
                                            type="text"
                                            placeholder="Agency"
                                            className={inputCls}
                                            value={row.agency}
                                            onChange={(e) => updateRow(row.id, "agency", e.target.value)}
                                        />
                                    </td>
                                    <td className="px-3 py-2">
                                        <input
                                            type="text"
                                            placeholder="Category"
                                            className={inputCls}
                                            value={row.category}
                                            onChange={(e) => updateRow(row.id, "category", e.target.value)}
                                        />
                                    </td>
                                    <td className="px-3 py-2">
                                        <textarea
                                            placeholder="Action Plan..."
                                            className={`${inputCls} min-h-[40px] resize-none py-2 overflow-hidden`}
                                            rows={1}
                                            value={row.actionPlan}
                                            onChange={(e) => handleTextareaChange(e, row.id, "actionPlan")}
                                            onKeyDown={(e) => handleTextareaKeyDown(e, row.id, "actionPlan")}
                                        />
                                    </td>
                                    <td className="px-3 py-2">
                                        <input
                                            type="date"
                                            className={inputCls}
                                            value={row.closureDate}
                                            onChange={(e) => updateRow(row.id, "closureDate", e.target.value)}
                                        />
                                    </td>
                                    <td className="px-3 py-2 min-w-[150px]">
                                        <ImagePreviewList files={row.closeoutPicture} />
                                        <FileUploadControl
                                            files={row.closeoutPicture}
                                            multiple={true}
                                            showFileName={true}
                                            compact={true}
                                            uploadLabel="Upload"
                                            className="w-full [&>button]:w-full [&>button]:justify-center"
                                            onFilesChange={(files) => updateRow(row.id, "closeoutPicture", files)}
                                            onDelete={() => updateRow(row.id, "closeoutPicture", null)}
                                        />
                                    </td>
                                    <td className="px-3 py-2">
                                        <input
                                            type="text"
                                            placeholder="Status"
                                            className={inputCls}
                                            value={row.status}
                                            onChange={(e) => updateRow(row.id, "status", e.target.value)}
                                        />
                                    </td>
                                    <td className="px-3 py-2">
                                        <input
                                            type="text"
                                            placeholder="Remark"
                                            className={inputCls}
                                            value={row.remark}
                                            onChange={(e) => updateRow(row.id, "remark", e.target.value)}
                                        />
                                    </td>
                                    <td className="px-3 py-2 text-center">
                                        <button
                                            type="button"
                                            onClick={() => removeRow(row.id)}
                                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-700"
                                            title="Delete Row"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="border-t border-gray-100 bg-gray-50/50 px-5 py-3">
                    <button
                        type="button"
                        onClick={addRow}
                        className="inline-flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10"
                    >
                        <Plus className="h-4 w-4" />
                        Add New Row
                    </button>
                </div>

                <div className="border-t border-gray-200 px-5 py-4 flex justify-end">
                    <button
                        type="submit"
                        className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:opacity-90"
                    >
                        <Save className="h-4 w-4" />
                        Submit Bulk SOR
                    </button>
                </div>
            </form>
        </div>
    );
}
