import {
  AlertTriangle,
  BarChart2,
  Bell,
  Download,
  GitCompareArrows,
  Heart,
  Home,
  Leaf,
  LogIn,
  LogOut,
  Map,
  Menu,
  Plane,
  Search,
  Settings,
  Sun,
  User,
  X,
} from "lucide-react";
import { useEffect, useId, useMemo, useState, type ReactNode } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "@/features/auth";
import { cn } from "@/shared/lib/cn";
import { ErrorBoundary } from "@/shared/ui/error-boundary";

import { useI18n } from "../../hooks/use-i18n";
import type { MessageKey } from "../../lib/i18n";

const navigationMeta = [
  { to: "/", labelKey: "nav.dashboard" as const, icon: Home, groupKey: "nav.main" as const },
  { to: "/search", labelKey: "nav.search" as const, icon: Search, groupKey: "nav.main" as const },
  {
    to: "/favorites",
    labelKey: "nav.favorites" as const,
    icon: Heart,
    groupKey: "nav.main" as const,
  },
  {
    to: "/analytics",
    labelKey: "nav.analytics" as const,
    icon: BarChart2,
    groupKey: "nav.weather" as const,
  },
  {
    to: "/export",
    labelKey: "nav.export" as const,
    icon: Download,
    groupKey: "nav.weather" as const,
  },
  {
    to: "/compare",
    labelKey: "nav.compare" as const,
    icon: GitCompareArrows,
    groupKey: "nav.weather" as const,
  },
  { to: "/travel", labelKey: "nav.travel" as const, icon: Plane, groupKey: "nav.weather" as const },
  {
    to: "/air-quality",
    labelKey: "nav.airQuality" as const,
    icon: Leaf,
    groupKey: "nav.weather" as const,
  },
  {
    to: "/alerts",
    labelKey: "nav.alerts" as const,
    icon: AlertTriangle,
    groupKey: "nav.weather" as const,
  },
  { to: "/map", labelKey: "nav.map" as const, icon: Map, groupKey: "nav.weather" as const },
  {
    to: "/notifications",
    labelKey: "nav.notifications" as const,
    icon: Bell,
    groupKey: "nav.personal" as const,
  },
  {
    to: "/profile",
    labelKey: "nav.profile" as const,
    icon: User,
    groupKey: "nav.personal" as const,
  },
  {
    to: "/settings",
    labelKey: "nav.settings" as const,
    icon: Settings,
    groupKey: "nav.personal" as const,
  },
] as const;

const groupKeys = ["nav.main", "nav.weather", "nav.personal"] as const satisfies MessageKey[];

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span
        aria-hidden="true"
        className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-lg bg-gradient-to-br from-[#c44404] to-[#f7921e] shadow-[0_0_12px_rgba(247,146,30,0.35)]"
      >
        <Sun size={15} color="white" />
      </span>
      {!compact && (
        <span className="text-base font-extrabold tracking-[-0.3px] text-foreground">SkyCast</span>
      )}
    </div>
  );
}

function SidebarLink({
  to,
  label,
  icon: Icon,
}: {
  to: string;
  label: string;
  icon: typeof Home;
}) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      className={({ isActive }) =>
        cn(
          "mb-0.5 flex items-center gap-2.5 rounded-[10px] border-l-2 border-transparent px-2.5 py-2 text-[13px] font-semibold text-muted-foreground",
          isActive && "border-l-[#f7921e] bg-[#f7921e]/10 text-[#f7921e]",
        )
      }
    >
      <Icon size={16} aria-hidden="true" />
      <span>{label}</span>
    </NavLink>
  );
}

