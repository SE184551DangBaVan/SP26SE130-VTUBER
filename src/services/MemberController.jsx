import axiosInstance from "@/utils/axiosInstance";

/**
 * Get members of a fan hub
 * @param {number} fanHubId - Fan Hub ID
 * @param {number} pageNo - Page number
 * @param {number} pageSize - Page size
 * @param {string} sortBy - Sort by field (joinedAt, etc.)
 * @param {string} role - Optional role filter (MEMBER or MODERATOR)
 * @returns {Promise<Array>} Members data
 */
export const getHubMembers = async (fanHubId, pageNo = 0, pageSize = 50, sortBy = "joinedAt", role = "") => {
  try {
    let url = `/fan-hub-member/members/${fanHubId}?pageNo=${pageNo}&pageSize=${pageSize}&sortBy=${sortBy}`;
    if (role) {
      url += `&role=${role}`;
    }
    const res = await axiosInstance.get(url);

    console.log("getHubMembers response:", res.data);

    if (res.data?.success && res.data?.data) {
      return res.data.data;
    }

    return [];
  } catch (err) {
    console.error("Fetch hub members error:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    return [];
  }
};

/**
 * Set a member as moderator of a fan hub
 * @param {number} fanHubId - Fan Hub ID
 * @param {number[]} memberIds - Array of member IDs to promote
 * @returns {Promise<Object>} Result of the operation
 */
export const setModerator = async (fanHubId, memberIds) => {
  try {
    const res = await axiosInstance.post(
      `/fan-hub-member/set-moderator/${fanHubId}?memberIds=${memberIds.join(',')}`,
      {}
    );

    console.log("setModerator response:", res.data);

    if (res.data?.success) {
      return res.data;
    }

    return { success: false, message: "Failed to set moderator" };
  } catch (err) {
    console.error("Set moderator error:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    return err.response?.data || { success: false, message: err.message };
  }
};

/**
 * Remove a member from moderator role in a fan hub
 * @param {number} fanHubId - Fan Hub ID
 * @param {number[]} memberIds - Array of member IDs to demote
 * @returns {Promise<Object>} Result of the operation
 */
export const removeModerator = async (fanHubId, memberIds) => {
  try {
    const res = await axiosInstance.post(
      `/fan-hub-member/remove-moderator/${fanHubId}?memberIds=${memberIds.join(',')}`,
      {}
    );

    console.log("removeModerator response:", res.data);

    if (res.data?.success) {
      return res.data;
    }

    return { success: false, message: "Failed to remove moderator" };
  } catch (err) {
    console.error("Remove moderator error:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    return err.response?.data || { success: false, message: err.message };
  }
};

/**
 * Get pending members of a fan hub (requests requiring approval)
 * @param {number} fanHubId - Fan Hub ID
 * @param {number} pageNo - Page number
 * @param {number} pageSize - Page size
 * @param {string} sortBy - Sort by field
 * @param {string} sortDir - Sort direction (asc, desc)
 * @returns {Promise<Array>} Pending members data
 */
export const getPendingMembers = async (fanHubId, pageNo = 0, pageSize = 50, sortBy = "joinedAt", sortDir = "asc") => {
  try {
    const res = await axiosInstance.get(
      `/fan-hub-member/pending-members/${fanHubId}?pageNo=${pageNo}&pageSize=${pageSize}&sortBy=${sortBy}&sortDir=${sortDir}`
    );

    console.log("getPendingMembers response:", res.data);

    if (res.data?.success && res.data?.data) {
      return res.data.data;
    }

    return [];
  } catch (err) {
    console.error("Fetch pending members error:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    return [];
  }
};

/**
 * Join a fan hub
 * @param {number} fanHubId - Fan Hub ID
 * @returns {Promise<Object>} Result of the join operation
 */
export const joinFanHub = async (fanHubId) => {
  try {
    const res = await axiosInstance.post(
      `/fan-hub-member/join/${fanHubId}`,
      {}
    );

    console.log("joinFanHub response:", res.data);

    if (res.data?.success) {
      return res.data;
    }

    return { success: false, message: "Failed to join fan hub" };
  } catch (err) {
    console.error("Join fan hub error:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    return err.response?.data || { success: false, message: err.message };
  }
};

/**
 * Leave a fan hub
 * @param {number} fanHubId - Fan Hub ID
 * @returns {Promise<Object>} Result of the leave operation
 */
export const leaveFanHub = async (fanHubId) => {
  try {
    const res = await axiosInstance.put(
      `/fan-hub-member/${fanHubId}/leave`,
      {}
    );

    console.log("leaveFanHub response:", res.data);

    if (res.data?.success) {
      return res.data;
    }

    return { success: false, message: "Failed to leave fan hub" };
  } catch (err) {
    console.error("Leave fan hub error:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    return err.response?.data || { success: false, message: err.message };
  }
};

/**
 * Join a fan hub with answers to questionnaire
 * @param {number} fanHubId - Fan Hub ID
 * @param {Array} answers - Array of { questionId, content }
 * @returns {Promise<Object>} Result of the join operation
 */
export const joinFanhubWithAnswers = async (fanHubId, answers) => {
  try {
    const res = await axiosInstance.post(
      `/fan-hub-member/join-with-answers/${fanHubId}`,
      answers
    );

    console.log("joinFanhubWithAnswers response:", res.data);

    if (res.data?.success) {
      return res.data;
    }

    return { success: false, message: "Failed to join fan hub" };
  } catch (err) {
    console.error("Join fan hub with answers error:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    return err.response?.data || { success: false, message: err.message };
  }
};

export const banFanHubMember = async (payload) => {

    try {
        const res = await axiosInstance.post(
            `/fan-hub-member/ban`,payload,
            {}
        );

        console.log("joinFanHub response:", res.data);

        if (res.data?.success) {
            return res.data;
        }

        return { success: false, message: "Failed to join fan hub" };
    } catch (err) {
        console.error("Join fan hub error:", {
            message: err.message,
            status: err.response?.status,
            data: err.response?.data,
        });
        return err.response?.data || { success: false, message: err.message };
    }
};

/**
 * Get all bans for a fan hub
 * @param {number} fanHubId - Fan Hub ID
 * @param {number} pageNo - Page number
 * @param {number} pageSize - Page size
 * @param {string} sortBy - Sort by field
 * @param {string} banType - Optional ban type filter (COMMENT, POST, etc.)
 * @returns {Promise<Array>} Bans data
 */
export const getFanHubBans = async (fanHubId, pageNo = 0, pageSize = 50, sortBy = "createdAt", banType = "") => {
  try {
    let url = `/fan-hub-member/bans/${fanHubId}?pageNo=${pageNo}&pageSize=${pageSize}&sortBy=${sortBy}`;
    if (banType) {
      url += `&banType=${banType}`;
    }
    const res = await axiosInstance.get(url);

    console.log("getFanHubBans response:", res.data);

    if (res.data?.success && res.data?.data) {
      return res.data.data;
    }

    return [];
  } catch (err) {
    console.error("Fetch fan hub bans error:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    return [];
  }
};

/**
 * Revoke a ban
 * @param {number} banId - Ban ID
 * @returns {Promise<Object>} Result of the operation
 */
export const revokeBan = async (banId) => {
  try {
    const res = await axiosInstance.put(
      `/fan-hub-member/ban/revoke?banId=${banId}`,
      {}
    );

    console.log("revokeBan response:", res.data);

    if (res.data?.success) {
      return res.data;
    }

    return { success: false, message: "Failed to revoke ban" };
  } catch (err) {
    console.error("Revoke ban error:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    return err.response?.data || { success: false, message: err.message };
  }
};

/**
 * Kick a member from a fan hub
 * @param {number} fanHubId - Fan Hub ID
 * @param {number} memberId - Member ID to kick
 * @returns {Promise<Object>} Result of the operation
 */
export const kickMember = async (fanHubId, memberId) => {
  try {
    const res = await axiosInstance.put(
      `/fan-hub-member/${fanHubId}/kick/${memberId}`,
      {}
    );

    console.log("kickMember response:", res.data);

    if (res.data?.success) {
      return res.data;
    }

    return { success: false, message: "Failed to kick member" };
  } catch (err) {
    console.error("Kick member error:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    return err.response?.data || { success: false, message: err.message };
  }
};

/**
 * Get member detail by ID
 * @param {number} memberId - Fan Hub Member ID
 * @returns {Promise<Object>} Member detail data
 */
export const getMemberDetail = async (memberId) => {
  try {
    const res = await axiosInstance.get(`/fan-hub-member/members/${memberId}/detail`);

    console.log("getMemberDetail response:", res.data);

    if (res.data?.success && res.data?.data) {
      return res.data;
    }

    return { success: false, message: "Failed to fetch member details" };
  } catch (err) {
    console.error("Fetch member detail error:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    return err.response?.data || { success: false, message: err.message };
  }
};

/**
 * Review a membership request (Approve or Reject)
 * @param {number} fanHubMemberId - Fan Hub Member ID
 * @param {string} status - New status (APPROVED or REJECTED)
 * @returns {Promise<Object>} Result of the review operation
 */
export const reviewMember = async (fanHubMemberId, status) => {
  try {
    const res = await axiosInstance.put(
      `/fan-hub-member/review?fanHubMemberId=${fanHubMemberId}&status=${status}`,
      {}
    );

    console.log("reviewMember response:", res.data);

    if (res.data?.success) {
      return res.data;
    }

    return { success: false, message: "Failed to review membership request" };
    } catch (err) {
    console.error("Review member error:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    return err.response?.data || { success: false, message: err.message };
    }
    };

    /**
    * Get count of Member Reports
    * @param {number} fanHubId 
    * @returns {Promise<number>} Count
    */
    export const getMemberReportsCount = async (fanHubId) => {
    try {
    const res = await axiosInstance.get(`/fan-hub-member/count-report-members/${fanHubId}`);
    if (res.data?.success) {
      return res.data.data;
    }
    return 0;
    } catch (err) {
    console.error("Get member reports count error:", err);
    return 0;
    }
    };

    /**
    * Get count of Pending Members (Members requiring approval)
    * @param {number} fanHubId 
    * @returns {Promise<number>} Count
    */
    export const getPendingMembersCount = async (fanHubId) => {
    try {
    const res = await axiosInstance.get(`/fan-hub-member/count-pending-members/${fanHubId}`);
    if (res.data?.success) {
      return res.data.data;
    }
    return 0;
    } catch (err) {
    console.error("Get pending members count error:", err);
    return 0;
    }
    };