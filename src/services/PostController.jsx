import axiosInstance, {API_BASE_URL} from "@/utils/axiosInstance";
import {getAuthToken} from "@/services/UserController.jsx";
import axios from "axios";
import { parsePostsSchedule } from "@/utils/parseSchedule";

/**
 * Get posts feed (all posts across all hubs)
 * @param {number} pageNo - Page number
 * @param {number} pageSize - Page size
 * @param {string} sortBy - Sort by field (createdAt, etc.)
 * @param {string} sortDir - Sort direction (asc, desc)
 * @param {string} hashtag - Optional hashtag filter
 * @returns {Promise<Array>} Posts data
 */
export const getPostsFeed = async (pageNo = 0, pageSize = 10, sortBy = "createdAt", sortDir = "desc", hashtag = null) => {
  try {
    let url = `/posts/feed?pageNo=${pageNo}&pageSize=${pageSize}&sortBy=${encodeURIComponent(sortBy)}&sortDir=${encodeURIComponent(sortDir)}`;
    if (hashtag) {
      url += `&hashtag=${encodeURIComponent(hashtag)}`;
    }

    const res = await axiosInstance.get(url);

    console.log("getPostsFeed response:", res.data);

    if (res.data?.success && res.data?.data) {
      return parsePostsSchedule(res.data.data);
    }

    return [];
  } catch (err) {
    console.error("Fetch posts feed error:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    return [];
  }
};

/**
 * Get posts for a specific fan hub
 * @param {number} fanHubId - Fan Hub ID
 * @param {number} pageNo - Page number
 * @param {number} pageSize - Page size
 * @param {string} sortBy - Sort by field (createdAt, etc.)
 * @param {string} sortDir - Sort direction (asc, desc)
 * @param {string} postHashtag - Optional hashtag filter
 * @param {string} authorUsername - Optional author username filter
 * @returns {Promise<Array>} Posts data
 */
export const getPostsByFanHub = async (fanHubId, pageNo = 0, pageSize = 10, sortBy = "createdAt", sortDir = "desc", postHashtag = "", authorUsername = "") => {
  try {
    let url = `/posts/fan-hub/${fanHubId}?pageNo=${pageNo}&pageSize=${pageSize}&sortBy=${sortBy}&sortDir=${sortDir}`;
    if (postHashtag) {
      url += `&postHashtag=${encodeURIComponent(postHashtag)}`;
    }
    if (authorUsername) {
      url += `&authorUsername=${encodeURIComponent(authorUsername)}`;
    }

    const res = await axiosInstance.get(url);

    console.log("getPostsByFanHub response:", res.data);

    if (res.data?.success && res.data?.data) {
      return parsePostsSchedule(res.data.data);
    }

    return [];
  } catch (err) {
    console.error("Fetch posts by fan hub error:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    return [];
  }
};

/**
 * Get a single post by ID
 * @param {number} postId - Post ID
 * @returns {Promise<Object|null>} Post data or null
 */
export const getPostById = async (postId) => {
  try {
    const res = await axiosInstance.get(`/posts/${postId}`);

    console.log("getPostById response:", res.data);

    if (res.data?.success && res.data?.data) {
      const posts = parsePostsSchedule([res.data.data]);
      return posts[0] || null;
    }

    return null;
  } catch (err) {
    console.error("Fetch post by ID error:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    return null;
  }
};

/**
 * Create a new post
 * @param {Object} postData - Post data including fanHubId, postType, title, content, hashtags
 * @param {File|File[]} mediaFiles - Image or video files (optional)
 * @param {string} mediaKey - Key for media files in form data ('images' or 'video')
 * @returns {Promise<Object>} Response data
 */
export const createPost = async (postData, mediaFiles = null, mediaKey = 'images') => {
  try {
    const formData = new FormData();

    // Add request JSON data
    formData.append(
      'request',
      new Blob(
        [JSON.stringify({
          fanHubId: postData.fanHubId,
          postType: postData.postType || 'TEXT',
          title: postData.title,
          content: postData.content || '',
          hashtags: postData.hashtags || [],
          isAnnouncement: postData.isAnnouncement || false,
          isSchedule: postData.isSchedule || false,
          startTime: postData.startTime || null,
          endTime: postData.endTime || null
        })],
        { type: 'application/json' }
      )
    );

    // Add media files if provided
    if (mediaFiles) {
      const files = Array.isArray(mediaFiles) ? mediaFiles : [mediaFiles];
      files.forEach(file => {
        formData.append(mediaKey, file);
      });
    }

    // Don't set Content-Type manually - axios interceptor will handle it
    // The browser will set it with the correct boundary for FormData
    const res = await axiosInstance.post('/posts', formData);

    console.log("createPost response:", res.data);

    if (res.data?.success) {
      return res.data;
    }

    throw new Error(res.data?.message || 'Failed to create post');
  } catch (err) {
    console.error("Create post error:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    throw err;
  }
};

/**
 * Create a poll post
 * @param {Object} pollData - Poll post data
 * @param {number} pollData.fanHubId - Fan Hub ID
 * @param {string} pollData.title - Poll title
 * @param {string} pollData.content - Poll content (optional)
 * @param {string[]} pollData.options - Array of poll options (2-4 options)
 * @param {string[]} pollData.hashtags - Array of hashtags (optional)
 * @returns {Promise<Object>} Response data
 */
export const createPollPost = async (pollData) => {
  try {
    const res = await axiosInstance.post('/posts/poll', {
      fanHubId: pollData.fanHubId,
      title: pollData.title,
      content: pollData.content || '',
      options: pollData.options,
      hashtags: pollData.hashtags || []
    });

    console.log("createPollPost response:", res.data);

    if (res.data?.success) {
      return res.data;
    }

    throw new Error(res.data?.message || 'Failed to create poll post');
  } catch (err) {
    console.error("Create poll post error:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    throw err;
  }
};

/**
 * Vote on a poll option
 * @param {number} postId - Post ID
 * @param {number} optionId - Poll option ID
 * @returns {Promise<Object>} Response data
 */
export const votePoll = async (postId, optionId) => {
  try {
    const res = await axiosInstance.post(`/posts/vote?postId=${postId}&optionId=${optionId}`);

    console.log("votePoll response:", res.data);

    if (res.data?.success) {
      return res.data;
    }

    throw new Error(res.data?.message || 'Failed to vote');
  } catch (err) {
    console.error("Vote poll error:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    throw err;
  }
};

/**
 * Remove vote from a poll
 * @param {number} postId - Post ID
 * @returns {Promise<Object>} Response data
 */
export const unVotePoll = async (postId) => {
  try {
    const res = await axiosInstance.post(`/posts/un-vote?postId=${postId}`);

    console.log("unVotePoll response:", res.data);

    if (res.data?.success) {
      return res.data;
    }

    throw new Error(res.data?.message || 'Failed to remove vote');
  } catch (err) {
    console.error("Unvote poll error:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    throw err;
  }
};

/**
 * Get posts by user ID (for viewing user's own posts)
 * @param {number} userId - User ID
 * @param {number} pageNo - Page number
 * @param {number} pageSize - Page size
 * @param {string} sortBy - Sort by field (createdAt, etc.)
 * @returns {Promise<Array>} Posts data
 */
export const getUserPosts = async (userId, pageNo = 0, pageSize = 50, sortBy = "createdAt") => {
  try {
    const res = await axiosInstance.get(
      `/posts/user?pageNo=${pageNo}&pageSize=${pageSize}&sortBy=${sortBy}`
    );

    console.log("getUserPosts response:", res.data);

    if (res.data?.success && res.data?.data) {
      return parsePostsSchedule(res.data.data);
    }

    return [];
  } catch (err) {
    console.error("Fetch user posts error:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    return [];
  }
};

/**
 * Get announcements and events for a specific fan hub
 * @param {number} fanHubId - Fan Hub ID
 * @param {number} pageNo - Page number
 * @param {number} pageSize - Page size
 * @param {string} sortBy - Sort by field
 * @returns {Promise<Array>} Announcements and events data
 */
export const getAnnouncementsAndEvents = async (fanHubId, pageNo = 0, pageSize = 10, sortBy = "createdAt") => {
  try {
    const url = `/posts/fan-hub/${fanHubId}/announcements-events?pageNo=${pageNo}&pageSize=${pageSize}&sortBy=${sortBy}`;

    const res = await axiosInstance.get(url);

    console.log("getAnnouncementsAndEvents response:", res.data);

    if (res.data?.success && res.data?.data) {
      // Filter only APPROVED posts and parse schedules
      const approvedPosts = res.data.data.filter(post => post.status === "APPROVED");
      return parsePostsSchedule(approvedPosts);
    }

    return [];
  } catch (err) {
    console.error("Fetch announcements and events error:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    return [];
  }
};

/**
 * Get all posts for a specific fan hub (all statuses)
 * @param {number} fanHubId - Fan Hub ID
 * @param {number} pageNo - Page number
 * @param {number} pageSize - Page size
 * @param {string} sortBy - Sort by field (createdAt, etc.)
 * @returns {Promise<Array>} Posts data
 */
export const getAllPostsByFanHub = async (fanHubId, pageNo = 0, pageSize = 10, sortBy = "createdAt") => {
  try {
    const res = await axiosInstance.get(
      `/posts/fan-hub/${fanHubId}/all?pageNo=${pageNo}&pageSize=${pageSize}&sortBy=${sortBy}`
    );

    console.log("getAllPostsByFanHub response:", res.data);

    if (res.data?.success && res.data?.data) {
      return parsePostsSchedule(res.data.data);
    }

    return [];
  } catch (err) {
    console.error("Fetch all posts by fan hub error:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    return [];
  }
};

/**
 * Like a post
 * @param {number} postId - Post ID
 * @returns {Promise<Object>} Response data with success, message, and data
 */
export const likePost = async (postId) => {
  try {
    const res = await axiosInstance.post(`/posts/like?postId=${postId}`);

    console.log("likePost response:", res.data);

    return res.data;
  } catch (err) {
    console.error("Like post error:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    throw err;
  }
};

/**
 * Unlike a post
 * @param {number} postId - Post ID
 * @returns {Promise<Object>} Response data with success, message, and data
 */
export const unlikePost = async (postId) => {
  try {
    const res = await axiosInstance.post(`/posts/unlike?postId=${postId}`);

    console.log("unlikePost response:", res.data);

    return res.data;
  } catch (err) {
    console.error("Unlike post error:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    throw err;
  }
};

/**
 * Send AI validation retry request for a post
 * @param {number} postId - Post ID
 * @returns {Promise<Object>} { success, message, data, error }
 */
export const retryAiValidation = async (postId) => {
  try {
    const res = await axiosInstance.post(`/posts/validate?postId=${postId}`, {});
    return res.data;
  } catch (err) {
    console.error("AI validation retry error:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    return err.response?.data || { success: false, message: err.message, error: "500" };
  }
};

/**
 * Get translation of a post
 * @param {number} postId - The ID of the post to translate
 * @returns {Promise<Object>} Response data { translatedContent, translatedTitle, translate_language_set, extraComment }
 */
export const getTranslatePost = async (postId) => {
  try {
    const res = await axiosInstance.get(`/posts/translate`, {
      params: { postId },
    });

    console.log("getTranslatePost response:", res.data);

    if (res.data?.success && res.data?.data) {
      return res.data;
    }

    return res.data || { success: false, message: "No translation data returned" };
  } catch (err) {
    console.error("Translate post error:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    return err.response?.data || { success: false, message: err.message };
  }
};

/**
 * Get AI summary of a post
 * @param {number} postId - The ID of the post to summarize
 * @returns {Promise<Object>} Response data { summarizeResult }
 */
export const getPostSummary = async (postId) => {
  try {
    const res = await axiosInstance.get(`/posts/summarize`, {
      params: { postId },
    });

    console.log("getPostSummary response:", res.data);

    if (res.data?.success && res.data?.data) {
      return res.data;
    }

    return res.data || { success: false, message: "No summary data returned" };
  } catch (err) {
    console.error("Summarize post error:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    return err.response?.data || { success: false, message: err.message };
  }
};

/**
 * Pin a post
 * @param {number} postId - The ID of the post to pin
 * @returns {Promise<Object>} Response data
 */
export const pinPost = async (postId) => {
  try {
    const res = await axiosInstance.put(`/posts/${postId}/pin`);

    console.log("pinPost response:", res.data);

    if (res.data?.success) {
      return res.data;
    }

    throw new Error(res.data?.message || 'Failed to pin post');
  } catch (err) {
    console.error("Pin post error:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    throw err;
  }
};

/**
 * Unpin a post
 * @param {number} postId - The ID of the post to unpin
 * @returns {Promise<Object>} Response data
 */
export const unpinPost = async (postId) => {
  try {
    const res = await axiosInstance.put(`/posts/${postId}/unpin`);

    console.log("unpinPost response:", res.data);

    if (res.data?.success) {
      return res.data;
    }

    throw new Error(res.data?.message || 'Failed to unpin post');
  } catch (err) {
    console.error("Unpin post error:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    throw err;
  }
};

/**
 * Approve all posts with "AI_SAFE" status in a specific fan hub
 * @param {number} fanHubId - Fan Hub ID
 * @returns {Promise<Object>} Response data
 */
export const approveAllAiSafePosts = async (fanHubId) => {
  try {
    const res = await axiosInstance.post(`/posts/ai-validation/approve-all?fanHubId=${fanHubId}`);
    return res.data;
  } catch (err) {
    console.error("Approve all AI_SAFE posts error:", err);
    return err.response?.data || { success: false, message: err.message };
  }
};

/**
 * Reject all posts with "AI_UNSAFE" status in a specific fan hub
 * @param {number} fanHubId - Fan Hub ID
 * @returns {Promise<Object>} Response data
 */
export const rejectAllAiUnsafePosts = async (fanHubId) => {
  try {
    const res = await axiosInstance.post(`/posts/ai-validation/reject-all?fanHubId=${fanHubId}`);
    return res.data;
  } catch (err) {
    console.error("Reject all AI_UNSAFE posts error:", err);
    return err.response?.data || { success: false, message: err.message };
  }
};

/**
 * User deletes their own post
 * @param {number} postId - Post ID
 * @returns {Promise<Object>} Response data
 */
export const userDeleteOwnPost = async (postId) => {
  try {
    const res = await axiosInstance.put(`/posts/delete/${postId}`);

    console.log("userDeleteOwnPost response:", res.data);

    return res.data;
  } catch (err) {
    return err.response?.data || { success: false, message: err.message };
  }
};

/**
 * Get all rejected posts for a specific fan hub
 * @param {number} fanHubId - Fan Hub ID
 * @param {number} pageNo - Page number
 * @param {number} pageSize - Page size
 * @param {string} sortBy - Sort by field (createdAt, etc.)
 * @returns {Promise<Array>} Posts data
 */
export const getRejectedPostsByFanHub = async (fanHubId, pageNo = 0, pageSize = 10, sortBy = "createdAt") => {
  try {
    const res = await axiosInstance.get(
      `/posts/fan-hub/${fanHubId}/rejected?pageNo=${pageNo}&pageSize=${pageSize}&sortBy=${sortBy}`
    );

    console.log("getRejectedPostsByFanHub response:", res.data);

    if (res.data?.success && res.data?.data) {
      return parsePostsSchedule(res.data.data);
    }

    return [];
  } catch (err) {
    console.error("Fetch rejected posts by fan hub error:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    return [];
  }
};

/**
 * Search for posts and fan hubs by keyword
 * @param {string} keyword - Search keyword
 * @param {string} searchType - Type of search: "Post", "FanHub", or "All"
 * @param {number} pageNo - Page number (default 0)
 * @param {number} pageSize - Page size (default 10)
 * @param {string} sortBy - Sort by field (default "createdAt")
 * @returns {Promise<Object>} Search results with posts and/or fanHubs
 */
export const searchContent = async (keyword, searchType = "All", pageNo = 0, pageSize = 10, sortBy = "createdAt") => {
  try {
    if (!keyword || keyword.trim() === "") {
      return { posts: [], fanHubs: [], success: false };
    }

    const results = { posts: [], fanHubs: [], success: false };
    const searchTypes = searchType === "All" ? ["Post", "FanHub"] : [searchType];

    // Fetch results for each type
    const promises = searchTypes.map(type =>
      axiosInstance.get(
        `${API_BASE_URL}/search?keyword=${encodeURIComponent(keyword)}&pageNo=${pageNo}&pageSize=${pageSize}&sortBy=${sortBy}&type=${type}`
      ).catch(err => {
        console.error(`Search ${type} error:`, err.message);
        return null;
      })
    );

    const responses = await Promise.all(promises);

    let hasResults = false;
    responses.forEach((response, index) => {
      if (response?.data?.success) {
        if (searchTypes[index] === "Post") {
          results.posts = response.data.data || [];
          hasResults = true;
        } else if (searchTypes[index] === "FanHub") {
          results.fanHubs = response.data.data || [];
          hasResults = true;
        }
      }
    });

    results.success = hasResults;
    return results;
  } catch (err) {
    console.error("Search content error:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    return { posts: [], fanHubs: [], success: false };
  }
};

/**
 * Get count of Post Reports of a fanhub
 * @param {number} fanHubId 
 * @returns {Promise<number>} Count
 */
export const getPostReportsCount = async (fanHubId) => {
  try {
    const res = await axiosInstance.get(`/posts/count-report-posts/${fanHubId}`);
    if (res.data?.success) {
      return res.data.data;
    }
    return 0;
  } catch (err) {
    console.error("Get post reports count error:", err);
    return 0;
  }
};

/**
 * Get count of Pending Post (posts requiring review)
 * @param {number} fanHubId 
 * @returns {Promise<number>} Count
 */
export const getPendingPostsCount = async (fanHubId) => {
  try {
    const res = await axiosInstance.get(`/posts/count-pending-posts/${fanHubId}`);
    if (res.data?.success) {
      return res.data.data;
    }
    return 0;
  } catch (err) {
    console.error("Get pending posts count error:", err);
    return 0;
  }
};


