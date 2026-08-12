import { useMemo } from "react";
import { useLocation } from "react-router-dom";

import { useDocumentMeta } from "@/shared/lib/use-document-meta";

const ROUTE_META: Record<string, { title: string; description: string }> = {
  "/": {
    title: "Dashboard",
    description: "Live weather conditions, hourly and daily forecasts for your location.",
  },
  "/search": {
    title: "Search",
    description: "Search cities and locations for weather data.",
  },
  "/favorites": {
    title: "Favorites",
    description: "Saved locations and quick weather snapshots.",
  },
  "/analytics": {
    title: "Analytics",
    description: "Charts and period summaries for temperature, humidity, wind, and more.",
  },
  "/export": {
    title: "Export",
    description: "Export weather reports and analytics as PDF, CSV, or Excel.",
  },
  "/compare": {
    title: "Compare",
    description: "Compare weather metrics across cities.",
  },
  "/travel": {
    title: "Travel Planner",
    description: "Plan trips using upcoming forecast conditions.",
  },
  "/air-quality": {
    title: "Air Quality",
    description: "Air quality index, pollutants, and health guidance.",
  },
  "/alerts": {
    title: "Alerts",
    description: "Weather alerts and severe condition notices.",
  },
  "/map": {
    title: "Weather Map",
    description: "Interactive weather map layers and location view.",
  },
  "/profile": {
    title: "Profile",
    description: "Your SkyCast profile details.",
  },
  "/settings": {
    title: "Settings",
    description: "Language, theme, units, and notification preferences.",
  },
  "/notifications": {
    title: "Notifications",
    description: "Notification center for weather and account updates.",
  },
  "/login": {
    title: "Sign in",
    description: "Sign in to SkyCast weather dashboard.",
  },
  "/register": {
    title: "Create account",
    description: "Create a SkyCast account to save favorites and settings.",
  },
};

export function RouteDocumentMeta() {
  const { pathname } = useLocation();
  const meta = useMemo(() => {
    const exact = ROUTE_META[pathname];
    if (exact) return exact;
    const match = Object.entries(ROUTE_META).find(
      ([path]) => path !== "/" && pathname.startsWith(path),
    );
    return match?.[1];
  }, [pathname]);

  useDocumentMeta({
    title: meta?.title,
    description: meta?.description,
  });

  return null;
}
