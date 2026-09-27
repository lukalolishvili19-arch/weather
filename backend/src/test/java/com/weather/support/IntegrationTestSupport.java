package com.weather.support;

import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.env.Environment;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.postgresql.PostgreSQLContainer;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
public abstract class IntegrationTestSupport {

  public static final String ACCESS_SECRET = "test-access-secret-0123456789-abcdefghijkl";
  public static final String REFRESH_SECRET = "test-refresh-secret-0123456789-abcdefghijk";
  public static final String PASSWORD = "Password123!";

  protected static final PostgreSQLContainer POSTGRES = new PostgreSQLContainer("postgres:17-alpine")
      .withDatabaseName("weather")
      .withUsername("weather")
      .withPassword("weather");

  static {
    POSTGRES.start();
  }

  @Autowired
  private Environment environment;

  protected ApiClient api;

  @DynamicPropertySource
  static void properties(DynamicPropertyRegistry registry) {
    registerCommon(registry, POSTGRES);
  }

  public static void registerCommon(DynamicPropertyRegistry registry, PostgreSQLContainer postgres) {
    String stub = StubUpstreams.get().baseUrl();
    registry.add("app.environment", () -> "test");
    registry.add("app.database-url", () -> databaseUrl(postgres));
    registry.add("app.cors-origins", () -> "http://localhost:5173,https://weather-lac-six.vercel.app");
    registry.add("app.bcrypt-salt-rounds", () -> "10");
    registry.add("app.rate-limit.auth-per-minute", () -> "10000");
    registry.add("app.rate-limit.public-per-minute", () -> "10000");
    registry.add("app.jwt.access-secret", () -> ACCESS_SECRET);
    registry.add("app.jwt.refresh-secret", () -> REFRESH_SECRET);
    registry.add("app.weather.visual-crossing-api-key", () -> "test-key");
    registry.add("app.weather.visual-crossing-base-url", () -> stub + "/vc");
    registry.add("app.weather.open-meteo-forecast-base-url", () -> stub + "/forecast");
    registry.add("app.weather.open-meteo-geocoding-base-url", () -> stub + "/geo");
    registry.add("app.weather.open-meteo-air-quality-base-url", () -> stub + "/aq");
    registry.add("app.weather.nominatim-base-url", () -> stub + "/nominatim");
  }

  public static String databaseUrl(PostgreSQLContainer postgres) {
    return "postgresql://" + postgres.getUsername() + ":" + postgres.getPassword() + "@" + postgres.getHost() + ":"
        + postgres.getMappedPort(5432) + "/" + postgres.getDatabaseName() + "?schema=public";
  }

  @BeforeEach
  void createClient() {
    api = new ApiClient(environment.getRequiredProperty("local.server.port", Integer.class));
  }

  protected record Session(String userId, String email, String accessToken, String refreshToken, String cookie) {
  }

  protected Session register() {
    String email = "user-" + UUID.randomUUID() + "@example.com";
    ApiClient.Result result = api.post("/api/v1/auth/register", Map.of("email", email, "password", PASSWORD), null);
    if (result.status() != 201) {
      throw new AssertionError("Registration failed: " + result.body());
    }
    return new Session(
        (String) result.json("data.user.id"),
        email,
        (String) result.json("data.accessToken"),
        (String) result.json("data.refreshToken"),
        result.header("Set-Cookie"));
  }
}
