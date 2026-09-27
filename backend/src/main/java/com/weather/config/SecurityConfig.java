package com.weather.config;

import java.time.Clock;
import java.util.List;

import com.weather.exception.ErrorResponseWriter;
import com.weather.security.BcryptjsCompatiblePasswordEncoder;
import com.weather.security.JwtAuthenticationFilter;
import com.weather.security.JwtService;
import com.weather.security.RestAuthenticationEntryPoint;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
public class SecurityConfig {

  /**
   * Personal data. Weather and location lookups are public so the app works without an account;
   * a missing or invalid token on those routes is ignored rather than rejected.
   */
  private static final String[] PROTECTED = {
      "/api/v1/auth/profile",
      "/api/v1/users/**",
      "/api/v1/favorites/**",
      "/api/v1/search-history/**",
      "/api/v1/notifications/**",
      "/api/v1/user-settings/**",
  };

  @Bean
  public SecurityFilterChain securityFilterChain(HttpSecurity http, JwtService jwtService,
      RestAuthenticationEntryPoint entryPoint, CorsConfigurationSource corsConfigurationSource,
      RateLimitProperties rateLimits, ErrorResponseWriter errorWriter) throws Exception {
    http
        .csrf(AbstractHttpConfigurer::disable)
        .formLogin(AbstractHttpConfigurer::disable)
        .httpBasic(AbstractHttpConfigurer::disable)
        .logout(AbstractHttpConfigurer::disable)
        .requestCache(AbstractHttpConfigurer::disable)
        .headers(AbstractHttpConfigurer::disable)
        .cors(cors -> cors.configurationSource(corsConfigurationSource))
        .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .exceptionHandling(handling -> handling.authenticationEntryPoint(entryPoint))
        // Runs after CorsFilter, so 429 responses stay readable by the browser.
        .addFilterBefore(new RateLimitFilter(rateLimits, errorWriter, Clock.systemUTC()),
            UsernamePasswordAuthenticationFilter.class)
        .addFilterBefore(new JwtAuthenticationFilter(jwtService), UsernamePasswordAuthenticationFilter.class)
        .authorizeHttpRequests(auth -> auth
            .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
            .requestMatchers(PROTECTED).authenticated()
            .anyRequest().permitAll());
    return http.build();
  }

  @Bean
  public CorsConfigurationSource corsConfigurationSource(AppProperties properties) {
    CorsConfiguration config = new CorsConfiguration();
    config.setAllowedOrigins(properties.corsOriginList());
    config.setAllowCredentials(true);
    config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
    config.setAllowedHeaders(List.of("Content-Type", "Authorization", "X-Request-Id"));
    config.setExposedHeaders(List.of("X-Request-Id"));
    config.setMaxAge(86_400L);

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", config);
    return source;
  }

  @Bean
  public PasswordEncoder passwordEncoder(AppProperties properties) {
    return new BcryptjsCompatiblePasswordEncoder(properties.bcryptSaltRounds());
  }

  /** Prevents Spring Boot from creating a default in-memory user with a generated password. */
  @Bean
  public UserDetailsService userDetailsService() {
    return new InMemoryUserDetailsManager();
  }
}
