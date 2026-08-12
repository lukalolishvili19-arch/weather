import { handlePrismaError } from "../../common/prisma-errors.js";
import { ApiError } from "../../errors/api-error.js";
import { usersService } from "../users/users.service.js";
import { userSettingsRepository } from "./user-settings.repository.js";
import type {
  CreateUserSettingsInput,
  UpdateUserSettingsInput,
} from "./user-settings.schemas.js";

export const userSettingsService = {
  async list() {
    return userSettingsRepository.findMany();
  },

  async getById(id: string) {
    const settings = await userSettingsRepository.findById(id);
    if (!settings) {
      throw new ApiError(
        404,
        "USER_SETTINGS_NOT_FOUND",
        `User settings ${id} were not found.`,
      );
    }
    return settings;
  },

  async getByUserId(userId: string) {
    await usersService.getById(userId);
    const settings = await userSettingsRepository.findByUserId(userId);
    if (!settings) {
      throw new ApiError(
        404,
        "USER_SETTINGS_NOT_FOUND",
        `User settings for user ${userId} were not found.`,
      );
    }
    return settings;
  },

  async getOrCreateByUserId(userId: string) {
    await usersService.getById(userId);
    const existing = await userSettingsRepository.findByUserId(userId);
    if (existing) return existing;

    try {
      return await userSettingsRepository.create({ userId });
    } catch (error) {
      handlePrismaError(error);
    }
  },

  async updateByUserId(userId: string, input: UpdateUserSettingsInput) {
    const settings = await this.getOrCreateByUserId(userId);
    try {
      return await userSettingsRepository.update(settings.id, input);
    } catch (error) {
      handlePrismaError(error);
    }
  },

  async create(input: CreateUserSettingsInput) {
    await usersService.getById(input.userId);
    try {
      return await userSettingsRepository.create(input);
    } catch (error) {
      handlePrismaError(error);
    }
  },

  async update(id: string, input: UpdateUserSettingsInput) {
    await this.getById(id);
    try {
      return await userSettingsRepository.update(id, input);
    } catch (error) {
      handlePrismaError(error);
    }
  },

  async remove(id: string) {
    await this.getById(id);
    try {
      return await userSettingsRepository.delete(id);
    } catch (error) {
      handlePrismaError(error);
    }
  },
};
