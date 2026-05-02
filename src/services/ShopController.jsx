import { axiosInstance } from "@/utils/axiosInstance";
import { showSuccess, showError } from '../utils/toastUtils';

/**
 * Get all shop items
 * @param {number} pageNo - Page number
 * @param {number} pageSize - Page size
 * @param {string} sortBy - Sort field
 * @returns {Promise<Array>} Array of shop items
 */
export const getShopItems = async (pageNo = 0, pageSize = 100, sortBy = "id") => {
  try {
    const res = await axiosInstance.get(
      `/shop-items/all?pageNo=${pageNo}&pageSize=${pageSize}&sortBy=${sortBy}`
    );

    console.log("getShopItems response:", res.data);

    if (res.data?.success && res.data?.data) {
      return res.data.data;
    }
    return [];
  } catch (err) {
    if (err.response?.status == 401) {
      showError("You need to Login to access this page!");
    }
    console.error("Fetch shop items error:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    return [];
  }
};

/**
 * Add a new shop item (VTuber/Hub owner only)
 * @param {Object} payload - Item data
 * @returns {Promise<Object>} Add result
 */
export const addShopItem = async ({ 
  itemId = null,
  itemName = '', 
  description = '', 
  category = '', 
  price = 0, 
  size = 100,
  xaxis = 0,
  yaxis = 0,
  imageFile = null 
}) => {
  try {
    const formData = new FormData();

    // Add request JSON data as Blob with proper content type
    const requestPayload = {
      itemId,
      itemName,
      description,
      category: category?.toUpperCase?.() || '',
      price: Number(price),
      size: Number(size),
      xaxis: Number(xaxis),
      yaxis: Number(yaxis)
    };

    formData.append(
      'request',
      new Blob([JSON.stringify(requestPayload)], { type: 'application/json' })
    );

    // Add image file if provided
    if (imageFile) {
      formData.append('image', imageFile);
    }

    const res = await axiosInstance.post('/shop-items/add', formData);

    console.log("addShopItem response:", res.data);
    return res.data;
  } catch (err) {
    console.error("Add shop item error:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    return err.response?.data || { success: false, message: err.message };
  }
};

/**
 * Edit an existing shop item
 * @param {number} shopItemId - Shop Item ID to edit
 * @param {Object} payload - Item data
 * @returns {Promise<Object>} Update result
 */
export const editShopItem = async (shopItemId, { 
  itemName = '', 
  description = '', 
  category = '', 
  price = 0, 
  size = 100,
  xaxis = 0,
  yaxis = 0,
  imageFile = null 
}) => {
  try {
    const formData = new FormData();

    const requestPayload = {
      itemName,
      description,
      category: category?.toUpperCase?.() || '',
      price: Number(price),
      size: Number(size),
      xaxis: Number(xaxis),
      yaxis: Number(yaxis)
    };

    formData.append(
      'request',
      new Blob([JSON.stringify(requestPayload)], { type: 'application/json' })
    );

    if (imageFile) {
      formData.append('image', imageFile);
    }

    const res = await axiosInstance.put(`/shop-items/${shopItemId}/edit`, formData);

    console.log("editShopItem response:", res.data);
    return res.data;
  } catch (err) {
    console.error("Edit shop item error:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    return err.response?.data || { success: false, message: err.message };
  }
};

/**
 * Delete a shop item
 * @param {number} shopItemId - Shop Item ID
 * @returns {Promise<Object>} Deletion result
 */
export const deleteShopItem = async (shopItemId) => {
  try {
    const res = await axiosInstance.delete(`/shop-items/${shopItemId}/delete`);
    console.log("deleteShopItem response:", res.data);
    return res.data;
  } catch (err) {
    console.error("Delete shop item error:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    return err.response?.data || { success: false, message: err.message };
  }
};

/**
 * Get current user's purchased items
 * @param {number} pageNo - Page number
 * @param {number} pageSize - Page size
 * @param {string} sortBy - Sort field
 * @returns {Promise<Array>} Array of user's purchased items
 */
export const getMyItems = async (pageNo = 0, pageSize = 100, sortBy = "purchasedAt") => {
  try {
    let collected = [];
    let page = pageNo;
    let hasMore = true;

    while (hasMore) {
      const res = await axiosInstance.get(
        `/user/my-items?pageNo=${page}&pageSize=${pageSize}&sortBy=${sortBy}`
      );

      console.log("getMyItems response (page", page, "):", res.data);

      if (res.data?.success && res.data?.data) {
        const pageData = res.data.data;
        collected = [...collected, ...pageData];
        if (pageData.length < pageSize) {
          hasMore = false;
        } else {
          page += 1;
        }
      } else {
        hasMore = false;
      }
    }

    return collected;
  } catch (err) {
    console.error("Fetch my items error:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    return [];
  }
};

/**
 * Purchase a shop item
 * @param {number} shopItemId - The shop item ID to purchase
 * @returns {Promise<Object>} Purchase result
 */
export const purchaseShopItem = async (shopItemId) => {
  try {
    const res = await axiosInstance.post(
      `/shop-items/purchase`,
      { shopItemId },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    console.log("purchaseShopItem response:", res.data);

    if (res.data?.success && res.data?.data) {
      return { success: true, data: res.data.data };
    }
    return { success: false, message: res.data?.message || "Purchase failed" };
  } catch (err) {
    console.error("Purchase shop item error:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });

    // Return the error message from the server if available
    if (err.response?.data?.data) {
      return { success: false, message: err.response.data.data };
    }
    return { success: false, message: err.response?.data?.message || err.message };
  }
};
