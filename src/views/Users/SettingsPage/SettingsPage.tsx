"use client";

import { useEffect, useState, useRef } from "react";
import "./SettingsPage.css";
import { getCurrentUserProfile, updateUserProfile, uploadAvatarFrame, changePassword } from "@/services/UserController";
import { useAuth } from "@/functions/Auth/useAuth";
import { useRouter } from "next/navigation";
import { useSideBar } from "@/contexts/SideBarContext";
import { languageOptions } from "@/constants/languageOptions";
import { showSuccess, showError, showWarning } from "@/utils/toastUtils";
import { Visibility, VisibilityOff } from "@mui/icons-material";

type SettingsSection = "profile" | "account" | "logout";

export default function SettingsPage() {
  const auth = useAuth();
  const router = useRouter();
  const { sideBarRetractor } = useSideBar();
  const [activeSection, setActiveSection] = useState<SettingsSection>("profile");
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userData, setUserData] = useState<any | null>(null);

  // Account state
  const [email, setEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");
  
  // Password state
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Profile state
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");

  // Avatar state
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string>("");
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isAvatarPreviewOpen, setIsAvatarPreviewOpen] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI Translate state
  const [translateLanguage, setTranslateLanguage] = useState("");

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const data = await getCurrentUserProfile();
        if (data) {
          setUserData(data);
          setEmail(data.email || "");
          setNewEmail(data.email || "");
          setDisplayName(data.displayName || data.username || "");
          setBio(data.bio || "");
          setTranslateLanguage(data.translateLanguage || "English");
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // Cleanup avatar preview URL
  useEffect(() => {
    return () => {
      if (avatarPreviewUrl) {
        URL.revokeObjectURL(avatarPreviewUrl);
      }
    };
  }, [avatarPreviewUrl]);

  // Handle avatar file selection
  const handleAvatarFileSelect = (file: File) => {
    if (!file.type.startsWith("image/")) {
      showError("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showError("File size must be less than 5MB");
      return;
    }

    setSelectedAvatarFile(file);
    const url = URL.createObjectURL(file);
    setAvatarPreviewUrl(url);
    setIsAvatarPreviewOpen(true);
    setIsAvatarModalOpen(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleAvatarFileSelect(file);
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
      handleAvatarFileSelect(files[0]);
    }
  };

  const handleOpenAvatarModal = () => {
    setIsAvatarModalOpen(true);
  };

  const handleCloseAvatarModal = () => {
    setIsAvatarModalOpen(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveAvatarPreview = () => {
    setSelectedAvatarFile(null);
    if (avatarPreviewUrl) {
      URL.revokeObjectURL(avatarPreviewUrl);
      setAvatarPreviewUrl("");
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleAcceptAvatar = async () => {
    if (!selectedAvatarFile) {
      showError("No file selected");
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const result = await uploadAvatarFrame(selectedAvatarFile);

      if (result?.success) {
        // Refresh user data to get updated avatar
        const data = await getCurrentUserProfile();
        if (data) {
          setUserData(data);
        }

        // Update global auth states
        await auth.refreshUser();

        showSuccess("Avatar updated successfully!");
        setIsAvatarPreviewOpen(false);
        setSelectedAvatarFile(null);
        if (avatarPreviewUrl) {
          URL.revokeObjectURL(avatarPreviewUrl);
          setAvatarPreviewUrl("");
        }
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } else {
        showError(result?.message || "Failed to upload avatar");
      }
    } catch (error) {
      console.error("Avatar upload error:", error);
      showError("Failed to upload avatar");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleCancelAvatarPreview = () => {
    setIsAvatarPreviewOpen(false);
    setSelectedAvatarFile(null);
    if (avatarPreviewUrl) {
      URL.revokeObjectURL(avatarPreviewUrl);
      setAvatarPreviewUrl("");
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setIsAvatarModalOpen(true);
  };

  const hasUnsavedChanges = () => {
    if (!userData) return false;
    return (
      displayName !== (userData.displayName || userData.username || "") ||
      bio !== (userData.bio || "") ||
      translateLanguage !== (userData.translateLanguage || "English") ||
      newEmail !== (userData.email || "")
    );
  };

  const handleResetChanges = () => {
    setDisplayName(userData?.displayName || userData?.username || "");
    setBio(userData?.bio || "");
    setTranslateLanguage(userData?.translateLanguage || "English");
    setNewEmail(userData?.email || "");
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setIsChangingPassword(false);
    handleRemoveAvatarPreview();
  };

  const handlePasswordChange = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      showWarning("Please fill in all password fields");
      return;
    }

    if (newPassword.length < 6) {
      showWarning("New password must be at least 6 characters long");
      return;
    }

    if (newPassword !== confirmPassword) {
      showWarning("New passwords do not match");
      return;
    }

    if (newPassword === oldPassword) {
      showWarning("New password cannot be the same as the old password");
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const result = await changePassword({
        oldPassword,
        newPassword,
        confirmPassword
      });

      if (result?.success) {
        showSuccess("Password changed successfully!");
        setIsChangingPassword(false);
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        // Show the specific error from data if it exists, otherwise fallback to message
        showError(result?.data || result?.message || "Failed to change password");
      }
    } catch (error) {
      console.error("Password change error:", error);
      showError("Failed to change password");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleLogout = () => {
    setIsLoggingOut(true);
    auth.logout();
  };

  // Handle save all changes
  const handleSaveAll = async () => {
    setSaving(true);
    try {
      let profileUpdateSuccess = false;

      // Update profile if changes were made
      if (
        displayName !== userData?.displayName ||
        bio !== userData?.bio ||
        translateLanguage !== userData?.translateLanguage ||
        newEmail !== userData?.email
      ) {
        const result = await updateUserProfile({
          email: newEmail,
          displayName: displayName.trim(),
          translateLanguage: translateLanguage,
          bio: bio.trim(),
        });

        if (result?.success) {
          profileUpdateSuccess = true;
          setUserData({
            ...userData,
            email: newEmail,
            displayName: displayName.trim(),
            bio: bio.trim(),
            translateLanguage: translateLanguage,
          });
        } else {
          showError("Failed to update profile: " + (result?.message || "Unknown error"));
          setSaving(false);
          return;
        }
      }

      if (profileUpdateSuccess) {
        await auth.refreshUser();
        showSuccess("Settings saved successfully!");
      }
    } catch (error) {
      console.error("Save error:", error);
      showError("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="settings-page sidebar-expanded">
        <div className="settings-loading">
          <div className="loading-spinner"></div>
          <p>Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`settings-page ${!sideBarRetractor ? 'sidebar-retracted' : 'sidebar-expanded'}`}>
      {/* Left Sidebar Navigation */}
      <div className="settings-sidebar">
        <h2 className="settings-sidebar-title">User Settings</h2>
        <nav className="settings-nav">
          <button
            className={`settings-nav-item ${activeSection === "profile" ? "active" : ""}`}
            onClick={() => setActiveSection("profile")}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            <span>Profile</span>
          </button>
          <button
            className={`settings-nav-item ${activeSection === "account" ? "active" : ""}`}
            onClick={() => setActiveSection("account")}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            <span>Account</span>
          </button>
          <button
            className={`settings-nav-item ${activeSection === "logout" ? "active logout" : ""}`}
            onClick={() => setActiveSection("logout")}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            <span>Logout</span>
          </button>
        </nav>
      </div>

      {/* Right Content Area */}
      <div className="settings-content">
        {/* Account Section (Merged with AI Translate) */}
        {activeSection === "account" && (
          <div className="settings-section">
            <div className="section-header">
              <h3>Account Settings</h3>
              <p className="section-description">Manage your email, password, and AI translation preferences.</p>
            </div>
            <div className="section-body">
              <div className="settings-field">
                <label className="field-label">Current Email</label>
                <div className="field-value">{email}</div>
              </div>
              <div className="settings-field">
                <label className="field-label" htmlFor="new-email">New Email</label>
                <input
                  id="new-email"
                  type="email"
                  className="field-input"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="Enter new email"
                />
              </div>

              <div className="settings-divider"></div>

              <div className="settings-field">
                <label className="field-label">Password</label>
                {!isChangingPassword ? (
                  <div className="password-display-row">
                    <span className="masked-password">••••••••</span>
                    <button 
                      className="change-password-trigger-btn"
                      onClick={() => setIsChangingPassword(true)}
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <div className="password-change-fields">
                    <div className="password-field-group">
                      <label htmlFor="old-password">Old Password</label>
                      <div className="password-input-wrapper">
                        <input
                          id="old-password"
                          type={showOldPassword ? "text" : "password"}
                          className="field-input"
                          value={oldPassword}
                          onChange={(e) => setOldPassword(e.target.value)}
                          placeholder="Enter old password"
                        />
                        <button
                          type="button"
                          className="toggle-password-btn"
                          onClick={() => setShowOldPassword(!showOldPassword)}
                        >
                          {showOldPassword ? <VisibilityOff /> : <Visibility />}
                        </button>
                      </div>
                    </div>

                    <div className="password-field-group">
                      <label htmlFor="new-password">New Password</label>
                      <div className="password-input-wrapper">
                        <input
                          id="new-password"
                          type={showNewPassword ? "text" : "password"}
                          className="field-input"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Enter new password"
                        />
                        <button
                          type="button"
                          className="toggle-password-btn"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                        >
                          {showNewPassword ? <VisibilityOff /> : <Visibility />}
                        </button>
                      </div>
                    </div>

                    <div className="password-field-group">
                      <label htmlFor="confirm-password">Confirm New Password</label>
                      <div className="password-input-wrapper">
                        <input
                          id="confirm-password"
                          type={showConfirmPassword ? "text" : "password"}
                          className="field-input"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirm new password"
                        />
                        <button
                          type="button"
                          className="toggle-password-btn"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                        </button>
                      </div>
                    </div>

                    <div className="password-actions">
                      <button 
                        className="settings-btn cancel-small"
                        onClick={() => {
                          setIsChangingPassword(false);
                          setOldPassword("");
                          setNewPassword("");
                          setConfirmPassword("");
                        }}
                        disabled={isUpdatingPassword}
                      >
                        Cancel
                      </button>
                      <button 
                        className="settings-btn save-small"
                        onClick={handlePasswordChange}
                        disabled={isUpdatingPassword}
                      >
                        {isUpdatingPassword ? "Updating..." : "Update Password"}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="settings-divider"></div>
              <div className="settings-field">
                <label className="field-label" htmlFor="translate-language">AI Translation Language</label>
                <select
                  id="translate-language"
                  className="field-select"
                  value={translateLanguage}
                  onChange={(e) => setTranslateLanguage(e.target.value)}
                >
                  {languageOptions.map((lang) => (
                    <option key={lang.value} value={lang.value}>
                      {lang.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Logout Section */}
        {activeSection === "logout" && (
          <div className="settings-section logout-section">
            <p className="logout-question">Are you sure you want to logout from your account?</p>
            <button
              className="logout-confirm-btn"
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              <span>{isLoggingOut ? "Logging out..." : "Logout"}</span>
            </button>
          </div>
        )}

        {/* Profile Section (Merged with Avatar) */}
        {activeSection === "profile" && (
          <div className="settings-section">
            <div className="section-header">
              <h3>Profile Settings</h3>
            </div>
            <div className="section-body">
              {/* Avatar Section */}
              <div className="settings-field">
                <label className="field-label">Profile Picture</label>
                <div className="avatar-display-wrapper">
                  <div
                    className="settings-avatar"
                    onMouseEnter={(e) => e.currentTarget.classList.add('avatar-hoverable')}
                    onMouseLeave={(e) => e.currentTarget.classList.remove('avatar-hoverable')}
                    onClick={handleOpenAvatarModal}
                  >
                    <img
                      src={avatarPreviewUrl || userData?.avatarUrl || "/profile-pic-undefined.jpg"}
                      alt="Profile Avatar"
                      className="settings-avatar-image"
                    />
                    <div className="settings-avatar-overlay">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                      <span>Edit</span>
                    </div>
                  </div>
                  {avatarPreviewUrl && (
                    <button
                      className="remove-avatar-small"
                      onClick={handleRemoveAvatarPreview}
                    >
                      Remove
                    </button>
                  )}
                </div>
                <span className="field-hint">Click to change</span>
              </div>
              <div className="settings-divider"></div>
              {/* Display Name */}
              <div className="settings-field">
                <label className="field-label" htmlFor="display-name">Display Name</label>
                <input
                  id="display-name"
                  type="text"
                  className="field-input"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter display name"
                  maxLength={50}
                />
                <span className="field-hint">Maximum 50 characters</span>
              </div>
              {/* Bio */}
              <div className="settings-field">
                <label className="field-label" htmlFor="bio">Bio</label>
                <textarea
                  id="bio"
                  className="field-textarea"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Write something about yourself..."
                  maxLength={500}
                  rows={6}
                />
                <span className="field-hint">{bio.length}/500 characters</span>
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        {hasUnsavedChanges() && (
          <div className="settings-footer">
            <button
              className="settings-btn cancel"
              onClick={handleResetChanges}
            >
              Cancel
            </button>
            <button
              className="settings-btn save"
              onClick={handleSaveAll}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}
      </div>

      {/* Avatar Upload Modal */}
      {isAvatarModalOpen && (
        <div className="settings-modal-overlay" onClick={handleCloseAvatarModal}>
          <div className="settings-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="settings-modal-header">
              <h2>Change Profile Picture</h2>
              <button className="settings-modal-close" onClick={handleCloseAvatarModal}>×</button>
            </div>
            <div className="settings-modal-body">
              <div
                className={`settings-avatar-dropzone ${isDragging ? 'dragging' : ''}`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={handleDropZoneClick}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileInputChange}
                  className="settings-avatar-file-input"
                />
                <div className="settings-dropzone-content">
                  <div className="settings-dropzone-icon">📷</div>
                  <p className="settings-dropzone-text">Drag & drop an image here, or click to select</p>
                  <p className="settings-dropzone-hint">PNG, JPG, GIF up to 5MB</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Avatar Preview Modal */}
      {isAvatarPreviewOpen && avatarPreviewUrl && (
        <div className="settings-modal-overlay" onClick={handleCancelAvatarPreview}>
          <div className="settings-modal-content avatar-preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="settings-modal-header">
              <h2>Preview Avatar</h2>
              <button className="settings-modal-close" onClick={handleCancelAvatarPreview}>×</button>
            </div>
            <div className="settings-modal-body avatar-preview-body">
              <div className="avatar-preview-container">
                <div className="avatar-preview-circle">
                  <img src={avatarPreviewUrl} alt="Avatar Preview" className="avatar-preview-image" />
                </div>
                <p className="avatar-preview-label">This is how your avatar will look</p>
              </div>
            </div>
            <div className="settings-modal-footer avatar-preview-footer">
              <button
                className="settings-btn cancel"
                onClick={handleCancelAvatarPreview}
                disabled={isUploadingAvatar}
              >
                Cancel
              </button>
              <button
                className="settings-btn save"
                onClick={handleAcceptAvatar}
                disabled={isUploadingAvatar}
              >
                {isUploadingAvatar ? "Uploading..." : "Accept"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
