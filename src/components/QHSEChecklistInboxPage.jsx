// src/components/QHSEChecklistInboxPage.jsx

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { fetchChecklistInstances } from "./QHSE/InspectionChecklists/inspectionChecklistApi";
import { downloadChecklistReportPdfFrontend } from "./QHSE/InspectionChecklists/qhsePdfGenerator";
import { useTheme } from "../ThemeContext";

const ORANGE = "#ffbe63";
const BG_OFFWHITE = "#fcfaf7";

export default function QHSEChecklistInboxPage() {
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

  const getInitialStatusFilter = (role) => {
    if (role === "SUPERVISOR") return "pending_supervisor";
    if (role === "CHECKER") return "pending_checker";
    if (role === "MAKER") return "rework";
    return "";
  };

  // filters
  const [statusFilter, setStatusFilter] = useState(() => {
    const role = getResolvedRole();
    return getInitialStatusFilter(role);
  });

  const bgColor = theme === "dark" ? "#191922" : BG_OFFWHITE;
  const cardBg = theme === "dark" ? "#23232c" : "#ffffff";
  const textColor = theme === "dark" ? "#f1f5f9" : "#1e293b";
  const subTextColor = theme === "dark" ? "#94a3b8" : "#64748b";
  const borderColor = theme === "dark" ? "#2e2e38" : "#e2e8f0";

  useEffect(() => {
    const role = getResolvedRole();
    const initialStatus = getInitialStatusFilter(role);
    setStatusFilter(initialStatus);
    fetchList(initialStatus);
  }, []);

  const fetchList = async (selectedStatus) => {
    setLoading(true);
    try {
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

      const params = {
        orgId: resolvedOrgId,
        assignedToMe: true,
      };

      const statusToUse = selectedStatus !== undefined ? selectedStatus : statusFilter;
      if (statusToUse) {
        params.status = statusToUse;
      }

      const data = await fetchChecklistInstances(params);
      setRows(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load inbox checklists");
    } finally {
      setLoading(false);
    }
  };

  const handleView = (id) => {
    if (!id) return;
    navigate(`/checklists/fill/${id}`);
  };

  const handleDownloadPDF = async (row) => {
    try {
      console.log("handleDownloadPDF started for row:", row);
      toast.info("Generating high-fidelity PDF report...");
      const orgId = localStorage.getItem("activeOrgId") || null;
      await downloadChecklistReportPdfFrontend(row.id, orgId);
      console.log("handleDownloadPDF finished successfully");
      toast.success("PDF report downloaded successfully!");
    } catch (err) {
      console.error("Failed to download PDF", err);
      toast.error("Failed to generate PDF report.");
    }
  };

  const handleApplyFilters = () => {
    fetchList(statusFilter);
  };

  const handleClearFilters = () => {
    setStatusFilter("");
    fetchList("");
  };

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

  const pendingCount = rows.filter(
    (r) => r.status === "pending_checker" || r.status === "pending_supervisor"
  ).length;

  const completedCount = rows.filter((r) => r.status === "completed").length;
  const reworkCount = rows.filter((r) => r.status === "rework").length;

  return (
    <div style={{ ...styles.container, background: bgColor }}>
      <div style={styles.header}>
        <div>
          <h1 style={{ ...styles.title, color: textColor }}>QHSE Checklist Inbox</h1>
          <p style={{ ...styles.subtitle, color: subTextColor }}>
            Manage and review checklists pending your approval
          </p>
        </div>
      </div>

      {/* Uniform Dashboard Cards */}
      <div style={styles.cardsGrid}>
        <div style={{ ...styles.dashboardCard, background: cardBg, borderColor }}>
          <div style={{ ...styles.cardLabel, color: subTextColor }}>Total Assigned</div>
          <div style={{ ...styles.cardValue, color: textColor }}>{rows.length}</div>
        </div>

        <div style={{ ...styles.dashboardCard, background: cardBg, borderColor }}>
          <div style={{ ...styles.cardLabel, color: "#f59e0b" }}>Pending Review</div>
          <div style={{ ...styles.cardValue, color: textColor }}>{pendingCount}</div>
        </div>

        <div style={{ ...styles.dashboardCard, background: cardBg, borderColor }}>
          <div style={{ ...styles.cardLabel, color: "#10b981" }}>Completed</div>
          <div style={{ ...styles.cardValue, color: textColor }}>{completedCount}</div>
        </div>

        <div style={{ ...styles.dashboardCard, background: cardBg, borderColor }}>
          <div style={{ ...styles.cardLabel, color: "#ef4444" }}>Rework</div>
          <div style={{ ...styles.cardValue, color: textColor }}>{reworkCount}</div>
        </div>
      </div>

      {/* Filters Card */}
      <div style={{ ...styles.filtersCard, background: cardBg, borderColor }}>
        <div style={styles.filtersHeader}>
          <h3 style={{ ...styles.filtersTitle, color: textColor }}>Filters</h3>
          {statusFilter && (
            <button type="button" onClick={handleClearFilters} style={styles.clearButton}>
              ✕ Clear All
            </button>
          )}
        </div>

        <div style={styles.filtersGrid}>
          <div style={styles.filterGroup}>
            <label style={{ ...styles.filterLabel, color: subTextColor }}>Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ ...styles.filterSelect, background: cardBg, color: textColor, borderColor }}
            >
              <option value="">All Statuses</option>
              <option value="in_progress">In Progress</option>
              <option value="pending_checker">Pending Checker</option>
              <option value="pending_supervisor">Pending Supervisor</option>
              <option value="rework">Rework</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>&nbsp;</label>
            <button type="button" onClick={handleApplyFilters} style={styles.applyButton}>
              Apply Filters
            </button>
          </div>
        </div>
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
        ) : rows.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>📭</div>
            <h3 style={{ ...styles.emptyTitle, color: textColor }}>
              No Checklists Found
            </h3>
            <p style={{ ...styles.emptyText, color: subTextColor }}>
              No checklists are currently assigned to you.
            </p>
          </div>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr style={{ ...styles.tableHeaderRow, borderBottom: `2px solid ${borderColor}` }}>
                  <th style={{ ...styles.th, color: subTextColor }}>
                    Checklist Number / Reference
                  </th>
                  <th style={{ ...styles.th, color: subTextColor }}>Template Name</th>
                  <th style={{ ...styles.th, color: subTextColor }}>Status</th>
                  <th style={{ ...styles.th, color: subTextColor }}>Last Updated</th>
                  <th style={{ ...styles.th, color: subTextColor, textAlign: "right" }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => {
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
                      <td style={{ ...styles.td, color: textColor }}>
                        <div style={styles.refNumber}>
                          {row.safety_report_no || `#${row.id}`}
                        </div>
                      </td>

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
                            Review & Action
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

      {!loading && rows.length > 0 && (
        <div style={styles.footer}>
          <p style={{ ...styles.footerText, color: subTextColor }}>
            Showing <strong>{rows.length}</strong> Checklist
            {rows.length !== 1 ? "s" : ""}
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
  filtersCard: {
    padding: "20px",
    borderRadius: "12px",
    border: "1px solid",
    marginBottom: "24px",
  },
  filtersHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
  },
  filtersTitle: {
    fontSize: "16px",
    fontWeight: "600",
    margin: 0,
  },
  clearButton: {
    padding: "6px 12px",
    background: "#fee2e2",
    color: "#991b1b",
    border: "none",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  filtersGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "16px",
    alignItems: "end",
  },
  filterGroup: {
    display: "flex",
    flexDirection: "column",
  },
  filterLabel: {
    fontSize: "13px",
    fontWeight: "600",
    marginBottom: "6px",
  },
  filterSelect: {
    padding: "10px 12px",
    border: "1px solid",
    borderRadius: "8px",
    fontSize: "14px",
    cursor: "pointer",
    transition: "border-color 0.2s ease",
    boxSizing: "border-box",
  },
  applyButton: {
    padding: "10px 20px",
    background: "#10b981",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s ease",
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
