"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/functions/Auth/useAuth.jsx";
import "./MemberModerationContent.css";
import {banFanHubMember, getHubMembers} from "@/services/MemberController.jsx";

const BAN_TYPE_OPTIONS = [
  { value: "COMMENT", label: "Comment" },
  { value: "POST", label: "Post" },
  { value: "JOIN", label: "Join" },
  { value: "INTERACT", label: "Interact" },
];

export default function MemberModerationContent({ fanHubId }) {
  const { userAuth } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const [membersPerPage] = useState(10);
  const [sortBy, setSortBy] = useState("joinedAt");
  const [sortDirection, setSortDirection] = useState("asc");

  const [selectedMember, setSelectedMember] = useState(null);
  const [isBanModalOpen, setIsBanModalOpen] = useState(false);
  const [banForm, setBanForm] = useState({ reason: "", banType: "COMMENT", bannedUntil: "" });
  const [toast, setToast] = useState({ show: false, message: "", type: "" });

  useEffect(() => {
    if (!fanHubId) return;
    async function fetchMembers() {
      setLoading(true);
      try {
        const data = await getHubMembers(fanHubId, 0, 20, sortBy);
        setMembers(data);
      } catch (err) {
        console.error("Failed to fetch members:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchMembers();
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

  const handleBanMember = async () => {
    if (!selectedMember || !banForm.reason.trim()) {
      showToast("Please provide a ban reason", "error");
      return;
    }
    try {
      const result = await banFanHubMember({
        fanHubMemberId: selectedMember.id,
        reason: banForm.reason.trim(),
        banType: banForm.banType,
          bannedUntil: banForm.bannedUntil
              ? new Date(banForm.bannedUntil).toISOString()
              : null,
      });
      if (result?.success) {
        showToast("Member banned successfully!", "success");
        // Refresh the members list to get updated data
        try {
          const data = await getHubMembers(fanHubId, 0, 20, sortBy);
          setMembers(data);
        } catch (err) {
          console.error("Failed to refresh members:", err);
        }
        closeBanModal();
      } else {
        showToast(result?.message || "Failed to ban member", "error");
      }
    } catch (err) {
      console.error("Ban member error:", err);
      showToast("Error banning member", "error");
    }
  };

  const openBanModal = (member) => {
    setSelectedMember(member);
    setBanForm({ reason: "", banType: "COMMENT", bannedUntil: "" });
    setIsBanModalOpen(true);
  };

  const closeBanModal = () => {
    setIsBanModalOpen(false);
    setSelectedMember(null);
    setBanForm({ reason: "", banType: "COMMENT", bannedUntil: "" });
  };

  useEffect(() => {
    const handleEscape = (e) => { if (e.key === "Escape" && isBanModalOpen) closeBanModal(); };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isBanModalOpen]);

  const getSortIcon = (field) => sortBy !== field ? " ↕" : sortDirection === "asc" ? " ↑" : " ↓";

  const sortedMembers = [...members].sort((a, b) => {
    let aVal = a[sortBy], bVal = b[sortBy];
    if (aVal === null || aVal === undefined) aVal = "";
    if (bVal === null || bVal === undefined) bVal = "";
    if (sortBy === "joinedAt") { aVal = new Date(aVal).getTime(); bVal = new Date(bVal).getTime(); }
    if (sortBy === "id") { aVal = Number(aVal); bVal = Number(bVal); }
    return sortDirection === "asc" ? (aVal > bVal ? 1 : aVal < bVal ? -1 : 0) : (aVal < bVal ? 1 : aVal > bVal ? -1 : 0);
  });

  const totalPages = Math.ceil(sortedMembers.length / membersPerPage);
  const startIndex = (currentPage - 1) * membersPerPage;
  const endIndex = startIndex + membersPerPage;
  const paginatedMembers = sortedMembers.slice(startIndex, endIndex);

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

  const getRoleClass = (role) => {
    switch (role?.toUpperCase()) {
      case "ADMIN": return "role-admin";
      case "MODERATOR": return "role-moderator";
      case "VTUBER": return "role-vtuber";
      default: return "role-member";
    }
  };

  const canBanMember = (member) => {
    if (!userAuth?.role) return false;
    // Moderators cannot ban other moderators
    if (member.roleInHub === "MODERATOR" && userAuth.role !== "VTUBER" && userAuth.role !== "ADMIN") {
      return false;
    }
    return true;
  };

  if (loading) return <div className="loading">Loading members...</div>;

  return (
    <div className="member-moderation-content">
      {toast.show && <div className={`toast-notification ${toast.type}`}>{toast.message}</div>}

      {members.length === 0 ? (
        <div className="empty-message">No members found</div>
      ) : (
        <div className="moderation-table-container">
          <table className="moderation-table">
            <thead>
              <tr>
                <th className="sortable" onClick={() => handleSort("id")}>Member ID{getSortIcon("id")}</th>
                <th className="sortable" onClick={() => handleSort("displayName")}>Display Name{getSortIcon("displayName")}</th>
                <th className="sortable" onClick={() => handleSort("username")}>Username{getSortIcon("username")}</th>
                <th>Role</th>
                <th className="sortable" onClick={() => handleSort("joinedAt")}>Joined Date{getSortIcon("joinedAt")}</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedMembers.map((member) => (
                <tr key={member.id}>
                  <td className="member-id">#{member.id}</td>
                  <td className="display-name">{member.displayName || "-"}</td>
                  <td className="username">{member.username || "-"}</td>
                  <td><span className={`role-badge ${getRoleClass(member.roleInHub)}`}>{member.roleInHub || "MEMBER"}</span></td>
                  <td className="joined-date">{formatDate(member.joinedAt)}</td>
                  <td className="action-cell">
                    <button 
                      className="ban-btn" 
                      onClick={() => openBanModal(member)}
                      disabled={!canBanMember(member)}
                      title={!canBanMember(member) ? "Only Vtubers/Admins can ban moderators" : ""}
                    >
                      Ban
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="pagination-container">
              <div className="pagination-info">Showing {startIndex + 1} to {Math.min(endIndex, sortedMembers.length)} of {sortedMembers.length} members</div>
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

      {/* Ban Modal */}
      {isBanModalOpen && selectedMember && (
        <div className="mm-modal-overlay" onClick={closeBanModal}>
          <div className="mm-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="mm-modal-header"><h2>Ban Member</h2><button className="mm-modal-close" onClick={closeBanModal}>×</button></div>
            <div className="mm-modal-body">
              <div className="mm-ban-member-info">
                <p><strong>Member:</strong> {selectedMember.displayName || selectedMember.username}</p>
                <p><strong>Role:</strong> {selectedMember.roleInHub || "MEMBER"}</p>
              </div>
              <div className="mm-ban-form">
                <div className="mm-form-group">
                  <label>Ban Type</label>
                  <select value={banForm.banType} onChange={(e) => setBanForm({ ...banForm, banType: e.target.value })}>
                    {BAN_TYPE_OPTIONS.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                  </select>
                </div>
                <div className="mm-form-group">
                  <label>Banned Until</label>
                  <input type="datetime-local" value={banForm.bannedUntil} onChange={(e) => setBanForm({ ...banForm, bannedUntil: e.target.value })} />
                </div>
                <div className="mm-form-group full-width">
                  <label>Reason</label>
                  <textarea rows={4} value={banForm.reason} onChange={(e) => setBanForm({ ...banForm, reason: e.target.value })} placeholder="Enter ban reason..." />
                </div>
              </div>
              <div className="mm-ban-actions">
                <button className="mm-ban-confirm-btn" onClick={handleBanMember}>Confirm Ban</button>
                <button className="mm-ban-cancel-btn" onClick={closeBanModal}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
