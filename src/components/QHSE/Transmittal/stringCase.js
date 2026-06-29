import { capitalCase } from "change-case";

export { capitalCase };

/**
 * Normalizes project/folder/block-style names. Skips coordinate pairs, bare
 * placeholders, and compact ref-like tokens (e.g. HIP-989, WO-001).
 */
export function safeCapitalCaseName(value) {
  if (value == null) return "";
  const raw = String(value);
  const s = raw.trim();
  if (!s) return raw;
  if (s === "—" || s === "-") return s;
  if (/^-?\d+\.?\d*\s*,\s*-?\d+\.?\d*$/.test(s)) return raw;
  if (!/\s/.test(s) && /[-/]/.test(s)) return raw;
  if (!/\s/.test(s) && /^[A-Z0-9_.]+$/i.test(s)) return raw;
  return capitalCase(raw);
}

/**
 * Like capitalCase but keeps compact acronyms (e.g. BOQ, NCR) and splits on " / ".
 */
export function capitalCaseLabel(value) {
  if (value == null || value === "") return "";
  const s = String(value).trim();
  if (!s) return "";
  if (/^[A-Z0-9]{2,}$/.test(s)) return s;
  if (s.includes(" / ")) {
    return s.split(" / ").map((part) => capitalCaseLabel(part)).join(" / ");
  }
  return capitalCase(s);
}
