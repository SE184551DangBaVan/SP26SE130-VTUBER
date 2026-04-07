import axiosInstance from "@/utils/axiosInstance";

/**
 * Get members of a fan hub
 * @param {number} fanHubId - Fan Hub ID
 * @param {number} pageNo - Page number
 * @param {number} pageSize - Page size
 * @param {string} sortBy - Sort by field (joinedAt, etc.)
 * @returns {Promise<Array>} Members data
 */
export const getHubMembers = async (fanHubId, pageNo = 0, pageSize = 50, sortBy = "joinedAt") => {
  try {
    const res = await axiosInstance.get(
      `/fan-hub-member/members/${fanHubId}?pageNo=${pageNo}&pageSize=${pageSize}&sortBy=${sortBy}`
    );

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
 * @returns {Promise<Array>} Bans data
 */
export const getFanHubBans = async (fanHubId, pageNo = 0, pageSize = 50, sortBy = "createdAt") => {
  try {
    const res = await axiosInstance.get(
      `/fan-hub-member/bans/${fanHubId}?pageNo=${pageNo}&pageSize=${pageSize}&sortBy=${sortBy}`
    );

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