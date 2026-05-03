import axiosInstance from '@/utils/axiosInstance';

/**
 * Get all available payment packages
 * @returns {Promise<Array>} Payment packages data
 */
export const getPaymentPackages = async () => {
  try {
    const res = await axiosInstance.get('/payment/packages');

    console.log("getPaymentPackages response:", res.data);

    if (res.data?.success && res.data?.data) {
      return res.data.data;
    }

    return [];
  } catch (err) {
    console.error("Fetch payment packages error:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    return [];
  }
};

/**
 * Create a new paid points package
 * @param {Object} packageData - Package data
 * @param {string} packageData.packageName - Unique package name
 * @param {number} packageData.price - Price in VND
 * @param {number} packageData.paidPoints - Paid points granted
 * @param {string} packageData.description - Package description
 * @returns {Promise<Object>} Create result
 */
export const createPaidPackage = async (packageData) => {
  try {
    const res = await axiosInstance.post(
      '/payment/package/add',
      {
        packageName: packageData.packageName,
        price: Number(packageData.price),
        paidPoints: Number(packageData.paidPoints),
        description: packageData.description
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    console.log("createPaidPackage response:", res.data);

    return res.data?.success !== undefined ? res.data : { success: true, data: res.data };
  } catch (err) {
    console.error("Create paid package error:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    return err.response?.data || { success: false, message: err.message };
  }
};

/**
 * Create a payment link for purchasing paid points
 * @param {Object} paymentData - Payment data including userId, paidPackageId, price, etc.
 * @returns {Promise<string>} Payment link URL
 */
export const createPaymentLink = async (paymentData) => {
  try {
    const res = await axiosInstance.post('/payment/create-payment-link', {
      userId: paymentData.userId,
      paidPackageId: paymentData.paidPackageId,
      paidPackageName: paymentData.paidPackageName,
      paidPackageDescription: paymentData.paidPackageDescription,
      price: paymentData.price,
      returnUrl: paymentData.returnUrl,
      cancelUrl: paymentData.cancelUrl
    });

    console.log("createPaymentLink response:", res.data);

    // Response is the payment link URL directly
    if (typeof res.data === 'string') {
      return res.data;
    }

    return null;
  } catch (err) {
    console.error("Create payment link error:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    throw err;
  }
};

/**
 * Cancel a payment by order code
 * @param {number|string} orderCode - The payment order code to cancel
 * @returns {Promise<Object>} Cancel response with success status and message
 */
export const cancelPayment = async (orderCode) => {
  try {
    const res = await axiosInstance.get(`/payment/cancel/${orderCode}`);

    console.log("cancelPayment response:", res.data);

    return res.data;
  } catch (err) {
    console.error("Cancel payment error:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
      orderCode,
    });
    throw err;
  }
};
