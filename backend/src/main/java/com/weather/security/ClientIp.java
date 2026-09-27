package com.weather.security;

import jakarta.servlet.http.HttpServletRequest;

public final class ClientIp {

  private ClientIp() {
  }

  /** Express {@code trust proxy 1}: the right-most {@code X-Forwarded-For} hop, else the socket address. */
  public static String resolve(HttpServletRequest request) {
    String forwarded = request.getHeader("X-Forwarded-For");
    if (forwarded != null && !forwarded.isBlank()) {
      String[] hops = forwarded.split(",");
      String last = hops[hops.length - 1].trim();
      if (!last.isEmpty()) {
        return last;
      }
    }
    String remote = request.getRemoteAddr();
    return remote == null || remote.isEmpty() ? null : remote;
  }
}
