export const isClosedPermit = (permit) => {
  if (!permit) return false;
  const status =
    permit.current_status ||
    permit.workflow_summary?.current_status ||
    "";
  return String(status).trim().toLowerCase() === "closed";
};

export const canShowPermitReportDownload = (permit) => {
  if (!permit) return false;
  return isClosedPermit(permit);
};
