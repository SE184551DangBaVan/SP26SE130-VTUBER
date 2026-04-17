"use client";

import { useState } from "react";
import { useReportModal, REPORT_TYPE } from "@/components/ReportModal";

export default function TestReportPage() {
  const { openReportModal } = useReportModal();
  const [targetId, setTargetId] = useState("");
  const [targetName, setTargetName] = useState("");
  const [type, setType] = useState(REPORT_TYPE.POST);

  const handleReport = () => {
    if (!targetId) return;

    openReportModal({
      type,
      targetId: Number(targetId),
      targetName: targetName || undefined,
    });
  };

  return (
    <div style={{ maxWidth: 500, margin: "4rem auto", padding: "2rem", background: "#1a1a1a", borderRadius: 12, color: "#e5e5e5" }}>
      <h1 style={{ marginBottom: "1.5rem" }}>Test Report Modal</h1>

      {/* Type Selector */}
      <div style={{ marginBottom: "1rem" }}>
        <label style={{ display: "block", marginBottom: 4, fontSize: 14, color: "#aaa" }}>Type</label>
        <div style={{ display: "flex", gap: 12 }}>
          <label style={{ cursor: "pointer" }}>
            <input
              type="radio"
              name="reportType"
              value={REPORT_TYPE.POST}
              checked={type === REPORT_TYPE.POST}
              onChange={() => setType(REPORT_TYPE.POST)}
              style={{ marginRight: 6 }}
            />
            Post
          </label>
          <label style={{ cursor: "pointer" }}>
            <input
              type="radio"
              name="reportType"
              value={REPORT_TYPE.MEMBER}
              checked={type === REPORT_TYPE.MEMBER}
              onChange={() => setType(REPORT_TYPE.MEMBER)}
              style={{ marginRight: 6 }}
            />
            Member
          </label>
        </div>
      </div>

      {/* Target ID */}
      <div style={{ marginBottom: "1rem" }}>
        <label style={{ display: "block", marginBottom: 4, fontSize: 14, color: "#aaa" }}>Target ID</label>
        <input
          type="number"
          value={targetId}
          onChange={(e) => setTargetId(e.target.value)}
          placeholder="e.g. 6"
          style={{
            width: "100%",
            padding: "0.6rem 1rem",
            borderRadius: 8,
            border: "1px solid rgba(255,255,255,0.15)",
            background: "rgba(0,0,0,0.4)",
            color: "#e5e5e5",
            fontSize: 15,
          }}
        />
      </div>

      {/* Target Name */}
      <div style={{ marginBottom: "1.5rem" }}>
        <label style={{ display: "block", marginBottom: 4, fontSize: 14, color: "#aaa" }}>Target Name (optional)</label>
        <input
          type="text"
          value={targetName}
          onChange={(e) => setTargetName(e.target.value)}
          placeholder="e.g. Some post title or username"
          style={{
            width: "100%",
            padding: "0.6rem 1rem",
            borderRadius: 8,
            border: "1px solid rgba(255,255,255,0.15)",
            background: "rgba(0,0,0,0.4)",
            color: "#e5e5e5",
            fontSize: 15,
          }}
        />
      </div>

      {/* Report Button */}
      <button
        onClick={handleReport}
        disabled={!targetId}
        style={{
          width: "100%",
          padding: "0.75rem",
          borderRadius: 8,
          border: "none",
          background: targetId ? "linear-gradient(135deg, #3ba55d, #2d8a4e)" : "#555",
          color: "#fff",
          fontSize: 16,
          fontWeight: 600,
          cursor: targetId ? "pointer" : "not-allowed",
          opacity: targetId ? 1 : 0.5,
        }}
      >
        Open Report Modal
      </button>
    </div>
  );
}
