import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
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

const SETTINGS_KEY = ["user-settings", "me"] as const;

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "ka", label: "Georgian" },
  { code: "ru", label: "Russian" },
  { code: "tr", label: "Turkish" },
  { code: "de", label: "German" },
  { code: "fr", label: "French" },
] as const;

type PreferencesContextValue = {
  settings: UserSettings | null;
  isLoading: boolean;
  isSaving: boolean;
  languages: typeof LANGUAGES;
  updateSettings: (payload: UpdateUserSettingsPayload) => Promise<UserSettings>;
  refetch: () => Promise<unknown>;
};

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

function resolveTheme(theme: ThemePreference): "dark" | "light" {
  if (theme === "DARK") return "dark";
  if (theme === "LIGHT") return "light";
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function applyTheme(theme: ThemePreference) {
  const resolved = resolveTheme(theme);
  const root = document.documentElement;
  root.classList.toggle("dark", resolved === "dark");
  root.classList.toggle("light", resolved === "light");
  root.dataset.theme = resolved;
}

function applyLanguage(language: string) {
  document.documentElement.lang = language || "en";
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const settingsQuery = useQuery({
    queryKey: SETTINGS_KEY,
    queryFn: () => settingsApi.getMine(),
    enabled: isAuthenticated,
    staleTime: 60_000,
  });

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateUserSettingsPayload) => settingsApi.updateMine(payload),
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: SETTINGS_KEY });
      const previous = queryClient.getQueryData<UserSettings>(SETTINGS_KEY);
      if (previous) {
        queryClient.setQueryData<UserSettings>(SETTINGS_KEY, {
          ...previous,
          ...payload,
        });
      }
      return { previous };
    },
    onError: (_error, _payload, context) => {
      if (context?.previous) {
        queryClient.setQueryData(SETTINGS_KEY, context.previous);
      }
    },
    onSuccess: (settings) => {
      queryClient.setQueryData(SETTINGS_KEY, settings);
    },
  });

  useEffect(() => {
    if (!settingsQuery.data) {
      applyTheme("DARK");
      return;
    }
    applyTheme(settingsQuery.data.theme);
    applyLanguage(settingsQuery.data.language);
  }, [settingsQuery.data]);

  useEffect(() => {
    if (settingsQuery.data?.theme !== "SYSTEM") return;
    const media = window.matchMedia("(prefers-color-scheme: light)");
    const onChange = () => applyTheme("SYSTEM");
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [settingsQuery.data?.theme]);

  const updateSettings = useCallback(
    async (payload: UpdateUserSettingsPayload) => updateMutation.mutateAsync(payload),
    [updateMutation],
  );

  const value = useMemo<PreferencesContextValue>(
    () => ({
      settings: settingsQuery.data ?? null,
      isLoading: settingsQuery.isLoading,
      isSaving: updateMutation.isPending,
      languages: LANGUAGES,
      updateSettings,
      refetch: settingsQuery.refetch,
    }),
    [
      settingsQuery.data,
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
