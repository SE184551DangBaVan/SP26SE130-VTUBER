"use client";

import { useState, useEffect } from "react";
import { uploadImages, updateFanHub } from "@/services/FanHubController";
import { showError, showLoading, updateToast } from '@/utils/toastUtils';
import ExploreBanner from '@/components/ExploreBanner/ExploreBanner';
import "./HubCustomizationContent.css";

export default function HubCustomizationContent({ fanHubId, hubData }) {
  // Appearance state
  const [themeColor, setThemeColor] = useState(hubData?.themeColor || "#555");
  const [bannerFile, setBannerFile] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(hubData?.bannerUrl || null);
  const [avatarPreview, setAvatarPreview] = useState(hubData?.avatarUrl || null);

  // Explore images state (max 4)
  const [exploreFiles, setExploreFiles] = useState([null, null, null, null]);
  const [explorePreviews, setExplorePreviews] = useState([null, null, null, null]);
  
  // Track existing image URLs to send back if not changed
  const [existingExploreUrls, setExistingExploreUrls] = useState([null, null, null, null]);

  useEffect(() => {
    if (hubData) {
      setThemeColor(hubData.themeColor || "#555");
      setBannerPreview(hubData.bannerUrl || null);
      setAvatarPreview(hubData.avatarUrl || null);
      
      if (hubData.highlightImgUrls) {
        const initialPreviews = [null, null, null, null];
        const initialExisting = [null, null, null, null];
        hubData.highlightImgUrls.forEach((url, i) => {
          if (i < 4) {
            initialPreviews[i] = url;
            initialExisting[i] = url;
          }
        });
        setExplorePreviews(initialPreviews);
        setExistingExploreUrls(initialExisting);
      }
    }
  }, [hubData]);

  const [isSaving, setIsSaving] = useState(false);

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleBannerChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setBannerFile(file);
      const base64 = await fileToBase64(file);
      setBannerPreview(base64);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      const base64 = await fileToBase64(file);
      setAvatarPreview(base64);
    }
  };

  const handleExploreImageChange = async (e, index) => {
    const file = e.target.files[0];
    if (file) {
      const newFiles = [...exploreFiles];
      newFiles[index] = file;
      setExploreFiles(newFiles);

      const base64 = await fileToBase64(file);
      const newPreviews = [...explorePreviews];
      newPreviews[index] = base64;
      setExplorePreviews(newPreviews);
      
      // Clear existing URL for this slot since we have a new file
      const newExisting = [...existingExploreUrls];
      newExisting[index] = null;
      setExistingExploreUrls(newExisting);
    }
  };

  const removeExploreImage = (index) => {
    const newFiles = [...exploreFiles];
    newFiles[index] = null;
    setExploreFiles(newFiles);

    const newPreviews = [...explorePreviews];
    newPreviews[index] = null;
    setExplorePreviews(newPreviews);
    
    const newExisting = [...existingExploreUrls];
    newExisting[index] = null;
    setExistingExploreUrls(newExisting);
  };

  const handleSave = async () => {
    setIsSaving(true);
    const toastId = showLoading("Saving customization...");

    try {
      // 1. Update theme color if changed
      if (themeColor !== hubData?.themeColor) {
        await updateFanHub(fanHubId, {
          hubName: hubData.hubName,
          subdomain: hubData.subdomain,
          themeColor: themeColor,
          category: hubData.categories,
          description: hubData.description,
          isPrivate: hubData.isPrivate,
          requiresApproval: hubData.requiresApproval
        });
      }

      // 2. Upload images
      const backgroundFiles = exploreFiles.filter(f => f !== null);
      
      const result = await uploadImages(fanHubId, bannerFile, avatarFile, backgroundFiles);

      if (result?.success) {
        updateToast(toastId, "success", "Hub customization updated successfully!");
        setTimeout(() => window.location.reload(), 1500);
      } else {
        updateToast(toastId, "error", result?.message || "Failed to upload images.");
      }
    } catch (error) {
      console.error("Error saving customization:", error);
      updateToast(toastId, "error", "An error occurred while saving changes.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="hub-customization-content">
      <div className="customization-section">
        <h2>Avatar & Theme</h2>
        <p className="section-description">Customize how your hub looks to everyone.</p>
        
        <div className="customization-grid">
          <div className="form-group theme-color-group">
            <label>Theme Color</label>
            <div className="color-picker-container large">
              <input 
                type="color" 
                value={themeColor} 
                onChange={(e) => setThemeColor(e.target.value)}
              />
              <span className="color-hex-large">{themeColor.toUpperCase()}</span>
            </div>
          </div>

          <div className="image-upload-row">
            <div className="image-upload-box">
              <label>Avatar</label>
              <div className="avatar-preview-container" style={{ borderColor: themeColor }}>
                <img 
                  src={avatarPreview || "/profile-pic-undefined.jpg"} 
                  alt="Avatar" 
                  onError={(e) => e.target.src = "/profile-pic-undefined.jpg"}
                />
                <label className="upload-overlay">
                  <input type="file" accept="image/*" onChange={handleAvatarChange} hidden />
                  <span>Change</span>
                </label>
              </div>
            </div>

            <div className="image-upload-box banner-box">
              <label>Banner</label>
              <div className="banner-preview-container">
                <img 
                  src={bannerPreview || "/video-placeholder.png"} 
                  alt="Banner" 
                  onError={(e) => e.target.src = "/video-placeholder.png"}
                />
                <label className="upload-overlay">
                  <input type="file" accept="image/*" onChange={handleBannerChange} hidden />
                  <span>Upload New Banner</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="customization-section">
        <h2>Explore Presentation</h2>
        <p className="section-description">Manage your highlight images and see how they appear on the Explore page.</p>
        
        <div className="explore-management-layout">
          <div className="explore-images-grid">
            {explorePreviews.map((preview, index) => (
              <div key={index} className="explore-slot">
                {preview ? (
                  <div className="slot-filled">
                    <img src={preview} alt={`Highlight ${index + 1}`} />
                    <button className="remove-slot-btn" onClick={() => removeExploreImage(index)}>×</button>
                  </div>
                ) : (
                  <label className="slot-empty">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => handleExploreImageChange(e, index)} 
                      hidden 
                    />
                    <div className="add-icon">+</div>
                    <span>Add Image</span>
                  </label>
                )}
              </div>
            ))}
          </div>
          
          <div className="explore-preview-wrapper">
            <label className="preview-label">Live Explore Banner Preview</label>
            <div className="explore-banner-preview">
              <ExploreBanner 
                bannerUrl={bannerPreview}
                themeColor={themeColor}
                avatarUrl={avatarPreview}
                ownerDisplayName={hubData?.ownerDisplayName || hubData?.ownerUsername}
                hubName={hubData?.hubName}
                memberCount={hubData?.memberCount || 0}
                highlightImgUrls={explorePreviews.filter(p => p !== null)}
                onVisit={() => {}}
              />
            </div>
            <p className="note">Note: Currently, uploading new highlight images will replace all existing ones.</p>
          </div>
        </div>
      </div>

      <div className="settings-actions">
        <button 
          className="save-btn" 
          onClick={handleSave} 
          disabled={isSaving}
        >
          {isSaving ? "Saving..." : "Save Customization"}
        </button>
      </div>
    </div>
  );
}
