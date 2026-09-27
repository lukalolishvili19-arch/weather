package com.weather.integration;

import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeParseException;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import com.weather.config.AppProperties;
import com.weather.dto.LocationDtos.LocationSuggestion;
import com.weather.exception.ApiException;
import com.weather.service.LocationService;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Keyless weather source used when Visual Crossing is not configured or unreachable. Output is reshaped
 * into the Visual Crossing timeline format so the same mappers apply.
 */
@Component
public class OpenMeteoForecastClient {

  private static final Logger log = LoggerFactory.getLogger(OpenMeteoForecastClient.class);

  private static final String CURRENT_FIELDS = String.join(",", "temperature_2m", "relative_humidity_2m",
      "apparent_temperature", "precipitation", "weather_code", "cloud_cover", "pressure_msl", "wind_speed_10m",
      "wind_direction_10m", "wind_gusts_10m", "uv_index", "visibility", "is_day");

  private static final String HOURLY_FIELDS = String.join(",", "temperature_2m", "relative_humidity_2m",
      "apparent_temperature", "precipitation", "precipitation_probability", "weather_code", "cloud_cover",
      "pressure_msl", "wind_speed_10m", "wind_direction_10m", "wind_gusts_10m", "uv_index", "visibility", "is_day");

  private static final String DAILY_FIELDS = String.join(",", "weather_code", "temperature_2m_max",
      "temperature_2m_min", "apparent_temperature_max", "apparent_temperature_min", "precipitation_sum",
      "precipitation_probability_max", "sunrise", "sunset", "uv_index_max", "wind_speed_10m_max",
      "wind_gusts_10m_max", "wind_direction_10m_dominant", "shortwave_radiation_sum");

  private static final Pattern DATE = Pattern.compile("^\\d{4}-\\d{2}-\\d{2}$");
  private static final Pattern TIME_PART = Pattern.compile("T(\\d{2}:\\d{2})");

  private final UpstreamHttp http;
  private final LocationService locations;
  private final String baseUrl;

  public OpenMeteoForecastClient(UpstreamHttp http, LocationService locations, AppProperties properties) {
    this.http = http;
    this.locations = locations;
    this.baseUrl = properties.weather().openMeteoForecastBaseUrl();
  }

  private record ResolvedLocation(double latitude, double longitude, String label) {
  }

  public Map<String, Object> fetchTimeline(TimelineQuery query) {
    ResolvedLocation location = resolveLocation(query.location());

    Map<String, String> params = UpstreamHttp.params();
    params.put("latitude", Json.jsNumber(location.latitude()));
    params.put("longitude", Json.jsNumber(location.longitude()));
    params.put("timezone", "auto");
    params.put("wind_speed_unit", "kmh");
    params.put("precipitation_unit", "mm");
    params.put("forecast_days", String.valueOf(forecastDayCount(query)));
    params.put("current", CURRENT_FIELDS);
    params.put("hourly", HOURLY_FIELDS);
    params.put("daily", DAILY_FIELDS);

    UpstreamHttp.Response response;
    try {
      response = http.get(baseUrl + "?" + UpstreamHttp.query(params), Map.of("Accept", "application/json"));
    } catch (IOException exception) {
      log.error("Open-Meteo forecast request failed for {}", query.location(), exception);
      throw new ApiException(502, "WEATHER_UPSTREAM_UNAVAILABLE", "Unable to reach the weather provider.");
    }
    if (!response.ok()) {
      log.warn("Open-Meteo forecast returned {} for {}: {}", response.status(), query.location(),
          OpenMeteoGeocodingClient.truncate(response.body(), 500));
      throw new ApiException(502, "WEATHER_UPSTREAM_ERROR", "Weather provider returned an unexpected error.");
    }

    Map<String, Object> payload;
    try {
      payload = http.parseObject(response.body());
    } catch (RuntimeException exception) {
      throw new ApiException(502, "WEATHER_UPSTREAM_ERROR", "Weather provider returned an unexpected error.");
    }

    Map<String, Object> daily = Json.obj(payload.get("daily"));
    Map<String, Object> hourly = Json.obj(payload.get("hourly"));
    List<Object> dailyTimes = Json.list(Json.get(daily, "time"));
    List<Map<String, Object>> days = new ArrayList<>();
    if (dailyTimes != null) {
      for (int index = 0; index < dailyTimes.size(); index++) {
        days.add(mapDailyBucket(daily, hourly, index));
      }
    }

    Map<String, Object> result = new LinkedHashMap<>();
    result.put("address", location.label());
    result.put("resolvedAddress", location.label());
    Number latitude = Json.num(payload.get("latitude"));
    Number longitude = Json.num(payload.get("longitude"));
    result.put("latitude", latitude != null ? latitude : location.latitude());
    result.put("longitude", longitude != null ? longitude : location.longitude());
    if (Json.str(payload.get("timezone")) != null) {
      result.put("timezone", payload.get("timezone"));
    }
    Number offsetSeconds = Json.num(payload.get("utc_offset_seconds"));
    if (offsetSeconds != null) {
      result.put("tzoffset", offsetSeconds.doubleValue() / 3600);
    }
    result.put("currentConditions", mapCurrent(Json.obj(payload.get("current"))));
    result.put("days", days);
    result.put("alerts", List.of());
    return result;
  }

