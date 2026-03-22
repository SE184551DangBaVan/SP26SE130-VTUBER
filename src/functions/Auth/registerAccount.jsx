import axios from "axios";

export const signUp = async ( username, email, password, displayName, translateLanguage, bio, otp ) => {
    try {
      const response = await axios.post("https://vtuber-fanhub-bsc3arfzhqhahshy.southeastasia-01.azurewebsites.net/vhub/api/v1/user/register", {
        username,
        email,
        password,
        displayName,
        translateLanguage,
        bio,
        otp
      });

      return response.data;
    } catch (error) {
      if (error.code === 'ERR_NETWORK') {
        return error.data;
      }

      console.error("Sign up failed:", error);
      throw error;
    }
  };

export const verifyEmail = async ( email ) => {
  try {
    const response = await axios.post("https://vtuber-fanhub-bsc3arfzhqhahshy.southeastasia-01.azurewebsites.net/vhub/api/v1/user/verify", 
      null,
      {
        params: { email }
      }
    );

    return response.data;
  } catch (error) {
    console.error("Verifying Email Error...", error);
    if(error.code == 'ERR_NETWORK') {
      return { success: false, message: "Network error" };
    }

    return error.response?.data || { success: false };
  }
};