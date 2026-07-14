import React, { useState } from "react";
import { Upload, X, FileText, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export default function FileUpload({
  value = [],
  onChange,
  accept = "image/*,application/pdf",
  multiple = true,
  testId = "file-upload",
}) {
  const [uploading, setUploading] = useState(false);

  const onFiles = async (files) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    const newItems = [];
    for (const f of files) {
      if (f.size > 10 * 1024 * 1024) {
        toast.error(`${f.name}: exceeds 10MB`);
        continue;
      }

      // Mock upload processing
      try {
        await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate network delay
        const isImage = f.type.startsWith("image/");
        const mockUrl = isImage ? URL.createObjectURL(f) : "";
        newItems.push({
          id: Math.random().toString(36).substring(7),
          filename: f.name,
          kind: isImage ? "image" : "document",
          url: mockUrl,
          file: f,
        });
      } catch (e) {
        toast.error("Upload failed");
      }
    }
    setUploading(false);
    onChange && onChange([...(value || []), ...newItems]);
  };

  const remove = (id) =>
    onChange && onChange((value || []).filter((f) => f.id !== id));

  return (
    <div className="space-y-3" data-testid={testId}>
      <label className="block cursor-pointer">
        <div className="border-2 border-dashed border-slate-300 rounded-lg bg-slate-50 hover:bg-slate-100 hover:border-blue-400 transition-colors p-6 text-center">
          {uploading ? (
            <Loader2 className="w-6 h-6 mx-auto text-blue-500 animate-spin" />
          ) : (
            <Upload className="w-6 h-6 mx-auto text-slate-500" />
          )}
          <div className="text-sm font-medium text-slate-700 mt-2">
            Click to upload or drag &amp; drop
          </div>
          <div className="text-xs text-slate-500 mt-1">
            JPG, PNG, WebP, PDF — up to 10MB
          </div>
        </div>
        <input
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          data-testid={`${testId}-input`}
          onChange={(e) => onFiles(e.target.files)}
        />
      </label>
      {(value || []).length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {(value || []).map((f) => (
            <div
              key={f.id}
              className="relative group border border-slate-200 rounded-lg overflow-hidden bg-white"
            >
              {f.kind === "image" ? (
                <img
                  src={f.url}
                  alt={f.filename}
                  className="w-full h-24 object-cover"
                />
              ) : (
                <div className="w-full h-24 flex items-center justify-center bg-slate-50">
                  <FileText className="w-8 h-8 text-slate-500" />
                </div>
              )}
              <div className="p-2 text-[11px] truncate text-slate-600">
                {f.filename}
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  remove(f.id);
                }}
                data-testid={`${testId}-remove-${f.id}`}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-white/90 shadow flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-slate-700 hover:bg-slate-100"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
