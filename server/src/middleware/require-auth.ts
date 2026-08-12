import type { RequestHandler } from "express";

import { ApiError } from "../errors/api-error.js";
import { verifyAccessToken } from "../lib/tokens.js";

export const requireAuth: RequestHandler = (request, _response, next) => {
  const header = request.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    next(new ApiError(401, "UNAUTHORIZED", "Authentication is required."));
    return;
  }

  const token = header.slice("Bearer ".length).trim();
  if (!token) {
    next(new ApiError(401, "UNAUTHORIZED", "Authentication is required."));
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    request.user = {
      id: payload.sub,
      email: payload.email,
    };
    next();
  } catch {
    next(new ApiError(401, "INVALID_ACCESS_TOKEN", "Access token is invalid or expired."));
  }
};
