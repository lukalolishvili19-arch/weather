import {
  ArrowDown,
  ArrowUp,
  Cloud,
  CloudRain,
  Droplets,
  Eye,
  Gauge,
  MapPin,
  Navigation,
  Search,
  Sun,
  Thermometer,
  ThermometerSun,
  Wind,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useLocation as useRouterLocation } from "react-router-dom";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useAirQuality } from "../../hooks/use-air-quality";
import { useDashboardWeather } from "../../hooks/use-dashboard-weather";
import { useDisplayUnits } from "../../hooks/use-display-units";
import { useI18n } from "../../hooks/use-i18n";
import { searchApi } from "../../api/search-api";
import {
  getStoredWeatherLocation,
  setStoredWeatherLocation,
  subscribeWeatherLocation,
} from "../../lib/location-storage";
import {
  cloudCoverLabel,
  dayProgress,
  degreesToCompass,
  distanceUnitLabel,
  formatClock,
  formatDayLength,
  formatForecastDay,
  formatLocalDateTime,
  formatNumber,
  goldenHourWindow,
  humidityLabel,
  precipLabel,
  precipUnitLabel,
  pressureLabel,
  uvLabel,
  visibilityLabel,
  weatherIconToEmoji,
} from "../../lib/weather-format";

import { PageContainer } from "../components/app-shell";
import { ForecastTabs } from "../components/forecast-tabs";
import { ProgressBar, SectionLabel, StatCard, SurfaceCard } from "../components/primitives";
import { AqiGauge, ChartTooltip, SunriseArc } from "../components/weather-visuals";
import { getApiErrorMessage } from "@/shared/lib/get-api-error-message";
import { PageSkeleton } from "@/shared/ui/skeleton";

function getErrorMessage(error: unknown) {
  return getApiErrorMessage(error, "Unable to load weather data.");
}

function DashboardTopbar({
  locationInput,
  onLocationInputChange,
  onSubmitLocation,
  onUseMyLocation,
  locating,
}: {
  locationInput: string;
  onLocationInputChange: (value: string) => void;
  onSubmitLocation: (event: FormEvent) => void;
  onUseMyLocation: () => void;
  locating: boolean;
}) {
  const { t } = useI18n();
  return (
    <nav className="mb-7 flex items-center justify-between gap-4">
      <div className="flex shrink-0 items-center gap-2.5">
        <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-gradient-to-br from-[#c44404] to-[#f7921e] shadow-[0_0_16px_rgba(247,146,30,0.35)]">
          <Sun size={18} color="white" />
        </span>
        <strong className="text-lg font-extrabold tracking-[-0.5px]">SkyCast</strong>
      </div>
      <form className="relative hidden w-full max-w-[340px] sm:block" onSubmit={onSubmitLocation}>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7a8ba8]" size={14} />
        <input
          value={locationInput}
          onChange={(event) => onLocationInputChange(event.target.value)}
          placeholder={t("common.searchCity")}
          className="w-full rounded-xl border border-white/[0.07] bg-white/5 py-2.5 pl-9 pr-3.5 text-[13px] text-[#e8edf8] outline-none placeholder:text-[#7a8ba8] focus:border-[#f7921e]/40"
        />
      </form>
      <button
        type="button"
        onClick={onUseMyLocation}
        disabled={locating}
        className="flex shrink-0 items-center gap-2 rounded-xl border border-[#f7921e]/20 bg-[#f7921e]/10 px-4 py-2.5 text-[13px] font-semibold text-[#f7921e] disabled:opacity-60"
      >
        <Navigation size={14} />
        <span className="hidden sm:inline">
          {locating ? t("common.locating") : t("common.myLocation")}
        </span>
      </button>
    </nav>
  );
}

