"use client";

import { useEffect, useState } from "react";
import { getUserPosts } from "@/services/PostController";
import { useRouter } from "next/navigation";
import "./MyPostsPage.css";
import {useSideBar} from "@/contexts/SideBarContext.tsx";

// Default placeholder image for videos
const VIDEO_PLACEHOLDER = "/video-placeholder.png";

export default function MyPostsPage() {
  const router = useRouter();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [userId, setUserId] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [postsPerPage] = useState(10);

  // Sorting state
  const [sortBy, setSortBy] = useState("createdAt");

  // Modal state for post details
  const [selectedPost, setSelectedPost] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { sideBarRetractor } = useSideBar();

  useEffect(() => {
    const storedUserId = sessionStorage.getItem("userID") || localStorage.getItem("userID");
    if (storedUserId) {
      setUserId(parseInt(storedUserId, 10));
    }
  }, []);

  // Fetch posts with pagination
  const fetchPosts = async (reset = false) => {
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
      const data = await getUserPosts(userId, pageNo, postsPerPage, sortBy);

      let items = Array.isArray(data) ? data : [];

      if (reset) {
        setPosts(items);
      } else {
        setPosts(prev => [...prev, ...items]);
      }

      // If we got fewer posts than requested, there's no more data
      setHasMore(items.length === postsPerPage);
      setCurrentPage(prev => reset ? 1 : prev + 1);
    } catch (err) {
      console.error("Failed to fetch user posts:", err);
      if (reset) setPosts([]);
      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (!userId) return;
    fetchPosts(true);
  }, [userId, sortBy]);

  const handleLoadMore = () => {
    fetchPosts(false);
  };

  // Handle sorting - always sorts descending, no toggle
  const handleSort = (field) => {
    setSortBy(field);
  };

  // Sort posts based on current sortBy (always descending)
  const sortedPosts = [...posts].sort((a, b) => {
    let aVal = a[sortBy];
    let bVal = b[sortBy];

    // Handle null/undefined values
    if (aVal === null || aVal === undefined) aVal = "";
    if (bVal === null || bVal === undefined) bVal = "";

    // Special handling for dates
    if (sortBy === "createdAt") {
      aVal = new Date(aVal).getTime();
      bVal = new Date(bVal).getTime();
    }

    // Special handling for id (numeric) - maps to postId in API
    if (sortBy === "id") {
      aVal = Number(a.postId);
      bVal = Number(b.postId);
    }

    // Special handling for status (order: approved, pending, rejected)
    if (sortBy === "status") {
      const statusOrder = { approved: 0, pending: 1, rejected: 2 };
      aVal = statusOrder[aVal?.toLowerCase()] ?? 999;
      bVal = statusOrder[bVal?.toLowerCase()] ?? 999;
    }

    // Special handling for postType (enum order)
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

    // Special handling for aiValidationStatus (enum order: AI_SAFE, AI_UNSAFE, PENDING)
    if (sortBy === "aiValidationStatus") {
      const aiValidationOrder = { ai_safe: 0, ai_unsafe: 1, pending: 2 };
      aVal = aiValidationOrder[aVal?.toLowerCase()] ?? 999;
      bVal = aiValidationOrder[bVal?.toLowerCase()] ?? 999;
    }

    // Always sort descending
    return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
  });

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

  const getMediaThumbnail = (post) => {
    // For VIDEO type, show placeholder
    if (post.postType?.toUpperCase() === "VIDEO") {
      return VIDEO_PLACEHOLDER;
    }
    // For IMAGE type, show the actual image
    if (post.media && post.media.length > 0) {
      return post.media[0].mediaUrl;
    }
    // Fallback placeholder
    return null;
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

  const handleViewPost = (post) => {
    // Navigate to post detail page
    router.push(`/post/${post.postId}`);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedPost(null);
  };

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isModalOpen) {
        closeModal();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isModalOpen]);

  if (loading) {
    return (
      <div className={`user-posts-page ${!sideBarRetractor ? 'sidebar-retracted' : 'sidebar-expanded'}`}>
        <div className="loading">Loading your posts...</div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className={`user-posts-page ${!sideBarRetractor ? 'sidebar-retracted' : 'sidebar-expanded'}`}>
        <div className="empty-message">You haven't posted anything yet...</div>
      </div>
    );
  }

  // Get sort icon - always shows descending indicator
  const getSortIcon = (field) => {
    if (sortBy !== field) return " ↕";
    return " ↓";
  };

  return (
    <div className={`user-posts-page ${!sideBarRetractor ? 'sidebar-retracted' : 'sidebar-expanded'}`}>
      <div className="user-posts-header">
        <h1>Your Posts</h1>
      </div>

      <div className="user-posts-table-container">
        <table className="user-posts-table">
          <thead>
            <tr>
              <th className="sortable" onClick={() => handleSort("id")}>
                ID{getSortIcon("id")}
              </th>
              <th>Fan Hub</th>
              <th className="sortable" onClick={() => handleSort("postType")}>
                Type{getSortIcon("postType")}
              </th>
              <th>Title</th>
              <th>Content</th>
              <th className="sortable" onClick={() => handleSort("status")}>
                Status{getSortIcon("status")}
              </th>
              <th className="sortable" onClick={() => handleSort("aiValidationStatus")}>
                AI Validation{getSortIcon("aiValidationStatus")}
              </th>
              <th className="sortable" onClick={() => handleSort("createdAt")}>
                Created Date{getSortIcon("createdAt")}
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedPosts.map((post) => (
              <tr
                key={post.postId}
                className="post-row"
                onClick={() => handlePostClick(post)}
                style={{ cursor: 'pointer' }}
              >
                <td className="post-id">#{post.postId}</td>
                <td className="fan-hub-name">{post.fanHubName}</td>
                <td className="post-type">
                  <span className="post-type-badge">{getPostTypeLabel(post.postType)}</span>
                </td>
                <td className="post-title">{post.title}</td>
                <td className="post-content">
                  <span className="content-preview">{post.content}</span>
                </td>
                <td className="post-status">
                  <span className={`status-badge ${getStatusClass(post.status)}`}>
                    {post.status}
                  </span>
                </td>
                <td className="post-ai-validation">
                  <span className={`ai-validation-badge ${getAiValidationStatusClass(post.aiValidationStatus)}`}>
                    {post.aiValidationStatus || "UNKNOWN"}
                  </span>
                  {post.aiValidationComment && (
                    <div className="ai-validation-comment" title={post.aiValidationComment}>
                      {post.aiValidationComment.length > 50
                        ? post.aiValidationComment.substring(0, 50) + "..."
                        : post.aiValidationComment}
                    </div>
                  )}
                </td>
                <td className="post-created-date" onClick={(e) => e.stopPropagation()}>
                  <span className="date-display">{formatDate(post.createdAt)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Load More Button */}
        {hasMore && (
          <div className="load-more-container">
            <button 
              className="load-more-btn" 
              onClick={handleLoadMore} 
              disabled={loadingMore}
            >
              {loadingMore ? (
                <>
                  <span className="load-more-spinner">⟳</span> Loading...
                </>
              ) : (
                "Load more"
              )}
            </button>
          </div>
        )}
        {!hasMore && posts.length > 0 && (
          <div className="no-more-data">No more posts to load</div>
        )}
      </div>

      {/* Post Details Modal */}
      {isModalOpen && selectedPost && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Post Details</h2>
              <button className="modal-close" onClick={closeModal} title="Close">
                ✕
              </button>
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
                    <span className="info-label">Fan Hub:</span>
                    <span className="info-value">{selectedPost.fanHubName}</span>
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
                    <span className="info-label">Status:</span>
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
                    {selectedPost.media.map((mediaItem) => {
                      // Detect if it's a video based on URL extension
                      const urlLower = mediaItem.mediaUrl?.toLowerCase();
                      const isVideo = urlLower?.includes('.mp4') || urlLower?.includes('.webm') || urlLower?.includes('.ogg');

                      return (
                        <div key={mediaItem.mediaId} className="media-card">
                          <div className="media-preview">
                            {isVideo ? (
                              <video controls className="media-video">
                                <source src={mediaItem.mediaUrl} type="video/mp4" />
                                Your browser does not support the video tag.
                              </video>
                            ) : (
                              <img
                                src={mediaItem.mediaUrl}
                                alt={`Media ${mediaItem.mediaId}`}
                                className="media-image"
                                onError={(e) => {
                                  e.target.onerror = null;
                                }}
                              />
                            )}
                          </div>
                          <div className="media-info">
                            <div className="media-id">Media ID: #{mediaItem.mediaId}</div>
                            <div className={`media-ai-status ${getAiValidationStatusClass(mediaItem.aiValidationStatus)}`}>
                              {mediaItem.aiValidationStatus || "UNKNOWN"}
                            </div>
                            {mediaItem.aiValidationComment && (
                              <div className="media-ai-comment" title={mediaItem.aiValidationComment}>
                                {mediaItem.aiValidationComment}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
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
            </div>

            <div className="modal-footer">
              <button className="modal-close-btn" onClick={closeModal}>
                Close
              </button>
              <button 
                className="modal-view-post-btn" 
                onClick={() => handleViewPost(selectedPost)}
              >
                View Full Post
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
