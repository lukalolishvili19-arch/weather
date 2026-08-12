import type { WeatherUnits } from "./weather.types.js";
import type {
  AlertCategoryCard,
  AlertCategoryId,
  AlertSeverity,
  NormalizedAlert,
  NormalizedDailyCondition,
} from "./weather.types.js";

type Thresholds = {
  heatHigh: number;
  heatExtreme: number;
  windMedium: number;
  windHigh: number;
  rainMedium: number;
  rainHigh: number;
  floodPrecip: number;
  snowTrace: number;
  tempUnit: string;
  speedUnit: string;
  precipUnit: string;
};

function thresholdsFor(units: WeatherUnits): Thresholds {
  if (units === "us") {
    return {
      heatHigh: 97,
      heatExtreme: 104,
      windMedium: 25,
      windHigh: 40,
      rainMedium: 0.5,
      rainHigh: 1,
      floodPrecip: 2,
      snowTrace: 0.1,
      tempUnit: "°F",
      speedUnit: "mph",
      precipUnit: "in",
    };
  }

  return {
    heatHigh: 36,
    heatExtreme: 40,
    windMedium: 40,
    windHigh: 65,
    rainMedium: 15,
    rainHigh: 25,
    floodPrecip: 50,
    snowTrace: 1,
    tempUnit: "°C",
    speedUnit: "km/h",
    precipUnit: "mm",
  };
}

