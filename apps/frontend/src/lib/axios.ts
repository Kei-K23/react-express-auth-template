import axios, { InternalAxiosRequestConfig } from "axios";
import { getCookie, setCookie } from "./cookie";

const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_APP_API_URL || "http://localhost:3001",
  withCredentials: true,
});

let refreshPromise: Promise<string> | null = null;

api.interceptors.request.use((config) => {
  const accessToken = getCookie("REAT_accessToken");
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as InternalAxiosRequestConfig;

    if (
      error?.response?.status !== 401 ||
      originalRequest.url === "/api/auth/refresh"
    ) {
      return Promise.reject(error);
    }

    try {
      if (!refreshPromise) {
        const refreshToken = getCookie("REAT_refreshToken");

        refreshPromise = api
          .post("/api/auth/refresh", { refreshToken })
          .then((res) => res.data.accessToken)
          .finally(() => {
            refreshPromise = null;
          });
      }
      const newAccessToken = await refreshPromise;

      setCookie("REAT_accessToken", newAccessToken, 15);
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

      return api(originalRequest);
    } catch (refreshTokenError) {
      // Clear the cookie
      document.cookie =
        "REAT_accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; Secure; HttpOnly";
      document.cookie =
        "REAT_refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; Secure; HttpOnly";
      window.location.href = "/login";

      return Promise.reject(refreshTokenError);
    }
  }
);
