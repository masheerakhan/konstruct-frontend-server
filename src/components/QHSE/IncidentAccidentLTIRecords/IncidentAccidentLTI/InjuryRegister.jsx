import { forwardRef, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { formatInputDate } from "../../../../utils/dateFormatter";

/* Local inline UI replacements for unavailable @/components/ui imports */
const joinClasses = (...classes) => classes.filter(Boolean).join(" ");

const Card = ({ className = "", children, ...props }) => (
  <section
    className={joinClasses(
      "rounded-lg border border-border bg-card",
      className,
    )}
    {...props}
  >
    {children}
  </section>
);

const CardHeader = ({ className = "", children, ...props }) => (
  <div className={joinClasses("space-y-1.5 p-6", className)} {...props}>
    {children}
  </div>
);

const CardTitle = ({ className = "", children, ...props }) => (
  <h2
    className={joinClasses(
      "font-semibold tracking-tight text-foreground",
      className,
    )}
    {...props}
  >
    {children}
  </h2>
);

const CardContent = ({ className = "", children, ...props }) => (
  <div className={joinClasses("p-6 pt-0", className)} {...props}>
    {children}
  </div>
);

const Label = ({ className = "", children, ...props }) => (
  <label
    className={joinClasses(
      "text-sm font-medium leading-none text-foreground",
      className,
    )}
    {...props}
  >
    {children}
  </label>
);

const Input = forwardRef(({ className = "", ...props }, ref) => (
  <input
    ref={ref}
    className={joinClasses(
      "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";

const Textarea = forwardRef(({ className = "", ...props }, ref) => (
  <textarea
    ref={ref}
    className={joinClasses(
      "flex min-h-[72px] w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

const Button = ({
  className = "",
  variant = "default",
  size = "default",
  children,
  ...props
}) => {
  const variantClass =
    variant === "outline"
      ? "border border-input bg-background text-foreground hover:bg-muted"
      : variant === "ghost"
        ? "text-foreground hover:bg-muted"
        : "bg-blue-600 text-white hover:bg-blue-700";
  const sizeClass = size === "icon" ? "h-10 w-10" : "h-10 px-4 py-2";

  return (
    <button
      className={joinClasses(
        "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition disabled:pointer-events-none disabled:opacity-50",
        variantClass,
        sizeClass,
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
};

const Table = ({ className = "", children, ...props }) => (
  <table
    className={joinClasses("w-full caption-bottom text-sm", className)}
    {...props}
  >
    {children}
  </table>
);

const TableHeader = ({ className = "", children, ...props }) => (
  <thead className={joinClasses("[&_tr]:border-b", className)} {...props}>
    {children}
  </thead>
);

const TableBody = ({ className = "", children, ...props }) => (
  <tbody
    className={joinClasses("[&_tr:last-child]:border-0", className)}
    {...props}
  >
    {children}
  </tbody>
);

const TableRow = ({ className = "", children, ...props }) => (
  <tr
    className={joinClasses(
      "border-b border-border transition hover:bg-muted/30",
      className,
    )}
    {...props}
  >
    {children}
  </tr>
);

const TableHead = ({ className = "", children, ...props }) => (
  <th
    className={joinClasses(
      "h-12 px-4 text-left align-middle font-medium text-muted-foreground",
      className,
    )}
    {...props}
  >
    {children}
  </th>
);

const TableCell = ({ className = "", children, ...props }) => (
  <td className={joinClasses("p-4 align-middle", className)} {...props}>
    {children}
  </td>
);

const Checkbox = forwardRef(
  ({ checked, onCheckedChange, className = "", ...props }, ref) => (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      onChange={(event) => onCheckedChange?.(event.target.checked)}
      className={joinClasses(
        "h-4 w-4 cursor-pointer rounded border border-input accent-blue-600",
        className,
      )}
      {...props}
    />
  ),
);
Checkbox.displayName = "Checkbox";

const emptyRow = () => ({
  id: crypto.randomUUID(),
  reportNo: "",
  employeeName: "",
  jobTitle: "",
  dateOfInjury: "",
  location: "",
  description: "",
  daysAway: false,
  jobTransfer: false,
  death: false,
  otherRecord: false,
  daysAwayCount: "",
  daysRestrictionCount: "",
  injury: false,
  skinDisorder: false,
  respiratory: false,
  poisoning: false,
  hearingLoss: false,
  otherIllness: false,
});

const stepGroups = [
  {
    label: "Step 1 — Identify the Person",
    span: 3,
    tone: "bg-primary/10 text-primary",
  },
  {
    label: "Step 2 — Describe the Case",
    span: 3,
    tone: "bg-secondary text-secondary-foreground",
  },
  {
    label: "Step 3 — Classify the case",
    span: 4,
    tone: "bg-primary/10 text-accent-foreground",
  },
  { label: "Step 4 — Days", span: 2, tone: "bg-muted text-foreground" },
  {
    label: "Step 5 — Illness type",
    span: 6,
    tone: "bg-primary/10 text-primary",
  },
];

const columns = [
  { key: "reportNo", label: "Report No", type: "text", width: "w-28" },
  {
    key: "employeeName",
    label: "Employee's Name",
    type: "text",
    width: "w-44",
  },
  { key: "jobTitle", label: "Job Title", type: "text", width: "w-40" },
  { key: "dateOfInjury", label: "Date of Injury", type: "date", width: "w-40" },
  { key: "location", label: "Location of Event", type: "text", width: "w-44" },
  {
    key: "description",
    label: "Describe injury / illness / body part / object",
    type: "textarea",
    width: "w-72",
  },
  { key: "daysAway", label: "Days away from work", type: "checkbox" },
  {
    key: "jobTransfer",
    label: "Job transfer or restriction",
    type: "checkbox",
  },
  { key: "death", label: "Death", type: "checkbox" },
  { key: "otherRecord", label: "Other record", type: "checkbox" },
  {
    key: "daysAwayCount",
    label: "Away from (days)",
    type: "number",
    width: "w-24",
  },
  {
    key: "daysRestrictionCount",
    label: "On transfer/restriction (days)",
    type: "number",
    width: "w-24",
  },
  { key: "injury", label: "Injury", type: "checkbox" },
  { key: "skinDisorder", label: "Skin Disorder", type: "checkbox" },
  { key: "respiratory", label: "Respiratory Condition", type: "checkbox" },
  { key: "poisoning", label: "Poisoning", type: "checkbox" },
  { key: "hearingLoss", label: "Hearing Loss", type: "checkbox" },
  { key: "otherIllness", label: "All other Illness", type: "checkbox" },
];

export function InjuryRegister() {
  const [project, setProject] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState(() => formatInputDate(new Date()));
  const [rows, setRows] = useState([emptyRow()]);

  const updateRow = (id, patch) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const addRow = () => setRows((rs) => [...rs, emptyRow()]);
  const deleteRow = (id) =>
    setRows((rs) => (rs.length === 1 ? rs : rs.filter((r) => r.id !== id)));

  const totalAway = rows.reduce(
    (sum, r) => sum + (Number(r.daysAwayCount) || 0),
    0,
  );
  const totalRestriction = rows.reduce(
    (sum, r) => sum + (Number(r.daysRestrictionCount) || 0),
    0,
  );

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl">
          Register of Work-Related Injuries, Illnesses, Lost Time Injuries (LTI)
        </CardTitle>
        <div className="grid grid-cols-1 gap-4 pt-4 md:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="project">Project</Label>
            <Input
              id="project"
              value={project}
              onChange={(e) => setProject(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-lg border">
          <Table className="min-w-[1800px]">
            <TableHeader>
              <TableRow className="bg-muted/40">
                {stepGroups.map((g) => (
                  <TableHead
                    key={g.label}
                    colSpan={g.span}
                    className={`border-r text-center text-xs font-semibold ${g.tone}`}
                  >
                    {g.label}
                  </TableHead>
                ))}
                <TableHead className="w-16 text-center">Actions</TableHead>
              </TableRow>
              <TableRow>
                {columns.map((c) => (
                  <TableHead key={c.key} className={`text-xs ${c.width ?? ""}`}>
                    {c.label}
                  </TableHead>
                ))}
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, idx) => (
                <TableRow key={row.id} className="align-top">
                  {columns.map((c) => (
                    <TableCell key={c.key} className="p-2">
                      {c.type === "checkbox" ? (
                        <label className="flex cursor-pointer items-center justify-center gap-1.5 pt-2">
                          <Checkbox
                            checked={row[c.key] === true}
                            onCheckedChange={(v) =>
                              updateRow(row.id, { [c.key]: v === true })
                            }
                            aria-label={c.label}
                          />
                          <span className="sr-only">{c.label}</span>
                        </label>
                      ) : c.type === "textarea" ? (
                        <Textarea
                          rows={2}
                          value={row[c.key]}
                          onChange={(e) =>
                            updateRow(row.id, { [c.key]: e.target.value })
                          }
                        />
                      ) : (
                        <Input
                          type={c.type}
                          value={row[c.key]}
                          onChange={(e) =>
                            updateRow(row.id, { [c.key]: e.target.value })
                          }
                        />
                      )}
                    </TableCell>
                  ))}
                  <TableCell className="p-2 text-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteRow(row.id)}
                      disabled={rows.length === 1}
                      aria-label={`Delete row ${idx + 1}`}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted/40 font-medium">
                <TableCell colSpan={10} className="text-right">
                  Total
                </TableCell>
                <TableCell className="text-center">{totalAway}</TableCell>
                <TableCell className="text-center">
                  {totalRestriction}
                </TableCell>
                <TableCell colSpan={7} />
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <Button type="button" variant="outline" onClick={addRow}>
            <Plus className="h-4 w-4" /> Add Row
          </Button>
          <p className="text-xs text-muted-foreground">
            LTIR = (Total Number of Lost Time Injuries / Total Hours Worked) ×
            200,000
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
