import type { RequestHandler } from "express";

import { asyncHandler } from "../../common/async-handler.js";
import { sendSuccess } from "../../common/http.js";
import { locationsService } from "./locations.service.js";
import type {
  AutocompleteQuery,
  ResolveLocationInput,
  SuggestionsQuery,
} from "./locations.schemas.js";

export const autocompleteLocations: RequestHandler = asyncHandler(async (request, response) => {
  const data = await locationsService.autocomplete(
    request.query as unknown as AutocompleteQuery,
  );
  sendSuccess(response, data);
});

export const suggestLocations: RequestHandler = asyncHandler(async (request, response) => {
  const data = await locationsService.suggestions(
    request.query as unknown as SuggestionsQuery,
  );
  sendSuccess(response, data);
});

export const resolveLocation: RequestHandler = asyncHandler(async (request, response) => {
  const data = await locationsService.resolve(request.body as ResolveLocationInput);
  sendSuccess(response, data);
});
