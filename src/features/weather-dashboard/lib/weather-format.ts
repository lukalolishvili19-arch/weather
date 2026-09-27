import { translate, type MessageKey } from "./i18n";

const ICON_EMOJI: Record<string, string> = {
  "clear-day": "☀️",
  "clear-night": "🌙",
  "partly-cloudy-day": "⛅",
  "partly-cloudy-night": "☁️",
  cloudy: "☁️",
  rain: "🌧️",
  snow: "❄️",
  sleet: "🌨️",
  wind: "💨",
  fog: "🌫️",
  hail: "🌨️",
  thunderstorm: "⛈️",
};

export function weatherIconToEmoji(icon: string | null | undefined): string {
  if (!icon) return "🌤️";
  return ICON_EMOJI[icon] ?? "🌤️";
}

export function formatNumber(value: number | null | undefined, digits = 0): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return value.toFixed(digits);
}

export function degreesToCompass(degrees: number | null | undefined): string {
  if (degrees === null || degrees === undefined || Number.isNaN(degrees)) return "—";
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const index = Math.round((((degrees % 360) + 360) % 360) / 45) % 8;
  return directions[index] ?? "N";
}

function t(language: string | undefined, key: MessageKey): string {
  return translate(language, key);
}

export function uvLabel(uv: number | null | undefined, language = "en"): string {
  if (uv === null || uv === undefined) return t(language, "weather.unknown");
  if (uv < 3) return t(language, "weather.uvLow");
  if (uv < 6) return t(language, "weather.uvModerate");
  if (uv < 8) return t(language, "weather.uvHigh");
  if (uv < 11) return t(language, "weather.uvVeryHigh");
  return t(language, "weather.uvExtreme");
}

export function humidityLabel(humidity: number | null | undefined, language = "en"): string {
  if (humidity === null || humidity === undefined) return t(language, "weather.unknown");
  if (humidity < 30) return t(language, "weather.humidityDry");
  if (humidity <= 60) return t(language, "weather.humidityComfortable");
  if (humidity <= 80) return t(language, "weather.humidityHumid");
  return t(language, "weather.humidityVeryHumid");
}

export function pressureLabel(pressure: number | null | undefined, language = "en"): string {
  if (pressure === null || pressure === undefined) return t(language, "weather.unknown");
  if (pressure < 1000) return t(language, "weather.pressureLow");
  if (pressure <= 1020) return t(language, "weather.pressureNormal");
  return t(language, "weather.pressureHigh");
}

export function visibilityLabel(visibility: number | null | undefined, language = "en"): string {
  if (visibility === null || visibility === undefined) return t(language, "weather.unknown");
  if (visibility >= 10) return t(language, "weather.visibilityClear");
  if (visibility >= 5) return t(language, "weather.visibilityModerate");
  return t(language, "weather.visibilityPoor");
}

export function cloudCoverLabel(cloudCover: number | null | undefined, language = "en"): string {
  if (cloudCover === null || cloudCover === undefined) return t(language, "weather.unknown");
  if (cloudCover < 20) return t(language, "weather.cloudClear");
  if (cloudCover < 50) return t(language, "weather.cloudPartly");
  if (cloudCover < 80) return t(language, "weather.cloudMostly");
  return t(language, "weather.cloudOvercast");
}

export function precipLabel(precip: number | null | undefined, language = "en"): string {
  if (precip === null || precip === undefined) return t(language, "weather.unknown");
  if (precip <= 0) return t(language, "weather.precipNone");
  if (precip < 2) return t(language, "weather.precipLight");
  if (precip < 8) return t(language, "weather.precipModerate");
  return t(language, "weather.precipHeavy");
}

/** Parse "HH:MM:SS" or "HH:MM" into minutes from midnight. */
export function parseTimeToMinutes(value: string | null | undefined): number | null {
  if (!value) return null;
  const match = /^(\d{1,2}):(\d{2})(?::(\d{2}))?/.exec(value);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  return hours * 60 + minutes;
}

