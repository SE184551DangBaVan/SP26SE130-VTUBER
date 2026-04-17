'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/functions/Auth/useAuth';
import { getUserById } from '@/services/UserController';
import { getPostsByFanHub } from '@/services/PostController';
import { getHubMembers, setModerator, joinFanHub } from '@/services/MemberController';
import { uploadImages, checkIsMember, getFanHubBySubdomain } from '@/services/FanHubController';
import { updateFanHub } from '@/services/FanHubController';
import { showError, showLoading, updateToast } from '@/utils/toastUtils';
import PostDetails from '../PostsPage/PostDetails';
import PostCard from '../PostsPage/PostCard';
import './HubPage.css';
import { GroupRounded, EditRounded, Shield } from '@mui/icons-material';

import LoadingImg1 from '../../../assets/Decor/Loading-1.gif'
import LoadingImg2 from '../../../assets/Decor/Loading-2.gif'
import LoadingImg3 from '../../../assets/Decor/loading-3.gif'
import LoadingImg4 from '../../../assets/Decor/loading-4.gif'
import LoadingImg5 from '../../../assets/Decor/Loading-5.gif'
import LoadingImg6 from '../../../assets/Decor/loading-6.gif'

import SpeakerIco from '../../../assets/UI-Elements/announcement.svg'

const loadingImages = [LoadingImg1, LoadingImg2, LoadingImg3, LoadingImg4, LoadingImg5, LoadingImg6];

