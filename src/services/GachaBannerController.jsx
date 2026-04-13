import axiosInstance from "@/utils/axiosInstance";

/**
 * Get all active banners
 * @returns {Promise<Array>} Array of active banner data
 */
export const getActiveBanners = async () => {
  try {
    const res = await axiosInstance.get('/banners/active');

    if (res.data?.success && res.data?.data) {
      // API returns single object or array
      const data = res.data.data;
      return Array.isArray(data) ? data.filter(b => b.isActive) : [data];
    }

    return [];
  } catch (err) {
    console.error('Get active banners error:', {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    return [];
  }
};

/**
 * Perform a single gacha pull
 * @param {number} bannerId - Banner ID to pull from
 * @returns {Promise<Object>} Gacha result item data
 */
export const doGachaPull = async (bannerId) => {
  try {
    const res = await axiosInstance.post('/banners/gacha', { bannerId });

    if (res.data?.success && res.data?.data) {
      return res.data.data;
    }

    return null;
  } catch (err) {
    console.error('Gacha pull error:', {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    return null;
  }
};
