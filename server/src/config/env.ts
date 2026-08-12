import "dotenv/config";

import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().max(65_535).default(4000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  CORS_ORIGINS: z.string().default("http://localhost:5173"),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .default("info"),
  JWT_ACCESS_SECRET: z.string().min(32, "JWT_ACCESS_SECRET must be at least 32 characters"),
  JWT_REFRESH_SECRET: z.string().min(32, "JWT_REFRESH_SECRET must be at least 32 characters"),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
  REFRESH_COOKIE_NAME: z.string().default("refreshToken"),
  BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),
  VISUAL_CROSSING_API_KEY: z.string().optional().default(""),
  VISUAL_CROSSING_BASE_URL: z
    .string()
    .url()
    .default(
      "https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline",
    ),
  VISUAL_CROSSING_UNIT_GROUP: z.enum(["metric", "us", "uk", "base"]).default("metric"),
  OPEN_METEO_AIR_QUALITY_BASE_URL: z
    .string()
    .url()
    .default("https://air-quality-api.open-meteo.com/v1/air-quality"),
  OPENWEATHER_API_KEY: z.string().optional().default(""),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const errors = parsed.error.flatten().fieldErrors;
  throw new Error(`Invalid environment configuration: ${JSON.stringify(errors)}`);
}

export const env = Object.freeze({
  nodeEnv: parsed.data.NODE_ENV,
  port: parsed.data.PORT,
  databaseUrl: parsed.data.DATABASE_URL,
  corsOrigins: parsed.data.CORS_ORIGINS.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  logLevel: parsed.data.LOG_LEVEL,
  isProduction: parsed.data.NODE_ENV === "production",
  jwtAccessSecret: parsed.data.JWT_ACCESS_SECRET,
  jwtRefreshSecret: parsed.data.JWT_REFRESH_SECRET,
  jwtAccessExpiresIn: parsed.data.JWT_ACCESS_EXPIRES_IN,
  jwtRefreshExpiresIn: parsed.data.JWT_REFRESH_EXPIRES_IN,
  refreshCookieName: parsed.data.REFRESH_COOKIE_NAME,
  bcryptSaltRounds: parsed.data.BCRYPT_SALT_ROUNDS,
  visualCrossingApiKey: parsed.data.VISUAL_CROSSING_API_KEY,
  visualCrossingBaseUrl: parsed.data.VISUAL_CROSSING_BASE_URL.replace(/\/$/, ""),
  visualCrossingUnitGroup: parsed.data.VISUAL_CROSSING_UNIT_GROUP,
  openMeteoAirQualityBaseUrl: parsed.data.OPEN_METEO_AIR_QUALITY_BASE_URL.replace(/\/$/, ""),
  openWeatherApiKey: parsed.data.OPENWEATHER_API_KEY.trim(),
});
