package com.weather.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "refresh_tokens")
public class RefreshToken {

  @Id
  private String id;

  @Column(nullable = false)
  private String userId;

  @Column(nullable = false)
  private String tokenHash;

  @Column(nullable = false)
  private LocalDateTime expiresAt;

  private LocalDateTime revokedAt;

  @Column(nullable = false, updatable = false)
  private LocalDateTime createdAt;

  private String userAgent;

  private String ipAddress;

  protected RefreshToken() {
  }

  public RefreshToken(String id, String userId, String tokenHash, LocalDateTime expiresAt, String userAgent,
      String ipAddress) {
    this.id = id;
    this.userId = userId;
    this.tokenHash = tokenHash;
    this.expiresAt = expiresAt;
    this.userAgent = userAgent;
    this.ipAddress = ipAddress;
  }

  @PrePersist
  void prePersist() {
    if (createdAt == null) {
      createdAt = Timestamps.now();
    }
  }

  public String getId() {
    return id;
  }

  public String getUserId() {
    return userId;
  }

  public String getTokenHash() {
    return tokenHash;
  }

  public LocalDateTime getExpiresAt() {
    return expiresAt;
  }

  public LocalDateTime getRevokedAt() {
    return revokedAt;
  }
}
