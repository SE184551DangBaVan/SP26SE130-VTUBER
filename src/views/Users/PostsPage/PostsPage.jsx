'use client';

import './PostPage.css';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getPostsFeed } from '@/services/PostController';
import { showSteamSuccess, showSteamError } from '@/utils/SteamNotification';
import { useAuth } from '@/functions/Auth/useAuth';
import { BASE_URL } from '@/config';
import PostDetails from './PostDetails';
import PostCard from './PostCard';

const POSTS_PER_PAGE = 4;

export default function PostsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hashtagParam = searchParams.get('hashtag');
  const { userAuth } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [sortDir, setSortDir] = useState('desc');
  const [activeHashtag, setActiveHashtag] = useState(null);
  const [serverPage, setServerPage] = useState(0);
  const observer = useRef();
  const latestFeedRequestRef = useRef(0);
  const scrollPositionRef = useRef(0);

  const fetchPosts = useCallback(async (pageNum, sortDirParam, hashtagFilter, append = true, requestId = latestFeedRequestRef.current) => {
    setLoading(true);

    try {
      let pageToFetch = pageNum;

      while (true) {
        const newPosts = await getPostsFeed(pageToFetch, POSTS_PER_PAGE, 'createdAt', sortDirParam, hashtagFilter);

        if (requestId !== latestFeedRequestRef.current) return;

        setHasMore(newPosts.length >= POSTS_PER_PAGE);

        const filteredPosts = newPosts.filter(
          post => post.postType !== 'ANNOUNCEMENT' && post.postType !== 'EVENT_SCHEDULE'
        );

        if (filteredPosts.length > 0 || newPosts.length < POSTS_PER_PAGE) {
          if (append && pageNum !== 0) {
            setPosts(prev => {
              // Deduplicate posts by postId
              const existingIds = new Set(prev.map(p => p.postId));
              const uniqueNewPosts = filteredPosts.filter(p => !existingIds.has(p.postId));
              return [...prev, ...uniqueNewPosts];
            });
          } else {
            setPosts(filteredPosts);
          }

          setServerPage(pageToFetch + 1);
          break;
        }

        pageToFetch += 1;
        if (requestId === latestFeedRequestRef.current) {
          setServerPage(pageToFetch);
        } else {
          return;
        }
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      if (requestId === latestFeedRequestRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const requestId = latestFeedRequestRef.current + 1;
    latestFeedRequestRef.current = requestId;

    setActiveHashtag(hashtagParam || null);
    setPosts([]);
    setServerPage(0);
    setHasMore(true);
    fetchPosts(0, sortDir, hashtagParam, false, requestId);
  }, [fetchPosts, hashtagParam, sortDir]);

  const lastPostElementRef = useCallback(
    (node) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          fetchPosts(serverPage, sortDir, activeHashtag);
        }
      }, { rootMargin: '200px' });

      if (node) observer.current.observe(node);
    },
    [loading, hasMore, serverPage, sortDir, activeHashtag, fetchPosts]
  );

  const handleSortChange = (e) => {
    setSortDir(e.target.value);
  };

  const handleHashtagClick = (e, tag) => {
    e.stopPropagation();
    router.push(`/posts?hashtag=${encodeURIComponent(tag)}`, { scroll: false });
  };

  const handlePostClick = (post) => {
    localStorage.setItem(`post_${post.postId}`, JSON.stringify(post));
    scrollPositionRef.current = window.scrollY;
    const params = new URLSearchParams();
    if (activeHashtag) params.set('hashtag', activeHashtag);
    params.set('id', post.postId);
    router.push(`/posts?${params.toString()}`, { scroll: false });
  };

  const handleCommentsClick = (post) => {
    if (!userAuth) {
      router.push('/login');
      return;
    }
    scrollPositionRef.current = window.scrollY;
    const params = new URLSearchParams();
    if (activeHashtag) params.set('hashtag', activeHashtag);
    params.set('id', post.postId);
    router.push(`/posts?${params.toString()}`, { scroll: false });
  };

  const handleShareClick = (post) => {
    const shareUrl = `${BASE_URL}/posts?shareId=${post.postId}`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        showSteamSuccess('Link copied!', 'Shared');
      }).catch(() => {
        showSteamError('Failed to copy link', 'Error');
      });
    } else {
      // Fallback for browsers that don't support navigator.clipboard
      try {
        const textArea = document.createElement('textarea');
        textArea.value = shareUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showSteamSuccess('Link copied!', 'Shared');
      } catch (err) {
        showSteamError('Failed to copy link', 'Error');
      }
    }
  };

  const handleHubClick = (post) => {
    // Navigate using the subdomain from the post's fan hub
    if (post.fanHubSubdomain) {
      router.push(`/hub/${post.fanHubSubdomain}`);
    } else {
      console.warn('Post does not have fanHubSubdomain');
    }
  };

  // Restore scroll position when modal closes
  useEffect(() => {
    const postIdParam = searchParams.get('id');
    const shareIdParam = searchParams.get('shareId');
    if (!postIdParam && !shareIdParam && scrollPositionRef.current > 0) {
      requestAnimationFrame(() => {
        window.scrollTo(0, scrollPositionRef.current);
        scrollPositionRef.current = 0;
      });
    }
  }, [searchParams]);

  return (
    <div className='posts-page-container'>
      <div className='posts-page-content'>
        <div className='posts-sort-bar' >
          <div className='sort-controls'>
            <label>Sort by:</label>
            <select value={sortDir} onChange={handleSortChange} className='sort-select'>
              <option value='desc'>Latest</option>
              <option value='asc'>Oldest</option>
            </select>
          </div>
        </div>

        {loading && posts.length === 0 ? (
          <div className='posts-loading'>
            <div className='loading-spinner'>Loading posts...</div>
          </div>
        ) : posts.length === 0 ? (
          <div className='no-posts'>
            <p>No posts available yet.</p>
          </div>
        ) : (
          <div className='posts-feed'>
            {posts.map((post, index) => {
              if (posts.length === index + 1) {
                return (
                  <div ref={lastPostElementRef} key={post.postId}>
                    <PostCard
                      post={post}
                      onClick={() => handlePostClick(post)}
                      onCommentsClick={() => handleCommentsClick(post)}
                      onShareClick={() => handleShareClick(post)}
                      onHubClick={handleHubClick}
                      onHashtagClick={handleHashtagClick}
                      userAuth={userAuth}
                      router={router}
                      showPinned={false}
                    />
                  </div>
                );
              } else {
                return (
                  <PostCard
                    key={post.postId}
                    post={post}
                    onClick={() => handlePostClick(post)}
                    onCommentsClick={() => handleCommentsClick(post)}
                    onShareClick={() => handleShareClick(post)}
                    onHubClick={handleHubClick}
                    onHashtagClick={handleHashtagClick}
                    userAuth={userAuth}
                    router={router}
                    showPinned={false}
                  />
                );
              }
            })}
            {loading && (
              <div className='infinite-scroll-loader'>Loading more posts...</div>
            )}
            {!loading && !hasMore && posts.length > 0 && (
              <div className='no-more-posts-message'>
                That's all for now, there'll be more soon! ✨
              </div>
            )}
          </div>
        )}
      </div>
      <PostDetails scrollPositionRef={scrollPositionRef} />
    </div>
  );
}

function formatTimeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.max(0, Math.floor((now - date) / 1000));
  const days = Math.floor(seconds / 86400);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;

  return `${Math.floor(days / 365)}y ago`;
}
