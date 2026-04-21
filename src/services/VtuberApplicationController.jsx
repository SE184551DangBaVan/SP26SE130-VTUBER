import axiosInstance from "@/utils/axiosInstance";

/**
 * Get all VTuber applications
 * @param {number} pageNo - Page number (default: 0)
 * @param {number} pageSize - Page size (default: 10)
 * @param {string} sortBy - Sort field (default: createdAt)
 * @returns {Promise<Array>} List of applications
 */
export const getVtuberApplications = async (pageNo = 0, pageSize = 10, sortBy = "createdAt") => {
  try {
    const res = await axiosInstance.get(
      `/vtuber-application?pageNo=${pageNo}&pageSize=${pageSize}&sortBy=${sortBy}`
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
    const res = await axiosInstance.put(
      `/vtuber-application/review-application?vTuberApplicationId=${vTuberApplicationId}&status=${status}&reason=${encodeURIComponent(reason)}`,
      null
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

/**
 * Get current user's VTuber applications
 * @returns {Promise<Array>} List of user's applications
 */
export const getMyVtuberApplications = async () => {
  try {
    const res = await axiosInstance.get(`/vtuber-application/my-applications`);

    console.log("getMyVtuberApplications response:", res.data);

    if (res.data?.success && res.data?.data) {
      return res.data.data;
    }

    return [];
  } catch (err) {
    console.error("Fetch my VTuber applications error:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    return [];
  }
};
