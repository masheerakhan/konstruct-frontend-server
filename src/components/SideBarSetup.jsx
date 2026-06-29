import React from "react";
import { NavLink } from "react-router-dom";
import { useTheme } from "../ThemeContext";
import { useSidebar } from "./SidebarContext";

const ORANGE = "#ffbe63";
const BG_OFFWHITE = "#fcfaf7";
export const SIDEBAR_WIDTH = 240;

function getAllRoles() {
  const userString = localStorage.getItem("USER_DATA");
  if (!userString || userString === "undefined") return [];
  try {
    const userData = JSON.parse(userString);
    let roles = [];
    if (typeof userData.role === "string") roles.push(userData.role);
    if (Array.isArray(userData.roles)) {
      userData.roles.forEach((r) => {
        if (typeof r === "string") roles.push(r);
        else if (r && typeof r === "object" && r.role) roles.push(r.role);
      });
    }
    if (Array.isArray(userData.accesses)) {
      userData.accesses.forEach((a) =>
        Array.isArray(a.roles) &&
        a.roles.forEach((r) => {
          if (typeof r === "string") roles.push(r);
          else if (r && typeof r === "object" && r.role) roles.push(r.role);
        })
      );
    }
    if (userData.superadmin) roles.push("Super Admin");
    if (userData.is_manager) roles.push("Manager");
    if (userData.is_client === false) roles.push("Admin");
    return [...new Set(roles)];
  } catch {
    return [];
  }
}

function getActiveProjectId() {
  try {
    const q = new URLSearchParams(window.location.search).get("project_id");
    if (q) return q;
  } catch { }
  return (
    localStorage.getItem("ACTIVE_PROJECT_ID") ||
    localStorage.getItem("PROJECT_ID") ||
    ""
  );
}

function SideBarSetup({ overrideNavItems }) {
  const { theme } = useTheme();
  const { sidebarOpen } = useSidebar();
  const allRoles = getAllRoles();
  const rolesLower = allRoles.map((r) => String(r).toLowerCase());
  const rolee = (localStorage.getItem("ROLE") || "").toLowerCase();

  const isGuard =
    rolesLower.includes("security_guard") ||
    rolesLower.includes("security guard");

  // hide if ONLY initializer
  const isInit = rolesLower.includes("initializer") || rolesLower.includes("intializer");
  const hasOtherRole = rolesLower.some((r) => !["initializer", "intializer"].includes(r));
  if (isInit && !hasOtherRole) return null;

  // build attendance path with ?project_id if we have one
  const pid = getActiveProjectId();
  const attendanceProjectPath = pid
    ? `/attendance/project?project_id=${pid}`
    : `/attendance/project`;

  let navItems =
    Array.isArray(overrideNavItems) && overrideNavItems.length
      ? overrideNavItems
      : undefined;

  if (isGuard) {
    navItems = [
      { name: "Onboarding", path: "/guard/onboarding" },
      { name: "Attendance", path: "/guard/attendance" },
    ];
  } else if (rolee === "manager" || rolee === "admin") {
    navItems = [
      { name: "User & Role", path: "/user" },
      { name: "Checklist", path: "/Checklist" },
      { name: "Category management", path: "/category-sidebar" },
      { name: "Users Management", path: "/UsersManagement" },
      { name: "Vendors", path: "/Vendors" },
      { name: "Scheduling", path: "/scheduling" },
      // { name: "Forms Setup", path: "/project-forms/setup" },
      { name: "Attendance", path: "/attendance/project" },

      { name: "Project Forms", path: "/project-forms" }, // ✅ use computed path
      { name: "Safety Setup", path: "/safetySetup" },

      { name: "Safety", path: "/safety" },
      // { name: "Safety Observation", path: "/safetyObservation" },
      // { name: "DMS", path: "/documents" }
      { name: "QHSE", path: "/documents" },
    ];
  } else if (rolee === "super admin") {
    navItems = [
      { name: "User Setup", path: "/user-setup" },
      { name: "Unit Setup", path: "/setup" },
      { name: "Safety Setup", path: "/safetySetup" },
      { name: "User & Role", path: "/user" },
      { name: "Users Management", path: "/UsersManagement" },
      // { name: "Attendance", path: attendanceProjectPath }, // ✅
      { name: "Forms", path: "/forms" },
      { name: "Form Packs", path: "/form-packs" },
      { name: "Project Forms", path: "/project-forms" },
      { name: "Purpose Management", path: "/create-purpose" },
      { name: "QHSE", path: "/documents" },
    ];
  } else {
    navItems = [
      { name: "User & Role", path: "/user" },
      { name: "Users Management", path: "/UsersManagement" },
      // { name: "Attendance", path: attendanceProjectPath }, // ✅
      { name: "Company Setup", path: "/user-setup" },
      { name: "Safety Setup", path: "/safetySetup" },
      { name: "Project Forms", path: "/project-forms" },
      { name: "Safety", path: "/safety" },
      // { name: "DMS", path: "/documents" }

      { name: "DMS", path: "/documents" },
    ];
  }

  const bgColor = theme === "dark" ? "#191922" : BG_OFFWHITE;
  const cardColor = theme === "dark" ? "#23232c" : "#fff";
  const borderColor = ORANGE;
  const textColor = theme === "dark" ? "#fff" : "#222";
  const iconColor = ORANGE;

  return (
    <div
      className="fixed top-0 left-0 z-[1000] h-screen shadow-lg flex flex-col transition-transform duration-300 ease-in-out"
      style={{
        width: `${SIDEBAR_WIDTH}px`,
        background: bgColor,
        borderRight: `3px solid ${borderColor}`,
        boxShadow: "0 4px 32px #0001",
        transform: sidebarOpen ? "translateX(0)" : `translateX(-${SIDEBAR_WIDTH}px)`,
        transition: "transform 0.35s cubic-bezier(.6,-0.17,.22,1.08)",
      }}
    >
      <div className="mb-6 text-center mt-4">
        <div
          className="text-lg font-bold tracking-wide"
          style={{ color: iconColor, letterSpacing: "2px" }}
        >
          Admin Panel
        </div>
      </div>

      <nav className="space-y-2 flex-1 px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className="block px-4 py-2 rounded-md text-sm font-semibold transition-colors duration-200"
            style={({ isActive }) =>
              isActive
                ? { background: iconColor, color: "#fff" }
                : { color: textColor, background: cardColor }
            }
          >
            {item.name}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

export default SideBarSetup;
