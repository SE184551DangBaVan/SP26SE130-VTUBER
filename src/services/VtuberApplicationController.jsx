import axios from "axios";

const API_BASE_URL = "https://vtuber-fanhub-bsc3arfzhqhahshy.southeastasia-01.azurewebsites.net/vhub/api/v1";

const getAuthToken = () => {
  return sessionStorage.getItem("token") || localStorage.getItem("token");
};

/**
 * Get all VTuber applications
 * @param {number} pageNo - Page number (default: 0)
 * @param {number} pageSize - Page size (default: 10)
 * @param {string} sortBy - Sort field (default: createdAt)
 * @returns {Promise<Array>} List of applications
 */
export const getVtuberApplications = async (pageNo = 0, pageSize = 10, sortBy = "createdAt") => {
  try {
    const token = getAuthToken();
    
    if (!token) {
      console.warn("No auth token found");
      return [];
    }

    const res = await axios.get(
      `${API_BASE_URL}/vtuber-application?pageNo=${pageNo}&pageSize=${pageSize}&sortBy=${sortBy}`,
      {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      }
    );
    
    console.log("getVtuberApplications response:", res.data);
    
    if (res.data?.success && res.data?.data) {
      return res.data.data;
    }
    
    return [];
  } catch (err) {
    console.error("Fetch VTuber applications error:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    return [];
  }
};

/**
 * Review a VTuber application (approve or reject)
 * @param {number} vTuberApplicationId - Application ID
 * @param {string} status - "ACCEPTED" or "REJECTED"
 * @param {string} reason - Reason for the decision
 * @returns {Promise<Object>} Review result
 */
export const reviewVtuberApplication = async (vTuberApplicationId, status, reason) => {
  try {
    const token = getAuthToken();
    
    if (!token) {
      console.warn("No auth token found");
      return { success: false, message: "No auth token" };
    }

    const res = await axios.put(
      `${API_BASE_URL}/vtuber-application/review-application?vTuberApplicationId=${vTuberApplicationId}&status=${status}&reason=${encodeURIComponent(reason)}`,
      null,
      {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      }
    );
    
    console.log("reviewVtuberApplication response:", res.data);
    
    return res.data;
  } catch (err) {
    console.error("Review VTuber application error:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    return err.response?.data || { success: false, message: err.message };
  }
};
