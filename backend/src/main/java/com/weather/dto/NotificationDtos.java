package com.weather.dto;

import java.util.List;
import java.util.Map;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import com.weather.dto.validation.Patterns;
import com.weather.entity.NotificationType;

public final class NotificationDtos {

  private NotificationDtos() {
  }

  public record NotificationView(
      String id,
      String userId,
      String title,
      String body,
      NotificationType type,
      boolean read,
      Object metadata,
      String createdAt,
      String updatedAt) {
  }

  public record SyncResult(int createdCount, List<NotificationView> notifications) {
  }

  /** {@code createNotificationSchema} (POST /notifications). */
  public record CreateNotificationRequest(
      @NotNull(message = "Required")
      @Pattern(regexp = Patterns.CUID, flags = Pattern.Flag.CASE_INSENSITIVE, message = "Invalid cuid")
      String userId,
      @NotNull(message = "Required")
      @Size(min = 1, message = "String must contain at least 1 character(s)")
      @Size(max = 200, message = "String must contain at most 200 character(s)")
      String title,
      @NotNull(message = "Required")
      @Size(min = 1, message = "String must contain at least 1 character(s)")
      @Size(max = 2000, message = "String must contain at most 2000 character(s)")
      String body,
      NotificationType type,
      Boolean read,
      Map<String, Object> metadata) {

    public CreateNotificationRequest {
      title = Patterns.trim(title);
      body = Patterns.trim(body);
    }
  }

  public static class UpdateNotificationRequest extends PatchRequest {

    @Size(min = 1, message = "String must contain at least 1 character(s)")
    @Size(max = 200, message = "String must contain at most 200 character(s)")
    private String title;

    @Size(min = 1, message = "String must contain at least 1 character(s)")
    @Size(max = 2000, message = "String must contain at most 2000 character(s)")
    private String body;

    private NotificationType type;
    private Boolean read;
    private Map<String, Object> metadata;

    public String getTitle() {
      return title;
    }

    public void setTitle(String title) {
      markNonNull("title", title, "string");
      this.title = Patterns.trim(title);
    }

    public String getBody() {
      return body;
    }

    public void setBody(String body) {
      markNonNull("body", body, "string");
      this.body = Patterns.trim(body);
    }

    public NotificationType getType() {
      return type;
    }

    public void setType(NotificationType type) {
      markNonNull("type", type, "'INFO' | 'ALERT' | 'FORECAST' | 'SYSTEM'");
      this.type = type;
    }

    public Boolean getRead() {
      return read;
    }

    public void setRead(Boolean read) {
      markNonNull("read", read, "boolean");
      this.read = read;
    }

    public Map<String, Object> getMetadata() {
      return metadata;
    }

    public void setMetadata(Map<String, Object> metadata) {
      mark("metadata");
      this.metadata = metadata;
    }
  }
}
