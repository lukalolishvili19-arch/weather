import type { NormalizedDailyCondition } from "../api/weather.types";
import {
  formatForecastDay,
  formatNumber,
  temperatureUnitLabel,
  uvLabel,
  weatherIconToEmoji,
} from "./weather-format";

export type TravelScoreStatus = "Excellent" | "Good" | "Fair" | "Caution" | "Poor";

export type TravelDayPlan = {
  datetime: string | null;
  label: string;
  weekday: string;
  high: number | null;
  low: number | null;
  rainChance: number | null;
  windSpeed: number | null;
  humidity: number | null;
  uvIndex: number | null;
  conditions: string | null;
  emoji: string;
  outdoorScore: number;
  beachScore: number;
  hikingScore: number;
  travelScore: number;
  outdoorStatus: TravelScoreStatus;
  beachStatus: TravelScoreStatus;
  hikingStatus: TravelScoreStatus;
  travelStatus: TravelScoreStatus;
};

export type PackingItem = {
  id: string;
  label: string;
  reason: string;
  priority: "essential" | "recommended" | "optional";
  emoji: string;
};

export type ClothingSuggestion = {
  id: string;
  label: string;
  detail: string;
  emoji: string;
};

export type WeatherInsight = {
  id: string;
  title: string;
  body: string;
  tone: "positive" | "neutral" | "warning";
};

function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, Math.round(value)));
}

function isNumber(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function scoreStatus(score: number): TravelScoreStatus {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 55) return "Fair";
  if (score >= 40) return "Caution";
  return "Poor";
}

function statusColor(status: TravelScoreStatus): string {
  switch (status) {
    case "Excellent":
      return "#22c55e";
    case "Good":
      return "#a3e635";
    case "Fair":
      return "#f59e0b";
    case "Caution":
      return "#f97316";
    case "Poor":
      return "#ef4444";
  }
}

export function travelStatusColor(status: TravelScoreStatus): string {
  return statusColor(status);
}

type Thresholds = {
  beachIdealMin: number;
  beachIdealMax: number;
  hikeComfortMax: number;
  heatPenaltyStart: number;
  coldPenaltyStart: number;
  windPenaltyStart: number;
};

function thresholdsFor(units: string): Thresholds {
  if (units === "us") {
    return {
      beachIdealMin: 75,
      beachIdealMax: 95,
      hikeComfortMax: 86,
      heatPenaltyStart: 95,
      coldPenaltyStart: 50,
      windPenaltyStart: 20,
    };
  }
  return {
    beachIdealMin: 24,
    beachIdealMax: 34,
    hikeComfortMax: 30,
    heatPenaltyStart: 35,
    coldPenaltyStart: 10,
    windPenaltyStart: 30,
  };
}

