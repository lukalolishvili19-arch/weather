package com.weather.security;

import java.io.IOException;
import java.util.List;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Reads {@code Authorization: Bearer <jwt>}. Failures are only recorded here; protected routes turn
 * them into 401 responses in {@link RestAuthenticationEntryPoint}, public routes ignore them.
 */
public class JwtAuthenticationFilter extends OncePerRequestFilter {

  public static final String FAILURE_ATTRIBUTE = JwtAuthenticationFilter.class.getName() + ".failure";
  private static final String BEARER = "Bearer ";

  private final JwtService jwtService;

  public JwtAuthenticationFilter(JwtService jwtService) {
    this.jwtService = jwtService;
  }

  @Override
  protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
      throws ServletException, IOException {
    String header = request.getHeader("Authorization");
    if (header != null && header.startsWith(BEARER)) {
      String token = header.substring(BEARER.length()).trim();
      if (!token.isEmpty()) {
        try {
          AuthenticatedUser user = jwtService.verifyAccessToken(token);
          SecurityContextHolder.getContext().setAuthentication(
              UsernamePasswordAuthenticationToken.authenticated(user, null, List.of()));
        } catch (JwtService.InvalidTokenException exception) {
          request.setAttribute(FAILURE_ATTRIBUTE, Boolean.TRUE);
        }
      }
    }
    chain.doFilter(request, response);
  }
}
