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
