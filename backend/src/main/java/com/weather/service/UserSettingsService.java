package com.weather.service;

import java.util.List;

import com.weather.dto.UserSettingsDtos.CreateUserSettingsRequest;
import com.weather.dto.UserSettingsDtos.UpdateUserSettingsRequest;
import com.weather.dto.UserSettingsDtos.UserSettingsView;
import com.weather.entity.UserSettings;
import com.weather.exception.ApiException;
import com.weather.mapper.EntityMapper;
import com.weather.repository.UserRepository;
import com.weather.repository.UserSettingsRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserSettingsService {

  private final UserSettingsRepository settings;
  private final UserRepository users;
  private final EntityMapper mapper;

  public UserSettingsService(UserSettingsRepository settings, UserRepository users, EntityMapper mapper) {
    this.settings = settings;
    this.users = users;
    this.mapper = mapper;
  }

  @Transactional
  public UserSettingsView getOrCreateMine(String userId) {
    return mapper.toSettings(getOrCreateEntity(userId));
  }

  @Transactional
  public UserSettingsView updateMine(String userId, UpdateUserSettingsRequest input) {
    UserSettings entity = getOrCreateEntity(userId);
    apply(entity, input);
    return mapper.toSettings(settings.saveAndFlush(entity));
  }

  /** Settings row used by alert sync; created with defaults when missing. */
  @Transactional
  public UserSettings getOrCreateEntity(String userId) {
    requireUser(userId);
    return settings.findByUserId(userId)
        .orElseGet(() -> settings.saveAndFlush(new UserSettings(userId)));
  }

  @Transactional(readOnly = true)
  public List<UserSettingsView> list(String currentUserId) {
    return settings.findByUserId(currentUserId).stream().map(mapper::toSettings).toList();
  }

  @Transactional(readOnly = true)
  public UserSettingsView getById(String currentUserId, String id) {
    UserSettings entity = findById(id);
    Ownership.require(entity.getUserId(), currentUserId, "user settings");
    return mapper.toSettings(entity);
  }

  @Transactional(readOnly = true)
  public UserSettingsView getByUserId(String currentUserId, String userId) {
    Ownership.require(userId, currentUserId, "user settings");
    requireUser(userId);
    return settings.findByUserId(userId).map(mapper::toSettings)
        .orElseThrow(() -> new ApiException(404, "USER_SETTINGS_NOT_FOUND",
            "User settings for user " + userId + " were not found."));
  }

  @Transactional
  public UserSettingsView create(String currentUserId, CreateUserSettingsRequest input) {
    Ownership.require(input.getUserId(), currentUserId, "user settings");
    requireUser(input.getUserId());
    UserSettings entity = new UserSettings(input.getUserId());
    apply(entity, input);
    return mapper.toSettings(settings.saveAndFlush(entity));
  }

  @Transactional
  public UserSettingsView update(String currentUserId, String id, UpdateUserSettingsRequest input) {
    UserSettings entity = findById(id);
    Ownership.require(entity.getUserId(), currentUserId, "user settings");
    apply(entity, input);
    return mapper.toSettings(settings.saveAndFlush(entity));
  }

  @Transactional
  public void remove(String currentUserId, String id) {
    UserSettings entity = findById(id);
    Ownership.require(entity.getUserId(), currentUserId, "user settings");
    settings.delete(entity);
  }

  private UserSettings findById(String id) {
    return settings.findById(id).orElseThrow(() -> new ApiException(404, "USER_SETTINGS_NOT_FOUND",
        "User settings " + id + " were not found."));
  }

  private void requireUser(String userId) {
    if (!users.existsById(userId)) {
      throw new ApiException(404, "USER_NOT_FOUND", "User " + userId + " was not found.");
    }
  }

  private static void apply(UserSettings entity, UpdateUserSettingsRequest input) {
    if (input.has("theme")) entity.setTheme(input.getTheme());
    if (input.has("language")) entity.setLanguage(input.getLanguage());
    if (input.has("temperatureUnit")) entity.setTemperatureUnit(input.getTemperatureUnit());
    if (input.has("windSpeedUnit")) entity.setWindSpeedUnit(input.getWindSpeedUnit());
    if (input.has("timeFormat24h")) entity.setTimeFormat24h(input.getTimeFormat24h());
    if (input.has("animateCharts")) entity.setAnimateCharts(input.getAnimateCharts());
    if (input.has("showFeelsLike")) entity.setShowFeelsLike(input.getShowFeelsLike());
    if (input.has("rainAlerts")) entity.setRainAlerts(input.getRainAlerts());
    if (input.has("stormWarnings")) entity.setStormWarnings(input.getStormWarnings());
    if (input.has("highUvAlerts")) entity.setHighUvAlerts(input.getHighUvAlerts());
    if (input.has("heatWarnings")) entity.setHeatWarnings(input.getHeatWarnings());
    if (input.has("strongWindAlerts")) entity.setStrongWindAlerts(input.getStrongWindAlerts());
    if (input.has("snowAlerts")) entity.setSnowAlerts(input.getSnowAlerts());
    if (input.has("dailyForecast")) entity.setDailyForecast(input.getDailyForecast());
    entity.touch();
  }
}
