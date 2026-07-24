import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const resolveMediaUrl = (path) => {
  if (!path || typeof path !== "string") return null;

  const trimmed = path.trim();
  if (!trimmed) return null;

  // Base64 or Blob URLs
  if (trimmed.startsWith("data:") || trimmed.startsWith("blob:")) {
    return trimmed;
  }

  // Live backend domain for media assets
  const domainBase = "https://konstruct.world";

  let normalized = trimmed;

  // Handle absolute URLs
  if (normalized.startsWith("http://") || normalized.startsWith("https://")) {
    normalized = normalized.replace(/^http:\/\/(127\.0\.0\.1|localhost):8001/, "https://konstruct.world");
    if (normalized.includes("/checklists/checklists/media/")) {
      normalized = normalized.replace("/checklists/checklists/media/", "/checklists/media/");
    } else if (normalized.includes("/media/") && !normalized.includes("/checklists/media/")) {
      normalized = normalized.replace("/media/", "/checklists/media/");
    }
    return normalized;
  }

  // Normalize relative paths to start with /checklists/media/
  if (normalized.startsWith("/checklists/media/")) {
    // Correct relative path
  } else if (normalized.startsWith("checklists/media/")) {
    normalized = `/${normalized}`;
  } else if (normalized.startsWith("/media/")) {
    normalized = `/checklists${normalized}`;
  } else if (normalized.startsWith("media/")) {
    normalized = `/checklists/${normalized}`;
  } else {
    normalized = `/checklists/media/${normalized.replace(/^\/+/, "")}`;
  }

  return `${domainBase}${normalized}`;
};