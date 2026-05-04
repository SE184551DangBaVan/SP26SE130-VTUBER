'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getPostById, likePost, unlikePost, votePoll, unVotePoll, getTranslatePost, getPostSummary, userDeleteOwnPost } from '@/services/PostController';
import { checkIsMember } from '@/services/FanHubController';
import { showSteamSuccess, showSteamError } from '@/utils/SteamNotification';
import { useAuth } from '@/functions/Auth/useAuth';
import { useReportModal, REPORT_TYPE } from '@/components/ReportModal';
import { BASE_URL } from '@/config';
import CommentSection from './CommentSection';
import UserAvatar from '@/components/UserAvatar/UserAvatar';
import styles from './PostDetails.module.css';
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
  DeleteOutline,
} from '@mui/icons-material';
import RetroWindow from '@/components/RetroWindow/RetroWindow';

const MAX_NEST_DEPTH = 5;

export default function PostDetails({ scrollPositionRef, postIdProp, onClose }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { userAuth, points, setPoints } = useAuth();
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
  
  // Delete state
  const [isDeleted, setIsDeleted] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
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
      const hashtag = searchParams.get('hashtag');
      router.push(hashtag ? `/posts?hashtag=${encodeURIComponent(hashtag)}` : '/posts', { scroll: false });
    }
  }, [router, scrollPositionRef, isPropBased, onClose, searchParams]);

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

  const handleShare = (e) => {
    e?.stopPropagation();
    const shareUrl = `${BASE_URL}/posts?shareId=${post.postId}`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        showSteamSuccess('Link copied!', 'Shared');
      }).catch(() => {
        showSteamError('Failed to copy link', 'Error');
      });
    } else {
      try {
        const textArea = document.createElement('textarea');
        textArea.value = shareUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showSteamSuccess('Link copied!', 'Shared');
      } catch (err) {
        showSteamError('Failed to copy link', 'Error');
      }
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

  const renderLeftPanel = () => {
    switch (post.postType) {
      case 'IMAGE':
        return (
          <div className={styles.postDetailsMedia}>
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
                <div className={styles.postDetailsCarousel}>
                  <button 
                    className={`${styles.carouselBtn} ${styles.carouselPrev}`} 
                    onClick={() => setCurrentImageIndex(prev => 
                      prev === 0 ? post.mediaUrls.length - 1 : prev - 1
                    )}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                  </button>
                  
                  <div className={styles.carouselImageContainer}>
                    <img
                      src={post.mediaUrls[currentImageIndex]}
                      alt={`${post.title || 'Post'} - Image ${currentImageIndex + 1}`}
                      onError={(e) => {
                        e.target.src = '/placeholder-image.png';
                      }}
                    />
                  </div>

                  <button 
                    className={`${styles.carouselBtn} ${styles.carouselNext}`} 
                    onClick={() => setCurrentImageIndex(prev => 
                      prev === post.mediaUrls.length - 1 ? 0 : prev + 1
                    )}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>

                  <div className={styles.carouselIndicators}>
                    {post.mediaUrls.map((_, index) => (
                      <button
                        key={index}
                        className={`${styles.indicatorDot} ${index === currentImageIndex ? styles.active : ''}`}
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
          <div className={styles.postDetailsMedia}>
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
          <div className={`${styles.postDetailsMedia} ${styles.postDetailsTextOnly}`}>
            <RetroWindow
              windowWidth="100%"
              windowHeight="100%"
              windowColor="blue"
              windowTitle={`${(isTranslated ? translatedTitle : post.content) ? (isTranslated ? translatedTitle : post.title) : 'Post Title'}`}
              windowContent={(
                <div className={styles.textOnlyContent}>
                  {(isTranslated ? translatedContent : post.content) && (
                    <>
                      <p
                        ref={contentRef}
                        className={`${styles.postDetailsText} ${!isContentExpanded && needsSeeMore ? styles.collapsed : ''}`}
                        style={{ padding: '0 0 12px' }}
                      >
                        {isTranslated ? translatedContent : post.content}
                      </p>
                      {needsSeeMore && (
                        <button
                          className={styles.postDetailsSeeMoreBtn}
                          onClick={handleToggleContent}
                          style={{ padding: '4px 0 12px' }}
                        >
                          {isContentExpanded ? 'Show less' : 'See more...'}
                        </button>
                      )}
                    </>
                  )}
                  {showSummary && summaryContent && (
                    <div className={styles.summarySection} style={{ margin: '0 0 12px' }}>
                      <div className={styles.summaryHeader}>
                        <h4 className={styles.summaryTitle}>AI Summary</h4>
                        <button 
                          className={styles.summaryCloseBtn} 
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowSummary(false);
                          }}
                          title='Close summary'
                        >
                          <Close fontSize='small' />
                        </button>
                      </div>
                      <p className={styles.summaryContent}>{summaryContent}</p>
                    </div>
                  )}
                  {post.hashtags && post.hashtags.length > 0 && (
                    <div className={styles.postHashtags}>
                      {post.hashtags.map((tag, idx) => (
                        <span key={idx} className={styles.hashtag}>#{tag}</span>
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
    <div className={styles.postDetailsOverlay} onClick={handleClose}>
      <div className={styles.postDetailsContainer} onClick={(e) => e.stopPropagation()}>
        <button className={styles.postViewClose} onClick={handleClose}>
          <Close />
        </button>

        {isDeleted ? (
          <div className={styles.postDeletedView}>
            <DeleteOutline style={{ fontSize: 64, color: '#ff4d4f', marginBottom: 16 }} />
            <h2 className={styles.postDeletedTitle}>Post has been deleted</h2>
            <p className={styles.postDeletedText}>You have successfully deleted your post.</p>
            <button className={styles.postDeletedBackBtn} onClick={handleClose}>
              Go Back
            </button>
          </div>
        ) : (
          <div className={styles.postDetailsContent}>
            {/* Left Panel - Media */}
            <div className={styles.postDetailsLeft}>
              {loading ? (
                <div className={styles.postDetailsLoading}>Loading...</div>
              ) : (
                renderLeftPanel()
              )}
            </div>

            {/* Right Panel - Post Info + Comments */}
            <div className={styles.postDetailsRight}>
              {loading ? (
                <div className={styles.postDetailsLoading}>Loading...</div>
              ) : (
                <>
                  {/* Post Header */}
                  <div className={styles.postViewHeader}>
                    <div className={styles.postViewAuthorInfo}>
                      <UserAvatar
                        className={styles.postViewAvatar}
                        avatarUrl={post.authorAvatarUrl}
                        avatarFrame={post.authorFrameUrl}
                        frameSize={post.authorFrameSize}
                        frameX={post.authorFrameXAxis}
                        frameY={post.authorFrameYAxis}
                        size="small"
                      />
                      <div className={styles.postViewAuthorDetails}>
                        <span className={styles.fanhubName}>h/{post.fanHubName}</span>
                        <span className={styles.postTime}>{formatTimeAgo(post.createdAt)}</span>
                      </div>
                    </div>
                    <div className={styles.postViewActionsMenu}>
                      <button 
                        className={styles.menuBtn} 
                        onClick={handleAISummary} 
                        title={showSummary ? 'Hide Summary' : 'AI Summary'}
                        disabled={summaryLoading}
                      >
                        {summaryLoading ? (
                          <span className={styles.summaryLoadingSpinner} />
                        ) : (
                          <AutoAwesome fontSize='small' />
                        )}
                      </button>
                      <button 
                        className={styles.menuBtn} 
                        onClick={handleAITranslate} 
                        title={isTranslated ? 'Show Original' : 'AI Translate'}
                        disabled={translateLoading}
                      >
                        {translateLoading ? (
                          <span className={styles.translateLoadingSpinner} />
                        ) : isTranslated ? (
                          <SwapHoriz fontSize='small' />
                        ) : (
                          <Translate fontSize='small' />
                        )}
                      </button>
                      <div className={styles.extraMenuWrapper} ref={menuRef}>
                        <button className={styles.menuBtn} onClick={handleExtraOptionsToggle} title='More options'>
                          <MoreHoriz fontSize='small' />
                        </button>
                        {extraMenuOpen && (
                          <div className={styles.extraDropdown}>
                            <button className={styles.dropdownItem} onClick={handleReportPost}>
                              <Flag fontSize='small' />
                              <span>Report post</span>
                            </button>
                            {userAuth?.userId === post.authorId && (
                              <button className={`${styles.dropdownItem} ${styles.deleteOption}`} onClick={() => {
                                setExtraMenuOpen(false);
                                setShowDeleteConfirm(true);
                              }}>
                                <DeleteOutline fontSize='small' />
                                <span>Delete post</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Post Content */}
                  {post.postType === 'IMAGE' || post.postType === 'VIDEO' ? (
                    <>
                      {(isTranslated ? translatedTitle : post.title) && (
                        <h3 className={styles.postDetailsTitle}>
                          {isTranslated ? translatedTitle : post.title}
                        </h3>
                      )}
                      {(isTranslated ? translatedContent : post.content) && (
                        <>
                          <p
                            ref={contentRef}
                            className={`${styles.postDetailsText} ${!isContentExpanded && needsSeeMore ? styles.collapsed : ''}`}
                          >
                            {isTranslated ? translatedContent : post.content}
                          </p>
                          {needsSeeMore && (
                            <button
                              className={styles.postDetailsSeeMoreBtn}
                              onClick={handleToggleContent}
                            >
                              {isContentExpanded ? 'Show less' : 'See more...'}
                            </button>
                          )}
                        </>
                      )}
                      {showSummary && summaryContent && (
                        <div className={styles.summarySection}>
                          <div className={styles.summaryHeader}>
                            <h4 className={styles.summaryTitle}>AI Summary</h4>
                            <button 
                              className={styles.summaryCloseBtn} 
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowSummary(false);
                              }}
                              title='Close summary'
                            >
                              <Close fontSize='small' />
                            </button>
                          </div>
                          <p className={styles.summaryContent}>{summaryContent}</p>
                        </div>
                      )}
                    </>
                  ) : null}

                  {/* Like/Comment/Share */}
                  <div className={styles.postDetailsFooter}>
                    <div className={styles.postDetailsFooterLeft}>
                      <button className={`${styles.actionBtn} ${styles.likeBtn} ${isLiked ? styles.liked : ''}`} onClick={handleLike} disabled={likeLoading}
                        title={`${isLiked ? 'unlike' : 'like'}`}>
                        {likeLoading ? (
                          <span className={styles.likeLoadingSpinner} />
                        ) : isLiked ? (
                          <Favorite fontSize='small' />
                        ) : (
                          <FavoriteBorder fontSize='small' />
                        )}
                        <span className={styles.actionCount}>{formatCount(likeCount)}</span>
                      </button>
                      <button className={`${styles.actionBtn} ${styles.shareBtn}`} onClick={handleShare}>
                        <ShareRounded fontSize='small' />
                        <span>Share</span>
                      </button>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className={styles.postDetailsDivider} />

                  {/* Comment Section */}
                  <CommentSection
                    postId={post.postId}
                    router={router}
                    commentCount={post.commentCount || 0}
                    fanHubId={post.fanHubId}
                  />
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className={styles.pinConfirmOverlay} onClick={(e) => e.stopPropagation()}>
          <div className={`${styles.pinConfirmDialog} ${styles.deleteConfirmDialog}`}>
            <div className={`${styles.pinConfirmIcon} ${styles.deleteIconBg}`}>
              <DeleteOutline fontSize='large' />
            </div>
            <h4 className={styles.pinConfirmTitle}>Delete this post?</h4>
            <p className={styles.pinConfirmText}>
              Are you sure you want to delete your post? This action cannot be undone.
            </p>
            <div className={styles.pinConfirmActions}>
              <button
                className={`${styles.pinConfirmBtn} ${styles.pinConfirmCancel}`}
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button
                className={`${styles.pinConfirmBtn} ${styles.pinConfirmUnpin}`}
                onClick={handleDeletePost}
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
    <div className={styles.postDetailsPollWrapper}>
      {post.title && <h3 className={styles.pollDisplayTitle}>{post.title}</h3>}
      {post.content && <p className={styles.pollDisplayContent}>{post.content}</p>}
      <div className={`${styles.pollDisplay} ${styles.pollDisplayDetails}`}>
        <div className={styles.pollOptionsList}>
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
                className={`${styles.pollOptionItem} ${isSelected ? styles.selected : ''} ${voting ? styles.voting : ''}`}
                onClick={() => handleOptionClick(optionId)}
              >
                {hasVoted && (
                  <div 
                    className={styles.pollOptionBar} 
                    style={{ width: `${percentage}%` }}
                  />
                )}
                <div className={styles.pollOptionContent}>
                  <div className={styles.pollOptionTextWrapper}>
                    <span className={styles.pollOptionText}>{optionText}</span>
                    {hasVoted && (
                      <span className={styles.pollOptionPercentage}>{percentage}%</span>
                    )}
                    {!hasVoted && (
                      <span className={styles.pollOptionIcon}>○</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {selectedOption && (
          <>
            <div className={styles.pollTotalVotes}>
              <span>{totalVotes} vote{totalVotes !== 1 ? 's' : ''}</span>
              <button 
                className={styles.pollUnvoteBtn} 
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
