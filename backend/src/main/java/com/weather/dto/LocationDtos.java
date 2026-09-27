package com.weather.dto;

import java.util.List;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;

import com.weather.dto.validation.Patterns;

public final class LocationDtos {

  private LocationDtos() {
  }

  public record LocationSuggestion(
      String id,
      String label,
      String name,
      String country,
      String admin1,
      double latitude,
      double longitude,
      String type,
      String weatherQuery) {
  }

  public record SuggestionsResult(List<LocationSuggestion> suggestions) {
  }

  public record ResolveLocationRequest(
      @Size(min = 1, message = "String must contain at least 1 character(s)")
      @Size(max = 200, message = "String must contain at most 200 character(s)")
      String q,
      @DecimalMin(value = "-90", message = "Number must be greater than or equal to -90")
      @DecimalMax(value = "90", message = "Number must be less than or equal to 90")
      Double latitude,
      @DecimalMin(value = "-180", message = "Number must be greater than or equal to -180")
      @DecimalMax(value = "180", message = "Number must be less than or equal to 180")
      Double longitude) {

    public ResolveLocationRequest {
      q = Patterns.trim(q);
    }

    public boolean hasCoordinates() {
      return latitude != null && longitude != null;
    }
  }
}
