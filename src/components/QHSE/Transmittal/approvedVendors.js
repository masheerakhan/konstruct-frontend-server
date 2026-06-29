import { formatDisplayDate } from "../../../utils/dateFormatter";

function newId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export const approvedVendorList = [
  {
    srNo: 1,
    product: "Chloropyriphos",
    vendors: [
      "Nocil",
      "Kanoria",
      "Kitnesa",
      "Dhawan",
      "Montari",
      "Cynamide",
      "Dow Agro Sciences",
    ],
  },
  {
    srNo: 2,
    product: "Cement - OPC 43/53 Grade, PPC",
    vendors: ["ACC", "Ultratech", "Lafarge"],
  },
  { srNo: 3, product: "White Cement", vendors: ["Birla", "JK White Cement"] },
  {
    srNo: 4,
    product: "Reinforcement Steel (rolled)",
    vendors: ["SAIL", "RINL", "JSW", "TISCO"],
  },
  { srNo: 5, product: "Structural Steel", vendors: ["SAI  L", "RINL", "JSW"] },
  {
    srNo: 6,
    product: "Ready Mix Concrete",
    vendors: ["RMC Readymix", "Lafarge", "Ultratech", "ACC"],
  },
  {
    srNo: 7,
    product: "Chemicals, Admixtures, Waterproofing Compounds",
    vendors: ["Fosroc", "BASF", "Sika", "Pidilite"],
  },
  {
    srNo: 8,
    product: "Aluminum Sections",
    vendors: ["Jindal", "Balco", "Hindalco"],
  },
  {
    srNo: 9,
    product: "PP Fiber",
    vendors: [
      "Reliance",
      "Fibermesh",
      "Duracem",
      "Becard",
      "Eurofaster",
      "Cetex",
    ],
  },
  {
    srNo: 10,
    product: "Plaster Mesh, Cover Block",
    vendors: ["Arpitha Exports", "Elmich"],
  },
  {
    srNo: 11,
    product: "Mechanical and Chemical Anchor Fasteners",
    vendors: ["Fischer", "HILTI", "Bosch"],
  },
  {
    srNo: 12,
    product: "Water Stops",
    vendors: ["Hydrotight of Water Seal India Pvt Ltd"],
  },
  { srNo: 13, product: "Wall Putty", vendors: ["Birla White", "JK White"] },
  {
    srNo: 14,
    product: "Galvalume Sheets",
    vendors: ["TATA Bluescope", "JSW Steels"],
  },
  {
    srNo: 15,
    product: "Rockwool / Glass Wool Insulation",
    vendors: ["Twiga", "Owens Corning", "Rockwool"],
  },
  {
    srNo: 16,
    product: "Expansion Filler Board",
    vendors: ["Supreme Industries", "Fosroc"],
  },
  {
    srNo: 17,
    product: "Polycarbonate Sheets",
    vendors: ["Sabic/GE", "Palram", "Danpalon", "Dow", "Owens Corning"],
  },
  {
    srNo: 18,
    product: "Insulation Boards (Extruded Polystyrene)",
    vendors: ["H & R Johnson"],
  },
  {
    srNo: 19,
    product: "Ceramic / Glazed / Vitrified Tiles",
    vendors: ["Kajaria", "Nitco", "Somany", "Orient", "Khodiyar"],
  },
  {
    srNo: 20,
    product: "Acid Resistant Tile",
    vendors: ["Rustile", "AArcoy", "H & R Johnson", "Basant Beton"],
  },
  {
    srNo: 21,
    product: "Interlock Pavers / Cobble Stone",
    vendors: ["Shobha", "Nitco", "Pavers India", "Wonderfloor"],
  },
  { srNo: 22, product: "Vinyl Flooring", vendors: ["Armstrong", "RMG"] },
  { srNo: 23, product: "False Flooring", vendors: ["Comfloor"] },
  {
    srNo: 24,
    product: "Steel Doors",
    vendors: ["Shakti Hormann", "Met-Dor", "Signum"],
  },
  {
    srNo: 25,
    product: "Fire Doors",
    vendors: ["Shakti Hormann", "Met-Dor", "Signum", "Green Ply", "Euro"],
  },
  {
    srNo: 26,
    product: "Commercial Board, Ply, Flush Door",
    vendors: [
      "Bhutan Board",
      "Grenlam",
      "Kitply",
      "Century",
      "Anchor",
      "Novapan",
    ],
  },
  {
    srNo: 27,
    product: "Prelam Particle Board",
    vendors: ["Kitply", "Formica", "Greenlam"],
  },
  {
    srNo: 28,
    product: "Plastic Laminates",
    vendors: ["Formica", "Bakelite Hylam"],
  },
  { srNo: 29, product: "Wood Adhesives", vendors: ["Fevicol", "Pidilite"] },
  {
    srNo: 30,
    product: "Dry Wall Partition",
    vendors: ["Gypsteel", "Metecno", "Saint Gobain"],
  },
  { srNo: 31, product: "Gypsum Board", vendors: ["Lafarge", "Boral"] },
  {
    srNo: 32,
    product: "Cementitious Sheets",
    vendors: ["Bison", "Hyderabad Industries"],
  },
  {
    srNo: 33,
    product: "Ceiling Systems",
    vendors: ["Armstrong", "Saint Gobain"],
  },
  {
    srNo: 34,
    product: "Hardware of Door and Windows",
    vendors: ["Dorma", "Dorset", "Ozone", "Nirmal Automation"],
  },
  {
    srNo: 35,
    product: "Motorized Rolling Shutters",
    vendors: ["Avvians", "Nivha", "Gandhi Automation", "Ditech"],
  },
  {
    srNo: 36,
    product: "Sectional Doors",
    vendors: [
      "Gandhi Automation",
      "Shakti Hormann",
      "Kelly India",
      "Rite Hite",
    ],
  },
  {
    srNo: 37,
    product: "Glazing Works",
    vendors: ["Saint Gobain", "Asahi Float", "TATA"],
  },
  {
    srNo: 38,
    product: "G.I. Pipe",
    vendors: ["Jindal", "Zenith", "Metaflex", "Supreme"],
  },
  {
    srNo: 39,
    product: "UPVC / PVC Pipes",
    vendors: ["Finolex", "Jain", "Astral"],
  },
  { srNo: 40, product: "C.I. Pipes", vendors: ["Neo"] },
  { srNo: 41, product: "C.I. Chamber Covers", vendors: ["Neco"] },
  {
    srNo: 42,
    product: "PVC Water Tank",
    vendors: ["Sintex", "Supreme", "Parryware"],
  },
  { srNo: 43, product: "Sanitary Ware", vendors: ["Hindware", "TOTO"] },
  {
    srNo: 44,
    product: "Sanitary Fittings",
    vendors: ["Jaguar", "TOTO", "Hindware"],
  },
  { srNo: 45, product: "Steel Sinks", vendors: ["Nirali", "Asian Paints"] },
  {
    srNo: 46,
    product: "Paints (Acrylic / Enamel / Cement)",
    vendors: ["Jotun", "Nerolac", "ICI-Dulux"],
  },
  { srNo: 47, product: "Bitumen", vendors: ["IOCL", "HP", "BPCL"] },
];

