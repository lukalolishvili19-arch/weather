package com.weather.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "user_settings")
public class UserSettings {

  @Id
  private String id;

  @Column(nullable = false)
  private String userId;

  @Enumerated(EnumType.STRING)
  @JdbcTypeCode(SqlTypes.NAMED_ENUM)
  @Column(nullable = false, columnDefinition = "\"Theme\"")
  private Theme theme = Theme.DARK;

  @Column(nullable = false)
  private String language = "en";

  @Enumerated(EnumType.STRING)
  @JdbcTypeCode(SqlTypes.NAMED_ENUM)
  @Column(nullable = false, columnDefinition = "\"TemperatureUnit\"")
  private TemperatureUnit temperatureUnit = TemperatureUnit.CELSIUS;

  @Enumerated(EnumType.STRING)
  @JdbcTypeCode(SqlTypes.NAMED_ENUM)
  @Column(nullable = false, columnDefinition = "\"WindSpeedUnit\"")
  private WindSpeedUnit windSpeedUnit = WindSpeedUnit.KMH;

  @Column(nullable = false)
  private boolean timeFormat24h = true;

  @Column(nullable = false)
  private boolean animateCharts = true;

  @Column(nullable = false)
  private boolean showFeelsLike = true;

  @Column(nullable = false)
  private boolean rainAlerts = true;

  @Column(nullable = false)
  private boolean stormWarnings = true;

  @Column(nullable = false)
  private boolean highUvAlerts = true;

  @Column(nullable = false)
  private boolean heatWarnings = true;

  @Column(nullable = false)
  private boolean strongWindAlerts = false;

  @Column(nullable = false)
  private boolean snowAlerts = false;

  @Column(nullable = false)
  private boolean dailyForecast = true;

  @Column(nullable = false, updatable = false)
  private LocalDateTime createdAt;

  @Column(nullable = false)
  private LocalDateTime updatedAt;

  protected UserSettings() {
  }

  public UserSettings(String userId) {
    this.userId = userId;
  }

  @PrePersist
  void prePersist() {
    if (id == null) {
      id = Cuid.next();
    }
    LocalDateTime now = Timestamps.now();
    if (createdAt == null) {
      createdAt = now;
    }
    if (updatedAt == null) {
      updatedAt = now;
    }
  }

  public void touch() {
    updatedAt = Timestamps.now();
  }

  public String getId() {
    return id;
  }

  public String getUserId() {
    return userId;
  }

  public Theme getTheme() {
    return theme;
  }

  public void setTheme(Theme theme) {
    this.theme = theme;
  }

  public String getLanguage() {
    return language;
  }

  public void setLanguage(String language) {
    this.language = language;
  }

  public TemperatureUnit getTemperatureUnit() {
    return temperatureUnit;
  }

  public void setTemperatureUnit(TemperatureUnit temperatureUnit) {
    this.temperatureUnit = temperatureUnit;
  }

  public WindSpeedUnit getWindSpeedUnit() {
    return windSpeedUnit;
  }

  public void setWindSpeedUnit(WindSpeedUnit windSpeedUnit) {
    this.windSpeedUnit = windSpeedUnit;
  }

  public boolean isTimeFormat24h() {
    return timeFormat24h;
  }

  public void setTimeFormat24h(boolean timeFormat24h) {
    this.timeFormat24h = timeFormat24h;
  }

  public boolean isAnimateCharts() {
    return animateCharts;
  }

  public void setAnimateCharts(boolean animateCharts) {
    this.animateCharts = animateCharts;
  }

  public boolean isShowFeelsLike() {
    return showFeelsLike;
  }

  public void setShowFeelsLike(boolean showFeelsLike) {
    this.showFeelsLike = showFeelsLike;
  }

  public boolean isRainAlerts() {
    return rainAlerts;
  }

  public void setRainAlerts(boolean rainAlerts) {
    this.rainAlerts = rainAlerts;
  }

  public boolean isStormWarnings() {
    return stormWarnings;
  }

  public void setStormWarnings(boolean stormWarnings) {
    this.stormWarnings = stormWarnings;
  }

  public boolean isHighUvAlerts() {
    return highUvAlerts;
  }

  public void setHighUvAlerts(boolean highUvAlerts) {
    this.highUvAlerts = highUvAlerts;
  }

  public boolean isHeatWarnings() {
    return heatWarnings;
  }

  public void setHeatWarnings(boolean heatWarnings) {
    this.heatWarnings = heatWarnings;
  }

  public boolean isStrongWindAlerts() {
    return strongWindAlerts;
  }

  public void setStrongWindAlerts(boolean strongWindAlerts) {
    this.strongWindAlerts = strongWindAlerts;
  }

  public boolean isSnowAlerts() {
    return snowAlerts;
  }

  public void setSnowAlerts(boolean snowAlerts) {
    this.snowAlerts = snowAlerts;
  }

  public boolean isDailyForecast() {
    return dailyForecast;
  }

  public void setDailyForecast(boolean dailyForecast) {
    this.dailyForecast = dailyForecast;
  }

  public LocalDateTime getCreatedAt() {
    return createdAt;
  }

  public LocalDateTime getUpdatedAt() {
    return updatedAt;
  }
}
