import { ApiError } from "../errors/api-error.js";

/** Placeholder until domain services are implemented. */
export function notImplemented(feature: string): never {
  throw new ApiError(
    501,
    "NOT_IMPLEMENTED",
    `${feature} is not implemented yet.`,
  );
}
