'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getPostsFeed, likePost, unlikePost } from '@/services/PostController';
import { showSteamSuccess, showSteamError } from '@/utils/SteamNotification';
import { useAuth } from '@/functions/Auth/useAuth';
import { useReportModal, REPORT_TYPE } from '@/components/ReportModal';
import { BASE_URL } from '@/config';
import PostDetails from './PostDetails';
import {
    ShareRounded,
    CommentRounded,
    AutoAwesome,
    Translate,
    MoreHoriz,
    Flag,
} from '@mui/icons-material';
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

      if (newPosts.length < POSTS_PER_PAGE) {
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
        if (entries[0].isIntersecting && hasMore) {
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

function PostCard({ post, onClick, onCommentsClick, onShareClick, onHubClick, userAuth, router }) {
    const { openReportModal } = useReportModal();
    const [isLiked, setIsLiked] = useState(post.isLikedByCurrentUser);
    const [likeCount, setLikeCount] = useState(post.likeCount);
    const [likeLoading, setLikeLoading] = useState(false);
    const [extraMenuOpen, setExtraMenuOpen] = useState(false);
    const menuRef = useRef();

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setExtraMenuOpen(false);
            }
        };
        if (extraMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [extraMenuOpen]);

    const handleLike = async (e) => {
        e.stopPropagation();
        if (likeLoading) return;
        if (!userAuth) {
            router.push('/login');
            return;
        }

        setLikeLoading(true);

        try {
            let result;

            if (isLiked) {
                result = await unlikePost(post.postId);
                if (result?.success) {
                    setIsLiked(false);
                    setLikeCount(prev => prev - 1);
                    showSteamSuccess(result.data || 'Post unliked successfully.', result.message || 'Unliked');
                }
            } else {
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
        if (onHubClick && post) {
            onHubClick(post);
        }
    };

    const handleCommentsClick = (e) => {
        e.stopPropagation();
        if (onCommentsClick) {
            onCommentsClick(post);
        }
    };

    const handleAISummary = (e) => {
        e.stopPropagation();
        console.log('AI Summary clicked for post:', post.postId);
    };

    const handleAITranslate = (e) => {
        e.stopPropagation();
        console.log('AI Translate clicked for post:', post.postId);
    };

    const handleExtraOptionsToggle = (e) => {
        e.stopPropagation();
        setExtraMenuOpen(prev => !prev);
    };

    const handleReportPost = (e) => {
        e.stopPropagation();
        setExtraMenuOpen(false);
        if (!userAuth) {
            router.push('/login');
            return;
        }
        openReportModal({
            type: REPORT_TYPE.POST,
            targetId: post.postId,
            targetName: post.title || `Post #${post.postId}`,
        });
    };

    const handleAvatarClick = (e) => {
        e.stopPropagation();
        router.push(`/user/${post.authorUsername}`);
    };

    const renderPostTypeContent = () => {
        switch (post.postType) {
            case 'IMAGE':
                return <ImagePostContent post={post} onClick={onClick} />;
            case 'VIDEO':
                return <VideoPostContent post={post} onClick={onClick} />;
            case 'TEXT':
                return <TextPostContent post={post} onClick={onClick} />;
            case 'POLL':
                return <PollPostContent post={post} onClick={onClick} />;
            case 'ANNOUNCEMENT':
            case 'EVENT_SCHEDULE':
                return null; // Ignored as per requirements
            default:
                return <TextPostContent post={post} onClick={onClick} />;
        }
    };

    return (
        <div className='post-card' onClick={onClick}>
            <div className='post-header'>
                <div className='post-author-info'>
                    <img
                        className='post-author-avatar'
                        src={post.authorAvatarUrl || '/profile-pic-undefined.jpg'}
                        alt={post.authorDisplayName}
                        title="Go to author profile"
                        onClick={handleAvatarClick}
                        onError={(e) => {
                            e.target.src = '/profile-pic-undefined.jpg';
                        }}
                    />
                    <div className='post-author-details'>
                        <span className='fanhub-name' onClick={handleHubClick} title="Go to hub">h/{post.fanHubName}</span>
                        <span className='post-time'>{formatTimeAgo(post.createdAt)}</span>
                    </div>
                </div>
                <div className='post-actions-menu'>
                    <button className='menu-btn' onClick={handleAISummary} title='AI Summary'>
                        <AutoAwesome fontSize='small' />
                    </button>
                    <button className='menu-btn' onClick={handleAITranslate} title='AI Translate'>
                        <Translate fontSize='small' />
                    </button>
                    <div className='extra-menu-wrapper' ref={menuRef}>
                        <button className='menu-btn' onClick={handleExtraOptionsToggle} title='More options'>
                            <MoreHoriz fontSize='small' />
                        </button>
                        {extraMenuOpen && (
                            <div className='extra-dropdown'>
                                <button className='dropdown-item' onClick={handleReportPost}>
                                    <Flag fontSize='small' />
                                    <span>Report post</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {renderPostTypeContent()}

            <div className='post-footer'>
                <div className='post-footer-left'>
                    <button className={`action-btn like-btn ${isLiked ? 'liked' : ''}`} onClick={handleLike} disabled={likeLoading}>
                        {likeLoading ? (
                            <span className='like-loading-spinner' />
                        ) : (
                            <svg className='like-icon' xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill={isLiked ? "white" : "none"}>
                                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill={isLiked ? "white" : "none"} stroke={isLiked ? "white" : "currentColor"} strokeWidth="2"/>
                            </svg>
                        )}
                        <span className='action-count'>{formatCount(likeCount)}</span>
                    </button>
                    <button className='action-btn' onClick={handleCommentsClick}>
                        <CommentRounded fontSize='small' />
                        <span>Comment</span>
                    </button>
                </div>
                <button className='action-btn share-btn' onClick={(e) => {
                    e.stopPropagation();
                    onShareClick?.(post);
                }}>
                    <ShareRounded fontSize='small' />
                </button>
            </div>
        </div>
    );
}

function ImagePostContent({ post, onClick }) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const handlePrevImage = (e) => {
        e.stopPropagation();
        setCurrentImageIndex(prev =>
            prev === 0 ? post.mediaUrls.length - 1 : prev - 1
        );
    };

    const handleNextImage = (e) => {
        e.stopPropagation();
        setCurrentImageIndex(prev =>
            prev === post.mediaUrls.length - 1 ? 0 : prev + 1
        );
    };

    const handleDotClick = (e, index) => {
        e.stopPropagation();
        setCurrentImageIndex(index);
    };

    return (
        <div className='post-content'>
            {post.title && <h3 className='post-title'>{post.title}</h3>}
            {post.content && <p className='post-text'>{post.content}</p>}
            {post.mediaUrls && post.mediaUrls.length > 0 && (
                post.mediaUrls.length === 1 ? (
                    <div className='post-media image-media'>
                        <img
                            src={post.mediaUrls[0]}
                            alt={post.title || 'Post image'}
                            onError={(e) => {
                                e.target.src = '/placeholder-image.png';
                            }}
                        />
                    </div>
                ) : (
                    <div className='post-media image-gallery'>
                        <div className='image-carousel'>
                            <button
                                className='carousel-btn carousel-prev'
                                onClick={handlePrevImage}
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="15 18 9 12 15 6" />
                                </svg>
                            </button>

                            <div className='carousel-image-container'>
                                <img
                                    src={post.mediaUrls[currentImageIndex]}
                                    alt={`${post.title || 'Post'} - Image ${currentImageIndex + 1}`}
                                    onError={(e) => {
                                        e.target.src = '/placeholder-image.png';
                                    }}
                                />
                            </div>

                            <button
                                className='carousel-btn carousel-next'
                                onClick={handleNextImage}
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="9 18 15 12 9 6" />
                                </svg>
                            </button>

                            <div className='carousel-indicators'>
                                {post.mediaUrls.map((_, index) => (
                                    <button
                                        key={index}
                                        className={`indicator-dot ${index === currentImageIndex ? 'active' : ''}`}
                                        onClick={(e) => handleDotClick(e, index)}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                )
            )}
            {post.hashtags && post.hashtags.length > 0 && (
                <div className='post-hashtags'>
                    {post.hashtags.map((tag, idx) => (
                        <span key={idx} className='hashtag'>#{tag}</span>
                    ))}
                </div>
            )}
        </div>
    );
}

function VideoPostContent({ post, onClick }) {
  return (
    <div className='post-content'>
      {post.title && <h3 className='post-title'>{post.title}</h3>}
      {post.content && <p className='post-text'>{post.content}</p>}
      {post.mediaUrls && post.mediaUrls.length > 0 && (
        <div className='post-media video-media'>
          <video controls>
            <source src={post.mediaUrls[0]} type='video/mp4' />
            Your browser does not support the video tag.
          </video>
        </div>
      )}
      {post.hashtags && post.hashtags.length > 0 && (
        <div className='post-hashtags'>
          {post.hashtags.map((tag, idx) => (
            <span key={idx} className='hashtag'>#{tag}</span>
          ))}
        </div>
      )}
    </div>
  );
}

function TextPostContent({ post, onClick }) {
  return (
    <div className='post-content'>
      {post.title && <h3 className='post-title'>{post.title}</h3>}
      {post.content && <p className='post-text'>{post.content}</p>}
      {post.hashtags && post.hashtags.length > 0 && (
        <div className='post-hashtags'>
          {post.hashtags.map((tag, idx) => (
            <span key={idx} className='hashtag'>#{tag}</span>
          ))}
        </div>
      )}
    </div>
  );
}

function PollPostContent({ post, onClick }) {
  const [selectedOption, setSelectedOption] = useState(post.userVotedOptionId);
  const totalVotes = post.totalVotes || 0;

  const handleOptionClick = (e, optionIndex) => {
    e.stopPropagation();
    setSelectedOption(optionIndex + 1);
    console.log('Poll option clicked:', optionIndex);
    // TODO: Implement poll voting API call
  };

  const getVotePercentage = (optionIndex) => {
    if (totalVotes === 0) return 0;
    const votes = post.voteCounts?.[optionIndex + 1] || 0;
    return Math.round((votes / totalVotes) * 100);
  };

  return (
    <div className='post-content'>
      {post.title && <h3 className='post-title'>{post.title}</h3>}
      {post.content && <p className='post-text'>{post.content}</p>}
      {post.voteOptions && (
        <div className='poll-options'>
          {post.voteOptions.map((option, index) => {
            const percentage = getVotePercentage(index);
            const isSelected = selectedOption === index + 1;

            return (
              <div
                key={index}
                className={`poll-option ${isSelected ? 'selected' : ''}`}
                onClick={(e) => handleOptionClick(e, index)}
              >
                <div className='poll-option-background'>
                  {selectedOption && (
                    <div
                      className='poll-option-fill'
                      style={{ width: `${percentage}%` }}
                    />
                  )}
                </div>
                <div className='poll-option-content'>
                  <span className='poll-option-text'>{option}</span>
                  {selectedOption && (
                    <span className='poll-option-percentage'>{percentage}%</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {post.hashtags && post.hashtags.length > 0 && (
        <div className='post-hashtags'>
          {post.hashtags.map((tag, idx) => (
            <span key={idx} className='hashtag'>#{tag}</span>
          ))}
        </div>
      )}
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

function formatCount(count) {
  if (count === null || count === undefined) return '0';
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
}
