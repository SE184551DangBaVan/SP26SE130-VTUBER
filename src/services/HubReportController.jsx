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

/**
 * Bulk resolve fan hub reports
 * @param {Array<number>} reportIds - Array of report IDs to resolve
 * @param {string} resolveMessage - Resolution message
 * @returns {Promise<Object>} API response
 */
export const bulkResolveFanHubReports = async (reportIds = [], resolveMessage = 'Resolved by admin') => {
  try {
    const res = await axiosInstance.put(`/fan-hub-report/bulk-resolve`, null, {
      params: {
        reportIds,
        resolveMessage
      }
    });

    console.log("bulkResolveFanHubReports response:", res.data);
    return res.data;
  } catch (err) {
    console.error("Bulk resolve fan hub reports error:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    return err.response?.data || { success: false, message: err.message };
  }
};

/**
 * Create a report for a fan hub
 * @param {number} fanHubId - Fan Hub ID
 * @param {string} reason - Report reason
 * @returns {Promise<Object>} API response
 */
export const createFanHubReport = async (fanHubId, reason) => {
  try {
    const res = await axiosInstance.post(`/fan-hub-report/create`, {
      fanHubId,
      reason
    });

    console.log("createFanHubReport response:", res.data);
    return res.data;
  } catch (err) {
    console.error("Create fan hub report error:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    return err.response?.data || { success: false, message: err.message };
  }
};