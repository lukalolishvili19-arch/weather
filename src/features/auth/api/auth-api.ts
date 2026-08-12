import { httpClient } from "@/shared/api";

import type { ApiSuccess, AuthResponse, AuthUser } from "../model/types";

export type RegisterPayload = {
  email: string;
  password: string;
  name?: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type UpdateProfilePayload = {
  name?: string | null;
  avatarUrl?: string | null;
};

export const authApi = {
  async register(payload: RegisterPayload) {
    const { data } = await httpClient.post<ApiSuccess<AuthResponse>>("/auth/register", payload);
    return data.data;
  },

  async login(payload: LoginPayload) {
    const { data } = await httpClient.post<ApiSuccess<AuthResponse>>("/auth/login", payload);
    return data.data;
  },

  async refresh(refreshToken?: string) {
    const { data } = await httpClient.post<ApiSuccess<AuthResponse>>("/auth/refresh", {
      ...(refreshToken ? { refreshToken } : {}),
    });
    return data.data;
  },

  async logout(refreshToken?: string) {
    await httpClient.post<ApiSuccess<{ success: boolean }>>("/auth/logout", {
      ...(refreshToken ? { refreshToken } : {}),
    });
  },

  async getProfile() {
    const { data } = await httpClient.get<ApiSuccess<AuthUser>>("/auth/profile");
    return data.data;
  },

  async updateProfile(payload: UpdateProfilePayload) {
    const { data } = await httpClient.patch<ApiSuccess<AuthUser>>("/auth/profile", payload);
    return data.data;
  },
};
