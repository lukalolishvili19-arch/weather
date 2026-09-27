package com.weather.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

import com.weather.support.TestProperties;

import org.junit.jupiter.api.Test;

class JwtServiceTest {

  private static final String NODE_ACCESS_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbTBsZWdhY3l1c2VyMDAwMDAwMDAwMDAxIiwiZW1haWwiOiJsZWdhY3lAZXhhbXBsZS5jb20iLCJ0eXBlIjoiYWNjZXNzIiwiaWF0IjoxNzkwNTMyMjIzLCJleHAiOjQ5NDYyOTIyMjN9.SLvNVRhQ0aEvLvA6LdiYPw0-IsRlUr8DodjQpdGvk_0";
  private static final String NODE_REFRESH_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbTBsZWdhY3l1c2VyMDAwMDAwMDAwMDAxIiwianRpIjoiN2Q2ZjNhNTItM2MxZS00ZjdlLTlkMWEtMmI4YzllMGYxYTIzIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3OTA1MzIyMjMsImV4cCI6NDk0NjI5MjIyM30.jtz1dJJPpkuUJUPscsQs7q1m7jajQbXM1w0j_sN1Pz4";
  private static final String NODE_EXPIRED_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbTBsZWdhY3l1c2VyMDAwMDAwMDAwMDAxIiwiZW1haWwiOiJsZWdhY3lAZXhhbXBsZS5jb20iLCJ0eXBlIjoiYWNjZXNzIiwiaWF0IjoxNzkwNTMyMjIzLCJleHAiOjE3OTA1MzIyMTN9.w4dGqQ6zhBGPe8L8YUsltnI6xFX-Han3TcsLilTc6Ww";

  private final JwtService jwt = new JwtService(TestProperties.create("15m"));

  @Test
  void verifiesTokensSignedByNodeJsonwebtoken() {
    AuthenticatedUser user = jwt.verifyAccessToken(NODE_ACCESS_TOKEN);
    assertThat(user.id()).isEqualTo("cm0legacyuser000000000001");
    assertThat(user.email()).isEqualTo("legacy@example.com");

    JwtService.RefreshClaims refresh = jwt.verifyRefreshToken(NODE_REFRESH_TOKEN);
    assertThat(refresh.userId()).isEqualTo("cm0legacyuser000000000001");
    assertThat(refresh.tokenId()).isEqualTo("7d6f3a52-3c1e-4f7e-9d1a-2b8c9e0f1a23");
  }

  @Test
  void rejectsExpiredTamperedAndMisusedTokens() {
    assertThatThrownBy(() -> jwt.verifyAccessToken(NODE_EXPIRED_TOKEN)).isInstanceOf(JwtService.InvalidTokenException.class);
    assertThatThrownBy(() -> jwt.verifyAccessToken(NODE_REFRESH_TOKEN)).isInstanceOf(JwtService.InvalidTokenException.class);
    assertThatThrownBy(() -> jwt.verifyRefreshToken(NODE_ACCESS_TOKEN)).isInstanceOf(JwtService.InvalidTokenException.class);
    assertThatThrownBy(() -> jwt.verifyAccessToken("garbage")).isInstanceOf(JwtService.InvalidTokenException.class);

    String[] parts = NODE_ACCESS_TOKEN.split("\\.");
    String forgedPayload = Base64.getUrlEncoder().withoutPadding().encodeToString(
        "{\"sub\":\"someone-else\",\"email\":\"x@example.com\",\"type\":\"access\",\"exp\":4946292223}"
            .getBytes(StandardCharsets.UTF_8));
    assertThatThrownBy(() -> jwt.verifyAccessToken(parts[0] + "." + forgedPayload + "." + parts[2]))
        .isInstanceOf(JwtService.InvalidTokenException.class);

    String unsigned = "eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0." + parts[1] + ".";
    assertThatThrownBy(() -> jwt.verifyAccessToken(unsigned)).isInstanceOf(JwtService.InvalidTokenException.class);
  }

  @Test
  void issuedTokensHaveNodeCompatibleClaims() {
    String access = jwt.signAccessToken("cuser", "a@example.com");
    String payload = new String(Base64.getUrlDecoder().decode(access.split("\\.")[1]), StandardCharsets.UTF_8);
    assertThat(payload).contains("\"sub\":\"cuser\"", "\"email\":\"a@example.com\"", "\"type\":\"access\"", "\"iat\":",
        "\"exp\":");
    String header = new String(Base64.getUrlDecoder().decode(access.split("\\.")[0]), StandardCharsets.UTF_8);
    assertThat(header).contains("\"alg\":\"HS256\"", "\"typ\":\"JWT\"");
    assertThat(jwt.verifyAccessToken(access).id()).isEqualTo("cuser");

    String refresh = jwt.signRefreshToken("cuser", "token-id");
    assertThat(jwt.verifyRefreshToken(refresh).tokenId()).isEqualTo("token-id");
  }

  @Test
  void hashesTokensAsSha256Hex() {
    assertThat(JwtService.hashToken("abc"))
        .isEqualTo("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  }

  @Test
  void parsesJsonwebtokenDurations() {
    assertThat(DurationParser.parse("15m").toSeconds()).isEqualTo(900);
    assertThat(DurationParser.parse("7d").toSeconds()).isEqualTo(604_800);
    assertThat(DurationParser.parse("30s").toSeconds()).isEqualTo(30);
    assertThat(DurationParser.parse("2h").toSeconds()).isEqualTo(7_200);
    assertThatThrownBy(() -> DurationParser.parse("15 minutes")).isInstanceOf(IllegalArgumentException.class);
  }
}
