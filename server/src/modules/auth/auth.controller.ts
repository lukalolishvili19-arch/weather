import type { RequestHandler } from "express";

import { asyncHandler } from "../../common/async-handler.js";
import { sendSuccess } from "../../common/http.js";
import { env } from "../../config/env.js";
import { ApiError } from "../../errors/api-error.js";
import { clearRefreshTokenCookie, setRefreshTokenCookie } from "../../lib/cookies.js";
import { authService } from "./auth.service.js";
import type {
  LoginInput,
  RegisterInput,
  UpdateProfileInput,
} from "./auth.schemas.js";

function getRequestMeta(request: Parameters<RequestHandler>[0]) {
  const userAgentHeader = request.headers["user-agent"];
  const userAgent = Array.isArray(userAgentHeader) ? userAgentHeader[0] : userAgentHeader;
  const ipAddress = request.ip;

  return {
    ...(userAgent ? { userAgent } : {}),
    ...(ipAddress ? { ipAddress } : {}),
  };
}

function readRefreshToken(request: Parameters<RequestHandler>[0]): string | undefined {
  const cookieToken = request.cookies?.[env.refreshCookieName];
  if (typeof cookieToken === "string" && cookieToken.length > 0) {
    return cookieToken;
  }

  const bodyToken =
    request.body && typeof request.body === "object"
      ? (request.body as { refreshToken?: unknown }).refreshToken
      : undefined;

  return typeof bodyToken === "string" && bodyToken.length > 0 ? bodyToken : undefined;
}

export const register: RequestHandler = asyncHandler(async (request, response) => {
  const result = await authService.register(
    request.body as RegisterInput,
    getRequestMeta(request),
  );
  setRefreshTokenCookie(response, result.refreshToken);
  sendSuccess(
    response,
    {
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    },
    201,
  );
});

export const login: RequestHandler = asyncHandler(async (request, response) => {
  const result = await authService.login(request.body as LoginInput, getRequestMeta(request));
  setRefreshTokenCookie(response, result.refreshToken);
  sendSuccess(response, {
    user: result.user,
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
  });
});

export const refresh: RequestHandler = asyncHandler(async (request, response) => {
  const refreshToken = readRefreshToken(request);
  if (!refreshToken) {
    throw new ApiError(401, "REFRESH_TOKEN_REQUIRED", "Refresh token is required.");
  }

  const result = await authService.refresh(refreshToken, getRequestMeta(request));
  setRefreshTokenCookie(response, result.refreshToken);
  sendSuccess(response, {
    user: result.user,
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
  });
});

export const logout: RequestHandler = asyncHandler(async (request, response) => {
  const refreshToken = readRefreshToken(request);
  await authService.logout(refreshToken);
  clearRefreshTokenCookie(response);
  sendSuccess(response, { success: true });
});

export const getProfile: RequestHandler = asyncHandler(async (request, response) => {
  if (!request.user) {
    throw new ApiError(401, "UNAUTHORIZED", "Authentication is required.");
  }
  const user = await authService.getProfile(request.user.id);
  sendSuccess(response, user);
});

export const updateProfile: RequestHandler = asyncHandler(async (request, response) => {
  if (!request.user) {
    throw new ApiError(401, "UNAUTHORIZED", "Authentication is required.");
  }
  const user = await authService.updateProfile(
    request.user.id,
    request.body as UpdateProfileInput,
  );
  sendSuccess(response, user);
});
