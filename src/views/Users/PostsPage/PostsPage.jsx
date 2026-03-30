'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getPostsFeed } from '@/services/PostController';
import './PostsPage.css';
import { ArrowUpward, ArrowDownward, CommentRounded } from '@mui/icons-material';

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

  const handleLike = (e) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
  };

  const handleHubClick = (e) => {
    e.stopPropagation();
    if (onHubClick && post.fanHubId) {
      onHubClick(post.fanHubId);
    }
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
      <div className='post-vote-section'>
        <button className='vote-btn upvote' onClick={handleLike}>
          <ArrowUpward fontSize='small' />
        </button>
        <span className={`vote-count ${isLiked ? 'liked' : ''}`}>{likeCount}</span>
        <button className='vote-btn downvote' onClick={(e) => e.stopPropagation()}>
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
            {post.fanHubName && post.fanHubId && (
              <span className='fanhub-badge' onClick={handleHubClick}>
                r/{post.fanHubName}
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
          <button className='action-btn' onClick={(e) => e.stopPropagation()}>
            <CommentRounded fontSize='small' />
            <span>Comments</span>
          </button>
          <button className='action-btn' onClick={(e) => e.stopPropagation()}>
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
