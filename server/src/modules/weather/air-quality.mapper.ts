import type { OpenMeteoAirQualityCurrent } from "./open-meteo-air-quality.client.js";
import type {
  AirQualityCategory,
  AirQualityPollutant,
  AirQualityResponse,
  HealthRecommendation,
  NormalizedLocation,
} from "./weather.types.js";

function asNumber(value: number | null | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function classifyUsAqi(aqi: number | null): AirQualityCategory {
  if (aqi === null) {
    return {
      level: "Unknown",
      color: "#7a8ba8",
      description: "Air quality data is unavailable for this location.",
    };
  }

  if (aqi <= 50) {
    return {
      level: "Good",
      color: "#22c55e",
      description: "Air quality is satisfactory and poses little or no risk.",
    };
  }
  if (aqi <= 100) {
    return {
      level: "Moderate",
      color: "#f59e0b",
      description: "Acceptable air quality; unusually sensitive people may notice mild effects.",
    };
  }
  if (aqi <= 150) {
    return {
      level: "Unhealthy for Sensitive Groups",
      color: "#f7921e",
      description: "Sensitive groups may experience health effects; the general public is less likely to be affected.",
    };
  }
  if (aqi <= 200) {
    return {
      level: "Unhealthy",
      color: "#ef4444",
      description: "Everyone may begin to experience health effects; sensitive groups may experience more serious effects.",
    };
  }
  if (aqi <= 300) {
    return {
      level: "Very Unhealthy",
      color: "#a855f7",
      description: "Health alert: everyone may experience more serious health effects.",
    };
  }
  return {
    level: "Hazardous",
    color: "#7f1d1d",
    description: "Emergency conditions: the entire population is more likely to be affected.",
  };
}

export function buildHealthRecommendation(aqi: number | null): HealthRecommendation {
  const category = classifyUsAqi(aqi);

  if (aqi === null) {
    return {
      ...category,
      summary: "Health guidance is unavailable until air quality data loads.",
      tips: ["Try another nearby location", "Check again in a few minutes"],
      outdoorActivity: "Unknown",
      sensitiveGroups: "Unknown",
      windows: "Unknown",
      maskSuggested: false,
    };
  }

  if (aqi <= 50) {
    return {
      ...category,
      summary: "Great day for outdoor activities. Air quality is healthy for everyone.",
      tips: [
        "Enjoy outdoor exercise and commuting as usual",
        "Open windows for fresh air ventilation",
        "No special precautions needed for most people",
      ],
      outdoorActivity: "Ideal",
      sensitiveGroups: "No extra caution needed",
      windows: "Safe to open",
      maskSuggested: false,
    };
  }

  if (aqi <= 100) {
    return {
      ...category,
      summary: "Air quality is acceptable. Unusually sensitive people should limit prolonged outdoor exertion.",
      tips: [
        "Most people can be outdoors normally",
        "Sensitive individuals should reduce intense outdoor exercise",
        "Prefer morning or evening outdoor activity if you notice irritation",
      ],
      outdoorActivity: "Generally fine",
      sensitiveGroups: "Limit prolonged exertion",
      windows: "OK to open; air out briefly",
      maskSuggested: false,
    };
  }

  if (aqi <= 150) {
    return {
      ...category,
      summary: "Sensitive groups should reduce outdoor activity. Others can continue with care.",
      tips: [
        "Children, older adults, and people with asthma or heart/lung conditions should shorten outdoor time",
        "Move workouts indoors when possible",
        "Keep windows closed during peak pollution hours",
      ],
      outdoorActivity: "Reduce for sensitive groups",
      sensitiveGroups: "Avoid prolonged/heavy outdoor exertion",
      windows: "Prefer closed during peaks",
      maskSuggested: true,
    };
  }

  if (aqi <= 200) {
    return {
      ...category,
      summary: "Unhealthy air — everyone should limit outdoor exposure.",
      tips: [
        "Avoid outdoor exercise and long outdoor stays",
        "Sensitive groups should stay indoors with filtered air when possible",
        "Wear a well-fitting mask if you must go outside",
        "Keep windows closed and use air purification if available",
      ],
      outdoorActivity: "Limit for everyone",
      sensitiveGroups: "Stay indoors when possible",
      windows: "Keep closed",
      maskSuggested: true,
    };
  }

  if (aqi <= 300) {
    return {
      ...category,
      summary: "Very unhealthy air — take protective measures immediately.",
      tips: [
        "Avoid all outdoor physical activity",
        "Remain indoors with windows closed",
        "Use an N95/FFP2 mask if outdoor travel is necessary",
        "Seek medical advice if you feel shortness of breath or chest pain",
      ],
      outdoorActivity: "Avoid",
      sensitiveGroups: "Remain indoors; follow care plans",
      windows: "Keep closed",
      maskSuggested: true,
    };
  }

  return {
    ...category,
    summary: "Hazardous air quality — emergency precautions recommended.",
    tips: [
      "Stay indoors and minimize all outdoor exposure",
      "Use high-quality filtration or clean-air spaces if available",
      "Wear an N95/FFP2 mask for any essential outdoor travel",
      "Contact local health authorities for emergency guidance",
    ],
    outdoorActivity: "Avoid completely",
    sensitiveGroups: "Emergency precautions",
    windows: "Keep sealed",
    maskSuggested: true,
  };
}

function pollutantPercent(value: number | null, limit: number): number | null {
  if (value === null || limit <= 0) return null;
  return Math.min(100, Math.round((value / limit) * 100));
}

function mapPollutants(current: OpenMeteoAirQualityCurrent | undefined): AirQualityPollutant[] {
  const pm25 = asNumber(current?.pm2_5);
  const pm10 = asNumber(current?.pm10);
  const no2 = asNumber(current?.nitrogen_dioxide);
  const o3 = asNumber(current?.ozone);
  const coUg = asNumber(current?.carbon_monoxide);
  const so2 = asNumber(current?.sulphur_dioxide);
  const coMg = coUg === null ? null : coUg / 1000;

  return [
    {
      id: "pm25",
      label: "PM 2.5",
      value: pm25,
      unit: "μg/m³",
      limit: 35,
      percent: pollutantPercent(pm25, 35),
      color: "#f59e0b",
      description: "Fine particles — respiratory risk",
    },
    {
      id: "pm10",
      label: "PM 10",
      value: pm10,
      unit: "μg/m³",
      limit: 70,
      percent: pollutantPercent(pm10, 70),
      color: "#f7921e",
      description: "Coarse particles — minor irritation",
    },
    {
      id: "no2",
      label: "NO₂",
      value: no2,
      unit: "μg/m³",
      limit: 100,
      percent: pollutantPercent(no2, 100),
      color: "#4a9eff",
      description: "Nitrogen dioxide — traffic-related",
    },
    {
      id: "o3",
      label: "O₃",
      value: o3,
      unit: "μg/m³",
      limit: 120,
      percent: pollutantPercent(o3, 120),
      color: "#a3e635",
      description: "Ground-level ozone — UV-driven",
    },
    {
      id: "co",
      label: "CO",
      value: coMg,
      unit: "mg/m³",
      limit: 10,
      percent: pollutantPercent(coMg, 10),
      color: "#22c55e",
      description: "Carbon monoxide — combustion product",
    },
    {
      id: "so2",
      label: "SO₂",
      value: so2,
      unit: "μg/m³",
      limit: 50,
      percent: pollutantPercent(so2, 50),
      color: "#7a8ba8",
      description: "Sulfur dioxide — industrial source",
    },
  ];
}

export function mapAirQualityResponse(params: {
  query: string;
  resolvedAddress: string;
  latitude: number;
  longitude: number;
  timezone: string | null;
  payloadCurrent: OpenMeteoAirQualityCurrent | undefined;
  providerTimezone?: string;
}): AirQualityResponse {
  const aqi = asNumber(params.payloadCurrent?.us_aqi);
  const europeanAqi = asNumber(params.payloadCurrent?.european_aqi);
  const category = classifyUsAqi(aqi);
  const health = buildHealthRecommendation(aqi);

  const location: NormalizedLocation = {
    query: params.query,
    resolvedAddress: params.resolvedAddress,
    latitude: params.latitude,
    longitude: params.longitude,
    timezone: params.timezone ?? params.providerTimezone ?? null,
    timezoneOffsetHours: null,
  };

  return {
    source: "open-meteo",
    location,
    observedAt: params.payloadCurrent?.time ?? null,
    aqi,
    europeanAqi,
    category,
    pollutants: mapPollutants(params.payloadCurrent),
    health,
  };
}
