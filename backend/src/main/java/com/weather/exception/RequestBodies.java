package com.weather.exception;

import java.util.stream.Collectors;

import org.springframework.http.converter.HttpMessageNotReadableException;

import tools.jackson.core.JacksonException;
import tools.jackson.databind.exc.MismatchedInputException;

final class RequestBodies {

  private RequestBodies() {
  }

  static ValidationException describe(HttpMessageNotReadableException exception) {
    Throwable cause = exception.getCause();
    while (cause != null && !(cause instanceof JacksonException)) {
      cause = cause.getCause();
    }
    if (cause instanceof MismatchedInputException mismatch && !mismatch.getPath().isEmpty()) {
      String field = mismatch.getPath().stream()
          .map(reference -> reference.getPropertyName() != null
              ? reference.getPropertyName()
              : String.valueOf(reference.getIndex()))
          .collect(Collectors.joining("."));
      String expected = mismatch.getTargetType() == null ? "value" : typeName(mismatch.getTargetType());
      return ValidationException.field(field, "Expected " + expected);
    }
    if (cause == null && exception.getMessage() != null && exception.getMessage().contains("body is missing")) {
      return ValidationException.form("Required");
    }
    return ValidationException.form(cause == null ? "Required" : "Malformed JSON body");
  }

  private static String typeName(Class<?> type) {
    if (type == String.class) {
      return "string";
    }
    if (type == Boolean.class || type == boolean.class) {
      return "boolean";
    }
    if (Number.class.isAssignableFrom(type) || type.isPrimitive()) {
      return "number";
    }
    if (type.isEnum()) {
      return "one of " + java.util.Arrays.toString(type.getEnumConstants());
    }
    return "object";
  }
}
