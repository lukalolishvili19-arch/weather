package com.weather.exception;

import java.util.List;
import java.util.Map;

import jakarta.servlet.http.HttpServletRequest;

import com.weather.config.AppProperties;
import com.weather.config.RequestIdFilter;
import com.weather.dto.ErrorResponse;
import com.weather.dto.validation.Patterns;

import org.hibernate.exception.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.HandlerMapping;
import org.springframework.web.servlet.NoHandlerFoundException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

@RestControllerAdvice
public class GlobalExceptionHandler {

  private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

  /** Prisma reported unique violations as P2002 with the offending columns as {@code target}. */
  private static final Map<String, List<String>> UNIQUE_TARGETS = Map.of(
      "users_email_key", List.of("email"),
      "favorites_userId_locationId_key", List.of("userId", "locationId"),
      "user_settings_userId_key", List.of("userId"),
      "refresh_tokens_tokenHash_key", List.of("tokenHash"),
      "users_pkey", List.of("id"),
      "favorites_pkey", List.of("id"),
      "search_history_pkey", List.of("id"),
      "notifications_pkey", List.of("id"),
      "user_settings_pkey", List.of("id"),
      "refresh_tokens_pkey", List.of("id"));

  private final AppProperties properties;

  public GlobalExceptionHandler(AppProperties properties) {
    this.properties = properties;
  }

  @ExceptionHandler(ApiException.class)
  public ResponseEntity<ErrorResponse> handleApi(ApiException exception, HttpServletRequest request) {
    return respond(request, exception.status(), exception.code(), exception.getMessage(), exception.details());
  }

  @ExceptionHandler(ValidationException.class)
  public ResponseEntity<ErrorResponse> handleValidation(ValidationException exception, HttpServletRequest request) {
    return validationError(request, exception);
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<ErrorResponse> handleBeanValidation(MethodArgumentNotValidException exception,
      HttpServletRequest request) {
    ValidationException validation = new ValidationException();
    exception.getBindingResult().getFieldErrors()
        .forEach(error -> validation.addFieldError(error.getField(), error.getDefaultMessage()));
    exception.getBindingResult().getGlobalErrors()
        .forEach(error -> validation.addFormError(error.getDefaultMessage()));
    return validationError(request, validation);
  }

  @ExceptionHandler(HttpMessageNotReadableException.class)
  public ResponseEntity<ErrorResponse> handleUnreadable(HttpMessageNotReadableException exception,
      HttpServletRequest request) {
    ValidationException invalidPath = invalidPathIds(request);
    return validationError(request, invalidPath != null ? invalidPath : RequestBodies.describe(exception));
  }

  /** Express validated path params before the body, so a bad id wins over an unreadable body. */
  private static ValidationException invalidPathIds(HttpServletRequest request) {
    if (!(request.getAttribute(HandlerMapping.URI_TEMPLATE_VARIABLES_ATTRIBUTE) instanceof Map<?, ?> variables)) {
      return null;
    }
    ValidationException errors = new ValidationException();
    variables.forEach((name, value) -> {
      if (value instanceof String text && !Patterns.isCuid(text)) {
        errors.addFieldError(String.valueOf(name), "Invalid cuid");
      }
    });
    return errors.hasErrors() ? errors : null;
  }

  @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
  public ResponseEntity<ErrorResponse> handleMediaType(HttpServletRequest request) {
    return validationError(request, ValidationException.form("Required"));
  }

  @ExceptionHandler({NoResourceFoundException.class, NoHandlerFoundException.class,
      HttpRequestMethodNotSupportedException.class})
  public ResponseEntity<ErrorResponse> handleNotFound(HttpServletRequest request) {
    return respond(request, 404, "ROUTE_NOT_FOUND", routeNotFoundMessage(request), null);
  }

  @ExceptionHandler(DataIntegrityViolationException.class)
  public ResponseEntity<ErrorResponse> handleIntegrity(DataIntegrityViolationException exception,
      HttpServletRequest request) {
    String constraint = constraintName(exception);
    String sqlState = sqlState(exception);
    if ("23503".equals(sqlState)) {
      return respond(request, 400, "FOREIGN_KEY_CONSTRAINT", "Related record does not exist.",
          Map.of("field", constraint == null ? "unknown" : constraint));
    }
    if ("23505".equals(sqlState)) {
      List<String> target = constraint == null ? List.of() : UNIQUE_TARGETS.getOrDefault(constraint, List.of(constraint));
      return respond(request, 409, "CONFLICT", "A record with this unique value already exists.",
          Map.of("target", target));
    }
    return handleUnexpected(exception, request);
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<ErrorResponse> handleUnexpected(Exception exception, HttpServletRequest request) {
    log.error("Unhandled request error", exception);
    String message = properties.isProduction() ? "An unexpected error occurred." : exception.toString();
    return respond(request, 500, "INTERNAL_SERVER_ERROR", message, null);
  }

  public static String routeNotFoundMessage(HttpServletRequest request) {
    String query = request.getQueryString();
    String url = request.getRequestURI() + (query == null ? "" : "?" + query);
    return "Route " + request.getMethod() + " " + url + " was not found.";
  }

  private ResponseEntity<ErrorResponse> validationError(HttpServletRequest request, ValidationException exception) {
    return respond(request, 400, "VALIDATION_ERROR", "The request is invalid.", exception.details());
  }

  private ResponseEntity<ErrorResponse> respond(HttpServletRequest request, int status, String code, String message,
      Object details) {
    return ResponseEntity.status(status)
        .body(ErrorResponse.of(code, message, details, RequestIdFilter.currentId(request)));
  }

  private static String constraintName(DataIntegrityViolationException exception) {
    Throwable cause = exception;
    while (cause != null) {
      if (cause instanceof ConstraintViolationException violation && violation.getConstraintName() != null) {
        return violation.getConstraintName().replace("\"", "");
      }
      cause = cause.getCause();
    }
    return null;
  }

  private static String sqlState(DataIntegrityViolationException exception) {
    Throwable cause = exception;
    while (cause != null) {
      if (cause instanceof java.sql.SQLException sql && sql.getSQLState() != null) {
        return sql.getSQLState();
      }
      cause = cause.getCause();
    }
    return null;
  }
}
