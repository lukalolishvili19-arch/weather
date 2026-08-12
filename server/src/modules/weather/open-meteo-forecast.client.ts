import { env } from "../../config/env.js";
import { logger } from "../../config/logger.js";
import { ApiError } from "../../errors/api-error.js";
import {
  locationsService,
  parseCoordinates,
} from "../locations/locations.service.js";
import type {
  VisualCrossingCondition,
  VisualCrossingTimelineResponse,
} from "./visual-crossing.types.js";

export type TimelineQuery = {
  location: string;
  startDate?: string;
  endDate?: string;
  include?: string[];
  elements?: string[];
};

type OpenMeteoForecastResponse = {
  latitude: number;
  longitude: number;
  timezone?: string;
  utc_offset_seconds?: number;
  current?: Record<string, number | string | null | undefined>;
  hourly?: {
    time: string[];
    [key: string]: Array<number | string | null> | string[];
  };
  daily?: {
    time: string[];
    [key: string]: Array<number | string | null> | string[];
  };
};

const CURRENT_FIELDS = [
  "temperature_2m",
  "relative_humidity_2m",
  "apparent_temperature",
  "precipitation",
  "weather_code",
  "cloud_cover",
  "pressure_msl",
  "wind_speed_10m",
  "wind_direction_10m",
  "wind_gusts_10m",
  "uv_index",
  "visibility",
  "is_day",
].join(",");

const HOURLY_FIELDS = [
  "temperature_2m",
  "relative_humidity_2m",
  "apparent_temperature",
  "precipitation",
  "precipitation_probability",
  "weather_code",
  "cloud_cover",
  "pressure_msl",
  "wind_speed_10m",
  "wind_direction_10m",
  "wind_gusts_10m",
  "uv_index",
  "visibility",
  "is_day",
].join(",");

const DAILY_FIELDS = [
  "weather_code",
  "temperature_2m_max",
  "temperature_2m_min",
  "apparent_temperature_max",
  "apparent_temperature_min",
  "precipitation_sum",
  "precipitation_probability_max",
  "sunrise",
  "sunset",
  "uv_index_max",
  "wind_speed_10m_max",
  "wind_gusts_10m_max",
  "wind_direction_10m_dominant",
  "shortwave_radiation_sum",
].join(",");

function weatherCodeMeta(code: number | null | undefined, isDay = true) {
  const value = typeof code === "number" ? code : 0;
  if (value === 0) {
    return {
      conditions: "Clear",
      icon: isDay ? "clear-day" : "clear-night",
    };
  }
  if (value <= 3) {
    return {
      conditions: value === 1 ? "Mainly clear" : value === 2 ? "Partly cloudy" : "Overcast",
      icon: isDay ? "partly-cloudy-day" : "partly-cloudy-night",
    };
  }
  if (value === 45 || value === 48) {
    return { conditions: "Fog", icon: "fog" };
  }
  if (value >= 51 && value <= 67) {
    return { conditions: "Rain", icon: "rain" };
  }
  if (value >= 71 && value <= 77) {
    return { conditions: "Snow", icon: "snow" };
  }
  if (value >= 80 && value <= 82) {
    return { conditions: "Rain showers", icon: "rain" };
  }
  if (value >= 85 && value <= 86) {
    return { conditions: "Snow showers", icon: "snow" };
  }
  if (value >= 95) {
    return { conditions: "Thunderstorm", icon: "thunder" };
  }
  return { conditions: "Cloudy", icon: "cloudy" };
}

