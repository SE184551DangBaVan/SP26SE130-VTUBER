'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/functions/Auth/useAuth';
import { getUserById } from '@/services/UserController';
import { getPostsByFanHub } from '@/services/PostController';
import { getHubMembers } from '@/services/MemberController';
import './HubPage.css';
import { GroupRounded, ArrowUpward, ArrowDownward, CommentRounded } from '@mui/icons-material';

export default function HubPage({ ownedHub }) {
  const { userAuth } = useAuth();
  const params = useParams();
  const fanHubIdFromParams = params?.fanHubId;
  
  const [hubData, setHubData] = useState(ownedHub || null);
  const [posts, setPosts] = useState([]);
  const [members, setMembers] = useState([]);
  const [memberDetails, setMemberDetails] = useState({});
  const [postsLoading, setPostsLoading] = useState(false);
  const [membersLoading, setMembersLoading] = useState(false);
  const [sortOrder, setSortOrder] = useState('latest');

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
    const fetchMembers = async () => {
      if (!activeFanHubId) return;

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
                memberDetailsMap[member.userId] = userData;
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
  }, [activeFanHubId]);

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

  // Show loading if no hub data
  if (!hubData) {
    return (
      <div className='hub-page-container'>
        <div className='posts-loading'>
          <div className='loading-spinner'>Loading hub...</div>
        </div>
      </div>
    );
  }

  return (
    <div className='hub-page-container'>
      <div
        className='hub-banner'
        style={{
          backgroundImage: hubData.backgroundUrl ? `url(${hubData.backgroundUrl})` : '#75a4c8',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className='hub-banner-overlay'>
          <div className='hub-header-content'>
            <img
              className='hub-avatar'
              src={hubData.avatarUrl || '/profile-pic-undefined.jpg'}
              alt={hubData.hubName}
              onError={(e) => {
                e.target.src = '/profile-pic-undefined.jpg';
              }}
            />
            <div className='hub-title-section' style={{color: hubData.themeColor || '#333'}}>
              <h1 className='hub-name'>{hubData.hubName}</h1>
              <p className='hub-subdomain'>{hubData.subdomain}</p>
              <div className='hub-owner-info'>
                <span>Owned by </span>
                <span className='owner-username'>{hubData.ownerDisplayName || hubData.ownerUsername}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className='hub-content-wrapper'>
        <div className='hub-main-content'>
          <div className='create-post-input'>
            <img
              src='/profile-pic-undefined.jpg'
              alt='Your avatar'
              onError={(e) => {
                e.target.src = '/profile-pic-undefined.jpg';
              }}
            />
            <input type='text' placeholder='Create Post' readOnly />
          </div>

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
              <div className='loading-spinner'>Loading posts...</div>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className='no-posts'>
              <p>No IMAGE or VIDEO posts yet.</p>
            </div>
          ) : (
            filteredPosts.map((post) => (
              <PostCard key={post.postId} post={post} />
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
                    const userDetails = memberDetails[member.userId];
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
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Post Card Component
function PostCard({ post }) {
  const [isLiked, setIsLiked] = useState(post.isLikedByCurrentUser);
  const [likeCount, setLikeCount] = useState(post.likeCount);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
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
    <div className='post-card'>
      <div className='post-vote-section'>
        <button className='vote-btn upvote' onClick={handleLike}>
          <ArrowUpward fontSize='small' />
        </button>
        <span className={`vote-count ${isLiked ? 'liked' : ''}`}>{likeCount}</span>
        <button className='vote-btn downvote'>
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
          <button className='action-btn'>
            <CommentRounded fontSize='small' />
            <span>Comments</span>
          </button>
          <button className='action-btn'>
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
