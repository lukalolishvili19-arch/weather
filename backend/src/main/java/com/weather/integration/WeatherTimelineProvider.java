package com.weather.integration;

import java.util.Map;
import java.util.Set;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import com.weather.config.AppProperties;
import com.weather.exception.ApiException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Visual Crossing when a key is configured, otherwise (or when VC is unreachable / rejects the key)
 * the Open-Meteo fallback. Successful payloads are cached briefly to reduce provider cost.
 */
@Component
public class WeatherTimelineProvider {

  private static final Logger log = LoggerFactory.getLogger(WeatherTimelineProvider.class);
  private static final Set<String> FALLBACK_CODES = Set.of("WEATHER_UPSTREAM_UNAUTHORIZED", "WEATHER_UPSTREAM_UNAVAILABLE");

  private record Key(String provider, TimelineQuery query) {
  }

  private final VisualCrossingClient visualCrossing;
  private final OpenMeteoForecastClient openMeteo;
  private final Cache<Key, Map<String, Object>> cache;

  public WeatherTimelineProvider(VisualCrossingClient visualCrossing, OpenMeteoForecastClient openMeteo,
      AppProperties properties) {
    this.visualCrossing = visualCrossing;
    this.openMeteo = openMeteo;
    this.cache = Caffeine.newBuilder()
        .maximumSize(1_000)
        .expireAfterWrite(properties.weather().forecastCacheTtl())
        .build();
  }

  public Map<String, Object> fetchTimeline(TimelineQuery query) {
    if (!visualCrossing.hasApiKey()) {
      log.debug("Using Open-Meteo weather fallback for {} (Visual Crossing key not configured)", query.location());
      return cached("open-meteo", query);
    }
    try {
      return cached("visual-crossing", query);
    } catch (ApiException exception) {
      if (FALLBACK_CODES.contains(exception.code())) {
        log.warn("Visual Crossing failed for {} ({}); falling back to Open-Meteo", query.location(), exception.code());
        return cached("open-meteo", query);
      }
      throw exception;
    }
  }

  private Map<String, Object> cached(String provider, TimelineQuery query) {
    Key key = new Key(provider, query);
    Map<String, Object> hit = cache.getIfPresent(key);
    if (hit != null) {
      return hit;
    }
    Map<String, Object> payload = "open-meteo".equals(provider)
        ? openMeteo.fetchTimeline(query)
        : visualCrossing.fetchTimeline(query);
    cache.put(key, payload);
    return payload;
  }
}
