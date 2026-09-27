package com.weather.mapper;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.function.Function;

import com.weather.integration.Json;

/** Builds the six alert category cards (storm, snow, heat, flood, wind, heavy rain). */
public final class AlertCategoriesMapper {

  private AlertCategoriesMapper() {
  }

  private record Thresholds(double heatHigh, double heatExtreme, double windMedium, double windHigh,
      double rainMedium, double rainHigh, double floodPrecip, double snowTrace, String tempUnit, String speedUnit,
      String precipUnit) {
  }

  private record Meta(String label, String emoji, String color, String gradient, String clearTitle,
      String clearDescription, List<String> tips, List<String> keywords) {
  }

  private static final Map<String, Meta> CATEGORY_META = Map.of(
      "storm", new Meta("Storm", "⛈️", "#a855f7",
          "linear-gradient(135deg, rgba(168,85,247,0.28), rgba(76,29,149,0.12))",
          "No storm threat", "No thunderstorm or severe storm signals in the near-term forecast.",
          List.of("Unplug sensitive electronics if storms develop", "Avoid open fields and tall trees",
              "Delay outdoor plans if lightning is nearby"),
          List.of("thunder", "storm", "lightning", "hail", "tornado", "severe weather")),
      "snow", new Meta("Snow", "❄️", "#7dd3fc",
          "linear-gradient(135deg, rgba(125,211,252,0.28), rgba(14,116,144,0.12))",
          "No snow expected", "No snowfall is indicated in the upcoming forecast window.",
          List.of("Check road conditions before travel", "Allow extra commute time", "Keep pathways clear of ice"),
          List.of("snow", "blizzard", "winter storm", "ice storm", "sleet", "freezing")),
      "heat", new Meta("Heat", "🌡️", "#f97316",
          "linear-gradient(135deg, rgba(249,115,22,0.3), rgba(194,65,12,0.12))",
          "Heat levels manageable", "Temperatures are below heat-warning thresholds for your unit system.",
          List.of("Hydrate regularly", "Limit outdoor activity 11:00–16:00", "Check on vulnerable neighbors"),
          List.of("heat", "hot", "excessive heat", "heatwave", "heat wave")),
      "flood", new Meta("Flood", "🌊", "#0ea5e9",
          "linear-gradient(135deg, rgba(14,165,233,0.28), rgba(3,105,161,0.12))",
          "Flood risk low", "No significant flood risk signals from rainfall totals or official notices.",
          List.of("Avoid driving through standing water", "Move valuables above floor level if risk rises",
              "Monitor local river advisories"),
          List.of("flood", "flash flood", "inundation", "river flood")),
      "wind", new Meta("Wind", "💨", "#a3e635",
          "linear-gradient(135deg, rgba(163,230,53,0.25), rgba(77,124,15,0.12))",
          "Winds calm to moderate", "Wind speeds stay below advisory thresholds in the near-term forecast.",
          List.of("Secure loose outdoor items", "Use caution on elevated bridges", "Cyclists should expect gusty stretches"),
          List.of("wind", "gale", "high wind", "wind advisory")),
      "heavy-rain", new Meta("Heavy Rain", "🌧️", "#3b82f6",
          "linear-gradient(135deg, rgba(59,130,246,0.28), rgba(29,78,216,0.12))",
          "No heavy rain alert", "Rainfall amounts and probabilities are below heavy-rain alert thresholds.",
          List.of("Carry waterproof gear", "Allow extra travel time", "Watch for slick roads and reduced visibility"),
          List.of("heavy rain", "rainfall", "downpour", "torrential", "rain warning")));

  private static Thresholds thresholdsFor(String units) {
    if ("us".equals(units)) {
      return new Thresholds(97, 104, 25, 40, 0.5, 1, 2, 0.1, "°F", "mph", "in");
    }
    return new Thresholds(36, 40, 40, 65, 15, 25, 50, 1, "°C", "km/h", "mm");
  }

