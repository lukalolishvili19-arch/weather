package com.weather.service;

import java.util.List;

import com.weather.dto.SearchHistoryDtos.AdminCreateSearchRequest;
import com.weather.dto.SearchHistoryDtos.RecordSearchRequest;
import com.weather.dto.SearchHistoryDtos.SearchHistoryView;
import com.weather.dto.SearchHistoryDtos.UpdateSearchRequest;
import com.weather.entity.SearchHistory;
import com.weather.exception.ApiException;
import com.weather.mapper.EntityMapper;
import com.weather.repository.SearchHistoryRepository;
import com.weather.repository.UserRepository;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SearchHistoryService {

  private static final int ADMIN_LIST_LIMIT = 50;

  private final SearchHistoryRepository history;
  private final UserRepository users;
  private final EntityMapper mapper;

  public SearchHistoryService(SearchHistoryRepository history, UserRepository users, EntityMapper mapper) {
    this.history = history;
    this.users = users;
    this.mapper = mapper;
  }

  @Transactional(readOnly = true)
  public List<SearchHistoryView> listMine(String userId, int limit) {
    return history.findForUser(userId, PageRequest.of(0, limit)).stream().map(mapper::toSearchHistory).toList();
  }

  /** Replaces earlier entries with the same query (case-insensitive) so the newest search wins. */
  @Transactional
  public SearchHistoryView recordMine(String userId, RecordSearchRequest input) {
    history.deleteByQueryIgnoreCase(userId, input.query());
    return mapper.toSearchHistory(history.saveAndFlush(newEntry(userId, input)));
  }

  @Transactional
  public void removeMine(String userId, String id) {
    if (history.deleteForUser(userId, id) == 0) {
      throw notFound(id);
    }
  }

  @Transactional
  public void clearMine(String userId) {
    history.deleteAllForUser(userId);
  }

  @Transactional(readOnly = true)
  public List<SearchHistoryView> list(String currentUserId, String userIdFilter) {
    if (userIdFilter != null) {
      Ownership.require(userIdFilter, currentUserId, "search history");
    }
    return listMine(currentUserId, ADMIN_LIST_LIMIT);
  }

  @Transactional(readOnly = true)
  public SearchHistoryView getById(String currentUserId, String id) {
    SearchHistory entry = find(id);
    Ownership.require(entry.getUserId(), currentUserId, "search history");
    return mapper.toSearchHistory(entry);
  }

  @Transactional
  public SearchHistoryView create(String currentUserId, AdminCreateSearchRequest input) {
    Ownership.require(input.userId(), currentUserId, "search history");
    if (!users.existsById(input.userId())) {
      throw new ApiException(404, "USER_NOT_FOUND", "User " + input.userId() + " was not found.");
    }
    return mapper.toSearchHistory(history.saveAndFlush(newEntry(input.userId(), input.fields())));
  }

  @Transactional
  public SearchHistoryView update(String currentUserId, String id, UpdateSearchRequest input) {
    SearchHistory entry = find(id);
    Ownership.require(entry.getUserId(), currentUserId, "search history");
    if (input.has("query")) entry.setQuery(input.getQuery());
    if (input.has("locationId")) entry.setLocationId(input.getLocationId());
    if (input.has("locationName")) entry.setLocationName(input.getLocationName());
    if (input.has("country")) entry.setCountry(input.getCountry());
    if (input.has("latitude")) entry.setLatitude(input.getLatitude());
    if (input.has("longitude")) entry.setLongitude(input.getLongitude());
    return mapper.toSearchHistory(history.saveAndFlush(entry));
  }

  @Transactional
  public void remove(String currentUserId, String id) {
    SearchHistory entry = find(id);
    Ownership.require(entry.getUserId(), currentUserId, "search history");
    history.delete(entry);
  }

  private SearchHistory find(String id) {
    return history.findById(id).orElseThrow(() -> notFound(id));
  }

  private static SearchHistory newEntry(String userId, RecordSearchRequest input) {
    SearchHistory entry = new SearchHistory();
    entry.setUserId(userId);
    entry.setQuery(input.query());
    entry.setLocationId(input.locationId());
    entry.setLocationName(input.locationName());
    entry.setCountry(input.country());
    entry.setLatitude(input.latitude());
    entry.setLongitude(input.longitude());
    return entry;
  }

  private static ApiException notFound(String id) {
    return new ApiException(404, "SEARCH_HISTORY_NOT_FOUND", "Search history " + id + " was not found.");
  }
}
