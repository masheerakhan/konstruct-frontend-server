import { Plus, FileText, Paperclip } from "lucide-react";

/**
 * Lists MOM records for the current Construction Programs folder (data from DMS API via parent).
 */
export default function MomListPanel({
  records,
  loading = false,
  onCreate,
  onBackToPrograms,
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <button
            type="button"
            onClick={onBackToPrograms}
            className="text-sm font-medium text-primary hover:text-primary/80"
          >
            ← All programs
          </button>
          <h2 className="mt-2 text-lg font-semibold text-gray-900">
            Minutes of Meeting (MOM)
          </h2>
          <p className="text-sm text-gray-500">
            Open an existing record or create a new MOM.
          </p>
        </div>
        <button
          type="button"
          onClick={onCreate}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Create
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/80">
                <th className="px-4 py-3 text-left font-medium text-gray-600">
                  Meeting type
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">
                  Meeting date
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">
                  Tag
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">
                  <span className="inline-flex items-center gap-1">
                    <Paperclip
                      className="h-3.5 w-3.5 text-gray-500"
                      aria-hidden
                    />
                    Files
                  </span>
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">
                  Date & Time
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-12 text-center text-sm text-gray-500"
                  >
                    Loading…
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-12 text-center text-gray-500"
                  >
                    <FileText className="mx-auto mb-2 h-10 w-10 text-gray-300" />
                    No MOM created yet. Click <strong>Create</strong> to add
                    one.
                  </td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-gray-100 last:border-0"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {r.meetingType || r.title}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {r.meetingDateDisplay}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {r.basicTag ? r.basicTag : "—"}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-gray-600">
                      {typeof r.attachmentCount === "number"
                        ? r.attachmentCount
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {r.savedAtDisplay}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
