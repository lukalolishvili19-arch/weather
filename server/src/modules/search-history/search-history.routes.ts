import { Router } from "express";

import { validateRequest } from "../../middleware/validate-request.js";
import {
  clearMySearchHistory,
  createSearchHistory,
  deleteMySearchHistory,
  deleteSearchHistory,
  getSearchHistory,
  listMySearchHistory,
  listSearchHistory,
  recordMySearchHistory,
  updateSearchHistory,
} from "./search-history.controller.js";
import {
  createSearchHistorySchema,
  listSearchHistoryQuerySchema,
  recordSearchHistorySchema,
  searchHistoryIdParamsSchema,
  updateSearchHistorySchema,
} from "./search-history.schemas.js";

export const searchHistoryRouter = Router();

searchHistoryRouter.get(
  "/me",
  validateRequest(listSearchHistoryQuerySchema, "query"),
  listMySearchHistory,
);
searchHistoryRouter.post(
  "/me",
  validateRequest(recordSearchHistorySchema),
  recordMySearchHistory,
);
searchHistoryRouter.delete("/me", clearMySearchHistory);
searchHistoryRouter.delete(
  "/me/:id",
  validateRequest(searchHistoryIdParamsSchema, "params"),
  deleteMySearchHistory,
);

searchHistoryRouter.get("/", listSearchHistory);
searchHistoryRouter.post("/", validateRequest(createSearchHistorySchema), createSearchHistory);
searchHistoryRouter.get(
  "/:id",
  validateRequest(searchHistoryIdParamsSchema, "params"),
  getSearchHistory,
);
searchHistoryRouter.patch(
  "/:id",
  validateRequest(searchHistoryIdParamsSchema, "params"),
  validateRequest(updateSearchHistorySchema),
  updateSearchHistory,
);
searchHistoryRouter.delete(
  "/:id",
  validateRequest(searchHistoryIdParamsSchema, "params"),
  deleteSearchHistory,
);
