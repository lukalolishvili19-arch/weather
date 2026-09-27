import { AnimatePresence, motion } from "framer-motion";
import {
  Droplets,
  Gauge,
  GitCompareArrows,
  Leaf,
  Plus,
  Thermometer,
  Wind,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useCityCompare } from "../../hooks/use-city-compare";
import { useI18n } from "../../hooks/use-i18n";
import type { MessageKey } from "../../lib/i18n";
import {
  COMPARE_CITY_CATALOG,
  COMPARE_METRICS,
  MAX_COMPARE_CITIES,
  getStoredCompareCityIds,
  setStoredCompareCityIds,
  type CompareMetricId,
} from "../../lib/compare-cities";
import { PageContainer } from "../components/app-shell";
import {
  Badge,
  PageHeader,
  SectionLabel,
  StatCard,
  SurfaceCard,
} from "../components/primitives";
import { ChartTooltip } from "../components/weather-visuals";
import { cn } from "@/shared/lib/cn";

const metricIcons: Record<CompareMetricId, typeof Thermometer> = {
  temperature: Thermometer,
  humidity: Droplets,
  wind: Wind,
  pressure: Gauge,
  aqi: Leaf,
};

const compareMetricKeys: Record<CompareMetricId, MessageKey> = {
  temperature: "metric.temperature",
  humidity: "metric.humidity",
  wind: "metric.wind",
  pressure: "metric.pressure",
  aqi: "metric.aqi",
};

function rowMetricValue(
  row: {
    temperature: number | null;
    humidity: number | null;
    windSpeed: number | null;
    pressure: number | null;
    aqi: number | null;
  },
  metric: CompareMetricId,
) {
  switch (metric) {
    case "temperature":
      return row.temperature;
    case "humidity":
      return row.humidity;
    case "wind":
      return row.windSpeed;
    case "pressure":
      return row.pressure;
    case "aqi":
      return row.aqi;
  }
}

