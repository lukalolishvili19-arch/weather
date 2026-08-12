import { TemperatureUnit, Theme, WindSpeedUnit } from "@prisma/client";
import { z } from "zod";

export const userSettingsIdParamsSchema = z.object({
  id: z.string().cuid(),
});

export const createUserSettingsSchema = z.object({
  userId: z.string().cuid(),
  theme: z.nativeEnum(Theme).optional(),
  language: z.string().trim().min(2).max(16).optional(),
  temperatureUnit: z.nativeEnum(TemperatureUnit).optional(),
  windSpeedUnit: z.nativeEnum(WindSpeedUnit).optional(),
  timeFormat24h: z.boolean().optional(),
  animateCharts: z.boolean().optional(),
  showFeelsLike: z.boolean().optional(),
  rainAlerts: z.boolean().optional(),
  stormWarnings: z.boolean().optional(),
  highUvAlerts: z.boolean().optional(),
  heatWarnings: z.boolean().optional(),
  strongWindAlerts: z.boolean().optional(),
  snowAlerts: z.boolean().optional(),
  dailyForecast: z.boolean().optional(),
});

export const updateUserSettingsSchema = createUserSettingsSchema
  .omit({ userId: true })
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });

export type CreateUserSettingsInput = z.infer<typeof createUserSettingsSchema>;
export type UpdateUserSettingsInput = z.infer<typeof updateUserSettingsSchema>;
