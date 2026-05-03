"use client";

import { useState, useEffect } from "react";
import { updateFanHub } from "@/services/FanHubController";
import { 
  getJoinQuestions, 
  createJoinQuestion, 
  updateJoinQuestion, 
  deleteJoinQuestion 
} from "@/services/HubQuestionnaireController";
import { showError, showLoading, updateToast } from '@/utils/toastUtils';
import { HUB_CATEGORIES } from '@/constants/hubCategories';
import HubJoinQuestions from "./HubJoinQuestions";
import "./GeneralSettingsContent.css";

export default function GeneralSettingsContent({ fanHubId, hubData, isVTuber }) {
  const [hubName, setHubName] = useState(hubData?.hubName || "");
  const [subdomain, setSubdomain] = useState(hubData?.subdomain || "");
  const [description, setDescription] = useState(hubData?.description || "");
  const [categories, setCategories] = useState(hubData?.categories || []);
  const [isPrivate, setIsPrivate] = useState(hubData?.isPrivate || false);
  const [requiresApproval, setRequiresApproval] = useState(hubData?.requiresApproval || false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState("general");

  // --- Questions State (Lifted) ---
  const [questions, setQuestions] = useState([]);
  const [deletedQuestionIds, setDeletedQuestionIds] = useState([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);

  // --- Change Tracking State ---
  const [initialHubData, setInitialHubData] = useState(null);
  const [initialQuestions, setInitialQuestions] = useState([]);

  // Fetch questions on mount
  useEffect(() => {
    if (fanHubId && isVTuber) {
      const fetchQuestions = async () => {
        setQuestionsLoading(true);
        try {
          const data = await getJoinQuestions(fanHubId);
          const sorted = Array.isArray(data) ? [...data].sort((a, b) => a.orderNumber - b.orderNumber) : [];
          setQuestions(JSON.parse(JSON.stringify(sorted)));
          setInitialQuestions(JSON.parse(JSON.stringify(sorted)));
        } catch (error) {
          console.error("Error fetching questions:", error);
        } finally {
          setQuestionsLoading(false);
        }
      };
      fetchQuestions();
    }
  }, [fanHubId, isVTuber]);

  // Sync initial hub data
  useEffect(() => {
    if (hubData) {
      const data = {
        hubName: hubData.hubName || "",
        subdomain: hubData.subdomain || "",
        description: hubData.description || "",
        categories: hubData.categories || [],
        isPrivate: hubData.isPrivate || false,
        requiresApproval: hubData.requiresApproval || false
      };
      setInitialHubData(data);
      setHubName(data.hubName);
      setSubdomain(data.subdomain);
      setDescription(data.description);
      setCategories(data.categories);
      setIsPrivate(data.isPrivate);
      setRequiresApproval(data.requiresApproval);
    }
  }, [hubData]);

  // Computed Change Status
  const isGeneralChanged = initialHubData && (
    hubName !== initialHubData.hubName ||
    subdomain !== initialHubData.subdomain ||
    description !== initialHubData.description ||
    categories.length !== initialHubData.categories.length ||
    !categories.every(c => initialHubData.categories.includes(c))
  );

  const isPrivacyChanged = initialHubData && (
    isPrivate !== initialHubData.isPrivate ||
    requiresApproval !== initialHubData.requiresApproval
  );

  const isQuestionsChanged = (
    deletedQuestionIds.length > 0 ||
    questions.length !== initialQuestions.length ||
    questions.some((q, i) => {
      const initial = initialQuestions.find(iq => iq.id === q.id);
      return !initial || q.content !== initial.content || i !== initialQuestions.indexOf(initial);
    })
  );

  const hasChanges = isGeneralChanged || isPrivacyChanged || isQuestionsChanged;

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
    const toastId = showLoading("Saving all changes...");

    try {
      const hubPayload = {
        hubName: hubName,
        subdomain: subdomain,
        description: description,
        themeColor: hubData?.themeColor,
        category: categories,
        isPrivate: isPrivate,
        requiresApproval: requiresApproval,
      };

      const hubResult = await updateFanHub(fanHubId, hubPayload);
      if (!hubResult?.success) throw new Error(hubResult?.message || "Failed to update hub settings.");

      if (isVTuber) {
        for (const id of deletedQuestionIds) await deleteJoinQuestion(id);
        for (let i = 0; i < questions.length; i++) {
          const q = questions[i];
          const data = { content: q.content, orderNumber: i };
          if (typeof q.id === 'number') await updateJoinQuestion(q.id, data);
          else await createJoinQuestion(fanHubId, data);
        }
        
        const fresh = await getJoinQuestions(fanHubId);
        const sorted = Array.isArray(fresh) ? [...fresh].sort((a, b) => a.orderNumber - b.orderNumber) : [];
        setQuestions(JSON.parse(JSON.stringify(sorted)));
        setInitialQuestions(JSON.parse(JSON.stringify(sorted)));
        setDeletedQuestionIds([]);
      }

      setInitialHubData({
        hubName, subdomain, description, categories, isPrivate, requiresApproval
      });
      
      updateToast(toastId, "success", "All changes saved successfully!");
    } catch (error) {
      console.error("Error saving changes:", error);
      updateToast(toastId, "error", error.message || "An error occurred while saving.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="general-settings-content">
      {isVTuber && (
        <div className="moderation-sub-nav">
          <button 
            className={`sub-nav-btn ${activeSettingsTab === "general" ? "active" : ""}`}
            onClick={() => setActiveSettingsTab("general")}
          >
            General
            {isGeneralChanged && <span className="change-dot" />}
          </button>
          <button 
            className={`sub-nav-btn ${activeSettingsTab === "privacy" ? "active" : ""}`}
            onClick={() => setActiveSettingsTab("privacy")}
          >
            Privacy & Discovery
            {(isPrivacyChanged || isQuestionsChanged) && <span className="change-dot" />}
          </button>
        </div>
      )}

      {(!isVTuber || activeSettingsTab === "general") && (
        <div className="settings-card">
          <h2>General Settings</h2>
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
      )}

      {(!isVTuber || activeSettingsTab === "privacy") && (
        <>
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

          {requiresApproval && (
            <HubJoinQuestions 
              fanHubId={fanHubId} 
              questions={questions}
              setQuestions={setQuestions}
              deletedQuestionIds={deletedQuestionIds}
              setDeletedQuestionIds={setDeletedQuestionIds}
              loading={questionsLoading}
            />
          )}
        </>
      )}

      <div className="settings-actions">
        {hasChanges && (
          <div className="unsaved-changes-indicator">
            <span className="dot">●</span> Unsaved Changes
          </div>
        )}
        <button 
          className="save-btn" 
          onClick={handleSave} 
          disabled={isSaving || !hasChanges}
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
