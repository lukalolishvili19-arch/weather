package com.weather.security;

import java.io.IOException;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import com.weather.exception.ErrorResponseWriter;

import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

@Component
public class RestAuthenticationEntryPoint implements AuthenticationEntryPoint {

  private final ErrorResponseWriter writer;

  public RestAuthenticationEntryPoint(ErrorResponseWriter writer) {
    this.writer = writer;
  }

  @Override
  public void commence(HttpServletRequest request, HttpServletResponse response, AuthenticationException exception)
      throws IOException {
    if (Boolean.TRUE.equals(request.getAttribute(JwtAuthenticationFilter.FAILURE_ATTRIBUTE))) {
      writer.write(request, response, 401, "INVALID_ACCESS_TOKEN", "Access token is invalid or expired.");
      return;
    }
    writer.write(request, response, 401, "UNAUTHORIZED", "Authentication is required.");
  }
}
