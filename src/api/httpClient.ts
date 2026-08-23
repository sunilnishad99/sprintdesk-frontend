import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore, getStoredRefreshToken } from '../store/authStore';
import type { RefreshResponse } from '../types/auth';

const BASE_URL = 'https://dummyjson.com';

export const httpClient = axios.create({ baseURL: BASE_URL });

// Extend config so we can mark a request as "already retried once"
interface RetryableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

// --- Attach Bearer token on every request ---
httpClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- Silent refresh + retry-queue so simultaneous 401s don't fire ---
// --- multiple refresh calls ---
let isRefreshing = false;
let pendingQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

const flushQueue = (error: unknown, token: string | null) => {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (token) resolve(token);
    else reject(error);
  });
  pendingQueue = [];
};

async function refreshAccessToken(): Promise<string> {
  const refreshToken = getStoredRefreshToken();
  if (!refreshToken) throw new Error('No refresh token available');

  const { data } = await axios.post<RefreshResponse>(
    `${BASE_URL}/auth/refresh`,
    { refreshToken, expiresInMins: 30 },
  );

  useAuthStore.getState().setAccessToken(data.accessToken);
  return data.accessToken;
}

httpClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableConfig | undefined;

    if (error.response?.status !== 401 || !originalRequest || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // Queue this request until the in-flight refresh resolves
      return new Promise((resolve, reject) => {
        pendingQueue.push({
          resolve: (token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(httpClient(originalRequest));
          },
          reject,
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const newToken = await refreshAccessToken();
      flushQueue(null, newToken);
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return httpClient(originalRequest);
    } catch (refreshError) {
      flushQueue(refreshError, null);
      useAuthStore.getState().clearSession();
      window.location.assign('/login');
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);
