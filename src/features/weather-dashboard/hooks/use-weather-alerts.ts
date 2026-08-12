import { useQuery } from "@tanstack/react-query";

import { weatherApi } from "../api/weather-api";
import { getStoredWeatherLocation } from "../lib/location-storage";

const REFETCH_MS = 5 * 60 * 1_000;

export function useWeatherAlerts(location = getStoredWeatherLocation()) {
  return useQuery({
    queryKey: ["weather", "alerts", location],
    queryFn: () => weatherApi.getAlerts(location),
    enabled: Boolean(location.trim()),
    refetchInterval: REFETCH_MS,
    staleTime: 60_000,
  });
}
