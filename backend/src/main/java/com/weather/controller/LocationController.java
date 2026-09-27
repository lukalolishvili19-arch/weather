package com.weather.controller;

import jakarta.servlet.http.HttpServletRequest;

import com.weather.dto.ApiResponse;
import com.weather.dto.LocationDtos.LocationSuggestion;
import com.weather.dto.LocationDtos.ResolveLocationRequest;
import com.weather.dto.LocationDtos.SuggestionsResult;
import com.weather.exception.ValidationException;
import com.weather.service.LocationService;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/locations")
public class LocationController {

  private final LocationService locations;
  private final RequestValidator validator;

  public LocationController(LocationService locations, RequestValidator validator) {
    this.locations = locations;
    this.validator = validator;
  }

  @GetMapping("/autocomplete")
  public ApiResponse<SuggestionsResult> autocomplete(HttpServletRequest request) {
    QueryParams query = new QueryParams(request);
    String q = query.requiredString("q", 1, 200);
    int limit = query.integer("limit", 1, 24, 12);
    query.validate();
    return ApiResponse.of(locations.autocomplete(q, limit));
  }

  @GetMapping("/suggestions")
  public ApiResponse<SuggestionsResult> suggestions(HttpServletRequest request) {
    QueryParams query = new QueryParams(request);
    String q = query.optionalString("q", 200);
    int limit = query.integer("limit", 1, 24, 12);
    query.validate();
    return ApiResponse.of(locations.suggestions(q, limit));
  }

  @PostMapping("/resolve")
  public ApiResponse<LocationSuggestion> resolve(@RequestBody(required = false) ResolveLocationRequest body) {
    ResolveLocationRequest input = validator.body(body);
    if (input.hasCoordinates()) {
      return ApiResponse.of(locations.resolveCoordinates(input.latitude(), input.longitude()));
    }
    if (input.q() == null || input.q().isEmpty()) {
      throw ValidationException.form("Provide q or latitude+longitude");
    }
    return ApiResponse.of(locations.resolveQuery(input.q()));
  }
}
