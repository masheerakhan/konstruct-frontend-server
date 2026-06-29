import { ClipboardList, FileText, FolderOpen } from "lucide-react";
import { formatDisplayDate } from "../../../../../utils/dateFormatter";

const SAMPLE_WMS_ROWS = [
  {
    id: "sample-wms-1",
    ref_no: "HIPL-XXX-YYY-QUA-WMS-001",
    description: "PCC Work",
    transmittal_no: "HIPPL-XXX-YYY-PLA-TML-008",
    final_code: "F",
    revision: "R0",
    planned_submission_date: "2024-07-08",
    submitted_to_pmc_date: "2024-07-11",
    feedback_received_date: "2024-08-24",
    status: "B",
    remarks: "-",
    created_at: "2026-04-21T10:00:00+0530",
    is_sample: true,
  },
  {
    id: "sample-wms-2",
    ref_no: "HIPL-XXX-YYY-QUA-WMS-002",
    description: "Anti-Termite Treatment Work",
    transmittal_no: "HIPPL-XXX-YYY-PLA-TML-012",
    final_code: "F",
    revision: "R0",
    planned_submission_date: "2024-07-11",
    submitted_to_pmc_date: "2024-07-14",
    feedback_received_date: "2024-08-17",
    status: "B",
    remarks: "-",
    created_at: "2026-04-22T10:00:00+0530",
    is_sample: true,
  },
];

function formatDate(value) {
  return formatDisplayDate(value);
}

export default function WMSRegister({
  folderName = "Work Method Statements (WMS,ITP Checklist & HIRA)",
  documents = [],
}) {
  const actualRows = Array.isArray(documents) ? documents : [];
  const rows = actualRows.length > 0 ? actualRows : SAMPLE_WMS_ROWS;
  const isUsingSampleRows = actualRows.length === 0;

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-gray-200 bg-gradient-to-r from-orange-50 via-white to-amber-50 p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary shadow-sm ring-1 ring-orange-100">
              <ClipboardList className="h-3.5 w-3.5" />
              WMS Register
            </div>
            <h2 className="mt-3 text-xl font-semibold text-gray-900">{folderName}</h2>
            <p className="mt-1 text-sm text-gray-600">
              Register of work method statement transmittals created in this folder.
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
            <span>Created Work Method Statements</span>
          </div>
          <div className="text-xs text-gray-500">
            {isUsingSampleRows ? "Showing sample preview rows" : "Newest records already appear first"}
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
            <div className="rounded-full bg-orange-50 p-3 text-primary">
              <FileText className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-gray-900">No WMS forms yet</h3>
            <p className="mt-1 max-w-md text-sm text-gray-500">
              Once a Work Method Statement transmittal is submitted inside this folder, it will appear here as a register entry.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[1450px] w-full text-sm">
              <thead>
                <tr className="bg-gray-50/80 text-left">
                  <th className="px-4 py-3 font-semibold text-gray-600">SL.NO</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">WMS Reference Number</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">WMS Description</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">Transmittal Number</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">Final</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">Rev</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">Planned Submission Date</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">Date Submitted to PMC</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">Feedback Date Received</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">Status</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">Remarks</th>
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
                      {doc.description || doc.materialDescription || doc.name || "Work Method Statement"}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-700">
                      {doc.transmittal_no || doc.transmittalRefNo || "-"}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-700">
                      {doc.final_code || doc.finalCode || "F"}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-700">
                      {doc.revision || doc.rev || "R0"}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {formatDate(doc.planned_submission_date || doc.plannedSubmissionDate)}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {formatDate(doc.submitted_to_pmc_date || doc.submittedToPmcDate)}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {formatDate(doc.feedback_received_date || doc.feedbackReceivedDate)}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-700">
                      {doc.status || "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{doc.remarks || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {isUsingSampleRows && (
          <div className="border-t border-amber-100 bg-amber-50 px-5 py-3 text-xs text-amber-700">
            Sample preview data is showing for layout only. Real submitted WMS forms will replace these rows automatically.
          </div>
        )}
      </div>
    </div>
  );
}