export function formatClock(
  value: string | null | undefined,
  hour12 = true,
): { time: string; period: string } {
  const minutes = parseTimeToMinutes(value);
  if (minutes === null) return { time: "—", period: "" };

  const hours24 = Math.floor(minutes / 60) % 24;
  const mins = minutes % 60;

  if (!hour12) {
    return {
      time: `${String(hours24).padStart(2, "0")}:${String(mins).padStart(2, "0")}`,
      period: "",
    };
  }

  const period = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 || 12;
  return {
    time: `${hours12}:${String(mins).padStart(2, "0")}`,
    period,
  };
}

export function formatDayLength(
  sunrise: string | null | undefined,
  sunset: string | null | undefined,
): string {
  const start = parseTimeToMinutes(sunrise);
  const end = parseTimeToMinutes(sunset);
  if (start === null || end === null || end <= start) return "—";
  const total = end - start;
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  return `${hours}h ${minutes}m`;
}

export function goldenHourWindow(
  sunset: string | null | undefined,
  hour12 = true,
): string {
  const end = parseTimeToMinutes(sunset);
  if (end === null) return "—";
  const start = Math.max(0, end - 40);
  const format = (mins: number) => {
    const clock = formatClock(
      `${String(Math.floor(mins / 60) % 24).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`,
      hour12,
    );
    return clock.period ? `${clock.time} ${clock.period}` : clock.time;
  };
  return `${format(start)} — ${format(end)}`;
}

export function dayProgress(
  sunrise: string | null | undefined,
  sunset: string | null | undefined,
  now = new Date(),
): number {
  const start = parseTimeToMinutes(sunrise);
  const end = parseTimeToMinutes(sunset);
  if (start === null || end === null || end <= start) return 0.5;
  const current = now.getHours() * 60 + now.getMinutes();
  if (current <= start) return 0;
  if (current >= end) return 1;
  return (current - start) / (end - start);
}

export function formatLocalDateTime(
  epochSeconds: number | null | undefined,
  timezone: string | null | undefined,
  locale = "en-US",
  hour12 = true,
): string {
  if (!epochSeconds) return "Updated just now";
  const date = new Date(epochSeconds * 1000);
  try {
    return new Intl.DateTimeFormat(locale, {
      weekday: "long",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12,
      timeZone: timezone || undefined,
    }).format(date);
  } catch {
    return date.toLocaleString(locale);
  }
}

export function formatForecastDay(
  datetime: string | null,
  index: number,
  timezone: string | null,
  locale = "en-US",
  todayLabel = "Today",
): { day: string; date: string } {
  if (!datetime) {
    return { day: index === 0 ? todayLabel : `Day ${index + 1}`, date: "—" };
  }

  const date = new Date(`${datetime}T12:00:00`);
  try {
    const day =
      index === 0
        ? todayLabel
        : new Intl.DateTimeFormat(locale, {
            weekday: "short",
            timeZone: timezone || undefined,
          }).format(date);
    const shortDate = new Intl.DateTimeFormat(locale, {
      month: "short",
      day: "numeric",
      timeZone: timezone || undefined,
    }).format(date);
    return { day, date: shortDate };
  } catch {
    return { day: index === 0 ? todayLabel : datetime, date: datetime };
  }
}

export function formatHourLabel(
  datetime: string | null,
  datetimeEpoch: number | null,
  timezone: string | null,
  hour12 = true,
  locale = "en-US",
): string {
  if (datetimeEpoch) {
    try {
      return new Intl.DateTimeFormat(locale, {
        hour: "numeric",
        hour12,
        timeZone: timezone || undefined,
      }).format(new Date(datetimeEpoch * 1000));
    } catch {
      // fall through
    }
  }

  if (!datetime) return "—";
  const timePart = datetime.includes("T") ? datetime.split("T")[1] : datetime;
  const clock = formatClock(timePart ?? null, hour12);
  return clock.period ? `${clock.time} ${clock.period}` : clock.time;
}

export function temperatureUnitLabel(units: string | undefined): string {
  return units === "us" ? "°F" : "°C";
}

export function speedUnitLabel(units: string | undefined): string {
  if (units === "us") return "mph";
  if (units === "uk") return "mph";
  return "km/h";
}

export function distanceUnitLabel(units: string | undefined): string {
  return units === "us" ? "mi" : "km";
}

export function precipUnitLabel(units: string | undefined): string {
  return units === "us" ? "in" : "mm";
}