export default function HubPage({ ownedHub }) {
  const { userAuth } = useAuth();
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

  // State for promote modal
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [promoting, setPromoting] = useState(false);

  // State for join fan hub
  const [isMember, setIsMember] = useState(false);
  const [joining, setJoining] = useState(false);

  // State for edit images modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [bannerFile, setBannerFile] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [backgroundFiles, setBackgroundFiles] = useState([]);
  const [bannerPreview, setBannerPreview] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [backgroundPreviews, setBackgroundPreviews] = useState([]);
  const [uploading, setUploading] = useState(false);

  // State for hub info editing
  const [editHubName, setEditHubName] = useState('');
  const [editSubdomain, setEditSubdomain] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editThemeColor, setEditThemeColor] = useState('#555');
  const [editCategories, setEditCategories] = useState([]);
  const [editIsPrivate, setEditIsPrivate] = useState(false);
  const [editRequiresApproval, setEditRequiresApproval] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const [navScrollOffset, setNavScrollOffset] = useState(0);
  const rafRef = useRef(null);
  const lastScrollValue = useRef(0);
  const scrollPositionRef = useRef(0);

  // Throttled scroll handler using requestAnimationFrame
  useEffect(() => {
    const handleScroll = () => {
      if (rafRef.current) return;

      rafRef.current = requestAnimationFrame(() => {
        const currentScroll = window.scrollY || window.pageYOffset;
        if (Math.abs(currentScroll - lastScrollValue.current) > 2) {
          lastScrollValue.current = currentScroll;
          setNavScrollOffset(currentScroll);
        }
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
  const [userRoleInHub, setUserRoleInHub] = useState(null);

  // Check if user can create posts (Owner, Moderator, or Member)
  // Note: userRoleInHub will be set from fanHubsJoined, so this should work correctly
  const canCreatePost = isOwner || userRoleInHub === 'MODERATOR' || userRoleInHub === 'MEMBER';

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
        // Use checkIsMember to get the user's role in this hub
        const memberData = await checkIsMember(activeFanHubId);


        if (memberData && memberData.isMember) {
          setIsMember(true);
          setUserRoleInHub(memberData.roleInHub || 'MEMBER');
        } else {
          setIsMember(false);
          setUserRoleInHub(null);
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

      // Only fetch members if user is Owner or Moderator (others get 403)
      if (!isOwner && userRoleInHub !== 'MODERATOR') {
        return;
      }

      setMembersLoading(true);
      try {
          // currently fetches 50 at once and no pagination
        const membersData = await getHubMembers(activeFanHubId, 0, 50, 'joinedAt');
        setMembers(membersData);
      } catch (error) {
        console.error('Error fetching members:', error);
      } finally {
        setMembersLoading(false);
      }
    };

    fetchMembers();
  }, [activeFanHubId, isOwner, userRoleInHub]);

  // Handle promote member to moderator
  const handlePromoteClick = (member) => {
    setSelectedMember(member);
    setShowPromoteModal(true);
  };

  const handlePromoteConfirm = async () => {
    if (!selectedMember || !activeFanHubId) return;

    setPromoting(true);
    try {
      const result = await setModerator(activeFanHubId, [selectedMember.id]);

      if (result?.success) {
        // Update the member's role in the local state
        setMembers(prev => prev.map(m =>
          m.id === selectedMember.id
            ? { ...m, roleInHub: 'MODERATOR' }
            : m
        ));
        setShowPromoteModal(false);
        setSelectedMember(null);
      } else {
        alert(result?.message || 'Failed to promote member');
      }
    } catch (error) {
      console.error('Promote error:', error);
      alert('Failed to promote member');
    } finally {
      setPromoting(false);
    }
  };

  const handlePromoteCancel = () => {
    setShowPromoteModal(false);
    setSelectedMember(null);
  };

  const handleJoinFanHub = async () => {
    if (!activeFanHubId) return;

    setJoining(true);
    const toastId = showLoading('Joining FanHub...');

    try {
      const result = await joinFanHub(activeFanHubId);

      if (result?.success) {
        updateToast(toastId, 'success', 'Joined FanHub successfully!');
        setIsMember(true);
        setUserRoleInHub('MEMBER');

        // Dispatch event to update sidebar's JoinedHubsContainer
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

  // Convert file to base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  // Handle banner file change
  const handleBannerChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setBannerFile(file);
      const base64 = await fileToBase64(file);
      setBannerPreview(base64);
    }
  };

  // Handle avatar file change
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      const base64 = await fileToBase64(file);
      setAvatarPreview(base64);
    }
  };

  // Handle background files change (max 4)
  const handleBackgroundChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      // Limit to max 4 images
      const limitedFiles = files.slice(0, 4);
      setBackgroundFiles(limitedFiles);
      const previews = await Promise.all(limitedFiles.map(file => fileToBase64(file)));
      setBackgroundPreviews(previews);
    }
  };

  // Remove background image
  const removeBackgroundImage = (index) => {
    setBackgroundFiles(prev => prev.filter((_, i) => i !== index));
    setBackgroundPreviews(prev => prev.filter((_, i) => i !== index));
  };

  // Handle edit button click
  const handleEditClick = () => {
    // Populate form with current hub data
    setEditHubName(hubData.hubName || '');
    setEditSubdomain(hubData.subdomain || '');
    setEditDescription(hubData.description || '');
    setEditThemeColor(hubData.themeColor || '#555');
    setEditCategories(hubData.categories || []);
    setEditIsPrivate(hubData.isPrivate || false);
    setEditRequiresApproval(hubData.requiresApproval || false);

    // Reset image uploads
    setBannerFile(null);
    setAvatarFile(null);
    setBackgroundFiles([]);
    setBannerPreview(null);
    setAvatarPreview(null);
    setBackgroundPreviews([]);
    setHasChanges(false);
    setShowEditModal(true);
  };

  // Handle edit modal close
  const handleEditClose = () => {
    setShowEditModal(false);
    setBannerFile(null);
    setAvatarFile(null);
    setBackgroundFiles([]);
    setBannerPreview(null);
    setAvatarPreview(null);
    setBackgroundPreviews([]);
    setEditHubName('');
    setEditSubdomain('');
    setEditDescription('');
    setEditThemeColor('#555');
    setEditCategories([]);
    setEditIsPrivate(false);
    setEditRequiresApproval(false);
    setHasChanges(false);
  };

  // Toggle category in edit form
  const toggleEditCategory = (cat) => {
    setEditCategories((prev) =>
      prev.includes(cat)
        ? prev.filter((c) => c !== cat)
        : [...prev, cat]
    );
  };

  // Check if any changes have been made
  useEffect(() => {
    if (!showEditModal) return;

    const hubInfoChanged =
      editHubName !== hubData.hubName ||
      editSubdomain !== hubData.subdomain ||
      editDescription !== hubData.description ||
      editThemeColor !== hubData.themeColor ||
      JSON.stringify(editCategories) !== JSON.stringify(hubData.categories) ||
      editIsPrivate !== hubData.isPrivate ||
      editRequiresApproval !== hubData.requiresApproval;

    const imagesSelected = bannerFile || avatarFile || backgroundFiles.length > 0;

    setHasChanges(hubInfoChanged || imagesSelected);
  }, [editHubName, editSubdomain, editDescription, editThemeColor, editCategories, editIsPrivate, editRequiresApproval, bannerFile, avatarFile, backgroundFiles, showEditModal]);

  // Handle save changes (hub info + images)
  const handleSaveEdit = async () => {
    setUploading(true);
    const toastId = showLoading('Saving changes...');

    try {
      // Step 1: Update hub info if there are changes
      const hubInfoChanged =
        editHubName !== hubData.hubName ||
        editSubdomain !== hubData.subdomain ||
        editDescription !== hubData.description ||
        editThemeColor !== hubData.themeColor ||
        JSON.stringify(editCategories) !== JSON.stringify(hubData.categories) ||
        editIsPrivate !== hubData.isPrivate ||
        editRequiresApproval !== hubData.requiresApproval;

      if (hubInfoChanged) {
        const updatePayload = {
          hubName: editHubName || hubData.hubName,
          subdomain: editSubdomain || hubData.subdomain,
          description: editDescription || hubData.description,
          themeColor: editThemeColor || hubData.themeColor,
          category: editCategories.length > 0 ? editCategories : hubData.categories,
          isPrivate: editIsPrivate,
          requiresApproval: editRequiresApproval,
        };

        const updateRes = await updateFanHub(activeFanHubId, updatePayload);

        if (!updateRes?.success) {
          updateToast(toastId, 'error', updateRes?.message || 'Failed to update hub info');
          setUploading(false);
          return;
        }
      }

      // Step 2: Upload images if any selected
      const imagesSelected = bannerFile || avatarFile || backgroundFiles.length > 0;

      if (imagesSelected) {
        const backgroundsToUpload = backgroundFiles.slice(0, 4);

        const uploadRes = await uploadImages(
          activeFanHubId,
          bannerFile,
          avatarFile,
          backgroundsToUpload
        );

        if (!uploadRes?.success) {
          updateToast(toastId, 'error', uploadRes?.data || 'Failed to upload images');
          setUploading(false);
          return;
        }
      }

      updateToast(toastId, 'success', 'Hub updated successfully!');

      // Refresh hub data to show updates
      const { getFanHubs } = await import('@/services/FanHubController');
      const hubs = await getFanHubs();
      const updatedHub = hubs.find(h =>
        h.fanHubId === activeFanHubId ||
        h.ownerUsername === hubData.ownerUsername
      );

      if (updatedHub) {
        setHubData(updatedHub);
      }

      handleEditClose();
    } catch (error) {
      console.error('Save error:', error);
      updateToast(toastId, 'error', 'Network error. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // Filter posts by type (IMAGE, VIDEO for now)
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

  // Handle post click - navigate to hub page with post id in URL
  const handlePostClick = (post) => {
    scrollPositionRef.current = window.scrollY;
    router.push(`/hub/${hubData.subdomain}?id=${post.postId}`, { scroll: false });
  };

  // Show loading if no hub data
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
                  <span className='owner-username'>{hubData.ownerDisplayName || hubData.ownerUsername}</span>
                </div>
              </div>
            </div>
            <div className='hub-header-actions'>
              {(userRoleInHub === 'MODERATOR' || userRoleInHub === 'VTUBER') && (
                <button
                  className='moderation-header-btn'
                  onClick={handleModerationClick}
                  title='Moderation Hub'
                >
                  <Shield fontSize='small' />
                  <span>Moderation</span>
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
              {isOwner && (
                <button className='edit-banner-btn' onClick={handleEditClick} title='Edit banner and avatar'>
                  <EditRounded fontSize='small' />
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

          {(isOwner || userRoleInHub === 'MODERATOR') && (
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
                          {isOwner && !isAlreadyModerator && (
                            <button
                              className='promote-btn'
                              onClick={() => handlePromoteClick(member)}
                              style={{background: `${hubData.themeColor}`}}
                            >
                              <span>Promote</span>
                            </button>
                          )}
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
      {searchParams.get('id') && (
        <PostDetails
          scrollPositionRef={scrollPositionRef}
        />
      )}

      {/* Promote to Moderator Modal */}
      {showPromoteModal && selectedMember && (
        <div className='modal-overlay' onClick={handlePromoteCancel}>
          <div className='modal-content promote-modal' onClick={(e) => e.stopPropagation()}>
            <div className='modal-header'>
              <h2>Promote to Moderator</h2>
              <button className='modal-close' onClick={handlePromoteCancel}>×</button>
            </div>

            <div className='modal-body'>
              <p className='modal-description'>
                Set <strong>{selectedMember.displayName}</strong> (@{selectedMember.username}) as a moderator?
              </p>
              <p className='modal-note'>
                Moderators can help manage the hub and its members.
              </p>
            </div>

            <div className='modal-footer'>
              <button
                className='confirm-btn stylised-btn'
                onClick={handlePromoteConfirm}
                disabled={promoting}
              >
                {promoting ? (
                  <span className='stylised-text'>
                    <span className='spinner' />
                    Promoting...
                  </span>
                ) : (
                  <span className='stylised-text'>Confirm</span>
                )}
              </button>
            </div>
          </div>
        </div>
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

      {/* Edit Hub Modal */}
      {showEditModal && (
        <div className='modal-overlay' onClick={handleEditClose}>
          <div className='modal-content edit-hub-modal' onClick={(e) => e.stopPropagation()}>
            <div className='modal-header'>
              <h2>Edit FanHub</h2>
              <button className='modal-close' onClick={handleEditClose}>×</button>
            </div>

            <div className='modal-body'>
              <div className='edit-hub-form'>
                {/* Hub Info Section */}
                <div className='edit-section'>
                  <h3>Hub Information</h3>

                  <div className='form-group'>
                    <label htmlFor='edit-hub-name'>Hub Name</label>
                    <input
                      type='text'
                      id='edit-hub-name'
                      value={editHubName}
                      onChange={(e) => setEditHubName(e.target.value)}
                      placeholder='Enter hub name'
                    />
                  </div>

                  <div className='form-group'>
                    <label htmlFor='edit-subdomain'>Subdomain</label>
                    <input
                      type='text'
                      id='edit-subdomain'
                      value={editSubdomain}
                      onChange={(e) => setEditSubdomain(e.target.value)}
                      placeholder='@YourHub'
                    />
                  </div>

                  <div className='form-group'>
                    <label htmlFor='edit-description'>Description</label>
                    <textarea
                      id='edit-description'
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder='Describe your hub...'
                      rows='4'
                    />
                  </div>

                  <div className='form-group'>
                    <label htmlFor='edit-theme-color'>Theme Color</label>
                    <div className='color-picker-wrapper'>
                      <input
                        type='color'
                        id='edit-theme-color'
                        value={editThemeColor}
                        onChange={(e) => setEditThemeColor(e.target.value)}
                      />
                      <span className='color-value'>{editThemeColor}</span>
                    </div>
                  </div>

                  <div className='form-group'>
                    <label>Categories</label>
                    <div className='category-select'>
                      {['Game', 'Just Chatting', 'Music', 'ASMR', 'Cooking', 'Art', 'Cosplay'].map((cat) => (
                        <button
                          key={cat}
                          type='button'
                          className={`category-chip ${editCategories.includes(cat) ? 'active' : ''}`}
                          onClick={() => toggleEditCategory(cat)}
                        >
                          {cat}
                          {editCategories.includes(cat) && (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className='chip-check'>
                              <path d="M20 6L9 17l-5-5" />
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className='form-group checkbox-group'>
                    <label className='checkbox-label'>
                      <input
                        type='checkbox'
                        checked={editIsPrivate}
                        onChange={(e) => setEditIsPrivate(e.target.checked)}
                      />
                      <span>Private Hub</span>
                    </label>
                  </div>

                  <div className='form-group checkbox-group'>
                    <label className='checkbox-label'>
                      <input
                        type='checkbox'
                        checked={editRequiresApproval}
                        onChange={(e) => setEditRequiresApproval(e.target.checked)}
                      />
                      <span>Requires Approval</span>
                    </label>
                  </div>
                </div>

                {/* Images Section */}
                <div className='edit-section'>
                  <h3>Images</h3>

                  <div className='image-upload-group'>
                    <label htmlFor='edit-banner-upload'>Banner Image</label>
                    <div className='image-upload-wrapper'>
                      <input
                        type='file'
                        id='edit-banner-upload'
                        accept='image/*'
                        onChange={handleBannerChange}
                        className='image-upload-input'
                      />
                      <label htmlFor='edit-banner-upload' className='image-upload-btn'>
                        <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' className='upload-icon'>
                          <rect x='3' y='3' width='18' height='18' rx='2' ry='2' />
                          <circle cx='8.5' cy='8.5' r='1.5' />
                          <polyline points='21 15 16 10 5 21' />
                        </svg>
                        {bannerFile ? 'Change Banner' : 'Upload Banner'}
                      </label>
                      {bannerFile && (
                        <span className='image-file-name'>{bannerFile.name}</span>
                      )}
                    </div>
                    {bannerPreview && (
                      <div className='image-preview banner-preview'>
                        <img src={bannerPreview} alt='Banner preview' />
                      </div>
                    )}
                  </div>

                  <div className='image-upload-group'>
                    <label htmlFor='edit-avatar-upload'>Avatar Image</label>
                    <div className='image-upload-wrapper'>
                      <input
                        type='file'
                        id='edit-avatar-upload'
                        accept='image/*'
                        onChange={handleAvatarChange}
                        className='image-upload-input'
                      />
                      <label htmlFor='edit-avatar-upload' className='image-upload-btn'>
                        <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' className='upload-icon'>
                          <rect x='3' y='3' width='18' height='18' rx='2' ry='2' />
                          <circle cx='8.5' cy='8.5' r='1.5' />
                          <polyline points='21 15 16 10 5 21' />
                        </svg>
                        {avatarFile ? 'Change Avatar' : 'Upload Avatar'}
                      </label>
                      {avatarFile && (
                        <span className='image-file-name'>{avatarFile.name}</span>
                      )}
                    </div>
                    {avatarPreview && (
                      <div className='image-preview avatar-preview'>
                        <img src={avatarPreview} alt='Avatar preview' />
                      </div>
                    )}
                  </div>

                  <div className='image-upload-group'>
                    <label htmlFor='edit-background-upload'>Background Images</label>
                    <span className='field-hint'>Add background images (max 4)</span>
                    <div className='image-upload-wrapper'>
                      <input
                        type='file'
                        id='edit-background-upload'
                        accept='image/*'
                        multiple
                        onChange={handleBackgroundChange}
                        className='image-upload-input'
                      />
                      <label htmlFor='edit-background-upload' className='image-upload-btn'>
                        <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' className='upload-icon'>
                          <rect x='3' y='3' width='18' height='18' rx='2' ry='2' />
                          <circle cx='8.5' cy='8.5' r='1.5' />
                          <polyline points='21 15 16 10 5 21' />
                        </svg>
                        {backgroundFiles.length > 0 ? 'Change Images' : 'Upload Backgrounds'}
                      </label>
                    </div>
                    {backgroundPreviews.length > 0 && (
                      <div className='explore-preview-grid'>
                        {backgroundPreviews.map((preview, index) => (
                          <div key={index} className='explore-preview-item'>
                            <img src={preview} alt={`Background ${index + 1}`} />
                            <button
                              type='button'
                              className='remove-image-btn'
                              onClick={() => removeBackgroundImage(index)}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className='modal-footer'>
              <button
                className='cancel-btn stylised-btn cancel'
                onClick={handleEditClose}
                disabled={uploading}
              >
                <span className='stylised-text'>Cancel</span>
              </button>
              <button
                className='confirm-btn stylised-btn'
                onClick={handleSaveEdit}
                disabled={uploading || !hasChanges}
              >
                {uploading ? (
                  <span className='stylised-text'>
                    <span className='spinner'></span>Saving...
                  </span>
                ) : (
                  <span className='stylised-text'>Save Changes</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

