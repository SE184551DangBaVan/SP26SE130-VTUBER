"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/functions/Auth/useAuth.jsx";
import { getFanHubBans, revokeBan } from "@/services/MemberController.jsx";
import "./BansManagementContent.css";

export default function BansManagementContent({ fanHubId }) {
  const { userAuth } = useAuth();
  const [bans, setBans] = useState([]);
  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const [bansPerPage] = useState(10);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDirection, setSortDirection] = useState("desc");

  const [toast, setToast] = useState({ show: false, message: "", type: "" });

  useEffect(() => {
    if (!fanHubId) return;
    async function fetchBans() {
      setLoading(true);
      try {
        const data = await getFanHubBans(fanHubId, 0, 200, sortBy);
        setBans(data);
      } catch (err) {
        console.error("Failed to fetch bans:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchBans();
  }, [fanHubId, sortBy]);

  const showToast = (message, type) => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
  };

  const handleSort = (field) => {
    setCurrentPage(1);
    if (sortBy === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortDirection("asc");
    }
  };

  const handleRevokeBan = async (banId) => {
    try {
      const result = await revokeBan(banId);
      if (result?.success) {
        showToast("Ban revoked successfully!", "success");
        // Refresh bans list
        const data = await getFanHubBans(fanHubId, 0, 200, sortBy);
        setBans(data);
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
    const handleEscape = (e) => { if (e.key === "Escape") {}; };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  const getSortIcon = (field) => sortBy !== field ? " ↕" : sortDirection === "asc" ? " ↑" : " ↓";

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
    // Sort by the most recent ban in each group
    const aLatest = Math.max(...a.bans.map(b => new Date(b.createdAt).getTime()));
    const bLatest = Math.max(...b.bans.map(b => new Date(b.createdAt).getTime()));
    return sortDirection === "asc" ? aLatest - bLatest : bLatest - aLatest;
  });

  const totalPages = Math.ceil(sortedGroupedBans.length / bansPerPage);
  const startIndex = (currentPage - 1) * bansPerPage;
  const endIndex = startIndex + bansPerPage;
  const paginatedBans = sortedGroupedBans.slice(startIndex, endIndex);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible) { for (let i = 1; i <= totalPages; i++) pages.push(i); }
    else {
      if (currentPage <= 3) { for (let i = 1; i <= 4; i++) pages.push(i); pages.push("..."); pages.push(totalPages); }
      else if (currentPage >= totalPages - 2) { pages.push(1); pages.push("..."); for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i); }
      else { pages.push(1); pages.push("..."); for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i); pages.push("..."); pages.push(totalPages); }
    }
    return pages;
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

  if (loading) return <div className="loading">Loading bans...</div>;

  return (
    <div className="bans-moderation-content">
      {toast.show && <div className={`toast-notification ${toast.type}`}>{toast.message}</div>}

      {sortedGroupedBans.length === 0 ? (
        <div className="empty-message">No bans found</div>
      ) : (
        <div className="moderation-table-container">
          <table className="moderation-table">
            <thead>
              <tr>
                <th className="sortable" onClick={() => handleSort("userId")}>User ID{getSortIcon("userId")}</th>
                <th className="sortable" onClick={() => handleSort("displayName")}>Display Name{getSortIcon("displayName")}</th>
                <th className="sortable" onClick={() => handleSort("username")}>Username{getSortIcon("username")}</th>
                <th>Ban Types</th>
                <th>Banned By</th>
                <th className="sortable" onClick={() => handleSort("createdAt")}>Latest Ban Date{getSortIcon("createdAt")}</th>
              </tr>
            </thead>
            <tbody>
              {paginatedBans.map((userBanGroup) => (
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

          {totalPages > 1 && (
            <div className="pagination-container">
              <div className="pagination-info">Showing {startIndex + 1} to {Math.min(endIndex, sortedGroupedBans.length)} of {sortedGroupedBans.length} users</div>
              <div className="pagination-controls">
                <button className="pagination-btn" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>««</button>
                <button className="pagination-btn" onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1}>«</button>
                {getPageNumbers().map((page, index) => (<button key={index} className={`pagination-btn ${page === currentPage ? "active" : ""} ${page === "..." ? "ellipsis" : ""}`} onClick={() => typeof page === "number" && setCurrentPage(page)} disabled={page === "..."}>{page}</button>))}
                <button className="pagination-btn" onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages}>»</button>
                <button className="pagination-btn" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>»»</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
