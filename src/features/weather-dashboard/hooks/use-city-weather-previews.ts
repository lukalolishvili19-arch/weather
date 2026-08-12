import { useQueries } from "@tanstack/react-query";

import { weatherApi } from "../api/weather-api";
import { formatNumber } from "../lib/weather-format";

export type CityPreviewInput = {
  id: string;
  name: string;
  country: string | null;
  label?: string;
  weatherQuery: string;
  emoji?: string;
};

export type CityWeatherPreview = CityPreviewInput & {
  temperature: string | null;
  conditions: string | null;
  humidity: string | null;
  isLoading: boolean;
  isError: boolean;
};

export function useCityWeatherPreviews(cities: CityPreviewInput[]) {
  const queries = useQueries({
    queries: cities.map((city) => ({
      queryKey: ["weather", "city-preview", city.weatherQuery] as const,
      queryFn: () => weatherApi.getCurrent(city.weatherQuery),
      staleTime: 5 * 60_000,
      gcTime: 30 * 60_000,
      retry: 1,
    })),
  });

  return cities.map((city, index) => {
    const query = queries[index];
    const current = query?.data?.current;
    return {
      ...city,
      temperature:
        current?.temperature == null ? null : `${formatNumber(current.temperature, 0)}°`,
      conditions: current?.conditions ?? null,
      humidity:
        current?.humidity == null ? null : `${formatNumber(current.humidity, 0)}%`,
      isLoading: Boolean(query?.isLoading || query?.isFetching),
      isError: Boolean(query?.isError),
    } satisfies CityWeatherPreview;
  });
}
