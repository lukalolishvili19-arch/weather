import type { Prisma } from "@prisma/client";

import { prisma } from "../../lib/prisma.js";
import type { CreateUserInput, UpdateUserInput } from "./users.schemas.js";

export const usersRepository = {
  findMany() {
    return prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: { settings: true },
    });
  },

  findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: { settings: true },
    });
  },

  create(data: CreateUserInput) {
    return prisma.user.create({
      data: {
        email: data.email,
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.avatarUrl !== undefined ? { avatarUrl: data.avatarUrl } : {}),
        ...(data.passwordHash !== undefined ? { passwordHash: data.passwordHash } : {}),
        settings: {
          create: {},
        },
      },
      include: { settings: true },
    });
  },

  update(id: string, data: UpdateUserInput) {
    const payload: Prisma.UserUpdateInput = {};

    if (data.email !== undefined) payload.email = data.email;
    if (data.name !== undefined) payload.name = data.name;
    if (data.avatarUrl !== undefined) payload.avatarUrl = data.avatarUrl;
    if (data.passwordHash !== undefined) payload.passwordHash = data.passwordHash;

    return prisma.user.update({
      where: { id },
      data: payload,
      include: { settings: true },
    });
  },

  delete(id: string) {
    return prisma.user.delete({
      where: { id },
    });
  },
};
