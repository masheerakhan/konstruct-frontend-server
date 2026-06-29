import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, X } from "lucide-react";
import FileUploadControl from "../../../FileUploadControl";

const CHECKLIST_POINTS = [
  "Delivery Note / Invoice",
  "Quantity of material",
  "Size of Material",
  "Grade of material",
  "Name of Sup. as per LPO",
  "Packaging No Damage",
  "Visual check (Packaging)",
  "Test results/Reports",
  "Compliance Certificate",
  "Ref./Batch No",
  "Date of Expiry",
  "Guarantee / Warranty",
  "As per Approved MAS",
  "Complied with Consultant Comments",
  "As per Approved Actual Sample",
  "Approved Supplier?",
  "Others",
];

const inputClass =
  "w-full rounded-md border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-800 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

const thClass =
  "border border-slate-200 bg-slate-50 px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-600";

const tdClass = "border border-slate-200 align-middle p-2";

const joinClasses = (...classes) => classes.filter(Boolean).join(" ");

const Button = ({
  as: Component = "button",
  type = "button",
  variant = "default",
  size = "default",
  disabled = false,
  className = "",
  children,
  ...props
}) => {
  const variantClass =
    variant === "outline"
      ? "border border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
      : variant === "ghost"
        ? "text-slate-500 hover:text-slate-700"
        : "bg-blue-600 text-white hover:bg-blue-700";

  const sizeClass =
    size === "sm"
      ? "h-8 px-3 text-sm"
      : size === "icon"
        ? "h-8 w-8 p-0"
        : "h-10 px-6 text-sm";

  const disabledClass = disabled
    ? "pointer-events-none cursor-not-allowed opacity-50"
    : "";

  const componentProps =
    Component === "button" ? { type, disabled } : { "aria-disabled": disabled };

  return (
    <Component
      className={joinClasses(
        "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-100",
        variantClass,
        sizeClass,
        disabledClass,
        className,
      )}
      {...componentProps}
      {...props}
    >
      {children}
    </Component>
  );
};

const FormHeader = () => (
  <header className="border-b border-slate-200 bg-white">
    <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-700">
          QHSE
        </p>
        <p className="text-base font-semibold text-slate-800">
          Material Inspection Request
        </p>
      </div>
      {/* <p className="hidden text-xs text-slate-500 sm:block">
                Inspection Checklist
            </p> */}
    </div>
  </header>
);

const canUploadForResponse = (response) => {
  return response === "Yes" || response === "NA";
};

