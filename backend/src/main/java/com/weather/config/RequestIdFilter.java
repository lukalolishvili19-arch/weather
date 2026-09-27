package com.weather.config;

import java.io.IOException;
import java.util.UUID;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/** Propagates or generates {@code X-Request-Id}; the id is echoed in every error body. */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class RequestIdFilter extends OncePerRequestFilter {

  public static final String HEADER = "X-Request-Id";
  public static final String ATTRIBUTE = RequestIdFilter.class.getName() + ".id";

  public static String currentId(HttpServletRequest request) {
    Object value = request.getAttribute(ATTRIBUTE);
    return value == null ? null : value.toString();
  }

  @Override
  protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
      throws ServletException, IOException {
    String incoming = request.getHeader(HEADER);
    String requestId = incoming == null || incoming.isBlank() ? UUID.randomUUID().toString() : incoming;
    request.setAttribute(ATTRIBUTE, requestId);
    response.setHeader(HEADER, requestId);
    MDC.put("requestId", requestId);
    try {
      chain.doFilter(request, response);
    } finally {
      MDC.remove("requestId");
    }
  }
}
