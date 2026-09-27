package com.weather.integration;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import com.weather.config.AppProperties;
import com.weather.dto.LocationDtos.LocationSuggestion;
import com.weather.exception.ApiException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class OpenMeteoGeocodingClient {

  private static final Logger log = LoggerFactory.getLogger(OpenMeteoGeocodingClient.class);

  private record Key(String query, int count) {
  }

  private final UpstreamHttp http;
  private final String baseUrl;
  private final Cache<Key, List<LocationSuggestion>> cache;

  public OpenMeteoGeocodingClient(UpstreamHttp http, AppProperties properties) {
    this.http = http;
    this.baseUrl = properties.weather().openMeteoGeocodingBaseUrl();
    this.cache = Caffeine.newBuilder()
        .maximumSize(2_000)
        .expireAfterWrite(properties.weather().geocodingCacheTtl())
        .build();
  }

  public List<LocationSuggestion> search(String query, int limit) {
    Key key = new Key(query, Math.min(Math.max(limit, 1), 20));
    List<LocationSuggestion> cached = cache.getIfPresent(key);
    if (cached != null) {
      return cached;
    }
    List<LocationSuggestion> results = fetch(key);
    cache.put(key, results);
    return results;
  }

  private List<LocationSuggestion> fetch(Key key) {
    Map<String, String> params = UpstreamHttp.params();
    params.put("name", key.query());
    params.put("count", String.valueOf(key.count()));
    params.put("language", "en");
    params.put("format", "json");

    UpstreamHttp.Response response;
    try {
      response = http.get(baseUrl + "?" + UpstreamHttp.query(params), Map.of("Accept", "application/json"));
    } catch (IOException exception) {
      log.error("Open-Meteo geocoding failed for query {}", key.query(), exception);
      throw new ApiException(502, "GEOCODER_UNAVAILABLE", "Location search is temporarily unavailable.");
    }
    if (!response.ok()) {
      log.warn("Open-Meteo geocoding returned {} for query {}: {}", response.status(), key.query(),
          truncate(response.body(), 300));
      throw new ApiException(502, "GEOCODER_ERROR", "Location search provider returned an error.");
    }

    Map<String, Object> payload;
    try {
      payload = http.parseObject(response.body());
    } catch (RuntimeException exception) {
      log.warn("Open-Meteo geocoding returned invalid JSON for query {}", key.query());
      throw new ApiException(502, "GEOCODER_ERROR", "Location search provider returned an error.");
    }
    List<Object> results = Json.list(payload.get("results"));
    if (results == null) {
      return List.of();
    }
    List<LocationSuggestion> suggestions = new ArrayList<>();
    for (Object item : results) {
      LocationSuggestion suggestion = fromOpenMeteo(Json.obj(item));
      if (suggestion != null) {
        suggestions.add(suggestion);
      }
    }
    return List.copyOf(suggestions);
  }

  private static LocationSuggestion fromOpenMeteo(Map<String, Object> result) {
    if (result == null) {
      return null;
    }
    Double latitude = Json.dbl(result.get("latitude"));
    Double longitude = Json.dbl(result.get("longitude"));
    Object name = result.get("name");
    if (latitude == null || longitude == null || !(name instanceof String)) {
      return null;
    }
    String country = result.get("country") instanceof String text ? text : null;
    String admin1 = result.get("admin1") instanceof String text ? text : null;
    String weatherQuery = buildWeatherQuery((String) name, admin1, country);
    Number id = Json.num(result.get("id"));
    return new LocationSuggestion(
        "om-" + (id == null ? String.valueOf(result.get("id")) : Json.jsNumber(id.doubleValue())),
        weatherQuery, (String) name, country, admin1, latitude, longitude, "city", weatherQuery);
  }

  static String buildWeatherQuery(String name, String admin1, String country) {
    return Stream.of(name, admin1, country)
        .filter(Objects::nonNull)
        .filter(part -> !part.isEmpty())
        .collect(Collectors.joining(", "));
  }

  static String truncate(String value, int max) {
    return value == null || value.length() <= max ? value : value.substring(0, max);
  }
}
