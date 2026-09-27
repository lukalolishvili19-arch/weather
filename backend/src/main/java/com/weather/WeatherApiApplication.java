package com.weather;

import java.util.List;
import java.util.Locale;
import java.util.TimeZone;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class WeatherApiApplication {

  /**
   * Hosting dashboards (Vercel in particular) have injected values with trailing CR/LF,
   * so every variable the API reads is trimmed before Spring binds it.
   */
  private static final List<String> ENV_KEYS = List.of(
      "NODE_ENV", "PORT", "DATABASE_URL", "DB_POOL_SIZE", "CORS_ORIGINS", "LOG_LEVEL",
      "JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET", "JWT_ACCESS_EXPIRES_IN", "JWT_REFRESH_EXPIRES_IN",
      "REFRESH_COOKIE_NAME", "BCRYPT_SALT_ROUNDS", "VISUAL_CROSSING_API_KEY",
      "VISUAL_CROSSING_BASE_URL", "VISUAL_CROSSING_UNIT_GROUP", "OPEN_METEO_AIR_QUALITY_BASE_URL",
      "OPEN_METEO_FORECAST_BASE_URL", "OPEN_METEO_GEOCODING_BASE_URL", "NOMINATIM_BASE_URL",
      "OPENWEATHER_API_KEY", "UPSTREAM_CONNECT_TIMEOUT", "UPSTREAM_READ_TIMEOUT",
      "WEATHER_CACHE_TTL", "GEOCODING_CACHE_TTL", "RATE_LIMIT_AUTH_PER_MINUTE", "RATE_LIMIT_PUBLIC_PER_MINUTE");

  public static void main(String[] args) {
    TimeZone.setDefault(TimeZone.getTimeZone("UTC"));
    normalizeEnvironment();
    SpringApplication.run(WeatherApiApplication.class, args);
  }

  static void normalizeEnvironment() {
    for (String key : ENV_KEYS) {
      String raw = System.getenv(key);
      if (raw == null || System.getProperty(key) != null) {
        continue;
      }
      String value = raw.trim();
      if ("LOG_LEVEL".equals(key)) {
        value = switch (value.toLowerCase(Locale.ROOT)) {
          case "silent" -> "off";
          case "fatal" -> "error";
          default -> value;
        };
      }
      if (!value.equals(raw)) {
        System.setProperty(key, value);
      }
    }
  }
}
