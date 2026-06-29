import { useEffect, useMemo, useRef, useState } from "react";
import { Calendar, Plus, Save, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { formatDisplayDate } from "../../../utils/dateFormatter";

const PROJECTS = ["Project Alpha", "Project Beta", "Project Gamma"];

const uid = () => Math.random().toString(36).slice(2, 10);

const blankRow = (designation = "") => ({
  id: uid(),
  name: "",
  designation,
  mobile: "",
  telephone: "",
  email: "",
  remarks: "",
});

const mkSection = (vendor, category, designations = []) => ({
  id: uid(),
  vendor,
  category,
  rows: designations.length
    ? designations.map((designation) => blankRow(designation))
    : [blankRow()],
});

const SECTION_CATEGORIES = [
  "Client",
  "PMC",
  "Civil Contractor",
  "PEB Contractor",
  "RMC Plant 1",
  "Sub Contractor 1",
  "Supplier 1",
  "3rd Party Testing Lab 1",
  "Land Grading / Site Development Contractor",
  "Electrical, Fire and Security Consultant",
  "Architectural Consultant",
  "HVAC Consultant",
  "Plumbing and Fire Fighting Consultant",
  "Structural Consultant",
  "Quantity / Audit (TPQA) Consultant",
  "Interior Consultant",
  "Landscape Consultant",
];

const seedSections = () =>
  SECTION_CATEGORIES.map((category) => mkSection("", category));

const formatDate = (date) => formatDisplayDate(date);

const inputCls =
  "w-full rounded-md border border-transparent bg-transparent px-2 py-1.5 text-sm text-foreground transition-colors placeholder:text-muted-foreground/60 hover:border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30";

const tableHeaderCls =
  "bg-[#f5f7fa] text-[11px] font-semibold uppercase tracking-wide text-[#6b7280]";

const AutoTextarea = ({ value, onChange, placeholder }) => {
  const ref = useRef(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    element.style.height = "auto";
    element.style.height = `${Math.max(36, element.scrollHeight)}px`;
  }, [value]);

  return (
    <textarea
      ref={ref}
      rows={1}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={`${inputCls} min-h-[36px] resize-none leading-snug`}
    />
  );
};

function SectionFragment({
  section,
  sectionIndex,
  updateRow,
  updateSectionField,
  insertRowBelow,
  appendRow,
  deleteRow,
}) {
  return (
    <>
      <tr className="border-y border-[#e5e7eb] bg-[#f8fafc]">
        <td colSpan={8} className="px-3 py-2.5">
          <div className="flex flex-wrap items-center gap-3">
            <input
              value={section.vendor}
              onChange={(e) =>
                updateSectionField(sectionIndex, "vendor", e.target.value)
              }
              className="min-w-[160px] rounded-md border border-transparent bg-transparent px-2 py-1 text-sm font-semibold tracking-tight text-foreground hover:border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="Vendor / Company"
            />
            <span className="text-muted-foreground">·</span>
            <input
              value={section.category}
              onChange={(e) =>
                updateSectionField(sectionIndex, "category", e.target.value)
              }
              className="min-w-[200px] rounded-md border border-transparent bg-transparent px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground hover:border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="Category"
            />
            <button
              type="button"
              onClick={() => appendRow(sectionIndex)}
              className="ml-auto inline-flex items-center gap-1.5 rounded-md border border-[#d9dee7] bg-white px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-[#f8fafc]"
            >
              <Plus className="h-3.5 w-3.5" />
              Add row
            </button>
          </div>
        </td>
      </tr>

      {section.rows.map((row, rowIndex) => (
        <tr
          key={row.id}
          className="align-top transition-colors hover:bg-[#f8fafc]"
        >
          <td className="border-b border-border/60 px-3 py-2 text-xs tabular-nums text-muted-foreground">
            {rowIndex + 1}
          </td>
          <td className="border-b border-border/60 px-1 py-1.5">
            <input
              value={row.name}
              onChange={(e) =>
                updateRow(sectionIndex, rowIndex, "name", e.target.value)
              }
              className={inputCls}
              placeholder="Full name"
            />
          </td>
          <td className="border-b border-border/60 px-1 py-1.5">
            <input
              value={row.designation}
              onChange={(e) =>
                updateRow(sectionIndex, rowIndex, "designation", e.target.value)
              }
              className={inputCls}
              placeholder="Designation"
            />
          </td>
          <td className="border-b border-border/60 px-1 py-1.5">
            <input
              type="tel"
              value={row.mobile}
              onChange={(e) =>
                updateRow(sectionIndex, rowIndex, "mobile", e.target.value)
              }
              className={`${inputCls} tabular-nums`}
              placeholder="+91 ..."
            />
          </td>
          {/* <td className="border-b border-border/60 px-1 py-1.5">
            <input
              type="tel"
              value={row.telephone}
              onChange={(e) => updateRow(sectionIndex, rowIndex, "telephone", e.target.value)}
              className={`${inputCls} tabular-nums`}
              placeholder="Landline"
            />
          </td> */}
          <td className="border-b border-border/60 px-1 py-1.5">
            <input
              type="email"
              value={row.email}
              onChange={(e) =>
                updateRow(sectionIndex, rowIndex, "email", e.target.value)
              }
              className={inputCls}
              placeholder="name@company.com"
            />
          </td>
          {/* <td className="border-b border-border/60 px-1 py-1.5">
            <AutoTextarea
              value={row.remarks}
              onChange={(value) => updateRow(sectionIndex, rowIndex, "remarks", value)}
              placeholder="Notes..."
            />
          </td> */}
          <td className="border-b border-border/60 px-2 py-1.5">
            <div className="flex items-center justify-end gap-1">
              <button
                type="button"
                onClick={() => insertRowBelow(sectionIndex, rowIndex)}
                title="Insert row below"
                className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-[#eef2f7] hover:text-foreground"
              >
                <Plus className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => deleteRow(sectionIndex, rowIndex)}
                title="Delete row"
                className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </td>
        </tr>
      ))}
    </>
  );
}

