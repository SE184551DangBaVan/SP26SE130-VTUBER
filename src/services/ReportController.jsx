import axiosInstance from "@/utils/axiosInstance";

/**
 * Report a post
 * @param {number} postId - The ID of the post to report
 * @param {string} reason - The reason for reporting
 * @returns {Promise<Object>} Response data { success, message, data }
 */
export const reportPost = async (postId, reason) => {
  try {
    const res = await axiosInstance.post("/posts/report", {
      postId,
      reason,
    });

    console.log("reportPost response:", res.data);

    if (res.data?.success) {
      return res.data;
    }

    throw new Error(res.data?.message || "Failed to report post");
  } catch (err) {
    console.error("Report post error:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    throw err;
  }
};

/**
 * Report a fan hub member
 * @param {number} memberId - The ID of the member to report
 * @param {string} reason - The reason for reporting
 * @returns {Promise<Object>} Response data { success, message, data }
 */
export const reportMember = async (memberId, reason) => {
  try {
    const res = await axiosInstance.post("/fan-hub-member/report", {
      memberId,
      reason,
    });

    console.log("reportMember response:", res.data);

    if (res.data?.success) {
      return res.data;
    }

    throw new Error(res.data?.message || "Failed to report member");
  } catch (err) {
    console.error("Report member error:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    throw err;
  }
};

/**
 * Get all post reports for a fan hub
 * @param {number} fanHubId - Fan Hub ID
 * @param {number} pageNo - Page number
 * @param {number} pageSize - Page size
 * @param {string} sortBy - Sort field
 * @returns {Promise<Array>} Array of post reports
 */
export const getPostReports = async (fanHubId, pageNo = 0, pageSize = 10, sortBy = "createdAt") => {
  try {
    const res = await axiosInstance.get(
      `/posts/reports/posts/${fanHubId}?pageNo=${pageNo}&pageSize=${pageSize}&sortBy=${sortBy}`
    );

    console.log("getPostReports response:", res.data);

    if (res.data?.success && res.data?.data) {
      return res.data.data;
    }

    return [];
  } catch (err) {
    console.error("Get post reports error:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    return [];
  }
};

/**
 * Get all member reports for a fan hub
 * @param {number} fanHubId - Fan Hub ID
 * @param {number} pageNo - Page number
 * @param {number} pageSize - Page size
 * @param {string} sortBy - Sort field
 * @returns {Promise<Array>} Array of member reports
 */
export const getMemberReports = async (fanHubId, pageNo = 0, pageSize = 10, sortBy = "createdAt") => {
  try {
    const res = await axiosInstance.get(
      `/fan-hub-member/reports/members/${fanHubId}?pageNo=${pageNo}&pageSize=${pageSize}&sortBy=${sortBy}`
    );

    console.log("getMemberReports response:", res.data);

    if (res.data?.success && res.data?.data) {
      return res.data.data;
    }

    return [];
  } catch (err) {
    console.error("Get member reports error:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    return [];
  }
};

/**
 * Resolve a post report
 * @param {number} reportId - Report ID
 * @param {string} resolveMessage - Resolution message/reason
 * @returns {Promise<Object>} Response data
 */
export const resolvePostReport = async (reportId, resolveMessage) => {
  try {
    const res = await axiosInstance.put(
      `/posts/report/resolve?reportId=${reportId}&resolveMessage=${encodeURIComponent(resolveMessage)}`
    );

    console.log("resolvePostReport response:", res.data);

    if (res.data?.success) {
      return res.data;
    }

    throw new Error(res.data?.message || "Failed to resolve post report");
  } catch (err) {
    console.error("Resolve post report error:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    throw err;
  }
};

/**
 * Resolve a member report
 * @param {number} reportId - Report ID
 * @param {string} resolveMessage - Resolution message/reason
 * @returns {Promise<Object>} Response data
 */
export const resolveMemberReport = async (reportId, resolveMessage) => {
  try {
    const res = await axiosInstance.put(
      `/fan-hub-member/report/resolve?reportId=${reportId}&resolveMessage=${encodeURIComponent(resolveMessage)}`
    );

    console.log("resolveMemberReport response:", res.data);

    if (res.data?.success) {
      return res.data;
    }

    throw new Error(res.data?.message || "Failed to resolve member report");
  } catch (err) {
    console.error("Resolve member report error:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    throw err;
  }
};
