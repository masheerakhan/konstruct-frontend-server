import React from "react";
import { FileText } from "lucide-react";

const resolveMediaUrl = (path) => {
  if (!path) return null;

  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  const base =
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname === "localhost"
      ? "http://127.0.0.1:8001"
      : "https://konstruct.world";

  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
};

export default function AttachmentGallery({
  attachments = [],
  emptyLabel = "No attachments",
}) {
  if (!attachments.length) {
    return <p className="text-sm text-slate-400 italic">{emptyLabel}</p>;
  }

  const getUrl = (file) => resolveMediaUrl(file.file_url || file.file);

  const isImage = (file) => {
    const url = getUrl(file);
    return url && /\.(jpe?g|png|webp|gif)$/i.test(url.split("?")[0]);
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2" data-testid="attachment-gallery">
      {attachments.map((att, index) => {
        const url = getUrl(att);

        if (!url) return null;

        return (
          <a
            key={att.id || `${att.attachment_type || "attachment"}-${index}`}
            href={url}
            target="_blank"
            rel="noreferrer"
            className="relative group border border-slate-200 rounded-lg overflow-hidden bg-white block"
            data-testid={`attachment-${att.id || index}`}
          >
            {isImage(att) ? (
              <img
                src={url}
                alt={att.attachment_type}
                className="w-full h-24 object-cover"
              />
            ) : (
              <div className="w-full h-24 flex items-center justify-center bg-slate-50">
                <FileText className="w-8 h-8 text-slate-400" />
              </div>
            )}
            <div className="p-2 text-[11px] truncate text-slate-600 group-hover:text-blue-600">
              {String(att.attachment_type || "attachment").replace(/_/g, " ")}
            </div>
          </a>
        );
      })}
    </div>
  );
}
