package com.weather.repository;

import java.time.LocalDateTime;
import java.util.List;

import com.weather.entity.Notification;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface NotificationRepository extends JpaRepository<Notification, String> {

  @Query("select n from Notification n where n.userId = :userId order by n.createdAt desc")
  List<Notification> findForUser(@Param("userId") String userId);

  @Query("select n from Notification n order by n.createdAt desc")
  List<Notification> findAllOrdered();

  @Query(value = "select exists(select 1 from \"notifications\" where \"userId\" = :userId "
      + "and \"metadata\" -> 'dedupeKey' = to_jsonb(cast(:dedupeKey as text)))", nativeQuery = true)
  boolean existsByDedupeKey(@Param("userId") String userId, @Param("dedupeKey") String dedupeKey);

  @Modifying(clearAutomatically = true, flushAutomatically = true)
  @Query("update Notification n set n.read = true, n.updatedAt = :now where n.userId = :userId and n.read = false")
  int markAllRead(@Param("userId") String userId, @Param("now") LocalDateTime now);

  @Modifying(clearAutomatically = true, flushAutomatically = true)
  @Query("delete from Notification n where n.userId = :userId and n.read = true")
  int deleteRead(@Param("userId") String userId);
}
