import { createHash, randomBytes } from "node:crypto";

import jwt from "jsonwebtoken";

import { env } from "../config/env.js";

export type AccessTokenPayload = {
  sub: string;
  email: string;
  type: "access";
};

export type RefreshTokenPayload = {
  sub: string;
  jti: string;
  type: "refresh";
};

function parseDurationToMs(value: string): number {
  const match = /^(\d+)([smhd])$/i.exec(value.trim());
  if (!match) {
    throw new Error(`Invalid duration format: ${value}`);
  }

  const amount = Number(match[1]);
  const unit = match[2]?.toLowerCase();

  switch (unit) {
    case "s":
      return amount * 1000;
    case "m":
      return amount * 60_000;
    case "h":
      return amount * 3_600_000;
    case "d":
      return amount * 86_400_000;
    default:
      throw new Error(`Unsupported duration unit: ${unit}`);
  }
}

export function getRefreshTokenTtlMs(): number {
  return parseDurationToMs(env.jwtRefreshExpiresIn);
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function generateOpaqueToken(): string {
  return randomBytes(48).toString("base64url");
}

export function signAccessToken(userId: string, email: string): string {
  const payload: AccessTokenPayload = {
    sub: userId,
    email,
    type: "access",
  };

  return jwt.sign(payload, env.jwtAccessSecret, {
    expiresIn: env.jwtAccessExpiresIn,
  } as jwt.SignOptions);
}

export function signRefreshToken(userId: string, tokenId: string): string {
  const payload: RefreshTokenPayload = {
    sub: userId,
    jti: tokenId,
    type: "refresh",
  };

  return jwt.sign(payload, env.jwtRefreshSecret, {
    expiresIn: env.jwtRefreshExpiresIn,
  } as jwt.SignOptions);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const payload = jwt.verify(token, env.jwtAccessSecret) as AccessTokenPayload;
  if (payload.type !== "access" || !payload.sub || !payload.email) {
    throw new Error("Invalid access token payload");
  }
  return payload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  const payload = jwt.verify(token, env.jwtRefreshSecret) as RefreshTokenPayload;
  if (payload.type !== "refresh" || !payload.sub || !payload.jti) {
    throw new Error("Invalid refresh token payload");
  }
  return payload;
}
