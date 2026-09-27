package com.weather.support;

import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.Executors;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;

import tools.jackson.databind.json.JsonMapper;

/**
 * In-process stand-ins for Visual Crossing, Open-Meteo (geocoding, air quality) and Nominatim so the
 * weather endpoints can be verified against known upstream payloads.
 */
public final class StubUpstreams {

  public static final String RESOLVED_ADDRESS = "Testville, Test Country";

  private static final JsonMapper JSON = JsonMapper.builder().build();
  private static StubUpstreams instance;

  private final HttpServer server;
  public final List<String> requests = new CopyOnWriteArrayList<>();

  private StubUpstreams() throws IOException {
    server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
    server.setExecutor(Executors.newVirtualThreadPerTaskExecutor());
    server.createContext("/vc/", this::visualCrossing);
    server.createContext("/geo", this::geocoding);
    server.createContext("/aq", this::airQuality);
    server.createContext("/forecast", exchange -> send(exchange, 503, "{}"));
    server.createContext("/nominatim/reverse", this::reverse);
    server.start();
  }

  public static synchronized StubUpstreams get() {
    if (instance == null) {
      try {
        instance = new StubUpstreams();
      } catch (IOException exception) {
        throw new IllegalStateException(exception);
      }
    }
    return instance;
  }

  public String baseUrl() {
    return "http://127.0.0.1:" + server.getAddress().getPort();
  }

  public static LocalDate today() {
    return LocalDate.now(ZoneOffset.UTC);
  }

  private void visualCrossing(HttpExchange exchange) throws IOException {
    String rawPath = exchange.getRequestURI().getRawPath();
    requests.add(rawPath + "?" + exchange.getRequestURI().getRawQuery());
    String location = URLDecoder.decode(rawPath.substring("/vc/".length()).split("/")[0], StandardCharsets.UTF_8);
    switch (location) {
      case "RateLimited" -> send(exchange, 429, "Too many requests");
      case "BadRequest" -> send(exchange, 400, "Invalid location parameter value.");
      case "Broken" -> send(exchange, 200, "not json");
      default -> send(exchange, 200, JSON.writeValueAsString(timeline(location)));
    }
  }

  private static Map<String, Object> timeline(String location) {
    LocalDate today = today();
    List<Map<String, Object>> days = new ArrayList<>();
    for (int index = 0; index < 5; index++) {
      LocalDate date = today.plusDays(index);
      long epoch = date.atStartOfDay(ZoneOffset.UTC).toEpochSecond();
      Map<String, Object> day = condition(date.toString(), epoch, 24.0 + index);
      day.put("tempmax", index == 0 ? 38.0 : 27.0);
      day.put("tempmin", 15.0);
      day.put("feelslikemax", index == 0 ? 40.0 : 28.0);
      day.put("feelslikemin", 14.0);
      day.put("sunrise", "06:30:00");
      day.put("sunset", "19:10:00");
      day.put("description", "Day " + index);
      day.put("precipprob", index == 1 ? 80.0 : 10.0);
      day.put("precip", index == 1 ? 12.0 : 0.0);
      day.put("windgust", index == 2 ? 30.0 : 20.0);
      day.put("conditions", index == 2 ? "Thunderstorm" : index == 1 ? "Rain" : "Clear");
      day.put("icon", index == 2 ? "thunder-rain" : index == 1 ? "rain" : "clear-day");
      List<Map<String, Object>> hours = new ArrayList<>();
      for (int hour = 0; hour < 24; hour++) {
        hours.add(condition(String.format("%02d:00:00", hour), epoch + hour * 3_600L, 20.0 + hour / 2.0));
      }
      day.put("hours", hours);
      days.add(day);
    }

    Map<String, Object> payload = new LinkedHashMap<>();
    payload.put("queryCost", 1);
    payload.put("latitude", 10.5);
    payload.put("longitude", 20.25);
    payload.put("resolvedAddress", RESOLVED_ADDRESS);
    payload.put("address", location);
    payload.put("timezone", "UTC");
    payload.put("tzoffset", 0.0);
    payload.put("days", days);
    payload.put("alerts", "AlertCity".equals(location)
        ? List.of(Map.of("event", "Flood Warning", "headline", "Flood Warning issued", "description",
            "River flooding expected.", "severity", "Severe", "onset", today + "T08:00:00", "id", "alert-1"))
        : List.of());
    Map<String, Object> current = condition("12:00:00", today.atStartOfDay(ZoneOffset.UTC).toEpochSecond(), 30.5);
    current.put("conditions", "Clear");
    current.put("icon", "clear-day");
    payload.put("currentConditions", current);
    return payload;
  }

