import { Navigate, Outlet, useLocation } from "react-router-dom";

import { RouteDocumentMeta } from "@/shared/ui/route-document-meta";
import { PageSkeleton } from "@/shared/ui/skeleton";

import { useAuth } from "../model/auth-context";

export function ProtectedRoute() {
  const { isAuthenticated, isBootstrapping } = useAuth();
  const location = useLocation();

  if (isBootstrapping) {
    return (
      <div className="min-h-screen bg-[#070b18] font-['Manrope',sans-serif] text-[#e8edf8]">
        <PageSkeleton />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return (
    <>
      <RouteDocumentMeta />
      <Outlet />
    </>
  );
}

export function GuestRoute() {
  const { isAuthenticated, isBootstrapping } = useAuth();

  if (isBootstrapping) {
    return (
      <div className="min-h-screen bg-[#070b18] font-['Manrope',sans-serif] text-[#e8edf8]">
        <PageSkeleton cards={2} />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <>
      <RouteDocumentMeta />
      <Outlet />
    </>
  );
}
