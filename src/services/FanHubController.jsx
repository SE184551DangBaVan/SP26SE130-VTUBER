import axios from "axios";

const API_BASE_URL = "https://vtuber-fanhub-bsc3arfzhqhahshy.southeastasia-01.azurewebsites.net/vhub/api/v1";

const getAuthToken = () => {
  return sessionStorage.getItem("token") || localStorage.getItem("token");
};


export const getTopFanHubs = async (category = "", pageNo = 0, pageSize = 10) => {
  try {
    const token = getAuthToken();

    if (!token) {
      console.warn("No auth token found");
      return [];
    }

    const url = `${API_BASE_URL}/fan-hub/top?pageNo=${pageNo}&pageSize=${pageSize}${
      category ? `&category=${encodeURIComponent(category)}` : ""
    }`;

    const res = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("getTopFanHubs response:", res.data);

    if (res.data?.success && res.data?.data) {
      return res.data.data;
    }

    return [];
  } catch (err) {
    console.error("Fetch top fan hubs error:", err);
    return [];
  }
};

export const getFanHubs = async (pageNo = 0, pageSize = 50) => {
  try {
    const token = getAuthToken();
    
    if (!token) {
      console.warn("No auth token found");
      return [];
    }

    const res = await axios.get(
      `${API_BASE_URL}/fan-hub/all?pageNo=${pageNo}&pageSize=${pageSize}`,
      {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      }
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
    const token = sessionStorage.getItem("token") || localStorage.getItem("token");

    if (!token) {
      console.warn("No auth token found");
      return null;
    }

    const res = await axios.post(
      `${API_BASE_URL}/fan-hub/create`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
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
    const token = sessionStorage.getItem("token") || localStorage.getItem("token");

    if (!token) {
      console.warn("No auth token found");
      return { success: false, message: "No auth token" };
    }

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

    const res = await axios.post(
      `${API_BASE_URL}/fan-hub/upload-images/${fanHubId}`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
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