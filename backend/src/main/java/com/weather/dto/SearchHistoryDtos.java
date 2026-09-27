package com.weather.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import com.weather.dto.validation.Patterns;

public final class SearchHistoryDtos {

  private SearchHistoryDtos() {
  }

  public record SearchHistoryView(
      String id,
      String userId,
      String query,
      String locationId,
      String locationName,
      String country,
      Double latitude,
      Double longitude,
      String searchedAt) {
  }

  /** {@code recordSearchHistorySchema} (POST /search-history/me). */
  public record RecordSearchRequest(
      @NotNull(message = "Required")
      @Size(min = 1, message = "String must contain at least 1 character(s)")
      @Size(max = 255, message = "String must contain at most 255 character(s)")
      String query,
      @Size(min = 1, message = "String must contain at least 1 character(s)")
      @Size(max = 120, message = "String must contain at most 120 character(s)")
      String locationId,
      @Size(min = 1, message = "String must contain at least 1 character(s)")
      @Size(max = 200, message = "String must contain at most 200 character(s)")
      String locationName,
      @Size(min = 1, message = "String must contain at least 1 character(s)")
      @Size(max = 120, message = "String must contain at most 120 character(s)")
      String country,
      @DecimalMin(value = "-90", message = "Number must be greater than or equal to -90")
      @DecimalMax(value = "90", message = "Number must be less than or equal to 90")
      Double latitude,
      @DecimalMin(value = "-180", message = "Number must be greater than or equal to -180")
      @DecimalMax(value = "180", message = "Number must be less than or equal to 180")
      Double longitude) {

    public RecordSearchRequest {
      query = Patterns.trim(query);
      locationId = Patterns.trim(locationId);
      locationName = Patterns.trim(locationName);
      country = Patterns.trim(country);
    }
  }

  /** {@code createSearchHistorySchema} (POST /search-history). */
  public record AdminCreateSearchRequest(
      @NotNull(message = "Required")
      @Pattern(regexp = Patterns.CUID, flags = Pattern.Flag.CASE_INSENSITIVE, message = "Invalid cuid")
      String userId,
      @NotNull(message = "Required")
      @Size(min = 1, message = "String must contain at least 1 character(s)")
      @Size(max = 255, message = "String must contain at most 255 character(s)")
      String query,
      @Size(min = 1, message = "String must contain at least 1 character(s)")
      @Size(max = 120, message = "String must contain at most 120 character(s)")
      String locationId,
      @Size(min = 1, message = "String must contain at least 1 character(s)")
      @Size(max = 200, message = "String must contain at most 200 character(s)")
      String locationName,
      @Size(min = 1, message = "String must contain at least 1 character(s)")
      @Size(max = 120, message = "String must contain at most 120 character(s)")
      String country,
      @DecimalMin(value = "-90", message = "Number must be greater than or equal to -90")
      @DecimalMax(value = "90", message = "Number must be less than or equal to 90")
      Double latitude,
      @DecimalMin(value = "-180", message = "Number must be greater than or equal to -180")
      @DecimalMax(value = "180", message = "Number must be less than or equal to 180")
      Double longitude) {

    public AdminCreateSearchRequest {
      query = Patterns.trim(query);
      locationId = Patterns.trim(locationId);
      locationName = Patterns.trim(locationName);
      country = Patterns.trim(country);
    }

    public RecordSearchRequest fields() {
      return new RecordSearchRequest(query, locationId, locationName, country, latitude, longitude);
    }
  }

  public static class UpdateSearchRequest extends PatchRequest {

    @Size(min = 1, message = "String must contain at least 1 character(s)")
    @Size(max = 255, message = "String must contain at most 255 character(s)")
    private String query;

    @Size(min = 1, message = "String must contain at least 1 character(s)")
    @Size(max = 120, message = "String must contain at most 120 character(s)")
    private String locationId;

    @Size(min = 1, message = "String must contain at least 1 character(s)")
    @Size(max = 200, message = "String must contain at most 200 character(s)")
    private String locationName;

    @Size(min = 1, message = "String must contain at least 1 character(s)")
    @Size(max = 120, message = "String must contain at most 120 character(s)")
    private String country;

    @DecimalMin(value = "-90", message = "Number must be greater than or equal to -90")
    @DecimalMax(value = "90", message = "Number must be less than or equal to 90")
    private Double latitude;

    @DecimalMin(value = "-180", message = "Number must be greater than or equal to -180")
    @DecimalMax(value = "180", message = "Number must be less than or equal to 180")
    private Double longitude;

    public String getQuery() {
      return query;
    }

    public void setQuery(String query) {
      markNonNull("query", query, "string");
      this.query = Patterns.trim(query);
    }

    public String getLocationId() {
      return locationId;
    }

    public void setLocationId(String locationId) {
      mark("locationId");
      this.locationId = Patterns.trim(locationId);
    }

    public String getLocationName() {
      return locationName;
    }

    public void setLocationName(String locationName) {
      mark("locationName");
      this.locationName = Patterns.trim(locationName);
    }

    public String getCountry() {
      return country;
    }

    public void setCountry(String country) {
      mark("country");
      this.country = Patterns.trim(country);
    }

    public Double getLatitude() {
      return latitude;
    }

    public void setLatitude(Double latitude) {
      mark("latitude");
      this.latitude = latitude;
    }

    public Double getLongitude() {
      return longitude;
    }

    public void setLongitude(Double longitude) {
      mark("longitude");
      this.longitude = longitude;
    }
  }
}
