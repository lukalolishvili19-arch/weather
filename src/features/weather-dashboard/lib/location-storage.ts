const LOCATION_KEY = "skycast.weatherLocation";
export const DEFAULT_WEATHER_LOCATION = "Tbilisi";
export const WEATHER_LOCATION_EVENT = "skycast:weather-location";

export function getStoredWeatherLocation(): string {
  const stored = localStorage.getItem(LOCATION_KEY)?.trim();
  return stored || DEFAULT_WEATHER_LOCATION;
}

export function setStoredWeatherLocation(location: string) {
  const value = location.trim();
  localStorage.setItem(LOCATION_KEY, value);
  window.dispatchEvent(
    new CustomEvent(WEATHER_LOCATION_EVENT, {
      detail: { location: value },
    }),
  );
}

export function subscribeWeatherLocation(listener: (location: string) => void) {
  const onCustom = (event: Event) => {
    const detail = (event as CustomEvent<{ location?: string }>).detail;
    listener(detail?.location?.trim() || getStoredWeatherLocation());
  };
  const onStorage = (event: StorageEvent) => {
    if (event.key === LOCATION_KEY) {
      listener(event.newValue?.trim() || DEFAULT_WEATHER_LOCATION);
    }
  };

  window.addEventListener(WEATHER_LOCATION_EVENT, onCustom);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(WEATHER_LOCATION_EVENT, onCustom);
    window.removeEventListener("storage", onStorage);
  };
}
