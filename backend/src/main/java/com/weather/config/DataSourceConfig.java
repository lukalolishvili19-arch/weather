package com.weather.config;

import javax.sql.DataSource;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DataSourceConfig {

  @Bean
  public DataSource dataSource(AppProperties properties) {
    DatabaseUrl url = DatabaseUrl.parse(properties.databaseUrl());

    HikariConfig config = new HikariConfig();
    config.setPoolName("weather-db");
    config.setJdbcUrl(url.jdbcUrl());
    if (url.username() != null) {
      config.setUsername(url.username());
    }
    if (url.password() != null) {
      config.setPassword(url.password());
    }
    config.setMaximumPoolSize(properties.databasePoolSize());
    config.setMinimumIdle(Math.min(1, properties.databasePoolSize()));
    config.setConnectionTimeout(10_000);
    config.setIdleTimeout(120_000);
    config.setMaxLifetime(600_000);
    config.setKeepaliveTime(60_000);
    config.addDataSourceProperty("ApplicationName", "weather-api");
    return new HikariDataSource(config);
  }
}
