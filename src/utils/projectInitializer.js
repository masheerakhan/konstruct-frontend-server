import { getManagerOwnedProjects, setActiveProjectId } from "../api";

/**
 * Initializes and resolves the active project ID upon login or app launch.
 * Ensures ACTIVE_PROJECT_ID and ACCESSES are persisted in localStorage
 * so that all pages load project data immediately without requiring Profile interaction.
 */
export async function initializeActiveProject(userData = null) {
  try {
    let user = userData;
    if (!user) {
      const userString = localStorage.getItem("USER_DATA");
      if (userString && userString !== "undefined") {
        try {
          user = JSON.parse(userString);
        } catch {}
      }
    }

    // 1. Read ACCESSES from localStorage or user data
    let parsedAccesses = [];
    const accessString = localStorage.getItem("ACCESSES");
    if (accessString && accessString !== "undefined") {
      try {
        parsedAccesses = JSON.parse(accessString) || [];
      } catch {
        parsedAccesses = [];
      }
    }

    if ((!parsedAccesses || !parsedAccesses.length) && user && Array.isArray(user.accesses)) {
      parsedAccesses = user.accesses;
      if (parsedAccesses.length) {
        localStorage.setItem("ACCESSES", JSON.stringify(parsedAccesses));
      }
    }

    // 2. If Manager user with no accesses, fetch projects by ownership
    const isManager =
      user?.is_manager ||
      String(user?.role || "").toLowerCase() === "manager" ||
      (Array.isArray(user?.roles) &&
        user.roles.some((r) => String(typeof r === "string" ? r : r?.role || "").toLowerCase() === "manager"));

    const orgId = user?.org || user?.organization_id;

    if (isManager && (!parsedAccesses || !parsedAccesses.length) && orgId) {
      try {
        const res = await getManagerOwnedProjects(orgId);
        const projects = Array.isArray(res?.data) ? res.data : [];
        if (projects.length) {
          parsedAccesses = projects.map((p) => ({
            project_id: p.id,
            project_name: p.name,
            roles: ["Manager"],
          }));
          localStorage.setItem("ACCESSES", JSON.stringify(parsedAccesses));
        }
      } catch (err) {
        console.error("Failed to load manager projects during initialization", err);
      }
    }

    // 3. Determine initial active project ID
    let initialPid = null;

    // 3a. URL query parameter ?project_id
    try {
      const qs = new URLSearchParams(window.location.search);
      const q = qs.get("project_id");
      if (q) initialPid = Number(q);
    } catch {}

    // 3b. LocalStorage ACTIVE_PROJECT_ID / PROJECT_ID
    if (!initialPid) {
      const ls =
        localStorage.getItem("ACTIVE_PROJECT_ID") ||
        localStorage.getItem("PROJECT_ID");
      if (ls) initialPid = Number(ls);
    }

    // 3c. Fallback: First project from parsedAccesses
    if (!initialPid && parsedAccesses && parsedAccesses.length > 0) {
      const firstAcc = parsedAccesses[0];
      if (firstAcc) {
        initialPid = Number(firstAcc.project_id || firstAcc.id || firstAcc.projectId);
      }
    }

    // 4. Save active project ID to localStorage
    if (initialPid) {
      setActiveProjectId(initialPid);
      return initialPid;
    }

    return null;
  } catch (error) {
    console.error("Error in initializeActiveProject:", error);
    return null;
  }
}
