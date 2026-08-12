import type { Prisma } from "@prisma/client";

import { prisma } from "../../lib/prisma.js";
import type {
  CreateUserSettingsInput,
  UpdateUserSettingsInput,
} from "./user-settings.schemas.js";

function toCreateData(data: CreateUserSettingsInput): Prisma.UserSettingsCreateInput {
  return {
    user: { connect: { id: data.userId } },
    ...(data.theme !== undefined ? { theme: data.theme } : {}),
    ...(data.language !== undefined ? { language: data.language } : {}),
    ...(data.temperatureUnit !== undefined
      ? { temperatureUnit: data.temperatureUnit }
      : {}),
    ...(data.windSpeedUnit !== undefined ? { windSpeedUnit: data.windSpeedUnit } : {}),
    ...(data.timeFormat24h !== undefined ? { timeFormat24h: data.timeFormat24h } : {}),
    ...(data.animateCharts !== undefined ? { animateCharts: data.animateCharts } : {}),
    ...(data.showFeelsLike !== undefined ? { showFeelsLike: data.showFeelsLike } : {}),
    ...(data.rainAlerts !== undefined ? { rainAlerts: data.rainAlerts } : {}),
    ...(data.stormWarnings !== undefined ? { stormWarnings: data.stormWarnings } : {}),
    ...(data.highUvAlerts !== undefined ? { highUvAlerts: data.highUvAlerts } : {}),
    ...(data.heatWarnings !== undefined ? { heatWarnings: data.heatWarnings } : {}),
    ...(data.strongWindAlerts !== undefined
      ? { strongWindAlerts: data.strongWindAlerts }
      : {}),
    ...(data.snowAlerts !== undefined ? { snowAlerts: data.snowAlerts } : {}),
    ...(data.dailyForecast !== undefined ? { dailyForecast: data.dailyForecast } : {}),
  };
}

function toUpdateData(data: UpdateUserSettingsInput): Prisma.UserSettingsUpdateInput {
  const payload: Prisma.UserSettingsUpdateInput = {};

  if (data.theme !== undefined) payload.theme = data.theme;
  if (data.language !== undefined) payload.language = data.language;
  if (data.temperatureUnit !== undefined) payload.temperatureUnit = data.temperatureUnit;
  if (data.windSpeedUnit !== undefined) payload.windSpeedUnit = data.windSpeedUnit;
  if (data.timeFormat24h !== undefined) payload.timeFormat24h = data.timeFormat24h;
  if (data.animateCharts !== undefined) payload.animateCharts = data.animateCharts;
  if (data.showFeelsLike !== undefined) payload.showFeelsLike = data.showFeelsLike;
  if (data.rainAlerts !== undefined) payload.rainAlerts = data.rainAlerts;
  if (data.stormWarnings !== undefined) payload.stormWarnings = data.stormWarnings;
  if (data.highUvAlerts !== undefined) payload.highUvAlerts = data.highUvAlerts;
  if (data.heatWarnings !== undefined) payload.heatWarnings = data.heatWarnings;
  if (data.strongWindAlerts !== undefined) payload.strongWindAlerts = data.strongWindAlerts;
  if (data.snowAlerts !== undefined) payload.snowAlerts = data.snowAlerts;
  if (data.dailyForecast !== undefined) payload.dailyForecast = data.dailyForecast;

  return payload;
}

export const userSettingsRepository = {
  findMany() {
    return prisma.userSettings.findMany({
      orderBy: { createdAt: "desc" },
    });
  },

  findById(id: string) {
    return prisma.userSettings.findUnique({ where: { id } });
  },

  findByUserId(userId: string) {
    return prisma.userSettings.findUnique({ where: { userId } });
  },

  create(data: CreateUserSettingsInput) {
    return prisma.userSettings.create({
      data: toCreateData(data),
    });
  },

  update(id: string, data: UpdateUserSettingsInput) {
    return prisma.userSettings.update({
      where: { id },
      data: toUpdateData(data),
    });
  },

  delete(id: string) {
    return prisma.userSettings.delete({ where: { id } });
  },
};
