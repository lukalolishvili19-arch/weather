package com.weather.security;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class BcryptjsCompatiblePasswordEncoderTest {

  /** bcryptjs.hash("Password123!", 12) from the Node backend. */
  private static final String BCRYPTJS_HASH = "$2b$12$iQQAomKDnzjbGDg5DNWvAePRpUc7s9lFL.jgHy4WyTbIKAAFQ/ogm";

  private final BcryptjsCompatiblePasswordEncoder encoder = new BcryptjsCompatiblePasswordEncoder(10);

  @Test
  void matchesHashesProducedByBcryptjs() {
    assertThat(encoder.matches("Password123!", BCRYPTJS_HASH)).isTrue();
    assertThat(encoder.matches("Password123", BCRYPTJS_HASH)).isFalse();
    assertThat(encoder.matches("Password123!", "not-a-hash")).isFalse();
    assertThat(encoder.matches("Password123!", null)).isFalse();
  }

  @Test
  void producesVersion2bHashesWithConfiguredCost() {
    String hash = encoder.encode("S3cret-pass");
    assertThat(hash).startsWith("$2b$10$").hasSize(60);
    assertThat(encoder.matches("S3cret-pass", hash)).isTrue();
    assertThat(hash).isNotEqualTo(encoder.encode("S3cret-pass"));
  }

  @Test
  void truncatesLikeBcryptjsInsteadOfFailingOnLongPasswords() {
    String base = "a".repeat(72);
    String hash = encoder.encode(base + "tail-one");
    assertThat(encoder.matches(base + "tail-two", hash)).isTrue();
    assertThat(encoder.matches("a".repeat(71), hash)).isFalse();

    String unicode = "ა".repeat(30);
    assertThat(encoder.matches(unicode, encoder.encode(unicode))).isTrue();
  }
}
