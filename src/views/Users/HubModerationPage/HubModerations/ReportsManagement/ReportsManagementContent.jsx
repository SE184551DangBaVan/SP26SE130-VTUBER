"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getPostReports,
  getMemberReports,
  getPendingPostReports,
  getPendingMemberReports,
  resolvePostReport,
  resolveMemberReport,
} from "@/services/ReportController";
import "./ReportsManagementContent.css";

const PAGE_SIZE = 10;
const REPORT_TYPE = { POST: "POST", MEMBER: "MEMBER" };

export default function ReportsManagementContent({ fanHubId }) {
  const [activeSubTab, setActiveSubTab] = useState("postReports");

  return (
    <div className="reports-management-content">
      <div className="reports-sub-tabs">
        <button
          className={`reports-sub-tab ${activeSubTab === "postReports" ? "active" : ""}`}
          onClick={() => setActiveSubTab("postReports")}
        >
          Post Reports
        </button>
        <button
          className={`reports-sub-tab ${activeSubTab === "memberReports" ? "active" : ""}`}
          onClick={() => setActiveSubTab("memberReports")}
        >
          Member Reports
        </button>
      </div>

      {fanHubId && activeSubTab === "postReports" && <PostReportsTable fanHubId={fanHubId} />}
      {fanHubId && activeSubTab === "memberReports" && <MemberReportsTable fanHubId={fanHubId} />}
    </div>
  );
}

