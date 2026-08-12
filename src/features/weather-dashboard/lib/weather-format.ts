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

export function uvLabel(uv: number | null | undefined): string {
  if (uv === null || uv === undefined) return "Unknown";
  if (uv < 3) return "Low";
  if (uv < 6) return "Moderate";
  if (uv < 8) return "High";
  if (uv < 11) return "Very High";
  return "Extreme";
}

export function humidityLabel(humidity: number | null | undefined): string {
  if (humidity === null || humidity === undefined) return "Unknown";
  if (humidity < 30) return "Dry";
  if (humidity <= 60) return "Comfortable";
  if (humidity <= 80) return "Humid";
  return "Very humid";
}

export function pressureLabel(pressure: number | null | undefined): string {
  if (pressure === null || pressure === undefined) return "Unknown";
  if (pressure < 1000) return "Low";
  if (pressure <= 1020) return "Normal";
  return "High";
}

export function visibilityLabel(visibility: number | null | undefined): string {
  if (visibility === null || visibility === undefined) return "Unknown";
  if (visibility >= 10) return "Clear skies";
  if (visibility >= 5) return "Moderate";
  return "Poor";
}

export function cloudCoverLabel(cloudCover: number | null | undefined): string {
  if (cloudCover === null || cloudCover === undefined) return "Unknown";
  if (cloudCover < 20) return "Clear";
  if (cloudCover < 50) return "Partly cloudy";
  if (cloudCover < 80) return "Mostly cloudy";
  return "Overcast";
}

export function precipLabel(precip: number | null | undefined): string {
  if (precip === null || precip === undefined) return "Unknown";
  if (precip <= 0) return "None today";
  if (precip < 2) return "Light";
  if (precip < 8) return "Moderate";
  return "Heavy";
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

export function goldenHourWindow(sunset: string | null | undefined): string {
  const end = parseTimeToMinutes(sunset);
  if (end === null) return "—";
  const start = Math.max(0, end - 40);
  const format = (mins: number) => {
    const h = Math.floor(mins / 60) % 24;
    const m = mins % 60;
    const period = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${h12}:${String(m).padStart(2, "0")} ${period}`;
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
): string {
  if (!epochSeconds) return "Updated just now";
  const date = new Date(epochSeconds * 1000);
  try {
    return new Intl.DateTimeFormat(undefined, {
      weekday: "long",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: timezone || undefined,
    }).format(date);
  } catch {
    return date.toLocaleString();
  }
}

export function formatForecastDay(
  datetime: string | null,
  index: number,
  timezone: string | null,
): { day: string; date: string } {
  if (!datetime) {
    return { day: index === 0 ? "Today" : `Day ${index + 1}`, date: "—" };
  }

  const date = new Date(`${datetime}T12:00:00`);
  try {
    const day =
      index === 0
        ? "Today"
        : new Intl.DateTimeFormat(undefined, {
            weekday: "short",
            timeZone: timezone || undefined,
          }).format(date);
    const shortDate = new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      timeZone: timezone || undefined,
    }).format(date);
    return { day, date: shortDate };
  } catch {
    return { day: index === 0 ? "Today" : datetime, date: datetime };
  }
}

export function formatHourLabel(
  datetime: string | null,
  datetimeEpoch: number | null,
  timezone: string | null,
): string {
  if (datetimeEpoch) {
    try {
      return new Intl.DateTimeFormat(undefined, {
        hour: "numeric",
        timeZone: timezone || undefined,
      }).format(new Date(datetimeEpoch * 1000));
    } catch {
      // fall through
    }
  }

  if (!datetime) return "—";
  const timePart = datetime.includes("T") ? datetime.split("T")[1] : datetime;
  const clock = formatClock(timePart ?? null, true);
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
