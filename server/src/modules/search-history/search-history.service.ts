import { handlePrismaError } from "../../common/prisma-errors.js";
import { ApiError } from "../../errors/api-error.js";
import { usersService } from "../users/users.service.js";
import { searchHistoryRepository } from "./search-history.repository.js";
import type {
  CreateSearchHistoryInput,
  RecordSearchHistoryInput,
  UpdateSearchHistoryInput,
} from "./search-history.schemas.js";

export const searchHistoryService = {
  async list(userId?: string, limit = 50) {
    if (userId) {
      await usersService.getById(userId);
    }
    return searchHistoryRepository.findMany(userId, limit);
  },

  async listMine(userId: string, limit = 20) {
    return searchHistoryRepository.findMany(userId, limit);
  },

  async getById(id: string) {
    const entry = await searchHistoryRepository.findById(id);
    if (!entry) {
      throw new ApiError(
        404,
        "SEARCH_HISTORY_NOT_FOUND",
        `Search history ${id} was not found.`,
      );
    }
    return entry;
  },

  async create(input: CreateSearchHistoryInput) {
    await usersService.getById(input.userId);
    try {
      return await searchHistoryRepository.create(input);
    } catch (error) {
      handlePrismaError(error);
    }
  },

  async recordMine(userId: string, input: RecordSearchHistoryInput) {
    try {
      return await searchHistoryRepository.recordForUser(userId, input);
    } catch (error) {
      handlePrismaError(error);
    }
  },

  async update(id: string, input: UpdateSearchHistoryInput) {
    await this.getById(id);
    try {
      return await searchHistoryRepository.update(id, input);
    } catch (error) {
      handlePrismaError(error);
    }
  },

  async remove(id: string) {
    await this.getById(id);
    try {
      return await searchHistoryRepository.delete(id);
    } catch (error) {
      handlePrismaError(error);
    }
  },

  async removeMine(userId: string, id: string) {
    const result = await searchHistoryRepository.deleteForUser(userId, id);
    if (result.count === 0) {
      throw new ApiError(
        404,
        "SEARCH_HISTORY_NOT_FOUND",
        `Search history ${id} was not found.`,
      );
    }
  },

  async clearMine(userId: string) {
    await searchHistoryRepository.clearForUser(userId);
  },
};