export const projectList = [
  { name: "Horizon Industrial Park", projectNo: "-" },
  { name: "Horizon Industrial Park Phase 2", projectNo: "HIP-002" },
  { name: "Associated Projects Infra", projectNo: "API-001" },
];

export const documentTypes = [
  "Project Plans",
  "Material Submittal",
  "Method Statement",
  "Technical Submittal",
  "Pre-Qualification",
  "Reports",
  "Manuals",
  "Sample / Catalog",
  "Calculations",
  "Audit Report",
  "Test Reports",
  "Calibration Certificate",
  "Other Certificates",
  "Organization Chart",
  "Proposals",
  "Registers",
  "Drawings",
  "Design Mix",
  "NCR",
  "RFI",
  "Legal Documents",
  "Other Documents",
];

export const alternativeProposalReasons = [
  "The Approved Brands are not available",
  "Price is not Compatible",
  "Availability issue",
  "Quality issues",
  "Supply issue",
  "Other",
];

export function createComplianceRow(slNo) {
  return {
    id: newId(),
    slNo,
    technicalRequirement: "",
    limits: "",
    valuesPerTDS: "",
    valuesPerMTC: "",
    status: "CP",
    contractorsResponse: "",
  };
}

export function createComplianceTable() {
  return {
    id: newId(),
    documentDescription: "",
    rows: [
      createComplianceRow(1),
      createComplianceRow(2),
      createComplianceRow(3),
    ],
    attachedFile: null,
  };
}

export const checklistItems = [
  {
    slNo: 1,
    description:
      "Company Profile, Technical Data Sheet (TDS) / Product Catalogue with All Accessories & Complete System",
    remarks:
      "If a Complete System / Assembly is proposed, then a List (TDS & Test Reports) of All Accessories shall be attached.",
  },
  {
    slNo: 2,
    description: "Approved Vendor/Brand/Make List (Highlighted)",
    remarks: "",
  },
  {
    slNo: 3,
    description: "Project Specification, BOQ, Drawings",
    remarks: "",
  },
  {
    slNo: 4,
    description: "MTC or 3rd Party Test Report",
    remarks: "",
  },
  {
    slNo: 5,
    description:
      "Compliance Statement against WO/Specification/BOQ, Relevant Indian & International Standards Codes",
    remarks: "",
  },
];

