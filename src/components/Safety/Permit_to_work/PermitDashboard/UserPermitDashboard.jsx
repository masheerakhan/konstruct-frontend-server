import React, { useState, useEffect } from "react";
import PermitCheckerDashboard from "./PermitCheckerDashboard";
import PermitMakerDashboard from "./PermitMakerDashboard";
import {
  getCurrentUserId,
  getSafetyInspectionRole,
} from "../../../../utils/UserUtils";

const ROLE_MAP = {
  checker: <PermitCheckerDashboard />,
  maker: <PermitMakerDashboard />,
  initializer: <PermitMakerDashboard />,
  supervisor: <PermitMakerDashboard />,
};

const DEFAULT_ROLE_ELEMENT = <PermitMakerDashboard />;

export default function UserPermitDashboard() {
  const userId = getCurrentUserId();
  const [role, setRole] = useState(() => getSafetyInspectionRole([], userId));
  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    if (role && role !== "both" && role !== null) {
      setResolved(true);
      return;
    }

    // For permits, if role is unknown from local storage,
    // we default to maker (lowest-privilege) until backend user-group mapping logic is fully implemented on frontend
    setRole("maker");
    setResolved(true);
  }, [role]);

  if (!resolved) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40">
        <p className="text-sm text-muted-foreground">Loading Dashboard…</p>
      </div>
    );
  }

  const resolvedRole = role === "both" ? "checker" : role;
  return ROLE_MAP[resolvedRole] ?? DEFAULT_ROLE_ELEMENT;
}
