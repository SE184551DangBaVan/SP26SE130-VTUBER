import { useState, useEffect } from 'react';
import { useAuth } from '@/functions/Auth/useAuth';
import { getUserById, registerVtuberApplication } from '@/services/UserController';
import { showSuccess, showError, showLoading, updateToast } from '@/utils/toastUtils';
import './CreateHubPage.css';
import { getFanHubs, createFanHub } from '@/services/FanHubController';
import HubPage from '@/views/Users/HubPage/HubPage';

export default function CreateHubPage() {
  const { userAuth } = useAuth();
  const [userId, setUserId] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(true);

  // Application form state
  const [channelName, setChannelName] = useState('');
  const [channelLink, setChannelLink] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Owned FanHub state
  const [ownedHub, setOwnedHub] = useState(null);
  const [hubLoading, setHubLoading] = useState(false);
  const [username, setUsername] = useState(null);

  //Create Hub
  const [hubName, setHubName] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [description, setDescription] = useState("");
  const [themeColor, setThemeColor] = useState("#000");
  const [categories, setCategories] = useState([]);
  const [isPrivate, setIsPrivate] = useState(false);
  const [requiresApproval, setRequiresApproval] = useState(false);

  const [bannerPreview, setBannerPreview] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const fetchUserId = async () => {
      const storedUserId = sessionStorage.getItem('userID') || localStorage.getItem('userID');
      const storedUsername = sessionStorage.getItem('username') || localStorage.getItem('username');

      if (!storedUserId) {
        console.error('No user ID found in storage');
        setLoading(false);
        setChecking(false);
        return;
      }

      setUserId(storedUserId);
      setUsername(storedUsername);

      const userData = await getUserById(storedUserId);

      if (userData) {
        setUserRole(userData.role);

        if (userData.role === 'VTUBER') {
          setChecking(false);
        }
      }

      setLoading(false);
      setChecking(false);
    };

    fetchUserId();
  }, []);

  // Check for owned FanHub when user is VTUBER
  useEffect(() => {
    const checkForOwnedHub = async () => {
      if (!username || userRole !== 'VTUBER') return;

      setHubLoading(true);
      try {
        const hubs = await getFanHubs();
        
        const userOwnedHub = hubs.find(hub => hub.ownerUsername === username);
        
        if (userOwnedHub) {
          setOwnedHub(userOwnedHub);
        }
      } catch (error) {
        console.error('Error fetching fan hubs:', error);
      } finally {
        setHubLoading(false);
      }
    };

    if (userRole === 'VTUBER' && !checking) {
      checkForOwnedHub();
    }
  }, [userRole, checking, username]);

  const handleApplicationSubmit = async (e) => {
    e.preventDefault();
    
    if (!channelName.trim() || !channelLink.trim()) {
      showError('Please fill in all fields');
      return;
    }

    setSubmitting(true);
    const toastId = showLoading('Submitting application...');

    try {
      const result = await registerVtuberApplication(userId, channelName, channelLink);

      if (result?.success) {
        updateToast(toastId, 'success', 'Application submitted successfully!');
        
        setTimeout(async () => {
          const userData = await getUserById(userId);
          if (userData?.role === 'VTUBER') {
            setUserRole('VTUBER');
            setChecking(false);
          } else {
            showSuccess('Application submitted! Please wait for admin approval.');
          }
        }, 2000);
      } else {
        updateToast(toastId, 'error', result?.message || 'Failed to submit application');
      }
    } catch (error) {
      console.error('Application error:', error);
      updateToast(toastId, 'error', 'Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleCategory = (cat) => {
    setCategories((prev) =>
      prev.includes(cat)
        ? prev.filter((c) => c !== cat)
        : [...prev, cat]
    );
  };

  const handleCreateHub = async () => {
  if (!hubName || !subdomain) {
    showError("Hub name and subdomain required");
    return;
  }

  setCreating(true);
    const toastId = showLoading("Creating FanHub...");

    const payload = {
      hubName,
      subdomain,
      description,
      themeColor,
      category: categories,
      isPrivate,
      requiresApproval,
    };

    const res = await createFanHub(payload);

    if (res?.success) {
      updateToast(toastId, "success", "FanHub created!");
    } else {
      updateToast(toastId, "error", "Failed to create FanHub");
    }

    setCreating(false);
  };

  if (loading) {
    return (
      <div className='create-hub-page-container'>
        <div className='loading-state'>Loading...</div>
      </div>
    );
  }
  
  if (userRole === 'VTUBER' && !checking) {
    if (hubLoading) {
      return (
        <div className='create-hub-page-container'>
          <div className='loading-state'>Checking for your FanHub...</div>
        </div>
      );
    }

    if (ownedHub) {
      return (
        <div className='create-hub-page-container'>
          <HubPage ownedHub={ownedHub} />
        </div>
      );
    }

    // User doesn't own a hub - show create hub form
    return (
      <div className='create-hub-page-container'>
        <div className='create-hub-editor-wrapper'>
          {/* Editor Header */}
          <div className='editor-header'>
            <div className='editor-title'>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className='title-icon'>
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 9h18" />
                <path d="M9 21V9" />
              </svg>
              <h1>Create Your FanHub</h1>
            </div>
            <p className='editor-subtitle'>Design and configure your community hub</p>
          </div>

          <div className='create-hub-editor'>
            {/* LEFT PANEL - Settings */}
            <div className='editor-panel editor-settings'>
              <div className='panel-header'>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className='panel-icon'>
                  <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z" />
                </svg>
                <h2>Hub Settings</h2>
              </div>

              <div className='panel-content'>
                {/* Basic Info Section */}
                <div className='settings-section'>
                  <h3 className='section-title'>Basic Information</h3>
                  
                  <div className='form-field'>
                    <label htmlFor='hubName'>Hub Name *</label>
                    <input
                      id='hubName'
                      type='text'
                      className='form-input'
                      placeholder='My Awesome Hub'
                      value={hubName}
                      onChange={(e) => setHubName(e.target.value)}
                    />
                  </div>

                  <div className='form-field'>
                    <label htmlFor='subdomain'>Subdomain *</label>
                    <div className='input-with-prefix'>
                      <span className='input-prefix'>vhub.io/</span>
                      <input
                        id='subdomain'
                        type='text'
                        className='form-input'
                        placeholder='myhub'
                        value={subdomain}
                        onChange={(e) => setSubdomain(e.target.value.replace(/\s/g, ''))}
                      />
                    </div>
                  </div>

                  <div className='form-field'>
                    <label htmlFor='description'>Description</label>
                    <textarea
                      id='description'
                      className='form-textarea'
                      placeholder='Describe your community...'
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={4}
                    />
                    <span className='field-hint'>Tell people what your hub is about</span>
                  </div>
                </div>

                {/* Appearance Section */}
                <div className='settings-section'>
                  <h3 className='section-title'>Appearance</h3>
                  
                  <div className='form-field'>
                    <label>Theme Color</label>
                    <div className='color-picker-wrapper'>
                      <div 
                        className='color-preview' 
                        style={{ backgroundColor: themeColor }}
                      />
                      <input
                        type='color'
                        className='color-input'
                        value={themeColor}
                        onChange={(e) => setThemeColor(e.target.value)}
                      />
                      <span className='color-value'>{themeColor.toUpperCase()}</span>
                    </div>
                  </div>

                  <div className='form-field'>
                    <label>Categories</label>
                    <div className='category-select'>
                      {["Game", "Talking", "Singing", "ASMR", "Art", "Music", "Cooking", "Just Chatting"].map((cat) => (
                        <button
                          key={cat}
                          type='button'
                          className={`category-chip ${categories.includes(cat) ? 'active' : ''}`}
                          onClick={() => toggleCategory(cat)}
                        >
                          {cat}
                          {categories.includes(cat) && (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className='chip-check'>
                              <path d="M20 6L9 17l-5-5" />
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Privacy Section */}
                <div className='settings-section'>
                  <h3 className='section-title'>Privacy & Access</h3>
                  
                  <div className='toggle-option'>
                    <div className='toggle-info'>
                      <label htmlFor='isPrivate'>Private Hub</label>
                      <p className='toggle-description'>Only members can see content</p>
                    </div>
                    <label className='toggle-switch'>
                      <input
                        id='isPrivate'
                        type='checkbox'
                        checked={isPrivate}
                        onChange={() => setIsPrivate(!isPrivate)}
                      />
                      <span className='toggle-slider' />
                    </label>
                  </div>

                  <div className='toggle-option'>
                    <div className='toggle-info'>
                      <label htmlFor='requiresApproval'>Require Approval</label>
                      <p className='toggle-description'>Members need approval to join</p>
                    </div>
                    <label className='toggle-switch'>
                      <input
                        id='requiresApproval'
                        type='checkbox'
                        checked={requiresApproval}
                        onChange={() => setRequiresApproval(!requiresApproval)}
                      />
                      <span className='toggle-slider' />
                    </label>
                  </div>
                </div>

                {/* Action Button */}
                <button 
                  className='create-btn' 
                  onClick={handleCreateHub} 
                  disabled={creating || !hubName || !subdomain}
                >
                  {creating ? (
                    <>
                      <span className='spinner' />
                      Creating...
                    </>
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className='btn-icon'>
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                      Create FanHub
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* RIGHT PANEL - Live Preview */}
            <div className='editor-panel editor-preview'>
              <div className='panel-header'>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className='panel-icon'>
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                <h2>Live Preview</h2>
              </div>

              <div className='preview-container'>
                <div className='preview-mockup'>
                  {/* Mockup Browser Bar */}
                  <div className='mockup-browser-bar'>
                    <div className='browser-dots'>
                      <span className='dot red' />
                      <span className='dot yellow' />
                      <span className='dot green' />
                    </div>
                    <div className='browser-url'>
                      <span className='url-lock'>🔒</span>
                      <span className='url-text'>vhub.io/{subdomain || 'yourhub'}</span>
                    </div>
                  </div>

                  {/* Preview Banner */}
                  <div 
                    className="preview-banner"
                    style={{ 
                      background: `linear-gradient(135deg, ${themeColor} 0%, ${themeColor}dd 100%)`,
                    }}
                  >
                    <div className='banner-content'>
                      <div className='preview-avatar-placeholder'>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                      </div>
                      <div className='preview-info'>
                        <h2>{hubName || "Your Hub Name"}</h2>
                        <p className='preview-subdomain'>@{subdomain || 'yourhub'}</p>
                        <p className='preview-description'>{description || "Your community description will appear here..."}</p>
                        <div className='preview-stats'>
                          <span className='stat'>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className='stat-icon'>
                              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                              <circle cx="9" cy="7" r="4" />
                              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                            0 Members
                          </span>
                          {categories.length > 0 && (
                            <span className='stat'>
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className='stat-icon'>
                                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                                <line x1="7" y1="7" x2="7.01" y2="7" />
                              </svg>
                              {categories.join(', ')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Preview Content Placeholder */}
                  <div className='preview-content-placeholder'>
                    <div className='placeholder-post'>
                      <div className='placeholder-post-vote'>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className='vote-icon'>
                          <path d="M12 19V5M5 12l7-7 7 7" />
                        </svg>
                        <span>0</span>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className='vote-icon down'>
                          <path d="M12 5v14M5 12l7 7 7-7" />
                        </svg>
                      </div>
                      <div className='placeholder-post-content'>
                        <div className='placeholder-post-header'>
                          <div className='placeholder-avatar' />
                          <div className='placeholder-line short' />
                        </div>
                        <div className='placeholder-line' />
                        <div className='placeholder-line half' />
                      </div>
                    </div>
                  </div>

                  {/* Privacy Badges */}
                  <div className='preview-badges'>
                    {isPrivate && (
                      <span className='badge private'>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className='badge-icon'>
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                        Private
                      </span>
                    )}
                    {requiresApproval && (
                      <span className='badge approval'>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className='badge-icon'>
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        </svg>
                        Approval Required
                      </span>
                    )}
                    {!isPrivate && !requiresApproval && (
                      <span className='badge public'>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className='badge-icon'>
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                        Public Hub
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // VTuber application form
  return (
    <div className='create-hub-page-container'>
      <div className='vtuber-application-wrapper'>
        <div className='application-card'>
          <div className='application-header'>
            <h1>VTuber Application</h1>
            <p className='application-subtitle'>
              You need to be a verified VTuber first to create a FanHub
            </p>
          </div>

          <div className='application-info'>
            <div className='info-icon'>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4" />
                <path d="M12 8h.01" />
              </svg>
            </div>
            <p>
              Submit your YouTube channel for verification. 
              Our admin team will review your application soon.
            </p>
          </div>

          <form onSubmit={handleApplicationSubmit} className='application-form'>
            <div className='form-group'>
              <label htmlFor='channelName'>Channel Name</label>
              <input
                id='channelName'
                type='text'
                className='form-input'
                placeholder='e.g., Vtuber Name Ch. hololive-EN'
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
                required
              />
            </div>

            <div className='form-group'>
              <label htmlFor='channelLink'>Channel Link</label>
              <input
                id='channelLink'
                type='url'
                className='form-input'
                placeholder='e.g., https://www.youtube.com/@VTuberChannel'
                value={channelLink}
                onChange={(e) => setChannelLink(e.target.value)}
                required
              />
            </div>

            <button 
              type='submit' 
              className='submit-btn'
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Application'}
            </button>
          </form>

          <div className='application-status'>
            <p className='status-text'>
              Current Status: <span className='status-badge pending'>PENDING</span>
            </p>
            <p className='status-note'>
              After approval, you'll be able to create your FanHub.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
