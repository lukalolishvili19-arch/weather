import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { weatherApi } from "../api/weather-api";
import type { NormalizedCondition, NormalizedDailyCondition } from "../api/weather.types";
import type { MessageKey } from "../lib/i18n";
import {
  formatHourLabel,
  formatNumber,
  precipUnitLabel,
} from "../lib/weather-format";
import { convertTemperature, convertWindSpeed } from "../lib/units";
import { getStoredWeatherLocation } from "../lib/location-storage";
import { usePreferences } from "../model/preferences-context";
import { useI18n } from "./use-i18n";

export type ChartRange = "hourly" | "weekly" | "monthly";

export type ChartMetricId =
  | "temperature"
  | "feelsLike"
  | "humidity"
  | "wind"
  | "pressure"
  | "rain"
  | "uv"
  | "cloudCover";

export type ChartPoint = {
  label: string;
  value: number;
  secondary?: number;
  rawLabel: string;
};

export type MetricConfig = {
  id: ChartMetricId;
  label: string;
  color: string;
  unit: string;
  secondaryLabel?: string;
};

const REFETCH_MS = 5 * 60 * 1_000;

export function useAnalyticsWeather(location = getStoredWeatherLocation(), range: ChartRange) {
  const hourlyQuery = useQuery({
    queryKey: ["weather", "analytics", "hourly", location],
    queryFn: () => weatherApi.getHourly(location, { days: 2, hours: 24 }),
    enabled: Boolean(location.trim()) && range === "hourly",
    refetchInterval: REFETCH_MS,
    staleTime: 60_000,
  });

  const weeklyQuery = useQuery({
    queryKey: ["weather", "analytics", "weekly", location],
    queryFn: () => weatherApi.getDaily(location, 7),
    enabled: Boolean(location.trim()) && range === "weekly",
    refetchInterval: REFETCH_MS,
    staleTime: 60_000,
  });

  const monthlyQuery = useQuery({
    queryKey: ["weather", "analytics", "monthly", location],
    queryFn: () => weatherApi.getDaily(location, 30),
    enabled: Boolean(location.trim()) && range === "monthly",
    refetchInterval: REFETCH_MS,
    staleTime: 60_000,
  });

  const active =
    range === "hourly" ? hourlyQuery : range === "weekly" ? weeklyQuery : monthlyQuery;

  return {
    ...active,
    units:
      hourlyQuery.data?.units ??
      weeklyQuery.data?.units ??
      monthlyQuery.data?.units ??
      "metric",
    locationMeta:
      hourlyQuery.data?.location ??
      weeklyQuery.data?.location ??
      monthlyQuery.data?.location ??
      null,
    hours: hourlyQuery.data?.hours ?? [],
    days: (range === "weekly" ? weeklyQuery.data?.days : monthlyQuery.data?.days) ?? [],
  };
}

function readMetricValue(
  point: NormalizedCondition | NormalizedDailyCondition,
  metric: ChartMetricId,
): { value: number | null; secondary?: number | null } {
  switch (metric) {
    case "temperature":
      if ("temperatureMax" in point) {
        return {
          value: point.temperature ?? point.temperatureMax,
          secondary: point.temperatureMax ?? null,
        };
      }
      return { value: point.temperature };
    case "feelsLike":
      if ("feelsLikeMax" in point) {
        return {
          value: point.feelsLike ?? point.feelsLikeMax,
          secondary: point.feelsLikeMax ?? null,
        };
      }
      return { value: point.feelsLike };
    case "humidity":
      return { value: point.humidity };
    case "wind":
      return { value: point.windSpeed, secondary: point.windGust };
    case "pressure":
      return { value: point.pressure };
    case "rain":
      return {
        value: point.precipProbability ?? point.precip,
        secondary: point.precip,
      };
    case "uv":
      return { value: point.uvIndex };
    case "cloudCover":
      return { value: point.cloudCover };
  }
}

export function buildChartPoints(
  range: ChartRange,
  metric: ChartMetricId,
  hours: NormalizedCondition[],
  days: NormalizedDailyCondition[],
  timezone: string | null,
): ChartPoint[] {
  if (range === "hourly") {
    return hours
      .map((hour) => {
        const { value, secondary } = readMetricValue(hour, metric);
        if (value === null || value === undefined || Number.isNaN(value)) return null;
        return {
          label: formatHourLabel(hour.datetime, hour.datetimeEpoch, timezone),
          value: Number(value),
          ...(secondary !== null && secondary !== undefined
            ? { secondary: Number(secondary) }
            : {}),
          rawLabel: hour.datetime ?? String(hour.datetimeEpoch),
        } satisfies ChartPoint;
      })
      .filter((item): item is ChartPoint => item !== null);
  }

  return days
    .map((day, index) => {
      const { value, secondary } = readMetricValue(day, metric);
      if (value === null || value === undefined || Number.isNaN(value)) return null;
      const date = day.datetime ? new Date(`${day.datetime}T12:00:00`) : null;
      let label = day.datetime ?? `D${index + 1}`;
      try {
        if (date) {
          label = new Intl.DateTimeFormat(undefined, {
            weekday: range === "weekly" ? "short" : undefined,
            month: range === "monthly" ? "short" : undefined,
            day: range === "monthly" ? "numeric" : undefined,
            timeZone: timezone || undefined,
          }).format(date);
        }
      } catch {
        // keep fallback label
      }

      return {
        label,
        value: Number(value),
        ...(secondary !== null && secondary !== undefined
          ? { secondary: Number(secondary) }
          : {}),
        rawLabel: day.datetime ?? label,
      } satisfies ChartPoint;
    })
    .filter((item): item is ChartPoint => item !== null);
}

