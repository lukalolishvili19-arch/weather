import { isAxiosError } from "axios";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  DoorOpen,
  HeartPulse,
  Leaf,
  VenetianMask,
  Wind,
} from "lucide-react";
import { Link } from "react-router-dom";

import { useAirQuality } from "../../hooks/use-air-quality";
import { useI18n } from "../../hooks/use-i18n";
import { getStoredWeatherLocation } from "../../lib/location-storage";
import { formatNumber } from "../../lib/weather-format";
import { PageContainer } from "../components/app-shell";
import {
  Badge,
  PageHeader,
  ProgressBar,
  SectionLabel,
  StatCard,
  SurfaceCard,
} from "../components/primitives";
import { AqiGauge } from "../components/weather-visuals";

function getErrorMessage(error: unknown, fallback: string) {
  if (isAxiosError(error)) {
    const message = (error.response?.data as { error?: { message?: string } } | undefined)?.error
      ?.message;
    if (message) return message;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

function formatPollutantValue(value: number | null, unit: string) {
  if (value === null) return "—";
  const digits = unit === "mg/m³" || value < 10 ? 1 : 0;
  return `${formatNumber(value, digits)}`;
}

export function AirQualityPage() {
  const { t } = useI18n();
  const location = getStoredWeatherLocation();
  const airQuality = useAirQuality(location);
  const data = airQuality.data;
  const health = data?.health;
  const city = data?.location.resolvedAddress?.split(",")[0] ?? location;

  return (
    <PageContainer>
      <PageHeader
        title={t("airQuality.title")}
        subtitle={t("airQuality.subtitle", { city })}
      />

      {airQuality.isLoading && (
        <SurfaceCard className="mb-4">
          <p className="text-sm text-[#7a8ba8]">{t("airQuality.loading")}</p>
        </SurfaceCard>
      )}

      {airQuality.isError && (
        <SurfaceCard className="mb-4 border-red-500/20 bg-red-500/10">
          <p className="mb-3 text-sm text-red-300">
            {getErrorMessage(airQuality.error, t("airQuality.loadError"))}
          </p>
          <button
            type="button"
            className="rounded-xl border border-white/[0.07] bg-white/5 px-4 py-2 text-sm font-semibold"
            onClick={() => {
              void airQuality.refetch();
            }}
          >
            {t("common.retry")}
          </button>
        </SurfaceCard>
      )}

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={<Leaf size={16} />}
          label={t("airQuality.usAqi")}
          value={data?.aqi == null ? "—" : formatNumber(data.aqi, 0)}
          detail={data?.category.level ?? t("airQuality.noData")}
          color={data?.category.color ?? "#7a8ba8"}
        />
        <StatCard
          icon={<Activity size={16} />}
          label={t("airQuality.europeanAqi")}
          value={data?.europeanAqi == null ? "—" : formatNumber(data.europeanAqi, 0)}
          detail={t("airQuality.openMeteoScale")}
          color="#4a9eff"
        />
        <StatCard
          icon={<Wind size={16} />}
          label={t("airQuality.outdoorActivity")}
          value={health?.outdoorActivity ?? "—"}
          detail={health?.maskSuggested ? t("airQuality.maskSuggested") : t("airQuality.noMask")}
          color={data?.category.color ?? "#7a8ba8"}
        />
        <StatCard
          icon={<HeartPulse size={16} />}
          label={t("airQuality.sensitiveGroups")}
          value={health?.sensitiveGroups ?? "—"}
          detail={health?.windows ?? t("airQuality.windowGuidance")}
          color="#f7921e"
        />
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-[auto_1fr]">
        <SurfaceCard className="flex flex-col items-center justify-center">
          <SectionLabel>{t("airQuality.index")}</SectionLabel>
          <AqiGauge
            value={data?.aqi ?? null}
            label={data?.category.level ?? "—"}
            color={data?.category.color ?? "#7a8ba8"}
          />
          <p className="mt-3 max-w-56 text-center text-xs leading-5 text-[#7a8ba8]">
            {data?.category.description ?? t("airQuality.selectLocation")}
          </p>
          {data?.observedAt && (
            <p className="mt-2 text-[11px] text-white/30">
              {t("airQuality.observed", { date: data.observedAt })}
            </p>
          )}
        </SurfaceCard>

        <SurfaceCard>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <SectionLabel className="mb-0">{t("airQuality.pollutants")}</SectionLabel>
            <Badge variant="muted">PM2.5 · PM10 · CO · NO₂ · O₃ · SO₂</Badge>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {(data?.pollutants ?? []).map((item) => (
              <div
                className="rounded-[14px] border border-white/[0.07] bg-white/[0.03] px-4 py-3.5"
                key={item.id}
              >
                <div className="mb-2 flex justify-between text-xs font-bold">
                  <span className="text-[#7a8ba8]">{item.label}</span>
                  <span style={{ color: item.color }}>
                    {item.percent == null ? "—" : `${item.percent}%`}
                  </span>
                </div>
                <strong className="text-xl font-extrabold text-white">
                  {formatPollutantValue(item.value, item.unit)}
                </strong>
                <p className="mb-1 mt-0.5 text-[10px] text-white/30">{item.unit}</p>
                <p className="mb-2.5 text-[10px] leading-4 text-[#7a8ba8]">{item.description}</p>
                <ProgressBar
                  value={item.percent ?? 0}
                  color={item.color}
                  className="h-[3px]"
                />
              </div>
            ))}
            {!airQuality.isLoading && !data?.pollutants?.length && (
              <p className="col-span-full text-sm text-[#7a8ba8]">{t("airQuality.noPollutants")}</p>
            )}
          </div>
        </SurfaceCard>
      </div>

      <SurfaceCard className="mb-4">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <SectionLabel className="mb-0">{t("airQuality.healthRecs")}</SectionLabel>
          {health && (
            <Badge
              variant={
                health.level === "Good"
                  ? "green"
                  : health.level === "Moderate"
                    ? "amber"
                    : health.level.includes("Unhealthy") || health.level === "Hazardous"
                      ? "red"
                      : "orange"
              }
            >
              {health.level}
            </Badge>
          )}
        </div>

        <p className="mb-5 max-w-3xl text-sm leading-6 text-[#e8edf8]/90">
          {health?.summary ?? t("airQuality.healthPlaceholder")}
        </p>

        <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-[14px] border border-white/[0.07] bg-white/[0.03] px-4 py-3">
            <div className="mb-2 flex items-center gap-2 text-[#7a8ba8]">
              <Activity size={14} />
              <span className="text-[11px] font-bold uppercase tracking-[0.08em]">
                {t("airQuality.outdoor")}
              </span>
            </div>
            <p className="text-sm font-bold text-[#e8edf8]">{health?.outdoorActivity ?? "—"}</p>
          </div>
          <div className="rounded-[14px] border border-white/[0.07] bg-white/[0.03] px-4 py-3">
            <div className="mb-2 flex items-center gap-2 text-[#7a8ba8]">
              <DoorOpen size={14} />
              <span className="text-[11px] font-bold uppercase tracking-[0.08em]">
                {t("airQuality.windows")}
              </span>
            </div>
            <p className="text-sm font-bold text-[#e8edf8]">{health?.windows ?? "—"}</p>
          </div>
          <div className="rounded-[14px] border border-white/[0.07] bg-white/[0.03] px-4 py-3">
            <div className="mb-2 flex items-center gap-2 text-[#7a8ba8]">
              {health?.maskSuggested ? <VenetianMask size={14} /> : <CheckCircle2 size={14} />}
              <span className="text-[11px] font-bold uppercase tracking-[0.08em]">
                {t("airQuality.mask")}
              </span>
            </div>
            <p className="text-sm font-bold text-[#e8edf8]">
              {health
                ? health.maskSuggested
                  ? t("airQuality.maskSuggestedOutdoors")
                  : t("airQuality.maskNotRequired")
                : "—"}
            </p>
          </div>
        </div>

        <ul className="space-y-2.5">
          {(health?.tips ?? []).map((tip) => (
            <li
              key={tip}
              className="flex gap-2.5 rounded-[12px] border border-white/[0.05] bg-white/[0.02] px-3.5 py-2.5 text-sm text-[#e8edf8]/85"
            >
              <AlertTriangle
                size={14}
                className="mt-0.5 shrink-0"
                style={{ color: health?.color ?? "#f7921e" }}
              />
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </SurfaceCard>

      <p className="text-[11px] text-white/25">
        {t("airQuality.dataSource")}{" "}
        <Link to="/" className="text-[#f7921e]/80 hover:text-[#f7921e]">
          {t("airQuality.backToDashboard")}
        </Link>
      </p>
    </PageContainer>
  );
}
