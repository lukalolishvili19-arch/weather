import type { RequestHandler } from "express";

import { ApiError } from "../errors/api-error.js";

export const notFound: RequestHandler = (request, _response, next) => {
  next(
    new ApiError(
      404,
      "ROUTE_NOT_FOUND",
      `Route ${request.method} ${request.originalUrl} was not found.`,
    ),
  );
};
