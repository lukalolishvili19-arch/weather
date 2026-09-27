package com.weather.entity;

import java.lang.management.ManagementFactory;
import java.security.SecureRandom;
import java.util.Locale;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Collision-resistant ids in the cuid (v1) format Prisma's {@code @default(cuid())} produced:
 * {@code c + timestamp + counter + fingerprint + random}, 25 lowercase base36 characters.
 */
public final class Cuid {

  private static final int BASE = 36;
  private static final int BLOCK = 4;
  private static final long DISCRETE = (long) Math.pow(BASE, BLOCK);
  private static final SecureRandom RANDOM = new SecureRandom();
  private static final AtomicInteger COUNTER = new AtomicInteger(RANDOM.nextInt((int) DISCRETE));
  private static final String FINGERPRINT = fingerprint();

  private Cuid() {
  }

  public static String next() {
    String timestamp = Long.toString(System.currentTimeMillis(), BASE);
    String counter = pad(Long.toString(Math.floorMod(COUNTER.getAndIncrement(), DISCRETE), BASE), BLOCK);
    return "c" + timestamp + counter + FINGERPRINT + randomBlock() + randomBlock();
  }

  private static String randomBlock() {
    return pad(Long.toString(RANDOM.nextLong(DISCRETE), BASE), BLOCK);
  }

  private static String fingerprint() {
    String runtime = ManagementFactory.getRuntimeMXBean().getName();
    long pid = ProcessHandle.current().pid();
    String host = runtime.contains("@") ? runtime.substring(runtime.indexOf('@') + 1) : runtime;
    int hostSum = host.length() + BASE;
    for (char ch : host.toCharArray()) {
      hostSum += ch;
    }
    String pidPart = pad(Long.toString(pid, BASE), 2);
    String hostPart = pad(Integer.toString(hostSum, BASE), 2);
    return (pidPart.substring(pidPart.length() - 2) + hostPart.substring(hostPart.length() - 2))
        .toLowerCase(Locale.ROOT);
  }

  private static String pad(String value, int size) {
    String padded = "000000000" + value;
    return padded.substring(padded.length() - size);
  }
}
