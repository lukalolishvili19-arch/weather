import type { ReactNode } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";

import type { MessageKey } from "@/features/weather-dashboard/lib/i18n";
import { RouteDocumentMeta } from "@/shared/ui/route-document-meta";
import { PageSkeleton, RouteFallback } from "@/shared/ui/skeleton";

import { redirectTarget } from "../lib/auth-errors";
import { useAuth } from "../model/auth-context";
import { AccountPrompt } from "./account-prompt";

/** Weather pages are public; the shell renders immediately while the session is restored in the background. */
export function AppRoute() {
  return (
    <>
      <RouteDocumentMeta />
      <Outlet />
    </>
  );
}

/** Personal pages: guests see an optional sign-in card in place of the page, never a redirect. */
export function RequireAccount({
  messageKey,
  children,
}: {
  messageKey: MessageKey;
  children: ReactNode;
}) {
  const { isAuthenticated, isBootstrapping } = useAuth();

  if (isBootstrapping) {
    return <RouteFallback />;
  }

  if (!isAuthenticated) {
    return <AccountPrompt variant="page" messageKey={messageKey} />;
  }

  return <>{children}</>;
}

export function GuestRoute() {
  const { isAuthenticated, isBootstrapping } = useAuth();
  const location = useLocation();

  if (isBootstrapping) {
    return (
      <div className="min-h-screen bg-[#070b18] font-['Manrope',sans-serif] text-[#e8edf8]">
        <PageSkeleton cards={2} />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={redirectTarget(location.state)} replace />;
  }

  return (
    <>
      <RouteDocumentMeta />
      <Outlet />
    </>
  );
}
