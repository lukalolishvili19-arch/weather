import { useMutation, useQuery } from "@tanstack/react-query";

import { weatherApi } from "../api/weather-api";
import {
  buildChartPoints,
  getMetricConfigs,
  useChartSeries,
  type ChartMetricId,
  type ChartRange,
} from "./use-analytics-charts";
import { usePeriodSummaries } from "./use-period-summaries";
import {
  buildAnalyticsReportDocument,
  buildWeatherReportDocument,
} from "../lib/export/build-reports";
import { exportDocument } from "../lib/export/export-document";
import type { ExportFormat, ExportReportKind } from "../lib/export/export-types";
import { getStoredWeatherLocation } from "../lib/location-storage";
import { usePreferences } from "../model/preferences-context";
import { convertTemperature, convertWindSpeed } from "../lib/units";

export function useExportData(location = getStoredWeatherLocation()) {
  const currentQuery = useQuery({
    queryKey: ["weather", "export", "current", location],
    queryFn: () => weatherApi.getCurrent(location),
    enabled: Boolean(location.trim()),
    staleTime: 60_000,
  });

  const dailyQuery = useQuery({
    queryKey: ["weather", "export", "daily", location],
    queryFn: () => weatherApi.getDaily(location, 30),
    enabled: Boolean(location.trim()),
    staleTime: 60_000,
  });

  const hourlyQuery = useQuery({
    queryKey: ["weather", "export", "hourly", location],
    queryFn: () => weatherApi.getHourly(location, { days: 2, hours: 24 }),
    enabled: Boolean(location.trim()),
    staleTime: 60_000,
  });

  const summaries = usePeriodSummaries(location);

  const locationLabel =
    currentQuery.data?.location.resolvedAddress ??
    dailyQuery.data?.location.resolvedAddress ??
    location;

  const isLoading =
    currentQuery.isLoading ||
    dailyQuery.isLoading ||
    hourlyQuery.isLoading ||
    summaries.isLoading;

  const isError =
    currentQuery.isError || dailyQuery.isError || hourlyQuery.isError || summaries.isError;

  return {
    location,
    locationLabel,
    current: currentQuery.data ?? null,
    daily: dailyQuery.data ?? null,
    hourly: hourlyQuery.data ?? null,
    weeklySummary: summaries.weeklySummary,
    monthlySummary: summaries.monthlySummary,
    units: currentQuery.data?.units ?? dailyQuery.data?.units ?? "metric",
    isLoading,
    isError,
    error: currentQuery.error ?? dailyQuery.error ?? hourlyQuery.error ?? summaries.error,
    refetch: async () => {
      await Promise.all([
        currentQuery.refetch(),
        dailyQuery.refetch(),
        hourlyQuery.refetch(),
        summaries.refetch(),
      ]);
    },
  };
}

export function useExportActions(location = getStoredWeatherLocation()) {
  const data = useExportData(location);
  const { settings } = usePreferences();
  const temperatureUnit = settings?.temperatureUnit ?? "CELSIUS";
  const windSpeedUnit = settings?.windSpeedUnit ?? "KMH";

  const exportMutation = useMutation({
    mutationFn: async (input: {
      kind: ExportReportKind;
      format: ExportFormat;
      range?: ChartRange;
      metric?: ChartMetricId;
    }) => {
      if (input.kind === "weather") {
        const document = buildWeatherReportDocument({
          locationLabel: data.locationLabel,
          current: data.current,
          daily: data.daily,
          weeklySummary: data.weeklySummary,
          monthlySummary: data.monthlySummary,
        });
        await exportDocument(document, input.format, `skycast-weather-${data.locationLabel}`);
        return;
      }

      const range = input.range ?? "weekly";
      const metricId = input.metric ?? "temperature";
      const sourceDays =
        range === "monthly"
          ? (data.daily?.days ?? [])
          : (data.daily?.days ?? []).slice(0, 7);
      const units = data.units;
      const configs = getMetricConfigs(units, temperatureUnit, windSpeedUnit);
      const metric = configs.find((item) => item.id === metricId) ?? configs[0]!;
      const timezone =
        data.hourly?.location.timezone ?? data.daily?.location.timezone ?? null;

      const rawPoints = buildChartPoints(
        range,
        metric.id,
        data.hourly?.hours ?? [],
        sourceDays,
        timezone,
      );
      const points =
        metric.id === "temperature" || metric.id === "feelsLike"
          ? rawPoints.map((point) => ({
              ...point,
              value: convertTemperature(point.value, units, temperatureUnit) ?? point.value,
              secondary:
                point.secondary == null
                  ? undefined
                  : (convertTemperature(point.secondary, units, temperatureUnit) ??
                    point.secondary),
            }))
          : metric.id === "wind"
            ? rawPoints.map((point) => ({
                ...point,
                value: convertWindSpeed(point.value, units, windSpeedUnit) ?? point.value,
                secondary:
                  point.secondary == null
                    ? undefined
                    : (convertWindSpeed(point.secondary, units, windSpeedUnit) ??
                      point.secondary),
              }))
            : rawPoints;

      const document = buildAnalyticsReportDocument({
        locationLabel: data.locationLabel,
        range,
        metric,
        points,
        units,
        weeklySummary: data.weeklySummary,
        monthlySummary: data.monthlySummary,
        hourly: data.hourly,
        daily: data.daily,
      });

      await exportDocument(
        document,
        input.format,
        `skycast-analytics-${range}-${metric.id}-${data.locationLabel}`,
      );
    },
  });

  return {
    ...data,
    exportReport: exportMutation.mutateAsync,
    isExporting: exportMutation.isPending,
    exportError: exportMutation.error,
  };
}

/** Quick export using the live analytics chart series. */
export function useAnalyticsQuickExport(
  location: string,
  range: ChartRange,
  metric: ChartMetricId,
) {
  const series = useChartSeries(location, range, metric);
  const summaries = usePeriodSummaries(location);

  return useMutation({
    mutationFn: async (format: ExportFormat) => {
      const units = series.weather.units ?? summaries.units;
      const document = buildAnalyticsReportDocument({
        locationLabel:
          series.weather.locationMeta?.resolvedAddress ??
          summaries.resolvedAddress ??
          location,
        range,
        metric: series.activeConfig,
        points: series.points,
        units,
        weeklySummary: summaries.weeklySummary,
        monthlySummary: summaries.monthlySummary,
        daily:
          range === "hourly"
            ? null
            : {
                source: "visual-crossing",
                units: units as "metric" | "us" | "uk" | "base",
                location: series.weather.locationMeta ?? {
                  query: location,
                  resolvedAddress: location,
                  latitude: null,
                  longitude: null,
                  timezone: null,
                  timezoneOffsetHours: null,
                },
                days: series.weather.days,
              },
      });
      await exportDocument(
        document,
        format,
        `skycast-analytics-${range}-${metric}-${location}`,
      );
    },
  });
}
