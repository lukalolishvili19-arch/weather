package com.weather.repository;

import java.time.LocalDateTime;

import com.weather.entity.RefreshToken;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, String> {

  /** Conditional revoke so two concurrent refreshes cannot both consume the same token. */
  @Modifying(clearAutomatically = true, flushAutomatically = true)
  @Query("update RefreshToken t set t.revokedAt = :now where t.id = :id and t.revokedAt is null")
  int revokeIfActive(@Param("id") String id, @Param("now") LocalDateTime now);

  @Modifying(clearAutomatically = true, flushAutomatically = true)
  @Query("update RefreshToken t set t.revokedAt = :now where t.userId = :userId and t.revokedAt is null")
  int revokeAllForUser(@Param("userId") String userId, @Param("now") LocalDateTime now);
}
