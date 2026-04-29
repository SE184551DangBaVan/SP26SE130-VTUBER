"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/functions/Auth/useAuth.jsx";
import { banFanHubMember, getHubMembers, getPendingMembers } from "@/services/MemberController.jsx";
import MemberReportsTable from "./MemberReportsTable";
import "./MemberModerationContent.css";

const BAN_TYPE_OPTIONS = [
  { value: "COMMENT", label: "Comment" },
  { value: "POST", label: "Post" },
  { value: "JOIN", label: "Join" },
  { value: "INTERACT", label: "Interact" },
];

const PAGE_SIZE = 10;

export default function MemberModerationContent({ fanHubId, isOwner }) {
  const [activeSubTab, setActiveSubTab] = useState("moderators");

  return (
    <div className="member-moderation-content">
      <div className="moderation-sub-nav">
        <button 
          className={`sub-nav-btn ${activeSubTab === "moderators" ? "active" : ""}`}
          onClick={() => setActiveSubTab("moderators")}
        >
          Moderators
        </button>
        <button 
          className={`sub-nav-btn ${activeSubTab === "members" ? "active" : ""}`}
          onClick={() => setActiveSubTab("members")}
        >
          Approved Members
        </button>
        <button 
          className={`sub-nav-btn ${activeSubTab === "pending" ? "active" : ""}`}
          onClick={() => setActiveSubTab("pending")}
        >
          Requiring Approval
        </button>
        <button 
          className={`sub-nav-btn ${activeSubTab === "memberReports" ? "active" : ""}`}
          onClick={() => setActiveSubTab("memberReports")}
        >
          Member Reports
        </button>
      </div>

      {activeSubTab === "moderators" ? (
        <MembersTable fanHubId={fanHubId} roleFilter="MODERATOR" />
      ) : activeSubTab === "members" ? (
        <MembersTable fanHubId={fanHubId} roleFilter="MEMBER" />
      ) : activeSubTab === "pending" ? (
        <PendingMembersTable fanHubId={fanHubId} />
      ) : (
        <MemberReportsTable fanHubId={fanHubId} isOwner={isOwner} />
      )}
    </div>
  );
}

