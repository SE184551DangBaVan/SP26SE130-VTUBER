'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useSideBar } from '@/contexts/SideBarContext';
import { getUserById } from '@/services/UserController';
import { getAnnouncementsAndEvents } from '@/services/PostController';
import { ChevronLeft, ChevronRight, EventRounded } from '@mui/icons-material';
import UserAvatar from '@/components/UserAvatar/UserAvatar';
import './NewsPage.css';

import TagIco from '../../../assets/UI-Elements/tag-duotone.svg'

export default function NewsPage() {
  const { sideBarRetractor } = useSideBar();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const selectedFanHubId = params?.fanHubId ? parseInt(params.fanHubId) : null;
  const selectedPostId = params?.postId ? parseInt(params.postId) : null;

  const [joinedHubs, setJoinedHubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [allAnnouncements, setAllAnnouncements] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Fetch joined hubs on mount
  useEffect(() => {
    const fetchJoinedHubs = async () => {
      try {
        const userId = localStorage.getItem('userID') || sessionStorage.getItem('userID');
        if (!userId) {
          setLoading(false);
          return;
        }

        const userData = await getUserById(userId);
        if (userData && userData.fanHubsJoined) {
          setJoinedHubs(userData.fanHubsJoined);
        }
      } catch (error) {
        console.error('Error fetching joined hubs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchJoinedHubs();
  }, []);

  // Fetch announcements for all joined hubs
  useEffect(() => {
    const fetchAllAnnouncements = async () => {
      if (joinedHubs.length === 0) return;

      try {
        const promises = joinedHubs.map(hub => 
          getAnnouncementsAndEvents(hub.fanHubId, 0, 100, 'createdAt')
            .then(posts => posts.map(post => ({ ...post, fanHubThemeColor: hub.themeColor, fanHubAvatarUrl: hub.avatarUrl })))
        );

        const results = await Promise.all(promises);
        const flattened = results.flat();

        // Sort by createdAt descending
        const sorted = flattened.sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        );

        setAllAnnouncements(sorted);
      } catch (error) {
        console.error('Error fetching announcements:', error);
      }
    };

    fetchAllAnnouncements();
  }, [joinedHubs]);

  // Set selected post from URL params or default to most recent
  useEffect(() => {
    if (allAnnouncements.length === 0) return;

    if (selectedPostId) {
      const found = allAnnouncements.find(p => p.postId === selectedPostId);
      if (found) {
        setSelectedPost(found);
        setCurrentImageIndex(0);
      }
    } else {
      // Default to most recent post
      setSelectedPost(allAnnouncements[0]);
      setCurrentImageIndex(0);
    }
  }, [allAnnouncements, selectedPostId]);

  // Other news = all posts except the currently selected one
  const otherNews = allAnnouncements.filter(post => 
    selectedPost ? post.postId !== selectedPost.postId : true
  );

  // Handle post click
  const handlePostClick = (post) => {
    router.push(`/news-feed/${post.fanHubId}/${post.postId}`);
  };

  // Image carousel handlers
  const handlePrevImage = () => {
    if (!selectedPost?.mediaUrls || selectedPost.mediaUrls.length <= 1) return;
    setCurrentImageIndex(prev => 
      prev === 0 ? selectedPost.mediaUrls.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    if (!selectedPost?.mediaUrls || selectedPost.mediaUrls.length <= 1) return;
    setCurrentImageIndex(prev => 
      prev === selectedPost.mediaUrls.length - 1 ? 0 : prev + 1
    );
  };

  // Format time ago
  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className={`news-feed-page-container ${!sideBarRetractor ? 'sidebar-retracted' : 'sidebar-expanded'}`}>
        <div className='news-loading'>Loading news...</div>
      </div>
    );
  }

  if (allAnnouncements.length === 0) {
    return (
      <div className={`news-feed-page-container ${!sideBarRetractor ? 'sidebar-retracted' : 'sidebar-expanded'}`}>
        <div className='news-empty'>
          <h2>No Announcements Yet</h2>
          <p>There are no announcements or events from your joined hubs.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`news-feed-page-container ${!sideBarRetractor ? 'sidebar-retracted' : 'sidebar-expanded'}`}>
      <div className='news-feed-layout'>
        {selectedPost && (
          <div className='news-main-content' style={{ backgroundColor: selectedPost.fanHubThemeColor + '08' }}>
            <div className='news-hub-header'>
              <UserAvatar 
                avatarUrl={selectedPost.authorAvatarUrl} 
                size="medium"
                className='news-hub-avatar'
              />
              <h2 className='news-hub-name'>{selectedPost.authorDisplayName}</h2>
              <span className='author-time'>{formatTimeAgo(selectedPost.createdAt)}</span>
            </div>
            
            <h1 className='news-announcement-title' style={{ color: selectedPost.fanHubThemeColor }}>
              {selectedPost.title}
            </h1>

            {selectedPost.hashtags && selectedPost.hashtags.length > 0 && (
              <div className='news-tags'>
                <span className='tags-label'>Tags:</span>
                {selectedPost.hashtags.map((tag, idx) => (
                  <span key={idx} className='news-tag-pill'>
                    <span className='tag-name'>{tag}</span>
                    <span className='tag-icon-bg'>
                      <img src={TagIco.src} alt='tag' className='tag-icon' />
                    </span>
                  </span>
                ))}
              </div>
            )}
            
            {selectedPost.mediaUrls && selectedPost.mediaUrls.length > 0 && (
              <div className='news-image-carousel'>
                {selectedPost.mediaUrls.length > 1 && (
                  <button className='carousel-btn carousel-prev' onClick={handlePrevImage}>
                    <ChevronLeft />
                  </button>
                )}

                <div className='carousel-image-wrapper'>
                  {selectedPost.postType === 'VIDEO' ? (
                    <video controls className='news-carousel-image'>
                      <source src={selectedPost.mediaUrls[0]} type='video/mp4' />
                    </video>
                  ) : (
                    <img 
                      src={selectedPost.mediaUrls[currentImageIndex]} 
                      alt={selectedPost.title}
                      className='news-carousel-image'
                    />
                  )}
                </div>

                {selectedPost.mediaUrls.length > 1 && (
                  <button className='carousel-btn carousel-next' onClick={handleNextImage}>
                    <ChevronRight />
                  </button>
                )}

                {selectedPost.mediaUrls.length > 1 && (
                  <div className='carousel-dots'>
                    {selectedPost.mediaUrls.map((_, idx) => (
                      <span 
                        key={idx} 
                        className={`dot ${idx === currentImageIndex ? 'active' : ''}`}
                        style={{ backgroundColor: idx === currentImageIndex ? selectedPost.fanHubThemeColor : '#ccc' }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {selectedPost.content && (
              <div className='news-content'>
                <p>{selectedPost.content}</p>
              </div>
            )}

            {selectedPost.appendSchedule && (
              <div className='news-schedule-display'>
                <EventRounded className='schedule-icon' />
                <div className='schedule-info'>
                  <span className='schedule-label'>Scheduled</span>
                  <span className='schedule-date'>{new Date(selectedPost.appendSchedule).toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>
        )}

        <div className='news-sidebar'>
          <h3 className='sidebar-title'>Other News</h3>
          <div className='other-news-list'>
            {otherNews.map((post) => (
              <div 
                key={post.postId} 
                className={`other-news-item ${selectedPost?.postId === post.postId ? 'active' : ''}`}
                onClick={() => handlePostClick(post)}
                style={{ borderLeftColor: selectedPost?.postId === post.postId ? post.fanHubThemeColor : 'transparent' }}
              >
                <div className='other-news-content'>
                  <h4 className='other-news-title'>{post.title}</h4>
                  <div className='other-news-meta'>
                    <UserAvatar 
                      avatarUrl={post.authorAvatarUrl} 
                      size="small"
                      className='other-news-avatar'
                    />
                    <span className='other-news-time'>{formatTimeAgo(post.createdAt)}</span>
                  </div>
                </div>
                <div 
                  className='other-news-thumbnail'
                  style={{ backgroundColor: post.fanHubThemeColor + '40' }}
                >
                  {post.mediaUrls && post.mediaUrls.length > 0 && (
                    <img src={post.mediaUrls[0]} alt={post.title} />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
