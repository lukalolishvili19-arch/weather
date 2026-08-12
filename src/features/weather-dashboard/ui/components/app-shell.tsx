import {
  AlertTriangle,
  BarChart2,
  Bell,
  Download,
  GitCompareArrows,
  Heart,
  Home,
  Leaf,
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
import { useEffect, useId, useState, type ReactNode } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "@/features/auth";
import { cn } from "@/shared/lib/cn";
import { ErrorBoundary } from "@/shared/ui/error-boundary";

const navigation = [
  { to: "/", label: "Dashboard", icon: Home, group: "Main" },
  { to: "/search", label: "Search", icon: Search, group: "Main" },
  { to: "/favorites", label: "Favorites", icon: Heart, group: "Main" },
  { to: "/analytics", label: "Analytics", icon: BarChart2, group: "Weather" },
  { to: "/export", label: "Export", icon: Download, group: "Weather" },
  { to: "/compare", label: "Compare", icon: GitCompareArrows, group: "Weather" },
  { to: "/travel", label: "Travel", icon: Plane, group: "Weather" },
  { to: "/air-quality", label: "Air Quality", icon: Leaf, group: "Weather" },
  { to: "/alerts", label: "Alerts", icon: AlertTriangle, group: "Weather" },
  { to: "/map", label: "Weather Map", icon: Map, group: "Weather" },
  { to: "/notifications", label: "Notifications", icon: Bell, group: "Personal" },
  { to: "/profile", label: "Profile", icon: User, group: "Personal" },
  { to: "/settings", label: "Settings", icon: Settings, group: "Personal" },
] as const;

const mobilePrimary = navigation.slice(0, 4);
const mobileMore = navigation.slice(4);

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
        <span className="text-base font-extrabold tracking-[-0.3px] text-[#e8edf8]">SkyCast</span>
      )}
    </div>
  );
}

function SidebarLink({ to, label, icon: Icon }: { to: string; label: string; icon: typeof Home }) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      className={({ isActive }) =>
        cn(
          "mb-0.5 flex items-center gap-2.5 rounded-[10px] border-l-2 border-transparent px-2.5 py-2 text-[13px] font-semibold text-[#7a8ba8]",
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
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const groups = ["Main", "Weather", "Personal"] as const;

  return (
    <aside
      className="sticky top-0 hidden h-screen w-[220px] shrink-0 flex-col overflow-y-auto border-r border-white/[0.07] bg-[#0d1628] lg:flex"
      aria-label="Sidebar"
    >
      <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-[18px]">
        <Brand />
      </div>
      <nav className="flex-1 px-2 py-3" aria-label="Main navigation">
        {groups.map((group) => (
          <div className="mb-2" key={group}>
            <p className="px-2 pb-1 pt-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#7a8ba8]/50">
              {group}
            </p>
            {navigation
              .filter((item) => item.group === group)
              .map((item) => (
                <SidebarLink key={item.to} {...item} />
              ))}
          </div>
        ))}
      </nav>
      <div className="border-t border-white/[0.07] px-4 py-3">
        <div className="mb-3 flex items-center gap-2.5">
          <span
            className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-[10px] border border-white/[0.07] bg-gradient-to-br from-[#112038] to-[#1e3a60] text-[15px]"
            aria-hidden="true"
          >
            {user?.avatarUrl ? (
              <img alt="" className="h-full w-full object-cover" src={user.avatarUrl} />
            ) : (
              "👤"
            )}
          </span>
          <div className="min-w-0">
            <p className="truncate text-xs font-bold text-[#e8edf8]">
              {user?.name || "SkyCast user"}
            </p>
            <p className="truncate text-[10px] text-[#7a8ba8]">{user?.email}</p>
          </div>
        </div>
        <button
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/[0.07] bg-white/5 px-3 py-2 text-[12px] font-semibold text-[#7a8ba8] hover:text-[#e8edf8]"
          onClick={() => {
            void logout().then(() => navigate("/login", { replace: true }));
          }}
        >
          <LogOut size={14} aria-hidden="true" />
          Sign out
        </button>
      </div>
    </aside>
  );
}

function MobileNav() {
  const [moreOpen, setMoreOpen] = useState(false);
  const location = useLocation();
  const menuId = useId();
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
            aria-label="More pages"
            className="absolute inset-x-0 bottom-16 max-h-[70vh] overflow-y-auto rounded-t-[20px] border border-white/[0.08] bg-[#0d1628] p-4 shadow-2xl"
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-bold text-[#e8edf8]">More</p>
              <button
                type="button"
                aria-label="Close more menu"
                className="rounded-lg border border-white/[0.07] p-1.5 text-[#7a8ba8]"
                onClick={() => setMoreOpen(false)}
              >
                <X size={16} />
              </button>
            </div>
            <nav aria-label="More navigation" className="grid grid-cols-3 gap-2">
              {mobileMore.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    cn(
                      "flex flex-col items-center gap-2 rounded-[14px] border border-white/[0.06] bg-white/[0.03] px-2 py-3 text-[11px] font-bold text-[#7a8ba8]",
                      isActive && "border-[#f7921e]/35 bg-[#f7921e]/10 text-[#f7921e]",
                    )
                  }
                >
                  <Icon size={18} aria-hidden="true" />
                  <span className="text-center leading-tight">
                    {label === "Weather Map" ? "Map" : label}
                  </span>
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      )}

      <nav
        className="fixed inset-x-0 bottom-0 z-50 flex h-16 border-t border-white/[0.07] bg-[#0d1628]/95 backdrop-blur-xl lg:hidden"
        aria-label="Mobile navigation"
      >
        {mobilePrimary.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              cn(
                "relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 px-1 text-[10px] font-bold text-[#7a8ba8]",
                isActive && "text-[#f7921e]",
              )
            }
          >
            <Icon size={20} aria-hidden="true" />
            <span className="truncate">{label}</span>
          </NavLink>
        ))}
        <button
          type="button"
          aria-expanded={moreOpen}
          aria-controls={menuId}
          className={cn(
            "relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 px-1 text-[10px] font-bold text-[#7a8ba8]",
            (moreOpen || moreActive) && "text-[#f7921e]",
          )}
          onClick={() => setMoreOpen((open) => !open)}
        >
          <Menu size={20} aria-hidden="true" />
          <span>More</span>
        </button>
      </nav>
    </>
  );
}

export function AppShell() {
  return (
    <div className="flex min-h-screen bg-[#070b18] font-['Manrope',sans-serif] text-[#e8edf8]">
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
