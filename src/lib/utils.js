import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const resolveMediaUrl = (path) => {
  if (!path) return null;

  // Already an absolute URL
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  const base =
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname === "localhost"
      ? "http://127.0.0.1:8001"
      : "https://konstruct.world/checklists";

  const clean = path.startsWith("/") ? path : `/${path}`;

  return `${base}${clean}`;
};