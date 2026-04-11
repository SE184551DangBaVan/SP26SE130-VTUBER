import { axiosInstance } from "@/utils/axiosInstance";

/**
 * Get all shop items
 * @param {number} pageNo - Page number
 * @param {number} pageSize - Page size
 * @param {string} sortBy - Sort field
 * @returns {Promise<Array>} Array of shop items
 */
export const getShopItems = async (pageNo = 0, pageSize = 50, sortBy = "id") => {
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
 * @param {number} payload.request.itemId - Item ID
 * @param {string} payload.request.itemName - Item name
 * @param {string} payload.request.description - Item description
 * @param {string} payload.request.category - Item category
 * @param {number} payload.request.price - Item price
 * @param {string} payload.image - Base64 image string
 * @returns {Promise<Object>} Add result
 */
export const addShopItem = async (payload) => {
  try {
    const res = await axiosInstance.post(`/shop-items/add`, payload, {
      headers: {
        "Content-Type": "application/json",
      },
    });

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
