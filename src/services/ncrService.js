import { NCR_STATUSES } from '../constants/ncrStatus';

const mockData = Array.from({ length: 45 }).map((_, i) => {
  const statuses = NCR_STATUSES.map(s => s.key);
  const status = statuses[i % statuses.length];
  
  return {
    id: `mock-ncr-${i + 1}`,
    ncr_no: `NCR-${2023000 + i}`,
    doc_no: `ADL/QA/NCR/${new Date().toISOString().slice(0, 7).replace("-", "")}`,
    related_to: ["Concrete Work", "Safety", "Material Inspection", "Electrical", "Plumbing"][i % 5],
    classification: i % 3 === 0 ? "major" : "minor",
    identification: `Non-conformance details for incident ${i+1}`,
    tower_id: ["t1", "t2", "t3"][i % 3],
    project_id: ["p1", "p2"][i % 2],
    root_cause: `Root cause analysis for ${i+1}`,
    correction: "Immediate correction applied",
    corrective_action: "Corrective action plan formulated.",
    preventive_action: "Preventive measures have been communicated.",
    follow_up_responsibility: "Site Engineer",
    verification_responsibility: "QA/QC Engineer",
    assigned_to: "1",
    target_date: new Date(Date.now() + (i - 10) * 86400000).toISOString().slice(0, 10),
    status: status,
    created_at: new Date(Date.now() - i * 86400000).toISOString(),
    created_by: "Current User"
  };
});

export const getNCRSummary = async () => {
  await new Promise(r => setTimeout(r, 400));
  const summary = { total: mockData.length };
  NCR_STATUSES.forEach(s => {
    summary[s.key] = mockData.filter(m => m.status === s.key).length;
  });
  return summary;
};

export const getNCRList = async ({ status = 'all', page = 1, pageSize = 15 }) => {
  await new Promise(r => setTimeout(r, 600));
  
  let filtered = mockData;
  if (status !== 'all') {
    filtered = filtered.filter(m => m.status === status);
  }
  
  filtered = [...filtered].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  
  const total = filtered.length;
  const start = (page - 1) * pageSize;
  const data = filtered.slice(start, start + pageSize);
  
  return {
    data,
    total,
    page,
    pageSize
  };
};
