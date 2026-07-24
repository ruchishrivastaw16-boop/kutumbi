import apiClient from "./apiClient";
import ENDPOINTS from "./endpoints";

export const login = async (email, password) => {
  try {
    const response = await apiClient.post(ENDPOINTS.LOGIN, {
      email,
      password,
    });

    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};