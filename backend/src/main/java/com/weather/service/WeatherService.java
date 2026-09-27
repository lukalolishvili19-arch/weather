package com.weather.service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import com.weather.config.AppProperties;
import com.weather.dto.LocationDtos.LocationSuggestion;
import com.weather.exception.ApiException;
import com.weather.integration.Json;
import com.weather.integration.OpenMeteoAirQualityClient;
import com.weather.integration.TimelineQuery;
import com.weather.integration.WeatherTimelineProvider;
import com.weather.mapper.AirQualityMapper;
import com.weather.mapper.AlertCategoriesMapper;
import com.weather.mapper.WeatherMapper;

import org.springframework.stereotype.Service;

@Service
public class WeatherService {

  private static final List<Map<String, String>> MAP_LAYERS = List.of(
      layer("temperature", "Temperature", "temp_new", "#f7921e"),
      layer("rain", "Rain", "precipitation_new", "#4a9eff"),
      layer("wind", "Wind", "wind_new", "#a3e635"),
      layer("pressure", "Pressure", "pressure_new", "#7a8ba8"),
      layer("clouds", "Clouds", "clouds_new", "#94a3b8"));

  private final WeatherTimelineProvider timeline;
  private final OpenMeteoAirQualityClient airQuality;
  private final LocationService locations;
  private final String units;
  private final String openWeatherApiKey;

  public WeatherService(WeatherTimelineProvider timeline, OpenMeteoAirQualityClient airQuality,
      LocationService locations, AppProperties properties) {
    this.timeline = timeline;
    this.airQuality = airQuality;
    this.locations = locations;
    this.units = properties.weather().visualCrossingUnitGroup();
    this.openWeatherApiKey = properties.weather().openweatherApiKey();
  }

  public String units() {
    return units;
  }

  public Map<String, Object> getCurrent(String location) {
    Map<String, Object> payload = timeline.fetchTimeline(TimelineQuery.of(location, "current"));
    Map<String, Object> response = WeatherMapper.mapEnvelope(location, units, payload);
    response.put("current", WeatherMapper.mapCondition(Json.obj(payload.get("currentConditions"))));
    return response;
  }

  public Map<String, Object> getHourly(String location, int days, Integer hoursLimit) {
    Map<String, Object> payload = timeline.fetchTimeline(TimelineQuery.of(location, "hours", "days"));
    List<Map<String, Object>> allDays = WeatherMapper.objects(payload.get("days"));
    List<Map<String, Object>> hours = new ArrayList<>();
    for (Map<String, Object> day : allDays.subList(0, Math.min(days, allDays.size()))) {
      for (Map<String, Object> hour : WeatherMapper.objects(day.get("hours"))) {
        hours.add(WeatherMapper.mapHourly(hour));
      }
    }

    if (hoursLimit != null) {
      long nowEpoch = Math.floorDiv(System.currentTimeMillis(), 1000) - 3_600;
      hours = hours.stream()
          .filter(hour -> {
            Number epoch = Json.num(hour.get("datetimeEpoch"));
            return (epoch == null ? 0 : epoch.doubleValue()) >= nowEpoch;
          })
          .limit(hoursLimit)
          .toList();
    }

    Map<String, Object> response = WeatherMapper.mapEnvelope(location, units, payload);
    response.put("hours", hours);
    return response;
  }

  public Map<String, Object> getDaily(String location, int days) {
    TimelineQuery query = TimelineQuery.of(location, "days");
    if (days > 15) {
      query = query.withRange("next" + days + "days", null);
    }
    Map<String, Object> payload = timeline.fetchTimeline(query);
    Map<String, Object> response = WeatherMapper.mapEnvelope(location, units, payload);
    response.put("days", mapDays(payload, days, false));
    return response;
  }

  public Map<String, Object> getHistorical(String location, String startDate, String endDate) {
    if (startDate.compareTo(endDate) > 0) {
      throw new ApiException(400, "INVALID_DATE_RANGE", "startDate must be on or before endDate.");
    }
    Map<String, Object> payload = timeline.fetchTimeline(
        TimelineQuery.of(location, "days", "hours").withRange(startDate, endDate));
    Map<String, Object> response = WeatherMapper.mapEnvelope(location, units, payload);
    response.put("startDate", startDate);
    response.put("endDate", endDate);
    response.put("days", mapDays(payload, Integer.MAX_VALUE, true));
    return response;
  }

