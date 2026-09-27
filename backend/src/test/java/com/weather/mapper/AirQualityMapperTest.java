package com.weather.mapper;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;

class AirQualityMapperTest {

  @Test
  void classifiesUsAqiAtTheSameBoundaries() {
    assertThat(AirQualityMapper.classifyUsAqi(null).level()).isEqualTo("Unknown");
    assertThat(AirQualityMapper.classifyUsAqi(50.0).level()).isEqualTo("Good");
    assertThat(AirQualityMapper.classifyUsAqi(51.0).level()).isEqualTo("Moderate");
    assertThat(AirQualityMapper.classifyUsAqi(150.0).level()).isEqualTo("Unhealthy for Sensitive Groups");
    assertThat(AirQualityMapper.classifyUsAqi(200.0).level()).isEqualTo("Unhealthy");
    assertThat(AirQualityMapper.classifyUsAqi(300.0).level()).isEqualTo("Very Unhealthy");
    assertThat(AirQualityMapper.classifyUsAqi(301.0).level()).isEqualTo("Hazardous");
  }

  @Test
  void healthRecommendationsSuggestMasksFromSensitiveLevel() {
    assertThat(AirQualityMapper.buildHealthRecommendation(100.0).get("maskSuggested")).isEqualTo(false);
    assertThat(AirQualityMapper.buildHealthRecommendation(101.0).get("maskSuggested")).isEqualTo(true);
    assertThat(AirQualityMapper.buildHealthRecommendation(null).get("summary"))
        .isEqualTo("Health guidance is unavailable until air quality data loads.");
  }

  @Test
  void missingProviderValuesStayNullInsteadOfBeingInvented() {
    Map<String, Object> result = AirQualityMapper.map("q", "Place", 1.0, 2.0, null, null, null);

    assertThat(result.get("aqi")).isNull();
    assertThat(result.get("observedAt")).isNull();
    @SuppressWarnings("unchecked")
    List<Map<String, Object>> pollutants = (List<Map<String, Object>>) result.get("pollutants");
    assertThat(pollutants).hasSize(6).allSatisfy(pollutant -> {
      assertThat(pollutant.get("value")).isNull();
      assertThat(pollutant.get("percent")).isNull();
    });
  }
}
