package com.weather;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import com.weather.support.ApiClient.Result;
import com.weather.support.IntegrationTestSupport;

import org.junit.jupiter.api.Test;

class AuthIntegrationTest extends IntegrationTestSupport {

  @Test
  void healthReportsServiceStatus() {
    Result result = api.get("/api/v1/health", null);

    assertThat(result.status()).isEqualTo(200);
    assertThat(result.json("data.status")).isEqualTo("ok");
    assertThat(result.json("data.service")).isEqualTo("weather-api");
    assertThat(result.json("data.environment")).isEqualTo("test");
    assertThat((String) result.json("data.timestamp")).matches("\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{3}Z");
    assertThat(result.header("X-Request-Id")).isNotBlank();
    assertThat(result.header("X-Content-Type-Options")).isEqualTo("nosniff");
  }

  @Test
  void registerCreatesUserWithSettingsAndSetsRefreshCookie() {
    String email = "Mixed.Case-" + UUID.randomUUID() + "@Example.com";
    Result result = api.post("/api/v1/auth/register",
        Map.of("email", email, "password", PASSWORD, "name", "  Ana  "), null);

    assertThat(result.status()).isEqualTo(201);
    assertThat(result.json("data.user.email")).isEqualTo(email.toLowerCase());
    assertThat(result.json("data.user.name")).isEqualTo("Ana");
    assertThat(result.json("data.user.settings.theme")).isEqualTo("DARK");
    assertThat(result.json("data.user.settings.temperatureUnit")).isEqualTo("CELSIUS");
    assertThat(result.parse().toString()).doesNotContain("passwordHash");
    assertThat((String) result.json("data.accessToken")).contains(".");
    assertThat((String) result.json("data.refreshToken")).contains(".");

    String cookie = result.header("Set-Cookie");
    assertThat(cookie).startsWith("refreshToken=" + result.json("data.refreshToken"))
        .contains("Path=/api/v1/auth", "HttpOnly", "SameSite=Lax", "Max-Age=604800")
        .doesNotContain("Secure");
  }

  @Test
  void registerRejectsDuplicateEmailCaseInsensitively() {
    Session session = register();

    Result result = api.post("/api/v1/auth/register",
        Map.of("email", session.email().toUpperCase(), "password", PASSWORD), null);

    assertThat(result.status()).isEqualTo(409);
    assertThat(result.errorCode()).isEqualTo("EMAIL_IN_USE");
    assertThat(result.json("error.message")).isEqualTo("An account with this email already exists.");
    assertThat(result.json("error.requestId")).isNotNull();
  }

  @Test
  void registerValidatesInputWithZodShapedDetails() {
    Result result = api.post("/api/v1/auth/register", Map.of("email", "not-an-email", "password", "short"), null);

    assertThat(result.status()).isEqualTo(400);
    assertThat(result.errorCode()).isEqualTo("VALIDATION_ERROR");
    assertThat(result.json("error.message")).isEqualTo("The request is invalid.");
    assertThat(result.json("error.details.formErrors")).isEqualTo(List.of());
    assertThat(result.json("error.details.fieldErrors.email")).isEqualTo(List.of("Invalid email"));
    assertThat(result.json("error.details.fieldErrors.password"))
        .isEqualTo(List.of("String must contain at least 8 character(s)"));
  }

  @Test
  void missingOrMalformedBodiesAreValidationErrors() {
    Result missing = api.request("POST", "/api/v1/auth/login").send();
    assertThat(missing.status()).isEqualTo(400);
    assertThat(missing.json("error.details.formErrors")).isEqualTo(List.of("Required"));

    Result malformed = api.request("POST", "/api/v1/auth/login").raw("{\"email\":", "application/json").send();
    assertThat(malformed.status()).isEqualTo(400);
    assertThat(malformed.errorCode()).isEqualTo("VALIDATION_ERROR");

    Result wrongType = api.post("/api/v1/auth/login", Map.of("email", 42, "password", PASSWORD), null);
    assertThat(wrongType.status()).isEqualTo(400);
    assertThat(wrongType.errorCode()).isEqualTo("VALIDATION_ERROR");
  }

