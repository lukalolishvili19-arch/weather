import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/features/auth";

import { settingsApi } from "../api/settings-api";
import type {
  ThemePreference,
  UpdateUserSettingsPayload,
  UserSettings,
} from "../api/settings.types";
import { applyTheme, readStoredTheme } from "../lib/theme";

const SETTINGS_KEY = ["user-settings", "me"] as const;

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "ka", label: "ქართული" },
  { code: "ru", label: "Русский" },
] as const;

const ALLOWED_LANGUAGES = new Set(LANGUAGES.map((item) => item.code));

type PreferencesContextValue = {
  settings: UserSettings | null;
  isLoading: boolean;
  isSaving: boolean;
  languages: typeof LANGUAGES;
  updateSettings: (payload: UpdateUserSettingsPayload) => Promise<UserSettings>;
  refetch: () => Promise<unknown>;
};

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

function normalizeLanguage(language: string | null | undefined): string {
  const code = (language || "en").split("-")[0] ?? "en";
  return ALLOWED_LANGUAGES.has(code as (typeof LANGUAGES)[number]["code"]) ? code : "en";
}

function applyLanguage(language: string) {
  document.documentElement.lang = normalizeLanguage(language);
}

function applyMotionPreference(enabled: boolean) {
  document.documentElement.dataset.animate = enabled ? "on" : "off";
}

const GUEST_SETTINGS_KEY = "skycast.guestSettings";

/** Guests keep display preferences in this browser; defaults mirror the user_settings column defaults. */
function readGuestSettings(): UserSettings {
  const now = new Date().toISOString();
  const defaults: UserSettings = {
    id: "guest",
    userId: "guest",
    theme: readStoredTheme() ?? "DARK",
    language: "en",
    temperatureUnit: "CELSIUS",
    windSpeedUnit: "KMH",
    timeFormat24h: true,
    animateCharts: true,
    showFeelsLike: true,
    rainAlerts: true,
    stormWarnings: true,
    highUvAlerts: true,
    heatWarnings: true,
    strongWindAlerts: false,
    snowAlerts: false,
    dailyForecast: true,
    createdAt: now,
    updatedAt: now,
  };
  try {
    const stored = JSON.parse(localStorage.getItem(GUEST_SETTINGS_KEY) ?? "null") as
      | Partial<UserSettings>
      | null;
    if (!stored || typeof stored !== "object") return defaults;
    return {
      ...defaults,
      ...stored,
      theme: readStoredTheme() ?? stored.theme ?? defaults.theme,
      language: normalizeLanguage(stored.language),
    };
  } catch {
    return defaults;
  }
}

/** Also mirrors a signed-in user's settings, so signing out or reloading keeps the same look. */
function persistGuestSettings(
  source: UserSettings,
  setState: (settings: UserSettings) => void,
): UserSettings {
  const next: UserSettings = { ...source, id: "guest", userId: "guest" };
  setState(next);
  try {
    localStorage.setItem(GUEST_SETTINGS_KEY, JSON.stringify(next));
  } catch {
    // Storage can be unavailable (private mode); the preference still applies for this visit.
  }
  return next;
}

