import { isAxiosError } from "axios";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Clock,
  Crosshair,
  LoaderCircle,
  MapPin,
  Navigation,
  Search,
  Thermometer,
  TrendingUp,
  X,
} from "lucide-react";
import { useMemo, useState, type FormEvent, type KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/features/auth";
import { AccountPrompt } from "@/features/auth/ui/account-prompt";

import type { LocationSuggestion } from "../../api/search.types";
import { searchApi } from "../../api/search-api";
import { useCityWeatherPreviews } from "../../hooks/use-city-weather-previews";
import { useI18n } from "../../hooks/use-i18n";
import {
  suggestionToWeatherQuery,
  useLocationAutocomplete,
  useLocationSuggestions,
  useSearchHistory,
  useSearchHistoryActions,
} from "../../hooks/use-location-search";
import { setStoredWeatherLocation } from "../../lib/location-storage";
import { PageContainer } from "../components/app-shell";
import { ActionButton, PageHeader, SectionLabel, SurfaceCard } from "../components/primitives";
import { InlineSkeleton } from "@/shared/ui/skeleton";
import { cn } from "@/shared/lib/cn";

const trending = [
  { name: "Batumi", country: "Georgia", emoji: "🌊", query: "Batumi, Georgia" },
  { name: "Kutaisi", country: "Georgia", emoji: "🏔️", query: "Kutaisi, Georgia" },
  { name: "Istanbul", country: "Turkey", emoji: "🌉", query: "Istanbul, Turkey" },
  { name: "Santorini", country: "Greece", emoji: "🏝️", query: "Santorini, Greece" },
  { name: "Reykjavik", country: "Iceland", emoji: "🌬️", query: "Reykjavik, Iceland" },
  { name: "Kyoto", country: "Japan", emoji: "🌸", query: "Kyoto, Japan" },
  { name: "Cape Town", country: "S. Africa", emoji: "🌊", query: "Cape Town, South Africa" },
  { name: "Dubai", country: "UAE", emoji: "🏜️", query: "Dubai, United Arab Emirates" },
  { name: "Tokyo", country: "Japan", emoji: "🗾", query: "Tokyo, Japan" },
  { name: "Paris", country: "France", emoji: "🗼", query: "Paris, France" },
  { name: "New York", country: "USA", emoji: "🗽", query: "New York, United States" },
  { name: "Sydney", country: "Australia", emoji: "🦘", query: "Sydney, Australia" },
];

function getErrorMessage(error: unknown) {
  if (isAxiosError(error)) {
    const message = (error.response?.data as { error?: { message?: string } } | undefined)?.error
      ?.message;
    if (message) return message;
  }
  if (error instanceof Error) return error.message;
  return "Something went wrong.";
}

export function SearchPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [locating, setLocating] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);

  const autocomplete = useLocationAutocomplete(query, isFocused || query.trim().length >= 2);
  const suggestions = useLocationSuggestions(query);
  const { isAuthenticated, isBootstrapping } = useAuth();
  const history = useSearchHistory(12);
  const { record, remove, clear } = useSearchHistoryActions();

  async function recordHistory(payload: Parameters<typeof record.mutateAsync>[0]) {
    if (!isAuthenticated) return;
    await record.mutateAsync(payload);
  }

  const exploreCities = useMemo(
    () =>
      (suggestions.data?.length ? suggestions.data : []).slice(0, 12).map((item) => ({
        id: item.id,
        name: item.name,
        country: item.country,
        label: item.label,
        weatherQuery: suggestionToWeatherQuery(item),
      })),
    [suggestions.data],
  );

  const trendingInputs = useMemo(
    () =>
      trending.map((city) => ({
        id: `trend-${city.name}`,
        name: city.name,
        country: city.country,
        weatherQuery: city.query,
        emoji: city.emoji,
      })),
    [],
  );

  const explorePreviews = useCityWeatherPreviews(exploreCities);
  const trendingPreviews = useCityWeatherPreviews(trendingInputs);

  const dropdownSuggestions = useMemo(() => {
    if (query.trim().length >= 2) {
      return autocomplete.data ?? [];
    }
    return suggestions.data ?? [];
  }, [autocomplete.data, suggestions.data, query]);

  const showDropdown =
    isFocused && (dropdownSuggestions.length > 0 || autocomplete.isFetching || Boolean(query.trim()));

  async function selectLocation(suggestion: LocationSuggestion) {
    setActionError(null);
    const weatherQuery = suggestionToWeatherQuery(suggestion);
    setStoredWeatherLocation(weatherQuery);
    setQuery(suggestion.label);
    setIsFocused(false);
    setActiveIndex(-1);

    try {
      await recordHistory({
        query: suggestion.label,
        locationId: suggestion.id,
        locationName: suggestion.name,
        country: suggestion.country,
        latitude: suggestion.latitude,
        longitude: suggestion.longitude,
      });
    } catch {
      // History persistence should not block navigation.
    }

    navigate("/");
  }

  async function openWeatherQuery(
    weatherQuery: string,
    meta?: { label?: string; name?: string; country?: string | null; latitude?: number; longitude?: number },
  ) {
    setActionError(null);
    const displayName =
      meta?.label?.trim() ||
      (meta?.name
        ? meta.country
          ? `${meta.name}, ${meta.country}`
          : meta.name
        : weatherQuery);
    setStoredWeatherLocation(displayName);

    try {
      await recordHistory({
        query: displayName,
        ...(meta?.name ? { locationName: meta.name } : {}),
        ...(meta?.country ? { country: meta.country } : {}),
        ...(meta?.latitude != null ? { latitude: meta.latitude } : {}),
        ...(meta?.longitude != null ? { longitude: meta.longitude } : {}),
      });
    } catch {
      // ignore history errors
    }

    navigate("/");
  }

  async function selectByQuery(rawQuery: string) {
    const trimmed = rawQuery.trim();
    if (!trimmed) return;
    setActionError(null);

    try {
      const resolved = await searchApi.resolve({ q: trimmed });
      await selectLocation(resolved);
    } catch (error) {
      // Coordinates / direct query can still open the dashboard.
      if (/^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/.test(trimmed)) {
        await openWeatherQuery(trimmed.replace(/\s+/g, ""));
        return;
      }
      setActionError(getErrorMessage(error));
    }
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (activeIndex >= 0 && dropdownSuggestions[activeIndex]) {
      void selectLocation(dropdownSuggestions[activeIndex]!);
      return;
    }
    void selectByQuery(query);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!showDropdown) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, dropdownSuggestions.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, -1));
    } else if (event.key === "Escape") {
      setIsFocused(false);
      setActiveIndex(-1);
    }
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setActionError("Geolocation is not supported in this browser.");
      return;
    }

    setLocating(true);
    setActionError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        void (async () => {
          try {
            const resolved = await searchApi.resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
            await selectLocation(resolved);
          } catch (error) {
            setActionError(getErrorMessage(error));
          } finally {
            setLocating(false);
          }
        })();
      },
      () => {
        setLocating(false);
        setActionError("Unable to get your current location.");
      },
      { enableHighAccuracy: true, timeout: 12_000 },
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title={t("search.title")}
        subtitle={t("search.subtitle")}
      />

      <form className="relative mb-4" onSubmit={onSubmit}>
        <Search className="absolute left-4 top-1/2 z-20 -translate-y-1/2 text-[#7a8ba8]" size={18} />
        <input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveIndex(-1);
            setActionError(null);
          }}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            window.setTimeout(() => setIsFocused(false), 160);
          }}
          onKeyDown={onKeyDown}
          placeholder={t("search.placeholder")}
          className="w-full rounded-2xl border border-white/[0.07] bg-[#0d1628] py-3.5 pl-12 pr-28 text-[15px] font-medium text-[#e8edf8] outline-none placeholder:text-[#7a8ba8] shadow-[0_4px_24px_rgba(0,0,0,0.2)] focus:border-[#f7921e]/40"
          autoComplete="off"
          role="combobox"
          aria-expanded={showDropdown}
          aria-autocomplete="list"
        />
        <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
          {query && (
            <button
              type="button"
              className="rounded-lg p-2 text-[#7a8ba8] hover:text-[#e8edf8]"
              onClick={() => {
                setQuery("");
                setActiveIndex(-1);
              }}
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
          <button
            type="button"
            onClick={useCurrentLocation}
            disabled={locating}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#f7921e]/20 bg-[#f7921e]/10 px-3 py-2 text-[12px] font-semibold text-[#f7921e] disabled:opacity-60"
          >
            {locating ? <LoaderCircle size={13} className="animate-spin" /> : <Navigation size={13} />}
            {t("search.nearMe")}
          </button>
        </div>

        <AnimatePresence>
          {showDropdown && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.16 }}
              className="absolute inset-x-0 top-[calc(100%+8px)] z-30 overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0d1628] shadow-[0_16px_40px_rgba(0,0,0,0.35)]"
              role="listbox"
            >
              {autocomplete.isFetching && query.trim().length >= 2 && (
                <p className="px-4 py-3 text-sm text-[#7a8ba8]">{t("search.searching")}</p>
              )}
              {autocomplete.isError && query.trim().length >= 2 && (
                <p className="px-4 py-3 text-sm text-red-300">{getErrorMessage(autocomplete.error)}</p>
              )}
              {!autocomplete.isFetching &&
                query.trim().length >= 2 &&
                dropdownSuggestions.length === 0 && (
                  <p className="px-4 py-3 text-sm text-[#7a8ba8]">
                    No matches. Try a city name or coordinates like <code>41.69,44.83</code>.
                  </p>
                )}
              {dropdownSuggestions.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  role="option"
                  aria-selected={activeIndex === index}
                  className={cn(
                    "flex w-full items-start gap-3 border-b border-white/[0.05] px-4 py-3 text-left last:border-b-0",
                    activeIndex === index ? "bg-[#f7921e]/10" : "hover:bg-white/[0.03]",
                  )}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => void selectLocation(item)}
                >
                  <MapPin size={15} className="mt-0.5 shrink-0 text-[#f7921e]" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold text-[#e8edf8]">
                      {item.name}
                    </span>
                    <span className="block truncate text-[11px] text-[#7a8ba8]">{item.label}</span>
                  </span>
                  <span className="shrink-0 text-[10px] uppercase tracking-[0.08em] text-[#7a8ba8]">
                    {item.type}
                  </span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </form>

      {actionError && (
        <p className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {actionError}
        </p>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={useCurrentLocation}
          disabled={locating}
          className="inline-flex items-center gap-2 rounded-xl border border-white/[0.07] bg-[#0d1628] px-3.5 py-2 text-[12px] font-semibold text-[#e8edf8] disabled:opacity-60"
        >
          <Crosshair size={13} className="text-[#f7921e]" />
          {t("search.currentLocation")}
        </button>
        <button
          type="button"
          onClick={() => {
            setQuery("Tbilisi");
            setIsFocused(true);
          }}
          className="inline-flex items-center gap-2 rounded-xl border border-white/[0.07] bg-[#0d1628] px-3.5 py-2 text-[12px] font-semibold text-[#e8edf8]"
        >
          <MapPin size={13} className="text-[#4a9eff]" />
          {t("search.tryTbilisi")}
        </button>
      </div>

      <section className="mb-7">
        <SectionLabel>{t("search.explore")}</SectionLabel>
        {suggestions.isLoading && <InlineSkeleton rows={3} className="mb-3" />}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {explorePreviews.map((city) => (
            <button
              key={city.id}
              type="button"
              onClick={() =>
                void openWeatherQuery(city.weatherQuery, {
                  label: city.label,
                  name: city.name,
                  country: city.country,
                })
              }
              className="rounded-[16px] border border-white/[0.07] bg-[#0d1628] p-4 text-left transition-colors hover:border-[#f7921e]/30"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-bold text-[#e8edf8]">{city.name}</p>
                  <p className="truncate text-[11px] text-[#7a8ba8]">
                    {city.country || city.label || t("search.worldwide")}
                  </p>
                </div>
                <Thermometer size={16} className="shrink-0 text-[#f7921e]" />
              </div>
              {city.isLoading ? (
                <p className="text-sm text-[#7a8ba8]">{t("common.loading")}</p>
              ) : city.isError ? (
                <p className="text-sm text-[#7a8ba8]">{t("search.tapToOpen")}</p>
              ) : (
                <div className="flex items-end justify-between gap-2">
                  <p className="text-[28px] font-black leading-none text-[#e8edf8]">
                    {city.temperature ?? "—"}
                  </p>
                  <div className="text-right">
                    <p className="text-[12px] font-semibold text-[#c6d0e2]">
                      {city.conditions ?? "—"}
                    </p>
                    <p className="text-[11px] text-[#7a8ba8]">
                      {t("common.humidity")} {city.humidity ?? "—"}
                    </p>
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section>
          <div className="mb-4 flex items-center justify-between">
            <SectionLabel className="mb-0">{t("search.recent")}</SectionLabel>
            <button
              type="button"
              className="text-[11px] text-[#7a8ba8] hover:text-[#e8edf8] disabled:opacity-40"
              disabled={!history.data?.length || clear.isPending}
              onClick={() => void clear.mutateAsync()}
            >
              {t("search.clearAll")}
            </button>
          </div>
          {!isAuthenticated && !isBootstrapping && <AccountPrompt messageKey="auth.prompt.history" />}
          {history.isLoading && <p className="text-sm text-[#7a8ba8]">{t("search.loadingHistory")}</p>}
          {history.isError && (
            <p className="text-sm text-red-300">{getErrorMessage(history.error)}</p>
          )}
          {isAuthenticated && !history.isLoading && !history.data?.length && (
            <p className="rounded-[14px] border border-white/[0.07] bg-[#0d1628] px-4 py-3 text-sm text-[#7a8ba8]">
              {t("search.noRecent")}
            </p>
          )}
          <div className="flex flex-col gap-2">
            {history.data?.map((entry) => (
              <div
                key={entry.id}
                className="flex w-full items-center gap-3 rounded-[14px] border border-white/[0.07] bg-[#0d1628] px-4 py-3"
              >
                <button
                  type="button"
                  className="flex flex-1 items-center gap-3 text-left"
                  onClick={() => {
                    const displayName = entry.locationName
                      ? entry.country
                        ? `${entry.locationName}, ${entry.country}`
                        : entry.locationName
                      : entry.query;
                    void openWeatherQuery(displayName, {
                      label: displayName,
                      name: entry.locationName ?? undefined,
                      country: entry.country,
                      latitude: entry.latitude ?? undefined,
                      longitude: entry.longitude ?? undefined,
                    });
                  }}
                >
                  <Clock size={14} className="text-[#7a8ba8]" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold text-[#e8edf8]">
                      {entry.locationName || entry.query}
                    </span>
                    <span className="block truncate text-[11px] text-[#7a8ba8]">
                      {entry.country || entry.query}
                    </span>
                  </span>
                </button>
                <button
                  type="button"
                  aria-label="Remove search"
                  className="rounded-md p-1 text-[#7a8ba8] hover:text-[#e8edf8]"
                  onClick={() => void remove.mutateAsync(entry.id)}
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </section>

        <section>
          <SectionLabel>{t("search.trending")}</SectionLabel>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {trendingPreviews.map((city, index) => (
              <button
                key={city.id}
                type="button"
                onClick={() =>
                  void openWeatherQuery(city.weatherQuery, {
                    name: city.name,
                    country: city.country,
                  })
                }
                className="flex items-center gap-3 rounded-[14px] border border-white/[0.07] bg-[#0d1628] px-4 py-3.5 text-left hover:border-[#f7921e]/25"
              >
                <span className="text-2xl" aria-hidden="true">
                  {city.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-bold text-[#e8edf8]">
                    {city.name}{" "}
                    <span className="text-[10px] text-[#7a8ba8]">#{index + 1}</span>
                  </p>
                  <p className="truncate text-[11px] text-[#7a8ba8]">
                    {city.isLoading
                      ? t("common.loading")
                      : `${city.temperature ?? "—"} · ${city.conditions ?? city.country}`}
                  </p>
                </div>
                <TrendingUp size={14} className="shrink-0 text-[#f7921e]" />
              </button>
            ))}
          </div>
        </section>
      </div>

      <SurfaceCard className="mt-6 bg-gradient-to-br from-[#0d1628] to-[#111e38] px-6 py-5">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3.5">
            <span className="grid h-11 w-11 place-items-center rounded-xl border border-[#4a9eff]/20 bg-[#4a9eff]/10 text-[22px]">
              🗺️
            </span>
            <div>
              <p className="text-[15px] font-bold">{t("search.mapTitle")}</p>
              <p className="text-xs text-[#7a8ba8]">
                {t("search.mapSubtitle")}
              </p>
            </div>
          </div>
          <ActionButton
            className="border-[#4a9eff]/20 bg-[#4a9eff]/10 text-[#4a9eff]"
            icon={<ArrowRight size={13} />}
            onClick={() => navigate("/map")}
          >
            {t("search.openMap")}
          </ActionButton>
        </div>
      </SurfaceCard>
    </PageContainer>
  );
}
