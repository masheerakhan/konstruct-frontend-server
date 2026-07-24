import React, { useState, useEffect } from "react";
import Header from "./Header";
import SideBarSetup from "./SideBarSetup";
import SiteBarHome from "./SiteBarHome";
import { useSidebar } from "./SidebarContext";

const SIDEBAR_WIDTH = 240;

function Layout1({ children, sidebarType = "admin" }) {
  const { sidebarOpen } = useSidebar();
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" && window.innerWidth < 768
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Use SiteBarHome for 'home' pages, SideBarSetup everywhere else
  const SidebarComponent = sidebarType === "home" ? SiteBarHome : SideBarSetup;

  // Only these roles will see sidebar and margin
  const adminRoles = ["admin", "manager", "super admin"];
  const rolee = (localStorage.getItem("ROLE") || "").toLowerCase();
  const showSidebar = adminRoles.includes(rolee);

  return (
    <>
      <Header />
      {showSidebar && <SidebarComponent />}
      <div
        style={{
          marginLeft: showSidebar && sidebarOpen && !isMobile ? SIDEBAR_WIDTH : 0,
          marginTop: 64,
          transition: "margin-left 0.35s cubic-bezier(.6,-0.17,.22,1.08)",
          minHeight: `calc(100vh - 64px)`,
          background: "#eceef1",
        }}
      >
        {children}
      </div>
    </>
  );
}

export default Layout1;
