/**
 * Standardizes date and time formatting across the application.
 */

/**
 * Formats a date string or object to "dd-mm-yyyy" for UI display.
 */
export const formatDisplayDate = (dateValue) => {
  if (!dateValue) return "-";
  const d = new Date(dateValue);
  if (isNaN(d.getTime())) return String(dateValue);

  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();

  return `${day}-${month}-${year}`;
};

/**
 * Formats a date string or object to "yyyy-mm-dd" for <input type="date"> elements.
 */
export const formatInputDate = (dateValue) => {
  if (!dateValue) return "";
  const d = new Date(dateValue);
  if (isNaN(d.getTime())) return "";

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

/**
 * Formats a date string or object to "hh:mm am/pm" for UI display.
 */
export const formatDisplayTime = (dateValue) => {
  if (!dateValue) return "-";
  const d = new Date(dateValue);
  if (isNaN(d.getTime())) return String(dateValue);

  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "pm" : "am";
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  const strHours = String(hours).padStart(2, "0");

  return `${strHours}:${minutes} ${ampm}`;
};

/**
 * Formats a date string or object to "dd-mm-yyyy hh:mm am/pm" for UI display.
 */
export const formatDisplayDateTime = (dateValue) => {
  if (!dateValue) return "-";
  const d = new Date(dateValue);
  if (isNaN(d.getTime())) return String(dateValue);
  return `${formatDisplayDate(d)} ${formatDisplayTime(d)}`;
};
