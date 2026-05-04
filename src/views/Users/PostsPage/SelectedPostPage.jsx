'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { CommentRounded, ShareRounded } from '@mui/icons-material';
import { likePost, unlikePost } from '@/services/PostController';
import { showSteamSuccess, showSteamError } from '@/utils/SteamNotification';
import UserAvatar from '@/components/UserAvatar/UserAvatar';
import './SelectedPostPage.css';

export default function SelectedPostPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const postId = params?.postId;
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [likeLoading, setLikeLoading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [displayCount, setDisplayCount] = useState(0);
  const [animatingCount, setAnimatingCount] = useState(null);
  const [animationDirection, setAnimationDirection] = useState(null);
  
  // Content expand state
  const [isContentExpanded, setIsContentExpanded] = useState(false);
  const [needsSeeMore, setNeedsSeeMore] = useState(false);
  const contentRef = useRef(null);
  
  // Check if content needs "See more" button
  useEffect(() => {
    if (contentRef.current && post?.content) {
      const element = contentRef.current;
      const lineHeight = parseInt(window.getComputedStyle(element).lineHeight);
      const maxHeight = lineHeight * 6; // 6 lines for selected post page
      
      // Check after a small delay to ensure rendering is complete
      const timer = setTimeout(() => {
        if (element.scrollHeight > maxHeight) {
          setNeedsSeeMore(true);
        } else {
          setNeedsSeeMore(false);
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [post?.content]);
  
  const handleToggleContent = (e) => {
    e?.stopPropagation();
    setIsContentExpanded(!isContentExpanded);
  };

  useEffect(() => {
    // Post data should be passed from the previous page
    // For some f'ing reason. In Next.js 13+, I can't pass state directly, so I have to rely on the postId
    // For now, I just need to fetch the post or get it from a global store
    // Since I don't have a global storage, I'll fetch the post
    const fetchPost = async () => {
      if (!postId) return;

      setLoading(true);
      try {
        // Had to import this - but since can't get post by ID easily,
        // I'll have to use a different approach
        // For now, I'm use localStorage to pass the post data, like a dummy
        const storedPost = localStorage.getItem(`post_${postId}`);
        if (storedPost) {
          const postData = JSON.parse(storedPost);
          setPost(postData);
          setIsLiked(postData.isLikedByCurrentUser || false);
          setLikeCount(postData.likeCount || 0);
          setDisplayCount(postData.likeCount || 0);
        }
      } catch (error) {
        console.error('Error loading post:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [postId]);

  const handleLike = async () => {
    if (likeLoading) return;

    setLikeLoading(true);

    const prevCount = displayCount;
    const newCount = isLiked ? prevCount - 1 : prevCount + 1;
    const direction = isLiked ? 'up' : 'down';

    // Start animation
    setAnimationDirection(direction);
    setAnimatingCount(newCount);

    // Wait for animation to complete, then reset
    setTimeout(() => {
      setDisplayCount(newCount);
      setAnimatingCount(null);
      setAnimationDirection(null);
    }, 500);

    try {
      let result;

      if (isLiked) {
        // Unlike the post
        result = await unlikePost(post.postId);
        if (result?.success) {
          setIsLiked(false);
          setLikeCount(prev => prev - 1);
          showSteamSuccess(result.data || 'Post unliked successfully.', result.message || 'Unliked');
        }
      } else {
        // Like the post
        result = await likePost(post.postId);
        if (result?.success) {
          setIsLiked(true);
          setLikeCount(prev => prev + 1);
          showSteamSuccess(result.data || 'Post liked successfully!', result.message || 'Liked');
        }
      }
    } catch (error) {
      console.error('Like/Unlike error:', error);
      showSteamError(
        error?.response?.data?.message || 'Failed to like/unlike post',
        'Error'
      );
    } finally {
      setLikeLoading(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: post?.title,
        text: post?.content,
        url: window.location.href
      });
    } else if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    } else {
      // Fallback for browsers that don't support navigator.clipboard
      try {
        const textArea = document.createElement('textarea');
        textArea.value = window.location.href;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert('Link copied to clipboard!');
      } catch (err) {
        alert('Failed to copy link');
      }
    }
  };

  const handlePrevImage = () => {
    setCurrentImageIndex(prev => 
      prev === 0 ? post.mediaUrls.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    setCurrentImageIndex(prev => 
      prev === post.mediaUrls.length - 1 ? 0 : prev + 1
    );
  };

  if (loading) {
    return (
      <div className='selected-post-page-container'>
        <div className='post-loading'>
          <div className='loading-spinner'>Loading post...</div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className='selected-post-page-container'>
        <div className='post-not-found'>
          <h1>Post Not Found</h1>
          <p>The post you're looking for doesn't exist or was removed.</p>
          <button onClick={() => router.back()} className='back-btn'>Go Back</button>
        </div>
      </div>
    );
  }

  const renderMedia = () => {
    if (!post.mediaUrls || post.mediaUrls.length === 0) return null;

    if (post.postType === 'VIDEO') {
      return (
        <div className='post-media video-media'>
          <video controls>
            <source src={post.mediaUrls[0]} type='video/mp4' />
            Your browser does not support the video tag.
          </video>
        </div>
      );
    }

    // Single image
    if (post.mediaUrls.length === 1) {
      return (
        <div className='post-media image-media'>
          <img
            src={post.mediaUrls[0]}
            alt={post.title}
            onError={(e) => {
              e.target.src = '/placeholder-image.png';
            }}
          />
        </div>
      );
    }

    // Multiple images - Reddit-style carousel
    return (
      <div className='post-media image-gallery'>
        <div className='image-carousel'>
          <button 
            className='carousel-btn carousel-prev' 
            onClick={handlePrevImage}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          
          <div className='carousel-image-container'>
            <img
              src={post.mediaUrls[currentImageIndex]}
              alt={`${post.title} - Image ${currentImageIndex + 1}`}
              onError={(e) => {
                e.target.src = '/placeholder-image.png';
              }}
            />
          </div>

          <button 
            className='carousel-btn carousel-next' 
            onClick={handleNextImage}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>

          {/* Dot indicators */}
          {post.mediaUrls.length > 1 && (
            <div className='carousel-indicators'>
              {post.mediaUrls.map((_, index) => (
                <button
                  key={index}
                  className={`indicator-dot ${index === currentImageIndex ? 'active' : ''}`}
                  onClick={() => setCurrentImageIndex(index)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className='selected-post-page-container'>
      <div className='selected-post-content'>
        <div className='selected-post-header'>
          <button onClick={() => router.back()} className='back-btn'>
            ← Back
          </button>
        </div>

        <div className='selected-post-card'>
          <div className='post-content'>
            <div className='post-header'>
              <div className='post-author-info'>
                <UserAvatar
                  className='post-author-avatar'
                  avatarUrl={post.authorAvatarUrl}
                  avatarFrame={post.authorFrameUrl}
                  frameSize={post.authorFrameSize}
                  frameX={post.authorFrameXAxis}
                  frameY={post.authorFrameYAxis}
                  size="small"
                />
                <div className='post-author-details'>
                  <span className='author-display-name'>{post.authorDisplayName}</span>
                  <span className='author-username'>@{post.authorUsername}</span>
                </div>
              </div>
              <div className='post-meta-right'>
                <span className='post-time'>{formatTimeAgo(post.createdAt)}</span>
                {post.fanHubName && (
                  <span className='fanhub-badge'>{post.fanHubName}</span>
                )}
              </div>
            </div>

            <h1 className='post-title-full'>{post.title}</h1>

            {post.content && (
              <>
                <p 
                  ref={contentRef}
                  className={`post-text-full ${!isContentExpanded && needsSeeMore ? 'collapsed' : ''}`}
                >
                  {post.content}
                </p>
                {needsSeeMore && (
                  <button 
                    className='see-more-btn-full' 
                    onClick={handleToggleContent}
                  >
                    {isContentExpanded ? 'Show less' : 'See more...'}
                  </button>
                )}
              </>
            )}

            {renderMedia()}

            {post.hashtags && post.hashtags.length > 0 && (
              <div className='post-hashtags'>
                {post.hashtags.map((tag, idx) => (
                  <span key={idx} className='hashtag'>#{tag}</span>
                ))}
              </div>
            )}

            <div className='post-actions'>
              <div className='post-vote-section'>
                <div className='like-button' onClick={(e) => e.stopPropagation()}
                  title={`${isLiked ? 'unlike' : 'like'}`}>
                  <input 
                    className='heart-checkbox' 
                    id={`heart-${post.postId}`} 
                    type='checkbox' 
                    checked={isLiked} 
                    onChange={handleLike}
                    disabled={likeLoading}
                  />
                  <label className='like-label' htmlFor={`heart-${post.postId}`}>
                    {likeLoading ? (
                      <span className='like-loading-spinner' />
                    ) : (
                      <svg className='like-icon' viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="m11.645 20.91-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001Z"/>
                      </svg>
                    )}
                  </label>
                  <div className='like-count-container'>
                    <span className={`like-count-display ${animationDirection ? `slide-${animationDirection}-out` : ''}`}>{displayCount}</span>
                    {animatingCount !== null && (
                      <span className={`like-count-animating slide-${animationDirection}-in`}>{animatingCount}</span>
                    )}
                  </div>
                </div>
              </div>
              <button className='action-btn'>
                <CommentRounded fontSize='small' />
                <span>Comments</span>
              </button>
              <button className='action-btn' onClick={handleShare}>
                <ShareRounded fontSize='small' />
                <span>Share</span>
              </button>
            </div>
          </div>
        </div>

        {/* Comments Section Placeholder */}
        <div className='comments-section'>
          <div className='comments-header'>
            <h2>Comments</h2>
            <span>Coming Soon</span>
          </div>
          <div className='no-comments'>
            <p>Comments feature will be available soon.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatTimeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

  return date.toLocaleDateString();
}
