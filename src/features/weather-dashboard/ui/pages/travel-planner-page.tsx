import { isAxiosError } from "axios";
import { AnimatePresence, motion } from "framer-motion";
import {
  Backpack,
  CalendarDays,
  Mountain,
  Shirt,
  Sparkles,
  SunMedium,
  Trees,
  Waves,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useTravelPlanner } from "../../hooks/use-travel-planner";
import { getStoredWeatherLocation } from "../../lib/location-storage";
import {
  travelStatusColor,
  type TravelDayPlan,
} from "../../lib/travel-planner";
import { formatNumber, temperatureUnitLabel } from "../../lib/weather-format";
import { PageContainer } from "../components/app-shell";
import {
  Badge,
  PageHeader,
  ProgressBar,
  SectionLabel,
  StatCard,
  SurfaceCard,
} from "../components/primitives";
import { ChartTooltip } from "../components/weather-visuals";
import { cn } from "@/shared/lib/cn";

type ScoreFilter = "travel" | "outdoor" | "beach" | "hiking";

function getErrorMessage(error: unknown) {
  if (isAxiosError(error)) {
    const message = (error.response?.data as { error?: { message?: string } } | undefined)?.error
      ?.message;
    if (message) return message;
  }
  if (error instanceof Error) return error.message;
  return "Unable to load travel planner.";
}

function scoreFor(day: TravelDayPlan, filter: ScoreFilter): number {
  switch (filter) {
    case "travel":
      return day.travelScore;
    case "outdoor":
      return day.outdoorScore;
    case "beach":
      return day.beachScore;
    case "hiking":
      return day.hikingScore;
  }
}

function statusFor(day: TravelDayPlan, filter: ScoreFilter) {
  switch (filter) {
    case "travel":
      return day.travelStatus;
    case "outdoor":
      return day.outdoorStatus;
    case "beach":
      return day.beachStatus;
    case "hiking":
      return day.hikingStatus;
  }
}

const priorityStyles = {
  essential: "border-[#ef4444]/25 bg-[#ef4444]/10 text-[#ef4444]",
  recommended: "border-[#f7921e]/25 bg-[#f7921e]/10 text-[#f7921e]",
  optional: "border-[#7a8ba8]/25 bg-[#7a8ba8]/10 text-[#7a8ba8]",
} as const;

const insightTone = {
  positive: "border-[#22c55e]/20 bg-[#22c55e]/10",
  neutral: "border-white/[0.07] bg-white/[0.03]",
  warning: "border-[#f59e0b]/25 bg-[#f59e0b]/10",
} as const;

