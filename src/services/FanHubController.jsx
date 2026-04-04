import axiosInstance from "@/utils/axiosInstance";

export const getTopFanHubs = async (category = "", pageNo = 0, pageSize = 10) => {
  try {
    // The API doesn't support category filtering, so we fetch all and filter client-side
    const url = `/fan-hub/top?pageNo=${pageNo}&pageSize=${pageSize}`;

    const res = await axiosInstance.get(url);

    console.log("getTopFanHubs response:", res.data);

    if (res.data?.success && res.data?.data) {
      let hubs = res.data.data;

      // Filter by category if specified
      if (category) {
        hubs = hubs.filter(hub => 
          hub.categories && hub.categories.includes(category)
        );
      }

      return hubs;
    }

    return [];
  } catch (err) {
    console.error("Fetch top fan hubs error:", err);
    return [];
  }
};

export const getFanHubs = async (pageNo = 0, pageSize = 50) => {
  try {
    const res = await axiosInstance.get(
      `/fan-hub/all?pageNo=${pageNo}&pageSize=${pageSize}`
    );

    console.log("getFanHubs response:", res.data);

    if (res.data?.success && res.data?.data) {
      return res.data.data;
    }

    return [];
  } catch (err) {
    console.error("Fetch fan hubs error:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    return [];
  }
};

export const createFanHub = async (payload) => {
  try {
    const res = await axiosInstance.post(
      `/fan-hub/create`,
      payload
    );

    return res.data;
  } catch (err) {
    console.error("Create FanHub error:", err);
    return null;
  }
};

/**
 * Upload banner, avatar, and background images for a fan hub
 * @param {number} fanHubId - Fan Hub ID
 * @param {File} bannerFile - Banner file
 * @param {File} avatarFile - Avatar file
 * @param {File[]} backgroundFiles - Array of background files (max 4)
 * @returns {Promise<Object>} Upload result
 */
export const uploadImages = async (fanHubId, bannerFile, avatarFile, backgroundFiles = []) => {
  try {
    const formData = new FormData();

    if (bannerFile) {
      formData.append("banner", bannerFile);
    }

    if (avatarFile) {
      formData.append("avatar", avatarFile);
    }

    // Append each background file (max 4)
    const backgroundsToAdd = backgroundFiles.slice(0, 4);
    backgroundsToAdd.forEach((file) => {
      formData.append("backgrounds", file);
    });

    const res = await axiosInstance.post(
      `/fan-hub/upload-images/${fanHubId}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    console.log("uploadImages response:", res.data);

    if (res.data?.success) {
      return res.data;
    }

    return { success: false, message: "Failed to upload images" };
  } catch (err) {
    console.error("Upload images error:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    return err.response?.data || { success: false, message: err.message };
  }
};

/**
 * Get all members of a fan hub
 * @param {number} fanHubId - Fan Hub ID
 * @param {number} pageNo - Page number
 * @param {number} pageSize - Page size
 * @param {string} sortBy - Sort by field (joinedAt, etc.)
 * @returns {Promise<Array>} Members data
 */
export const getAllFanHubMembers = async (fanHubId, pageNo = 0, pageSize = 10, sortBy = "joinedAt") => {
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

    console.log("getAllFanHubMembers response:", res.data);

    if (res.data?.success && res.data?.data) {
      return res.data.data;
    }

    return [];
  } catch (err) {
    console.error("Fetch fan hub members error:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    return [];
  }
};

/**
 * Ban a fan hub member
 * @param {Object} payload - Ban request body
 * @param {number} payload.fanHubMemberId - Member ID
 * @param {string} payload.reason - Ban reason
 * @param {string} payload.banType - Ban type
 * @param {string} payload.bannedUntil - ISO date string
 * @returns {Promise<Object>} Ban result
 */
export const banFanHubMember = async (payload) => {
  try {
    const token = getAuthToken();

    if (!token) {
      console.warn("No auth token found");
      return { success: false, message: "No auth token", error: "401" };
    }

    const res = await axios.post(
      `${API_BASE_URL}/fan-hub-member/ban`,
      payload,
      {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    return res.data;
  } catch (err) {
    console.error("Ban fan hub member error:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    return err.response?.data || { success: false, message: err.message, error: "500" };
  }
};