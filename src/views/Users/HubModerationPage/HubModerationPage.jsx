"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useSideBar } from "@/contexts/SideBarContext.tsx";
import PostModerationContent from "./HubModerations/PostModeration/PostModerationContent.jsx";
import MemberModerationContent from "./HubModerations/MemberModeration/MemberModerationContent.jsx";
import BansManagementContent from "./HubModerations/BansManagement/BansManagementContent.jsx";
import "./HubModerationPage.css";

export default function HubModerationPage() {
  const params = useParams();
  const { sideBarRetractor } = useSideBar();
  const [activeTab, setActiveTab] = useState("posts");

  const fanHubId = params?.fanHubId ? parseInt(params.fanHubId, 10) : null;

  return (
    <div className={`hub-moderation-page ${!sideBarRetractor ? 'sidebar-retracted' : 'sidebar-expanded'}`}>
      {/* Hub Title */}
      <div className="hub-title">
        <h1>Fan Hub #{fanHubId}</h1>
      </div>

      {/* Tabs */}
      <div className="moderation-tabs">
        <button
          className={`tab-btn ${activeTab === "posts" ? "active" : ""}`}
          onClick={() => setActiveTab("posts")}
        >
          Posts
        </button>
        <button
          className={`tab-btn ${activeTab === "members" ? "active" : ""}`}
          onClick={() => setActiveTab("members")}
        >
          Members
        </button>
        <button
          className={`tab-btn ${activeTab === "bans" ? "active" : ""}`}
          onClick={() => setActiveTab("bans")}
        >
          Bans
        </button>
      </div>

      {/* Tab Content */}
      {fanHubId && (
        activeTab === "posts"
          ? <PostModerationContent fanHubId={fanHubId} />
          : activeTab === "members"
          ? <MemberModerationContent fanHubId={fanHubId} />
          : <BansManagementContent fanHubId={fanHubId} />
      )}
    </div>
  );
}
