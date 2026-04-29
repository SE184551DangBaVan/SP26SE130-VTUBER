"use client";

import { useState } from "react";
import PostModerationContent from "../PostModeration/PostModerationContent";
import PostReportsTable from "../PostModeration/PostReportsTable";
import MemberReportsTable from "../MemberModeration/MemberReportsTable";
import "./ModQueueContent.css";

export default function ModQueueContent({ fanHubId, isOwner }) {
  const [activeSubTab, setActiveSubTab] = useState("needsReview");

  return (
    <div className="mod-queue-content">
      <div className="moderation-sub-nav">
        <button 
          className={`sub-nav-btn ${activeSubTab === "needsReview" ? "active" : ""}`}
          onClick={() => setActiveSubTab("needsReview")}
        >
          Needs Review
        </button>
        <button 
          className={`sub-nav-btn ${activeSubTab === "postReports" ? "active" : ""}`}
          onClick={() => setActiveSubTab("postReports")}
        >
          Post Reports
        </button>
        <button 
          className={`sub-nav-btn ${activeSubTab === "memberReports" ? "active" : ""}`}
          onClick={() => setActiveSubTab("memberReports")}
        >
          Member Reports
        </button>
      </div>

      <div className="queue-container">
        {activeSubTab === "needsReview" && (
          <PostModerationContent fanHubId={fanHubId} isOwner={isOwner} initialStatus="PENDING" hideTabs={true} />
        )}
        {activeSubTab === "postReports" && (
          <PostReportsTable fanHubId={fanHubId} isOwner={isOwner} />
        )}
        {activeSubTab === "memberReports" && (
          <MemberReportsTable fanHubId={fanHubId} isOwner={isOwner} />
        )}
      </div>
    </div>
  );
}
