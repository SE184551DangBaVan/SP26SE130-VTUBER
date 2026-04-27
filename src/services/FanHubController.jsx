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
      console.log("payload:" + JSON.stringify(payload));
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

/**
 * Get fan hub by subdomain
 * @param {string} subdomain - Fan hub subdomain (e.g., "@GracelessTarnished")
 * @returns {Promise<Object|null>} Fan hub data or null
 */
export const getFanHubBySubdomain = async (subdomain) => {
  try {
      console.log("fetching fanhub by subdomain")
    const encodedSubdomain = encodeURIComponent(subdomain);
    const res = await axiosInstance.get(`/fan-hub/subdomain/${encodedSubdomain}`);

    if (res.data?.success && res.data?.data) {
      return res.data.data;
    }

    return null;
  } catch (err) {
    console.error("Fetch fan hub by subdomain error:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    return null;
  }
};

/**
 * Get current user's joined fan hubs
 * @param {number} pageNo - Page number
 * @param {number} pageSize - Page size
 * @param {string} sortBy - Sort field
 * @returns {Promise<Array>} Array of joined fan hubs
 */
export const getMyJoinedHubs = async (pageNo = 0, pageSize = 50, sortBy = 'createdAt') => {
  try {
    const res = await axiosInstance.get(
      `/fan-hub/my-hubs?pageNo=${pageNo}&pageSize=${pageSize}&sortBy=${sortBy}`
    );

    console.log("getMyJoinedHubs response:", res.data);

    if (res.data?.success && res.data?.data) {
      return res.data.data;
    }

    return [];
  } catch (err) {
    console.error("Fetch my joined hubs error:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    return [];
  }
};

/**
 * Get VTuber's owned fan hub
 * @returns {Promise<Object|null>} Fan hub data or null
 */
export const getMyHubAsOwner = async () => {
  try {
    const res = await axiosInstance.get(`/fan-hub/my-hub-as-owner`);

    console.log("getMyHubAsOwner response:", res.data);

    if (res.data?.success && res.data?.data) {
      return res.data.data;
    }

    return null;
  } catch (err) {
    // console.error("Fetch my hub as owner error:", {
    //   message: err.message,
    //   status: err.response?.status,
    //   data: err.response?.data,
    // });
    return null;
  }
};

/**
 * Update fan hub information
 * @param {number} fanHubId - Fan Hub ID
 * @param {Object} hubData - Hub data to update
 * @param {string} hubData.hubName - Hub name
 * @param {string} hubData.subdomain - Subdomain
 * @param {string} hubData.description - Description
 * @param {string} hubData.themeColor - Theme color
 * @param {string[]} hubData.category - Categories
 * @param {boolean} hubData.isPrivate - Is private
 * @param {boolean} hubData.requiresApproval - Requires approval
 * @returns {Promise<Object>} Update result
 */
export const updateFanHub = async (fanHubId, hubData) => {
  try {
    const res = await axiosInstance.put(
      `/fan-hub/update/${fanHubId}`,
      hubData
    );

    console.log("updateFanHub response:", res.data);

    return res.data;
  } catch (err) {
    console.error("Update fan hub error:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    return err.response?.data || { success: false, message: err.message };
  }
};

/**
 * Create a FanHub with images in a single call (v2)
 * @param {Object} payload - Hub data
 * @param {File} bannerFile - Banner file
 * @param {File} avatarFile - Avatar file
 * @param {File[]} backgroundFiles - Array of background files (max 4)
 * @returns {Promise<Object>} Creation result
 */
export const createFanHubV2 = async (payload, bannerFile, avatarFile, backgroundFiles = []) => {
  try {
    const formData = new FormData();

    // Wrap JSON in a Blob with explicit application/json type
    const jsonPart = JSON.stringify(payload);
    const blob = new Blob([jsonPart], { type: "application/json" });
    formData.append("request", blob);

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
      `/fan-hub/create/v2`,
      formData
    );

    console.log("createFanHubV2 response:", res.data);

    return res.data;
  } catch (err) {
    console.error("Create FanHub V2 error:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    return err.response?.data || { success: false, message: err.message };
  }
};

/**
 * Strike a fan hub
 * @param {number} fanHubId - Fan Hub ID
 * @param {string} reason - Reason for striking
 * @returns {Promise<Object>} Strike result
 */
export const strikeFanHub = async (fanHubId, reason) => {
  try {
    const res = await axiosInstance.post('/fan-hub-strike/create', {
      fanHubId,
      reason
    });

    console.log("strikeFanHub response:", res.data);

    return res.data;
  } catch (err) {
    console.error("Strike fan hub error:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    return err.response?.data || { success: false, message: err.message };
  }
};

/**
 * Deactivate a fan hub
 * @param {number} fanHubId - Fan Hub ID
 * @returns {Promise<Object>} Deactivation result
 */
export const deactivateFanHub = async (fanHubId) => {
  try {
    const res = await axiosInstance.put(`/fan-hub/deactivate/${fanHubId}`);

    console.log("deactivateFanHub response:", res.data);

    return res.data;
  } catch (err) {
    console.error("Deactivate fan hub error:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    return err.response?.data || { success: false, message: err.message };
  }
};

/**
 * Delete a fan hub (irreversible)
 * @param {number} fanHubId - Fan Hub ID
 * @returns {Promise<Object>} Result
 */
export const deleteFanHub = async (fanHubId) => {
  try {
    const res = await axiosInstance.delete(`/fan-hub/delete/${fanHubId}`);
    console.log("deleteFanHub response:", res.data);
    return res.data;
  } catch (err) {
    console.error("Delete fan hub error:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    return err.response?.data || { success: false, message: err.message };
  }
};
