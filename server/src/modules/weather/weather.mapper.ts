import type { WeatherUnits } from "./weather.types.js";
import type {
  NormalizedAlert,
  NormalizedCondition,
  NormalizedDailyCondition,
  NormalizedHourlyCondition,
  NormalizedLocation,
} from "./weather.types.js";
import type {
  VisualCrossingAlert,
  VisualCrossingCondition,
  VisualCrossingTimelineResponse,
} from "./visual-crossing.types.js";

function asNumber(value: number | null | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asString(value: string | null | undefined): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

export function mapLocation(
  query: string,
  payload: VisualCrossingTimelineResponse,
): NormalizedLocation {
  return {
    query,
    resolvedAddress: asString(payload.resolvedAddress) ?? asString(payload.address) ?? query,
    latitude: asNumber(payload.latitude),
    longitude: asNumber(payload.longitude),
    timezone: asString(payload.timezone),
    timezoneOffsetHours: asNumber(payload.tzoffset),
  };
}

export function mapCondition(
  condition: VisualCrossingCondition | null | undefined,
): NormalizedCondition | null {
  if (!condition) return null;

  return {
    datetime: asString(condition.datetime),
    datetimeEpoch: asNumber(condition.datetimeEpoch),
    temperature: asNumber(condition.temp),
    feelsLike: asNumber(condition.feelslike),
    humidity: asNumber(condition.humidity),
    dewPoint: asNumber(condition.dew),
    precip: asNumber(condition.precip),
    precipProbability: asNumber(condition.precipprob),
    precipType: Array.isArray(condition.preciptype) ? condition.preciptype : [],
    snow: asNumber(condition.snow),
    snowDepth: asNumber(condition.snowdepth),
    windSpeed: asNumber(condition.windspeed),
    windGust: asNumber(condition.windgust),
    windDirection: asNumber(condition.winddir),
    pressure: asNumber(condition.pressure),
    cloudCover: asNumber(condition.cloudcover),
    visibility: asNumber(condition.visibility),
    uvIndex: asNumber(condition.uvindex),
    conditions: asString(condition.conditions),
    icon: asString(condition.icon),
    solarRadiation: asNumber(condition.solarradiation),
  };
}

export function mapHourly(
  condition: VisualCrossingCondition,
): NormalizedHourlyCondition {
  const mapped = mapCondition(condition);
  if (!mapped) {
    throw new Error("Failed to map hourly condition");
  }
  return mapped;
}

export function mapDaily(
  condition: VisualCrossingCondition,
  includeHours = false,
): NormalizedDailyCondition {
  const base = mapCondition(condition);
  if (!base) {
    throw new Error("Failed to map daily condition");
  }

  return {
    ...base,
    temperatureMax: asNumber(condition.tempmax),
    temperatureMin: asNumber(condition.tempmin),
    feelsLikeMax: asNumber(condition.feelslikemax),
    feelsLikeMin: asNumber(condition.feelslikemin),
    sunrise: asString(condition.sunrise),
    sunset: asString(condition.sunset),
    description: asString(condition.description),
    hours: includeHours
      ? (condition.hours ?? []).map((hour) => mapHourly(hour))
      : [],
  };
}

export function mapAlert(alert: VisualCrossingAlert): NormalizedAlert {
  return {
    id: asString(alert.id),
    event: asString(alert.event),
    headline: asString(alert.headline),
    description: asString(alert.description),
    severity: asString(alert.severity),
    onset: asString(alert.onset),
    ends: asString(alert.ends),
    link: asString(alert.link),
  };
}

export function mapEnvelope(
  query: string,
  units: WeatherUnits,
  payload: VisualCrossingTimelineResponse,
) {
  return {
    source: "visual-crossing" as const,
    units,
    location: mapLocation(query, payload),
  };
}
