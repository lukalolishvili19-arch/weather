import {
  Cloud,
  CloudRain,
  Gauge,
  LocateFixed,
  Thermometer,
  Wind,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { useMapWeather } from "../../hooks/use-map-weather";
import type { MapMarkerPoint } from "../../hooks/use-map-weather";
import {
  WEATHER_MAP_LAYERS,
  type WeatherMapLayerId,
} from "../../lib/map-cities";
import {
  getStoredWeatherLocation,
  setStoredWeatherLocation,
} from "../../lib/location-storage";
import { formatNumber } from "../../lib/weather-format";
import { Badge } from "../components/primitives";
import { WeatherLeafletMap } from "../components/weather-leaflet-map";
import { cn } from "@/shared/lib/cn";

const layerIcons = {
  temperature: Thermometer,
  rain: CloudRain,
  wind: Wind,
  pressure: Gauge,
  clouds: Cloud,
} as const;

function matchStoredCity(points: MapMarkerPoint[], stored: string) {
  const needle = stored.trim().toLowerCase();
  return (
    points.find((point) => point.name.toLowerCase() === needle) ??
    points.find((point) => point.weatherQuery === stored) ??
    points.find((point) => needle.includes(point.name.toLowerCase())) ??
    null
  );
}

export function MapPage() {
  const [layer, setLayer] = useState<WeatherMapLayerId>("temperature");
  const [selectedId, setSelectedId] = useState<string | null>("tbilisi");
  const [panelOpen, setPanelOpen] = useState(true);
  const syncedLocation = useRef(false);
  const mapWeather = useMapWeather(layer);

  const selected = useMemo(
    () => mapWeather.points.find((point) => point.id === selectedId) ?? null,
    [mapWeather.points, selectedId],
  );

  const activeLayer = WEATHER_MAP_LAYERS.find((item) => item.id === layer) ?? WEATHER_MAP_LAYERS[0];

  useEffect(() => {
    if (syncedLocation.current || mapWeather.points.length === 0) return;
    const match = matchStoredCity(mapWeather.points, getStoredWeatherLocation());
    if (match) setSelectedId(match.id);
    syncedLocation.current = true;
  }, [mapWeather.points]);

  const onSelect = (point: MapMarkerPoint) => {
    setSelectedId(point.id);
    setPanelOpen(true);
    setStoredWeatherLocation(
      point.country ? `${point.name}, ${point.country}` : point.name,
    );
  };

  return (
    <div className="flex h-[calc(100dvh-4rem)] flex-col lg:h-dvh">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] bg-[#0d1628] px-4 py-3 sm:px-6 sm:py-4">
        <div>
          <h1 className="text-xl font-black tracking-[-0.3px]">Weather Map</h1>
          <p className="text-xs text-[#7a8ba8]">
            Leaflet · {mapWeather.overlaysEnabled ? "Live overlays + markers" : "Interactive markers"}
            {mapWeather.isFetching ? " · Refreshing…" : ""}
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {WEATHER_MAP_LAYERS.map((item) => {
            const Icon = layerIcons[item.id];
            const active = layer === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setLayer(item.id)}
                className={cn(
                  "flex items-center gap-1.5 rounded-[10px] border px-3.5 py-2 text-xs font-bold transition-colors",
                )}
                style={{
                  borderColor: active ? `${item.color}60` : "rgba(255,255,255,0.07)",
                  background: active ? `${item.color}18` : "rgba(255,255,255,0.04)",
                  color: active ? item.color : "#7a8ba8",
                }}
              >
                <Icon size={14} />
                {item.label}
              </button>
            );
          })}
        </div>

        <Badge variant={mapWeather.overlaysEnabled ? "green" : "blue"}>
          {mapWeather.overlaysEnabled ? "● Overlays live" : "● Markers live"}
        </Badge>
      </header>

      <div className="relative min-h-0 flex-1 overflow-hidden bg-[#060c1a]">
        <WeatherLeafletMap
          layer={layer}
          points={mapWeather.points}
          selectedId={selectedId}
          onSelect={onSelect}
          overlaysEnabled={mapWeather.overlaysEnabled}
          tileUrlTemplate={mapWeather.tileUrlTemplate}
        />

        <div className="pointer-events-none absolute inset-x-0 top-0 z-[500] flex justify-center p-3 sm:justify-start sm:p-4">
          {mapWeather.isLoading && (
            <div className="pointer-events-auto rounded-xl border border-white/[0.07] bg-[#0d1628]/90 px-3 py-2 text-xs font-semibold text-[#7a8ba8] backdrop-blur-xl">
              Loading live marker weather…
            </div>
          )}
          {!mapWeather.overlaysEnabled && !mapWeather.mapConfigLoading && (
            <div className="pointer-events-auto max-w-md rounded-xl border border-white/[0.07] bg-[#0d1628]/90 px-3 py-2 text-[11px] leading-5 text-[#7a8ba8] backdrop-blur-xl">
              Set <code className="text-[#f7921e]">OPENWEATHER_API_KEY</code> on the API to enable
              Temperature / Rain / Wind / Pressure / Clouds tile overlays. Markers stay interactive
              either way.
            </div>
          )}
        </div>

        <div className="absolute bottom-5 left-5 z-[500] rounded-xl border border-white/[0.07] bg-[#0d1628]/90 px-4 py-3 backdrop-blur-xl">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.08em] text-[#7a8ba8]">
            {activeLayer?.label ?? "Layer"}
          </p>
          <div className="flex gap-1.5">
            {(activeLayer?.legend ?? []).map((item) => (
              <div className="text-center" key={item.label}>
                <div className="mb-1 h-2 w-6 rounded-[3px]" style={{ background: item.color }} />
                <span className="text-[9px] text-[#7a8ba8]">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {panelOpen && selected && (
          <aside className="absolute right-5 top-5 z-[500] w-[min(100%-2.5rem,280px)] rounded-[18px] border border-white/[0.07] bg-[#0d1628]/95 px-5 py-[18px] shadow-2xl backdrop-blur-2xl">
            <div className="mb-3 flex items-start justify-between">
              <div>
                <p className="text-[15px] font-extrabold">{selected.name}</p>
                <p className="text-[11px] text-[#7a8ba8]">{selected.country}</p>
              </div>
              <button
                type="button"
                className="grid h-7 w-7 place-items-center rounded-lg bg-white/[0.06] text-[#7a8ba8] hover:text-[#e8edf8]"
                onClick={() => setPanelOpen(false)}
                aria-label="Close city panel"
              >
                <X size={13} />
              </button>
            </div>

            <div className="mb-3.5 flex items-end gap-2.5">
              <strong
                className="text-[40px] font-black leading-none tracking-[-2px]"
                style={{ color: selected.markerColor }}
              >
                {selected.temperature == null
                  ? "—"
                  : `${formatNumber(selected.temperature, 0)}°`}
              </strong>
              <span className="text-[28px]">{selected.emoji}</span>
            </div>

            <p className="mb-3 text-xs text-[#7a8ba8]">
              {selected.conditions ?? (selected.isLoading ? "Loading…" : "No conditions")}
            </p>

            {(
              [
                ["Layer value", selected.displayValue, activeLayer?.color ?? "#f7921e"],
                [
                  "Rain prob.",
                  selected.rainChance == null
                    ? "—"
                    : `${formatNumber(selected.rainChance, 0)}%`,
                  "#4a9eff",
                ],
                [
                  "Wind speed",
                  selected.windSpeed == null
                    ? "—"
                    : `${formatNumber(selected.windSpeed, 0)} ${mapWeather.speedUnit}`,
                  "#a3e635",
                ],
                [
                  "Pressure",
                  selected.pressure == null
                    ? "—"
                    : `${formatNumber(selected.pressure, 0)} hPa`,
                  "#7a8ba8",
                ],
                [
                  "Clouds",
                  selected.cloudCover == null
                    ? "—"
                    : `${formatNumber(selected.cloudCover, 0)}%`,
                  "#94a3b8",
                ],
              ] as const
            ).map(([label, value, color]) => (
              <div
                className="flex justify-between border-b border-white/[0.07] py-2 text-xs"
                key={label}
              >
                <span className="text-[#7a8ba8]">{label}</span>
                <strong style={{ color }}>{value}</strong>
              </div>
            ))}

            <button
              type="button"
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.04] px-3 py-2 text-xs font-bold text-[#e8edf8] hover:bg-white/[0.07]"
              onClick={() =>
                setStoredWeatherLocation(
                  selected.country ? `${selected.name}, ${selected.country}` : selected.name,
                )
              }
            >
              <LocateFixed size={13} />
              Use as dashboard location
            </button>
          </aside>
        )}

        <span className="absolute bottom-5 right-5 z-[500] rounded-[10px] border border-white/[0.07] bg-[#0d1628]/90 px-3.5 py-2 text-[11px] font-semibold text-[#7a8ba8]">
          {mapWeather.points.filter((point) => point.weather).length}/{mapWeather.points.length}{" "}
          cities · Leaflet
        </span>
      </div>
    </div>
  );
}
