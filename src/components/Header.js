// import React, { useState } from "react";
// import { NavLink, useNavigate } from "react-router-dom";
// import { IoSettingsOutline } from "react-icons/io5";
// import { FaRegCircleUser, FaMoon, FaSun } from "react-icons/fa6";
// import Notification from "./Notification";
// import Profile from "./Profile";
// import { useTheme } from "../ThemeContext";
// import { useSidebar } from "./SidebarContext";
// import { getSnagStats, resolveActiveProjectId } from "../api";

// const ORANGE = "#ffbe63";
// const BG_OFFWHITE = "#fcfaf7";
// const SIDEBAR_WIDTH = 240;

// function Header() {
//   const [isNotification, setIsNotification] = useState(false);
//   const [isProfile, setIsProfile] = useState(false);

//   const { theme, toggleTheme } = useTheme();
//   const { sidebarOpen, setSidebarOpen } = useSidebar();
//   const navigate = useNavigate();

//   // ---- roles
//   const rolee = localStorage.getItem("ROLE");
//   let userRoles = [];
//   try {
//     userRoles = JSON.parse(localStorage.getItem("ACCESSES") || "[]")
//       .flatMap((acc) => (Array.isArray(acc.roles) ? acc.roles : []))
//       .map((r) => (typeof r === "string" ? r : r?.role));
//   } catch {}
//   const allRoles = [
//     ...(rolee ? [rolee] : []),
//     ...(userRoles.length ? userRoles : []),
//   ];
//   const ALLOWED_ROLES = ["admin", "super admin", "manager"];
//   const norm = (s) => (s || "").toLowerCase().replace(/[^a-z]/g, "");
//   const hasRole = (name) => allRoles.some((r) => norm(r) === norm(name));
//   const showHamburger = allRoles.some((r) =>
//     ALLOWED_ROLES.some((a) => norm(r) === norm(a))
//   );
//   const allowuser = showHamburger; // same condition as before
//   const isSecurityGuard = hasRole("security guard"); // also matches "security_guard"
//  const isProjectManagerOrHead =
//     hasRole("Project Manager") ||
//     hasRole("Project Head") ||
//     hasRole("Head");  // ---- theme colors
//     const isSuperAdmin = hasRole("super admin");
//   const bgColor = theme === "dark" ? "#191922" : BG_OFFWHITE;
//   const cardColor = theme === "dark" ? "#23232c" : "#fff";
//   const borderColor = ORANGE;
//   const textColor = theme === "dark" ? "#fff" : "#222";
//   const iconColor = ORANGE;

//   const handleSettingsClick = () => {
//     if (rolee && rolee.toLowerCase() === "super admin") {
//       navigate("/user-management-setup");
//     } else if (
//       (rolee && rolee.toLowerCase() === "manager") ||
//       allRoles.some((r) => norm(r) === "manager")
//     ) {
//       navigate("/user");
//     } else {
//       navigate("/setup");
//     }
//   };

//   // ---- Analytics: fire API when clicked
//   const getActiveProjectId = () => {
//     try {
//       const qp = new URLSearchParams(window.location.search).get("project_id");
//       if (qp) return Number(qp);
//     } catch {}
//     const ls =
//       localStorage.getItem("ACTIVE_PROJECT_ID") ||
//       localStorage.getItem("PROJECT_ID");
//     return Number(ls) || 64; // fallback as requested
//   };

//   const handleAnalyticsClick = async () => {
//     const projectId = getActiveProjectId();
//     const url = `https://konstruct.world/checklists/stats/snags/?project_id=${projectId}`;

//     // try common token keys; if none, still make the call (may rely on cookies)
//     const token =
//       localStorage.getItem("TOKEN") ||
//       localStorage.getItem("ACCESS_TOKEN") ||
//       localStorage.getItem("access") ||
//       localStorage.getItem("AUTH_TOKEN");

//     try {
//       // fire-and-forget; no need to block navigation
//       fetch(url, {
//         method: "GET",
//         headers: {
//           Accept: "application/json",
//           ...(token ? { Authorization: `Bearer ${token}` } : {}),
//         },
//         credentials: "include",
//         keepalive: true,
//       }).catch(() => {});
//     } catch (e) {
//       // swallow errors so navigation still happens
//       console.warn("[Analytics] prefetch failed", e);
//     }
//     // navigation is handled by NavLink's default behavior
//   };