function num(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function optString(value: string | null | undefined): string | undefined {
  return value ?? undefined;
}

function optNumber(value: number | null | undefined): number | undefined {
  return value ?? undefined;
}

function toEpoch(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const ms = Date.parse(iso);
  return Number.isFinite(ms) ? Math.floor(ms / 1000) : null;
}

function timeOnly(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const match = /T(\d{2}:\d{2})/.exec(iso);
  return match?.[1] ?? iso;
}

async function resolveLocation(location: string): Promise<{
  latitude: number;
  longitude: number;
  label: string;
}> {
  const coords = parseCoordinates(location);
  if (coords) {
    try {
      const resolved = await locationsService.resolve({
        latitude: coords.latitude,
        longitude: coords.longitude,
      });
      return {
        latitude: resolved.latitude,
        longitude: resolved.longitude,
        label: resolved.label,
      };
    } catch {
      return {
        latitude: coords.latitude,
        longitude: coords.longitude,
        label: location.trim(),
      };
    }
  }

  const resolved = await locationsService.resolve({ q: location });
  return {
    latitude: resolved.latitude,
    longitude: resolved.longitude,
    label: resolved.label,
  };
}

function forecastDayCount(query: TimelineQuery): number {
  if (query.startDate?.startsWith("next") && query.startDate.endsWith("days")) {
    const days = Number(query.startDate.replace(/\D/g, ""));
    if (Number.isFinite(days) && days > 0) return Math.min(Math.max(days, 1), 16);
  }
  if (query.startDate && query.endDate && /^\d{4}-\d{2}-\d{2}$/.test(query.startDate)) {
    const start = Date.parse(`${query.startDate}T00:00:00Z`);
    const end = Date.parse(`${query.endDate}T00:00:00Z`);
    if (Number.isFinite(start) && Number.isFinite(end) && end >= start) {
      const days = Math.floor((end - start) / 86_400_000) + 1;
      return Math.min(Math.max(days, 1), 16);
    }
  }
  return 16;
}

function mapCurrent(
  current: Record<string, number | string | null | undefined> | undefined,
): VisualCrossingCondition | null {
  if (!current) return null;
  const code = num(current.weather_code);
  const isDay = num(current.is_day) !== 0;
  const meta = weatherCodeMeta(code, isDay);
  const datetime = typeof current.time === "string" ? current.time : undefined;
  const datetimeEpoch = optNumber(toEpoch(datetime));

  return {
    ...(datetime ? { datetime } : {}),
    ...(datetimeEpoch != null ? { datetimeEpoch } : {}),
    temp: num(current.temperature_2m),
    feelslike: num(current.apparent_temperature),
    humidity: num(current.relative_humidity_2m),
    precip: num(current.precipitation),
    precipprob: null,
    preciptype: [],
    windspeed: num(current.wind_speed_10m),
    windgust: num(current.wind_gusts_10m),
    winddir: num(current.wind_direction_10m),
    pressure: num(current.pressure_msl),
    cloudcover: num(current.cloud_cover),
    visibility: (() => {
      const meters = num(current.visibility);
      return meters == null ? null : meters / 1000;
    })(),
    uvindex: num(current.uv_index),
    conditions: meta.conditions,
    icon: meta.icon,
  };
}

function mapHourlyBucket(
  hourly: OpenMeteoForecastResponse["hourly"],
  index: number,
): VisualCrossingCondition {
  const datetime = optString(hourly?.time?.[index]);
  const datetimeEpoch = optNumber(toEpoch(datetime));
  const code = num(hourly?.weather_code?.[index]);
  const isDay = num(hourly?.is_day?.[index]) !== 0;
  const meta = weatherCodeMeta(code, isDay);
  const visibilityMeters = num(hourly?.visibility?.[index]);

  return {
    ...(datetime ? { datetime } : {}),
    ...(datetimeEpoch != null ? { datetimeEpoch } : {}),
    temp: num(hourly?.temperature_2m?.[index]),
    feelslike: num(hourly?.apparent_temperature?.[index]),
    humidity: num(hourly?.relative_humidity_2m?.[index]),
    precip: num(hourly?.precipitation?.[index]),
    precipprob: num(hourly?.precipitation_probability?.[index]),
    preciptype: [],
    windspeed: num(hourly?.wind_speed_10m?.[index]),
    windgust: num(hourly?.wind_gusts_10m?.[index]),
    winddir: num(hourly?.wind_direction_10m?.[index]),
    pressure: num(hourly?.pressure_msl?.[index]),
    cloudcover: num(hourly?.cloud_cover?.[index]),
    visibility: visibilityMeters == null ? null : visibilityMeters / 1000,
    uvindex: num(hourly?.uv_index?.[index]),
    conditions: meta.conditions,
    icon: meta.icon,
  };
}

function mapDailyBucket(
  daily: OpenMeteoForecastResponse["daily"],
  hourly: OpenMeteoForecastResponse["hourly"],
  index: number,
): VisualCrossingCondition {
  const date = optString(daily?.time?.[index]);
  const datetimeEpoch = optNumber(date ? toEpoch(`${date}T12:00:00`) : null);
  const code = num(daily?.weather_code?.[index]);
  const meta = weatherCodeMeta(code, true);
  const hours =
    hourly?.time
      ?.map((time, hourIndex) => ({ time, hourIndex }))
      .filter(({ time }) => (date ? time.startsWith(date) : false))
      .map(({ hourIndex }) => mapHourlyBucket(hourly, hourIndex)) ?? [];

  const tempMax = num(daily?.temperature_2m_max?.[index]);
  const tempMin = num(daily?.temperature_2m_min?.[index]);
  const avgTemp =
    tempMax != null && tempMin != null ? (tempMax + tempMin) / 2 : (tempMax ?? tempMin);
  const sunrise = timeOnly(
    typeof daily?.sunrise?.[index] === "string" ? String(daily.sunrise[index]) : null,
  );
  const sunset = timeOnly(
    typeof daily?.sunset?.[index] === "string" ? String(daily.sunset[index]) : null,
  );

  return {
    ...(date ? { datetime: date } : {}),
    ...(datetimeEpoch != null ? { datetimeEpoch } : {}),
    temp: avgTemp,
    tempmax: tempMax,
    tempmin: tempMin,
    feelslikemax: num(daily?.apparent_temperature_max?.[index]),
    feelslikemin: num(daily?.apparent_temperature_min?.[index]),
    precip: num(daily?.precipitation_sum?.[index]),
    precipprob: num(daily?.precipitation_probability_max?.[index]),
    preciptype: [],
    windspeed: num(daily?.wind_speed_10m_max?.[index]),
    windgust: num(daily?.wind_gusts_10m_max?.[index]),
    winddir: num(daily?.wind_direction_10m_dominant?.[index]),
    uvindex: num(daily?.uv_index_max?.[index]),
    ...(sunrise ? { sunrise } : {}),
    ...(sunset ? { sunset } : {}),
    conditions: meta.conditions,
    icon: meta.icon,
    description: meta.conditions,
    solarradiation: num(daily?.shortwave_radiation_sum?.[index]),
    hours,
  };
}

export async function fetchOpenMeteoTimeline(
  query: TimelineQuery,
): Promise<VisualCrossingTimelineResponse> {
  const location = await resolveLocation(query.location);
  const forecastDays = forecastDayCount(query);

  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(location.latitude));
  url.searchParams.set("longitude", String(location.longitude));
  url.searchParams.set("timezone", "auto");
  url.searchParams.set("wind_speed_unit", "kmh");
  url.searchParams.set("precipitation_unit", "mm");
  url.searchParams.set("forecast_days", String(forecastDays));
  url.searchParams.set("current", CURRENT_FIELDS);
  url.searchParams.set("hourly", HOURLY_FIELDS);
  url.searchParams.set("daily", DAILY_FIELDS);

  let response: Response;
  try {
    response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
    });
  } catch (error) {
    logger.error({ error, location: query.location }, "Open-Meteo forecast request failed");
    throw new ApiError(
      502,
      "WEATHER_UPSTREAM_UNAVAILABLE",
      "Unable to reach the weather provider.",
    );
  }

  if (!response.ok) {
    const body = await response.text();
    logger.warn(
      {
        status: response.status,
        body: body.slice(0, 500),
        location: query.location,
      },
      "Open-Meteo forecast returned an error",
    );
    throw new ApiError(
      502,
      "WEATHER_UPSTREAM_ERROR",
      "Weather provider returned an unexpected error.",
    );
  }

  const payload = (await response.json()) as OpenMeteoForecastResponse;
  const days =
    payload.daily?.time?.map((_, index) =>
      mapDailyBucket(payload.daily, payload.hourly, index),
    ) ?? [];

  return {
    address: location.label,
    resolvedAddress: location.label,
    latitude: payload.latitude ?? location.latitude,
    longitude: payload.longitude ?? location.longitude,
    ...(payload.timezone ? { timezone: payload.timezone } : {}),
    ...(typeof payload.utc_offset_seconds === "number"
      ? { tzoffset: payload.utc_offset_seconds / 3600 }
      : {}),
    currentConditions: mapCurrent(payload.current),
    days,
    alerts: [],
  };
}

export function hasVisualCrossingApiKey(): boolean {
  const key = env.visualCrossingApiKey.trim().toLowerCase();
  if (!key) return false;
  return ![
    "your-visual-crossing-api-key",
    "changeme",
    "replace-me",
    "todo",
    "none",
  ].includes(key);
}
