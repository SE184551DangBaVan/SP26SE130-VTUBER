import axiosInstance from "@/utils/axiosInstance";

/**
 * Create a new join question for a fan hub
 * @param {number} hubId - Fan Hub ID
 * @param {Object} questionData - Question data { content, orderNumber }
 * @returns {Promise<Object>} Result of the operation
 */
export const createJoinQuestion = async (hubId, questionData) => {
  try {
    const res = await axiosInstance.post(
      `/fan-hub-join-questions/hub/${hubId}`,
      questionData
    );

    console.log("createJoinQuestion response:", res.data);

    if (res.data?.success) {
      return res.data;
    }

    return { success: false, message: res.data?.message || "Failed to create question" };
  } catch (err) {
    console.error("Create join question error:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    return err.response?.data || { success: false, message: err.message };
  }
};

/**
 * Get all join questions for a fan hub
 * @param {number} hubId - Fan Hub ID
 * @returns {Promise<Array>} Questions data
 */
export const getJoinQuestions = async (hubId) => {
  try {
    const res = await axiosInstance.get(`/fan-hub-join-questions/hub/${hubId}`);

    console.log("getJoinQuestions response:", res.data);

    if (res.data?.success && res.data?.data) {
      return res.data.data;
    }

    return [];
  } catch (err) {
    console.error("Fetch join questions error:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    return [];
  }
};

/**
 * Update an existing join question
 * @param {number} questionId - Question ID
 * @param {Object} questionData - Updated question data { content, orderNumber }
 * @returns {Promise<Object>} Result of the operation
 */
export const updateJoinQuestion = async (questionId, questionData) => {
  try {
    const res = await axiosInstance.put(
      `/fan-hub-join-questions/${questionId}`,
      questionData
    );

    console.log("updateJoinQuestion response:", res.data);

    if (res.data?.success) {
      return res.data;
    }

    return { success: false, message: res.data?.message || "Failed to update question" };
  } catch (err) {
    console.error("Update join question error:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    return err.response?.data || { success: false, message: err.message };
  }
};

/**
 * Delete a join question
 * @param {number} questionId - Question ID
 * @returns {Promise<Object>} Result of the operation
 */
export const deleteJoinQuestion = async (questionId) => {
  try {
    const res = await axiosInstance.delete(`/fan-hub-join-questions/${questionId}`);

    console.log("deleteJoinQuestion response:", res.data);

    if (res.data?.success) {
      return res.data;
    }

    return { success: false, message: res.data?.message || "Failed to delete question" };
  } catch (err) {
    console.error("Delete join question error:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    return err.response?.data || { success: false, message: err.message };
  }
};
