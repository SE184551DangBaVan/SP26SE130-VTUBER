import axiosInstance from "@/utils/axiosInstance";

/**
 * Get posts feed (all posts across all hubs)
 * @param {number} pageNo - Page number
 * @param {number} pageSize - Page size
 * @param {string} sortBy - Sort by field (createdAt, etc.)
 * @returns {Promise<Array>} Posts data
 */
export const getPostsFeed = async (pageNo = 0, pageSize = 10, sortBy = "createdAt") => {
  try {
    const res = await axiosInstance.get(
      `/posts/feed?pageNo=${pageNo}&pageSize=${pageSize}&sortBy=${sortBy}`
    );

    console.log("getPostsFeed response:", res.data);

    if (res.data?.success && res.data?.data) {
      return res.data.data;
    }

    return [];
  } catch (err) {
    console.error("Fetch posts feed error:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    return [];
  }
};

/**
 * Get posts for a specific fan hub
 * @param {number} fanHubId - Fan Hub ID
 * @param {number} pageNo - Page number
 * @param {number} pageSize - Page size
 * @param {string} sortBy - Sort by field (createdAt, etc.)
 * @param {string} postHashtag - Optional hashtag filter
 * @returns {Promise<Array>} Posts data
 */
export const getPostsByFanHub = async (fanHubId, pageNo = 0, pageSize = 10, sortBy = "createdAt", postHashtag = "") => {
  try {
    let url = `/posts/fan-hub/${fanHubId}?pageNo=${pageNo}&pageSize=${pageSize}&sortBy=${sortBy}`;
    if (postHashtag) {
      url += `&postHashtag=${encodeURIComponent(postHashtag)}`;
    }

    const res = await axiosInstance.get(url);

    console.log("getPostsByFanHub response:", res.data);

    if (res.data?.success && res.data?.data) {
      return res.data.data;
    }

    return [];
  } catch (err) {
    console.error("Fetch posts by fan hub error:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    return [];
  }
};

/**
 * Get a single post by ID
 * @param {number} postId - Post ID
 * @returns {Promise<Object|null>} Post data or null
 */
export const getPostById = async (postId) => {
  try {
    const res = await axiosInstance.get(`/posts/${postId}`);

    console.log("getPostById response:", res.data);

    if (res.data?.success && res.data?.data) {
      return res.data.data;
    }

    return null;
  } catch (err) {
    console.error("Fetch post by ID error:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    return null;
  }
};

/**
 * Create a new post
 * @param {Object} postData - Post data including fanHubId, postType, title, content, hashtags
 * @param {File|File[]} mediaFiles - Image or video files (optional)
 * @param {string} mediaKey - Key for media files in form data ('images' or 'video')
 * @returns {Promise<Object>} Response data
 */
export const createPost = async (postData, mediaFiles = null, mediaKey = 'images') => {
  try {
    const formData = new FormData();

    // Add request JSON data
    formData.append('request', JSON.stringify({
      fanHubId: postData.fanHubId,
      postType: postData.postType || 'TEXT',
      title: postData.title,
      content: postData.content || '',
      hashtags: postData.hashtags || []
    }));

    // Add media files if provided
    if (mediaFiles) {
      const files = Array.isArray(mediaFiles) ? mediaFiles : [mediaFiles];
      files.forEach(file => {
        formData.append(mediaKey, file);
      });
    }

    const res = await axiosInstance.post('/posts', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    console.log("createPost response:", res.data);

    if (res.data?.success) {
      return res.data;
    }

    throw new Error(res.data?.message || 'Failed to create post');
  } catch (err) {
    console.error("Create post error:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    throw err;
  }
};