  private static Map<String, Object> condition(String datetime, long epoch, double temp) {
    Map<String, Object> condition = new LinkedHashMap<>();
    condition.put("datetime", datetime);
    condition.put("datetimeEpoch", epoch);
    condition.put("temp", temp);
    condition.put("feelslike", temp + 1);
    condition.put("humidity", 55.5);
    condition.put("dew", 12.0);
    condition.put("precip", 0.0);
    condition.put("precipprob", 5.0);
    condition.put("preciptype", null);
    condition.put("snow", 0.0);
    condition.put("snowdepth", 0.0);
    condition.put("windspeed", 12.0);
    condition.put("windgust", 20.0);
    condition.put("winddir", 180.0);
    condition.put("pressure", 1015.0);
    condition.put("cloudcover", 25.0);
    condition.put("visibility", 10.0);
    condition.put("uvindex", 6.0);
    condition.put("solarradiation", 500.0);
    return condition;
  }

  private void geocoding(HttpExchange exchange) throws IOException {
    requests.add("/geo?" + exchange.getRequestURI().getRawQuery());
    String query = exchange.getRequestURI().getQuery();
    boolean known = query != null && query.contains("name=Testville");
    Map<String, Object> result = new LinkedHashMap<>();
    result.put("id", 12345);
    result.put("name", "Testville");
    result.put("latitude", 10.5);
    result.put("longitude", 20.25);
    result.put("country", "Test Country");
    send(exchange, 200, JSON.writeValueAsString(known ? Map.of("results", List.of(result)) : Map.of()));
  }

  private void airQuality(HttpExchange exchange) throws IOException {
    requests.add("/aq?" + exchange.getRequestURI().getRawQuery());
    Map<String, Object> current = new LinkedHashMap<>();
    current.put("time", today() + "T12:00");
    current.put("us_aqi", 42);
    current.put("european_aqi", 20);
    current.put("pm2_5", 10.2);
    current.put("pm10", 20.0);
    current.put("nitrogen_dioxide", 15.0);
    current.put("ozone", 60.0);
    current.put("carbon_monoxide", 250.0);
    current.put("sulphur_dioxide", 5.0);
    Map<String, Object> payload = new LinkedHashMap<>();
    payload.put("latitude", 10.5);
    payload.put("longitude", 20.25);
    payload.put("timezone", "GMT");
    payload.put("current", current);
    send(exchange, 200, JSON.writeValueAsString(payload));
  }

  private void reverse(HttpExchange exchange) throws IOException {
    requests.add("/nominatim/reverse?" + exchange.getRequestURI().getRawQuery());
    Map<String, Object> address = Map.of("city", "Testville", "country", "Test Country");
    Map<String, Object> payload = new LinkedHashMap<>();
    payload.put("place_id", 99);
    payload.put("display_name", "Testville, Test Country");
    payload.put("lat", "10.5");
    payload.put("lon", "20.25");
    payload.put("type", "city");
    payload.put("address", address);
    send(exchange, 200, JSON.writeValueAsString(payload));
  }

  private static void send(HttpExchange exchange, int status, String body) throws IOException {
    byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
    exchange.getResponseHeaders().add("Content-Type", "application/json");
    exchange.sendResponseHeaders(status, bytes.length);
    try (OutputStream out = exchange.getResponseBody()) {
      out.write(bytes);
    }
  }
}
