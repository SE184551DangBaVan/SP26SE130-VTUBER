import axios from "axios";

const API_BASE_URL = "https://vtuber-fanhub-bsc3arfzhqhahshy.southeastasia-01.azurewebsites.net/vhub/api/v1";

const getAuthToken = () => {
  return sessionStorage.getItem("token") || localStorage.getItem("token");
};

/**
 * Get user information by ID
 * @param {number} userId - User ID
 * @returns {Promise<Object|null>} User data or null
 */
export const getUserById = async (userId) => {
  try {
    const token = getAuthToken();
    
    if (!token) {
      console.warn("No auth token found");
      return null;
    }

    const res = await axios.get(
      `${API_BASE_URL}/user/${userId}`,
      {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      }
    );
    
    console.log("getUserById response:", res.data);
    
    if (res.data?.success && res.data?.data) {
      return res.data.data;
    }
    
    return null;
  } catch (err) {
    console.error("Fetch user by ID error:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    return null;
  }
};

/**
 * Register VTuber application
 * @param {number} userId - User ID
 * @param {string} channelName - YouTube channel name
 * @param {string} channelLink - YouTube channel link
 * @returns {Promise<Object>} Application result
 */
export const registerVtuberApplication = async (userId, channelName, channelLink) => {
  try {
    const token = getAuthToken();
    
    if (!token) {
      console.warn("No auth token found");
      return { success: false, message: "No auth token" };
    }

    const res = await axios.post(
      `${API_BASE_URL}/vtuber-application/register-vtuber`,
      {
        userId,
        channelName,
        channelLink
      },
      {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      }
    );
    
    console.log("registerVtuberApplication response:", res.data);
    
    return res.data;
  } catch (err) {
    console.error("Register VTuber application error:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    return err.response?.data || { success: false, message: err.message };
  }
};
