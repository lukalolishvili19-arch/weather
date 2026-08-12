import type { Prisma } from "@prisma/client";

import { prisma } from "../../lib/prisma.js";
import type {
  CreateFavoriteForUserInput,
  CreateFavoriteInput,
  UpdateFavoriteInput,
} from "./favorites.schemas.js";

export const favoritesRepository = {
  findMany(userId?: string) {
    return prisma.favorite.findMany({
      ...(userId ? { where: { userId } } : {}),
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    });
  },

  findById(id: string) {
    return prisma.favorite.findUnique({ where: { id } });
  },

  findByUserAndId(userId: string, id: string) {
    return prisma.favorite.findFirst({
      where: { id, userId },
    });
  },

  findByUserAndLocation(userId: string, locationId: string) {
    return prisma.favorite.findUnique({
      where: {
        userId_locationId: { userId, locationId },
      },
    });
  },

  create(data: CreateFavoriteInput) {
    return prisma.favorite.create({
      data: {
        userId: data.userId,
        locationId: data.locationId,
        locationName: data.locationName,
        ...(data.country !== undefined ? { country: data.country } : {}),
        ...(data.latitude !== undefined ? { latitude: data.latitude } : {}),
        ...(data.longitude !== undefined ? { longitude: data.longitude } : {}),
        ...(data.isPinned !== undefined ? { isPinned: data.isPinned } : {}),
      },
    });
  },

  createForUser(userId: string, data: CreateFavoriteForUserInput) {
    return prisma.favorite.create({
      data: {
        userId,
        locationId: data.locationId,
        locationName: data.locationName,
        ...(data.country !== undefined ? { country: data.country } : {}),
        ...(data.latitude !== undefined ? { latitude: data.latitude } : {}),
        ...(data.longitude !== undefined ? { longitude: data.longitude } : {}),
        ...(data.isPinned !== undefined ? { isPinned: data.isPinned } : {}),
      },
    });
  },

  update(id: string, data: UpdateFavoriteInput) {
    const payload: Prisma.FavoriteUpdateInput = {};

    if (data.locationId !== undefined) payload.locationId = data.locationId;
    if (data.locationName !== undefined) payload.locationName = data.locationName;
    if (data.country !== undefined) payload.country = data.country;
    if (data.latitude !== undefined) payload.latitude = data.latitude;
    if (data.longitude !== undefined) payload.longitude = data.longitude;
    if (data.isPinned !== undefined) payload.isPinned = data.isPinned;

    return prisma.favorite.update({
      where: { id },
      data: payload,
    });
  },

  setPinned(id: string, isPinned: boolean) {
    return prisma.favorite.update({
      where: { id },
      data: { isPinned },
    });
  },

  delete(id: string) {
    return prisma.favorite.delete({ where: { id } });
  },

  deleteForUser(userId: string, id: string) {
    return prisma.favorite.deleteMany({
      where: { id, userId },
    });
  },
};
