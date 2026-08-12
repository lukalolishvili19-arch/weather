import type { RequestHandler } from "express";

import { asyncHandler } from "../../common/async-handler.js";
import { sendNoContent, sendSuccess } from "../../common/http.js";
import { ApiError } from "../../errors/api-error.js";
import { favoritesService } from "./favorites.service.js";
import type {
  CreateFavoriteForUserInput,
  CreateFavoriteInput,
  PinFavoriteInput,
  UpdateFavoriteInput,
} from "./favorites.schemas.js";

function requireUserId(request: Parameters<RequestHandler>[0]): string {
  if (!request.user?.id) {
    throw new ApiError(401, "UNAUTHORIZED", "Authentication is required.");
  }
  return request.user.id;
}

export const listMyFavorites: RequestHandler = asyncHandler(async (request, response) => {
  const userId = requireUserId(request);
  const favorites = await favoritesService.listMine(userId);
  sendSuccess(response, favorites);
});

export const addMyFavorite: RequestHandler = asyncHandler(async (request, response) => {
  const userId = requireUserId(request);
  const favorite = await favoritesService.addMine(
    userId,
    request.body as CreateFavoriteForUserInput,
  );
  sendSuccess(response, favorite, 201);
});

export const pinMyFavorite: RequestHandler = asyncHandler(async (request, response) => {
  const userId = requireUserId(request);
  const body = request.body as PinFavoriteInput;
  const favorite = await favoritesService.pinMine(
    userId,
    request.params.id as string,
    body.isPinned,
  );
  sendSuccess(response, favorite);
});

export const deleteMyFavorite: RequestHandler = asyncHandler(async (request, response) => {
  const userId = requireUserId(request);
  await favoritesService.removeMine(userId, request.params.id as string);
  sendNoContent(response);
});

export const listFavorites: RequestHandler = asyncHandler(async (request, response) => {
  const userId =
    typeof request.query.userId === "string" ? request.query.userId : undefined;
  const favorites = await favoritesService.list(userId);
  sendSuccess(response, favorites);
});

export const getFavorite: RequestHandler = asyncHandler(async (request, response) => {
  const favorite = await favoritesService.getById(request.params.id as string);
  sendSuccess(response, favorite);
});

export const createFavorite: RequestHandler = asyncHandler(async (request, response) => {
  const favorite = await favoritesService.create(request.body as CreateFavoriteInput);
  sendSuccess(response, favorite, 201);
});

export const updateFavorite: RequestHandler = asyncHandler(async (request, response) => {
  const favorite = await favoritesService.update(
    request.params.id as string,
    request.body as UpdateFavoriteInput,
  );
  sendSuccess(response, favorite);
});

export const deleteFavorite: RequestHandler = asyncHandler(async (request, response) => {
  await favoritesService.remove(request.params.id as string);
  sendNoContent(response);
});
