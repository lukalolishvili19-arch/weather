package com.weather.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import com.weather.dto.validation.AbsoluteUrl;
import com.weather.dto.validation.Patterns;

public final class AuthDtos {

  private AuthDtos() {
  }

  public record RegisterRequest(
      @NotNull(message = "Required")
      @Size(max = 255, message = "String must contain at most 255 character(s)")
      @Pattern(regexp = Patterns.EMAIL, flags = Pattern.Flag.CASE_INSENSITIVE, message = "Invalid email")
      String email,
      @NotNull(message = "Required")
      @Size(min = 8, message = "String must contain at least 8 character(s)")
      @Size(max = 128, message = "String must contain at most 128 character(s)")
      String password,
      @Size(min = 1, message = "String must contain at least 1 character(s)")
      @Size(max = 120, message = "String must contain at most 120 character(s)")
      String name) {

    public RegisterRequest {
      name = Patterns.trim(name);
    }
  }

  public record LoginRequest(
      @NotNull(message = "Required")
      @Size(max = 255, message = "String must contain at most 255 character(s)")
      @Pattern(regexp = Patterns.EMAIL, flags = Pattern.Flag.CASE_INSENSITIVE, message = "Invalid email")
      String email,
      @NotNull(message = "Required")
      @Size(min = 1, message = "String must contain at least 1 character(s)")
      @Size(max = 128, message = "String must contain at most 128 character(s)")
      String password) {
  }

  public static class UpdateProfileRequest extends PatchRequest {

    @Size(min = 1, message = "String must contain at least 1 character(s)")
    @Size(max = 120, message = "String must contain at most 120 character(s)")
    private String name;

    @AbsoluteUrl
    @Size(max = 2048, message = "String must contain at most 2048 character(s)")
    private String avatarUrl;

    public String getName() {
      return name;
    }

    public void setName(String name) {
      mark("name");
      this.name = Patterns.trim(name);
    }

    public String getAvatarUrl() {
      return avatarUrl;
    }

    public void setAvatarUrl(String avatarUrl) {
      mark("avatarUrl");
      this.avatarUrl = avatarUrl;
    }
  }

  public record AuthResult(PublicUser user, String accessToken, String refreshToken) {
  }
}
