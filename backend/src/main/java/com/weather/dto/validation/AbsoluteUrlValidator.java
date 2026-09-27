package com.weather.dto.validation;

import java.net.URI;
import java.net.URISyntaxException;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class AbsoluteUrlValidator implements ConstraintValidator<AbsoluteUrl, String> {

  @Override
  public boolean isValid(String value, ConstraintValidatorContext context) {
    if (value == null) {
      return true;
    }
    try {
      URI uri = new URI(value);
      return uri.isAbsolute() && (uri.isOpaque() || uri.getHost() != null || uri.getAuthority() != null);
    } catch (URISyntaxException exception) {
      return false;
    }
  }
}
