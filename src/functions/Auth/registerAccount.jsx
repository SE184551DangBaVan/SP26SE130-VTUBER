import axios from "axios";

export const signUp = async ({ email, password, name }) => {
  try {
    const response = await axios.post("https://pleasant-grace-production.up.railway.app/pulse/api/v1/user/register", {
      email,
      password,
      name
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