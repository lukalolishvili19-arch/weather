package com.weather.support;

import java.util.List;
import java.util.Map;

/** Dotted-path lookup into parsed JSON, e.g. {@code data.days.0.temperatureMax}. */
public final class JsonPath {

  private JsonPath() {
  }

  public static Object read(Object root, String path) {
    Object current = root;
    for (String part : path.split("\\.")) {
      if (current instanceof Map<?, ?> map) {
        if (!map.containsKey(part)) {
          throw new AssertionError("Missing key '" + part + "' in path '" + path + "': " + root);
        }
        current = map.get(part);
      } else if (current instanceof List<?> list) {
        current = list.get(Integer.parseInt(part));
      } else {
        throw new AssertionError("Cannot descend into '" + part + "' in path '" + path + "': " + root);
      }
    }
    return current;
  }
}
