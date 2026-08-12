import type { RequestHandler } from "express";

import { asyncHandler } from "../../common/async-handler.js";
import { sendNoContent, sendSuccess } from "../../common/http.js";
import { notificationsService } from "./notifications.service.js";
import type {
  CreateNotificationInput,
  SyncNotificationsQuery,
  UpdateNotificationInput,
} from "./notifications.schemas.js";

export const listNotifications: RequestHandler = asyncHandler(async (request, response) => {
  const userId =
    typeof request.query.userId === "string" ? request.query.userId : undefined;
  const notifications = await notificationsService.list(userId);
  sendSuccess(response, notifications);
});

export const listMyNotifications: RequestHandler = asyncHandler(async (request, response) => {
  const notifications = await notificationsService.listMine(request.user!.id);
  sendSuccess(response, notifications);
});

export const syncMyNotifications: RequestHandler = asyncHandler(async (request, response) => {
  const query = request.query as unknown as SyncNotificationsQuery;
  const result = await notificationsService.syncWeatherAlerts(
    request.user!.id,
    query.location,
  );
  sendSuccess(response, result);
});

export const markAllMyNotificationsRead: RequestHandler = asyncHandler(
  async (request, response) => {
    const notifications = await notificationsService.markAllRead(request.user!.id);
    sendSuccess(response, notifications);
  },
);

export const clearMyReadNotifications: RequestHandler = asyncHandler(
  async (request, response) => {
    const notifications = await notificationsService.clearRead(request.user!.id);
    sendSuccess(response, notifications);
  },
);

export const getNotification: RequestHandler = asyncHandler(async (request, response) => {
  const notification = await notificationsService.getById(request.params.id as string);
  sendSuccess(response, notification);
});

export const createNotification: RequestHandler = asyncHandler(async (request, response) => {
  const notification = await notificationsService.create(
    request.body as CreateNotificationInput,
  );
  sendSuccess(response, notification, 201);
});

export const updateNotification: RequestHandler = asyncHandler(async (request, response) => {
  const notification = await notificationsService.update(
    request.params.id as string,
    request.body as UpdateNotificationInput,
  );
  sendSuccess(response, notification);
});

export const updateMyNotification: RequestHandler = asyncHandler(async (request, response) => {
  const notification = await notificationsService.updateMine(
    request.user!.id,
    request.params.id as string,
    request.body as UpdateNotificationInput,
  );
  sendSuccess(response, notification);
});

export const deleteNotification: RequestHandler = asyncHandler(async (request, response) => {
  await notificationsService.remove(request.params.id as string);
  sendNoContent(response);
});

export const deleteMyNotification: RequestHandler = asyncHandler(async (request, response) => {
  await notificationsService.removeMine(request.user!.id, request.params.id as string);
  sendNoContent(response);
});
