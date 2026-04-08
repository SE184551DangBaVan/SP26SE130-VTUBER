"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getMyPostReports,
  getMyMemberReports,
} from "@/services/ReportController";
import { getPostById } from "@/services/PostController";
import { useRouter } from "next/navigation";
import { useSideBar } from "@/contexts/SideBarContext";
import "./MyReportsPage.css";

const PAGE_SIZE = 10;

export default function MyReportsPage() {
  const [activeSubTab, setActiveSubTab] = useState("postReports");
  const { sideBarRetractor } = useSideBar();

  return (
    <div className={`my-reports-management-content ${sideBarRetractor ? 'sidebar-expanded' : 'sidebar-retracted'}`}>
      <div className="my-reports-sub-tabs">
        <button
          className={`my-reports-sub-tab ${activeSubTab === "postReports" ? "active" : ""}`}
          onClick={() => setActiveSubTab("postReports")}
        >
          Post Reports
        </button>
        <button
          className={`my-reports-sub-tab ${activeSubTab === "memberReports" ? "active" : ""}`}
          onClick={() => setActiveSubTab("memberReports")}
        >
          Member Reports
        </button>
      </div>

      {activeSubTab === "postReports" && <MyPostReportsTable />}
      {activeSubTab === "memberReports" && <MyMemberReportsTable />}
    </div>
  );
}

