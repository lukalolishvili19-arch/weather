import { useMemo } from "react";

import { useDailyForecast } from "./use-dashboard-weather";
import { getStoredWeatherLocation } from "../lib/location-storage";
import {
  averageScore,
  buildClothingSuggestions,
  buildPackingList,
  buildTravelPlans,
  buildWeatherInsights,
  pickBestTravelDay,
} from "../lib/travel-planner";

export function useTravelPlanner(location = getStoredWeatherLocation(), days = 14) {
  const forecast = useDailyForecast(location, days);

  const units = forecast.data?.units ?? "metric";
  const timezone = forecast.data?.location.timezone ?? null;
  const resolvedAddress =
    forecast.data?.location.resolvedAddress ?? location;

  const plans = useMemo(() => {
    if (!forecast.data?.days?.length) return [];
    return buildTravelPlans(forecast.data.days, units, timezone);
  }, [forecast.data, units, timezone]);

  const bestTravelDay = useMemo(() => pickBestTravelDay(plans), [plans]);
  const packing = useMemo(() => buildPackingList(plans, units), [plans, units]);
  const clothing = useMemo(() => buildClothingSuggestions(plans, units), [plans, units]);
  const insights = useMemo(
    () => buildWeatherInsights(plans, bestTravelDay, units),
    [plans, bestTravelDay, units],
  );

  const averages = useMemo(
    () => ({
      outdoor: averageScore(plans, "outdoorScore"),
      beach: averageScore(plans, "beachScore"),
      hiking: averageScore(plans, "hikingScore"),
      travel: averageScore(plans, "travelScore"),
    }),
    [plans],
  );

  return {
    forecast,
    units,
    timezone,
    resolvedAddress,
    plans,
    bestTravelDay,
    packing,
    clothing,
    insights,
    averages,
    isLoading: forecast.isLoading,
    isError: forecast.isError,
    error: forecast.error,
    refetch: () => forecast.refetch(),
  };
}
