import type { NormalizedDailyCondition } from "../api/weather.types";
import {
  formatNumber,
  precipUnitLabel,
  speedUnitLabel,
  temperatureUnitLabel,
  uvLabel,
} from "./weather-format";

export type DayHighlight = {
  label: string;
  datetime: string | null;
  value: number;
  display: string;
};

export type PeriodWeatherSummary = {
  period: "weekly" | "monthly";
  dayCount: number;
  highestTemperature: DayHighlight | null;
  lowestTemperature: DayHighlight | null;
  averageTemperature: number | null;
  averageHumidity: number | null;
  rainiestDay: DayHighlight | null;
  windiestDay: DayHighlight | null;
  highestUv: DayHighlight | null;
  totalPrecip: number | null;
  averageWind: number | null;
  averagePressure: number | null;
  averageCloudCover: number | null;
};

function isNumber(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function dayLabel(
  day: NormalizedDailyCondition,
  index: number,
  timezone: string | null,
  period: "weekly" | "monthly",
): string {
  if (!day.datetime) return period === "weekly" ? `Day ${index + 1}` : `D${index + 1}`;
  try {
    const date = new Date(`${day.datetime}T12:00:00`);
    return new Intl.DateTimeFormat(undefined, {
      weekday: period === "weekly" ? "long" : "short",
      month: period === "monthly" ? "short" : undefined,
      day: period === "monthly" ? "numeric" : undefined,
      timeZone: timezone || undefined,
    }).format(date);
  } catch {
    return day.datetime;
  }
}

function average(values: number[]): number | null {
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function pickExtreme(
  days: NormalizedDailyCondition[],
  timezone: string | null,
  period: "weekly" | "monthly",
  read: (day: NormalizedDailyCondition) => number | null,
  mode: "max" | "min",
  formatValue: (value: number) => string,
): DayHighlight | null {
  let bestIndex = -1;
  let bestValue = mode === "max" ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY;

  for (let index = 0; index < days.length; index += 1) {
    const day = days[index];
    if (!day) continue;
    const value = read(day);
    if (!isNumber(value)) continue;
    const isBetter = mode === "max" ? value > bestValue : value < bestValue;
    if (isBetter) {
      bestIndex = index;
      bestValue = value;
    }
  }

  const bestDay = bestIndex >= 0 ? days[bestIndex] : undefined;
  if (!bestDay || !Number.isFinite(bestValue)) return null;

  return {
    label: dayLabel(bestDay, bestIndex, timezone, period),
    datetime: bestDay.datetime,
    value: bestValue,
    display: formatValue(bestValue),
  };
}

function dayTemperature(day: NormalizedDailyCondition): number | null {
  if (isNumber(day.temperatureMax) && isNumber(day.temperatureMin)) {
    return (day.temperatureMax + day.temperatureMin) / 2;
  }
  if (isNumber(day.temperature)) return day.temperature;
  if (isNumber(day.temperatureMax)) return day.temperatureMax;
  if (isNumber(day.temperatureMin)) return day.temperatureMin;
  return null;
}

function dayHigh(day: NormalizedDailyCondition): number | null {
  return day.temperatureMax ?? day.temperature;
}

function dayLow(day: NormalizedDailyCondition): number | null {
  return day.temperatureMin ?? day.temperature;
}

function dayRainScore(day: NormalizedDailyCondition): number | null {
  if (isNumber(day.precip) && day.precip > 0) return day.precip;
  if (isNumber(day.precipProbability)) return day.precipProbability;
  return day.precip;
}

export function calculatePeriodSummary(
  days: NormalizedDailyCondition[],
  period: "weekly" | "monthly",
  units: string,
  timezone: string | null,
): PeriodWeatherSummary {
  const tempUnit = temperatureUnitLabel(units);
  const speedUnit = speedUnitLabel(units);
  const precipUnit = precipUnitLabel(units);

  const temps = days.map(dayTemperature).filter(isNumber);
  const humidities = days.map((day) => day.humidity).filter(isNumber);
  const winds = days.map((day) => day.windSpeed).filter(isNumber);
  const pressures = days.map((day) => day.pressure).filter(isNumber);
  const clouds = days.map((day) => day.cloudCover).filter(isNumber);
  const precips = days.map((day) => day.precip).filter(isNumber);

  const highestTemperature = pickExtreme(
    days,
    timezone,
    period,
    dayHigh,
    "max",
    (value) => `${formatNumber(value, 0)}${tempUnit}`,
  );

  const lowestTemperature = pickExtreme(
    days,
    timezone,
    period,
    dayLow,
    "min",
    (value) => `${formatNumber(value, 0)}${tempUnit}`,
  );

  const rainiestDay = pickExtreme(
    days,
    timezone,
    period,
    dayRainScore,
    "max",
    (value) => {
      // Prefer showing mm/in when precip amount exists in the winning day.
      return `${formatNumber(value, value >= 10 ? 0 : 1)}${
        days.some((day) => isNumber(day.precip) && day.precip === value) ? precipUnit : "%"
      }`;
    },
  );

  const windiestDay = pickExtreme(
    days,
    timezone,
    period,
    (day) => day.windGust ?? day.windSpeed,
    "max",
    (value) => `${formatNumber(value, 0)} ${speedUnit}`,
  );

  const highestUv = pickExtreme(
    days,
    timezone,
    period,
    (day) => day.uvIndex,
    "max",
    (value) => `${formatNumber(value, 0)} (${uvLabel(value)})`,
  );

  // Improve rainiest display if we can attach actual precip for that day.
  let rainiest = rainiestDay;
  if (rainiest) {
    const match = days.find((day) => day.datetime === rainiest?.datetime);
    if (match && isNumber(match.precip) && match.precip > 0) {
      rainiest = {
        ...rainiest,
        value: match.precip,
        display: `${formatNumber(match.precip, 1)} ${precipUnit}${
          isNumber(match.precipProbability)
            ? ` · ${formatNumber(match.precipProbability, 0)}%`
            : ""
        }`,
      };
    } else if (match && isNumber(match.precipProbability)) {
      rainiest = {
        ...rainiest,
        display: `${formatNumber(match.precipProbability, 0)}% chance`,
      };
    }
  }

  return {
    period,
    dayCount: days.length,
    highestTemperature,
    lowestTemperature,
    averageTemperature: average(temps),
    averageHumidity: average(humidities),
    rainiestDay: rainiest,
    windiestDay,
    highestUv,
    totalPrecip: precips.length ? precips.reduce((sum, value) => sum + value, 0) : null,
    averageWind: average(winds),
    averagePressure: average(pressures),
    averageCloudCover: average(clouds),
  };
}

export function formatSummaryTemperature(
  value: number | null,
  units: string,
): string {
  if (value === null) return "—";
  return `${formatNumber(value, 1)}${temperatureUnitLabel(units)}`;
}

export function formatSummaryHumidity(value: number | null): string {
  if (value === null) return "—";
  return `${formatNumber(value, 0)}%`;
}

export function formatSummaryRows(
  summary: PeriodWeatherSummary,
  units: string,
): Array<{ label: string; value: string; color: string }> {
  const speedUnit = speedUnitLabel(units);
  const precipUnit = precipUnitLabel(units);

  return [
    {
      label: "Highest Temperature",
      value: summary.highestTemperature
        ? `${summary.highestTemperature.label} · ${summary.highestTemperature.display}`
        : "—",
      color: "#f7921e",
    },
    {
      label: "Lowest Temperature",
      value: summary.lowestTemperature
        ? `${summary.lowestTemperature.label} · ${summary.lowestTemperature.display}`
        : "—",
      color: "#4a9eff",
    },
    {
      label: "Average Temperature",
      value: formatSummaryTemperature(summary.averageTemperature, units),
      color: "#ffc06a",
    },
    {
      label: "Average Humidity",
      value: formatSummaryHumidity(summary.averageHumidity),
      color: "#38bdf8",
    },
    {
      label: "Rainiest Day",
      value: summary.rainiestDay
        ? `${summary.rainiestDay.label} · ${summary.rainiestDay.display}`
        : "—",
      color: "#4a9eff",
    },
    {
      label: "Windiest Day",
      value: summary.windiestDay
        ? `${summary.windiestDay.label} · ${summary.windiestDay.display}`
        : "—",
      color: "#a3e635",
    },
    {
      label: "Highest UV",
      value: summary.highestUv
        ? `${summary.highestUv.label} · ${summary.highestUv.display}`
        : "—",
      color: "#f59e0b",
    },
    {
      label: "Total Rain",
      value:
        summary.totalPrecip === null
          ? "—"
          : `${formatNumber(summary.totalPrecip, 1)} ${precipUnit}`,
      color: "#38bdf8",
    },
    {
      label: "Average Wind",
      value:
        summary.averageWind === null
          ? "—"
          : `${formatNumber(summary.averageWind, 0)} ${speedUnit}`,
      color: "#a3e635",
    },
    {
      label: "Average Pressure",
      value:
        summary.averagePressure === null
          ? "—"
          : `${formatNumber(summary.averagePressure, 0)} hPa`,
      color: "#94a3b8",
    },
    {
      label: "Average Cloud Cover",
      value:
        summary.averageCloudCover === null
          ? "—"
          : `${formatNumber(summary.averageCloudCover, 0)}%`,
      color: "#7a8ba8",
    },
    {
      label: "Days Analyzed",
      value: `${summary.dayCount}`,
      color: "#e8edf8",
    },
  ];
}