function isNumber(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function textOf(alert: NormalizedAlert): string {
  return [alert.event, alert.headline, alert.description].filter(Boolean).join(" ").toLowerCase();
}

function matchOfficial(
  alerts: NormalizedAlert[],
  keywords: string[],
): NormalizedAlert | null {
  for (const alert of alerts) {
    const haystack = textOf(alert);
    if (keywords.some((keyword) => haystack.includes(keyword))) {
      return alert;
    }
  }
  return null;
}

function mapOfficialSeverity(value: string | null): AlertSeverity {
  const normalized = (value ?? "").toLowerCase();
  if (normalized.includes("extreme") || normalized.includes("severe")) return "extreme";
  if (normalized.includes("warning") || normalized.includes("high")) return "high";
  if (normalized.includes("watch") || normalized.includes("moderate") || normalized.includes("medium")) {
    return "medium";
  }
  if (normalized.includes("advisory") || normalized.includes("minor") || normalized.includes("low")) {
    return "low";
  }
  return "medium";
}

function dayLabel(day: NormalizedDailyCondition | undefined): string {
  return day?.datetime ?? "upcoming days";
}

function peakDay(
  days: NormalizedDailyCondition[],
  score: (day: NormalizedDailyCondition) => number,
): NormalizedDailyCondition | undefined {
  let best: NormalizedDailyCondition | undefined;
  let bestScore = Number.NEGATIVE_INFINITY;
  for (const day of days) {
    const value = score(day);
    if (value > bestScore) {
      best = day;
      bestScore = value;
    }
  }
  return best;
}

function formatMetric(value: number | null | undefined, digits: number, suffix: string): string {
  if (!isNumber(value)) return "—";
  return `${value.toFixed(digits)}${suffix}`;
}

const CATEGORY_META: Record<
  AlertCategoryId,
  {
    label: string;
    emoji: string;
    color: string;
    gradient: string;
    clearTitle: string;
    clearDescription: string;
    tips: string[];
    keywords: string[];
  }
> = {
  storm: {
    label: "Storm",
    emoji: "⛈️",
    color: "#a855f7",
    gradient: "linear-gradient(135deg, rgba(168,85,247,0.28), rgba(76,29,149,0.12))",
    clearTitle: "No storm threat",
    clearDescription: "No thunderstorm or severe storm signals in the near-term forecast.",
    tips: ["Unplug sensitive electronics if storms develop", "Avoid open fields and tall trees", "Delay outdoor plans if lightning is nearby"],
    keywords: ["thunder", "storm", "lightning", "hail", "tornado", "severe weather"],
  },
  snow: {
    label: "Snow",
    emoji: "❄️",
    color: "#7dd3fc",
    gradient: "linear-gradient(135deg, rgba(125,211,252,0.28), rgba(14,116,144,0.12))",
    clearTitle: "No snow expected",
    clearDescription: "No snowfall is indicated in the upcoming forecast window.",
    tips: ["Check road conditions before travel", "Allow extra commute time", "Keep pathways clear of ice"],
    keywords: ["snow", "blizzard", "winter storm", "ice storm", "sleet", "freezing"],
  },
  heat: {
    label: "Heat",
    emoji: "🌡️",
    color: "#f97316",
    gradient: "linear-gradient(135deg, rgba(249,115,22,0.3), rgba(194,65,12,0.12))",
    clearTitle: "Heat levels manageable",
    clearDescription: "Temperatures are below heat-warning thresholds for your unit system.",
    tips: ["Hydrate regularly", "Limit outdoor activity 11:00–16:00", "Check on vulnerable neighbors"],
    keywords: ["heat", "hot", "excessive heat", "heatwave", "heat wave"],
  },
  flood: {
    label: "Flood",
    emoji: "🌊",
    color: "#0ea5e9",
    gradient: "linear-gradient(135deg, rgba(14,165,233,0.28), rgba(3,105,161,0.12))",
    clearTitle: "Flood risk low",
    clearDescription: "No significant flood risk signals from rainfall totals or official notices.",
    tips: ["Avoid driving through standing water", "Move valuables above floor level if risk rises", "Monitor local river advisories"],
    keywords: ["flood", "flash flood", "inundation", "river flood"],
  },
  wind: {
    label: "Wind",
    emoji: "💨",
    color: "#a3e635",
    gradient: "linear-gradient(135deg, rgba(163,230,53,0.25), rgba(77,124,15,0.12))",
    clearTitle: "Winds calm to moderate",
    clearDescription: "Wind speeds stay below advisory thresholds in the near-term forecast.",
    tips: ["Secure loose outdoor items", "Use caution on elevated bridges", "Cyclists should expect gusty stretches"],
    keywords: ["wind", "gale", "high wind", "wind advisory"],
  },
  "heavy-rain": {
    label: "Heavy Rain",
    emoji: "🌧️",
    color: "#3b82f6",
    gradient: "linear-gradient(135deg, rgba(59,130,246,0.28), rgba(29,78,216,0.12))",
    clearTitle: "No heavy rain alert",
    clearDescription: "Rainfall amounts and probabilities are below heavy-rain alert thresholds.",
    tips: ["Carry waterproof gear", "Allow extra travel time", "Watch for slick roads and reduced visibility"],
    keywords: ["heavy rain", "rainfall", "downpour", "torrential", "rain warning"],
  },
};

function buildFromOfficial(
  id: AlertCategoryId,
  official: NormalizedAlert,
  area: string,
): AlertCategoryCard {
  const meta = CATEGORY_META[id];
  return {
    id,
    label: meta.label,
    emoji: meta.emoji,
    color: meta.color,
    gradient: meta.gradient,
    severity: mapOfficialSeverity(official.severity),
    active: true,
    title: official.headline || official.event || `${meta.label} alert`,
    description:
      official.description ||
      official.headline ||
      `Official ${meta.label.toLowerCase()} alert is in effect.`,
    issued: official.onset,
    expires: official.ends,
    area: area,
    tips: meta.tips,
    source: "official",
    metrics: [],
  };
}

function clearCard(id: AlertCategoryId, area: string): AlertCategoryCard {
  const meta = CATEGORY_META[id];
  return {
    id,
    label: meta.label,
    emoji: meta.emoji,
    color: meta.color,
    gradient: meta.gradient,
    severity: "none",
    active: false,
    title: meta.clearTitle,
    description: meta.clearDescription,
    issued: null,
    expires: null,
    area,
    tips: meta.tips,
    source: "clear",
    metrics: [],
  };
}

export function buildAlertCategoryCards(params: {
  alerts: NormalizedAlert[];
  days: NormalizedDailyCondition[];
  units: WeatherUnits;
  area: string;
}): AlertCategoryCard[] {
  const { alerts, units, area } = params;
  const days = params.days.slice(0, 5);
  const t = thresholdsFor(units);

  const heatDay = peakDay(days, (day) => day.temperatureMax ?? day.temperature ?? Number.NEGATIVE_INFINITY);
  const windDay = peakDay(days, (day) => day.windGust ?? day.windSpeed ?? Number.NEGATIVE_INFINITY);
  const rainDay = peakDay(days, (day) => day.precip ?? Number.NEGATIVE_INFINITY);
  const snowDay = peakDay(days, (day) => day.snow ?? Number.NEGATIVE_INFINITY);
  const stormDay = days.find(
    (day) =>
      (day.icon ?? "").includes("thunder") ||
      (day.conditions ?? "").toLowerCase().includes("thunder") ||
      (day.conditions ?? "").toLowerCase().includes("storm"),
  );

  const heatMax = heatDay?.temperatureMax ?? heatDay?.temperature ?? null;
  const windMax = windDay?.windGust ?? windDay?.windSpeed ?? null;
  const rainMax = rainDay?.precip ?? null;
  const rainProb = rainDay?.precipProbability ?? null;
  const snowMax = snowDay?.snow ?? null;

  const cards: AlertCategoryCard[] = [];

  // Storm
  {
    const official = matchOfficial(alerts, CATEGORY_META.storm.keywords);
    if (official) {
      cards.push(buildFromOfficial("storm", official, area));
    } else if (stormDay) {
      cards.push({
        id: "storm",
        label: "Storm",
        emoji: CATEGORY_META.storm.emoji,
        color: CATEGORY_META.storm.color,
        gradient: CATEGORY_META.storm.gradient,
        severity: "high",
        active: true,
        title: "Thunderstorm conditions likely",
        description: `Stormy conditions are indicated around ${dayLabel(stormDay)}. Lightning and brief heavy showers are possible.`,
        issued: stormDay.datetime,
        expires: null,
        area,
        tips: CATEGORY_META.storm.tips,
        source: "forecast",
        metrics: [
          { label: "Conditions", value: stormDay.conditions ?? "Stormy" },
          { label: "Rain chance", value: formatMetric(stormDay.precipProbability, 0, "%") },
        ],
      });
    } else if (
      isNumber(rainMax) &&
      rainMax >= t.rainHigh &&
      isNumber(windMax) &&
      windMax >= t.windMedium
    ) {
      cards.push({
        id: "storm",
        label: "Storm",
        emoji: CATEGORY_META.storm.emoji,
        color: CATEGORY_META.storm.color,
        gradient: CATEGORY_META.storm.gradient,
        severity: "medium",
        active: true,
        title: "Unsettled storm potential",
        description: `Heavy rain and stronger winds overlap near ${dayLabel(rainDay)}. Localized storm cells are possible.`,
        issued: rainDay?.datetime ?? null,
        expires: null,
        area,
        tips: CATEGORY_META.storm.tips,
        source: "forecast",
        metrics: [
          { label: "Peak rain", value: formatMetric(rainMax, 1, ` ${t.precipUnit}`) },
          { label: "Peak wind", value: formatMetric(windMax, 0, ` ${t.speedUnit}`) },
        ],
      });
    } else {
      cards.push(clearCard("storm", area));
    }
  }

  // Snow
  {
    const official = matchOfficial(alerts, CATEGORY_META.snow.keywords);
    if (official) {
      cards.push(buildFromOfficial("snow", official, area));
    } else if (isNumber(snowMax) && snowMax >= t.snowTrace) {
      const severity: AlertSeverity = snowMax >= t.snowTrace * 8 ? "high" : "medium";
      cards.push({
        id: "snow",
        label: "Snow",
        emoji: CATEGORY_META.snow.emoji,
        color: CATEGORY_META.snow.color,
        gradient: CATEGORY_META.snow.gradient,
        severity,
        active: true,
        title: "Snowfall expected",
        description: `Snow accumulation around ${formatMetric(snowMax, 1, ` ${t.precipUnit}`)} is forecast near ${dayLabel(snowDay)}.`,
        issued: snowDay?.datetime ?? null,
        expires: null,
        area,
        tips: CATEGORY_META.snow.tips,
        source: "forecast",
        metrics: [
          { label: "Snow", value: formatMetric(snowMax, 1, ` ${t.precipUnit}`) },
          { label: "Low", value: formatMetric(snowDay?.temperatureMin, 0, t.tempUnit) },
        ],
      });
    } else if (
      days.some((day) => (day.precipType ?? []).some((type) => type.toLowerCase().includes("snow")))
    ) {
      const typed = days.find((day) =>
        (day.precipType ?? []).some((type) => type.toLowerCase().includes("snow")),
      );
      cards.push({
        id: "snow",
        label: "Snow",
        emoji: CATEGORY_META.snow.emoji,
        color: CATEGORY_META.snow.color,
        gradient: CATEGORY_META.snow.gradient,
        severity: "low",
        active: true,
        title: "Wintry precipitation possible",
        description: `Snow is listed in precipitation types near ${dayLabel(typed)}. Amounts may be light.`,
        issued: typed?.datetime ?? null,
        expires: null,
        area,
        tips: CATEGORY_META.snow.tips,
        source: "forecast",
        metrics: [{ label: "Type", value: "Snow mix" }],
      });
    } else {
      cards.push(clearCard("snow", area));
    }
  }

  // Heat
  {
    const official = matchOfficial(alerts, CATEGORY_META.heat.keywords);
    if (official) {
      cards.push(buildFromOfficial("heat", official, area));
    } else if (isNumber(heatMax) && heatMax >= t.heatHigh) {
      const severity: AlertSeverity =
        heatMax >= t.heatExtreme ? "extreme" : heatMax >= t.heatHigh + 2 ? "high" : "medium";
      cards.push({
        id: "heat",
        label: "Heat",
        emoji: CATEGORY_META.heat.emoji,
        color: CATEGORY_META.heat.color,
        gradient: CATEGORY_META.heat.gradient,
        severity,
        active: true,
        title: severity === "extreme" ? "Extreme heat warning" : "Heat warning",
        description: `Temperatures reaching ${formatMetric(heatMax, 0, t.tempUnit)} near ${dayLabel(heatDay)}. Limit prolonged sun exposure.`,
        issued: heatDay?.datetime ?? null,
        expires: null,
        area,
        tips: CATEGORY_META.heat.tips,
        source: "forecast",
        metrics: [
          { label: "High", value: formatMetric(heatMax, 0, t.tempUnit) },
          { label: "Feels like", value: formatMetric(heatDay?.feelsLikeMax ?? heatDay?.feelsLike, 0, t.tempUnit) },
        ],
      });
    } else {
      cards.push(clearCard("heat", area));
    }
  }

  // Flood
  {
    const official = matchOfficial(alerts, CATEGORY_META.flood.keywords);
    if (official) {
      cards.push(buildFromOfficial("flood", official, area));
    } else if (isNumber(rainMax) && rainMax >= t.floodPrecip) {
      cards.push({
        id: "flood",
        label: "Flood",
        emoji: CATEGORY_META.flood.emoji,
        color: CATEGORY_META.flood.color,
        gradient: CATEGORY_META.flood.gradient,
        severity: rainMax >= t.floodPrecip * 1.4 ? "high" : "medium",
        active: true,
        title: "Flood watch conditions",
        description: `Heavy rainfall totals near ${formatMetric(rainMax, 1, ` ${t.precipUnit}`)} on ${dayLabel(rainDay)} raise flood potential in low-lying areas.`,
        issued: rainDay?.datetime ?? null,
        expires: null,
        area,
        tips: CATEGORY_META.flood.tips,
        source: "forecast",
        metrics: [
          { label: "Rain total", value: formatMetric(rainMax, 1, ` ${t.precipUnit}`) },
          { label: "Chance", value: formatMetric(rainProb, 0, "%") },
        ],
      });
    } else {
      cards.push(clearCard("flood", area));
    }
  }

  // Wind
  {
    const official = matchOfficial(alerts, CATEGORY_META.wind.keywords);
    if (official) {
      cards.push(buildFromOfficial("wind", official, area));
    } else if (isNumber(windMax) && windMax >= t.windMedium) {
      const severity: AlertSeverity = windMax >= t.windHigh ? "high" : "medium";
      cards.push({
        id: "wind",
        label: "Wind",
        emoji: CATEGORY_META.wind.emoji,
        color: CATEGORY_META.wind.color,
        gradient: CATEGORY_META.wind.gradient,
        severity,
        active: true,
        title: severity === "high" ? "Strong wind warning" : "Wind advisory",
        description: `Gusts near ${formatMetric(windMax, 0, ` ${t.speedUnit}`)} expected around ${dayLabel(windDay)}. Secure outdoor items.`,
        issued: windDay?.datetime ?? null,
        expires: null,
        area,
        tips: CATEGORY_META.wind.tips,
        source: "forecast",
        metrics: [
          { label: "Gusts", value: formatMetric(windMax, 0, ` ${t.speedUnit}`) },
          { label: "Sustained", value: formatMetric(windDay?.windSpeed, 0, ` ${t.speedUnit}`) },
        ],
      });
    } else {
      cards.push(clearCard("wind", area));
    }
  }

  // Heavy Rain
  {
    const official = matchOfficial(alerts, CATEGORY_META["heavy-rain"].keywords);
    if (official) {
      cards.push(buildFromOfficial("heavy-rain", official, area));
    } else if (
      (isNumber(rainMax) && rainMax >= t.rainMedium) ||
      (isNumber(rainProb) && rainProb >= 70 && isNumber(rainMax) && rainMax >= t.rainMedium * 0.4)
    ) {
      const severity: AlertSeverity =
        isNumber(rainMax) && rainMax >= t.rainHigh ? "high" : "medium";
      cards.push({
        id: "heavy-rain",
        label: "Heavy Rain",
        emoji: CATEGORY_META["heavy-rain"].emoji,
        color: CATEGORY_META["heavy-rain"].color,
        gradient: CATEGORY_META["heavy-rain"].gradient,
        severity,
        active: true,
        title: severity === "high" ? "Heavy rain warning" : "Heavy rain likely",
        description: `Significant rainfall near ${formatMetric(rainMax, 1, ` ${t.precipUnit}`)} with ${formatMetric(rainProb, 0, "%")} chance around ${dayLabel(rainDay)}.`,
        issued: rainDay?.datetime ?? null,
        expires: null,
        area,
        tips: CATEGORY_META["heavy-rain"].tips,
        source: "forecast",
        metrics: [
          { label: "Rain", value: formatMetric(rainMax, 1, ` ${t.precipUnit}`) },
          { label: "Chance", value: formatMetric(rainProb, 0, "%") },
        ],
      });
    } else {
      cards.push(clearCard("heavy-rain", area));
    }
  }

  return cards;
}
