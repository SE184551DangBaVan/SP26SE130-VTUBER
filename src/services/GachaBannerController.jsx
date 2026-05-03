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

/**
 * Get all banners (active and inactive)
 * @param {number} pageNo - Page number
 * @param {number} pageSize - Page size
 * @param {string} sortBy - Sort field
 * @returns {Promise<Array>} Array of all banners
 */
export const getAllBanners = async (pageNo = 0, pageSize = 100, sortBy = 'id') => {
  try {
    const res = await axiosInstance.get(
      `/banners/all?pageNo=${pageNo}&pageSize=${pageSize}&sortBy=${sortBy}`
    );

    console.log('getAllBanners response:', res.data);

    if (res.data?.success && res.data?.data) {
      return res.data.data;
    }

    return [];
  } catch (err) {
    console.error('Get all banners error:', {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    return [];
  }
};

/**
 * Create a new banner
 * @param {Object} payload - Banner data
 * @param {string} payload.name - Banner name
 * @param {string} payload.startTime - Start time (ISO string)
 * @param {string} payload.endTime - End time (ISO string)
 * @param {string} payload.description - Banner description
 * @param {number} payload.gachaCost - Cost per pull
 * @param {File} payload.bannerImageFile - Banner image file
 * @returns {Promise<Object>} Creation result
 */
export const createBanner = async ({
  name,
  startTime,
  endTime,
  description,
  gachaCost,
  bannerImageFile,
}) => {
  try {
    const formData = new FormData();

    // Add request JSON data as Blob with proper content type
    const requestPayload = {
      name,
      startTime,
      endTime,
      description,
      gachaCost: Number(gachaCost),
    };

    formData.append(
      'request',
      new Blob([JSON.stringify(requestPayload)], { type: 'application/json' })
    );

    // Add banner image file if provided
    if (bannerImageFile) {
      formData.append('bannerImage', bannerImageFile);
    }

    const res = await axiosInstance.post('/banners/add', formData);

    console.log('createBanner response:', res.data);
    return res.data;
  } catch (err) {
    console.error('Create banner error:', {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    return err.response?.data || { success: false, message: err.message };
  }
};

/**
 * Get banner items for a specific banner
 * @param {number} bannerId - Banner ID
 * @param {number} pageNo - Page number
 * @param {number} pageSize - Page size
 * @param {string} sortBy - Sort field
 * @returns {Promise<Array>} Array of banner items
 */
export const getBannerItems = async (
  bannerId,
  pageNo = 0,
  pageSize = 100,
  sortBy = 'id'
) => {
  try {
    const res = await axiosInstance.get(
      `/banners/items/all?bannerId=${bannerId}&pageNo=${pageNo}&pageSize=${pageSize}&sortBy=${sortBy}`
    );

    console.log('getBannerItems response:', res.data);

    if (res.data?.success && res.data?.data) {
      return res.data.data;
    }

    return [];
  } catch (err) {
    console.error('Get banner items error:', {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    return [];
  }
};

/**
 * Add a banner item to a banner
 * @param {number} bannerId - Banner ID
 * @param {Object} payload - Banner item data
 * @param {number} payload.itemId - Item ID (optional)
 * @param {string} payload.itemName - Item name
 * @param {string} payload.description - Item description
 * @param {string} payload.category - Item category
 * @param {number} payload.multiplier - Drop rate multiplier
 * @param {string} payload.type - Item type (MAIN_REWARD or GOOD_LUCK)
 * @param {File} payload.imageFile - Item image file
 * @returns {Promise<Object>} Add result
 */
export const addBannerItem = async (bannerId, {
  itemId,
  itemName,
  description,
  category,
  multiplier,
  type,
  imageFile,
}) => {
  try {
    const formData = new FormData();

    // Add request JSON data as Blob with proper content type
    const requestPayload = {
      bannerId: Number(bannerId),
      itemId: itemId ? Number(itemId) : null,
      itemName,
      description,
      category: category?.toUpperCase?.() || '',
      multiplier: Number(multiplier),
      type: type?.toUpperCase?.() || 'MAIN_REWARD',
    };

    formData.append(
      'request',
      new Blob([JSON.stringify(requestPayload)], { type: 'application/json' })
    );

    // Add image file if provided
    if (imageFile) {
      formData.append('image', imageFile);
    }

    const res = await axiosInstance.post(
      `/banners/items/add`,
      formData
    );

    console.log('addBannerItem response:', res.data);
    return res.data;
  } catch (err) {
    console.error('Add banner item error:', {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    return err.response?.data || { success: false, message: err.message };
  }
};

/**
 * Activate a banner
 * @param {number} bannerId - Banner ID to activate
 * @returns {Promise<Object>} Activation result
 */
export const activateBanner = async (bannerId) => {
  try {
    const res = await axiosInstance.post(`/banners/${bannerId}/activate`);

    console.log('activateBanner response:', res.data);
    return res.data;
  } catch (err) {
    console.error('Activate banner error:', {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    return err.response?.data || { success: false, message: err.message };
  }
};

/**
 * Deactivate a banner
 * @param {number} bannerId - Banner ID to deactivate
 * @returns {Promise<Object>} Deactivation result
 */
export const deactivateBanner = async (bannerId) => {
  try {
    const res = await axiosInstance.post(`/banners/${bannerId}/deactivate`);

    console.log('deactivateBanner response:', res.data);
    return res.data;
  } catch (err) {
    console.error('Deactivate banner error:', {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    return err.response?.data || { success: false, message: err.message };
  }
};

/**
 * Edit a banner item
 * @param {number} bannerItemId - Banner Item ID to edit
 * @param {Object} payload - Banner item data
 * @returns {Promise<Object>} Update result
 */
export const editBannerItem = async (bannerItemId, {
  itemName,
  description,
  category,
  multiplier,
  type,
  size,
  xaxis,
  yaxis,
  imageFile,
}) => {
  try {
    const formData = new FormData();

    const requestPayload = {
      itemName,
      description,
      category: category?.toUpperCase?.() || '',
      multiplier: Number(multiplier),
      type: type?.toUpperCase?.() || 'MAIN_REWARD',
      size: Number(size),
      xaxis: Number(xaxis),
      yaxis: Number(yaxis),
    };

    formData.append(
      'request',
      new Blob([JSON.stringify(requestPayload)], { type: 'application/json' })
    );

    if (imageFile) {
      formData.append('image', imageFile);
    }

    const res = await axiosInstance.put(
      `/banners/items/${bannerItemId}/edit`,
      formData
    );

    console.log('editBannerItem response:', res.data);
    return res.data;
  } catch (err) {
    console.error('Edit banner item error:', {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    return err.response?.data || { success: false, message: err.message };
  }
};

/**
 * Delete a banner
 * @param {number} bannerId - Banner ID to delete
 * @returns {Promise<Object>} Deletion result
 */
export const deleteBanner = async (bannerId) => {
  try {
    const res = await axiosInstance.delete(`/banners/${bannerId}/delete`);

    console.log('deleteBanner response:', res.data);
    return res.data;
  } catch (err) {
    console.error('Delete banner error:', {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    return err.response?.data || { success: false, message: err.message };
  }
};

/**
 * Delete an item from a gacha banner
 * @param {number} bannerItemId - Banner Item ID to delete
 * @returns {Promise<Object>} Deletion result
 */
export const deleteBannerItem = async (bannerItemId) => {
  try {
    const res = await axiosInstance.delete(`/banners/items/${bannerItemId}/delete`);

    console.log('deleteBannerItem response:', res.data);
    return res.data;
  } catch (err) {
    console.error('Delete banner item error:', {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    return err.response?.data || { success: false, message: err.message };
  }
};

