package com.weather;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Map;

import com.weather.support.ApiClient.Result;
import com.weather.support.IntegrationTestSupport;
import com.weather.support.StubUpstreams;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class WeatherIntegrationTest extends IntegrationTestSupport {

  private String token;

  @BeforeEach
  void login() {
    token = register().accessToken();
  }

  @Test
  void currentWeatherIsNormalizedFromVisualCrossing() {
    Result result = api.get("/api/v1/weather/current?location=%20CurrentCity%20", token);

    assertThat(result.status()).isEqualTo(200);
    assertThat(result.json("data.source")).isEqualTo("visual-crossing");
    assertThat(result.json("data.units")).isEqualTo("metric");
    assertThat(result.json("data.location")).isEqualTo(Map.of(
        "query", "CurrentCity",
        "resolvedAddress", StubUpstreams.RESOLVED_ADDRESS,
        "latitude", 10.5,
        "longitude", 20.25,
        "timezone", "UTC",
        "timezoneOffsetHours", 0));
    assertThat(result.json("data.current.temperature")).isEqualTo(30.5);
    assertThat(result.json("data.current.feelsLike")).isEqualTo(31.5);
    assertThat(result.json("data.current.precipType")).isEqualTo(List.of());
    assertThat(result.json("data.current.conditions")).isEqualTo("Clear");
    assertThat(result.body()).contains("\"windDirection\":180,");

    assertThat(StubUpstreams.get().requests).anyMatch(request ->
        request.startsWith("/vc/CurrentCity?") && request.contains("include=current") && request.contains("key=test-key")
            && request.contains("unitGroup=metric"));
  }

  @Test
  void hourlyAndDailyForecastsRespectLimits() {
    Result hourly = api.get("/api/v1/weather/hourly?location=HourlyCity&days=2", token);
    assertThat(hourly.status()).isEqualTo(200);
    assertThat((List<?>) hourly.json("data.hours")).hasSize(48);

    Result limited = api.get("/api/v1/weather/hourly?location=HourlyCity&days=3&hours=5", token);
    assertThat((List<?>) limited.json("data.hours")).hasSizeLessThanOrEqualTo(5).isNotEmpty();
    long firstEpoch = ((Number) limited.json("data.hours.0.datetimeEpoch")).longValue();
    assertThat(firstEpoch).isGreaterThanOrEqualTo(System.currentTimeMillis() / 1000 - 3_600);

    Result daily = api.get("/api/v1/weather/daily?location=DailyCity&days=3", token);
    assertThat((List<?>) daily.json("data.days")).hasSize(3);
    assertThat(daily.json("data.days.0.temperatureMax")).isEqualTo(38);
    assertThat(daily.json("data.days.0.sunrise")).isEqualTo("06:30:00");
    assertThat(daily.json("data.days.0.hours")).isEqualTo(List.of());

    Result invalid = api.get("/api/v1/weather/daily?location=DailyCity&days=31", token);
    assertThat(invalid.status()).isEqualTo(400);
    assertThat(invalid.json("error.details.fieldErrors.days")).isEqualTo(List.of("Number must be less than or equal to 30"));

    Result fractional = api.get("/api/v1/weather/hourly?location=HourlyCity&days=1.5", token);
    assertThat(fractional.json("error.details.fieldErrors.days")).isEqualTo(List.of("Expected integer, received float"));

    Result longRange = api.get("/api/v1/weather/daily?location=LongCity&days=20", token);
    assertThat(longRange.status()).isEqualTo(200);
    assertThat(StubUpstreams.get().requests).anyMatch(request -> request.startsWith("/vc/LongCity/next20days?"));
  }

  @Test
  void historicalValidatesDates() {
    Result bad = api.get("/api/v1/weather/historical?location=HistCity&startDate=2026/01/01&endDate=2026-01-02", token);
    assertThat(bad.status()).isEqualTo(400);
    assertThat(bad.json("error.details.fieldErrors.startDate")).isEqualTo(List.of("startDate must be YYYY-MM-DD"));

    Result reversed = api.get("/api/v1/weather/historical?location=HistCity&startDate=2026-02-01&endDate=2026-01-01", token);
    assertThat(reversed.status()).isEqualTo(400);
    assertThat(reversed.errorCode()).isEqualTo("INVALID_DATE_RANGE");

    Result ok = api.get("/api/v1/weather/historical?location=HistCity&startDate=2026-01-01&endDate=2026-01-05", token);
    assertThat(ok.status()).isEqualTo(200);
    assertThat(ok.json("data.startDate")).isEqualTo("2026-01-01");
    assertThat((List<?>) ok.json("data.days.0.hours")).hasSize(24);
  }

  @Test
  void alertsBuildCategoryCards() {
    Result result = api.get("/api/v1/weather/alerts?location=AlertCity", token);

    assertThat(result.status()).isEqualTo(200);
    assertThat(result.json("data.alerts.0.event")).isEqualTo("Flood Warning");
    assertThat(result.json("data.alerts.0.link")).isNull();
    List<?> categories = (List<?>) result.json("data.categories");
    List<Object> ids = categories.stream().map(card -> (Object) ((Map<?, ?>) card).get("id")).toList();
    assertThat(ids).containsExactly("storm", "snow", "heat", "flood", "wind", "heavy-rain");

    assertThat(result.json("data.categories.0.source")).isEqualTo("forecast");
    assertThat(result.json("data.categories.0.severity")).isEqualTo("high");
    assertThat(result.json("data.categories.1.source")).isEqualTo("clear");
    assertThat(result.json("data.categories.2.title")).isEqualTo("Heat warning");
    assertThat(result.json("data.categories.2.severity")).isEqualTo("high");
    assertThat(result.json("data.categories.2.metrics.0.value")).isEqualTo("38°C");
    assertThat(result.json("data.categories.3.source")).isEqualTo("official");
    assertThat(result.json("data.categories.3.severity")).isEqualTo("extreme");
    assertThat(result.json("data.categories.3.title")).isEqualTo("Flood Warning issued");
    assertThat(result.json("data.categories.5.title")).isEqualTo("Heavy rain likely");
    assertThat(result.json("data.categories.5.metrics.0.value")).isEqualTo("12.0 mm");
    assertThat(result.json("data.activeCount")).isEqualTo(4);
  }

  @Test
  void airQualityResolvesLocationAndMapsPollutants() {
    Result result = api.get("/api/v1/weather/air-quality?location=Testville", token);

    assertThat(result.status()).isEqualTo(200);
    assertThat(result.json("data.source")).isEqualTo("open-meteo");
    assertThat(result.json("data.location.resolvedAddress")).isEqualTo("Testville, Test Country");
    assertThat(result.json("data.location.timezone")).isEqualTo("GMT");
    assertThat(result.json("data.location.timezoneOffsetHours")).isNull();
    assertThat(result.json("data.aqi")).isEqualTo(42);
    assertThat(result.json("data.category.level")).isEqualTo("Good");
    assertThat(result.json("data.pollutants.0.percent")).isEqualTo(29);
    assertThat(result.json("data.pollutants.4.id")).isEqualTo("co");
    assertThat(result.json("data.pollutants.4.value")).isEqualTo(0.25);
    assertThat(result.json("data.health.maskSuggested")).isEqualTo(false);
  }

  @Test
  void upstreamErrorsAreMappedWithoutFabricatingData() {
    Result rateLimited = api.get("/api/v1/weather/current?location=RateLimited", token);
    assertThat(rateLimited.status()).isEqualTo(429);
    assertThat(rateLimited.errorCode()).isEqualTo("WEATHER_RATE_LIMITED");

    Result badRequest = api.get("/api/v1/weather/current?location=BadRequest", token);
    assertThat(badRequest.status()).isEqualTo(400);
    assertThat(badRequest.json("error.message")).isEqualTo("Invalid location parameter value.");

    Result broken = api.get("/api/v1/weather/current?location=Broken", token);
    assertThat(broken.status()).isEqualTo(502);
    assertThat(broken.errorCode()).isEqualTo("WEATHER_UPSTREAM_ERROR");
    assertThat(broken.body()).doesNotContain("\"data\"");
  }

  @Test
  void mapConfigDisablesOverlaysWithoutKey() {
    Result result = api.get("/api/v1/weather/map-config", token);

    assertThat(result.json("data.overlaysEnabled")).isEqualTo(false);
    assertThat(result.json("data.tileUrlTemplate")).isNull();
    assertThat(result.json("data.layers.1")).isEqualTo(
        Map.of("id", "rain", "label", "Rain", "owmLayer", "precipitation_new", "color", "#4a9eff"));
  }

  @Test
  void locationsAutocompleteSuggestAndResolve() {
    Result popular = api.get("/api/v1/locations/autocomplete?q=Tbil", token);
    assertThat(popular.status()).isEqualTo(200);
    assertThat(popular.json("data.suggestions.0.id")).isEqualTo("popular-tbilisi");

    Result remote = api.get("/api/v1/locations/autocomplete?q=Testville&limit=5", token);
    assertThat(remote.json("data.suggestions.0.id")).isEqualTo("om-12345");
    assertThat(remote.json("data.suggestions.0.weatherQuery")).isEqualTo("Testville, Test Country");

    Result missing = api.get("/api/v1/locations/autocomplete", token);
    assertThat(missing.json("error.details.fieldErrors.q")).isEqualTo(List.of("Required"));

    Result suggestions = api.get("/api/v1/locations/suggestions?q=&limit=3", token);
    assertThat((List<?>) suggestions.json("data.suggestions")).hasSize(3);

    Result resolveEmpty = api.post("/api/v1/locations/resolve", Map.of(), token);
    assertThat(resolveEmpty.json("error.details.formErrors")).isEqualTo(List.of("Provide q or latitude+longitude"));

    Result resolveQuery = api.post("/api/v1/locations/resolve", Map.of("q", "Tbilisi"), token);
    assertThat(resolveQuery.json("data.name")).isEqualTo("Tbilisi");

    Result resolveCoords = api.post("/api/v1/locations/resolve", Map.of("latitude", 10.5, "longitude", 20.25), token);
    assertThat(resolveCoords.status()).isEqualTo(200);
    assertThat(resolveCoords.json("data.latitude")).isEqualTo(10.5);

    Result outOfRange = api.post("/api/v1/locations/resolve", Map.of("latitude", 91, "longitude", 0), token);
    assertThat(outOfRange.json("error.details.fieldErrors.latitude"))
        .isEqualTo(List.of("Number must be less than or equal to 90"));
  }
}
