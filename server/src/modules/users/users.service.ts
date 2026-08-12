import { handlePrismaError } from "../../common/prisma-errors.js";
import { toPublicUser } from "../../common/public-user.js";
import { ApiError } from "../../errors/api-error.js";
import { usersRepository } from "./users.repository.js";
import type { CreateUserInput, UpdateUserInput } from "./users.schemas.js";

export const usersService = {
  async list() {
    const users = await usersRepository.findMany();
    return users.map(toPublicUser);
  },

  async getById(id: string) {
    const user = await usersRepository.findById(id);
    if (!user) {
      throw new ApiError(404, "USER_NOT_FOUND", `User ${id} was not found.`);
    }
    return toPublicUser(user);
  },

  async create(input: CreateUserInput) {
    try {
      const user = await usersRepository.create(input);
      return toPublicUser(user);
    } catch (error) {
      handlePrismaError(error);
    }
  },

  async update(id: string, input: UpdateUserInput) {
    await this.getById(id);
    try {
      const user = await usersRepository.update(id, input);
      return toPublicUser(user);
    } catch (error) {
      handlePrismaError(error);
    }
  },

  async remove(id: string) {
    await this.getById(id);
    try {
      return await usersRepository.delete(id);
    } catch (error) {
      handlePrismaError(error);
    }
  },
};
