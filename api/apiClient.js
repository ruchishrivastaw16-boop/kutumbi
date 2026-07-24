import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

// const getDefaultBaseUrl = () => {
//   if (Platform.OS === "android") {
//     return "http://10.160.191.151:3000/api";
//   }

//   if (Platform.OS === "ios") {
//     return "http://localhost:3000/api";
//   }

//   return "http://10.160.191.151:3000/api";
// };

const apiClient = axios.create({
  baseURL: "http://139.59.29.193:4000/api",
  timeout: 3000000,
  headers: {
    Accept: "*/*",
  },
});

apiClient.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem("token");
    if (token) {
      config.headers = {
        ...(config.headers || {}),
        Authorization: `Bearer ${token}`,
      };
    }
  } catch (error) {
    console.log("API request interceptor error:", error);
  }

  return config;
});

export default apiClient;