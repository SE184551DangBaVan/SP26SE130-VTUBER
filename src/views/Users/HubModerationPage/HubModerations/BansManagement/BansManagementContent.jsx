"use client";

import { useEffect, useState, useCallback } from "react";
import { getFanHubBans, revokeBan } from "@/services/MemberController.jsx";
import UserAvatar from "@/components/UserAvatar/UserAvatar";
import "./BansManagementContent.css";

const PAGE_SIZE = 10;

export default function BansManagementContent({ fanHubId }) {
  const [activeSubTab, setActiveSubTab] = useState("COMMENT");
  const [bans, setBans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [sortBy] = useState("createdAt");
  const [sortDirection] = useState("desc");

  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const [refreshing, setRefreshing] = useState(false);

  const fetchBans = useCallback(async (reset = false) => {
    if (reset) {
      setLoading(true);
      setBans([]);
      setCurrentPage(0);
      setHasMore(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const pageNo = reset ? 0 : currentPage;
      const data = await getFanHubBans(fanHubId, pageNo, PAGE_SIZE, sortBy, activeSubTab);

      let items = [];
      if (data && typeof data === "object" && data.content) {
        items = Array.isArray(data.content) ? data.content : [];
      } else if (Array.isArray(data)) {
        items = data;
      }

      if (reset) {
        setBans(items);
      } else {
        setBans(prev => [...prev, ...items]);
      }

      setHasMore(items.length === PAGE_SIZE);
      setCurrentPage(prev => reset ? 1 : prev + 1);
    } catch (err) {
      console.error("Failed to fetch bans:", err);
      if (reset) setBans([]);
      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [fanHubId, currentPage, sortBy, activeSubTab]);

  const handleLoadMore = () => {
    fetchBans(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchBans(true);
  };

  useEffect(() => {
    if (!fanHubId) return;
    fetchBans(true);
  }, [fanHubId, sortBy, activeSubTab]);

  const showToast = (message, type) => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
  };

  const handleRevokeBan = async (banId) => {
    try {
      const result = await revokeBan(banId);
      if (result?.success) {
        showToast("Restriction revoked successfully!", "success");
        await fetchBans(true);
      } else {
        showToast(result?.message || "Failed to revoke restriction", "error");
      }
    } catch (err) {
      console.error("Revoke ban error:", err);
      showToast("Error revoking restriction", "error");
    }
  };

  const handleRevokeConfirm = async (banId, banType) => {
    const confirmed = window.confirm(`Are you sure you want to revoke this ${banType} restriction?`);
    if (confirmed) {
      await handleRevokeBan(banId);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getBanTypeClass = (banType) => {
    switch (banType?.toUpperCase()) {
      case "COMMENT": return "ban-type-comment";
      case "POST": return "ban-type-post";
      case "JOIN": return "ban-type-join";
      case "INTERACT": return "ban-type-interact";
      default: return "ban-type-unknown";
    }
  };

  if (loading) return <div className="loading">Loading restrictions...</div>;

  return (
    <div className="bans-moderation-content">
      <div className="moderation-sub-nav">
        <button 
          className={`sub-nav-btn ${activeSubTab === "COMMENT" ? "active" : ""}`}
          onClick={() => setActiveSubTab("COMMENT")}
        >
          Commenting
        </button>
        <button 
          className={`sub-nav-btn ${activeSubTab === "POST" ? "active" : ""}`}
          onClick={() => setActiveSubTab("POST")}
        >
          Post Creating
        </button>
      </div>

      <div className="tab-description">
        {activeSubTab === "COMMENT" ? (
          <p>These users are restricted from commenting on posts of this hub</p>
        ) : (
          <p>These users are restricted from creating posts in this hub</p>
        )}
      </div>

      <div className="content-toolbar">
        <button className="toolbar-refresh-btn" onClick={handleRefresh} disabled={refreshing} title="Refresh lists">
          {refreshing ? "⟳ Refreshing..." : "⟳ Refresh"}
        </button>
      </div>

      {toast.show && <div className={`toast-notification ${toast.type}`}>{toast.message}</div>}

      {bans.length === 0 ? (
        <div className="empty-message">No restricted users found</div>
      ) : (
        <div className="moderation-table-container">
          <table className="moderation-table">
            <thead>
              <tr>
                <th>User ID</th>
                <th>Member</th>
                <th>Username</th>
                <th>Reason</th>
                <th>Banned By</th>
                <th>Banned Until</th>
                <th>Revoke</th>
              </tr>
            </thead>
            <tbody>
              {bans.map((ban) => (
                <tr key={ban.banId}>
                  <td className="user-id">#{ban.userId}</td>
                  <td className="member-cell">
                    <UserAvatar
                      avatarUrl={ban.avatarUrl}
                      avatarFrame={ban.frameUrl}
                      frameSize={ban.frameSize}
                      frameX={ban.frameXAxis}
                      frameY={ban.frameYAxis}
                      size="small"
                      className="member-avatar-component"
                    />
                    <span className="member-name">
                      {ban.displayName || ban.username}
                    </span>
                  </td>
                  <td className="username">{ban.username || "-"}</td>
                  <td className="ban-reason-cell" title={ban.reason}>
                    <span className="reason-text">{ban.reason}</span>
                  </td>
                  <td className="banned-by">
                    <span className="banned-by-name">{ban.bannedByDisplayName || "-"}</span>
                  </td>
                  <td className="ban-date">
                    {ban.bannedUntil ? formatDateTime(ban.bannedUntil) : "Permanent"}
                  </td>
                  <td className="action-cell">
                    <button
                      className="revoke-action-btn"
                      onClick={() => handleRevokeConfirm(ban.banId, ban.banType)}
                    >
                      Revoke
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Load More button */}
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
          {!hasMore && bans.length > 0 && (
            <div className="no-more-data">No more entries to load</div>
          )}
        </div>
      )}
    </div>
  );
}
