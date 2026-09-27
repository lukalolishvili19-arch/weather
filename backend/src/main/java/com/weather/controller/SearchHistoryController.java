package com.weather.controller;

import java.util.List;

import jakarta.servlet.http.HttpServletRequest;

import com.weather.dto.ApiResponse;
import com.weather.dto.SearchHistoryDtos.AdminCreateSearchRequest;
import com.weather.dto.SearchHistoryDtos.RecordSearchRequest;
import com.weather.dto.SearchHistoryDtos.SearchHistoryView;
import com.weather.dto.SearchHistoryDtos.UpdateSearchRequest;
import com.weather.security.CurrentUser;
import com.weather.service.SearchHistoryService;

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
@RequestMapping("/api/v1/search-history")
public class SearchHistoryController {

  /**
   * The Node API validated {@code ?limit} (1–100) but its controller then only honoured string
   * values, which the validator had already converted to numbers, so every response held at most
   * 20 entries. The frontend relies on that, so the effective limit stays fixed.
   */
  private static final int EFFECTIVE_LIMIT = 20;

  private final SearchHistoryService history;
  private final RequestValidator validator;

  public SearchHistoryController(SearchHistoryService history, RequestValidator validator) {
    this.history = history;
    this.validator = validator;
  }

  @GetMapping("/me")
  public ApiResponse<List<SearchHistoryView>> listMine(HttpServletRequest request) {
    QueryParams query = new QueryParams(request);
    query.integer("limit", 1, 100, 20);
    query.validate();
    return ApiResponse.of(history.listMine(CurrentUser.id(), EFFECTIVE_LIMIT));
  }

  @PostMapping("/me")
  @ResponseStatus(HttpStatus.CREATED)
  public ApiResponse<SearchHistoryView> recordMine(@RequestBody(required = false) RecordSearchRequest body) {
    String userId = CurrentUser.id();
    return ApiResponse.of(history.recordMine(userId, validator.body(body)));
  }

  @DeleteMapping("/me")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void clearMine() {
    history.clearMine(CurrentUser.id());
  }

  @DeleteMapping("/me/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void deleteMine(@PathVariable String id) {
    history.removeMine(CurrentUser.id(), RequestValidator.cuid("id", id));
  }

  @GetMapping({"", "/"})
  public ApiResponse<List<SearchHistoryView>> list(@RequestParam(required = false) String userId) {
    return ApiResponse.of(history.list(CurrentUser.id(), userId));
  }

  @PostMapping({"", "/"})
  @ResponseStatus(HttpStatus.CREATED)
  public ApiResponse<SearchHistoryView> create(@RequestBody(required = false) AdminCreateSearchRequest body) {
    String userId = CurrentUser.id();
    return ApiResponse.of(history.create(userId, validator.body(body)));
  }

  @GetMapping("/{id}")
  public ApiResponse<SearchHistoryView> get(@PathVariable String id) {
    return ApiResponse.of(history.getById(CurrentUser.id(), RequestValidator.cuid("id", id)));
  }

  @PatchMapping("/{id}")
  public ApiResponse<SearchHistoryView> update(@PathVariable String id,
      @RequestBody(required = false) UpdateSearchRequest body) {
    RequestValidator.cuid("id", id);
    return ApiResponse.of(history.update(CurrentUser.id(), id, validator.body(body)));
  }

  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void delete(@PathVariable String id) {
    history.remove(CurrentUser.id(), RequestValidator.cuid("id", id));
  }
}
