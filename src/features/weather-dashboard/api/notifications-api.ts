import { httpClient } from "@/shared/api";

import type { ApiSuccess } from "./weather.types";
import type {
  AppNotification,
  SyncNotificationsResult,
} from "./settings.types";

export const notificationsApi = {
  async listMine() {
    const { data } = await httpClient.get<ApiSuccess<AppNotification[]>>("/notifications/me");
    return data.data;
  },

  async syncMine(location: string) {
    const { data } = await httpClient.post<ApiSuccess<SyncNotificationsResult>>(
      "/notifications/me/sync",
      null,
      { params: { location } },
    );
    return data.data;
  },

  async markAllRead() {
    const { data } = await httpClient.patch<ApiSuccess<AppNotification[]>>(
      "/notifications/me/read-all",
    );
    return data.data;
  },

  async clearRead() {
    const { data } = await httpClient.delete<ApiSuccess<AppNotification[]>>(
      "/notifications/me/read",
    );
    return data.data;
  },

  async markRead(id: string) {
    const { data } = await httpClient.patch<ApiSuccess<AppNotification>>(
      `/notifications/me/${id}`,
      { read: true },
    );
    return data.data;
  },

  async remove(id: string) {
    await httpClient.delete(`/notifications/me/${id}`);
  },
};