export function scoreTravelDay(
  day: NormalizedDailyCondition,
  index: number,
  units: string,
  timezone: string | null,
): TravelDayPlan {
  const t = thresholdsFor(units);
  const high = day.temperatureMax ?? day.temperature;
  const low = day.temperatureMin ?? day.temperature;
  const rain = day.precipProbability ?? (isNumber(day.precip) && day.precip > 0 ? 50 : 0);
  const wind = day.windGust ?? day.windSpeed ?? 0;
  const uv = day.uvIndex ?? 0;
  const humidity = day.humidity ?? 50;
  const cloud = day.cloudCover ?? 40;

  const rainPenalty = (rain ?? 0) * 0.85;
  const heatPenalty = isNumber(high) ? Math.max(0, high - t.heatPenaltyStart) * 4.5 : 0;
  const coldPenalty = isNumber(high) ? Math.max(0, t.coldPenaltyStart - high) * 3 : 0;
  const windPenalty = Math.max(0, wind - t.windPenaltyStart) * 1.4;
  const uvPenalty = Math.max(0, uv - 7) * 3;
  const humidityPenalty = Math.max(0, humidity - 75) * 0.35;

  const outdoorScore = clamp(
    100 - rainPenalty - heatPenalty - coldPenalty - windPenalty * 0.6 - uvPenalty * 0.5,
  );

  let beachScore = 40;
  if (isNumber(high)) {
    if (high >= t.beachIdealMin && high <= t.beachIdealMax) beachScore = 88;
    else if (high > t.beachIdealMax) beachScore = 88 - (high - t.beachIdealMax) * 4;
    else beachScore = 55 - (t.beachIdealMin - high) * 2.5;
  }
  beachScore = clamp(beachScore - rainPenalty * 0.9 - windPenalty * 0.8 - cloud * 0.15);

  let hikingScore = 90;
  if (isNumber(high)) {
    hikingScore -= Math.max(0, high - t.hikeComfortMax) * 4;
    hikingScore -= Math.max(0, t.coldPenaltyStart + 2 - high) * 2.5;
  }
  hikingScore = clamp(
    hikingScore - rainPenalty * 1.1 - windPenalty * 0.7 - uvPenalty - humidityPenalty,
  );

  const travelScore = clamp(
    96 - rainPenalty * 0.75 - heatPenalty * 0.7 - coldPenalty * 0.8 - windPenalty * 0.5,
  );

  const labels = formatForecastDay(day.datetime, index, timezone);

  return {
    datetime: day.datetime,
    label: labels.day,
    weekday: labels.date,
    high: isNumber(high) ? high : null,
    low: isNumber(low) ? low : null,
    rainChance: isNumber(rain) ? rain : null,
    windSpeed: isNumber(day.windSpeed) ? day.windSpeed : null,
    humidity: isNumber(day.humidity) ? day.humidity : null,
    uvIndex: isNumber(day.uvIndex) ? day.uvIndex : null,
    conditions: day.conditions,
    emoji: weatherIconToEmoji(day.icon),
    outdoorScore,
    beachScore,
    hikingScore,
    travelScore,
    outdoorStatus: scoreStatus(outdoorScore),
    beachStatus: scoreStatus(beachScore),
    hikingStatus: scoreStatus(hikingScore),
    travelStatus: scoreStatus(travelScore),
  };
}

export function buildTravelPlans(
  days: NormalizedDailyCondition[],
  units: string,
  timezone: string | null,
): TravelDayPlan[] {
  return days.slice(0, 14).map((day, index) => scoreTravelDay(day, index, units, timezone));
}

export function pickBestTravelDay(plans: TravelDayPlan[]): TravelDayPlan | null {
  if (!plans.length) return null;
  return [...plans].sort((a, b) => {
    if (b.travelScore !== a.travelScore) return b.travelScore - a.travelScore;
    return (a.rainChance ?? 100) - (b.rainChance ?? 100);
  })[0] ?? null;
}

