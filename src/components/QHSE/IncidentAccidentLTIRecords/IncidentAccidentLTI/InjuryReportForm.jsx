import { createContext, forwardRef, useContext, useId, useState } from "react";


/* Local inline UI replacements for unavailable @/components/ui imports */
const FieldContext = createContext(null);
const RadioGroupContext = createContext(null);
const SimpleFormContext = createContext(null);

const Form = ({ children, ...methods }) => (
  <SimpleFormContext.Provider value={methods}>{children}</SimpleFormContext.Provider>
);

const FormField = ({ control, name, render }) => (
  <FieldContext.Provider value={name}>
    {render({
      field: {
        name,
        value: control.values[name] ?? "",
        onChange: (eventOrValue) => {
          const value = eventOrValue?.target ? eventOrValue.target.value : eventOrValue;
          control.setValue(name, value);
        },
      },
    })}
  </FieldContext.Provider>
);

const FormItem = ({ children, className = "" }) => (
  <div className={`space-y-1.5 ${className}`}>{children}</div>
);

const FormLabel = ({ children }) => (
  <label className="block text-sm font-medium text-foreground">{children}</label>
);

const FormControl = ({ children }) => children;

const FormMessage = () => {
  const name = useContext(FieldContext);
  const { formState: { errors } } = useContext(SimpleFormContext);
  const message = name ? errors[name]?.message : null;

  return message ? (
    <p className="text-sm font-medium text-red-600">{String(message)}</p>
  ) : null;
};

const Card = ({ children }) => (
  <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
    {children}
  </section>
);

const CardHeader = ({ children }) => (
  <div className="border-b border-border bg-blue-600 px-5 py-3 text-white">
    {children}
  </div>
);

const CardTitle = ({ children }) => (
  <h2 className="text-base font-semibold tracking-wide">{children}</h2>
);

const CardContent = ({ children, className = "" }) => (
  <div className={`p-5 ${className}`}>{children}</div>
);

const Input = forwardRef(({ className = "", ...props }, ref) => (
  <input
    ref={ref}
    className={`h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${className}`}
    {...props}
  />
));
Input.displayName = "Input";

const Textarea = forwardRef(({ className = "", ...props }, ref) => (
  <textarea
    ref={ref}
    className={`w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${className}`}
    {...props}
  />
));
Textarea.displayName = "Textarea";

const RadioGroup = ({ value, onValueChange, className = "", children }) => {
  const name = useId();

  return (
    <RadioGroupContext.Provider value={{ name, value, onValueChange }}>
      <div role="radiogroup" className={className}>{children}</div>
    </RadioGroupContext.Provider>
  );
};

const RadioGroupItem = forwardRef(({ value, className = "", ...props }, ref) => {
  const group = useContext(RadioGroupContext);

  return (
    <input
      ref={ref}
      type="radio"
      name={group?.name}
      value={value}
      checked={group?.value === value}
      onChange={() => group?.onValueChange(value)}
      className={`h-4 w-4 accent-blue-600 ${className}`}
      {...props}
    />
  );
});
RadioGroupItem.displayName = "RadioGroupItem";

const Button = ({
  type = "button",
  variant = "default",
  className = "",
  children,
  ...props
}) => (
  <button
    type={type}
    className={`inline-flex h-10 items-center justify-center rounded-md px-5 text-sm font-medium transition ${
      variant === "outline"
        ? "border border-input bg-background text-foreground hover:bg-muted"
        : "bg-blue-600 text-white hover:bg-blue-700"
    } ${className}`}
    {...props}
  >
    {children}
  </button>
);

const REQUIRED_FIELDS = [
  "fullName",
  "recordNo",
  "dateOfInjury",
  "activityBefore",
  "whatHappened",
  "injuryDescription",
  "reporterName",
  "reportDate",
];

