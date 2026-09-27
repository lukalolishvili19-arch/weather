package com.weather.controller;

import java.util.Map;

import jakarta.servlet.http.HttpServletRequest;

import com.weather.dto.ApiResponse;
import com.weather.service.WeatherService;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/weather")
public class WeatherController {

  private static final String DATE = "^\\d{4}-\\d{2}-\\d{2}$";

  private final WeatherService weather;

  public WeatherController(WeatherService weather) {
    this.weather = weather;
  }

  @GetMapping("/current")
  public ApiResponse<Map<String, Object>> current(HttpServletRequest request) {
    return ApiResponse.of(weather.getCurrent(location(request)));
  }

  @GetMapping("/hourly")
  public ApiResponse<Map<String, Object>> hourly(HttpServletRequest request) {
    QueryParams query = new QueryParams(request);
    String location = query.requiredString("location", 1, 200);
    int days = query.integer("days", 1, 15, 2);
    Integer hours = query.optionalInteger("hours", 1, 168);
    query.validate();
    return ApiResponse.of(weather.getHourly(location, days, hours));
  }

  @GetMapping("/daily")
  public ApiResponse<Map<String, Object>> daily(HttpServletRequest request) {
    QueryParams query = new QueryParams(request);
    String location = query.requiredString("location", 1, 200);
    int days = query.integer("days", 1, 30, 15);
    query.validate();
    return ApiResponse.of(weather.getDaily(location, days));
  }

  @GetMapping("/historical")
  public ApiResponse<Map<String, Object>> historical(HttpServletRequest request) {
    QueryParams query = new QueryParams(request);
    String location = query.requiredString("location", 1, 200);
    String startDate = query.matching("startDate", DATE, "startDate must be YYYY-MM-DD");
    String endDate = query.matching("endDate", DATE, "endDate must be YYYY-MM-DD");
    query.validate();
    return ApiResponse.of(weather.getHistorical(location, startDate, endDate));
  }

  @GetMapping("/alerts")
  public ApiResponse<Map<String, Object>> alerts(HttpServletRequest request) {
    return ApiResponse.of(weather.getAlerts(location(request)));
  }

  @GetMapping("/air-quality")
  public ApiResponse<Map<String, Object>> airQuality(HttpServletRequest request) {
    return ApiResponse.of(weather.getAirQuality(location(request)));
  }

  @GetMapping("/map-config")
  public ApiResponse<Map<String, Object>> mapConfig() {
    return ApiResponse.of(weather.getMapConfig());
  }

  private static String location(HttpServletRequest request) {
    QueryParams query = new QueryParams(request);
    String location = query.requiredString("location", 1, 200);
    query.validate();
    return location;
  }
}
