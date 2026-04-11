"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/functions/Auth/useAuth.jsx";
import {
  getPostsWithReports,
  bulkResolveReports,
  getMembersWithReports,
  bulkResolveMemberReports,
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
  const router = useRouter();
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

    // Check if the moderator is the author of the reported post
    if (postAuthor && currentUsername && postAuthor === currentUsername) {
      showToast("You cannot resolve reports against your own posts", "error");
      return;
    }

    // Check if any report was filed by the current moderator against themselves
    const isReportedBySelf = selectedPost.reports.some(
      (r) => r.reportedByUsername === currentUsername
    );
    if (isReportedBySelf) {
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

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
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
      case "APPROVED":
        return "status-approved";
      case "PENDING":
        return "status-pending";
      case "REJECTED":
        return "status-rejected";
      default:
        return "status-unknown";
    }
  };

  const getReportStatusClass = (status) => {
    switch (status?.toUpperCase()) {
      case "PENDING":
        return "report-pending";
      case "RESOLVED":
        return "report-resolved";
      default:
        return "report-unknown";
    }
  };

  if (loading) return <div className="loading">Loading post reports...</div>;

  return (
    <div className="reports-table-wrapper">
      <div className="reports-toolbar">
        <div />
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
                <th>Fan Hub</th>
                <th>Status</th>
                <th>Reports</th>
                <th>Pending</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => {
                const pendingCount = post.reports?.filter(
                  (r) => r.reportStatus === "PENDING"
                ).length;
                const totalReports = post.reports?.length || 0;

                return (
                  <tr key={post.postId}>
                    <td className="post-id">#{post.postId}</td>
                    <td className="post-title">{post.title || "-"}</td>
                    <td className="post-author">{post.authorUsername || "-"}</td>
                    <td className="fan-hub-cell">{post.fanHubName || "-"}</td>
                    <td className="status-cell">
                      <span className={`post-status-badge ${getPostStatusClass(post.status)}`}>
                        {post.status}
                      </span>
                    </td>
                    <td className="reports-count">{totalReports}</td>
                    <td className="pending-count">
                      {pendingCount > 0 ? (
                        <span className="pending-badge">{pendingCount}</span>
                      ) : (
                        "0"
                      )}
                    </td>
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
              <button className="post-details-close" onClick={closeDetailsModal}>
                ×
              </button>
              <h2>Post Report Details</h2>
            </div>
            <div className="post-details-body">
              {/* Post Info */}
              <div className="post-info-section">
                <h3>Post Information</h3>
                <div className="report-info-grid">
                  <div className="report-info-item">
                    <span className="report-info-label">Post ID:</span>
                    <span className="report-info-value">#{selectedPost.postId}</span>
                  </div>
                  <div className="report-info-item">
                    <span className="report-info-label">Title:</span>
                    <span className="report-info-value">{selectedPost.title}</span>
                  </div>
                  <div className="report-info-item">
                    <span className="report-info-label">Author:</span>
                    <span className="report-info-value">
                      {selectedPost.authorDisplayName || selectedPost.authorUsername}
                    </span>
                  </div>
                  <div className="report-info-item">
                    <span className="report-info-label">Fan Hub:</span>
                    <span className="report-info-value">{selectedPost.fanHubName}</span>
                  </div>
                  <div className="report-info-item">
                    <span className="report-info-label">Post Type:</span>
                    <span className="report-info-value">{selectedPost.postType}</span>
                  </div>
                  <div className="report-info-item">
                    <span className="report-info-label">Status:</span>
                    <span
                      className={`post-status-badge ${getPostStatusClass(selectedPost.status)}`}
                    >
                      {selectedPost.status}
                    </span>
                  </div>
                  {selectedPost.hashtags && selectedPost.hashtags.length > 0 && (
                    <div className="report-info-item full-width">
                      <span className="report-info-label">Hashtags:</span>
                      <span className="report-info-value">
                        {selectedPost.hashtags.map((tag) => `#${tag}`).join(", ")}
                      </span>
                    </div>
                  )}
                  <div className="report-info-item full-width">
                    <span className="report-info-label">Content:</span>
                    <span className="report-info-value report-reason-text">
                      {selectedPost.content}
                    </span>
                  </div>
                </div>

                {/* Post Media */}
                {selectedPost.mediaUrls && selectedPost.mediaUrls.length > 0 && (
                  <div className="report-media-section">
                    <span className="report-info-label">Post Media:</span>
                    <div className="report-media-grid">
                      {selectedPost.mediaUrls.map((url, idx) => (
                        <a
                          key={idx}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="report-media-thumb"
                        >
                          <img
                            src={url}
                            alt={`Media ${idx + 1}`}
                            onError={(e) => {
                              e.target.src = "/placeholder-image.png";
                            }}
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Reports List */}
              <div className="reports-list-section">
                <h3>
                  Reports ({selectedPost.reports?.length || 0})
                  {selectedPost.reports?.filter((r) => r.reportStatus === "PENDING").length > 0 && (
                    <span className="pending-reports-indicator">
                      {
                        selectedPost.reports.filter((r) => r.reportStatus === "PENDING").length
                      }{" "}
                      pending
                    </span>
                  )}
                </h3>
                <div className="reports-list">
                  {selectedPost.reports?.map((report) => (
                    <div key={report.reportId} className="report-card">
                      <div className="report-card-header">
                        <span className="report-card-id">Report #{report.reportId}</span>
                        <span
                          className={`report-status-badge ${getReportStatusClass(
                            report.reportStatus
                          )}`}
                        >
                          {report.reportStatus}
                        </span>
                      </div>
                      <div className="report-card-body">
                        <div className="report-row">
                          <span className="report-label">Reported By:</span>
                          <span className="report-value">
                            {report.reportedByDisplayName || report.reportedByUsername}
                          </span>
                        </div>
                        <div className="report-row">
                          <span className="report-label">Reason:</span>
                          <span className="report-value">{report.reason}</span>
                        </div>
                        <div className="report-row">
                          <span className="report-label">Date:</span>
                          <span className="report-value">
                            {formatDateTime(report.reportCreatedAt)}
                          </span>
                        </div>
                        {report.reportStatus === "RESOLVED" && (
                          <>
                            <div className="report-row">
                              <span className="report-label">Resolved By:</span>
                              <span className="report-value">
                                {report.resolvedByDisplayName || report.resolvedByUsername || "-"}
                              </span>
                            </div>
                            {report.resolveMessage && (
                              <div className="report-row full-width">
                                <span className="report-label">Resolution:</span>
                                <span className="report-value">{report.resolveMessage}</span>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Resolve Form */}
              {selectedPost.reports?.some((r) => r.reportStatus === "PENDING") && (
                <div className="resolve-form-section">
                  <h3>Resolve All Pending Reports</h3>
                  <div className="resolve-form-group">
                    <label htmlFor="resolve-message">
                      Resolution Message <span className="required">*</span>
                    </label>
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
              )}
            </div>
            <div className="post-details-actions">
              <button
                className="resolve-cancel-btn"
                onClick={closeDetailsModal}
                disabled={resolving}
              >
                Cancel
              </button>
              <button
                className="resolve-view-btn"
                onClick={() => handleViewPost(selectedPost.postId)}
              >
                View Post
              </button>
              {selectedPost.reports?.some((r) => r.reportStatus === "PENDING") && (
                <button
                  className="resolve-confirm-btn"
                  onClick={handleResolveAll}
                  disabled={resolving || !resolveMessage.trim()}
                >
                  {resolving ? "Resolving..." : `Resolve ${selectedPost.reports.filter((r) => r.reportStatus === "PENDING").length} Pending Report(s)`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ───────── Member Reports Table ───────── */
function MemberReportsTable({ fanHubId }) {
  const { userAuth } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [sortBy] = useState("createdAt");
  const [refreshing, setRefreshing] = useState(false);

  const [selectedMember, setSelectedMember] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [resolveMessage, setResolveMessage] = useState("");
  const [resolving, setResolving] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });

  const fetchMembers = useCallback(async (reset = false) => {
    if (reset) {
      setLoading(true);
      setMembers([]);
      setCurrentPage(0);
      setHasMore(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const pageNo = reset ? 0 : currentPage;
      const result = await getMembersWithReports(fanHubId, pageNo, PAGE_SIZE, sortBy);

      let items = [];
      if (result?.success && result?.data) {
        items = Array.isArray(result.data) ? result.data : [];
      }

      if (reset) {
        setMembers(items);
      } else {
        setMembers((prev) => [...prev, ...items]);
      }

      setHasMore(items.length === PAGE_SIZE);
      setCurrentPage((prev) => (reset ? 1 : prev + 1));
    } catch (err) {
      console.error("Failed to fetch member reports:", err);
      if (reset) setMembers([]);
      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [fanHubId, currentPage, sortBy]);

  const handleLoadMore = () => fetchMembers(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchMembers(true);
  };

  useEffect(() => {
    if (!fanHubId) return;
    fetchMembers(true);
  }, [fanHubId, sortBy]);

  const showToast = (message, type) => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
  };

  const openDetailsModal = (member) => {
    setSelectedMember(member);
    setResolveMessage("");
    setIsDetailsModalOpen(true);
  };

  const closeDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedMember(null);
    setResolveMessage("");
  };

  const handleResolveAll = async () => {
    if (!resolveMessage.trim()) {
      showToast("Please provide a resolution message", "error");
      return;
    }

    const currentUsername = userAuth?.email;
    const memberUsername = selectedMember.username;

    // Check if the moderator is the reported member
    if (memberUsername && currentUsername && memberUsername === currentUsername) {
      showToast("You cannot resolve reports against yourself", "error");
      return;
    }

    // Check if any report was filed by the current moderator
    const isReportedBySelf = selectedMember.reports.some(
      (r) => r.reportedByUsername === currentUsername
    );
    if (isReportedBySelf) {
      showToast("You cannot resolve reports filed by yourself", "error");
      return;
    }

    const pendingReports = selectedMember.reports.filter((r) => r.reportStatus === "PENDING");
    if (pendingReports.length === 0) {
      showToast("No pending reports to resolve", "error");
      return;
    }

    const reportIds = pendingReports.map((r) => r.reportId);

    setResolving(true);
    try {
      const result = await bulkResolveMemberReports(reportIds, resolveMessage.trim());
      if (result?.success) {
        showToast(result.message || "Member reports resolved successfully!", "success");
        await fetchMembers(true);
        closeDetailsModal();
      } else {
        throw new Error(result?.message || "Failed to resolve member reports");
      }
    } catch (err) {
      console.error("Resolve member reports error:", err);
      showToast(err.message || "Failed to resolve member reports", "error");
    } finally {
      setResolving(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
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

  const getMemberRoleClass = (role) => {
    switch (role?.toUpperCase()) {
      case "ADMIN":
        return "role-admin";
      case "MODERATOR":
        return "role-moderator";
      case "MEMBER":
        return "role-member";
      default:
        return "role-unknown";
    }
  };

  const getReportStatusClass = (status) => {
    switch (status?.toUpperCase()) {
      case "PENDING":
        return "report-pending";
      case "RESOLVED":
        return "report-resolved";
      default:
        return "report-unknown";
    }
  };

  if (loading) return <div className="loading">Loading member reports...</div>;

  return (
    <div className="reports-table-wrapper">
      <div className="reports-toolbar">
        <div />
        <button className="toolbar-refresh-btn" onClick={handleRefresh} disabled={refreshing}>
          {refreshing ? "⟳ Refreshing..." : "⟳ Refresh"}
        </button>
      </div>

      {toast.show && <div className={`toast-notification ${toast.type}`}>{toast.message}</div>}

      {members.length === 0 ? (
        <div className="empty-message">No pending member reports found</div>
      ) : (
        <div className="moderation-table-container">
          <table className="moderation-table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Username</th>
                <th>Fan Hub</th>
                <th>Role</th>
                <th>Reports</th>
                <th>Pending</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => {
                const pendingCount = member.reports?.filter(
                  (r) => r.reportStatus === "PENDING"
                ).length;
                const totalReports = member.reports?.length || 0;

                return (
                  <tr key={member.memberId}>
                    <td className="member-cell">
                      {member.avatarUrl && (
                        <img
                          src={member.avatarUrl}
                          alt={member.displayName || member.username}
                          className="member-avatar"
                        />
                      )}
                      <span className="member-name">
                        {member.displayName || member.username}
                      </span>
                    </td>
                    <td className="username-cell">{member.username}</td>
                    <td className="fan-hub-cell">{member.fanHubName || "-"}</td>
                    <td className="status-cell">
                      <span className={`member-role-badge ${getMemberRoleClass(member.roleInHub)}`}>
                        {member.roleInHub}
                      </span>
                    </td>
                    <td className="reports-count">{totalReports}</td>
                    <td className="pending-count">
                      {pendingCount > 0 ? (
                        <span className="pending-badge">{pendingCount}</span>
                      ) : (
                        "0"
                      )}
                    </td>
                    <td className="date-cell">{formatDate(member.joinedAt)}</td>
                    <td className="action-cell">
                      <button
                        className="view-details-btn"
                        onClick={() => openDetailsModal(member)}
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
          {!hasMore && members.length > 0 && (
            <div className="no-more-data">No more member reports to load</div>
          )}
        </div>
      )}

      {/* Member Details Modal */}
      {isDetailsModalOpen && selectedMember && (
        <div className="report-resolve-overlay" onClick={closeDetailsModal}>
          <div className="post-details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="post-details-header">
              <button className="post-details-close" onClick={closeDetailsModal}>
                ×
              </button>
              <h2>Member Report Details</h2>
            </div>
            <div className="post-details-body">
              {/* Member Info */}
              <div className="post-info-section">
                <h3>Member Information</h3>
                <div className="report-info-grid">
                  <div className="report-info-item">
                    <span className="report-info-label">Member ID:</span>
                    <span className="report-info-value">#{selectedMember.memberId}</span>
                  </div>
                  <div className="report-info-item">
                    <span className="report-info-label">Username:</span>
                    <span className="report-info-value">{selectedMember.username}</span>
                  </div>
                  <div className="report-info-item">
                    <span className="report-info-label">Display Name:</span>
                    <span className="report-info-value">
                      {selectedMember.displayName || "-"}
                    </span>
                  </div>
                  <div className="report-info-item">
                    <span className="report-info-label">Fan Hub:</span>
                    <span className="report-info-value">{selectedMember.fanHubName}</span>
                  </div>
                  <div className="report-info-item">
                    <span className="report-info-label">Role:</span>
                    <span
                      className={`member-role-badge ${getMemberRoleClass(
                        selectedMember.roleInHub
                      )}`}
                    >
                      {selectedMember.roleInHub}
                    </span>
                  </div>
                  <div className="report-info-item">
                    <span className="report-info-label">Status:</span>
                    <span className="report-info-value">{selectedMember.memberStatus}</span>
                  </div>
                  {selectedMember.avatarUrl && (
                    <div className="report-info-item">
                      <span className="report-info-label">Avatar:</span>
                      <a
                        href={selectedMember.avatarUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="report-info-value"
                        style={{ color: "#3b82f6" }}
                      >
                        View Avatar
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Reports List */}
              <div className="reports-list-section">
                <h3>
                  Reports ({selectedMember.reports?.length || 0})
                  {selectedMember.reports?.filter((r) => r.reportStatus === "PENDING").length >
                    0 && (
                    <span className="pending-reports-indicator">
                      {selectedMember.reports.filter((r) => r.reportStatus === "PENDING").length}{" "}
                      pending
                    </span>
                  )}
                </h3>
                <div className="reports-list">
                  {selectedMember.reports?.map((report) => (
                    <div key={report.reportId} className="report-card">
                      <div className="report-card-header">
                        <span className="report-card-id">Report #{report.reportId}</span>
                        <span
                          className={`report-status-badge ${getReportStatusClass(
                            report.reportStatus
                          )}`}
                        >
                          {report.reportStatus}
                        </span>
                      </div>
                      <div className="report-card-body">
                        <div className="report-row">
                          <span className="report-label">Reported By:</span>
                          <span className="report-value">
                            {report.reportedByDisplayName || report.reportedByUsername}
                          </span>
                        </div>
                        <div className="report-row">
                          <span className="report-label">Reason:</span>
                          <span className="report-value">{report.reason}</span>
                        </div>
                        <div className="report-row">
                          <span className="report-label">Date:</span>
                          <span className="report-value">
                            {formatDateTime(report.reportCreatedAt)}
                          </span>
                        </div>
                        {report.relatedComment && (
                          <div className="report-row full-width">
                            <span className="report-label">Related Comment:</span>
                            <span className="report-value">
                              {typeof report.relatedComment === "string"
                                ? report.relatedComment
                                : report.relatedComment.content || `Comment #${report.relatedComment.commentId}`}
                            </span>
                          </div>
                        )}
                        {report.reportStatus === "RESOLVED" && (
                          <>
                            <div className="report-row">
                              <span className="report-label">Resolved By:</span>
                              <span className="report-value">
                                {report.resolvedByDisplayName ||
                                  report.resolvedByUsername ||
                                  "-"}
                              </span>
                            </div>
                            {report.resolveMessage && (
                              <div className="report-row full-width">
                                <span className="report-label">Resolution:</span>
                                <span className="report-value">{report.resolveMessage}</span>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Resolve Form */}
              {selectedMember.reports?.some((r) => r.reportStatus === "PENDING") && (
                <div className="resolve-form-section">
                  <h3>Resolve All Pending Reports</h3>
                  <div className="resolve-form-group">
                    <label htmlFor="resolve-message">
                      Resolution Message <span className="required">*</span>
                    </label>
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
              )}
            </div>
            <div className="post-details-actions">
              <button
                className="resolve-cancel-btn"
                onClick={closeDetailsModal}
                disabled={resolving}
              >
                Cancel
              </button>
              {selectedMember.reports?.some((r) => r.reportStatus === "PENDING") && (
                <button
                  className="resolve-confirm-btn"
                  onClick={handleResolveAll}
                  disabled={resolving || !resolveMessage.trim()}
                >
                  {resolving
                    ? "Resolving..."
                    : `Resolve ${selectedMember.reports.filter((r) => r.reportStatus === "PENDING").length} Pending Report(s)`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
