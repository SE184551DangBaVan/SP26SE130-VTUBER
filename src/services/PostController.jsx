import axios from "axios";

const API_BASE_URL = "https://vtuber-fanhub-bsc3arfzhqhahshy.southeastasia-01.azurewebsites.net/vhub/api/v1";

const getAuthToken = () => {
  return sessionStorage.getItem("token") || localStorage.getItem("token");
};

/**
 * Get posts feed (all posts across all hubs)
 * @param {number} pageNo - Page number
 * @param {number} pageSize - Page size
 * @param {string} sortBy - Sort by field (createdAt, etc.)
 * @returns {Promise<Array>} Posts data
 */
export const getPostsFeed = async (pageNo = 0, pageSize = 10, sortBy = "createdAt") => {
  try {
    const token = getAuthToken();

    if (!token) {
      console.warn("No auth token found");
      return [];
    }

    const res = await axios.get(
      `${API_BASE_URL}/posts/feed?pageNo=${pageNo}&pageSize=${pageSize}&sortBy=${sortBy}`,
      {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      }
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
    const token = getAuthToken();

    if (!token) {
      console.warn("No auth token found");
      return [];
    }

    let url = `${API_BASE_URL}/posts/fan-hub/${fanHubId}?pageNo=${pageNo}&pageSize=${pageSize}&sortBy=${sortBy}`;
    if (postHashtag) {
      url += `&postHashtag=${encodeURIComponent(postHashtag)}`;
    }

    const res = await axios.get(
      url,
      {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      }
    );

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
    const token = getAuthToken();

    if (!token) {
      console.warn("No auth token found");
      return null;
    }

    const res = await axios.get(
      `${API_BASE_URL}/posts/${postId}`,
      {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      }
    );

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
