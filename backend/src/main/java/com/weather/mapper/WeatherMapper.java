package com.weather.mapper;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import com.weather.integration.Json;

/** Normalizes Visual Crossing timeline payloads into the API's weather response shapes. */
public final class WeatherMapper {

  private WeatherMapper() {
  }

  public static Map<String, Object> mapLocation(String query, Map<String, Object> payload) {
    Map<String, Object> location = new LinkedHashMap<>();
    location.put("query", query);
    location.put("resolvedAddress", firstNonNull(Json.str(payload.get("resolvedAddress")),
        Json.str(payload.get("address")), query));
    location.put("latitude", Json.num(payload.get("latitude")));
    location.put("longitude", Json.num(payload.get("longitude")));
    location.put("timezone", Json.str(payload.get("timezone")));
    location.put("timezoneOffsetHours", Json.num(payload.get("tzoffset")));
    return location;
  }

  public static Map<String, Object> mapEnvelope(String query, String units, Map<String, Object> payload) {
    Map<String, Object> envelope = new LinkedHashMap<>();
    envelope.put("source", "visual-crossing");
    envelope.put("units", units);
    envelope.put("location", mapLocation(query, payload));
    return envelope;
  }

  public static Map<String, Object> mapCondition(Map<String, Object> condition) {
    if (condition == null) {
      return null;
    }
    Map<String, Object> mapped = new LinkedHashMap<>();
    mapped.put("datetime", Json.str(condition.get("datetime")));
    mapped.put("datetimeEpoch", Json.num(condition.get("datetimeEpoch")));
    mapped.put("temperature", Json.num(condition.get("temp")));
    mapped.put("feelsLike", Json.num(condition.get("feelslike")));
    mapped.put("humidity", Json.num(condition.get("humidity")));
    mapped.put("dewPoint", Json.num(condition.get("dew")));
    mapped.put("precip", Json.num(condition.get("precip")));
    mapped.put("precipProbability", Json.num(condition.get("precipprob")));
    List<Object> precipType = Json.list(condition.get("preciptype"));
    mapped.put("precipType", precipType == null ? List.of() : precipType);
    mapped.put("snow", Json.num(condition.get("snow")));
    mapped.put("snowDepth", Json.num(condition.get("snowdepth")));
    mapped.put("windSpeed", Json.num(condition.get("windspeed")));
    mapped.put("windGust", Json.num(condition.get("windgust")));
    mapped.put("windDirection", Json.num(condition.get("winddir")));
    mapped.put("pressure", Json.num(condition.get("pressure")));
    mapped.put("cloudCover", Json.num(condition.get("cloudcover")));
    mapped.put("visibility", Json.num(condition.get("visibility")));
    mapped.put("uvIndex", Json.num(condition.get("uvindex")));
    mapped.put("conditions", Json.str(condition.get("conditions")));
    mapped.put("icon", Json.str(condition.get("icon")));
    mapped.put("solarRadiation", Json.num(condition.get("solarradiation")));
    return mapped;
  }

  public static Map<String, Object> mapHourly(Map<String, Object> condition) {
    Map<String, Object> mapped = mapCondition(condition);
    if (mapped == null) {
      throw new IllegalStateException("Failed to map hourly condition");
    }
    return mapped;
  }

  public static Map<String, Object> mapDaily(Map<String, Object> condition, boolean includeHours) {
    Map<String, Object> mapped = mapCondition(condition);
    if (mapped == null) {
      throw new IllegalStateException("Failed to map daily condition");
    }
    mapped.put("temperatureMax", Json.num(condition.get("tempmax")));
    mapped.put("temperatureMin", Json.num(condition.get("tempmin")));
    mapped.put("feelsLikeMax", Json.num(condition.get("feelslikemax")));
    mapped.put("feelsLikeMin", Json.num(condition.get("feelslikemin")));
    mapped.put("sunrise", Json.str(condition.get("sunrise")));
    mapped.put("sunset", Json.str(condition.get("sunset")));
    mapped.put("description", Json.str(condition.get("description")));
    List<Map<String, Object>> hours = new ArrayList<>();
    if (includeHours) {
      for (Map<String, Object> hour : objects(condition.get("hours"))) {
        hours.add(mapHourly(hour));
      }
    }
    mapped.put("hours", hours);
    return mapped;
  }

  public static Map<String, Object> mapAlert(Map<String, Object> alert) {
    Map<String, Object> mapped = new LinkedHashMap<>();
    mapped.put("id", Json.str(alert.get("id")));
    mapped.put("event", Json.str(alert.get("event")));
    mapped.put("headline", Json.str(alert.get("headline")));
    mapped.put("description", Json.str(alert.get("description")));
    mapped.put("severity", Json.str(alert.get("severity")));
    mapped.put("onset", Json.str(alert.get("onset")));
    mapped.put("ends", Json.str(alert.get("ends")));
    mapped.put("link", Json.str(alert.get("link")));
    return mapped;
  }

  /** Elements of a JSON array that are objects; {@code payload.days ?? []} in the TS code. */
  public static List<Map<String, Object>> objects(Object value) {
    List<Object> list = Json.list(value);
    if (list == null) {
      return List.of();
    }
    List<Map<String, Object>> result = new ArrayList<>(list.size());
    for (Object item : list) {
      Map<String, Object> map = Json.obj(item);
      result.add(map == null ? Map.of() : map);
    }
    return result;
  }

  private static String firstNonNull(String... values) {
    for (String value : values) {
      if (value != null) {
        return value;
      }
    }
    return null;
  }
}
