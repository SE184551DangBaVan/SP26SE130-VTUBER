'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { CommentRounded, ShareRounded } from '@mui/icons-material';
import { likePost, unlikePost } from '@/services/PostController';
import { showSteamSuccess, showSteamError } from '@/utils/SteamNotification';
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
  const [likeLoading, setLikeLoading] = useState(false);

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

  const handleLike = async () => {
    if (likeLoading) return;
    
    setLikeLoading(true);
    
    try {
      let result;
      
      if (isLiked) {
        // Unlike the post
        result = await unlikePost(post.postId);
        if (result?.success) {
          setIsLiked(false);
          setLikeCount(prev => prev - 1);
          showSteamSuccess(result.data || 'Post unliked successfully.', result.message || 'Unliked');
        }
      } else {
        // Like the post
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
              <div className='post-vote-section'>
                <button className='vote-btn like-btn' onClick={handleLike} disabled={likeLoading}>
                  {likeLoading ? (
                    <span className='like-loading-spinner' />
                  ) : (
                    <svg className='like-ico' xmlns="http://www.w3.org/2000/svg" width="58" height="58" viewBox="0 0 58 58" fill="none">
                      <path d="M22.7111 39.1439L34.9947 35.8525C36.6662 35.4047 37.8883 34.475 37.4672 32.9031L37.0349 28.4449C36.798 27.6719 36.2643 27.0242 35.5509 26.6439C34.8374 26.2635 34.0023 26.1814 33.2284 26.4155L30.1984 27.2274C30.0095 27.2771 29.8123 27.2865 29.6196 27.255C29.4268 27.2235 29.2429 27.1518 29.0797 27.0445C28.9165 26.9373 28.7777 26.7968 28.6723 26.6324C28.5669 26.468 28.4974 26.2832 28.4681 26.0901L27.9624 22.0404C27.855 21.6473 27.5968 21.3124 27.2438 21.1086C26.8908 20.9048 26.4717 20.8486 26.0775 20.9522C25.8782 21.0026 25.6909 21.0922 25.5267 21.2157C25.3624 21.3393 25.2244 21.4944 25.1208 21.672C25.0172 21.8495 24.95 22.0459 24.9232 22.2497C24.8964 22.4535 24.9105 22.6606 24.9646 22.8589L25.1452 25.0975C25.4622 27.5893 24.2488 29.1494 22.3295 30.5785" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M20.737 32.3162C21.1298 32.211 21.3629 31.8072 21.2576 31.4144C21.1524 31.0216 20.7486 30.7884 20.3558 30.8937C19.963 30.999 19.7299 31.4027 19.8351 31.7955C19.9404 32.1884 20.3441 32.4215 20.737 32.3162Z" fill="black"/>
                    </svg>
                  )}
                </button>
                <span className={`vote-count ${isLiked ? 'liked' : ''}`}>{likeCount}</span>
              </div>
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
