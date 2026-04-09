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

export default function PostCard({ post, onClick, onCommentsClick, onShareClick, onHubClick, userAuth: externalUserAuth, router: externalRouter }) {
  const router = externalRouter || useRouter();
  const { userAuth: contextUserAuth } = useAuth();
  const userAuth = externalUserAuth || contextUserAuth;
  const { openReportModal } = useReportModal();
  const [isLiked, setIsLiked] = useState(post.isLikedByCurrentUser);
  const [likeCount, setLikeCount] = useState(post.likeCount);
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

  const handleLike = async (e) => {
    e.stopPropagation();
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

  const handleAvatarClick = (e) => {
    e.stopPropagation();
    router.push(`/user/${post.authorUsername}`);
  };

  const renderPostTypeContent = () => {
    switch (post.postType) {
      case 'IMAGE':
        return <ImagePostContent post={post} onClick={onClick} />;
      case 'VIDEO':
        return <VideoPostContent post={post} onClick={onClick} />;
      case 'TEXT':
        return <TextPostContent post={post} onClick={onClick} />;
      case 'POLL':
        return <PollPostContent post={post} onClick={onClick} />;
      case 'ANNOUNCEMENT':
      case 'EVENT_SCHEDULE':
        return null;
      default:
        return <TextPostContent post={post} onClick={onClick} />;
    }
  };

  return (
    <div className='post-card' onClick={onClick}>
      <div className='post-header'>
        <div className='post-author-info'>
          <img
            className='post-author-avatar'
            src={post.authorAvatarUrl || '/profile-pic-undefined.jpg'}
            alt={post.authorDisplayName}
            title="Go to author profile"
            onClick={handleAvatarClick}
            onError={(e) => {
              e.target.src = '/profile-pic-undefined.jpg';
            }}
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

      {renderPostTypeContent()}

      <div className='post-footer'>
        <div className='post-footer-left'>
          <button className={`action-btn like-btn ${isLiked ? 'liked' : ''}`} onClick={handleLike} disabled={likeLoading}>
            {likeLoading ? (
              <span className='like-loading-spinner' />
            ) : (
              <svg className='like-icon' xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill={isLiked ? "white" : "none"}>
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill={isLiked ? "white" : "none"} stroke={isLiked ? "white" : "currentColor"} strokeWidth="2"/>
              </svg>
            )}
            <span className='action-count'>{formatCount(likeCount)}</span>
          </button>
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
    </div>
  );
}

function ImagePostContent({ post, onClick }) {
  return (
    <div className='post-content'>
      {post.title && <h3 className='post-title'>{post.title}</h3>}
      {post.content && <p className='post-text'>{post.content}</p>}
      {post.mediaUrls && post.mediaUrls.length > 0 && (
        <div className='post-media image-media'>
          <img
            src={post.mediaUrls[0]}
            alt={post.title || 'Post image'}
            onError={(e) => {
              e.target.src = '/placeholder-image.png';
            }}
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

function VideoPostContent({ post, onClick }) {
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

function TextPostContent({ post, onClick }) {
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

function PollPostContent({ post, onClick }) {
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

  const hasThumbnails = post.voteOptions?.some(opt => typeof opt === 'object' && opt.thumbnailUrl);

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
                    <div 
                      className='poll-option-bar' 
                      style={{ width: `${percentage}%` }}
                    />
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
