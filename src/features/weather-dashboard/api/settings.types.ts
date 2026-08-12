export type ThemePreference = "DARK" | "LIGHT" | "SYSTEM";
export type TemperatureUnitPreference = "CELSIUS" | "FAHRENHEIT";
export type WindSpeedUnitPreference = "KMH" | "MPH" | "MS";

export type UserSettings = {
  id: string;
  userId: string;
  theme: ThemePreference;
  language: string;
  temperatureUnit: TemperatureUnitPreference;
  windSpeedUnit: WindSpeedUnitPreference;
  timeFormat24h: boolean;
  animateCharts: boolean;
  showFeelsLike: boolean;
  rainAlerts: boolean;
  stormWarnings: boolean;
  highUvAlerts: boolean;
  heatWarnings: boolean;
  strongWindAlerts: boolean;
  snowAlerts: boolean;
  dailyForecast: boolean;
  createdAt: string;
  updatedAt: string;
};

export type UpdateUserSettingsPayload = Partial<
  Omit<UserSettings, "id" | "userId" | "createdAt" | "updatedAt">
>;

export type NotificationCategory = "rain" | "storm" | "heat" | "tip" | "daily" | "other";

export type AppNotification = {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: "INFO" | "ALERT" | "FORECAST" | "SYSTEM";
  read: boolean;
  metadata: {
    category?: NotificationCategory;
    dedupeKey?: string;
    location?: string;
    area?: string;
    [key: string]: unknown;
  } | null;
  createdAt: string;
  updatedAt: string;
};

export type SyncNotificationsResult = {
  createdCount: number;
  notifications: AppNotification[];
};
