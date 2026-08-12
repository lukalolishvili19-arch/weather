import { env } from "../../config/env.js";
import { logger } from "../../config/logger.js";
import { ApiError } from "../../errors/api-error.js";
import {
  fetchOpenMeteoTimeline,
  hasVisualCrossingApiKey,
  type TimelineQuery,
} from "./open-meteo-forecast.client.js";
import type { VisualCrossingTimelineResponse } from "./visual-crossing.types.js";

export type { TimelineQuery };

function buildTimelineUrl(query: TimelineQuery): URL {
  const segments = [encodeURIComponent(query.location.trim())];

  if (query.startDate) {
    segments.push(encodeURIComponent(query.startDate));
  }
  if (query.endDate) {
    segments.push(encodeURIComponent(query.endDate));
  }

  const url = new URL(`${env.visualCrossingBaseUrl}/${segments.join("/")}`);
  url.searchParams.set("key", env.visualCrossingApiKey);
  url.searchParams.set("unitGroup", env.visualCrossingUnitGroup);
  url.searchParams.set("contentType", "json");

  if (query.include?.length) {
    url.searchParams.set("include", query.include.join(","));
  }
  if (query.elements?.length) {
    url.searchParams.set("elements", query.elements.join(","));
  }

  return url;
}

async function fetchVisualCrossingTimeline(
  query: TimelineQuery,
): Promise<VisualCrossingTimelineResponse> {
  const url = buildTimelineUrl(query);

  let response: Response;
  try {
    response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });
  } catch (error) {
    logger.error({ error, location: query.location }, "Visual Crossing request failed");
    throw new ApiError(
      502,
      "WEATHER_UPSTREAM_UNAVAILABLE",
      "Unable to reach the Visual Crossing Weather API.",
    );
  }

  if (!response.ok) {
    const body = await response.text();
    logger.warn(
      {
        status: response.status,
        body: body.slice(0, 500),
        location: query.location,
      },
      "Visual Crossing returned an error",
    );

    if (response.status === 401 || response.status === 403) {
      throw new ApiError(
        502,
        "WEATHER_UPSTREAM_UNAUTHORIZED",
        "Visual Crossing API key is missing or invalid.",
      );
    }

    if (response.status === 429) {
      throw new ApiError(
        429,
        "WEATHER_RATE_LIMITED",
        "Visual Crossing rate limit exceeded. Try again later.",
      );
    }

    if (response.status === 400) {
      throw new ApiError(
        400,
        "WEATHER_BAD_REQUEST",
        body || "Invalid weather request.",
      );
    }

    throw new ApiError(
      502,
      "WEATHER_UPSTREAM_ERROR",
      "Visual Crossing Weather API returned an unexpected error.",
    );
  }

  return (await response.json()) as VisualCrossingTimelineResponse;
}

export async function fetchTimeline(
  query: TimelineQuery,
): Promise<VisualCrossingTimelineResponse> {
  if (!hasVisualCrossingApiKey()) {
    logger.info(
      { location: query.location },
      "Using Open-Meteo weather fallback (Visual Crossing key not configured)",
    );
    return fetchOpenMeteoTimeline(query);
  }

  try {
    return await fetchVisualCrossingTimeline(query);
  } catch (error) {
    if (
      error instanceof ApiError &&
      (error.code === "WEATHER_UPSTREAM_UNAUTHORIZED" ||
        error.code === "WEATHER_UPSTREAM_UNAVAILABLE")
    ) {
      logger.warn(
        { location: query.location, code: error.code },
        "Visual Crossing failed; falling back to Open-Meteo",
      );
      return fetchOpenMeteoTimeline(query);
    }
    throw error;
  }
}
