'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/functions/Auth/useAuth';
import { getUserById } from '@/services/UserController';
import { getPostsByFanHub } from '@/services/PostController';
import { getHubMembers, setModerator, joinFanHub } from '@/services/MemberController';
import { uploadImages } from '@/services/FanHubController';
import { showSuccess, showError, showLoading, updateToast } from '@/utils/toastUtils';
import './HubPage.css';
import { GroupRounded, ArrowUpward, ArrowDownward, CommentRounded, EditRounded, ShareRounded } from '@mui/icons-material';
import { useScroll, useMotionValueEvent } from "framer-motion";

import LoadingImg1 from '../../../assets/Decor/Loading-1.gif'
import LoadingImg2 from '../../../assets/Decor/Loading-2.gif'
import LoadingImg3 from '../../../assets/Decor/loading-3.gif'
import LoadingImg4 from '../../../assets/Decor/loading-4.gif'
import LoadingImg5 from '../../../assets/Decor/Loading-5.gif'
import LoadingImg6 from '../../../assets/Decor/loading-6.gif'

const loadingImages = [LoadingImg1, LoadingImg2, LoadingImg3, LoadingImg4, LoadingImg5, LoadingImg6];

export default function HubPage({ ownedHub }) {
  const { userAuth } = useAuth();
  const params = useParams();
  const router = useRouter();
  const fanHubIdFromParams = params?.fanHubId;

  // Generate random loading image on mount
  const [randomLoadingImage, setRandomLoadingImage] = useState(null);

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * loadingImages.length);
    setRandomLoadingImage(loadingImages[randomIndex]);
  }, []);

  const [hubData, setHubData] = useState(ownedHub || null);
  const [posts, setPosts] = useState([]);
  const [members, setMembers] = useState([]);
  const [memberDetails, setMemberDetails] = useState({});
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

  const [navScrollOffset, setNavScrollOffset] = useState(0);

  const { scrollY } = useScroll();
    useMotionValueEvent(scrollY, "change", (latest) => {
      setNavScrollOffset(latest);
  });

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
      // Navigate to create post page with fanHubId
      router.push(`/create-post?fanHubId=${activeFanHubId}`);
    }
  };

  // Fetch hub data if fanHubId is provided via params (not owned hub)
  useEffect(() => {
    if (fanHubIdFromParams && !ownedHub) {
      const fetchHubData = async () => {
        try {
          // We need to get all hubs and find the matching one
          // Or use a dedicated getFanHubById endpoint if available
          const { getFanHubs } = await import('@/services/FanHubController');
          const hubs = await getFanHubs();
          const foundHub = hubs.find(h => h.fanHubId === parseInt(fanHubIdFromParams));
          if (foundHub) {
            setHubData(foundHub);
          }
        } catch (error) {
          console.error('Error fetching hub data:', error);
        }
      };
      fetchHubData();
    }
  }, [fanHubIdFromParams, ownedHub]);

  // Determine which fanHubId to use
  const activeFanHubId = fanHubIdFromParams ? parseInt(fanHubIdFromParams) : ownedHub?.fanHubId;

  // Fetch posts for the hub
  useEffect(() => {
    const fetchPosts = async () => {
      if (!activeFanHubId) return;

      setPostsLoading(true);
      try {
        const sortBy = sortOrder === 'latest' ? 'createdAt' : 'createdAt';
        const hubPosts = await getPostsByFanHub(activeFanHubId, 0, 50, sortBy);

        const sortedPosts = [...hubPosts].sort((a, b) => {
          const dateA = new Date(a.createdAt);
          const dateB = new Date(b.createdAt);
          return sortOrder === 'latest' ? dateB - dateA : dateA - dateB;
        });

        setPosts(sortedPosts);
      } catch (error) {
        console.error('Error fetching posts:', error);
      } finally {
        setPostsLoading(false);
      }
    };

    fetchPosts();
  }, [activeFanHubId, sortOrder]);

  useEffect(() => {
    const fetchUserMembership = async () => {
      if (!activeFanHubId || !currentUserId) return;

      // If owner, they're implicitly a member with full access
      if (isOwner) {
        setIsMember(true);
        setUserRoleInHub('OWNER');
        return;
      }

      try {
        // Fetch current user's profile to check fanHubsJoined
        const userData = await getUserById(currentUserId);
        
        if (userData && userData.fanHubsJoined) {
          // Check if this hub is in the user's joined hubs
          const isUserMember = userData.fanHubsJoined.some(
            (hub) => hub.fanHubId === activeFanHubId
          );
          
          setIsMember(isUserMember);
          
          // If user is a member, set their role (default to MEMBER since we can't get specific role from fanHubsJoined)
          if (isUserMember) {
            setUserRoleInHub('MEMBER');
          }
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
        const membersData = await getHubMembers(activeFanHubId, 0, 50, 'joinedAt');
        setMembers(membersData);

        const memberDetailsMap = {};

        await Promise.all(
          membersData.map(async (member) => {
            try {
              const userData = await getUserById(member.userId);
              if (userData) {
                // Store by member.id (not userId) for easier access when promoting
                memberDetailsMap[member.id] = {
                  ...userData,
                  memberData: member
                };
              }
            } catch (error) {
              console.error(`Error fetching user ${member.userId}:`, error);
            }
          })
        );
        setMemberDetails(memberDetailsMap);
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

        // Refresh user data to update fanHubsJoined
        const userData = await getUserById(currentUserId);
        if (userData && userData.fanHubsJoined) {
          // User is now a member, members list will be fetched by the useEffect
          // Only fetch members if user is owner or moderator (which they aren't as a new member)
        }
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
    setBannerFile(null);
    setAvatarFile(null);
    setBackgroundFiles([]);
    setBannerPreview(null);
    setAvatarPreview(null);
    setBackgroundPreviews([]);
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
  };

  // Handle save image changes
  const handleSaveImages = async () => {
    if (!bannerFile && !avatarFile && backgroundFiles.length === 0) {
      showError('Please select at least one image to upload');
      return;
    }

    setUploading(true);
    const toastId = showLoading('Uploading images...');

    try {
      // Limit backgrounds to max 4
      const backgroundsToUpload = backgroundFiles.slice(0, 4);

      const uploadRes = await uploadImages(
        activeFanHubId,
        bannerFile,
        avatarFile,
        backgroundsToUpload
      );

      if (uploadRes?.success) {
        updateToast(toastId, 'success', 'Images updated successfully!');

        // Refresh hub data to show new images
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
      } else {
        updateToast(toastId, 'error', uploadRes?.message || 'Failed to upload images');
      }
    } catch (error) {
      console.error('Upload error:', error);
      updateToast(toastId, 'error', 'Network error. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // Filter posts by type (IMAGE, VIDEO for now)
  const filteredPosts = posts.filter(post =>
    post.postType === 'IMAGE' || post.postType === 'VIDEO'
  );

  const handleSortChange = (e) => {
    const value = e.target.value;
    if (value === 'latest') {
      setSortOrder('latest');
    } else if (value === 'oldest') {
      setSortOrder('oldest');
    }
  };

  // Handle post click - navigate to post detail page
  const handlePostClick = (post) => {
    router.push(`/post/${post.postId}`);
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
              <button
                className='create-post-header-btn'
                onClick={handleCreatePostClick}
                title='Create Post'
              >
                <span className='btn-icon'>+</span>
                <span>Create Post</span>
              </button>
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

          {postsLoading ? (
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
            filteredPosts.map((post) => (
              <PostCard key={post.postId} post={post} onClick={() => handlePostClick(post)} />
            ))
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
                      const userDetails = memberDetails[member.id];
                      const isAlreadyModerator = member.roleInHub === 'MODERATOR';
                      return (
                        <div key={member.id} className='member-item'>
                          <img
                            className='member-avatar'
                            src={userDetails?.avatarUrl || '/profile-pic-undefined.jpg'}
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

      {/* Edit Images Modal */}
      {showEditModal && (
        <div className='modal-overlay' onClick={handleEditClose}>
          <div className='modal-content edit-images-modal' onClick={(e) => e.stopPropagation()}>
            <div className='modal-header'>
              <h2>Edit Banner & Avatar</h2>
              <button className='modal-close' onClick={handleEditClose}>×</button>
            </div>

            <div className='modal-body'>
              <p className='modal-description'>
                Upload new images to update your FanHub appearance.
              </p>

              <div className='edit-images-form'>
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

            <div className='modal-footer'>
              <button
                className='cancel-btn'
                onClick={handleEditClose}
                disabled={uploading}
              >
                Cancel
              </button>
              <button
                className='confirm-btn'
                onClick={handleSaveImages}
                disabled={uploading || (!bannerFile && !avatarFile && backgroundFiles.length === 0)}
              >
                {uploading ? (
                  <>
                    <span className='spinner' />
                    Uploading...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Post Card Component
function PostCard({ post, onClick }) {
  const [isLiked, setIsLiked] = useState(post.isLikedByCurrentUser);
  const [likeCount, setLikeCount] = useState(post.likeCount);

  const handleLike = (e) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
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
    <div className='post-card' onClick={onClick}>
      <div className='post-vote-section'>
        <button className='vote-btn like-btn' onClick={handleLike}>
          <ArrowUpward fontSize='small' />
        </button>
        <span className={`vote-count ${isLiked ? 'liked' : ''}`}>{likeCount}</span>
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
          <span className='post-time'>{formatTimeAgo(post.createdAt)}</span>
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

// Helper function to format time ago
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