//   return (
//     <>
//       <nav
//         className="fixed top-0 left-0 right-0 z-[200] w-full flex items-center px-4 py-2 border-b"
//         style={{
//           background: cardColor,
//           borderBottom: `2px solid ${borderColor}`,
//           color: textColor,
//           height: 64,
//           minHeight: 64,
//           transition: "background 0.3s",
//           justifyContent: "space-between",
//           position: "fixed",
//         }}
//       >
//         {/* Left: Hamburger + Home */}
//         <div
//           className="flex items-center gap-4"
//           style={{
//             minWidth: 0,
//             marginLeft: sidebarOpen && showHamburger ? SIDEBAR_WIDTH : 0,
//             transition: "margin-left 0.35s cubic-bezier(.6,-0.17,.22,1.08)",
//             zIndex: 2,
//           }}
//         >
//           {showHamburger && (
//             <button
//               onClick={() => setSidebarOpen((open) => !open)}
//               className="mr-1 rounded-lg shadow-lg flex items-center justify-center"
//               style={{
//                 background: "#fff",
//                 border: `2px solid ${borderColor}`,
//                 width: 42,
//                 height: 42,
//                 color: iconColor,
//                 transition: "background 0.2s",
//                 outline: "none",
//               }}
//               aria-label="Toggle sidebar"
//             >
//               <svg width="26" height="26" viewBox="0 0 22 22" fill="none">
//                 <rect y="3" width="22" height="3" rx="1.5" fill={iconColor} />
//                 <rect y="9" width="22" height="3" rx="1.5" fill={iconColor} />
//                 <rect y="15" width="22" height="3" rx="1.5" fill={iconColor} />
//               </svg>
//             </button>
//           )}
//           <NavLink
//             to="/config"
//             className="font-medium"
//             style={{
//               color: iconColor,
//               textDecoration: "underline",
//               fontWeight: 600,
//               marginLeft: 2,
//               marginRight: 12,
//             }}
//           >
//             Home
//           </NavLink>
//         </div>

//         {/* Center: logo */}
//         <div
//           style={{
//             position: "absolute",
//             left: "50%",
//             top: 0,
//             height: 64,
//             transform: "translateX(-50%)",
//             zIndex: 1,
//             display: "flex",
//             alignItems: "center",
//             pointerEvents: "none",
//             width: 220,
//             justifyContent: "center",
//           }}
//         >
//           <span className="text-lg font-bold truncate pointer-events-none select-none">
//             <h2 style={{ color: iconColor, margin: 0, userSelect: "none" }}>
//                Konstruct
//             </h2>
//           </span>
//         </div>

//         {/* Right actions */}
//         <ul
//           className="hidden md:flex justify-end items-center gap-5 py-2 uppercase text-sm"
//           style={{ marginLeft: "auto" }}
//         >

//           {/* 🔹 NEW: MIR create link (sab roles ke liye) */}
//           <NavLink
//             to="/mir/create"
//             className="font-medium flex items-center gap-1"
//             style={{ color: textColor, textDecoration: "none" }}
//             title="Material Inspection Request"
//           >
//              MIR
//           </NavLink>
//           <NavLink
//             to="/mir/inbox"
//             className="font-medium flex items-center gap-1"
//             style={{ color: textColor, textDecoration: "none" }}
//             title="My MIR Inbox"
//           >
//              MIR Inbox
//           </NavLink>
//           {/* Analytics: hidden for security guard; onClick triggers API */}
//         {!isSecurityGuard && !isProjectManagerOrHead &&(
//   <NavLink
//     to="/analytics"
//     onClick={() => {
//       const pid = resolveActiveProjectId();
//       if (pid) getSnagStats(pid).catch(() => {}); // fire-and-forget prefetch
//     }}
//     className="font-medium flex items-center gap-1"
//     style={{ color: textColor, textDecoration: "none" }}
//     title="Analytics Dashboard"
//   >
//     Analytics
//   </NavLink>
// )}

// {!isSecurityGuard && (
//             <NavLink
//               to={isSuperAdmin ? "/forms" : "/project-forms"}
//               className="font-medium flex items-center gap-1"
//               style={{ color: textColor, textDecoration: "none" }}
//               title={
//                 isSuperAdmin
//                   ? "Forms Engine (Templates & Packs)"
//                   : "Project Forms"
//               }
//             >
//               Forms
//             </NavLink>
//           )}

