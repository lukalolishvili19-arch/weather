import { httpClient } from "@/shared/api";

import type { ApiSuccess, CreateFavoritePayload, Favorite } from "./favorites.types";

export const favoritesApi = {
  async listMine() {
    const { data } = await httpClient.get<ApiSuccess<Favorite[]>>("/favorites/me");
    return data.data;
  },

  async add(payload: CreateFavoritePayload) {
    const { data } = await httpClient.post<ApiSuccess<Favorite>>("/favorites/me", payload);
    return data.data;
  },

  async remove(id: string) {
    await httpClient.delete(`/favorites/me/${id}`);
  },

  async pin(id: string, isPinned: boolean) {
    const { data } = await httpClient.patch<ApiSuccess<Favorite>>(`/favorites/me/${id}/pin`, {
      isPinned,
    });
    return data.data;
  },
};
