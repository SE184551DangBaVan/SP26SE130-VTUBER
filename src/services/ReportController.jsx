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
 * @param {number} [relatedCommentId] - Optional related comment ID
 * @returns {Promise<Object>} Response data { success, message, data }
 */
export const reportMember = async (memberId, reason, relatedCommentId) => {
  try {
    const body = {
      memberId,
      reason,
    };
    if (relatedCommentId) {
      body.relatedCommentId = relatedCommentId;
    }

    const res = await axiosInstance.post("/fan-hub-member/report", body);

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
 * Get all pending post reports for a fan hub
 * @param {number} fanHubId - Fan Hub ID
 * @param {number} pageNo - Page number
 * @param {number} pageSize - Page size
 * @param {string} sortBy - Sort field
 * @returns {Promise<Array>} Array of pending post reports
 */
export const getPendingPostReports = async (fanHubId, pageNo = 0, pageSize = 10, sortBy = "createdAt") => {
  try {
    const res = await axiosInstance.get(
      `/posts/reports/pending-posts/${fanHubId}?pageNo=${pageNo}&pageSize=${pageSize}&sortBy=${sortBy}`
    );

    console.log("getPendingPostReports response:", res.data);

    if (res.data?.success && res.data?.data) {
      return res.data.data;
    }

    return [];
  } catch (err) {
    console.error("Get pending post reports error:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    return [];
  }
};

/**
 * Get all pending member reports for a fan hub
 * @param {number} fanHubId - Fan Hub ID
 * @param {number} pageNo - Page number
 * @param {number} pageSize - Page size
 * @param {string} sortBy - Sort field
 * @returns {Promise<Array>} Array of pending member reports
 */
export const getPendingMemberReports = async (fanHubId, pageNo = 0, pageSize = 10, sortBy = "createdAt") => {
  try {
    const res = await axiosInstance.get(
      `/fan-hub-member/reports/pending-members/${fanHubId}?pageNo=${pageNo}&pageSize=${pageSize}&sortBy=${sortBy}`
    );

    console.log("getPendingMemberReports response:", res.data);

    if (res.data?.success && res.data?.data) {
      return res.data.data;
    }

    return [];
  } catch (err) {
    console.error("Get pending member reports error:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    return [];
  }
};

/**
 * Get all post reports submitted by the current user
 * @param {number} pageNo - Page number
 * @param {number} pageSize - Page size
 * @param {string} sortBy - Sort field
 * @returns {Promise<Array>} Array of user's post reports
 */
export const getMyPostReports = async (pageNo = 0, pageSize = 10, sortBy = "createdAt") => {
  try {
    const res = await axiosInstance.get(
      `/posts/reports/my-posts-report?pageNo=${pageNo}&pageSize=${pageSize}&sortBy=${sortBy}`
    );

    console.log("getMyPostReports response:", res.data);

    if (res.data?.success && res.data?.data) {
      return res.data.data;
    }

    return [];
  } catch (err) {
    console.error("Get my post reports error:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    return [];
  }
};

/**
 * Get all member reports submitted by the current user
 * @param {number} pageNo - Page number
 * @param {number} pageSize - Page size
 * @param {string} sortBy - Sort field
 * @returns {Promise<Array>} Array of user's member reports
 */
export const getMyMemberReports = async (pageNo = 0, pageSize = 10, sortBy = "createdAt") => {
  try {
    const res = await axiosInstance.get(
      `/fan-hub-member/reports/my-members-report?pageNo=${pageNo}&pageSize=${pageSize}&sortBy=${sortBy}`
    );

    console.log("getMyMemberReports response:", res.data);

    if (res.data?.success && res.data?.data) {
      return res.data.data;
    }

    return [];
  } catch (err) {
    console.error("Get my member reports error:", {
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

/**
 * Get all posts with their reports for a fan hub
 * @param {number} fanHubId - Fan Hub ID
 * @param {number} pageNo - Page number
 * @param {number} pageSize - Page size
 * @param {string} sortBy - Sort field
 * @returns {Promise<Object>} Response data with posts and nested reports
 */
export const getPostsWithReports = async (fanHubId, pageNo = 0, pageSize = 10, sortBy = "createdAt") => {
  try {
    const res = await axiosInstance.get(
      `/posts/reports/posts-with-reports/${fanHubId}?pageNo=${pageNo}&pageSize=${pageSize}&sortBy=${sortBy}`
    );

    console.log("getPostsWithReports response:", res.data);

    if (res.data?.success && res.data?.data) {
      return res.data;
    }

    return res.data || { success: false, message: "No data returned" };
  } catch (err) {
    console.error("Get posts with reports error:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    return err.response?.data || { success: false, message: err.message };
  }
};

/**
 * Bulk resolve multiple reports for a post
 * @param {number[]} reportIds - Array of report IDs to resolve
 * @param {string} resolveMessage - Resolution message/reason
 * @returns {Promise<Object>} Response data
 */
export const bulkResolveReports = async (reportIds, resolveMessage) => {
  try {
    const reportIdsParam = reportIds.map((id) => `reportIds=${id}`).join("&");
    const res = await axiosInstance.put(
      `/posts/reports/bulk-resolve?${reportIdsParam}&resolveMessage=${encodeURIComponent(resolveMessage)}`
    );

    console.log("bulkResolveReports response:", res.data);

    if (res.data?.success) {
      return res.data;
    }

    throw new Error(res.data?.message || "Failed to resolve reports");
  } catch (err) {
    console.error("Bulk resolve reports error:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    return err.response?.data || { success: false, message: err.message };
  }
};

/**
 * Get all members with their reports for a fan hub
 * @param {number} fanHubId - Fan Hub ID
 * @param {number} pageNo - Page number
 * @param {number} pageSize - Page size
 * @param {string} sortBy - Sort field
 * @returns {Promise<Object>} Response data with members and nested reports
 */
export const getMembersWithReports = async (fanHubId, pageNo = 0, pageSize = 10, sortBy = "createdAt") => {
  try {
    const res = await axiosInstance.get(
      `/fan-hub-member/reports/members-with-reports/${fanHubId}?pageNo=${pageNo}&pageSize=${pageSize}&sortBy=${sortBy}`
    );

    console.log("getMembersWithReports response:", res.data);

    if (res.data?.success && res.data?.data) {
      return res.data;
    }

    return res.data || { success: false, message: "No data returned" };
  } catch (err) {
    console.error("Get members with reports error:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    return err.response?.data || { success: false, message: err.message };
  }
};

/**
 * Bulk resolve multiple member reports
 * @param {number[]} reportIds - Array of report IDs to resolve
 * @param {string} resolveMessage - Resolution message/reason
 * @returns {Promise<Object>} Response data
 */
export const bulkResolveMemberReports = async (reportIds, resolveMessage) => {
  try {
    const reportIdsParam = reportIds.map((id) => `reportIds=${id}`).join("&");
    const res = await axiosInstance.put(
      `/fan-hub-member/reports/bulk-resolve?${reportIdsParam}&resolveMessage=${encodeURIComponent(resolveMessage)}`
    );

    console.log("bulkResolveMemberReports response:", res.data);

    if (res.data?.success) {
      return res.data;
    }

    throw new Error(res.data?.message || "Failed to resolve member reports");
  } catch (err) {
    console.error("Bulk resolve member reports error:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    return err.response?.data || { success: false, message: err.message };
  }
};
