import axios from "axios";

const API_BASE_URL = "https://vtuber-fanhub-bsc3arfzhqhahshy.southeastasia-01.azurewebsites.net/vhub/api/v1";
// const API_BASE_URL = "http://localhost:8080/vhub/api/v1";

const getAuthToken = () => {
  return sessionStorage.getItem("token") || localStorage.getItem("token");
};

/**
 * Get chat messages for the current user
 * @param {number} page - Page number (default: 0)
 * @param {number} size - Number of messages per page (default: 10)
 * @returns {Promise<Object>} Result containing messages array and pagination info
 */
export const getChatMessages = async (page = 0, size = 10) => {
  try {
    const token = getAuthToken();

    if (!token) {
      console.warn("No auth token found");
      return { success: false, message: "No auth token" };
    }

    const res = await axios.get(
      `${API_BASE_URL}/message?page=${page}&size=${size}`,
      {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      }
    );

    if (res.data?.success && res.data?.data) {
      return res.data;
    }

    return res.data || { success: false, message: "No data returned" };
  } catch (err) {
    console.error("Fetch chat messages error:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    return err.response?.data || { success: false, message: err.message };
  }
};

/**
 * Send a chat message
 * @param {string} content - The message content
 * @returns {Promise<Object>} Result of the operation
 */
export const sendChatMessage = async (content) => {
  try {
    const token = getAuthToken();

    if (!token) {
      console.warn("No auth token found");
      return { success: false, message: "No auth token" };
    }

    const res = await axios.post(
      `${API_BASE_URL}/message`,
      {
        content
      },
      {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      }
    );

    return res.data;
  } catch (err) {
    console.error("Send chat message error:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    return err.response?.data || { success: false, message: err.message };
  }
};