  public static List<Map<String, Object>> build(List<Map<String, Object>> alerts,
      List<Map<String, Object>> allDays, String units, String area) {
    List<Map<String, Object>> days = allDays.subList(0, Math.min(5, allDays.size()));
    Thresholds t = thresholdsFor(units);

    Map<String, Object> heatDay = peakDay(days, day -> coalesce(num(day, "temperatureMax"), num(day, "temperature")));
    Map<String, Object> windDay = peakDay(days, day -> coalesce(num(day, "windGust"), num(day, "windSpeed")));
    Map<String, Object> rainDay = peakDay(days, day -> num(day, "precip"));
    Map<String, Object> snowDay = peakDay(days, day -> num(day, "snow"));
    Map<String, Object> stormDay = days.stream().filter(day -> {
      String icon = str(day, "icon");
      String conditions = str(day, "conditions").toLowerCase(Locale.ROOT);
      return icon.contains("thunder") || conditions.contains("thunder") || conditions.contains("storm");
    }).findFirst().orElse(null);

    Double heatMax = heatDay == null ? null : coalesce(num(heatDay, "temperatureMax"), num(heatDay, "temperature"));
    Double windMax = windDay == null ? null : coalesce(num(windDay, "windGust"), num(windDay, "windSpeed"));
    Double rainMax = rainDay == null ? null : num(rainDay, "precip");
    Double rainProb = rainDay == null ? null : num(rainDay, "precipProbability");
    Double snowMax = snowDay == null ? null : num(snowDay, "snow");

    List<Map<String, Object>> cards = new ArrayList<>();

    // Storm
    Map<String, Object> official = matchOfficial(alerts, CATEGORY_META.get("storm").keywords());
    if (official != null) {
      cards.add(buildFromOfficial("storm", official, area));
    } else if (stormDay != null) {
      cards.add(card("storm", "high", "Thunderstorm conditions likely",
          "Stormy conditions are indicated around " + dayLabel(stormDay)
              + ". Lightning and brief heavy showers are possible.",
          Json.str(stormDay.get("datetime")), area,
          List.of(metric("Conditions", orDefault(Json.str(stormDay.get("conditions")), "Stormy")),
              metric("Rain chance", formatMetric(num(stormDay, "precipProbability"), 0, "%")))));
    } else if (rainMax != null && rainMax >= t.rainHigh() && windMax != null && windMax >= t.windMedium()) {
      cards.add(card("storm", "medium", "Unsettled storm potential",
          "Heavy rain and stronger winds overlap near " + dayLabel(rainDay) + ". Localized storm cells are possible.",
          datetime(rainDay), area,
          List.of(metric("Peak rain", formatMetric(rainMax, 1, " " + t.precipUnit())),
              metric("Peak wind", formatMetric(windMax, 0, " " + t.speedUnit())))));
    } else {
      cards.add(clearCard("storm", area));
    }

    // Snow
    official = matchOfficial(alerts, CATEGORY_META.get("snow").keywords());
    if (official != null) {
      cards.add(buildFromOfficial("snow", official, area));
    } else if (snowMax != null && snowMax >= t.snowTrace()) {
      String severity = snowMax >= t.snowTrace() * 8 ? "high" : "medium";
      cards.add(card("snow", severity, "Snowfall expected",
          "Snow accumulation around " + formatMetric(snowMax, 1, " " + t.precipUnit()) + " is forecast near "
              + dayLabel(snowDay) + ".",
          datetime(snowDay), area,
          List.of(metric("Snow", formatMetric(snowMax, 1, " " + t.precipUnit())),
              metric("Low", formatMetric(snowDay == null ? null : num(snowDay, "temperatureMin"), 0, t.tempUnit())))));
    } else {
      Map<String, Object> typed = days.stream().filter(AlertCategoriesMapper::hasSnowType).findFirst().orElse(null);
      if (typed != null) {
        cards.add(card("snow", "low", "Wintry precipitation possible",
            "Snow is listed in precipitation types near " + dayLabel(typed) + ". Amounts may be light.",
            datetime(typed), area, List.of(metric("Type", "Snow mix"))));
      } else {
        cards.add(clearCard("snow", area));
      }
    }

    // Heat
    official = matchOfficial(alerts, CATEGORY_META.get("heat").keywords());
    if (official != null) {
      cards.add(buildFromOfficial("heat", official, area));
    } else if (heatMax != null && heatMax >= t.heatHigh()) {
      String severity = heatMax >= t.heatExtreme() ? "extreme" : heatMax >= t.heatHigh() + 2 ? "high" : "medium";
      Double feelsLike = heatDay == null ? null : coalesce(num(heatDay, "feelsLikeMax"), num(heatDay, "feelsLike"));
      cards.add(card("heat", severity, "extreme".equals(severity) ? "Extreme heat warning" : "Heat warning",
          "Temperatures reaching " + formatMetric(heatMax, 0, t.tempUnit()) + " near " + dayLabel(heatDay)
              + ". Limit prolonged sun exposure.",
          datetime(heatDay), area,
          List.of(metric("High", formatMetric(heatMax, 0, t.tempUnit())),
              metric("Feels like", formatMetric(feelsLike, 0, t.tempUnit())))));
    } else {
      cards.add(clearCard("heat", area));
    }

    // Flood
    official = matchOfficial(alerts, CATEGORY_META.get("flood").keywords());
    if (official != null) {
      cards.add(buildFromOfficial("flood", official, area));
    } else if (rainMax != null && rainMax >= t.floodPrecip()) {
      cards.add(card("flood", rainMax >= t.floodPrecip() * 1.4 ? "high" : "medium", "Flood watch conditions",
          "Heavy rainfall totals near " + formatMetric(rainMax, 1, " " + t.precipUnit()) + " on " + dayLabel(rainDay)
              + " raise flood potential in low-lying areas.",
          datetime(rainDay), area,
          List.of(metric("Rain total", formatMetric(rainMax, 1, " " + t.precipUnit())),
              metric("Chance", formatMetric(rainProb, 0, "%")))));
    } else {
      cards.add(clearCard("flood", area));
    }

    // Wind
    official = matchOfficial(alerts, CATEGORY_META.get("wind").keywords());
    if (official != null) {
      cards.add(buildFromOfficial("wind", official, area));
    } else if (windMax != null && windMax >= t.windMedium()) {
      String severity = windMax >= t.windHigh() ? "high" : "medium";
      cards.add(card("wind", severity, "high".equals(severity) ? "Strong wind warning" : "Wind advisory",
          "Gusts near " + formatMetric(windMax, 0, " " + t.speedUnit()) + " expected around " + dayLabel(windDay)
              + ". Secure outdoor items.",
          datetime(windDay), area,
          List.of(metric("Gusts", formatMetric(windMax, 0, " " + t.speedUnit())),
              metric("Sustained", formatMetric(windDay == null ? null : num(windDay, "windSpeed"), 0,
                  " " + t.speedUnit())))));
    } else {
      cards.add(clearCard("wind", area));
    }

    // Heavy Rain
    official = matchOfficial(alerts, CATEGORY_META.get("heavy-rain").keywords());
    if (official != null) {
      cards.add(buildFromOfficial("heavy-rain", official, area));
    } else if ((rainMax != null && rainMax >= t.rainMedium())
        || (rainProb != null && rainProb >= 70 && rainMax != null && rainMax >= t.rainMedium() * 0.4)) {
      String severity = rainMax != null && rainMax >= t.rainHigh() ? "high" : "medium";
      cards.add(card("heavy-rain", severity, "high".equals(severity) ? "Heavy rain warning" : "Heavy rain likely",
          "Significant rainfall near " + formatMetric(rainMax, 1, " " + t.precipUnit()) + " with "
              + formatMetric(rainProb, 0, "%") + " chance around " + dayLabel(rainDay) + ".",
          datetime(rainDay), area,
          List.of(metric("Rain", formatMetric(rainMax, 1, " " + t.precipUnit())),
              metric("Chance", formatMetric(rainProb, 0, "%")))));
    } else {
      cards.add(clearCard("heavy-rain", area));
    }

    return cards;
  }

