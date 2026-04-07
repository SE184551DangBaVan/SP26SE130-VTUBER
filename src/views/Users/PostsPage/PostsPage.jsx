'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getPostsFeed, likePost, unlikePost } from '@/services/PostController';
import { showSteamSuccess, showSteamError } from '@/utils/SteamNotification';
import './PostsPage.css';
import { CommentRounded, ShareRounded } from '@mui/icons-material';

export default function PostsPage() {
  const router = useRouter();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sortOrder, setSortOrder] = useState('latest');

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const sortBy = sortOrder === 'latest' ? 'createdAt' : 'createdAt';
        const allPosts = await getPostsFeed(0, 50, sortBy);

        const sortedPosts = [...allPosts].sort((a, b) => {
          const dateA = new Date(a.createdAt);
          const dateB = new Date(b.createdAt);
          return sortOrder === 'latest' ? dateB - dateA : dateA - dateB;
        });

        setPosts(sortedPosts);
      } catch (error) {
        console.error('Error fetching posts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [sortOrder]);

  const handleSortChange = (e) => {
    setSortOrder(e.target.value);
  };

  const handlePostClick = (post) => {
    // Store post data in localStorage for SelectedPostPage to retrieve
    localStorage.setItem(`post_${post.postId}`, JSON.stringify(post));
    router.push(`/post/${post.postId}`);
  };

  const handleHubClick = (fanHubId) => {
    router.push(`/hub/${fanHubId}`);
  };

  return (
    <div className='posts-page-container'>
      <div className='posts-page-content'>
        <div className='posts-page-header'>
          <h1>All Posts</h1>
          <p>Discover posts from all FanHubs</p>
        </div>

        <div className='posts-sort-bar'>
          <div className='sort-controls'>
            <label>Sort by:</label>
            <select value={sortOrder} onChange={handleSortChange} className='sort-select'>
              <option value='latest'>Latest</option>
              <option value='oldest'>Oldest</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className='posts-loading'>
            <div className='loading-spinner'>Loading posts...</div>
          </div>
        ) : posts.length === 0 ? (
          <div className='no-posts'>
            <p>No posts available yet.</p>
          </div>
        ) : (
          <div className='posts-feed'>
            {posts.map((post) => (
              <PostCard 
                key={post.postId} 
                post={post} 
                onClick={() => handlePostClick(post)}
                onHubClick={handleHubClick}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PostCard({ post, onClick, onHubClick }) {
  const [isLiked, setIsLiked] = useState(post.isLikedByCurrentUser);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [likeLoading, setLikeLoading] = useState(false);

  const handleLike = async (e) => {
    e.stopPropagation();
    
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

  const handleHubClick = (e) => {
    e.stopPropagation();
    if (onHubClick && post.fanHubId) {
      onHubClick(post.fanHubId);
    }
  };

  const handleCommentsClick = (e) => {
    e.stopPropagation();
    localStorage.setItem(`post_${post.postId}`, JSON.stringify(post));
    onClick();
  };

  const renderMedia = () => {
    if (!post.mediaUrls || post.mediaUrls.length === 0) return null;

    if (post.postType === 'VIDEO') {
      return (
        <div className='post-media video-media'>
          <video onClick={(e) => e.stopPropagation()} controls>
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
          onClick={(e) => e.stopPropagation()}
          onError={(e) => {
            e.target.src = '/placeholder-image.png';
          }}
        />
      </div>
    );
  };

  return (
    <div className='post-card' onClick={onClick}>
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
            {post.fanHubName && post.fanHubId && (
              <span className='fanhub-badge' onClick={handleHubClick}>
                fh/{post.fanHubName}
              </span>
            )}
          </div>
        </div>

        <h3 className='post-title'>{post.title}</h3>

        {post.content && (
          <p className='post-text'>{post.content}</p>
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
          <button className='action-btn' onClick={handleCommentsClick}>
            <CommentRounded fontSize='small' />
            <span>Comments</span>
          </button>
          <button className='action-btn' onClick={(e) => e.stopPropagation()}>
            <ShareRounded fontSize='small' />
            <span>Share</span>
          </button>
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
