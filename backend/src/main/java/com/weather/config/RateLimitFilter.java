package com.weather.config;

import java.io.IOException;
import java.time.Clock;
import java.time.Duration;
import java.util.concurrent.atomic.AtomicInteger;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import com.weather.exception.ErrorResponseWriter;
import com.weather.security.ClientIp;

import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Fixed one-minute windows per client IP. Guards password guessing on login/register and the paid
 * weather provider now that weather routes are public. Counters live in memory, so the limit is
 * per instance.
 */
public class RateLimitFilter extends OncePerRequestFilter {

  private static final long WINDOW_MILLIS = Duration.ofMinutes(1).toMillis();

  private final RateLimitProperties properties;
  private final ErrorResponseWriter writer;
  private final Clock clock;
  private final Cache<String, AtomicInteger> windows = Caffeine.newBuilder()
      .expireAfterWrite(Duration.ofMinutes(2))
      .maximumSize(200_000)
      .build();

  public RateLimitFilter(RateLimitProperties properties, ErrorResponseWriter writer, Clock clock) {
    this.properties = properties;
    this.writer = writer;
    this.clock = clock;
  }

  @Override
  protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
      throws ServletException, IOException {
    String bucket = bucket(request);
    int limit = "auth".equals(bucket) ? properties.authPerMinute()
        : "public".equals(bucket) ? properties.publicPerMinute() : 0;
    if (limit <= 0) {
      chain.doFilter(request, response);
      return;
    }

    long now = clock.millis();
    String key = bucket + '|' + ClientIp.resolve(request) + '|' + (now / WINDOW_MILLIS);
    int count = windows.get(key, ignored -> new AtomicInteger()).incrementAndGet();
    if (count > limit) {
      long retryAfterSeconds = Math.max(1, (WINDOW_MILLIS - now % WINDOW_MILLIS + 999) / 1000);
      response.setHeader("Retry-After", Long.toString(retryAfterSeconds));
      writer.write(request, response, 429, "RATE_LIMITED", "Too many requests. Please try again later.");
      return;
    }
    chain.doFilter(request, response);
  }

  private static String bucket(HttpServletRequest request) {
    String path = request.getRequestURI();
    if ("POST".equals(request.getMethod())
        && ("/api/v1/auth/login".equals(path) || "/api/v1/auth/register".equals(path))) {
      return "auth";
    }
    if (!"OPTIONS".equals(request.getMethod())
        && (path.startsWith("/api/v1/weather/") || path.startsWith("/api/v1/locations/"))) {
      return "public";
    }
    return null;
  }
}
