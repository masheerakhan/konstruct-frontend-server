import { useState } from "react";
import { formatInputDate } from "../../../../utils/dateFormatter";

const now = new Date();
const formatDate = (date) => formatInputDate(date);

const SectionHeader = ({ title }) => (
  <div className="border-b border-gray-200 px-5 py-4">
    <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
  </div>
);

const Index = () => {
  const [projectName, setProjectName] = useState("");
  const [date, setDate] = useState(formatDate(now));
  const [projectNo, setProjectNo] = useState("");
  const [inspectionLocation, setInspectionLocation] = useState("");
  const [physicalObservation, setPhysicalObservation] = useState("");
  const [discrepancies, setDiscrepancies] = useState("");
  const [trialRun, setTrialRun] = useState("");
  const [manufacturerAddress, setManufacturerAddress] = useState("");
  const [remarks, setRemarks] = useState("");
  const [equipmentDetails, setEquipmentDetails] = useState({
    equipmentName: "",
    machineSerialNo: "",
    yearOfManufacture: "",
    purchaseOrderDetails: "",
    make: "",
    model: "",
    serialNo: "",
    horsePower: "",
    rpm: "",
    driveFuel: "",
  });

  const projectOptions = ["Project A", "Project B", "Project C"];
  const equipmentFields = [
    {
      key: "equipmentName",
      label: "Equipment Name",
      placeholder: "Enter equipment name",
    },
    {
      key: "machineSerialNo",
      label: "Sr. No. of Machine",
      placeholder: "Enter serial number",
    },
    {
      key: "yearOfManufacture",
      label: "Year of Manufacture",
      placeholder: "e.g. 2024",
    },
    {
      key: "purchaseOrderDetails",
      label: "Purchase Order Details",
      placeholder: "Enter PO details",
    },
    {
      key: "make",
      label: "Make",
      placeholder: "Enter make",
    },
    {
      key: "model",
      label: "Model",
      placeholder: "Enter model",
    },
    {
      key: "serialNo",
      label: "Sr. No.",
      placeholder: "Enter serial number",
    },
    {
      key: "horsePower",
      label: "H.P.",
      placeholder: "Enter horsepower",
    },
    {
      key: "rpm",
      label: "R.P.M.",
      placeholder: "Enter RPM",
    },
    {
      key: "driveFuel",
      label: "Drive / Fuel",
      placeholder: "Enter drive/fuel type",
    },
  ];

  const inputClass =
    "w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500";
  const selectClass =
    "w-full appearance-none rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500";
  const textareaClass =
    "w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500";
  const sectionClass =
    "overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm";

  const handleEquipmentChange = (key, value) => {
    setEquipmentDetails((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="mx-auto max-w-4xl space-y-6">
        <h1 className="text-center text-2xl font-bold text-gray-800">
          Plant / Equipment Inspection Report
        </h1>

        <div className={sectionClass}>
          <SectionHeader title="Project Information" />
          <div className="space-y-4 p-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Project Name
                </label>
                <select
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className={selectClass}
                >
                  <option value="">Select project</option>
                  {projectOptions.map((project) => (
                    <option key={project} value={project}>
                      {project}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Project No.
                </label>
                <input
                  type="text"
                  value={projectNo}
                  onChange={(e) => setProjectNo(e.target.value)}
                  placeholder="Enter project number"
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        </div>

        <div className={sectionClass}>
          <SectionHeader title="Equipment Details" />
          <div className="p-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {equipmentFields.map((field) => (
                <div key={field.key}>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    {field.label}
                  </label>
                  <input
                    type="text"
                    value={equipmentDetails[field.key]}
                    onChange={(e) =>
                      handleEquipmentChange(field.key, e.target.value)
                    }
                    placeholder={field.placeholder}
                    className={inputClass}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={sectionClass}>
          <SectionHeader title="Name and Address of Manufacturer / Supplier" />
          <div className="p-5">
            <textarea
              value={manufacturerAddress}
              onChange={(e) => setManufacturerAddress(e.target.value)}
              placeholder="Enter manufacturer/supplier name and address"
              className={`${textareaClass} min-h-[120px]`}
            />
          </div>
        </div>

        <div className={sectionClass}>
          <SectionHeader title="Inspection Details" />
          <div className="space-y-4 p-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Inspection Carried at
                </label>
                <select
                  value={inspectionLocation}
                  onChange={(e) => setInspectionLocation(e.target.value)}
                  className={selectClass}
                >
                  <option value="">Select location</option>
                  <option value="Manufacturer's Premises">
                    Manufacturer&apos;s Premises
                  </option>
                  <option value="Site">Site</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Inspection as per Physical Observation
                </label>
                <select
                  value={physicalObservation}
                  onChange={(e) => setPhysicalObservation(e.target.value)}
                  className={selectClass}
                >
                  <option value="">Select status</option>
                  <option value="ok">OK</option>
                  <option value="not-ok">Not OK</option>
                </select>
              </div>
            </div>

            {physicalObservation === "not-ok" && (
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  List of Discrepancies
                </label>
                <textarea
                  value={discrepancies}
                  onChange={(e) => setDiscrepancies(e.target.value)}
                  placeholder="Describe the discrepancies found..."
                  className={`${textareaClass} min-h-[120px]`}
                />
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Inspection After Trial Run
                </label>
                <select
                  value={trialRun}
                  onChange={(e) => setTrialRun(e.target.value)}
                  className={selectClass}
                >
                  <option value="">Select option</option>
                  <option value="With Load">With Load</option>
                  <option value="Without Load">Without Load</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className={sectionClass}>
          <SectionHeader title="Remarks" />
          <div className="p-5">
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Enter any remarks..."
              className={`${textareaClass} min-h-[120px]`}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
