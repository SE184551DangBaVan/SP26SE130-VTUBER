"use client";
import { useEffect, useState } from "react";
import "./ProfilePage.css";
import { getUserByUsername, selectDisplayBadges } from "@/services/UserController";
import { useAuth } from "@/functions/Auth/useAuth";
import ChatBot from "@/components/ChatBot/ChatBot";

export default function ProfilePage({ username }: { username: string }) {
  const auth = useAuth();
  const [userData, setUserData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBadges, setSelectedBadges] = useState<number[]>([]);
  const [userId, setUserId] = useState<number | null>(null);
  const [loggedInUserId, setLoggedInUserId] = useState<number | null>(null);

    const [chatOpened, setChatOpened] = useState(false);
    const RandomButtonClicked = () =>{
        setChatOpened(prev => !prev);
    }

  useEffect(() => {
    // Get logged in user ID from session/local storage
    const storedUserId = sessionStorage.getItem("userID") || localStorage.getItem("userID");
    if (storedUserId) {
      setLoggedInUserId(parseInt(storedUserId, 10));
    }
  }, []);

  useEffect(() => {
    async function fetchUserProfile() {
      try {
        const data = await getUserByUsername(username);
        if (data) {
          setUserId(data.userId);
          setUserData({
            displayName: data.displayName || data.username,
            username: data.username,
            avatar: data.avatarUrl || "/profile-pic-undefined.jpg",
            hasFrame: data.frameUrl !== null,
            displayBadges: data.displayBadges || [],
            bio: data.bio || "No bio yet...",
            milestones: {
              badgesReceived: data.totalBadges || 0,
              rosesReceived: data.totalReceivedGifts || 0,
              hubsJoined: data.totalFanHubs || 0,
            },
            oshi: {
              name: data.oshiName || "N/A",
              avatar: data.oshiAvatar || "",
            },
            memberSince: data.createdAt
              ? new Date(data.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
              : "Unknown",
            allBadges: data.allBadges || [],
            hubs: data.fanHubsJoined || [],
          });
          // Initialize selected badges from displayBadges
          if (data.displayBadges && data.displayBadges.length > 0) {
            setSelectedBadges(data.displayBadges.map((b: any) => b.userBadgeId || b.id));
          }
        }
      } catch (err) {
        console.error("Failed to fetch user profile:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchUserProfile();
  }, [username]);

  const handleOpenModal = () => {
    if (userData?.allBadges && userData.allBadges.length > 0) {
      // Initialize with currently selected badges (filter displayBadges for userBadgeId)
      const currentSelected = userData.displayBadges 
        ? userData.displayBadges.map((b: any) => b.userBadgeId)
        : [];
      setSelectedBadges(currentSelected);
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedBadges([]);
  };

  const handleSaveBadges = async () => {
    if (selectedBadges.length > 3) {
      alert("You can only select up to 3 badges");
      return;
    }

    const result = await selectDisplayBadges(selectedBadges);
    if (result?.success) {
      // Refresh user data to get updated display badges
      const data = await getUserByUsername(username);
      if (data) {
        setUserData({
          ...userData,
          displayBadges: data.displayBadges || [],
        });
      }
      setIsModalOpen(false);
      setSelectedBadges([]);
    } else {
      alert(result?.message || "Failed to update display badges");
    }
  };

  const handleToggleBadge = (badgeId: number) => {
    setSelectedBadges((prev: number[]) => {
      if (prev.includes(badgeId)) {
        return prev.filter((id) => id !== badgeId);
      } else {
        if (prev.length >= 3) {
          alert("You can only select up to 3 badges");
          return prev;
        }
        return [...prev, badgeId];
      }
    });
  };

  if (loading) {
    return (
      <div className="user-profile">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="user-profile">
          <button onClick={RandomButtonClicked}>Random button</button>
          <ChatBot isOpen={chatOpened} onClose={RandomButtonClicked}/>
        <div className="empty-message">User not found...</div>
      </div>
    );
  }

  // Check if logged in user is the profile owner
  const isCurrentUser = loggedInUserId !== null && userId !== null && loggedInUserId === userId;

  return (
    <div className="user-profile">
      <div className="main-info">
        <div className={`user-avatar ${userData.hasFrame ? 'has-frame' : ''}`}>
          <img src={userData.avatar} alt="User Avatar" className="avatar-image" />
        </div>
        <div className="user-details">
          <h1 className="display-name">{userData.displayName}</h1>
          <p className="user-handle">@{userData.username}</p>
          <div className="user-badges-small">
            {userData.displayBadges && userData.displayBadges.length > 0 ? (
              userData.displayBadges.slice(0, 3).map((badge: any, index: number) => (
                <span key={index} className="badge-icon" title={badge.badgeName || "Badge"}>
                  {badge.iconUrl ? (
                    <img src={badge.iconUrl} alt={badge.badgeName} />
                  ) : (
                    "🏅"
                  )}
                </span>
              ))
            ) : (
              <>
                <span className="badge-icon"></span>
                <span className="badge-icon"></span>
                <span className="badge-icon"></span>
              </>
            )}
          </div>
          {isCurrentUser && userData.allBadges && userData.allBadges.length > 0 && (
            <button className="edit-badges-btn" onClick={handleOpenModal}>
              Edit Display Badges
            </button>
          )}
        </div>
        {userData.oshi.name !== "N/A" && userData.oshi.avatar && (
          <div className="oshi-display">
            <p className="oshi-label">Most Favorite:</p>
            <div className="oshi-info">
              <img src={userData.oshi.avatar} alt={userData.oshi.name} className="oshi-avatar" />
              <p className="oshi-name">{userData.oshi.name}</p>
            </div>
          </div>
        )}
      </div>

      <div className="extra-info">
        <div className="user-milestones">
          <div className="milestone">
            <span className="milestone-count">{userData.milestones.badgesReceived}</span>
            <span className="milestone-label">Badges received</span>
          </div>
          <div className="milestone">
            <span className="milestone-count">{userData.milestones.rosesReceived}</span>
            <span className="milestone-label">Roses received</span>
          </div>
          <div className="milestone">
            <span className="milestone-count">{userData.milestones.hubsJoined}</span>
            <span className="milestone-label">Hubs joined</span>
          </div>
        </div>

        {/*USER BIO*/}
        <div className="user-bio">
          <div className="bio-title">Bio</div>
          <div className="bio-content">{userData.bio}</div>
        </div>

        {/*Badges*/}
        <div className="info-section">
          <div className="section-header">
            <div className="section-title">Badges</div>
            <a href="#" className="see-all">
              See All →
            </a>
          </div>
          <div className="section-content badges-grid">
            {userData.allBadges && userData.allBadges.length > 0 ? (
              userData.allBadges.map((badge: any, index: number) => (
                <div key={index} className="badge-item">
                  <div className="badge-icon-large">
                    {badge.iconUrl ? (
                      <img src={badge.iconUrl} alt={badge.badgeName} className="badge-image" />
                    ) : (
                      "🏅"
                    )}
                  </div>
                  <p className="badge-name">{badge.badgeName || "Badge"}</p>
                </div>
              ))
            ) : (
              <p className="empty-message">This user does not have any badges yet...</p>
            )}
          </div>
        </div>

        {/*Joined Hubs*/}
        <div className="info-section">
          <div className="section-header">
            <div className="section-title">Joined Hubs</div>
            <a href="#" className="see-all">
              See All →
            </a>
          </div>
          <div className="section-content hubs-grid">
            {userData.hubs && userData.hubs.length > 0 ? (
              userData.hubs.map((hub: any, index: number) => (
                <div key={index} className="hub-item">
                  <div className="hub-avatar">
                    {hub.avatarUrl ? (
                      <img src={hub.avatarUrl} alt={hub.hubName || "Hub"} className="hub-avatar-image" />
                    ) : (
                      <div className="hub-avatar-placeholder">🎮</div>
                    )}
                  </div>
                  <p className="hub-name">{hub.hubName || "Hub"}</p>
                </div>
              ))
            ) : (
              <p className="empty-message">This user does not have any hubs yet...</p>
            )}
          </div>
        </div>

        <div className="member-since">
          Member since {userData.memberSince}
        </div>
      </div>

      {/* Badge Selection Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Select Display Badges</h2>
              <button className="modal-close" onClick={handleCloseModal}>×</button>
            </div>
            <div className="modal-body">
              <p className="modal-hint">Select up to 3 badges to display on your profile</p>
              <p className="modal-hint">Selected: {selectedBadges.length}/3</p>
              <div className="badge-selection-grid">
                {userData.allBadges.map((badge: any, index: number) => {
                  const badgeId = badge.userBadgeId;
                  const isSelected = selectedBadges.includes(badgeId);
                  return (
                    <div
                      key={index}
                      className={`badge-selection-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleToggleBadge(badgeId)}
                    >
                      <div className="badge-icon-large">
                        {badge.iconUrl ? (
                          <img src={badge.iconUrl} alt={badge.badgeName} className="badge-image" />
                        ) : (
                          "🏅"
                        )}
                      </div>
                      <p className="badge-name">{badge.badgeName || "Badge"}</p>
                      {isSelected && <span className="checkmark">✓</span>}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={handleCloseModal}>Cancel</button>
              <button className="btn-save" onClick={handleSaveBadges}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
