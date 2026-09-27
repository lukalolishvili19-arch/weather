import { useQueries, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { weatherApi } from "../api/weather-api";
import type { CurrentWeatherResponse } from "../api/weather.types";
import {
  MAP_MARKER_CITIES,
  type MapCity,
  type WeatherMapLayerId,
} from "../lib/map-cities";
import {
  convertTemperature,
  convertWindSpeed,
  temperaturePreferenceLabel,
  windPreferenceLabel,
} from "../lib/units";
import {
  formatNumber,
  precipUnitLabel,
  weatherIconToEmoji,
} from "../lib/weather-format";
import { usePreferences } from "../model/preferences-context";

const REFETCH_MS = 5 * 60 * 1_000;

export type MapMarkerPoint = MapCity & {
  weather: CurrentWeatherResponse | undefined;
  isLoading: boolean;
  isError: boolean;
  temperature: number | null;
  rainChance: number | null;
  precip: number | null;
  windSpeed: number | null;
  pressure: number | null;
  cloudCover: number | null;
  conditions: string | null;
  icon: string | null;
  emoji: string;
  displayValue: string;
  markerColor: string;
};

function layerColor(layer: WeatherMapLayerId, point: Omit<MapMarkerPoint, "displayValue" | "markerColor" | "emoji">): string {
  switch (layer) {
    case "temperature": {
      const t = point.temperature;
      if (t == null) return "#7a8ba8";
      if (t >= 38) return "#ef4444";
      if (t >= 32) return "#f97316";
      if (t >= 24) return "#f7921e";
      if (t >= 16) return "#f59e0b";
      if (t >= 8) return "#22c55e";
      return "#4a9eff";
    }
    case "rain": {
      const rain = point.rainChance ?? 0;
      if (rain >= 70) return "#93c5fd";
      if (rain >= 40) return "#60a5fa";
      if (rain >= 20) return "#3b82f6";
      if (rain > 0) return "#1d4ed8";
      return "#1e3a5f";
    }
    case "wind": {
      const wind = point.windSpeed ?? 0;
      if (wind >= 50) return "#fefce8";
      if (wind >= 35) return "#d9f99d";
      if (wind >= 20) return "#a3e635";
      if (wind >= 10) return "#65a30d";
      return "#365314";
    }
    case "pressure": {
      const p = point.pressure;
      if (p == null) return "#7a8ba8";
      if (p < 1005) return "#7c3aed";
      if (p < 1012) return "#4a9eff";
      if (p < 1018) return "#22c55e";
      if (p < 1025) return "#f59e0b";
      return "#ef4444";
    }
    case "clouds": {
      const c = point.cloudCover ?? 0;
      if (c >= 85) return "#e2e8f0";
      if (c >= 60) return "#94a3b8";
      if (c >= 35) return "#64748b";
      if (c >= 15) return "#334155";
      return "#0f172a";
    }
  }
}

function layerDisplay(
  layer: WeatherMapLayerId,
  point: Omit<MapMarkerPoint, "displayValue" | "markerColor" | "emoji">,
  units: string,
  temperatureUnit: "CELSIUS" | "FAHRENHEIT",
  windSpeedUnit: "KMH" | "MPH" | "MS",
): string {
  switch (layer) {
    case "temperature":
      return point.temperature == null
        ? "—"
        : `${formatNumber(convertTemperature(point.temperature, units, temperatureUnit), 0)}${temperaturePreferenceLabel(temperatureUnit)}`;
    case "rain":
      return point.rainChance == null ? "—" : `${formatNumber(point.rainChance, 0)}%`;
    case "wind":
      return point.windSpeed == null
        ? "—"
        : `${formatNumber(convertWindSpeed(point.windSpeed, units, windSpeedUnit), 0)} ${windPreferenceLabel(windSpeedUnit)}`;
    case "pressure":
      return point.pressure == null ? "—" : `${formatNumber(point.pressure, 0)}`;
    case "clouds":
      return point.cloudCover == null ? "—" : `${formatNumber(point.cloudCover, 0)}%`;
  }
}

export function useMapWeather(layer: WeatherMapLayerId) {
  const { settings } = usePreferences();
  const temperatureUnit = settings?.temperatureUnit ?? "CELSIUS";
  const windSpeedUnit = settings?.windSpeedUnit ?? "KMH";

  const mapConfigQuery = useQuery({
    queryKey: ["weather", "map-config"],
    queryFn: () => weatherApi.getMapConfig(),
    staleTime: 30 * 60_000,
  });

  const cityQueries = useQueries({
    queries: MAP_MARKER_CITIES.map((city) => ({
      queryKey: ["weather", "map-point", city.id, city.weatherQuery],
      queryFn: () => weatherApi.getCurrent(city.weatherQuery),
      refetchInterval: REFETCH_MS,
      staleTime: 60_000,
    })),
  });

  const units =
    cityQueries.find((query) => query.data?.units)?.data?.units ?? "metric";

  const points = useMemo<MapMarkerPoint[]>(() => {
    return MAP_MARKER_CITIES.map((city, index) => {
      const query = cityQueries[index];
      const weather = query?.data;
      const current = weather?.current;
      const base = {
        ...city,
        weather,
        isLoading: query?.isLoading ?? false,
        isError: query?.isError ?? false,
        temperature: current?.temperature ?? null,
        rainChance: current?.precipProbability ?? null,
        precip: current?.precip ?? null,
        windSpeed: current?.windSpeed ?? null,
        pressure: current?.pressure ?? null,
        cloudCover: current?.cloudCover ?? null,
        conditions: current?.conditions ?? null,
        icon: current?.icon ?? null,
      };
      return {
        ...base,
        emoji: weatherIconToEmoji(current?.icon),
        displayValue: layerDisplay(layer, base, units, temperatureUnit, windSpeedUnit),
        markerColor: layerColor(layer, base),
      };
    });
  }, [cityQueries, layer, units, temperatureUnit, windSpeedUnit]);

  const isLoading = cityQueries.some((query) => query.isLoading);
  const isFetching = cityQueries.some((query) => query.isFetching);

  return {
    points,
    units,
    precipUnit: precipUnitLabel(units),
    speedUnit: windPreferenceLabel(windSpeedUnit),
    tempUnit: temperaturePreferenceLabel(temperatureUnit),
    mapConfig: mapConfigQuery.data ?? null,
    overlaysEnabled: mapConfigQuery.data?.overlaysEnabled ?? false,
    tileUrlTemplate: mapConfigQuery.data?.tileUrlTemplate ?? null,
    isLoading,
    isFetching,
    mapConfigLoading: mapConfigQuery.isLoading,
    refetch: async () => {
      await Promise.all([
        mapConfigQuery.refetch(),
        ...cityQueries.map((query) => query.refetch()),
      ]);
    },
  };
}
