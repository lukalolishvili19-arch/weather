import { Router } from "express";

import { validateRequest } from "../../middleware/validate-request.js";
import {
  clearMyReadNotifications,
  createNotification,
  deleteMyNotification,
  deleteNotification,
  getNotification,
  listMyNotifications,
  listNotifications,
  markAllMyNotificationsRead,
  syncMyNotifications,
  updateMyNotification,
  updateNotification,
} from "./notifications.controller.js";
import {
  createNotificationSchema,
  notificationIdParamsSchema,
  syncNotificationsQuerySchema,
  updateNotificationSchema,
} from "./notifications.schemas.js";

export const notificationsRouter = Router();

notificationsRouter.get("/me", listMyNotifications);
notificationsRouter.post(
  "/me/sync",
  validateRequest(syncNotificationsQuerySchema, "query"),
  syncMyNotifications,
);
notificationsRouter.patch("/me/read-all", markAllMyNotificationsRead);
notificationsRouter.delete("/me/read", clearMyReadNotifications);
notificationsRouter.patch(
  "/me/:id",
  validateRequest(notificationIdParamsSchema, "params"),
  validateRequest(updateNotificationSchema),
  updateMyNotification,
);
notificationsRouter.delete(
  "/me/:id",
  validateRequest(notificationIdParamsSchema, "params"),
  deleteMyNotification,
);

notificationsRouter.get("/", listNotifications);
notificationsRouter.post("/", validateRequest(createNotificationSchema), createNotification);
notificationsRouter.get(
  "/:id",
  validateRequest(notificationIdParamsSchema, "params"),
  getNotification,
);
notificationsRouter.patch(
  "/:id",
  validateRequest(notificationIdParamsSchema, "params"),
  validateRequest(updateNotificationSchema),
  updateNotification,
);
notificationsRouter.delete(
  "/:id",
  validateRequest(notificationIdParamsSchema, "params"),
  deleteNotification,
);
