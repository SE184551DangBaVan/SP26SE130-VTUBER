import axios from "axios";

const API_BASE_URL = "https://vtuber-fanhub-bsc3arfzhqhahshy.southeastasia-01.azurewebsites.net/vhub/api/v1";

const getAuthToken = () => {
  return sessionStorage.getItem("token") || localStorage.getItem("token");
};

/**
 * Get members of a fan hub
 * @param {number} fanHubId - Fan Hub ID
 * @param {number} pageNo - Page number
 * @param {number} pageSize - Page size
 * @param {string} sortBy - Sort by field (joinedAt, etc.)
 * @returns {Promise<Array>} Members data
 */
export const getHubMembers = async (fanHubId, pageNo = 0, pageSize = 50, sortBy = "joinedAt") => {
  try {
    const token = getAuthToken();

    if (!token) {
      console.warn("No auth token found");
      return [];
    }

    const res = await axios.get(
      `${API_BASE_URL}/fan-hub-member/members/${fanHubId}?pageNo=${pageNo}&pageSize=${pageSize}&sortBy=${sortBy}`,
      {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      }
    );

    console.log("getHubMembers response:", res.data);

    if (res.data?.success && res.data?.data) {
      return res.data.data;
    }

    return [];
  } catch (err) {
    console.error("Fetch hub members error:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    return [];
  }
};

/**
 * Set a member as moderator of a fan hub
 * @param {number} fanHubId - Fan Hub ID
 * @param {number[]} memberIds - Array of member IDs to promote
 * @returns {Promise<Object>} Result of the operation
 */
export const setModerator = async (fanHubId, memberIds) => {
  try {
    const token = getAuthToken();

    if (!token) {
      console.warn("No auth token found");
      return { success: false, message: "No auth token" };
    }

    const res = await axios.post(
      `${API_BASE_URL}/fan-hub-member/set-moderator/${fanHubId}?memberIds=${memberIds.join(',')}`,
      {},
      {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      }
    );

    console.log("setModerator response:", res.data);

    if (res.data?.success) {
      return res.data;
    }

    return { success: false, message: "Failed to set moderator" };
  } catch (err) {
    console.error("Set moderator error:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    return err.response?.data || { success: false, message: err.message };
  }
};
