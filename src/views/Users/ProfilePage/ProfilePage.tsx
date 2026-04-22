"use client";
import { useEffect, useState, useRef } from "react";
import "./ProfilePage.css";
import { useRouter } from "next/navigation";
import { getUserByUsername, selectDisplayBadges, updateUserProfile, uploadAvatarFrame, setUserOshi } from "@/services/UserController";
import { useAuth } from "@/functions/Auth/useAuth";
import { showSuccess, showError } from "@/utils/toastUtils";

export default function ProfilePage({ username }: { username: string }) {
  const router = useRouter();
  const auth = useAuth();
  const [userData, setUserData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBadges, setSelectedBadges] = useState<number[]>([]);
  const [userId, setUserId] = useState<number | null>(null);
  const [loggedInUserId, setLoggedInUserId] = useState<number | null>(null);
  const [isSettingOshi, setIsSettingOshi] = useState(false);

  // Inline editing state
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState("");
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [editBioValue, setEditBioValue] = useState("");
  
  // Avatar upload modal state
  const [isAvatarUploadModalOpen, setIsAvatarUploadModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Cleanup preview URL object URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

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
            console.log(data);
          setUserId(data.userId);
          setUserData({
            displayName: data.displayName || data.username,
            username: data.username,
            email: data.email || "",
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
                username: data.oshi?.username || "",
              name: data.oshi?.displayName || "N/A",
              avatar: data.oshi?.avatarUrl || "",
            },
            memberSince: data.createdAt
              ? new Date(data.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
              : "Unknown",
            allBadges: data.allBadges || [],
            hubs: data.fanHubsJoined || [],
            role: data.role,
            translateLanguage: data.translateLanguage || "",
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
      showError("You can only select up to 3 badges");
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
      showSuccess("Display badges updated successfully!");
    } else {
      showError(result?.message || "Failed to update display badges");
    }
  };

  const handleToggleBadge = (badgeId: number) => {
    setSelectedBadges((prev: number[]) => {
      if (prev.includes(badgeId)) {
        return prev.filter((id) => id !== badgeId);
      } else {
        if (prev.length >= 3) {
          showError("You can only select up to 3 badges");
          return prev;
        }
        return [...prev, badgeId];
      }
    });
  };

  // Inline Edit Display Name handlers
  const handleStartEditName = () => {
    setEditNameValue(userData.displayName);
    setIsEditingName(true);
  };

  const handleCancelEditName = () => {
    setIsEditingName(false);
    setEditNameValue("");
  };

  const handleSaveName = async () => {
    if (!editNameValue || editNameValue.trim() === "") {
      showError("Display name cannot be empty");
      return;
    }

    const result = await updateUserProfile({
      email: userData.email || "",
      displayName: editNameValue.trim(),
      translateLanguage: userData.translateLanguage || "",
      bio: userData.bio || "",
    });

    if (result?.success) {
      setUserData({
        ...userData,
        displayName: editNameValue.trim(),
      });
      await auth.refreshUser();
      setIsEditingName(false);
      setEditNameValue("");
      showSuccess("Display name updated successfully!");
    } else {
      showError(result?.message || "Failed to update display name");
    }
  };

  // Inline Edit Bio handlers
  const handleStartEditBio = () => {
    setEditBioValue(userData.bio === "No bio yet..." ? "" : userData.bio);
    setIsEditingBio(true);
  };

  const handleCancelEditBio = () => {
    setIsEditingBio(false);
    setEditBioValue("");
  };

  const handleSaveBio = async () => {
    const result = await updateUserProfile({
      email: userData.email || "",
      displayName: userData.displayName || "",
      translateLanguage: userData.translateLanguage || "",
      bio: editBioValue.trim(),
    });

    if (result?.success) {
      setUserData({
        ...userData,
        bio: editBioValue.trim() || "No bio yet...",
      });
      await auth.refreshUser();
      setIsEditingBio(false);
      setEditBioValue("");
      showSuccess("Bio updated successfully!");
    } else {
      showError(result?.message || "Failed to update bio");
    }
  };

  const handleSetOshi = async () => {
    if (!userData?.username) return;
    
    setIsSettingOshi(true);
    try {
      const result = await setUserOshi(userData.username);
      if (result?.success) {
        showSuccess(`Set ${userData.displayName} as your Oshi!`);
        // We might want to refresh the logged in user's data here if they are viewing their own profile elsewhere
        // but since they are viewing someone else's profile, we just show success.
      } else {
        showError(result?.message || "Failed to set Oshi");
      }
    } catch (error) {
      console.error("Set Oshi error:", error);
      showError("Failed to set Oshi");
    } finally {
      setIsSettingOshi(false);
    }
  };

  // Avatar upload handlers
  const handleOpenAvatarUploadModal = () => {
    setIsAvatarUploadModalOpen(true);
    setSelectedFile(null);
    setPreviewUrl("");
  };

  const handleCloseAvatarUploadModal = () => {
    setIsAvatarUploadModalOpen(false);
    setSelectedFile(null);
    setPreviewUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      showError("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showError("File size must be less than 5MB");
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setIsPreviewModalOpen(true);
    setIsAvatarUploadModalOpen(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDropZoneClick = () => {
    fileInputRef.current?.click();
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const handlePreviewCancel = () => {
    setIsPreviewModalOpen(false);
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl("");
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setIsAvatarUploadModalOpen(true);
  };

  const handlePreviewAccept = async () => {
    if (!selectedFile) {
      showError("No file selected");
      return;
    }

    setIsUploading(true);
    try {
      const result = await uploadAvatarFrame(selectedFile);

      if (result?.success) {
        // Refresh user data
        const data = await getUserByUsername(username);
        if (data) {
          setUserData({
            ...userData,
            avatar: data.avatarUrl || "/profile-pic-undefined.jpg",
            hasFrame: data.frameUrl !== null,
          });
        }

        setIsPreviewModalOpen(false);
        setSelectedFile(null);
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
          setPreviewUrl("");
        }
        await auth.refreshUser();
        showSuccess("Avatar updated successfully!");
      } else {
        showError(result?.message || "Failed to upload avatar");
      }
    } catch (error) {
      console.error("Avatar upload error:", error);
      showError("Failed to upload avatar");
    } finally {
      setIsUploading(false);
    }
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
        <div className="empty-message">User not found...</div>
      </div>
    );
  }

  // Check if logged in user is the profile owner
  const isCurrentUser = loggedInUserId !== null && userId !== null && loggedInUserId === userId;

  return (
    <div className="user-profile">
      <div className="main-info">
        <div 
          className={`user-avatar ${userData.hasFrame ? 'has-frame' : ''}`}
          onClick={isCurrentUser ? handleOpenAvatarUploadModal : undefined}
          onMouseEnter={(e) => {
            if (isCurrentUser) {
              e.currentTarget.classList.add('avatar-hoverable');
            }
          }}
          onMouseLeave={(e) => {
            if (isCurrentUser) {
              e.currentTarget.classList.remove('avatar-hoverable');
            }
          }}
        >
          <img src={userData.avatar} alt="User Avatar" className="avatar-image" />
          {isCurrentUser && (
            <div className="avatar-edit-overlay">
              <span>Edit</span>
            </div>
          )}
        </div>
        <div className="user-details">
          <div className="display-name-wrapper">
            {isEditingName ? (
              <div className="inline-edit-container">
                <input
                  type="text"
                  className="inline-edit-input"
                  value={editNameValue}
                  onChange={(e) => setEditNameValue(e.target.value)}
                  placeholder="Enter display name"
                  maxLength={50}
                  autoFocus
                />
                <div className="inline-edit-actions">
                  <button className="inline-edit-btn save" onClick={handleSaveName} disabled={!editNameValue.trim()}>
                    Save
                  </button>
                  <button className="inline-edit-btn cancel" onClick={handleCancelEditName}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h1 className="display-name">{userData.displayName}</h1>
                {isCurrentUser ? (
                  <button className="edit-icon-btn" onClick={handleStartEditName} title="Edit display name">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                ) : (
                  userData.role === "VTUBER" && (
                    <button 
                      className="set-oshi-btn" 
                      onClick={handleSetOshi} 
                      disabled={isSettingOshi}
                      title="Set as Oshi"
                    >
                      {isSettingOshi ? "..." : "❤ Set as Oshi"}
                    </button>
                  )
                )}
              </>
            )}
          </div>
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
            <div 
              className="oshi-info" 
              onClick={() => router.push(`/user/${userData.oshi.username}`)}
            >
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
          <div className="bio-title">
            Bio
            {!isEditingBio && isCurrentUser && (
              <button className="edit-icon-btn" onClick={handleStartEditBio} title="Edit bio">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
            )}
          </div>
          {isEditingBio ? (
            <div className="inline-bio-edit">
              <textarea
                className="inline-edit-textarea"
                value={editBioValue}
                onChange={(e) => setEditBioValue(e.target.value)}
                placeholder="Write something about yourself..."
                maxLength={500}
                rows={4}
                autoFocus
              />
              <div className="inline-bio-actions">
                <span className="char-count">{editBioValue.length}/500</span>
                <div className="inline-edit-actions">
                  <button className="inline-edit-btn save" onClick={handleSaveBio}>
                    Save
                  </button>
                  <button className="inline-edit-btn cancel" onClick={handleCancelEditBio}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bio-content">{userData.bio}</div>
          )}
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
        <div className="profile-modal-overlay" onClick={handleCloseModal}>
          <div className="profile-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="profile-modal-header">
              <h2>Select Display Badges</h2>
              <button className="profile-modal-close" onClick={handleCloseModal}>×</button>
            </div>
            <div className="profile-modal-body">
              <p className="profile-modal-hint">Select up to 3 badges to display on your profile</p>
              <p className="profile-modal-hint">Selected: {selectedBadges.length}/3</p>
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
            <div className="profile-modal-footer">
              <button className="profile-btn-cancel" onClick={handleCloseModal}>Cancel</button>
              <button className="profile-btn-save" onClick={handleSaveBadges}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Avatar Upload Modal */}
      {isAvatarUploadModalOpen && (
        <div className="profile-modal-overlay" onClick={handleCloseAvatarUploadModal}>
          <div className="profile-modal-content avatar-upload-modal" onClick={(e) => e.stopPropagation()}>
            <div className="profile-modal-header">
              <h2>Change Profile Picture</h2>
              <button className="profile-modal-close" onClick={handleCloseAvatarUploadModal}>×</button>
            </div>
            <div className="profile-modal-body">
              <div
                className={`avatar-dropzone ${isDragging ? 'dragging' : ''}`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={handleDropZoneClick}
                ref={dropZoneRef}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileInputChange}
                  className="avatar-file-input"
                />
                <div className="dropzone-content">
                  <div className="dropzone-icon">📷</div>
                  <p className="dropzone-text">Drag & drop an image here, or click to select</p>
                  <p className="dropzone-hint">PNG, JPG, GIF up to 5MB</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Avatar Preview Modal */}
      {isPreviewModalOpen && previewUrl && (
        <div className="profile-modal-overlay" onClick={handlePreviewCancel}>
          <div className="profile-modal-content avatar-preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="profile-modal-header">
              <h2>Preview Avatar</h2>
              <button className="profile-modal-close" onClick={handlePreviewCancel}>×</button>
            </div>
            <div className="profile-modal-body avatar-preview-body">
              <div className="avatar-preview-container">
                <div className="avatar-preview-circle">
                  <img src={previewUrl} alt="Avatar Preview" className="avatar-preview-image" />
                </div>
                <p className="avatar-preview-label">This is how your avatar will look</p>
              </div>
            </div>
            <div className="profile-modal-footer">
              <button className="profile-btn-cancel" onClick={handlePreviewCancel} disabled={isUploading}>
                Cancel
              </button>
              <button className="profile-btn-save" onClick={handlePreviewAccept} disabled={isUploading}>
                {isUploading ? "Uploading..." : "Accept"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
