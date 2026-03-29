'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { ArrowUpward, ArrowDownward, CommentRounded, ShareRounded } from '@mui/icons-material';
import './SelectedPostPage.css';

export default function SelectedPostPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const postId = params?.postId;
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  useEffect(() => {
    // Post data should be passed from the previous page
    // For some f'ing reason. In Next.js 13+, I can't pass state directly, so I have to rely on the postId
    // For now, I just need to fetch the post or get it from a global store
    // Since I don't have a global storage, I'll fetch the post
    const fetchPost = async () => {
      if (!postId) return;

      setLoading(true);
      try {
        // Had to import this - but since can't get post by ID easily,
        // I'll have to use a different approach
        // For now, I'm use localStorage to pass the post data, like a dummy
        const storedPost = localStorage.getItem(`post_${postId}`);
        if (storedPost) {
          const postData = JSON.parse(storedPost);
          setPost(postData);
          setIsLiked(postData.isLikedByCurrentUser || false);
          setLikeCount(postData.likeCount || 0);
        }
      } catch (error) {
        console.error('Error loading post:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [postId]);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: post?.title,
        text: post?.content,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className='selected-post-page-container'>
        <div className='post-loading'>
          <div className='loading-spinner'>Loading post...</div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className='selected-post-page-container'>
        <div className='post-not-found'>
          <h1>Post Not Found</h1>
          <p>The post you're looking for doesn't exist or was removed.</p>
          <button onClick={() => router.back()} className='back-btn'>Go Back</button>
        </div>
      </div>
    );
  }

  const renderMedia = () => {
    if (!post.mediaUrls || post.mediaUrls.length === 0) return null;

    if (post.postType === 'VIDEO') {
      return (
        <div className='post-media video-media'>
          <video controls>
            <source src={post.mediaUrls[0]} type='video/mp4' />
            Your browser does not support the video tag.
          </video>
        </div>
      );
    }

    return (
      <div className='post-media image-media'>
        <img
          src={post.mediaUrls[0]}
          alt={post.title}
          onError={(e) => {
            e.target.src = '/placeholder-image.png';
          }}
        />
      </div>
    );
  };

  return (
    <div className='selected-post-page-container'>
      <div className='selected-post-content'>
        <div className='selected-post-header'>
          <button onClick={() => router.back()} className='back-btn'>
            ← Back
          </button>
        </div>

        <div className='selected-post-card'>
          <div className='post-vote-section'>
            <button className='vote-btn upvote' onClick={handleLike}>
              <ArrowUpward fontSize='small' />
            </button>
            <span className={`vote-count ${isLiked ? 'liked' : ''}`}>{likeCount}</span>
            <button className='vote-btn downvote'>
              <ArrowDownward fontSize='small' />
            </button>
          </div>

          <div className='post-content'>
            <div className='post-header'>
              <div className='post-author-info'>
                <img
                  className='post-author-avatar'
                  src={post.authorAvatarUrl || '/profile-pic-undefined.jpg'}
                  alt={post.authorDisplayName}
                  onError={(e) => {
                    e.target.src = '/profile-pic-undefined.jpg';
                  }}
                />
                <div className='post-author-details'>
                  <span className='author-display-name'>{post.authorDisplayName}</span>
                  <span className='author-username'>@{post.authorUsername}</span>
                </div>
              </div>
              <div className='post-meta-right'>
                <span className='post-time'>{formatTimeAgo(post.createdAt)}</span>
                {post.fanHubName && (
                  <span className='fanhub-badge'>{post.fanHubName}</span>
                )}
              </div>
            </div>

            <h1 className='post-title-full'>{post.title}</h1>

            {post.content && (
              <p className='post-text-full'>{post.content}</p>
            )}

            {renderMedia()}

            {post.hashtags && post.hashtags.length > 0 && (
              <div className='post-hashtags'>
                {post.hashtags.map((tag, idx) => (
                  <span key={idx} className='hashtag'>#{tag}</span>
                ))}
              </div>
            )}

            <div className='post-actions'>
              <button className='action-btn'>
                <CommentRounded fontSize='small' />
                <span>Comments</span>
              </button>
              <button className='action-btn' onClick={handleShare}>
                <ShareRounded fontSize='small' />
                <span>Share</span>
              </button>
            </div>
          </div>
        </div>

        {/* Comments Section Placeholder */}
        <div className='comments-section'>
          <div className='comments-header'>
            <h2>Comments</h2>
            <span>Coming Soon</span>
          </div>
          <div className='no-comments'>
            <p>Comments feature will be available soon.</p>
          </div>
        </div>
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
