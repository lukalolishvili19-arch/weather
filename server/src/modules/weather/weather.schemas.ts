import { z } from "zod";

const locationQuery = z.object({
  location: z.string().trim().min(1).max(200),
});

export const currentWeatherQuerySchema = locationQuery;

export const hourlyForecastQuerySchema = locationQuery.extend({
  days: z.coerce.number().int().min(1).max(15).default(2),
  hours: z.coerce.number().int().min(1).max(168).optional(),
});

export const dailyForecastQuerySchema = locationQuery.extend({
  days: z.coerce.number().int().min(1).max(30).default(15),
});

export const historicalWeatherQuerySchema = locationQuery.extend({
  startDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "startDate must be YYYY-MM-DD"),
  endDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "endDate must be YYYY-MM-DD"),
});

export const weatherAlertsQuerySchema = locationQuery;

export const airQualityQuerySchema = locationQuery;

export type CurrentWeatherQuery = z.infer<typeof currentWeatherQuerySchema>;
export type HourlyForecastQuery = z.infer<typeof hourlyForecastQuerySchema>;
export type DailyForecastQuery = z.infer<typeof dailyForecastQuerySchema>;
export type HistoricalWeatherQuery = z.infer<typeof historicalWeatherQuerySchema>;
export type WeatherAlertsQuery = z.infer<typeof weatherAlertsQuerySchema>;
export type AirQualityQuery = z.infer<typeof airQualityQuerySchema>;