function Sidebar() {
  const { user, isBootstrapping, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useI18n();

  return (
    <aside
      className="sticky top-0 hidden h-screen w-[220px] shrink-0 flex-col overflow-y-auto border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex"
      aria-label="Sidebar"
    >
      <div className="flex items-center justify-between border-b border-sidebar-border px-4 py-[18px]">
        <Brand />
      </div>
      <nav className="flex-1 px-2 py-3" aria-label="Main navigation">
        {groupKeys.map((groupKey) => (
          <div className="mb-2" key={groupKey}>
            <p className="px-2 pb-1 pt-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground/70">
              {t(groupKey)}
            </p>
            {navigationMeta
              .filter((item) => item.groupKey === groupKey)
              .map((item) => (
                <SidebarLink
                  key={item.to}
                  to={item.to}
                  label={t(item.labelKey)}
                  icon={item.icon}
                />
              ))}
          </div>
        ))}
      </nav>
      <div className="border-t border-sidebar-border px-4 py-3">
        <div className="mb-3 flex items-center gap-2.5">
          <span
            className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-[10px] border border-sidebar-border bg-gradient-to-br from-secondary to-muted text-[15px]"
            aria-hidden="true"
          >
            {user?.avatarUrl ? (
              <img alt="" className="h-full w-full object-cover" src={user.avatarUrl} />
            ) : (
              "👤"
            )}
          </span>
          <div className="min-w-0">
            <p className="truncate text-xs font-bold text-foreground">
              {isBootstrapping ? t("auth.checking") : user ? user.name || "SkyCast user" : t("auth.guest")}
            </p>
            <p className="truncate text-[10px] text-muted-foreground">
              {user ? user.email : isBootstrapping ? "" : t("auth.guestHint")}
            </p>
          </div>
        </div>
        {user ? (
          <button
            type="button"
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-sidebar-border bg-secondary/70 px-3 py-2 text-[12px] font-semibold text-muted-foreground hover:text-foreground"
            onClick={() => {
              void logout().then(() => navigate("/", { replace: true }));
            }}
          >
            <LogOut size={14} aria-hidden="true" />
            {t("nav.signOut")}
          </button>
        ) : (
          !isBootstrapping && (
            <div className="flex flex-col gap-1.5">
              <Link
                to="/register"
                state={{ from: location.pathname }}
                className="flex w-full items-center justify-center rounded-xl bg-gradient-to-br from-[#c44404] to-[#f7921e] px-3 py-2 text-[12px] font-semibold text-white"
              >
                {t("auth.createAccount")}
              </Link>
              <Link
                to="/login"
                state={{ from: location.pathname }}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-sidebar-border bg-secondary/70 px-3 py-2 text-[12px] font-semibold text-muted-foreground hover:text-foreground"
              >
                <LogIn size={14} aria-hidden="true" />
                {t("auth.logIn")}
              </Link>
            </div>
          )
        )}
      </div>
    </aside>
  );
}

function MobileNav() {
  const [moreOpen, setMoreOpen] = useState(false);
  const location = useLocation();
  const menuId = useId();
  const { t } = useI18n();
  const mobilePrimary = useMemo(() => navigationMeta.slice(0, 4), []);
  const mobileMore = useMemo(() => navigationMeta.slice(4), []);
  const moreActive = mobileMore.some((item) =>
    item.to === "/" ? location.pathname === "/" : location.pathname.startsWith(item.to),
  );

  useEffect(() => {
    setMoreOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!moreOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMoreOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [moreOpen]);

  return (
    <>
      {moreOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" role="presentation">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-black/50"
            onClick={() => setMoreOpen(false)}
          />
          <div
            id={menuId}
            role="dialog"
            aria-modal="true"
            aria-label={t("nav.more")}
            className="absolute inset-x-0 bottom-16 max-h-[70vh] overflow-y-auto rounded-t-[20px] border border-border bg-card p-4 text-card-foreground shadow-2xl"
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-bold text-foreground">{t("nav.more")}</p>
              <button
                type="button"
                aria-label="Close more menu"
                className="rounded-lg border border-border p-1.5 text-muted-foreground"
                onClick={() => setMoreOpen(false)}
              >
                <X size={16} />
              </button>
            </div>
            <nav aria-label="More navigation" className="grid grid-cols-3 gap-2">
              {mobileMore.map(({ to, labelKey, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    cn(
                      "flex flex-col items-center gap-2 rounded-[14px] border border-border bg-secondary/50 px-2 py-3 text-[11px] font-bold text-muted-foreground",
                      isActive && "border-[#f7921e]/35 bg-[#f7921e]/10 text-[#f7921e]",
                    )
                  }
                >
                  <Icon size={18} aria-hidden="true" />
                  <span className="text-center leading-tight">{t(labelKey)}</span>
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      )}

      <nav
        className="fixed inset-x-0 bottom-0 z-50 flex h-16 border-t border-border bg-card/95 text-card-foreground backdrop-blur-xl lg:hidden"
        aria-label="Mobile navigation"
      >
        {mobilePrimary.map(({ to, labelKey, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              cn(
                "relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 px-1 text-[10px] font-bold text-muted-foreground",
                isActive && "text-[#f7921e]",
              )
            }
          >
            <Icon size={20} aria-hidden="true" />
            <span className="truncate">{t(labelKey)}</span>
          </NavLink>
        ))}
        <button
          type="button"
          aria-expanded={moreOpen}
          aria-controls={menuId}
          className={cn(
            "relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 px-1 text-[10px] font-bold text-muted-foreground",
            (moreOpen || moreActive) && "text-[#f7921e]",
          )}
          onClick={() => setMoreOpen((open) => !open)}
        >
          <Menu size={20} aria-hidden="true" />
          <span>{t("nav.more")}</span>
        </button>
      </nav>
    </>
  );
}

export function AppShell() {
  return (
    <div className="flex min-h-screen bg-background font-['Manrope',sans-serif] text-foreground">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-xl focus:bg-[#f7921e] focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-white"
      >
        Skip to main content
      </a>
      <Sidebar />
      <main
        id="main-content"
        tabIndex={-1}
        className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto pb-16 outline-none lg:pb-0"
      >
        <ErrorBoundary title="This view crashed">
          <Outlet />
        </ErrorBoundary>
      </main>
      <MobileNav />
    </div>
  );
}

export function PageContainer({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("mx-auto max-w-[1440px] p-4 sm:p-6", className)}>{children}</div>;
}
