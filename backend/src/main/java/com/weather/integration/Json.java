package com.weather.integration;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Map;

/** Accessors for provider payloads parsed into plain maps/lists, mirroring the TS guards. */
public final class Json {

  private Json() {
  }

  @SuppressWarnings("unchecked")
  public static Map<String, Object> obj(Object value) {
    return value instanceof Map<?, ?> map ? (Map<String, Object>) map : null;
  }

  @SuppressWarnings("unchecked")
  public static List<Object> list(Object value) {
    return value instanceof List<?> list ? (List<Object>) list : null;
  }

  public static Object get(Map<String, Object> map, String key) {
    return map == null ? null : map.get(key);
  }

  /** {@code typeof value === "number" && Number.isFinite(value) ? value : null}, keeping the original type. */
  public static Number num(Object value) {
    if (value instanceof Number number) {
      double asDouble = number.doubleValue();
      return Double.isFinite(asDouble) ? number : null;
    }
    return null;
  }

  public static Double dbl(Object value) {
    Number number = num(value);
    return number == null ? null : number.doubleValue();
  }

  /** {@code typeof value === "string" && value.length > 0 ? value : null}. */
  public static String str(Object value) {
    return value instanceof String text && !text.isEmpty() ? text : null;
  }

  /** {@code Number.prototype.toFixed(digits)}: half-up on the exact binary value. */
  public static String toFixed(double value, int digits) {
    return new BigDecimal(value).setScale(digits, RoundingMode.HALF_UP).toPlainString();
  }

  /** {@code Math.round}: halves round towards positive infinity. */
  public static long round(double value) {
    return (long) Math.floor(value + 0.5d);
  }

  /** {@code String(number)} for values that are integral, e.g. {@code 36} rather than {@code 36.0}. */
  public static String jsNumber(double value) {
    if (value == Math.rint(value) && !Double.isInfinite(value) && Math.abs(value) < 1e21) {
      return Long.toString((long) value);
    }
    return Double.toString(value);
  }
}
