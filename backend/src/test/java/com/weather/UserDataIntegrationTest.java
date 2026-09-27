package com.weather;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.weather.support.ApiClient.Result;
import com.weather.support.IntegrationTestSupport;
import com.weather.support.StubUpstreams;

import org.junit.jupiter.api.Test;

class UserDataIntegrationTest extends IntegrationTestSupport {

  @Test
  void settingsAreCreatedOnDemandAndPartiallyUpdated() {
    Session session = register();

    Result settings = api.get("/api/v1/user-settings/me", session.accessToken());
    assertThat(settings.status()).isEqualTo(200);
    assertThat(settings.json("data.userId")).isEqualTo(session.userId());
    assertThat(settings.json("data.language")).isEqualTo("en");
    assertThat(settings.json("data.strongWindAlerts")).isEqualTo(false);

    Result updated = api.patch("/api/v1/user-settings/me",
        Map.of("theme", "LIGHT", "temperatureUnit", "FAHRENHEIT", "language", "ka", "timeFormat24h", false),
        session.accessToken());
    assertThat(updated.status()).isEqualTo(200);
    assertThat(updated.json("data.theme")).isEqualTo("LIGHT");
    assertThat(updated.json("data.temperatureUnit")).isEqualTo("FAHRENHEIT");
    assertThat(updated.json("data.language")).isEqualTo("ka");
    assertThat(updated.json("data.timeFormat24h")).isEqualTo(false);
    assertThat(updated.json("data.windSpeedUnit")).isEqualTo("KMH");

    Result profile = api.get("/api/v1/auth/profile", session.accessToken());
    assertThat(profile.json("data.settings.theme")).isEqualTo("LIGHT");

    assertThat(api.patch("/api/v1/user-settings/me", Map.of("theme", "PURPLE"), session.accessToken()).status())
        .isEqualTo(400);
    assertThat(api.patch("/api/v1/user-settings/me", Map.of("animateCharts", "true"), session.accessToken())
        .errorCode()).isEqualTo("VALIDATION_ERROR");
    Result tooShort = api.patch("/api/v1/user-settings/me", Map.of("language", "k"), session.accessToken());
    assertThat(tooShort.json("error.details.fieldErrors.language"))
        .isEqualTo(List.of("String must contain at least 2 character(s)"));
    Result empty = api.patch("/api/v1/user-settings/me", Map.of(), session.accessToken());
    assertThat(empty.json("error.details.formErrors")).isEqualTo(List.of("At least one field is required"));
  }

  @Test
  void favoritesSupportAddPinOrderAndDelete() {
    Session session = register();
    String token = session.accessToken();

    Result first = api.post("/api/v1/favorites/me",
        Map.of("locationId", "tbilisi", "locationName", "Tbilisi", "country", "Georgia",
            "latitude", 41.0, "longitude", 44.8), token);
    assertThat(first.status()).isEqualTo(201);
    assertThat(first.json("data.isPinned")).isEqualTo(false);
    assertThat(first.json("data.latitude")).isEqualTo(41);
    assertThat(first.body()).contains("\"latitude\":41,");

    Result second = api.post("/api/v1/favorites/me", Map.of("locationId", "batumi", "locationName", "Batumi"), token);
    assertThat(second.status()).isEqualTo(201);
    assertThat(second.json("data.country")).isNull();

    Result duplicate = api.post("/api/v1/favorites/me", Map.of("locationId", "tbilisi", "locationName", "Tbilisi"), token);
    assertThat(duplicate.status()).isEqualTo(409);
    assertThat(duplicate.errorCode()).isEqualTo("FAVORITE_EXISTS");

    String firstId = (String) first.json("data.id");
    Result pinned = api.patch("/api/v1/favorites/me/" + firstId + "/pin", Map.of("isPinned", true), token);
    assertThat(pinned.status()).isEqualTo(200);
    assertThat(pinned.json("data.isPinned")).isEqualTo(true);

    Result list = api.get("/api/v1/favorites/me", token);
    assertThat(list.json("data.0.id")).isEqualTo(firstId);
    assertThat(list.json("data.1.locationId")).isEqualTo("batumi");

    Result badId = api.patch("/api/v1/favorites/me/not-a-cuid/pin", Map.of("isPinned", "yes"), token);
    assertThat(badId.status()).isEqualTo(400);
    assertThat(badId.json("error.details.fieldErrors.id")).isEqualTo(List.of("Invalid cuid"));

    Result missingPin = api.patch("/api/v1/favorites/me/" + firstId + "/pin", Map.of(), token);
    assertThat(missingPin.json("error.details.fieldErrors.isPinned")).isEqualTo(List.of("Required"));

    Session other = register();
    Result foreignDelete = api.delete("/api/v1/favorites/me/" + firstId, other.accessToken());
    assertThat(foreignDelete.status()).isEqualTo(404);
    assertThat(foreignDelete.errorCode()).isEqualTo("FAVORITE_NOT_FOUND");
    Result foreignGet = api.get("/api/v1/favorites/" + firstId, other.accessToken());
    assertThat(foreignGet.status()).isEqualTo(403);
    assertThat(foreignGet.errorCode()).isEqualTo("FORBIDDEN");
    Result foreignList = api.get("/api/v1/favorites?userId=" + session.userId(), other.accessToken());
    assertThat(foreignList.status()).isEqualTo(403);

    Result deleted = api.delete("/api/v1/favorites/me/" + firstId, token);
    assertThat(deleted.status()).isEqualTo(204);
    assertThat(deleted.body()).isEmpty();
    assertThat(api.delete("/api/v1/favorites/me/" + firstId, token).errorCode()).isEqualTo("FAVORITE_NOT_FOUND");
  }

