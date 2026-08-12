import type { RequestHandler } from "express";

import { asyncHandler } from "../../common/async-handler.js";
import { sendSuccess } from "../../common/http.js";
import { weatherService } from "./weather.service.js";
import type {
  AirQualityQuery,
  CurrentWeatherQuery,
  DailyForecastQuery,
  HistoricalWeatherQuery,
  HourlyForecastQuery,
  WeatherAlertsQuery,
} from "./weather.schemas.js";

export const getCurrentWeather: RequestHandler = asyncHandler(async (request, response) => {
  const data = await weatherService.getCurrent(request.query as unknown as CurrentWeatherQuery);
  sendSuccess(response, data);
});

export const getHourlyForecast: RequestHandler = asyncHandler(async (request, response) => {
  const data = await weatherService.getHourly(request.query as unknown as HourlyForecastQuery);
  sendSuccess(response, data);
});

export const getDailyForecast: RequestHandler = asyncHandler(async (request, response) => {
  const data = await weatherService.getDaily(request.query as unknown as DailyForecastQuery);
  sendSuccess(response, data);
});

export const getHistoricalWeather: RequestHandler = asyncHandler(async (request, response) => {
  const data = await weatherService.getHistorical(
    request.query as unknown as HistoricalWeatherQuery,
  );
  sendSuccess(response, data);
});

export const getWeatherAlerts: RequestHandler = asyncHandler(async (request, response) => {
  const data = await weatherService.getAlerts(request.query as unknown as WeatherAlertsQuery);
  sendSuccess(response, data);
});

export const getAirQuality: RequestHandler = asyncHandler(async (request, response) => {
  const data = await weatherService.getAirQuality(request.query as unknown as AirQualityQuery);
  sendSuccess(response, data);
});

export const getWeatherMapConfig: RequestHandler = asyncHandler(async (_request, response) => {
  sendSuccess(response, weatherService.getMapConfig());
});
