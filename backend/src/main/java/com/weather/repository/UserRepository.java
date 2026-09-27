package com.weather.repository;

import java.util.List;
import java.util.Optional;

import com.weather.entity.User;

import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, String> {

  Optional<User> findByEmail(String email);

  List<User> findAllByOrderByCreatedAtDesc();
}
