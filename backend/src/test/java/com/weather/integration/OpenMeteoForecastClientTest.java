package com.weather.integration;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;

class OpenMeteoForecastClientTest {

  private static Map<String, Object> daily(Object max, Object min) {
    Map<String, Object> daily = new HashMap<>();
    daily.put("time", List.of("2026-09-27"));
    daily.put("weather_code", List.of(3));
    daily.put("temperature_2m_max", Arrays.asList(max));
    daily.put("temperature_2m_min", Arrays.asList(min));
    return daily;
  }

  @Test
  void missingDailyTemperaturesFallBackLikeTheNodeClient() {
    Map<String, Object> hourly = Map.of("time", List.of());

    assertThat(OpenMeteoForecastClient.mapDailyBucket(daily(24.0, 16.0), hourly, 0).get("temp")).isEqualTo(20.0);
    assertThat(OpenMeteoForecastClient.mapDailyBucket(daily(null, 16.0), hourly, 0).get("temp")).isEqualTo(16.0);
    assertThat(OpenMeteoForecastClient.mapDailyBucket(daily(24.0, null), hourly, 0).get("temp")).isEqualTo(24.0);

    Map<String, Object> empty = OpenMeteoForecastClient.mapDailyBucket(daily(null, null), hourly, 0);
    assertThat(empty).containsEntry("temp", null).containsEntry("tempmax", null).containsEntry("tempmin", null);
  }
}
