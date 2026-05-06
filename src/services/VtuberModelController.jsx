import axiosInstance from '@/utils/axiosInstance';

/**
 * Fetch a fan hub model by fanHubId.
 * @param {number|string} fanHubId
 * @returns {Promise<Object|null>}
 */
export const getFanHubModel = async (fanHubId) => {
  try {
    const res = await axiosInstance.get(`/fan-hub-model/${fanHubId}`);

    if (res.data?.success && res.data?.data) {
      return res.data.data;
    }

    return null;
  } catch (err) {
    if(err.response.status === 403 || err.response.status === 404) console.log('Fetch fan hub model error:', "This Fan Hub does not have a model")
    // console.error('Fetch fan hub model error:', {
    //   message: err.message,
    //   status: err.response?.status,
    //   data: err.response?.data,
    // });
    return null;
  }
};

/**
 * Upload a fan hub model for the current hub owner.
 * The API is called with query params for sprite metadata and a JSON body.
 * @param {number|string} fanHubId
 * @param {Object} payload
 * @param {string} payload.name
 * @param {string[]} payload.spriteFiles
 * @param {string[]} payload.spriteNames
 * @param {number[]} payload.spriteFrames
 * @param {string|null} payload.modelFile
 * @returns {Promise<Object|null>}
 */
export const uploadFanHubModel = async ({ fanHubId, name, spriteEntries = [] }) => {
  try {
    const formData = new FormData();
    formData.append('name', name);

    spriteEntries.forEach((entry) => {
      formData.append('spriteNames', entry.state);
      formData.append('spriteFrames', entry.totalFrames.toString());
      formData.append('spriteFiles', entry.file);
    });

    const res = await axiosInstance.post(
      `/fan-hub-model/upload/${fanHubId}`,
      formData
    );

    if (res.data?.success && res.data?.data) {
      return res.data.data;
    }

    return null;
  } catch (err) {
    console.error('Upload fan hub model error:', {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    return null;
  }
};