export const checklistItem3Options = [
  "Project Specification",
  "BOQ",
  "Drawings",
];

/** Normalize a checklist row's uploads to File[] (supports legacy single `File`). */
export function getChecklistFilesList(entry) {
  if (entry == null) return [];
  if (Array.isArray(entry)) return entry.filter((f) => f instanceof File);
  if (entry instanceof File) return [entry];
  return [];
}

export const DEFAULT_MAS_DOCUMENT_NO = "HIPPL/API/HLP/QUA/MAS/01";

/** MAS reference format for “Full system with all accessories” checklist (same value shown on every line item row). */
export const DEFAULT_FULL_SYSTEM_MAS_DOCUMENT_NO = "HIPPL/B&R/TIPPL/QUA/MAS/01";

/** Default document no. shown in Submittal Details when Type of document is Project Plans (PQP). */
export const DEFAULT_PQP_DOCUMENT_NO = "HIPPL/API/HLP/QUA/PQP/01";
export const DEFAULT_PQD_DOCUMENT_NO = "HIPPL/API/HLP/QUA/PQD/01";
/** Default document no. when Type of document is Design Mix (DMP / concrete design mix submissions). */
export const DEFAULT_DMP_DOCUMENT_NO = "HIPPL/API/HLP/QUA/DMP/01";
/** Default document no. shown for Method Statement (WMS). */
export const DEFAULT_WMS_DOCUMENT_NO = "HIPPL/API/HLP/QUA/WMS/01";
// Default document no. shown for Test Project
export const DEFAULT_TEST_REPORT_DOCUMENT_NO = "HIPPL/API/HLP/QUA/TR/01";
export const DEFAULT_CALIBRATION_CERTIFICATE_DOCUMENT_NO =
  "HIPPL/API/HLP/QUA/CC/01";

/** Method Statement — reference row type (dropdown). */
export const WMS_REFERENCE_TYPE_OPTIONS = [
  { value: "specification", label: "Specification" },
  { value: "boq", label: "BOQ" },
  { value: "ia_score", label: "IA Score" },
  { value: "other", label: "Other" },
];

export function createWmsReferenceRow(overrides = {}) {
  return {
    id: newId(),
    refType: "boq",
    sectionClass: "",
    files: [],
    ...overrides,
  };
}

export function createDefaultWmsReferences() {
  return [createWmsReferenceRow()];
}

/** WMS — construction sequence blocks (text + optional file attachments). */
export function createDefaultWmsConstructionSequence() {
  return {
    preInstall: { text: "", files: [] },
    during: { text: "", files: [] },
    post: { text: "", files: [] },
  };
}

/** WMS — fixed annexure rows with file-only uploads. */
export function createDefaultWmsAnnexures() {
  return {
    annexure1: { files: [] },
    annexure2: { files: [] },
    annexure3: { files: [] },
    annexure4: { files: [] },
  };
}

/** Files attached to one WMS construction-sequence block. */
export function getWmsConstructionBlockFiles(block) {
  if (!block || typeof block !== "object") return [];
  if (Array.isArray(block.files))
    return block.files.filter((f) => f instanceof File);
  return [];
}

/** Files attached to one WMS annexure row. */
export function getWmsAnnexureFiles(annexureRow) {
  if (!annexureRow || typeof annexureRow !== "object") return [];
  if (Array.isArray(annexureRow.files)) {
    return annexureRow.files.filter((f) => f instanceof File);
  }
  return [];
}

/** Files attached to one WMS reference card. */
export function getWmsReferenceRowFiles(row) {
  if (!row || typeof row !== "object") return [];
  if (Array.isArray(row.files))
    return row.files.filter((f) => f instanceof File);
  if (row.file instanceof File) return [row.file];
  return [];
}

/** Fixed register rows for PQP (user can add more via “Add annexure row”). */
export const PQP_DEFAULT_DOCUMENT_NAMES = [
  "Project Quality Plan",
  "Project Construction, QC Lab & Curing Water Arrangement Plan",
  "Project HSE Plan",
  "Project Logistic Plan",
  // "Project Trafic Management Plan",
  // "Project Waste Management Plan",
  // "Project Plant & Equipment Plan",
  // "Project Fire Safety Plan",
  // "Project On-site Welding Plan",
  // "Project Dust Mitigation Plan",
  // "Project Lifting Plan",
  // "Project Labour Camp Plan",
  // "Project Natural Calamity, Monsoon Preparedness Plan",
  // "Project Summer Preparedness Plan",
  // "Project Emergency Preparedness & Response Plan",
  // "Project Lightening Arester Plan",
];

