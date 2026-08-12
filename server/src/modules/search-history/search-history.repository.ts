import type { Prisma } from "@prisma/client";

import { prisma } from "../../lib/prisma.js";
import type {
  CreateSearchHistoryInput,
  RecordSearchHistoryInput,
  UpdateSearchHistoryInput,
} from "./search-history.schemas.js";

export const searchHistoryRepository = {
  findMany(userId?: string, limit = 50) {
    return prisma.searchHistory.findMany({
      ...(userId ? { where: { userId } } : {}),
      orderBy: { searchedAt: "desc" },
      take: limit,
    });
  },

  findById(id: string) {
    return prisma.searchHistory.findUnique({ where: { id } });
  },

  create(data: CreateSearchHistoryInput) {
    return prisma.searchHistory.create({
      data: {
        userId: data.userId,
        query: data.query,
        ...(data.locationId !== undefined ? { locationId: data.locationId } : {}),
        ...(data.locationName !== undefined ? { locationName: data.locationName } : {}),
        ...(data.country !== undefined ? { country: data.country } : {}),
        ...(data.latitude !== undefined ? { latitude: data.latitude } : {}),
        ...(data.longitude !== undefined ? { longitude: data.longitude } : {}),
      },
    });
  },

  async recordForUser(userId: string, data: RecordSearchHistoryInput) {
    await prisma.searchHistory.deleteMany({
      where: {
        userId,
        query: { equals: data.query, mode: "insensitive" },
      },
    });

    return prisma.searchHistory.create({
      data: {
        userId,
        query: data.query,
        ...(data.locationId !== undefined ? { locationId: data.locationId } : {}),
        ...(data.locationName !== undefined ? { locationName: data.locationName } : {}),
        ...(data.country !== undefined ? { country: data.country } : {}),
        ...(data.latitude !== undefined ? { latitude: data.latitude } : {}),
        ...(data.longitude !== undefined ? { longitude: data.longitude } : {}),
      },
    });
  },

  update(id: string, data: UpdateSearchHistoryInput) {
    const payload: Prisma.SearchHistoryUpdateInput = {};

    if (data.query !== undefined) payload.query = data.query;
    if (data.locationId !== undefined) payload.locationId = data.locationId;
    if (data.locationName !== undefined) payload.locationName = data.locationName;
    if (data.country !== undefined) payload.country = data.country;
    if (data.latitude !== undefined) payload.latitude = data.latitude;
    if (data.longitude !== undefined) payload.longitude = data.longitude;

    return prisma.searchHistory.update({
      where: { id },
      data: payload,
    });
  },

  delete(id: string) {
    return prisma.searchHistory.delete({ where: { id } });
  },

  deleteForUser(userId: string, id: string) {
    return prisma.searchHistory.deleteMany({
      where: { id, userId },
    });
  },

  clearForUser(userId: string) {
    return prisma.searchHistory.deleteMany({
      where: { userId },
    });
  },
};
