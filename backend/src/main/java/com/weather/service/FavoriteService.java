package com.weather.service;

import java.util.List;

import com.weather.dto.FavoriteDtos.AdminCreateFavoriteRequest;
import com.weather.dto.FavoriteDtos.CreateFavoriteRequest;
import com.weather.dto.FavoriteDtos.FavoriteView;
import com.weather.dto.FavoriteDtos.UpdateFavoriteRequest;
import com.weather.entity.Favorite;
import com.weather.exception.ApiException;
import com.weather.mapper.EntityMapper;
import com.weather.repository.FavoriteRepository;
import com.weather.repository.UserRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FavoriteService {

  private final FavoriteRepository favorites;
  private final UserRepository users;
  private final EntityMapper mapper;

  public FavoriteService(FavoriteRepository favorites, UserRepository users, EntityMapper mapper) {
    this.favorites = favorites;
    this.users = users;
    this.mapper = mapper;
  }

  @Transactional(readOnly = true)
  public List<FavoriteView> listMine(String userId) {
    return favorites.findForUser(userId).stream().map(mapper::toFavorite).toList();
  }

  @Transactional
  public FavoriteView addMine(String userId, CreateFavoriteRequest input) {
    if (favorites.findByUserIdAndLocationId(userId, input.locationId()).isPresent()) {
      throw new ApiException(409, "FAVORITE_EXISTS", "This location is already in your favorites.");
    }
    return mapper.toFavorite(favorites.saveAndFlush(newFavorite(userId, input)));
  }

  @Transactional
  public FavoriteView pinMine(String userId, String id, boolean isPinned) {
    Favorite favorite = favorites.findByIdAndUserId(id, userId).orElseThrow(() -> notFound(id));
    favorite.setPinned(isPinned);
    favorite.touch();
    return mapper.toFavorite(favorites.saveAndFlush(favorite));
  }

  @Transactional
  public void removeMine(String userId, String id) {
    if (favorites.deleteForUser(userId, id) == 0) {
      throw notFound(id);
    }
  }

  @Transactional(readOnly = true)
  public List<FavoriteView> list(String currentUserId, String userIdFilter) {
    if (userIdFilter != null) {
      Ownership.require(userIdFilter, currentUserId, "favorites");
    }
    return listMine(currentUserId);
  }

  @Transactional(readOnly = true)
  public FavoriteView getById(String currentUserId, String id) {
    Favorite favorite = find(id);
    Ownership.require(favorite.getUserId(), currentUserId, "favorite");
    return mapper.toFavorite(favorite);
  }

  @Transactional
  public FavoriteView create(String currentUserId, AdminCreateFavoriteRequest input) {
    Ownership.require(input.userId(), currentUserId, "favorites");
    if (!users.existsById(input.userId())) {
      throw new ApiException(404, "USER_NOT_FOUND", "User " + input.userId() + " was not found.");
    }
    return mapper.toFavorite(favorites.saveAndFlush(newFavorite(input.userId(), input.fields())));
  }

  @Transactional
  public FavoriteView update(String currentUserId, String id, UpdateFavoriteRequest input) {
    Favorite favorite = find(id);
    Ownership.require(favorite.getUserId(), currentUserId, "favorite");
    if (input.has("locationId")) favorite.setLocationId(input.getLocationId());
    if (input.has("locationName")) favorite.setLocationName(input.getLocationName());
    if (input.has("country")) favorite.setCountry(input.getCountry());
    if (input.has("latitude")) favorite.setLatitude(input.getLatitude());
    if (input.has("longitude")) favorite.setLongitude(input.getLongitude());
    if (input.has("isPinned")) favorite.setPinned(input.getIsPinned());
    favorite.touch();
    return mapper.toFavorite(favorites.saveAndFlush(favorite));
  }

  @Transactional
  public void remove(String currentUserId, String id) {
    Favorite favorite = find(id);
    Ownership.require(favorite.getUserId(), currentUserId, "favorite");
    favorites.delete(favorite);
  }

  private Favorite find(String id) {
    return favorites.findById(id).orElseThrow(() -> notFound(id));
  }

  private static Favorite newFavorite(String userId, CreateFavoriteRequest input) {
    Favorite favorite = new Favorite();
    favorite.setUserId(userId);
    favorite.setLocationId(input.locationId());
    favorite.setLocationName(input.locationName());
    favorite.setCountry(input.country());
    favorite.setLatitude(input.latitude());
    favorite.setLongitude(input.longitude());
    favorite.setPinned(Boolean.TRUE.equals(input.isPinned()));
    return favorite;
  }

  private static ApiException notFound(String id) {
    return new ApiException(404, "FAVORITE_NOT_FOUND", "Favorite " + id + " was not found.");
  }
}
