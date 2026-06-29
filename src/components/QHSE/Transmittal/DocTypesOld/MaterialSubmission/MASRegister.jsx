import { ClipboardList, FileText, FolderOpen } from "lucide-react";

const SAMPLE_MAS_ROWS = [
  {
    id: "sample-mas-1",
    ref_no: "HIPPL/YYY/PWP/QUA/MAS/001",
    description: "Concrete cover block",
    transmittal_no: "HIPPL/YYY/PWP/QUA/TML/001",
    brand: "Map Reality",
    supplier: "Map Spacer",
    revision: "R0",
    planned_submission_date: "2024-07-11",
    submitted_date: "2024-07-11",
    response_date: "2024-08-17",
    status: "B",
    project_name: "Sample Residential Project",
    created_at: "2026-04-21T10:00:00+0530",
    is_sample: true,
  },
  {
    id: "sample-mas-2",
    ref_no: "HIPPL/YYY/PWP/QUA/MAS/002",
    description: "Cement",
    transmittal_no: "HIPPL/YYY/PWP/QUA/TML/005",
    brand: "Ultratech",
    supplier: "Ultratech",
    revision: "R0",
    planned_submission_date: "2024-07-11",
    submitted_date: "2024-07-11",
    response_date: "2024-08-17",
    status: "B",
    project_name: "Sample Residential Project",
    created_at: "2026-04-22T10:00:00+0530",
    is_sample: true,
  },
];

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-GB");
}

export default function MASRegister({ folderName = "Material Submission (MAS)", documents = [] }) {
  const actualRows = Array.isArray(documents) ? documents : [];
  const rows = actualRows.length > 0 ? actualRows : SAMPLE_MAS_ROWS;
  const isUsingSampleRows = actualRows.length === 0;

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-gray-200 bg-gradient-to-r from-orange-50 via-white to-amber-50 p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary shadow-sm ring-1 ring-orange-100">
              <ClipboardList className="h-3.5 w-3.5" />
              Material Submission Register
            </div>
            <h2 className="mt-3 text-xl font-semibold text-gray-900">{folderName}</h2>
            <p className="mt-1 text-sm text-gray-600">
              Register of material submission transmittals created in this folder.
            </p>
          </div>
          <div className="rounded-2xl border border-orange-100 bg-white px-4 py-3 text-right shadow-sm">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              Total Forms
            </div>
            <div className="mt-1 text-2xl font-semibold text-gray-900">{rows.length}</div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
            <FolderOpen className="h-4 w-4 text-primary" />
            <span>Created Material Submissions</span>
          </div>
          <div className="text-xs text-gray-500">
            {isUsingSampleRows ? "Showing sample preview rows" : "Newest records already appear first"}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[1400px] w-full text-sm">
            <thead>
              <tr className="bg-gray-50/80 text-left">
                <th className="px-4 py-3 font-semibold text-gray-600">Sr. No</th>
                <th className="px-4 py-3 font-semibold text-gray-600">MAS No.</th>
                <th className="px-4 py-3 font-semibold text-gray-600">MAS Description</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Transmittal Number</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Brand</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Supplier</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Rev</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Planned Date of Submission</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Date of Submission</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Date of Response</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((doc, index) => (
                <tr
                  key={doc.id || `${doc.ref_no || doc.name}-${index}`}
                  className="border-t border-gray-100 hover:bg-orange-50/30"
                >
                  <td className="px-4 py-3 text-gray-700">{index + 1}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-800">
                    {doc.ref_no || doc.refNo || "-"}
                  </td>
                  <td className="px-4 py-3 text-gray-800">
                    {doc.description || doc.materialDescription || doc.name || "Material Submission"}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-700">
                    {doc.transmittal_no || doc.transmittalRefNo || "-"}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{doc.brand || "-"}</td>
                  <td className="px-4 py-3 text-gray-700">{doc.supplier || "-"}</td>
                  <td className="px-4 py-3 text-center text-gray-700">
                    {doc.revision || doc.rev || "R0"}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {formatDate(doc.planned_submission_date || doc.plannedSubmissionDate)}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {formatDate(doc.submitted_date || doc.submittedDate)}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {formatDate(doc.response_date || doc.responseDate)}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-700">
                    {doc.status || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {isUsingSampleRows && (
          <div className="border-t border-amber-100 bg-amber-50 px-5 py-3 text-xs text-amber-700">
            Sample preview data is showing for layout only. Real submitted Material Submission forms will replace these rows automatically.
          </div>
        )}

        {rows.length === 0 && (
          <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
            <div className="rounded-full bg-orange-50 p-3 text-primary">
              <FileText className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-gray-900">No material submission forms yet</h3>
            <p className="mt-1 max-w-md text-sm text-gray-500">
              Once a Material Submission transmittal is submitted inside this folder, it will appear here as a register entry.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
