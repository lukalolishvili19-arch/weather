package com.weather.repository;

import java.util.List;

import com.weather.entity.SearchHistory;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SearchHistoryRepository extends JpaRepository<SearchHistory, String> {

  @Query("select s from SearchHistory s where s.userId = :userId order by s.searchedAt desc")
  List<SearchHistory> findForUser(@Param("userId") String userId, Pageable page);

  @Query("select s from SearchHistory s order by s.searchedAt desc")
  List<SearchHistory> findAllOrdered(Pageable page);

  @Modifying(clearAutomatically = true, flushAutomatically = true)
  @Query("delete from SearchHistory s where s.userId = :userId and lower(s.query) = lower(:query)")
  int deleteByQueryIgnoreCase(@Param("userId") String userId, @Param("query") String query);

  @Modifying(clearAutomatically = true, flushAutomatically = true)
  @Query("delete from SearchHistory s where s.id = :id and s.userId = :userId")
  int deleteForUser(@Param("userId") String userId, @Param("id") String id);

  @Modifying(clearAutomatically = true, flushAutomatically = true)
  @Query("delete from SearchHistory s where s.userId = :userId")
  int deleteAllForUser(@Param("userId") String userId);
}
