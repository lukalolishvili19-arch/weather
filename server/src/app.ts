import { randomUUID } from "node:crypto";

import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type RequestHandler } from "express";
import helmetImport from "helmet";
import { pinoHttp } from "pino-http";

import { v1Router } from "./api/v1/router.js";
import { corsOptions } from "./config/cors.js";
import { logger } from "./config/logger.js";
import { errorHandler } from "./middleware/error-handler.js";
import { notFound } from "./middleware/not-found.js";

const helmet = helmetImport as unknown as (...args: never[]) => RequestHandler;

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", 1);

  app.use(
    pinoHttp({
      logger,
      genReqId(request, response) {
        const incomingId = request.headers["x-request-id"];
        const requestId =
          (Array.isArray(incomingId) ? incomingId[0] : incomingId) ?? randomUUID();
        response.setHeader("X-Request-Id", requestId);
        return requestId;
      },
    }),
  );
  app.use(helmet());
  app.use(cors(corsOptions));
  app.use(compression());
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: false, limit: "1mb" }));
  app.use(cookieParser());

  app.use("/api/v1", v1Router);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
