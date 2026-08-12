import { isAxiosError } from "axios";
import { AnimatePresence, motion } from "framer-motion";
import { BellRing, CheckCircle2, ShieldAlert } from "lucide-react";
import { useMemo, useState } from "react";

import type { AlertCategoryId } from "../../api/weather.types";
import { useWeatherAlerts } from "../../hooks/use-weather-alerts";
import { getStoredWeatherLocation } from "../../lib/location-storage";
import { PageContainer } from "../components/app-shell";
import { PageHeader, SectionLabel, SurfaceCard } from "../components/primitives";
import {
  AlertCategoryChip,
  AlertStatPill,
  WeatherAlertCard,
} from "../components/weather-alert-card";

type FilterId = "all" | "active" | AlertCategoryId;

function getErrorMessage(error: unknown) {
  if (isAxiosError(error)) {
    const message = (error.response?.data as { error?: { message?: string } } | undefined)?.error
      ?.message;
    if (message) return message;
  }
  if (error instanceof Error) return error.message;
  return "Unable to load weather alerts.";
}

export function AlertsPage() {
  const location = getStoredWeatherLocation();
  const alertsQuery = useWeatherAlerts(location);
  const [filter, setFilter] = useState<FilterId>("all");

  const categories = alertsQuery.data?.categories ?? [];
  const city = alertsQuery.data?.location.resolvedAddress?.split(",")[0] ?? location;
  const activeCount = alertsQuery.data?.activeCount ?? 0;
  const officialCount = alertsQuery.data?.alerts.length ?? 0;

  const filtered = useMemo(() => {
    if (filter === "all") return categories;
    if (filter === "active") return categories.filter((item) => item.active);
    return categories.filter((item) => item.id === filter);
  }, [categories, filter]);

  const activeAlerts = categories.filter((item) => item.active);
  const clearAlerts = categories.filter((item) => !item.active);

  return (
    <PageContainer>
      <PageHeader
        title="Weather Alerts"
        subtitle={`${city} · Storm, snow, heat, flood, wind, and heavy rain`}
      />

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <AlertStatPill
          label="Active Alerts"
          value={activeCount}
          detail={activeCount ? "Actionable conditions nearby" : "No active hazards"}
          color={activeCount ? "#ef4444" : "#22c55e"}
          icon={activeCount ? <ShieldAlert size={16} /> : <CheckCircle2 size={16} />}
        />
        <AlertStatPill
          label="Categories Watched"
          value={categories.length || 6}
          detail="Storm · Snow · Heat · Flood · Wind · Rain"
          color="#f7921e"
          icon={<BellRing size={16} />}
        />
        <AlertStatPill
          label="Official Notices"
          value={officialCount}
          detail={
            officialCount
              ? "From Visual Crossing alert feed"
              : "Using forecast-based hazard detection"
          }
          color="#4a9eff"
          icon={<ShieldAlert size={16} />}
        />
      </div>

      <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
        <AlertCategoryChip
          label="All"
          emoji="📋"
          selected={filter === "all"}
          color="#f7921e"
          onClick={() => setFilter("all")}
        />
        <AlertCategoryChip
          label="Active"
          emoji="🔴"
          active={activeCount > 0}
          selected={filter === "active"}
          color="#ef4444"
          onClick={() => setFilter("active")}
        />
        {categories.map((item) => (
          <AlertCategoryChip
            key={item.id}
            label={item.label}
            emoji={item.emoji}
            active={item.active}
            selected={filter === item.id}
            color={item.color}
            onClick={() => setFilter(item.id)}
          />
        ))}
      </div>

      {alertsQuery.isLoading && (
        <SurfaceCard className="mb-4">
          <p className="text-sm text-[#7a8ba8]">Scanning storm, snow, heat, flood, wind, and rain risks…</p>
        </SurfaceCard>
      )}

      {alertsQuery.isError && (
        <SurfaceCard className="mb-4 border-red-500/20 bg-red-500/10">
          <p className="mb-3 text-sm text-red-300">{getErrorMessage(alertsQuery.error)}</p>
          <button
            type="button"
            className="rounded-xl border border-white/[0.07] bg-white/5 px-4 py-2 text-sm font-semibold"
            onClick={() => {
              void alertsQuery.refetch();
            }}
          >
            Retry
          </button>
        </SurfaceCard>
      )}

      {!alertsQuery.isLoading && !alertsQuery.isError && (
        <>
          {filter === "all" && activeAlerts.length > 0 && (
            <section className="mb-6">
              <SectionLabel>Active Now</SectionLabel>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <AnimatePresence mode="popLayout">
                  {activeAlerts.map((alert, index) => (
                    <WeatherAlertCard key={alert.id} alert={alert} index={index} />
                  ))}
                </AnimatePresence>
              </div>
            </section>
          )}

          <section className="mb-6">
            <SectionLabel>
              {filter === "all"
                ? "All Clear / Monitoring"
                : filter === "active"
                  ? "Active Alerts"
                  : `${filtered[0]?.label ?? "Category"} Detail`}
            </SectionLabel>
            {filtered.length === 0 ? (
              <SurfaceCard>
                <p className="text-sm text-[#7a8ba8]">No alerts match this filter.</p>
              </SurfaceCard>
            ) : (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <AnimatePresence mode="popLayout">
                  {(filter === "all" ? clearAlerts : filtered).map((alert, index) => (
                    <WeatherAlertCard
                      key={`${filter}-${alert.id}`}
                      alert={alert}
                      index={index}
                      compact={filter === "all" && !alert.active}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </section>

          {filter === "all" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6"
            >
              {categories.map((item) => (
                <button
                  key={`overview-${item.id}`}
                  type="button"
                  onClick={() => setFilter(item.id)}
                  className="rounded-[16px] border border-white/[0.07] bg-[#0d1628] px-3 py-3 text-left transition hover:border-white/[0.12]"
                  style={{
                    boxShadow: item.active ? `inset 0 0 0 1px ${item.color}33` : undefined,
                  }}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-lg">{item.emoji}</span>
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ background: item.active ? item.color : "#334155" }}
                    />
                  </div>
                  <p className="text-xs font-bold text-[#e8edf8]">{item.label}</p>
                  <p className="mt-1 text-[10px] font-semibold" style={{ color: item.color }}>
                    {item.active ? item.severity.toUpperCase() : "CLEAR"}
                  </p>
                </button>
              ))}
            </motion.div>
          )}
        </>
      )}
    </PageContainer>
  );
}
