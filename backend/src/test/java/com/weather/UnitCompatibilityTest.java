package com.weather;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.HashSet;
import java.util.Set;

import com.weather.config.DatabaseUrl;
import com.weather.dto.validation.Patterns;
import com.weather.entity.Cuid;
import com.weather.integration.Json;
import com.weather.service.LocationService;

import org.junit.jupiter.api.Test;

class UnitCompatibilityTest {

  @Test
  void convertsPrismaDatabaseUrls() {
    DatabaseUrl neon = DatabaseUrl.parse(
        "postgresql://neondb_owner:p%40ss%2Bword@ep-cool-1.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require&pgbouncer=true&connection_limit=1&schema=public");
    assertThat(neon.jdbcUrl())
        .isEqualTo("jdbc:postgresql://ep-cool-1.eu-central-1.aws.neon.tech/neondb?sslmode=require&currentSchema=public");
    assertThat(neon.username()).isEqualTo("neondb_owner");
    assertThat(neon.password()).isEqualTo("p@ss+word");
    assertThat(neon.toString()).doesNotContain("p@ss");

    DatabaseUrl local = DatabaseUrl.parse("postgres://weather:weather@localhost:5432/weather");
    assertThat(local.jdbcUrl()).isEqualTo("jdbc:postgresql://localhost:5432/weather");

    assertThat(DatabaseUrl.parse("jdbc:postgresql://h/db").jdbcUrl()).isEqualTo("jdbc:postgresql://h/db");
    assertThatThrownBy(() -> DatabaseUrl.parse("mysql://x")).isInstanceOf(IllegalArgumentException.class);
  }

  @Test
  void generatesCuidsAcceptedByTheZodCuidCheck() {
    Set<String> ids = new HashSet<>();
    for (int index = 0; index < 10_000; index++) {
      String id = Cuid.next();
      assertThat(id).hasSize(25).startsWith("c");
      assertThat(Patterns.isCuid(id)).isTrue();
      ids.add(id);
    }
    assertThat(ids).hasSize(10_000);
    assertThat(Patterns.isCuid("cm0legacyuser000000000001")).isTrue();
    assertThat(Patterns.isCuid("not-a-cuid")).isFalse();
    assertThat(Patterns.isCuid("c1234567")).isFalse();
  }

  @Test
  void formatsNumbersLikeJavaScript() {
    assertThat(Json.toFixed(12.0, 1)).isEqualTo("12.0");
    assertThat(Json.toFixed(1.005, 2)).isEqualTo("1.00");
    assertThat(Json.toFixed(2.5, 0)).isEqualTo("3");
    assertThat(Json.toFixed(-2.5, 0)).isEqualTo("-3");
    assertThat(Json.round(2.5)).isEqualTo(3);
    assertThat(Json.round(-2.5)).isEqualTo(-2);
    assertThat(Json.jsNumber(36.0)).isEqualTo("36");
    assertThat(Json.jsNumber(36.6)).isEqualTo("36.6");
  }

  @Test
  void parsesCoordinateQueries() {
    LocationService.Coordinates coords = LocationService.parseCoordinates("41.7151, 44.8271");
    assertThat(coords).isNotNull();
    assertThat(coords.latitude()).isEqualTo(41.7151);
    assertThat(coords.longitude()).isEqualTo(44.8271);
    assertThat(LocationService.parseCoordinates("-33.9,18.4")).isNotNull();
    assertThat(LocationService.parseCoordinates("91,10")).isNull();
    assertThat(LocationService.parseCoordinates("Tbilisi")).isNull();
  }
}
