import { Suspense, lazy, type ReactNode } from "react";
import { createBrowserRouter } from "react-router-dom";

import { GuestRoute, ProtectedRoute } from "@/features/auth/ui/protected-route";
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

export const appRouter = createBrowserRouter([
  {
    element: <GuestRoute />,
    children: [
      { path: "login", element: page(<LoginPage />) },
      { path: "register", element: page(<RegisterPage />) },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          { index: true, element: page(<DashboardPage />) },
          { path: "search", element: page(<SearchPage />) },
          { path: "favorites", element: page(<FavoritesPage />) },
          { path: "analytics", element: page(<AnalyticsPage />) },
          { path: "export", element: page(<ExportPage />) },
          { path: "compare", element: page(<ComparePage />) },
          { path: "travel", element: page(<TravelPlannerPage />) },
          { path: "air-quality", element: page(<AirQualityPage />) },
          { path: "alerts", element: page(<AlertsPage />) },
          { path: "map", element: page(<MapPage />) },
          { path: "profile", element: page(<ProfilePage />) },
          { path: "settings", element: page(<SettingsPage />) },
          { path: "notifications", element: page(<NotificationsPage />) },
          { path: "*", element: page(<DashboardPage />) },
        ],
      },
    ],
  },
]);
