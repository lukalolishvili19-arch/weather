package com.weather.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

public record ErrorResponse(Body error) {

  @JsonInclude(JsonInclude.Include.NON_NULL)
  public record Body(String code, String message, Object details, String requestId) {
  }

  public static ErrorResponse of(String code, String message, Object details, String requestId) {
    return new ErrorResponse(new Body(code, message, details, requestId));
  }
}
