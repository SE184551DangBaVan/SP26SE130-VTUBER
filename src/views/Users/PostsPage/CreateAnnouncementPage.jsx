'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/functions/Auth/useAuth';
import { useSideBar } from '@/contexts/SideBarContext.tsx';
import { getMyHubAsOwner } from '@/services/FanHubController';
import { createPost } from '@/services/PostController';
import { showError, showLoading, updateToast } from '@/utils/toastUtils';
import './CreatePostPage.css';

export default function CreateAnnouncementPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { userAuth, loading: authLoading } = useAuth();
  const { sideBarRetractor } = useSideBar();

  const [ownedHub, setOwnedHub] = useState(null);
  const [loadingHub, setLoadingHub] = useState(true);

  const [postType, setPostType] = useState('TEXT');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [mediaFiles, setMediaFiles] = useState([]);
  const [mediaPreview, setMediaPreview] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [titleLength, setTitleLength] = useState(0);

  const [isSchedule, setIsSchedule] = useState(false);
  const [scheduleStartDate, setScheduleStartDate] = useState('');
  const [scheduleEndDate, setScheduleEndDate] = useState('');

  const textareaRef = useRef(null);

  // Fetch owned hub on mount
  useEffect(() => {
    const fetchOwnedHub = async () => {
      if (authLoading) return;

      if (!userAuth) {
        showError('You must be logged in to create an announcement');
        router.push('/login');
        return;
      }

      try {
        const hub = await getMyHubAsOwner();
        if (!hub) {
          showError('You do not own any hub');
          router.push('/hub');
          return;
        }
        setOwnedHub(hub);
      } catch (error) {
        console.error('Error fetching owned hub:', error);
        showError('Failed to load your hub');
      } finally {
        setLoadingHub(false);
      }
    };

    fetchOwnedHub();
  }, [userAuth, authLoading, router]);

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

  const handleScheduleToggle = () => {
    const newIsSchedule = !isSchedule;
    setIsSchedule(newIsSchedule);
    if (!newIsSchedule) {
      setScheduleStartDate('');
      setScheduleEndDate('');
    }
  };

  const handleScheduleStartDateChange = (e) => {
    setScheduleStartDate(e.target.value);
  };

  const handleScheduleEndDateChange = (e) => {
    setScheduleEndDate(e.target.value);
  };

  const handleSubmit = async () => {
    if (!ownedHub) {
      showError('Hub not loaded');
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

    // Validation for schedule
    if (isSchedule) {
      if (!scheduleStartDate || !scheduleEndDate) {
        showError('Both start and end dates are required for scheduled posts');
        return;
      }
    }

    setSubmitting(true);
    const toastId = showLoading('Creating announcement...');

    try {
      const hashtagsArray = hashtags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      const mediaKey = postType === 'VIDEO' ? 'video' : 'images';
      const mediaToUpload = mediaFiles.length > 0 ? mediaFiles : null;

      const postData = {
        fanHubId: ownedHub.fanHubId,
        postType,
        title: title.trim(),
        content: content.trim(),
        hashtags: hashtagsArray,
        isAnnouncement: true,
        isSchedule: isSchedule
      };

      if (isSchedule) {
        postData.startTime = new Date(scheduleStartDate).toISOString();
        postData.endTime = new Date(scheduleEndDate).toISOString();
      }

      await createPost(postData, mediaToUpload, mediaKey);

      updateToast(toastId, 'success', 'Announcement created successfully!');

      if (ownedHub?.subdomain) {
        router.push(`/hub/${ownedHub.subdomain}`);
      } else {
        router.push('/posts');
      }
    } catch (error) {
      console.error('Create announcement error:', error);
      updateToast(toastId, 'error', error.message || 'Failed to create announcement');
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
          <h1>Create Announcement</h1>
        </div>

        {loadingHub ? (
          <div className='loading-hubs'>Loading your hub...</div>
        ) : !ownedHub ? (
          <div className='no-hubs-message'>
            <p>You do not own any hub.</p>
            <button className='browse-hubs-btn' onClick={() => router.push('/explore')}>
              Browse Hubs
            </button>
          </div>
        ) : (
          <>
            {/* Hub Info Display (read-only) */}
            <div className='form-group'>
              <label className='form-label'>
                Posting to FanHub
              </label>
              <div className='custom-hub-dropdown'>
                <div className='custom-hub-selected' style={{ cursor: 'default' }}>
                  <img
                    src={ownedHub.avatarUrl || '/profile-pic-undefined.jpg'}
                    alt={ownedHub.hubName}
                    className='selected-hub-avatar'
                    onError={(e) => { e.target.src = '/profile-pic-undefined.jpg'; }}
                  />
                  <span className='selected-hub-name'>{ownedHub.hubName}</span>
                </div>
              </div>
            </div>

            {/* Post Type Selector */}
            <div className='post-type-selector'>
              <button
                className={`type-btn ${postType === 'TEXT' ? 'active' : ''}`}
                onClick={() => { setPostType('TEXT'); setMediaFiles([]); setMediaPreview([]); }}
              >
                Text
              </button>
              <button
                className={`type-btn ${postType === 'IMAGE' ? 'active' : ''}`}
                onClick={() => { setPostType('IMAGE'); setMediaFiles([]); setMediaPreview([]); }}
              >
                Images
              </button>
              <button
                className={`type-btn ${postType === 'VIDEO' ? 'active' : ''}`}
                onClick={() => { setPostType('VIDEO'); setMediaFiles([]); setMediaPreview([]); }}
              >
                Video
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
                placeholder='Enter announcement title'
                value={title}
                onChange={handleTitleChange}
                maxLength={300}
                style={{border: `1px solid ${titleLength > 50 ? 'red' : '#888'}`}}
              />
              <span className='char-count' style={{color: `${titleLength > 50 ? 'red' : '#888'}`}}>{titleLength}/50</span>
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

            {/* Content Editor with Toggle Buttons */}
            <div className='form-group'>
              <div className='content-header-row'>
                <label htmlFor='post-content' className='form-label'>
                  Content Text (optional)
                </label>
                <div className='toggle-buttons-group'>
                  <label className='toggle-btn-wrapper'>
                    <span className='toggle-label'>Scheduled?</span>
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
              </div>
              <div className='textarea-wrapper'>
                <textarea
                  ref={textareaRef}
                  id='post-content'
                  className='form-textarea'
                  placeholder="What announcement are you posting?"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={8}
                />
              </div>
              {/* Date Range Picker - only shown when isSchedule is true */}
              {isSchedule && (
                <div className='schedule-date-range-container'>
                  <div className='date-input-row'>
                    <div className='date-input-group'>
                      <label htmlFor='schedule-start-date' className='form-label'>
                        Start Date:
                      </label>
                      <input
                        type='datetime-local'
                        id='schedule-start-date'
                        value={scheduleStartDate}
                        onChange={handleScheduleStartDateChange}
                        className='form-input date-input'
                      />
                    </div>
                    <div className='date-input-group'>
                      <label htmlFor='schedule-end-date' className='form-label'>
                        End Date:
                      </label>
                      <input
                        type='datetime-local'
                        id='schedule-end-date'
                        value={scheduleEndDate}
                        onChange={handleScheduleEndDateChange}
                        className='form-input date-input'
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

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
              <button className='cancel-btn' onClick={handleCancel}>
                Cancel
              </button>
              <button
                className='submit-btn'
                onClick={handleSubmit}
                disabled={submitting || !title.trim()}
              >
                {submitting ? (
                  <>
                    <span className='spinner' />
                    Creating...
                  </>
                ) : (
                  'Create Announcement'
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
