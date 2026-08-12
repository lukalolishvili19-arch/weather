import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";

import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import { ApiError } from "../errors/api-error.js";

export const errorHandler: ErrorRequestHandler = (error, request, response, _next) => {
  if (error instanceof ZodError) {
    response.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "The request is invalid.",
        details: error.flatten(),
        requestId: request.id,
      },
    });
    return;
  }

  if (error instanceof ApiError) {
    response.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
        requestId: request.id,
      },
    });
    return;
  }

  logger.error({ error, requestId: request.id }, "Unhandled request error");

  response.status(500).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: env.isProduction ? "An unexpected error occurred." : String(error),
      requestId: request.id,
    },
  });
};
