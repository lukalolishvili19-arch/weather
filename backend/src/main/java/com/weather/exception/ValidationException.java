package com.weather.exception;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Request validation failure rendered with the same {@code details} shape the Node API produced
 * via {@code ZodError.flatten()}: {@code { formErrors: string[], fieldErrors: { [field]: string[] } }}.
 */
public class ValidationException extends RuntimeException {

  private final List<String> formErrors = new ArrayList<>();
  private final Map<String, List<String>> fieldErrors = new LinkedHashMap<>();

  public ValidationException() {
    super("The request is invalid.");
  }

  public static ValidationException form(String message) {
    return new ValidationException().addFormError(message);
  }

  public static ValidationException field(String field, String message) {
    return new ValidationException().addFieldError(field, message);
  }

  public ValidationException addFormError(String message) {
    formErrors.add(message);
    return this;
  }

  public ValidationException addFieldError(String field, String message) {
    fieldErrors.computeIfAbsent(field, key -> new ArrayList<>()).add(message);
    return this;
  }

  public boolean hasErrors() {
    return !formErrors.isEmpty() || !fieldErrors.isEmpty();
  }

  public void throwIfErrors() {
    if (hasErrors()) {
      throw this;
    }
  }

  public Map<String, Object> details() {
    Map<String, Object> details = new LinkedHashMap<>();
    details.put("formErrors", formErrors);
    details.put("fieldErrors", fieldErrors);
    return details;
  }
}
