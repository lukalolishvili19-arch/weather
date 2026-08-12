import type { RequestHandler } from "express";

import { asyncHandler } from "../../common/async-handler.js";
import { sendNoContent, sendSuccess } from "../../common/http.js";
import { userSettingsService } from "./user-settings.service.js";
import type {
  CreateUserSettingsInput,
  UpdateUserSettingsInput,
} from "./user-settings.schemas.js";

export const listUserSettings: RequestHandler = asyncHandler(async (_request, response) => {
  const settings = await userSettingsService.list();
  sendSuccess(response, settings);
});

export const getUserSettings: RequestHandler = asyncHandler(async (request, response) => {
  const settings = await userSettingsService.getById(request.params.id as string);
  sendSuccess(response, settings);
});

export const getUserSettingsByUserId: RequestHandler = asyncHandler(
  async (request, response) => {
    const settings = await userSettingsService.getByUserId(request.params.userId as string);
    sendSuccess(response, settings);
  },
);

export const getMyUserSettings: RequestHandler = asyncHandler(async (request, response) => {
  const settings = await userSettingsService.getOrCreateByUserId(request.user!.id);
  sendSuccess(response, settings);
});

export const updateMyUserSettings: RequestHandler = asyncHandler(async (request, response) => {
  const settings = await userSettingsService.updateByUserId(
    request.user!.id,
    request.body as UpdateUserSettingsInput,
  );
  sendSuccess(response, settings);
});

export const createUserSettings: RequestHandler = asyncHandler(async (request, response) => {
  const settings = await userSettingsService.create(
    request.body as CreateUserSettingsInput,
  );
  sendSuccess(response, settings, 201);
});

export const updateUserSettings: RequestHandler = asyncHandler(async (request, response) => {
  const settings = await userSettingsService.update(
    request.params.id as string,
    request.body as UpdateUserSettingsInput,
  );
  sendSuccess(response, settings);
});

export const deleteUserSettings: RequestHandler = asyncHandler(async (request, response) => {
  await userSettingsService.remove(request.params.id as string);
  sendNoContent(response);
});
