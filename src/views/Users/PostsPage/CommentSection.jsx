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
import UserAvatar from '@/components/UserAvatar/UserAvatar';
import styles from './CommentSection.module.css';

const COMMENTS_PER_LOAD = 7;
const REPLIES_PER_LOAD = 5;
const MAX_NEST_DEPTH = 5;

export default function CommentSection({ postId, router, commentCount, fanHubId }) {
  const localRouter = useRouter();
  const navRouter = router || localRouter;
  const { userAuth, points, setPoints, avatarUrl, avatarFrame } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
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
          setOffset(0);
          setHasMore(true);
          fetchComments(0);
          setReplyingTo(null);
          setReplyText('');
        } else {
          setCommentText('');
          setOffset(0);
          setHasMore(true);
          fetchComments(0);
        }
      }
    } catch (error) {
      console.error('Error sending comment:', error);
      const serverError = error.response?.data;
      
      let errorMessage = 'Failed to post comment';
      let errorTitle = 'Error';
      
      if (error.response?.status === 403) {
        errorTitle = 'Action Restricted';
        const details = serverError?.data || serverError?.message;
        
        if (details && (details.toLowerCase().includes('ban') || details.toLowerCase().includes('restrict'))) {
          errorMessage = details;
        } else {
          errorMessage = 'You are restricted from commenting in this hub due to a moderation action. Please contact the hub moderator if you believe this is an error.';
        }
      } else {
        errorMessage = serverError?.message || serverError?.data || error.message || 'An unexpected error occurred';
      }
      
      showSteamError(errorMessage, errorTitle);
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
      const serverError = error.response?.data;
      let errorMessage = serverError?.data || serverError?.message || 'Failed to send rose';
      let errorTitle = 'Error';

      if (error.response?.status === 403) {
        errorTitle = 'Action Restricted';
        if (errorMessage.toLowerCase().includes('ban') || errorMessage.toLowerCase().includes('restrict')) {
          // Keep server message
        } else {
          errorMessage = 'You are currently restricted from interacting in this hub.';
        }
      }
      
      showSteamError(errorMessage, errorTitle);
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
    <div className={styles.commentSection}>
      <div className={styles.commentSectionHeader}>
        {commentCount > 0 ? `${commentCount} Comment${commentCount > 1 ? 's' : ''}` : 'Comments'}
      </div>

      <div className={styles.commentsList}>
        {comments.length === 0 && !loading ? (
          <div className={styles.noComments}>
            <ChatBubbleOutline />
            <p>No comments yet</p>
            <p className={styles.subtitle}>Be the first to comment.</p>
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
              <button className={styles.loadMoreComments} onClick={handleLoadMore} disabled={loading}>
                {loading ? 'Loading...' : 'Load more comments'}
              </button>
            )}
          </>
        )}
      </div>

      <div className={styles.commentInputContainer}>
        <div className={styles.commentInputWrapper}>
          {(fanHubId && isHubMember && !checkingMembership) && 
          <UserAvatar
            className={styles.commentInputAvatar}
            avatarUrl={avatarUrl}
            avatarFrame={avatarFrame}
            size="small"
          />}
          <div className={styles.commentInputBox}>
            {fanHubId && !isHubMember && !checkingMembership ? (
              <div className={styles.commentMembershipRequired}>
                <p>You must be a member of this hub to comment.</p>
                <button 
                  className={styles.joinHubBtn} 
                  onClick={handleJoinHub}
                  disabled={joiningHub}
                >
                  {joiningHub ? 'Joining...' : 'Join Hub'}
                </button>
              </div>
            ) : (
              <>
                <textarea
                  className={styles.commentTextarea}
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
                  <div className={styles.commentInputActions}>
                    <button
                      className={styles.commentCancelBtn}
                      onClick={() => setCommentText('')}
                    >
                      Cancel
                    </button>
                    <button
                      className={styles.commentSendBtn}
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
      <div className={styles.commentItem} style={{ paddingLeft: depth > 0 ? `${depth * 24 + 16}px` : '16px' }}>
        <div className={styles.commentContent}>
          <UserAvatar
            className={styles.commentAvatar}
            avatarUrl={comment.avatarUrl}
            onClick={() => onAuthorClick(comment.username)}
            size="small"
          />
          <div className={styles.commentBody}>
            <div className={styles.commentHeader}>
              <span className={styles.commentAuthor} onClick={() => onAuthorClick(comment.username)}>
                {comment.displayName}
              </span>
              <span className={styles.commentTime}>{formatTimeAgo(comment.createdAt)}</span>
              <div className={styles.commentMenuWrapper} ref={commentMenuRef}>
                <button className={styles.commentMenuBtn} onClick={handleCommentMenuToggle} title='More options'>
                  <MoreHoriz fontSize='small' />
                </button>
                {commentMenuOpen && (
                  <div className={styles.commentDropdown}>
                    <button className={styles.dropdownItem} onClick={handleReportUser}>
                      <Flag fontSize='small' />
                      <span>Report user</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
            <p className={styles.commentText}>{comment.content}</p>
            <div className={styles.commentActions}>
              <button
                className={`${styles.commentActionBtn} ${comment.isLikedByCurrentUser ? styles.liked : ''}`}
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
                className={`${styles.commentActionBtn} gift-btn`}
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
                  <div className={styles.giftLoadingSpinnerSmall} />
                ) : (
                  <LocalFlorist fontSize='small' style={{ color: '#e91e63' }} />
                )}
                <span>{comment.giftCount || 0}</span>
              </button>

              {depth < MAX_NEST_DEPTH && (
                <button
                  className={styles.commentActionBtn}
                  onClick={() => onReply(comment.commentId)}
                >
                  <Reply fontSize='small' />
                  <span>Reply</span>
                </button>
              )}
            </div>

            {isReplying && depth < MAX_NEST_DEPTH && (
              <div className='comment-reply-input' style={{ marginTop: 8 }}>
                <div className={styles.commentInputWrapper}>
                  <div className={styles.commentInputBox}>
                    <textarea
                      className={styles.commentTextarea}
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
                      <div className={styles.commentInputActions}>
                        <button
                          className={styles.commentCancelBtn}
                          onClick={() => onReply(null)}
                        >
                          Cancel
                        </button>
                        <button
                          className={styles.commentSendBtn}
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
        <div className={styles.commentReplies}>
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
        <button className={styles.viewRepliesBtn} onClick={handleViewReplies}>
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
