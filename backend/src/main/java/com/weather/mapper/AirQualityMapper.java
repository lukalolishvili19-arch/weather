package com.weather.mapper;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import com.weather.integration.Json;

public final class AirQualityMapper {

  private AirQualityMapper() {
  }

  record Category(String level, String color, String description) {
  }

  static Category classifyUsAqi(Double aqi) {
    if (aqi == null) {
      return new Category("Unknown", "#7a8ba8", "Air quality data is unavailable for this location.");
    }
    if (aqi <= 50) {
      return new Category("Good", "#22c55e", "Air quality is satisfactory and poses little or no risk.");
    }
    if (aqi <= 100) {
      return new Category("Moderate", "#f59e0b",
          "Acceptable air quality; unusually sensitive people may notice mild effects.");
    }
    if (aqi <= 150) {
      return new Category("Unhealthy for Sensitive Groups", "#f7921e",
          "Sensitive groups may experience health effects; the general public is less likely to be affected.");
    }
    if (aqi <= 200) {
      return new Category("Unhealthy", "#ef4444",
          "Everyone may begin to experience health effects; sensitive groups may experience more serious effects.");
    }
    if (aqi <= 300) {
      return new Category("Very Unhealthy", "#a855f7",
          "Health alert: everyone may experience more serious health effects.");
    }
    return new Category("Hazardous", "#7f1d1d",
        "Emergency conditions: the entire population is more likely to be affected.");
  }

  private static Map<String, Object> category(Category category) {
    Map<String, Object> map = new LinkedHashMap<>();
    map.put("level", category.level());
    map.put("color", category.color());
    map.put("description", category.description());
    return map;
  }

  static Map<String, Object> buildHealthRecommendation(Double aqi) {
    Map<String, Object> health = category(classifyUsAqi(aqi));
    if (aqi == null) {
      return health(health, "Health guidance is unavailable until air quality data loads.",
          List.of("Try another nearby location", "Check again in a few minutes"),
          "Unknown", "Unknown", "Unknown", false);
    }
    if (aqi <= 50) {
      return health(health, "Great day for outdoor activities. Air quality is healthy for everyone.",
          List.of("Enjoy outdoor exercise and commuting as usual", "Open windows for fresh air ventilation",
              "No special precautions needed for most people"),
          "Ideal", "No extra caution needed", "Safe to open", false);
    }
    if (aqi <= 100) {
      return health(health,
          "Air quality is acceptable. Unusually sensitive people should limit prolonged outdoor exertion.",
          List.of("Most people can be outdoors normally",
              "Sensitive individuals should reduce intense outdoor exercise",
              "Prefer morning or evening outdoor activity if you notice irritation"),
          "Generally fine", "Limit prolonged exertion", "OK to open; air out briefly", false);
    }
    if (aqi <= 150) {
      return health(health, "Sensitive groups should reduce outdoor activity. Others can continue with care.",
          List.of("Children, older adults, and people with asthma or heart/lung conditions should shorten outdoor time",
              "Move workouts indoors when possible", "Keep windows closed during peak pollution hours"),
          "Reduce for sensitive groups", "Avoid prolonged/heavy outdoor exertion", "Prefer closed during peaks", true);
    }
    if (aqi <= 200) {
      return health(health, "Unhealthy air — everyone should limit outdoor exposure.",
          List.of("Avoid outdoor exercise and long outdoor stays",
              "Sensitive groups should stay indoors with filtered air when possible",
              "Wear a well-fitting mask if you must go outside",
              "Keep windows closed and use air purification if available"),
          "Limit for everyone", "Stay indoors when possible", "Keep closed", true);
    }
    if (aqi <= 300) {
      return health(health, "Very unhealthy air — take protective measures immediately.",
          List.of("Avoid all outdoor physical activity", "Remain indoors with windows closed",
              "Use an N95/FFP2 mask if outdoor travel is necessary",
              "Seek medical advice if you feel shortness of breath or chest pain"),
          "Avoid", "Remain indoors; follow care plans", "Keep closed", true);
    }
    return health(health, "Hazardous air quality — emergency precautions recommended.",
        List.of("Stay indoors and minimize all outdoor exposure",
            "Use high-quality filtration or clean-air spaces if available",
            "Wear an N95/FFP2 mask for any essential outdoor travel",
            "Contact local health authorities for emergency guidance"),
        "Avoid completely", "Emergency precautions", "Keep sealed", true);
  }

