import axios, { InternalAxiosRequestConfig } from "axios";
import constant from "@/constant";
import Cookie from "js-cookie";

const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_APP_API_URL || "http://localhost:3001",
  withCredentials: true,
});

let refreshPromise: Promise<string> | null = null;

api.interceptors.request.use((config) => {
  const accessToken = Cookie.get(constant.ACCESS_TOKEN_KEY);

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as InternalAxiosRequestConfig;

    if (originalRequest.url !== "/api/auth/refresh") {
      return Promise.reject(error);
    }

    try {
      if (!refreshPromise) {
        const refreshToken = Cookie.get(constant.REFRESH_TOKEN_KEY);

        refreshPromise = api
          .post("/api/auth/refresh", { refreshToken })
          .then((res) => res.data.accessToken)
          .finally(() => {
            refreshPromise = null;
          });
      }

      const newAccessToken = await refreshPromise;

      Cookie.set(constant.ACCESS_TOKEN_KEY, newAccessToken, {
        expires: constant.ACCESS_TOKEN_EXPIRE,
      });
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

      return api(originalRequest);
    } catch (refreshTokenError) {
      // Clear the cookie
      Cookie.remove(constant.ACCESS_TOKEN_KEY);
      Cookie.remove(constant.REFRESH_TOKEN_KEY);

      window.location.href = "/login";
      return Promise.reject(refreshTokenError);
    }
  }
);

export default api;