export function buildPackingList(plans: TravelDayPlan[], units: string): PackingItem[] {
  const highs = plans.map((day) => day.high).filter(isNumber);
  const lows = plans.map((day) => day.low).filter(isNumber);
  const maxHigh = highs.length ? Math.max(...highs) : null;
  const minLow = lows.length ? Math.min(...lows) : null;
  const maxRain = Math.max(...plans.map((day) => day.rainChance ?? 0), 0);
  const maxUv = Math.max(...plans.map((day) => day.uvIndex ?? 0), 0);
  const maxWind = Math.max(...plans.map((day) => day.windSpeed ?? 0), 0);
  const t = thresholdsFor(units);
  const items: PackingItem[] = [
    {
      id: "water",
      label: "Reusable water bottle",
      reason: "Stay hydrated on travel days",
      priority: "essential",
      emoji: "💧",
    },
    {
      id: "charger",
      label: "Phone charger / power bank",
      reason: "Keep maps and tickets available",
      priority: "essential",
      emoji: "🔌",
    },
  ];

  if (maxRain >= 40) {
    items.push({
      id: "umbrella",
      label: "Compact umbrella",
      reason: `Rain chances peak near ${formatNumber(maxRain, 0)}%`,
      priority: "essential",
      emoji: "☂️",
    });
    items.push({
      id: "rain-jacket",
      label: "Light rain jacket",
      reason: "Useful for showers and wind-driven spray",
      priority: "recommended",
      emoji: "🧥",
    });
  } else if (maxRain >= 20) {
    items.push({
      id: "packable-shell",
      label: "Packable shell",
      reason: "A few damp intervals are possible",
      priority: "optional",
      emoji: "🧥",
    });
  }

  if (isNumber(maxHigh) && maxHigh >= t.beachIdealMin) {
    items.push({
      id: "sunscreen",
      label: "Sunscreen SPF 30+",
      reason: `Highs reach ${formatNumber(maxHigh, 0)}${temperatureUnitLabel(units)}`,
      priority: maxUv >= 6 ? "essential" : "recommended",
      emoji: "🧴",
    });
    items.push({
      id: "sunglasses",
      label: "Sunglasses",
      reason: "Bright daytime conditions expected",
      priority: "recommended",
      emoji: "🕶️",
    });
  }

  if (maxUv >= 7) {
    items.push({
      id: "hat",
      label: "Wide-brim hat / cap",
      reason: `UV peaks at ${formatNumber(maxUv, 0)} (${uvLabel(maxUv)})`,
      priority: "essential",
      emoji: "🧢",
    });
  }

  if (isNumber(minLow) && minLow <= t.coldPenaltyStart + 4) {
    items.push({
      id: "layer",
      label: "Warm mid-layer",
      reason: `Overnight lows near ${formatNumber(minLow, 0)}${temperatureUnitLabel(units)}`,
      priority: "recommended",
      emoji: "🧶",
    });
  }

  if (maxWind >= t.windPenaltyStart) {
    items.push({
      id: "windbreaker",
      label: "Windbreaker",
      reason: `Gusty stretches up to ~${formatNumber(maxWind, 0)}`,
      priority: "recommended",
      emoji: "🌬️",
    });
  }

  const beachFriendly = plans.some((day) => day.beachScore >= 70);
  if (beachFriendly) {
    items.push({
      id: "swim",
      label: "Swimwear / towel",
      reason: "At least one strong beach-friendly day ahead",
      priority: "optional",
      emoji: "🏖️",
    });
  }

  const hikeFriendly = plans.some((day) => day.hikingScore >= 70);
  if (hikeFriendly) {
    items.push({
      id: "shoes",
      label: "Comfortable walking shoes",
      reason: "Good hiking/outdoor walking windows available",
      priority: "recommended",
      emoji: "👟",
    });
  }

  return items;
}

export function buildClothingSuggestions(
  plans: TravelDayPlan[],
  units: string,
): ClothingSuggestion[] {
  const highs = plans.map((day) => day.high).filter(isNumber);
  const lows = plans.map((day) => day.low).filter(isNumber);
  const avgHigh = highs.length ? highs.reduce((a, b) => a + b, 0) / highs.length : null;
  const minLow = lows.length ? Math.min(...lows) : null;
  const maxRain = Math.max(...plans.map((day) => day.rainChance ?? 0), 0);
  const t = thresholdsFor(units);
  const unit = temperatureUnitLabel(units);
  const suggestions: ClothingSuggestion[] = [];

  if (isNumber(avgHigh) && avgHigh >= t.beachIdealMin) {
    suggestions.push({
      id: "light",
      label: "Breathable light clothing",
      detail: `Average highs near ${formatNumber(avgHigh, 0)}${unit} — linen, cotton, shorts`,
      emoji: "👕",
    });
  } else if (isNumber(avgHigh) && avgHigh >= t.coldPenaltyStart + 8) {
    suggestions.push({
      id: "mild",
      label: "Smart casual layers",
      detail: `Mild days around ${formatNumber(avgHigh, 0)}${unit} — tee + light overshirt`,
      emoji: "👔",
    });
  } else {
    suggestions.push({
      id: "cool",
      label: "Warmer daywear",
      detail: "Cooler pattern — long sleeves and insulated options",
      emoji: "🧥",
    });
  }

  if (isNumber(minLow) && minLow <= t.coldPenaltyStart + 6) {
    suggestions.push({
      id: "evening",
      label: "Evening layer",
      detail: `Nights dip to ${formatNumber(minLow, 0)}${unit} — pack a sweater or light jacket`,
      emoji: "🌙",
    });
  }

  if (maxRain >= 35) {
    suggestions.push({
      id: "waterproof",
      label: "Water-resistant outerwear",
      detail: "Choose quick-dry fabrics and shoes that handle wet sidewalks",
      emoji: "🥾",
    });
  } else {
    suggestions.push({
      id: "comfort-shoes",
      label: "Comfort walking shoes",
      detail: "Dry-leaning forecast favors sneakers or light trail shoes",
      emoji: "👟",
    });
  }

  suggestions.push({
    id: "sun",
    label: "Sun-ready accessories",
    detail: "Cap, sunglasses, and SPF for exposed midday hours",
    emoji: "☀️",
  });

  return suggestions;
}