  private ResolvedLocation resolveLocation(String location) {
    LocationService.Coordinates coords = LocationService.parseCoordinates(location);
    if (coords != null) {
      try {
        LocationSuggestion resolved = locations.resolveCoordinates(coords.latitude(), coords.longitude());
        return new ResolvedLocation(resolved.latitude(), resolved.longitude(), resolved.label());
      } catch (RuntimeException exception) {
        return new ResolvedLocation(coords.latitude(), coords.longitude(), location.trim());
      }
    }
    LocationSuggestion resolved = locations.resolveQuery(location);
    return new ResolvedLocation(resolved.latitude(), resolved.longitude(), resolved.label());
  }

  static int forecastDayCount(TimelineQuery query) {
    String start = query.startDate();
    if (start != null && start.startsWith("next") && start.endsWith("days")) {
      String digits = start.replaceAll("\\D", "");
      if (!digits.isEmpty()) {
        long days = Long.parseLong(digits);
        if (days > 0) {
          return (int) Math.min(Math.max(days, 1), 16);
        }
      }
    }
    if (start != null && query.endDate() != null && DATE.matcher(start).matches()) {
      try {
        LocalDate from = LocalDate.parse(start);
        LocalDate to = LocalDate.parse(query.endDate());
        if (!to.isBefore(from)) {
          long days = ChronoUnit.DAYS.between(from, to) + 1;
          return (int) Math.min(Math.max(days, 1), 16);
        }
      } catch (DateTimeParseException ignored) {
        // Falls through to the default window.
      }
    }
    return 16;
  }

  record CodeMeta(String conditions, String icon) {
  }

  static CodeMeta weatherCodeMeta(Number code, boolean isDay) {
    double value = code == null ? 0 : code.doubleValue();
    if (value == 0) {
      return new CodeMeta("Clear", isDay ? "clear-day" : "clear-night");
    }
    if (value <= 3) {
      String conditions = value == 1 ? "Mainly clear" : value == 2 ? "Partly cloudy" : "Overcast";
      return new CodeMeta(conditions, isDay ? "partly-cloudy-day" : "partly-cloudy-night");
    }
    if (value == 45 || value == 48) {
      return new CodeMeta("Fog", "fog");
    }
    if (value >= 51 && value <= 67) {
      return new CodeMeta("Rain", "rain");
    }
    if (value >= 71 && value <= 77) {
      return new CodeMeta("Snow", "snow");
    }
    if (value >= 80 && value <= 82) {
      return new CodeMeta("Rain showers", "rain");
    }
    if (value >= 85 && value <= 86) {
      return new CodeMeta("Snow showers", "snow");
    }
    if (value >= 95) {
      return new CodeMeta("Thunderstorm", "thunder");
    }
    return new CodeMeta("Cloudy", "cloudy");
  }

