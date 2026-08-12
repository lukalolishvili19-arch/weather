import { env } from "../../config/env.js";
import { ApiError } from "../../errors/api-error.js";
import {
  locationsService,
  parseCoordinates,
} from "../locations/locations.service.js";
import { mapAirQualityResponse } from "./air-quality.mapper.js";
import { buildAlertCategoryCards } from "./alert-categories.mapper.js";
import { fetchOpenMeteoAirQuality } from "./open-meteo-air-quality.client.js";
import { fetchTimeline } from "./visual-crossing.client.js";
import {
  mapAlert,
  mapDaily,
  mapEnvelope,
  mapCondition,
  mapHourly,
} from "./weather.mapper.js";
import type {
  AirQualityQuery,
  CurrentWeatherQuery,
  DailyForecastQuery,
  HistoricalWeatherQuery,
  HourlyForecastQuery,
  WeatherAlertsQuery,
} from "./weather.schemas.js";
import type {
  AirQualityResponse,
  CurrentWeatherResponse,
  DailyForecastResponse,
  HistoricalWeatherResponse,
  HourlyForecastResponse,
  WeatherAlertsResponse,
  WeatherMapConfigResponse,
} from "./weather.types.js";

function assertDateOrder(startDate: string, endDate: string) {
  if (startDate > endDate) {
    throw new ApiError(
      400,
      "INVALID_DATE_RANGE",
      "startDate must be on or before endDate.",
    );
  }
}

async function resolveCoordinates(location: string): Promise<{
  latitude: number;
  longitude: number;
  resolvedAddress: string;
  timezone: string | null;
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
        resolvedAddress: resolved.label,
        timezone: null,
      };
    } catch {
      return {
        latitude: coords.latitude,
        longitude: coords.longitude,
        resolvedAddress: location.trim(),
        timezone: null,
      };
    }
  }

  try {
    const resolved = await locationsService.resolve({ q: location });
    return {
      latitude: resolved.latitude,
      longitude: resolved.longitude,
      resolvedAddress: resolved.label,
      timezone: null,
    };
  } catch {
    const payload = await fetchTimeline({
      location,
      include: ["current"],
      elements: ["datetime"],
    });

    if (
      typeof payload.latitude !== "number" ||
      typeof payload.longitude !== "number" ||
      !Number.isFinite(payload.latitude) ||
      !Number.isFinite(payload.longitude)
    ) {
      throw new ApiError(
        404,
        "LOCATION_NOT_FOUND",
        `Unable to resolve coordinates for "${location}".`,
      );
    }

    return {
      latitude: payload.latitude,
      longitude: payload.longitude,
      resolvedAddress: payload.resolvedAddress ?? payload.address ?? location,
      timezone: payload.timezone ?? null,
    };
  }
}

export const weatherService = {
  async getCurrent(query: CurrentWeatherQuery): Promise<CurrentWeatherResponse> {
    const payload = await fetchTimeline({
      location: query.location,
      include: ["current"],
    });

    return {
      ...mapEnvelope(query.location, env.visualCrossingUnitGroup, payload),
      current: mapCondition(payload.currentConditions),
    };
  },

  async getHourly(query: HourlyForecastQuery): Promise<HourlyForecastResponse> {
    const payload = await fetchTimeline({
      location: query.location,
      include: ["hours", "days"],
    });

    const days = (payload.days ?? []).slice(0, query.days);
    let hours = days.flatMap((day) => (day.hours ?? []).map((hour) => mapHourly(hour)));

    if (query.hours !== undefined) {
      const nowEpoch = Math.floor(Date.now() / 1000) - 3_600;
      hours = hours
        .filter((hour) => (hour.datetimeEpoch ?? 0) >= nowEpoch)
        .slice(0, query.hours);
    }

    return {
      ...mapEnvelope(query.location, env.visualCrossingUnitGroup, payload),
      hours,
    };
  },

  async getDaily(query: DailyForecastQuery): Promise<DailyForecastResponse> {
    const usePeriod = query.days > 15;
    const payload = await fetchTimeline({
      location: query.location,
      ...(usePeriod ? { startDate: `next${query.days}days` } : {}),
      include: ["days"],
    });

    const days = (payload.days ?? [])
      .slice(0, query.days)
      .map((day) => mapDaily(day, false));

    return {
      ...mapEnvelope(query.location, env.visualCrossingUnitGroup, payload),
      days,
    };
  },

  async getHistorical(
    query: HistoricalWeatherQuery,
  ): Promise<HistoricalWeatherResponse> {
    assertDateOrder(query.startDate, query.endDate);

    const payload = await fetchTimeline({
      location: query.location,
      startDate: query.startDate,
      endDate: query.endDate,
      include: ["days", "hours"],
    });

    return {
      ...mapEnvelope(query.location, env.visualCrossingUnitGroup, payload),
      startDate: query.startDate,
      endDate: query.endDate,
      days: (payload.days ?? []).map((day) => mapDaily(day, true)),
    };
  },

  async getAlerts(query: WeatherAlertsQuery): Promise<WeatherAlertsResponse> {
    const payload = await fetchTimeline({
      location: query.location,
      include: ["alerts", "days", "current"],
    });

    const alerts = (payload.alerts ?? []).map((alert) => mapAlert(alert));
    const days = (payload.days ?? []).slice(0, 5).map((day) => mapDaily(day, false));
    const envelope = mapEnvelope(query.location, env.visualCrossingUnitGroup, payload);
    const categories = buildAlertCategoryCards({
      alerts,
      days,
      units: env.visualCrossingUnitGroup,
      area: envelope.location.resolvedAddress,
    });

    return {
      ...envelope,
      alerts,
      categories,
      activeCount: categories.filter((card) => card.active).length,
    };
  },

  async getAirQuality(query: AirQualityQuery): Promise<AirQualityResponse> {
    const coords = await resolveCoordinates(query.location);
    const payload = await fetchOpenMeteoAirQuality(coords.latitude, coords.longitude);

    return mapAirQualityResponse({
      query: query.location,
      resolvedAddress: coords.resolvedAddress,
      latitude: payload.latitude ?? coords.latitude,
      longitude: payload.longitude ?? coords.longitude,
      timezone: coords.timezone,
      payloadCurrent: payload.current,
      ...(payload.timezone ? { providerTimezone: payload.timezone } : {}),
    });
  },

  getMapConfig(): WeatherMapConfigResponse {
    const key = env.openWeatherApiKey;
    const layers = [
      { id: "temperature" as const, label: "Temperature", owmLayer: "temp_new", color: "#f7921e" },
      { id: "rain" as const, label: "Rain", owmLayer: "precipitation_new", color: "#4a9eff" },
      { id: "wind" as const, label: "Wind", owmLayer: "wind_new", color: "#a3e635" },
      { id: "pressure" as const, label: "Pressure", owmLayer: "pressure_new", color: "#7a8ba8" },
      { id: "clouds" as const, label: "Clouds", owmLayer: "clouds_new", color: "#94a3b8" },
    ];

    if (!key) {
      return {
        overlaysEnabled: false,
        tileUrlTemplate: null,
        layers,
      };
    }

    return {
      overlaysEnabled: true,
      tileUrlTemplate: `https://tile.openweathermap.org/map/{layer}/{z}/{x}/{y}.png?appid=${encodeURIComponent(key)}`,
      layers,
    };
  },
};
