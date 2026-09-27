package com.weather.service;

import java.util.List;

import com.weather.dto.LocationDtos.LocationSuggestion;

final class PopularLocations {

  static final List<LocationSuggestion> ALL = List.of(
      city("tbilisi", "Tbilisi", "Georgia", 41.7151, 44.8271, null),
      city("batumi", "Batumi", "Georgia", 41.6168, 41.6367, null),
      city("kutaisi", "Kutaisi", "Georgia", 42.2679, 42.6946, null),
      city("yerevan", "Yerevan", "Armenia", 40.1792, 44.4991, null),
      city("baku", "Baku", "Azerbaijan", 40.4093, 49.8671, null),
      city("istanbul", "Istanbul", "Turkey", 41.0082, 28.9784, null),
      city("ankara", "Ankara", "Turkey", 39.9334, 32.8597, null),
      city("london", "London", "United Kingdom", 51.5074, -0.1278, "England"),
      city("paris", "Paris", "France", 48.8566, 2.3522, null),
      city("berlin", "Berlin", "Germany", 52.52, 13.405, null),
      city("rome", "Rome", "Italy", 41.9028, 12.4964, null),
      city("madrid", "Madrid", "Spain", 40.4168, -3.7038, null),
      city("dubai", "Dubai", "United Arab Emirates", 25.2048, 55.2708, null),
      city("newyork", "New York", "United States", 40.7128, -74.006, "New York"),
      city("losangeles", "Los Angeles", "United States", 34.0522, -118.2437, "California"),
      city("tokyo", "Tokyo", "Japan", 35.6762, 139.6503, null),
      city("seoul", "Seoul", "South Korea", 37.5665, 126.978, null),
      city("singapore", "Singapore", "Singapore", 1.3521, 103.8198, null),
      city("sydney", "Sydney", "Australia", -33.8688, 151.2093, null),
      city("cairo", "Cairo", "Egypt", 30.0444, 31.2357, null),
      city("moscow", "Moscow", "Russia", 55.7558, 37.6173, null),
      city("kyiv", "Kyiv", "Ukraine", 50.4501, 30.5234, null),
      city("warsaw", "Warsaw", "Poland", 52.2297, 21.0122, null),
      city("athens", "Athens", "Greece", 37.9838, 23.7275, null));

  private PopularLocations() {
  }

  private static LocationSuggestion city(String id, String name, String country, double latitude, double longitude,
      String admin1) {
    String label = admin1 != null ? name + ", " + admin1 + ", " + country : name + ", " + country;
    return new LocationSuggestion("popular-" + id, label, name, country, admin1, latitude, longitude, "city", label);
  }
}