  public Map<String, Object> getAlerts(String location) {
    Map<String, Object> payload = timeline.fetchTimeline(TimelineQuery.of(location, "alerts", "days", "current"));
    List<Map<String, Object>> alerts = WeatherMapper.objects(payload.get("alerts")).stream()
        .map(WeatherMapper::mapAlert)
        .toList();
    List<Map<String, Object>> days = mapDays(payload, 5, false);
    Map<String, Object> response = WeatherMapper.mapEnvelope(location, units, payload);
    @SuppressWarnings("unchecked")
    String area = (String) ((Map<String, Object>) response.get("location")).get("resolvedAddress");
    List<Map<String, Object>> categories = AlertCategoriesMapper.build(alerts, days, units, area);

    response.put("alerts", alerts);
    response.put("categories", categories);
    response.put("activeCount", categories.stream().filter(card -> Boolean.TRUE.equals(card.get("active"))).count());
    return response;
  }

  public Map<String, Object> getAirQuality(String location) {
    ResolvedCoordinates coords = resolveCoordinates(location);
    Map<String, Object> payload = airQuality.fetch(coords.latitude(), coords.longitude());
    Number latitude = Json.num(payload.get("latitude"));
    Number longitude = Json.num(payload.get("longitude"));
    return AirQualityMapper.map(
        location,
        coords.resolvedAddress(),
        latitude != null ? latitude : coords.latitude(),
        longitude != null ? longitude : coords.longitude(),
        coords.timezone(),
        Json.obj(payload.get("current")),
        Json.str(payload.get("timezone")));
  }

  public Map<String, Object> getMapConfig() {
    Map<String, Object> config = new LinkedHashMap<>();
    if (openWeatherApiKey.isEmpty()) {
      config.put("overlaysEnabled", false);
      config.put("tileUrlTemplate", null);
    } else {
      config.put("overlaysEnabled", true);
      config.put("tileUrlTemplate", "https://tile.openweathermap.org/map/{layer}/{z}/{x}/{y}.png?appid="
          + java.net.URLEncoder.encode(openWeatherApiKey, java.nio.charset.StandardCharsets.UTF_8).replace("+", "%20"));
    }
    config.put("layers", MAP_LAYERS);
    return config;
  }

  private record ResolvedCoordinates(double latitude, double longitude, String resolvedAddress, String timezone) {
  }

  private ResolvedCoordinates resolveCoordinates(String location) {
    LocationService.Coordinates coords = LocationService.parseCoordinates(location);
    if (coords != null) {
      try {
        LocationSuggestion resolved = locations.resolveCoordinates(coords.latitude(), coords.longitude());
        return new ResolvedCoordinates(resolved.latitude(), resolved.longitude(), resolved.label(), null);
      } catch (RuntimeException exception) {
        return new ResolvedCoordinates(coords.latitude(), coords.longitude(), location.trim(), null);
      }
    }

    try {
      LocationSuggestion resolved = locations.resolveQuery(location);
      return new ResolvedCoordinates(resolved.latitude(), resolved.longitude(), resolved.label(), null);
    } catch (RuntimeException exception) {
      Map<String, Object> payload = timeline.fetchTimeline(
          TimelineQuery.of(location, "current").withElements("datetime"));
      Double latitude = Json.dbl(payload.get("latitude"));
      Double longitude = Json.dbl(payload.get("longitude"));
      if (latitude == null || longitude == null) {
        throw new ApiException(404, "LOCATION_NOT_FOUND", "Unable to resolve coordinates for \"" + location + "\".");
      }
      String resolvedAddress = Json.str(payload.get("resolvedAddress"));
      if (resolvedAddress == null) {
        resolvedAddress = payload.get("address") instanceof String address ? address : location;
      }
      return new ResolvedCoordinates(latitude, longitude, resolvedAddress, Json.str(payload.get("timezone")));
    }
  }

  private static List<Map<String, Object>> mapDays(Map<String, Object> payload, int limit, boolean includeHours) {
    List<Map<String, Object>> days = WeatherMapper.objects(payload.get("days"));
    return days.subList(0, Math.min(limit, days.size())).stream()
        .map(day -> WeatherMapper.mapDaily(day, includeHours))
        .toList();
  }

  private static Map<String, String> layer(String id, String label, String owmLayer, String color) {
    Map<String, String> layer = new LinkedHashMap<>();
    layer.put("id", id);
    layer.put("label", label);
    layer.put("owmLayer", owmLayer);
    layer.put("color", color);
    return layer;
  }
}
