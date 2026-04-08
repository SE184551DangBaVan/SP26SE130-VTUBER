import axiosInstance from "@/utils/axiosInstance";

/**
 * Get comments for a post (parent comments only)
 * @param {number} postId - Post ID
 * @param {number} offset - Number of comments to skip
 * @param {number} limit - Number of comments to fetch
 * @returns {Promise<Array>} Comments data
 */
export const getComments = async (postId, offset = 0, limit = 7) => {
  try {
    const res = await axiosInstance.get(
      `/posts/${postId}/comments?offset=${offset}&limit=${limit}`
    );

    console.log("getComments response:", res.data);

    if (res.data?.success && res.data?.data) {
      return {
        comments: res.data.data,
        hasMore: res.data.data.length === limit,
      };
    }

    return { comments: [], hasMore: false };
  } catch (err) {
    console.error("Fetch comments error:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    return { comments: [], hasMore: false };
  }
};

/**
 * Get replies to a specific comment
 * @param {number} commentId - Comment ID
 * @param {number} offset - Number of replies to skip
 * @param {number} limit - Number of replies to fetch
 * @returns {Promise<Array>} Comment replies data
 */
export const getCommentReplies = async (commentId, offset = 0, limit = 5) => {
  try {
    const res = await axiosInstance.get(
      `/posts/comments/${commentId}/replies?offset=${offset}&limit=${limit}`
    );

    console.log("getCommentReplies response:", res.data);

    if (res.data?.success && res.data?.data) {
      return {
        replies: res.data.data,
        hasMore: res.data.data.length === limit,
      };
    }

    return { replies: [], hasMore: false };
  } catch (err) {
    console.error("Fetch comment replies error:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    return { replies: [], hasMore: false };
  }
};

/**
 * Send a comment or reply
 * @param {number} postId - Post ID
 * @param {string} content - Comment content
 * @param {number|null} parentCommentId - Parent comment ID (null for top-level comments)
 * @returns {Promise<Object>} Response data
 */
export const sendComment = async (postId, content, parentCommentId = null) => {
  try {
    const res = await axiosInstance.post("/posts/comment", {
      postId,
      content,
      parentCommentId,
    });

    console.log("sendComment response:", res.data);

    if (res.data?.success) {
      return res.data;
    }

    throw new Error(res.data?.message || "Failed to send comment");
  } catch (err) {
    console.error("Send comment error:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    throw err;
  }
};

/**
 * Like a comment
 * @param {number} commentId - Comment ID
 * @returns {Promise<Object>} Response data
 */
export const likeComment = async (commentId) => {
  try {
    const res = await axiosInstance.post(`/posts/comment/like/${commentId}`);

    console.log("likeComment response:", res.data);

    return res.data;
  } catch (err) {
    console.error("Like comment error:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    throw err;
  }
};

/**
 * Unlike a comment
 * @param {number} commentId - Comment ID
 * @returns {Promise<Object>} Response data
 */
export const unlikeComment = async (commentId) => {
  try {
    const res = await axiosInstance.post(`/posts/comment/unlike/${commentId}`);

    console.log("unlikeComment response:", res.data);

    return res.data;
  } catch (err) {
    console.error("Unlike comment error:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    throw err;
  }
};
