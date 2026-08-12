import { httpClient } from "@/shared/api";

import type { ApiSuccess, LocationSuggestion, SearchHistoryEntry } from "./search.types";

export type RecordSearchPayload = {
  query: string;
  locationId?: string;
  locationName?: string;
  country?: string | null;
  latitude?: number;
  longitude?: number;
};

export const searchApi = {
  async autocomplete(q: string, limit = 8) {
    const { data } = await httpClient.get<ApiSuccess<{ suggestions: LocationSuggestion[] }>>(
      "/locations/autocomplete",
      { params: { q, limit } },
    );
    return data.data.suggestions;
  },

  async suggestions(q?: string, limit = 8) {
    const { data } = await httpClient.get<ApiSuccess<{ suggestions: LocationSuggestion[] }>>(
      "/locations/suggestions",
      { params: { ...(q ? { q } : {}), limit } },
    );
    return data.data.suggestions;
  },

  async resolve(payload: { q?: string; latitude?: number; longitude?: number }) {
    const { data } = await httpClient.post<ApiSuccess<LocationSuggestion>>(
      "/locations/resolve",
      payload,
    );
    return data.data;
  },

  async listHistory(limit = 20) {
    const { data } = await httpClient.get<ApiSuccess<SearchHistoryEntry[]>>(
      "/search-history/me",
      { params: { limit } },
    );
    return data.data;
  },

  async recordHistory(payload: RecordSearchPayload) {
    const { data } = await httpClient.post<ApiSuccess<SearchHistoryEntry>>(
      "/search-history/me",
      {
        query: payload.query,
        ...(payload.locationId !== undefined ? { locationId: payload.locationId } : {}),
        ...(payload.locationName !== undefined ? { locationName: payload.locationName } : {}),
        ...(payload.country ? { country: payload.country } : {}),
        ...(payload.latitude !== undefined ? { latitude: payload.latitude } : {}),
        ...(payload.longitude !== undefined ? { longitude: payload.longitude } : {}),
      },
    );
    return data.data;
  },

  async deleteHistoryItem(id: string) {
    await httpClient.delete(`/search-history/me/${id}`);
  },

  async clearHistory() {
    await httpClient.delete("/search-history/me");
  },
};
