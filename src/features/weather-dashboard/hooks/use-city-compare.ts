import { useQueries } from "@tanstack/react-query";
import { useMemo } from "react";

import { weatherApi } from "../api/weather-api";
import {
  COMPARE_METRICS,
  resolveCompareCities,
  type CompareMetricId,
} from "../lib/compare-cities";
import { formatNumber, weatherIconToEmoji } from "../lib/weather-format";

const REFETCH_MS = 5 * 60 * 1_000;

export type CompareCityRow = {
  id: string;
  name: string;
  country: string;
  color: string;
  weatherQuery: string;
  isLoading: boolean;
  isError: boolean;
  temperature: number | null;
  humidity: number | null;
  windSpeed: number | null;
  pressure: number | null;
  aqi: number | null;
  aqiLevel: string | null;
  conditions: string | null;
  emoji: string;
  units: string;
};

function metricValue(row: CompareCityRow, metric: CompareMetricId): number | null {
  switch (metric) {
    case "temperature":
      return row.temperature;
    case "humidity":
      return row.humidity;
    case "wind":
      return row.windSpeed;
    case "pressure":
      return row.pressure;
    case "aqi":
      return row.aqi;
  }
}

export function useCityCompare(cityIds: string[]) {
  const cities = useMemo(() => resolveCompareCities(cityIds), [cityIds]);

  const weatherQueries = useQueries({
    queries: cities.map((city) => ({
      queryKey: ["weather", "compare", "current", city.id, city.weatherQuery],
      queryFn: () => weatherApi.getCurrent(city.weatherQuery),
      enabled: Boolean(city.weatherQuery),
      refetchInterval: REFETCH_MS,
      staleTime: 60_000,
    })),
  });

  const aqiQueries = useQueries({
    queries: cities.map((city) => ({
      queryKey: ["weather", "compare", "aqi", city.id, city.weatherQuery],
      queryFn: () => weatherApi.getAirQuality(city.weatherQuery),
      enabled: Boolean(city.weatherQuery),
      refetchInterval: 10 * 60_000,
      staleTime: 2 * 60_000,
    })),
  });

  const rows = useMemo<CompareCityRow[]>(() => {
    return cities.map((city, index) => {
      const weatherQuery = weatherQueries[index];
      const aqiQuery = aqiQueries[index];
      const current = weatherQuery?.data?.current;
      const aqi = aqiQuery?.data;

      return {
        id: city.id,
        name: city.name,
        country: city.country,
        color: city.color,
        weatherQuery: city.weatherQuery,
        isLoading: Boolean(weatherQuery?.isLoading || aqiQuery?.isLoading),
        isError: Boolean(weatherQuery?.isError || aqiQuery?.isError),
        temperature: current?.temperature ?? null,
        humidity: current?.humidity ?? null,
        windSpeed: current?.windSpeed ?? null,
        pressure: current?.pressure ?? null,
        aqi: aqi?.aqi ?? null,
        aqiLevel: aqi?.category.level ?? null,
        conditions: current?.conditions ?? null,
        emoji: weatherIconToEmoji(current?.icon),
        units: weatherQuery?.data?.units ?? "metric",
      };
    });
  }, [cities, weatherQueries, aqiQueries]);

  const units = rows.find((row) => row.units)?.units ?? "metric";

  const chartData = useMemo(() => {
    return rows.map((row) => ({
      id: row.id,
      city: row.name,
      fill: row.color,
      temperature: row.temperature,
      humidity: row.humidity,
      wind: row.windSpeed,
      pressure: row.pressure,
      aqi: row.aqi,
    }));
  }, [rows]);

  const overviewData = useMemo(() => {
    return COMPARE_METRICS.map((metric) => {
      const values = rows
        .map((row) => metricValue(row, metric.id))
        .filter((value): value is number => typeof value === "number" && Number.isFinite(value));
      const max = Math.max(...values, 1);
      const entry: Record<string, string | number | null> = {
        metric: metric.shortLabel,
        metricId: metric.id,
      };
      for (const row of rows) {
        const value = metricValue(row, metric.id);
        entry[row.id] =
          value == null ? null : Math.round((Math.abs(value) / max) * 100);
      }
      return entry;
    });
  }, [rows]);

  const leaders = useMemo(() => {
    const result: Partial<Record<CompareMetricId, CompareCityRow | null>> = {};
    for (const metric of COMPARE_METRICS) {
      let best: CompareCityRow | null = null;
      let bestValue = Number.NEGATIVE_INFINITY;
      for (const row of rows) {
        const value = metricValue(row, metric.id);
        if (value == null || !Number.isFinite(value)) continue;
        // For AQI lower is better; for others show highest as "leader" except we still show max for comparison "hottest/windiest"
        const score = metric.id === "aqi" ? -value : value;
        if (score > bestValue) {
          bestValue = score;
          best = row;
        }
      }
      result[metric.id] = best;
    }
    return result;
  }, [rows]);

  return {
    cities,
    rows,
    chartData,
    overviewData,
    leaders,
    units,
    isLoading: rows.some((row) => row.isLoading),
    isFetching: weatherQueries.some((query) => query.isFetching),
    formatMetricValue: (metric: CompareMetricId, value: number | null) => {
      if (value == null) return "—";
      const meta = COMPARE_METRICS.find((item) => item.id === metric);
      const unit = meta?.unit(units) ?? "";
      const digits = metric === "humidity" || metric === "aqi" || metric === "pressure" ? 0 : metric === "temperature" ? 0 : 0;
      return `${formatNumber(value, digits)}${unit ? (unit.startsWith("°") ? unit : ` ${unit}`) : ""}`;
    },
    refetch: async () => {
      await Promise.all([
        ...weatherQueries.map((query) => query.refetch()),
        ...aqiQueries.map((query) => query.refetch()),
      ]);
    },
  };
}
