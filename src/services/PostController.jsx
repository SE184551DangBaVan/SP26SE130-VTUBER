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
