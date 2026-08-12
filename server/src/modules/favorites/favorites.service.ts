import { handlePrismaError } from "../../common/prisma-errors.js";
import { ApiError } from "../../errors/api-error.js";
import { usersService } from "../users/users.service.js";
import { favoritesRepository } from "./favorites.repository.js";
import type {
  CreateFavoriteForUserInput,
  CreateFavoriteInput,
  UpdateFavoriteInput,
} from "./favorites.schemas.js";

export const favoritesService = {
  async list(userId?: string) {
    if (userId) {
      await usersService.getById(userId);
    }
    return favoritesRepository.findMany(userId);
  },

  async listMine(userId: string) {
    return favoritesRepository.findMany(userId);
  },

  async getById(id: string) {
    const favorite = await favoritesRepository.findById(id);
    if (!favorite) {
      throw new ApiError(404, "FAVORITE_NOT_FOUND", `Favorite ${id} was not found.`);
    }
    return favorite;
  },

  async getMineById(userId: string, id: string) {
    const favorite = await favoritesRepository.findByUserAndId(userId, id);
    if (!favorite) {
      throw new ApiError(404, "FAVORITE_NOT_FOUND", `Favorite ${id} was not found.`);
    }
    return favorite;
  },

  async create(input: CreateFavoriteInput) {
    await usersService.getById(input.userId);
    try {
      return await favoritesRepository.create(input);
    } catch (error) {
      handlePrismaError(error);
    }
  },

  async addMine(userId: string, input: CreateFavoriteForUserInput) {
    const existing = await favoritesRepository.findByUserAndLocation(
      userId,
      input.locationId,
    );
    if (existing) {
      throw new ApiError(409, "FAVORITE_EXISTS", "This location is already in your favorites.");
    }

    try {
      return await favoritesRepository.createForUser(userId, input);
    } catch (error) {
      handlePrismaError(error);
    }
  },

  async update(id: string, input: UpdateFavoriteInput) {
    await this.getById(id);
    try {
      return await favoritesRepository.update(id, input);
    } catch (error) {
      handlePrismaError(error);
    }
  },

  async pinMine(userId: string, id: string, isPinned: boolean) {
    await this.getMineById(userId, id);
    try {
      return await favoritesRepository.setPinned(id, isPinned);
    } catch (error) {
      handlePrismaError(error);
    }
  },

  async remove(id: string) {
    await this.getById(id);
    try {
      return await favoritesRepository.delete(id);
    } catch (error) {
      handlePrismaError(error);
    }
  },

  async removeMine(userId: string, id: string) {
    const result = await favoritesRepository.deleteForUser(userId, id);
    if (result.count === 0) {
      throw new ApiError(404, "FAVORITE_NOT_FOUND", `Favorite ${id} was not found.`);
    }
  },
};
