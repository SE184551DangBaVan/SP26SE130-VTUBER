'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/functions/Auth/useAuth';
import { createPost } from '@/services/PostController';
import { showSuccess, showError, showLoading, updateToast } from '@/utils/toastUtils';
import './CreatePostPage.css';

export default function CreatePostPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { userAuth } = useAuth();
  
  const fanHubId = searchParams.get('fanHubId');
  
  const [postType, setPostType] = useState('TEXT');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [mediaFiles, setMediaFiles] = useState([]);
  const [mediaPreview, setMediaPreview] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [titleLength, setTitleLength] = useState(0);

  useEffect(() => {
    if (!fanHubId) {
      showError('No FanHub selected');
      router.back();
    }
  }, [fanHubId, router]);

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
      // Limit to max 4 images for IMAGE type, 1 video for VIDEO type
      const limitedFiles = postType === 'VIDEO' ? files.slice(0, 1) : files.slice(0, 4);
      setMediaFiles(limitedFiles);
      
      // Create preview URLs
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
      // Revoke old URL to prevent memory leaks
      if (prev[index]?.url) {
        URL.revokeObjectURL(prev[index].url);
      }
      return newPreviews;
    });
  };

  const handleSubmit = async () => {
    // Validation
    if (!title.trim()) {
      showError('Title is required');
      return;
    }

    if (postType === 'VIDEO' && mediaFiles.length === 0) {
      showError('Please upload a video file');
      return;
    }

    setSubmitting(true);
    const toastId = showLoading('Creating post...');

    try {
      // Parse hashtags
      const hashtagsArray = hashtags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      // Determine media key based on post type
      const mediaKey = postType === 'VIDEO' ? 'video' : 'images';
      const mediaToUpload = mediaFiles.length > 0 ? mediaFiles : null;

      const postData = {
        fanHubId: parseInt(fanHubId),
        postType,
        title: title.trim(),
        content: content.trim(),
        hashtags: hashtagsArray
      };

      await createPost(postData, mediaToUpload, mediaKey);
      
      updateToast(toastId, 'success', 'Post created successfully!');
      
      // Navigate back to hub page
      router.push(`/hub/${fanHubId}`);
    } catch (error) {
      console.error('Create post error:', error);
      updateToast(toastId, 'error', error.message || 'Failed to create post');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    // Clean up preview URLs
    mediaPreview.forEach(preview => {
      if (preview.url) {
        URL.revokeObjectURL(preview.url);
      }
    });
    router.back();
  };

  return (
    <div className='create-post-page'>
      <div className='create-post-container'>
        <div className='create-post-header'>
          <h1>Create Post</h1>
          <button className='cancel-btn' onClick={handleCancel}>
            Cancel
          </button>
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
            Body Text (optional)
          </label>
          <textarea
            id='post-content'
            className='form-textarea'
            placeholder="What's on your mind?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={8}
          />
        </div>

        {/* Media Upload */}
        {postType !== 'TEXT' && (
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
              'Create Post'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
