"use client";

import { useEffect, useState } from "react";
import { getUserPosts } from "@/services/PostController";
import "./MyPostsPage.css";
import {useSideBar} from "@/contexts/SideBarContext.tsx";

// Default placeholder image for videos
const VIDEO_PLACEHOLDER = "/video-placeholder.png";

export default function MyPostsPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  const { sideBarRetractor } = useSideBar();

  useEffect(() => {
    const storedUserId = sessionStorage.getItem("userID") || localStorage.getItem("userID");
    if (storedUserId) {
      setUserId(parseInt(storedUserId, 10));
    }
  }, []);

  useEffect(() => {
    if (!userId) return;

    async function fetchUserPosts() {
      setLoading(true);
      try {
        // Sort by createdAt ascending (earliest first)
        const data = await getUserPosts(userId, 0, 50, "createdAt");
        // Sort earliest to latest (ascending)
        const sortedData = [...data].sort((a, b) => {
          return new Date(a.createdAt) - new Date(b.createdAt);
        });
        setPosts(sortedData);
      } catch (err) {
        console.error("Failed to fetch user posts:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchUserPosts();
  }, [userId]);

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

  if (loading) {
    return (
      <div className="user-posts-page">
        <div className="loading">Loading your posts...</div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="user-posts-page">
        <div className="empty-message">You haven't posted anything yet...</div>
      </div>
    );
  }

  return (
    <div className={`user-posts-page ${sideBarRetractor ? 'sidebar-expanded' : 'sidebar-retracted'}`}>
      <div className="user-posts-header">
        <h1>My Posts</h1>
        <p>View and manage your posts</p>
      </div>

      <div className="user-posts-table-container">
        <table className="user-posts-table">
          <thead>
            <tr>
              <th>Post ID</th>
              <th>Fan Hub</th>
              <th>Author</th>
              <th>Type</th>
              <th>Title</th>
              <th>Content</th>
              <th>Status</th>
              <th>Media</th>
              <th>Hashtags</th>
              <th>Created Date</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr key={post.postId} className="post-row">
                <td className="post-id">#{post.postId}</td>
                <td className="fan-hub-name">{post.fanHubName}</td>
                <td className="author-display-name">{post.authorDisplayName}</td>
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
                <td className="post-media">
                  {getMediaThumbnail(post) ? (
                    <img 
                      src={getMediaThumbnail(post)} 
                      alt={`${post.postType} media`} 
                      className="media-thumbnail"
                    />
                  ) : (
                    <span className="no-media">No media</span>
                  )}
                </td>
                <td className="post-hashtags">
                  {post.hashtags && post.hashtags.length > 0 ? (
                    <div className="hashtags-container">
                      {post.hashtags.map((hashtag, index) => (
                        <span key={index} className="hashtag-tag">#{hashtag}</span>
                      ))}
                    </div>
                  ) : (
                    <span className="no-hashtags">-</span>
                  )}
                </td>
                <td className="post-created-date">
                  <span className="date-display">{formatDate(post.createdAt)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
