import type {
  TemperatureUnitPreference,
  WindSpeedUnitPreference,
} from "../api/settings.types";

/** API `units` field: Visual Crossing / Open-Meteo style group. */
export type ApiUnitGroup = string | undefined;

function apiUsesFahrenheit(units: ApiUnitGroup): boolean {
  return units === "us";
}

function apiUsesMph(units: ApiUnitGroup): boolean {
  return units === "us" || units === "uk";
}

export function celsiusToFahrenheit(celsius: number): number {
  return (celsius * 9) / 5 + 32;
}

export function fahrenheitToCelsius(fahrenheit: number): number {
  return ((fahrenheit - 32) * 5) / 9;
}

export function kmhToMph(kmh: number): number {
  return kmh * 0.621371;
}

export function mphToKmh(mph: number): number {
  return mph / 0.621371;
}

export function kmhToMs(kmh: number): number {
  return kmh / 3.6;
}

export function mphToMs(mph: number): number {
  return mph * 0.44704;
}

/** Convert a temperature from API units into the user's preference. */
export function convertTemperature(
  value: number | null | undefined,
  apiUnits: ApiUnitGroup,
  preference: TemperatureUnitPreference = "CELSIUS",
): number | null {
  if (value === null || value === undefined || Number.isNaN(value)) return null;

  const apiIsF = apiUsesFahrenheit(apiUnits);
  const wantF = preference === "FAHRENHEIT";

  if (apiIsF === wantF) return value;
  return wantF ? celsiusToFahrenheit(value) : fahrenheitToCelsius(value);
}

/** Convert wind speed from API units into the user's preference. */
export function convertWindSpeed(
  value: number | null | undefined,
  apiUnits: ApiUnitGroup,
  preference: WindSpeedUnitPreference = "KMH",
): number | null {
  if (value === null || value === undefined || Number.isNaN(value)) return null;

  const apiIsMph = apiUsesMph(apiUnits);
  let kmh = apiIsMph ? mphToKmh(value) : value;

  if (preference === "KMH") return kmh;
  if (preference === "MPH") return kmhToMph(kmh);
  return kmhToMs(kmh);
}

export function temperaturePreferenceLabel(
  preference: TemperatureUnitPreference = "CELSIUS",
): "°C" | "°F" {
  return preference === "FAHRENHEIT" ? "°F" : "°C";
}

export function windPreferenceLabel(preference: WindSpeedUnitPreference = "KMH"): string {
  if (preference === "MPH") return "mph";
  if (preference === "MS") return "m/s";
  return "km/h";
}

export function languageDisplayName(code: string): string {
  const names: Record<string, string> = {
    en: "English",
    ka: "ქართული",
    ru: "Русский",
  };
  return names[code] ?? code;
}

export function themeDisplayName(theme: string, language: string): string {
  const map: Record<string, Record<string, string>> = {
    en: { DARK: "Dark mode", LIGHT: "Light mode", SYSTEM: "System" },
    ka: { DARK: "მუქი რეჟიმი", LIGHT: "ღია რეჟიმი", SYSTEM: "სისტემური" },
    ru: { DARK: "Тёмная тема", LIGHT: "Светлая тема", SYSTEM: "Системная" },
  };
  return map[language]?.[theme] ?? map.en?.[theme] ?? theme;
}