/* ───────── Pending Members Table ───────── */
function PendingMembersTable({ fanHubId }) {
  const [pendingMembers, setPendingMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  
  const [selectedPending, setSelectedPending] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchPending = useCallback(async (reset = false) => {
    if (reset) {
      setLoading(true);
      setPendingMembers([]);
      setCurrentPage(0);
      setHasMore(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const pageNo = reset ? 0 : currentPage;
      const data = await getPendingMembers(fanHubId, pageNo, PAGE_SIZE);

      let items = [];
      if (data && typeof data === "object" && data.content) {
        items = Array.isArray(data.content) ? data.content : [];
      } else if (Array.isArray(data)) {
        items = data;
      }

      if (reset) {
        setPendingMembers(items);
      } else {
        setPendingMembers(prev => [...prev, ...items]);
      }

      setHasMore(items.length === PAGE_SIZE);
      setCurrentPage(prev => reset ? 1 : prev + 1);
    } catch (err) {
      console.error("Failed to fetch pending members:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [fanHubId, currentPage]);

  useEffect(() => {
    if (fanHubId) fetchPending(true);
  }, [fanHubId]);

  const handleApprove = (member) => {
    console.log("approve button clicked", member.id);
  };

  const handleReject = (member) => {
    console.log("reject button clicked", member.id);
  };

  const openModal = (member) => {
    setSelectedPending(member);
    setIsModalOpen(true);
  };

  if (loading) return <div className="loading">Loading requests...</div>;

  return (
    <div className="pending-members-wrapper">
      {pendingMembers.length === 0 ? (
        <div className="empty-message">No pending join requests</div>
      ) : (
        <div className="moderation-table-container">
          <table className="moderation-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Member</th>
                <th>Has Answers</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingMembers.map((m) => (
                <tr key={m.id}>
                  <td>#{m.id}</td>
                  <td>
                    <div className="member-cell">
                      <img src={m.avatarUrl || "/profile-pic-undefined.jpg"} alt="" className="table-avatar" />
                      <span>{m.displayName || m.username}</span>
                    </div>
                  </td>
                  <td>
                    {m.joinAnswers && m.joinAnswers.length > 0 ? (
                      <button className="view-answers-btn" onClick={() => openModal(m)}>
                        Yes (View)
                      </button>
                    ) : (
                      "No"
                    )}
                  </td>
                  <td>
                    <div className="action-btns">
                      <button className="approve-btn" onClick={() => handleApprove(m)}>APPROVE</button>
                      <button className="reject-btn" onClick={() => handleReject(m)}>REJECT</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {hasMore && (
            <div className="load-more-container">
              <button className="load-more-btn" onClick={() => fetchPending(false)} disabled={loadingMore}>
                {loadingMore ? "Loading..." : "Load more"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Answers Modal */}
      {isModalOpen && selectedPending && (
        <div className="mm-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="mm-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="mm-modal-header">
              <h2>Join Request Details</h2>
              <button className="mm-modal-close" onClick={() => setIsModalOpen(false)}>×</button>
            </div>
            <div className="mm-modal-body">
              <div className="member-info-header">
                <img src={selectedPending.avatarUrl || "/profile-pic-undefined.jpg"} alt="" className="modal-avatar" />
                <div>
                  <h3>{selectedPending.displayName || selectedPending.username}</h3>
                  <p>ID: #{selectedPending.id}</p>
                </div>
              </div>

              <div className="answers-section">
                <h4>Submitted Answers:</h4>
                {selectedPending.joinAnswers?.map((ans, idx) => (
                  <div key={idx} className="answer-item">
                    <p className="question-text"><strong>Q{idx + 1}:</strong> {ans.questionContent}</p>
                    <p className="answer-text">{ans.content}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="mm-modal-footer">
              <button className="approve-btn" onClick={() => { handleApprove(selectedPending); setIsModalOpen(false); }}>APPROVE</button>
              <button className="reject-btn" onClick={() => { handleReject(selectedPending); setIsModalOpen(false); }}>REJECT</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ───────── Members Table ───────── */
function MembersTable({ fanHubId, roleFilter }) {
  const { userAuth } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [sortBy, setSortBy] = useState("joinedAt");

  const [selectedMember, setSelectedMember] = useState(null);
  const [isBanModalOpen, setIsBanModalOpen] = useState(false);
  const [banForm, setBanForm] = useState({ reason: "", banType: "COMMENT", bannedUntil: "" });
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const [refreshing, setRefreshing] = useState(false);

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
      const data = await getHubMembers(fanHubId, pageNo, PAGE_SIZE, sortBy, roleFilter);

      let items = [];
      if (data && typeof data === "object" && data.content) {
        items = Array.isArray(data.content) ? data.content : [];
      } else if (Array.isArray(data)) {
        items = data;
      }

      if (reset) {
        setMembers(items);
      } else {
        setMembers(prev => [...prev, ...items]);
      }

      setHasMore(items.length === PAGE_SIZE);
      setCurrentPage(prev => reset ? 1 : prev + 1);
    } catch (err) {
      console.error("Failed to fetch members:", err);
      if (reset) setMembers([]);
      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [fanHubId, currentPage, sortBy, roleFilter]);

  const handleLoadMore = () => {
    fetchMembers(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchMembers(true);
  };

  useEffect(() => {
    if (!fanHubId) return;
    fetchMembers(true);
  }, [fanHubId, sortBy, roleFilter]);

  const showToast = (message, type) => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
  };

  const handleSort = (field) => {
    setSortBy(field);
  };

  const getSortIcon = (field) => sortBy === field ? " ↑" : " ↕";

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
        await fetchMembers(true);
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
    if (member.roleInHub === "MODERATOR" && userAuth.role !== "VTUBER" && userAuth.role !== "ADMIN") {
      return false;
    }
    return true;
  };

  if (loading) return <div className="loading">Loading members...</div>;

  return (
    <div className="members-table-wrapper">
      <div className="content-toolbar">
        <button className="toolbar-refresh-btn" onClick={handleRefresh} disabled={refreshing} title="Refresh members">
          {refreshing ? "⟳ Refreshing..." : "⟳ Refresh"}
        </button>
      </div>

      {toast.show && <div className={`toast-notification ${toast.type}`}>{toast.message}</div>}

      {members.length === 0 ? (
        <div className="empty-message">No members found</div>
      ) : (
        <div className="moderation-table-container">
          <table className="moderation-table">
            <thead>
              <tr>
                <th className="sortable" onClick={() => handleSort("id")}>Member ID{getSortIcon("id")}</th>
                <th>Display Name</th>
                <th>Username</th>
                <th className="sortable" onClick={() => handleSort("roleInHub")}>Role{getSortIcon("roleInHub")}</th>
                <th className="sortable" onClick={() => handleSort("joinedAt")}>Joined Date{getSortIcon("joinedAt")}</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
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
          {!hasMore && members.length > 0 && (
            <div className="no-more-data">No more members to load</div>
          )}
        </div>
      )}

      {/* Ban Modal */}
      {isBanModalOpen && selectedMember && (
        <div className="mm-modal-overlay" onClick={closeBanModal}>
          <div className="mm-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="mm-modal-header">
              <h2>Ban Member</h2>
              <button className="mm-modal-close" onClick={closeBanModal}>×</button>
            </div>
            <div className="mm-modal-body">
              <div className="mm-ban-member-info">
                <div className="mm-ban-info-grid">
                  <div className="mm-ban-info-item"><span className="mm-ban-info-label">Member:</span><span className="mm-ban-info-value">{selectedMember.displayName || selectedMember.username}</span></div>
                  <div className="mm-ban-info-item"><span className="mm-ban-info-label">Role:</span><span className="mm-ban-info-value">{selectedMember.roleInHub || "MEMBER"}</span></div>
                </div>
              </div>
              <div className="mm-ban-form">
                <div className="mm-form-group">
                  <label htmlFor="ban-type">Ban Type</label>
                  <select id="ban-type" value={banForm.banType} onChange={(e) => setBanForm({ ...banForm, banType: e.target.value })}>
                    {BAN_TYPE_OPTIONS.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                  </select>
                </div>
                <div className="mm-form-group">
                  <label htmlFor="ban-until">Banned Until</label>
                  <input id="ban-until" type="datetime-local" value={banForm.bannedUntil} onChange={(e) => setBanForm({ ...banForm, bannedUntil: e.target.value })} />
                </div>
                <div className="mm-form-group full-width">
                  <label htmlFor="ban-reason">Reason</label>
                  <textarea id="ban-reason" rows={4} value={banForm.reason} onChange={(e) => setBanForm({ ...banForm, reason: e.target.value })} placeholder="Enter ban reason..." />
                </div>
              </div>
            </div>
            <div className="mm-modal-footer">
              <button className="mm-modal-cancel-btn" onClick={closeBanModal}>Cancel</button>
              <button className="mm-modal-confirm-btn" onClick={handleBanMember}>Confirm Ban</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
