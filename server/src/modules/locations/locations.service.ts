import { logger } from "../../config/logger.js";
import { ApiError } from "../../errors/api-error.js";
import type { LocationSuggestion } from "./popular-locations.js";
import { POPULAR_LOCATIONS } from "./popular-locations.js";
import type {
  AutocompleteQuery,
  ResolveLocationInput,
  SuggestionsQuery,
} from "./locations.schemas.js";

type OpenMeteoGeocodeResult = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  country_code?: string;
  admin1?: string;
  admin2?: string;
  timezone?: string;
};

type OpenMeteoGeocodeResponse = {
  results?: OpenMeteoGeocodeResult[];
};

type NominatimResult = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  type?: string;
  class?: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    state?: string;
    country?: string;
    country_code?: string;
  };
};

const OPEN_METEO_GEOCODE_BASE = "https://geocoding-api.open-meteo.com/v1/search";
const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";

export function parseCoordinates(input: string): { latitude: number; longitude: number } | null {
  const cleaned = input
    .trim()
    .replace(/°/g, "")
    .replace(/\s+/g, " ");

  const match =
    /^(-?\d+(?:\.\d+)?)\s*([NnSs])?\s*[,;\s]\s*(-?\d+(?:\.\d+)?)\s*([EeWw])?$/.exec(
      cleaned,
    );

  if (!match) return null;

  let latitude = Number(match[1]);
  let longitude = Number(match[3]);
  const latHemisphere = match[2]?.toUpperCase();
  const lonHemisphere = match[4]?.toUpperCase();

  if (latHemisphere === "S") latitude = -Math.abs(latitude);
  if (latHemisphere === "N") latitude = Math.abs(latitude);
  if (lonHemisphere === "W") longitude = -Math.abs(longitude);
  if (lonHemisphere === "E") longitude = Math.abs(longitude);

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return null;
  }

  return { latitude, longitude };
}

function buildWeatherQuery(name: string, admin1: string | null, country: string | null) {
  return [name, admin1, country].filter(Boolean).join(", ");
}

function fromOpenMeteo(result: OpenMeteoGeocodeResult): LocationSuggestion {
  const name = result.name;
  const country = result.country ?? null;
  const admin1 = result.admin1 ?? null;
  const weatherQuery = buildWeatherQuery(name, admin1, country);

  return {
    id: `om-${result.id}`,
    label: weatherQuery,
    name,
    country,
    admin1,
    latitude: result.latitude,
    longitude: result.longitude,
    type: "city",
    weatherQuery,
  };
}

function fromNominatim(result: NominatimResult): LocationSuggestion {
  const latitude = Number(result.lat);
  const longitude = Number(result.lon);
  const name =
    result.address?.city ||
    result.address?.town ||
    result.address?.village ||
    result.address?.municipality ||
    result.display_name.split(",")[0]?.trim() ||
    result.display_name;
  const country = result.address?.country ?? null;
  const admin1 = result.address?.state ?? null;
  const weatherQuery = buildWeatherQuery(name, admin1, country);

  return {
    id: String(result.place_id),
    label: result.display_name,
    name,
    country,
    admin1,
    latitude,
    longitude,
    type: result.type || result.class || "place",
    weatherQuery,
  };
}

function nearestPopular(latitude: number, longitude: number): LocationSuggestion | null {
  let best: LocationSuggestion | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const city of POPULAR_LOCATIONS) {
    const distance =
      Math.abs(city.latitude - latitude) + Math.abs(city.longitude - longitude);
    if (distance < bestDistance) {
      best = city;
      bestDistance = distance;
    }
  }

  return bestDistance < 1.5 ? best : null;
}

