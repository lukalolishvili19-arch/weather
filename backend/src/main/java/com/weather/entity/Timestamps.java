package com.weather.entity;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;

/** Columns are {@code TIMESTAMP(3)} without time zone holding UTC wall-clock values. */
public final class Timestamps {

  private static final DateTimeFormatter ISO_MILLIS = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");

  private Timestamps() {
  }

  public static LocalDateTime now() {
    return LocalDateTime.now(ZoneOffset.UTC).truncatedTo(ChronoUnit.MILLIS);
  }

  /** Same representation as {@code Date.prototype.toJSON()} in the Node API. */
  public static String format(LocalDateTime value) {
    return value == null ? null : value.format(ISO_MILLIS);
  }
}
