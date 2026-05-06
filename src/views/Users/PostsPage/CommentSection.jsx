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
  editComment,
  deleteComment,
  hideComment,
  getHiddenComments,
  getHiddenReplies,
} from '@/services/CommentController';
import { COMMENT_GIFTING_COST } from '@/constants/giftingConstants';
import { checkIsMember } from '@/services/FanHubController';
import { joinFanHub } from '@/services/MemberController';
import { showSteamSuccess, showSteamError } from '@/utils/SteamNotification';
import { useAuth } from '@/functions/Auth/useAuth';
import { useReportModal, REPORT_TYPE } from '@/components/ReportModal';
import { Favorite, FavoriteBorder, Reply, ChatBubbleOutline, MoreHoriz, Flag, LocalFlorist, Edit, Delete, VisibilityOff } from '@mui/icons-material';
import UserAvatar from '@/components/UserAvatar/UserAvatar';
import styles from './CommentSection.module.css';

const COMMENTS_PER_LOAD = 7;
const REPLIES_PER_LOAD = 5;
const MAX_NEST_DEPTH = 5;

export default function CommentSection({ postId, router, commentCount, fanHubId, fanHubSubdomain }) {
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
  const [roleInHub, setRoleInHub] = useState(null); // 'MEMBER', 'MODERATOR', 'VTUBER'
  const [checkingMembership, setCheckingMembership] = useState(false);

  // Hidden comments state
  const [hiddenComments, setHiddenComments] = useState([]);
  const [showHidden, setShowHidden] = useState(false);
  const [loadingHidden, setLoadingHidden] = useState(false);
  const [totalHidden, setTotalHidden] = useState(0);

  // Check hub membership when fanHubId is provided
  useEffect(() => {
    const checkMembership = async () => {
      if (!fanHubId || !userAuth) {
        setIsHubMember(false);
        setRoleInHub(null);
        return;
      }

      setCheckingMembership(true);
      try {
        const memberData = await checkIsMember(fanHubId);
        setIsHubMember(memberData?.isMember || false);
        setRoleInHub(memberData?.roleInHub || 'MEMBER');
      } catch (error) {
        console.error('Error checking hub membership:', error);
        setIsHubMember(false);
        setRoleInHub(null);
      } finally {
        setCheckingMembership(false);
      }
    };

    checkMembership();
  }, [fanHubId, userAuth]);

  // Handle going to the hub
  const handleGoToHub = () => {
    if (fanHubSubdomain) {
      navRouter.push(`/hub/${fanHubSubdomain}`);
    } else {
      console.warn('No fanHubSubdomain provided');
    }
  };

  useEffect(() => {
    if (!postId) return;
    setComments([]);
    setHiddenComments([]);
    setShowHidden(false);
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

        // If no more regular comments, try to fetch hidden ones
        if (!more) {
          fetchHiddenComments();
        }
      } catch (error) {
        console.error('Error fetching comments:', error);
      } finally {
        setLoading(false);
      }
    },
    [postId]
  );

  const fetchHiddenComments = async () => {
    setLoadingHidden(true);
    try {
      const { comments: hiddens, totalHidden: total } = await getHiddenComments(postId, 0, 100);
      setHiddenComments(hiddens);
      setTotalHidden(total);
    } catch (error) {
      console.error('Error fetching hidden comments:', error);
    } finally {
      setLoadingHidden(false);
    }
  };

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

  const refreshAll = () => {
    setOffset(0);
    setHasMore(true);
    fetchComments(0);
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
                refreshComments={refreshAll}
                userAuth={userAuth}
                navRouter={navRouter}
                roleInHub={roleInHub}
              />
            ))}
            {hasMore && (
              <button className={styles.loadMoreComments} onClick={handleLoadMore} disabled={loading}>
                {loading ? 'Loading...' : 'Load more comments'}
              </button>
            )}

            {!hasMore && totalHidden > 0 && (
              <div className={styles.hiddenCommentsSection}>
                {!showHidden ? (
                  <button className={styles.showHiddenBtn} onClick={() => setShowHidden(true)}>
                    [{totalHidden} message{totalHidden > 1 ? 's' : ''} hidden, click to show]
                  </button>
                ) : (
                  <>
                    <div className={styles.hiddenCommentsHeader}>Hidden Comments</div>
                    {hiddenComments.map(comment => (
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
                        refreshComments={refreshAll}
                        userAuth={userAuth}
                        navRouter={navRouter}
                        roleInHub={roleInHub}
                      />
                    ))}
                    <button className={styles.hideHiddenBtn} onClick={() => setShowHidden(false)}>
                      Hide hidden messages
                    </button>
                  </>
                )}
              </div>
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
                  onClick={handleGoToHub}
                >
                  Go to Hub
                </button>              </div>
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
  roleInHub,
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

  // New states for Edit/Delete/Hide
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(comment.content);
  const [savingEdit, setSavingEdit] = useState(false);

  // Hidden replies state
  const [hiddenReplies, setHiddenReplies] = useState([]);
  const [showHiddenReplies, setShowHiddenReplies] = useState(false);
  const [totalHiddenReplies, setTotalHiddenReplies] = useState(0);
  const [loadingHiddenReplies, setLoadingHiddenReplies] = useState(false);

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

  // Permission Checks
  const isOwnComment = userAuth && userAuth.userId === comment.userId;
  const isAuthorVtuber = comment.roleInHub === 'VTUBER';
  const isAuthorModerator = comment.roleInHub === 'MODERATOR';
  const isAuthorUser = !isAuthorVtuber && !isAuthorModerator;

  const canEdit = isOwnComment;

  const canDelete = isOwnComment || 
    (roleInHub === 'VTUBER' && isAuthorUser) || 
    (roleInHub === 'MODERATOR' && (isAuthorUser || isAuthorModerator)) ||
    (roleInHub === 'VTUBER' && isAuthorModerator); // Added VTUBER can delete Moderator

  const canHide = (roleInHub === 'VTUBER' && isAuthorUser) || 
    (roleInHub === 'MODERATOR' && (isAuthorUser || isAuthorModerator));
  
  // Moderator cannot hide Vtuber's Comment
  const moderatorHidingVtuber = roleInHub === 'MODERATOR' && isAuthorVtuber;
  const actualCanHide = canHide && !moderatorHidingVtuber;

  const handleEdit = () => {
    setCommentMenuOpen(false);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditValue(comment.content);
  };

  const handleSaveEdit = async () => {
    if (!editValue.trim() || editValue === comment.content) {
      setIsEditing(false);
      return;
    }

    setSavingEdit(true);
    try {
      const result = await editComment(comment.commentId, editValue.trim());
      if (result?.success) {
        showSteamSuccess('Comment updated', 'Success');
        setIsEditing(false);
        refreshComments();
      } else {
        showSteamError(result?.message || 'Failed to update comment', 'Error');
      }
    } catch (error) {
      console.error('Error editing comment:', error);
      showSteamError('Failed to update comment', 'Error');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async () => {
    setCommentMenuOpen(false);
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    try {
      const result = await deleteComment(comment.commentId);
      if (result?.success) {
        showSteamSuccess('Comment deleted', 'Success');
        refreshComments();
      } else {
        showSteamError(result?.message || 'Failed to delete comment', 'Error');
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      showSteamError('Failed to delete comment', 'Error');
    }
  };

  const handleHide = async () => {
    setCommentMenuOpen(false);
    try {
      const result = await hideComment(comment.commentId);
      if (result?.success) {
        showSteamSuccess('Comment hidden', 'Success');
        refreshComments();
      } else {
        showSteamError(result?.message || 'Failed to hide comment', 'Error');
      }
    } catch (error) {
      console.error('Error hiding comment:', error);
      showSteamError('Failed to hide comment', 'Error');
    }
  };

  const fetchReplies = useCallback(async () => {
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

      if (!more) {
        fetchHiddenReplies();
      }
    } catch (error) {
      console.error('Error fetching replies:', error);
    } finally {
      setLoadingReplies(false);
    }
  }, [comment.commentId, replies.length]);

  const fetchHiddenReplies = async () => {
    setLoadingHiddenReplies(true);
    try {
      const { replies: hiddens, totalHidden: total } = await getHiddenReplies(comment.commentId, 0, 100);
      setHiddenReplies(hiddens);
      setTotalHiddenReplies(total);
    } catch (error) {
      console.error('Error fetching hidden replies:', error);
    } finally {
      setLoadingHiddenReplies(false);
    }
  };

  const handleViewReplies = () => {
    if (replies.length === 0) {
      fetchReplies();
    } else if (hasMoreReplies) {
      fetchReplies();
    } else {
      setReplies([]);
      setHasMoreReplies(comment.hasChildren);
      setRepliesOffset(0);
      setShowHiddenReplies(false);
    }
  };

  return (
    <>
      <div className={styles.commentItem} style={{ paddingLeft: depth > 0 ? `${depth * 24 + 16}px` : '16px' }}>
        <div className={styles.commentContent}>
          <UserAvatar
            className={styles.commentAvatar}
            avatarUrl={comment.avatarUrl}
            avatarFrame={comment.frameUrl}
            frameSize={comment.frameSize}
            frameX={comment.frameXAxis}
            frameY={comment.frameYAxis}
            onClick={() => onAuthorClick(comment.username)}
            size="small"
          />
          <div className={styles.commentBody}>
            <div className={styles.commentHeader}>
              <span className={styles.commentAuthor} onClick={() => onAuthorClick(comment.username)}>
                {comment.displayName}
                {comment.roleInHub && (
                  <span className={`${styles.roleBadge} ${styles[comment.roleInHub.toLowerCase()]}`}>
                    {comment.roleInHub}
                  </span>
                )}
              </span>
              <span className={styles.commentTime}>{formatTimeAgo(comment.createdAt)}</span>
              <div className={styles.commentMenuWrapper} ref={commentMenuRef}>
                <button className={styles.commentMenuBtn} onClick={handleCommentMenuToggle} title='More options'>
                  <MoreHoriz fontSize='small' />
                </button>
                {commentMenuOpen && (
                  <div className={styles.commentDropdown}>
                    {canEdit && (
                      <button className={styles.dropdownItem} onClick={handleEdit}>
                        <Edit fontSize='small' />
                        <span>Edit</span>
                      </button>
                    )}
                    {actualCanHide && (
                      <button className={styles.dropdownItem} onClick={handleHide}>
                        <VisibilityOff fontSize='small' />
                        <span>Hide</span>
                      </button>
                    )}
                    {canDelete && (
                      <button className={`${styles.dropdownItem} ${styles.deleteItem}`} onClick={handleDelete}>
                        <Delete fontSize='small' />
                        <span>Delete</span>
                      </button>
                    )}
                    <button className={styles.dropdownItem} onClick={handleReportUser}>
                      <Flag fontSize='small' />
                      <span>Report user</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            {isEditing ? (
              <div className={styles.editCommentContainer}>
                <textarea
                  className={styles.commentTextarea}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  rows={2}
                  autoFocus
                />
                <div className={styles.editActions}>
                  <button className={styles.cancelEditBtn} onClick={handleCancelEdit} disabled={savingEdit}>
                    Cancel
                  </button>
                  <button className={styles.saveEditBtn} onClick={handleSaveEdit} disabled={savingEdit || !editValue.trim()}>
                    {savingEdit ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            ) : (
              <p className={styles.commentText}>{comment.content}</p>
            )}

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
              roleInHub={roleInHub}
            />
          ))}

          {!hasMoreReplies && totalHiddenReplies > 0 && (
            <div className={styles.hiddenRepliesSection} style={{ marginLeft: `${(depth + 1) * 24 + 16}px` }}>
              {!showHiddenReplies ? (
                <button className={styles.showHiddenBtn} onClick={() => setShowHiddenReplies(true)}>
                  [{totalHiddenReplies} repl{totalHiddenReplies > 1 ? 'ies' : 'y'} hidden, click to show]
                </button>
              ) : (
                <>
                  {hiddenReplies.map(reply => (
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
                      roleInHub={roleInHub}
                    />
                  ))}
                  <button className={styles.hideHiddenBtn} onClick={() => setShowHiddenReplies(false)}>
                    Hide hidden replies
                  </button>
                </>
              )}
            </div>
          )}
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
