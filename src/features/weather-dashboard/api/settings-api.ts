import { httpClient } from "@/shared/api";

import type { ApiSuccess } from "./weather.types";
import type { UpdateUserSettingsPayload, UserSettings } from "./settings.types";

export const settingsApi = {
  async getMine() {
    const { data } = await httpClient.get<ApiSuccess<UserSettings>>("/user-settings/me");
    return data.data;
  },

  async updateMine(payload: UpdateUserSettingsPayload) {
    const { data } = await httpClient.patch<ApiSuccess<UserSettings>>(
      "/user-settings/me",
      payload,
    );
    return data.data;
  },
};
