"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useSideBar } from "@/contexts/SideBarContext.tsx";
import { getFanHubBySubdomain } from "@/services/FanHubController";
import PostModerationContent from "./HubModerations/PostModeration/PostModerationContent.jsx";
import MemberModerationContent from "./HubModerations/MemberModeration/MemberModerationContent.jsx";
import BansManagementContent from "./HubModerations/BansManagement/BansManagementContent.jsx";
import GeneralSettingsContent from "./HubModerations/GeneralSettings/GeneralSettingsContent.jsx";
import DeleteFanhubContent from "./HubModerations/DeleteFanhub/DeleteFanhubContent.jsx";
import ModQueueContent from "./HubModerations/ModQueue/ModQueueContent.jsx";
import HubCustomizationContent from "./HubModerations/HubCustomization/HubCustomizationContent.jsx";
import "./HubModerationPage.css";

export default function HubModerationPage() {
  const params = useParams();
  const { sideBarRetractor } = useSideBar();
  const [activeTab, setActiveTab] = useState("modQueue");
  const [fanHubId, setFanHubId] = useState(null);
  const [hubData, setHubData] = useState(null);
  const [loading, setLoading] = useState(true);

  const subdomain = params?.subdomain;

  // Get current user ID from storage
  const currentUserId = parseInt(
    sessionStorage.getItem("userID") || localStorage.getItem("userID") || "0"
  );
  const currentUserRole = sessionStorage.getItem("role") || localStorage.getItem("role") || "";

  const isOwner = hubData && hubData.ownerUserId === currentUserId;
  const isVTuber = currentUserRole === "VTUBER";

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
      <div className="moderation-layout-container">
        {/* Sidebar */}
        <aside className="moderation-sidebar">
          <Link href={`/hub/${subdomain}`} className="back-to-hub-link">
            ← Go back to hub
          </Link>
          <div className="hub-title">
            <img 
              src={hubData.avatarUrl || '/profile-pic-undefined.jpg'} 
              alt={hubData.hubName} 
              className="hub-avatar-mini" 
              onError={(e) => { e.target.src = '/profile-pic-undefined.jpg'; }}
            />
            <h1>h/{hubData.hubName}</h1>
          </div>
          
          <div className="moderation-sidebar-nav">
            <div className="nav-group">
              <span className="nav-group-label">Moderation</span>
              <button
                className={`tab-btn ${activeTab === "modQueue" ? "active" : ""}`}
                onClick={() => setActiveTab("modQueue")}
              >
                Mod Queue
              </button>
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
                Members & Mods
              </button>
              <button
                className={`tab-btn ${activeTab === "bans" ? "active" : ""}`}
                onClick={() => setActiveTab("bans")}
              >
                Restricted Users
              </button>
            </div>

            {isOwner && (
              <div className="nav-group">
                <span className="nav-group-label">Settings</span>
                <button
                  className={`tab-btn ${activeTab === "general" ? "active" : ""}`}
                  onClick={() => setActiveTab("general")}
                >
                  Hub Settings
                </button>
                {isVTuber && (
                  <button
                    className={`tab-btn ${activeTab === "customization" ? "active" : ""}`}
                    onClick={() => setActiveTab("customization")}
                  >
                    Hub Customization
                  </button>
                )}
                <button
                  className={`tab-btn red-font ${activeTab === "delete" ? "active" : ""}`}
                  onClick={() => setActiveTab("delete")}
                >
                  Delete Fan Hub
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="moderation-main-content">
          {activeTab === "modQueue"
            ? <ModQueueContent fanHubId={fanHubId} isOwner={isOwner} />
            : activeTab === "posts"
            ? <PostModerationContent fanHubId={fanHubId} isOwner={isOwner} />
            : activeTab === "members"
            ? <MemberModerationContent fanHubId={fanHubId} isOwner={isOwner} />
            : activeTab === "bans"
            ? <BansManagementContent fanHubId={fanHubId} />
            : (isOwner && activeTab === "customization" && isVTuber)
            ? <HubCustomizationContent fanHubId={fanHubId} hubData={hubData} />
            : (isOwner && activeTab === "general")
            ? <GeneralSettingsContent fanHubId={fanHubId} hubData={hubData} isVTuber={isVTuber} />
            : (isOwner && activeTab === "delete")
            ? <DeleteFanhubContent fanHubId={fanHubId} hubName={hubData.hubName} />
            : <ModQueueContent fanHubId={fanHubId} isOwner={isOwner} />
          }
        </main>
      </div>
    </div>
  );
}
