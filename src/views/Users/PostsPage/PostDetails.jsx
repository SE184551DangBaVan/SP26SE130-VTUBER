'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getPostById, likePost, unlikePost, votePoll, unVotePoll, getTranslatePost, getPostSummary } from '@/services/PostController';
import { checkIsMember } from '@/services/FanHubController';
import { showSteamSuccess, showSteamError } from '@/utils/SteamNotification';
import { useAuth } from '@/functions/Auth/useAuth';
import { useReportModal, REPORT_TYPE } from '@/components/ReportModal';
import CommentSection from './CommentSection';
import './PostDetails.css';
import {
  ShareRounded,
  MoreHoriz,
  Translate,
  AutoAwesome,
  Close,
  Favorite,
  FavoriteBorder,
  Flag,
  SwapHoriz,
  PushPin,
} from '@mui/icons-material';
import RetroWindow from '@/components/RetroWindow/RetroWindow';

const MAX_NEST_DEPTH = 5;

export default function PostDetails({ scrollPositionRef, postIdProp, onClose }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { userAuth } = useAuth();
  const { openReportModal } = useReportModal();
  
  // Determine if we're using prop-based or URL-based postId
  const isPropBased = postIdProp !== undefined && postIdProp !== null;
  // Use prop if provided, otherwise get from URL params
  const postId = isPropBased ? postIdProp : (searchParams.get('id') || searchParams.get('shareId'));
  const isShared = !!searchParams.get('shareId');

  console.log('PostDetails - isPropBased:', isPropBased, 'postIdProp:', postIdProp, 'postId:', postId);

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [likeLoading, setLikeLoading] = useState(false);
  const [extraMenuOpen, setExtraMenuOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const menuRef = useRef();
  
  // Content expand state
  const [isContentExpanded, setIsContentExpanded] = useState(false);
  const [needsSeeMore, setNeedsSeeMore] = useState(false);
  const contentRef = useRef(null);
  
  // Translate state
  const [isTranslated, setIsTranslated] = useState(false);
  const [translatedContent, setTranslatedContent] = useState(null);
  const [translatedTitle, setTranslatedTitle] = useState(null);
  const [translateLoading, setTranslateLoading] = useState(false);
  const [translateMessage, setTranslateMessage] = useState(null);
  
  // Summary state
  const [showSummary, setShowSummary] = useState(false);
  const [summaryContent, setSummaryContent] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryFetched, setSummaryFetched] = useState(false);
  
  // Check if content needs "See more" button
  useEffect(() => {
    if (contentRef.current && post?.content) {
      const element = contentRef.current;
      const lineHeight = parseInt(window.getComputedStyle(element).lineHeight);
      const maxHeight = lineHeight * 5; // 5 lines for post details
      
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
  
  // AI Summary handler
  const handleAISummary = async (e) => {
    e?.stopPropagation();
    
    if (showSummary) {
      setShowSummary(false);
      return;
    }
    
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
  
  // AI Translate handler
  const handleAITranslate = async (e) => {
    e?.stopPropagation();

    if (translateLoading) return;

    if (isTranslated) {
      setIsTranslated(false);
      return;
    }

    if (translatedContent || translatedTitle) {
      setIsTranslated(true);
      return;
    }

    setTranslateLoading(true);

    try {
      const result = await getTranslatePost(post.postId);
      if (result?.success && result?.data) {
        const { translatedContent, translatedTitle, translate_language_set, extraComment } = result.data;
        
        setTranslatedContent(translatedContent || null);
        setTranslatedTitle(translatedTitle || null);

        if (!translate_language_set && extraComment) {
          setTranslateMessage(extraComment);
        } else {
          setTranslateMessage(null);
        }

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

  useEffect(() => {
    if (!postId) {
      setPost(null);
      return;
    }

    const fetchPost = async () => {
      setLoading(true);
      try {
        const postData = await getPostById(Number(postId));
        if (postData) {
          setPost(postData);
          setIsLiked(postData.isLikedByCurrentUser);
          setLikeCount(postData.likeCount);
        }
      } catch (error) {
        console.error('Error fetching post details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [postId]);

  // Watch for postIdProp changes
  useEffect(() => {
    if (postIdProp === null) {
      setPost(null);
    }
  }, [postIdProp]);

  const handleClose = useCallback(() => {
    if (scrollPositionRef) {
      scrollPositionRef.current = window.scrollY;
    }
    // If opened via prop (hub page with prop), call onClose callback if provided
    if (isPropBased) {
      if (onClose) {
        onClose();
      }
      // Clear the post data to show empty state
      setPost(null);
      return;
    }
    
    // If opened via URL params, navigate back without the id/shareId param
    // Check if we're on a hub page or posts page
    if (window.location.pathname.startsWith('/hub/')) {
      // On hub page, remove the id param but stay on the same hub
      const currentPath = window.location.pathname;
      router.push(currentPath, { scroll: false });
    } else {
      // On posts page or other pages, navigate to /posts
      router.push('/posts', { scroll: false });
    }
  }, [router, scrollPositionRef, isPropBased, onClose]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && postId) {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [postId, handleClose]);

  if (!postId || !post) return null;

  const handleLike = async () => {
    if (likeLoading) return;
    if (!userAuth) {
      router.push('/login');
      return;
    }
    setLikeLoading(true);

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

  const handleExtraOptionsToggle = () => {
    setExtraMenuOpen(prev => !prev);
  };

  const handleReportPost = () => {
    setExtraMenuOpen(false);
    if (!userAuth) {
      router.push('/login');
      return;
    }
    openReportModal({
      type: REPORT_TYPE.POST,
      targetId: post.postId,
      targetName: post.title || `Post #${post.postId}`,
    });
  };

  const renderLeftPanel = () => {
    switch (post.postType) {
      case 'IMAGE':
        return (
          <div className='post-details-media'>
            {post.mediaUrls && post.mediaUrls.length > 0 && (
              post.mediaUrls.length === 1 ? (
                <img
                  src={post.mediaUrls[0]}
                  alt={post.title || 'Post image'}
                  onError={(e) => {
                    e.target.src = '/placeholder-image.png';
                  }}
                />
              ) : (
                <div className='post-details-carousel'>
                  <button 
                    className='carousel-btn carousel-prev' 
                    onClick={() => setCurrentImageIndex(prev => 
                      prev === 0 ? post.mediaUrls.length - 1 : prev - 1
                    )}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                  </button>
                  
                  <div className='carousel-image-container'>
                    <img
                      src={post.mediaUrls[currentImageIndex]}
                      alt={`${post.title || 'Post'} - Image ${currentImageIndex + 1}`}
                      onError={(e) => {
                        e.target.src = '/placeholder-image.png';
                      }}
                    />
                  </div>

                  <button 
                    className='carousel-btn carousel-next' 
                    onClick={() => setCurrentImageIndex(prev => 
                      prev === post.mediaUrls.length - 1 ? 0 : prev + 1
                    )}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>

                  <div className='carousel-indicators'>
                    {post.mediaUrls.map((_, index) => (
                      <button
                        key={index}
                        className={`indicator-dot ${index === currentImageIndex ? 'active' : ''}`}
                        onClick={() => setCurrentImageIndex(index)}
                      />
                    ))}
                  </div>
                </div>
              )
            )}
          </div>
        );
      case 'VIDEO':
        return (
          <div className='post-details-media'>
            {post.mediaUrls && post.mediaUrls.length > 0 && (
              <video controls>
                <source src={post.mediaUrls[0]} type='video/mp4' />
                Your browser does not support the video tag.
              </video>
            )}
          </div>
        );
      case 'POLL':
        return <PollDisplay post={post} />;
      case 'TEXT':
      default:
        return (
          <div className='post-details-media post-details-text-only'>
            <RetroWindow
              windowWidth="100%"
              windowHeight="100%"
              windowColor="blue"
              windowTitle={`${(isTranslated ? translatedTitle : post.content) ? (isTranslated ? translatedTitle : post.title) : 'Post Title'}`}
              windowContent={(
                <div className='text-only-content'>
                  {(isTranslated ? translatedContent : post.content) && (
                    <>
                      <p
                        ref={contentRef}
                        className={`post-details-text ${!isContentExpanded && needsSeeMore ? 'collapsed' : ''}`}
                        style={{ padding: '0 0 12px' }}
                      >
                        {isTranslated ? translatedContent : post.content}
                      </p>
                      {needsSeeMore && (
                        <button
                          className='post-details-see-more-btn'
                          onClick={handleToggleContent}
                          style={{ padding: '4px 0 12px' }}
                        >
                          {isContentExpanded ? 'Show less' : 'See more...'}
                        </button>
                      )}
                    </>
                  )}
                  {showSummary && summaryContent && (
                    <div className='summary-section' style={{ margin: '0 0 12px' }}>
                      <div className='summary-header'>
                        <h4 className='summary-title'>AI Summary</h4>
                        <button 
                          className='summary-close-btn' 
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowSummary(false);
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
              )}
            />
          </div>
        );
    }
  };

  return (
    <div className='post-details-overlay' onClick={handleClose}>
      <div className='post-details-container' onClick={(e) => e.stopPropagation()}>
        <button className='post-details-close' onClick={handleClose}>
          <Close />
        </button>

        <div className='post-details-content'>
          {/* Left Panel - Media */}
          <div className='post-details-left'>
            {loading ? (
              <div className='post-details-loading'>Loading...</div>
            ) : (
              renderLeftPanel()
            )}
          </div>

          {/* Right Panel - Post Info + Comments */}
          <div className='post-details-right'>
            {loading ? (
              <div className='post-details-loading'>Loading...</div>
            ) : (
              <>
                {/* Post Header */}
                <div className='post-details-header'>
                  <div className='post-details-author-info'>
                    <img
                      className='post-details-avatar'
                      src={post.authorAvatarUrl || '/profile-pic-undefined.jpg'}
                      alt={post.authorDisplayName}
                      onError={(e) => {
                        e.target.src = '/profile-pic-undefined.jpg';
                      }}
                    />
                    <div className='post-details-author-details'>
                      <span className='fanhub-name'>h/{post.fanHubName}</span>
                      <span className='post-time'>{formatTimeAgo(post.createdAt)}</span>
                    </div>
                  </div>
                  <div className='post-details-actions-menu'>
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
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Post Content */}
                {post.postType === 'IMAGE' || post.postType === 'VIDEO' ? (
                  <>
                    {(isTranslated ? translatedTitle : post.title) && (
                      <h3 className='post-details-title'>
                        {isTranslated ? translatedTitle : post.title}
                      </h3>
                    )}
                    {(isTranslated ? translatedContent : post.content) && (
                      <>
                        <p
                          ref={contentRef}
                          className={`post-details-text ${!isContentExpanded && needsSeeMore ? 'collapsed' : ''}`}
                        >
                          {isTranslated ? translatedContent : post.content}
                        </p>
                        {needsSeeMore && (
                          <button
                            className='post-details-see-more-btn'
                            onClick={handleToggleContent}
                          >
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
                              setShowSummary(false);
                            }}
                            title='Close summary'
                          >
                            <Close fontSize='small' />
                          </button>
                        </div>
                        <p className='summary-content'>{summaryContent}</p>
                      </div>
                    )}
                  </>
                ) : null}

                {/* Like/Comment/Share */}
                <div className='post-details-footer'>
                  <div className='post-details-footer-left'>
                    <button className={`action-btn like-btn ${isLiked ? 'liked' : ''}`} onClick={handleLike} disabled={likeLoading}
                      title={`${isLiked ? 'unlike' : 'like'}`}>
                      {likeLoading ? (
                        <span className='like-loading-spinner' />
                      ) : isLiked ? (
                        <Favorite fontSize='small' />
                      ) : (
                        <FavoriteBorder fontSize='small' />
                      )}
                      <span className='action-count'>{formatCount(likeCount)}</span>
                    </button>
                    <button className='action-btn share-btn'>
                      <ShareRounded fontSize='small' />
                      <span>Share</span>
                    </button>
                  </div>
                </div>

                {/* Divider */}
                <div className='post-details-divider' />

                {/* Comment Section */}
                <CommentSection
                  postId={post.postId}
                  userAuth={userAuth}
                  router={router}
                  commentCount={post.commentCount || 0}
                  fanHubId={post.fanHubId}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PollDisplay({ post }) {
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
    <div className='post-details-poll-wrapper'>
      {post.title && <h3 className='poll-display-title'>{post.title}</h3>}
      {post.content && <p className='poll-display-content'>{post.content}</p>}
      <div className='poll-display poll-display-details'>
        <div className='poll-options-list'>
          {post.voteOptions?.map((option) => {
            const isObject = typeof option === 'object' && option !== null;
            const optionId = isObject ? option.id : option;
            const optionText = isObject ? option.optionText : option;
            
            const percentage = getVotePercentage(optionId);
            const isSelected = selectedOption === optionId;
            const hasVoted = selectedOption !== null;

            return (
              <div
                key={optionId}
                className={`poll-option-item ${isSelected ? 'selected' : ''} ${voting ? 'voting' : ''}`}
                onClick={() => handleOptionClick(optionId)}
              >
                {hasVoted && (
                  <div 
                    className='poll-option-bar' 
                    style={{ width: `${percentage}%` }}
                  />
                )}
                <div className='poll-option-content'>
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
              <span>{totalVotes} vote{totalVotes !== 1 ? 's' : ''}</span>
              <button 
                className='poll-unvote-btn' 
                onClick={handleUnvote}
                disabled={voting}
              >
                {voting ? 'Removing...' : 'Unselect option'}
              </button>
            </div>
          </>
        )}
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

function formatCount(count) {
  if (count === null || count === undefined) return '0';
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
}