//           <NavLink
//             to="/privacy"
//             className="font-medium flex items-center gap-1"
//             style={{ color: textColor, textDecoration: "none" }}
//             title="Privacy Policy"
//           >
//             🔒
//           </NavLink>

//           {allowuser && (
//             <button
//               onClick={handleSettingsClick}
//               style={{
//                 color: iconColor,
//                 background: "transparent",
//                 border: "none",
//                 fontSize: 20,
//               }}
//               title="Settings"
//             >
//               <IoSettingsOutline />
//             </button>
//           )}

//           <button
//             onClick={toggleTheme}
//             className="p-2 transition-colors"
//             title="Toggle Theme"
//           >
//             {theme === "dark" ? (
//               <FaSun style={{ color: ORANGE }} />
//             ) : (
//               <FaMoon style={{ color: iconColor }} />
//             )}
//           </button>

//           <button
//             onClick={() => setIsProfile(true)}
//             style={{
//               color: iconColor,
//               background: "transparent",
//               border: "none",
//               fontSize: 20,
//             }}
//             title="Profile"
//           >
//             <FaRegCircleUser />
//           </button>
//         </ul>
//       </nav>

//       {/* Mobile spacer */}
//       <div className="block md:hidden" style={{ height: 64 }} />

//       {/* Drawers */}
//       {isProfile && <Profile onClose={() => setIsProfile(false)} />}
//       {isNotification && (
//         <Notification onClose={() => setIsNotification(false)} />
//       )}
//     </>
//   );
// }

// export default Header;

import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { IoSettingsOutline } from "react-icons/io5";
import { FaRegCircleUser, FaMoon, FaSun } from "react-icons/fa6";
import Notification from "./Notification";
import Profile from "./Profile";
import { useTheme } from "../ThemeContext";
import { useSidebar } from "./SidebarContext";
import { getSnagStats, resolveActiveProjectId } from "../api";

const ORANGE = "#ffbe63";
const BG_OFFWHITE = "#fcfaf7";
const SIDEBAR_WIDTH = 240;