function syntheticFromCoordinates(latitude: number, longitude: number): LocationSuggestion {
  const nearby = nearestPopular(latitude, longitude);
  if (nearby) return nearby;

  const label = `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;
  return {
    id: `coords-${latitude.toFixed(4)}-${longitude.toFixed(4)}`,
    label,
    name: label,
    country: null,
    admin1: null,
    latitude,
    longitude,
    type: "coordinates",
    weatherQuery: label,
  };
}

async function openMeteoSearch(query: string, limit: number): Promise<LocationSuggestion[]> {
  const url = new URL(OPEN_METEO_GEOCODE_BASE);
  url.searchParams.set("name", query);
  url.searchParams.set("count", String(Math.min(Math.max(limit, 1), 20)));
  url.searchParams.set("language", "en");
  url.searchParams.set("format", "json");

  let response: Response;
  try {
    response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
    });
  } catch (error) {
    logger.error({ error, query }, "Open-Meteo geocoding failed");
    throw new ApiError(502, "GEOCODER_UNAVAILABLE", "Location search is temporarily unavailable.");
  }

  if (!response.ok) {
    const body = await response.text();
    logger.warn(
      { status: response.status, body: body.slice(0, 300), query },
      "Open-Meteo geocoding returned an error",
    );
    throw new ApiError(502, "GEOCODER_ERROR", "Location search provider returned an error.");
  }

  const payload = (await response.json()) as OpenMeteoGeocodeResponse;
  return (payload.results ?? []).map(fromOpenMeteo);
}

async function nominatimReverse(
  latitude: number,
  longitude: number,
): Promise<LocationSuggestion> {
  const url = new URL(`${NOMINATIM_BASE}/reverse`);
  url.searchParams.set("lat", String(latitude));
  url.searchParams.set("lon", String(longitude));
  url.searchParams.set("format", "json");
  url.searchParams.set("addressdetails", "1");

  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "SkyCastWeatherApp/1.0 (mailto:dev@skycast.local)",
        "Accept-Language": "en",
      },
    });
  } catch (error) {
    logger.warn({ error, latitude, longitude }, "Nominatim reverse failed; using fallback");
    return syntheticFromCoordinates(latitude, longitude);
  }

  if (!response.ok) {
    logger.warn(
      { status: response.status, latitude, longitude },
      "Nominatim reverse error; using fallback",
    );
    return syntheticFromCoordinates(latitude, longitude);
  }

  const result = (await response.json()) as NominatimResult & { error?: string };
  if (result.error || !result.lat) {
    return syntheticFromCoordinates(latitude, longitude);
  }

  return fromNominatim(result);
}

function filterPopular(query: string, limit: number): LocationSuggestion[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return POPULAR_LOCATIONS.slice(0, limit);
  return POPULAR_LOCATIONS.filter(
    (item) =>
      item.label.toLowerCase().includes(needle) ||
      item.name.toLowerCase().includes(needle) ||
      (item.country?.toLowerCase().includes(needle) ?? false) ||
      item.weatherQuery.toLowerCase().includes(needle),
  ).slice(0, limit);
}

function mergeSuggestions(
  primary: LocationSuggestion[],
  secondary: LocationSuggestion[],
  limit: number,
): LocationSuggestion[] {
  const merged = [...primary];
  for (const item of secondary) {
    if (
      !merged.some(
        (existing) =>
          existing.name.toLowerCase() === item.name.toLowerCase() ||
          (Math.abs(existing.latitude - item.latitude) < 0.05 &&
            Math.abs(existing.longitude - item.longitude) < 0.05),
      )
    ) {
      merged.push(item);
    }
  }
  return merged.slice(0, limit);
}

export const locationsService = {
  async autocomplete(query: AutocompleteQuery) {
    const coords = parseCoordinates(query.q);
    if (coords) {
      const resolved = await nominatimReverse(coords.latitude, coords.longitude);
      return { suggestions: [resolved] };
    }

    const popular = filterPopular(query.q, query.limit);

    try {
      const remote = await openMeteoSearch(query.q, query.limit);
      return { suggestions: mergeSuggestions(popular, remote, query.limit) };
    } catch (error) {
      logger.warn({ error, query: query.q }, "Remote geocoder failed; returning popular matches");
      if (popular.length > 0) {
        return { suggestions: popular };
      }
      throw error;
    }
  },

  async suggestions(query: SuggestionsQuery) {
    if (!query.q?.trim()) {
      return { suggestions: POPULAR_LOCATIONS.slice(0, query.limit) };
    }
    return this.autocomplete({ q: query.q, limit: query.limit });
  },

  async resolve(input: ResolveLocationInput) {
    if (input.latitude !== undefined && input.longitude !== undefined) {
      return nominatimReverse(input.latitude, input.longitude);
    }

    const q = input.q?.trim() ?? "";
    const coords = parseCoordinates(q);
    if (coords) {
      return nominatimReverse(coords.latitude, coords.longitude);
    }

    const popular = filterPopular(q, 1);
    if (popular[0] && popular[0].name.toLowerCase() === q.toLowerCase().split(",")[0]?.trim()) {
      return popular[0];
    }

    try {
      const remote = await openMeteoSearch(q, 1);
      if (remote[0]) return remote[0];
    } catch (error) {
      logger.warn({ error, q }, "Resolve via Open-Meteo failed");
    }

    if (popular[0]) return popular[0];

    throw new ApiError(404, "LOCATION_NOT_FOUND", `No location found for "${q}".`);
  },
};
