import axios from "axios";

const API_BASE_URL = "https://vtuber-fanhub-bsc3arfzhqhahshy.southeastasia-01.azurewebsites.net/vhub/api/v1";

export const getAuthToken = () => {
  return sessionStorage.getItem("token") || localStorage.getItem("token");
};

import axiosInstance from "@/utils/axiosInstance";

/**
 * Validate user authentication token
 * @returns {Promise<Object>} Token validation result with validity, expiration, and user info
 */
export const checkToken = async (token) => {
  try {
    if (!token) {
      console.warn("No auth token found");
      return {
        success: false,
        message: "No auth token",
        data: {
          valid: false,
          expired: true,
          userId: null,
          username: null,
          role: null,
          expiresAt: null
        }
      };
    }

    const res = await axios.get(
      `${API_BASE_URL}/auth/me`,
      {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      }
    );

    return res.data;
  } catch (err) {
    console.error("Validate token error:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    return err.response?.data || {
      success: false,
      message: err.message,
      data: {
        valid: false,
        expired: true,
        userId: null,
        username: null,
        role: null,
        expiresAt: null
      }
    };
  }
};

/**
 * Get user information by ID
 * @param {number} userId - User ID
 * @returns {Promise<Object|null>} User data or null
 */
export const getUserById = async (userId) => {
  try {
    const res = await axiosInstance.get(`/user/${userId}`);

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
 * Get user information by ID
 * @param {number} userId - User ID
 * @returns {Promise<Object|null>} User data or null
 */
export const setUserOshi = async (userName) => {
    try {
        const token = getAuthToken();

        if (!token) {
            console.warn("No auth token found");
            return null;
        }

        const res = await axios.post(
            `${API_BASE_URL}/user/${userName}`,
            {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );


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
 * Get user profile by username
 * @param {string} username - Username
 * @returns {Promise<Object|null>} User profile data or null
 */
export const getUserByUsername = async (username) => {
  try {
    const res = await axiosInstance.get(`/user/user-name/${username}`);

    if (res.data?.success && res.data?.data) {
      return res.data.data;
    }
    return null;
  } catch (err) {
    console.error("Fetch user by username error:", {
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
    const res = await axiosInstance.post(
      `/vtuber-application/register-vtuber`,
      {
        userId,
        channelName,
        channelLink
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

/**
 * Select display badges for user
 * @param {number[]} userBadgeIds - Array of user badge IDs to display (max 3)
 * @returns {Promise<Object>} Result of the operation
 */
export const selectDisplayBadges = async (userBadgeIds) => {
  try {
    const res = await axiosInstance.post(
      `/user/badges/select-display`,
      {
        userBadgeIds
      }
    );

    console.log("selectDisplayBadges response:", res.data);

    return res.data;
  } catch (err) {
    console.error("Select display badges error:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    return err.response?.data || { success: false, message: err.message };
  }
};

/**
 * Get current logged-in user's profile
 * @returns {Promise<Object|null>} User profile data or null
 */
export const getCurrentUserProfile = async () => {
  try {
    const res = await axiosInstance.get(`/user/me`);

    if (res.data?.success && res.data?.data) {
      return res.data.data;
    }
    return null;
  } catch (err) {
    console.error("Fetch current user profile error:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    return null;
  }
};

/**
 * Update user profile information
 * @param {Object} userData - User data to update
 * @param {string} userData.email - User email
 * @param {string} userData.displayName - Display name
 * @param {string} userData.translateLanguage - Translation language preference
 * @param {string} userData.bio - User bio
 * @returns {Promise<Object>} Result of the update operation
 */
export const updateUserProfile = async (userData) => {
  try {
    const res = await axiosInstance.put(
      `/user/update`,
      userData
    );

    console.log("updateUserProfile response:", res.data);

    return res.data;
  } catch (err) {
    console.error("Update user profile error:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    return err.response?.data || { success: false, message: err.message };
  }
};

/**
 * Upload user avatar and/or frame
 * @param {File} avatarFile - Avatar image file (MultipartFile)
 * @param {File} frameFile - Frame image file (MultipartFile, optional)
 * @returns {Promise<Object>} Result of the upload operation
 */
export const uploadAvatarFrame = async (avatarFile, frameFile = null) => {
  try {
    const formData = new FormData();
    
    if (avatarFile) {
      formData.append('avatar', avatarFile);
    }
    
    if (frameFile) {
      formData.append('frame', frameFile);
    }

    const res = await axiosInstance.post(
      `/user/upload-avatar-frame`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    console.log("uploadAvatarFrame response:", res.data);

    return res.data;
  } catch (err) {
    console.error("Upload avatar/frame error:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    return err.response?.data || { success: false, message: err.message };
  }
};

/**
 * Get user daily mission status
 * @returns {Promise<Object|null>} Daily mission status data or null
 */
export const getUserDailyMissionStatus = async () => {
  try {
    const res = await axiosInstance.get(`/user/my-daily-mission`);

    if (res.data?.success && res.data?.data) {
      return res.data.data;
    }
    return null;
  } catch (err) {
    console.error("Fetch daily mission status error:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    return null;
  }
};
