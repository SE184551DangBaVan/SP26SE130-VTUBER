import axiosInstance from "@/utils/axiosInstance";

/**
 * Get fan hub reports with reports data
 * @param {number} pageNo - Page number (default: 0)
 * @param {number} pageSize - Page size (default: 10)
 * @param {string} sortBy - Sort field (default: 'createdAt')
 * @returns {Promise<Array>} Array of fan hub reports with reports data
 */
export const getFanHubReportsWithReports = async (pageNo = 0, pageSize = 10, sortBy = 'createdAt') => {
  try {
    const res = await axiosInstance.get(`/fan-hub-report/with-reports`, {
      params: {
        pageNo,
        pageSize,
        sortBy
      }
    });

    console.log("getFanHubReportsWithReports response:", res.data);

    if (res.data?.success && res.data?.data) {
      return res.data.data;
    }

    return [];
  } catch (err) {
    console.error("Fetch fan hub reports with reports error:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    return [];
  }
};