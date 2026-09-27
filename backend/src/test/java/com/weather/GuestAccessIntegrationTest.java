package com.weather;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Map;

import com.weather.support.ApiClient.Result;
import com.weather.support.IntegrationTestSupport;

import org.junit.jupiter.api.Test;

/** Weather is public; personal data stays behind authentication and per-user ownership. */
class GuestAccessIntegrationTest extends IntegrationTestSupport {

  private static final List<String> PUBLIC_GETS = List.of(
      "/api/v1/weather/current?location=GuestCity",
      "/api/v1/weather/hourly?location=GuestCity&hours=24",
      "/api/v1/weather/daily?location=GuestCity&days=7",
      "/api/v1/weather/historical?location=GuestCity&startDate=2026-01-01&endDate=2026-01-03",
      "/api/v1/weather/alerts?location=AlertCity",
      "/api/v1/weather/air-quality?location=Testville",
      "/api/v1/weather/map-config",
      "/api/v1/locations/autocomplete?q=Tbil",
      "/api/v1/locations/suggestions?limit=3");

  private static final List<String> PERSONAL_GETS = List.of(
      "/api/v1/auth/profile",
      "/api/v1/favorites/me",
      "/api/v1/search-history/me",
      "/api/v1/notifications/me",
      "/api/v1/user-settings/me",
      "/api/v1/users");

  @Test
  void guestsCanUseEveryWeatherAndLocationRoute() {
    for (String path : PUBLIC_GETS) {
      Result result = api.get(path, null);
      assertThat(result.status()).as(path).isEqualTo(200);
      assertThat(result.json("data")).as(path).isNotNull();
    }
    Result resolve = api.post("/api/v1/locations/resolve", Map.of("q", "Tbilisi"), null);
    assertThat(resolve.status()).isEqualTo(200);
    assertThat(resolve.json("data.name")).isEqualTo("Tbilisi");
  }

  @Test
  void staleOrInvalidTokensDoNotBreakPublicRoutes() {
    Session session = register();
    for (String token : List.of("not-a-token", session.refreshToken(), session.accessToken())) {
      Result result = api.get("/api/v1/weather/current?location=GuestCity", token);
      assertThat(result.status()).isEqualTo(200);
    }
  }

  @Test
  void publicRoutesKeepTheirValidationErrors() {
    Result missing = api.get("/api/v1/weather/current", null);
    assertThat(missing.status()).isEqualTo(400);
    assertThat(missing.errorCode()).isEqualTo("VALIDATION_ERROR");
  }

  @Test
  void guestsCannotReadOrWritePersonalData() {
    for (String path : PERSONAL_GETS) {
      Result result = api.get(path, null);
      assertThat(result.status()).as(path).isEqualTo(401);
      assertThat(result.errorCode()).as(path).isEqualTo("UNAUTHORIZED");
    }
    Result addFavorite = api.post("/api/v1/favorites/me",
        Map.of("locationId", "tbilisi", "locationName", "Tbilisi"), null);
    assertThat(addFavorite.status()).isEqualTo(401);
    Result sync = api.post("/api/v1/notifications/me/sync?location=GuestCity", null, null);
    assertThat(sync.status()).isEqualTo(401);
    Result invalid = api.get("/api/v1/user-settings/me", "not-a-token");
    assertThat(invalid.status()).isEqualTo(401);
    assertThat(invalid.errorCode()).isEqualTo("INVALID_ACCESS_TOKEN");
  }

  @Test
  void favoritesWorkForTheirOwnerOnly() {
    Session alice = register();
    Session bob = register();

    Result added = api.post("/api/v1/favorites/me",
        Map.of("locationId", "guest-test-city", "locationName", "Guest Test City", "country", "Georgia"),
        alice.accessToken());
    assertThat(added.status()).isEqualTo(201);
    String favoriteId = (String) added.json("data.id");

    Result aliceList = api.get("/api/v1/favorites/me", alice.accessToken());
    assertThat((List<?>) aliceList.json("data")).hasSize(1);
    Result bobList = api.get("/api/v1/favorites/me", bob.accessToken());
    assertThat((List<?>) bobList.json("data")).isEmpty();

    assertThat(api.get("/api/v1/favorites/" + favoriteId, bob.accessToken()).status()).isEqualTo(403);
    assertThat(api.delete("/api/v1/favorites/me/" + favoriteId, bob.accessToken()).status()).isEqualTo(404);
    assertThat(api.get("/api/v1/users/" + alice.userId(), bob.accessToken()).status()).isEqualTo(403);

    assertThat(api.delete("/api/v1/favorites/me/" + favoriteId, alice.accessToken()).status()).isEqualTo(204);
    assertThat((List<?>) api.get("/api/v1/favorites/me", alice.accessToken()).json("data")).isEmpty();
  }

  @Test
  void passwordsAreNeverReturned() {
    Session session = register();
    List<Result> responses = List.of(
        api.post("/api/v1/auth/login", Map.of("email", session.email(), "password", PASSWORD), null),
        api.get("/api/v1/auth/profile", session.accessToken()),
        api.patch("/api/v1/auth/profile", Map.of("name", "Renamed"), session.accessToken()),
        api.get("/api/v1/users", session.accessToken()),
        api.get("/api/v1/users/" + session.userId(), session.accessToken()));
    for (Result result : responses) {
      assertThat(result.status()).isBetween(200, 201);
      assertThat(result.body()).doesNotContain("password").doesNotContain(PASSWORD).doesNotContain("$2");
    }
  }
}
