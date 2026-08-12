import { isAxiosError } from "axios";
import { AnimatePresence, motion } from "framer-motion";
import {
  Cloud,
  CloudRain,
  Download,
  Droplets,
  FileSpreadsheet,
  FileText,
  Gauge,
  Table2,
  Thermometer,
  ThermometerSun,
  Wind,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import {
  useChartSeries,
  type ChartMetricId,
  type ChartRange,
} from "../../hooks/use-analytics-charts";
import { useAnalyticsQuickExport } from "../../hooks/use-export";
import { usePeriodSummaries } from "../../hooks/use-period-summaries";
import type { ExportFormat } from "../../lib/export/export-types";
import { getStoredWeatherLocation } from "../../lib/location-storage";
import {
  formatSummaryHumidity,
  formatSummaryTemperature,
} from "../../lib/weather-summary";
import { formatNumber } from "../../lib/weather-format";
import { PageContainer } from "../components/app-shell";
import { DynamicWeatherChart } from "../components/dynamic-weather-chart";
import { ActionButton, ProgressBar, SectionLabel, StatCard, SurfaceCard } from "../components/primitives";
import { cn } from "@/shared/lib/cn";
import { InlineSkeleton } from "@/shared/ui/skeleton";

const metricIcons: Record<ChartMetricId, typeof Thermometer> = {
  temperature: Thermometer,
  feelsLike: ThermometerSun,
  humidity: Droplets,
  wind: Wind,
  pressure: Gauge,
  rain: CloudRain,
  uv: Zap,
  cloudCover: Cloud,
};

const ranges: Array<{ id: ChartRange; label: string }> = [
  { id: "hourly", label: "24 Hours" },
  { id: "weekly", label: "Weekly" },
  { id: "monthly", label: "30 Days" },
];

function getErrorMessage(error: unknown) {
  if (isAxiosError(error)) {
    const message = (error.response?.data as { error?: { message?: string } } | undefined)?.error
      ?.message;
    if (message) return message;
  }
  if (error instanceof Error) return error.message;
  return "Unable to load analytics.";
}

export function AnalyticsPage() {
  const location = getStoredWeatherLocation();
  const [range, setRange] = useState<ChartRange>("weekly");
  const [metric, setMetric] = useState<ChartMetricId>("temperature");
  const { weather, configs, activeConfig, points, summary } = useChartSeries(
    location,
    range,
    metric,
  );
  const periodSummaries = usePeriodSummaries(location);
  const quickExport = useAnalyticsQuickExport(location, range, metric);
  const [exportStatus, setExportStatus] = useState<string | null>(null);

  const ActiveIcon = metricIcons[activeConfig.id];
  const dayByDayMax = useMemo(() => {
    if (!points.length) return 1;
    return Math.max(...points.map((point) => point.value), 1);
  }, [points]);

  const highlightSummary =
    range === "monthly" ? periodSummaries.monthlySummary : periodSummaries.weeklySummary;

  const runQuickExport = async (format: ExportFormat) => {
    setExportStatus(null);
    try {
      await quickExport.mutateAsync(format);
      setExportStatus(`${format.toUpperCase()} download started.`);
    } catch (error) {
      setExportStatus(getErrorMessage(error));
    }
  };

  return (
    <PageContainer>
      <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
        <header>
          <h1 className="text-[26px] font-black leading-normal tracking-[-0.5px] text-[#e8edf8]">
            Weather Analytics
          </h1>
          <p className="text-[13px] text-[#7a8ba8]">
            {periodSummaries.resolvedAddress} · Calculated from live forecast data
          </p>
        </header>
        <div className="flex flex-wrap items-center gap-2">
          <ActionButton
            icon={<FileText size={14} />}
            disabled={quickExport.isPending || weather.isLoading}
            onClick={() => void runQuickExport("pdf")}
          >
            PDF
          </ActionButton>
          <ActionButton
            icon={<Table2 size={14} />}
            disabled={quickExport.isPending || weather.isLoading}
            onClick={() => void runQuickExport("csv")}
          >
            CSV
          </ActionButton>
          <ActionButton
            icon={<FileSpreadsheet size={14} />}
            disabled={quickExport.isPending || weather.isLoading}
            onClick={() => void runQuickExport("excel")}
          >
            Excel
          </ActionButton>
          <Link
            to="/export"
            className="inline-flex items-center gap-2 rounded-xl border-0 bg-gradient-to-br from-[#c44404] to-[#f7921e] px-4 py-2 text-[13px] font-semibold text-white"
          >
            <Download size={14} />
            Export Hub
          </Link>
        </div>
      </div>
      {exportStatus && (
        <p className="mb-4 text-[12px] text-[#7a8ba8]">{exportStatus}</p>
      )}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex w-fit gap-1 rounded-[14px] border border-white/[0.07] bg-white/[0.04] p-1">
          {ranges.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setRange(item.id)}
              className={cn(
                "relative rounded-[10px] px-3.5 py-1.5 text-xs font-bold transition-colors",
                range === item.id ? "text-[#e8edf8]" : "text-[#7a8ba8]",
              )}
            >
              {range === item.id && (
                <motion.span
                  layoutId="analytics-range-pill"
                  className="absolute inset-0 rounded-[10px] bg-[#111e38]"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <span className="relative z-10">{item.label}</span>
            </button>
          ))}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {configs.map((item) => {
            const Icon = metricIcons[item.id];
            const active = metric === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setMetric(item.id)}
                className={cn(
                  "relative flex shrink-0 items-center gap-1.5 rounded-[10px] px-3.5 py-1.5 text-xs font-bold transition-colors",
                  active ? "text-[#f7921e]" : "text-[#7a8ba8] hover:text-[#e8edf8]",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="analytics-metric-pill"
                    className="absolute inset-0 rounded-[10px] border border-[#f7921e]/25 bg-[#f7921e]/10"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative z-10 inline-flex items-center gap-1.5">
                  <Icon size={14} />
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {(weather.isLoading || periodSummaries.isLoading) && (
        <div className="mb-4">
          <InlineSkeleton rows={4} />
        </div>
      )}

      {(weather.isError || periodSummaries.isError) && (
        <SurfaceCard className="mb-4 border-red-500/20 bg-red-500/10">
          <p className="mb-3 text-sm text-red-300">
            {getErrorMessage(weather.error ?? periodSummaries.error)}
          </p>
          <button
            type="button"
            className="rounded-xl border border-white/[0.07] bg-white/5 px-4 py-2 text-sm font-semibold"
            onClick={() => {
              void weather.refetch();
              void periodSummaries.refetch();
            }}
          >
            Retry
          </button>
        </SurfaceCard>
      )}

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={<Thermometer size={16} />}
          label="Highest Temperature"
          value={highlightSummary?.highestTemperature?.display ?? "—"}
          detail={highlightSummary?.highestTemperature?.label ?? "No data"}
          color="#f7921e"
        />
        <StatCard
          icon={<Thermometer size={16} />}
          label="Lowest Temperature"
          value={highlightSummary?.lowestTemperature?.display ?? "—"}
          detail={highlightSummary?.lowestTemperature?.label ?? "No data"}
          color="#4a9eff"
        />
        <StatCard
          icon={<ThermometerSun size={16} />}
          label="Average Temperature"
          value={formatSummaryTemperature(
            highlightSummary?.averageTemperature ?? null,
            periodSummaries.units,
          )}
          detail={range === "monthly" ? "30-day mean" : "7-day mean"}
          color="#ffc06a"
        />
        <StatCard
          icon={<Droplets size={16} />}
          label="Average Humidity"
          value={formatSummaryHumidity(highlightSummary?.averageHumidity ?? null)}
          detail={range === "monthly" ? "30-day mean" : "7-day mean"}
          color="#38bdf8"
        />
        <StatCard
          icon={<CloudRain size={16} />}
          label="Rainiest Day"
          value={highlightSummary?.rainiestDay?.display ?? "—"}
          detail={highlightSummary?.rainiestDay?.label ?? "No data"}
          color="#4a9eff"
        />
        <StatCard
          icon={<Wind size={16} />}
          label="Windiest Day"
          value={highlightSummary?.windiestDay?.display ?? "—"}
          detail={highlightSummary?.windiestDay?.label ?? "No data"}
          color="#a3e635"
        />
        <StatCard
          icon={<Zap size={16} />}
          label="Highest UV"
          value={highlightSummary?.highestUv?.display ?? "—"}
          detail={highlightSummary?.highestUv?.label ?? "No data"}
          color="#f59e0b"
        />
        <StatCard
          icon={<ActiveIcon size={16} />}
          label={`${activeConfig.label} Avg`}
          value={summary.average}
          detail="Selected chart metric"
          color={activeConfig.color}
        />
      </div>

      <SurfaceCard className="mb-4">
        <div className="mb-5 flex justify-between gap-3">
          <SectionLabel className="mb-0">{activeConfig.label} Trend</SectionLabel>
          <div className="flex gap-4 text-xs text-[#7a8ba8]">
            <span style={{ color: activeConfig.color }}>— {activeConfig.label}</span>
            {activeConfig.secondaryLabel && <span>— {activeConfig.secondaryLabel}</span>}
          </div>
        </div>
        {!weather.isLoading && points.length > 0 ? (
          <DynamicWeatherChart
            metricKey={`${range}-${metric}`}
            config={activeConfig}
            points={points}
          />
        ) : (
          !weather.isLoading && (
            <p className="py-10 text-center text-sm text-[#7a8ba8]">No chart data available.</p>
          )
        )}
      </SurfaceCard>

      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SurfaceCard>
          <SectionLabel>Weekly Summary</SectionLabel>
          {periodSummaries.weeklyRows.length ? (
            periodSummaries.weeklyRows.map((row) => (
              <div
                className="flex justify-between gap-3 border-b border-white/[0.07] py-2.5 text-xs"
                key={`weekly-${row.label}`}
              >
                <span className="font-semibold text-[#7a8ba8]">{row.label}</span>
                <strong className="text-right" style={{ color: row.color }}>
                  {row.value}
                </strong>
              </div>
            ))
          ) : (
            <p className="text-sm text-[#7a8ba8]">Weekly summary unavailable.</p>
          )}
        </SurfaceCard>

        <SurfaceCard>
          <SectionLabel>Monthly Summary</SectionLabel>
          {periodSummaries.monthlyRows.length ? (
            periodSummaries.monthlyRows.map((row) => (
              <div
                className="flex justify-between gap-3 border-b border-white/[0.07] py-2.5 text-xs"
                key={`monthly-${row.label}`}
              >
                <span className="font-semibold text-[#7a8ba8]">{row.label}</span>
                <strong className="text-right" style={{ color: row.color }}>
                  {row.value}
                </strong>
              </div>
            ))
          ) : (
            <p className="text-sm text-[#7a8ba8]">Monthly summary unavailable.</p>
          )}
        </SurfaceCard>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-[3fr_2fr]">
        <SurfaceCard>
          <SectionLabel>All Metrics Snapshot</SectionLabel>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <AnimatePresence mode="sync">
              {configs.map((item) => (
                <motion.button
                  key={item.id}
                  type="button"
                  layout
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.25 }}
                  onClick={() => setMetric(item.id)}
                  className={cn(
                    "rounded-2xl border px-3 py-3 text-left",
                    metric === item.id
                      ? "border-[#f7921e]/30 bg-[#f7921e]/10"
                      : "border-white/[0.07] bg-white/[0.03]",
                  )}
                >
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.08em] text-[#7a8ba8]">
                    {item.label}
                  </p>
                  <MiniMetricChart
                    metric={item.id}
                    location={location}
                    range={range}
                    color={item.color}
                  />
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        </SurfaceCard>

        <SurfaceCard>
          <SectionLabel>Point-by-point Comparison</SectionLabel>
          <div className="flex flex-col gap-2.5">
            {points.map((point) => (
              <motion.div
                className="flex items-center gap-3"
                key={point.rawLabel}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
              >
                <span className="w-16 shrink-0 text-xs font-semibold text-[#7a8ba8]">
                  {point.label}
                </span>
                <ProgressBar
                  value={point.value}
                  max={dayByDayMax}
                  color={activeConfig.color}
                  className="h-2 flex-1"
                />
                <strong
                  className="w-[72px] text-right text-[13px]"
                  style={{ color: activeConfig.color }}
                >
                  {formatNumber(point.value, 1)}
                  {activeConfig.unit}
                </strong>
              </motion.div>
            ))}
            {!points.length && !weather.isLoading && (
              <p className="text-sm text-[#7a8ba8]">No comparison points for this range.</p>
            )}
          </div>
        </SurfaceCard>
      </div>
    </PageContainer>
  );
}

function MiniMetricChart({
  metric,
  location,
  range,
  color,
}: {
  metric: ChartMetricId;
  location: string;
  range: ChartRange;
  color: string;
}) {
  const { points, activeConfig } = useChartSeries(location, range, metric);
  const spark = points.slice(0, 12);

  return (
    <div>
      <DynamicWeatherChart
        metricKey={`mini-${range}-${metric}`}
        config={{ ...activeConfig, color }}
        points={spark}
        height={96}
      />
    </div>
  );
}
