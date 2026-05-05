"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/functions/Auth/useAuth.jsx";
import { getMembersWithReports, bulkResolveMemberReports } from "@/services/ReportController";
import { kickMember, banFanHubMember, removeModerator } from "@/services/MemberController.jsx";
import UserAvatar from "@/components/UserAvatar/UserAvatar";

const PAGE_SIZE = 10;

export default function MemberReportsTable({ fanHubId, isOwner }) {
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

  const [isRestrictModalOpen, setIsRestrictModalOpen] = useState(false);
  const [restrictForm, setRestrictForm] = useState({
    reason: "",
    banType: "COMMENT",
    durationMode: "TEMPORARY",
    hours: 1,
    days: 0,
    months: 0,
    years: 0,
  });
  const [restricting, setRestricting] = useState(false);
  const [kicking, setKicking] = useState(false);
  const [demoting, setDemoting] = useState(false);

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

    if (memberUsername && currentUsername && memberUsername === currentUsername && !isOwner) {
      showToast("You cannot resolve reports against yourself", "error");
      return;
    }

    const isReportedBySelf = selectedMember.reports.some(
      (r) => r.reportedByUsername === currentUsername
    );
    if (isReportedBySelf && !isOwner) {
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

  const handleKickMember = async () => {
    if (!selectedMember) return;
    if (!window.confirm(`Are you sure you want to kick ${selectedMember.displayName || selectedMember.username}?`)) {
      return;
    }

    setKicking(true);
    try {
      const res = await kickMember(fanHubId, selectedMember.memberId);
      if (res.success) {
        showToast("Member kicked successfully!", "success");
        await fetchMembers(true);
        closeDetailsModal();
      } else {
        showToast(res.message || "Failed to kick member", "error");
      }
    } catch (err) {
      console.error("Kick error:", err);
      showToast("Error kicking member", "error");
    } finally {
      setKicking(false);
    }
  };

  const handleRestrictMember = async () => {
    if (!selectedMember || !restrictForm.reason.trim()) {
      showToast("Please provide a restriction reason", "error");
      return;
    }

    let bannedUntil = null;
    if (restrictForm.durationMode === "TEMPORARY") {
      const { hours, days, months, years } = restrictForm;
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

    setRestricting(true);
    try {
      const result = await banFanHubMember({
        fanHubMemberId: selectedMember.memberId,
        reason: restrictForm.reason.trim(),
        banType: restrictForm.banType,
        bannedUntil: bannedUntil,
      });
      if (result?.success) {
        showToast("Member restricted successfully!", "success");
        await fetchMembers(true);
        closeRestrictModal();
        closeDetailsModal();
      } else {
        showToast(result?.message || "Failed to restrict member", "error");
      }
    } catch (err) {
      console.error("Restrict member error:", err);
      showToast("Error restricting member", "error");
    } finally {
      setRestricting(false);
    }
  };

  const handleDemoteModerator = async () => {
    if (!selectedMember || !isOwner) return;
    if (!window.confirm(`Are you sure you want to demote ${selectedMember.displayName || selectedMember.username} to a regular member?`)) {
      return;
    }

    setDemoting(true);
    try {
      const res = await removeModerator(fanHubId, [selectedMember.memberId]);
      if (res.success) {
        showToast("Moderator demoted successfully!", "success");
        await fetchMembers(true);
        closeDetailsModal();
      } else {
        showToast(res.message || "Failed to demote moderator", "error");
      }
    } catch (err) {
      console.error("Demote error:", err);
      showToast("Error demoting moderator", "error");
    } finally {
      setDemoting(false);
    }
  };

  const openRestrictModal = () => {
    setRestrictForm({
      reason: "",
      banType: "COMMENT",
      durationMode: "TEMPORARY",
      hours: 1,
      days: 0,
      months: 0,
      years: 0
    });
    setIsRestrictModalOpen(true);
  };

  const closeRestrictModal = () => {
    setIsRestrictModalOpen(false);
    setRestrictForm({
      reason: "",
      banType: "COMMENT",
      durationMode: "TEMPORARY",
      hours: 1,
      days: 0,
      months: 0,
      years: 0
    });
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
      case "ADMIN": return "role-admin";
      case "MODERATOR": return "role-moderator";
      case "MEMBER": return "role-member";
      default: return "role-unknown";
    }
  };

  const getReportStatusClass = (status) => {
    switch (status?.toUpperCase()) {
      case "PENDING": return "report-pending";
      case "RESOLVED": return "report-resolved";
      default: return "report-unknown";
    }
  };

  if (loading) return <div className="loading">Loading member reports...</div>;

  return (
    <div className="reports-table-wrapper">
      <div className="reports-toolbar">
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
                <th>Role</th>
                <th>Reports</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => {
                const totalReports = member.reports?.length || 0;

                return (
                  <tr key={member.memberId}>
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
                    <td className="username-cell">{member.username}</td>
                    <td className="status-cell">
                      <span className={`member-role-badge ${getMemberRoleClass(member.roleInHub)}`}>
                        {member.roleInHub}
                      </span>
                    </td>
                    <td className="reports-count">{totalReports}</td>
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
              <button className="report-details-close" onClick={closeDetailsModal}>
                ×
              </button>
              <h2>Member Report Details</h2>
              <div style={{ width: '24px' }}></div> {/* Spacer to balance the header if needed, but space-between is used */}
            </div>
            <div className="post-details-body">
              <div className="post-info-section">
                <h3>Member Information</h3>
                <div className="report-info-grid">
                  <div className="report-info-item"><span className="report-info-label">Member ID:</span><span className="report-info-value">#{selectedMember.memberId}</span></div>
                  <div className="report-info-item"><span className="report-info-label">Username:</span><span className="report-info-value">{selectedMember.username}</span></div>
                  <div className="report-info-item"><span className="report-info-label">Display Name:</span><span className="report-info-value">{selectedMember.displayName || "-"}</span></div>
                  <div className="report-info-item"><span className="report-info-label">Fan Hub:</span><span className="report-info-value">{selectedMember.fanHubName}</span></div>
                  <div className="report-info-item"><span className="report-info-label">Role:</span><span className={`member-role-badge ${getMemberRoleClass(selectedMember.roleInHub)}`}>{selectedMember.roleInHub}</span></div>
                  <div className="report-info-item"><span className="report-info-label">Status:</span><span className="report-info-value">{selectedMember.memberStatus}</span></div>
                  <div className="report-info-item">
                    <span className="report-info-label">Avatar:</span>
                    <div className="report-info-value" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <UserAvatar
                        avatarUrl={selectedMember.avatarUrl}
                        avatarFrame={selectedMember.frameUrl}
                        frameSize={selectedMember.frameSize}
                        frameX={selectedMember.frameXAxis}
                        frameY={selectedMember.frameYAxis}
                        size="small"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="reports-list-section">
                <h3>Reports ({selectedMember.reports?.length || 0}) {selectedMember.reports?.filter((r) => r.reportStatus === "PENDING").length > 0 && (<span className="pending-reports-indicator">{selectedMember.reports.filter((r) => r.reportStatus === "PENDING").length} pending</span>)}</h3>
                <div className="reports-list">
                  {selectedMember.reports?.map((report) => (
                    <div key={report.reportId} className="report-card">
                      <div className="report-card-header"><span className="report-card-id">Report #{report.reportId}</span><span className={`report-status-badge ${getReportStatusClass(report.reportStatus)}`}>{report.reportStatus}</span></div>
                      <div className="report-card-body">
                        <div className="report-row"><span className="report-label">Reported By:</span><span className="report-value">{report.reportedByDisplayName || report.reportedByUsername}</span></div>
                        <div className="report-row"><span className="report-label">Reason:</span><span className="report-value">{report.reason}</span></div>
                        <div className="report-row"><span className="report-label">Date:</span><span className="report-value">{formatDateTime(report.reportCreatedAt)}</span></div>
                        {report.relatedComment && (<div className="report-row full-width"><span className="report-label">Related Comment:</span><span className="report-value">{typeof report.relatedComment === "string" ? report.relatedComment : report.relatedComment.content || `Comment #${report.relatedComment.commentId}`}</span></div>)}
                        {report.reportStatus === "RESOLVED" && (
                          <><div className="report-row"><span className="report-label">Resolved By:</span><span className="report-value">{report.resolvedByDisplayName || report.resolvedByUsername || "-"}</span></div>{report.resolveMessage && (<div className="report-row full-width"><span className="report-label">Resolution:</span><span className="report-value">{report.resolveMessage}</span></div>)}</>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Only show resolve form if the user has permission to resolve */}
              {(isOwner || selectedMember.roleInHub !== "MODERATOR") && selectedMember.reports?.some((r) => r.reportStatus === "PENDING") && (
                <div className="resolve-form-section">
                  <h3>Resolve All Pending Reports</h3>
                  <div className="resolve-form-group"><label htmlFor="resolve-message">Resolution Message <span className="required">*</span></label><textarea id="resolve-message" className="resolve-textarea" placeholder="Provide your resolution reason..." value={resolveMessage} onChange={(e) => setResolveMessage(e.target.value)} rows={4} disabled={resolving} /></div>
                </div>
              )}
            </div>
            <div className="post-details-actions">
              <div className="moderation-actions-left">
                {/* Moderators cannot restrict/kick each other, only members. isOwner (VTUBER) can do everything. */}
                {(isOwner || selectedMember.roleInHub !== "MODERATOR") && (
                  <>
                    <button 
                      className="restrict-btn-small" 
                      onClick={openRestrictModal}
                      disabled={kicking || restricting || resolving || demoting}
                    >
                      Restrict
                    </button>
                    <button 
                      className="kick-btn-small" 
                      onClick={handleKickMember}
                      disabled={kicking || restricting || resolving || demoting}
                    >
                      {kicking ? "Kicking..." : "Kick"}
                    </button>
                  </>
                )}
                
                {/* VTUBER can demote moderators */}
                {isOwner && selectedMember.roleInHub === "MODERATOR" && (
                  <button 
                    className="demote-btn" 
                    onClick={handleDemoteModerator}
                    disabled={kicking || restricting || resolving || demoting}
                    style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}
                  >
                    {demoting ? "Demoting..." : "Demote"}
                  </button>
                )}
              </div>
              <div className="moderation-actions-right">
                <button className="resolve-cancel-btn" onClick={closeDetailsModal} disabled={resolving || kicking || restricting || demoting}>Cancel</button>
                {/* Reports against moderators can only be resolved by VTUBER (isOwner) */}
                {(isOwner || selectedMember.roleInHub !== "MODERATOR") && selectedMember.reports?.some((r) => r.reportStatus === "PENDING") && (
                  <button className="resolve-confirm-btn" onClick={handleResolveAll} disabled={resolving || !resolveMessage.trim() || kicking || restricting || demoting}>{resolving ? "Resolving..." : `Resolve ${selectedMember.reports.filter((r) => r.reportStatus === "PENDING").length} Pending Report(s)`}</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Restrict Modal */}
      {isRestrictModalOpen && selectedMember && (
        <div className="mm-modal-overlay restrict-modal-overlay" onClick={closeRestrictModal}>
          <div className="mm-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="mm-modal-header">
              <h2>Restrict Member</h2>
              <button className="mm-modal-close" onClick={closeRestrictModal}>×</button>
            </div>
            <div className="mm-modal-body">
              <div className="mm-ban-member-info">
                <div className="mm-ban-info-grid">
                  <div className="mm-ban-info-item">
                    <span className="mm-ban-info-label">Member</span>
                    <span className="mm-ban-info-value">{selectedMember.displayName || selectedMember.username}</span>
                  </div>
                  <div className="mm-ban-info-item">
                    <span className="mm-ban-info-label">Username</span>
                    <span className="mm-ban-info-value">@{selectedMember.username}</span>
                  </div>
                </div>
              </div>

              <div className="mm-ban-form">
                <div className="mm-form-group">
                  <label htmlFor="ban-type">Restriction Type</label>
                  <select 
                    id="ban-type" 
                    value={restrictForm.banType}
                    onChange={(e) => setRestrictForm({ ...restrictForm, banType: e.target.value })}
                  >
                    <option value="COMMENT">Restrict Commenting</option>
                    <option value="POST">Restrict Posting</option>
                  </select>
                </div>

                <div className="mm-form-group">
                  <label>Restriction Duration</label>
                  <div className="duration-mode-options">
                    <button 
                      className={`mode-btn ${restrictForm.durationMode === "TEMPORARY" ? "active" : ""}`}
                      onClick={() => setRestrictForm({ ...restrictForm, durationMode: "TEMPORARY" })}
                    >
                      Temporary
                    </button>
                    <button 
                      className={`mode-btn ${restrictForm.durationMode === "PERMANENT" ? "active" : ""}`}
                      onClick={() => setRestrictForm({ ...restrictForm, durationMode: "PERMANENT" })}
                    >
                      Permanent
                    </button>
                  </div>
                  
                  {restrictForm.durationMode === "TEMPORARY" && (
                    <div className="duration-units-grid">
                      <div className="unit-field">
                        <label>Hours</label>
                        <input 
                          type="number" min="0" value={restrictForm.hours}
                          onChange={(e) => setRestrictForm({ ...restrictForm, hours: Math.max(0, parseInt(e.target.value) || 0) })}
                        />
                      </div>
                      <div className="unit-field">
                        <label>Days</label>
                        <input 
                          type="number" min="0" value={restrictForm.days}
                          onChange={(e) => setRestrictForm({ ...restrictForm, days: Math.max(0, parseInt(e.target.value) || 0) })}
                        />
                      </div>
                      <div className="unit-field">
                        <label>Months</label>
                        <input 
                          type="number" min="0" value={restrictForm.months}
                          onChange={(e) => setRestrictForm({ ...restrictForm, months: Math.max(0, parseInt(e.target.value) || 0) })}
                        />
                      </div>
                      <div className="unit-field">
                        <label>Years</label>
                        <input 
                          type="number" min="0" value={restrictForm.years}
                          onChange={(e) => setRestrictForm({ ...restrictForm, years: Math.max(0, parseInt(e.target.value) || 0) })}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="mm-form-group">
                  <label htmlFor="ban-reason">Reason for Restriction <span className="required">*</span></label>
                  <textarea 
                    id="ban-reason" 
                    rows={3}
                    value={restrictForm.reason}
                    onChange={(e) => setRestrictForm({ ...restrictForm, reason: e.target.value })}
                    placeholder="Enter restriction reason..."
                  />
                </div>
              </div>
            </div>
            <div className="mm-modal-footer">
              <button className="mm-modal-cancel-btn" onClick={closeRestrictModal} disabled={restricting}>Cancel</button>
              <button 
                className="mm-modal-confirm-btn" 
                onClick={handleRestrictMember}
                disabled={restricting || !restrictForm.reason.trim()}
              >
                {restricting ? "Restricting..." : "Confirm Restriction"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
