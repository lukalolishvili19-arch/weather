package com.weather.integration;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.StringJoiner;

import com.weather.config.AppProperties;

import org.springframework.stereotype.Component;

import tools.jackson.databind.json.JsonMapper;

@Component
public class UpstreamHttp {

  public record Response(int status, String body) {
    public boolean ok() {
      return status >= 200 && status < 300;
    }
  }

  private final HttpClient client;
  private final Duration readTimeout;
  private final JsonMapper jsonMapper;

  public UpstreamHttp(AppProperties properties, JsonMapper jsonMapper) {
    this.readTimeout = properties.weather().readTimeout();
    this.jsonMapper = jsonMapper;
    this.client = HttpClient.newBuilder()
        .connectTimeout(properties.weather().connectTimeout())
        .followRedirects(HttpClient.Redirect.NORMAL)
        .build();
  }

  /** @throws IOException on network failures and timeouts */
  public Response get(String url, Map<String, String> headers) throws IOException {
    HttpRequest.Builder request = HttpRequest.newBuilder(URI.create(url)).timeout(readTimeout).GET();
    headers.forEach(request::header);
    try {
      HttpResponse<String> response = client.send(request.build(),
          HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
      return new Response(response.statusCode(), response.body());
    } catch (InterruptedException exception) {
      Thread.currentThread().interrupt();
      throw new IOException("Request interrupted", exception);
    }
  }

  public Map<String, Object> parseObject(String body) {
    Map<String, Object> parsed = Json.obj(jsonMapper.readValue(body, Object.class));
    if (parsed == null) {
      throw new IllegalArgumentException("Expected a JSON object");
    }
    return parsed;
  }

  public static String query(Map<String, String> params) {
    StringJoiner joiner = new StringJoiner("&");
    params.forEach((key, value) -> joiner.add(encode(key) + "=" + encode(value)));
    return joiner.toString();
  }

  /** {@code encodeURIComponent} equivalent for path segments. */
  public static String encodePathSegment(String value) {
    return URLEncoder.encode(value, StandardCharsets.UTF_8).replace("+", "%20");
  }

  public static Map<String, String> params() {
    return new LinkedHashMap<>();
  }

  private static String encode(String value) {
    return URLEncoder.encode(value, StandardCharsets.UTF_8);
  }
}