export const PQP_MIN_ROW_COUNT = PQP_DEFAULT_DOCUMENT_NAMES.length;

export function createPqpAnnexRow(overrides = {}) {
  return { id: newId(), documentName: "", files: [], ...overrides };
}

export function createDefaultPqpAnnexRows() {
  return Array.from({ length: PQP_MIN_ROW_COUNT }, () => createPqpAnnexRow());
}

/** Files for a PQP row (`files[]` or legacy single `file`). */
export function getPqpRowFiles(row) {
  if (!row || typeof row !== "object") return [];
  if (Array.isArray(row.files)) {
    return row.files.filter((f) => f instanceof File);
  }
  if (row.file instanceof File) return [row.file];
  return [];
}

/** Register / PDF document name: first `PQP_MIN_ROW_COUNT` rows use fixed titles; added rows use `documentName`. */
export function getPqpRowDocumentLabel(row, index) {
  if (index < PQP_MIN_ROW_COUNT) {
    return PQP_DEFAULT_DOCUMENT_NAMES[index] || "";
  }
  const name = (
    row?.documentName != null ? String(row.documentName) : ""
  ).trim();
  return name || "—";
}

/** Ensure at least `PQP_MIN_ROW_COUNT` rows; merge legacy `file` into `files`. */
export function normalizePqpAnnexRows(rows) {
  if (!Array.isArray(rows) || rows.length === 0)
    return createDefaultPqpAnnexRows();
  const mapped = rows.map((r, i) => {
    const id = r.id || newId();
    const rawName = r.documentName != null ? String(r.documentName) : "";
    const documentName = i < PQP_MIN_ROW_COUNT ? "" : rawName.trim();
    let files = [];
    if (Array.isArray(r.files)) {
      files = r.files.filter((f) => f instanceof File);
    } else if (r.file instanceof File) {
      files = [r.file];
    }
    return { id, documentName, files };
  });
  while (mapped.length < PQP_MIN_ROW_COUNT) {
    mapped.push(createPqpAnnexRow());
  }
  return mapped;
}

/** Upload slots on the full-system checklist row (compliance is optional, added per row via “Add compliance statement”). */
export const FULL_SYSTEM_UPLOAD_KEYS = [
  "technicalData",
  "manufacturerTest",
  "thirdPartyTest",
];

/** Compliance tables attached to one full-system checklist row (legacy `complianceTable` supported). */
export function getFullSystemRowComplianceTables(row) {
  if (!row || typeof row !== "object") return [];
  if (Array.isArray(row.complianceTables) && row.complianceTables.length > 0) {
    return row.complianceTables.filter((t) => t && typeof t === "object");
  }
  if (row.complianceTable && typeof row.complianceTable === "object") {
    return [row.complianceTable];
  }
  return [];
}

export function createFullSystemChecklistRow() {
  return {
    id: newId(),
    boq: "",
    materialDescription: "",
    approvedBrand: "",
    proposedVendors: "",
    remark: "",
    statusFiles: {
      technicalData: null,
      manufacturerTest: null,
      thirdPartyTest: null,
    },
    complianceTables: [],
  };
}

export function createDefaultFullSystemChecklist() {
  return {
    rows: [createFullSystemChecklistRow(), createFullSystemChecklistRow()],
  };
}

