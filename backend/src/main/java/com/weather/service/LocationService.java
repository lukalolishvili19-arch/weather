package com.weather.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import com.weather.dto.LocationDtos.LocationSuggestion;
import com.weather.dto.LocationDtos.SuggestionsResult;
import com.weather.exception.ApiException;
import com.weather.integration.Json;
import com.weather.integration.NominatimClient;
import com.weather.integration.OpenMeteoGeocodingClient;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class LocationService {

  private static final Logger log = LoggerFactory.getLogger(LocationService.class);

  private static final Pattern COORDINATES = Pattern.compile(
      "^(-?\\d+(?:\\.\\d+)?)\\s*([NnSs])?\\s*[,;\\s]\\s*(-?\\d+(?:\\.\\d+)?)\\s*([EeWw])?$");

  public record Coordinates(double latitude, double longitude) {
  }

  private final OpenMeteoGeocodingClient geocoder;
  private final NominatimClient nominatim;

  public LocationService(OpenMeteoGeocodingClient geocoder, NominatimClient nominatim) {
    this.geocoder = geocoder;
    this.nominatim = nominatim;
  }

  public static Coordinates parseCoordinates(String input) {
    String cleaned = input.trim().replace("°", "").replaceAll("\\s+", " ");
    Matcher matcher = COORDINATES.matcher(cleaned);
    if (!matcher.matches()) {
      return null;
    }
    double latitude = Double.parseDouble(matcher.group(1));
    double longitude = Double.parseDouble(matcher.group(3));
    String latHemisphere = matcher.group(2) == null ? null : matcher.group(2).toUpperCase(Locale.ROOT);
    String lonHemisphere = matcher.group(4) == null ? null : matcher.group(4).toUpperCase(Locale.ROOT);

    if ("S".equals(latHemisphere)) latitude = -Math.abs(latitude);
    if ("N".equals(latHemisphere)) latitude = Math.abs(latitude);
    if ("W".equals(lonHemisphere)) longitude = -Math.abs(longitude);
    if ("E".equals(lonHemisphere)) longitude = Math.abs(longitude);

    if (!Double.isFinite(latitude) || !Double.isFinite(longitude)
        || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return null;
    }
    return new Coordinates(latitude, longitude);
  }

  public SuggestionsResult autocomplete(String q, int limit) {
    Coordinates coords = parseCoordinates(q);
    if (coords != null) {
      return new SuggestionsResult(List.of(reverse(coords.latitude(), coords.longitude())));
    }

    List<LocationSuggestion> popular = filterPopular(q, limit);
    try {
      List<LocationSuggestion> remote = geocoder.search(q, limit);
      return new SuggestionsResult(merge(popular, remote, limit));
    } catch (ApiException exception) {
      log.warn("Remote geocoder failed for {}; returning popular matches", q);
      if (!popular.isEmpty()) {
        return new SuggestionsResult(popular);
      }
      throw exception;
    }
  }

  public SuggestionsResult suggestions(String q, int limit) {
    if (q == null || q.isBlank()) {
      return new SuggestionsResult(PopularLocations.ALL.subList(0, Math.min(limit, PopularLocations.ALL.size())));
    }
    return autocomplete(q, limit);
  }

  public LocationSuggestion resolveCoordinates(double latitude, double longitude) {
    return reverse(latitude, longitude);
  }

  public LocationSuggestion resolveQuery(String rawQuery) {
    String q = rawQuery == null ? "" : rawQuery.trim();
    Coordinates coords = parseCoordinates(q);
    if (coords != null) {
      return reverse(coords.latitude(), coords.longitude());
    }

    List<LocationSuggestion> popular = filterPopular(q, 1);
    String firstPart = q.toLowerCase(Locale.ROOT).split(",", -1)[0].trim();
    if (!popular.isEmpty() && popular.get(0).name().toLowerCase(Locale.ROOT).equals(firstPart)) {
      return popular.get(0);
    }

    try {
      List<LocationSuggestion> remote = geocoder.search(q, 1);
      if (!remote.isEmpty()) {
        return remote.get(0);
      }
    } catch (ApiException exception) {
      log.warn("Resolve via Open-Meteo failed for {}", q);
    }

    if (!popular.isEmpty()) {
      return popular.get(0);
    }
    throw new ApiException(404, "LOCATION_NOT_FOUND", "No location found for \"" + q + "\".");
  }

  private LocationSuggestion reverse(double latitude, double longitude) {
    return nominatim.reverse(latitude, longitude).orElseGet(() -> syntheticFromCoordinates(latitude, longitude));
  }

  private static LocationSuggestion syntheticFromCoordinates(double latitude, double longitude) {
    LocationSuggestion nearby = nearestPopular(latitude, longitude);
    if (nearby != null) {
      return nearby;
    }
    String label = Json.toFixed(latitude, 2) + ", " + Json.toFixed(longitude, 2);
    return new LocationSuggestion("coords-" + Json.toFixed(latitude, 4) + "-" + Json.toFixed(longitude, 4),
        label, label, null, null, latitude, longitude, "coordinates", label);
  }

  private static LocationSuggestion nearestPopular(double latitude, double longitude) {
    LocationSuggestion best = null;
    double bestDistance = Double.POSITIVE_INFINITY;
    for (LocationSuggestion city : PopularLocations.ALL) {
      double distance = Math.abs(city.latitude() - latitude) + Math.abs(city.longitude() - longitude);
      if (distance < bestDistance) {
        best = city;
        bestDistance = distance;
      }
    }
    return bestDistance < 1.5 ? best : null;
  }

  private static List<LocationSuggestion> filterPopular(String query, int limit) {
    String needle = query.trim().toLowerCase(Locale.ROOT);
    if (needle.isEmpty()) {
      return PopularLocations.ALL.subList(0, Math.min(limit, PopularLocations.ALL.size()));
    }
    return PopularLocations.ALL.stream()
        .filter(item -> item.label().toLowerCase(Locale.ROOT).contains(needle)
            || item.name().toLowerCase(Locale.ROOT).contains(needle)
            || (item.country() != null && item.country().toLowerCase(Locale.ROOT).contains(needle))
            || item.weatherQuery().toLowerCase(Locale.ROOT).contains(needle))
        .limit(limit)
        .toList();
  }

  private static List<LocationSuggestion> merge(List<LocationSuggestion> primary, List<LocationSuggestion> secondary,
      int limit) {
    List<LocationSuggestion> merged = new ArrayList<>(primary);
    for (LocationSuggestion item : secondary) {
      boolean duplicate = merged.stream().anyMatch(existing ->
          existing.name().toLowerCase(Locale.ROOT).equals(item.name().toLowerCase(Locale.ROOT))
              || (Math.abs(existing.latitude() - item.latitude()) < 0.05
                  && Math.abs(existing.longitude() - item.longitude()) < 0.05));
      if (!duplicate) {
        merged.add(item);
      }
    }
    return merged.subList(0, Math.min(limit, merged.size()));
  }
}
