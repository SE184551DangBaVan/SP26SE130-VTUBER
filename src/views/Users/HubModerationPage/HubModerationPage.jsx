"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useSideBar } from "@/contexts/SideBarContext.tsx";
import { getFanHubBySubdomain } from "@/services/FanHubController";
import PostModerationContent from "./HubModerations/PostModeration/PostModerationContent.jsx";
import MemberModerationContent from "./HubModerations/MemberModeration/MemberModerationContent.jsx";
import BansManagementContent from "./HubModerations/BansManagement/BansManagementContent.jsx";
import ReportsManagementContent from "./HubModerations/ReportsManagement/ReportsManagementContent.jsx";
import "./HubModerationPage.css";

export default function HubModerationPage() {
  const params = useParams();
  const { sideBarRetractor } = useSideBar();
  const [activeTab, setActiveTab] = useState("posts");
  const [fanHubId, setFanHubId] = useState(null);
  const [hubData, setHubData] = useState(null);
  const [loading, setLoading] = useState(true);

  const subdomain = params?.subdomain;

  // Fetch hub by subdomain to get the fanHubId
  useEffect(() => {
    const fetchHub = async () => {
      if (!subdomain) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const hub = await getFanHubBySubdomain(subdomain);
        if (hub) {
          setHubData(hub);
          setFanHubId(hub.fanHubId);
        }
      } catch (error) {
        console.error("Error fetching hub by subdomain:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHub();
  }, [subdomain]);

  if (loading) {
    return (
      <div className={`hub-moderation-page ${!sideBarRetractor ? 'sidebar-retracted' : 'sidebar-expanded'}`}>
        <div className="moderation-loading">
          <p>Loading moderation panel...</p>
        </div>
      </div>
    );
  }

  if (!fanHubId || !hubData) {
    return (
      <div className={`hub-moderation-page ${!sideBarRetractor ? 'sidebar-retracted' : 'sidebar-expanded'}`}>
        <div className="moderation-error">
          <p>Hub not found or unable to load moderation data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`hub-moderation-page ${!sideBarRetractor ? 'sidebar-retracted' : 'sidebar-expanded'}`}>
      {/* Hub Title */}
      <div className="hub-title">
        <h1>Moderate: {hubData.hubName}</h1>
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
        <button
          className={`tab-btn ${activeTab === "reports" ? "active" : ""}`}
          onClick={() => setActiveTab("reports")}
        >
          Reports
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "posts"
        ? <PostModerationContent fanHubId={fanHubId} />
        : activeTab === "members"
        ? <MemberModerationContent fanHubId={fanHubId} />
        : activeTab === "bans"
        ? <BansManagementContent fanHubId={fanHubId} />
        : <ReportsManagementContent fanHubId={fanHubId} />
      }
    </div>
  );
}
