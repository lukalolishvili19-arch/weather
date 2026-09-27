package com.weather.repository;

import java.util.List;
import java.util.Optional;

import com.weather.entity.UserSettings;

import org.springframework.data.jpa.repository.JpaRepository;

public interface UserSettingsRepository extends JpaRepository<UserSettings, String> {

  Optional<UserSettings> findByUserId(String userId);

  List<UserSettings> findAllByOrderByCreatedAtDesc();
}
