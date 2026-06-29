import React, { useState, useEffect } from "react";
// import { listSafetyChecklists, resolveActiveProjectId } from "../../../../api";
// import { getCurrentUserId, getSafetyInspectionRole } from "./utils";

// Role-specific dashboards — each lives in its own file

import CheckerDashboard from "./Safety_User_View/Observation_Dashboard/Checkerdashboard";
import MakerDashboard from "./Safety_User_View/Observation_Dashboard/Makerdashboard";
import InitializerDashboard from "./Safety_User_View/Observation_Dashboard/Initializerdashboard";
import SupervisorDashboard from "./Safety_User_View/Observation_Dashboard/Supervisordashboard";
import { listSafetyChecklists, resolveActiveProjectId } from "../../../api";
import { getCurrentUserId, getSafetyInspectionRole } from "../../../utils/UserUtils";

// Add future role dashboards here and extend the ROLE_MAP below:
// import AuditorDashboard   from "./AuditorDashboard";
// import AdminDashboard     from "./AdminDashboard";

// ─────────────────────────────────────────────
// Role → Component map
// To support a new role, add it here and create its dashboard file.
// ─────────────────────────────────────────────
const ROLE_MAP = {
    checker: <CheckerDashboard />,
    maker: <MakerDashboard />,
    initializer: <InitializerDashboard />,
    supervisor: <SupervisorDashboard />,
    // auditor:  <AuditorDashboard />,
};

// Fallback when role cannot be derived from localStorage alone
// (will be re-evaluated once checklists are fetched)
const DEFAULT_ROLE_ELEMENT = <CheckerDashboard />;

// ─────────────────────────────────────────────
// SafetyInspectionRoot
// 1. Reads the role from localStorage immediately.
// 2. If the role is still ambiguous (null / "both"), fetches the checklist
//    assignments to derive it, then re-renders with the correct dashboard.
// ─────────────────────────────────────────────
export default function ObservationsDashboard() {
    const userId = getCurrentUserId();

    const [role, setRole] = useState(() => getSafetyInspectionRole([], userId));
    const [resolved, setResolved] = useState(false);

    useEffect(() => {
        // If localStorage already gave us a definitive single role, no fetch needed.
        if (role && role !== "both" && role !== null) {
            setResolved(true);
            return;
        }

        // Otherwise, fetch checklists to derive checker / maker / both
        const derive = async () => {
            try {
                const projectId = String(resolveActiveProjectId?.() || "");
                const isObservations = window.location.pathname.includes('/safety/observations');
                const params = { assigned_to_me: true, template_type: isObservations ? "OBSERVATION" : "SAFETY" };
                if (projectId) params.project_id = projectId;

                const res = await listSafetyChecklists(params);
                const data = res?.data;
                const list = Array.isArray(data) ? data : data?.results ?? [];

                const derived = getSafetyInspectionRole(list, userId);
                setRole(derived);
            } catch {
                // Silently fall back to default dashboard on error
            } finally {
                setResolved(true);
            }
        };

        derive();
    }, [userId]);

    // Show a minimal loading state while deriving role from API
    if (!resolved) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-muted/40">
                <p className="text-sm text-muted-foreground">Loading…</p>
            </div>
        );
    }

    // "both" means the user is assigned as checker AND maker — show checker first
    const resolvedRole = role === "both" ? "checker" : role;

    return ROLE_MAP[resolvedRole] ?? DEFAULT_ROLE_ELEMENT;
}
