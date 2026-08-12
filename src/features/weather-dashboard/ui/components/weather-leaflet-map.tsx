import L from "leaflet";
import { useEffect, useMemo } from "react";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";

import type { MapMarkerPoint } from "../../hooks/use-map-weather";
import {
  MAP_DEFAULT_CENTER,
  MAP_DEFAULT_ZOOM,
  WEATHER_MAP_LAYERS,
  type WeatherMapLayerId,
} from "../../lib/map-cities";

import "leaflet/dist/leaflet.css";

function createWeatherIcon(point: MapMarkerPoint, selected: boolean) {
  const size = selected ? 54 : 44;
  const ring = selected ? `0 0 0 3px ${point.markerColor}66, 0 0 18px ${point.markerColor}88` : `0 0 12px ${point.markerColor}55`;

  return L.divIcon({
    className: "skycast-weather-marker",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `
      <div style="
        width:${size}px;
        height:${size}px;
        border-radius:999px;
        display:grid;
        place-items:center;
        background:radial-gradient(circle at 30% 30%, ${point.markerColor}cc, ${point.markerColor}33 55%, #0d1628ee 100%);
        border:1.5px solid ${point.markerColor};
        box-shadow:${ring};
        color:#e8edf8;
        font-family:Manrope,sans-serif;
        cursor:pointer;
        transition:transform .15s ease;
      ">
        <div style="text-align:center;line-height:1.05;padding:2px;">
          <div style="font-size:${selected ? 11 : 10}px;opacity:.9">${point.emoji}</div>
          <div style="font-size:${selected ? 12 : 11}px;font-weight:800;letter-spacing:-0.3px">${point.displayValue}</div>
        </div>
      </div>
    `,
  });
}

function FlyToSelected({
  point,
}: {
  point: MapMarkerPoint | null;
}) {
  const map = useMap();
  const pointId = point?.id ?? null;
  const latitude = point?.latitude;
  const longitude = point?.longitude;

  useEffect(() => {
    if (!pointId || latitude == null || longitude == null) return;
    map.flyTo([latitude, longitude], Math.max(map.getZoom(), 7), {
      duration: 0.85,
    });
  }, [map, pointId, latitude, longitude]);

  return null;
}

function InvalidateSizeOnMount() {
  const map = useMap();
  useEffect(() => {
    const timer = window.setTimeout(() => map.invalidateSize(), 80);
    return () => window.clearTimeout(timer);
  }, [map]);
  return null;
}

export function WeatherLeafletMap({
  layer,
  points,
  selectedId,
  onSelect,
  overlaysEnabled,
  tileUrlTemplate,
}: {
  layer: WeatherMapLayerId;
  points: MapMarkerPoint[];
  selectedId: string | null;
  onSelect: (point: MapMarkerPoint) => void;
  overlaysEnabled: boolean;
  tileUrlTemplate: string | null;
}) {
  const layerMeta = WEATHER_MAP_LAYERS.find((item) => item.id === layer);
  const overlayUrl = useMemo(() => {
    if (!overlaysEnabled || !tileUrlTemplate || !layerMeta) return null;
    return tileUrlTemplate.replace("{layer}", layerMeta.owmLayer);
  }, [overlaysEnabled, tileUrlTemplate, layerMeta]);

  const selected = points.find((point) => point.id === selectedId) ?? null;

  return (
    <MapContainer
      center={MAP_DEFAULT_CENTER}
      zoom={MAP_DEFAULT_ZOOM}
      className="h-full w-full bg-[#060c1a]"
      zoomControl={false}
      attributionControl
    >
      <InvalidateSizeOnMount />
      <FlyToSelected point={selected} />

      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> · &copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        subdomains="abcd"
        maxZoom={19}
      />

      {overlayUrl && (
        <TileLayer
          key={layer}
          url={overlayUrl}
          opacity={0.65}
          maxZoom={18}
          attribution='Weather overlays &copy; <a href="https://openweathermap.org/">OpenWeather</a>'
        />
      )}

      {points.map((point) => (
        <Marker
          key={`${point.id}-${layer}-${point.displayValue}`}
          position={[point.latitude, point.longitude]}
          icon={createWeatherIcon(point, point.id === selectedId)}
          eventHandlers={{
            click: () => onSelect(point),
          }}
        />
      ))}
    </MapContainer>
  );
}
