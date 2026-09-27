package com.weather.config;

import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Converts the libpq/Prisma style {@code DATABASE_URL} (postgresql://user:pass@host:port/db?...)
 * into a JDBC URL plus credentials. {@code jdbc:postgresql://} URLs are passed through.
 */
public record DatabaseUrl(String jdbcUrl, String username, String password) {

  /** Prisma-only query parameters that pgjdbc does not understand. */
  private static final List<String> DROPPED_PARAMS =
      List.of("pgbouncer", "connection_limit", "pool_timeout", "connect_timeout", "statement_cache_size",
          "channel_binding", "socket_timeout");

  private static final Map<String, String> RENAMED_PARAMS = Map.of("schema", "currentSchema");

  public static DatabaseUrl parse(String rawUrl) {
    String url = rawUrl == null ? "" : rawUrl.trim();
    if (url.startsWith("jdbc:")) {
      return new DatabaseUrl(url, null, null);
    }
    if (!url.startsWith("postgres://") && !url.startsWith("postgresql://")) {
      throw new IllegalArgumentException("DATABASE_URL must start with postgresql://, postgres:// or jdbc:postgresql://");
    }

    URI uri = URI.create(url.replaceFirst("^postgres(ql)?://", "http://"));
    String username = null;
    String password = null;
    String userInfo = uri.getRawUserInfo();
    if (userInfo != null && !userInfo.isEmpty()) {
      int colon = userInfo.indexOf(':');
      username = decode(colon >= 0 ? userInfo.substring(0, colon) : userInfo);
      password = colon >= 0 ? decode(userInfo.substring(colon + 1)) : null;
    }

    StringBuilder jdbc = new StringBuilder("jdbc:postgresql://").append(uri.getHost());
    if (uri.getPort() > 0) {
      jdbc.append(':').append(uri.getPort());
    }
    String path = uri.getRawPath();
    jdbc.append(path == null || path.isEmpty() ? "/" : path);

    List<String> params = new ArrayList<>();
    String query = uri.getRawQuery();
    if (query != null && !query.isEmpty()) {
      for (String pair : query.split("&")) {
        if (pair.isEmpty()) {
          continue;
        }
        int eq = pair.indexOf('=');
        String key = eq >= 0 ? pair.substring(0, eq) : pair;
        String value = eq >= 0 ? pair.substring(eq + 1) : "";
        if (DROPPED_PARAMS.contains(key)) {
          continue;
        }
        params.add(RENAMED_PARAMS.getOrDefault(key, key) + "=" + value);
      }
    }
    if (!params.isEmpty()) {
      jdbc.append('?').append(String.join("&", params));
    }
    return new DatabaseUrl(jdbc.toString(), username, password);
  }

  private static String decode(String value) {
    return URLDecoder.decode(value.replace("+", "%2B"), StandardCharsets.UTF_8);
  }

  @Override
  public String toString() {
    return "DatabaseUrl[jdbcUrl=" + jdbcUrl + ", username=" + username + ", password=***]";
  }
}
