package com.weather.service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import com.weather.dto.NotificationDtos.CreateNotificationRequest;
import com.weather.dto.NotificationDtos.NotificationView;
import com.weather.dto.NotificationDtos.SyncResult;
import com.weather.dto.NotificationDtos.UpdateNotificationRequest;
import com.weather.entity.Notification;
import com.weather.entity.NotificationType;
import com.weather.entity.Timestamps;
import com.weather.entity.UserSettings;
import com.weather.exception.ApiException;
import com.weather.integration.Json;
import com.weather.mapper.EntityMapper;
import com.weather.repository.NotificationRepository;
import com.weather.repository.UserRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NotificationService {

  private record Candidate(String category, String title, String body, String dedupeKey) {
  }

  private final NotificationRepository notifications;
  private final UserRepository users;
  private final UserSettingsService userSettings;
  private final WeatherService weather;
  private final EntityMapper mapper;

  public NotificationService(NotificationRepository notifications, UserRepository users,
      UserSettingsService userSettings, WeatherService weather, EntityMapper mapper) {
    this.notifications = notifications;
    this.users = users;
    this.userSettings = userSettings;
    this.weather = weather;
    this.mapper = mapper;
  }

  @Transactional(readOnly = true)
  public List<NotificationView> listMine(String userId) {
    requireUser(userId);
    return notifications.findForUser(userId).stream().map(mapper::toNotification).toList();
  }

  @Transactional
  public List<NotificationView> markAllRead(String userId) {
    requireUser(userId);
    notifications.markAllRead(userId, Timestamps.now());
    return listMine(userId);
  }

  @Transactional
  public List<NotificationView> clearRead(String userId) {
    requireUser(userId);
    notifications.deleteRead(userId);
    return listMine(userId);
  }

  @Transactional
  public NotificationView updateMine(String userId, String id, UpdateNotificationRequest input) {
    Notification notification = getMine(userId, id);
    apply(notification, input);
    return mapper.toNotification(notifications.saveAndFlush(notification));
  }

  @Transactional
  public void removeMine(String userId, String id) {
    notifications.delete(getMine(userId, id));
  }

  @Transactional(readOnly = true)
  public List<NotificationView> list(String currentUserId, String userIdFilter) {
    if (userIdFilter != null) {
      Ownership.require(userIdFilter, currentUserId, "notifications");
    }
    return listMine(currentUserId);
  }

  @Transactional(readOnly = true)
  public NotificationView getById(String currentUserId, String id) {
    return mapper.toNotification(getMine(currentUserId, id));
  }

  @Transactional
  public NotificationView create(String currentUserId, CreateNotificationRequest input) {
    Ownership.require(input.userId(), currentUserId, "notifications");
    requireUser(input.userId());
    Notification notification = new Notification();
    notification.setUserId(input.userId());
    notification.setTitle(input.title());
    notification.setBody(input.body());
    if (input.type() != null) notification.setType(input.type());
    if (input.read() != null) notification.setRead(input.read());
    notification.setMetadata(mapper.writeJson(input.metadata()));
    return mapper.toNotification(notifications.saveAndFlush(notification));
  }

  @Transactional
  public NotificationView update(String currentUserId, String id, UpdateNotificationRequest input) {
    return updateMine(currentUserId, id, input);
  }

  @Transactional
  public void remove(String currentUserId, String id) {
    removeMine(currentUserId, id);
  }

  /**
   * Creates ALERT notifications for rain (tomorrow ≥ 60%), storms and heat, honouring the user's
   * alert settings. A {@code metadata.dedupeKey} prevents the same alert from being created twice.
   * Not transactional so no database connection is held while the upstream weather calls run.
   */
  public SyncResult syncWeatherAlerts(String userId, String location) {
    UserSettings settings = userSettings.getOrCreateEntity(userId);

    Map<String, Object> daily;
    Map<String, Object> alerts;
    try (ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor()) {
      CompletableFuture<Map<String, Object>> dailyFuture =
          CompletableFuture.supplyAsync(() -> weather.getDaily(location, 3), executor);
      CompletableFuture<Map<String, Object>> alertsFuture =
          CompletableFuture.supplyAsync(() -> weather.getAlerts(location), executor);
      daily = dailyFuture.join();
      alerts = alertsFuture.join();
    } catch (CompletionException exception) {
      if (exception.getCause() instanceof RuntimeException cause) {
        throw cause;
      }
      throw exception;
    }

    List<Map<String, Object>> days = maps(daily.get("days"));
    Map<String, Object> tomorrow = days.size() > 1 ? days.get(1) : days.isEmpty() ? null : days.get(0);
    Map<String, Object> today = days.isEmpty() ? null : days.get(0);
    String area = (String) Json.obj(daily.get("location")).get("resolvedAddress");
    List<Candidate> candidates = new ArrayList<>();

    if (settings.isRainAlerts() && tomorrow != null) {
      Double chance = Json.dbl(tomorrow.get("precipProbability"));
      double rainChance = chance == null ? 0 : chance;
      if (rainChance >= 60) {
        candidates.add(new Candidate("rain", "Rain Alert",
            Json.round(rainChance) + "% chance of rain around " + dayKey(tomorrow.get("datetime")) + " in " + area
                + ". Pack an umbrella.",
            "rain:" + dayKey(tomorrow.get("datetime")) + ":" + location));
      }
    }

    if (settings.isStormWarnings()) {
      Map<String, Object> stormOfficial = maps(alerts.get("categories")).stream()
          .filter(item -> "storm".equals(item.get("id")) && Boolean.TRUE.equals(item.get("active")))
          .findFirst().orElse(null);
      Map<String, Object> stormDay = days.stream().filter(day -> {
        String hay = (stringOr(day.get("conditions")) + " " + stringOr(day.get("icon"))).toLowerCase();
        return hay.contains("thunder") || hay.contains("storm");
      }).findFirst().orElse(null);

      if (stormOfficial != null || stormDay != null) {
        Object when = stormOfficial != null && stormOfficial.get("issued") != null
            ? stormOfficial.get("issued")
            : stormDay != null ? stormDay.get("datetime") : null;
        String body = stormOfficial != null
            ? stormOfficial.get("title") + ". " + stormOfficial.get("description")
            : "Stormy conditions possible near " + dayKey(when) + " in " + area + ". Limit outdoor exposure.";
        candidates.add(new Candidate("storm", "Storm Alert", body, "storm:" + dayKey(when) + ":" + location));
      }
    }

    if (settings.isHeatWarnings() && today != null) {
      Double high = Json.dbl(today.get("temperatureMax"));
      if (high == null) {
        high = Json.dbl(today.get("temperature"));
      }
      boolean us = "us".equals(daily.get("units"));
      double threshold = us ? 97 : 36;
      if (high != null && high >= threshold) {
        candidates.add(new Candidate("heat", "Heat Alert",
            "Highs near " + Json.round(high) + (us ? "°F" : "°C") + " expected in " + area
                + ". Stay hydrated and avoid peak sun.",
            "heat:" + dayKey(today.get("datetime")) + ":" + location));
      }
    }

    int created = 0;
    for (Candidate candidate : candidates) {
      if (notifications.existsByDedupeKey(userId, candidate.dedupeKey())) {
        continue;
      }
      Map<String, Object> metadata = new LinkedHashMap<>();
      metadata.put("category", candidate.category());
      metadata.put("dedupeKey", candidate.dedupeKey());
      metadata.put("location", location);
      metadata.put("area", area);

      Notification notification = new Notification();
      notification.setUserId(userId);
      notification.setTitle(candidate.title());
      notification.setBody(candidate.body());
      notification.setType(NotificationType.ALERT);
      notification.setRead(false);
      notification.setMetadata(mapper.writeJson(metadata));
      notifications.saveAndFlush(notification);
      created++;
    }

    return new SyncResult(created, listMine(userId));
  }

  private Notification getMine(String userId, String id) {
    Notification notification = notifications.findById(id).orElseThrow(() ->
        new ApiException(404, "NOTIFICATION_NOT_FOUND", "Notification " + id + " was not found."));
    if (!notification.getUserId().equals(userId)) {
      throw new ApiException(403, "FORBIDDEN", "You cannot access this notification.");
    }
    return notification;
  }

  private void apply(Notification notification, UpdateNotificationRequest input) {
    if (input.has("title")) notification.setTitle(input.getTitle());
    if (input.has("body")) notification.setBody(input.getBody());
    if (input.has("type")) notification.setType(input.getType());
    if (input.has("read")) notification.setRead(input.getRead());
    if (input.has("metadata")) notification.setMetadata(mapper.writeJson(input.getMetadata()));
    notification.touch();
  }

  private void requireUser(String userId) {
    if (!users.existsById(userId)) {
      throw new ApiException(404, "USER_NOT_FOUND", "User " + userId + " was not found.");
    }
  }

  private static String dayKey(Object datetime) {
    if (datetime instanceof String text) {
      return text.length() > 10 ? text.substring(0, 10) : text;
    }
    return "unknown";
  }

  private static String stringOr(Object value) {
    return value instanceof String text ? text : "";
  }

  @SuppressWarnings("unchecked")
  private static List<Map<String, Object>> maps(Object value) {
    return value instanceof List<?> list ? (List<Map<String, Object>>) list : List.of();
  }
}
