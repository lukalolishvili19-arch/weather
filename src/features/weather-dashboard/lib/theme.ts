import type { ThemePreference } from "../api/settings.types";

export const THEME_STORAGE_KEY = "skycast-theme";

const DARK_VARS: Record<string, string> = {
  "--background": "#070b18",
  "--foreground": "#e8edf8",
  "--card": "#0d1628",
  "--card-foreground": "#e8edf8",
  "--popover": "#0d1628",
  "--popover-foreground": "#e8edf8",
  "--primary": "#f7921e",
  "--primary-foreground": "#ffffff",
  "--secondary": "#112038",
  "--secondary-foreground": "#e8edf8",
  "--muted": "#0f1e3a",
  "--muted-foreground": "#7a8ba8",
  "--accent": "#f7921e",
  "--accent-foreground": "#ffffff",
  "--destructive": "#ef4444",
  "--destructive-foreground": "#ffffff",
  "--border": "rgba(255, 255, 255, 0.07)",
  "--input": "rgba(255, 255, 255, 0.05)",
  "--input-background": "rgba(255, 255, 255, 0.05)",
  "--switch-background": "#1e2f50",
  "--ring": "rgba(247, 146, 30, 0.5)",
  "--sidebar": "#0d1628",
  "--sidebar-foreground": "#e8edf8",
  "--sidebar-primary": "#f7921e",
  "--sidebar-primary-foreground": "#ffffff",
  "--sidebar-accent": "#112038",
  "--sidebar-accent-foreground": "#e8edf8",
  "--sidebar-border": "rgba(255, 255, 255, 0.07)",
  "--sidebar-ring": "rgba(247, 146, 30, 0.5)",
};

const LIGHT_VARS: Record<string, string> = {
  "--background": "#f3f6fb",
  "--foreground": "#101828",
  "--card": "#ffffff",
  "--card-foreground": "#101828",
  "--popover": "#ffffff",
  "--popover-foreground": "#101828",
  "--primary": "#c44404",
  "--primary-foreground": "#ffffff",
  "--secondary": "#e8eef8",
  "--secondary-foreground": "#101828",
  "--muted": "#e7edf7",
  "--muted-foreground": "#667085",
  "--accent": "#c44404",
  "--accent-foreground": "#ffffff",
  "--destructive": "#dc2626",
  "--destructive-foreground": "#ffffff",
  "--border": "rgba(16, 24, 40, 0.08)",
  "--input": "rgba(16, 24, 40, 0.06)",
  "--input-background": "#ffffff",
  "--switch-background": "#d0d5dd",
  "--ring": "rgba(196, 68, 4, 0.35)",
  "--sidebar": "#ffffff",
  "--sidebar-foreground": "#101828",
  "--sidebar-primary": "#c44404",
  "--sidebar-primary-foreground": "#ffffff",
  "--sidebar-accent": "#f2f4f7",
  "--sidebar-accent-foreground": "#101828",
  "--sidebar-border": "rgba(16, 24, 40, 0.08)",
  "--sidebar-ring": "rgba(196, 68, 4, 0.35)",
};

export function resolveTheme(theme: ThemePreference): "dark" | "light" {
  if (theme === "DARK") return "dark";
  if (theme === "LIGHT") return "light";
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export function readStoredTheme(): ThemePreference | null {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY);
    if (value === "DARK" || value === "LIGHT" || value === "SYSTEM") return value;
  } catch {
    // ignore
  }
  return null;
}

/** Apply theme classes + CSS variables on <html>. Safe to call before React mounts. */
export function applyTheme(theme: ThemePreference) {
  if (typeof document === "undefined") return;

  const resolved = resolveTheme(theme);
  const root = document.documentElement;
  const vars = resolved === "light" ? LIGHT_VARS : DARK_VARS;

  root.classList.remove("dark", "light");
  root.classList.add(resolved);
  root.dataset.theme = resolved;
  root.dataset.themePreference = theme;
  root.style.colorScheme = resolved;

  for (const [key, value] of Object.entries(vars)) {
    root.style.setProperty(key, value);
  }

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute("content", resolved === "light" ? "#f3f6fb" : "#070b18");
  }

  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // ignore
  }
}

export function bootThemeFromStorage() {
  applyTheme(readStoredTheme() ?? "DARK");
}
