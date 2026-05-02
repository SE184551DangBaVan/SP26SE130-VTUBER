"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/functions/Auth/useAuth.jsx";
import { reviewPost } from "@/services/ModeratorController.jsx";
import { getPostsWithReports, bulkResolveReports } from "@/services/ReportController";

const PAGE_SIZE = 10;

export default function PostReportsTable({ fanHubId, isOwner }) {
  const { userAuth } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [sortBy] = useState("createdAt");
  const [refreshing, setRefreshing] = useState(false);

  const [selectedPost, setSelectedPost] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isTakeDownModalOpen, setIsTakeDownModalOpen] = useState(false);
  const [resolveMessage, setResolveMessage] = useState("");
  const [resolving, setResolving] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });

  const fetchPosts = useCallback(async (reset = false) => {
    if (reset) {
      setLoading(true);
      setPosts([]);
      setCurrentPage(0);
      setHasMore(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const pageNo = reset ? 0 : currentPage;
      const result = await getPostsWithReports(fanHubId, pageNo, PAGE_SIZE, sortBy);

      let items = [];
      if (result?.success && result?.data) {
        items = Array.isArray(result.data) ? result.data : [];
      }

      if (reset) {
        setPosts(items);
      } else {
        setPosts((prev) => [...prev, ...items]);
      }

      setHasMore(items.length === PAGE_SIZE);
      setCurrentPage((prev) => (reset ? 1 : prev + 1));
    } catch (err) {
      console.error("Failed to fetch post reports:", err);
      if (reset) setPosts([]);
      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [fanHubId, currentPage, sortBy]);

  const handleLoadMore = () => fetchPosts(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPosts(true);
  };

  useEffect(() => {
    if (!fanHubId) return;
    fetchPosts(true);
  }, [fanHubId, sortBy]);

  const showToast = (message, type) => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
  };

  const openDetailsModal = (post) => {
    setSelectedPost(post);
    setResolveMessage("");
    setIsDetailsModalOpen(true);
  };

  const closeDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedPost(null);
    setResolveMessage("");
  };

  const handleResolveAll = async () => {
    if (!resolveMessage.trim()) {
      showToast("Please provide a resolution message", "error");
      return;
    }

    const currentUsername = userAuth?.email;
    const postAuthor = selectedPost.authorUsername;

    if (postAuthor && currentUsername && postAuthor === currentUsername && !isOwner) {
      showToast("You cannot resolve reports against your own posts", "error");
      return;
    }

    const isReportedBySelf = selectedPost.reports.some(
      (r) => r.reportedByUsername === currentUsername
    );
    if (isReportedBySelf && !isOwner) {
      showToast("You cannot resolve reports against yourself", "error");
      return;
    }

    const pendingReports = selectedPost.reports.filter((r) => r.reportStatus === "PENDING");
    if (pendingReports.length === 0) {
      showToast("No pending reports to resolve", "error");
      return;
    }

    const reportIds = pendingReports.map((r) => r.reportId);

    setResolving(true);
    try {
      const result = await bulkResolveReports(reportIds, resolveMessage.trim());
      if (result?.success) {
        showToast(result.message || "Reports resolved successfully!", "success");
        await fetchPosts(true);
        closeDetailsModal();
      } else {
        throw new Error(result?.message || "Failed to resolve reports");
      }
    } catch (err) {
      console.error("Resolve reports error:", err);
      showToast(err.message || "Failed to resolve reports", "error");
    } finally {
      setResolving(false);
    }
  };

  const handleViewPost = (postId) => {
    window.open(`/posts?id=${postId}`, "_blank");
  };

  const handleTakeDown = () => {
    setIsTakeDownModalOpen(true);
  };

  const confirmTakeDown = async () => {
    if (!selectedPost) return;
    try {
      const result = await reviewPost(selectedPost.postId, "REJECTED");
      if (result?.success) {
        showToast("Post taken down successfully!", "success");
        await fetchPosts(true); // Refresh the list
        setSelectedPost(prev => ({ ...prev, status: "REJECTED" }));
        setIsTakeDownModalOpen(false);
      } else {
        showToast("Failed to take down post", "error");
      }
    } catch (err) {
      console.error("Take down error:", err);
      showToast("Error taking down post", "error");
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPostStatusClass = (status) => {
    switch (status?.toUpperCase()) {
      case "APPROVED": return "status-approved";
      case "PENDING": return "status-pending";
      case "REJECTED": return "status-rejected";
      default: return "status-unknown";
    }
  };

  const getReportStatusClass = (status) => {
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
        <button className="toolbar-refresh-btn" onClick={handleRefresh} disabled={refreshing}>
          {refreshing ? "⟳ Refreshing..." : "⟳ Refresh"}
        </button>
      </div>

      {toast.show && <div className={`toast-notification ${toast.type}`}>{toast.message}</div>}

      {posts.length === 0 ? (
        <div className="empty-message">No pending post reports found</div>
      ) : (
        <div className="moderation-table-container">
          <table className="moderation-table">
            <thead>
              <tr>
                <th>Post ID</th>
                <th>Post Title</th>
                <th>Author</th>
                <th>Status</th>
                <th>Reports</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => {
                const totalReports = post.reports?.length || 0;

                return (
                  <tr key={post.postId}>
                    <td className="post-id">#{post.postId}</td>
                    <td className="post-title">{post.title || "-"}</td>
                    <td className="post-author">{post.authorUsername || "-"}</td>
                    <td className="status-cell">
                      <span className={`post-status-badge ${getPostStatusClass(post.status)}`}>
                        {post.status}
                      </span>
                    </td>
                    <td className="reports-count">{totalReports}</td>
                    <td className="date-cell">{formatDateTime(post.postCreatedAt)}</td>
                    <td className="action-cell">
                      <button
                        className="view-details-btn"
                        onClick={() => openDetailsModal(post)}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {hasMore && (
            <div className="load-more-container">
              <button
                className="load-more-btn"
                onClick={handleLoadMore}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <span className="load-more-loading">
                    <span className="loading-spinner">⟳</span> Loading...
                  </span>
                ) : (
                  "Load more"
                )}
              </button>
            </div>
          )}
          {!hasMore && posts.length > 0 && (
            <div className="no-more-data">No more post reports to load</div>
          )}
        </div>
      )}

      {/* Post Details Modal */}
      {isDetailsModalOpen && selectedPost && (
        <div className="report-resolve-overlay" onClick={closeDetailsModal}>
          <div className="post-details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="post-details-header">
              <h2>Post Report Details</h2>
              <button className="report-details-close" onClick={closeDetailsModal}>
                ×
              </button>
            </div>
            <div className="post-details-body">
              <div className="post-info-section">
                <h3>Post Information</h3>
                <div className="report-info-grid">
                  <div className="report-info-item"><span className="report-info-label">Post ID:</span><span className="report-info-value">#{selectedPost.postId}</span></div>
                  <div className="report-info-item"><span className="report-info-label">Author:</span><span className="report-info-value">{selectedPost.authorDisplayName || selectedPost.authorUsername}</span></div>
                  <div className="report-info-item"><span className="report-info-label">Member ID:</span><span className="report-info-value">#{selectedPost.authorMemberId || "N/A"}</span></div>
                  <div className="report-info-item"><span className="report-info-label">Fan Hub:</span><span className="report-info-value">{selectedPost.fanHubName}</span></div>
                  <div className="report-info-item"><span className="report-info-label">Post Type:</span><span className="report-info-value">{selectedPost.postType}</span></div>
                  <div className="report-info-item"><span className="report-info-label">Status:</span><span className={`post-status-badge ${getPostStatusClass(selectedPost.status)}`}>{selectedPost.status}</span></div>
                  {selectedPost.hashtags && selectedPost.hashtags.length > 0 && (
                    <div className="report-info-item full-width"><span className="report-info-label">Hashtags:</span><span className="report-info-value">{selectedPost.hashtags.map((tag) => `#${tag}`).join(", ")}</span></div>
                  )}
                  <div className="report-info-item full-width"><span className="report-info-label">Content:</span><span className="report-info-value report-reason-text">{selectedPost.content}</span></div>
                </div>

                {/* Poll Details Section for Reported Post - Options Only */}
                {selectedPost.postType === 'POLL' && selectedPost.voteOptions && (
                  <div className="report-poll-section">
                    <h3>Poll Options</h3>
                    <div className="report-poll-options">
                      {selectedPost.voteOptions.map((option, index) => (
                        <div key={option.id} className="report-poll-option simple">
                          <span className="report-poll-option-number">{index + 1}.</span>
                          <span className="report-poll-option-text">{option.optionText}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedPost.mediaUrls && selectedPost.mediaUrls.length > 0 && (
                  <div className="report-media-section">
                    <span className="report-info-label">Post Media:</span>
                    <div className="report-media-grid">
                      {selectedPost.mediaUrls.map((url, idx) => (
                        <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="report-media-thumb"><img src={url} alt={`Media ${idx + 1}`} onError={(e) => { e.target.src = "/placeholder-image.png"; }} /></a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="reports-list-section">
                <h3>Reports ({selectedPost.reports?.length || 0}) {selectedPost.reports?.filter((r) => r.reportStatus === "PENDING").length > 0 && (<span className="pending-reports-indicator">{selectedPost.reports.filter((r) => r.reportStatus === "PENDING").length} pending</span>)}</h3>
                <div className="reports-list">
                  {selectedPost.reports?.map((report) => (
                    <div key={report.reportId} className="report-card">
                      <div className="report-card-header"><span className="report-card-id">Report #{report.reportId}</span><span className={`report-status-badge ${getReportStatusClass(report.reportStatus)}`}>{report.reportStatus}</span></div>
                      <div className="report-card-body">
                        <div className="report-row"><span className="report-label">Reported By:</span><span className="report-value">{report.reportedByDisplayName || report.reportedByUsername} (Member ID: #{report.reportedByMemberId || "N/A"})</span></div>
                        <div className="report-row"><span className="report-label">Reason:</span><span className="report-value">{report.reason}</span></div>
                        <div className="report-row"><span className="report-label">Date:</span><span className="report-value">{formatDateTime(report.reportCreatedAt)}</span></div>
                        {report.reportStatus === "RESOLVED" && (
                          <><div className="report-row"><span className="report-label">Resolved By:</span><span className="report-value">{report.resolvedByDisplayName || report.resolvedByUsername || "-"}</span></div>{report.resolveMessage && (<div className="report-row full-width"><span className="report-label">Resolution:</span><span className="report-value">{report.resolveMessage}</span></div>)}</>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {selectedPost.reports?.some((r) => r.reportStatus === "PENDING") && (
                <div className="resolve-form-section">
                  <h3>Resolve All Pending Reports</h3>
                  <div className="resolve-form-group"><label htmlFor="resolve-message">Resolution Message <span className="required">*</span></label><textarea id="resolve-message" className="resolve-textarea" placeholder="Provide your resolution reason..." value={resolveMessage} onChange={(e) => setResolveMessage(e.target.value)} rows={4} disabled={resolving} /></div>
                </div>
              )}
            </div>
            <div className="post-details-actions">
              <button className="resolve-cancel-btn" onClick={closeDetailsModal} disabled={resolving}>Cancel</button>
              <button className="resolve-view-btn" onClick={() => handleViewPost(selectedPost.postId)}>View Post</button>
              {selectedPost.status === "APPROVED" && (
                <button className="resolve-takedown-btn" onClick={handleTakeDown} disabled={resolving}>Take Down</button>
              )}
              {selectedPost.reports?.some((r) => r.reportStatus === "PENDING") && (
                <button className="resolve-confirm-btn" onClick={handleResolveAll} disabled={resolving || !resolveMessage.trim()}>{resolving ? "Resolving..." : `Resolve ${selectedPost.reports.filter((r) => r.reportStatus === "PENDING").length} Pending Report(s)`}</button>
              )}
            </div>

            {/* Nested Take Down Confirmation Modal */}
            {isTakeDownModalOpen && (
              <div className="pm-modal-overlay pm-nested-modal" onClick={() => setIsTakeDownModalOpen(false)}>
                <div className="pm-modal-content pm-confirm-modal" onClick={(e) => e.stopPropagation()}>
                  <div className="pm-modal-header">
                    <h2>Confirm Take Down</h2>
                    <button className="pm-modal-close" onClick={() => setIsTakeDownModalOpen(false)}>×</button>
                  </div>
                  <div className="pm-modal-body">
                    <p>Are you sure you want to take down post <strong>#{selectedPost.postId}</strong>?</p>
                    <p className="pm-warning-text">This will reject the post and hide it from public view. This action can be undone by manually approving the post again.</p>
                  </div>
                  <div className="pm-modal-footer">
                    <button className="pm-modal-cancel-btn" onClick={() => setIsTakeDownModalOpen(false)}>Cancel</button>
                    <button className="pm-modal-action-btn pm-reject-btn" onClick={confirmTakeDown}>Confirm Take Down</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