  /**
   * {@code Date.parse} on the provider's local timestamps. Values without an offset are read as UTC,
   * which is what the Node API did on its UTC hosts.
   */
  static Long toEpoch(String iso) {
    if (iso == null || iso.isEmpty()) {
      return null;
    }
    try {
      if (iso.endsWith("Z") || iso.matches(".*[+-]\\d{2}:\\d{2}$")) {
        return OffsetDateTime.parse(iso).toEpochSecond();
      }
      if (DATE.matcher(iso).matches()) {
        return LocalDate.parse(iso).atStartOfDay().toEpochSecond(ZoneOffset.UTC);
      }
      return LocalDateTime.parse(iso).toEpochSecond(ZoneOffset.UTC);
    } catch (DateTimeParseException exception) {
      return null;
    }
  }

  private static String timeOnly(String iso) {
    if (iso == null) {
      return null;
    }
    Matcher matcher = TIME_PART.matcher(iso);
    return matcher.find() ? matcher.group(1) : iso;
  }

  private static Object at(Map<String, Object> series, String key, int index) {
    List<Object> values = Json.list(Json.get(series, key));
    return values == null || index >= values.size() ? null : values.get(index);
  }

  private static Double kmFromMeters(Object meters) {
    Double value = Json.dbl(meters);
    return value == null ? null : value / 1000;
  }

  private static Map<String, Object> mapCurrent(Map<String, Object> current) {
    if (current == null) {
      return null;
    }
    Number code = Json.num(current.get("weather_code"));
    Number isDayValue = Json.num(current.get("is_day"));
    CodeMeta meta = weatherCodeMeta(code, isDayValue == null || isDayValue.doubleValue() != 0);
    String datetime = current.get("time") instanceof String text ? text : null;
    Long epoch = toEpoch(datetime);

    Map<String, Object> condition = new LinkedHashMap<>();
    if (datetime != null && !datetime.isEmpty()) condition.put("datetime", datetime);
    if (epoch != null) condition.put("datetimeEpoch", epoch);
    condition.put("temp", Json.num(current.get("temperature_2m")));
    condition.put("feelslike", Json.num(current.get("apparent_temperature")));
    condition.put("humidity", Json.num(current.get("relative_humidity_2m")));
    condition.put("precip", Json.num(current.get("precipitation")));
    condition.put("precipprob", null);
    condition.put("preciptype", List.of());
    condition.put("windspeed", Json.num(current.get("wind_speed_10m")));
    condition.put("windgust", Json.num(current.get("wind_gusts_10m")));
    condition.put("winddir", Json.num(current.get("wind_direction_10m")));
    condition.put("pressure", Json.num(current.get("pressure_msl")));
    condition.put("cloudcover", Json.num(current.get("cloud_cover")));
    condition.put("visibility", kmFromMeters(current.get("visibility")));
    condition.put("uvindex", Json.num(current.get("uv_index")));
    condition.put("conditions", meta.conditions());
    condition.put("icon", meta.icon());
    return condition;
  }

  private static Map<String, Object> mapHourlyBucket(Map<String, Object> hourly, int index) {
    String datetime = at(hourly, "time", index) instanceof String text ? text : null;
    Long epoch = toEpoch(datetime);
    Number code = Json.num(at(hourly, "weather_code", index));
    Number isDayValue = Json.num(at(hourly, "is_day", index));
    CodeMeta meta = weatherCodeMeta(code, isDayValue == null || isDayValue.doubleValue() != 0);

    Map<String, Object> condition = new LinkedHashMap<>();
    if (datetime != null && !datetime.isEmpty()) condition.put("datetime", datetime);
    if (epoch != null) condition.put("datetimeEpoch", epoch);
    condition.put("temp", Json.num(at(hourly, "temperature_2m", index)));
    condition.put("feelslike", Json.num(at(hourly, "apparent_temperature", index)));
    condition.put("humidity", Json.num(at(hourly, "relative_humidity_2m", index)));
    condition.put("precip", Json.num(at(hourly, "precipitation", index)));
    condition.put("precipprob", Json.num(at(hourly, "precipitation_probability", index)));
    condition.put("preciptype", List.of());
    condition.put("windspeed", Json.num(at(hourly, "wind_speed_10m", index)));
    condition.put("windgust", Json.num(at(hourly, "wind_gusts_10m", index)));
    condition.put("winddir", Json.num(at(hourly, "wind_direction_10m", index)));
    condition.put("pressure", Json.num(at(hourly, "pressure_msl", index)));
    condition.put("cloudcover", Json.num(at(hourly, "cloud_cover", index)));
    condition.put("visibility", kmFromMeters(at(hourly, "visibility", index)));
    condition.put("uvindex", Json.num(at(hourly, "uv_index", index)));
    condition.put("conditions", meta.conditions());
    condition.put("icon", meta.icon());
    return condition;
  }

