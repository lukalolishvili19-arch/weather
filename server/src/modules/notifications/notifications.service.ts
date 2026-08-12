import { handlePrismaError } from "../../common/prisma-errors.js";
import { ApiError } from "../../errors/api-error.js";
import { usersService } from "../users/users.service.js";
import { userSettingsService } from "../user-settings/user-settings.service.js";
import { weatherService } from "../weather/weather.service.js";
import { notificationsRepository } from "./notifications.repository.js";
import type {
  CreateNotificationInput,
  UpdateNotificationInput,
} from "./notifications.schemas.js";

type AlertCategory = "rain" | "storm" | "heat";

type SyncCandidate = {
  category: AlertCategory;
  title: string;
  body: string;
  dedupeKey: string;
};

function dayKey(datetime: string | null | undefined) {
  return datetime?.slice(0, 10) ?? "unknown";
}

export const notificationsService = {
  async list(userId?: string) {
    if (userId) {
      await usersService.getById(userId);
    }
    return notificationsRepository.findMany(userId);
  },

  async listMine(userId: string) {
    await usersService.getById(userId);
    return notificationsRepository.findMany(userId);
  },

  async getById(id: string) {
    const notification = await notificationsRepository.findById(id);
    if (!notification) {
      throw new ApiError(
        404,
        "NOTIFICATION_NOT_FOUND",
        `Notification ${id} was not found.`,
      );
    }
    return notification;
  },

  async getMineById(userId: string, id: string) {
    const notification = await this.getById(id);
    if (notification.userId !== userId) {
      throw new ApiError(403, "FORBIDDEN", "You cannot access this notification.");
    }
    return notification;
  },

  async create(input: CreateNotificationInput) {
    await usersService.getById(input.userId);
    try {
      return await notificationsRepository.create(input);
    } catch (error) {
      handlePrismaError(error);
    }
  },

  async update(id: string, input: UpdateNotificationInput) {
    await this.getById(id);
    try {
      return await notificationsRepository.update(id, input);
    } catch (error) {
      handlePrismaError(error);
    }
  },

  async updateMine(userId: string, id: string, input: UpdateNotificationInput) {
    await this.getMineById(userId, id);
    return this.update(id, input);
  },

  async remove(id: string) {
    await this.getById(id);
    try {
      return await notificationsRepository.delete(id);
    } catch (error) {
      handlePrismaError(error);
    }
  },

  async removeMine(userId: string, id: string) {
    await this.getMineById(userId, id);
    return this.remove(id);
  },

  async markAllRead(userId: string) {
    await usersService.getById(userId);
    await notificationsRepository.markAllRead(userId);
    return this.listMine(userId);
  },

  async clearRead(userId: string) {
    await usersService.getById(userId);
    await notificationsRepository.deleteRead(userId);
    return this.listMine(userId);
  },

  async syncWeatherAlerts(userId: string, location: string) {
    const settings = await userSettingsService.getOrCreateByUserId(userId);
    const [daily, alerts] = await Promise.all([
      weatherService.getDaily({ location, days: 3 }),
      weatherService.getAlerts({ location }),
    ]);

    const tomorrow = daily.days[1] ?? daily.days[0] ?? null;
    const today = daily.days[0] ?? null;
    const area = daily.location.resolvedAddress;
    const candidates: SyncCandidate[] = [];

    if (settings.rainAlerts && tomorrow) {
      const rainChance = tomorrow.precipProbability ?? 0;
      if (rainChance >= 60) {
        candidates.push({
          category: "rain",
          title: "Rain Alert",
          body: `${Math.round(rainChance)}% chance of rain around ${dayKey(tomorrow.datetime)} in ${area}. Pack an umbrella.`,
          dedupeKey: `rain:${dayKey(tomorrow.datetime)}:${location}`,
        });
      }
    }

    if (settings.stormWarnings) {
      const stormOfficial = alerts.categories.find(
        (item) => item.id === "storm" && item.active,
      );
      const stormDay = daily.days.find((day) => {
        const hay = `${day.conditions ?? ""} ${day.icon ?? ""}`.toLowerCase();
        return hay.includes("thunder") || hay.includes("storm");
      });

      if (stormOfficial || stormDay) {
        const when = stormOfficial?.issued ?? stormDay?.datetime ?? null;
        candidates.push({
          category: "storm",
          title: "Storm Alert",
          body: stormOfficial
            ? `${stormOfficial.title}. ${stormOfficial.description}`
            : `Stormy conditions possible near ${dayKey(when)} in ${area}. Limit outdoor exposure.`,
          dedupeKey: `storm:${dayKey(when)}:${location}`,
        });
      }
    }

    if (settings.heatWarnings && today) {
      const high = today.temperatureMax ?? today.temperature ?? null;
      const heatThreshold = daily.units === "us" ? 97 : 36;
      if (typeof high === "number" && high >= heatThreshold) {
        const unit = daily.units === "us" ? "°F" : "°C";
        candidates.push({
          category: "heat",
          title: "Heat Alert",
          body: `Highs near ${Math.round(high)}${unit} expected in ${area}. Stay hydrated and avoid peak sun.`,
          dedupeKey: `heat:${dayKey(today.datetime)}:${location}`,
        });
      }
    }

    const created = [];
    for (const candidate of candidates) {
      const existing = await notificationsRepository.findByUserAndDedupeKey(
        userId,
        candidate.dedupeKey,
      );
      if (existing) continue;

      try {
        const notification = await notificationsRepository.create({
          userId,
          title: candidate.title,
          body: candidate.body,
          type: "ALERT",
          read: false,
          metadata: {
            category: candidate.category,
            dedupeKey: candidate.dedupeKey,
            location,
            area,
          },
        });
        created.push(notification);
      } catch (error) {
        handlePrismaError(error);
      }
    }

    const notifications = await this.listMine(userId);
    return { createdCount: created.length, notifications };
  },
};
