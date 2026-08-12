import { Router } from "express";

import { validateRequest } from "../../middleware/validate-request.js";
import {
  getAirQuality,
  getCurrentWeather,
  getDailyForecast,
  getHistoricalWeather,
  getHourlyForecast,
  getWeatherAlerts,
  getWeatherMapConfig,
} from "./weather.controller.js";
import {
  airQualityQuerySchema,
  currentWeatherQuerySchema,
  dailyForecastQuerySchema,
  historicalWeatherQuerySchema,
  hourlyForecastQuerySchema,
  weatherAlertsQuerySchema,
} from "./weather.schemas.js";

export const weatherRouter = Router();

weatherRouter.get(
  "/current",
  validateRequest(currentWeatherQuerySchema, "query"),
  getCurrentWeather,
);
weatherRouter.get(
  "/hourly",
  validateRequest(hourlyForecastQuerySchema, "query"),
  getHourlyForecast,
);
weatherRouter.get(
  "/daily",
  validateRequest(dailyForecastQuerySchema, "query"),
  getDailyForecast,
);
weatherRouter.get(
  "/historical",
  validateRequest(historicalWeatherQuerySchema, "query"),
  getHistoricalWeather,
);
weatherRouter.get(
  "/alerts",
  validateRequest(weatherAlertsQuerySchema, "query"),
  getWeatherAlerts,
);
weatherRouter.get(
  "/air-quality",
  validateRequest(airQualityQuerySchema, "query"),
  getAirQuality,
);
weatherRouter.get("/map-config", getWeatherMapConfig);
