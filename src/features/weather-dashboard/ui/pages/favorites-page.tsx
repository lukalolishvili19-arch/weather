import { useQueries } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { ArrowRight, Heart, Pin, Plus, X } from "lucide-react";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { CITIES } from "@/figma/data";

import { weatherApi } from "../../api/weather-api";
import type { Favorite } from "../../api/favorites.types";
import {
  favoriteWeatherQuery,
  useFavoriteActions,
  useFavorites,
} from "../../hooks/use-favorites";
import { setStoredWeatherLocation } from "../../lib/location-storage";
import { formatNumber, weatherIconToEmoji } from "../../lib/weather-format";
import { useDisplayUnits } from "../../hooks/use-display-units";
import { useI18n } from "../../hooks/use-i18n";
import { PageContainer } from "../components/app-shell";
import {
  ActionButton,
  Badge,
  PageHeader,
  SectionLabel,
  SurfaceCard,
} from "../components/primitives";

function getErrorMessage(error: unknown) {
  if (isAxiosError(error)) {
    const message = (error.response?.data as { error?: { message?: string } } | undefined)?.error
      ?.message;
    if (message) return message;
  }
  if (error instanceof Error) return error.message;
  return "Unable to update favorites.";
}

function FavoriteCard({
  favorite,
  weather,
  onOpen,
  onPin,
  onRemove,
}: {
  favorite: Favorite;
  weather?: {
    temperature: number | null;
    conditions: string | null;
    icon: string | null;
    humidity: number | null;
    uvIndex: number | null;
    windSpeed: number | null;
    temperatureMax: number | null;
    temperatureMin: number | null;
    units: string;
  } | null;
  onOpen: () => void;
  onPin: () => void;
  onRemove: () => void;
}) {
  const { t } = useI18n();
  const { tempUnit: unit, formatTemp } = useDisplayUnits(weather?.units);
  const temp = formatTemp(weather?.temperature, 0);

  return (
    <SurfaceCard className="relative overflow-hidden">
      <div className="pointer-events-none absolute right-0 top-0 h-[120px] w-[120px] bg-[radial-gradient(circle_at_80%_20%,rgba(247,146,30,0.08),transparent_70%)]" />
      <div className="mb-4 flex items-start justify-between">
        <button type="button" className="flex items-center gap-2.5 text-left" onClick={onOpen}>
          <span className="text-2xl">📍</span>
          <div>
            <p className="flex items-center gap-1.5 text-base font-extrabold">
              {favorite.locationName}
              {favorite.isPinned && <Pin size={12} className="rotate-45 text-[#f7921e]" />}
            </p>
            <p className="text-[11px] text-[#7a8ba8]">
              {favorite.country || t("favorites.savedLocation")}
              {favorite.latitude != null && favorite.longitude != null
                ? ` · ${favorite.latitude.toFixed(2)}, ${favorite.longitude.toFixed(2)}`
                : ""}
            </p>
          </div>
        </button>
        <div className="flex gap-1.5 text-[#7a8ba8]">
          <button
            type="button"
            aria-label={favorite.isPinned ? t("favorites.unpin") : t("favorites.pin")}
            className="grid h-7 w-7 place-items-center rounded-lg border border-white/[0.07] bg-white/[0.04] hover:border-[#f7921e]/40"
            onClick={onPin}
          >
            <Pin
              size={12}
              className={favorite.isPinned ? "rotate-45 text-[#f7921e]" : "rotate-45"}
            />
          </button>
          <button
            type="button"
            aria-label={t("favorites.remove")}
            className="grid h-7 w-7 place-items-center rounded-lg border border-white/[0.07] bg-white/[0.04] hover:border-red-500/40 hover:text-red-400"
            onClick={onRemove}
          >
            <X size={12} />
          </button>
        </div>
      </div>
      <button type="button" className="flex w-full items-end justify-between text-left" onClick={onOpen}>
        <div>
          <p className="flex items-start">
            <strong className="text-[52px] font-black leading-none tracking-[-2px]">{temp}</strong>
            <span className="mt-1 text-lg text-[#7a8ba8]">{unit}</span>
          </p>
          <p className="mt-1 text-[13px] text-[#7a8ba8]">
            {weather?.conditions ?? t("common.loading")}
          </p>
        </div>
        <div className="text-right">
          <span className="text-4xl">{weatherIconToEmoji(weather?.icon)}</span>
          <div className="mt-2 flex gap-2">
            <Badge variant="blue">💧 {formatNumber(weather?.humidity, 0)}%</Badge>
            <Badge variant="orange">UV {formatNumber(weather?.uvIndex, 0)}</Badge>
          </div>
        </div>
      </button>
      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/[0.07] pt-3.5 text-center">
        {[
          [t("common.high"), `${formatTemp(weather?.temperatureMax, 0)}°`, "#f7921e"],
          [t("common.low"), `${formatTemp(weather?.temperatureMin, 0)}°`, "#4a9eff"],
          [t("common.wind"), `${formatNumber(weather?.windSpeed, 0)}`, "#7a8ba8"],
        ].map(([label, value, color]) => (
          <div key={label}>
            <p className="mb-0.5 text-[10px] font-semibold text-[#7a8ba8]">{label}</p>
            <p className="text-sm font-extrabold" style={{ color }}>
              {value}
            </p>
          </div>
        ))}
      </div>
    </SurfaceCard>
  );
}

