import { useMemo } from "react";

import { useAuth } from "@/features/auth";

import type { Favorite } from "../api/favorites.types";
import type { SearchHistoryEntry } from "../api/search.types";
import { useFavorites } from "./use-favorites";
import { useSearchHistory } from "./use-location-search";
import { useNotificationsCenter } from "./use-notifications-center";
import { useI18n } from "./use-i18n";

export type ProfileCityHistoryItem = {
  key: string;
  name: string;
  country: string;
  flag: string;
  visits: number;
  lastAt: string;
  lastLabel: string;
};

export type ProfileBadge = {
  emoji: string;
  label: string;
  detail: string;
  earned: boolean;
};

function countryFlag(country: string | null | undefined): string {
  const value = (country || "").toLowerCase();
  if (value.includes("georgia") || value === "ge") return "🇬🇪";
  if (value.includes("armenia") || value === "am") return "🇦🇲";
  if (value.includes("turkey") || value.includes("türkiye") || value === "tr") return "🇹🇷";
  if (value.includes("russia") || value === "ru") return "🇷🇺";
  if (value.includes("united states") || value === "us" || value === "usa") return "🇺🇸";
  if (value.includes("united kingdom") || value === "gb" || value === "uk") return "🇬🇧";
  if (value.includes("germany") || value === "de") return "🇩🇪";
  if (value.includes("france") || value === "fr") return "🇫🇷";
  return "🌍";
}

function dayKey(iso: string): string {
  return iso.slice(0, 10);
}

function formatRelativeDay(iso: string, locale: string, todayLabel: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startThat = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const diffDays = Math.round((startToday - startThat) / 86_400_000);
  if (diffDays === 0) return todayLabel;
  if (diffDays === 1) return new Intl.RelativeTimeFormat(locale, { numeric: "auto" }).format(-1, "day");
  return date.toLocaleDateString(locale, { month: "short", day: "numeric", year: "numeric" });
}

function buildCityHistory(
  favorites: Favorite[],
  history: SearchHistoryEntry[],
  locale: string,
  todayLabel: string,
): ProfileCityHistoryItem[] {
  const map = new Map<
    string,
    { name: string; country: string; visits: number; lastAt: string }
  >();

  for (const favorite of favorites) {
    const key = favorite.locationId || favorite.locationName.toLowerCase();
    map.set(key, {
      name: favorite.locationName,
      country: favorite.country ?? "",
      visits: 1,
      lastAt: favorite.updatedAt || favorite.createdAt,
    });
  }

  for (const entry of history) {
    const name = entry.locationName || entry.query;
    const key = entry.locationId || name.toLowerCase();
    const existing = map.get(key);
    if (existing) {
      existing.visits += 1;
      if (new Date(entry.searchedAt).getTime() > new Date(existing.lastAt).getTime()) {
        existing.lastAt = entry.searchedAt;
        existing.name = name;
        existing.country = entry.country ?? existing.country;
      }
    } else {
      map.set(key, {
        name,
        country: entry.country ?? "",
        visits: 1,
        lastAt: entry.searchedAt,
      });
    }
  }

  return [...map.values()]
    .sort((a, b) => {
      if (b.visits !== a.visits) return b.visits - a.visits;
      return new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime();
    })
    .slice(0, 8)
    .map((item) => ({
      key: `${item.name}-${item.country}-${item.lastAt}`,
      name: item.name,
      country: item.country || "—",
      flag: countryFlag(item.country),
      visits: item.visits,
      lastAt: item.lastAt,
      lastLabel: formatRelativeDay(item.lastAt, locale, todayLabel),
    }));
}

export function useProfileStats() {
  const { user } = useAuth();
  const { locale, t } = useI18n();
  const favoritesQuery = useFavorites();
  const historyQuery = useSearchHistory(100);
  const notifications = useNotificationsCenter();

  const favorites = favoritesQuery.data ?? [];
  const history = historyQuery.data ?? [];
  const alerts = notifications.notifications ?? [];

  const citiesTracked = favorites.length;
  const forecastChecks = history.length;
  const alertsReceived = alerts.length;

  const daysActive = useMemo(() => {
    if (!user?.createdAt) return 0;
    const created = new Date(user.createdAt).getTime();
    if (Number.isNaN(created)) return 0;
    return Math.max(1, Math.floor((Date.now() - created) / 86_400_000) + 1);
  }, [user?.createdAt]);

  const activeDaysFromActivity = useMemo(() => {
    const days = new Set<string>();
    for (const entry of history) days.add(dayKey(entry.searchedAt));
    for (const favorite of favorites) days.add(dayKey(favorite.createdAt));
    for (const alert of alerts) days.add(dayKey(alert.createdAt));
    if (user?.createdAt) days.add(dayKey(user.createdAt));
    return Math.max(days.size, user?.createdAt ? 1 : 0);
  }, [history, favorites, alerts, user?.createdAt]);

  const displayDaysActive = Math.max(daysActive, activeDaysFromActivity);

  const cityHistory = useMemo(
    () => buildCityHistory(favorites, history, locale, t("common.today")),
    [favorites, history, locale, t],
  );

  const maxVisits = Math.max(1, ...cityHistory.map((item) => item.visits), 1);

  const badges = useMemo<ProfileBadge[]>(() => {
    return [
      {
        emoji: "🌡️",
        label: t("profile.badgeHeat"),
        detail: t("profile.badgeHeatDetail"),
        earned: forecastChecks >= 5,
      },
      {
        emoji: "🌊",
        label: t("profile.badgeStorm"),
        detail: t("profile.badgeStormDetail"),
        earned: alertsReceived >= 1,
      },
      {
        emoji: "📊",
        label: t("profile.badgeData"),
        detail: t("profile.badgeDataDetail"),
        earned: forecastChecks >= 25,
      },
      {
        emoji: "🌍",
        label: t("profile.badgeGlobe"),
        detail: t("profile.badgeGlobeDetail"),
        earned: citiesTracked >= 5,
      },
      {
        emoji: "⭐",
        label: t("profile.badgePower"),
        detail: t("profile.badgePowerDetail"),
        earned: displayDaysActive >= 30,
      },
      {
        emoji: "🎯",
        label: t("profile.badgeExpert"),
        detail: t("profile.badgeExpertDetail"),
        earned: forecastChecks >= 100,
      },
    ];
  }, [forecastChecks, alertsReceived, citiesTracked, displayDaysActive, t]);

  const stats = [
    { label: t("profile.citiesTracked"), value: String(citiesTracked), emoji: "🌍" },
    { label: t("profile.daysActive"), value: String(displayDaysActive), emoji: "📅" },
    { label: t("profile.alertsReceived"), value: String(alertsReceived), emoji: "🔔" },
    {
      label: t("profile.forecastChecks"),
      value: forecastChecks.toLocaleString(locale),
      emoji: "👁️",
    },
  ];

  return {
    stats,
    cityHistory,
    maxVisits,
    badges,
    isLoading:
      favoritesQuery.isLoading || historyQuery.isLoading || notifications.isLoading,
  };
}
