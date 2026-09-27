package com.weather.repository;

import java.util.List;
import java.util.Optional;

import com.weather.entity.Favorite;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface FavoriteRepository extends JpaRepository<Favorite, String> {

  @Query("select f from Favorite f where f.userId = :userId order by f.isPinned desc, f.createdAt desc")
  List<Favorite> findForUser(@Param("userId") String userId);

  @Query("select f from Favorite f order by f.isPinned desc, f.createdAt desc")
  List<Favorite> findAllOrdered();

  Optional<Favorite> findByIdAndUserId(String id, String userId);

  Optional<Favorite> findByUserIdAndLocationId(String userId, String locationId);

  @Modifying(clearAutomatically = true, flushAutomatically = true)
  @Query("delete from Favorite f where f.id = :id and f.userId = :userId")
  int deleteForUser(@Param("userId") String userId, @Param("id") String id);
}
