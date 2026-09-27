package com.weather.controller;

import java.util.List;

import jakarta.servlet.http.HttpServletRequest;

import com.weather.dto.ApiResponse;
import com.weather.dto.NotificationDtos.CreateNotificationRequest;
import com.weather.dto.NotificationDtos.NotificationView;
import com.weather.dto.NotificationDtos.SyncResult;
import com.weather.dto.NotificationDtos.UpdateNotificationRequest;
import com.weather.security.CurrentUser;
import com.weather.service.NotificationService;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/notifications")
public class NotificationController {

  private final NotificationService notifications;
  private final RequestValidator validator;

  public NotificationController(NotificationService notifications, RequestValidator validator) {
    this.notifications = notifications;
    this.validator = validator;
  }

  @GetMapping("/me")
  public ApiResponse<List<NotificationView>> listMine() {
    return ApiResponse.of(notifications.listMine(CurrentUser.id()));
  }

  @PostMapping("/me/sync")
  public ApiResponse<SyncResult> sync(HttpServletRequest request) {
    QueryParams query = new QueryParams(request);
    String location = query.requiredString("location", 1, 200);
    query.validate();
    return ApiResponse.of(notifications.syncWeatherAlerts(CurrentUser.id(), location));
  }

  @PatchMapping("/me/read-all")
  public ApiResponse<List<NotificationView>> markAllRead() {
    return ApiResponse.of(notifications.markAllRead(CurrentUser.id()));
  }

  @DeleteMapping("/me/read")
  public ApiResponse<List<NotificationView>> clearRead() {
    return ApiResponse.of(notifications.clearRead(CurrentUser.id()));
  }

  @PatchMapping("/me/{id}")
  public ApiResponse<NotificationView> updateMine(@PathVariable String id,
      @RequestBody(required = false) UpdateNotificationRequest body) {
    RequestValidator.cuid("id", id);
    return ApiResponse.of(notifications.updateMine(CurrentUser.id(), id, validator.body(body)));
  }

  @DeleteMapping("/me/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void deleteMine(@PathVariable String id) {
    notifications.removeMine(CurrentUser.id(), RequestValidator.cuid("id", id));
  }

  @GetMapping({"", "/"})
  public ApiResponse<List<NotificationView>> list(@RequestParam(required = false) String userId) {
    return ApiResponse.of(notifications.list(CurrentUser.id(), userId));
  }

  @PostMapping({"", "/"})
  @ResponseStatus(HttpStatus.CREATED)
  public ApiResponse<NotificationView> create(@RequestBody(required = false) CreateNotificationRequest body) {
    String userId = CurrentUser.id();
    return ApiResponse.of(notifications.create(userId, validator.body(body)));
  }

  @GetMapping("/{id}")
  public ApiResponse<NotificationView> get(@PathVariable String id) {
    return ApiResponse.of(notifications.getById(CurrentUser.id(), RequestValidator.cuid("id", id)));
  }

  @PatchMapping("/{id}")
  public ApiResponse<NotificationView> update(@PathVariable String id,
      @RequestBody(required = false) UpdateNotificationRequest body) {
    RequestValidator.cuid("id", id);
    return ApiResponse.of(notifications.update(CurrentUser.id(), id, validator.body(body)));
  }

  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void delete(@PathVariable String id) {
    notifications.remove(CurrentUser.id(), RequestValidator.cuid("id", id));
  }
}