/** Normalize legacy single-object fullSystemChecklist or missing shape to `{ rows: [...] }`. */
export function normalizeFullSystemChecklist(fc) {
  const emptyStatusFiles = () => ({
    technicalData: null,
    manufacturerTest: null,
    thirdPartyTest: null,
  });

  if (!fc || typeof fc !== "object") {
    return createDefaultFullSystemChecklist();
  }

  if (Array.isArray(fc.rows) && fc.rows.length > 0) {
    return {
      rows: fc.rows.map((r) => {
        const mergedSf = {
          ...emptyStatusFiles(),
          ...(r.statusFiles && typeof r.statusFiles === "object"
            ? r.statusFiles
            : {}),
        };
        delete mergedSf.complianceStatement;
        let complianceTables = [];
        if (Array.isArray(r.complianceTables)) {
          complianceTables = r.complianceTables
            .filter((t) => t && typeof t === "object")
            .map((t) => ({ ...t }));
        } else if (r.complianceTable && typeof r.complianceTable === "object") {
          complianceTables = [{ ...r.complianceTable }];
        }
        return {
          id: r.id || newId(),
          boq: r.boq ?? "",
          materialDescription: r.materialDescription ?? "",
          approvedBrand: r.approvedBrand ?? "",
          proposedVendors: r.proposedVendors ?? "",
          remark: r.remark ?? "",
          statusFiles: mergedSf,
          complianceTables,
        };
      }),
    };
  }

  const base = emptyStatusFiles();
  if (fc.statusFiles && typeof fc.statusFiles === "object") {
    FULL_SYSTEM_UPLOAD_KEYS.forEach((k) => {
      base[k] = fc.statusFiles[k] !== undefined ? fc.statusFiles[k] : null;
    });
  }

  return {
    rows: [
      {
        id: newId(),
        boq: fc.boq ?? "",
        materialDescription: fc.materialDescription ?? "",
        approvedBrand: fc.approvedBrand ?? "",
        proposedVendors: fc.proposedVendors ?? "",
        remark: fc.remark ?? "",
        statusFiles: { ...base },
        complianceTables: [],
      },
      createFullSystemChecklistRow(),
    ],
  };
}

export function getDefaultMaterialSubmittalDescription(product, brand) {
  if (!product) return "";
  return `MAS for ${product}${brand ? ` (Make: ${brand})` : ""}`;
}

export function getDescriptionLabelForDocumentType(documentType) {
  const dt = String(documentType || "").trim();
  if (!dt) return "Description";
  if (dt === "Material Submittal") return "Description of Material Submission";
  if (dt === "Project Plans") return "Description of Project Plan";
  if (dt === "Pre-Qualification") return "Description of Pre Qualification";
  if (dt === "Design Mix") return "Description of Design Mix";
  if (dt === "Method Statement") return "Description of Method Statement";
  if (documentType === "Test Reports") return "Description of Test Report";
  return `Description of ${dt}`;
}

function generateTransmittalRef() {
  const num = String(Math.floor(Math.random() * 900) + 100);
  return `HIPPL/API/HLP/PPL/TMT/${num}`;
}

function generateWorkOrderNo() {
  const now = new Date();
  const fy1 =
    now.getMonth() >= 3
      ? now.getFullYear() % 100
      : (now.getFullYear() - 1) % 100;
  const fy2 = fy1 + 1;
  const seq = Math.floor(Math.random() * 9) + 1;
  return `WO/HLPBLDF/${fy1}-${fy2}/${seq}/1`;
}

export function createDefaultFormData() {
  const defaultProject = projectList[0];
  return {
    transmittalRefNo: generateTransmittalRef(),
    date: formatDisplayDate(new Date()),
    projectName: defaultProject?.name ?? "Horizon Industrial Park",
    projectNo: defaultProject?.projectNo ?? "",
    blockNo: "",
    location: "Fetching location…",
    workOrderNo: generateWorkOrderNo(),
    documentType: "",
    materialType: "",
    approvalType: "",
    product: "",
    brand: "",
    materialRefNo: "",
    materialDescription: "",
    materialRemarks: "",
    areaOfApplication: "",
    makeStatus: "",
    checklistRemarks: {},
    checklistFiles: {},
    checklistAlternativeReasons: {},
    checklistItem3Option: "Project Specification",
    checklistItem3SectionClass: "",
    fullSystemChecklist: createDefaultFullSystemChecklist(),
    transmittedFor: "Approval",
    specReference: "",
    complianceTables: [],
    pqpAnnexRows: createDefaultPqpAnnexRows(),
    pqdChecklistType: "",
    pqdChecklistRows: [],
    dmpChecklistRows: [],
    wmsScopeObjective: "",
    wmsReferences: createDefaultWmsReferences(),
    wmsConstructionSequence: createDefaultWmsConstructionSequence(),
    wmsAnnexures: createDefaultWmsAnnexures(),
    testReportType: "",
    inhouseTestReportType: "",
    calibrationCertificateRows: [],
  };
}

export const defaultFormData = createDefaultFormData();

export const TEST_REPORT_TYPE_OPTIONS = [
  { value: "Inhouse Test Report", label: "Inhouse Test Report" },
  { value: "Third Party Test Report", label: "Third Party Test Report" },
];

export const INHOUSE_TEST_REPORT_OPTIONS = [
  { value: "Core Cutter Method", label: "Core Cutter Method" },
  { value: "Sand Replacement Method", label: "Sand Replacement Method" },
];
