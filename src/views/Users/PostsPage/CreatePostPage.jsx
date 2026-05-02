'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/functions/Auth/useAuth';
import { useSideBar } from '@/contexts/SideBarContext.tsx';
import { getMyJoinedHubs } from '@/services/FanHubController';
import { createPost, createPollPost } from '@/services/PostController';
import { checkIsMember } from '@/services/FanHubController';
import { showSuccess, showError, showLoading, updateToast } from '@/utils/toastUtils';
import { showSteamError } from '@/utils/SteamNotification';
import { EventRounded } from '@mui/icons-material';
import './CreatePostPage.css';

export default function CreatePostPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { userAuth, loading: authLoading } = useAuth();
  const { sideBarRetractor } = useSideBar();

  const [joinedHubs, setJoinedHubs] = useState([]);
  const [selectedFanHubId, setSelectedFanHubId] = useState(null);
  const [selectedFanHubSubdomain, setSelectedFanHubSubdomain] = useState(null);
  const [selectedHubData, setSelectedHubData] = useState(null);
  const [loadingHubs, setLoadingHubs] = useState(true);
  const [showHubDropdown, setShowHubDropdown] = useState(false);

  const [postType, setPostType] = useState('TEXT');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [mediaFiles, setMediaFiles] = useState([]);
  const [mediaPreview, setMediaPreview] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [titleLength, setTitleLength] = useState(0);

  const [pollOptions, setPollOptions] = useState(['', '']);
  const [isAnnouncement, setIsAnnouncement] = useState(false);
  const [isSchedule, setIsSchedule] = useState(false);
  const [isHubOwner, setIsHubOwner] = useState(false);
  const [checkingOwnership, setCheckingOwnership] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const dropdownRef = useRef(null);
  const textareaRef = useRef(null);
  const datePickerRef = useRef(null);

  // Check if current user is owner of selected hub
  useEffect(() => {
    const checkOwnership = async () => {
      if (!selectedFanHubId || !userAuth) {
        setIsHubOwner(false);
        return;
      }

      setCheckingOwnership(true);
      try {
        const memberData = await checkIsMember(selectedFanHubId);
        if (memberData && (memberData.roleInHub === 'OWNER' || memberData.roleInHub === 'VTUBER')) {
          setIsHubOwner(true);
        } else {
          setIsHubOwner(false);
        }
      } catch (error) {
        console.error('Error checking ownership:', error);
        setIsHubOwner(false);
      } finally {
        setCheckingOwnership(false);
      }
    };

    checkOwnership();
  }, [selectedFanHubId, userAuth]);

  const handleScheduleToggle = () => {
    setIsSchedule(!isSchedule);
  };

  const handleDatePickerClick = () => {
    setShowDatePicker(!showDatePicker);
  };

  const handleDateChange = (e) => {
    setScheduleDate(e.target.value);
  };

  const handleApplySchedule = () => {
    if (scheduleDate) {
      setIsSchedule(true);
      setShowDatePicker(false);
    }
  };

  const handleCancelSchedule = () => {
    setIsSchedule(false);
    setScheduleDate('');
    setShowDatePicker(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowHubDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch joined hubs on mount
  useEffect(() => {
    const fetchJoinedHubs = async () => {
      // Don't do anything if auth is still loading
      if (authLoading) return;

      if (!userAuth) {
        showError('You must be logged in to create a post');
        router.push('/login');
        return;
      }

      try {
        const hubs = await getMyJoinedHubs();
        setJoinedHubs(hubs);

        // Check search params first (more ethical/explicit) then fallback to session storage
        const preSelectedHubId = searchParams?.get('fanHubId') || sessionStorage.getItem('createPostPreSelectedHub');
        
        if (preSelectedHubId) {
          const targetHubId = parseInt(preSelectedHubId);
          const selectedHub = hubs.find(h => h.fanHubId === targetHubId);
          
          if (selectedHub) {
            setSelectedFanHubId(targetHubId);
            setSelectedFanHubSubdomain(selectedHub.subdomain);
            setSelectedHubData(selectedHub);
          } else {
            // User tried to use an ID of a hub they haven't joined
            showError('Invalid FanHub: You must be a member of this hub to post.');
            setSelectedFanHubId(null);
            setSelectedHubData(null);
          }
          // Clear session storage if it was used
          sessionStorage.removeItem('createPostPreSelectedHub');
        }
      } catch (error) {
        console.error('Error fetching joined hubs:', error);
        showError('Failed to load your joined hubs');
      } finally {
        setLoadingHubs(false);
      }
    };

    fetchJoinedHubs();
  }, [userAuth, authLoading, router, searchParams]);

  useEffect(() => {
    if (!loadingHubs && joinedHubs.length === 0) {
      showError('You have not joined any hubs yet');
    }
  }, [loadingHubs, joinedHubs]);

  const handleTitleChange = (e) => {
    const value = e.target.value;
    if (value.length <= 300) {
      setTitle(value);
      setTitleLength(value.length);
    }
  };

  const handleMediaChange = (e) => {
    const newFiles = Array.from(e.target.files);
    if (newFiles.length === 0) return;

    if (postType === 'VIDEO') {
      const file = newFiles[0];
      setMediaFiles([file]);
      
      // Cleanup old previews
      mediaPreview.forEach(p => URL.revokeObjectURL(p.url));
      
      setMediaPreview([{
        name: file.name,
        url: URL.createObjectURL(file),
        type: file.type
      }]);
    } else {
      // Calculate how many can be added
      const currentCount = mediaFiles.length;
      const remainingSlots = 4 - currentCount;
      
      if (remainingSlots <= 0) {
        showError('You can only upload up to 4 images');
        e.target.value = '';
        return;
      }
      
      const filesToAdd = newFiles.slice(0, remainingSlots);
      if (newFiles.length > remainingSlots) {
        showError(`Only the first ${remainingSlots} images were added (max 4 total)`);
      }
      
      const newPreviews = filesToAdd.map(file => ({
        name: file.name,
        url: URL.createObjectURL(file),
        type: file.type
      }));
      
      setMediaFiles(prev => [...prev, ...filesToAdd]);
      setMediaPreview(prev => [...prev, ...newPreviews]);
    }
    
    // Reset input value
    e.target.value = '';
  };

  const removeMediaFile = (index) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
    setMediaPreview(prev => {
      const newPreviews = prev.filter((_, i) => i !== index);
      if (prev[index]?.url) {
        URL.revokeObjectURL(prev[index].url);
      }
      return newPreviews;
    });
  };

  const handleSubmit = async () => {
    // Validation
    if (!selectedFanHubId) {
      showError('Please select a FanHub to post in');
      return;
    }

    if (!title.trim()) {
      showError('Title is required');
      return;
    }

    if (postType === 'IMAGE' && mediaFiles.length === 0) {
      showError('Please upload at least one image');
      return;
    }

    if (postType === 'VIDEO' && mediaFiles.length === 0) {
      showError('Please upload a video file');
      return;
    }

    if (postType === 'POLL') {
      const trimmedOptions = pollOptions.map(opt => opt.trim());
      const filledOptions = trimmedOptions.filter(opt => opt !== '');
      
      if (filledOptions.length < 2) {
        showError('Poll must have at least 2 options');
        return;
      }

      // Check for gaps (e.g., option 1 and 3 filled, but 2 is empty)
      let lastFilledIndex = -1;
      for (let i = trimmedOptions.length - 1; i >= 0; i--) {
        if (trimmedOptions[i] !== '') {
          lastFilledIndex = i;
          break;
        }
      }

      for (let i = 0; i <= lastFilledIndex; i++) {
        if (trimmedOptions[i] === '') {
          showError(`Option ${i + 1} cannot be empty if you have options following it`);
          return;
        }
      }
    }

    setSubmitting(true);
    const toastId = showLoading('Creating post...');

    try {
      const hashtagsArray = hashtags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      if (postType === 'POLL') {
        // Create poll post
        const validOptions = pollOptions.filter(opt => opt.trim());
        const pollData = {
          fanHubId: parseInt(selectedFanHubId),
          title: title.trim(),
          content: content.trim(),
          options: validOptions,
          hashtags: hashtagsArray
        };

        await createPollPost(pollData);
      } else {
        // Create regular post with media
        const mediaKey = postType === 'VIDEO' ? 'video' : 'images';
        const mediaToUpload = mediaFiles.length > 0 ? mediaFiles : null;

        const postData = {
          fanHubId: parseInt(selectedFanHubId),
          postType,
          title: title.trim(),
          content: content.trim(),
          hashtags: hashtagsArray,
          isAnnouncement: isHubOwner ? isAnnouncement : false,
          isSchedule: isHubOwner ? isSchedule : false,
          startTime: (isSchedule && scheduleDate) ? new Date(scheduleDate).toISOString() : null,
          endTime: (isSchedule && scheduleDate) ? new Date(scheduleDate).toISOString() : null
        };

        await createPost(postData, mediaToUpload, mediaKey);
      }

      updateToast(toastId, 'success', 'Post created successfully!');

      // Navigate back to hub page using subdomain
      const hubToNavigate = selectedHubData || joinedHubs.find(h => h.fanHubId === selectedFanHubId);
      if (hubToNavigate?.subdomain) {
        router.push(`/hub/${hubToNavigate.subdomain}`);
      } else {
        console.warn('Subdomain not available for this hub');
        router.push('/posts');
      }
    } catch (error) {
      console.error('Create post error:', error);
      
      const serverError = error.response?.data;
      const errorMessage = serverError?.data || serverError?.message || error.message || 'Failed to create post';
      
      updateToast(toastId, 'error', errorMessage);
      
      if (error.response?.status === 403) {
        showSteamError(errorMessage, 'Forbidden');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (mediaPreview.length > 0) {
      mediaPreview.forEach(preview => {
        if (preview.url) {
          URL.revokeObjectURL(preview.url);
        }
      });
    }
    router.back();
  };

  return (
    <div className={`create-post-page ${!sideBarRetractor ? 'sidebar-retracted' : 'sidebar-expanded'}`}>
      <div className='create-post-container'>
        <div className='create-post-header'>
          <h1>Create Post</h1>
          <div className='header-actions'>
            {/* VTUBER Exclusive Toggle Buttons - Only shown for Hub Owners */}
            {!checkingOwnership && isHubOwner && (
              <div className='toggle-buttons-group'>
                <label className='toggle-btn-wrapper'>
                  <span className='toggle-label'>Announcement</span>
                  <input
                    type='checkbox'
                    className='toggle-input'
                    checked={isAnnouncement}
                    onChange={(e) => setIsAnnouncement(e.target.checked)}
                  />
                  <span className={`toggle-slider ${isAnnouncement ? 'active' : ''}`}>
                    <span className='toggle-handle' />
                  </span>
                </label>
                <label className='toggle-btn-wrapper'>
                  <span className='toggle-label'>Schedule</span>
                  <input
                    type='checkbox'
                    className='toggle-input'
                    checked={isSchedule}
                    onChange={handleScheduleToggle}
                  />
                  <span className={`toggle-slider ${isSchedule ? 'active' : ''}`}>
                    <span className='toggle-handle' />
                  </span>
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Loading State */}
        {loadingHubs ? (
          <div className='loading-hubs'>Loading your joined hubs...</div>
        ) : joinedHubs.length === 0 ? (
          <div className='no-hubs-message'>
            <p>You have not joined any hubs yet.</p>
            <button className='browse-hubs-btn' onClick={() => router.push('/explore')}>
              Browse Hubs
            </button>
          </div>
        ) : (
          <>
            {/* FanHub Selector - Custom Dropdown with Avatars */}
            <div className='form-group'>
              <label className='form-label'>
                Post to FanHub <span className='required'>*</span>
              </label>
              <div className='custom-hub-dropdown' ref={dropdownRef}>
                <div
                  className='custom-hub-selected'
                  onClick={() => setShowHubDropdown(!showHubDropdown)}
                >
                  {selectedHubData ? (
                    <>
                      <img
                        src={selectedHubData.avatarUrl || '/profile-pic-undefined.jpg'}
                        alt={selectedHubData.hubName}
                        className='selected-hub-avatar'
                        onError={(e) => { e.target.src = '/profile-pic-undefined.jpg'; }}
                      />
                      <span className='selected-hub-name'>{selectedHubData.hubName}</span>
                    </>
                  ) : (
                    <span className='select-hub-placeholder'>Select a FanHub...</span>
                  )}
                  <svg className='dropdown-arrow' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
                    <polyline points='6 9 12 15 18 9' />
                  </svg>
                </div>
                {showHubDropdown && (
                  <div className='custom-hub-options'>
                    {joinedHubs.map(hub => (
                      <div
                        key={hub.fanHubId}
                        className={`custom-hub-option ${selectedFanHubId === hub.fanHubId ? 'selected' : ''}`}
                        onClick={() => {
                          setSelectedFanHubId(hub.fanHubId);
                          setSelectedFanHubSubdomain(hub.subdomain);
                          setSelectedHubData(hub);
                          setShowHubDropdown(false);
                        }}
                      >
                        <img
                          src={hub.avatarUrl || '/profile-pic-undefined.jpg'}
                          alt={hub.hubName}
                          className='hub-option-avatar'
                          onError={(e) => { e.target.src = '/profile-pic-undefined.jpg'; }}
                        />
                        <span className='hub-option-name'>{hub.hubName}</span>
                        <span className='hub-option-subdomain'>{hub.subdomain}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Post Type Selector */}
            <div className='post-type-selector'>
              <button
                className={`type-btn ${postType === 'TEXT' ? 'active' : ''}`}
                onClick={() => {
                  setPostType('TEXT');
                  setMediaFiles([]);
                  setMediaPreview([]);
                }}
              >
                Text
              </button>
              <button
                className={`type-btn ${postType === 'IMAGE' ? 'active' : ''}`}
                onClick={() => {
                  setPostType('IMAGE');
                  setMediaFiles([]);
                  setMediaPreview([]);
                }}
              >
                Images
              </button>
              <button
                className={`type-btn ${postType === 'VIDEO' ? 'active' : ''}`}
                onClick={() => {
                  setPostType('VIDEO');
                  setMediaFiles([]);
                  setMediaPreview([]);
                }}
              >
                Video
              </button>
              <button
                className={`type-btn ${postType === 'POLL' ? 'active' : ''}`}
                onClick={() => {
                  setPostType('POLL');
                  setMediaFiles([]);
                  setMediaPreview([]);
                }}
              >
                Poll
              </button>
            </div>

            {/* Title Input */}
            <div className='form-group title-group'>
              <input
                type='text'
                id='post-title'
                className='title-input'
                placeholder='Enter post title'
                value={title}
                onChange={handleTitleChange}
                maxLength={300}
              />
              <span className='char-count'>{titleLength}/300</span>
            </div>

            {/* Hashtags Input */}
            <div className='form-group hashtags-group'>
              <input
                type='text'
                id='post-hashtags'
                className='hashtags-input'
                placeholder='Add hashtags (comma-separated)'
                value={hashtags}
                onChange={(e) => setHashtags(e.target.value)}
              />
              <span className='field-hint'>Separate multiple hashtags with commas</span>
            </div>
            {/* Content Editor */}
            <div className='form-group'>
              <label htmlFor='post-content' className='form-label'>
                Content Text (optional)
              </label>
              <div className='textarea-wrapper'>
                <textarea
                  ref={textareaRef}
                  id='post-content'
                  className='form-textarea'
                  placeholder="What content are you posting?"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={8}
                />
                {/* Date Picker Button - shown inside textarea area */}
                {!showDatePicker && (
                  <button
                    type='button'
                    className='date-picker-trigger-btn'
                    onClick={handleDatePickerClick}
                    title='Add Schedule'
                  >
                    <EventRounded fontSize='small' />
                  </button>
                )}
                {/* Date Picker Popup */}
                {showDatePicker && (
                  <div className='date-picker-popup'>
                    <input
                      ref={datePickerRef}
                      type='datetime-local'
                      value={scheduleDate}
                      onChange={handleDateChange}
                      className='date-picker-input'
                    />
                    <div className='date-picker-actions'>
                      <button type='button' className='date-btn cancel' onClick={handleCancelSchedule}>
                        Cancel
                      </button>
                      <button type='button' className='date-btn apply' onClick={handleApplySchedule}>
                        Apply
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Poll Options */}
            {postType === 'POLL' && (
              <div className='form-group'>
                <label className='form-label'>
                  Poll Options <span className='required'>*</span>
                </label>
                <span className='field-hint'>Start with 2 options. Type in an option to reveal the next one (max 4).</span>
                <div className='poll-options-container'>
                  {pollOptions.map((option, index) => (
                    <div key={index} className='poll-option-input-wrapper'>
                      <span className='poll-option-number'>{index + 1}.</span>
                      <input
                        type='text'
                        className='poll-option-input'
                        placeholder={`Option ${index + 1}`}
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...pollOptions];
                          newOptions[index] = e.target.value;

                          // If typing in the last option and we haven't reached max 4, add a new empty option
                          if (index === pollOptions.length - 1 && e.target.value.trim() !== '' && pollOptions.length < 4) {
                            newOptions.push('');
                          }

                          setPollOptions(newOptions);
                        }}
                        maxLength={100}
                      />
                      {index >= 2 && (
                        <button
                          type='button'
                          className='remove-poll-option-btn'
                          onClick={() => {
                            const newOptions = pollOptions.filter((_, i) => i !== index);
                            setPollOptions(newOptions);
                          }}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Media Upload - Only for IMAGE and VIDEO types */}
            {(postType === 'IMAGE' || postType === 'VIDEO') && (
              <div className='form-group'>
                <label className='form-label'>
                  {postType === 'IMAGE' ? 'Images' : 'Upload Video'}{' '}
                  {(postType === 'IMAGE' || postType === 'VIDEO') && <span className='required'>*</span>}
                </label>
                <div className='media-upload-area'>
                  <input
                    type='file'
                    id='media-upload'
                    className='media-upload-input'
                    accept={postType === 'IMAGE' ? 'image/*' : 'video/*'}
                    multiple={postType === 'IMAGE'}
                    onChange={handleMediaChange}
                  />
                  <label htmlFor='media-upload' className='media-upload-btn'>
                    <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
                      <rect x='3' y='3' width='18' height='18' rx='2' ry='2' />
                      <circle cx='8.5' cy='8.5' r='1.5' />
                      <polyline points='21 15 16 10 5 21' />
                    </svg>
                    {postType === 'IMAGE' ? 'Add Image' : 'Upload Video'}
                  </label>
                </div>
                {mediaPreview.length > 0 && (
                  <div className='media-preview-grid'>
                    {mediaPreview.map((preview, index) => (
                      <div key={index} className='media-preview-item'>
                        {postType === 'IMAGE' ? (
                          <img src={preview.url} alt={preview.name} />
                        ) : (
                          <video src={preview.url} controls />
                        )}
                        <button
                          type='button'
                          className='remove-media-btn'
                          onClick={() => removeMediaFile(index)}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className='form-actions'>
              <button
                className='cancel-btn'
                onClick={handleCancel}
              >
                Cancel
              </button>
              <button
                className='submit-btn'
                onClick={handleSubmit}
                disabled={submitting || !selectedFanHubId || !title.trim()}
              >
                {submitting ? (
                  <>
                    <span className='spinner' />
                    Creating...
                  </>
                ) : (
                  'Create Post'
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
