import type { CookieOptions, Response } from "express";

import { env } from "../config/env.js";
import { getRefreshTokenTtlMs } from "../lib/tokens.js";

export function refreshCookieOptions(): CookieOptions {
  // Cross-origin SPA (Vercel) + API (Render/etc.) needs SameSite=None + Secure.
  return {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: env.isProduction ? "none" : "lax",
    path: "/api/v1/auth",
    maxAge: getRefreshTokenTtlMs(),
  };
}

export function setRefreshTokenCookie(response: Response, token: string): void {
  response.cookie(env.refreshCookieName, token, refreshCookieOptions());
}

export function clearRefreshTokenCookie(response: Response): void {
  response.clearCookie(env.refreshCookieName, refreshCookieOptions());
}
