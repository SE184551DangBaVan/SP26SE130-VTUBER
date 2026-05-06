import axiosInstance from "@/utils/axiosInstance";

/**
 * Get all bookmarked posts by current user
 * @param {number} pageNo - Page number (default: 0)
 * @param {number} pageSize - Page size (default: 100)
 * @param {string} sortBy - Sort field (default: 'createdAt')
 * @param {string} sortDir - Sort direction (default: 'desc')
 * @returns {Promise<Array>} Array of bookmarked posts
 */
export const getBookmarkedPosts = async (pageNo = 0, pageSize = 100, sortBy = 'createdAt', sortDir = 'desc') => {
  try {
    const res = await axiosInstance.get(`/posts/bookmark`, {
      params: {
        pageNo,
        pageSize,
        sortBy,
        sortDir
      }
    });

    console.log("getBookmarkedPosts response:", res.data);

    if (res.data?.success && res.data?.data) {
      return res.data.data;
    }

    return [];
  } catch (err) {
    if (err.response.status != 403) {
    console.error("Fetch bookmarked posts error:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });}
    return [];
  }
};

/**
 * Bookmark a post
 * @param {number} postId - Post ID to bookmark
 * @returns {Promise<Object>} API response
 */
export const bookmarkPost = async (postId) => {
  try {
    const res = await axiosInstance.post(`/posts/bookmark`, null, {
      params: {
        postId
      }
    });

    console.log("bookmarkPost response:", res.data);
    return res.data;
  } catch (err) {
    console.error("Bookmark post error:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    return err.response?.data || { success: false, message: err.message };
  }
};

/**
 * Unbookmark a post
 * @param {number} postId - Post ID to unbookmark
 * @returns {Promise<Object>} API response
 */
export const unbookmarkPost = async (postId) => {
  try {
    const res = await axiosInstance.post(`/posts/unbookmark`, null, {
      params: {
        postId
      }
    });

    console.log("unbookmarkPost response:", res.data);
    return res.data;
  } catch (err) {
    console.error("Unbookmark post error:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    return err.response?.data || { success: false, message: err.message };
  }
};
