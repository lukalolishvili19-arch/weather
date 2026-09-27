import { Suspense, lazy, type ReactNode } from "react";
import { createBrowserRouter } from "react-router-dom";

import { AppRoute, GuestRoute, RequireAccount } from "@/features/auth/ui/protected-route";
import type { MessageKey } from "@/features/weather-dashboard/lib/i18n";
import { AppShell } from "@/features/weather-dashboard/ui/components/app-shell";
import { ErrorBoundary } from "@/shared/ui/error-boundary";
import { RouteFallback } from "@/shared/ui/skeleton";

const LoginPage = lazy(() =>
  import("@/features/auth/ui/login-page").then((module) => ({ default: module.LoginPage })),
);
const RegisterPage = lazy(() =>
  import("@/features/auth/ui/register-page").then((module) => ({ default: module.RegisterPage })),
);
const DashboardPage = lazy(() =>
  import("@/features/weather-dashboard/ui/pages/dashboard-page").then((module) => ({
    default: module.DashboardPage,
  })),
);
const SearchPage = lazy(() =>
  import("@/features/weather-dashboard/ui/pages/search-page").then((module) => ({
    default: module.SearchPage,
  })),
);
const FavoritesPage = lazy(() =>
  import("@/features/weather-dashboard/ui/pages/favorites-page").then((module) => ({
    default: module.FavoritesPage,
  })),
);
const AnalyticsPage = lazy(() =>
  import("@/features/weather-dashboard/ui/pages/analytics-page").then((module) => ({
    default: module.AnalyticsPage,
  })),
);
const ExportPage = lazy(() =>
  import("@/features/weather-dashboard/ui/pages/export-page").then((module) => ({
    default: module.ExportPage,
  })),
);
const ComparePage = lazy(() =>
  import("@/features/weather-dashboard/ui/pages/compare-page").then((module) => ({
    default: module.ComparePage,
  })),
);
const TravelPlannerPage = lazy(() =>
  import("@/features/weather-dashboard/ui/pages/travel-planner-page").then((module) => ({
    default: module.TravelPlannerPage,
  })),
);
const AirQualityPage = lazy(() =>
  import("@/features/weather-dashboard/ui/pages/air-quality-page").then((module) => ({
    default: module.AirQualityPage,
  })),
);
const AlertsPage = lazy(() =>
  import("@/features/weather-dashboard/ui/pages/alerts-page").then((module) => ({
    default: module.AlertsPage,
  })),
);
const MapPage = lazy(() =>
  import("@/features/weather-dashboard/ui/pages/map-page").then((module) => ({
    default: module.MapPage,
  })),
);
const ProfilePage = lazy(() =>
  import("@/features/weather-dashboard/ui/pages/profile-page").then((module) => ({
    default: module.ProfilePage,
  })),
);
const SettingsPage = lazy(() =>
  import("@/features/weather-dashboard/ui/pages/settings-page").then((module) => ({
    default: module.SettingsPage,
  })),
);
const NotificationsPage = lazy(() =>
  import("@/features/weather-dashboard/ui/pages/notifications-page").then((module) => ({
    default: module.NotificationsPage,
  })),
);

function Suspended({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary title="This page crashed">
      <Suspense fallback={<RouteFallback />}>{children}</Suspense>
    </ErrorBoundary>
  );
}

function page(element: ReactNode) {
  return <Suspended>{element}</Suspended>;
}

function accountPage(messageKey: MessageKey, element: ReactNode) {
  return (
    <Suspended>
      <RequireAccount messageKey={messageKey}>{element}</RequireAccount>
    </Suspended>
  );
}

export const appRouter = createBrowserRouter([
  {
    element: <GuestRoute />,
    children: [
      { path: "login", element: page(<LoginPage />) },
      { path: "register", element: page(<RegisterPage />) },
    ],
  },
  {
    element: <AppRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          { index: true, element: page(<DashboardPage />) },
          { path: "search", element: page(<SearchPage />) },
          {
            path: "favorites",
            element: accountPage("auth.prompt.favorites", <FavoritesPage />),
          },
          { path: "analytics", element: page(<AnalyticsPage />) },
          { path: "export", element: page(<ExportPage />) },
          { path: "compare", element: page(<ComparePage />) },
          { path: "travel", element: page(<TravelPlannerPage />) },
          { path: "air-quality", element: page(<AirQualityPage />) },
          { path: "alerts", element: page(<AlertsPage />) },
          { path: "map", element: page(<MapPage />) },
          { path: "profile", element: accountPage("auth.prompt.profile", <ProfilePage />) },
          { path: "settings", element: page(<SettingsPage />) },
          {
            path: "notifications",
            element: accountPage("auth.prompt.notifications", <NotificationsPage />),
          },
          { path: "*", element: page(<DashboardPage />) },
        ],
      },
    ],
  },
]);
