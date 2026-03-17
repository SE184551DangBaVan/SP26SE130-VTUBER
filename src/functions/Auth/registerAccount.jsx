import axios from "axios";

export const signUp = async ({ email, password, name }) => {
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
    if(error.data.code == 'ERR_NETWORK') {
      return error.data;
    }

    console.error("Sign up failed:", error);
    throw error;
  }
};

export const verifyEmail = async ({ email }) => {
  try {
    const response = await axios.post("https://vtuber-fanhub-bsc3arfzhqhahshy.southeastasia-01.azurewebsites.net/vhub/api/v1/user/verify?email=woyokar211%40onbap.com", {
      email
    });

    return response.data;
  } catch (error) {
    if(error.data.code == 'ERR_NETWORK') {
      return error.data;
    }

    console.error("Verifying Email Error...", error);
    throw error;
  }
};