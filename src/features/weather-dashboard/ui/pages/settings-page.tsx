import { Check, Monitor, Moon, Sun } from "lucide-react";
import { Link } from "react-router-dom";

import { useAuth } from "@/features/auth";
import { cn } from "@/shared/lib/cn";

import type {
  TemperatureUnitPreference,
  ThemePreference,
} from "../../api/settings.types";
import { usePreferences } from "../../model/preferences-context";
import { PageContainer } from "../components/app-shell";
import {
  ActionButton,
  Divider,
  PageHeader,
  SectionLabel,
  SettingRow,
  SurfaceCard,
  Toggle,
} from "../components/primitives";

const notificationPrefs = [
  {
    key: "rainAlerts" as const,
    label: "Rain Alerts",
    description: "Notified when 60%+ rain is forecast for tomorrow",
  },
  {
    key: "stormWarnings" as const,
    label: "Storm Alerts",
    description: "Immediate alerts for severe thunderstorm warnings",
  },
  {
    key: "heatWarnings" as const,
    label: "Heat Alerts",
    description: "Alert when temperature exceeds heat thresholds",
  },
  {
    key: "highUvAlerts" as const,
    label: "High UV Index",
    description: "Alert when UV Index exceeds 7 (Very High)",
  },
  {
    key: "strongWindAlerts" as const,
    label: "Strong Wind",
    description: "Alert when wind gusts exceed advisory levels",
  },
  {
    key: "snowAlerts" as const,
    label: "Snow Alerts",
    description: "Alert when snow is forecast",
  },
  {
    key: "dailyForecast" as const,
    label: "Daily Forecast",
    description: "Morning briefing for your saved cities",
  },
];

