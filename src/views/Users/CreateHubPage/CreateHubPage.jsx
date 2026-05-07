import { useState, useEffect } from 'react';
import { getUserById } from '@/services/UserController';
import { showError, showLoading, updateToast } from '@/utils/toastUtils';
import './CreateHubPage.css';
import { getFanHubs, createFanHubV2 } from '@/services/FanHubController';
import HubPage from '@/views/Users/HubPage/HubPage';
import ExploreBanner from '@/components/ExploreBanner/ExploreBanner';
import { HUB_CATEGORIES } from '@/constants/hubCategories';
import { useRouter } from 'next/navigation';


import LoadingImg1 from '../../../assets/Decor/Loading-1.gif'
import LoadingImg2 from '../../../assets/Decor/Loading-2.gif'
import LoadingImg3 from '../../../assets/Decor/loading-3.gif'
import LoadingImg4 from '../../../assets/Decor/loading-4.gif'
import LoadingImg5 from '../../../assets/Decor/Loading-5.gif'
import LoadingImg6 from '../../../assets/Decor/loading-6.gif'

const loadingImages = [LoadingImg1, LoadingImg2, LoadingImg3, LoadingImg4, LoadingImg5, LoadingImg6];

export default function CreateHubPage() {
  const router = useRouter();
  const [userId, setUserId] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(true);

  // Owned FanHub state
  const [ownedHub, setOwnedHub] = useState(null);
  const [hubLoading, setHubLoading] = useState(false);
  const [username, setUsername] = useState(null);

  //Create Hub form state
  const [hubName, setHubName] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [description, setDescription] = useState("");
  const [themeColor, setThemeColor] = useState("#555");
  const [categories, setCategories] = useState([]);
  const [isPrivate, setIsPrivate] = useState(false);
  const [requiresApproval, setRequiresApproval] = useState(false);

  // Image upload state
  const [bannerFile, setBannerFile] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [exploreImages, setExploreImages] = useState([]);
  
  const [bannerPreview, setBannerPreview] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [explorePreviews, setExplorePreviews] = useState([]);

  const [creating, setCreating] = useState(false);

  const [randomLoadingImage, setRandomLoadingImage] = useState(null);

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * loadingImages.length);
    setRandomLoadingImage(loadingImages[randomIndex]);
  }, []);

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

      try {
        const userData = await getUserById(storedUserId);

        if (userData) {
          setRole(userData.role);
          
          if (userData.role) {
            sessionStorage.setItem('role', userData.role);
            localStorage.setItem('role', userData.role);
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
        setChecking(false);
      }
    };

    fetchUserId();
  }, []);

  // Check for owned FanHub when user is VTUBER
  useEffect(() => {
    const checkForOwnedHub = async () => {
      if (!username || role !== 'VTUBER') return;

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

    if (role === 'VTUBER' && !checking) {
      checkForOwnedHub();
    }
  }, [role, checking, username]);

  const toggleCategory = (cat) => {
    setCategories((prev) =>
      prev.includes(cat)
        ? prev.filter((c) => c !== cat)
        : [...prev, cat]
    );
  };

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

  const handleExploreImagesChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const currentCount = exploreImages.length;
      const remainingSlots = 4 - currentCount;
      
      if (remainingSlots <= 0) {
        showError("You can only upload up to 4 explore images");
        return;
      }

      const newFiles = files.slice(0, remainingSlots);
      const updatedFiles = [...exploreImages, ...newFiles];
      setExploreImages(updatedFiles);
      
      const newPreviews = await Promise.all(newFiles.map(file => fileToBase64(file)));
      setExplorePreviews([...explorePreviews, ...newPreviews]);
    }
  };

  const removeExploreImage = (index) => {
    setExploreImages(prev => prev.filter((_, i) => i !== index));
    setExplorePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreateHub = async () => {
    if (!hubName || !subdomain) {
      showError("Hub name and subdomain required");
      return;
    }

    setCreating(true);
    const toastId = showLoading("Creating FanHub...");

    try {
      const payload = {
        hubName,
        subdomain,
        description,
        themeColor,
        category: categories,
        isPrivate,
        requiresApproval,
      };

      const result = await createFanHubV2(
        payload,
        bannerFile,
        avatarFile,
        exploreImages
      );

      if (result?.success) {
        updateToast(toastId, "success", "FanHub created successfully!");
        
        // Refresh and check for owned hub
        const hubs = await getFanHubs();
        const userOwnedHub = hubs.find(hub => hub.ownerUsername === username);
        if (userOwnedHub) {
          setOwnedHub(userOwnedHub);
        }
      } else {
        updateToast(toastId, "error", result?.message || "Failed to create FanHub");
      }
    } catch (error) {
      console.error('Create hub error:', error);
      updateToast(toastId, "error", "Network error. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className='create-hub-page-container'>
        <div className='loading-state'>Loading...</div>
      </div>
    );
  }

  // If user is not VTuber, show a redirect/message
  if (role !== 'VTUBER') {
    return (
      <div className='create-hub-page-container'>
        <div className='vtuber-application-wrapper'>
          <div className='application-card' style={{textAlign: 'center'}}>
            <div className='application-header'>
              <h1>Access Denied</h1>
              <p className='application-subtitle'>
                You must be a verified VTuber to create a FanHub.
              </p>
            </div>
            <button 
              className='submit-btn'
              onClick={() => router.push('/vtuber-application')} 
            >
              Go to VTuber Application
            </button>
            <p className='status-note' style={{marginTop: '15px'}}>
              If you have already applied, please wait for admin approval.
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  if (hubLoading) {
    return (
      <div className='create-hub-page-container'>
        <div className='posts-loading'>
          Checking For Your Fan Hub
          {randomLoadingImage && (
            <img
              className='loading-animation'
              src={randomLoadingImage.src}
              alt=""
              onError={(e) => {
                e.target.src = "/picture-not-available-photo.jpg";
              }}
            />
          )}
          <div className="loading-wrapper">
            <div className="loading-circle"></div>
            <div className="loading-circle"></div>
            <div className="loading-circle"></div>
            <div className="loading-shadow"></div>
            <div className="loading-shadow"></div>
            <div className="loading-shadow"></div>
          </div>
        </div>
      </div>
    );
  }

  if (ownedHub) {
    return (
      <HubPage ownedHub={ownedHub} />
    );
  }

  return (
    <div className='create-hub-page-container'>
      <div className='create-hub-editor-wrapper'>
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
                    <span className='input-prefix'>@</span>
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
                  <span className='field-hint'>Used for accent colors like buttons and avatar frame</span>
                </div>

                {/* Image Upload Section */}
                <div className='form-field'>
                  <label>Banner Image</label>
                  <div className='image-upload-wrapper'>
                    <input
                      type='file'
                      id='banner-upload'
                      accept='image/*'
                      onChange={handleBannerChange}
                      className='image-upload-input'
                    />
                    <label htmlFor='banner-upload' className='image-upload-btn'>
                      <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' className='upload-icon'>
                        <rect x='3' y='3' width='18' height='18' rx='2' ry='2' />
                        <circle cx='8.5' cy='8.5' r='1.5' />
                        <polyline points='21 15 16 10 5 21' />
                      </svg>
                      {bannerFile ? 'Change Banner' : 'Upload Banner'}
                    </label>
                    {bannerFile && (
                      <span className='image-file-name'>{bannerFile.name}</span>
                    )}
                  </div>
                  {bannerPreview && (
                    <div className='image-preview banner-preview'>
                      <img src={bannerPreview} alt='Banner preview' />
                    </div>
                  )}
                </div>

                <div className='form-field'>
                  <label>Avatar Image</label>
                  <div className='image-upload-wrapper'>
                    <input
                      type='file'
                      id='avatar-upload'
                      accept='image/*'
                      onChange={handleAvatarChange}
                      className='image-upload-input'
                    />
                    <label htmlFor='avatar-upload' className='image-upload-btn'>
                      <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' className='upload-icon'>
                        <rect x='3' y='3' width='18' height='18' rx='2' ry='2' />
                        <circle cx='8.5' cy='8.5' r='1.5' />
                        <polyline points='21 15 16 10 5 21' />
                      </svg>
                      {avatarFile ? 'Change Avatar' : 'Upload Avatar'}
                    </label>
                    {avatarFile && (
                      <span className='image-file-name'>{avatarFile.name}</span>
                    )}
                  </div>
                  {avatarPreview && (
                    <div className='image-preview avatar-preview'>
                      <img src={avatarPreview} alt='Avatar preview' />
                    </div>
                  )}
                </div>

                <div className='form-field'>
                  <label>Explore Banner Images</label>
                  <span className='field-hint'>Background images shown in the explore page (max 4)</span>
                  <div className='image-upload-wrapper'>
                    <input
                      type='file'
                      id='explore-upload'
                      accept='image/*'
                      multiple
                      onChange={handleExploreImagesChange}
                      className='image-upload-input'
                    />
                    <label htmlFor='explore-upload' className='image-upload-btn'>
                      <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' className='upload-icon'>
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                      Add Explore Images
                    </label>                  </div>
                  {explorePreviews.length > 0 && (
                    <div className='explore-preview-grid'>
                      {explorePreviews.map((preview, index) => (
                        <div key={index} className='explore-preview-item'>
                          <img src={preview} alt={`Explore ${index + 1}`} />
                          <button
                            type='button'
                            className='remove-image-btn'
                            onClick={() => removeExploreImage(index)}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className='form-field'>
                  <label>Categories</label>
                  <div className='category-select'>
                    {HUB_CATEGORIES.map((cat) => (
                      <button
                        key={cat.name}
                        type='button'
                        className={`category-chip ${categories.includes(cat.name) ? 'active' : ''}`}
                        onClick={() => toggleCategory(cat.name)}
                      >
                        {cat.name}
                        {categories.includes(cat.name) && (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className='chip-check'>
                            <path d="M20 6L9 17l-5-5" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

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
                <div className='mockup-browser-bar'>
                  <div className='browser-dots'>
                    <span className='dot red' />
                    <span className='dot yellow' />
                    <span className='dot green' />
                  </div>
                  <div className='browser-url'>
                    <span className='url-lock'>🔒</span>
                    <span className='url-text'>{subdomain || 'yourhub'}</span>
                  </div>
                </div>

                <div
                  className="preview-banner"
                  style={{
                    backgroundImage: bannerPreview ? `url(${bannerPreview})` : `linear-gradient(135deg, ${themeColor} 0%, ${themeColor}dd 100%)`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                >
                  <div className='banner-content'>
                    <div className='preview-avatar-wrapper' style={{ borderColor: themeColor }}>
                      {avatarPreview ? (
                        <img src={avatarPreview} alt='Avatar preview' className='preview-avatar-image' />
                      ) : (
                        <div className='preview-avatar-placeholder'>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className='preview-info' style={{background: '#0000004d', backdropFilter: 'blur(2px)'}}>
                      <h2 style={{color: themeColor}}>{hubName || "Your Hub Name"}</h2>
                      <p className='preview-subdomain' style={{color: themeColor}}>@{subdomain || 'yourhub'}</p>
                      <p className='preview-description' style={{color: themeColor}}>{description || "Your community description will appear here..."}</p>
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

                <div className='preview-content-placeholder'>
                  <div className='placeholder-post'>
                    <div className='placeholder-post-vote'>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className='vote-icon'>
                        <path d="M12 19V5M5 12l7-7 7 7" />
                      </svg>
                      <span>0</span>
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

                <div className='preview-explore-header' style={{marginTop: '24px', marginBottom: '12px'}}>
                  <h3>Explore Page Preview</h3>
                  <p className='field-hint'>How your hub looks on the Explore page</p>
                </div>
                
                <div className='preview-explore-banner'>
                  <ExploreBanner
                    bannerUrl={bannerPreview}
                    themeColor={themeColor}
                    avatarUrl={avatarPreview}
                    ownerDisplayName={username}
                    hubName={hubName}
                    memberCount={0}
                    highlightImgUrls={explorePreviews}
                    onVisit={() => {}}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
