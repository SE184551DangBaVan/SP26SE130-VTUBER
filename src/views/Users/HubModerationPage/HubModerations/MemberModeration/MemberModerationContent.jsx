"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/functions/Auth/useAuth.jsx";
import { banFanHubMember, getHubMembers, getPendingMembers, reviewMember, removeModerator, getMemberDetail, kickMember } from "@/services/MemberController.jsx";
import MemberReportsTable from "./MemberReportsTable";
import PendingMembersTable from "./PendingMembersTable";
import { useHubModeration } from "@/contexts/HubModerationContext";
import UserAvatar from "@/components/UserAvatar/UserAvatar";
import "./MemberModerationContent.css";

const BAN_TYPE_OPTIONS = [
  { value: "COMMENT", label: "Comment" },
  { value: "POST", label: "Post" },
];

const PAGE_SIZE = 10;

export default function MemberModerationContent({ fanHubId, isOwner }) {
  const { counts } = useHubModeration();
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
          Requiring Approval {counts.pendingMembers > 0 && <span className="count-badge">{counts.pendingMembers}</span>}
        </button>
        <button 
          className={`sub-nav-btn ${activeSubTab === "memberReports" ? "active" : ""}`}
          onClick={() => setActiveSubTab("memberReports")}
        >
          Member Reports {counts.memberReports > 0 && <span className="count-badge">{counts.memberReports}</span>}
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
  const [banForm, setBanForm] = useState({
    reason: "",
    banType: "COMMENT",
    durationMode: "TEMPORARY",
    hours: 1,
    days: 0,
    months: 0,
    years: 0
  });
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const [refreshing, setRefreshing] = useState(false);

  // Expandable Row State
  const [expandedMemberId, setExpandedMemberId] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [memberDetail, setMemberDetail] = useState(null);

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
      showToast("Please provide a restriction reason", "error");
      return;
    }

    let bannedUntil = null;
    if (banForm.durationMode === "TEMPORARY") {
      const { hours, days, months, years } = banForm;
      if (hours === 0 && days === 0 && months === 0 && years === 0) {
        showToast("Duration cannot be zero for temporary restriction", "error");
        return;
      }

      const date = new Date();
      date.setHours(date.getHours() + parseInt(hours));
      date.setDate(date.getDate() + parseInt(days));
      date.setMonth(date.getMonth() + parseInt(months));
      date.setFullYear(date.getFullYear() + parseInt(years));
      bannedUntil = date.toISOString();
    }

    try {
      const result = await banFanHubMember({
        fanHubMemberId: selectedMember.id,
        reason: banForm.reason.trim(),
        banType: banForm.banType,
        bannedUntil: bannedUntil,
      });
      if (result?.success) {
        showToast("Member restricted successfully!", "success");
        await fetchMembers(true);
        closeBanModal();
      } else {
        showToast(result?.message || "Failed to restrict member", "error");
      }
    } catch (err) {
      console.error("Restrict member error:", err);
      showToast("Error restricting member", "error");
    }
  };

  const openBanModal = (member) => {
    setSelectedMember(member);
    setBanForm({
      reason: "",
      banType: "COMMENT",
      durationMode: "TEMPORARY",
      hours: 1,
      days: 0,
      months: 0,
      years: 0
    });
    setIsBanModalOpen(true);
  };

  const closeBanModal = () => {
    setIsBanModalOpen(false);
    setSelectedMember(null);
    setBanForm({
      reason: "",
      banType: "COMMENT",
      durationMode: "TEMPORARY",
      hours: 1,
      days: 0,
      months: 0,
      years: 0
    });
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
    // For moderators tab, we don't use the ban button anymore (replaced by demote)
    if (roleFilter === "MODERATOR") return false;
    
    if (member.roleInHub === "MODERATOR" && userAuth.role !== "VTUBER" && userAuth.role !== "ADMIN") {
      return false;
    }
    return true;
  };

  const isVtuber = userAuth?.role === "VTUBER";

  const handleDemote = async (member) => {
    if (!window.confirm(`Are you sure you want to demote ${member.displayName || member.username} from moderator?`)) {
      return;
    }

    try {
      const result = await removeModerator(fanHubId, [member.id]);
      if (result?.success) {
        showToast("Moderator demoted successfully!", "success");
        await fetchMembers(true);
      } else {
        showToast(result?.message || "Failed to demote moderator", "error");
      }
    } catch (err) {
      console.error("Demote moderator error:", err);
      showToast("Error demoting moderator", "error");
    }
  };

  const handleToggleExpand = async (member) => {
    if (roleFilter !== "MEMBER") return; // Only for Approved Members tab
    
    if (expandedMemberId === member.id) {
      setExpandedMemberId(null);
      setMemberDetail(null);
      return;
    }

    setExpandedMemberId(member.id);
    setDetailLoading(true);
    try {
      const res = await getMemberDetail(member.id);
      if (res.success) {
        setMemberDetail(res.data);
      } else {
        showToast(res.message || "Failed to fetch member details", "error");
        setExpandedMemberId(null);
      }
    } catch (err) {
      console.error("Fetch detail error:", err);
      showToast("Error fetching member details", "error");
      setExpandedMemberId(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleKickMember = async (member) => {
    if (!window.confirm(`Are you sure you want to kick ${member.displayName || member.username}?`)) {
      return;
    }

    try {
      const res = await kickMember(fanHubId, member.memberId || member.id);
      if (res.success) {
        showToast("Member kicked successfully!", "success");
        setExpandedMemberId(null);
        await fetchMembers(true);
      } else {
        showToast(res.message || "Failed to kick member", "error");
      }
    } catch (err) {
      console.error("Kick error:", err);
      showToast("Error kicking member", "error");
    }
  };

  if (loading) return <div className="loading">Loading members...</div>;

  // Actions column visibility logic:
  // - Members tab (Approved Members): HIDDEN (using expandable row instead)
  // - Moderators tab: ONLY visible to VTUBER
  const showActionsColumn = roleFilter === "MODERATOR" && isVtuber;

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
                <th>Member</th>
                <th>Username</th>
                <th className="sortable" onClick={() => handleSort("roleInHub")}>Role{getSortIcon("roleInHub")}</th>
                <th className="sortable" onClick={() => handleSort("joinedAt")}>Joined Date{getSortIcon("joinedAt")}</th>
                {showActionsColumn && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <React.Fragment key={member.id}>
                  <tr 
                    onClick={() => handleToggleExpand(member)}
                    className={`${roleFilter === "MEMBER" ? "clickable-row" : ""} ${expandedMemberId === member.id ? "expanded-row" : ""}`}
                  >
                    <td className="member-id">#{member.id}</td>
                    <td className="member-cell">
                      <UserAvatar
                        avatarUrl={member.avatarUrl}
                        avatarFrame={member.frameUrl}
                        frameSize={member.frameSize}
                        frameX={member.frameXAxis}
                        frameY={member.frameYAxis}
                        size="small"
                        className="member-avatar-component"
                      />
                      <span className="member-name">
                        {member.displayName || member.username}
                      </span>
                    </td>
                    <td className="username">{member.username || "-"}</td>
                    <td><span className={`role-badge ${getRoleClass(member.roleInHub)}`}>{member.roleInHub || "MEMBER"}</span></td>
                    <td className="joined-date">{formatDate(member.joinedAt)}</td>
                    {showActionsColumn && (
                      <td className="action-cell" onClick={(e) => e.stopPropagation()}>
                        {roleFilter === "MODERATOR" ? (
                          isVtuber && (
                            <button
                              className="demote-btn"
                              onClick={() => handleDemote(member)}
                              title="Demote to member"
                            >
                              Demote
                            </button>
                          )
                        ) : (
                          <button
                            className="ban-btn"
                            onClick={() => openBanModal(member)}
                            disabled={!canBanMember(member)}
                            title={!canBanMember(member) ? "Only Vtubers/Admins can ban moderators" : ""}
                          >
                            Ban
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                  {expandedMemberId === member.id && (
                    <tr className="expansion-row">
                      <td colSpan={showActionsColumn ? 6 : 5}>
                        <div className="expansion-content">
                          {detailLoading ? (
                            <div className="loading-small">Loading details...</div>
                          ) : memberDetail ? (
                            <div className="member-expanded-details">
                              <div className="details-header">
                                <UserAvatar
                                  avatarUrl={memberDetail.avatarUrl}
                                  avatarFrame={memberDetail.frameUrl}
                                  frameSize={memberDetail.frameSize}
                                  frameX={memberDetail.frameXAxis}
                                  frameY={memberDetail.frameYAxis}
                                  size="profile-dropdown"
                                  className="detail-avatar-small"
                                />
                                <div className="details-main-info">
                                  <h4>{memberDetail.displayName || memberDetail.username}</h4>
                                  <div className="stats-badges">
                                    <span className="stat-badge">Score: <strong>{memberDetail.fanHubScore}</strong></span>
                                  </div>
                                </div>
                                <div className="details-actions">
                                  <button 
                                    className="restrict-btn-small" 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openBanModal({ id: memberDetail.memberId, displayName: memberDetail.displayName, username: memberDetail.username, roleInHub: memberDetail.roleInHub });
                                    }}
                                  >
                                    RESTRICT
                                  </button>
                                  <button 
                                    className="kick-btn-small" 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleKickMember(memberDetail);
                                    }}
                                  >
                                    KICK
                                  </button>
                                </div>
                              </div>
                              
                              {memberDetail.joinAnswers && memberDetail.joinAnswers.length > 0 && (
                                <div className="details-answers">
                                  <h5>Join Answers:</h5>
                                  <div className="answers-grid">
                                    {memberDetail.joinAnswers.map((ans, idx) => (
                                      <div key={idx} className="answer-item-small">
                                        <p className="q-text-small">Q: {ans.questionContent}</p>
                                        <p className="a-text-small">A: {ans.content}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="error-message">Failed to load member details</div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
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

      {/* Restrict Modal */}
      {isBanModalOpen && selectedMember && (
        <div className="mm-modal-overlay restrict-modal-overlay" onClick={closeBanModal}>
          <div className="mm-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="mm-modal-header">
              <h2>Restrict Member</h2>
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
                  <label htmlFor="ban-type">Restriction Type</label>
                  <select id="ban-type" value={banForm.banType} onChange={(e) => setBanForm({ ...banForm, banType: e.target.value })}>
                    {BAN_TYPE_OPTIONS.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                  </select>
                </div>

                <div className="mm-form-group">
                  <label>Restriction Duration</label>
                  <div className="duration-mode-options">
                    <button 
                      className={`mode-btn ${banForm.durationMode === "TEMPORARY" ? "active" : ""}`}
                      onClick={() => setBanForm({ ...banForm, durationMode: "TEMPORARY" })}
                    >
                      Temporary
                    </button>
                    <button 
                      className={`mode-btn ${banForm.durationMode === "PERMANENT" ? "active" : ""}`}
                      onClick={() => setBanForm({ ...banForm, durationMode: "PERMANENT" })}
                    >
                      Permanent
                    </button>
                  </div>
                </div>

                {banForm.durationMode === "TEMPORARY" && (
                  <div className="mm-form-group full-width">
                    <label>Duration Units</label>
                    <div className="duration-units-grid">
                      <div className="unit-field">
                        <label>Hours</label>
                        <input 
                          type="number" 
                          min="0" 
                          value={banForm.hours} 
                          onChange={(e) => setBanForm({ ...banForm, hours: Math.max(0, parseInt(e.target.value) || 0) })} 
                        />
                      </div>
                      <div className="unit-field">
                        <label>Days</label>
                        <input 
                          type="number" 
                          min="0" 
                          value={banForm.days} 
                          onChange={(e) => setBanForm({ ...banForm, days: Math.max(0, parseInt(e.target.value) || 0) })} 
                        />
                      </div>
                      <div className="unit-field">
                        <label>Months</label>
                        <input 
                          type="number" 
                          min="0" 
                          value={banForm.months} 
                          onChange={(e) => setBanForm({ ...banForm, months: Math.max(0, parseInt(e.target.value) || 0) })} 
                        />
                      </div>
                      <div className="unit-field">
                        <label>Years</label>
                        <input 
                          type="number" 
                          min="0" 
                          value={banForm.years} 
                          onChange={(e) => setBanForm({ ...banForm, years: Math.max(0, parseInt(e.target.value) || 0) })} 
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="mm-form-group full-width">
                  <label htmlFor="ban-reason">Reason</label>
                  <textarea id="ban-reason" rows={3} value={banForm.reason} onChange={(e) => setBanForm({ ...banForm, reason: e.target.value })} placeholder="Enter restriction reason..." />
                </div>
              </div>
            </div>
            <div className="mm-modal-footer">
              <button className="mm-modal-cancel-btn" onClick={closeBanModal}>Cancel</button>
              <button className="mm-modal-confirm-btn" onClick={handleBanMember}>Confirm Restriction</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
