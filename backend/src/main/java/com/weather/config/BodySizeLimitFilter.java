package com.weather.config;

import java.io.IOException;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import com.weather.exception.ErrorResponseWriter;

import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 2)
public class BodySizeLimitFilter extends OncePerRequestFilter {

  static final long MAX_BODY_BYTES = 1024 * 1024;

  private final ErrorResponseWriter writer;

  public BodySizeLimitFilter(ErrorResponseWriter writer) {
    this.writer = writer;
  }

  @Override
  protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
      throws ServletException, IOException {
    if (request.getContentLengthLong() > MAX_BODY_BYTES) {
      writer.write(request, response, 413, "PAYLOAD_TOO_LARGE", "Request body exceeds the 1mb limit.");
      return;
    }
    chain.doFilter(request, response);
  }
}
