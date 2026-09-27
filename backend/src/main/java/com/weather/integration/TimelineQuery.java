package com.weather.integration;

import java.util.List;

public record TimelineQuery(String location, String startDate, String endDate, List<String> include,
    List<String> elements) {

  public static TimelineQuery of(String location, String... include) {
    return new TimelineQuery(location, null, null, List.of(include), List.of());
  }

  public TimelineQuery withRange(String start, String end) {
    return new TimelineQuery(location, start, end, include, elements);
  }

  public TimelineQuery withElements(String... values) {
    return new TimelineQuery(location, startDate, endDate, include, List.of(values));
  }
}
