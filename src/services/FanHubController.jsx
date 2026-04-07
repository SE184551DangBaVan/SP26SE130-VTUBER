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
 * Check if the current user is a member of a fan hub
 * @param {number} fanHubId - Fan Hub ID
 * @returns {Promise<Object|null>} Object with isMember and roleInHub, or null
 */
export const checkIsMember = async (fanHubId) => {
  try {
    const res = await axiosInstance.get(
      `/fan-hub-member/${fanHubId}/is-member`
    );

    if (res.data?.success && res.data?.data) {
      return res.data.data;
    }

    return null;
  } catch (err) {
    console.error("Check is member error:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
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