const defaultValues = {
  fullName: "",
  recordNo: "",
  address: "",
  gender: "",
  dateOfBirth: "",
  dateHired: "",
  physicianName: "",
  facilityAddress: "",
  treatedEmergency: "",
  hospitalizedOvernight: "",
  caseNumber: "",
  dateOfInjury: "",
  timeBeganWork: "",
  timeOfEvent: "",
  activityBefore: "",
  whatHappened: "",
  injuryDescription: "",
  harmfulObject: "",
  dateOfDeath: "",
  reporterName: "",
  reporterPosition: "",
  reporterCompany: "",
  reporterPhone: "",
  reportDate: "",
  signature: "",
};

function useSimpleForm(initialValues) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});

  const setValue = (name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const validate = (nextValues) => {
    const nextErrors = {};
    REQUIRED_FIELDS.forEach((field) => {
      if (!String(nextValues[field] || "").trim()) {
        nextErrors[field] = { message: "Required" };
      }
    });
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  return {
    control: { values, setValue },
    formState: { errors },
    handleSubmit: (onValid) => (event) => {
      event.preventDefault();
      if (validate(values)) onValid(values);
    },
    reset: () => {
      setValues(initialValues);
      setErrors({});
    },
  };
}

export function InjuryReportForm() {
  const [submitted, setSubmitted] = useState(false);

  const form = useSimpleForm(defaultValues);

  const onSubmit = (values) => {
    console.log("Injury report submitted", values);
    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {submitted && (
          <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            Report submitted successfully. Check the console for the captured values.
          </div>
        )}

        {/* Section 1: Employee */}
        <Card>
          <CardHeader>
            <CardTitle>Information about the employee</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Jane Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="recordNo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Record No *</FormLabel>
                  <FormControl>
                    <Input placeholder="REC-0001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input placeholder="Street, City, ZIP" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gender</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="flex gap-6 pt-2"
                    >
                      <label className="flex items-center gap-2 text-sm">
                        <RadioGroupItem value="male" /> Male
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <RadioGroupItem value="female" /> Female
                      </label>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div />
            <FormField
              control={form.control}
              name="dateOfBirth"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date of Birth</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dateHired"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date Hired</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Section 2: Physician */}
        <Card>
          <CardHeader>
            <CardTitle>
              Information about the physician or other health care professional
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="physicianName"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Name of physician or other health care professional</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="facilityAddress"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>
                    If treatment was given away from the worksite, where was it given?
                    (Facility address)
                  </FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="treatedEmergency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Was employee treated in an emergency room?</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="flex gap-6 pt-2"
                    >
                      <label className="flex items-center gap-2 text-sm">
                        <RadioGroupItem value="yes" /> Yes
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <RadioGroupItem value="no" /> No
                      </label>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="hospitalizedOvernight"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Was employee hospitalized overnight as an in-patient?</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="flex gap-6 pt-2"
                    >
                      <label className="flex items-center gap-2 text-sm">
                        <RadioGroupItem value="yes" /> Yes
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <RadioGroupItem value="no" /> No
                      </label>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Section 3: Case */}
        <Card>
          <CardHeader>
            <CardTitle>Information about the case</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="caseNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Case number from the Log</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dateOfInjury"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date of injury / illness *</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="timeBeganWork"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Time employee began work</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="timeOfEvent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Time of event</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="activityBefore"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>
                    What was the employee doing just before the incident occurred? *
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="Describe the activity, tools, equipment, or materials."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="whatHappened"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>What happened? *</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="Tell us how the injury occurred." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="injuryDescription"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>What was the injury or illness? *</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="Part of body affected and how."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="harmfulObject"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>
                    What object or substance directly harmed the employee?
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      rows={2}
                      placeholder='Examples: "concrete floor", "chlorine", "radial arm saw".'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dateOfDeath"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>If the employee died, date of death</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Section 4: Reporter */}
        {/* <Card>
          <CardHeader>
            <CardTitle>Report completed by</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="reporterName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="reporterPosition"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Position</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="reporterCompany"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="reporterPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input type="tel" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="reportDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date *</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="signature"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Signature (typed)</FormLabel>
                  <FormControl>
                    <Input placeholder="Type your full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card> */}

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              form.reset();
              setSubmitted(false);
            }}
          >
            Reset
          </Button>
          <Button type="submit">Submit report</Button>
        </div>
      </form>
    </Form>
  );
}