export function ComparePage() {
  const { t } = useI18n();
  const [cityIds, setCityIds] = useState<string[]>(() => getStoredCompareCityIds());
  const [metric, setMetric] = useState<CompareMetricId>("temperature");
  const compare = useCityCompare(cityIds);

  const activeMetric = COMPARE_METRICS.find((item) => item.id === metric) ?? COMPARE_METRICS[0];
  const activeMetricLabel = activeMetric
    ? t(compareMetricKeys[activeMetric.id])
    : t("metric.temperature");
  const ActiveIcon = metricIcons[metric];

  const availableToAdd = useMemo(
    () => COMPARE_CITY_CATALOG.filter((city) => !cityIds.includes(city.id)),
    [cityIds],
  );

  const updateCities = (next: string[]) => {
    const unique = [...new Set(next)].slice(0, MAX_COMPARE_CITIES);
    setCityIds(unique);
    setStoredCompareCityIds(unique);
  };

  const addCity = (id: string) => {
    if (cityIds.includes(id) || cityIds.length >= MAX_COMPARE_CITIES) return;
    updateCities([...cityIds, id]);
  };

  const removeCity = (id: string) => {
    if (cityIds.length <= 2) return;
    updateCities(cityIds.filter((item) => item !== id));
  };

  const barData = compare.chartData.map((row) => ({
    city: row.city,
    value: row[metric] ?? null,
    fill: row.fill,
  }));

  const leader = compare.leaders[metric];

  return (
    <PageContainer>
      <div className="mb-7 flex flex-wrap items-start justify-between gap-3">
        <PageHeader
          title={t("compare.title")}
          subtitle={t("compare.subtitle", { max: MAX_COMPARE_CITIES })}
        />
        <Badge variant="orange">
          <span className="inline-flex items-center gap-1.5">
            <GitCompareArrows size={12} />
            {t("compare.selected", { count: cityIds.length })}
          </span>
        </Badge>
      </div>

      <SurfaceCard className="mb-4">
        <SectionLabel>{t("compare.citiesInComparison")}</SectionLabel>
        <div className="mb-4 flex flex-wrap gap-2">
          {compare.rows.map((row) => (
            <span
              key={row.id}
              className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold"
              style={{
                borderColor: `${row.color}55`,
                background: `${row.color}14`,
                color: row.color,
              }}
            >
              <span className="h-2 w-2 rounded-full" style={{ background: row.color }} />
              {row.emoji} {row.name}
              <button
                type="button"
                className="rounded-md p-0.5 text-current/70 hover:bg-white/10 hover:text-current disabled:opacity-40"
                onClick={() => removeCity(row.id)}
                disabled={cityIds.length <= 2}
                aria-label={t("compare.removeCity", { name: row.name })}
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>

        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.08em] text-[#7a8ba8]">
          {t("compare.addCity")}{" "}
          {cityIds.length >= MAX_COMPARE_CITIES ? t("compare.limitReached") : ""}
        </p>
        <div className="flex flex-wrap gap-2">
          {availableToAdd.map((city) => (
            <button
              key={city.id}
              type="button"
              disabled={cityIds.length >= MAX_COMPARE_CITIES}
              onClick={() => addCity(city.id)}
              className="inline-flex items-center gap-1.5 rounded-[10px] border border-white/[0.07] bg-white/[0.03] px-3 py-1.5 text-xs font-semibold text-[#7a8ba8] transition hover:border-white/[0.12] hover:text-[#e8edf8] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Plus size={12} style={{ color: city.color }} />
              {city.name}
              <span className="text-[10px] opacity-60">{city.country}</span>
            </button>
          ))}
        </div>
      </SurfaceCard>

      <div className="mb-4 flex flex-wrap gap-2">
        {COMPARE_METRICS.map((item) => {
          const Icon = metricIcons[item.id];
          const active = metric === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setMetric(item.id)}
              className={cn(
                "relative flex items-center gap-1.5 rounded-[10px] px-3.5 py-2 text-xs font-bold transition-colors",
                active ? "text-[#e8edf8]" : "text-[#7a8ba8] hover:text-[#e8edf8]",
              )}
              style={
                active
                  ? {
                      background: `${item.color}18`,
                      boxShadow: `inset 0 0 0 1px ${item.color}55`,
                      color: item.color,
                    }
                  : {
                      background: "rgba(255,255,255,0.03)",
                      boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.07)",
                    }
              }
            >
              <Icon size={14} />
              {t(compareMetricKeys[item.id])}
            </button>
          );
        })}
      </div>

      {compare.isLoading && (
        <SurfaceCard className="mb-4">
          <p className="text-sm text-[#7a8ba8]">{t("compare.loading")}</p>
        </SurfaceCard>
      )}

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-5">
        {compare.rows.map((row) => (
          <StatCard
            key={`stat-${row.id}-${metric}`}
            icon={<ActiveIcon size={16} />}
            label={row.name}
            value={compare.formatMetricValue(metric, rowMetricValue(row, metric))}
            detail={
              metric === "aqi"
                ? row.aqiLevel ?? row.country
                : row.conditions ?? row.country
            }
            color={row.color}
          />
        ))}
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 xl:grid-cols-[1.4fr_1fr]">
        <SurfaceCard>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <SectionLabel className="mb-0">
              {t("compare.comparison", { metric: activeMetricLabel })}
            </SectionLabel>
            {leader && (
              <Badge variant="orange">
                {metric === "aqi" ? t("compare.cleanest") : t("compare.highest")}: {leader.name}
              </Badge>
            )}
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={metric}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
            >
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={barData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.04)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="city"
                    tick={{ fill: "#7a8ba8", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#7a8ba8", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={48}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(255,255,255,0.03)" }}
                    content={
                      <ChartTooltip
                        valueFormatter={(value) =>
                          compare.formatMetricValue(metric, value)
                        }
                      />
                    }
                  />
                  <Bar dataKey="value" name={activeMetricLabel} radius={[10, 10, 4, 4]}>
                    {barData.map((entry) => (
                      <Cell key={`cell-${entry.city}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          </AnimatePresence>
        </SurfaceCard>

        <SurfaceCard>
          <SectionLabel>{t("compare.allMetricsOverview")}</SectionLabel>
          <p className="mb-3 text-[11px] text-[#7a8ba8]">
            {t("compare.overviewHint")}
          </p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={compare.overviewData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.04)"
                vertical={false}
              />
              <XAxis
                dataKey="metric"
                tick={{ fill: "#7a8ba8", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#7a8ba8", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={40}
                domain={[0, 100]}
              />
              <Tooltip
                cursor={{ fill: "rgba(255,255,255,0.03)" }}
                content={
                  <ChartTooltip valueFormatter={(value) => `${value}`} />
                }
              />
              <Legend
                wrapperStyle={{ fontSize: 11, color: "#7a8ba8", paddingTop: 8 }}
              />
              {compare.rows.map((row) => (
                <Bar
                  key={row.id}
                  dataKey={row.id}
                  name={row.name}
                  fill={row.color}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={18}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </SurfaceCard>
      </div>

      <SurfaceCard>
        <SectionLabel>{t("compare.table")}</SectionLabel>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-white/[0.07] text-[11px] uppercase tracking-[0.08em] text-[#7a8ba8]">
                <th className="py-3 pr-4 font-bold">{t("compare.city")}</th>
                {COMPARE_METRICS.map((item) => (
                  <th key={item.id} className="px-3 py-3 font-bold">
                    {t(compareMetricKeys[item.id])}
                  </th>
                ))}
                <th className="px-3 py-3 font-bold">{t("compare.conditions")}</th>
              </tr>
            </thead>
            <tbody>
              {compare.rows.map((row) => (
                <tr key={row.id} className="border-b border-white/[0.05]">
                  <td className="py-3.5 pr-4">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ background: row.color }}
                      />
                      <div>
                        <p className="font-bold text-[#e8edf8]">
                          {row.emoji} {row.name}
                        </p>
                        <p className="text-[11px] text-[#7a8ba8]">{row.country}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3.5 font-extrabold" style={{ color: "#f7921e" }}>
                    {compare.formatMetricValue("temperature", row.temperature)}
                  </td>
                  <td className="px-3 py-3.5 font-extrabold" style={{ color: "#38bdf8" }}>
                    {compare.formatMetricValue("humidity", row.humidity)}
                  </td>
                  <td className="px-3 py-3.5 font-extrabold" style={{ color: "#a3e635" }}>
                    {compare.formatMetricValue("wind", row.windSpeed)}
                  </td>
                  <td className="px-3 py-3.5 font-extrabold" style={{ color: "#94a3b8" }}>
                    {compare.formatMetricValue("pressure", row.pressure)}
                  </td>
                  <td className="px-3 py-3.5">
                    <p className="font-extrabold" style={{ color: "#f59e0b" }}>
                      {compare.formatMetricValue("aqi", row.aqi)}
                    </p>
                    <p className="text-[10px] text-[#7a8ba8]">{row.aqiLevel ?? "—"}</p>
                  </td>
                  <td className="px-3 py-3.5 text-xs text-[#7a8ba8]">
                    {row.isLoading
                      ? t("common.loading")
                      : row.isError
                        ? t("compare.unavailable")
                        : row.conditions ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SurfaceCard>
    </PageContainer>
  );
}
