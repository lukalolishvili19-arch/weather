package com.weather.integration;

import java.io.IOException;
import java.util.Map;
import java.util.Optional;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import com.weather.config.AppProperties;
import com.weather.dto.LocationDtos.LocationSuggestion;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/** Reverse geocoding. Returns empty on any provider failure so callers can fall back. */
@Component
public class NominatimClient {

  private static final Logger log = LoggerFactory.getLogger(NominatimClient.class);

  private static final Map<String, String> HEADERS = Map.of(
      "Accept", "application/json",
      "User-Agent", "SkyCastWeatherApp/1.0 (mailto:dev@skycast.local)",
      "Accept-Language", "en");

  private record Key(double latitude, double longitude) {
  }

  private final UpstreamHttp http;
  private final String baseUrl;
  private final Cache<Key, LocationSuggestion> cache;

  public NominatimClient(UpstreamHttp http, AppProperties properties) {
    this.http = http;
    this.baseUrl = properties.weather().nominatimBaseUrl();
    this.cache = Caffeine.newBuilder()
        .maximumSize(2_000)
        .expireAfterWrite(properties.weather().geocodingCacheTtl())
        .build();
  }

  public Optional<LocationSuggestion> reverse(double latitude, double longitude) {
    Key key = new Key(latitude, longitude);
    LocationSuggestion cached = cache.getIfPresent(key);
    if (cached != null) {
      return Optional.of(cached);
    }
    Optional<LocationSuggestion> result = fetch(latitude, longitude);
    result.ifPresent(value -> cache.put(key, value));
    return result;
  }

  private Optional<LocationSuggestion> fetch(double latitude, double longitude) {
    Map<String, String> params = UpstreamHttp.params();
    params.put("lat", Json.jsNumber(latitude));
    params.put("lon", Json.jsNumber(longitude));
    params.put("format", "json");
    params.put("addressdetails", "1");

    UpstreamHttp.Response response;
    try {
      response = http.get(baseUrl + "/reverse?" + UpstreamHttp.query(params), HEADERS);
    } catch (IOException exception) {
      log.warn("Nominatim reverse failed for {},{}; using fallback", latitude, longitude, exception);
      return Optional.empty();
    }
    if (!response.ok()) {
      log.warn("Nominatim reverse returned {} for {},{}; using fallback", response.status(), latitude, longitude);
      return Optional.empty();
    }

    Map<String, Object> result;
    try {
      result = http.parseObject(response.body());
    } catch (RuntimeException exception) {
      log.warn("Nominatim returned invalid JSON for {},{}; using fallback", latitude, longitude);
      return Optional.empty();
    }
    if (truthy(result.get("error")) || !truthy(result.get("lat"))) {
      return Optional.empty();
    }
    return Optional.ofNullable(fromNominatim(result));
  }

  private static LocationSuggestion fromNominatim(Map<String, Object> result) {
    double lat = toNumber(result.get("lat"));
    double lon = toNumber(result.get("lon"));
    String displayName = result.get("display_name") instanceof String text ? text : "";
    Map<String, Object> address = Json.obj(result.get("address"));

    String name = firstTruthy(
        Json.str(Json.get(address, "city")),
        Json.str(Json.get(address, "town")),
        Json.str(Json.get(address, "village")),
        Json.str(Json.get(address, "municipality")),
        displayName.split(",", -1)[0].trim(),
        displayName);
    String country = Json.get(address, "country") instanceof String text ? text : null;
    String admin1 = Json.get(address, "state") instanceof String text ? text : null;
    String weatherQuery = OpenMeteoGeocodingClient.buildWeatherQuery(name, admin1, country);
    String type = firstTruthy(Json.str(result.get("type")), Json.str(result.get("class")), "place");
    Number placeId = Json.num(result.get("place_id"));
    String id = placeId == null ? String.valueOf(result.get("place_id")) : Json.jsNumber(placeId.doubleValue());

    return new LocationSuggestion(id, displayName, name, country, admin1, lat, lon, type, weatherQuery);
  }

  private static double toNumber(Object value) {
    if (value instanceof Number number) {
      return number.doubleValue();
    }
    try {
      return Double.parseDouble(String.valueOf(value).trim());
    } catch (NumberFormatException exception) {
      return Double.NaN;
    }
  }

  private static String firstTruthy(String... values) {
    for (String value : values) {
      if (value != null && !value.isEmpty()) {
        return value;
      }
    }
    return values[values.length - 1];
  }

  private static boolean truthy(Object value) {
    if (value == null || Boolean.FALSE.equals(value)) {
      return false;
    }
    if (value instanceof String text) {
      return !text.isEmpty();
    }
    if (value instanceof Number number) {
      return number.doubleValue() != 0 && !Double.isNaN(number.doubleValue());
    }
    return true;
  }
}
