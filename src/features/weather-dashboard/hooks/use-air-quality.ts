import { useQuery } from "@tanstack/react-query";

import { weatherApi } from "../api/weather-api";
import { getStoredWeatherLocation } from "../lib/location-storage";

const REFETCH_MS = 10 * 60 * 1_000;

export function useAirQuality(location = getStoredWeatherLocation()) {
  return useQuery({
    queryKey: ["weather", "air-quality", location],
    queryFn: () => weatherApi.getAirQuality(location),
    enabled: Boolean(location.trim()),
    refetchInterval: REFETCH_MS,
    staleTime: 2 * 60_000,
  });
}