export function TravelPlannerPage() {
  const location = getStoredWeatherLocation();
  const planner = useTravelPlanner(location, 14);
  const [scoreFilter, setScoreFilter] = useState<ScoreFilter>("travel");
  const unit = temperatureUnitLabel(planner.units);
  const best = planner.bestTravelDay;
  const city = planner.resolvedAddress.split(",")[0] ?? location;

  const chartData = useMemo(
    () =>
      planner.plans.map((day) => ({
        day: day.label,
        travel: day.travelScore,
        outdoor: day.outdoorScore,
        beach: day.beachScore,
        hiking: day.hikingScore,
      })),
    [planner.plans],
  );

  const rankedDays = useMemo(
    () =>
      [...planner.plans].sort(
        (a, b) => scoreFor(b, scoreFilter) - scoreFor(a, scoreFilter),
      ),
    [planner.plans, scoreFilter],
  );

  const filterColor =
    scoreFilter === "travel"
      ? "#f7921e"
      : scoreFilter === "outdoor"
        ? "#a3e635"
        : scoreFilter === "beach"
          ? "#4a9eff"
          : "#f59e0b";

  return (
    <PageContainer>
      <PageHeader
        title="Travel Planner"
        subtitle={`${city} · Best days, packing, clothing, and activity scores`}
      />

      {planner.isLoading && (
        <SurfaceCard className="mb-4">
          <p className="text-sm text-[#7a8ba8]">Building your travel plan from the forecast…</p>
        </SurfaceCard>
      )}

      {planner.isError && (
        <SurfaceCard className="mb-4 border-red-500/20 bg-red-500/10">
          <p className="mb-3 text-sm text-red-300">{getErrorMessage(planner.error)}</p>
          <button
            type="button"
            className="rounded-xl border border-white/[0.07] bg-white/5 px-4 py-2 text-sm font-semibold"
            onClick={() => {
              void planner.refetch();
            }}
          >
            Retry
          </button>
        </SurfaceCard>
      )}

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={<CalendarDays size={16} />}
          label="Best Travel Day"
          value={best ? best.label : "—"}
          detail={
            best
              ? `Score ${best.travelScore} · ${formatNumber(best.high, 0)}${unit}`
              : "Waiting for forecast"
          }
          color="#f7921e"
        />
        <StatCard
          icon={<Trees size={16} />}
          label="Outdoor Score"
          value={`${planner.averages.outdoor}`}
          detail="Avg next 14 days"
          color="#a3e635"
        />
        <StatCard
          icon={<Waves size={16} />}
          label="Beach Score"
          value={`${planner.averages.beach}`}
          detail="Avg next 14 days"
          color="#4a9eff"
        />
        <StatCard
          icon={<Mountain size={16} />}
          label="Hiking Score"
          value={`${planner.averages.hiking}`}
          detail="Avg next 14 days"
          color="#f59e0b"
        />
      </div>

      {best && (
        <SurfaceCard className="mb-4 overflow-hidden">
          <div className="relative">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(90%_80%_at_0%_0%,rgba(247,146,30,0.22),transparent_55%)]" />
            <div className="relative grid grid-cols-1 gap-5 lg:grid-cols-[1.2fr_1fr]">
              <div>
                <SectionLabel className="mb-2">Best travel day</SectionLabel>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <h2 className="text-2xl font-black tracking-[-0.4px] text-[#e8edf8]">
                    {best.emoji} {best.label}
                  </h2>
                  <Badge variant="orange">{best.weekday}</Badge>
                  <Badge variant="green">{best.travelStatus}</Badge>
                </div>
                <p className="mb-4 max-w-xl text-sm leading-6 text-[#a8b6ce]">
                  {best.conditions ?? "Favorable conditions"} · High{" "}
                  {formatNumber(best.high, 0)}
                  {unit} / Low {formatNumber(best.low, 0)}
                  {unit} · Rain {formatNumber(best.rainChance, 0)}% · UV{" "}
                  {formatNumber(best.uvIndex, 0)}
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {(
                    [
                      ["Outdoor", best.outdoorScore, best.outdoorStatus],
                      ["Beach", best.beachScore, best.beachStatus],
                      ["Hiking", best.hikingScore, best.hikingStatus],
                    ] as const
                  ).map(([label, score, status]) => (
                    <div
                      key={label}
                      className="rounded-xl border border-white/[0.07] bg-black/20 px-3 py-3"
                    >
                      <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#7a8ba8]">
                        {label}
                      </p>
                      <p
                        className="text-xl font-black"
                        style={{ color: travelStatusColor(status) }}
                      >
                        {score}
                      </p>
                      <p className="text-[11px] text-[#7a8ba8]">{status}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-[16px] border border-white/[0.07] bg-white/[0.03] p-4">
                <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.08em] text-[#7a8ba8]">
                  Travel readiness
                </p>
                <div className="mb-2 flex items-end justify-between">
                  <strong className="text-4xl font-black text-[#f7921e]">{best.travelScore}</strong>
                  <span className="text-xs font-bold text-[#7a8ba8]">/ 100</span>
                </div>
                <ProgressBar value={best.travelScore} color="#f7921e" className="mb-4 h-2" />
                <ul className="space-y-2 text-xs leading-5 text-[#a8b6ce]">
                  <li>• Strong overall comfort for sightseeing and transfers</li>
                  <li>• Pair outdoor plans with the Outdoor / Beach / Hiking scores above</li>
                  <li>• Keep packing flexible using the lists below</li>
                </ul>
              </div>
            </div>
          </div>
        </SurfaceCard>
      )}

      <div className="mb-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <SurfaceCard>
          <div className="mb-4 flex items-center gap-2">
            <Backpack size={16} className="text-[#f7921e]" />
            <SectionLabel className="mb-0">Packing recommendations</SectionLabel>
          </div>
          <div className="space-y-2.5">
            {planner.packing.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-3"
              >
                <span className="text-lg">{item.emoji}</span>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold text-[#e8edf8]">{item.label}</p>
                    <span
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em]",
                        priorityStyles[item.priority],
                      )}
                    >
                      {item.priority}
                    </span>
                  </div>
                  <p className="text-xs leading-5 text-[#7a8ba8]">{item.reason}</p>
                </div>
              </div>
            ))}
            {!planner.packing.length && (
              <p className="text-sm text-[#7a8ba8]">Packing tips appear after forecast loads.</p>
            )}
          </div>
        </SurfaceCard>

        <SurfaceCard>
          <div className="mb-4 flex items-center gap-2">
            <Shirt size={16} className="text-[#4a9eff]" />
            <SectionLabel className="mb-0">Clothing suggestions</SectionLabel>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {planner.clothing.map((item) => (
              <div
                key={item.id}
                className="rounded-[16px] border border-white/[0.07] bg-gradient-to-br from-white/[0.04] to-transparent px-4 py-4"
              >
                <span className="mb-2 block text-2xl">{item.emoji}</span>
                <p className="mb-1 text-sm font-extrabold text-[#e8edf8]">{item.label}</p>
                <p className="text-xs leading-5 text-[#7a8ba8]">{item.detail}</p>
              </div>
            ))}
            {!planner.clothing.length && (
              <p className="text-sm text-[#7a8ba8]">Clothing ideas appear after forecast loads.</p>
            )}
          </div>
        </SurfaceCard>
      </div>

      <SurfaceCard className="mb-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <SunMedium size={16} className="text-[#a3e635]" />
            <SectionLabel className="mb-0">Activity scores</SectionLabel>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                ["travel", "Travel", "#f7921e"],
                ["outdoor", "Outdoor", "#a3e635"],
                ["beach", "Beach", "#4a9eff"],
                ["hiking", "Hiking", "#f59e0b"],
              ] as const
            ).map(([id, label, color]) => (
              <button
                key={id}
                type="button"
                onClick={() => setScoreFilter(id)}
                className="rounded-[10px] border px-3 py-1.5 text-xs font-bold"
                style={{
                  borderColor: scoreFilter === id ? `${color}55` : "rgba(255,255,255,0.07)",
                  background: scoreFilter === id ? `${color}18` : "rgba(255,255,255,0.03)",
                  color: scoreFilter === id ? color : "#7a8ba8",
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis
              dataKey="day"
              tick={{ fill: "#7a8ba8", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: "#7a8ba8", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={40}
            />
            <Tooltip content={<ChartTooltip valueFormatter={(value) => `${value}/100`} />} />
            <Bar dataKey={scoreFilter} fill={filterColor} radius={[8, 8, 2, 2]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>

        <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {rankedDays.slice(0, 6).map((day, index) => {
              const score = scoreFor(day, scoreFilter);
              const status = statusFor(day, scoreFilter);
              const color = travelStatusColor(status);
              return (
                <motion.div
                  key={`${scoreFilter}-${day.datetime ?? day.label}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-3.5 py-3"
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-[#e8edf8]">
                      {day.emoji} {day.label}
                    </p>
                    <span className="text-sm font-black" style={{ color }}>
                      {score}
                    </span>
                  </div>
                  <ProgressBar value={score} color={color} className="mb-2 h-1.5" />
                  <p className="text-[11px] text-[#7a8ba8]">
                    {day.weekday} · {status} · {formatNumber(day.high, 0)}
                    {unit} · rain {formatNumber(day.rainChance, 0)}%
                  </p>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </SurfaceCard>

      <SurfaceCard>
        <div className="mb-4 flex items-center gap-2">
          <Sparkles size={16} className="text-[#f7921e]" />
          <SectionLabel className="mb-0">Weather insights</SectionLabel>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {planner.insights.map((insight) => (
            <article
              key={insight.id}
              className={cn(
                "rounded-[16px] border px-4 py-4",
                insightTone[insight.tone],
              )}
            >
              <p className="mb-1.5 text-sm font-extrabold text-[#e8edf8]">{insight.title}</p>
              <p className="text-xs leading-5 text-[#a8b6ce]">{insight.body}</p>
            </article>
          ))}
        </div>
      </SurfaceCard>
    </PageContainer>
  );
}
