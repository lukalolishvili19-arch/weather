import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { RouterProvider } from "react-router-dom";

import { appRouter } from "@/app/router";
import { AuthProvider } from "@/features/auth/model/auth-context";
import { PreferencesProvider } from "@/features/weather-dashboard/model/preferences-context";
import { queryClient } from "@/shared/lib/query-client";
import { ErrorBoundary } from "@/shared/ui/error-boundary";

export function AppProviders() {
  return (
    <ErrorBoundary title="SkyCast failed to load">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <PreferencesProvider>
            <RouterProvider router={appRouter} />
          </PreferencesProvider>
          {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
