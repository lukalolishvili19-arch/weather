package com.weather.security;

import com.weather.exception.ApiException;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public final class CurrentUser {

  private CurrentUser() {
  }

  public static AuthenticatedUser require() {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    if (authentication != null && authentication.getPrincipal() instanceof AuthenticatedUser user) {
      return user;
    }
    throw ApiException.unauthorized();
  }

  public static String id() {
    return require().id();
  }
}
