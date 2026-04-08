'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  getComments,
  getCommentReplies,
  sendComment,
  likeComment,
  unlikeComment,
} from '@/services/CommentController';
import { showSteamSuccess, showSteamError } from '@/utils/SteamNotification';
import { useReportModal, REPORT_TYPE } from '@/components/ReportModal';
import { Favorite, FavoriteBorder, Reply, ChatBubbleOutline, MoreHoriz, Flag } from '@mui/icons-material';

const COMMENTS_PER_LOAD = 7;
const REPLIES_PER_LOAD = 5;
const MAX_NEST_DEPTH = 5;

export default function CommentSection({ postId, userAuth, router }) {
  const localRouter = useRouter();
  const navRouter = router || localRouter;
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

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
        {comments.length > 0 ? `${comments.length} Comment${comments.length > 1 ? 's' : ''}` : 'Comments'}
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
          <img
            className='comment-input-avatar'
            src={currentUser?.avatarUrl || '/profile-pic-undefined.jpg'}
            alt='Your avatar'
            onError={(e) => {
              e.target.src = '/profile-pic-undefined.jpg';
            }}
          />
          <div className='comment-input-box'>
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
      // TODO: Replace userId with memberId once backend adds memberId to comment response
      targetId: comment.memberId || comment.userId,
      targetName: comment.displayName || comment.username,
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
              >
                {comment.isLikedByCurrentUser ? (
                  <Favorite fontSize='small' />
                ) : (
                  <FavoriteBorder fontSize='small' />
                )}
                <span>{comment.likeCount || 0}</span>
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
