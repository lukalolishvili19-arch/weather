package com.weather.config;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.util.concurrent.atomic.AtomicInteger;

import com.weather.exception.ErrorResponseWriter;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import tools.jackson.databind.json.JsonMapper;

class RateLimitFilterTest {

  private final MutableClock clock = new MutableClock(Instant.parse("2026-09-27T12:00:05Z"));
  private final RateLimitFilter filter = new RateLimitFilter(
      new RateLimitProperties(3, 5), new ErrorResponseWriter(JsonMapper.builder().build()), clock);

  @Test
  void loginAttemptsAreLimitedPerIpAndWindow() throws Exception {
    for (int attempt = 0; attempt < 3; attempt++) {
      assertThat(send("POST", "/api/v1/auth/login", "10.0.0.1").getStatus()).isEqualTo(200);
    }
    MockHttpServletResponse blocked = send("POST", "/api/v1/auth/login", "10.0.0.1");
    assertThat(blocked.getStatus()).isEqualTo(429);
    assertThat(blocked.getHeader("Retry-After")).isEqualTo("55");
    assertThat(blocked.getContentAsString()).contains("\"code\":\"RATE_LIMITED\"");

    assertThat(send("POST", "/api/v1/auth/login", "10.0.0.2").getStatus()).isEqualTo(200);

    clock.advanceSeconds(60);
    assertThat(send("POST", "/api/v1/auth/login", "10.0.0.1").getStatus()).isEqualTo(200);
  }

  @Test
  void registerSharesTheAuthBudgetButRefreshIsNotLimited() throws Exception {
    for (int attempt = 0; attempt < 3; attempt++) {
      send("POST", "/api/v1/auth/register", "10.0.0.3");
    }
    assertThat(send("POST", "/api/v1/auth/login", "10.0.0.3").getStatus()).isEqualTo(429);
    assertThat(send("POST", "/api/v1/auth/refresh", "10.0.0.3").getStatus()).isEqualTo(200);
  }

  @Test
  void publicWeatherRoutesHaveTheirOwnBudget() throws Exception {
    for (int attempt = 0; attempt < 5; attempt++) {
      assertThat(send("GET", "/api/v1/weather/current", "10.0.0.4").getStatus()).isEqualTo(200);
    }
    assertThat(send("GET", "/api/v1/locations/autocomplete", "10.0.0.4").getStatus()).isEqualTo(429);
    assertThat(send("OPTIONS", "/api/v1/weather/current", "10.0.0.4").getStatus()).isEqualTo(200);
    assertThat(send("GET", "/api/v1/favorites/me", "10.0.0.4").getStatus()).isEqualTo(200);
    assertThat(send("POST", "/api/v1/auth/login", "10.0.0.4").getStatus()).isEqualTo(200);
  }

  @Test
  void clientIpComesFromTheRightMostForwardedHop() throws Exception {
    for (int attempt = 0; attempt < 3; attempt++) {
      MockHttpServletRequest request = request("POST", "/api/v1/auth/login", "10.0.0.9");
      request.addHeader("X-Forwarded-For", "1.1.1." + attempt + ", 203.0.113.7");
      filter.doFilter(request, new MockHttpServletResponse(), new MockFilterChain());
    }
    MockHttpServletRequest spoofed = request("POST", "/api/v1/auth/login", "10.0.0.9");
    spoofed.addHeader("X-Forwarded-For", "8.8.8.8, 203.0.113.7");
    MockHttpServletResponse response = new MockHttpServletResponse();
    filter.doFilter(spoofed, response, new MockFilterChain());
    assertThat(response.getStatus()).isEqualTo(429);
  }

  private MockHttpServletResponse send(String method, String path, String ip) throws Exception {
    MockHttpServletResponse response = new MockHttpServletResponse();
    filter.doFilter(request(method, path, ip), response, new MockFilterChain());
    return response;
  }

  private static MockHttpServletRequest request(String method, String path, String ip) {
    MockHttpServletRequest request = new MockHttpServletRequest(method, path);
    request.setRemoteAddr(ip);
    return request;
  }

  private static final class MutableClock extends Clock {
    private final AtomicInteger offsetSeconds = new AtomicInteger();
    private final Instant start;

    MutableClock(Instant start) {
      this.start = start;
    }

    void advanceSeconds(int seconds) {
      offsetSeconds.addAndGet(seconds);
    }

    @Override
    public ZoneId getZone() {
      return ZoneId.of("UTC");
    }

    @Override
    public Clock withZone(ZoneId zone) {
      return this;
    }

    @Override
    public Instant instant() {
      return start.plusSeconds(offsetSeconds.get());
    }
  }
}
