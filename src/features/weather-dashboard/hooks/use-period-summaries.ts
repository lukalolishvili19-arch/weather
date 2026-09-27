import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { weatherApi } from "../api/weather-api";
import { getStoredWeatherLocation } from "../lib/location-storage";
import {
  calculatePeriodSummary,
  formatSummaryRows,
  type PeriodWeatherSummary,
} from "../lib/weather-summary";
import { usePreferences } from "../model/preferences-context";

const REFETCH_MS = 5 * 60 * 1_000;

export function usePeriodSummaries(location = getStoredWeatherLocation()) {
  const { settings } = usePreferences();
  const temperatureUnit = settings?.temperatureUnit ?? "CELSIUS";
  const windSpeedUnit = settings?.windSpeedUnit ?? "KMH";

  const weeklyQuery = useQuery({
    queryKey: ["weather", "summary", "weekly", location],
    queryFn: () => weatherApi.getDaily(location, 7),
    enabled: Boolean(location.trim()),
    refetchInterval: REFETCH_MS,
    staleTime: 60_000,
  });

  const monthlyQuery = useQuery({
    queryKey: ["weather", "summary", "monthly", location],
    queryFn: () => weatherApi.getDaily(location, 30),
    enabled: Boolean(location.trim()),
    refetchInterval: REFETCH_MS,
    staleTime: 60_000,
  });

  const units = weeklyQuery.data?.units ?? monthlyQuery.data?.units ?? "metric";
  const timezone =
    weeklyQuery.data?.location?.timezone ?? monthlyQuery.data?.location?.timezone ?? null;
  const resolvedAddress =
    weeklyQuery.data?.location?.resolvedAddress ??
    monthlyQuery.data?.location?.resolvedAddress ??
    location;

  const weeklySummary = useMemo<PeriodWeatherSummary | null>(() => {
    if (!weeklyQuery.data?.days?.length) return null;
    return calculatePeriodSummary(
      weeklyQuery.data.days,
      "weekly",
      units,
      timezone,
      temperatureUnit,
      windSpeedUnit,
    );
  }, [weeklyQuery.data, units, timezone, temperatureUnit, windSpeedUnit]);

  const monthlySummary = useMemo<PeriodWeatherSummary | null>(() => {
    if (!monthlyQuery.data?.days?.length) return null;
    return calculatePeriodSummary(
      monthlyQuery.data.days,
      "monthly",
      units,
      timezone,
      temperatureUnit,
      windSpeedUnit,
    );
  }, [monthlyQuery.data, units, timezone, temperatureUnit, windSpeedUnit]);

  const weeklyRows = useMemo(
    () =>
      weeklySummary
        ? formatSummaryRows(weeklySummary, units, temperatureUnit, windSpeedUnit)
        : [],
    [weeklySummary, units, temperatureUnit, windSpeedUnit],
  );

  const monthlyRows = useMemo(
    () =>
      monthlySummary
        ? formatSummaryRows(monthlySummary, units, temperatureUnit, windSpeedUnit)
        : [],
    [monthlySummary, units, temperatureUnit, windSpeedUnit],
  );

  return {
    units,
    temperatureUnit,
    timezone,
    resolvedAddress,
    weeklyQuery,
    monthlyQuery,
    weeklySummary,
    monthlySummary,
    weeklyRows,
    monthlyRows,
    isLoading: weeklyQuery.isLoading || monthlyQuery.isLoading,
    isError: weeklyQuery.isError || monthlyQuery.isError,
    error: weeklyQuery.error ?? monthlyQuery.error,
    refetch: async () => {
      await Promise.all([weeklyQuery.refetch(), monthlyQuery.refetch()]);
    },
  };
}