const MIRChecklist = () => {
  const navigate = useNavigate();
  const { state } = useLocation();

  const [notice, setNotice] = useState(null);
  const [items, setItems] = useState(
    CHECKLIST_POINTS.map(() => ({
      response: "",
      file: null,
      fileName: "",
    })),
  );

  const setResponse = (index, response) => {
    setItems((prev) =>
      prev.map((row, i) => {
        if (i !== index) return row;

        const uploadAllowed = canUploadForResponse(response);

        return {
          ...row,
          response,
          file: uploadAllowed ? row.file : null,
          fileName: uploadAllowed ? row.fileName : "",
        };
      }),
    );
  };

  const setFile = (index, fileName) => {
    setItems((prev) =>
      prev.map((row, i) => {
        if (i !== index) return row;

        if (!canUploadForResponse(row.response)) {
          return {
            ...row,
            fileName: "",
          };
        }

        return {
          ...row,
          fileName,
        };
      }),
    );
  };

  const setFiles = (index, nextFiles) => {
    const file = Array.isArray(nextFiles) ? nextFiles[0] : nextFiles;

    setItems((prev) =>
      prev.map((row, i) => {
        if (i !== index) return row;

        if (!canUploadForResponse(row.response)) {
          return {
            ...row,
            file: null,
            fileName: "",
          };
        }

        return {
          ...row,
          file: file || null,
          fileName: file?.name || "",
        };
      }),
    );
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    setNotice({
      type: "success",
      title: "Material Inspection Request submitted",
      message: "Inspection checklist recorded successfully.",
    });

    console.log("MIR Checklist Submitted:", {
      project: state?.project || "",
      location: state?.location || "",
      date: state?.date || "",
      trade: state?.trade || "",
      checklist: items,
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <FormHeader />

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
        <Button
          type="button"
          variant="ghost"
          onClick={() => navigate("/mir")}
          className="mb-4 h-auto px-0 py-0"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to MIR form
        </Button>

        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">
            Inspection Checklist
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            {state?.project
              ? `${state.project}${state.trade ? ` • ${state.trade}` : ""}${
                  state.date ? ` • ${state.date}` : ""
                }`
              : "Review each inspection point and record the response."}
          </p>
        </div>

        {notice && (
          <div
            role="alert"
            className={`mb-5 flex items-start justify-between gap-3 rounded-md border px-4 py-3 text-sm ${
              notice.type === "success"
                ? "border-green-200 bg-green-50 text-green-800"
                : "border-red-200 bg-red-50 text-red-800"
            }`}
          >
            <div>
              <p className="font-medium">{notice.title}</p>
              {notice.message && (
                <p className="mt-0.5 text-xs">{notice.message}</p>
              )}
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setNotice(null)}
              className="opacity-70 hover:opacity-100"
              aria-label="Close notification"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse">
                <thead>
                  <tr>
                    <th className={`${thClass} w-16`}>SI No.</th>
                    <th className={thClass}>Checklist Point</th>
                    <th className={`${thClass} w-20 text-center`}>Yes</th>
                    <th className={`${thClass} w-20 text-center`}>No</th>
                    <th className={`${thClass} w-20 text-center`}>NA</th>
                  </tr>
                </thead>

                <tbody>
                  {CHECKLIST_POINTS.map((point, index) => {
                    return (
                      <tr key={point}>
                        <td
                          className={`${tdClass} text-center text-sm text-slate-600`}
                        >
                          {index + 1}
                        </td>

                        <td className={`${tdClass} text-sm text-slate-700`}>
                          {point}
                        </td>

                        <td className={`${tdClass} text-center`}>
                          <input
                            type="checkbox"
                            checked={items[index].response === "Yes"}
                            onChange={() =>
                              setResponse(
                                index,
                                items[index].response === "Yes" ? "" : "Yes",
                              )
                            }
                            className="h-4 w-4 accent-blue-600"
                            aria-label={`${point} - Yes`}
                          />
                        </td>

                        <td className={`${tdClass} text-center`}>
                          <input
                            type="checkbox"
                            checked={items[index].response === "No"}
                            onChange={() =>
                              setResponse(
                                index,
                                items[index].response === "No" ? "" : "No",
                              )
                            }
                            className="h-4 w-4 accent-blue-600"
                            aria-label={`${point} - No`}
                          />
                        </td>

                        <td className={`${tdClass} text-center`}>
                          <input
                            type="checkbox"
                            checked={items[index].response === "NA"}
                            onChange={() =>
                              setResponse(
                                index,
                                items[index].response === "NA" ? "" : "NA",
                              )
                            }
                            className="h-4 w-4 accent-blue-600"
                            aria-label={`${point} - NA`}
                          />
                        </td>

                        {/* <td className={tdClass}>
                                                    <div className="flex min-w-[180px] flex-col gap-1">
                                                        <FileUploadControl
                                                            files={items[index].file ? [items[index].file] : []}
                                                            multiple={false}
                                                            append={false}
                                                            disabled={!uploadAllowed}
                                                            align="start"
                                                            showFileName
                                                            compact
                                                            uploadLabel="Upload"
                                                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                                                            onFilesChange={(nextFiles) => setFiles(index, nextFiles)}
                                                            onDelete={() => setFiles(index, [])}
                                                        />

                                                        {!uploadAllowed && (
                                                            <span className="text-xs text-slate-400">
                                                                Select Yes or NA to upload
                                                            </span>
                                                        )}
                                                    </div>
                                                </td> */}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <div className="flex justify-end py-8">
            <Button type="submit">Submit</Button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default MIRChecklist;