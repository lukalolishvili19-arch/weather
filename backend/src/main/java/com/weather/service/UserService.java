package com.weather.service;

import java.util.List;

import com.weather.dto.PublicUser;
import com.weather.dto.UserDtos.CreateUserRequest;
import com.weather.dto.UserDtos.UpdateUserRequest;
import com.weather.entity.User;
import com.weather.exception.ApiException;
import com.weather.mapper.EntityMapper;
import com.weather.repository.UserRepository;
import com.weather.repository.UserSettingsRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Generic {@code /users} routes. Previously any authenticated user could list, create, edit (including
 * writing a raw {@code passwordHash}) and delete every account; access is now limited to the caller.
 */
@Service
public class UserService {

  private final UserRepository users;
  private final UserSettingsRepository settings;
  private final EntityMapper mapper;

  public UserService(UserRepository users, UserSettingsRepository settings, EntityMapper mapper) {
    this.users = users;
    this.settings = settings;
    this.mapper = mapper;
  }

  @Transactional(readOnly = true)
  public List<PublicUser> list(String currentUserId) {
    return users.findById(currentUserId).map(this::toPublic).stream().toList();
  }

  @Transactional(readOnly = true)
  public PublicUser getById(String currentUserId, String id) {
    User user = find(id);
    Ownership.require(user.getId(), currentUserId, "user");
    return toPublic(user);
  }

  public PublicUser create(CreateUserRequest input) {
    throw new ApiException(403, "FORBIDDEN",
        "Creating users through this endpoint is not allowed. Use /api/v1/auth/register.");
  }

  @Transactional
  public PublicUser update(String currentUserId, String id, UpdateUserRequest input) {
    User user = find(id);
    Ownership.require(user.getId(), currentUserId, "user");
    if (input.has("passwordHash")) {
      throw new ApiException(403, "FORBIDDEN", "passwordHash cannot be modified through this endpoint.");
    }
    if (input.has("email")) user.setEmail(input.getEmail());
    if (input.has("name")) user.setName(input.getName());
    if (input.has("avatarUrl")) user.setAvatarUrl(input.getAvatarUrl());
    user.touch();
    return toPublic(users.saveAndFlush(user));
  }

  @Transactional
  public void remove(String currentUserId, String id) {
    User user = find(id);
    Ownership.require(user.getId(), currentUserId, "user");
    users.delete(user);
  }

  private User find(String id) {
    return users.findById(id)
        .orElseThrow(() -> new ApiException(404, "USER_NOT_FOUND", "User " + id + " was not found."));
  }

  private PublicUser toPublic(User user) {
    return mapper.toPublicUser(user, settings.findByUserId(user.getId()).orElse(null));
  }
}
