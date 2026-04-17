import axiosInstance from "@/utils/axiosInstance";

/**
 * Get all notifications for the current user (paginated)
 */
export const getAllNotifications = async (pageNo = 0, pageSize = 20, sortBy = "createdAt") => {
  try {
    const res = await axiosInstance.get(`/notifications?pageNo=${pageNo}&pageSize=${pageSize}&sortBy=${sortBy}`);
    return res.data;
  } catch (err) {
    console.error("Get all notifications error:", err);
    return err.response?.data || { success: false, message: err.message };
  }
};

/**
 * Get only unread notifications (paginated)
 */
export const getUnreadNotifications = async (pageNo = 0, pageSize = 20, sortBy = "createdAt") => {
  try {
    const res = await axiosInstance.get(`/notifications/unread?pageNo=${pageNo}&pageSize=${pageSize}&sortBy=${sortBy}`);
    return res.data;
  } catch (err) {
    console.error("Get unread notifications error:", err);
    return err.response?.data || { success: false, message: err.message };
  }
};

/**
 * Get total count of unread notifications
 */
export const getUnreadNotificationCount = async () => {
  try {
    const res = await axiosInstance.get("/notifications/unread/count");
    return res.data;
  } catch (err) {
    console.error("Get unread count error:", err);
    return err.response?.data || { success: false, message: err.message };
  }
};

/**
 * Mark a specific notification as read
 */
export const markAsRead = async (notificationId) => {
  try {
    const res = await axiosInstance.post(`/notifications/${notificationId}/read`, {});
    return res.data;
  } catch (err) {
    console.error("Mark as read error:", err);
    return err.response?.data || { success: false, message: err.message };
  }
};

/**
 * Mark all unread notifications as read
 */
export const markAllAsRead = async () => {
  try {
    const res = await axiosInstance.post("/notifications/read-all", {});
    return res.data;
  } catch (err) {
    console.error("Mark all as read error:", err);
    return err.response?.data || { success: false, message: err.message };
  }
};

/**
 * Delete a specific notification
 */
export const deleteNotification = async (notificationId) => {
  try {
    const res = await axiosInstance.delete(`/notifications/${notificationId}`);
    return res.data;
  } catch (err) {
    console.error("Delete notification error:", err);
    return err.response?.data || { success: false, message: err.message };
  }
};

/**
 * Delete all notifications
 */
export const deleteAllNotifications = async () => {
  try {
    const res = await axiosInstance.delete("/notifications/all");
    return res.data;
  } catch (err) {
    console.error("Delete all notifications error:", err);
    return err.response?.data || { success: false, message: err.message };
  }
};

export const getNotificationStreamUrl = () => {
  return `${axiosInstance.defaults.baseURL}/notifications/stream`;
};

/**
 * Get the current status of the notification service (health check)
 */
export const getNotificationStatus = async () => {
  try {
    const res = await axiosInstance.get("/notifications/status");
    return res.data;
  } catch (err) {
    console.error("Get notification status error:", err);
    return err.response?.data || { success: false, message: err.message };
  }
};