  @Test
  void searchHistoryDeduplicatesAndKeepsNodeLimitBehaviour() {
    Session session = register();
    String token = session.accessToken();

    for (int index = 0; index < 22; index++) {
      assertThat(api.post("/api/v1/search-history/me", Map.of("query", "City " + index), token).status())
          .isEqualTo(201);
    }
    Result again = api.post("/api/v1/search-history/me",
        Map.of("query", "city 0", "locationName", "City Zero", "latitude", 1.5, "longitude", 2.5), token);
    assertThat(again.status()).isEqualTo(201);

    Result list = api.get("/api/v1/search-history/me?limit=100", token);
    assertThat(list.status()).isEqualTo(200);
    List<?> entries = (List<?>) list.json("data");
    assertThat(entries).hasSize(20);
    assertThat(list.json("data.0.query")).isEqualTo("city 0");
    assertThat(list.json("data.0.latitude")).isEqualTo(1.5);
    assertThat(list.body().toLowerCase().split("\"query\":\"city 0\"", -1)).hasSize(2);

    Result invalid = api.get("/api/v1/search-history/me?limit=0", token);
    assertThat(invalid.status()).isEqualTo(400);
    assertThat(invalid.json("error.details.fieldErrors.limit"))
        .isEqualTo(List.of("Number must be greater than or equal to 1"));

    String id = (String) list.json("data.0.id");
    assertThat(api.delete("/api/v1/search-history/me/" + id, token).status()).isEqualTo(204);
    assertThat(api.delete("/api/v1/search-history/me/" + id, token).errorCode()).isEqualTo("SEARCH_HISTORY_NOT_FOUND");
    assertThat(api.delete("/api/v1/search-history/me", token).status()).isEqualTo(204);
    assertThat((List<?>) api.get("/api/v1/search-history/me", token).json("data")).isEmpty();
  }

