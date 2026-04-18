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
  const { userAuth } = useAuth();
  const { sideBarRetractor } = useSideBar();

  const [joinedHubs, setJoinedHubs] = useState([]);
  const [selectedFanHubId, setSelectedFanHubId] = useState(null);
  const [selectedFanHubSubdomain, setSelectedFanHubSubdomain] = useState(null);
  const [selectedHubData, setSelectedHubData] = useState(null);
  const [loadingHubs, setLoadingHubs] = useState(true);
  const [showHubDropdown, setShowHubDropdown] = useState(false);

  const fanHubId = searchParams?.get('fanHubId');

  const [postType, setPostType] = useState('TEXT');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [mediaFiles, setMediaFiles] = useState([]);
  const [mediaPreview, setMediaPreview] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [titleLength, setTitleLength] = useState(0);

  // Poll options state
  const [pollOptions, setPollOptions] = useState(['', '']);
  const dropdownRef = useRef(null);
  const textareaRef = useRef(null);
  const datePickerRef = useRef(null);

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
      if (!userAuth) {
        showError('You must be logged in to create a post');
        router.push('/login');
        return;
      }

      try {
        const hubs = await getMyJoinedHubs();
        setJoinedHubs(hubs);

        // Check if there's a pre-selected hub from navigation
        const preSelectedHubId = sessionStorage.getItem('createPostPreSelectedHub');
        if (preSelectedHubId) {
          const hubExists = hubs.some(h => h.fanHubId === parseInt(preSelectedHubId));
          if (hubExists) {
            setSelectedFanHubId(parseInt(preSelectedHubId));
          }
          // Clear the session storage after using it
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
  }, [userAuth, router]);

  // VTUBER exclusive fields
  const [isAnnouncement, setIsAnnouncement] = useState(false);
  const [isSchedule, setIsSchedule] = useState(false);
  const [isHubOwner, setIsHubOwner] = useState(false);
  const [checkingOwnership, setCheckingOwnership] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');

  useEffect(() => {
    if (!loadingHubs && joinedHubs.length === 0) {
      showError('You have not joined any hubs yet');
    }
  }, [loadingHubs, joinedHubs]);

  // Check if user is the hub owner and has VTUBER role
  useEffect(() => {
    const checkOwnership = async () => {
      if (!fanHubId || !userAuth?.role) {
        setCheckingOwnership(false);
        return;
      }

      try {
        const memberData = await checkIsMember(parseInt(fanHubId));
        console.log("role in hub:", memberData?.roleInHub);
        console.log("role:", userAuth.role);

        // User is hub owner if they have VTUBER role and are a member
        const isOwner = userAuth.role === 'VTUBER' &&
                        memberData?.roleInHub === 'VTUBER';

        setIsHubOwner(isOwner);
      } catch (error) {
        console.error('Error checking hub ownership:', error);
        setIsHubOwner(false);
      } finally {
        setCheckingOwnership(false);
      }
    };

    checkOwnership();
  }, [fanHubId, userAuth]);

  const handleTitleChange = (e) => {
    const value = e.target.value;
    if (value.length <= 300) {
      setTitle(value);
      setTitleLength(value.length);
    }
  };

  const handleMediaChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const limitedFiles = postType === 'VIDEO' ? files.slice(0, 1) : files.slice(0, 4);
      setMediaFiles(limitedFiles);

      const previews = limitedFiles.map(file => ({
        name: file.name,
        url: URL.createObjectURL(file),
        type: file.type
      }));
      setMediaPreview(previews);
    }
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

  const handleScheduleToggle = () => {
    const newIsSchedule = !isSchedule;
    setIsSchedule(newIsSchedule);
    if (!newIsSchedule) {
      setShowDatePicker(false);
      setScheduleDate('');
    }
  };

  const handleDatePickerClick = (e) => {
    e.stopPropagation();
    setShowDatePicker(true);
  };

  const handleDateChange = (e) => {
    const dateValue = e.target.value;
    setScheduleDate(dateValue);
  };

  const handleApplySchedule = () => {
    if (!scheduleDate) {
      showError('Please select a date');
      return;
    }

    // Format as ISO string
    const isoDate = new Date(scheduleDate).toISOString();
    const appendText = ` - Append Schedule: ${isoDate}`;

    // Insert at current cursor position or append to end
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      const startPos = textarea.selectionStart;
      const endPos = textarea.selectionEnd;
      const beforeText = content.substring(0, startPos);
      const afterText = content.substring(endPos);

      const newContent = beforeText + appendText + afterText;
      setContent(newContent);
      setShowDatePicker(false);

      // Reset date picker
      setScheduleDate('');
    }
  };

  const handleCancelSchedule = () => {
    setShowDatePicker(false);
    setScheduleDate('');
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

    if (postType === 'VIDEO' && mediaFiles.length === 0) {
      showError('Please upload a video file');
      return;
    }

    if (postType === 'POLL') {
      // Filter out empty options
      const validOptions = pollOptions.filter(opt => opt.trim());
      if (validOptions.length < 2) {
        showError('Poll must have at least 2 options');
        return;
      }
      if (validOptions.length > 4) {
        showError('Poll can have at most 4 options');
        return;
      }
      // Check for empty options in the middle
      for (let i = 0; i < validOptions.length; i++) {
        if (!validOptions[i].trim()) {
          showError(`Option ${i + 1} cannot be empty`);
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
          isSchedule: isHubOwner ? isSchedule : false
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
        <div className='form-group'>
          <label htmlFor='post-title' className='form-label'>
            Title <span className='required'>*</span>
          </label>
          <input
            type='text'
            id='post-title'
            className='form-input'
            placeholder='Enter post title'
            value={title}
            onChange={handleTitleChange}
            maxLength={300}
          />
          <span className='char-count'>{titleLength}/300</span>
        </div>

        {/* Hashtags Input */}
        <div className='form-group'>
          <label htmlFor='post-hashtags' className='form-label'>
            Hashtags
          </label>
          <input
            type='text'
            id='post-hashtags'
            className='form-input'
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
              {postType === 'IMAGE' ? 'Upload Images' : 'Upload Video'}{' '}
              {postType === 'VIDEO' && <span className='required'>*</span>}
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
                {postType === 'IMAGE' ? 'Upload Images' : 'Upload Video'}
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
