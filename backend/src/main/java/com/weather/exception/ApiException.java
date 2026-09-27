package com.weather.exception;

public class ApiException extends RuntimeException {

  private final int status;
  private final String code;
  private final transient Object details;

  public ApiException(int status, String code, String message) {
    this(status, code, message, null);
  }

  public ApiException(int status, String code, String message, Object details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }

  public int status() {
    return status;
  }

  public String code() {
    return code;
  }

  public Object details() {
    return details;
  }

  public static ApiException unauthorized() {
    return new ApiException(401, "UNAUTHORIZED", "Authentication is required.");
  }
}
