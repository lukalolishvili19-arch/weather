import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { ZodTypeAny } from "zod";

type RequestSlice = "body" | "params" | "query";

function assignRequestSlice(request: Request, slice: RequestSlice, value: unknown) {
  // Express 5 exposes `query` (and sometimes `params`) as getter-only on IncomingMessage.
  // Replace the property on the request instance instead of assigning to the getter.
  if (slice === "body") {
    request.body = value;
    return;
  }

  Object.defineProperty(request, slice, {
    value,
    writable: true,
    configurable: true,
    enumerable: true,
  });
}

export function validateRequest(
  schema: ZodTypeAny,
  slice: RequestSlice = "body",
): RequestHandler {
  return (request: Request, _response: Response, next: NextFunction) => {
    const parsed = schema.parse(request[slice]);
    assignRequestSlice(request, slice, parsed);
    next();
  };
}
