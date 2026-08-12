import { useQuery } from "@tanstack/react-query";

import { weatherApi } from "../api/weather-api";

const REFETCH_MS = 5 * 60 * 1_000;

export function useCurrentWeather(location: string) {
  return useQuery({
    queryKey: ["weather", "current", location],
    queryFn: () => weatherApi.getCurrent(location),
    enabled: Boolean(location.trim()),
    refetchInterval: REFETCH_MS,
    staleTime: 60_000,
  });
}

export function useDailyForecast(location: string, days = 7) {
  return useQuery({
    queryKey: ["weather", "daily", location, days],
    queryFn: () => weatherApi.getDaily(location, days),
    enabled: Boolean(location.trim()),
    refetchInterval: REFETCH_MS,
    staleTime: 60_000,
  });
}

export function useDashboardWeather(location: string) {
  const currentQuery = useCurrentWeather(location);
  const dailyQuery = useDailyForecast(location, 7);

  return {
    currentQuery,
    dailyQuery,
    isLoading: currentQuery.isLoading || dailyQuery.isLoading,
    isFetching: currentQuery.isFetching || dailyQuery.isFetching,
    isError: currentQuery.isError || dailyQuery.isError,
    error: currentQuery.error ?? dailyQuery.error,
    current: currentQuery.data?.current ?? null,
    locationMeta: currentQuery.data?.location ?? dailyQuery.data?.location ?? null,
    units: currentQuery.data?.units ?? dailyQuery.data?.units ?? "metric",
    today: dailyQuery.data?.days?.[0] ?? null,
    days: dailyQuery.data?.days ?? [],
    refetch: async () => {
      await Promise.all([currentQuery.refetch(), dailyQuery.refetch()]);
    },
  };
}
