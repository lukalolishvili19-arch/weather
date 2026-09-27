package com.weather.support;

import java.time.Duration;

import com.weather.config.AppProperties;

public final class TestProperties {

  private TestProperties() {
  }

  public static AppProperties create(String accessExpiresIn) {
    return new AppProperties(
        "test",
        "postgresql://localhost/weather",
        5,
        "http://localhost:5173",
        "refreshToken",
        10,
        new AppProperties.Jwt(IntegrationTestSupport.ACCESS_SECRET, IntegrationTestSupport.REFRESH_SECRET,
            accessExpiresIn, "7d"),
        new AppProperties.Weather("", "http://vc", "metric", "http://aq", "http://forecast", "http://geo",
            "http://nominatim", "", Duration.ofSeconds(1), Duration.ofSeconds(1), Duration.ofMinutes(1),
            Duration.ofMinutes(1)));
  }
}
