export type MapCity = {
  id: string;
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  weatherQuery: string;
};

/** Regional + popular cities used as interactive map markers. */
export const MAP_MARKER_CITIES: MapCity[] = [
  {
    id: "tbilisi",
    name: "Tbilisi",
    country: "Georgia",
    latitude: 41.7151,
    longitude: 44.8271,
    weatherQuery: "Tbilisi, Georgia",
  },
  {
    id: "batumi",
    name: "Batumi",
    country: "Georgia",
    latitude: 41.6168,
    longitude: 41.6367,
    weatherQuery: "Batumi, Georgia",
  },
  {
    id: "kutaisi",
    name: "Kutaisi",
    country: "Georgia",
    latitude: 42.2679,
    longitude: 42.6946,
    weatherQuery: "Kutaisi, Georgia",
  },
  {
    id: "rustavi",
    name: "Rustavi",
    country: "Georgia",
    latitude: 41.5495,
    longitude: 44.9932,
    weatherQuery: "Rustavi, Georgia",
  },
  {
    id: "gori",
    name: "Gori",
    country: "Georgia",
    latitude: 41.9842,
    longitude: 44.1158,
    weatherQuery: "Gori, Georgia",
  },
  {
    id: "yerevan",
    name: "Yerevan",
    country: "Armenia",
    latitude: 40.1792,
    longitude: 44.4991,
    weatherQuery: "Yerevan, Armenia",
  },
  {
    id: "baku",
    name: "Baku",
    country: "Azerbaijan",
    latitude: 40.4093,
    longitude: 49.8671,
    weatherQuery: "Baku, Azerbaijan",
  },
  {
    id: "istanbul",
    name: "Istanbul",
    country: "Turkey",
    latitude: 41.0082,
    longitude: 28.9784,
    weatherQuery: "Istanbul, Turkey",
  },
  {
    id: "trabzon",
    name: "Trabzon",
    country: "Turkey",
    latitude: 41.0027,
    longitude: 39.7168,
    weatherQuery: "Trabzon, Turkey",
  },
  {
    id: "sochi",
    name: "Sochi",
    country: "Russia",
    latitude: 43.6028,
    longitude: 39.7342,
    weatherQuery: "Sochi, Russia",
  },
];

export const MAP_DEFAULT_CENTER: [number, number] = [41.7, 44.8];
export const MAP_DEFAULT_ZOOM = 6;

export type WeatherMapLayerId =
  | "temperature"
  | "rain"
  | "wind"
  | "pressure"
  | "clouds";

export const WEATHER_MAP_LAYERS: Array<{
  id: WeatherMapLayerId;
  label: string;
  color: string;
  owmLayer: string;
  legend: Array<{ color: string; label: string }>;
}> = [
  {
    id: "temperature",
    label: "Temp",
    color: "#f7921e",
    owmLayer: "temp_new",
    legend: [
      { color: "#4a9eff", label: "<8°" },
      { color: "#22c55e", label: "16°" },
      { color: "#f59e0b", label: "24°" },
      { color: "#f7921e", label: "32°" },
      { color: "#ef4444", label: "38°+" },
    ],
  },
  {
    id: "rain",
    label: "Rain",
    color: "#4a9eff",
    owmLayer: "precipitation_new",
    legend: [
      { color: "#1e3a5f", label: "Dry" },
      { color: "#3b82f6", label: "Light" },
      { color: "#60a5fa", label: "Mod" },
      { color: "#93c5fd", label: "Heavy" },
      { color: "#e0f2fe", label: "Storm" },
    ],
  },
  {
    id: "wind",
    label: "Wind",
    color: "#a3e635",
    owmLayer: "wind_new",
    legend: [
      { color: "#365314", label: "Calm" },
      { color: "#65a30d", label: "Breezy" },
      { color: "#a3e635", label: "Windy" },
      { color: "#d9f99d", label: "Strong" },
      { color: "#fefce8", label: "Gale" },
    ],
  },
  {
    id: "pressure",
    label: "Pressure",
    color: "#7a8ba8",
    owmLayer: "pressure_new",
    legend: [
      { color: "#7c3aed", label: "Low" },
      { color: "#4a9eff", label: "1010" },
      { color: "#22c55e", label: "1015" },
      { color: "#f59e0b", label: "1020" },
      { color: "#ef4444", label: "High" },
    ],
  },
  {
    id: "clouds",
    label: "Clouds",
    color: "#94a3b8",
    owmLayer: "clouds_new",
    legend: [
      { color: "#0f172a", label: "Clear" },
      { color: "#334155", label: "25%" },
      { color: "#64748b", label: "50%" },
      { color: "#94a3b8", label: "75%" },
      { color: "#e2e8f0", label: "Overcast" },
    ],
  },
];
