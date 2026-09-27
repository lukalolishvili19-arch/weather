package com.weather.controller;

import jakarta.servlet.RequestDispatcher;
import jakarta.servlet.http.HttpServletRequest;

import com.weather.config.RequestIdFilter;
import com.weather.dto.ErrorResponse;

import org.springframework.boot.webmvc.error.ErrorController;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Container-level error dispatches (errors raised outside controllers) in the API error shape. */
@RestController
public class ApiErrorController implements ErrorController {

  @RequestMapping("/error")
  public ResponseEntity<ErrorResponse> error(HttpServletRequest request) {
    Object statusAttribute = request.getAttribute(RequestDispatcher.ERROR_STATUS_CODE);
    int status = statusAttribute instanceof Integer value ? value : 500;
    String requestId = RequestIdFilter.currentId(request);

    ErrorResponse body = switch (status) {
      case 404 -> {
        Object uri = request.getAttribute(RequestDispatcher.ERROR_REQUEST_URI);
        String path = uri instanceof String text ? text : request.getRequestURI();
        yield ErrorResponse.of("ROUTE_NOT_FOUND",
            "Route " + request.getMethod() + " " + path + " was not found.", null, requestId);
      }
      case 401 -> ErrorResponse.of("UNAUTHORIZED", "Authentication is required.", null, requestId);
      case 403 -> ErrorResponse.of("FORBIDDEN", "You cannot access this resource.", null, requestId);
      case 413 -> ErrorResponse.of("PAYLOAD_TOO_LARGE", "Request body is too large.", null, requestId);
      default -> {
        status = status >= 400 && status < 500 ? status : 500;
        yield status == 500
            ? ErrorResponse.of("INTERNAL_SERVER_ERROR", "An unexpected error occurred.", null, requestId)
            : ErrorResponse.of("BAD_REQUEST", "The request could not be processed.", null, requestId);
      }
    };
    return ResponseEntity.status(status).body(body);
  }
}
