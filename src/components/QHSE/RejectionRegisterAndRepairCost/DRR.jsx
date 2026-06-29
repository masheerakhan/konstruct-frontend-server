import { useEffect, useRef, useState } from "react";
import { Paperclip, X } from "lucide-react";
import toast from "react-hot-toast";
import { formatInputDate } from "../../../utils/dateFormatter";

const PROJECTS = [
  "Tower A - Phase 1",
  "Metro Station Block",
  "Bridge Pier Works",
  "Residential Complex 7",
];

const DECISIONS = [
  { value: "proceed", label: "Proceed with Repair" },
  { value: "dont", label: "Don't Proceed" },
  { value: "dismantle", label: "Dismantle the Element" },
  { value: "study", label: "Require further study & Report" },
];

const formatDate = (date) => formatInputDate(date);

const initialState = {
  project: "",
  reportNo: "",
  location: "",
  date: formatDate(new Date()),
  activity: "",
  element: "",
  requestedBy: "",
  grid: "",
  locationOfDefect: "",
  defectObserved: "",
  materials: "",
  methodology: "",
  inspection: "",
  decision: "",
  studyDetails: "",
};

const SectionHeader = ({ number, title, description }) => (
  <div className="border-b border-border px-5 py-4">
    <h2 className="text-lg font-semibold text-foreground">
      {number}. {title}
    </h2>
    {description ? (
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    ) : null}
  </div>
);

