package com.weather.mapper;

import com.weather.dto.FavoriteDtos.FavoriteView;
import com.weather.dto.NotificationDtos.NotificationView;
import com.weather.dto.PublicUser;
import com.weather.dto.SearchHistoryDtos.SearchHistoryView;
import com.weather.dto.UserSettingsDtos.UserSettingsView;
import com.weather.entity.Favorite;
import com.weather.entity.Notification;
import com.weather.entity.SearchHistory;
import com.weather.entity.Timestamps;
import com.weather.entity.User;
import com.weather.entity.UserSettings;

import org.springframework.stereotype.Component;

import tools.jackson.databind.json.JsonMapper;

@Component
public class EntityMapper {

  private final JsonMapper jsonMapper;

  public EntityMapper(JsonMapper jsonMapper) {
    this.jsonMapper = jsonMapper;
  }

  /** Never exposes {@code passwordHash}; {@code settings} is always present (object or null). */
  public PublicUser toPublicUser(User user, UserSettings settings) {
    return new PublicUser(
        user.getId(),
        user.getEmail(),
        user.getName(),
        user.getAvatarUrl(),
        Timestamps.format(user.getCreatedAt()),
        Timestamps.format(user.getUpdatedAt()),
        settings == null ? null : toSettings(settings));
  }

  public UserSettingsView toSettings(UserSettings settings) {
    return new UserSettingsView(
        settings.getId(),
        settings.getUserId(),
        settings.getTheme(),
        settings.getLanguage(),
        settings.getTemperatureUnit(),
        settings.getWindSpeedUnit(),
        settings.isTimeFormat24h(),
        settings.isAnimateCharts(),
        settings.isShowFeelsLike(),
        settings.isRainAlerts(),
        settings.isStormWarnings(),
        settings.isHighUvAlerts(),
        settings.isHeatWarnings(),
        settings.isStrongWindAlerts(),
        settings.isSnowAlerts(),
        settings.isDailyForecast(),
        Timestamps.format(settings.getCreatedAt()),
        Timestamps.format(settings.getUpdatedAt()));
  }

  public FavoriteView toFavorite(Favorite favorite) {
    return new FavoriteView(
        favorite.getId(),
        favorite.getUserId(),
        favorite.getLocationId(),
        favorite.getLocationName(),
        favorite.getCountry(),
        favorite.getLatitude(),
        favorite.getLongitude(),
        favorite.isPinned(),
        Timestamps.format(favorite.getCreatedAt()),
        Timestamps.format(favorite.getUpdatedAt()));
  }

  public SearchHistoryView toSearchHistory(SearchHistory entry) {
    return new SearchHistoryView(
        entry.getId(),
        entry.getUserId(),
        entry.getQuery(),
        entry.getLocationId(),
        entry.getLocationName(),
        entry.getCountry(),
        entry.getLatitude(),
        entry.getLongitude(),
        Timestamps.format(entry.getSearchedAt()));
  }

  public NotificationView toNotification(Notification notification) {
    return new NotificationView(
        notification.getId(),
        notification.getUserId(),
        notification.getTitle(),
        notification.getBody(),
        notification.getType(),
        notification.isRead(),
        parseJson(notification.getMetadata()),
        Timestamps.format(notification.getCreatedAt()),
        Timestamps.format(notification.getUpdatedAt()));
  }

  public String writeJson(Object value) {
    return value == null ? null : jsonMapper.writeValueAsString(value);
  }

  private Object parseJson(String json) {
    return json == null ? null : jsonMapper.readValue(json, Object.class);
  }
}
