import axiosInstance from '@/utils/axiosInstance';

/**
 * Get all feedback categories
 * @returns {Promise<Array>} Array of feedback categories
 */
export const getFeedbackCategories = async () => {
  try {
    const res = await axiosInstance.get('/feedback/categories');

    console.log('getFeedbackCategories response:', res.data);

    if (res.data?.success && res.data?.data) {
      return Array.isArray(res.data.data) ? res.data.data : [];
    }

    return [];
  } catch (err) {
    console.error('Get feedback categories error:', {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    return [];
  }
};

/**
 * Submit feedback
 * @param {number} categoryId - Feedback category ID
 * @param {string} content - Feedback content
 * @returns {Promise<Object>} Submission result
 */
export const submitFeedback = async (categoryId, content) => {
  try {
    const res = await axiosInstance.post('/feedback/submit', {
      categoryId: Number(categoryId),
      content,
    });

    console.log('submitFeedback response:', res.data);
    return res.data;
  } catch (err) {
    console.error('Submit feedback error:', {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    return err.response?.data || { success: false, message: err.message };
  }
};

/**
 * Get user's feedback history
 * @returns {Promise<Array>} Array of user's feedback submissions
 */
export const getMyFeedback = async () => {
  try {
    const res = await axiosInstance.get('/feedback/my-feedback');

    console.log('getMyFeedback response:', res.data);

    if (res.data?.success && res.data?.data) {
      return Array.isArray(res.data.data) ? res.data.data : [];
    }

    return [];
  } catch (err) {
    console.error('Get my feedback error:', {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    return [];
  }
};

/**
 * Get all feedback (admin view)
 * @param {number} pageNo - Page number
 * @param {number} pageSize - Page size
 * @param {string} sortBy - Sort field
 * @returns {Promise<Array>} Array of all feedback
 */
export const getAllFeedback = async (pageNo = 0, pageSize = 10, sortBy = 'createdAt') => {
  try {
    const res = await axiosInstance.get(
      `/feedback/all?pageNo=${pageNo}&pageSize=${pageSize}&sortBy=${sortBy}`
    );

    console.log('getAllFeedback response:', res.data);

    if (res.data?.success && res.data?.data) {
      return Array.isArray(res.data.data) ? res.data.data : [];
    }

    return [];
  } catch (err) {
    console.error('Get all feedback error:', {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    return [];
  }
};
