package com.weather.config;

import java.io.IOException;
import java.util.Map;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/** Same response headers helmet 8 set with its default configuration on the Node API. */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 1)
public class SecurityHeadersFilter extends OncePerRequestFilter {

  private static final Map<String, String> HEADERS = Map.ofEntries(
      Map.entry("Content-Security-Policy",
          "default-src 'self';base-uri 'self';font-src 'self' https: data:;form-action 'self';"
              + "frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src 'self';"
              + "script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests"),
      Map.entry("Cross-Origin-Opener-Policy", "same-origin"),
      Map.entry("Cross-Origin-Resource-Policy", "same-origin"),
      Map.entry("Origin-Agent-Cluster", "?1"),
      Map.entry("Referrer-Policy", "no-referrer"),
      Map.entry("Strict-Transport-Security", "max-age=31536000; includeSubDomains"),
      Map.entry("X-Content-Type-Options", "nosniff"),
      Map.entry("X-DNS-Prefetch-Control", "off"),
      Map.entry("X-Download-Options", "noopen"),
      Map.entry("X-Frame-Options", "SAMEORIGIN"),
      Map.entry("X-Permitted-Cross-Domain-Policies", "none"),
      Map.entry("X-XSS-Protection", "0"));

  @Override
  protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
      throws ServletException, IOException {
    HEADERS.forEach(response::setHeader);
    chain.doFilter(request, response);
  }
}
