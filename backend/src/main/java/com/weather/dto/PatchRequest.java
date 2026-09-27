package com.weather.dto;

import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.Set;

import com.weather.exception.ValidationException;

/**
 * Base for partial-update bodies. Records which known keys were sent so that an omitted key leaves
 * the column untouched while an explicit {@code null} clears it, as with the Prisma implementation.
 */
public abstract class PatchRequest {

  private final Set<String> present = new LinkedHashSet<>();
  private final Map<String, String> nullErrors = new LinkedHashMap<>();

  protected void mark(String field) {
    present.add(field);
  }

  /** For keys the schema declared optional but not nullable. */
  protected void markNonNull(String field, Object value, String expected) {
    present.add(field);
    if (value == null) {
      nullErrors.put(field, "Expected " + expected + ", received null");
    } else {
      nullErrors.remove(field);
    }
  }

  public boolean has(String field) {
    return present.contains(field);
  }

  protected boolean requiresAnyField() {
    return true;
  }

  public void collectNullErrors(ValidationException target) {
    nullErrors.forEach(target::addFieldError);
  }

  /** Mirrors {@code .refine(value => Object.keys(value).length > 0)}; runs only after field validation passed. */
  public void validatePresence() {
    if (requiresAnyField() && present.isEmpty()) {
      throw ValidationException.form("At least one field is required");
    }
  }
}
