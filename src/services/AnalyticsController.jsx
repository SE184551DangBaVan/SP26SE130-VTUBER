import { axiosInstance } from '@/utils/axiosInstance';

/**
 * Get admin analytics summary from the backend.
 * @returns {Promise<Object>} Analytics response payload
 */
export const getAdminAnalytics = async () => {
  try {
    const response = await axiosInstance.get('/admin/analytics');
    return response.data || { success: false, message: 'No analytics response received' };
  } catch (err) {
    console.error('Fetch admin analytics error:', {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });

    return err.response?.data || {
      success: false,
      message: err.message || 'Unable to fetch analytics',
    };
  }
};
