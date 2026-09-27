package com.weather.controller;

import java.util.regex.Pattern;

import jakarta.servlet.http.HttpServletRequest;

import com.weather.dto.validation.Patterns;
import com.weather.exception.ValidationException;

/**
 * Query-string validation with zod 3 semantics: {@code z.string().trim()} and
 * {@code z.coerce.number().int()} including the exact zod error messages. All fields are checked
 * before {@link #validate()} throws, so every failing field is reported at once.
 */
final class QueryParams {

  private static final Pattern JS_NUMBER =
      Pattern.compile("^[+-]?(\\d+\\.?\\d*|\\.\\d+)([eE][+-]?\\d+)?$|^[+-]?Infinity$");

  private final HttpServletRequest request;
  private final ValidationException errors = new ValidationException();

  QueryParams(HttpServletRequest request) {
    this.request = request;
  }

  String requiredString(String name, int min, int max) {
    return string(name, min, max, false);
  }

  /** {@code z.preprocess(emptyToUndefined, z.string().trim().max(max).optional())}. */
  String optionalString(String name, int max) {
    return string(name, 0, max, true);
  }

  String matching(String name, String regex, String message) {
    String value = raw(name, false);
    if (value == null) {
      return null;
    }
    String trimmed = Patterns.trim(value);
    if (!trimmed.matches(regex)) {
      errors.addFieldError(name, message);
    }
    return trimmed;
  }

  int integer(String name, int min, int max, int defaultValue) {
    Integer value = optionalInteger(name, min, max);
    return value == null ? defaultValue : value;
  }

  Integer optionalInteger(String name, int min, int max) {
    String[] values = request.getParameterValues(name);
    if (values == null) {
      return null;
    }
    double number = values.length == 1 ? toNumber(values[0]) : Double.NaN;
    if (Double.isNaN(number)) {
      errors.addFieldError(name, "Expected number, received nan");
      return null;
    }
    boolean valid = true;
    if (number != Math.rint(number) || Double.isInfinite(number)) {
      errors.addFieldError(name, "Expected integer, received float");
      valid = false;
    }
    if (number < min) {
      errors.addFieldError(name, "Number must be greater than or equal to " + min);
      valid = false;
    }
    if (number > max) {
      errors.addFieldError(name, "Number must be less than or equal to " + max);
      valid = false;
    }
    return valid ? (int) number : null;
  }

  void validate() {
    errors.throwIfErrors();
  }

  private String string(String name, int min, int max, boolean optional) {
    String value = raw(name, optional);
    if (value == null) {
      return null;
    }
    String trimmed = Patterns.trim(value);
    if (trimmed.length() < min) {
      errors.addFieldError(name, "String must contain at least " + min + " character(s)");
    }
    if (trimmed.length() > max) {
      errors.addFieldError(name, "String must contain at most " + max + " character(s)");
    }
    return trimmed;
  }

  private String raw(String name, boolean optional) {
    String[] values = request.getParameterValues(name);
    if (values == null || (optional && values.length == 1 && values[0].isEmpty())) {
      if (!optional) {
        errors.addFieldError(name, "Required");
      }
      return null;
    }
    if (values.length > 1) {
      errors.addFieldError(name, "Expected string, received array");
      return null;
    }
    return values[0];
  }

  /** {@code Number(value)} for the decimal forms JavaScript accepts. */
  private static double toNumber(String value) {
    String trimmed = value.strip();
    if (trimmed.isEmpty()) {
      return 0;
    }
    if (!JS_NUMBER.matcher(trimmed).matches()) {
      return Double.NaN;
    }
    return Double.parseDouble(trimmed);
  }
}
