import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { useAuth } from "@/features/auth";

import { notificationsApi } from "../api/notifications-api";
import type { AppNotification, NotificationCategory } from "../api/settings.types";
import { getStoredWeatherLocation } from "../lib/location-storage";
import { usePreferences } from "../model/preferences-context";

const NOTIFICATIONS_KEY = ["notifications", "me"] as const;

export function getNotificationCategory(
  notification: AppNotification,
): NotificationCategory {
  const fromMeta = notification.metadata?.category;
  if (
    fromMeta === "rain" ||
    fromMeta === "storm" ||
    fromMeta === "heat" ||
    fromMeta === "tip" ||
    fromMeta === "daily"
  ) {
    return fromMeta;
  }

  const hay = `${notification.title} ${notification.body}`.toLowerCase();
  if (hay.includes("rain")) return "rain";
  if (hay.includes("storm") || hay.includes("thunder")) return "storm";
  if (hay.includes("heat") || hay.includes("hot")) return "heat";
  if (notification.type === "FORECAST") return "daily";
  return "other";
}

export function useNotificationsCenter(location = getStoredWeatherLocation()) {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  const { settings } = usePreferences();

  const listQuery = useQuery({
    queryKey: NOTIFICATIONS_KEY,
    queryFn: () => notificationsApi.listMine(),
    enabled: isAuthenticated,
    staleTime: 30_000,
  });

  const syncMutation = useMutation({
    mutationFn: () => notificationsApi.syncMine(location),
    onSuccess: (result) => {
      queryClient.setQueryData(NOTIFICATIONS_KEY, result.notifications);
    },
  });

  useEffect(() => {
    if (!isAuthenticated || !settings) return;
    void syncMutation.mutateAsync().catch(() => undefined);
    // Sync once settings are available / location changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, settings?.rainAlerts, settings?.stormWarnings, settings?.heatWarnings, location]);

  const markAllRead = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: (notifications) => {
      queryClient.setQueryData(NOTIFICATIONS_KEY, notifications);
    },
  });

  const clearRead = useMutation({
    mutationFn: () => notificationsApi.clearRead(),
    onSuccess: (notifications) => {
      queryClient.setQueryData(NOTIFICATIONS_KEY, notifications);
    },
  });

  const markRead = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: (notification) => {
      queryClient.setQueryData<AppNotification[]>(NOTIFICATIONS_KEY, (current = []) =>
        current.map((item) => (item.id === notification.id ? notification : item)),
      );
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => notificationsApi.remove(id),
    onSuccess: (_void, id) => {
      queryClient.setQueryData<AppNotification[]>(NOTIFICATIONS_KEY, (current = []) =>
        current.filter((item) => item.id !== id),
      );
    },
  });

  const notifications = listQuery.data ?? [];

  return {
    notifications,
    isLoading: listQuery.isLoading || syncMutation.isPending,
    isError: listQuery.isError,
    error: listQuery.error,
    unreadCount: notifications.filter((item) => !item.read).length,
    rainCount: notifications.filter((item) => getNotificationCategory(item) === "rain").length,
    stormCount: notifications.filter((item) => getNotificationCategory(item) === "storm").length,
    heatCount: notifications.filter((item) => getNotificationCategory(item) === "heat").length,
    refetch: listQuery.refetch,
    sync: () => syncMutation.mutateAsync(),
    markAllRead: () => markAllRead.mutateAsync(),
    clearRead: () => clearRead.mutateAsync(),
    markRead: (id: string) => markRead.mutateAsync(id),
    remove: (id: string) => remove.mutateAsync(id),
  };
}