  @Test
  void loginAcceptsValidCredentialsAndRejectsInvalidOnes() {
    Session session = register();

    Result ok = api.post("/api/v1/auth/login", Map.of("email", session.email(), "password", PASSWORD), null);
    assertThat(ok.status()).isEqualTo(200);
    assertThat(ok.json("data.user.id")).isEqualTo(session.userId());
    assertThat(ok.header("Set-Cookie")).startsWith("refreshToken=");

    Result wrongPassword = api.post("/api/v1/auth/login",
        Map.of("email", session.email(), "password", "Wrong-password"), null);
    assertThat(wrongPassword.status()).isEqualTo(401);
    assertThat(wrongPassword.errorCode()).isEqualTo("INVALID_CREDENTIALS");
    assertThat(wrongPassword.json("error.message")).isEqualTo("Invalid email or password.");

    Result unknown = api.post("/api/v1/auth/login",
        Map.of("email", "nobody-" + UUID.randomUUID() + "@example.com", "password", PASSWORD), null);
    assertThat(unknown.status()).isEqualTo(401);
    assertThat(unknown.errorCode()).isEqualTo("INVALID_CREDENTIALS");
  }

  @Test
  void protectedRoutesRequireValidAccessToken() {
    Result missing = api.get("/api/v1/auth/profile", null);
    assertThat(missing.status()).isEqualTo(401);
    assertThat(missing.errorCode()).isEqualTo("UNAUTHORIZED");
    assertThat(missing.json("error.message")).isEqualTo("Authentication is required.");

    Result invalid = api.get("/api/v1/favorites/me", "not-a-token");
    assertThat(invalid.status()).isEqualTo(401);
    assertThat(invalid.errorCode()).isEqualTo("INVALID_ACCESS_TOKEN");
    assertThat(invalid.json("error.message")).isEqualTo("Access token is invalid or expired.");

    Session session = register();
    Result refreshAsAccess = api.get("/api/v1/auth/profile", session.refreshToken());
    assertThat(refreshAsAccess.status()).isEqualTo(401);
    assertThat(refreshAsAccess.errorCode()).isEqualTo("INVALID_ACCESS_TOKEN");

    Result unknownProtected = api.get("/api/v1/favorites/unknown/route/here", null);
    assertThat(unknownProtected.status()).isEqualTo(401);
  }

  @Test
  void profileCanBeReadAndPartiallyUpdated() {
    Session session = register();

    Result profile = api.get("/api/v1/auth/profile", session.accessToken());
    assertThat(profile.status()).isEqualTo(200);
    assertThat(profile.json("data.email")).isEqualTo(session.email());
    assertThat(profile.json("data.settings")).isNotNull();

    Result empty = api.patch("/api/v1/auth/profile", Map.of(), session.accessToken());
    assertThat(empty.status()).isEqualTo(400);
    assertThat(empty.json("error.details.formErrors")).isEqualTo(List.of("At least one field is required"));

    Result badUrl = api.patch("/api/v1/auth/profile", Map.of("avatarUrl", "not a url"), session.accessToken());
    assertThat(badUrl.status()).isEqualTo(400);
    assertThat(badUrl.json("error.details.fieldErrors.avatarUrl")).isEqualTo(List.of("Invalid url"));

    Result updated = api.patch("/api/v1/auth/profile",
        Map.of("name", "Nino", "avatarUrl", "https://example.com/a.png"), session.accessToken());
    assertThat(updated.status()).isEqualTo(200);
    assertThat(updated.json("data.name")).isEqualTo("Nino");
    assertThat(updated.json("data.avatarUrl")).isEqualTo("https://example.com/a.png");

    Map<String, Object> clear = new java.util.HashMap<>();
    clear.put("avatarUrl", null);
    Result cleared = api.patch("/api/v1/auth/profile", clear, session.accessToken());
    assertThat(cleared.status()).isEqualTo(200);
    assertThat(cleared.json("data.avatarUrl")).isNull();
    assertThat(cleared.json("data.name")).isEqualTo("Nino");
  }

