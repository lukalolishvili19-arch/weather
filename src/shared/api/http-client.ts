import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

import { env } from "@/shared/config/env";
import { tokenStorage } from "@/features/auth/lib/token-storage";
import type { ApiSuccess, AuthResponse } from "@/features/auth/model/types";

type RetriableConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

export const httpClient = axios.create({
  baseURL: env.apiUrl,
  headers: {
    Accept: "application/json",
  },
  timeout: 10_000,
  withCredentials: true,
});

httpClient.interceptors.request.use((config) => {
  const accessToken = tokenStorage.getAccessToken();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = tokenStorage.getRefreshToken();
  if (!refreshToken) {
    return null;
  }

  try {
    const { data } = await axios.post<ApiSuccess<AuthResponse>>(
      `${env.apiUrl}/auth/refresh`,
      { refreshToken },
      { withCredentials: true },
    );
    tokenStorage.setTokens(data.data.accessToken, data.data.refreshToken);
    return data.data.accessToken;
  } catch {
    tokenStorage.clear();
    return null;
  }
}

httpClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;
    if (!original || error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    if (original.url?.includes("/auth/login") || original.url?.includes("/auth/register")) {
      return Promise.reject(error);
    }

    original._retry = true;
    refreshPromise ??= refreshAccessToken().finally(() => {
      refreshPromise = null;
    });

    const accessToken = await refreshPromise;
    if (!accessToken) {
      return Promise.reject(error);
    }

    original.headers.Authorization = `Bearer ${accessToken}`;
    return httpClient(original);
  },
);