function affectsWeatherQueries(payload: UpdateUserSettingsPayload) {
  return (
    payload.temperatureUnit !== undefined ||
    payload.windSpeedUnit !== undefined ||
    payload.timeFormat24h !== undefined ||
    payload.showFeelsLike !== undefined
  );
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [guestSettings, setGuestSettings] = useState<UserSettings>(readGuestSettings);

  const settingsQuery = useQuery({
    queryKey: SETTINGS_KEY,
    queryFn: () => settingsApi.getMine(),
    enabled: isAuthenticated,
    staleTime: 60_000,
  });

  const settings = isAuthenticated ? (settingsQuery.data ?? null) : guestSettings;

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateUserSettingsPayload) => settingsApi.updateMine(payload),
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: SETTINGS_KEY });
      const previous = queryClient.getQueryData<UserSettings>(SETTINGS_KEY);

      // Apply theme/language/motion immediately — don't wait for cache or API.
      if (payload.theme) applyTheme(payload.theme);
      if (payload.language) applyLanguage(payload.language);
      if (payload.animateCharts !== undefined) applyMotionPreference(payload.animateCharts);

      if (previous) {
        queryClient.setQueryData<UserSettings>(SETTINGS_KEY, { ...previous, ...payload });
      }
      return { previous };
    },
    onError: (_error, _payload, context) => {
      if (context?.previous) {
        queryClient.setQueryData(SETTINGS_KEY, context.previous);
        applyTheme(context.previous.theme);
        applyLanguage(context.previous.language);
        applyMotionPreference(context.previous.animateCharts);
      }
    },
    onSuccess: (settings, payload) => {
      queryClient.setQueryData(SETTINGS_KEY, settings);
      applyTheme(settings.theme);
      applyLanguage(settings.language);
      applyMotionPreference(settings.animateCharts);
      if (affectsWeatherQueries(payload)) {
        void queryClient.invalidateQueries({ queryKey: ["weather"] });
      }
    },
  });

  // Boot from localStorage first so Light/System isn't wiped while settings load.
  useEffect(() => {
    applyTheme(readStoredTheme() ?? settingsQuery.data?.theme ?? "DARK");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isAuthenticated) return;
    applyLanguage(guestSettings.language);
    applyMotionPreference(guestSettings.animateCharts);
  }, [isAuthenticated, guestSettings.language, guestSettings.animateCharts]);

  useEffect(() => {
    if (!settingsQuery.data) {
      if (isAuthenticated) applyMotionPreference(true);
      return;
    }

    applyTheme(settingsQuery.data.theme);
    applyLanguage(settingsQuery.data.language);
    applyMotionPreference(settingsQuery.data.animateCharts);
    persistGuestSettings(settingsQuery.data, setGuestSettings);

    const normalized = normalizeLanguage(settingsQuery.data.language);
    if (normalized !== settingsQuery.data.language) {
      void settingsApi.updateMine({ language: normalized }).then((settings) => {
        queryClient.setQueryData(SETTINGS_KEY, settings);
        applyLanguage(settings.language);
      });
    }
  }, [settingsQuery.data, queryClient, isAuthenticated]);

  useEffect(() => {
    const preference =
      settings?.theme ?? readStoredTheme() ?? ("DARK" as ThemePreference);
    if (preference !== "SYSTEM") return;

    const media = window.matchMedia("(prefers-color-scheme: light)");
    const onChange = () => applyTheme("SYSTEM");
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [settings?.theme]);

  const updateGuestSettings = useCallback(
    async (payload: UpdateUserSettingsPayload) => {
      if (payload.theme) applyTheme(payload.theme);
      if (payload.language) applyLanguage(payload.language);
      if (payload.animateCharts !== undefined) applyMotionPreference(payload.animateCharts);

      const next = persistGuestSettings(
        {
          ...guestSettings,
          ...payload,
          ...(payload.language ? { language: normalizeLanguage(payload.language) } : {}),
          updatedAt: new Date().toISOString(),
        },
        setGuestSettings,
      );
      if (affectsWeatherQueries(payload)) {
        void queryClient.invalidateQueries({ queryKey: ["weather"] });
      }
      return next;
    },
    [guestSettings, queryClient],
  );

  const updateSettings = useCallback(
    async (payload: UpdateUserSettingsPayload) =>
      isAuthenticated ? updateMutation.mutateAsync(payload) : updateGuestSettings(payload),
    [isAuthenticated, updateMutation, updateGuestSettings],
  );

  const value = useMemo<PreferencesContextValue>(
    () => ({
      settings,
      isLoading: isAuthenticated && settingsQuery.isLoading,
      isSaving: updateMutation.isPending,
      languages: LANGUAGES,
      updateSettings,
      refetch: settingsQuery.refetch,
    }),
    [
      settings,
      isAuthenticated,
      settingsQuery.isLoading,
      settingsQuery.refetch,
      updateMutation.isPending,
      updateSettings,
    ],
  );

  return (
    <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error("usePreferences must be used within PreferencesProvider");
  }
  return context;
}

export { LANGUAGES };
