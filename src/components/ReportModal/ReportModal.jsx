"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import { reportPost, reportMember } from "@/services/ReportController";
import { REPORT_TYPE, REPORT_TYPE_LABELS, REPORT_REASONS } from "./reportTypes";
import "./ReportModal.css";

const REASON_MIN_LENGTH = 10;
const REASON_MAX_LENGTH = 500;
const OTHER_REASON = "Other";

/**
 * Global Report Modal component.
 * Wrapped by ReportModalProvider so it can be triggered from anywhere.
 *
 * Props:
 *   isOpen     - boolean, controls visibility
 *   onClose    - function, called to close the modal
 *   type       - "POST" | "MEMBER" (from REPORT_TYPE)
 *   targetId   - numeric postId or memberId
 *   targetName - optional display label for context
 */
export default function ReportModal({ isOpen, onClose, type, targetId, targetName }) {
  const [selectedReason, setSelectedReason] = useState(null);
  const [otherReason, setOtherReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const finalReason = selectedReason === OTHER_REASON ? otherReason : selectedReason || "";

  // Reset form state whenever the modal opens with new data
  useEffect(() => {
    if (isOpen) {
      setSelectedReason(null);
      setOtherReason("");
      setIsSubmitting(false);
      setError("");
    }
  }, [isOpen, targetId]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleReasonSelect = (reason) => {
    setSelectedReason(reason);
    if (reason !== OTHER_REASON) {
      setOtherReason("");
    }
    setError("");
  };

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setError("");

      if (selectedReason === OTHER_REASON) {
        if (otherReason.trim().length < REASON_MIN_LENGTH) {
          setError(`Reason must be at least ${REASON_MIN_LENGTH} characters`);
          return;
        }
      } else if (!selectedReason) {
        setError("Please select a reason for reporting");
        return;
      }

      if (!targetId) {
        setError("Missing target information. Cannot submit report.");
        return;
      }

      setIsSubmitting(true);

      try {
        let response;
        if (type === REPORT_TYPE.POST) {
          response = await reportPost(targetId, finalReason.trim());
        } else if (type === REPORT_TYPE.MEMBER) {
          response = await reportMember(targetId, finalReason.trim());
        } else {
          throw new Error("Unknown report type");
        }

        if (response?.success) {
          toast.success(`Report submitted successfully`);
          onClose();
        } else {
          throw new Error(response?.message || "Failed to submit report");
        }
      } catch (err) {
        console.error("Report submission error:", err);
        setError(err.message || "Something went wrong. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [selectedReason, otherReason, finalReason, type, targetId, onClose]
  );

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const typeLabel = REPORT_TYPE_LABELS[type] || "Content";
  const displayLabel = targetName || typeLabel;
  const isOtherSelected = selectedReason === OTHER_REASON;

  return (
    <div className="report-modal-backdrop" onClick={handleBackdropClick}>
      <div className="report-modal-container" role="dialog" aria-modal="true" aria-labelledby="report-modal-title">
        {/* Header */}
        <div className="report-modal-header">
          <h2 id="report-modal-title" className="report-modal-title">Report</h2>
          <button className="report-modal-close-btn" onClick={onClose} aria-label="Close report modal">
            &times;
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="report-modal-form">
          <p className="report-modal-description">
            Why are you reporting this {typeLabel.toLowerCase()}?
          </p>

          <label className="report-modal-label">
            Reason <span className="required">*</span>
          </label>

          {/* Predefined Reason Options */}
          <div className="report-reasons-list">
            {REPORT_REASONS.map((reason) => (
              <button
                key={reason}
                type="button"
                className={`report-reason-option ${selectedReason === reason ? "selected" : ""}`}
                onClick={() => handleReasonSelect(reason)}
                disabled={isSubmitting}
              >
                {reason}
              </button>
            ))}
          </div>

          {/* Other Reason Textarea */}
          {isOtherSelected && (
            <textarea
              id="report-reason-other"
              className="report-modal-textarea"
              placeholder="Please describe the issue in detail..."
              value={otherReason}
              onChange={(e) => setOtherReason(e.target.value)}
              maxLength={REASON_MAX_LENGTH}
              rows={4}
              disabled={isSubmitting}
              autoFocus
            />
          )}

          <div className="report-modal-footer">
            {isOtherSelected && (
              <span className={`char-count ${otherReason.length >= REASON_MAX_LENGTH ? "char-count--limit" : ""}`}>
                {otherReason.length}/{REASON_MAX_LENGTH}
              </span>
            )}

            {error && <p className="report-modal-error">{error}</p>}

            <div className="report-modal-actions">
              <button
                type="button"
                className="report-modal-btn report-modal-btn--cancel"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="report-modal-btn report-modal-btn--submit"
                disabled={isSubmitting || !finalReason.trim()}
              >
                {isSubmitting ? "Submitting..." : "Submit Report"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
