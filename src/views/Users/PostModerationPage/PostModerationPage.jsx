"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getPendingPostsByFanHub, reviewPost } from "@/services/ModeratorController";
import { getPostsByFanHub } from "@/services/PostController";
import "./PostModerationPage.css";
import { useSideBar } from "@/contexts/SideBarContext.tsx";

// Default placeholder image for videos
const VIDEO_PLACEHOLDER = "/video-placeholder.png";

// Status filter options
const STATUS_FILTER_OPTIONS = [
  { value: "PENDING", label: "Pending" },
  { value: "ALL", label: "All" },
];

// Status options for the dropdown (for changing post status)
const STATUS_OPTIONS = [
  { value: "PENDING", label: "Pending", class: "status-pending" },
  { value: "APPROVED", label: "Approved", class: "status-approved" },
  { value: "REJECTED", label: "Rejected", class: "status-rejected" },
];

export default function PostModerationPage() {
  const params = useParams();
  
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fanHubId, setFanHubId] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [postsPerPage] = useState(10);

  // Sorting state
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDirection, setSortDirection] = useState("asc");

  // Status filter state
  const [statusFilter, setStatusFilter] = useState("PENDING");

  // Modal state for post details
  const [selectedPost, setSelectedPost] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Media viewer state
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [isMediaViewerOpen, setIsMediaViewerOpen] = useState(false);

  // Toast notification state
  const [toast, setToast] = useState({ show: false, message: "", type: "" });

  // Track which dropdown is open (by postId)
  const [openDropdownId, setOpenDropdownId] = useState(null);

  const { sideBarRetractor } = useSideBar();

  useEffect(()=>{
      console.log("New dropdown id: " + openDropdownId);
  },[openDropdownId])

  useEffect(() => {
    if (params?.fanHubId) {
      const id = parseInt(params.fanHubId, 10);
      if (!isNaN(id)) {
        setFanHubId(id);
      }
    }
  }, [params]);

  // Fetch posts based on fanHubId and status filter
  useEffect(() => {
    if (!fanHubId) return;

    async function fetchPosts() {
      setLoading(true);
      try {
        let data;
        if (statusFilter === "PENDING") {
          // Fetch only pending posts
          data = await getPendingPostsByFanHub(fanHubId, 0, 100, sortBy);
        } else {
          // Fetch all posts from the fan hub
          data = await getPostsByFanHub(fanHubId, 0, 100, sortBy);
        }
        setPosts(data);
      } catch (err) {
        console.error("Failed to fetch posts:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchPosts();
  }, [fanHubId, statusFilter, sortBy]);

  // Show toast notification
  const showToast = (message, type) => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
  };

  // Handle sorting
  const handleSort = (field) => {
    setCurrentPage(1);
    if (sortBy === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortDirection("asc");
    }
  };

  // Handle status change for a post
  const handleStatusChange = async (postId, newStatus, currentStatus) => {
    if (newStatus === currentStatus) return;

    // Only allow changing to APPROVED or REJECTED
    if (!["APPROVED", "REJECTED"].includes(newStatus)) {
      showToast("Invalid status change", "error");
      return;
    }

    try {
      const result = await reviewPost(postId, newStatus);
      
      if (result?.success) {
        showToast(`Post ${newStatus.toLowerCase()} successfully!`, "success");
        
        // Update local state - remove from current list if status changed
        setPosts(prevPosts => prevPosts.filter(post => post.postId !== postId));
      } else {
        showToast("Failed to update post status", "error");
      }
    } catch (err) {
      console.error("Status change error:", err);
      showToast("Error updating post status", "error");
    }
  };

  // Sort posts based on current sortBy and sortDirection
  const sortedPosts = [...posts].sort((a, b) => {
    let aVal = a[sortBy];
    let bVal = b[sortBy];

    if (aVal === null || aVal === undefined) aVal = "";
    if (bVal === null || bVal === undefined) bVal = "";

    if (sortBy === "createdAt") {
      aVal = new Date(aVal).getTime();
      bVal = new Date(bVal).getTime();
    }

    if (sortBy === "postId") {
      aVal = Number(aVal);
      bVal = Number(bVal);
    }

    if (sortBy === "status") {
      const statusOrder = { approved: 0, pending: 1, rejected: 2 };
      aVal = statusOrder[aVal?.toLowerCase()] ?? 999;
      bVal = statusOrder[bVal?.toLowerCase()] ?? 999;
    }

    if (sortBy === "postType") {
      const postTypeOrder = {
        ANNOUNCEMENT: 0,
        EVENT_SCHEDULE: 1,
        POLL: 2,
        TEXT: 3,
        IMAGE: 4,
        VIDEO: 5
      };
      aVal = postTypeOrder[aVal?.toUpperCase()] ?? 999;
      bVal = postTypeOrder[bVal?.toUpperCase()] ?? 999;
    }

    if (sortBy === "aiValidationStatus") {
      const aiValidationOrder = { ai_safe: 0, ai_unsafe: 1, pending: 2 };
      aVal = aiValidationOrder[aVal?.toLowerCase()] ?? 999;
      bVal = aiValidationOrder[bVal?.toLowerCase()] ?? 999;
    }

    if (sortDirection === "asc") {
      return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
    } else {
      return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
    }
  });

  const totalPages = Math.ceil(sortedPosts.length / postsPerPage);
  const startIndex = (currentPage - 1) * postsPerPage;
  const endIndex = startIndex + postsPerPage;
  const paginatedPosts = sortedPosts.slice(startIndex, endIndex);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return "status-approved";
      case "pending":
        return "status-pending";
      case "rejected":
        return "status-rejected";
      default:
        return "status-unknown";
    }
  };

  const getPostTypeLabel = (postType) => {
    switch (postType?.toUpperCase()) {
      case "IMAGE":
        return "Image";
      case "VIDEO":
        return "Video";
      case "POLL":
        return "Poll";
      case "TEXT":
        return "Text";
      default:
        return postType || "Unknown";
    }
  };


  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getAiValidationStatusClass = (status) => {
    switch (status?.toUpperCase()) {
      case "AI_SAFE":
        return "ai-safe";
      case "AI_UNSAFE":
        return "ai-unsafe";
      case "PENDING":
        return "ai-pending";
      default:
        return "ai-unknown";
    }
  };

  const handlePostClick = (post) => {
    setSelectedPost(post);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedPost(null);
  };

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isModalOpen) {
        closeModal();
      }
      if (e.key === "Escape" && isMediaViewerOpen) {
        setIsMediaViewerOpen(false);
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isModalOpen, isMediaViewerOpen]);

  const getSortIcon = (field) => {
    if (sortBy !== field) return " ↕";
    return sortDirection === "asc" ? " ↑" : " ↓";
  };

  if (loading) {
    return (
      <div className={`post-moderation-page ${!sideBarRetractor ? 'sidebar-retracted' : 'sidebar-expanded'}`}>
        <div className="loading">Loading posts for moderation...</div>
      </div>
    );
  }

  return (
    <div className={`post-moderation-page ${!sideBarRetractor ? 'sidebar-retracted' : 'sidebar-expanded'}`}>
      <div className="moderation-header">
        <div className="header-left">
          <h1>Post Moderation</h1>
          <p>Review and manage posts for Fan Hub #{fanHubId}</p>
        </div>
        
        {/* Status Filter Dropdown */}
        <div className="status-filter-container">
          <label htmlFor="status-filter">Filter by Status:</label>
          <select
            id="status-filter"
            className="status-filter-dropdown"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            {STATUS_FILTER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Toast Notification */}
      {toast.show && (
        <div className={`toast-notification ${toast.type}`}>
          {toast.message}
        </div>
      )}

      {posts.length === 0 ? (
        <div className="empty-message">
          No posts found with status: {statusFilter}
        </div>
      ) : (
        <div className="moderation-table-container">
          <table className="moderation-table">
            <thead>
              <tr>
                <th className="sortable" onClick={() => handleSort("postId")}>
                  Post ID{getSortIcon("postId")}
                </th>
                <th className="sortable" onClick={() => handleSort("authorDisplayName")}>
                  Author{getSortIcon("authorDisplayName")}
                </th>
                <th className="sortable" onClick={() => handleSort("postType")}>
                  Type{getSortIcon("postType")}
                </th>
                <th className="sortable" onClick={() => handleSort("title")}>
                  Title{getSortIcon("title")}
                </th>
                <th>Content</th>
                <th>Current Status</th>
                <th>AI Validation</th>
                <th className="sortable" onClick={() => handleSort("createdAt")}>
                  Created Date{getSortIcon("createdAt")}
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedPosts.map((post, index) => (
                <tr
                  key={post.postId}
                  className={`post-row ${openDropdownId === post.postId ? 'has-open-dropdown' : ''} ${index === paginatedPosts.length - 1 ? 'last-row' : ''}`}
                  onClick={() => handlePostClick(post)}
                  style={{ cursor: 'pointer' }}
                >
                  <td className="post-id">#{post.postId}</td>
                  <td className="author-display-name">{post.authorDisplayName}</td>
                  <td className="post-type">
                    <span className="post-type-badge">{getPostTypeLabel(post.postType)}</span>
                  </td>
                  <td className="post-title">{post.title}</td>
                  <td className="post-content">
                    <span className="content-preview">{post.content}</span>
                  </td>
                  <td className="post-action" onClick={(e) => e.stopPropagation()}>
                    <StatusDropdown
                      postId={post.postId}
                      currentStatus={post.status}
                      isOpen={openDropdownId === post.postId}
                      onOpenChange={setOpenDropdownId}
                      onStatusChange={(newStatus) => handleStatusChange(post.postId, newStatus, post.status)}
                    />
                  </td>
                  <td className="post-ai-validation">
                    <span className={`ai-validation-badge ${getAiValidationStatusClass(post.aiValidationStatus)}`}>
                      {post.aiValidationStatus || "UNKNOWN"}
                    </span>
                  </td>
                  <td className="post-created-date">
                    <span className="date-display">{formatDate(post.createdAt)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="pagination-container">
              <div className="pagination-info">
                Showing {startIndex + 1} to {Math.min(endIndex, sortedPosts.length)} of {sortedPosts.length} posts
              </div>
              <div className="pagination-controls">
                <button
                  className="pagination-btn"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                >
                  ««
                </button>
                <button
                  className="pagination-btn"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  «
                </button>

                {getPageNumbers().map((page, index) => (
                  <button
                    key={index}
                    className={`pagination-btn ${page === currentPage ? "active" : ""} ${page === "..." ? "ellipsis" : ""}`}
                    onClick={() => typeof page === "number" && setCurrentPage(page)}
                    disabled={page === "..."}
                  >
                    {page}
                  </button>
                ))}

                <button
                  className="pagination-btn"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  »
                </button>
                <button
                  className="pagination-btn"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  »»
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Post Details Modal */}
      {isModalOpen && selectedPost && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Post Details</h2>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>

            <div className="modal-body">
              {/* Post Info Section */}
              <div className="post-info-section">
                <h3>Post Information</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">Post ID:</span>
                    <span className="info-value">#{selectedPost.postId}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Title:</span>
                    <span className="info-value">{selectedPost.title}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Author:</span>
                    <span className="info-value">{selectedPost.authorDisplayName}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Type:</span>
                    <span className="info-value">{getPostTypeLabel(selectedPost.postType)}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Current Status:</span>
                    <span className={`status-badge ${getStatusClass(selectedPost.status)}`}>
                      {selectedPost.status}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">AI Validation:</span>
                    <span className={`ai-validation-badge ${getAiValidationStatusClass(selectedPost.aiValidationStatus)}`}>
                      {selectedPost.aiValidationStatus || "UNKNOWN"}
                    </span>
                  </div>
                  <div className="info-item full-width">
                    <span className="info-label">AI Comment:</span>
                    <span className="info-value ai-comment">{selectedPost.aiValidationComment || "No comment"}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Created:</span>
                    <span className="info-value">{formatDate(selectedPost.createdAt)}</span>
                  </div>
                </div>
              </div>

              {/* Content Section */}
              <div className="content-section">
                <h3>Content</h3>
                <p className="post-content-full">{selectedPost.content || "No content"}</p>
              </div>

              {/* Media Section */}
              <div className="media-section">
                <h3>Media ({selectedPost.media?.length || 0})</h3>
                {selectedPost.media && selectedPost.media.length > 0 ? (
                  <div className="media-grid">
                    {selectedPost.media.map((mediaItem) => (
                      <div
                        key={mediaItem.mediaId}
                        className="media-card"
                        onClick={() => {
                          setSelectedMedia(mediaItem);
                          setIsMediaViewerOpen(true);
                        }}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="media-preview">
                          {mediaItem.mediaUrl?.match(/\.(mp4|webm|ogg)$/i) ? (
                            <video controls className="media-video" onClick={(e) => e.stopPropagation()}>
                              <source src={mediaItem.mediaUrl} type="video/mp4" />
                              Your browser does not support the video tag.
                            </video>
                          ) : (
                            <img
                              src={mediaItem.mediaUrl}
                              alt={`Media ${mediaItem.mediaId}`}
                              className="media-image"
                            />
                          )}
                        </div>
                        <div className="media-info">
                          <div className="media-id">Media ID: #{mediaItem.mediaId}</div>
                          <div className={`media-ai-status ${getAiValidationStatusClass(mediaItem.aiValidationStatus)}`}>
                            {mediaItem.aiValidationStatus || "UNKNOWN"}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-media-message">No media attached to this post</div>
                )}
              </div>

              {/* Hashtags Section */}
              {selectedPost.hashtags && selectedPost.hashtags.length > 0 && (
                <div className="hashtags-section">
                  <h3>Hashtags</h3>
                  <div className="hashtags-container">
                    {selectedPost.hashtags.map((hashtag, index) => (
                      <span key={index} className="hashtag-tag">#{hashtag}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="quick-actions-section">
                <h3>Moderation Actions</h3>
                <div className="action-buttons">
                  <button
                    className="action-btn approve-btn"
                    onClick={async () => {
                      await handleStatusChange(selectedPost.postId, "APPROVED", selectedPost.status);
                      closeModal();
                    }}
                  >
                    ✓ Approve Post
                  </button>
                  <button
                    className="action-btn reject-btn"
                    onClick={async () => {
                      await handleStatusChange(selectedPost.postId, "REJECTED", selectedPost.status);
                      closeModal();
                    }}
                  >
                    ✕ Reject Post
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Media Viewer Modal */}
      {isMediaViewerOpen && selectedMedia && (
        <div className="media-viewer-overlay" onClick={() => setIsMediaViewerOpen(false)}>
          <div className="media-viewer-content" onClick={(e) => e.stopPropagation()}>
            <button className="media-viewer-close" onClick={() => setIsMediaViewerOpen(false)}>×</button>
            <div className="media-viewer-body">
              {selectedMedia.mediaUrl?.match(/\.(mp4|webm|ogg)$/i) ? (
                <video controls autoPlay className="media-viewer-video">
                  <source src={selectedMedia.mediaUrl} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              ) : (
                <img
                  src={selectedMedia.mediaUrl}
                  alt={`Media ${selectedMedia.mediaId}`}
                  className="media-viewer-image"
                />
              )}
            </div>
            <div className="media-viewer-info">
              <div className="media-viewer-id">Media ID: #{selectedMedia.mediaId}</div>
              <div className={`media-viewer-ai-status ${getAiValidationStatusClass(selectedMedia.aiValidationStatus)}`}>
                {selectedMedia.aiValidationStatus || "UNKNOWN"}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusDropdown({ postId, currentStatus, isOpen, onOpenChange, onStatusChange }) {
  const getCurrentStatusConfig = () => {
    return STATUS_OPTIONS.find(opt => opt.value === currentStatus?.toUpperCase()) || STATUS_OPTIONS[0];
  };

  const currentConfig = getCurrentStatusConfig();

  // Only show options for changing to APPROVED or REJECTED
  const availableOptions = STATUS_OPTIONS.filter(opt =>
    opt.value === "APPROVED" || opt.value === "REJECTED"
  );

  return (
    <div className="status-dropdown" onClick={(e) => e.stopPropagation()}>
      <button
        className={`status-dropdown-trigger ${currentConfig.class}`}
        onClick={(e) => {
          e.stopPropagation();
          if (isOpen) {
            onOpenChange(null);
          } else {
            onOpenChange(postId);
          }
        }}
      >
        {currentConfig.label}
        <span className="dropdown-arrow">{isOpen ? "▲" : "▼"}</span>
      </button>

      {isOpen && (
        <>
          <div className="status-dropdown-menu">
            {availableOptions.map((option) => (
              <button
                key={option.value}
                className={`dropdown-item ${option.class}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onStatusChange(option.value);
                  onOpenChange(null);
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div
            className="dropdown-backdrop"
            onClick={(e) => {
              e.stopPropagation();
              onOpenChange(null);
            }}
          />
        </>
      )}
    </div>
  );
}
