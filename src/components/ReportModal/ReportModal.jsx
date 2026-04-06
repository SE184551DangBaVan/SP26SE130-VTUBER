"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import { reportPost, reportMember } from "@/services/ReportController";
import { REPORT_TYPE, REPORT_TYPE_LABELS } from "./reportTypes";
import "./ReportModal.css";

const REASON_MIN_LENGTH = 10;
const REASON_MAX_LENGTH = 500;

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
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Reset form state whenever the modal opens with new data
  useEffect(() => {
    if (isOpen) {
      setReason("");
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

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setError("");

      if (reason.trim().length < REASON_MIN_LENGTH) {
        setError(`Reason must be at least ${REASON_MIN_LENGTH} characters`);
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
          response = await reportPost(targetId, reason.trim());
        } else if (type === REPORT_TYPE.MEMBER) {
          response = await reportMember(targetId, reason.trim());
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
    [reason, type, targetId, onClose]
  );

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const typeLabel = REPORT_TYPE_LABELS[type] || "Content";
  const displayLabel = targetName || typeLabel;

  return (
    <div className="report-modal-backdrop" onClick={handleBackdropClick}>
      <div className="report-modal-container" role="dialog" aria-modal="true" aria-labelledby="report-modal-title">
        {/* Header */}
        <div className="report-modal-header">
          <h2 id="report-modal-title">Report {typeLabel}</h2>
          <button className="report-modal-close-btn" onClick={onClose} aria-label="Close report modal">
            &times;
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="report-modal-form">
          <p className="report-modal-description">
            You are reporting: <span className="report-modal-target-name">{displayLabel}</span>
          </p>

          <label htmlFor="report-reason" className="report-modal-label">
            Reason <span className="required">*</span>
          </label>
          <textarea
            id="report-reason"
            className="report-modal-textarea"
            placeholder={`Describe why you are reporting this ${typeLabel}...`}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={REASON_MAX_LENGTH}
            rows={5}
            disabled={isSubmitting}
          />

          <div className="report-modal-footer">
            <span className={`char-count ${reason.length >= REASON_MAX_LENGTH ? "char-count--limit" : ""}`}>
              {reason.length}/{REASON_MAX_LENGTH}
            </span>

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
                disabled={isSubmitting}
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
