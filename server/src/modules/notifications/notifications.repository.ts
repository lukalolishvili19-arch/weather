import { Prisma } from "@prisma/client";

import { prisma } from "../../lib/prisma.js";
import type {
  CreateNotificationInput,
  UpdateNotificationInput,
} from "./notifications.schemas.js";

export const notificationsRepository = {
  findMany(userId?: string) {
    return prisma.notification.findMany({
      ...(userId ? { where: { userId } } : {}),
      orderBy: { createdAt: "desc" },
    });
  },

  findById(id: string) {
    return prisma.notification.findUnique({ where: { id } });
  },

  findByUserAndDedupeKey(userId: string, dedupeKey: string) {
    return prisma.notification.findFirst({
      where: {
        userId,
        metadata: {
          path: ["dedupeKey"],
          equals: dedupeKey,
        },
      },
    });
  },

  create(data: CreateNotificationInput) {
    return prisma.notification.create({
      data: {
        userId: data.userId,
        title: data.title,
        body: data.body,
        ...(data.type !== undefined ? { type: data.type } : {}),
        ...(data.read !== undefined ? { read: data.read } : {}),
        ...(data.metadata !== undefined
          ? { metadata: data.metadata as Prisma.InputJsonValue }
          : {}),
      },
    });
  },

  update(id: string, data: UpdateNotificationInput) {
    const payload: Prisma.NotificationUpdateInput = {};

    if (data.title !== undefined) payload.title = data.title;
    if (data.body !== undefined) payload.body = data.body;
    if (data.type !== undefined) payload.type = data.type;
    if (data.read !== undefined) payload.read = data.read;
    if (data.metadata !== undefined) {
      payload.metadata =
        data.metadata === null
          ? Prisma.JsonNull
          : (data.metadata as Prisma.InputJsonValue);
    }

    return prisma.notification.update({
      where: { id },
      data: payload,
    });
  },

  markAllRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  },

  deleteRead(userId: string) {
    return prisma.notification.deleteMany({
      where: { userId, read: true },
    });
  },

  delete(id: string) {
    return prisma.notification.delete({ where: { id } });
  },
};
