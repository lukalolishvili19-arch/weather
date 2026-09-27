package com.weather.controller;

import java.lang.management.ManagementFactory;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.Map;

import com.weather.config.AppProperties;
import com.weather.dto.ApiResponse;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {

  private static final DateTimeFormatter ISO_MILLIS =
      DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'").withZone(ZoneOffset.UTC);

  private final AppProperties properties;

  public HealthController(AppProperties properties) {
    this.properties = properties;
  }

  @GetMapping({"/api/v1/health", "/api/v1/health/"})
  public ApiResponse<Map<String, Object>> health() {
    Map<String, Object> body = new LinkedHashMap<>();
    body.put("status", "ok");
    body.put("service", "weather-api");
    body.put("environment", properties.environment());
    body.put("uptimeSeconds", ManagementFactory.getRuntimeMXBean().getUptime() / 1000);
    body.put("timestamp", ISO_MILLIS.format(Instant.now()));
    return ApiResponse.of(body);
  }
}
