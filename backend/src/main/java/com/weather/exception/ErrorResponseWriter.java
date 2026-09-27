package com.weather.exception;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import com.weather.config.RequestIdFilter;
import com.weather.dto.ErrorResponse;

import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;

import tools.jackson.databind.json.JsonMapper;

/** Writes error bodies from servlet filters, where controller advice does not apply. */
@Component
public class ErrorResponseWriter {

  private final JsonMapper jsonMapper;

  public ErrorResponseWriter(JsonMapper jsonMapper) {
    this.jsonMapper = jsonMapper;
  }

  public void write(HttpServletRequest request, HttpServletResponse response, int status, String code,
      String message) throws IOException {
    if (response.isCommitted()) {
      return;
    }
    response.setStatus(status);
    response.setCharacterEncoding(StandardCharsets.UTF_8.name());
    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
    ErrorResponse body = ErrorResponse.of(code, message, null, RequestIdFilter.currentId(request));
    response.getWriter().write(jsonMapper.writeValueAsString(body));
  }
}