function Header() {
  const [isNotification, setIsNotification] = useState(false);
  const [isProfile, setIsProfile] = useState(false);

  const { theme, toggleTheme } = useTheme();
  const { sidebarOpen, setSidebarOpen } = useSidebar();
  const navigate = useNavigate();

  // ---- roles
  const rolee = localStorage.getItem("ROLE");
  let userRoles = [];
  try {
    userRoles = JSON.parse(localStorage.getItem("ACCESSES") || "[]")
      .flatMap((acc) => (Array.isArray(acc.roles) ? acc.roles : []))
      .map((r) => (typeof r === "string" ? r : r?.role));
  } catch {}
  const allRoles = [
    ...(rolee ? [rolee] : []),
    ...(userRoles.length ? userRoles : []),
  ];
  const ALLOWED_ROLES = ["admin", "super admin", "manager"];
  const norm = (s) => (s || "").toLowerCase().replace(/[^a-z]/g, "");
  const normalize = (s) => (s || "").toLowerCase().replace(/[^a-z]/g, "");

  const hasRole = (name) => allRoles.some((r) => norm(r) === norm(name));

  const hasAnyOrgAdminRole = () => {
    const normRoles = allRoles.map(normalize);
    return ALLOWED_ROLES.some((allowed) =>
      normRoles.includes(normalize(allowed)),
    );
  };
  // const showHamburger = allRoles.some((r) =>
  //   ALLOWED_ROLES.some((a) => norm(r) === norm(a))
  // );

  const showHamburger = hasAnyOrgAdminRole();

  const allowuser = showHamburger; // same condition as before
  const isSecurityGuard = hasRole("security guard"); // also matches "security_guard"

  /** DMS/Documents: show in header when sidebar is hidden (e.g. Maker) so users can open DMS without sidebar. */
  const showDmsInHeader = !showHamburger && !isSecurityGuard;
  const isProjectManagerOrHead =
    hasRole("Project Manager") || hasRole("Project Head") || hasRole("Head");
  const isSuperAdmin = hasRole("super admin");
  const isManager = hasRole("manager");
  const isAdmin = hasRole("admin");
  // const isSuperAdmin = hasRole("super admin"); // (ye already hai)

  // ✅ Only Users (not admin/manager/superadmin)
  const showSafetyForUserOnly = !isManager && !isAdmin && !isSuperAdmin;

  // ---- theme colors
  const bgColor = theme === "dark" ? "#191922" : BG_OFFWHITE;
  const cardColor = theme === "dark" ? "#23232c" : "#fff";
  const borderColor = ORANGE;
  const textColor = theme === "dark" ? "#fff" : "#222";
  const iconColor = ORANGE;

  const handleSettingsClick = () => {
    if (rolee && rolee.toLowerCase() === "super admin") {
      navigate("/user-management-setup");
    } else if (
      (rolee && rolee.toLowerCase() === "manager") ||
      allRoles.some((r) => norm(r) === "manager")
    ) {
      navigate("/user");
    } else {
      navigate("/setup");
    }
  };

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-[200] w-full flex items-center px-4 py-2 border-b"
        style={{
          background: cardColor,
          borderBottom: `2px solid ${borderColor}`,
          color: textColor,
          height: 64,
          minHeight: 64,
          transition: "background 0.3s",
          justifyContent: "space-between",
          position: "fixed",
        }}
      >
        {/* Left: Hamburger + Home */}
        <div
          className="flex items-center gap-4"
          style={{
            minWidth: 0,
            marginLeft: sidebarOpen && showHamburger ? SIDEBAR_WIDTH : 0,
            transition: "margin-left 0.35s cubic-bezier(.6,-0.17,.22,1.08)",
            zIndex: 2,
          }}
        >
          {showHamburger && (
            <button
              onClick={() => setSidebarOpen((open) => !open)}
              className="mr-1 rounded-lg shadow-lg flex items-center justify-center"
              style={{
                background: "#fff",
                border: `2px solid ${borderColor}`,
                width: 42,
                height: 42,
                color: iconColor,
                transition: "background 0.2s",
                outline: "none",
              }}
              aria-label="Toggle sidebar"
            >
              <svg width="26" height="26" viewBox="0 0 22 22" fill="none">
                <rect y="3" width="22" height="3" rx="1.5" fill={iconColor} />
                <rect y="9" width="22" height="3" rx="1.5" fill={iconColor} />
                <rect y="15" width="22" height="3" rx="1.5" fill={iconColor} />
              </svg>
            </button>
          )}
          <NavLink
            to="/config"
            className="font-medium"
            style={{
              color: iconColor,
              textDecoration: "underline",
              fontWeight: 600,
              marginLeft: 2,
              marginRight: 12,
            }}
          >
            Home
          </NavLink>
        </div>

        {/* Center: logo */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: 0,
            height: 64,
            transform: "translateX(-50%)",
            zIndex: 1,
            display: "flex",
            alignItems: "center",
            pointerEvents: "none",
            width: 220,
            justifyContent: "center",
          }}
        >
          <span className="text-lg font-bold truncate pointer-events-none select-none">
            <h2 style={{ color: iconColor, margin: 0, userSelect: "none" }}>
              Konstruct
            </h2>
          </span>
        </div>

        {/* Right actions */}
        <ul
          className="hidden md:flex justify-end items-center gap-5 py-2 uppercase text-sm"
          style={{ marginLeft: "auto" }}
        >
          {/* 🔹 MIR create link */}
          <NavLink
            to="/mir/create"
            className="font-medium flex items-center gap-1"
            style={{ color: textColor, textDecoration: "none" }}
            title="Material Inspection Request"
          >
            MIR
          </NavLink>

          {/* 🔹 MIR Inbox */}
          <NavLink
            to="/mir/inbox"
            className="font-medium flex items-center gap-1"
            style={{ color: textColor, textDecoration: "none" }}
            title="My MIR Inbox"
          >
            MIR Inbox
          </NavLink>

          {/* 🔹 Checklist & Inbox */}
          {/* <NavLink
            to="/checklists"
            className="font-medium flex items-center gap-1"
            style={{ color: textColor, textDecoration: "none" }}
            title="QHSE Checklists"
          >
            Checklists
          </NavLink>
          <NavLink
            to="/checklists/inbox"
            className="font-medium flex items-center gap-1"
            style={{ color: textColor, textDecoration: "none" }}
            title="QHSE Checklist Inbox"
          >
            Checklist Inbox
          </NavLink> */}

          {showDmsInHeader && (
            <NavLink
              to="/documents"
              className="font-medium flex items-center gap-1"
              style={{ color: textColor, textDecoration: "none" }}
              title="Document management (folders, transmittals, resources)"
            >
              DMS
            </NavLink>
          )}

          {/* 🔹 Analytics (hidden for security guard + PM/Head) */}
          {/* {!isSecurityGuard && !isProjectManagerOrHead && (
            <NavLink
              to="/analytics"
              onClick={() => {
                const pid = resolveActiveProjectId();
                if (pid) getSnagStats(pid).catch(() => {});
              }}
              className="font-medium flex items-center gap-1"
              style={{ color: textColor, textDecoration: "none" }}
              title="Analytics Dashboard"
            >
              Analytics
            </NavLink>
          )} */}

          {/* 🔹 Forms (templates / project forms) */}
          {!isSecurityGuard && (
            <NavLink
              to={isSuperAdmin ? "/forms" : "/project-forms"}
              className="font-medium flex items-center gap-1"
              style={{ color: textColor, textDecoration: "none" }}
              title={
                isSuperAdmin
                  ? "Forms Engine (Templates & Packs)"
                  : "Project Forms"
              }
            >
              Forms
            </NavLink>
          )}

          {/* 🔹 NEW: Forms Inbox (forwarded / assigned forms) */}
          {/* {!isSecurityGuard && (
            <NavLink
              to="/my-forms"
              className="font-medium flex items-center gap-1"
              style={{ color: textColor, textDecoration: "none" }}
              title="My Forms Inbox"
            >
              Forms Inbox
            </NavLink>
          )} */}
          {/* 🔹 Safety (ONLY USERS) */}
          {showSafetyForUserOnly && (
            <NavLink
              to="/safety/my-sessions"
              className="font-medium flex items-center gap-1"
              style={{ color: textColor, textDecoration: "none" }}
              title="Safety Session"
            >
              Safety
            </NavLink>
          )}

          {/* 🔹 Safety inspection (ONLY USERS) */}
          {showSafetyForUserOnly && (
            <NavLink
              to="/safety/inspection-checker"
              className="font-medium flex items-center gap-1"
              style={{ color: textColor, textDecoration: "none" }}
              title="Safety Inspection"
            >
              Safety Inspection
            </NavLink>
          )}

          {/* 🔹 Permit (ONLY USERS) */}
          {showSafetyForUserOnly && (
            <NavLink
              to="/safety/permit"
              className="font-medium flex items-center gap-1"
              style={{ color: textColor, textDecoration: "none" }}
              title="Permit To Work"
            >
              Permit
            </NavLink>
          )}

          {/* 🔹 Safety Observations (ONLY USERS) */}
          {showSafetyForUserOnly && (
            <NavLink
              to="/safety/observations"
              className="font-medium flex items-center gap-1"
              style={{ color: textColor, textDecoration: "none" }}
              title="Safety Observations"
            >
              Safety Observations
            </NavLink>
          )}

          {/* {showSafetyForUserOnly && (
            <NavLink
              to="/safety"
              className="font-medium flex items-center gap-1"
              style={{ color: textColor, textDecoration: "none" }}
              title="Safety"
            >
              Safety
            </NavLink>
          )} */}

          <NavLink
            to="/privacy"
            className="font-medium flex items-center gap-1"
            style={{ color: textColor, textDecoration: "none" }}
            title="Privacy Policy"
          >
            🔒
          </NavLink>

          {allowuser && (
            <button
              onClick={handleSettingsClick}
              style={{
                color: iconColor,
                background: "transparent",
                border: "none",
                fontSize: 20,
              }}
              title="Settings"
            >
              <IoSettingsOutline />
            </button>
          )}

          <button
            onClick={toggleTheme}
            className="p-2 transition-colors"
            title="Toggle Theme"
          >
            {theme === "dark" ? (
              <FaSun style={{ color: ORANGE }} />
            ) : (
              <FaMoon style={{ color: iconColor }} />
            )}
          </button>

          <button
            onClick={() => setIsProfile(true)}
            style={{
              color: iconColor,
              background: "transparent",
              border: "none",
              fontSize: 20,
            }}
            title="Profile"
          >
            <FaRegCircleUser />
          </button>
        </ul>
      </nav>

      {/* Mobile spacer */}
      <div className="block md:hidden" style={{ height: 64 }} />

      {/* Drawers */}
      {isProfile && <Profile onClose={() => setIsProfile(false)} />}
      {isNotification && (
        <Notification onClose={() => setIsNotification(false)} />
      )}
    </>
  );
}

export default Header;
