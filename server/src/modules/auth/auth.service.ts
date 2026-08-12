import { randomUUID } from "node:crypto";

import { handlePrismaError } from "../../common/prisma-errors.js";
import { toPublicUser } from "../../common/public-user.js";
import { ApiError } from "../../errors/api-error.js";
import { hashPassword, verifyPassword } from "../../lib/password.js";
import {
  getRefreshTokenTtlMs,
  hashToken,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../../lib/tokens.js";
import { authRepository } from "./auth.repository.js";
import type {
  LoginInput,
  RegisterInput,
  UpdateProfileInput,
} from "./auth.schemas.js";

type SessionMeta = {
  userAgent?: string;
  ipAddress?: string;
};

async function issueSession(
  userId: string,
  email: string,
  meta: SessionMeta = {},
) {
  const tokenId = randomUUID();
  const refreshToken = signRefreshToken(userId, tokenId);
  const tokenHash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + getRefreshTokenTtlMs());

  await authRepository.createRefreshToken({
    id: tokenId,
    userId,
    tokenHash,
    expiresAt,
    ...(meta.userAgent !== undefined ? { userAgent: meta.userAgent } : {}),
    ...(meta.ipAddress !== undefined ? { ipAddress: meta.ipAddress } : {}),
  });

  const accessToken = signAccessToken(userId, email);

  return { accessToken, refreshToken };
}

export const authService = {
  async register(input: RegisterInput, meta: SessionMeta = {}) {
    const existing = await authRepository.findUserByEmail(input.email);
    if (existing) {
      throw new ApiError(409, "EMAIL_IN_USE", "An account with this email already exists.");
    }

    const passwordHash = await hashPassword(input.password);

    try {
      const user = await authRepository.createUser({
        email: input.email,
        passwordHash,
        ...(input.name !== undefined ? { name: input.name } : {}),
      });

      const tokens = await issueSession(user.id, user.email, meta);
      return {
        user: toPublicUser(user),
        ...tokens,
      };
    } catch (error) {
      handlePrismaError(error);
    }
  },

  async login(input: LoginInput, meta: SessionMeta = {}) {
    const user = await authRepository.findUserByEmail(input.email);
    if (!user?.passwordHash) {
      throw new ApiError(401, "INVALID_CREDENTIALS", "Invalid email or password.");
    }

    const valid = await verifyPassword(input.password, user.passwordHash);
    if (!valid) {
      throw new ApiError(401, "INVALID_CREDENTIALS", "Invalid email or password.");
    }

    const tokens = await issueSession(user.id, user.email, meta);
    return {
      user: toPublicUser(user),
      ...tokens,
    };
  },

  async refresh(refreshToken: string, meta: SessionMeta = {}) {
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new ApiError(401, "INVALID_REFRESH_TOKEN", "Refresh token is invalid or expired.");
    }

    const stored = await authRepository.findRefreshTokenById(payload.jti);
    if (
      !stored ||
      stored.revokedAt ||
      stored.expiresAt.getTime() <= Date.now() ||
      stored.tokenHash !== hashToken(refreshToken) ||
      stored.userId !== payload.sub
    ) {
      throw new ApiError(401, "INVALID_REFRESH_TOKEN", "Refresh token is invalid or expired.");
    }

    await authRepository.revokeRefreshToken(stored.id);

    const tokens = await issueSession(stored.user.id, stored.user.email, meta);
    return {
      user: toPublicUser(stored.user),
      ...tokens,
    };
  },

  async logout(refreshToken: string | undefined) {
    if (!refreshToken) {
      return;
    }

    try {
      const payload = verifyRefreshToken(refreshToken);
      const stored = await authRepository.findRefreshTokenById(payload.jti);
      if (stored && !stored.revokedAt) {
        await authRepository.revokeRefreshToken(stored.id);
      }
    } catch {
      // Ignore invalid tokens on logout.
    }
  },

  async logoutAll(userId: string) {
    await authRepository.revokeAllUserRefreshTokens(userId);
  },

  async getProfile(userId: string) {
    const user = await authRepository.findUserById(userId);
    if (!user) {
      throw new ApiError(404, "USER_NOT_FOUND", "User was not found.");
    }
    return toPublicUser(user);
  },

  async updateProfile(userId: string, input: UpdateProfileInput) {
    try {
      const user = await authRepository.updateUser(userId, {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.avatarUrl !== undefined ? { avatarUrl: input.avatarUrl } : {}),
      });
      return toPublicUser(user);
    } catch (error) {
      handlePrismaError(error);
    }
  },
};