  @Test
  void notificationSyncCreatesAlertsOnceAndCanBeManaged() {
    Session session = register();
    String token = session.accessToken();
    String location = "SyncCity";

    Result sync = api.post("/api/v1/notifications/me/sync?location=" + location, null, token);
    assertThat(sync.status()).isEqualTo(200);
    assertThat(sync.json("data.createdCount")).isEqualTo(3);

    String tomorrow = StubUpstreams.today().plusDays(1).toString();
    String stormDay = StubUpstreams.today().plusDays(2).toString();
    List<?> notifications = (List<?>) sync.json("data.notifications");
    assertThat(notifications).hasSize(3);
    assertThat(sync.body())
        .contains("80% chance of rain around " + tomorrow + " in " + StubUpstreams.RESOLVED_ADDRESS + ". Pack an umbrella.")
        .contains("Thunderstorm conditions likely. Stormy conditions are indicated around " + stormDay
            + ". Lightning and brief heavy showers are possible.")
        .contains("Highs near 38°C expected in " + StubUpstreams.RESOLVED_ADDRESS + ". Stay hydrated and avoid peak sun.")
        .contains("\"dedupeKey\":\"rain:" + tomorrow + ":" + location + "\"");
    assertThat(sync.json("data.notifications.0.type")).isEqualTo("ALERT");
    assertThat(sync.json("data.notifications.0.read")).isEqualTo(false);

    Result second = api.post("/api/v1/notifications/me/sync?location=" + location, null, token);
    assertThat(second.json("data.createdCount")).isEqualTo(0);
    assertThat((List<?>) second.json("data.notifications")).hasSize(3);

    Result missingLocation = api.post("/api/v1/notifications/me/sync", null, token);
    assertThat(missingLocation.status()).isEqualTo(400);
    assertThat(missingLocation.json("error.details.fieldErrors.location")).isEqualTo(List.of("Required"));

    String id = (String) sync.json("data.notifications.0.id");
    Result read = api.patch("/api/v1/notifications/me/" + id, Map.of("read", true), token);
    assertThat(read.status()).isEqualTo(200);
    assertThat(read.json("data.read")).isEqualTo(true);

    Session other = register();
    Result foreign = api.patch("/api/v1/notifications/me/" + id, Map.of("read", true), other.accessToken());
    assertThat(foreign.status()).isEqualTo(403);
    assertThat(foreign.json("error.message")).isEqualTo("You cannot access this notification.");

    Result cleared = api.delete("/api/v1/notifications/me/read", token);
    assertThat((List<?>) cleared.json("data")).hasSize(2);

    Result allRead = api.patch("/api/v1/notifications/me/read-all", null, token);
    assertThat(allRead.json("data.0.read")).isEqualTo(true);
    assertThat(allRead.json("data.1.read")).isEqualTo(true);

    String remaining = (String) allRead.json("data.0.id");
    assertThat(api.delete("/api/v1/notifications/me/" + remaining, token).status()).isEqualTo(204);
    Result gone = api.delete("/api/v1/notifications/me/" + remaining, token);
    assertThat(gone.status()).isEqualTo(404);
    assertThat(gone.errorCode()).isEqualTo("NOTIFICATION_NOT_FOUND");
  }

  @Test
  void syncHonoursDisabledAlertSettings() {
    Session session = register();
    api.patch("/api/v1/user-settings/me",
        Map.of("rainAlerts", false, "stormWarnings", false, "heatWarnings", false), session.accessToken());

    Result sync = api.post("/api/v1/notifications/me/sync?location=QuietCity", null, session.accessToken());
    assertThat(sync.json("data.createdCount")).isEqualTo(0);
  }

  @Test
  void genericRoutesAreRestrictedToTheCaller() {
    Session owner = register();
    Session other = register();

    Result users = api.get("/api/v1/users", owner.accessToken());
    assertThat((List<?>) users.json("data")).hasSize(1);
    assertThat(users.json("data.0.id")).isEqualTo(owner.userId());

    assertThat(api.get("/api/v1/users/" + other.userId(), owner.accessToken()).status()).isEqualTo(403);
    assertThat(api.patch("/api/v1/users/" + other.userId(), Map.of("name", "x"), owner.accessToken()).status())
        .isEqualTo(403);
    assertThat(api.delete("/api/v1/users/" + other.userId(), owner.accessToken()).status()).isEqualTo(403);
    assertThat(api.post("/api/v1/users", Map.of("email", "new@example.com"), owner.accessToken()).status())
        .isEqualTo(403);

    Result passwordHash = api.patch("/api/v1/users/" + owner.userId(),
        Map.of("passwordHash", "$2b$12$abcdefghijklmnopqrstuv"), owner.accessToken());
    assertThat(passwordHash.status()).isEqualTo(403);

    Result selfUpdate = api.patch("/api/v1/users/" + owner.userId(), Map.of("name", "Owner"), owner.accessToken());
    assertThat(selfUpdate.status()).isEqualTo(200);
    assertThat(selfUpdate.json("data.name")).isEqualTo("Owner");

    Result foreignSettings = api.get("/api/v1/user-settings/by-user/" + other.userId(), owner.accessToken());
    assertThat(foreignSettings.status()).isEqualTo(403);

    Map<String, Object> notification = new HashMap<>();
    notification.put("userId", other.userId());
    notification.put("title", "Hi");
    notification.put("body", "Body");
    assertThat(api.post("/api/v1/notifications", notification, owner.accessToken()).status()).isEqualTo(403);

    notification.put("userId", owner.userId());
    Result own = api.post("/api/v1/notifications", notification, owner.accessToken());
    assertThat(own.status()).isEqualTo(201);
    assertThat(own.json("data.type")).isEqualTo("INFO");
    assertThat(own.json("data.metadata")).isNull();

    Result badCuid = api.get("/api/v1/users/xyz", owner.accessToken());
    assertThat(badCuid.status()).isEqualTo(400);
    assertThat(badCuid.json("error.details.fieldErrors.id")).isEqualTo(List.of("Invalid cuid"));
  }
}
