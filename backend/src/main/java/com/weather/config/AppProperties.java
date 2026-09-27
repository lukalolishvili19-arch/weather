package com.weather.config;

import java.time.Duration;
import java.util.Arrays;
import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties("app")
public record AppProperties(
    @NotBlank @Pattern(regexp = "development|test|production",
        message = "NODE_ENV must be development, test or production") String environment,
    @NotBlank(message = "DATABASE_URL is required") String databaseUrl,
    @Min(1) @Max(100) int databasePoolSize,
    @NotNull String corsOrigins,
    @NotBlank String refreshCookieName,
    @Min(10) @Max(15) int bcryptSaltRounds,
    @Valid @NotNull Jwt jwt,
    @Valid @NotNull Weather weather) {

  public boolean isProduction() {
    return "production".equals(environment);
  }

  public List<String> corsOriginList() {
    return Arrays.stream(corsOrigins.split(","))
        .map(String::trim)
        .filter(origin -> !origin.isEmpty())
        .toList();
  }

  public record Jwt(
      @Size(min = 32, message = "JWT_ACCESS_SECRET must be at least 32 characters") String accessSecret,
      @Size(min = 32, message = "JWT_REFRESH_SECRET must be at least 32 characters") String refreshSecret,
      @NotBlank String accessExpiresIn,
      @NotBlank String refreshExpiresIn) {
  }

  public record Weather(
      String visualCrossingApiKey,
      @NotBlank String visualCrossingBaseUrl,
      @Pattern(regexp = "metric|us|uk|base") String visualCrossingUnitGroup,
      @NotBlank String openMeteoAirQualityBaseUrl,
      @NotBlank String openMeteoForecastBaseUrl,
      @NotBlank String openMeteoGeocodingBaseUrl,
      @NotBlank String nominatimBaseUrl,
      String openweatherApiKey,
      @NotNull Duration connectTimeout,
      @NotNull Duration readTimeout,
      @NotNull Duration forecastCacheTtl,
      @NotNull Duration geocodingCacheTtl) {

    public Weather {
      visualCrossingApiKey = visualCrossingApiKey == null ? "" : visualCrossingApiKey.trim();
      openweatherApiKey = openweatherApiKey == null ? "" : openweatherApiKey.trim();
      visualCrossingBaseUrl = stripTrailingSlash(visualCrossingBaseUrl);
      openMeteoAirQualityBaseUrl = stripTrailingSlash(openMeteoAirQualityBaseUrl);
      openMeteoForecastBaseUrl = stripTrailingSlash(openMeteoForecastBaseUrl);
      openMeteoGeocodingBaseUrl = stripTrailingSlash(openMeteoGeocodingBaseUrl);
      nominatimBaseUrl = stripTrailingSlash(nominatimBaseUrl);
    }

    private static String stripTrailingSlash(String value) {
      return value != null && value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }
  }
}
