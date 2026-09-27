package com.weather.controller;

import java.util.Comparator;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validator;

import com.weather.dto.PatchRequest;
import com.weather.dto.validation.Patterns;
import com.weather.exception.ValidationException;

import org.springframework.stereotype.Component;

/**
 * Validates path params and bodies explicitly (rather than with {@code @Valid}) so errors surface in
 * the same order as the Express middleware chain: params first, then body.
 */
@Component
public class RequestValidator {

  private final Validator validator;

  public RequestValidator(Validator validator) {
    this.validator = validator;
  }

  public <T> T body(T body) {
    if (body == null) {
      throw ValidationException.form("Required");
    }
    ValidationException errors = new ValidationException();
    if (body instanceof PatchRequest patch) {
      patch.collectNullErrors(errors);
    }
    validator.validate(body).stream()
        .sorted(Comparator.comparing((ConstraintViolation<T> violation) -> violation.getPropertyPath().toString()))
        .forEach(violation -> {
          String path = violation.getPropertyPath().toString();
          if (path.isEmpty()) {
            errors.addFormError(violation.getMessage());
          } else {
            errors.addFieldError(path, violation.getMessage());
          }
        });
    errors.throwIfErrors();
    if (body instanceof PatchRequest patch) {
      patch.validatePresence();
    }
    return body;
  }

  public static String cuid(String name, String value) {
    if (!Patterns.isCuid(value)) {
      throw ValidationException.field(name, "Invalid cuid");
    }
    return value;
  }
}
