import { Router } from "express";

import { validateRequest } from "../../middleware/validate-request.js";
import {
  addMyFavorite,
  createFavorite,
  deleteFavorite,
  deleteMyFavorite,
  getFavorite,
  listFavorites,
  listMyFavorites,
  pinMyFavorite,
  updateFavorite,
} from "./favorites.controller.js";
import {
  createFavoriteForUserSchema,
  createFavoriteSchema,
  favoriteIdParamsSchema,
  pinFavoriteSchema,
  updateFavoriteSchema,
} from "./favorites.schemas.js";

export const favoritesRouter = Router();

favoritesRouter.get("/me", listMyFavorites);
favoritesRouter.post("/me", validateRequest(createFavoriteForUserSchema), addMyFavorite);
favoritesRouter.patch(
  "/me/:id/pin",
  validateRequest(favoriteIdParamsSchema, "params"),
  validateRequest(pinFavoriteSchema),
  pinMyFavorite,
);
favoritesRouter.delete(
  "/me/:id",
  validateRequest(favoriteIdParamsSchema, "params"),
  deleteMyFavorite,
);

favoritesRouter.get("/", listFavorites);
favoritesRouter.post("/", validateRequest(createFavoriteSchema), createFavorite);
favoritesRouter.get("/:id", validateRequest(favoriteIdParamsSchema, "params"), getFavorite);
favoritesRouter.patch(
  "/:id",
  validateRequest(favoriteIdParamsSchema, "params"),
  validateRequest(updateFavoriteSchema),
  updateFavorite,
);
favoritesRouter.delete(
  "/:id",
  validateRequest(favoriteIdParamsSchema, "params"),
  deleteFavorite,
);
