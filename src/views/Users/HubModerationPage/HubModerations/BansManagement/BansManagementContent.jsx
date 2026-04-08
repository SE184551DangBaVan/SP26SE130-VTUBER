"use client";

import { useEffect, useState, useCallback } from "react";
import { getFanHubBans, revokeBan } from "@/services/MemberController.jsx";
import "./BansManagementContent.css";

const PAGE_SIZE = 10;

export default function BansManagementContent({ fanHubId }) {
  const [bans, setBans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [sortBy] = useState("createdAt");

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
      const data = await getFanHubBans(fanHubId, pageNo, PAGE_SIZE, sortBy);

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
  }, [fanHubId, currentPage, sortBy]);

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
  }, [fanHubId, sortBy]);

  const showToast = (message, type) => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
  };

  const handleRevokeBan = async (banId) => {
    try {
      const result = await revokeBan(banId);
      if (result?.success) {
        showToast("Ban revoked successfully!", "success");
        await fetchBans(true);
      } else {
        showToast(result?.message || "Failed to revoke ban", "error");
      }
    } catch (err) {
      console.error("Revoke ban error:", err);
      showToast("Error revoking ban", "error");
    }
  };

  const handleRevokeBanType = async (banId, banType) => {
    const confirmed = window.confirm(`Are you sure you want to revoke the ${banType} ban?`);
    if (confirmed) {
      await handleRevokeBan(banId);
    }
  };

  useEffect(() => {
    const handleEscape = (e) => { if (e.key === "Escape") { /* empty */ } };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  // Group bans by userId to show multiple bans for same user
  const groupedBans = bans.reduce((acc, ban) => {
    if (!acc[ban.userId]) {
      acc[ban.userId] = {
        userId: ban.userId,
        username: ban.username,
        displayName: ban.displayName,
        bans: []
      };
    }
    acc[ban.userId].bans.push(ban);
    return acc;
  }, {});

  const sortedGroupedBans = Object.values(groupedBans).sort((a, b) => {
    const aLatest = Math.max(...a.bans.map(b => new Date(b.createdAt).getTime()));
    const bLatest = Math.max(...b.bans.map(b => new Date(b.createdAt).getTime()));
    return sortDirection === "asc" ? aLatest - bLatest : bLatest - aLatest;
  });

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

  if (loading) return <div className="loading">Loading bans...</div>;

  return (
    <div className="bans-moderation-content">
      <div className="content-toolbar">
        <button className="toolbar-refresh-btn" onClick={handleRefresh} disabled={refreshing} title="Refresh bans">
          {refreshing ? "⟳ Refreshing..." : "⟳ Refresh"}
        </button>
      </div>

      {toast.show && <div className={`toast-notification ${toast.type}`}>{toast.message}</div>}

      {sortedGroupedBans.length === 0 ? (
        <div className="empty-message">No bans found</div>
      ) : (
        <div className="moderation-table-container">
          <table className="moderation-table">
            <thead>
              <tr>
                <th>User ID</th>
                <th>Display Name</th>
                <th>Username</th>
                <th>Ban Types</th>
                <th>Banned By</th>
                <th>Latest Ban Date</th>
              </tr>
            </thead>
            <tbody>
              {sortedGroupedBans.map((userBanGroup) => (
                <tr key={userBanGroup.userId}>
                  <td className="user-id">#{userBanGroup.userId}</td>
                  <td className="display-name">{userBanGroup.displayName || "-"}</td>
                  <td className="username">{userBanGroup.username || "-"}</td>
                  <td className="ban-types-cell">
                    <div className="ban-types-container">
                      {userBanGroup.bans.map((ban) => (
                        <button
                          key={ban.banId}
                          className={`ban-type-badge ${getBanTypeClass(ban.banType)} revoke-badge`}
                          onClick={() => handleRevokeBanType(ban.banId, ban.banType)}
                          title={`Click to revoke ${ban.banType} ban\nReason: ${ban.reason}\nBanned Until: ${ban.bannedUntil ? formatDateTime(ban.bannedUntil) : 'Permanent'}\nBy: ${ban.bannedByDisplayName}\nCreated: ${formatDateTime(ban.createdAt)}`}
                        >
                          {ban.banType} ✕
                        </button>
                      ))}
                    </div>
                  </td>
                  <td className="banned-by">
                    <span className="banned-by-name">{userBanGroup.bans[0].bannedByDisplayName || "-"}</span>
                  </td>
                  <td className="ban-date">
                    {formatDate(userBanGroup.bans.reduce((latest, ban) =>
                      new Date(ban.createdAt) > new Date(latest) ? ban.createdAt : latest,
                      userBanGroup.bans[0].createdAt
                    ))}
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
            <div className="no-more-data">No more bans to load</div>
          )}
        </div>
      )}
    </div>
  );
}
