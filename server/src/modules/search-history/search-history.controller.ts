import type { RequestHandler } from "express";

import { asyncHandler } from "../../common/async-handler.js";
import { sendNoContent, sendSuccess } from "../../common/http.js";
import { ApiError } from "../../errors/api-error.js";
import { searchHistoryService } from "./search-history.service.js";
import type {
  CreateSearchHistoryInput,
  RecordSearchHistoryInput,
  UpdateSearchHistoryInput,
} from "./search-history.schemas.js";

function requireUserId(request: Parameters<RequestHandler>[0]): string {
  if (!request.user?.id) {
    throw new ApiError(401, "UNAUTHORIZED", "Authentication is required.");
  }
  return request.user.id;
}

export const listMySearchHistory: RequestHandler = asyncHandler(async (request, response) => {
  const userId = requireUserId(request);
  const limit =
    typeof request.query.limit === "string" ? Number(request.query.limit) : 20;
  const entries = await searchHistoryService.listMine(
    userId,
    Number.isFinite(limit) ? limit : 20,
  );
  sendSuccess(response, entries);
});

export const recordMySearchHistory: RequestHandler = asyncHandler(async (request, response) => {
  const userId = requireUserId(request);
  const entry = await searchHistoryService.recordMine(
    userId,
    request.body as RecordSearchHistoryInput,
  );
  sendSuccess(response, entry, 201);
});

export const clearMySearchHistory: RequestHandler = asyncHandler(async (request, response) => {
  const userId = requireUserId(request);
  await searchHistoryService.clearMine(userId);
  sendNoContent(response);
});

export const deleteMySearchHistory: RequestHandler = asyncHandler(async (request, response) => {
  const userId = requireUserId(request);
  await searchHistoryService.removeMine(userId, request.params.id as string);
  sendNoContent(response);
});

export const listSearchHistory: RequestHandler = asyncHandler(async (request, response) => {
  const userId =
    typeof request.query.userId === "string" ? request.query.userId : undefined;
  const entries = await searchHistoryService.list(userId);
  sendSuccess(response, entries);
});

export const getSearchHistory: RequestHandler = asyncHandler(async (request, response) => {
  const entry = await searchHistoryService.getById(request.params.id as string);
  sendSuccess(response, entry);
});

export const createSearchHistory: RequestHandler = asyncHandler(async (request, response) => {
  const entry = await searchHistoryService.create(
    request.body as CreateSearchHistoryInput,
  );
  sendSuccess(response, entry, 201);
});

export const updateSearchHistory: RequestHandler = asyncHandler(async (request, response) => {
  const entry = await searchHistoryService.update(
    request.params.id as string,
    request.body as UpdateSearchHistoryInput,
  );
  sendSuccess(response, entry);
});

export const deleteSearchHistory: RequestHandler = asyncHandler(async (request, response) => {
  await searchHistoryService.remove(request.params.id as string);
  sendNoContent(response);
});
