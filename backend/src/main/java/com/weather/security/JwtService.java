package com.weather.security;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.text.ParseException;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.HexFormat;
import java.util.Set;

import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JOSEObjectType;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import com.weather.config.AppProperties;

import org.springframework.stereotype.Service;

/**
 * HS256 tokens byte-compatible with the Node API ({@code jsonwebtoken} with UTF-8 string secrets),
 * so sessions issued before the migration remain valid.
 */
@Service
public class JwtService {

  public record RefreshClaims(String userId, String tokenId) {
  }

  private static final Set<JWSAlgorithm> ACCEPTED = Set.of(JWSAlgorithm.HS256, JWSAlgorithm.HS384, JWSAlgorithm.HS512);

  private final byte[] accessSecret;
  private final byte[] refreshSecret;
  private final Duration accessTtl;
  private final Duration refreshTtl;

  public JwtService(AppProperties properties) {
    this.accessSecret = properties.jwt().accessSecret().getBytes(StandardCharsets.UTF_8);
    this.refreshSecret = properties.jwt().refreshSecret().getBytes(StandardCharsets.UTF_8);
    this.accessTtl = DurationParser.parse(properties.jwt().accessExpiresIn());
    this.refreshTtl = DurationParser.parse(properties.jwt().refreshExpiresIn());
  }

  public Duration refreshTtl() {
    return refreshTtl;
  }

  public String signAccessToken(String userId, String email) {
    Instant now = Instant.now();
    JWTClaimsSet claims = new JWTClaimsSet.Builder()
        .subject(userId)
        .claim("email", email)
        .claim("type", "access")
        .issueTime(Date.from(now))
        .expirationTime(Date.from(now.plus(accessTtl)))
        .build();
    return sign(claims, accessSecret);
  }

  public String signRefreshToken(String userId, String tokenId) {
    Instant now = Instant.now();
    JWTClaimsSet claims = new JWTClaimsSet.Builder()
        .subject(userId)
        .jwtID(tokenId)
        .claim("type", "refresh")
        .issueTime(Date.from(now))
        .expirationTime(Date.from(now.plus(refreshTtl)))
        .build();
    return sign(claims, refreshSecret);
  }

  /** @throws InvalidTokenException when the signature, expiry or payload shape is invalid */
  public AuthenticatedUser verifyAccessToken(String token) {
    JWTClaimsSet claims = verify(token, accessSecret);
    String email = stringClaim(claims, "email");
    if (!"access".equals(stringClaim(claims, "type")) || isBlank(claims.getSubject()) || isBlank(email)) {
      throw new InvalidTokenException("Invalid access token payload");
    }
    return new AuthenticatedUser(claims.getSubject(), email);
  }

  public RefreshClaims verifyRefreshToken(String token) {
    JWTClaimsSet claims = verify(token, refreshSecret);
    if (!"refresh".equals(stringClaim(claims, "type")) || isBlank(claims.getSubject())
        || isBlank(claims.getJWTID())) {
      throw new InvalidTokenException("Invalid refresh token payload");
    }
    return new RefreshClaims(claims.getSubject(), claims.getJWTID());
  }

  public static String hashToken(String token) {
    try {
      byte[] digest = MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8));
      return HexFormat.of().formatHex(digest);
    } catch (NoSuchAlgorithmException exception) {
      throw new IllegalStateException(exception);
    }
  }

  private static String sign(JWTClaimsSet claims, byte[] secret) {
    try {
      SignedJWT jwt = new SignedJWT(new JWSHeader.Builder(JWSAlgorithm.HS256).type(JOSEObjectType.JWT).build(), claims);
      jwt.sign(new MACSigner(secret));
      return jwt.serialize();
    } catch (JOSEException exception) {
      throw new IllegalStateException("Unable to sign token", exception);
    }
  }

  private static JWTClaimsSet verify(String token, byte[] secret) {
    try {
      SignedJWT jwt = SignedJWT.parse(token);
      if (!ACCEPTED.contains(jwt.getHeader().getAlgorithm()) || !jwt.verify(new MACVerifier(secret))) {
        throw new InvalidTokenException("invalid signature");
      }
      JWTClaimsSet claims = jwt.getJWTClaimsSet();
      Instant now = Instant.now();
      Date expiration = claims.getExpirationTime();
      if (expiration != null && !now.isBefore(expiration.toInstant())) {
        throw new InvalidTokenException("jwt expired");
      }
      Date notBefore = claims.getNotBeforeTime();
      if (notBefore != null && now.isBefore(notBefore.toInstant())) {
        throw new InvalidTokenException("jwt not active");
      }
      return claims;
    } catch (ParseException | JOSEException | IllegalStateException exception) {
      throw new InvalidTokenException(exception.getMessage());
    }
  }

  private static String stringClaim(JWTClaimsSet claims, String name) {
    Object value = claims.getClaim(name);
    return value instanceof String text ? text : null;
  }

  private static boolean isBlank(String value) {
    return value == null || value.isEmpty();
  }

  public static class InvalidTokenException extends RuntimeException {
    public InvalidTokenException(String message) {
      super(message);
    }
  }
}