  private static Map<String, Object> health(Map<String, Object> base, String summary, List<String> tips,
      String outdoorActivity, String sensitiveGroups, String windows, boolean maskSuggested) {
    base.put("summary", summary);
    base.put("tips", tips);
    base.put("outdoorActivity", outdoorActivity);
    base.put("sensitiveGroups", sensitiveGroups);
    base.put("windows", windows);
    base.put("maskSuggested", maskSuggested);
    return base;
  }

  private static Long pollutantPercent(Double value, double limit) {
    if (value == null || limit <= 0) {
      return null;
    }
    return Math.min(100, Json.round((value / limit) * 100));
  }

  private static Map<String, Object> pollutant(String id, String label, Number value, String unit, int limit,
      String color, String description) {
    Map<String, Object> map = new LinkedHashMap<>();
    map.put("id", id);
    map.put("label", label);
    map.put("value", value);
    map.put("unit", unit);
    map.put("limit", limit);
    map.put("percent", pollutantPercent(value == null ? null : value.doubleValue(), limit));
    map.put("color", color);
    map.put("description", description);
    return map;
  }

  private static List<Map<String, Object>> mapPollutants(Map<String, Object> current) {
    Number pm25 = Json.num(Json.get(current, "pm2_5"));
    Number pm10 = Json.num(Json.get(current, "pm10"));
    Number no2 = Json.num(Json.get(current, "nitrogen_dioxide"));
    Number o3 = Json.num(Json.get(current, "ozone"));
    Double coUg = Json.dbl(Json.get(current, "carbon_monoxide"));
    Number so2 = Json.num(Json.get(current, "sulphur_dioxide"));
    Double coMg = coUg == null ? null : coUg / 1000;

    return List.of(
        pollutant("pm25", "PM 2.5", pm25, "μg/m³", 35, "#f59e0b", "Fine particles — respiratory risk"),
        pollutant("pm10", "PM 10", pm10, "μg/m³", 70, "#f7921e", "Coarse particles — minor irritation"),
        pollutant("no2", "NO₂", no2, "μg/m³", 100, "#4a9eff", "Nitrogen dioxide — traffic-related"),
        pollutant("o3", "O₃", o3, "μg/m³", 120, "#a3e635", "Ground-level ozone — UV-driven"),
        pollutant("co", "CO", coMg, "mg/m³", 10, "#22c55e", "Carbon monoxide — combustion product"),
        pollutant("so2", "SO₂", so2, "μg/m³", 50, "#7a8ba8", "Sulfur dioxide — industrial source"));
  }

  public static Map<String, Object> map(String query, String resolvedAddress, Number latitude, Number longitude,
      String timezone, Map<String, Object> current, String providerTimezone) {
    Double aqi = Json.dbl(Json.get(current, "us_aqi"));

    Map<String, Object> location = new LinkedHashMap<>();
    location.put("query", query);
    location.put("resolvedAddress", resolvedAddress);
    location.put("latitude", latitude);
    location.put("longitude", longitude);
    location.put("timezone", timezone != null ? timezone : providerTimezone);
    location.put("timezoneOffsetHours", null);

    Map<String, Object> response = new LinkedHashMap<>();
    response.put("source", "open-meteo");
    response.put("location", location);
    Object observedAt = Json.get(current, "time");
    response.put("observedAt", observedAt);
    response.put("aqi", Json.num(Json.get(current, "us_aqi")));
    response.put("europeanAqi", Json.num(Json.get(current, "european_aqi")));
    response.put("category", category(classifyUsAqi(aqi)));
    response.put("pollutants", mapPollutants(current));
    response.put("health", buildHealthRecommendation(aqi));
    return response;
  }
}
