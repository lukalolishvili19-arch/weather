import { useCallback, useMemo } from "react";

import { localeTag } from "../lib/i18n";
import { formatNumber } from "../lib/weather-format";
import {
  convertTemperature,
  convertWindSpeed,
  temperaturePreferenceLabel,
  windPreferenceLabel,
  type ApiUnitGroup,
} from "../lib/units";
import { usePreferences } from "../model/preferences-context";

/**
 * Maps API weather values into the user's preferred display units.
 * API data stays in whatever unit group the backend returned; conversion is client-side.
 */
export function useDisplayUnits(apiUnits?: ApiUnitGroup) {
  const { settings } = usePreferences();

  const temperatureUnit = settings?.temperatureUnit ?? "CELSIUS";
  const windSpeedUnit = settings?.windSpeedUnit ?? "KMH";
  const language = settings?.language ?? "en";
  const locale = localeTag(language);
  const hour12 = !(settings?.timeFormat24h ?? true);
  const showFeelsLike = settings?.showFeelsLike ?? true;
  const animateCharts = settings?.animateCharts ?? true;

  const tempUnit = temperaturePreferenceLabel(temperatureUnit);
  const speedUnit = windPreferenceLabel(windSpeedUnit);

  const toTemp = useCallback(
    (value: number | null | undefined) => convertTemperature(value, apiUnits, temperatureUnit),
    [apiUnits, temperatureUnit],
  );

  const toSpeed = useCallback(
    (value: number | null | undefined) => convertWindSpeed(value, apiUnits, windSpeedUnit),
    [apiUnits, windSpeedUnit],
  );

  const formatTemp = useCallback(
    (value: number | null | undefined, digits = 0) => formatNumber(toTemp(value), digits),
    [toTemp],
  );

  const formatSpeed = useCallback(
    (value: number | null | undefined, digits = 0) => formatNumber(toSpeed(value), digits),
    [toSpeed],
  );

  return useMemo(
    () => ({
      temperatureUnit,
      windSpeedUnit,
      language,
      locale,
      hour12,
      showFeelsLike,
      animateCharts,
      tempUnit,
      speedUnit,
      toTemp,
      toSpeed,
      formatTemp,
      formatSpeed,
    }),
    [
      temperatureUnit,
      windSpeedUnit,
      language,
      locale,
      hour12,
      showFeelsLike,
      animateCharts,
      tempUnit,
      speedUnit,
      toTemp,
      toSpeed,
      formatTemp,
      formatSpeed,
    ],
  );
}
