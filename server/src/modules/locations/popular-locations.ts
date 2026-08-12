export type LocationSuggestion = {
  id: string;
  label: string;
  name: string;
  country: string | null;
  admin1: string | null;
  latitude: number;
  longitude: number;
  type: string;
  weatherQuery: string;
};

function city(
  id: string,
  name: string,
  country: string,
  latitude: number,
  longitude: number,
  admin1: string | null = null,
): LocationSuggestion {
  const label = admin1 ? `${name}, ${admin1}, ${country}` : `${name}, ${country}`;
  return {
    id: `popular-${id}`,
    label,
    name,
    country,
    admin1,
    latitude,
    longitude,
    type: "city",
    weatherQuery: label,
  };
}

export const POPULAR_LOCATIONS: LocationSuggestion[] = [
  city("tbilisi", "Tbilisi", "Georgia", 41.7151, 44.8271),
  city("batumi", "Batumi", "Georgia", 41.6168, 41.6367),
  city("kutaisi", "Kutaisi", "Georgia", 42.2679, 42.6946),
  city("yerevan", "Yerevan", "Armenia", 40.1792, 44.4991),
  city("baku", "Baku", "Azerbaijan", 40.4093, 49.8671),
  city("istanbul", "Istanbul", "Turkey", 41.0082, 28.9784),
  city("ankara", "Ankara", "Turkey", 39.9334, 32.8597),
  city("london", "London", "United Kingdom", 51.5074, -0.1278, "England"),
  city("paris", "Paris", "France", 48.8566, 2.3522),
  city("berlin", "Berlin", "Germany", 52.52, 13.405),
  city("rome", "Rome", "Italy", 41.9028, 12.4964),
  city("madrid", "Madrid", "Spain", 40.4168, -3.7038),
  city("dubai", "Dubai", "United Arab Emirates", 25.2048, 55.2708),
  city("newyork", "New York", "United States", 40.7128, -74.006, "New York"),
  city("losangeles", "Los Angeles", "United States", 34.0522, -118.2437, "California"),
  city("tokyo", "Tokyo", "Japan", 35.6762, 139.6503),
  city("seoul", "Seoul", "South Korea", 37.5665, 126.978),
  city("singapore", "Singapore", "Singapore", 1.3521, 103.8198),
  city("sydney", "Sydney", "Australia", -33.8688, 151.2093),
  city("cairo", "Cairo", "Egypt", 30.0444, 31.2357),
  city("moscow", "Moscow", "Russia", 55.7558, 37.6173),
  city("kyiv", "Kyiv", "Ukraine", 50.4501, 30.5234),
  city("warsaw", "Warsaw", "Poland", 52.2297, 21.0122),
  city("athens", "Athens", "Greece", 37.9838, 23.7275),
];