const DRR = () => {
  const [form, setForm] = useState(initialState);
  const [attachments, setAttachments] = useState([]);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const fileInputRef = useRef(null);

  const sectionClass =
    "overflow-hidden rounded-xl border border-border bg-card shadow-sm";
  const inputClass =
    "h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30";
  const selectClass = `${inputClass} appearance-none pr-9`;
  const textareaClass =
    "w-full min-h-[128px] resize-y rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30";
  const buttonClass =
    "inline-flex items-center justify-center rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-content-bg focus:outline-none focus:ring-2 focus:ring-primary/30";

  const update = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const fetchUserLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported by your browser.");
      return;
    }

    setLoadingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
          );
          const data = await response.json();
          const address =
            data?.display_name ||
            `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;

          setForm((prev) => ({
            ...prev,
            location: address,
          }));
        } catch (error) {
          setForm((prev) => ({
            ...prev,
            location: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
          }));
        } finally {
          setLoadingLocation(false);
        }
      },
      () => {
        setLoadingLocation(false);
        toast.error("Unable to fetch location.");
      },
    );
  };

  useEffect(() => {
    if (!form.location) {
      fetchUserLocation();
    }
  }, []);

  const handleFiles = (event) => {
    if (event.target.files) {
      setAttachments((prev) => [...prev, ...Array.from(event.target.files)]);
      event.target.value = "";
    }
  };

  const removeAttachment = (index) => {
    setAttachments((prev) =>
      prev.filter((_, currentIndex) => currentIndex !== index),
    );
  };

  const handleReset = () => {
    setForm({ ...initialState, date: formatDate(new Date()) });
    setAttachments([]);
    fetchUserLocation();
    toast("Form reset");
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!form.project || !form.reportNo || !form.decision) {
      toast.error(
        "Please fill required fields: Project, Report No., Final Decision",
      );
      return;
    }

    const payload = {
      ...form,
      attachments: attachments.map((file) => file.name),
    };

    console.log("DRR Submission:", payload);
    toast.success("DRR submitted successfully");
  };

  return (
    <div className="min-h-screen bg-content-bg px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Defect Repairing Request (DRR)
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Document observed defects and recommended repair actions for review.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          <section className={sectionClass}>
            <SectionHeader
              number="1"
              title="Project Details"
              description="Basic information about the report."
            />
            <div className="p-5 sm:p-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label
                    htmlFor="project"
                    className="text-sm font-medium text-foreground"
                  >
                    Project <span className="text-red-600">*</span>
                  </label>
                  <div className="relative">
                    <select
                      id="project"
                      value={form.project}
                      onChange={(e) => update("project", e.target.value)}
                      className={selectClass}
                    >
                      <option value="">Select project</option>
                      {PROJECTS.map((project) => (
                        <option key={project} value={project}>
                          {project}
                        </option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      ▾
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="reportNo"
                    className="text-sm font-medium text-foreground"
                  >
                    Report No. <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="reportNo"
                    value={form.reportNo}
                    onChange={(e) => update("reportNo", e.target.value)}
                    placeholder="e.g. DRR-2025-001"
                    className={inputClass}
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="location"
                    className="text-sm font-medium text-foreground"
                  >
                    Location
                  </label>
                  <input
                    id="location"
                    value={form.location}
                    onChange={(e) => update("location", e.target.value)}
                    placeholder="Site location"
                    className={inputClass}
                  />
                  {loadingLocation ? (
                    <p className="text-xs text-muted-foreground">
                      Fetching current location...
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="date"
                    className="text-sm font-medium text-foreground"
                  >
                    Date
                  </label>
                  <input
                    id="date"
                    type="date"
                    value={form.date}
                    onChange={(e) => update("date", e.target.value)}
                    className={inputClass}
                  />
                  <p className="text-xs text-muted-foreground">
                    Defaults to today.
                  </p>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="activity"
                    className="text-sm font-medium text-foreground"
                  >
                    Activity
                  </label>
                  <input
                    id="activity"
                    value={form.activity}
                    onChange={(e) => update("activity", e.target.value)}
                    placeholder="e.g. Concrete pouring"
                    className={inputClass}
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="element"
                    className="text-sm font-medium text-foreground"
                  >
                    Element
                  </label>
                  <input
                    id="element"
                    value={form.element}
                    onChange={(e) => update("element", e.target.value)}
                    placeholder="e.g. Column C-12"
                    className={inputClass}
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="requestedBy"
                    className="text-sm font-medium text-foreground"
                  >
                    Requested by
                  </label>
                  <input
                    id="requestedBy"
                    value={form.requestedBy}
                    onChange={(e) => update("requestedBy", e.target.value)}
                    placeholder="Name / Designation"
                    className={inputClass}
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="grid"
                    className="text-sm font-medium text-foreground"
                  >
                    Grid
                  </label>
                  <input
                    id="grid"
                    value={form.grid}
                    onChange={(e) => update("grid", e.target.value)}
                    placeholder="e.g. A-3 / B-7"
                    className={inputClass}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label
                    htmlFor="locationOfDefect"
                    className="text-sm font-medium text-foreground"
                  >
                    Location of Defect
                  </label>
                  <input
                    id="locationOfDefect"
                    value={form.locationOfDefect}
                    onChange={(e) => update("locationOfDefect", e.target.value)}
                    placeholder="Precise location where the defect was observed"
                    className={inputClass}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-foreground">
                    Attachments
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      className={buttonClass}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Paperclip className="mr-2 h-4 w-4" />
                      Add files
                    </button>
                    <span className="text-xs text-muted-foreground">
                      {attachments.length} file
                      {attachments.length === 1 ? "" : "s"} selected
                    </span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      className="hidden"
                      onChange={handleFiles}
                    />
                  </div>
                  {attachments.length > 0 ? (
                    <ul className="mt-2 space-y-1">
                      {attachments.map((file, index) => (
                        <li
                          key={`${file.name}-${index}`}
                          className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-sm"
                        >
                          <span className="truncate">{file.name}</span>
                          <button
                            type="button"
                            onClick={() => removeAttachment(index)}
                            className="text-muted-foreground transition hover:text-red-600"
                            aria-label="Remove attachment"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </div>
            </div>
          </section>

          <section className={sectionClass}>
            <SectionHeader
              number="2"
              title="Defect Observed"
              description="Describe the defect in detail."
            />
            <div className="p-5 sm:p-6">
              <textarea
                value={form.defectObserved}
                onChange={(e) => update("defectObserved", e.target.value)}
                placeholder="Describe the nature, extent and severity of the defect observed..."
                className={textareaClass}
              />
            </div>
          </section>

          <section className={sectionClass}>
            <SectionHeader
              number="3"
              title="Recommended Materials to be Used"
              description="List materials, brands, and specifications."
            />
            <div className="p-5 sm:p-6">
              <textarea
                value={form.materials}
                onChange={(e) => update("materials", e.target.value)}
                placeholder="e.g. Sika MonoTop-412 NFG, epoxy bonding agent..."
                className={textareaClass}
              />
            </div>
          </section>

          <section className={sectionClass}>
            <SectionHeader
              number="4"
              title="Recommended Methodology of Repair (in Brief)"
              description="Step-by-step approach for the repair."
            />
            <div className="p-5 sm:p-6">
              <textarea
                value={form.methodology}
                onChange={(e) => update("methodology", e.target.value)}
                placeholder="Outline preparation, application and curing steps..."
                className={textareaClass}
              />
            </div>
          </section>

          <section className={sectionClass}>
            <SectionHeader
              number="5"
              title="Recommended Test / Visual Inspection"
              description="Tests required to validate the repair."
            />
            <div className="p-5 sm:p-6">
              <textarea
                value={form.inspection}
                onChange={(e) => update("inspection", e.target.value)}
                placeholder="e.g. Pull-off test, UPV, visual inspection at 7 & 28 days..."
                className={textareaClass}
              />
            </div>
          </section>

          <section className={sectionClass}>
            <SectionHeader
              number="6"
              title="Final Decision"
              description="Choose the recommended course of action."
            />
            <div className="p-5 sm:p-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label
                    htmlFor="decision"
                    className="text-sm font-medium text-foreground"
                  >
                    Decision <span className="text-red-600">*</span>
                  </label>
                  <div className="relative">
                    <select
                      id="decision"
                      value={form.decision}
                      onChange={(e) => update("decision", e.target.value)}
                      className={selectClass}
                    >
                      <option value="">Select final decision</option>
                      {DECISIONS.map((decision) => (
                        <option key={decision.value} value={decision.value}>
                          {decision.label}
                        </option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      ▾
                    </span>
                  </div>
                </div>

                {form.decision === "study" ? (
                  <div className="space-y-2 md:col-span-2">
                    <label
                      htmlFor="studyDetails"
                      className="text-sm font-medium text-foreground"
                    >
                      Study &amp; Report Details
                    </label>
                    <textarea
                      id="studyDetails"
                      value={form.studyDetails}
                      onChange={(e) => update("studyDetails", e.target.value)}
                      placeholder="Specify scope of further study, responsible party, expected timeline..."
                      className={textareaClass}
                    />
                  </div>
                ) : null}
              </div>
            </div>
          </section>

          <div className="flex justify-end gap-3 pb-8">
            <button type="button" className={buttonClass} onClick={handleReset}>
              Reset
            </button>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-md border border-primary bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              Submit DRR
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DRR;
