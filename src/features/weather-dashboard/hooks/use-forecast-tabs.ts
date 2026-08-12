import { useQuery } from "@tanstack/react-query";

import { weatherApi } from "../api/weather-api";

export type ForecastTabId = "current" | "hours24" | "days7" | "days14" | "days30";

export const FORECAST_TABS: ReadonlyArray<{ id: ForecastTabId; label: string }> = [
  { id: "current", label: "Current" },
  { id: "hours24", label: "24 Hours" },
  { id: "days7", label: "7 Days" },
  { id: "days14", label: "14 Days" },
  { id: "days30", label: "30 Days" },
];

const REFETCH_MS = 5 * 60 * 1_000;

export function useForecastTabData(location: string, tab: ForecastTabId) {
  const enabled = Boolean(location.trim());

  const currentQuery = useQuery({
    queryKey: ["weather", "forecast-tab", "current", location],
    queryFn: () => weatherApi.getCurrent(location),
    enabled: enabled && tab === "current",
    refetchInterval: REFETCH_MS,
    staleTime: 60_000,
  });

  const hourlyQuery = useQuery({
    queryKey: ["weather", "forecast-tab", "hours24", location],
    queryFn: () => weatherApi.getHourly(location, { days: 2, hours: 24 }),
    enabled: enabled && tab === "hours24",
    refetchInterval: REFETCH_MS,
    staleTime: 60_000,
  });

  const days7Query = useQuery({
    queryKey: ["weather", "forecast-tab", "days7", location],
    queryFn: () => weatherApi.getDaily(location, 7),
    enabled: enabled && tab === "days7",
    refetchInterval: REFETCH_MS,
    staleTime: 60_000,
  });

  const days14Query = useQuery({
    queryKey: ["weather", "forecast-tab", "days14", location],
    queryFn: () => weatherApi.getDaily(location, 14),
    enabled: enabled && tab === "days14",
    refetchInterval: REFETCH_MS,
    staleTime: 60_000,
  });

  const days30Query = useQuery({
    queryKey: ["weather", "forecast-tab", "days30", location],
    queryFn: () => weatherApi.getDaily(location, 30),
    enabled: enabled && tab === "days30",
    refetchInterval: REFETCH_MS,
    staleTime: 60_000,
  });

  switch (tab) {
    case "current":
      return {
        tab,
        isLoading: currentQuery.isLoading,
        isFetching: currentQuery.isFetching,
        isError: currentQuery.isError,
        error: currentQuery.error,
        current: currentQuery.data?.current ?? null,
        hours: [],
        days: [],
        units: currentQuery.data?.units ?? "metric",
        locationMeta: currentQuery.data?.location ?? null,
        refetch: () => currentQuery.refetch(),
      };
    case "hours24":
      return {
        tab,
        isLoading: hourlyQuery.isLoading,
        isFetching: hourlyQuery.isFetching,
        isError: hourlyQuery.isError,
        error: hourlyQuery.error,
        current: null,
        hours: hourlyQuery.data?.hours ?? [],
        days: [],
        units: hourlyQuery.data?.units ?? "metric",
        locationMeta: hourlyQuery.data?.location ?? null,
        refetch: () => hourlyQuery.refetch(),
      };
    case "days7":
      return {
        tab,
        isLoading: days7Query.isLoading,
        isFetching: days7Query.isFetching,
        isError: days7Query.isError,
        error: days7Query.error,
        current: null,
        hours: [],
        days: days7Query.data?.days ?? [],
        units: days7Query.data?.units ?? "metric",
        locationMeta: days7Query.data?.location ?? null,
        refetch: () => days7Query.refetch(),
      };
    case "days14":
      return {
        tab,
        isLoading: days14Query.isLoading,
        isFetching: days14Query.isFetching,
        isError: days14Query.isError,
        error: days14Query.error,
        current: null,
        hours: [],
        days: days14Query.data?.days ?? [],
        units: days14Query.data?.units ?? "metric",
        locationMeta: days14Query.data?.location ?? null,
        refetch: () => days14Query.refetch(),
      };
    case "days30":
      return {
        tab,
        isLoading: days30Query.isLoading,
        isFetching: days30Query.isFetching,
        isError: days30Query.isError,
        error: days30Query.error,
        current: null,
        hours: [],
        days: days30Query.data?.days ?? [],
        units: days30Query.data?.units ?? "metric",
        locationMeta: days30Query.data?.location ?? null,
        refetch: () => days30Query.refetch(),
      };
  }
}
