'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/functions/Auth/useAuth';
import { likePost, unlikePost, getTranslatePost, getPostSummary, pinPost, unpinPost, userDeleteOwnPost } from '@/services/PostController';
import { checkIsMember } from '@/services/FanHubController';
import { showSteamSuccess, showSteamError } from '@/utils/SteamNotification';
import { useReportModal, REPORT_TYPE } from '@/components/ReportModal';
import { ShareRounded, CommentRounded, AutoAwesome, Translate, MoreHoriz, Flag, SwapHoriz, Close, PushPin, LocalFlorist, DeleteOutline } from '@mui/icons-material';
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

  // Translate state
  const [isTranslated, setIsTranslated] = useState(false);
  const [translatedContent, setTranslatedContent] = useState(null);
  const [translatedTitle, setTranslatedTitle] = useState(null);
  const [translateLoading, setTranslateLoading] = useState(false);
  const [translateMessage, setTranslateMessage] = useState(null);
  
  // Content expand state
  const [isContentExpanded, setIsContentExpanded] = useState(false);
  const [needsSeeMore, setNeedsSeeMore] = useState(false);
  const contentRef = useRef(null);
  
  // Summary state
  const [showSummary, setShowSummary] = useState(false);
  const [summaryContent, setSummaryContent] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryFetched, setSummaryFetched] = useState(false);
  
  // Pin state
  const [roleInHub, setRoleInHub] = useState(null);
  const [pinLoading, setPinLoading] = useState(false);
  const [showPinConfirm, setShowPinConfirm] = useState(false);
  const [isPinned, setIsPinned] = useState(post?.isPinned || false);

  // Delete state
  const [isDeleted, setIsDeleted] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Check user role in hub
  useEffect(() => {
    const checkRoleInHub = async () => {
      if (!post?.fanHubId || !userAuth) {
        setRoleInHub(null);
        return;
      }
      
      try {
        const memberData = await checkIsMember(post.fanHubId);
        if (memberData?.roleInHub) {
          setRoleInHub(memberData.roleInHub);
        } else {
          setRoleInHub(null);
        }
      } catch (error) {
        console.error('Error checking user role:', error);
        setRoleInHub(null);
      }
    };
    
    checkRoleInHub();
  }, [post?.fanHubId, userAuth]);
  
  const handlePinPost = async () => {
    if (pinLoading) return;

    setPinLoading(true);
    try {
      let result;
      if (isPinned) {
        result = await unpinPost(post.postId);
        if (result?.success) {
          setIsPinned(false);
          showSteamSuccess(result.data || 'Post unpinned successfully!', result.message || 'Unpinned');
        }
      } else {
        result = await pinPost(post.postId);
        if (result?.success) {
          setIsPinned(true);
          showSteamSuccess(result.data || 'Post pinned successfully!', result.message || 'Pinned');
        }
      }
    } catch (error) {
      console.error('Pin/Unpin post error:', error);
      showSteamError(error?.response?.data?.message || 'Failed to update pin status', 'Error');
    } finally {
      setPinLoading(false);
      setShowPinConfirm(false);
    }
  };

  const handleDeletePost = async () => {
    if (deleteLoading) return;

    setDeleteLoading(true);
    try {
      const result = await userDeleteOwnPost(post.postId);
      if (result?.success) {
        setIsDeleted(true);
        showSteamSuccess('Post deleted successfully', 'Success');
      } else {
        showSteamError(result?.message || 'Failed to delete post', 'Error');
      }
    } catch (error) {
      console.error('Delete post error:', error);
      showSteamError(error?.response?.data?.message || 'Failed to delete post', 'Error');
    } finally {
      setDeleteLoading(false);
      setShowDeleteConfirm(false);
    }
  };
  
  const canPinPost = roleInHub === 'MODERATOR' || roleInHub === 'VTUBER';
  
  // Check if content needs "See more" button
  useEffect(() => {
    if (contentRef.current && post.content) {
      const element = contentRef.current;
      const lineHeight = parseInt(window.getComputedStyle(element).lineHeight);
      const maxHeight = lineHeight * 3; // 3 lines
      
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
  }, [post.content, translatedContent, isTranslated]);
  
  const handleToggleContent = (e) => {
    e.stopPropagation();
    setIsContentExpanded(!isContentExpanded);
  };

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

  const handleAISummary = async (e) => {
    e.stopPropagation();
    
    // If summary is already showing, just toggle it off
    if (showSummary) {
      setShowSummary(false);
      return;
    }
    
    // If we already have cached summary, just show it
    if (summaryFetched && summaryContent) {
      setShowSummary(true);
      return;
    }
    
    setSummaryLoading(true);

    try {
      const result = await getPostSummary(post.postId);
      if (result?.success && result?.data?.summarizeResult) {
        setSummaryContent(result.data.summarizeResult);
        setSummaryFetched(true);
        setShowSummary(true);
      } else {
        showSteamError(result?.message || 'Failed to generate summary', 'Error');
      }
    } catch (error) {
      console.error('Summary error:', error);
      showSteamError(error?.response?.data?.message || 'Failed to generate summary', 'Error');
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleAITranslate = async (e) => {
    e.stopPropagation();

    if (translateLoading) return;

    // If already showing translated, switch back to original (keep cached translation)
    if (isTranslated) {
      setIsTranslated(false);
      return;
    }

    // If we already have cached translation, just show it without refetching
    if (translatedContent || translatedTitle) {
      setIsTranslated(true);
      return;
    }

    setTranslateLoading(true);

    try {
      const result = await getTranslatePost(post.postId);
      if (result?.success && result?.data) {
        const { translatedContent, translatedTitle, translate_language_set, extraComment } = result.data;

        // Only set translatedContent if it's not empty or null
        setTranslatedContent(translatedContent || null);
        setTranslatedTitle(translatedTitle || null);

        if (!translate_language_set && extraComment) {
          setTranslateMessage(extraComment);
        } else {
          setTranslateMessage(null);
        }

        // Only mark as translated if we have either title or content
        if (translatedContent || translatedTitle) {
          setIsTranslated(true);
        }
      } else {
        showSteamError(result?.message || 'Failed to translate post', 'Error');
      }
    } catch (error) {
      console.error('Translate error:', error);
      showSteamError(error?.response?.data?.message || 'Failed to translate post', 'Error');
    } finally {
      setTranslateLoading(false);
    }
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

  const handleOpenDeleteConfirm = (e) => {
    e.stopPropagation();
    setExtraMenuOpen(false);
    setShowDeleteConfirm(true);
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
    const displayContent = isTranslated ? (translatedContent || post.content) : post.content;
    const displayTitle = isTranslated ? (translatedTitle || post.title) : post.title;

    switch (post.postType) {
      case 'IMAGE':
        return <ImagePostContent post={post} displayContent={displayContent} displayTitle={displayTitle} isTranslated={isTranslated} currentImageIndex={currentImageIndex} onPrevImage={handlePrevImage} onNextImage={handleNextImage} onDotClick={handleDotClick} isContentExpanded={isContentExpanded} needsSeeMore={needsSeeMore} onToggleContent={handleToggleContent} contentRef={contentRef} showSummary={showSummary} summaryContent={summaryContent} onSummaryClose={() => setShowSummary(false)} />;
      case 'VIDEO':
        return <VideoPostContent post={post} displayContent={displayContent} displayTitle={displayTitle} isTranslated={isTranslated} isContentExpanded={isContentExpanded} needsSeeMore={needsSeeMore} onToggleContent={handleToggleContent} contentRef={contentRef} showSummary={showSummary} summaryContent={summaryContent} onSummaryClose={() => setShowSummary(false)} />;
      case 'TEXT':
        return <TextPostContent post={post} displayContent={displayContent} displayTitle={displayTitle} isTranslated={isTranslated} isContentExpanded={isContentExpanded} needsSeeMore={needsSeeMore} onToggleContent={handleToggleContent} contentRef={contentRef} showSummary={showSummary} summaryContent={summaryContent} onSummaryClose={() => setShowSummary(false)} />;
      case 'POLL':
        return <PollPostContent post={post} displayContent={displayContent} displayTitle={displayTitle} isTranslated={isTranslated} isContentExpanded={isContentExpanded} needsSeeMore={needsSeeMore} onToggleContent={handleToggleContent} contentRef={contentRef} showSummary={showSummary} summaryContent={summaryContent} onSummaryClose={() => setShowSummary(false)} />;
      case 'ANNOUNCEMENT':
      case 'EVENT_SCHEDULE':
        return null;
      default:
        return <TextPostContent post={post} displayContent={displayContent} displayTitle={displayTitle} isTranslated={isTranslated} isContentExpanded={isContentExpanded} needsSeeMore={needsSeeMore} onToggleContent={handleToggleContent} contentRef={contentRef} showSummary={showSummary} summaryContent={summaryContent} onSummaryClose={() => setShowSummary(false)} />;
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
              <span className='author-username' style={hubData?.themeColor ? { color: hubData.themeColor } : {}}>
                {formatTimeAgo(post.createdAt)}
              </span>
            </div>
            {isPinned && (
              <span className='pinned-badge'>
                <PushPin fontSize='inherit' />
                Pinned
              </span>
            )}
          </div>
          <div className='post-actions-menu'>
            {canPinPost && (
              <button
                className='menu-btn'
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPinConfirm(true);
                }}
                disabled={pinLoading}
                title={isPinned ? 'Unpin post' : 'Pin post'}
              >
                {pinLoading ? (
                  <span className='pin-loading-spinner' />
                ) : (
                  <PushPin fontSize='small' className={isPinned ? 'pin-icon-pinned' : ''} />
                )}
              </button>
            )}
            <button
              className='menu-btn'
              onClick={handleAISummary}
              title={showSummary ? 'Hide Summary' : 'AI Summary'}
              disabled={summaryLoading}
            >
              {summaryLoading ? (
                <span className='summary-loading-spinner' />
              ) : (
                <AutoAwesome fontSize='small' />
              )}
            </button>
            <button 
              className='menu-btn' 
              onClick={handleAITranslate} 
              title={isTranslated ? 'Show Original' : 'AI Translate'}
              disabled={translateLoading}
            >
              {translateLoading ? (
                <span className='translate-loading-spinner' />
              ) : isTranslated ? (
                <SwapHoriz fontSize='small' />
              ) : (
                <Translate fontSize='small' />
              )}
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
                  {userAuth?.userId === post.authorId && (
                    <button className='dropdown-item delete-option' onClick={handleOpenDeleteConfirm}>
                      <DeleteOutline fontSize='small' />
                      <span>Delete post</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
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
            {isPinned && (
              <span className='pinned-badge'>
                <PushPin fontSize='inherit' />
                Pinned
              </span>
            )}
          </div>
        </div>
        <div className='post-actions-menu'>
          <button
            className='menu-btn'
            onClick={handleAISummary}
            title={showSummary ? 'Hide Summary' : 'AI Summary'}
            disabled={summaryLoading}
          >
            {summaryLoading ? (
              <span className='summary-loading-spinner' />
            ) : (
              <AutoAwesome fontSize='small' />
            )}
          </button>
          <button 
            className='menu-btn' 
            onClick={handleAITranslate} 
            title={isTranslated ? 'Show Original' : 'AI Translate'}
            disabled={translateLoading}
          >
            {translateLoading ? (
              <span className='translate-loading-spinner' />
            ) : isTranslated ? (
              <SwapHoriz fontSize='small' />
            ) : (
              <Translate fontSize='small' />
            )}
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
                {userAuth?.userId === post.authorId && (
                  <button className='dropdown-item delete-option' onClick={handleOpenDeleteConfirm}>
                    <DeleteOutline fontSize='small' />
                    <span>Delete post</span>
                  </button>
                )}
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
      {isDeleted ? (
        <div className='post-deleted-placeholder'>
          <DeleteOutline />
          <span>Post has been deleted</span>
        </div>
      ) : (
        <>
          {renderHeader()}
          {renderPostTypeContent()}
          {renderFooter()}
        </>
      )}
      
      {/* Pin Confirmation Dialog */}
      {showPinConfirm && (
        <div className='pin-confirm-overlay' onClick={(e) => e.stopPropagation()}>
          <div className='pin-confirm-dialog'>
            <div className='pin-confirm-icon'>
              <PushPin fontSize='large' />
            </div>
            <h4 className='pin-confirm-title'>{isPinned ? 'Unpin this post?' : 'Pin this post?'}</h4>
            <p className='pin-confirm-text'>
              {isPinned
                ? 'This post will be unpinned and return to its normal position in the feed.'
                : 'This post will be pinned to the top of the hub for all members to see.'}
            </p>
            <div className='pin-confirm-actions'>
              <button
                className='pin-confirm-btn pin-confirm-cancel'
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPinConfirm(false);
                }}
                disabled={pinLoading}
              >
                Cancel
              </button>
              <button
                className={`pin-confirm-btn ${isPinned ? 'pin-confirm-unpin' : 'pin-confirm-pin'}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handlePinPost();
                }}
                disabled={pinLoading}
              >
                {pinLoading ? (isPinned ? 'Unpinning...' : 'Pinning...') : (isPinned ? 'Unpin Post' : 'Pin Post')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className='pin-confirm-overlay' onClick={(e) => e.stopPropagation()}>
          <div className='pin-confirm-dialog delete-confirm-dialog'>
            <div className='pin-confirm-icon delete-icon-bg'>
              <DeleteOutline fontSize='large' />
            </div>
            <h4 className='pin-confirm-title'>Delete this post?</h4>
            <p className='pin-confirm-text'>
              Are you sure you want to delete your post? This action cannot be undone.
            </p>
            <div className='pin-confirm-actions'>
              <button
                className='pin-confirm-btn pin-confirm-cancel'
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteConfirm(false);
                }}
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button
                className='pin-confirm-btn pin-confirm-unpin'
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeletePost();
                }}
                disabled={deleteLoading}
              >
                {deleteLoading ? 'Deleting...' : 'Delete Post'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
//  Content Sub-Components
// ============================================================

function ImagePostContent({ post, displayContent, displayTitle, isTranslated, currentImageIndex, onPrevImage, onNextImage, onDotClick, isContentExpanded, needsSeeMore, onToggleContent, contentRef, showSummary, summaryContent, onSummaryClose }) {
  // Single image — no carousel needed
  if (!post.mediaUrls || post.mediaUrls.length === 1) {
    return (
      <div className='post-content'>
        {displayTitle && <h3 className='post-title'>{displayTitle}</h3>}
        {displayContent && (
          <>
            <p 
              ref={contentRef}
              className={`post-text ${!isContentExpanded && needsSeeMore ? 'collapsed' : ''}`}
            >
              {displayContent}
            </p>
            {needsSeeMore && (
              <button className='see-more-btn' onClick={onToggleContent}>
                {isContentExpanded ? 'Show less' : 'See more...'}
              </button>
            )}
          </>
        )}
        {showSummary && summaryContent && (
          <div className='summary-section'>
            <div className='summary-header'>
              <h4 className='summary-title'>AI Summary</h4>
              <button 
                className='summary-close-btn' 
                onClick={(e) => {
                  e.stopPropagation();
                  onSummaryClose();
                }}
                title='Close summary'
              >
                <Close fontSize='small' />
              </button>
            </div>
            <p className='summary-content'>{summaryContent}</p>
          </div>
        )}
        {post.mediaUrls && post.mediaUrls.length > 0 && (
          <div className='post-media image-media'>
            <img
              src={post.mediaUrls[0]}
              alt={displayTitle || 'Post image'}
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
      {displayTitle && <h3 className='post-title'>{displayTitle}</h3>}
      {displayContent && (
        <>
          <p 
            ref={contentRef}
            className={`post-text ${!isContentExpanded && needsSeeMore ? 'collapsed' : ''}`}
          >
            {displayContent}
          </p>
          {needsSeeMore && (
            <button className='see-more-btn' onClick={onToggleContent}>
              {isContentExpanded ? 'Show less' : 'See more...'}
            </button>
          )}
        </>
      )}
      {showSummary && summaryContent && (
        <div className='summary-section'>
          <div className='summary-header'>
            <h4 className='summary-title'>AI Summary</h4>
            <button 
              className='summary-close-btn' 
              onClick={(e) => {
                e.stopPropagation();
                onSummaryClose();
              }}
              title='Close summary'
            >
              <Close fontSize='small' />
            </button>
          </div>
          <p className='summary-content'>{summaryContent}</p>
        </div>
      )}
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
              alt={`${displayTitle || 'Post'} - Image ${currentImageIndex + 1}`}
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

function VideoPostContent({ post, displayContent, displayTitle, isTranslated, isContentExpanded, needsSeeMore, onToggleContent, contentRef, showSummary, summaryContent, onSummaryClose }) {
  return (
    <div className='post-content'>
      {displayTitle && <h3 className='post-title'>{displayTitle}</h3>}
      {displayContent && (
        <>
          <p 
            ref={contentRef}
            className={`post-text ${!isContentExpanded && needsSeeMore ? 'collapsed' : ''}`}
          >
            {displayContent}
          </p>
          {needsSeeMore && (
            <button className='see-more-btn' onClick={onToggleContent}>
              {isContentExpanded ? 'Show less' : 'See more...'}
            </button>
          )}
        </>
      )}
      {showSummary && summaryContent && (
        <div className='summary-section'>
          <div className='summary-header'>
            <h4 className='summary-title'>AI Summary</h4>
            <button 
              className='summary-close-btn' 
              onClick={(e) => {
                e.stopPropagation();
                onSummaryClose();
              }}
              title='Close summary'
            >
              <Close fontSize='small' />
            </button>
          </div>
          <p className='summary-content'>{summaryContent}</p>
        </div>
      )}
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

function TextPostContent({ post, displayContent, displayTitle, isTranslated, isContentExpanded, needsSeeMore, onToggleContent, contentRef, showSummary, summaryContent, onSummaryClose }) {
  return (
    <div className='post-content'>
      {displayTitle && <h3 className='post-title'>{displayTitle}</h3>}
      {displayContent && (
        <>
          <p 
            ref={contentRef}
            className={`post-text ${!isContentExpanded && needsSeeMore ? 'collapsed' : ''}`}
          >
            {displayContent}
          </p>
          {needsSeeMore && (
            <button className='see-more-btn' onClick={onToggleContent}>
              {isContentExpanded ? 'Show less' : 'See more...'}
            </button>
          )}
        </>
      )}
      {showSummary && summaryContent && (
        <div className='summary-section'>
          <div className='summary-header'>
            <h4 className='summary-title'>AI Summary</h4>
            <button 
              className='summary-close-btn' 
              onClick={(e) => {
                e.stopPropagation();
                onSummaryClose();
              }}
              title='Close summary'
            >
              <Close fontSize='small' />
            </button>
          </div>
          <p className='summary-content'>{summaryContent}</p>
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

function PollPostContent({ post, displayContent, displayTitle, isTranslated, isContentExpanded, needsSeeMore, onToggleContent, contentRef, showSummary, summaryContent, onSummaryClose }) {
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
      const serverError = error.response?.data;
      const errorMessage = serverError?.data || serverError?.message || error.message || 'Failed to vote';
      showSteamError(errorMessage, error.response?.status === 403 ? 'Forbidden' : 'Error');
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
      const serverError = error.response?.data;
      const errorMessage = serverError?.data || serverError?.message || error.message || 'Failed to remove vote';
      showSteamError(errorMessage, error.response?.status === 403 ? 'Forbidden' : 'Error');
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
      {displayTitle && <h3 className='post-title'>{displayTitle}</h3>}
      {displayContent && (
        <>
          <p 
            ref={contentRef}
            className={`post-text ${!isContentExpanded && needsSeeMore ? 'collapsed' : ''}`}
          >
            {displayContent}
          </p>
          {needsSeeMore && (
            <button className='see-more-btn' onClick={onToggleContent}>
              {isContentExpanded ? 'Show less' : 'See more...'}
            </button>
          )}
        </>
      )}
      {showSummary && summaryContent && (
        <div className='summary-section'>
          <div className='summary-header'>
            <h4 className='summary-title'>AI Summary</h4>
            <button 
              className='summary-close-btn' 
              onClick={(e) => {
                e.stopPropagation();
                onSummaryClose();
              }}
              title='Close summary'
            >
              <Close fontSize='small' />
            </button>
          </div>
          <p className='summary-content'>{summaryContent}</p>
        </div>
      )}
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
