package com.weather.controller;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Map;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import com.weather.config.AppProperties;
import com.weather.dto.ApiResponse;
import com.weather.dto.AuthDtos.AuthResult;
import com.weather.dto.AuthDtos.LoginRequest;
import com.weather.dto.AuthDtos.RegisterRequest;
import com.weather.dto.AuthDtos.UpdateProfileRequest;
import com.weather.dto.PublicUser;
import com.weather.exception.ApiException;
import com.weather.exception.ValidationException;
import com.weather.security.ClientIp;
import com.weather.security.CurrentUser;
import com.weather.security.JwtService;
import com.weather.service.AuthService;
import com.weather.service.AuthService.SessionMeta;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import tools.jackson.core.JacksonException;
import tools.jackson.databind.json.JsonMapper;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

  private static final String COOKIE_PATH = "/api/v1/auth";

  private final AuthService authService;
  private final JwtService jwtService;
  private final RequestValidator validator;
  private final JsonMapper jsonMapper;
  private final AppProperties properties;

  public AuthController(AuthService authService, JwtService jwtService, RequestValidator validator,
      JsonMapper jsonMapper, AppProperties properties) {
    this.authService = authService;
    this.jwtService = jwtService;
    this.validator = validator;
    this.jsonMapper = jsonMapper;
    this.properties = properties;
  }

  @PostMapping("/register")
  @ResponseStatus(HttpStatus.CREATED)
  public ApiResponse<AuthResult> register(@RequestBody(required = false) RegisterRequest body,
      HttpServletRequest request, HttpServletResponse response) {
    AuthResult result = authService.register(validator.body(body), meta(request));
    setRefreshCookie(response, result.refreshToken());
    return ApiResponse.of(result);
  }

  @PostMapping("/login")
  public ApiResponse<AuthResult> login(@RequestBody(required = false) LoginRequest body,
      HttpServletRequest request, HttpServletResponse response) {
    AuthResult result = authService.login(validator.body(body), meta(request));
    setRefreshCookie(response, result.refreshToken());
    return ApiResponse.of(result);
  }

  @PostMapping("/refresh")
  public ApiResponse<AuthResult> refresh(HttpServletRequest request, HttpServletResponse response) {
    String refreshToken = readRefreshToken(request);
    if (refreshToken == null) {
      throw new ApiException(401, "REFRESH_TOKEN_REQUIRED", "Refresh token is required.");
    }
    AuthResult result = authService.refresh(refreshToken, meta(request));
    setRefreshCookie(response, result.refreshToken());
    return ApiResponse.of(result);
  }

  @PostMapping("/logout")
  public ApiResponse<Map<String, Object>> logout(HttpServletRequest request, HttpServletResponse response) {
    authService.logout(readRefreshToken(request));
    response.addHeader(HttpHeaders.SET_COOKIE, cookie("").maxAge(0).build().toString());
    return ApiResponse.of(Map.of("success", true));
  }

  @GetMapping("/profile")
  public ApiResponse<PublicUser> profile() {
    return ApiResponse.of(authService.getProfile(CurrentUser.id()));
  }

  @PatchMapping("/profile")
  public ApiResponse<PublicUser> updateProfile(@RequestBody(required = false) UpdateProfileRequest body) {
    String userId = CurrentUser.id();
    return ApiResponse.of(authService.updateProfile(userId, validator.body(body)));
  }

  private void setRefreshCookie(HttpServletResponse response, String token) {
    response.addHeader(HttpHeaders.SET_COOKIE,
        cookie(token).maxAge(jwtService.refreshTtl()).build().toString());
  }

  private ResponseCookie.ResponseCookieBuilder cookie(String value) {
    boolean production = properties.isProduction();
    return ResponseCookie.from(properties.refreshCookieName(), value)
        .httpOnly(true)
        .secure(production)
        .sameSite(production ? "None" : "Lax")
        .path(COOKIE_PATH);
  }

  /** Cookie first, then {@code body.refreshToken} (JSON or urlencoded), as in the Node API. */
  private String readRefreshToken(HttpServletRequest request) {
    Cookie[] cookies = request.getCookies();
    if (cookies != null) {
      for (Cookie cookie : cookies) {
        if (cookie.getName().equals(properties.refreshCookieName()) && !cookie.getValue().isEmpty()) {
          return cookie.getValue();
        }
      }
    }

    String contentType = request.getContentType();
    if (contentType == null) {
      return null;
    }
    if (contentType.toLowerCase().startsWith("application/x-www-form-urlencoded")) {
      return nonEmpty(request.getParameter("refreshToken"));
    }
    if (!contentType.toLowerCase().contains("json")) {
      return null;
    }
    try {
      String raw = new String(request.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
      if (raw.isBlank()) {
        return null;
      }
      Object body = jsonMapper.readValue(raw, Object.class);
      return body instanceof Map<?, ?> map && map.get("refreshToken") instanceof String token ? nonEmpty(token) : null;
    } catch (JacksonException exception) {
      throw ValidationException.form("Malformed JSON body");
    } catch (IOException exception) {
      throw new IllegalStateException("Failed to read request body", exception);
    }
  }

  private static String nonEmpty(String value) {
    return value == null || value.isEmpty() ? null : value;
  }

  private static SessionMeta meta(HttpServletRequest request) {
    return new SessionMeta(nonEmpty(request.getHeader(HttpHeaders.USER_AGENT)), ClientIp.resolve(request));
  }
}