/* ───────── My Post Reports Table ───────── */
function MyPostReportsTable() {
  const router = useRouter();
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
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [postMedia, setPostMedia] = useState(null);
  const [loadingMedia, setLoadingMedia] = useState(false);

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
      const data = await getMyPostReports(pageNo, PAGE_SIZE, sortBy);

      let items = Array.isArray(data) ? data : [];

      if (statusFilter !== "ALL") {
        items = items.filter(r => r.reportStatus === statusFilter);
      }

      if (reset) {
        setReports(items);
      } else {
        setReports(prev => [...prev, ...items]);
      }

      setHasMore(items.length === PAGE_SIZE);
      setCurrentPage(prev => reset ? 1 : prev + 1);
    } catch (err) {
      console.error("Failed to fetch my post reports:", err);
      if (reset) setReports([]);
      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [currentPage, sortBy, statusFilter]);

  const handleLoadMore = () => fetchReports(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchReports(true);
  };

  useEffect(() => {
    fetchReports(true);
  }, [sortBy, statusFilter]);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortDirection("asc");
    }
  };

  const openDetailModal = async (report) => {
    setSelectedReport(report);
    setIsDetailModalOpen(true);
    
    // Fetch post media if postId exists
    if (report.postId) {
      setLoadingMedia(true);
      try {
        const postData = await getPostById(report.postId);
        if (postData && postData.media) {
          setPostMedia(postData.media);
        } else {
          setPostMedia(null);
        }
      } catch (error) {
        console.error("Failed to fetch post media:", error);
        setPostMedia(null);
      } finally {
        setLoadingMedia(false);
      }
    }
  };

  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedReport(null);
    setPostMedia(null);
  };

  const handleViewPost = (postId) => {
    router.push(`/post/${postId}`);
  };

  const getSortIcon = (field) => sortBy !== field ? " ↕" : sortDirection === "asc" ? " ↑" : " ↓";

  const formatDateTime = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("en-US", {
      month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit"
    });
  };

  const getStatusClass = (status) => {
    switch (status?.toUpperCase()) {
      case "PENDING": return "my-report-pending";
      case "RESOLVED": return "my-report-resolved";
      default: return "my-report-unknown";
    }
  };

  if (loading) return <div className="my-reports-loading">Loading post reports...</div>;

  return (
    <div className="my-reports-table-wrapper">
      <div className="my-reports-toolbar">
        <div className="my-reports-filter-group">
          <label htmlFor="my-post-report-status">Status:</label>
          <select
            id="my-post-report-status"
            className="my-reports-filter-dropdown"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All</option>
            <option value="PENDING">Pending</option>
            <option value="RESOLVED">Resolved</option>
          </select>
        </div>
        <button className="my-toolbar-refresh-btn" onClick={handleRefresh} disabled={refreshing}>
          {refreshing ? "⟳ Refreshing..." : "⟳ Refresh"}
        </button>
      </div>

      {reports.length === 0 ? (
        <div className="my-reports-empty-message">No post reports found</div>
      ) : (
        <div className="my-moderation-table-container">
          <table className="my-moderation-table">
            <thead>
              <tr>
                <th className="my-sortable" onClick={() => handleSort("reportId")}>Report ID{getSortIcon("reportId")}</th>
                <th className="my-sortable" onClick={() => handleSort("postId")}>Post ID{getSortIcon("postId")}</th>
                <th>Post Title</th>
                <th className="my-sortable" onClick={() => handleSort("authorUsername")}>Post Author{getSortIcon("authorUsername")}</th>
                <th>Reason</th>
                <th className="my-sortable" onClick={() => handleSort("reportStatus")}>Status{getSortIcon("reportStatus")}</th>
                <th className="my-sortable" onClick={() => handleSort("reportCreatedAt")}>Date{getSortIcon("reportCreatedAt")}</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.reportId}>
                  <td className="my-report-id">#{report.reportId}</td>
                  <td className="my-post-id">#{report.postId}</td>
                  <td className="my-post-title">{report.title || "-"}</td>
                  <td className="my-post-author">{report.authorUsername || "-"}</td>
                  <td className="my-reason-cell">
                    <span className="my-reason-preview" title={report.reason}>{report.reason}</span>
                  </td>
                  <td className="my-status-cell">
                    <span className={`my-report-status-badge ${getStatusClass(report.reportStatus)}`}>{report.reportStatus}</span>
                  </td>
                  <td className="my-date-cell">{formatDateTime(report.reportCreatedAt)}</td>
                  <td className="my-action-cell">
                    <button className="my-view-btn" onClick={() => openDetailModal(report)}>View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {hasMore && (
            <div className="my-load-more-container">
              <button className="my-load-more-btn" onClick={handleLoadMore} disabled={loadingMore}>
                {loadingMore ? (
                  <span className="my-load-more-loading"><span className="my-loading-spinner">⟳</span> Loading...</span>
                ) : (
                  "Load more"
                )}
              </button>
            </div>
          )}
          {!hasMore && reports.length > 0 && (
            <div className="my-no-more-data">No more post reports to load</div>
          )}
        </div>
      )}

      {/* Detail Modal */}
      {isDetailModalOpen && selectedReport && (
        <div className="my-report-detail-overlay" onClick={closeDetailModal}>
          <div className="my-report-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="my-report-detail-header">
              <h2>Post Report Details</h2>
              <button className="my-report-detail-close" onClick={closeDetailModal}>×</button>
            </div>
            <div className="my-report-detail-body">
              <div className="my-report-info-grid">
                <div className="my-report-info-item"><span className="my-report-info-label">Report ID:</span><span className="my-report-info-value">#{selectedReport.reportId}</span></div>
                <div className="my-report-info-item"><span className="my-report-info-label">Post ID:</span><span className="my-report-info-value">#{selectedReport.postId}</span></div>
                <div className="my-report-info-item"><span className="my-report-info-label">Post Title:</span><span className="my-report-info-value">{selectedReport.title}</span></div>
                <div className="my-report-info-item"><span className="my-report-info-label">Post Author:</span><span className="my-report-info-value">{selectedReport.authorUsername || "-"}</span></div>
                <div className="my-report-info-item"><span className="my-report-info-label">Fan Hub:</span><span className="my-report-info-value">{selectedReport.fanHubName || "-"}</span></div>
                <div className="my-report-info-item"><span className="my-report-info-label">Report Status:</span><span className={`my-report-status-badge ${getStatusClass(selectedReport.reportStatus)}`}>{selectedReport.reportStatus}</span></div>
                {selectedReport.resolvedByUsername && (
                  <div className="my-report-info-item"><span className="my-report-info-label">Resolved By:</span><span className="my-report-info-value">{selectedReport.resolvedByUsername}</span></div>
                )}
                {selectedReport.resolveMessage && (
                  <div className="my-report-info-item full-width"><span className="my-report-info-label">Resolve Message:</span><span className="my-report-reason-text">{selectedReport.resolveMessage}</span></div>
                )}
                <div className="my-report-info-item full-width"><span className="my-report-info-label">Reason:</span><span className="my-report-reason-text">{selectedReport.reason}</span></div>
              </div>

              {/* Post Media Section */}
              {loadingMedia ? (
                <div className="my-report-media-loading">Loading media...</div>
              ) : postMedia && postMedia.length > 0 ? (
                <div className="my-report-media-section">
                  <h3>Post Media ({postMedia.length})</h3>
                  <div className="my-report-media-grid">
                    {postMedia.map((mediaItem) => {
                      const mediaType = mediaItem.mediaType || mediaItem.mediaUrl?.split('.').pop()?.toLowerCase();
                      const isVideo = mediaType === 'mp4' || mediaType === 'webm' || mediaType === 'ogg' || mediaItem.mediaType?.startsWith('video/');
                      
                      return (
                        <div key={mediaItem.mediaId} className="my-report-media-item">
                          {isVideo ? (
                            <video controls className="my-report-media-video">
                              <source src={mediaItem.mediaUrl} type={mediaItem.mediaType || "video/mp4"} />
                              Your browser does not support the video tag.
                            </video>
                          ) : (
                            <img
                              src={mediaItem.mediaUrl}
                              alt={`Media ${mediaItem.mediaId}`}
                              className="my-report-media-image"
                              onError={(e) => {
                                e.target.src = "/picture-not-available-photo.jpg";
                                e.target.onerror = null;
                              }}
                            />
                          )}
                          <div className="my-report-media-info">
                            <span className="my-report-media-type">{isVideo ? 'Video' : 'Image'}</span>
                            {mediaItem.aiValidationStatus && (
                              <span className={`my-report-media-ai-status ${mediaItem.aiValidationStatus === 'AI_SAFE' ? 'ai-safe' : mediaItem.aiValidationStatus === 'AI_UNSAFE' ? 'ai-unsafe' : 'ai-pending'}`}>
                                {mediaItem.aiValidationStatus}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                !loadingMedia && <div className="my-report-no-media">No media attached to this post</div>
              )}
            </div>
            <div className="my-report-detail-actions">
              <button className="my-detail-close-btn" onClick={closeDetailModal}>Close</button>
              <button className="my-detail-view-btn" onClick={() => handleViewPost(selectedReport.postId)}>View Post</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ───────── My Member Reports Table ───────── */
function MyMemberReportsTable() {
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
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

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
      const data = await getMyMemberReports(pageNo, PAGE_SIZE, sortBy);

      let items = Array.isArray(data) ? data : [];

      if (statusFilter !== "ALL") {
        items = items.filter(r => r.status === statusFilter);
      }

      if (reset) {
        setReports(items);
      } else {
        setReports(prev => [...prev, ...items]);
      }

      setHasMore(items.length === PAGE_SIZE);
      setCurrentPage(prev => reset ? 1 : prev + 1);
    } catch (err) {
      console.error("Failed to fetch my member reports:", err);
      if (reset) setReports([]);
      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [currentPage, sortBy, statusFilter]);

  const handleLoadMore = () => fetchReports(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchReports(true);
  };

  useEffect(() => {
    fetchReports(true);
  }, [sortBy, statusFilter]);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortDirection("asc");
    }
  };

  const openDetailModal = (report) => {
    setSelectedReport(report);
    setIsDetailModalOpen(true);
  };

  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedReport(null);
  };

  const getSortIcon = (field) => sortBy !== field ? " ↕" : sortDirection === "asc" ? " ↑" : " ↓";

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const getStatusClass = (status) => {
    switch (status?.toUpperCase()) {
      case "PENDING": return "my-report-pending";
      case "RESOLVED": return "my-report-resolved";
      default: return "my-report-unknown";
    }
  };

  if (loading) return <div className="my-reports-loading">Loading member reports...</div>;

  return (
    <div className="my-reports-table-wrapper">
      <div className="my-reports-toolbar">
        <div className="my-reports-filter-group">
          <label htmlFor="my-member-report-status">Status:</label>
          <select
            id="my-member-report-status"
            className="my-reports-filter-dropdown"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All</option>
            <option value="PENDING">Pending</option>
            <option value="RESOLVED">Resolved</option>
          </select>
        </div>
        <button className="my-toolbar-refresh-btn" onClick={handleRefresh} disabled={refreshing}>
          {refreshing ? "⟳ Refreshing..." : "⟳ Refresh"}
        </button>
      </div>

      {reports.length === 0 ? (
        <div className="my-reports-empty-message">No member reports found</div>
      ) : (
        <div className="my-moderation-table-container">
          <table className="my-moderation-table">
            <thead>
              <tr>
                <th className="my-sortable" onClick={() => handleSort("reportId")}>Report ID{getSortIcon("reportId")}</th>
                <th className="my-sortable" onClick={() => handleSort("reportedUsername")}>Reported User{getSortIcon("reportedUsername")}</th>
                <th>Fan Hub</th>
                <th>Reason</th>
                <th className="my-sortable" onClick={() => handleSort("status")}>Status{getSortIcon("status")}</th>
                <th className="my-sortable" onClick={() => handleSort("createdAt")}>Date{getSortIcon("createdAt")}</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.reportId}>
                  <td className="my-report-id">#{report.reportId}</td>
                  <td className="my-reported-user">{report.reportedUsername || "-"}</td>
                  <td className="my-fan-hub-cell">{report.fanHubName || "-"}</td>
                  <td className="my-reason-cell">
                    <span className="my-reason-preview" title={report.reason}>{report.reason}</span>
                  </td>
                  <td className="my-status-cell">
                    <span className={`my-report-status-badge ${getStatusClass(report.status)}`}>{report.status}</span>
                  </td>
                  <td className="my-date-cell">{formatDate(report.createdAt)}</td>
                  <td className="my-action-cell">
                    <button className="my-view-btn" onClick={() => openDetailModal(report)}>View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {hasMore && (
            <div className="my-load-more-container">
              <button className="my-load-more-btn" onClick={handleLoadMore} disabled={loadingMore}>
                {loadingMore ? (
                  <span className="my-load-more-loading"><span className="my-loading-spinner">⟳</span> Loading...</span>
                ) : (
                  "Load more"
                )}
              </button>
            </div>
          )}
          {!hasMore && reports.length > 0 && (
            <div className="my-no-more-data">No more member reports to load</div>
          )}
        </div>
      )}

      {/* Detail Modal */}
      {isDetailModalOpen && selectedReport && (
        <div className="my-report-detail-overlay" onClick={closeDetailModal}>
          <div className="my-report-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="my-report-detail-header">
              <h2>Member Report Details</h2>
              <button className="my-report-detail-close" onClick={closeDetailModal}>×</button>
            </div>
            <div className="my-report-detail-body">
              <div className="my-report-info-grid">
                <div className="my-report-info-item"><span className="my-report-info-label">Report ID:</span><span className="my-report-info-value">#{selectedReport.reportId}</span></div>
                <div className="my-report-info-item"><span className="my-report-info-label">Reported User:</span><span className="my-report-info-value">{selectedReport.reportedDisplayName || selectedReport.reportedUsername}</span></div>
                <div className="my-report-info-item"><span className="my-report-info-label">Fan Hub:</span><span className="my-report-info-value">{selectedReport.fanHubName || "-"}</span></div>
                <div className="my-report-info-item"><span className="my-report-info-label">Report Status:</span><span className={`my-report-status-badge ${getStatusClass(selectedReport.status)}`}>{selectedReport.status}</span></div>
                {selectedReport.resolvedByUsername && (
                  <div className="my-report-info-item"><span className="my-report-info-label">Resolved By:</span><span className="my-report-info-value">{selectedReport.resolvedByUsername}</span></div>
                )}
                {selectedReport.resolveMessage && (
                  <div className="my-report-info-item full-width"><span className="my-report-info-label">Resolve Message:</span><span className="my-report-reason-text">{selectedReport.resolveMessage}</span></div>
                )}
                <div className="my-report-info-item full-width"><span className="my-report-info-label">Reason:</span><span className="my-report-reason-text">{selectedReport.reason}</span></div>
              </div>
            </div>
            <div className="my-report-detail-actions">
              <button className="my-detail-close-btn" onClick={closeDetailModal}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