function CurrentWeatherHero({
  resolvedAddress,
  datetimeLabel,
  temperature,
  unit,
  conditions,
  icon,
  feelsLike,
  showFeelsLike,
  high,
  low,
  windSpeed,
  windDir,
  speedUnit,
  humidity,
  visibility,
  distanceUnit,
  uvIndex,
  uvDetail,
}: {
  resolvedAddress: string;
  datetimeLabel: string;
  temperature: string;
  unit: string;
  conditions: string;
  icon: string;
  feelsLike: string;
  showFeelsLike: boolean;
  high: string;
  low: string;
  windSpeed: string;
  windDir: string;
  speedUnit: string;
  humidity: string;
  visibility: string;
  distanceUnit: string;
  uvIndex: string;
  uvDetail: string;
}) {
  const { t } = useI18n();
  return (
    <section className="relative min-h-[260px] overflow-hidden rounded-3xl bg-gradient-to-br from-[#b83d00] via-[#f0871b] to-[#ffc06a] px-9 py-8">
      <div className="absolute -right-16 -top-16 h-[220px] w-[220px] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.15),transparent_65%)]" />
      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <div>
            <p className="flex items-center gap-1.5 text-[15px] font-bold text-white/90">
              <MapPin size={13} /> {resolvedAddress}
            </p>
            <p className="mt-1 text-xs font-medium text-white/55">{datetimeLabel}</p>
          </div>
          <span className="text-[56px] drop-shadow-xl">{icon}</span>
        </div>
        <div className="mt-5 flex items-end gap-7">
          <div>
            <div className="flex items-start leading-none">
              <strong className="text-[88px] font-black leading-[0.9] tracking-[-6px] text-white">
                {temperature}
              </strong>
              <span className="mt-3 text-[28px] font-light text-white/85">{unit}</span>
            </div>
            <p className="mt-1.5 text-lg font-bold text-white/90">{conditions}</p>
          </div>
          <div className="mb-1 flex flex-col gap-2 text-[13px] font-medium text-white/80">
            {showFeelsLike && (
              <span className="flex items-center gap-2">
                <Thermometer size={13} /> {t("dashboard.feelsLike")} {feelsLike}
                {unit}
              </span>
            )}
            <span className="flex gap-4">
              <span className="flex items-center gap-1">
                <ArrowUp size={12} />
                {high}°
              </span>
              <span className="flex items-center gap-1">
                <ArrowDown size={12} />
                {low}°
              </span>
            </span>
            <span className="flex items-center gap-2">
              <Wind size={13} />
              {windSpeed} {speedUnit} {windDir}
            </span>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2.5">
          {[
            `${t("dashboard.humidity")}: ${humidity}%`,
            `${t("dashboard.visibility")}: ${visibility} ${distanceUnit}`,
            `${t("dashboard.uvIndex")}: ${uvIndex} — ${uvDetail}`,
          ].map((item) => (
            <span
              key={item}
              className="rounded-full bg-white/15 px-3.5 py-1.5 text-xs font-semibold text-white/90 backdrop-blur"
            >
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

export function DashboardPage() {
  const routerLocation = useRouterLocation();
  const [location, setLocation] = useState(getStoredWeatherLocation);
  const [locationInput, setLocationInput] = useState(location);
  const [locating, setLocating] = useState(false);
  const weather = useDashboardWeather(location);
  const airQuality = useAirQuality(location);
  const { t, language } = useI18n();
  const {
    tempUnit: unit,
    speedUnit,
    formatTemp,
    formatSpeed,
    toTemp,
    hour12,
    showFeelsLike,
    animateCharts,
    locale: dateLocale,
  } = useDisplayUnits(weather.units);

  useEffect(() => {
    const stored = getStoredWeatherLocation();
    setLocation(stored);
    setLocationInput(stored);
  }, [routerLocation.key, routerLocation.pathname]);

  useEffect(() => subscribeWeatherLocation((next) => {
    setLocation(next);
    setLocationInput(next);
  }), []);

  useEffect(() => {
    setLocationInput(location);
  }, [location]);

  useEffect(() => {
    const resolved = weather.locationMeta?.resolvedAddress?.trim();
    if (!resolved || weather.isLoading) return;

    const looksLikeCoordinates = /^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/.test(location.trim());
    if (looksLikeCoordinates || locationInput.trim() === location.trim()) {
      setLocationInput(resolved);
    }
    if (looksLikeCoordinates && resolved !== location) {
      setStoredWeatherLocation(resolved);
      setLocation(resolved);
    }
  }, [weather.locationMeta?.resolvedAddress, weather.isLoading, location, locationInput]);

  const distanceUnit = distanceUnitLabel(weather.units);
  const precipUnit = precipUnitLabel(weather.units);
  const current = weather.current;
  const today = weather.today;

  const sunrise = today?.sunrise ?? null;
  const sunset = today?.sunset ?? null;
  const sunriseClock = formatClock(sunrise, hour12);
  const sunsetClock = formatClock(sunset, hour12);
  const progress = dayProgress(sunrise, sunset);

  const forecast = useMemo(
    () =>
      weather.days.slice(0, 7).map((day, index) => {
        const labels = formatForecastDay(
          day.datetime,
          index,
          weather.locationMeta?.timezone ?? null,
          dateLocale,
          t("common.today"),
        );
        return {
          ...labels,
          high: Math.round(toTemp(day.temperatureMax ?? day.temperature) ?? 0),
          low: Math.round(toTemp(day.temperatureMin ?? day.temperature) ?? 0),
          condition: day.conditions ?? "—",
          emoji: weatherIconToEmoji(day.icon),
          rain: Math.round(day.precipProbability ?? 0),
        };
      }),
    [weather.days, weather.locationMeta?.timezone, dateLocale, t, toTemp],
  );

  const weeklyTemperature = forecast.map(({ day, high, low }) => ({ day, high, low }));
  const peakRain = [...forecast].sort((a, b) => b.rain - a.rain)[0];
  const driest = [...forecast].sort((a, b) => a.rain - b.rain)[0];
  const chartDomain = useMemo(() => {
    if (!weeklyTemperature.length) return [0, 40] as [number, number];
    const values = weeklyTemperature.flatMap((item) => [item.high, item.low]);
    const min = Math.min(...values);
    const max = Math.max(...values);
    return [Math.floor(min - 2), Math.ceil(max + 2)] as [number, number];
  }, [weeklyTemperature]);

  const metrics = [
    {
      icon: <Thermometer size={16} />,
      label: t("dashboard.temperature"),
      value: `${formatTemp(current?.temperature, 0)}${unit}`,
      detail: current?.conditions ?? t("dashboard.liveReading"),
      color: "#f7921e",
    },
    ...(showFeelsLike
      ? [
          {
            icon: <ThermometerSun size={16} />,
            label: t("dashboard.feelsLike"),
            value: `${formatTemp(current?.feelsLike, 0)}${unit}`,
            detail: t("dashboard.apparentTemp"),
            color: "#ffc06a",
          },
        ]
      : []),
    {
      icon: <Droplets size={16} />,
      label: t("dashboard.humidity"),
      value: `${formatNumber(current?.humidity, 0)}%`,
      detail: humidityLabel(current?.humidity, language),
      color: "#4a9eff",
    },
    {
      icon: <Gauge size={16} />,
      label: t("dashboard.pressure"),
      value: `${formatNumber(current?.pressure, 0)} hPa`,
      detail: pressureLabel(current?.pressure, language),
      color: "#7a8ba8",
    },
    {
      icon: <Wind size={16} />,
      label: t("dashboard.wind"),
      value: `${formatSpeed(current?.windSpeed, 0)} ${speedUnit}`,
      detail: `${degreesToCompass(current?.windDirection)} ${t("dashboard.direction")}`,
      color: "#a3e635",
    },
    {
      icon: <Eye size={16} />,
      label: t("dashboard.visibility"),
      value: `${formatNumber(current?.visibility, 1)} ${distanceUnit}`,
      detail: visibilityLabel(current?.visibility, language),
      color: "#4a9eff",
    },
    {
      icon: <Zap size={16} />,
      label: t("dashboard.uvIndex"),
      value: formatNumber(current?.uvIndex, 0),
      detail: uvLabel(current?.uvIndex, language),
      color: "#f7921e",
    },
    {
      icon: <Cloud size={16} />,
      label: t("dashboard.cloudCover"),
      value: `${formatNumber(current?.cloudCover, 0)}%`,
      detail: cloudCoverLabel(current?.cloudCover, language),
      color: "#94a3b8",
    },
    {
      icon: <CloudRain size={16} />,
      label: t("dashboard.precipitation"),
      value: `${formatNumber(current?.precip ?? today?.precip, 1)} ${precipUnit}`,
      detail: precipLabel(current?.precip ?? today?.precip, language),
      color: "#4a9eff",
    },
  ];

  const applyLocation = (next: string) => {
    const trimmed = next.trim();
    if (!trimmed) return;
    setStoredWeatherLocation(trimmed);
    setLocation(trimmed);
  };

  const onSubmitLocation = (event: FormEvent) => {
    event.preventDefault();
    applyLocation(locationInput);
  };

  const onUseMyLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        void (async () => {
          try {
            const resolved = await searchApi.resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
            const next =
              resolved.label ||
              resolved.name ||
              `${position.coords.latitude.toFixed(4)},${position.coords.longitude.toFixed(4)}`;
            applyLocation(next);
          } catch {
            applyLocation(
              `${position.coords.latitude.toFixed(4)},${position.coords.longitude.toFixed(4)}`,
            );
          } finally {
            setLocating(false);
          }
        })();
      },
      () => {
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  };

  if (weather.isLoading && !current) {
    return (
      <PageContainer>
        <DashboardTopbar
          locationInput={locationInput}
          onLocationInputChange={setLocationInput}
          onSubmitLocation={onSubmitLocation}
          onUseMyLocation={onUseMyLocation}
          locating={locating}
        />
        <PageSkeleton cards={4} />
      </PageContainer>
    );
  }

  if (weather.isError && !current) {
    return (
      <PageContainer>
        <DashboardTopbar
          locationInput={locationInput}
          onLocationInputChange={setLocationInput}
          onSubmitLocation={onSubmitLocation}
          onUseMyLocation={onUseMyLocation}
          locating={locating}
        />
        <SurfaceCard>
          <p className="mb-3 text-sm text-red-400">{getErrorMessage(weather.error)}</p>
          <button
            type="button"
            className="rounded-xl border border-white/[0.07] bg-white/5 px-4 py-2 text-sm font-semibold"
            onClick={() => {
              void weather.refetch();
            }}
          >
            {t("common.retry")}
          </button>
        </SurfaceCard>
      </PageContainer>
    );
  }

  const resolvedAddress = weather.locationMeta?.resolvedAddress ?? location;
  const datetimeLabel = formatLocalDateTime(
    current?.datetimeEpoch,
    weather.locationMeta?.timezone,
    dateLocale,
    hour12,
  );

  return (
    <PageContainer>
      <DashboardTopbar
        locationInput={locationInput}
        onLocationInputChange={setLocationInput}
        onSubmitLocation={onSubmitLocation}
        onUseMyLocation={onUseMyLocation}
        locating={locating}
      />
      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-[3fr_2fr]">
        <CurrentWeatherHero
          resolvedAddress={resolvedAddress}
          datetimeLabel={datetimeLabel}
          temperature={formatTemp(current?.temperature, 0)}
          unit={unit}
          conditions={current?.conditions ?? "—"}
          icon={weatherIconToEmoji(current?.icon)}
          feelsLike={formatTemp(current?.feelsLike, 0)}
          showFeelsLike={showFeelsLike}
          high={formatTemp(today?.temperatureMax, 0)}
          low={formatTemp(today?.temperatureMin, 0)}
          windSpeed={formatSpeed(current?.windSpeed, 0)}
          windDir={degreesToCompass(current?.windDirection)}
          speedUnit={speedUnit}
          humidity={formatNumber(current?.humidity, 0)}
          visibility={formatNumber(current?.visibility, 1)}
          distanceUnit={distanceUnit}
          uvIndex={formatNumber(current?.uvIndex, 0)}
          uvDetail={uvLabel(current?.uvIndex, language)}
        />
        <SurfaceCard>
          <SectionLabel>{t("dashboard.sunriseSunset")}</SectionLabel>
          <SunriseArc progress={progress} />
          <div className="mt-3 flex justify-between px-1 text-center">
            {[
              [
                t("dashboard.sunrise"),
                sunriseClock.time,
                sunriseClock.period || (hour12 ? "AM" : ""),
              ],
              [t("dashboard.dayLength"), formatDayLength(sunrise, sunset), t("dashboard.duration")],
              [
                t("dashboard.sunset"),
                sunsetClock.time,
                sunsetClock.period || (hour12 ? "PM" : ""),
              ],
            ].map(([label, value, detail], index) => (
              <div key={label}>
                <p className="mb-1 text-[11px] font-semibold text-[#7a8ba8]">{label}</p>
                <strong className={index === 1 ? "text-xl text-white" : "text-xl text-[#f7921e]"}>
                  {value}
                </strong>
                {detail ? (
                  <p className="mt-0.5 text-[10px] text-[#7a8ba8]">{detail}</p>
                ) : null}
              </div>
            ))}
          </div>
          <div className="mt-[18px] flex justify-between border-t border-white/[0.07] pt-4 text-[13px] font-bold">
            <div>
              <p className="mb-1 text-[11px] text-[#7a8ba8]">{t("dashboard.goldenHour")}</p>
              <span className="text-[#f7921e]">{goldenHourWindow(sunset, hour12)}</span>
            </div>
            <div className="text-right">
              <p className="mb-1 text-[11px] text-[#7a8ba8]">{t("dashboard.uvPeak")}</p>
              <span className="text-[#a3e635]">
                {t("dashboard.uvToday", {
                  value: formatNumber(today?.uvIndex ?? current?.uvIndex, 0),
                })}
              </span>
            </div>
          </div>
        </SurfaceCard>
      </div>

      <ForecastTabs location={location} />

      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-[3fr_2fr]">
        <SurfaceCard>
          <div className="mb-5 flex justify-between">
            <SectionLabel className="mb-0">{t("dashboard.weeklyTemperature")}</SectionLabel>
            <div className="flex gap-4 text-xs text-[#7a8ba8]">
              <span className="text-[#f7921e]">— {t("common.high")}</span>
              <span className="text-[#4a9eff]">— {t("common.low")}</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={190}>
            <AreaChart
              data={weeklyTemperature}
              margin={{ top: 10, right: 6, bottom: 0, left: -20 }}
            >
              <defs>
                <linearGradient id="dashboardHigh" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f7921e" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="#f7921e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="dashboardLow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4a9eff" stopOpacity={0.22} />
                  <stop offset="100%" stopColor="#4a9eff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.04)"
                vertical={false}
              />
              <XAxis
                dataKey="day"
                tick={{ fill: "#7a8ba8", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#7a8ba8", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                domain={chartDomain}
                unit="°"
              />
              <Tooltip content={<ChartTooltip />} />
              <Area
                type="monotone"
                dataKey="high"
                stroke="#f7921e"
                strokeWidth={2.5}
                fill="url(#dashboardHigh)"
                isAnimationActive={animateCharts}
                animationDuration={animateCharts ? 800 : 0}
              />
              <Area
                type="monotone"
                dataKey="low"
                stroke="#4a9eff"
                strokeWidth={2}
                fill="url(#dashboardLow)"
                isAnimationActive={animateCharts}
                animationDuration={animateCharts ? 800 : 0}
              />
            </AreaChart>
          </ResponsiveContainer>
        </SurfaceCard>
        <SurfaceCard>
          <SectionLabel>{t("dashboard.rainProbability")}</SectionLabel>
          <div className="flex flex-col gap-3.5">
            {forecast.map((day) => (
              <div className="flex items-center gap-3" key={`${day.day}-rain`}>
                <span className="w-[38px] shrink-0 text-xs font-semibold text-[#7a8ba8]">
                  {day.day}
                </span>
                <ProgressBar value={day.rain} color="#4a9eff" className="h-1.5 flex-1" />
                <span className="w-[34px] text-right text-xs font-bold text-white/45">
                  {day.rain}%
                </span>
              </div>
            ))}
          </div>
          <div className="mt-5 flex justify-between border-t border-white/[0.07] pt-4 text-sm font-bold">
            <div>
              <p className="mb-1 text-[11px] text-[#7a8ba8]">{t("dashboard.peakRainDay")}</p>
              <span className="text-[#4a9eff]">
                {peakRain ? `${peakRain.day} · ${peakRain.rain}%` : "—"}
              </span>
            </div>
            <div className="text-right">
              <p className="mb-1 text-[11px] text-[#7a8ba8]">{t("dashboard.driest")}</p>
              <span className="text-[#22c55e]">
                {driest ? `${driest.day} · ${driest.rain}%` : "—"}
              </span>
            </div>
          </div>
        </SurfaceCard>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-9">
        {metrics.map((metric) => (
          <StatCard key={metric.label} {...metric} />
        ))}
      </div>

      <SurfaceCard>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <SectionLabel className="mb-0">
            {t("dashboard.airQuality")} — {resolvedAddress.split(",")[0]}
          </SectionLabel>
          <Link
            to="/air-quality"
            className="text-xs font-bold text-[#f7921e] hover:underline"
          >
            {t("dashboard.fullReport")}
          </Link>
        </div>
        {airQuality.isLoading && (
          <p className="mb-4 text-sm text-[#7a8ba8]">{t("dashboard.loadingAirQuality")}</p>
        )}
        {airQuality.isError && (
          <div className="mb-4 rounded-[12px] border border-red-500/20 bg-red-500/10 px-3 py-2.5">
            <p className="mb-2 text-sm text-red-300">{getErrorMessage(airQuality.error)}</p>
            <button
              type="button"
              className="text-xs font-bold text-[#e8edf8] underline"
              onClick={() => {
                void airQuality.refetch();
              }}
            >
              {t("common.retry")}
            </button>
          </div>
        )}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-[auto_1fr]">
          <div className="flex flex-col items-center justify-center">
            <AqiGauge
              value={airQuality.data?.aqi ?? null}
              label={airQuality.data?.category.level ?? "—"}
              color={airQuality.data?.category.color ?? "#7a8ba8"}
            />
            <p className="mt-2 max-w-48 text-center text-xs leading-5 text-white/40">
              {airQuality.data?.health.summary ??
                "Live AQI and pollutant readings for this location."}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {(airQuality.data?.pollutants ?? []).map((item) => (
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
                  {item.value == null
                    ? "—"
                    : formatNumber(item.value, item.unit === "mg/m³" || item.value < 10 ? 1 : 0)}
                </strong>
                <p className="mb-2.5 mt-0.5 text-[10px] text-white/30">{item.unit}</p>
                <ProgressBar
                  value={item.percent ?? 0}
                  color={item.color}
                  className="h-[3px]"
                />
              </div>
            ))}
            {!airQuality.isLoading && !airQuality.data?.pollutants?.length && (
              <p className="col-span-full text-sm text-[#7a8ba8]">No pollutant data yet.</p>
            )}
          </div>
        </div>
      </SurfaceCard>
      <footer className="mt-5 flex flex-wrap justify-between gap-2 text-[11px] font-medium text-white/20">
        <span>
          {t("dashboard.lastUpdated")}: {datetimeLabel}
          {weather.isFetching ? ` · ${t("dashboard.refreshing")}` : ""} · {t("dashboard.data")}: Visual Crossing
        </span>
        <span>
          {weather.locationMeta?.latitude != null && weather.locationMeta?.longitude != null
            ? `${weather.locationMeta.latitude.toFixed(4)}°N, ${weather.locationMeta.longitude.toFixed(4)}°E`
            : "—"}
          {weather.locationMeta?.timezone ? ` · ${weather.locationMeta.timezone}` : ""}
        </span>
      </footer>
    </PageContainer>
  );
}
