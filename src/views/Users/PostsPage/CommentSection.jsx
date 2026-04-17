'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  getComments,
  getCommentReplies,
  sendComment,
  likeComment,
  unlikeComment,
  giftComment,
} from '@/services/CommentController';
import { COMMENT_GIFTING_COST } from '@/constants/giftingConstants';
import { checkIsMember } from '@/services/FanHubController';
import { joinFanHub } from '@/services/MemberController';
import { showSteamSuccess, showSteamError } from '@/utils/SteamNotification';
import { useAuth } from '@/functions/Auth/useAuth';
import { useReportModal, REPORT_TYPE } from '@/components/ReportModal';
import { Favorite, FavoriteBorder, Reply, ChatBubbleOutline, MoreHoriz, Flag, LocalFlorist } from '@mui/icons-material';

const COMMENTS_PER_LOAD = 7;
const REPLIES_PER_LOAD = 5;
const MAX_NEST_DEPTH = 5;

export default function CommentSection({ postId, router, commentCount, fanHubId }) {
  const localRouter = useRouter();
  const navRouter = router || localRouter;
  const { userAuth, points, setPoints } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [isHubMember, setIsHubMember] = useState(false);
  const [checkingMembership, setCheckingMembership] = useState(false);
  const [joiningHub, setJoiningHub] = useState(false);

  // Check hub membership when fanHubId is provided
  useEffect(() => {
    const checkMembership = async () => {
      if (!fanHubId || !userAuth) {
        setIsHubMember(false);
        return;
      }

      setCheckingMembership(true);
      try {
        const memberData = await checkIsMember(fanHubId);
        setIsHubMember(memberData?.isMember || false);
      } catch (error) {
        console.error('Error checking hub membership:', error);
        setIsHubMember(false);
      } finally {
        setCheckingMembership(false);
      }
    };

    checkMembership();
  }, [fanHubId, userAuth]);

  // Handle joining the hub
  const handleJoinHub = async () => {
    if (!userAuth || !fanHubId) return;

    setJoiningHub(true);
    try {
      const result = await joinFanHub(fanHubId);
      if (result?.success) {
        showSteamSuccess('Joined hub successfully! You can now comment.', 'Success');
        setIsHubMember(true);
      } else {
        showSteamError(result?.message || 'Failed to join hub', 'Error');
      }
    } catch (error) {
      console.error('Error joining hub:', error);
      showSteamError('Failed to join hub. Please try again.', 'Error');
    } finally {
      setJoiningHub(false);
    }
  };

  // Get current user avatar from localStorage or a default
  useEffect(() => {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        setCurrentUser(JSON.parse(userData));
      }
    } catch (e) {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!postId) return;
    setComments([]);
    setOffset(0);
    setHasMore(true);
    fetchComments(0);
  }, [postId]);

  const fetchComments = useCallback(
    async (currentOffset) => {
      setLoading(true);
      try {
        const { comments: newComments, hasMore: more } = await getComments(
          postId,
          currentOffset,
          COMMENTS_PER_LOAD
        );
        setComments(prev => currentOffset === 0 ? newComments : [...prev, ...newComments]);
        setHasMore(more);
        setOffset(currentOffset + newComments.length);
      } catch (error) {
        console.error('Error fetching comments:', error);
      } finally {
        setLoading(false);
      }
    },
    [postId]
  );

  const handleLoadMore = () => {
    fetchComments(offset);
  };

  const handleSendComment = async (parentCommentId = null) => {
    if (!userAuth) {
      navRouter.push('/login');
      return;
    }

    if (fanHubId && !isHubMember && !checkingMembership) {
      showSteamError('Only hub members can comment on posts from this hub.', 'Access Denied');
      return;
    }

    const text = parentCommentId ? replyText : commentText;
    if (!text.trim()) return;

    try {
      const result = await sendComment(postId, text.trim(), parentCommentId);
      if (result?.success) {
        showSteamSuccess('Comment posted!', 'Success');

        if (parentCommentId) {
          // If replying to a comment, we need to refresh that comment's replies
          // For simplicity, re-fetch all comments
          setOffset(0);
          setHasMore(true);
          fetchComments(0);
          setReplyingTo(null);
          setReplyText('');
        } else {
          // Reset and re-fetch
          setCommentText('');
          setOffset(0);
          setHasMore(true);
          fetchComments(0);
        }
      }
    } catch (error) {
      console.error('Error sending comment:', error);
      showSteamError(error?.response?.data?.message || 'Failed to post comment', 'Error');
    }
  };

  const toggleCommentLike = (commentList, commentId, currentLiked) => {
    return commentList.map(c => {
      if (c.commentId === commentId) {
        return {
          ...c,
          isLikedByCurrentUser: !currentLiked,
          likeCount: currentLiked ? (c.likeCount || 0) - 1 : (c.likeCount || 0) + 1,
        };
      }
      if (c.replies && c.replies.length > 0) {
        return { ...c, replies: toggleCommentLike(c.replies, commentId, currentLiked) };
      }
      return c;
    });
  };

  const handleLikeComment = async (commentId, currentLiked) => {
    if (!userAuth) {
      navRouter.push('/login');
      return;
    }

    // Optimistic update
    setComments(prev => toggleCommentLike(prev, commentId, currentLiked));

    try {
      if (currentLiked) {
        await unlikeComment(commentId);
      } else {
        await likeComment(commentId);
      }
      // Refresh to sync with server
      setOffset(0);
      setHasMore(true);
      fetchComments(0);
    } catch (error) {
      console.error('Error liking comment:', error);
      // Revert on error
      setComments(prev => toggleCommentLike(prev, commentId, !currentLiked));
    }
  };

  const handleGiftComment = async (commentId, authorId) => {
    if (!userAuth) {
      navRouter.push('/login');
      return;
    }

    // Prevent self-gifting
      console.log("gifting comment id:" + commentId)
      console.log("author id: " + authorId);
    console.log("curernt logged in uesr id: " + userAuth.userId);
    if (userAuth.userId === authorId) {
      showSteamError("You cannot gift yourself", "Warning");
      return;
    }

    if (points < COMMENT_GIFTING_COST) {
      showSteamError(`You need at least ${COMMENT_GIFTING_COST} points to send a rose.`, 'Insufficient Points');
      return;
    }

    try {
      const result = await giftComment(commentId);
      if (result?.success) {
        setPoints(prev => (prev || 0) - COMMENT_GIFTING_COST);
        showSteamSuccess(result.data || 'Rose sent successfully!', 'Success');
        // Refresh to update gift counts
        setOffset(0);
        setHasMore(true);
        fetchComments(0);
      } else {
        showSteamError(result?.message || 'Failed to send rose', 'Error');
      }
    } catch (error) {
      console.error('Gifting error:', error);
      showSteamError(
        error?.response?.data?.message || 'Failed to send rose',
        'Error'
      );
    }
  };

  const handleReplyClick = (commentId) => {
    setReplyingTo(replyingTo === commentId ? null : commentId);
    setReplyText('');
  };

  const handleAuthorClick = (username) => {
    navRouter.push(`/user/${username}`);
  };

  return (
    <div className='comment-section'>
      <div className='comment-section-header'>
        {commentCount > 0 ? `${commentCount} Comment${commentCount > 1 ? 's' : ''}` : 'Comments'}
      </div>

      <div className='comments-list'>
        {comments.length === 0 && !loading ? (
          <div className='no-comments'>
            <ChatBubbleOutline />
            <p>No comments yet</p>
            <p className='subtitle'>Be the first to comment.</p>
          </div>
        ) : (
          <>
            {comments.map(comment => (
              <CommentItem
                key={comment.commentId}
                comment={comment}
                depth={0}
                onLike={handleLikeComment}
                onReply={handleReplyClick}
                onGift={handleGiftComment}
                replyingTo={replyingTo}
                replyText={replyText}
                setReplyText={setReplyText}
                onSendReply={() => handleSendComment(comment.commentId)}
                onAuthorClick={handleAuthorClick}
                refreshComments={() => {
                  setOffset(0);
                  setHasMore(true);
                  fetchComments(0);
                }}
                userAuth={userAuth}
                navRouter={navRouter}
              />
            ))}
            {hasMore && (
              <button className='load-more-comments' onClick={handleLoadMore} disabled={loading}>
                {loading ? 'Loading...' : 'Load more comments'}
              </button>
            )}
          </>
        )}
      </div>

      <div className='comment-input-container'>
        <div className='comment-input-wrapper'>
          {(fanHubId && isHubMember && !checkingMembership) && 
          <img
            className='comment-input-avatar'
            src={currentUser?.avatarUrl || '/profile-pic-undefined.jpg'}
            alt='Your avatar'
            onError={(e) => {
              e.target.src = '/profile-pic-undefined.jpg';
            }}
          />}
          <div className='comment-input-box'>
            {fanHubId && !isHubMember && !checkingMembership ? (
              <div className='comment-membership-required'>
                <p>You must be a member of this hub to comment.</p>
                <button 
                  className='join-hub-btn' 
                  onClick={handleJoinHub}
                  disabled={joiningHub}
                >
                  {joiningHub ? 'Joining...' : 'Join Hub'}
                </button>
              </div>
            ) : (
              <>
                <textarea
                  className='comment-textarea'
                  placeholder='Write a comment...'
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendComment();
                    }
                  }}
                  rows={1}
                />
                {commentText.trim() && (
                  <div className='comment-input-actions'>
                    <button
                      className='comment-cancel-btn'
                      onClick={() => setCommentText('')}
                    >
                      Cancel
                    </button>
                    <button
                      className='comment-send-btn'
                      onClick={() => handleSendComment()}
                      disabled={!commentText.trim()}
                    >
                      Post
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CommentItem({
  comment,
  depth,
  onLike,
  onGift,
  onReply,
  replyingTo,
  replyText,
  setReplyText,
  onSendReply,
  onAuthorClick,
  refreshComments,
  userAuth,
  navRouter,
}) {
  const { openReportModal } = useReportModal();
  const [replies, setReplies] = useState([]);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [hasMoreReplies, setHasMoreReplies] = useState(comment.hasChildren);
  const [repliesOffset, setRepliesOffset] = useState(0);
  const [commentMenuOpen, setCommentMenuOpen] = useState(false);
  const [giftLoading, setGiftLoading] = useState(false);
  const commentMenuRef = useRef();
  const isReplying = replyingTo === comment.commentId;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (commentMenuRef.current && !commentMenuRef.current.contains(e.target)) {
        setCommentMenuOpen(false);
      }
    };
    if (commentMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [commentMenuOpen]);

  const handleCommentMenuToggle = () => {
    setCommentMenuOpen(prev => !prev);
  };

  const handleReportUser = () => {
    setCommentMenuOpen(false);
    if (!userAuth) {
      navRouter.push('/login');
      return;
    }
    openReportModal({
      type: REPORT_TYPE.MEMBER,
      targetId: comment.memberId,
      targetName: comment.displayName || comment.username,
      relatedCommentId: comment.commentId,
    });
  };

  const fetchReplies = useCallback(async () => {
    if (!comment.hasChildren) return;

    setLoadingReplies(true);
    try {
      const { replies: newReplies, hasMore: more } = await getCommentReplies(
        comment.commentId,
        replies.length,
        REPLIES_PER_LOAD
      );
      setReplies(prev => [...prev, ...newReplies]);
      setHasMoreReplies(more);
      setRepliesOffset(prev => prev + newReplies.length);
    } catch (error) {
      console.error('Error fetching replies:', error);
    } finally {
      setLoadingReplies(false);
    }
  }, [comment.commentId, comment.hasChildren, replies.length]);

  const handleViewReplies = () => {
    if (replies.length === 0) {
      fetchReplies();
    } else if (hasMoreReplies) {
      fetchReplies();
    } else {
      setReplies([]);
      setHasMoreReplies(comment.hasChildren);
      setRepliesOffset(0);
    }
  };

  return (
    <>
      <div className='comment-item' style={{ paddingLeft: depth > 0 ? `${depth * 24 + 16}px` : '16px' }}>
        <div className='comment-content'>
          <img
            className='comment-avatar'
            src={comment.avatarUrl || '/profile-pic-undefined.jpg'}
            alt={comment.displayName}
            onClick={() => onAuthorClick(comment.username)}
            onError={(e) => {
              e.target.src = '/profile-pic-undefined.jpg';
            }}
          />
          <div className='comment-body'>
            <div className='comment-header'>
              <span className='comment-author' onClick={() => onAuthorClick(comment.username)}>
                {comment.displayName}
              </span>
              <span className='comment-time'>{formatTimeAgo(comment.createdAt)}</span>
              <div className='comment-menu-wrapper' ref={commentMenuRef}>
                <button className='comment-menu-btn' onClick={handleCommentMenuToggle} title='More options'>
                  <MoreHoriz fontSize='small' />
                </button>
                {commentMenuOpen && (
                  <div className='comment-dropdown'>
                    <button className='dropdown-item' onClick={handleReportUser}>
                      <Flag fontSize='small' />
                      <span>Report user</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
            <p className='comment-text'>{comment.content}</p>
            <div className='comment-actions'>
              <button
                className={`comment-action-btn ${comment.isLikedByCurrentUser ? 'liked' : ''}`}
                onClick={() => onLike(comment.commentId, comment.isLikedByCurrentUser)}
                title={`${comment.isLikedByCurrentUser ? 'unlike' : 'like'}`}
              >
                {comment.isLikedByCurrentUser ? (
                  <Favorite fontSize='small' />
                ) : (
                  <FavoriteBorder fontSize='small' />
                )}
                <span>{comment.likeCount || 0}</span>
              </button>

              <button
                className={`comment-action-btn gift-btn`}
                onClick={async () => {
                  if (giftLoading) return;
                  setGiftLoading(true);
                  await onGift(comment.commentId, comment.userId);
                  setGiftLoading(false);
                }}
                disabled={giftLoading}
                title={`Send a rose (${COMMENT_GIFTING_COST} points)`}
              >
                {giftLoading ? (
                  <div className="gift-loading-spinner-small" />
                ) : (
                  <LocalFlorist fontSize='small' style={{ color: '#e91e63' }} />
                )}
                <span>{comment.giftCount || 0}</span>
              </button>

              {depth < MAX_NEST_DEPTH && (
                <button
                  className='comment-action-btn'
                  onClick={() => onReply(comment.commentId)}
                >
                  <Reply fontSize='small' />
                  <span>Reply</span>
                </button>
              )}
            </div>

            {isReplying && depth < MAX_NEST_DEPTH && (
              <div className='comment-reply-input' style={{ marginTop: 8 }}>
                <div className='comment-input-wrapper'>
                  <div className='comment-input-box'>
                    <textarea
                      className='comment-textarea'
                      placeholder='Write a reply...'
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          onSendReply();
                        }
                      }}
                      rows={1}
                    />
                    {replyText.trim() && (
                      <div className='comment-input-actions'>
                        <button
                          className='comment-cancel-btn'
                          onClick={() => onReply(null)}
                        >
                          Cancel
                        </button>
                        <button
                          className='comment-send-btn'
                          onClick={onSendReply}
                          disabled={!replyText.trim()}
                        >
                          Reply
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {replies.length > 0 && (
        <div className='comment-replies'>
          {replies.map(reply => (
            <CommentItem
              key={reply.commentId}
              comment={reply}
              depth={depth + 1}
              onLike={onLike}
              onReply={onReply}
              onGift={onGift}
              replyingTo={replyingTo}
              replyText={replyText}
              setReplyText={setReplyText}
              onSendReply={onSendReply}
              onAuthorClick={onAuthorClick}
              refreshComments={refreshComments}
              userAuth={userAuth}
              navRouter={navRouter}
            />
          ))}
        </div>
      )}

      {comment.hasChildren && (
        <button className='view-replies-btn' onClick={handleViewReplies}>
          {replies.length > 0 ? (
            <>Hide replies {loadingReplies && '...'}</>
          ) : (
            <>View replies {loadingReplies && '...'}</>
          )}
        </button>
      )}

      {loadingReplies && (
        <div style={{ padding: '4px 0 4px 48px', fontSize: 12, color: '#888' }}>Loading replies...</div>
      )}
    </>
  );
}

function formatTimeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;

  return date.toLocaleDateString();
}
