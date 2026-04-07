import axiosInstance from "@/utils/axiosInstance";

/**
 * Get posts feed (all posts across all hubs)
 * @param {number} pageNo - Page number
 * @param {number} pageSize - Page size
 * @param {string} sortBy - Sort by field (createdAt, etc.)
 * @returns {Promise<Array>} Posts data
 */
export const getPostsFeed = async (pageNo = 0, pageSize = 10, sortBy = "createdAt") => {
  try {
    const res = await axiosInstance.get(
      `/posts/feed?pageNo=${pageNo}&pageSize=${pageSize}&sortBy=${sortBy}`
    );

    console.log("getPostsFeed response:", res.data);

    if (res.data?.success && res.data?.data) {
      return res.data.data;
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
 * @param {string} postHashtag - Optional hashtag filter
 * @returns {Promise<Array>} Posts data
 */
export const getPostsByFanHub = async (fanHubId, pageNo = 0, pageSize = 10, sortBy = "createdAt", postHashtag = "") => {
  try {
    let url = `/posts/fan-hub/${fanHubId}?pageNo=${pageNo}&pageSize=${pageSize}&sortBy=${sortBy}`;
    if (postHashtag) {
      url += `&postHashtag=${encodeURIComponent(postHashtag)}`;
    }

    const res = await axiosInstance.get(url);

    console.log("getPostsByFanHub response:", res.data);

    if (res.data?.success && res.data?.data) {
      return res.data.data;
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
      return res.data.data;
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
          hashtags: postData.hashtags || []
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
 * Get posts by user ID (for viewing user's own posts)
 * @param {number} userId - User ID
 * @param {number} pageNo - Page number
 * @param {number} pageSize - Page size
 * @param {string} sortBy - Sort by field (createdAt, etc.)
 * @returns {Promise<Array>} Posts data
 */
export const getUserPosts = async (userId, pageNo = 0, pageSize = 50, sortBy = "createdAt") => {
  try {
    const token = getAuthToken();

    if (!token) {
      console.warn("No auth token found");
      return [];
    }

    const res = await axios.get(
      `${API_BASE_URL}/posts/user?pageNo=${pageNo}&pageSize=${pageSize}&sortBy=${sortBy}`,
      {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      }
    );

    console.log("getUserPosts response:", res.data);

    if (res.data?.success && res.data?.data) {
      return res.data.data;
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
 * Get all posts for a specific fan hub (all statuses)
 * @param {number} fanHubId - Fan Hub ID
 * @param {number} pageNo - Page number
 * @param {number} pageSize - Page size
 * @param {string} sortBy - Sort by field (createdAt, etc.)
 * @returns {Promise<Array>} Posts data
 */
export const getAllPostsByFanHub = async (fanHubId, pageNo = 0, pageSize = 10, sortBy = "createdAt") => {
  try {
    const token = getAuthToken();

    if (!token) {
      console.warn("No auth token found");
      return [];
    }

    const res = await axios.get(
      `${API_BASE_URL}/posts/fan-hub/${fanHubId}/all?pageNo=${pageNo}&pageSize=${pageSize}&sortBy=${sortBy}`,
      {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      }
    );

    console.log("getAllPostsByFanHub response:", res.data);

    if (res.data?.success && res.data?.data) {
      return res.data.data;
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
    const token = getAuthToken();

    if (!token) {
      console.warn("No auth token found");
      return { success: false, message: "No auth token", error: "401" };
    }

    const res = await axios.post(
      `${API_BASE_URL}/posts/validate?postId=${postId}`,
      {},
      {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

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
