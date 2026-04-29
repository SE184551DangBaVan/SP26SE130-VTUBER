'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/functions/Auth/useAuth';
import { getPostsByFanHub } from '@/services/PostController';
import { getHubMembers, joinFanHub } from '@/services/MemberController';
import { checkIsMember, getFanHubBySubdomain } from '@/services/FanHubController';
import { showError, showLoading, updateToast } from '@/utils/toastUtils';
import { showSteamSuccess, showSteamError } from '@/utils/SteamNotification';
import { BASE_URL } from '@/config';
import PostDetails from '../PostsPage/PostDetails';
import PostCard from '../PostsPage/PostCard';
import './HubPage.css';
import { GroupRounded } from '@mui/icons-material';

import LoadingImg1 from '../../../assets/Decor/Loading-1.gif'
import LoadingImg2 from '../../../assets/Decor/Loading-2.gif'
import LoadingImg3 from '../../../assets/Decor/loading-3.gif'
import LoadingImg4 from '../../../assets/Decor/loading-4.gif'
import LoadingImg5 from '../../../assets/Decor/Loading-5.gif'
import LoadingImg6 from '../../../assets/Decor/loading-6.gif'

import SpeakerIco from '../../../assets/UI-Elements/announcement.svg'

const loadingImages = [LoadingImg1, LoadingImg2, LoadingImg3, LoadingImg4, LoadingImg5, LoadingImg6];

