'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getPostById } from '@/services/PostController';
import { likePost, unlikePost } from '@/services/PostController';
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
} from '@mui/icons-material';

const MAX_NEST_DEPTH = 5;

export default function PostDetails({ scrollPositionRef }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { userAuth } = useAuth();
  const { openReportModal } = useReportModal();
  const postId = searchParams.get('id') || searchParams.get('shareId');
  const isShared = !!searchParams.get('shareId');

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [likeLoading, setLikeLoading] = useState(false);
  const [extraMenuOpen, setExtraMenuOpen] = useState(false);
  const menuRef = useRef();

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

  const handleClose = useCallback(() => {
    if (scrollPositionRef) {
      scrollPositionRef.current = window.scrollY;
    }
    router.push('/posts', { scroll: false });
  }, [router, scrollPositionRef]);

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

  const handleAISummary = () => {
    console.log('AI Summary clicked for post:', post.postId);
  };

  const handleAITranslate = () => {
    console.log('AI Translate clicked for post:', post.postId);
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
              <img
                src={post.mediaUrls[0]}
                alt={post.title || 'Post image'}
                onError={(e) => {
                  e.target.src = '/placeholder-image.png';
                }}
              />
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
            <div className='text-only-content'>
              {post.title && <h2>{post.title}</h2>}
              {post.content && <p>{post.content}</p>}
              {post.hashtags && post.hashtags.length > 0 && (
                <div className='post-hashtags'>
                  {post.hashtags.map((tag, idx) => (
                    <span key={idx} className='hashtag'>#{tag}</span>
                  ))}
                </div>
              )}
            </div>
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

                {/* Post Content */}
                {post.postType === 'IMAGE' || post.postType === 'VIDEO' ? (
                  <>
                    {post.title && <h3 className='post-details-title'>{post.title}</h3>}
                    {post.content && <p className='post-details-text'>{post.content}</p>}
                  </>
                ) : null}

                {/* Like/Comment/Share */}
                <div className='post-details-footer'>
                  <div className='post-details-footer-left'>
                    <button className={`action-btn like-btn ${isLiked ? 'liked' : ''}`} onClick={handleLike} disabled={likeLoading}>
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
                <CommentSection postId={post.postId} userAuth={userAuth} router={router} />
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
  const totalVotes = post.totalVotes || 0;

  const handleOptionClick = (optionIndex) => {
    setSelectedOption(optionIndex + 1);
    console.log('Poll option clicked:', optionIndex);
  };

  const getVotePercentage = (optionIndex) => {
    if (totalVotes === 0) return 0;
    const votes = post.voteCounts?.[optionIndex + 1] || 0;
    return Math.round((votes / totalVotes) * 100);
  };

  return (
    <div className='post-details-media post-details-poll'>
      <div className='poll-display'>
        {post.title && <h3 className='poll-title'>{post.title}</h3>}
        {post.content && <p className='poll-content'>{post.content}</p>}
        {post.voteOptions && (
          <div className='poll-options'>
            {post.voteOptions.map((option, index) => {
              const percentage = getVotePercentage(index);
              const isSelected = selectedOption === index + 1;

              return (
                <div
                  key={index}
                  className={`poll-option ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleOptionClick(index)}
                >
                  <div className='poll-option-background'>
                    {selectedOption && (
                      <div
                        className='poll-option-fill'
                        style={{ width: `${percentage}%` }}
                      />
                    )}
                  </div>
                  <div className='poll-option-content'>
                    <span className='poll-option-text'>{option}</span>
                    {selectedOption && (
                      <span className='poll-option-percentage'>{percentage}%</span>
                    )}
                  </div>
                </div>
              );
            })}
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
