package com.weather.service;

import com.weather.exception.ApiException;

/**
 * The Node API let any authenticated user read and modify every user's records through the
 * generic (non-{@code /me}) routes. Those routes are kept, but restricted to the caller's own data.
 */
final class Ownership {

  private Ownership() {
  }

  static void require(String ownerId, String currentUserId, String resource) {
    if (!ownerId.equals(currentUserId)) {
      throw new ApiException(403, "FORBIDDEN", "You cannot access this " + resource + ".");
    }
  }
}
