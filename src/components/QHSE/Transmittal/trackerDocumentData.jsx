export const DUMMY_ALL_DOCUMENT_TRACKER_ROWS = [
  // Project Plans / PQP
  {
    id: "pqp-1",
    sr_no: 1,
    document_type: "Project Plans",
    description: "Project Quality Plan",
  },
  {
    id: "pqp-2",
    sr_no: 2,
    document_type: "Project Plans",
    description: "Inspection and Test Plan",
  },
  {
    id: "pqp-3",
    sr_no: 3,
    document_type: "Project Plans",
    description: "Quality Assurance Plan",
  },

  // Material Submittal / MAS
  {
    id: "mas-1",
    sr_no: 1,
    document_type: "Material Submittal",
    description: "Cement Material Submittal",
  },
  {
    id: "mas-2",
    sr_no: 2,
    document_type: "Material Submittal",
    description: "Steel Reinforcement Material Submittal",
  },
  {
    id: "mas-3",
    sr_no: 3,
    document_type: "Material Submittal",
    description: "Waterproofing Material Submittal",
  },

  // Method Statement / WMS
  {
    id: "wms-1",
    sr_no: 1,
    document_type: "Method Statement",
    description: "Method Statement for Concreting Works",
  },
  {
    id: "wms-2",
    sr_no: 2,
    document_type: "Method Statement",
    description: "Method Statement for Waterproofing Works",
  },
  {
    id: "wms-3",
    sr_no: 3,
    document_type: "Method Statement",
    description: "Method Statement for Blockwork",
  },

  // Pre-Qualification / PQD
  {
    id: "pqd-1",
    sr_no: 1,
    document_type: "Pre-Qualification",
    description: "Vendor Pre-Qualification Submission",
  },
  {
    id: "pqd-2",
    sr_no: 2,
    document_type: "Pre-Qualification",
    description: "Specialist Agency Pre-Qualification Submission",
  },

  // Design Mix / DMP
  {
    id: "dmp-1",
    sr_no: 1,
    document_type: "Design Mix",
    description: "M25 Concrete Design Mix Proposal",
  },
  {
    id: "dmp-2",
    sr_no: 2,
    document_type: "Design Mix",
    description: "M30 Concrete Design Mix Proposal",
  },
  {
    id: "dmp-3",
    sr_no: 3,
    document_type: "Design Mix",
    description: "M40 Concrete Design Mix Proposal",
  },

  // Test Reports
  {
    id: "test-1",
    sr_no: 1,
    document_type: "Test Reports",
    description: "In-House Cube Test Report",
  },
  {
    id: "test-2",
    sr_no: 2,
    document_type: "Test Reports",
    description: "Third Party Material Test Report",
  },

  // RFI
  {
    id: "rfi-1",
    sr_no: 1,
    document_type: "Request for Information",
    description: "RFI for Drawing Clarification",
  },

  // DCP
  {
    id: "dcp-1",
    sr_no: 1,
    document_type: "Document Change Proposal",
    description: "Document Change Proposal for Revised Drawing",
  },
];

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[-_/()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const DOCUMENT_TYPE_ALIASES = {
  "Project Plans": [
    "project plans",
    "project plan",
    "project quality plan",
    "pqp",
  ],
  "Material Submittal": [
    "material submittal",
    "material submission",
    "material submission mas",
    "mas",
  ],
  "Method Statement": [
    "method statement",
    "work method statement",
    "work method statements",
    "wms",
  ],
  "Pre-Qualification": [
    "pre qualification",
    "prequalification",
    "prequalification submission",
    "prequalification document submission",
    "pqd",
  ],
  "Design Mix": [
    "design mix",
    "design mix proposal",
    "concrete design mix submissions",
    "dmp",
  ],
  "Test Reports": [
    "test reports",
    "in house test reports",
    "third party test reports",
    "mtp",
    "mtr",
  ],
  "Request for Information": [
    "request for information",
    "rfi",
  ],
  "Document Change Proposal": [
    "document change proposal",
    "dcp",
  ],
};

export function canonicalDocumentType(value) {
  const normalized = normalizeText(value);

  for (const [canonical, aliases] of Object.entries(DOCUMENT_TYPE_ALIASES)) {
    if (aliases.some((alias) => normalizeText(alias) === normalized)) {
      return canonical;
    }
  }

  return String(value || "").trim();
}

export function getTrackerDocumentType(row) {
  return (
    row?.document_type ||
    row?.documentType ||
    row?.type_of_document ||
    row?.typeOfDocument ||
    row?.doc_type ||
    row?.docType ||
    ""
  );
}

export function getTrackerDescription(row) {
  return (
    row?.description ||
    row?.description_of_submission ||
    row?.descriptionOfSubmission ||
    row?.materialDescription ||
    row?.name ||
    ""
  );
}

export function filterTrackerRowsByDocumentType(rows, documentType) {
  const currentType = canonicalDocumentType(documentType);

  return (Array.isArray(rows) ? rows : []).filter((row) => {
    const rowType = canonicalDocumentType(getTrackerDocumentType(row));
    return rowType === currentType;
  });
}