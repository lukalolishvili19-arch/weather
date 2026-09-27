package com.weather.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.weather.dto.validation.Patterns;

public final class FavoriteDtos {

  private FavoriteDtos() {
  }

  public record FavoriteView(
      String id,
      String userId,
      String locationId,
      String locationName,
      String country,
      Double latitude,
      Double longitude,
      @JsonProperty("isPinned") boolean isPinned,
      String createdAt,
      String updatedAt) {
  }

  /** {@code createFavoriteForUserSchema} (POST /favorites/me). */
  public record CreateFavoriteRequest(
      @NotNull(message = "Required")
      @Size(min = 1, message = "String must contain at least 1 character(s)")
      @Size(max = 120, message = "String must contain at most 120 character(s)")
      String locationId,
      @NotNull(message = "Required")
      @Size(min = 1, message = "String must contain at least 1 character(s)")
      @Size(max = 120, message = "String must contain at most 120 character(s)")
      String locationName,
      @Size(min = 1, message = "String must contain at least 1 character(s)")
      @Size(max = 120, message = "String must contain at most 120 character(s)")
      String country,
      @DecimalMin(value = "-90", message = "Number must be greater than or equal to -90")
      @DecimalMax(value = "90", message = "Number must be less than or equal to 90")
      Double latitude,
      @DecimalMin(value = "-180", message = "Number must be greater than or equal to -180")
      @DecimalMax(value = "180", message = "Number must be less than or equal to 180")
      Double longitude,
      @JsonProperty("isPinned") Boolean isPinned) {

    public CreateFavoriteRequest {
      locationId = Patterns.trim(locationId);
      locationName = Patterns.trim(locationName);
      country = Patterns.trim(country);
    }
  }

  /** {@code createFavoriteSchema} (POST /favorites). */
  public record AdminCreateFavoriteRequest(
      @NotNull(message = "Required")
      @Pattern(regexp = Patterns.CUID, flags = Pattern.Flag.CASE_INSENSITIVE, message = "Invalid cuid")
      String userId,
      @NotNull(message = "Required")
      @Size(min = 1, message = "String must contain at least 1 character(s)")
      @Size(max = 120, message = "String must contain at most 120 character(s)")
      String locationId,
      @NotNull(message = "Required")
      @Size(min = 1, message = "String must contain at least 1 character(s)")
      @Size(max = 120, message = "String must contain at most 120 character(s)")
      String locationName,
      @Size(min = 1, message = "String must contain at least 1 character(s)")
      @Size(max = 120, message = "String must contain at most 120 character(s)")
      String country,
      @DecimalMin(value = "-90", message = "Number must be greater than or equal to -90")
      @DecimalMax(value = "90", message = "Number must be less than or equal to 90")
      Double latitude,
      @DecimalMin(value = "-180", message = "Number must be greater than or equal to -180")
      @DecimalMax(value = "180", message = "Number must be less than or equal to 180")
      Double longitude,
      @JsonProperty("isPinned") Boolean isPinned) {

    public AdminCreateFavoriteRequest {
      locationId = Patterns.trim(locationId);
      locationName = Patterns.trim(locationName);
      country = Patterns.trim(country);
    }

    public CreateFavoriteRequest fields() {
      return new CreateFavoriteRequest(locationId, locationName, country, latitude, longitude, isPinned);
    }
  }

  public record PinFavoriteRequest(
      @NotNull(message = "Required") @JsonProperty("isPinned") Boolean isPinned) {
  }

  public static class UpdateFavoriteRequest extends PatchRequest {

    @Size(min = 1, message = "String must contain at least 1 character(s)")
    @Size(max = 120, message = "String must contain at most 120 character(s)")
    private String locationId;

    @Size(min = 1, message = "String must contain at least 1 character(s)")
    @Size(max = 120, message = "String must contain at most 120 character(s)")
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

    private Boolean isPinned;

    public String getLocationId() {
      return locationId;
    }

    public void setLocationId(String locationId) {
      markNonNull("locationId", locationId, "string");
      this.locationId = Patterns.trim(locationId);
    }

    public String getLocationName() {
      return locationName;
    }

    public void setLocationName(String locationName) {
      markNonNull("locationName", locationName, "string");
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

    @JsonProperty("isPinned")
    public Boolean getIsPinned() {
      return isPinned;
    }

    @JsonProperty("isPinned")
    public void setIsPinned(Boolean isPinned) {
      markNonNull("isPinned", isPinned, "boolean");
      this.isPinned = isPinned;
    }
  }
}
