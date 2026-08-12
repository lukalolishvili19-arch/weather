import { isAxiosError } from "axios";
import { AnimatePresence, motion } from "framer-motion";
import {
  CloudRain,
  Droplets,
  Eye,
  Thermometer,
  Wind,
  Zap,
} from "lucide-react";
import { useState } from "react";

import { cn } from "@/shared/lib/cn";

import {
  FORECAST_TABS,
  useForecastTabData,
  type ForecastTabId,
} from "../../hooks/use-forecast-tabs";
import {
  degreesToCompass,
  formatForecastDay,
  formatHourLabel,
  formatNumber,
  humidityLabel,
  speedUnitLabel,
  temperatureUnitLabel,
  uvLabel,
  weatherIconToEmoji,
} from "../../lib/weather-format";
import { ProgressBar, SectionLabel, SurfaceCard } from "./primitives";

function getErrorMessage(error: unknown) {
  if (isAxiosError(error)) {
    const message = (error.response?.data as { error?: { message?: string } } | undefined)?.error
      ?.message;
    if (message) return message;
  }
  if (error instanceof Error) return error.message;
  return "Unable to load forecast.";
}

function ForecastSkeleton({ mode }: { mode: "current" | "hours" | "days" }) {
  if (mode === "current") {
    return (
      <div className="grid animate-pulse grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-[92px] rounded-2xl border border-white/5 bg-white/[0.03]"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex animate-pulse gap-2.5 overflow-hidden pb-1">
      {Array.from({ length: mode === "hours" ? 8 : 7 }).map((_, index) => (
        <div
          key={index}
          className="h-[148px] min-w-[88px] shrink-0 rounded-2xl border border-white/5 bg-white/[0.03]"
        />
      ))}
    </div>
  );
}

function ForecastError({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  return (
    <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-5">
      <p className="mb-3 text-sm text-red-300">{getErrorMessage(error)}</p>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-xl border border-white/[0.07] bg-white/5 px-4 py-2 text-sm font-semibold text-[#e8edf8]"
      >
        Retry
      </button>
    </div>
  );
}

export function ForecastTabs({ location }: { location: string }) {
  const [tab, setTab] = useState<ForecastTabId>("days7");
  const data = useForecastTabData(location, tab);
  const unit = temperatureUnitLabel(data.units);
  const speedUnit = speedUnitLabel(data.units);
  const timezone = data.locationMeta?.timezone ?? null;

  return (
    <SurfaceCard className="mb-4 px-[22px] py-5">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <SectionLabel className="mb-1">Forecast</SectionLabel>
          <p className="text-xs text-[#7a8ba8]">
            {data.isFetching && !data.isLoading ? "Updating…" : "Live Visual Crossing data"}
          </p>
        </div>
        <div
          role="tablist"
          aria-label="Forecast range"
          className="flex flex-wrap gap-1 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-1"
        >
          {FORECAST_TABS.map((item) => {
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(item.id)}
                className={cn(
                  "relative rounded-xl px-3 py-2 text-[12px] font-bold transition-colors",
                  active ? "text-[#f7921e]" : "text-[#7a8ba8] hover:text-[#e8edf8]",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="forecast-tab-pill"
                    className="absolute inset-0 rounded-xl border border-[#f7921e]/30 bg-[#f7921e]/10"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
        >
          {data.isLoading ? (
            <ForecastSkeleton
              mode={tab === "current" ? "current" : tab === "hours24" ? "hours" : "days"}
            />
          ) : data.isError ? (
            <ForecastError
              error={data.error}
              onRetry={() => {
                void data.refetch();
              }}
            />
          ) : tab === "current" ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                {
                  icon: <Thermometer size={16} />,
                  label: "Temperature",
                  value: `${formatNumber(data.current?.temperature, 0)}${unit}`,
                  detail: data.current?.conditions ?? "—",
                },
                {
                  icon: <Droplets size={16} />,
                  label: "Humidity",
                  value: `${formatNumber(data.current?.humidity, 0)}%`,
                  detail: humidityLabel(data.current?.humidity),
                },
                {
                  icon: <Wind size={16} />,
                  label: "Wind",
                  value: `${formatNumber(data.current?.windSpeed, 0)} ${speedUnit}`,
                  detail: degreesToCompass(data.current?.windDirection),
                },
                {
                  icon: <Zap size={16} />,
                  label: "UV Index",
                  value: formatNumber(data.current?.uvIndex, 0),
                  detail: uvLabel(data.current?.uvIndex),
                },
              ].map((item) => (
                <article
                  key={item.label}
                  className="rounded-2xl border border-white/5 bg-white/[0.03] px-4 py-3.5"
                >
                  <div className="mb-2 flex items-center gap-2 text-[#f7921e]">
                    {item.icon}
                    <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#7a8ba8]">
                      {item.label}
                    </span>
                  </div>
                  <p className="text-xl font-extrabold text-white">{item.value}</p>
                  <p className="mt-1 text-xs text-[#7a8ba8]">{item.detail}</p>
                </article>
              ))}
              <div className="col-span-2 flex items-center gap-4 rounded-2xl border border-[#f7921e]/20 bg-[#f7921e]/10 px-4 py-3.5 sm:col-span-4">
                <span className="text-[40px]">{weatherIconToEmoji(data.current?.icon)}</span>
                <div>
                  <p className="text-lg font-bold text-white">
                    {data.current?.conditions ?? "Current conditions"}
                  </p>
                  <p className="mt-1 flex flex-wrap gap-3 text-xs text-[#7a8ba8]">
                    <span className="inline-flex items-center gap-1">
                      <Eye size={12} /> Vis {formatNumber(data.current?.visibility, 1)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <CloudRain size={12} />{" "}
                      {formatNumber(data.current?.precipProbability, 0)}% rain
                    </span>
                    <span>
                      Feels {formatNumber(data.current?.feelsLike, 0)}
                      {unit}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          ) : tab === "hours24" ? (
            <div className="flex gap-2.5 overflow-x-auto pb-1">
              {data.hours.map((hour, index) => (
                <article
                  key={`${hour.datetimeEpoch ?? hour.datetime}-${index}`}
                  className={
                    index === 0
                      ? "flex min-w-[84px] shrink-0 flex-col items-center gap-1.5 rounded-2xl border border-[#f7921e]/30 bg-[#f7921e]/10 px-3.5 py-3.5"
                      : "flex min-w-[84px] shrink-0 flex-col items-center gap-1.5 rounded-2xl border border-white/5 bg-white/[0.03] px-3.5 py-3.5"
                  }
                >
                  <p
                    className={
                      index === 0
                        ? "text-[11px] font-bold text-[#f7921e]"
                        : "text-[11px] font-bold text-[#7a8ba8]"
                    }
                  >
                    {formatHourLabel(hour.datetime, hour.datetimeEpoch, timezone)}
                  </p>
                  <span className="text-[24px]">{weatherIconToEmoji(hour.icon)}</span>
                  <p className="text-sm font-extrabold text-white">
                    {formatNumber(hour.temperature, 0)}°
                  </p>
                  <ProgressBar
                    value={hour.precipProbability ?? 0}
                    color="#4a9eff"
                    className="h-[3px] w-full"
                  />
                  <span className="text-[10px] font-semibold text-[#4a9eff]">
                    {formatNumber(hour.precipProbability, 0)}%
                  </span>
                </article>
              ))}
              {!data.hours.length && (
                <p className="text-sm text-[#7a8ba8]">No hourly forecast available.</p>
              )}
            </div>
          ) : (
            <div className="flex gap-2.5 overflow-x-auto pb-1">
              {data.days.map((day, index) => {
                const labels = formatForecastDay(day.datetime, index, timezone);
                const rain = Math.round(day.precipProbability ?? 0);
                return (
                  <article
                    key={`${day.datetime ?? index}`}
                    className={
                      index === 0
                        ? "flex min-w-[88px] shrink-0 flex-col items-center gap-1.5 rounded-2xl border border-[#f7921e]/30 bg-[#f7921e]/10 px-4 py-3.5"
                        : "flex min-w-[88px] shrink-0 flex-col items-center gap-1.5 rounded-2xl border border-white/5 bg-white/[0.03] px-4 py-3.5"
                    }
                  >
                    <p
                      className={
                        index === 0
                          ? "text-xs font-bold text-[#f7921e]"
                          : "text-xs font-bold text-[#7a8ba8]"
                      }
                    >
                      {labels.day}
                    </p>
                    <p className="text-[10px] font-medium text-white/30">{labels.date}</p>
                    <span className="text-[26px]">{weatherIconToEmoji(day.icon)}</span>
                    <p className="text-center text-[10px] leading-tight text-white/40">
                      {day.conditions ?? "—"}
                    </p>
                    <p className="mt-0.5 flex gap-2 text-sm font-extrabold text-white">
                      {Math.round(day.temperatureMax ?? day.temperature ?? 0)}°{" "}
                      <span className="text-xs text-[#4a9eff]">
                        {Math.round(day.temperatureMin ?? day.temperature ?? 0)}°
                      </span>
                    </p>
                    <ProgressBar value={rain} color="#4a9eff" className="h-[3px] w-full" />
                    <span className="text-[10px] font-semibold text-[#4a9eff]">{rain}%</span>
                  </article>
                );
              })}
              {!data.days.length && (
                <p className="text-sm text-[#7a8ba8]">No daily forecast available.</p>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </SurfaceCard>
  );
}
