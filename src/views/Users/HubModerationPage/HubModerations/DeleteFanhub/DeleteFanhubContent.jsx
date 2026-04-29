"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteFanHub } from "@/services/FanHubController";
import "./DeleteFanhubContent.css";

export default function DeleteFanhubContent({ fanHubId, hubName }) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmName, setConfirmName] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });

  const showToast = (message, type) => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
  };

  const handleDelete = async () => {
    if (confirmName !== hubName) {
      showToast("Hub name does not match!", "error");
      return;
    }

    setLoading(true);
    try {
      const result = await deleteFanHub(fanHubId);
      if (result?.success) {
        showToast("Fan hub deleted successfully!", "success");
        setTimeout(() => {
          router.push("/home");
        }, 2000);
      } else {
        showToast(result?.message || "Failed to delete fan hub", "error");
      }
    } catch (err) {
      console.error("Delete fan hub error:", err);
      showToast("Error deleting fan hub", "error");
    } finally {
      setLoading(false);
      setIsModalOpen(false);
    }
  };

  return (
    <div className="delete-fanhub-content">
      {toast.show && <div className={`toast-notification ${toast.type}`}>{toast.message}</div>}

      <div className="delete-warning-card">
        <h1>Are you sure you want to do this?</h1>
        <p className="warning-important">This action is irreversible.</p>
        <p className="warning-poetic">One click of a button, and all memories will be gone.</p>
        
        <button 
          className="delete-hub-trigger-btn"
          onClick={() => setIsModalOpen(true)}
        >
          Delete fanhub
        </button>
      </div>

      {isModalOpen && (
        <div className="pm-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="pm-modal-content pm-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pm-modal-header">
              <h2>Confirm Deletion</h2>
              <button className="pm-modal-close" onClick={() => setIsModalOpen(false)}>×</button>
            </div>
            <div className="pm-modal-body">
              <p>To confirm, please type the name of the hub: <strong>{hubName}</strong></p>
              <input 
                type="text" 
                className="confirm-hub-input"
                placeholder="Type hub name here..."
                value={confirmName}
                onChange={(e) => setConfirmName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="pm-modal-footer">
              <button 
                className="pm-modal-cancel-btn" 
                onClick={() => setIsModalOpen(false)}
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                className={`pm-modal-action-btn pm-reject-btn ${confirmName !== hubName ? 'disabled' : ''}`}
                onClick={handleDelete}
                disabled={loading || confirmName !== hubName}
              >
                {loading ? "Deleting..." : "Delete fanhub"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
