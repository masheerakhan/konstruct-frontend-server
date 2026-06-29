import { useState } from "react";
import toast from "react-hot-toast";
import { formatInputDate } from "../../../utils/dateFormatter";

const TYPE_OPTIONS = ["HSE", "Quality", "Others"];

const inputCls =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500";

const labelCls = "mb-1 block text-sm font-medium text-slate-700";

const cardCls = "rounded-xl border border-slate-200 bg-white shadow-sm";

const sectionHeaderCls =
  "rounded-t-xl border-b border-slate-200 bg-slate-50 px-5 py-3 text-base font-semibold uppercase tracking-wide text-slate-700";

const sectionBodyCls = "p-5";

const today = () => formatInputDate(new Date());

export default function StopWorkNotice({ onSubmitSuccess }) {
  const [issuedToCompanyName, setIssuedToCompanyName] = useState("");
  const [sitePlantWorkshopOffice, setSitePlantWorkshopOffice] = useState("");
  const [date, setDate] = useState(today());
  const [floorLocationOtherRef, setFloorLocationOtherRef] = useState("");
  const [stopWorkNotificationNo, setStopWorkNotificationNo] = useState("");
  const [type, setType] = useState("HSE");

  const [concernEngineerSupervisor, setConcernEngineerSupervisor] =
    useState("");
  const [department, setDepartment] = useState("");
  const [description, setDescription] = useState("");

  const handleReset = () => {
    setIssuedToCompanyName("");
    setSitePlantWorkshopOffice("");
    setDate(today());
    setFloorLocationOtherRef("");
    setStopWorkNotificationNo("");
    setType("HSE");
    setConcernEngineerSupervisor("");
    setDepartment("");
    setDescription("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const payload = {
      issuedToCompanyName,
      sitePlantWorkshopOffice,
      date,
      floorLocationOtherRef,
      stopWorkNotificationNo,
      type,
      concernEngineerSupervisor,
      department,
      description,
    };

    const finalPayload = {
      id: `stop-work-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      status: "Open",
      dateOfClosure: "",
      remarks: "",
      issuedBy: "",
      createdAt: new Date().toISOString(),
      ...payload,
    };

    console.log("Stop Work Notice submitted:", finalPayload);
    toast.success("Stop Work Notice submitted successfully");
    onSubmitSuccess?.(finalPayload);
  };

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800 sm:text-3xl">
            Stop Work Notice
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Record stop work notification details with HSE, Quality, or Other
            type.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          <section className={cardCls}>
            <div className={sectionHeaderCls}>Notice Details</div>

            <div className={sectionBodyCls}>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className={labelCls}>Issued to / Company Name</label>
                  <input
                    type="text"
                    className={inputCls}
                    value={issuedToCompanyName}
                    onChange={(e) => setIssuedToCompanyName(e.target.value)}
                    placeholder="Enter company / contractor name"
                  />
                </div>

                <div>
                  <label className={labelCls}>
                    Site / Plant / Workshop / Office
                  </label>
                  <input
                    type="text"
                    className={inputCls}
                    value={sitePlantWorkshopOffice}
                    onChange={(e) => setSitePlantWorkshopOffice(e.target.value)}
                    placeholder="Enter site / plant / workshop / office"
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
                    Floor / Location / Other Ref.
                  </label>
                  <input
                    type="text"
                    className={inputCls}
                    value={floorLocationOtherRef}
                    onChange={(e) => setFloorLocationOtherRef(e.target.value)}
                    placeholder="Enter floor, location, or reference"
                  />
                </div>

                <div>
                  <label className={labelCls}>Stop Work Notification No.</label>
                  <input
                    type="text"
                    className={inputCls}
                    value={stopWorkNotificationNo}
                    onChange={(e) => setStopWorkNotificationNo(e.target.value)}
                    placeholder="e.g. SWN-2026-001"
                  />
                </div>

                <div>
                  <label className={labelCls}>Type</label>
                  <select
                    className={inputCls}
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                  >
                    {TYPE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </section>

          <section className={cardCls}>
            <div className={sectionHeaderCls}>Concern Details</div>

            <div className={sectionBodyCls}>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className={labelCls}>
                    Name of Concern Engineer / Supervisor
                  </label>
                  <input
                    type="text"
                    className={inputCls}
                    value={concernEngineerSupervisor}
                    onChange={(e) =>
                      setConcernEngineerSupervisor(e.target.value)
                    }
                    placeholder="Enter engineer / supervisor name"
                  />
                </div>

                <div>
                  <label className={labelCls}>Department</label>
                  <input
                    type="text"
                    className={inputCls}
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="Enter department"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className={labelCls}>Description</label>
                  <textarea
                    className={`${inputCls} min-h-[180px] resize-y`}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the observation / concern / reason for stop work notice..."
                  />
                </div>
              </div>
            </div>
          </section>

          <div className="flex justify-end gap-3 pb-4">
            <button
              type="button"
              className="rounded-md border border-slate-300 bg-white px-5 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
              onClick={handleReset}
            >
              Reset
            </button>

            <button
              type="submit"
              className="rounded-md bg-slate-800 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400"
            >
              Submit Stop Work Notice
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
