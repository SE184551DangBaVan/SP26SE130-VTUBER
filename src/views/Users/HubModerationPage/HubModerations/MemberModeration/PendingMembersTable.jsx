"use client";

import React, { useEffect, useState, useCallback } from "react";
import { getPendingMembers, reviewMember } from "@/services/MemberController.jsx";
import UserAvatar from "@/components/UserAvatar/UserAvatar";
import "./MemberModerationContent.css";

const PAGE_SIZE = 10;

export default function PendingMembersTable({ fanHubId }) {
  const [pendingMembers, setPendingMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  
  const [selectedPending, setSelectedPending] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });

  const showToast = (message, type) => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
  };

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

  const handleApprove = async (member) => {
    try {
      const res = await reviewMember(member.id, "APPROVED");
      if (res.success) {
        showToast("Membership request approved!", "success");
        fetchPending(true);
      } else {
        showToast(res.message || "Failed to approve membership request", "error");
      }
    } catch (err) {
      console.error("Approve error:", err);
      showToast("An error occurred while approving", "error");
    }
  };

  const handleReject = async (member) => {
    try {
      const res = await reviewMember(member.id, "REJECTED");
      if (res.success) {
        showToast("Membership request rejected!", "success");
        fetchPending(true);
      } else {
        showToast(res.message || "Failed to reject membership request", "error");
      }
    } catch (err) {
      console.error("Reject error:", err);
      showToast("An error occurred while rejecting", "error");
    }
  };

  const openModal = (member) => {
    setSelectedPending(member);
    setIsModalOpen(true);
  };

  const handleRefresh = async () => {
    await fetchPending(true);
  };

  if (loading) return <div className="loading">Loading requests...</div>;

  return (
    <div className="pending-members-wrapper">
      <div className="content-toolbar">
        <button 
          className="toolbar-refresh-btn" 
          onClick={handleRefresh} 
          disabled={loadingMore} 
          title="Refresh pending requests"
        >
          {loadingMore ? "⟳ Refreshing..." : "⟳ Refresh"}
        </button>
      </div>

      {toast.show && <div className={`toast-notification ${toast.type}`}>{toast.message}</div>}
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
                      <UserAvatar
                        avatarUrl={m.avatarUrl}
                        size="small"
                        className="table-avatar"
                      />
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
                <UserAvatar
                  avatarUrl={selectedPending.avatarUrl}
                  size="medium"
                  className="modal-avatar"
                />
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
