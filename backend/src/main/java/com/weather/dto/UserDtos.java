package com.weather.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import com.weather.dto.validation.AbsoluteUrl;
import com.weather.dto.validation.Patterns;

public final class UserDtos {

  private UserDtos() {
  }

  public record CreateUserRequest(
      @NotNull(message = "Required")
      @Size(max = 255, message = "String must contain at most 255 character(s)")
      @Pattern(regexp = Patterns.EMAIL, flags = Pattern.Flag.CASE_INSENSITIVE, message = "Invalid email")
      String email,
      @Size(min = 1, message = "String must contain at least 1 character(s)")
      @Size(max = 120, message = "String must contain at most 120 character(s)")
      String name,
      @AbsoluteUrl
      @Size(max = 2048, message = "String must contain at most 2048 character(s)")
      String avatarUrl,
      @Size(min = 1, message = "String must contain at least 1 character(s)")
      @Size(max = 255, message = "String must contain at most 255 character(s)")
      String passwordHash) {

    public CreateUserRequest {
      name = Patterns.trim(name);
    }
  }

  public static class UpdateUserRequest extends PatchRequest {

    @Size(max = 255, message = "String must contain at most 255 character(s)")
    @Pattern(regexp = Patterns.EMAIL, flags = Pattern.Flag.CASE_INSENSITIVE, message = "Invalid email")
    private String email;

    @Size(min = 1, message = "String must contain at least 1 character(s)")
    @Size(max = 120, message = "String must contain at most 120 character(s)")
    private String name;

    @AbsoluteUrl
    @Size(max = 2048, message = "String must contain at most 2048 character(s)")
    private String avatarUrl;

    @Size(min = 1, message = "String must contain at least 1 character(s)")
    @Size(max = 255, message = "String must contain at most 255 character(s)")
    private String passwordHash;

    public String getEmail() {
      return email;
    }

    public void setEmail(String email) {
      markNonNull("email", email, "string");
      this.email = email;
    }

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

    public String getPasswordHash() {
      return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
      mark("passwordHash");
      this.passwordHash = passwordHash;
    }
  }
}
