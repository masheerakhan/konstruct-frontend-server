// src/components/QHSEChecklistDashboard.jsx

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  fetchChecklistInstances,
  fetchChecklistDrafts,
  deleteChecklistDraft,
} from "./QHSE/InspectionChecklists/inspectionChecklistApi";
import { downloadChecklistReportPdfFrontend } from "./QHSE/InspectionChecklists/qhsePdfGenerator";
import { useTheme } from "../ThemeContext";
import { deleteLocalDraft, getAllLocalDrafts, deleteLocalDraftByServerId } from "./QHSE/InspectionChecklists/draftsDb";

const ORANGE = "#ffbe63";
const BG_OFFWHITE = "#fcfaf7";

const TABS = {
  MAKER: [
    { id: "DRAFT", label: "Drafts", statuses: ["draft"] },
    { id: "PENDING_CHECKER", label: "Pending Checker Review", statuses: ["pending_checker"] },
    { id: "PENDING_SUPERVISOR", label: "In Supervisor Review", statuses: ["pending_supervisor"] },
    { id: "REWORK", label: "Rework Required", statuses: ["rework"] },
    { id: "APPROVED", label: "Approved", statuses: ["completed"] },
  ],
  CHECKER: [
    { id: "PENDING_MY_ACTION", label: "Pending Review", statuses: ["pending_checker"] },
    { id: "APPROVED", label: "Approved By Me", statuses: ["pending_supervisor", "completed"] },
    { id: "REJECTED", label: "Rejected By Me", statuses: ["rework"] },
  ],
  SUPERVISOR: [
    { id: "PENDING_MY_ACTION", label: "Pending Review", statuses: ["pending_supervisor"] },
    { id: "APPROVED", label: "Approved By Me", statuses: ["completed"] },
    { id: "REJECTED", label: "Rejected By Me", statuses: ["rework"] },
  ],
};