/* ───────── Post Reports Table ───────── */
function PostReportsTable({ fanHubId }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDirection, setSortDirection] = useState("desc");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [refreshing, setRefreshing] = useState(false);

  const [selectedReport, setSelectedReport] = useState(null);
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [resolveMessage, setResolveMessage] = useState("");
  const [resolving, setResolving] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });

  const fetchReports = useCallback(async (reset = false) => {
    if (reset) {
      setLoading(true);
      setReports([]);
      setCurrentPage(0);
      setHasMore(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const pageNo = reset ? 0 : currentPage;
      // Use pending API when filter is PENDING, otherwise use all reports API
      const fetcher = statusFilter === "PENDING" ? getPendingPostReports : getPostReports;
      const data = await fetcher(fanHubId, pageNo, PAGE_SIZE, sortBy);

      let items = Array.isArray(data) ? data : [];

      // For SOLVED filter, we need to filter client-side from all reports
      if (statusFilter === "SOLVED") {
        const allData = await getPostReports(fanHubId, pageNo, PAGE_SIZE, sortBy);
        items = Array.isArray(allData) ? allData.filter(r => r.reportStatus === "RESOLVED") : [];
      }

      if (reset) {
        setReports(items);
      } else {
        setReports(prev => [...prev, ...items]);
      }

      setHasMore(items.length === PAGE_SIZE);
      setCurrentPage(prev => reset ? 1 : prev + 1);
    } catch (err) {
      console.error("Failed to fetch post reports:", err);
      if (reset) setReports([]);
      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [fanHubId, currentPage, sortBy, statusFilter]);

  const handleLoadMore = () => fetchReports(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchReports(true);
  };

  useEffect(() => {
    if (!fanHubId) return;
    fetchReports(true);
  }, [fanHubId, sortBy, statusFilter]);

  const showToast = (message, type) => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortDirection("asc");
    }
  };

  const openResolveModal = (report) => {
    setSelectedReport(report);
    setResolveMessage("");
    setIsResolveModalOpen(true);
  };

  const closeResolveModal = () => {
    setIsResolveModalOpen(false);
    setSelectedReport(null);
    setResolveMessage("");
  };

  const handleResolve = async () => {
    if (!resolveMessage.trim()) {
      showToast("Please provide a resolution message", "error");
      return;
    }
    setResolving(true);
    try {
      const result = await resolvePostReport(selectedReport.reportId, resolveMessage.trim());
      if (result?.success) {
        showToast("Report resolved successfully!", "success");
        await fetchReports(true);
        closeResolveModal();
      } else {
        throw new Error(result?.message || "Failed to resolve report");
      }
    } catch (err) {
      console.error("Resolve report error:", err);
      showToast(err.message || "Failed to resolve report", "error");
    } finally {
      setResolving(false);
    }
  };

  const getSortIcon = (field) => sortBy !== field ? " ↕" : sortDirection === "asc" ? " ↑" : " ↓";

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("en-US", {
      month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit"
    });
  };

  const getStatusClass = (status) => {
    switch (status?.toUpperCase()) {
      case "PENDING": return "report-pending";
      case "RESOLVED": return "report-resolved";
      default: return "report-unknown";
    }
  };

  if (loading) return <div className="loading">Loading post reports...</div>;

  return (
    <div className="reports-table-wrapper">
      <div className="reports-toolbar">
        <div className="reports-filter-group">
          <label htmlFor="post-report-status">Status:</label>
          <select
            id="post-report-status"
            className="reports-filter-dropdown"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All</option>
            <option value="PENDING">Pending</option>
            <option value="SOLVED">Solved</option>
          </select>
        </div>
        <button className="toolbar-refresh-btn" onClick={handleRefresh} disabled={refreshing}>
          {refreshing ? "⟳ Refreshing..." : "⟳ Refresh"}
        </button>
      </div>

      {toast.show && <div className={`toast-notification ${toast.type}`}>{toast.message}</div>}

      {reports.length === 0 ? (
        <div className="empty-message">No post reports found</div>
      ) : (
        <div className="moderation-table-container">
          <table className="moderation-table">
            <thead>
              <tr>
                <th className="sortable" onClick={() => handleSort("reportId")}>Report ID{getSortIcon("reportId")}</th>
                <th className="sortable" onClick={() => handleSort("postId")}>Post ID{getSortIcon("postId")}</th>
                <th>Post Title</th>
                <th className="sortable" onClick={() => handleSort("authorUsername")}>Post Author{getSortIcon("authorUsername")}</th>
                <th className="sortable" onClick={() => handleSort("reportedByUsername")}>Reported By{getSortIcon("reportedByUsername")}</th>
                <th>Reason</th>
                <th className="sortable" onClick={() => handleSort("reportStatus")}>Status{getSortIcon("reportStatus")}</th>
                <th className="sortable" onClick={() => handleSort("reportCreatedAt")}>Date{getSortIcon("reportCreatedAt")}</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.reportId}>
                  <td className="report-id">#{report.reportId}</td>
                  <td className="post-id">#{report.postId}</td>
                  <td className="post-title">{report.title || "-"}</td>
                  <td className="post-author">{report.authorUsername || "-"}</td>
                  <td className="reported-by">{report.reportedByUsername || "-"}</td>
                  <td className="reason-cell">
                    <span className="reason-preview" title={report.reason}>{report.reason}</span>
                  </td>
                  <td className="status-cell">
                    <span className={`report-status-badge ${getStatusClass(report.reportStatus)}`}>{report.reportStatus}</span>
                  </td>
                  <td className="date-cell">{formatDateTime(report.reportCreatedAt)}</td>
                  <td className="action-cell">
                    {report.reportStatus === "PENDING" ? (
                      <button className="resolve-btn" onClick={() => openResolveModal(report)}>Resolve</button>
                    ) : (
                      <span className="resolved-label">Done</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {hasMore && (
            <div className="load-more-container">
              <button className="load-more-btn" onClick={handleLoadMore} disabled={loadingMore}>
                {loadingMore ? (
                  <span className="load-more-loading"><span className="loading-spinner">⟳</span> Loading...</span>
                ) : (
                  "Load more"
                )}
              </button>
            </div>
          )}
          {!hasMore && reports.length > 0 && (
            <div className="no-more-data">No more post reports to load</div>
          )}
        </div>
      )}

      {/* Resolve Modal */}
      {isResolveModalOpen && selectedReport && (
        <div className="report-resolve-overlay" onClick={closeResolveModal}>
          <div className="report-resolve-modal" onClick={(e) => e.stopPropagation()}>
            <div className="report-resolve-header">
              <h2>Resolve Post Report</h2>
              <button className="report-resolve-close" onClick={closeResolveModal}>×</button>
            </div>
            <div className="report-resolve-body">
              <div className="report-info-grid">
                <div className="report-info-item"><span className="report-info-label">Report ID:</span><span className="report-info-value">#{selectedReport.reportId}</span></div>
                <div className="report-info-item"><span className="report-info-label">Post ID:</span><span className="report-info-value">#{selectedReport.postId}</span></div>
                <div className="report-info-item"><span className="report-info-label">Post Title:</span><span className="report-info-value">{selectedReport.title}</span></div>
                <div className="report-info-item"><span className="report-info-label">Post Author:</span><span className="report-info-value">{selectedReport.authorUsername || "-"}</span></div>
                <div className="report-info-item"><span className="report-info-label">Reported By:</span><span className="report-info-value">{selectedReport.reportedByUsername || "-"}</span></div>
                <div className="report-info-item"><span className="report-info-label">Report Status:</span><span className={`report-status-badge ${getStatusClass(selectedReport.reportStatus)}`}>{selectedReport.reportStatus}</span></div>
                {selectedReport.resolvedByUsername && (
                  <div className="report-info-item"><span className="report-info-label">Resolved By:</span><span className="report-info-value">{selectedReport.resolvedByUsername}</span></div>
                )}
                {selectedReport.resolveMessage && (
                  <div className="report-info-item full-width"><span className="report-info-label">Resolve Message:</span><span className="report-info-value report-reason-text">{selectedReport.resolveMessage}</span></div>
                )}
                <div className="report-info-item full-width"><span className="report-info-label">Reason:</span><span className="report-info-value report-reason-text">{selectedReport.reason}</span></div>
              </div>
              <div className="resolve-form-group">
                <label htmlFor="resolve-message">Resolution Message <span className="required">*</span></label>
                <textarea
                  id="resolve-message"
                  className="resolve-textarea"
                  placeholder="Provide your resolution reason..."
                  value={resolveMessage}
                  onChange={(e) => setResolveMessage(e.target.value)}
                  rows={4}
                  disabled={resolving}
                />
              </div>
            </div>
            <div className="report-resolve-actions">
              <button className="resolve-cancel-btn" onClick={closeResolveModal} disabled={resolving}>Cancel</button>
              <button className="resolve-confirm-btn" onClick={handleResolve} disabled={resolving || !resolveMessage.trim()}>
                {resolving ? "Resolving..." : "Confirm Resolve"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ───────── Member Reports Table ───────── */
function MemberReportsTable({ fanHubId }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDirection, setSortDirection] = useState("desc");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [refreshing, setRefreshing] = useState(false);

  const [selectedReport, setSelectedReport] = useState(null);
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [resolveMessage, setResolveMessage] = useState("");
  const [resolving, setResolving] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });

  const fetchReports = useCallback(async (reset = false) => {
    if (reset) {
      setLoading(true);
      setReports([]);
      setCurrentPage(0);
      setHasMore(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const pageNo = reset ? 0 : currentPage;
      // Use pending API when filter is PENDING, otherwise use all reports API
      const fetcher = statusFilter === "PENDING" ? getPendingMemberReports : getMemberReports;
      const data = await fetcher(fanHubId, pageNo, PAGE_SIZE, sortBy);

      let items = Array.isArray(data) ? data : [];

      // For SOLVED filter, we need to filter client-side from all reports
      if (statusFilter === "SOLVED") {
        const allData = await getMemberReports(fanHubId, pageNo, PAGE_SIZE, sortBy);
        items = Array.isArray(allData) ? allData.filter(r => r.status === "RESOLVED") : [];
      }

      if (reset) {
        setReports(items);
      } else {
        setReports(prev => [...prev, ...items]);
      }

      setHasMore(items.length === PAGE_SIZE);
      setCurrentPage(prev => reset ? 1 : prev + 1);
    } catch (err) {
      console.error("Failed to fetch member reports:", err);
      if (reset) setReports([]);
      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [fanHubId, currentPage, sortBy, statusFilter]);

  const handleLoadMore = () => fetchReports(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchReports(true);
  };

  useEffect(() => {
    if (!fanHubId) return;
    fetchReports(true);
  }, [fanHubId, sortBy, statusFilter]);

  const showToast = (message, type) => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortDirection("asc");
    }
  };

  const openResolveModal = (report) => {
    setSelectedReport(report);
    setResolveMessage("");
    setIsResolveModalOpen(true);
  };

  const closeResolveModal = () => {
    setIsResolveModalOpen(false);
    setSelectedReport(null);
    setResolveMessage("");
  };

  const handleResolve = async () => {
    if (!resolveMessage.trim()) {
      showToast("Please provide a resolution message", "error");
      return;
    }
    setResolving(true);
    try {
      const result = await resolveMemberReport(selectedReport.reportId, resolveMessage.trim());
      if (result?.success) {
        showToast("Report resolved successfully!", "success");
        await fetchReports(true);
        closeResolveModal();
      } else {
        throw new Error(result?.message || "Failed to resolve report");
      }
    } catch (err) {
      console.error("Resolve report error:", err);
      showToast(err.message || "Failed to resolve report", "error");
    } finally {
      setResolving(false);
    }
  };

  const getSortIcon = (field) => sortBy !== field ? " ↕" : sortDirection === "asc" ? " ↑" : " ↓";

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const getStatusClass = (status) => {
    switch (status?.toUpperCase()) {
      case "PENDING": return "report-pending";
      case "RESOLVED": return "report-resolved";
      default: return "report-unknown";
    }
  };

  if (loading) return <div className="loading">Loading member reports...</div>;

  return (
    <div className="reports-table-wrapper">
      <div className="reports-toolbar">
        <div className="reports-filter-group">
          <label htmlFor="member-report-status">Status:</label>
          <select
            id="member-report-status"
            className="reports-filter-dropdown"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All</option>
            <option value="PENDING">Pending</option>
            <option value="SOLVED">Solved</option>
          </select>
        </div>
        <button className="toolbar-refresh-btn" onClick={handleRefresh} disabled={refreshing}>
          {refreshing ? "⟳ Refreshing..." : "⟳ Refresh"}
        </button>
      </div>

      {toast.show && <div className={`toast-notification ${toast.type}`}>{toast.message}</div>}

      {reports.length === 0 ? (
        <div className="empty-message">No member reports found</div>
      ) : (
        <div className="moderation-table-container">
          <table className="moderation-table">
            <thead>
              <tr>
                <th className="sortable" onClick={() => handleSort("reportId")}>Report ID{getSortIcon("reportId")}</th>
                <th className="sortable" onClick={() => handleSort("reportedByUsername")}>Reported By{getSortIcon("reportedByUsername")}</th>
                <th className="sortable" onClick={() => handleSort("reportedUsername")}>Reported User{getSortIcon("reportedUsername")}</th>
                <th>Fan Hub</th>
                <th>Reason</th>
                <th className="sortable" onClick={() => handleSort("status")}>Status{getSortIcon("status")}</th>
                <th className="sortable" onClick={() => handleSort("createdAt")}>Date{getSortIcon("createdAt")}</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.reportId}>
                  <td className="report-id">#{report.reportId}</td>
                  <td className="reported-by">{report.reportedByUsername || "-"}</td>
                  <td className="reported-user">{report.reportedUsername || "-"}</td>
                  <td className="fan-hub-cell">{report.fanHubName || "-"}</td>
                  <td className="reason-cell">
                    <span className="reason-preview" title={report.reason}>{report.reason}</span>
                  </td>
                  <td className="status-cell">
                    <span className={`report-status-badge ${getStatusClass(report.status)}`}>{report.status}</span>
                  </td>
                  <td className="date-cell">{formatDate(report.createdAt)}</td>
                  <td className="action-cell">
                    {report.status === "PENDING" ? (
                      <button className="resolve-btn" onClick={() => openResolveModal(report)}>Resolve</button>
                    ) : (
                      <span className="resolved-label">Done</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {hasMore && (
            <div className="load-more-container">
              <button className="load-more-btn" onClick={handleLoadMore} disabled={loadingMore}>
                {loadingMore ? (
                  <span className="load-more-loading"><span className="loading-spinner">⟳</span> Loading...</span>
                ) : (
                  "Load more"
                )}
              </button>
            </div>
          )}
          {!hasMore && reports.length > 0 && (
            <div className="no-more-data">No more member reports to load</div>
          )}
        </div>
      )}

      {/* Resolve Modal */}
      {isResolveModalOpen && selectedReport && (
        <div className="report-resolve-overlay" onClick={closeResolveModal}>
          <div className="report-resolve-modal" onClick={(e) => e.stopPropagation()}>
            <div className="report-resolve-header">
              <h2>Resolve Member Report</h2>
              <button className="report-resolve-close" onClick={closeResolveModal}>×</button>
            </div>
            <div className="report-resolve-body">
              <div className="report-info-grid">
                <div className="report-info-item"><span className="report-info-label">Report ID:</span><span className="report-info-value">#{selectedReport.reportId}</span></div>
                <div className="report-info-item"><span className="report-info-label">Reported User:</span><span className="report-info-value">{selectedReport.reportedDisplayName || selectedReport.reportedUsername}</span></div>
                <div className="report-info-item"><span className="report-info-label">Fan Hub:</span><span className="report-info-value">{selectedReport.fanHubName}</span></div>
                <div className="report-info-item"><span className="report-info-label">Reported By:</span><span className="report-info-value">{selectedReport.reportedByUsername || "-"}</span></div>
                <div className="report-info-item"><span className="report-info-label">Report Status:</span><span className={`report-status-badge ${getStatusClass(selectedReport.status)}`}>{selectedReport.status}</span></div>
                {selectedReport.resolvedByUsername && (
                  <div className="report-info-item"><span className="report-info-label">Resolved By:</span><span className="report-info-value">{selectedReport.resolvedByUsername}</span></div>
                )}
                {selectedReport.resolveMessage && (
                  <div className="report-info-item full-width"><span className="report-info-label">Resolve Message:</span><span className="report-info-value report-reason-text">{selectedReport.resolveMessage}</span></div>
                )}
                <div className="report-info-item full-width"><span className="report-info-label">Reason:</span><span className="report-info-value report-reason-text">{selectedReport.reason}</span></div>
              </div>
              <div className="resolve-form-group">
                <label htmlFor="resolve-message">Resolution Message <span className="required">*</span></label>
                <textarea
                  id="resolve-message"
                  className="resolve-textarea"
                  placeholder="Provide your resolution reason..."
                  value={resolveMessage}
                  onChange={(e) => setResolveMessage(e.target.value)}
                  rows={4}
                  disabled={resolving}
                />
              </div>
            </div>
            <div className="report-resolve-actions">
              <button className="resolve-cancel-btn" onClick={closeResolveModal} disabled={resolving}>Cancel</button>
              <button className="resolve-confirm-btn" onClick={handleResolve} disabled={resolving || !resolveMessage.trim()}>
                {resolving ? "Resolving..." : "Confirm Resolve"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
