package com.weather.controller;

import java.util.List;

import com.weather.dto.ApiResponse;
import com.weather.dto.UserSettingsDtos.CreateUserSettingsRequest;
import com.weather.dto.UserSettingsDtos.UpdateUserSettingsRequest;
import com.weather.dto.UserSettingsDtos.UserSettingsView;
import com.weather.security.CurrentUser;
import com.weather.service.UserSettingsService;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/user-settings")
public class UserSettingsController {

  private final UserSettingsService settings;
  private final RequestValidator validator;

  public UserSettingsController(UserSettingsService settings, RequestValidator validator) {
    this.settings = settings;
    this.validator = validator;
  }

  @GetMapping("/me")
  public ApiResponse<UserSettingsView> getMine() {
    return ApiResponse.of(settings.getOrCreateMine(CurrentUser.id()));
  }

  @PatchMapping("/me")
  public ApiResponse<UserSettingsView> updateMine(@RequestBody(required = false) UpdateUserSettingsRequest body) {
    String userId = CurrentUser.id();
    return ApiResponse.of(settings.updateMine(userId, validator.body(body)));
  }

  @GetMapping({"", "/"})
  public ApiResponse<List<UserSettingsView>> list() {
    return ApiResponse.of(settings.list(CurrentUser.id()));
  }

  @PostMapping({"", "/"})
  @ResponseStatus(HttpStatus.CREATED)
  public ApiResponse<UserSettingsView> create(@RequestBody(required = false) CreateUserSettingsRequest body) {
    String userId = CurrentUser.id();
    return ApiResponse.of(settings.create(userId, validator.body(body)));
  }

  @GetMapping("/by-user/{userId}")
  public ApiResponse<UserSettingsView> getByUser(@PathVariable String userId) {
    return ApiResponse.of(settings.getByUserId(CurrentUser.id(), RequestValidator.cuid("userId", userId)));
  }

  @GetMapping("/{id}")
  public ApiResponse<UserSettingsView> get(@PathVariable String id) {
    return ApiResponse.of(settings.getById(CurrentUser.id(), RequestValidator.cuid("id", id)));
  }

  @PatchMapping("/{id}")
  public ApiResponse<UserSettingsView> update(@PathVariable String id,
      @RequestBody(required = false) UpdateUserSettingsRequest body) {
    RequestValidator.cuid("id", id);
    return ApiResponse.of(settings.update(CurrentUser.id(), id, validator.body(body)));
  }

  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void delete(@PathVariable String id) {
    settings.remove(CurrentUser.id(), RequestValidator.cuid("id", id));
  }
}