export default function HubPage({ ownedHub }) {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const subdomainFromParams = params?.subdomain;

  // Generate random loading image on mount
  const [randomLoadingImage, setRandomLoadingImage] = useState(null);

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * loadingImages.length);
    setRandomLoadingImage(loadingImages[randomIndex]);
  }, []);

  // i want the loading screen to appear only once, and never again
  const [firstLoad, setFirstLoad] = useState(false);
  const [hubData, setHubData] = useState(ownedHub || null);
  const [posts, setPosts] = useState([]);
  const [members, setMembers] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [membersLoading, setMembersLoading] = useState(false);
  const [sortOrder, setSortOrder] = useState('latest');

  // State for join fan hub
  const [isMember, setIsMember] = useState(false);
  const [joining, setJoining] = useState(false);

  const [navScrollOffset, setNavScrollOffset] = useState(0);
  const rafRef = useRef(null);
  const scrollPositionRef = useRef(0);

  // Throttled scroll handler using requestAnimationFrame
  useEffect(() => {
    const handleScroll = () => {
      if (rafRef.current) return;

      rafRef.current = requestAnimationFrame(() => {
        const currentScroll = window.scrollY || window.pageYOffset;
        setNavScrollOffset(currentScroll);
        rafRef.current = null;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  // State for create post modal
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);

  // Get current user ID from storage
  const currentUserId = parseInt(
    sessionStorage.getItem("userID") || localStorage.getItem("userID") || "0"
  );
  const currentUsername =
    sessionStorage.getItem("username") || localStorage.getItem("username") || "";

  // Check if current user is the owner of this hub
  const isOwner = hubData && (
    hubData.ownerUserId === currentUserId ||
    hubData.ownerUsername === currentUsername
  );

  // Track current user's role in this hub (for moderators)
  const [roleInHub, setRoleInHub] = useState(null);

  // Check if user can create posts (Owner, Moderator, or Member)
  const canCreatePost = isOwner || roleInHub === 'MODERATOR' || roleInHub === 'MEMBER';

  // Handle create post click
  const handleCreatePostClick = () => {
    if (!canCreatePost) {
      setShowCreatePostModal(true);
    } else {
      // Store the fanHubId in session storage for auto-selection
      sessionStorage.setItem('createPostPreSelectedHub', activeFanHubId);
      // Navigate to create post page
      router.push(`/create-post`);
    }
  };

  // Handle moderation hub click
  const handleModerationClick = () => {
    router.push(`/hub/${hubData.subdomain}/moderation`);
  };

  // Fetch hub data if subdomain is provided via params (not owned hub)
  useEffect(() => {
    if (subdomainFromParams && !ownedHub) {
      const fetchHubData = async () => {
        try {
          const foundHub = await getFanHubBySubdomain(subdomainFromParams);
          if (foundHub) {
            setHubData(foundHub);
          }
        } catch (error) {
          console.error('Error fetching hub data:', error);
        }
      };
      fetchHubData();
    }
  }, [subdomainFromParams, ownedHub]);

  // Determine which fanHubId to use (from fetched hubData or ownedHub)
  const activeFanHubId = hubData?.fanHubId || ownedHub?.fanHubId;

  // Infinite scroll state
  const [hasMore, setHasMore] = useState(true);
  const [serverPage, setServerPage] = useState(0);
  const observer = useRef();

  const fetchPosts = useCallback(async (pageNum, sortBy, append = true) => {
    if (!activeFanHubId) return;

    setPostsLoading(true);
    try {
      const hubPosts = await getPostsByFanHub(activeFanHubId, pageNum, 7, sortBy);

      if (hubPosts.length < 7) {
        setHasMore(false);
      }

      const sortedPosts = [...hubPosts].sort((a, b) => {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        return sortBy === 'createdAt' ? dateB - dateA : dateA - dateB;
      });

      if (sortedPosts.length > 0) {
        if (append && pageNum !== 0) {
          setPosts(prev => [...prev, ...sortedPosts]);
        } else {
          setPosts(sortedPosts);
        }
        setServerPage(pageNum + 1);
      } else if (hubPosts.length === 7) {
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
      setPostsLoading(false);
        setFirstLoad(true);
    }
  }, [activeFanHubId]);

  useEffect(() => {
    const sortBy = sortOrder === 'latest' ? 'createdAt' : 'createdAt';
    setServerPage(0);
    setHasMore(true);
    fetchPosts(0, sortBy);
  }, [activeFanHubId, sortOrder]);

  const lastPostElementRef = useCallback(
    (node) => {
      if (postsLoading) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          const sortBy = sortOrder === 'latest' ? 'createdAt' : 'createdAt';
          fetchPosts(serverPage, sortBy);
        }
      }, { rootMargin: '200px' });

      if (node) observer.current.observe(node);
    },
    [postsLoading, hasMore, serverPage, sortOrder, fetchPosts]
  );

  useEffect(() => {
    const fetchUserMembership = async () => {
      if (!activeFanHubId || !currentUserId) return;
      try {
        const memberData = await checkIsMember(activeFanHubId);

        if (memberData && memberData.isMember) {
          setIsMember(true);
          setRoleInHub(memberData.roleInHub || 'MEMBER');
        } else {
          setIsMember(false);
          setRoleInHub(null);
        }
      } catch (error) {
        console.error('Error fetching user membership:', error);
      }
    };

    fetchUserMembership();
  }, [activeFanHubId, currentUserId, isOwner]);

  useEffect(() => {
    const fetchMembers = async () => {
      if (!activeFanHubId) return;

      if (!isOwner && roleInHub !== 'MODERATOR') {
        return;
      }

      setMembersLoading(true);
      try {
        const membersData = await getHubMembers(activeFanHubId, 0, 50, 'joinedAt');
        setMembers(membersData);
      } catch (error) {
        console.error('Error fetching members:', error);
      } finally {
        setMembersLoading(false);
      }
    };

    fetchMembers();
  }, [activeFanHubId, isOwner, roleInHub]);

  const handleJoinFanHub = async () => {
    if (!activeFanHubId) return;

    setJoining(true);
    const toastId = showLoading('Joining FanHub...');

    try {
      const result = await joinFanHub(activeFanHubId);

      if (result?.success) {
        updateToast(toastId, 'success', 'Joined FanHub successfully!');
        setIsMember(true);
        setRoleInHub('MEMBER');

        window.dispatchEvent(new CustomEvent('hubsUpdated'));
      } else {
        updateToast(toastId, 'error', result?.message || 'Failed to join FanHub');
      }
    } catch (error) {
      console.error('Join error:', error);
      updateToast(toastId, 'error', 'Network error. Please try again.');
    } finally {
      setJoining(false);
    }
  };

  const filteredPosts = posts.filter(post =>
    post.postType === 'IMAGE' || post.postType === 'VIDEO' || post.postType === 'TEXT'
  );

  const handleSortChange = (e) => {
    const value = e.target.value;
    if (value === 'latest') {
      setSortOrder('latest');
    } else if (value === 'oldest') {
      setSortOrder('oldest');
    }
  };

  const handlePostClick = (post) => {
    scrollPositionRef.current = window.scrollY;
    router.push(`/hub/${hubData.subdomain}?id=${post.postId}`, { scroll: false });
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

  if (!hubData) {
    return (
      <div className='hub-page-container'>
        <div className='posts-loading'>
          LOADING
          {randomLoadingImage && (
            <img
              className='loading-animation'
              src={randomLoadingImage.src}
              alt=""
              onError={(e) => {
                e.target.src = "/picture-not-available-photo.jpg";
              }}
            />
          )}
          <div className="loading-wrapper">
            <div className="loading-circle"></div>
            <div className="loading-circle"></div>
            <div className="loading-circle"></div>
            <div className="loading-shadow"></div>
            <div className="loading-shadow"></div>
            <div className="loading-shadow"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='hub-page-container' >
      <div
        className='hub-banner'
        style={{
          height: `calc(450px - ${navScrollOffset*0.65}px)`,
          backgroundImage: hubData.bannerUrl ? `url(${hubData.bannerUrl})` : '#75a4c8',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          borderBottom: hubData.themeColor ? `4px solid ${hubData.themeColor}` : '4px solid #ccc',
        }}
      >
        <div className='hub-banner-overlay'>
          <div className='hub-header-content' 
            style={{ height: `calc(470px - ${navScrollOffset*0.65}px)`}}>
            <div className='hub-header-left'>
              <img
                className='hub-avatar'
                src={hubData.avatarUrl || '/profile-pic-undefined.jpg'}
                alt={hubData.hubName}
                onError={(e) => {
                  e.target.src = '/profile-pic-undefined.jpg';
                }}
                style={{border: hubData.themeColor ? `4px solid ${hubData.themeColor}` : '4px solid #ccc'}}
              />
              <div className='hub-title-section'>
                <h1 className='hub-name'>{hubData.hubName}</h1>
                <p className='hub-subdomain'>{hubData.subdomain}</p>
                <div className='hub-owner-info'>
                  <span>Owned by </span>
                  <span 
                    className='owner-username'
                    onClick={() => router.push(`/user/${hubData.ownerUsername}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    {hubData.ownerDisplayName || hubData.ownerUsername}
                  </span>
                </div>
              </div>
            </div>
            <div className='hub-header-actions'>
              {(roleInHub === 'MODERATOR' || roleInHub === 'VTUBER') && (
                <button
                  className='moderation-header-btn'
                  onClick={handleModerationClick}
                  title='Moderation Hub'
                >
                  <span>Mod Tools</span>
                </button>
              )}
              <button
                className='create-post-header-btn'
                onClick={handleCreatePostClick}
                title='Create Post'
              >
                <span className='btn-icon'>+</span>
                <span>Create Post</span>
              </button>
              {isOwner && (
                <button
                  className='create-announcement-header-btn'
                  onClick={() => {
                    sessionStorage.setItem('createPostPreSelectedHub', activeFanHubId);
                    router.push('/create-announcement');
                  }}
                  title='Create Announcement'
                >
                  <img className='btn-icon' src={SpeakerIco.src} alt='Announce'/>
                </button>
              )}
              {!isOwner && !isMember && (
                <button
                  className='join-fanhub-btn header-join-btn'
                  onClick={handleJoinFanHub}
                  disabled={joining}
                  style={{background: hubData.themeColor}}
                >
                  {joining ? (
                    <>
                      <span className='spinner' />
                      Joining...
                    </>
                  ) : (
                    <>
                      <GroupRounded fontSize='small' />
                      Join
                    </>
                  )}
                </button>
              )}
              {!isOwner && isMember && (
                <button
                  className='joined-badge'
                  disabled
                  style={{background: hubData.themeColor, pointerEvents: 'none', opacity: '0.4'}}
                >
                  <GroupRounded fontSize='small' />
                  Joined
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className='hub-content-wrapper'>
        <div className='hub-main-content'>
          <div className='posts-sort-bar'>
            <div className='sort-controls'>
              <label>Sort by:</label>
              <select value={sortOrder} onChange={handleSortChange} className='sort-select'>
                <option value='latest'>Latest</option>
                <option value='oldest'>Oldest</option>
              </select>
            </div>
            <div className='post-type-filter'>
              <span className='filter-label'>Showing:</span>
              <span className='filter-value'>IMAGE & VIDEO posts</span>
            </div>
          </div>

          {(postsLoading && !firstLoad) ? (
            <div className='posts-loading'>
              LOADING POSTS
              {randomLoadingImage && (
                <img
                  className='loading-animation'
                  src={randomLoadingImage.src}
                  alt=""
                  onError={(e) => {
                    e.target.src = "/picture-not-available-photo.jpg";
                  }}
                />
              )}
              <div className="loading-wrapper">
                <div className="loading-circle"></div>
                <div className="loading-circle"></div>
                <div className="loading-circle"></div>
                <div className="loading-shadow"></div>
                <div className="loading-shadow"></div>
                <div className="loading-shadow"></div>
              </div>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className='no-posts'>
              <p>No Posts Yet.</p>
            </div>
          ) : (
            <>
              {filteredPosts.map((post, index) => {
                if (filteredPosts.length === index + 1) {
                  return (
                    <div ref={lastPostElementRef} key={post.postId}>
                      <PostCard
                        post={post}
                        hubData={hubData}
                        variant="hub"
                        onClick={() => handlePostClick(post)}
                        onCommentsClick={() => handlePostClick(post)}
                        onShareClick={() => handleShareClick(post)}
                      />
                    </div>
                  );
                } else {
                  return (
                    <PostCard
                      key={post.postId}
                      post={post}
                      hubData={hubData}
                      variant="hub"
                      onClick={() => handlePostClick(post)}
                      onCommentsClick={() => handlePostClick(post)}
                      onShareClick={() => handleShareClick(post)}
                    />
                  );
                }
              })}
              {postsLoading && (
                <div className='infinite-scroll-loader'>Loading more posts...</div>
              )}
              {!postsLoading && !hasMore && filteredPosts.length > 0 && (
                <div className='no-more-posts-message'>
                  That's all for now, there'll be more soon! ✨
                </div>
              )}
            </>
          )}
        </div>

        <div className='hub-status'>
          <div className='hub-card'>
            <div className='hub-card-header'>
              <span>About Community</span>
            </div>
            <div className='hub-card-body'>
              <p className='hub-description'>{hubData.description || 'No description provided.'}</p>
              <div className='hub-stats'>
                <div className='stat-item'>
                  <span className='stat-label'>Members</span>
                  <span className='stat-value'>{hubData.memberCount ?? members.length ?? 'N/A'}</span>
                </div>
                <div className='stat-item'>
                  <span className='stat-label'>Categories</span>
                  <div className='categories-list'>
                    {hubData.categories?.map((cat, idx) => (
                      <span key={idx} className='category-tag'>{cat}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className='hub-card'>
            <div className='hub-card-header'>
              <span>FanHub Settings</span>
            </div>
            <div className='hub-card-body'>
              <div className='setting-row'>
                <span>Privacy:</span>
                <span className='setting-value'>{hubData.isPrivate ? 'Private' : 'Public'}</span>
              </div>
              <div className='setting-row'>
                <span>Approval Required:</span>
                <span className='setting-value'>{hubData.requiresApproval ? 'Yes' : 'No'}</span>
              </div>
              <div className='setting-row'>
                <span>Created:</span>
                <span className='setting-value'>
                  {new Date(hubData.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {(isOwner || roleInHub === 'MODERATOR') && (
            <div className='hub-card fanhub-member-list'>
              <div className='hub-card-header'>
                <span>Members ({members.length})</span>
              </div>
              <div className='hub-card-body'>
                {membersLoading ? (
                  <div className='members-loading'>Loading members...</div>
                ) : members.length === 0 ? (
                  <p className='no-members-text'>No members yet.</p>
                ) : (
                  <div className='members-list'>
                    {members.map((member) => {
                      const isAlreadyModerator = member.roleInHub === 'MODERATOR';
                      return (
                        <div key={member.id} className='member-item'>
                          <img
                            className='member-avatar'
                            src={member.avatarUrl || '/profile-pic-undefined.jpg'}
                            alt={member.displayName}
                            onError={(e) => {
                              e.target.src = '/profile-pic-undefined.jpg';
                            }}
                          />
                          <div className='member-info'>
                            <span className='member-display-name'>{member.displayName}</span>
                            <span className='member-username'>@{member.username}</span>
                            <span className='member-role'>{member.roleInHub}</span>
                          </div>
                          <div className='member-tooltip'>
                            <div><strong>Score:</strong> {member.fanHubScore}</div>
                            <div><strong>Joined:</strong> {new Date(member.joinedAt).toLocaleDateString('en-GB', {
                                                            day: '2-digit',
                                                            month: '2-digit',
                                                            year: 'numeric'
                                                          })}
                            </div>
                            <div><strong>Status:</strong> {member.status}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Post Details Modal - triggered by URL params */}
      {(searchParams.get('id') || searchParams.get('shareId')) && (
        <PostDetails
          scrollPositionRef={scrollPositionRef}
        />
      )}

      {/* Join to Post Modal */}
      {showCreatePostModal && (
        <div className='modal-overlay' onClick={() => setShowCreatePostModal(false)}>
          <div className='modal-content join-to-post-modal' onClick={(e) => e.stopPropagation()}>
            <div className='modal-header'>
              <h2>Join to Post</h2>
              <button className='modal-close' onClick={() => setShowCreatePostModal(false)}>×</button>
            </div>

            <div className='modal-body'>
              <div className='join-to-post-icon'>
                <GroupRounded fontSize='large' />
              </div>
              <p className='modal-description'>
                You Must Be a Member to Post.
              </p>
              <p className='modal-note'>
                Become part of the community and share your thoughts!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
