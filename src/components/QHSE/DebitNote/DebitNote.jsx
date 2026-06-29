import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { formatInputDate } from "../../../utils/dateFormatter";

const PROJECT_OPTIONS = [
    "Project Alpha",
    "Project Beta",
    "Project Gamma",
    "Project Delta",
    "Project Epsilon",
];

const inputCls =
    "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500";

const labelCls = "mb-1 block text-sm font-medium text-slate-700";

const cardCls = "rounded-xl border border-slate-200 bg-white shadow-sm";

const sectionHeaderCls =
    "rounded-t-xl border-b border-slate-200 bg-slate-50 px-5 py-3 text-base font-semibold uppercase tracking-wide text-slate-700";

const sectionBodyCls = "p-5";

const thCls =
    "border border-slate-300 bg-slate-100 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-700";

const tdCls = "border border-slate-300 px-2 py-1 align-top";

const tableInputCls =
    "w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-300 disabled:bg-slate-100";

const addBtnCls =
    "inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50";

const iconBtnCls =
    "inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-500";

const today = () => formatInputDate(new Date());

const Index = ({ onSubmitSuccess }) => {
    const [project, setProject] = useState("");
    const [refNo, setRefNo] = useState("");
    const [location, setLocation] = useState("");
    const [date, setDate] = useState(today());
    const [deptInCharge, setDeptInCharge] = useState("");
    const [noticeIssuedTo, setNoticeIssuedTo] = useState("");
    const [siteInCharge, setSiteInCharge] = useState("");
    const [areaOfNonCompliance, setAreaOfNonCompliance] = useState("");
    const [pastViolation, setPastViolation] = useState("");
    const [pastViolationNo, setPastViolationNo] = useState("");
    const [description, setDescription] = useState("");

    const [attachments, setAttachments] = useState([
        { document: "", fileName: "" },
    ]);

    const [penalties, setPenalties] = useState([
        {
            degree: "",
            type: "",
            penaltyPerViolation: "",
            count: "",
        },
    ]);

    const totalPenalty = useMemo(() => {
        return penalties.reduce((sum, p) => {
            const a = parseFloat(p.penaltyPerViolation) || 0;
            const b = parseFloat(p.count) || 0;
            return sum + a * b;
        }, 0);
    }, [penalties]);

    const formatINR = (n) => {
        return n.toLocaleString("en-IN", {
            maximumFractionDigits: 2,
        });
    };

    // Attachments
    const addAttachment = () => {
        setAttachments((rows) => [...rows, { document: "", fileName: "" }]);
    };

    const removeAttachment = (i) => {
        setAttachments((rows) => rows.filter((_, idx) => idx !== i));
    };

    const updateAttachment = (i, field, value) => {
        setAttachments((rows) =>
            rows.map((r, idx) => (idx === i ? { ...r, [field]: value } : r))
        );
    };

    // Penalties
    const addPenalty = () => {
        setPenalties((rows) => [
            ...rows,
            {
                degree: "",
                type: "",
                penaltyPerViolation: "",
                count: "",
            },
        ]);
    };

    const removePenalty = (i) => {
        setPenalties((rows) => rows.filter((_, idx) => idx !== i));
    };

    const updatePenalty = (i, field, value) => {
        setPenalties((rows) =>
            rows.map((r, idx) => (idx === i ? { ...r, [field]: value } : r))
        );
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const payload = {
            project,
            refNo,
            location,
            date,
            deptInCharge,
            noticeIssuedTo,
            siteInCharge,
            areaOfNonCompliance,
            pastViolation,
            pastViolationNo: pastViolation === "yes" ? pastViolationNo : "",
            description,
            attachments,
            penalties: penalties.map((p) => ({
                ...p,
                amount:
                    (parseFloat(p.penaltyPerViolation) || 0) *
                    (parseFloat(p.count) || 0),
            })),
            totalPenalty,
        };

        const finalPayload = {
            id: `debit-note-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            status: "Open",
            createdAt: new Date().toISOString(),
            ...payload,
        };

        console.log("Debit Note submitted:", finalPayload);
        toast.success("Debit Note submitted successfully");
        onSubmitSuccess?.(finalPayload);

    };

    const handleReset = () => {
        setProject("");
        setRefNo("");
        setLocation("");
        setDate(today());
        setDeptInCharge("");
        setNoticeIssuedTo("");
        setSiteInCharge("");
        setAreaOfNonCompliance("");
        setPastViolation("");
        setPastViolationNo("");
        setDescription("");
        setAttachments([{ document: "", fileName: "" }]);
        setPenalties([
            {
                degree: "",
                type: "",
                penaltyPerViolation: "",
                count: "",
            },
        ]);
    };

    return (
        <div className="min-h-screen bg-slate-100 px-4 py-8">
            <div className="mx-auto max-w-6xl">
                <header className="mb-6">
                    <h1 className="text-2xl font-bold text-slate-800 sm:text-3xl">
                        Debit Note
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Record HSE non-compliance and compute penalty deductions.
                    </p>
                </header>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* SECTION 1 */}
                    <section className={cardCls}>
                        <div className={sectionHeaderCls}>General Details</div>

                        <div className={sectionBodyCls}>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <label className={labelCls}>Project</label>
                                    <select
                                        className={inputCls}
                                        value={project}
                                        onChange={(e) => setProject(e.target.value)}
                                    >
                                        <option value="">Select a project</option>
                                        {PROJECT_OPTIONS.map((p) => (
                                            <option key={p} value={p}>
                                                {p}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className={labelCls}>Report / Ref. No.</label>
                                    <input
                                        type="text"
                                        className={inputCls}
                                        value={refNo}
                                        onChange={(e) => setRefNo(e.target.value)}
                                        placeholder="e.g. DN-2026-001"
                                    />
                                </div>

                                <div>
                                    <label className={labelCls}>Location</label>
                                    <input
                                        type="text"
                                        className={inputCls}
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label className={labelCls}>Date</label>
                                    <input
                                        type="date"
                                        className={inputCls}
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label className={labelCls}>
                                        Contractor&apos;s Department In-charge
                                    </label>
                                    <input
                                        type="text"
                                        className={inputCls}
                                        value={deptInCharge}
                                        onChange={(e) => setDeptInCharge(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label className={labelCls}>Penalty Notice Issued To</label>
                                    <input
                                        type="text"
                                        className={inputCls}
                                        value={noticeIssuedTo}
                                        onChange={(e) => setNoticeIssuedTo(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label className={labelCls}>
                                        Contractor&apos;s Site In-charge
                                    </label>
                                    <input
                                        type="text"
                                        className={inputCls}
                                        value={siteInCharge}
                                        onChange={(e) => setSiteInCharge(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label className={labelCls}>
                                        Area / Location of Non-compliance
                                    </label>
                                    <input
                                        type="text"
                                        className={inputCls}
                                        value={areaOfNonCompliance}
                                        onChange={(e) => setAreaOfNonCompliance(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label className={labelCls}>
                                        Past Infraction / Violation Notice
                                    </label>

                                    <div className="flex items-center gap-6 pt-2">
                                        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                                            <input
                                                type="checkbox"
                                                className="h-4 w-4 rounded border-slate-300 text-slate-700 focus:ring-slate-400"
                                                checked={pastViolation === "yes"}
                                                onChange={(e) =>
                                                    setPastViolation(e.target.checked ? "yes" : "")
                                                }
                                            />
                                            Yes
                                        </label>

                                        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                                            <input
                                                type="checkbox"
                                                className="h-4 w-4 rounded border-slate-300 text-slate-700 focus:ring-slate-400"
                                                checked={pastViolation === "no"}
                                                onChange={(e) => {
                                                    setPastViolation(e.target.checked ? "no" : "");

                                                    if (e.target.checked) {
                                                        setPastViolationNo("");
                                                    }
                                                }}
                                            />
                                            No
                                        </label>
                                    </div>
                                </div>

                                <div>
                                    <label className={labelCls}>
                                        Past Infraction / Violation Notice No.
                                    </label>
                                    <input
                                        type="text"
                                        className={inputCls}
                                        value={pastViolationNo}
                                        onChange={(e) => setPastViolationNo(e.target.value)}
                                        disabled={pastViolation !== "yes"}
                                        placeholder={
                                            pastViolation === "yes"
                                                ? "Enter notice number"
                                                : "Enable by selecting Yes"
                                        }
                                    />
                                </div>
                            </div>

                            {/* Attachments */}
                            <div className="mt-6">
                                <h3 className="mb-2 text-sm font-semibold text-slate-700">
                                    Attachments
                                </h3>

                                <div className="overflow-x-auto rounded-md border border-slate-300">
                                    <table className="w-full border-collapse text-sm">
                                        <thead>
                                            <tr>
                                                <th className={thCls + " w-16"}>Sr. No.</th>
                                                <th className={thCls}>Document</th>
                                                <th className={thCls}>Attachment</th>
                                                <th className={thCls + " w-20 text-center"}>
                                                    Action
                                                </th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {attachments.map((row, i) => (
                                                <tr key={i}>
                                                    <td className={tdCls + " text-center text-slate-600"}>
                                                        {i + 1}
                                                    </td>

                                                    <td className={tdCls}>
                                                        <input
                                                            type="text"
                                                            className={tableInputCls}
                                                            value={row.document}
                                                            onChange={(e) =>
                                                                updateAttachment(i, "document", e.target.value)
                                                            }
                                                            placeholder="Document name"
                                                        />
                                                    </td>

                                                    <td className={tdCls}>
                                                        <input
                                                            type="file"
                                                            className="block w-full text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-slate-200 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-300"
                                                            onChange={(e) =>
                                                                updateAttachment(
                                                                    i,
                                                                    "fileName",
                                                                    e.target.files?.[0]?.name ?? ""
                                                                )
                                                            }
                                                        />
                                                    </td>

                                                    <td className={tdCls + " text-center"}>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeAttachment(i)}
                                                            disabled={attachments.length === 1}
                                                            className={iconBtnCls}
                                                            aria-label="Delete row"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="mt-2 flex justify-start">
                                    <button
                                        type="button"
                                        onClick={addAttachment}
                                        className={addBtnCls}
                                    >
                                        <Plus className="h-4 w-4" />
                                        Add Row
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* SECTION 2 */}
                    <section className={cardCls}>
                        <div className={sectionHeaderCls}>
                            Description of Non-compliance
                        </div>

                        <div className={sectionBodyCls}>
                            <textarea
                                className={inputCls + " min-h-[160px] resize-y"}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Describe the non-compliance in detail..."
                            />
                        </div>
                    </section>

                    {/* SECTION 3 */}
                    <section className={cardCls}>
                        <div className={sectionHeaderCls}>Penalty Details</div>

                        <div className={sectionBodyCls}>
                            <div className="overflow-x-auto rounded-md border border-slate-300">
                                <table className="w-full min-w-[760px] border-collapse text-sm">
                                    <thead>
                                        <tr>
                                            <th className={thCls + " w-14"}>Sr.</th>
                                            <th className={thCls}>Degree of Violation</th>
                                            <th className={thCls}>Type of Violation</th>
                                            <th className={thCls}>Penalty / Violation (INR)</th>
                                            <th className={thCls}>No. of Violations</th>
                                            <th className={thCls}>Penalty Amount (INR)</th>
                                            <th className={thCls + " w-20 text-center"}>
                                                Action
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {penalties.map((row, i) => {
                                            const amount =
                                                (parseFloat(row.penaltyPerViolation) || 0) *
                                                (parseFloat(row.count) || 0);

                                            return (
                                                <tr key={i}>
                                                    <td className={tdCls + " text-center text-slate-600"}>
                                                        {i + 1}
                                                    </td>

                                                    <td className={tdCls}>
                                                        <input
                                                            type="text"
                                                            className={tableInputCls}
                                                            value={row.degree}
                                                            onChange={(e) =>
                                                                updatePenalty(i, "degree", e.target.value)
                                                            }
                                                        />
                                                    </td>

                                                    <td className={tdCls}>
                                                        <input
                                                            type="text"
                                                            className={tableInputCls}
                                                            value={row.type}
                                                            onChange={(e) =>
                                                                updatePenalty(i, "type", e.target.value)
                                                            }
                                                        />
                                                    </td>

                                                    <td className={tdCls}>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            className={tableInputCls}
                                                            value={row.penaltyPerViolation}
                                                            onChange={(e) =>
                                                                updatePenalty(
                                                                    i,
                                                                    "penaltyPerViolation",
                                                                    e.target.value
                                                                )
                                                            }
                                                        />
                                                    </td>

                                                    <td className={tdCls}>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            className={tableInputCls}
                                                            value={row.count}
                                                            onChange={(e) =>
                                                                updatePenalty(i, "count", e.target.value)
                                                            }
                                                        />
                                                    </td>

                                                    <td className={tdCls}>
                                                        <input
                                                            type="text"
                                                            readOnly
                                                            className={
                                                                tableInputCls + " bg-slate-50 font-medium"
                                                            }
                                                            value={formatINR(amount)}
                                                        />
                                                    </td>

                                                    <td className={tdCls + " text-center"}>
                                                        <button
                                                            type="button"
                                                            onClick={() => removePenalty(i)}
                                                            disabled={penalties.length === 1}
                                                            className={iconBtnCls}
                                                            aria-label="Delete row"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            <div className="mt-3 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                                <button
                                    type="button"
                                    onClick={addPenalty}
                                    className={addBtnCls}
                                >
                                    <Plus className="h-4 w-4" />
                                    Add Row
                                </button>

                                <div className="flex items-center gap-3 rounded-md border border-slate-300 bg-slate-50 px-4 py-2">
                                    <span className="text-sm font-semibold text-slate-700">
                                        Total Penalty (INR)
                                    </span>

                                    <span className="min-w-[120px] rounded-md border border-slate-300 bg-white px-3 py-1 text-right text-sm font-semibold text-slate-900">
                                        {formatINR(totalPenalty)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* SECTION 4 */}
                    <section className={cardCls}>
                        <div className={sectionHeaderCls}>Billing Instruction</div>

                        <div className={sectionBodyCls}>
                            <div className="rounded-md border border-slate-300 bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">
                                <span className="font-semibold text-slate-800">
                                    Billing Instruction:
                                </span>{" "}
                                Billing Department is requested to recover INR{" "}
                                <span className="mx-1 inline-block min-w-[80px] border-b border-slate-500 px-2 text-center font-semibold text-slate-900">
                                    {formatINR(totalPenalty)}
                                </span>{" "}
                                from the contractor&apos;s next running / RA bill against the
                                above HSE non-compliance, in accordance with the applicable
                                tender / contract conditions.
                            </div>
                        </div>
                    </section>

                    <div className="flex justify-end gap-3 pb-4">
                        <button
                            type="reset"
                            className="rounded-md border border-slate-300 bg-white px-5 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                            onClick={handleReset}
                        >
                            Reset
                        </button>

                        <button
                            type="submit"
                            className="rounded-md bg-slate-800 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400"
                        >
                            Submit Debit Note
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Index;
