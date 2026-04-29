import axiosInstance from "@/utils/axiosInstance";

/**
 * Get pending posts for a specific fan hub (posts requiring moderation)
 * @param {number} fanHubId - Fan Hub ID
 * @param {number} pageNo - Page number
 * @param {number} pageSize - Page size
 * @param {string} sortBy - Sort by field (createdAt, etc.)
 * @returns {Promise<Array>} Pending posts data
 */
export const getPendingPostsByFanHub = async (fanHubId, pageNo = 0, pageSize = 10, sortBy = "createdAt") => {
  try {
    const res = await axiosInstance.get(
      `/posts/fan-hub/${fanHubId}/pending?pageNo=${pageNo}&pageSize=${pageSize}&sortBy=${sortBy}`
    );

    console.log("getPendingPostsByFanHub response:", res.data);

    if (res.data?.success && res.data?.data) {
      return res.data.data;
    }

    return [];
  } catch (err) {
    console.error("Fetch pending posts by fan hub error:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    return [];
  }
};

/**
 * Review a post (approve or reject)
 * @param {number} postId - Post ID
 * @param {string} status - New status ('APPROVED' or 'REJECTED')
 * @returns {Promise<Object>} Review result
 */
export const reviewPost = async (postId, status) => {
  try {
    const res = await axiosInstance.put(
      `/posts/review?postId=${postId}&status=${status}`,
      {}
    );

    console.log("reviewPost response:", res.data);

    if (res.data?.success) {
      return res.data;
    }

    return null;
  } catch (err) {
    console.error("Review post error:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    return null;
  }
};

/**
 * Review multiple posts in bulk (approve or reject)
 * @param {number[]} postIds - Array of post IDs to review
 * @param {string} status - New status ('APPROVED' or 'REJECTED')
 * @returns {Promise<Object>} Review result
 */
export const reviewPostsBulk = async (postIds, status) => {
  try {
    if (!postIds || postIds.length === 0) {
      return { success: false, message: "No posts selected" };
    }

    const postIdsParam = postIds.join(',');
    const res = await axiosInstance.put(
      `/posts/review/bulk?postIds=${postIdsParam}&status=${status}`,
      {}
    );

    console.log("reviewPostsBulk response:", res.data);

    if (res.data?.success) {
      return res.data;
    }

    return { success: false, message: res.data?.message || "Bulk review failed" };
  } catch (err) {
    console.error("Bulk review posts error:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    return { success: false, message: err.message };
  }
};
