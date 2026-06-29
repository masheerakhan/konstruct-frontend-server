import { useMemo, useState } from "react";
import { Star } from "lucide-react";
import { formatInputDate } from "../../../utils/dateFormatter";

const PARAMETERS = [
  "Overall Quality of Product/Service, Accuracy & Level of Professionalism",
  "Overall Comprehension of Project Objectives",
  "Understanding of the Business Requirements",
  "Effective Supervision",
  "Timely Delivery & Milestones met",
  "Consistency",
  "Communicated effectively and openly",
  "HSE requirement",
  "Handling of Customer Complainants",
  "Innovation",
  "Continual Improvements",
  "Organizational Structure",
  "Adequate/Sufficient Resources",
  "Staffs are professional and competent",
  "Competetive Price",
  "Social Commitment",
];

const RATINGS = [
  { label: "Excellent", value: 5 },
  { label: "Very Good", value: 4 },
  { label: "Good", value: 3 },
  { label: "Adequate", value: 2 },
  { label: "Unsatisfactory", value: 1 },
];

const PROJECT_OPTIONS = [
  { value: "project-a", label: "Project A" },
  { value: "project-b", label: "Project B" },
  { value: "project-c", label: "Project C" },
  { value: "kalpataru", label: "Kalpataru" },
];

const formatDate = (date) => formatInputDate(date);

const SectionHeader = ({ title }) => (
  <div className="border-b border-border px-5 py-4">
    <h2 className="text-lg font-semibold text-foreground">{title}</h2>
  </div>
);

export default function PVE() {
  const [project, setProject] = useState("");
  const [date, setDate] = useState(formatDate(new Date()));
  const [ratings, setRatings] = useState({});
  const [conclusion, setConclusion] = useState("");
  const [overall, setOverall] = useState(0);

  const sectionClass =
    "overflow-hidden rounded-md border border-border bg-card shadow-sm";
  const inputClass =
    "w-full rounded border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30";
  const textareaClass =
    "w-full min-h-[140px] rounded border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30";
  const tableHeaderClass =
    "border border-border bg-gray-100 px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground";
  const tableCellClass = "border border-border px-3 py-3 align-middle";
  const actionButtonClass =
    "inline-flex items-center justify-center rounded border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/30";

  const answeredCount = useMemo(
    () => Object.values(ratings).filter((value) => Number(value) > 0).length,
    [ratings],
  );

  const averageScore = useMemo(() => {
    const values = Object.values(ratings)
      .map(Number)
      .filter((value) => value > 0);
    if (!values.length) return 0;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }, [ratings]);

  const setRating = (index, value) => {
    setRatings((prev) => ({
      ...prev,
      [index]: prev[index] === value ? 0 : value,
    }));
  };

  const handleReset = () => {
    setProject("");
    setDate(formatDate(new Date()));
    setRatings({});
    setConclusion("");
    setOverall(0);
  };

  return (
    <div className="min-h-screen bg-content-bg px-4 py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Periodic Vendor Evaluation Assessment Form
          </h1>
          <p className="text-sm text-muted-foreground">
            Evaluate vendor performance across key parameters.
          </p>
        </header>

        <div className={sectionClass}>
          <SectionHeader title="Project Information" />
          <div className="p-5">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label
                  htmlFor="pve-project"
                  className="mb-1 block text-sm font-medium text-foreground"
                >
                  Project
                </label>
                <select
                  id="pve-project"
                  value={project}
                  onChange={(e) => setProject(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Select a project</option>
                  {PROJECT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="pve-date"
                  className="mb-1 block text-sm font-medium text-foreground"
                >
                  Date of Assessment
                </label>
                <input
                  id="pve-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        </div>

        <div className={sectionClass}>
          <SectionHeader title="Evaluation Parameters" />
          <div className="space-y-4 p-5">
            <div className="flex flex-wrap items-center gap-4 rounded-md border border-border bg-background px-4 py-3 text-sm">
              <span className="font-medium text-foreground">
                Completed: {answeredCount} / {PARAMETERS.length}
              </span>
              <span className="text-muted-foreground">
                Average score:{" "}
                <span className="font-semibold text-foreground">
                  {averageScore ? averageScore.toFixed(2) : "0.00"}
                </span>
              </span>
            </div>

            <div className="overflow-x-auto rounded-md border border-border">
              <table className="w-full min-w-[980px] border-collapse">
                <thead>
                  <tr>
                    <th
                      rowSpan={2}
                      className="border border-border bg-gray-100 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                    >
                      Parameters
                    </th>
                    <th colSpan={5} className={tableHeaderClass}>
                      Rating
                    </th>
                  </tr>
                  <tr>
                    {RATINGS.map((rating) => (
                      <th key={rating.value} className={tableHeaderClass}>
                        <div className="font-medium text-foreground">
                          {rating.label}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {rating.value}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PARAMETERS.map((parameter, index) => (
                    <tr key={parameter}>
                      <td
                        className={`${tableCellClass} text-sm font-medium text-foreground`}
                      >
                        {parameter}
                      </td>
                      {RATINGS.map((rating) => {
                        const checked = ratings[index] === rating.value;

                        return (
                          <td
                            key={rating.value}
                            className={`${tableCellClass} text-center`}
                          >
                            <button
                              type="button"
                              onClick={() => setRating(index, rating.value)}
                              className={`mx-auto flex h-5 w-5 items-center justify-center rounded border-2 transition-colors ${
                                checked
                                  ? "border-primary bg-primary text-white"
                                  : "border-border bg-background text-transparent hover:border-primary/50"
                              }`}
                              aria-label={`${parameter} - ${rating.label}`}
                            >
                              {checked && (
                                <svg
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                  className="h-3.5 w-3.5"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M16.7 5.3a1 1 0 0 1 0 1.4l-7 7a1 1 0 0 1-1.4 0l-3-3a1 1 0 1 1 1.4-1.4L9 11.6l6.3-6.3a1 1 0 0 1 1.4 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              )}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className={sectionClass}>
          <SectionHeader title="Conclusion Comment" />
          <div className="p-5">
            <textarea
              value={conclusion}
              onChange={(e) => setConclusion(e.target.value)}
              placeholder="Share any concluding remarks about this vendor's performance..."
              className={textareaClass}
            />
          </div>
        </div>

        <div className={sectionClass}>
          <SectionHeader title="Overall Rating" />
          <div className="p-5">
            <div className="flex flex-wrap items-center gap-4">
              {[1, 2, 3, 4, 5].map((value) => {
                const active = overall >= value;

                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setOverall(overall === value ? 0 : value)}
                    className={`flex min-w-[72px] flex-col items-center gap-1 rounded-md border-2 p-3 transition-colors ${
                      active
                        ? "border-primary bg-primary/10"
                        : "border-border bg-background hover:border-primary/50"
                    }`}
                    aria-label={`Overall rating ${value}`}
                  >
                    <Star
                      className={`h-6 w-6 ${
                        active
                          ? "fill-primary text-primary"
                          : "text-muted-foreground"
                      }`}
                    />
                    <span className="text-sm font-medium text-foreground">
                      {value}
                    </span>
                  </button>
                );
              })}

              {overall > 0 && (
                <span className="ml-2 text-sm text-muted-foreground">
                  Selected:{" "}
                  <span className="font-semibold text-foreground">
                    {overall} / 5
                  </span>
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pb-4">
          <button
            type="button"
            onClick={handleReset}
            className={actionButtonClass}
          >
            Reset
          </button>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded border border-primary bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            Submit Assessment
          </button>
        </div>
      </div>
    </div>
  );
}