const ContactDirectory = () => {
  const [project, setProject] = useState(PROJECTS[0]);
  const [projectData, setProjectData] = useState(() => ({
    [PROJECTS[0]]: seedSections(),
  }));
  const [lastUpdated, setLastUpdated] = useState({});

  const sections = useMemo(() => {
    if (!projectData[project]) return seedSections();
    return projectData[project];
  }, [project, projectData]);

  useEffect(() => {
    if (!projectData[project]) {
      setProjectData((prev) => ({ ...prev, [project]: seedSections() }));
    }
  }, [project, projectData]);

  const updateSections = (next) => {
    setProjectData((prev) => ({ ...prev, [project]: next }));
  };

  const updateRow = (sectionIndex, rowIndex, key, value) => {
    const next = sections.map((section, sIdx) =>
      sIdx !== sectionIndex
        ? section
        : {
            ...section,
            rows: section.rows.map((row, rIdx) =>
              rIdx !== rowIndex ? row : { ...row, [key]: value },
            ),
          },
    );
    updateSections(next);
  };

  const updateSectionField = (sectionIndex, key, value) => {
    updateSections(
      sections.map((section, sIdx) =>
        sIdx !== sectionIndex ? section : { ...section, [key]: value },
      ),
    );
  };

  const insertRowBelow = (sectionIndex, rowIndex) => {
    const next = sections.map((section, sIdx) => {
      if (sIdx !== sectionIndex) return section;
      const rows = [...section.rows];
      rows.splice(rowIndex + 1, 0, blankRow());
      return { ...section, rows };
    });
    updateSections(next);
  };

  const appendRow = (sectionIndex) => {
    updateSections(
      sections.map((section, sIdx) =>
        sIdx !== sectionIndex
          ? section
          : { ...section, rows: [...section.rows, blankRow()] },
      ),
    );
  };

  const deleteRow = (sectionIndex, rowIndex) => {
    const next = sections.map((section, sIdx) => {
      if (sIdx !== sectionIndex) return section;
      if (section.rows.length <= 1) return { ...section, rows: [blankRow()] };
      return {
        ...section,
        rows: section.rows.filter(
          (_, currentIndex) => currentIndex !== rowIndex,
        ),
      };
    });
    updateSections(next);
  };

  const handleSave = () => {
    const today = formatDate(new Date());
    setLastUpdated((prev) => ({ ...prev, [project]: today }));
    console.log("Saved directory for", project, sections);
    toast.success("Directory saved");
  };

  const updatedOn = lastUpdated[project] || "-";

  return (
    <div className="min-h-screen bg-content-bg text-foreground">
      <div className="mx-auto max-w-[1400px] px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">
            Project Directory
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Contact Details of All Agencies & Vendors
          </p>
        </div>

        <div className="mb-5 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Project
            </label>
            <select
              value={project}
              onChange={(e) => setProject(e.target.value)}
              className="h-9 min-w-[200px] rounded-md border border-border bg-background px-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {PROJECTS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Updated on
              </span>
              <span className="text-sm font-medium tabular-nums text-foreground">
                {updatedOn}
              </span>
            </div>

            <button
              type="button"
              onClick={handleSave}
              className="inline-flex h-9 items-center gap-2 rounded-md border border-primary bg-primary px-4 text-sm font-medium text-white shadow-sm transition-colors hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <Save className="h-4 w-4" />
              Save
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead className="sticky top-0 z-10 bg-[#f5f7fa]">
                <tr className="text-left">
                  <th className={`w-10 px-3 py-3 ${tableHeaderCls}`}>#</th>
                  <th className={`min-w-[180px] px-3 py-3 ${tableHeaderCls}`}>
                    Name
                  </th>
                  <th className={`min-w-[200px] px-3 py-3 ${tableHeaderCls}`}>
                    Designation / Position
                  </th>
                  <th className={`min-w-[140px] px-3 py-3 ${tableHeaderCls}`}>
                    Mobile No.
                  </th>
                  {/* <th className={`min-w-[140px] px-3 py-3 ${tableHeaderCls}`}>
                    Telephone
                  </th> */}
                  <th className={`min-w-[200px] px-3 py-3 ${tableHeaderCls}`}>
                    Email ID
                  </th>
                  {/* <th className={`min-w-[220px] px-3 py-3 ${tableHeaderCls}`}>
                    Remarks
                  </th> */}
                  <th className={`w-24 px-3 py-3 text-right ${tableHeaderCls}`}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {sections.map((section, sectionIndex) => (
                  <SectionFragment
                    key={section.id}
                    section={section}
                    sectionIndex={sectionIndex}
                    updateRow={updateRow}
                    updateSectionField={updateSectionField}
                    insertRowBelow={insertRowBelow}
                    appendRow={appendRow}
                    deleteRow={deleteRow}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          Tip: use the <span className="font-medium">+</span> on any row to
          insert a new entry directly below it, or the{" "}
          <span className="font-medium">Add row</span> button in a section
          header to append at the end.
        </p>
      </div>
    </div>
  );
};

export default ContactDirectory;