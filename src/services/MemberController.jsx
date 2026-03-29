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
