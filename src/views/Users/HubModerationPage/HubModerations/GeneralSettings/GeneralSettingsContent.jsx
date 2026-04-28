"use client";

import { useState, useEffect } from "react";
import { updateFanHub } from "@/services/FanHubController";
import { showError, showLoading, updateToast } from '@/utils/toastUtils';
import { HUB_CATEGORIES } from '@/constants/hubCategories';
import "./GeneralSettingsContent.css";

export default function GeneralSettingsContent({ fanHubId, hubData }) {
  const [hubName, setHubName] = useState(hubData?.hubName || "");
  const [subdomain, setSubdomain] = useState(hubData?.subdomain || "");
  const [description, setDescription] = useState(hubData?.description || "");
  const [categories, setCategories] = useState(hubData?.categories || []);
  const [isPrivate, setIsPrivate] = useState(hubData?.isPrivate || false);
  const [requiresApproval, setRequiresApproval] = useState(hubData?.requiresApproval || false);
  const [isSaving, setIsSaving] = useState(false);

  // Update state if hubData changes
  useEffect(() => {
    if (hubData) {
      setHubName(hubData.hubName || "");
      setSubdomain(hubData.subdomain || "");
      setDescription(hubData.description || "");
      setCategories(hubData.categories || []);
      setIsPrivate(hubData.isPrivate || false);
      setRequiresApproval(hubData.requiresApproval || false);
    }
  }, [hubData]);

  const toggleCategory = (catName) => {
    setCategories((prev) =>
      prev.includes(catName)
        ? prev.filter((c) => c !== catName)
        : [...prev, catName]
    );
  };

  const handleSave = async () => {
    if (!hubName.trim() || !subdomain.trim()) {
      showError("Hub name and subdomain cannot be empty.");
      return;
    }

    setIsSaving(true);
    const toastId = showLoading("Saving changes...");

    try {
      const payload = {
        hubName: hubName,
        subdomain: subdomain,
        description: description,
        themeColor: hubData?.themeColor, // preserve existing
        category: categories,
        isPrivate: isPrivate,
        requiresApproval: requiresApproval,
      };

      const result = await updateFanHub(fanHubId, payload);

      if (result?.success) {
        updateToast(toastId, "success", "Hub settings updated successfully!");
      } else {
        updateToast(toastId, "error", result?.message || "Failed to update hub settings.");
      }
    } catch (error) {
      console.error("Error updating hub settings:", error);
      updateToast(toastId, "error", "An error occurred while saving changes.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="general-settings-content">
      <div className="settings-card">
        <h2>General</h2>
        <div className="form-group">
          <label>Hub Name</label>
          <input 
            type="text" 
            value={hubName} 
            onChange={(e) => setHubName(e.target.value)} 
            placeholder="Enter hub name"
          />
        </div>
        <div className="form-group">
          <label>Subdomain</label>
          <div className="input-prefix-wrapper">
            <span className="prefix">vhub.io/</span>
            <input 
              type="text" 
              value={subdomain} 
              onChange={(e) => setSubdomain(e.target.value.replace(/\s/g, ""))} 
              placeholder="subdomain"
            />
          </div>
        </div>
        <div className="form-group">
          <label>Description</label>
          <textarea 
            value={description} 
            onChange={(e) => setDescription(e.target.value)} 
            placeholder="Describe your community..."
            rows={4}
          />
        </div>
        
        <div className="form-group">
          <label>Categories</label>
          <div className="category-select">
            {HUB_CATEGORIES.map((cat) => (
              <button
                key={cat.name}
                type="button"
                className={`category-chip ${categories.includes(cat.name) ? 'active' : ''}`}
                onClick={() => toggleCategory(cat.name)}
              >
                {cat.name}
                {categories.includes(cat.name) && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="chip-check">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="settings-card">
        <h2>Privacy & Discovery</h2>
        
        <div className="toggle-group">
          <div className="toggle-info">
            <label>Private Hub</label>
            <p>Only members can see content in this hub.</p>
          </div>
          <label className="switch">
            <input 
              type="checkbox" 
              checked={isPrivate} 
              onChange={(e) => setIsPrivate(e.target.checked)} 
            />
            <span className="slider round"></span>
          </label>
        </div>

        <div className="toggle-group">
          <div className="toggle-info">
            <label>Requires Approval</label>
            <p>New members must be approved by moderators before they can join.</p>
          </div>
          <label className="switch">
            <input 
              type="checkbox" 
              checked={requiresApproval} 
              onChange={(e) => setRequiresApproval(e.target.checked)} 
            />
            <span className="slider round"></span>
          </label>
        </div>
      </div>

      <div className="settings-actions">
        <button 
          className="save-btn" 
          onClick={handleSave} 
          disabled={isSaving}
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