const METRIC_LABEL_KEYS: Record<ChartMetricId, MessageKey> = {
  temperature: "metric.temperature",
  feelsLike: "metric.feelsLike",
  humidity: "metric.humidity",
  wind: "metric.wind",
  pressure: "metric.pressure",
  rain: "metric.rain",
  uv: "metric.uv",
  cloudCover: "metric.cloudCover",
};

const SECONDARY_LABEL_KEYS: Record<string, MessageKey> = {
  High: "common.high",
  Peak: "metric.peak",
  Gust: "metric.gust",
};

export function getMetricConfigs(
  units: string,
  temperatureUnit: "CELSIUS" | "FAHRENHEIT" = "CELSIUS",
  windSpeedUnit: "KMH" | "MPH" | "MS" = "KMH",
): MetricConfig[] {
  const tempUnit = temperatureUnit === "FAHRENHEIT" ? "°F" : "°C";
  const speedUnit =
    windSpeedUnit === "MPH" ? "mph" : windSpeedUnit === "MS" ? "m/s" : "km/h";
  const precipUnit = precipUnitLabel(units);

  return [
    { id: "temperature", label: "Temperature", color: "#f7921e", unit: tempUnit, secondaryLabel: "High" },
    { id: "feelsLike", label: "Feels Like", color: "#ffc06a", unit: tempUnit, secondaryLabel: "Peak" },
    { id: "humidity", label: "Humidity", color: "#4a9eff", unit: "%" },
    { id: "wind", label: "Wind", color: "#a3e635", unit: speedUnit, secondaryLabel: "Gust" },
    { id: "pressure", label: "Pressure", color: "#94a3b8", unit: "hPa" },
    { id: "rain", label: "Rain", color: "#38bdf8", unit: "%", secondaryLabel: precipUnit },
    { id: "uv", label: "UV", color: "#f59e0b", unit: "" },
    { id: "cloudCover", label: "Cloud Cover", color: "#7a8ba8", unit: "%" },
  ];
}

export function localizeMetricConfigs(
  configs: MetricConfig[],
  t: (key: MessageKey) => string,
): MetricConfig[] {
  return configs.map((config) => ({
    ...config,
    label: t(METRIC_LABEL_KEYS[config.id]),
    secondaryLabel: config.secondaryLabel
      ? SECONDARY_LABEL_KEYS[config.secondaryLabel]
        ? t(SECONDARY_LABEL_KEYS[config.secondaryLabel])
        : config.secondaryLabel
      : undefined,
  }));
}

export function summarizePoints(points: ChartPoint[], unit: string) {
  if (!points.length) {
    return {
      average: "—",
      highest: "—",
      lowest: "—",
      averageRaw: null as number | null,
      highestRaw: null as number | null,
      lowestRaw: null as number | null,
    };
  }

  const values = points.map((point) => point.value);
  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  const highest = Math.max(...values);
  const lowest = Math.min(...values);
  const suffix = unit;

  return {
    average: `${formatNumber(average, unit === "%" || unit === "hPa" ? 0 : 1)}${suffix}`,
    highest: `${formatNumber(highest, unit === "%" || unit === "hPa" ? 0 : 1)}${suffix}`,
    lowest: `${formatNumber(lowest, unit === "%" || unit === "hPa" ? 0 : 1)}${suffix}`,
    averageRaw: average,
    highestRaw: highest,
    lowestRaw: lowest,
  };
}

export function useChartSeries(
  location: string,
  range: ChartRange,
  metric: ChartMetricId,
) {
  const weather = useAnalyticsWeather(location, range);
  const { settings } = usePreferences();
  const { t } = useI18n();
  const temperatureUnit = settings?.temperatureUnit ?? "CELSIUS";
  const windSpeedUnit = settings?.windSpeedUnit ?? "KMH";
  const configs = useMemo(
    () =>
      localizeMetricConfigs(
        getMetricConfigs(weather.units, temperatureUnit, windSpeedUnit),
        t,
      ),
    [weather.units, temperatureUnit, windSpeedUnit, t],
  );
  const activeConfig = configs.find((item) => item.id === metric) ?? configs[0]!;

  const points = useMemo(() => {
    const raw = buildChartPoints(
      range,
      metric,
      weather.hours,
      weather.days,
      weather.locationMeta?.timezone ?? null,
    );
    if (metric === "temperature" || metric === "feelsLike") {
      return raw.map((point) => ({
        ...point,
        value: convertTemperature(point.value, weather.units, temperatureUnit) ?? point.value,
        secondary:
          point.secondary == null
            ? undefined
            : (convertTemperature(point.secondary, weather.units, temperatureUnit) ??
              point.secondary),
      }));
    }
    if (metric === "wind") {
      return raw.map((point) => ({
        ...point,
        value: convertWindSpeed(point.value, weather.units, windSpeedUnit) ?? point.value,
        secondary:
          point.secondary == null
            ? undefined
            : (convertWindSpeed(point.secondary, weather.units, windSpeedUnit) ?? point.secondary),
      }));
    }
    return raw;
  }, [
    range,
    metric,
    weather.hours,
    weather.days,
    weather.locationMeta?.timezone,
    weather.units,
    temperatureUnit,
    windSpeedUnit,
  ]);

  const summary = useMemo(
    () => summarizePoints(points, activeConfig.unit),
    [points, activeConfig.unit],
  );

  return {
    weather,
    configs,
    activeConfig,
    points,
    summary,
  };
}