  @Test
  void refreshRotatesTokensAndRejectsReuse() {
    Session session = register();
    String cookiePair = session.cookie().split(";")[0];

    Result viaCookie = api.request("POST", "/api/v1/auth/refresh").header("Cookie", cookiePair).send();
    assertThat(viaCookie.status()).isEqualTo(200);
    String rotated = (String) viaCookie.json("data.refreshToken");
    assertThat(rotated).isNotEqualTo(session.refreshToken());
    assertThat(viaCookie.header("Set-Cookie")).startsWith("refreshToken=" + rotated);

    Result reuse = api.post("/api/v1/auth/refresh", Map.of("refreshToken", session.refreshToken()), null);
    assertThat(reuse.status()).isEqualTo(401);
    assertThat(reuse.errorCode()).isEqualTo("INVALID_REFRESH_TOKEN");
    assertThat(reuse.json("error.message")).isEqualTo("Refresh token is invalid or expired.");

    Result viaBody = api.post("/api/v1/auth/refresh", Map.of("refreshToken", rotated), null);
    assertThat(viaBody.status()).isEqualTo(200);
    assertThat(viaBody.json("data.user.id")).isEqualTo(session.userId());

    Result missing = api.request("POST", "/api/v1/auth/refresh").send();
    assertThat(missing.status()).isEqualTo(401);
    assertThat(missing.errorCode()).isEqualTo("REFRESH_TOKEN_REQUIRED");

    Result garbage = api.post("/api/v1/auth/refresh", Map.of("refreshToken", "garbage"), null);
    assertThat(garbage.status()).isEqualTo(401);
    assertThat(garbage.errorCode()).isEqualTo("INVALID_REFRESH_TOKEN");
  }

  @Test
  void logoutRevokesRefreshTokenAndClearsCookie() {
    Session session = register();

    Result logout = api.post("/api/v1/auth/logout", Map.of("refreshToken", session.refreshToken()), null);
    assertThat(logout.status()).isEqualTo(200);
    assertThat(logout.json("data.success")).isEqualTo(true);
    assertThat(logout.header("Set-Cookie")).startsWith("refreshToken=;").contains("Max-Age=0", "Path=/api/v1/auth");

    Result refresh = api.post("/api/v1/auth/refresh", Map.of("refreshToken", session.refreshToken()), null);
    assertThat(refresh.status()).isEqualTo(401);
    assertThat(refresh.errorCode()).isEqualTo("INVALID_REFRESH_TOKEN");

    Result anonymous = api.request("POST", "/api/v1/auth/logout").send();
    assertThat(anonymous.status()).isEqualTo(200);
    assertThat(anonymous.json("data.success")).isEqualTo(true);
  }

  @Test
  void unknownRoutesReturnRouteNotFound() {
    Result result = api.get("/api/v1/does-not-exist?x=1", null);

    assertThat(result.status()).isEqualTo(404);
    assertThat(result.errorCode()).isEqualTo("ROUTE_NOT_FOUND");
    assertThat(result.json("error.message")).isEqualTo("Route GET /api/v1/does-not-exist?x=1 was not found.");
  }

  @Test
  void corsAllowsConfiguredOriginsWithCredentialsOnly() {
    Result allowed = api.request("OPTIONS", "/api/v1/auth/login")
        .header("Origin", "https://weather-lac-six.vercel.app")
        .header("Access-Control-Request-Method", "POST")
        .header("Access-Control-Request-Headers", "content-type,authorization")
        .send();
    assertThat(allowed.status()).isIn(200, 204);
    assertThat(allowed.header("Access-Control-Allow-Origin")).isEqualTo("https://weather-lac-six.vercel.app");
    assertThat(allowed.header("Access-Control-Allow-Credentials")).isEqualTo("true");

    Result simple = api.request("GET", "/api/v1/health").header("Origin", "http://localhost:5173").send();
    assertThat(simple.header("Access-Control-Allow-Origin")).isEqualTo("http://localhost:5173");
    assertThat(simple.header("Access-Control-Expose-Headers")).contains("X-Request-Id");

    Result denied = api.request("OPTIONS", "/api/v1/auth/login")
        .header("Origin", "https://evil.example")
        .header("Access-Control-Request-Method", "POST")
        .send();
    assertThat(denied.header("Access-Control-Allow-Origin")).isNull();
  }
}