export function FavoritesPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const favoritesQuery = useFavorites();
  const { add, remove, pin } = useFavoriteActions();

  const favorites = favoritesQuery.data ?? [];
  const pinned = favorites.filter((item) => item.isPinned);
  const unpinned = favorites.filter((item) => !item.isPinned);
  const favoriteLocationIds = useMemo(
    () => new Set(favorites.map((item) => item.locationId)),
    [favorites],
  );

  const weatherQueries = useQueries({
    queries: favorites.map((favorite) => ({
      queryKey: ["weather", "favorite-card", favorite.id, favoriteWeatherQuery(favorite)],
      queryFn: async () => {
        const [current, daily] = await Promise.all([
          weatherApi.getCurrent(favoriteWeatherQuery(favorite)),
          weatherApi.getDaily(favoriteWeatherQuery(favorite), 1),
        ]);
        return {
          temperature: current.current?.temperature ?? null,
          conditions: current.current?.conditions ?? null,
          icon: current.current?.icon ?? null,
          humidity: current.current?.humidity ?? null,
          uvIndex: current.current?.uvIndex ?? null,
          windSpeed: current.current?.windSpeed ?? null,
          temperatureMax: daily.days[0]?.temperatureMax ?? null,
          temperatureMin: daily.days[0]?.temperatureMin ?? null,
          units: current.units,
        };
      },
      staleTime: 60_000,
      enabled: Boolean(favorite.id) && !favorite.id.startsWith("temp-"),
    })),
  });

  const weatherByFavoriteId = useMemo(() => {
    const map = new Map<string, (typeof weatherQueries)[number]["data"]>();
    favorites.forEach((favorite, index) => {
      map.set(favorite.id, weatherQueries[index]?.data);
    });
    return map;
  }, [favorites, weatherQueries]);

  const suggested = CITIES.filter((city) => !favoriteLocationIds.has(city.id));

  function parseCityCoord(value: string): number | undefined {
    const numeric = Number.parseFloat(value);
    if (!Number.isFinite(numeric)) return undefined;
    if (/[WwSs]/.test(value)) return -Math.abs(numeric);
    return numeric;
  }

  const openFavorite = (favorite: Favorite) => {
    setStoredWeatherLocation(favoriteWeatherQuery(favorite));
    navigate("/");
  };

  const actionError =
    add.error || remove.error || pin.error
      ? getErrorMessage(add.error || remove.error || pin.error)
      : null;

  return (
    <PageContainer>
      <div className="mb-7 flex items-start justify-between gap-3">
        <PageHeader title={t("favorites.title")} subtitle={t("favorites.subtitle")} />
        <ActionButton variant="primary" icon={<Plus size={14} />} onClick={() => navigate("/search")}>
          {t("favorites.addCity")}
        </ActionButton>
      </div>

      {favoritesQuery.isLoading && (
        <SurfaceCard className="mb-4">
          <p className="text-sm text-[#7a8ba8]">{t("favorites.loading")}</p>
        </SurfaceCard>
      )}

      {favoritesQuery.isError && (
        <SurfaceCard className="mb-4 border-red-500/20 bg-red-500/10">
          <p className="text-sm text-red-300">{getErrorMessage(favoritesQuery.error)}</p>
        </SurfaceCard>
      )}

      {actionError && (
        <p className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {actionError}
        </p>
      )}

      {!favoritesQuery.isLoading && favorites.length === 0 && (
        <SurfaceCard className="mb-8">
          <p className="mb-3 text-sm text-[#7a8ba8]">
            {t("favorites.empty")}
          </p>
          <ActionButton variant="primary" icon={<Plus size={14} />} onClick={() => navigate("/search")}>
            {t("favorites.findCity")}
          </ActionButton>
        </SurfaceCard>
      )}

      {pinned.length > 0 && (
        <section className="mb-8">
          <SectionLabel>{t("favorites.pinned")}</SectionLabel>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pinned.map((favorite) => (
              <FavoriteCard
                key={favorite.id}
                favorite={favorite}
                weather={weatherByFavoriteId.get(favorite.id)}
                onOpen={() => openFavorite(favorite)}
                onPin={() => pin.mutate({ id: favorite.id, isPinned: false })}
                onRemove={() => remove.mutate(favorite.id)}
              />
            ))}
          </div>
        </section>
      )}

      {unpinned.length > 0 && (
        <section className="mb-8">
          <SectionLabel>{t("favorites.all")}</SectionLabel>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {unpinned.map((favorite) => (
              <FavoriteCard
                key={favorite.id}
                favorite={favorite}
                weather={weatherByFavoriteId.get(favorite.id)}
                onOpen={() => openFavorite(favorite)}
                onPin={() => pin.mutate({ id: favorite.id, isPinned: true })}
                onRemove={() => remove.mutate(favorite.id)}
              />
            ))}
          </div>
        </section>
      )}

      <SurfaceCard className="mt-2 bg-gradient-to-br from-[#0d1628] to-[#0f1e3a] px-6 py-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="mb-1 text-[15px] font-bold">{t("favorites.compare")}</p>
            <p className="text-xs text-[#7a8ba8]">{t("favorites.compareDescription")}</p>
          </div>
          <ActionButton icon={<ArrowRight size={14} />} onClick={() => navigate("/analytics")}>
            {t("favorites.openComparison")}
          </ActionButton>
        </div>
      </SurfaceCard>

      <section className="mt-7">
        <SectionLabel>{t("favorites.suggested")}</SectionLabel>
        <div className="flex gap-2.5 overflow-x-auto pb-1">
          {suggested.map((city) => {
            const isAdding = add.isPending && add.variables?.locationId === city.id;
            return (
              <button
                type="button"
                key={city.id}
                disabled={isAdding}
                onClick={() =>
                  add.mutate({
                    locationId: city.id,
                    locationName: city.name,
                    country: city.country,
                    ...(parseCityCoord(city.lat) !== undefined
                      ? { latitude: parseCityCoord(city.lat) }
                      : {}),
                    ...(parseCityCoord(city.lon) !== undefined
                      ? { longitude: parseCityCoord(city.lon) }
                      : {}),
                  })
                }
                className="flex min-w-44 shrink-0 items-center gap-2.5 rounded-[14px] border border-white/[0.07] bg-[#0d1628] px-4 py-2.5 text-left hover:border-[#f7921e]/30 disabled:opacity-60"
              >
                <span>{city.flag}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-bold">{city.name}</p>
                  <p className="text-[10px] text-[#7a8ba8]">
                    {city.temp}° · {city.condition}
                  </p>
                </div>
                <Heart
                  size={14}
                  className={isAdding ? "text-[#f7921e]" : "text-[#7a8ba8]"}
                  fill={isAdding ? "#f7921e" : "transparent"}
                />
              </button>
            );
          })}
          {suggested.length === 0 && (
            <p className="text-sm text-[#7a8ba8]">{t("favorites.allSuggestedSaved")}</p>
          )}
        </div>
      </section>
    </PageContainer>
  );
}
