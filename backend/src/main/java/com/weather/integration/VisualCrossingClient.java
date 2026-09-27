package com.weather.integration;

import java.io.IOException;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import com.weather.config.AppProperties;
import com.weather.exception.ApiException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class VisualCrossingClient {

  private static final Logger log = LoggerFactory.getLogger(VisualCrossingClient.class);

  private static final List<String> PLACEHOLDER_KEYS =
      List.of("your-visual-crossing-api-key", "changeme", "replace-me", "todo", "none");

  private final UpstreamHttp http;
  private final AppProperties.Weather config;

  public VisualCrossingClient(UpstreamHttp http, AppProperties properties) {
    this.http = http;
    this.config = properties.weather();
  }

  public boolean hasApiKey() {
    String key = config.visualCrossingApiKey().trim().toLowerCase(Locale.ROOT);
    return !key.isEmpty() && !PLACEHOLDER_KEYS.contains(key);
  }

  public String unitGroup() {
    return config.visualCrossingUnitGroup();
  }

  public Map<String, Object> fetchTimeline(TimelineQuery query) {
    UpstreamHttp.Response response;
    try {
      response = http.get(buildUrl(query), Map.of("Accept", "application/json"));
    } catch (IOException exception) {
      log.error("Visual Crossing request failed for {}", query.location(), exception);
      throw new ApiException(502, "WEATHER_UPSTREAM_UNAVAILABLE", "Unable to reach the Visual Crossing Weather API.");
    }

    if (!response.ok()) {
      String body = response.body() == null ? "" : response.body();
      log.warn("Visual Crossing returned {} for {}: {}", response.status(), query.location(),
          OpenMeteoGeocodingClient.truncate(body, 500));
      switch (response.status()) {
        case 401, 403 -> throw new ApiException(502, "WEATHER_UPSTREAM_UNAUTHORIZED",
            "Visual Crossing API key is missing or invalid.");
        case 429 -> throw new ApiException(429, "WEATHER_RATE_LIMITED",
            "Visual Crossing rate limit exceeded. Try again later.");
        case 400 -> throw new ApiException(400, "WEATHER_BAD_REQUEST",
            body.isEmpty() ? "Invalid weather request." : body);
        default -> throw new ApiException(502, "WEATHER_UPSTREAM_ERROR",
            "Visual Crossing Weather API returned an unexpected error.");
      }
    }

    try {
      return http.parseObject(response.body());
    } catch (RuntimeException exception) {
      log.warn("Visual Crossing returned invalid JSON for {}", query.location());
      throw new ApiException(502, "WEATHER_UPSTREAM_ERROR",
          "Visual Crossing Weather API returned an unexpected error.");
    }
  }

  private String buildUrl(TimelineQuery query) {
    StringBuilder url = new StringBuilder(config.visualCrossingBaseUrl())
        .append('/').append(UpstreamHttp.encodePathSegment(query.location().trim()));
    if (query.startDate() != null && !query.startDate().isEmpty()) {
      url.append('/').append(UpstreamHttp.encodePathSegment(query.startDate()));
    }
    if (query.endDate() != null && !query.endDate().isEmpty()) {
      url.append('/').append(UpstreamHttp.encodePathSegment(query.endDate()));
    }

    Map<String, String> params = UpstreamHttp.params();
    params.put("key", config.visualCrossingApiKey());
    params.put("unitGroup", config.visualCrossingUnitGroup());
    params.put("contentType", "json");
    if (!query.include().isEmpty()) {
      params.put("include", String.join(",", query.include()));
    }
    if (!query.elements().isEmpty()) {
      params.put("elements", String.join(",", query.elements()));
    }
    return url.append('?').append(UpstreamHttp.query(params)).toString();
  }
}
