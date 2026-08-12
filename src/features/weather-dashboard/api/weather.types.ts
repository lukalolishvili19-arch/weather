export type WeatherUnits = "metric" | "us" | "uk" | "base";

export type NormalizedLocation = {
  query: string;
  resolvedAddress: string;
  latitude: number | null;
  longitude: number | null;
  timezone: string | null;
  timezoneOffsetHours: number | null;
};

export type NormalizedCondition = {
  datetime: string | null;
  datetimeEpoch: number | null;
  temperature: number | null;
  feelsLike: number | null;
  humidity: number | null;
  dewPoint: number | null;
  precip: number | null;
  precipProbability: number | null;
  precipType: string[];
  snow: number | null;
  snowDepth: number | null;
  windSpeed: number | null;
  windGust: number | null;
  windDirection: number | null;
  pressure: number | null;
  cloudCover: number | null;
  visibility: number | null;
  uvIndex: number | null;
  conditions: string | null;
  icon: string | null;
  solarRadiation: number | null;
};

export type NormalizedDailyCondition = NormalizedCondition & {
  temperatureMax: number | null;
  temperatureMin: number | null;
  feelsLikeMax: number | null;
  feelsLikeMin: number | null;
  sunrise: string | null;
  sunset: string | null;
  description: string | null;
};

export type CurrentWeatherResponse = {
  source: "visual-crossing";
  units: WeatherUnits;
  location: NormalizedLocation;
  current: NormalizedCondition | null;
};

export type HourlyForecastResponse = {
  source: "visual-crossing";
  units: WeatherUnits;
  location: NormalizedLocation;
  hours: NormalizedCondition[];
};

export type DailyForecastResponse = {
  source: "visual-crossing";
  units: WeatherUnits;
  location: NormalizedLocation;
  days: NormalizedDailyCondition[];
};

export type ApiSuccess<T> = {
  data: T;
};

export type AirQualityCategoryLevel =
  | "Good"
  | "Moderate"
  | "Unhealthy for Sensitive Groups"
  | "Unhealthy"
  | "Very Unhealthy"
  | "Hazardous"
  | "Unknown";

export type AirQualityCategory = {
  level: AirQualityCategoryLevel;
  color: string;
  description: string;
};

export type AirQualityPollutant = {
  id: "pm25" | "pm10" | "no2" | "o3" | "co" | "so2";
  label: string;
  value: number | null;
  unit: string;
  limit: number;
  percent: number | null;
  color: string;
  description: string;
};

export type HealthRecommendation = AirQualityCategory & {
  summary: string;
  tips: string[];
  outdoorActivity: string;
  sensitiveGroups: string;
  windows: string;
  maskSuggested: boolean;
};

export type AirQualityResponse = {
  source: "open-meteo";
  location: NormalizedLocation;
  observedAt: string | null;
  aqi: number | null;
  europeanAqi: number | null;
  category: AirQualityCategory;
  pollutants: AirQualityPollutant[];
  health: HealthRecommendation;
};

export type WeatherMapLayerId =
  | "temperature"
  | "rain"
  | "wind"
  | "pressure"
  | "clouds";

export type WeatherMapConfigResponse = {
  overlaysEnabled: boolean;
  tileUrlTemplate: string | null;
  layers: Array<{
    id: WeatherMapLayerId;
    label: string;
    owmLayer: string;
    color: string;
  }>;
};

export type NormalizedAlert = {
  id: string | null;
  event: string | null;
  headline: string | null;
  description: string | null;
  severity: string | null;
  onset: string | null;
  ends: string | null;
  link: string | null;
};

export type AlertCategoryId =
  | "storm"
  | "snow"
  | "heat"
  | "flood"
  | "wind"
  | "heavy-rain";

export type AlertSeverity = "none" | "low" | "medium" | "high" | "extreme";

export type AlertCategoryCard = {
  id: AlertCategoryId;
  label: string;
  emoji: string;
  color: string;
  gradient: string;
  severity: AlertSeverity;
  active: boolean;
  title: string;
  description: string;
  issued: string | null;
  expires: string | null;
  area: string | null;
  tips: string[];
  source: "official" | "forecast" | "clear";
  metrics: Array<{ label: string; value: string }>;
};

export type WeatherAlertsResponse = {
  source: "visual-crossing";
  units: WeatherUnits;
  location: NormalizedLocation;
  alerts: NormalizedAlert[];
  categories: AlertCategoryCard[];
  activeCount: number;
};
