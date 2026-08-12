import type {
  CurrentWeatherResponse,
  DailyForecastResponse,
  HourlyForecastResponse,
} from "../../api/weather.types";
import type { ChartPoint, ChartRange, MetricConfig } from "../../hooks/use-analytics-charts";
import {
  formatNumber,
  precipUnitLabel,
  speedUnitLabel,
  temperatureUnitLabel,
} from "../weather-format";
import {
  formatSummaryHumidity,
  formatSummaryRows,
  formatSummaryTemperature,
  type PeriodWeatherSummary,
} from "../weather-summary";
import type { ExportDocument, ExportTable } from "./export-types";

function nowLabel() {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date());
}

function dayRow(day: DailyForecastResponse["days"][number], units: string) {
  const tempUnit = temperatureUnitLabel(units);
  const speedUnit = speedUnitLabel(units);
  const precipUnit = precipUnitLabel(units);
  return [
    day.datetime ?? "—",
    day.conditions ?? "—",
    day.temperatureMax == null ? "—" : `${formatNumber(day.temperatureMax, 0)}${tempUnit}`,
    day.temperatureMin == null ? "—" : `${formatNumber(day.temperatureMin, 0)}${tempUnit}`,
    day.humidity == null ? "—" : `${formatNumber(day.humidity, 0)}%`,
    day.windSpeed == null ? "—" : `${formatNumber(day.windSpeed, 0)} ${speedUnit}`,
    day.pressure == null ? "—" : `${formatNumber(day.pressure, 0)} hPa`,
    day.precipProbability == null ? "—" : `${formatNumber(day.precipProbability, 0)}%`,
    day.precip == null ? "—" : `${formatNumber(day.precip, 1)} ${precipUnit}`,
    day.uvIndex == null ? "—" : formatNumber(day.uvIndex, 0),
    day.cloudCover == null ? "—" : `${formatNumber(day.cloudCover, 0)}%`,
  ];
}

function summaryTable(title: string, summary: PeriodWeatherSummary | null, units: string): ExportTable {
  if (!summary) {
    return {
      title,
      headers: ["Metric", "Value"],
      rows: [["Status", "No summary data"]],
    };
  }

  return {
    title,
    headers: ["Metric", "Value"],
    rows: formatSummaryRows(summary, units).map((row) => [row.label, row.value]),
  };
}

export function buildWeatherReportDocument(params: {
  locationLabel: string;
  current: CurrentWeatherResponse | null;
  daily: DailyForecastResponse | null;
  weeklySummary: PeriodWeatherSummary | null;
  monthlySummary: PeriodWeatherSummary | null;
}): ExportDocument {
  const units = params.current?.units ?? params.daily?.units ?? "metric";
  const tempUnit = temperatureUnitLabel(units);
  const speedUnit = speedUnitLabel(units);
  const current = params.current?.current;

  const tables: ExportTable[] = [
    {
      title: "Current Conditions",
      headers: ["Metric", "Value"],
      rows: [
        ["Location", params.locationLabel],
        [
          "Temperature",
          current?.temperature == null
            ? "—"
            : `${formatNumber(current.temperature, 1)}${tempUnit}`,
        ],
        [
          "Feels Like",
          current?.feelsLike == null ? "—" : `${formatNumber(current.feelsLike, 1)}${tempUnit}`,
        ],
        [
          "Humidity",
          current?.humidity == null ? "—" : `${formatNumber(current.humidity, 0)}%`,
        ],
        [
          "Wind",
          current?.windSpeed == null
            ? "—"
            : `${formatNumber(current.windSpeed, 0)} ${speedUnit}`,
        ],
        [
          "Pressure",
          current?.pressure == null ? "—" : `${formatNumber(current.pressure, 0)} hPa`,
        ],
        ["UV Index", current?.uvIndex == null ? "—" : formatNumber(current.uvIndex, 0)],
        [
          "Cloud Cover",
          current?.cloudCover == null ? "—" : `${formatNumber(current.cloudCover, 0)}%`,
        ],
        ["Conditions", current?.conditions ?? "—"],
      ],
    },
    {
      title: "Daily Forecast",
      headers: [
        "Date",
        "Conditions",
        "High",
        "Low",
        "Humidity",
        "Wind",
        "Pressure",
        "Rain %",
        "Precip",
        "UV",
        "Clouds",
      ],
      rows: (params.daily?.days ?? []).map((day) => dayRow(day, units)),
    },
    summaryTable("Weekly Summary", params.weeklySummary, units),
    summaryTable("Monthly Summary", params.monthlySummary, units),
  ];

  return {
    title: "SkyCast Weather Report",
    subtitle: `${params.locationLabel} · Live weather and forecast export`,
    generatedAt: nowLabel(),
    tables,
  };
}

export function buildAnalyticsReportDocument(params: {
  locationLabel: string;
  range: ChartRange;
  metric: MetricConfig;
  points: ChartPoint[];
  units: string;
  weeklySummary: PeriodWeatherSummary | null;
  monthlySummary: PeriodWeatherSummary | null;
  hourly?: HourlyForecastResponse | null;
  daily?: DailyForecastResponse | null;
}): ExportDocument {
  const rangeLabel =
    params.range === "hourly" ? "24 Hours" : params.range === "weekly" ? "Weekly" : "30 Days";

  const tables: ExportTable[] = [
    {
      title: `${params.metric.label} · ${rangeLabel}`,
      headers: params.metric.secondaryLabel
        ? ["Label", params.metric.label, params.metric.secondaryLabel]
        : ["Label", params.metric.label],
      rows: params.points.map((point) => {
        const row: Array<string | number> = [
          point.label,
          `${formatNumber(point.value, 1)}${params.metric.unit}`,
        ];
        if (params.metric.secondaryLabel) {
          const secondaryUnit =
            params.metric.id === "rain" ? ` ${params.metric.secondaryLabel}` : params.metric.unit;
          row.push(
            point.secondary == null
              ? "—"
              : `${formatNumber(point.secondary, 1)}${secondaryUnit}`,
          );
        }
        return row;
      }),
    },
    {
      title: "Analytics Snapshot",
      headers: ["Metric", "Value"],
      rows: [
        ["Location", params.locationLabel],
        ["Range", rangeLabel],
        ["Selected Metric", params.metric.label],
        [
          "Average Temperature (weekly)",
          formatSummaryTemperature(params.weeklySummary?.averageTemperature ?? null, params.units),
        ],
        [
          "Average Humidity (weekly)",
          formatSummaryHumidity(params.weeklySummary?.averageHumidity ?? null),
        ],
        [
          "Highest Temperature (weekly)",
          params.weeklySummary?.highestTemperature?.display ?? "—",
        ],
        [
          "Lowest Temperature (weekly)",
          params.weeklySummary?.lowestTemperature?.display ?? "—",
        ],
      ],
    },
    summaryTable("Weekly Summary", params.weeklySummary, params.units),
    summaryTable("Monthly Summary", params.monthlySummary, params.units),
  ];

  if (params.daily?.days?.length) {
    tables.push({
      title: "Forecast Source Data",
      headers: [
        "Date",
        "Conditions",
        "High",
        "Low",
        "Humidity",
        "Wind",
        "Pressure",
        "Rain %",
        "Precip",
        "UV",
        "Clouds",
      ],
      rows: params.daily.days.map((day) => dayRow(day, params.units)),
    });
  }

  return {
    title: "SkyCast Analytics Report",
    subtitle: `${params.locationLabel} · ${rangeLabel} · ${params.metric.label}`,
    generatedAt: nowLabel(),
    tables,
  };
}
