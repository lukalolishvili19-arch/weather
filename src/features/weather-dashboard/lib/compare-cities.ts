export type CompareCity = {
  id: string;
  name: string;
  country: string;
  weatherQuery: string;
  color: string;
};

const CITY_COLORS = [
  "#f7921e",
  "#4a9eff",
  "#a3e635",
  "#f59e0b",
  "#a855f7",
  "#22c55e",
  "#38bdf8",
  "#ef4444",
  "#e879f9",
  "#94a3b8",
  "#fb7185",
  "#2dd4bf",
];

function withColor(
  index: number,
  city: Omit<CompareCity, "color">,
): CompareCity {
  return {
    ...city,
    color: CITY_COLORS[index % CITY_COLORS.length] ?? "#f7921e",
  };
}

export const COMPARE_CITY_CATALOG: CompareCity[] = [
  { id: "tbilisi", name: "Tbilisi", country: "Georgia", weatherQuery: "Tbilisi, Georgia" },
  { id: "batumi", name: "Batumi", country: "Georgia", weatherQuery: "Batumi, Georgia" },
  { id: "kutaisi", name: "Kutaisi", country: "Georgia", weatherQuery: "Kutaisi, Georgia" },
  { id: "yerevan", name: "Yerevan", country: "Armenia", weatherQuery: "Yerevan, Armenia" },
  { id: "baku", name: "Baku", country: "Azerbaijan", weatherQuery: "Baku, Azerbaijan" },
  { id: "istanbul", name: "Istanbul", country: "Turkey", weatherQuery: "Istanbul, Turkey" },
  { id: "trabzon", name: "Trabzon", country: "Turkey", weatherQuery: "Trabzon, Turkey" },
  { id: "sochi", name: "Sochi", country: "Russia", weatherQuery: "Sochi, Russia" },
  { id: "moscow", name: "Moscow", country: "Russia", weatherQuery: "Moscow, Russia" },
  { id: "dubai", name: "Dubai", country: "UAE", weatherQuery: "Dubai, United Arab Emirates" },
  { id: "paris", name: "Paris", country: "France", weatherQuery: "Paris, France" },
  { id: "london", name: "London", country: "UK", weatherQuery: "London, United Kingdom" },
].map((city, index) => withColor(index, city));

export const DEFAULT_COMPARE_CITY_IDS = ["tbilisi", "yerevan", "baku", "istanbul"];

export const MAX_COMPARE_CITIES = 6;

export type CompareMetricId =
  | "temperature"
  | "humidity"
  | "wind"
  | "pressure"
  | "aqi";

export const COMPARE_METRICS: Array<{
  id: CompareMetricId;
  label: string;
  shortLabel: string;
  color: string;
  unit: (units: string) => string;
}> = [
  {
    id: "temperature",
    label: "Temperature",
    shortLabel: "Temp",
    color: "#f7921e",
    unit: (units) => (units === "us" ? "°F" : "°C"),
  },
  {
    id: "humidity",
    label: "Humidity",
    shortLabel: "Humidity",
    color: "#38bdf8",
    unit: () => "%",
  },
  {
    id: "wind",
    label: "Wind",
    shortLabel: "Wind",
    color: "#a3e635",
    unit: (units) => (units === "us" || units === "uk" ? "mph" : "km/h"),
  },
  {
    id: "pressure",
    label: "Pressure",
    shortLabel: "Pressure",
    color: "#94a3b8",
    unit: () => "hPa",
  },
  {
    id: "aqi",
    label: "AQI",
    shortLabel: "AQI",
    color: "#f59e0b",
    unit: () => "",
  },
];

const STORAGE_KEY = "skycast.compareCityIds";

export function getStoredCompareCityIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_COMPARE_CITY_IDS;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return DEFAULT_COMPARE_CITY_IDS;
    const ids = parsed
      .filter((value): value is string => typeof value === "string")
      .filter((id) => COMPARE_CITY_CATALOG.some((city) => city.id === id))
      .slice(0, MAX_COMPARE_CITIES);
    return ids.length ? ids : DEFAULT_COMPARE_CITY_IDS;
  } catch {
    return DEFAULT_COMPARE_CITY_IDS;
  }
}

export function setStoredCompareCityIds(ids: string[]) {
  const unique = [...new Set(ids)].slice(0, MAX_COMPARE_CITIES);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(unique));
}

export function resolveCompareCities(ids: string[]): CompareCity[] {
  return ids
    .map((id) => COMPARE_CITY_CATALOG.find((city) => city.id === id))
    .filter((city): city is CompareCity => Boolean(city));
}
