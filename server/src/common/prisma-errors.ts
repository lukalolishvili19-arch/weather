import { Prisma } from "@prisma/client";

import { ApiError } from "../errors/api-error.js";

export function handlePrismaError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      throw new ApiError(409, "CONFLICT", "A record with this unique value already exists.", {
        target: error.meta?.["target"],
      });
    }

    if (error.code === "P2025") {
      throw new ApiError(404, "NOT_FOUND", "The requested record was not found.");
    }

    if (error.code === "P2003") {
      throw new ApiError(400, "FOREIGN_KEY_CONSTRAINT", "Related record does not exist.", {
        field: error.meta?.["field_name"],
      });
    }
  }

  throw error;
}
