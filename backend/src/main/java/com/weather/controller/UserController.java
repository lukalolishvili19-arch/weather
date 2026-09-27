package com.weather.controller;

import java.util.List;

import com.weather.dto.ApiResponse;
import com.weather.dto.PublicUser;
import com.weather.dto.UserDtos.CreateUserRequest;
import com.weather.dto.UserDtos.UpdateUserRequest;
import com.weather.security.CurrentUser;
import com.weather.service.UserService;

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
@RequestMapping("/api/v1/users")
public class UserController {

  private final UserService users;
  private final RequestValidator validator;

  public UserController(UserService users, RequestValidator validator) {
    this.users = users;
    this.validator = validator;
  }

  @GetMapping({"", "/"})
  public ApiResponse<List<PublicUser>> list() {
    return ApiResponse.of(users.list(CurrentUser.id()));
  }

  @PostMapping({"", "/"})
  @ResponseStatus(HttpStatus.CREATED)
  public ApiResponse<PublicUser> create(@RequestBody(required = false) CreateUserRequest body) {
    return ApiResponse.of(users.create(validator.body(body)));
  }

  @GetMapping("/{id}")
  public ApiResponse<PublicUser> get(@PathVariable String id) {
    return ApiResponse.of(users.getById(CurrentUser.id(), RequestValidator.cuid("id", id)));
  }

  @PatchMapping("/{id}")
  public ApiResponse<PublicUser> update(@PathVariable String id,
      @RequestBody(required = false) UpdateUserRequest body) {
    RequestValidator.cuid("id", id);
    return ApiResponse.of(users.update(CurrentUser.id(), id, validator.body(body)));
  }

  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void delete(@PathVariable String id) {
    users.remove(CurrentUser.id(), RequestValidator.cuid("id", id));
  }
}
