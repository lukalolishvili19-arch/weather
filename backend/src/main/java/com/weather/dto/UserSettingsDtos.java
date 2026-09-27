package com.weather.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import com.weather.dto.validation.Patterns;
import com.weather.entity.TemperatureUnit;
import com.weather.entity.Theme;
import com.weather.entity.WindSpeedUnit;

public final class UserSettingsDtos {

  private UserSettingsDtos() {
  }

  public record UserSettingsView(
      String id,
      String userId,
      Theme theme,
      String language,
      TemperatureUnit temperatureUnit,
      WindSpeedUnit windSpeedUnit,
      boolean timeFormat24h,
      boolean animateCharts,
      boolean showFeelsLike,
      boolean rainAlerts,
      boolean stormWarnings,
      boolean highUvAlerts,
      boolean heatWarnings,
      boolean strongWindAlerts,
      boolean snowAlerts,
      boolean dailyForecast,
      String createdAt,
      String updatedAt) {
  }

  /** Optional keys of {@code updateUserSettingsSchema}; every key is optional but not nullable. */
  public static class UpdateUserSettingsRequest extends PatchRequest {

    private Theme theme;

    @Size(min = 2, message = "String must contain at least 2 character(s)")
    @Size(max = 16, message = "String must contain at most 16 character(s)")
    private String language;

    private TemperatureUnit temperatureUnit;
    private WindSpeedUnit windSpeedUnit;
    private Boolean timeFormat24h;
    private Boolean animateCharts;
    private Boolean showFeelsLike;
    private Boolean rainAlerts;
    private Boolean stormWarnings;
    private Boolean highUvAlerts;
    private Boolean heatWarnings;
    private Boolean strongWindAlerts;
    private Boolean snowAlerts;
    private Boolean dailyForecast;

    public Theme getTheme() {
      return theme;
    }

    public void setTheme(Theme theme) {
      markNonNull("theme", theme, "'DARK' | 'LIGHT' | 'SYSTEM'");
      this.theme = theme;
    }

    public String getLanguage() {
      return language;
    }

    public void setLanguage(String language) {
      markNonNull("language", language, "string");
      this.language = Patterns.trim(language);
    }

    public TemperatureUnit getTemperatureUnit() {
      return temperatureUnit;
    }

    public void setTemperatureUnit(TemperatureUnit temperatureUnit) {
      markNonNull("temperatureUnit", temperatureUnit, "'CELSIUS' | 'FAHRENHEIT'");
      this.temperatureUnit = temperatureUnit;
    }

    public WindSpeedUnit getWindSpeedUnit() {
      return windSpeedUnit;
    }

    public void setWindSpeedUnit(WindSpeedUnit windSpeedUnit) {
      markNonNull("windSpeedUnit", windSpeedUnit, "'KMH' | 'MPH' | 'MS'");
      this.windSpeedUnit = windSpeedUnit;
    }

    public Boolean getTimeFormat24h() {
      return timeFormat24h;
    }

    public void setTimeFormat24h(Boolean value) {
      markNonNull("timeFormat24h", value, "boolean");
      this.timeFormat24h = value;
    }

    public Boolean getAnimateCharts() {
      return animateCharts;
    }

    public void setAnimateCharts(Boolean value) {
      markNonNull("animateCharts", value, "boolean");
      this.animateCharts = value;
    }

    public Boolean getShowFeelsLike() {
      return showFeelsLike;
    }

    public void setShowFeelsLike(Boolean value) {
      markNonNull("showFeelsLike", value, "boolean");
      this.showFeelsLike = value;
    }

    public Boolean getRainAlerts() {
      return rainAlerts;
    }

    public void setRainAlerts(Boolean value) {
      markNonNull("rainAlerts", value, "boolean");
      this.rainAlerts = value;
    }

    public Boolean getStormWarnings() {
      return stormWarnings;
    }

    public void setStormWarnings(Boolean value) {
      markNonNull("stormWarnings", value, "boolean");
      this.stormWarnings = value;
    }

    public Boolean getHighUvAlerts() {
      return highUvAlerts;
    }

    public void setHighUvAlerts(Boolean value) {
      markNonNull("highUvAlerts", value, "boolean");
      this.highUvAlerts = value;
    }

    public Boolean getHeatWarnings() {
      return heatWarnings;
    }

    public void setHeatWarnings(Boolean value) {
      markNonNull("heatWarnings", value, "boolean");
      this.heatWarnings = value;
    }

    public Boolean getStrongWindAlerts() {
      return strongWindAlerts;
    }

    public void setStrongWindAlerts(Boolean value) {
      markNonNull("strongWindAlerts", value, "boolean");
      this.strongWindAlerts = value;
    }

    public Boolean getSnowAlerts() {
      return snowAlerts;
    }

    public void setSnowAlerts(Boolean value) {
      markNonNull("snowAlerts", value, "boolean");
      this.snowAlerts = value;
    }

    public Boolean getDailyForecast() {
      return dailyForecast;
    }

    public void setDailyForecast(Boolean value) {
      markNonNull("dailyForecast", value, "boolean");
      this.dailyForecast = value;
    }
  }

  /** {@code createUserSettingsSchema}: the update keys plus the owning user id. */
  public static class CreateUserSettingsRequest extends UpdateUserSettingsRequest {

    @NotNull(message = "Required")
    @Pattern(regexp = Patterns.CUID, flags = Pattern.Flag.CASE_INSENSITIVE, message = "Invalid cuid")
    private String userId;

    public String getUserId() {
      return userId;
    }

    public void setUserId(String userId) {
      this.userId = userId;
    }

    @Override
    protected boolean requiresAnyField() {
      return false;
    }
  }
}
