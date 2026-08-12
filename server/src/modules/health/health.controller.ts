import type { RequestHandler } from "express";

import { sendSuccess } from "../../common/http.js";
import { env } from "../../config/env.js";

export const getHealth: RequestHandler = (_request, response) => {
  sendSuccess(response, {
    status: "ok",
    service: "weather-api",
    environment: env.nodeEnv,
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
};
