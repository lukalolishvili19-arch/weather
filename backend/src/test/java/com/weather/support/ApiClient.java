package com.weather.support;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Map;

import tools.jackson.databind.json.JsonMapper;

/** Minimal real-HTTP client for exercising the running application. */
public final class ApiClient {

  private static final JsonMapper JSON = JsonMapper.builder().build();

  private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();
  private final String baseUrl;

  public ApiClient(int port) {
    this.baseUrl = "http://localhost:" + port;
  }

  public record Result(int status, String body, Map<String, List<String>> headers) {

    public Object json(String path) {
      return JsonPath.read(parse(), path);
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> parse() {
      return body.isEmpty() ? Map.of() : JSON.readValue(body, Map.class);
    }

    public String header(String name) {
      return headers.entrySet().stream()
          .filter(entry -> entry.getKey().equalsIgnoreCase(name))
          .flatMap(entry -> entry.getValue().stream())
          .findFirst().orElse(null);
    }

    public String errorCode() {
      return (String) json("error.code");
    }
  }

  public Request request(String method, String path) {
    return new Request(method, path);
  }

  public Result get(String path, String token) {
    return request("GET", path).token(token).send();
  }

  public Result post(String path, Object body, String token) {
    return request("POST", path).json(body).token(token).send();
  }

  public Result patch(String path, Object body, String token) {
    return request("PATCH", path).json(body).token(token).send();
  }

  public Result delete(String path, String token) {
    return request("DELETE", path).token(token).send();
  }

  public final class Request {
    private final String method;
    private final String path;
    private final HttpRequest.Builder builder;
    private HttpRequest.BodyPublisher body = HttpRequest.BodyPublishers.noBody();

    private Request(String method, String path) {
      this.method = method;
      this.path = path;
      this.builder = HttpRequest.newBuilder().timeout(Duration.ofSeconds(20));
    }

    public Request token(String token) {
      if (token != null) {
        builder.header("Authorization", "Bearer " + token);
      }
      return this;
    }

    public Request header(String name, String value) {
      builder.header(name, value);
      return this;
    }

    public Request json(Object value) {
      if (value != null) {
        return raw(value instanceof String text ? text : JSON.writeValueAsString(value), "application/json");
      }
      return this;
    }

    public Request raw(String content, String contentType) {
      builder.header("Content-Type", contentType);
      body = HttpRequest.BodyPublishers.ofString(content);
      return this;
    }

    public Result send() {
      HttpRequest request = builder.uri(URI.create(baseUrl + path)).method(method, body).build();
      try {
        HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString());
        return new Result(response.statusCode(), response.body(), response.headers().map());
      } catch (IOException exception) {
        throw new IllegalStateException(exception);
      } catch (InterruptedException exception) {
        Thread.currentThread().interrupt();
        throw new IllegalStateException(exception);
      }
    }
  }
}