export function SettingsPage() {
  const { logout } = useAuth();
  const { settings, isLoading, isSaving, languages, updateSettings } = usePreferences();

  const theme = settings?.theme ?? "DARK";
  const language = settings?.language ?? "en";
  const temperatureUnit = settings?.temperatureUnit ?? "CELSIUS";

  return (
    <PageContainer>
      <PageHeader
        title="Settings"
        subtitle={
          isLoading
            ? "Loading your preferences…"
            : isSaving
              ? "Saving…"
              : "Language, dark mode, units, and notification preferences"
        }
      />

      <SurfaceCard className="mb-4">
        <SectionLabel>Dark Mode</SectionLabel>
        <div className="mb-4 flex gap-2">
          {(
            [
              { id: "DARK" as ThemePreference, label: "Dark", icon: Moon },
              { id: "LIGHT" as ThemePreference, label: "Light", icon: Sun },
              { id: "SYSTEM" as ThemePreference, label: "System", icon: Monitor },
            ]
          ).map(({ id, label, icon: Icon }) => {
            const selected = theme === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  void updateSettings({ theme: id });
                }}
                className={cn(
                  "flex flex-1 flex-col items-center gap-2 rounded-[14px] border p-3.5 transition-colors",
                  selected
                    ? "border-[#f7921e]/30 bg-[#f7921e]/10 text-[#f7921e]"
                    : "border-white/[0.07] bg-white/[0.03] text-[#7a8ba8] hover:text-[#e8edf8]",
                )}
              >
                <Icon size={16} />
                <span className="text-xs font-bold">{label}</span>
                {selected && <Check size={11} />}
              </button>
            );
          })}
        </div>
        <Divider className="mb-3.5" />
        <SettingRow
          label="Animate charts and transitions"
          description="Smooth animations for charts and page transitions"
        >
          <Toggle
            enabled={settings?.animateCharts ?? true}
            onChange={(animateCharts) => {
              void updateSettings({ animateCharts });
            }}
          />
        </SettingRow>
        <SettingRow
          label="Show 'feels like' temperature"
          description="Display apparent temperature alongside actual"
        >
          <Toggle
            enabled={settings?.showFeelsLike ?? true}
            onChange={(showFeelsLike) => {
              void updateSettings({ showFeelsLike });
            }}
          />
        </SettingRow>
        <SettingRow
          label="24-hour time format"
          description="Show times as 14:32 instead of 2:32 PM"
        >
          <Toggle
            enabled={settings?.timeFormat24h ?? true}
            onChange={(timeFormat24h) => {
              void updateSettings({ timeFormat24h });
            }}
          />
        </SettingRow>
      </SurfaceCard>

      <SurfaceCard className="mb-4">
        <SectionLabel>Language</SectionLabel>
        <div className="flex flex-wrap gap-2">
          {languages.map((item) => {
            const selected = language === item.code;
            return (
              <button
                key={item.code}
                type="button"
                onClick={() => {
                  void updateSettings({ language: item.code });
                }}
                className={cn(
                  "rounded-[10px] border px-3.5 py-2 text-[13px] font-bold transition-colors",
                  selected
                    ? "border-[#f7921e]/30 bg-[#f7921e]/10 text-[#f7921e]"
                    : "border-white/[0.07] bg-white/[0.04] text-[#7a8ba8] hover:text-[#e8edf8]",
                )}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </SurfaceCard>

      <SurfaceCard className="mb-4">
        <SectionLabel>Temperature Units</SectionLabel>
        <div className="mb-[18px] flex gap-2">
          {(
            [
              ["CELSIUS", "°C", "Celsius"],
              ["FAHRENHEIT", "°F", "Fahrenheit"],
            ] as Array<[TemperatureUnitPreference, string, string]>
          ).map(([id, symbol, label]) => {
            const active = temperatureUnit === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  void updateSettings({ temperatureUnit: id });
                }}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 rounded-xl border p-3 transition-colors",
                  active
                    ? "border-[#f7921e]/30 bg-[#f7921e]/10 text-[#f7921e]"
                    : "border-white/[0.07] bg-white/[0.03] text-[#7a8ba8] hover:text-[#e8edf8]",
                )}
              >
                <strong className="text-lg font-black">{symbol}</strong>
                <span className="text-[11px] font-bold">{label}</span>
              </button>
            );
          })}
        </div>
        <p className="mb-2.5 text-xs font-bold text-[#7a8ba8]">Wind Speed</p>
        <div className="flex flex-col gap-1.5">
          {(
            [
              ["KMH", "km/h — kilometres per hour"],
              ["MPH", "mph — miles per hour"],
              ["MS", "m/s — metres per second"],
            ] as const
          ).map(([id, label]) => {
            const active = (settings?.windSpeedUnit ?? "KMH") === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  void updateSettings({ windSpeedUnit: id });
                }}
                className={cn(
                  "flex items-center gap-3 rounded-xl border px-3.5 py-3 text-left text-[13px] font-bold transition-colors",
                  active
                    ? "border-[#f7921e]/30 bg-[#f7921e]/10 text-[#e8edf8]"
                    : "border-white/[0.07] bg-white/[0.03] text-[#7a8ba8] hover:text-[#e8edf8]",
                )}
              >
                <span
                  className={cn(
                    "grid h-5 w-5 place-items-center rounded-md",
                    active ? "bg-[#f7921e] text-white" : "bg-white/10",
                  )}
                >
                  {active && <Check size={11} />}
                </span>
                {label}
              </button>
            );
          })}
        </div>
      </SurfaceCard>

      <SurfaceCard className="mb-4">
        <div className="mb-2 flex items-center justify-between gap-3">
          <SectionLabel className="mb-0">Notification Preferences</SectionLabel>
          <Link to="/notifications" className="text-xs font-bold text-[#f7921e] hover:underline">
            Open Notification Center →
          </Link>
        </div>
        {notificationPrefs.map((item) => (
          <SettingRow key={item.key} label={item.label} description={item.description}>
            <Toggle
              enabled={Boolean(settings?.[item.key])}
              onChange={(value) => {
                void updateSettings({ [item.key]: value });
              }}
            />
          </SettingRow>
        ))}
      </SurfaceCard>

      <SurfaceCard>
        <SectionLabel>Account</SectionLabel>
        <div className="mt-2 flex gap-2.5">
          <ActionButton className="flex-1 justify-center" onClick={() => window.location.reload()}>
            Refresh App
          </ActionButton>
          <ActionButton
            variant="danger"
            className="flex-1 justify-center"
            onClick={() => {
              void logout();
            }}
          >
            Sign Out
          </ActionButton>
        </div>
      </SurfaceCard>
    </PageContainer>
  );
}
