package com.weather.security;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Arrays;

import org.springframework.security.crypto.bcrypt.BCrypt;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * bcrypt that hashes the UTF-8 bytes of the password truncated to 72 bytes, exactly as bcryptjs did.
 * Spring's BCryptPasswordEncoder rejects longer inputs, which would lock out existing accounts whose
 * passwords (up to 128 characters were accepted) exceed 72 bytes.
 */
public class BcryptjsCompatiblePasswordEncoder implements PasswordEncoder {

  private static final int MAX_BYTES = 72;

  private final int rounds;

  public BcryptjsCompatiblePasswordEncoder(int rounds) {
    this.rounds = rounds;
  }

  @Override
  public String encode(CharSequence rawPassword) {
    return BCrypt.hashpw(bytes(rawPassword), BCrypt.gensalt("$2b", rounds));
  }

  @Override
  public boolean matches(CharSequence rawPassword, String encodedPassword) {
    if (rawPassword == null || encodedPassword == null || !encodedPassword.matches("^\\$2[aby]\\$\\d{2}\\$.{53}$")) {
      return false;
    }
    try {
      String candidate = BCrypt.hashpw(bytes(rawPassword), encodedPassword);
      return MessageDigest.isEqual(candidate.getBytes(StandardCharsets.UTF_8),
          encodedPassword.getBytes(StandardCharsets.UTF_8));
    } catch (IllegalArgumentException exception) {
      return false;
    }
  }

  private static byte[] bytes(CharSequence rawPassword) {
    byte[] utf8 = rawPassword.toString().getBytes(StandardCharsets.UTF_8);
    return utf8.length > MAX_BYTES ? Arrays.copyOf(utf8, MAX_BYTES) : utf8;
  }
}
