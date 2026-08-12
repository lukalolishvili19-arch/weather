import { z } from "zod";
import { NotificationType } from "@prisma/client";

export const notificationIdParamsSchema = z.object({
  id: z.string().cuid(),
});

export const createNotificationSchema = z.object({
  userId: z.string().cuid(),
  title: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1).max(2000),
  type: z.nativeEnum(NotificationType).optional(),
  read: z.boolean().optional(),
  metadata: z.record(z.unknown()).nullable().optional(),
});

export const updateNotificationSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    body: z.string().trim().min(1).max(2000).optional(),
    type: z.nativeEnum(NotificationType).optional(),
    read: z.boolean().optional(),
    metadata: z.record(z.unknown()).nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });

export const syncNotificationsQuerySchema = z.object({
  location: z.string().trim().min(1).max(200),
});

export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
export type UpdateNotificationInput = z.infer<typeof updateNotificationSchema>;
export type SyncNotificationsQuery = z.infer<typeof syncNotificationsQuerySchema>;