export function buildWeatherInsights(
  plans: TravelDayPlan[],
  best: TravelDayPlan | null,
  units: string,
): WeatherInsight[] {
  if (!plans.length) {
    return [
      {
        id: "empty",
        title: "No forecast yet",
        body: "Travel insights appear once daily forecast data loads.",
        tone: "neutral",
      },
    ];
  }

  const unit = temperatureUnitLabel(units);
  const insights: WeatherInsight[] = [];
  const wetDays = plans.filter((day) => (day.rainChance ?? 0) >= 50).length;
  const hotDays = plans.filter((day) => (day.high ?? 0) >= thresholdsFor(units).heatPenaltyStart).length;
  const bestOutdoor = [...plans].sort((a, b) => b.outdoorScore - a.outdoorScore)[0];
  const bestBeach = [...plans].sort((a, b) => b.beachScore - a.beachScore)[0];
  const bestHike = [...plans].sort((a, b) => b.hikingScore - a.hikingScore)[0];

  if (best) {
    insights.push({
      id: "best-day",
      title: `${best.label} looks best for travel`,
      body: `Travel score ${best.travelScore}/100 with ${formatNumber(best.high, 0)}${unit} highs and ${formatNumber(best.rainChance, 0)}% rain chance.`,
      tone: best.travelScore >= 70 ? "positive" : "neutral",
    });
  }

  if (bestOutdoor) {
    insights.push({
      id: "outdoor",
      title: `Best outdoor window: ${bestOutdoor.label}`,
      body: `Outdoor score ${bestOutdoor.outdoorScore}/100 (${bestOutdoor.outdoorStatus}). ${bestOutdoor.conditions ?? "Plan flexible outdoor time."}`,
      tone: bestOutdoor.outdoorScore >= 65 ? "positive" : "warning",
    });
  }

  if (bestBeach) {
    insights.push({
      id: "beach",
      title: `Beach day pick: ${bestBeach.label}`,
      body: `Beach score ${bestBeach.beachScore}/100. ${
        bestBeach.beachScore >= 70
          ? "Warm enough for waterfront plans."
          : "More of a stroll-by-the-water day than a full beach session."
      }`,
      tone: bestBeach.beachScore >= 70 ? "positive" : "neutral",
    });
  }

  if (bestHike) {
    insights.push({
      id: "hike",
      title: `Hiking lean: ${bestHike.label}`,
      body: `Hiking score ${bestHike.hikingScore}/100. ${
        bestHike.hikingScore >= 70
          ? "Comfortable temps and manageable rain risk for trails."
          : "Keep hikes shorter or start early if heat/rain builds."
      }`,
      tone: bestHike.hikingScore >= 70 ? "positive" : "warning",
    });
  }

  if (wetDays > 0) {
    insights.push({
      id: "rain",
      title: `${wetDays} wetter day${wetDays > 1 ? "s" : ""} in the window`,
      body: "Build indoor backups and keep a shell accessible in your day bag.",
      tone: "warning",
    });
  } else {
    insights.push({
      id: "dry",
      title: "Mostly dry stretch ahead",
      body: "Rain risk stays modest — great for open-air sightseeing and outdoor dining.",
      tone: "positive",
    });
  }

  if (hotDays >= 2) {
    insights.push({
      id: "heat",
      title: "Heat will shape the itinerary",
      body: "Schedule outdoor highlights for morning/evening and prioritize shade midday.",
      tone: "warning",
    });
  }

  return insights;
}

export function averageScore(plans: TravelDayPlan[], key: keyof Pick<TravelDayPlan, "outdoorScore" | "beachScore" | "hikingScore" | "travelScore">): number {
  if (!plans.length) return 0;
  return clamp(plans.reduce((sum, day) => sum + day[key], 0) / plans.length);
}
