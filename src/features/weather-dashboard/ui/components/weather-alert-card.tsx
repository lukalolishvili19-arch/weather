import { motion } from "framer-motion";
import {
  CloudLightning,
  CloudRain,
  CloudSnow,
  Droplets,
  ThermometerSun,
  Wind,
} from "lucide-react";
import type { ReactNode } from "react";

import type { AlertCategoryCard, AlertCategoryId, AlertSeverity } from "../../api/weather.types";
import { Badge, type BadgeVariant } from "./primitives";
import { cn } from "@/shared/lib/cn";

const categoryIcons: Record<AlertCategoryId, typeof CloudLightning> = {
  storm: CloudLightning,
  snow: CloudSnow,
  heat: ThermometerSun,
  flood: Droplets,
  wind: Wind,
  "heavy-rain": CloudRain,
};

const severityBadge: Record<AlertSeverity, BadgeVariant> = {
  none: "muted",
  low: "blue",
  medium: "amber",
  high: "orange",
  extreme: "red",
};

const severityLabel: Record<AlertSeverity, string> = {
  none: "Clear",
  low: "Low",
  medium: "Moderate",
  high: "High",
  extreme: "Extreme",
};

function formatAlertTime(value: string | null) {
  if (!value) return null;
  try {
    const date = new Date(value.includes("T") ? value : `${value}T12:00:00`);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      hour: value.includes("T") ? "numeric" : undefined,
      minute: value.includes("T") ? "2-digit" : undefined,
    }).format(date);
  } catch {
    return value;
  }
}

export function WeatherAlertCard({
  alert,
  index = 0,
  compact = false,
}: {
  alert: AlertCategoryCard;
  index?: number;
  compact?: boolean;
}) {
  const Icon = categoryIcons[alert.id];
  const issued = formatAlertTime(alert.issued);
  const expires = formatAlertTime(alert.expires);

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.35, ease: "easeOut" }}
      className={cn(
        "relative overflow-hidden rounded-[22px] border p-5",
        alert.active ? "border-white/[0.1]" : "border-white/[0.06] opacity-80",
      )}
      style={{
        background: alert.active
          ? `radial-gradient(120% 120% at 0% 0%, ${alert.color}22, transparent 55%), #0d1628`
          : "#0d1628",
        boxShadow: alert.active ? `0 0 0 1px ${alert.color}22, 0 18px 40px rgba(0,0,0,0.25)` : undefined,
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-90"
        style={{ background: alert.gradient }}
      />
      <div
        className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full blur-2xl"
        style={{ background: `${alert.color}${alert.active ? "33" : "14"}` }}
      />

      <div className="relative z-10">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              className="grid h-12 w-12 place-items-center rounded-2xl border text-xl"
              style={{
                background: `${alert.color}18`,
                borderColor: `${alert.color}33`,
                color: alert.color,
                boxShadow: alert.active ? `0 0 24px ${alert.color}33` : undefined,
              }}
            >
              <span className="relative">
                <Icon size={20} />
                <span className="absolute -right-2 -top-2 text-sm">{alert.emoji}</span>
              </span>
            </span>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#7a8ba8]">
                {alert.label}
              </p>
              <h3 className="text-[17px] font-extrabold leading-tight text-[#e8edf8]">
                {alert.title}
              </h3>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <Badge variant={severityBadge[alert.severity]}>
              {severityLabel[alert.severity]}
            </Badge>
            {alert.active ? (
              <span
                className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.08em]"
                style={{ color: alert.color }}
              >
                <span
                  className="h-1.5 w-1.5 animate-pulse rounded-full"
                  style={{ background: alert.color }}
                />
                Active
              </span>
            ) : (
              <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#7a8ba8]/70">
                All clear
              </span>
            )}
          </div>
        </div>

        <p className="mb-4 text-[13px] leading-6 text-[#a8b6ce]">{alert.description}</p>

        {alert.metrics.length > 0 && (
          <div className="mb-4 grid grid-cols-2 gap-2">
            {alert.metrics.map((metric) => (
              <div
                key={`${alert.id}-${metric.label}`}
                className="rounded-xl border border-white/[0.07] bg-black/20 px-3 py-2.5"
              >
                <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#7a8ba8]">
                  {metric.label}
                </p>
                <p className="text-sm font-extrabold" style={{ color: alert.color }}>
                  {metric.value}
                </p>
              </div>
            ))}
          </div>
        )}

        {!compact && alert.active && alert.tips.length > 0 && (
          <div className="mb-4 space-y-1.5">
            {alert.tips.slice(0, 3).map((tip) => (
              <div
                key={tip}
                className="flex gap-2 rounded-xl border border-white/[0.05] bg-white/[0.03] px-3 py-2 text-[12px] leading-5 text-[#c5d0e2]"
              >
                <span style={{ color: alert.color }}>•</span>
                <span>{tip}</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.07] pt-3 text-[11px] text-[#7a8ba8]">
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {alert.area && <span>{alert.area.split(",")[0]}</span>}
            {issued && <span>From {issued}</span>}
            {expires && <span>Until {expires}</span>}
          </div>
          <span className="font-semibold capitalize text-white/35">
            {alert.source === "clear" ? "Monitoring" : alert.source}
          </span>
        </div>
      </div>
    </motion.article>
  );
}

export function AlertCategoryChip({
  label,
  emoji,
  active,
  selected,
  color,
  onClick,
}: {
  label: string;
  emoji: string;
  active?: boolean;
  selected?: boolean;
  color?: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex shrink-0 items-center gap-1.5 rounded-[12px] border px-3.5 py-2 text-xs font-bold transition-colors",
        selected
          ? "text-[#e8edf8]"
          : "border-white/[0.07] bg-white/[0.03] text-[#7a8ba8] hover:text-[#e8edf8]",
      )}
      style={
        selected
          ? {
              borderColor: `${color ?? "#f7921e"}55`,
              background: `${color ?? "#f7921e"}18`,
              color: color ?? "#f7921e",
            }
          : undefined
      }
    >
      <span>{emoji}</span>
      <span>{label}</span>
      {active && (
        <span
          className="ml-0.5 h-1.5 w-1.5 rounded-full"
          style={{ background: color ?? "#f7921e" }}
        />
      )}
    </button>
  );
}

export function AlertStatPill({
  label,
  value,
  detail,
  color,
  icon,
}: {
  label: string;
  value: ReactNode;
  detail: string;
  color: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-[18px] border border-white/[0.07] bg-[#0d1628] px-4 py-3.5">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#7a8ba8]">
          {label}
        </span>
        <span style={{ color }}>{icon}</span>
      </div>
      <p className="text-[28px] font-black tracking-[-1px]" style={{ color }}>
        {value}
      </p>
      <p className="mt-1 text-[11px] text-[#7a8ba8]">{detail}</p>
    </div>
  );
}
