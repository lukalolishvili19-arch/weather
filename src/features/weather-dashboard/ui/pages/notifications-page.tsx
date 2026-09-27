import { isAxiosError } from "axios";
import { Bell, Check, CloudLightning, CloudRain, Settings, ThermometerSun, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { getStoredWeatherLocation } from "../../lib/location-storage";
import { useI18n } from "../../hooks/use-i18n";
import {
  getNotificationCategory,
  useNotificationsCenter,
} from "../../hooks/use-notifications-center";
import { usePreferences } from "../../model/preferences-context";
import type { NotificationCategory } from "../../api/settings.types";
import { PageContainer } from "../components/app-shell";
import {
  ActionButton,
  Badge,
  PageHeader,
  SectionLabel,
  SurfaceCard,
  Toggle,
} from "../components/primitives";
import { cn } from "@/shared/lib/cn";

type FilterId = "all" | "unread" | "rain" | "storm" | "heat";

const categoryMeta: Record<
  NotificationCategory,
  { labelKey: "notifications.rain" | "notifications.storm" | "notifications.heat" | "notifications.tip" | "notifications.daily" | "notifications.alert"; emoji: string; color: string; background: string }
> = {
  rain: {
    labelKey: "notifications.rain",
    emoji: "🌧️",
    color: "#3b82f6",
    background: "rgba(59,130,246,0.1)",
  },
  storm: {
    labelKey: "notifications.storm",
    emoji: "⛈️",
    color: "#a855f7",
    background: "rgba(168,85,247,0.1)",
  },
  heat: {
    labelKey: "notifications.heat",
    emoji: "🌡️",
    color: "#f97316",
    background: "rgba(249,115,22,0.1)",
  },
  tip: {
    labelKey: "notifications.tip",
    emoji: "💡",
    color: "#a3e635",
    background: "rgba(163,230,53,0.1)",
  },
  daily: {
    labelKey: "notifications.daily",
    emoji: "📅",
    color: "#4a9eff",
    background: "rgba(74,158,255,0.1)",
  },
  other: {
    labelKey: "notifications.alert",
    emoji: "🔔",
    color: "#ef4444",
    background: "rgba(239,68,68,0.1)",
  },
};

function getErrorMessage(error: unknown) {
  if (isAxiosError(error)) {
    const message = (error.response?.data as { error?: { message?: string } } | undefined)?.error
      ?.message;
    if (message) return message;
  }
  if (error instanceof Error) return error.message;
  return "Unable to load notifications.";
}

export function NotificationsPage() {
  const { t, locale } = useI18n();
  const location = getStoredWeatherLocation();
  const { settings, updateSettings } = usePreferences();
  const center = useNotificationsCenter(location);
  const [filter, setFilter] = useState<FilterId>("all");

  const filtered = useMemo(() => {
    return center.notifications.filter((item) => {
      const category = getNotificationCategory(item);
      if (filter === "unread") return !item.read;
      if (filter === "rain") return category === "rain";
      if (filter === "storm") return category === "storm";
      if (filter === "heat") return category === "heat";
      return true;
    });
  }, [center.notifications, filter]);

  return (
    <PageContainer>
      <div className="mb-7 flex flex-wrap items-start justify-between gap-3">
        <PageHeader
          title={t("notifications.title")}
          subtitle={t("notifications.subtitle")}
        />
        <div className="flex flex-wrap gap-2">
          <ActionButton
            icon={<Check size={14} />}
            onClick={() => {
              void center.markAllRead();
            }}
          >
            {t("notifications.markAllRead")}
          </ActionButton>
          <ActionButton
            icon={<Trash2 size={14} />}
            onClick={() => {
              void center.clearRead();
            }}
          >
            {t("notifications.clearRead")}
          </ActionButton>
          <Link to="/settings">
            <ActionButton icon={<Settings size={14} />}>{t("common.settings")}</ActionButton>
          </Link>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          [t("notifications.unread"), center.unreadCount, "#ef4444", <Bell size={18} key="u" />],
          [t("notifications.rainAlerts"), center.rainCount, "#3b82f6", <CloudRain size={18} key="r" />],
          [t("notifications.stormAlerts"), center.stormCount, "#a855f7", <CloudLightning size={18} key="s" />],
          [t("notifications.heatAlerts"), center.heatCount, "#f97316", <ThermometerSun size={18} key="h" />],
        ].map(([label, value, color, icon]) => (
          <SurfaceCard className="px-[18px] py-3.5" key={String(label)}>
            <div className="mb-2" style={{ color: String(color) }}>
              {icon}
            </div>
            <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.06em] text-[#7a8ba8]">
              {label}
            </p>
            <strong
              className="text-[28px] font-black tracking-[-1px]"
              style={{ color: String(color) }}
            >
              {value}
            </strong>
          </SurfaceCard>
        ))}
      </div>

      <div className="mb-5 flex w-fit flex-wrap gap-1 rounded-[14px] border border-white/[0.07] bg-white/[0.04] p-1">
        {(
          [
            ["all", t("notifications.all")],
            ["unread", `${t("notifications.unread")} (${center.unreadCount})`],
            ["rain", t("notifications.rain")],
            ["storm", t("notifications.storm")],
            ["heat", t("notifications.heat")],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            className={cn(
              "rounded-[10px] px-4 py-1.5 text-xs font-bold transition-colors",
              filter === id ? "bg-[#111e38] text-[#e8edf8]" : "text-[#7a8ba8] hover:text-[#e8edf8]",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {center.isLoading && (
        <SurfaceCard className="mb-4">
          <p className="text-sm text-[#7a8ba8]">{t("notifications.syncing")}</p>
        </SurfaceCard>
      )}

      {center.isError && (
        <SurfaceCard className="mb-4 border-red-500/20 bg-red-500/10">
          <p className="mb-3 text-sm text-red-300">{getErrorMessage(center.error)}</p>
          <ActionButton
            onClick={() => {
              void center.refetch();
              void center.sync();
            }}
          >
            {t("common.retry")}
          </ActionButton>
        </SurfaceCard>
      )}

      <div className="flex flex-col gap-2">
        {filtered.map((note) => {
          const category = getNotificationCategory(note);
          const meta = categoryMeta[category];
          return (
            <article
              className="flex items-start gap-3.5 rounded-2xl border px-[18px] py-4"
              key={note.id}
              style={{
                background: note.read ? "rgba(255,255,255,0.02)" : meta.background,
                borderColor: note.read ? "rgba(255,255,255,0.07)" : `${meta.color}30`,
              }}
            >
              <span
                className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-xl border text-xl"
                style={{ background: meta.background, borderColor: `${meta.color}20` }}
              >
                {meta.emoji}
              </span>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <p
                    className={
                      note.read
                        ? "text-sm font-semibold text-[#7a8ba8]"
                        : "text-sm font-extrabold text-[#e8edf8]"
                    }
                  >
                    {note.title}
                  </p>
                  {!note.read && (
                    <span
                      className="h-[7px] w-[7px] rounded-full"
                      style={{ background: meta.color }}
                    />
                  )}
                  <Badge>{t(meta.labelKey)}</Badge>
                </div>
                <p className="mb-1.5 text-xs leading-6 text-[#7a8ba8]">{note.body}</p>
                <p className="text-[11px] font-semibold text-white/25">
                  {new Date(note.createdAt).toLocaleString(locale, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
              </div>
              <div className="flex shrink-0 gap-1.5">
                {!note.read && (
                  <button
                    type="button"
                    className="grid h-7 w-7 place-items-center rounded-lg border border-white/[0.07] bg-white/[0.04] text-[#22c55e]"
                    onClick={() => {
                      void center.markRead(note.id);
                    }}
                    aria-label={t("notifications.markRead")}
                  >
                    <Check size={12} />
                  </button>
                )}
                <button
                  type="button"
                  className="grid h-7 w-7 place-items-center rounded-lg border border-white/[0.07] bg-white/[0.04] text-[#7a8ba8] hover:text-red-400"
                  onClick={() => {
                    void center.remove(note.id);
                  }}
                  aria-label={t("notifications.delete")}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </article>
          );
        })}
        {!center.isLoading && filtered.length === 0 && (
          <SurfaceCard>
            <p className="text-sm text-[#7a8ba8]">
              {t("notifications.empty")}
            </p>
          </SurfaceCard>
        )}
      </div>

      <SurfaceCard className="mt-6">
        <SectionLabel>{t("notifications.quickToggles")}</SectionLabel>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {(
            [
              ["rainAlerts", t("notifications.rainAlerts"), "🌧️"],
              ["stormWarnings", t("notifications.stormAlerts"), "⛈️"],
              ["heatWarnings", t("notifications.heatAlerts"), "🌡️"],
            ] as const
          ).map(([key, label, emoji]) => (
            <div
              key={key}
              className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.07] bg-white/[0.03] px-3.5 py-3"
            >
              <div>
                <p className="text-xs font-bold text-[#e8edf8]">
                  {emoji} {label}
                </p>
                <p className="text-[11px] text-[#7a8ba8]">
                  {settings?.[key] ? t("common.enabled") : t("common.disabled")}
                </p>
              </div>
              <Toggle
                enabled={Boolean(settings?.[key])}
                onChange={(value) => {
                  void updateSettings({ [key]: value });
                }}
              />
            </div>
          ))}
        </div>
      </SurfaceCard>
    </PageContainer>
  );
}
