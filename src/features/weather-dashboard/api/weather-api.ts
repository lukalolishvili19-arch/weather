import { httpClient } from "@/shared/api";

import type {
  AirQualityResponse,
  ApiSuccess,
  CurrentWeatherResponse,
  DailyForecastResponse,
  HourlyForecastResponse,
  WeatherAlertsResponse,
  WeatherMapConfigResponse,
} from "./weather.types";

export const weatherApi = {
  async getCurrent(location: string) {
    const { data } = await httpClient.get<ApiSuccess<CurrentWeatherResponse>>("/weather/current", {
      params: { location },
    });
    return data.data;
  },

  async getHourly(location: string, options?: { days?: number; hours?: number }) {
    const { data } = await httpClient.get<ApiSuccess<HourlyForecastResponse>>("/weather/hourly", {
      params: {
        location,
        ...(options?.days !== undefined ? { days: options.days } : {}),
        ...(options?.hours !== undefined ? { hours: options.hours } : {}),
      },
    });
    return data.data;
  },

  async getDaily(location: string, days = 7) {
    const { data } = await httpClient.get<ApiSuccess<DailyForecastResponse>>("/weather/daily", {
      params: { location, days },
    });
    return data.data;
  },

  async getAirQuality(location: string) {
    const { data } = await httpClient.get<ApiSuccess<AirQualityResponse>>("/weather/air-quality", {
      params: { location },
    });
    return data.data;
  },

  async getAlerts(location: string) {
    const { data } = await httpClient.get<ApiSuccess<WeatherAlertsResponse>>("/weather/alerts", {
      params: { location },
    });
    return data.data;
  },

  async getMapConfig() {
    const { data } = await httpClient.get<ApiSuccess<WeatherMapConfigResponse>>(
      "/weather/map-config",
    );
    return data.data;
  },
};
