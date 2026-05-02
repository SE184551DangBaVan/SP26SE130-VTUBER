"use client";

import { useState } from "react";
import { useHubModeration } from "@/contexts/HubModerationContext";
import PostModerationContent from "../PostModeration/PostModerationContent";
import PostReportsTable from "../PostModeration/PostReportsTable";
import MemberReportsTable from "../MemberModeration/MemberReportsTable";
import PendingMembersTable from "../MemberModeration/PendingMembersTable";
import "./ModQueueContent.css";

export default function ModQueueContent({ fanHubId, isOwner }) {
  const [activeSubTab, setActiveSubTab] = useState("postReview");
  const { counts } = useHubModeration();

  return (
    <div className="mod-queue-content">
      <div className="moderation-sub-nav">
        <button 
          className={`sub-nav-btn ${activeSubTab === "postReview" ? "active" : ""}`}
          onClick={() => setActiveSubTab("postReview")}
        >
          Post Review {counts.pendingPosts > 0 && <span className="count-badge">{counts.pendingPosts}</span>}
        </button>
        <button 
          className={`sub-nav-btn ${activeSubTab === "memberApproval" ? "active" : ""}`}
          onClick={() => setActiveSubTab("memberApproval")}
        >
          Member Approval {counts.pendingMembers > 0 && <span className="count-badge">{counts.pendingMembers}</span>}
        </button>
        <button 
          className={`sub-nav-btn ${activeSubTab === "postReports" ? "active" : ""}`}
          onClick={() => setActiveSubTab("postReports")}
        >
          Post Reports {counts.postReports > 0 && <span className="count-badge">{counts.postReports}</span>}
        </button>
        <button 
          className={`sub-nav-btn ${activeSubTab === "memberReports" ? "active" : ""}`}
          onClick={() => setActiveSubTab("memberReports")}
        >
          Member Reports {counts.memberReports > 0 && <span className="count-badge">{counts.memberReports}</span>}
        </button>
      </div>

      <div className="queue-container">
        {activeSubTab === "postReview" && (
          <PostModerationContent fanHubId={fanHubId} isOwner={isOwner} initialStatus="PENDING" hideTabs={true} />
        )}
        {activeSubTab === "memberApproval" && (
          <PendingMembersTable fanHubId={fanHubId} />
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
