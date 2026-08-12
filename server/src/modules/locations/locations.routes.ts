import { Router } from "express";

import { validateRequest } from "../../middleware/validate-request.js";
import {
  autocompleteLocations,
  resolveLocation,
  suggestLocations,
} from "./locations.controller.js";
import {
  autocompleteQuerySchema,
  resolveLocationSchema,
  suggestionsQuerySchema,
} from "./locations.schemas.js";

export const locationsRouter = Router();

locationsRouter.get(
  "/autocomplete",
  validateRequest(autocompleteQuerySchema, "query"),
  autocompleteLocations,
);
locationsRouter.get(
  "/suggestions",
  validateRequest(suggestionsQuerySchema, "query"),
  suggestLocations,
);
locationsRouter.post(
  "/resolve",
  validateRequest(resolveLocationSchema),
  resolveLocation,
);
