import axios from "axios";

const API_BASE_URL = "https://vtuber-fanhub-bsc3arfzhqhahshy.southeastasia-01.azurewebsites.net/vhub/api/v1";

const axiosInstance = axios.create({
  baseURL: API_BASE_URL
  // Don't set default Content-Type here - it will be set in the interceptor
});

let isRefreshing = false;

// Queue to store failed requests while refreshing
let failedQueue = [];

// Process queued requests after refresh
const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const getToken = () => {
  return sessionStorage.getItem("token") || localStorage.getItem("token");
};

const getRefreshToken = () => {
  return sessionStorage.getItem("refreshToken") || localStorage.getItem("refreshToken");
};

// Save tokens to storage
const saveTokens = (token, refreshToken, rememberMe) => {
  if (rememberMe) {
    localStorage.setItem("token", token);
    localStorage.setItem("refreshToken", refreshToken);
  } else {
    sessionStorage.setItem("token", token);
    sessionStorage.setItem("refreshToken", refreshToken);
  }
};

// Check if storage is using localStorage (remember me)
const isRememberMe = () => {
  return localStorage.getItem("token") !== null;
};

// Refresh token API call
const refreshAuthToken = async (refreshToken) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/auth/refresh-token`,
      null,
      {
        params: {
          "refresh-token": refreshToken
        },
        headers: {
          "Authorization": `Bearer ${getToken()}`,
          "accept": "*/*"
        }
      }
    );

    if (response.data?.success && response.data?.data) {
      const { token, refreshToken: newRefreshToken } = response.data.data;
      const rememberMe = isRememberMe();
      saveTokens(token, newRefreshToken, rememberMe);
      return token;
    }

    throw new Error("Refresh token failed");
  } catch (error) {
    console.error("Refresh token error:", error);
    // Clear tokens if refresh fails
    sessionStorage.clear();
    localStorage.clear();
    window.dispatchEvent(new Event("storage"));
    throw error;
  }
};

// Request interceptor - add auth token and set Content-Type appropriately
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Set Content-Type based on the data type
    if (config.data instanceof FormData) {
      // For FormData, don't set Content-Type - let browser set it with boundary
      console.log('FormData detected - Content-Type will be set automatically by browser');
    } else if (config.data && typeof config.data === 'object') {
      // For regular JSON requests, set application/json
      config.headers['Content-Type'] = 'application/json';
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle token expiration and refresh
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosInstance(originalRequest);
          })
          .catch(err => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        // No refresh token, redirect to login
        sessionStorage.clear();
        localStorage.clear();
        window.dispatchEvent(new Event("storage"));
        return Promise.reject(error);
      }

      try {
        const newToken = await refreshAuthToken(refreshToken);
        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export { axiosInstance, API_BASE_URL };
export default axiosInstance;