  private static boolean hasSnowType(Map<String, Object> day) {
    List<Object> types = Json.list(day.get("precipType"));
    return types != null && types.stream()
        .anyMatch(type -> type instanceof String text && text.toLowerCase(Locale.ROOT).contains("snow"));
  }

  private static Map<String, Object> matchOfficial(List<Map<String, Object>> alerts, List<String> keywords) {
    for (Map<String, Object> alert : alerts) {
      String haystack = textOf(alert);
      if (keywords.stream().anyMatch(haystack::contains)) {
        return alert;
      }
    }
    return null;
  }

  private static String textOf(Map<String, Object> alert) {
    List<String> parts = new ArrayList<>();
    for (String key : List.of("event", "headline", "description")) {
      String value = Json.str(alert.get(key));
      if (value != null) {
        parts.add(value);
      }
    }
    return String.join(" ", parts).toLowerCase(Locale.ROOT);
  }

  private static String mapOfficialSeverity(String value) {
    String normalized = value == null ? "" : value.toLowerCase(Locale.ROOT);
    if (normalized.contains("extreme") || normalized.contains("severe")) return "extreme";
    if (normalized.contains("warning") || normalized.contains("high")) return "high";
    if (normalized.contains("watch") || normalized.contains("moderate") || normalized.contains("medium")) {
      return "medium";
    }
    if (normalized.contains("advisory") || normalized.contains("minor") || normalized.contains("low")) {
      return "low";
    }
    return "medium";
  }

