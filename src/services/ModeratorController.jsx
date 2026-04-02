import axios from "axios";

const API_BASE_URL = "https://vtuber-fanhub-bsc3arfzhqhahshy.southeastasia-01.azurewebsites.net/vhub/api/v1";

const getAuthToken = () => {
  return sessionStorage.getItem("token") || localStorage.getItem("token");
};

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
    const token = getAuthToken();

    if (!token) {
      console.warn("No auth token found");
      return [];
    }

    const res = await axios.get(
      `${API_BASE_URL}/posts/fan-hub/${fanHubId}/pending?pageNo=${pageNo}&pageSize=${pageSize}&sortBy=${sortBy}`,
      {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      }
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
    const token = getAuthToken();

    if (!token) {
      console.warn("No auth token found");
      return null;
    }

    const res = await axios.put(
      `${API_BASE_URL}/posts/review?postId=${postId}&status=${status}`,
      {},
      {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      }
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
