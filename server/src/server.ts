import type { Server } from "node:http";

import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { prisma } from "./lib/prisma.js";

const app = createApp();

const server: Server = app.listen(env.port, () => {
  logger.info({ port: env.port }, "Weather API is listening");
});

let isShuttingDown = false;

async function shutdown(signal: NodeJS.Signals) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.info({ signal }, "Graceful shutdown started");

  const forceExitTimer = setTimeout(() => {
    logger.error("Graceful shutdown timed out");
    process.exit(1);
  }, 10_000);
  forceExitTimer.unref();

  server.close(async (error) => {
    if (error) {
      logger.error({ error }, "HTTP server failed to close");
      process.exitCode = 1;
    }

    await prisma.$disconnect();
    clearTimeout(forceExitTimer);
    logger.info("Graceful shutdown completed");
    process.exit();
  });
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));

process.on("uncaughtException", (error) => {
  logger.fatal({ error }, "Uncaught exception");
  void shutdown("SIGTERM");
});

process.on("unhandledRejection", (reason) => {
  logger.fatal({ reason }, "Unhandled promise rejection");
  void shutdown("SIGTERM");
});
