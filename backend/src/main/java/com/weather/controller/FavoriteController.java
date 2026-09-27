package com.weather.controller;

import java.util.List;

import com.weather.dto.ApiResponse;
import com.weather.dto.FavoriteDtos.AdminCreateFavoriteRequest;
import com.weather.dto.FavoriteDtos.CreateFavoriteRequest;
import com.weather.dto.FavoriteDtos.FavoriteView;
import com.weather.dto.FavoriteDtos.PinFavoriteRequest;
import com.weather.dto.FavoriteDtos.UpdateFavoriteRequest;
import com.weather.security.CurrentUser;
import com.weather.service.FavoriteService;

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
@RequestMapping("/api/v1/favorites")
public class FavoriteController {

  private final FavoriteService favorites;
  private final RequestValidator validator;

  public FavoriteController(FavoriteService favorites, RequestValidator validator) {
    this.favorites = favorites;
    this.validator = validator;
  }

  @GetMapping("/me")
  public ApiResponse<List<FavoriteView>> listMine() {
    return ApiResponse.of(favorites.listMine(CurrentUser.id()));
  }

  @PostMapping("/me")
  @ResponseStatus(HttpStatus.CREATED)
  public ApiResponse<FavoriteView> addMine(@RequestBody(required = false) CreateFavoriteRequest body) {
    String userId = CurrentUser.id();
    return ApiResponse.of(favorites.addMine(userId, validator.body(body)));
  }

  @PatchMapping("/me/{id}/pin")
  public ApiResponse<FavoriteView> pinMine(@PathVariable String id,
      @RequestBody(required = false) PinFavoriteRequest body) {
    RequestValidator.cuid("id", id);
    PinFavoriteRequest input = validator.body(body);
    return ApiResponse.of(favorites.pinMine(CurrentUser.id(), id, input.isPinned()));
  }

  @DeleteMapping("/me/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void deleteMine(@PathVariable String id) {
    favorites.removeMine(CurrentUser.id(), RequestValidator.cuid("id", id));
  }

  @GetMapping({"", "/"})
  public ApiResponse<List<FavoriteView>> list(@RequestParam(required = false) String userId) {
    return ApiResponse.of(favorites.list(CurrentUser.id(), userId));
  }

  @PostMapping({"", "/"})
  @ResponseStatus(HttpStatus.CREATED)
  public ApiResponse<FavoriteView> create(@RequestBody(required = false) AdminCreateFavoriteRequest body) {
    String userId = CurrentUser.id();
    return ApiResponse.of(favorites.create(userId, validator.body(body)));
  }

  @GetMapping("/{id}")
  public ApiResponse<FavoriteView> get(@PathVariable String id) {
    return ApiResponse.of(favorites.getById(CurrentUser.id(), RequestValidator.cuid("id", id)));
  }

  @PatchMapping("/{id}")
  public ApiResponse<FavoriteView> update(@PathVariable String id,
      @RequestBody(required = false) UpdateFavoriteRequest body) {
    RequestValidator.cuid("id", id);
    return ApiResponse.of(favorites.update(CurrentUser.id(), id, validator.body(body)));
  }

  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void delete(@PathVariable String id) {
    favorites.remove(CurrentUser.id(), RequestValidator.cuid("id", id));
  }
}
