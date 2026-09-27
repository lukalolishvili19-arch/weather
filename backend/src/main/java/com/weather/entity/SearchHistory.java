package com.weather.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "search_history")
public class SearchHistory {

  @Id
  private String id;

  @Column(nullable = false)
  private String userId;

  @Column(nullable = false)
  private String query;

  private String locationId;

  private String locationName;

  private String country;

  private Double latitude;

  private Double longitude;

  @Column(nullable = false, updatable = false)
  private LocalDateTime searchedAt;

  @PrePersist
  void prePersist() {
    if (id == null) {
      id = Cuid.next();
    }
    if (searchedAt == null) {
      searchedAt = Timestamps.now();
    }
  }

  public String getId() {
    return id;
  }

  public String getUserId() {
    return userId;
  }

  public void setUserId(String userId) {
    this.userId = userId;
  }

  public String getQuery() {
    return query;
  }

  public void setQuery(String query) {
    this.query = query;
  }

  public String getLocationId() {
    return locationId;
  }

  public void setLocationId(String locationId) {
    this.locationId = locationId;
  }

  public String getLocationName() {
    return locationName;
  }

  public void setLocationName(String locationName) {
    this.locationName = locationName;
  }

  public String getCountry() {
    return country;
  }

  public void setCountry(String country) {
    this.country = country;
  }

  public Double getLatitude() {
    return latitude;
  }

  public void setLatitude(Double latitude) {
    this.latitude = latitude;
  }

  public Double getLongitude() {
    return longitude;
  }

  public void setLongitude(Double longitude) {
    this.longitude = longitude;
  }

  public LocalDateTime getSearchedAt() {
    return searchedAt;
  }
}