  static Map<String, Object> mapDailyBucket(Map<String, Object> daily, Map<String, Object> hourly,
      int index) {
    String date = at(daily, "time", index) instanceof String text ? text : null;
    Long epoch = date == null ? null : toEpoch(date + "T12:00:00");
    CodeMeta meta = weatherCodeMeta(Json.num(at(daily, "weather_code", index)), true);

    List<Map<String, Object>> hours = new ArrayList<>();
    List<Object> hourlyTimes = Json.list(Json.get(hourly, "time"));
    if (hourlyTimes != null && date != null) {
      for (int hourIndex = 0; hourIndex < hourlyTimes.size(); hourIndex++) {
        if (hourlyTimes.get(hourIndex) instanceof String time && time.startsWith(date)) {
          hours.add(mapHourlyBucket(hourly, hourIndex));
        }
      }
    }

    Double tempMax = Json.dbl(at(daily, "temperature_2m_max", index));
    Double tempMin = Json.dbl(at(daily, "temperature_2m_min", index));
    Double avgTemp = tempMax != null && tempMin != null
        ? Double.valueOf((tempMax + tempMin) / 2)
        : (tempMax != null ? tempMax : tempMin);
    Object sunriseRaw = at(daily, "sunrise", index);
    Object sunsetRaw = at(daily, "sunset", index);
    String sunrise = timeOnly(sunriseRaw instanceof String text ? text : null);
    String sunset = timeOnly(sunsetRaw instanceof String text ? text : null);

    Map<String, Object> condition = new LinkedHashMap<>();
    if (date != null && !date.isEmpty()) condition.put("datetime", date);
    if (epoch != null) condition.put("datetimeEpoch", epoch);
    condition.put("temp", avgTemp);
    condition.put("tempmax", Json.num(at(daily, "temperature_2m_max", index)));
    condition.put("tempmin", Json.num(at(daily, "temperature_2m_min", index)));
    condition.put("feelslikemax", Json.num(at(daily, "apparent_temperature_max", index)));
    condition.put("feelslikemin", Json.num(at(daily, "apparent_temperature_min", index)));
    condition.put("precip", Json.num(at(daily, "precipitation_sum", index)));
    condition.put("precipprob", Json.num(at(daily, "precipitation_probability_max", index)));
    condition.put("preciptype", List.of());
    condition.put("windspeed", Json.num(at(daily, "wind_speed_10m_max", index)));
    condition.put("windgust", Json.num(at(daily, "wind_gusts_10m_max", index)));
    condition.put("winddir", Json.num(at(daily, "wind_direction_10m_dominant", index)));
    condition.put("uvindex", Json.num(at(daily, "uv_index_max", index)));
    if (sunrise != null && !sunrise.isEmpty()) condition.put("sunrise", sunrise);
    if (sunset != null && !sunset.isEmpty()) condition.put("sunset", sunset);
    condition.put("conditions", meta.conditions());
    condition.put("icon", meta.icon());
    condition.put("description", meta.conditions());
    condition.put("solarradiation", Json.num(at(daily, "shortwave_radiation_sum", index)));
    condition.put("hours", hours);
    return condition;
  }
}
