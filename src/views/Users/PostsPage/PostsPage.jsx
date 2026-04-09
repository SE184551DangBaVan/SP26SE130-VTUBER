'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getPostsFeed, likePost, unlikePost } from '@/services/PostController';
import { showSteamSuccess, showSteamError } from '@/utils/SteamNotification';
import { useAuth } from '@/functions/Auth/useAuth';
import { useReportModal, REPORT_TYPE } from '@/components/ReportModal';
import { BASE_URL } from '@/config';
import PostDetails from './PostDetails';
import PostCard from './PostCard';
import './PostsPage.css';

const POSTS_PER_PAGE = 4;

export default function PostsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { userAuth } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [sortOrder, setSortOrder] = useState('latest');
  const [serverPage, setServerPage] = useState(0);
  const observer = useRef();
  const scrollPositionRef = useRef(0);

  const fetchPosts = useCallback(async (pageNum, sortBy, append = true) => {
    // Only show full page loader on initial load
    if (pageNum === 0 && posts.length === 0) {
      setLoading(true);
    }
    
    try {
      const newPosts = await getPostsFeed(pageNum, POSTS_PER_PAGE, sortBy);

        console.log("newPosts length:" + newPosts.length);
        console.log("POSTS_PER_PAGE" + POSTS_PER_PAGE);
      if (newPosts.length < POSTS_PER_PAGE) {

          console.log("settings has more as false now...")
        setHasMore(false);
      }

      const filteredPosts = newPosts.filter(
        post => post.postType !== 'ANNOUNCEMENT' && post.postType !== 'EVENT_SCHEDULE'
      );

      if (filteredPosts.length > 0) {
        if (append && pageNum !== 0) {
          setPosts(prev => [...prev, ...filteredPosts]);
        } else {
          setPosts(filteredPosts);
        }
        setServerPage(pageNum + 1);
      } else if (newPosts.length === POSTS_PER_PAGE) {
        const nextPage = pageNum + 1;
        setServerPage(nextPage);
        await fetchPosts(nextPage, sortBy, append);
        return;
      } else {
        if (pageNum === 0) setPosts([]);
        setServerPage(pageNum + 1);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      // Only hide loader on initial load
      if (pageNum === 0 && posts.length === 0) {
        setLoading(false);
      }
    }
  }, [posts.length]);

  useEffect(() => {
    const sortBy = sortOrder === 'latest' ? 'createdAt' : 'createdAt';
    setServerPage(0);
    setHasMore(true);
    fetchPosts(0, sortBy);
  }, [sortOrder]);

  const lastPostElementRef = useCallback(
    (node) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
          if(entries[0].isIntersecting){
              console.log("ooh, intersecting!!!!")
              console.log("has more is...", hasMore);
          }
        if (entries[0].isIntersecting && hasMore) {
            console.log("ouh, intersecting and it has more elements");
          const sortBy = sortOrder === 'latest' ? 'createdAt' : 'createdAt';
          fetchPosts(serverPage, sortBy);
        }
      }, { rootMargin: '200px' });

      if (node) observer.current.observe(node);
    },
    [loading, hasMore, serverPage, sortOrder, fetchPosts]
  );

  const handleSortChange = (e) => {
    setSortOrder(e.target.value);
  };

  const handlePostClick = (post) => {
    localStorage.setItem(`post_${post.postId}`, JSON.stringify(post));
    scrollPositionRef.current = window.scrollY;
    router.push(`/posts?id=${post.postId}`, { scroll: false });
  };

  const handleCommentsClick = (post) => {
    if (!userAuth) {
      router.push('/login');
      return;
    }
    scrollPositionRef.current = window.scrollY;
    router.push(`/posts?id=${post.postId}`, { scroll: false });
  };

  const handleShareClick = (post) => {
    if (!userAuth) {
      router.push('/login');
      return;
    }
    const shareUrl = `${BASE_URL}/posts?shareId=${post.postId}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      showSteamSuccess('Link copied!', 'Shared');
    }).catch(() => {
      showSteamError('Failed to copy link', 'Error');
    });
  };

  const handleHubClick = (post) => {
    // Navigate using the subdomain from the post's fan hub
    if (post.fanHubSubdomain) {
      router.push(`/hub/${post.fanHubSubdomain}`);
    } else if (post.fanHubId) {
      // Fallback: if subdomain is not available, we may need to fetch it
      // For now, use fanHubId as is (this shouldn't happen in normal cases)
      console.warn('Post does not have fanHubSubdomain, using fanHubId as fallback');
      router.push(`/hub/${post.fanHubId}`);
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
        <div className='posts-sort-bar'>
          <div className='sort-controls'>
            <label>Sort by:</label>
            <select value={sortOrder} onChange={handleSortChange} className='sort-select'>
              <option value='latest'>Latest</option>
              <option value='oldest'>Oldest</option>
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
                      userAuth={userAuth}
                      router={router}
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
                    userAuth={userAuth}
                    router={router}
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
