package com.weather.dto;

public record PublicUser(
    String id,
    String email,
    String name,
    String avatarUrl,
    String createdAt,
    String updatedAt,
    UserSettingsDtos.UserSettingsView settings) {
}