  private static Map<String, Object> buildFromOfficial(String id, Map<String, Object> official, String area) {
    Meta meta = CATEGORY_META.get(id);
    String headline = Json.str(official.get("headline"));
    String event = Json.str(official.get("event"));
    String description = Json.str(official.get("description"));
    Map<String, Object> card = base(id);
    card.put("severity", mapOfficialSeverity(Json.str(official.get("severity"))));
    card.put("active", true);
    card.put("title", headline != null ? headline : event != null ? event : meta.label() + " alert");
    card.put("description", description != null ? description
        : headline != null ? headline : "Official " + meta.label().toLowerCase(Locale.ROOT) + " alert is in effect.");
    card.put("issued", Json.str(official.get("onset")));
    card.put("expires", Json.str(official.get("ends")));
    card.put("area", area);
    card.put("tips", meta.tips());
    card.put("source", "official");
    card.put("metrics", List.of());
    return card;
  }

  private static Map<String, Object> clearCard(String id, String area) {
    Meta meta = CATEGORY_META.get(id);
    Map<String, Object> card = base(id);
    card.put("severity", "none");
    card.put("active", false);
    card.put("title", meta.clearTitle());
    card.put("description", meta.clearDescription());
    card.put("issued", null);
    card.put("expires", null);
    card.put("area", area);
    card.put("tips", meta.tips());
    card.put("source", "clear");
    card.put("metrics", List.of());
    return card;
  }

  private static Map<String, Object> card(String id, String severity, String title, String description,
      String issued, String area, List<Map<String, Object>> metrics) {
    Map<String, Object> card = base(id);
    card.put("severity", severity);
    card.put("active", true);
    card.put("title", title);
    card.put("description", description);
    card.put("issued", issued);
    card.put("expires", null);
    card.put("area", area);
    card.put("tips", CATEGORY_META.get(id).tips());
    card.put("source", "forecast");
    card.put("metrics", metrics);
    return card;
  }

  private static Map<String, Object> base(String id) {
    Meta meta = CATEGORY_META.get(id);
    Map<String, Object> card = new LinkedHashMap<>();
    card.put("id", id);
    card.put("label", meta.label());
    card.put("emoji", meta.emoji());
    card.put("color", meta.color());
    card.put("gradient", meta.gradient());
    return card;
  }

  private static Map<String, Object> metric(String label, String value) {
    Map<String, Object> metric = new LinkedHashMap<>();
    metric.put("label", label);
    metric.put("value", value);
    return metric;
  }

  private static Map<String, Object> peakDay(List<Map<String, Object>> days, Function<Map<String, Object>, Double> score) {
    Map<String, Object> best = null;
    double bestScore = Double.NEGATIVE_INFINITY;
    for (Map<String, Object> day : days) {
      Double value = score.apply(day);
      double numeric = value == null ? Double.NEGATIVE_INFINITY : value;
      if (numeric > bestScore) {
        best = day;
        bestScore = numeric;
      }
    }
    return best;
  }

  private static String dayLabel(Map<String, Object> day) {
    String datetime = day == null ? null : (String) day.get("datetime");
    return datetime != null ? datetime : "upcoming days";
  }

  private static String datetime(Map<String, Object> day) {
    return day == null ? null : (String) day.get("datetime");
  }

  static String formatMetric(Double value, int digits, String suffix) {
    if (value == null || !Double.isFinite(value)) {
      return "—";
    }
    return Json.toFixed(value, digits) + suffix;
  }

  private static Double num(Map<String, Object> day, String key) {
    return Json.dbl(day.get(key));
  }

  private static String str(Map<String, Object> day, String key) {
    Object value = day.get(key);
    return value instanceof String text ? text : "";
  }

  private static Double coalesce(Double first, Double second) {
    return first != null ? first : second;
  }

  private static String orDefault(String value, String fallback) {
    return value != null ? value : fallback;
  }
}
