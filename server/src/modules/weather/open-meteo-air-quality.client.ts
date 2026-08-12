import { env } from "../../config/env.js";
import { logger } from "../../config/logger.js";
import { ApiError } from "../../errors/api-error.js";

export type OpenMeteoAirQualityCurrent = {
  time?: string;
  interval?: number;
  european_aqi?: number | null;
  us_aqi?: number | null;
  pm10?: number | null;
  pm2_5?: number | null;
  carbon_monoxide?: number | null;
  nitrogen_dioxide?: number | null;
  sulphur_dioxide?: number | null;
  ozone?: number | null;
};

export type OpenMeteoAirQualityResponse = {
  latitude: number;
  longitude: number;
  timezone?: string;
  elevation?: number;
  current?: OpenMeteoAirQualityCurrent;
};

const CURRENT_FIELDS = [
  "european_aqi",
  "us_aqi",
  "pm10",
  "pm2_5",
  "carbon_monoxide",
  "nitrogen_dioxide",
  "sulphur_dioxide",
  "ozone",
].join(",");

export async function fetchOpenMeteoAirQuality(
  latitude: number,
  longitude: number,
): Promise<OpenMeteoAirQualityResponse> {
  const url = new URL(env.openMeteoAirQualityBaseUrl);
  url.searchParams.set("latitude", String(latitude));
  url.searchParams.set("longitude", String(longitude));
  url.searchParams.set("current", CURRENT_FIELDS);
  url.searchParams.set("timezone", "auto");

  let response: Response;
  try {
    response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
    });
  } catch (error) {
    logger.error({ error, latitude, longitude }, "Open-Meteo air quality request failed");
    throw new ApiError(
      502,
      "AIR_QUALITY_UPSTREAM_UNAVAILABLE",
      "Unable to reach the air quality provider.",
    );
  }

  if (!response.ok) {
    const body = await response.text();
    logger.warn(
      { status: response.status, body: body.slice(0, 500), latitude, longitude },
      "Open-Meteo air quality returned an error",
    );
    throw new ApiError(
      502,
      "AIR_QUALITY_UPSTREAM_ERROR",
      "Air quality provider returned an unexpected error.",
    );
  }

  return (await response.json()) as OpenMeteoAirQualityResponse;
}
