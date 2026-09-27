package com.weather.service;

import java.time.LocalDateTime;
import java.util.Locale;
import java.util.UUID;

import com.weather.dto.AuthDtos.AuthResult;
import com.weather.dto.AuthDtos.LoginRequest;
import com.weather.dto.AuthDtos.RegisterRequest;
import com.weather.dto.AuthDtos.UpdateProfileRequest;
import com.weather.dto.PublicUser;
import com.weather.entity.RefreshToken;
import com.weather.entity.Timestamps;
import com.weather.entity.User;
import com.weather.entity.UserSettings;
import com.weather.exception.ApiException;
import com.weather.mapper.EntityMapper;
import com.weather.repository.RefreshTokenRepository;
import com.weather.repository.UserRepository;
import com.weather.repository.UserSettingsRepository;
import com.weather.security.JwtService;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

  public record SessionMeta(String userAgent, String ipAddress) {
  }

  private final UserRepository users;
  private final UserSettingsRepository settings;
  private final RefreshTokenRepository refreshTokens;
  private final PasswordEncoder passwordEncoder;
  private final JwtService jwtService;
  private final EntityMapper mapper;

  public AuthService(UserRepository users, UserSettingsRepository settings, RefreshTokenRepository refreshTokens,
      PasswordEncoder passwordEncoder, JwtService jwtService, EntityMapper mapper) {
    this.users = users;
    this.settings = settings;
    this.refreshTokens = refreshTokens;
    this.passwordEncoder = passwordEncoder;
    this.jwtService = jwtService;
    this.mapper = mapper;
  }

  @Transactional
  public AuthResult register(RegisterRequest input, SessionMeta meta) {
    String email = input.email().toLowerCase(Locale.ROOT);
    if (users.findByEmail(email).isPresent()) {
      throw new ApiException(409, "EMAIL_IN_USE", "An account with this email already exists.");
    }

    User user = new User();
    user.setEmail(email);
    user.setPasswordHash(passwordEncoder.encode(input.password()));
    user.setName(input.name());
    users.saveAndFlush(user);
    UserSettings userSettings = settings.saveAndFlush(new UserSettings(user.getId()));

    return issueSession(user, userSettings, meta);
  }

  @Transactional
  public AuthResult login(LoginRequest input, SessionMeta meta) {
    User user = users.findByEmail(input.email().toLowerCase(Locale.ROOT)).orElseThrow(AuthService::invalidCredentials);
    if (user.getPasswordHash() == null || !passwordEncoder.matches(input.password(), user.getPasswordHash())) {
      throw invalidCredentials();
    }
    return issueSession(user, settings.findByUserId(user.getId()).orElse(null), meta);
  }

  @Transactional
  public AuthResult refresh(String refreshToken, SessionMeta meta) {
    JwtService.RefreshClaims claims;
    try {
      claims = jwtService.verifyRefreshToken(refreshToken);
    } catch (JwtService.InvalidTokenException exception) {
      throw invalidRefreshToken();
    }

    RefreshToken stored = refreshTokens.findById(claims.tokenId()).orElseThrow(AuthService::invalidRefreshToken);
    LocalDateTime now = Timestamps.now();
    if (stored.getRevokedAt() != null
        || !stored.getExpiresAt().isAfter(now)
        || !stored.getTokenHash().equals(JwtService.hashToken(refreshToken))
        || !stored.getUserId().equals(claims.userId())) {
      throw invalidRefreshToken();
    }
    if (refreshTokens.revokeIfActive(stored.getId(), now) == 0) {
      throw invalidRefreshToken();
    }

    User user = users.findById(stored.getUserId()).orElseThrow(AuthService::invalidRefreshToken);
    return issueSession(user, settings.findByUserId(user.getId()).orElse(null), meta);
  }

  @Transactional
  public void logout(String refreshToken) {
    if (refreshToken == null) {
      return;
    }
    try {
      JwtService.RefreshClaims claims = jwtService.verifyRefreshToken(refreshToken);
      refreshTokens.revokeIfActive(claims.tokenId(), Timestamps.now());
    } catch (JwtService.InvalidTokenException ignored) {
      // Invalid tokens are ignored on logout, as before.
    }
  }

  @Transactional(readOnly = true)
  public PublicUser getProfile(String userId) {
    User user = users.findById(userId)
        .orElseThrow(() -> new ApiException(404, "USER_NOT_FOUND", "User was not found."));
    return mapper.toPublicUser(user, settings.findByUserId(userId).orElse(null));
  }

  @Transactional
  public PublicUser updateProfile(String userId, UpdateProfileRequest input) {
    User user = users.findById(userId)
        .orElseThrow(() -> new ApiException(404, "NOT_FOUND", "The requested record was not found."));
    if (input.has("name")) {
      user.setName(input.getName());
    }
    if (input.has("avatarUrl")) {
      user.setAvatarUrl(input.getAvatarUrl());
    }
    user.touch();
    users.saveAndFlush(user);
    return mapper.toPublicUser(user, settings.findByUserId(userId).orElse(null));
  }

  private AuthResult issueSession(User user, UserSettings userSettings, SessionMeta meta) {
    String tokenId = UUID.randomUUID().toString();
    String refreshToken = jwtService.signRefreshToken(user.getId(), tokenId);
    LocalDateTime expiresAt = Timestamps.now().plus(jwtService.refreshTtl());
    refreshTokens.save(new RefreshToken(tokenId, user.getId(), JwtService.hashToken(refreshToken), expiresAt,
        meta.userAgent(), meta.ipAddress()));

    String accessToken = jwtService.signAccessToken(user.getId(), user.getEmail());
    return new AuthResult(mapper.toPublicUser(user, userSettings), accessToken, refreshToken);
  }

  private static ApiException invalidCredentials() {
    return new ApiException(401, "INVALID_CREDENTIALS", "Invalid email or password.");
  }

  private static ApiException invalidRefreshToken() {
    return new ApiException(401, "INVALID_REFRESH_TOKEN", "Refresh token is invalid or expired.");
  }
}
