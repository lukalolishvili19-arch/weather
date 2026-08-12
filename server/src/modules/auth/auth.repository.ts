import { prisma } from "../../lib/prisma.js";

export const authRepository = {
  findUserByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { settings: true },
    });
  },

  findUserById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: { settings: true },
    });
  },

  createUser(data: {
    email: string;
    passwordHash: string;
    name?: string;
  }) {
    return prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        passwordHash: data.passwordHash,
        ...(data.name !== undefined ? { name: data.name } : {}),
        settings: { create: {} },
      },
      include: { settings: true },
    });
  },

  updateUser(
    id: string,
    data: {
      name?: string | null;
      avatarUrl?: string | null;
    },
  ) {
    return prisma.user.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.avatarUrl !== undefined ? { avatarUrl: data.avatarUrl } : {}),
      },
      include: { settings: true },
    });
  },

  createRefreshToken(data: {
    id: string;
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    userAgent?: string;
    ipAddress?: string;
  }) {
    return prisma.refreshToken.create({
      data: {
        id: data.id,
        userId: data.userId,
        tokenHash: data.tokenHash,
        expiresAt: data.expiresAt,
        ...(data.userAgent !== undefined ? { userAgent: data.userAgent } : {}),
        ...(data.ipAddress !== undefined ? { ipAddress: data.ipAddress } : {}),
      },
    });
  },

  findRefreshTokenById(id: string) {
    return prisma.refreshToken.findUnique({
      where: { id },
      include: { user: { include: { settings: true } } },
    });
  },

  revokeRefreshToken(id: string) {
    return prisma.refreshToken.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
  },

  revokeAllUserRefreshTokens(userId: string) {
    return prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  },
};
