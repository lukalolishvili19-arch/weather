package com.weather.dto.validation;

import java.util.regex.Pattern;

/** Regular expressions equivalent to the zod (3.24) validators the Node API used. */
public final class Patterns {

  public static final String EMAIL =
      "^(?!\\.)(?!.*\\.\\.)([A-Z0-9_'+\\-.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\\-]*\\.)+[A-Z]{2,}$";

  public static final String CUID = "^c[^\\s-]{8,}$";

  private static final Pattern CUID_PATTERN = Pattern.compile(CUID, Pattern.CASE_INSENSITIVE);

  private Patterns() {
  }

  public static boolean isCuid(String value) {
    return value != null && CUID_PATTERN.matcher(value).matches();
  }

  public static String trim(String value) {
    return value == null ? null : value.strip();
  }
}
