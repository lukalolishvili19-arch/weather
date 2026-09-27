import { Edit2, Heart, LogOut, MapPin, Star } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "@/features/auth";
import { cn } from "@/shared/lib/cn";

import { useI18n } from "../../hooks/use-i18n";
import { useProfileStats } from "../../hooks/use-profile-stats";
import {
  languageDisplayName,
  themeDisplayName,
  temperaturePreferenceLabel,
  windPreferenceLabel,
} from "../../lib/units";
import { usePreferences } from "../../model/preferences-context";
import { PageContainer } from "../components/app-shell";
import {
  ActionButton,
  Badge,
  PageHeader,
  ProgressBar,
  SectionLabel,
  SurfaceCard,
} from "../components/primitives";

export function ProfilePage() {
  const { user, logout, updateProfile } = useAuth();
  const navigate = useNavigate();
  const { settings } = usePreferences();
  const { t, language, locale } = useI18n();
  const { stats, cityHistory, maxVisits, badges, isLoading } = useProfileStats();
  const [editing, setEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function saveName() {
    setSaving(true);
    setSaveError(null);
    try {
      const trimmed = nameDraft.trim();
      await updateProfile({ name: trimmed ? trimmed : null });
      setEditing(false);
    } catch {
      setSaveError(t("profile.saveFailed"));
    } finally {
      setSaving(false);
    }
  }

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString(locale, {
        month: "short",
        year: "numeric",
      })
    : "—";

  const temperatureUnit = settings?.temperatureUnit ?? "CELSIUS";
  const windSpeedUnit = settings?.windSpeedUnit ?? "KMH";
  const theme = settings?.theme ?? "DARK";
  const timeFormat = settings?.timeFormat24h ?? true;

  return (
    <PageContainer>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-3">
        <PageHeader title={t("profile.title")} subtitle={t("profile.subtitle")} />
        <div className="flex flex-wrap gap-2">
          <ActionButton
            icon={<Edit2 size={14} />}
            disabled={editing}
            onClick={() => {
              setNameDraft(user?.name ?? "");
              setSaveError(null);
              setEditing(true);
            }}
          >
            {t("profile.editProfile")}
          </ActionButton>
          <ActionButton
            variant="danger"
            icon={<LogOut size={14} />}
            onClick={() => {
              void logout().then(() => navigate("/", { replace: true }));
            }}
          >
            {t("common.signOut")}
          </ActionButton>
        </div>
      </div>
      <SurfaceCard className="mb-5 px-7 py-6">
        <div className="flex flex-wrap items-center gap-5">
          <span className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-[20px] border-2 border-[#f7921e]/30 bg-gradient-to-br from-secondary to-muted text-4xl">
            {user?.avatarUrl ? (
              <img alt="" className="h-full w-full object-cover" src={user.avatarUrl} />
            ) : (
              "👤"
            )}
          </span>
          <div className="flex-1">
            {editing ? (
              <form
                className="mb-2 flex flex-wrap items-center gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  void saveName();
                }}
              >
                <input
                  aria-label={t("profile.nameLabel")}
                  placeholder={t("profile.nameLabel")}
                  value={nameDraft}
                  maxLength={100}
                  autoFocus
                  onChange={(event) => setNameDraft(event.target.value)}
                  className="min-w-[200px] flex-1 rounded-xl border border-border bg-secondary/40 px-3.5 py-2 text-[15px] font-bold text-foreground outline-none focus:border-[#f7921e]/40"
                />
                <ActionButton type="submit" variant="primary" disabled={saving}>
                  {saving ? t("common.saving") : t("common.save")}
                </ActionButton>
                <ActionButton disabled={saving} onClick={() => setEditing(false)}>
                  {t("common.cancel")}
                </ActionButton>
                {saveError && <p className="w-full text-sm text-red-400">{saveError}</p>}
              </form>
            ) : (
              <h2 className="mb-1 text-[22px] font-black tracking-[-0.5px] text-foreground">
                {user?.name || t("profile.user")}
              </h2>
            )}
            <div className="mb-2 flex flex-wrap gap-2">
              <Badge variant="orange">⭐ {t("profile.member")}</Badge>
              <Badge variant="blue">{user?.email}</Badge>
              <Badge variant="green">✓ {t("profile.verified")}</Badge>
            </div>
            <p className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
              <MapPin size={13} />
              {t("profile.memberSince", { date: memberSince })}
            </p>
          </div>
          <div className="text-right">
            <p className="mb-1 text-[11px] font-semibold text-muted-foreground">
              {t("profile.accountId")}
            </p>
            <strong className="text-sm text-foreground">{user?.id.slice(0, 10)}…</strong>
          </div>
        </div>
      </SurfaceCard>
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map(({ label, value, emoji }) => (
          <SurfaceCard className="px-4 py-[18px] text-center" key={label}>
            <span className="mb-2 block text-[28px]">{emoji}</span>
            <strong className="mb-1 block text-[28px] font-black tracking-[-1px] text-foreground">
              {isLoading ? "…" : value}
            </strong>
            <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-muted-foreground">
              {label}
            </span>
          </SurfaceCard>
        ))}
      </div>
      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SurfaceCard>
          <SectionLabel>{t("profile.cityHistory")}</SectionLabel>
          {cityHistory.length === 0 ? (
            <p className="py-6 text-center text-[13px] text-muted-foreground">
              {isLoading
                ? t("common.loading")
                : t("profile.noCities")}
            </p>
          ) : (
            cityHistory.map((city, index) => (
              <div
                className="flex items-center gap-3 border-b border-border py-2.5"
                key={city.key}
              >
                <span className="text-[22px]">{city.flag}</span>
                <div className="flex-1">
                  <p className="text-[13px] font-bold text-foreground">
                    {city.name}
                    {city.country !== "—" ? `, ${city.country}` : ""}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {t("profile.last", { date: city.lastLabel })}
                  </p>
                </div>
                <ProgressBar
                  value={city.visits}
                  max={maxVisits}
                  className="h-1 w-[60px]"
                />
                <span className="w-7 text-right text-xs font-bold text-muted-foreground">
                  {city.visits}
                </span>
                {index === 0 && <Star size={14} color="#f7921e" fill="#f7921e" />}
              </div>
            ))
          )}
          <Link to="/favorites" className="mt-3.5 block">
            <ActionButton className="w-full justify-center" icon={<Heart size={14} />}>
              {t("profile.manageFavorites")}
            </ActionButton>
          </Link>
        </SurfaceCard>
        <SurfaceCard>
          <SectionLabel>{t("profile.badgesEarned")}</SectionLabel>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {badges.map((badge) => (
              <article
                className={cn(
                  "rounded-[14px] border border-border bg-secondary/40 px-2.5 py-3.5 text-center",
                  !badge.earned && "opacity-40",
                )}
                key={badge.label}
              >
                <span className="mb-1.5 block text-[28px]">{badge.emoji}</span>
                <p className="mb-0.5 text-xs font-bold text-foreground">{badge.label}</p>
                <p className="text-[10px] leading-snug text-muted-foreground">{badge.detail}</p>
              </article>
            ))}
          </div>
        </SurfaceCard>
      </div>
      <SurfaceCard>
        <div className="mb-4 flex justify-between">
          <SectionLabel className="mb-0">{t("profile.quickPreferences")}</SectionLabel>
          <Link to="/settings">
            <ActionButton>{t("profile.openSettings")}</ActionButton>
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            [
              t("profile.temperature"),
              `${temperaturePreferenceLabel(temperatureUnit)} (${
                temperatureUnit === "FAHRENHEIT" ? t("settings.fahrenheit") : t("settings.celsius")
              })`,
              "🌡️",
            ],
            [t("profile.windSpeed"), windPreferenceLabel(windSpeedUnit), "💨"],
            [t("common.pressure"), "hPa", "📊"],
            [t("profile.language"), languageDisplayName(language), "🌐"],
            [t("profile.theme"), themeDisplayName(theme, language), "🌙"],
            [t("profile.notifFreq"), t("profile.realtime"), "🔔"],
            [t("profile.timeFormat"), timeFormat ? "24h" : "12h", "🕐"],
            [t("profile.dataSource"), "Open-Meteo + IQAir", "📡"],
          ].map(([label, value, emoji]) => (
            <article
              className="rounded-xl border border-border bg-secondary/40 px-3.5 py-3"
              key={label}
            >
              <span className="mb-1.5 block text-lg">{emoji}</span>
              <p className="mb-1 text-[11px] font-semibold text-muted-foreground">{label}</p>
              <strong className="text-[13px] text-foreground">{value}</strong>
            </article>
          ))}
        </div>
      </SurfaceCard>
    </PageContainer>
  );
}
