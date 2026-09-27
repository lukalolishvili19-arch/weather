package com.weather.security;

import java.time.Duration;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** Parses the {@code 15m} / {@code 7d} style durations used by JWT_*_EXPIRES_IN. */
public final class DurationParser {

  private static final Pattern FORMAT = Pattern.compile("^(\\d+)([smhd])$", Pattern.CASE_INSENSITIVE);

  private DurationParser() {
  }

  public static Duration parse(String value) {
    Matcher matcher = FORMAT.matcher(value == null ? "" : value.trim());
    if (!matcher.matches()) {
      throw new IllegalArgumentException("Invalid duration format: " + value);
    }
    long amount = Long.parseLong(matcher.group(1));
    return switch (matcher.group(2).toLowerCase(Locale.ROOT)) {
      case "s" -> Duration.ofSeconds(amount);
      case "m" -> Duration.ofMinutes(amount);
      case "h" -> Duration.ofHours(amount);
      default -> Duration.ofDays(amount);
    };
  }
}
