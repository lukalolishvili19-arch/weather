import { Edit2, Heart, LogOut, MapPin, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/features/auth";

import { PageContainer } from "../components/app-shell";
import {
  ActionButton,
  Badge,
  PageHeader,
  ProgressBar,
  SectionLabel,
  SurfaceCard,
} from "../components/primitives";

const stats = [
  ["Cities Tracked", "8", "🌍"],
  ["Days Active", "127", "📅"],
  ["Alerts Received", "34", "🔔"],
  ["Forecast Checks", "2,841", "👁️"],
];
const history = [
  ["Tbilisi", "Georgia", "🇬🇪", 89, "Today"],
  ["Batumi", "Georgia", "🇬🇪", 12, "Jul 08, 2026"],
  ["Yerevan", "Armenia", "🇦🇲", 8, "Jun 22, 2026"],
  ["Istanbul", "Turkey", "🇹🇷", 6, "Jun 01, 2026"],
  ["Moscow", "Russia", "🇷🇺", 3, "May 14, 2026"],
] as const;
const earnedBadges = [
  ["🌡️", "Heat Survivor", "Checked weather at 40°C+"],
  ["🌊", "Storm Chaser", "Tracked 5 storm alerts"],
  ["📊", "Data Nerd", "Viewed 1000+ forecasts"],
  ["🌍", "Globe Trotter", "Added 5+ cities"],
  ["⭐", "Power User", "Active 30+ days"],
  ["🎯", "Forecast Expert", "100+ forecast checks"],
];

export function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, {
        month: "short",
        year: "numeric",
      })
    : "—";

  return (
    <PageContainer>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-3">
        <PageHeader title="Profile" subtitle="Your SkyCast account and preferences" />
        <div className="flex flex-wrap gap-2">
          <ActionButton icon={<Edit2 size={14} />}>Edit Profile</ActionButton>
          <ActionButton
            variant="danger"
            icon={<LogOut size={14} />}
            onClick={() => {
              void logout().then(() => navigate("/login", { replace: true }));
            }}
          >
            Sign out
          </ActionButton>
        </div>
      </div>
      <SurfaceCard className="mb-5 px-7 py-6">
        <div className="flex flex-wrap items-center gap-5">
          <span className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-[20px] border-2 border-[#f7921e]/30 bg-gradient-to-br from-[#112038] to-[#1e3a60] text-4xl">
            {user?.avatarUrl ? (
              <img alt="" className="h-full w-full object-cover" src={user.avatarUrl} />
            ) : (
              "👤"
            )}
          </span>
          <div className="flex-1">
            <h2 className="mb-1 text-[22px] font-black tracking-[-0.5px]">
              {user?.name || "SkyCast user"}
            </h2>
            <div className="mb-2 flex flex-wrap gap-2">
              <Badge variant="orange">⭐ Member</Badge>
              <Badge variant="blue">{user?.email}</Badge>
              <Badge variant="green">✓ Verified</Badge>
            </div>
            <p className="flex items-center gap-1.5 text-[13px] text-[#7a8ba8]">
              <MapPin size={13} />
              Member since {memberSince}
            </p>
          </div>
          <div className="text-right">
            <p className="mb-1 text-[11px] font-semibold text-[#7a8ba8]">Account ID</p>
            <strong className="text-sm">{user?.id.slice(0, 10)}…</strong>
          </div>
        </div>
      </SurfaceCard>
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map(([label, value, emoji]) => (
          <SurfaceCard className="px-4 py-[18px] text-center" key={label}>
            <span className="mb-2 block text-[28px]">{emoji}</span>
            <strong className="mb-1 block text-[28px] font-black tracking-[-1px]">{value}</strong>
            <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#7a8ba8]">
              {label}
            </span>
          </SurfaceCard>
        ))}
      </div>
      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SurfaceCard>
          <SectionLabel>City History</SectionLabel>
          {history.map(([city, country, flag, visits, last], index) => (
            <div className="flex items-center gap-3 border-b border-white/[0.07] py-2.5" key={city}>
              <span className="text-[22px]">{flag}</span>
              <div className="flex-1">
                <p className="text-[13px] font-bold">
                  {city}, {country}
                </p>
                <p className="text-[11px] text-[#7a8ba8]">Last: {last}</p>
              </div>
              <ProgressBar value={visits} className="h-1 w-[60px]" />
              <span className="w-7 text-right text-xs font-bold text-[#7a8ba8]">{visits}</span>
              {index === 0 && <Star size={14} color="#f7921e" fill="#f7921e" />}
            </div>
          ))}
          <ActionButton className="mt-3.5 w-full justify-center" icon={<Heart size={14} />}>
            Manage Favorites
          </ActionButton>
        </SurfaceCard>
        <SurfaceCard>
          <SectionLabel>Badges Earned</SectionLabel>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {earnedBadges.map(([emoji, label, detail]) => (
              <article
                className="rounded-[14px] border border-white/[0.07] bg-white/[0.03] px-2.5 py-3.5 text-center"
                key={label}
              >
                <span className="mb-1.5 block text-[28px]">{emoji}</span>
                <p className="mb-0.5 text-xs font-bold">{label}</p>
                <p className="text-[10px] leading-snug text-[#7a8ba8]">{detail}</p>
              </article>
            ))}
          </div>
        </SurfaceCard>
      </div>
      <SurfaceCard>
        <div className="mb-4 flex justify-between">
          <SectionLabel className="mb-0">Quick Preferences</SectionLabel>
          <ActionButton>Open Settings</ActionButton>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            ["Temperature", "°C (Celsius)", "🌡️"],
            ["Wind speed", "km/h", "💨"],
            ["Pressure", "hPa", "📊"],
            ["Language", "English", "🌐"],
            ["Theme", "Dark mode", "🌙"],
            ["Notif. freq.", "Real-time", "🔔"],
            ["Time format", "24h", "🕐"],
            ["Data source", "Open-Meteo + IQAir", "📡"],
          ].map(([label, value, emoji]) => (
            <article
              className="rounded-xl border border-white/[0.07] bg-white/[0.03] px-3.5 py-3"
              key={label}
            >
              <span className="mb-1.5 block text-lg">{emoji}</span>
              <p className="mb-1 text-[11px] font-semibold text-[#7a8ba8]">{label}</p>
              <strong className="text-[13px]">{value}</strong>
            </article>
          ))}
        </div>
      </SurfaceCard>
    </PageContainer>
  );
}
