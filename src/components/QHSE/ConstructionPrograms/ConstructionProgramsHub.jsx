import { FileText } from "lucide-react";

/**
 * Landing view inside the "Construction Programs" DMS folder.
 */
export default function ConstructionProgramsHub({ onOpenMom }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900">Construction programs</h2>
      <p className="mt-1 text-sm text-gray-500">Choose a program to open.</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <button
          type="button"
          onClick={onOpenMom}
          className="flex flex-col items-start rounded-lg border border-gray-200 bg-gray-50/80 p-4 text-left transition hover:border-primary hover:bg-primary/5"
        >
          <FileText className="mb-2 h-8 w-8 text-primary" aria-hidden />
          <span className="font-medium text-gray-900">Minutes of Meeting</span>
          <span className="mt-1 text-xs text-gray-500">Create and track MOM records</span>
        </button>
      </div>
    </div>
  );
}