export default function QHSEChecklistDashboard() {
  const navigate = useNavigate();
  const { theme } = useTheme();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const getResolvedRole = () => {
    const rawRole = (
      localStorage.getItem("SAFETY_INSPECTION_ROLE") ||
      localStorage.getItem("FLOW_ROLE") ||
      localStorage.getItem("ROLE") ||
      "MAKER"
    ).toUpperCase();

    if (rawRole.includes("SUPERVISOR")) return "SUPERVISOR";
    if (rawRole.includes("CHECKER")) return "CHECKER";
    if (rawRole.includes("INITIALIZER") || rawRole.includes("INTIALIZER")) return "INITIALIZER";
    return "MAKER";
  };

  const activeRole = getResolvedRole();

  const getUserRoles = (u) => {
    if (!u) return [];
    if (Array.isArray(u.roles)) {
      return u.roles.map((r) => (typeof r === "string" ? r.toUpperCase() : (r?.role || r?.name || "").toUpperCase()));
    }
    if (typeof u.role === "string") {
      return [u.role.toUpperCase()];
    }
    if (Array.isArray(u.accesses)) {
      const roles = [];
      u.accesses.forEach((acc) => {
        if (Array.isArray(acc.roles)) {
          acc.roles.forEach((r) => {
            const roleStr = typeof r === "string" ? r : r?.role || r?.name;
            if (roleStr) roles.push(roleStr.toUpperCase());
          });
        } else if (acc.role) {
          roles.push(acc.role.toUpperCase());
        }
      });
      return roles;
    }
    return [];
  };

  const currentUser = (() => {
    try {
      return (
        JSON.parse(localStorage.getItem("USER_DATA") || "null") ||
        JSON.parse(localStorage.getItem("userData") || "null")
      );
    } catch {
      return null;
    }
  })();

  const userRoles = getUserRoles(currentUser);
  const canCreateChecklist = userRoles.includes("MAKER");

  const [activeTab, setActiveTab] = useState("");

  const bgColor = theme === "dark" ? "#191922" : BG_OFFWHITE;
  const cardBg = theme === "dark" ? "#23232c" : "#ffffff";
  const textColor = theme === "dark" ? "#f1f5f9" : "#1e293b";
  const subTextColor = theme === "dark" ? "#94a3b8" : "#64748b";
  const borderColor = theme === "dark" ? "#334155" : "#e2e8f0";

  const [draftRows, setDraftRows] = useState([]);

  const roleTabs = TABS[activeRole] || TABS.MAKER;

  const loadDrafts = async (userId) => {
    let serverDrafts = [];
    try {
      serverDrafts = await fetchChecklistDrafts();
    } catch (err) {
      console.warn("Could not fetch server drafts:", err);
    }

    let localDrafts = [];
    try {
      localDrafts = await getAllLocalDrafts(userId);
    } catch (err) {
      console.error("Could not fetch local drafts:", err);
    }

    const mergedMap = new Map();

    serverDrafts.forEach(sd => {
      mergedMap.set(String(sd.id), {
        id: sd.id,
        serverId: sd.id,
        name: sd.name || sd.template_name || "Draft Checklist",
        status: "draft",
        updated_at: sd.updated_at,
        created_at: sd.created_at,
        template_title: sd.template_title || sd.template_name || "Unknown Template",
        isLocalOnly: false,
      });
    });

    localDrafts.forEach(ld => {
      const key = ld.serverId ? String(ld.serverId) : `local_${ld.draftId}`;
      const existing = mergedMap.get(key);

      if (existing) {
        const localTime = new Date(ld.updatedAt).getTime();
        const serverTime = new Date(existing.updated_at).getTime();
        if (localTime > serverTime) {
          mergedMap.set(key, {
            ...existing,
            name: ld.name,
            updated_at: new Date(ld.updatedAt).toISOString(),
            draftId: ld.draftId,
          });
        } else {
          mergedMap.set(key, {
            ...existing,
            draftId: ld.draftId,
          });
        }
      } else {
        mergedMap.set(key, {
          id: `local_${ld.draftId}`,
          draftId: ld.draftId,
          name: ld.name || "Offline Draft Checklist",
          status: "draft",
          updated_at: new Date(ld.updatedAt).toISOString(),
          created_at: new Date(ld.updatedAt).toISOString(),
          template_title: ld.name || "Offline Template",
          isLocalOnly: true,
        });
      }
    });

    return Array.from(mergedMap.values());
  };

  useEffect(() => {
    if (!localStorage.getItem("DRAFTS_CLEARED_V1")) {
      indexedDB.deleteDatabase("QHSE_Drafts_DB");
      indexedDB.deleteDatabase("KonstructDraftsDB");
      localStorage.setItem("DRAFTS_CLEARED_V1", "true");
      window.location.reload();
    }
  }, []);

  useEffect(() => {
    if (roleTabs.length > 0) {
      setActiveTab(roleTabs[0].id);
    }
  }, [activeRole]);

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line
  }, [activeRole]);

  const fetchList = async () => {
    try {
      setLoading(true);

      const resolvedOrgId = (() => {
        try {
          const user =
            JSON.parse(localStorage.getItem("USER_DATA") || "null") ||
            JSON.parse(localStorage.getItem("userData") || "null");
          return (
            user?.org ||
            user?.organization_id ||
            user?.org_id ||
            localStorage.getItem("ORG_ID") ||
            localStorage.getItem("ACTIVE_ORG_ID") ||
            null
          );
        } catch {
          return null;
        }
      })();

      const res = await fetchChecklistInstances({
        orgId: resolvedOrgId,
        assignedToMe: true,
      });
      setRows(res);

      if (activeRole === "MAKER") {
        const drafts = await loadDrafts(currentUser?.id);
        setDraftRows(drafts);
      }
    } catch (err) {
      console.error("Failed to load dashboard", err);
      toast.error("Checklist dashboard load error");
    } finally {
      setLoading(false);
    }
  };

  const handleDiscardDraft = async (row) => {
    if (!window.confirm("Are you sure you want to discard this draft? This action cannot be undone.")) return;

    try {
      let serverDeleteFailed = false;
      if (row.serverId) {
        try {
          await deleteChecklistDraft(row.serverId);
        } catch (serverErr) {
          console.error("Server-side draft deletion failed or not found:", serverErr);
          serverDeleteFailed = true;
          toast.error("Could not delete from server. It may have already been deleted.");
        }
      }
      
      if (currentUser?.id) {
        if (row.draftId) {
          await deleteLocalDraft(currentUser.id, row.draftId);
        }
        if (row.serverId) {
          await deleteLocalDraftByServerId(currentUser.id, row.serverId);
        }
      }
      
      if (!serverDeleteFailed) {
        toast.success("Draft discarded successfully");
      }
      await fetchList();
    } catch (err) {
      console.error("Failed to discard draft", err);
      toast.error("Discard draft failed");
    }
  };

  const handleOpenCreate = () => {
    navigate("/checklists/create");
  };

  const handleView = (id) => {
    if (!id) return;
    navigate(`/checklists/fill/${id}`);
  };

  const handleDownloadPDF = async (row) => {
    try {
      console.log("handleDownloadPDF started for row:", row);
      toast("Generating high-fidelity PDF report...");
      const orgId = localStorage.getItem("activeOrgId") || null;
      await downloadChecklistReportPdfFrontend(row.id, orgId);
      console.log("handleDownloadPDF finished successfully");
      toast.success("PDF report downloaded successfully!");
    } catch (err) {
      console.error("Failed to download PDF", err);
      toast.error("Failed to generate PDF report.");
    }
  };


  const activeTabConfig = roleTabs.find((t) => t.id === activeTab) || roleTabs[0];

  const filteredRows = activeTab === "DRAFT" ? draftRows : rows.filter((r) => {
    if (!activeTabConfig || !activeTabConfig.statuses.includes(r.status)) return false;
    return true;
  });

  const getStatusStyle = (status) => {
    const baseStyle = {
      display: "inline-block",
      padding: "6px 12px",
      borderRadius: "20px",
      fontSize: "11px",
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: "0.5px",
    };

    switch (String(status).toLowerCase()) {
      case "completed":
        return { ...baseStyle, background: "#d1fae5", color: "#065f46" };
      case "rework":
        return { ...baseStyle, background: "#fee2e2", color: "#991b1b" };
      case "pending_checker":
      case "pending_supervisor":
        return { ...baseStyle, background: "#fef9c3", color: "#854d0e" };
      case "in_progress":
        return { ...baseStyle, background: "#e0f2fe", color: "#075985" };
      default:
        return { ...baseStyle, background: "#f3f4f6", color: "#6b7280" };
    }
  };

  return (
    <div style={{ ...styles.container, background: bgColor }}>
      {/* Header Section */}
      <div style={styles.header}>
        <div>
          <h1 style={{ ...styles.title, color: textColor }}>QHSE Checklists</h1>
          <p style={{ ...styles.subtitle, color: subTextColor }}>
            Manage and review all assigned safety checklists
          </p>
        </div>
        <div>
          {canCreateChecklist && (
            <button onClick={handleOpenCreate} style={styles.createButton}>
              + Create Checklist
            </button>
          )}
        </div>
      </div>

      {/* Uniform Dashboard Cards / Tabs */}
      <div style={styles.cardsGrid}>
        {roleTabs.map((tab) => {
          const count = tab.id === "DRAFT" 
            ? draftRows.length 
            : rows.filter((r) => tab.statuses.includes(r.status)).length;
          const isActive = activeTab === tab.id;
          return (
            <div
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                ...styles.dashboardCard,
                background: cardBg,
                borderColor: isActive ? ORANGE : borderColor,
                boxShadow: isActive
                  ? "0 4px 14px rgba(248, 180, 80, 0.25)"
                  : "0 1px 3px rgba(0, 0, 0, 0.05)",
                transform: isActive ? "translateY(-2px)" : "none",
              }}
            >
              <div
                style={{
                  ...styles.cardLabel,
                  color: isActive ? "#f59e0b" : subTextColor,
                }}
              >
                {tab.label}
              </div>
              <div style={{ ...styles.cardValue, color: textColor }}>{count}</div>
            </div>
          );
        })}
      </div>

      {/* Table Card */}
      <div style={{ ...styles.tableCard, background: cardBg, borderColor }}>
        {loading ? (
          <div style={styles.loadingContainer}>
            <div style={styles.spinner}></div>
            <p style={{ ...styles.loadingText, color: subTextColor }}>
              Loading Checklists...
            </p>
          </div>
        ) : filteredRows.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>📭</div>
            <h3 style={{ ...styles.emptyTitle, color: textColor }}>
              No Checklists Found
            </h3>
            <p style={{ ...styles.emptyText, color: subTextColor }}>
              No checklists exist in this category.
            </p>
          </div>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr style={{ ...styles.tableHeaderRow, borderBottom: `2px solid ${borderColor}` }}>
                  {activeTab !== "DRAFT" && (
                    <th style={{ ...styles.th, color: subTextColor }}>
                      Checklist Number / Reference
                    </th>
                  )}
                  <th style={{ ...styles.th, color: subTextColor }}>Template Name</th>
                  <th style={{ ...styles.th, color: subTextColor }}>Status</th>
                  <th style={{ ...styles.th, color: subTextColor }}>Last Updated</th>
                  <th style={{ ...styles.th, color: subTextColor, textAlign: "right" }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row, index) => {
                  return (
                    <tr
                      key={row.id}
                      style={{
                        ...styles.tableRow,
                        borderBottom: `1px solid ${borderColor}`,
                        background:
                          index % 2 === 0
                            ? cardBg
                            : theme === "dark"
                            ? "#1e1e26"
                            : "#f9fafb",
                      }}
                    >
                      {activeTab !== "DRAFT" && (
                        <td style={{ ...styles.td, color: textColor }}>
                          <div style={styles.refNumber}>
                            {row.safety_report_no || `#${row.id}`}
                          </div>
                        </td>
                      )}

                      <td style={{ ...styles.td, color: textColor }}>
                        <div style={styles.templateTitle}>
                          {row.template_title || row.template_name || "Unknown Template"}
                        </div>
                      </td>

                      <td style={styles.td}>
                        <span style={getStatusStyle(row.status)}>
                          {(row.status || "N/A").replace("_", " ")}
                        </span>
                      </td>



                      <td style={{ ...styles.td, color: textColor }}>
                        <div style={styles.dateText}>
                          {row.updated_at
                            ? new Date(row.updated_at).toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : row.created_at
                            ? new Date(row.created_at).toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })
                            : "—"}
                        </div>
                      </td>

                      <td style={{ ...styles.td, textAlign: "right" }}>
                        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", alignItems: "center" }}>
                          {activeTab === "DRAFT" && (
                            <button
                              type="button"
                              onClick={() => handleDiscardDraft(row)}
                              style={{ ...styles.viewButton, background: "#ef4444" }}
                            >
                              Discard
                            </button>
                          )}
                          {(row.status === "completed" || row.status === "approved") && (
                            <button
                              type="button"
                              onClick={() => handleDownloadPDF(row)}
                              style={styles.downloadButton}
                            >
                              📥 Download PDF
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleView(row.id)}
                            style={styles.viewButton}
                          >
                            {activeTab === "DRAFT" ? "Resume Draft" : "View / Action"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!loading && filteredRows.length > 0 && (
        <div style={styles.footer}>
          <p style={{ ...styles.footerText, color: subTextColor }}>
            Showing <strong>{filteredRows.length}</strong> Checklist
            {filteredRows.length !== 1 ? "s" : ""}
          </p>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "1400px",
    margin: "0 auto",
    padding: "24px",
    paddingTop: "80px", // Accommodate fixed navbar
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    minHeight: "100vh",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "32px",
    flexWrap: "wrap",
    gap: "16px",
  },
  title: {
    fontSize: "28px",
    fontWeight: "700",
    margin: 0,
    marginBottom: "4px",
  },
  subtitle: {
    fontSize: "14px",
    margin: 0,
  },
  createButton: {
    padding: "10px 20px",
    background: "linear-gradient(135deg, #ffbe63 0%, #ff9f1c 100%)",
    color: "#1e293b",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(248, 180, 80, 0.3)",
    transition: "all 0.2s ease",
  },
  cardsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "16px",
    marginBottom: "32px",
  },
  dashboardCard: {
    padding: "20px 24px",
    borderRadius: "12px",
    border: "1px solid",
    cursor: "pointer",
    transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    gap: "8px",
  },
  cardLabel: {
    fontSize: "12px",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  cardValue: {
    fontSize: "32px",
    fontWeight: "800",
    lineHeight: "1.1",
  },
  tableCard: {
    borderRadius: "12px",
    border: "1px solid",
    overflow: "hidden",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
  },
  tableWrapper: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "14px",
  },
  tableHeaderRow: {
    background: "rgba(0, 0, 0, 0.02)",
  },
  th: {
    textAlign: "left",
    padding: "16px 20px",
    fontWeight: "600",
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    whiteSpace: "nowrap",
  },
  tableRow: {
    transition: "background 0.2s ease",
  },
  td: {
    padding: "16px 20px",
    verticalAlign: "middle",
  },
  refNumber: {
    fontWeight: "700",
  },
  templateTitle: {
    fontWeight: "600",
  },
  assigneeText: {
    fontWeight: "500",
  },
  dateText: {
    fontWeight: "500",
  },
  viewButton: {
    padding: "6px 14px",
    background: "#10b981",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s ease",
    whiteSpace: "nowrap",
  },
  downloadButton: {
    padding: "6px 14px",
    background: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s ease",
    whiteSpace: "nowrap",
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "80px 20px",
  },
  spinner: {
    width: "36px",
    height: "36px",
    border: "4px solid rgba(0,0,0,0.05)",
    borderTop: `4px solid ${ORANGE}`,
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  loadingText: {
    marginTop: "16px",
    fontSize: "14px",
    fontWeight: "500",
  },
  emptyState: {
    textAlign: "center",
    padding: "80px 20px",
  },
  emptyIcon: {
    fontSize: "48px",
    marginBottom: "16px",
  },
  emptyTitle: {
    fontSize: "16px",
    fontWeight: "600",
    marginBottom: "6px",
  },
  emptyText: {
    fontSize: "14px",
    margin: 0,
  },
  footer: {
    marginTop: "24px",
    textAlign: "center",
  },
  footerText: {
    fontSize: "13px",
  },
};
