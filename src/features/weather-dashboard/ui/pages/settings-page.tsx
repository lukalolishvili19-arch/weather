import { Check, Monitor, Moon, Sun } from "lucide-react";
import { Link } from "react-router-dom";

import { useAuth } from "@/features/auth";
import { AccountPrompt } from "@/features/auth/ui/account-prompt";
import { cn } from "@/shared/lib/cn";

import type {
  TemperatureUnitPreference,
  ThemePreference,
} from "../../api/settings.types";
import { useI18n } from "../../hooks/use-i18n";
import { applyTheme } from "../../lib/theme";
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
    label: "settings.rainAlerts" as const,
    description: "settings.rainAlertsDescription" as const,
  },
  {
    key: "stormWarnings" as const,
    label: "settings.stormAlerts" as const,
    description: "settings.stormAlertsDescription" as const,
  },
  {
    key: "heatWarnings" as const,
    label: "settings.heatAlerts" as const,
    description: "settings.heatAlertsDescription" as const,
  },
  {
    key: "highUvAlerts" as const,
    label: "settings.uvAlerts" as const,
    description: "settings.uvAlertsDescription" as const,
  },
  {
    key: "strongWindAlerts" as const,
    label: "settings.windAlerts" as const,
    description: "settings.windAlertsDescription" as const,
  },
  {
    key: "snowAlerts" as const,
    label: "settings.snowAlerts" as const,
    description: "settings.snowAlertsDescription" as const,
  },
  {
    key: "dailyForecast" as const,
    label: "settings.dailyForecast" as const,
    description: "settings.dailyForecastDescription" as const,
  },
];

export function SettingsPage() {
  const { isAuthenticated, isBootstrapping, logout } = useAuth();
  const isGuest = !isAuthenticated && !isBootstrapping;
  const { settings, isLoading, isSaving, languages, updateSettings } = usePreferences();
  const { t } = useI18n();

  const theme = settings?.theme ?? "DARK";
  const language = settings?.language ?? "en";
  const temperatureUnit = settings?.temperatureUnit ?? "CELSIUS";

  return (
    <PageContainer>
      <PageHeader
        title={t("settings.title")}
        subtitle={
          isLoading
            ? t("common.loading")
            : isSaving
              ? t("common.saving")
              : t("settings.subtitle")
        }
      />

      <SurfaceCard className="mb-4">
        <SectionLabel>{t("settings.darkMode")}</SectionLabel>
        <div className="mb-4 flex gap-2">
          {(
            [
              { id: "DARK" as ThemePreference, label: t("settings.themeDark"), icon: Moon },
              { id: "LIGHT" as ThemePreference, label: t("settings.themeLight"), icon: Sun },
              { id: "SYSTEM" as ThemePreference, label: t("settings.themeSystem"), icon: Monitor },
            ]
          ).map(({ id, label, icon: Icon }) => {
            const selected = theme === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  applyTheme(id);
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
          label={t("settings.animateCharts")}
          description={t("settings.animateChartsDescription")}
        >
          <Toggle
            enabled={settings?.animateCharts ?? true}
            onChange={(animateCharts) => {
              void updateSettings({ animateCharts });
            }}
          />
        </SettingRow>
        <SettingRow
          label={t("settings.showFeelsLike")}
          description={t("settings.showFeelsLikeDescription")}
        >
          <Toggle
            enabled={settings?.showFeelsLike ?? true}
            onChange={(showFeelsLike) => {
              void updateSettings({ showFeelsLike });
            }}
          />
        </SettingRow>
        <SettingRow
          label={t("settings.time24h")}
          description={t("settings.time24hDescription")}
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
        <SectionLabel>{t("settings.language")}</SectionLabel>
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
        <SectionLabel>{t("settings.temperature")}</SectionLabel>
        <div className="mb-[18px] flex gap-2">
          {(
            [
              ["CELSIUS", "°C", t("settings.celsius")],
              ["FAHRENHEIT", "°F", t("settings.fahrenheit")],
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
        <p className="mb-2.5 text-xs font-bold text-[#7a8ba8]">{t("settings.windSpeed")}</p>
        <div className="flex flex-col gap-1.5">
          {(
            [
              ["KMH", t("settings.windKmh")],
              ["MPH", t("settings.windMph")],
              ["MS", t("settings.windMs")],
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
          <SectionLabel className="mb-0">{t("settings.notificationPreferences")}</SectionLabel>
          <Link to="/notifications" className="text-xs font-bold text-[#f7921e] hover:underline">
            {t("settings.openNotificationCenter")}
          </Link>
        </div>
        {isAuthenticated ? (
          notificationPrefs.map((item) => (
            <SettingRow key={item.key} label={t(item.label)} description={t(item.description)}>
              <Toggle
                enabled={Boolean(settings?.[item.key])}
                onChange={(value) => {
                  void updateSettings({ [item.key]: value });
                }}
              />
            </SettingRow>
          ))
        ) : isGuest ? (
          <AccountPrompt messageKey="auth.prompt.alerts" className="mt-2" />
        ) : null}
      </SurfaceCard>

      <SurfaceCard>
        <SectionLabel>{t("common.account")}</SectionLabel>
        {isAuthenticated ? (
          <div className="mt-2 flex gap-2.5">
            <ActionButton className="flex-1 justify-center" onClick={() => window.location.reload()}>
              {t("settings.refreshApp")}
            </ActionButton>
            <ActionButton
              variant="danger"
              className="flex-1 justify-center"
              onClick={() => {
                void logout();
              }}
            >
              {t("common.signOut")}
            </ActionButton>
          </div>
        ) : isGuest ? (
          <AccountPrompt messageKey="auth.promptOptional" className="mt-2" />
        ) : null}
      </SurfaceCard>
    </PageContainer>
  );
}
