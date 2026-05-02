import axiosInstance from "@/utils/axiosInstance";
import { itemCategories } from "@/constants/itemCategories";

/**
 * Get all items
 * @returns {Promise<Array>} Array of items
 */
export const getAllItems = async () => {
  try {
    const res = await axiosInstance.get("/items/all");
    console.log("getAllItems response:", res.data);
    if (res.data?.success && res.data?.data) {
      return res.data.data;
    }
    return [];
  } catch (err) {
    console.error("Fetch all items error:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    return [];
  }
};

/**
 * Create a new item
 * @param {Object} itemData - Item metadata (itemName, description, category, size, xaxis, yaxis)
 * @param {File} imageFile - Image file
 * @returns {Promise<Object>} Creation result
 */
export const createItem = async (itemData, imageFile) => {
  try {
    const formData = new FormData();

    // Ensure numeric fields are numbers
    const payload = {
      ...itemData,
      size: itemData.size ? Number(itemData.size) : 115,
      xaxis: itemData.xaxis ? Number(itemData.xaxis) : 0,
      yaxis: itemData.yaxis ? Number(itemData.yaxis) : 0
    };

    // Wrap JSON in a Blob with explicit application/json type
    const jsonPart = JSON.stringify(payload);
    const blob = new Blob([jsonPart], { type: "application/json" });
    formData.append("request", blob);

    if (imageFile) {
      formData.append("image", imageFile);
    }

    const res = await axiosInstance.post("/items/add", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    console.log("createItem response:", res.data);
    return res.data;
  } catch (err) {
    console.error("Create item error:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    return err.response?.data || { success: false, message: err.message };
  }
};

/**
 * Edit an existing item
 * @param {number} itemId - Item ID to edit
 * @param {Object} itemData - Item metadata
 * @param {File} imageFile - New image file (optional)
 * @returns {Promise<Object>} Update result
 */
export const editItem = async (itemId, itemData, imageFile) => {
  try {
    const formData = new FormData();

    const payload = {
      ...itemData,
      size: itemData.size ? Number(itemData.size) : 115,
      xaxis: itemData.xaxis ? Number(itemData.xaxis) : 0,
      yaxis: itemData.yaxis ? Number(itemData.yaxis) : 0
    };

    const jsonPart = JSON.stringify(payload);
    const blob = new Blob([jsonPart], { type: "application/json" });
    formData.append("request", blob);

    if (imageFile) {
      formData.append("image", imageFile);
    }

    const res = await axiosInstance.put(`/items/${itemId}/edit`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    console.log("editItem response:", res.data);
    return res.data;
  } catch (err) {
    console.error("Edit item error:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    return err.response?.data || { success: false, message: err.message };
  }
};

/**
 * Delete an item
 * @param {number} itemId - Item ID
 * @returns {Promise<Object>} Deletion result
 */
export const deleteItem = async (itemId) => {
  try {
    const res = await axiosInstance.delete(`/items/${itemId}`);
    console.log("deleteItem response:", res.data);
    return res.data;
  } catch (err) {
    console.error("Delete item error:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    return err.response?.data || { success: false, message: err.message };
  }
};
