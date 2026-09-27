package com.weather.integration;

import java.io.IOException;
import java.util.Map;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import com.weather.config.AppProperties;
import com.weather.exception.ApiException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class OpenMeteoAirQualityClient {

  private static final Logger log = LoggerFactory.getLogger(OpenMeteoAirQualityClient.class);

  private static final String CURRENT_FIELDS = String.join(",", "european_aqi", "us_aqi", "pm10", "pm2_5",
      "carbon_monoxide", "nitrogen_dioxide", "sulphur_dioxide", "ozone");

  private record Key(double latitude, double longitude) {
  }

  private final UpstreamHttp http;
  private final String baseUrl;
  private final Cache<Key, Map<String, Object>> cache;

  public OpenMeteoAirQualityClient(UpstreamHttp http, AppProperties properties) {
    this.http = http;
    this.baseUrl = properties.weather().openMeteoAirQualityBaseUrl();
    this.cache = Caffeine.newBuilder()
        .maximumSize(1_000)
        .expireAfterWrite(properties.weather().forecastCacheTtl())
        .build();
  }

  public Map<String, Object> fetch(double latitude, double longitude) {
    Key key = new Key(latitude, longitude);
    Map<String, Object> hit = cache.getIfPresent(key);
    if (hit != null) {
      return hit;
    }

    Map<String, String> params = UpstreamHttp.params();
    params.put("latitude", Json.jsNumber(latitude));
    params.put("longitude", Json.jsNumber(longitude));
    params.put("current", CURRENT_FIELDS);
    params.put("timezone", "auto");

    UpstreamHttp.Response response;
    try {
      response = http.get(baseUrl + "?" + UpstreamHttp.query(params), Map.of("Accept", "application/json"));
    } catch (IOException exception) {
      log.error("Open-Meteo air quality request failed for {},{}", latitude, longitude, exception);
      throw new ApiException(502, "AIR_QUALITY_UPSTREAM_UNAVAILABLE", "Unable to reach the air quality provider.");
    }
    if (!response.ok()) {
      log.warn("Open-Meteo air quality returned {} for {},{}: {}", response.status(), latitude, longitude,
          OpenMeteoGeocodingClient.truncate(response.body(), 500));
      throw new ApiException(502, "AIR_QUALITY_UPSTREAM_ERROR", "Air quality provider returned an unexpected error.");
    }

    Map<String, Object> payload;
    try {
      payload = http.parseObject(response.body());
    } catch (RuntimeException exception) {
      throw new ApiException(502, "AIR_QUALITY_UPSTREAM_ERROR", "Air quality provider returned an unexpected error.");
    }
    cache.put(key, payload);
    return payload;
  }
}
