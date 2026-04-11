'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/functions/Auth/useAuth';
import { likePost, unlikePost } from '@/services/PostController';
import { showSteamSuccess, showSteamError } from '@/utils/SteamNotification';
import { useReportModal, REPORT_TYPE } from '@/components/ReportModal';
import {
  ShareRounded,
  CommentRounded,
  AutoAwesome,
  Translate,
  MoreHoriz,
  Flag,
} from '@mui/icons-material';
import { votePoll, unVotePoll } from '@/services/PostController';
import './PostsPage.css';

/**
 * Shared PostCard component used across PostsPage, HubPage, and other pages.
 *
 * Props:
 *  - post:              The post object
 *  - onClick:           Called when the card itself is clicked (opens post detail)
 *  - onCommentsClick:   Called when the comments button is clicked
 *  - onShareClick:      Called when the share button is clicked
 *  - onHubClick:        Called when the hub name is clicked
 *  - userAuth:          External user auth object (falls back to context)
 *  - router:            External router (falls back to useRouter)
 *  - hubData:           Optional hub data object (used for themeColor in hub pages)
 *  - variant:           'feed' (default) | 'hub' — controls header layout & like style
 */
export default function PostCard({
  post,
  onClick,
  onCommentsClick,
  onShareClick,
  onHubClick,
  userAuth: externalUserAuth,
  router: externalRouter,
  hubData,
  variant = 'feed',
}) {
  const router = externalRouter || useRouter();
  const { userAuth: contextUserAuth } = useAuth();
  const userAuth = externalUserAuth || contextUserAuth;
  const { openReportModal } = useReportModal();

  // Like state
  const [isLiked, setIsLiked] = useState(post.isLikedByCurrentUser);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [likeLoading, setLikeLoading] = useState(false);
  const [displayCount, setDisplayCount] = useState(post.likeCount);
  const [animatingCount, setAnimatingCount] = useState(null);
  const [animationDirection, setAnimationDirection] = useState(null);

  // Carousel state for multi-image posts
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Extra menu (report dropdown)
  const [extraMenuOpen, setExtraMenuOpen] = useState(false);
  const menuRef = useRef();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setExtraMenuOpen(false);
      }
    };
    if (extraMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [extraMenuOpen]);

  // ---------- Like / Unlike ----------
  const handleLike = async (e) => {
    e.stopPropagation();
    if (likeLoading) return;

    // HubPage variant skips auth check
    if (variant === 'feed' && !userAuth) {
      router.push('/login');
      return;
    }

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
        result = await unlikePost(post.postId);
        if (result?.success) {
          setIsLiked(false);
          setLikeCount(prev => prev - 1);
          showSteamSuccess(result.data || 'Post unliked successfully.', result.message || 'Unliked');
        }
      } else {
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

  // ---------- Navigation helpers ----------
  const handleHubClick = (e) => {
    e.stopPropagation();
    if (onHubClick && post) {
      onHubClick(post);
    }
  };

  const handleCommentsClick = (e) => {
    e.stopPropagation();
    if (onCommentsClick) {
      onCommentsClick(post);
    }
  };

  const handleAISummary = (e) => {
    e.stopPropagation();
    console.log('AI Summary clicked for post:', post.postId);
  };

  const handleAITranslate = (e) => {
    e.stopPropagation();
    console.log('AI Translate clicked for post:', post.postId);
  };

  const handleExtraOptionsToggle = (e) => {
    e.stopPropagation();
    setExtraMenuOpen(prev => !prev);
  };

  const handleReportPost = (e) => {
    e.stopPropagation();
    setExtraMenuOpen(false);
    if (variant === 'feed' && !userAuth) {
      router.push('/login');
      return;
    }
    openReportModal({
      type: REPORT_TYPE.POST,
      targetId: post.postId,
      targetName: post.title || `Post #${post.postId}`,
    });
  };

  const handleAvatarClick = (e) => {
    e.stopPropagation();
    router.push(`/user/${post.authorUsername}`);
  };

  // ---------- Carousel helpers ----------
  const handlePrevImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex(prev =>
      prev === 0 ? post.mediaUrls.length - 1 : prev - 1
    );
  };

  const handleNextImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex(prev =>
      prev === post.mediaUrls.length - 1 ? 0 : prev + 1
    );
  };

  const handleDotClick = (e, index) => {
    e.stopPropagation();
    setCurrentImageIndex(index);
  };

  // ---------- Content renderer ----------
  const renderPostTypeContent = () => {
    switch (post.postType) {
      case 'IMAGE':
        return <ImagePostContent post={post} currentImageIndex={currentImageIndex} onPrevImage={handlePrevImage} onNextImage={handleNextImage} onDotClick={handleDotClick} />;
      case 'VIDEO':
        return <VideoPostContent post={post} />;
      case 'TEXT':
        return <TextPostContent post={post} />;
      case 'POLL':
        return <PollPostContent post={post} />;
      case 'ANNOUNCEMENT':
      case 'EVENT_SCHEDULE':
        return null;
      default:
        return <TextPostContent post={post} />;
    }
  };

  // ---------- Header renderer (variant-aware) ----------
  const renderHeader = () => {
    if (variant === 'hub') {
      // HubPage layout: author display name + username, themed timestamp
      return (
        <div className='post-header'>
          <div className='post-author-info'>
            <img
              className='post-author-avatar'
              src={post.authorAvatarUrl || '/profile-pic-undefined.jpg'}
              alt={post.authorDisplayName}
              onClick={handleAvatarClick}
              onError={(e) => { e.target.src = '/profile-pic-undefined.jpg'; }}
            />
            <div className='post-author-details'>
              <span className='author-display-name'>{post.authorDisplayName}</span>
              <span className='author-username'>@{post.authorUsername}</span>
            </div>
          </div>
          <span className='post-time' style={hubData?.themeColor ? { color: hubData.themeColor } : {}}>
            {formatTimeAgo(post.createdAt)}
          </span>
        </div>
      );
    }

    // Feed layout: hub name + timestamp
    return (
      <div className='post-header'>
        <div className='post-author-info'>
          <img
            className='post-author-avatar'
            src={post.authorAvatarUrl || '/profile-pic-undefined.jpg'}
            alt={post.authorDisplayName}
            title="Go to author profile"
            onClick={handleAvatarClick}
            onError={(e) => { e.target.src = '/profile-pic-undefined.jpg'; }}
          />
          <div className='post-author-details'>
            <span className='fanhub-name' onClick={handleHubClick} title="Go to hub">h/{post.fanHubName}</span>
            <span className='post-time'>{formatTimeAgo(post.createdAt)}</span>
          </div>
        </div>
        <div className='post-actions-menu'>
          <button className='menu-btn' onClick={handleAISummary} title='AI Summary'>
            <AutoAwesome fontSize='small' />
          </button>
          <button className='menu-btn' onClick={handleAITranslate} title='AI Translate'>
            <Translate fontSize='small' />
          </button>
          <div className='extra-menu-wrapper' ref={menuRef}>
            <button className='menu-btn' onClick={handleExtraOptionsToggle} title='More options'>
              <MoreHoriz fontSize='small' />
            </button>
            {extraMenuOpen && (
              <div className='extra-dropdown'>
                <button className='dropdown-item' onClick={handleReportPost}>
                  <Flag fontSize='small' />
                  <span>Report post</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ---------- Footer / like button renderer (variant-aware) ----------
  const renderFooter = () => {
    if (variant === 'hub') {
      // HubPage uses heart-checkbox style for like button
      return (
        <div className='post-actions'>
          <div className='post-footer-left'>
            <div className='post-vote-section'>
              <div className='like-button' title={`${isLiked ? 'unlike' : 'like'}`} 
                onClick={(e) => e.stopPropagation()}>
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
            <button className='action-btn' onClick={handleCommentsClick}>
              <CommentRounded fontSize='small' />
              <span>Comments</span>
            </button>
          </div>
          <button className='action-btn share-btn' onClick={(e) => {
            e.stopPropagation();
            onShareClick?.(post);
          }}>
            <ShareRounded fontSize='small' />
          </button>
        </div>
      );
    }

    // Feed layout: heart SVG button with animated count
    return (
      <div className='post-footer'>
        <div className='post-footer-left'>
          <div className='like-button' title={`${isLiked ? 'unlike' : 'like'}`}
            onClick={(e) => e.stopPropagation()}>
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
          <button className='action-btn' onClick={handleCommentsClick}>
            <CommentRounded fontSize='small' />
            <span>Comment</span>
          </button>
        </div>
        <button className='action-btn share-btn' onClick={(e) => {
          e.stopPropagation();
          onShareClick?.(post);
        }}>
          <ShareRounded fontSize='small' />
        </button>
      </div>
    );
  };

  return (
    <div className='post-card' onClick={onClick}>
      {renderHeader()}
      {renderPostTypeContent()}
      {renderFooter()}
    </div>
  );
}

// ============================================================
//  Content Sub-Components
// ============================================================

function ImagePostContent({ post, currentImageIndex, onPrevImage, onNextImage, onDotClick }) {
  // Single image — no carousel needed
  if (!post.mediaUrls || post.mediaUrls.length === 1) {
    return (
      <div className='post-content'>
        {post.title && <h3 className='post-title'>{post.title}</h3>}
        {post.content && <p className='post-text'>{post.content}</p>}
        {post.mediaUrls && post.mediaUrls.length > 0 && (
          <div className='post-media image-media'>
            <img
              src={post.mediaUrls[0]}
              alt={post.title || 'Post image'}
              onError={(e) => { e.target.src = '/placeholder-image.png'; }}
            />
          </div>
        )}
        {post.hashtags && post.hashtags.length > 0 && (
          <div className='post-hashtags'>
            {post.hashtags.map((tag, idx) => (
              <span key={idx} className='hashtag'>#{tag}</span>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Multiple images — carousel
  return (
    <div className='post-content'>
      {post.title && <h3 className='post-title'>{post.title}</h3>}
      {post.content && <p className='post-text'>{post.content}</p>}
      <div className='post-media image-gallery'>
        <div className='image-carousel'>
          <button className='carousel-btn carousel-prev' onClick={onPrevImage}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          <div className='carousel-image-container'>
            <img
              src={post.mediaUrls[currentImageIndex]}
              alt={`${post.title || 'Post'} - Image ${currentImageIndex + 1}`}
              onError={(e) => { e.target.src = '/placeholder-image.png'; }}
            />
          </div>

          <button className='carousel-btn carousel-next' onClick={onNextImage}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>

          <div className='carousel-indicators'>
            {post.mediaUrls.map((_, index) => (
              <button
                key={index}
                className={`indicator-dot ${index === currentImageIndex ? 'active' : ''}`}
                onClick={(e) => onDotClick(e, index)}
              />
            ))}
          </div>
        </div>
      </div>
      {post.hashtags && post.hashtags.length > 0 && (
        <div className='post-hashtags'>
          {post.hashtags.map((tag, idx) => (
            <span key={idx} className='hashtag'>#{tag}</span>
          ))}
        </div>
      )}
    </div>
  );
}

function VideoPostContent({ post }) {
  return (
    <div className='post-content'>
      {post.title && <h3 className='post-title'>{post.title}</h3>}
      {post.content && <p className='post-text'>{post.content}</p>}
      {post.mediaUrls && post.mediaUrls.length > 0 && (
        <div className='post-media video-media'>
          <video controls>
            <source src={post.mediaUrls[0]} type='video/mp4' />
            Your browser does not support the video tag.
          </video>
        </div>
      )}
      {post.hashtags && post.hashtags.length > 0 && (
        <div className='post-hashtags'>
          {post.hashtags.map((tag, idx) => (
            <span key={idx} className='hashtag'>#{tag}</span>
          ))}
        </div>
      )}
    </div>
  );
}

function TextPostContent({ post }) {
  return (
    <div className='post-content'>
      {post.title && <h3 className='post-title'>{post.title}</h3>}
      {post.content && <p className='post-text'>{post.content}</p>}
      {post.hashtags && post.hashtags.length > 0 && (
        <div className='post-hashtags'>
          {post.hashtags.map((tag, idx) => (
            <span key={idx} className='hashtag'>#{tag}</span>
          ))}
        </div>
      )}
    </div>
  );
}

function PollPostContent({ post }) {
  const [selectedOption, setSelectedOption] = useState(post.userVotedOptionId);
  const [voteCounts, setVoteCounts] = useState(post.voteCounts || {});
  const [totalVotes, setTotalVotes] = useState(post.totalVotes || 0);
  const [voting, setVoting] = useState(false);

  const handleOptionClick = async (optionId) => {
    if (selectedOption || voting) return;
    setVoting(true);

    try {
      await votePoll(post.postId, optionId);

      setSelectedOption(optionId);
      const newVoteCounts = { ...voteCounts };
      newVoteCounts[optionId] = (newVoteCounts[optionId] || 0) + 1;
      setVoteCounts(newVoteCounts);
      setTotalVotes(prev => prev + 1);
    } catch (error) {
      console.error('Error voting:', error);
    } finally {
      setVoting(false);
    }
  };

  const handleUnvote = async () => {
    if (voting) return;
    setVoting(true);

    try {
      await unVotePoll(post.postId);

      const oldOptionId = selectedOption;
      setSelectedOption(null);
      const newVoteCounts = { ...voteCounts };
      newVoteCounts[oldOptionId] = Math.max(0, (newVoteCounts[oldOptionId] || 1) - 1);
      setVoteCounts(newVoteCounts);
      setTotalVotes(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error unvoting:', error);
    } finally {
      setVoting(false);
    }
  };

  const getVotePercentage = (optionId) => {
    if (totalVotes === 0) return 0;
    const votes = voteCounts[optionId] || 0;
    return Math.round((votes / totalVotes) * 100);
  };

  return (
    <div className='post-content'>
      {post.title && <h3 className='post-title'>{post.title}</h3>}
      {post.content && <p className='post-text'>{post.content}</p>}
      {post.voteOptions && (
        <div className='poll-display'>
          <div className='poll-options-list'>
            {post.voteOptions.map((option) => {
              const isObject = typeof option === 'object' && option !== null;
              const optionId = isObject ? option.id : option;
              const optionText = isObject ? option.optionText : option;
              const thumbnailUrl = isObject ? option.thumbnailUrl : null;

              const percentage = getVotePercentage(optionId);
              const isSelected = selectedOption === optionId;
              const hasVoted = selectedOption !== null;

              return (
                <div
                  key={optionId}
                  className={`poll-option-item ${isSelected ? 'selected' : ''} ${voting ? 'voting' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOptionClick(optionId);
                  }}
                >
                  {hasVoted && (
                    <div className='poll-option-bar' style={{ width: `${percentage}%` }} />
                  )}
                  <div className='poll-option-content'>
                    {thumbnailUrl && (
                      <img
                        src={thumbnailUrl}
                        alt={optionText}
                        className='poll-option-thumbnail'
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    )}
                    <div className='poll-option-text-wrapper'>
                      <span className='poll-option-text'>{optionText}</span>
                      {hasVoted && (
                        <span className='poll-option-percentage'>{percentage}%</span>
                      )}
                      {!hasVoted && (
                        <span className='poll-option-icon'>○</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {selectedOption && (
            <>
              <div className='poll-total-votes'>
                {totalVotes} vote{totalVotes !== 1 ? 's' : ''}
              </div>
              <button
                className='poll-unvote-btn'
                onClick={(e) => {
                  e.stopPropagation();
                  handleUnvote();
                }}
                disabled={voting}
              >
                {voting ? 'Removing vote...' : 'Unselect option'}
              </button>
            </>
          )}
        </div>
      )}
      {post.hashtags && post.hashtags.length > 0 && (
        <div className='post-hashtags'>
          {post.hashtags.map((tag, idx) => (
            <span key={idx} className='hashtag'>#{tag}</span>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
//  Helpers
// ============================================================

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
