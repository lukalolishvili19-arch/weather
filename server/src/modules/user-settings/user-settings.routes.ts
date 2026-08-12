import { z } from "zod";
import { Router } from "express";

import { validateRequest } from "../../middleware/validate-request.js";
import {
  createUserSettings,
  deleteUserSettings,
  getMyUserSettings,
  getUserSettings,
  getUserSettingsByUserId,
  listUserSettings,
  updateMyUserSettings,
  updateUserSettings,
} from "./user-settings.controller.js";
import {
  createUserSettingsSchema,
  updateUserSettingsSchema,
  userSettingsIdParamsSchema,
} from "./user-settings.schemas.js";

const userIdParamsSchema = z.object({
  userId: z.string().cuid(),
});

export const userSettingsRouter = Router();

userSettingsRouter.get("/me", getMyUserSettings);
userSettingsRouter.patch(
  "/me",
  validateRequest(updateUserSettingsSchema),
  updateMyUserSettings,
);

userSettingsRouter.get("/", listUserSettings);
userSettingsRouter.post("/", validateRequest(createUserSettingsSchema), createUserSettings);
userSettingsRouter.get(
  "/by-user/:userId",
  validateRequest(userIdParamsSchema, "params"),
  getUserSettingsByUserId,
);
userSettingsRouter.get(
  "/:id",
  validateRequest(userSettingsIdParamsSchema, "params"),
  getUserSettings,
);
userSettingsRouter.patch(
  "/:id",
  validateRequest(userSettingsIdParamsSchema, "params"),
  validateRequest(updateUserSettingsSchema),
  updateUserSettings,
);
userSettingsRouter.delete(
  "/:id",
  validateRequest(userSettingsIdParamsSchema, "params"),
  deleteUserSettings,
);
